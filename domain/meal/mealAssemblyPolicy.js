/**
 * domain/meal/mealAssemblyPolicy.js
 * 
 * Política de Montagem e Distribuição de Refeições — NutriAx Pro.
 * Fase N3.3 — Meal Assembly Determinístico Canônico.
 * 
 * Camada Pura — Sem I/O, sem UI, sem termos clínicos/temporais.
 */

'use strict';

const MealAssemblyContract = require('../contracts/MealAssemblyContract');
const { MEAL_ROLES, deepFreeze } = MealAssemblyContract;

/**
 * Papéis computacionais padronizados por número de refeições (M de 1 a 8)
 */
const ROLE_ARCHETYPES = Object.freeze({
  1: Object.freeze([MEAL_ROLES.PRIMARY]),
  2: Object.freeze([MEAL_ROLES.PRIMARY, MEAL_ROLES.PRIMARY]),
  3: Object.freeze([MEAL_ROLES.PRIMARY, MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY]),
  4: Object.freeze([MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY]),
  5: Object.freeze([MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.SNACK]),
  6: Object.freeze([MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.SNACK, MEAL_ROLES.FLEXIBLE]),
  7: Object.freeze([MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.SNACK, MEAL_ROLES.FLEXIBLE, MEAL_ROLES.FLEXIBLE]),
  8: Object.freeze([MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.SNACK, MEAL_ROLES.SNACK, MEAL_ROLES.FLEXIBLE, MEAL_ROLES.FLEXIBLE])
});

/**
 * Pesos computacionais dos papéis para cálculo de meta relativa por refeição
 */
const ROLE_ENERGY_WEIGHTS = Object.freeze({
  [MEAL_ROLES.PRIMARY]: 1.25,
  [MEAL_ROLES.SECONDARY]: 0.85,
  [MEAL_ROLES.SNACK]: 0.50,
  [MEAL_ROLES.FLEXIBLE]: 0.70
});

/**
 * Escalas de referência para normalização segura contra divisão por zero
 */
const FALLBACK_SCALES = Object.freeze({
  calories: 100.0,
  protein: 10.0,
  carbohydrate: 10.0,
  fat: 5.0,
  fiber: 5.0
});

/**
 * Política padrão de montagem determinística de refeições
 */
const DEFAULT_MEAL_ASSEMBLY_POLICY = Object.freeze({
  policyVersion: '1.0.0',
  assemblyVersion: 'N3.3.0',

  // Limites computacionais de refeições diárias
  defaultMealCount: 3,
  minMealCount: 1,
  maxMealCount: 8,

  /**
   * Critério operacional de preferência para evitar fragmentação excessiva de alimentos.
   * Não constitui limite clínico ou fisiológico.
   */
  minimumPreferredSplitMass: 80.0,

  /**
   * Limite máximo de fragmentações por item (um item é colocado em no máximo 2 refeições)
   */
  maxSplitsPerItem: 2,

  /**
   * Pesos da função de custo de assembly:
   * J = w_cal * E_cal + w_prot * E_prot + w_carb * E_carb + w_fat * E_fat + w_frag * N_splits
   */
  weights: Object.freeze({
    w_cal: 1.0,
    w_prot: 1.5,
    w_carb: 1.0,
    w_fat: 1.2,
    w_frag: 0.5
  }),

  /**
   * Tolerância de conservação numérica (flutuante residual máximo)
   */
  tolerances: Object.freeze({
    massGram: 0.01,
    caloriesKcal: 0.05,
    macronutrientGram: 0.05
  }),

  /**
   * Ordem estóica e determinística de desempate de distribuições
   */
  tieBreakOrder: Object.freeze([
    'LOWEST_COST',
    'FEWEST_SPLITS',
    'LEXICOGRAPHICAL_ALLOCATION'
  ])
});

/**
 * Resolve determinística e estruturadamente o número de refeições do paciente
 * @param {Object} context Contexto nutricional canônico
 * @param {Object} [policy] Política de assembly
 * @returns {{ mealCount: number, isFromContext: boolean, warning: string|null }}
 */
function resolveMealCount(context, policy = DEFAULT_MEAL_ASSEMBLY_POLICY) {
  const minM = policy.minMealCount || 1;
  const maxM = policy.maxMealCount || 8;
  const defaultM = policy.defaultMealCount || 3;

  if (context && typeof context === 'object') {
    // Busca em propriedades estruturadas canônicas de rotina
    const candidates = [
      context.patient && context.patient.routine && context.patient.routine.mealsPerDay,
      context.patient && context.patient.routine && context.patient.routine.mealCount,
      context.routine && context.routine.mealsPerDay,
      context.routine && context.routine.mealCount,
      context.mealsPerDay,
      context.mealCount
    ];

    for (let i = 0; i < candidates.length; i++) {
      const val = candidates[i];
      if (typeof val === 'number' && Number.isInteger(val) && val >= minM && val <= maxM) {
        return {
          mealCount: val,
          isFromContext: true,
          warning: null
        };
      }
    }
  }

  // Fallback operacional documentado
  return {
    mealCount: defaultM,
    isFromContext: false,
    warning: `Número formal de refeições ausente ou inválido no contexto. Utilizado fallback computacional versionado de política (${defaultM} refeições).`
  };
}

