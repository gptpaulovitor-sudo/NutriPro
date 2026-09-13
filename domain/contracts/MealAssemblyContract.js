/**
 * domain/contracts/MealAssemblyContract.js
 * 
 * Contrato Canônico de Entrada e Saída do Meal Assembly — NutriAx Pro.
 * Fase N3.3 — Meal Assembly Determinístico Canônico.
 * 
 * Camada Pura — Sem I/O, sem UI, sem dependências externas.
 */

'use strict';

const MEAL_ASSEMBLY_CONTRACT_VERSION = '1.0.0';

/**
 * Status formais de saída do Meal Assembly
 */
const ASSEMBLY_STATUS = Object.freeze({
  PASS: 'PASS',
  WARNING: 'WARNING',
  NO_SOLUTION: 'NO_SOLUTION',
  BLOCKED: 'BLOCKED'
});

/**
 * Papéis computacionais de refeição (não clínicos, não temporais)
 */
const MEAL_ROLES = Object.freeze({
  PRIMARY: 'PRIMARY',
  SECONDARY: 'SECONDARY',
  SNACK: 'SNACK',
  FLEXIBLE: 'FLEXIBLE'
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
 * Extrai deterministicamente a lista canônica de itens da solução global do N3.2
 * @param {Object} foodSolverResult 
 * @returns {Array<Object>} Lista normalizada de itens globais
 */
function extractGlobalSolutionItems(foodSolverResult) {
  if (!foodSolverResult || typeof foodSolverResult !== 'object') {
    return [];
  }

  let rawItems = [];

  // Forma 1: foodSolverResult.items explícito no contrato
  if (Array.isArray(foodSolverResult.items) && foodSolverResult.items.length > 0) {
    rawItems = foodSolverResult.items;
  }
  // Forma 2: foodSolverResult.meals canônico do N3.2 (ex: meals[0].items ou flatten de meals)
  else if (Array.isArray(foodSolverResult.meals) && foodSolverResult.meals.length > 0) {
    for (let m = 0; m < foodSolverResult.meals.length; m++) {
      const meal = foodSolverResult.meals[m];
      if (meal && Array.isArray(meal.items)) {
        rawItems.push(...meal.items);
      }
    }
  }

  const normalized = [];
  for (let i = 0; i < rawItems.length; i++) {
    const it = rawItems[i];
    if (!it || typeof it !== 'object') continue;

    const foodId = String(it.foodId || it.id || '').trim();
    const foodName = String(it.foodName || it.name || '').trim();
    const rawGrams = it.grams !== undefined ? it.grams : it.quantity;
    const grams = typeof rawGrams === 'number' && Number.isFinite(rawGrams) ? rawGrams : 0;
    const unit = String(it.unit || 'g').trim();

    const rawNutrients = it.nutrients || {};
    const calories = typeof rawNutrients.calories === 'number' && Number.isFinite(rawNutrients.calories) ? rawNutrients.calories : 0;
    const protein = typeof rawNutrients.protein === 'number' && Number.isFinite(rawNutrients.protein) ? rawNutrients.protein : 0;
    const carbohydrate = typeof rawNutrients.carbohydrate === 'number' && Number.isFinite(rawNutrients.carbohydrate) ? rawNutrients.carbohydrate : 0;
    const lipidVal = rawNutrients.lipid !== undefined ? rawNutrients.lipid : rawNutrients.fat;
    const lipid = typeof lipidVal === 'number' && Number.isFinite(lipidVal) ? lipidVal : 0;
    const fiber = typeof rawNutrients.fiber === 'number' && Number.isFinite(rawNutrients.fiber) ? rawNutrients.fiber : 0;

    // Preservação de dados ausentes de sódio (não converter null/undefined para zero)
    let sodium = null;
    if (typeof rawNutrients.sodium === 'number' && Number.isFinite(rawNutrients.sodium)) {
      sodium = rawNutrients.sodium;
    }

    normalized.push({
      foodId,
      foodName,
      grams,
      unit,
      nutrients: {
        calories,
        protein,
        carbohydrate,
        lipid,
        fiber,
        sodium
      },
      provenance: it.provenance || null
    });
  }

  return deepFreeze(normalized);
}

/**
 * Valida o Contrato de Entrada MealAssemblyInputDTO
 * @param {Object} input 
 * @returns {{ isValid: boolean, isBlocked: boolean, isNoSolution: boolean, errors: string[] }}
 */
function validateMealAssemblyInput(input) {
  const errors = [];
  let isBlocked = false;
  let isNoSolution = false;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      isBlocked: true,
      isNoSolution: false,
      errors: ['Input de Meal Assembly deve ser um objeto válido e não-nulo.']
    };
  }

  // 1. Contexto Clínico Canônico
  if (!input.context || typeof input.context !== 'object') {
    errors.push('context é obrigatório e deve ser um objeto.');
    isBlocked = true;
  }

  // 2. Validador Nutricional N2.3 (Portão de Entrada Inegociável)
  if (!input.validationResult || typeof input.validationResult !== 'object') {
    errors.push('validationResult é obrigatório (portão de validação N2.3).');
    isBlocked = true;
  } else if (input.validationResult.valid !== true) {
    errors.push(`validationResult.valid deve ser true para avançar para montagem de refeições (status: ${input.validationResult.status || 'INVALID'}).`);
    isBlocked = true;
  }

  // 3. Resultado do Food Solver N3.2
  if (!input.foodSolverResult || typeof input.foodSolverResult !== 'object') {
    errors.push('foodSolverResult é obrigatório.');
    isBlocked = true;
  } else {
    const solverStatus = input.foodSolverResult.status;
    if (solverStatus === 'BLOCKED') {
      errors.push('foodSolverResult está com status BLOCKED.');
      isBlocked = true;
    } else if (solverStatus === 'NO_SOLUTION') {
      errors.push('foodSolverResult está com status NO_SOLUTION.');
      isNoSolution = true;
    } else if (solverStatus !== 'PASS' && solverStatus !== 'WARNING') {
      errors.push(`foodSolverResult possui status inválido ou desconhecido: ${solverStatus}.`);
      isBlocked = true;
    }

    // 4. Verificação dos itens produzidos pelo solver
    const items = extractGlobalSolutionItems(input.foodSolverResult);
    if (!isBlocked && !isNoSolution) {
      if (!Array.isArray(items) || items.length === 0) {
        errors.push('foodSolverResult não contém itens de alimentos válidos para montagem.');
        isBlocked = true;
      } else {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item.foodId || typeof item.foodId !== 'string') {
            errors.push(`Item de índice ${i} não possui foodId válido.`);
            isBlocked = true;
          }
          if (typeof item.grams !== 'number' || !Number.isFinite(item.grams) || item.grams <= 0) {
            errors.push(`Item '${item.foodId || i}' possui quantidade de massa inválida ou <= 0 (${item.grams}).`);
            isBlocked = true;
          }
          if (!item.nutrients || typeof item.nutrients !== 'object') {
            errors.push(`Item '${item.foodId || i}' não possui bloco de nutrientes válido.`);
            isBlocked = true;
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    isBlocked,
    isNoSolution,
    errors
  };
}

/**
 * Valida a estrutura de saída do MealAssemblyOutputDTO
 * @param {Object} output 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateMealAssemblyOutput(output) {
  const errors = [];

  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return { isValid: false, errors: ['Output de Meal Assembly deve ser um objeto válido.'] };
  }

  if (!output.assemblyVersion || typeof output.assemblyVersion !== 'string') {
    errors.push('assemblyVersion é obrigatório e deve ser uma string.');
  }

  if (!output.solverVersion || typeof output.solverVersion !== 'string') {
    errors.push('solverVersion é obrigatório e deve ser uma string informando a versão de origem do solver.');
  }

  if (!output.status || !Object.values(ASSEMBLY_STATUS).includes(output.status)) {
    errors.push(`status deve ser um dos valores: ${Object.values(ASSEMBLY_STATUS).join(', ')}.`);
  }

  if (typeof output.valid !== 'boolean') {
    errors.push('valid deve ser um booleano.');
  }

  if (!Array.isArray(output.meals)) {
    errors.push('meals deve ser um array de refeições.');
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
    errors.push('provenance deve ser um objeto com metadados de execução.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

const MealAssemblyContract = {
  CONTRACT_VERSION: MEAL_ASSEMBLY_CONTRACT_VERSION,
  ASSEMBLY_STATUS,
  MEAL_ROLES,
  deepFreeze,
  extractGlobalSolutionItems,
  validateMealAssemblyInput,
  validateMealAssemblyOutput
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MealAssemblyContract;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.MealAssemblyContract = MealAssemblyContract;
}
