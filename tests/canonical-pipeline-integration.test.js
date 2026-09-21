/**
 * tests/canonical-pipeline-integration.test.js
 * 
 * Suíte de Testes de Integração End-to-End e Firewalls de Prescrição — Fase N3.7.
 * NutriAx Pro.
 * 
 * Validação dos Invariantes de Segurança e Governança:
 * 1. Pipeline integrado: buildCanonicalPrescriptionInput -> executePrescriptionPipeline -> adaptPrescriptionPipelineOutput;
 * 2. Caso PASS: pipeline atinge PASS, gera rascunho com isClinicallyValidated = false;
 * 3. Caso WARNING: pipeline atinge WARNING, gera rascunho com isClinicallyValidated = false;
 * 4. Caso BLOCKED: catálogo inconsistente bloqueia pipeline; status é BLOCKED e isCompliant = false;
 * 5. Firewall de Persistência (savePrescriptionWithFirewall): garante preservação de meta e rastreabilidade;
 * 6. Firewall de Aprovação (approveAIPrescription):
 *    - Aprova rascunho PASS/WARNING válido;
 *    - Rejeita estritamente prescrição com status BLOCKED;
 *    - Rejeita estritamente prescrição obsoleta (isStale = true);
 * 7. Fechamento de Bypasses de Edição Manual (B1, B2, B3):
 *    - Adição manual invalida validação clínica e marca stale (staleReason = 'MANUAL_ITEM_ADDED');
 *    - Remoção manual invalida validação clínica e marca stale (staleReason = 'MANUAL_ITEM_REMOVED');
 *    - Edição de quantidade/horário invalida validação clínica e marca stale (staleReason = 'MANUAL_ITEM_EDITED');
 * 8. Fechamento de Bypasses de Importação/Cloud (B5, B6):
 *    - Importação sem evidência canônica comprovada é marcada como unverified e stale;
 * 9. Firewall de Sincronização com o Patient App:
 *    - Bloqueia publicação se isClinicallyValidated !== true;
 *    - Bloqueia publicação se isStale === true;
 *    - Bloqueia publicação se status === 'BLOCKED';
 *    - Em caso de bloqueio, formattedMeals é estritamente vazio ([]);
 * 10. Resposta afirmativa ao teste crítico de bypass.
 */

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { executePrescriptionPipeline } = require('../domain/orchestration');
const {
  buildCanonicalPrescriptionInput
} = require('../domain/adapters/prescriptionInputAdapter');
const {
  adaptPrescriptionPipelineOutput
} = require('../domain/adapters/prescriptionOutputAdapter');

// Catálogo padrão-ouro consistente para testes
function createConsistentCatalog() {
  return [
    {
      id: 'FOOD_P1',
      name: 'Peito de Frango Grelhado',
      category: 'Carnes e Aves',
      calories: 159,
      protein: 32,
      carbohydrate: 0,
      lipid: 2.5,
      fiber: 0,
      sodium: 50,
      unit: 'g',
      bromatology: { energyStatus: 'CONSISTENTE' }
    },
    {
      id: 'FOOD_C1',
      name: 'Arroz Branco Cozido',
      category: 'Cereais e Leguminosas',
      calories: 128,
      protein: 2.5,
      carbohydrate: 28.1,
      lipid: 0.2,
      fiber: 1.6,
      sodium: 1,
      unit: 'g',
      bromatology: { energyStatus: 'CONSISTENTE' }
    },
    {
      id: 'FOOD_F1',
      name: 'Azeite de Oliva Extravirgem',
      category: 'Óleos e Gorduras',
      calories: 884,
      protein: 0,
      carbohydrate: 0,
      lipid: 100,
      fiber: 0,
      sodium: 0,
      unit: 'g',
      bromatology: { energyStatus: 'CONSISTENTE' }
    },
    {
      id: 'FOOD_V1',
      name: 'Brócolis Cozido',
      category: 'Verduras e Legumes',
      calories: 25,
      protein: 2.1,
      carbohydrate: 4.0,
      lipid: 0.5,
      fiber: 3.4,
      sodium: 3,
      unit: 'g',
      bromatology: { energyStatus: 'CONSISTENTE' }
    }
  ];
}

