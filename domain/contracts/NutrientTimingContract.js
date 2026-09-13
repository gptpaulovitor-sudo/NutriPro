/**
 * domain/contracts/NutrientTimingContract.js
 * 
 * Contrato Canônico de Entrada e Saída da Análise de Nutrient Timing — NutriAx Pro.
 * Fase N3.5 — Nutrient Timing Específico.
 * 
 * Camada Pura — Sem I/O, sem UI, sem dependências externas, sem efeitos colaterais.
 */

'use strict';

const CONTRACT_VERSION = 'N3.5.0';
const TIMING_ANALYSIS_VERSION = 'N3.5.0';

/**
 * Status formais de saída da Análise de Nutrient Timing
 */
const NUTRIENT_TIMING_STATUS = Object.freeze({
  PASS: 'PASS',
  WARNING: 'WARNING',
  BLOCKED: 'BLOCKED'
});

/**
 * Relações temporais primárias canônicas (mutuamente exclusivas por refeição)
 */
const TEMPORAL_PRIMARY_RELATION = Object.freeze({
  NEUTRAL: 'NEUTRAL',
  PRE_TRAINING: 'PRE_TRAINING',
  POST_TRAINING: 'POST_TRAINING',
  PRE_CARDIO: 'PRE_CARDIO',
  POST_CARDIO: 'POST_CARDIO',
  BETWEEN_TRAINING_AND_CARDIO: 'BETWEEN_TRAINING_AND_CARDIO',
  REST_DAY: 'REST_DAY',
  OVERLAPPING_EVENT: 'OVERLAPPING_EVENT'
});

/**
 * Relações temporais secundárias canônicas (podem coexistir como tags)
 */
const TEMPORAL_SECONDARY_RELATION = Object.freeze({
  FASTING_CONSTRAINED: 'FASTING_CONSTRAINED',
  CLOSE_EVENT_PROXIMITY: 'CLOSE_EVENT_PROXIMITY',
  DATA_INSUFFICIENT: 'DATA_INSUFFICIENT'
});

/**
 * Relações e diagnósticos de eventos contextuais
 */
const EVENT_RELATIONS = Object.freeze({
  FASTED_TRAINING: 'FASTED_TRAINING',
  CONSECUTIVE_CARDIO_TRAINING: 'CONSECUTIVE_CARDIO_TRAINING',
  UNSCHEDULED_CARDIO: 'UNSCHEDULED_CARDIO',
  TRAINING_OUTSIDE_FEEDING_WINDOW: 'TRAINING_OUTSIDE_FEEDING_WINDOW'
});

/**
 * Congelamento profundo determinístico e recursivo
 * @param {Object} obj 
 * @returns {Object}
 */
function deepFreeze(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Object.isFrozen(obj)) return obj;

  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const val = obj[prop];
    if (val !== null && (typeof val === 'object' || typeof val === 'function') && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  });

  return obj;
}

/**
 * Valida o Contrato de Entrada NutrientTimingInputDTO
 * @param {Object} input 
 * @returns {{ isValid: boolean, isBlocked: boolean, errors: string[] }}
 */
function validateNutrientTimingInput(input) {
  const errors = [];
  let isBlocked = false;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      isBlocked: true,
      errors: ['Input de Nutrient Timing deve ser um objeto válido e não-nulo.']
    };
  }

  // 1. Contexto Canônico de Prescrição Nutricional
  if (!input.context || typeof input.context !== 'object') {
    errors.push('context é obrigatório e deve ser um objeto.');
    isBlocked = true;
  }

  // 2. Resultado da Fase N3.4 (Meal Timing)
  if (!input.mealTimingResult || typeof input.mealTimingResult !== 'object') {
    errors.push('mealTimingResult é obrigatório (portão de entrada da Fase N3.4).');
    isBlocked = true;
  } else {
    const timingStatus = input.mealTimingResult.status;
    if (timingStatus === 'BLOCKED') {
      errors.push('mealTimingResult está com status BLOCKED. Análise N3.5 bloqueada.');
      isBlocked = true;
    } else if (timingStatus !== 'PASS' && timingStatus !== 'WARNING') {
      errors.push(`mealTimingResult possui status inválido: ${timingStatus}.`);
      isBlocked = true;
    }

    if (input.mealTimingResult.valid !== true) {
      errors.push('mealTimingResult.valid deve ser true.');
      isBlocked = true;
    }

    if (!Array.isArray(input.mealTimingResult.meals) || input.mealTimingResult.meals.length === 0) {
      errors.push('mealTimingResult.meals deve ser um array de refeições não-vazio.');
      isBlocked = true;
    } else {
      for (let m = 0; m < input.mealTimingResult.meals.length; m++) {
        const meal = input.mealTimingResult.meals[m];
        if (!meal || typeof meal !== 'object') {
          errors.push(`Refeição no índice ${m} de mealTimingResult é inválida.`);
          isBlocked = true;
        } else {
          if (!meal.mealId || typeof meal.mealId !== 'string') {
            errors.push(`Refeição no índice ${m} não possui mealId válido.`);
            isBlocked = true;
          }
          if (typeof meal.mealIndex !== 'number' || !Number.isInteger(meal.mealIndex)) {
            errors.push(`Refeição '${meal.mealId || m}' não possui mealIndex válido.`);
            isBlocked = true;
          }
          if (typeof meal.scheduledMinutes !== 'number' || isNaN(meal.scheduledMinutes)) {
            errors.push(`Refeição '${meal.mealId || m}' não possui scheduledMinutes válido.`);
            isBlocked = true;
          }
          if (!meal.scheduledTime || typeof meal.scheduledTime !== 'string') {
            errors.push(`Refeição '${meal.mealId || m}' não possui scheduledTime válido.`);
            isBlocked = true;
          }
          if (!Array.isArray(meal.items) || meal.items.length === 0) {
            errors.push(`Refeição '${meal.mealId || m}' possui items vazio ou inválido.`);
            isBlocked = true;
          }
          if (!meal.totals || typeof meal.totals !== 'object') {
            errors.push(`Refeição '${meal.mealId || m}' não possui totals válido.`);
            isBlocked = true;
          }
        }
      }
    }
  }

  // 3. Validação Opcional de N3.3 se fornecido
  if (input.mealAssemblyResult) {
    if (input.mealAssemblyResult.valid !== true || input.mealAssemblyResult.status === 'BLOCKED') {
      errors.push('mealAssemblyResult fornecido está inválido ou bloqueado.');
      isBlocked = true;
    }
  }

  return {
    isValid: errors.length === 0,
    isBlocked,
    errors
  };
}

