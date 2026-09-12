# AUDITORIA PRÉ-IMPLEMENTAÇÃO DA FASE 8.3
## NutriAx Pro — Ambiente Profissional (index.html)

**Data:** 12 de Setembro de 2026  
**Status da Auditoria:** CONCLUÍDA  
**Status da Implementação:** NÃO INICIADA  

---

## 1. ESTADO ATUAL DA AUTENTICAÇÃO NO AMBIENTE PROFISSIONAL

* **Presença no `index.html`:** O arquivo `index.html` atualmente carrega os scripts do Firebase SDK (`firebase-app-compat.js`, `firebase-auth-compat.js`, `firebase-firestore-compat.js`, `firebase-service.js`), porém **não possui nenhuma barreira de autenticação (Auth Gate)** nem chamadas a `firebase.auth()` em seu ciclo de inicialização.
* **Mecanismos de Login Existentes no `index.html`:** Não existe tela de login, botão de "Entrar com Google" no fluxo principal, nem escuta ativa a `onAuthStateChanged`.
* **Identificação do Profissional:** Atualmente inexistente no cliente. O sistema opera como uma aplicação local anônima ("single-user local-first"), sem verificar o UID do operador ou validar a role profissional.
* **Fallbacks de Identidade:** O sistema não possui identificação por e-mail ou UID. Todo o acesso profissional é concedido sem autenticação.
* **Acesso Administrativo:** Aberto. Qualquer pessoa que abra `index.html` acessa imediatamente os dados clínicos, cadastros de pacientes e ferramentas de prescrição do banco local Dexie.

---

## 2. MAPEAMENTO DO FLUXO ATUAL DE `index.html`

```text
index.html
    ↓
DOMContentLoaded (app.js:46)
    ↓
seedDatabase() (db.js: inicializa banco Dexie caso vazio)
    ↓
localStorage.getItem("NUTRIAX_ACTIVE_PATIENT_ID") || "paulo-vitor" (app.js:68)
    ↓
populatePatientSelect() (app.js:845: lê db.patients.toArray() e popula o <select>)
    ↓
onPatientChange(activePatientId) (app.js:868)
    ↓
db.patients.get(activePatientId)
    ↓
Carrega módulo visível (Dashboard, Radar, Prescrição, Avaliação, etc.)
    ↓
Sincronização em background com Google Drive (se GOOGLE_SCRIPT_URL configurada)
```

### Funções que carregam dados clínicos:
* `onPatientChange(patientId)` (app.js:868)
* `updateDashboardAndRadar(patientId)` (app.js:916)
* `loadPrescriptionForPatient(patientId)` (app.js:918)
* `loadEvaluationForPatient(patientId)` (app.js:920)
* `loadPerformanceForPatient(patientId)` (app.js:922)
* `renderDisciplineDashboard()` (app.js:924)
* `loadAssessmentsAndRenderCharts(patientId)` (app.js:926)
* `loadClinicalExams(patientId)` (app.js:928)
* `loadDietaryRecall(patientId)` (app.js:930)
* `loadAdherenceDashboard(patientId)` (app.js:932)
* `loadPatientAnamnese(patientId)` (app.js:934)
* `renderPatientAppView(patientId)` (app.js:936)

**Nenhuma dessas funções depende de autenticação atualmente.**

---

## 3. MATRIZ DE ORIGENS DE `patientId` NO AMBIENTE PROFISSIONAL

| Origem | Função / Linha | Pode definir `patientId`? | Deve continuar na Fase 8.3? |
| :--- | :--- | :---: | :---: |
| **Dexie (`db.patients`)** | `populatePatientSelect()` (app.js:850) | Sim (lista pacientes existentes) | **SIM** (seleção clínica legítima) |
| **Seleção na UI (`<select>`)** | `#activePatientSelect.onchange` $\rightarrow$ `onPatientChange()` | Sim (navegação do nutricionista) | **SIM** (apenas com profissional logado) |
| **localStorage** | `localStorage.getItem("NUTRIAX_ACTIVE_PATIENT_ID")` (app.js:21, 68) | Sim (restaura última seleção da UI) | **SIM** (como preferência de UI pós-login) |
| **Fallback Hardcoded** | `activePatientId = ... \|\| "paulo-vitor"` (app.js:21, 8604, etc.) | Sim (concede paciente padrão) | **NÃO** (deve exigir seleção real) |
| **URL Search (`?id=`)** | `app.js` não possui roteamento primário por `?id=` | Não | **NÃO** (manter sem influência) |
| **URL Hash (`#tab=`)** | `app.js:10388` (`requestedTab = ...`) | Não (define apenas a aba ativa) | **SIM** (apenas navegação de abas) |

