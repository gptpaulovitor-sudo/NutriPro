/**
 * domain/timing/nutrientTiming.js
 * 
 * Motor Determinístico de Análise de Nutrient Timing — NutriAx Pro.
 * Fase N3.5 — Nutrient Timing Específico.
 * 
 * Camada Pura — Sem I/O, sem UI, sem efeitos colaterais, sem dependências externas.
 * 
 * Princípios Fundamentais:
 * 1. PUREZA ANALÍTICA: N3.5 NÃO prescreve nutrientes; N3.5 apenas analisa e classifica.
 * 2. IMUTABILIDADE & CONSERVAÇÃO: Preservação de 100% dos alimentos, gramas, calorias,
 *    macronutrientes e horários gerados nas Fases N2.1 a N3.4.
 * 3. DETERMINISMO: Mesma entrada lógica + mesma política = resultado idêntico (deepStrictEqual).
 * 4. SEM REGRAS CLÍNICAS MÁGICAS: Parâmetros PREFERRED nunca bloqueiam e não forçam refeições.
 */

'use strict';

const NutrientTimingContract = require('../contracts/NutrientTimingContract');
const {
  NUTRIENT_TIMING_STATUS,
  TEMPORAL_PRIMARY_RELATION,
  TEMPORAL_SECONDARY_RELATION,
  EVENT_RELATIONS,
  deepFreeze,
  validateNutrientTimingInput
} = NutrientTimingContract;

const nutrientTimingPolicy = require('./nutrientTimingPolicy');
const {
  DEFAULT_NUTRIENT_TIMING_POLICY,
  timeStringToMinutes,
  minutesToTimeString,
  resolveDayEvents
} = nutrientTimingPolicy;

const nutrientTimingValidator = require('./nutrientTimingValidator');
const { validateNutrientTiming } = nutrientTimingValidator;

/**
 * Analisa deterministicamente a relação temporal das refeições com treino, cardio, jejum e microciclo
 * 
 * @param {Object} input Contrato de Entrada NutrientTimingInputDTO
 * @param {Object} [customPolicy] Política customizada opcional
 * @returns {Object} NutrientTimingOutputDTO profundamente congelado
 */
