/**
 * domain/solver/foodEligibility.js
 * 
 * Política e Motor de Avaliação de Elegibilidade de Alimentos — NutriAx Pro.
 * Fase N3.2 — Food Solver Determinístico Canônico.
 * 
 * Camada Pura — Sem I/O de infraestrutura, sem persistência externa, sem dependências remotas.
 * 
 * Princípios de Elegibilidade:
 * 1. PUREZA ABSOLUTA: Funções puras e imutáveis.
 * 2. RIGOR DIMENSIONAL: g = massa direta; ml requer densidade formal (sem assumir 1ml=1g);
 *    medidas caseiras requerem gramPerUnit específico (sem fallback genérico).
 * 3. GOVERNANÇA BROMATOLÓGICA:
 *    - CONSISTENTE: ELIGIBLE (candidato padrão).
 *    - REVISAR: governado por allowReviewStatus (default true -> WARNING; false -> INELIGIBLE).
 *    - INCONSISTENTE: INELIGIBLE por padrão.
 * 4. ALIMENTOS CUSTOMIZADOS: cust_* elegíveis se cumprirem os mesmos requisitos canônicos.
 * 5. RESTRIÇÕES ESTRUTURADAS: Exclusão formal por categorias e metadados estruturados.
 *    Restrições sem metadados geram warning explícito de limitação de cobertura.
 */

'use strict';

const FoodSolverContract = require('../contracts/FoodSolverContract');
const {
  validateCanonicalFoodDTO,
  createCanonicalFoodDTO,
  deepFreeze
} = FoodSolverContract;

/**
 * Status de elegibilidade
 */
const ELIGIBILITY_STATUS = Object.freeze({
  ELIGIBLE: 'ELIGIBLE',
  WARNING: 'WARNING',
  INELIGIBLE: 'INELIGIBLE'
});

/**
 * Política padrão de elegibilidade
 */
const DEFAULT_ELIGIBILITY_POLICY = Object.freeze({
  allowReviewStatus: true,
  allowInconsistentStatus: false,
  requireSpecificConversion: true,
  allowGenericUnitFallback: false
});

/**
 * Adapta uma coleção de registros de alimentos para CanonicalFoodDTO[]
 * @param {Array<Object>} rawCatalog 
 * @returns {Array<Object>}
 */
function adaptCatalogToCanonical(rawCatalog) {
  if (!Array.isArray(rawCatalog)) {
    return [];
  }
  const adapted = [];
  for (let i = 0; i < rawCatalog.length; i++) {
    const raw = rawCatalog[i];
    try {
      const canonical = createCanonicalFoodDTO(raw);
      adapted.push(canonical);
    } catch {
      // Itens que falham na validação estrutural básica de DTO são descartados
    }
  }
  return deepFreeze(adapted);
}

/**
 * Avalia a elegibilidade de um único alimento para o Food Solver
 * @param {Object} food Alimento (CanonicalFoodDTO ou objeto equivalente)
 * @param {Object} [policy] Política de elegibilidade
 * @param {Object} [options] Opções contextuais
 * @returns {{ status: string, isEligible: boolean, reasons: string[], warnings: string[], food: Object|null }}
 */
