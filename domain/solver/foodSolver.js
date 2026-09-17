/**
 * domain/solver/foodSolver.js
 * 
 * Motor Determinístico de Otimização e Fechamento Nutricional (Deterministic Bounded Nutrient Optimization).
 * Fase N3.2 — Food Solver Determinístico Canônico — NutriAx Pro.
 * 
 * Camada Pura — Sem I/O de infraestrutura, sem persistência externa, sem dependências remotas.
 * 
 * Princípios de Execução:
 * 1. PUREZA ABSOLUTA: Função pura sem efeitos colaterais.
 * 2. DETERMINISMO ESTÓICO: Comportamento 100% reproduzível e auditável.
 * 3. INVARIÂNCIA À ORDEM: A ordem do array de entrada não altera o resultado.
 * 4. PORTÃO ESTRITO: Exige validationResult.valid === true (Fase N2.3).
 * 5. SEPARAÇÃO ENERGÉTICA: Fibras não entram na soma calórica (4P + 4C + 9G).
 * 6. GOVERNANÇA DE REVISAR: Alimentos com status REVISAR NUNCA podem produzir status PASS.
 * 7. PRECISÃO MATEMÁTICA: Otimização contínua com ponto flutuante Float64; arredondamento na saída.
 */

'use strict';

const FoodSolverContract = require('../contracts/FoodSolverContract');
const {
  SOLVER_STATUS,
  validateFoodSolverInput,
  validateFoodSolverOutput,
  deepFreeze
} = FoodSolverContract;

const {
  adaptCatalogToCanonical,
  filterEligibleFoods,
  ELIGIBILITY_STATUS
} = require('./foodEligibility');

const {
  DEFAULT_FOOD_SOLVER_POLICY,
  SEARCH_ROLES,
  calculateNutrientLoss,
  assignSearchRole
} = require('./foodSolverPolicy');

/**
 * Arredonda valor para número específico de casas decimais
 * @param {number} val 
 * @param {number} decimals 
 * @returns {number}
 */
