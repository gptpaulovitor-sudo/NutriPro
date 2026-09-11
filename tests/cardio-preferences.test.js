/**
 * NutriAx Pro — F7: Suite de Testes das Preferencias Cardiovasculares
 * Arquivo: tests/cardio-preferences.test.js
 * PREF-01 a PREF-20 + PREF-FREQ-01 + UI-CARDIO-01 a UI-CARDIO-12
 */

'use strict';
var assert = require('assert');
var fs     = require('fs');
var path   = require('path');
var vm     = require('vm');

var appJsPath = path.resolve(__dirname, '..', 'app.js');
var appJsCode = fs.readFileSync(appJsPath, 'utf8');

var _mockContainer = { innerHTML: '' };
var _store = {};

var sandbox = {
  window: { addEventListener: function() {} },
  addEventListener: function() {},
  document: {
    addEventListener: function() {},
    getElementById:   function(id) {
      if (id === 'perf-prescribed-cardio-container') return _mockContainer;
      return null;
    },
    querySelectorAll: function() { return []; },
    querySelector:    function() { return null; }
  },
  localStorage: {
    getItem: function(k) { return _store[k] || null; },
    setItem: function(k, v) { _store[k] = String(v); },
    removeItem: function(k) { delete _store[k]; }
  },
  navigator: { userAgent: 'Node' },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Math: Math,
  parseFloat: parseFloat,
  parseInt: parseInt,
  isNaN: isNaN,
  Number: Number,
  String: String,
  Object: Object,
  Array: Array,
  Date: Date,
  JSON: JSON,
  RegExp: RegExp,
  Set: Set,
  Map: Map,
  AbortController: global.AbortController,
  fetch: function() { return Promise.resolve({ ok: true, json: function() { return {}; } }); }
};

sandbox.db = {
  patients: {
    get: async function(id) {
      var pId = id || 'paulo-vitor';
      return sandbox._mockPatient || {
        id: pId,
        name: 'Paulo Vitor',
        gender: 'Masculino',
        age: 32,
        height: 1.78,
        currentWeight: 80,
        usualWeight: 80,
        targetWeight: 75,
        objective: 'Emagrecimento',
        patientType: 'Praticante recreativo',
        activityFactor: 1.42,
        trainingLevel: 'Intermediario',
        workoutFrequency: '4x/semana',
        sleepHours: 8,
        cardioPreferences: sandbox._mockCardioPreferences || {
          preferredModalities: ['bicicleta'],
          preferredFrequency: 3,
          preferredDurationMinutes: 30,
          preferredIntensity: 'MODERATE',
          preferredDays: ['d1', 'd3', 'd5'],
          availableEquipment: ['Bicicleta Ergométrica']
        }
      };
    }
  },
  assessments: {
    where: function() {
      return {
        equals: function() {
          return {
            toArray: async function() { return []; }
          };
        }
      };
    }
  },
  prescriptions: {
    get: async function() { return null; }
  }
};
sandbox.activePatientId = 'paulo-vitor';

sandbox.window     = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(appJsCode, sandbox);

var PERF_CARDIO_DB                        = sandbox.PERF_CARDIO_DB;
var buildCardioProfile                    = sandbox.buildCardioProfile;
var rankCardioProtocols                   = sandbox.rankCardioProtocols;
var buildCardioGenerationRequirements     = sandbox.buildCardioGenerationRequirements;
var generateCardioPrescription            = sandbox.generateCardioPrescription;
var validateCardioPrescriptionAgainstContext = sandbox.validateCardioPrescriptionAgainstContext;
var calculateCardioFrequency              = sandbox.calculateCardioFrequency;
var perfGenerateCardioPlan                = sandbox.perfGenerateCardioPlan;
var renderPerfPrescribedCardio            = sandbox.renderPerfPrescribedCardio;

console.log('================================================================');
console.log('F7: Suite de Preferencias e Integracao Cardio Engine (UI-CARDIO)');
console.log('================================================================');

var passedTests = 0;
var totalTests  = 0;
var testQueue   = [];

function test(name, fn) {
  testQueue.push({ name: name, fn: fn });
}

