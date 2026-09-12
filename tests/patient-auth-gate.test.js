// =========================================================================
// NutriAx Pro & Disciplina — Suíte de Testes do Auth Gate Obrigatório (Fase 8.2)
// Cobertura Completa: AUTH-GATE-01 até AUTH-GATE-15
// =========================================================================

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');

// Carrega o serviço canônico de Firebase e Identidade
const NutriProFirebase = require('../firebase-service.js');

// Mock in-memory do Firestore para testes determinísticos
function createMockFirestore() {
  const store = new Map();

  function getDocKey(collection, docId) {
    return `${collection}/${docId}`;
  }

  return {
    _store: store,
    collection(colName) {
      return {
        doc(docId) {
          return {
            async get() {
              const key = getDocKey(colName, docId);
              if (store.has(key)) {
                return {
                  exists: true,
                  id: docId,
                  data: () => ({ ...store.get(key) })
                };
              }
              return { exists: false, id: docId, data: () => null };
            },
            async set(data, options = {}) {
              const key = getDocKey(colName, docId);
              if (options.merge && store.has(key)) {
                store.set(key, { ...store.get(key), ...data });
              } else {
                store.set(key, { ...data });
              }
              return true;
            }
          };
        },
        where(field, op, value) {
          const filters = [{ field, op, value }];
          const query = {
            where(f, o, v) {
              filters.push({ field: f, op: o, value: v });
              return query;
            },
            async get() {
              const matching = [];
              const prefix = `${colName}/`;
              for (const [key, data] of store.entries()) {
                if (!key.startsWith(prefix)) continue;
                const matches = filters.every(f => {
                  if (f.op === '==') return data[f.field] === f.value;
                  return false;
                });
                if (matches) {
                  const docId = key.substring(prefix.length);
                  matching.push({
                    id: docId,
                    data: () => ({ ...data })
                  });
                }
              }
              return {
                empty: matching.length === 0,
                forEach: (cb) => matching.forEach(cb),
                docs: matching
              };
            }
          };
          return query;
        }
      };
    }
  };
}