function roundTo(val, decimals = 2) {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

/**
 * Calcula os nutrientes fornecidos por um alimento em dada massa em gramas
 * @param {Object} food 
 * @param {number} grams 
 * @returns {{ calories: number, protein: number, carbohydrate: number, lipid: number, fiber: number, sodium: number }}
 */
function calculateFoodPortionNutrients(food, grams) {
  const baseQty = food.baseQuantity && food.baseQuantity > 0 ? food.baseQuantity : 100;
  const factor = grams / baseQty;

  const prot = (food.protein || 0) * factor;
  const carb = (food.carbohydrate || 0) * factor;
  const fat = (food.lipid || 0) * factor;
  const fib = (food.fiber || 0) * factor;
  const sod = (food.sodium || 0) * factor;

  // Energia canônica baseada estritamente em Atwater (4P + 4C + 9G) para consistência termodinâmica
  const cal = prot * 4 + carb * 4 + fat * 9;

  return {
    calories: cal,
    protein: prot,
    carbohydrate: carb,
    lipid: fat,
    fiber: fib,
    sodium: sod
  };
}

/**
 * Pontuação determinística de afinidade clínica e gastronômica por estilo e ciclo
 * @param {Object} food 
 * @param {string} role 
 * @param {Object} options 
 * @returns {number}
 */
function calculateClinicalStapleScore(food, role, options = {}) {
  const name = String(food.name || food.foodName || '').toLowerCase();
  let style = String(options.dietaryStyle || '').toLowerCase().replace(/[\s_-]/g, '');
  if (style === 'lowvab' || style === 'lowcarb') style = 'lowcarb';
  if (style === 'keto') style = 'cetogenica';
  if (style === 'while30') style = 'whole30';
  const cycle = String(options.dietaryCycle || '').toLowerCase();
  const includeSupplements = options.includeSupplements !== false;

  let score = 0;

  // 1. Pilares universais da alimentação clínica real brasileira
  if (/arroz/i.test(name)) score += 600;
  if (/feij[aã]o/i.test(name)) score += 600;
  if (/frango/i.test(name)) score += 550;
  if (/patinho|alcatra|maminha/i.test(name)) score += 500;
  if (/til[aá]pia|merluza|pescada/i.test(name)) score += 480;
  if (/salm[aã]o|sardinha|atum/i.test(name)) score += 470;
  if (/ovo\s+de\s+galinha|ovos/i.test(name)) score += 550;
  if (/clara/i.test(name)) score += 450;
  if (/batata\s+doce/i.test(name)) score += 500;
  if (/batata\s+inglesa/i.test(name)) score += 450;
  if (/mandioca|aipim/i.test(name)) score += 420;
  if (/aveia/i.test(name)) score += 500;
  if (/p[aã]o.*integral/i.test(name)) score += 480;
  if (/banana/i.test(name)) score += 450;
  if (/ma[cç][aã]/i.test(name)) score += 400;
  if (/mam[aã]o/i.test(name)) score += 400;
  if (/morango/i.test(name)) score += 420;
  if (/br[oó]colis/i.test(name)) score += 450;
  if (/salada|alface|tomate|pepino|espinafre/i.test(name)) score += 450;
  if (/azeite.*oliva/i.test(name)) score += 550;
  if (/castanha|nozes/i.test(name)) score += 450;
  if (/abacate/i.test(name)) score += 450;
  if (/iogurte/i.test(name)) score += 450;
  if (/cottage|minas|ricota/i.test(name)) score += 450;

  // 2. Modulações de Afinidade por Estilo & Ciclo
  if (style === 'tradicional') {
    if (/arroz/i.test(name)) score += 250;
    if (/feij[aã]o/i.test(name)) score += 250;
    if (/frango|patinho|ovo/i.test(name)) score += 200;
    if (/batata|p[aã]o/i.test(name)) score += 150;
    if (/banana|salada/i.test(name)) score += 150;
  } else if (style === 'fitness') {
    if (/frango|til[aá]pia|clara/i.test(name)) score += 300;
    if (/batata\s+doce|aveia/i.test(name)) score += 250;
    if (/whey/i.test(name)) score += (includeSupplements ? 350 : -9999);
    if (/br[oó]colis|salada/i.test(name)) score += 200;
    if (/pasta\s+de\s+amendoim/i.test(name)) score += 200;
  } else if (style === 'pratico') {
    if (/p[aã]o|iogurte|aveia|banana|ovo|cottage|minas/i.test(name)) score += 300;
    if (/whey/i.test(name)) score += (includeSupplements ? 300 : -9999);
    if (/atum/i.test(name)) score += 250;
  } else if (style === 'ovolacto' || style === 'plant_based') {
    if (/ovo|queijo|iogurte|leite/i.test(name)) score += 300;
    if (/feij[aã]o|lentilha|gr[aã]o-de-bico/i.test(name)) score += 300;
    if (/aveia|arroz|castanha|tofu/i.test(name)) score += 250;
    if (/frango|carne|peixe|su[ií]no/i.test(name)) score = -9999;
  } else if (style === 'cetogenica') {
    if (cycle === 'keto_ciclica_refeed') {
      if (/arroz|batata|aveia|frutas/i.test(name)) score += 400;
      if (/frango|til[aá]pia|clara/i.test(name)) score += 300;
    } else {
      if (/azeite.*oliva|castanha|abacate|manteiga/i.test(name)) score += 400;
      if (/ovo|frango|salm[aã]o|sardinha|patinho|queijo/i.test(name)) score += 350;
      if (/br[oó]colis|salada|abobrinha|espinafre/i.test(name)) score += 300;
      if (/arroz|feij[aã]o|p[aã]o|batata|aveia|tapioca|banana|ma[cç][aã]|mam[aã]o/i.test(name)) score = -9999;
    }
  } else if (style === 'lowcarb') {
    if (/ovo|frango|peixe|patinho|queijo/i.test(name)) score += 300;
    if (/azeite.*oliva|castanha|abacate/i.test(name)) score += 300;
    if (/br[oó]colis|salada|morango/i.test(name)) score += 250;
    if (/p[aã]o\s+franc[eê]s|tapioca/i.test(name)) score = -9999;
    if (cycle === 'lowcarb_restrita' && /arroz|feij[aã]o|batata/i.test(name)) score = -9999;
    if (cycle === 'lowcarb_moderada') {
      if (/batata\s+doce|aveia|arroz\s+integral/i.test(name)) score += 200;
    }
  } else if (style === 'dukan') {
    if (cycle === 'dukan_ataque' || cycle === 'dukan_cruzeiro_pp' || !cycle) {
      if (/frango|clara|ovo|patinho|til[aá]pia|merluza|sardinha|salm[aã]o|atum/i.test(name)) score += 500;
      if (/farelo\s+de\s+aveia/i.test(name)) score += 500;
      if (/cottage|ricota/i.test(name)) score += 300;
      if (/arroz|feij[aã]o|p[aã]o|batata|fruta|br[oó]colis|salada|azeite/i.test(name)) score = -9999;
    } else if (cycle === 'dukan_cruzeiro_pl') {
      if (/frango|patinho|til[aá]pia|merluza|sardinha|salm[aã]o|ovo|clara/i.test(name)) score += 500;
      if (/farelo\s+de\s+aveia/i.test(name)) score += 500;
      if (/br[oó]colis|salada|alface|tomate|pepino|abobrinha|espinafre/i.test(name)) score += 400;
      if (/arroz|feij[aã]o|p[aã]o|batata|fruta|azeite/i.test(name)) score = -9999;
    } else if (cycle === 'dukan_consolidacao') {
      if (/frango|patinho|peixe|ovo|farelo/i.test(name)) score += 400;
      if (/ma[cç][aã]|morango|p[aã]o.*integral/i.test(name)) score += 350;
    }
  } else if (style === 'whole30') {
    if (/ovo|frango|patinho|til[aá]pia|salm[aã]o|sardinha|merluza/i.test(name)) score += 400;
    if (/batata\s+doce|batata\s+inglesa|mandioca|aipim/i.test(name)) score += 350;
    if (/salada|br[oó]colis|abobrinha|espinafre|banana|ma[cç][aã]|mam[aã]o|morango/i.test(name)) score += 350;
    if (/azeite.*oliva|castanha|abacate/i.test(name)) score += 400;
    if (/arroz|aveia|p[aã]o|feij[aã]o|leite|queijo|iogurte|amendoim|whey/i.test(name)) score = -9999;
  }

  // Suplementos desativados
  if (!includeSupplements && /whey/i.test(name)) {
    score = -9999;
  }

  return score;
}

/**
 * Redução determinística e estável do espaço de busca
 * Agrupa por Search Roles e limita a K candidatos de alta relevância por papel
 * @param {Array<Object>} eligibleFoods 
 * @param {Object} policy 
 * @param {Object} [options]
 * @returns {Array<Object>} Candidatos selecionados para a busca combinatória
 */
function reduceSearchCandidates(eligibleFoods, policy, options = {}) {
  const perRoleLimit = policy.candidateLimits.perSearchRole || 4;
  const globalLimit = policy.candidateLimits.globalCandidateLimit || 20;

  const roleBuckets = {
    [SEARCH_ROLES.ROLE_PROTEIN_DENSE]: [],
    [SEARCH_ROLES.ROLE_CARB_DENSE]: [],
    [SEARCH_ROLES.ROLE_FAT_DENSE]: [],
    [SEARCH_ROLES.ROLE_FIBER_VOLUME]: [],
    [SEARCH_ROLES.ROLE_BALANCED]: []
  };

  // 1. Agrupar em buckets
  for (let i = 0; i < eligibleFoods.length; i++) {
    const food = eligibleFoods[i];
    const role = assignSearchRole(food);
    if (roleBuckets[role]) {
      roleBuckets[role].push(food);
    } else {
      roleBuckets[SEARCH_ROLES.ROLE_BALANCED].push(food);
    }
  }

  // 2. Ordenar deterministicamente cada bucket:
  // Critério:
  // a) Status bromatológico: CONSISTENTE antes de REVISAR
  // b) Pontuação de Afinidade Clínica e Estilo Gastronômico + Densidade de Papel
  // c) Desempate estrito por foodId lexicográfico
  const comparator = (role) => (a, b) => {
    const statusA = (a.bromatology && a.bromatology.energyStatus) || 'CONSISTENTE';
    const statusB = (b.bromatology && b.bromatology.energyStatus) || 'CONSISTENTE';
    if (statusA === 'CONSISTENTE' && statusB !== 'CONSISTENTE') return -1;
    if (statusA !== 'CONSISTENTE' && statusB === 'CONSISTENTE') return 1;

    const stapleA = calculateClinicalStapleScore(a, role, options);
    const stapleB = calculateClinicalStapleScore(b, role, options);

    let densityA = 0;
    let densityB = 0;
    if (role === SEARCH_ROLES.ROLE_PROTEIN_DENSE) {
      densityA = a.protein || 0;
      densityB = b.protein || 0;
    } else if (role === SEARCH_ROLES.ROLE_CARB_DENSE) {
      densityA = a.carbohydrate || 0;
      densityB = b.carbohydrate || 0;
    } else if (role === SEARCH_ROLES.ROLE_FAT_DENSE) {
      densityA = a.lipid || 0;
      densityB = b.lipid || 0;
    } else if (role === SEARCH_ROLES.ROLE_FIBER_VOLUME) {
      densityA = a.fiber || 0;
      densityB = b.fiber || 0;
    } else {
      densityA = a.calories || 0;
      densityB = b.calories || 0;
    }

    const totalA = stapleA + densityA;
    const totalB = stapleB + densityB;

    if (Math.abs(totalB - totalA) > 1e-5) {
      return totalB - totalA; // Maior pontuação total primeiro
    }

    // Desempate estável final
    return String(a.id || a.foodId).localeCompare(String(b.id || b.foodId));
  };

  const selectedCandidates = [];
  const rolesOrder = [
    SEARCH_ROLES.ROLE_PROTEIN_DENSE,
    SEARCH_ROLES.ROLE_CARB_DENSE,
    SEARCH_ROLES.ROLE_FAT_DENSE,
    SEARCH_ROLES.ROLE_FIBER_VOLUME,
    SEARCH_ROLES.ROLE_BALANCED
  ];

  rolesOrder.forEach((role) => {
    const bucket = roleBuckets[role];
    bucket.sort(comparator(role));
    const topFromRole = bucket.slice(0, perRoleLimit);
    topFromRole.forEach((f) => {
      if (selectedCandidates.length < globalLimit && !selectedCandidates.some((sc) => sc.id === f.id)) {
        selectedCandidates.push(f);
      }
    });
  });

  // Ordenação canônica final do pool reduzido para garantir invariância
  selectedCandidates.sort((a, b) => String(a.id).localeCompare(String(b.id)));

  return selectedCandidates;
}

/**
 * Otimiza deterministicamente as porções contínuas de um subconjunto fixo de alimentos
 * usando Deterministic Bounded Coordinate Search (busca local determinística com step sizes decrescentes)
 * @param {Array<Object>} combo Conjunto de alimentos selecionados
 * @param {Object} targets Metas nutricionais { calories, protein, carbohydrate, fat, fiber }
 * @param {Object} policy Política do solver
 * @returns {{ portions: number[], totals: Object, cost: number, iterations: number }}
 */
function optimizeComboPortions(combo, targets, policy) {
  const k = combo.length;
  const minG = policy.searchBounds.minGramsPerItem;
  const maxG = policy.searchBounds.maxGramsPerItem;
  const maxIter = policy.convergence.maxIterations;
  const minImprovement = policy.convergence.minCostImprovement;

  // Inicialização determinística proporcional ao alvo calórico
  const avgInitGrams = Math.min(maxG, Math.max(minG, (targets.calories / (k * 150)) * 100));
  const portions = new Array(k).fill(avgInitGrams);

  // Função interna para calcular totais atuais
  function getTotals(currentPortions) {
    let cal = 0, prot = 0, carb = 0, fat = 0, fib = 0, sod = 0;
    for (let i = 0; i < k; i++) {
      const p = calculateFoodPortionNutrients(combo[i], currentPortions[i]);
      cal += p.calories;
      prot += p.protein;
      carb += p.carbohydrate;
      fat += p.lipid;
      fib += p.fiber;
      sod += p.sodium;
    }
    return { calories: cal, protein: prot, carbohydrate: carb, fat: fat, fiber: fib, sodium: sod };
  }

  let currentTotals = getTotals(portions);
  let currentCostObj = calculateNutrientLoss(currentTotals, targets, policy.weights, policy.fallbackScales);
  let currentCost = currentCostObj.totalCost;
  let iterations = 0;

  // Passos de exploração da busca unidimensional determinística
  const stepSizes = [25.0, 10.0, 5.0, 2.0, 1.0, 0.5];

  for (let iter = 0; iter < maxIter; iter++) {
    iterations++;
    let improvedInIter = false;

    for (let i = 0; i < k; i++) {
      let bestPortionForI = portions[i];
      let bestCostForI = currentCost;

      for (let s = 0; s < stepSizes.length; s++) {
        const step = stepSizes[s];
        
        // Testa aumento
        const testUp = Math.min(maxG, bestPortionForI + step);
        if (testUp !== bestPortionForI) {
          const testPortions = [...portions];
          testPortions[i] = testUp;
          const tTotals = getTotals(testPortions);
          const tCost = calculateNutrientLoss(tTotals, targets, policy.weights, policy.fallbackScales).totalCost;
          if (tCost < bestCostForI - 1e-9) {
            bestCostForI = tCost;
            bestPortionForI = testUp;
          }
        }

        // Testa redução
        const testDown = Math.max(minG, bestPortionForI - step);
        if (testDown !== bestPortionForI) {
          const testPortions = [...portions];
          testPortions[i] = testDown;
          const tTotals = getTotals(testPortions);
          const tCost = calculateNutrientLoss(tTotals, targets, policy.weights, policy.fallbackScales).totalCost;
          if (tCost < bestCostForI - 1e-9) {
            bestCostForI = tCost;
            bestPortionForI = testDown;
          }
        }
      }

      if (bestCostForI < currentCost - 1e-9) {
        portions[i] = bestPortionForI;
        currentCost = bestCostForI;
        improvedInIter = true;
      }
    }

    if (!improvedInIter || currentCost < 1e-6) {
      break;
    }
  }

  currentTotals = getTotals(portions);
  return {
    portions,
    totals: currentTotals,
    cost: currentCost,
    iterations
  };
}

/**
 * Gera combinações determinísticas de tamanho k a partir de uma lista ordenada
 * @param {Array} arr 
 * @param {number} k 
 * @returns {Array<Array>}
 */
function getCombinations(arr, k) {
  const result = [];
  function backtrack(start, currentCombo) {
    if (currentCombo.length === k) {
      result.push([...currentCombo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      currentCombo.push(arr[i]);
      backtrack(i + 1, currentCombo);
      currentCombo.pop();
    }
  }
  backtrack(0, []);
  return result;
}

/**
 * Executa o Food Solver determinístico (Deterministic Bounded Nutrient Optimization)
 * @param {Object} input Contrato de Entrada FoodSolverInputDTO
 * @param {Object} [customPolicy] Política customizada opcional
 * @returns {Object} Contrato de Saída FoodSolverOutputDTO
 */
function solveNutritionDiet(input, customPolicy = {}) {
  const policy = {
    ...DEFAULT_FOOD_SOLVER_POLICY,
    ...customPolicy,
    weights: { ...DEFAULT_FOOD_SOLVER_POLICY.weights, ...(customPolicy.weights || {}) },
    tolerances: { ...DEFAULT_FOOD_SOLVER_POLICY.tolerances, ...(customPolicy.tolerances || {}) },
    searchBounds: { ...DEFAULT_FOOD_SOLVER_POLICY.searchBounds, ...(customPolicy.searchBounds || {}) },
    candidateLimits: { ...DEFAULT_FOOD_SOLVER_POLICY.candidateLimits, ...(customPolicy.candidateLimits || {}) },
    convergence: { ...DEFAULT_FOOD_SOLVER_POLICY.convergence, ...(customPolicy.convergence || {}) },
    eligibility: { ...DEFAULT_FOOD_SOLVER_POLICY.eligibility, ...(customPolicy.eligibility || {}) }
  };

  const solverVersion = policy.solverVersion || 'N3.2.0';

  // 1. Portão de Entrada Obrigatório (N2.3 Validation Gate)
  const inputValidation = validateFoodSolverInput(input);
  if (!inputValidation.isValid || inputValidation.isBlocked) {
    return deepFreeze({
      status: SOLVER_STATUS.BLOCKED,
      valid: false,
      meals: [],
      totals: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0, sodium: 0 },
      target: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0 },
      differences: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0 },
      foodProvenance: [],
      solverDiagnostics: ['Execução bloqueada pelo portão de validação de entrada.'],
      warnings: [],
      blockingReasons: inputValidation.errors,
      solverVersion,
      provenance: { engine: 'NutriAxDeterministicFoodSolver', policyVersion: policy.policyVersion }
    });
  }

  // 2. Extração das Metas Canônicas
  const targets = {
    calories: Number(input.energyTarget.caloricTargetKcal),
    protein: Number(input.macroTarget.proteinTargetG),
    carbohydrate: Number(input.macroTarget.carbohydrateTargetG),
    fat: Number(input.macroTarget.fatTargetG),
    fiber: Number(input.macroTarget.fiberTargetG || 0)
  };

  // 3. Adaptação e Filtragem do Catálogo
  const rawCatalog = Array.isArray(input.foodCatalog) ? input.foodCatalog : [];
  const canonicalCatalog = adaptCatalogToCanonical(rawCatalog);

  const filterOptions = {
    context: input.context,
    constraints: input.constraints || (input.context && input.context.constraints) || {},
    ...(input.options || {}),
    dietaryStyle: input.options?.dietaryStyle || input.context?.options?.dietaryStyle || input.context?.dietaryStyle,
    dietaryCycle: input.options?.dietaryCycle || input.context?.options?.dietaryCycle || input.context?.dietaryCycle,
    includeSupplements: input.options?.includeSupplements !== false && input.context?.options?.includeSupplements !== false
  };

  const filterResult = filterEligibleFoods(canonicalCatalog, policy.eligibility, filterOptions);
  const eligibleFoods = filterResult.eligible;
  const governanceWarnings = [...filterResult.governanceWarnings];

  if (eligibleFoods.length === 0) {
    return deepFreeze({
      status: SOLVER_STATUS.BLOCKED,
      valid: false,
      meals: [],
      totals: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0, sodium: 0 },
      target: targets,
      differences: {
        calories: -targets.calories,
        protein: -targets.protein,
        carbohydrate: -targets.carbohydrate,
        fat: -targets.fat,
        fiber: -targets.fiber
      },
      foodProvenance: [],
      solverDiagnostics: ['Nenhum alimento elegível disponível no catálogo após filtros e restrições.'],
      warnings: governanceWarnings,
      blockingReasons: ['Catálogo de alimentos vazio ou sem alimentos elegíveis para otimização.'],
      solverVersion,
      provenance: { engine: 'NutriAxDeterministicFoodSolver', policyVersion: policy.policyVersion }
    });
  }

  // 4. Redução Determinística do Espaço de Busca
  const candidatePool = reduceSearchCandidates(eligibleFoods, policy, filterOptions);

  // 5. Busca Bounded e Otimização Combinatória com Limite Determinístico (N3.7.5)
  const targetItemCountMin = Math.min(policy.searchBounds.targetItemCountMin, candidatePool.length);
  const targetItemCountMax = Math.min(policy.searchBounds.targetItemCountMax, candidatePool.length);

  // Limite computacional de busca — proteção contra explosão combinatória.
  // NÃO é um parâmetro clínico: não altera TMB, GET, macros ou regras N3.6.
  // Configurável pela policy para ambientes diferentes (browser: 5000, Node: Infinity).
  const searchLimitPolicy = policy.searchLimit || {};
  const maxCombosToTest = (typeof searchLimitPolicy.maxCombosToTest === 'number' && searchLimitPolicy.maxCombosToTest > 0)
    ? searchLimitPolicy.maxCombosToTest
    : Infinity;
  const returnBestPartial = searchLimitPolicy.returnBestPartial !== false;

  let bestSolution = null;
  let totalCombosTested = 0;
  let totalIterationsExecuted = 0;
  let searchLimitReached = false;
  let earlyConverged = false;

  const enableEarlyStop = policy.convergence && policy.convergence.enableEarlyStop !== false;
  const earlyStopCost = (policy.convergence && typeof policy.convergence.earlyStopCost === 'number')
    ? policy.convergence.earlyStopCost
    : 0.05;

  outerLoop:
  for (let k = targetItemCountMin; k <= targetItemCountMax; k++) {
    const combos = getCombinations(candidatePool, k);

    for (let c = 0; c < combos.length; c++) {
      // Verificação do limite antes de avaliar a próxima combinação
      if (totalCombosTested >= maxCombosToTest) {
        searchLimitReached = true;
        break outerLoop;
      }

      totalCombosTested++;
      const combo = combos[c];
      const opt = optimizeComboPortions(combo, targets, policy);
      totalIterationsExecuted += opt.iterations;

      if (!bestSolution) {
        bestSolution = { combo, ...opt };
      } else {
        // Desempate Estóico e Determinístico
        const isBetterCost = opt.cost < bestSolution.cost - 1e-6;
        const isSameCost = Math.abs(opt.cost - bestSolution.cost) <= 1e-6;

        if (isBetterCost) {
          bestSolution = { combo, ...opt };
        } else if (isSameCost) {
          // Desempate 2 (CONSISTENT_STATUS_COUNT): Contagem de alimentos com status CONSISTENTE
          const consistentCountOpt = combo.filter(f => (f.bromatology && f.bromatology.energyStatus) === 'CONSISTENTE').length;
          const consistentCountBest = bestSolution.combo.filter(f => (f.bromatology && f.bromatology.energyStatus) === 'CONSISTENTE').length;

          if (consistentCountOpt > consistentCountBest) {
            bestSolution = { combo, ...opt };
          } else if (consistentCountOpt === consistentCountBest) {
            // Desempate 3: Menor quantidade de itens
            if (combo.length < bestSolution.combo.length) {
              bestSolution = { combo, ...opt };
            } else if (combo.length === bestSolution.combo.length) {
              // Desempate 4: Ordem lexicográfica dos IDs
              const idStrOpt = combo.map(f => f.id).join('-');
              const idStrBest = bestSolution.combo.map(f => f.id).join('-');
              if (idStrOpt.localeCompare(idStrBest) < 0) {
                bestSolution = { combo, ...opt };
              }
            }
          }
        }
      }

      // Early Stop determinístico (N3.7.6):
      // Se a solução atual satisfaz integralmente as tolerâncias canônicas da política,
      // não contém alimentos com status REVISAR, possui quantidade de itens suficiente
      // para cobrir todas as refeições diárias e atinge o limiar de custo de parada antecipada,
      // interrompe a busca imediatamente com garantia de conformidade clínica PASS.
      if (enableEarlyStop) {
        const requiredMealCount = (input.context && (input.context.mealsPerDay || (input.context.patient && input.context.patient.mealsPerDay))) ||
          (input.options && input.options.mealCount) ||
          policy.searchBounds.targetItemCountMin ||
          3;

        const containsReview = combo.some(f => (f.bromatology && f.bromatology.energyStatus) === 'REVISAR');
        if (!containsReview && combo.length >= requiredMealCount && opt.cost <= earlyStopCost) {
          const diffCal = Math.abs(opt.totals.calories - targets.calories);
          const diffProt = Math.abs(opt.totals.protein - targets.protein);
          const diffCarb = Math.abs(opt.totals.carbohydrate - targets.carbohydrate);
          const diffFat = Math.abs(opt.totals.fat - targets.fat);
          const diffFib = Math.abs(opt.totals.fiber - targets.fiber);

          const comboWithinTolerances = 
            diffCal <= policy.tolerances.caloriesKcal &&
            diffProt <= policy.tolerances.proteinG &&
            diffCarb <= policy.tolerances.carbohydrateG &&
            diffFat <= policy.tolerances.fatG &&
            diffFib <= policy.tolerances.fiberG;

          if (comboWithinTolerances) {
            bestSolution = { combo, ...opt };
            earlyConverged = true;
            break outerLoop;
          }
        }
      }
    }
  }

  // 5a. Verificação de limite atingido (N3.7.5)
  // Quando o limite é atingido sem nenhuma solução parcial, bloqueamos.
  // Quando há uma solução parcial e returnBestPartial=true, retornamos com status explícito.
  // O orchestrator NUNCA persiste um resultado SEARCH_LIMIT_REACHED como prescrição validada.
  if (searchLimitReached && !bestSolution) {
    return deepFreeze({
      status: SOLVER_STATUS.SEARCH_LIMIT_REACHED,
      valid: false,
      meals: [],
      totals: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0, sodium: 0 },
      target: targets,
      differences: {
        calories: -targets.calories,
        protein: -targets.protein,
        carbohydrate: -targets.carbohydrate,
        fat: -targets.fat,
        fiber: -targets.fiber
      },
      foodProvenance: [],
      solverDiagnostics: [
        `Limite computacional atingido após ${totalCombosTested} combinações testadas.`,
        `Nenhuma solução parcial disponível para retornar.`,
        `Diagnóstico: ${searchLimitPolicy.diagnosticCode || 'SEARCH_LIMIT_REACHED'}`
      ],
      warnings: governanceWarnings,
      blockingReasons: [
        `Limite de busca combinatória (maxCombosToTest=${maxCombosToTest}) atingido sem solução disponível.`,
        'Aumente o catálogo de alimentos ou ajuste a política de busca.'
      ],
      solverVersion,
      provenance: { engine: 'NutriAxDeterministicFoodSolver', policyVersion: policy.policyVersion }
    });
  }

  // Se não foi possível gerar nenhuma solução (sem limite atingido)
  if (!bestSolution || bestSolution.portions.length === 0) {
    return deepFreeze({
      status: SOLVER_STATUS.NO_SOLUTION,
      valid: false,
      meals: [],
      totals: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0, sodium: 0 },
      target: targets,
      differences: {
        calories: -targets.calories,
        protein: -targets.protein,
        carbohydrate: -targets.carbohydrate,
        fat: -targets.fat,
        fiber: -targets.fiber
      },
      foodProvenance: [],
      solverDiagnostics: ['Impossibilidade de gerar solução com os candidatos e limites atuais.'],
      warnings: governanceWarnings,
      blockingReasons: ['Nenhuma combinação de alimentos viável dentro dos limites computacionais de busca.'],
      solverVersion,
      provenance: { engine: 'NutriAxDeterministicFoodSolver', policyVersion: policy.policyVersion }
    });
  }

  // 6. Avaliação de Tolerâncias e Status Final
  const rawTotals = bestSolution.totals;
  const diffs = {
    calories: roundTo(rawTotals.calories - targets.calories, 2),
    protein: roundTo(rawTotals.protein - targets.protein, 2),
    carbohydrate: roundTo(rawTotals.carbohydrate - targets.carbohydrate, 2),
    fat: roundTo(rawTotals.fat - targets.fat, 2),
    fiber: roundTo(rawTotals.fiber - targets.fiber, 2)
  };

  const withinTolerances = 
    Math.abs(diffs.calories) <= policy.tolerances.caloriesKcal &&
    Math.abs(diffs.protein) <= policy.tolerances.proteinG &&
    Math.abs(diffs.carbohydrate) <= policy.tolerances.carbohydrateG &&
    Math.abs(diffs.fat) <= policy.tolerances.fatG &&
    Math.abs(diffs.fiber) <= policy.tolerances.fiberG;

  const warnings = [...governanceWarnings];
  const containsReviewFood = bestSolution.combo.some(f => (f.bromatology && f.bromatology.energyStatus) === 'REVISAR');

  if (containsReviewFood) {
    warnings.push('A solução contém alimento(s) com status bromatológico REVISAR no catálogo.');
  }

  if (!withinTolerances) {
    const exceeded = [];
    if (Math.abs(diffs.calories) > policy.tolerances.caloriesKcal) {
      exceeded.push(`calorias: ${diffs.calories > 0 ? '+' : ''}${diffs.calories} kcal (tol: ±${policy.tolerances.caloriesKcal} kcal)`);
    }
    if (Math.abs(diffs.protein) > policy.tolerances.proteinG) {
      exceeded.push(`proteína: ${diffs.protein > 0 ? '+' : ''}${diffs.protein}g (tol: ±${policy.tolerances.proteinG}g)`);
    }
    if (Math.abs(diffs.carbohydrate) > policy.tolerances.carbohydrateG) {
      exceeded.push(`carboidratos: ${diffs.carbohydrate > 0 ? '+' : ''}${diffs.carbohydrate}g (tol: ±${policy.tolerances.carbohydrateG}g)`);
    }
    if (Math.abs(diffs.fat) > policy.tolerances.fatG) {
      exceeded.push(`gordura: ${diffs.fat > 0 ? '+' : ''}${diffs.fat}g (tol: ±${policy.tolerances.fatG}g)`);
    }
    if (Math.abs(diffs.fiber) > policy.tolerances.fiberG) {
      exceeded.push(`fibras: ${diffs.fiber > 0 ? '+' : ''}${diffs.fiber}g (tol: ±${policy.tolerances.fiberG}g)`);
    }
    warnings.push(`Resíduo nutricional excedeu tolerâncias de política: ${exceeded.join(', ')}.`);
  }

  // Regra de Status (N3.7.6 — Revisão do SEARCH_LIMIT_REACHED):
  // - PASS: dentro das tolerâncias, zero REVISAR, sem limite atingido.
  // - WARNING: dentro/próximo das tolerâncias, mas contém REVISAR ou alertas; ou limite atingido
  //   com solução de alta qualidade (custo residual <= earlyStopCost).
  // - SEARCH_LIMIT_REACHED promotable: limite atingido, mas custo residual baixo o suficiente
  //   para ser aceito como WARNING com aviso clínico explícito. Isso evita bloquear dietas
  //   geradas corretamente apenas por atingir o limite combinatório com solução de boa qualidade.
  // - REVISAR NUNCA PODE RESULTAR EM PASS.
  let finalStatus;
  let isValid;

  if (searchLimitReached) {
    // N3.7.6: Avalia qualidade da solução parcial.
    // Se o custo residual for suficientemente baixo (<= earlyStopCost), a solução é
    // clinicamente aceitável e promovida para WARNING (salva) em vez de ser bloqueada.
    // Um aviso explícito de rastreabilidade é sempre emitido.
    const partialResidualCost = bestSolution ? bestSolution.cost : Infinity;
    const partialQualityThreshold = earlyStopCost; // Default: 0.05 (configurável na policy)
    const partialIsHighQuality = partialResidualCost <= partialQualityThreshold;

    warnings.push(
      `[SEARCH_LIMIT_REACHED] Busca interrompida após ${totalCombosTested} combinações ` +
      `(limite: ${maxCombosToTest}). Custo residual: ${partialResidualCost.toFixed(6)}. ` +
      (partialIsHighQuality
        ? `Solução de alta qualidade aceita como WARNING (custo <= ${partialQualityThreshold}).`
        : `Solução de qualidade insuficiente bloqueada (custo > ${partialQualityThreshold}).`)
    );

    if (partialIsHighQuality) {
      // Promove para WARNING — a dieta é salva com aviso de rastreabilidade
      finalStatus = SOLVER_STATUS.WARNING;
      isValid = true;
    } else {
      // Custo alto demais — bloqueia corretamente
      finalStatus = SOLVER_STATUS.SEARCH_LIMIT_REACHED;
      isValid = false;
    }
  } else if (withinTolerances && !containsReviewFood && warnings.length === 0) {
    finalStatus = SOLVER_STATUS.PASS;
    isValid = true;
  } else if (withinTolerances || bestSolution.cost <= 1.0) {
    finalStatus = SOLVER_STATUS.WARNING;
    isValid = true;
  } else {
    // Desvio severo sem capacidade de fechar
    finalStatus = SOLVER_STATUS.NO_SOLUTION;
    isValid = false;
  }

  // 7. Construção dos Itens de Prescrição e Proveniência
  const mealItems = [];
  const foodProvenance = [];

  for (let i = 0; i < bestSolution.combo.length; i++) {
    const food = bestSolution.combo[i];
    const rawGrams = bestSolution.portions[i];
    const displayGrams = roundTo(rawGrams, 1);
    const portionNutrients = calculateFoodPortionNutrients(food, displayGrams);

    const isReview = (food.bromatology && food.bromatology.energyStatus) === 'REVISAR';

    const item = {
      foodId: food.id,
      foodName: food.name,
      quantity: displayGrams,
      unit: food.unit || 'g',
      unitDisplay: `${displayGrams}${food.unit || 'g'}`,
      grams: displayGrams,
      nutrients: {
        calories: roundTo(portionNutrients.calories, 2),
        protein: roundTo(portionNutrients.protein, 2),
        carbohydrate: roundTo(portionNutrients.carbohydrate, 2),
        lipid: roundTo(portionNutrients.lipid, 2),
        fiber: roundTo(portionNutrients.fiber, 2),
        sodium: roundTo(portionNutrients.sodium, 2)
      },
      provenance: {
        source: food.source || 'Catálogo',
        prepState: food.prepState || null,
        conversionUsed: food.unit === 'g' ? 'DIRECT_MASS_1_TO_1' : 'FORMAL_SPECIFIC_CONVERSION'
      }
    };
    mealItems.push(item);

    foodProvenance.push({
      foodId: food.id,
      foodName: food.name,
      source: food.source || 'Catálogo',
      prepState: food.prepState || null,
      grams: displayGrams,
      unit: food.unit || 'g',
      nutrientContribution: item.nutrients,
      eligibilityStatus: isReview ? 'WARNING' : 'ELIGIBLE',
      selectionReason: `Otimizado para o papel ${assignSearchRole(food)} com minimização determinística de perda.`
    });
  }

  // Recalcular totais finais baseados nos displayGrams arredondados para consistência de apresentação
  const finalTotals = {
    calories: roundTo(mealItems.reduce((acc, it) => acc + it.nutrients.calories, 0), 2),
    protein: roundTo(mealItems.reduce((acc, it) => acc + it.nutrients.protein, 0), 2),
    carbohydrate: roundTo(mealItems.reduce((acc, it) => acc + it.nutrients.carbohydrate, 0), 2),
    fat: roundTo(mealItems.reduce((acc, it) => acc + it.nutrients.lipid, 0), 2),
    fiber: roundTo(mealItems.reduce((acc, it) => acc + it.nutrients.fiber, 0), 2),
    sodium: roundTo(mealItems.reduce((acc, it) => acc + it.nutrients.sodium, 0), 2)
  };

  const finalDifferences = {
    calories: roundTo(finalTotals.calories - targets.calories, 2),
    protein: roundTo(finalTotals.protein - targets.protein, 2),
    carbohydrate: roundTo(finalTotals.carbohydrate - targets.carbohydrate, 2),
    fat: roundTo(finalTotals.fat - targets.fat, 2),
    fiber: roundTo(finalTotals.fiber - targets.fiber, 2)
  };

  const convergenceLabel = earlyConverged
    ? 'EARLY_CONVERGED_CLINICAL_TOLERANCE'
    : (searchLimitReached ? (isValid ? 'SEARCH_LIMIT_PARTIAL_VIABLE' : 'SEARCH_LIMIT_REACHED') : 'CONVERGED');
  const solverDiagnostics = [
    `Candidatos recebidos: ${rawCatalog.length}`,
    `Candidatos elegíveis: ${eligibleFoods.length}`,
    `Candidatos reduzidos para busca: ${candidatePool.length}`,
    `Combinações testadas: ${totalCombosTested}`,
    `Limite computacional configurado: ${maxCombosToTest}`,
    `Iterações de otimização executadas: ${totalIterationsExecuted}`,
    `Custo residual final: ${roundTo(bestSolution.cost, 6)}`,
    `Convergência determinística: ${convergenceLabel}`,
    `Versão da política: ${policy.policyVersion}`
  ];

  // Bloco neutro de refeições diárias (Meal Assembly pertence a N3.3)
  const meals = [
    {
      mealName: 'Alocação Global Determinística N3.2',
      mealTime: null,
      items: mealItems,
      totals: finalTotals
    }
  ];

  const blockingReasons = [];
  if (!isValid) {
    if (searchLimitReached) {
      blockingReasons.push(
        `Limite computacional de busca atingido (${totalCombosTested}/${maxCombosToTest} combinações). ` +
        'Resultado parcial não pode ser usado como prescrição validada. ' +
        'Reduza o catálogo de candidatos ou aumente maxCombosToTest na política.'
      );
    } else {
      blockingReasons.push('A solução final não atingiu tolerâncias admissíveis.');
    }
  }

  const output = {
    status: finalStatus,
    valid: isValid,
    // searchLimitReached: campo de diagnóstico explícito para orchestrators e tests
    searchLimitReached: searchLimitReached === true,
    earlyConverged: earlyConverged === true,
    meals,
    totals: finalTotals,
    target: {
      calories: targets.calories,
      protein: targets.protein,
      carbohydrate: targets.carbohydrate,
      fat: targets.fat,
      fiber: targets.fiber
    },
    differences: finalDifferences,
    foodProvenance,
    solverDiagnostics,
    warnings,
    blockingReasons,
    solverVersion,
    provenance: {
      engine: 'NutriAxDeterministicFoodSolver',
      policyVersion: policy.policyVersion
    }
  };

  return deepFreeze(output);
}

module.exports = {
  solveNutritionDiet,
  calculateFoodPortionNutrients,
  reduceSearchCandidates
};
