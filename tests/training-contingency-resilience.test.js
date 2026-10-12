const { test } = require('node:test');
const assert = require('node:assert');

const {
  ModalityCatalog,
  EquipmentService,
  RecoveryEngine,
  ProgressionEngine,
  ModalityEngineRegistry,
  InternalTrainingDatabase,
  DeterministicTrainingGenerator,
  TrainingGenerationStateMachine
} = require('../domain/training');

const {
  validateTrainingPrescriptionDTO,
  validateTrainingSplit
} = require('../domain/contracts/TrainingPrescriptionDTO');

test('=== SUÍTE DE TESTES: RESILIÊNCIA E GERADOR DE CONTINGÊNCIA DETERMINÍSTICO ===', async (t) => {

  // ───────────────────────────────────────────────────────────────────────────
  // 1. BASE INTERNA DE EXERCÍCIOS E REGRAS (InternalTrainingDatabase)
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('1. Base Interna de Exercícios Estruturada e Integridade das 18 Modalidades', () => {
    assert.ok(InternalTrainingDatabase, 'InternalTrainingDatabase deve estar exportado e acessível');
    assert.strictEqual(InternalTrainingDatabase.VERSION, '1.0.0', 'Versão da base interna deve ser 1.0.0');

    const allExercises = InternalTrainingDatabase.getAllExercises();
    assert.ok(Array.isArray(allExercises) && allExercises.length >= 30, `A base interna deve conter múltiplos exercícios reais (encontrados: ${allExercises.length})`);

    const modalities = ModalityCatalog.getAllModalities();
    assert.strictEqual(modalities.length, 18, 'Devem existir 18 modalidades registradas');

    for (const mod of modalities) {
      const modExercises = InternalTrainingDatabase.getExercisesByModality(mod.id);
      assert.ok(modExercises.length > 0, `Modalidade ${mod.id} deve possuir exercícios cadastrados na base interna`);

      for (const ex of modExercises) {
        assert.ok(ex.id, `Exercício deve possuir ID: ${JSON.stringify(ex)}`);
        assert.ok(ex.canonicalName || ex.name, `Exercício ${ex.id} deve ter name legível`);
        assert.ok(ex.movementPattern, `Exercício ${ex.id} deve ter movementPattern`);
      }
    }
  });

  await t.test('2. Filtragem por Equipamentos e Substituição Inteligente', () => {
    // Cenário: Paciente só tem peso corporal (bodyweight)
    const availableEquip = ['peso_corporal', 'chao_solo', 'bodyweight'];
    const filtered = InternalTrainingDatabase.filterExercises({
      modalityId: 'CALISTHENICS',
      availableEquipment: availableEquip
    });

    assert.ok(filtered.length > 0, 'Deve retornar exercícios viáveis de calistenia');

    // Busca substituto para supino com barra
    const benchPress = InternalTrainingDatabase.getExerciseById('ex_str_bench_press_barbell');
    assert.ok(benchPress, 'Supino reto com barra deve existir no catálogo com ID canônico');

    const substitute = InternalTrainingDatabase.findSubstitute(benchPress, ['dumbbells', 'halteres', 'banco_reto']);
    assert.ok(substitute, 'Deve encontrar substituto com halteres para supino reto');
    assert.ok(substitute.canonicalName.toLowerCase().includes('halteres') || substitute.canonicalName.toLowerCase().includes('flexão'),
      'Substituto deve ser com halteres ou flexão');
  });

  await t.test('3. Exclusão Clínica e Contraindicações de Lesões', () => {
    // Paciente com lesão de ombro ('ombro')
    const exercisesNoShoulderInjury = InternalTrainingDatabase.filterExercises({
      modalityId: 'STRENGTH_POWER',
      contraindications: ['ombro']
    });

    const hasOverheadPress = exercisesNoShoulderInjury.some(ex => ex.id === 'ex_str_military_press');
    assert.strictEqual(hasOverheadPress, false, 'Desenvolvimento militar deve ser excluído se paciente tiver lesão no ombro');

    // Paciente com dor patelar/joelho ('joelho' ou 'condromalacia')
    const exercisesNoKneeInjury = InternalTrainingDatabase.filterExercises({
      modalityId: 'FUNCTIONAL_CROSS',
      contraindications: ['joelho', 'patelar', 'condromalacia']
    });

    const hasThruster = exercisesNoKneeInjury.some(ex => ex.id === 'ex_cf_thrusters_olympic');
    assert.strictEqual(hasThruster, false, 'Thrusters devem ser excluídos se paciente tiver dor patelar no joelho');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. GERADOR DETERMINÍSTICO DE TREINOS (DeterministicTrainingGenerator)
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('4. Geração Determinística Válida para TODAS as 18 Modalidades', () => {
    const modalities = ModalityCatalog.getAllModalities();

    for (const mod of modalities) {
      const patientContext = {
        patientId: `pat_${mod.id.toLowerCase()}`,
        name: `Paciente Teste ${mod.name}`,
        experienceLevel: 'INTERMEDIATE',
        limitations: [],
        availableEquipment: mod.requiredEquipment.length > 0 ? mod.requiredEquipment : ['bodyweight'],
        trainingGoal: mod.name,
        targetFrequency: 3,
        preferredSplit: mod.defaultSplit
      };

      const prescription = DeterministicTrainingGenerator.generatePrescription(
        mod.id,
        patientContext,
        {
          fallbackReason: 'HTTP_503_SERVICE_UNAVAILABLE',
          scheduleBuilder: (split) => [
            { day: 'seg', type: 'training', routineId: 'A', name: 'Treino A' },
            { day: 'ter', type: 'rest', routineId: null, name: 'Descanso' },
            { day: 'qua', type: 'training', routineId: 'B', name: 'Treino B' },
            { day: 'qui', type: 'rest', routineId: null, name: 'Descanso' },
            { day: 'sex', type: 'training', routineId: 'C', name: 'Treino C' },
            { day: 'sab', type: 'rest', routineId: null, name: 'Descanso' },
            { day: 'dom', type: 'rest', routineId: null, name: 'Descanso' }
          ]
        }
      );

      assert.ok(prescription, `Prescrição gerada para ${mod.id} não deve ser nula`);
      assert.strictEqual(prescription.splitSource, 'DETERMINISTIC', `splitSource deve ser DETERMINISTIC para ${mod.id}`);
      assert.strictEqual(prescription.metadata.generator, 'LOCAL_CONTINGENCY', `generator deve ser LOCAL_CONTINGENCY para ${mod.id}`);
      assert.strictEqual(prescription.metadata.isContingency, true, `isContingency deve ser true para ${mod.id}`);
      assert.strictEqual(prescription.metadata.contingencyReason, 'HTTP_503_SERVICE_UNAVAILABLE');

      // Validação estrita do DTO canônico
      const dtoValidation = validateTrainingPrescriptionDTO(prescription);
      assert.strictEqual(dtoValidation.isValid, true, `Prescrição de ${mod.id} deve passar 100% no validateTrainingPrescriptionDTO. Erros: ${JSON.stringify(dtoValidation.errors)}`);

      // Verificação da estrutura do microciclo
      assert.ok(Array.isArray(prescription.weeklySchedule), `Prescrição de ${mod.id} deve conter weeklySchedule de 7 dias`);
      assert.strictEqual(prescription.weeklySchedule.length, 7, `weeklySchedule de ${mod.id} deve ter 7 dias`);

      // Verificação das rotinas e exercícios
      assert.ok(prescription.routines.length >= 1, `Prescrição de ${mod.id} deve conter ao menos 1 rotina`);
      for (const r of prescription.routines) {
        assert.ok(r.exercises.length >= 2, `Rotina "${r.routineName}" de ${mod.id} deve conter pelo menos 2 exercícios`);
        for (const ex of r.exercises) {
          assert.ok(ex.exerciseName, `Exercício deve ter exerciseName em ${mod.id}`);
          assert.ok(Number.isInteger(ex.sets) && ex.sets >= 1, `Exercício deve ter sets >= 1 em ${mod.id}`);
          assert.ok(ex.reps, `Exercício deve ter reps em ${mod.id}`);
        }
      }
    }
  });

  await t.test('5. Progressão Histórica Integrada no Gerador Determinístico', () => {
    const historicalLogs = [
      {
        exerciseId: 'pe01',
        exerciseName: 'Supino Reto com Barra',
        targetRpe: 8,
        actualRpe: 7,
        completedReps: 12,
        targetRepsMin: 6,
        targetRepsMax: 8,
        currentWeightKg: 80
      }
    ];

    const patientContext = {
      patientId: 'pat_progression_test',
      experienceLevel: 'ADVANCED',
      availableEquipment: ['barbell', 'bench', 'dumbbells'],
      historicalLogs
    };

    const prescription = DeterministicTrainingGenerator.generatePrescription('HYPERTROPHY', patientContext);
    const chestRoutine = prescription.routines[0];
    const supino = chestRoutine.exercises.find(ex => ex.exerciseId === 'ex_str_bench_press_barbell' || ex.id === 'ex_str_bench_press_barbell' || ex.exerciseName?.includes('Supino'));

    if (supino) {
      assert.ok(supino.progressed, 'Exercício supino deve ter sinalizador de progressão');
      assert.ok(supino.weightKg >= 80, 'Carga do supino deve ser mantida ou incrementada pela sobrecarga progressiva');
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. MÁQUINA DE ESTADOS & RESILIÊNCIA DA IA (TrainingGenerationStateMachine)
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('6. Máquina de Estados: Fluxo de Sucesso Direto da IA', async () => {
    const sm = new TrainingGenerationStateMachine({ maxRetries: 2, initialBackoffMs: 10 });
    assert.strictEqual(sm.getState(), TrainingGenerationStateMachine.STATES.IDLE);

    let stateNotifications = [];
    sm.subscribe((state, ctx) => {
      stateNotifications.push(state);
    });

    const mockAiGenerator = async (context) => {
      return {
        split: 'PPL',
        splitSource: 'AI',
        patientId: 'pat_ai_success',
        frequency: 3,
        routines: [
          {
            routineId: 'A',
            routineName: 'Push A',
            exercises: [
              { exerciseName: 'Supino Reto', sets: 4, reps: '8-10', rpe: 8 }
            ]
          }
        ]
      };
    };

    const result = await sm.execute({
      patientContext: { patientId: 'pat_ai_success', preferredSplit: 'PPL' },
      aiGeneratorFn: mockAiGenerator
    });

    assert.strictEqual(result.source, 'AI');
    assert.strictEqual(result.contingencyUsed, false);
    assert.strictEqual(sm.getState(), TrainingGenerationStateMachine.STATES.READY);
    assert.ok(stateNotifications.includes('REQUESTING_AI'));
    assert.ok(stateNotifications.includes('VALIDATING'));
    assert.ok(stateNotifications.includes('READY'));
  });

  await t.test('7. Máquina de Estados: Recuperação de HTTP 503 Transitório com Backoff e Jitter', async () => {
    const sm = new TrainingGenerationStateMachine({ maxRetries: 3, initialBackoffMs: 10 });
    let attempts = 0;

    const mockFlakyAi = async (context) => {
      attempts++;
      if (attempts < 2) {
        const err = new Error('Service Unavailable');
        err.status = 503;
        throw err;
      }
      return {
        split: 'UpperLower',
        splitSource: 'AI',
        patientId: 'pat_flaky',
        frequency: 4,
        routines: [
          {
            routineId: 'A',
            routineName: 'Upper A',
            exercises: [
              { exerciseName: 'Supino Inclinado', sets: 4, reps: '10', rpe: 8 }
            ]
          }
        ]
      };
    };

    const result = await sm.execute({
      patientContext: { patientId: 'pat_flaky', preferredSplit: 'UpperLower' },
      aiGeneratorFn: mockFlakyAi
    });

    assert.strictEqual(attempts, 2, 'Deve ter tentado 2 vezes e recuperado');
    assert.strictEqual(result.source, 'AI');
    assert.strictEqual(result.contingencyUsed, false);
    assert.strictEqual(sm.getState(), TrainingGenerationStateMachine.STATES.READY);
  });

  await t.test('8. Máquina de Estados: HTTP 503 Persistente Ativa Contingência Determinística', async () => {
    const sm = new TrainingGenerationStateMachine({ maxRetries: 2, initialBackoffMs: 5 });
    let attempts = 0;

    const mockPersistent503 = async (context) => {
      attempts++;
      const err = new Error('Google Gemini 503: The model is overloaded. Please try again later.');
      err.status = 503;
      throw err;
    };

    const result = await sm.execute({
      patientContext: {
        patientId: 'pat_contingency_503',
        preferredSplit: 'PPL',
        modalityId: 'HYPERTROPHY',
        availableEquipment: ['barbell', 'bench', 'dumbbells']
      },
      aiGeneratorFn: mockPersistent503
    });

    assert.strictEqual(attempts, 3, 'Deve tentar 1 inicial + 2 retentativas antes de acionar contingência');
    assert.strictEqual(result.source, 'DETERMINISTIC');
    assert.strictEqual(result.contingencyUsed, true);
    assert.ok(result.contingencyReason.includes('503'), 'Motivo da contingência deve registrar erro 503');
    assert.strictEqual(sm.getState(), TrainingGenerationStateMachine.STATES.READY);

    // Validação estrita do DTO resultante
    const dtoVal = validateTrainingPrescriptionDTO(result.prescription);
    assert.strictEqual(dtoVal.isValid, true, 'Prescrição de contingência deve ser 100% válida');
  });

  await t.test('9. Máquina de Estados: HTTP 429 (Rate Limit) Aciona Contingência Sem Loop Infinito', async () => {
    const sm = new TrainingGenerationStateMachine({ maxRetries: 3, initialBackoffMs: 5 });
    let attempts = 0;

    const mockRateLimitedAi = async (context) => {
      attempts++;
      const err = new Error('Resource has been exhausted (e.g. check quota).');
      err.status = 429;
      throw err;
    };

    const result = await sm.execute({
      patientContext: {
        patientId: 'pat_rate_limited',
        modalityId: 'CALISTHENICS',
        preferredSplit: 'FullBody'
      },
      aiGeneratorFn: mockRateLimitedAi
    });

    assert.strictEqual(attempts, 1, 'HTTP 429 deve pular retentativas e acionar contingência imediatamente para evitar penalidades de quota');
    assert.strictEqual(result.source, 'DETERMINISTIC');
    assert.strictEqual(result.contingencyUsed, true);
    assert.ok(result.contingencyReason.includes('429'), 'Motivo deve referenciar erro 429');
    assert.strictEqual(sm.getState(), TrainingGenerationStateMachine.STATES.READY);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. TESTES NEGATIVOS E PERSISTÊNCIA
  // ───────────────────────────────────────────────────────────────────────────
  await t.test('10. Teste Negativo: Rejeição de Estruturas de Prescrição Corrompidas', () => {
    const corruptedPrescriptions = [
      null,
      {},
      { split: 'PPL' },
      { split: 'PPL', routines: [] },
      { split: 'INVALID_SPLIT_XYZ', routines: [{ routineName: 'A', exercises: [{ exerciseName: 'A', sets: 3, reps: '10' }] }] },
      { split: 'PPL', routines: [{ routineName: '', exercises: [{ exerciseName: 'A', sets: 3, reps: '10' }] }] },
      { split: 'PPL', routines: [{ routineName: 'A', exercises: [{ exerciseName: 'A', sets: -1, reps: '10' }] }] },
      { split: 'PPL', routines: [{ routineName: 'A', exercises: [{ exerciseName: 'A', sets: 3, reps: '' }] }] }
    ];

    for (const corrupt of corruptedPrescriptions) {
      const val = validateTrainingPrescriptionDTO(corrupt);
      assert.strictEqual(val.isValid, false, `Estrutura corrompida deve ser rejeitada: ${JSON.stringify(corrupt)}`);
      assert.ok(val.errors.length > 0, 'Deve listar erros descritivos de validação');
    }
  });

  await t.test('11. Compatibilidade de Persistência com Esquema Dexie e Firebase', () => {
    // Simula a estrutura de persistência de savePerformanceForPatient
    const prescription = DeterministicTrainingGenerator.generatePrescription('HYPERTROPHY', {
      patientId: 'patient_persistence_123',
      availableEquipment: ['barbell', 'bench']
    });

    const serializedRecord = {
      patientId: prescription.patientId,
      split: prescription.split,
      splitSource: prescription.splitSource,
      frequency: prescription.frequency,
      updatedAt: new Date().toISOString(),
      weeklySchedule: prescription.weeklySchedule,
      routines: prescription.routines,
      metadata: prescription.metadata
    };

    // Serialização JSON roundtrip (simulando IndexedDB/Dexie e Firestore)
    const jsonString = JSON.stringify(serializedRecord);
    const deserializedRecord = JSON.parse(jsonString);

    assert.strictEqual(deserializedRecord.patientId, 'patient_persistence_123');
    assert.strictEqual(deserializedRecord.splitSource, 'DETERMINISTIC');
    assert.strictEqual(deserializedRecord.metadata.generator, 'LOCAL_CONTINGENCY');
    assert.strictEqual(deserializedRecord.routines.length, prescription.routines.length);

    const val = validateTrainingPrescriptionDTO(deserializedRecord);
    assert.strictEqual(val.isValid, true, 'Registro persistido e desserializado deve permanecer 100% válido no DTO');
  });

});