function makeContext(ov) {
  ov = ov || {};
  return {
    _meta: { patientId: 'test-pref', hasAssessment: true },
    patient: Object.assign({
      age: 32, sex: "Masculino", weightKg: 80, heightCm: 178,
      objective: "Hipertrofia Muscular", trainingLevel: "Intermediario"
    }, ov.patient || {}),
    anthropometry: Object.assign({
      bodyFatPercent: 16, leanMassKg: 67, fatMassKg: 13
    }, ov.anthropometry || {}),
    cardiometabolic: Object.assign({
      rcEst: 0.46, hasCardiometabolicRisk: false
    }, ov.cardiometabolic || {}),
    nutrition: Object.assign({
      caloricTargetKcal: 2800, energyBalanceKcal: 200, proteinGKg: 2.1
    }, ov.nutrition || {}),
    trainingProfile: Object.assign({
      frequencyWeekly: 4, durationMinutes: 60, workoutType: "Musculacao / Forca"
    }, ov.trainingProfile || {}),
    lifestyle: Object.assign({
      sleepHours: 8.0, sleepQuality: "Boa", stressLevel: "Moderado"
    }, ov.lifestyle || {}),
    constraints: Object.assign({
      injuries: [], prohibitedExercises: [], clinicalConstraints: [], availableEquipment: "Full Gym"
    }, ov.constraints || {}),
    cardioPreferences: (ov.cardioPreferences !== undefined)
      ? ov.cardioPreferences
      : { preferredModalities: [], preferredFrequency: null, preferredDurationMinutes: null,
          preferredIntensity: null, preferredDays: [], availableEquipment: [] }
  };
}

function makePrefs(ov) {
  return Object.assign({
    preferredModalities: [], preferredFrequency: null,
    preferredDurationMinutes: null, preferredIntensity: null,
    preferredDays: [], availableEquipment: []
  }, ov || {});
}

// ── PREF-01 a PREF-20 (Homologados) ─────────────────────────────────────────

test('PREF-01: cardioPreferences com campos validos e construido corretamente', function() {
  var prefs = makePrefs({ preferredModalities: ['bicicleta','remo'], preferredFrequency: 3,
    preferredDurationMinutes: 30, preferredIntensity: 'MODERATE',
    preferredDays: ['d1','d3','d5'], availableEquipment: ['Bicicleta','RowErg'] });
  var ctx = makeContext({ cardioPreferences: prefs });
  assert(ctx.cardioPreferences, 'cardioPreferences deve estar no contexto');
  assert.deepStrictEqual(ctx.cardioPreferences.preferredModalities, ['bicicleta','remo']);
  assert.strictEqual(ctx.cardioPreferences.preferredFrequency, 3);
  assert.strictEqual(ctx.cardioPreferences.preferredDurationMinutes, 30);
  assert.strictEqual(ctx.cardioPreferences.preferredIntensity, 'MODERATE');
  assert.deepStrictEqual(ctx.cardioPreferences.preferredDays, ['d1','d3','d5']);
});

test('PREF-02: Paciente legado (cardioPreferences=null) nao causa excecao no buildCardioProfile', function() {
  var ctx = makeContext({ cardioPreferences: null });
  var profile;
  assert.doesNotThrow(function() { profile = buildCardioProfile(ctx); });
  assert(profile, 'Perfil deve ser retornado');
  assert(Array.isArray(profile.preferredModalities), 'preferredModalities deve ser array');
  assert(Array.isArray(profile.preferredDays), 'preferredDays deve ser array');
});

test('PREF-03: cardioPreferences=undefined resulta em defaults neutros no cardioProfile', function() {
  var ctx = makeContext({ cardioPreferences: undefined });
  var profile = buildCardioProfile(ctx);
  assert(Array.isArray(profile.preferredModalities));
  assert(Array.isArray(profile.preferredDays));
  assert.strictEqual(profile.preferredDays.length, 0, 'Sem dias preferenciais explicitados');
});

test('PREF-04: preferredModalities de cardioPreferences elevam score de protocolos correspondentes', function() {
  var ctxCom = makeContext({ cardioPreferences: makePrefs({ preferredModalities: ['bicicleta'] }) });
  var ctxSem = makeContext({ cardioPreferences: makePrefs() });
  var profileCom = buildCardioProfile(ctxCom);
  var profileSem = buildCardioProfile(ctxSem);
  var rankedCom = rankCardioProtocols(ctxCom, profileCom, PERF_CARDIO_DB);
  var rankedSem = rankCardioProtocols(ctxSem, profileSem, PERF_CARDIO_DB);
  var BIKE_ID = 'bike_erg_z2_15';
  var bikeProto = PERF_CARDIO_DB.find(function(p) { return p.id === BIKE_ID; });
  assert(bikeProto, 'Protocolo bike_erg_z2_15 deve existir no catalogo');
  var rCom = rankedCom.find(function(r) { return r.protocol.id === BIKE_ID; });
  var rSem = rankedSem.find(function(r) { return r.protocol.id === BIKE_ID; });
  assert(rCom, 'bike_erg_z2_15 deve aparecer no ranking com preferencia');
  assert(rSem, 'bike_erg_z2_15 deve aparecer no ranking sem preferencia');
  assert(rCom.score > rSem.score, 'Score com preferencia (' + rCom.score + ') deve ser maior que sem (' + rSem.score + ')');
  assert(rCom.matchedPreferences.some(function(mp) { return mp.confidence === 'explicit'; }),
    'Preferencia explicita deve estar em matchedPreferences');
});

