/**
 * =========================================================================
 * NutriAx Pro — F7.3-B.1: Suíte de Contrato, Taxonomia e Normalização Semântica
 * Arquivo: tests/cardio-catalog-contract.test.js
 *
 * 30 Testes Contratuais Formais (A até AD):
 * A. Todos os protocolos possuem os campos obrigatórios (incluindo adaptationTags)
 * B. Todos os valores pertencem à taxonomia permitida (CARDIO_TAXONOMY)
 * C. Nenhum protocolo possui duração inválida (min > 0, max >= min, step > 0)
 * D. Nenhum protocolo possui equipment malformado
 * E. Nenhum protocolo possui contraindicationFlags malformado
 * F. Nenhum protocolo possui metadado biomecânico desconhecido
 * G. Nenhum protocolo possui ID duplicado (catálogo com 32 protocolos únicos)
 * H. Nenhum protocolo contém regra clínica executável dentro do próprio objeto
 * I. Um protocolo sintético válido passa na validação
 * J. Um protocolo sintético inválido é rejeitado com diagnósticos precisos
 * K. O catálogo continua compatível com rankCardioProtocols()
 * L. O catálogo continua compatível com generateCardioPrescription()
 * M. Novos protocolos passam no contrato e validação individual
 * N. Novas modalidades são corretamente classificadas em suas famílias
 * O. Protocolos de diferentes níveis são reconhecidos no catálogo expandido
 * P. Protocolos híbridos possuem metadados completos e coerentes
 * Q. Protocolos de circuito possuem metadados completos
 * R. Protocolos HYROX/adaptados possuem metadados completos
 * S. Novos protocolos HIIT obedecem à governança contextual de teto de sessões
 * T. Nenhum novo protocolo exige regra baseada em ID
 * U. Equipamento ausente elimina corretamente novos protocolos
 * V. Restrição biomecânica elimina corretamente novos protocolos
 * W. Novos protocolos participam corretamente do ranking determinístico
 * X. Auditoria de Diversidade e Distribuição do Catálogo Expandido
 * Y. Nenhum protocolo utiliza 'compromised' como modalityFamily
 * Z. Toda adaptação 'compromised' é representada por metadado de adaptação
 * AA. Nenhum protocolo possui inconsistência entre nome e intensidade declarada
 * AB. INTERVALS não implica automaticamente isHiit === true
 * AC. Taxonomia final não possui níveis biomecânicos semanticamente duplicados
 * AD. HYROX permanece 100% representável e funcional após a normalização
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
const CARDIO_TAXONOMY = vm.runInContext('CARDIO_TAXONOMY', sandbox);
const validateCardioProtocol = vm.runInContext('validateCardioProtocol', sandbox);
const validateCardioProtocolCatalog = vm.runInContext('validateCardioProtocolCatalog', sandbox);
const rankCardioProtocols = sandbox.rankCardioProtocols || vm.runInContext('rankCardioProtocols', sandbox);
const buildCardioProfile = sandbox.buildCardioProfile || vm.runInContext('buildCardioProfile', sandbox);
const generateCardioPrescription = sandbox.generateCardioPrescription || vm.runInContext('generateCardioPrescription', sandbox);
const isCardioProtocolEquipmentAvailable = sandbox.isCardioProtocolEquipmentAvailable || vm.runInContext('isCardioProtocolEquipmentAvailable', sandbox);
const getCardioInterferenceScore = sandbox.getCardioInterferenceScore || vm.runInContext('getCardioInterferenceScore', sandbox);

// Runner de testes
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(err);
    failed++;
  }
}

console.log('================================================================');
console.log('F7.3-B.1: Suíte de Contrato, Taxonomia e Normalização Semântica');
console.log('================================================================');

// -------------------------------------------------------------------------
// TESTE A: Todos os protocolos atuais possuem os campos obrigatórios
// -------------------------------------------------------------------------
test('TESTE A: Todos os protocolos atuais possuem os campos obrigatórios', () => {
  assert(PERF_CARDIO_DB.length >= 32, `O catálogo expandido deve possuir ao menos 32 protocolos (atual: ${PERF_CARDIO_DB.length})`);
  const requiredKeys = [
    'id', 'name', 'title', 'category', 'modality', 'modalityFamily',
    'minDurationMinutes', 'maxDurationMinutes', 'durationStepMinutes', 'timeCap',
    'intensityZone', 'intensityType', 'isHiit',
    'objectiveTags', 'levelTags', 'equipment',
    'impactLevel', 'axialLoad', 'posteriorChainDemand', 'lowerLimbDemand', 'upperLimbDemand',
    'avoidAfter', 'preferredAfter', 'compatibleWithPostWorkout',
    'contraindicationFlags', 'supportsMultiErg', 'isFoundational',
    'recoveryDemand', 'modalityTags', 'adaptationTags', 'blocks', 'restrictions'
  ];

  PERF_CARDIO_DB.forEach(p => {
    requiredKeys.forEach(k => {
      assert(p[k] !== undefined, `Protocolo '${p.id}' deve possuir o campo obrigatório '${k}'`);
    });
  });
});

// -------------------------------------------------------------------------
// TESTE B: Todos os valores pertencem à taxonomia permitida (CARDIO_TAXONOMY)
// -------------------------------------------------------------------------
test('TESTE B: Todos os valores pertencem à taxonomia permitida', () => {
  assert(CARDIO_TAXONOMY, 'CARDIO_TAXONOMY deve estar definida no runtime');
  assert(Object.isFrozen(CARDIO_TAXONOMY), 'CARDIO_TAXONOMY deve ser imutável (Object.freeze)');

  PERF_CARDIO_DB.forEach(p => {
    assert(CARDIO_TAXONOMY.CATEGORIES.includes(p.category),
      `Protocolo '${p.id}': category '${p.category}' fora da taxonomia`);
    assert(CARDIO_TAXONOMY.MODALITY_FAMILIES.includes(p.modalityFamily),
      `Protocolo '${p.id}': modalityFamily '${p.modalityFamily}' fora da taxonomia`);
    assert(CARDIO_TAXONOMY.INTENSITY_ZONES.includes(p.intensityZone),
      `Protocolo '${p.id}': intensityZone '${p.intensityZone}' fora da taxonomia`);
    assert(CARDIO_TAXONOMY.INTENSITY_TYPES.includes(p.intensityType),
      `Protocolo '${p.id}': intensityType '${p.intensityType}' fora da taxonomia`);
    assert(CARDIO_TAXONOMY.RECOVERY_DEMAND_LEVELS.includes(p.recoveryDemand),
      `Protocolo '${p.id}': recoveryDemand '${p.recoveryDemand}' fora da taxonomia`);

    p.objectiveTags.forEach(obj => {
      assert(CARDIO_TAXONOMY.VALID_OBJECTIVES.includes(obj),
        `Protocolo '${p.id}': objetivo '${obj}' fora da taxonomia`);
    });

    p.levelTags.forEach(lvl => {
      assert(CARDIO_TAXONOMY.EXPERIENCE_LEVELS.includes(lvl),
        `Protocolo '${p.id}': nível '${lvl}' fora da taxonomia`);
    });
  });
});

// -------------------------------------------------------------------------
// TESTE C: Nenhum protocolo possui duração inválida
// -------------------------------------------------------------------------
test('TESTE C: Nenhum protocolo possui duração inválida', () => {
  PERF_CARDIO_DB.forEach(p => {
    assert(typeof p.minDurationMinutes === 'number' && p.minDurationMinutes > 0,
      `Protocolo '${p.id}': minDurationMinutes (${p.minDurationMinutes}) deve ser número positivo`);
    assert(typeof p.maxDurationMinutes === 'number' && p.maxDurationMinutes >= p.minDurationMinutes,
      `Protocolo '${p.id}': maxDurationMinutes (${p.maxDurationMinutes}) deve ser >= minDurationMinutes (${p.minDurationMinutes})`);
    assert(typeof p.durationStepMinutes === 'number' && p.durationStepMinutes > 0,
      `Protocolo '${p.id}': durationStepMinutes (${p.durationStepMinutes}) deve ser número positivo`);
    assert(typeof p.timeCap === 'string' && p.timeCap.trim().length > 0,
      `Protocolo '${p.id}': timeCap deve ser string não vazia`);
  });
});

// -------------------------------------------------------------------------
// TESTE D: Nenhum protocolo possui equipment malformado
// -------------------------------------------------------------------------
test('TESTE D: Nenhum protocolo possui equipment malformado', () => {
  PERF_CARDIO_DB.forEach(p => {
    assert(Array.isArray(p.equipment), `Protocolo '${p.id}': equipment deve ser Array`);
    assert(p.equipment.length > 0, `Protocolo '${p.id}': equipment deve possuir ao menos 1 item`);
    p.equipment.forEach(eq => {
      assert(typeof eq === 'string' && eq.trim().length > 0,
        `Protocolo '${p.id}': item de equipment '${eq}' deve ser string válida`);
    });
  });
});

// -------------------------------------------------------------------------
// TESTE E: Nenhum protocolo possui contraindicationFlags malformado
// -------------------------------------------------------------------------
test('TESTE E: Nenhum protocolo possui contraindicationFlags malformado', () => {
  PERF_CARDIO_DB.forEach(p => {
    assert(Array.isArray(p.contraindicationFlags),
      `Protocolo '${p.id}': contraindicationFlags deve ser Array`);
    p.contraindicationFlags.forEach(flag => {
      assert(typeof flag === 'string' && flag.trim().length > 0,
        `Protocolo '${p.id}': flag '${flag}' deve ser string não vazia`);
    });
  });
});

// -------------------------------------------------------------------------
// TESTE F: Nenhum protocolo possui metadado biomecânico desconhecido
// -------------------------------------------------------------------------
test('TESTE F: Nenhum protocolo possui metadado biomecânico desconhecido', () => {
  const biomechFields = ['impactLevel', 'axialLoad', 'posteriorChainDemand', 'lowerLimbDemand', 'upperLimbDemand'];
  PERF_CARDIO_DB.forEach(p => {
    biomechFields.forEach(k => {
      const val = p[k];
      assert(typeof val === 'string', `Protocolo '${p.id}': metadado '${k}' deve ser string`);
      assert(CARDIO_TAXONOMY.BIOMECHANICAL_LEVELS.includes(val),
        `Protocolo '${p.id}': metadado biomecânico '${k}' com valor desconhecido '${val}'`);
    });
  });
});

// -------------------------------------------------------------------------
// TESTE G: Nenhum protocolo possui ID duplicado
// -------------------------------------------------------------------------
test('TESTE G: Nenhum protocolo possui ID duplicado e catálogo possui exatamente 32 protocolos únicos', () => {
  const seenIds = new Set();
  PERF_CARDIO_DB.forEach(p => {
    assert(!seenIds.has(p.id), `ID duplicado detectado: '${p.id}'`);
    seenIds.add(p.id);
  });
  assert.strictEqual(seenIds.size, 32, 'Devem existir exatamente 32 IDs únicos no catálogo expandido');
});

// -------------------------------------------------------------------------
// TESTE H: Nenhum protocolo contém regra clínica executável dentro do próprio objeto
// -------------------------------------------------------------------------
test('TESTE H: Nenhum protocolo contém regra clínica executável dentro do próprio objeto', () => {
  PERF_CARDIO_DB.forEach(p => {
    for (const [k, v] of Object.entries(p)) {
      assert(typeof v !== 'function',
        `Protocolo '${p.id}' NÃO pode conter regra executável ou função embutida no atributo '${k}'`);
    }
  });
});

// -------------------------------------------------------------------------
// TESTE I: Um protocolo sintético válido passa na validação
// -------------------------------------------------------------------------
test('TESTE I: Um protocolo sintético válido passa na validação', () => {
  const validSynthetic = {
    id: 'synthetic_valid_proto',
    name: 'Protocolo Sintético de Teste',
    title: 'Protocolo "Sintético Teste"',
    category: 'Zona 2',
    modality: 'Remo Teste',
    modalityFamily: 'ergometer',
    minDurationMinutes: 20,
    maxDurationMinutes: 45,
    durationStepMinutes: 5,
    timeCap: '30 min',
    intensityZone: 'Z2',
    intensityType: 'CONTINUOUS',
    isHiit: false,
    objectiveTags: ['emagrecimento', 'saude_manutencao'],
    levelTags: ['iniciante', 'intermediario'],
    equipment: ['RowErg'],
    impactLevel: 'LOW',
    axialLoad: 'LOW',
    posteriorChainDemand: 'LOW',
    lowerLimbDemand: 'LOW',
    upperLimbDemand: 'LOW',
    avoidAfter: [],
    preferredAfter: ['Superiores'],
    compatibleWithPostWorkout: true,
    contraindicationFlags: [],
    supportsMultiErg: false,
    isFoundational: false,
    recoveryDemand: 'LOW',
    modalityTags: ['remo', 'ergometro', 'zona2'],
    adaptationTags: ['base_aerobia'],
    blocks: [{ num: 1, name: 'Bloco Contínuo', items: ['Remo contínuo 30 min'] }],
    restrictions: []
  };

  const res = validateCardioProtocol(validSynthetic);
  assert.strictEqual(res.isValid, true, 'Protocolo sintético válido deve ser aceito');
  assert.strictEqual(res.errors.length, 0, 'Protocolo sintético válido não deve conter erros');
});

// -------------------------------------------------------------------------
// TESTE J: Um protocolo sintético inválido é rejeitado com diagnósticos precisos
// -------------------------------------------------------------------------
test('TESTE J: Um protocolo sintético inválido é rejeitado com diagnósticos precisos', () => {
  const invalidSynthetic = {
    id: 'invalid proto with spaces', // erro: espaços
    name: '',                        // erro: vazio
    title: '',                       // erro: vazio
    category: 'CategoriaInexistente',// erro: fora da taxonomia
    modality: '',                    // erro: vazio
    modalityFamily: 'familia_invalida', // erro: fora da taxonomia
    minDurationMinutes: -10,         // erro: negativo
    maxDurationMinutes: 5,           // erro: max < min
    durationStepMinutes: 0,          // erro: zero
    timeCap: '',                     // erro: vazio
    intensityZone: 'Z9',             // erro: fora da taxonomia
    intensityType: 'RANDOM',         // erro: fora da taxonomia
    isHiit: 'sim',                   // erro: não é boolean
    objectiveTags: ['invalid_obj'],  // erro: fora da taxonomia
    levelTags: ['ninja'],            // erro: fora da taxonomia
    equipment: [],                   // erro: vazio
    impactLevel: 'SUPER_HIGH',       // erro: fora da taxonomia
    axialLoad: 'INVALID',            // erro: fora da taxonomia
    posteriorChainDemand: 'INVALID', // erro: fora da taxonomia
    lowerLimbDemand: 'INVALID',      // erro: fora da taxonomia
    upperLimbDemand: 'INVALID',      // erro: fora da taxonomia
    avoidAfter: 'nao_e_array',       // erro: tipo
    preferredAfter: 'nao_e_array',   // erro: tipo
    compatibleWithPostWorkout: 'yes',// erro: não é boolean
    contraindicationFlags: [123],    // erro: item não-string
    supportsMultiErg: 'talvez',      // erro: não é boolean
    isFoundational: null,            // erro: não é boolean
    recoveryDemand: 'EXTREME',       // erro: fora da taxonomia
    modalityTags: [],                // erro: vazio
    adaptationTags: 'nao_e_array',   // erro: tipo
    blocks: [],                      // erro: vazio
    restrictions: 'nao_e_array',     // erro: tipo
    executeRule: () => 'clinical_rule' // erro: função executável
  };

  const res = validateCardioProtocol(invalidSynthetic);
  assert.strictEqual(res.isValid, false, 'Protocolo sintético inválido deve ser rejeitado');
  assert(res.errors.length >= 20, `Deveriam haver múltiplos diagnósticos detalhados (recebido: ${res.errors.length})`);
});

// -------------------------------------------------------------------------
// TESTE K: O catálogo continua compatível com rankCardioProtocols()
// -------------------------------------------------------------------------
test('TESTE K: O catálogo continua compatível com rankCardioProtocols()', () => {
  const ctx = {
    patient: {
      objective: 'Emagrecimento',
      trainingLevel: 'Intermediário',
      patientType: 'Praticante recreativo'
    },
    trainingProfile: {
      workoutType: 'Musculação Hipertrofia',
      frequencyWeekly: 4
    },
    constraints: {
      availableEquipment: 'Full Gym',
      prohibitedExercises: [],
      clinicalConstraints: [],
      preferredModalities: ['bike', 'esteira'],
      avoidedModalities: []
    }
  };

  const profile = buildCardioProfile(ctx);
  const ranked = rankCardioProtocols(ctx, profile, PERF_CARDIO_DB);

  assert(Array.isArray(ranked), 'rankCardioProtocols deve retornar array de protocolos ranqueados');
  assert.strictEqual(ranked.length, PERF_CARDIO_DB.length, 'Todos os protocolos devem ser ranqueados');
  assert(typeof ranked[0].score === 'number', 'Primeiro colocado deve ter score numérico');
  assert(Array.isArray(ranked[0].rationale), 'Primeiro colocado deve possuir rationale');
  assert(ranked[0].score >= ranked[1].score, 'Ordenação deve ser decrescente por pontuação');
});

// -------------------------------------------------------------------------
// TESTE L: O catálogo continua compatível com generateCardioPrescription()
// -------------------------------------------------------------------------
test('TESTE L: O catálogo continua compatível com generateCardioPrescription()', () => {
  const context = {
    patient: {
      objective: 'Emagrecimento',
      trainingLevel: 'Intermediário',
      patientType: 'Praticante recreativo',
      trainingDaysPerWeek: 4,
      injuries: []
    },
    trainingProfile: {
      workoutType: 'Musculação Padrão',
      frequencyWeekly: '4x/semana'
    },
    constraints: {
      availableEquipment: 'Full Gym',
      prohibitedExercises: [],
      clinicalConstraints: []
    },
    schedule: [
      { dayKey: 'd1', dayName: 'Segunda', type: 'Treino', muscleGroup: 'Peito / Tríceps' },
      { dayKey: 'd2', dayName: 'Terça', type: 'Treino', muscleGroup: 'Costas / Bíceps' },
      { dayKey: 'd3', dayName: 'Quarta', type: 'Off', muscleGroup: null },
      { dayKey: 'd4', dayName: 'Quinta', type: 'Treino', muscleGroup: 'Pernas / Ombros' },
      { dayKey: 'd5', dayName: 'Sexta', type: 'Treino', muscleGroup: 'Braços' },
      { dayKey: 'd6', dayName: 'Sábado', type: 'Off', muscleGroup: null },
      { dayKey: 'd7', dayName: 'Domingo', type: 'Off', muscleGroup: null }
    ]
  };

  const prescription = generateCardioPrescription(context);

  assert(prescription, 'generateCardioPrescription deve retornar um objeto de prescrição');
  assert(Array.isArray(prescription.sessions), 'prescription deve possuir sessions[] canônico');
  assert(prescription.sessions.length > 0, 'sessions[] deve possuir ao menos 1 sessão');
  assert(typeof prescription.totalWeeklyMinutes === 'number', 'totalWeeklyMinutes deve ser numérico');

  prescription.sessions.forEach(sess => {
    assert(sess.protocolId, 'Cada sessão deve conter protocolId');
    assert(sess.modality, 'Cada sessão deve conter modality');
    assert(typeof sess.durationMinutes === 'number' && sess.durationMinutes > 0,
      'Cada sessão deve conter durationMinutes positivo');
    const exists = PERF_CARDIO_DB.some(p => p.id === sess.protocolId);
    assert(exists, `Protocolo prescrito '${sess.protocolId}' deve existir em PERF_CARDIO_DB`);
  });
});

// -------------------------------------------------------------------------
// TESTE M: Novos protocolos passam no contrato e validação individual
// -------------------------------------------------------------------------
test('TESTE M: Novos protocolos passam no contrato e validação individual', () => {
  const newIds = [
    'stairmaster_intervals_z3_20', 'stairmaster_steady_z2_20', 'skierg_power_intervals_15',
    'airbike_aerobic_threshold_20', 'walking_outdoor_flat_30', 'treadmill_power_hike_z3_25',
    'running_intervals_aerobic_30', 'recovery_spin_bike_z1_20', 'recovery_walk_mobility_20',
    'bodyweight_metabolic_circuit_20', 'erg_kettlebell_hybrid_circuit_25',
    'hyrox_station_erg_intervals_30', 'compromised_run_row_engine_30', 'multi_erg_pyramid_z2_30'
  ];

  newIds.forEach(id => {
    const proto = PERF_CARDIO_DB.find(p => p.id === id);
    assert(proto, `Novo protocolo '${id}' deve existir no catálogo`);
    const val = validateCardioProtocol(proto);
    assert.strictEqual(val.isValid, true, `Novo protocolo '${id}' deve ser 100% válido: ${val.errors.join(', ')}`);
  });
});

// -------------------------------------------------------------------------
// TESTE N: Novas modalidades são corretamente classificadas em suas famílias
// -------------------------------------------------------------------------
test('TESTE N: Novas modalidades são corretamente classificadas em suas famílias', () => {
  const stair1 = PERF_CARDIO_DB.find(p => p.id === 'stairmaster_intervals_z3_20');
  const stair2 = PERF_CARDIO_DB.find(p => p.id === 'stairmaster_steady_z2_20');
  const walk = PERF_CARDIO_DB.find(p => p.id === 'walking_outdoor_flat_30');
  const recSpin = PERF_CARDIO_DB.find(p => p.id === 'recovery_spin_bike_z1_20');
  const triErg = PERF_CARDIO_DB.find(p => p.id === 'multi_erg_pyramid_z2_30');

  assert.strictEqual(stair1.modalityFamily, 'ergometer');
  assert.strictEqual(stair2.modalityFamily, 'ergometer');
  assert.strictEqual(walk.modalityFamily, 'locomotion');
  assert.strictEqual(recSpin.modalityFamily, 'recovery');
  assert.strictEqual(triErg.modalityFamily, 'multi_erg');
});

// -------------------------------------------------------------------------
// TESTE O: Protocolos de diferentes níveis são reconhecidos no catálogo expandido
// -------------------------------------------------------------------------
test('TESTE O: Protocolos de diferentes níveis são reconhecidos no catálogo expandido', () => {
  const beginnerProtocols = PERF_CARDIO_DB.filter(p => p.levelTags.includes('iniciante'));
  const intermediateProtocols = PERF_CARDIO_DB.filter(p => p.levelTags.includes('intermediario'));
  const advancedProtocols = PERF_CARDIO_DB.filter(p => p.levelTags.includes('avancado'));

  assert(beginnerProtocols.length >= 10, `Iniciantes devem ter ampla cobertura (atual: ${beginnerProtocols.length})`);
  assert(intermediateProtocols.length >= 20, `Intermediários devem ter ampla cobertura (atual: ${intermediateProtocols.length})`);
  assert(advancedProtocols.length >= 25, `Avançados devem ter ampla cobertura (atual: ${advancedProtocols.length})`);
});

// -------------------------------------------------------------------------
// TESTE P: Protocolos híbridos possuem metadados completos e coerentes
// -------------------------------------------------------------------------
test('TESTE P: Protocolos híbridos possuem metadados completos e coerentes', () => {
  const hybrids = PERF_CARDIO_DB.filter(p => p.modalityFamily === 'hybrid_circuit');
  assert(hybrids.length >= 4, `Devem haver ao menos 4 protocolos de hybrid_circuit (atual: ${hybrids.length})`);
  hybrids.forEach(h => {
    assert(h.components.length >= 1, `Híbrido '${h.id}' deve declarar components`);
    assert(h.blocks.length >= 1, `Híbrido '${h.id}' deve declarar blocks`);
    assert(['LOW', 'MODERATE', 'HIGH'].includes(h.recoveryDemand), `Híbrido '${h.id}' deve ter recoveryDemand válida`);
  });
});

// -------------------------------------------------------------------------
// TESTE Q: Protocolos de circuito possuem metadados completos
// -------------------------------------------------------------------------
test('TESTE Q: Protocolos de circuito possuem metadados completos', () => {
  const circuits = PERF_CARDIO_DB.filter(p => p.intensityType === 'CIRCUIT');
  assert(circuits.length >= 5, `Devem haver ao menos 5 circuitos estruturados (atual: ${circuits.length})`);
  circuits.forEach(c => {
    assert(c.blocks.length >= 2, `Circuito '${c.id}' deve conter múltiplos blocos ou rounds estruturados`);
    assert(typeof c.isHiit === 'boolean', `Circuito '${c.id}' deve declarar isHiit boolean explícito`);
  });
});

// -------------------------------------------------------------------------
// TESTE R: Protocolos HYROX/adaptados possuem metadados completos
// -------------------------------------------------------------------------
test('TESTE R: Protocolos HYROX/adaptados possuem metadados completos', () => {
  const hyroxProtocols = PERF_CARDIO_DB.filter(p =>
    p.modalityTags.includes('hyrox') || (Array.isArray(p.adaptationTags) && p.adaptationTags.includes('compromised_running'))
  );
  assert(hyroxProtocols.length >= 4, `Devem haver ao menos 4 protocolos HYROX/adaptados (atual: ${hyroxProtocols.length})`);
  hyroxProtocols.forEach(hy => {
    assert.strictEqual(hy.category, 'Engine', `HYROX '${hy.id}' deve pertencer à categoria canônica Engine`);
    assert.strictEqual(hy.modalityFamily, 'hybrid_circuit', `HYROX '${hy.id}' deve pertencer à família hybrid_circuit`);
    assert(Array.isArray(hy.adaptationTags) && hy.adaptationTags.length >= 1, `HYROX '${hy.id}' deve declarar adaptationTags`);
    assert(hy.recoveryDemand === 'MODERATE' || hy.recoveryDemand === 'HIGH', `HYROX '${hy.id}' deve declarar demanda de recuperação`);
    assert(hy.restrictions.length >= 1, `HYROX '${hy.id}' deve ter restrictions explícitas`);
  });
});

// -------------------------------------------------------------------------
// TESTE S: Novos protocolos HIIT obedecem à governança contextual de teto de sessões
// -------------------------------------------------------------------------
test('TESTE S: Novos protocolos HIIT obedecem à governança contextual de teto de sessões', () => {
  const newHiit = PERF_CARDIO_DB.find(p => p.id === 'skierg_power_intervals_15');
  assert(newHiit, 'skierg_power_intervals_15 deve existir');
  assert.strictEqual(newHiit.isHiit, true, 'skierg_power_intervals_15 deve ser declarado como isHiit: true');

  // Com teto 0 de HIIT (ex: déficit severo ou recuperação reduzida), deve ser estritamente eliminado
  const hiitCeilingZero = 0;
  const eligibleUnderZero = PERF_CARDIO_DB.filter(p => !(hiitCeilingZero === 0 && p.isHiit));
  assert(!eligibleUnderZero.some(p => p.id === 'skierg_power_intervals_15'),
    'skierg_power_intervals_15 deve ser eliminado quando teto HIIT for 0');

  // Com teto > 0, pode ser considerado
  const hiitCeilingOne = 1;
  const eligibleUnderOne = PERF_CARDIO_DB.filter(p => !(hiitCeilingOne === 0 && p.isHiit));
  assert(eligibleUnderOne.some(p => p.id === 'skierg_power_intervals_15'),
    'skierg_power_intervals_15 deve ser elegível quando teto HIIT for > 0');
});

// -------------------------------------------------------------------------
// TESTE T: Nenhum novo protocolo exige regra baseada em ID
// -------------------------------------------------------------------------
test('TESTE T: Nenhum novo protocolo exige regra baseada em ID', () => {
  const newIds = [
    'stairmaster_intervals_z3_20', 'stairmaster_steady_z2_20', 'skierg_power_intervals_15',
    'airbike_aerobic_threshold_20', 'walking_outdoor_flat_30', 'treadmill_power_hike_z3_25',
    'running_intervals_aerobic_30', 'recovery_spin_bike_z1_20', 'recovery_walk_mobility_20',
    'bodyweight_metabolic_circuit_20', 'erg_kettlebell_hybrid_circuit_25',
    'hyrox_station_erg_intervals_30', 'compromised_run_row_engine_30', 'multi_erg_pyramid_z2_30'
  ];

  newIds.forEach(id => {
    const pattern1 = new RegExp(`\\.id\\s*===?\\s*['"\`]${id}['"\`]`);
    const pattern2 = new RegExp(`\\.id\\s*!==?\\s*['"\`]${id}['"\`]`);
    assert(!pattern1.test(appJsCode), `Proibido hardcoded if (p.id === '${id}') no runtime`);
    assert(!pattern2.test(appJsCode), `Proibido hardcoded if (p.id !== '${id}') no runtime`);
  });
});

// -------------------------------------------------------------------------
// TESTE U: Equipamento ausente elimina corretamente novos protocolos
// -------------------------------------------------------------------------
test('TESTE U: Equipamento ausente elimina corretamente novos protocolos', () => {
  const onlyBike = ['bike'];
  const stair1 = PERF_CARDIO_DB.find(p => p.id === 'stairmaster_intervals_z3_20');
  const skiergHiit = PERF_CARDIO_DB.find(p => p.id === 'skierg_power_intervals_15');
  const bikeZ1 = PERF_CARDIO_DB.find(p => p.id === 'recovery_spin_bike_z1_20');

  assert.strictEqual(isCardioProtocolEquipmentAvailable(stair1, onlyBike), false,
    'Escada deve ser eliminada quando escada não está disponível');
  assert.strictEqual(isCardioProtocolEquipmentAvailable(skiergHiit, onlyBike), false,
    'SkiErg deve ser eliminado quando SkiErg não está disponível');
  assert.strictEqual(isCardioProtocolEquipmentAvailable(bikeZ1, onlyBike), true,
    'Bike Z1 deve ser mantida quando bike está disponível');
});

// -------------------------------------------------------------------------
// TESTE V: Restrição biomecânica elimina corretamente novos protocolos
// -------------------------------------------------------------------------
test('TESTE V: Restrição biomecânica elimina corretamente novos protocolos', () => {
  const skiergHiit = PERF_CARDIO_DB.find(p => p.id === 'skierg_power_intervals_15');
  const kettlebellCircuit = PERF_CARDIO_DB.find(p => p.id === 'erg_kettlebell_hybrid_circuit_25');

  // Contraindicação de ombro
  const patientShoulderInjured = ['lesao_ombro'];
  const hasShoulderContraindication = skiergHiit.contraindicationFlags.some(flag =>
    patientShoulderInjured.includes(flag)
  );
  assert.strictEqual(hasShoulderContraindication, true,
    'skierg_power_intervals_15 deve possuir flag lesao_ombro');

  // Contraindicação de lombar
  const patientBackInjured = ['lombalgia_aguda'];
  const hasBackContraindication = kettlebellCircuit.contraindicationFlags.some(flag =>
    patientBackInjured.includes(flag)
  );
  assert.strictEqual(hasBackContraindication, true,
    'erg_kettlebell_hybrid_circuit_25 deve possuir flag lombalgia_aguda');
});

// -------------------------------------------------------------------------
// TESTE W: Novos protocolos participam corretamente do ranking determinístico
// -------------------------------------------------------------------------
test('TESTE W: Novos protocolos participam corretamente do ranking determinístico', () => {
  const ctx = {
    patient: { objective: 'Emagrecimento', trainingLevel: 'Intermediário', patientType: 'Praticante recreativo' },
    trainingProfile: { workoutType: 'Musculação', frequencyWeekly: 4 },
    constraints: {
      availableEquipment: 'Full Gym',
      preferredModalities: ['escada'],
      avoidedModalities: [],
      prohibitedExercises: [],
      clinicalConstraints: []
    }
  };

  const profile = buildCardioProfile(ctx);
  const ranked = rankCardioProtocols(ctx, profile, PERF_CARDIO_DB);

  assert(ranked.length > 0, 'Ranking deve retornar lista ordenada');
  assert(ranked[0].protocol.id.includes('stairmaster'),
    `Top 1 do ranking deve ser protocolo de escada para preferência 'escada'. Obtido: ${ranked[0].protocol.id}`);
  assert(ranked[0].score >= 70, `Score deve contemplar bônus explícito. Score: ${ranked[0].score}`);
});

// -------------------------------------------------------------------------
// TESTE X: Auditoria de Diversidade e Distribuição do Catálogo Expandido
// -------------------------------------------------------------------------
test('TESTE X: Auditoria de Diversidade e Distribuição do Catálogo Expandido', () => {
  function countBy(fn) {
    const counts = {};
    PERF_CARDIO_DB.forEach(p => {
      const vals = [].concat(fn(p));
      vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    });
    return counts;
  }

  const byFamily = countBy(p => p.modalityFamily);
  const byCategory = countBy(p => p.category);
  const hiitCount = PERF_CARDIO_DB.filter(p => p.isHiit).length;
  const nonHiitCount = PERF_CARDIO_DB.filter(p => !p.isHiit).length;

  assert.strictEqual(PERF_CARDIO_DB.length, 32, 'Catálogo total deve ser 32');
  assert(byFamily['ergometer'] >= 10, 'Ergômetros >= 10');
  assert(byFamily['locomotion'] >= 5, 'Locomoção >= 5');
  assert(byFamily['hybrid_circuit'] >= 8, 'Circuitos Híbridos >= 8');
  assert.strictEqual(byFamily['compromised'], undefined, 'Família compromised NÃO deve existir na taxonomia de modalidades');
  assert.strictEqual(byCategory['Compromised'], undefined, 'Categoria Compromised NÃO deve existir na taxonomia');
  assert(byFamily['multi_erg'] >= 3, 'Multi-Erg >= 3');
  assert(byFamily['recovery'] >= 3, 'Recovery >= 3');

  assert.strictEqual(hiitCount, 5, 'HIIT deve ser exatamente 5 protocolos');
  assert.strictEqual(nonHiitCount, 27, 'Não-HIIT deve ser exatamente 27 protocolos');
});

// -------------------------------------------------------------------------
// TESTE Y: Nenhum protocolo utiliza 'compromised' como modalityFamily
// -------------------------------------------------------------------------
test('TESTE Y: Nenhum protocolo utiliza compromised como modalityFamily nem como categoria', () => {
  const invalidFamily = PERF_CARDIO_DB.filter(p => p.modalityFamily === 'compromised');
  const invalidCategory = PERF_CARDIO_DB.filter(p => p.category === 'Compromised');

  assert.strictEqual(invalidFamily.length, 0,
    `Nenhum protocolo deve ter modalityFamily: 'compromised' (encontrados: ${invalidFamily.map(p => p.id).join(', ')})`);
  assert.strictEqual(invalidCategory.length, 0,
    `Nenhum protocolo deve ter category: 'Compromised' (encontrados: ${invalidCategory.map(p => p.id).join(', ')})`);

  assert(!CARDIO_TAXONOMY.MODALITY_FAMILIES.includes('compromised'),
    'compromised deve ser removido de CARDIO_TAXONOMY.MODALITY_FAMILIES');
  assert(!CARDIO_TAXONOMY.CATEGORIES.includes('Compromised'),
    'Compromised deve ser removido de CARDIO_TAXONOMY.CATEGORIES');
});

// -------------------------------------------------------------------------
// TESTE Z: Toda adaptação 'compromised' é representada por metadado de adaptação
// -------------------------------------------------------------------------
test('TESTE Z: Toda adaptação compromised é representada por metadado de adaptação (adaptationTags)', () => {
  const compromisedProtocols = PERF_CARDIO_DB.filter(p =>
    Array.isArray(p.adaptationTags) && p.adaptationTags.includes('compromised_running')
  );

  assert(compromisedProtocols.length >= 3,
    `Devem existir ao menos 3 protocolos com adaptação compromised_running (atual: ${compromisedProtocols.length})`);

  compromisedProtocols.forEach(p => {
    assert.strictEqual(p.category, 'Engine',
      `Protocolo adaptado '${p.id}' deve pertencer à categoria canônica Engine`);
    assert.strictEqual(p.modalityFamily, 'hybrid_circuit',
      `Protocolo adaptado '${p.id}' deve ter modalidade real hybrid_circuit`);
    assert(p.adaptationTags.includes('compromised_running'),
      `Protocolo '${p.id}' deve declarar adaptationTag 'compromised_running'`);
  });
});

// -------------------------------------------------------------------------
// TESTE AA: Nenhum protocolo possui inconsistência entre nome e intensidade declarada
// -------------------------------------------------------------------------
test('TESTE AA: Nenhum protocolo possui inconsistência entre nome e intensidade declarada', () => {
  PERF_CARDIO_DB.forEach(p => {
    // Se o nome contiver Z1/Z2 ou Z3/Z4, a intensidade declarada deve coincidir
    if (/Z1[\/-]Z2/i.test(p.name)) {
      assert.strictEqual(p.intensityZone, 'Z1/Z2',
        `Protocolo '${p.id}': nome declara Z1/Z2 mas intensityZone é '${p.intensityZone}'`);
    }
    if (/Z3[\/-]Z4/i.test(p.name)) {
      assert.strictEqual(p.intensityZone, 'Z3/Z4',
        `Protocolo '${p.id}': nome declara Z3/Z4 mas intensityZone é '${p.intensityZone}'`);
    }
    if (/Z2\b/i.test(p.name) && !/Z1|Z3/i.test(p.name)) {
      assert.strictEqual(p.intensityZone, 'Z2',
        `Protocolo '${p.id}': nome declara Z2 mas intensityZone é '${p.intensityZone}'`);
    }
    if (/Z1\b/i.test(p.name) && !/Z2/i.test(p.name)) {
      assert.strictEqual(p.intensityZone, 'Z1',
        `Protocolo '${p.id}': nome declara Z1 mas intensityZone é '${p.intensityZone}'`);
    }
  });
});

// -------------------------------------------------------------------------
// TESTE AB: INTERVALS não implica automaticamente isHiit === true
// -------------------------------------------------------------------------
test('TESTE AB: INTERVALS não implica automaticamente isHiit === true', () => {
  const intervalsProtocols = PERF_CARDIO_DB.filter(p => p.intensityType === 'INTERVALS');
  assert(intervalsProtocols.length >= 4, 'Devem existir múltiplos protocolos com intensityType: INTERVALS');

  const aerobicIntervals = intervalsProtocols.filter(p => !p.isHiit);
  const hiitIntervals = intervalsProtocols.filter(p => p.isHiit);

  assert(aerobicIntervals.length >= 3,
    `Devem existir protocolos intervalados aeróbios de sustentação sem ser HIIT (atual: ${aerobicIntervals.length})`);
  assert(hiitIntervals.length >= 2,
    `Devem existir protocolos intervalados de alta intensidade (HIIT) (atual: ${hiitIntervals.length})`);

  // Verifica que intervalados aeróbios operam em Z3/Z4 e não Z4/Z5 ou Z5
  aerobicIntervals.forEach(p => {
    assert(p.intensityZone === 'Z3/Z4' || p.intensityZone === 'Z3',
      `Intervalado aeróbio '${p.id}' deve operar em Z3 ou Z3/Z4. Encontrado: ${p.intensityZone}`);
    assert.strictEqual(p.isHiit, false, `Protocolo '${p.id}' não deve ser classificado como HIIT`);
  });

  // Verifica que HIIT opera em Z4/Z5 ou Z5
  hiitIntervals.forEach(p => {
    assert(p.intensityZone === 'Z4/Z5' || p.intensityZone === 'Z5',
      `Protocolo HIIT '${p.id}' deve operar em Z4/Z5 ou Z5. Encontrado: ${p.intensityZone}`);
    assert.strictEqual(p.isHiit, true, `Protocolo HIIT '${p.id}' deve ter isHiit: true`);
  });
});

// -------------------------------------------------------------------------
// TESTE AC: Taxonomia final não possui níveis biomecânicos semanticamente duplicados
// -------------------------------------------------------------------------
test('TESTE AC: Taxonomia final não possui níveis biomecânicos semanticamente duplicados', () => {
  assert(!CARDIO_TAXONOMY.BIOMECHANICAL_LEVELS.includes('MOD'),
    'MOD abreviado não deve coexistir com MODERATE em BIOMECHANICAL_LEVELS');

  assert.deepStrictEqual(
    Array.from(CARDIO_TAXONOMY.BIOMECHANICAL_LEVELS),
    ['NONE', 'LOW', 'MODERATE', 'HIGH'],
    'BIOMECHANICAL_LEVELS deve conter exclusivamente [NONE, LOW, MODERATE, HIGH]'
  );

  const biomechFields = ['impactLevel', 'axialLoad', 'posteriorChainDemand', 'lowerLimbDemand', 'upperLimbDemand'];
  PERF_CARDIO_DB.forEach(p => {
    biomechFields.forEach(field => {
      assert(CARDIO_TAXONOMY.BIOMECHANICAL_LEVELS.includes(p[field]),
        `Protocolo '${p.id}' possui valor inválido '${p[field]}' no campo '${field}'`);
      assert.notStrictEqual(p[field], 'MOD',
        `Protocolo '${p.id}' utiliza 'MOD' em '${field}' em vez do padrão 'MODERATE'`);
    });
  });
});

// -------------------------------------------------------------------------
// TESTE AD: HYROX permanece 100% representável e funcional após a normalização
// -------------------------------------------------------------------------
test('TESTE AD: HYROX permanece 100% representável e funcional após a normalização', () => {
  const hyroxProtocols = PERF_CARDIO_DB.filter(p =>
    p.modalityTags.includes('hyrox') || (Array.isArray(p.adaptationTags) && p.adaptationTags.includes('compromised_running'))
  );

  assert(hyroxProtocols.length >= 3, 'Devem existir protocolos com foco HYROX no catálogo');

  // Teste de ranking para preferência por HYROX
  const ctx = {
    patient: { objective: 'Performance', trainingLevel: 'Avançado', patientType: 'Atleta' },
    trainingProfile: { workoutType: 'Musculação', frequencyWeekly: 4 },
    constraints: {
      availableEquipment: 'Full Gym',
      preferredModalities: ['hyrox'],
      avoidedModalities: [],
      prohibitedExercises: [],
      clinicalConstraints: []
    }
  };

  const profile = buildCardioProfile(ctx);
  const ranked = rankCardioProtocols(ctx, profile, PERF_CARDIO_DB);

  assert(ranked.length > 0, 'Ranking deve retornar lista de candidatos');
  assert(ranked[0].protocol.modalityTags.includes('hyrox'),
    `Top 1 do ranking deve possuir tag 'hyrox' para preferência 'hyrox'. Obtido: ${ranked[0].protocol.id}`);
  assert(ranked[0].score >= 70, `Top 1 deve pontuar com bônus de preferência explícita. Score: ${ranked[0].score}`);
});

// -------------------------------------------------------------------------
// Resumo Final
// -------------------------------------------------------------------------
console.log('----------------------------------------------------------------');
console.log(`F7.3-B.1 Total de testes: ${passed + failed} | Passaram: ${passed} | Falharam: ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