function analyzeNutrientTiming(input, customPolicy = {}) {
  const policy = {
    ...DEFAULT_NUTRIENT_TIMING_POLICY,
    ...customPolicy
  };

  const timingAnalysisVersion = policy.analysisVersion || 'N3.5.0';
  const timingVersion = (input && input.mealTimingResult && input.mealTimingResult.timingVersion) || 'N3.4.0';
  const assemblyVersion = (input && input.mealTimingResult && input.mealTimingResult.assemblyVersion) || 'N3.3.0';
  const solverVersion = (input && input.mealTimingResult && input.mealTimingResult.solverVersion) || 'N3.2.0';

  // 1. Validação do Portão de Entrada
  const inputValidation = validateNutrientTimingInput(input);
  if (!inputValidation.isValid) {
    return deepFreeze({
      timingAnalysisVersion,
      timingVersion,
      assemblyVersion,
      solverVersion,
      status: NUTRIENT_TIMING_STATUS.BLOCKED,
      valid: false,
      meals: [],
      mealAnalyses: [],
      globalDiagnostics: ['Execução bloqueada pelo portão de validação de entrada.'],
      temporalEvents: [],
      conflicts: inputValidation.errors.map(err => ({
        type: 'INPUT_GATE_ERROR',
        severity: 'BLOCK',
        description: err,
        entityId: 'input'
      })),
      warnings: [],
      blockingReasons: inputValidation.errors,
      globalTotals: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0, sodium: null },
      provenance: {
        engine: 'NutriAxDeterministicNutrientTiming',
        policyVersion: policy.policyVersion,
        analysisVersion: timingAnalysisVersion
      }
    });
  }

  const mealTimingResult = input.mealTimingResult;
  const rawMeals = [...mealTimingResult.meals];
  const globalTotals = mealTimingResult.globalTotals;
  const eatingWindow = mealTimingResult.eatingWindow;
  const context = input.context;
  const targetDayKey = input.targetDayKey || null;

  // Ordenação canônica por scheduledMinutes
  rawMeals.sort((a, b) => a.scheduledMinutes - b.scheduledMinutes);
  const M = rawMeals.length;

  const globalDiagnostics = [];
  const conflicts = [];
  const warnings = Array.isArray(mealTimingResult.warnings) ? [...mealTimingResult.warnings] : [];
  const blockingReasons = [];

  // 2. Resolução Estruturada de Eventos do Microciclo (Treino, Cardio, Descanso)
  const dayEvents = resolveDayEvents(context, targetDayKey, policy);
  const isRestDay = dayEvents.isRestDay;
  const trainingEvent = dayEvents.trainingEvent;
  const cardioEvents = dayEvents.cardioEvents;
  const unscheduledCardioCount = dayEvents.unscheduledCardioCount;

  if (isRestDay) {
    globalDiagnostics.push('Dia classificado como descanso (rest === true no microciclo estruturado).');
  }

  // Lista consolidada de eventos temporais ativos no dia
  const activeEvents = [];
  if (!isRestDay) {
    if (trainingEvent) activeEvents.push(trainingEvent);
    cardioEvents.forEach(cev => activeEvents.push(cev));
  }
  activeEvents.sort((a, b) => a.startMinutes - b.startMinutes);

  // 3. Verificação de Treino em Jejum (FASTED_TRAINING)
  // Regra Arquitetural: Diagnóstico puro; NÃO gera WARNING automaticamente,
  // salvo se houver conflito formal expresso no contexto.
  if (trainingEvent && eatingWindow && typeof eatingWindow.startMinutes === 'number') {
    const isOutsideFeeding = (trainingEvent.startMinutes < eatingWindow.startMinutes) || (trainingEvent.endMinutes > eatingWindow.endMinutes);
    if (isOutsideFeeding) {
      globalDiagnostics.push(`Treino estruturado (${trainingEvent.start} - ${trainingEvent.end}) ocorre fora da janela alimentar (${eatingWindow.start} - ${eatingWindow.end}): diagnóstico FASTED_TRAINING.`);
      
      const fastingConstraint = (context.constraints && context.constraints.prohibitFastedTraining) ||
                                (context.fasting && context.fasting.prohibitFastedTraining);
      if (fastingConstraint) {
        conflicts.push({
          type: 'FASTED_TRAINING_CONTRAINDICATION',
          severity: 'WARNING',
          description: 'Treino em jejum incompatível com restrição formal documentada no contexto.',
          entityId: 'training'
        });
        warnings.push('Treino em jejum incompatível com restrição formal documentada no contexto.');
      }
    }
  }

  // 4. Verificação de Cardio -> Sono (Apenas se ambos forem estruturados)
  if (cardioEvents.length > 0 && context.routine && context.routine.bedTime) {
    const bedM = timeStringToMinutes(context.routine.bedTime);
    const lastCardio = cardioEvents[cardioEvents.length - 1];

    if (bedM !== null && lastCardio && typeof lastCardio.endMinutes === 'number') {
      if (bedM > lastCardio.endMinutes) {
        const cardioSleepDist = bedM - lastCardio.endMinutes;
        if (cardioSleepDist < policy.preferredCardioSleepSeparationMinutes) {
          warnings.push(`Separação entre término do cardio (${lastCardio.end}) e horário de sono (${context.routine.bedTime}) é de ${cardioSleepDist} min, menor que o preferencial de ${policy.preferredCardioSleepSeparationMinutes} min.`);
        }
      }
    }
  }

  if (unscheduledCardioCount > 0) {
    globalDiagnostics.push(`Identificada(s) ${unscheduledCardioCount} sessão(ões) de cardio sem horário de início estruturado (DATA_INSUFFICIENT).`);
    warnings.push('Sessão de cardio cadastrada sem horário de início estruturado. Análise peri-cardio classificada como DATA_INSUFFICIENT.');
  }

  // 5. Identificação Prévia de Refeições Pré e Pós Treino
  let preTrainingMealId = null;
  let postTrainingMealId = null;

  if (!isRestDay && trainingEvent) {
    const tStart = trainingEvent.startMinutes;
    const tEnd = trainingEvent.endMinutes;

    // Candidatos pré-treino
    const preCandidates = rawMeals
      .filter(m => m.scheduledMinutes < tStart && (tStart - m.scheduledMinutes) <= policy.preferredPeriEventWindowMinutes)
      .sort((a, b) => (tStart - a.scheduledMinutes) - (tStart - b.scheduledMinutes)); // mais próximo primeiro

    if (preCandidates.length > 0) {
      preTrainingMealId = preCandidates[0].mealId;
    }

    // Candidatos pós-treino
    const postCandidates = rawMeals
      .filter(m => m.scheduledMinutes > tEnd && (m.scheduledMinutes - tEnd) <= policy.preferredPeriEventWindowMinutes)
      .sort((a, b) => (a.scheduledMinutes - tEnd) - (b.scheduledMinutes - tEnd)); // mais próximo primeiro

    if (postCandidates.length > 0) {
      postTrainingMealId = postCandidates[0].mealId;
    }
  }

  // 6. Identificação Prévia de Refeições Pré e Pós Cardio
  let preCardioMealId = null;
  let postCardioMealId = null;

  if (!isRestDay && cardioEvents.length > 0) {
    const firstCardio = cardioEvents[0];
    const lastCardio = cardioEvents[cardioEvents.length - 1];

    const preCardioCandidates = rawMeals
      .filter(m => m.scheduledMinutes < firstCardio.startMinutes && (firstCardio.startMinutes - m.scheduledMinutes) <= policy.preferredPeriEventWindowMinutes)
      .sort((a, b) => (firstCardio.startMinutes - a.scheduledMinutes) - (firstCardio.startMinutes - b.scheduledMinutes));

    if (preCardioCandidates.length > 0 && preCardioCandidates[0].mealId !== preTrainingMealId) {
      preCardioMealId = preCardioCandidates[0].mealId;
    }

    const postCardioCandidates = rawMeals
      .filter(m => m.scheduledMinutes > lastCardio.endMinutes && (m.scheduledMinutes - lastCardio.endMinutes) <= policy.preferredPeriEventWindowMinutes)
      .sort((a, b) => (a.scheduledMinutes - lastCardio.endMinutes) - (b.scheduledMinutes - lastCardio.endMinutes));

    if (postCardioCandidates.length > 0 && postCardioCandidates[0].mealId !== postTrainingMealId) {
      postCardioMealId = postCardioCandidates[0].mealId;
    }
  }

  // 7. Processamento e Classificação de Cada Refeição
  const analyzedMeals = [];

  for (let i = 0; i < M; i++) {
    const meal = rawMeals[i];
    const mTime = meal.scheduledMinutes;

    let primaryRelation = TEMPORAL_PRIMARY_RELATION.NEUTRAL;
    const secondaryRelations = [];
    const eventRelations = [];
    let distanceToTrainingMinutes = null;
    let distanceToCardioMinutes = null;
    let analysisReason = '';

    // Distância até Treino
    if (trainingEvent) {
      const tStart = trainingEvent.startMinutes;
      const tEnd = trainingEvent.endMinutes;
      if (mTime < tStart) {
        distanceToTrainingMinutes = tStart - mTime;
      } else if (mTime > tEnd) {
        distanceToTrainingMinutes = mTime - tEnd;
      } else {
        distanceToTrainingMinutes = 0;
      }
    }

    // Distância até Cardio
    if (cardioEvents.length > 0) {
      let minCardioDist = null;
      cardioEvents.forEach(cev => {
        let dist = null;
        if (mTime < cev.startMinutes) dist = cev.startMinutes - mTime;
        else if (mTime > cev.endMinutes) dist = mTime - cev.endMinutes;
        else dist = 0;
        if (dist !== null && (minCardioDist === null || dist < minCardioDist)) {
          minCardioDist = dist;
        }
      });
      distanceToCardioMinutes = minCardioDist;
    } else if (unscheduledCardioCount > 0) {
      secondaryRelations.push(TEMPORAL_SECONDARY_RELATION.DATA_INSUFFICIENT);
    }

    // Tag Secundária: Âncora de Jejum
    if (eatingWindow && typeof eatingWindow.startMinutes === 'number') {
      const distFeedStart = Math.abs(mTime - eatingWindow.startMinutes);
      const distFeedEnd = Math.abs(mTime - eatingWindow.endMinutes);
      if (distFeedStart <= policy.fastingWindowAnchorThresholdMinutes ||
          distFeedEnd <= policy.fastingWindowAnchorThresholdMinutes ||
          meal.timingSource === 'FASTING_PROTOCOL') {
        secondaryRelations.push(TEMPORAL_SECONDARY_RELATION.FASTING_CONSTRAINED);
      }

      // Violação de Janela Alimentar HARD
      if (eatingWindow.strength === 'HARD' && (mTime < eatingWindow.startMinutes || mTime > eatingWindow.endMinutes)) {
        conflicts.push({
          type: 'FASTING_VIOLATION',
          severity: 'BLOCK',
          description: `Refeição '${meal.mealId}' (${meal.scheduledTime}) posicionada fora da janela alimentar estrita HARD (${eatingWindow.start} - ${eatingWindow.end}).`,
          entityId: meal.mealId
        });
        blockingReasons.push(`Refeição '${meal.mealId}' está fora da janela alimentar estrita HARD (${eatingWindow.start} - ${eatingWindow.end}).`);
      }
    }

    // A. Verificação de Colisão Física (Violação Contratual HARD)
    let collisionDetected = false;
    activeEvents.forEach(ev => {
      if (mTime >= ev.startMinutes && mTime <= ev.endMinutes) {
        collisionDetected = true;
        primaryRelation = TEMPORAL_PRIMARY_RELATION.OVERLAPPING_EVENT;
        analysisReason = `Refeição posicionada dentro do intervalo do evento de ${ev.eventType} (${ev.start} - ${ev.end}). Violação de separação temporal.`;
        conflicts.push({
          type: 'EVENT_COLLISION',
          severity: 'BLOCK',
          description: `Refeição '${meal.mealId}' (${meal.scheduledTime}) colide fisicamente com ${ev.eventType} (${ev.start} - ${ev.end}).`,
          entityId: meal.mealId
        });
        blockingReasons.push(`Refeição '${meal.mealId}' colide fisicamente com o evento ${ev.eventType} (${ev.start} - ${ev.end}). Invariante de integridade temporal violada.`);
      }
    });

    if (!collisionDetected) {
      // B. Dia de Descanso Estruturado
      if (isRestDay) {
        primaryRelation = TEMPORAL_PRIMARY_RELATION.REST_DAY;
        analysisReason = 'Refeição inserida em dia de descanso estruturado (rest === true no microciclo).';
      }
      // C. Pré-Treino de Musculação
      else if (meal.mealId === preTrainingMealId) {
        primaryRelation = TEMPORAL_PRIMARY_RELATION.PRE_TRAINING;
        analysisReason = `Refeição posicionada ${distanceToTrainingMinutes} min antes do início da sessão de musculação estruturada (${trainingEvent.start}).`;

        if (distanceToTrainingMinutes < policy.preferredMealEventSeparationMinutes) {
          secondaryRelations.push(TEMPORAL_SECONDARY_RELATION.CLOSE_EVENT_PROXIMITY);
          warnings.push(`Refeição '${meal.mealId}' posicionada a ${distanceToTrainingMinutes} min do treino, menor que a separação operacional preferencial de ${policy.preferredMealEventSeparationMinutes} min.`);
        }
      }
      // D. Pós-Treino de Musculação
      else if (meal.mealId === postTrainingMealId) {
        primaryRelation = TEMPORAL_PRIMARY_RELATION.POST_TRAINING;
        analysisReason = `Refeição posicionada ${distanceToTrainingMinutes} min após o término da sessão de musculação estruturada (${trainingEvent.end}).`;

        if (distanceToTrainingMinutes < policy.preferredMealEventSeparationMinutes) {
          secondaryRelations.push(TEMPORAL_SECONDARY_RELATION.CLOSE_EVENT_PROXIMITY);
          warnings.push(`Refeição '${meal.mealId}' posicionada a ${distanceToTrainingMinutes} min do término do treino, menor que a separação operacional preferencial de ${policy.preferredMealEventSeparationMinutes} min.`);
        }
      }
      // E. Pré-Cardio
      else if (meal.mealId === preCardioMealId) {
        primaryRelation = TEMPORAL_PRIMARY_RELATION.PRE_CARDIO;
        analysisReason = `Refeição posicionada ${distanceToCardioMinutes} min antes do início da sessão de cardio estruturada (${cardioEvents[0].start}).`;

        if (distanceToCardioMinutes !== null && distanceToCardioMinutes < policy.preferredMealEventSeparationMinutes) {
          secondaryRelations.push(TEMPORAL_SECONDARY_RELATION.CLOSE_EVENT_PROXIMITY);
          warnings.push(`Refeição '${meal.mealId}' posicionada a ${distanceToCardioMinutes} min do cardio, menor que a separação operacional preferencial de ${policy.preferredMealEventSeparationMinutes} min.`);
        }
      }
      // F. Pós-Cardio
      else if (meal.mealId === postCardioMealId) {
        primaryRelation = TEMPORAL_PRIMARY_RELATION.POST_CARDIO;
        analysisReason = `Refeição posicionada ${distanceToCardioMinutes} min após o término da sessão de cardio estruturada (${cardioEvents[cardioEvents.length - 1].end}).`;

        if (distanceToCardioMinutes !== null && distanceToCardioMinutes < policy.preferredMealEventSeparationMinutes) {
          secondaryRelations.push(TEMPORAL_SECONDARY_RELATION.CLOSE_EVENT_PROXIMITY);
          warnings.push(`Refeição '${meal.mealId}' posicionada a ${distanceToCardioMinutes} min do término do cardio, menor que a separação operacional preferencial de ${policy.preferredMealEventSeparationMinutes} min.`);
        }
      }
      // G. Entre Treino e Cardio no Mesmo Dia
      else if (trainingEvent && cardioEvents.length > 0 &&
               trainingEvent.endMinutes < cardioEvents[0].startMinutes &&
               mTime > trainingEvent.endMinutes && mTime < cardioEvents[0].startMinutes) {
        primaryRelation = TEMPORAL_PRIMARY_RELATION.BETWEEN_TRAINING_AND_CARDIO;
        analysisReason = `Refeição situada no intervalo entre a sessão de musculação (término às ${trainingEvent.end}) e a de cardio (início às ${cardioEvents[0].start}).`;
      }
      // H. Neutra
      else {
        primaryRelation = TEMPORAL_PRIMARY_RELATION.NEUTRAL;
        analysisReason = 'Refeição sem proximidade imediata com eventos de exercício físico estruturados.';
      }
    }

    analyzedMeals.push({
      mealId: meal.mealId,
      mealIndex: meal.mealIndex,
      mealName: meal.mealName,
      mealRole: meal.mealRole,
      scheduledTime: meal.scheduledTime,
      scheduledMinutes: meal.scheduledMinutes,
      intervalToNextMinutes: meal.intervalToNextMinutes,
      primaryRelation,
      secondaryRelations: [...new Set(secondaryRelations)],
      eventRelations: [...new Set(eventRelations)],
      distanceToTrainingMinutes,
      distanceToCardioMinutes,
      temporalStatus: meal.temporalStatus,
      timingReason: meal.timingReason,
      analysisReason,
      items: meal.items,
      totals: meal.totals
    });
  }

  // 8. Recomendações e Diagnósticos de Nutrient Timing (Sem Mutação de Dados)
  const clinicalObj = (context.objective && context.objective.clinicalObjective) || '';
  if (/hipertrofia|ganho de massa/i.test(clinicalObj) && postTrainingMealId) {
    const postMeal = analyzedMeals.find(m => m.mealId === postTrainingMealId);
    if (postMeal && postMeal.totals && postMeal.totals.protein < 10) {
      globalDiagnostics.push('Observação consultiva de nutrient timing: Em hipertrofia, sugere-se maior disponibilidade proteica na refeição pós-treino imediata. Prescrição conservada sem alterações.');
    }
  }

  // 9. Construção do DTO de Saída Candidato
  let finalStatus;
  let isValid;

  if (blockingReasons.length > 0) {
    finalStatus = NUTRIENT_TIMING_STATUS.BLOCKED;
    isValid = false;
  } else if (warnings.length > 0) {
    finalStatus = NUTRIENT_TIMING_STATUS.WARNING;
    isValid = true;
  } else {
    finalStatus = NUTRIENT_TIMING_STATUS.PASS;
    isValid = true;
  }

  const candidateOutput = {
    timingAnalysisVersion,
    timingVersion,
    assemblyVersion,
    solverVersion,
    status: finalStatus,
    valid: isValid,
    meals: analyzedMeals,
    mealAnalyses: analyzedMeals,
    globalDiagnostics,
    temporalEvents: activeEvents,
    conflicts,
    warnings: [...new Set(warnings)],
    blockingReasons,
    globalTotals,
    provenance: {
      engine: 'NutriAxDeterministicNutrientTiming',
      policyVersion: policy.policyVersion,
      analysisVersion: timingAnalysisVersion
    }
  };

  // 10. Validação Canônica Estrita de Invariantes
  const valResult = validateNutrientTiming(candidateOutput, mealTimingResult, input.mealAssemblyResult, policy);
  if (!valResult.isValid) {
    candidateOutput.status = NUTRIENT_TIMING_STATUS.BLOCKED;
    candidateOutput.valid = false;
    candidateOutput.blockingReasons.push(...valResult.errors);
  }

  return deepFreeze(candidateOutput);
}

module.exports = deepFreeze({
  analyzeNutrientTiming
});
