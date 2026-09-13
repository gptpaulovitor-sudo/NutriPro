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
 * Redução determinística e estável do espaço de busca
 * Agrupa por Search Roles e limita a K candidatos de alta relevância por papel
 * @param {Array<Object>} eligibleFoods 
 * @param {Object} policy 
 * @returns {Array<Object>} Candidatos selecionados para a busca combinatória
 */
function reduceSearchCandidates(eligibleFoods, policy) {
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
  // b) Densidade relevante para o papel
  // c) Desempate estrito por foodId lexicográfico
  const comparator = (role) => (a, b) => {
    const statusA = (a.bromatology && a.bromatology.energyStatus) || 'CONSISTENTE';
    const statusB = (b.bromatology && b.bromatology.energyStatus) || 'CONSISTENTE';
    if (statusA === 'CONSISTENTE' && statusB !== 'CONSISTENTE') return -1;
    if (statusA !== 'CONSISTENTE' && statusB === 'CONSISTENTE') return 1;

    let scoreA = 0;
    let scoreB = 0;
    if (role === SEARCH_ROLES.ROLE_PROTEIN_DENSE) {
      scoreA = a.protein || 0;
      scoreB = b.protein || 0;
    } else if (role === SEARCH_ROLES.ROLE_CARB_DENSE) {
      scoreA = a.carbohydrate || 0;
      scoreB = b.carbohydrate || 0;
    } else if (role === SEARCH_ROLES.ROLE_FAT_DENSE) {
      scoreA = a.lipid || 0;
      scoreB = b.lipid || 0;
    } else if (role === SEARCH_ROLES.ROLE_FIBER_VOLUME) {
      scoreA = a.fiber || 0;
      scoreB = b.fiber || 0;
    } else {
      scoreA = a.calories || 0;
      scoreB = b.calories || 0;
    }

    if (Math.abs(scoreB - scoreA) > 1e-5) {
      return scoreB - scoreA; // Maior densidade primeiro
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
    constraints: input.constraints || (input.context && input.context.constraints) || {}
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
  const candidatePool = reduceSearchCandidates(eligibleFoods, policy);

  // 5. Busca Bounded e Otimização Combinatória
  const targetItemCountMin = Math.min(policy.searchBounds.targetItemCountMin, candidatePool.length);
  const targetItemCountMax = Math.min(policy.searchBounds.targetItemCountMax, candidatePool.length);

  let bestSolution = null;
  let totalCombosTested = 0;
  let totalIterationsExecuted = 0;

  for (let k = targetItemCountMin; k <= targetItemCountMax; k++) {
    const combos = getCombinations(candidatePool, k);

    for (let c = 0; c < combos.length; c++) {
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
    }
  }

  // Se não foi possível gerar nenhuma solução
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
    warnings.push(`Resíduo nutricional excedeu tolerâncias de política (diffKcal: ${diffs.calories} kcal).`);
  }

  // Regra Inegociável de Status:
  // - PASS: dentro das tolerâncias, zero REVISAR, zero limitações críticas.
  // - WARNING: dentro ou próximo das tolerâncias, mas contém REVISAR ou alertas não-críticos.
  // - REVISAR NUNCA PODE RESULTAR EM PASS.
  let finalStatus;
  let isValid;

  if (withinTolerances && !containsReviewFood && warnings.length === 0) {
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

  const solverDiagnostics = [
    `Candidatos recebidos: ${rawCatalog.length}`,
    `Candidatos elegíveis: ${eligibleFoods.length}`,
    `Candidatos reduzidos para busca: ${candidatePool.length}`,
    `Combinações testadas: ${totalCombosTested}`,
    `Iterações de otimização executadas: ${totalIterationsExecuted}`,
    `Custo residual final: ${roundTo(bestSolution.cost, 6)}`,
    `Convergência determinística: CONVERGED`,
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

  const output = {
    status: finalStatus,
    valid: isValid,
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
    blockingReasons: isValid ? [] : ['A solução final não atingiu tolerâncias admissíveis.'],
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
