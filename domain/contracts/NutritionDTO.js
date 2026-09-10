/**
 * domain/contracts/NutritionDTO.js
 * 
 * Contrato Canônico de Contexto Energético e Nutricional Relevante à Performance.
 * Camada de Domínio Puro — Sem DOM, Sem Dexie, Sem Firebase, Sem IA.
 */

/**
 * Validação determinística de NutritionDTO
 * @param {Object} nutrition
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateNutritionDTO(nutrition) {
  const errors = [];

  if (!nutrition || typeof nutrition !== 'object' || Array.isArray(nutrition)) {
    return { isValid: false, errors: ['NutritionDTO deve ser um objeto.'] };
  }

  // patientId: opcional ou obrigatório dependendo do contexto, se fornecido deve ser string
  if (nutrition.patientId != null && typeof nutrition.patientId !== 'string') {
    errors.push('Campo "patientId", quando informado, deve ser uma string.');
  }

  // tmbKcal: opcional, se fornecido deve ser número finito >= 0
  if (nutrition.tmbKcal != null) {
    if (typeof nutrition.tmbKcal !== 'number' || isNaN(nutrition.tmbKcal) || nutrition.tmbKcal < 0 || nutrition.tmbKcal > 10000) {
      errors.push('Campo "tmbKcal", quando informado, deve ser um número finito entre 0 e 10000 kcal.');
    }
  }

  // getKcal: opcional, se fornecido deve ser número finito >= 0
  if (nutrition.getKcal != null) {
    if (typeof nutrition.getKcal !== 'number' || isNaN(nutrition.getKcal) || nutrition.getKcal < 0 || nutrition.getKcal > 15000) {
      errors.push('Campo "getKcal", quando informado, deve ser um número finito entre 0 e 15000 kcal.');
    }
  }

  // activityFactor: opcional, se fornecido deve ser número positivo plausível (1.0 a 3.0)
  if (nutrition.activityFactor != null) {
    if (typeof nutrition.activityFactor !== 'number' || isNaN(nutrition.activityFactor) || nutrition.activityFactor < 0.8 || nutrition.activityFactor > 3.0) {
      errors.push('Campo "activityFactor", quando informado, deve ser um número entre 0.8 e 3.0.');
    }
  }

  // caloricTargetKcal: opcional, se fornecido deve ser número finito >= 0
  if (nutrition.caloricTargetKcal != null) {
    if (typeof nutrition.caloricTargetKcal !== 'number' || isNaN(nutrition.caloricTargetKcal) || nutrition.caloricTargetKcal < 0 || nutrition.caloricTargetKcal > 15000) {
      errors.push('Campo "caloricTargetKcal", quando informado, deve ser um número finito entre 0 e 15000 kcal.');
    }
  }

  // energyBalanceKcal: opcional, pode ser negativo (déficit) ou positivo (superávit)
  if (nutrition.energyBalanceKcal != null) {
    if (typeof nutrition.energyBalanceKcal !== 'number' || isNaN(nutrition.energyBalanceKcal) || Math.abs(nutrition.energyBalanceKcal) > 10000) {
      errors.push('Campo "energyBalanceKcal", quando informado, deve ser um número finito razoável.');
    }
  }

  // proteinGPerKg: opcional, se fornecido deve ser número finito >= 0
  if (nutrition.proteinGPerKg != null) {
    if (typeof nutrition.proteinGPerKg !== 'number' || isNaN(nutrition.proteinGPerKg) || nutrition.proteinGPerKg < 0 || nutrition.proteinGPerKg > 10.0) {
      errors.push('Campo "proteinGPerKg", quando informado, deve ser um número entre 0 e 10.0 g/kg.');
    }
  }

  // prescribedKcal: opcional, se fornecido deve ser número finito >= 0
  if (nutrition.prescribedKcal != null) {
    if (typeof nutrition.prescribedKcal !== 'number' || isNaN(nutrition.prescribedKcal) || nutrition.prescribedKcal < 0 || nutrition.prescribedKcal > 15000) {
      errors.push('Campo "prescribedKcal", quando informado, deve ser um número finito entre 0 e 15000 kcal.');
    }
  }

  // nutritionObjective: opcional, se fornecido deve ser string
  if (nutrition.nutritionObjective != null && typeof nutrition.nutritionObjective !== 'string') {
    errors.push('Campo "nutritionObjective", quando informado, deve ser uma string.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Cria uma instância validada ou normalizada de NutritionDTO
 * @param {Object} data
 * @returns {Readonly<Object>}
 */
function createNutritionDTO(data = {}) {
  const parseNum = (val, decimals = 0) => {
    if (val == null) return null;
    const n = Number(val);
    return !isNaN(n) ? Number(n.toFixed(decimals)) : null;
  };

  const dto = {
    patientId: data.patientId != null ? String(data.patientId).trim() : null,
    tmbKcal: parseNum(data.tmbKcal, 0),
    getKcal: parseNum(data.getKcal, 0),
    activityFactor: parseNum(data.activityFactor, 2),
    caloricTargetKcal: parseNum(data.caloricTargetKcal, 0),
    energyBalanceKcal: parseNum(data.energyBalanceKcal, 0),
    proteinGPerKg: parseNum(data.proteinGPerKg, 2),
    prescribedKcal: parseNum(data.prescribedKcal, 0),
    nutritionObjective: data.nutritionObjective != null ? String(data.nutritionObjective).trim() : null
  };

  return Object.freeze(dto);
}

// Suporte a CommonJS e navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateNutritionDTO,
    createNutritionDTO
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.NutritionDTO = {
    validateNutritionDTO,
    createNutritionDTO
  };
}
