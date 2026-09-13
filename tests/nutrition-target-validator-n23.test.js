/**
 * tests/nutrition-target-validator-n23.test.js
 * 
 * Suíte de Testes Automatizados — Fase N2.3
 * Validador Energético e Bromatológico de Metas Nutricionais — NutriAx Pro
 * 
 * Execução: node --test tests/nutrition-target-validator-n23.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const { validateNutritionPrescriptionTargets } = require('../domain/math/nutritionTargetValidator');

/**
 * Helpers para criação de mocks canônicos
 */
function createMockContext(overrides = {}) {
  return {
    schemaVersion: '1.0.0',
    generatedAt: '2026-09-13T12:00:00.000Z',
    patient: {
      patientId: 'patient_test_n23',
      name: 'Paciente Teste N23',
      age: 28,
      sex: 'Masculino',
      patientType: 'Praticante recreativo',
      trainingLevel: 'Intermediário',
      ...(overrides.patient || {})
    },
    objective: {
      clinicalObjective: 'Perda de peso',
      source: 'PATIENT_REPORTED',
      ...(overrides.objective || {})
    },
    anthropometry: {
      hasRecentAssessment: true,
      weightKg: 80.0,
      heightCm: 180.0,
      bmi: 24.69,
      bodyFatPercent: 18.0,
      leanMassKg: 65.6,
      fatMassKg: 14.4,
      ...(overrides.anthropometry || {})
    },
    energy: {
      tmbKcal: 1787,
      getKcal: 2538,
      activityFactor: 1.42,
      caloricTargetKcal: 2000,
      energyBalanceKcal: -538,
      source: 'N2.1_CALCULATED',
      formula: 'Katch-McArdle',
      ...(overrides.energy || {})
    },
    routine: { neat: 'Moderado' },
    training: {
      hasActiveTraining: true,
      frequency: 4,
      activeSplit: 'UpperLower',
      routines: [{ name: 'A' }, { name: 'B' }],
      ...(overrides.training || {})
    },
    cardio: {
      hasActiveCardio: true,
      weeklyFrequency: 3,
      sessions: [{ durationMinutes: 30 }],
      ...(overrides.cardio || {})
    },
    weeklySchedule: [{ dayOfWeek: 'Segunda-feira', demand: 'MODERATE' }],
    constraints: {
      dietaryRestrictions: ['Sem lactose'],
      allergies: ['Amendoim'],
      intolerances: [],
      aversions: [],
      ...(overrides.constraints || {})
    },
    fasting: {
      hasActiveProtocol: false,
      status: 'INACTIVE',
      ...(overrides.fasting || {})
    },
    dietaryRecall: {
      hasRecall: true,
      itemsCount: 1,
      items: [{ foodName: 'Ovo', macros: { calories: 150 } }],
      ...(overrides.dietaryRecall || {})
    },
    ...(overrides.root || {})
  };
}

function createMockEnergyTarget(overrides = {}) {
  return {
    status: 'PASS',
    caloricTargetKcal: 2000,
    tmbKcal: 1787,
    getKcal: 2538,
    energyBalanceKcal: -538,
    objective: 'Perda de peso',
    calculationMethod: 'DETERMINISTIC_ENERGY_TARGET_N21',
    factorsConsidered: ['Dados Biométricos'],
    warnings: [],
    blockingReasons: [],
    rationale: ['Meta calculada'],
    policy: { version: 'N2.1.0' },
    provenance: { energyTarget: { source: 'N2.1_DIRECT_RESULT' } },
    ...overrides
  };
}

