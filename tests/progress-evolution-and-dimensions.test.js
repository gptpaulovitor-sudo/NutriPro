/**
 * tests/progress-evolution-and-dimensions.test.js
 * 
 * Validação de Evolução e Consistência (7d, 30d, 90d) e Cumprimento por Dimensão (Diário e Geral)
 * no App Disciplina (disciplina/index.html).
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const NutriAxWorkoutCycle = require('../workout-cycle-module.js');

describe('Evolução, Consistência e Dimensões (Progresso)', () => {
  const htmlPath = path.join(__dirname, '..', 'disciplina', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  test('PROG-01: HTML da Aba Progresso possui botões de 7d, 30d e 90d conectados a setScorePeriod', () => {
    assert.match(htmlContent, /id="periodBtn7d"[^>]*onclick="setScorePeriod\(7\)"/);
    assert.match(htmlContent, /id="periodBtn30d"[^>]*onclick="setScorePeriod\(30\)"/);
    assert.match(htmlContent, /id="periodBtn90d"[^>]*onclick="setScorePeriod\(90\)"/);
  });

  test('PROG-02: HTML da Aba Progresso possui anel SVG e texto central dinâmico (não 81% estático)', () => {
    assert.match(htmlContent, /id="globalScoreCenterVal"/);
    assert.match(htmlContent, /id="globalScoreRingVal"/);
    assert.doesNotMatch(htmlContent, /<span\s+class="absolute inset-0 flex items-center justify-center text-sm font-black text-white font-mono">81%<\/span>/);
  });

  test('PROG-03: HTML possui botões e containers de dimensão com IDs próprios (progTabDiarioBtn, progPanelDiario)', () => {
    assert.match(htmlContent, /id="progTabDiarioBtn"[^>]*onclick="switchScoresDimensionTab\('diario'\)"/);
    assert.match(htmlContent, /id="progTabGeralBtn"[^>]*onclick="switchScoresDimensionTab\('geral'\)"/);
    assert.match(htmlContent, /id="progPanelDiario"/);
    assert.match(htmlContent, /id="progPanelGeral"/);
  });

  test('PROG-04: Hero Slide 2 possui IDs dinâmicos para adesão, treinos e streak', () => {
    assert.match(htmlContent, /id="heroProgAdherenceVal"/);
    assert.match(htmlContent, /id="heroProgWorkoutsVal"/);
    assert.match(htmlContent, /id="heroProgStreakVal"/);
  });

  test('PROG-05: Funções JavaScript setScorePeriod, switchScoresDimensionTab e renderScoresBreakdown estão expostas globalmente', () => {
    assert.match(htmlContent, /window\.setScorePeriod\s*=\s*setScorePeriod/);
    assert.match(htmlContent, /window\.switchScoresDimensionTab\s*=\s*switchScoresDimensionTab/);
    assert.match(htmlContent, /window\.renderScoresBreakdown\s*=\s*renderScoresBreakdown/);
    assert.match(htmlContent, /window\.updateHeroProgressStats\s*=\s*updateHeroProgressStats/);
  });

  function createMockDom() {
    const elements = {};
    const getEl = (id) => {
      if (!elements[id]) {
        elements[id] = {
          id,
          style: {},
          classes: [],
          classList: {
            add: (...cls) => { elements[id].classes.push(...cls); },
            remove: (...cls) => { elements[id].classes = elements[id].classes.filter(c => !cls.includes(c)); },
            contains: (cls) => elements[id].classes.includes(cls)
          },
          setAttribute: (k, v) => { elements[id][k] = v; },
          textContent: '',
          innerHTML: '',
          className: ''
        };
      }
      return elements[id];
    };

    const doc = {
      readyState: 'complete',
      addEventListener: () => {},
      getElementById: (id) => getEl(id),
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: (tag) => ({ tag, style: {}, classList: { add: () => {}, remove: () => {} }, setAttribute: () => {} })
    };

    const storage = {};
    const mockLocalStorage = {
      getItem: (k) => storage[k] || null,
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: (k) => { delete storage[k]; }
    };

    return { elements, getEl, doc, mockLocalStorage };
  }

  test('PROG-06: Simulação em Sandbox VM — setScorePeriod(30) atualiza gráfico e texto de média', () => {
    const { elements, getEl, doc, mockLocalStorage } = createMockDom();

    getEl('scoresPeriodAvgDisplay');
    getEl('globalScoreCenterVal');
    getEl('globalScoreRingVal');
    getEl('scoresPeriodTrendDisplay');
    getEl('scoresEvolutionSvg');
    getEl('periodBtn7d');
    getEl('periodBtn30d');
    getEl('periodBtn90d');
    getEl('progPanelDiario');
    getEl('progPanelGeral');
    getEl('progTabDiarioBtn');
    getEl('progTabGeralBtn');
    getEl('heroProgAdherenceVal');
    getEl('heroProgWorkoutsVal');
    getEl('heroProgStreakVal');

    const sandbox = {
      window: {},
      document: doc,
      localStorage: mockLocalStorage,
      NutriAxWorkoutCycle: NutriAxWorkoutCycle,
      addEventListener: () => {},
      setInterval: () => 1,
      clearInterval: () => {},
      setTimeout: () => 1,
      clearTimeout: () => {},
      patientState: {
        scoreIDC: 88,
        workoutDone: true,
        waterCurrent: 3500,
        waterTarget: 4000,
        sleepHours: 8,
        sleepLogged: true,
        sleepQuality: 'good',
        meals: [
          { id: 'm1', done: true, name: 'Almoço', items: [{ done: true }] },
          { id: 'm2', done: true, name: 'Jantar', items: [{ done: true }] }
        ],
        history: {
          '2026-11-04': { scoreIDC: 92, workoutDone: true, waterCurrent: 4000, waterTarget: 4000, sleepHours: 8, sleepLogged: true },
          '2026-11-03': { scoreIDC: 85, workoutDone: true, waterCurrent: 3000, waterTarget: 4000, sleepHours: 7, sleepLogged: true }
        }
      },
      getLocalDateIso: () => '2026-11-05',
      calculateDailyIDCValue: () => 88,
      getTodayFastingState: () => ({ isFastingDay: false }),
      isFoodItemChecked: () => true,
      console: console,
      Math: Math,
      Date: Date
    };

    sandbox.window = sandbox;
    sandbox.window.NutriAxWorkoutCycle = NutriAxWorkoutCycle;
    sandbox.NutriAxWorkoutCycle = NutriAxWorkoutCycle;
    sandbox.window.addEventListener = () => {};

    const scriptMatches = htmlContent.match(/<script>([\s\S]*?)<\/script>/g);
    let targetScript = '';
    scriptMatches.forEach(m => {
      const code = m.replace(/^<script>/, '').replace(/<\/script>$/, '');
      if (code.includes('function renderScoreEvolutionChart') && code.includes('function renderScoresBreakdown')) {
        targetScript = code;
      }
    });

    vm.createContext(sandbox);
    vm.runInContext(targetScript, sandbox);

    sandbox.setScorePeriod(30);

    assert.match(getEl('periodBtn30d').className, /bg-\[#E50914\]/);
    assert.match(getEl('periodBtn7d').className, /text-zinc-400/);

    assert.ok(getEl('scoresPeriodAvgDisplay').textContent.includes('%'));
    assert.ok(getEl('globalScoreCenterVal').textContent.includes('%'));
    assert.notEqual(getEl('globalScoreCenterVal').textContent, '--');

    assert.ok(getEl('scoresEvolutionSvg').innerHTML.includes('<path'));
    assert.ok(getEl('scoresEvolutionSvg').innerHTML.includes('<line'));
  });

  test('PROG-07: Simulação em Sandbox VM — Cumprimento por Dimensão Diário e Geral popula HTML com as dimensões', () => {
    const { elements, getEl, doc, mockLocalStorage } = createMockDom();

    getEl('scoresPeriodAvgDisplay');
    getEl('globalScoreCenterVal');
    getEl('globalScoreRingVal');
    getEl('scoresPeriodTrendDisplay');
    getEl('scoresEvolutionSvg');
    getEl('progPanelDiario');
    getEl('progPanelGeral');
    getEl('progTabDiarioBtn');
    getEl('progTabGeralBtn');
    getEl('heroProgAdherenceVal');
    getEl('heroProgWorkoutsVal');
    getEl('heroProgStreakVal');

    const sandbox = {
      window: {},
      document: doc,
      localStorage: mockLocalStorage,
      NutriAxWorkoutCycle: NutriAxWorkoutCycle,
      addEventListener: () => {},
      setInterval: () => 1,
      clearInterval: () => {},
      setTimeout: () => 1,
      clearTimeout: () => {},
      patientState: {
        scoreIDC: 90,
        workoutDone: true,
        waterCurrent: 4000,
        waterTarget: 4000,
        sleepHours: 8,
        sleepLogged: true,
        sleepQuality: 'good',
        meals: [
          { id: 'm1', done: true, name: 'Almoço', items: [{ done: true }] }
        ],
        history: {
          '2026-11-04': { scoreIDC: 90, workoutDone: true, waterCurrent: 4000, waterTarget: 4000 }
        }
      },
      getLocalDateIso: () => '2026-11-05',
      calculateDailyIDCValue: () => 90,
      getTodayFastingState: () => ({ isFastingDay: false }),
      isFoodItemChecked: () => true,
      console: console,
      Math: Math,
      Date: Date
    };

    sandbox.window = sandbox;
    sandbox.window.NutriAxWorkoutCycle = NutriAxWorkoutCycle;
    sandbox.NutriAxWorkoutCycle = NutriAxWorkoutCycle;
    sandbox.window.addEventListener = () => {};

    const scriptMatches = htmlContent.match(/<script>([\s\S]*?)<\/script>/g);
    let targetScript = '';
    scriptMatches.forEach(m => {
      const code = m.replace(/^<script>/, '').replace(/<\/script>$/, '');
      if (code.includes('function renderScoresBreakdown')) {
        targetScript = code;
      }
    });

    vm.createContext(sandbox);
    vm.runInContext(targetScript, sandbox);

    sandbox.renderScoresBreakdown();

    const diarioHtml = getEl('progPanelDiario').innerHTML;
    assert.ok(diarioHtml.includes('Plano Alimentar'), 'Deve conter Plano Alimentar');
    assert.ok(diarioHtml.includes('Treino &amp; Cardio'), 'Deve conter Treino & Cardio');
    assert.ok(diarioHtml.includes('Hidratação Fracionada'), 'Deve conter Hidratação Fracionada');
    assert.ok(diarioHtml.includes('Sono &amp; Descanso'), 'Deve conter Sono & Descanso');

    const geralHtml = getEl('progPanelGeral').innerHTML;
    assert.ok(geralHtml.includes('Adesão Alimentar Média'), 'Geral deve conter Adesão Alimentar Média');
    assert.ok(geralHtml.includes('Frequência de Treino'), 'Geral deve conter Frequência de Treino');
    assert.ok(geralHtml.includes('Regularidade Hídrica'), 'Geral deve conter Regularidade Hídrica');
    assert.ok(geralHtml.includes('Média de Descanso'), 'Geral deve conter Média de Descanso');

    sandbox.switchScoresDimensionTab('geral');
    assert.ok(getEl('progTabGeralBtn').classes.includes('bg-[#E50914]'));
    assert.ok(getEl('progPanelDiario').classes.includes('hidden'));
  });

  test('PROG-08: Hero Slide 2 atualiza estatísticas reais de ciclo e streak', () => {
    const { elements, getEl, doc, mockLocalStorage } = createMockDom();

    getEl('heroProgAdherenceVal');
    getEl('heroProgWorkoutsVal');
    getEl('heroProgStreakVal');
    getEl('heroProgressoPlayPauseBtn');

    const cycle = NutriAxWorkoutCycle.createWorkoutCycle({
      startDate: '2026-11-01',
      prescribedWeeklyFrequency: 5,
      totalPrescribedWorkouts: 20
    });

    const sandbox = {
      window: {},
      document: doc,
      localStorage: mockLocalStorage,
      NutriAxWorkoutCycle: NutriAxWorkoutCycle,
      addEventListener: () => {},
      setInterval: () => 1,
      clearInterval: () => {},
      setTimeout: () => 1,
      clearTimeout: () => {},
      getLocalDateIso: () => '2026-11-05',
      testCycle: cycle,
      Math: Math,
      Date: Date,
      console: console
    };

    sandbox.window = sandbox;
    sandbox.window.NutriAxWorkoutCycle = NutriAxWorkoutCycle;
    sandbox.NutriAxWorkoutCycle = NutriAxWorkoutCycle;
    sandbox.window.addEventListener = () => {};

    const scriptMatches = htmlContent.match(/<script>([\s\S]*?)<\/script>/g);
    let targetScript = '';
    scriptMatches.forEach(m => {
      const code = m.replace(/^<script>/, '').replace(/<\/script>$/, '');
      if (code.includes('function updateHeroProgressStats')) {
        targetScript = code;
      }
    });

    vm.createContext(sandbox);
    vm.runInContext(targetScript, sandbox);

    // Configura o estado do paciente diretamente no contexto VM
    vm.runInContext(`
      patientState.workoutCycle = testCycle;
      patientState.workoutDone = true;
      patientState.history = {
        '2026-11-04': { workoutDone: true, scoreIDC: 90 },
        '2026-11-03': { workoutDone: true, scoreIDC: 80 }
      };
      updateHeroProgressStats();
    `, sandbox);

    // 3 treinos de 20 = 15% de aderência do ciclo
    assert.equal(getEl('heroProgAdherenceVal').textContent, '15%');
    assert.equal(getEl('heroProgWorkoutsVal').textContent, '3 / 20');
    assert.equal(getEl('heroProgStreakVal').textContent, '3 dias');
  });
});
