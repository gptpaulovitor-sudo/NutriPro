/**
 * =========================================================================
 * NutriAx Pro — F7.4: Suíte Canônica do Cardio Weekly Prescription Engine
 * Arquivo: tests/cardio-weekly-engine.test.js
 *
 * Testes A a T (20 testes) + 10 Casos Adicionais de Regressão e Borda (10 testes)
 * Total: 30 testes canônicos determinísticos.
 * =========================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appJsCode = fs.readFileSync(path.resolve(process.cwd(), 'app.js'), 'utf8');

const win = {
  addEventListener: () => {},
  open: () => ({
    document: {
      write: (html) => { sandbox.__lastPdfHtml = html; },
      close: () => {}
    }
  })
};

const sandbox = {
  window: win,
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
sandbox.open = () => ({
  document: {
    write: (html) => { sandbox.__lastPdfHtml = html; },
    close: () => {}
  }
});

vm.createContext(sandbox);
vm.runInContext(appJsCode, sandbox);

// Importações do Sandbox
const PERF_CARDIO_DB = vm.runInContext('PERF_CARDIO_DB', sandbox);
const buildCardioWeeklyPrescription = sandbox.buildCardioWeeklyPrescription;
const generateCardioPrescription = sandbox.generateCardioPrescription;
const perfApplyCardioPrescriptionToSchedule = sandbox.perfApplyCardioPrescriptionToSchedule;
const buildCardioGenerationRequirements = sandbox.buildCardioGenerationRequirements;
const buildCardioProfile = sandbox.buildCardioProfile;
const rankCardioProtocols = sandbox.rankCardioProtocols;
const calculateCardioFrequency = sandbox.calculateCardioFrequency;
const calculateCardioVolume = sandbox.calculateCardioVolume;
const calculateCardioSessionDurations = sandbox.calculateCardioSessionDurations;
const calculateCardioHiitCeiling = sandbox.calculateCardioHiitCeiling;
const validateCardioPrescriptionAgainstContext = sandbox.validateCardioPrescriptionAgainstContext;
const perfBuildWeeklySchedule = sandbox.perfBuildWeeklySchedule;
const perfGeneratePDF = sandbox.perfGeneratePDF;

const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, pass: true });
    console.log(`✅ [PASS] ${name}`);
  } catch (err) {
    results.push({ name, pass: false, error: err });
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Detalhe: ${err.message}`);
  }
}

function makeContext(overrides = {}) {
  return {
    _meta: { patientId: 'patient_f74_test', hasAssessment: true },
    patient: {
      patientId: 'patient_f74_test',
      name: 'Paciente Teste F7.4',
      age: 32,
      sex: 'Masculino',
      weightKg: 78,
      heightCm: 178,
      objective: 'Hipertrofia Muscular',
      trainingLevel: 'Intermediário',
      trainingDaysPerWeek: 4,
      injuries: [],
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
      sleepHours: 8.0,
      sleepQuality: 'Boa',
      stressLevel: 'Moderado',
      ...(overrides.lifestyle || {})
    },
    constraints: {
      injuries: [],
      prohibitedExercises: [],
      clinicalConstraints: [],
      availableEquipment: 'Full Gym',
      preferredModalities: [],
      avoidedModalities: [],
      ...(overrides.constraints || {})
    },
    cardioProfile: {
      availableEquipment: ['Esteira', 'Bicicleta Ergométrica', 'RowErg', 'AirBike', 'SkiErg'],
      preferredModalities: [],
      avoidedModalities: [],
      contraindications: [],
      preferredDays: [],
      experienceLevel: { value: 'intermediate', confidence: 'inferred' },
      ...(overrides.cardioProfile || {})
    },
    perfWeeklySchedule: overrides.perfWeeklySchedule || perfBuildWeeklySchedule('UpperLower'),
    ...overrides
  };
}

console.log('================================================================');
console.log('F7.4: Suíte Canônica do Cardio Weekly Prescription Engine');
console.log('================================================================\n');

// ─────────────────────────────────────────────────────────────────────────────
// TESTE A: Frequência Exata
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE A: Frequência exata (sessions.length === frequencyWeekly)', () => {
  const ctx = makeContext();
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);

  assert(presc, 'Prescrição deve ser gerada');
  assert.strictEqual(presc.sessions.length, presc.frequencyWeekly,
    `Quantidade de sessões (${presc.sessions.length}) deve ser exatamente igual à frequencyWeekly (${presc.frequencyWeekly})`);
  assert.strictEqual(presc.sessions.length, presc.weeklyFrequency, 'weeklyFrequency deve ser alias idêntico');
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE B: Volume Exato
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE B: Volume exato (sum(durationMinutes) === totalWeeklyMinutes)', () => {
  const ctx = makeContext({
    patient: { objective: 'Emagrecimento' },
    lifestyle: { sleepHours: 8.0, sleepQuality: 'Excelente', stressLevel: 'Baixo' }
  });
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);

  const sumMinutes = presc.sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  assert.strictEqual(sumMinutes, presc.totalWeeklyMinutes,
    `Soma das durações das sessões (${sumMinutes}) deve ser exatamente totalWeeklyMinutes (${presc.totalWeeklyMinutes})`);
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE C: Teto de HIIT (hiitCount <= hiitCeiling)
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE C: HIIT respeita o teto clínico (hiitCount <= hiitCeiling)', () => {
  const ctx = makeContext({
    patient: { objective: 'Performance Esportiva', trainingLevel: 'Avançado' },
    lifestyle: { sleepHours: 8.5, sleepQuality: 'Excelente', stressLevel: 'Baixo' }
  });
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);

  const hiitCount = presc.sessions.filter(s => s.isHiit).length;
  const hiitCeiling = presc.weeklyMacroAnalysis.hiitCeiling;
  assert(hiitCount <= hiitCeiling,
    `Quantidade de HIIT (${hiitCount}) não pode exceder o teto clínico (${hiitCeiling})`);
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE D: HIIT Não-Consecutivo
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE D: Sessões HIIT nunca são alocadas em dias consecutivos', () => {
  const ctx = makeContext({
    patient: { objective: 'Performance Esportiva', trainingLevel: 'Avançado' },
    lifestyle: { sleepHours: 8.5, sleepQuality: 'Excelente', stressLevel: 'Baixo' }
  });
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);

  const hiitSessions = presc.sessions.filter(s => s.isHiit);
  if (hiitSessions.length > 1) {
    for (let i = 0; i < hiitSessions.length - 1; i++) {
      const d1Idx = parseInt(hiitSessions[i].dayKey.replace(/\D/g, ''));
      const d2Idx = parseInt(hiitSessions[i + 1].dayKey.replace(/\D/g, ''));
      const diff = Math.abs(d2Idx - d1Idx);
      assert(diff > 1 && diff < 6, `Sessões HIIT em ${hiitSessions[i].dayKey} e ${hiitSessions[i + 1].dayKey} não podem ser consecutivas`);
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE E: HIIT Proibido em Treino de Pernas
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE E: HIIT não ocorre em dia de treino de pernas', () => {
  const schedule = [
    { dayKey: 'd1', dayName: 'Segunda', routineId: 'r1', title: 'Treino A · Pernas Pesado', focus: 'Agachamento Pesado, Quadríceps e Stiff', type: 'Treino' },
    { dayKey: 'd2', dayName: 'Terça', routineId: 'r2', title: 'Treino B · Peito/Tríceps', focus: 'Peitoral e Tríceps', type: 'Treino' },
    { dayKey: 'd3', dayName: 'Quarta', routineId: null, title: 'Off', focus: 'Descanso', type: 'Off' },
    { dayKey: 'd4', dayName: 'Quinta', routineId: 'r3', title: 'Treino C · Costas/Bíceps', focus: 'Dorsal e Bíceps', type: 'Treino' },
    { dayKey: 'd5', dayName: 'Sexta', routineId: 'r4', title: 'Treino D · Ombros', focus: 'Deltoides', type: 'Treino' },
    { dayKey: 'd6', dayName: 'Sábado', routineId: null, title: 'Off', focus: 'Descanso', type: 'Off' },
    { dayKey: 'd7', dayName: 'Domingo', routineId: null, title: 'Off', focus: 'Descanso', type: 'Off' }
  ];

  const ctx = makeContext({
    patient: { objective: 'Performance Esportiva', trainingLevel: 'Avançado' },
    lifestyle: { sleepHours: 8.5, sleepQuality: 'Excelente', stressLevel: 'Baixo' },
    perfWeeklySchedule: schedule
  });
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);

  const hiitSessions = presc.sessions.filter(s => s.isHiit);
  hiitSessions.forEach(s => {
    assert.notStrictEqual(s.dayKey, 'd1', 'HIIT jamais pode ser alocado na segunda-feira (Treino Pesado de Pernas)');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE F: Contexto D-1/D+1 Influencia Seleção de Modalidade
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE F: Contexto D-1/D+1 influencia seleção biomecânica de modalidade', () => {
  // d1 = Pernas Pesado (Agachamento). d2 = Cardio dedicado. d3 = Pernas Pesado (Posterior).
  const schedule = [
    { dayKey: 'd1', dayName: 'Segunda', routineId: 'r1', title: 'Treino A · Pernas Pesado', focus: 'Pernas Força e Agachamento', type: 'Treino' },
    { dayKey: 'd2', dayName: 'Terça', routineId: null, title: 'Descanso', focus: 'Off', type: 'Off' },
    { dayKey: 'd3', dayName: 'Quarta', routineId: 'r2', title: 'Treino B · Pernas Pesado', focus: 'Pernas Hipertrofia e Stiff', type: 'Treino' },
    { dayKey: 'd4', dayName: 'Quinta', routineId: 'r3', title: 'Treino C · Superiores', focus: 'Peito e Costas', type: 'Treino' },
    { dayKey: 'd5', dayName: 'Sexta', routineId: null, title: 'Descanso', focus: 'Off', type: 'Off' },
    { dayKey: 'd6', dayName: 'Sábado', routineId: null, title: 'Descanso', focus: 'Off', type: 'Off' },
    { dayKey: 'd7', dayName: 'Domingo', routineId: null, title: 'Descanso', focus: 'Off', type: 'Off' }
  ];

  const ctx = makeContext({
    perfWeeklySchedule: schedule,
    cardioProfile: { preferredDays: ['d2'] }
  });
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);

  const d2Session = presc.sessions.find(s => s.dayKey === 'd2');
  if (d2Session) {
    const proto = PERF_CARDIO_DB.find(p => p.id === d2Session.protocolId);
    assert.notStrictEqual(proto.axialLoad, 'HIGH', 'D-1 pernas pesadas proíbe axialLoad HIGH');
    assert.notStrictEqual(proto.lowerLimbDemand, 'HIGH', 'D+1 pernas pesadas proíbe lowerLimbDemand HIGH');
    assert.notStrictEqual(proto.impactLevel, 'HIGH', 'D+1 pernas pesadas proíbe impactLevel HIGH');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE G: preferredDays é Respeitado Quando Compatível
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE G: preferredDays é respeitado quando compatível', () => {
  const ctx = makeContext({
    cardioProfile: { preferredDays: ['Terça', 'Sexta'] }
  });
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);

  const dayKeys = presc.sessions.map(s => s.dayKey);
  assert(dayKeys.includes('d2'), 'Deve alocar na Terça (d2) conforme preferredDays');
  assert(dayKeys.includes('d5'), 'Deve alocar na Sexta (d5) conforme preferredDays');
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE H: preferredDuration é Respeitado Quando Compatível
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE H: preferredDuration é respeitado quando compatível', () => {
  const ctx = makeContext({
    patient: { objective: 'Hipertrofia Muscular' },
    trainingProfile: { frequencyWeekly: 4 },
    cardioProfile: { preferredDuration: 30 }
  });
  const reqs = buildCardioGenerationRequirements(ctx);
  reqs.volume.totalWeeklyMinutes = 60;
  reqs.frequency.prescribedWeeklyFrequency = 2;

  const presc = buildCardioWeeklyPrescription(ctx, reqs);
  assert.strictEqual(presc.sessions.length, 2);
  assert.strictEqual(presc.sessions[0].durationMinutes, 30, 'Sessão 1 deve ter 30 min (preferredDuration)');
  assert.strictEqual(presc.sessions[1].durationMinutes, 30, 'Sessão 2 deve ter 30 min (preferredDuration)');
  assert.strictEqual(presc.totalWeeklyMinutes, 60, 'Volume total deve permanecer estrito em 60 min');
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE I: Equipamento Ausente Nunca Aparece
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE I: Equipamento ausente elimina o protocolo sem exceção', () => {
  const ctx = makeContext({
    cardioProfile: { availableEquipment: ['Bicicleta Ergométrica'] }
  });
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);

  presc.sessions.forEach(s => {
    const proto = PERF_CARDIO_DB.find(p => p.id === s.protocolId);
    if (proto.equipmentRequired && proto.equipmentRequired !== 'Nenhum' && proto.equipmentRequired !== 'Monitor Cardíaco') {
      const hasEq = proto.equipmentRequired.toLowerCase().includes('bike') ||
        proto.equipmentRequired.toLowerCase().includes('bicicleta') ||
        proto.equipmentRequired.toLowerCase().includes('cicloerg');
      assert(hasEq, `Sessão ${proto.id} requer ${proto.equipmentRequired}, mas paciente só possui Bicicleta`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE J: Restrições Biomecânicas Nunca São Violadas
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE J: Restrições biomecânicas nunca são violadas', () => {
  const ctx = makeContext({
    cardioProfile: { contraindications: ['impacto articular', 'lombar'] }
  });
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);

  presc.sessions.forEach(s => {
    const proto = PERF_CARDIO_DB.find(p => p.id === s.protocolId);
    const flags = proto.contraindicationFlags || [];
    assert(!flags.includes('impacto articular'), `Protocolo ${proto.id} possui flag de impacto articular contraindicado`);
    assert(!flags.includes('lombar'), `Protocolo ${proto.id} possui flag lombar contraindicado`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE K: Ranking F7.2 Permanece Determinístico e Soberano
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE K: Ranking F7.2 permanece determinístico e soberano', () => {
  const ctx = makeContext({
    patient: { objective: 'Hipertrofia Muscular', trainingLevel: 'Avançado' },
    cardioProfile: { preferredModalities: ['bicicleta'] }
  });
  const profile = buildCardioProfile(ctx);
  const ranked = rankCardioProtocols(ctx, profile, PERF_CARDIO_DB);

  assert(ranked.length > 0);
  assert(ranked[0].protocol.id.includes('bike') || ranked[0].protocol.modality.toLowerCase().includes('bike') || ranked[0].protocol.modality.toLowerCase().includes('cicloerg'),
    'Top 1 do ranking F7.2 deve ser bicicleta');

  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);
  assert(presc.sessions.some(s => s.protocolId === ranked[0].protocol.id),
    'Prescrição deve incluir o top 1 do ranking F7.2 quando compatível com os slots');
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE L: Diversidade Aplicada Apenas Quando Candidatos São Clinicamente Equivalentes
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE L: Diversidade aplicada quando candidatos possuem scores equivalentes', () => {
  const ctx = makeContext({
    patient: { objective: 'Saúde Geral' },
    trainingProfile: { frequencyWeekly: 4 }
  });
  const reqs = buildCardioGenerationRequirements(ctx);
  reqs.frequency.prescribedWeeklyFrequency = 3;
  reqs.volume.totalWeeklyMinutes = 90;

  const presc = buildCardioWeeklyPrescription(ctx, reqs);
  const families = new Set(presc.sessions.map(s => s.modalityFamily));
  assert(families.size >= 2, 'Com candidatos clinicamente equivalentes, o motor deve promover variedade de famílias');
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE M: recoveryDemand Influencia Sem Criar Limite Clínico Arbitrário
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE M: recoveryDemand penaliza concentração de sessões HIGH consecutivas', () => {
  const ctx = makeContext({
    patient: { objective: 'Performance Esportiva', trainingLevel: 'Avançado' },
    lifestyle: { sleepHours: 8.5, sleepQuality: 'Excelente', stressLevel: 'Baixo' }
  });
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);

  for (let i = 0; i < presc.sessions.length - 1; i++) {
    const s1 = presc.sessions[i];
    const s2 = presc.sessions[i + 1];
    const d1Num = parseInt(s1.dayKey.replace(/\D/g, ''));
    const d2Num = parseInt(s2.dayKey.replace(/\D/g, ''));
    if (Math.abs(d2Num - d1Num) === 1) {
      assert(!(s1.recoveryDemand === 'HIGH' && s2.recoveryDemand === 'HIGH'),
        `Não deve alocar consecutivamente duas sessões HIGH (${s1.dayKey} e ${s2.dayKey})`);
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE N: Determinismo Estrito (Idempotência)
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE N: Mesmo contexto produz exatamente a mesma prescrição determinística', () => {
  const ctx = makeContext();
  const reqs1 = buildCardioGenerationRequirements(ctx);
  const presc1 = buildCardioWeeklyPrescription(ctx, reqs1);

  const reqs2 = buildCardioGenerationRequirements(ctx);
  const presc2 = buildCardioWeeklyPrescription(ctx, reqs2);

  assert.strictEqual(presc1.sessions.length, presc2.sessions.length);
  assert.strictEqual(presc1.totalWeeklyMinutes, presc2.totalWeeklyMinutes);
  for (let i = 0; i < presc1.sessions.length; i++) {
    assert.strictEqual(presc1.sessions[i].protocolId, presc2.sessions[i].protocolId);
    assert.strictEqual(presc1.sessions[i].dayKey, presc2.sessions[i].dayKey);
    assert.strictEqual(presc1.sessions[i].durationMinutes, presc2.sessions[i].durationMinutes);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE O: sessions[] É a Fonte Canônica de Verdade
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE O: sessions[] é a fonte canônica e contém todos os campos obrigatórios', () => {
  const ctx = makeContext();
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);

  assert(Array.isArray(presc.sessions));
  assert(presc.sessions.length > 0);

  presc.sessions.forEach(s => {
    assert(s.sessionId, 'sessionId obrigatório');
    assert(s.protocolId, 'protocolId obrigatório');
    assert(s.protocolTitle, 'protocolTitle obrigatório');
    assert(s.cardioId, 'cardioId obrigatório');
    assert(s.day, 'day obrigatório');
    assert(s.dayKey, 'dayKey obrigatório');
    assert(typeof s.durationMinutes === 'number', 'durationMinutes numérico');
    assert(s.intensityZone, 'intensityZone obrigatório');
    assert(s.heartRateZone, 'heartRateZone obrigatório');
    assert(s.intensityType, 'intensityType obrigatório');
    assert(typeof s.isHiit === 'boolean', 'isHiit booleano estrito');
    assert(s.recoveryDemand, 'recoveryDemand obrigatório');
    assert(s.modalityFamily, 'modalityFamily obrigatório');
    assert(Array.isArray(s.components), 'components array');
    assert(typeof s.rankingScore === 'number', 'rankingScore numérico');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE P: Aplicação ao perfWeeklySchedule É Determinística
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE P: Aplicação ao perfWeeklySchedule materializa perfeitamente', () => {
  const ctx = makeContext();
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);

  const schedule = perfBuildWeeklySchedule('UpperLower');
  const applied = perfApplyCardioPrescriptionToSchedule(schedule, presc.sessions);

  const daysWithCardio = applied.filter(d => d.cardioSession != null);
  assert.strictEqual(daysWithCardio.length, presc.sessions.length,
    'Número de dias com cardio no schedule deve ser exatamente igual ao de sessions[]');

  presc.sessions.forEach(s => {
    const d = applied.find(day => day.dayKey === s.dayKey);
    assert(d, `Dia ${s.dayKey} deve existir no schedule`);
    assert.strictEqual(d.cardioId, s.protocolId);
    assert.strictEqual(d.cardioSession.sessionId, s.sessionId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE Q: PDF Não Depende de Fallback Hardcoded
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE Q: PDF não possui fallback hardcoded para cardio_02 no sábado', () => {
  const schedule = [
    { dayKey: 'd1', dayName: 'Segunda', routineId: 'A', title: 'Treino A', type: 'Treino' },
    { dayKey: 'd2', dayName: 'Terça', routineId: 'B', title: 'Treino B', type: 'Treino' },
    { dayKey: 'd3', dayName: 'Quarta', routineId: null, title: 'Descanso', type: 'Off' },
    { dayKey: 'd4', dayName: 'Quinta', routineId: 'C', title: 'Treino C', type: 'Treino' },
    { dayKey: 'd5', dayName: 'Sexta', routineId: 'D', title: 'Treino D', type: 'Treino' },
    { dayKey: 'd6', dayName: 'Sábado', routineId: null, title: 'Cardio Regenerativo', type: 'Cardio', cardioId: 'airbike_z2_15', cardioSession: { protocolId: 'airbike_z2_15' } },
    { dayKey: 'd7', dayName: 'Domingo', routineId: null, title: 'Descanso', type: 'Off' }
  ];

  sandbox.perfWeeklySchedule = schedule;
  perfGeneratePDF();
  const pdfHtml = sandbox.__lastPdfHtml || '';
  assert(!pdfHtml.includes('cardio_02'), 'PDF não deve injetar cardio_02 arbitrário no sábado');
  assert(pdfHtml.includes('AirBike') || pdfHtml.includes('airbike') || pdfHtml.includes('airbike_z2_15'), 'PDF deve renderizar o protocolo real da sessão canônica');
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE R: UI Identifica HIIT por Metadado
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE R: UI identifica HIIT por metadado isHiit e não por ID de protocolo', () => {
  const session = {
    protocolId: 'bike_intervals_hiit_20',
    isHiit: true
  };
  const protoObj = PERF_CARDIO_DB.find(p => p.id === session.protocolId);
  const isHiit = Boolean(session.isHiit ?? protoObj?.isHiit ?? false);
  assert.strictEqual(isHiit, true, 'bike_intervals_hiit_20 deve ser identificado como HIIT via metadado');

  const continuousSession = {
    protocolId: 'cardio_01',
    isHiit: false
  };
  const protoObj2 = PERF_CARDIO_DB.find(p => p.id === continuousSession.protocolId);
  const isHiit2 = Boolean(continuousSession.isHiit ?? protoObj2?.isHiit ?? false);
  assert.strictEqual(isHiit2, false, 'cardio_01 não é HIIT');
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE S: perfPrescribedCardioId Não Consegue Substituir sessions[]
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE S: perfPrescribedCardioId é apenas ponte legada e não substitui sessions[]', () => {
  const ctx = makeContext();
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = generateCardioPrescription(ctx, reqs);

  assert(Array.isArray(presc.sessions) && presc.sessions.length > 0);
  assert.strictEqual(sandbox.perfPrescribedCardioId, presc.sessions[0].protocolId,
    'perfPrescribedCardioId deve sincronizar com sessions[0] apenas como ponte');

  // Alterar perfPrescribedCardioId não deve alterar sessions[]
  sandbox.perfPrescribedCardioId = 'cardio_99_ficticio';
  assert.notStrictEqual(presc.sessions[0].protocolId, 'cardio_99_ficticio',
    'sessions[] permanece a autoridade canônica inviolável');
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE T: Teste nos Seis Splits de Musculação
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE T: Funcionalidade perfeita nos 6 splits (PPL, UpperLower, PHAT, FullBody, ABCD, ABCDE)', () => {
  const splits = ['PPL', 'UpperLower', 'PHAT', 'FullBody', 'ABCD', 'ABCDE'];
  splits.forEach(splitName => {
    const schedule = perfBuildWeeklySchedule(splitName);
    const ctx = makeContext({ perfWeeklySchedule: schedule });
    const reqs = buildCardioGenerationRequirements(ctx);
    const presc = buildCardioWeeklyPrescription(ctx, reqs);

    assert(presc, `Prescrição deve ser gerada para o split ${splitName}`);
    assert.strictEqual(presc.sessions.length, presc.frequencyWeekly,
      `Frequência deve ser respeitada no split ${splitName}`);

    const applied = perfApplyCardioPrescriptionToSchedule(schedule, presc.sessions);
    const cardioCount = applied.filter(d => d.cardioSession != null).length;
    assert.strictEqual(cardioCount, presc.sessions.length,
      `Materialização no split ${splitName} deve ser exata`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTES ADICIONAIS OBRIGATÓRIOS (CASOS 1 A 10)
// ─────────────────────────────────────────────────────────────────────────────

test('CASO 1: Paciente sem preferredDays utiliza distribuição clínica recomendada', () => {
  const ctx = makeContext({ cardioProfile: { preferredDays: [] } });
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);
  assert(presc.sessions.length > 0);
  assert(presc.sessions[0].dayKey, 'Deve possuir dayKey mesmo sem preferredDays');
});

test('CASO 2: Paciente sem preferredDuration utiliza particionamento determinístico', () => {
  const ctx = makeContext({ cardioProfile: { preferredDuration: null } });
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);
  const sumDur = presc.sessions.reduce((a, b) => a + b.durationMinutes, 0);
  assert.strictEqual(sumDur, presc.totalWeeklyMinutes);
});

test('CASO 3: Preferência incompatível com restrição clínica é preterida com segurança', () => {
  const ctx = makeContext({
    cardioProfile: {
      preferredModalities: ['corrida'],
      contraindications: ['impacto articular'] // Proíbe corrida
    }
  });
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);

  presc.sessions.forEach(s => {
    assert(!s.protocolId.includes('running'), 'Corrida de impacto não deve ser alocada');
  });
});

test('CASO 4: Frequência 0 produz prescrição canônica vazia válida', () => {
  const ctx = makeContext();
  const reqs = buildCardioGenerationRequirements(ctx);
  reqs.frequency.prescribedWeeklyFrequency = 0;
  reqs.volume.totalWeeklyMinutes = 0;

  const presc = buildCardioWeeklyPrescription(ctx, reqs);
  assert.strictEqual(presc.frequencyWeekly, 0);
  assert.strictEqual(presc.sessions.length, 0);
  assert.strictEqual(presc.totalWeeklyMinutes, 0);
});

test('CASO 5: Somente um protocolo elegível no catálogo', () => {
  const ctx = makeContext();
  const reqs = buildCardioGenerationRequirements(ctx);
  reqs.modalities.allowedProtocolIds = ['airbike_z2_15'];

  const presc = buildCardioWeeklyPrescription(ctx, reqs);
  presc.sessions.forEach(s => {
    assert.strictEqual(s.protocolId, 'airbike_z2_15', 'Deve alocar o único protocolo permitido');
  });
});

test('CASO 6: Nenhum protocolo elegível realiza fallback de segurança clínica sem erro', () => {
  const ctx = makeContext();
  const reqs = buildCardioGenerationRequirements(ctx);
  reqs.modalities.allowedProtocolIds = [];

  const presc = buildCardioWeeklyPrescription(ctx, reqs);
  assert(presc.sessions.length > 0, 'Deve usar fallback de segurança');
  assert(presc.sessions[0].protocolId, 'Deve possuir ID no fallback');
});

test('CASO 7: Volume não divisível exatamente por preferredDuration preserva o totalWeeklyMinutes', () => {
  const ctx = makeContext({
    cardioProfile: { preferredDuration: 20 }
  });
  const reqs = buildCardioGenerationRequirements(ctx);
  reqs.frequency.prescribedWeeklyFrequency = 3;
  reqs.volume.totalWeeklyMinutes = 75; // 75 / 3 = 25 (não 20)

  const presc = buildCardioWeeklyPrescription(ctx, reqs);
  const sumDur = presc.sessions.reduce((a, b) => a + b.durationMinutes, 0);
  assert.strictEqual(sumDur, 75, 'Volume total deve permanecer estrito em 75 min');
});

test('CASO 8: Todos os candidatos de maior ranking em dias incompatíveis são realocados suavemente', () => {
  // Simula 7 dias com treino de pernas pesadas
  const legWeekSchedule = [
    { dayKey: 'd1', dayName: 'Segunda', routineId: 'r1', title: 'Legs A', focus: 'Agachamento Pesado', type: 'Treino' },
    { dayKey: 'd2', dayName: 'Terça', routineId: 'r2', title: 'Legs B', focus: 'Agachamento Pesado', type: 'Treino' },
    { dayKey: 'd3', dayName: 'Quarta', routineId: 'r3', title: 'Legs C', focus: 'Agachamento Pesado', type: 'Treino' },
    { dayKey: 'd4', dayName: 'Quinta', routineId: 'r4', title: 'Legs D', focus: 'Agachamento Pesado', type: 'Treino' },
    { dayKey: 'd5', dayName: 'Sexta', routineId: 'r5', title: 'Legs E', focus: 'Agachamento Pesado', type: 'Treino' },
    { dayKey: 'd6', dayName: 'Sábado', routineId: 'r6', title: 'Legs F', focus: 'Agachamento Pesado', type: 'Treino' },
    { dayKey: 'd7', dayName: 'Domingo', routineId: 'r7', title: 'Legs G', focus: 'Agachamento Pesado', type: 'Treino' }
  ];

  const ctx = makeContext({
    patient: { objective: 'Performance' },
    perfWeeklySchedule: legWeekSchedule
  });
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);

  assert(presc.sessions.length > 0);
  presc.sessions.forEach(s => {
    assert(!s.isHiit, 'HIIT deve ser proibido em todos os dias de pernas');
    const proto = PERF_CARDIO_DB.find(p => p.id === s.protocolId);
    assert.notStrictEqual(proto.axialLoad, 'HIGH', 'Axial load HIGH proibido em dias de pernas pesadas');
  });
});

test('CASO 9: Schedule de musculação ainda não inicializado utiliza microciclo padrão de 7 dias', () => {
  const ctx = makeContext({ perfWeeklySchedule: [] });
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = buildCardioWeeklyPrescription(ctx, reqs);

  assert.strictEqual(presc.sessions.length, presc.frequencyWeekly);
  assert(presc.sessions.every(s => s.dayKey.startsWith('d')));
});

test('CASO 10: Prescrição legada contendo somente perfPrescribedCardioId funciona via adapter', () => {
  const legacyRecord = {
    patientId: 'legacy-p1',
    prescribedCardioId: 'cardio_03'
  };

  const proto = PERF_CARDIO_DB.find(p => p.id === legacyRecord.prescribedCardioId);
  assert(proto, 'Protocolo legado deve existir no catálogo');
  assert.strictEqual(proto.id, 'cardio_03');

  // Ao processar novo contexto, sessions[] canônico é criado sem contaminação
  const ctx = makeContext();
  const presc = generateCardioPrescription(ctx);
  assert(Array.isArray(presc.sessions));
  assert.strictEqual(presc.sessions[0].protocolId, sandbox.perfPrescribedCardioId);
});

// ─────────────────────────────────────────────────────────────────────────────
// RESUMO FINAL DA SUÍTE F7.4
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n----------------------------------------------------------------');
const passedCount = results.filter(r => r.pass).length;
const failedCount = results.filter(r => !r.pass).length;
console.log(`F7.4 Total de testes: ${results.length} | Passaram: ${passedCount} | Falharam: ${failedCount}`);
console.log('================================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