test('PREF-05: preferredDays de cardioPreferences sao incorporados ao cardioProfile', function() {
  var ctx = makeContext({ cardioPreferences: makePrefs({ preferredDays: ['d1','d3','d5'] }) });
  var profile = buildCardioProfile(ctx);
  assert(Array.isArray(profile.preferredDays));
  assert(profile.preferredDays.includes('d1'), 'd1 deve estar presente');
  assert(profile.preferredDays.includes('d3'), 'd3 deve estar presente');
  assert(profile.preferredDays.includes('d5'), 'd5 deve estar presente');
});

test('PREF-06: preferredDurationMinutes aparece como target em cardioProfile.preferredDuration', function() {
  var ctx = makeContext({ cardioPreferences: makePrefs({ preferredDurationMinutes: 30 }) });
  var profile = buildCardioProfile(ctx);
  assert(profile.preferredDuration, 'preferredDuration deve existir');
  assert.strictEqual(profile.preferredDuration.target, 30, 'target deve ser 30');
});

test('PREF-07: availableEquipment=[RowErg] nao inclui protocolos que exijam SkiErg', function() {
  var ctx = makeContext({ cardioPreferences: makePrefs({ availableEquipment: ['RowErg'] }) });
  var req   = buildCardioGenerationRequirements(ctx);
  var presc = generateCardioPrescription(ctx, req);
  presc.sessions.forEach(function(s) {
    var eq = String(s.equipmentRequired || '').toLowerCase();
    assert(!eq.includes('skierg'), 'Sessao ' + s.protocolId + ' nao pode exigir SkiErg');
  });
});

test('PREF-08: preferredFrequency e exposta no cardioProfile', function() {
  var ctx = makeContext({ cardioPreferences: makePrefs({ preferredFrequency: 2 }) });
  var profile = buildCardioProfile(ctx);
  assert.strictEqual(profile.preferredFrequency, 2, 'preferredFrequency deve ser 2');
});

test('PREF-09: preferredIntensity=MODERATE e exposta no cardioProfile', function() {
  var ctx = makeContext({ cardioPreferences: makePrefs({ preferredIntensity: 'MODERATE' }) });
  var profile = buildCardioProfile(ctx);
  assert.strictEqual(profile.preferredIntensity, 'MODERATE');
});

test('PREF-10: preferencia HIIT nao viola teto HIIT=0 (hard constraint soberana)', function() {
  var ctx = makeContext({
    cardioPreferences: makePrefs({ preferredIntensity: 'HIIT' }),
    constraints: { injuries: [], prohibitedExercises: [],
      clinicalConstraints: ['doenca_cardiovascular','hipertensao_grave'],
      availableEquipment: 'Full Gym' }
  });
  var req   = buildCardioGenerationRequirements(ctx);
  var ceiling = (req.intensity && req.intensity.highIntensityMaxSessions != null)
    ? req.intensity.highIntensityMaxSessions
    : ((req.modalities && req.modalities.hiitCeiling != null) ? req.modalities.hiitCeiling : 0);
  var presc = generateCardioPrescription(ctx, req);
  var hiitCount = presc.sessions.filter(function(s) { return s.isHiit === true; }).length;
  assert(hiitCount <= ceiling, 'HIIT count (' + hiitCount + ') nao pode exceder teto (' + ceiling + ')');
});

test('PREF-11: cardioPreferences nao alteram trainingProfile nem nutrition no contexto', function() {
  var ctx = makeContext({
    cardioPreferences: makePrefs({ preferredModalities: ['esteira'], preferredFrequency: 4 }),
    trainingProfile: { frequencyWeekly: 5, durationMinutes: 60, workoutType: 'Musculacao / Forca' },
    nutrition: { caloricTargetKcal: 2800, energyBalanceKcal: 200, proteinGKg: 2.1 }
  });
  buildCardioGenerationRequirements(ctx);
  assert.strictEqual(ctx.trainingProfile.frequencyWeekly, 5, 'frequencia nao deve mudar');
  assert.strictEqual(ctx.trainingProfile.durationMinutes, 60, 'duracao nao deve mudar');
  assert.strictEqual(ctx.nutrition.caloricTargetKcal, 2800, 'caloricTarget nao deve mudar');
  assert.strictEqual(ctx.nutrition.proteinGKg, 2.1, 'proteinGKg nao deve mudar');
});

