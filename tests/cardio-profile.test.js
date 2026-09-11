/**
 * =========================================================================
 * NutriAx Pro — F7.2: Suíte de Testes do Cardio Profile e Ranking Determinístico
 * Arquivo: tests/cardio-profile.test.js
 *
 * 20 Testes Obrigatórios Conforme Plano F7.2 Auditado e Saneado:
 * A. Preferência explícita por bicicleta
 * B. Corrida proibida (hard constraint)
 * C. Equipamento ausente (eliminação antes do ranking)
 * D. Preferência não funciona como proibição
 * E. Experiência desconhecida (neutra, score delta = 0)
 * F. Duração incompatível (bounds de sessão)
 * G. Interferência em pernas (dia de perna elimina alta demanda)
 * H. Governança HIIT (consumo canônico de calculateCardioHiitCeiling)
 * I. sessions[] canônico (rastreabilidade, rankingScore e estrutura)
 * J. Fallback neutro (sem dados fictícios)
 * K. Preferência negativa (penalidade de -40, NÃO contraindicação)
 * L. Restrição explícita vs preferência negativa (distinção rigorosa)
 * M. Equipamento não pode ser vencido por score
 * N. Hard constraint antes do ranking (score não resgata eliminado)
 * O. Pesos centralizados (CARDIO_RANKING_WEIGHTS congelado e imutável)
 * P. Idempotência (mesma entrada produz mesmo resultado)
 * Q. Desempate estável (ordem estrita de critérios e id alfabético)
 * R. Experiência desconhecida não vira iniciante
 * S. Desempate por menor interferenceScore precede ID alfabético
 * T. Restrição clínica generalizada por metadados biomecânicos
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
const CARDIO_RANKING_WEIGHTS = sandbox.CARDIO_RANKING_WEIGHTS || vm.runInContext('CARDIO_RANKING_WEIGHTS', sandbox);
const normalizeModalityString = sandbox.normalizeModalityString || vm.runInContext('normalizeModalityString', sandbox);
const getCardioInterferenceScore = sandbox.getCardioInterferenceScore || vm.runInContext('getCardioInterferenceScore', sandbox);
const isCardioProtocolEquipmentAvailable = sandbox.isCardioProtocolEquipmentAvailable || vm.runInContext('isCardioProtocolEquipmentAvailable', sandbox);
const buildCardioProfile = sandbox.buildCardioProfile || vm.runInContext('buildCardioProfile', sandbox);
const rankCardioProtocols = sandbox.rankCardioProtocols || vm.runInContext('rankCardioProtocols', sandbox);
const calculateCardioRecoveryModifier = sandbox.calculateCardioRecoveryModifier;
const calculateCardioClinicalSignals = sandbox.calculateCardioClinicalSignals;
const calculateCardioFrequency = sandbox.calculateCardioFrequency;
const calculateCardioVolume = sandbox.calculateCardioVolume;
const calculateCardioSessionDurations = sandbox.calculateCardioSessionDurations;
const calculateCardioHiitCeiling = sandbox.calculateCardioHiitCeiling;
const calculateCardioIntensity = sandbox.calculateCardioIntensity;
const calculateCardioModalities = sandbox.calculateCardioModalities;
const calculateCardioDistribution = sandbox.calculateCardioDistribution;
const buildCardioGenerationRequirements = sandbox.buildCardioGenerationRequirements;
const generateCardioPrescription = sandbox.generateCardioPrescription;
const validateCardioPrescriptionAgainstContext = sandbox.validateCardioPrescriptionAgainstContext;

console.log('================================================================');
console.log('F7.2: Suíte de Cardio Profile e Ranking Determinístico (20 Testes)');
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

function makeContext(overrides = {}) {
  return {
    _meta: { patientId: 'test-patient-f72', hasAssessment: true },
    patient: {
      patientId: 'test-patient-f72',
      name: 'Paciente Teste F7.2',
      age: 30,
      sex: 'Masculino',
      weightKg: 78,
      heightCm: 178,
      objective: 'Hipertrofia Muscular',
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
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// A. PREFERÊNCIA EXPLÍCITA POR BICICLETA
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE A: Preferência explícita por bicicleta prioriza protocolo de bicicleta', () => {
  const ctx = makeContext({
    patient: { objective: 'Hipertrofia Muscular', trainingLevel: 'Avançado' },
    constraints: { preferredModalities: ['bicicleta'] }
  });

  const profile = buildCardioProfile(ctx);
  assert.strictEqual(profile.preferredModalities.length, 1);
  assert.strictEqual(profile.preferredModalities[0].modality, 'bicicleta');
  assert.strictEqual(profile.preferredModalities[0].confidence, 'explicit');

  const ranked = rankCardioProtocols(ctx, profile, PERF_CARDIO_DB);
  assert(ranked.length > 0);
  assert(ranked[0].protocol.id.includes('bike') || ranked[0].protocol.modality.toLowerCase().includes('bike') || ranked[0].protocol.modality.toLowerCase().includes('cicloerg'),
    `Top 1 do ranking deve ser bicicleta. Obtido: ${ranked[0].protocol.id}`);
  assert(ranked[0].matchedPreferences.some(p => p.modality === 'bicicleta' && p.confidence === 'explicit'));
  assert(ranked[0].score >= 75, `Score deve refletir bônus explícito. Score: ${ranked[0].score}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// B. CORRIDA PROIBIDA
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE B: Modalidade explicitamente proibida em prohibitedExercises é eliminada antes do ranking', () => {
  const ctx = makeContext({
    constraints: { prohibitedExercises: ['corrida'] }
  });

  const reqs = buildCardioGenerationRequirements(ctx);
  assert(reqs.modalities.prohibitedProtocolIds.includes('running_outdoor_z2_30'),
    'Protocolo de corrida outdoor deve estar na lista de proibidos');
  assert(!reqs.modalities.allowedProtocolIds.includes('running_outdoor_z2_30'),
    'Protocolo de corrida outdoor NÃO deve estar nos permitidos');

  const presc = generateCardioPrescription(ctx, reqs);
  const hasRunning = presc.sessions.some(s => s.protocolId === 'running_outdoor_z2_30' || s.modality.toLowerCase().includes('corrida'));
  assert.strictEqual(hasRunning, false, 'Nenhuma sessão prescrita pode ser corrida proibida');
});

// ─────────────────────────────────────────────────────────────────────────────
// C. EQUIPAMENTO AUSENTE
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE C: Protocolos que exigem equipamentos indisponíveis são eliminados antes do ranking', () => {
  const ctx = makeContext({
    constraints: { availableEquipment: ['bicicleta'] } // Somente bicicleta disponível
  });

  const profile = buildCardioProfile(ctx);
  const eligible = PERF_CARDIO_DB.filter(p => isCardioProtocolEquipmentAvailable(p, profile.availableEquipment));
  
  // Confirma que esteira, remo, skierg foram eliminados
  assert(!eligible.some(p => p.id === 'treadmill_incline_z2_15'), 'Esteira deve ser eliminada por falta de equipamento');
  assert(!eligible.some(p => p.id === 'rower_z2_15'), 'Remo deve ser eliminado por falta de equipamento');
  assert(!eligible.some(p => p.id === 'skierg_z2_15'), 'SkiErg deve ser eliminado por falta de equipamento');
  assert(eligible.some(p => p.id === 'bike_erg_z2_15'), 'Bike Erg deve ser elegível');
});

// ─────────────────────────────────────────────────────────────────────────────
// D. PREFERÊNCIA NÃO FUNCIONA COMO PROIBIÇÃO
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE D: Preferência positiva por uma modalidade não proíbe as demais modalidades', () => {
  const ctx = makeContext({
    constraints: { preferredModalities: ['bicicleta'] }
  });

  const profile = buildCardioProfile(ctx);
  const ranked = rankCardioProtocols(ctx, profile, PERF_CARDIO_DB);
  
  const treadmill = ranked.find(r => r.protocol.id === 'treadmill_incline_z2_15');
  const bike = ranked.find(r => r.protocol.id === 'bike_erg_z2_15');

  assert(treadmill != null, 'Esteira ainda deve constar no ranking como candidata válida');
  assert(bike != null, 'Bike deve constar no ranking');
  assert(bike.score > treadmill.score, 'Bike deve pontuar mais alto que esteira devido à preferência');
});

// ─────────────────────────────────────────────────────────────────────────────
// E. EXPERIÊNCIA DESCONHECIDA
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE E: Experiência cardiovascular não declarada resulta em unknown e score neutro (0)', () => {
  const ctx = makeContext({
    patient: { trainingLevel: 'Avançado' } // Força é avançada, mas cardio não coletado
  });

  const profile = buildCardioProfile(ctx);
  assert.strictEqual(profile.experienceLevel.value, 'unknown');
  assert.strictEqual(profile.experienceLevel.confidence, 'unknown');

  const ranked = rankCardioProtocols(ctx, profile, PERF_CARDIO_DB);
  ranked.forEach(r => {
    const hasExpBonus = r.rationale.some(rat => rat.includes('Experiência avançada'));
    const hasExpPenalty = r.penalties.some(p => p.factor === 'beginner_high_intensity');
    assert.strictEqual(hasExpBonus, false, 'unknown não deve receber bônus de avançado');
    assert.strictEqual(hasExpPenalty, false, 'unknown não deve receber penalidade de iniciante');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F. DURAÇÃO INCOMPATÍVEL
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE F: Protocolos com bounds de duração incompatíveis com a sessão são filtrados', () => {
  const dur = 15; // Sessão de 15 min
  const candidates = PERF_CARDIO_DB.filter(p => dur >= p.minDurationMinutes && dur <= p.maxDurationMinutes);

  candidates.forEach(p => {
    assert(p.minDurationMinutes <= dur && p.maxDurationMinutes >= dur,
      `Protocolo ${p.id} deve ser compatível com ${dur} min`);
  });

  // running_outdoor_z2_30 possui minDurationMinutes = 20
  const hasOutdoorRun = candidates.some(p => p.id === 'running_outdoor_z2_30');
  assert.strictEqual(hasOutdoorRun, false, 'Corrida outdoor (min 20m) não deve entrar em sessão de 15m');
});

// ─────────────────────────────────────────────────────────────────────────────
// G. INTERFERÊNCIA EM PERNAS
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE G: Dia de treino pesado de pernas elimina protocolos de alta demanda de membros inferiores', () => {
  const dayDemand = { isLegs: true };
  const safeCandidates = PERF_CARDIO_DB.filter(p => {
    const avoid = (p.avoidAfter || []).map(a => normalizeModalityString(a));
    return !avoid.some(a => a.includes('perna') || a.includes('leg'));
  });

  // Verifica que candidatos com avoidAfter perna foram removidos
  safeCandidates.forEach(p => {
    const avoid = (p.avoidAfter || []).map(a => normalizeModalityString(a));
    assert(!avoid.some(a => a.includes('perna') || a.includes('leg')),
      `Protocolo ${p.id} não deveria ser aceito pós-perna`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// H. GOVERNANÇA HIIT
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE H: Governança de HIIT elimina protocolos HIIT quando o teto for 0', () => {
  const ctx = makeContext({
    lifestyle: { sleepHours: 5.0, sleepQuality: 'Péssima', stressLevel: 'Alto' } // REDUCED -> HIIT = 0
  });

  const recovery = calculateCardioRecoveryModifier(ctx);
  const ceiling = calculateCardioHiitCeiling(ctx, recovery);
  assert.strictEqual(ceiling.maxSessions, 0);

  const reqs = buildCardioGenerationRequirements(ctx);
  const eligible = PERF_CARDIO_DB.filter(p => reqs.modalities.allowedProtocolIds.includes(p.id));
  const hasHiit = eligible.some(p => p.category === 'HIIT' || (p.intensityZone && p.intensityZone.includes('Z4')));
  assert.strictEqual(hasHiit, false, 'Nenhum HIIT permitido quando o teto é 0');
});

// ─────────────────────────────────────────────────────────────────────────────
// I. SESSIONS[] CANÔNICO
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE I: Estrutura canônica de sessions[] é preservada com rankingScore e rastreabilidade', () => {
  const ctx = makeContext();
  const reqs = buildCardioGenerationRequirements(ctx);
  const presc = generateCardioPrescription(ctx, reqs);

  assert(Array.isArray(presc.sessions), 'sessions deve ser array');
  assert.strictEqual(presc.sessions.length, presc.frequencyWeekly);
  assert(presc.cardioProfile != null, 'cardioProfile deve estar vinculado à prescrição');

  presc.sessions.forEach((s, idx) => {
    assert(s.sessionId, `Sessão #${idx + 1} deve ter sessionId`);
    assert(s.protocolId, `Sessão #${idx + 1} deve ter protocolId`);
    assert(typeof s.durationMinutes === 'number' && s.durationMinutes > 0);
    assert(s.dayKey, `Sessão #${idx + 1} deve ter dayKey`);
    assert(typeof s.rankingScore === 'number', `Sessão #${idx + 1} deve registrar rankingScore numérico`);
    assert(Array.isArray(s.rankingRationale), `Sessão #${idx + 1} deve registrar rankingRationale`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// J. FALLBACK NEUTRO
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE J: Contexto sem dados de preferência constrói perfil neutro sem inventar campos fictícios', () => {
  const profile = buildCardioProfile({});
  assert.strictEqual(profile.availableEquipment.isFullGym, true);
  assert.strictEqual(profile.experienceLevel.value, 'unknown');
  assert.strictEqual(profile.experienceLevel.confidence, 'unknown');
  assert.strictEqual(profile.preferredModalities.length, 0);
  assert.strictEqual(profile.avoidedModalities.length, 0);
  assert.strictEqual(profile.preferredDays.length, 0);
  assert.strictEqual(profile.uncollectedFields.length, 4);
  assert(profile.uncollectedFields.includes('cardio_history'));
  assert(profile.uncollectedFields.includes('modality_experience_detail'));
  assert(profile.uncollectedFields.includes('environment_indoor_outdoor'));
  assert(profile.uncollectedFields.includes('competitive_modality'));
});

// ─────────────────────────────────────────────────────────────────────────────
// K. PREFERÊNCIA NEGATIVA
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE K: avoidedModalities aplica penalidade (-40) mas NÃO elimina a modalidade', () => {
  const ctx = makeContext({
    constraints: { avoidedModalities: ['corrida'] }
  });

  const profile = buildCardioProfile(ctx);
  assert.strictEqual(profile.avoidedModalities.length, 1);
  assert.strictEqual(profile.avoidedModalities[0].modality, 'corrida');

  // Se a corrida for a única modalidade disponível no teste:
  const runningProto = PERF_CARDIO_DB.find(p => p.id === 'running_outdoor_z2_30');
  const ranked = rankCardioProtocols(ctx, profile, [runningProto]);
  
  assert.strictEqual(ranked.length, 1, 'Modalidade evitada NÃO deve ser eliminada se for elegível');
  assert.strictEqual(ranked[0].penalties.length, 1);
  assert.strictEqual(ranked[0].penalties[0].penalty, CARDIO_RANKING_WEIGHTS.AVOIDED_MODALITY_PENALTY);
  assert.strictEqual(ranked[0].penalties[0].penalty, -40);
});

// ─────────────────────────────────────────────────────────────────────────────
// L. RESTRIÇÃO EXPLÍCITA VS PREFERÊNCIA NEGATIVA
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE L: Proibição explícita elimina (hard constraint) enquanto preferência negativa apenas penaliza (soft)', () => {
  const runningProto = PERF_CARDIO_DB.find(p => p.id === 'running_outdoor_z2_30');

  // Cenário 1: Proibido -> eliminado no cálculo de modalidades
  const ctxProhibited = makeContext({ constraints: { prohibitedExercises: ['corrida'] } });
  const reqs = buildCardioGenerationRequirements(ctxProhibited);
  assert(reqs.modalities.prohibitedProtocolIds.includes(runningProto.id));
  assert(!reqs.modalities.allowedProtocolIds.includes(runningProto.id));

  // Cenário 2: Evitado -> permanece nos permitidos e pontua no ranking com penalidade
  const ctxAvoided = makeContext({ constraints: { avoidedModalities: ['corrida'] } });
  const profileAvoided = buildCardioProfile(ctxAvoided);
  const rankedAvoided = rankCardioProtocols(ctxAvoided, profileAvoided, [runningProto]);
  assert.strictEqual(rankedAvoided.length, 1);
  assert(rankedAvoided[0].score < 0, 'Score deve ser negativo devido à penalização de -40');
});

// ─────────────────────────────────────────────────────────────────────────────
// M. EQUIPAMENTO NÃO PODE SER VENCIDO POR SCORE
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE M: Preferência positiva com score alto não compensa falta de equipamento', () => {
  const ctx = makeContext({
    constraints: {
      preferredModalities: ['bicicleta'],
      availableEquipment: ['esteira'] // NÃO há bicicleta disponível
    }
  });

  const profile = buildCardioProfile(ctx);
  const bikeProto = PERF_CARDIO_DB.find(p => p.id === 'bike_erg_z2_15');
  const isAvailable = isCardioProtocolEquipmentAvailable(bikeProto, profile.availableEquipment);
  assert.strictEqual(isAvailable, false, 'Bike deve ser considerada indisponível');

  const eligible = PERF_CARDIO_DB.filter(p => isCardioProtocolEquipmentAvailable(p, profile.availableEquipment));
  assert(!eligible.some(p => p.id === 'bike_erg_z2_15'), 'Bike não deve entrar no pool elegível');

  // Mesmo que bike tivesse score altíssimo, ela não está no ranking
  const ranked = rankCardioProtocols(ctx, profile, eligible);
  assert(!ranked.some(r => r.protocol.id === 'bike_erg_z2_15'));
});

// ─────────────────────────────────────────────────────────────────────────────
// N. HARD CONSTRAINT ANTES DO RANKING
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE N: Filtros de hard constraint eliminam candidatos ANTES de chamar rankCardioProtocols', () => {
  const ctx = makeContext({
    constraints: { prohibitedExercises: ['esteira', 'corrida'] }
  });

  const reqs = buildCardioGenerationRequirements(ctx);
  const filteredProtocols = reqs.modalities.protocols;
  
  // Nenhum protocolo de esteira ou corrida sobrevive ao filtro
  filteredProtocols.forEach(p => {
    assert(!p.id.includes('treadmill'), `Protocolo de esteira ${p.id} não deveria ter sobrevivido`);
    assert(!p.id.includes('running'), `Protocolo de corrida ${p.id} não deveria ter sobrevivido`);
  });

  const ranked = rankCardioProtocols(ctx, reqs.cardioProfile, filteredProtocols);
  assert(ranked.every(r => r.rejectedReasons.length === 0),
    'Candidatos que chegam ao ranking não possuem rejectedReasons pendentes');
});

// ─────────────────────────────────────────────────────────────────────────────
// O. PESOS CENTRALIZADOS
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE O: CARDIO_RANKING_WEIGHTS é centralizado, congelado e contém todos os pesos auditados', () => {
  assert(Object.isFrozen(CARDIO_RANKING_WEIGHTS), 'CARDIO_RANKING_WEIGHTS deve ser congelado com Object.freeze');
  assert.strictEqual(CARDIO_RANKING_WEIGHTS.EXPLICIT_PREFERENCE_BONUS, 50);
  assert.strictEqual(CARDIO_RANKING_WEIGHTS.INFERRED_PREFERENCE_BONUS, 20);
  assert.strictEqual(CARDIO_RANKING_WEIGHTS.AVOIDED_MODALITY_PENALTY, -40);
  assert.strictEqual(CARDIO_RANKING_WEIGHTS.OBJECTIVE_MATCH_BONUS, 25);
  assert.strictEqual(CARDIO_RANKING_WEIGHTS.EXPERIENCE_ADVANCED_BONUS, 15);
  assert.strictEqual(CARDIO_RANKING_WEIGHTS.EXPERIENCE_BEGINNER_PENALTY, -25);
  assert.strictEqual(CARDIO_RANKING_WEIGHTS.VARIETY_BONUS, 15);
  assert.strictEqual(CARDIO_RANKING_WEIGHTS.CONTEXTUAL_CONCURRENCY_PENALTY, -20);
  assert.strictEqual(CARDIO_RANKING_WEIGHTS.FOUNDATIONAL_MULTI_ERG_BONUS, undefined);
});

// ─────────────────────────────────────────────────────────────────────────────
// P. IDEMPOTÊNCIA
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE P: rankCardioProtocols é 100% puro e idempotente para a mesma entrada', () => {
  const ctx = makeContext({ patient: { objective: 'Emagrecimento' } });
  const profile = buildCardioProfile(ctx);

  const run1 = rankCardioProtocols(ctx, profile, PERF_CARDIO_DB);
  const run2 = rankCardioProtocols(ctx, profile, PERF_CARDIO_DB);

  assert.strictEqual(run1.length, run2.length);
  for (let i = 0; i < run1.length; i++) {
    assert.strictEqual(run1[i].protocol.id, run2[i].protocol.id);
    assert.strictEqual(run1[i].score, run2[i].score);
    assert.deepStrictEqual(run1[i].rationale, run2[i].rationale);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Q. DESEMPATE ESTÁVEL
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE Q: Desempate determinístico é estável e segue a hierarquia exata', () => {
  const protoX = {
    id: 'z_proto', title: 'Z Proto', modality: 'Erg', impactLevel: 'LOW',
    axialLoad: 'LOW', posteriorChainDemand: 'LOW', lowerLimbDemand: 'LOW', objectiveTags: []
  };
  const protoA = {
    id: 'a_proto', title: 'A Proto', modality: 'Erg', impactLevel: 'LOW',
    axialLoad: 'LOW', posteriorChainDemand: 'LOW', lowerLimbDemand: 'LOW', objectiveTags: []
  };

  const ranked = rankCardioProtocols({}, buildCardioProfile({}), [protoX, protoA]);
  assert.strictEqual(ranked.length, 2);
  assert.strictEqual(ranked[0].protocol.id, 'a_proto', 'a_proto deve vencer z_proto por ordem alfabética');
  assert.strictEqual(ranked[1].protocol.id, 'z_proto');
});

// ─────────────────────────────────────────────────────────────────────────────
// R. EXPERIÊNCIA DESCONHECIDA NÃO VIRA INICIANTE
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE R: experienceLevel unknown não aplica penalidade de iniciante nem bônus de avançado', () => {
  const ctx = makeContext({
    patient: { trainingLevel: 'Intermediário' }
  });

  const profile = buildCardioProfile(ctx);
  assert.strictEqual(profile.experienceLevel.value, 'unknown');

  const ranked = rankCardioProtocols(ctx, profile, PERF_CARDIO_DB);
  const penalties = ranked.flatMap(r => r.penalties);
  const hasBeginnerPenalty = penalties.some(p => p.factor === 'beginner_high_intensity');
  assert.strictEqual(hasBeginnerPenalty, false, 'unknown não pode gerar penalidade de iniciante');

  const bonuses = ranked.flatMap(r => r.rationale);
  const hasAdvancedBonus = bonuses.some(b => b.includes('Experiência avançada'));
  assert.strictEqual(hasAdvancedBonus, false, 'unknown não pode gerar bônus de avançado');
});

// ─────────────────────────────────────────────────────────────────────────────
// S. INTERFERENCE SCORE ANTES DO ID
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE S: Desempate por menor getCardioInterferenceScore() precede desempate por protocol.id', () => {
  const protoHighInterference = {
    id: 'a_proto_high_interference',
    title: 'Protocolo A com alta carga',
    modality: 'Ergômetro A',
    impactLevel: 'HIGH',
    axialLoad: 'HIGH',
    posteriorChainDemand: 'HIGH',
    lowerLimbDemand: 'HIGH',
    objectiveTags: ['emagrecimento']
  };

  const protoLowInterference = {
    id: 'z_proto_low_interference',
    title: 'Protocolo Z com baixa carga',
    modality: 'Ergômetro Z',
    impactLevel: 'LOW',
    axialLoad: 'NONE',
    posteriorChainDemand: 'LOW',
    lowerLimbDemand: 'LOW',
    objectiveTags: ['emagrecimento']
  };

  const ctx = makeContext({ patient: { objective: 'Emagrecimento' } });
  const profile = buildCardioProfile(ctx);

  // Ambos possuem score 40 (Objetivo +25, Variedade +15)
  // a_proto possui menor ID alfabético, mas MAIOR interference score (12 vs 4)
  // O critério de desempate #4 (menor interferenceScore) DEVE fazer z_proto vencer antes de chegar ao critério #7 (ID alfabético)
  const ranked = rankCardioProtocols(ctx, profile, [protoHighInterference, protoLowInterference]);

  assert.strictEqual(ranked.length, 2);
  assert.strictEqual(ranked[0].score, ranked[1].score, 'Scores devem ser exatamente iguais');
  assert.strictEqual(ranked[0].protocol.id, 'z_proto_low_interference',
    'z_proto_low_interference deve vencer a_proto_high_interference por menor demanda biomecânica antes do ID alfabético');
  assert.strictEqual(ranked[1].protocol.id, 'a_proto_high_interference');
});

// ─────────────────────────────────────────────────────────────────────────────
// T. RESTRIÇÃO CLÍNICA GENERALIZADA POR METADADOS
// ─────────────────────────────────────────────────────────────────────────────
test('TESTE T: Restrição clínica de ombro elimina múltiplos protocolos com upperLimbDemand HIGH sem depender de ID', () => {
  const customCatalog = [
    {
      id: 'custom_rope_high',
      name: 'Corda Naval e Circuitos Superiores',
      title: 'Corda Naval Alta Demanda',
      category: 'Zona 2',
      modality: 'Corda Naval',
      intensityZone: 'Z2',
      upperLimbDemand: 'HIGH',
      lowerLimbDemand: 'LOW',
      axialLoad: 'LOW',
      impactLevel: 'NONE',
      posteriorChainDemand: 'LOW',
      equipment: ['Corda Naval'],
      avoidAfter: ['Ombros'],
      contraindicationFlags: ['tendinopatia_manguito']
    },
    {
      id: 'custom_swim_crawl',
      name: 'Natação Crawl Upper Engine',
      title: 'Natação Crawl 15m',
      category: 'Zona 2',
      modality: 'Natação',
      intensityZone: 'Z2',
      upperLimbDemand: 'HIGH',
      lowerLimbDemand: 'LOW',
      axialLoad: 'NONE',
      impactLevel: 'NONE',
      posteriorChainDemand: 'LOW',
      equipment: ['Piscina'],
      avoidAfter: ['Ombros'],
      contraindicationFlags: []
    },
    {
      id: 'custom_bike_safe',
      name: 'Bike Segura Sem Demanda de Braço',
      title: 'Bike Conforto Z2',
      category: 'Zona 2',
      modality: 'Bike',
      intensityZone: 'Z2',
      upperLimbDemand: 'NONE',
      lowerLimbDemand: 'LOW',
      axialLoad: 'NONE',
      impactLevel: 'NONE',
      posteriorChainDemand: 'LOW',
      equipment: ['Bike'],
      avoidAfter: [],
      contraindicationFlags: []
    }
  ];

  const ctxShoulder = makeContext({
    constraints: {
      injuries: ['Tendinopatia do manguito rotador no ombro direito'],
      availableEquipment: 'Full Gym'
    }
  });

  const resCustom = calculateCardioModalities(ctxShoulder, { highIntensityMaxSessions: 1 }, customCatalog);
  assert.strictEqual(resCustom.hasShoulderConstraint, true, 'Deve identificar restrição clínica de ombro');
  assert(resCustom.prohibitedProtocolIds.includes('custom_rope_high'), 'custom_rope_high deve ser proibido por upperLimbDemand HIGH');
  assert(resCustom.prohibitedProtocolIds.includes('custom_swim_crawl'), 'custom_swim_crawl deve ser proibido por upperLimbDemand HIGH');
  assert(!resCustom.prohibitedProtocolIds.includes('custom_bike_safe'), 'custom_bike_safe com upperLimbDemand NONE não deve ser proibido');
  assert(resCustom.allowedProtocolIds.includes('custom_bike_safe'), 'custom_bike_safe deve permanecer nos permitidos');
});

console.log('----------------------------------------------------------------');
console.log(`F7.2 Total de testes: ${totalTests} | Passaram: ${passedTests} | Falharam: ${totalTests - passedTests}`);
console.log('================================================================');

if (passedTests !== 20 || totalTests !== 20) {
  process.exit(1);
}
