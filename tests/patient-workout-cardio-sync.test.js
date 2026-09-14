/**
 * tests/patient-workout-cardio-sync.test.js
 *
 * Suíte de Testes Automatizados para a Sincronização Canônica do Treino
 * e Cardio Prescrito no App do Paciente (disciplina/index.html).
 *
 * Valida:
 * 1. Serialização no Pro Portal (syncActivePatientToPatientApp em app.js)
 * 2. Ingestão canônica no Paciente (applyPrescriptionPayload em disciplina/index.html)
 * 3. Integridade do WORKOUT_DATABASE (preservação de A, B, C, Cardio e OFF)
 * 4. Preservação de atributos de cardio na agenda semanal (cardioSession, hasCardioPost, cardioId)
 * 5. Renderização dinâmica do bloco de cardio (#workoutCardioBlock, badge, título, FC alvo, blocos dinâmicos)
 * 6. Ocultação do bloco de cardio em dias sem cardio (Treino puro ou OFF)
 * 7. Navegação e seleção correta de rotinas (dias OFF -> 'OFF', dias Cardio -> 'Cardio')
 * 8. Cálculo dinâmico do IDC conforme composição do dia (Off, Cardio, Treino+Cardio, Treino puro)
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Carrega arquivos fonte
const proPortalCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const patientHtmlCode = fs.readFileSync(path.join(__dirname, '..', 'disciplina', 'index.html'), 'utf8');

// Extrai script principal do paciente
const scripts = patientHtmlCode.match(/<script[\s\S]*?<\/script>/gi) || [];
const patientScriptCode = scripts.find(s => s.includes('applyPrescriptionPayload') && s.includes('calculateDailyIDCValue'))
  .replace(/<script[^>]*>/i, '')
  .replace(/<\/script>/i, '');

/**
 * Cria ambiente simulado do Disciplina (paciente)
 */