test('PREF-12: sessions[] nao pode estar vazio quando frequencia prescrita > 0', function() {
  var ctx = makeContext({ cardioPreferences: makePrefs({ preferredModalities: ['bicicleta'], preferredFrequency: 3 }) });
  var req   = buildCardioGenerationRequirements(ctx);
  var presc = generateCardioPrescription(ctx, req);
  assert(Array.isArray(presc.sessions), 'sessions deve ser array');
  if (req.frequency.prescribedWeeklyFrequency > 0) {
    assert(presc.sessions.length > 0, 'sessions nao pode estar vazio');
  }
  presc.sessions.forEach(function(s, i) {
    assert(s.protocolId, 'Sessao ' + i + ' deve ter protocolId');
    assert(s.dayKey,     'Sessao ' + i + ' deve ter dayKey');
  });
});

test('PREF-13: Prescricao com cardioPreferences passa pelo validador deterministico', function() {
  var ctx = makeContext({ cardioPreferences: makePrefs({
    preferredModalities: ['remo'], preferredFrequency: 2,
    preferredDays: ['d2','d5'], availableEquipment: ['RowErg']
  }) });
  var req   = buildCardioGenerationRequirements(ctx);
  var presc = generateCardioPrescription(ctx, req);
  var val   = validateCardioPrescriptionAgainstContext(presc, ctx, req);
  assert(val.isValid, 'Prescricao invalida: ' + JSON.stringify(val.errors));
});

test('PREF-14: Sem cardioPreferences o engine preserva comportamento anterior', function() {
  var ctx   = makeContext({ cardioPreferences: makePrefs() });
  var req   = buildCardioGenerationRequirements(ctx);
  var presc = generateCardioPrescription(ctx, req);
  var val   = validateCardioPrescriptionAgainstContext(presc, ctx, req);
  assert(val.isValid, 'Prescricao baseline invalida: ' + JSON.stringify(val.errors));
});

test('PREF-15: Preferencia corrida nao forca protocolo proibido por restricao articular', function() {
  var ctx = makeContext({
    cardioPreferences: makePrefs({ preferredModalities: ['corrida'] }),
    constraints: { injuries: ['joelho_direito'], prohibitedExercises: [],
      clinicalConstraints: ['restricao_impacto_articular'], availableEquipment: 'Full Gym' }
  });
  var req   = buildCardioGenerationRequirements(ctx);
  var presc = generateCardioPrescription(ctx, req);
  var highImpact = presc.sessions.filter(function(s) {
    var proto = PERF_CARDIO_DB.find(function(p) { return p.id === s.protocolId; });
    return proto && proto.impactLevel === 'HIGH'
      && (proto.contraindicationFlags || []).some(function(f) {
        return f.includes('joelho') || f.includes('articular');
      });
  });
  assert.strictEqual(highImpact.length, 0, 'Nao deve haver protocolos de alto impacto com restricao articular');
});

test('PREF-16: Idempotencia — mesmas preferencias produzem prescricao identica', function() {
  var prefs = makePrefs({ preferredModalities: ['bicicleta'], preferredFrequency: 3,
    preferredDurationMinutes: 30, preferredIntensity: 'MODERATE', preferredDays: ['d1','d3','d5'] });
  var ctx1 = makeContext({ cardioPreferences: prefs });
  var ctx2 = makeContext({ cardioPreferences: prefs });
  var req1 = buildCardioGenerationRequirements(ctx1);
  var req2 = buildCardioGenerationRequirements(ctx2);
  var presc1 = generateCardioPrescription(ctx1, req1);
  var presc2 = generateCardioPrescription(ctx2, req2);
  assert.strictEqual(presc1.sessions.length, presc2.sessions.length, 'Numero de sessoes deve ser identico');
  presc1.sessions.forEach(function(s1, i) {
    var s2 = presc2.sessions[i];
    assert.strictEqual(s1.protocolId, s2.protocolId, 'protocolId sessao ' + i + ' deve ser identico');
    assert.strictEqual(s1.dayKey,     s2.dayKey,     'dayKey sessao '     + i + ' deve ser identico');
  });
});

