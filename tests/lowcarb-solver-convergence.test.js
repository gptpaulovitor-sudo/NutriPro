/**
 * tests/lowcarb-solver-convergence.test.js
 * 
 * Testes de convergência determinística e validação global para dietas Low Carb e Cetogênica.
 * Garante que:
 * 1. O tier construtivo convirja imediatamente sem atingir SEARCH_LIMIT_REACHED.
 * 2. O Gate 21 (G21_MEAL_MACRO_COHERENCE) aprove a distribuição coerente de carboidratos.
 * 3. O pipeline canônico retorne success === true para pacientes de alta demanda calórica.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createNutritionPrescriptionContextDTO } = require('../domain/contracts/NutritionPrescriptionContextDTO');
const { executePrescriptionPipelineSync } = require('../domain/orchestration/prescriptionOrchestrator');
const { COMPREHENSIVE_TACO_TBCA_FOODS, CANONICAL_DIET_FOODS } = require('../foodsData');

let foodCatalog = COMPREHENSIVE_TACO_TBCA_FOODS || [];
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
  foodCatalog = cfl.concat(foodCatalog);
}

// Paciente de alta demanda metabólica e muscular (Paulo Vitor, 116.1 kg)
const athleteContext = createNutritionPrescriptionContextDTO({
  patient: {
    patientId: 'patient_pv_athlete',
    name: 'Paulo Vitor R de Sousa',
    gender: 'Masculino',
    age: 38,
    patientType: 'Atleta'
  },
  anthropometry: {
    weightKg: 116.1,
    heightCm: 188.0,
    bodyFatPercent: 18.0,
    leanMassKg: 95.2,
    hasRecentAssessment: true
  },
  objective: {
    clinicalObjective: 'Hipertrofia',
    rawObjective: 'Ganho de massa muscular com controle glicêmico'
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

test('Low Carb Moderada: Converge no tier construtivo e passa em todos os portões (4 e 5 refeições)', () => {
  for (const mealCount of [4, 5]) {
    const result = executePrescriptionPipelineSync({
      context: athleteContext,
      foodCatalog,
      options: {
        mealCount,
        dietaryStyle: 'lowcarb',
        dietaryCycle: 'lowcarb_moderada'
      }
    });

    assert.strictEqual(result.success, true, `Pipeline deve ter sucesso para ${mealCount} refeições`);
    assert.ok(result.status === 'PASS' || result.status === 'WARNING', `Status deve ser PASS ou WARNING, obtido: ${result.status}`);
    assert.ok(result.foodSolverResult.valid, 'Food Solver deve ser válido');
    assert.notStrictEqual(result.foodSolverResult.status, 'SEARCH_LIMIT_REACHED', 'Solver NÃO pode atingir SEARCH_LIMIT_REACHED');

    // Validação do Gate 21
    const g21 = result.globalValidationResult.gateResults.find(g => g.gateId === 'G21_MEAL_MACRO_COHERENCE');
    assert.ok(g21, 'Gate G21 deve ser avaliado');
    assert.notStrictEqual(g21.status, 'FAIL', `G21 não pode falhar: ${JSON.stringify(g21.details)}`);
  }
});

test('Low Carb Restrita: Converge rapidamente com restrição estrita de carboidratos', () => {
  const result = executePrescriptionPipelineSync({
    context: athleteContext,
    foodCatalog,
    options: {
      mealCount: 4,
      dietaryStyle: 'lowcarb',
      dietaryCycle: 'lowcarb_restrita'
    }
  });

  assert.strictEqual(result.success, true);
  assert.ok(result.status === 'PASS' || result.status === 'WARNING');
  assert.ok(result.foodSolverResult.valid);
  assert.notStrictEqual(result.foodSolverResult.status, 'SEARCH_LIMIT_REACHED');
});

test('Cetogênica: Converge sem estourar limite computacional (3, 4 e 5 refeições)', () => {
  for (const mealCount of [3, 4, 5]) {
    const result = executePrescriptionPipelineSync({
      context: athleteContext,
      foodCatalog,
      options: {
        mealCount,
        dietaryStyle: 'cetogenica',
        dietaryCycle: 'keto_padrao'
      }
    });

    assert.strictEqual(result.success, true, `Cetogênica deve convergir com sucesso para ${mealCount} refeições`);
    assert.ok(result.foodSolverResult.valid);
    assert.notStrictEqual(result.foodSolverResult.status, 'SEARCH_LIMIT_REACHED');
  }
});
