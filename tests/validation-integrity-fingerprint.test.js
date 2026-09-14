/**
 * tests/validation-integrity-fingerprint.test.js
 * 
 * Suíte de Testes de Integridade da Validação e Content Fingerprint — Fase N3.7.
 * NutriAx Pro.
 * 
 * Cobertura Completa dos 26 Cenários Obrigatórios de Homologação:
 * 
 * [Fingerprint]
 *  1. Mesmos itens -> mesmo fingerprint
 *  2. Ordem determinística (ordem dos itens diferente -> mesmo fingerprint)
 *  3. Alteração de quantidade -> fingerprint diferente
 *  4. Alteração de foodId -> fingerprint diferente
 *  5. Alteração de mealId/mealName -> fingerprint diferente
 *  6. Alteração de horário -> fingerprint diferente
 *  7. Alteração de unidade -> fingerprint diferente
 *  8. Campos irrelevantes não alteram fingerprint
 * 
 * [Integridade da Validação]
 *  9. PASS + fingerprint correto -> elegível
 * 10. PASS + fingerprint divergente -> bloqueado
 * 11. isClinicallyValidated=true sem fingerprint -> bloqueado
 * 12. isClinicallyValidated=true + fingerprint falso -> bloqueado
 * 13. validationStatus=PASS + conteúdo adulterado -> bloqueado
 * 14. N3.6 BLOCKED + fingerprint correto -> bloqueado
 * 
 * [Invalidação após Edição]
 * 15. Dieta aprovada -> editar quantidade -> inválida e stale
 * 16. Dieta aprovada -> alterar horário -> inválida e stale
 * 17. Dieta aprovada -> adicionar alimento -> inválida e stale
 * 18. Dieta aprovada -> remover alimento -> inválida e stale
 * 
 * [Firewall de Importação Externa (Cloud / Drive / Backup)]
 * 19. Cloud contendo flags falsas de aprovação -> não confiar
 * 20. Drive contendo flags falsas de aprovação -> não confiar
 * 21. Backup contendo flags falsas de aprovação -> não confiar
 * 22. Importação externa exige revalidação canônica e nova assinatura clínica
 * 
 * [Patient App Publication Firewall]
 * 23. Prescrição aprovada e íntegra -> publica com refeições e macroTotals
 * 24. Prescrição com conteúdo adulterado -> meals=null, macroTotals=null, status=PENDING_CLINICAL_VALIDATION
 * 25. Prescrição stale -> meals=null, macroTotals=null
 * 26. Prescrição sem N3.6 -> meals=null, macroTotals=null
 */

'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const {
  computePrescriptionContentFingerprint,
  adaptPrescriptionPipelineOutput
} = require('../domain/adapters/prescriptionOutputAdapter');

// Carrega app.js no sandbox com mocks de DOM e Dexie
function createRuntimeSandbox() {
  const appJsCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  const mockDbStorage = {
    patients: new Map(),
    prescriptions: new Map(),
    clinicalExams: new Map(),
    assessments: new Map(),
    dietaryRecall: new Map(),
    dailyLogs: new Map(),
    performanceMetabolica: new Map()
  };

  function createTableMock(tableName) {
    const store = mockDbStorage[tableName];
    return {
      get: async (id) => store.get(id) || null,
      put: async (item) => {
        const id = item.id || item.patientId;
        store.set(id, { ...item });
        return id;
      },
      delete: async (id) => {
        store.delete(id);
      },
      toArray: async () => Array.from(store.values()),
      where: (field) => ({
        equals: (val) => ({
          delete: async () => {
            for (const [k, v] of store.entries()) {
              if (v[field] === val) store.delete(k);
            }
          },
          first: async () => {
            for (const v of store.values()) {
              if (v[field] === val) return v;
            }
            return null;
          },
          toArray: async () => {
            const res = [];
            for (const v of store.values()) {
              if (v[field] === val) res.push(v);
            }
            return res;
          }
        })
      }),
      bulkPut: async (items) => {
        for (const it of items) {
          const id = it.id || it.patientId;
          store.set(id, { ...it });
        }
      }
    };
  }

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
        style: {},
        setAttribute: () => {},
        getAttribute: () => null,
        getContext: () => ({ fillRect: () => {}, clearRect: () => {}, drawImage: () => {}, measureText: () => ({ width: 0 }) }),
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
      patients: createTableMock('patients'),
      prescriptions: createTableMock('prescriptions'),
      clinicalExams: createTableMock('clinicalExams'),
      assessments: createTableMock('assessments'),
      dietaryRecall: createTableMock('dietaryRecall'),
      dailyLogs: createTableMock('dailyLogs'),
      performanceMetabolica: createTableMock('performanceMetabolica'),
      foods: {
        get: async (id) => ({
          id,
          name: 'Alimento Teste',
          calories: 100,
          protein: 10,
          carbohydrate: 10,
          lipid: 2,
          fiber: 1,
          sodium: 10
        })
      }
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

  return { sandbox, mockDb: sandbox.db };
}

