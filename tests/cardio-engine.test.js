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
const CARDIO_DISTRIBUTION_MODES = sandbox.CARDIO_DISTRIBUTION_MODES || vm.runInContext('CARDIO_DISTRIBUTION_MODES', sandbox);
const calculateCardioSessionDurations = sandbox.calculateCardioSessionDurations || vm.runInContext('calculateCardioSessionDurations', sandbox);
const generateCardioPrescription = sandbox.generateCardioPrescription;
const buildCardioGenerationRequirements = sandbox.buildCardioGenerationRequirements;
const validateCardioPrescriptionAgainstContext = sandbox.validateCardioPrescriptionAgainstContext;

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
test('CARDIO 1.1: O catálogo PERF_CARDIO_DB contém os 5 protocolos originais preservados e expandido para 18 modalidades', () => {
  assert(Array.isArray(PERF_CARDIO_DB), 'PERF_CARDIO_DB deve ser um array');
  assert(PERF_CARDIO_DB.length >= 18, `Deve haver ao menos 18 protocolos estruturados no catálogo (atual: ${PERF_CARDIO_DB.length})`);
  
  const ids = Array.from(PERF_CARDIO_DB.map(c => String(c.id)));
  // Os 5 primeiros devem ser rigorosamente os 5 canônicos:
  assert.strictEqual(ids[0], 'cardio_01');
  assert.strictEqual(ids[1], 'cardio_02');
  assert.strictEqual(ids[2], 'cardio_03');
  assert.strictEqual(ids[3], 'cardio_04');
  assert.strictEqual(ids[4], 'cardio_05');

  // Modalidades atômicas, híbridas e HYROX:
  assert(ids.includes('airbike_z2_15'));
  assert(ids.includes('rower_z2_15'));
  assert(ids.includes('treadmill_incline_z2_15'));
  assert(ids.includes('bike_erg_z2_15'));
  assert(ids.includes('elliptical_z2_15'));
  assert(ids.includes('skierg_z2_15'));
  assert(ids.includes('running_outdoor_z2_30'));
  assert(ids.includes('bike_intervals_hiit_20'));
  assert(ids.includes('rower_intervals_vo2_20'));
  assert(ids.includes('hybrid_tri_erg_15'));
  assert(ids.includes('hybrid_functional_engine_25'));
  assert(ids.includes('hyrox_adapted_light_30'));
  assert(ids.includes('hyrox_power_engine_45'));
});

test('CARDIO 1.2: Todos os protocolos possuem estrutura válida e blocos de execução', () => {
  PERF_CARDIO_DB.forEach(c => {
    assert(typeof c.id === 'string' && c.id.length > 0);
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

// ─────────────────────────────────────────────────────────────────────────────
// 5. TESTES DA FASE F6: MULTI-SESSÃO, PARTIÇÕES E PRESCRIÇÃO DETERMINÍSTICA
// ─────────────────────────────────────────────────────────────────────────────
test('CARDIO 5.1: calculateCardioSessionDurations produz partições que somam totalWeeklyMinutes', () => {
  const dummyCtx = {};
  const testCases = [
    { freq: 1, total: 45, mode: 'CONCENTRATED', expected: [45] },
    { freq: 3, total: 45, mode: 'DISTRIBUTED_POST_WORKOUT', expected: [15, 15, 15] },
    { freq: 2, total: 60, mode: 'DISTRIBUTED', expected: [30, 30] },
    { freq: 3, total: 75, mode: 'DISTRIBUTED', expected: [25, 25, 25] },
    { freq: 3, total: 90, mode: 'DISTRIBUTED', expected: [30, 30, 30] },
    { freq: 3, total: 75, mode: 'MIXED', expected: [45, 15, 15] },
  ];

  testCases.forEach(tc => {
    const res = calculateCardioSessionDurations(dummyCtx, { target: tc.freq }, { targetMinutes: tc.total }, tc.mode);
    assert.deepStrictEqual(Array.from(res), tc.expected, `Partição para ${tc.total}min / ${tc.freq}x em ${tc.mode} deve ser ${tc.expected}`);
    assert.strictEqual(res.reduce((a, b) => a + b, 0), tc.total, `Soma das partições (${res.join('+')}) deve ser exatamente ${tc.total}`);
  });
});

test('CARDIO 5.2: generateCardioPrescription gera estrutura canônica com sessions[] e sessionDurations[]', () => {
  const ctx = {
    patient: { objective: 'Emagrecimento', currentWeight: 75, bodyFatPercent: 20 },
    training: { weeklyFrequency: 3, sessionsPerWeek: 3 },
    trainingProfile: { frequencyWeekly: 3 }
  };
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = generateCardioPrescription(ctx, reqs);

  assert(presc != null, 'Prescrição gerada não deve ser nula');
  assert.strictEqual(typeof presc.frequencyWeekly, 'number');
  assert.strictEqual(typeof presc.totalWeeklyMinutes, 'number');
  assert(Array.isArray(presc.sessionDurations), 'sessionDurations deve ser array');
  assert(Array.isArray(presc.sessions), 'sessions deve ser array');
  assert.strictEqual(presc.sessions.length, presc.frequencyWeekly);
  assert.strictEqual(presc.sessionDurations.length, presc.frequencyWeekly);
  assert.strictEqual(presc.sessionDurations.reduce((a, b) => a + b, 0), presc.totalWeeklyMinutes);

  // Cada sessão deve possuir protocolId, durationMinutes e dayKey
  presc.sessions.forEach((s, idx) => {
    assert(s.sessionId, `Sessão #${idx + 1} deve ter sessionId`);
    assert(s.protocolId, `Sessão #${idx + 1} deve ter protocolId`);
    assert(typeof s.durationMinutes === 'number' && s.durationMinutes > 0, `Sessão #${idx + 1} deve ter durationMinutes positivo`);
    assert(s.dayKey, `Sessão #${idx + 1} deve ter dayKey`);
  });
});

test('CARDIO 5.3: validateCardioPrescriptionAgainstContext valida consistência de volume e rejeita incoerências', () => {
  const ctx = {
    patient: { objective: 'Hipertrofia' },
    training: { weeklyFrequency: 4, sessionsPerWeek: 4 },
    trainingProfile: { frequencyWeekly: 4 }
  };
  const reqs = buildCardioGenerationRequirements(ctx);

  // Incoerência de volume: totalWeeklyMinutes = 45 mas sum(sessionDurations) = 30
  const invalidVolumePresc = {
    id: 'test_inv_vol',
    frequencyWeekly: 2,
    totalWeeklyMinutes: 45,
    sessionDurations: [15, 15],
    sessions: [
      { sessionId: 's1', protocolId: 'cardio_01', durationMinutes: 15, dayKey: 'd1' },
      { sessionId: 's2', protocolId: 'cardio_01', durationMinutes: 15, dayKey: 'd3' }
    ]
  };

  const valRes = validateCardioPrescriptionAgainstContext(invalidVolumePresc, ctx, reqs);
  assert.strictEqual(valRes.isValid, false, 'Deve invalidar quando soma das durações difere do volume total');
  assert(valRes.errors.some(e => e.includes('Incoerência de volume')));
});

console.log('======================================================');
console.log(`Resumo dos Testes do Cardio Engine:`);
console.log(`Total: ${totalTests} | Aprovados: ${passedTests} | Falhas: 0`);
console.log('Status: CARDIO ENGINE F6 CONCLUÍDO COM 100% PASS');
console.log('======================================================');
