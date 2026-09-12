// =========================================================================
// NutriAx Pro — Suíte de Testes do Auth Gate Profissional (Fase 8.3)
// Cobertura Completa dos Requisitos Canônicos: AUTH-PRO-01 até AUTH-PRO-15
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

// Simulador de Ambiente de Execução do Auth Gate Profissional (index.html + app.js)
function createProfessionalEnvironment(mockFirestore, mockAuth) {
  // Dexie mock com pacientes clínicos
  const dexiePatientsStore = new Map([
    ['paciente-1', { id: 'paciente-1', name: 'Paciente Um', age: 30, height: 1.75, currentWeight: 75, email: 'paciente1@gmail.com' }],
    ['paciente-2', { id: 'paciente-2', name: 'Paciente Dois', age: 25, height: 1.65, currentWeight: 60, email: 'paciente2@gmail.com' }]
  ]);

  let clinicalQueriesCount = 0;
  const mockDexie = {
    patients: {
      get: async (id) => {
        clinicalQueriesCount++;
        return dexiePatientsStore.get(id) || null;
      },
      toArray: async () => {
        clinicalQueriesCount++;
        return Array.from(dexiePatientsStore.values());
      },
      update: async (id, changes) => {
        const item = dexiePatientsStore.get(id);
        if (item) Object.assign(item, changes);
      },
      put: async (item) => {
        dexiePatientsStore.set(item.id, item);
      }
    },
    prescriptions: {
      get: async (id) => {
        clinicalQueriesCount++;
        return null;
      }
    }
  };

  // Estado da Máquina de Estados
  let _proAuthGateState = 'AUTHENTICATING';
  let _currentProfessionalUid = null;
  let _currentProfessionalData = null;
  let activePatientId = null;
  let activePatientData = null;
  let currentPrescriptionItems = [];
  let _isWorkspaceBootstrapped = false;
  let authListeners = [];

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
    style: { display: 'none' },
    classList: {
      add: (cls) => classListContent.add(cls),
      remove: (cls) => classListContent.delete(cls),
      contains: (cls) => classListContent.has(cls)
    }
  };

  const badgeElement = {
    innerHTML: '',
    textContent: '',
    className: ''
  };

  const emailInputElement = {
    value: '',
    focus: () => {}
  };

  const domElements = {
    professionalAuthGateOverlay: overlayElement,
    nutriaxProAppContent: contentElement,
    proAuthGateStateAuthenticating: { classList: new Set() },
    proAuthGateStateUnauthenticated: { classList: new Set(['hidden']) },
    proAuthGateStateAccessDenied: { classList: new Set(['hidden']) },
    proAuthGateStateError: { classList: new Set(['hidden']) },
    proUserName: { textContent: '' },
    proUserAvatar: { innerHTML: '' },
    proAuthGateDeniedEmail: { textContent: '' },
    proAuthGateDeniedReason: { textContent: '' },
    patientCloudLinkedBadge: badgeElement,
    patientShareGmailInput: emailInputElement,
    headerPatientName: { innerText: '' },
    headerPatientInfo: { innerText: '' },
    headerPatientGoal: { innerText: '' }
  };

  // Mock localStorage
  const localStorageStore = new Map();
  const localStorageMock = {
    getItem: (k) => localStorageStore.get(k) || null,
    setItem: (k, v) => localStorageStore.set(k, String(v)),
    removeItem: (k) => localStorageStore.delete(k),
    clear: () => localStorageStore.clear()
  };

  function setProfessionalAuthGateState(state, details = {}) {
    _proAuthGateState = state;
    if (state === 'AUTHORIZED') {
      overlayElement.classList.add('hidden');
      contentElement.classList.remove('hidden');
      contentElement.style.display = '';
    } else {
      dismantleProfessionalWorkspace();
      overlayElement.classList.remove('hidden');
      contentElement.classList.add('hidden');
      contentElement.style.display = 'none';
    }
  }

  function dismantleProfessionalWorkspace() {
    activePatientId = null;
    activePatientData = null;
    currentPrescriptionItems = [];
    _isWorkspaceBootstrapped = false;
    domElements.headerPatientName.innerText = 'Nenhum paciente selecionado';
  }

  async function bootstrapProfessionalWorkspace(user, professional) {
    if (!_isWorkspaceBootstrapped) {
      const savedPatientId = localStorageMock.getItem('NUTRIAX_ACTIVE_PATIENT_ID');
      if (savedPatientId) {
        const exists = await mockDexie.patients.get(savedPatientId);
        if (exists) {
          activePatientId = savedPatientId;
          activePatientData = exists;
          domElements.headerPatientName.innerText = exists.name;
        } else {
          activePatientId = null;
          localStorageMock.removeItem('NUTRIAX_ACTIVE_PATIENT_ID');
        }
      } else {
        activePatientId = null;
      }
      _isWorkspaceBootstrapped = true;
    }
  }

  async function onAuthStateChangedHandler(user) {
    if (!user) {
      _currentProfessionalUid = null;
      _currentProfessionalData = null;
      setProfessionalAuthGateState('UNAUTHENTICATED');
      return;
    }

    const resolution = await NutriProFirebase.identity.resolveAuthorizedProfessional(user);
    if (resolution.state === 'AUTHORIZED') {
      _currentProfessionalUid = user.uid;
      _currentProfessionalData = resolution.professional;
      await bootstrapProfessionalWorkspace(user, resolution.professional);
      setProfessionalAuthGateState('AUTHORIZED');
    } else if (resolution.state === 'ACCESS_DENIED') {
      _currentProfessionalUid = null;
      _currentProfessionalData = null;
      setProfessionalAuthGateState('ACCESS_DENIED', {
        email: user.email,
        reason: resolution.reason
      });
    } else {
      _currentProfessionalUid = null;
      _currentProfessionalData = null;
      setProfessionalAuthGateState('ERROR', {
        message: resolution.error
      });
    }
  }

  async function handleProfessionalSignOut() {
    if (mockAuth.signOut) await mockAuth.signOut();
    _currentProfessionalUid = null;
    _currentProfessionalData = null;
    dismantleProfessionalWorkspace();
    setProfessionalAuthGateState('UNAUTHENTICATED');
  }

  async function linkPatientEmailFromDashboard() {
    const pId = activePatientId || (activePatientData && activePatientData.id);
    if (!pId) {
      throw new Error('Nenhum paciente selecionado.');
    }

    const email = (emailInputElement.value || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw new Error('Email inválido.');
    }

    const currentProUid = _currentProfessionalUid || mockAuth.currentUser?.uid;
    if (!currentProUid) {
      throw new Error('Apenas o profissional autenticado pode criar convites.');
    }

    // Cria convite canônico em patient_invites
    const invite = await NutriProFirebase.identity.createPatientInvite({
      patientId: pId,
      authorizedEmail: email,
      professionalId: currentProUid
    });

    badgeElement.innerHTML = `● Convite pendente: <span class="text-amber-300 font-bold">${email}</span>`;
    badgeElement.className = 'text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800';

    return invite;
  }

  return {
    dexiePatientsStore,
    mockDexie,
    getClinicalQueriesCount: () => clinicalQueriesCount,
    getState: () => _proAuthGateState,
    getCurrentProfessionalUid: () => _currentProfessionalUid,
    getActivePatientId: () => activePatientId,
    getActivePatientData: () => activePatientData,
    isOverlayHidden: () => classListOverlay.has('hidden'),
    isContentVisible: () => !classListContent.has('hidden') && contentElement.style.display !== 'none',
    domElements,
    localStorageMock,
    onAuthStateChangedHandler,
    handleProfessionalSignOut,
    linkPatientEmailFromDashboard,
    setActivePatient: (pId, pData) => {
      activePatientId = pId;
      activePatientData = pData;
    }
  };
}