function evaluateFoodEligibility(food, policy = DEFAULT_ELIGIBILITY_POLICY, options = {}) {
  const reasons = [];
  const warnings = [];

  if (!food || typeof food !== 'object') {
    return deepFreeze({
      status: ELIGIBILITY_STATUS.INELIGIBLE,
      isEligible: false,
      reasons: ['Registro de alimento nulo ou inválido.'],
      warnings: [],
      food: null
    });
  }

  // 1. Verificação Estrutural Canônica
  const val = validateCanonicalFoodDTO(food);
  if (!val.isValid) {
    return deepFreeze({
      status: ELIGIBILITY_STATUS.INELIGIBLE,
      isEligible: false,
      reasons: val.errors,
      warnings: [],
      food: null
    });
  }

  let canonicalFood = food;
  if (food.isCustom === undefined) {
    try {
      canonicalFood = createCanonicalFoodDTO(food);
    } catch {
      canonicalFood = food;
    }
  }

  const foodId = canonicalFood.id || canonicalFood.foodId;
  const foodName = canonicalFood.name || canonicalFood.foodName;
  const unit = (canonicalFood.unit || canonicalFood.baseUnit || '').trim().toLowerCase();

  // 2. Rigor Dimensional de Unidade e Conversão
  if (unit === 'g' || unit === 'grama' || unit === 'gramas') {
    // Massa direta: perfeitamente elegível
  } else if (unit === 'ml' || unit === 'mls') {
    // Volume: requer densidade formal (g/ml)
    if (canonicalFood.density === undefined || canonicalFood.density === null || typeof canonicalFood.density !== 'number' || !Number.isFinite(canonicalFood.density) || canonicalFood.density <= 0) {
      reasons.push(`Alimento líquido em '${unit}' sem densidade formal cadastrada. Proibido assumir 1 ml = 1 g.`);
    }
  } else {
    // Medidas caseiras: exigem gramPerUnit específico
    if (canonicalFood.gramPerUnit === undefined || canonicalFood.gramPerUnit === null || typeof canonicalFood.gramPerUnit !== 'number' || !Number.isFinite(canonicalFood.gramPerUnit) || canonicalFood.gramPerUnit <= 0) {
      reasons.push(`Medida caseira '${unit}' sem gramPerUnit específico. Fallback genérico não permitido para o solver.`);
    }
  }

  // 3. Governança de Estado Bromatológico
  const bromatology = canonicalFood.bromatology || {};
  const energyStatus = bromatology.energyStatus;

  if (energyStatus === 'INCONSISTENTE') {
    if (!policy.allowInconsistentStatus) {
      reasons.push("Status bromatológico 'INCONSISTENTE' (discrepância Atwater > 10% nos dados de origem).");
    } else {
      warnings.push("Status bromatológico 'INCONSISTENTE' admitido sob override de política.");
    }
  } else if (energyStatus === 'REVISAR') {
    if (!policy.allowReviewStatus) {
      reasons.push("Status bromatológico 'REVISAR' rejeitado pela política (allowReviewStatus: false).");
    } else {
      warnings.push("Status bromatológico 'REVISAR' (discrepância Atwater 5-10% no catálogo).");
    }
  }

  // 4. Governança Culinária e Blacklist de Não-Refeições
  const excludeNonMealItems = options.excludeNonMealItems !== false && policy.excludeNonMealItems !== false;
  if (excludeNonMealItems && foodName) {
    const fn = foodName.trim();
    const isWithoutSugar = /sem\s+a[çc][uú]car/i.test(fn);
    if (!isWithoutSugar && (/(?:^|[,\s])a[çc][uú]car(?:[,\s]|$)|gla[çc][uú]car|xarope|melado|sacarose/i.test(fn))) {
      reasons.push("Ingrediente culinário industrial (açúcar/xarope puro) inelegível como refeição clínica.");
    } else if (/bcaa|glutamina|beta-alanina|creatina|arginina|citrulina|carnitina/i.test(fn)) {
      reasons.push("Pó isolado de aminoácido/ergogênico inelegível como alimento estruturador de refeição.");
    } else if (/banha\s+de\s+porco|gordura\s+vegetal\s+hidrogenada|azeite\s+de\s+dend[eê]/i.test(fn)) {
      reasons.push("Gordura industrial de cocção inelegível como alimento direto de cardápio.");
    } else if (/^sal\b|sal\s+(?:refinado|grosso|marinho|rosa|iodado|de\s+parrilla)|color[ií]fico|fermento\s+qu[ií]mico|bicarbonato|ado[çc]ante|sucralose|eritritol|xilitol|est[eé]via/i.test(fn)) {
      reasons.push("Condimento puro, sal, adoçante ou aditivo químico inelegível como alimento de refeição.");
    } else if (/refrigerante|bebida\s+energ[eé]tica/i.test(fn)) {
      reasons.push("Bebida gaseificada/refrigerante inelegível como alimento estruturador de refeição clínica.");
    }
  }

  // 5. Governança de Estilo Dietético & Protocolos com Ciclos/Fases
  let dietaryStyle = String(options.dietaryStyle || (options.context && options.context.options && options.context.options.dietaryStyle) || (options.solverOptions && options.solverOptions.dietaryStyle) || '').trim().toLowerCase().replace(/[\s_-]/g, '');
  if (dietaryStyle === 'lowvab' || dietaryStyle === 'lowcarb') dietaryStyle = 'lowcarb';
  if (dietaryStyle === 'keto') dietaryStyle = 'cetogenica';
  if (dietaryStyle === 'while30') dietaryStyle = 'whole30';
  const dietaryCycle = String(options.dietaryCycle || (options.context && options.context.options && options.context.options.dietaryCycle) || (options.solverOptions && options.solverOptions.dietaryCycle) || '').trim().toLowerCase();
  const includeSupplements = options.includeSupplements !== false && (options.context?.options?.includeSupplements !== false) && (options.solverOptions?.includeSupplements !== false);

  if (foodName) {
    const fn = foodName.trim();

    // Suplementação desativada
    if (!includeSupplements && /whey|suplemento|albumina\s+em\s+p[oó]|prote[ií]na\s+isolada/i.test(fn)) {
      reasons.push("Suplemento proteico desativado pelo nutricionista (includeSupplements: false).");
    }

    // Padrão Ovo-Lacto (plant-based com ovos e lácteos)
    if (dietaryStyle === 'ovolacto' || dietaryStyle === 'plant_based') {
      const isEgg = /ovo|clara/i.test(fn);
      const isMeatOrFish = !isEgg && /\b(frango|galinha|patinho|alcatra|maminha|picanha|bovino|boi|vaca|carne|peixe|til[aá]pia|atum|salm[aã]o|sardinha|bacalhau|merluza|pescada|camar[aã]o|lula|polvo|marisco|su[ií]no|porco|bacon|presunto|peru|chester|cordeiro)\b/i.test(fn);
      if (isMeatOrFish) {
        reasons.push("Alimento de origem animal (carne/peixe) incompatível com padrão ovo-lacto.");
      }
    }

    // Dukan: Fase de Ataque (PP) ou Cruzeiro (PP)
    if (dietaryStyle === 'dukan' && (dietaryCycle === 'dukan_ataque' || dietaryCycle === 'dukan_cruzeiro_pp' || !dietaryCycle)) {
      const isLeanProtein = /frango|patinho|alcatra|til[aá]pia|merluza|pescada|atum|salm[aã]o|sardinha|ovo|clara|cottage|ricota|leite\s+desnatado|iogurte\s+desnatado|whey/i.test(fn);
      const isOatBran = /farelo\s+de\s+aveia/i.test(fn);
      if (!isLeanProtein && !isOatBran) {
        reasons.push("Fase de Ataque/PP da Dieta Dukan permite exclusivamente proteínas magras e farelo de aveia.");
      }
    }

    // Dukan: Fase de Cruzeiro (PL - Proteína + Legumes)
    if (dietaryStyle === 'dukan' && dietaryCycle === 'dukan_cruzeiro_pl') {
      const isProtein = /frango|patinho|alcatra|til[aá]pia|merluza|pescada|atum|salm[aã]o|sardinha|ovo|clara|cottage|ricota|iogurte\s+desnatado|whey/i.test(fn);
      const isOatBran = /farelo\s+de\s+aveia/i.test(fn);
      const isAllowedVeg = /br[oó]colis|salada|alface|tomate|pepino|abobrinha|espinafre|couve|cogumelo|palmito|berinjela|cenoura/i.test(fn);
      if (!isProtein && !isOatBran && !isAllowedVeg) {
        reasons.push("Fase de Cruzeiro (PL) da Dieta Dukan restringe carboidratos feculentos, grãos, tubérculos e frutas.");
      }
    }

    // Cetogênica (Keto)
    if (dietaryStyle === 'cetogenica' && dietaryCycle !== 'keto_ciclica_refeed') {
      const isHighCarb = /arroz|feij[aã]o|gr[aã]o-de-bico|lentilha|batata|mandioca|aipim|aveia|p[aã]o|tapioca|torrada|biscoito|macarr[aã]o|milho|banana|mam[aã]o|ma[cç][aã]|manga|uva/i.test(fn);
      if (isHighCarb) {
        reasons.push("Alimento com alto teor de carboidratos incompatível com indução cetogênica.");
      }
    }

    // Whole30
    if (dietaryStyle === 'whole30' && dietaryCycle !== 'whole30_reintroducao') {
      const isGrain = /arroz|aveia|trigo|p[aã]o|milho|tapioca|quinoa|centeio|cevada|macarr[aã]o/i.test(fn);
      const isLegume = /feij[aã]o|lentilha|gr[aã]o-de-bico|amendoim|pasta\s+de\s+amendoim|soja|tofu/i.test(fn);
      const isDairy = /leite|queijo|cottage|minas|iogurte|manteiga|requeij[aã]o|nata|creme\s+de\s+leite|whey/i.test(fn);
      if (isGrain) {
        reasons.push("Whole30 proíbe rigorosamente todos os grãos e cereais.");
      } else if (isLegume) {
        reasons.push("Whole30 proíbe todas as leguminosas (feijões, soja, amendoim).");
      } else if (isDairy) {
        reasons.push("Whole30 proíbe laticínios de qualquer origem animal.");
      }
    }

    // Low Carb
    if (dietaryStyle === 'lowcarb') {
      const isUltraCarb = /p[aã]o\s+franc[eê]s|tapioca|refrigerante/i.test(fn);
      if (isUltraCarb) {
        reasons.push("Alimento de alta carga glicêmica incompatível com o padrão Low Carb.");
      }
      if (dietaryCycle === 'lowcarb_restrita' && /arroz|feij[aã]o|batata/i.test(fn)) {
        reasons.push("Alimento com densidade glicídica incompatível com Low Carb Restrita / Indução.");
      }
    }
  }

  // Se houver qualquer razão de bloqueio, o alimento é inelegível
  if (reasons.length > 0) {
    return deepFreeze({
      status: ELIGIBILITY_STATUS.INELIGIBLE,
      isEligible: false,
      reasons,
      warnings,
      food: null
    });
  }

  // Se houver avisos (ex: REVISAR), status é WARNING
  const status = warnings.length > 0 ? ELIGIBILITY_STATUS.WARNING : ELIGIBILITY_STATUS.ELIGIBLE;

  return deepFreeze({
    status,
    isEligible: true,
    reasons: [],
    warnings,
    food: canonicalFood
  });
}