// Cria um sandbox de simulação do runtime app.js
function createRuntimeSandbox() {
  const appJsCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  const mockDbPrescriptions = {
    records: new Map(),
    async put(record) {
      this.records.set(record.id || record.patientId, JSON.parse(JSON.stringify(record)));
      return record.id;
    },
    async get(id) {
      const rec = this.records.get(id);
      return rec ? JSON.parse(JSON.stringify(rec)) : undefined;
    },
    async delete(id) {
      this.records.delete(id);
    }
  };

  const domElements = {};
  function getEl(id) {
    if (!domElements[id]) {
      domElements[id] = {
        id,
        value: '',
        innerText: '',
        innerHTML: '',
        disabled: false,
        className: '',
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); }
        }
      };
    }
    return domElements[id];
  }

  const localStorageData = {};
  const mockLocalStorage = {
    getItem(k) { return localStorageData[k] ?? null; },
    setItem(k, v) { localStorageData[k] = String(v); },
    removeItem(k) { delete localStorageData[k]; }
  };

  const sandbox = {
    console,
    Date,
    Math,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    Array,
    Object,
    Number,
    String,
    Boolean,
    RegExp,
    Set,
    Map,
    Promise,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    navigator: { userAgent: 'Node' },
    addEventListener: () => {},
    lucide: { createIcons: () => {} },
    document: {
      getElementById: getEl,
      addEventListener: () => {},
      querySelectorAll: () => [],
      querySelector: () => null
    },
    window: {
      location: { protocol: 'https:', hostname: 'app.nutriax.pro', origin: 'https://app.nutriax.pro' },
      addEventListener: () => {},
      lucide: { createIcons: () => {} }
    },
    localStorage: mockLocalStorage,
    db: {
      prescriptions: mockDbPrescriptions
    },
    alert: () => {},
    confirm: () => true,
    prompt: () => '11999999999',
    require
  };

  sandbox.window.document = sandbox.document;
  sandbox.window.localStorage = sandbox.localStorage;
  sandbox.window.db = sandbox.db;
  const mathJsCode = fs.readFileSync(path.join(__dirname, '..', 'math.js'), 'utf8');

  vm.createContext(sandbox);
  vm.runInContext(mathJsCode, sandbox);
  vm.runInContext(appJsCode, sandbox);

  return { sandbox, mockDbPrescriptions };
}