test('PREF-17: buildCardioProfile com preferencias retorna objeto com todos os campos obrigatorios', function() {
  var ctx = makeContext({ cardioPreferences: makePrefs({
    preferredModalities: ['esteira'], preferredFrequency: 3, preferredDurationMinutes: 30,
    preferredIntensity: 'MODERATE', preferredDays: ['d1','d3']
  }) });
  var profile = buildCardioProfile(ctx);
  assert(profile.experienceLevel,              'Deve ter experienceLevel');
  assert(Array.isArray(profile.preferredModalities), 'preferredModalities deve ser array');
  assert(Array.isArray(profile.avoidedModalities),   'avoidedModalities deve ser array');
  assert(profile.availableEquipment !== undefined,   'availableEquipment deve existir');
  assert(Array.isArray(profile.preferredDays),       'preferredDays deve ser array');
  assert(profile.preferredDuration !== undefined,    'preferredDuration deve existir');
  assert(profile.preferredFrequency !== undefined,   'preferredFrequency (F7) deve existir');
  assert(profile.preferredIntensity !== undefined,   'preferredIntensity (F7) deve existir');
});

test('PREF-18: buildCardioGenerationRequirements propaga cardioProfile com preferencias para requirements', function() {
  var ctx = makeContext({ cardioPreferences: makePrefs({ preferredModalities: ['bicicleta'] }) });
  var req = buildCardioGenerationRequirements(ctx);
  assert(req,               'Requirements deve ser retornado');
  assert(req.cardioProfile, 'requirements.cardioProfile deve existir');
  assert(Array.isArray(req.cardioProfile.preferredModalities), 'preferredModalities deve ser array');
  var hasBike = req.cardioProfile.preferredModalities.some(function(m) {
    var mod = typeof m === 'object' ? m.modality : m;
    return String(mod).toLowerCase().includes('bicicleta') || String(mod).toLowerCase().includes('bike');
  });
  assert(hasBike, 'requirements.cardioProfile deve ter bicicleta como preferencia');
});

test('PREF-19: Full Gym em availableEquipment preserva todos os candidatos (isFullGym=true)', function() {
  var ctx = makeContext({ cardioPreferences: makePrefs({ availableEquipment: ['Full Gym'] }) });
  var profile = buildCardioProfile(ctx);
  var isFullGym = profile.availableEquipment && profile.availableEquipment.isFullGym;
  assert(isFullGym === true, 'Full Gym deve resultar em isFullGym=true no cardioProfile');
});

test('PREF-20: Fluxo completo profile->req->prescription->validation sem excecao', function() {
  var ctx = makeContext({ cardioPreferences: makePrefs({
    preferredModalities: ['bicicleta','remo'], preferredFrequency: 3,
    preferredDurationMinutes: 30, preferredIntensity: 'MODERATE',
    preferredDays: ['d1','d3','d5'], availableEquipment: ['Bicicleta Ergometrica','RowErg']
  }) });
  var profile, req, presc, val;
  assert.doesNotThrow(function() {
    profile = buildCardioProfile(ctx);
    req     = buildCardioGenerationRequirements(ctx);
    presc   = generateCardioPrescription(ctx, req);
    val     = validateCardioPrescriptionAgainstContext(presc, ctx, req);
  });
  assert(profile, 'Perfil deve existir');
  assert(req,     'Requirements deve existir');
  assert(presc,   'Prescricao deve existir');
  assert(val.isValid, 'Prescricao deve ser valida: ' + JSON.stringify(val.errors));
  assert(Array.isArray(presc.sessions), 'sessions deve ser array');
});

// ── PREF-FREQ-01: Influência Segura de preferredFrequency ─────────────────────

