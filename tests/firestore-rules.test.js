// =========================================================================
// NutriAx Pro & Disciplina — Testes Conceituais de Segurança de Rules (Fase 8.1.1)
// Simulação Lógica Rigorosa dos Predicados de firestore.rules
// =========================================================================

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Carrega o conteúdo textual de firestore.rules para validação estática
const rulesFilePath = path.join(__dirname, '..', 'firestore.rules');
const rulesContent = fs.readFileSync(rulesFilePath, 'utf8');

// Motor de Avaliação Lógica das Rules (Espelho exato dos predicados em firestore.rules)
function createRulesEngine(databaseState) {
  function isAuthenticated(auth) {
    return !!(auth != null && auth.uid != null);
  }

  function isOwner(auth, uid) {
    return !!(isAuthenticated(auth) && auth.uid === uid);
  }

  function isProfessional(auth) {
    if (!isAuthenticated(auth)) return false;
    const proDoc = databaseState.professionals?.[auth.uid];
    return !!(proDoc && proDoc.status === 'active');
  }

  function isAuthorizedPatient(auth, patientId) {
    if (!isAuthenticated(auth) || !patientId) return false;
    const pUser = databaseState.patient_users?.[auth.uid];
    return !!(pUser &&
      pUser.status === 'active' &&
      pUser.role === 'patient' &&
      pUser.patientId === patientId);
  }

  function isValidInviteClaim(auth, uid, requestData) {
    if (!isAuthenticated(auth) || !isOwner(auth, uid) || !requestData) return false;
    const inviteId = requestData.inviteId;
    if (!inviteId) return false;
    const invite = databaseState.patient_invites?.[inviteId];
    if (!invite || invite.status !== 'PENDING') return false;
    if (!auth.token?.email || invite.authorizedEmail !== auth.token.email) return false;
    if (invite.patientId !== requestData.patientId) return false;
    if (invite.professionalId !== requestData.professionalId) return false;
    if (requestData.firebaseUid !== uid) return false;
    if (requestData.role !== 'patient') return false;
    if (requestData.status !== 'active') return false;
    return true;
  }

  return {
    evaluateRead(collection, docId, auth) {
      if (collection === 'users') {
        return !!(isOwner(auth, docId) || isProfessional(auth));
      }
      if (collection === 'professionals') {
        return isAuthenticated(auth);
      }
      if (collection === 'patient_users') {
        return !!(isProfessional(auth) || isOwner(auth, docId));
      }
      if (collection === 'patient_invites') {
        const resource = databaseState.patient_invites?.[docId];
        return !!(isProfessional(auth) || (
          isAuthenticated(auth) &&
          auth.token?.email &&
          resource &&
          resource.authorizedEmail === auth.token.email
        ));
      }
      if (['patient_discipline', 'patient_performance', 'patient_prescriptions', 'patient_fasting'].includes(collection)) {
        return !!(isProfessional(auth) || isAuthorizedPatient(auth, docId));
      }
      if (collection === 'patient_fasting_logs') {
        const resource = databaseState.patient_fasting_logs?.[docId];
        return !!(isProfessional(auth) || (
          isAuthenticated(auth) &&
          resource &&
          isAuthorizedPatient(auth, resource.patientId)
        ));
      }
      return false;
    },

    evaluateCreate(collection, docId, auth, requestData) {
      if (collection === 'users') {
        return !!(isProfessional(auth) || (
          isOwner(auth, docId) &&
          requestData.uid === docId &&
          (!('role' in requestData) || requestData.role !== 'professional')
        ));
      }
      if (collection === 'professionals') {
        return isProfessional(auth);
      }
      if (collection === 'patient_users') {
        return !!(isProfessional(auth) || isValidInviteClaim(auth, docId, requestData));
      }
      if (collection === 'patient_invites') {
        return isProfessional(auth);
      }
      if (collection === 'patient_discipline') {
        return !!(isProfessional(auth) || (
          isAuthorizedPatient(auth, docId) &&
          requestData.patientId === docId
        ));
      }
      if (['patient_performance', 'patient_prescriptions', 'patient_fasting'].includes(collection)) {
        return isProfessional(auth);
      }
      if (collection === 'patient_fasting_logs') {
        return !!(isProfessional(auth) || (
          isAuthenticated(auth) &&
          requestData &&
          requestData.patientId &&
          isAuthorizedPatient(auth, requestData.patientId)
        ));
      }
      return false;
    },

    evaluateUpdate(collection, docId, auth, requestData) {
      const resource = databaseState[collection]?.[docId];
      if (!resource) return false;

      if (collection === 'users') {
        return !!(isProfessional(auth) || (
          isOwner(auth, docId) &&
          requestData.uid === docId &&
          (!('role' in requestData) || requestData.role === resource.role)
        ));
      }
      if (collection === 'professionals') {
        return isProfessional(auth);
      }
      if (collection === 'patient_users') {
        return isProfessional(auth); // Paciente NUNCA pode alterar vínculo existente
      }
      if (collection === 'patient_invites') {
        if (isProfessional(auth)) return true;
        return !!(
          isAuthenticated(auth) &&
          auth.token?.email &&
          resource.status === 'PENDING' &&
          resource.authorizedEmail === auth.token.email &&
          requestData.status === 'CLAIMED' &&
          requestData.claimedByUid === auth.uid &&
          requestData.patientId === resource.patientId &&
          requestData.authorizedEmail === resource.authorizedEmail &&
          requestData.professionalId === resource.professionalId &&
          requestData.inviteId === resource.inviteId &&
          requestData.createdAt === resource.createdAt &&
          requestData.expiresAt === resource.expiresAt
        );
      }
      if (collection === 'patient_discipline') {
        return !!(isProfessional(auth) || (
          isAuthorizedPatient(auth, docId) &&
          resource.patientId === docId &&
          requestData.patientId === docId
        ));
      }
      if (['patient_performance', 'patient_prescriptions', 'patient_fasting'].includes(collection)) {
        return isProfessional(auth);
      }
      if (collection === 'patient_fasting_logs') {
        return !!(isProfessional(auth) || (
          isAuthenticated(auth) &&
          requestData &&
          resource.patientId &&
          requestData.patientId &&
          resource.patientId === requestData.patientId &&
          isAuthorizedPatient(auth, resource.patientId)
        ));
      }
      return false;
    }
  };
}

