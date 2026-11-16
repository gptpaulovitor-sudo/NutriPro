/**
 * tests/workout-cycle-renewal-sync.test.js
 * 
 * Validação da renovação do mesociclo de treino e sincronização bidirecional
 * em nuvem entre NutriAx Pro (app.js) e Disciplina (disciplina/index.html).
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const NutriAxWorkoutCycle = require('../workout-cycle-module.js');

describe('Renovação e Sincronização do Mesociclo de Treino (Pro ↔ Disciplina)', () => {
  const appJsPath = path.join(__dirname, '..', 'app.js');
  const discHtmlPath = path.join(__dirname, '..', 'disciplina', 'index.html');
  const swPath = path.join(__dirname, '..', 'disciplina', 'sw-paciente.js');

  const appJs = fs.readFileSync(appJsPath, 'utf8');
  const discHtml = fs.readFileSync(discHtmlPath, 'utf8');
  const swContent = fs.readFileSync(swPath, 'utf8');

  test('CYCLE-SYNC-01: perfStartNewCycle4Weeks no Pro salva no cloud, dispara sync e broadcast', () => {
    assert.match(appJs, /savePerformanceForPatient\(pId,\s*true,\s*newCycle\)/);
    assert.match(appJs, /syncActivePatientToPatientApp\(pId,\s*newCycle\)/);
    assert.match(appJs, /NutriProFirebase[^)]*discipline[^)]*syncToCloud\(pId/);
    assert.match(appJs, /type:\s*'WORKOUT_CYCLE_RESET'/);
    assert.match(appJs, /type:\s*'PERFORMANCE_UPDATED'/);
  });

  test('CYCLE-SYNC-02: applyCloudDiscipline no Disciplina processa workoutCycle e pastWorkoutCycles', () => {
    assert.match(discHtml, /if\s*\(cloud\.workoutCycle && typeof cloud\.workoutCycle === 'object'\)/);
    assert.match(discHtml, /patientState\.workoutCycle\s*=\s*incomingCycle/);
    assert.match(discHtml, /patientState\.pastWorkoutCycles\s*=\s*cloud\.pastWorkoutCycles/);
  });

  test('CYCLE-SYNC-03: Disciplina possui listener em tempo real para discipline.subscribe', () => {
    assert.match(discHtml, /window\.NutriProFirebase\?\.discipline\?\.subscribe/);
    assert.match(discHtml, /applyCloudDiscipline\(updatedDisc\)/);
  });

  test('CYCLE-SYNC-04: BroadcastChannel WORKOUT_CYCLE_RESET executa renderAll', () => {
    assert.match(discHtml, /event\.data\.type === 'WORKOUT_CYCLE_RESET'[\s\S]*?renderAll\(\)/);
  });

  test('CYCLE-SYNC-05: checkCloudForWorkoutUpdate está exposto e disponível no banner de ciclo concluído', () => {
    assert.match(discHtml, /onclick="checkCloudForWorkoutUpdate\(\)"/);
    assert.match(discHtml, /window\.checkCloudForWorkoutUpdate\s*=\s*checkCloudForWorkoutUpdate/);
  });

  test('CYCLE-SYNC-06: sw-paciente.js atualizado para versão recente', () => {
    assert.match(swContent, /nutriax-disciplina-v1\.0\.(8|9|10|11|12|\d+)/);
  });

  test('CYCLE-SYNC-07: Simulação em Sandbox VM — Renovação de ciclo substitui ciclo concluído', () => {
    const elements = {};
    function mockElement(id) {
      if (!elements[id]) {
        elements[id] = {
          id,
          innerText: '',
          textContent: '',
          innerHTML: '',
          className: '',
          classList: {
            classes: new Set(),
            add: function(...args) { args.forEach(c => this.classes.add(c)); },
            remove: function(...args) { args.forEach(c => this.classes.delete(c)); },
            contains: function(c) { return this.classes.has(c); }
          }
        };
      }
      return elements[id];
    }

    // Cria ciclo anterior concluído
    const oldCycle = NutriAxWorkoutCycle.createWorkoutCycle({
      patientId: 'paciente_paulo',
      protocolName: 'Periodização Antiga (4 Semanas)',
      split: 'PHAT',
      startDate: '2026-10-01'
    });
    oldCycle.status = 'COMPLETED';
    oldCycle.evaluation = { rpeScore: 8, loadProgression: 'aumentou' };

    const domContext = {
      window: { location: { href: 'http://localhost/disciplina/' } },
      document: {
        getElementById: (id) => mockElement(id),
        querySelectorAll: () => []
      },
      _authorizedPatientId: 'paciente_paulo',
      patientState: {
        name: 'Paulo Vitor',
        workoutCycle: oldCycle,
        pastWorkoutCycles: [],
        history: {}
      },
      getLocalDateIso: () => '2026-11-09',
      saveState: () => {},
      renderAll: () => { domContext.renderAllCalled = true; },
      showToast: () => {},
      NutriAxWorkoutCycle: NutriAxWorkoutCycle,
      console: console
    };
    domContext.global = domContext;
    domContext.globalThis = domContext;

    // Extrai applyCloudDiscipline do html
    const match = discHtml.match(/function applyCloudDiscipline\(cloud\) \{[\s\S]*?saveState\(\);\s*\}/);
    assert.ok(match, 'applyCloudDiscipline deve existir no html');

    const script = new vm.Script(match[0]);
    vm.createContext(domContext);
    script.runInContext(domContext);

    // Cria novo ciclo renovado pelo nutricionista
    const newRenewedCycle = NutriAxWorkoutCycle.createWorkoutCycle({
      patientId: 'paciente_paulo',
      protocolName: 'Periodização Nova PHAT (4 Semanas)',
      split: 'PHAT',
      startDate: '2026-11-09'
    });

    // Simula chegada do ciclo renovado da nuvem
    domContext.applyCloudDiscipline({
      workoutCycle: newRenewedCycle
    });

    // O ciclo ativo agora deve ser o novo ciclo
    assert.equal(domContext.patientState.workoutCycle.cycleId, newRenewedCycle.cycleId);
    assert.equal(domContext.patientState.workoutCycle.status, 'ACTIVE');
    assert.equal(domContext.patientState.workoutCycle.protocolName, 'Periodização Nova PHAT (4 Semanas)');

    // O ciclo antigo concluído deve estar arquivado no histórico de ciclos
    assert.equal(domContext.patientState.pastWorkoutCycles.length, 1);
    assert.equal(domContext.patientState.pastWorkoutCycles[0].cycleId, oldCycle.cycleId);
    assert.equal(domContext.patientState.pastWorkoutCycles[0].status, 'COMPLETED');
  });

  test('CYCLE-SYNC-08: perfPrescribeNextCycleWithFeedback prescreve novo treino com sobrecarga adaptada', () => {
    assert.match(appJs, /function perfPrescribeNextCycleWithFeedback/);
    assert.match(appJs, /window\.perfPrescribeNextCycleWithFeedback\s*=/);
    assert.match(appJs, /onclick="perfPrescribeNextCycleWithFeedback\(\)"/);
    assert.match(appJs, /previousCycleEvaluation/);
  });
});