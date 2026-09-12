// =========================================================================
// NutriPro — Firebase Cloud & Google Account Synchronization Service
// Projeto: base-e-load (NutriPRO)
// Arquitetura: Local-First com Sincronização em Tempo Real (Não Destrutiva)
// =========================================================================

(function (window) {
  'use strict';

  // Configuração oficial do projeto Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyCyY3ArUyoQj6XTcOysx6w2WxiB3e4H5oY",
    authDomain: "base-e-load.firebaseapp.com",
    projectId: "base-e-load",
    storageBucket: "base-e-load.firebasestorage.app",
    messagingSenderId: "750223517433",
    appId: "1:750223517433:web:1e45ebb9dc8aceed90a428",
    measurementId: "G-9TXC9PYKY9"
  };

  let app = null;
  let auth = null;
  let firestore = null;
  let isInitialized = false;
  let activeDisciplineUnsubscribe = null;

  function getLocalDateIso(d = new Date()) {
    const date = (d instanceof Date && !isNaN(d)) ? d : new Date(d);
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Inicializa o Firebase de forma segura e resiliente
  function init() {
    if (isInitialized) return true;

    if (typeof firebase === 'undefined') {
      console.warn('[NutriPro Firebase] SDK do Firebase ainda não carregado. Operando em modo offline.');
      return false;
    }

    try {
      if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
      } else {
        app = firebase.app();
      }

      auth = firebase.auth();
      firestore = firebase.firestore();

      // Habilita persistência offline do Firestore quando suportada pelo navegador
      try {
        firestore.enablePersistence({ synchronizeTabs: true }).catch((err) => {
          if (err.code === 'failed-precondition') {
            console.info('[NutriPro Firebase] Persistência limitada (múltiplas abas abertas).');
          } else if (err.code === 'unimplemented') {
            console.info('[NutriPro Firebase] Navegador não suporta persistência indexedDB do Firestore.');
          }
        });
      } catch (_) {}

      isInitialized = true;
      console.log('[NutriPro Firebase] Inicializado com sucesso no projeto:', firebaseConfig.projectId);
      return true;
    } catch (error) {
      console.error('[NutriPro Firebase] Erro ao inicializar Firebase:', error);
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. AUTENTICAÇÃO COM CONTA GOOGLE (Google Sign-In)
  // ─────────────────────────────────────────────────────────────────────────
  async function signInWithGoogle() {
    if (!init()) throw new Error('Firebase não inicializado');
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({ prompt: 'select_account' });

      // Previne erro HTTP 414 (URI Too Long) limpando hash longo de dados da URL antes de abrir o popup
      try {
        if (typeof window !== 'undefined' && window.location.hash && window.location.hash.length > 50) {
          const cleanUrl = window.location.origin + window.location.pathname + window.location.search;
          window.history.replaceState(null, '', cleanUrl);
        }
      } catch (_) {}

      const result = await auth.signInWithPopup(provider);
      const user = result.user;

      const profile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || '',
        lastLogin: new Date().toISOString()
      };

      try {
        localStorage.setItem('nutriax_firebase_user', JSON.stringify(profile));
      } catch (_) {}

      return profile;
    } catch (error) {
      console.error('[NutriPro Firebase] Erro no login Google:', error);
      throw error;
    }
  }

  async function signOut() {
    if (!init()) return;
    try {
      await auth.signOut();
      localStorage.removeItem('nutriax_firebase_user');
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao deslogar:', error);
    }
  }

  function getCurrentUser() {
    if (auth && auth.currentUser) {
      const u = auth.currentUser;
      return {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || u.email.split('@')[0],
        photoURL: u.photoURL || ''
      };
    }
    try {
      const cached = localStorage.getItem('nutriax_firebase_user');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return null;
  }

  function onAuthStateChanged(callback) {
    if (!init()) return () => {};
    return auth.onAuthStateChanged((user) => {
      if (user) {
        const profile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || ''
        };
        try {
          localStorage.setItem('nutriax_firebase_user', JSON.stringify(profile));
        } catch (_) {}
        callback(profile);
      } else {
        localStorage.removeItem('nutriax_firebase_user');
        callback(null);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. SINCRONIZAÇÃO DO PILAR DISCIPLINA (Paciente ➔ Nuvem ➔ Nutricionista)
  // ─────────────────────────────────────────────────────────────────────────
  async function syncDisciplineToCloud(patientId, disciplineState, extraUser = null) {
    if (!init()) return false;
    if (!patientId || !disciplineState) return false;

    try {
      const sanitizedId = String(patientId).trim();
      const user = extraUser || getCurrentUser();

      // Prepara payload compacto e estruturado para o Firestore
      const payload = {
        patientId: sanitizedId,
        lastActiveDate: disciplineState.lastActiveDate || getLocalDateIso(),
        scoreIDC: Number(disciplineState.scoreIDC) || 0,
        streakDays: Number(disciplineState.streakDays) || 1,
        tier: disciplineState.tier || 'Focado 🌱',
        waterCurrent: Number(disciplineState.waterCurrent) || 0,
        waterTarget: Number(disciplineState.waterTarget) || 4000,
        workoutDone: !!disciplineState.workoutDone,
        cardioDone: !!disciplineState.cardioDone,
        sleepHours: Number(disciplineState.sleepHours) || 0,
        sleepQuality: disciplineState.sleepQuality || null,
        sleepLogged: !!disciplineState.sleepLogged,
        meals: Array.isArray(disciplineState.meals) ? disciplineState.meals : [],
        exerciseChecks: disciplineState.exerciseChecks || {},
        foodItemChecks: disciplineState.foodItemChecks || {},
        timeline: Array.isArray(disciplineState.timeline) ? disciplineState.timeline.slice(0, 40) : [],
        history: disciplineState.history || {},
        updatedAtClient: new Date().toISOString(),
        serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (user && user.email) {
        payload.userEmail = user.email;
        payload.userName = user.displayName || '';
        payload.userPhoto = user.photoURL || '';
      }

      // Salva no documento da coleção 'patient_discipline'
      await firestore.collection('patient_discipline').doc(sanitizedId).set(payload, { merge: true });

      // Se o usuário estiver autenticado por e-mail, vincula também a referência pelo e-mail
      if (user && user.email) {
        const emailKey = user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
        await firestore.collection('patient_users').doc(emailKey).set({
          email: user.email,
          patientId: sanitizedId,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      console.info(`[NutriPro Firebase] Disciplina do paciente "${sanitizedId}" sincronizada na nuvem com sucesso!`);
      return true;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao sincronizar disciplina com Firestore:', error);
      return false;
    }
  }

  async function ensureReady(maxRetries = 15, delayMs = 150) {
    let retries = 0;
    while (!init() && retries < maxRetries) {
      await new Promise(r => setTimeout(r, delayMs));
      retries++;
    }
    return isInitialized && !!firestore;
  }

  async function loadDisciplineFromCloud(patientId) {
    if (!patientId) return null;
    const ready = await ensureReady();
    if (!ready) return null;

    try {
      const sanitizedId = String(patientId).trim();
      const docRef = await firestore.collection('patient_discipline').doc(sanitizedId).get();
      if (docRef.exists) {
        return docRef.data();
      }
      return null;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao buscar disciplina do Firestore:', error);
      return null;
    }
  }

  // Ouvinte em tempo real para o painel do nutricionista (onSnapshot com retry)
  function listenToPatientDiscipline(patientId, onUpdateCallback) {
    if (!patientId) return () => {};

    // Cancela ouvinte anterior se houver
    if (typeof activeDisciplineUnsubscribe === 'function') {
      activeDisciplineUnsubscribe();
      activeDisciplineUnsubscribe = null;
    }

    let unsubscribe = null;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      if (!init()) {
        setTimeout(connect, 300);
        return;
      }
      try {
        const sanitizedId = String(patientId).trim();
        unsubscribe = firestore.collection('patient_discipline').doc(sanitizedId)
          .onSnapshot((doc) => {
            if (doc.exists) {
              const data = doc.data();
              if (typeof onUpdateCallback === 'function') {
                onUpdateCallback(data);
              }
            }
          }, (error) => {
            console.warn('[NutriPro Firebase] Erro no listener onSnapshot de disciplina:', error);
          });
        activeDisciplineUnsubscribe = unsubscribe;
      } catch (error) {
        console.warn('[NutriPro Firebase] Falha ao registrar onSnapshot de disciplina:', error);
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      if (activeDisciplineUnsubscribe === unsubscribe) {
        activeDisciplineUnsubscribe = null;
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. SINCRONIZAÇÃO DO PILAR 4: PERFORMANCE (Nutricionista ➔ Nuvem ➔ Outro PC)
  // ─────────────────────────────────────────────────────────────────────────
  async function syncPerformanceToCloud(patientId, performanceRecord) {
    if (!patientId || !performanceRecord) return false;
    const ready = await ensureReady();
    if (!ready) return false;

    try {
      const sanitizedId = String(patientId).trim();
      const payload = {
        id: sanitizedId,
        patientId: sanitizedId,
        activeSplit: performanceRecord.activeSplit || 'PHAT',
        workoutPlan: Array.isArray(performanceRecord.workoutPlan) ? performanceRecord.workoutPlan : [],
        weeklySchedule: Array.isArray(performanceRecord.weeklySchedule) ? performanceRecord.weeklySchedule : [],
        prescribedCardioId: performanceRecord.prescribedCardioId || 'cardio_01',
        cardioPrescription: performanceRecord.cardioPrescription || null,
        heartRateZones: performanceRecord.heartRateZones || null,
        auditData: performanceRecord.auditData || null,
        meta: performanceRecord.meta || null,
        pendingAIValidation: performanceRecord.pendingAIValidation || null,
        lastUpdated: performanceRecord.lastUpdated || new Date().toISOString(),
        serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firestore.collection('patient_performance').doc(sanitizedId).set(payload, { merge: true });
      console.info(`[NutriPro Firebase] Performance do paciente "${sanitizedId}" sincronizada na nuvem com sucesso!`);
      return true;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao sincronizar performance com Firestore:', error);
      return false;
    }
  }

  async function loadPerformanceFromCloud(patientId) {
    if (!patientId) return null;
    const ready = await ensureReady();
    if (!ready) return null;

    try {
      const sanitizedId = String(patientId).trim();
      const docRef = await firestore.collection('patient_performance').doc(sanitizedId).get();
      if (docRef.exists) {
        return docRef.data();
      }
      return null;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao buscar performance do Firestore:', error);
      return null;
    }
  }

  function listenToPatientPerformance(patientId, onUpdateCallback) {
    if (!patientId) return () => {};
    let unsubscribe = null;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      if (!init()) {
        setTimeout(connect, 300);
        return;
      }
      try {
        const sanitizedId = String(patientId).trim();
        unsubscribe = firestore.collection('patient_performance').doc(sanitizedId)
          .onSnapshot((doc) => {
            if (doc.exists) {
              const data = doc.data();
              if (typeof onUpdateCallback === 'function') {
                onUpdateCallback(data);
              }
            }
          }, (error) => {
            console.warn('[NutriPro Firebase] Erro no listener de performance:', error);
          });
      } catch (error) {
        console.warn('[NutriPro Firebase] Falha ao registrar onSnapshot de performance:', error);
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. SINCRONIZAÇÃO DE PRESCRIÇÃO E DIETA (Nutricionista ➔ Nuvem ➔ Paciente)
  // ─────────────────────────────────────────────────────────────────────────
  async function syncPrescriptionToCloud(patientId, prescriptionPayload) {
    if (!patientId || !prescriptionPayload) return false;
    const ready = await ensureReady();
    if (!ready) return false;

    try {
      const sanitizedId = String(patientId).trim();
      await firestore.collection('patient_prescriptions').doc(sanitizedId).set({
        patientId: sanitizedId,
        prescription: prescriptionPayload,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.info(`[NutriPro Firebase] Prescrição do paciente "${sanitizedId}" sincronizada na nuvem!`);
      return true;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao sincronizar prescrição com Firestore:', error);
      return false;
    }
  }

  function listenToPatientPrescription(patientId, onUpdateCallback) {
    if (!patientId) return () => {};
    let unsubscribe = null;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      if (!init()) {
        setTimeout(connect, 300);
        return;
      }
      try {
        const sanitizedId = String(patientId).trim();
        unsubscribe = firestore.collection('patient_prescriptions').doc(sanitizedId)
          .onSnapshot((doc) => {
            if (doc.exists) {
              const data = doc.data();
              if (typeof onUpdateCallback === 'function') {
                onUpdateCallback(data.prescription);
              }
            }
          }, (error) => {
            console.warn('[NutriPro Firebase] Erro no listener de prescrição:', error);
          });
      } catch (error) {
        console.warn('[NutriPro Firebase] Falha ao registrar listener de prescrição:', error);
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }

  async function loadPrescriptionFromCloud(patientId) {
    if (!patientId) return null;
    const ready = await ensureReady();
    if (!ready) return null;

    try {
      const sanitizedId = String(patientId).trim();
      const docRef = await firestore.collection('patient_prescriptions').doc(sanitizedId).get();
      if (docRef.exists) {
        const data = docRef.data();
        return data.prescription || null;
      }
      return null;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao buscar prescrição do Firestore:', error);
      return null;
    }
  }

  async function findPatientIdByEmail(email) {
    if (!email) return null;
    const ready = await ensureReady();
    if (!ready) return null;

    try {
      const emailKey = String(email).trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      const docRef = await firestore.collection('patient_users').doc(emailKey).get();
      if (docRef.exists) {
        const data = docRef.data();
        return data.patientId || null;
      }
      return null;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao pesquisar paciente por email:', error);
      return null;
    }
  }

  async function linkEmailToPatient(email, patientId, userProfile = null) {
    if (!email || !patientId) return false;
    const ready = await ensureReady();
    if (!ready) return false;

    try {
      const emailKey = String(email).trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      await firestore.collection('patient_users').doc(emailKey).set({
        email: String(email).trim().toLowerCase(),
        patientId: String(patientId).trim(),
        displayName: userProfile?.displayName || '',
        photoURL: userProfile?.photoURL || '',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao vincular email ao paciente:', error);
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. SINCRONIZAÇÃO DE JEJUM INTERMITENTE (Pilar 3 · NutriAx Fasting)
  // Coleções: patient_fasting & patient_fasting_logs
  // ─────────────────────────────────────────────────────────────────────────
  async function syncFastingProtocolToCloud(patientId, protocolPayload) {
    if (!patientId || !protocolPayload) return false;
    const ready = await ensureReady();
    if (!ready) return false;

    try {
      const sanitizedId = String(patientId).trim();
      const docRef = firestore.collection('patient_fasting').doc(sanitizedId);

      // Regra T28: Protocolo antigo recebido não sobrescreve versão superior
      const existing = await docRef.get();
      if (existing.exists) {
        const remote = existing.data();
        const remoteVersion = Number(remote?.protocol?.protocolVersion) || 0;
        const incomingVersion = Number(protocolPayload?.protocolVersion) || 0;
        if (incomingVersion > 0 && remoteVersion > incomingVersion) {
          console.warn(`[NutriPro Firebase] Protocolo em nuvem v${remoteVersion} é mais recente que o enviado v${incomingVersion}. Ignorando sobrescrita.`);
          return false;
        }
      }

      await docRef.set({
        patientId: sanitizedId,
        protocol: protocolPayload,
        protocolVersion: protocolPayload.protocolVersion || 1,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.info(`[NutriPro Firebase] Protocolo de jejum do paciente "${sanitizedId}" sincronizado.`);
      return true;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao sincronizar protocolo de jejum com Firestore:', error);
      return false;
    }
  }

  async function loadFastingProtocolFromCloud(patientId) {
    if (!patientId) return null;
    const ready = await ensureReady();
    if (!ready) return null;

    try {
      const sanitizedId = String(patientId).trim();
      const docRef = await firestore.collection('patient_fasting').doc(sanitizedId).get();
      if (docRef.exists) {
        const data = docRef.data();
        return data.protocol || null;
      }
      return null;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao buscar protocolo de jejum do Firestore:', error);
      return null;
    }
  }

  async function syncFastingLogToCloud(patientId, logEntry) {
    if (!patientId || !logEntry || !logEntry.date) return false;
    const ready = await ensureReady();
    if (!ready) return false;

    try {
      const sanitizedId = String(patientId).trim();
      const logId = logEntry.id || `${sanitizedId}_${logEntry.date}`;
      // Regra T27: Idempotência — Mesmo log enviado duas vezes não duplica (doc ID determinístico)
      await firestore.collection('patient_fasting_logs').doc(logId).set({
        ...logEntry,
        id: logId,
        patientId: sanitizedId,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return true;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao sincronizar log de jejum:', error);
      return false;
    }
  }

  async function loadFastingLogsFromCloud(patientId, dateFrom = null, dateTo = null) {
    if (!patientId) return [];
    const ready = await ensureReady();
    if (!ready) return [];

    try {
      const sanitizedId = String(patientId).trim();
      let query = firestore.collection('patient_fasting_logs').where('patientId', '==', sanitizedId);
      if (dateFrom) query = query.where('date', '>=', dateFrom);
      if (dateTo) query = query.where('date', '<=', dateTo);

      const snapshot = await query.get();
      const logs = [];
      snapshot.forEach(doc => {
        logs.push(doc.data());
      });
      logs.sort((a, b) => (b.date > a.date ? 1 : -1));
      return logs;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao carregar logs de jejum:', error);
      return [];
    }
  }

  function listenToPatientFasting(patientId, onUpdateCallback) {
    if (!patientId) return () => {};
    let unsubscribe = null;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      if (!init()) {
        setTimeout(connect, 300);
        return;
      }
      try {
        const sanitizedId = String(patientId).trim();
        unsubscribe = firestore.collection('patient_fasting').doc(sanitizedId)
          .onSnapshot((doc) => {
            if (doc.exists) {
              const data = doc.data();
              if (typeof onUpdateCallback === 'function') {
                onUpdateCallback(data.protocol);
              }
            }
          }, (error) => {
            console.warn('[NutriPro Firebase] Erro no listener de jejum:', error);
          });
      } catch (error) {
        console.warn('[NutriPro Firebase] Falha ao registrar listener de jejum:', error);
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. FASE 8.1 — FUNDAÇÃO DE IDENTIDADE CANÔNICA E AUTORIZAÇÃO POR UID
  // Coleções: users, professionals, patient_users, patient_invites
  // ─────────────────────────────────────────────────────────────────────────

  function getCurrentFirebaseUser() {
    if (auth && auth.currentUser) {
      return {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || null,
        emailVerified: !!auth.currentUser.emailVerified,
        displayName: auth.currentUser.displayName || '',
        photoURL: auth.currentUser.photoURL || ''
      };
    }
    return null;
  }

  function getCurrentFirebaseUid() {
    const user = getCurrentFirebaseUser();
    return user ? user.uid : null;
  }

  function getVerifiedFirebaseEmail() {
    const user = getCurrentFirebaseUser();
    if (!user || !user.email) return null;
    return String(user.email).trim().toLowerCase();
  }

  async function getUserProfile(uid) {
    if (!uid) return null;
    const ready = await ensureReady();
    if (!ready) return null;

    try {
      const docRef = await firestore.collection('users').doc(String(uid).trim()).get();
      if (docRef.exists) {
        return docRef.data();
      }
      return null;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao buscar perfil do usuário:', error);
      return null;
    }
  }

  async function upsertUserProfile(uid, userData = {}) {
    if (!uid) return false;
    const ready = await ensureReady();
    if (!ready) return false;

    try {
      const sanitizedUid = String(uid).trim();
      const payload = {
        uid: sanitizedUid,
        email: userData.email ? String(userData.email).trim().toLowerCase() : '',
        displayName: userData.displayName || '',
        role: userData.role || 'patient',
        status: userData.status || 'active',
        authProvider: userData.authProvider || 'google',
        updatedAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
          ? firebase.firestore.FieldValue.serverTimestamp()
          : new Date().toISOString()
      };

      if (userData.createdAt) {
        payload.createdAt = userData.createdAt;
      }

      await firestore.collection('users').doc(sanitizedUid).set(payload, { merge: true });
      return true;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao salvar perfil do usuário:', error);
      return false;
    }
  }

  async function getProfessionalProfile(uid) {
    if (!uid) return null;
    const ready = await ensureReady();
    if (!ready) return null;

    try {
      const docRef = await firestore.collection('professionals').doc(String(uid).trim()).get();
      if (docRef.exists) {
        return docRef.data();
      }
      return null;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao buscar perfil profissional:', error);
      return null;
    }
  }

  async function isProfessionalAuthorized(uid) {
    if (!uid) return false;
    const profile = await getProfessionalProfile(uid);
    return !!(profile && profile.status === 'active');
  }

  async function getPatientUser(uid) {
    if (!uid) return null;
    const ready = await ensureReady();
    if (!ready) return null;

    try {
      const docRef = await firestore.collection('patient_users').doc(String(uid).trim()).get();
      if (docRef.exists) {
        return docRef.data();
      }
      return null;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao buscar patient_user por UID:', error);
      return null;
    }
  }

  async function getAuthorizedPatientId(uid) {
    if (!uid) return null;
    const patientUser = await getPatientUser(uid);
    if (patientUser && patientUser.status === 'active' && patientUser.patientId) {
      return String(patientUser.patientId).trim();
    }
    return null;
  }

  async function createPatientInvite({ patientId, authorizedEmail, professionalId, expiresInDays = 7 }) {
    if (!patientId || !authorizedEmail || !professionalId) {
      throw new Error('Parâmetros obrigatórios ausentes: patientId, authorizedEmail e professionalId são necessários.');
    }

    const ready = await ensureReady();
    if (!ready) throw new Error('Firebase não inicializado');

    // Valida que o profissional emissor é autorizado
    const isAuth = await isProfessionalAuthorized(professionalId);
    if (!isAuth) {
      throw new Error('Operação não autorizada: apenas profissionais ativos podem gerar convites.');
    }

    const normalizedEmail = String(authorizedEmail).trim().toLowerCase();
    const sanitizedPatientId = String(patientId).trim();
    const sanitizedProfessionalId = String(professionalId).trim();
    const inviteId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (Number(expiresInDays) || 7) * 86400000).toISOString();

    const invitePayload = {
      inviteId,
      patientId: sanitizedPatientId,
      authorizedEmail: normalizedEmail,
      professionalId: sanitizedProfessionalId,
      status: 'PENDING',
      createdAt: now.toISOString(),
      expiresAt,
      claimedAt: null,
      claimedByUid: null,
      updatedAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : now.toISOString()
    };

    try {
      await firestore.collection('patient_invites').doc(inviteId).set(invitePayload);
      console.info(`[NutriPro Firebase] Convite ${inviteId} gerado para paciente ${sanitizedPatientId} (${normalizedEmail})`);
      return invitePayload;
    } catch (error) {
      console.error('[NutriPro Firebase] Erro ao criar convite:', error);
      throw error;
    }
  }

  async function getPendingPatientInviteByEmail(email) {
    if (!email) return null;
    const ready = await ensureReady();
    if (!ready) return null;

    try {
      const normalizedEmail = String(email).trim().toLowerCase();
      const snapshot = await firestore.collection('patient_invites')
        .where('authorizedEmail', '==', normalizedEmail)
        .where('status', '==', 'PENDING')
        .get();

      if (snapshot.empty) return null;

      const now = new Date();
      let validInvite = null;

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.expiresAt && new Date(data.expiresAt) > now) {
          validInvite = { ...data, id: doc.id };
        }
      });

      return validInvite;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao buscar convite pendente por e-mail:', error);
      return null;
    }
  }

  async function claimPatientInvite(inviteId, userAuth) {
    if (!inviteId) throw new Error('ID do convite não fornecido');
    if (!userAuth || !userAuth.uid || !userAuth.email) {
      throw new Error('Usuário não autenticado ou sem e-mail válido para reivindicar convite');
    }

    const ready = await ensureReady();
    if (!ready) throw new Error('Firebase não inicializado');

    const sanitizedInviteId = String(inviteId).trim();
    const inviteDoc = await firestore.collection('patient_invites').doc(sanitizedInviteId).get();

    if (!inviteDoc.exists) {
      throw new Error('Convite inexistente');
    }

    const invite = inviteDoc.data();

    if (invite.status !== 'PENDING') {
      throw new Error(`Convite não está pendente (status atual: ${invite.status})`);
    }

    const now = new Date();
    if (invite.expiresAt && new Date(invite.expiresAt) <= now) {
      throw new Error('Convite expirado');
    }

    const normalizedUserEmail = String(userAuth.email).trim().toLowerCase();
    const normalizedInviteEmail = String(invite.authorizedEmail).trim().toLowerCase();

    if (normalizedUserEmail !== normalizedInviteEmail) {
      throw new Error(`E-mail autenticado (${normalizedUserEmail}) não corresponde ao e-mail autorizado no convite (${normalizedInviteEmail})`);
    }

    const uid = String(userAuth.uid).trim();
    const patientId = String(invite.patientId).trim();
    const professionalId = String(invite.professionalId).trim();
    const serverTimestamp = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
      ? firebase.firestore.FieldValue.serverTimestamp()
      : now.toISOString();

    // 1. Cria o registro canônico em patient_users/{firebaseUid}
    const patientUserData = {
      firebaseUid: uid,
      email: normalizedUserEmail,
      patientId: patientId,
      displayName: userAuth.displayName || '',
      role: 'patient',
      professionalId: professionalId,
      status: 'active',
      authProvider: userAuth.authProvider || 'google',
      inviteId: sanitizedInviteId,
      linkedAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: serverTimestamp
    };

    await firestore.collection('patient_users').doc(uid).set(patientUserData, { merge: true });

    // 2. Mantém compatibilidade com registro legado em patient_users/{emailKey} quando permitido
    try {
      const emailKey = normalizedUserEmail.replace(/[^a-z0-9]/g, '_');
      await firestore.collection('patient_users').doc(emailKey).set({
        email: normalizedUserEmail,
        patientId: patientId,
        firebaseUid: uid,
        displayName: userAuth.displayName || '',
        role: 'patient',
        professionalId: professionalId,
        status: 'active',
        linkedAt: now.toISOString(),
        updatedAt: serverTimestamp
      }, { merge: true });
    } catch (_) {
      // Ignora se o Firestore restringir escritas de pacientes em coleções com chave não-UID
    }

    // 3. Atualiza perfil global em users/{uid}
    await upsertUserProfile(uid, {
      email: normalizedUserEmail,
      displayName: userAuth.displayName || '',
      role: 'patient',
      status: 'active',
      authProvider: userAuth.authProvider || 'google',
      createdAt: now.toISOString()
    });

    // 4. Marca o convite como CLAIMED preservando os campos imutáveis exigidos pelas Rules
    await firestore.collection('patient_invites').doc(sanitizedInviteId).set({
      inviteId: sanitizedInviteId,
      patientId: patientId,
      authorizedEmail: normalizedInviteEmail,
      professionalId: professionalId,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      status: 'CLAIMED',
      claimedAt: now.toISOString(),
      claimedByUid: uid,
      updatedAt: serverTimestamp
    }, { merge: true });

    console.info(`[NutriPro Firebase] Convite ${sanitizedInviteId} resgatado com sucesso por UID ${uid} -> Paciente ${patientId}`);
    return {
      success: true,
      patientId: patientId,
      firebaseUid: uid
    };
  }

  async function auditLegacyPatientUsers() {
    const ready = await ensureReady();
    if (!ready) return [];

    try {
      const snapshot = await firestore.collection('patient_users').get();
      const diagnostic = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const id = doc.id;
        const hasUid = !!data.firebaseUid;
        diagnostic.push({
          docId: id,
          email: data.email || null,
          patientId: data.patientId || null,
          hasFirebaseUid: hasUid,
          firebaseUid: data.firebaseUid || null,
          status: hasUid ? 'VINCULADO_CANONICO' : 'PENDENTE_MIGRACAO',
          novoVinculoNecessario: !hasUid
        });
      });

      return diagnostic;
    } catch (error) {
      console.warn('[NutriPro Firebase] Erro ao auditar patient_users legados:', error);
      return [];
    }
  }

  // Resolução Canônica de Identidade e Autorização do Paciente (Fase 8.2)
  async function resolveAuthorizedPatient(user) {
    if (!user || !user.uid) {
      return { state: 'UNAUTHENTICATED' };
    }

    const ready = await ensureReady();
    if (!ready) {
      return { state: 'ERROR', error: 'Firebase não inicializado' };
    }

    try {
      const uid = String(user.uid).trim();
      const patientUser = await getPatientUser(uid);

      if (patientUser) {
        // INVARIANTE 6: Se o vínculo estiver bloqueado, proíbe acesso imediatamente sem buscar convite
        if (patientUser.status === 'blocked') {
          return { state: 'BLOCKED' };
        }

        // Vínculo ativo canônico
        if (patientUser.status === 'active' && patientUser.role === 'patient' && patientUser.patientId) {
          return {
            state: 'AUTHORIZED',
            patientId: String(patientUser.patientId).trim(),
            patientUser
          };
        }

        return { state: 'AUTHENTICATED_NO_LINK' };
      }

      // 2. Não possui vínculo canônico direto: busca convite pendente pelo e-mail verificado
      const verifiedEmail = (user.email || '').trim().toLowerCase();
      if (!verifiedEmail) {
        return { state: 'AUTHENTICATED_NO_LINK' };
      }

      const pendingInvite = await getPendingPatientInviteByEmail(verifiedEmail);
      if (pendingInvite && pendingInvite.inviteId && pendingInvite.status === 'PENDING') {
        const claimResult = await claimPatientInvite(pendingInvite.inviteId, user);
        if (claimResult && claimResult.success && claimResult.patientId) {
          const freshPatientUser = await getPatientUser(uid);
          if (freshPatientUser && freshPatientUser.status === 'active' && freshPatientUser.patientId) {
            return {
              state: 'AUTHORIZED',
              patientId: String(freshPatientUser.patientId).trim(),
              patientUser: freshPatientUser
            };
          }
        }
      }

      // 3. Sem vínculo canônico e sem convite pendente
      return { state: 'AUTHENTICATED_NO_LINK' };
    } catch (error) {
      console.error('[NutriPro Firebase] Erro em resolveAuthorizedPatient:', error);
      return { state: 'ERROR', error };
    }
  }

  function _setMockInstances(mocks = {}) {
    if (mocks.auth) auth = mocks.auth;
    if (mocks.firestore) firestore = mocks.firestore;
    if (mocks.app) app = mocks.app;
    isInitialized = true;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. API PÚBLICA EXPOSTA GLOBALMENTE (NutriProFirebase)
  // ─────────────────────────────────────────────────────────────────────────
  const NutriProFirebaseAPI = {
    config: firebaseConfig,
    init: init,
    isReady: () => isInitialized,
    _setMockInstances,
    auth: {
      signInWithGoogle,
      signOut,
      getCurrentUser,
      onAuthStateChanged,
      findPatientIdByEmail,
      linkEmailToPatient,
      // Funções canônicas de identidade e autorização (Fase 8.1 / 8.2)
      getCurrentFirebaseUser,
      getCurrentFirebaseUid,
      getVerifiedFirebaseEmail,
      getUserProfile,
      getProfessionalProfile,
      getPatientUser,
      createPatientInvite,
      getPendingPatientInviteByEmail,
      claimPatientInvite,
      getAuthorizedPatientId,
      isProfessionalAuthorized,
      resolveAuthorizedPatient
    },
    identity: {
      getCurrentFirebaseUser,
      getCurrentFirebaseUid,
      getVerifiedFirebaseEmail,
      getUserProfile,
      upsertUserProfile,
      getProfessionalProfile,
      isProfessionalAuthorized,
      getPatientUser,
      getAuthorizedPatientId,
      createPatientInvite,
      getPendingPatientInviteByEmail,
      claimPatientInvite,
      auditLegacyPatientUsers,
      resolveAuthorizedPatient
    },
    discipline: {
      syncToCloud: syncDisciplineToCloud,
      loadFromCloud: loadDisciplineFromCloud,
      subscribe: listenToPatientDiscipline
    },
    performance: {
      syncToCloud: syncPerformanceToCloud,
      loadFromCloud: loadPerformanceFromCloud,
      subscribe: listenToPatientPerformance
    },
    prescription: {
      syncToCloud: syncPrescriptionToCloud,
      loadFromCloud: loadPrescriptionFromCloud,
      subscribe: listenToPatientPrescription
    },
    fasting: {
      syncProtocolToCloud: syncFastingProtocolToCloud,
      loadProtocolFromCloud: loadFastingProtocolFromCloud,
      syncLogToCloud: syncFastingLogToCloud,
      loadLogsFromCloud: loadFastingLogsFromCloud,
      subscribe: listenToPatientFasting
    }
  };

  if (typeof window !== 'undefined') {
    window.NutriProFirebase = NutriProFirebaseAPI;
  }

  // Exportação compatível com CommonJS / Node.js para testes automatizados
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NutriProFirebaseAPI;
  }

  // Auto-inicialização quando a SDK já estiver presente no DOM
  if (typeof document !== 'undefined') {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(init, 50);
    } else {
      document.addEventListener('DOMContentLoaded', () => setTimeout(init, 50));
    }
  }

})(typeof window !== 'undefined' ? window : globalThis);