function createMockMacroTarget(overrides = {}) {
  // P: 160g (640 kcal), G: 60g (540 kcal), C: 205g (820 kcal) -> Soma = 2000 kcal
  return {
    status: 'PASS',
    caloricTargetKcal: 2000,
    proteinTargetG: 160,
    carbohydrateTargetG: 205,
    fatTargetG: 60,
    fiberTargetG: 28,

    proteinKcal: 640,
    carbohydrateKcal: 820,
    fatKcal: 540,
    macroEnergyKcal: 2000,
    energyDifferenceKcal: 0,

    objective: 'Perda de peso',
    calculationMethod: 'DETERMINISTIC_MACRO_TARGET_N22',
    warnings: [],
    blockingReasons: [],
    rationale: ['Macros calculados'],
    policy: { version: 'N2.2.0' },
    provenance: {
      protein: { reference: 'TOTAL_BODY_WEIGHT', referenceValue: 80.0, method: 'TOTAL_BODY_WEIGHT_STANDARD', gPerKg: 2.0, policyParameter: { source: 'POLICY_PARAMETER' } },
      fat: { method: 'OBJECTIVE_BASE_G_PER_KG', gPerKg: 0.75, floorApplied: 'NONE', policyParameter: { source: 'POLICY_PARAMETER' } },
      carbohydrate: { method: 'RESIDUAL_ENERGY_ATWATER', residualKcal: 820 },
      fiber: { method: 'DRI_ENERGY_PROPORTIONAL' },
      validation: { toleranceKcal: 5, differenceKcal: 0, isConsistent: true }
    },
    ...overrides
  };
}

