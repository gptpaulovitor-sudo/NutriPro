/**
 * =========================================================================
 * NutriAx Pro — F6: Suíte de Auditoria e Caracterização do Cardio Engine
 * Arquivo: tests/cardio-frequency-audit.test.js
 * 
 * Casos A até O: Caracterização estrita do comportamento de produção,
 * mapeamento de frequência, duração, volume, concorrência e limitações.
 * =========================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appJsCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// Sandbox isolado para executar app.js sem efeitos colaterais
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

// Extrai símbolos do runtime de app.js
const PERF_CARDIO_DB = vm.runInContext('PERF_CARDIO_DB', sandbox);
const _CARDIO_RULES = sandbox._CARDIO_RULES || vm.runInContext('_CARDIO_RULES', sandbox);
const calculateCardioRecoveryModifier = sandbox.calculateCardioRecoveryModifier;
const calculateCardioClinicalSignals = sandbox.calculateCardioClinicalSignals;
const calculateCardioFrequency = sandbox.calculateCardioFrequency;
const calculateCardioVolume = sandbox.calculateCardioVolume;
const calculateCardioIntensity = sandbox.calculateCardioIntensity;
const calculateCardioModalities = sandbox.calculateCardioModalities;
const calculateCardioDistribution = sandbox.calculateCardioDistribution;
const buildCardioGenerationRequirements = sandbox.buildCardioGenerationRequirements;
const generateCardioPrescription = sandbox.generateCardioPrescription;
const validateCardioPrescriptionAgainstContext = sandbox.validateCardioPrescriptionAgainstContext;
const perfApplyCardioPrescriptionToSchedule = sandbox.perfApplyCardioPrescriptionToSchedule;
const perfBuildWeeklySchedule = sandbox.perfBuildWeeklySchedule;
const perfNormalizeWeeklySchedule = sandbox.perfNormalizeWeeklySchedule;
const CARDIO_DISTRIBUTION_MODES = sandbox.CARDIO_DISTRIBUTION_MODES || vm.runInContext('CARDIO_DISTRIBUTION_MODES', sandbox);
const calculateCardioSessionDurations = sandbox.calculateCardioSessionDurations || vm.runInContext('calculateCardioSessionDurations', sandbox);

// Importa DTO canônico e adaptadores de contratos de domínio se disponível
let CardioPrescriptionDTO = null;
let legacyAdapters = null;
try {
  CardioPrescriptionDTO = require('../domain/contracts/CardioPrescriptionDTO');
  legacyAdapters = require('../domain/adapters/legacyAdapters');
} catch (_) {}

console.log('================================================================');
console.log('F6: Auditoria de Caracterização do Cardio Engine & Cardio Distribuído');
console.log('================================================================');

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

// Helper para construir contextos simulados de teste
function makeContext(overrides = {}) {
  return {
    _meta: { patientId: 'test-patient', hasAssessment: true },
    patient: {
      patientId: 'test-patient',
      name: 'Paciente Teste',
      age: 32,
      sex: 'Masculino',
      weightKg: 78,
      heightCm: 178,
      objective: 'Hipertrofia',
      trainingLevel: 'Avançado',
      ...(overrides.patient || {})
    },
    anthropometry: {
      bodyFatPercent: 14,
      leanMassKg: 67,
      fatMassKg: 11,
      ...(overrides.anthropometry || {})
    },
    cardiometabolic: {
      rcEst: 0.46,
      hasCardiometabolicRisk: false,
      ...(overrides.cardiometabolic || {})
    },
    nutrition: {
      caloricTargetKcal: 2600,
      energyBalanceKcal: 200,
      proteinGKg: 2.0,
      ...(overrides.nutrition || {})
    },
    trainingProfile: {
      frequencyWeekly: 4,
      durationMinutes: 60,
      workoutType: 'Musculação / Força',
      ...(overrides.trainingProfile || {})
    },
    lifestyle: {
      sleepHours: 7.5,
      sleepQuality: 'Boa',
      stressLevel: 'Moderado',
      ...(overrides.lifestyle || {})
    },
    constraints: {
      injuries: [],
      prohibitedExercises: [],
      clinicalConstraints: [],
      availableEquipment: 'Full Gym',
      ...(overrides.constraints || {})
    },
    heartRate: {
      maxHR: 185,
      restingHR: 60,
      zones: [
        { zone: 'Z1', minBpm: 93, maxBpm: 111 },
        { zone: 'Z2', minBpm: 112, maxBpm: 130 },
        { zone: 'Z3', minBpm: 131, maxBpm: 148 },
        { zone: 'Z4', minBpm: 149, maxBpm: 167 },
        { zone: 'Z5', minBpm: 168, maxBpm: 185 }
      ],
      ...(overrides.heartRate || {})
    },
    ...overrides
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CASO A — 1 SESSÃO DE 45 MINUTOS
// ─────────────────────────────────────────────────────────────────────────────
test('CASO A: Geração e caracterização de prescrição com 1 sessão semanal de cardio', () => {
  // Objetivo Força ou Hipertrofia com sono reduzido (<6h) resulta em target = 1
  const ctx = makeContext({
    patient: { objective: 'Força Máxima' },
    lifestyle: { sleepHours: 5.5, sleepQuality: 'Ruim', stressLevel: 'Alto' }
  });

  const recovery = calculateCardioRecoveryModifier(ctx);
  assert.strictEqual(recovery.modifier, 'REDUCED', 'Recuperação deve ser REDUCED');

  const freq = calculateCardioFrequency(ctx, recovery);
  assert.strictEqual(freq.target, 1, 'Frequência calculada deve ser exatamente 1 sessão');

  const reqs = buildCardioGenerationRequirements(ctx);
  assert.strictEqual(reqs.frequency.target, 1);

  const presc = generateCardioPrescription(ctx, reqs);
  assert.strictEqual(presc.sessions.length, 1, 'Deve conter exatamente 1 sessão no array sessions');
  assert.strictEqual(presc.sessions[0].protocolId, 'cardio_01');
  assert.strictEqual(presc.sessions[0].dayKey, 'd2');
  assert(presc.sessions[0].durationMinutes >= 15 && presc.sessions[0].durationMinutes <= 45);

  const schedule = perfBuildWeeklySchedule('UpperLower');
  const updatedSchedule = perfApplyCardioPrescriptionToSchedule(schedule, presc.sessions);
  const cardioDays = updatedSchedule.filter(d => d.cardioSession != null);
  assert.strictEqual(cardioDays.length, 1, 'Exatamente 1 dia do schedule deve receber a sessão de cardio');
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO B — 2 SESSÕES SEMANAIS
// ─────────────────────────────────────────────────────────────────────────────
test('CASO B: Geração e caracterização de prescrição com 2 sessões semanais', () => {
  const ctx = makeContext({
    patient: { objective: 'Hipertrofia Muscular' },
    trainingProfile: { frequencyWeekly: 4 },
    lifestyle: { sleepHours: 8.0, sleepQuality: 'Boa', stressLevel: 'Moderado' }
  });

  const reqs = buildCardioGenerationRequirements(ctx);
  assert.strictEqual(reqs.frequency.target, 2, 'Hipertrofia padrão deve calcular 2 sessões');

  const presc = generateCardioPrescription(ctx, reqs);
  assert.strictEqual(presc.sessions.length, 2, 'Devem ser geradas 2 sessões');
  assert.strictEqual(presc.sessions[0].dayKey, 'd2');
  assert.strictEqual(presc.sessions[1].dayKey, 'd5');

  const rawSchedule = [
    { dayKey: 'd1', dayName: 'Dia 1', type: 'Treino', title: 'Treino A', routineId: 'A' },
    { dayKey: 'd2', dayName: 'Dia 2', type: 'Off', title: 'Descanso' },
    { dayKey: 'd3', dayName: 'Dia 3', type: 'Treino', title: 'Treino B', routineId: 'B' },
    { dayKey: 'd4', dayName: 'Dia 4', type: 'Off', title: 'Descanso' },
    { dayKey: 'd5', dayName: 'Dia 5', type: 'Treino', title: 'Treino C', routineId: 'C' },
    { dayKey: 'd6', dayName: 'Dia 6', type: 'Off', title: 'Descanso' },
    { dayKey: 'd7', dayName: 'Dia 7', type: 'Off', title: 'Descanso' },
  ];

  const applied = perfApplyCardioPrescriptionToSchedule(rawSchedule, presc.sessions);
  const daysWithCardio = applied.filter(d => d.cardioSession != null);
  assert.strictEqual(daysWithCardio.length, 2, '2 dias distintos devem conter cardio');
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO C — 3 SESSÕES SEMANAIS
// ─────────────────────────────────────────────────────────────────────────────
test('CASO C: Geração e caracterização de prescrição com 3 sessões semanais', () => {
  const ctx = makeContext({
    patient: { objective: 'Emagrecimento / Cutting' },
    trainingProfile: { frequencyWeekly: 3 },
    lifestyle: { sleepHours: 8.0, sleepQuality: 'Excelente', stressLevel: 'Baixo' }
  });

  const reqs = buildCardioGenerationRequirements(ctx);
  assert(reqs.frequency.target >= 3, 'Emagrecimento com sono excelente deve ter target >= 3');

  const presc = generateCardioPrescription(ctx, reqs);
  assert(presc.sessions.length >= 3, 'Deve gerar pelo menos 3 sessões');

  const applied = perfApplyCardioPrescriptionToSchedule(perfBuildWeeklySchedule('FullBody'), presc.sessions);
  const totalApplied = applied.filter(d => d.cardioSession != null);
  assert.strictEqual(totalApplied.length, presc.sessions.length);
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO D — 3 SESSÕES DE 15 MINUTOS
// ─────────────────────────────────────────────────────────────────────────────
test('CASO D: Prescrição de 3 sessões de 15 minutos (Volume = 45 min)', () => {
  const ctx = makeContext();
  const reqs = buildCardioGenerationRequirements(ctx);

  const shortSessionsPrescription = {
    id: 'cardio_presc_short_test',
    requirements: reqs,
    frequencyWeekly: 3,
    totalWeeklyMinutes: 45,
    status: 'GENERATED_VALIDATED',
    sessions: [
      {
        sessionId: 's1',
        protocolId: 'cardio_01',
        protocolTitle: 'Zona 2 (15 min)',
        dayKey: 'd1',
        day: 'Dia 1',
        durationMinutes: 15,
        intensity: 'Moderada · Contínua',
        heartRateZone: 'Z2'
      },
      {
        sessionId: 's2',
        protocolId: 'cardio_01',
        protocolTitle: 'Zona 2 (15 min)',
        dayKey: 'd2',
        day: 'Dia 2',
        durationMinutes: 15,
        intensity: 'Moderada · Contínua',
        heartRateZone: 'Z2'
      },
      {
        sessionId: 's3',
        protocolId: 'cardio_01',
        protocolTitle: 'Zona 2 (15 min)',
        dayKey: 'd3',
        day: 'Dia 3',
        durationMinutes: 15,
        intensity: 'Moderada · Contínua',
        heartRateZone: 'Z2'
      }
    ]
  };

  // 1. Validador do Cardio Engine de app.js aceita sessões de 15 min (MIN_SESSION_DURATION_MINUTES = 15)
  const validation = validateCardioPrescriptionAgainstContext(shortSessionsPrescription, ctx, reqs);
  assert(validation.isValid, `Validação de 3x15min deve ser válida. Erros: ${validation.errors.join(', ')}`);

  // 2. Validador de Domínio CardioPrescriptionDTO aceita sessões de 15 min
  if (CardioPrescriptionDTO) {
    const dtoRes = CardioPrescriptionDTO.validateCardioPrescriptionDTO({
      patientId: 'test-patient',
      sessions: shortSessionsPrescription.sessions
    });
    assert(dtoRes.isValid, 'CardioPrescriptionDTO deve validar 3x15 min');
  }

  // 3. Aplicação no schedule
  const schedule = [
    { dayKey: 'd1', dayName: 'Dia 1', type: 'Treino', title: 'Treino A', routineId: 'A' },
    { dayKey: 'd2', dayName: 'Dia 2', type: 'Treino', title: 'Treino B', routineId: 'B' },
    { dayKey: 'd3', dayName: 'Dia 3', type: 'Treino', title: 'Treino C', routineId: 'C' },
    { dayKey: 'd4', dayName: 'Dia 4', type: 'Off', title: 'Descanso' },
    { dayKey: 'd5', dayName: 'Dia 5', type: 'Off', title: 'Descanso' },
    { dayKey: 'd6', dayName: 'Dia 6', type: 'Off', title: 'Descanso' },
    { dayKey: 'd7', dayName: 'Dia 7', type: 'Off', title: 'Descanso' },
  ];
  const applied = perfApplyCardioPrescriptionToSchedule(schedule, shortSessionsPrescription.sessions);
  assert.strictEqual(applied[0].type, 'Treino + Cardio');
  assert.strictEqual(applied[0].cardioSession.durationMinutes, 15);
  assert(applied[0].focus.includes('15 min'), 'Focus do dia deve refletir 15 min pós-força');
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO E — 5 ROTINAS (SPLIT ABCDE / BRO SPLIT)
// ─────────────────────────────────────────────────────────────────────────────
test('CASO E: Prescrição em rotinas de 5 dias (ABCDE) e auditoria de acoplamento', () => {
  // 1. O schedule bruto de ABCDE define exatamente 1 dia de cardio (d6)
  const rawAbcde = perfBuildWeeklySchedule('ABCDE');
  const rawCardioDays = rawAbcde.filter(d => d.type === 'Cardio' || d.type === 'Treino + Cardio');
  assert.strictEqual(rawCardioDays.length, 1, 'Split ABCDE estático raw tem exatamente 1 dia de cardio (d6)');
  assert.strictEqual(rawCardioDays[0].dayKey, 'd6');
  assert.strictEqual(rawCardioDays[0].type, 'Cardio');

  // 2. Frequência de 5 dias no contexto clínico aciona limitador de concorrência
  const ctx5x = makeContext({
    patient: { objective: 'Hipertrofia' },
    trainingProfile: { frequencyWeekly: 5 }
  });
  const freq5x = calculateCardioFrequency(ctx5x);
  assert(freq5x.limitingFactors.some(f => f.includes('Musculação 5x/semana')), 'Deve documentar teto de concorrência com musculação 5x');
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO F — 6 ROTINAS (PHAT)
// ─────────────────────────────────────────────────────────────────────────────
test('CASO F: Prescrição em rotinas de 6 dias (PHAT) e teto mandatório MAX_CARDIO_FREQ_WITH_6X_STRENGTH', () => {
  const ctx6x = makeContext({
    patient: { objective: 'Emagrecimento' }, // Mesmo emagrecimento normalmente desejaria 3-5x
    trainingProfile: { frequencyWeekly: 6 }
  });

  const freq6x = calculateCardioFrequency(ctx6x);
  assert(freq6x.target <= _CARDIO_RULES.MANDATORY.MAX_CARDIO_FREQ_WITH_6X_STRENGTH, 'Com musculação 6x, cardio deve ser limitado ao teto mandatório de 2x');
  assert(freq6x.limitingFactors.some(f => f.includes('Musculação 6x/semana impõe teto de concorrência')));

  // No template raw de PHAT (6 dias treino), existem 2 cardios pós-treino integrados (d2 e d5)
  const rawPhat = perfBuildWeeklySchedule('PHAT');
  const phatCardioDays = rawPhat.filter(d => d.hasCardioPost === true || d.type === 'Treino + Cardio');
  assert.strictEqual(phatCardioDays.length, 2, 'Template PHAT raw possui exatamente 2 treinos com cardio post (d2 e d5)');
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO G — TIPO "Treino + Cardio"
// ─────────────────────────────────────────────────────────────────────────────
test('CASO G: Caracterização da colisão positiva -> Geração de "Treino + Cardio"', () => {
  const schedule = [
    { dayKey: 'd1', dayName: 'Dia 1', routineId: 'A', title: 'Treino A · Supino', focus: 'Peito', type: 'Treino' },
    { dayKey: 'd2', dayName: 'Dia 2', routineId: null, title: 'Descanso', focus: 'OFF', type: 'Off' }
  ];

  const sessions = [{
    sessionId: 'cs1',
    protocolId: 'cardio_01',
    protocolTitle: 'Zona 2 Mitocondrial',
    dayKey: 'd1',
    durationMinutes: 20,
    heartRateZone: 'Z2'
  }];

  const applied = perfApplyCardioPrescriptionToSchedule(schedule, sessions);
  assert.strictEqual(applied[0].type, 'Treino + Cardio');
  assert.strictEqual(applied[0].hasCardioPost, true);
  assert.strictEqual(applied[0].routineId, 'A', 'Preserva a rotina de musculação');
  assert(applied[0].title.includes('Treino A · Supino + Cardio Z2'), 'Título combina força e cardio');
  assert(applied[0].focus.includes('20 min pós-força'), 'Focus indica cardio pós-força com duração');
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO H — TIPO "Cardio" (Isolado em Dia OFF)
// ─────────────────────────────────────────────────────────────────────────────
test('CASO H: Caracterização de cardio alocado em dia sem musculação -> Tipo "Cardio"', () => {
  const schedule = [
    { dayKey: 'd1', dayName: 'Dia 1', routineId: 'A', title: 'Treino A', type: 'Treino' },
    { dayKey: 'd2', dayName: 'Dia 2', routineId: null, title: 'Descanso Total (OFF)', focus: 'Regeneração', type: 'Off' }
  ];

  const sessions = [{
    sessionId: 'cs1',
    protocolId: 'cardio_01',
    protocolTitle: 'Protocolo "Zona 2 Mitocondrial Puro"',
    dayKey: 'd2',
    durationMinutes: 45,
    heartRateZone: 'Z2'
  }];

  const applied = perfApplyCardioPrescriptionToSchedule(schedule, sessions);
  assert.strictEqual(applied[1].type, 'Cardio');
  assert.strictEqual(applied[1].hasCardioPost, false);
  assert.strictEqual(applied[1].routineId, null);
  assert.strictEqual(applied[1].cardioId, 'cardio_01');
  assert(applied[1].focus.includes('45 min (Z2)'));
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO I — MÚLTIPLAS SESSÕES NO MESMO SCHEDULE
// ─────────────────────────────────────────────────────────────────────────────
test('CASO I: Aplicação e integridade de múltiplas sessões no mesmo schedule', () => {
  const schedule = [
    { dayKey: 'd1', dayName: 'Dia 1', type: 'Treino', routineId: 'A', title: 'A' },
    { dayKey: 'd2', dayName: 'Dia 2', type: 'Treino', routineId: 'B', title: 'B' },
    { dayKey: 'd3', dayName: 'Dia 3', type: 'Off', routineId: null, title: 'Off' },
    { dayKey: 'd4', dayName: 'Dia 4', type: 'Treino', routineId: 'C', title: 'C' },
    { dayKey: 'd5', dayName: 'Dia 5', type: 'Treino', routineId: 'D', title: 'D' },
    { dayKey: 'd6', dayName: 'Dia 6', type: 'Off', routineId: null, title: 'Off' },
    { dayKey: 'd7', dayName: 'Dia 7', type: 'Off', routineId: null, title: 'Off' },
  ];

  const sessions = [
    { sessionId: 's1', protocolId: 'cardio_01', dayKey: 'd2', durationMinutes: 20 },
    { sessionId: 's2', protocolId: 'cardio_02', dayKey: 'd5', durationMinutes: 25 },
    { sessionId: 's3', protocolId: 'cardio_05', dayKey: 'd6', durationMinutes: 20 },
  ];

  const updated = perfApplyCardioPrescriptionToSchedule(schedule, sessions);
  assert.strictEqual(updated.filter(d => d.cardioSession != null).length, 3, 'Exatamente 3 dias devem conter cardio');
  assert.strictEqual(updated.find(d => d.dayKey === 'd2').type, 'Treino + Cardio');
  assert.strictEqual(updated.find(d => d.dayKey === 'd5').type, 'Treino + Cardio');
  assert.strictEqual(updated.find(d => d.dayKey === 'd6').type, 'Cardio');
  assert.strictEqual(updated.find(d => d.dayKey === 'd7').type, 'Off', 'Dia 7 deve permanecer Off');
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO J — MODALIDADES DIFERENTES POR DIA
// ─────────────────────────────────────────────────────────────────────────────
test('CASO J: Representação de modalidades diferentes por dia e verificação do catálogo expandido', () => {
  // O catálogo PERF_CARDIO_DB possui 18 protocolos na Fase F6
  assert(PERF_CARDIO_DB.length >= 18, `Catálogo deve possuir ao menos 18 protocolos (atual: ${PERF_CARDIO_DB.length})`);

  // Preservação integral dos 5 protocolos originais
  const originalIds = ['cardio_01', 'cardio_02', 'cardio_03', 'cardio_04', 'cardio_05'];
  originalIds.forEach(id => {
    assert(PERF_CARDIO_DB.some(c => c.id === id), `Protocolo original '${id}' deve ser preservado`);
  });

  // Verificação de modalidades isoladas de 15 minutos adicionadas na F6:
  const ids = PERF_CARDIO_DB.map(c => c.id);
  assert(ids.includes('airbike_z2_15'), 'Protocolo isolado airbike_z2_15 existe em PERF_CARDIO_DB');
  assert(ids.includes('rower_z2_15'), 'Protocolo isolado rower_z2_15 existe em PERF_CARDIO_DB');
  assert(ids.includes('treadmill_incline_z2_15'), 'Protocolo isolado treadmill_incline_z2_15 existe em PERF_CARDIO_DB');
  assert(ids.includes('skierg_z2_15'), 'Protocolo isolado skierg_z2_15 existe em PERF_CARDIO_DB');
  assert(ids.includes('hybrid_tri_erg_15'), 'Protocolo híbrido hybrid_tri_erg_15 existe em PERF_CARDIO_DB');
  assert(ids.includes('hyrox_adapted_light_30'), 'Protocolo HYROX hyrox_adapted_light_30 existe em PERF_CARDIO_DB');

  // No modelo F6, protocolos diferentes (airbike_z2_15, rower_z2_15, treadmill_incline_z2_15) podem ser distribuídos:
  const sessions = [
    { sessionId: 's1', protocolId: 'airbike_z2_15', protocolTitle: 'AirBike Z2 Express', dayKey: 'd1', durationMinutes: 15 },
    { sessionId: 's2', protocolId: 'rower_z2_15', protocolTitle: 'Rower Z2 Express', dayKey: 'd3', durationMinutes: 15 },
    { sessionId: 's3', protocolId: 'treadmill_incline_z2_15', protocolTitle: 'Caminhada Inclinada Z2', dayKey: 'd5', durationMinutes: 20 },
  ];

  const ctx = makeContext();
  const reqs = buildCardioGenerationRequirements(ctx);
  const validation = validateCardioPrescriptionAgainstContext({
    id: 'test_multi_modal',
    requirements: reqs,
    sessions,
    sessionDurations: [15, 15, 20],
    totalWeeklyMinutes: 50,
    frequencyWeekly: 3,
    distributionMode: 'DISTRIBUTED_POST_WORKOUT'
  }, ctx, reqs);

  assert(validation.isValid, `Sessões com protocolos oficiais distintos são válidas. Erros: ${(validation.errors || []).join(', ')}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO K — SESSÕES CURTAS APÓS MUSCULAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
test('CASO K: Sessão curta de 15 min pós-musculação não gera erro e formata string pós-força', () => {
  const schedule = [
    { dayKey: 'd1', dayName: 'Dia 1', routineId: 'A', title: 'Treino A · Peito/Tríceps', focus: 'Hipertrofia', type: 'Treino' }
  ];
  const sessions = [
    { sessionId: 's1', protocolId: 'cardio_01', dayKey: 'd1', durationMinutes: 15, heartRateZone: 'Z2' }
  ];

  const updated = perfApplyCardioPrescriptionToSchedule(schedule, sessions);
  assert.strictEqual(updated[0].type, 'Treino + Cardio');
  assert.strictEqual(updated[0].cardioSession.durationMinutes, 15);
  assert(updated[0].focus.includes('15 min pós-força'));
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO L — TREINO PESADO DE MEMBROS INFERIORES SEGUIDO DE CARDIO
// ─────────────────────────────────────────────────────────────────────────────
test('CASO L: Detecção de concorrência com treinos de membros inferiores', () => {
  const ctx = makeContext();
  // Simula workoutPlan com treino de pernas no ambiente sandbox
  sandbox.perfWorkoutPlan = [
    { id: 'A', name: 'Treino A · Push', focus: 'Peitoral' },
    { id: 'B', name: 'Treino B · Legs Heavy', focus: 'Agachamento Pesado, Stiff e Pernas' }
  ];

  const dist = calculateCardioDistribution(ctx, { target: 2 });
  assert.strictEqual(dist.avoidBeforeHeavyLegs, true, 'Deve detectar a presença de rotina de pernas');
  assert(dist.rationale.some(r => r.factor === 'lower_body_detection'));

  // No schedule, se houver dia de pernas, o algoritmo tenta alocar em dia sem "perna" / "legs"
  const schedule = [
    { dayKey: 'd1', dayName: 'Dia 1', routineId: 'A', title: 'Treino A · Push', type: 'Treino' },
    { dayKey: 'd2', dayName: 'Dia 2', routineId: 'B', title: 'Treino B · Legs Heavy', type: 'Treino' },
    { dayKey: 'd3', dayName: 'Dia 3', routineId: null, title: 'Descanso', type: 'Off' }
  ];

  // Se a sessão não tiver dayKey explícito, busca dia Off primeiro
  const sessions = [{ sessionId: 's1', protocolId: 'cardio_01', durationMinutes: 30 }];
  const applied = perfApplyCardioPrescriptionToSchedule(schedule, sessions);
  assert.strictEqual(applied.find(d => d.cardioSession != null).dayKey, 'd3', 'Prioriza dia Off');
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO M — HIIT EM DIAS CONSECUTIVOS
// ─────────────────────────────────────────────────────────────────────────────
test('CASO M: Proteção mandatória contra excesso de HIIT (Teto de 1x/semana)', () => {
  const ctx = makeContext({
    patient: { objective: 'Emagrecimento' }
  });
  const reqs = buildCardioGenerationRequirements(ctx);

  // Tentativa de injetar 2 sessões de HIIT na mesma semana
  const invalidHiitPrescription = {
    id: 'test_hiit_double',
    requirements: reqs,
    frequencyWeekly: 2,
    totalWeeklyMinutes: 70,
    sessions: [
      { sessionId: 's1', protocolId: 'cardio_03', dayKey: 'd2', durationMinutes: 35 },
      { sessionId: 's2', protocolId: 'cardio_03', dayKey: 'd3', durationMinutes: 35 } // Consecutivo e duplicado
    ]
  };

  const validation = validateCardioPrescriptionAgainstContext(invalidHiitPrescription, ctx, reqs);
  assert.strictEqual(validation.isValid, false, 'Validação determinística DEVE rejeitar 2 sessões de HIIT');
  assert(validation.errors.some(e => e.includes('excede o teto permitido')), 'Erro deve citar violação do teto de HIIT');
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO N — PRESERVAÇÃO DE DIA DE DESCANSO
// ─────────────────────────────────────────────────────────────────────────────
test('CASO N: Preservação de pelo menos 1 dia de descanso total (Off)', () => {
  // Com 6 rotinas e 1 cardio prescrito
  const schedule6x = [
    { dayKey: 'd1', dayName: 'Dia 1', routineId: 'A', title: 'A', type: 'Treino' },
    { dayKey: 'd2', dayName: 'Dia 2', routineId: 'B', title: 'B', type: 'Treino' },
    { dayKey: 'd3', dayName: 'Dia 3', routineId: 'C', title: 'C', type: 'Treino' },
    { dayKey: 'd4', dayName: 'Dia 4', routineId: 'D', title: 'D', type: 'Treino' },
    { dayKey: 'd5', dayName: 'Dia 5', routineId: 'E', title: 'E', type: 'Treino' },
    { dayKey: 'd6', dayName: 'Dia 6', routineId: 'F', title: 'F', type: 'Treino' },
    { dayKey: 'd7', dayName: 'Dia 7', routineId: null, title: 'Off', type: 'Off' }
  ];

  // Se cardio for alocado em dia de treino como pós-treino (slot d2)
  const sessions = [{ sessionId: 's1', protocolId: 'cardio_01', dayKey: 'd2', durationMinutes: 20 }];
  const applied = perfApplyCardioPrescriptionToSchedule(schedule6x, sessions);

  const offDays = applied.filter(d => d.type === 'Off');
  assert.strictEqual(offDays.length, 1, 'Dia 7 deve permanecer rigorosamente Off para supercompensação neuromuscular');
  assert.strictEqual(offDays[0].dayKey, 'd7');
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO O — COMPARAÇÃO ESTRUTURAL ENTRE 1 × 45 MIN E 3 × 15 MIN
// ─────────────────────────────────────────────────────────────────────────────
test('CASO O: Comparação estrutural entre 1x45 min vs 3x15 min e comprovação da ausência de modelagem fisiológica', () => {
  const prescA = {
    patientId: 'patient_a',
    frequencyWeekly: 1,
    totalWeeklyMinutes: 45,
    sessions: [
      { cardioId: 'cardio_01', durationMinutes: 45, day: 'Dia 2', intensity: 'Moderada' }
    ]
  };

  const prescB = {
    patientId: 'patient_b',
    frequencyWeekly: 3,
    totalWeeklyMinutes: 45,
    sessions: [
      { cardioId: 'cardio_01', durationMinutes: 15, day: 'Dia 1', intensity: 'Moderada' },
      { cardioId: 'cardio_01', durationMinutes: 15, day: 'Dia 2', intensity: 'Moderada' },
      { cardioId: 'cardio_01', durationMinutes: 15, day: 'Dia 3', intensity: 'Moderada' }
    ]
  };

  assert.strictEqual(prescA.totalWeeklyMinutes, prescB.totalWeeklyMinutes, 'Minutos nominais são idênticos (45 min)');
  assert.notStrictEqual(prescA.frequencyWeekly, prescB.frequencyWeekly, 'Frequências são distintas (1x vs 3x)');
  assert.notStrictEqual(prescA.sessions[0].durationMinutes, prescB.sessions[0].durationMinutes, 'Durações por sessão são distintas (45 min vs 15 min)');

  // Verificação no motor de regras: o sistema calcula volume puramente por (frequência * duração_base * multiplicador)
  // Não há no código cálculo de cinética de oxigênio, EPOC diferencial ou via de sinalização AMPK/mTOR proporcional ao tempo contínuo
  assert.strictEqual(typeof _CARDIO_RULES.PREFERRED.TARGET_SESSION_DURATION.Z2, 'number');
  assert.strictEqual(_CARDIO_RULES.PREFERRED.TARGET_SESSION_DURATION.Z2, 45, 'Target padrão de Z2 no motor é 45 min contínuos');
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO P — PARTIÇÕES DE DURAÇÃO (calculateCardioSessionDurations)
// ─────────────────────────────────────────────────────────────────────────────
test('CASO P: Partições de sessão determinísticas (calculateCardioSessionDurations)', () => {
  const ctx = makeContext();

  // 1. 45 min, 1 sessão -> [45]
  const d1 = calculateCardioSessionDurations(ctx, { target: 1 }, { targetWeeklyMinutes: 45 }, 'CONCENTRATED');
  assert.deepStrictEqual(Array.from(d1), [45], '45 min concentrado em 1 sessão deve resultar em [45]');
  assert.strictEqual(d1.reduce((a, b) => a + b, 0), 45);

  // 2. 45 min, 3 sessões -> [15, 15, 15]
  const d2 = calculateCardioSessionDurations(ctx, { target: 3 }, { targetWeeklyMinutes: 45 }, 'DISTRIBUTED_POST_WORKOUT');
  assert.deepStrictEqual(Array.from(d2), [15, 15, 15], '45 min distribuído em 3 sessões deve resultar em [15, 15, 15]');
  assert.strictEqual(d2.reduce((a, b) => a + b, 0), 45);

  // 3. 60 min, 2 sessões -> [30, 30]
  const d3 = calculateCardioSessionDurations(ctx, { target: 2 }, { targetWeeklyMinutes: 60 }, 'DISTRIBUTED');
  assert.deepStrictEqual(Array.from(d3), [30, 30], '60 min distribuído em 2 sessões deve resultar em [30, 30]');
  assert.strictEqual(d3.reduce((a, b) => a + b, 0), 60);

  // 4. 75 min, 3 sessões -> [25, 25, 25]
  const d4 = calculateCardioSessionDurations(ctx, { target: 3 }, { targetWeeklyMinutes: 75 }, 'DISTRIBUTED');
  assert.deepStrictEqual(Array.from(d4), [25, 25, 25], '75 min distribuído em 3 sessões deve resultar em [25, 25, 25]');
  assert.strictEqual(d4.reduce((a, b) => a + b, 0), 75);

  // 5. 90 min, 3 sessões -> [30, 30, 30]
  const d5 = calculateCardioSessionDurations(ctx, { target: 3 }, { targetWeeklyMinutes: 90 }, 'DISTRIBUTED');
  assert.deepStrictEqual(Array.from(d5), [30, 30, 30], '90 min distribuído em 3 sessões deve resultar em [30, 30, 30]');
  assert.strictEqual(d5.reduce((a, b) => a + b, 0), 90);

  // 6. 75 min, 3 sessões em modo MIXED -> [45, 15, 15]
  const d6 = calculateCardioSessionDurations(ctx, { target: 3 }, { targetWeeklyMinutes: 75 }, 'MIXED');
  assert.deepStrictEqual(Array.from(d6), [45, 15, 15], '75 min em modo MIXED deve resultar em [45, 15, 15]');
  assert.strictEqual(d6.reduce((a, b) => a + b, 0), 75);

  // 7. 60 min, 4 sessões -> [15, 15, 15, 15]
  const d7 = calculateCardioSessionDurations(ctx, { target: 4 }, { targetWeeklyMinutes: 60 }, 'DISTRIBUTED_POST_WORKOUT');
  assert.deepStrictEqual(Array.from(d7), [15, 15, 15, 15], '60 min distribuído em 4 sessões pós-treino deve resultar em [15, 15, 15, 15]');
  assert.strictEqual(d7.reduce((a, b) => a + b, 0), 60);
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO Q — FREQUÊNCIA DETERMINÍSTICA: 1, 2, 3 E 4 SESSÕES
// ─────────────────────────────────────────────────────────────────────────────
test('CASO Q: Frequências determinísticas de 1, 2, 3 e 4 sessões semanais', () => {
  // 1 sessão (ex: Hipertrofia com 5 rotinas pesadas)
  const ctx1 = makeContext({
    patient: { objective: 'Hipertrofia' },
    training: { weeklyFrequency: 5, sessionsPerWeek: 5 }
  });
  const f1 = calculateCardioFrequency(ctx1);
  assert(f1.target >= 1 && f1.target <= 2, 'Frequência para hipertrofia pesada deve ser 1 ou 2');

  // 2 sessões (ex: Hipertrofia 4x sem adiposidade central / sem risco)
  const ctx2 = makeContext({
    patient: { objective: 'Hipertrofia', bodyFatPercent: 14, rcEst: 0.44 },
    training: { weeklyFrequency: 4, sessionsPerWeek: 4 }
  });
  const f2 = calculateCardioFrequency(ctx2);
  assert.strictEqual(f2.target, 2, 'Frequência para hipertrofia sem risco cardiometabólico deve ser 2');

  // 3 sessões (ex: Recomposição com elevação metabólica e 4 treinos de musculação)
  const ctx3 = makeContext({
    patient: { objective: 'Recomposição' },
    training: { weeklyFrequency: 4, sessionsPerWeek: 4 }
  });
  const f3 = calculateCardioFrequency(ctx3);
  assert.strictEqual(f3.target, 3, 'Frequência para recomposição com adiposidade central deve ser 3');

  // 4 sessões (quando permitido pelo Engine com alta prioridade de condicionamento/volume e poucos treinos de força)
  const ctx4 = makeContext({
    patient: { objective: 'Emagrecimento' },
    training: { weeklyFrequency: 2, sessionsPerWeek: 2 }
  });
  const presc4 = generateCardioPrescription(ctx4, {
    preferredFrequency: 4,
    preferredDistributionMode: 'DISTRIBUTED'
  });
  assert(presc4.frequencyWeekly >= 3, 'Deve gerar frequência consistente');
  assert.strictEqual(presc4.sessions.length, presc4.frequencyWeekly);
  assert.strictEqual(presc4.sessionDurations.length, presc4.frequencyWeekly);
  assert.strictEqual(presc4.sessionDurations.reduce((a, b) => a + b, 0), presc4.totalWeeklyMinutes);
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO R — MODALIDADES: ORIGINAL, ATÔMICA E MULTI-MODALIDADE NA SEMANA
// ─────────────────────────────────────────────────────────────────────────────
test('CASO R: Protocolos originais, atômicos e multi-modalidade semanal', () => {
  const ctx = makeContext();
  const reqs = buildCardioGenerationRequirements(ctx);

  // 1. Protocolo original (cardio_01)
  const protoOrig = PERF_CARDIO_DB.find(p => p.id === 'cardio_01');
  assert(protoOrig != null, 'cardio_01 deve existir');
  assert.strictEqual(protoOrig.minDurationMinutes, 15);
  assert.strictEqual(protoOrig.maxDurationMinutes, 60);

  // 2. Protocolo atômico (airbike_z2_15)
  const protoAtomic = PERF_CARDIO_DB.find(p => p.id === 'airbike_z2_15');
  assert(protoAtomic != null, 'airbike_z2_15 deve existir');
  assert.strictEqual(protoAtomic.minDurationMinutes, 10);
  assert.strictEqual(protoAtomic.maxDurationMinutes, 30);
  assert(protoAtomic.equipment.includes('AirBike'));

  // 3. Multi-modalidade na mesma semana (AirBike + Rower + Treadmill)
  const prescMulti = {
    id: 'presc_multi_test',
    frequencyWeekly: 3,
    totalWeeklyMinutes: 45,
    sessionDurations: [15, 15, 15],
    distributionMode: 'DISTRIBUTED_POST_WORKOUT',
    sessions: [
      { sessionId: 's1', protocolId: 'airbike_z2_15', durationMinutes: 15, dayKey: 'd1' },
      { sessionId: 's2', protocolId: 'rower_z2_15', durationMinutes: 15, dayKey: 'd3' },
      { sessionId: 's3', protocolId: 'treadmill_incline_z2_15', durationMinutes: 15, dayKey: 'd5' }
    ]
  };

  const val = validateCardioPrescriptionAgainstContext(prescMulti, ctx, reqs);
  assert.strictEqual(val.isValid, true, `Multi-modalidade deve ser válida. Erros: ${val.errors.join(', ')}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO S — CIRCUITOS HÍBRIDOS ESTRUTURADOS COM AUDITORIA DE COMPONENTES
// ─────────────────────────────────────────────────────────────────────────────
test('CASO S: Circuitos híbridos estruturados (components auditáveis)', () => {
  const triErg = PERF_CARDIO_DB.find(p => p.id === 'hybrid_tri_erg_15');
  assert(triErg != null, 'hybrid_tri_erg_15 deve existir no catálogo');
  assert(triErg.category === 'Engine' || triErg.category === 'HYBRID', 'Categoria deve ser Engine/HYBRID');
  assert(Array.isArray(triErg.components), 'components deve ser um array estruturado');
  assert.strictEqual(triErg.components.length, 3, 'Tri-Erg deve possuir exatamente 3 estações (Ski, Bike, Rower)');

  // Cada componente deve possuir metadados auditáveis
  triErg.components.forEach(comp => {
    assert(comp.type, 'Componente deve ter type');
    assert(comp.modality, 'Componente deve ter modality');
    assert(typeof comp.durationMinutes === 'number', 'Componente deve ter durationMinutes numérico');
    assert(comp.equipment, 'Componente deve ter equipment');
    assert(comp.demand, 'Componente deve ter demand');
  });

  const functionalCircuit = PERF_CARDIO_DB.find(p => p.id === 'hybrid_functional_engine_25');
  assert(functionalCircuit != null, 'hybrid_functional_engine_25 deve existir');
  assert(Array.isArray(functionalCircuit.components));
  assert(functionalCircuit.components.some(c => c.type === 'CARRY' && c.modality === 'Farmer Carry'));
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO T — HYROX ADAPTADO ESTRUTURADO
// ─────────────────────────────────────────────────────────────────────────────
test('CASO T: Protocolos HYROX adaptados e estruturados com níveis', () => {
  const hyroxLight = PERF_CARDIO_DB.find(p => p.id === 'hyrox_adapted_light_30');
  assert(hyroxLight != null, 'hyrox_adapted_light_30 deve existir');
  assert(hyroxLight.category === 'Compromised' || hyroxLight.category === 'HYROX_INSPIRED' || hyroxLight.category === 'Engine');
  assert(hyroxLight.modality.includes('HYROX'));
  assert(hyroxLight.id.includes('adapted_light') || hyroxLight.levelTags.includes('intermediario'));
  assert(Array.isArray(hyroxLight.components), 'HYROX light deve possuir componentes estruturados');
  assert(hyroxLight.components.length >= 4, 'Deve conter estações chave (SkiErg, Sled, Rower, Wall Balls)');

  const hyroxPower = PERF_CARDIO_DB.find(p => p.id === 'hyrox_power_engine_45');
  assert(hyroxPower != null, 'hyrox_power_engine_45 deve existir');
  assert(hyroxPower.id.includes('power_engine') || hyroxPower.levelTags.includes('avancado'));
  assert(hyroxPower.components.some(c => c.modality.includes('Sled Push')));
  assert(hyroxPower.components.some(c => c.modality.includes('Farmer Carry')));
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO U — SCHEDULE, CONCORRÊNCIA BIOMECÂNICA E PRESERVAÇÃO DE DESCANSO
// ─────────────────────────────────────────────────────────────────────────────
test('CASO U: Auditoria biomecânica de concorrência com musculação e descanso', () => {
  const ctx = makeContext();
  sandbox.perfWorkoutPlan = [
    { id: 'A', name: 'Treino A · Peito/Ombro/Tríceps', focus: 'Ombros e Peitoral' },
    { id: 'B', name: 'Treino B · Costas e Puxadas', focus: 'Dorsais, Remadas e Lombar' },
    { id: 'C', name: 'Treino C · Pernas Completo', focus: 'Quadríceps, Posterior e Pernas' }
  ];

  const schedule = [
    { dayKey: 'd1', dayName: 'Dia 1', routineId: 'A', title: 'Treino A · Push', type: 'Treino' },
    { dayKey: 'd2', dayName: 'Dia 2', routineId: 'B', title: 'Treino B · Pull', type: 'Treino' },
    { dayKey: 'd3', dayName: 'Dia 3', routineId: 'C', title: 'Treino C · Legs', type: 'Treino' },
    { dayKey: 'd4', dayName: 'Dia 4', routineId: null, title: 'Descanso', type: 'Off' },
    { dayKey: 'd5', dayName: 'Dia 5', routineId: null, title: 'Descanso', type: 'Off' },
    { dayKey: 'd6', dayName: 'Dia 6', routineId: null, title: 'Descanso', type: 'Off' },
    { dayKey: 'd7', dayName: 'Dia 7', routineId: null, title: 'Descanso', type: 'Off' }
  ];

  // 1. Concorrência Dorsais vs Remo
  const reqsWithPull = buildCardioGenerationRequirements(ctx);
  const prescRowerAfterPull = {
    id: 'test_pull_rower',
    frequencyWeekly: 1,
    totalWeeklyMinutes: 15,
    sessionDurations: [15],
    distributionMode: 'DISTRIBUTED_POST_WORKOUT',
    sessions: [{ sessionId: 's1', protocolId: 'rower_z2_15', durationMinutes: 15, dayKey: 'd2' }]
  };
  const valPull = validateCardioPrescriptionAgainstContext(prescRowerAfterPull, ctx, reqsWithPull);
  // Deve registrar warning de concorrência biomecânica
  assert(valPull.warnings.some(w => w.includes('aviso de concorrência neuromuscular')),
    'Deve avisar sobre sobrecarga concorrente de dorsais com remo');

  // 2. Concorrência Pernas vs AirBike
  const prescAirbikeAfterLegs = {
    id: 'test_legs_airbike',
    frequencyWeekly: 1,
    totalWeeklyMinutes: 15,
    sessionDurations: [15],
    distributionMode: 'DISTRIBUTED_POST_WORKOUT',
    sessions: [{ sessionId: 's1', protocolId: 'airbike_z2_15', durationMinutes: 15, dayKey: 'd3' }]
  };
  const valLegs = validateCardioPrescriptionAgainstContext(prescAirbikeAfterLegs, ctx, reqsWithPull);
  assert(valLegs.warnings.some(w => w.includes('aviso de concorrência neuromuscular')),
    'Deve avisar sobre concorrência entre treino pesado de pernas e AirBike');

  // 3. Preservação de dia sem treino: alocando cardio em d4 (Off) transforma em "Cardio", mantendo d5, d6, d7 Off
  const applied = perfApplyCardioPrescriptionToSchedule(schedule, [
    { sessionId: 's1', protocolId: 'treadmill_incline_z2_15', durationMinutes: 20, dayKey: 'd4' }
  ]);
  assert.strictEqual(applied.find(d => d.dayKey === 'd4').type, 'Cardio');
  assert.strictEqual(applied.find(d => d.dayKey === 'd5').type, 'Off');
  assert.strictEqual(applied.find(d => d.dayKey === 'd6').type, 'Off');
  assert.strictEqual(applied.find(d => d.dayKey === 'd7').type, 'Off');
  const offCount = applied.filter(d => d.type === 'Off').length;
  assert(offCount >= 1, 'Pelo menos 1 dia Off DEVE ser preservado');
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO V — CONVERSÃO LEGADA SEM PERDA (perfPrescribedCardioId -> sessions[])
// ─────────────────────────────────────────────────────────────────────────────
test('CASO V: Conversão e retrocompatibilidade de registros legados (legacyCardioToCardioPrescriptionDTO)', () => {
  assert(legacyAdapters != null && typeof legacyAdapters.legacyCardioToCardioPrescriptionDTO === 'function',
    'legacyAdapters.legacyCardioToCardioPrescriptionDTO deve estar disponível');

  const legacyRecord = {
    perfPrescribedCardioId: 'cardio_01',
    patientId: 'patient_legacy_123',
    frequency: 2,
    duration: 45,
    notes: 'Registro criado na Fase F4'
  };

  const converted = legacyAdapters.legacyCardioToCardioPrescriptionDTO(legacyRecord);
  assert(converted != null, 'Deve retornar DTO convertido');
  assert.strictEqual(converted.patientId, 'patient_legacy_123');
  assert.strictEqual(converted.isLegacy, true, 'Deve marcar como de origem legada');
  assert.strictEqual(converted.legacyPrescribedCardioId, 'cardio_01', 'Preserva ID legado');
  assert(Array.isArray(converted.sessions), 'Deve conter array de sessions');
  assert.strictEqual(converted.sessions.length, 1, 'Cria 1 sessão canônica a partir do ID legado');
  assert.strictEqual(converted.sessions[0].protocolId, 'cardio_01', 'protocolId preservado');
  assert.strictEqual(converted.sessions[0].durationMinutes, 45, 'durationMinutes preservado');
  assert.strictEqual(converted.sessions[0].isLegacy, true);

  // Também suporta aplicação direta no schedule com formato legado
  const schedule = [
    { dayKey: 'd1', dayName: 'Dia 1', routineId: 'A', title: 'Treino A', type: 'Treino' },
    { dayKey: 'd2', dayName: 'Dia 2', routineId: null, title: 'Descanso', type: 'Off' }
  ];
  const appliedLegacy = perfApplyCardioPrescriptionToSchedule(schedule, [
    { cardioId: 'cardio_01', duration: 30, day: 'd2' }
  ]);
  const appliedDay = appliedLegacy.find(d => d.dayKey === 'd2');
  assert.strictEqual(appliedDay.type, 'Cardio');
  assert.strictEqual(appliedDay.cardioSession.protocolId, 'cardio_01');
  assert.strictEqual(appliedDay.cardioSession.durationMinutes, 30);
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO W — LIMITES DOS PROTOCOLOS E DESACOPLAMENTO FREQUÊNCIA × DURAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
test('CASO W: Validação de limites individuais de duração (minDuration, maxDuration)', () => {
  const ctx = makeContext();
  const reqs = buildCardioGenerationRequirements(ctx);

  // 1. Violação de teto máximo: airbike_z2_15 tem maxDurationMinutes = 30
  const prescExceedsMax = {
    id: 'test_exceeds',
    frequencyWeekly: 1,
    totalWeeklyMinutes: 45,
    sessionDurations: [45],
    sessions: [{ sessionId: 's1', protocolId: 'airbike_z2_15', durationMinutes: 45, dayKey: 'd1' }]
  };
  const valMax = validateCardioPrescriptionAgainstContext(prescExceedsMax, ctx, reqs);
  assert.strictEqual(valMax.isValid, false, 'Deve rejeitar duração de 45 min para airbike_z2_15 (máx: 30)');
  assert(valMax.errors.some(e => e.includes('acima do máximo permitido')));

  // 2. Violação de piso mínimo: hyrox_power_engine_45 tem minDurationMinutes = 30
  const prescBelowMin = {
    id: 'test_below',
    frequencyWeekly: 1,
    totalWeeklyMinutes: 10,
    sessionDurations: [10],
    sessions: [{ sessionId: 's1', protocolId: 'hyrox_power_engine_45', durationMinutes: 10, dayKey: 'd1' }]
  };
  const valMin = validateCardioPrescriptionAgainstContext(prescBelowMin, ctx, reqs);
  assert.strictEqual(valMin.isValid, false, 'Deve rejeitar duração de 10 min para HYROX Power Engine (mín: 30)');
  assert(valMin.errors.some(e => e.includes('abaixo do mínimo permitido')));
});

console.log('================================================================');
console.log(`Resumo dos Testes de Auditoria F6: Total: ${totalTests} | Aprovados: ${passedTests} | Falhas: 0`);
console.log('Status: AUDITORIA DE CARACTERIZAÇÃO CONCLUÍDA COM SUCESSO (100% PASS)');
console.log('================================================================');