/**
 * Retorna os papéis computacionais para uma dada quantidade de refeições M
 * @param {number} mealCount 
 * @returns {Array<string>}
 */
function resolveMealRoles(mealCount) {
  const m = Math.max(1, Math.min(8, Math.round(mealCount)));
  return ROLE_ARCHETYPES[m] || new Array(m).fill(MEAL_ROLES.PRIMARY);
}

/**
 * Calcula as frações relativas alvo de nutrientes para cada refeição com base nos papéis
 * @param {Array<string>} roles 
 * @returns {Array<number>} Proporções que somam 1.0
 */
function calculateTargetRatios(roles) {
  const weights = roles.map((r) => ROLE_ENERGY_WEIGHTS[r] || 1.0);
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  if (totalWeight <= 0) {
    return roles.map(() => 1 / roles.length);
  }
  return weights.map((w) => w / totalWeight);
}

/**
 * Calcula o custo determinístico de uma configuração de refeições:
 * J = w_cal * E_cal + w_prot * E_prot + w_carb * E_carb + w_fat * E_fat + w_frag * N_splits
 * 
 * @param {Array<Object>} mealTotals Totais atuais calculados de cada refeição
 * @param {Object} globalTotals Totais globais fornecidos pelo N3.2
 * @param {Array<number>} targetRatios Frações alvo por refeição
 * @param {Object} weights Pesos da função de custo
 * @param {number} totalSplits Número total de fragmentações realizadas
 * @returns {{ totalCost: number, eCal: number, eProt: number, eCarb: number, eFat: number, splitPenalty: number }}
 */
function calculateAssemblyCost(mealTotals, globalTotals, targetRatios, weights = DEFAULT_MEAL_ASSEMBLY_POLICY.weights, totalSplits = 0) {
  const m = mealTotals.length;
  if (m <= 1) {
    return { totalCost: 0, eCal: 0, eProt: 0, eCarb: 0, eFat: 0, splitPenalty: 0 };
  }

  const nutrients = [
    { key: 'calories', targetKey: 'calories', w: weights.w_cal, scale: FALLBACK_SCALES.calories },
    { key: 'protein', targetKey: 'protein', w: weights.w_prot, scale: FALLBACK_SCALES.protein },
    { key: 'carbohydrate', targetKey: 'carbohydrate', w: weights.w_carb, scale: FALLBACK_SCALES.carbohydrate },
    { key: 'lipid', targetKey: 'fat', w: weights.w_fat, scale: FALLBACK_SCALES.fat }
  ];

  let nutrientErrorTotal = 0;
  const errors = {};

  nutrients.forEach((n) => {
    const globalTotal = globalTotals[n.targetKey] !== undefined ? globalTotals[n.targetKey] : (globalTotals[n.key] || 0);
    let sumSquaredError = 0;

    for (let i = 0; i < m; i++) {
      const mealActual = mealTotals[i] ? (mealTotals[i][n.key] || 0) : 0;
      const mealExpected = globalTotal * targetRatios[i];
      const delta = mealActual - mealExpected;
      const divisor = mealExpected > 1e-4 ? mealExpected : n.scale;
      const normalizedErr = delta / divisor;
      sumSquaredError += normalizedErr * normalizedErr;
    }

    const meanSquaredErr = sumSquaredError / m;
    errors[n.key] = meanSquaredErr;
    nutrientErrorTotal += n.w * meanSquaredErr;
  });

  const splitPenalty = (weights.w_frag || 0) * totalSplits;
  const totalCost = nutrientErrorTotal + splitPenalty;

  return {
    totalCost,
    eCal: errors.calories || 0,
    eProt: errors.protein || 0,
    eCarb: errors.carbohydrate || 0,
    eFat: errors.lipid || 0,
    splitPenalty
  };
}

module.exports = deepFreeze({
  ROLE_ARCHETYPES,
  ROLE_ENERGY_WEIGHTS,
  FALLBACK_SCALES,
  DEFAULT_MEAL_ASSEMBLY_POLICY,
  resolveMealCount,
  resolveMealRoles,
  calculateTargetRatios,
  calculateAssemblyCost
});
