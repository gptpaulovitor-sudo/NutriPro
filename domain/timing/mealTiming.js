/**
 * domain/timing/mealTiming.js
 * 
 * Motor de Posicionamento Temporal Determinístico de Refeições — NutriAx Pro.
 * Fase N3.4 — Meal Timing / Distribuição Temporal Determinística.
 * 
 * Camada Pura — Sem I/O, sem UI, sem termos clínicos/dietéticos.
 */

'use strict';

const MealTimingContract = require('../contracts/MealTimingContract');
const {
  TIMING_STATUS,
  WINDOW_STRENGTH,
  TEMPORAL_STATUS,
  TIMING_SOURCES,
  deepFreeze,
  validateMealTimingInput
} = MealTimingContract;

const mealTimingPolicy = require('./mealTimingPolicy');
const {
  DEFAULT_MEAL_TIMING_POLICY,
  timeStringToMinutes,
  minutesToTimeString,
  resolveEatingWindow,
  extractTemporalEvents
} = mealTimingPolicy;

const mealTimingValidator = require('./mealTimingValidator');
const { validateMealTiming } = mealTimingValidator;

/**
 * Posiciona deterministicamente as refeições da N3.3 no ciclo diário
 * 
 * @param {Object} input Contrato de Entrada MealTimingInputDTO
 * @param {Object} [customPolicy] Política customizada opcional
 * @returns {Object} MealTimingOutputDTO profundamente congelado
 */