---

## 4. IDENTIDADE ATUAL DO PROFISSIONAL

* No código atual do cliente (`app.js` e `index.html`), **não há objeto ou variável de profissional**.
* Na fundação da Fase 8.1 / 8.2 em `firebase-service.js`, já existem as funções:
  * `getProfessionalProfile(uid)`: busca `professionals/{uid}`;
  * `isProfessionalAuthorized(uid)`: valida `professionals/{uid}.status === 'active'`;
  * `createPatientInvite(...)`: valida `isProfessionalAuthorized(professionalId)`.
* **Lacuna Atual:** `index.html` não consome essas funções para autenticar o operador antes de exibir a interface.

---

## 5. CADASTRO E GERAÇÃO DE PACIENTES

* **Criação de Paciente:** Ocorre no modal `#newPatientModal` acionado por `saveNewPatient()` (app.js:3740).
* **Geração de `patientId`:** Converte o nome digitado em slug alfanumérico com hífens (`name.toLowerCase().normalize("NFD")...`).
* **Persistência:**
  1. `await db.patients.put(newPatient);`
  2. `await populatePatientSelect();`
  3. `await onPatientChange(id);`
  4. `await savePatientToCloud(id);` (Google Drive)
* **Geração de Convites:** Atualmente o cadastro NÃO cria convite Firebase. Há apenas um campo de e-mail fake gerado (`${id}@nutriax.com`).

---

## 6. AUDITORIA DE `patient_users`

* No `firebase-service.js`:
  * Linha 762: `getPatientUser(uid)` consulta `patient_users/{uid}` canonicamente.
  * Linha 916: `claimPatientInvite` cria `patient_users/{uid}` com `role: 'patient'` e `status: 'active'`.
  * Linhas 210, 480, 499: Métodos legados `linkEmailToPatient` e `findPatientIdByEmail` ainda possuem ramificações em `doc(emailKey)`.
* No `app.js`:
  * Linha 10309: `linkPatientEmailFromDashboard()` ainda chama o método legado `linkEmailToPatient(email, pId)`.
* **Risco de Conflito:** Na Fase 8.3, `linkPatientEmailFromDashboard()` deve ser adaptado para utilizar `createPatientInvite()` canônico em vez de gravação direta não-autorizada por emailKey.

---

## 7. AUDITAR `patient_invites`

* **Criação:** Exclusiva de profissionais ativos (`isProfessionalAuthorized(professionalId)`).
* **Campos Obrigatórios:** `inviteId`, `patientId`, `authorizedEmail`, `professionalId`, `status: 'PENDING'`, `createdAt`, `expiresAt`.
* **Resgate (Claim):** Exclusivo do paciente autenticado cujo `auth.token.email` coincida com `authorizedEmail`.
* **Validação nas Rules:** `isValidInviteClaim()` já exige imutabilidade total de `patientId`, `professionalId`, `authorizedEmail` e `expiresAt`.

---

## 8. MATRIZ DE FIRESTORE SECURITY RULES (PROFISSIONAL vs PACIENTE vs ANÔNIMO)

| Recurso | Professional (`isProfessional()`) | Patient (`isAuthorizedPatient()`) | Anônimo / Não Autenticado |
| :--- | :---: | :---: | :---: |
| `users/{uid}` | Read / Write | Read/Write apenas no seu UID (sem role pro) | **DENY** |
| `professionals/{uid}` | Read / Write | Read (se autenticado) / Write: **DENY** | **DENY** |
| `patient_users/{uid}` | Read / Write | Read (próprio UID) / Create (via convite PENDING) / Update: **DENY** | **DENY** |
| `patient_invites/{id}` | Read / Create / Delete / Update | Read (se seu email) / Update (só claim PENDING $\rightarrow$ CLAIMED) | **DENY** |
| `patient_discipline/{patientId}` | Read / Write | Read / Write (somente o seu próprio `patientId`) | **DENY** |
| `patient_performance/{patientId}` | Read / Write | Read (somente o seu `patientId`) / Write: **DENY** | **DENY** |
| `patient_prescriptions/{patientId}`| Read / Write | Read (somente o seu `patientId`) / Write: **DENY** | **DENY** |
| `patient_fasting/{patientId}` | Read / Write | Read (somente o seu `patientId`) / Write: **DENY** | **DENY** |
| `patient_fasting_logs/{logId}` | Read / Write | Read / Write (somente logs do seu `patientId`, imutável) | **DENY** |

---

## 9. ISOLAMENTO DE AMBIENTES