describe('Fase 8.1.1 — Matriz de Testes Conceituais de Escalada e Hardening (TEST-RULE-01 a 10)', () => {
  // Configuração do ambiente com 2 pacientes e 1 profissional
  const db = {
    professionals: {
      pro_dr_paulo: {
        firebaseUid: 'pro_dr_paulo',
        status: 'active',
        role: 'professional'
      }
    },
    patient_users: {
      uid_paciente_A: {
        firebaseUid: 'uid_paciente_A',
        email: 'pacienteA@gmail.com',
        patientId: 'paciente-A',
        status: 'active',
        role: 'patient'
      },
      uid_paciente_B: {
        firebaseUid: 'uid_paciente_B',
        email: 'pacienteB@gmail.com',
        patientId: 'paciente-B',
        status: 'active',
        role: 'patient'
      }
    },
    patient_discipline: {
      'paciente-A': { patientId: 'paciente-A', waterCurrent: 2000 },
      'paciente-B': { patientId: 'paciente-B', waterCurrent: 3500 }
    },
    patient_prescriptions: {
      'paciente-A': { patientId: 'paciente-A', calories: 2000 },
      'paciente-B': { patientId: 'paciente-B', calories: 2500 }
    },
    patient_performance: {
      'paciente-A': { patientId: 'paciente-A', split: 'PPL' },
      'paciente-B': { patientId: 'paciente-B', split: 'PHAT' }
    },
    patient_fasting: {
      'paciente-A': { patientId: 'paciente-A', protocol: '16/8' },
      'paciente-B': { patientId: 'paciente-B', protocol: '18/6' }
    },
    patient_fasting_logs: {
      log_b_1: { id: 'log_b_1', patientId: 'paciente-B', hoursFasted: 16 }
    },
    patient_invites: {
      inv_valid_c: {
        inviteId: 'inv_valid_c',
        patientId: 'paciente-C',
        authorizedEmail: 'pacientec@gmail.com',
        professionalId: 'pro_dr_paulo',
        status: 'PENDING',
        createdAt: '2026-09-12T10:00:00Z',
        expiresAt: '2026-09-19T10:00:00Z'
      }
    }
  };

  const authPacienteA = {
    uid: 'uid_paciente_A',
    token: { email: 'pacienteA@gmail.com' }
  };

  const authCommonUser = {
    uid: 'uid_common_user_xyz',
    token: { email: 'common@gmail.com' }
  };

  const engine = createRulesEngine(db);

  test('TEST-RULE-01: Paciente A tenta acessar patient_discipline/paciente-B -> DENY', () => {
    const allowedRead = engine.evaluateRead('patient_discipline', 'paciente-B', authPacienteA);
    const allowedUpdate = engine.evaluateUpdate('patient_discipline', 'paciente-B', authPacienteA, { patientId: 'paciente-B' });
    assert.strictEqual(allowedRead, false, 'Leitura cruzada de disciplina deve ser DENY');
    assert.strictEqual(allowedUpdate, false, 'Escrita cruzada de disciplina deve ser DENY');
  });

  test('TEST-RULE-02: Paciente A tenta patient_prescriptions/paciente-B -> DENY', () => {
    const allowedRead = engine.evaluateRead('patient_prescriptions', 'paciente-B', authPacienteA);
    const allowedWrite = engine.evaluateUpdate('patient_prescriptions', 'paciente-B', authPacienteA, { patientId: 'paciente-B' });
    assert.strictEqual(allowedRead, false, 'Leitura cruzada de prescrição deve ser DENY');
    assert.strictEqual(allowedWrite, false, 'Escrita de prescrição por paciente deve ser DENY');
  });

  test('TEST-RULE-03: Paciente A tenta patient_performance/paciente-B -> DENY', () => {
    const allowedRead = engine.evaluateRead('patient_performance', 'paciente-B', authPacienteA);
    const allowedWrite = engine.evaluateUpdate('patient_performance', 'paciente-B', authPacienteA, { patientId: 'paciente-B' });
    assert.strictEqual(allowedRead, false, 'Leitura cruzada de performance deve ser DENY');
    assert.strictEqual(allowedWrite, false, 'Escrita de performance por paciente deve ser DENY');
  });

  test('TEST-RULE-04: Paciente A tenta patient_fasting/paciente-B -> DENY', () => {
    const allowedRead = engine.evaluateRead('patient_fasting', 'paciente-B', authPacienteA);
    const allowedWrite = engine.evaluateUpdate('patient_fasting', 'paciente-B', authPacienteA, { patientId: 'paciente-B' });
    assert.strictEqual(allowedRead, false, 'Leitura cruzada de jejum deve ser DENY');
    assert.strictEqual(allowedWrite, false, 'Escrita de protocolo de jejum por paciente deve ser DENY');
  });

  test('TEST-RULE-05: Paciente A cria { patientId: "paciente-B" } em patient_fasting_logs -> DENY', () => {
    const allowedCreate = engine.evaluateCreate('patient_fasting_logs', 'log_fake', authPacienteA, {
      patientId: 'paciente-B',
      hoursFasted: 18
    });
    assert.strictEqual(allowedCreate, false, 'Criação de log associado a outro paciente deve ser DENY');
  });

  test('TEST-RULE-06: Paciente A tenta modificar log de B alterando patientId -> DENY', () => {
    const allowedUpdate = engine.evaluateUpdate('patient_fasting_logs', 'log_b_1', authPacienteA, {
      patientId: 'paciente-A',
      hoursFasted: 20
    });
    assert.strictEqual(allowedUpdate, false, 'Modificação de log de outro paciente ou alteração de patientId deve ser DENY');
  });

  test('TEST-RULE-07: Paciente A tenta modificar patient_users/A para { patientId: "B" } -> DENY', () => {
    const allowedUpdate = engine.evaluateUpdate('patient_users', 'uid_paciente_A', authPacienteA, {
      patientId: 'paciente-B'
    });
    assert.strictEqual(allowedUpdate, false, 'Paciente alterando seu próprio patientId deve ser DENY');
  });

  test('TEST-RULE-08: Paciente A tenta alterar role, status, professionalId do próprio patient_users -> DENY', () => {
    const allowedUpdate = engine.evaluateUpdate('patient_users', 'uid_paciente_A', authPacienteA, {
      role: 'professional',
      status: 'active',
      professionalId: 'pro_fake'
    });
    assert.strictEqual(allowedUpdate, false, 'Paciente alterando role/status em patient_users deve ser DENY');
  });

  test('TEST-RULE-09: Usuário comum tenta criar professionals/{seuUID} -> DENY', () => {
    const allowedCreate = engine.evaluateCreate('professionals', 'uid_common_user_xyz', authCommonUser, {
      firebaseUid: 'uid_common_user_xyz',
      role: 'professional',
      status: 'active'
    });
    assert.strictEqual(allowedCreate, false, 'Criação direta de registro profissional por usuário comum deve ser DENY');
  });

  test('TEST-RULE-10: Usuário comum tenta alterar professionals/{seuUID}.status = "active" -> DENY', () => {
    const allowedUpdate = engine.evaluateUpdate('professionals', 'uid_common_user_xyz', authCommonUser, {
      status: 'active'
    });
    assert.strictEqual(allowedUpdate, false, 'Ativação ou alteração de professionals por usuário comum deve ser DENY');
  });

  test('Validação Estática de firestore.rules', () => {
    // Confirma ausência de isOwner(uid) no write de professionals
    assert.strictEqual(
      rulesContent.includes('match /professionals/{uid} {\n      // Usuários autenticados podem consultar dados de profissionais (ex: exibição do nutricionista responsável)\n      allow read: if isAuthenticated();\n\n      // Escrita EXCLUSIVA de profissionais já ativos (ou gestão administrativa server-side).\n      // Zero auto-promoção ou auto-criação por usuários comuns.\n      allow write: if isProfessional();\n    }'),
      true,
      'professionals não deve permitir escrita por isOwner(uid)'
    );

    // Confirma que isAuthorizedPatient valida role == patient
    assert.strictEqual(
      rulesContent.includes("data.role == 'patient'"),
      true,
      'isAuthorizedPatient deve verificar role == patient'
    );

    // Confirma que update em fasting_logs exige igualdade entre resource e request.resource
    assert.strictEqual(
      rulesContent.includes('resource.data.patientId == request.resource.data.patientId'),
      true,
      'patient_fasting_logs deve exigir imutabilidade de patientId'
    );
  });
});
