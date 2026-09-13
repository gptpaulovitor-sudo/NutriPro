/**
 * tests/meal-timing-n34.test.js
 * 
 * Suíte de Testes Automatizados — Fase N3.4: Meal Timing / Distribuição Temporal Determinística.
 * NutriAx Pro.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const MealTimingContract = require('../domain/contracts/MealTimingContract');
const {
  TIMING_STATUS,
  WINDOW_STRENGTH,
  TEMPORAL_STATUS,
  TIMING_SOURCES,
  validateMealTimingInput,
  validateMealTimingOutput
} = MealTimingContract;

const timingSubsystem = require('../domain/timing/index');
const {
  DEFAULT_MEAL_TIMING_POLICY,
  timeStringToMinutes,
  minutesToTimeString,
  resolveEatingWindow,
  extractTemporalEvents,
  validateMealTiming,
  scheduleMeals
} = timingSubsystem;

// Mock canônico de resultado da Fase N3.3 (Meal Assembly)
function createMockN33Result(overrides = {}) {
  const defaultMeals = [
    {
      mealId: 'meal_1',
      mealName: 'Refeição 1',
      mealIndex: 0,
      mealRole: 'PRIMARY',
      items: [
        {
          foodId: 'FOOD_P1',
          foodName: 'Peito de Frango',
          grams: 100,
          unit: 'g',
          nutrients: { calories: 159, protein: 32, carbohydrate: 0, lipid: 2.5, fiber: 0, sodium: 70 },
          sourceMealSolution: 'N3.2_GLOBAL',
          allocationRatio: 0.5
        },
        {
          foodId: 'FOOD_C1',
          foodName: 'Arroz Branco',
          grams: 150,
          unit: 'g',
          nutrients: { calories: 192, protein: 3.75, carbohydrate: 42, lipid: 0.3, fiber: 2.25, sodium: 5 },
          sourceMealSolution: 'N3.2_GLOBAL',
          allocationRatio: 0.5
        }
      ],
      totals: { calories: 351, protein: 35.75, carbohydrate: 42, fat: 2.8, fiber: 2.25, sodium: 75 }
    },
    {
      mealId: 'meal_2',
      mealName: 'Refeição 2',
      mealIndex: 1,
      mealRole: 'PRIMARY',
      items: [
        {
          foodId: 'FOOD_P1',
          foodName: 'Peito de Frango',
          grams: 100,
          unit: 'g',
          nutrients: { calories: 159, protein: 32, carbohydrate: 0, lipid: 2.5, fiber: 0, sodium: 70 },
          sourceMealSolution: 'N3.2_GLOBAL',
          allocationRatio: 0.5
        },
        {
          foodId: 'FOOD_C1',
          foodName: 'Arroz Branco',
          grams: 150,
          unit: 'g',
          nutrients: { calories: 192, protein: 3.75, carbohydrate: 42, lipid: 0.3, fiber: 2.25, sodium: 5 },
          sourceMealSolution: 'N3.2_GLOBAL',
          allocationRatio: 0.5
        }
      ],
      totals: { calories: 351, protein: 35.75, carbohydrate: 42, fat: 2.8, fiber: 2.25, sodium: 75 }
    },
    {
      mealId: 'meal_3',
      mealName: 'Refeição 3',
      mealIndex: 2,
      mealRole: 'SECONDARY',
      items: [
        {
          foodId: 'FOOD_F1',
          foodName: 'Banana Prata',
          grams: 100,
          unit: 'g',
          nutrients: { calories: 98, protein: 1.3, carbohydrate: 26, lipid: 0.1, fiber: 2, sodium: 1 },
          sourceMealSolution: 'N3.2_GLOBAL',
          allocationRatio: 1.0
        }
      ],
      totals: { calories: 98, protein: 1.3, carbohydrate: 26, fat: 0.1, fiber: 2, sodium: 1 }
    }
  ];

  const meals = overrides.meals || defaultMeals;

  const totalCal = meals.reduce((acc, m) => acc + m.totals.calories, 0);
  const totalProt = meals.reduce((acc, m) => acc + m.totals.protein, 0);
  const totalCarb = meals.reduce((acc, m) => acc + m.totals.carbohydrate, 0);
  const totalFat = meals.reduce((acc, m) => acc + m.totals.fat, 0);
  const totalFib = meals.reduce((acc, m) => acc + m.totals.fiber, 0);

  return {
    assemblyVersion: 'N3.3.0',
    solverVersion: 'N3.2.0',
    status: overrides.status || 'PASS',
    valid: overrides.valid !== undefined ? overrides.valid : true,
    meals,
    globalTotals: {
      calories: totalCal,
      protein: totalProt,
      carbohydrate: totalCarb,
      fat: totalFat,
      fiber: totalFib,
      sodium: 151
    },
    diagnostics: ['Meal assembly validado'],
    warnings: overrides.warnings || [],
    blockingReasons: []
  };
}

function createMockTimingInput(overrides = {}) {
  return {
    context: overrides.context !== undefined ? overrides.context : {
      schemaVersion: '1.0.0',
      patient: {
        patientId: 'patient_test_timing',
        name: 'Paciente Timing',
        routine: {
          wakeUpTime: overrides.wakeUpTime !== undefined ? overrides.wakeUpTime : '06:30',
          bedTime: overrides.bedTime !== undefined ? overrides.bedTime : '22:30'
        }
      },
      routine: {
        wakeUpTime: overrides.wakeUpTime !== undefined ? overrides.wakeUpTime : '06:30',
        bedTime: overrides.bedTime !== undefined ? overrides.bedTime : '22:30'
      }
    },
    mealAssemblyResult: overrides.mealAssemblyResult !== undefined ? overrides.mealAssemblyResult : createMockN33Result(),
    trainingContext: overrides.trainingContext !== undefined ? overrides.trainingContext : null,
    cardioContext: overrides.cardioContext !== undefined ? overrides.cardioContext : null,
    fastingContext: overrides.fastingContext !== undefined ? overrides.fastingContext : null
  };
}

// ============================================================================
// GRUPO A: Contratos e Portões de Entrada
// ============================================================================
test('Fase N3.4 — Grupo A: Contratos e Portões de Entrada', async (t) => {

  await t.test('1. Input nulo ou não-objeto resulta em status BLOCKED', () => {
    const res = scheduleMeals(null);
    assert.strictEqual(res.status, TIMING_STATUS.BLOCKED);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.meals.length, 0);
  });

  await t.test('2. Input sem context resulta em status BLOCKED', () => {
    const input = createMockTimingInput({ context: null });
    const res = scheduleMeals(input);
    assert.strictEqual(res.status, TIMING_STATUS.BLOCKED);
    assert.strictEqual(res.valid, false);
  });

  await t.test('3. mealAssemblyResult ausente bloqueia com status BLOCKED', () => {
    const input = createMockTimingInput({ mealAssemblyResult: null });
    const res = scheduleMeals(input);
    assert.strictEqual(res.status, TIMING_STATUS.BLOCKED);
    assert.strictEqual(res.valid, false);
  });

  await t.test('4. mealAssemblyResult com status BLOCKED bloqueia a execução com BLOCKED', () => {
    const input = createMockTimingInput({
      mealAssemblyResult: { status: 'BLOCKED', valid: false, meals: [] }
    });
    const res = scheduleMeals(input);
    assert.strictEqual(res.status, TIMING_STATUS.BLOCKED);
    assert.strictEqual(res.valid, false);
  });

  await t.test('5. mealAssemblyResult com valid !== true bloqueia a execução', () => {
    const input = createMockTimingInput({
      mealAssemblyResult: createMockN33Result({ valid: false })
    });
    const res = scheduleMeals(input);
    assert.strictEqual(res.status, TIMING_STATUS.BLOCKED);
    assert.strictEqual(res.valid, false);
  });

  await t.test('6. mealAssemblyResult com status PASS e rotina válida gera status PASS', () => {
    const input = createMockTimingInput({ wakeUpTime: '07:30', bedTime: '18:30' });
    const res = scheduleMeals(input);
    assert.strictEqual(res.status, TIMING_STATUS.PASS);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.meals.length, 3);
  });

  await t.test('7. mealAssemblyResult com status WARNING propaga WARNING para a saída', () => {
    const input = createMockTimingInput({
      mealAssemblyResult: createMockN33Result({
        status: 'WARNING',
        warnings: ['Alerta de fallback de assembly']
      })
    });
    const res = scheduleMeals(input);
    assert.strictEqual(res.status, TIMING_STATUS.WARNING);
    assert.strictEqual(res.valid, true);
    assert.ok(res.warnings.some(w => w.includes('Alerta de fallback de assembly')));
  });

});

// ============================================================================
// GRUPO B: Rotina do Paciente
// ============================================================================
test('Fase N3.4 — Grupo B: Rotina do Paciente', async (t) => {

  await t.test('8. Rotina estruturada com wakeUpTime e bedTime define a janela preferencial', () => {
    const input = createMockTimingInput({ wakeUpTime: '06:00', bedTime: '22:00' });
    const res = scheduleMeals(input);
    assert.strictEqual(res.valid, true);
    // wakeUp 06:00 (360) + offset 30 = 390 (06:30)
    // bedTime 22:00 (1320) - buffer 90 = 1230 (20:30)
    assert.strictEqual(res.eatingWindow.start, '06:30');
    assert.strictEqual(res.eatingWindow.end, '20:30');
    assert.strictEqual(res.eatingWindow.strength, WINDOW_STRENGTH.PREFERRED);
  });

  await t.test('9. Ausência de horários de rotina adota fallback de política (07:00 / 22:30)', () => {
    const input = createMockTimingInput({ wakeUpTime: null, bedTime: null });
    input.context.patient.routine = {};
    input.context.routine = {};

    const res = scheduleMeals(input);
    assert.strictEqual(res.valid, true);
    // defaultWakeTime 07:00 (420) + 30 = 450 (07:30)
    // defaultSleepTime 22:30 (1350) - 90 = 1260 (21:00)
    assert.strictEqual(res.eatingWindow.start, '07:30');
    assert.strictEqual(res.eatingWindow.end, '21:00');
    assert.strictEqual(res.eatingWindow.source, TIMING_SOURCES.POLICY_FALLBACK);
  });

  await t.test('10. Ausência de rotina estruturada gera WARNING explícito de fallback operacional', () => {
    const input = createMockTimingInput({ wakeUpTime: null, bedTime: null });
    input.context.patient.routine = {};
    input.context.routine = {};

    const res = scheduleMeals(input);
    assert.strictEqual(res.status, TIMING_STATUS.WARNING);
    assert.ok(res.warnings.some(w => w.includes('fallback operacional')));
  });

  await t.test('11. Observações em texto livre no contexto NÃO são interpretadas como horários', () => {
    const input = createMockTimingInput({ wakeUpTime: '07:00', bedTime: '23:00' });
    input.context.patient.notes = 'acorda às 04:00 da manhã para meditar e dorme às 18:00';

    const res = scheduleMeals(input);
    // Não deve ler o texto livre; deve usar o estruturado 07:00 / 23:00
    assert.strictEqual(res.eatingWindow.start, '07:30');
    assert.strictEqual(res.eatingWindow.end, '21:30');
  });

});

// ============================================================================
// GRUPO C: Janela Alimentar (Eating Window)
// ============================================================================
test('Fase N3.4 — Grupo C: Janela Alimentar', async (t) => {

  await t.test('12. Cálculo exato de startMinutes, endMinutes e durationMinutes', () => {
    const window = resolveEatingWindow({
      routine: { wakeUpTime: '08:00', bedTime: '22:00' }
    });
    // start: 08:00 (480) + 30 = 510 (08:30)
    // end: 22:00 (1320) - 90 = 1230 (20:30)
    // duration: 1230 - 510 = 720 min (12 horas)
    assert.strictEqual(window.startMinutes, 510);
    assert.strictEqual(window.endMinutes, 1230);
    assert.strictEqual(window.durationMinutes, 720);
    assert.strictEqual(window.start, '08:30');
    assert.strictEqual(window.end, '20:30');
  });

  await t.test('13. eatingWindow.strength é PREFERRED quando derivado de rotina de sono/vigília', () => {
    const window = resolveEatingWindow({
      routine: { wakeUpTime: '07:00', bedTime: '23:00' }
    });
    assert.strictEqual(window.strength, WINDOW_STRENGTH.PREFERRED);
  });

  await t.test('14. eatingWindow.strength é HARD quando derivado de protocolo de jejum ativo', () => {
    const fasting = {
      hasActiveProtocol: true,
      status: 'ACTIVE',
      feedingWindows: [{ start: '12:00', end: '20:00' }]
    };
    const window = resolveEatingWindow({}, fasting);
    assert.strictEqual(window.strength, WINDOW_STRENGTH.HARD);
    assert.strictEqual(window.start, '12:00');
    assert.strictEqual(window.end, '20:00');
    assert.strictEqual(window.source, TIMING_SOURCES.FASTING_PROTOCOL);
  });

  await t.test('15. eatingWindow.strength é HARD quando derivado de restrição formal de contexto', () => {
    const ctx = {
      constraints: {
        availableEatingWindow: { start: '10:00', end: '18:00' }
      }
    };
    const window = resolveEatingWindow(ctx);
    assert.strictEqual(window.strength, WINDOW_STRENGTH.HARD);
    assert.strictEqual(window.start, '10:00');
    assert.strictEqual(window.end, '18:00');
  });

  await t.test('16. Utilitários timeStringToMinutes e minutesToTimeString são estritamente bidirecionais', () => {
    const times = ['00:00', '07:30', '12:00', '18:45', '23:59'];
    times.forEach(tStr => {
      const min = timeStringToMinutes(tStr);
      assert.ok(min !== null);
      const backStr = minutesToTimeString(min);
      assert.strictEqual(backStr, tStr);
    });
  });

});

// ============================================================================
// GRUPO D: Distribuição Temporal e Intervalos
// ============================================================================
test('Fase N3.4 — Grupo D: Distribuição Temporal e Intervalos', async (t) => {

  await t.test('17. Distribuição de 1 refeição é posicionada no meio da janela', () => {
    const singleMealResult = createMockN33Result({
      meals: [createMockN33Result().meals[0]]
    });
    const input = createMockTimingInput({
      wakeUpTime: '08:00',
      bedTime: '20:00',
      mealAssemblyResult: singleMealResult
    });
    const res = scheduleMeals(input);
    assert.strictEqual(res.meals.length, 1);
    // Janela: 08:30 (510) a 18:30 (1110), meio: 510 + 300 = 810 (13:30)
    assert.strictEqual(res.meals[0].scheduledTime, '13:30');
    assert.strictEqual(res.meals[0].intervalToNextMinutes, null);
  });

  await t.test('18. Distribuição de 2 refeições posiciona nos extremos da janela alimentar', () => {
    const twoMealsResult = createMockN33Result({
      meals: [createMockN33Result().meals[0], createMockN33Result().meals[1]]
    });
    const input = createMockTimingInput({
      wakeUpTime: '07:00',
      bedTime: '22:00',
      mealAssemblyResult: twoMealsResult
    });
    const res = scheduleMeals(input);
    assert.strictEqual(res.meals.length, 2);
    // Janela: 07:30 a 20:30
    assert.strictEqual(res.meals[0].scheduledTime, '07:30');
    assert.strictEqual(res.meals[1].scheduledTime, '20:30');
    assert.strictEqual(res.meals[0].intervalToNextMinutes, 780);
    assert.strictEqual(res.meals[1].intervalToNextMinutes, null);
  });

  await t.test('19. Distribuição de 3 a 5 refeições possui ordenação temporal estritamente crescente', () => {
    [3, 4, 5].forEach(count => {
      const mealsList = [];
      for (let i = 0; i < count; i++) {
        mealsList.push({
          mealId: `meal_${i + 1}`,
          mealName: `Refeição ${i + 1}`,
          mealIndex: i,
          mealRole: 'PRIMARY',
          items: [{ foodId: 'FOOD_P1', grams: 50, unit: 'g', nutrients: { calories: 80 } }],
          totals: { calories: 80, protein: 10, carbohydrate: 0, fat: 1, fiber: 0 }
        });
      }
      const input = createMockTimingInput({
        mealAssemblyResult: createMockN33Result({ meals: mealsList })
      });
      const res = scheduleMeals(input);
      for (let i = 1; i < res.meals.length; i++) {
        assert.ok(res.meals[i].scheduledMinutes > res.meals[i - 1].scheduledMinutes);
      }
    });
  });

  await t.test('20. scheduledMinutes é coerente com scheduledTime para todas as refeições', () => {
    const input = createMockTimingInput();
    const res = scheduleMeals(input);
    res.meals.forEach(m => {
      assert.strictEqual(minutesToTimeString(m.scheduledMinutes), m.scheduledTime);
    });
  });

  await t.test('21. intervalToNextMinutes é estritamente positivo para intermediárias e null para a última', () => {
    const input = createMockTimingInput();
    const res = scheduleMeals(input);
    assert.ok(res.meals[0].intervalToNextMinutes > 0);
    assert.ok(res.meals[1].intervalToNextMinutes > 0);
    assert.strictEqual(res.meals[2].intervalToNextMinutes, null);
  });

  await t.test('22. typicalMealTimes estruturado no dietaryRecall é respeitado quando compatível', () => {
    const input = createMockTimingInput();
    input.context.dietaryRecall = {
      typicalMealTimes: ['08:00', '13:00', '19:30']
    };
    const res = scheduleMeals(input);
    assert.strictEqual(res.meals[0].scheduledTime, '08:00');
    assert.strictEqual(res.meals[1].scheduledTime, '13:00');
    assert.strictEqual(res.meals[2].scheduledTime, '19:30');
    assert.strictEqual(res.meals[0].timingSource, TIMING_SOURCES.STRUCTURED_ROUTINE);
  });

});

// ============================================================================
// GRUPO E: Treinamento como Evento Temporal
// ============================================================================
test('Fase N3.4 — Grupo E: Treinamento como Evento Temporal', async (t) => {

  await t.test('23. Treino estruturado é extraído corretamente como evento temporal (TRAINING)', () => {
    const input = createMockTimingInput({
      trainingContext: {
        workoutTime: '17:00',
        sessionDurationMinutes: 60
      }
    });
    const res = scheduleMeals(input);
    const trainEvent = res.temporalEvents.find(e => e.eventType === 'TRAINING');
    assert.ok(trainEvent);
    assert.strictEqual(trainEvent.start, '17:00');
    assert.strictEqual(trainEvent.end, '18:00');
    assert.strictEqual(trainEvent.durationMinutes, 60);
  });

  await t.test('24. Nenhuma refeição é agendada durante a sessão física de treino', () => {
    const input = createMockTimingInput({
      trainingContext: {
        workoutTime: '13:30',
        sessionDurationMinutes: 60
      }
    });
    const res = scheduleMeals(input);
    // Treino: 13:30 a 14:30 (810 a 870 min)
    res.meals.forEach(m => {
      const isDuringWorkout = m.scheduledMinutes >= 810 && m.scheduledMinutes <= 870;
      assert.strictEqual(isDuringWorkout, false, `Refeição '${m.mealId}' colidiu com o treino`);
    });
  });

  await t.test('25. Refeição pré-evento ou pós-evento recebe timingReason explícito', () => {
    const input = createMockTimingInput({
      trainingContext: {
        workoutTime: '14:00',
        sessionDurationMinutes: 60
      }
    });
    const res = scheduleMeals(input);
    const hasBufferReason = res.meals.some(m => m.timingReason && m.timingReason.includes('TRAINING_BUFFER'));
    assert.ok(hasBufferReason);
  });

  await t.test('26. Treino NÃO altera calorias, GET nem macronutrientes da refeição', () => {
    const inputNoTrain = createMockTimingInput();
    const inputWithTrain = createMockTimingInput({
      trainingContext: { workoutTime: '15:00', sessionDurationMinutes: 60 }
    });

    const resNoTrain = scheduleMeals(inputNoTrain);
    const resWithTrain = scheduleMeals(inputWithTrain);

    assert.deepStrictEqual(resWithTrain.globalTotals, resNoTrain.globalTotals);
  });

  await t.test('27. Ausência de contexto de treino NÃO bloqueia o motor temporal', () => {
    const input = createMockTimingInput({ trainingContext: null });
    const res = scheduleMeals(input);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.temporalEvents.filter(e => e.eventType === 'TRAINING').length, 0);
  });

});

// ============================================================================
// GRUPO F: Cardio como Evento Temporal
// ============================================================================
test('Fase N3.4 — Grupo F: Cardio como Evento Temporal', async (t) => {

  await t.test('28. Cardio estruturado é extraído como evento temporal (CARDIO)', () => {
    const input = createMockTimingInput({
      cardioContext: {
        sessions: [{ startTime: '07:00', durationMinutes: 45 }]
      }
    });
    const res = scheduleMeals(input);
    const cardioEvent = res.temporalEvents.find(e => e.eventType === 'CARDIO');
    assert.ok(cardioEvent);
    assert.strictEqual(cardioEvent.start, '07:00');
    assert.strictEqual(cardioEvent.end, '07:45');
  });

  await t.test('29. Nenhuma refeição sobreposta à sessão física de cardio', () => {
    const input = createMockTimingInput({
      cardioContext: {
        sessions: [{ startTime: '07:30', durationMinutes: 45 }]
      }
    });
    const res = scheduleMeals(input);
    // Cardio: 07:30 a 08:15 (450 a 495 min)
    res.meals.forEach(m => {
      const isDuringCardio = m.scheduledMinutes >= 450 && m.scheduledMinutes <= 495;
      assert.strictEqual(isDuringCardio, false, `Refeição '${m.mealId}' colidiu com o cardio`);
    });
  });

  await t.test('30. Cardio NÃO altera calorias nem metas da refeição', () => {
    const input = createMockTimingInput({
      cardioContext: {
        sessions: [{ startTime: '08:00', durationMinutes: 50 }]
      }
    });
    const res = scheduleMeals(input);
    assert.strictEqual(res.globalTotals.calories, 800);
  });

  await t.test('31. Treino e cardio simultâneos no mesmo dia são respeitados sem colisão', () => {
    const input = createMockTimingInput({
      trainingContext: { workoutTime: '17:00', sessionDurationMinutes: 60 },
      cardioContext: { sessions: [{ startTime: '06:30', durationMinutes: 40 }] }
    });
    const res = scheduleMeals(input);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.temporalEvents.length, 2);
  });

});

// ============================================================================
// GRUPO G: Protocolo de Jejum Intermitente
// ============================================================================
test('Fase N3.4 — Grupo G: Protocolo de Jejum Intermitente', async (t) => {

  await t.test('32. Protocolo ativo de jejum (16:8) define feedingWindow HARD (12:00 a 20:00)', () => {
    const input = createMockTimingInput({
      fastingContext: {
        hasActiveProtocol: true,
        status: 'ACTIVE',
        feedingWindows: [{ start: '12:00', end: '20:00' }]
      }
    });
    const res = scheduleMeals(input);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.eatingWindow.strength, WINDOW_STRENGTH.HARD);
    assert.strictEqual(res.eatingWindow.start, '12:00');
    assert.strictEqual(res.eatingWindow.end, '20:00');
  });

  await t.test('33. Todas as refeições são posicionadas estritamente dentro da feedingWindow do jejum', () => {
    const input = createMockTimingInput({
      fastingContext: {
        hasActiveProtocol: true,
        status: 'ACTIVE',
        feedingWindows: [{ start: '12:00', end: '20:00' }]
      }
    });
    const res = scheduleMeals(input);
    assert.strictEqual(res.valid, true);
    // 12:00 (720) a 20:00 (1200)
    res.meals.forEach(m => {
      assert.ok(m.scheduledMinutes >= 720, `Refeição ${m.scheduledTime} antes de 12:00`);
      assert.ok(m.scheduledMinutes <= 1200, `Refeição ${m.scheduledTime} depois de 20:00`);
    });
  });

  await t.test('34. Protocolo inativo (INACTIVE) NÃO impõe restrição estrita de jejum', () => {
    const input = createMockTimingInput({
      fastingContext: {
        hasActiveProtocol: false,
        status: 'INACTIVE',
        feedingWindows: [{ start: '12:00', end: '20:00' }]
      }
    });
    const res = scheduleMeals(input);
    // Deve usar a rotina de sono/vigília preferencial, não a janela de jejum
    assert.strictEqual(res.eatingWindow.strength, WINDOW_STRENGTH.PREFERRED);
  });

  await t.test('35. N3.4 consome o estado do jejum sem duplicar nem alterar fasting-module.js', () => {
    const input = createMockTimingInput({
      fastingContext: {
        hasActiveProtocol: true,
        type: 'TRE',
        subtype: '16:8',
        feedingWindows: { start: '13:00', end: '21:00' }
      }
    });
    const res = scheduleMeals(input);
    assert.strictEqual(res.eatingWindow.start, '13:00');
    assert.strictEqual(res.eatingWindow.end, '21:00');
    assert.strictEqual(res.eatingWindow.source, TIMING_SOURCES.FASTING_PROTOCOL);
  });

});

// ============================================================================
// GRUPO H: Conflitos, Bloqueios e Tolerâncias
// ============================================================================
test('Fase N3.4 — Grupo H: Conflitos e Bloqueios', async (t) => {

  await t.test('36. Janela estrita HARD com duração menor que (M-1)*hardMinInterval gera BLOCKED', () => {
    // 3 refeições exigem pelo menos (3 - 1) * 45 = 90 min
    // Janela HARD de apenas 60 min (12:00 a 13:00):
    const input = createMockTimingInput({
      fastingContext: {
        hasActiveProtocol: true,
        status: 'ACTIVE',
        feedingWindows: [{ start: '12:00', end: '13:00' }] // 60 min
      }
    });
    const res = scheduleMeals(input);
    assert.strictEqual(res.status, TIMING_STATUS.BLOCKED);
    assert.strictEqual(res.valid, false);
    assert.ok(res.blockingReasons.some(r => r.includes('insuficiente')));
  });

  await t.test('37. Janela PREFERRED curta demais NÃO bloqueia: é expandida e emite WARNING', () => {
    // Janela preferencial curta (wakeUp 07:00 -> start 07:30, bedTime 09:30 -> end 08:00, duration 30 min < 90 min)
    const input = createMockTimingInput({ wakeUpTime: '07:00', bedTime: '09:30' });
    const res = scheduleMeals(input);
    assert.strictEqual(res.status, TIMING_STATUS.WARNING);
    assert.strictEqual(res.valid, true);
    assert.ok(res.warnings.some(w => w.includes('expandida')));
  });

  await t.test('38. Colisão insolúvel entre janela HARD e refeições resulta em BLOCKED com motivo explícito', () => {
    // 5 refeições em janela HARD de 120 min: 4 * 45 = 180 min necessários > 120 min
    const mealsList5 = [];
    for (let i = 0; i < 5; i++) {
      mealsList5.push({
        mealId: `meal_${i + 1}`,
        mealName: `Refeição ${i + 1}`,
        mealIndex: i,
        mealRole: 'PRIMARY',
        items: [{ foodId: 'FOOD_P1', grams: 40, unit: 'g', nutrients: { calories: 60 } }],
        totals: { calories: 60, protein: 10, carbohydrate: 0, fat: 1, fiber: 0 }
      });
    }
    const input = createMockTimingInput({
      mealAssemblyResult: createMockN33Result({ meals: mealsList5 }),
      fastingContext: {
        hasActiveProtocol: true,
        status: 'ACTIVE',
        feedingWindows: [{ start: '12:00', end: '14:00' }] // 120 min
      }
    });
    const res = scheduleMeals(input);
    assert.strictEqual(res.status, TIMING_STATUS.BLOCKED);
    assert.strictEqual(res.valid, false);
  });

  await t.test('39. Intervalo maior que o preferencial (300 min) emite WARNING sem bloquear a prescrição', () => {
    // 2 refeições em janela de 14 horas (intervalo de ~780 min > 300 min)
    const twoMealsResult = createMockN33Result({
      meals: [createMockN33Result().meals[0], createMockN33Result().meals[1]]
    });
    const input = createMockTimingInput({
      wakeUpTime: '06:00',
      bedTime: '23:00',
      mealAssemblyResult: twoMealsResult
    });
    const res = scheduleMeals(input);
    assert.strictEqual(res.status, TIMING_STATUS.WARNING);
    assert.strictEqual(res.valid, true);
    assert.ok(res.warnings.some(w => w.includes('maior que o preferencial')));
  });

});

// ============================================================================
// GRUPO I: Conservação Integral e Identidade
// ============================================================================
test('Fase N3.4 — Grupo I: Conservação Integral e Identidade', async (t) => {

  await t.test('40. mealId, mealIndex, mealName e mealRole são rigorosamente preservados', () => {
    const input = createMockTimingInput();
    const res = scheduleMeals(input);
    assert.strictEqual(res.meals[0].mealId, 'meal_1');
    assert.strictEqual(res.meals[0].mealIndex, 0);
    assert.strictEqual(res.meals[0].mealName, 'Refeição 1');
    assert.strictEqual(res.meals[0].mealRole, 'PRIMARY');

    assert.strictEqual(res.meals[1].mealId, 'meal_2');
    assert.strictEqual(res.meals[1].mealIndex, 1);

    assert.strictEqual(res.meals[2].mealId, 'meal_3');
    assert.strictEqual(res.meals[2].mealIndex, 2);
    assert.strictEqual(res.meals[2].mealRole, 'SECONDARY');
  });

  await t.test('41. Todos os alimentos e gramas em cada refeição permanecem inalterados', () => {
    const input = createMockTimingInput();
    const res = scheduleMeals(input);

    const originalM1 = input.mealAssemblyResult.meals[0];
    const scheduledM1 = res.meals[0];

    assert.strictEqual(scheduledM1.items.length, originalM1.items.length);
    assert.strictEqual(scheduledM1.items[0].foodId, originalM1.items[0].foodId);
    assert.strictEqual(scheduledM1.items[0].grams, originalM1.items[0].grams);
  });

  await t.test('42. Totais nutricionais de cada refeição permanecem idênticos aos da N3.3', () => {
    const input = createMockTimingInput();
    const res = scheduleMeals(input);

    for (let i = 0; i < res.meals.length; i++) {
      const orig = input.mealAssemblyResult.meals[i].totals;
      const sched = res.meals[i].totals;
      assert.strictEqual(sched.calories, orig.calories);
      assert.strictEqual(sched.protein, orig.protein);
      assert.strictEqual(sched.carbohydrate, orig.carbohydrate);
      assert.strictEqual(sched.fat, orig.fat);
      assert.strictEqual(sched.fiber, orig.fiber);
    }
  });

  await t.test('43. Totais nutricionais globais permanecem 100% idênticos', () => {
    const input = createMockTimingInput();
    const res = scheduleMeals(input);
    assert.deepStrictEqual(res.globalTotals, input.mealAssemblyResult.globalTotals);
  });

});

// ============================================================================
// GRUPO J: Determinismo Estrito e Imutabilidade
// ============================================================================
test('Fase N3.4 — Grupo J: Determinismo Estrito e Imutabilidade', async (t) => {

  await t.test('44. Dez execuções sucessivas com a mesma entrada produzem saída idêntica (deepStrictEqual)', () => {
    const input = createMockTimingInput({ wakeUpTime: '06:00', bedTime: '22:00' });
    const firstRun = scheduleMeals(input);

    for (let i = 0; i < 10; i++) {
      const subsequentRun = scheduleMeals(input);
      assert.deepStrictEqual(subsequentRun, firstRun);
    }
  });

  await t.test('45. Inversão do array de refeições de entrada preserva mealIndex e horários sem mutação', () => {
    const inputNormal = createMockTimingInput();
    const normalRun = scheduleMeals(inputNormal);

    // Inverte a ordem do array de refeições na entrada
    const reversedMeals = [...inputNormal.mealAssemblyResult.meals].reverse();
    const inputReversed = createMockTimingInput({
      mealAssemblyResult: createMockN33Result({ meals: reversedMeals })
    });
    const reversedRun = scheduleMeals(inputReversed);

    assert.deepStrictEqual(reversedRun, normalRun);
  });

  await t.test('46. Objeto de saída e subestruturas estão profundamente congelados (Object.isFrozen)', () => {
    const input = createMockTimingInput();
    const res = scheduleMeals(input);

    assert.ok(Object.isFrozen(res));
    assert.ok(Object.isFrozen(res.meals));
    assert.ok(Object.isFrozen(res.meals[0]));
    assert.ok(Object.isFrozen(res.eatingWindow));
    assert.ok(Object.isFrozen(res.temporalEvents));
    assert.ok(Object.isFrozen(res.provenance));
  });

  await t.test('47. DEFAULT_MEAL_TIMING_POLICY está profundamente congelada', () => {
    assert.ok(Object.isFrozen(DEFAULT_MEAL_TIMING_POLICY));
  });

});

// ============================================================================
// GRUPO K: Pureza Arquitetural e Proibições Estritas
// ============================================================================
test('Fase N3.4 — Grupo K: Pureza Arquitetural e Proibições Estritas', async (t) => {

  const timingDir = path.join(__dirname, '..', 'domain', 'timing');

  function readAllCodeInDir(dir) {
    let code = '';
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fullPath = path.join(dir, f);
      if (fs.statSync(fullPath).isFile() && f.endsWith('.js')) {
        code += fs.readFileSync(fullPath, 'utf8') + '\n';
      }
    }
    return code;
  }

  const allTimingCode = readAllCodeInDir(timingDir);

  await t.test('48. Auditoria estática: Proibição estrita de CANONICAL_DIET_FOODS', () => {
    assert.ok(!allTimingCode.includes('CANONICAL_DIET_FOODS'), 'domain/timing não pode referenciar CANONICAL_DIET_FOODS');
  });

  await t.test('49. Auditoria estática: Proibição estrita de Math.random() e Date.now()', () => {
    assert.ok(!allTimingCode.includes('Math.random'), 'domain/timing não pode usar Math.random()');
    assert.ok(!allTimingCode.includes('Date.now()'), 'domain/timing não pode usar Date.now() para lógica');
  });

  await t.test('50. Auditoria estática: Proibição estrita de window e document (DOM)', () => {
    assert.ok(!allTimingCode.includes('document.'), 'domain/timing não pode acessar DOM document');
    assert.ok(!allTimingCode.includes('window.'), 'domain/timing não pode acessar DOM window');
  });

  await t.test('51. Auditoria estática: Proibição estrita de Gemini e IA', () => {
    assert.ok(!allTimingCode.includes('Gemini'), 'domain/timing não pode invocar Gemini');
    assert.ok(!allTimingCode.includes('generateContent'), 'domain/timing não pode invocar IA');
  });

  await t.test('52. Auditoria estática: Proibição estrita de escrita no Dexie', () => {
    assert.ok(!allTimingCode.includes('db.meals.put'), 'domain/timing não pode gravar no Dexie');
    assert.ok(!allTimingCode.includes('db.prescriptions'), 'domain/timing não pode gravar prescrições');
  });

  await t.test('53. Auditoria estática: Proibição estrita de escrita no Firebase', () => {
    assert.ok(!allTimingCode.includes('firebase'), 'domain/timing não pode interagir com Firebase');
  });

  await t.test('54. Auditoria estática: Proibição de lógica de seleção alimentar em domain/timing', () => {
    const prohibitedTerms = [
      'foodCatalog',
      'foodsData',
      'caloricTargetKcal',
      'proteinTargetG',
      'carbohydrateTargetG',
      'fatTargetG'
    ];
    prohibitedTerms.forEach(term => {
      assert.ok(!allTimingCode.includes(term), `domain/timing não pode conter o termo '${term}'.`);
    });
  });

});