describe('N3.7 — Auditoria e Testes de Integridade da Validação e Content Fingerprint', () => {

  const baseItems = [
    {
      id: 'm1_item_f1',
      foodId: 'FOOD_01',
      foodName: 'Peito de Frango',
      mealName: 'Almoço',
      mealTime: '12:30',
      quantity: 150,
      unit: 'g',
      calories: 238.5,
      protein: 48,
      carbohydrate: 0,
      lipid: 3.75
    },
    {
      id: 'm1_item_f2',
      foodId: 'FOOD_02',
      foodName: 'Arroz Branco',
      mealName: 'Almoço',
      mealTime: '12:30',
      quantity: 120,
      unit: 'g',
      calories: 153.6,
      protein: 3,
      carbohydrate: 33.72,
      lipid: 0.24
    }
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // GRUPO 1: FINGERPRINT DETERMINÍSTICO E CANÔNICO (Cenários 1–8)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Grupo 1: Content Fingerprint Determinístico', () => {

    test('1. Mesmos itens -> mesmo fingerprint idêntico', () => {
      const fp1 = computePrescriptionContentFingerprint(baseItems);
      const fp2 = computePrescriptionContentFingerprint([
        { ...baseItems[0] },
        { ...baseItems[1] }
      ]);
      assert.strictEqual(typeof fp1, 'string');
      assert.ok(fp1.startsWith('cfp_'));
      assert.strictEqual(fp1, fp2, 'Mesmo conteúdo deve gerar fingerprint idêntico');
    });

    test('2. Ordem determinística: ordem dos itens no array NÃO altera o fingerprint', () => {
      const fpDirect = computePrescriptionContentFingerprint([baseItems[0], baseItems[1]]);
      const fpInverted = computePrescriptionContentFingerprint([baseItems[1], baseItems[0]]);
      assert.strictEqual(fpDirect, fpInverted, 'Ordem dos itens deve ser canonicamente normalizada');
    });

    test('3. Alteração de quantidade -> fingerprint diferente', () => {
      const fpOriginal = computePrescriptionContentFingerprint(baseItems);
      const modifiedItems = [
        { ...baseItems[0], quantity: 180 }, // 150g -> 180g
        baseItems[1]
      ];
      const fpModified = computePrescriptionContentFingerprint(modifiedItems);
      assert.notStrictEqual(fpOriginal, fpModified, 'Mudança de quantidade deve alterar fingerprint');
    });

    test('4. Alteração de foodId -> fingerprint diferente', () => {
      const fpOriginal = computePrescriptionContentFingerprint(baseItems);
      const modifiedItems = [
        { ...baseItems[0], foodId: 'FOOD_99_PATINHO' },
        baseItems[1]
      ];
      const fpModified = computePrescriptionContentFingerprint(modifiedItems);
      assert.notStrictEqual(fpOriginal, fpModified, 'Mudança de foodId deve alterar fingerprint');
    });

    test('5. Alteração de mealId/mealName -> fingerprint diferente', () => {
      const fpOriginal = computePrescriptionContentFingerprint(baseItems);
      const modifiedItems = [
        { ...baseItems[0], mealName: 'Jantar' },
        baseItems[1]
      ];
      const fpModified = computePrescriptionContentFingerprint(modifiedItems);
      assert.notStrictEqual(fpOriginal, fpModified, 'Mudança de refeição deve alterar fingerprint');
    });

    test('6. Alteração de horário (mealTime) -> fingerprint diferente', () => {
      const fpOriginal = computePrescriptionContentFingerprint(baseItems);
      const modifiedItems = [
        { ...baseItems[0], mealTime: '13:00' }, // 12:30 -> 13:00
        baseItems[1]
      ];
      const fpModified = computePrescriptionContentFingerprint(modifiedItems);
      assert.notStrictEqual(fpOriginal, fpModified, 'Mudança de horário de refeição deve alterar fingerprint');
    });

    test('7. Alteração de unidade -> fingerprint diferente', () => {
      const fpOriginal = computePrescriptionContentFingerprint(baseItems);
      const modifiedItems = [
        { ...baseItems[0], unit: 'ml' }, // g -> ml
        baseItems[1]
      ];
      const fpModified = computePrescriptionContentFingerprint(modifiedItems);
      assert.notStrictEqual(fpOriginal, fpModified, 'Mudança de unidade deve alterar fingerprint');
    });

    test('8. Campos irrelevantes (ex: flags de UI, timestamps, índices) NÃO causam divergência', () => {
      const fpOriginal = computePrescriptionContentFingerprint(baseItems);
      const itemsWithExtraUiFields = baseItems.map((it, idx) => ({
        ...it,
        _uiKey: `temp_${idx}`,
        isExpanded: true,
        hoverState: false,
        lastRenderedMs: 123456789
      }));
      const fpExtra = computePrescriptionContentFingerprint(itemsWithExtraUiFields);
      assert.strictEqual(fpOriginal, fpExtra, 'Metadados voláteis de UI não devem alterar o fingerprint clínico');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GRUPO 2: INTEGRIDADE DA VALIDAÇÃO E PUBLICATION FIREWALL (Cenários 9–14)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Grupo 2: Integridade da Validação (Publication Firewall)', () => {

    test('9. PASS + fingerprint correto -> elegível para publicação', () => {
      const { sandbox } = createRuntimeSandbox();
      const fp = sandbox.computePrescriptionContentFingerprint(baseItems);
      const meta = {
        isClinicallyValidated: true,
        isStale: false,
        validationStatus: 'PASS',
        validatedContentFingerprint: fp
      };
      assert.strictEqual(sandbox.isPrescriptionEligibleForPatientPublication(baseItems, meta), true);
    });

    test('10. PASS + fingerprint divergente -> BLOQUEADO para publicação', () => {
      const { sandbox } = createRuntimeSandbox();
      const meta = {
        isClinicallyValidated: true,
        isStale: false,
        validationStatus: 'PASS',
        validatedContentFingerprint: 'cfp_divergent_0000000000000000'
      };
      assert.strictEqual(sandbox.isPrescriptionEligibleForPatientPublication(baseItems, meta), false);
    });

    test('11. isClinicallyValidated=true SEM fingerprint -> BLOQUEADO para publicação', () => {
      const { sandbox } = createRuntimeSandbox();
      const meta = {
        isClinicallyValidated: true,
        isStale: false,
        validationStatus: 'PASS',
        validatedContentFingerprint: null
      };
      assert.strictEqual(sandbox.isPrescriptionEligibleForPatientPublication(baseItems, meta), false);
    });

    test('12. isClinicallyValidated=true + fingerprint falso / não-string -> BLOQUEADO', () => {
      const { sandbox } = createRuntimeSandbox();
      const meta = {
        isClinicallyValidated: true,
        isStale: false,
        validationStatus: 'PASS',
        validatedContentFingerprint: 12345
      };
      assert.strictEqual(sandbox.isPrescriptionEligibleForPatientPublication(baseItems, meta), false);
    });

    test('13. validationStatus=PASS + conteúdo adulterado (alimento alterado após validação) -> BLOQUEADO', () => {
      const { sandbox } = createRuntimeSandbox();
      const fpOriginal = sandbox.computePrescriptionContentFingerprint(baseItems);
      const meta = {
        isClinicallyValidated: true,
        isStale: false,
        validationStatus: 'PASS',
        validatedContentFingerprint: fpOriginal
      };
      // Conteúdo adulterado
      const tamperedItems = [
        { ...baseItems[0], quantity: 300 },
        baseItems[1]
      ];
      assert.strictEqual(sandbox.isPrescriptionEligibleForPatientPublication(tamperedItems, meta), false);
    });

    test('14. N3.6 BLOCKED + fingerprint correto -> BLOQUEADO (N3.6 status é soberano)', () => {
      const { sandbox } = createRuntimeSandbox();
      const fp = sandbox.computePrescriptionContentFingerprint(baseItems);
      const meta = {
        isClinicallyValidated: true, // tentativa de bypass com flag true
        isStale: false,
        validationStatus: 'BLOCKED',
        validationReport: { status: 'BLOCKED' },
        validatedContentFingerprint: fp
      };
      assert.strictEqual(sandbox.isPrescriptionEligibleForPatientPublication(baseItems, meta), false,
        'Prescrição BLOCKED jamais pode ser elegível para o paciente');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GRUPO 3: INVALIDAÇÃO AUTOMÁTICA APÓS EDIÇÃO (Cenários 15–18)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Grupo 3: Invalidação Automática após Edição Clínica', () => {

    test('15. Dieta aprovada -> editar quantidade -> isClinicallyValidated = false e isStale = true', async () => {
      const { sandbox } = createRuntimeSandbox();
      sandbox.activePatientId = 'patient_edit_qty';
      sandbox.currentPrescriptionItems = [
        { id: 'item_01', foodId: 'FOOD_01', foodName: 'Frango', quantity: 150, mealName: 'Almoço', mealTime: '12:00', unit: 'g' }
      ];
      const validFp = sandbox.computePrescriptionContentFingerprint(sandbox.currentPrescriptionItems);
      sandbox.currentPrescriptionMeta = {
        isAIGenerated: true,
        isClinicallyValidated: true,
        isStale: false,
        validationStatus: 'PASS',
        validatedContentFingerprint: validFp
      };
      await sandbox.savePrescriptionWithFirewall('patient_edit_qty', sandbox.currentPrescriptionItems, sandbox.currentPrescriptionMeta);

      // Simula edição pelo modal de edição de alimento
      sandbox.document.getElementById('editPrescItemId').value = 'item_01';
      sandbox.document.getElementById('editPrescQty').value = '200'; // 150g -> 200g
      sandbox.document.getElementById('editPrescUnit').value = 'g';
      sandbox.document.getElementById('editPrescMeal').value = 'Almoço';
      sandbox.document.getElementById('editPrescTime').value = '12:00';

      await sandbox.saveEditPrescriptionItem();

      assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, false, 'Edição de quantidade deve invalidar aprovação');
      assert.strictEqual(sandbox.currentPrescriptionMeta.isStale, true);
      assert.strictEqual(sandbox.currentPrescriptionMeta.staleReason, 'MANUAL_ITEM_EDITED');
    });

    test('16. Dieta aprovada -> alterar horário -> isClinicallyValidated = false e isStale = true', async () => {
      const { sandbox } = createRuntimeSandbox();
      sandbox.activePatientId = 'patient_edit_time';
      sandbox.currentPrescriptionItems = [
        { id: 'item_01', foodId: 'FOOD_01', foodName: 'Frango', quantity: 150, mealName: 'Almoço', mealTime: '12:00', unit: 'g' }
      ];
      const validFp = sandbox.computePrescriptionContentFingerprint(sandbox.currentPrescriptionItems);
      sandbox.currentPrescriptionMeta = {
        isAIGenerated: true,
        isClinicallyValidated: true,
        isStale: false,
        validationStatus: 'PASS',
        validatedContentFingerprint: validFp
      };
      await sandbox.savePrescriptionWithFirewall('patient_edit_time', sandbox.currentPrescriptionItems, sandbox.currentPrescriptionMeta);

      sandbox.document.getElementById('editPrescItemId').value = 'item_01';
      sandbox.document.getElementById('editPrescQty').value = '150';
      sandbox.document.getElementById('editPrescUnit').value = 'g';
      sandbox.document.getElementById('editPrescMeal').value = 'Almoço';
      sandbox.document.getElementById('editPrescTime').value = '13:30'; // 12:00 -> 13:30

      await sandbox.saveEditPrescriptionItem();

      assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, false, 'Alteração de horário deve invalidar aprovação');
      assert.strictEqual(sandbox.currentPrescriptionMeta.isStale, true);
      assert.strictEqual(sandbox.currentPrescriptionMeta.staleReason, 'MANUAL_ITEM_EDITED');
    });

    test('17. Dieta aprovada -> adicionar alimento -> isClinicallyValidated = false e isStale = true', async () => {
      const { sandbox } = createRuntimeSandbox();
      sandbox.activePatientId = 'patient_add_food';
      sandbox.currentPrescriptionItems = [
        { id: 'item_01', foodId: 'FOOD_01', foodName: 'Frango', quantity: 150, mealName: 'Almoço', mealTime: '12:00', unit: 'g' }
      ];
      const validFp = sandbox.computePrescriptionContentFingerprint(sandbox.currentPrescriptionItems);
      sandbox.currentPrescriptionMeta = {
        isAIGenerated: true,
        isClinicallyValidated: true,
        isStale: false,
        validationStatus: 'PASS',
        validatedContentFingerprint: validFp
      };
      await sandbox.savePrescriptionWithFirewall('patient_add_food', sandbox.currentPrescriptionItems, sandbox.currentPrescriptionMeta);

      // Adiciona novo alimento
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

      assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, false, 'Adição de alimento deve invalidar aprovação');
      assert.strictEqual(sandbox.currentPrescriptionMeta.isStale, true);
      assert.strictEqual(sandbox.currentPrescriptionMeta.staleReason, 'MANUAL_ITEM_ADDED');
    });

    test('18. Dieta aprovada -> remover alimento -> isClinicallyValidated = false e isStale = true', async () => {
      const { sandbox } = createRuntimeSandbox();
      sandbox.activePatientId = 'patient_remove_food';
      sandbox.currentPrescriptionItems = [
        { id: 'item_01', foodId: 'FOOD_01', foodName: 'Frango', quantity: 150, mealName: 'Almoço', mealTime: '12:00', unit: 'g' },
        { id: 'item_02', foodId: 'FOOD_02', foodName: 'Arroz', quantity: 100, mealName: 'Almoço', mealTime: '12:00', unit: 'g' }
      ];
      const validFp = sandbox.computePrescriptionContentFingerprint(sandbox.currentPrescriptionItems);
      sandbox.currentPrescriptionMeta = {
        isAIGenerated: true,
        isClinicallyValidated: true,
        isStale: false,
        validationStatus: 'PASS',
        validatedContentFingerprint: validFp
      };
      await sandbox.savePrescriptionWithFirewall('patient_remove_food', sandbox.currentPrescriptionItems, sandbox.currentPrescriptionMeta);

      // Remove alimento
      sandbox.removePrescriptionItem('item_01');

      assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, false, 'Remoção de alimento deve invalidar aprovação');
      assert.strictEqual(sandbox.currentPrescriptionMeta.isStale, true);
      assert.strictEqual(sandbox.currentPrescriptionMeta.staleReason, 'MANUAL_ITEM_REMOVED');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GRUPO 4: FIREWALL DE IMPORTAÇÃO EXTERNA (Cenários 19–22)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Grupo 4: Firewall de Importação Externa (Cloud / Drive / Backup)', () => {

    test('19. Cloud contendo flags falsas de aprovação -> perde confiança clínica e marca stale', async () => {
      const { sandbox } = createRuntimeSandbox();

      // Mock da resposta do Drive API simulando dados do Cloud contendo aprovação fraudulenta
      sandbox._callDriveApi = async () => ({
        status: 'success',
        data: {
          patient: { id: 'patient_cloud_fake', name: 'Paciente Cloud Fake' },
          prescriptions: baseItems,
          prescriptionMeta: {
            isAIGenerated: true,
            isClinicallyValidated: true, // FLAG FRAUDULENTA
            isStale: false,
            validationStatus: 'PASS',
            validatedContentFingerprint: sandbox.computePrescriptionContentFingerprint(baseItems)
          }
        }
      });

      await sandbox.loadPatientFromCloud('patient_cloud_fake');

      assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, false,
        'Importação Cloud NUNCA pode herdar isClinicallyValidated=true');
      assert.strictEqual(sandbox.currentPrescriptionMeta.isStale, true);
      assert.strictEqual(sandbox.currentPrescriptionMeta.staleReason, 'EXTERNAL_IMPORT_REQUIRES_REVALIDATION');
    });

    test('20. Drive contendo flags falsas de aprovação -> perde confiança clínica e marca stale', async () => {
      const { sandbox } = createRuntimeSandbox();

      sandbox._callDriveApi = async () => ({
        status: 'success',
        data: {
          patient: { id: 'patient_drive_fake', name: 'Paciente Drive Fake' },
          prescriptions: baseItems,
          prescriptionMeta: {
            isAIGenerated: true,
            isClinicallyValidated: true, // FLAG FRAUDULENTA
            isStale: false,
            validationStatus: 'PASS',
            validatedContentFingerprint: sandbox.computePrescriptionContentFingerprint(baseItems)
          }
        }
      });

      await sandbox.loadPatientFromDriveByFileName('backup_drive.json', 'patient_drive_fake');

      assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, false,
        'Importação Drive NUNCA pode herdar isClinicallyValidated=true');
      assert.strictEqual(sandbox.currentPrescriptionMeta.isStale, true);
      assert.strictEqual(sandbox.currentPrescriptionMeta.staleReason, 'EXTERNAL_IMPORT_REQUIRES_REVALIDATION');
    });

    test('21. Backup externo contendo flags falsas de aprovação -> Dexie load rejeita e invalida', async () => {
      const { sandbox, mockDb } = createRuntimeSandbox();

      // Simula injeção direta no IndexedDB (ex: restore de backup JSON não auditado com itens adulterados)
      const tamperedItems = [
        { ...baseItems[0], foodName: 'Alimento Injetado por Backup Não Auditado', quantity: 999 }
      ];
      await mockDb.prescriptions.put({
        id: 'patient_backup_restore',
        patientId: 'patient_backup_restore',
        items: tamperedItems,
        meta: {
          isAIGenerated: true,
          isClinicallyValidated: true,
          isStale: false,
          validationStatus: 'PASS',
          validatedContentFingerprint: 'cfp_stale_fingerprint_from_old_file'
        }
      });

      await sandbox.loadPrescriptionForPatient('patient_backup_restore');

      assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, false,
        'Restore com fingerprint adulterado deve ser invalidado no carregamento');
      assert.strictEqual(sandbox.currentPrescriptionMeta.isStale, true);
      assert.strictEqual(sandbox.currentPrescriptionMeta.staleReason, 'FINGERPRINT_TAMPERED_OR_MISSING');
    });

    test('22. Importação externa bloqueia publicação até revalidação canônica e assinatura clínica legítima', async () => {
      const { sandbox } = createRuntimeSandbox();

      sandbox._callDriveApi = async () => ({
        status: 'success',
        data: {
          patient: { id: 'patient_import_flow', name: 'Paciente Fluxo' },
          prescriptions: baseItems,
          prescriptionMeta: {
            isAIGenerated: true,
            isClinicallyValidated: true,
            isStale: false,
            validationStatus: 'PASS'
          }
        }
      });

      await sandbox.loadPatientFromCloud('patient_import_flow');

      // 1. Logo após importar: publicação bloqueada
      let payload = sandbox.syncActivePatientToPatientApp('patient_import_flow');
      assert.strictEqual(payload.meals, null, 'Importação recém-feita deve estar bloqueada para publicação');
      assert.strictEqual(payload.dietPlanStatus, 'PENDING_CLINICAL_VALIDATION');

      // 2. Tentar aprovar sem fingerprint legítimo N3.6 -> Falha
      await sandbox.approveAIPrescription();
      assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, false,
        'Não pode aprovar sem fingerprint N3.6 legítimo');

      // 3. Simula validação canônica legítima pelo motor N3.7
      const validFingerprint = sandbox.computePrescriptionContentFingerprint(sandbox.currentPrescriptionItems);
      sandbox.currentPrescriptionMeta = {
        isAIGenerated: true,
        isClinicallyValidated: false,
        isStale: false,
        staleReason: null,
        validationStatus: 'PASS',
        validationReport: { status: 'PASS', valid: true, validatedContentFingerprint: validFingerprint },
        validatedContentFingerprint: validFingerprint
      };
      await sandbox.savePrescriptionWithFirewall('patient_import_flow', sandbox.currentPrescriptionItems, sandbox.currentPrescriptionMeta);

      // 4. Agora sim: aprovação clínica legítima tem sucesso
      await sandbox.approveAIPrescription();
      assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, true);

      // 5. Publicação no Patient App agora é autorizada
      payload = sandbox.syncActivePatientToPatientApp('patient_import_flow');
      assert.ok(Array.isArray(payload.meals) && payload.meals.length > 0, 'Após validação e assinatura legítima, publica');
      assert.strictEqual(payload.dietPlanStatus, 'VALIDATED_CANONICAL');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GRUPO 5: PATIENT APP PUBLICATION FIREWALL INTEGRADO (Cenários 23–26)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Grupo 5: Patient App Publication Firewall Integrado', () => {

    test('23. Prescrição aprovada e íntegra -> publica com meals e macroTotals completos', async () => {
      const { sandbox } = createRuntimeSandbox();
      sandbox.activePatientId = 'p_pub_ok';
      sandbox.currentPrescriptionItems = baseItems;
      const validFp = sandbox.computePrescriptionContentFingerprint(baseItems);
      sandbox.currentPrescriptionMeta = {
        isAIGenerated: true,
        isClinicallyValidated: true,
        isStale: false,
        validationStatus: 'PASS',
        validatedContentFingerprint: validFp
      };
      await sandbox.savePrescriptionWithFirewall('p_pub_ok', baseItems, sandbox.currentPrescriptionMeta);

      const payload = sandbox.syncActivePatientToPatientApp('p_pub_ok');
      assert.strictEqual(payload.dietPlanStatus, 'VALIDATED_CANONICAL');
      assert.ok(Array.isArray(payload.meals) && payload.meals.length > 0);
      assert.ok(payload.macroTotals !== null && typeof payload.macroTotals === 'object');
      assert.ok(payload.macroTotals.kcal > 0);
      assert.ok(payload.macroTotals.prot > 0);
    });

    test('24. Prescrição com conteúdo adulterado -> meals=null, macroTotals=null, status=PENDING_CLINICAL_VALIDATION', async () => {
      const { sandbox } = createRuntimeSandbox();
      sandbox.activePatientId = 'p_pub_tampered';
      // Fingerprint gerado para baseItems
      const originalFp = sandbox.computePrescriptionContentFingerprint(baseItems);
      // Mas os itens em memória foram alterados sem nova validação N3.6
      sandbox.currentPrescriptionItems = [
        { ...baseItems[0], quantity: 999 },
        baseItems[1]
      ];
      sandbox.currentPrescriptionMeta = {
        isAIGenerated: true,
        isClinicallyValidated: true, // Alega validado
        isStale: false,              // Alega não-stale
        validationStatus: 'PASS',    // Alega PASS
        validatedContentFingerprint: originalFp // Mas fingerprint não bate com os itens atuais
      };
      await sandbox.savePrescriptionWithFirewall('p_pub_tampered', sandbox.currentPrescriptionItems, sandbox.currentPrescriptionMeta);

      const payload = sandbox.syncActivePatientToPatientApp('p_pub_tampered');
      assert.strictEqual(payload.meals, null, 'Prescrição adulterada NÃO pode entregar refeições ao paciente');
      assert.strictEqual(payload.macroTotals, null, 'Prescrição adulterada NÃO pode entregar totais ao paciente');
      assert.strictEqual(payload.dietPlanStatus, 'PENDING_CLINICAL_VALIDATION');
    });

    test('25. Prescrição stale -> meals=null, macroTotals=null, status=PENDING_CLINICAL_VALIDATION', async () => {
      const { sandbox } = createRuntimeSandbox();
      sandbox.activePatientId = 'p_pub_stale';
      sandbox.currentPrescriptionItems = baseItems;
      const validFp = sandbox.computePrescriptionContentFingerprint(baseItems);
      sandbox.currentPrescriptionMeta = {
        isAIGenerated: true,
        isClinicallyValidated: true,
        isStale: true, // MARCADA STALE
        staleReason: 'MANUAL_ITEM_ADDED',
        validationStatus: 'PASS',
        validatedContentFingerprint: validFp
      };
      await sandbox.savePrescriptionWithFirewall('p_pub_stale', baseItems, sandbox.currentPrescriptionMeta);

      const payload = sandbox.syncActivePatientToPatientApp('p_pub_stale');
      assert.strictEqual(payload.meals, null);
      assert.strictEqual(payload.macroTotals, null);
      assert.strictEqual(payload.dietPlanStatus, 'PENDING_CLINICAL_VALIDATION');
    });

    test('26. Prescrição sem N3.6 (status ausente ou BLOCKED) -> meals=null, macroTotals=null', async () => {
      const { sandbox } = createRuntimeSandbox();
      sandbox.activePatientId = 'p_pub_blocked';
      sandbox.currentPrescriptionItems = baseItems;
      const validFp = sandbox.computePrescriptionContentFingerprint(baseItems);
      sandbox.currentPrescriptionMeta = {
        isAIGenerated: true,
        isClinicallyValidated: true, // Tentativa de forjar
        isStale: false,
        validationStatus: 'BLOCKED', // N3.6 BLOQUEADO
        validationReport: { status: 'BLOCKED', valid: false },
        validatedContentFingerprint: validFp
      };
      await sandbox.savePrescriptionWithFirewall('p_pub_blocked', baseItems, sandbox.currentPrescriptionMeta);

      const payload = sandbox.syncActivePatientToPatientApp('p_pub_blocked');
      assert.strictEqual(payload.meals, null, 'Status BLOCKED jamais publica refeições');
      assert.strictEqual(payload.macroTotals, null);
    });
  });
});
