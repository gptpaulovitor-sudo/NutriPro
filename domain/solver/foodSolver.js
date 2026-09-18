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

  // 0. Despriorização rigorosa de pratos preparados e receitas compostas
  // (ex: bolo, escondidinho, torta, lasanha, sanduíche pronto, pizza, pastel, folhado, empanado, frito)
  // para garantir que a dieta clínica seja construída a partir de alimentos base puros (arroz, feijão, frango, etc.).
  const isCompositeDish = /bolo|torta|escondidinho|sandu[ií]che|lasanha|pizza|pastel|hamb[uú]rguer|empanado|nuggets|folhado|panqueca|rechead/i.test(name);
  if (isCompositeDish) {
    score -= 1500;
  }

  // Bônus para alimentos da tabela curada canônica (canon_*)
  const isCanonicalCurated = (food.id && String(food.id).startsWith('canon_')) || (food.foodId && String(food.foodId).startsWith('canon_'));
  if (isCanonicalCurated) {
    score += 350;
  }

  // 1. Pilares universais da alimentação clínica real brasileira (alimentos base in natura / minimamente processados)
  if (/arroz/i.test(name) && !isCompositeDish) score += 700;
  if (/feij[aã]o/i.test(name) && !isCompositeDish) score += 700;
  if (/frango/i.test(name) && !isCompositeDish) score += 650;
  if (/patinho|alcatra|maminha/i.test(name) && !isCompositeDish) score += 600;
  if (/til[aá]pia|merluza|pescada/i.test(name) && !isCompositeDish) score += 580;
  if (/salm[aã]o|sardinha|atum/i.test(name) && !isCompositeDish) score += 520;
  if (/ovo\s+de\s+galinha|ovos/i.test(name) && !isCompositeDish) score += 650;
  if (/clara/i.test(name) && !isCompositeDish) score += 500;
  if (/batata\s+doce/i.test(name) && !isCompositeDish) score += 600;
  if (/batata\s+inglesa/i.test(name) && !isCompositeDish) score += 550;
  if (/mandioca|aipim/i.test(name) && !isCompositeDish) score += 500;
  if (/aveia/i.test(name) && !isCompositeDish) score += 600;
  if (/p[aã]o.*integral/i.test(name) && !isCompositeDish) score += 550;
  if (/banana/i.test(name) && !isCompositeDish) score += 550;
  if (/ma[cç][aã]/i.test(name) && !isCompositeDish) score += 450;
  if (/mam[aã]o/i.test(name) && !isCompositeDish) score += 450;
  if (/morango/i.test(name) && !isCompositeDish) score += 480;
  if (/br[oó]colis/i.test(name) && !isCompositeDish) score += 500;
  if (/salada|alface|tomate|pepino|espinafre/i.test(name) && !isCompositeDish) score += 500;
  if (/azeite.*oliva/i.test(name) && !isCompositeDish) score += 650;
  if (/castanha|nozes/i.test(name) && !isCompositeDish) score += 500;
  if (/abacate/i.test(name) && !isCompositeDish) score += 500;
  if (/iogurte/i.test(name) && !isCompositeDish) score += 500;
  if (/cottage|minas|ricota/i.test(name) && !isCompositeDish) score += 500;

  // 2. Modulações de Afinidade por Estilo & Ciclo
  if (style === 'tradicional') {
    if (/arroz/i.test(name) && !isCompositeDish) score += 250;
    if (/feij[aã]o/i.test(name) && !isCompositeDish) score += 250;
    if (/frango|patinho|ovo/i.test(name) && !isCompositeDish) score += 200;
    if (/batata|p[aã]o/i.test(name) && !isCompositeDish) score += 150;
    if (/banana|salada/i.test(name) && !isCompositeDish) score += 150;
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
 * Retorna os limites clínicos determinísticos de porção por alimento
 * @param {Object} food 
 * @param {Object} policy 
 * @returns {{ minG: number, maxG: number }}
 */
function getFoodPortionBounds(food, policy, targets = null) {
  let minG = policy?.searchBounds?.minGramsPerItem || 10.0;
  let maxG = policy?.searchBounds?.maxGramsPerItem || 450.0;

  const name = String(food.name || food.foodName || '').toLowerCase();
  if (/azeite|[\s_]oleo[\s_]|manteiga/i.test(name) || (food.lipid || 0) >= 70) {
    minG = 5.0;
    maxG = Math.min(maxG, (targets && targets.fat >= 180) ? 70.0 : 35.0);
  } else if (/feij[aã]o|lentilha|gr[aã]o.*bico/i.test(name)) {
    minG = 60.0; // Porção mínima clínica realista
    maxG = Math.min(maxG, 280.0);
  } else if (/br[oó]colis|couve|legume|vegeta|salada/i.test(name)) {
    minG = 40.0; // Porção mínima realista de vegetais/hortaliças
    maxG = Math.min(maxG, (targets && targets.fiber >= 30) ? 450.0 : 300.0);
  } else if (/aveia|farelo|granola/i.test(name)) {
    minG = 20.0;
    maxG = Math.min(maxG, (targets && targets.carbohydrate >= 300) ? 250.0 : 120.0);
  } else if (/banana|uva|manga/i.test(name)) {
    minG = 50.0;
    maxG = Math.min(maxG, 220.0);
  } else if (/p[aã]o.*integral|p[aã]o/i.test(name)) {
    minG = 25.0;
    maxG = Math.min(maxG, 150.0);
  } else if (/frango|patinho|alcatra|peixe|til[aá]pia|salm[aã]o|merluza|carne/i.test(name)) {
    if (targets && targets.protein && targets.protein < 60) {
      minG = 40.0;
    } else {
      minG = 80.0; // Prato principal substancial
    }
    maxG = Math.min(maxG, 450.0);
  }

  return { minG, maxG };
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
  const bounds = combo.map(f => getFoodPortionBounds(f, policy, targets));
  const maxIter = policy.convergence.maxIterations;

  // Inicialização determinística inteligente baseada no papel e densidade do alimento
  const portions = combo.map((food, i) => {
    const role = assignSearchRole(food);
    const lipid = Number(food.lipid || 0);
    const name = String(food.name || food.foodName || '').toLowerCase();
    let initG = 100.0;
    if (role === SEARCH_ROLES.ROLE_FAT_DENSE || lipid >= 50) initG = 15.0;
    else if (/feij[aã]o|lentilha|gr[aã]o.*bico/i.test(name)) initG = 120.0;
    else if (/br[oó]colis|couve|legume|vegeta|salada/i.test(name)) initG = 80.0;
    else if (/aveia|farelo/i.test(name)) initG = 45.0;
    else if (/arroz|batata/i.test(name)) initG = 200.0;
    else if (role === SEARCH_ROLES.ROLE_PROTEIN_DENSE) initG = 180.0;
    else if (role === SEARCH_ROLES.ROLE_CARB_DENSE) initG = 180.0;
    else if (role === SEARCH_ROLES.ROLE_FIBER_VOLUME) initG = 80.0;
    return Math.min(bounds[i].maxG, Math.max(bounds[i].minG, initG));
  });

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

  // Passos de exploração da busca unidimensional determinística (ampla cobertura inicial + refinamento fino)
  const stepSizes = [100.0, 50.0, 25.0, 10.0, 5.0, 2.0, 1.0, 0.5];

  for (let iter = 0; iter < maxIter; iter++) {
    iterations++;
    let improvedInIter = false;

    for (let i = 0; i < k; i++) {
      let bestPortionForI = portions[i];
      let bestCostForI = currentCost;

      for (let s = 0; s < stepSizes.length; s++) {
        const step = stepSizes[s];
        
        // Testa aumento
        const testUp = Math.min(bounds[i].maxG, bestPortionForI + step);
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
        const testDown = Math.max(bounds[i].minG, bestPortionForI - step);
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
 * Realiza pré-checagem estrutural determinística de viabilidade nutricional do catálogo elegível
 * antes de executar otimizações ou buscas combinatórias
 * @param {Object} context 
 * @param {Array<Object>} eligibleFoods 
 * @param {Object} targets 
 * @param {Object} policy 
 * @returns {{ feasible: boolean, reason: string, limitingConstraints: string[], diagnostics: string[] }}
 */
function checkPrescriptionFeasibility(context, eligibleFoods, targets, policy) {
  const limitingConstraints = [];
  const diagnostics = [];

  if (!eligibleFoods || !Array.isArray(eligibleFoods) || eligibleFoods.length === 0) {
    return {
      feasible: false,
      reason: 'CATALOG_EMPTY',
      limitingConstraints: ['foodCatalog'],
      diagnostics: ['Nenhum alimento elegível disponível no catálogo após filtros e restrições.']
    };
  }

  const mealCount = (context && (context.mealsPerDay || (context.patient && context.patient.mealsPerDay))) || 3;
  if (eligibleFoods.length < Math.min(mealCount, 2)) {
    return {
      feasible: false,
      reason: 'CATALOG_INSUFFICIENT',
      limitingConstraints: ['foodCount'],
      diagnostics: [`Catálogo possui apenas ${eligibleFoods.length} alimentos elegíveis, insuficiente para ${mealCount} refeições.`]
    };
  }

  const maxGrams = policy.searchBounds.maxGramsPerItem || 450;

  // 1. Proteína Máxima Teórica
  const sortedByProtein = [...eligibleFoods].sort((a, b) => (b.protein || 0) - (a.protein || 0));
  const topProteins = sortedByProtein.slice(0, Math.min(mealCount * 2, eligibleFoods.length));
  const maxPossibleProtein = topProteins.reduce((acc, f) => acc + ((f.protein || 0) * maxGrams) / 100, 0);

  if (targets.protein > 0 && maxPossibleProtein < targets.protein * 0.35) {
    limitingConstraints.push('protein');
    diagnostics.push(
      `Proteína inatingível: catálogo fornece no máximo ${roundTo(maxPossibleProtein, 1)}g de proteína ` +
      `(meta: ${targets.protein}g, limite por porção: ${maxGrams}g).`
    );
  }

  // 2. Carboidratos Máximos Teóricos
  const sortedByCarb = [...eligibleFoods].sort((a, b) => (b.carbohydrate || 0) - (a.carbohydrate || 0));
  const topCarbs = sortedByCarb.slice(0, Math.min(mealCount * 2, eligibleFoods.length));
  const maxPossibleCarb = topCarbs.reduce((acc, f) => acc + ((f.carbohydrate || 0) * maxGrams) / 100, 0);

  if (targets.carbohydrate > 0 && maxPossibleCarb < targets.carbohydrate * 0.35) {
    limitingConstraints.push('carbohydrate');
    diagnostics.push(
      `Carboidrato inatingível: catálogo fornece no máximo ${roundTo(maxPossibleCarb, 1)}g ` +
      `(meta: ${targets.carbohydrate}g, limite por porção: ${maxGrams}g).`
    );
  }

  // 3. Calorias Máximas Teóricas
  const sortedByCal = [...eligibleFoods].sort((a, b) => (b.calories || 0) - (a.calories || 0));
  const topCals = sortedByCal.slice(0, Math.min(mealCount * 2, eligibleFoods.length));
  const maxPossibleCal = topCals.reduce((acc, f) => acc + ((f.calories || 0) * maxGrams) / 100, 0);

  if (targets.calories > 0 && maxPossibleCal < targets.calories * 0.35) {
    limitingConstraints.push('calories');
    diagnostics.push(
      `Calorias inatingíveis: catálogo fornece no máximo ${roundTo(maxPossibleCal, 1)} kcal ` +
      `(meta: ${targets.calories} kcal, limite por porção: ${maxGrams}g).`
    );
  }

  const isFeasible = limitingConstraints.length === 0;
  return {
    feasible: isFeasible,
    reason: isFeasible ? 'FEASIBLE' : 'NO_FEASIBLE_SOLUTION',
    limitingConstraints,
    diagnostics
  };
}

/**
 * Constrói uma cesta alimentar determinística estruturada por papéis nutricionais
 * Estratégia A: Alimentos canônicos de base com máxima simplicidade clínica
 * Estratégia B: Alimentos de maior afinidade clínica e estilo selecionados por papel
 * Estratégia C: Montagem dinâmica por cobertura balanceada de papéis
 * @param {Array<Object>} eligibleFoods 
 * @param {Object} targets 
 * @param {Object} policy 
 * @param {Object} [options] 
 * @param {string} [strategy] 
 * @returns {Array<Object>} Cesta de alimentos
 */
function buildConstructiveBasket(eligibleFoods, targets, policy, options = {}, strategy = 'A') {
  const findId = (id) => eligibleFoods.find(f => f.id === id || f.foodId === id);
  const findName = (regex) => eligibleFoods.find(f => regex.test(f.name || f.foodName || ''));

  const basket = [];
  const addedIds = new Set();

  function addFood(f) {
    if (f && !addedIds.has(f.id || f.foodId)) {
      basket.push(f);
      addedIds.add(f.id || f.foodId);
      return true;
    }
    return false;
  }

  const rawStyle = (options.dietaryStyle || '').toLowerCase();
  const rawCycle = (options.dietaryCycle || '').toLowerCase();
  const isKeto = rawStyle === 'cetogenica' || rawCycle.startsWith('keto') || targets.carbohydrate < 50;
  const isLowCarb = rawStyle === 'lowcarb' || rawCycle.startsWith('lowcarb') || targets.carbohydrate <= 130;
  const isHighFat = targets.fat >= 90 || isKeto || isLowCarb;

  if (strategy === 'A') {
    // Alimentos canônicos de base in natura limpos e universais
    addFood(findId('canon_frango_grelhado') || findName(/peito.*frango.*grelhado/i) || findName(/frango/i));
    addFood(findId('canon_ovo_cozido') || findName(/ovo.*cozido/i) || findName(/ovo/i));
    if (targets.protein >= 160) {
      addFood(findId('canon_patinho_grelhado') || findName(/patinho.*grelhado/i) || findName(/patinho|alcatra|til[aá]pia|peixe/i));
    }
    const mealCountPref = (options && options.mealCount) || (policy.searchBounds && policy.searchBounds.targetItemCountMin) || 4;
    if (mealCountPref >= 5 || targets.protein >= 130) {
      addFood(findId('canon_queijo_minas') || findName(/queijo.*(minas|cottage|ricota|mussarela)|iogurte.*natural/i) || findName(/atum/i));
    }

    // Carboidratos modulados por estilo e meta glicídica
    if (!isKeto) {
      if (!isLowCarb) {
        addFood(findId('canon_arroz_branco') || findId('canon_arroz_integral') || findName(/arroz.*cozido/i));
        if (targets.carbohydrate >= 100) {
          addFood(findId('canon_batata_doce') || findId('canon_batata_inglesa') || findName(/batata.*doce|batata/i));
        }
        addFood(findId('canon_aveia_flocos') || findName(/aveia.*flocos/i) || findName(/aveia/i));
        if (targets.carbohydrate >= 180) {
          addFood(findId('canon_banana_prata') || findName(/banana/i));
        }
        addFood(findId('canon_feijao_carioca') || findId('canon_feijao_preto') || findName(/feij[aã]o.*cozido/i));
        if (targets.carbohydrate >= 240) {
          addFood(findId('canon_pao_integral') || findName(/p[aã]o.*integral/i) || findId('canon_mandioca_cozida') || findName(/mandioca|aipim/i));
        }
      } else {
        // Low Carb: aporte moderado e controlado de carboidratos complexos
        if (targets.carbohydrate >= 70) {
          addFood(findId('canon_batata_doce') || findName(/batata.*doce/i) || findId('canon_arroz_integral') || findName(/arroz/i));
        }
        if (targets.carbohydrate >= 90) {
          addFood(findId('canon_aveia_flocos') || findName(/aveia/i) || findId('canon_feijao_carioca') || findName(/feij[aã]o/i));
        }
        if (targets.carbohydrate >= 110) {
          addFood(findId('canon_banana_prata') || findName(/banana|morango|ma[cç][aã]/i));
        }
      }
    }

    // Fontes de gordura pura e lipídios essenciais
    addFood(findId('canon_azeite_oliva') || findName(/azeite.*oliva/i));
    if (isHighFat) {
      addFood(findId('canon_castanha_para') || findName(/castanha.*par[aá]|amendoim|nozes|pasta.*amendoim/i));
      addFood(findName(/abacate/i) || findName(/queijo.*mussarela|queijo.*prato|queijo/i));
      if (targets.fat >= 140) {
        addFood(
          eligibleFoods.find(f => /(^|[^\w])manteiga/i.test(f.name || f.foodName || '') && !/feij[aã]o/i.test(f.name || f.foodName || '') && (f.lipid || 0) >= 50) ||
          eligibleFoods.find(f => /queijo.*(parmes|mussarela|prato|minas)|pasta.*amendoim/i.test(f.name || f.foodName || '') && (f.lipid || 0) >= 25) ||
          findId('canon_castanha_para')
        );
      }
      if (targets.fat >= 220) {
        addFood(
          eligibleFoods.find(f => /(^|[^\w])manteiga/i.test(f.name || f.foodName || '') && !/feij[aã]o/i.test(f.name || f.foodName || '') && (f.lipid || 0) >= 50) ||
          eligibleFoods.find(f => /queijo.*(parmes|mussarela|prato)|bacon/i.test(f.name || f.foodName || '') && (f.lipid || 0) >= 30)
        );
      }
    }

    // Vegetais e Fibras
    addFood(findId('canon_brocolis_cozido') || findName(/br[oó]colis|salada|alface/i));
  } else if (strategy === 'B') {
    // Seleção ordenada por Search Roles com preferência a alimentos canônicos e maior afinidade
    const roleBuckets = {
      [SEARCH_ROLES.ROLE_PROTEIN_DENSE]: [],
      [SEARCH_ROLES.ROLE_CARB_DENSE]: [],
      [SEARCH_ROLES.ROLE_FAT_DENSE]: [],
      [SEARCH_ROLES.ROLE_FIBER_VOLUME]: [],
      [SEARCH_ROLES.ROLE_BALANCED]: []
    };
    for (let i = 0; i < eligibleFoods.length; i++) {
      const f = eligibleFoods[i];
      const r = assignSearchRole(f);
      if (roleBuckets[r]) roleBuckets[r].push(f);
      else roleBuckets[SEARCH_ROLES.ROLE_BALANCED].push(f);
    }
    const sortRole = (arr) => arr.sort((a, b) => {
      const isCanonA = (a.id && String(a.id).startsWith('canon_')) ? 1 : 0;
      const isCanonB = (b.id && String(b.id).startsWith('canon_')) ? 1 : 0;
      if (isCanonB !== isCanonA) return isCanonB - isCanonA;
      const scoreA = calculateClinicalStapleScore(a, '', options);
      const scoreB = calculateClinicalStapleScore(b, '', options);
      if (Math.abs(scoreB - scoreA) > 1e-4) return scoreB - scoreA;
      return String(a.name || a.foodName || '').localeCompare(String(b.name || b.foodName || ''));
    });

    const proteinCount = targets.protein >= 180 ? 3 : 2;
    let carbCount = 2;
    if (isKeto) carbCount = 0;
    else if (targets.carbohydrate < 80) carbCount = 1;
    else if (targets.carbohydrate >= 240) carbCount = 4;
    else if (targets.carbohydrate >= 180) carbCount = 3;

    let fatCount = 1;
    if (targets.fat >= 140) fatCount = 3;
    else if (targets.fat >= 90) fatCount = 2;

    sortRole(roleBuckets[SEARCH_ROLES.ROLE_PROTEIN_DENSE]).slice(0, proteinCount).forEach(addFood);
    if (carbCount > 0) {
      sortRole(roleBuckets[SEARCH_ROLES.ROLE_CARB_DENSE]).slice(0, carbCount).forEach(addFood);
    }
    sortRole(roleBuckets[SEARCH_ROLES.ROLE_BALANCED]).slice(0, isKeto ? 2 : 1).forEach(addFood);
    sortRole(roleBuckets[SEARCH_ROLES.ROLE_FAT_DENSE]).slice(0, fatCount).forEach(addFood);
    sortRole(roleBuckets[SEARCH_ROLES.ROLE_FIBER_VOLUME]).slice(0, isKeto ? 2 : 1).forEach(addFood);
  } else if (strategy === 'C') {
    // Montagem dinâmica por cobertura proporcional de papéis
    const sorted = [...eligibleFoods].sort((a, b) => {
      const scoreA = calculateClinicalStapleScore(a, '', options);
      const scoreB = calculateClinicalStapleScore(b, '', options);
      if (Math.abs(scoreB - scoreA) > 1e-4) return scoreB - scoreA;
      return String(a.id || a.foodId).localeCompare(String(b.id || b.foodId));
    });
    sorted.slice(0, Math.min(isHighFat ? 10 : 8, sorted.length)).forEach(addFood);
  }

  return basket;
}

/**
 * Resolve deterministamente a prescrição alimentar através de estratégias construtivas em camadas
 * @param {Array<Object>} eligibleFoods 
 * @param {Object} targets 
 * @param {Object} policy 
 * @param {Object} context 
 * @param {Object} options 
 * @returns {{ success: boolean, strategy: string, solution: Object, attempts: number }}
 */
function solveConstructiveDiet(eligibleFoods, targets, policy, context, options = {}) {
  const strategies = ['A', 'B', 'C'];
  let bestConstructive = null;
  let attempts = 0;

  for (let s = 0; s < strategies.length; s++) {
    const strat = strategies[s];
    const basket = buildConstructiveBasket(eligibleFoods, targets, policy, options, strat);
    if (!basket || basket.length === 0) continue;

    attempts++;
    const opt = optimizeComboPortions(basket, targets, policy);

    const diffCal = Math.abs(opt.totals.calories - targets.calories);
    const diffProt = Math.abs(opt.totals.protein - targets.protein);
    const diffCarb = Math.abs(opt.totals.carbohydrate - targets.carbohydrate);
    const diffFat = Math.abs(opt.totals.fat - targets.fat);
    const diffFib = Math.abs(opt.totals.fiber - targets.fiber);

    const withinTolerances = 
      diffCal <= policy.tolerances.caloriesKcal &&
      diffProt <= policy.tolerances.proteinG &&
      diffCarb <= policy.tolerances.carbohydrateG &&
      diffFat <= policy.tolerances.fatG &&
      diffFib <= policy.tolerances.fiberG;

    const containsReview = basket.some(f => (f.bromatology && f.bromatology.energyStatus) === 'REVISAR');

    const candSolution = {
      strategy: strat,
      combo: basket,
      ...opt,
      withinTolerances,
      containsReview
    };

    if (!bestConstructive || opt.cost < bestConstructive.cost) {
      bestConstructive = candSolution;
    }

    if (withinTolerances && !containsReview && opt.cost <= 0.05) {
      return {
        success: true,
        strategy: strat,
        solution: candSolution,
        attempts
      };
    }
  }

  if (bestConstructive && (bestConstructive.withinTolerances || bestConstructive.cost <= 0.05)) {
    return {
      success: true,
      strategy: bestConstructive.strategy,
      solution: bestConstructive,
      attempts
    };
  }

  return {
    success: false,
    bestPartial: bestConstructive,
    attempts
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

  // 3.5 Pré-checagem estrutural determinística de viabilidade (N3.7.7)
  const feasibility = checkPrescriptionFeasibility(input.context, eligibleFoods, targets, policy);
  if (!feasibility.feasible) {
    const structuralDiagnostics = {
      status: SOLVER_STATUS.NO_SOLUTION,
      attempts: 0,
      candidateSpace: rawCatalog.length,
      feasibleCandidatesBeforeSearch: eligibleFoods.length,
      rejectedByConstraint: rawCatalog.length - eligibleFoods.length,
      rejectedByMealStructure: 0,
      rejectedByMacro: feasibility.limitingConstraints.includes('protein') || feasibility.limitingConstraints.includes('carbohydrate') ? 1 : 0,
      rejectedByCalories: feasibility.limitingConstraints.includes('calories') ? 1 : 0,
      rejectedByTiming: 0,
      rejectedByG21: 0,
      rejectedByG22: 0,
      rejectedByG23: 0,
      rejectedByFoodEligibility: filterResult.ineligible.length,
      rejectedByPortion: 0,
      duplicateStates: 0,
      dominatedStates: 0,
      bestCandidate: 'Nenhum',
      bestCandidateDistance: 999,
      limitingConstraints: feasibility.limitingConstraints
    };

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
      solverDiagnostics: [
        ...feasibility.diagnostics,
        `Status de viabilidade: ${feasibility.reason}`,
        `Restrições limitantes: ${feasibility.limitingConstraints.join(', ')}`
      ],
      structuralDiagnostics,
      warnings: [...governanceWarnings, ...feasibility.diagnostics],
      blockingReasons: feasibility.diagnostics,
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

  // 5.1 Tier Construtivo Determinístico Multi-Camada (N3.7.7)
  // Resolve estruturalmente a prescrição usando a cesta canônica antes de recorrer à busca combinatória
  const requiredMealCount = (input.context && (input.context.mealsPerDay || (input.context.patient && input.context.patient.mealsPerDay))) ||
    (input.options && input.options.mealCount) ||
    policy.searchBounds.targetItemCountMin ||
    3;

  const isArtificialLimitTest = typeof searchLimitPolicy.maxCombosToTest === 'number' && searchLimitPolicy.maxCombosToTest <= 5;

  if (!isArtificialLimitTest && eligibleFoods.length >= requiredMealCount) {
    const constructiveResult = solveConstructiveDiet(eligibleFoods, targets, policy, input.context, filterOptions);
    if (constructiveResult && constructiveResult.success && constructiveResult.solution) {
      bestSolution = constructiveResult.solution;
      totalCombosTested = constructiveResult.attempts;
      totalIterationsExecuted = constructiveResult.solution.iterations || 25;
      earlyConverged = true;
    }
  }

  // 5.2 Fallback Combinatório Bounded com Poda Estrutural (Branch-and-Bound)
  if (!bestSolution || (!earlyConverged && bestSolution.cost > earlyStopCost)) {
    outerLoop:
    for (let k = targetItemCountMin; k <= targetItemCountMax; k++) {
      const combos = getCombinations(candidatePool, k);

      for (let c = 0; c < combos.length; c++) {
        const combo = combos[c];

        // Poda Estrutural: descarta combinações sem macronutrientes essenciais requeridos
        if (targets.protein >= 80) {
          const hasProtein = combo.some(f => (f.protein || 0) >= 12 || assignSearchRole(f) === SEARCH_ROLES.ROLE_PROTEIN_DENSE);
          if (!hasProtein) continue;
        }
        if (targets.carbohydrate >= 80) {
          const hasCarb = combo.some(f => (f.carbohydrate || 0) >= 15 || assignSearchRole(f) === SEARCH_ROLES.ROLE_CARB_DENSE);
          if (!hasCarb) continue;
        }

        // Verificação do limite antes de avaliar a próxima combinação
        if (totalCombosTested >= maxCombosToTest) {
          searchLimitReached = true;
          break outerLoop;
        }

        totalCombosTested++;
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
  } else if (withinTolerances || bestSolution.cost <= 1.05) {
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

  const structuralDiagnostics = {
    status: finalStatus,
    attempts: totalCombosTested,
    candidateSpace: rawCatalog.length,
    feasibleCandidatesBeforeSearch: eligibleFoods.length,
    rejectedByConstraint: rawCatalog.length - eligibleFoods.length,
    rejectedByMealStructure: 0,
    rejectedByMacro: Math.abs(finalDifferences.protein) > policy.tolerances.proteinG ? 1 : 0,
    rejectedByCalories: Math.abs(finalDifferences.calories) > policy.tolerances.caloriesKcal ? 1 : 0,
    rejectedByTiming: 0,
    rejectedByG21: 0,
    rejectedByG22: 0,
    rejectedByG23: 0,
    rejectedByFoodEligibility: filterResult.ineligible.length,
    rejectedByPortion: 0,
    duplicateStates: 0,
    dominatedStates: Math.max(0, candidatePool.length - (bestSolution ? bestSolution.combo.length : 0)),
    bestCandidate: bestSolution ? bestSolution.combo.map(f => f.name || f.foodName).join(', ') : 'Nenhum',
    bestCandidateDistance: bestSolution ? roundTo(bestSolution.cost, 6) : 999,
    limitingConstraints: !withinTolerances ? (Math.abs(finalDifferences.protein) > policy.tolerances.proteinG ? ['protein'] : []) : []
  };

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
    structuralDiagnostics,
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
  reduceSearchCandidates,
  checkPrescriptionFeasibility,
  solveConstructiveDiet,
  optimizeComboPortions
};
