/**
 * tests/workout-cycle.test.js
 * Testes unitários do motor de ciclos de 4 semanas (Mesociclos)
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const WorkoutCycleModule = require('../workout-cycle-module.js');

describe('Workout Cycle Module (Mesociclo de 4 Semanas)', () => {
  const startDate = '2026-09-01';

  test('Criação do ciclo canônico com valores padrão', () => {
    const cycle = WorkoutCycleModule.createWorkoutCycle({
      patientId: 'p123',
      protocolName: 'PHAT Hipertrofia',
      split: 'PHAT',
      startDate: startDate,
      prescribedWeeklyFrequency: 5
    });

    assert.equal(cycle.durationWeeks, 4);
    assert.equal(cycle.durationDays, 28);
    assert.equal(cycle.startDate, '2026-09-01');
    assert.equal(cycle.endDate, '2026-09-28');
    assert.equal(cycle.totalPrescribedWorkouts, 20);
    assert.equal(cycle.microcycles.length, 4);
    assert.equal(cycle.status, 'ACTIVE');
    assert.equal(cycle.evaluation, null);
  });

  test('Cálculo de métricas na Semana 1 (Dia 3)', () => {
    const cycle = WorkoutCycleModule.createWorkoutCycle({
      startDate: '2026-09-01',
      prescribedWeeklyFrequency: 5
    });

    // Simula 2 treinos realizados nos 3 primeiros dias
    const history = {
      '2026-09-01': { workoutDone: true },
      '2026-09-02': { workoutDone: true },
      '2026-09-03': { workoutDone: false }
    };

    const metrics = WorkoutCycleModule.calculateCycleMetrics(cycle, history, '2026-09-03');

    assert.equal(metrics.daysElapsed, 2);
    assert.equal(metrics.daysRemaining, 26);
    assert.equal(metrics.currentWeek, 1);
    assert.equal(metrics.completedWorkoutsCount, 2);
    assert.equal(metrics.totalPrescribedWorkouts, 20);
    assert.equal(metrics.adherencePercent, 10); // 2/20 = 10%
    assert.equal(metrics.status, 'ACTIVE');
    assert.equal(metrics.shouldPromptEvaluation, false);
  });

  test('Cálculo de métricas na Semana 3 (Dia 16)', () => {
    const cycle = WorkoutCycleModule.createWorkoutCycle({
      startDate: '2026-09-01',
      prescribedWeeklyFrequency: 5
    });

    // 10 treinos realizados até o dia 16
    const history = {};
    for (let i = 1; i <= 10; i++) {
      const dayStr = String(i).padStart(2, '0');
      history[`2026-09-${dayStr}`] = { workoutDone: true };
    }

    const metrics = WorkoutCycleModule.calculateCycleMetrics(cycle, history, '2026-09-17');

    assert.equal(metrics.daysElapsed, 16);
    assert.equal(metrics.daysRemaining, 12);
    assert.equal(metrics.currentWeek, 3);
    assert.equal(metrics.completedWorkoutsCount, 10);
    assert.equal(metrics.adherencePercent, 50); // 10/20 = 50%
    assert.equal(metrics.status, 'ACTIVE');
  });

  test('Transição para NEEDS_EVALUATION após 28 dias', () => {
    const cycle = WorkoutCycleModule.createWorkoutCycle({
      startDate: '2026-09-01',
      prescribedWeeklyFrequency: 5
    });

    const history = {
      '2026-09-01': { workoutDone: true },
      '2026-09-05': { workoutDone: true }
    };

    // Dia 29 (28 dias decorridos)
    const metrics = WorkoutCycleModule.calculateCycleMetrics(cycle, history, '2026-09-29');

    assert.equal(metrics.daysElapsed >= 28, true);
    assert.equal(metrics.daysRemaining, 0);
    assert.equal(metrics.isTimeExpired, true);
    assert.equal(metrics.shouldPromptEvaluation, true);
    assert.equal(metrics.status, 'NEEDS_EVALUATION');
  });

  test('Conclusão de avaliação do ciclo (Check-in de Fim de Ciclo)', () => {
    const cycle = WorkoutCycleModule.createWorkoutCycle({
      startDate: '2026-09-01',
      prescribedWeeklyFrequency: 5
    });

    const completed = WorkoutCycleModule.completeCycleEvaluation(cycle, {
      rpeScore: 9,
      loadProgression: 'aumentou',
      jointDiscomfort: ['nenhum'],
      splitPreference: 'manter',
      patientNotes: 'Excelente rendimento no supino e agachamento!',
      adherencePercent: 90,
      completedWorkoutsCount: 18
    });

    assert.equal(completed.status, 'COMPLETED');
    assert.ok(completed.evaluation);
    assert.equal(completed.evaluation.rpeScore, 9);
    assert.equal(completed.evaluation.loadProgression, 'aumentou');
    assert.equal(completed.evaluation.patientNotes, 'Excelente rendimento no supino e agachamento!');
    assert.ok(completed.completedAt);
  });
});
