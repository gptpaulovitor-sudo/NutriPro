/**
 * tests/nutritionist-panel-prescription-persistence.test.js
 * 
 * Suíte de testes de persistência e restauração contínua da prescrição no painel do nutricionista.
 * Valida a retenção da dieta prescrita, ajustada, validada e sincronizada.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const {
  computePrescriptionContentFingerprint
} = require('../domain/adapters/prescriptionOutputAdapter');

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
      createElement: (tag) => getEl(`dyn_${tag}_${Date.now()}`),
      body: { appendChild: () => {}, classList: { add: () => {}, remove: () => {} } },
      querySelectorAll: () => []
    },
    window: {
      addEventListener: () => {},
      location: { reload: () => {} }
    },
    localStorage: mockLocalStorage,
    db: {
      patients: createTableMock('patients'),
      prescriptions: createTableMock('prescriptions'),
      clinicalExams: createTableMock('clinicalExams'),
      assessments: createTableMock('assessments'),
      dietaryRecall: createTableMock('dietaryRecall'),
      dailyLogs: createTableMock('dailyLogs'),
      performanceMetabolica: createTableMock('performanceMetabolica')
    },
    alert: () => {},
    confirm: () => true
  };

  vm.createContext(sandbox);
  vm.runInContext(appJsCode, sandbox);

  return { sandbox, mockDbStorage, mockLocalStorage };
}

describe('Persistência e Retenção da Prescrição no Painel do Nutricionista', () => {

  test('1. savePrescriptionWithFirewall persiste em Dexie e no localStorage redundante', async () => {
    const { sandbox, mockDbStorage, mockLocalStorage } = createRuntimeSandbox();

    const patientId = 'joao-teste';
    const items = [
      {
        id: 'food_1',
        foodId: 'taco_1',
        foodName: 'Arroz branco cozido',
        mealName: 'Almoço',
        mealTime: '12:30',
        quantity: 150,
        unit: 'g',
        unitDisplay: '150g',
        calories: 192,
        protein: 3.75,
        carbohydrate: 42.15,
        lipid: 0.38,
        fiber: 2.4
      }
    ];
    const fp = computePrescriptionContentFingerprint(items);
    const meta = {
      isAIGenerated: true,
      isClinicallyValidated: true,
      isStale: false,
      staleReason: null,
      validatedAt: new Date().toISOString(),
      validatedContentFingerprint: fp,
      validationStatus: 'PASS',
      validationVerdict: 'PASS'
    };

    await sandbox.savePrescriptionWithFirewall(patientId, items, meta);

    // Verifica persistência no Dexie
    const dexieRecord = mockDbStorage.prescriptions.get(patientId);
    assert.ok(dexieRecord, 'Registro deve existir no Dexie');
    assert.strictEqual(dexieRecord.items.length, 1);
    assert.strictEqual(dexieRecord.items[0].foodName, 'Arroz branco cozido');

    // Verifica persistência redundante no localStorage
    const localRaw = mockLocalStorage.getItem(`nutriax_prescription_${patientId}`);
    assert.ok(localRaw, 'Registro deve existir no localStorage');
    const localParsed = JSON.parse(localRaw);
    assert.strictEqual(localParsed.items[0].foodName, 'Arroz branco cozido');
    assert.strictEqual(localParsed.meta.isClinicallyValidated, true);
  });

  test('2. loadPrescriptionForPatient restaura prescrição quando recarregada ou trocado o paciente', async () => {
    const { sandbox, mockDbStorage } = createRuntimeSandbox();

    const patientId = 'maria-silva';
    const items = [
      {
        id: 'food_cafe',
        foodId: 'taco_ovo',
        foodName: 'Ovo de galinha cozido',
        mealName: 'Café da Manhã',
        mealTime: '08:00',
        quantity: 100,
        unit: 'g',
        unitDisplay: '2 unidades (100g)',
        calories: 146,
        protein: 13.3,
        carbohydrate: 0.6,
        lipid: 9.5,
        fiber: 0
      }
    ];
    const fp = computePrescriptionContentFingerprint(items);
    const meta = {
      isAIGenerated: true,
      isClinicallyValidated: true,
      isStale: false,
      staleReason: null,
      validatedAt: new Date().toISOString(),
      validatedContentFingerprint: fp,
      validationStatus: 'PASS',
      validationVerdict: 'PASS'
    };

    await sandbox.savePrescriptionWithFirewall(patientId, items, meta);

    // Simula troca de paciente e retorno
    sandbox.currentPrescriptionItems = [];
    await sandbox.loadPrescriptionForPatient(patientId);

    assert.strictEqual(sandbox.currentPrescriptionItems.length, 1, 'Itens devem ser carregados para currentPrescriptionItems');
    assert.strictEqual(sandbox.currentPrescriptionItems[0].foodName, 'Ovo de galinha cozido');
    assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, true);
    assert.strictEqual(sandbox.currentPrescriptionMeta.isStale, false);
  });

  test('3. Recuperação por LocalStorage se o Dexie estiver temporariamente indisponível ou vazio', async () => {
    const { sandbox, mockDbStorage, mockLocalStorage } = createRuntimeSandbox();

    const patientId = 'paciente-resiliente';
    const items = [
      {
        id: 'food_shake',
        foodId: 'whey_1',
        foodName: 'Whey Protein Isolado',
        mealName: 'Pós-Treino',
        mealTime: '17:00',
        quantity: 30,
        unit: 'g',
        unitDisplay: '30g',
        calories: 110,
        protein: 27,
        carbohydrate: 0.5,
        lipid: 0.2,
        fiber: 0
      }
    ];
    const fp = computePrescriptionContentFingerprint(items);
    const savedObj = {
      id: patientId,
      patientId: patientId,
      items,
      meta: {
        isAIGenerated: true,
        isClinicallyValidated: true,
        isStale: false,
        staleReason: null,
        validatedAt: new Date().toISOString(),
        validatedContentFingerprint: fp,
        validationStatus: 'PASS',
        validationVerdict: 'PASS'
      }
    };

    // Salva apenas no localStorage simulando perda/reset do Dexie
    mockLocalStorage.setItem(`nutriax_prescription_${patientId}`, JSON.stringify(savedObj));
    mockDbStorage.prescriptions.clear();

    sandbox.currentPrescriptionItems = [];
    await sandbox.loadPrescriptionForPatient(patientId);

    assert.strictEqual(sandbox.currentPrescriptionItems.length, 1, 'Deve recuperar itens do localStorage');
    assert.strictEqual(sandbox.currentPrescriptionItems[0].foodName, 'Whey Protein Isolado');
    assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, true);
  });

  test('4. Recuperação a partir do payload de disciplina (nutriax_patient_payload)', async () => {
    const { sandbox, mockDbStorage, mockLocalStorage } = createRuntimeSandbox();

    const patientId = 'paciente-disciplina';
    const payload = {
      patientId: patientId,
      dietPlanStatus: 'VALIDATED_CANONICAL',
      updatedAt: new Date().toISOString(),
      meals: [
        {
          name: 'Almoço',
          time: '12:00',
          items: [
            {
              id: 'item_frango',
              foodId: 'frango_grelhado',
              name: 'Peito de Frango Grelhado',
              qty: 150,
              unit: '150g',
              kcal: 240,
              prot: 46.5,
              carbo: 0,
              lipid: 4.8,
              fiber: 0
            }
          ]
        }
      ]
    };

    // Salva apenas no payload sincronizado
    mockLocalStorage.setItem(`nutriax_patient_payload_${patientId}`, JSON.stringify(payload));
    mockDbStorage.prescriptions.clear();

    sandbox.currentPrescriptionItems = [];
    await sandbox.loadPrescriptionForPatient(patientId);

    assert.strictEqual(sandbox.currentPrescriptionItems.length, 1, 'Deve reconstruir itens a partir do payload de disciplina');
    assert.strictEqual(sandbox.currentPrescriptionItems[0].foodName, 'Peito de Frango Grelhado');
    assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, true);
  });

  test('5. Sync em background da nuvem NÃO sobrepõe silenciosamente prescrição local validada', async () => {
    const { sandbox, mockDbStorage } = createRuntimeSandbox();

    const patientId = 'paciente-cloud-safe';
    const localItems = [
      {
        id: 'food_local',
        foodId: 'salmao',
        foodName: 'Salmão Grelhado',
        mealName: 'Jantar',
        mealTime: '20:00',
        quantity: 200,
        unit: 'g',
        unitDisplay: '200g',
        calories: 416,
        protein: 40,
        carbohydrate: 0,
        lipid: 28,
        fiber: 0
      }
    ];
    const fp = computePrescriptionContentFingerprint(localItems);
    const localMeta = {
      isAIGenerated: true,
      isClinicallyValidated: true,
      isStale: false,
      staleReason: null,
      validatedAt: new Date().toISOString(),
      validatedContentFingerprint: fp,
      validationStatus: 'PASS',
      validationVerdict: 'PASS'
    };

    await sandbox.savePrescriptionWithFirewall(patientId, localItems, localMeta);
    sandbox.currentPrescriptionItems = localItems;
    sandbox.currentPrescriptionMeta = localMeta;

    // Simula _callDriveApi retornando dados velhos da nuvem
    sandbox._callDriveApi = async () => ({
      status: 'success',
      data: {
        patient: { id: patientId, name: 'Paciente Seguro' },
        prescriptions: [
          {
            id: 'food_old_cloud',
            foodName: 'Dieta Antiga da Nuvem',
            mealName: 'Almoço',
            mealTime: '12:00',
            quantity: 50,
            calories: 50,
            protein: 2,
            carbohydrate: 10,
            lipid: 1,
            fiber: 0
          }
        ]
      }
    });

    // Executa sincronização em background (showAlert = false)
    await sandbox.loadPatientFromCloud(patientId, false);

    // A prescrição local autoritativa validada deve ser estritamente preservada!
    assert.strictEqual(sandbox.currentPrescriptionItems[0].foodName, 'Salmão Grelhado', 'Prescrição local deve permanecer intacta');
    assert.strictEqual(sandbox.currentPrescriptionMeta.isClinicallyValidated, true, 'Validação clínica deve permanecer preservada');
  });

});
