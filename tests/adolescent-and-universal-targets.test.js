/**
 * tests/adolescent-and-universal-targets.test.js
 * 
 * Testes de validação para suporte a adolescentes sob supervisão clínica (10-17 anos)
 * e paridade universal de metas energéticas e macronutrientes entre Antropometria,
 * Dashboard, Prescrição e Modal IA.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateDeterministicEnergyTarget } = require('../domain/math/energyTarget');
const { calculateDeterministicMacroTargets } = require('../domain/math/macroTarget');
const { validateNutritionPrescriptionTargets } = require('../domain/math/nutritionTargetValidator');
const { buildCanonicalPrescriptionInput, adaptPatientContext } = require('../domain/adapters/prescriptionInputAdapter');
const { executePrescriptionPipeline } = require('../domain/orchestration/prescriptionOrchestrator');
const { COMPREHENSIVE_TACO_TBCA_FOODS } = require('../foodsData');

// Contexto do paciente Vitor Gabriel (15 anos, 1.83m, 69.15kg, BF 6.4%, Hipertrofia)
const vitorGabrielContext = {
  schemaVersion: '1.0.0',
  generatedAt: '2026-09-18T10:00:00.000Z',
  patient: {
    patientId: 'patient_vitor_gabriel',
    name: 'Vitor Gabriel',
    age: 15,
    sex: 'Masculino',
    trainingLevel: 'Intermediário',
    patientType: 'Praticante recreativo',
    allowAdolescent: true
  },
  anthropometry: {
    weightKg: 69.15,
    heightCm: 183,
    bodyFatPercent: 6.4,
    leanMassKg: 64.72,
    hasRecentAssessment: true
  },
  objective: {
    clinicalObjective: 'Hipertrofia',
    rawObjective: 'Hipertrofia',
    category: 'hypertrophy'
  },
  energy: {
    tmbKcal: 1769,
    getKcal: 2653,
    activityFactor: 1.5,
    tmbMethod: 'KATCH_MCARDLE'
  },
  constraints: {
    dietaryRestrictions: [],
    allergies: [],
    intolerances: [],
    aversions: []
  },
  preferences: {
    preferredFoods: [],
    dislikedFoods: [],
    mealFrequency: 4
  },
  routine: {
    wakeUpTime: '07:00',
    bedTime: '23:00',
    workoutTime: '17:00',
    mealsPerDay: 4,
    mealCount: 4
  },
  mealsPerDay: 4,
  mealCount: 4,
  training: {
    hasActiveTraining: true,
    activeSplit: 'AB',
    workoutTime: '17:00',
    sessionDurationMinutes: 60,
    routines: []
  },
  cardio: { sessionsPerWeek: 0, weeklyDurationMinutes: 0 },
  fasting: { hasActiveProtocol: false, status: 'INACTIVE' },
  clinical: { exams: [] },
  currentPrescription: { hasCurrentPrescription: false, meals: [] },
  provenance: {
    weight: { source: 'runtime' },
    height: { source: 'runtime' },
    objective: { source: 'runtime' },
    energy: { source: 'runtime' },
    constraints: { source: 'runtime' },
    training: { source: 'runtime' },
    cardio: { source: 'runtime' },
    fasting: { source: 'runtime' },
    recall: { source: 'runtime' }
  }
};

test('N2.1 - Suporte a paciente adolescente de 15 anos com allowAdolescent: true', () => {
  const energyResult = calculateDeterministicEnergyTarget(vitorGabrielContext, { allowAdolescent: true });
  assert.notEqual(energyResult.status, 'BLOCKED', 'Não deve bloquear paciente adolescente quando assistido');
  assert.equal(energyResult.tmbKcal, 1769, 'TMB via Katch-McArdle com 64.72kg de massa magra');
  assert.equal(energyResult.getKcal, 2653, 'GET com fator 1.5');
  assert.equal(energyResult.caloricTargetKcal, 2971, 'Meta canônica de hipertrofia (+12% para BF 6.4% intermediário)');
  assert.ok(energyResult.warnings.some(w => w.includes('[SUPERVISED_ADOLESCENT]')), 'Deve emitir warning clínico de adolescente supervisionado');
});

test('N2.1 - Bloqueio estrito de menor de 18 anos sem flag allowAdolescent (segurança pediátrica padrão)', () => {
  const unassistedContext = {
    ...vitorGabrielContext,
    patient: {
      ...vitorGabrielContext.patient,
      allowAdolescent: false
    }
  };
  const energyResult = calculateDeterministicEnergyTarget(unassistedContext, { allowAdolescent: false });
  assert.equal(energyResult.status, 'BLOCKED', 'Deve bloquear paciente menor de 18 sem supervisão declarada');
  assert.ok(energyResult.blockingReasons.some(r => r.includes('menor de 18 anos')));
});

test('N2.2 - Suporte a paciente adolescente na distribuição de macronutrientes', () => {
  const energyResult = calculateDeterministicEnergyTarget(vitorGabrielContext, { allowAdolescent: true });
  const macroResult = calculateDeterministicMacroTargets(vitorGabrielContext, energyResult, { allowAdolescent: true });
  assert.notEqual(macroResult.status, 'BLOCKED', 'Macronutrientes não devem ser bloqueados');
  assert.ok(macroResult.proteinTargetG > 0, 'Proteína deve ser calculada');
  assert.ok(macroResult.carbohydrateTargetG > 0, 'Carboidrato deve ser calculado');
  assert.ok(macroResult.fatTargetG > 0, 'Gordura deve ser calculada');
  assert.equal(macroResult.caloricTargetKcal, 2971, 'Meta calórica de macros deve coincidir com energética');
});

test('N2.3 - Validação de metas nutricionais para adolescente emite WARNING e não FAIL', () => {
  const energyResult = calculateDeterministicEnergyTarget(vitorGabrielContext, { allowAdolescent: true });
  const macroResult = calculateDeterministicMacroTargets(vitorGabrielContext, energyResult, { allowAdolescent: true });
  const validationResult = validateNutritionPrescriptionTargets(vitorGabrielContext, energyResult, macroResult, { allowAdolescent: true });
  
  assert.notEqual(validationResult.status, 'FAIL', 'Validação não deve ter status FAIL');
  const pediatricCheck = validationResult.checks.find(c => c.id === 'CHECK_PEDIATRIC_SAFETY');
  assert.ok(pediatricCheck, 'Deve conter verificação CHECK_PEDIATRIC_SAFETY');
  assert.equal(pediatricCheck.status, 'WARNING', 'CHECK_PEDIATRIC_SAFETY deve ser WARNING para adolescente supervisionado');
});

test('Pipeline N3.7.1 - Execução orquestrada completa para paciente adolescente', async () => {
  const inputPrep = buildCanonicalPrescriptionInput({
    patientData: {
      patientId: 'patient_vitor_gabriel',
      name: 'Vitor Gabriel',
      age: 15,
      sex: 'Masculino',
      trainingLevel: 'Intermediário',
      patientType: 'Praticante recreativo',
      weightKg: 69.15,
      heightCm: 183,
      bodyFatPercent: 6.4,
      leanMassKg: 64.72,
      objective: 'Hipertrofia',
      tmbKcal: 1769,
      getKcal: 2653,
      caloricTargetKcal: 2971,
      mealsPerDay: 4,
      routine: {
        wakeUpTime: '07:00',
        bedTime: '23:00',
        workoutTime: '17:00',
        mealsPerDay: 4
      }
    },
    foodCatalog: COMPREHENSIVE_TACO_TBCA_FOODS.slice(0, 30),
    options: {
      mealCount: 4,
      dietaryStyle: 'tradicional',
      allowAdolescent: true
    }
  });

  assert.equal(inputPrep.isValid, true, 'Entrada canônica deve ser válida');
  assert.equal(inputPrep.canonicalInput.options.allowAdolescent, true);

  const pipelineResult = await executePrescriptionPipeline(inputPrep.canonicalInput);
  // O pipeline não pode ter sido interrompido nas etapas N2.1, N2.2 ou N2.3
  assert.notEqual(pipelineResult.interruptedAt, 'N2.1_ENERGY_TARGET');
  assert.notEqual(pipelineResult.interruptedAt, 'N2.2_MACRO_TARGET');
  assert.notEqual(pipelineResult.interruptedAt, 'N2.3_NUTRITION_VALIDATOR');
  assert.ok(pipelineResult.energyTargetResult != null);
  assert.ok(pipelineResult.energyTargetResult.caloricTargetKcal > 0);
});