function scheduleMeals(input, customPolicy = {}) {
  const policy = {
    ...DEFAULT_MEAL_TIMING_POLICY,
    ...customPolicy
  };

  const timingVersion = policy.timingVersion || 'N3.4.0';
  const assemblyVersion = (input && input.mealAssemblyResult && input.mealAssemblyResult.assemblyVersion) || 'N3.3.0';
  const solverVersion = (input && input.mealAssemblyResult && input.mealAssemblyResult.solverVersion) || 'N3.2.0';

  // 1. Validação do Portão de Entrada
  const inputValidation = validateMealTimingInput(input);
  if (!inputValidation.isValid) {
    return deepFreeze({
      timingVersion,
      assemblyVersion,
      solverVersion,
      status: TIMING_STATUS.BLOCKED,
      valid: false,
      meals: [],
      eatingWindow: {
        start: '00:00',
        startMinutes: 0,
        end: '00:00',
        endMinutes: 0,
        durationMinutes: 0,
        strength: WINDOW_STRENGTH.HARD,
        source: TIMING_SOURCES.POLICY_FALLBACK
      },
      temporalEvents: [],
      globalTotals: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0, sodium: null },
      diagnostics: ['Execução bloqueada pelo portão de validação de entrada.'],
      warnings: [],
      blockingReasons: inputValidation.errors,
      provenance: {
        engine: 'NutriAxDeterministicMealTiming',
        policyVersion: policy.policyVersion
      }
    });
  }

  const sourceAssembly = input.mealAssemblyResult;
  const rawMeals = [...sourceAssembly.meals];
  const globalTotals = sourceAssembly.globalTotals;
  const warnings = Array.isArray(sourceAssembly.warnings) ? [...sourceAssembly.warnings] : [];
  const diagnostics = [];

  // 2. Ordenação Canônica das Refeições por mealIndex para Garantir Invariância
  rawMeals.sort((a, b) => a.mealIndex - b.mealIndex);
  const M = rawMeals.length;

  // 3. Resolução da Janela Alimentar Eficaz
  const eatingWindow = resolveEatingWindow(input.context, input.fastingContext, policy);
  if (eatingWindow.warning) {
    warnings.push(eatingWindow.warning);
  }

  // 4. Extração de Eventos Temporais (Treino e Cardio)
  const temporalEvents = extractTemporalEvents(input.context, input.trainingContext, input.cardioContext, policy);

  // 5. Verificação de Viabilidade Matemática Estrita (Apenas para Janela HARD)
  const hardMinInterval = policy.hardMinMealInterval;
  const minRequiredWindow = M > 1 ? (M - 1) * hardMinInterval : 0;

  if (eatingWindow.strength === WINDOW_STRENGTH.HARD && eatingWindow.durationMinutes < minRequiredWindow) {
    return deepFreeze({
      timingVersion,
      assemblyVersion,
      solverVersion,
      status: TIMING_STATUS.BLOCKED,
      valid: false,
      meals: [],
      eatingWindow,
      temporalEvents,
      globalTotals,
      diagnostics: ['Inviabilidade temporal matemática estrita.'],
      warnings,
      blockingReasons: [
        `Janela alimentar estrita HARD (${eatingWindow.durationMinutes} min) insuficiente para acomodar ${M} refeições com intervalo mínimo físico de ${hardMinInterval} min (mínimo necessário: ${minRequiredWindow} min).`
      ],
      provenance: {
        engine: 'NutriAxDeterministicMealTiming',
        policyVersion: policy.policyVersion
      }
    });
  }

  // Se a janela for PREFERRED e curta demais, expandimos computacionalmente e alertamos
  let effectiveStart = eatingWindow.startMinutes;
  let effectiveEnd = eatingWindow.endMinutes;

  if (eatingWindow.strength === WINDOW_STRENGTH.PREFERRED && eatingWindow.durationMinutes < minRequiredWindow) {
    warnings.push(`Janela preferencial (${eatingWindow.durationMinutes} min) insuficiente para ${M} refeições; expandida automaticamente para ${minRequiredWindow} min para viabilidade física.`);
    effectiveEnd = effectiveStart + minRequiredWindow;
  }

  // 6. Verificação de Preferências Estruturadas de Horários no Contexto (ex: typicalMealTimes)
  let structuredTimes = null;
  const recall = input.context && input.context.dietaryRecall;
  if (recall && Array.isArray(recall.typicalMealTimes) && recall.typicalMealTimes.length === M) {
    const parsedMinutes = recall.typicalMealTimes.map(t => timeStringToMinutes(t));
    const allValid = parsedMinutes.every(m => m !== null);
    const isAscending = allValid && parsedMinutes.every((m, idx) => idx === 0 || m > parsedMinutes[idx - 1]);

    if (allValid && isAscending) {
      // Se a janela for HARD, valida se estão todos dentro
      const withinHard = (eatingWindow.strength !== WINDOW_STRENGTH.HARD) ||
        parsedMinutes.every(m => m >= eatingWindow.startMinutes && m <= eatingWindow.endMinutes);

      if (withinHard) {
        structuredTimes = parsedMinutes;
      }
    }
  }

  // 7. Algoritmo Determinístico de Posicionamento Temporal
  const scheduledMinutesList = new Array(M);
  const timingSourcesList = new Array(M);
  const temporalStatusList = new Array(M);
  const timingReasonsList = new Array(M);

  if (structuredTimes) {
    // Aplica horários estruturados da rotina do paciente
    for (let i = 0; i < M; i++) {
      scheduledMinutesList[i] = structuredTimes[i];
      timingSourcesList[i] = TIMING_SOURCES.STRUCTURED_ROUTINE;
      temporalStatusList[i] = TEMPORAL_STATUS.CONFIRMED;
      timingReasonsList[i] = 'STRUCTURED_ROUTINE_SLOT';
    }
    diagnostics.push(`Horários definidos a partir de rotina estruturada de horários típicos (${M} horários).`);
  } else {
    // Distribuição Uniforme Ancorada com Respeito a Eventos de Treino e Cardio
    const duration = effectiveEnd - effectiveStart;

    if (M === 1) {
      // 1 refeição: posiciona no meio da janela
      scheduledMinutesList[0] = Math.round(effectiveStart + duration / 2);
      timingSourcesList[0] = eatingWindow.source;
      temporalStatusList[0] = eatingWindow.source === TIMING_SOURCES.POLICY_FALLBACK ? TEMPORAL_STATUS.FALLBACK : TEMPORAL_STATUS.CONFIRMED;
      timingReasonsList[0] = 'SINGLE_MEAL_MID_WINDOW';
    } else {
      // M >= 2 refeições
      for (let i = 0; i < M; i++) {
        const fraction = i / (M - 1);
        const nominalTime = Math.round(effectiveStart + fraction * duration);
        scheduledMinutesList[i] = nominalTime;
        timingSourcesList[i] = eatingWindow.source;
        temporalStatusList[i] = eatingWindow.source === TIMING_SOURCES.POLICY_FALLBACK ? TEMPORAL_STATUS.FALLBACK : TEMPORAL_STATUS.CONFIRMED;
        timingReasonsList[i] = 'PREFERRED_DISTRIBUTION';
      }

      // Ajuste de não-colisão e proximidade com Treino e Cardio
      temporalEvents.forEach(ev => {
        const evStart = ev.startMinutes;
        const evEnd = ev.endMinutes;
        const buffer = policy.minEventBufferMinutes;

        // Verifica refeições que colidiriam fisicamente com a sessão
        for (let i = 0; i < M; i++) {
          const mTime = scheduledMinutesList[i];
          if (mTime >= evStart - buffer && mTime <= evEnd + buffer) {
            // Se está mais perto do início, move para antes do evento
            if (mTime < (evStart + evEnd) / 2) {
              const adjustedTime = Math.max(effectiveStart, evStart - policy.preferredMealBeforeTrainingMinutes);
              scheduledMinutesList[i] = adjustedTime;
              timingSourcesList[i] = ev.source;
              temporalStatusList[i] = TEMPORAL_STATUS.ADJUSTED;
              timingReasonsList[i] = `PRE_${ev.eventType}_BUFFER`;
            } else {
              // Move para depois do evento
              const adjustedTime = Math.min(effectiveEnd, evEnd + policy.preferredMealAfterTrainingMinutes);
              scheduledMinutesList[i] = adjustedTime;
              timingSourcesList[i] = ev.source;
              temporalStatusList[i] = TEMPORAL_STATUS.ADJUSTED;
              timingReasonsList[i] = `POST_${ev.eventType}_BUFFER`;
            }
          }
        }
      });

      // Passada determinística de garantia de monotonicidade (hardMinInterval)
      for (let i = 1; i < M; i++) {
        if (scheduledMinutesList[i] - scheduledMinutesList[i - 1] < hardMinInterval) {
          scheduledMinutesList[i] = scheduledMinutesList[i - 1] + hardMinInterval;
          temporalStatusList[i] = TEMPORAL_STATUS.ADJUSTED;
          timingReasonsList[i] = 'HARD_INTERVAL_ENFORCEMENT';
        }
      }

      // Se o ajuste final ultrapassou o final da janela
      if (scheduledMinutesList[M - 1] > effectiveEnd) {
        if (eatingWindow.strength === WINDOW_STRENGTH.HARD) {
          // Ajusta retroativamente empurrando para trás a partir do final
          scheduledMinutesList[M - 1] = effectiveEnd;
          for (let i = M - 2; i >= 0; i--) {
            if (scheduledMinutesList[i + 1] - scheduledMinutesList[i] < hardMinInterval) {
              scheduledMinutesList[i] = scheduledMinutesList[i + 1] - hardMinInterval;
              temporalStatusList[i] = TEMPORAL_STATUS.ADJUSTED;
            }
          }
        } else {
          warnings.push(`Extensão de horário no fechamento (${scheduledMinutesList[M - 1]} min) acomodada sob janela preferencial PREFERRED.`);
        }
      }

      diagnostics.push(`Refeições distribuídas deterministicamente em janela ${eatingWindow.start} - ${eatingWindow.end} (${M} refeições).`);
    }
  }

  // 8. Construção das ScheduledMealDTO preservando 100% dos dados da N3.3
  const scheduledMeals = [];
  for (let i = 0; i < M; i++) {
    const originalMeal = rawMeals[i];
    const schedM = scheduledMinutesList[i];
    const nextM = (i < M - 1) ? scheduledMinutesList[i + 1] : null;
    const intervalToNext = nextM !== null ? (nextM - schedM) : null;

    scheduledMeals.push({
      mealId: originalMeal.mealId,
      mealIndex: originalMeal.mealIndex,
      mealName: originalMeal.mealName,
      mealRole: originalMeal.mealRole,
      scheduledTime: minutesToTimeString(schedM),
      scheduledMinutes: schedM,
      intervalToNextMinutes: intervalToNext,
      temporalStatus: temporalStatusList[i],
      timingReason: timingReasonsList[i],
      timingSource: timingSourcesList[i],
      items: originalMeal.items,
      totals: originalMeal.totals
    });
  }

  // 9. Validação Canônica das 18 Invariantes Temporais
  const candidateOutput = {
    timingVersion,
    assemblyVersion,
    solverVersion,
    status: TIMING_STATUS.PASS,
    valid: true,
    meals: scheduledMeals,
    eatingWindow,
    temporalEvents,
    globalTotals,
    diagnostics,
    warnings,
    blockingReasons: [],
    provenance: {
      engine: 'NutriAxDeterministicMealTiming',
      policyVersion: policy.policyVersion
    }
  };

  const valResult = validateMealTiming(candidateOutput, sourceAssembly, eatingWindow, temporalEvents, policy);

  if (valResult.warnings && valResult.warnings.length > 0) {
    warnings.push(...valResult.warnings);
  }

  let finalStatus;
  let isValid;

  if (!valResult.isValid) {
    finalStatus = TIMING_STATUS.BLOCKED;
    isValid = false;
  } else if (warnings.length > 0) {
    finalStatus = TIMING_STATUS.WARNING;
    isValid = true;
  } else {
    finalStatus = TIMING_STATUS.PASS;
    isValid = true;
  }

  return deepFreeze({
    timingVersion,
    assemblyVersion,
    solverVersion,
    status: finalStatus,
    valid: isValid,
    meals: scheduledMeals,
    eatingWindow,
    temporalEvents,
    globalTotals,
    diagnostics,
    warnings: [...new Set(warnings)],
    blockingReasons: valResult.errors,
    provenance: {
      engine: 'NutriAxDeterministicMealTiming',
      policyVersion: policy.policyVersion
    }
  });
}

module.exports = deepFreeze({
  scheduleMeals
});
