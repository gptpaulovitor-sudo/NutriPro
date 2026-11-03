/**
 * tests/stage-a-engines-regression.test.js
 * 
 * Suíte de testes de regressão para a Etapa A — Motores Matemáticos e Metas.
 * Executada antes e depois das correções para demonstrar as falhas da linha de base
 * e a posterior resolução sem quebra de contratos.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const nutritionMath = require('../domain/math/nutritionMath');
const { calculateDeterministicEnergyTarget } = require('../domain/math/energyTarget');
const { calculateDeterministicMacroTargets } = require('../domain/math/macroTarget');
const { calculateDeterministicWaterTarget } = require('../domain/math/waterTarget');

describe('Etapa A — 1. Lee et al. e Antropometria (nutritionMath)', () => {

  test('Lee et al.: termos de peso e estatura devem estar separados (sem multiplicação mista w * h)', () => {
    // Paciente de referência: 70 kg, 1.75 m, 30 anos, Masculino
    // Se w e h estão separados: MME = 0.244 * 70 + 7.80 * 1.75 + 6.6 * 1 - 0.098 * 30 - 3.3 ≈ 31.09 kg
    // No código defeituoso anterior: h * (0.244 * w + 7.8) = 1.75 * (17.08 + 7.8) = 43.54 kg
    const res = nutritionMath.calculateAnthropometricIndices({
      waistCm: 80,
      hipCm: 100,
      heightM: 1.75,
      weightKg: 70,
      leanMassKg: 55,
      gender: 'Masculino',
      age: 30,
      armCircCm: 32,
      tricepsFoldMm: 8,
      calfCircCm: 36
    });

    // MME fisiologicamente plausível para 70kg fica entre 26 e 34 kg, NUNCA acima de 40 kg
    assert.ok(res.skeletalMuscleMassKg < 36, `MME ${res.skeletalMuscleMassKg}kg está superestimada por multiplicação indevida de w * h`);
    assert.ok(res.skeletalMuscleMassKg > 25, `MME ${res.skeletalMuscleMassKg}kg deve ser fisiológica`);
  });

  test('Jackson-Pollock 7 dobras: rejeita dobras incompletas e retorna estado estruturado', () => {
    // Apenas 3 dobras fornecidas de 7
    const incompleteSkinfolds = {
      chest: 10,
      axillary: 12,
      triceps: 14
      // subscapular, abdominal, suprailiac, thigh ausentes
    };

    const res = nutritionMath.calculateBodyComposition('Masculino', 30, 75, 1.78, incompleteSkinfolds);
    assert.strictEqual(res.isValid, false, 'Dobra incompleta deve marcar isValid = false');
    assert.strictEqual(res.status, 'INSUFFICIENT_DATA', 'Status deve ser INSUFFICIENT_DATA');
    assert.strictEqual(res.bodyFatPercent, null, 'bodyFatPercent não pode ser calculado com dados incompletos');
  });

  test('Jackson-Pollock 7 dobras: sem dobras não inventa 15% de gordura corporal', () => {
    const res = nutritionMath.calculateBodyComposition('Masculino', 30, 75, 1.78, {});
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.bodyFatPercent, null);
    assert.strictEqual(res.leanMassKg, null);
  });

  test('Jackson-Pollock 7 dobras: 7 dobras completas calculam densidade e % gordura com sucesso', () => {
    const completeSkinfolds = {
      chest: 10,
      axillary: 12,
      triceps: 14,
      subscapular: 15,
      abdominal: 18,
      suprailiac: 16,
      thigh: 20
    };

    const res = nutritionMath.calculateBodyComposition('Masculino', 30, 75, 1.78, completeSkinfolds);
    assert.strictEqual(res.isValid, true);
    assert.ok(res.bodyFatPercent > 5 && res.bodyFatPercent < 30);
    assert.ok(res.leanMassKg > 40 && res.leanMassKg < 70);
  });

  test('RCQ, RCEst e AMBc: dados ausentes devem retornar "Não avaliado" e não falso "Adequado"', () => {
    const res = nutritionMath.calculateAnthropometricIndices({
      waistCm: 0,
      hipCm: 0,
      heightM: 1.75,
      weightKg: 70,
      leanMassKg: 0,
      gender: 'Masculino',
      age: 30,
      armCircCm: 0,
      tricepsFoldMm: 0,
      calfCircCm: 0
    });

    assert.strictEqual(res.rcq, null);
    assert.strictEqual(res.rcqClassification, 'Não avaliado');
    assert.strictEqual(res.rcEst, null);
    assert.strictEqual(res.rcEstClassification, 'Não avaliado');
    assert.strictEqual(res.armMuscularArea, null);
  });

});

describe('Etapa A — 2. Tradutor de Objetivos e Metas (energyTarget & macroTarget)', () => {

  test('Tradutor de objetivos unificado: normaliza acentos, maiúsculas e sinônimos clínicos', () => {
    const baseContext = {
      schemaVersion: '1.0.0',
      patient: { patientId: 'p_test', age: 30, sex: 'Masculino' },
      anthropometry: { weightKg: 80, heightCm: 180 },
      energy: { tmbKcal: 1800, getKcal: 2500 }
    };

    // Variações com acento e caixa
    const variations = [
      { clinicalObjective: 'Emagrecimento Rápido', expectedCategory: 'weightLoss' },
      { clinicalObjective: 'déficit calórico', expectedCategory: 'weightLoss' },
      { clinicalObjective: 'HIPERTROFIA MUSCULAR', expectedCategory: 'hypertrophy' },
      { clinicalObjective: 'Ganho de massa', expectedCategory: 'hypertrophy' },
      { clinicalObjective: 'Recomposição corporal', expectedCategory: 'recomposition' },
      { clinicalObjective: 'Manutenção de peso', expectedCategory: 'maintenance' }
    ];

    for (const v of variations) {
      const ctx = { ...baseContext, objective: { clinicalObjective: v.clinicalObjective } };
      const resEnergy = calculateDeterministicEnergyTarget(ctx);
      assert.ok(resEnergy.status === 'PASS' || resEnergy.status === 'WARNING', `Falhou para objetivo: ${v.clinicalObjective}`);
      const resMacro = calculateDeterministicMacroTargets(ctx, resEnergy);
      assert.ok(resMacro.status === 'PASS' || resMacro.status === 'WARNING', `Falhou macro para objetivo: ${v.clinicalObjective}`);
    }
  });

  test('Objetivo ausente ou desconhecido NÃO é tratado silenciosamente como manutenção aprovada', () => {
    const ctxEmpty = {
      schemaVersion: '1.0.0',
      patient: { patientId: 'p_test', age: 30, sex: 'Masculino' },
      anthropometry: { weightKg: 80, heightCm: 180 },
      objective: { clinicalObjective: '   ' }
    };

    const resEnergy = calculateDeterministicEnergyTarget(ctxEmpty);
    assert.strictEqual(resEnergy.status, 'BLOCKED');
    assert.ok(resEnergy.blockingReasons.some(r => r.includes('Objetivo')));

    const ctxUnknown = {
      schemaVersion: '1.0.0',
      patient: { patientId: 'p_test', age: 30, sex: 'Masculino' },
      anthropometry: { weightKg: 80, heightCm: 180 },
      objective: { clinicalObjective: 'Astronomia quântica' }
    };

    const resMacro = calculateDeterministicMacroTargets(ctxUnknown, { status: 'PASS', caloricTargetKcal: 2000 });
    assert.strictEqual(resMacro.status, 'BLOCKED');
    assert.ok(resMacro.blockingReasons.some(r => r.includes('não reconhecido')));
  });

  test('Compatibilidade energética e macros: paciente obeso em déficit acentuado não deve colapsar em erro inesperado', () => {
    // Paciente obeso: 130 kg, meta de déficit com 1800 kcal
    // Proteína 2.0g/kg sobre 130kg = 260g (1040 kcal)
    // Gordura 1.0g/kg sobre 130kg = 130g (1170 kcal)
    // 1040 + 1170 = 2210 kcal > 1800 kcal! Resíduo negativo!
    const ctxObese = {
      schemaVersion: '1.0.0',
      patient: { patientId: 'p_obese', age: 35, sex: 'Masculino' },
      anthropometry: { weightKg: 130, heightCm: 185 },
      objective: { clinicalObjective: 'Emagrecimento' },
      energy: { caloricTargetKcal: 1800 }
    };

    const resMacro = calculateDeterministicMacroTargets(ctxObese, { status: 'PASS', caloricTargetKcal: 1800 });
    // Deve retornar estado estruturado de incompatibilidade com métricas claras, sem exceção
    assert.ok(resMacro.status === 'BLOCKED' || resMacro.status === 'INCOMPATIBLE_ENERGY_MACRO');
    assert.ok(resMacro.blockingReasons.length > 0);
  });

});

describe('Etapa A — 3. Hidratação Determinística (waterTarget)', () => {

  test('Entradas numéricas válidas e strings numéricas são processadas corretamente', () => {
    const resNum = calculateDeterministicWaterTarget(80);
    assert.strictEqual(resNum.status, 'PASS');
    assert.strictEqual(resNum.weightKg, 80);

    const resStr = calculateDeterministicWaterTarget('85.5');
    assert.strictEqual(resStr.status, 'PASS');
    assert.strictEqual(resStr.weightKg, 85.5);

    const resObj = calculateDeterministicWaterTarget({ patient: { weightKg: '90' } });
    assert.strictEqual(resObj.status, 'PASS');
    assert.strictEqual(resObj.weightKg, 90);
  });

  test('Peso ausente, zero, negativo ou inválido NÃO vira silenciosamente 70 kg', () => {
    const invalidInputs = [null, undefined, '', 'abc', 0, -10, NaN];

    for (const input of invalidInputs) {
      const res = calculateDeterministicWaterTarget(input);
      assert.strictEqual(res.isValid, false, `Input ${input} não deve ser marcado como válido`);
      assert.strictEqual(res.status, 'INSUFFICIENT_DATA', `Input ${input} deve ter status INSUFFICIENT_DATA`);
      assert.strictEqual(res.weightKg, null, `Input ${input} não pode virar 70 kg`);
      assert.strictEqual(res.targetWaterMl, null, `targetWaterMl deve ser null para input ${input}`);
    }
  });

});