/**
 * Filtra e categoriza um catálogo completo de alimentos com base na elegibilidade e restrições estruturadas
 * @param {Array<Object>} catalog 
 * @param {Object} [policy] 
 * @param {Object} [options] 
 * @returns {{ eligible: Array<Object>, warnings: Array<Object>, ineligible: Array<Object>, governanceWarnings: string[], summary: Object }}
 */
function filterEligibleFoods(catalog, policy = DEFAULT_ELIGIBILITY_POLICY, options = {}) {
  const eligible = [];
  const warningList = [];
  const ineligible = [];
  const governanceWarnings = [];

  const rawList = Array.isArray(catalog) ? catalog : [];
  const constraints = options.constraints || (options.context && options.context.constraints) || {};
  const excludedCategories = new Set(Array.isArray(constraints.excludedCategories) ? constraints.excludedCategories : []);
  const excludedFoodIds = new Set(Array.isArray(constraints.excludedFoodIds) ? constraints.excludedFoodIds : []);
  const excludedTags = new Set(Array.isArray(constraints.excludedTags) ? constraints.excludedTags : []);

  for (let i = 0; i < rawList.length; i++) {
    const rawFood = rawList[i];
    const foodId = rawFood && (rawFood.id || rawFood.foodId);

    // 1. Exclusão por ID explícito (food.id ∈ constraints.excludedFoodIds -> INELIGIBLE)
    if (foodId && excludedFoodIds.has(foodId)) {
      ineligible.push({
        food: rawFood,
        reasons: [`Alimento expressamente excluído por restrição formal de ID (foodId: ${foodId}).`]
      });
      continue;
    }

    // 2. Exclusão formal por categoria canônica (food.category ∈ constraints.excludedCategories -> INELIGIBLE)
    const category = rawFood && rawFood.category;
    if (category && excludedCategories.has(category)) {
      ineligible.push({
        food: rawFood,
        reasons: [`Categoria '${category}' excluída pelas restrições formais de categoria.`]
      });
      continue;
    }

    // 3. Exclusão formal por tag (food.tag ∈ constraints.excludedTags -> INELIGIBLE)
    if (rawFood && Array.isArray(rawFood.tags) && rawFood.tags.some((tag) => excludedTags.has(tag))) {
      ineligible.push({
        food: rawFood,
        reasons: ['Alimento excluído por conter tag formalmente restrita.']
      });
      continue;
    }

    // 3. Avaliação de elegibilidade padrão
    const evalResult = evaluateFoodEligibility(rawFood, policy, options);

    if (evalResult.isEligible) {
      if (evalResult.status === ELIGIBILITY_STATUS.WARNING) {
        warningList.push({
          food: evalResult.food,
          warnings: evalResult.warnings
        });
      }
      eligible.push(evalResult.food);
    } else {
      ineligible.push({
        food: rawFood,
        reasons: evalResult.reasons
      });
    }
  }

  // Ordenação determinística prévia dos elegíveis:
  // 1. Status bromatológico: CONSISTENTE antes de REVISAR
  // 2. foodId lexicográfico
  eligible.sort((a, b) => {
    const statusA = (a.bromatology && a.bromatology.energyStatus) || 'CONSISTENTE';
    const statusB = (b.bromatology && b.bromatology.energyStatus) || 'CONSISTENTE';
    if (statusA === 'CONSISTENTE' && statusB !== 'CONSISTENTE') return -1;
    if (statusA !== 'CONSISTENTE' && statusB === 'CONSISTENTE') return 1;
    return String(a.id || a.foodId).localeCompare(String(b.id || b.foodId));
  });

  const summary = {
    totalReceived: rawList.length,
    eligibleCount: eligible.length,
    warningCount: warningList.length,
    ineligibleCount: ineligible.length
  };

  return deepFreeze({
    eligible,
    warnings: warningList,
    ineligible,
    governanceWarnings,
    summary
  });
}

module.exports = {
  ELIGIBILITY_STATUS,
  DEFAULT_ELIGIBILITY_POLICY,
  adaptCatalogToCanonical,
  evaluateFoodEligibility,
  filterEligibleFoods
};
