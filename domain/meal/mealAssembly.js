/**
 * domain/meal/mealAssembly.js
 * 
 * Motor de Montagem e Agrupamento Determinístico de Refeições — NutriAx Pro.
 * Fase N3.3 — Meal Assembly Determinístico Canônico.
 * 
 * Camada Pura — Sem I/O, sem UI, sem termos clínicos/temporais.
 */

'use strict';

const MealAssemblyContract = require('../contracts/MealAssemblyContract');
const {
  ASSEMBLY_STATUS,
  deepFreeze,
  extractGlobalSolutionItems,
  validateMealAssemblyInput
} = MealAssemblyContract;

const mealAssemblyPolicy = require('./mealAssemblyPolicy');
const {
  DEFAULT_MEAL_ASSEMBLY_POLICY,
  resolveMealCount,
  resolveMealRoles,
  calculateTargetRatios,
  calculateAssemblyCost,
  calculateFoodMealAffinityPenalty,
  calculateMealCulinaryClashPenalty
} = mealAssemblyPolicy;

const mealAssemblyValidator = require('./mealAssemblyValidator');
const { roundTo, validateMealAssembly } = mealAssemblyValidator;

/**
 * Cria fatias determinísticas de um item e distribui conservando exatamente a massa e os nutrientes
 * @param {Object} item Item global original
 * @param {Array<{ mealIndex: number, ratio: number }>} allocations Alocações do item
 * @returns {Array<{ mealIndex: number, mealItem: Object }>}
 */
function createSlicesForItem(item, allocations) {
  const totalGrams = item.grams;
  const S = allocations.length;
  const slices = [];

  let allocatedGramsSum = 0;
  let allocatedCalSum = 0;
  let allocatedProtSum = 0;
  let allocatedCarbSum = 0;
  let allocatedFatSum = 0;
  let allocatedFibSum = 0;
  let allocatedSodSum = 0;

  const srcNut = item.nutrients || {};
  const hasSodium = srcNut.sodium !== null && srcNut.sodium !== undefined && typeof srcNut.sodium === 'number' && Number.isFinite(srcNut.sodium);

  for (let s = 0; s < S; s++) {
    const alloc = allocations[s];
    const isLast = (s === S - 1);

    let sliceGrams;
    if (!isLast) {
      sliceGrams = roundTo(totalGrams * alloc.ratio, 1);
      allocatedGramsSum += sliceGrams;
    } else {
      // A última fatia absorve exatamente qualquer resíduo de massa
      sliceGrams = roundTo(totalGrams - allocatedGramsSum, 1);
    }

    const actualRatio = totalGrams > 0 ? (sliceGrams / totalGrams) : (1 / S);

    let sliceCal, sliceProt, sliceCarb, sliceFat, sliceFib, sliceSod;

    if (!isLast) {
      sliceCal = roundTo((srcNut.calories || 0) * actualRatio, 2);
      sliceProt = roundTo((srcNut.protein || 0) * actualRatio, 2);
      sliceCarb = roundTo((srcNut.carbohydrate || 0) * actualRatio, 2);
      sliceFat = roundTo((srcNut.lipid !== undefined ? srcNut.lipid : (srcNut.fat || 0)) * actualRatio, 2);
      sliceFib = roundTo((srcNut.fiber || 0) * actualRatio, 2);

      allocatedCalSum += sliceCal;
      allocatedProtSum += sliceProt;
      allocatedCarbSum += sliceCarb;
      allocatedFatSum += sliceFat;
      allocatedFibSum += sliceFib;

      if (hasSodium) {
        sliceSod = roundTo(srcNut.sodium * actualRatio, 2);
        allocatedSodSum += sliceSod;
      } else {
        sliceSod = null;
      }
    } else {
      // A última fatia absorve exatamente qualquer resíduo nutricional
      sliceCal = roundTo((srcNut.calories || 0) - allocatedCalSum, 2);
      sliceProt = roundTo((srcNut.protein || 0) - allocatedProtSum, 2);
      sliceCarb = roundTo((srcNut.carbohydrate || 0) - allocatedCarbSum, 2);
      sliceFat = roundTo((srcNut.lipid !== undefined ? srcNut.lipid : (srcNut.fat || 0)) - allocatedFatSum, 2);
      sliceFib = roundTo((srcNut.fiber || 0) - allocatedFibSum, 2);

      if (hasSodium) {
        sliceSod = roundTo(srcNut.sodium - allocatedSodSum, 2);
      } else {
        sliceSod = null;
      }
    }

    const mealItem = {
      foodId: item.foodId,
      foodName: item.foodName,
      grams: sliceGrams,
      unit: item.unit || 'g',
      nutrients: {
        calories: sliceCal,
        protein: sliceProt,
        carbohydrate: sliceCarb,
        lipid: sliceFat,
        fiber: sliceFib,
        sodium: sliceSod
      },
      sourceMealSolution: 'N3.2_GLOBAL',
      allocationRatio: roundTo(actualRatio, 4),
      provenance: item.provenance || null
    };

    slices.push({
      mealIndex: alloc.mealIndex,
      mealItem
    });
  }

  return slices;
}

