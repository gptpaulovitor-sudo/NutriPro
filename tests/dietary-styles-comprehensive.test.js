/**
 * tests/dietary-styles-comprehensive.test.js
 * 
 * Validação rigorosa dos Estilos Dietéticos Clínicos no Pipeline Canônico:
 * 1. Cetogênica (Homem Atleta 116.1kg - convergência sem SEARCH_LIMIT_REACHED)
 * 2. Vegana (100% isenta de carnes, peixes, laticínios, ovos e whey)
 * 3. Vegetariana (Isenta de carnes e peixes; ovos e laticínios permitidos)
 * 4. Mediterrânea (Azeite de oliva, peixes, legumes e oleaginosas)
 * 5. Dukan Ataque (Protocolo PP puro - Portão G23 MEAL_FOOD_STRUCTURE aprovado sem bloqueio)
 * 6. Low Carb (Carboidratos moderados/controlados)
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

const { executePrescriptionPipelineSync } = require('../domain/orchestration/prescriptionOrchestrator');
const { createNutritionPrescriptionContextDTO } = require('../domain/contracts/NutritionPrescriptionContextDTO');
const { CANONICAL_DIET_FOODS } = require('../math');

// Catálogo enriquecido com os alimentos necessários para todos os estilos
let foodCatalog = [
  {
    id: 'canon_tofu_grelhado',
    foodId: 'canon_tofu_grelhado',
    name: 'Tofu Grelhado',
    foodName: 'Tofu Grelhado',
    category: 'Leguminosas e Derivados',
    calories: 120,
    protein: 15,
    carbohydrate: 2.5,
    lipid: 6.0,
    fiber: 1.5,
    sodium: 10,
    unit: 'g',
    bromatology: { energyStatus: 'CONSISTENTE', massStatus: 'OK' }
  },
  {
    id: 'canon_grao_de_bico',
    foodId: 'canon_grao_de_bico',
    name: 'Grão-de-Bico Cozido',
    foodName: 'Grão-de-Bico Cozido',
    category: 'Cereais e Leguminosas',
    calories: 164,
    protein: 8.9,
    carbohydrate: 27.4,
    lipid: 2.6,
    fiber: 7.6,
    sodium: 15,
    unit: 'g',
    bromatology: { energyStatus: 'CONSISTENTE', massStatus: 'OK' }
  },
  {
    id: 'canon_lentilha',
    foodId: 'canon_lentilha',
    name: 'Lentilha Cozida',
    foodName: 'Lentilha Cozida',
    category: 'Cereais e Leguminosas',
    calories: 116,
    protein: 9.0,
    carbohydrate: 20.1,
    lipid: 0.4,
    fiber: 7.9,
    sodium: 10,
    unit: 'g',
    bromatology: { energyStatus: 'CONSISTENTE', massStatus: 'OK' }
  },
  {
    id: 'canon_sardinha',
    foodId: 'canon_sardinha',
    name: 'Sardinha em Óleo Drenada',
    foodName: 'Sardinha em Óleo Drenada',
    category: 'Pescados',
    calories: 208,
    protein: 24.6,
    carbohydrate: 0.0,
    lipid: 11.5,
    fiber: 0.0,
    sodium: 400,
    unit: 'g',
    bromatology: { energyStatus: 'CONSISTENTE', massStatus: 'OK' }
  },
  {
    id: 'canon_salmao',
    foodId: 'canon_salmao',
    name: 'Salmão Grelhado',
    foodName: 'Salmão Grelhado',
    category: 'Pescados',
    calories: 220,
    protein: 25.0,
    carbohydrate: 0.0,
    lipid: 13.0,
    fiber: 0.0,
    sodium: 60,
    unit: 'g',
    bromatology: { energyStatus: 'CONSISTENTE', massStatus: 'OK' }
  }
];

if (CANONICAL_DIET_FOODS && typeof CANONICAL_DIET_FOODS === 'object') {
  const cfl = Object.entries(CANONICAL_DIET_FOODS).map(([k, f]) => ({
    id: `canon_${k}`,
    foodId: `canon_${k}`,
    name: f.name,
    foodName: f.name,
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
    category: f.category || 'Geral',
    bromatology: { energyStatus: 'CONSISTENTE', massStatus: 'OK' }
  }));
  foodCatalog = cfl.concat(foodCatalog);
}

function buildPatientContext(weightKg = 75, objective = 'Hipertrofia') {
  return createNutritionPrescriptionContextDTO({
    patient: {
      patientId: 'patient_test_clinic',
      name: 'Paciente Teste Clínico',
      gender: 'Masculino',
      age: 35,
      patientType: 'Atleta'
    },
    anthropometry: {
      weightKg: weightKg,
      heightCm: 180.0,
      bodyFatPercent: 16.0,
      leanMassKg: weightKg * 0.84,
      hasRecentAssessment: true
    },
    objective: {
      clinicalObjective: objective,
      rawObjective: objective
    },
    energy: {
      activityFactor: 1.55,
      tmbMethod: 'KATCH_MCARDLE'
    },
    constraints: {
      dietaryRestrictions: [],
      allergies: [],
      intolerances: [],
      forbiddenFoods: []
    }
  });
}

describe('Suíte de Testes Abrangente de Estilos Dietéticos', () => {

  test('1. Cetogênica de alta demanda metabólica (116.1kg) converge sem SEARCH_LIMIT_REACHED', () => {
    const athleteContext = buildPatientContext(116.1, 'Hipertrofia');

    const result = executePrescriptionPipelineSync({
      context: athleteContext,
      foodCatalog,
      options: {
        mealCount: 4,
        dietaryStyle: 'cetogenica',
        dietaryCycle: 'keto_skd'
      }
    });

    assert.strictEqual(result.success, true, `Pipeline Cetogênica deve ter sucesso. Erros: ${JSON.stringify(result.blockingReasons)}`);
    assert.ok(result.status === 'PASS' || result.status === 'WARNING', `Status deve ser PASS ou WARNING, obtido: ${result.status}`);
    assert.ok(result.foodSolverResult.valid, 'Food solver deve gerar solução válida');
    assert.notStrictEqual(result.foodSolverResult.status, 'SEARCH_LIMIT_REACHED', 'Solver NÃO pode estourar limite computacional');

    // Carboidratos controlados
    const totals = result.mealAssemblyResult.globalTotals;
    assert.ok(totals.carbohydrate <= 55, `Cetogênica deve ter carboidratos estritos (obtido: ${totals.carbohydrate}g)`);

    // Não deve conter carboidratos tradicionais
    const allNames = result.mealAssemblyResult.meals.flatMap(m => m.items.map(i => i.foodName.toLowerCase()));
    assert.ok(!allNames.some(n => n.includes('arroz')), 'Não pode conter arroz');
    assert.ok(!allNames.some(n => n.includes('feijão')), 'Não pode conter feijão');
  });

  test('2. Dieta Vegana é 100% vegetal e não repete alimentos tradicionais de origem animal', () => {
    const veganContext = buildPatientContext(72, 'Emagrecimento');

    const result = executePrescriptionPipelineSync({
      context: veganContext,
      foodCatalog,
      options: {
        mealCount: 4,
        dietaryStyle: 'vegana'
      }
    });

    assert.strictEqual(result.success, true, `Pipeline Vegana deve ter sucesso. Erros: ${JSON.stringify(result.blockingReasons)}`);
    const allNames = result.mealAssemblyResult.meals.flatMap(m => m.items.map(i => i.foodName.toLowerCase()));
    console.log('Vegana food names:', allNames);

    // Nenhuma proteína animal
    const animalKeywords = ['frango', 'patinho', 'peixe', 'tilápia', 'sardinha', 'salmão', 'ovo', 'queijo', 'leite', 'iogurte', 'whey'];
    for (const kw of animalKeywords) {
      const found = allNames.filter(n => n.includes(kw));
      assert.strictEqual(found.length, 0, `Dieta vegana não pode conter ${kw}, mas encontrou: ${found.join(', ')}`);
    }

    // Deve conter leguminosas ou tofu
    const hasPlantAnchor = allNames.some(n => n.includes('tofu') || n.includes('grão-de-bico') || n.includes('grao') || n.includes('lentilha') || n.includes('feijão') || n.includes('feijao'));
    assert.ok(hasPlantAnchor, `Dieta vegana deve conter proteína de base vegetal, obteve: ${allNames.join(', ')}`);
  });

  test('3. Dieta Vegetariana exclui carnes e peixes, mas permite ovos e laticínios', () => {
    const vegContext = buildPatientContext(75, 'Hipertrofia');

    const result = executePrescriptionPipelineSync({
      context: vegContext,
      foodCatalog,
      options: {
        mealCount: 4,
        dietaryStyle: 'vegetariana'
      }
    });

    assert.strictEqual(result.success, true, `Pipeline Vegetariana deve ter sucesso. Erros: ${JSON.stringify(result.blockingReasons)}`);
    const allNames = result.mealAssemblyResult.meals.flatMap(m => m.items.map(i => i.foodName.toLowerCase()));

    // Nenhuma carne ou peixe
    const meatKeywords = ['frango', 'patinho', 'carne', 'peixe', 'tilápia', 'sardinha', 'salmão'];
    for (const kw of meatKeywords) {
      const found = allNames.filter(n => n.includes(kw));
      assert.strictEqual(found.length, 0, `Dieta vegetariana não pode conter carnes: ${found.join(', ')}`);
    }

    // Deve conter ovos, queijo ou leguminosas
    const hasVegFood = allNames.some(n => n.includes('ovo') || n.includes('queijo') || n.includes('feijão') || n.includes('tofu'));
    assert.ok(hasVegFood, 'Dieta vegetariana deve conter alimentos ovolactovegetarianos');
  });

  test('4. Dieta do Mediterrâneo prioriza peixes, azeite de oliva e leguminosas', () => {
    const medContext = buildPatientContext(78, 'Manutenção');

    const result = executePrescriptionPipelineSync({
      context: medContext,
      foodCatalog,
      options: {
        mealCount: 4,
        dietaryStyle: 'mediterranea'
      }
    });

    assert.strictEqual(result.success, true, `Pipeline Mediterrânea deve ter sucesso. Erros: ${JSON.stringify(result.blockingReasons)}`);
    const allNames = result.mealAssemblyResult.meals.flatMap(m => m.items.map(i => i.foodName.toLowerCase()));

    // Deve conter azeite de oliva
    assert.ok(allNames.some(n => n.includes('azeite')), 'Dieta mediterrânea deve conter azeite de oliva');

    // Deve priorizar pescados ou leguminosas
    const hasMedFeature = allNames.some(n => n.includes('sardinha') || n.includes('tilápia') || n.includes('salmão') || n.includes('peixe') || n.includes('grão-de-bico') || n.includes('lentilha'));
    assert.ok(hasMedFeature, 'Dieta mediterrânea deve incluir peixe ou leguminosas');
  });

  test('5. Dieta Dukan Ataque (PP) não é bloqueada pelo Portão G23 (MEAL_FOOD_STRUCTURE)', () => {
    const dukanContext = buildPatientContext(85, 'Emagrecimento');

    const result = executePrescriptionPipelineSync({
      context: dukanContext,
      foodCatalog,
      options: {
        mealCount: 4,
        dietaryStyle: 'dukan',
        dietaryCycle: 'dukan_ataque'
      }
    });

    assert.strictEqual(result.success, true, `Pipeline Dukan deve ter sucesso. Bloqueios: ${JSON.stringify(result.blockingReasons)}`);
    const g23 = result.globalValidationResult.gateResults.find(g => g.gateId === 'G23_MEAL_FOOD_STRUCTURE');
    assert.ok(g23, 'Portão G23 deve ser avaliado');
    assert.strictEqual(g23.status, 'PASS', `Portão G23 deve aprovar refeições puras de proteína no Dukan: ${JSON.stringify(g23.details)}`);
  });

  test('6. Dieta Low Carb restrita/moderada é gerada com coerência', () => {
    const lcContext = buildPatientContext(80, 'Emagrecimento');

    const result = executePrescriptionPipelineSync({
      context: lcContext,
      foodCatalog,
      options: {
        mealCount: 4,
        dietaryStyle: 'lowcarb',
        dietaryCycle: 'lowcarb_moderada'
      }
    });

    assert.strictEqual(result.success, true, `Pipeline Low Carb deve ter sucesso. Erros: ${JSON.stringify(result.blockingReasons)}`);
    assert.ok(result.mealAssemblyResult.globalTotals.carbohydrate <= 130, 'Carboidratos devem ser <= 130g');
  });

});