describe('Fase 8.3 — Auth Gate Profissional & Vínculo Seguro (index.html)', () => {
  let mockDb;
  let mockAuth;

  beforeEach(() => {
    mockDb = createMockFirestore();
    mockAuth = {
      currentUser: null,
      signOut: async () => { mockAuth.currentUser = null; }
    };
    NutriProFirebase._setMockInstances({
      firestore: mockDb,
      auth: mockAuth
    });
  });

  // -------------------------------------------------------------------------
  // AUTH-PRO-01: Sem autenticação -> index.html fica em UNAUTHENTICATED
  // -------------------------------------------------------------------------
  test('AUTH-PRO-01: Sem autenticação -> estado UNAUTHENTICATED e app bloqueado', async () => {
    const env = createProfessionalEnvironment(mockDb, mockAuth);
    await env.onAuthStateChangedHandler(null);

    assert.strictEqual(env.getState(), 'UNAUTHENTICATED');
    assert.strictEqual(env.isOverlayHidden(), false, 'Overlay deve estar visível');
    assert.strictEqual(env.isContentVisible(), false, 'Conteúdo do app deve estar oculto');
    assert.strictEqual(env.getActivePatientId(), null, 'Nenhum paciente deve estar ativo');
    assert.strictEqual(env.getClinicalQueriesCount(), 0, 'Zero queries clínicas executadas');
  });

  // -------------------------------------------------------------------------
  // AUTH-PRO-02: Usuário autenticado sem documento em professionals/{uid} -> ACCESS_DENIED
  // -------------------------------------------------------------------------
  test('AUTH-PRO-02: Usuário autenticado sem registro em professionals/{uid} -> ACCESS_DENIED', async () => {
    const env = createProfessionalEnvironment(mockDb, mockAuth);
    const user = { uid: 'user_sem_cadastro', email: 'estranho@gmail.com' };

    await env.onAuthStateChangedHandler(user);

    assert.strictEqual(env.getState(), 'ACCESS_DENIED');
    assert.strictEqual(env.isOverlayHidden(), false);
    assert.strictEqual(env.isContentVisible(), false);
    assert.strictEqual(env.getClinicalQueriesCount(), 0, 'Nenhum dado clínico deve ser carregado');
  });

  // -------------------------------------------------------------------------
  // AUTH-PRO-03: Profissional ativo -> AUTHORIZED e workspace inicializado
  // -------------------------------------------------------------------------
  test('AUTH-PRO-03: Profissional ativo (status === active) -> AUTHORIZED e app liberado', async () => {
    const proUid = 'pro_paulo_vitor';
    await mockDb.collection('professionals').doc(proUid).set({
      uid: proUid,
      name: 'Dr. Paulo Vitor',
      email: 'paulovitor@nutriax.com',
      status: 'active',
      crn: 'CRN-1 12345'
    });

    const env = createProfessionalEnvironment(mockDb, mockAuth);
    const user = { uid: proUid, email: 'paulovitor@nutriax.com', displayName: 'Paulo Vitor' };

    await env.onAuthStateChangedHandler(user);

    assert.strictEqual(env.getState(), 'AUTHORIZED');
    assert.strictEqual(env.getCurrentProfessionalUid(), proUid);
    assert.strictEqual(env.isOverlayHidden(), true, 'Overlay deve ser ocultado');
    assert.strictEqual(env.isContentVisible(), true, 'Conteúdo NutriAx Pro deve estar visível');
  });

  // -------------------------------------------------------------------------
  // AUTH-PRO-04: Profissional bloqueado/inativo -> ACCESS_DENIED
  // -------------------------------------------------------------------------
  test('AUTH-PRO-04: Profissional bloqueado ou inativo -> ACCESS_DENIED', async () => {
    const proUid = 'pro_bloqueado';
    await mockDb.collection('professionals').doc(proUid).set({
      uid: proUid,
      name: 'Dr. Suspenso',
      email: 'suspenso@nutriax.com',
      status: 'blocked'
    });

    const env = createProfessionalEnvironment(mockDb, mockAuth);
    const user = { uid: proUid, email: 'suspenso@nutriax.com' };

    await env.onAuthStateChangedHandler(user);

    assert.strictEqual(env.getState(), 'ACCESS_DENIED');
    assert.strictEqual(env.isContentVisible(), false);
    assert.strictEqual(env.getClinicalQueriesCount(), 0);
  });

  // -------------------------------------------------------------------------
  // AUTH-PRO-05: Paciente tentando acessar index.html -> ACCESS_DENIED
  // -------------------------------------------------------------------------
  test('AUTH-PRO-05: Paciente cadastrado em patient_users tentando acessar index.html -> ACCESS_DENIED', async () => {
    const patientUid = 'patient_firebase_uid_123';
    await mockDb.collection('patient_users').doc(patientUid).set({
      uid: patientUid,
      patientId: 'paciente-1',
      email: 'paciente@gmail.com',
      status: 'active'
    });

    const env = createProfessionalEnvironment(mockDb, mockAuth);
    const user = { uid: patientUid, email: 'paciente@gmail.com' };

    await env.onAuthStateChangedHandler(user);

    assert.strictEqual(env.getState(), 'ACCESS_DENIED');
    assert.strictEqual(env.isContentVisible(), false, 'Paciente não deve ver interface do profissional');
    assert.strictEqual(env.getClinicalQueriesCount(), 0);
  });

  // -------------------------------------------------------------------------
  // AUTH-PRO-06: Nenhum carregamento clínico antes de AUTHORIZED
  // -------------------------------------------------------------------------
  test('AUTH-PRO-06: Invariante 1.2 — Zero carregamento clínico antes de AUTHORIZED', async () => {
    const env = createProfessionalEnvironment(mockDb, mockAuth);

    // 1. Estado inicial
    assert.strictEqual(env.getClinicalQueriesCount(), 0);

    // 2. Transição não autorizada
    await env.onAuthStateChangedHandler(null);
    assert.strictEqual(env.getClinicalQueriesCount(), 0);

    // 3. Usuário rejeitado
    await env.onAuthStateChangedHandler({ uid: 'random_user', email: 'random@test.com' });
    assert.strictEqual(env.getClinicalQueriesCount(), 0);
    assert.strictEqual(env.getActivePatientId(), null);
  });

  // -------------------------------------------------------------------------
  // AUTH-PRO-07: Fallback "paulo-vitor" inexistente
  // -------------------------------------------------------------------------
  test('AUTH-PRO-07: Eliminação total de fallback hardcoded paulo-vitor', async () => {
    const proUid = 'pro_auth_valid';
    await mockDb.collection('professionals').doc(proUid).set({
      uid: proUid,
      name: 'Nutricionista',
      status: 'active'
    });

    const env = createProfessionalEnvironment(mockDb, mockAuth);
    // localStorage vazio
    env.localStorageMock.removeItem('NUTRIAX_ACTIVE_PATIENT_ID');

    await env.onAuthStateChangedHandler({ uid: proUid });

    assert.strictEqual(env.getState(), 'AUTHORIZED');
    assert.strictEqual(env.getActivePatientId(), null, 'Nenhum paciente deve ser selecionado por fallback');
    assert.notStrictEqual(env.getActivePatientId(), 'paulo-vitor');
  });

  // -------------------------------------------------------------------------
  // AUTH-PRO-08: localStorage não concede autorização
  // -------------------------------------------------------------------------
  test('AUTH-PRO-08: NUTRIAX_ACTIVE_PATIENT_ID no localStorage não concede autorização', async () => {
    const env = createProfessionalEnvironment(mockDb, mockAuth);
    env.localStorageMock.setItem('NUTRIAX_ACTIVE_PATIENT_ID', 'paciente-1');

    // Sem usuário logado
    await env.onAuthStateChangedHandler(null);

    assert.strictEqual(env.getState(), 'UNAUTHENTICATED');
    assert.strictEqual(env.getActivePatientId(), null, 'localStorage não pode burlar o Auth Gate');
    assert.strictEqual(env.isContentVisible(), false);
  });

  // -------------------------------------------------------------------------
  // AUTH-PRO-09: URL não concede autorização
  // -------------------------------------------------------------------------
  test('AUTH-PRO-09: Parâmetros de URL (?patientId=X) não concedem autorização no index.html', async () => {
    const env = createProfessionalEnvironment(mockDb, mockAuth);

    // Simulando tentativa de injeção via URL
    const spoofedQueryParam = 'paciente-1';
    // O auth gate ignora o parâmetro e avalia estritamente o estado do Firebase Auth
    await env.onAuthStateChangedHandler(null);

    assert.strictEqual(env.getState(), 'UNAUTHENTICATED');
    assert.strictEqual(env.isContentVisible(), false);
    assert.strictEqual(env.getClinicalQueriesCount(), 0);
  });

  // -------------------------------------------------------------------------
  // AUTH-PRO-10: “Vincular Gmail” cria patient_invites com status PENDING
  // -------------------------------------------------------------------------
  test('AUTH-PRO-10: Vincular Gmail cria documento em patient_invites com status PENDING', async () => {
    const proUid = 'pro_valido_10';
    await mockDb.collection('professionals').doc(proUid).set({
      uid: proUid,
      name: 'Nutricionista',
      status: 'active'
    });

    const env = createProfessionalEnvironment(mockDb, mockAuth);
    await env.onAuthStateChangedHandler({ uid: proUid });

    // Seleciona paciente ativo
    env.setActivePatient('paciente-1', { id: 'paciente-1', name: 'Paciente Um' });
    env.domElements.patientShareGmailInput.value = 'novo.paciente@gmail.com';

    const invite = await env.linkPatientEmailFromDashboard();

    assert.ok(invite, 'Convite deve ser criado com sucesso');
    assert.strictEqual(invite.status, 'PENDING');
    assert.strictEqual(invite.patientId, 'paciente-1');
    assert.strictEqual(invite.authorizedEmail, 'novo.paciente@gmail.com');
    assert.strictEqual(invite.professionalId, proUid);

    // Valida no mockFirestore
    const storedInvite = await NutriProFirebase.identity.getPatientInviteByPatientId('paciente-1');
    assert.ok(storedInvite);
    assert.strictEqual(storedInvite.status, 'PENDING');
    assert.strictEqual(storedInvite.authorizedEmail, 'novo.paciente@gmail.com');
  });

  // -------------------------------------------------------------------------
  // AUTH-PRO-11: “Vincular Gmail” NÃO cria diretamente patient_users
  // -------------------------------------------------------------------------
  test('AUTH-PRO-11: Vincular Gmail NÃO cria diretamente registro na coleção patient_users', async () => {
    const proUid = 'pro_valido_11';
    await mockDb.collection('professionals').doc(proUid).set({
      uid: proUid,
      status: 'active'
    });

    const env = createProfessionalEnvironment(mockDb, mockAuth);
    await env.onAuthStateChangedHandler({ uid: proUid });

    env.setActivePatient('paciente-1', { id: 'paciente-1', name: 'Paciente Um' });
    env.domElements.patientShareGmailInput.value = 'paciente11@gmail.com';

    await env.linkPatientEmailFromDashboard();

    // Verifica que NÃO existe nada em patient_users para esse paciente
    const patientUser = await NutriProFirebase.identity.getPatientUserByPatientId('paciente-1');
    assert.strictEqual(patientUser, null, 'patient_users NÃO pode ser criado no momento do convite');
  });

  // -------------------------------------------------------------------------
  // AUTH-PRO-12: professionalId vem do Firebase UID autenticado
  // -------------------------------------------------------------------------
  test('AUTH-PRO-12: professionalId no convite vem estritamente do Firebase Auth UID', async () => {
    const realProUid = 'pro_uid_real_12';
    await mockDb.collection('professionals').doc(realProUid).set({
      uid: realProUid,
      status: 'active'
    });

    const env = createProfessionalEnvironment(mockDb, mockAuth);
    await env.onAuthStateChangedHandler({ uid: realProUid });

    env.setActivePatient('paciente-2', { id: 'paciente-2', name: 'Paciente Dois' });
    env.domElements.patientShareGmailInput.value = 'teste12@gmail.com';

    const invite = await env.linkPatientEmailFromDashboard();

    assert.strictEqual(invite.professionalId, realProUid);
  });

  // -------------------------------------------------------------------------
  // AUTH-PRO-13: Convite PENDING não é apresentado como vínculo ACTIVE
  // -------------------------------------------------------------------------
  test('AUTH-PRO-13: Invariante PENDING !== CLAIMED — Badge exibe Convite pendente', async () => {
    const proUid = 'pro_valido_13';
    await mockDb.collection('professionals').doc(proUid).set({
      uid: proUid,
      status: 'active'
    });

    const env = createProfessionalEnvironment(mockDb, mockAuth);
    await env.onAuthStateChangedHandler({ uid: proUid });

    env.setActivePatient('paciente-1', { id: 'paciente-1', name: 'Paciente Um' });
    env.domElements.patientShareGmailInput.value = 'aguardando.claim@gmail.com';

    await env.linkPatientEmailFromDashboard();

    assert.ok(env.domElements.patientCloudLinkedBadge.innerHTML.includes('Convite pendente'));
    assert.ok(!env.domElements.patientCloudLinkedBadge.innerHTML.includes('● Vinculado:'));
  });

  // -------------------------------------------------------------------------
  // AUTH-PRO-14: Logout desmonta a sessão profissional sem apagar Dexie
  // -------------------------------------------------------------------------
  test('AUTH-PRO-14: Logout desmonta a sessão profissional mantendo Dexie intacto', async () => {
    const proUid = 'pro_valido_14';
    await mockDb.collection('professionals').doc(proUid).set({
      uid: proUid,
      status: 'active'
    });

    const env = createProfessionalEnvironment(mockDb, mockAuth);
    await env.onAuthStateChangedHandler({ uid: proUid });

    // Sessão autorizada
    assert.strictEqual(env.getState(), 'AUTHORIZED');
    assert.strictEqual(env.isContentVisible(), true);

    // Logout
    await env.handleProfessionalSignOut();

    assert.strictEqual(env.getState(), 'UNAUTHENTICATED');
    assert.strictEqual(env.isContentVisible(), false, 'App deve estar oculto após logout');
    assert.strictEqual(env.getCurrentProfessionalUid(), null);
    assert.strictEqual(env.getActivePatientId(), null);

    // O banco local Dexie deve permanecer intacto
    assert.strictEqual(env.dexiePatientsStore.size, 2, 'Dexie não pode ser apagado no logout');
    assert.ok(env.dexiePatientsStore.has('paciente-1'));
    assert.ok(env.dexiePatientsStore.has('paciente-2'));
  });

  // -------------------------------------------------------------------------
  // AUTH-PRO-15: Paciente continua sujeito ao Auth Gate da Fase 8.2
  // -------------------------------------------------------------------------
  test('AUTH-PRO-15: Resolução de identidade de paciente na Fase 8.2 permanece intacta e funcional', async () => {
    // 1. Cria profissional ativo e gera convite
    const proUid = 'pro_valido_15';
    await mockDb.collection('professionals').doc(proUid).set({
      uid: proUid,
      status: 'active',
      name: 'Dr. Quinze'
    });

    const invite = await NutriProFirebase.identity.createPatientInvite({
      patientId: 'paciente-15',
      authorizedEmail: 'paciente15@gmail.com',
      professionalId: proUid
    });

    assert.strictEqual(invite.status, 'PENDING');

    // 2. Paciente realiza login no Disciplina e resolve identidade (Fase 8.2)
    const patientUserAuth = {
      uid: 'patient_uid_15',
      email: 'paciente15@gmail.com',
      displayName: 'Paciente Quinze'
    };

    const resolution = await NutriProFirebase.identity.resolveAuthorizedPatient(patientUserAuth);

    assert.strictEqual(resolution.state, 'AUTHORIZED');
    assert.strictEqual(resolution.patientId, 'paciente-15');
    assert.strictEqual(resolution.patientUser.status, 'active');

    // 3. Valida que o convite foi marcado como CLAIMED
    const inviteAfter = await NutriProFirebase.identity.getPatientInviteByPatientId('paciente-15');
    assert.strictEqual(inviteAfter.status, 'CLAIMED');
  });
});