/**
 * Monta deterministicamente o conjunto canônico de refeições a partir da solução global do N3.2
 * 
 * @param {Object} input Contrato de Entrada MealAssemblyInputDTO
 * @param {Object} [customPolicy] Política customizada opcional
 * @returns {Object} MealAssemblyOutputDTO profundamente congelado
 */
function assembleMeals(input, customPolicy = {}) {
  const policy = {
    ...DEFAULT_MEAL_ASSEMBLY_POLICY,
    ...customPolicy,
    weights: { ...DEFAULT_MEAL_ASSEMBLY_POLICY.weights, ...(customPolicy.weights || {}) },
    tolerances: { ...DEFAULT_MEAL_ASSEMBLY_POLICY.tolerances, ...(customPolicy.tolerances || {}) }
  };

  const assemblyVersion = policy.assemblyVersion || 'N3.3.0';
  const solverVersion = (input && input.foodSolverResult && input.foodSolverResult.solverVersion) || 'N3.2.0';

  // 1. Portão de Validação do Contrato de Entrada
  const inputValidation = validateMealAssemblyInput(input);

  if (!inputValidation.isValid) {
    const isNoSolution = inputValidation.isNoSolution;
    const status = isNoSolution ? ASSEMBLY_STATUS.NO_SOLUTION : ASSEMBLY_STATUS.BLOCKED;

    return deepFreeze({
      assemblyVersion,
      solverVersion,
      status,
      valid: false,
      meals: [],
      globalTotals: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0, sodium: null },
      diagnostics: ['Execução bloqueada pelo portão de validação de entrada.'],
      warnings: [],
      blockingReasons: inputValidation.errors,
      provenance: {
        engine: 'NutriAxDeterministicMealAssembly',
        policyVersion: policy.policyVersion
      }
    });
  }

  // 2. Extração Canônica dos Itens N3.2
  const sourceItems = extractGlobalSolutionItems(input.foodSolverResult);
  const solverStatus = input.foodSolverResult.status;
  const solverWarnings = Array.isArray(input.foodSolverResult.warnings) ? [...input.foodSolverResult.warnings] : [];

  // 3. Resolução de Refeições e Papéis
  const contextForResolution = {
    ...(input.context || {}),
    ...(input.options ? { options: input.options } : {})
  };
  const { mealCount, isFromContext, warning: countWarning } = resolveMealCount(contextForResolution, policy);
  const warnings = [...solverWarnings];
  if (countWarning) {
    warnings.push(countWarning);
  }

  const roles = resolveMealRoles(mealCount);
  const targetRatios = calculateTargetRatios(roles);

  // Totais globais da solução N3.2
  const globalTotals = {
    calories: roundTo(sourceItems.reduce((acc, it) => acc + (it.nutrients.calories || 0), 0), 2),
    protein: roundTo(sourceItems.reduce((acc, it) => acc + (it.nutrients.protein || 0), 0), 2),
    carbohydrate: roundTo(sourceItems.reduce((acc, it) => acc + (it.nutrients.carbohydrate || 0), 0), 2),
    fat: roundTo(sourceItems.reduce((acc, it) => acc + (it.nutrients.lipid !== undefined ? it.nutrients.lipid : (it.nutrients.fat || 0)), 0), 2),
    fiber: roundTo(sourceItems.reduce((acc, it) => acc + (it.nutrients.fiber || 0), 0), 2),
    sodium: null
  };

  const allHaveSodium = sourceItems.every(it => it.nutrients && it.nutrients.sodium !== null && it.nutrients.sodium !== undefined);
  if (allHaveSodium) {
    globalTotals.sodium = roundTo(sourceItems.reduce((acc, it) => acc + it.nutrients.sodium, 0), 2);
  }

  // 4. Algoritmo Determinístico de Distribuição (Bounded Pattern Assembly)
  // Função para classe de prioridade gastronômica determinística
  function getItemPriorityClass(it) {
    const fn = it.foodName || '';
    if (/frango|patinho|alcatra|maminha|carne|peixe|til[aá]pia|salm[aã]o|merluza|pescada|bife|sardinha|tofu|tempeh|soja/i.test(fn)) return 1;
    if (/ovo\s+de\s+galinha|ovos|clara|queijo|iogurte|cottage|ricota|whey/i.test(fn)) return 2;
    if (/arroz|feij[aã]o|batata|mandioca|aipim|aveia|p[aã]o|gr[aã]o.*bico|lentilha/i.test(fn)) return 3;
    return 4;
  }

  // Cria cópia ordenada canônica dos itens para garantir invariância à ordem de entrada
  const sortedItems = [...sourceItems].sort((a, b) => {
    const classA = getItemPriorityClass(a);
    const classB = getItemPriorityClass(b);
    if (classA !== classB) return classA - classB;
    if (Math.abs(b.grams - a.grams) > 1e-4) {
      return b.grams - a.grams; // Mais pesados primeiro dentro da mesma classe
    }
    return String(a.foodId).localeCompare(String(b.foodId)); // Desempate lexicográfico estável
  });

  // Estruturas de trabalho para refeições
  const workingMeals = [];
  for (let m = 0; m < mealCount; m++) {
    workingMeals.push({
      mealId: `meal_${m + 1}`,
      mealName: `Refeição ${m + 1}`,
      mealIndex: m,
      mealRole: roles[m],
      items: [],
      totals: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, lipid: 0, fiber: 0, sodium: allHaveSodium ? 0 : null }
    });
  }

  // Identifica índices de refeições candidatas para receber divisões
  const allMealIndices = [];
  for (let m = 0; m < mealCount; m++) {
    allMealIndices.push(m);
  }
  const splitCandidateMeals = allMealIndices.length >= 2 ? allMealIndices : [0];

  let totalSplitsCount = 0;

  // Função auxiliar para recalcular totais de refeições de trabalho
  function getWorkingTotals(mealsArr) {
    return mealsArr.map(m => ({
      calories: m.items.reduce((acc, it) => acc + (it.nutrients.calories || 0), 0),
      protein: m.items.reduce((acc, it) => acc + (it.nutrients.protein || 0), 0),
      carbohydrate: m.items.reduce((acc, it) => acc + (it.nutrients.carbohydrate || 0), 0),
      lipid: m.items.reduce((acc, it) => acc + (it.nutrients.lipid !== undefined ? it.nutrients.lipid : (it.nutrients.fat || 0)), 0),
      fiber: m.items.reduce((acc, it) => acc + (it.nutrients.fiber || 0), 0)
    }));
  }

  // Alocação gulosa determinística com teste de fragmentação bounded
  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i];

    // Se só há 1 refeição, tudo vai para ela sem dividir
    if (mealCount === 1) {
      const slices = createSlicesForItem(item, [{ mealIndex: 0, ratio: 1.0 }]);
      workingMeals[0].items.push(slices[0].mealItem);
      continue;
    }

    // Opções candidatas de alocação para este item
    const candidateAllocations = [];

    // Opção A: Alocar inteiro em cada uma das M refeições (se massa <= 350g ou se houver apenas 1 refeição)
    if (item.grams <= 350.0 || mealCount === 1) {
      for (let m = 0; m < mealCount; m++) {
        candidateAllocations.push({
          type: 'SINGLE',
          allocations: [{ mealIndex: m, ratio: 1.0 }],
          isSplit: false,
          sortKey: `0_${m}`
        });
      }
    }

    // Opção B: Dividir em 2 refeições se a massa for substancial (>= minimumPreferredSplitMass)
    const canSplit = (item.grams >= policy.minimumPreferredSplitMass) && (policy.maxSplitsPerItem >= 2) && (mealCount >= 2);
    if (canSplit) {
      // Testa divisão 50%/50% entre pares de refeições de base
      for (let p1 = 0; p1 < splitCandidateMeals.length; p1++) {
        for (let p2 = p1 + 1; p2 < splitCandidateMeals.length; p2++) {
          const m1 = splitCandidateMeals[p1];
          const m2 = splitCandidateMeals[p2];
          candidateAllocations.push({
            type: 'SPLIT_PAIR',
            allocations: [
              { mealIndex: m1, ratio: 0.5 },
              { mealIndex: m2, ratio: 0.5 }
            ],
            isSplit: true,
            sortKey: `1_${m1}_${m2}`
          });
        }
      }
    }

    // Avalia cada candidato com a função de custo J
    let bestCand = null;
    let bestCost = Infinity;

    for (let c = 0; c < candidateAllocations.length; c++) {
      const cand = candidateAllocations[c];
      const slices = createSlicesForItem(item, cand.allocations);

      // Clona temporariamente os totais de trabalho para teste de custo
      const tempMeals = workingMeals.map(wm => ({
        ...wm,
        items: [...wm.items]
      }));

      slices.forEach(sl => {
        tempMeals[sl.mealIndex].items.push(sl.mealItem);
      });

      const tempTotals = getWorkingTotals(tempMeals);
      const costObj = calculateAssemblyCost(
        tempTotals,
        globalTotals,
        targetRatios,
        policy.weights,
        totalSplitsCount + (cand.isSplit ? 1 : 0)
      );

      let cost = costObj.totalCost;

      // Penalidade determinística de afinidade gastronômica/papel de refeição
      if (Array.isArray(cand.allocations)) {
        for (let s = 0; s < cand.allocations.length; s++) {
          const alloc = cand.allocations[s];
          const mIdx = alloc.mealIndex;
          cost += calculateFoodMealAffinityPenalty(item.foodName, roles[mIdx], mIdx, mealCount) * (alloc.ratio || 1.0);
        }
      }

      // 1. Penalidade determinística de incompatibilidade culinária (ex: abacate + manteiga, aveia + azeite)
      if (Array.isArray(cand.allocations)) {
        for (let s = 0; s < cand.allocations.length; s++) {
          const alloc = cand.allocations[s];
          const mIdx = alloc.mealIndex;
          const existingNames = workingMeals[mIdx].items.map(it => it.foodName);
          cost += calculateMealCulinaryClashPenalty(existingNames, item.foodName) * (alloc.ratio || 1.0);
        }
      }

      // 2. Diretriz da Literatura: Proteína Nobre e Harmonia Gastronômica
      const isMeatOrFish = /frango|patinho|alcatra|maminha|carne|peixe|til[aá]pia|salm[aã]o|merluza|pescada|bife|sardinha/i.test(item.foodName || '');
      const isEggOrDairy = /ovo\s+de\s+galinha|ovos|clara|queijo|iogurte|cottage|ricota|whey/i.test(item.foodName || '');
      const hasAnyMeatInDiet = sourceItems.some(it => /frango|patinho|alcatra|maminha|carne|peixe|til[aá]pia|salm[aã]o|merluza|pescada|bife|sardinha/i.test(it.foodName || ''));
      const meatCount = sourceItems.filter(it => /frango|patinho|alcatra|maminha|carne|peixe|til[aá]pia|salm[aã]o|merluza|pescada|bife|sardinha/i.test(it.foodName || '')).length;

      if (Array.isArray(cand.allocations)) {
        for (let s = 0; s < cand.allocations.length; s++) {
          const alloc = cand.allocations[s];
          const mIdx = alloc.mealIndex;
          const r = roles[mIdx];

          if (isMeatOrFish) {
            if (r === 'PRIMARY') {
              cost -= 25.0 * (alloc.ratio || 1.0); // Carne/Frango/Peixe preferem almoço e jantar
              const hasMeatInMeal = workingMeals[mIdx].items.some(it => /frango|patinho|carne|peixe|til[aá]pia|salm[aã]o|merluza|pescada|bife|sardinha/i.test(it.foodName || ''));
              if (hasMeatInMeal) {
                cost += 35.0 * (alloc.ratio || 1.0); // Desencoraja empilhar duas carnes/peixes diferentes na mesma refeição principal
              }
            }
          }

          if (isEggOrDairy) {
            if (r === 'SECONDARY') {
              cost -= 45.0 * (alloc.ratio || 1.0); // Ovos/laticínios preferem refeição matinal
              const breakfastProt = workingMeals[mIdx].items.reduce((acc, it) => acc + (it.nutrients?.protein || 0), 0);
              if (breakfastProt < 20.0) {
                cost -= 40.0 * (alloc.ratio || 1.0); // Ancoragem proteica indispensável no café da manhã
              }
            } else if (r === 'SNACK') {
              cost -= 20.0 * (alloc.ratio || 1.0); // Ovos/laticínios preferem lanches
            }

            if (r === 'PRIMARY') {
              cost += 40.0 * (alloc.ratio || 1.0); // Desencoraja ovos em refeições principais quando há carnes
              const hasMeatInMeal = workingMeals[mIdx].items.some(it => /frango|patinho|carne|peixe|til[aá]pia|salm[aã]o|merluza|sardinha/i.test(it.foodName || ''));
              if (hasMeatInMeal) {
                cost += 90.0 * (alloc.ratio || 1.0); // Proíbe/penaliza fortemente empilhar ovos com carne na mesma refeição
              }
            }
          }
        }

        // Se carne/frango/peixe é dividida entre duas refeições principais (Almoço e Jantar)
        if (isMeatOrFish && cand.isSplit && cand.allocations.length === 2) {
          const r1 = roles[cand.allocations[0].mealIndex];
          const r2 = roles[cand.allocations[1].mealIndex];
          if (r1 === 'PRIMARY' && r2 === 'PRIMARY') {
            cost -= (policy.weights?.w_frag || 0.5);
            if (meatCount <= 1) {
              cost -= 25.0; // Bonificação por equilibrar carne única no almoço e jantar
            } else {
              cost += 20.0; // Desencoraja fracionar carnes quando há diversidade para almoço e jantar distintos
            }
          }
        }

        // Se ovos/laticínios tentam ser divididos entre duas refeições PRIMARY quando já há carnes no cardápio, penaliza severamente
        if (isEggOrDairy && hasAnyMeatInDiet && cand.isSplit && cand.allocations.length === 2) {
          const r1 = roles[cand.allocations[0].mealIndex];
          const r2 = roles[cand.allocations[1].mealIndex];
          if (r1 === 'PRIMARY' && r2 === 'PRIMARY') {
            cost += 100.0; // Evita que ovos sejam consumidos em almoço e jantar juntos de carne
          }
        }
      }

      // 3. Trindade de Macronutrientes: Prevenção de refeições puramente glicídicas isoladas
      if (globalTotals.protein >= 60 && globalTotals.carbohydrate >= 80 && Array.isArray(cand.allocations)) {
        for (let s = 0; s < cand.allocations.length; s++) {
          const alloc = cand.allocations[s];
          const mIdx = alloc.mealIndex;
          const mealCarbs = tempTotals[mIdx].carbohydrate;
          const mealProt = tempTotals[mIdx].protein;
          if (mealCarbs >= 25 && mealProt < 4.0) {
            cost += 20.0 * (alloc.ratio || 1.0);
          }
        }
      }

      if (cost < bestCost - 1e-6) {
        bestCost = cost;
        bestCand = cand;
      } else if (Math.abs(cost - bestCost) <= 1e-6) {
        // Desempate estóico 1: Menos fragmentações
        if (!cand.isSplit && bestCand.isSplit) {
          bestCost = cost;
          bestCand = cand;
        } else if (cand.isSplit === bestCand.isSplit) {
          // Desempate 2: Ordem lexicográfica da chave de alocação
          if (cand.sortKey.localeCompare(bestCand.sortKey) < 0) {
            bestCost = cost;
            bestCand = cand;
          }
        }
      }
    }

    // Aplica a melhor alocação encontrada
    const chosenSlices = createSlicesForItem(item, bestCand.allocations);
    chosenSlices.forEach(sl => {
      workingMeals[sl.mealIndex].items.push(sl.mealItem);
    });

    if (bestCand.isSplit) {
      totalSplitsCount++;
    }
  }

  // 4.1 Garantia estrita de que nenhuma refeição fica vazia se houver itens distribuíveis
  for (let m = 0; m < workingMeals.length; m++) {
    if (workingMeals[m].items.length === 0) {
      let donorMeal = null;
      let donorItemIdx = -1;
      let maxGrams = 0;
      for (let dm = 0; dm < workingMeals.length; dm++) {
        if (dm !== m && workingMeals[dm].items.length > 0) {
          for (let itIdx = 0; itIdx < workingMeals[dm].items.length; itIdx++) {
            const it = workingMeals[dm].items[itIdx];
            if (workingMeals[dm].items.length > 1 || it.grams >= 20) {
              if (it.grams > maxGrams) {
                maxGrams = it.grams;
                donorMeal = workingMeals[dm];
                donorItemIdx = itIdx;
              }
            }
          }
        }
      }

      if (donorMeal && donorItemIdx >= 0) {
        const fullItem = donorMeal.items[donorItemIdx];
        const isPrimaryDonor = donorMeal.mealRole === 'PRIMARY';
        // Se a refeição doadora é PRINCIPAL ou o item é substancial (>= 50g), divide em vez de arrancar o alimento por completo
        if (donorMeal.items.length > 1 && !isPrimaryDonor && fullItem.grams < 50) {
          const [movedItem] = donorMeal.items.splice(donorItemIdx, 1);
          workingMeals[m].items.push(movedItem);
        } else {
          const halfGrams = roundTo(fullItem.grams / 2, 1);
          donorMeal.items[donorItemIdx] = {
            ...fullItem,
            grams: roundTo(fullItem.grams - halfGrams, 1),
            nutrients: {
              calories: roundTo(fullItem.nutrients.calories / 2, 2),
              protein: roundTo(fullItem.nutrients.protein / 2, 2),
              carbohydrate: roundTo(fullItem.nutrients.carbohydrate / 2, 2),
              lipid: roundTo(fullItem.nutrients.lipid / 2, 2),
              fiber: roundTo(fullItem.nutrients.fiber / 2, 2),
              sodium: fullItem.nutrients.sodium != null ? roundTo(fullItem.nutrients.sodium / 2, 2) : null
            }
          };
          workingMeals[m].items.push({
            ...fullItem,
            grams: halfGrams,
            nutrients: { ...donorMeal.items[donorItemIdx].nutrients }
          });
        }
      }
    }
  }

  // 4.2 Garantia da Trindade de Macronutrientes (Macro Trinity):
  // Em dietas com aporte proteico adequado (>= 60g de proteína diária),
  // refeições com carboidratos densos (>= 20g) ou energia relevante (>= 120 kcal)
  // não devem ser consumidas isoladas sem proteína (mínimo 4g).
  // Pareia com proteína divisível disponível (ex: ovos, queijo, atum ou frango) de refeição com abundância.
  if (globalTotals.protein >= 60 && globalTotals.carbohydrate >= 80 && mealCount >= 3) {
    for (let m = 0; m < workingMeals.length; m++) {
      const meal = workingMeals[m];
      const mCarbs = meal.items.reduce((acc, it) => acc + (it.nutrients?.carbohydrate || 0), 0);
      const mProt = meal.items.reduce((acc, it) => acc + (it.nutrients?.protein || 0), 0);
      const mCal = meal.items.reduce((acc, it) => acc + (it.nutrients?.calories || 0), 0);

      if ((mCarbs >= 20 || mCal >= 140) && mProt < 4.0) {
        let bestDonor = null;
        let bestItemIdx = -1;
        let maxDonorProt = 0;

        for (let dm = 0; dm < workingMeals.length; dm++) {
          if (dm === m) continue;
          const dProt = workingMeals[dm].items.reduce((acc, it) => acc + (it.nutrients?.protein || 0), 0);
          if (dProt >= 25.0) {
            for (let itIdx = 0; itIdx < workingMeals[dm].items.length; itIdx++) {
              const it = workingMeals[dm].items[itIdx];
              const isProteinSource = /ovo|ovos|clara|frango|carne|patinho|peixe|queijo|iogurte|atum/i.test(it.foodName || '');
              if (isProteinSource && it.grams >= 50.0 && (it.nutrients?.protein || 0) >= 8.0) {
                if (dProt > maxDonorProt) {
                  maxDonorProt = dProt;
                  bestDonor = workingMeals[dm];
                  bestItemIdx = itIdx;
                }
              }
            }
          }
        }

        if (bestDonor && bestItemIdx >= 0) {
          const fullItem = bestDonor.items[bestItemIdx];
          const halfGrams = roundTo(fullItem.grams / 2, 1);
          bestDonor.items[bestItemIdx] = {
            ...fullItem,
            grams: roundTo(fullItem.grams - halfGrams, 1),
            nutrients: {
              calories: roundTo(fullItem.nutrients.calories / 2, 2),
              protein: roundTo(fullItem.nutrients.protein / 2, 2),
              carbohydrate: roundTo(fullItem.nutrients.carbohydrate / 2, 2),
              lipid: roundTo(fullItem.nutrients.lipid / 2, 2),
              fiber: roundTo(fullItem.nutrients.fiber / 2, 2),
              sodium: fullItem.nutrients.sodium != null ? roundTo(fullItem.nutrients.sodium / 2, 2) : null
            }
          };
          meal.items.push({
            ...fullItem,
            grams: halfGrams,
            nutrients: { ...bestDonor.items[bestItemIdx].nutrients }
          });
        }
      }
    }
  }

  // 5. Ordenação canônica dos itens dentro de cada refeição (foodId lexicográfico)
  workingMeals.forEach(meal => {
    meal.items.sort((a, b) => String(a.foodId).localeCompare(String(b.foodId)));
  });

  // 6. Recalcular e arredondar totais finais de cada refeição
  const finalizedMeals = workingMeals.map(meal => {
    const items = meal.items;
    const totals = {
      calories: roundTo(items.reduce((acc, it) => acc + (it.nutrients.calories || 0), 0), 2),
      protein: roundTo(items.reduce((acc, it) => acc + (it.nutrients.protein || 0), 0), 2),
      carbohydrate: roundTo(items.reduce((acc, it) => acc + (it.nutrients.carbohydrate || 0), 0), 2),
      fat: roundTo(items.reduce((acc, it) => acc + (it.nutrients.lipid !== undefined ? it.nutrients.lipid : (it.nutrients.fat || 0)), 0), 2),
      lipid: roundTo(items.reduce((acc, it) => acc + (it.nutrients.lipid !== undefined ? it.nutrients.lipid : (it.nutrients.fat || 0)), 0), 2),
      fiber: roundTo(items.reduce((acc, it) => acc + (it.nutrients.fiber || 0), 0), 2),
      sodium: allHaveSodium ? roundTo(items.reduce((acc, it) => acc + (it.nutrients.sodium || 0), 0), 2) : null
    };

    return {
      mealId: meal.mealId,
      mealName: meal.mealName,
      mealIndex: meal.mealIndex,
      mealRole: meal.mealRole,
      items,
      totals
    };
  });

  const diagnostics = [
    `Itens globais N3.2 processados: ${sourceItems.length}`,
    `Refeições estruturadas: ${mealCount}`,
    `Origem da contagem de refeições: ${isFromContext ? 'Contexto (Rotina)' : 'Fallback Operacional de Política'}`,
    `Fragmentações de alimentos executadas: ${totalSplitsCount}`,
    `Papéis atribuídos: ${roles.join(', ')}`,
    `Versão da política: ${policy.policyVersion}`
  ];

  // 7. Validação Canônica das 17 Invariantes
  const candidateOutput = {
    assemblyVersion,
    solverVersion,
    status: ASSEMBLY_STATUS.PASS,
    valid: true,
    meals: finalizedMeals,
    globalTotals,
    diagnostics,
    warnings,
    blockingReasons: [],
    provenance: {
      engine: 'NutriAxDeterministicMealAssembly',
      policyVersion: policy.policyVersion
    }
  };

  const valResult = validateMealAssembly(candidateOutput, sourceItems, globalTotals, policy.tolerances);

  if (valResult.diagnostics && valResult.diagnostics.length > 0) {
    diagnostics.push(...valResult.diagnostics);
  }

  let finalStatus;
  let isValid;

  if (!valResult.isValid) {
    finalStatus = ASSEMBLY_STATUS.BLOCKED;
    isValid = false;
  } else if (solverStatus === 'WARNING' || warnings.length > 0) {
    finalStatus = ASSEMBLY_STATUS.WARNING;
    isValid = true;
  } else {
    finalStatus = ASSEMBLY_STATUS.PASS;
    isValid = true;
  }

  return deepFreeze({
    assemblyVersion,
    solverVersion,
    status: finalStatus,
    valid: isValid,
    meals: finalizedMeals,
    globalTotals,
    diagnostics,
    warnings,
    blockingReasons: valResult.errors,
    provenance: {
      engine: 'NutriAxDeterministicMealAssembly',
      policyVersion: policy.policyVersion
    }
  });
}

module.exports = deepFreeze({
  createSlicesForItem,
  assembleMeals
});
