/**
 * domain/meal/mealAssemblyValidator.js
 * 
 * Validador Canônico de Conservação e Integridade de Refeições — NutriAx Pro.
 * Fase N3.3 — Meal Assembly Determinístico Canônico.
 * 
 * Camada Pura — Sem I/O, sem UI, sem termos clínicos/temporais.
 */

'use strict';

const MealAssemblyContract = require('../contracts/MealAssemblyContract');
const { deepFreeze } = MealAssemblyContract;

/**
 * Arredonda valor para número fixo de casas decimais
 * @param {number} val 
 * @param {number} decimals 
 * @returns {number}
 */
function roundTo(val, decimals = 2) {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 0;
  const factor = 10 ** decimals;
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Valida integralmente as invariantes de conservação e estrutura do Meal Assembly
 * 
 * @param {Object} output Saída proposta do Meal Assembly (ou dados estruturados de refeições)
 * @param {Array<Object>} sourceItems Itens canônicos originais produzidos pelo N3.2
 * @param {Object} globalSourceTotals Totais nutricionais originais do N3.2
 * @param {Object} [options] Opções de tolerância
 * @returns {{ isValid: boolean, isBlocked: boolean, errors: string[], warnings: string[], diagnostics: string[] }}
 */
function validateMealAssembly(output, sourceItems, globalSourceTotals, options = {}) {
  const errors = [];
  const warnings = [];
  const diagnostics = [];

  const massTolerance = options.massTolerance !== undefined ? options.massTolerance : 0.05;
  const energyTolerance = options.energyTolerance !== undefined ? options.energyTolerance : 0.10;
  const macroTolerance = options.macroTolerance !== undefined ? options.macroTolerance : 0.10;

  if (!output || typeof output !== 'object') {
    return {
      isValid: false,
      isBlocked: true,
      errors: ['Saída de Meal Assembly nula ou inválida.'],
      warnings: [],
      diagnostics: []
    };
  }

  const meals = Array.isArray(output.meals) ? output.meals : [];
  if (meals.length === 0) {
    return {
      isValid: false,
      isBlocked: true,
      errors: ['O array de refeições gerado está vazio.'],
      warnings: [],
      diagnostics: []
    };
  }

  // 1. Estrutura de Refeições e Índices Únicos
  const seenMealIndices = new Set();
  const seenMealIds = new Set();

  for (let m = 0; m < meals.length; m++) {
    const meal = meals[m];
    if (!meal || typeof meal !== 'object') {
      errors.push(`Refeição no índice ${m} é nula ou inválida.`);
      continue;
    }

    if (typeof meal.mealIndex !== 'number' || !Number.isInteger(meal.mealIndex) || meal.mealIndex < 0) {
      errors.push(`Refeição no índice ${m} possui mealIndex inválido (${meal.mealIndex}).`);
    } else if (seenMealIndices.has(meal.mealIndex)) {
      errors.push(`mealIndex duplicado detectado: ${meal.mealIndex}.`);
    } else {
      seenMealIndices.add(meal.mealIndex);
    }

    if (!meal.mealId || typeof meal.mealId !== 'string') {
      errors.push(`Refeição no índice ${m} possui mealId inválido.`);
    } else if (seenMealIds.has(meal.mealId)) {
      errors.push(`mealId duplicado detectado: ${meal.mealId}.`);
    } else {
      seenMealIds.add(meal.mealId);
    }

    if (!meal.mealRole || typeof meal.mealRole !== 'string') {
      errors.push(`Refeição '${meal.mealId || m}' não possui mealRole definido.`);
    }

    if (!Array.isArray(meal.items)) {
      errors.push(`Refeição '${meal.mealId || m}' possui items inválido (não é array).`);
    }
  }

  // 2. Mapeamento de Itens Fonte do N3.2
  const sourceItemsMap = new Map();
  const sourceIdsSet = new Set();

  for (let i = 0; i < sourceItems.length; i++) {
    const sItem = sourceItems[i];
    sourceItemsMap.set(sItem.foodId, sItem);
    sourceIdsSet.add(sItem.foodId);
  }

  // 3. Verificação de Alimentos Alocados
  const allocatedMassByFoodId = new Map();
  const allocatedFoodIds = new Set();

  let totalAllocatedCalories = 0;
  let totalAllocatedProtein = 0;
  let totalAllocatedCarb = 0;
  let totalAllocatedFat = 0;
  let totalAllocatedFiber = 0;
  let totalAllocatedSodium = 0;

  let allSourceItemsHaveSodium = true;
  for (let i = 0; i < sourceItems.length; i++) {
    if (sourceItems[i].nutrients.sodium === null || sourceItems[i].nutrients.sodium === undefined) {
      allSourceItemsHaveSodium = false;
      break;
    }
  }

  for (let m = 0; m < meals.length; m++) {
    const meal = meals[m];
    const items = Array.isArray(meal.items) ? meal.items : [];
    const itemsInThisMeal = new Set();

    let mealCal = 0;
    let mealProt = 0;
    let mealCarb = 0;
    let mealFat = 0;
    let mealFib = 0;
    let mealSod = 0;
    let mealHasUnknownSodium = false;

    for (let j = 0; j < items.length; j++) {
      const it = items[j];
      if (!it || typeof it !== 'object') {
        errors.push(`Item de índice ${j} na refeição '${meal.mealId}' é inválido.`);
        continue;
      }

      // Proibição de duplicação indevida na MESMA refeição
      if (itemsInThisMeal.has(it.foodId)) {
        errors.push(`Alimento '${it.foodId}' duplicado indevidamente na mesma refeição '${meal.mealId}'.`);
      }
      itemsInThisMeal.add(it.foodId);

      // Nenhum foodId inventado ou desconhecido
      if (!sourceIdsSet.has(it.foodId)) {
        errors.push(`Alimento desconhecido '${it.foodId}' encontrado na refeição '${meal.mealId}'. Alimentos novos são proibidos no Meal Assembly.`);
      }

      // Nenhuma quantidade <= 0
      if (typeof it.grams !== 'number' || !Number.isFinite(it.grams) || it.grams <= 0) {
        errors.push(`Alimento '${it.foodId}' na refeição '${meal.mealId}' possui massa inválida ou <= 0 (${it.grams}).`);
      } else {
        const currentMass = allocatedMassByFoodId.get(it.foodId) || 0;
        allocatedMassByFoodId.set(it.foodId, currentMass + it.grams);
      }

      allocatedFoodIds.add(it.foodId);

      // Agregação de nutrientes
      const nut = it.nutrients || {};
      mealCal += (nut.calories || 0);
      mealProt += (nut.protein || 0);
      mealCarb += (nut.carbohydrate || 0);
      mealFat += (nut.lipid !== undefined ? nut.lipid : (nut.fat || 0));
      mealFib += (nut.fiber || 0);

      if (nut.sodium === null || nut.sodium === undefined) {
        mealHasUnknownSodium = true;
      } else {
        mealSod += nut.sodium;
      }
    }

    // Validação de coerência dos totais da refeição
    const mealTotals = meal.totals || {};
    if (Math.abs((mealTotals.calories || 0) - mealCal) > energyTolerance) {
      errors.push(`Refeição '${meal.mealId}': total de calorias declarado (${mealTotals.calories}) difere da soma dos itens (${roundTo(mealCal, 2)}).`);
    }
    if (Math.abs((mealTotals.protein || 0) - mealProt) > macroTolerance) {
      errors.push(`Refeição '${meal.mealId}': total de proteína declarado (${mealTotals.protein}) difere da soma dos itens (${roundTo(mealProt, 2)}).`);
    }

    totalAllocatedCalories += mealCal;
    totalAllocatedProtein += mealProt;
    totalAllocatedCarb += mealCarb;
    totalAllocatedFat += mealFat;
    totalAllocatedFiber += mealFib;
    if (!mealHasUnknownSodium) {
      totalAllocatedSodium += mealSod;
    }
  }

  // 4. Invariante Obrigatória: Nenhum alimento perdido
  sourceIdsSet.forEach((srcId) => {
    if (!allocatedFoodIds.has(srcId)) {
      errors.push(`Alimento '${srcId}' da solução global N3.2 foi perdido e não alocado em nenhuma refeição.`);
    }
  });

  // 5. Invariante Obrigatória: Conservação exata de massa por foodId
  sourceItems.forEach((src) => {
    const allocatedMass = allocatedMassByFoodId.get(src.foodId) || 0;
    const diffMass = Math.abs(allocatedMass - src.grams);
    if (diffMass > massTolerance) {
      errors.push(`Quebra de conservação de massa no alimento '${src.foodId}': N3.2 forneceu ${src.grams} g, mas refeições somaram ${roundTo(allocatedMass, 2)} g (diff: ${roundTo(diffMass, 3)} g).`);
    }
  });

  // 6. Invariante Obrigatória: Conservação Global de Energia e Macronutrientes
  const sourceCal = globalSourceTotals.calories !== undefined ? globalSourceTotals.calories : 0;
  const sourceProt = globalSourceTotals.protein !== undefined ? globalSourceTotals.protein : 0;
  const sourceCarb = globalSourceTotals.carbohydrate !== undefined ? globalSourceTotals.carbohydrate : 0;
  const sourceFat = globalSourceTotals.fat !== undefined ? globalSourceTotals.fat : (globalSourceTotals.lipid || 0);
  const sourceFib = globalSourceTotals.fiber !== undefined ? globalSourceTotals.fiber : 0;

  const diffCal = Math.abs(totalAllocatedCalories - sourceCal);
  if (diffCal > energyTolerance) {
    errors.push(`Quebra de conservação global de energia: N3.2 forneceu ${sourceCal} kcal, refeições somaram ${roundTo(totalAllocatedCalories, 2)} kcal (diff: ${roundTo(diffCal, 2)} kcal).`);
  }

  const diffProt = Math.abs(totalAllocatedProtein - sourceProt);
  if (diffProt > macroTolerance) {
    errors.push(`Quebra de conservação global de proteína: N3.2 forneceu ${sourceProt} g, refeições somaram ${roundTo(totalAllocatedProtein, 2)} g.`);
  }

  const diffCarb = Math.abs(totalAllocatedCarb - sourceCarb);
  if (diffCarb > macroTolerance) {
    errors.push(`Quebra de conservação global de carboidratos: N3.2 forneceu ${sourceCarb} g, refeições somaram ${roundTo(totalAllocatedCarb, 2)} g.`);
  }

  const diffFat = Math.abs(totalAllocatedFat - sourceFat);
  if (diffFat > macroTolerance) {
    errors.push(`Quebra de conservação global de lipídios: N3.2 forneceu ${sourceFat} g, refeições somaram ${roundTo(totalAllocatedFat, 2)} g.`);
  }

  const diffFib = Math.abs(totalAllocatedFiber - sourceFib);
  if (diffFib > macroTolerance) {
    errors.push(`Quebra de conservação global de fibras: N3.2 forneceu ${sourceFib} g, refeições somaram ${roundTo(totalAllocatedFiber, 2)} g.`);
  }

  // 7. Conservação de Sódio ou Diagnóstico de Dados Ausentes
  if (allSourceItemsHaveSodium) {
    const sourceSod = globalSourceTotals.sodium !== undefined ? globalSourceTotals.sodium : 0;
    const diffSod = Math.abs(totalAllocatedSodium - sourceSod);
    if (diffSod > 1.0) {
      errors.push(`Quebra de conservação global de sódio: N3.2 forneceu ${sourceSod} mg, refeições somaram ${roundTo(totalAllocatedSodium, 2)} mg.`);
    }
  } else {
    diagnostics.push('SODIUM_DATA_INCOMPLETE: Um ou mais alimentos não possuem dados de sódio cadastrados. O valor não foi fabricado e a conservação global de sódio foi preservada como indeterminada.');
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
  roundTo,
  validateMealAssembly
});
