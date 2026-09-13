/**
 * domain/solver/foodSolverPolicy.js
 * 
 * Política Numérica, Função de Custo e Parâmetros do Food Solver — NutriAx Pro.
 * Fase N3.2 — Food Solver Determinístico Canônico.
 * 
 * Camada Pura — Sem I/O de infraestrutura, sem dependências remotas, determinismo total.
 * 
 * Princípios:
 * 1. DESACOPLAMENTO CLÍNICO: Parâmetros numéricos são limites computacionais do algoritmo,
 *    NUNCA recomendações clínicas ou prescrições fixas.
 * 2. DETERMINISMO ESTÓICO: Comportamento 100% reproduzível e auditável.
 * 3. PREVENÇÃO DE DIVISÃO POR ZERO: normalizedNutrientError seguro para target === 0.
 * 4. SEPARAÇÃO ENERGÉTICA: Fibras não entram na soma de calorias (4P + 4C + 9G).
 */

'use strict';

const FoodSolverContract = require('../contracts/FoodSolverContract');
const { deepFreeze } = FoodSolverContract;

/**
 * Papéis de Busca Computacional (Solver Search Roles)
 * Baseados estritamente em critérios objetivos físico-químicos centesimais (por 100g)
 */
const SEARCH_ROLES = Object.freeze({
  ROLE_PROTEIN_DENSE: 'ROLE_PROTEIN_DENSE',
  ROLE_CARB_DENSE: 'ROLE_CARB_DENSE',
  ROLE_FAT_DENSE: 'ROLE_FAT_DENSE',
  ROLE_FIBER_VOLUME: 'ROLE_FIBER_VOLUME',
  ROLE_BALANCED: 'ROLE_BALANCED'
});

/**
 * Política padrão do Food Solver (totalmente congelada)
 */
const DEFAULT_FOOD_SOLVER_POLICY = Object.freeze({
  policyVersion: '1.0.0',
  solverVersion: 'N3.2.0',

  // Pesos da função de custo
  weights: Object.freeze({
    calories: 1.0,
    protein: 1.2,
    carbohydrate: 1.0,
    fat: 1.0,
    fiber: 0.5
  }),

  // Escalas de normalização para targets nulos ou muito baixos (evita divisão por zero)
  fallbackScales: Object.freeze({
    calories: 100.0,    // kcal
    protein: 10.0,      // g
    carbohydrate: 15.0, // g
    fat: 5.0,           // g
    fiber: 5.0          // g
  }),

  // Tolerâncias de aceitação para status PASS vs WARNING
  tolerances: Object.freeze({
    caloriesKcal: 25.0,
    proteinG: 3.0,
    carbohydrateG: 5.0,
    fatG: 2.5,
    fiberG: 3.0
  }),

  // Limites computacionais de busca (NÃO são recomendações clínicas)
  searchBounds: Object.freeze({
    minGramsPerItem: 10.0,
    maxGramsPerItem: 450.0,
    stepGrams: 5.0,
    targetItemCountMin: 3,
    targetItemCountMax: 7
  }),

  // Limites para redução determinística do espaço de busca
  candidateLimits: Object.freeze({
    perSearchRole: 4,
    globalCandidateLimit: 20
  }),

  // Parâmetros de iteração do algoritmo
  convergence: Object.freeze({
    maxIterations: 150,
    minCostImprovement: 1e-4
  }),

  // Hierarquia determinística de desempate
  tieBreakOrder: Object.freeze([
    'LOWEST_COST',
    'CONSISTENT_STATUS_COUNT',
    'SMALLEST_ITEM_COUNT',
    'LEXICOGRAPHICAL_FOOD_ID'
  ]),

  // Opções de elegibilidade integradas
  eligibility: Object.freeze({
    allowReviewStatus: true,
    allowInconsistentStatus: false
  })
});

/**
 * Normaliza o erro de desvio com segurança estrita contra divisão por zero
 * @param {number} delta Diferença (entregue - meta)
 * @param {number} target Meta numérica (pode ser 0)
 * @param {number} fallbackScale Escala de referência técnica da política
 * @returns {number}
 */