function createPatientEnvironment() {
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
    setTimeout: () => {},
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    escape: (s) => s,
    unescape: (s) => s,
    encodeURIComponent: encodeURIComponent,
    decodeURIComponent: decodeURIComponent,
    Date: Date,
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
    getCurrentRoutine: () => typeof currentRoutine !== 'undefined' ? currentRoutine : WORKOUT_DATABASE[selectedRoutineKey],
    applyPrescriptionPayload,
    selectScheduleDay,
    calculateDailyIDCValue,
    renderWorkoutCardioBlock
  };
  `;

  vm.createContext(sandbox);
  vm.runInContext(patientScriptCode + bridgeCode, sandbox);

  return { sandbox, domElements, mockLocalStorage, exp: sandbox.window._test_exports };
}

test('Sincronização Canônica do Treino e Cardio Prescrito', async (t) => {

  await t.test('1. Serialização no Pro Portal (app.js)', () => {
    // Verifica presença da lógica de inclusão de Cardio/OFF e cardioDatabase em syncActivePatientToPatientApp
    assert.ok(proPortalCode.includes("formattedWorkout['Cardio']"), "app.js deve estruturar rotina 'Cardio' em formattedWorkout");
    assert.ok(proPortalCode.includes("formattedWorkout['OFF']"), "app.js deve estruturar rotina 'OFF' em formattedWorkout");
    assert.ok(proPortalCode.includes("cardioDatabase: (typeof PERF_CARDIO_DB !== 'undefined'"), "syncPayload deve incluir cardioDatabase: PERF_CARDIO_DB");
    assert.ok(proPortalCode.includes("activeSplit: typeof perfActiveSplit !== 'undefined'"), "syncPayload deve incluir activeSplit");
  });

  await t.test('2. Ingestão Canônica no App do Paciente (applyPrescriptionPayload)', () => {
    const { exp } = createPatientEnvironment();

    const mockPayload = {
      patientId: 'patient_test_01',
      patientName: 'Carlos Silva',
      targetWater: 3800,
      activeSplit: 'PPL',
      cardioPrescription: {
        totalWeeklyMinutes: 60,
        frequencyWeekly: 2,
        preferredDuration: 30,
        sessions: [
          {
            dayKey: 'd2',
            dayName: 'Terça',
            protocolId: 'cardio_01',
            protocolName: 'Esteira Zona 2 Contínua',
            durationMinutes: 30,
            intensityZone: 'Zona 2',
            bpmTarget: '115-130 bpm',
            isHiit: false
          },
          {
            dayKey: 'd4',
            dayName: 'Quinta',
            protocolId: 'cardio_03',
            protocolName: 'HIIT AirBike Tabata',
            durationMinutes: 20,
            intensityZone: 'HIIT / Z4-Z5',
            bpmTarget: '155-175 bpm',
            isHiit: true
          }
        ]
      },
      prescribedCardio: {
        id: 'cardio_01',
        name: 'Esteira Zona 2 Contínua',
        category: 'Zona 2 Base Aeróbica',
        intensityZone: 'Zona 2',
        timeCap: '30 min',
        foco: 'Oxidação Lipídica',
        equipment: 'Esteira',
        blocks: [
          { name: 'Aquecimento Ritmado', cadence: 'Vel 5.0 km/h', items: ['5 min ritmo leve de aquecimento'] },
          { name: 'Fase Principal de Manutenção', cadence: 'Vel 6.2 km/h · Inc 4%', items: ['25 min caminhada inclinada sustentada'] }
        ]
      },
      workoutDatabase: {
        'A': {
          id: 'A',
          name: 'Push A',
          exercises: [{ num: 1, name: 'Supino Reto', sets: 4, reps: '8-10' }]
        },
        'B': {
          id: 'B',
          name: 'Pull A',
          exercises: [{ num: 1, name: 'Puxada Alta', sets: 4, reps: '8-10' }]
        }
      },
      weeklySchedule: [
        { dayKey: 'd1', dayName: 'Segunda', type: 'Treino', routineKey: 'A', title: 'Push A', hasCardioPost: false },
        {
          dayKey: 'd2',
          dayName: 'Terça',
          type: 'Treino + Cardio',
          routineKey: 'B',
          title: 'Pull A + Cardio',
          hasCardioPost: true,
          cardioId: 'cardio_01',
          cardioSession: {
            durationMinutes: 30,
            intensityZone: 'Zona 2',
            bpmTarget: '115-130 bpm',
            protocolName: 'Esteira Zona 2 Contínua'
          }
        },
        { dayKey: 'd3', dayName: 'Quarta', type: 'Off', routineKey: null, title: 'Descanso' },
        {
          dayKey: 'd4',
          dayName: 'Quinta',
          type: 'Cardio',
          routineKey: null,
          title: 'Sessão Cardio HIIT',
          hasCardioPost: false,
          cardioId: 'cardio_03',
          cardioSession: {
            durationMinutes: 20,
            intensityZone: 'HIIT / Z4-Z5',
            bpmTarget: '155-175 bpm',
            protocolName: 'HIIT AirBike Tabata'
          }
        }
      ]
    };

    exp.applyPrescriptionPayload(mockPayload);

    const pState = exp.getPatientState();
    const workoutDb = exp.getWorkoutDatabase();
    const schedule = exp.getWeeklyScheduleData();

    // Valida persistência de metadados no patientState
    assert.equal(pState.name, 'Carlos Silva');
    assert.equal(pState.waterTarget, 3800);
    assert.equal(pState.activeSplit, 'PPL');
    assert.ok(pState.cardioPrescription, 'cardioPrescription deve ser persistido');
    assert.equal(pState.cardioPrescription.totalWeeklyMinutes, 60);
    assert.ok(pState.prescribedCardio, 'prescribedCardio deve ser persistido');

    // Valida preservação de WORKOUT_DATABASE (A, B e manutenção/reconstrução de Cardio e OFF)
    assert.ok(workoutDb['A'], 'Treino A deve existir');
    assert.ok(workoutDb['B'], 'Treino B deve existir');
    assert.ok(workoutDb['OFF'], "Rotina 'OFF' não deve ser apagada!");
    assert.equal(workoutDb['OFF'].isOff, true);
    assert.ok(workoutDb['Cardio'], "Rotina 'Cardio' não deve ser apagada!");
    assert.equal(workoutDb['Cardio'].isCardio, true);

    // Valida normalização da agenda semanal (WEEKLY_SCHEDULE_DATA)
    assert.equal(schedule.length, 4);

    // Dia 1: Treino sem cardio
    const d1 = schedule[0];
    assert.equal(d1.type, 'Treino');
    assert.equal(d1.routineKey, 'A');
    assert.equal(d1.hasCardioPost, false);

    // Dia 2: Treino + Cardio
    const d2 = schedule[1];
    assert.equal(d2.type, 'Treino + Cardio');
    assert.equal(d2.routineKey, 'B');
    assert.equal(d2.hasCardioPost, true);
    assert.equal(d2.cardioId, 'cardio_01');
    assert.ok(d2.cardioSession, 'cardioSession deve ser preservado');
    assert.equal(d2.cardioSession.durationMinutes, 30);

    // Dia 3: Off
    const d3 = schedule[2];
    assert.equal(d3.type, 'Off');
    assert.equal(d3.routineKey, 'OFF', "Dias de Off devem mapear routineKey para 'OFF'");

    // Dia 4: Cardio puro
    const d4 = schedule[3];
    assert.equal(d4.type, 'Cardio');
    assert.equal(d4.routineKey, 'Cardio', "Dias de Cardio puro devem mapear routineKey para 'Cardio'");
    assert.ok(d4.cardioSession);
    assert.equal(d4.cardioSession.durationMinutes, 20);
  });

  await t.test('3. Renderização Dinâmica de Cardio (#workoutCardioBlock)', () => {
    const { exp, domElements } = createPatientEnvironment();

    const mockPayload = {
      cardioPrescription: {
        sessions: [
          {
            dayKey: 'd2',
            durationMinutes: 30,
            intensityZone: 'Zona 2',
            bpmTarget: '112-128 bpm',
            protocolName: 'Esteira Zona 2 Anti-Impacto',
            isHiit: false
          }
        ]
      },
      prescribedCardio: {
        id: 'cardio_01',
        name: 'Esteira Zona 2 Anti-Impacto',
        category: 'Zona 2 Base Aeróbica',
        intensityZone: 'Zona 2',
        timeCap: '30 min',
        bpmAlvo: '112-128 bpm',
        foco: 'Oxidação Lipídica & Biogênese Mitocondrial',
        blocks: [
          { name: 'Aquecimento Gradual (5 min)', cadence: 'Vel 5.0 km/h · Sem inclinação', items: ['Ajuste a respiração nasal constante'] },
          { name: 'Fase de Oxidação Lipídica (25 min)', cadence: 'Vel 6.0 km/h · Inclinação 6%', items: ['Mantenha a frequência cardíaca rigorosamente entre 112 e 128 bpm'] }
        ]
      },
      workoutDatabase: {
        'A': { id: 'A', name: 'Treino A', exercises: [{ num: 1, name: 'Supino' }] },
        'B': { id: 'B', name: 'Treino B', exercises: [{ num: 1, name: 'Puxada' }] }
      },
      weeklySchedule: [
        { dayKey: 'd1', dayName: 'Segunda', type: 'Treino', routineKey: 'A', title: 'Treino A', hasCardioPost: false },
        {
          dayKey: 'd2',
          dayName: 'Terça',
          type: 'Treino + Cardio',
          routineKey: 'B',
          title: 'Treino B',
          hasCardioPost: true,
          cardioId: 'cardio_01',
          cardioSession: {
            durationMinutes: 30,
            intensityZone: 'Zona 2',
            bpmTarget: '112-128 bpm',
            protocolName: 'Esteira Zona 2 Anti-Impacto'
          }
        },
        { dayKey: 'd3', dayName: 'Quarta', type: 'Off', routineKey: null, title: 'Descanso' }
      ]
    };

    exp.applyPrescriptionPayload(mockPayload);

    // Caso A: Dia 1 (Treino Puro) -> Bloco de Cardio deve ser OCULTO
    exp.selectScheduleDay(1);
    const cardioBlockEl = domElements['workoutCardioBlock'];
    assert.equal(cardioBlockEl.style.display, 'none', 'Bloco de cardio deve ficar oculto no Dia 1 (sem cardio)');

    // Caso B: Dia 2 (Treino + Cardio) -> Bloco de Cardio deve ser EXIBIDO e dinamicamente populado
    exp.selectScheduleDay(2);
    assert.equal(cardioBlockEl.style.display, 'block', 'Bloco de cardio deve ser exibido no Dia 2 (com cardio)');

    const badgeEl = domElements['cardioBadgeTag'];
    assert.ok(badgeEl.textContent.includes('PÓS-FORÇA') || badgeEl.textContent.includes('DIA 2'), 'Badge deve indicar pós-força e dia');

    const nameEl = domElements['cardioName'];
    assert.equal(nameEl.textContent, 'Cardio 30 min · Zona 2', 'Nome do cardio deve exibir duração e zona prescrita');

    const subEl = domElements['cardioSubtitle'];
    assert.ok(subEl.textContent.includes('Esteira Zona 2 Anti-Impacto'), 'Subtítulo deve conter o nome do protocolo prescrito');
    assert.ok(subEl.textContent.includes('112-128 bpm'), 'Subtítulo deve conter a FC alvo');

    const detailsEl = domElements['cardioDetailsContainer'];
    assert.ok(detailsEl.innerHTML.includes('Aquecimento Gradual (5 min)'), 'Detalhes devem conter o bloco 1 prescrito');
    assert.ok(detailsEl.innerHTML.includes('Fase de Oxidação Lipídica (25 min)'), 'Detalhes devem conter o bloco 2 prescrito');
    assert.ok(detailsEl.innerHTML.includes('Vel 6.0 km/h'), 'Detalhes devem conter as diretrizes reais de cadência prescritas');

    // Não deve haver menção dos 3 blocos estáticos antigos
    assert.ok(!detailsEl.innerHTML.includes('1. Remo Seco (15 min)'), 'Não deve conter o bloco estático legado de Remo Seco');

    // Caso C: Dia 3 (Off) -> Bloco de Cardio deve ser OCULTO
    exp.selectScheduleDay(3);
    assert.equal(cardioBlockEl.style.display, 'none', 'Bloco de cardio deve ficar oculto no Dia 3 (Descanso)');
  });

  await t.test('4. Seleção Correta de Rotinas (Carousel e Schedule)', () => {
    const { exp } = createPatientEnvironment();

    const mockPayload = {
      workoutDatabase: {
        'A': { id: 'A', name: 'Treino A', exercises: [{ num: 1, name: 'Supino' }] }
      },
      weeklySchedule: [
        { dayKey: 'd1', dayName: 'Segunda', type: 'Treino', routineKey: 'A', title: 'Treino A' },
        { dayKey: 'd2', dayName: 'Terça', type: 'Off', routineKey: null, title: 'Descanso' },
        { dayKey: 'd3', dayName: 'Quarta', type: 'Cardio', routineKey: null, title: 'Cardio Livre' }
      ]
    };

    exp.applyPrescriptionPayload(mockPayload);

    // Clica no Dia 2 (Off)
    exp.selectScheduleDay(2);
    assert.equal(exp.getSelectedRoutineKey(), 'OFF', "Selecionar dia Off deve ativar routineKey 'OFF'");
    const curOff = exp.getCurrentRoutine();
    assert.equal(curOff.isOff, true, "Rotina atual deve ter flag isOff: true");
    assert.notEqual(exp.getSelectedRoutineKey(), 'A', "Não deve cair indevidamente no Treino A em dia de descanso!");

    // Clica no Dia 3 (Cardio)
    exp.selectScheduleDay(3);
    assert.equal(exp.getSelectedRoutineKey(), 'Cardio', "Selecionar dia Cardio deve ativar routineKey 'Cardio'");
    const curCardio = exp.getCurrentRoutine();
    assert.equal(curCardio.isCardio, true, "Rotina atual deve ter flag isCardio: true");
  });

  await t.test('5. Cálculo Dinâmico do IDC Diário (calculateDailyIDCValue)', () => {
    const { exp } = createPatientEnvironment();

    const mockPayload = {
      workoutDatabase: {
        'A': { id: 'A', name: 'Treino A', exercises: [{ num: 1, name: 'Supino' }] },
        'B': { id: 'B', name: 'Treino B', exercises: [{ num: 1, name: 'Puxada' }] }
      },
      weeklySchedule: [
        { dayKey: 'd1', dayName: 'Segunda', type: 'Treino', routineKey: 'A', hasCardioPost: false },
        { dayKey: 'd2', dayName: 'Terça', type: 'Treino + Cardio', routineKey: 'B', hasCardioPost: true },
        { dayKey: 'd3', dayName: 'Quarta', type: 'Off', routineKey: null },
        { dayKey: 'd4', dayName: 'Quinta', type: 'Cardio', routineKey: null }
      ]
    };

    exp.applyPrescriptionPayload(mockPayload);
    const pState = exp.getPatientState();

    // Estado base: sem refeições, sem sono, sem água
    pState.meals = [];
    pState.sleepLogged = false;
    pState.waterCurrent = 0;

    // Caso A: Dia Off (Dia 3) -> 30 pontos garantidos para recuperação
    exp.selectScheduleDay(3);
    pState.workoutDone = false;
    pState.cardioDone = false;
    let scoreOff = exp.calculateDailyIDCValue();
    assert.equal(scoreOff, 30, 'Dia Off deve atribuir 30 pontos de recuperação');

    // Caso B: Dia Treino Puro (Dia 1)
    exp.selectScheduleDay(1);
    pState.workoutDone = false;
    assert.equal(exp.calculateDailyIDCValue(), 0, 'Treino não feito = 0 pts');
    pState.workoutDone = true;
    assert.equal(exp.calculateDailyIDCValue(), 30, 'Treino puro feito = 30 pts');

    // Caso C: Dia Treino + Cardio (Dia 2)
    exp.selectScheduleDay(2);
    pState.workoutDone = false;
    pState.cardioDone = false;
    assert.equal(exp.calculateDailyIDCValue(), 0, 'Nada feito = 0 pts');

    pState.workoutDone = true;
    pState.cardioDone = false;
    assert.equal(exp.calculateDailyIDCValue(), 20, 'Apenas treino em dia misto = 20 pts');

    pState.workoutDone = true;
    pState.cardioDone = true;
    assert.equal(exp.calculateDailyIDCValue(), 30, 'Treino + Cardio completos = 30 pts (20+10)');

    // Caso D: Dia Cardio Puro (Dia 4)
    exp.selectScheduleDay(4);
    pState.workoutDone = false;
    pState.cardioDone = false;
    assert.equal(exp.calculateDailyIDCValue(), 0, 'Cardio não feito = 0 pts');

    pState.cardioDone = true;
    assert.equal(exp.calculateDailyIDCValue(), 30, 'Cardio puro feito = 30 pts');
  });

});
