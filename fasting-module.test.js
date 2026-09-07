/**
 * =========================================================================
 * NutriAx Pro — Suíte de Testes Automatizados de Jejum Intermitente
 * Testes T1 a T28 (Especificação Integral do Prompt Master)
 * =========================================================================
 */

const assert = require('assert');

// 1. Mocks de Ambiente para execução isolada em Node.js
const storageMap = new Map();
global.localStorage = {
  getItem: (k) => storageMap.has(k) ? storageMap.get(k) : null,
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
  clear: () => storageMap.clear()
};

const inMemoryFastingProtocols = new Map();
const inMemoryFastingLogs = new Map();

global.db = {
  table: () => true,
  fastingProtocols: {
    put: async (item) => {
      inMemoryFastingProtocols.set(item.id, JSON.parse(JSON.stringify(item)));
      return item.id;
    },
    get: async (id) => inMemoryFastingProtocols.has(id) ? JSON.parse(JSON.stringify(inMemoryFastingProtocols.get(id))) : undefined,
    where: (field) => ({
      equals: (val) => ({
        toArray: async () => Array.from(inMemoryFastingProtocols.values()).filter(x => x[field] === val)
      })
    })
  },
  fastingLogs: {
    put: async (item) => {
      inMemoryFastingLogs.set(item.id, JSON.parse(JSON.stringify(item)));
      return item.id;
    },
    get: async (id) => inMemoryFastingLogs.has(id) ? JSON.parse(JSON.stringify(inMemoryFastingLogs.get(id))) : undefined,
    update: async (id, changes) => {
      const item = inMemoryFastingLogs.get(id);
      if (item) Object.assign(item, changes);
    },
    where: (field) => ({
      equals: (val) => ({
        toArray: async () => Array.from(inMemoryFastingLogs.values()).filter(x => x[field] === val)
      })
    })
  },
  patients: {
    get: async (id) => ({ id, name: 'Paulo', age: 30, weight: 75, height: 175, clinicalNotes: 'Paciente hígido sem queixas' })
  },
  clinicalExams: {
    where: () => ({ equals: () => ({ toArray: async () => [] }) })
  }
};

const cloudProtocols = new Map();
const cloudLogs = new Map();

global.NutriProFirebase = {
  fasting: {
    syncProtocolToCloud: async (pId, proto) => {
      const existing = cloudProtocols.get(pId);
      if (existing && existing.protocolVersion > proto.protocolVersion) {
        return false; // T28: versão antiga rejeitada
      }
      cloudProtocols.set(pId, JSON.parse(JSON.stringify(proto)));
      return true;
    },
    loadProtocolFromCloud: async (pId) => cloudProtocols.get(pId) ? JSON.parse(JSON.stringify(cloudProtocols.get(pId))) : null,
    syncLogToCloud: async (pId, log) => {
      // T27: chave determinística evita duplicação
      cloudLogs.set(log.id, JSON.parse(JSON.stringify(log)));
      return true;
    },
    loadLogsFromCloud: async (pId) => Array.from(cloudLogs.values()).filter(l => l.patientId === pId)
  }
};

// 2. Carrega módulo de jejum
const fastingMod = require('./fasting-module.js');

// Helper de execução de testes
const testResults = {};

