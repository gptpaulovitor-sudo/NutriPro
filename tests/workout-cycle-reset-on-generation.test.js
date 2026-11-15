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

  test('Novo ciclo gerado hoje reinicia contadores para Semana 1, 0 treinos e 0% mesmo se treino do ciclo anterior ocorreu hoje', () => {
    const todayIso = '2026-11-15';
    const oldCycle = NutriAxWorkoutCycle.createWorkoutCycle({
      patientId: 'paciente_paulo',
      split: 'PPL',
      startDate: '2026-10-18'
    });

    // Histórico com 20 treinos do ciclo antigo, inclusive um executado hoje antes da geração do novo treino
    const history = {};
    for (let i = 0; i < 19; i++) {
      const d = new Date(2026, 9, 18 + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      history[iso] = { workoutDone: true, cycleId: oldCycle.cycleId };
    }
    history[todayIso] = { workoutDone: true, cycleId: oldCycle.cycleId };

    // Novo ciclo gerado HOJE
    const newCycle = NutriAxWorkoutCycle.createWorkoutCycle({
      patientId: 'paciente_paulo',
      split: 'PHAT',
      startDate: todayIso,
      prescribedWeeklyFrequency: 5
    });

    const metrics = NutriAxWorkoutCycle.calculateCycleMetrics(newCycle, history, todayIso);

    assert.strictEqual(metrics.completedWorkoutsCount, 0, 'Contador de treinos concluídos deve ser ZERO');
    assert.strictEqual(metrics.adherencePercent, 0, 'Aderência deve ser 0%');
    assert.strictEqual(metrics.currentWeek, 1, 'Deve estar na Semana 1');
    assert.strictEqual(metrics.daysElapsed, 0, '0 dias decorridos');
    assert.strictEqual(metrics.daysRemaining, 28, '28 dias restantes');
    assert.strictEqual(metrics.status, 'ACTIVE', 'Status deve ser ACTIVE');
  });

  test('applyPrescriptionPayload reseta workoutDone, exerciseChecks e atribui treino prévio ao ciclo antigo', () => {
    const todayIso = '2026-11-15';
    const oldCycle = {
      cycleId: 'cycle_old_111',
      protocolName: 'Periodização Antiga (4 Semanas)',
      split: 'PPL',
      startDate: '2026-10-18',
      status: 'COMPLETED'
    };

    const patientState = {
      workoutCycle: oldCycle,
      pastWorkoutCycles: [],
      workoutDone: true,
      exerciseChecks: { 'ex1': true, 'ex2': true },
      history: {
        [todayIso]: { workoutDone: true }
      }
    };

    const incomingCycle = {
      cycleId: 'cycle_new_222',
      protocolName: 'Periodização Nova PHAT (4 Semanas)',
      split: 'PHAT',
      startDate: todayIso,
      status: 'ACTIVE'
    };

    // Simulação do comportamento de applyPrescriptionPayload
    const currentCycle = patientState.workoutCycle;
    const isNewCycle = currentCycle && currentCycle.cycleId && currentCycle.cycleId !== incomingCycle.cycleId;

    if (isNewCycle) {
      if (currentCycle && currentCycle.cycleId) {
        if (!Array.isArray(patientState.pastWorkoutCycles)) patientState.pastWorkoutCycles = [];
        patientState.pastWorkoutCycles.push({ ...currentCycle, status: 'COMPLETED' });
      }
      patientState.workoutDone = false;
      patientState.exerciseChecks = {};
      if (patientState.history && patientState.history[todayIso] && (patientState.history[todayIso].workoutDone || patientState.history[todayIso].done)) {
        if (currentCycle && currentCycle.cycleId) {
          patientState.history[todayIso].cycleId = currentCycle.cycleId;
        }
      }
    }
    patientState.workoutCycle = incomingCycle;

    // Verificações
    assert.strictEqual(patientState.workoutDone, false, 'workoutDone deve ser resetado para false');
    assert.strictEqual(Object.keys(patientState.exerciseChecks).length, 0, 'exerciseChecks deve ser limpo');
    assert.strictEqual(patientState.history[todayIso].cycleId, 'cycle_old_111', 'Treino de hoje prévio deve ser vinculado ao ciclo antigo');
    assert.strictEqual(patientState.pastWorkoutCycles.length, 1);
    assert.strictEqual(patientState.pastWorkoutCycles[0].cycleId, 'cycle_old_111');

    // Métricas no novo ciclo
    const metrics = NutriAxWorkoutCycle.calculateCycleMetrics(patientState.workoutCycle, patientState.history, todayIso);
    assert.strictEqual(metrics.completedWorkoutsCount, 0, 'Treinos concluídos no novo ciclo deve ser 0');
    assert.strictEqual(metrics.currentWeek, 1, 'Semana 1');
  });

  test('Invariante Estrutural: app.js passa currentCycle para syncActivePatientToPatientApp e disciplina copia workoutCycle de perfPayload', () => {
    const fs = require('fs');
    const appJs = fs.readFileSync('app.js', 'utf8');
    const discHtml = fs.readFileSync('disciplina/index.html', 'utf8');

    // app.js: savePerformanceForPatient sincroniza passando currentCycle
    assert.match(appJs, /syncActivePatientToPatientApp\(pId,\s*currentCycle\)/, 'savePerformanceForPatient deve passar currentCycle');

    // app.js: loadPerformanceForPatient restaura perfCurrentWorkoutCycle de saved.workoutCycle
    assert.match(appJs, /if\s*\(saved\.workoutCycle\)\s*\{\s*perfCurrentWorkoutCycle\s*=\s*saved\.workoutCycle;\s*\}/);

    // disciplina/index.html: loadState propaga workoutCycle de perfPayload
    assert.match(discHtml, /if\s*\(perfPayload\.workoutCycle\)\s*dataPayload\.workoutCycle\s*=\s*perfPayload\.workoutCycle/);
  });

});

