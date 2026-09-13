/**
 * domain/contracts/MealTimingContract.js
 * 
 * Contrato Canônico de Entrada e Saída do Meal Timing — NutriAx Pro.
 * Fase N3.4 — Meal Timing / Distribuição Temporal Determinística.
 * 
 * Camada Pura — Sem I/O, sem UI, sem dependências externas.
 */

'use strict';

const MEAL_TIMING_CONTRACT_VERSION = '1.0.0';

/**
 * Status formais de saída do Meal Timing
 */
const TIMING_STATUS = Object.freeze({
  PASS: 'PASS',
  WARNING: 'WARNING',
  BLOCKED: 'BLOCKED'
});

/**
 * Força da janela temporal (HARD bloqueia se violada; PREFERRED apenas orienta)
 */
const WINDOW_STRENGTH = Object.freeze({
  HARD: 'HARD',
  PREFERRED: 'PREFERRED'
});

/**
 * Status individual de agendamento de cada refeição
 */
const TEMPORAL_STATUS = Object.freeze({
  CONFIRMED: 'CONFIRMED',
  ADJUSTED: 'ADJUSTED',
  FALLBACK: 'FALLBACK'
});

/**
 * Origem auditável do posicionamento temporal
 */
const TIMING_SOURCES = Object.freeze({
  STRUCTURED_ROUTINE: 'STRUCTURED_ROUTINE',
  FASTING_PROTOCOL: 'FASTING_PROTOCOL',
  STRUCTURED_TRAINING: 'STRUCTURED_TRAINING',
  STRUCTURED_CARDIO: 'STRUCTURED_CARDIO',
  PREFERRED_DISTRIBUTION: 'PREFERRED_DISTRIBUTION',
  POLICY_FALLBACK: 'POLICY_FALLBACK'
});

/**
 * Tipos computacionais de eventos temporais (não dietéticos)
 */
const TEMPORAL_EVENT_TYPES = Object.freeze({
  TRAINING: 'TRAINING',
  CARDIO: 'CARDIO',
  SLEEP: 'SLEEP',
  WORK: 'WORK',
  FASTING: 'FASTING'
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
 * Valida o Contrato de Entrada MealTimingInputDTO
 * @param {Object} input 
 * @returns {{ isValid: boolean, isBlocked: boolean, errors: string[] }}
 */
function validateMealTimingInput(input) {
  const errors = [];
  let isBlocked = false;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      isBlocked: true,
      errors: ['Input de Meal Timing deve ser um objeto válido e não-nulo.']
    };
  }

  // 1. Contexto Canônico
  if (!input.context || typeof input.context !== 'object') {
    errors.push('context é obrigatório e deve ser um objeto.');
    isBlocked = true;
  }

  // 2. Resultado da Fase N3.3 (Meal Assembly)
  if (!input.mealAssemblyResult || typeof input.mealAssemblyResult !== 'object') {
    errors.push('mealAssemblyResult é obrigatório (portão de entrada da Fase N3.3).');
    isBlocked = true;
  } else {
    const assemblyStatus = input.mealAssemblyResult.status;
    if (assemblyStatus === 'BLOCKED') {
      errors.push('mealAssemblyResult está com status BLOCKED.');
      isBlocked = true;
    } else if (assemblyStatus !== 'PASS' && assemblyStatus !== 'WARNING') {
      errors.push(`mealAssemblyResult possui status inválido: ${assemblyStatus}.`);
      isBlocked = true;
    }

    if (input.mealAssemblyResult.valid !== true) {
      errors.push('mealAssemblyResult.valid deve ser true.');
      isBlocked = true;
    }

    if (!Array.isArray(input.mealAssemblyResult.meals) || input.mealAssemblyResult.meals.length === 0) {
      errors.push('mealAssemblyResult.meals deve ser um array de refeições não-vazio.');
      isBlocked = true;
    } else {
      for (let m = 0; m < input.mealAssemblyResult.meals.length; m++) {
        const meal = input.mealAssemblyResult.meals[m];
        if (!meal || typeof meal !== 'object') {
          errors.push(`Refeição no índice ${m} de mealAssemblyResult é inválida.`);
          isBlocked = true;
        } else {
          if (!meal.mealId || typeof meal.mealId !== 'string') {
            errors.push(`Refeição no índice ${m} não possui mealId válido.`);
            isBlocked = true;
          }
          if (typeof meal.mealIndex !== 'number' || !Number.isInteger(meal.mealIndex)) {
            errors.push(`Refeição no índice ${m} não possui mealIndex válido.`);
            isBlocked = true;
          }
          if (!Array.isArray(meal.items) || meal.items.length === 0) {
            errors.push(`Refeição '${meal.mealId || m}' possui items vazio ou inválido.`);
            isBlocked = true;
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    isBlocked,
    errors
  };
}

/**
 * Valida a estrutura de saída do MealTimingOutputDTO
 * @param {Object} output 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateMealTimingOutput(output) {
  const errors = [];

  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return { isValid: false, errors: ['Output de Meal Timing deve ser um objeto válido.'] };
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

  if (!output.status || !Object.values(TIMING_STATUS).includes(output.status)) {
    errors.push(`status deve ser um dos valores: ${Object.values(TIMING_STATUS).join(', ')}.`);
  }

  if (typeof output.valid !== 'boolean') {
    errors.push('valid deve ser um booleano.');
  }

  if (!Array.isArray(output.meals)) {
    errors.push('meals deve ser um array de refeições agendadas.');
  }

  if (!output.eatingWindow || typeof output.eatingWindow !== 'object') {
    errors.push('eatingWindow deve ser um objeto descrevendo a janela alimentar.');
  } else {
    if (typeof output.eatingWindow.startMinutes !== 'number' || typeof output.eatingWindow.endMinutes !== 'number') {
      errors.push('eatingWindow deve conter startMinutes e endMinutes numéricos.');
    }
  }

  if (!Array.isArray(output.temporalEvents)) {
    errors.push('temporalEvents deve ser um array de eventos temporais.');
  }

  if (!output.globalTotals || typeof output.globalTotals !== 'object') {
    errors.push('globalTotals deve ser um objeto de totais nutricionais.');
  }

  ['diagnostics', 'warnings', 'blockingReasons'].forEach((field) => {
    if (!Array.isArray(output[field])) {
      errors.push(`${field} deve ser um array.`);
    }
  });

  if (!output.provenance || typeof output.provenance !== 'object') {
    errors.push('provenance deve ser um objeto de proveniência de execução.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

const MealTimingContract = {
  CONTRACT_VERSION: MEAL_TIMING_CONTRACT_VERSION,
  TIMING_STATUS,
  WINDOW_STRENGTH,
  TEMPORAL_STATUS,
  TIMING_SOURCES,
  TEMPORAL_EVENT_TYPES,
  deepFreeze,
  validateMealTimingInput,
  validateMealTimingOutput
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MealTimingContract;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.MealTimingContract = MealTimingContract;
}