function normalizedNutrientError(delta, target, fallbackScale) {
  if (typeof delta !== 'number' || !Number.isFinite(delta)) {
    return 0;
  }
  const tgt = typeof target === 'number' && Number.isFinite(target) ? target : 0;
  const scale = typeof fallbackScale === 'number' && Number.isFinite(fallbackScale) && fallbackScale > 0 ? fallbackScale : 10.0;

  if (tgt > 0) {
    return Math.pow(delta / tgt, 2);
  }
  // Se target === 0
  if (Math.abs(delta) < 1e-9) {
    return 0;
  }
  return Math.pow(delta / scale, 2);
}

/**
 * Calcula a perda nutricional multidimensional ponderada
 * @param {Object} totals Nutrientes entregues { calories, protein, carbohydrate, fat, fiber }
 * @param {Object} targets Metas { calories, protein, carbohydrate, fat, fiber }
 * @param {Object} weights Pesos { calories, protein, carbohydrate, fat, fiber }
 * @param {Object} fallbackScales Escalas { calories, protein, carbohydrate, fat, fiber }
 * @returns {{ totalCost: number, errors: Object, diffs: Object }}
 */
function calculateNutrientLoss(totals, targets, weights = DEFAULT_FOOD_SOLVER_POLICY.weights, fallbackScales = DEFAULT_FOOD_SOLVER_POLICY.fallbackScales) {
  const diffs = {
    calories: (totals.calories || 0) - (targets.calories || 0),
    protein: (totals.protein || 0) - (targets.protein || 0),
    carbohydrate: (totals.carbohydrate || 0) - (targets.carbohydrate || 0),
    fat: (totals.fat || 0) - (targets.fat || 0),
    fiber: (totals.fiber || 0) - (targets.fiber || 0)
  };

  const errKcal = normalizedNutrientError(diffs.calories, targets.calories, fallbackScales.calories);
  const errProt = normalizedNutrientError(diffs.protein, targets.protein, fallbackScales.protein);
  const errCarb = normalizedNutrientError(diffs.carbohydrate, targets.carbohydrate, fallbackScales.carbohydrate);
  const errFat = normalizedNutrientError(diffs.fat, targets.fat, fallbackScales.fat);
  const errFiber = normalizedNutrientError(diffs.fiber, targets.fiber, fallbackScales.fiber);

  const totalCost = 
    (weights.calories || 1.0) * errKcal +
    (weights.protein || 1.0) * errProt +
    (weights.carbohydrate || 1.0) * errCarb +
    (weights.fat || 1.0) * errFat +
    (weights.fiber || 0.5) * errFiber;

  return {
    totalCost,
    errors: {
      calories: errKcal,
      protein: errProt,
      carbohydrate: errCarb,
      fat: errFat,
      fiber: errFiber
    },
    diffs
  };
}

/**
 * Determina o papel computacional de busca (Search Role) de um alimento
 * Baseado estritamente em critérios objetivos centesimais (por 100g)
 * @param {Object} food 
 * @returns {string} SEARCH_ROLES
 */
function assignSearchRole(food) {
  if (!food) return SEARCH_ROLES.ROLE_BALANCED;

  const prot = Number(food.protein || 0);
  const carb = Number(food.carbohydrate || 0);
  const fat = Number(food.lipid || 0);
  const kcal = Number(food.calories || 0);
  const fiber = Number(food.fiber || 0);

  // Energia por macros
  const protKcal = prot * 4;
  const carbKcal = carb * 4;
  const fatKcal = fat * 9;
  const totalMacroKcal = protKcal + carbKcal + fatKcal;

  if (totalMacroKcal > 0) {
    const protRatio = protKcal / totalMacroKcal;
    const carbRatio = carbKcal / totalMacroKcal;
    const fatRatio = fatKcal / totalMacroKcal;

    if (protRatio >= 0.35 || prot >= 12) {
      return SEARCH_ROLES.ROLE_PROTEIN_DENSE;
    }
    if (carbRatio >= 0.50 || carb >= 18) {
      return SEARCH_ROLES.ROLE_CARB_DENSE;
    }
    if (fatRatio >= 0.40 || fat >= 12) {
      return SEARCH_ROLES.ROLE_FAT_DENSE;
    }
  }

  if (fiber >= 3.0 || (kcal > 0 && kcal <= 60)) {
    return SEARCH_ROLES.ROLE_FIBER_VOLUME;
  }

  return SEARCH_ROLES.ROLE_BALANCED;
}

module.exports = {
  SEARCH_ROLES,
  DEFAULT_FOOD_SOLVER_POLICY,
  normalizedNutrientError,
  calculateNutrientLoss,
  assignSearchRole
};
