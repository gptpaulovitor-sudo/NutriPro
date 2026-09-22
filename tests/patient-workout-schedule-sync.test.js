/**
 * tests/patient-workout-schedule-sync.test.js
 *
 * Suíte de Testes Automatizados para a Unificação dos Seletores de Treino
 * e Alinhamento com a Prescrição Semanal Real no App do Paciente (disciplina/index.html).
 *
 * Valida:
 * 1. Unificação do Seletor (remoção do #quickRoutineSelectorPills e uso exclusivo do #weeklyScheduleCarousel)
 * 2. Mapeamento do dia atual do calendário (getTodayScheduleDay e resolveTodayPrescribedWorkout)
 * 3. Seleção automática do treino prescrito para o dia de hoje no carregamento e ao receber prescrição
 * 4. Badge "🎯 Hoje" atribuído exclusivamente ao dia real de hoje no microciclo semanal
 * 5. Seleção unívoca sem seleção duplicada (mesmo com rotinas repetidas ou múltiplos dias OFF)
 * 6. Sincronização da Sinergia Nutricional e Hero Banner com o dia prescrito selecionado
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const patientHtmlCode = fs.readFileSync(path.join(__dirname, '..', 'disciplina', 'index.html'), 'utf8');

// Extrai script principal do paciente
const scripts = patientHtmlCode.match(/<script[\s\S]*?<\/script>/gi) || [];
const patientScriptCode = scripts.find(s => s.includes('applyPrescriptionPayload') && s.includes('renderWeeklyCarousel'))
  .replace(/<script[^>]*>/i, '')
  .replace(/<\/script>/i, '');

function createPatientEnvironment(overrides = {}) {
  const domElements = {};

  function getEl(id) {
    if (!domElements[id]) {
      domElements[id] = {
        id,
        style: {},
        innerHTML: '',
        innerText: '',
        textContent: '',
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); }
        },
        children: [],
        querySelectorAll() { return []; },
        querySelector() { return null; },
        setAttribute: () => {},
        getAttribute: () => null
      };
    }
    return domElements[id];
  }

  const localStorageData = {};
  const mockLocalStorage = {
    getItem: (k) => (k in localStorageData ? localStorageData[k] : null),
    setItem: (k, v) => { localStorageData[k] = String(v); },
    removeItem: (k) => { delete localStorageData[k]; },
    clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
  };

  const mockWindow = {
    location: { hash: '', origin: 'http://localhost', pathname: '/disciplina/', search: '' },
    history: { replaceState: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    localStorage: mockLocalStorage,
    lucide: { createIcons: () => {} },
    confetti: () => {},
    document: {
      getElementById: (id) => getEl(id),
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
      removeEventListener: () => {},
      createElement: () => ({
        style: {},
        classList: { add: () => {}, remove: () => {} },
        appendChild: () => {}
      }),
      body: { appendChild: () => {}, innerHTML: '' }
    }
  };

  const sandbox = {
    window: mockWindow,
    document: mockWindow.document,
    localStorage: mockLocalStorage,
    console: { log: () => {}, warn: () => {}, error: () => {}, info: () => {} },
    setTimeout: (fn) => typeof fn === 'function' && fn(),
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    escape: (s) => s,
    unescape: (s) => s,
    encodeURIComponent: encodeURIComponent,
    decodeURIComponent: decodeURIComponent,
    Date: overrides.MockDate || Date,
    Math: Math,
    JSON: JSON,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    RegExp: RegExp
  };

  const bridgeCode = `
  ;window._test_exports = {
    getPatientState: () => patientState,
    getWorkoutDatabase: () => WORKOUT_DATABASE,
    getWeeklyScheduleData: () => WEEKLY_SCHEDULE_DATA,
    getSelectedRoutineKey: () => selectedRoutineKey,
    getSelectedScheduleDay: () => selectedScheduleDay,
    setSelectedScheduleDay: (d) => { selectedScheduleDay = d; patientState.selectedScheduleDay = d; },
    setSelectedRoutineKey: (k) => { selectedRoutineKey = k; patientState.selectedRoutineKey = k; },
    getTodayScheduleDay,
    resolveTodayPrescribedWorkout,
    applyPrescriptionPayload,
    selectRoutine,
    selectScheduleDay,
    renderWeeklyCarousel,
    renderQuickRoutinePills,
    updateSynergyCard,
    renderWorkoutExercises
  };
  `;

  vm.createContext(sandbox);
  vm.runInContext(patientScriptCode + bridgeCode, sandbox);

  return { sandbox, domElements, mockLocalStorage, exp: sandbox.window._test_exports };
}

test('Unificação de Seletores de Treino e Acompanhamento da Prescrição Real', async (t) => {

  await t.test('1. Unificação do Seletor no DOM', () => {
    // Valida que o seletor duplicado #quickRoutineSelectorPills foi removido do HTML
    assert.ok(!patientHtmlCode.includes('id="quickRoutineSelectorPills"'), 'HTML não deve conter mais o container duplicado #quickRoutineSelectorPills');
    // Valida que o container único do cronograma semanal está presente
    assert.ok(patientHtmlCode.includes('id="weeklyScheduleCarousel"'), 'HTML deve conter o #weeklyScheduleCarousel unificado');
    assert.ok(patientHtmlCode.includes('Cronograma Semanal Prescrito'), 'Título do bloco deve ser Cronograma Semanal Prescrito');

    const { exp, domElements } = createPatientEnvironment();
    // Invocação de renderQuickRoutinePills não quebra mesmo sem o elemento
    assert.doesNotThrow(() => exp.renderQuickRoutinePills(), 'renderQuickRoutinePills não deve gerar exceção');
  });

  await t.test('2. Resolução do Dia Atual do Calendário (getTodayScheduleDay)', () => {
    // Simula uma Terça-feira (getDay() === 2)
    class TuesdayDate extends Date {
      getDay() { return 2; }
    }
    const envTue = createPatientEnvironment({ MockDate: TuesdayDate });
    assert.equal(envTue.exp.getTodayScheduleDay(), 2, 'Terça-feira deve mapear para o dia 2 da semana');

    // Simula um Domingo (getDay() === 0) -> Deve mapear para o dia 7 da semana
    class SundayDate extends Date {
      getDay() { return 0; }
    }
    const envSun = createPatientEnvironment({ MockDate: SundayDate });
    assert.equal(envSun.exp.getTodayScheduleDay(), 7, 'Domingo deve mapear para o dia 7 da semana');
  });

  await t.test('3. Seleção Automática do Treino Prescrito de Hoje na Carga da Prescrição', () => {
    // Simula Quinta-feira (Dia 4)
    class ThursdayDate extends Date {
      getDay() { return 4; }
    }
    const { exp } = createPatientEnvironment({ MockDate: ThursdayDate });

    const mockPayload = {
      patientId: 'p_test_thursday',
      workoutDatabase: {
        'A': { id: 'A', name: 'Treino A · Peito', badge: 'A' },
        'B': { id: 'B', name: 'Treino B · Costas', badge: 'B' },
        'C': { id: 'C', name: 'Treino C · Pernas', badge: 'C' },
        'D': { id: 'D', name: 'Treino D · Ombros e Braços', badge: 'D' }
      },
      weeklySchedule: [
        { dayKey: 'd1', dayName: 'Segunda', type: 'Treino', routineKey: 'A', title: 'Treino A · Peito' },
        { dayKey: 'd2', dayName: 'Terça', type: 'Treino', routineKey: 'B', title: 'Treino B · Costas' },
        { dayKey: 'd3', dayName: 'Quarta', type: 'Off', routineKey: null, title: 'Descanso Ativo' },
        { dayKey: 'd4', dayName: 'Quinta', type: 'Treino', routineKey: 'D', title: 'Treino D · Ombros e Braços' },
        { dayKey: 'd5', dayName: 'Sexta', type: 'Treino', routineKey: 'C', title: 'Treino C · Pernas' },
        { dayKey: 'd6', dayName: 'Sábado', type: 'Cardio', routineKey: null, title: 'Cardio Livre' },
        { dayKey: 'd7', dayName: 'Domingo', type: 'Off', routineKey: null, title: 'Descanso Total' }
      ]
    };

    exp.applyPrescriptionPayload(mockPayload);

    // Como hoje é Quinta-feira (Dia 4), o app deve selecionar automaticamente o Dia 4 e a rotina 'D'
    assert.equal(exp.getSelectedScheduleDay(), 4, 'Deve selecionar automaticamente o Dia 4 na quinta-feira');
    assert.equal(exp.getSelectedRoutineKey(), 'D', 'Deve selecionar automaticamente a rotina prescrita para quinta-feira (D)');
  });

  await t.test('4. Atribuição Exclusiva do Badge "🎯 Hoje" no Carrossel', () => {
    // Simula Quarta-feira (Dia 3)
    class WednesdayDate extends Date {
      getDay() { return 3; }
    }
    const { exp, domElements } = createPatientEnvironment({ MockDate: WednesdayDate });

    const mockPayload = {
      workoutDatabase: {
        'A': { id: 'A', name: 'Treino A' },
        'B': { id: 'B', name: 'Treino B' }
      },
      weeklySchedule: [
        { dayKey: 'd1', dayName: 'Segunda', type: 'Treino', routineKey: 'A', title: 'Treino A' },
        { dayKey: 'd2', dayName: 'Terça', type: 'Treino', routineKey: 'B', title: 'Treino B' },
        { dayKey: 'd3', dayName: 'Quarta', type: 'Off', routineKey: null, title: 'Descanso Quarta' },
        { dayKey: 'd4', dayName: 'Quinta', type: 'Treino', routineKey: 'A', title: 'Treino A Repetido' }
      ]
    };

    exp.applyPrescriptionPayload(mockPayload);
    exp.renderWeeklyCarousel();

    const carouselHtml = domElements['weeklyScheduleCarousel'].innerHTML;

    // Deve conter "🎯 Hoje" exatamente uma vez
    const hojeMatches = carouselHtml.match(/🎯 Hoje/g) || [];
    assert.equal(hojeMatches.length, 1, 'Deve haver exatamente 1 badge "🎯 Hoje" no carrossel');

    // O badge de hoje deve estar associado a Quarta (DIA 3)
    assert.ok(carouselHtml.includes('QUA · DIA 3'), 'Deve exibir dia abreviado QUA · DIA 3');

    // Se o usuário clica para visualizar o Dia 1 (Segunda), o badge "🎯 Hoje" NÃO deve mudar para Segunda
    exp.selectScheduleDay(1);
    exp.renderWeeklyCarousel();
    const carouselHtmlAfterClick = domElements['weeklyScheduleCarousel'].innerHTML;
    const matchesAfterClick = carouselHtmlAfterClick.match(/🎯 Hoje/g) || [];
    assert.equal(matchesAfterClick.length, 1, 'Mesmo após navegar de dia, "🎯 Hoje" permanece no dia real do calendário');
  });

  await t.test('5. Seleção Unívoca Sem Destaque Duplicado Para Dias com a Mesma Rotina', () => {
    const { exp, domElements } = createPatientEnvironment();

    const mockPayload = {
      workoutDatabase: {
        'A': { id: 'A', name: 'Treino A' }
      },
      weeklySchedule: [
        { dayKey: 'd1', dayName: 'Segunda', type: 'Treino', routineKey: 'A', title: 'Treino A 1' },
        { dayKey: 'd2', dayName: 'Terça', type: 'Off', routineKey: null, title: 'Descanso 1' },
        { dayKey: 'd3', dayName: 'Quarta', type: 'Treino', routineKey: 'A', title: 'Treino A 2' },
        { dayKey: 'd4', dayName: 'Quinta', type: 'Off', routineKey: null, title: 'Descanso 2' }
      ]
    };

    exp.applyPrescriptionPayload(mockPayload);

    // Clica no Dia 3 (que também tem routineKey 'A')
    exp.selectScheduleDay(3);
    exp.renderWeeklyCarousel();

    const carouselHtml = domElements['weeklyScheduleCarousel'].innerHTML;

    // Apenas UM card deve ter a classe de destaque de seleção 'scale-[1.02]'
    const selectedMatches = carouselHtml.match(/scale-\[1\.02\]/g) || [];
    assert.equal(selectedMatches.length, 1, 'Apenas o card do Dia 3 deve estar selecionado com scale-[1.02]');
  });

  await t.test('6. Sincronização Precisa da Sinergia Nutricional com o Dia Selecionado', () => {
    const { exp, domElements } = createPatientEnvironment();

    const mockPayload = {
      workoutDatabase: {
        'A': { id: 'A', name: 'Treino A' }
      },
      weeklySchedule: [
        {
          dayKey: 'd1',
          dayName: 'Segunda',
          type: 'Treino',
          routineKey: 'A',
          title: 'Treino A Força',
          synergy: { carbo: '100g carbo pré', prot: '2.2 g/kg', water: '5L', focus: 'Força Máxima' }
        },
        {
          dayKey: 'd2',
          dayName: 'Terça',
          type: 'Off',
          routineKey: null,
          title: 'Descanso Metabólico',
          synergy: { carbo: '40g carbo leve', prot: '1.8 g/kg', water: '3.5L', focus: 'Regeneração' }
        }
      ]
    };

    exp.applyPrescriptionPayload(mockPayload);

    // Seleciona Dia 1
    exp.selectScheduleDay(1);
    exp.updateSynergyCard();
    assert.equal(domElements['synergyCarbo'].textContent, '100g carbo pré');
    assert.equal(domElements['synergyProt'].textContent, '2.2 g/kg');

    // Seleciona Dia 2
    exp.selectScheduleDay(2);
    exp.updateSynergyCard();
    assert.equal(domElements['synergyCarbo'].textContent, '40g carbo leve');
    assert.equal(domElements['synergyProt'].textContent, '1.8 g/kg');
    assert.equal(domElements['synergyFocus'].textContent, 'Regeneração');
  });

  await t.test('7. Atualização do Hero Banner com Nome do Treino e Dia Prescrito', () => {
    const { exp, domElements } = createPatientEnvironment();

    const mockPayload = {
      workoutDatabase: {
        'B': { id: 'B', name: 'Pull Pesado', subtitle: 'Costas e Trapézio' }
      },
      weeklySchedule: [
        {
          dayKey: 'd2',
          dayName: 'Terça-feira',
          type: 'Treino + Cardio',
          routineKey: 'B',
          title: 'Treino B · Pull Pesado + Cardio Z2',
          sub: 'Volume denso de dorsais e 30 min esteira'
        }
      ]
    };

    exp.applyPrescriptionPayload(mockPayload);
    exp.selectScheduleDay(1); // primeiro dia do mockPayload (d2)
    exp.renderWorkoutExercises();

    assert.equal(domElements['workoutRoutineTitle'].textContent, 'Treino B · Pull Pesado + Cardio Z2');
    assert.equal(domElements['workoutRoutineSubtitle'].textContent, 'Volume denso de dorsais e 30 min esteira');
    assert.ok(domElements['workoutRoutineBadge'].textContent.toLowerCase().includes('terça'));
  });

});
