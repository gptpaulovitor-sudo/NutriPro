// =========================================================================
// NutriAx Pro & Disciplina — Suíte de Testes de Identidade e Autorização (Fase 8.1)
// =========================================================================

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');

// Carrega o serviço de Firebase
const NutriProFirebase = require('../firebase-service.js');

// Mock in-memory Firestore e Auth para testes determinísticos
function createMockFirestore() {
  const store = new Map(); // key: `${collection}/${docId}` -> data

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
        },
        async get() {
          const matching = [];
          const prefix = `${colName}/`;
          for (const [key, data] of store.entries()) {
            if (key.startsWith(prefix)) {
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
    }
  };
}

describe('Fase 8.1 — Fundação de Identidade Canônica e Autorização', () => {
  let mockFirestore;
  let mockAuth;

  beforeEach(() => {
    mockFirestore = createMockFirestore();
    mockAuth = {
      currentUser: null
    };
    NutriProFirebase._setMockInstances({
      firestore: mockFirestore,
      auth: mockAuth
    });
  });

  test('1. Usuário sem UID -> não autorizado e currentUser nulo', async () => {
    mockAuth.currentUser = null;
    const user = NutriProFirebase.auth.getCurrentFirebaseUser();
    const uid = NutriProFirebase.auth.getCurrentFirebaseUid();
    const verifiedEmail = NutriProFirebase.auth.getVerifiedFirebaseEmail();

    assert.strictEqual(user, null, 'User deve ser null');
    assert.strictEqual(uid, null, 'UID deve ser null');
    assert.strictEqual(verifiedEmail, null, 'Email deve ser null');

    const isAuthorized = await NutriProFirebase.identity.isProfessionalAuthorized(null);
    assert.strictEqual(isAuthorized, false, 'Sem UID não pode ser autorizado como profissional');

    const patientId = await NutriProFirebase.identity.getAuthorizedPatientId(null);
    assert.strictEqual(patientId, null, 'Sem UID não pode ter patientId autorizado');
  });

  test('2. UID sem patient_users -> sem patientId (retorna null)', async () => {
    const randomUid = 'non_existent_uid_12345';
    const patientId = await NutriProFirebase.identity.getAuthorizedPatientId(randomUid);
    assert.strictEqual(patientId, null, 'UID sem registro em patient_users deve retornar null');

    const patientUser = await NutriProFirebase.identity.getPatientUser(randomUid);
    assert.strictEqual(patientUser, null, 'getPatientUser deve retornar null');
  });

  test('3. UID com patient_users ativo -> retorna patientId correto', async () => {
    const validUid = 'patient_firebase_uid_999';
    await mockFirestore.collection('patient_users').doc(validUid).set({
      firebaseUid: validUid,
      email: 'joao.silva@example.com',
      patientId: 'patient_alpha_42',
      status: 'active',
      role: 'patient',
      professionalId: 'nutri_pro_uid_1'
    });

    const patientId = await NutriProFirebase.identity.getAuthorizedPatientId(validUid);
    assert.strictEqual(patientId, 'patient_alpha_42', 'Deve retornar o patientId exato');

    const patientUser = await NutriProFirebase.identity.getPatientUser(validUid);
    assert.strictEqual(patientUser.role, 'patient');
    assert.strictEqual(patientUser.status, 'active');

    // Se status for blocked, não autoriza
    await mockFirestore.collection('patient_users').doc(validUid).set({
      status: 'blocked'
    }, { merge: true });

    const blockedPatientId = await NutriProFirebase.identity.getAuthorizedPatientId(validUid);
    assert.strictEqual(blockedPatientId, null, 'Paciente bloqueado deve retornar null');
  });

  test('4. Usuário profissional existente e ativo -> reconhecido', async () => {
    const proUid = 'pro_nutri_uid_777';
    await mockFirestore.collection('professionals').doc(proUid).set({
      firebaseUid: proUid,
      email: 'dr.paulo@nutripro.com',
      displayName: 'Dr. Paulo',
      role: 'professional',
      status: 'active'
    });

    const isAuth = await NutriProFirebase.identity.isProfessionalAuthorized(proUid);
    assert.strictEqual(isAuth, true, 'Profissional ativo deve ser reconhecido');

    const profile = await NutriProFirebase.identity.getProfessionalProfile(proUid);
    assert.strictEqual(profile.displayName, 'Dr. Paulo');
    assert.strictEqual(profile.role, 'professional');
  });

  test('5. Usuário comum -> NÃO reconhecido como profissional', async () => {
    const regularUid = 'common_user_uid_111';
    await mockFirestore.collection('users').doc(regularUid).set({
      uid: regularUid,
      email: 'alguem@gmail.com',
      role: 'patient',
      status: 'active'
    });

    const isAuth = await NutriProFirebase.identity.isProfessionalAuthorized(regularUid);
    assert.strictEqual(isAuth, false, 'Usuário comum não deve ter privilégio profissional');

    // Usuário profissional mas inativo/suspenso
    const inactiveProUid = 'pro_inactive_888';
    await mockFirestore.collection('professionals').doc(inactiveProUid).set({
      firebaseUid: inactiveProUid,
      status: 'suspended'
    });
    const isInactiveAuth = await NutriProFirebase.identity.isProfessionalAuthorized(inactiveProUid);
    assert.strictEqual(isInactiveAuth, false, 'Profissional suspenso não deve ser autorizado');
  });

  test('6. Convite PENDING -> elegível para claim e resgatado com sucesso', async () => {
    const proUid = 'pro_nutri_uid_777';
    await mockFirestore.collection('professionals').doc(proUid).set({
      firebaseUid: proUid,
      status: 'active'
    });

    // Profissional cria o convite
    const invite = await NutriProFirebase.identity.createPatientInvite({
      patientId: 'patient_maria_10',
      authorizedEmail: 'maria.souza@gmail.com',
      professionalId: proUid,
      expiresInDays: 7
    });

    assert.ok(invite.inviteId, 'Deve gerar inviteId');
    assert.strictEqual(invite.status, 'PENDING');
    assert.strictEqual(invite.authorizedEmail, 'maria.souza@gmail.com');

    // Paciente busca o convite pelo e-mail
    const pending = await NutriProFirebase.identity.getPendingPatientInviteByEmail('MARIA.SOUZA@GMAIL.COM');
    assert.ok(pending, 'Deve localizar convite pendente mesmo com caixa alta');
    assert.strictEqual(pending.patientId, 'patient_maria_10');

    // Paciente autenticado resgata o convite
    const userAuth = {
      uid: 'firebase_maria_uid_555',
      email: 'maria.souza@gmail.com',
      displayName: 'Maria Souza'
    };

    const result = await NutriProFirebase.identity.claimPatientInvite(invite.inviteId, userAuth);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.patientId, 'patient_maria_10');
    assert.strictEqual(result.firebaseUid, 'firebase_maria_uid_555');

    // Valida que o convite foi marcado como CLAIMED
    const updatedInviteDoc = await mockFirestore.collection('patient_invites').doc(invite.inviteId).get();
    assert.strictEqual(updatedInviteDoc.data().status, 'CLAIMED');
    assert.strictEqual(updatedInviteDoc.data().claimedByUid, 'firebase_maria_uid_555');

    // Valida que o vínculo canônico em patient_users/{uid} foi criado
    const authorizedId = await NutriProFirebase.identity.getAuthorizedPatientId('firebase_maria_uid_555');
    assert.strictEqual(authorizedId, 'patient_maria_10');

    // Valida compatibilidade com registro legado patient_users/{emailKey}
    const legacyDoc = await mockFirestore.collection('patient_users').doc('maria_souza_gmail_com').get();
    assert.strictEqual(legacyDoc.exists, true);
    assert.strictEqual(legacyDoc.data().patientId, 'patient_maria_10');
  });

  test('7. Convite CLAIMED -> não pode ser reutilizado', async () => {
    const inviteId = 'claimed_invite_test';
    await mockFirestore.collection('patient_invites').doc(inviteId).set({
      inviteId,
      patientId: 'patient_x',
      authorizedEmail: 'test@example.com',
      professionalId: 'pro_1',
      status: 'CLAIMED',
      expiresAt: new Date(Date.now() + 86400000).toISOString()
    });

    await assert.rejects(
      async () => {
        await NutriProFirebase.identity.claimPatientInvite(inviteId, {
          uid: 'another_user_uid',
          email: 'test@example.com'
        });
      },
      /Convite não está pendente/
    );
  });

  test('8. Convite REVOKED -> não pode ser utilizado', async () => {
    const inviteId = 'revoked_invite_test';
    await mockFirestore.collection('patient_invites').doc(inviteId).set({
      inviteId,
      patientId: 'patient_x',
      authorizedEmail: 'test@example.com',
      professionalId: 'pro_1',
      status: 'REVOKED',
      expiresAt: new Date(Date.now() + 86400000).toISOString()
    });

    await assert.rejects(
      async () => {
        await NutriProFirebase.identity.claimPatientInvite(inviteId, {
          uid: 'user_uid_1',
          email: 'test@example.com'
        });
      },
      /Convite não está pendente/
    );
  });

  test('9. E-mail diferente -> não pode resgatar convite', async () => {
    const inviteId = 'valid_invite_diff_email';
    await mockFirestore.collection('patient_invites').doc(inviteId).set({
      inviteId,
      patientId: 'patient_x',
      authorizedEmail: 'legitimo@example.com',
      professionalId: 'pro_1',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 86400000).toISOString()
    });

    await assert.rejects(
      async () => {
        await NutriProFirebase.identity.claimPatientInvite(inviteId, {
          uid: 'attacker_uid',
          email: 'invasor@example.com'
        });
      },
      /não corresponde ao e-mail autorizado/
    );
  });

  test('10. patientId não deve ser derivado de URL por nenhuma função nova de identidade', async () => {
    // Simula janela com parâmetros maliciosos na URL
    const fakeWindow = {
      location: {
        search: '?id=malicious_injected_patient_id&patient=malicious_url_id',
        hash: '#data=malicious_hash'
      }
    };

    // getAuthorizedPatientId recebe SOMENTE uid autenticado e NUNCA lê a URL
    const cleanId = await NutriProFirebase.identity.getAuthorizedPatientId('uid_sem_cadastro');
    assert.strictEqual(cleanId, null, 'Não deve inferir patientId da URL quando UID não tem vínculo');

    // Verifica que o código-fonte de getAuthorizedPatientId não acessa search ou location
    const fnSource = NutriProFirebase.identity.getAuthorizedPatientId.toString();
    assert.strictEqual(fnSource.includes('location.search'), false, 'Não deve conter location.search');
    assert.strictEqual(fnSource.includes('URLSearchParams'), false, 'Não deve conter URLSearchParams');
    assert.strictEqual(fnSource.includes('window.location'), false, 'Não deve conter window.location');
  });

  test('11. Diagnóstico de migração não-destrutiva (auditLegacyPatientUsers)', async () => {
    // Registro legado antigo (sem firebaseUid)
    await mockFirestore.collection('patient_users').doc('joao_legado_gmail_com').set({
      email: 'joao.legado@gmail.com',
      patientId: 'patient_legacy_1'
    });

    // Registro canônico novo (com firebaseUid)
    await mockFirestore.collection('patient_users').doc('uid_migrado_2').set({
      firebaseUid: 'uid_migrado_2',
      email: 'maria.nova@gmail.com',
      patientId: 'patient_legacy_2'
    });

    const audit = await NutriProFirebase.identity.auditLegacyPatientUsers();
    assert.strictEqual(audit.length, 2);

    const legacy = audit.find(r => r.email === 'joao.legado@gmail.com');
    assert.ok(legacy);
    assert.strictEqual(legacy.hasFirebaseUid, false);
    assert.strictEqual(legacy.status, 'PENDENTE_MIGRACAO');
    assert.strictEqual(legacy.novoVinculoNecessario, true);

    const canonical = audit.find(r => r.email === 'maria.nova@gmail.com');
    assert.ok(canonical);
    assert.strictEqual(canonical.hasFirebaseUid, true);
    assert.strictEqual(canonical.status, 'VINCULADO_CANONICO');
    assert.strictEqual(canonical.novoVinculoNecessario, false);
  });
});