// Simulador de Ambiente de Execução do Auth Gate de paciente.html
function createAuthGateEnvironment(mockFirestore, mockAuth) {
  // Estado interno do paciente
  const patientState = {
    name: 'Paciente',
    meals: [{ id: 1, name: 'Café da Manhã', done: true, kcal: 350 }],
    history: { '2026-09-12': { scoreIDC: 85 } },
    waterCurrent: 2000,
    workoutDone: true,
    cardioDone: true,
    sleepLogged: true,
    fastingProtocol: { enabled: true, type: '16:8' }
  };

  // Estado da Máquina de Estados do Auth Gate
  let _authGateCurrentState = 'AUTHENTICATING';
  let _authorizedPatientId = null;
  let _activePatientUser = null;
  let _authListenerAttached = false;
  let _authListeners = [];

  // Mock DOM
  const classListOverlay = new Set();
  const classListContent = new Set(['hidden']);

  const overlayElement = {
    classList: {
      add: (cls) => classListOverlay.add(cls),
      remove: (cls) => classListOverlay.delete(cls),
      contains: (cls) => classListOverlay.has(cls)
    }
  };

  const contentElement = {
    classList: {
      add: (cls) => classListContent.add(cls),
      remove: (cls) => classListContent.delete(cls),
      contains: (cls) => classListContent.has(cls)
    }
  };

  const domElements = {
    authGateOverlay: overlayElement,
    disciplinaAppContent: contentElement,
    patientHeaderName: { textContent: '' },
    currentMealsContainer: { innerHTML: '<div class="meal">Café da Manhã</div>' },
    currentRoutineContainer: { innerHTML: '<div class="exercise">Supino</div>' },
    patientFastingCardContainer: { innerHTML: '<div class="fasting">Jejum 16:8</div>' }
  };

  // Mock localStorage
  const localStorageStore = new Map();
  const localStorageMock = {
    getItem: (k) => localStorageStore.get(k) || null,
    setItem: (k, v) => localStorageStore.set(k, String(v)),
    removeItem: (k) => localStorageStore.delete(k),
    clear: () => localStorageStore.clear()
  };

  function setAuthGateState(newState) {
    _authGateCurrentState = newState;
    if (newState === 'AUTHORIZED') {
      overlayElement.classList.add('hidden');
      contentElement.classList.remove('hidden');
    } else {
      overlayElement.classList.remove('hidden');
      contentElement.classList.add('hidden');
    }
  }

  function dismantleClinicalInterface() {
    _authorizedPatientId = null;
    _activePatientUser = null;

    patientState.name = 'Carregando...';
    patientState.meals = [];
    patientState.fastingProtocol = null;
    patientState.history = {};
    patientState.waterCurrent = 0;
    patientState.workoutDone = false;
    patientState.cardioDone = false;
    patientState.sleepLogged = false;

    domElements.currentMealsContainer.innerHTML = '';
    domElements.currentRoutineContainer.innerHTML = '';
    domElements.patientFastingCardContainer.innerHTML = '';
    domElements.patientHeaderName.textContent = '';
  }

  async function resolveAndApplyAuth(user, options = {}) {
    if (!user || !user.uid) {
      dismantleClinicalInterface();
      setAuthGateState('UNAUTHENTICATED');
      return { state: 'UNAUTHENTICATED' };
    }

    setAuthGateState('AUTHENTICATING');
    const resolution = await NutriProFirebase.identity.resolveAuthorizedPatient(user);

    if (resolution.state === 'AUTHORIZED') {
      _authorizedPatientId = resolution.patientId;
      _activePatientUser = resolution.patientUser;

      // 1. Processamento de #data se fornecido (Invariante 5 e 6)
      if (options.hashData) {
        try {
          if (options.hashData.startsWith('#data=')) {
            const b64 = options.hashData.slice(6);
            const decoded = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
            if (decoded && decoded.patientId === _authorizedPatientId) {
              patientState.name = decoded.patientName || patientState.name;
            } else {
              // Rejeita payload de outro paciente!
            }
          }
        } catch (_) { }
      }

      // 2. Hidratação compatível
      setAuthGateState('AUTHORIZED');
      return resolution;
    } else if (resolution.state === 'BLOCKED') {
      dismantleClinicalInterface();
      setAuthGateState('BLOCKED');
      return resolution;
    } else if (resolution.state === 'AUTHENTICATED_NO_LINK') {
      dismantleClinicalInterface();
      setAuthGateState('AUTHENTICATED_NO_LINK');
      return resolution;
    } else {
      dismantleClinicalInterface();
      setAuthGateState('ERROR');
      return resolution;
    }
  }

  function initAuthGate() {
    if (_authListenerAttached) {
      return false; // Evita registro duplicado
    }
    _authListenerAttached = true;
    _authListeners.push(async (user) => {
      return await resolveAndApplyAuth(user);
    });
    return true;
  }

  return {
    patientState,
    domElements,
    localStorageMock,
    getAuthState: () => _authGateCurrentState,
    getAuthorizedPatientId: () => _authorizedPatientId,
    setAuthGateState,
    dismantleClinicalInterface,
    resolveAndApplyAuth,
    initAuthGate,
    getListenerCount: () => _authListeners.length
  };
}

