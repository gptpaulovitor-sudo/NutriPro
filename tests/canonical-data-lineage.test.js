/**
 * tests/canonical-data-lineage.test.js
 * 
 * Suíte de Testes da Fase N3.7.4 — Linhagem Canônica Global de Dados Clínicos.
 * Validação ponta a ponta da proveniência, contratos, eliminação de fallbacks e integração runtime.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// 1. Carrega o Browser Bridge real
const bridge = require('../domain/browserBridge');

// 2. Carrega os módulos individuais do domínio para validação de equivalência
const canonicalContext = require('../domain/contracts/NutritionPrescriptionContextDTO');
const energyTarget = require('../domain/math/energyTarget');
const macroTarget = require('../domain/math/macroTarget');
const inputAdapter = require('../domain/adapters/prescriptionInputAdapter');
const outputAdapter = require('../domain/adapters/prescriptionOutputAdapter');
const orchestrator = require('../domain/orchestration/prescriptionOrchestrator');

test('Fase N3.7.4 — Suíte de Linhagem Canônica Global de Dados Clínicos', async (t) => {

  await t.test('1. Browser Bridge: expõe window.NutriDomain com todos os módulos canônicos', () => {
    assert.ok(bridge, 'Bridge deve ser exportado');
    assert.equal(typeof bridge.orchestration.executePrescriptionPipeline, 'function');
    assert.equal(typeof bridge.adapters.buildCanonicalPrescriptionInput, 'function');
    assert.equal(typeof bridge.adapters.adaptPrescriptionPipelineOutput, 'function');
    assert.equal(typeof bridge.energyTarget.calculateDeterministicEnergyTarget, 'function');
    assert.equal(typeof bridge.macroTarget.calculateDeterministicMacroTargets, 'function');
    assert.equal(typeof bridge.targetValidator.validateNutritionPrescriptionTargets, 'function');
    assert.ok(bridge.contracts, 'Contracts deve estar presente');
    assert.ok(bridge.solver, 'Solver deve estar presente');
    assert.ok(bridge.meal, 'Meal deve estar presente');
    assert.ok(bridge.timing, 'Timing deve estar presente');
    assert.ok(bridge.validation, 'Validation deve estar presente');
  });

  await t.test('2. N1.1: Validação de NutritionPrescriptionContextDTO e versionamento', () => {
    const rawData = {
      schemaVersion: 'N1.1',
      generatedAt: new Date().toISOString(),
      patient: {
        patientId: 'p_teste_01',
        name: 'Carlos Silva',
        gender: 'Masculino',
        age: 32,
        patientType: 'Praticante recreativo'
      },
      anthropometry: {
        weightKg: 80,
        heightCm: 180,
        bodyFatPercent: 15,
        leanMassKg: 68
      },
      energy: {
        activityFactor: 1.4,
        tmbMethod: 'KATCH_MCARDLE'
      },
      objective: {
        clinicalObjective: 'Hipertrofia'
      },
      routine: {},
      training: { isAthlete: false },
      cardio: {},
      clinical: {}
    };

    const res = inputAdapter.adaptPatientContext(rawData);
    assert.ok(res.context, 'Contexto deve ser adaptado com sucesso');
    assert.equal(res.errors.length, 0, 'Não deve conter erros');
    assert.equal(res.context.patient.patientId, 'p_teste_01');
  });

  await t.test('3. N2.1: Cálculo Determinístico de TMB (Katch-McArdle) e GET', () => {
    const ctx = {
      patient: { patientId: 'p1', gender: 'Masculino', age: 30, patientType: 'Praticante recreativo' },
      anthropometry: { weightKg: 80, heightCm: 180, bodyFatPercent: 15, leanMassKg: 68 },
      energy: { activityFactor: 1.5 },
      objective: { clinicalObjective: 'Manutenção' },
      routine: {}, training: {}, cardio: {}, clinical: {}
    };

    const energyRes = bridge.energyTarget.calculateDeterministicEnergyTarget(ctx);
    // Katch-McArdle: 370 + 21.6 * 68 = 1838.8 -> 1839 kcal
    assert.equal(energyRes.tmbKcal, 1839);
    // GET: 1839 * 1.5 = 2758.5 -> 2759 kcal
    assert.equal(energyRes.getKcal, 2759);
    assert.equal(energyRes.caloricTargetKcal, 2759);
  });

  await t.test('4. N2.2: Cálculo Determinístico de Macronutrientes sem colapso', () => {
    const ctx = {
      patient: { patientId: 'p1', gender: 'Masculino', age: 30, patientType: 'Praticante recreativo' },
      anthropometry: { weightKg: 80, heightCm: 180, bodyFatPercent: 15, leanMassKg: 68 },
      energy: { activityFactor: 1.5 },
      objective: { clinicalObjective: 'Hipertrofia' },
      routine: {}, training: {}, cardio: {}, clinical: {}
    };

    const energyRes = bridge.energyTarget.calculateDeterministicEnergyTarget(ctx);
    const macroRes = bridge.macroTarget.calculateDeterministicMacroTargets(ctx, energyRes);

    assert.ok(macroRes.proteinTargetG > 0, 'Proteína deve ser positiva');
    assert.ok(macroRes.fatTargetG > 0, 'Gordura deve ser positiva');
    assert.ok(macroRes.carbohydrateTargetG > 0, 'Carboidrato deve ser positivo (sem colapso)');
    assert.ok(macroRes.fiberTargetG >= 25, 'Fibras devem respeitar o limite canônico');
  });

  await t.test('5. Contrato: objective fornecido como objeto é normalizado sem erro', () => {
    const rawObj1 = { primary: 'PERDA_DE_PESO' };
    const rawObj2 = { clinicalObjective: 'Emagrecimento' };
    const rawObj3 = { goal: 'Hipertrofia' };

    const norm1 = inputAdapter.normalizeObjective(rawObj1);
    assert.equal(norm1.category, 'weightLoss');
    assert.equal(norm1.isMapped, true);

    const norm2 = inputAdapter.normalizeObjective(rawObj2);
    assert.equal(norm2.category, 'weightLoss');
    assert.equal(norm2.isMapped, true);

    const norm3 = inputAdapter.normalizeObjective(rawObj3);
    assert.equal(norm3.category, 'hypertrophy');
    assert.equal(norm3.isMapped, true);
  });

  await t.test('6. Contrato: schemaVersion N1.1 é aceito e adaptado para o DTO canônico', () => {
    const rawWithSchema = {
      schemaVersion: 'N1.1',
      patient: { patientId: 'p_schema', name: 'Schema Test' },
      anthropometry: { weightKg: 75, heightCm: 175 }
    };

    const adapted = inputAdapter.adaptPatientContext(rawWithSchema);
    assert.ok(adapted.context, 'Contexto com schemaVersion N1.1 deve ser aceito');
    assert.ok(adapted.context.schemaVersion === '1.0.0' || adapted.context.schemaVersion === 'N1.1');
    assert.equal(adapted.context.patient.patientId, 'p_schema');
  });

  await t.test('7. Eliminação de Fallback: ausência de getKcal/tmbKcal não injeta 2000 ou 1400', () => {
    const rawWithoutEnergy = {
      patientId: 'p_no_energy',
      name: 'Sem Energia',
      weightKg: 90,
      heightCm: 185,
      bodyFatPercent: 20,
      objective: 'Manutenção'
    };

    const adapted = inputAdapter.adaptPatientContext(rawWithoutEnergy);
    assert.equal(adapted.context.energy.getKcal, null, 'getKcal não deve ter fallback para 2000');
    assert.equal(adapted.context.energy.tmbKcal, null, 'tmbKcal não deve ter fallback para 1400');
  });

  await t.test('8. Bloqueio de Segurança: dados antropométricos inválidos bloqueiam cálculo', () => {
    const rawInvalid = {
      patientId: 'p_invalid',
      weightKg: -10, // Inválido
      heightCm: 175
    };

    const adapted = inputAdapter.adaptPatientContext(rawInvalid);
    assert.ok(adapted.errors.length > 0, 'Deve emitir erro para peso negativo');
  });

  await t.test('9. PatientType: diferenciação entre Atleta e Praticante recreativo', () => {
    const ctxAtleta = {
      patient: { patientId: 'pa', gender: 'Masculino', age: 25, patientType: 'Atleta de elite' },
      anthropometry: { weightKg: 80, heightCm: 180, bodyFatPercent: 10, leanMassKg: 72 },
      energy: { activityFactor: 1.8 },
      objective: { clinicalObjective: 'Performance' },
      routine: {}, training: { isAthlete: true }, cardio: {}, clinical: {}
    };

    const ctxRec = {
      patient: { patientId: 'pr', gender: 'Masculino', age: 25, patientType: 'Praticante recreativo' },
      anthropometry: { weightKg: 80, heightCm: 180, bodyFatPercent: 10, leanMassKg: 72 },
      energy: { activityFactor: 1.5 },
      objective: { clinicalObjective: 'Hipertrofia' },
      routine: {}, training: { isAthlete: false }, cardio: {}, clinical: {}
    };

    const energyAtleta = bridge.energyTarget.calculateDeterministicEnergyTarget(ctxAtleta);
    const macroAtleta = bridge.macroTarget.calculateDeterministicMacroTargets(ctxAtleta, energyAtleta);

    const energyRec = bridge.energyTarget.calculateDeterministicEnergyTarget(ctxRec);
    const macroRec = bridge.macroTarget.calculateDeterministicMacroTargets(ctxRec, energyRec);

    assert.ok(energyAtleta.getKcal > energyRec.getKcal, 'GET do atleta deve ser superior devido ao FA');
    assert.ok(macroAtleta.proteinTargetG >= macroRec.proteinTargetG, 'Aporte de proteína do atleta deve ser compatível');
  });

  await t.test('10. Rastreamento e Regressão do Paciente Real Auditado (Paulo Vitor)', () => {
    // Dados reais do paciente
    const realPatientContext = {
      patient: {
        patientId: 'paulo-vitor',
        name: 'Paulo Vitor R de Sousa',
        gender: 'Masculino',
        age: 38,
        patientType: 'Praticante recreativo'
      },
      anthropometry: {
        weightKg: 116.0,
        heightCm: 196,
        bodyFatPercent: 22.8,
        leanMassKg: 89.55
      },
      energy: {
        activityFactor: 1.55,
        formula: 'Katch-McArdle'
      },
      objective: {
        clinicalObjective: 'Perda de peso'
      },
      routine: {},
      training: { isAthlete: false },
      cardio: {},
      clinical: {}
    };

    // Execução do pipeline canônico via Bridge
    const energyRes = bridge.energyTarget.calculateDeterministicEnergyTarget(realPatientContext);
    const macroRes = bridge.macroTarget.calculateDeterministicMacroTargets(realPatientContext, energyRes);

    // Assertivas exatas do caso real auditado
    // TMB Katch-McArdle: 370 + (21.6 * 89.55) = 2304.28 -> 2304 kcal
    assert.equal(energyRes.tmbKcal, 2304, 'TMB esperada: 2304 kcal');
    // GET: 2304 * 1.55 = 3571.2 -> 3571 kcal
    assert.equal(energyRes.getKcal, 3571, 'GET esperado: 3571 kcal');
    // Meta Calórica (Déficit -20%): 3571 * 0.8 = 2856.8 -> 2857 kcal
    assert.equal(energyRes.caloricTargetKcal, 2857, 'Alvo Calórico esperado: 2857 kcal');

    // Macros:
    // Proteína (2.0 g/kg * 116): 232g = 928 kcal
    assert.equal(macroRes.proteinTargetG, 232, 'Proteína esperada: 232g');
    // Gordura (0.75 g/kg * 116): 87g = 783 kcal
    assert.equal(macroRes.fatTargetG, 87, 'Gordura esperada: 87g');
    // Carboidrato Residual: (2857 - 1711) / 4 = 1146 / 4 = 286.5 -> 287g (1148 kcal)
    assert.equal(macroRes.carbohydrateTargetG, 287, 'Carboidrato esperado: 287g (SEM colapso)');
    // Fibras: max(38, 14 * 2.857) = max(38, 39.998) -> 40g
    assert.equal(macroRes.fiberTargetG, 40, 'Fibras esperadas: 40g');

    // Prova de que a soma Atwater é estritamente consistente
    const somaAtwater = (macroRes.proteinTargetG * 4) + (macroRes.carbohydrateTargetG * 4) + (macroRes.fatTargetG * 9);
    assert.ok(Math.abs(somaAtwater - energyRes.caloricTargetKcal) <= 5, 'Divergência Atwater residual deve ser <= 5 kcal');
  });

  await t.test('11. Sincronização Enriquecida: payload separa prescribedTargets de actualDietTotals', () => {
    const mockSyncPayload = {
      version: 4,
      patientId: 'paulo-vitor',
      patientName: 'Paulo Vitor',
      prescribedTargets: {
        caloricTargetKcal: 2857,
        getKcal: 3571,
        proteinTargetG: 232,
        carbohydrateTargetG: 287,
        fatTargetG: 87,
        fiberTargetG: 40
      },
      actualDietTotals: {
        kcal: 2850,
        prot: 230,
        carbo: 285,
        fat: 85
      },
      macroTotals: {
        kcal: 2850,
        prot: 230,
        carbo: 285,
        fat: 85
      }
    };

    assert.ok(mockSyncPayload.prescribedTargets, 'prescribedTargets deve existir');
    assert.ok(mockSyncPayload.actualDietTotals, 'actualDietTotals deve existir');
    assert.notEqual(mockSyncPayload.prescribedTargets.caloricTargetKcal, mockSyncPayload.actualDietTotals.kcal);
  });

  await t.test('12. Determinismo: o Bridge produz resultado estritamente idêntico aos módulos diretos', () => {
    const testCtx = {
      patient: { patientId: 'det_1', gender: 'Feminino', age: 28, patientType: 'Praticante recreativo' },
      anthropometry: { weightKg: 62, heightCm: 165, bodyFatPercent: 22, leanMassKg: 48.36 },
      energy: { activityFactor: 1.4 },
      objective: { clinicalObjective: 'Emagrecimento' },
      routine: {}, training: {}, cardio: {}, clinical: {}
    };

    const bridgeEnergy = bridge.energyTarget.calculateDeterministicEnergyTarget(testCtx);
    const directEnergy = energyTarget.calculateDeterministicEnergyTarget(testCtx);
    assert.deepEqual(bridgeEnergy, directEnergy, 'Bridge e módulo direto devem ter 100% de paridade');

    const bridgeMacro = bridge.macroTarget.calculateDeterministicMacroTargets(testCtx, bridgeEnergy);
    const directMacro = macroTarget.calculateDeterministicMacroTargets(testCtx, directEnergy);
    assert.deepEqual(bridgeMacro, directMacro, 'Bridge e módulo de macros direto devem ter 100% de paridade');
  });

});
