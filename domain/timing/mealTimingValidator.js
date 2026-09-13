/**
 * domain/timing/mealTimingValidator.js
 * 
 * Validador Canônico de Integridade e Conservação Temporal — NutriAx Pro.
 * Fase N3.4 — Meal Timing / Distribuição Temporal Determinística.
 * 
 * Camada Pura — Sem I/O, sem UI, sem termos clínicos/dietéticos.
 */

'use strict';

const MealTimingContract = require('../contracts/MealTimingContract');
const { WINDOW_STRENGTH, deepFreeze } = MealTimingContract;

/**
 * Valida integralmente a conservação, coerência e integridade temporal do Meal Timing
 * 
 * @param {Object} output Saída proposta do Meal Timing
 * @param {Object} sourceAssemblyResult Resultado canônico da Fase N3.3 (Meal Assembly)
 * @param {Object} eatingWindow Janela alimentar resolvida
 * @param {Array<Object>} temporalEvents Eventos temporais mapeados
 * @param {Object} [policy] Política de timing
 * @returns {{ isValid: boolean, isBlocked: boolean, errors: string[], warnings: string[], diagnostics: string[] }}
 */
function validateMealTiming(output, sourceAssemblyResult, eatingWindow, temporalEvents = [], policy = {}) {
  const errors = [];
  const warnings = [];
  const diagnostics = [];

  if (!output || typeof output !== 'object') {
    return {
      isValid: false,
      isBlocked: true,
      errors: ['Saída de Meal Timing nula ou inválida.'],
      warnings: [],
      diagnostics: []
    };
  }

  const scheduledMeals = Array.isArray(output.meals) ? output.meals : [];
  const sourceMeals = (sourceAssemblyResult && Array.isArray(sourceAssemblyResult.meals)) ? sourceAssemblyResult.meals : [];

  // 1. Invariante de Quantidade de Refeições
  if (scheduledMeals.length !== sourceMeals.length) {
    errors.push(`Quantidade de refeições alterada: N3.3 continha ${sourceMeals.length}, N3.4 gerou ${scheduledMeals.length}.`);
  }

  // Mapeamento das refeições originais por mealId
  const sourceMealsMap = new Map();
  sourceMeals.forEach(sm => sourceMealsMap.set(sm.mealId, sm));

  let prevMinutes = -1;

  for (let i = 0; i < scheduledMeals.length; i++) {
    const sm = scheduledMeals[i];
    if (!sm || typeof sm !== 'object') {
      errors.push(`Refeição agendada no índice ${i} é inválida.`);
      continue;
    }

    // 2. Preservação de Identidade da Refeição
    const originalMeal = sourceMealsMap.get(sm.mealId);
    if (!originalMeal) {
      errors.push(`Refeição desconhecida ou mealId inventado: '${sm.mealId}'. Proibido alterar identidade de refeição.`);
      continue;
    }

    if (sm.mealIndex !== originalMeal.mealIndex) {
      errors.push(`Refeição '${sm.mealId}' teve seu mealIndex alterado de ${originalMeal.mealIndex} para ${sm.mealIndex}.`);
    }

    if (sm.mealName !== originalMeal.mealName) {
      errors.push(`Refeição '${sm.mealId}' teve seu mealName alterado.`);
    }

    if (sm.mealRole !== originalMeal.mealRole) {
      errors.push(`Refeição '${sm.mealId}' teve seu mealRole alterado.`);
    }

    // 3. Validação dos Campos de Horário
    if (!sm.scheduledTime || typeof sm.scheduledTime !== 'string' || !/^[0-2][0-9]:[0-5][0-9]$/.test(sm.scheduledTime)) {
      errors.push(`Refeição '${sm.mealId}' possui scheduledTime inválido (${sm.scheduledTime}).`);
    }

    if (typeof sm.scheduledMinutes !== 'number' || !Number.isInteger(sm.scheduledMinutes) || sm.scheduledMinutes < 0 || sm.scheduledMinutes > 1439) {
      errors.push(`Refeição '${sm.mealId}' possui scheduledMinutes inválido (${sm.scheduledMinutes}).`);
    }

    // 4. Ordem Temporal Sequencial Crescente
    if (sm.scheduledMinutes !== undefined && sm.scheduledMinutes <= prevMinutes) {
      errors.push(`Inversão ou colisão temporal: refeição '${sm.mealId}' (${sm.scheduledTime}, ${sm.scheduledMinutes} min) agendada antes ou no mesmo horário da anterior (${prevMinutes} min).`);
    }
    prevMinutes = sm.scheduledMinutes;

    // 5. Preservação Integral de Alimentos e Nutrientes de Cada Refeição
    const sourceItems = originalMeal.items || [];
    const scheduledItems = sm.items || [];

    if (scheduledItems.length !== sourceItems.length) {
      errors.push(`Refeição '${sm.mealId}': quantidade de alimentos alterada (esperado ${sourceItems.length}, encontrado ${scheduledItems.length}).`);
    }

    for (let j = 0; j < sourceItems.length; j++) {
      const srcItem = sourceItems[j];
      const schItem = scheduledItems.find(it => it.foodId === srcItem.foodId);

      if (!schItem) {
        errors.push(`Refeição '${sm.mealId}': alimento '${srcItem.foodId}' foi perdido no timing.`);
      } else {
        if (Math.abs(schItem.grams - srcItem.grams) > 0.01) {
          errors.push(`Refeição '${sm.mealId}': massa do alimento '${srcItem.foodId}' alterada (esperado ${srcItem.grams} g, encontrado ${schItem.grams} g).`);
        }
        if (Math.abs((schItem.nutrients && schItem.nutrients.calories || 0) - (srcItem.nutrients && srcItem.nutrients.calories || 0)) > 0.05) {
          errors.push(`Refeição '${sm.mealId}': calorias do alimento '${srcItem.foodId}' alteradas.`);
        }
      }
    }

    // 6. Conformidade com a Janela Alimentar
    if (eatingWindow && typeof eatingWindow.startMinutes === 'number' && typeof eatingWindow.endMinutes === 'number') {
      const isOutsideWindow = sm.scheduledMinutes < eatingWindow.startMinutes || sm.scheduledMinutes > eatingWindow.endMinutes;
      if (isOutsideWindow) {
        if (eatingWindow.strength === WINDOW_STRENGTH.HARD) {
          errors.push(`Refeição '${sm.mealId}' (${sm.scheduledTime}) posicionada fora da janela alimentar estrita HARD (${eatingWindow.start} - ${eatingWindow.end}).`);
        } else {
          warnings.push(`Refeição '${sm.mealId}' (${sm.scheduledTime}) extrapolou a janela preferencial PREFERRED (${eatingWindow.start} - ${eatingWindow.end}).`);
        }
      }
    }

    // 7. Não-colisão com Eventos de Treino e Cardio
    temporalEvents.forEach(ev => {
      // Sobreposição física: se a refeição está dentro da sessão de treino/cardio
      if (sm.scheduledMinutes >= ev.startMinutes && sm.scheduledMinutes <= ev.endMinutes) {
        errors.push(`Refeição '${sm.mealId}' (${sm.scheduledTime}) colidiu fisicamente com o evento de ${ev.eventType} (${ev.start} - ${ev.end}).`);
      }
    });
  }

  // 8. Conservação dos Totais Globais
  const sourceTotals = sourceAssemblyResult.globalTotals || {};
  const currentTotals = output.globalTotals || {};

  ['calories', 'protein', 'carbohydrate', 'fat', 'fiber'].forEach(nut => {
    const srcVal = sourceTotals[nut] !== undefined ? sourceTotals[nut] : 0;
    const curVal = currentTotals[nut] !== undefined ? currentTotals[nut] : 0;
    if (Math.abs(curVal - srcVal) > 0.05) {
      errors.push(`Quebra de conservação global de ${nut}: N3.3 forneceu ${srcVal}, N3.4 possui ${curVal}.`);
    }
  });

  // 9. Intervalos Mínimos e Máximos
  const hardMinInterval = policy.hardMinMealInterval || 45;
  const preferredMinInterval = policy.preferredMinMealInterval || 120;
  const preferredMaxInterval = policy.preferredMaxMealInterval || 300;

  for (let i = 0; i < scheduledMeals.length - 1; i++) {
    const diff = scheduledMeals[i + 1].scheduledMinutes - scheduledMeals[i].scheduledMinutes;

    if (diff < hardMinInterval) {
      errors.push(`Intervalo entre refeição ${i + 1} e ${i + 2} (${diff} min) violou o limite físico estrito de ${hardMinInterval} min.`);
    } else if (diff < preferredMinInterval) {
      warnings.push(`Intervalo entre refeição ${i + 1} e ${i + 2} (${diff} min) menor que o preferencial de ${preferredMinInterval} min.`);
    }

    if (diff > preferredMaxInterval) {
      warnings.push(`Intervalo entre refeição ${i + 1} e ${i + 2} (${diff} min) maior que o preferencial de ${preferredMaxInterval} min.`);
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
  validateMealTiming
});