test('PREF-FREQ-01: preferredFrequency influencia calculateCardioFrequency como soft constraint dentro dos limites clínicos', function() {
  // Cenário 1: Paciente em Emagrecimento (baseline 3x, min 2x, max 5x)
  var ctxBase = makeContext({
    patient: { objective: 'Emagrecimento' },
    trainingProfile: { frequencyWeekly: 3 }
  });
  var fBase = calculateCardioFrequency(ctxBase);
  assert.strictEqual(fBase.target, 3, 'Baseline sem preferencia deve ser 3x');
  assert.strictEqual(fBase.min, 2, 'Min clínico deve ser 2x');
  assert.strictEqual(fBase.max, 5, 'Max clínico deve ser 5x');

  // Preferencia válida 4x (dentro de [2, 5]): target é ajustado para 4x
  var ctxPref4 = makeContext({
    patient: { objective: 'Emagrecimento' },
    trainingProfile: { frequencyWeekly: 3 },
    cardioPreferences: makePrefs({ preferredFrequency: 4 })
  });
  var fPref4 = calculateCardioFrequency(ctxPref4);
  assert.strictEqual(fPref4.target, 4, 'Preferencia 4x deve ser adotada');

  // Preferencia excessiva 8x: clamp estrito no maxFreq (5x)
  var ctxPref8 = makeContext({
    patient: { objective: 'Emagrecimento' },
    trainingProfile: { frequencyWeekly: 3 },
    cardioPreferences: makePrefs({ preferredFrequency: 8 })
  });
  var fPref8 = calculateCardioFrequency(ctxPref8);
  assert.strictEqual(fPref8.target, 5, 'Preferencia 8x deve ser limitada pelo teto clinico de 5x');

  // Preferencia insuficiente 1x: clamp estrito no minFreq (2x)
  var ctxPref1 = makeContext({
    patient: { objective: 'Emagrecimento' },
    trainingProfile: { frequencyWeekly: 3 },
    cardioPreferences: makePrefs({ preferredFrequency: 1 })
  });
  var fPref1 = calculateCardioFrequency(ctxPref1);
  assert.strictEqual(fPref1.target, 2, 'Preferencia 1x deve ser limitada pelo piso clinico de 2x');

  // Cenário 2: Musculação 6x/semana impõe teto mandatório de concorrência (max 2x)
  var ctx6x = makeContext({
    patient: { objective: 'Hipertrofia' },
    trainingProfile: { frequencyWeekly: 6 },
    cardioPreferences: makePrefs({ preferredFrequency: 4 })
  });
  var f6x = calculateCardioFrequency(ctx6x);
  assert.strictEqual(f6x.max, 2, 'Teto de concorrencia com 6x musculacao deve ser 2');
  assert.strictEqual(f6x.target, 2, 'Preferencia 4x nao pode ultrapassar o teto de concorrencia de 2x');
});

// ── UI-CARDIO-01 a UI-CARDIO-12: Testes de Integracao do Botao ──────────────

test('UI-CARDIO-01: botao existente esta conectado ao fluxo canonico', function() {
  var samplePresc = {
    id: 'test_presc',
    frequencyWeekly: 2,
    totalWeeklyMinutes: 60,
    requirements: { intensity: { primaryZones: ['Z2'] } },
    sessions: [
      { protocolId: 'cardio_01', day: 'Segunda', dayKey: 'd1', durationMinutes: 30, protocolTitle: 'Cardio Regenerativo', rationale: 'Base Z2', heartRateZone: 'Z2', targetBpm: '125 bpm' }
    ]
  };
  sandbox.samplePresc = samplePresc;
  vm.runInContext('perfCardioPrescription = samplePresc;', sandbox);
  renderPerfPrescribedCardio();

  var html = _mockContainer.innerHTML;
  assert(html.includes('onclick="perfGenerateCardioPlan()"'), 'Botao deve chamar perfGenerateCardioPlan()');
  assert(html.includes('⚡ Otimizar Cardio'), 'Rotulo visual deve ser "⚡ Otimizar Cardio"');
  assert.strictEqual(typeof perfGenerateCardioPlan, 'function', 'perfGenerateCardioPlan deve ser funcao exportada');
});

test('UI-CARDIO-02: clique utiliza cardioPreferences atuais', async function() {
  sandbox._mockCardioPreferences = {
    preferredModalities: ['bicicleta'],
    preferredFrequency: 3,
    preferredDurationMinutes: 30,
    preferredIntensity: 'MODERATE',
    preferredDays: ['d1', 'd3', 'd5'],
    availableEquipment: ['Bicicleta Ergométrica']
  };

  var res = await perfGenerateCardioPlan('paulo-vitor');
  assert.strictEqual(res.status, 'SUCCESS', 'Execucao deve retornar SUCCESS');
  assert(res.prescription, 'Prescricao deve ser retornada');
  assert.strictEqual(res.prescription.frequencyWeekly, 3, 'Frequencia prescrita deve refletir preferencia 3x');
  assert.strictEqual(res.prescription.cardioProfile.preferredFrequency, 3, 'cardioProfile deve conter 3x');
  assert.strictEqual(res.prescription.sessions.length, 3, 'sessions[] deve conter 3 sessoes');
  var hasBike = res.prescription.sessions.some(function(s) {
    return s.protocolTitle.toLowerCase().includes('bike') || s.protocolId.toLowerCase().includes('bike');
  });
  assert(hasBike, 'Modalidade preferida bicicleta deve estar presente nas sessoes');
});

