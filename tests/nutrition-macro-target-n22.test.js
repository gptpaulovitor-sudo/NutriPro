/**
 * tests/nutrition-macro-target-n22.test.js
 * 
 * Suíte de Testes Automatizados — Fase N2.2
 * Motor Determinístico de Metas de Macronutrientes — NutriAx Pro
 * 
 * Execução: node --test tests/nutrition-macro-target-n22.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const { DEFAULT_MACRO_POLICY, validateMacroPolicy } = require('../domain/math/macroPolicy');
const { calculateDeterministicMacroTargets, isAthleteOrHighDemand, normalizeObjectiveCategory } = require('../domain/math/macroTarget');

/**
 * Helper para criar um mock consistente de NutritionPrescriptionContextDTO
 */
function createMockContext(overrides = {}) {
  const baseData = {
    schemaVersion: '1.0.0',
    generatedAt: '2026-09-13T12:00:00.000Z',
    patient: {
      patientId: 'patient_test_macro_001',
      name: 'Paciente Teste N22',
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
      caloricTargetKcal: 2030,
      energyBalanceKcal: -508,
      source: 'N2.1_CALCULATED',
      formula: 'Katch-McArdle',
      ...(overrides.energy || {})
    },
    routine: {
      neat: 'Moderado',
      ...(overrides.routine || {})
    },
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
      sessions: [{ durationMinutes: 30 }, { durationMinutes: 30 }],
      ...(overrides.cardio || {})
    },
    weeklySchedule: [
      { dayOfWeek: 'Segunda-feira', demand: 'MODERATE' },
      { dayOfWeek: 'Terça-feira', demand: 'HIGH' }
    ],
    constraints: {
      dietaryRestrictions: ['Sem lactose'],
      allergies: ['Amendoim'],
      intolerances: ['Lactose'],
      aversions: ['Fígado'],
      ...(overrides.constraints || {})
    },
    preferences: {
      preferredFoods: ['Frango', 'Arroz'],
      ...(overrides.preferences || {})
    },
    fasting: {
      hasActiveProtocol: false,
      status: 'INACTIVE',
      ...(overrides.fasting || {})
    },
    clinical: {
      exams: [],
      ...(overrides.clinical || {})
    },
    dietaryRecall: {
      hasRecall: true,
      itemsCount: 5,
      items: [{ foodName: 'Ovo', macros: { calories: 150 } }],
      typicalMealTimes: ['08:00', '12:00'],
      ...(overrides.dietaryRecall || {})
    },
    currentPrescription: {
      hasCurrentPrescription: false,
      meals: [],
      ...(overrides.currentPrescription || {})
    },
    provenance: {
      weight: { source: 'MANUAL_EXAM' },
      height: { source: 'MANUAL_EXAM' },
      objective: { source: 'PATIENT_REPORTED' },
      energy: { source: 'CALCULATED_N21' },
      constraints: { source: 'ANAMNESE' },
      training: { source: 'PRESCRIBED' },
      cardio: { source: 'PRESCRIBED' },
      fasting: { source: 'ANAMNESE' },
      recall: { source: 'ANAMNESE' }
    }
  };

  return baseData;
}

/**
 * Helper para criar um mock de resultado de N2.1
 */
function createMockEnergyTarget(overrides = {}) {
  return {
    status: 'PASS',
    tmbKcal: 1787,
    getKcal: 2538,
    adjustmentKcal: -508,
    adjustmentPercent: -0.20,
    caloricTargetKcal: 2030,
    energyBalanceKcal: -508,
    objective: 'Perda de peso',
    calculationMethod: 'DETERMINISTIC_ENERGY_TARGET_N21',
    factorsConsidered: ['Dados Biométricos'],
    warnings: [],
    blockingReasons: [],
    rationale: ['Meta calculada'],
    policy: {
      version: 'N2.1.0',
      appliedRule: 'WEIGHT_LOSS_BASE',
      parameters: []
    },
    provenance: {
      tmb: { value: 1787 },
      get: { value: 2538 },
      caloricTarget: { caloricTargetKcal: 2030 }
    },
    ...(overrides || {})
  };
}

