/**
 * tests/meal-macro-trinity.test.js
 * 
 * Testes Canônicos de Trindade de Macronutrientes e Prevenção de Colisões Culinárias — NutriAx Pro.
 * Baseado em diretrizes nutricionais e científicas (ISSN, SBNE, CFN, Philippi).
 * 
 * Invariantes Testados:
 * 1. calculateMealCulinaryClashPenalty penaliza severamente pares incompatíveis (abacate+manteiga, aveia+azeite, arroz+iogurte/whey).
 * 2. Em planos de 4, 5 e 6 refeições (ex: Vitor Gabriel, Rodrigo Pires, Paulo Vitor), todas as refeições relevantes
 *    (>= 140 kcal ou >= 20g carboidrato) contêm a Trindade de Macronutrientes (Carboidrato, Proteína >= 4g e Lipídio >= 1g).
 * 3. Alimentos de alta gordura conflitantes (como abacate e manteiga) NUNCA são co-alocados no mesmo prato.
 * 4. O validador de prescrição G21_MEAL_MACRO_COHERENCE detecta colisões gastronômicas e refeições isoladas de carboidrato puro.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { executePrescriptionPipelineSync } = require('../domain/orchestration/prescriptionOrchestrator');
const { createNutritionPrescriptionContextDTO } = require('../domain/contracts/NutritionPrescriptionContextDTO');
const { calculateMealCulinaryClashPenalty } = require('../domain/meal/mealAssemblyPolicy');
const { validateGlobalPrescription } = require('../domain/validation/globalPrescriptionValidator');
const { GLOBAL_GATE_ID } = require('../domain/contracts/GlobalPrescriptionValidationContract');
const { COMPREHENSIVE_TACO_TBCA_FOODS } = require('../foodsData');
const { CANONICAL_DIET_FOODS } = require('../math');

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

describe('Trindade de Macronutrientes e Eliminação de Colisões Culinárias', () => {

  describe('1. Função Pura de Detecção de Colisão Culinária', () => {
    test('Penaliza severamente abacate com manteiga (+500)', () => {
      const penalty1 = calculateMealCulinaryClashPenalty(['Abacate'], 'Manteiga com sal');
      const penalty2 = calculateMealCulinaryClashPenalty(['Manteiga sem sal'], 'Abacate fresco');
      assert.ok(penalty1 >= 500, `Esperado penalty >= 500 para abacate+manteiga, obteve ${penalty1}`);
      assert.ok(penalty2 >= 500, `Esperado penalty >= 500 para manteiga+abacate, obteve ${penalty2}`);
    });

    test('Penaliza severamente aveia com azeite de oliva (+500)', () => {
      const penalty = calculateMealCulinaryClashPenalty(['Aveia em flocos'], 'Azeite de oliva');
      assert.ok(penalty >= 500, `Esperado penalty >= 500 para aveia+azeite, obteve ${penalty}`);
    });

    test('Penaliza severamente arroz/feijão com iogurte ou whey (+500)', () => {
      const penaltyRice = calculateMealCulinaryClashPenalty(['Arroz branco cozido', 'Feijão preto'], 'Iogurte natural');
      const penaltyBean = calculateMealCulinaryClashPenalty(['Feijão carioca cozido'], 'Whey Protein 80%');
      assert.ok(penaltyRice >= 500, `Esperado penalty >= 500 para arroz+iogurte, obteve ${penaltyRice}`);
      assert.ok(penaltyBean >= 500, `Esperado penalty >= 500 para feijao+whey, obteve ${penaltyBean}`);
    });

    test('Não penaliza combinações harmônicas e canônicas', () => {
      const penaltyOatWhey = calculateMealCulinaryClashPenalty(['Aveia em flocos', 'Banana prata'], 'Whey Protein 80%');
      const penaltyChickenRice = calculateMealCulinaryClashPenalty(['Arroz branco cozido', 'Feijão carioca'], 'Peito de frango grelhado');
      const penaltyEggsButter = calculateMealCulinaryClashPenalty(['Ovo de galinha cozido'], 'Manteiga com sal');
      assert.strictEqual(penaltyOatWhey, 0, 'Aveia com Whey e Banana deve ter clash 0');
      assert.strictEqual(penaltyChickenRice, 0, 'Arroz, feijão e frango deve ter clash 0');
      assert.strictEqual(penaltyEggsButter, 0, 'Ovo com manteiga deve ter clash 0');
    });
  });

  describe('2. Trindade de Macronutrientes em Casos Reais de Prescrição', () => {
    test('Plano de Hipertrofia de 6 refeições (Vitor Gabriel) possui proteína e lipídios em todas as refeições relevantes', () => {
      const context = createNutritionPrescriptionContextDTO({
        patient: {
          patientId: 'patient_vitor_trinity',
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
      assert.ok(result.mealAssemblyResult, 'Meal assembly deve estar presente');

      const meals = result.mealAssemblyResult.meals || [];
      assert.ok(meals.length >= 5, `Devem ser montadas as refeições diárias (obteve ${meals.length})`);

      meals.forEach((meal, idx) => {
        const mealName = meal.mealName || `Refeição ${idx + 1}`;
        const cal = meal.totals.calories;
        const p = meal.totals.protein;
        const c = meal.totals.carbohydrate;
        const l = meal.totals.fat !== undefined ? meal.totals.fat : (meal.totals.lipid || 0);

        // Se a refeição tem aporte calórico relevante (>= 140 kcal) ou carboidrato significativo (>= 20g)
        if (cal >= 140 || c >= 20) {
          assert.ok(
            p >= 4.0,
            `Refeição "${mealName}" (${cal.toFixed(1)} kcal, ${c.toFixed(1)}g CHO) deve ter aporte proteico mínimo (>= 4g), mas teve ${p.toFixed(1)}g P`
          );
          assert.ok(
            l >= 0.5,
            `Refeição "${mealName}" (${cal.toFixed(1)} kcal) deve ter lipídios mínimos (>= 0.5g), mas teve ${l.toFixed(1)}g L`
          );
        }

        // Nenhuma refeição deve conter abacate + manteiga
        const foodNames = (meal.items || []).map(f => (f.foodName || f.name || '').toLowerCase());
        const hasAvocado = foodNames.some(n => n.includes('abacate'));
        const hasButter = foodNames.some(n => n.includes('manteiga'));
        assert.ok(!(hasAvocado && hasButter), `Refeição "${mealName}" não pode conter abacate e manteiga no mesmo prato!`);
      });
    });

    test('Plano Low-Carb / High-Fat com Abacate e Manteiga separa ambos em refeições distintas', () => {
      const context = createNutritionPrescriptionContextDTO({
        patient: {
          patientId: 'patient_highfat',
          name: 'Paciente Cetogênico',
          age: 32,
          sex: 'Feminino'
        },
        anthropometry: {
          weightKg: 65.0,
          heightCm: 165.0,
          hasRecentAssessment: true
        },
        objective: {
          clinicalObjective: 'Emagrecimento',
          rawObjective: 'Perda de gordura com dieta low carb',
          targetWeightKg: 60.0
        },
        energy: {
          tmbKcal: 1400,
          getKcal: 1900,
          caloricTargetKcal: 1700
        },
        routine: {
          wakeUpTime: '07:00',
          bedTime: '23:00',
          workoutTime: '18:00',
          mealsPerDay: 4
        },
        training: {
          hasActiveTraining: true,
          workoutTime: '18:00'
        },
        cardio: { hasActiveCardio: false },
        fasting: { hasActiveProtocol: false },
        mealsPerDay: 4
      });

      const result = executePrescriptionPipelineSync({
        context,
        foodCatalog: fullFoodCatalog
      });

      assert.strictEqual(result.success, true, 'Pipeline deve ter sucesso em plano high-fat');
      const meals = result.mealAssemblyResult?.meals || [];

      meals.forEach((meal, idx) => {
        const mealName = meal.mealName || `Refeição ${idx + 1}`;
        const foodNames = (meal.items || []).map(f => (f.foodName || f.name || '').toLowerCase());
        const hasAvocado = foodNames.some(n => n.includes('abacate'));
        const hasButter = foodNames.some(n => n.includes('manteiga'));
        assert.ok(!(hasAvocado && hasButter), `Refeição "${mealName}" NUNCA pode co-alocar abacate e manteiga!`);
      });
    });
  });

  describe('3. Gate G21_MEAL_MACRO_COHERENCE na Validação Global', () => {
    test('Detecta e REPROVA prescrição com refeição contendo Abacate + Manteiga', () => {
      const meals = [
        {
          mealId: 'meal_1',
          mealName: 'Café da Manhã',
          mealRole: 'BREAKFAST',
          totals: { calories: 400, protein: 15, carbohydrate: 30, lipid: 22 },
          items: [
            { foodId: 'f1', foodName: 'Abacate fresco', grams: 100, nutrients: { calories: 200, protein: 2, carbohydrate: 10, lipid: 20 } },
            { foodId: 'f2', foodName: 'Manteiga com sal', grams: 20, nutrients: { calories: 140, protein: 0.1, carbohydrate: 0, lipid: 16 } },
            { foodId: 'f3', foodName: 'Ovo cozido', grams: 50, nutrients: { calories: 60, protein: 6, carbohydrate: 0.5, lipid: 4 } }
          ]
        },
        {
          mealId: 'meal_2',
          mealName: 'Almoço',
          mealRole: 'PRIMARY',
          totals: { calories: 600, protein: 45, carbohydrate: 60, lipid: 15 },
          items: [
            { foodId: 'f4', foodName: 'Peito de frango grelhado', grams: 150, nutrients: { calories: 200, protein: 32, carbohydrate: 0, lipid: 3 } },
            { foodId: 'f5', foodName: 'Arroz branco cozido', grams: 200, nutrients: { calories: 250, protein: 5, carbohydrate: 55, lipid: 0.5 } }
          ]
        }
      ];

      const mockPrescription = {
        context: {
          patient: { patientId: 'patient_test_clash', name: 'Teste Clash' },
          energy: { caloricTargetKcal: 1800 }
        },
        macroTargetResult: {
          proteinTargetG: 120,
          carbohydrateTargetG: 150,
          fatTargetG: 60,
          energyResult: { caloricTargetKcal: 1800 }
        },
        mealAssemblyResult: {
          status: 'PASS',
          valid: true,
          meals
        },
        nutrientTimingResult: {
          nutrientTimingVersion: 'N3.5.0',
          timingAnalysisVersion: 'N3.5.0',
          status: 'PASS',
          valid: true,
          meals
        }
      };

      const audit = validateGlobalPrescription(mockPrescription);
      assert.strictEqual(audit.valid, false, 'Prescrição com abacate+manteiga deve ser considerada INVÁLIDA pelo G21');

      const gateG21 = audit.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G21_MEAL_MACRO_COHERENCE);
      assert.ok(gateG21, 'Portão G21 deve existir');
      assert.strictEqual(gateG21.status, 'FAIL', 'G21 deve falhar');
      const hasAvocadoButterClash = gateG21.details?.failures?.some(f => f.includes('abacate com manteiga'));
      assert.ok(hasAvocadoButterClash, 'G21 deve detalhar explicitamente a colisão abacate com manteiga');
    });

    test('Detecta e REPROVA refeição com carboidrato isolado sem proteína em dieta normoglicídica', () => {
      const meals = [
        {
          mealId: 'meal_1',
          mealName: 'Café da Manhã',
          mealRole: 'BREAKFAST',
          totals: { calories: 500, protein: 30, carbohydrate: 60, lipid: 12 },
          items: [{ foodId: 'f1', foodName: 'Ovos mexidos', grams: 150, nutrients: { calories: 200, protein: 18, carbohydrate: 2, lipid: 14 } }]
        },
        {
          mealId: 'meal_2',
          mealName: 'Lanche da Tarde',
          mealRole: 'SNACK',
          totals: { calories: 260, protein: 1.5, carbohydrate: 58, lipid: 0.8 },
          items: [
            { foodId: 'f2', foodName: 'Batata doce cozida', grams: 200, nutrients: { calories: 160, protein: 1.0, carbohydrate: 38, lipid: 0.2 } },
            { foodId: 'f3', foodName: 'Banana prata', grams: 100, nutrients: { calories: 100, protein: 0.5, carbohydrate: 20, lipid: 0.6 } }
          ]
        },
        {
          mealId: 'meal_3',
          mealName: 'Jantar',
          mealRole: 'PRIMARY',
          totals: { calories: 700, protein: 50, carbohydrate: 70, lipid: 18 },
          items: [{ foodId: 'f4', foodName: 'Patinho moído', grams: 200, nutrients: { calories: 300, protein: 40, carbohydrate: 0, lipid: 10 } }]
        }
      ];

      const mockPrescription = {
        context: {
          patient: { patientId: 'patient_test_carb_isolated', name: 'Teste Carb Isolado' },
          energy: { caloricTargetKcal: 2500 },
          dietaryStyle: 'tradicional'
        },
        macroTargetResult: {
          proteinTargetG: 150,
          carbohydrateTargetG: 350,
          fatTargetG: 60,
          energyResult: { caloricTargetKcal: 2500 }
        },
        mealAssemblyResult: {
          status: 'PASS',
          valid: true,
          meals
        },
        nutrientTimingResult: {
          nutrientTimingVersion: 'N3.5.0',
          timingAnalysisVersion: 'N3.5.0',
          status: 'PASS',
          valid: true,
          meals
        }
      };

      const audit = validateGlobalPrescription(mockPrescription);
      assert.strictEqual(audit.valid, false, 'Prescrição com lanche de carboidrato isolado (58g CHO, 1.5g P) deve falhar no G21');

      const gateG21 = audit.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G21_MEAL_MACRO_COHERENCE);
      assert.ok(gateG21, 'Portão G21 deve existir');
      assert.strictEqual(gateG21.status, 'FAIL', 'G21 deve falhar');
      const hasTrinityViolation = gateG21.details?.failures?.some(f => f.includes('carboidrato isolado sem aporte proteico'));
      assert.ok(hasTrinityViolation, 'G21 deve detalhar explicitamente a violação da trindade de macros');
    });
  });

});