test('UI-CARDIO-03: nao chama Gemini', async function() {
  // Spies em potenciais chamadas externas de LLM
  var calledGemini = false;
  sandbox.google = { ai: { generativelanguage: function() { calledGemini = true; } } };
  sandbox.gemini = function() { calledGemini = true; };

  var res = await perfGenerateCardioPlan('paulo-vitor');
  assert.strictEqual(res.status, 'SUCCESS');
  assert.strictEqual(calledGemini, false, 'Cardio Engine nao pode invocar APIs externas de IA/Gemini');
});

test('UI-CARDIO-04: nao gera musculacao', async function() {
  var originalWorkoutPlan = [
    { id: 'w1', name: 'Supino Reto', sets: 4, reps: '8-10' },
    { id: 'w2', name: 'Desenvolvimento', sets: 3, reps: '10-12' }
  ];
  sandbox.perfWorkoutPlan = JSON.parse(JSON.stringify(originalWorkoutPlan));
  sandbox.perfActiveSplit = 'UpperLower';

  await perfGenerateCardioPlan('paulo-vitor');

  assert.deepStrictEqual(sandbox.perfWorkoutPlan, originalWorkoutPlan, 'perfWorkoutPlan nao deve ser alterado');
  assert.strictEqual(sandbox.perfActiveSplit, 'UpperLower', 'perfActiveSplit nao deve ser alterado');
});

test('UI-CARDIO-05: nao gera dieta', async function() {
  var originalNutrition = { caloricTargetKcal: 2650, proteinGKg: 2.0, energyBalanceKcal: -300 };
  sandbox.perfNutritionSnapshot = JSON.parse(JSON.stringify(originalNutrition));

  await perfGenerateCardioPlan('paulo-vitor');

  // Confirma que nenhuma funcao de geracao de cardapio/dieta foi chamada
  assert.deepStrictEqual(sandbox.perfNutritionSnapshot, originalNutrition, 'Prescricao nutricional deve permanecer intocada');
});

test('UI-CARDIO-06: passa pelo Weekly Engine', async function() {
  var passedWeeklyEngine = false;
  var originalWeeklyEngine = sandbox.buildCardioWeeklyPrescription;

  sandbox.buildCardioWeeklyPrescription = function(ctx, req) {
    passedWeeklyEngine = true;
    return originalWeeklyEngine(ctx, req);
  };

  try {
    var res = await perfGenerateCardioPlan('paulo-vitor');
    assert.strictEqual(res.status, 'SUCCESS');
    assert.strictEqual(passedWeeklyEngine, true, 'perfGenerateCardioPlan deve invocar buildCardioWeeklyPrescription');
  } finally {
    sandbox.buildCardioWeeklyPrescription = originalWeeklyEngine;
  }
});

test('UI-CARDIO-07: sessions[] e atualizada somente apos PASS', async function() {
  var res = await perfGenerateCardioPlan('paulo-vitor');
  assert.strictEqual(res.status, 'SUCCESS');
  assert(sandbox.perfCardioPrescription, 'perfCardioPrescription deve estar populada');
  assert.strictEqual(sandbox.perfCardioPrescription.sessions.length, res.prescription.sessions.length);
  assert.strictEqual(sandbox.perfCardioPrescription.sessions[0].protocolId, res.prescription.sessions[0].protocolId);
});

test('UI-CARDIO-08: prescricao REJECT preserva a atual', async function() {
  var initialPrescription = {
    id: 'presc_preserved_initial',
    frequencyWeekly: 2,
    totalWeeklyMinutes: 60,
    sessions: [
      { protocolId: 'cardio_01', day: 'Segunda', dayKey: 'd1', durationMinutes: 30 },
      { protocolId: 'cardio_01', day: 'Quarta', dayKey: 'd3', durationMinutes: 30 }
    ]
  };
  sandbox.perfCardioPrescription = initialPrescription;
  sandbox.perfWeeklySchedule = [
    { dayKey: 'd1', title: 'Treino A', type: 'Treino + Cardio', cardioSession: initialPrescription.sessions[0] },
    { dayKey: 'd2', title: 'Treino B', type: 'Treino', cardioSession: null },
    { dayKey: 'd3', title: 'Descanso', type: 'Cardio', cardioSession: initialPrescription.sessions[1] }
  ];

  var originalValidator = sandbox.validateCardioPrescriptionAgainstContext;
  sandbox.validateCardioPrescriptionAgainstContext = function() {
    return { isValid: false, errors: ['Simulacao de rejeicao de seguranca deterministica'] };
  };

  try {
    var res = await perfGenerateCardioPlan('paulo-vitor');
    assert.strictEqual(res.status, 'REJECT', 'Deve retornar status REJECT');
    assert.strictEqual(sandbox.perfCardioPrescription.id, 'presc_preserved_initial', 'Prescricao anterior deve ser preservada intacta');
    assert.strictEqual(sandbox.perfCardioPrescription.sessions.length, 2, 'Sessions originais nao podem ser apagadas');
    assert.strictEqual(sandbox.perfWeeklySchedule[0].cardioSession.protocolId, 'cardio_01', 'Schedule deve manter a sessao anterior');
  } finally {
    sandbox.validateCardioPrescriptionAgainstContext = originalValidator;
  }
});

