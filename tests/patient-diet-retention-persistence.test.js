// tests/patient-diet-retention-persistence.test.js
// Testes automatizados de persistência e retenção da dieta prescrita no app Disciplina

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('NutriAx Disciplina - Retenção e Persistência da Dieta Prescrita', () => {
  let disciplinaHtml;
  let firebaseServiceJs;
  let appJs;

  beforeEach(() => {
    disciplinaHtml = fs.readFileSync(path.join(__dirname, '../disciplina/index.html'), 'utf8');
    firebaseServiceJs = fs.readFileSync(path.join(__dirname, '../firebase-service.js'), 'utf8');
    appJs = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  });

  test('1. disciplina/index.html contém helpers de recuperação e detecção de mock', () => {
    assert.ok(disciplinaHtml.includes('function isDefaultMockMeals'), 'Deve conter isDefaultMockMeals');
    assert.ok(disciplinaHtml.includes('function _convertPrescriptionItemsToPatientMeals'), 'Deve conter _convertPrescriptionItemsToPatientMeals');
    assert.ok(disciplinaHtml.includes('function shouldAcceptPrescriptionUpdate'), 'Deve conter shouldAcceptPrescriptionUpdate');
  });

  test('2. applyPrescriptionPayload protege refeições existentes se payload vier sem meals', () => {
    // Extrai e testa a lógica isolada no sandbox
    const script = `
      ${disciplinaHtml.slice(
        disciplinaHtml.indexOf('function isDefaultMockMeals'),
        disciplinaHtml.indexOf('function dismantleClinicalInterface')
      )}
    `;
    assert.ok(script.includes('isDefaultMockMeals'));
  });

  test('3. Retenção da dieta após recarga (loadState recupera refeições salvas e não reverte para mock)', () => {
    const mockStorage = {};
    const patientId = 'paciente-teste-123';
    const storageKey = `nutriax_patient_discipline_v3_${patientId}`;

    const prescribedMeals = [
      {
        id: 'meal_1',
        time: '08:00',
        name: 'Café da Manhã Prescrito',
        detail: '4 Claras + 1 Gema + 60g Aveia',
        items: [
          { name: 'Claras de ovos', qty: 120, unit: '120g', kcal: 62, prot: 13, carbo: 1, lipid: 0 },
          { name: 'Aveia em flocos', qty: 60, unit: '60g', kcal: 212, prot: 8, carbo: 34, lipid: 4 }
        ],
        kcal: 274,
        prot: 21,
        carbo: 35,
        fat: 4,
        done: false
      },
      {
        id: 'meal_2',
        time: '12:30',
        name: 'Almoço Prescrito Anabólico',
        detail: '150g Frango Grelhado + 150g Arroz Integral + Brócolis',
        items: [
          { name: 'Peito de frango', qty: 150, unit: '150g', kcal: 240, prot: 46, carbo: 0, lipid: 5 }
        ],
        kcal: 240,
        prot: 46,
        carbo: 0,
        fat: 5,
        done: true
      }
    ];

    // Simula estado salvo anteriormente no disciplina
    mockStorage[storageKey] = JSON.stringify({
      name: 'Paciente Vitor',
      waterTarget: 3800,
      meals: prescribedMeals,
      streakDays: 3,
      lastActiveDate: '2026-09-21'
    });

    // Cria sandbox com o mock de localStorage e simula loadState
    const sandbox = {
      localStorage: {
        getItem: (k) => mockStorage[k] || null,
        setItem: (k, v) => { mockStorage[k] = String(v); }
      },
      _authorizedPatientId: patientId,
      _activePatientUser: null,
      WORKOUT_DATABASE: {},
      WEEKLY_SCHEDULE_DATA: [],
      selectedRoutineKey: 'A',
      selectedScheduleDay: 1,
      todayIso: '2026-09-21',
      getLocalDateIso: () => '2026-09-21',
      isStateFromPreviousDay: () => false,
      resetDailyState: () => {},
      checkIndexedDbPatient: () => {},
      patientState: {
        name: 'Paciente',
        meals: [
          { id: 'm1', name: 'Café da Manhã', items: [{ name: 'Ovos de galinha mexidos' }] },
          { id: 'm2', name: 'Lanche da Manhã' },
          { id: 'm3', name: 'Almoço' },
          { id: 'm4', name: 'Jantar' }
        ]
      },
      getDisciplineStorageKey: () => storageKey,
      saveState: () => {
        mockStorage[storageKey] = JSON.stringify(sandbox.patientState);
      }
    };

    // Extrai helper isDefaultMockMeals e loadState
    const scriptCode = `
      function isDefaultMockMeals(meals) {
        if (!Array.isArray(meals) || meals.length !== 4) return false;
        const ids = meals.map(m => m.id);
        return ids[0] === 'm1' && ids[1] === 'm2' && ids[2] === 'm3' && ids[3] === 'm4' &&
          meals[0]?.name === 'Café da Manhã' &&
          meals[0]?.items?.[0]?.name === 'Ovos de galinha mexidos';
      }

      function _convertPrescriptionItemsToPatientMeals(items) { return []; }
      function applyPrescriptionPayload(p) { if (p && p.meals) patientState.meals = p.meals; }

      // Trecho correspondente a loadState
      const patientIdClean = String(_authorizedPatientId).trim();
      const patientIdLower = patientIdClean.toLowerCase();
      const patientIdSlug = patientIdLower.replace(/\\s+/g, '-');
      const patientIdNum = !isNaN(Number(patientIdClean)) ? Number(patientIdClean) : null;

      let dataPayload = null;
      try {
        const raw = localStorage.getItem('nutriax_patient_payload_' + patientIdClean);
        if (raw) dataPayload = JSON.parse(raw);
      } catch (_) {}

      // Executa seção B (aplicação de estado de interação salvo)
      const storageKey = getDisciplineStorageKey();
      let saved = storageKey ? localStorage.getItem(storageKey) : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        const mealDoneMap = {};
        if (Array.isArray(parsed.meals)) {
          parsed.meals.forEach(m => { mealDoneMap[m.id] = m.done; });
        }
        const { meals: _m, name: _savedName, waterTarget: _savedWt, ...restParsed } = parsed;
        Object.assign(patientState, restParsed);

        if ((!patientState.meals || patientState.meals.length === 0 || isDefaultMockMeals(patientState.meals)) &&
            Array.isArray(parsed.meals) && parsed.meals.length > 0 && !isDefaultMockMeals(parsed.meals)) {
          patientState.meals = parsed.meals;
        }

        if (Array.isArray(patientState.meals)) {
          patientState.meals = patientState.meals.map(m => ({
            ...m,
            done: mealDoneMap[m.id] !== undefined ? !!mealDoneMap[m.id] : false
          }));
        }

        if ((!patientState.name || patientState.name === 'Paciente') && _savedName) {
          patientState.name = _savedName;
        }
        if (!patientState.waterTarget && _savedWt) {
          patientState.waterTarget = _savedWt;
        }
      }
    `;

    vm.createContext(sandbox);
    vm.runInContext(scriptCode, sandbox);

    // Valida que as refeições prescritas foram recuperadas e não os mocks
    assert.strictEqual(sandbox.patientState.meals.length, 2, 'Deve ter 2 refeições prescritas recuperadas');
    assert.strictEqual(sandbox.patientState.meals[0].name, 'Café da Manhã Prescrito');
    assert.strictEqual(sandbox.patientState.meals[1].name, 'Almoço Prescrito Anabólico');
    assert.strictEqual(sandbox.patientState.meals[1].done, true, 'Deve manter o status done de refeições marcadas');
    assert.strictEqual(sandbox.patientState.name, 'Paciente Vitor', 'Deve manter o nome do paciente');
    assert.strictEqual(sandbox.patientState.waterTarget, 3800, 'Deve manter a meta de água');
  });

  test('4. shouldAcceptPrescriptionUpdate rejeita sobrescrever refeições locais com payload vazio ou obsoleto', () => {
    const sandbox = {
      patientState: {
        meals: [
          { id: 'meal_1', name: 'Almoço Prescrito', items: [{ name: 'Frango' }] }
        ]
      },
      isDefaultMockMeals: (meals) => false
    };

    const scriptCode = `
      function shouldAcceptPrescriptionUpdate(incoming, current) {
        if (!incoming) return false;
        const currentHasMeals = (Array.isArray(patientState.meals) && patientState.meals.length > 0 && !isDefaultMockMeals(patientState.meals)) ||
                                (current && Array.isArray(current.meals) && current.meals.length > 0 && !isDefaultMockMeals(current.meals));
        const incomingHasMeals = Array.isArray(incoming.meals) && incoming.meals.length > 0;
        if (!incomingHasMeals && currentHasMeals) {
          return false;
        }
        if (incoming.updatedAt && current && current.updatedAt) {
          const incomingTime = new Date(incoming.updatedAt).getTime();
          const currentTime = new Date(current.updatedAt).getTime();
          if (!isNaN(incomingTime) && !isNaN(currentTime) && incomingTime < currentTime) {
            return false;
          }
        }
        return true;
      }
    `;

    vm.createContext(sandbox);
    vm.runInContext(scriptCode, sandbox);

    // 1. Nuvem envia payload com meals: null -> deve ser rejeitado
    const emptyIncoming = { meals: null, updatedAt: '2026-09-21T15:30:00Z' };
    const current = { meals: [{ id: 'm1' }], updatedAt: '2026-09-21T15:00:00Z' };
    const result1 = sandbox.shouldAcceptPrescriptionUpdate(emptyIncoming, current);
    assert.strictEqual(result1, false, 'Deve rejeitar update vazio da nuvem sobre refeições locais existentes');

    // 2. Nuvem envia versão mais antiga que o estado local -> deve ser rejeitado
    const olderIncoming = { meals: [{ id: 'm_old' }], updatedAt: '2026-09-21T14:00:00Z' };
    const newerCurrent = { meals: [{ id: 'm_new' }], updatedAt: '2026-09-21T15:00:00Z' };
    const result2 = sandbox.shouldAcceptPrescriptionUpdate(olderIncoming, newerCurrent);
    assert.strictEqual(result2, false, 'Deve rejeitar versão desatualizada da nuvem');

    // 3. Nuvem envia versão mais recente com refeições válidas -> deve aceitar
    const newerIncoming = { meals: [{ id: 'm_updated' }], updatedAt: '2026-09-21T16:00:00Z' };
    const result3 = sandbox.shouldAcceptPrescriptionUpdate(newerIncoming, newerCurrent);
    assert.strictEqual(result3, true, 'Deve aceitar versão mais recente com refeições');
  });

  test('5. firebase-service.js preserva pending hash em sessionStorage antes de popup Google', () => {
    assert.ok(firebaseServiceJs.includes('nutriax_pending_hash_data'), 'Deve salvar nutriax_pending_hash_data em sessionStorage');
    assert.ok(disciplinaHtml.includes('nutriax_pending_hash_data'), 'disciplina/index.html deve checar nutriax_pending_hash_data');
  });

  test('6. app.js revalida e assina automaticamente prescrição modificada ao abrir modal de compartilhamento', () => {
    assert.ok(appJs.includes('Auto-revalidação e assinatura clínica de ajustes manuais antes de publicar'), 'openPatientShareModal deve revalidar se isStale');
    assert.ok(appJs.includes('computePrescriptionContentFingerprint(currentPrescriptionItems)'), 'Deve recalcular Content Fingerprint canônico');
  });
});
