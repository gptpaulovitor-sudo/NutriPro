/**
 * =========================================================================
 * NutriAx Pro — F7.1: Suíte de Governança Contextual de HIIT
 * Arquivo: tests/cardio-hiit-governance.test.js
 *
 * Validação determinística do teto de sessões HIIT (0, 1 ou 2),
 * hierarquia de segurança, não-consecutividade, e teste crítico de não-inferência.
 * =========================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appJsCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// Sandbox isolado para app.js
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

// Símbolos do runtime
const PERF_CARDIO_DB = vm.runInContext('PERF_CARDIO_DB', sandbox);
const _CARDIO_RULES = sandbox._CARDIO_RULES || vm.runInContext('_CARDIO_RULES', sandbox);
const calculateCardioRecoveryModifier = sandbox.calculateCardioRecoveryModifier;
const calculateCardioClinicalSignals = sandbox.calculateCardioClinicalSignals;
const calculateCardioFrequency = sandbox.calculateCardioFrequency;
const calculateCardioVolume = sandbox.calculateCardioVolume;
const calculateCardioSessionDurations = sandbox.calculateCardioSessionDurations;
const calculateCardioHiitCeiling = sandbox.calculateCardioHiitCeiling || vm.runInContext('calculateCardioHiitCeiling', sandbox);
const calculateCardioIntensity = sandbox.calculateCardioIntensity;
const calculateCardioModalities = sandbox.calculateCardioModalities;
const calculateCardioDistribution = sandbox.calculateCardioDistribution;
const buildCardioGenerationRequirements = sandbox.buildCardioGenerationRequirements;
const generateCardioPrescription = sandbox.generateCardioPrescription;
const validateCardioPrescriptionAgainstContext = sandbox.validateCardioPrescriptionAgainstContext;
const perfApplyCardioPrescriptionToSchedule = sandbox.perfApplyCardioPrescriptionToSchedule;

console.log('================================================================');
console.log('F7.1: Suíte de Governança Contextual do Teto de HIIT (0, 1 ou 2)');
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

// Helper para montar contextos clínicos e desportivos de teste
function makeContext(overrides = {}) {
  return {
    _meta: { patientId: 'hiit-patient', hasAssessment: true },
    patient: {
      patientId: 'hiit-patient',
      name: 'Paciente Teste',
      age: 28,
      sex: 'Masculino',
      weightKg: 75,
      heightCm: 178,
      objective: 'Emagrecimento',
      trainingLevel: 'Intermediário',
      patientType: 'Praticante recreativo',
      ...(overrides.patient || {})
    },
    anthropometry: {
      bodyFatPercent: 16,
      leanMassKg: 63,
      fatMassKg: 12,
      ...(overrides.anthropometry || {})
    },
    cardiometabolic: {
      rcEst: 0.46,
      hasCardiometabolicRisk: false,
      ...(overrides.cardiometabolic || {})
    },
    nutrition: {
      caloricTargetKcal: 2400,
      energyBalanceKcal: -300,
      proteinGKg: 2.0,
      ...(overrides.nutrition || {})
    },
    trainingProfile: {
      frequencyWeekly: 4,
      durationMinutes: 60,
      workoutType: 'Musculação / Força',
      trainingLevel: overrides.patient?.trainingLevel || 'Intermediário',
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
// CASO A — RECUPERAÇÃO REDUZIDA -> TETO 0
// ─────────────────────────────────────────────────────────────────────────────
test('CASO A: Paciente com recuperação REDUCED (sono < 6h / estresse alto) impõe teto de 0 HIIT', () => {
  const ctx = makeContext({
    lifestyle: { sleepHours: 5.0, sleepQuality: 'Ruim', stressLevel: 'Alto' }
  });

  const ceiling = calculateCardioHiitCeiling(ctx);
  assert.strictEqual(ceiling.maxSessions, 0, 'Recuperação REDUCED deve forçar 0 sessões de HIIT');
  assert.strictEqual(ceiling.level, 'NONE');
  assert(ceiling.blockedReasons.some(r => r.includes('recuperacao_reduzida')));

  const intensity = calculateCardioIntensity(ctx, { target: 2 }, { targetMinutes: 60 });
  assert.strictEqual(intensity.highIntensityMaxSessions, 0);
  assert(!intensity.allowedZones.includes('Z4'), 'Z4 não deve ser permitida');
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO B — DÉFICIT CALÓRICO SEVERO (< -600 KCAL) -> TETO 0
// ─────────────────────────────────────────────────────────────────────────────
test('CASO B: Paciente em déficit severo (< -600 kcal) impõe teto de 0 HIIT', () => {
  const ctx = makeContext({
    nutrition: { energyBalanceKcal: -750 }
  });

  const ceiling = calculateCardioHiitCeiling(ctx);
  assert.strictEqual(ceiling.maxSessions, 0, 'Déficit calórico severo (< -600 kcal) deve forçar 0 sessões de HIIT');
  assert.strictEqual(ceiling.level, 'NONE');
  assert(ceiling.blockedReasons.some(r => r.includes('deficit_calorico_severo')));

  const intensity = calculateCardioIntensity(ctx, { target: 2 }, { targetMinutes: 60 });
  assert.strictEqual(intensity.highIntensityMaxSessions, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO C — MUSCULAÇÃO 6X/SEMANA -> TETO 0
// ─────────────────────────────────────────────────────────────────────────────
test('CASO C: Musculação 6x/semana impõe teto de concorrência e 0 HIIT', () => {
  const ctx = makeContext({
    trainingProfile: { frequencyWeekly: 6 }
  });

  const ceiling = calculateCardioHiitCeiling(ctx);
  assert.strictEqual(ceiling.maxSessions, 0, 'Musculação 6x/semana deve forçar 0 sessões de HIIT');
  assert.strictEqual(ceiling.level, 'NONE');
  assert(ceiling.blockedReasons.some(r => r.includes('musculacao_frequencia_extrema_6x')));
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO D — PACIENTE PADRÃO -> TETO 1
// ─────────────────────────────────────────────────────────────────────────────
test('CASO D: Paciente padrão (emagrecimento/recomposição, recuperação normal) recebe teto seguro de 1 HIIT', () => {
  const ctx = makeContext({
    patient: { objective: 'Emagrecimento', trainingLevel: 'Intermediário' },
    trainingProfile: { frequencyWeekly: 4 },
    nutrition: { energyBalanceKcal: -350 },
    lifestyle: { sleepHours: 7.5, sleepQuality: 'Boa', stressLevel: 'Moderado' }
  });

  const ceiling = calculateCardioHiitCeiling(ctx);
  assert.strictEqual(ceiling.maxSessions, 1, 'Paciente padrão deve receber exatamente 1 sessão de HIIT');
  assert.strictEqual(ceiling.level, 'STANDARD');
  assert(ceiling.blockedReasons.length > 0, 'Deve registrar os critérios avançados não atendidos');

  const intensity = calculateCardioIntensity(ctx, { target: 3 }, { targetMinutes: 90 });
  assert.strictEqual(intensity.highIntensityMaxSessions, 1);
  assert(intensity.allowedZones.includes('Z4'), 'Z4 deve estar liberada');
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO E — PACIENTE AVANÇADO / PERFORMANCE -> TETO 2
// ─────────────────────────────────────────────────────────────────────────────
test('CASO E: Paciente avançado com foco em performance e recuperação ótima recebe teto de 2 HIIT', () => {
  const ctx = makeContext({
    patient: { objective: 'Performance Esportiva / Condicionamento', trainingLevel: 'Avançado', patientType: 'Atleta' },
    trainingProfile: { frequencyWeekly: 4, trainingLevel: 'Avançado' },
    nutrition: { energyBalanceKcal: -100 }, // Balanço não depletivo
    lifestyle: { sleepHours: 8.5, sleepQuality: 'Excelente', stressLevel: 'Baixo' },
    cardiometabolic: { rcEst: 0.44, hasCardiometabolicRisk: false }
  });

  const ceiling = calculateCardioHiitCeiling(ctx, null, null, { target: 3 });
  assert.strictEqual(ceiling.maxSessions, 2, 'Paciente avançado/performance deve receber teto 2 de HIIT');
  assert.strictEqual(ceiling.level, 'ADVANCED');
  assert.strictEqual(ceiling.blockedReasons.length, 0, 'Não deve ter motivos de bloqueio');

  const reqs = buildCardioGenerationRequirements(ctx);
  assert.strictEqual(reqs.intensity.highIntensityMaxSessions, 2);
  assert.strictEqual(reqs.intensity.hiitCeiling.level, 'ADVANCED');
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO F — AVANÇADO COM RECUPERAÇÃO REDUZIDA -> NÃO PODE SER 2 (TETO 0)
// ─────────────────────────────────────────────────────────────────────────────
test('CASO F: Paciente avançado com recuperação reduzida é bloqueado (teto 0, nunca 2)', () => {
  const ctx = makeContext({
    patient: { objective: 'Performance Esportiva', trainingLevel: 'Avançado' },
    trainingProfile: { frequencyWeekly: 4 },
    lifestyle: { sleepHours: 5.0, sleepQuality: 'Ruim', stressLevel: 'Alto' }
  });

  const ceiling = calculateCardioHiitCeiling(ctx, null, null, { target: 3 });
  assert.strictEqual(ceiling.maxSessions, 0, 'Avançado com sono ruim não pode receber 2 nem 1 HIIT');
  assert.strictEqual(ceiling.level, 'NONE');
  assert(ceiling.blockedReasons.some(r => r.includes('recuperacao_reduzida')));
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO G — AVANÇADO COM DÉFICIT SEVERO -> NÃO PODE SER 2 (TETO 0)
// ─────────────────────────────────────────────────────────────────────────────
test('CASO G: Paciente avançado com déficit calórico severo (< -600 kcal) é bloqueado (teto 0)', () => {
  const ctx = makeContext({
    patient: { objective: 'Performance / TAF', trainingLevel: 'Avançado' },
    trainingProfile: { frequencyWeekly: 3 },
    nutrition: { energyBalanceKcal: -800 },
    lifestyle: { sleepHours: 8.5, sleepQuality: 'Excelente', stressLevel: 'Baixo' }
  });

  const ceiling = calculateCardioHiitCeiling(ctx, null, null, { target: 3 });
  assert.strictEqual(ceiling.maxSessions, 0, 'Déficit severo veta HIIT mesmo para atleta avançado');
  assert.strictEqual(ceiling.level, 'NONE');
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO H — VALIDADOR REJEITA 2 HIIT EM CONTEXTO COM CEILING 1
// ─────────────────────────────────────────────────────────────────────────────
test('CASO H: Validador rejeita prescrição com 2 sessões HIIT quando ceiling é 1 (REJECT)', () => {
  const ctx = makeContext({
    patient: { objective: 'Emagrecimento', trainingLevel: 'Intermediário' }
  });
  const reqs = buildCardioGenerationRequirements(ctx);
  assert.strictEqual(reqs.intensity.highIntensityMaxSessions, 1);

  const invalidPrescription = {
    id: 'test_two_hiits_in_standard',
    frequencyWeekly: 3,
    totalWeeklyMinutes: 60,
    sessionDurations: [20, 20, 20],
    distributionMode: 'DISTRIBUTED',
    sessions: [
      { sessionId: 's1', protocolId: 'cardio_03', dayKey: 'd2', durationMinutes: 20 },
      { sessionId: 's2', protocolId: 'cardio_01', dayKey: 'd4', durationMinutes: 20 },
      { sessionId: 's3', protocolId: 'cardio_03', dayKey: 'd6', durationMinutes: 20 }
    ]
  };

  const validation = validateCardioPrescriptionAgainstContext(invalidPrescription, ctx, reqs);
  assert.strictEqual(validation.isValid, false, 'Deve rejeitar 2 sessões HIIT em contexto com ceiling 1');
  assert(validation.errors.some(e => e.includes('excede o teto permitido (1)')));
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO I — VALIDADOR ACEITA 2 HIIT NÃO-CONSECUTIVOS COM CEILING 2
// ─────────────────────────────────────────────────────────────────────────────
test('CASO I: Validador aprova prescrição com 2 sessões HIIT não-consecutivas quando ceiling é 2 (PASS)', () => {
  const ctx = makeContext({
    patient: { objective: 'Performance', trainingLevel: 'Avançado' },
    trainingProfile: { frequencyWeekly: 3 },
    lifestyle: { sleepHours: 8.5, sleepQuality: 'Excelente', stressLevel: 'Baixo' },
    nutrition: { energyBalanceKcal: -150 }
  });
  const reqs = buildCardioGenerationRequirements(ctx);
  assert.strictEqual(reqs.intensity.highIntensityMaxSessions, 2);

  const validPrescription = {
    id: 'test_two_hiits_advanced',
    frequencyWeekly: 3,
    totalWeeklyMinutes: 65,
    sessionDurations: [25, 20, 20],
    distributionMode: 'DISTRIBUTED',
    sessions: [
      { sessionId: 's1', protocolId: 'cardio_01', dayKey: 'd2', durationMinutes: 25 },
      { sessionId: 's2', protocolId: 'rower_intervals_vo2_20', dayKey: 'd4', durationMinutes: 20 },
      { sessionId: 's3', protocolId: 'bike_intervals_hiit_20', dayKey: 'd6', durationMinutes: 20 }
    ]
  };

  const validation = validateCardioPrescriptionAgainstContext(validPrescription, ctx, reqs);
  assert.strictEqual(validation.isValid, true, `Deve aprovar 2 sessões HIIT em dias separados. Erros: ${validation.errors.join(', ')}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO J — VALIDADOR REJEITA 2 HIIT EM DIAS CONSECUTIVOS MESMO COM CEILING 2
// ─────────────────────────────────────────────────────────────────────────────
test('CASO J: Validador rejeita 2 sessões HIIT em dias consecutivos (d2 e d3) mesmo com ceiling 2 (REJECT)', () => {
  const ctx = makeContext({
    patient: { objective: 'Performance', trainingLevel: 'Avançado' },
    trainingProfile: { frequencyWeekly: 3 },
    lifestyle: { sleepHours: 8.5, sleepQuality: 'Excelente', stressLevel: 'Baixo' },
    nutrition: { energyBalanceKcal: 0 }
  });
  const reqs = buildCardioGenerationRequirements(ctx);
  assert.strictEqual(reqs.intensity.highIntensityMaxSessions, 2);

  // Sessões nos dias d2 e d3 (consecutivos diretos!)
  const consecutiveHiitPrescription = {
    id: 'test_consecutive_hiit',
    frequencyWeekly: 2,
    totalWeeklyMinutes: 40,
    sessionDurations: [20, 20],
    distributionMode: 'DISTRIBUTED',
    sessions: [
      { sessionId: 's1', protocolId: 'bike_intervals_hiit_20', dayKey: 'd2', durationMinutes: 20 },
      { sessionId: 's2', protocolId: 'bike_intervals_hiit_20', dayKey: 'd3', durationMinutes: 20 }
    ]
  };

  const validation = validateCardioPrescriptionAgainstContext(consecutiveHiitPrescription, ctx, reqs);
  assert.strictEqual(validation.isValid, false, 'Deve rejeitar sessões HIIT em dias consecutivos');
  assert(validation.errors.some(e => e.includes('consecutivas') && e.includes('SNA')));
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO K — GERADOR PRESERVA CONCORRÊNCIA COM PERNAS E EVITA CONSECUTIVOS
// ─────────────────────────────────────────────────────────────────────────────
test('CASO K: Gerador automático aloca sessões não-consecutivas e evita HIIT em dia de pernas', () => {
  const ctx = makeContext({
    patient: { objective: 'Performance Esportiva', trainingLevel: 'Avançado' },
    trainingProfile: { frequencyWeekly: 4 },
    lifestyle: { sleepHours: 8.5, sleepQuality: 'Excelente', stressLevel: 'Baixo' },
    nutrition: { energyBalanceKcal: -100 }
  });

  // Simula treino de pernas na Segunda (d1)
  sandbox.perfWorkoutPlan = [
    { id: 'legs', name: 'Treino A · Pernas Pesado', focus: 'Quadríceps e Glúteos', dayKey: 'd1' },
    { id: 'push', name: 'Treino B · Peito/Tríceps', focus: 'Peitoral', dayKey: 'd2' },
    { id: 'pull', name: 'Treino C · Costas/Bíceps', focus: 'Dorsal', dayKey: 'd4' },
    { id: 'shoulders', name: 'Treino D · Ombros', focus: 'Deltoides', dayKey: 'd6' }
  ];

  const reqs = buildCardioGenerationRequirements(ctx);
  assert.strictEqual(reqs.intensity.highIntensityMaxSessions, 2);

  const presc = generateCardioPrescription(ctx, reqs);
  assert.strictEqual(presc.sessions.length, reqs.frequency.target);

  const hiitSessions = presc.sessions.filter(s => {
    const proto = PERF_CARDIO_DB.find(p => p.id === s.protocolId);
    return proto && (proto.category === 'HIIT' || (proto.intensityZone && proto.intensityZone.includes('Z4')));
  });

  assert(hiitSessions.length <= 2, 'Não pode exceder o teto de 2 HIIT');

  // Nenhuma sessão HIIT deve ser no dia de pernas (d1)
  hiitSessions.forEach(s => {
    assert.notStrictEqual(s.dayKey, 'd1', 'HIIT não deve ser alocado no dia de pernas');
  });

  // Nenhuma sessão HIIT deve ser consecutiva a outra sessão HIIT
  if (hiitSessions.length > 1) {
    const d1Num = parseInt(String(hiitSessions[0].dayKey || '').replace(/\D/g, ''));
    const d2Num = parseInt(String(hiitSessions[1].dayKey || '').replace(/\D/g, ''));
    const diff = Math.abs(d1Num - d2Num);
    assert(diff > 1 && diff < 6, `Sessões HIIT geradas (${hiitSessions[0].dayKey} e ${hiitSessions[1].dayKey}) não devem ser consecutivas`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO L — TESTE CRÍTICO DE NÃO-INFERÊNCIA (NÃO INVENTAR CONTRAINDICAÇÃO)
// ─────────────────────────────────────────────────────────────────────────────
test('CASO L (NÃO-INFERÊNCIA): Texto livre em clinicalConstraints NÃO inventa contraindicação sem flag estruturada', () => {
  const ctx = makeContext({
    patient: { objective: 'Performance Esportiva', trainingLevel: 'Avançado' },
    trainingProfile: { frequencyWeekly: 4 },
    lifestyle: { sleepHours: 8.5, sleepQuality: 'Excelente', stressLevel: 'Baixo' },
    nutrition: { energyBalanceKcal: 0 },
    constraints: {
      clinicalConstraints: [
        'Paciente relatou histórico familiar de hipertensão',
        'Paciente refere desconforto prévio no joelho em 2022'
      ]
    }
  });

  const ceiling = calculateCardioHiitCeiling(ctx, null, null, { target: 3 });
  // O sistema NÃO deve inferir contraindicação médica absoluta de texto livre não estruturado
  assert.strictEqual(ceiling.maxSessions, 2, 'Texto livre não-estruturado NÃO deve forçar ceiling 0');
  assert.strictEqual(ceiling.level, 'ADVANCED');
  assert(!ceiling.blockedReasons.some(r => r.includes('restricao_estruturada_explicita_hiit')));
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO M — FLAG ESTRUTURADA EXPLÍCITA RECONHECIDA ZERA O TETO
// ─────────────────────────────────────────────────────────────────────────────
test('CASO M: Flag estruturada explícita (ex: prohibitedExercises com "HIIT") impõe teto 0 com rastreabilidade', () => {
  const ctx = makeContext({
    patient: { objective: 'Performance', trainingLevel: 'Avançado' },
    constraints: {
      prohibitedExercises: ['HIIT']
    }
  });

  const ceiling = calculateCardioHiitCeiling(ctx);
  assert.strictEqual(ceiling.maxSessions, 0, 'Flag explícita de proibição de HIIT deve zerar o teto');
  assert.strictEqual(ceiling.level, 'NONE');
  assert(ceiling.blockedReasons.some(r => r.includes('restricao_estruturada_explicita_hiit')));
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO N — SUPERÁVIT CALÓRICO SOZINHO NÃO BLOQUEIA HIIT PARA ATLETAS DE PERFORMANCE
// ─────────────────────────────────────────────────────────────────────────────
test('CASO N: Atleta em superávit calórico (+350 kcal) com foco em performance mantém HIIT autorizado', () => {
  const ctx = makeContext({
    patient: { objective: 'Performance Esportiva / Triathlon', trainingLevel: 'Avançado' },
    nutrition: { energyBalanceKcal: 350 }, // Superávit para suportar alta demanda
    trainingProfile: { frequencyWeekly: 3 },
    lifestyle: { sleepHours: 8.5, sleepQuality: 'Excelente', stressLevel: 'Baixo' }
  });

  const ceiling = calculateCardioHiitCeiling(ctx, null, null, { target: 3 });
  assert.strictEqual(ceiling.maxSessions, 2, 'Superávit calórico sozinho NÃO bloqueia HIIT para atletas de performance');
  assert.strictEqual(ceiling.level, 'ADVANCED');
});

// ─────────────────────────────────────────────────────────────────────────────
// CASO O — HIPERTROFIA EM SUPERÁVIT CALÓRICO (> 300 KCAL) NÃO ZERA O TETO DE HIIT
// ─────────────────────────────────────────────────────────────────────────────
test('CASO O: Hipertrofia com superávit calórico (> 300 kcal) NÃO zera o teto de HIIT automaticamente', () => {
  const ctx = makeContext({
    patient: { objective: 'Hipertrofia Muscular', trainingLevel: 'Intermediário' },
    nutrition: { energyBalanceKcal: 450 }, // Superávit > 300 kcal
    trainingProfile: { frequencyWeekly: 4 },
    lifestyle: { sleepHours: 7.5, sleepQuality: 'Boa', stressLevel: 'Moderado' }
  });

  const ceiling = calculateCardioHiitCeiling(ctx);
  // Não deve ser 0! Como é um paciente intermediário com hipertrofia (não performance avançada), segue o padrão contextual: 1 (STANDARD)
  assert.strictEqual(ceiling.maxSessions, 1, 'Hipertrofia com superávit calórico > 300 kcal NÃO deve produzir maxSessions: 0 automaticamente');
  assert.strictEqual(ceiling.level, 'STANDARD');
  assert(!ceiling.blockedReasons.some(r => r.includes('superavit_hipertrofia_foco_mTOR')), 'Regra de bloqueio automático por superávit não deve existir');

  const reqs = buildCardioGenerationRequirements(ctx);
  assert.strictEqual(reqs.intensity.highIntensityMaxSessions, 1, 'Requisitos do engine devem permitir 1 sessão de alta intensidade no patamar padrão');
});

console.log('================================================================');
console.log(`Resumo dos Testes F7.1 (Governança Contextual de HIIT):`);
console.log(`Total: ${totalTests} | Aprovados: ${passedTests} | Falhas: 0`);
console.log('Status: SUÍTE F7.1 CONCLUÍDA COM 100% PASS');
console.log('================================================================');