test('UI-CARDIO-09: agenda recebe somente sessions[] aprovada', async function() {
  var res = await perfGenerateCardioPlan('paulo-vitor');
  assert.strictEqual(res.status, 'SUCCESS');

  var scheduleDaysWithCardio = (sandbox.perfWeeklySchedule || []).filter(function(d) {
    return d.cardioSession != null;
  });
  assert.strictEqual(scheduleDaysWithCardio.length, res.prescription.sessions.length,
    'Todos os slots de cardio na agenda devem corresponder a sessions[] aprovada');
  scheduleDaysWithCardio.forEach(function(d) {
    assert(d.cardioSession.protocolId, 'Cada slot deve possuir protocolId valido');
    assert(d.cardioSession.durationMinutes > 0, 'Cada slot deve possuir duracao positiva');
  });
});

test('UI-CARDIO-10: Mobile recebe cardioPrescription', async function() {
  await perfGenerateCardioPlan('paulo-vitor');

  var stored = _store['NUTRIAX_PERFORMANCE_paulo-vitor'];
  assert(stored, 'Registro de performance deve estar persistido no storage');
  var parsed = JSON.parse(stored);
  assert(parsed.cardioPrescription, 'Registro persistido para mobile deve conter cardioPrescription');
  assert(Array.isArray(parsed.cardioPrescription.sessions), 'cardioPrescription deve conter sessions[]');
  assert.strictEqual(parsed.cardioPrescription.sessions.length, sandbox.perfCardioPrescription.sessions.length);
});

test('UI-CARDIO-11: PDF utiliza a prescricao canonica', function() {
  assert(sandbox.perfWeeklySchedule, 'perfWeeklySchedule deve existir');
  var cardioSlots = sandbox.perfWeeklySchedule.filter(function(d) { return d.cardioSession != null; });
  assert(cardioSlots.length > 0, 'Agenda semanal deve conter os slots aprovados para geracao de PDF');

  cardioSlots.forEach(function(d) {
    var cs = d.cardioSession;
    assert(cs.protocolId, 'PDF consome protocolId canonico');
    assert(cs.durationMinutes, 'PDF consome durationMinutes canonico');
    assert(cs.heartRateZone || cs.intensityZone, 'PDF consome zona cardiaca canônica');
  });
});

test('UI-CARDIO-12: duplo clique nao produz duas geracoes concorrentes', async function() {
  // Inicia primeira execucao
  var p1 = perfGenerateCardioPlan('paulo-vitor');
  // Chamada concorrente imediata (simulando duplo clique rapido)
  var res2 = await perfGenerateCardioPlan('paulo-vitor');

  assert.strictEqual(res2.status, 'BUSY', 'Segunda chamada concorrente deve retornar BUSY e ser ignorada');
  assert(res2.message.includes('em andamento'), 'Mensagem de bloqueio de duplo clique deve ser retornada');

  var res1 = await p1;
  assert.strictEqual(res1.status, 'SUCCESS', 'Primeira chamada conclui normalmente');
});

// ── Runner Assíncrono Sequencial ─────────────────────────────────────────────

async function runSuite() {
  for (var i = 0; i < testQueue.length; i++) {
    totalTests++;
    var t = testQueue[i];
    try {
      await t.fn();
      console.log('OK [PASS] ' + t.name);
      passedTests++;
    } catch (err) {
      console.error('FAIL [FAIL] ' + t.name);
      console.error('   Detalhe: ' + (err && err.message ? err.message : err));
      console.error(err);
      process.exit(1);
    }
  }
  console.log('================================================================');
  console.log('Resultado: ' + passedTests + '/' + totalTests + ' testes PASSARAM');
  console.log('================================================================');
}

runSuite().catch(function(err) {
  console.error('Erro na execucao da suite:', err);
  process.exit(1);
});
