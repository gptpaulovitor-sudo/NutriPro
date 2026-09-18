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
  4: Object.freeze([MEAL_ROLES.SECONDARY, MEAL_ROLES.PRIMARY, MEAL_ROLES.SNACK, MEAL_ROLES.PRIMARY]),
  5: Object.freeze([MEAL_ROLES.SECONDARY, MEAL_ROLES.SNACK, MEAL_ROLES.PRIMARY, MEAL_ROLES.SNACK, MEAL_ROLES.PRIMARY]),
  6: Object.freeze([MEAL_ROLES.SECONDARY, MEAL_ROLES.SNACK, MEAL_ROLES.PRIMARY, MEAL_ROLES.SNACK, MEAL_ROLES.SNACK, MEAL_ROLES.PRIMARY]),
  7: Object.freeze([MEAL_ROLES.SECONDARY, MEAL_ROLES.SNACK, MEAL_ROLES.PRIMARY, MEAL_ROLES.SNACK, MEAL_ROLES.SNACK, MEAL_ROLES.PRIMARY, MEAL_ROLES.FLEXIBLE]),
  8: Object.freeze([MEAL_ROLES.SECONDARY, MEAL_ROLES.SNACK, MEAL_ROLES.PRIMARY, MEAL_ROLES.SNACK, MEAL_ROLES.SNACK, MEAL_ROLES.SNACK, MEAL_ROLES.PRIMARY, MEAL_ROLES.FLEXIBLE])
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
      context.preferences && context.preferences.mealFrequency,
      context.options && context.options.mealCount,
      context.options && context.options.mealsPerDay,
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

/**
 * Calcula a penalidade determinística de afinidade gastronômica
 * entre um alimento e o papel estrutural da refeição.
 * Função 100% pura, estóica e determinística.
 * 
 * @param {string} foodName Nome do alimento
 * @param {string} mealRole Papel computacional da refeição (PRIMARY, SECONDARY, SNACK, FLEXIBLE)
 * @param {number} mealIndex Índice da refeição (0 a totalMeals - 1)
 * @param {number} totalMeals Quantidade total de refeições do plano
 * @returns {number} Penalidade a ser somada ao custo (0 = combinação ideal)
 */
function calculateFoodMealAffinityPenalty(foodName, mealRole, mealIndex, totalMeals) {
  if (!foodName || totalMeals <= 1) return 0;
  const name = String(foodName).toLowerCase();

  let mealType = 'MAIN';

  if (mealRole === 'SECONDARY' || (totalMeals >= 4 && mealIndex === 0) || (totalMeals === 3 && mealIndex === 2)) {
    mealType = 'BREAKFAST';
  } else if (mealRole === 'SNACK' || mealRole === 'FLEXIBLE') {
    mealType = 'SNACK';
  } else if (mealRole === 'PRIMARY') {
    mealType = 'MAIN';
  }

  // 1. REFEIÇÕES PRINCIPAIS (Almoço / Jantar - PRIMARY)
  if (mealType === 'MAIN') {
    // Alimentos matinais/lanches são proibidos em almoço e jantar tradicional
    if (/aveia|granola|farelo\s+de\s+aveia/i.test(name)) return 500.0;
    if (/iogurte|leite\s+em\s+p[oó]|whey/i.test(name)) return 250.0;
    if (/caf[eé]/i.test(name)) return 50.0;
    if (/banana|ma[cç][aã]|mam[aã]o|morango|melancia|abacaxi|uva|laranja/i.test(name)) return 15.0;
    return 0;
  }

  // 2. REFEICAO MATINAL (Café da Manhã - SECONDARY)
  if (mealType === 'BREAKFAST') {
    // Comida pesada de almoço/jantar é proibida no café da manhã
    if (/feij[aã]o|lentilha|gr[aã]o-de-bico/i.test(name)) return 500.0;
    if (/arroz/i.test(name)) return 300.0;
    if (/peixe|til[aá]pia|merluza|pescada|salm[aã]o/i.test(name)) return 250.0;
    if (/carne|patinho|alcatra|maminha|m[uú]sculo|ac[eé]m|bife|costela|su[ií]n/i.test(name)) return 250.0;
    if (/br[oó]colis|couve-flor|abobrinha|chuchu|quiabo|vagem|cenoura/i.test(name)) return 100.0;
    if (/frango/i.test(name)) return 40.0;
    if (/azeite/i.test(name)) return 20.0;
    return 0;
  }

  // 3. REFEIÇÕES INTERMEDIÁRIAS (SNACK / FLEXIBLE)
  if (mealType === 'SNACK') {
    if (/feij[aã]o|lentilha|gr[aã]o-de-bico/i.test(name)) return 500.0;
    if (/arroz/i.test(name)) return 300.0;
    if (/br[oó]colis|couve-flor|abobrinha|chuchu|legumes/i.test(name)) return 200.0;
    if (/carne|patinho|alcatra|maminha|bife|peixe|til[aá]pia/i.test(name)) return 100.0;
    if (/azeite/i.test(name)) return 10.0;
    return 0;
  }

  return 0;
}