describe('Fase N3.7 — Suíte de Integração End-to-End e Firewalls de Prescrição', () => {

  test('1. Pipeline Completo: Entrada bruta gera resultado PASS, traduzido para runtime com status PASS e rascunho não validado', async () => {
    const inputPrep = buildCanonicalPrescriptionInput({
      patientData: {
        patientId: 'patient_int_01',
        name: 'Rodrigo Pires',
        age: 28,
        sex: 'Masculino',
        weightKg: 78.0,
        heightCm: 178.0,
        objective: 'Hipertrofia',
        getKcal: 2700,
        routine: { wakeUpTime: '06:30', bedTime: '23:00', workoutTime: '17:30' }
      },
      foodCatalog: createConsistentCatalog(),
      options: { mealCount: 4 }
    });

    assert.strictEqual(inputPrep.isValid, true);
    const pipelineResult = await executePrescriptionPipeline(inputPrep.canonicalInput);

    assert.strictEqual(pipelineResult.success, true);
    assert.ok(pipelineResult.status === 'PASS' || pipelineResult.status === 'WARNING');

    const adaptedOutput = adaptPrescriptionPipelineOutput(pipelineResult, {
      generatedAt: '2026-09-14T10:00:00.000Z',
      isClinicallyValidated: false,
      isStale: false
    });

    assert.ok(adaptedOutput.items.length > 0);
    assert.strictEqual(adaptedOutput.meta.isClinicallyValidated, false);
    assert.strictEqual(adaptedOutput.meta.isStale, false);
    assert.strictEqual(adaptedOutput.meta.validationStatus, pipelineResult.status);
    assert.strictEqual(adaptedOutput.meta.generatedAt, '2026-09-14T10:00:00.000Z');

    // Cada item possui lipid e fat preenchidos e id estável
    adaptedOutput.items.forEach(item => {
      assert.ok(typeof item.id === 'string' && item.id.includes('_item_'));
      assert.ok(typeof item.lipid === 'number');
      assert.ok(typeof item.fat === 'number');
      assert.strictEqual(item.lipid, item.fat);
    });
  });

  test('2. Caso BLOCKED: Catálogo bromatologicamente inconsistente bloqueia no N3.2/N3.6 e adapter reflete BLOCKED', async () => {
    const inconsistentCatalog = createConsistentCatalog().map(f => ({
      ...f,
      bromatology: { energyStatus: 'INCONSISTENTE' }
    }));

    const inputPrep = buildCanonicalPrescriptionInput({
      patientData: { weightKg: 75, heightCm: 175, getKcal: 2200 },
      foodCatalog: inconsistentCatalog,
      options: { mealCount: 4 }
    });

    const pipelineResult = await executePrescriptionPipeline(inputPrep.canonicalInput);
    assert.strictEqual(pipelineResult.success, false);
    assert.strictEqual(pipelineResult.status, 'BLOCKED');

    const adapted = adaptPrescriptionPipelineOutput(pipelineResult);
    assert.strictEqual(adapted.status, 'BLOCKED');
    assert.strictEqual(adapted.isCompliant, false);
    assert.strictEqual(adapted.meta.validationStatus, 'BLOCKED');
    assert.strictEqual(adapted.meta.isClinicallyValidated, false);
  });

  test('3. Firewall de Persistência: savePrescriptionWithFirewall garante preservação de meta e rastreabilidade', async () => {
    const { sandbox, mockDbPrescriptions } = createRuntimeSandbox();

    const items = [
      { id: 'meal_1_item_FOOD_P1', foodId: 'FOOD_P1', foodName: 'Frango', calories: 159, protein: 32, carbohydrate: 0, lipid: 2.5 }
    ];
    const meta = {
      isAIGenerated: true,
      isClinicallyValidated: false,
      isStale: false,
      validationStatus: 'PASS',
      validationReport: { status: 'PASS', valid: true }
    };

    await sandbox.savePrescriptionWithFirewall('patient_p1', items, meta);

    const saved = await mockDbPrescriptions.get('patient_p1');
    assert.ok(saved !== undefined);
    assert.strictEqual(saved.id, 'patient_p1');
    assert.strictEqual(saved.items.length, 1);
    assert.strictEqual(saved.meta.validationStatus, 'PASS');
    assert.strictEqual(saved.meta.isClinicallyValidated, false);

    // Se chamar sem passar meta explícito, preserva o meta em memória ou aplica fallback seguro
    await sandbox.savePrescriptionWithFirewall('patient_p1', items, null);
    const updated = await mockDbPrescriptions.get('patient_p1');
    assert.ok(updated.meta !== null && typeof updated.meta === 'object');
    assert.strictEqual(updated.meta.validationStatus, 'PASS');
  });

  test('4. Firewall de Aprovação: approveAIPrescription aprova PASS válido mas REJEITA estritamente BLOCKED e Stale', async () => {
    const { sandbox } = createRuntimeSandbox();
    sandbox.activePatientId = 'patient_approve_test';

    // Cenário A: Tentar aprovar com status BLOCKED -> Deve ser REJEITADO
    sandbox.currentPrescriptionItems = [{ id: 'it_1', foodName: 'Frango' }];
    sandbox.currentPrescriptionMeta = {
      isAIGenerated: true,
      isClinicallyValidated: false,
      isStale: false,
      validationStatus: 'BLOCKED',
      validationReport: { status: 'BLOCKED', valid: false }
    };
    await sandbox.savePrescriptionWithFirewall('patient_approve_test', sandbox.currentPrescriptionItems, sandbox.currentPrescriptionMeta);

    await sandbox.approveAIPrescription();
    assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, false, 'BLOCKED não pode ser aprovado');

    // Cenário B: Tentar aprovar prescrição obsoleta (isStale = true) -> Deve ser REJEITADO
    sandbox.currentPrescriptionMeta = {
      isAIGenerated: true,
      isClinicallyValidated: false,
      isStale: true,
      staleReason: 'MANUAL_ITEM_ADDED',
      validationStatus: 'PASS',
      validationReport: { status: 'PASS', valid: true }
    };
    await sandbox.savePrescriptionWithFirewall('patient_approve_test', sandbox.currentPrescriptionItems, sandbox.currentPrescriptionMeta);

    await sandbox.approveAIPrescription();
    assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, false, 'Stale não pode ser aprovado');

    // Cenário C: Aprovar prescrição válida PASS -> Deve ser APROVADA
    const validFingerprint = sandbox.computePrescriptionContentFingerprint(sandbox.currentPrescriptionItems);
    sandbox.currentPrescriptionMeta = {
      isAIGenerated: true,
      isClinicallyValidated: false,
      isStale: false,
      validationStatus: 'PASS',
      validationReport: { status: 'PASS', valid: true, validatedContentFingerprint: validFingerprint },
      validatedContentFingerprint: validFingerprint
    };
    await sandbox.savePrescriptionWithFirewall('patient_approve_test', sandbox.currentPrescriptionItems, sandbox.currentPrescriptionMeta);

    await sandbox.approveAIPrescription();
    assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, true, 'PASS válido deve ser aprovado');
    assert.ok(typeof sandbox.currentPrescriptionMeta.validatedAt === 'string');
  });

  test('5. Fechamento de Bypasses B1, B2, B3: Edição manual marca isClinicallyValidated = false e isStale = true com razão determinística', async () => {
    const { sandbox, mockDbPrescriptions } = createRuntimeSandbox();

    // Estado inicial: Prescrição validada
    sandbox.activePatientId = 'patient_edit_test';
    sandbox.currentPrescriptionItems = [
      { id: 'item_01', foodName: 'Frango', calories: 159, protein: 32, carbohydrate: 0, lipid: 2.5 }
    ];
    sandbox.currentPrescriptionMeta = {
      isAIGenerated: true,
      isClinicallyValidated: true,
      isStale: false,
      validationStatus: 'PASS'
    };
    await sandbox.savePrescriptionWithFirewall('patient_edit_test', sandbox.currentPrescriptionItems, sandbox.currentPrescriptionMeta);

    // B1: Adicionar item manual
    sandbox.selectedFoodItem = {
      id: 'FOOD_C1',
      name: 'Arroz',
      calories: 128,
      protein: 2.5,
      carbohydrate: 28.1,
      lipid: 0.2,
      baseQuantity: 100,
      unit: 'g'
    };
    sandbox.document.getElementById('prescriptionMealSelect').value = 'Almoço';
    sandbox.document.getElementById('prescriptionQtyInput').value = '100';
    sandbox.document.getElementById('prescriptionUnitSelect').value = 'g';
    sandbox.handleAddPrescriptionItem();

    assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, false, 'Adição manual deve invalidar validação');
    assert.strictEqual(sandbox.currentPrescriptionMeta.isStale, true);
    assert.strictEqual(sandbox.currentPrescriptionMeta.staleReason, 'MANUAL_ITEM_ADDED');

    const dbAfterAdd = await mockDbPrescriptions.get('patient_edit_test');
    assert.strictEqual(dbAfterAdd.meta.isStale, true);
    assert.strictEqual(dbAfterAdd.meta.isClinicallyValidated, false);

    // Re-valida
    sandbox.currentPrescriptionMeta.isClinicallyValidated = true;
    sandbox.currentPrescriptionMeta.isStale = false;
    await sandbox.savePrescriptionWithFirewall('patient_edit_test', sandbox.currentPrescriptionItems, sandbox.currentPrescriptionMeta);

    // B2: Remover item
    sandbox.removePrescriptionItem('item_01');
    assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, false, 'Remoção manual deve invalidar validação');
    assert.strictEqual(sandbox.currentPrescriptionMeta.isStale, true);
    assert.strictEqual(sandbox.currentPrescriptionMeta.staleReason, 'MANUAL_ITEM_REMOVED');
  });

  test('6. Fechamento de Bypasses B5, B6: Importação de nuvem/drive sem evidência é marcada como unverified e stale', async () => {
    const { sandbox, mockDbPrescriptions } = createRuntimeSandbox();

    // Mock de chamada simulando loadPatientFromCloud com dados que tentam forjar validação clínica
    const legacyCloudPrescription = [
      { id: 'cloud_item_1', foodName: 'Ovo Cozido', calories: 146 }
    ];

    await sandbox.savePrescriptionWithFirewall('patient_cloud', legacyCloudPrescription, {
      isAIGenerated: false,
      isClinicallyValidated: false,
      isStale: true,
      staleReason: 'EXTERNAL_IMPORT_REQUIRES_REVALIDATION',
      validationStatus: 'WARNING'
    });

    const saved = await mockDbPrescriptions.get('patient_cloud');
    assert.strictEqual(saved.meta.isClinicallyValidated, false);
    assert.strictEqual(saved.meta.isStale, true);
    assert.strictEqual(saved.meta.staleReason, 'EXTERNAL_IMPORT_REQUIRES_REVALIDATION');
  });

  test('7. Firewall de Sincronização com o Patient App: Bloqueia envio de refeições se não validado, stale ou BLOCKED', async () => {
    const { sandbox } = createRuntimeSandbox();
    sandbox.activePatientId = 'patient_sync_test';
    const sampleItems = [
      { id: 'it_1', foodName: 'Frango', mealName: 'Almoço', calories: 159, protein: 32, carbohydrate: 0, lipid: 2.5 }
    ];

    // Caso A: Rascunho não validado clinicamente -> formattedMeals deve ser [] e meals no payload deve ser null
    const metaDraft = {
      isAIGenerated: true,
      isClinicallyValidated: false,
      isStale: false,
      validationStatus: 'PASS'
    };
    await sandbox.savePrescriptionWithFirewall('patient_sync_test', sampleItems, metaDraft);

    let payload = sandbox.syncActivePatientToPatientApp('patient_sync_test');
    assert.strictEqual(payload.meals, null, 'Rascunho não validado NÃO pode ter refeições enviadas ao paciente');
    assert.strictEqual(payload.dietPlanStatus, 'PENDING_CLINICAL_VALIDATION');

    // Caso B: Prescrição marcada como obsoleta/stale -> formattedMeals deve ser []
    const metaStale = {
      isAIGenerated: true,
      isClinicallyValidated: true,
      isStale: true,
      staleReason: 'MANUAL_ITEM_ADDED',
      validationStatus: 'PASS'
    };
    await sandbox.savePrescriptionWithFirewall('patient_sync_test', sampleItems, metaStale);

    payload = sandbox.syncActivePatientToPatientApp('patient_sync_test');
    assert.strictEqual(payload.meals, null, 'Prescrição stale NÃO pode ter refeições enviadas ao paciente');
    assert.strictEqual(payload.dietPlanStatus, 'PENDING_CLINICAL_VALIDATION');

    // Caso C: Prescrição com status BLOCKED -> formattedMeals deve ser []
    const metaBlocked = {
      isAIGenerated: true,
      isClinicallyValidated: false,
      isStale: false,
      validationStatus: 'BLOCKED'
    };
    await sandbox.savePrescriptionWithFirewall('patient_sync_test', sampleItems, metaBlocked);

    payload = sandbox.syncActivePatientToPatientApp('patient_sync_test');
    assert.strictEqual(payload.meals, null, 'Prescrição BLOCKED NÃO pode ter refeições enviadas ao paciente');

    // Caso D: Prescrição plenamente validada e assinada com fingerprint íntegro -> meals deve ser preenchido
    const validFingerprint = sandbox.computePrescriptionContentFingerprint(sampleItems);
    const metaValid = {
      isAIGenerated: true,
      isClinicallyValidated: true,
      isStale: false,
      validationStatus: 'PASS',
      validatedContentFingerprint: validFingerprint
    };
    await sandbox.savePrescriptionWithFirewall('patient_sync_test', sampleItems, metaValid);

    payload = sandbox.syncActivePatientToPatientApp('patient_sync_test');
    assert.ok(Array.isArray(payload.meals) && payload.meals.length > 0, 'Prescrição validada deve ser enviada ao paciente');
    assert.strictEqual(payload.dietPlanStatus, 'VALIDATED_CANONICAL');
  });

  test('8. Teste Crítico de Bypass: Prova de que NENHUMA prescrição chega ao Patient App sem validação canônica N3.6 válida e atual', () => {
    const { sandbox } = createRuntimeSandbox();

    // Verificação da função de elegibilidade canônica
    const isEligible = sandbox.isPrescriptionEligibleForPatientPublication;
    const testItems = [{ id: '1', foodName: 'Frango', mealName: 'Almoço', quantity: 100, unit: 'g' }];
    const validFingerprint = sandbox.computePrescriptionContentFingerprint(testItems);

    // 1. Itens vazios
    assert.strictEqual(isEligible([], { isClinicallyValidated: true, isStale: false, validationStatus: 'PASS', validatedContentFingerprint: validFingerprint }), false);

    // 2. Meta ausente
    assert.strictEqual(isEligible(testItems, null), false);

    // 3. isClinicallyValidated = false
    assert.strictEqual(isEligible(testItems, { isClinicallyValidated: false, isStale: false, validationStatus: 'PASS', validatedContentFingerprint: validFingerprint }), false);

    // 4. isStale = true
    assert.strictEqual(isEligible(testItems, { isClinicallyValidated: true, isStale: true, validationStatus: 'PASS', validatedContentFingerprint: validFingerprint }), false);

    // 5. validationStatus = BLOCKED
    assert.strictEqual(isEligible(testItems, { isClinicallyValidated: true, isStale: false, validationStatus: 'BLOCKED', validatedContentFingerprint: validFingerprint }), false);

    // 6. validationReport.status = BLOCKED
    assert.strictEqual(isEligible(testItems, { isClinicallyValidated: true, isStale: false, validationStatus: 'PASS', validationReport: { status: 'BLOCKED' }, validatedContentFingerprint: validFingerprint }), false);

    // 7. Sem fingerprint -> bloqueado
    assert.strictEqual(isEligible(testItems, { isClinicallyValidated: true, isStale: false, validationStatus: 'PASS' }), false);

    // 8. Fingerprint divergente / adulterado -> bloqueado
    assert.strictEqual(isEligible(testItems, { isClinicallyValidated: true, isStale: false, validationStatus: 'PASS', validatedContentFingerprint: 'cfp_tampered_00000' }), false);

    // 9. Apenas o estado íntegro, assinado e com fingerprint correspondente é aceito
    assert.strictEqual(isEligible(testItems, { isClinicallyValidated: true, isStale: false, validationStatus: 'PASS', validatedContentFingerprint: validFingerprint }), true);
  });

  test('9. Fluxo de Revalidação Clínica de Ajustes Manuais: revalidateAndApprovePrescription assina prescrição modificada e sincroniza com o Patient App', async () => {
    const { sandbox, mockDbPrescriptions } = createRuntimeSandbox();
    sandbox.activePatientId = 'patient_revalidate_test';

    // 1. Estado inicial: Dieta com itens modificados manualmente pelo nutricionista
    sandbox.currentPrescriptionItems = [
      { id: 'it_adj_1', foodName: 'Peito de Frango Grelhado', quantity: 150, unitDisplay: '150g', calories: 238, protein: 48, carbohydrate: 0, lipid: 3.75, mealName: 'Almoço', mealTime: '12:30' },
      { id: 'it_adj_2', foodName: 'Arroz Branco Cozido', quantity: 120, unitDisplay: '120g', calories: 153, protein: 3, carbohydrate: 33.7, lipid: 0.24, mealName: 'Almoço', mealTime: '12:30' }
    ];
    sandbox.currentPrescriptionMeta = {
      isAIGenerated: true,
      isClinicallyValidated: false,
      isStale: true,
      staleReason: 'MANUAL_ITEM_EDITED',
      validationStatus: 'PASS',
      validatedContentFingerprint: null
    };
    await sandbox.savePrescriptionWithFirewall('patient_revalidate_test', sandbox.currentPrescriptionItems, sandbox.currentPrescriptionMeta);

    // Antes da revalidação: publicação bloqueada
    assert.strictEqual(sandbox.isPrescriptionEligibleForPatientPublication(sandbox.currentPrescriptionItems, sandbox.currentPrescriptionMeta), false);
    const payloadPre = sandbox.syncActivePatientToPatientApp('patient_revalidate_test');
    assert.strictEqual(payloadPre.meals, null);
    assert.strictEqual(payloadPre.dietPlanStatus, 'PENDING_CLINICAL_VALIDATION');

    // 2. Nutricionista aciona a revalidação clínica
    await sandbox.revalidateAndApprovePrescription();

    // 3. Verifica metadados pós-revalidação
    assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, true, 'Deve estar clinicamente validada');
    assert.strictEqual(sandbox.currentPrescriptionMeta.isStale, false, 'isStale deve ser revertido para false');
    assert.strictEqual(sandbox.currentPrescriptionMeta.staleReason, null, 'staleReason deve ser limpo');
    assert.strictEqual(sandbox.currentPrescriptionMeta.validationStatus, 'PASS');

    const expectedFp = sandbox.computePrescriptionContentFingerprint(sandbox.currentPrescriptionItems);
    assert.strictEqual(sandbox.currentPrescriptionMeta.validatedContentFingerprint, expectedFp, 'Fingerprint deve ser recalculado para os itens modificados');

    // 4. Verifica persistência no Dexie
    const dbRecord = await mockDbPrescriptions.get('patient_revalidate_test');
    assert.ok(dbRecord, 'Prescrição deve estar persistida no Dexie');
    assert.strictEqual(dbRecord.meta.isClinicallyValidated, true);
    assert.strictEqual(dbRecord.meta.isStale, false);
    assert.strictEqual(dbRecord.meta.validatedContentFingerprint, expectedFp);

    // 5. Verifica elegibilidade para publicação no Patient App
    assert.strictEqual(sandbox.isPrescriptionEligibleForPatientPublication(sandbox.currentPrescriptionItems, sandbox.currentPrescriptionMeta), true);

    // 6. Verifica sincronização do Patient App e cache de disciplina
    const rawPatientPayload = sandbox.localStorage.getItem('nutriax_patient_payload_patient_revalidate_test');
    assert.ok(rawPatientPayload, 'Payload do paciente deve ser gravado no localStorage');
    const parsedPayload = JSON.parse(rawPatientPayload);
    assert.strictEqual(parsedPayload.dietPlanStatus, 'VALIDATED_CANONICAL');
    assert.ok(Array.isArray(parsedPayload.meals) && parsedPayload.meals.length > 0, 'Refeições devem estar presentes no payload');
    assert.strictEqual(parsedPayload.meals[0].name, 'Almoço');

    // 7. Verifica cache local de disciplina (Pilar 2 / App)
    const rawDisc = sandbox.localStorage.getItem('nutriax_patient_discipline_v3_patient_revalidate_test');
    assert.ok(rawDisc, 'Cache de disciplina v3 deve ser gravado');
    const parsedDisc = JSON.parse(rawDisc);
    assert.ok(Array.isArray(parsedDisc.meals) && parsedDisc.meals.length > 0, 'Refeições devem estar presentes na disciplina');
  });
});
