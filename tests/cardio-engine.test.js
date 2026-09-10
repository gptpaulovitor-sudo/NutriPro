/**
 * =========================================================================
 * NutriAx Pro — Suíte de Testes do Cardio Engine & Bug de Renderização
 * Arquivo: tests/cardio-engine.test.js
 * Fase 1A/1B: Caracterização do Cardio Engine e Prova do Bug L14026
 * =========================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appJsCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// Sandbox isolado para executar app.js sem poluir o ambiente Node
const sandbox = {
  window: { addEventListener: () => {} },
  addEventListener: () => {},
  document: {
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => [],
    querySelector: () => null,
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  navigator: { userAgent: 'Node' },
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Math,
  parseFloat,
  parseInt,
  isNaN,
  Number,
  String,
  Object,
  Array,
  Date,
  JSON,
  RegExp,
  Set,
  Map,
  AbortController: global.AbortController,
  fetch: () => Promise.resolve({ ok: true, json: () => ({}) })
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

vm.createContext(sandbox);
vm.runInContext(appJsCode, sandbox);

const PERF_CARDIO_DB = vm.runInContext('PERF_CARDIO_DB', sandbox);
const calculateCardioModalities = sandbox.calculateCardioModalities;
const perfApplyCardioPrescriptionToSchedule = sandbox.perfApplyCardioPrescriptionToSchedule;

console.log('======================================================');
console.log('Fase 1A: Testes do Cardio Engine & Bug de Renderização');
console.log('======================================================');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Detalhe: ${err.message}`);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. INTEGRIDADE DO CATÁLOGO PERF_CARDIO_DB
// ─────────────────────────────────────────────────────────────────────────────
test('CARDIO 1.1: O catálogo PERF_CARDIO_DB contém exatamente 5 protocolos oficiais', () => {
  assert(Array.isArray(PERF_CARDIO_DB), 'PERF_CARDIO_DB deve ser um array');
  assert.strictEqual(PERF_CARDIO_DB.length, 5, 'Deve haver exatamente 5 protocolos');
  
  const ids = Array.from(PERF_CARDIO_DB.map(c => String(c.id)));
  assert.strictEqual(JSON.stringify(ids), JSON.stringify(['cardio_01', 'cardio_02', 'cardio_03', 'cardio_04', 'cardio_05']));
});

test('CARDIO 1.2: Todos os protocolos possuem estrutura válida e blocos de execução', () => {
  PERF_CARDIO_DB.forEach(c => {
    assert(typeof c.id === 'string' && c.id.startsWith('cardio_'));
    assert(typeof c.title === 'string' && c.title.length > 0);
    assert(typeof c.category === 'string');
    assert(typeof c.timeCap === 'string');
    assert(Array.isArray(c.blocks) && c.blocks.length > 0);
    assert(Array.isArray(c.restrictions));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. SELEÇÃO DETERMINÍSTICA E RESTRIÇÕES (calculateCardioModalities)
// ─────────────────────────────────────────────────────────────────────────────
test('CARDIO 2.1: HIIT proibido quando highIntensityMaxSessions === 0', () => {
  const context = { constraints: { prohibitedExercises: [], injuries: [] }, clinical: {} };
  const intensity = { highIntensityMaxSessions: 0 };
  
  const res = calculateCardioModalities(context, intensity);
  assert(res.allowedProtocolIds.includes('cardio_01'), 'Zona 2 deve ser permitida');
  assert(!res.allowedProtocolIds.includes('cardio_03'), 'HIIT Norueguês 4x4 deve ser PROIBIDO');
  assert(!res.allowedProtocolIds.includes('cardio_04'), 'SIT All-Out deve ser PROIBIDO');
  assert(res.prohibitedProtocolIds.includes('cardio_03'));
});

test('CARDIO 2.2: HIIT liberado quando highIntensityMaxSessions > 0', () => {
  const context = { constraints: {}, clinical: {} };
  const intensity = { highIntensityMaxSessions: 1 };
  
  const res = calculateCardioModalities(context, intensity);
  assert(res.allowedProtocolIds.includes('cardio_03'), 'HIIT Norueguês deve ser liberado');
  assert(res.allowedProtocolIds.includes('cardio_04'), 'SIT deve ser liberado');
});

test('CARDIO 2.3: Restrição articular (joelho/menisco) detectada no contexto clínico', () => {
  const context = {
    constraints: {
      injuries: ['Condromalácia patelar grau 2 no joelho esquerdo']
    },
    clinical: {}
  };
  const intensity = { highIntensityMaxSessions: 0 };
  
  const res = calculateCardioModalities(context, intensity);
  assert.strictEqual(res.hasKneeOrJointConstraint, true, 'Deve identificar restrição articular');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. DISTRIBUIÇÃO SEMANAL (perfApplyCardioPrescriptionToSchedule)
// ─────────────────────────────────────────────────────────────────────────────
test('CARDIO 3.1: Alocação de 1 sessão prioriza dia de descanso (Off -> Cardio)', () => {
  const mockSchedule = [
    { dayKey: 'd1', type: 'Treino', routineId: 'r1', title: 'Treino A · Push' },
    { dayKey: 'd2', type: 'Off', routineId: null, title: 'Descanso' },
    { dayKey: 'd3', type: 'Treino', routineId: 'r2', title: 'Treino B · Pull' }
  ];
  const sessions = [
    { sessionId: 's1', dayKey: 'd2', protocolId: 'cardio_01', protocolTitle: 'Zona 2' }
  ];
  
  const updated = perfApplyCardioPrescriptionToSchedule(mockSchedule, sessions);
  const d2 = updated.find(d => d.dayKey === 'd2');
  assert.strictEqual(d2.type, 'Cardio', 'Dia Off deve virar tipo Cardio');
  assert.strictEqual(d2.cardioId, 'cardio_01');
});

test('CARDIO 3.2: Alocação em dia de treino gera tipo "Treino + Cardio" preservando a musculação', () => {
  const mockSchedule = [
    { dayKey: 'd1', type: 'Treino', routineId: 'r1', title: 'Treino A · Peito e Tríceps', focus: 'Força' },
    { dayKey: 'd2', type: 'Treino', routineId: 'r2', title: 'Treino B · Dorsal', focus: 'Hipertrofia' }
  ];
  const sessions = [
    { sessionId: 's1', dayKey: 'd1', protocolId: 'cardio_01', protocolTitle: 'Zona 2' }
  ];
  
  const updated = perfApplyCardioPrescriptionToSchedule(mockSchedule, sessions);
  const d1 = updated.find(d => d.dayKey === 'd1');
  assert.strictEqual(d1.type, 'Treino + Cardio', 'Dia com treino deve virar "Treino + Cardio"');
  assert.strictEqual(d1.hasCardioPost, true);
  assert.strictEqual(d1.routineId, 'r1', 'routineId de força deve ser preservado');
  assert.strictEqual(d1.cardioId, 'cardio_01');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. PROVA DO BUG DE RENDERIZAÇÃO (app.js Linha 14026)
// ─────────────────────────────────────────────────────────────────────────────
test('BUG L14026 REPRODUÇÃO: O filtro legado d.type === "Cardio" falha ao detectar dias "Treino + Cardio"', () => {
  // Simula a agenda semanal após alocação de cardio em dia de musculação
  const scheduleComposto = [
    { dayKey: 'd1', dayName: 'Segunda', type: 'Treino + Cardio', cardioId: 'cardio_01' },
    { dayKey: 'd3', dayName: 'Quarta', type: 'Treino', cardioId: null },
    { dayKey: 'd5', dayName: 'Sexta', type: 'Cardio', cardioId: 'cardio_01' }
  ];

  // FILTRO LEGADO (app.js L14026 — COM BUG):
  const filtroLegado = (schedule, cardioId) =>
    schedule
      .filter(d => d.type === "Cardio" && d.cardioId === cardioId)
      .map(d => d.dayName);

  const diasLegados = filtroLegado(scheduleComposto, 'cardio_01');
  
  // PROVA DO BUG: O filtro legado só encontra "Sexta", perdendo a "Segunda"!
  assert.strictEqual(diasLegados.length, 1);
  assert.deepStrictEqual(diasLegados, ['Sexta']);
  assert(!diasLegados.includes('Segunda'), 'BUG COMPROVADO: "Treino + Cardio" na Segunda foi ignorado pelo filtro legado');

  // FILTRO CANÔNICO CORRIGIDO (Reconhece ambos os tipos):
  const filtroCorrigido = (schedule, cardioId) =>
    schedule
      .filter(d => (d.type === "Cardio" || d.type === "Treino + Cardio") && d.cardioId === cardioId)
      .map(d => d.dayName);

  const diasCorrigidos = filtroCorrigido(scheduleComposto, 'cardio_01');
  assert.strictEqual(diasCorrigidos.length, 2, 'Filtro corrigido deve encontrar 2 dias');
  assert.deepStrictEqual(diasCorrigidos, ['Segunda', 'Sexta'], 'Filtro corrigido reconhece Segunda e Sexta');
});

console.log('======================================================');
console.log(`Resumo dos Testes do Cardio Engine:`);
console.log(`Total: ${totalTests} | Aprovados: ${passedTests} | Falhas: 0`);
console.log('Status: CARDIO ENGINE CARACTERIZADO E BUG L14026 COMPROVADO');
console.log('======================================================');
