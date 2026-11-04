/**
 * tests/workout-cycle-reset-on-generation.test.js
 * Validação de reinício automático do ciclo de periodização (4 semanas)
 * ao gerar ou aprovar novo treino no nutricionista e uso de data local do celular.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const NutriAxWorkoutCycle = require('../workout-cycle-module.js');

describe('NutriAx - Reinício de Ciclo ao Gerar Novo Treino & Data Local', () => {

  test('Geração de novo treino força criação de novo ciclo com novo cycleId e status ACTIVE', () => {
    const pId = 'paciente_teste_123';
    
    // Ciclo antigo criado há 10 dias
    const oldCycle = NutriAxWorkoutCycle.createWorkoutCycle({
      patientId: pId,
      split: 'PPL',
      startDate: '2026-10-25',
      prescribedWeeklyFrequency: 5
    });

    assert.strictEqual(oldCycle.status, 'ACTIVE');
    assert.strictEqual(oldCycle.split, 'PPL');

    // Simula geração de novo treino no nutricionista (ex: mudança para UPPER_LOWER ou re-geração)
    const newCycle = NutriAxWorkoutCycle.createWorkoutCycle({
      patientId: pId,
      split: 'UPPER_LOWER',
      startDate: '2026-11-04',
      prescribedWeeklyFrequency: 4
    });

    // Garante que o novo ciclo tem ID diferente e startDate de hoje
    assert.notStrictEqual(newCycle.cycleId, oldCycle.cycleId);
    assert.strictEqual(newCycle.startDate, '2026-11-04');
    assert.strictEqual(newCycle.split, 'UPPER_LOWER');
    assert.strictEqual(newCycle.prescribedWeeklyFrequency, 4);
    assert.strictEqual(newCycle.totalPrescribedWorkouts, 16);
  });

  test('Contador de treinos do ciclo ativo reinicia para ZERO em relação a treinos do ciclo anterior', () => {
    // Histórico com 6 treinos feitos no ciclo antigo (entre 2026-10-25 e 2026-11-03)
    const history = {
      '2026-10-25': { workoutDone: true },
      '2026-10-26': { workoutDone: true },
      '2026-10-28': { workoutDone: true },
      '2026-10-29': { workoutDone: true },
      '2026-10-31': { workoutDone: true },
      '2026-11-02': { workoutDone: true },
    };

    // Novo ciclo gerado HOJE (2026-11-04)
    const newCycle = NutriAxWorkoutCycle.createWorkoutCycle({
      patientId: 'paciente_teste_123',
      split: 'PHAT',
      startDate: '2026-11-04',
      prescribedWeeklyFrequency: 5
    });

    const metrics = NutriAxWorkoutCycle.calculateCycleMetrics(newCycle, history, '2026-11-04');

    // Como o novo ciclo começou em 2026-11-04 e nenhum treino foi feito hoje ou depois:
    assert.strictEqual(metrics.completedWorkoutsCount, 0, 'Contador de treinos deve ser 0 no novo ciclo');
    assert.strictEqual(metrics.adherencePercent, 0, 'Aderência deve ser 0%');
    assert.strictEqual(metrics.currentWeek, 1, 'Deve estar na Semana 1');
  });

  test('Treino realizado no dia atual do celular entra na contagem do novo ciclo', () => {
    const todayIso = '2026-11-04';
    const history = {
      // Treinos antigos anteriores ao novo ciclo
      '2026-10-20': { workoutDone: true },
      '2026-10-22': { workoutDone: true },
      // Treino de HOJE executado no novo ciclo
      '2026-11-04': { workoutDone: true }
    };

    const newCycle = NutriAxWorkoutCycle.createWorkoutCycle({
      patientId: 'paciente_teste_123',
      split: 'PHAT',
      startDate: todayIso,
      prescribedWeeklyFrequency: 5
    });

    const metrics = NutriAxWorkoutCycle.calculateCycleMetrics(newCycle, history, todayIso);

    assert.strictEqual(metrics.completedWorkoutsCount, 1, 'Deve contabilizar exatamente 1 treino');
    assert.strictEqual(metrics.currentWeek, 1, 'Semana 1');
    assert.strictEqual(metrics.microcycles[0].workoutsDone, 1, 'Semana 1 com 1 treino feito');
  });

  test('Ciclo anterior é arquivado em pastWorkoutCycles ao aplicar novo ciclo com cycleId diferente', () => {
    const patientState = {
      workoutCycle: {
        cycleId: 'cycle_antigo_001',
        split: 'PPL',
        startDate: '2026-10-15',
        status: 'ACTIVE'
      },
      pastWorkoutCycles: []
    };

    const incomingCycle = {
      cycleId: 'cycle_novo_002',
      split: 'PHAT',
      startDate: '2026-11-04',
      status: 'ACTIVE'
    };

    // Simula a lógica presente em applyPrescriptionPayload / applyPerformancePayload
    if (patientState.workoutCycle && patientState.workoutCycle.cycleId !== incomingCycle.cycleId) {
      patientState.pastWorkoutCycles.push({ ...patientState.workoutCycle, status: 'COMPLETED' });
    }
    patientState.workoutCycle = incomingCycle;

    assert.strictEqual(patientState.pastWorkoutCycles.length, 1);
    assert.strictEqual(patientState.pastWorkoutCycles[0].cycleId, 'cycle_antigo_001');
    assert.strictEqual(patientState.pastWorkoutCycles[0].status, 'COMPLETED');
    assert.strictEqual(patientState.workoutCycle.cycleId, 'cycle_novo_002');
  });

  test('Heatmap de consistência cobre 28 dias do ciclo a partir de startDate e respeita data atual', () => {
    const todayIso = '2026-11-04';
    const startDate = '2026-11-04';
    const history = {
      '2026-11-04': { scoreIDC: 95, workoutDone: true }
    };

    const sp = startDate.split('-').map(Number);
    const cycleStart = new Date(sp[0], sp[1] - 1, sp[2]);
    let activeDays = 0;
    const days = [];

    for (let i = 0; i < 28; i++) {
      const d = new Date(cycleStart.getTime());
      d.setDate(d.getDate() + i);
      const dayIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isFuture = dayIso > todayIso;
      const isToday = dayIso === todayIso;

      let lvl = 0;
      if (!isFuture) {
        const h = history[dayIso];
        if (isToday && h && h.scoreIDC >= 90) lvl = 4;
        else if (h && h.scoreIDC >= 70) lvl = 3;
        if (lvl > 0) activeDays++;
      }
      days.push({ dayIso, isFuture, isToday, lvl });
    }

    assert.strictEqual(days.length, 28, 'Heatmap deve ter exatamente 28 dias');
    assert.strictEqual(days[0].dayIso, '2026-11-04', 'D1 deve ser 2026-11-04');
    assert.strictEqual(days[0].lvl, 4, 'D1 deve ser lvl 4 (95% IDC)');
    assert.strictEqual(days[1].isFuture, true, 'D2 deve ser futuro');
    assert.strictEqual(days[1].lvl, 0, 'D2 deve ter nível 0');
    assert.strictEqual(activeDays, 1, 'Apenas 1 dia ativo até agora no novo ciclo');
  });

});