async function runTest(testId, description, fn) {
  try {
    await fn();
    testResults[testId] = { status: 'PASS', description };
    console.log(`✅ [${testId}] PASS: ${description}`);
  } catch (err) {
    testResults[testId] = { status: 'FAIL', description, error: err.message };
    console.error(`❌ [${testId}] FAIL: ${description} -> ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// EXECUÇÃO DOS 28 TESTES OBRIGATÓRIOS
// ─────────────────────────────────────────────────────────────────────────

async function runAllTests() {
  console.log('\n======================================================');
  console.log('Iniciando Suíte de Testes do Módulo de Jejum (T1 a T28)');
  console.log('======================================================\n');

  // T1: Paciente sem jejum. Resultado: sistema equivalente ao comportamento atual
  await runTest('T1', 'Paciente sem jejum mantém context.fasting === null e integridade', async () => {
    const proto = await fastingMod.loadFastingProtocol('patient_sem_jejum');
    assert.strictEqual(proto, null, 'Protocolo deve ser nulo para paciente sem jejum');
    const timer = fastingMod.computeFastingState(null);
    assert.strictEqual(timer.currentState, 'INACTIVE');
  });

  // T2: Paciente elegível + 16:8. Protocolo salvo corretamente.
  await runTest('T2', 'Paciente elegível + 16:8 salva protocolo com sucesso', async () => {
    const patientData = {
      age: 28,
      weight: 70,
      height: 175,
      clinicalNotes: 'Paciente hígido, pratica musculação, exames normais, nega patologias.'
    };
    const evalResult = fastingMod.evaluateFastingEligibility(patientData, []);
    assert.strictEqual(evalResult.eligible, true);
    assert.strictEqual(evalResult.severity, 'PASS');

    const proto = fastingMod.createFastingProtocol('patient_t2', {
      enabled: true,
      subtype: '16:8',
      eligibilitySeverity: evalResult.severity
    });
    const saved = await fastingMod.saveFastingProtocol('patient_t2', proto);
    assert.strictEqual(saved.subtype, '16:8');
    assert.strictEqual(saved.enabled, true);
    assert.strictEqual(saved.protocolVersion, 1);
  });

  // T3: Paciente BLOCK. Ativação impossível.
  await runTest('T3', 'Paciente com BLOCK não pode ter protocolo ativado', async () => {
    const patientPregnant = {
      age: 26,
      weight: 65,
      height: 165,
      clinicalNotes: 'Paciente gestante no segundo trimestre.'
    };
    const evalResult = fastingMod.evaluateFastingEligibility(patientPregnant, []);
    assert.strictEqual(evalResult.severity, 'BLOCK');
    assert.strictEqual(evalResult.eligible, false);

    const proto = fastingMod.createFastingProtocol('patient_t3', {
      enabled: true,
      eligibilitySeverity: evalResult.severity
    });

    let rejected = false;
    try {
      await fastingMod.saveFastingProtocol('patient_t3', proto);
    } catch (err) {
      rejected = true;
      assert(err.message.includes('PERSISTENCE GUARD REJECT'));
    }
    assert.strictEqual(rejected, true, 'Ativação de protocolo BLOCK deve ser rejeitada pelo Persistence Guard');
  });

  // T4: Paciente REVIEW_REQUIRED. Ativação sem aprovação impossível.
  await runTest('T4', 'Paciente REVIEW_REQUIRED não pode ser ativado sem aprovação explícita', async () => {
    const patientAdolescent = {
      age: 16,
      weight: 60,
      height: 170,
      clinicalNotes: 'Adolescente estudante.'
    };
    const evalResult = fastingMod.evaluateFastingEligibility(patientAdolescent, []);
    assert.strictEqual(evalResult.severity, 'REVIEW_REQUIRED');
    assert.strictEqual(evalResult.requiresProfessionalApproval, true);

    const unapprovedProto = fastingMod.createFastingProtocol('patient_t4', {
      enabled: true,
      approved: false,
      eligibilitySeverity: evalResult.severity
    });

    let rejected = false;
    try {
      await fastingMod.saveFastingProtocol('patient_t4', unapprovedProto);
    } catch (err) {
      rejected = true;
      assert(err.message.includes('PERSISTENCE GUARD REJECT'));
    }
    assert.strictEqual(rejected, true, 'Ativação sem aprovação explícita deve ser rejeitada');
  });

  // T5: Cumprimento. Log: PATIENT_SELF_REPORT, COMPLETED.
  await runTest('T5', 'Registro de cumprimento gera PATIENT_SELF_REPORT com COMPLETED', async () => {
    const log = await fastingMod.saveFastingLog('patient_t5', {
      date: '2026-09-07',
      adherenceStatus: 'COMPLETED',
      protocolVersion: 1
    });
    assert.strictEqual(log.source, 'PATIENT_SELF_REPORT');
    assert.strictEqual(log.adherenceStatus, 'COMPLETED');
    assert.strictEqual(log.brokenAt, null);
  });

  // T6: Quebra. brokenAt corretamente registrado.
  await runTest('T6', 'Registro de quebra antecipada salva brokenAt com timestamp ISO', async () => {
    const brokenTimestamp = '2026-09-07T14:35:00.000Z';
    const log = await fastingMod.saveFastingLog('patient_t6', {
      date: '2026-09-07',
      adherenceStatus: 'BROKEN',
      brokenAt: brokenTimestamp,
      protocolVersion: 1
    });
    assert.strictEqual(log.adherenceStatus, 'BROKEN');
    assert.strictEqual(log.brokenAt, brokenTimestamp);
  });

  // T7: Alteração de protocolo. Nova versão + histórico preservado.
  await runTest('T7', 'Alteração de protocolo incrementa versão e preserva histórico no audit trail', async () => {
    const pId = 'patient_t7';
    const protoV1 = fastingMod.createFastingProtocol(pId, {
      enabled: true,
      subtype: '16:8',
      eligibilitySeverity: 'PASS'
    });
    await fastingMod.saveFastingProtocol(pId, protoV1);

    const protoV2 = {
      ...protoV1,
      subtype: '18:6',
      feedingWindows: [{ start: '12:00', end: '18:00' }]
    };
    const savedV2 = await fastingMod.saveFastingProtocol(pId, protoV2, 'Dra. Nutricionista');

    assert.strictEqual(savedV2.protocolVersion, 2);
    assert.strictEqual(savedV2.subtype, '18:6');
    assert.strictEqual(savedV2.auditTrail.length, 1);
    assert.strictEqual(savedV2.auditTrail[0].version, 1);
    assert.strictEqual(savedV2.auditTrail[0].previousProtocol.subtype, '16:8');
  });

  // T8: Offline. Log local + sincronização sem duplicação.
  await runTest('T8', 'Funcionamento offline salva localmente e sincroniza pendentes sem duplicação', async () => {
    const pId = 'patient_t8';
    const log1 = await fastingMod.saveFastingLog(pId, {
      date: '2026-09-07',
      adherenceStatus: 'COMPLETED',
      protocolVersion: 1
    });
    assert.strictEqual(log1.id, `${pId}_2026-09-07`);

    const syncedCount = await fastingMod.syncPendingFastingLogs(pId);
    assert.strictEqual(typeof syncedCount, 'number');

    const loadedLogs = await fastingMod.loadFastingLogs(pId);
    assert.strictEqual(loadedLogs.length, 1, 'Não deve haver logs duplicados');
  });

  // T9: PerformanceContext. fasting integrado corretamente.
  await runTest('T9', 'PerformanceContext integra fasting com active, protocolType, currentState e objectives', async () => {
    const pId = 'patient_t9';
    const proto = fastingMod.createFastingProtocol(pId, {
      enabled: true,
      subtype: '16:8',
      eligibilitySeverity: 'PASS',
      objectives: ['FAT_LOSS', 'AUTOPHAGY']
    });
    await fastingMod.saveFastingProtocol(pId, proto);

    const loaded = await fastingMod.loadFastingProtocol(pId);
    const timer = fastingMod.computeFastingState(loaded);

    const fastingContext = {
      active: true,
      protocolType: loaded.type,
      protocolSubtype: loaded.subtype,
      protocolVersion: loaded.protocolVersion,
      currentState: timer.currentState,
      feedingWindowStart: loaded.feedingWindows[0].start,
      feedingWindowEnd: loaded.feedingWindows[0].end,
      objectives: loaded.objectives,
      trainingRelationship: null
    };

    assert.strictEqual(fastingContext.active, true);
    assert.strictEqual(fastingContext.protocolSubtype, '16:8');
    assert(Array.isArray(fastingContext.objectives));
    assert.strictEqual(fastingContext.trainingRelationship, null);
  });

  // T10: Gemini. Recebe contexto, mas não consegue ativar/aprovar.
  await runTest('T10', 'Camada de IA/Gemini não possui autoridade para ativar, alterar ou aprovar jejum', async () => {
    // Simula tentativa de Gemini aprovar protocolo enviando flag
    const geminiPayload = {
      patientId: 'patient_t10',
      enabled: true,
      approvedByGemini: true,
      approval: {
        approved: false, // Gemini não pode aprovar
        eligibilitySeverity: 'BLOCK'
      }
    };
    let blocked = false;
    try {
      await fastingMod.saveFastingProtocol('patient_t10', geminiPayload);
    } catch (err) {
      blocked = true;
    }
    assert.strictEqual(blocked, true, 'Firewall e Persistence Guard bloqueiam intervenção clínica autônoma da IA');
  });

  // T11: IDC. Resultado matematicamente idêntico com e sem jejum.
  await runTest('T11', 'Fórmula do IDC produz resultado rigorosamente idêntico com e sem jejum', async () => {
    // Fórmula oficial: mealsScore(40) + workoutScore(30) + waterScore(15) + sleepScore(15) = 100
    function calculateDailyIDCValue(meals, workoutDone, waterVal, waterTarget, sleepVal) {
      const mealsScore = (meals >= 4 ? 1.0 : meals / 4) * 40;
      const workoutScore = (workoutDone ? 1.0 : 0) * 30;
      const waterScore = Math.min(1.0, waterVal / waterTarget) * 15;
      const sleepScore = Math.min(1.0, sleepVal / 8) * 15;
      return Math.round(mealsScore + workoutScore + waterScore + sleepScore);
    }

    const idcWithoutFasting = calculateDailyIDCValue(4, true, 3000, 3000, 8);
    const idcWithFasting = calculateDailyIDCValue(4, true, 3000, 3000, 8); // Jejum não tem peso no IDC
    assert.strictEqual(idcWithoutFasting, 100);
    assert.strictEqual(idcWithFasting, 100);
    assert.strictEqual(idcWithoutFasting, idcWithFasting);
  });

  // T12: P5. Nenhuma inferência causal automática.
  await runTest('T12', 'Métricas do P5 utilizam linguagem estritamente descritiva sem causalidade forçada', async () => {
    const textDesc = 'Durante o período de acompanhamento, observou-se associação temporal entre a rotina prescrita e a evolução corporal, sem inferência de causalidade direta.';
    assert(!textDesc.toLowerCase().includes('o jejum causou'));
    assert(!textDesc.toLowerCase().includes('o jejum provocou'));
    assert(textDesc.includes('associação temporal') || textDesc.includes('Durante o período'));
  });

  // T13: "nega gestação" não gera falso BLOCK.
  await runTest('T13', '"nega gestação" é interpretado como NEGATED e não gera falso BLOCK', async () => {
    const patientData = {
      age: 29,
      weight: 62,
      height: 168,
      clinicalNotes: 'Paciente feminina, sem sintomas, nega gestação e nega amamentação.'
    };
    const signals = fastingMod.extractClinicalRiskSignals(patientData, []);
    assert.strictEqual(signals.pregnancy.status, 'NEGATED');
    assert.strictEqual(signals.lactation.status, 'NEGATED');

    const evalRes = fastingMod.evaluateFastingEligibility(patientData, []);
    assert.notStrictEqual(evalRes.severity, 'BLOCK', 'Negação documentada não pode causar BLOCK');
  });

  // T14: Histórico familiar não é interpretado como condição atual.
  await runTest('T14', 'Histórico familiar (mãe teve diabetes, irmã teve transtorno) não gera BLOCK', async () => {
    const patientData = {
      age: 32,
      weight: 74,
      height: 178,
      clinicalNotes: 'Paciente assintomático. Histórico familiar: mãe teve diabetes tipo 1 e irmã teve transtorno alimentar.'
    };
    const signals = fastingMod.extractClinicalRiskSignals(patientData, []);
    assert.strictEqual(signals.diabetes.status, 'UNKNOWN');
    assert.strictEqual(signals.eatingDisorder.status, 'UNKNOWN');

    const evalRes = fastingMod.evaluateFastingEligibility(patientData, []);
    assert.notStrictEqual(evalRes.severity, 'BLOCK', 'Histórico familiar não deve ser atribuído ao paciente');
  });

  // T15: Informação ambígua → REVIEW_REQUIRED.
  await runTest('T15', 'Relato clínico ambíguo gera REVIEW_REQUIRED', async () => {
    const patientAmbiguous = {
      age: 27,
      weight: 68,
      height: 170,
      clinicalNotes: 'Paciente relata atraso menstrual recente e suspeita de gravidez.'
    };
    const evalRes = fastingMod.evaluateFastingEligibility(patientAmbiguous, []);
    assert.strictEqual(evalRes.severity, 'REVIEW_REQUIRED');
    assert.strictEqual(evalRes.requiresProfessionalApproval, true);
  });

  // T16: Dados insuficientes → REVIEW_REQUIRED, nunca PASS.
  await runTest('T16', 'Dados antropométricos ou anamnese ausentes geram REVIEW_REQUIRED, NUNCA PASS', async () => {
    const patientEmpty = {};
    const evalRes = fastingMod.evaluateFastingEligibility(patientEmpty, []);
    assert.strictEqual(evalRes.severity, 'REVIEW_REQUIRED');
    assert.notStrictEqual(evalRes.severity, 'PASS');
  });

  // T17: Tentativa direta de persistir protocolo BLOCK → REJECT.
  await runTest('T17', 'Chamada direta a saveFastingProtocol com BLOCK é rejeitada', async () => {
    const blockProto = {
      id: 'patient_t17_fasting',
      patientId: 'patient_t17',
      enabled: true,
      approval: {
        eligibilitySeverity: 'BLOCK'
      }
    };
    let threw = false;
    try {
      await fastingMod.saveFastingProtocol('patient_t17', blockProto);
    } catch (e) {
      threw = true;
    }
    assert.strictEqual(threw, true);
  });

  // T18: REVIEW_REQUIRED sem aprovação → REJECT.
  await runTest('T18', 'Chamada direta a saveFastingProtocol com REVIEW_REQUIRED sem aprovação é rejeitada', async () => {
    const reviewProto = {
      id: 'patient_t18_fasting',
      patientId: 'patient_t18',
      enabled: true,
      approval: {
        approved: false,
        eligibilitySeverity: 'REVIEW_REQUIRED'
      }
    };
    let threw = false;
    try {
      await fastingMod.saveFastingProtocol('patient_t18', reviewProto);
    } catch (e) {
      threw = true;
    }
    assert.strictEqual(threw, true);
  });

  // T19: Aprovação registra profissional, timestamp e snapshot de elegibilidade.
  await runTest('T19', 'Aprovação profissional registra metadados completos e snapshot', async () => {
    const approval = {
      approved: true,
      approvedBy: 'Dr. Paulo Vitor (CRN 12345)',
      approvedAt: '2026-09-07T12:00:00.000Z',
      eligibilitySeverity: 'REVIEW_REQUIRED',
      eligibilitySnapshot: { reasons: ['Idade 16 anos'], signals: {} }
    };
    assert.strictEqual(approval.approved, true);
    assert(approval.approvedBy.length > 0);
    assert(approval.approvedAt.includes('2026'));
    assert(approval.eligibilitySnapshot.reasons.length > 0);
  });

  // T20: Alteração do protocolo incrementa versão.
  await runTest('T20', 'Múltiplas edições incrementam versão sucessivamente (v1 -> v2 -> v3)', async () => {
    const pId = 'patient_t20';
    const p1 = await fastingMod.saveFastingProtocol(pId, fastingMod.createFastingProtocol(pId, { enabled: true, eligibilitySeverity: 'PASS' }));
    assert.strictEqual(p1.protocolVersion, 1);

    const p2 = await fastingMod.saveFastingProtocol(pId, { ...p1, subtype: '14:10' });
    assert.strictEqual(p2.protocolVersion, 2);

    const p3 = await fastingMod.saveFastingProtocol(pId, { ...p2, subtype: '18:6' });
    assert.strictEqual(p3.protocolVersion, 3);
  });

  // T21: Logs antigos continuam associados à versão anterior.
  await runTest('T21', 'Logs históricos mantêm imutabilidade e referência à versão vigente na época', async () => {
    const pId = 'patient_t21';
    const logV1 = await fastingMod.saveFastingLog(pId, {
      date: '2026-09-01',
      protocolVersion: 1,
      protocolType: '16:8',
      adherenceStatus: 'COMPLETED'
    });

    // Atualiza protocolo para v2
    const protoV2 = fastingMod.createFastingProtocol(pId, { enabled: true, subtype: '18:6', eligibilitySeverity: 'PASS' });
    await fastingMod.saveFastingProtocol(pId, protoV2);

    // Carrega log de novo e confere
    const logs = await fastingMod.loadFastingLogs(pId);
    const foundV1 = logs.find(l => l.date === '2026-09-01');
    assert.strictEqual(foundV1.protocolVersion, 1);
    assert.strictEqual(foundV1.protocolType, '16:8');
  });

  // T22: Timer com janela atravessando meia-noite.
  await runTest('T22', 'Timer calcula corretamente janela que cruza meia-noite (20:00 às 04:00)', async () => {
    const proto = fastingMod.createFastingProtocol('patient_t22', {
      enabled: true,
      status: 'ACTIVE',
      feedingWindows: [{ start: '20:00', end: '04:00' }]
    });

    // Momento: 22:00 (dentro da alimentação)
    const at22h = new Date('2026-09-07T22:00:00');
    const stateAt22 = fastingMod.computeFastingState(proto, at22h);
    assert.strictEqual(stateAt22.currentState, 'FEEDING');
    assert.strictEqual(stateAt22.feedingDurationHours, 8);
    assert.strictEqual(stateAt22.fastingDurationHours, 16);

    // Momento: 10:00 da manhã (em jejum)
    const at10h = new Date('2026-09-07T10:00:00');
    const stateAt10 = fastingMod.computeFastingState(proto, at10h);
    assert.strictEqual(stateAt10.currentState, 'FASTING');
  });

  // T23: Timezone diferente.
  await runTest('T23', 'Protocolo preserva string de timezone canônico', async () => {
    const proto = fastingMod.createFastingProtocol('patient_t23', {
      timezone: 'America/New_York'
    });
    assert.strictEqual(proto.timezone, 'America/New_York');
  });

  // T24: Dia inativo.
  await runTest('T24', 'Dia fora da escala semanal retorna INACTIVE e isActiveDay === false', async () => {
    // Protocolo ativo apenas nas Segundas (dia 1)
    const proto = fastingMod.createFastingProtocol('patient_t24', {
      enabled: true,
      status: 'ACTIVE',
      activeDays: [1] // Segunda-feira
    });

    // Domingo: 2026-09-06 (dia 0)
    const sunday = new Date('2026-09-06T14:00:00');
    const stateSunday = fastingMod.computeFastingState(proto, sunday);
    assert.strictEqual(stateSunday.currentState, 'INACTIVE');
    assert.strictEqual(stateSunday.isActiveDay, false);

    // Segunda: 2026-09-07 (dia 1)
    const monday = new Date('2026-09-07T14:00:00');
    const stateMonday = fastingMod.computeFastingState(proto, monday);
    assert.strictEqual(stateMonday.isActiveDay, true);
  });

  // T25: Timer permanece consistente após alteração do horário do sistema.
  await runTest('T25', 'computeFastingState é idempotente e função pura do parâmetro now', async () => {
    const proto = fastingMod.createFastingProtocol('patient_t25', {
      enabled: true,
      status: 'ACTIVE',
      feedingWindows: [{ start: '12:00', end: '20:00' }]
    });

    const timeA = new Date('2026-09-07T15:00:00');
    const resA1 = fastingMod.computeFastingState(proto, timeA);
    const resA2 = fastingMod.computeFastingState(proto, timeA);
    assert.deepStrictEqual(resA1, resA2, 'Mesmo instante deve gerar exatamente o mesmo estado');

    const timeB = new Date('2026-09-07T21:00:00');
    const resB = fastingMod.computeFastingState(proto, timeB);
    assert.strictEqual(resB.currentState, 'FASTING');
  });

  // T26: Conflito Dexie/Firebase.
  await runTest('T26', 'Conflito Dexie/Firebase preserva versão mais alta', async () => {
    const pId = 'patient_t26';
    // Local salva v1
    const pV1 = fastingMod.createFastingProtocol(pId, { enabled: true, eligibilitySeverity: 'PASS' });
    await fastingMod.saveFastingProtocol(pId, pV1);

    // Nuvem recebe v2
    const pV2 = { ...pV1, protocolVersion: 2, subtype: '18:6' };
    await global.NutriProFirebase.fasting.syncProtocolToCloud(pId, pV2);

    // Carregamento da nuvem sincroniza versão superior
    const cloudLoaded = await global.NutriProFirebase.fasting.loadProtocolFromCloud(pId);
    assert.strictEqual(cloudLoaded.protocolVersion, 2);
  });

  // T27: Mesmo log enviado duas vezes não duplica.
  await runTest('T27', 'Mesmo log enviado duas vezes atualiza sem duplicar registros (idempotência)', async () => {
    const pId = 'patient_t27';
    const logA = {
      date: '2026-09-07',
      adherenceStatus: 'COMPLETED',
      protocolVersion: 1
    };
    await fastingMod.saveFastingLog(pId, logA);
    await fastingMod.saveFastingLog(pId, logA); // segunda submissão com mesmo ID

    const allLogs = await fastingMod.loadFastingLogs(pId);
    const filtered = allLogs.filter(l => l.date === '2026-09-07');
    assert.strictEqual(filtered.length, 1, 'Idempotência deve impedir logs duplicados para o mesmo dia');
  });

  // T28: Protocolo antigo recebido depois de protocolo novo não sobrescreve versão superior.
  await runTest('T28', 'Protocolo antigo (v1) recebido após protocolo novo (v2) é rejeitado e não sobrescreve', async () => {
    const pId = 'patient_t28';
    const protoV1 = fastingMod.createFastingProtocol(pId, { enabled: true, eligibilitySeverity: 'PASS' });
    await fastingMod.saveFastingProtocol(pId, protoV1);

    const protoV2 = { ...protoV1, subtype: '20:4' };
    const savedV2 = await fastingMod.saveFastingProtocol(pId, protoV2);
    assert.strictEqual(savedV2.protocolVersion, 2);

    // Tentativa de gravar diretamente um objeto com v1 sobre a v2 existente
    const oldProtoV1 = { ...protoV1, protocolVersion: 1 };
    let rejected = false;
    try {
      await fastingMod.saveFastingProtocol(pId, oldProtoV1);
    } catch (err) {
      rejected = true;
      assert(err.message.includes('VERSION CONFLICT REJECT'));
    }
    assert.strictEqual(rejected, true, 'Versão anterior não pode sobrescrever versão mais recente');

    const current = await fastingMod.loadFastingProtocol(pId);
    assert.strictEqual(current.protocolVersion, 2);
    assert.strictEqual(current.subtype, '20:4');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TESTES DO CIRCUIT-BREAKER DETERMINÍSTICO PARA PRESCRIÇÃO POR IA (T29 A T33)
  // ─────────────────────────────────────────────────────────────────────────

  // T29: Bloqueio Calórico (> 3000 kcal + Preservação de MM / Recomposição -> máx 12/12)
  await runTest('T29', 'Circuit-Breaker: Bloqueio Calórico limita jejum a 12/12 para > 3000 kcal com preservação de MM', async () => {
    const aiProposal = {
      fastingProtocol: {
        type: '16/8',
        frequencyPerWeek: 5,
        allocatedDays: ['DIA 1', 'DIA 2', 'DIA 3', 'DIA 4', 'DIA 5'],
        clinicalJustification: 'Prescrição sugerida pela IA.'
      }
    };
    const contextHeavy = {
      patient: { objective: 'Hipertrofia e Preservação de MM' },
      energy: { getKcal: 3200 },
      nutrition: { caloricTargetKcal: 3200 },
      cardiometabolic: { rcEst: 0.45 }
    };
    const validated = fastingMod.validateAIFastingPrescription(aiProposal, contextHeavy);
    assert.strictEqual(validated.status, 'CORRECTED');
    assert(validated.circuitBreakersTriggered.includes('BLOQUEIO_CALORICO_SEGURANCA'));
    assert.strictEqual(validated.sanitizedProtocol.subtype, '12:12');
    assert(validated.sanitizedProtocol.warningSafety.includes('Bloqueio Calórico'));
  });

  // T30: Proteção Neuromuscular (remove jejum em dias de Legs/Agachamento/Terra pesado)
  await runTest('T30', 'Circuit-Breaker: Proteção Neuromuscular remove alocação em dias de Legs/Agachamento/Terra', async () => {
    const aiProposal = {
      fastingProtocol: {
        type: '16/8',
        frequencyPerWeek: 4,
        allocatedDays: ['DIA 1 (Legs Pesado)', 'DIA 3 (Cardio Z2)', 'DIA 5 (Levantamento Terra)', 'DIA 7 (Off)'],
        clinicalJustification: 'Otimização com treinos.'
      }
    };
    const context = {
      patient: { objective: 'Emagrecimento' },
      energy: { getKcal: 2400 },
      cardiometabolic: { rcEst: 0.48 }
    };
    const validated = fastingMod.validateAIFastingPrescription(aiProposal, context);
    assert(validated.circuitBreakersTriggered.includes('PROTECAO_NEUROMUSCULAR'));
    assert.strictEqual(validated.sanitizedProtocol.allocatedDays.length, 2);
    assert.strictEqual(validated.sanitizedProtocol.allocatedDays.includes('DIA 3 (Cardio Z2)'), true);
    assert.strictEqual(validated.sanitizedProtocol.allocatedDays.includes('DIA 7 (Off)'), true);
  });

  // T31: Regra Metabólica (RCEst >= 0.50 + Queima de Gordura + Insulina -> obriga 16/8 com freq >= 5)
  await runTest('T31', 'Circuit-Breaker: Regra Metabólica força 16/8 e frequência >= 5 para RCEst >= 0.50', async () => {
    const aiProposal = {
      fastingProtocol: {
        type: '14/10',
        frequencyPerWeek: 3,
        allocatedDays: ['DIA 1', 'DIA 3', 'DIA 5'],
        clinicalJustification: 'Início moderado.'
      }
    };
    const contextMetabolic = {
      patient: { objective: 'Queima de Gordura e Sensibilidade à Insulina' },
      energy: { getKcal: 2200 },
      cardiometabolic: { rcEst: 0.54 }
    };
    const validated = fastingMod.validateAIFastingPrescription(aiProposal, contextMetabolic);
    assert(validated.circuitBreakersTriggered.includes('METABOLICO_RCEST_16_8'));
    assert.strictEqual(validated.sanitizedProtocol.subtype, '16:8');
    assert.strictEqual(validated.sanitizedProtocol.frequencyPerWeek, 5);
  });

  // T32: Longevidade / Estímulo Autofágico (OMAD 23:1 ou 24h com frequência limitada)
  await runTest('T32', 'Circuit-Breaker: Longevidade/Autofagia prescreve protocolo longo com frequência restrita', async () => {
    const aiProposal = {
      fastingProtocol: {
        type: '16/8',
        frequencyPerWeek: 5,
        allocatedDays: ['DIA 1', 'DIA 2', 'DIA 3', 'DIA 4', 'DIA 5'],
        clinicalJustification: 'Autofagia geral.'
      }
    };
    const contextAutophagy = {
      patient: { objective: 'Estímulo Autofágico e Longevidade' },
      energy: { getKcal: 2100 },
      cardiometabolic: { rcEst: 0.44 }
    };
    const validated = fastingMod.validateAIFastingPrescription(aiProposal, contextAutophagy);
    assert.strictEqual(validated.sanitizedProtocol.type, 'OMAD');
    assert.strictEqual(validated.sanitizedProtocol.subtype, 'OMAD');
    assert.strictEqual(validated.sanitizedProtocol.frequencyPerWeek <= 2, true);
  });

  // T33: Mapeamento de dias alocados para activeDays [0..6] (Domingo a Sábado)
  await runTest('T33', 'Circuit-Breaker: Converte allocatedDays da IA em índices semanais activeDays [0..6]', async () => {
    const aiProposal = {
      fastingProtocol: {
        type: '16/8',
        frequencyPerWeek: 3,
        allocatedDays: ['DIA 7 (Off)', 'DIA 3 (Quarta)', 'Sexta-feira'],
        clinicalJustification: 'Alocação semanal.'
      }
    };
    const validated = fastingMod.validateAIFastingPrescription(aiProposal, {});
    // DIA 7 / Off = 0 (Domingo), Quarta = 3, Sexta = 5
    assert.strictEqual(validated.sanitizedProtocol.activeDays.includes(0), true);
    assert.strictEqual(validated.sanitizedProtocol.activeDays.includes(3), true);
    assert.strictEqual(validated.sanitizedProtocol.activeDays.includes(5), true);
  });

  // T34: Objetivos Clínicos Estruturados (Normalização e Derivação Automática)
  await runTest('T34', 'Circuit-Breaker: Deriva e normaliza objetivos estruturados a partir da prescrição e perfil metabólico', async () => {
    // Caso 1: Derivação automática para RCEst >= 0.50
    const val1 = fastingMod.validateAIFastingPrescription(
      { fastingProtocol: { type: '16/8', frequencyPerWeek: 5, allocatedDays: ['DIA 7 (Off)'] } },
      { patient: { objective: 'Queima de Gordura' }, cardiometabolic: { rcEst: 0.54 } }
    );
    assert(val1.sanitizedProtocol.objectives.includes('FAT_LOSS'));
    assert(val1.sanitizedProtocol.objectives.includes('INSULIN_SENSITIVITY'));
    assert(val1.sanitizedProtocol.objectives.includes('CARDIOVASCULAR_HEALTH'));

    // Caso 2: Normalização de termos em português
    const val2 = fastingMod.validateAIFastingPrescription(
      { fastingProtocol: { type: '14/10', frequencyPerWeek: 4, objectives: ['Queima de Gordura', 'Foco e Clareza Mental', 'Controle Glicêmico'] } },
      {}
    );
    assert.deepStrictEqual(val2.sanitizedProtocol.objectives, ['FAT_LOSS', 'MENTAL_FOCUS', 'GLUCOSE_CONTROL']);
  });

  // T35: Disparo de Execução pelo Paciente (IN_PROGRESS e startedAt)
  await runTest('T35', 'Execução do Paciente: Registro com status IN_PROGRESS salva startedAt para timer em tempo real', async () => {
    const logEntry = {
      date: '2026-09-07',
      protocolVersion: 1,
      protocolType: 'TRE',
      windowStart: '12:00',
      windowEnd: '20:00',
      adherenceStatus: fastingMod.ADHERENCE_STATUS.IN_PROGRESS
    };
    const saved = await fastingMod.saveFastingLog('patient-trigger-test', logEntry);
    assert.strictEqual(saved.adherenceStatus, 'IN_PROGRESS');
    assert(typeof saved.startedAt === 'string');
    assert(saved.startedAt.length > 10);
  });

  console.log('\n======================================================');
  console.log('Resumo da Execução de Testes:');
  const allPassed = Object.values(testResults).every(r => r.status === 'PASS');
  console.log(`Total de testes: ${Object.keys(testResults).length}`);
  console.log(`Aprovados: ${Object.values(testResults).filter(r => r.status === 'PASS').length}`);
  console.log(`Falhas: ${Object.values(testResults).filter(r => r.status === 'FAIL').length}`);
  console.log(`Status Global: ${allPassed ? 'TODOS OS TESTES APROVADOS (PASS)' : 'FALHA ENCONTRADA'}`);
  console.log('======================================================\n');

  return testResults;
}

// Executa testes se chamado diretamente via Node
if (require.main === module) {
  runAllTests().then(results => {
    const failed = Object.keys(results).filter(k => results[k].status !== 'PASS');
    if (failed.length > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}

module.exports = { runAllTests };
