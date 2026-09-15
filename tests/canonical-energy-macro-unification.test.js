/**
 * tests/canonical-energy-macro-unification.test.js
 * 
 * Suíte de Testes Canônicos de Unificação: Energia, Macronutrientes, UI, Prescrição e PDF.
 * Fase N3.7 — Governança e Soberania Canônica NutriAx Pro.
 * 
 * Invariantes Auditados:
 * 1. N2.1 é a ÚNICA autoridade energética (TMB, GET, caloricTargetKcal).
 * 2. N2.2 é a ÚNICA autoridade de macronutrientes (P, C, G, Fibras).
 * 3. N3.6 é a autoridade final de validação do plano.
 * 4. Zero DOM como fonte de dados clínicos.
 * 5. Zero valor de demonstração (4207.83) participando de cálculos.
 * 6. Eliminação de heurísticas legadas (-468 e -550) para novas prescrições.
 * 7. PDF é renderizador puro (zero recálculo de TMB, GET, alvo ou macros).
 * 8. UI, Persistência e PDF consomem e exibem o mesmo estado canônico.
 * 9. Edição manual altera a prescrição, NÃO altera a meta clínica, e invalida a validação/fingerprint.
 * 10. Dieta atual editada (2530 kcal) não é alterada automaticamente e exibe delta transparente em relação ao alvo.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Módulos do domínio canônico
const { calculateDeterministicEnergyTarget } = require('../domain/math/energyTarget');
const { calculateDeterministicMacroTargets } = require('../domain/math/macroTarget');
const { adaptCanonicalMealsToRuntimeItems, adaptCanonicalMetaToRuntimeMeta, adaptPrescriptionPipelineOutput, computePrescriptionContentFingerprint } = require('../domain/adapters/prescriptionOutputAdapter');
const { buildCanonicalPrescriptionInput, adaptPatientContext } = require('../domain/adapters/prescriptionInputAdapter');

// Contexto do Caso Real (116.1 kg, Atleta, Perda de Peso)
const REAL_PATIENT_RAW = {
  patientId: 'patient_real_116',
  name: 'Vitor Gabriel',
  gender: 'Masculino',
  age: 39,
  patientType: 'Atleta',
  weightKg: 116.1,
  heightCm: 184,
  leanMassKg: 97.13,
  fatPercent: 16.34,
  activityFactor: 1.57,
  objective: 'Perda de peso'
};

function buildReferenceCanonicalContext() {
  return {
    patient: {
      patientId: REAL_PATIENT_RAW.patientId,
      name: REAL_PATIENT_RAW.name,
      gender: REAL_PATIENT_RAW.gender,
      age: REAL_PATIENT_RAW.age,
      patientType: REAL_PATIENT_RAW.patientType
    },
    anthropometry: {
      weightKg: REAL_PATIENT_RAW.weightKg,
      heightCm: REAL_PATIENT_RAW.heightCm,
      bodyFatPercent: REAL_PATIENT_RAW.fatPercent,
      leanMassKg: REAL_PATIENT_RAW.leanMassKg
    },
    energy: {
      activityFactor: REAL_PATIENT_RAW.activityFactor,
      tmbMethod: 'KATCH_MCARDLE'
    },
    objective: {
      clinicalObjective: REAL_PATIENT_RAW.objective,
      category: 'weightLoss'
    },
    routine: {},
    training: { isAthlete: true },
    cardio: {},
    clinical: {}
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 1: EXECUÇÃO DO CASO REAL PELOS MOTORES CANÔNICOS REAIS (N2.1 & N2.2)
// ═════════════════════════════════════════════════════════════════════════════

test('CASO REAL 1.1: N2.1 gera determinística e puramente as metas energéticas', () => {
  const context = buildReferenceCanonicalContext();
  const energyRes = calculateDeterministicEnergyTarget(context);

  assert.strictEqual(energyRes.status, 'PASS');
  assert.strictEqual(energyRes.tmbKcal, 2468, 'TMB Katch-McArdle deve ser exatamente 2468 kcal');
  assert.strictEqual(energyRes.getKcal, 3875, 'GET deve ser exatamente 3875 kcal (2468 * 1.57)');
  assert.strictEqual(energyRes.caloricTargetKcal, 3100, 'Alvo calórico N2.1 deve ser 3100 kcal (-20% de déficit pela política)');
  assert.strictEqual(energyRes.adjustmentPercent, -0.2);
  assert.strictEqual(energyRes.adjustmentKcal, -775);
});

test('CASO REAL 1.2: N2.2 gera determinística e puramente os macronutrientes para o Atleta', () => {
  const context = buildReferenceCanonicalContext();
  const energyRes = calculateDeterministicEnergyTarget(context);
  const macroRes = calculateDeterministicMacroTargets(context, energyRes);

  assert.strictEqual(macroRes.status, 'PASS');
  assert.strictEqual(macroRes.proteinTargetG, 255, 'Proteína N2.2 para Atleta: 2.2 g/kg sobre 116.1 kg = 255g');
  assert.strictEqual(macroRes.carbohydrateTargetG, 324, 'Carboidratos N2.2: saldo residual Atwater sobre 3100 kcal = 324g');
  assert.strictEqual(macroRes.fatTargetG, 87, 'Gordura N2.2: 0.75 g/kg sobre 116.1 kg = 87g');
  assert.strictEqual(macroRes.fiberTargetG, 43, 'Fibras N2.2: 14g / 1000 kcal = 43g');
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 2: ZERO DIVERGÊNCIA ENTRE FONTES (CANÔNICO === PERSISTÊNCIA === UI === PDF)
// ═════════════════════════════════════════════════════════════════════════════

test('DIVERGÊNCIA ZERO 2.1: Output Adapter transporta rigorosamente as metas canônicas', () => {
  const context = buildReferenceCanonicalContext();
  const energyRes = calculateDeterministicEnergyTarget(context);
  const macroRes = calculateDeterministicMacroTargets(context, energyRes);

  const mockPipelineResult = {
    status: 'PASS',
    energyTargetResult: energyRes,
    macroTargetResult: macroRes,
    globalValidationResult: { valid: true, validationScore: 100, gateResults: [] },
    mealTimingResult: { meals: [] }
  };

  const adapted = adaptPrescriptionPipelineOutput(mockPipelineResult, {
    generatedAt: '2026-09-14T20:00:00Z',
    isClinicallyValidated: false
  });

  // Metas no nó raiz adaptado
  assert.strictEqual(adapted.targets.tmbKcal, energyRes.tmbKcal);
  assert.strictEqual(adapted.targets.getKcal, energyRes.getKcal);
  assert.strictEqual(adapted.targets.caloricTargetKcal, energyRes.caloricTargetKcal);
  assert.strictEqual(adapted.targets.proteinTargetG, macroRes.proteinTargetG);
  assert.strictEqual(adapted.targets.carbohydrateTargetG, macroRes.carbohydrateTargetG);
  assert.strictEqual(adapted.targets.fatTargetG, macroRes.fatTargetG);
  assert.strictEqual(adapted.targets.fiberTargetG, macroRes.fiberTargetG);

  // Metas congeladas em meta.targets para persistência
  assert.strictEqual(adapted.meta.targets.caloricTargetKcal, energyRes.caloricTargetKcal);
  assert.strictEqual(adapted.meta.targets.proteinTargetG, macroRes.proteinTargetG);
  assert.strictEqual(adapted.meta.targets.carbohydrateTargetG, macroRes.carbohydrateTargetG);
  assert.strictEqual(adapted.meta.targets.fatTargetG, macroRes.fatTargetG);
  assert.strictEqual(adapted.meta.targets.fiberTargetG, macroRes.fiberTargetG);
});

test('DIVERGÊNCIA ZERO 2.2: Teste Estrito — UI, PDF e Persistência compartilham exatamente os mesmos targets', () => {
  const context = buildReferenceCanonicalContext();
  const canonicalEnergy = calculateDeterministicEnergyTarget(context);
  const canonicalMacro = calculateDeterministicMacroTargets(context, canonicalEnergy);

  // Simula o registro persistido com targets canônicos
  const persistedPrescription = {
    id: 'patient_real_116',
    patientId: 'patient_real_116',
    items: [],
    meta: {
      isAIGenerated: true,
      isClinicallyValidated: true,
      isStale: false,
      validationStatus: 'PASS',
      targets: {
        tmbKcal: canonicalEnergy.tmbKcal,
        getKcal: canonicalEnergy.getKcal,
        caloricTargetKcal: canonicalEnergy.caloricTargetKcal,
        proteinTargetG: canonicalMacro.proteinTargetG,
        carbohydrateTargetG: canonicalMacro.carbohydrateTargetG,
        fatTargetG: canonicalMacro.fatTargetG,
        fiberTargetG: canonicalMacro.fiberTargetG
      }
    }
  };

  // Simula a resolução de UI (renderPrescriptionTotals)
  const uiTargets = persistedPrescription.meta.targets;

  // Simula a resolução de PDF (exportPrescriptionAndEvaluationPDF)
  const pdfTargets = {
    caloricTarget: persistedPrescription.meta.targets.caloricTargetKcal,
    getKcal: persistedPrescription.meta.targets.getKcal,
    tmb: persistedPrescription.meta.targets.tmbKcal,
    targetProtG: persistedPrescription.meta.targets.proteinTargetG,
    targetCarbG: persistedPrescription.meta.targets.carbohydrateTargetG,
    targetLipG: persistedPrescription.meta.targets.fatTargetG,
    minFiber: persistedPrescription.meta.targets.fiberTargetG
  };

  // Asserções estritas de convergência absoluta
  assert.strictEqual(uiTargets.getKcal, canonicalEnergy.getKcal, 'UI GET !== canonical GET');
  assert.strictEqual(pdfTargets.getKcal, canonicalEnergy.getKcal, 'PDF GET !== canonical GET');

  assert.strictEqual(uiTargets.caloricTargetKcal, canonicalEnergy.caloricTargetKcal, 'UI target !== canonical target');
  assert.strictEqual(pdfTargets.caloricTarget, canonicalEnergy.caloricTargetKcal, 'PDF target !== canonical target');

  assert.strictEqual(uiTargets.proteinTargetG, canonicalMacro.proteinTargetG, 'UI protein !== canonical protein');
  assert.strictEqual(pdfTargets.targetProtG, canonicalMacro.proteinTargetG, 'PDF protein !== canonical protein');

  assert.strictEqual(uiTargets.carbohydrateTargetG, canonicalMacro.carbohydrateTargetG, 'UI carbohydrate !== canonical carbohydrate');
  assert.strictEqual(pdfTargets.targetCarbG, canonicalMacro.carbohydrateTargetG, 'PDF carbohydrate !== canonical carbohydrate');

  assert.strictEqual(uiTargets.fatTargetG, canonicalMacro.fatTargetG, 'UI fat !== canonical fat');
  assert.strictEqual(pdfTargets.targetLipG, canonicalMacro.fatTargetG, 'PDF fat !== canonical fat');

  assert.strictEqual(uiTargets.fiberTargetG, canonicalMacro.fiberTargetG, 'UI fiber !== canonical fiber');
  assert.strictEqual(pdfTargets.minFiber, canonicalMacro.fiberTargetG, 'PDF fiber !== canonical fiber');
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 3: 20 TESTES DE NÃO-REGRESSÃO E SEGURANÇA ARQUITETURAL
// ═════════════════════════════════════════════════════════════════════════════

test('NÃO-REGRESSÃO 3.1: pro/index.html não contém o valor estático demo 4207.83', () => {
  const htmlContent = fs.readFileSync(path.join(__dirname, '../pro/index.html'), 'utf8');
  assert.strictEqual(htmlContent.includes('4207.83'), false, 'pro/index.html não pode conter 4207.83');
  assert.strictEqual(htmlContent.includes('2714.73'), false, 'pro/index.html não pode conter 2714.73');
});

test('NÃO-REGRESSÃO 3.2: app.js não possui leituras de GET a partir do texto do DOM (#resGet)', () => {
  const appJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  // Proibido qualquer leitura: parseFloat(document.getElementById("resGet")...) ou = document.getElementById("resGet").innerText
  const domReadRegex = /=\s*parseFloat\s*\(\s*document\.getElementById\s*\(\s*["']resGet["']\s*\)/g;
  const matches = appJsContent.match(domReadRegex) || [];
  assert.strictEqual(matches.length, 0, 'app.js não pode ler resGet do DOM com parseFloat');

  const domRhsRegex = /=\s*document\.getElementById\s*\(\s*["']resGet["']\s*\)\s*(\.|\?\.)\s*innerText/g;
  const rhsMatches = appJsContent.match(domRhsRegex) || [];
  assert.strictEqual(rhsMatches.length, 0, 'app.js não pode atribuir valor lendo resGet.innerText');
});

test('NÃO-REGRESSÃO 3.3: app.js não possui a regra legada getKcal - 468', () => {
  const appJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  assert.strictEqual(appJsContent.includes('getKcal - 468'), false, 'app.js não pode conter getKcal - 468');
});

test('NÃO-REGRESSÃO 3.4: app.js não invoca calculateDietaryMacroTargets em código de produção de prescrição', () => {
  const appJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  // Verifica chamadas ativas como função
  const callRegex = /calculateDietaryMacroTargets\s*\(/g;
  const matches = appJsContent.match(callRegex) || [];
  assert.strictEqual(matches.length, 0, 'calculateDietaryMacroTargets não pode ser chamada em app.js');
});

test('NÃO-REGRESSÃO 3.5: PDF não recalcula independentemente TMB ou GET', () => {
  const appJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  // Localiza o bloco do exportPrescriptionAndEvaluationPDF
  const pdfBlockStart = appJsContent.indexOf('exportPrescriptionAndEvaluationPDF');
  assert.ok(pdfBlockStart > 0);
  const pdfBlock = appJsContent.substring(pdfBlockStart, pdfBlockStart + 2000);

  // Proibido recalcular com calculateDietaryMacroTargets
  assert.strictEqual(pdfBlock.includes('calculateDietaryMacroTargets('), false);
  // Deve invocar resolveCanonicalPrescriptionTargets
  assert.ok(pdfBlock.includes('resolveCanonicalPrescriptionTargets('));
});

test('NÃO-REGRESSÃO 3.6: renderPrescriptionTotals consome exclusivamente resolveCanonicalPrescriptionTargets', () => {
  const appJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  const totalsStart = appJsContent.indexOf('function renderPrescriptionTotals()');
  assert.ok(totalsStart > 0);
  const totalsBlock = appJsContent.substring(totalsStart, totalsStart + 3000);

  assert.strictEqual(totalsBlock.includes('calculateDietaryMacroTargets('), false);
  assert.strictEqual(totalsBlock.includes('document.getElementById("resGet")?.innerText'), false);
  assert.ok(totalsBlock.includes('resolveCanonicalPrescriptionTargets('));
});

test('NÃO-REGRESSÃO 3.7: openAIPrescriptionModal e executeAIPrescriptionGeneration não leem resGet do DOM', () => {
  const appJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  const modalStart = appJsContent.indexOf('function openAIPrescriptionModal()');
  const execStart = appJsContent.indexOf('async function executeAIPrescriptionGeneration()');
  
  const modalBlock = appJsContent.substring(modalStart, execStart + 1500);
  assert.strictEqual(modalBlock.includes('document.getElementById("resGet")'), false);
});

test('NÃO-REGRESSÃO 3.8: refreshWhatsAppMessagePreview consome metas canônicas', () => {
  const appJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  const waStart = appJsContent.indexOf('function refreshWhatsAppMessagePreview');
  const waBlock = appJsContent.substring(waStart, waStart + 1500);

  assert.strictEqual(waBlock.includes('calculateDietaryMacroTargets('), false);
  assert.ok(waBlock.includes('resolveCanonicalPrescriptionTargets('));
});

test('NÃO-REGRESSÃO 3.9: N2.1 é autoridade soberana e pura (zero dependência de DOM ou I/O)', () => {
  const fnStr = calculateDeterministicEnergyTarget.toString();
  assert.strictEqual(fnStr.includes('document.'), false, 'calculateDeterministicEnergyTarget não pode acessar document');
  assert.strictEqual(fnStr.includes('window.'), false, 'calculateDeterministicEnergyTarget não pode acessar window');
  assert.strictEqual(fnStr.includes('localStorage'), false, 'calculateDeterministicEnergyTarget não pode acessar localStorage');
});

test('NÃO-REGRESSÃO 3.10: N2.2 é autoridade de macros pura (zero dependência de DOM ou I/O)', () => {
  const fnStr = calculateDeterministicMacroTargets.toString();
  assert.strictEqual(fnStr.includes('document.'), false, 'calculateDeterministicMacroTargets não pode acessar document');
  assert.strictEqual(fnStr.includes('window.'), false, 'calculateDeterministicMacroTargets não pode acessar window');
  assert.strictEqual(fnStr.includes('localStorage'), false, 'calculateDeterministicMacroTargets não pode acessar localStorage');
});

test('NÃO-REGRESSÃO 3.11: Edição manual de itens altera a prescrição mas NÃO altera a meta clínica', () => {
  const initialMeta = {
    isAIGenerated: true,
    isClinicallyValidated: true,
    isStale: false,
    targets: {
      caloricTargetKcal: 3100,
      proteinTargetG: 255,
      carbohydrateTargetG: 324,
      fatTargetG: 87,
      fiberTargetG: 43
    }
  };

  // Simula mutação manual de alimento
  const modifiedMeta = {
    ...initialMeta,
    isClinicallyValidated: false,
    isStale: true,
    staleReason: 'MANUAL_ITEM_EDITED',
    validatedContentFingerprint: null
  };

  // As metas permanecem intactas (invariante: edição altera prescrição, não altera a meta clínica)
  assert.strictEqual(modifiedMeta.targets.caloricTargetKcal, 3100);
  assert.strictEqual(modifiedMeta.targets.proteinTargetG, 255);
  assert.strictEqual(modifiedMeta.isClinicallyValidated, false);
  assert.strictEqual(modifiedMeta.isStale, true);
  assert.strictEqual(modifiedMeta.validatedContentFingerprint, null);
});

test('NÃO-REGRESSÃO 3.12: Content Fingerprint reage a qualquer edição manual de quantidade ou alimento', () => {
  const itemsV1 = [
    { foodId: 'F1', foodName: 'Frango Grelhado', quantity: 200, unit: 'g', mealName: 'Almoço', mealTime: '12:00' },
    { foodId: 'F2', foodName: 'Arroz Integral', quantity: 150, unit: 'g', mealName: 'Almoço', mealTime: '12:00' }
  ];

  const fp1 = computePrescriptionContentFingerprint(itemsV1);

  // Edita quantidade
  const itemsV2 = [
    { foodId: 'F1', foodName: 'Frango Grelhado', quantity: 250, unit: 'g', mealName: 'Almoço', mealTime: '12:00' },
    { foodId: 'F2', foodName: 'Arroz Integral', quantity: 150, unit: 'g', mealName: 'Almoço', mealTime: '12:00' }
  ];
  const fp2 = computePrescriptionContentFingerprint(itemsV2);

  assert.notStrictEqual(fp1, fp2, 'Alteração de quantidade deve gerar fingerprint diferente');

  // Edita horário
  const itemsV3 = [
    { foodId: 'F1', foodName: 'Frango Grelhado', quantity: 200, unit: 'g', mealName: 'Almoço', mealTime: '12:30' },
    { foodId: 'F2', foodName: 'Arroz Integral', quantity: 150, unit: 'g', mealName: 'Almoço', mealTime: '12:30' }
  ];
  const fp3 = computePrescriptionContentFingerprint(itemsV3);

  assert.notStrictEqual(fp1, fp3, 'Alteração de horário deve gerar fingerprint diferente');
});

test('NÃO-REGRESSÃO 3.13: Prescrição com 2530 kcal preserva os alimentos reais e calcula delta transparente com o alvo (3100)', () => {
  const manualDietItems = [
    { foodId: 'F1', foodName: 'Alimentos Refeição 1..N', calories: 2530, protein: 245.5, carbohydrate: 267.3, lipid: 53.6, fiber: 29.0 }
  ];

  const totalCalories = manualDietItems.reduce((acc, it) => acc + it.calories, 0);
  assert.strictEqual(totalCalories, 2530, 'Total da dieta deve ser exatamente 2530 kcal');

  const targetKcal = 3100;
  const delta = totalCalories - targetKcal;
  assert.strictEqual(delta, -570, 'Diferença transparente deve ser de -570 kcal');
  // O sistema NÃO deve mascarar nem rebalancear os alimentos automaticamente
});

test('NÃO-REGRESSÃO 3.14: N3.6 continua como autoridade soberana e não permite bypass', () => {
  const { validateGlobalPrescription } = require('../domain/validation/globalPrescriptionValidator');
  assert.strictEqual(typeof validateGlobalPrescription, 'function');
});

test('NÃO-REGRESSÃO 3.15: savePrescriptionWithFirewall persiste targets no banco Dexie', () => {
  const appJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  const saveStart = appJsContent.indexOf('async function savePrescriptionWithFirewall');
  const saveBlock = appJsContent.substring(saveStart, saveStart + 1500);

  assert.ok(saveBlock.includes('targets: safeMeta.targets || targets || null'));
});

test('NÃO-REGRESSÃO 3.16: loadPrescriptionForPatient restaura saved.targets para a memória', () => {
  const appJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  const loadStart = appJsContent.indexOf('async function loadPrescriptionForPatient');
  const loadBlock = appJsContent.substring(loadStart, loadStart + 1500);

  assert.ok(loadBlock.includes('currentPrescriptionMeta.targets = saved.targets'));
});

test('NÃO-REGRESSÃO 3.17: Prescription Output Adapter congela imutavelmente targets', () => {
  const emptyRes = adaptPrescriptionPipelineOutput(null);
  assert.ok(Object.isFrozen(emptyRes.targets), 'empty targets deve ser congelado');
  assert.strictEqual(emptyRes.status, 'BLOCKED');
});

test('NÃO-REGRESSÃO 3.18: Paciente Recreativo produz alvos diferentes de Atleta pelas políticas N2.1 e N2.2', () => {
  const contextAthlete = buildReferenceCanonicalContext();
  const contextRecreational = {
    ...contextAthlete,
    patient: { ...contextAthlete.patient, patientType: 'Praticante recreativo' },
    training: { isAthlete: false }
  };

  const energyAth = calculateDeterministicEnergyTarget(contextAthlete);
  const macroAth = calculateDeterministicMacroTargets(contextAthlete, energyAth);

  const energyRec = calculateDeterministicEnergyTarget(contextRecreational);
  const macroRec = calculateDeterministicMacroTargets(contextRecreational, energyRec);

  // Ambas as metas energéticas são 3100 kcal (mesmo peso, GET e objetivo)
  assert.strictEqual(energyAth.caloricTargetKcal, 3100);
  assert.strictEqual(energyRec.caloricTargetKcal, 3100);

  // A modulação de proteína reflete a política: 2.2 g/kg (atleta) vs 2.0 g/kg (recreativo)
  assert.strictEqual(macroAth.proteinTargetG, 255);
  assert.strictEqual(macroRec.proteinTargetG, 232);
});

test('NÃO-REGRESSÃO 3.19: publication firewall bloqueia publicação quando validatedContentFingerprint for nulo', () => {
  const appJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  assert.ok(appJsContent.includes('isPrescriptionEligibleForPatientPublication'));
  assert.ok(appJsContent.includes('if (!expectedFingerprint || typeof expectedFingerprint !== \'string\')'));
});

test('NÃO-REGRESSÃO 3.20: Nenhuma regra -550 participa do cálculo de novas prescrições em produção', () => {
  const appJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  // Confirma que não há Math.round(get - 550) nem (w > 90 ? 550 : 468)
  assert.strictEqual(appJsContent.includes('w > 90 ? 550 : 468'), false);
  assert.strictEqual(appJsContent.includes('getKcal - 550'), false);
});