describe('Fase N2.3 — Validador Energético e Bromatológico de Metas Nutricionais', () => {

  // ── GRUPO 1: ENTRADA E VALIDAÇÃO DE N2.1 ──────────────────────────────────

  it('1. N2.1 válido com N2.2 válido: retorna status PASS e valid === true', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget();
    const n22 = createMockMacroTarget();

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'PASS');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.caloricTargetKcal, 2000);
    assert.strictEqual(res.energyValidation.closed, true);
    assert.strictEqual(res.blockingReasons.length, 0);
  });

  it('2. N2.1 bloqueado: propaga status BLOCKED e valid === false', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ status: 'BLOCKED', caloricTargetKcal: null, blockingReasons: ['Falha N2.1'] });
    const n22 = createMockMacroTarget();

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.strictEqual(res.valid, false);
    assert.ok(res.blockingReasons.some(r => r.includes('BLOCKED')));
  });

  it('3. Meta energética ausente (null) em N2.1: retorna status BLOCKED', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: null });
    const n22 = createMockMacroTarget();

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.strictEqual(res.valid, false);
  });

  it('4. Meta energética zero (0) em N2.1: retorna status BLOCKED', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: 0 });
    const n22 = createMockMacroTarget();

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.strictEqual(res.valid, false);
  });

  it('5. Meta energética negativa (-1500) em N2.1: retorna status BLOCKED', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: -1500 });
    const n22 = createMockMacroTarget();

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.strictEqual(res.valid, false);
  });

  it('6. NaN em caloricTargetKcal: retorna status BLOCKED', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: NaN });
    const n22 = createMockMacroTarget();

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.strictEqual(res.valid, false);
  });

  it('7. Infinity em caloricTargetKcal: retorna status BLOCKED', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: Infinity });
    const n22 = createMockMacroTarget();

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.strictEqual(res.valid, false);
  });

  // ── GRUPO 2: MACROS E VALIDAÇÃO DE N2.2 ───────────────────────────────────

  it('8. N2.2 válido: check CHECK_N22_MACRO_TARGET aprovado', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget();
    const n22 = createMockMacroTarget();

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    const macroCheck = res.checks.find(c => c.id === 'CHECK_N22_MACRO_TARGET');
    assert.ok(macroCheck);
    assert.strictEqual(macroCheck.status, 'PASS');
  });

  it('9. N2.2 bloqueado: propaga status BLOCKED', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget();
    const n22 = createMockMacroTarget({ status: 'BLOCKED', blockingReasons: ['Resíduo negativo'] });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.strictEqual(res.valid, false);
  });

  it('10. Proteína negativa: retorna status BLOCKED', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget();
    const n22 = createMockMacroTarget({ proteinTargetG: -10, proteinKcal: -40 });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.ok(res.blockingReasons.some(r => r.includes('CHECK_NON_NEGATIVE_MACROS')));
  });

  it('11. Carboidrato negativo: retorna status BLOCKED', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget();
    const n22 = createMockMacroTarget({ carbohydrateTargetG: -5, carbohydrateKcal: -20 });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.ok(res.blockingReasons.some(r => r.includes('CHECK_NON_NEGATIVE_MACROS')));
  });

  it('12. Gordura negativa: retorna status BLOCKED', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget();
    const n22 = createMockMacroTarget({ fatTargetG: -15, fatKcal: -135 });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.ok(res.blockingReasons.some(r => r.includes('CHECK_NON_NEGATIVE_MACROS')));
  });

  it('13. Kcal de proteína inconsistente com gramas (P * 4): retorna status BLOCKED', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget();
    // 160g de proteína deveriam ser 640 kcal, mas está 700 kcal
    const n22 = createMockMacroTarget({ proteinTargetG: 160, proteinKcal: 700 });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.ok(res.blockingReasons.some(r => r.includes('CHECK_PROTEIN_ENERGY_CONSISTENCY')));
  });

  it('14. Kcal de gordura inconsistente com gramas (G * 9): retorna status BLOCKED', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget();
    // 60g de gordura deveriam ser 540 kcal, mas está 600 kcal
    const n22 = createMockMacroTarget({ fatTargetG: 60, fatKcal: 600 });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.ok(res.blockingReasons.some(r => r.includes('CHECK_FAT_ENERGY_CONSISTENCY')));
  });

  it('15. Kcal de carboidrato inconsistente com gramas (C * 4): retorna status BLOCKED', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget();
    // 205g de carbo deveriam ser 820 kcal, mas está 900 kcal
    const n22 = createMockMacroTarget({ carbohydrateTargetG: 205, carbohydrateKcal: 900 });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.ok(res.blockingReasons.some(r => r.includes('CHECK_CARBOHYDRATE_ENERGY_CONSISTENCY')));
  });

  it('16. Metas fracionárias de macros (não inteiras): válidas desde que numéricas e finitas (Correção 1)', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: 2000 });
    // P: 160.5g (642 kcal), G: 52.2g (469.8 kcal), C: 222.05g (888.2 kcal) -> Soma = 2000 kcal
    const n22 = createMockMacroTarget({
      proteinTargetG: 160.5,
      proteinKcal: 642,
      fatTargetG: 52.2,
      fatKcal: 469.8,
      carbohydrateTargetG: 222.05,
      carbohydrateKcal: 888.2,
      macroEnergyKcal: 2000,
      energyDifferenceKcal: 0
    });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'PASS');
    assert.strictEqual(res.macroTargets.proteinTargetG, 160.5);
    assert.strictEqual(res.macroTargets.fatTargetG, 52.2);
    assert.strictEqual(res.macroTargets.carbohydrateTargetG, 222.05);
  });

  // ── GRUPO 3: FECHAMENTO ENERGÉTICO E INVARIANTE ───────────────────────────

  it('17. Fechamento energético exato (diff === 0): closed === true, status PASS', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: 2000 });
    const n22 = createMockMacroTarget({
      caloricTargetKcal: 2000,
      macroEnergyKcal: 2000,
      energyDifferenceKcal: 0
    });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.energyValidation.closed, true);
    assert.strictEqual(res.energyValidation.energyDifferenceKcal, 0);
    assert.strictEqual(res.status, 'PASS');
  });

  it('18. Fechamento com diferença dentro da tolerância (ex: +2 kcal <= 5 kcal): closed === true, PASS', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: 2000 });
    // P: 640, G: 540, C: 822 -> macroEnergyKcal = 2002 kcal (+2 kcal diff)
    const n22 = createMockMacroTarget({
      caloricTargetKcal: 2000,
      carbohydrateTargetG: 205.5,
      carbohydrateKcal: 822,
      macroEnergyKcal: 2002,
      energyDifferenceKcal: 2
    });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.energyValidation.closed, true);
    assert.strictEqual(res.status, 'PASS');
  });

  it('19. Fechamento com diferença fora da tolerância (> 5 kcal): status BLOCKED com ENERGY_CLOSURE_FAILED', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: 2000 });
    // Macro sum = 2050 kcal (+50 kcal diff)
    const n22 = createMockMacroTarget({
      caloricTargetKcal: 2000,
      carbohydrateTargetG: 217.5,
      carbohydrateKcal: 870,
      macroEnergyKcal: 2050,
      energyDifferenceKcal: 50
    });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.strictEqual(res.energyValidation.closed, false);
    assert.ok(res.blockingReasons.some(r => r.includes('ENERGY_CLOSURE_FAILED')));
  });

  it('20. Sinal correto da diferença de fechamento energético (macroEnergyKcal - caloricTargetKcal)', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: 2000 });
    // macroEnergyKcal = 1998 kcal (-2 kcal diff)
    const n22 = createMockMacroTarget({
      caloricTargetKcal: 2000,
      carbohydrateTargetG: 204.5,
      carbohydrateKcal: 818,
      macroEnergyKcal: 1998,
      energyDifferenceKcal: -2
    });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.energyValidation.energyDifferenceKcal, -2);
    assert.strictEqual(res.energyValidation.closed, true);
  });

  it('21. Fechamento residual consistente com a equação Atwater (calorias - P - G)', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: 2000 });
    const n22 = createMockMacroTarget({
      proteinKcal: 640,
      fatKcal: 540,
      carbohydrateKcal: 820 // 2000 - 640 - 540 = 820
    });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    const carbCheck = res.checks.find(c => c.id === 'CHECK_CARBOHYDRATE_ENERGY_CONSISTENCY');
    assert.strictEqual(carbCheck.status, 'PASS');
  });

  it('22. macroEnergyKcal divergente da soma das parcelas (4P + 4C + 9G): retorna status BLOCKED', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: 2000 });
    // Parcelas somam 2000 kcal, mas macroEnergyKcal reportado como 1900 kcal
    const n22 = createMockMacroTarget({
      proteinKcal: 640,
      fatKcal: 540,
      carbohydrateKcal: 820,
      macroEnergyKcal: 1900
    });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.ok(res.blockingReasons.some(r => r.includes('diverge da soma direta')));
  });

  // ── GRUPO 4: FIBRA ALIMENTAR ──────────────────────────────────────────────

  it('23. Fibra válida: check CHECK_FIBER_ISOLATION_AND_VALIDITY aprovado', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget();
    const n22 = createMockMacroTarget({ fiberTargetG: 30 });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    const fiberCheck = res.checks.find(c => c.id === 'CHECK_FIBER_ISOLATION_AND_VALIDITY');
    assert.strictEqual(fiberCheck.status, 'PASS');
    assert.strictEqual(res.macroTargets.fiberTargetG, 30);
  });

  it('24. Fibra nula (fiberTargetG === null): emite WARNING sem bloquear a prescrição (valid === true)', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget();
    const n22 = createMockMacroTarget({ fiberTargetG: null });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'WARNING');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.macroTargets.fiberTargetG, null);
    assert.ok(res.warnings.some(w => w.includes('fibras')));
  });

  it('25. Fibra negativa: retorna status BLOCKED', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget();
    const n22 = createMockMacroTarget({ fiberTargetG: -5 });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.ok(res.blockingReasons.some(r => r.includes('CHECK_FIBER_ISOLATION_AND_VALIDITY')));
  });

  it('26. Prova formal: macroEnergyKcal utiliza exclusivamente 4P + 4C + 9G sem somar fibras (Correção 2)', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: 2000 });
    const n22 = createMockMacroTarget({
      proteinKcal: 640,
      carbohydrateKcal: 820,
      fatKcal: 540,
      macroEnergyKcal: 2000,
      fiberTargetG: 50 // Fibras altas não alteram os 2000 kcal dos macros
    });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.energyValidation.macroEnergyKcal, 2000);
    assert.strictEqual(res.macroTargets.fiberTargetG, 50);
    const fiberCheck = res.checks.find(c => c.id === 'CHECK_FIBER_ISOLATION_AND_VALIDITY');
    assert.strictEqual(fiberCheck.includedInMacroEnergyKcal, false);
  });

  // ── GRUPO 5: PERCENTUAIS E DISTRIBUIÇÃO ────────────────────────────────────

  it('27. Proteína percentual calculada com precisão Atwater', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: 2000 });
    // 640 kcal / 2000 kcal = 32%
    const n22 = createMockMacroTarget({ proteinKcal: 640 });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.macroDistribution.proteinPercent, 32.0);
  });

  it('28. Carboidrato percentual calculado com precisão Atwater', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: 2000 });
    // 820 kcal / 2000 kcal = 41%
    const n22 = createMockMacroTarget({ carbohydrateKcal: 820 });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.macroDistribution.carbohydratePercent, 41.0);
  });

  it('29. Gordura percentual calculada com precisão Atwater', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: 2000 });
    // 540 kcal / 2000 kcal = 27%
    const n22 = createMockMacroTarget({ fatKcal: 540 });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.macroDistribution.fatPercent, 27.0);
  });

  it('30. Soma dos percentuais converge para 100% (+/- 0.6%)', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: 2000 });
    const n22 = createMockMacroTarget(); // 32% + 41% + 27% = 100%

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    const distCheck = res.checks.find(c => c.id === 'CHECK_MACRO_DISTRIBUTION_PLAUSIBILITY');
    assert.strictEqual(distCheck.status, 'PASS');
    assert.strictEqual(distCheck.sumPercent, 100.0);
  });

  it('31. Soma percentual divergente (ex: parcelas corrompidas) gera falha no check de plausibilidade', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ caloricTargetKcal: 2000 });
    // Força parcelas com soma = 2500 kcal sobre 2000 kcal -> soma percentual = 125%
    const n22 = createMockMacroTarget({
      proteinKcal: 1000,
      carbohydrateKcal: 1000,
      fatKcal: 500,
      macroEnergyKcal: 2500
    });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    const distCheck = res.checks.find(c => c.id === 'CHECK_MACRO_DISTRIBUTION_PLAUSIBILITY');
    assert.strictEqual(distCheck.status, 'FAIL');
  });

  // ── GRUPO 6: OBJETIVOS CLÍNICOS E COERÊNCIA DE CONTEXTO ───────────────────

  it('32. Perda de peso validada com sucesso', () => {
    const ctx = createMockContext({ objective: { clinicalObjective: 'Perda de peso' } });
    const n21 = createMockEnergyTarget({ objective: 'Perda de peso' });
    const n22 = createMockMacroTarget({ objective: 'Perda de peso' });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'PASS');
  });

  it('33. Hipertrofia validada com sucesso', () => {
    const ctx = createMockContext({ objective: { clinicalObjective: 'Hipertrofia' } });
    const n21 = createMockEnergyTarget({ objective: 'Hipertrofia', caloricTargetKcal: 2500 });
    // P: 144g (576 kcal), G: 72g (648 kcal), C: 319g (1276 kcal) -> Soma = 2500 kcal
    const n22 = createMockMacroTarget({
      objective: 'Hipertrofia',
      caloricTargetKcal: 2500,
      proteinTargetG: 144,
      proteinKcal: 576,
      fatTargetG: 72,
      fatKcal: 648,
      carbohydrateTargetG: 319,
      carbohydrateKcal: 1276,
      macroEnergyKcal: 2500,
      energyDifferenceKcal: 0
    });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'PASS');
  });


  it('34. Recomposição Corporal validada com sucesso', () => {
    const ctx = createMockContext({ objective: { clinicalObjective: 'Recomposição Corporal' } });
    const n21 = createMockEnergyTarget({ objective: 'Recomposição Corporal' });
    const n22 = createMockMacroTarget({ objective: 'Recomposição Corporal' });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'PASS');
  });

  it('35. Performance Esportiva validada com sucesso', () => {
    const ctx = createMockContext({ objective: { clinicalObjective: 'Performance Esportiva' } });
    const n21 = createMockEnergyTarget({ objective: 'Performance Esportiva' });
    const n22 = createMockMacroTarget({ objective: 'Performance Esportiva' });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'PASS');
  });

  it('36. Manutenção e Saúde validada com sucesso', () => {
    const ctx = createMockContext({ objective: { clinicalObjective: 'Manutenção e Saúde' } });
    const n21 = createMockEnergyTarget({ objective: 'Manutenção e Saúde' });
    const n22 = createMockMacroTarget({ objective: 'Manutenção e Saúde' });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'PASS');
  });

  it('37. Objetivo clínico ausente no contexto N1.1: retorna status BLOCKED', () => {
    const ctx = createMockContext({ objective: { clinicalObjective: null } });
    const n21 = createMockEnergyTarget();
    const n22 = createMockMacroTarget();

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.ok(res.blockingReasons.some(r => r.includes('Objetivo clínico')));
  });

  it('38. Objetivo clínico inválido/desconhecido no contexto: retorna status BLOCKED', () => {
    const ctx = createMockContext({ objective: { clinicalObjective: 'ObjetivoTotalmenteInvalidoXYZ' } });
    const n21 = createMockEnergyTarget();
    const n22 = createMockMacroTarget();

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
  });

  it('39. Divergência entre o objetivo do contexto e os resultados N2.1/N2.2: retorna status BLOCKED', () => {
    const ctx = createMockContext({ objective: { clinicalObjective: 'Perda de peso' } });
    const n21 = createMockEnergyTarget({ objective: 'Hipertrofia' }); // Conflito intencional
    const n22 = createMockMacroTarget({ objective: 'Hipertrofia' });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.ok(res.blockingReasons.some(r => r.includes('Divergência entre o objetivo')));
  });

  // ── GRUPO 7: CONTEXTO E NÃO-SOBREESCRITA (CORREÇÃO 3) ──────────────────────

  it('40. Treino no contexto é verificado como preservado sem alterar as metas', () => {
    const ctx = createMockContext({
      training: { hasActiveTraining: true, activeSplit: 'PPL', routines: [{ name: 'Push' }] }
    });
    const res = validateNutritionPrescriptionTargets(ctx, createMockEnergyTarget(), createMockMacroTarget());

    const ctxCheck = res.checks.find(c => c.id === 'CHECK_OBJECTIVE_AND_CONTEXT_COHERENCE');
    assert.strictEqual(ctxCheck.hasTrainingContext, true);
    assert.strictEqual(res.caloricTargetKcal, 2000);
  });

  it('41. Cardio no contexto é verificado como preservado sem adicionar calorias', () => {
    const ctx = createMockContext({
      cardio: { hasActiveCardio: true, sessions: [{ durationMinutes: 45 }] }
    });
    const res = validateNutritionPrescriptionTargets(ctx, createMockEnergyTarget(), createMockMacroTarget());

    const ctxCheck = res.checks.find(c => c.id === 'CHECK_OBJECTIVE_AND_CONTEXT_COHERENCE');
    assert.strictEqual(ctxCheck.hasCardioContext, true);
  });

  it('42. Microciclo semanal é verificado como preservado', () => {
    const ctx = createMockContext({
      weeklySchedule: [{ dayOfWeek: 'Segunda-feira' }, { dayOfWeek: 'Quarta-feira' }]
    });
    const res = validateNutritionPrescriptionTargets(ctx, createMockEnergyTarget(), createMockMacroTarget());

    const ctxCheck = res.checks.find(c => c.id === 'CHECK_OBJECTIVE_AND_CONTEXT_COHERENCE');
    assert.strictEqual(ctxCheck.hasWeeklySchedule, true);
  });

  it('43. Restrições e alergias são confirmadas como presentes no contexto para a Fase N3', () => {
    const ctx = createMockContext({
      constraints: { dietaryRestrictions: ['Vegetariano'], allergies: ['Soja'] }
    });
    const res = validateNutritionPrescriptionTargets(ctx, createMockEnergyTarget(), createMockMacroTarget());

    const ctxCheck = res.checks.find(c => c.id === 'CHECK_OBJECTIVE_AND_CONTEXT_COHERENCE');
    assert.strictEqual(ctxCheck.hasConstraints, true);
  });

  it('44. Protocolo de jejum é verificado como preservado no contexto', () => {
    const ctx = createMockContext({
      fasting: { hasActiveProtocol: true, status: 'ACTIVE' }
    });
    const res = validateNutritionPrescriptionTargets(ctx, createMockEnergyTarget(), createMockMacroTarget());

    assert.strictEqual(res.valid, true);
  });

  it('45. Recordatório alimentar no contexto não sobrescreve as metas calculadas', () => {
    const ctx = createMockContext({
      dietaryRecall: {
        hasRecall: true,
        itemsCount: 2,
        items: [{ foodName: 'Lasanha', macros: { calories: 3200 } }]
      }
    });
    const res = validateNutritionPrescriptionTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2000 }), createMockMacroTarget());

    assert.strictEqual(res.caloricTargetKcal, 2000);
  });

  it('46. Procedência mínima de proteína ausente emite WARNING sem bloquear', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget();
    const n22 = createMockMacroTarget({
      provenance: {
        protein: { reference: null, method: null, gPerKg: null }, // Procedência nula
        fat: { method: 'OBJECTIVE_BASE_G_PER_KG', gPerKg: 0.75 },
        carbohydrate: { method: 'RESIDUAL_ENERGY_ATWATER' },
        validation: { toleranceKcal: 5 }
      }
    });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'WARNING');
    assert.strictEqual(res.valid, true);
    assert.ok(res.warnings.some(w => w.includes('procedência mínima incompleta')));
  });

  it('47. Preservação de alertas prévios de N2.1 e N2.2 no array de warnings', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget({ warnings: ['Alerta metabólico de piso calórico'] });
    const n22 = createMockMacroTarget({ warnings: ['Aporte proteico superior a 3.5 g/kg'] });

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'WARNING');
    assert.ok(res.warnings.some(w => w.includes('Alerta metabólico')));
    assert.ok(res.warnings.some(w => w.includes('Aporte proteico')));
  });

  // ── GRUPO 8: SEGURANÇA E ROBUSTEZ ─────────────────────────────────────────

  it('48. Menor de 18 anos (age < 18): status BLOCKED estrito por segurança pediátrica', () => {
    const ctx = createMockContext({ patient: { age: 15 } });
    const n21 = createMockEnergyTarget();
    const n22 = createMockMacroTarget();

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.strictEqual(res.valid, false);
    assert.ok(res.blockingReasons.some(r => r.includes('CHECK_PEDIATRIC_SAFETY')));
  });

  it('49. Imutabilidade profunda: Object.isFrozen(res) e estruturas internas são congeladas', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget();
    const n22 = createMockMacroTarget();

    const res = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(Object.isFrozen(res), true);
    assert.strictEqual(Object.isFrozen(res.macroTargets), true);
    assert.strictEqual(Object.isFrozen(res.energyValidation), true);
    assert.strictEqual(Object.isFrozen(res.macroDistribution), true);
    assert.strictEqual(Object.isFrozen(res.warnings), true);
    assert.strictEqual(Object.isFrozen(res.blockingReasons), true);
    assert.strictEqual(Object.isFrozen(res.checks), true);
    assert.strictEqual(Object.isFrozen(res.provenance), true);
    assert.strictEqual(Object.isFrozen(res.policyVersions), true);
  });

  it('50. Tentativa de mutação em propriedades congeladas falha estritamente', () => {
    const ctx = createMockContext();
    const res = validateNutritionPrescriptionTargets(ctx, createMockEnergyTarget(), createMockMacroTarget());

    assert.throws(() => {
      'use strict';
      res.valid = false;
    }, TypeError);

    assert.throws(() => {
      'use strict';
      res.macroTargets.proteinTargetG = 999;
    }, TypeError);
  });

  it('51. Determinismo estrito: 2 execuções idênticas produzem saídas serializáveis idênticas', () => {
    const ctx = createMockContext();
    const n21 = createMockEnergyTarget();
    const n22 = createMockMacroTarget();

    const res1 = validateNutritionPrescriptionTargets(ctx, n21, n22);
    const res2 = validateNutritionPrescriptionTargets(ctx, n21, n22);

    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2));
  });

  it('52. Contexto original de entrada NÃO sofre mutação', () => {
    const ctx = createMockContext();
    const before = JSON.stringify(ctx);

    validateNutritionPrescriptionTargets(ctx, createMockEnergyTarget(), createMockMacroTarget());

    const after = JSON.stringify(ctx);
    assert.strictEqual(before, after);
  });

  it('53. Resultado N2.1 de entrada NÃO sofre mutação', () => {
    const n21 = createMockEnergyTarget();
    const before = JSON.stringify(n21);

    validateNutritionPrescriptionTargets(createMockContext(), n21, createMockMacroTarget());

    const after = JSON.stringify(n21);
    assert.strictEqual(before, after);
  });

  it('54. Resultado N2.2 de entrada NÃO sofre mutação', () => {
    const n22 = createMockMacroTarget();
    const before = JSON.stringify(n22);

    validateNutritionPrescriptionTargets(createMockContext(), createMockEnergyTarget(), n22);

    const after = JSON.stringify(n22);
    assert.strictEqual(before, after);
  });

  it('55. Pureza total: zero efeitos colaterais e validação autônoma independente de I/O', () => {
    const ctx = createMockContext();
    const res = validateNutritionPrescriptionTargets(ctx, createMockEnergyTarget(), createMockMacroTarget());

    assert.strictEqual(res.validationMethod, 'DETERMINISTIC_NUTRITION_TARGET_VALIDATION_N23');
    assert.strictEqual(typeof res.valid, 'boolean');
    assert.ok(Array.isArray(res.checks) && res.checks.length > 5);
  });

});