/**
 * Calcula penalidade culinária para combinações incompatíveis no mesmo prato.
 * Exemplo: abacate com manteiga, aveia com azeite, arroz com iogurte/whey.
 * 
 * @param {Array<string>} existingFoodNames Nomes dos alimentos já presentes na refeição
 * @param {string} candidateFoodName Nome do alimento sendo avaliado para adição
 * @returns {number} Penalidade a ser somada ao custo de alocação (0 = combinação harmônica)
 */
function calculateMealCulinaryClashPenalty(existingFoodNames, candidateFoodName) {
  if (!Array.isArray(existingFoodNames) || existingFoodNames.length === 0 || !candidateFoodName) return 0;
  const cand = String(candidateFoodName).toLowerCase();
  let penalty = 0;

  for (let i = 0; i < existingFoodNames.length; i++) {
    const exist = String(existingFoodNames[i]).toLowerCase();

    // 1. Aberração de gorduras: Abacate + Manteiga (+500.0)
    const hasAvocado = /abacate/i.test(exist) || /abacate/i.test(cand);
    const hasButter = /(^|[^\w])manteiga/i.test(exist) || /(^|[^\w])manteiga/i.test(cand);
    if (hasAvocado && hasButter) {
      penalty += 500.0;
    }

    // 2. Azeite com Aveia / Granola (+500.0)
    const hasOliveOil = /azeite/i.test(exist) || /azeite/i.test(cand);
    const hasOats = /aveia|granola/i.test(exist) || /aveia|granola/i.test(cand);
    if (hasOliveOil && hasOats) {
      penalty += 500.0;
    }

    // 3. Arroz ou Feijão com Iogurte / Whey (+500.0)
    const hasRiceOrBeans = /arroz|feij[aã]o/i.test(exist) || /arroz|feij[aã]o/i.test(cand);
    const hasDairySweet = /iogurte|whey|leite\s+em\s+p[oó]/i.test(exist) || /iogurte|whey|leite\s+em\s+p[oó]/i.test(cand);
    if (hasRiceOrBeans && hasDairySweet) {
      penalty += 500.0;
    }

    // 4. Azeite com Abacate (+150.0) — evita misturar duas gorduras densas de origens díspares
    if (hasOliveOil && hasAvocado) {
      penalty += 150.0;
    }

    // 5. Azeite com Manteiga (+100.0) — redundância de gorduras puras adicionadas no mesmo prato
    if (hasOliveOil && hasButter) {
      penalty += 100.0;
    }
  }

  return penalty;
}

module.exports = deepFreeze({
  ROLE_ARCHETYPES,
  ROLE_ENERGY_WEIGHTS,
  FALLBACK_SCALES,
  DEFAULT_MEAL_ASSEMBLY_POLICY,
  resolveMealCount,
  resolveMealRoles,
  calculateTargetRatios,
  calculateAssemblyCost,
  calculateFoodMealAffinityPenalty,
  calculateMealCulinaryClashPenalty
});
