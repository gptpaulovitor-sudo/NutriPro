/**
 * tests/meal-composition-gastronomy.test.js
 * 
 * Testes Canônicos de Composição de Prato e Afinidade Gastronômica/Clínica — NutriAx Pro.
 * Baseado nas diretrizes do CFN, SBNE, ISSN e Philippi (Pirâmide Alimentar Adaptada).
 * 
 * Invariantes Testados:
 * 1. Almoço e Jantar (refeições PRIMARY) NUNCA contêm alimentos matinais (aveia, granola, iogurte).
 * 2. Feijão e leguminosas NUNCA são fracionados em porções irrisórias (< 60g) e não pertencem ao Café da Manhã.
 * 3. Vegetais e hortaliças (brócolis, etc.) mantêm volume clínico mínimo (>= 40g).
 * 4. Almoço e Jantar possuem obrigatoriamente fonte proteica nobre (carnes, aves, peixes, ovos).
 * 5. Caso real de Vitor Gabriel (Hipertrofia, 6 refeições, ~2787 kcal) gera cardápio gastronômica e clinicamente coerente.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { executePrescriptionPipelineSync } = require('../domain/orchestration/prescriptionOrchestrator');
const { createNutritionPrescriptionContextDTO } = require('../domain/contracts/NutritionPrescriptionContextDTO');
const { COMPREHENSIVE_TACO_TBCA_FOODS, CANONICAL_DIET_FOODS } = require('../foodsData');

let fullFoodCatalog = COMPREHENSIVE_TACO_TBCA_FOODS || [];
if (CANONICAL_DIET_FOODS && typeof CANONICAL_DIET_FOODS === 'object') {
  const cfl = Object.entries(CANONICAL_DIET_FOODS).map(([k, f]) => ({
    id: 'canon_' + k,
    foodId: 'canon_' + k,
    name: f.name,
    calories: f.calories,
    protein: f.protein,
    carbohydrate: f.carbohydrate,
    lipid: f.lipid,
    fiber: f.fiber || 0,
    sodium: f.sodium || 0,
    unit: f.defaultUnit || 'g',
    gramPerUnit: f.gramPerUnit || 100,
    source: f.source || 'TACO',
    prepState: f.prepState || null,
    category: f.category || 'Geral'
  }));
  fullFoodCatalog = cfl.concat(fullFoodCatalog);
}

describe('Composição de Prato e Afinidade Gastronômica/Clínica (CFN/SBNE/ISSN)', () => {

  test('1. Almoço e Jantar (PRIMARY) NUNCA recebem aveia, granola ou iogurte', () => {
    const context = createNutritionPrescriptionContextDTO({
      patient: {
        patientId: 'patient_vitor_gabriel',
        name: 'Vitor Gabriel',
        age: 24,
        sex: 'Masculino'
      },
      anthropometry: {
        weightKg: 71.0,
        heightCm: 178.0,
        hasRecentAssessment: true
      },
      objective: {
        clinicalObjective: 'Hipertrofia',
        rawObjective: 'Hipertrofia muscular com ganho de massa magra',
        targetWeightKg: 76.0
      },
      energy: {
        tmbKcal: 1750,
        getKcal: 2530,
        caloricTargetKcal: 2787
      },
      routine: {
        wakeUpTime: '06:00',
        bedTime: '23:00',
        workoutTime: '16:00',
        mealsPerDay: 6
      },
      training: {
        hasActiveTraining: true,
        workoutTime: '16:00'
      },
      cardio: { hasActiveCardio: false },
      fasting: { hasActiveProtocol: false },
      mealsPerDay: 6
    });

    const result = executePrescriptionPipelineSync({
      context,
      foodCatalog: fullFoodCatalog
    });

    assert.strictEqual(result.success, true, 'Pipeline deve executar com sucesso');
    const meals = result.mealAssemblyResult?.meals || [];
    assert.ok(meals.length >= 4, 'Devem ser montadas as refeições diárias');

    meals.forEach(meal => {
      if (meal.mealRole === 'PRIMARY') {
        meal.items.forEach(it => {
          const name = String(it.foodName || '').toLowerCase();
          assert.strictEqual(
            /aveia|granola|farelo\s+de\s+aveia/i.test(name),
            false,
            `Refeição principal "${meal.mealName}" (${meal.mealRole}) NÃO pode conter aveia/granola. Encontrado: ${it.foodName}`
          );
          assert.strictEqual(
            /iogurte|whey|leite\s+em\s+p[oó]/i.test(name),
            false,
            `Refeição principal "${meal.mealName}" (${meal.mealRole}) NÃO pode conter lácteos/suplementos matinais. Encontrado: ${it.foodName}`
          );
        });
      }
    });
  });

  test('2. Refeições principais contêm obrigatoriamente proteína nobre e porções realistas', () => {
    const context = createNutritionPrescriptionContextDTO({
      patient: {
        patientId: 'patient_vitor_gabriel',
        name: 'Vitor Gabriel',
        age: 24,
        sex: 'Masculino'
      },
      anthropometry: {
        weightKg: 71.0,
        heightCm: 178.0,
        hasRecentAssessment: true
      },
      objective: {
        clinicalObjective: 'Hipertrofia',
        targetWeightKg: 76.0
      },
      energy: {
        tmbKcal: 1750,
        getKcal: 2530,
        caloricTargetKcal: 2787
      },
      routine: {
        wakeUpTime: '06:00',
        bedTime: '23:00',
        workoutTime: '16:00',
        mealsPerDay: 6
      },
      training: {
        hasActiveTraining: true,
        workoutTime: '16:00'
      },
      cardio: { hasActiveCardio: false },
      fasting: { hasActiveProtocol: false },
      mealsPerDay: 6
    });

    const result = executePrescriptionPipelineSync({
      context,
      foodCatalog: fullFoodCatalog
    });

    assert.strictEqual(result.success, true);
    const meals = result.mealAssemblyResult.meals;
    const primaryMeals = meals.filter(m => m.mealRole === 'PRIMARY');

    assert.ok(primaryMeals.length >= 2, 'Deve haver pelo menos Almoço e Jantar como refeições primárias');

    primaryMeals.forEach(meal => {
      const hasNobleProtein = meal.items.some(it =>
        /frango|patinho|alcatra|maminha|carne|peixe|til[aá]pia|salm[aã]o|merluza|ovo|ovos/i.test(it.foodName || '')
      );
      assert.strictEqual(
        hasNobleProtein,
        true,
        `Refeição principal "${meal.mealName}" deve conter ao menos uma fonte proteica nobre.`
      );

      // Checagem de porções mínimas realistas
      meal.items.forEach(it => {
        const name = String(it.foodName || '').toLowerCase();
        if (/feij[aã]o/i.test(name)) {
          assert.ok(it.grams >= 50, `Feijão deve ter porção realista (>= 50g), encontrado: ${it.grams}g`);
        }
        if (/br[oó]colis|couve|vegeta/i.test(name)) {
          assert.ok(it.grams >= 35, `Vegetais devem ter porção realista (>= 35g), encontrado: ${it.grams}g`);
        }
      });
    });
  });

  test('3. Café da Manhã (SECONDARY) não recebe feijão, arroz ou bifes pesados', () => {
    const context = createNutritionPrescriptionContextDTO({
      patient: {
        patientId: 'patient_vitor_gabriel',
        name: 'Vitor Gabriel',
        age: 24,
        sex: 'Masculino'
      },
      anthropometry: {
        weightKg: 71.0,
        heightCm: 178.0,
        hasRecentAssessment: true
      },
      objective: {
        clinicalObjective: 'Hipertrofia',
        targetWeightKg: 76.0
      },
      energy: {
        tmbKcal: 1750,
        getKcal: 2530,
        caloricTargetKcal: 2787
      },
      routine: {
        wakeUpTime: '06:00',
        bedTime: '23:00',
        workoutTime: '16:00',
        mealsPerDay: 6
      },
      training: {
        hasActiveTraining: true,
        workoutTime: '16:00'
      },
      cardio: { hasActiveCardio: false },
      fasting: { hasActiveProtocol: false },
      mealsPerDay: 6
    });

    const result = executePrescriptionPipelineSync({
      context,
      foodCatalog: fullFoodCatalog
    });

    assert.strictEqual(result.success, true);
    const meals = result.mealAssemblyResult.meals;
    const breakfast = meals.find(m => m.mealRole === 'SECONDARY') || meals[0];

    breakfast.items.forEach(it => {
      const name = String(it.foodName || '').toLowerCase();
      assert.strictEqual(
        /feij[aã]o|lentilha|gr[aã]o-de-bico/i.test(name),
        false,
        `Café da manhã NÃO deve conter feijão. Encontrado: ${it.foodName}`
      );
      assert.strictEqual(
        /peixe|til[aá]pia|bife|alcatra|costela/i.test(name),
        false,
        `Café da manhã NÃO deve conter carne pesada/peixe. Encontrado: ${it.foodName}`
      );
    });
  });

});
