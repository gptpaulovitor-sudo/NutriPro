const test = require('node:test');
const assert = require('node:assert/strict');
const NutriAxWorkoutCycle = require('../workout-cycle-module.js');

test('Correção: Histórico prévio de mais de 28 dias NÃO pode contaminar startDate de um novo ciclo', () => {
  // Paciente realizou treinos há 60, 45 e 30 dias atrás
  const oldHistory = {
    '2026-08-01': { done: true, workoutDone: true },
    '2026-08-15': { done: true, workoutDone: true },
    '2026-09-01': { done: true, workoutDone: true }
  };

  // Hoje (2026-10-02) foi gerado um NOVO treino e novo ciclo
  const todayIso = '2026-10-02';
  const newCycle = NutriAxWorkoutCycle.createWorkoutCycle({
    patientId: 'patient-test-1',
    split: 'PPL',
    startDate: todayIso,
    prescribedWeeklyFrequency: 5
  });

  assert.equal(newCycle.startDate, todayIso);

  // Calcula métricas no dia de início
  const metrics = NutriAxWorkoutCycle.calculateCycleMetrics(newCycle, oldHistory, todayIso);

  // ANTES da correção: effectiveStartDate virava '2026-08-01', dias decorridos viravam > 60 e Semana virava 4 (ciclo concluído)!
  // AGORA: startDate permanece '2026-10-02', Semana = 1, dias restantes = 28, treinos no ciclo = 0.
  assert.equal(metrics.currentWeek, 1, 'Novo ciclo deve iniciar na Semana 1');
  assert.equal(metrics.completedWorkoutsCount, 0, 'Treinos antigos não devem contar no novo ciclo');
  assert.equal(metrics.totalPrescribedWorkouts, 20, '5 treinos/semana x 4 semanas = 20 treinos');
  assert.equal(metrics.daysRemaining, 28, 'Devem restar 28 dias');
  assert.equal(metrics.status, 'ACTIVE', 'Status deve ser ACTIVE');
  assert.equal(metrics.adherencePercent, 0, 'Aderência deve começar em 0%');
});

test('Correção: Treino executado HOJE no novo ciclo é contabilizado corretamente', () => {
  const historyWithToday = {
    '2026-08-01': { done: true }, // passado
    '2026-10-02': { done: true, workoutDone: true } // hoje
  };

  const todayIso = '2026-10-02';
  const newCycle = NutriAxWorkoutCycle.createWorkoutCycle({
    patientId: 'patient-test-2',
    split: 'PHAT',
    startDate: todayIso,
    prescribedWeeklyFrequency: 5
  });

  const metrics = NutriAxWorkoutCycle.calculateCycleMetrics(newCycle, historyWithToday, todayIso);

  assert.equal(metrics.currentWeek, 1);
  assert.equal(metrics.completedWorkoutsCount, 1, 'Apenas o treino de hoje deve ser computado');
  assert.equal(metrics.status, 'ACTIVE');
});
