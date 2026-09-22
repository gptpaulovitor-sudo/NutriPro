// tests/patient-discipline-markings-retention.test.js
// Testes automatizados de persistência e retenção das marcações de execução (alimentos, refeições, hidratação, treino e cardio) no app Disciplina

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('NutriAx Disciplina - Retenção de Marcações e Checks Diários', () => {
  const html = fs.readFileSync(path.join(__dirname, '../disciplina/index.html'), 'utf8');
  const scriptMatches = [...html.matchAll(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi)];
  const mainScript = scriptMatches.map(m => m[1]).find(s => s && s.length > 50000) || scriptMatches[scriptMatches.length - 2][1];

  function createSandbox(mockStorage = {}) {
    const domElements = {};
    function getEl(id) {
      if (!domElements[id]) {
        domElements[id] = {
          id,
          classList: {
            add: () => {},
            remove: () => {},
            contains: () => false
          },
          style: {},
          innerHTML: '',
          textContent: '',
          value: '8'
        };
      }
      return domElements[id];
    }

    const listeners = {};

    const sandbox = {
      window: {
        location: {
          hash: '',
          search: '',
          origin: 'http://localhost:3000',
          pathname: '/disciplina/',
          replace: () => {}
        },
        history: {
          replaceState: () => {}
        },
        dispatchEvent: () => {},
        addEventListener: (type, cb) => {
          listeners[type] = cb;
        },
        confetti: () => {},
        lucide: {
          createIcons: () => {}
        }
      },
      document: {
        getElementById: (id) => getEl(id),
        querySelectorAll: () => [],
        addEventListener: (type, cb) => {
          listeners[type] = cb;
        },
        visibilityState: 'visible'
      },
      localStorage: {
        getItem: (k) => mockStorage[k] !== undefined ? mockStorage[k] : null,
        setItem: (k, v) => { mockStorage[k] = String(v); },
        removeItem: (k) => { delete mockStorage[k]; }
      },
      sessionStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      },
      console: {
        log: () => {},
        info: () => {},
        warn: () => {},
        error: () => {}
      },
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      Date: Date,
      Math: Math,
      JSON: JSON,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      RegExp: RegExp,
      Set: Set,
      Map: Map,
      Event: class Event {},
      CustomEvent: class CustomEvent {},
      BroadcastChannel: function() {
        return { postMessage: () => {}, close: () => {} };
      }
    };
    sandbox.window.localStorage = sandbox.localStorage;
    sandbox.window.sessionStorage = sandbox.sessionStorage;
    sandbox.window.document = sandbox.document;
    sandbox.window.window = sandbox.window;
    sandbox.window.Event = sandbox.Event;
    sandbox.window.CustomEvent = sandbox.CustomEvent;
    return { sandbox, listeners };
  }

  test('1. Retenção de água, checks de alimentos e refeições após recarregamento (reload)', async () => {
    const mockStorage = {};
    const patientId = 'paulo-vitor-teste';

    // 1. Prescrição presente em localStorage
    mockStorage[`nutriax_patient_payload_${patientId}`] = JSON.stringify({
      patientId: patientId,
      patientName: 'Paulo Vitor Teste',
      meals: [
        {
          id: 'm_1',
          time: '08:00',
          name: 'Café da Manhã Prescrito',
          items: [
            { name: 'Ovos mexidos', qty: 150, unit: '3 un', kcal: 200, prot: 18, carbo: 2, lipid: 14 },
            { name: 'Pão integral', qty: 50, unit: '2 fatias', kcal: 120, prot: 4, carbo: 22, lipid: 1 }
          ],
          kcal: 320,
          prot: 22,
          carbo: 24,
          fat: 15,
          done: false
        },
        {
          id: 'm_2',
          time: '12:30',
          name: 'Almoço Prescrito',
          items: [
            { name: 'Frango grelhado', qty: 200, unit: '200g', kcal: 300, prot: 60, carbo: 0, lipid: 6 }
          ],
          kcal: 300,
          prot: 60,
          carbo: 0,
          fat: 6,
          done: false
        }
      ],
      targetWater: 3500
    });

    // Sessão 1: usuário abre o app, é autorizado e realiza marcações
    const { sandbox: ctx1 } = createSandbox(mockStorage);
    vm.createContext(ctx1);
    vm.runInContext(mainScript, ctx1);

    await vm.runInContext(`
      activateAuthorizedPatient('${patientId}', { uid: 'u123', email: 'paulo@teste.com' }, { displayName: 'Paulo Vitor Teste' });
      addWater(750);
      toggleFoodItem('m_1', 0); // marca o primeiro alimento da refeição 1
      toggleMeal('m_2');        // marca a refeição 2 completa
      toggleExerciseCheck('ex_supino');
      toggleCardioCheck();
    `, ctx1);

    const ps1 = vm.runInContext('patientState', ctx1);
    assert.strictEqual(ps1.waterCurrent, 750);
    assert.strictEqual(ps1.foodItemChecks['m_1_0'], true);
    assert.strictEqual(ps1.meals.find(m => m.id === 'm_2').done, true);
    assert.strictEqual(ps1.exerciseChecks['ex_supino'], true);
    assert.strictEqual(ps1.cardioDone, true);

    // Sessão 2: simula recarga da página (F5 / reopen)
    const { sandbox: ctx2 } = createSandbox(mockStorage);
    vm.createContext(ctx2);
    vm.runInContext(mainScript, ctx2);

    await vm.runInContext(`
      activateAuthorizedPatient('${patientId}', { uid: 'u123', email: 'paulo@teste.com' }, { displayName: 'Paulo Vitor Teste' });
    `, ctx2);

    const ps2 = vm.runInContext('patientState', ctx2);
    assert.strictEqual(ps2.waterCurrent, 750, 'A hidratação de 750ml deve ser retida após reload');
    assert.strictEqual(ps2.foodItemChecks['m_1_0'], true, 'O check individual de alimento m_1_0 deve ser retido');
    assert.strictEqual(ps2.meals.find(m => m.id === 'm_2').done, true, 'O status done da refeição m_2 deve ser retido');
    assert.strictEqual(ps2.exerciseChecks['ex_supino'], true, 'O check de exercício ex_supino deve ser retido');
    assert.strictEqual(ps2.cardioDone, true, 'O status de cardioDone deve ser retido');
  });

  test('2. Navegação entre abas de treino na agenda semanal não desmarca workoutDone', async () => {
    const mockStorage = {};
    const patientId = 'paulo-vitor-teste-2';

    mockStorage[`nutriax_patient_payload_${patientId}`] = JSON.stringify({
      patientId: patientId,
      meals: [],
      targetWater: 4000
    });

    const { sandbox: ctx } = createSandbox(mockStorage);
    vm.createContext(ctx);
    vm.runInContext(mainScript, ctx);

    await vm.runInContext(`
      activateAuthorizedPatient('${patientId}', { uid: 'u123', email: 'paulo@teste.com' }, { displayName: 'Paulo Vitor Teste' });
      toggleWorkoutCheck();
    `, ctx);

    const psBefore = vm.runInContext('patientState', ctx);
    assert.strictEqual(psBefore.workoutDone, true, 'Treino deve estar marcado como concluído');

    // Navega para outro dia da agenda
    vm.runInContext(`
      if (typeof selectScheduleDay === 'function') {
        selectScheduleDay(2);
      }
    `, ctx);

    const psAfter = vm.runInContext('patientState', ctx);
    assert.strictEqual(psAfter.workoutDone, true, 'workoutDone não deve ser revertido para false ao navegar entre abas de treino');
  });

  test('3. applyCloudDiscipline com lastActiveDate de hoje preserva checks locais', async () => {
    const mockStorage = {};
    const patientId = 'paulo-vitor-teste-3';

    mockStorage[`nutriax_patient_payload_${patientId}`] = JSON.stringify({
      patientId: patientId,
      meals: [
        { id: 'm_1', name: 'Refeição 1', items: [{ name: 'Item 1' }] },
        { id: 'm_2', name: 'Refeição 2', items: [{ name: 'Item 2' }] }
      ]
    });

    const { sandbox: ctx } = createSandbox(mockStorage);
    vm.createContext(ctx);
    vm.runInContext(mainScript, ctx);

    await vm.runInContext(`
      activateAuthorizedPatient('${patientId}', { uid: 'u123', email: 'paulo@teste.com' }, { displayName: 'Paulo Vitor Teste' });
      toggleFoodItem('m_1', 0);
      addWater(500);
    `, ctx);

    const todayIso = vm.runInContext('getLocalDateIso()', ctx);

    // Simula chegada de snapshot da nuvem com dados de outro dispositivo
    vm.runInContext(`
      applyCloudDiscipline({
        lastActiveDate: '${todayIso}',
        foodItemChecks: { 'm_2_0': true },
        exerciseChecks: { 'ex_agachamento': true },
        waterCurrent: 1000,
        workoutDone: true
      });
    `, ctx);

    const psCloud = vm.runInContext('patientState', ctx);
    // Deve manter marcação local e incorporar marcação da nuvem
    assert.strictEqual(psCloud.foodItemChecks['m_1_0'], true, 'Check local m_1_0 deve ser preservado');
    assert.strictEqual(psCloud.foodItemChecks['m_2_0'], true, 'Check vindo da nuvem m_2_0 deve ser incorporado');
    assert.strictEqual(psCloud.waterCurrent, 1000, 'Água deve atualizar para o maior valor (1000ml)');
    assert.strictEqual(psCloud.workoutDone, true, 'Treino da nuvem deve ser aceito');
  });
});