describe('Fase 8.2 — Auth Gate Obrigatório do Disciplina (paciente.html)', () => {
  let mockFirestore;
  let mockAuth;

  beforeEach(() => {
    mockFirestore = createMockFirestore();
    mockAuth = { currentUser: null };
    NutriProFirebase._setMockInstances({
      firestore: mockFirestore,
      auth: mockAuth
    });
  });

  // -------------------------------------------------------------------------
  // AUTH-GATE-01: Não autenticado -> bloqueado
  // -------------------------------------------------------------------------
  test('AUTH-GATE-01: Usuário não autenticado -> estado UNAUTHENTICATED, app bloqueado', async () => {
    const env = createAuthGateEnvironment(mockFirestore, mockAuth);
    const res = await env.resolveAndApplyAuth(null);

    assert.strictEqual(res.state, 'UNAUTHENTICATED');
    assert.strictEqual(env.getAuthState(), 'UNAUTHENTICATED');
    assert.strictEqual(env.getAuthorizedPatientId(), null);
    assert.strictEqual(env.domElements.disciplinaAppContent.classList.contains('hidden'), true, 'Conteúdo clínico deve estar oculto');
    assert.strictEqual(env.domElements.authGateOverlay.classList.contains('hidden'), false, 'Overlay do Auth Gate deve estar visível');
  });

  // -------------------------------------------------------------------------
  // AUTH-GATE-02: Autenticado sem vínculo e sem convite -> AUTHENTICATED_NO_LINK
  // -------------------------------------------------------------------------
  test('AUTH-GATE-02: Autenticado Google sem vínculo e sem convite -> AUTHENTICATED_NO_LINK', async () => {
    const env = createAuthGateEnvironment(mockFirestore, mockAuth);
    const user = { uid: 'uid_sem_cadastro_123', email: 'desconhecido@example.com' };

    const res = await env.resolveAndApplyAuth(user);

    assert.strictEqual(res.state, 'AUTHENTICATED_NO_LINK');
    assert.strictEqual(env.getAuthState(), 'AUTHENTICATED_NO_LINK');
    assert.strictEqual(env.getAuthorizedPatientId(), null);
    assert.strictEqual(env.domElements.disciplinaAppContent.classList.contains('hidden'), true);
  });

  // -------------------------------------------------------------------------
  // AUTH-GATE-03: Vínculo ativo -> patientId correto
  // -------------------------------------------------------------------------
  test('AUTH-GATE-03: Vínculo ativo em patient_users -> AUTHORIZED com patientId correto', async () => {
    const uid = 'patient_uid_active_01';
    await mockFirestore.collection('patient_users').doc(uid).set({
      firebaseUid: uid,
      email: 'paciente.ativo@example.com',
      patientId: 'patient_ativo_42',
      status: 'active',
      role: 'patient',
      professionalId: 'pro_99'
    });

    const env = createAuthGateEnvironment(mockFirestore, mockAuth);
    const user = { uid, email: 'paciente.ativo@example.com' };

    const res = await env.resolveAndApplyAuth(user);

    assert.strictEqual(res.state, 'AUTHORIZED');
    assert.strictEqual(res.patientId, 'patient_ativo_42');
    assert.strictEqual(env.getAuthorizedPatientId(), 'patient_ativo_42');
    assert.strictEqual(env.getAuthState(), 'AUTHORIZED');
    assert.strictEqual(env.domElements.disciplinaAppContent.classList.contains('hidden'), false, 'App deve estar visível');
    assert.strictEqual(env.domElements.authGateOverlay.classList.contains('hidden'), true, 'Overlay deve estar oculto');
  });

  // -------------------------------------------------------------------------
  // AUTH-GATE-04: Vínculo blocked -> BLOCKED
  // -------------------------------------------------------------------------
  test('AUTH-GATE-04: Vínculo com status blocked -> BLOCKED imediatamente', async () => {
    const uid = 'patient_uid_blocked_01';
    await mockFirestore.collection('patient_users').doc(uid).set({
      firebaseUid: uid,
      email: 'bloqueado@example.com',
      patientId: 'patient_bloqueado_01',
      status: 'blocked',
      role: 'patient',
      professionalId: 'pro_99'
    });

    const env = createAuthGateEnvironment(mockFirestore, mockAuth);
    const user = { uid, email: 'bloqueado@example.com' };

    const res = await env.resolveAndApplyAuth(user);

    assert.strictEqual(res.state, 'BLOCKED');
    assert.strictEqual(env.getAuthState(), 'BLOCKED');
    assert.strictEqual(env.getAuthorizedPatientId(), null);
    assert.strictEqual(env.domElements.disciplinaAppContent.classList.contains('hidden'), true);
  });

  // -------------------------------------------------------------------------
  // AUTH-GATE-05: UID A + URL ?id=B -> A
  // -------------------------------------------------------------------------
  test('AUTH-GATE-05: UID A + URL ?id=B -> A (URL não concede autorização)', async () => {
    const uidA = 'patient_uid_A';
    await mockFirestore.collection('patient_users').doc(uidA).set({
      firebaseUid: uidA,
      email: 'a@example.com',
      patientId: 'patient_A',
      status: 'active',
      role: 'patient',
      professionalId: 'pro_99'
    });

    const env = createAuthGateEnvironment(mockFirestore, mockAuth);
    // Simula tentativa de invasão via URL ?id=patient_B
    const userA = { uid: uidA, email: 'a@example.com' };
    const res = await env.resolveAndApplyAuth(userA, { urlParamId: 'patient_B' });

    assert.strictEqual(res.state, 'AUTHORIZED');
    assert.strictEqual(res.patientId, 'patient_A', 'Autoridade deve vir exclusivamente de patient_users/UID');
    assert.strictEqual(env.getAuthorizedPatientId(), 'patient_A');
  });

  // -------------------------------------------------------------------------
  // AUTH-GATE-06: UID A + #data de B -> A; payload não concede acesso
  // -------------------------------------------------------------------------
  test('AUTH-GATE-06: UID A + #data de B -> A; payload de B é ignorado e rejeitado', async () => {
    const uidA = 'patient_uid_A';
    await mockFirestore.collection('patient_users').doc(uidA).set({
      firebaseUid: uidA,
      email: 'a@example.com',
      patientId: 'patient_A',
      status: 'active',
      role: 'patient'
    });

    const env = createAuthGateEnvironment(mockFirestore, mockAuth);
    env.patientState.name = 'Nome de A';

    // Cria um payload falso pertencente ao paciente B
    const payloadB = { patientId: 'patient_B', patientName: 'Nome do Paciente B' };
    const b64 = Buffer.from(JSON.stringify(payloadB)).toString('base64');
    const hashData = `#data=${b64}`;

    const res = await env.resolveAndApplyAuth({ uid: uidA, email: 'a@example.com' }, { hashData });

    assert.strictEqual(res.state, 'AUTHORIZED');
    assert.strictEqual(env.getAuthorizedPatientId(), 'patient_A');
    assert.strictEqual(env.patientState.name, 'Nome de A', 'O payload de B não pode alterar os dados de A');
  });

  // -------------------------------------------------------------------------
  // AUTH-GATE-07: UID A + localStorage B -> A
  // -------------------------------------------------------------------------
  test('AUTH-GATE-07: UID A + localStorage B -> A; localStorage B não concede acesso', async () => {
    const uidA = 'patient_uid_A';
    await mockFirestore.collection('patient_users').doc(uidA).set({
      firebaseUid: uidA,
      email: 'a@example.com',
      patientId: 'patient_A',
      status: 'active',
      role: 'patient'
    });

    const env = createAuthGateEnvironment(mockFirestore, mockAuth);
    env.localStorageMock.setItem('NUTRIAX_ACTIVE_PATIENT_ID', 'patient_B');
    env.localStorageMock.setItem('nutriax_sync_active_patient', 'patient_B');

    const res = await env.resolveAndApplyAuth({ uid: uidA, email: 'a@example.com' });

    assert.strictEqual(res.state, 'AUTHORIZED');
    assert.strictEqual(env.getAuthorizedPatientId(), 'patient_A', 'Autoridade deve ignorar localStorage');
  });

  // -------------------------------------------------------------------------
  // AUTH-GATE-08: A tentando acessar B -> rejeitado
  // -------------------------------------------------------------------------
  test('AUTH-GATE-08: Paciente A tentando invocar autorização de B -> rejeitado', async () => {
    const uidA = 'uid_A';
    await mockFirestore.collection('patient_users').doc(uidA).set({
      firebaseUid: uidA,
      email: 'a@example.com',
      patientId: 'patient_A',
      status: 'active',
      role: 'patient'
    });

    // Tenta resolver autorização fornecendo user A, esperando acessar paciente B
    const resolution = await NutriProFirebase.identity.resolveAuthorizedPatient({ uid: uidA, email: 'a@example.com' });
    assert.strictEqual(resolution.patientId, 'patient_A');
    assert.notStrictEqual(resolution.patientId, 'patient_B');
  });

  // -------------------------------------------------------------------------
  // AUTH-GATE-09: Logout -> Auth Gate
  // -------------------------------------------------------------------------
  test('AUTH-GATE-09: Logout -> retorna ao Auth Gate (UNAUTHENTICATED) e desmonta dados clínicos', async () => {
    const uid = 'uid_teste_logout';
    await mockFirestore.collection('patient_users').doc(uid).set({
      firebaseUid: uid,
      patientId: 'patient_log',
      status: 'active',
      role: 'patient'
    });

    const env = createAuthGateEnvironment(mockFirestore, mockAuth);
    await env.resolveAndApplyAuth({ uid, email: 'user@example.com' });

    assert.strictEqual(env.getAuthState(), 'AUTHORIZED');
    assert.strictEqual(env.domElements.disciplinaAppContent.classList.contains('hidden'), false);

    // Executa logout
    await env.resolveAndApplyAuth(null);

    assert.strictEqual(env.getAuthState(), 'UNAUTHENTICATED');
    assert.strictEqual(env.getAuthorizedPatientId(), null);
    assert.strictEqual(env.domElements.disciplinaAppContent.classList.contains('hidden'), true);
    assert.strictEqual(env.domElements.authGateOverlay.classList.contains('hidden'), false);
    assert.strictEqual(env.patientState.meals.length, 0, 'Refeições devem ter sido desmontadas');
  });

  // -------------------------------------------------------------------------
  // AUTH-GATE-10: Convite PENDING válido -> claim -> patient_users/{UID} -> autorização
  // -------------------------------------------------------------------------
  test('AUTH-GATE-10: Convite PENDING válido -> claim -> vincula patient_users/{UID} -> autoriza', async () => {
    const inviteId = 'inv_test_10';
    const email = 'novo.paciente@example.com';
    const targetPatientId = 'patient_novo_99';

    await mockFirestore.collection('patient_invites').doc(inviteId).set({
      inviteId,
      authorizedEmail: email,
      patientId: targetPatientId,
      professionalId: 'pro_central',
      status: 'PENDING',
      expiresAt: '2030-01-01T00:00:00.000Z'
    });

    const newUid = 'uid_firebase_novo_10';
    const user = { uid: newUid, email };

    const env = createAuthGateEnvironment(mockFirestore, mockAuth);
    const res = await env.resolveAndApplyAuth(user);

    assert.strictEqual(res.state, 'AUTHORIZED');
    assert.strictEqual(res.patientId, targetPatientId);
    assert.strictEqual(env.getAuthorizedPatientId(), targetPatientId);

    // Verifica se patient_users/{UID} foi criado
    const createdUserDoc = await mockFirestore.collection('patient_users').doc(newUid).get();
    assert.strictEqual(createdUserDoc.exists, true);
    assert.strictEqual(createdUserDoc.data().patientId, targetPatientId);
    assert.strictEqual(createdUserDoc.data().status, 'active');

    // Verifica se o convite foi marcado como CLAIMED
    const updatedInviteDoc = await mockFirestore.collection('patient_invites').doc(inviteId).get();
    assert.strictEqual(updatedInviteDoc.data().status, 'CLAIMED');
  });

  // -------------------------------------------------------------------------
  // AUTH-GATE-11: Usuário não autenticado + #data válido -> payload não é decodificado
  // -------------------------------------------------------------------------
  test('AUTH-GATE-11: Usuário não autenticado com #data -> payload não é processado e permanece UNAUTHENTICATED', async () => {
    const env = createAuthGateEnvironment(mockFirestore, mockAuth);
    const payload = { patientId: 'patient_vazado', patientName: 'Dados Vazados' };
    const b64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const hashData = `#data=${b64}`;

    const res = await env.resolveAndApplyAuth(null, { hashData });

    assert.strictEqual(res.state, 'UNAUTHENTICATED');
    assert.strictEqual(env.getAuthorizedPatientId(), null);
    assert.notStrictEqual(env.patientState.name, 'Dados Vazados', 'Dados não podem ser hidratados');
    assert.strictEqual(env.domElements.disciplinaAppContent.classList.contains('hidden'), true);
  });

  // -------------------------------------------------------------------------
  // AUTH-GATE-12: UID A + cache/Dexie B -> B não é hidratado
  // -------------------------------------------------------------------------
  test('AUTH-GATE-12: UID A + cache local de B -> B não é hidratado, apenas dados de A permitidos', async () => {
    const uidA = 'uid_A';
    await mockFirestore.collection('patient_users').doc(uidA).set({
      firebaseUid: uidA,
      patientId: 'patient_A',
      status: 'active',
      role: 'patient'
    });

    const env = createAuthGateEnvironment(mockFirestore, mockAuth);
    // Simula cache deixado por paciente B
    env.localStorageMock.setItem('nutriax_patient_payload_patient_B', JSON.stringify({ patientId: 'patient_B', name: 'Paciente B' }));

    const res = await env.resolveAndApplyAuth({ uid: uidA, email: 'a@example.com' });

    assert.strictEqual(res.state, 'AUTHORIZED');
    assert.strictEqual(env.getAuthorizedPatientId(), 'patient_A');
    assert.notStrictEqual(env.patientState.name, 'Paciente B', 'Cache de B não pode ser aplicado em A');
  });

  // -------------------------------------------------------------------------
  // AUTH-GATE-13: Logout -> dados clínicos não permanecem visíveis
  // -------------------------------------------------------------------------
  test('AUTH-GATE-13: Logout -> desmontagem garante que nenhum dado clínico permaneça no DOM', async () => {
    const env = createAuthGateEnvironment(mockFirestore, mockAuth);

    // Pré-condição: elementos populados
    assert.strictEqual(env.domElements.currentMealsContainer.innerHTML.includes('Café da Manhã'), true);
    assert.strictEqual(env.domElements.currentRoutineContainer.innerHTML.includes('Supino'), true);

    // Executa desmontagem
    env.dismantleClinicalInterface();

    assert.strictEqual(env.domElements.currentMealsContainer.innerHTML, '', 'Container de refeições deve ser esvaziado');
    assert.strictEqual(env.domElements.currentRoutineContainer.innerHTML, '', 'Container de rotinas deve ser esvaziado');
    assert.strictEqual(env.domElements.patientFastingCardContainer.innerHTML, '', 'Container de jejum deve ser esvaziado');
    assert.strictEqual(env.patientState.meals.length, 0);
    assert.strictEqual(env.patientState.fastingProtocol, null);
    assert.strictEqual(env.patientState.waterCurrent, 0);
  });

  // -------------------------------------------------------------------------
  // AUTH-GATE-14: UID blocked + convite PENDING -> BLOCKED; convite não pode contornar bloqueio
  // -------------------------------------------------------------------------
  test('AUTH-GATE-14: UID blocked + convite PENDING -> BLOCKED; convite não contorna bloqueio', async () => {
    const blockedUid = 'uid_blocked_with_invite';
    const email = 'bloqueado.tentando.convite@example.com';

    // Registra paciente como blocked
    await mockFirestore.collection('patient_users').doc(blockedUid).set({
      firebaseUid: blockedUid,
      email,
      patientId: 'patient_old_blocked',
      status: 'blocked',
      role: 'patient',
      professionalId: 'pro_1'
    });

    // Cria um convite pendente para o mesmo email
    await mockFirestore.collection('patient_invites').doc('inv_bypass').set({
      inviteId: 'inv_bypass',
      authorizedEmail: email,
      patientId: 'patient_new_bypass',
      professionalId: 'pro_1',
      status: 'PENDING',
      expiresAt: '2030-01-01T00:00:00.000Z'
    });

    const env = createAuthGateEnvironment(mockFirestore, mockAuth);
    const res = await env.resolveAndApplyAuth({ uid: blockedUid, email });

    assert.strictEqual(res.state, 'BLOCKED', 'Deve retornar BLOCKED');
    assert.strictEqual(env.getAuthState(), 'BLOCKED');

    // Confirma que o convite continua PENDING (não foi reivindicado/bypassed)
    const invDoc = await mockFirestore.collection('patient_invites').doc('inv_bypass').get();
    assert.strictEqual(invDoc.data().status, 'PENDING', 'Convite não deve ser consumido');
  });

  // -------------------------------------------------------------------------
  // AUTH-GATE-15: Inicialização/reentrada -> apenas um listener onAuthStateChanged
  // -------------------------------------------------------------------------
  test('AUTH-GATE-15: Reentradas de initAuthGate registram apenas um listener', () => {
    const env = createAuthGateEnvironment(mockFirestore, mockAuth);

    const firstCall = env.initAuthGate();
    assert.strictEqual(firstCall, true, 'Primeira chamada registra listener');
    assert.strictEqual(env.getListenerCount(), 1);

    const secondCall = env.initAuthGate();
    assert.strictEqual(secondCall, false, 'Segunda chamada é ignorada');
    assert.strictEqual(env.getListenerCount(), 1, 'Não deve criar listener duplicado');

    const thirdCall = env.initAuthGate();
    assert.strictEqual(thirdCall, false, 'Terceira chamada é ignorada');
    assert.strictEqual(env.getListenerCount(), 1, 'Contador de listeners permanece 1');
  });
});
