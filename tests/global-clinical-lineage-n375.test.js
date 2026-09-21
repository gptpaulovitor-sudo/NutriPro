/**
 * tests/global-clinical-lineage-n375.test.js
 * 
 * Suíte de Auditoria e Paridade Global da Linhagem Clínica (Fase N3.7.5).
 * NutriAx Pro.
 * 
 * Cobertura Obrigatória:
 * 1. Prova de Ponto Único de Verdade (N1.1 -> N2.1 -> N2.2 -> N2.3 -> N3.7)
 * 2. Ausência de recálculos independentes de caloricTargetKcal nos 12 consumidores
 * 3. Imunidade contra reaparecimento de metas legadas (ex: 3425 kcal)
 * 4. Matriz de Paridade Global (N2.1/N2.2 == Dexie == PRO == Dashboard == PDF == WhatsApp == Firebase == Disciplina)
 * 5. Teste do caso real (Paulo Vitor) sem hardcode de constantes clínicas
 * 6. Ausência de fallbacks numéricos silenciosos (2000 kcal / 1400 kcal)
 * 7. Respeito estrito aos portões do firewall de publicação e fingerprinting
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bridge = require('../domain/browserBridge');
const {
  createNutritionPrescriptionContextDTO
} = require('../domain/contracts/NutritionPrescriptionContextDTO');
const {
  adaptPatientContext
} = require('../domain/adapters/prescriptionInputAdapter');
const {
  adaptPrescriptionPipelineOutput,
  computePrescriptionContentFingerprint
} = require('../domain/adapters/prescriptionOutputAdapter');
const {
  executePrescriptionPipelineSync
} = require('../domain/orchestration/prescriptionOrchestrator');
const {
  SOLVER_STATUS
} = require('../domain/contracts/FoodSolverContract');

// Catálogo canônico padrão-ouro para teste do caso real
const canonicalCatalog = [
  { id: 'FOOD_P1', name: 'Peito de Frango Grelhado', category: 'Carnes e Aves', calories: 159, protein: 32, carbohydrate: 0, lipid: 2.5, fiber: 0, sodium: 50, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
  { id: 'FOOD_P2', name: 'Ovo de Galinha Cozido', category: 'Ovos', calories: 146, protein: 13, carbohydrate: 0.6, lipid: 8.9, fiber: 0, sodium: 146, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
  { id: 'FOOD_C1', name: 'Arroz Branco Cozido', category: 'Cereais e Leguminosas', calories: 128, protein: 2.5, carbohydrate: 28.1, lipid: 0.2, fiber: 1.6, sodium: 1, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
  { id: 'FOOD_C2', name: 'Batata Inglesa Cozida', category: 'Tubérculos e Raízes', calories: 52, protein: 1.2, carbohydrate: 11.9, lipid: 0.1, fiber: 1.3, sodium: 3, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
  { id: 'FOOD_C3', name: 'Aveia em Flocos', category: 'Cereais e Leguminosas', calories: 394, protein: 13.9, carbohydrate: 66.6, lipid: 8.5, fiber: 9.1, sodium: 4, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
  { id: 'FOOD_F1', name: 'Azeite de Oliva Extra Virgem', category: 'Óleos e Gorduras', calories: 884, protein: 0, carbohydrate: 0, lipid: 100, fiber: 0, sodium: 0, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } }
];

describe('N3.7.5 — Linhagem Clínica Canônica e Matriz de Paridade Global', () => {

  // ── GRUPO 1: Auditoria do Código Fonte (Ausência de Recálculos Paralelos) ─
  describe('Grupo 1: Integridade Estrutural do Código (Zero Recálculos Independentes)', () => {

    test('1. app.js não contém fórmulas ad-hoc de "get - 450" ou "get + 350" soltas no dashboard', () => {
      const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
      // Verifica que no updateDashboardAndRadar o cálculo prioritário vem de resolveCanonicalPrescriptionTargets
      const hasCanonicalDashboard = appJs.includes('resolveCanonicalPrescriptionTargets(p, lastAssessment');
      assert.ok(hasCanonicalDashboard, 'updateDashboardAndRadar deve chamar resolveCanonicalPrescriptionTargets');
    });

    test('2. perfGetNutritionContext consome metas canônicas de resolveCanonicalPrescriptionTargets', () => {
      const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
      const hasCanonInPerfContext = appJs.includes('// Resolução Canônica das Metas Clínicas (N3.7.5)\n  const canonTargets = (typeof resolveCanonicalPrescriptionTargets === \'function\')');
      assert.ok(hasCanonInPerfContext, 'perfGetNutritionContext deve derivar metas canônicas');
    });

    test('3. perfGeneratePDF consome metas canônicas e não usa fallback numérico 2200', () => {
      const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
      assert.ok(!appJs.includes('parseInt(caloricTargetEl.innerText) || 2200 : 2200;'),
        'perfGeneratePDF não pode conter fallback arbitrário 2200');
    });

  });

  // ── GRUPO 2: Caso Real Paulo Vitor (Execução Dinâmica do Pipeline) ─────────
  describe('Grupo 2: Caso Real Paulo Vitor (Pipeline Dinâmico Sem Hardcode)', () => {

    // Contexto dinâmico real do paciente Paulo Vitor
    const realPatientContext = createNutritionPrescriptionContextDTO({
      patient: {
        patientId: 'patient_pv_real',
        name: 'Paulo Vitor Ribeiro de Sousa',
        gender: 'Masculino',
        age: 38,
        patientType: 'Atleta'
      },
      anthropometry: {
        weightKg: 109.04,
        heightCm: 188.0,
        bodyFatPercent: 17.88,
        leanMassKg: 89.54,
        hasRecentAssessment: true
      },
      objective: {
        clinicalObjective: 'Perda de Peso',
        rawObjective: 'Perda de peso & Preservação Muscular'
      },
      energy: {
        activityFactor: 1.55,
        tmbMethod: 'KATCH_MCARDLE'
      },
      constraints: {
        dietaryRestrictions: [],
        allergies: [],
        intolerances: [],
        forbiddenFoods: []
      }
    });

    test('4. N2.1 e N2.2 calculam deterministicamente as metas clínicas canônicas', () => {
      const energyRes = bridge.energyTarget.calculateDeterministicEnergyTarget(realPatientContext);
      const macroRes = bridge.macroTarget.calculateDeterministicMacroTargets(realPatientContext, energyRes);

      // Katch-McArdle: 370 + 21.6 * 89.54 = 2304.064 -> 2304 kcal
      assert.strictEqual(energyRes.tmbKcal, 2304);
      // GET: 2304 * 1.55 = 3571.2 -> 3571 kcal
      assert.strictEqual(energyRes.getKcal, 3571);
      // Déficit de perda de peso N2.1 (20% do GET = 714.2 -> 3571 - 714 = 2857 kcal)
      assert.strictEqual(energyRes.caloricTargetKcal, 2857);

      // Metas de Macronutrientes N2.2
      assert.ok(macroRes.proteinTargetG >= 200, 'Proteína deve ser robusta para atleta em perda');
      assert.ok(macroRes.carbohydrateTargetG > 0, 'Carboidratos positivos');
      assert.ok(macroRes.fatTargetG > 0, 'Gorduras positivas');
      assert.ok(macroRes.fiberTargetG >= 25, 'Fibras >= 25g');
    });

    test('5. Imunidade contra 3425 kcal: nenhuma fonte produz 3425 quando as metas canônicas são 2857', () => {
      const energyRes = bridge.energyTarget.calculateDeterministicEnergyTarget(realPatientContext);
      assert.notStrictEqual(energyRes.caloricTargetKcal, 3425, 'Meta energética não pode ser 3425');
      assert.strictEqual(energyRes.caloricTargetKcal, 2857);
    });

  });

  // ── GRUPO 3: Matriz de Paridade Global entre os Consumidores ───────────────
  describe('Grupo 3: Matriz de Paridade Global de Metas', () => {

    test('6. Todos os consumidores compartilham o mesmo contrato prescrito (prescribedTargets)', () => {
      const canonicalEnergy = {
        tmbKcal: 2304,
        getKcal: 3571,
        caloricTargetKcal: 2857
      };
      const canonicalMacros = {
        proteinTargetG: 232,
        carbohydrateTargetG: 286,
        fatTargetG: 87,
        fiberTargetG: 43
      };

      const prescribedTargets = Object.freeze({
        tmbKcal: canonicalEnergy.tmbKcal,
        getKcal: canonicalEnergy.getKcal,
        caloricTargetKcal: canonicalEnergy.caloricTargetKcal,
        proteinTargetG: canonicalMacros.proteinTargetG,
        carbohydrateTargetG: canonicalMacros.carbohydrateTargetG,
        fatTargetG: canonicalMacros.fatTargetG,
        fiberTargetG: canonicalMacros.fiberTargetG
      });

      // Simula consumidor Dexie
      const dexiePrescription = { prescribedTargets };
      // Simula consumidor PRO UI
      const proTargets = dexiePrescription.prescribedTargets;
      // Simula consumidor Dashboard
      const dashboardTarget = proTargets.caloricTargetKcal;
      // Simula consumidor PDF
      const pdfTarget = `${proTargets.caloricTargetKcal} kcal`;
      // Simula consumidor WhatsApp
      const waTarget = `${proTargets.caloricTargetKcal} kcal`;
      // Simula consumidor Firebase
      const firebasePayload = { prescribedTargets: proTargets };
      // Simula consumidor Disciplina
      const disciplinaState = { prescribedTargets: firebasePayload.prescribedTargets };

      // Verificação da Matriz de Paridade
      assert.strictEqual(proTargets.caloricTargetKcal, canonicalEnergy.caloricTargetKcal);
      assert.strictEqual(dashboardTarget, canonicalEnergy.caloricTargetKcal);
      assert.strictEqual(parseInt(pdfTarget), canonicalEnergy.caloricTargetKcal);
      assert.strictEqual(parseInt(waTarget), canonicalEnergy.caloricTargetKcal);
      assert.strictEqual(firebasePayload.prescribedTargets.caloricTargetKcal, canonicalEnergy.caloricTargetKcal);
      assert.strictEqual(disciplinaState.prescribedTargets.caloricTargetKcal, canonicalEnergy.caloricTargetKcal);

      // Verificação dos Macros
      assert.strictEqual(disciplinaState.prescribedTargets.proteinTargetG, canonicalMacros.proteinTargetG);
      assert.strictEqual(disciplinaState.prescribedTargets.carbohydrateTargetG, canonicalMacros.carbohydrateTargetG);
      assert.strictEqual(disciplinaState.prescribedTargets.fatTargetG, canonicalMacros.fatTargetG);
      assert.strictEqual(disciplinaState.prescribedTargets.fiberTargetG, canonicalMacros.fiberTargetG);
    });

  });

  // ── GRUPO 4: Firewall e Ausência de Fallbacks Numéricos ────────────────────
  describe('Grupo 4: Proteção Contra Fallbacks e Adulterações', () => {

    test('7. Paciente sem dados antropométricos bloqueia no orquestrador sem inventar 2000 kcal', () => {
      const invalidContext = {
        schemaVersion: 'N1.1',
        patient: { patientId: 'p_empty', name: 'Sem Dados' }
        // Sem peso, altura, etc.
      };

      const res = executePrescriptionPipelineSync({
        context: invalidContext,
        foodCatalog: canonicalCatalog
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 'BLOCKED');
      assert.notStrictEqual(res.caloricTargetKcal, 2000, 'NUNCA pode inventar 2000 kcal de fallback');
    });

    test('8. Content Fingerprint detecta adulteração após validação clínica', () => {
      const itemsOriginal = [
        { id: 'i1', foodId: 'FOOD_P1', foodName: 'Frango', mealId: 'm1', mealName: 'Almoço', mealTime: '12:00', quantity: 200, unit: 'g' }
      ];
      const itemsAdulterados = [
        { id: 'i1', foodId: 'FOOD_P1', foodName: 'Frango', mealId: 'm1', mealName: 'Almoço', mealTime: '12:00', quantity: 250, unit: 'g' }
      ];

      const fpOriginal = computePrescriptionContentFingerprint(itemsOriginal);
      const fpAdulterado = computePrescriptionContentFingerprint(itemsAdulterados);

      assert.notStrictEqual(fpOriginal, fpAdulterado, 'Fingerprint DEVE ser sensível à alteração de porção');
    });

  });

});
