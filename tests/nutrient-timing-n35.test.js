/**
 * tests/nutrient-timing-n35.test.js
 * 
 * Suíte de Testes Automatizados — Fase N3.5: Nutrient Timing Específico.
 * NutriAx Pro.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const NutrientTimingContract = require('../domain/contracts/NutrientTimingContract');
const {
  NUTRIENT_TIMING_STATUS,
  TEMPORAL_PRIMARY_RELATION,
  TEMPORAL_SECONDARY_RELATION,
  EVENT_RELATIONS,
  validateNutrientTimingInput,
  validateNutrientTimingOutput
} = NutrientTimingContract;

const timingSubsystem = require('../domain/timing/index');
const {
  DEFAULT_NUTRIENT_TIMING_POLICY,
  timeStringToMinutes,
  minutesToTimeString,
  resolveDayEvents,
  validateNutrientTiming,
  analyzeNutrientTiming
} = timingSubsystem;

// Fixture canônica de contexto de prescrição nutricional
function createMockContext(overrides = {}) {
  return {
    schemaVersion: '1.0.0',
    patient: {
      patientId: 'patient_test_01',
      name: 'Paciente Teste N3.5',
      age: 30,
      sex: 'Masculino'
    },
    objective: {
      clinicalObjective: overrides.clinicalObjective || 'Hipertrofia',
      targetWeightKg: 78.0,
      source: 'CLINICIAN_DEFINED'
    },
    anthropometry: {
      weightKg: 75.0,
      heightCm: 178.0,
      hasRecentAssessment: true
    },
    energy: {
      tmbKcal: 1750,
      getKcal: 2500,
      caloricTargetKcal: 2700,
      energyBalanceKcal: 200
    },
    constraints: overrides.constraints || {
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
      splitSource: 'DETERMINISTIC',
      workoutTime: '17:00',
      sessionDurationMinutes: 60,
      routines: []
    },
    cardio: overrides.cardio || {
      hasActiveCardio: false,
      weeklyFrequency: 0,
      sessions: []
    },
    weeklySchedule: overrides.weeklySchedule || [
      { dayKey: 'd1', dayName: 'Dia 1', rest: false, training: { workoutTime: '17:00' } },
      { dayKey: 'd2', dayName: 'Dia 2', rest: false, training: { workoutTime: '17:00' } },
      { dayKey: 'd3', dayName: 'Dia 3', rest: true, training: null }
    ],
    fasting: overrides.fasting || {
      hasActiveProtocol: false,
      status: 'INACTIVE',
      feedingWindows: null,
      fastingWindows: null
    },
    provenance: {
      weight: { source: 'db.patients' },
      height: { source: 'db.patients' },
      objective: { source: 'db.patients' },
      energy: { source: 'canonical_math' },
      constraints: { source: 'db.patients' },
      training: { source: 'performance' },
      cardio: { source: 'cardio' },
      fasting: { source: 'fasting' },
      recall: { source: 'recall' }
    }
  };
}

// Fixture canônica de resultado de agendamento temporal N3.4 (Meal Timing)
function createMockN34Result(overrides = {}) {
  const defaultMeals = [
    {
      mealId: 'meal_1',
      mealIndex: 0,
      mealName: 'Café da Manhã',
      mealRole: 'PRIMARY',
      scheduledTime: '08:00',
      scheduledMinutes: 480,
      intervalToNextMinutes: 240,
      temporalStatus: 'CONFIRMED',
      timingReason: 'PREFERRED_DISTRIBUTION',
      timingSource: 'STRUCTURED_ROUTINE',
      items: [
        { foodId: 'FOOD_1', foodName: 'Ovo Cozido', grams: 100, nutrients: { calories: 155, protein: 13, carbohydrate: 1.1, lipid: 11, fiber: 0, sodium: 124 } },
        { foodId: 'FOOD_2', foodName: 'Pão Integral', grams: 50, nutrients: { calories: 125, protein: 4.5, carbohydrate: 24, lipid: 1.2, fiber: 3.5, sodium: 150 } }
      ],
      totals: { calories: 280, protein: 17.5, carbohydrate: 25.1, fat: 12.2, fiber: 3.5, sodium: 274 }
    },
    {
      mealId: 'meal_2',
      mealIndex: 1,
      mealName: 'Almoço',
      mealRole: 'PRIMARY',
      scheduledTime: '12:00',
      scheduledMinutes: 720,
      intervalToNextMinutes: 210,
      temporalStatus: 'CONFIRMED',
      timingReason: 'PREFERRED_DISTRIBUTION',
      timingSource: 'STRUCTURED_ROUTINE',
      items: [
        { foodId: 'FOOD_3', foodName: 'Arroz Branco', grams: 150, nutrients: { calories: 192, protein: 3.75, carbohydrate: 42, lipid: 0.3, fiber: 2.25, sodium: 5 } },
        { foodId: 'FOOD_4', foodName: 'Peito de Frango', grams: 150, nutrients: { calories: 238, protein: 48, carbohydrate: 0, lipid: 3.75, fiber: 0, sodium: 105 } }
      ],
      totals: { calories: 430, protein: 51.75, carbohydrate: 42, fat: 4.05, fiber: 2.25, sodium: 110 }
    },
    {
      mealId: 'meal_3',
      mealIndex: 2,
      mealName: 'Lanche Pré-Treino',
      mealRole: 'SECONDARY',
      scheduledTime: '15:30',
      scheduledMinutes: 930,
      intervalToNextMinutes: 195,
      temporalStatus: 'CONFIRMED',
      timingReason: 'PREFERRED_DISTRIBUTION',
      timingSource: 'STRUCTURED_ROUTINE',
      items: [
        { foodId: 'FOOD_5', foodName: 'Banana Prata', grams: 100, nutrients: { calories: 98, protein: 1.3, carbohydrate: 26, lipid: 0.1, fiber: 2, sodium: 1 } },
        { foodId: 'FOOD_6', foodName: 'Aveia em Flocos', grams: 30, nutrients: { calories: 118, protein: 4.3, carbohydrate: 20, lipid: 2.2, fiber: 3, sodium: 2 } }
      ],
      totals: { calories: 216, protein: 5.6, carbohydrate: 46, fat: 2.3, fiber: 5, sodium: 3 }
    },
    {
      mealId: 'meal_4',
      mealIndex: 3,
      mealName: 'Jantar Pós-Treino',
      mealRole: 'PRIMARY',
      scheduledTime: '18:45',
      scheduledMinutes: 1125,
      intervalToNextMinutes: 195,
      temporalStatus: 'CONFIRMED',
      timingReason: 'PREFERRED_DISTRIBUTION',
      timingSource: 'STRUCTURED_ROUTINE',
      items: [
        { foodId: 'FOOD_7', foodName: 'Batata Doce', grams: 200, nutrients: { calories: 154, protein: 1.2, carbohydrate: 36.8, lipid: 0.2, fiber: 4.4, sodium: 20 } },
        { foodId: 'FOOD_8', foodName: 'Patinho Moído', grams: 150, nutrients: { calories: 328, protein: 53.8, carbohydrate: 0, lipid: 11.2, fiber: 0, sodium: 90 } }
      ],
      totals: { calories: 482, protein: 55.0, carbohydrate: 36.8, fat: 11.4, fiber: 4.4, sodium: 110 }
    },
    {
      mealId: 'meal_5',
      mealIndex: 4,
      mealName: 'Ceia',
      mealRole: 'FLEXIBLE',
      scheduledTime: '22:00',
      scheduledMinutes: 1320,
      intervalToNextMinutes: null,
      temporalStatus: 'CONFIRMED',
      timingReason: 'PREFERRED_DISTRIBUTION',
      timingSource: 'STRUCTURED_ROUTINE',
      items: [
        { foodId: 'FOOD_9', foodName: 'Iogurte Natural', grams: 170, nutrients: { calories: 86, protein: 6.8, carbohydrate: 9.1, lipid: 2.5, fiber: 0, sodium: 80 } }
      ],
      totals: { calories: 86, protein: 6.8, carbohydrate: 9.1, fat: 2.5, fiber: 0, sodium: 80 }
    }
  ];

  const meals = overrides.meals || defaultMeals;

  const totalCalories = meals.reduce((acc, m) => acc + m.totals.calories, 0);
  const totalProtein = meals.reduce((acc, m) => acc + m.totals.protein, 0);
  const totalCarb = meals.reduce((acc, m) => acc + m.totals.carbohydrate, 0);
  const totalFat = meals.reduce((acc, m) => acc + m.totals.fat, 0);
  const totalFiber = meals.reduce((acc, m) => acc + m.totals.fiber, 0);
  const totalSodium = meals.reduce((acc, m) => acc + (m.totals.sodium || 0), 0);

  return {
    timingVersion: 'N3.4.0',
    assemblyVersion: 'N3.3.0',
    solverVersion: 'N3.2.0',
    status: overrides.status || 'PASS',
    valid: overrides.valid !== undefined ? overrides.valid : true,
    meals,
    eatingWindow: overrides.eatingWindow || {
      start: '08:00',
      startMinutes: 480,
      end: '22:30',
      endMinutes: 1350,
      durationMinutes: 870,
      strength: 'PREFERRED',
      source: 'STRUCTURED_ROUTINE'
    },
    temporalEvents: overrides.temporalEvents || [
      { eventType: 'TRAINING', start: '17:00', end: '18:00', startMinutes: 1020, endMinutes: 1080, durationMinutes: 60, source: 'STRUCTURED_TRAINING' }
    ],
    globalTotals: {
      calories: totalCalories,
      protein: totalProtein,
      carbohydrate: totalCarb,
      fat: totalFat,
      fiber: totalFiber,
      sodium: totalSodium
    },
    diagnostics: [],
    warnings: overrides.warnings || [],
    blockingReasons: overrides.blockingReasons || [],
    provenance: { engine: 'NutriAxDeterministicMealTiming', policyVersion: '1.0.0' }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 1: CONTRATO & PORTÃO DE ENTRADA (TESTES 1 A 8)
// ─────────────────────────────────────────────────────────────────────────────

test('1.1 Rejeita input nulo ou de tipo não-objeto', () => {
  const res1 = analyzeNutrientTiming(null);
  assert.strictEqual(res1.status, NUTRIENT_TIMING_STATUS.BLOCKED);
  assert.strictEqual(res1.valid, false);

  const res2 = analyzeNutrientTiming('invalido');
  assert.strictEqual(res2.status, NUTRIENT_TIMING_STATUS.BLOCKED);
});

test('1.2 Rejeita input sem context', () => {
  const input = { mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);
  assert.strictEqual(res.status, NUTRIENT_TIMING_STATUS.BLOCKED);
  assert.ok(res.blockingReasons.some(r => r.includes('context')));
});

test('1.3 Rejeita input sem mealTimingResult', () => {
  const input = { context: createMockContext() };
  const res = analyzeNutrientTiming(input);
  assert.strictEqual(res.status, NUTRIENT_TIMING_STATUS.BLOCKED);
  assert.ok(res.blockingReasons.some(r => r.includes('mealTimingResult')));
});

test('1.4 Rejeita input quando mealTimingResult.status === "BLOCKED"', () => {
  const timingBlocked = createMockN34Result({ status: 'BLOCKED', valid: false });
  const input = { context: createMockContext(), mealTimingResult: timingBlocked };
  const res = analyzeNutrientTiming(input);
  assert.strictEqual(res.status, NUTRIENT_TIMING_STATUS.BLOCKED);
  assert.ok(res.blockingReasons.some(r => r.includes('BLOCKED')));
});

test('1.5 Rejeita input quando mealTimingResult.valid !== true', () => {
  const timingInvalid = createMockN34Result({ valid: false });
  const input = { context: createMockContext(), mealTimingResult: timingInvalid };
  const res = analyzeNutrientTiming(input);
  assert.strictEqual(res.status, NUTRIENT_TIMING_STATUS.BLOCKED);
});

test('1.6 Rejeita input quando mealTimingResult.meals é array vazio', () => {
  const timingNoMeals = createMockN34Result({ meals: [] });
  const input = { context: createMockContext(), mealTimingResult: timingNoMeals };
  const res = analyzeNutrientTiming(input);
  assert.strictEqual(res.status, NUTRIENT_TIMING_STATUS.BLOCKED);
});

test('1.7 Rejeita input quando refeição de mealTimingResult não possui scheduledMinutes', () => {
  const malformedMeals = createMockN34Result();
  delete malformedMeals.meals[0].scheduledMinutes;
  const input = { context: createMockContext(), mealTimingResult: malformedMeals };
  const res = analyzeNutrientTiming(input);
  assert.strictEqual(res.status, NUTRIENT_TIMING_STATUS.BLOCKED);
});

test('1.8 Valida input nominal completo com sucesso', () => {
  const input = { context: createMockContext(), mealTimingResult: createMockN34Result() };
  const val = validateNutrientTimingInput(input);
  assert.strictEqual(val.isValid, true);
  assert.strictEqual(val.isBlocked, false);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 2: RELAÇÃO TEMPORAL COM TREINAMENTO DE MUSCULAÇÃO (TESTES 9 A 16)
// ─────────────────────────────────────────────────────────────────────────────

test('2.1 Identifica determinística e unicamente a refeição PRE_TRAINING', () => {
  // Treino das 17:00 às 18:00 (1020 - 1080 min). Refeição 3 às 15:30 (930 min).
  // Distância = 90 min. Está dentro de preferredPeriEventWindowMinutes (150 min).
  const input = { context: createMockContext(), mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  assert.strictEqual(res.status, NUTRIENT_TIMING_STATUS.PASS);
  const preMeal = res.meals.find(m => m.mealId === 'meal_3');
  assert.strictEqual(preMeal.primaryRelation, TEMPORAL_PRIMARY_RELATION.PRE_TRAINING);
  assert.strictEqual(preMeal.distanceToTrainingMinutes, 90);
  assert.ok(preMeal.analysisReason.includes('90 min antes'));
});

test('2.2 Identifica determinística e unicamente a refeição POST_TRAINING', () => {
  // Treino das 17:00 às 18:00 (1020 - 1080 min). Refeição 4 às 18:45 (1125 min).
  // Distância = 45 min após o término.
  const input = { context: createMockContext(), mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  const postMeal = res.meals.find(m => m.mealId === 'meal_4');
  assert.strictEqual(postMeal.primaryRelation, TEMPORAL_PRIMARY_RELATION.POST_TRAINING);
  assert.strictEqual(postMeal.distanceToTrainingMinutes, 45);
  assert.ok(postMeal.analysisReason.includes('45 min após'));
});

test('2.3 Calcula corretamente distanceToTrainingMinutes em minutos para todas as refeições', () => {
  const input = { context: createMockContext(), mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  // meal_1 às 08:00 (480 min): 1020 - 480 = 540 min antes
  const m1 = res.meals.find(m => m.mealId === 'meal_1');
  assert.strictEqual(m1.distanceToTrainingMinutes, 540);

  // meal_2 às 12:00 (720 min): 1020 - 720 = 300 min antes
  const m2 = res.meals.find(m => m.mealId === 'meal_2');
  assert.strictEqual(m2.distanceToTrainingMinutes, 300);

  // meal_5 às 22:00 (1320 min): 1320 - 1080 = 240 min após
  const m5 = res.meals.find(m => m.mealId === 'meal_5');
  assert.strictEqual(m5.distanceToTrainingMinutes, 240);
});

test('2.4 Refeição dentro de preferredPeriEventWindowMinutes recebe justificativa com dados reais', () => {
  const input = { context: createMockContext(), mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  const preMeal = res.meals.find(m => m.mealId === 'meal_3');
  assert.strictEqual(typeof preMeal.analysisReason, 'string');
  assert.ok(preMeal.analysisReason.includes('17:00'));
});

test('2.5 Refeição fora de preferredPeriEventWindowMinutes permanece NEUTRAL', () => {
  const input = { context: createMockContext(), mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  // meal_1 (08:00) e meal_2 (12:00) estão distantes de 17:00 (> 150 min)
  const m1 = res.meals.find(m => m.mealId === 'meal_1');
  assert.strictEqual(m1.primaryRelation, TEMPORAL_PRIMARY_RELATION.NEUTRAL);

  const m2 = res.meals.find(m => m.mealId === 'meal_2');
  assert.strictEqual(m2.primaryRelation, TEMPORAL_PRIMARY_RELATION.NEUTRAL);
});

test('2.6 Múltiplas refeições antes do treino: apenas a mais próxima é PRE_TRAINING', () => {
  // Cria refeição extra às 16:15 (975 min, 45 min antes) além da de 15:30 (930 min, 90 min antes)
  const timing = createMockN34Result();
  const extraMeal = {
    mealId: 'meal_extra',
    mealIndex: 5,
    mealName: 'Lanche Imediato',
    mealRole: 'SNACK',
    scheduledTime: '16:15',
    scheduledMinutes: 975,
    intervalToNextMinutes: 150,
    temporalStatus: 'CONFIRMED',
    timingReason: 'TEST',
    timingSource: 'POLICY',
    items: [{ foodId: 'F_EX', foodName: 'Maçã', grams: 100, nutrients: { calories: 52, protein: 0.3, carbohydrate: 14, lipid: 0.2, fiber: 2.4, sodium: 1 } }],
    totals: { calories: 52, protein: 0.3, carbohydrate: 14, fat: 0.2, fiber: 2.4, sodium: 1 }
  };
  timing.meals.push(extraMeal);
  timing.meals.sort((a, b) => a.scheduledMinutes - b.scheduledMinutes);

  const input = { context: createMockContext(), mealTimingResult: timing };
  const res = analyzeNutrientTiming(input);

  // meal_extra (45 min) deve ser PRE_TRAINING
  const mExtra = res.meals.find(m => m.mealId === 'meal_extra');
  assert.strictEqual(mExtra.primaryRelation, TEMPORAL_PRIMARY_RELATION.PRE_TRAINING);

  // meal_3 (90 min) não é a mais próxima, portanto fica NEUTRAL
  const m3 = res.meals.find(m => m.mealId === 'meal_3');
  assert.strictEqual(m3.primaryRelation, TEMPORAL_PRIMARY_RELATION.NEUTRAL);
});

test('2.7 Ausência de workoutTime no contexto: distanceToTrainingMinutes é null e refeições são NEUTRAL', () => {
  const ctxNoWorkout = createMockContext({
    routine: { wakeUpTime: '07:00', bedTime: '23:00', workoutTime: null },
    training: { hasActiveTraining: false, workoutTime: null }
  });
  const input = { context: ctxNoWorkout, mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  res.meals.forEach(m => {
    assert.strictEqual(m.distanceToTrainingMinutes, null);
    assert.notStrictEqual(m.primaryRelation, TEMPORAL_PRIMARY_RELATION.PRE_TRAINING);
    assert.notStrictEqual(m.primaryRelation, TEMPORAL_PRIMARY_RELATION.POST_TRAINING);
  });
});

test('2.8 Duração padrão de treino (60 min) é adotada quando sessionDurationMinutes é ausente', () => {
  const ctx = createMockContext({
    training: { hasActiveTraining: true, workoutTime: '17:00', sessionDurationMinutes: null }
  });
  const input = { context: ctx, mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  // Término esperado: 17:00 + 60 min = 18:00 (1080 min).
  // Refeição 4 (18:45 = 1125 min) -> distância esperada = 1125 - 1080 = 45 min.
  const m4 = res.meals.find(m => m.mealId === 'meal_4');
  assert.strictEqual(m4.distanceToTrainingMinutes, 45);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 3: RELAÇÃO TEMPORAL COM TREINAMENTO CARDIOVASCULAR (TESTES 17 A 23)
// ─────────────────────────────────────────────────────────────────────────────

test('3.1 Identifica PRE_CARDIO quando há sessão de cardio matinal com horário estruturado', () => {
  const ctx = createMockContext({
    routine: { wakeUpTime: '06:00', bedTime: '23:00', workoutTime: null },
    training: { hasActiveTraining: false },
    cardio: {
      hasActiveCardio: true,
      sessions: [
        { cardioId: 'cardio_01', startTime: '09:00', durationMinutes: 45, type: 'Moderado' }
      ]
    }
  });
  // Refeição 1 é às 08:00 (480 min). Cardio das 09:00 às 09:45 (540 - 585 min).
  // Distância pré-cardio: 540 - 480 = 60 min.
  const input = { context: ctx, mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  const m1 = res.meals.find(m => m.mealId === 'meal_1');
  assert.strictEqual(m1.primaryRelation, TEMPORAL_PRIMARY_RELATION.PRE_CARDIO);
  assert.strictEqual(m1.distanceToCardioMinutes, 60);
});

test('3.2 Identifica POST_CARDIO quando há sessão de cardio matinal com horário estruturado', () => {
  const ctx = createMockContext({
    routine: { wakeUpTime: '06:00', bedTime: '23:00', workoutTime: null },
    training: { hasActiveTraining: false },
    cardio: {
      hasActiveCardio: true,
      sessions: [
        { cardioId: 'cardio_01', startTime: '09:00', durationMinutes: 45, type: 'Moderado' }
      ]
    }
  });
  // Refeição 2 é às 12:00 (720 min). Cardio termina às 09:45 (585 min).
  // Distância = 720 - 585 = 135 min (dentro de 150 min).
  const input = { context: ctx, mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  const m2 = res.meals.find(m => m.mealId === 'meal_2');
  assert.strictEqual(m2.primaryRelation, TEMPORAL_PRIMARY_RELATION.POST_CARDIO);
  assert.strictEqual(m2.distanceToCardioMinutes, 135);
});

test('3.3 Calcula distanceToCardioMinutes com exatidão', () => {
  const ctx = createMockContext({
    cardio: {
      hasActiveCardio: true,
      sessions: [{ cardioId: 'c1', startTime: '10:00', durationMinutes: 30 }]
    }
  });
  const input = { context: ctx, mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  // Cardio das 10:00 às 10:30 (600 - 630 min).
  // meal_1 (08:00 = 480 min): 600 - 480 = 120 min antes.
  const m1 = res.meals.find(m => m.mealId === 'meal_1');
  assert.strictEqual(m1.distanceToCardioMinutes, 120);
});

test('3.4 Cardio sem horário de início estruturado produz distanceToCardioMinutes: null e tag DATA_INSUFFICIENT', () => {
  const ctx = createMockContext({
    cardio: {
      hasActiveCardio: true,
      sessions: [{ cardioId: 'c_unscheduled', durationMinutes: 45, type: 'Z2' }] // sem startTime
    }
  });
  const input = { context: ctx, mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  assert.strictEqual(res.status, NUTRIENT_TIMING_STATUS.WARNING);
  assert.ok(res.warnings.some(w => w.includes('DATA_INSUFFICIENT')));
  res.meals.forEach(m => {
    assert.strictEqual(m.distanceToCardioMinutes, null);
    assert.ok(m.secondaryRelations.includes(TEMPORAL_SECONDARY_RELATION.DATA_INSUFFICIENT));
  });
});

test('3.5 Refeição entre treino matinal e cardio vespertino no mesmo dia recebe BETWEEN_TRAINING_AND_CARDIO', () => {
  // Treino das 09:00 às 10:00 (540 - 600 min).
  // Cardio das 19:00 às 19:45 (1140 - 1185 min).
  // meal_2 às 12:00 (720 min) e meal_3 às 15:30 (930 min) estão entre 10:00 e 19:00.
  const ctx = createMockContext({
    routine: { wakeUpTime: '07:00', bedTime: '23:00', workoutTime: '09:00' },
    training: { hasActiveTraining: true, workoutTime: '09:00', sessionDurationMinutes: 60 },
    cardio: {
      hasActiveCardio: true,
      sessions: [{ cardioId: 'c_eve', startTime: '19:00', durationMinutes: 45 }]
    }
  });
  const input = { context: ctx, mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  // meal_3 (15:30) fica no meio do intervalo
  const m3 = res.meals.find(m => m.mealId === 'meal_3');
  assert.strictEqual(m3.primaryRelation, TEMPORAL_PRIMARY_RELATION.BETWEEN_TRAINING_AND_CARDIO);
});

test('3.6 Cardio após treino: refeição pós-sessões recebe POST_TRAINING sem conflito de duplicidade', () => {
  const ctx = createMockContext({
    training: { hasActiveTraining: true, workoutTime: '16:00', sessionDurationMinutes: 60 },
    cardio: {
      hasActiveCardio: true,
      sessions: [{ cardioId: 'c_post', startTime: '17:00', durationMinutes: 30 }]
    }
  });
  const input = { context: ctx, mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  // meal_4 às 18:45
  const m4 = res.meals.find(m => m.mealId === 'meal_4');
  assert.ok(m4.primaryRelation === TEMPORAL_PRIMARY_RELATION.POST_TRAINING || m4.primaryRelation === TEMPORAL_PRIMARY_RELATION.POST_CARDIO);
});

test('3.7 Múltiplas sessões de cardio utilizam a menor distância determinística', () => {
  const ctx = createMockContext({
    cardio: {
      hasActiveCardio: true,
      sessions: [
        { cardioId: 'c1', startTime: '09:00', durationMinutes: 30 },
        { cardioId: 'c2', startTime: '14:00', durationMinutes: 30 }
      ]
    }
  });
  const input = { context: ctx, mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  // meal_2 às 12:00 (720 min):
  // Distância de c1 (término 09:30 = 570 min): 720 - 570 = 150 min.
  // Distância de c2 (início 14:00 = 840 min): 840 - 720 = 120 min.
  // Menor distância esperada: 120 min.
  const m2 = res.meals.find(m => m.mealId === 'meal_2');
  assert.strictEqual(m2.distanceToCardioMinutes, 120);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 4: JEJUM & FASTED_TRAINING (TESTES 24 A 29)
// ─────────────────────────────────────────────────────────────────────────────

test('4.1 Refeições ancoradas na abertura ou fechamento da janela alimentar recebem FASTING_CONSTRAINED', () => {
  const timingWithFasting = createMockN34Result({
    eatingWindow: {
      start: '08:00',
      startMinutes: 480,
      end: '22:00',
      endMinutes: 1320,
      durationMinutes: 840,
      strength: 'HARD',
      source: 'FASTING_PROTOCOL'
    }
  });
  const input = { context: createMockContext(), mealTimingResult: timingWithFasting };
  const res = analyzeNutrientTiming(input);

  // meal_1 é às 08:00 (ancorada na abertura)
  const m1 = res.meals.find(m => m.mealId === 'meal_1');
  assert.ok(m1.secondaryRelations.includes(TEMPORAL_SECONDARY_RELATION.FASTING_CONSTRAINED));

  // meal_5 é às 22:00 (ancorada no encerramento)
  const m5 = res.meals.find(m => m.mealId === 'meal_5');
  assert.ok(m5.secondaryRelations.includes(TEMPORAL_SECONDARY_RELATION.FASTING_CONSTRAINED));
});

test('4.2 Treino durante o jejum gera diagnóstico FASTED_TRAINING e NÃO gera WARNING automaticamente', () => {
  // Treino das 06:00 às 07:00 (360 - 420 min). Janela alimentar abre às 12:00 e fecha às 20:00 (720 - 1200 min).
  const fastedMeals = [
    {
      mealId: 'm_f1', mealIndex: 0, mealName: 'Almoço', mealRole: 'PRIMARY', scheduledTime: '12:00', scheduledMinutes: 720,
      intervalToNextMinutes: 240, temporalStatus: 'CONFIRMED', timingReason: 'FASTING', timingSource: 'FASTING_PROTOCOL',
      items: [{ foodId: 'F1', foodName: 'Ovo', grams: 100, nutrients: { calories: 155, protein: 13, carbohydrate: 1.1, lipid: 11, fiber: 0, sodium: 124 } }],
      totals: { calories: 155, protein: 13, carbohydrate: 1.1, fat: 11, fiber: 0, sodium: 124 }
    },
    {
      mealId: 'm_f2', mealIndex: 1, mealName: 'Lanche', mealRole: 'SECONDARY', scheduledTime: '16:00', scheduledMinutes: 960,
      intervalToNextMinutes: 210, temporalStatus: 'CONFIRMED', timingReason: 'PREF', timingSource: 'PREF',
      items: [{ foodId: 'F2', foodName: 'Frango', grams: 150, nutrients: { calories: 238, protein: 48, carbohydrate: 0, lipid: 3.75, fiber: 0, sodium: 105 } }],
      totals: { calories: 238, protein: 48, carbohydrate: 0, fat: 3.75, fiber: 0, sodium: 105 }
    },
    {
      mealId: 'm_f3', mealIndex: 2, mealName: 'Jantar', mealRole: 'PRIMARY', scheduledTime: '19:30', scheduledMinutes: 1170,
      intervalToNextMinutes: null, temporalStatus: 'CONFIRMED', timingReason: 'FASTING', timingSource: 'FASTING_PROTOCOL',
      items: [{ foodId: 'F3', foodName: 'Patinho', grams: 150, nutrients: { calories: 328, protein: 53.8, carbohydrate: 0, lipid: 11.2, fiber: 0, sodium: 90 } }],
      totals: { calories: 328, protein: 53.8, carbohydrate: 0, fat: 11.2, fiber: 0, sodium: 90 }
    }
  ];
  const timingFasted = createMockN34Result({
    meals: fastedMeals,
    eatingWindow: { start: '12:00', startMinutes: 720, end: '20:00', endMinutes: 1200, durationMinutes: 480, strength: 'HARD', source: 'FASTING_PROTOCOL' }
  });
  const ctx = createMockContext({
    routine: { workoutTime: '06:00', wakeUpTime: '05:30', bedTime: '22:00' },
    training: { hasActiveTraining: true, workoutTime: '06:00', sessionDurationMinutes: 60 },
    fasting: { hasActiveProtocol: true, status: 'ACTIVE' }
  });
  const input = { context: ctx, mealTimingResult: timingFasted };
  const res = analyzeNutrientTiming(input);

  // Status deve ser PASS (pois não há contraindicação clínica formal)
  assert.strictEqual(res.status, NUTRIENT_TIMING_STATUS.PASS);
  assert.ok(res.globalDiagnostics.some(d => d.includes('FASTED_TRAINING')));
});

test('4.3 Treino durante o jejum gera WARNING quando houver restrição formal (prohibitFastedTraining)', () => {
  const fastedMeals = [
    {
      mealId: 'm_f1', mealIndex: 0, mealName: 'Almoço', mealRole: 'PRIMARY', scheduledTime: '12:00', scheduledMinutes: 720,
      intervalToNextMinutes: 240, temporalStatus: 'CONFIRMED', timingReason: 'FASTING', timingSource: 'FASTING_PROTOCOL',
      items: [{ foodId: 'F1', foodName: 'Ovo', grams: 100, nutrients: { calories: 155, protein: 13, carbohydrate: 1.1, lipid: 11, fiber: 0, sodium: 124 } }],
      totals: { calories: 155, protein: 13, carbohydrate: 1.1, fat: 11, fiber: 0, sodium: 124 }
    },
    {
      mealId: 'm_f2', mealIndex: 1, mealName: 'Jantar', mealRole: 'PRIMARY', scheduledTime: '19:30', scheduledMinutes: 1170,
      intervalToNextMinutes: null, temporalStatus: 'CONFIRMED', timingReason: 'FASTING', timingSource: 'FASTING_PROTOCOL',
      items: [{ foodId: 'F3', foodName: 'Patinho', grams: 150, nutrients: { calories: 328, protein: 53.8, carbohydrate: 0, lipid: 11.2, fiber: 0, sodium: 90 } }],
      totals: { calories: 328, protein: 53.8, carbohydrate: 0, fat: 11.2, fiber: 0, sodium: 90 }
    }
  ];
  const timingFasted = createMockN34Result({
    meals: fastedMeals,
    eatingWindow: { start: '12:00', startMinutes: 720, end: '20:00', endMinutes: 1200, durationMinutes: 480, strength: 'HARD', source: 'FASTING_PROTOCOL' }
  });
  const ctx = createMockContext({
    routine: { workoutTime: '06:00' },
    training: { hasActiveTraining: true, workoutTime: '06:00', sessionDurationMinutes: 60 },
    constraints: { prohibitFastedTraining: true }
  });
  const input = { context: ctx, mealTimingResult: timingFasted };
  const res = analyzeNutrientTiming(input);

  assert.strictEqual(res.status, NUTRIENT_TIMING_STATUS.WARNING);
  assert.ok(res.warnings.some(w => w.includes('Treino em jejum incompatível com restrição formal')));
});

test('4.4 N3.5 não move refeições para dentro do jejum ao analisar FASTED_TRAINING', () => {
  const fastedMeals = [
    {
      mealId: 'm_f1', mealIndex: 0, mealName: 'Almoço', mealRole: 'PRIMARY', scheduledTime: '12:00', scheduledMinutes: 720,
      intervalToNextMinutes: 240, temporalStatus: 'CONFIRMED', timingReason: 'FASTING', timingSource: 'FASTING_PROTOCOL',
      items: [{ foodId: 'F1', foodName: 'Ovo', grams: 100, nutrients: { calories: 155, protein: 13, carbohydrate: 1.1, lipid: 11, fiber: 0, sodium: 124 } }],
      totals: { calories: 155, protein: 13, carbohydrate: 1.1, fat: 11, fiber: 0, sodium: 124 }
    }
  ];
  const timingFasted = createMockN34Result({
    meals: fastedMeals,
    eatingWindow: { start: '12:00', startMinutes: 720, end: '20:00', endMinutes: 1200, durationMinutes: 480, strength: 'HARD', source: 'FASTING_PROTOCOL' }
  });
  const ctx = createMockContext({
    routine: { workoutTime: '06:00' },
    training: { hasActiveTraining: true, workoutTime: '06:00' }
  });
  const input = { context: ctx, mealTimingResult: timingFasted };
  const res = analyzeNutrientTiming(input);

  // Todos os horários originais da N3.4 permanecem intactos
  for (let i = 0; i < res.meals.length; i++) {
    assert.strictEqual(res.meals[i].scheduledTime, timingFasted.meals[i].scheduledTime);
    assert.strictEqual(res.meals[i].scheduledMinutes, timingFasted.meals[i].scheduledMinutes);
  }
});

test('4.5 Refeição com scheduledMinutes violando janela HARD gera BLOCKED', () => {
  const timingOutside = createMockN34Result({
    eatingWindow: { start: '12:00', startMinutes: 720, end: '20:00', endMinutes: 1200, durationMinutes: 480, strength: 'HARD', source: 'FASTING_PROTOCOL' }
  });
  // meal_1 está às 08:00 (480 min), fora da janela 12:00-20:00
  const input = { context: createMockContext(), mealTimingResult: timingOutside };
  const res = analyzeNutrientTiming(input);

  // Deve bloquear por violação de regra HARD
  assert.strictEqual(res.status, NUTRIENT_TIMING_STATUS.BLOCKED);
  assert.strictEqual(res.valid, false);
});

test('4.6 Ausência de jejum ativo não gera falsos positivos de FASTING_CONSTRAINED', () => {
  const input = { context: createMockContext({ fasting: { hasActiveProtocol: false } }), mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  // Nenhuma refeição deve conter a tag se não houver proximidade com borda de jejum
  const m2 = res.meals.find(m => m.mealId === 'meal_2');
  assert.strictEqual(m2.secondaryRelations.includes(TEMPORAL_SECONDARY_RELATION.FASTING_CONSTRAINED), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 5: MICROCICLO SEMANAL & REST_DAY ESTRITO (TESTES 30 A 34)
// ─────────────────────────────────────────────────────────────────────────────

test('5.1 Dia com rest === true estruturado classifica todas as refeições como REST_DAY', () => {
  const ctx = createMockContext();
  const input = { context: ctx, mealTimingResult: createMockN34Result(), targetDayKey: 'd3' }; // d3 possui rest: true
  const res = analyzeNutrientTiming(input);

  assert.strictEqual(res.status, NUTRIENT_TIMING_STATUS.PASS);
  res.meals.forEach(m => {
    assert.strictEqual(m.primaryRelation, TEMPORAL_PRIMARY_RELATION.REST_DAY);
    assert.ok(m.analysisReason.includes('descanso estruturado'));
  });
});

test('5.2 Dia sem rest === true NÃO é inferido como descanso mesmo sem treino ou cardio', () => {
  const ctx = createMockContext({
    weeklySchedule: [{ dayKey: 'd_vazio', dayName: 'Dia Vazio', rest: false, training: null, cardio: null }]
  });
  const input = { context: ctx, mealTimingResult: createMockN34Result(), targetDayKey: 'd_vazio' };
  const res = analyzeNutrientTiming(input);

  res.meals.forEach(m => {
    assert.notStrictEqual(m.primaryRelation, TEMPORAL_PRIMARY_RELATION.REST_DAY);
  });
});

test('5.3 Proibição de inferência de descanso por nome do dia ("Domingo")', () => {
  const ctx = createMockContext({
    weeklySchedule: [{ dayKey: 'dom', dayName: 'Domingo', rest: false, training: null }]
  });
  const input = { context: ctx, mealTimingResult: createMockN34Result(), targetDayKey: 'dom' };
  const res = analyzeNutrientTiming(input);

  // Não pode ser classificado como REST_DAY apenas por se chamar Domingo
  assert.ok(res.meals.every(m => m.primaryRelation !== TEMPORAL_PRIMARY_RELATION.REST_DAY));
});

test('5.4 Proibição de inferência de descanso por ausência de rotinas de treino', () => {
  const ctx = createMockContext({
    training: { hasActiveTraining: false, routines: [] },
    weeklySchedule: [{ dayKey: 'd1', rest: false }]
  });
  const input = { context: ctx, mealTimingResult: createMockN34Result(), targetDayKey: 'd1' };
  const res = analyzeNutrientTiming(input);

  assert.ok(res.meals.every(m => m.primaryRelation !== TEMPORAL_PRIMARY_RELATION.REST_DAY));
});

test('5.5 targetDayKey seleciona corretamente o dia do microciclo', () => {
  const ctx = createMockContext({
    weeklySchedule: [
      { dayKey: 'dia_treino', rest: false, training: { workoutTime: '17:00' } },
      { dayKey: 'dia_descanso', rest: true }
    ]
  });
  const inputTreino = { context: ctx, mealTimingResult: createMockN34Result(), targetDayKey: 'dia_treino' };
  const resTreino = analyzeNutrientTiming(inputTreino);
  assert.ok(resTreino.meals.some(m => m.primaryRelation === TEMPORAL_PRIMARY_RELATION.PRE_TRAINING));

  const inputDescanso = { context: ctx, mealTimingResult: createMockN34Result(), targetDayKey: 'dia_descanso' };
  const resDescanso = analyzeNutrientTiming(inputDescanso);
  assert.ok(resDescanso.meals.every(m => m.primaryRelation === TEMPORAL_PRIMARY_RELATION.REST_DAY));
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 6: PREFERÊNCIAS OPERACIONAIS & SEPARAÇÃO TEMPORAL (TESTES 35 A 40)
// ─────────────────────────────────────────────────────────────────────────────

test('6.1 preferredPeriEventWindowMinutes customizado altera a janela de proximidade', () => {
  // Configura janela de apenas 60 minutos
  const input = { context: createMockContext(), mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input, { preferredPeriEventWindowMinutes: 60 });

  // meal_3 é às 15:30 (90 min antes de 17:00). Com janela de 60 min, fica fora!
  const m3 = res.meals.find(m => m.mealId === 'meal_3');
  assert.strictEqual(m3.primaryRelation, TEMPORAL_PRIMARY_RELATION.NEUTRAL);
});

test('6.2 preferredMealEventSeparationMinutes emite CLOSE_EVENT_PROXIMITY e WARNING quando refeição for muito próxima', () => {
  // Refeição 3 às 16:40 (20 min antes do treino das 17:00). Separação padrão = 45 min.
  const timing = createMockN34Result();
  const m3 = timing.meals.find(m => m.mealId === 'meal_3');
  m3.scheduledTime = '16:40';
  m3.scheduledMinutes = 1000;

  const input = { context: createMockContext(), mealTimingResult: timing };
  const res = analyzeNutrientTiming(input);

  assert.strictEqual(res.status, NUTRIENT_TIMING_STATUS.WARNING);
  const m3Res = res.meals.find(m => m.mealId === 'meal_3');
  assert.ok(m3Res.secondaryRelations.includes(TEMPORAL_SECONDARY_RELATION.CLOSE_EVENT_PROXIMITY));
  assert.ok(res.warnings.some(w => w.includes('menor que a separação operacional')));
});

test('6.3 preferredMealEventSeparationMinutes atendido não emite aviso de proximidade', () => {
  // Refeição 3 às 15:30 (90 min antes do treino). Separação = 45 min -> OK!
  const input = { context: createMockContext(), mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  const m3Res = res.meals.find(m => m.mealId === 'meal_3');
  assert.strictEqual(m3Res.secondaryRelations.includes(TEMPORAL_SECONDARY_RELATION.CLOSE_EVENT_PROXIMITY), false);
});

test('6.4 preferredCardioSleepSeparationMinutes emite WARNING quando cardio for muito próximo ao sono', () => {
  // Cardio das 20:00 às 21:00 (1200 - 1260 min) e sono às 22:30 (1350 min) -> Distância = 90 min (< 120 min)
  const ctx = createMockContext({
    routine: { bedTime: '22:30', wakeUpTime: '07:00' },
    cardio: {
      hasActiveCardio: true,
      sessions: [{ cardioId: 'c_noite', startTime: '20:00', durationMinutes: 60 }]
    }
  });
  const input = { context: ctx, mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  assert.strictEqual(res.status, NUTRIENT_TIMING_STATUS.WARNING);
  assert.ok(res.warnings.some(w => w.includes('término do cardio') && w.includes('horário de sono')));
});

test('6.5 preferredCardioSleepSeparationMinutes é suprimido quando horário de sono for ausente', () => {
  const ctx = createMockContext({
    routine: { bedTime: null }, // sem horário de sono
    cardio: {
      hasActiveCardio: true,
      sessions: [{ cardioId: 'c_noite', startTime: '21:00', durationMinutes: 60 }]
    }
  });
  const input = { context: ctx, mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  // Não emite falso aviso de cardio próximo ao sono
  assert.strictEqual(res.warnings.some(w => w.includes('término do cardio') && w.includes('horário de sono')), false);
});

test('6.6 Separação não é descrita como tempo de digestão fisiológica', () => {
  const input = { context: createMockContext(), mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  // Nenhuma menção a "digestão fisiológica" ou "esvaziamento gástrico"
  const allText = JSON.stringify(res);
  assert.strictEqual(/digest[aã]o fisiol[oó]gica|esvaziamento g[aá]strico/i.test(allText), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 7: DETECÇÃO DE COLISÕES FÍSICAS (INVARIANTE N3.4 -> N3.5) (TESTES 41 A 44)
// ─────────────────────────────────────────────────────────────────────────────

test('7.1 Refeição durante o intervalo de treino resulta em OVERLAPPING_EVENT e status BLOCKED', () => {
  // Treino das 17:00 às 18:00 (1020 - 1080 min). Refeição 3 posicionada às 17:30 (1050 min).
  const timing = createMockN34Result();
  const m3 = timing.meals.find(m => m.mealId === 'meal_3');
  m3.scheduledTime = '17:30';
  m3.scheduledMinutes = 1050;

  const input = { context: createMockContext(), mealTimingResult: timing };
  const res = analyzeNutrientTiming(input);

  assert.strictEqual(res.status, NUTRIENT_TIMING_STATUS.BLOCKED);
  assert.strictEqual(res.valid, false);
  const m3Res = res.meals.find(m => m.mealId === 'meal_3');
  assert.strictEqual(m3Res.primaryRelation, TEMPORAL_PRIMARY_RELATION.OVERLAPPING_EVENT);
  assert.ok(res.blockingReasons.some(b => b.includes('colide fisicamente')));
});

test('7.2 Refeição durante o intervalo de cardio resulta em OVERLAPPING_EVENT e status BLOCKED', () => {
  // Cardio das 08:00 às 09:00 (480 - 540 min). Refeição 1 é às 08:00 (480 min).
  const ctx = createMockContext({
    cardio: {
      hasActiveCardio: true,
      sessions: [{ cardioId: 'c1', startTime: '08:00', durationMinutes: 60 }]
    }
  });
  const input = { context: ctx, mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  assert.strictEqual(res.status, NUTRIENT_TIMING_STATUS.BLOCKED);
  const m1Res = res.meals.find(m => m.mealId === 'meal_1');
  assert.strictEqual(m1Res.primaryRelation, TEMPORAL_PRIMARY_RELATION.OVERLAPPING_EVENT);
});

test('7.3 Colisão física não tenta mover ou reagendar a refeição', () => {
  const timing = createMockN34Result();
  const mealToCollide = timing.meals.find(m => m.mealId === 'meal_1');
  mealToCollide.scheduledMinutes = 1050; // Colide com treino (1020 - 1080 min)
  mealToCollide.scheduledTime = '17:30';

  const input = { context: createMockContext(), mealTimingResult: timing };
  const res = analyzeNutrientTiming(input);

  // O horário permanece 17:30, não é empurrado nem alterado
  const mCollided = res.meals.find(m => m.mealId === 'meal_1');
  assert.strictEqual(mCollided.scheduledMinutes, 1050);
  assert.strictEqual(mCollided.scheduledTime, '17:30');
});

test('7.4 Registro de conflito estruturado EVENT_COLLISION nos bloqueios', () => {
  const timing = createMockN34Result();
  timing.meals[0].scheduledMinutes = 1050;
  timing.meals[0].scheduledTime = '17:30';

  const input = { context: createMockContext(), mealTimingResult: timing };
  const res = analyzeNutrientTiming(input);

  assert.ok(res.conflicts.some(c => c.type === 'EVENT_COLLISION' && c.severity === 'BLOCK'));
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 8: RELAÇÕES NÃO-MUTUAMENTE EXCLUSIVAS (TESTES 45 A 48)
// ─────────────────────────────────────────────────────────────────────────────

test('8.1 Refeição possui simultaneamente primaryRelation PRE_TRAINING e secondaryRelations [FASTING_CONSTRAINED]', () => {
  // Refeição às 12:00 (abertura de jejum às 12:00, e treino às 13:30 = 90 min depois)
  const timing = createMockN34Result({
    eatingWindow: { start: '12:00', startMinutes: 720, end: '20:00', endMinutes: 1200, durationMinutes: 480, strength: 'HARD', source: 'FASTING_PROTOCOL' }
  });
  const ctx = createMockContext({
    training: { hasActiveTraining: true, workoutTime: '13:30', sessionDurationMinutes: 60 }
  });
  // meal_2 é às 12:00 (720 min), treino às 13:30 (810 min) -> 90 min antes
  const input = { context: ctx, mealTimingResult: timing };
  const res = analyzeNutrientTiming(input);

  const m2 = res.meals.find(m => m.mealId === 'meal_2');
  assert.strictEqual(m2.primaryRelation, TEMPORAL_PRIMARY_RELATION.PRE_TRAINING);
  assert.ok(m2.secondaryRelations.includes(TEMPORAL_SECONDARY_RELATION.FASTING_CONSTRAINED));
});

test('8.2 Refeição possui simultaneamente primaryRelation POST_TRAINING e secondaryRelations [CLOSE_EVENT_PROXIMITY]', () => {
  // Treino termina às 18:00 (1080 min). Refeição 4 às 18:20 (1100 min, 20 min depois).
  const timing = createMockN34Result();
  const m4 = timing.meals.find(m => m.mealId === 'meal_4');
  m4.scheduledTime = '18:20';
  m4.scheduledMinutes = 1100;

  const input = { context: createMockContext(), mealTimingResult: timing };
  const res = analyzeNutrientTiming(input);

  const m4Res = res.meals.find(m => m.mealId === 'meal_4');
  assert.strictEqual(m4Res.primaryRelation, TEMPORAL_PRIMARY_RELATION.POST_TRAINING);
  assert.ok(m4Res.secondaryRelations.includes(TEMPORAL_SECONDARY_RELATION.CLOSE_EVENT_PROXIMITY));
});

test('8.3 Inexistência de estados combinatórios artificiais na taxonomia primária', () => {
  const allowedPrimary = Object.values(TEMPORAL_PRIMARY_RELATION);
  const input = { context: createMockContext(), mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  res.meals.forEach(m => {
    assert.ok(allowedPrimary.includes(m.primaryRelation), `Relação primária inválida: ${m.primaryRelation}`);
    assert.strictEqual(m.primaryRelation.includes('_FASTING'), false, 'Proibido estado combinatório artificial');
  });
});

test('8.4 Array de secondaryRelations não contém elementos duplicados', () => {
  const input = { context: createMockContext(), mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  res.meals.forEach(m => {
    const set = new Set(m.secondaryRelations);
    assert.strictEqual(set.size, m.secondaryRelations.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 9: CONSERVAÇÃO ABSOLUTA & IMUTABILIDADE (TESTES 49 A 56)
// ─────────────────────────────────────────────────────────────────────────────

test('9.1 Calorias totais e por refeição são 100% idênticas às da N3.4', () => {
  const timing = createMockN34Result();
  const input = { context: createMockContext(), mealTimingResult: timing };
  const res = analyzeNutrientTiming(input);

  assert.strictEqual(res.globalTotals.calories, timing.globalTotals.calories);
  for (let i = 0; i < timing.meals.length; i++) {
    assert.strictEqual(res.meals[i].totals.calories, timing.meals[i].totals.calories);
  }
});

test('9.2 Proteínas totais e por refeição são 100% idênticas às da N3.4', () => {
  const timing = createMockN34Result();
  const input = { context: createMockContext(), mealTimingResult: timing };
  const res = analyzeNutrientTiming(input);

  assert.strictEqual(res.globalTotals.protein, timing.globalTotals.protein);
  for (let i = 0; i < timing.meals.length; i++) {
    assert.strictEqual(res.meals[i].totals.protein, timing.meals[i].totals.protein);
  }
});

test('9.3 Carboidratos totais e por refeição são 100% idênticos aos da N3.4', () => {
  const timing = createMockN34Result();
  const input = { context: createMockContext(), mealTimingResult: timing };
  const res = analyzeNutrientTiming(input);

  assert.strictEqual(res.globalTotals.carbohydrate, timing.globalTotals.carbohydrate);
  for (let i = 0; i < timing.meals.length; i++) {
    assert.strictEqual(res.meals[i].totals.carbohydrate, timing.meals[i].totals.carbohydrate);
  }
});

test('9.4 Gorduras totais e por refeição são 100% idênticas às da N3.4', () => {
  const timing = createMockN34Result();
  const input = { context: createMockContext(), mealTimingResult: timing };
  const res = analyzeNutrientTiming(input);

  assert.strictEqual(res.globalTotals.fat, timing.globalTotals.fat);
  for (let i = 0; i < timing.meals.length; i++) {
    assert.strictEqual(res.meals[i].totals.fat, timing.meals[i].totals.fat);
  }
});

test('9.5 Fibras e sódio são 100% conservados', () => {
  const timing = createMockN34Result();
  const input = { context: createMockContext(), mealTimingResult: timing };
  const res = analyzeNutrientTiming(input);

  assert.strictEqual(res.globalTotals.fiber, timing.globalTotals.fiber);
  assert.strictEqual(res.globalTotals.sodium, timing.globalTotals.sodium);
});

test('9.6 Alimentos e gramagens de cada item são 100% conservados', () => {
  const timing = createMockN34Result();
  const input = { context: createMockContext(), mealTimingResult: timing };
  const res = analyzeNutrientTiming(input);

  for (let m = 0; m < timing.meals.length; m++) {
    const srcItems = timing.meals[m].items;
    const anItems = res.meals[m].items;
    assert.strictEqual(anItems.length, srcItems.length);
    for (let it = 0; it < srcItems.length; it++) {
      assert.strictEqual(anItems[it].foodId, srcItems[it].foodId);
      assert.strictEqual(anItems[it].grams, srcItems[it].grams);
    }
  }
});

test('9.7 Horários scheduledTime e scheduledMinutes permanecem 100% intactos', () => {
  const timing = createMockN34Result();
  const input = { context: createMockContext(), mealTimingResult: timing };
  const res = analyzeNutrientTiming(input);

  for (let m = 0; m < timing.meals.length; m++) {
    assert.strictEqual(res.meals[m].scheduledTime, timing.meals[m].scheduledTime);
    assert.strictEqual(res.meals[m].scheduledMinutes, timing.meals[m].scheduledMinutes);
  }
});

test('9.8 Objeto de saída é profundamente congelado (deepFreeze)', () => {
  const input = { context: createMockContext(), mealTimingResult: createMockN34Result() };
  const res = analyzeNutrientTiming(input);

  assert.strictEqual(Object.isFrozen(res), true);
  assert.strictEqual(Object.isFrozen(res.meals), true);
  assert.strictEqual(Object.isFrozen(res.meals[0]), true);
  assert.strictEqual(Object.isFrozen(res.globalTotals), true);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUÍTE 10: DETERMINISMO, CONSISTÊNCIA DIAGNÓSTICA & PUREZA (TESTES 57 A 62)
// ─────────────────────────────────────────────────────────────────────────────

test('10.1 Determinismo estrito: 5 execuções idênticas geram deepStrictEqual idêntico', () => {
  const input = { context: createMockContext(), mealTimingResult: createMockN34Result() };
  const res1 = analyzeNutrientTiming(input);
  const res2 = analyzeNutrientTiming(input);
  const res3 = analyzeNutrientTiming(input);
  const res4 = analyzeNutrientTiming(input);
  const res5 = analyzeNutrientTiming(input);

  assert.deepStrictEqual(res1, res2);
  assert.deepStrictEqual(res2, res3);
  assert.deepStrictEqual(res3, res4);
  assert.deepStrictEqual(res4, res5);
});

test('10.2 Diagnóstico consultivo de hipertrofia emitido sem alteração de macronutrientes', () => {
  // Cenário de hipertrofia onde pós-treino tem 0g de proteína
  const timing = createMockN34Result();
  const postMeal = timing.meals.find(m => m.mealId === 'meal_4');
  postMeal.totals.protein = 0; // forçado para testar observação diagnóstica

  const input = {
    context: createMockContext({ clinicalObjective: 'Hipertrofia Muscular' }),
    mealTimingResult: timing
  };
  const res = analyzeNutrientTiming(input);

  // Diagnóstico consultivo deve ser registrado
  assert.ok(res.globalDiagnostics.some(d => d.includes('Observação consultiva de nutrient timing')));
  // Proteína continua rigorosamente 0g (sem rebalanceamento mágico)
  assert.strictEqual(res.meals.find(m => m.mealId === 'meal_4').totals.protein, 0);
});

test('10.3 Pureza estática: arquivos de domínio timing não possuem termos proibidos de infraestrutura', () => {
  const dir = path.join(__dirname, '..', 'domain', 'timing');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

  const forbiddenTokens = [
    'CANONICAL_DIET_FOODS',
    'Math.random',
    'Date.now',
    'Gemini',
    'Dexie',
    'firebase',
    'foodsData'
  ];

  for (const f of files) {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const token of forbiddenTokens) {
      assert.strictEqual(
        content.includes(token),
        false,
        `Token proibido "${token}" encontrado no arquivo ${f}`
      );
    }
  }
});

test('10.4 Ausência de termos proibidos de prescrição ativa no motor N3.5', () => {
  const motorPath = path.join(__dirname, '..', 'domain', 'timing', 'nutrientTiming.js');
  const content = fs.readFileSync(motorPath, 'utf8');

  const forbiddenPrescriptionTerms = [
    'rebalance',
    'modifyMacros',
    'adjustCalories',
    'selectFood'
  ];

  for (const term of forbiddenPrescriptionTerms) {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    assert.strictEqual(
      regex.test(content),
      false,
      `Termo proibido de prescrição "${term}" encontrado em nutrientTiming.js`
    );
  }
});

test('10.5 Invariância em relação à ordem das refeições de entrada', () => {
  const timing1 = createMockN34Result();
  const timing2 = createMockN34Result();
  // Inverte a ordem das refeições no array de entrada
  timing2.meals.reverse();

  const input1 = { context: createMockContext(), mealTimingResult: timing1 };
  const input2 = { context: createMockContext(), mealTimingResult: timing2 };

  const res1 = analyzeNutrientTiming(input1);
  const res2 = analyzeNutrientTiming(input2);

  // A ordenação determinística interna garante resultados idênticos
  assert.deepStrictEqual(res1.meals, res2.meals);
  assert.strictEqual(res1.status, res2.status);
});

test('10.6 Validador validateNutrientTiming rejeita mutações de macros ou horários', () => {
  const timing = createMockN34Result();
  const input = { context: createMockContext(), mealTimingResult: timing };
  const res = analyzeNutrientTiming(input);

  // Cria clone mutado violando calorias
  const mutated = JSON.parse(JSON.stringify(res));
  mutated.meals[0].totals.calories += 50;

  const val = validateNutrientTiming(mutated, timing);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors.some(e => e.includes('alterado')));
});
