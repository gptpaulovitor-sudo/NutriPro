/**
 * tests/workout-cycle-integration.test.js
 * Teste de integração do ciclo completo de 4 semanas e renovação de mesociclo
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const WorkoutCycleModule = require('../workout-cycle-module.js');

describe('Integração Completa do Mesociclo de 4 Semanas', () => {
  test('Ciclo completo: 4 semanas de execução, avaliação final e renovação para o Ciclo 2', () => {
    const pId = 'paciente_paulo_vitor';
    const startDate = '2026-09-01';

    // 1. Criação do Ciclo 1 (PHAT - 5x/semana, 20 treinos no total)
    let cycle1 = WorkoutCycleModule.createWorkoutCycle({
      patientId: pId,
      protocolName: 'Periodização PHAT (4 Semanas)',
      split: 'PHAT',
      startDate: startDate,
      prescribedWeeklyFrequency: 5
    });

    assert.equal(cycle1.status, 'ACTIVE');
    assert.equal(cycle1.totalPrescribedWorkouts, 20);

    const history = {};

    // 2. Simula Semana 1 (Dias 1 a 5)
    for (let d = 1; d <= 5; d++) {
      const dayIso = `2026-09-0${d}`;
      history[dayIso] = { workoutDone: true, date: dayIso };
    }

    let metricsW1 = WorkoutCycleModule.calculateCycleMetrics(cycle1, history, '2026-09-07');
    assert.equal(metricsW1.currentWeek, 1);
    assert.equal(metricsW1.completedWorkoutsCount, 5);
    assert.equal(metricsW1.adherencePercent, 25);
    assert.equal(metricsW1.microcycles[0].workoutsDone, 5);
    assert.equal(metricsW1.microcycles[0].isCompleted, true);

    // 3. Simula Semana 2 (Dias 8 a 12)
    for (let d = 8; d <= 12; d++) {
      const dayIso = `2026-09-${String(d).padStart(2, '0')}`;
      history[dayIso] = { workoutDone: true, date: dayIso };
    }

    let metricsW2 = WorkoutCycleModule.calculateCycleMetrics(cycle1, history, '2026-09-14');
    assert.equal(metricsW2.currentWeek, 2);
    assert.equal(metricsW2.completedWorkoutsCount, 10);
    assert.equal(metricsW2.adherencePercent, 50);

    // 4. Simula Semana 3 (Dias 15 a 18 - 4 treinos realizados, 1 descanso extra)
    for (let d = 15; d <= 18; d++) {
      const dayIso = `2026-09-${String(d).padStart(2, '0')}`;
      history[dayIso] = { workoutDone: true, date: dayIso };
    }

    let metricsW3 = WorkoutCycleModule.calculateCycleMetrics(cycle1, history, '2026-09-21');
    assert.equal(metricsW3.currentWeek, 3);
    assert.equal(metricsW3.completedWorkoutsCount, 14);
    assert.equal(metricsW3.adherencePercent, 70);

    // 5. Simula Semana 4 (Dias 22 a 26 - 5 treinos realizados)
    for (let d = 22; d <= 26; d++) {
      const dayIso = `2026-09-${String(d).padStart(2, '0')}`;
      history[dayIso] = { workoutDone: true, date: dayIso };
    }

    // Fim da Semana 4 (Dia 28 do ciclo: 2026-09-29)
    let metricsW4 = WorkoutCycleModule.calculateCycleMetrics(cycle1, history, '2026-09-29');
    assert.equal(metricsW4.completedWorkoutsCount, 19);
    assert.equal(metricsW4.adherencePercent, 95);
    assert.equal(metricsW4.isTimeExpired, true);
    assert.equal(metricsW4.shouldPromptEvaluation, true);
    assert.equal(metricsW4.status, 'NEEDS_EVALUATION');

    // 6. Paciente preenche check-in de avaliação de fechamento
    const evaluation = {
      rpeScore: 8,
      loadProgression: 'aumentou',
      jointDiscomfort: ['nenhum'],
      splitPreference: 'manter',
      patientNotes: 'Excelente ciclo! Ganho de força no supino e agachamento.',
      adherencePercent: metricsW4.adherencePercent,
      completedWorkoutsCount: metricsW4.completedWorkoutsCount
    };

    cycle1 = WorkoutCycleModule.completeCycleEvaluation(cycle1, evaluation);
    assert.equal(cycle1.status, 'COMPLETED');
    assert.ok(cycle1.evaluation);
    assert.equal(cycle1.evaluation.rpeScore, 8);
    assert.equal(cycle1.evaluation.loadProgression, 'aumentou');

    // 7. Simula arquivamento e geração do Ciclo 2 pelo treinador/IA no Pilar 4
    const pastCycles = [cycle1];

    const cycle2 = WorkoutCycleModule.createWorkoutCycle({
      patientId: pId,
      protocolName: 'Periodização PHAT — Ciclo 2 (Intensificação)',
      split: 'PHAT',
      startDate: '2026-09-30',
      prescribedWeeklyFrequency: 5
    });

    assert.equal(cycle2.status, 'ACTIVE');
    assert.equal(cycle2.startDate, '2026-09-30');
    assert.equal(pastCycles.length, 1);
    assert.equal(pastCycles[0].status, 'COMPLETED');

    // Verifica que o novo ciclo zera o contador temporal e de treinos
    const metricsC2 = WorkoutCycleModule.calculateCycleMetrics(cycle2, history, '2026-09-30');
    assert.equal(metricsC2.daysElapsed, 0);
    assert.equal(metricsC2.currentWeek, 1);
    assert.equal(metricsC2.completedWorkoutsCount, 0); // Treinos do ciclo 1 não contam no ciclo 2
    assert.equal(metricsC2.adherencePercent, 0);
    assert.equal(metricsC2.status, 'ACTIVE');
  });
});
