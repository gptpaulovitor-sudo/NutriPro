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

  async function loadDisciplineFromCloud(patientId) {
    if (!init()) return null;
    if (!patientId) return null;

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

  // Ouvinte em tempo real para o painel do nutricionista (onSnapshot)
  function listenToPatientDiscipline(patientId, onUpdateCallback) {
    if (!init()) return () => {};
    if (!patientId) return () => {};

    // Cancela ouvinte anterior se houver
    if (typeof activeDisciplineUnsubscribe === 'function') {
      activeDisciplineUnsubscribe();
      activeDisciplineUnsubscribe = null;
    }

    try {
      const sanitizedId = String(patientId).trim();
      const unsubscribe = firestore.collection('patient_discipline').doc(sanitizedId)
        .onSnapshot((doc) => {
          if (doc.exists) {
            const data = doc.data();
            if (typeof onUpdateCallback === 'function') {
              onUpdateCallback(data);
            }
          }
        }, (error) => {
          console.warn('[NutriPro Firebase] Erro no listener onSnapshot:', error);
        });

      activeDisciplineUnsubscribe = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.warn('[NutriPro Firebase] Falha ao registrar onSnapshot:', error);
      return () => {};
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. SINCRONIZAÇÃO DE PRESCRIÇÃO E DIETA (Nutricionista ➔ Nuvem ➔ Paciente)
  // ─────────────────────────────────────────────────────────────────────────
  async function syncPrescriptionToCloud(patientId, prescriptionPayload) {
    if (!init()) return false;
    if (!patientId || !prescriptionPayload) return false;

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
    if (!init()) return () => {};
    if (!patientId) return () => {};

    try {
      const sanitizedId = String(patientId).trim();
      return firestore.collection('patient_prescriptions').doc(sanitizedId)
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
      return () => {};
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. API PÚBLICA EXPOSTA GLOBALMENTE (NutriProFirebase)
  // ─────────────────────────────────────────────────────────────────────────
  window.NutriProFirebase = {
    config: firebaseConfig,
    init: init,
    isReady: () => isInitialized,
    auth: {
      signInWithGoogle,
      signOut,
      getCurrentUser,
      onAuthStateChanged
    },
    discipline: {
      syncToCloud: syncDisciplineToCloud,
      loadFromCloud: loadDisciplineFromCloud,
      subscribe: listenToPatientDiscipline
    },
    prescription: {
      syncToCloud: syncPrescriptionToCloud,
      subscribe: listenToPatientPrescription
    }
  };

  // Auto-inicialização quando a SDK já estiver presente no DOM
  if (typeof document !== 'undefined') {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(init, 50);
    } else {
      document.addEventListener('DOMContentLoaded', () => setTimeout(init, 50));
    }
  }

})(typeof window !== 'undefined' ? window : this);