/**
 * Valida a estrutura de saída do NutrientTimingOutputDTO
 * @param {Object} output 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateNutrientTimingOutput(output) {
  const errors = [];

  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return { isValid: false, errors: ['Output de Nutrient Timing deve ser um objeto válido.'] };
  }

  if (!output.timingAnalysisVersion || typeof output.timingAnalysisVersion !== 'string') {
    errors.push('timingAnalysisVersion é obrigatório e deve ser uma string.');
  }

  if (!output.timingVersion || typeof output.timingVersion !== 'string') {
    errors.push('timingVersion é obrigatório e deve ser uma string.');
  }

  if (!output.assemblyVersion || typeof output.assemblyVersion !== 'string') {
    errors.push('assemblyVersion é obrigatório e deve ser uma string.');
  }

  if (!output.solverVersion || typeof output.solverVersion !== 'string') {
    errors.push('solverVersion é obrigatório e deve ser uma string.');
  }

  if (!output.status || !Object.values(NUTRIENT_TIMING_STATUS).includes(output.status)) {
    errors.push(`status deve ser um dos valores: ${Object.values(NUTRIENT_TIMING_STATUS).join(', ')}.`);
  }

  if (typeof output.valid !== 'boolean') {
    errors.push('valid deve ser um booleano.');
  }

  if (!Array.isArray(output.meals)) {
    errors.push('meals deve ser um array de refeições analisadas.');
  } else {
    for (let i = 0; i < output.meals.length; i++) {
      const m = output.meals[i];
      if (!m || typeof m !== 'object') {
        errors.push(`Refeição analisada no índice ${i} é inválida.`);
        continue;
      }
      if (!m.primaryRelation || !Object.values(TEMPORAL_PRIMARY_RELATION).includes(m.primaryRelation)) {
        errors.push(`Refeição '${m.mealId || i}' possui primaryRelation inválida: "${m.primaryRelation}".`);
      }
      if (!Array.isArray(m.secondaryRelations)) {
        errors.push(`Refeição '${m.mealId || i}' deve possuir secondaryRelations como array.`);
      }
      if (typeof m.analysisReason !== 'string' || m.analysisReason.trim() === '') {
        errors.push(`Refeição '${m.mealId || i}' deve possuir analysisReason como string não-vazia.`);
      }
    }
  }

  ['globalDiagnostics', 'conflicts', 'warnings', 'blockingReasons'].forEach((field) => {
    if (!Array.isArray(output[field])) {
      errors.push(`${field} deve ser um array.`);
    }
  });

  if (!output.globalTotals || typeof output.globalTotals !== 'object') {
    errors.push('globalTotals deve ser um objeto de totais nutricionais.');
  }

  if (!output.provenance || typeof output.provenance !== 'object') {
    errors.push('provenance deve ser um objeto de proveniência.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

const NutrientTimingContract = {
  CONTRACT_VERSION,
  TIMING_ANALYSIS_VERSION,
  NUTRIENT_TIMING_STATUS,
  TEMPORAL_PRIMARY_RELATION,
  TEMPORAL_SECONDARY_RELATION,
  EVENT_RELATIONS,
  deepFreeze,
  validateNutrientTimingInput,
  validateNutrientTimingOutput
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NutrientTimingContract;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.NutrientTimingContract = NutrientTimingContract;
}
