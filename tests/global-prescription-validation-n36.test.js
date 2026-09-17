/**
 * tests/global-prescription-validation-n36.test.js
 * 
 * Suíte de Testes Automatizados da Fase N3.6 — Validação Global da Prescrição Nutricional.
 * NutriAx Pro.
 * 
 * Cobertura Completa dos 20 Portões Globais (G1 a G20), Conservação Downstream,
 * Rastreabilidade, Determinismo, Imutabilidade e Pureza Estática.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GlobalPrescriptionValidationContract = require('../domain/contracts/GlobalPrescriptionValidationContract');
const {
  GLOBAL_VALIDATION_STATUS,
  GLOBAL_GATE_ID,
  GATE_SEVERITY,
  validateGlobalPrescriptionValidationInput,
  validateGlobalPrescriptionValidationOutput
} = GlobalPrescriptionValidationContract;

const validationSubsystem = require('../domain/validation/index');
const {
  DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY,
  createGlobalPrescriptionValidationPolicy,
  validateGlobalPrescription
} = validationSubsystem;

// ─────────────────────────────────────────────────────────────────────────────
// FIXTURES CANÔNICAS DO PIPELINE DETERMINÍSTICO (N2.1 A N3.5)
// ─────────────────────────────────────────────────────────────────────────────

function createMockContext(overrides = {}) {
  return {
    schemaVersion: '1.0.0',
    patient: {
      patientId: 'patient_p1',
      name: 'Carlos Oliveira',
      age: 32,
      sex: 'Masculino'
    },
    objective: {
      clinicalObjective: overrides.clinicalObjective || 'Hipertrofia',
      targetWeightKg: 80.0,
      source: 'CLINICIAN_DEFINED'
    },
    anthropometry: {
      weightKg: 76.0,
      heightCm: 178.0,
      hasRecentAssessment: true
    },
    energy: {
      tmbKcal: 1750,
      getKcal: 2500,
      caloricTargetKcal: 2700,
      energyBalanceKcal: 200
    },
    constraints: {
      dietaryRestrictions: [],
      allergies: [],
      intolerances: [],
      aversions: []
    },
    routine: overrides.routine || {
      wakeUpTime: '07:00',
      bedTime: '23:00',
      workoutTime: '17:00'
    },
    training: overrides.training || {
      hasActiveTraining: true,
      activeSplit: 'PPL',
      workoutTime: '17:00',
      sessionDurationMinutes: 60
    },
    cardio: overrides.cardio || {
      hasActiveCardio: false,
      weeklyFrequency: 0,
      sessions: []
    },
    fasting: overrides.fasting || {
      hasActiveProtocol: false,
      status: 'INACTIVE',
      feedingWindows: null,
      fastingWindows: null
    }
  };
}

function createMockEnergyTargetResult(overrides = {}) {
  return {
    status: overrides.status || 'PASS',
    valid: overrides.valid !== undefined ? overrides.valid : true,
    caloricTargetKcal: 2700,
    tmbKcal: 1750,
    getKcal: 2500,
    energyBalanceKcal: 200,
    warnings: overrides.warnings || [],
    blockingReasons: overrides.blockingReasons || [],
    provenance: {
      engine: 'NutriAxDeterministicEnergyTarget',
      policyVersion: 'N2.1.0',
      rule: 'SURPLUS_HYPERTROPHY_MODERATE'
    }
  };
}

function createMockMacroTargetResult(overrides = {}) {
  return {
    status: overrides.status || 'PASS',
    valid: overrides.valid !== undefined ? overrides.valid : true,
    proteinTargetG: 160,
    carbohydrateTargetG: 340,
    fatTargetG: 70,
    fiberTargetG: 35,
    closedKcal: 2630, // 4*160 + 4*340 + 9*70 = 640 + 1360 + 630 = 2630
    warnings: overrides.warnings || [],
    blockingReasons: overrides.blockingReasons || [],
    provenance: {
      engine: 'NutriAxDeterministicMacroTargets',
      policyVersion: 'N2.2.0'
    }
  };
}

function createMockNutritionValidatorResult(overrides = {}) {
  return {
    validationVersion: 'N2.3.0',
    status: overrides.status || 'PASS',
    valid: overrides.valid !== undefined ? overrides.valid : true,
    checks: [],
    warnings: overrides.warnings || [],
    blockingReasons: overrides.blockingReasons || []
  };
}

function createCanonicalFoodItems() {
  return [
    {
      foodId: 'FOOD_EGG',
      foodName: 'Ovo Cozido',
      grams: 100,
      unit: 'g',
      nutrients: { calories: 155.4, protein: 13.0, carbohydrate: 1.1, lipid: 11.0, fiber: 0, sodium: 124 }
    },
    {
      foodId: 'FOOD_BREAD',
      foodName: 'Pão Integral',
      grams: 100,
      unit: 'g',
      nutrients: { calories: 249.6, protein: 9.0, carbohydrate: 48.0, lipid: 2.4, fiber: 7.0, sodium: 300 }
    },
    {
      foodId: 'FOOD_RICE',
      foodName: 'Arroz Branco',
      grams: 300,
      unit: 'g',
      nutrients: { calories: 371.4, protein: 7.5, carbohydrate: 84.0, lipid: 0.6, fiber: 4.5, sodium: 10 }
    },
    {
      foodId: 'FOOD_CHICKEN',
      foodName: 'Peito de Frango',
      grams: 250,
      unit: 'g',
      nutrients: { calories: 376.25, protein: 80.0, carbohydrate: 0.0, lipid: 6.25, fiber: 0, sodium: 175 }
    },
    {
      foodId: 'FOOD_BANANA',
      foodName: 'Banana Prata',
      grams: 150,
      unit: 'g',
      nutrients: { calories: 165.15, protein: 1.95, carbohydrate: 39.0, lipid: 0.15, fiber: 3.0, sodium: 1.5 }
    },
    {
      foodId: 'FOOD_OATS',
      foodName: 'Aveia em Flocos',
      grams: 60,
      unit: 'g',
      nutrients: { calories: 234.0, protein: 8.6, carbohydrate: 40.0, lipid: 4.4, fiber: 6.0, sodium: 4 }
    },
    {
      foodId: 'FOOD_POTATO',
      foodName: 'Batata Doce',
      grams: 250,
      unit: 'g',
      nutrients: { calories: 192.25, protein: 1.5, carbohydrate: 46.0, lipid: 0.25, fiber: 5.5, sodium: 25 }
    },
    {
      foodId: 'FOOD_BEEF',
      foodName: 'Patinho Moído',
      grams: 100,
      unit: 'g',
      nutrients: { calories: 211.1, protein: 35.9, carbohydrate: 0.0, lipid: 7.5, fiber: 0, sodium: 60 }
    },
    {
      foodId: 'FOOD_YOGURT',
      foodName: 'Iogurte Natural',
      grams: 170,
      unit: 'g',
      nutrients: { calories: 86.1, protein: 6.8, carbohydrate: 9.1, lipid: 2.5, fiber: 0, sodium: 80 }
    }
  ];
}

function createMockFoodSolverResult(overrides = {}) {
  const items = overrides.items || createCanonicalFoodItems();
  const totalCalories = items.reduce((s, it) => s + it.nutrients.calories, 0);
  const totalProtein = items.reduce((s, it) => s + it.nutrients.protein, 0);
  const totalCarb = items.reduce((s, it) => s + it.nutrients.carbohydrate, 0);
  const totalLipid = items.reduce((s, it) => s + it.nutrients.lipid, 0);
  const totalFiber = items.reduce((s, it) => s + it.nutrients.fiber, 0);
  const totalSodium = items.reduce((s, it) => s + (it.nutrients.sodium || 0), 0);

  return {
    solverVersion: 'N3.2.0',
    status: overrides.status || 'PASS',
    valid: overrides.valid !== undefined ? overrides.valid : true,
    items,
    totals: {
      calories: totalCalories,
      protein: totalProtein,
      carbohydrate: totalCarb,
      fat: totalLipid,
      fiber: totalFiber,
      sodium: totalSodium
    },
    cost: 0.045,
    warnings: overrides.warnings || [],
    blockingReasons: overrides.blockingReasons || [],
    provenance: { engine: 'NutriAxDeterministicFoodSolver', policyVersion: '1.0.0' }
  };
}

function cloneItems(items) {
  return JSON.parse(JSON.stringify(items));
}

function createCanonicalMeals(rawItems) {
  const items = cloneItems(rawItems);
  // Distribuição exata dos alimentos do solver em 4 refeições
  return [
    {
      mealId: 'meal_1',
      mealIndex: 0,
      mealName: 'Café da Manhã',
      mealRole: 'PRIMARY',
      scheduledTime: '08:00',
      scheduledMinutes: 480,
      primaryRelation: 'NEUTRAL',
      secondaryRelations: [],
      items: [items[0], items[1]], // Ovo + Pão
      totals: {
        calories: items[0].nutrients.calories + items[1].nutrients.calories,
        protein: items[0].nutrients.protein + items[1].nutrients.protein,
        carbohydrate: items[0].nutrients.carbohydrate + items[1].nutrients.carbohydrate,
        fat: items[0].nutrients.lipid + items[1].nutrients.lipid,
        fiber: items[0].nutrients.fiber + items[1].nutrients.fiber,
        sodium: items[0].nutrients.sodium + items[1].nutrients.sodium
      }
    },
    {
      mealId: 'meal_2',
      mealIndex: 1,
      mealName: 'Almoço',
      mealRole: 'PRIMARY',
      scheduledTime: '12:30',
      scheduledMinutes: 750,
      primaryRelation: 'NEUTRAL',
      secondaryRelations: [],
      items: [items[2], items[3]], // Arroz + Frango
      totals: {
        calories: items[2].nutrients.calories + items[3].nutrients.calories,
        protein: items[2].nutrients.protein + items[3].nutrients.protein,
        carbohydrate: items[2].nutrients.carbohydrate + items[3].nutrients.carbohydrate,
        fat: items[2].nutrients.lipid + items[3].nutrients.lipid,
        fiber: items[2].nutrients.fiber + items[3].nutrients.fiber,
        sodium: items[2].nutrients.sodium + items[3].nutrients.sodium
      }
    },
    {
      mealId: 'meal_3',
      mealIndex: 2,
      mealName: 'Lanche Pré-Treino',
      mealRole: 'SECONDARY',
      scheduledTime: '15:30',
      scheduledMinutes: 930,
      primaryRelation: 'PRE_TRAINING',
      secondaryRelations: [],
      items: [items[4], items[5]], // Banana + Aveia
      totals: {
        calories: items[4].nutrients.calories + items[5].nutrients.calories,
        protein: items[4].nutrients.protein + items[5].nutrients.protein,
        carbohydrate: items[4].nutrients.carbohydrate + items[5].nutrients.carbohydrate,
        fat: items[4].nutrients.lipid + items[5].nutrients.lipid,
        fiber: items[4].nutrients.fiber + items[5].nutrients.fiber,
        sodium: items[4].nutrients.sodium + items[5].nutrients.sodium
      }
    },
    {
      mealId: 'meal_4',
      mealIndex: 3,
      mealName: 'Jantar Pós-Treino',
      mealRole: 'PRIMARY',
      scheduledTime: '19:00',
      scheduledMinutes: 1140,
      primaryRelation: 'POST_TRAINING',
      secondaryRelations: [],
      items: [items[6], items[7], items[8]], // Batata + Patinho + Iogurte
      totals: {
        calories: items[6].nutrients.calories + items[7].nutrients.calories + items[8].nutrients.calories,
        protein: items[6].nutrients.protein + items[7].nutrients.protein + items[8].nutrients.protein,
        carbohydrate: items[6].nutrients.carbohydrate + items[7].nutrients.carbohydrate + items[8].nutrients.carbohydrate,
        fat: items[6].nutrients.lipid + items[7].nutrients.lipid + items[8].nutrients.lipid,
        fiber: items[6].nutrients.fiber + items[7].nutrients.fiber + items[8].nutrients.fiber,
        sodium: items[6].nutrients.sodium + items[7].nutrients.sodium + items[8].nutrients.sodium
      }
    }
  ];
}

function createMockMealAssemblyResult(overrides = {}, items = createCanonicalFoodItems()) {
  const meals = overrides.meals || createCanonicalMeals(items);
  return {
    assemblyVersion: 'N3.3.0',
    status: overrides.status || 'PASS',
    valid: overrides.valid !== undefined ? overrides.valid : true,
    meals,
    warnings: overrides.warnings || [],
    blockingReasons: overrides.blockingReasons || [],
    provenance: { engine: 'NutriAxDeterministicMealAssembly', policyVersion: '1.0.0' }
  };
}

function createMockMealTimingResult(overrides = {}, items = createCanonicalFoodItems()) {
  const meals = overrides.meals || createCanonicalMeals(items);
  return {
    timingVersion: 'N3.4.0',
    status: overrides.status || 'PASS',
    valid: overrides.valid !== undefined ? overrides.valid : true,
    meals,
    eatingWindow: overrides.eatingWindow || {
      start: '08:00',
      startMinutes: 480,
      end: '22:00',
      endMinutes: 1320,
      strength: 'PREFERRED'
    },
    temporalEvents: overrides.temporalEvents || [
      { eventType: 'TRAINING', start: '17:00', end: '18:00', startMinutes: 1020, endMinutes: 1080, durationMinutes: 60 }
    ],
    warnings: overrides.warnings || [],
    blockingReasons: overrides.blockingReasons || [],
    provenance: { engine: 'NutriAxDeterministicMealTiming', policyVersion: '1.0.0' }
  };
}

function createMockNutrientTimingResult(overrides = {}, items = createCanonicalFoodItems()) {
  const meals = overrides.meals || createCanonicalMeals(items);
  return {
    timingAnalysisVersion: 'N3.5.0',
    status: overrides.status || 'PASS',
    valid: overrides.valid !== undefined ? overrides.valid : true,
    meals,
    diagnostics: overrides.diagnostics || [],
    warnings: overrides.warnings || [],
    blockingReasons: overrides.blockingReasons || [],
    provenance: { engine: 'NutriAxNutrientTimingAnalysis', analysisVersion: 'N3.5.0' }
  };
}

function createValidPipelineInput(overrides = {}) {
  const context = overrides.context || createMockContext();
  const foodItems = overrides.foodItems || createCanonicalFoodItems();

  return {
    context,
    energyTargetResult: overrides.energyTargetResult || createMockEnergyTargetResult(),
    macroTargetResult: overrides.macroTargetResult || createMockMacroTargetResult(),
    nutritionValidatorResult: overrides.nutritionValidatorResult || createMockNutritionValidatorResult(),
    foodSolverResult: overrides.foodSolverResult || createMockFoodSolverResult({ items: cloneItems(foodItems) }),
    mealAssemblyResult: overrides.mealAssemblyResult || createMockMealAssemblyResult({}, cloneItems(foodItems)),
    mealTimingResult: overrides.mealTimingResult || createMockMealTimingResult({}, cloneItems(foodItems)),
    nutrientTimingResult: overrides.nutrientTimingResult || createMockNutrientTimingResult({}, cloneItems(foodItems)),
    options: overrides.options || {}
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 1: CONTRATO E PORTÃO DE ENTRADA (TESTES 1 A 6)
// ─────────────────────────────────────────────────────────────────────────────

test('1.1 Rejeita input nulo ou não-objeto com status BLOCKED', () => {
  const res1 = validateGlobalPrescription(null);
  assert.strictEqual(res1.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  assert.strictEqual(res1.valid, false);

  const res2 = validateGlobalPrescription('invalido');
  assert.strictEqual(res2.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  assert.strictEqual(res2.valid, false);
});

test('1.2 Rejeita input sem context canônico', () => {
  const input = createValidPipelineInput();
  delete input.context;

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  assert.strictEqual(res.valid, false);
  assert.ok(res.blockingReasons.some(r => r.includes('context')));
});

test('1.3 Rejeita input com contexto de antropometria inválida (G1 Fail)', () => {
  const input = createValidPipelineInput({
    context: createMockContext({
      anthropometry: { weightKg: -10, heightCm: 0 }
    })
  });
  input.context.anthropometry.weightKg = -10;

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  assert.strictEqual(res.valid, false);
  const g1 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G1_CONTEXT);
  assert.strictEqual(g1.status, 'FAIL');
});

test('1.4 Valida DTO de entrada via validateGlobalPrescriptionValidationInput', () => {
  const valid = validateGlobalPrescriptionValidationInput(createValidPipelineInput());
  assert.strictEqual(valid.isValid, true);
  assert.strictEqual(valid.isBlocked, false);

  const invalid = validateGlobalPrescriptionValidationInput({});
  assert.strictEqual(invalid.isValid, false);
  assert.strictEqual(invalid.isBlocked, true);
});

test('1.5 Valida DTO de saída via validateGlobalPrescriptionValidationOutput', () => {
  const result = validateGlobalPrescription(createValidPipelineInput());
  const check = validateGlobalPrescriptionValidationOutput(result);
  assert.strictEqual(check.isValid, true);
  assert.strictEqual(check.errors.length, 0);
});

test('1.6 Preserva todos os portões invariantes (G1 a G23) avaliados na saída', () => {
  const result = validateGlobalPrescription(createValidPipelineInput());
  assert.strictEqual(result.gateResults.length, Object.values(GLOBAL_GATE_ID).length);
  const gateIds = result.gateResults.map(g => g.gateId);
  Object.values(GLOBAL_GATE_ID).forEach(expectedId => {
    assert.ok(gateIds.includes(expectedId), `Portão ${expectedId} deve estar presente`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 2: BLOQUEIO IMEDIATO POR FASES ANTERIORES (TESTES 7 A 14)
// ─────────────────────────────────────────────────────────────────────────────

test('2.1 Bloqueia quando N2.1 (Energy Target) possui status BLOCKED', () => {
  const input = createValidPipelineInput({
    energyTargetResult: createMockEnergyTargetResult({ status: 'BLOCKED' })
  });
  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G2_ENERGY_TARGET).status, 'FAIL');
});

test('2.2 Bloqueia quando N2.1 possui valores calóricos não numéricos ou nulos', () => {
  const input = createValidPipelineInput({
    energyTargetResult: { status: 'PASS', caloricTargetKcal: NaN, tmbKcal: 1700, getKcal: 2500 }
  });
  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  assert.strictEqual(res.valid, false);
});

test('2.3 Bloqueia quando N2.2 (Macro Targets) possui status BLOCKED', () => {
  const input = createValidPipelineInput({
    macroTargetResult: createMockMacroTargetResult({ status: 'BLOCKED' })
  });
  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G3_MACRO_TARGET).status, 'FAIL');
});

test('2.4 Bloqueia quando N2.3 (Nutrition Target Validator) possui valid === false', () => {
  const input = createValidPipelineInput({
    nutritionValidatorResult: createMockNutritionValidatorResult({ valid: false, status: 'BLOCKED' })
  });
  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G4_NUTRITION_VALIDATOR).status, 'FAIL');
});

test('2.5 Bloqueia quando N3.2 (Food Solver) possui status NO_SOLUTION ou BLOCKED', () => {
  const input = createValidPipelineInput({
    foodSolverResult: createMockFoodSolverResult({ status: 'NO_SOLUTION', valid: false })
  });
  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G5_FOOD_SOLVER).status, 'FAIL');
});

test('2.6 Bloqueia quando N3.3 (Meal Assembly) possui status BLOCKED', () => {
  const input = createValidPipelineInput({
    mealAssemblyResult: createMockMealAssemblyResult({ status: 'BLOCKED', valid: false })
  });
  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G6_MEAL_ASSEMBLY).status, 'FAIL');
});

test('2.7 Bloqueia quando N3.4 (Meal Timing) possui status BLOCKED', () => {
  const input = createValidPipelineInput({
    mealTimingResult: createMockMealTimingResult({ status: 'BLOCKED', valid: false })
  });
  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G7_MEAL_TIMING).status, 'FAIL');
});

test('2.8 Bloqueia quando N3.5 (Nutrient Timing) possui status BLOCKED', () => {
  const input = createValidPipelineInput({
    nutrientTimingResult: createMockNutrientTimingResult({ status: 'BLOCKED', valid: false })
  });
  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G8_NUTRIENT_TIMING).status, 'FAIL');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 3: IDENTIDADE CANÔNICA DE ALIMENTOS (TESTES 15 A 18)
// ─────────────────────────────────────────────────────────────────────────────

test('3.1 Aprova quando todos os alimentos do solver estão presentes nas refeições', () => {
  const input = createValidPipelineInput();
  const res = validateGlobalPrescription(input);
  const g9 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G9_FOOD_IDENTITY);
  assert.strictEqual(g9.status, 'PASS');
});

test('3.2 Bloqueia quando um alimento é perdido entre N3.2 e N3.5', () => {
  const input = createValidPipelineInput();
  // Remover o último alimento da última refeição em N3.5
  input.nutrientTimingResult.meals[3].items = input.nutrientTimingResult.meals[3].items.slice(0, 2);

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g9 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G9_FOOD_IDENTITY);
  assert.strictEqual(g9.status, 'FAIL');
  assert.ok(g9.details.missingInFinal.includes('FOOD_YOGURT'));
});

test('3.3 Bloqueia quando um alimento é inventado na N3.5 que não existia no solver', () => {
  const input = createValidPipelineInput();
  input.nutrientTimingResult.meals[0].items.push({
    foodId: 'FOOD_INVENTED',
    foodName: 'Alimento Mágico',
    grams: 50,
    nutrients: { calories: 50, protein: 2, carbohydrate: 5, lipid: 1, fiber: 0, sodium: 10 }
  });

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g9 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G9_FOOD_IDENTITY);
  assert.strictEqual(g9.status, 'FAIL');
  assert.ok(g9.details.inventedInFinal.includes('FOOD_INVENTED'));
});

test('3.4 Bloqueia quando um alimento é substituído por outro de foodId diferente', () => {
  const input = createValidPipelineInput();
  input.nutrientTimingResult.meals[0].items[0] = {
    foodId: 'FOOD_REPLACED',
    foodName: 'Ovo Trocado',
    grams: 100,
    nutrients: { calories: 155, protein: 13, carbohydrate: 1.1, lipid: 11, fiber: 0, sodium: 124 }
  };

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g9 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G9_FOOD_IDENTITY);
  assert.strictEqual(g9.status, 'FAIL');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 4: CONSERVAÇÃO DE MASSA (TESTES 19 A 22)
// ─────────────────────────────────────────────────────────────────────────────

test('4.1 Aprova conservação exata de massa downstream (delta = 0.00g)', () => {
  const input = createValidPipelineInput();
  const res = validateGlobalPrescription(input);
  const g10 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G10_MASS_CONSERVATION);
  assert.strictEqual(g10.status, 'PASS');
  assert.strictEqual(res.conservationAudit.deltaMassFinalVsSolverGrams, 0);
});

test('4.2 Bloqueia quando gramagem de um alimento é alterada além de 0.01g', () => {
  const input = createValidPipelineInput();
  input.nutrientTimingResult.meals[0].items[0].grams += 0.5; // +0.5g

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g10 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G10_MASS_CONSERVATION);
  assert.strictEqual(g10.status, 'FAIL');
});

test('4.3 Aprova quando a variação decimal de ponto flutuante está dentro de 0.01g', () => {
  const input = createValidPipelineInput();
  input.nutrientTimingResult.meals[0].items[0].grams += 0.005; // +0.005g <= 0.01g

  const res = validateGlobalPrescription(input);
  const g10 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G10_MASS_CONSERVATION);
  assert.strictEqual(g10.status, 'PASS');
});

test('4.4 Bloqueia quando massa total diverge mesmo que itens individuais compensem', () => {
  const input = createValidPipelineInput();
  input.nutrientTimingResult.meals[0].items[0].grams += 5; // +5g
  input.nutrientTimingResult.meals[0].items[1].grams -= 5; // -5g
  // A soma daria igual, mas a divergência por item excede 0.01g!
  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g10 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G10_MASS_CONSERVATION);
  assert.strictEqual(g10.status, 'FAIL');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 5: CONSERVAÇÃO NUTRICIONAL ESTRITA (TESTES 23 A 30)
// ─────────────────────────────────────────────────────────────────────────────

test('5.1 Aprova conservação nutricional exata downstream', () => {
  const input = createValidPipelineInput();
  const res = validateGlobalPrescription(input);
  const g11 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G11_NUTRIENT_CONSERVATION);
  assert.strictEqual(g11.status, 'PASS');
  assert.strictEqual(res.conservationAudit.isStrictlyConserved, true);
});

test('5.2 Bloqueia quando calorias divergem acima de 0.05 kcal', () => {
  const input = createValidPipelineInput();
  input.nutrientTimingResult.meals[0].items[0].nutrients.calories += 1.0;

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g11 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G11_NUTRIENT_CONSERVATION);
  assert.strictEqual(g11.status, 'FAIL');
});

test('5.3 Bloqueia quando proteína diverge acima de 0.05g', () => {
  const input = createValidPipelineInput();
  input.nutrientTimingResult.meals[0].items[0].nutrients.protein += 0.5;

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g11 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G11_NUTRIENT_CONSERVATION);
  assert.strictEqual(g11.status, 'FAIL');
});

test('5.4 Bloqueia quando carboidrato diverge acima de 0.05g', () => {
  const input = createValidPipelineInput();
  input.nutrientTimingResult.meals[1].items[0].nutrients.carbohydrate += 0.5;

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g11 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G11_NUTRIENT_CONSERVATION);
  assert.strictEqual(g11.status, 'FAIL');
});

test('5.5 Bloqueia quando gordura/lipídio diverge acima de 0.05g', () => {
  const input = createValidPipelineInput();
  input.nutrientTimingResult.meals[0].items[0].nutrients.lipid += 0.5;

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g11 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G11_NUTRIENT_CONSERVATION);
  assert.strictEqual(g11.status, 'FAIL');
});

test('5.6 Bloqueia quando fibra diverge acima de 0.05g', () => {
  const input = createValidPipelineInput();
  input.nutrientTimingResult.meals[1].items[0].nutrients.fiber += 0.5;

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g11 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G11_NUTRIENT_CONSERVATION);
  assert.strictEqual(g11.status, 'FAIL');
});

test('5.7 Aceita ausência de sódio (null) sem bloquear nem converter em zero', () => {
  const itemsWithoutSodium = createCanonicalFoodItems().map(it => ({
    ...it,
    nutrients: { ...it.nutrients, sodium: null }
  }));
  const input = createValidPipelineInput({ foodItems: itemsWithoutSodium });

  const res = validateGlobalPrescription(input);
  const g11 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G11_NUTRIENT_CONSERVATION);
  assert.strictEqual(g11.status, 'PASS');
  assert.strictEqual(res.conservationAudit.sodiumMg, null);
});

test('5.8 Bloqueia quando sódio é informado e diverge acima de 0.05mg', () => {
  const input = createValidPipelineInput();
  input.nutrientTimingResult.meals[0].items[0].nutrients.sodium += 2.0;

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g11 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G11_NUTRIENT_CONSERVATION);
  assert.strictEqual(g11.status, 'FAIL');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 6: FECHAMENTO ENERGÉTICO ATWATER (TESTES 31 A 34)
// ─────────────────────────────────────────────────────────────────────────────

test('6.1 Aprova fechamento calórico Atwater consistente com a soma de macronutrientes', () => {
  const input = createValidPipelineInput();
  const res = validateGlobalPrescription(input);
  const g12 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G12_ATWATER_CLOSURE);
  assert.strictEqual(g12.status, 'PASS');
});

test('6.2 Bloqueia quando o somatório calórico Atwater (4P+4C+9G) diverge fortemente dos alimentos', () => {
  const input = createValidPipelineInput();
  // Alterar artificialmente as calorias do alimento sem alterar os macros
  input.foodSolverResult.items[0].nutrients.calories = 500; // Original era 155
  input.nutrientTimingResult.meals[0].items[0].nutrients.calories = 500;

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g12 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G12_ATWATER_CLOSURE);
  assert.strictEqual(g12.status, 'FAIL');
});

test('6.3 Tolerância de 1.0 kcal absorve pequenas variações de arredondamento centesimal Atwater', () => {
  const input = createValidPipelineInput();
  input.foodSolverResult.items[0].nutrients.calories += 0.8;
  input.nutrientTimingResult.meals[0].items[0].nutrients.calories += 0.8;

  const res = validateGlobalPrescription(input);
  const g12 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G12_ATWATER_CLOSURE);
  assert.strictEqual(g12.status, 'PASS');
});

test('6.4 Respeita política customizada de tolerância Atwater', () => {
  const input = createValidPipelineInput();
  input.foodSolverResult.items[0].nutrients.calories += 1.5;
  input.nutrientTimingResult.meals[0].items[0].nutrients.calories += 1.5;

  // Com policy padrão de 1.0 deve falhar
  const resDefault = validateGlobalPrescription(input);
  assert.strictEqual(resDefault.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G12_ATWATER_CLOSURE).status, 'FAIL');

  // Com policy customizada de 2.0 kcal deve passar
  const resCustom = validateGlobalPrescription(input, { atwaterToleranceKcal: 2.0 });
  assert.strictEqual(resCustom.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G12_ATWATER_CLOSURE).status, 'PASS');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 7: IDENTIDADE E ESTRUTURA DE REFEIÇÕES (TESTES 35 A 38)
// ─────────────────────────────────────────────────────────────────────────────

test('7.1 Aprova quando quantidade, IDs e papéis das refeições estão preservados', () => {
  const input = createValidPipelineInput();
  const res = validateGlobalPrescription(input);
  const g13 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G13_MEAL_IDENTITY);
  assert.strictEqual(g13.status, 'PASS');
});

test('7.2 Bloqueia quando quantidade de refeições é alterada na N3.5', () => {
  const input = createValidPipelineInput();
  input.nutrientTimingResult.meals = input.nutrientTimingResult.meals.slice(0, 3); // De 4 para 3

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g13 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G13_MEAL_IDENTITY);
  assert.strictEqual(g13.status, 'FAIL');
});

test('7.3 Bloqueia quando mealId é alterado na N3.5', () => {
  const input = createValidPipelineInput();
  input.nutrientTimingResult.meals[0].mealId = 'meal_alterado';

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g13 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G13_MEAL_IDENTITY);
  assert.strictEqual(g13.status, 'FAIL');
});

test('7.4 Bloqueia quando mealRole é alterado arbitrariamente na N3.5', () => {
  const input = createValidPipelineInput();
  input.nutrientTimingResult.meals[0].mealRole = 'SNACK'; // Original era PRIMARY

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g13 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G13_MEAL_IDENTITY);
  assert.strictEqual(g13.status, 'FAIL');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 8: INTEGRIDADE TEMPORAL E COLISÕES FÍSICAS (TESTES 39 A 44)
// ─────────────────────────────────────────────────────────────────────────────

test('8.1 Aprova quando horários de N3.4 chegam 100% intactos à N3.5', () => {
  const input = createValidPipelineInput();
  const res = validateGlobalPrescription(input);
  const g14 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G14_TEMPORAL_INTEGRITY);
  assert.strictEqual(g14.status, 'PASS');
});

test('8.2 Bloqueia quando scheduledTime é alterado na N3.5', () => {
  const input = createValidPipelineInput();
  input.nutrientTimingResult.meals[0].scheduledTime = '09:30'; // Original 08:00

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g14 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G14_TEMPORAL_INTEGRITY);
  assert.strictEqual(g14.status, 'FAIL');
});

test('8.3 Bloqueia quando scheduledMinutes é alterado mesmo mantendo scheduledTime string', () => {
  const input = createValidPipelineInput();
  input.nutrientTimingResult.meals[0].scheduledMinutes = 500; // Original 480

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g14 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G14_TEMPORAL_INTEGRITY);
  assert.strictEqual(g14.status, 'FAIL');
});

test('8.4 Bloqueia imediatamente em caso de colisão física OVERLAPPING_EVENT (G17 Fail)', () => {
  const input = createValidPipelineInput();
  input.nutrientTimingResult.meals[2].primaryRelation = 'OVERLAPPING_EVENT';

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  assert.strictEqual(res.valid, false);
  const g17 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G17_NUTRIENT_TIMING_INTEGRITY);
  assert.strictEqual(g17.status, 'FAIL');
});

test('8.5 Emite WARNING quando treino está ativo mas workoutTime não foi informado', () => {
  const input = createValidPipelineInput();
  input.context.training.workoutTime = null;

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.WARNING);
  assert.strictEqual(res.valid, true);
  const g15 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G15_EVENT_TRACEABILITY);
  assert.strictEqual(g15.status, 'WARNING');
});

test('8.6 Emite WARNING quando cardio está ativo mas sem horário de início estruturado', () => {
  const input = createValidPipelineInput();
  input.context.cardio = {
    hasActiveCardio: true,
    weeklyFrequency: 3,
    sessions: [{ modality: 'Corrida', durationMinutes: 30, startTime: null }]
  };

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.WARNING);
  const g15 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G15_EVENT_TRACEABILITY);
  assert.strictEqual(g15.status, 'WARNING');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 9: PROTOCOLO DE JEJUM E FASTED TRAINING (TESTES 45 A 48)
// ─────────────────────────────────────────────────────────────────────────────

test('9.1 Aprova quando refeições respeitam rigorosamente a janela de jejum', () => {
  const input = createValidPipelineInput({
    context: createMockContext({
      fasting: { hasActiveProtocol: true, status: 'ACTIVE' }
    })
  });
  input.mealTimingResult.eatingWindow = {
    start: '08:00',
    startMinutes: 480,
    end: '20:00',
    endMinutes: 1200,
    strength: 'HARD'
  };

  const res = validateGlobalPrescription(input);
  const g16 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G16_FASTING_COHERENCE);
  assert.strictEqual(g16.status, 'PASS');
});

test('9.2 Bloqueia quando refeição ocorre fora da janela alimentar HARD', () => {
  const input = createValidPipelineInput({
    context: createMockContext({
      fasting: { hasActiveProtocol: true, status: 'ACTIVE' }
    })
  });
  // Janela HARD termina às 18:00, mas a refeição 4 está às 19:00 (1140 min)
  input.mealTimingResult.eatingWindow = {
    start: '08:00',
    startMinutes: 480,
    end: '18:00',
    endMinutes: 1080,
    strength: 'HARD'
  };

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.BLOCKED);
  const g16 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G16_FASTING_COHERENCE);
  assert.strictEqual(g16.status, 'FAIL');
});

test('9.3 Emite WARNING quando refeição ocorre fora de janela PREFERRED', () => {
  const input = createValidPipelineInput({
    context: createMockContext({
      fasting: { hasActiveProtocol: true, status: 'ACTIVE' }
    })
  });
  input.mealTimingResult.eatingWindow = {
    start: '08:00',
    startMinutes: 480,
    end: '18:00',
    endMinutes: 1080,
    strength: 'PREFERRED'
  };

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.WARNING);
  assert.strictEqual(res.valid, true);
  const g16 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G16_FASTING_COHERENCE);
  assert.strictEqual(g16.status, 'WARNING');
});

test('9.4 Trata FASTED_TRAINING como WARNING contextual quando configurado na política', () => {
  const input = createValidPipelineInput({
    context: createMockContext({
      fasting: { hasActiveProtocol: true, status: 'ACTIVE' }
    })
  });
  input.nutrientTimingResult.meals[2].secondaryRelations = ['FASTING_CONSTRAINED'];

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.WARNING);
  const g16 = res.gateResults.find(g => g.gateId === GLOBAL_GATE_ID.G16_FASTING_COHERENCE);
  assert.strictEqual(g16.status, 'WARNING');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 10: TRATAMENTO DE WARNINGS E DADOS INSUFICIENTES (TESTES 49 A 52)
// ─────────────────────────────────────────────────────────────────────────────

test('10.1 Propaga warnings herdados das fases anteriores para inheritedWarnings', () => {
  const input = createValidPipelineInput({
    energyTargetResult: createMockEnergyTargetResult({ warnings: ['Déficit calórico agressivo autorizado'] }),
    nutrientTimingResult: createMockNutrientTimingResult({ warnings: ['Separação operacional curta antes do treino'] })
  });

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.WARNING);
  assert.strictEqual(res.valid, true);
  assert.ok(res.inheritedWarnings.some(w => w.includes('Déficit calórico')));
  assert.ok(res.inheritedWarnings.some(w => w.includes('Separação operacional')));
});

test('10.2 Dados insuficientes (DATA_INSUFFICIENT) nunca geram BLOCKED isoladamente', () => {
  const input = createValidPipelineInput();
  input.context.training.workoutTime = null; // Causa DATA_INSUFFICIENT

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.WARNING);
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.blockingReasons.length, 0);
});

test('10.3 Separa claramente validationWarnings de inheritedWarnings', () => {
  const input = createValidPipelineInput({
    macroTargetResult: createMockMacroTargetResult({ warnings: ['Warning vindo da N2.2'] })
  });
  input.context.training.workoutTime = null; // Gera novo warning na N3.6

  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.inheritedWarnings.length, 1);
  assert.strictEqual(res.validationWarnings.length, 1);
  assert.ok(res.inheritedWarnings[0].includes('N2.2'));
});

test('10.4 Retorna status PASS e valid === true quando não há warnings nem bloqueios', () => {
  const input = createValidPipelineInput();
  const res = validateGlobalPrescription(input);
  assert.strictEqual(res.status, GLOBAL_VALIDATION_STATUS.PASS);
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.blockingReasons.length, 0);
  assert.strictEqual(res.validationWarnings.length, 0);
  assert.strictEqual(res.inheritedWarnings.length, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 11: RASTREABILIDADE E PROVENANCE GLOBAL (TESTES 53 A 56)
// ─────────────────────────────────────────────────────────────────────────────

test('11.1 Constrói a árvore completa de proveniência respondendo às 10 perguntas canônicas', () => {
  const input = createValidPipelineInput();
  const res = validateGlobalPrescription(input);
  const prov = res.globalProvenance;

  assert.strictEqual(prov.engine, 'NutriAxGlobalPrescriptionValidator');
  assert.strictEqual(prov.validationVersion, 'N3.6.0');

  const summary = prov.traceabilitySummary;
  assert.ok(summary.q1_targetEnergetico, 'q1 presente');
  assert.ok(summary.q2_politicaEnergetica, 'q2 presente');
  assert.ok(summary.q3_macrosHomologados, 'q3 presente');
  assert.ok(summary.q4_alimentosSelecionados, 'q4 presente');
  assert.ok(summary.q5_solucaoSolver, 'q5 presente');
  assert.ok(summary.q6_distribuicaoRefeicoes, 'q6 presente');
  assert.ok(summary.q7_horariosAtribuidos, 'q7 presente');
  assert.ok(summary.q8_relacaoTemporalDetectada, 'q8 presente');
  assert.ok(summary.q9_warningsExistentes, 'q9 presente');
  assert.ok(summary.q10_motivoStatusFinal, 'q10 presente');
});

test('11.2 Inclui versões de todas as 8 camadas na proveniência unificada', () => {
  const input = createValidPipelineInput();
  const res = validateGlobalPrescription(input);
  const versions = res.globalProvenance.chainVersions;

  assert.strictEqual(versions.context, '1.0.0');
  assert.strictEqual(versions.n21_energy, 'N2.1.0');
  assert.strictEqual(versions.n22_macro, 'N2.2.0');
  assert.strictEqual(versions.n23_validator, 'N2.3.0');
  assert.strictEqual(versions.n32_solver, 'N3.2.0');
  assert.strictEqual(versions.n33_assembly, 'N3.3.0');
  assert.strictEqual(versions.n34_timing, 'N3.4.0');
  assert.strictEqual(versions.n35_nutrientTiming, 'N3.5.0');
});

test('11.3 Mantém contagem exata de alimentos selecionados e refeições na proveniência', () => {
  const input = createValidPipelineInput();
  const res = validateGlobalPrescription(input);
  const summary = res.globalProvenance.traceabilitySummary;

  assert.strictEqual(summary.q4_alimentosSelecionados.foodsCount, 9);
  assert.strictEqual(summary.q6_distribuicaoRefeicoes.mealsCount, 4);
});

test('11.4 Explicabilidade objetiva do status em q10_motivoStatusFinal', () => {
  const inputPass = createValidPipelineInput();
  const resPass = validateGlobalPrescription(inputPass);
  assert.strictEqual(resPass.globalProvenance.traceabilitySummary.q10_motivoStatusFinal.finalStatus, 'PASS');

  const inputBlocked = createValidPipelineInput({
    energyTargetResult: createMockEnergyTargetResult({ status: 'BLOCKED' })
  });
  const resBlocked = validateGlobalPrescription(inputBlocked);
  assert.strictEqual(resBlocked.globalProvenance.traceabilitySummary.q10_motivoStatusFinal.finalStatus, 'BLOCKED');
  assert.ok(resBlocked.globalProvenance.traceabilitySummary.q10_motivoStatusFinal.blockingCount > 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 12: DETERMINISMO, IMUTABILIDADE PROFUNDA E AUDITORIA ESTÁTICA (TESTES 57 A 62)
// ─────────────────────────────────────────────────────────────────────────────

test('12.1 Determinismo estrito: Múltiplas execuções idênticas produzem saídas estritamente iguais', () => {
  const input = createValidPipelineInput();
  const res1 = validateGlobalPrescription(input);
  const res2 = validateGlobalPrescription(input);
  const res3 = validateGlobalPrescription(input);

  assert.deepStrictEqual(res1, res2);
  assert.deepStrictEqual(res2, res3);
});

test('12.2 Imutabilidade do input: Execução da validação não muta nenhum objeto de entrada', () => {
  const input = createValidPipelineInput();
  const snapshotBefore = JSON.stringify(input);

  validateGlobalPrescription(input);

  const snapshotAfter = JSON.stringify(input);
  assert.strictEqual(snapshotBefore, snapshotAfter, 'O input não pode ter sido mutado em nenhum nível');
});

test('12.3 Saída profundamente congelada (deepFreeze) em todos os nós e subobjetos', () => {
  const input = createValidPipelineInput();
  const res = validateGlobalPrescription(input);

  assert.ok(Object.isFrozen(res), 'Raiz deve estar congelada');
  assert.ok(Object.isFrozen(res.gateResults), 'gateResults deve estar congelado');
  assert.ok(Object.isFrozen(res.conservationAudit), 'conservationAudit deve estar congelado');
  assert.ok(Object.isFrozen(res.temporalAudit), 'temporalAudit deve estar congelado');
  assert.ok(Object.isFrozen(res.globalProvenance), 'globalProvenance deve estar congelado');
  assert.ok(Object.isFrozen(res.globalProvenance.traceabilitySummary), 'traceabilitySummary congelado');
});

test('12.4 Tentativa de mutação na saída congelada lança TypeError em strict mode', () => {
  const input = createValidPipelineInput();
  const res = validateGlobalPrescription(input);

  assert.throws(() => {
    res.status = 'COMPROMETIDO';
  }, TypeError);

  assert.throws(() => {
    res.conservationAudit.isStrictlyConserved = false;
  }, TypeError);
});

test('12.5 Auditoria estática: Arquivos da Fase N3.6 livres de tokens proibidos de infraestrutura e DOM', () => {
  const filesToAudit = [
    path.join(__dirname, '../domain/contracts/GlobalPrescriptionValidationContract.js'),
    path.join(__dirname, '../domain/validation/globalPrescriptionValidationPolicy.js'),
    path.join(__dirname, '../domain/validation/globalPrescriptionValidator.js'),
    path.join(__dirname, '../domain/validation/index.js')
  ];

  const forbiddenTokens = [
    'window.',
    'document.',
    'Dexie',
    'firebase',
    'Gemini',
    'Math.random',
    'Date.now',
    'CANONICAL_DIET_FOODS',
    'foodsData',
    'selectFood',
    'rebalance',
    'modifyMacros',
    'adjustCalories',
    'reschedule'
  ];

  filesToAudit.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    forbiddenTokens.forEach(token => {
      // Ignorar menções em comentários sobre tokens proibidos
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('*') || trimmed.startsWith('//')) return; // comentário
        assert.ok(
          !line.includes(token),
          `Arquivo ${path.basename(filePath)} linha ${idx + 1} não deve conter token proibido: "${token}"`
        );
      });
    });
  });
});

test('12.6 N3.6 não importa e não depende de módulos de infraestrutura protegidos', () => {
  const validatorContent = fs.readFileSync(
    path.join(__dirname, '../domain/validation/globalPrescriptionValidator.js'),
    'utf8'
  );

  const forbiddenRequires = [
    'app.js',
    'db.js',
    'firebase-service',
    'fasting-module'
  ];

  forbiddenRequires.forEach(mod => {
    assert.ok(!validatorContent.includes(mod), `Validador não deve importar "${mod}"`);
  });
});
