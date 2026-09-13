/**
 * domain/timing/nutrientTimingValidator.js
 * 
 * Validador Canônico de Conservação, Integridade e Coerência de Nutrient Timing — NutriAx Pro.
 * Fase N3.5 — Nutrient Timing Específico.
 * 
 * Camada Pura — Sem I/O, sem UI, sem termos clínicos não fundamentados.
 */

'use strict';

const NutrientTimingContract = require('../contracts/NutrientTimingContract');
const {
  NUTRIENT_TIMING_STATUS,
  TEMPORAL_PRIMARY_RELATION,
  TEMPORAL_SECONDARY_RELATION,
  deepFreeze
} = NutrientTimingContract;

/**
 * Valida integralmente a saída da análise de Nutrient Timing contra as fases anteriores
 * 
 * @param {Object} output Saída proposta do Nutrient Timing
 * @param {Object} sourceTimingResult Resultado canônico da Fase N3.4 (Meal Timing)
 * @param {Object} [sourceAssemblyResult] Resultado opcional da Fase N3.3 (Meal Assembly)
 * @param {Object} [policy] Política de timing
 * @returns {{ isValid: boolean, isBlocked: boolean, errors: string[], warnings: string[], diagnostics: string[] }}
 */
function validateNutrientTiming(output, sourceTimingResult, sourceAssemblyResult = null, policy = {}) {
  const errors = [];
  const warnings = [];
  const diagnostics = [];

  // 1. Validação de Input
  if (!output || typeof output !== 'object') {
    return {
      isValid: false,
      isBlocked: true,
      errors: ['Saída de Nutrient Timing nula ou inválida.'],
      warnings: [],
      diagnostics: []
    };
  }

  // 2. Validação da N3.4 de Origem
  if (!sourceTimingResult || typeof sourceTimingResult !== 'object' || !Array.isArray(sourceTimingResult.meals)) {
    errors.push('sourceTimingResult da Fase N3.4 ausente ou inválido.');
    return {
      isValid: false,
      isBlocked: true,
      errors,
      warnings,
      diagnostics
    };
  }

  const analyzedMeals = Array.isArray(output.meals) ? output.meals : [];
  const sourceMeals = sourceTimingResult.meals;

  // 3. Invariante de Quantidade de Refeições
  if (analyzedMeals.length !== sourceMeals.length) {
    errors.push(`Quantidade de refeições alterada: N3.4 continha ${sourceMeals.length}, N3.5 gerou ${analyzedMeals.length}.`);
  }

  // Mapeamento das refeições originais por mealId
  const sourceMealsMap = new Map();
  sourceMeals.forEach(sm => sourceMealsMap.set(sm.mealId, sm));

  for (let i = 0; i < analyzedMeals.length; i++) {
    const am = analyzedMeals[i];
    if (!am || typeof am !== 'object') {
      errors.push(`Refeição analisada no índice ${i} é inválida.`);
      continue;
    }

    // 4. Preservação de Identidade da Refeição
    const originalMeal = sourceMealsMap.get(am.mealId);
    if (!originalMeal) {
      errors.push(`Refeição desconhecida ou mealId inventado: '${am.mealId}'. Proibido alterar identidade.`);
      continue;
    }

    if (am.mealIndex !== originalMeal.mealIndex) {
      errors.push(`Refeição '${am.mealId}': mealIndex alterado de ${originalMeal.mealIndex} para ${am.mealIndex}.`);
    }

    if (am.mealName !== originalMeal.mealName) {
      errors.push(`Refeição '${am.mealId}': mealName alterado.`);
    }

    if (am.mealRole !== originalMeal.mealRole) {
      errors.push(`Refeição '${am.mealId}': mealRole alterado.`);
    }

    // 5. Preservação Absoluta de Horários da N3.4
    if (am.scheduledTime !== originalMeal.scheduledTime) {
      errors.push(`Refeição '${am.mealId}': scheduledTime alterado (esperado "${originalMeal.scheduledTime}", recebido "${am.scheduledTime}"). N3.5 não pode alterar horários.`);
    }

    if (am.scheduledMinutes !== originalMeal.scheduledMinutes) {
      errors.push(`Refeição '${am.mealId}': scheduledMinutes alterado (esperado ${originalMeal.scheduledMinutes}, recebido ${am.scheduledMinutes}).`);
    }

    // 6. Preservação de Alimentos e Gramagens
    const origItems = originalMeal.items || [];
    const anItems = am.items || [];

    if (anItems.length !== origItems.length) {
      errors.push(`Refeição '${am.mealId}': quantidade de itens alterada (esperado ${origItems.length}, recebido ${anItems.length}).`);
    }

    for (let j = 0; j < origItems.length; j++) {
      const oItem = origItems[j];
      const aItem = anItems.find(it => it.foodId === oItem.foodId);

      if (!aItem) {
        errors.push(`Refeição '${am.mealId}': alimento '${oItem.foodId}' ausente na análise N3.5.`);
      } else {
        if (Math.abs(aItem.grams - oItem.grams) > 0.01) {
          errors.push(`Refeição '${am.mealId}': gramagem do alimento '${oItem.foodId}' alterada (${oItem.grams}g -> ${aItem.grams}g).`);
        }
      }
    }

    // 7. Preservação de Nutrientes por Refeição
    const oTot = originalMeal.totals || {};
    const aTot = am.totals || {};

    ['calories', 'protein', 'carbohydrate', 'fat'].forEach(nut => {
      const oVal = oTot[nut] !== undefined ? oTot[nut] : 0;
      const aVal = aTot[nut] !== undefined ? aTot[nut] : 0;
      if (Math.abs(aVal - oVal) > 0.05) {
        errors.push(`Refeição '${am.mealId}': total de ${nut} alterado (${oVal} -> ${aVal}). Proibido rebalancear na N3.5.`);
      }
    });

    // 8. Coerência das Relações Temporais
    if (!am.primaryRelation || !Object.values(TEMPORAL_PRIMARY_RELATION).includes(am.primaryRelation)) {
      errors.push(`Refeição '${am.mealId}': primaryRelation inválida ("${am.primaryRelation}").`);
    }

    if (!Array.isArray(am.secondaryRelations)) {
      errors.push(`Refeição '${am.mealId}': secondaryRelations deve ser um array.`);
    } else {
      am.secondaryRelations.forEach(sec => {
        if (!Object.values(TEMPORAL_SECONDARY_RELATION).includes(sec)) {
          errors.push(`Refeição '${am.mealId}': secondaryRelation desconhecida ("${sec}").`);
        }
      });
    }

    // 9. Explicabilidade (analysisReason)
    if (!am.analysisReason || typeof am.analysisReason !== 'string' || am.analysisReason.trim() === '') {
      errors.push(`Refeição '${am.mealId}': analysisReason obrigatória não informada.`);
    }

    // 10. Proibição de inventar distâncias quando eventos não possuem horários
    if (am.distanceToTrainingMinutes !== null && am.distanceToTrainingMinutes !== undefined) {
      if (typeof am.distanceToTrainingMinutes !== 'number' || isNaN(am.distanceToTrainingMinutes) || am.distanceToTrainingMinutes < 0) {
        errors.push(`Refeição '${am.mealId}': distanceToTrainingMinutes deve ser número não-negativo ou null.`);
      }
    }

    if (am.distanceToCardioMinutes !== null && am.distanceToCardioMinutes !== undefined) {
      if (typeof am.distanceToCardioMinutes !== 'number' || isNaN(am.distanceToCardioMinutes) || am.distanceToCardioMinutes < 0) {
        errors.push(`Refeição '${am.mealId}': distanceToCardioMinutes deve ser número não-negativo ou null.`);
      }
    }

    // 11. Colisão Física: OVERLAPPING_EVENT não pode resultar em PASS
    if (am.primaryRelation === TEMPORAL_PRIMARY_RELATION.OVERLAPPING_EVENT && output.status === NUTRIENT_TIMING_STATUS.PASS) {
      errors.push(`Refeição '${am.mealId}' possui colisão física OVERLAPPING_EVENT; status não pode ser PASS.`);
    }
  }

  // 12. Preservação dos Totais Globais
  const srcGlobal = sourceTimingResult.globalTotals || {};
  const curGlobal = output.globalTotals || {};

  ['calories', 'protein', 'carbohydrate', 'fat', 'fiber'].forEach(nut => {
    const sVal = srcGlobal[nut] !== undefined ? srcGlobal[nut] : 0;
    const cVal = curGlobal[nut] !== undefined ? curGlobal[nut] : 0;
    if (Math.abs(cVal - sVal) > 0.05) {
      errors.push(`Quebra de conservação global de ${nut}: N3.4 forneceu ${sVal}, N3.5 gerou ${cVal}.`);
    }
  });

  // 13. Preservação de Sódio quando disponível
  if (srcGlobal.sodium !== undefined && srcGlobal.sodium !== null) {
    if (Math.abs((curGlobal.sodium || 0) - srcGlobal.sodium) > 0.05) {
      errors.push(`Quebra de conservação global de sódio: N3.4 forneceu ${srcGlobal.sodium}, N3.5 gerou ${curGlobal.sodium}.`);
    }
  }

  // 14. Proveniência e Metadados
  if (!output.provenance || typeof output.provenance !== 'object') {
    errors.push('output.provenance deve ser um objeto descritivo.');
  } else {
    if (!output.provenance.engine || typeof output.provenance.engine !== 'string') {
      errors.push('output.provenance.engine é obrigatório.');
    }
    if (!output.provenance.analysisVersion || typeof output.provenance.analysisVersion !== 'string') {
      errors.push('output.provenance.analysisVersion é obrigatório.');
    }
  }

  // 15. Coerência de Status de Bloqueio
  if (output.status === NUTRIENT_TIMING_STATUS.BLOCKED && (!Array.isArray(output.blockingReasons) || output.blockingReasons.length === 0)) {
    errors.push('Status BLOCKED exige blockingReasons contendo pelo menos um motivo explicativo.');
  }

  // 16. Coerência de REST_DAY
  if (analyzedMeals.some(m => m.primaryRelation === TEMPORAL_PRIMARY_RELATION.REST_DAY)) {
    const isExplicitRest = output.globalDiagnostics && output.globalDiagnostics.some(d => /rest === true/i.test(d));
    if (!isExplicitRest) {
      warnings.push('Refeições classificadas como REST_DAY sem registro explícito de rest === true.');
    }
  }

  return deepFreeze({
    isValid: errors.length === 0,
    isBlocked: errors.length > 0,
    errors,
    warnings,
    diagnostics
  });
}

module.exports = deepFreeze({
  validateNutrientTiming
});