describe('Fase N2.2 — Motor Determinístico de Macronutrientes', () => {

  // ── GRUPO 1: ENTRADA E VALIDAÇÕES ESTRUTURAIS ─────────────────────────────

  it('1. Contexto válido com N2.1: produz status PASS com fechamento energético consistente', () => {
    const ctx = createMockContext();
    const energyRes = createMockEnergyTarget({ caloricTargetKcal: 2000 });
    const res = calculateDeterministicMacroTargets(ctx, energyRes);

    assert.strictEqual(res.status, 'PASS');
    assert.strictEqual(res.caloricTargetKcal, 2000);
    assert.ok(typeof res.proteinTargetG === 'number' && res.proteinTargetG > 0);
    assert.ok(typeof res.fatTargetG === 'number' && res.fatTargetG > 0);
    assert.ok(typeof res.carbohydrateTargetG === 'number' && res.carbohydrateTargetG > 0);
    assert.ok(typeof res.fiberTargetG === 'number' && res.fiberTargetG > 0);

    const calculatedEnergy = (res.proteinTargetG * 4) + (res.carbohydrateTargetG * 4) + (res.fatTargetG * 9);
    assert.strictEqual(res.macroEnergyKcal, calculatedEnergy);
    assert.ok(Math.abs(res.energyDifferenceKcal) <= 5);
  });

  it('2. Contexto com caloricTargetKcal herdado direto de context.energy (sem passar energyTargetResult)', () => {
    const ctx = createMockContext({ energy: { caloricTargetKcal: 2200 } });
    const res = calculateDeterministicMacroTargets(ctx, null);

    assert.strictEqual(res.status, 'PASS');
    assert.strictEqual(res.caloricTargetKcal, 2200);
  });

  it('3. Ausência total de meta energética (sem N2.1 e context.energy sem caloricTargetKcal) -> BLOCKED', () => {
    const ctx = createMockContext({ energy: { caloricTargetKcal: null } });
    const res = calculateDeterministicMacroTargets(ctx, null);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.strictEqual(res.proteinTargetG, null);
    assert.strictEqual(res.carbohydrateTargetG, null);
    assert.strictEqual(res.fatTargetG, null);
    assert.strictEqual(res.fiberTargetG, null);
    assert.ok(res.blockingReasons.some(r => r.includes('Meta energética')));
  });

  it('4. N2.1 com status BLOCKED propaga imediatamente status BLOCKED para N2.2', () => {
    const ctx = createMockContext();
    const energyBlocked = createMockEnergyTarget({
      status: 'BLOCKED',
      caloricTargetKcal: null,
      blockingReasons: ['Bloqueio pediátrico prévio em N2.1']
    });
    const res = calculateDeterministicMacroTargets(ctx, energyBlocked);

    assert.strictEqual(res.status, 'BLOCKED');
    assert.strictEqual(res.proteinTargetG, null);
    assert.strictEqual(res.carbohydrateTargetG, null);
    assert.strictEqual(res.fatTargetG, null);
    assert.strictEqual(res.fiberTargetG, null);
    assert.ok(res.blockingReasons.some(r => r.includes('Motor N2.1 bloqueado')));
  });

  it('5. caloricTargetKcal nulo -> BLOCKED', () => {
    const ctx = createMockContext();
    const energyRes = createMockEnergyTarget({ caloricTargetKcal: null });
    const res = calculateDeterministicMacroTargets(ctx, energyRes);

    assert.strictEqual(res.status, 'BLOCKED');
  });

  it('6. caloricTargetKcal igual a zero (0) -> BLOCKED', () => {
    const ctx = createMockContext();
    const energyRes = createMockEnergyTarget({ caloricTargetKcal: 0 });
    const res = calculateDeterministicMacroTargets(ctx, energyRes);

    assert.strictEqual(res.status, 'BLOCKED');
  });

  it('7. caloricTargetKcal negativo (-500) -> BLOCKED', () => {
    const ctx = createMockContext();
    const energyRes = createMockEnergyTarget({ caloricTargetKcal: -500 });
    const res = calculateDeterministicMacroTargets(ctx, energyRes);

    assert.strictEqual(res.status, 'BLOCKED');
  });

  it('8. NaN em caloricTargetKcal -> BLOCKED', () => {
    const ctx = createMockContext();
    const energyRes = createMockEnergyTarget({ caloricTargetKcal: NaN });
    const res = calculateDeterministicMacroTargets(ctx, energyRes);

    assert.strictEqual(res.status, 'BLOCKED');
  });

  it('9. Infinity em caloricTargetKcal -> BLOCKED', () => {
    const ctx = createMockContext();
    const energyRes = createMockEnergyTarget({ caloricTargetKcal: Infinity });
    const res = calculateDeterministicMacroTargets(ctx, energyRes);

    assert.strictEqual(res.status, 'BLOCKED');
  });

  it('10. Peso corporal inválido (<= 0 ou NaN) -> BLOCKED', () => {
    const ctxZero = createMockContext({ anthropometry: { weightKg: 0 } });
    const resZero = calculateDeterministicMacroTargets(ctxZero, createMockEnergyTarget());
    assert.strictEqual(resZero.status, 'BLOCKED');

    const ctxNaN = createMockContext({ anthropometry: { weightKg: NaN } });
    const resNaN = calculateDeterministicMacroTargets(ctxNaN, createMockEnergyTarget());
    assert.strictEqual(resNaN.status, 'BLOCKED');
  });

  it('11. Objetivo clínico ausente (null ou vazio) -> BLOCKED', () => {
    const ctxNull = createMockContext({ objective: { clinicalObjective: null } });
    const resNull = calculateDeterministicMacroTargets(ctxNull, createMockEnergyTarget());
    assert.strictEqual(resNull.status, 'BLOCKED');
    assert.ok(resNull.blockingReasons.some(r => r.includes('Objetivo clínico')));

    const ctxEmpty = createMockContext({ objective: { clinicalObjective: '   ' } });
    const resEmpty = calculateDeterministicMacroTargets(ctxEmpty, createMockEnergyTarget());
    assert.strictEqual(resEmpty.status, 'BLOCKED');
  });

  it('12. Objetivo clínico não reconhecido -> BLOCKED (não assume manutenção silenciosamente)', () => {
    const ctxUnk = createMockContext({ objective: { clinicalObjective: 'ObjetivoDesconhecidoXYZ' } });
    const resUnk = calculateDeterministicMacroTargets(ctxUnk, createMockEnergyTarget());
    assert.strictEqual(resUnk.status, 'BLOCKED');
    assert.ok(resUnk.blockingReasons.some(r => r.includes('não reconhecido')));
  });

  // ── GRUPO 2: PROTEÍNA ─────────────────────────────────────────────────────

  it('13. Proteína em Perda de peso: calcula 2.0 g/kg deterministicamente', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Perda de peso' },
      anthropometry: { weightKg: 80.0 },
      patient: { patientType: 'Praticante recreativo' }
    });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2000 }));

    assert.strictEqual(res.proteinTargetG, 160); // 80 * 2.0
    assert.strictEqual(res.proteinKcal, 640);
    assert.strictEqual(res.provenance.protein.gPerKg, 2.0);
    assert.strictEqual(res.provenance.protein.reference, 'TOTAL_BODY_WEIGHT');
  });

  it('14. Proteína em Perda de peso + Atleta/Alta demanda formal: modula para 2.2 g/kg (2.0 + 0.2)', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Perda de peso' },
      anthropometry: { weightKg: 80.0 },
      patient: { patientType: 'Atleta de alto rendimento' }
    });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2000 }));

    assert.strictEqual(res.proteinTargetG, 176); // 80 * 2.2
    assert.strictEqual(res.proteinKcal, 704);
    assert.strictEqual(res.provenance.protein.gPerKg, 2.2);
    assert.strictEqual(res.provenance.protein.method, 'TOTAL_BODY_WEIGHT_ATHLETE_MODULATED');
  });

  it('15. Proteína em Hipertrofia: calcula 1.8 g/kg deterministicamente', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Hipertrofia' },
      anthropometry: { weightKg: 80.0 },
      patient: { patientType: 'Praticante recreativo' }
    });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2600 }));

    assert.strictEqual(res.proteinTargetG, 144); // 80 * 1.8
    assert.strictEqual(res.proteinKcal, 576);
    assert.strictEqual(res.provenance.protein.gPerKg, 1.8);
  });

  it('16. Proteína em Hipertrofia + Atleta: modula para 2.0 g/kg (1.8 + 0.2)', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Hipertrofia' },
      anthropometry: { weightKg: 80.0 },
      patient: { patientType: 'Atleta' }
    });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2600 }));

    assert.strictEqual(res.proteinTargetG, 160); // 80 * 2.0
    assert.strictEqual(res.provenance.protein.gPerKg, 2.0);
  });

  it('17. Proteína em Recomposição Corporal: calcula 2.2 g/kg deterministicamente', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Recomposição Corporal' },
      anthropometry: { weightKg: 75.0 }
    });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2200 }));

    assert.strictEqual(res.proteinTargetG, 165); // 75 * 2.2
    assert.strictEqual(res.provenance.protein.gPerKg, 2.2);
  });

  it('18. Proteína em Performance Esportiva: calcula 1.8 g/kg deterministicamente', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Performance Esportiva' },
      anthropometry: { weightKg: 70.0 },
      patient: { patientType: 'Praticante recreativo' }
    });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2400 }));

    assert.strictEqual(res.proteinTargetG, 126); // 70 * 1.8
    assert.strictEqual(res.provenance.protein.gPerKg, 1.8);
  });

  it('19. Proteína em Manutenção e Saúde: calcula 1.6 g/kg deterministicamente', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Manutenção e Saúde' },
      anthropometry: { weightKg: 70.0 }
    });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2100 }));

    assert.strictEqual(res.proteinTargetG, 112); // 70 * 1.6
    assert.strictEqual(res.provenance.protein.gPerKg, 1.6);
  });

  it('20. Referência padrão da proteína: TOTAL_BODY_WEIGHT é a estratégia ativa por padrão', () => {
    const ctx = createMockContext({ anthropometry: { weightKg: 70.0, leanMassKg: 55.0 } });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2000 }));

    assert.strictEqual(res.provenance.protein.reference, 'TOTAL_BODY_WEIGHT');
    assert.strictEqual(res.provenance.protein.referenceValue, 70.0);
  });

  it('21. Estratégia LEAN_MASS configurável: calcula sobre massa magra com parâmetros específicos', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Hipertrofia' },
      anthropometry: { weightKg: 80.0, leanMassKg: 65.0 }
    });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2500 }), {
      proteinStrategy: 'LEAN_MASS'
    });

    assert.strictEqual(res.provenance.protein.reference, 'LEAN_MASS');
    assert.strictEqual(res.provenance.protein.referenceValue, 65.0);
    assert.strictEqual(res.provenance.protein.gPerKg, 2.2); // hipertrofia lean mass param
    assert.strictEqual(res.proteinTargetG, 143); // Math.round(65.0 * 2.2)
  });

  it('22. Fallback de massa magra: quando LEAN_MASS é solicitada mas leanMassKg é nulo, aciona fallback para peso com WARNING', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Hipertrofia' },
      anthropometry: { weightKg: 80.0, leanMassKg: null }
    });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2500 }), {
      proteinStrategy: 'LEAN_MASS'
    });

    assert.strictEqual(res.status, 'WARNING');
    assert.strictEqual(res.provenance.protein.reference, 'TOTAL_BODY_WEIGHT');
    assert.strictEqual(res.provenance.protein.method, 'LEAN_MASS_UNAVAILABLE_FALLBACK_TO_BODY_WEIGHT');
    assert.ok(res.warnings.some(w => w.includes('LEAN_MASS solicitada, mas massa magra ausente')));
    assert.strictEqual(res.proteinTargetG, 144); // 80 * 1.8
  });

  it('23. Rastreabilidade da proteína: registra method, gPerKg, reference, referenceValue e policyParameter', () => {
    const ctx = createMockContext();
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget());

    const prov = res.provenance.protein;
    assert.ok(prov.reference);
    assert.ok(prov.referenceValue > 0);
    assert.ok(prov.method);
    assert.ok(prov.gPerKg > 0);
    assert.ok(prov.policyParameter);
    assert.strictEqual(prov.policyParameter.source, 'POLICY_PARAMETER');
  });

  it('24. Alteração de política altera deterministicamente o cálculo da proteína', () => {
    const ctx = createMockContext({ anthropometry: { weightKg: 80.0 } });
    const customPolicy = JSON.parse(JSON.stringify(DEFAULT_MACRO_POLICY));
    customPolicy.parameters.protein.byObjective.weightLoss.baseGPerKg.value = 2.5;

    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2200 }), {
      policy: customPolicy
    });

    assert.strictEqual(res.proteinTargetG, 200); // 80 * 2.5
    assert.strictEqual(res.provenance.protein.gPerKg, 2.5);
  });

  // ── GRUPO 3: GORDURA ──────────────────────────────────────────────────────

  it('25. Gordura calculada para cada objetivo conforme a política', () => {
    const objectives = [
      { name: 'Perda de peso', expectedFatPerKg: 0.75 },
      { name: 'Hipertrofia', expectedFatPerKg: 0.90 },
      { name: 'Recomposição Corporal', expectedFatPerKg: 0.80 },
      { name: 'Performance Esportiva', expectedFatPerKg: 0.90 },
      { name: 'Manutenção e Saúde', expectedFatPerKg: 0.85 }
    ];

    for (const item of objectives) {
      const ctx = createMockContext({
        objective: { clinicalObjective: item.name },
        anthropometry: { weightKg: 100.0 }
      });
      const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 3000 }));
      assert.strictEqual(res.provenance.fat.gPerKg, item.expectedFatPerKg);
      assert.strictEqual(res.fatTargetG, Math.round(100.0 * item.expectedFatPerKg));
    }
  });

  it('26. Piso de gordura por peso corporal (minFatGPerKg = 0.60 g/kg) protege contra restrição lipídica severa', () => {
    const ctx = createMockContext({ anthropometry: { weightKg: 80.0 } });
    const customPolicy = JSON.parse(JSON.stringify(DEFAULT_MACRO_POLICY));
    // Reduz absurdamente a gordura base para 0.20 g/kg
    customPolicy.parameters.fat.byObjective.weightLoss.value = 0.20;

    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2000 }), {
      policy: customPolicy
    });

    // 80kg * 0.60 g/kg = 48g de gordura (piso de peso aplicado)
    assert.strictEqual(res.fatTargetG, 48);
    assert.strictEqual(res.provenance.fat.floorApplied, 'WEIGHT_FLOOR');
  });

  it('27. Piso de gordura percentual (minFatPercent = 15%) protege contra dietas hipolipídicas extremas', () => {
    const ctx = createMockContext({ anthropometry: { weightKg: 50.0 } });
    const customPolicy = JSON.parse(JSON.stringify(DEFAULT_MACRO_POLICY));
    customPolicy.parameters.fat.byObjective.weightLoss.value = 0.30; // 50 * 0.3 = 15g

    // Caloric target 3000 kcal -> 15% = 450 kcal / 9 = 50g
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 3000 }), {
      policy: customPolicy
    });

    assert.strictEqual(res.fatTargetG, 50);
    assert.strictEqual(res.provenance.fat.floorApplied, 'ENERGY_FLOOR');
  });

  it('28. Precedência entre pisos: adota o maior valor de segurança entre peso e energia', () => {
    const ctx = createMockContext({ anthropometry: { weightKg: 100.0 } });
    const customPolicy = JSON.parse(JSON.stringify(DEFAULT_MACRO_POLICY));
    customPolicy.parameters.fat.byObjective.weightLoss.value = 0.20;
    // Peso: 100 * 0.6 = 60g
    // Energia: 1800 kcal * 0.15 / 9 = 30g
    // Maior é piso de peso (60g)
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 1800 }), {
      policy: customPolicy
    });

    assert.strictEqual(res.fatTargetG, 60);
    assert.strictEqual(res.provenance.fat.floorApplied, 'WEIGHT_FLOOR');
  });

  it('29. Procedência da gordura registra method, gPerKg, policyParameter e floorApplied', () => {
    const ctx = createMockContext();
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget());

    const prov = res.provenance.fat;
    assert.ok(prov.method);
    assert.ok(prov.gPerKg > 0);
    assert.ok(prov.policyParameter);
    assert.strictEqual(prov.floorApplied, 'NONE');
  });

  it('30. Política com parâmetros de gordura ausentes é estritamente rejeitada', () => {
    const customPolicy = JSON.parse(JSON.stringify(DEFAULT_MACRO_POLICY));
    delete customPolicy.parameters.fat.byObjective;
    const validation = validateMacroPolicy(customPolicy);
    assert.strictEqual(validation.isValid, false);
  });

  // ── GRUPO 4: CARBOIDRATO RESIDUAL E FECHAMENTO ───────────────────────────

  it('31. Carboidrato é calculado pelo resíduo energético Atwater: (calorias - P*4 - G*9) / 4', () => {
    const ctx = createMockContext({ anthropometry: { weightKg: 70.0 } });
    // Perda de peso: Prot = 70 * 2.0 = 140g (560 kcal)
    // Gordura = 70 * 0.75 = 52.5 -> Math.round(52.5) = 53g (477 kcal)
    // Total P + G = 560 + 477 = 1037 kcal
    // Meta = 2000 kcal -> Resíduo = 2000 - 1037 = 963 kcal
    // Carboidrato = Math.round(963 / 4) = Math.round(240.75) = 241g (964 kcal)
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2000 }));

    assert.strictEqual(res.proteinTargetG, 140);
    assert.strictEqual(res.fatTargetG, 53);
    assert.strictEqual(res.carbohydrateTargetG, 241);
    assert.strictEqual(res.carbohydrateKcal, 964);
  });

  it('32. Fechamento energético dentro da tolerância de arredondamento técnico (diff <= 5 kcal)', () => {
    const ctx = createMockContext({ anthropometry: { weightKg: 85.0 } });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2350 }));

    assert.strictEqual(res.status, 'PASS');
    const totalMacrosKcal = res.proteinKcal + res.carbohydrateKcal + res.fatKcal;
    assert.strictEqual(res.macroEnergyKcal, totalMacrosKcal);
    assert.ok(Math.abs(res.energyDifferenceKcal) <= 5);
  });

  it('33. Carboidrato garantido não-negativo quando a meta energética é suficiente', () => {
    const ctx = createMockContext();
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2000 }));

    assert.ok(res.carbohydrateTargetG >= 0);
  });

  it('34. Piso de carboidrato de 20g/dia funciona quando a energia suporta', () => {
    const ctx = createMockContext({ anthropometry: { weightKg: 70.0 } });
    // Meta calibrada para ficar logo acima de 20g de carbo
    // Prot = 140g (560 kcal), Fat = 53g (477 kcal), P+G = 1037 kcal
    // Meta = 1150 kcal -> Resíduo = 113 kcal -> ~28g carboidrato (> 20g)
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 1150 }));

    assert.strictEqual(res.status, 'PASS');
    assert.ok(res.carbohydrateTargetG >= 20);
  });

  it('35. Piso de carboidrato incompatível com energia baixa: motor BLOQUEIA sem inflar calorias artificialmente', () => {
    const ctx = createMockContext({ anthropometry: { weightKg: 80.0 } });
    // Prot = 160g (640 kcal), Fat = 60g (540 kcal), Total P+G = 1180 kcal
    // Piso de carb = 20g (80 kcal) -> Requer mínimo 1260 kcal
    // Se meta calórica for 1200 kcal -> Resíduo é 20 kcal (5g de carb < 20g)
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 1200 }));

    assert.strictEqual(res.status, 'BLOCKED');
    assert.strictEqual(res.proteinTargetG, null);
    assert.strictEqual(res.carbohydrateTargetG, null);
    assert.ok(res.blockingReasons.some(r => r.includes('piso mínimo de segurança de carboidrato')));
  });

  it('36. Modificação na proteína altera inversamente o carboidrato residual', () => {
    const ctx = createMockContext({ anthropometry: { weightKg: 80.0 } });
    const targetKcal = 2500;

    const res1 = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: targetKcal }));

    const customPolicy = JSON.parse(JSON.stringify(DEFAULT_MACRO_POLICY));
    customPolicy.parameters.protein.byObjective.weightLoss.baseGPerKg.value = 2.4; // +0.4 g/kg = +32g prot = +128 kcal
    const res2 = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: targetKcal }), {
      policy: customPolicy
    });

    assert.ok(res2.proteinTargetG > res1.proteinTargetG);
    assert.ok(res2.carbohydrateTargetG < res1.carbohydrateTargetG);
  });

  it('37. Modificação na gordura altera inversamente o carboidrato residual', () => {
    const ctx = createMockContext({ anthropometry: { weightKg: 80.0 } });
    const targetKcal = 2500;

    const res1 = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: targetKcal }));

    const customPolicy = JSON.parse(JSON.stringify(DEFAULT_MACRO_POLICY));
    customPolicy.parameters.fat.byObjective.weightLoss.value = 1.0; // aumento de gordura
    const res2 = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: targetKcal }), {
      policy: customPolicy
    });

    assert.ok(res2.fatTargetG > res1.fatTargetG);
    assert.ok(res2.carbohydrateTargetG < res1.carbohydrateTargetG);
  });

  it('38. Ausência estrita de carb cycling: microciclo no contexto não altera a distribuição de carboidratos', () => {
    const ctxWithoutSchedule = createMockContext({ weeklySchedule: [] });
    const ctxWithHeavySchedule = createMockContext({
      weeklySchedule: [
        { dayOfWeek: 'Segunda', demand: 'VERY_HIGH' },
        { dayOfWeek: 'Terça', demand: 'VERY_HIGH' }
      ]
    });

    const res1 = calculateDeterministicMacroTargets(ctxWithoutSchedule, createMockEnergyTarget({ caloricTargetKcal: 2200 }));
    const res2 = calculateDeterministicMacroTargets(ctxWithHeavySchedule, createMockEnergyTarget({ caloricTargetKcal: 2200 }));

    assert.strictEqual(res1.carbohydrateTargetG, res2.carbohydrateTargetG);
    assert.strictEqual(res1.proteinTargetG, res2.proteinTargetG);
    assert.strictEqual(res1.fatTargetG, res2.fatTargetG);
  });

  // ── GRUPO 5: FIBRA ALIMENTAR ──────────────────────────────────────────────

  it('39. Fibra calculada proporcionalmente pela política (14g / 1000 kcal)', () => {
    const ctx = createMockContext();
    // 3000 kcal -> (3000 / 1000) * 14 = 42g
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 3000 }));

    assert.strictEqual(res.fiberTargetG, 42);
    assert.strictEqual(res.provenance.fiber.method, 'DRI_ENERGY_PROPORTIONAL');
  });

  it('40. Aplicação do piso mínimo de fibras (25g/dia) para metas energéticas baixas', () => {
    const ctx = createMockContext({ anthropometry: { weightKg: 60.0 } });
    // 1500 kcal -> (1500 / 1000) * 14 = 21g -> piso 25g aplicado
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 1500 }));

    assert.strictEqual(res.fiberTargetG, 25);
  });

  it('41. Política de fibras ausente ou desativada retorna fiberTargetG = null com WARNING', () => {
    const ctx = createMockContext();
    const customPolicy = JSON.parse(JSON.stringify(DEFAULT_MACRO_POLICY));
    customPolicy.parameters.fiber.enabled = false;

    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2000 }), {
      policy: customPolicy
    });

    assert.strictEqual(res.fiberTargetG, null);
    assert.strictEqual(res.status, 'WARNING');
    assert.ok(res.warnings.some(w => w.includes('fibras ausente ou desativada')));
  });

  it('42. Fibra é estritamente isolada e NÃO participa da soma calórica 4P + 4C + 9G', () => {
    const ctx = createMockContext();
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2500 }));

    const macroSum = res.proteinKcal + res.carbohydrateKcal + res.fatKcal;
    assert.strictEqual(res.macroEnergyKcal, macroSum);
    // Não soma calorias das fibras na meta macroEnergyKcal
    assert.strictEqual(res.macroEnergyKcal, (res.proteinTargetG * 4) + (res.carbohydrateTargetG * 4) + (res.fatTargetG * 9));
  });

  it('43. Procedência da fibra registra method e policyParameter rastreáveis', () => {
    const ctx = createMockContext();
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget());

    assert.ok(res.provenance.fiber.method);
    assert.ok(res.provenance.fiber.policyParameter);
    assert.strictEqual(res.provenance.fiber.policyParameter.unit, 'g/1000kcal');
  });

  // ── GRUPO 6: CONTEXTO E NÃO-SOBREESCRITA ───────────────────────────────────

  it('44. Treino de musculação no contexto é registrado em factorsConsidered sem recalcular GET', () => {
    const ctx = createMockContext({
      training: { hasActiveTraining: true, activeSplit: 'PPL', routines: [{ name: 'Push' }, { name: 'Pull' }, { name: 'Legs' }] }
    });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2400 }));

    assert.ok(res.factorsConsidered.some(f => f.includes('Treino Musculação')));
    assert.strictEqual(res.caloricTargetKcal, 2400);
  });

  it('45. Cardio cadastrado no contexto é registrado em factorsConsidered sem adicionar calorias', () => {
    const ctx = createMockContext({
      cardio: { hasActiveCardio: true, sessions: [{ durationMinutes: 60 }, { durationMinutes: 60 }] }
    });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2100 }));

    assert.ok(res.factorsConsidered.some(f => f.includes('Cardio')));
    assert.strictEqual(res.caloricTargetKcal, 2100);
  });

  it('46. Microciclo semanal cadastrado é registrado em factorsConsidered', () => {
    const ctx = createMockContext({
      weeklySchedule: [{ dayOfWeek: 'Segunda-feira' }, { dayOfWeek: 'Quarta-feira' }]
    });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget());

    assert.ok(res.factorsConsidered.some(f => f.includes('Microciclo Semanal')));
  });

  it('47. Restrições e alergias são registradas em factorsConsidered e preservadas para N3', () => {
    const ctx = createMockContext({
      constraints: { dietaryRestrictions: ['Vegetariano'], allergies: ['Glúten'], intolerances: [], aversions: [] }
    });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget());

    assert.ok(res.factorsConsidered.some(f => f.includes('Restrições e Alergias')));
  });

  it('48. Jejum intermitente cadastrado é registrado em factorsConsidered sem prescrever protocolo', () => {
    const ctx = createMockContext({
      fasting: { hasActiveProtocol: true, protocolType: '16/8' }
    });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget());

    assert.ok(res.factorsConsidered.some(f => f.includes('Jejum Intermitente')));
  });

  it('49. Recordatório alimentar é registrado como referência e NÃO sobrescreve as metas', () => {
    const ctx = createMockContext({
      dietaryRecall: {
        hasRecall: true,
        itemsCount: 3,
        items: [{ foodName: 'Pizza', macros: { calories: 3500 } }]
      }
    });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2000 }));

    assert.ok(res.factorsConsidered.some(f => f.includes('Recordatório Alimentar')));
    assert.strictEqual(res.caloricTargetKcal, 2000);
  });

  it('50. Dados biométricos e de composição corporal são registrados em factorsConsidered', () => {
    const ctx = createMockContext({
      anthropometry: { weightKg: 80.0, bodyFatPercent: 15.0, leanMassKg: 68.0 }
    });
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget());

    assert.ok(res.factorsConsidered.some(f => f.includes('Dados Biométricos')));
  });

  // ── GRUPO 7: SEGURANÇA E INVARIANTES ──────────────────────────────────────

  it('51. Menor de 18 anos (age < 18) é estritamente BLOCKED com macros nulos', () => {
    const ctxPediatric = createMockContext({ patient: { age: 16 } });
    const res = calculateDeterministicMacroTargets(ctxPediatric, createMockEnergyTarget());

    assert.strictEqual(res.status, 'BLOCKED');
    assert.strictEqual(res.proteinTargetG, null);
    assert.strictEqual(res.carbohydrateTargetG, null);
    assert.strictEqual(res.fatTargetG, null);
    assert.strictEqual(res.fiberTargetG, null);
    assert.ok(res.blockingReasons.some(r => r.includes('menor de 18 anos')));
  });

  it('52. Meta insuficiente onde proteína + gordura excedem a meta energética gera resíduo negativo -> BLOCKED', () => {
    const ctx = createMockContext({ anthropometry: { weightKg: 100.0 } });
    // Prot = 200g (800 kcal), Fat = 75g (675 kcal), Total P+G = 1475 kcal
    // Meta de 1000 kcal -> residual = -475 kcal
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 1000 }));

    assert.strictEqual(res.status, 'BLOCKED');
    assert.strictEqual(res.proteinTargetG, null);
    assert.strictEqual(res.carbohydrateTargetG, null);
    assert.ok(res.blockingReasons.some(r => r.includes('carboidrato residual resultaria negativo')));
  });

  it('53. Discrepância na tolerância de fechamento energético gera BLOCKED se exceder tolerância configurada', () => {
    const ctx = createMockContext();
    const customPolicy = JSON.parse(JSON.stringify(DEFAULT_MACRO_POLICY));
    // Tolerância zero forçada e residual não divisível por 4
    customPolicy.parameters.safety.energyToleranceKcal.value = 0;

    // Se caloricTargetKcal for 2001, residual % 4 != 0 gerará diferença de 1 kcal
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2001 }), {
      policy: customPolicy
    });

    assert.strictEqual(res.status, 'BLOCKED');
    assert.ok(res.blockingReasons.some(r => r.includes('tolerância')));
  });

  it('54. Aporte proteico excessivo (> 3.5 g/kg) emite WARNING de segurança', () => {
    const ctx = createMockContext({ anthropometry: { weightKg: 60.0 } });
    const customPolicy = JSON.parse(JSON.stringify(DEFAULT_MACRO_POLICY));
    customPolicy.parameters.protein.byObjective.weightLoss.baseGPerKg.value = 4.0; // 4.0 g/kg > 3.5 g/kg

    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget({ caloricTargetKcal: 2200 }), {
      policy: customPolicy
    });

    assert.strictEqual(res.status, 'WARNING');
    assert.ok(res.warnings.some(w => w.includes('Aporte proteico') && w.includes('limiar de alerta')));
  });

  it('55. Imutabilidade profunda: Object.isFrozen(res) e estruturas internas são congeladas', () => {
    const ctx = createMockContext();
    const res = calculateDeterministicMacroTargets(ctx, createMockEnergyTarget());

    assert.strictEqual(Object.isFrozen(res), true);
    assert.strictEqual(Object.isFrozen(res.policy), true);
    assert.strictEqual(Object.isFrozen(res.provenance), true);
    assert.strictEqual(Object.isFrozen(res.provenance.protein), true);
    assert.strictEqual(Object.isFrozen(res.provenance.carbohydrate), true);
    assert.strictEqual(Object.isFrozen(res.provenance.fat), true);
    assert.strictEqual(Object.isFrozen(res.provenance.fiber), true);
    assert.strictEqual(Object.isFrozen(res.factorsConsidered), true);
    assert.strictEqual(Object.isFrozen(res.warnings), true);
    assert.strictEqual(Object.isFrozen(res.blockingReasons), true);
    assert.strictEqual(Object.isFrozen(res.rationale), true);

    assert.throws(() => {
      'use strict';
      res.proteinTargetG = 999;
    }, TypeError);
  });

  it('56. Determinismo estrito: 2 execuções idênticas geram saídas 100% idênticas serializáveis', () => {
    const ctx = createMockContext();
    const energy = createMockEnergyTarget({ caloricTargetKcal: 2150 });

    const res1 = calculateDeterministicMacroTargets(ctx, energy);
    const res2 = calculateDeterministicMacroTargets(ctx, energy);

    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2));
  });

  it('57. Contexto de entrada NÃO é alterado durante o cálculo', () => {
    const ctx = createMockContext();
    const ctxBefore = JSON.stringify(ctx);

    calculateDeterministicMacroTargets(ctx, createMockEnergyTarget());

    const ctxAfter = JSON.stringify(ctx);
    assert.strictEqual(ctxBefore, ctxAfter);
  });

  it('58. DEFAULT_MACRO_POLICY permanece estritamente congelada e não modificada', () => {
    assert.strictEqual(Object.isFrozen(DEFAULT_MACRO_POLICY), true);
    assert.strictEqual(Object.isFrozen(DEFAULT_MACRO_POLICY.parameters), true);
    assert.strictEqual(Object.isFrozen(DEFAULT_MACRO_POLICY.parameters.protein), true);
    assert.strictEqual(Object.isFrozen(DEFAULT_MACRO_POLICY.parameters.fat), true);
    assert.strictEqual(Object.isFrozen(DEFAULT_MACRO_POLICY.parameters.carbohydrate), true);
  });

});
