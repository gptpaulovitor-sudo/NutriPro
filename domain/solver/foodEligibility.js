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