* **Vulnerabilidade Atual:** Um paciente com link do `index.html` consegue abrir o ambiente profissional sem qualquer bloqueio.
* **Solução para a Fase 8.3:** Implementar `#professionalAuthGateOverlay` e subordinar toda a UI de `index.html` à validação `isProfessionalAuthorized(user.uid)`. Se um paciente autenticado tentar acessar `index.html`, o Gate exibirá `ACCESS_DENIED: Perfil Não Autorizado para o Ambiente Profissional`.

---

## 10. IMPACTO SOBRE DEXIE, BACKUP JSON E GOOGLE DRIVE

* **Dexie (IndexedDB):** Banco local-first do consultório. A autenticação profissional serve para liberar a chave de acesso à UI e aos dados locais. O Dexie NÃO deve ser destruído no logout (apenas ocultado/fechado na sessão).
* **Backup JSON / Google Drive:** Mecanismo de contingência e preservação de dados clínicos off-line. NÃO deve sofrer alteração estrutural nem ser usado como credencial de autorização.

---

## 11. PONTO EXATO RECOMENDADO PARA O AUTH GATE PROFISSIONAL

1. **Estrutura HTML (`index.html`):**
   * Logo após a abertura de `<body>` (linha 114): criar `<div id="professionalAuthGateOverlay">`.
   * Envolver todo o layout atual (linhas 116 a 6830) dentro de `<div id="nutriaxProAppContent" class="hidden">`.
2. **Ponto de Inicialização JS (`app.js`):**
   * Na função `document.addEventListener("DOMContentLoaded", ...)` (linhas 46-87):
   * Em vez de carregar `activePatientId` e `onPatientChange()` de imediato, invocar `initProfessionalAuthGate()`.
   * Somente após o evento `onAuthStateChanged` resolver `user` e validar `isProfessionalAuthorized(user.uid)` como `true`:
     * Remover a classe `hidden` de `#nutriaxProAppContent`;
     * Ocultar `#professionalAuthGateOverlay`;
     * Prosseguir com `populatePatientSelect()` e `onPatientChange(activePatientId)`.

---

## 12. PONTO EXATO RECOMENDADO PARA GESTÃO DE CONVITES

* **Tela / Componente:** Modal de Compartilhamento `#patientShareModal` (index.html: linhas 6700-6810).
* **Input / Ação Existente:** Campo `patientShareGmailInput` e botão `btnLinkPatientGmail` (`linkPatientEmailFromDashboard()`, app.js: linha 10246).
* **Adaptação Recomendada para Fase 8.3:**
  * No clique de vincular Gmail: obter o UID do profissional autenticado (`currentProfessionalUid`).
  * Chamar `createPatientInvite({ patientId, authorizedEmail, professionalId: currentProfessionalUid })`.
  * Exibir o status do convite (`PENDING`, `CLAIMED`, link do convite) diretamente no modal.

---

## 13. RISCOS IDENTIFICADOS E MITIGAÇÕES

1. **Risco de lockout do profissional:** Se a coleção `professionals/{UID}` estiver vazia no primeiro login, o profissional ficaria bloqueado.
   * *Mitigação:* Provisionar previamente o registro do nutricionista titular na coleção `professionals` do Firestore ou prever script de bootstrap seguro.
2. **Risco de travamento de sync em background:** `savePatientToCloud()` tenta salvar via Google Apps Script sem saber se o usuário está logado.
   * *Mitigação:* Manter `savePatientToCloud()` subordinado a `activePatientId` existente pós-autorização.

---

## 14. ARQUIVOS A SEREM MODIFICADOS NA FASE 8.3

* `index.html` (adição do `#professionalAuthGateOverlay` e envelope `#nutriaxProAppContent`)
* `app.js` (subordinação de `DOMContentLoaded` ao `initProfessionalAuthGate()`, fluxo de logout profissional, adaptação de `linkPatientEmailFromDashboard` para emitir convites)
* `firebase-service.js` (adicionar helper específico de resolução do profissional se necessário)
* `tests/professional-auth-gate.test.js` (nova suíte de testes do Auth Gate Profissional)

---

## 15. ARQUIVOS QUE NÃO DEVEM SER MODIFICADOS NA FASE 8.3

* `db.js` (esquema Dexie)
* `math.js` e `domain/math/*` (cálculos metabólicos e antropométricos)
* `fasting-module.js` (motor de jejum)
* `domain/contracts/TrainingPrescriptionDTO.js` (contrato de treino)
* `paciente.html` (ambiente Disciplina já validado na Fase 8.2)
* Motores de Cardio e Split Engine
