/**
 * domain/training/DeterministicTrainingGenerator.js
 * 
 * Gerador Determinístico de Contingência do NutriAx Pro.
 * Ativado automaticamente quando a IA generativa (Gemini) estiver indisponível
 * (HTTP 503, HTTP 429, timeout, offline ou erro de quota).
 * 
 * Conecta o perfil clínico do paciente, a Base Interna de Treinamento
 * (InternalTrainingDatabase), os 18 motores de modalidade (ModalityEngineRegistry),
 * os serviços de Equipamentos (EquipmentService), Recuperação (RecoveryEngine)
 * e Progressão (ProgressionEngine).
 * 
 * Camada de Domínio Puro — Sem dependência de DOM, Dexie ou Firebase.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./ModalityCatalog'),
      require('./EquipmentService'),
      require('./RecoveryEngine'),
      require('./ProgressionEngine'),
      require('./ModalityEngineRegistry'),
      require('./InternalTrainingDatabase'),
      require('../contracts/TrainingPrescriptionDTO')
    );
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.DeterministicTrainingGenerator = factory(
      root.NutriDomain.ModalityCatalog,
      root.NutriDomain.EquipmentService,
      root.NutriDomain.RecoveryEngine,
      root.NutriDomain.ProgressionEngine,
      root.NutriDomain.ModalityEngineRegistry,
      root.NutriDomain.InternalTrainingDatabase,
      root.NutriDomain.TrainingPrescriptionDTO
    );
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (
  ModalityCatalog,
  EquipmentService,
  RecoveryEngine,
  ProgressionEngine,
  ModalityEngineRegistry,
  InternalTrainingDatabase,
  TrainingPrescriptionDTOModule
) {
  'use strict';

  // Helper para obter validador do DTO mesmo em ambientes com caminhos variáveis
  const validateDTO = (typeof TrainingPrescriptionDTOModule?.validateTrainingPrescriptionDTO === 'function')
    ? TrainingPrescriptionDTOModule.validateTrainingPrescriptionDTO
    : (typeof globalThis?.validateTrainingPrescriptionDTO === 'function'
      ? globalThis.validateTrainingPrescriptionDTO
      : (dto) => ({ isValid: !!(dto && dto.patientId && dto.split && Array.isArray(dto.routines) && dto.routines.length > 0), errors: [] }));

  /**
   * Constrói a distribuição dos 7 dias da semana para uma prescrição de contingência
   * @param {string} splitKey 
   * @param {Array<Object>} routines 
   * @returns {Array<Object>} 7 dias estruturados
   */
  function buildDeterministicWeeklySchedule(splitKey, routines = []) {
    const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const count = routines.length;

    if (count === 1) {
      return daysOfWeek.map((day, idx) => ({
        day,
        type: idx === 1 ? 'Treino' : 'Descanso',
        routineId: idx === 1 ? routines[0].id : null,
        title: idx === 1 ? routines[0].name : 'Recuperação Ativa'
      }));
    }

    if (count === 2) {
      // Terça e Quinta ou Segunda e Quinta
      return daysOfWeek.map((day, idx) => {
        if (idx === 0) return { day, type: 'Treino', routineId: routines[0].id, title: routines[0].name };
        if (idx === 3) return { day, type: 'Treino', routineId: routines[1].id, title: routines[1].name };
        return { day, type: 'Descanso', routineId: null, title: 'Recuperação Ativa' };
      });
    }

    if (count === 3) {
      // Seg, Qua, Sex
      return daysOfWeek.map((day, idx) => {
        if (idx === 0) return { day, type: 'Treino', routineId: routines[0].id, title: routines[0].name };
        if (idx === 2) return { day, type: 'Treino', routineId: routines[1].id, title: routines[1].name };
        if (idx === 4) return { day, type: 'Treino', routineId: routines[2].id, title: routines[2].name };
        return { day, type: 'Descanso', routineId: null, title: 'Recuperação Ativa' };
      });
    }

    if (count === 4) {
      // Seg, Ter, Qui, Sex
      return daysOfWeek.map((day, idx) => {
        if (idx === 0) return { day, type: 'Treino', routineId: routines[0].id, title: routines[0].name };
        if (idx === 1) return { day, type: 'Treino', routineId: routines[1].id, title: routines[1].name };
        if (idx === 3) return { day, type: 'Treino', routineId: routines[2].id, title: routines[2].name };
        if (idx === 4) return { day, type: 'Treino', routineId: routines[3].id, title: routines[3].name };
        return { day, type: 'Descanso', routineId: null, title: 'Recuperação Ativa' };
      });
    }

    if (count >= 5) {
      return daysOfWeek.map((day, idx) => {
        if (idx < count) {
          const r = routines[idx];
          return { day, type: 'Treino', routineId: r.id, title: r.name };
        }
        return { day, type: 'Descanso', routineId: null, title: 'Recuperação Ativa' };
      });
    }

    return daysOfWeek.map(day => ({ day, type: 'Descanso', routineId: null, title: 'Recuperação' }));
  }

  /**
   * Executa a geração determinística de contingência para o paciente
   * 
   * @param {Object} context - PerformanceContext ou registro de paciente
   * @param {Object} [options] - Parâmetros adicionais e opções de controle
   * @returns {Object} { status: 'PASS'|'WARNING'|'REJECT', prescription, context, warnings, errors }
   */
  function generate(context = {}, options = {}) {
    const warnings = [];
    const errors = [];

    // 1. Extração segura dos dados do paciente
    const patientId = String(
      options.patientId ||
      context._meta?.patientId ||
      context.patient?.id ||
      context.patientId ||
      'paciente_contingencia'
    ).trim();

    const rawModality = options.modalityId ||
      context.modalityId ||
      context.patient?.modalityId ||
      context.mainModality ||
      context.trainingGoal ||
      context.preferredSplit ||
      context.targetSplit ||
      context.split ||
      context.trainingProfile?.mainModality ||
      context.patient?.workoutType ||
      context.patient?.mainModality ||
      'musculacao_forca';

    const canonicalModalityId = ModalityCatalog.resolveModalityId(rawModality) || ModalityCatalog.MODALITY_IDS.STRENGTH;
    const modalityMetadata = ModalityCatalog.getModalityMetadata(canonicalModalityId);

    // Frequência semanal
    const rawFreq = options.frequency ||
      context.frequency ||
      context.trainingProfile?.frequencyWeekly ||
      context.patient?.workoutFrequency ||
      modalityMetadata?.defaultWeeklyFrequency ||
      3;
    const weeklyFreq = Math.max(1, Math.min(7, parseInt(rawFreq, 10) || 3));

    // Duração por sessão
    const sessionDurationMinutes = Number(
      options.durationMinutes ||
      context.trainingProfile?.durationMinutes ||
      context.patient?.workoutDurationMinutes ||
      50
    );

    // Equipamentos disponíveis
    const availableEquipment = options.availableEquipment ||
      context.constraints?.availableEquipment ||
      context.patient?.availableEquipment ||
      [];

    // Lesões / restrições
    const injuries = options.injuries ||
      context.constraints?.injuries ||
      context.patient?.injuries ||
      [];

    const prohibitedExercises = options.prohibitedExercises ||
      context.constraints?.prohibitedExercises ||
      [];

    const experienceLevel = String(
      options.experienceLevel ||
      context.patient?.trainingLevel ||
      'Intermediário'
    ).toLowerCase();

    // 2. Consulta à Base Interna de Treinamento
    const eligibleExercises = InternalTrainingDatabase.filterEligibleExercises({
      modalityId: canonicalModalityId,
      availableEquipment,
      injuries,
      prohibitedExercises,
      experienceLevel
    });

    if (eligibleExercises.length === 0) {
      warnings.push(`Nenhum exercício estritamente compatível no catálogo interno para a modalidade "${canonicalModalityId}" com as restrições fornecidas. Acionando adaptação biomecânica geral.`);
    }

    // 3. Montagem do Contexto Enriquecido para o Motor Específico
    const enrichedEngineContext = {
      ...context,
      patientId,
      modalityId: canonicalModalityId,
      metadata: modalityMetadata,
      eligibleExercises,
      constraints: {
        ...(context.constraints || {}),
        availableEquipment,
        injuries,
        prohibitedExercises
      },
      trainingProfile: {
        ...(context.trainingProfile || {}),
        frequencyWeekly: weeklyFreq,
        durationMinutes: sessionDurationMinutes,
        mainModality: canonicalModalityId
      }
    };

    // 4. Despacho para o Motor Canônico da Modalidade via ModalityEngineRegistry
    let rawPrescription = null;
    try {
      rawPrescription = ModalityEngineRegistry.generatePrescription(
        canonicalModalityId,
        enrichedEngineContext,
        {
          ...options,
          frequency: weeklyFreq,
          sessionDurationMinutes
        }
      );
    } catch (engineErr) {
      console.error(`[DeterministicTrainingGenerator] Erro no motor "${canonicalModalityId}":`, engineErr);
      errors.push(`Falha na execução do motor de modalidade "${canonicalModalityId}": ${engineErr.message || engineErr}`);
      return {
        status: 'REJECT',
        fatal: true,
        prescription: null,
        context: enrichedEngineContext,
        warnings,
        errors
      };
    }

    // 5. Normalização Rigorosa das Rotinas e Métricas Nativas
    const rawRoutines = Array.isArray(rawPrescription?.routines) ? rawPrescription.routines : [];
    if (rawRoutines.length === 0) {
      errors.push(`Motor "${canonicalModalityId}" retornou 0 rotinas de treino.`);
      return {
        status: 'REJECT',
        fatal: true,
        prescription: null,
        context: enrichedEngineContext,
        warnings,
        errors
      };
    }

    const normalizedRoutines = rawRoutines.map((routine, rIdx) => {
      const routineId = routine.id || String.fromCharCode(65 + rIdx); // A, B, C...
      const routineName = String(routine.routineName || routine.name || `Treino ${routineId}`).trim();
      const rawExercises = Array.isArray(routine.exercises) ? routine.exercises : [];

      const normalizedExercises = rawExercises.map((ex, eIdx) => {
        const exName = String(ex.exerciseName || ex.name || `Exercício ${eIdx + 1}`).trim();
        const sets = Number.isInteger(Number(ex.sets)) && Number(ex.sets) >= 1 ? Number(ex.sets) : 3;
        const reps = ex.reps != null ? String(ex.reps).trim() : '8-12';
        const rpe = (ex.rpe != null && !isNaN(Number(ex.rpe))) ? Number(ex.rpe) : 7.5;
        const restSeconds = (ex.restSeconds != null && !isNaN(Number(ex.restSeconds)))
          ? Math.round(Number(ex.restSeconds))
          : (ex.rest != null && !isNaN(Number(ex.rest)) ? Math.round(Number(ex.rest)) : 60);

        // Preserva integralmente todas as métricas nativas da modalidade
        const cleanExercise = {
          ...ex,
          exerciseId: ex.exerciseId || `ex_${canonicalModalityId}_${rIdx}_${eIdx}`,
          exerciseName: exName,
          name: exName,
          sets,
          reps,
          rpe,
          restSeconds,
          rest: restSeconds,
          obs: ex.obs || ex.notes || ''
        };

        return cleanExercise;
      });

      return {
        ...routine,
        id: routineId,
        routineId,
        name: routineName,
        routineName,
        exercises: normalizedExercises
      };
    });

    // 6. Resolução do Split Canônico e Montagem da Semana
    const resolvedSplit = rawPrescription.split ||
      modalityMetadata?.defaultSplit ||
      (canonicalModalityId === ModalityCatalog.MODALITY_IDS.SEDENTARY ? 'Sedentario_Adaptacao' : 'PPL');

    const weeklySchedule = buildDeterministicWeeklySchedule(resolvedSplit, normalizedRoutines);

    // 7. Avaliação Biomecânica de Recuperação (RecoveryEngine)
    try {
      const recoveryEval = RecoveryEngine.evaluateWeeklyRecoveryDistribution(weeklySchedule);
      if (recoveryEval.hasConflicts && Array.isArray(recoveryEval.warnings)) {
        recoveryEval.warnings.forEach(w => warnings.push(w));
      }
    } catch (recErr) {
      console.warn('[DeterministicTrainingGenerator] Aviso na checagem de recuperação:', recErr);
    }

    // 8. Aplicação de Progressão Histórica se houver registros reais de execução
    const historyLogs = context.historyLogs || context.executionHistory || context.historicalLogs || options.historyLogs || [];
    let progressionApplied = false;
    if (Array.isArray(historyLogs) && historyLogs.length > 0) {
      try {
        normalizedRoutines.forEach(routine => {
          routine.exercises.forEach(exercise => {
            const exerciseHistory = historyLogs.filter(h => 
              h.exerciseName === exercise.exerciseName || 
              h.exerciseId === exercise.exerciseId ||
              h.exerciseId === exercise.id ||
              (exercise.exerciseName && h.exerciseName && exercise.exerciseName.toLowerCase().includes(h.exerciseName.toLowerCase())) ||
              (h.exerciseId && exercise.exerciseId && h.exerciseId.includes(exercise.exerciseId))
            );
            if (exerciseHistory.length > 0) {
              const progResult = ProgressionEngine.calculateProgression(canonicalModalityId, exercise, exerciseHistory);
              if (progResult && progResult.decision === 'PROGRESS') {
                if (progResult.suggestedSets) exercise.sets = progResult.suggestedSets;
                if (progResult.suggestedLoadKg != null) {
                  exercise.loadKg = progResult.suggestedLoadKg;
                  exercise.weightKg = progResult.suggestedLoadKg;
                }
                if (progResult.suggestedReps) exercise.reps = progResult.suggestedReps;
                exercise.progressionRationale = progResult.rationale;
                exercise.progressed = true;
                progressionApplied = true;
              } else if (progResult && progResult.decision === 'REDUCE') {
                if (progResult.suggestedSets) exercise.sets = progResult.suggestedSets;
                exercise.progressionRationale = progResult.rationale;
                exercise.progressed = true;
                progressionApplied = true;
              }
            }
          });
        });
      } catch (progErr) {
        console.warn('[DeterministicTrainingGenerator] Aviso ao calcular progressão:', progErr);
      }
    }

    // 9. Construção do Objeto Final da Prescrição com Metadados de Auditoria
    const prescription = {
      patientId,
      split: resolvedSplit,
      splitSource: 'DETERMINISTIC',
      frequency: normalizedRoutines.length,
      routines: normalizedRoutines,
      weeklySchedule,
      modalityId: canonicalModalityId,
      modalityName: modalityMetadata?.name || canonicalModalityId,
      category: modalityMetadata?.category || 'Prescrição',
      primaryMetrics: modalityMetadata?.primaryMetrics || [],
      sessionStructure: modalityMetadata?.sessionStructure || 'series_repeticoes',
      metadata: {
        generator: 'LOCAL_CONTINGENCY',
        isContingency: true,
        contingencyReason: options.fallbackReason || 'AUTOMATIC_CONTINGENCY_FAILOVER',
        catalogVersion: InternalTrainingDatabase.VERSION,
        catalogRevision: InternalTrainingDatabase.REVISION_DATE,
        engineId: canonicalModalityId,
        engineName: modalityMetadata?.name || canonicalModalityId,
        generatedAt: new Date().toISOString(),
        progressionApplied,
        clinicalSafetyPassed: true
      },
      _meta: {
        generator: 'LOCAL_CONTINGENCY',
        isContingency: true,
        catalogVersion: InternalTrainingDatabase.VERSION,
        catalogRevision: InternalTrainingDatabase.REVISION_DATE,
        engineId: canonicalModalityId,
        engineName: modalityMetadata?.name || canonicalModalityId,
        generatedAt: new Date().toISOString(),
        fallbackReason: options.fallbackReason || 'AUTOMATIC_CONTINGENCY_FAILOVER',
        progressionApplied,
        clinicalSafetyPassed: true
      }
    };

    // 10. Validação Estrutural Rigorosa contra o DTO Canônico
    const validationResult = validateDTO(prescription);
    if (!validationResult.isValid) {
      errors.push(...(validationResult.errors || ['Prescrição gerada violou o contrato canônico do DTO.']));
      return {
        status: 'REJECT',
        fatal: true,
        prescription: null,
        context: enrichedEngineContext,
        warnings,
        errors
      };
    }

    const finalStatus = warnings.length > 0 ? 'WARNING' : 'PASS';

    return {
      status: finalStatus,
      prescription,
      context: enrichedEngineContext,
      warnings,
      errors: []
    };
  }

  function generatePrescription(modalityId, patientContext = {}, options = {}) {
    let resolvedModality = modalityId;
    let resolvedContext = patientContext;
    if (typeof modalityId === 'object' && (!patientContext || Object.keys(patientContext).length === 0)) {
      resolvedContext = modalityId;
      resolvedModality = modalityId.modalityId || modalityId.mainModality || 'HYPERTROPHY';
    }
    const mergedContext = {
      ...(resolvedContext || {}),
      mainModality: resolvedModality,
      modalityId: resolvedModality,
      patientId: resolvedContext?.patientId || 'anonymous_patient'
    };
    const res = generate(mergedContext, options);
    return res.prescription;
  }

  return {
    generate,
    generatePrescription,
    buildDeterministicWeeklySchedule
  };
});
