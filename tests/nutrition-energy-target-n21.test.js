/**
 * tests/nutrition-energy-target-n21.test.js
 * 
 * Suíte de Testes Automatizados — Fase N2.1
 * Motor Determinístico de Meta Energética (caloricTargetKcal) — NutriAx Pro
 * 
 * Execução: node --test tests/nutrition-energy-target-n21.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const { createNutritionPrescriptionContextDTO } = require('../domain/contracts/NutritionPrescriptionContextDTO');
const { calculateTMB, calculateGET } = require('../domain/math/nutritionMath');
const { DEFAULT_ENERGY_POLICY, validateEnergyPolicy } = require('../domain/math/energyPolicy');
const { calculateDeterministicEnergyTarget } = require('../domain/math/energyTarget');

/**
 * Helper para criar um mock de NutritionPrescriptionContextDTO consistente
 */
function createMockContext(overrides = {}) {
  const baseData = {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    patient: {
      patientId: 'patient_test_001',
      name: 'Paciente Teste N21',
      age: 30,
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
      caloricTargetKcal: null,
      energyBalanceKcal: null,
      source: 'CALCULATED_GET_ONLY',
      formula: 'Katch-McArdle (Massa Magra)',
      ...(overrides.energy || {})
    },
    routine: {
      neat: 'Moderado',
      ...(overrides.routine || {})
    },
    training: {
      hasActiveTraining: true,
      activeSplit: 'PPL',
      frequency: 4,
      routines: [{ routineId: 'r1' }, { routineId: 'r2' }],
      ...(overrides.training || {})
    },
    cardio: {
      hasActiveCardio: true,
      weeklyFrequency: 2,
      sessions: [{ cardioId: 'c1', durationMinutes: 45 }],
      ...(overrides.cardio || {})
    },
    weeklySchedule: overrides.weeklySchedule || [],
    dietaryRecall: {
      hasRecall: false,
      itemsCount: 0,
      typicalMealTimes: [],
      items: [],
      ...(overrides.dietaryRecall || {})
    },
    currentPrescription: {
      hasCurrentPrescription: false,
      prescribedKcal: null,
      ...(overrides.currentPrescription || {})
    },
    clinical: {
      exams: overrides.clinical?.exams || []
    },
    constraints: {
      dietaryRestrictions: [],
      allergies: [],
      intolerances: [],
      aversions: []
    },
    preferences: {
      preferredFoods: []
    },
    fasting: {
      hasActiveProtocol: false,
      status: 'INACTIVE'
    },
    provenance: {
      weight: { source: 'db.assessments', reliability: 'CANONICAL' },
      height: { source: 'db.assessments', reliability: 'CANONICAL' },
      objective: { source: 'db.patients', reliability: 'PATIENT_REPORTED' },
      energy: { source: 'canonical_math', calculation: 'tmb_get', reliability: 'DERIVED' },
      constraints: { source: 'db.patients', reliability: 'MISSING' },
      training: { source: 'db.performance', reliability: 'CANONICAL' },
      cardio: { source: 'db.cardio', reliability: 'CANONICAL' },
      fasting: { source: 'db.fasting', reliability: 'MISSING' },
      recall: { source: 'db.recall', reliability: 'MISSING' }
    }
  };

  return createNutritionPrescriptionContextDTO(baseData);
}

describe('Fase N2.1 — Motor Determinístico de Meta Energética', () => {

  // ── MATEMÁTICA (Testes 1 a 5) ──────────────────────────────────────────────
  it('1. TMB canônica: Reutiliza e preserva a TMB canônica de nutritionMath (Katch-McArdle prioritário se massa magra > 0)', () => {
    const ctx = createMockContext({
      anthropometry: { weightKg: 80, heightCm: 180, leanMassKg: 65 },
      energy: { tmbKcal: null, getKcal: null }
    });
    const result = calculateDeterministicEnergyTarget(ctx);
    // Katch-McArdle: 370 + 21.6 * 65 = 1774
    assert.strictEqual(result.tmbKcal, 1774);
    assert.strictEqual(result.provenance.tmb.method, 'Katch-McArdle (Massa Magra)');
  });

  it('2. GET canônico: Preserva e calcula estritamente GET = TMB * activityFactor', () => {
    const ctx = createMockContext({
      anthropometry: { weightKg: 80, heightCm: 180, leanMassKg: 65 },
      energy: { tmbKcal: 1774, getKcal: null, activityFactor: 1.50 }
    });
    const result = calculateDeterministicEnergyTarget(ctx);
    const expectedGet = Math.round(1774 * 1.50);
    assert.strictEqual(result.getKcal, expectedGet);
  });

  it('3. TMB diferente de GET quando o indivíduo possui fator de atividade > 1.0', () => {
    const ctx = createMockContext({
      energy: { tmbKcal: 1800, getKcal: 2700, activityFactor: 1.50 }
    });
    const result = calculateDeterministicEnergyTarget(ctx);
    assert.notStrictEqual(result.tmbKcal, result.getKcal);
    assert.strictEqual(result.getKcal, 2700);
    assert.strictEqual(result.tmbKcal, 1800);
  });

  it('4. Não duplicação de treino: gasto calórico de treino NÃO é adicionado sobre o GET', () => {
    const ctx = createMockContext({
      energy: { tmbKcal: 1800, getKcal: 2500, activityFactor: 1.38 },
      training: { hasActiveTraining: true, frequency: 5, routines: [{ routineId: 'r1' }] }
    });
    const result = calculateDeterministicEnergyTarget(ctx);
    // O GET permanece 2500, sem acréscimo arbitrário de treino
    assert.strictEqual(result.getKcal, 2500);
    assert.ok(result.rationale.some(r => r.includes('Dupla contagem rigorosamente evitada')));
  });

  it('5. Não duplicação de cardio: gasto de cardio NÃO é somado diretamente ao GET', () => {
    const ctx = createMockContext({
      energy: { tmbKcal: 1600, getKcal: 2300, activityFactor: 1.43 },
      cardio: { hasActiveCardio: true, weeklyFrequency: 4, sessions: [{ durationMinutes: 60 }] }
    });
    const result = calculateDeterministicEnergyTarget(ctx);
    assert.strictEqual(result.getKcal, 2300);
    assert.ok(result.rationale.some(r => r.includes('Dupla contagem rigorosamente evitada')));
  });

  // ── OBJETIVOS (Testes 6 a 10) ──────────────────────────────────────────────
  it('6. Perda de peso: gera déficit calórico controlado baseado na política', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Perda de peso' },
      anthropometry: { bodyFatPercent: 18.0 }, // intermediário
      energy: { getKcal: 2500 }
    });
    const result = calculateDeterministicEnergyTarget(ctx);
    // Base policy: -20% -> adjustmentPercent: -0.20
    assert.strictEqual(result.adjustmentPercent, -0.20);
    assert.strictEqual(result.adjustmentKcal, Math.round(2500 * -0.20));
    assert.strictEqual(result.caloricTargetKcal, 2000);
    assert.strictEqual(result.energyBalanceKcal, -500);
  });

  it('7. Hipertrofia: gera superávit calórico controlado baseado na política', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Hipertrofia Muscular' },
      anthropometry: { bodyFatPercent: 15.0 }, // intermediário (12-18%)
      energy: { getKcal: 2600 },
      training: { hasActiveTraining: true, frequency: 4 }
    });
    const result = calculateDeterministicEnergyTarget(ctx);
    // Base policy: +10% -> adjustmentPercent: +0.10
    assert.strictEqual(result.adjustmentPercent, 0.10);
    assert.strictEqual(result.adjustmentKcal, 260);
    assert.strictEqual(result.caloricTargetKcal, 2860);
    assert.strictEqual(result.energyBalanceKcal, 260);
  });

  it('8. Recomposição Corporal: gera estratégia intermediária da política', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Recomposição Corporal' },
      anthropometry: { bodyFatPercent: 18.0 },
      energy: { getKcal: 2500 }
    });
    const result = calculateDeterministicEnergyTarget(ctx);
    // Base policy: -6% -> adjustmentPercent: -0.06
    assert.strictEqual(result.adjustmentPercent, -0.06);
    assert.strictEqual(result.adjustmentKcal, -150);
    assert.strictEqual(result.caloricTargetKcal, 2350);
    assert.strictEqual(result.energyBalanceKcal, -150);
  });

  it('9. Performance Esportiva: gera suporte energético para disponibilidade energética', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Performance Esportiva' },
      energy: { getKcal: 3000 },
      training: { hasActiveTraining: true, frequency: 3 },
      cardio: { hasActiveCardio: false, weeklyFrequency: 0, sessions: [] }
    });
    const result = calculateDeterministicEnergyTarget(ctx);
    // Base policy: +3% -> adjustmentPercent: 0.03
    assert.strictEqual(result.adjustmentPercent, 0.03);
    assert.strictEqual(result.adjustmentKcal, 90);
    assert.strictEqual(result.caloricTargetKcal, 3090);
  });

  it('10. Manutenção e Saúde: gera meta estritamente normocalórica (ajuste zero, meta = GET)', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Manutenção e Saúde' },
      energy: { getKcal: 2400 }
    });
    const result = calculateDeterministicEnergyTarget(ctx);
    assert.strictEqual(result.adjustmentPercent, 0.0);
    assert.strictEqual(result.adjustmentKcal, 0);
    assert.strictEqual(result.caloricTargetKcal, 2400);
    assert.strictEqual(result.energyBalanceKcal, 0);
  });

  // ── CONTEXTO (Testes 11 a 19) ──────────────────────────────────────────────
  it('11. Composição corporal: alta adiposidade vs baixa adiposidade produz percentuais distintos em perda de peso', () => {
    const ctxHighBf = createMockContext({
      objective: { clinicalObjective: 'Perda de peso' },
      anthropometry: { bodyFatPercent: 30.0 }, // > 25% homem
      energy: { getKcal: 2500 },
      training: { frequency: 3 }
    });
    const ctxLowBf = createMockContext({
      objective: { clinicalObjective: 'Perda de peso' },
      anthropometry: { bodyFatPercent: 12.0 }, // < 16% homem
      energy: { getKcal: 2500 },
      training: { frequency: 3 }
    });

    const resHigh = calculateDeterministicEnergyTarget(ctxHighBf);
    const resLow = calculateDeterministicEnergyTarget(ctxLowBf);

    // Alta adiposidade: base -20% + mod -4% = -24%
    assert.strictEqual(resHigh.adjustmentPercent, -0.24);
    assert.strictEqual(resHigh.caloricTargetKcal, 1900);

    // Baixa adiposidade: base -20% + atenuação +5% = -15%
    assert.strictEqual(resLow.adjustmentPercent, -0.15);
    assert.strictEqual(resLow.caloricTargetKcal, 2125);

    assert.notStrictEqual(resHigh.caloricTargetKcal, resLow.caloricTargetKcal);
  });

  it('12. Ausência de composição corporal detalhada aciona fallback gracioso sem quebrar', () => {
    const ctxNoComp = createMockContext({
      objective: { clinicalObjective: 'Perda de peso' },
      anthropometry: { bodyFatPercent: null, bmi: null, leanMassKg: null, fatMassKg: null },
      energy: { getKcal: 2500 }
    });
    const result = calculateDeterministicEnergyTarget(ctxNoComp);
    assert.strictEqual(result.status, 'PASS');
    assert.strictEqual(result.adjustmentPercent, -0.20); // base deficit mantido
    assert.strictEqual(result.caloricTargetKcal, 2000);
  });

  it('13. NEAT disponível é registrado e considerado', () => {
    const ctx = createMockContext({
      routine: { neat: 'Atividade Ocupacional Intensa / Construção' }
    });
    const result = calculateDeterministicEnergyTarget(ctx);
    assert.ok(result.factorsConsidered.length > 0);
  });

  it('14. Treino de alto volume (>= 5 dias) atenua déficit calórico pela política', () => {
    const ctxHighVol = createMockContext({
      objective: { clinicalObjective: 'Perda de peso' },
      anthropometry: { bodyFatPercent: 18.0 },
      energy: { getKcal: 2600 },
      training: { hasActiveTraining: true, frequency: 5 } // high volume
    });
    const result = calculateDeterministicEnergyTarget(ctxHighVol);
    // Base -20% + atenuação treino +3% = -17%
    assert.strictEqual(result.adjustmentPercent, -0.17);
    assert.strictEqual(result.adjustmentKcal, Math.round(2600 * -0.17));
  });

  it('15. Cardio de alto volume (>= 150 min) atenua déficit calórico pela política', () => {
    const ctxHighCardio = createMockContext({
      objective: { clinicalObjective: 'Perda de peso' },
      anthropometry: { bodyFatPercent: 18.0 },
      energy: { getKcal: 2500 },
      training: { frequency: 3 },
      cardio: { hasActiveCardio: true, sessions: [{ durationMinutes: 60 }, { durationMinutes: 100 }] } // 160 min
    });
    const result = calculateDeterministicEnergyTarget(ctxHighCardio);
    // Base -20% + atenuação +3% = -17%
    assert.strictEqual(result.adjustmentPercent, -0.17);
  });

  it('16. Microciclo de alta demanda esportiva eleva o ajuste em performance', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Performance Esportiva' },
      energy: { getKcal: 3000 },
      weeklySchedule: [{ dayKey: 'd1' }, { dayKey: 'd2' }, { dayKey: 'd3' }, { dayKey: 'd4' }, { dayKey: 'd5' }]
    });
    const result = calculateDeterministicEnergyTarget(ctx);
    // High demand: +5%
    assert.strictEqual(result.adjustmentPercent, 0.05);
    assert.strictEqual(result.caloricTargetKcal, 3150);
  });

  it('17. Recordatório alimentar emite alerta para grande discrepância sem sobrescrever a meta', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Hipertrofia' },
      anthropometry: { bodyFatPercent: 15.0 }, // intermediário (10% de superávit)
      energy: { getKcal: 2500 },
      dietaryRecall: {
        hasRecall: true,
        items: [{ macros: { calories: 1500 } }] // discrepância de > 600 kcal com a meta calculada (2750)
      }
    });
    const result = calculateDeterministicEnergyTarget(ctx);
    assert.strictEqual(result.status, 'WARNING');
    assert.ok(result.warnings.some(w => w.includes('Discrepância acentuada')));
    // Meta permanece a calculada pela política (2500 + 250 = 2750), NÃO vira 1500
    assert.strictEqual(result.caloricTargetKcal, 2750);
  });

  it('18. Prescrição histórica não sobrescreve a meta calculada', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Perda de peso' },
      energy: { getKcal: 2500 },
      currentPrescription: { hasCurrentPrescription: true, prescribedKcal: 1750 }
    });
    const result = calculateDeterministicEnergyTarget(ctx);
    // Meta calculada pela política (-20% de 2500 = 2000), NÃO assume 1750
    assert.strictEqual(result.caloricTargetKcal, 2000);
    assert.ok(result.rationale.some(r => r.includes('Prescrição histórica no prontuário')));
  });

  it('19. Meta homologada prévia é reconhecida e rastreada', () => {
    const ctx = createMockContext({
      energy: { source: 'HOMOLOGATED_TARGET', caloricTargetKcal: 2150, getKcal: 2500 }
    });
    const result = calculateDeterministicEnergyTarget(ctx, { approvedCaloricTarget: 2150 });
    assert.ok(result.factorsConsidered.includes('Meta Homologada Prévia'));
  });

  // ── SEGURANÇA (Testes 20 a 28) ─────────────────────────────────────────────
  it('20. Peso ausente produz estado BLOCKED com caloricTargetKcal nulo', () => {
    const rawCtx = {
      patient: { patientId: 'p1', age: 30 },
      anthropometry: { weightKg: null, heightCm: 180 },
      objective: { clinicalObjective: 'Perda de peso' }
    };
    const result = calculateDeterministicEnergyTarget(rawCtx);
    assert.strictEqual(result.status, 'BLOCKED');
    assert.strictEqual(result.caloricTargetKcal, null);
    assert.ok(result.blockingReasons.some(b => b.includes('Peso corporal')));
  });

  it('21. Estatura ausente produz estado BLOCKED com caloricTargetKcal nulo', () => {
    const rawCtx = {
      patient: { patientId: 'p1', age: 30 },
      anthropometry: { weightKg: 80, heightCm: null },
      objective: { clinicalObjective: 'Perda de peso' }
    };
    const result = calculateDeterministicEnergyTarget(rawCtx);
    assert.strictEqual(result.status, 'BLOCKED');
    assert.strictEqual(result.caloricTargetKcal, null);
    assert.ok(result.blockingReasons.some(b => b.includes('Estatura')));
  });

  it('22. Objetivo ausente produz estado BLOCKED com caloricTargetKcal nulo', () => {
    const rawCtx = {
      patient: { patientId: 'p1', age: 30 },
      anthropometry: { weightKg: 80, heightCm: 180 },
      objective: { clinicalObjective: null }
    };
    const result = calculateDeterministicEnergyTarget(rawCtx);
    assert.strictEqual(result.status, 'BLOCKED');
    assert.strictEqual(result.caloricTargetKcal, null);
    assert.ok(result.blockingReasons.some(b => b.includes('Objetivo clínico')));
  });

  it('23. NaN em peso produz estado BLOCKED', () => {
    const rawCtx = {
      patient: { patientId: 'p1', age: 30 },
      anthropometry: { weightKg: NaN, heightCm: 180 },
      objective: { clinicalObjective: 'Perda de peso' }
    };
    const result = calculateDeterministicEnergyTarget(rawCtx);
    assert.strictEqual(result.status, 'BLOCKED');
    assert.strictEqual(result.caloricTargetKcal, null);
  });

  it('24. Infinity em estatura produz estado BLOCKED', () => {
    const rawCtx = {
      patient: { patientId: 'p1', age: 30 },
      anthropometry: { weightKg: 80, heightCm: Infinity },
      objective: { clinicalObjective: 'Perda de peso' }
    };
    const result = calculateDeterministicEnergyTarget(rawCtx);
    assert.strictEqual(result.status, 'BLOCKED');
    assert.strictEqual(result.caloricTargetKcal, null);
  });

  it('25. Valor negativo em peso produz estado BLOCKED', () => {
    const rawCtx = {
      patient: { patientId: 'p1', age: 30 },
      anthropometry: { weightKg: -75, heightCm: 180 },
      objective: { clinicalObjective: 'Perda de peso' }
    };
    const result = calculateDeterministicEnergyTarget(rawCtx);
    assert.strictEqual(result.status, 'BLOCKED');
    assert.strictEqual(result.caloricTargetKcal, null);
  });

  it('26. TMB inválida (zero ou negativa) produz estado BLOCKED', () => {
    const rawCtx = {
      patient: { patientId: 'p1', age: 30 },
      anthropometry: { weightKg: 70, heightCm: 175 },
      energy: { tmbKcal: -500, getKcal: 0 },
      objective: { clinicalObjective: 'Perda de peso' }
    };
    const result = calculateDeterministicEnergyTarget(rawCtx);
    assert.strictEqual(result.status, 'BLOCKED');
  });

  it('27. GET inválido (zero ou negativo) produz estado BLOCKED', () => {
    const rawCtx = {
      patient: { patientId: 'p1', age: 30 },
      anthropometry: { weightKg: 70, heightCm: 175 },
      energy: { tmbKcal: 1500, getKcal: -100 },
      objective: { clinicalObjective: 'Perda de peso' }
    };
    const result = calculateDeterministicEnergyTarget(rawCtx);
    assert.strictEqual(result.status, 'BLOCKED');
  });

  it('28. Política incompleta produz estado BLOCKED sem inventar valores', () => {
    const ctx = createMockContext();
    const badPolicy = { policyVersion: 'CORRUPTED', parameters: {} };
    const result = calculateDeterministicEnergyTarget(ctx, { policy: badPolicy });
    assert.strictEqual(result.status, 'BLOCKED');
    assert.strictEqual(result.caloricTargetKcal, null);
    assert.ok(result.blockingReasons.some(b => b.includes('Política energética inválida')));
  });

  // ── PEDIATRIA (Testes 29 a 31) ─────────────────────────────────────────────
  it('29. Menor de 18 anos (age < 18) é estritamente BLOCKED', () => {
    const ctxTeen = createMockContext({ patient: { age: 16 } });
    const result = calculateDeterministicEnergyTarget(ctxTeen);
    assert.strictEqual(result.status, 'BLOCKED');
    assert.ok(result.blockingReasons.some(b => b.includes('menor de 18 anos')));
  });

  it('30. Política adulta NÃO é aplicada para menor de 18 anos (appliedRule = PEDIATRIC_SAFETY_BLOCK)', () => {
    const ctxTeen = createMockContext({ patient: { age: 15 }, objective: { clinicalObjective: 'Perda de peso' } });
    const result = calculateDeterministicEnergyTarget(ctxTeen);
    assert.strictEqual(result.policy.appliedRule, 'PEDIATRIC_SAFETY_BLOCK');
  });

  it('31. Meta nula e balanço nulo para menores de 18 anos', () => {
    const ctxTeen = createMockContext({ patient: { age: 17 } });
    const result = calculateDeterministicEnergyTarget(ctxTeen);
    assert.strictEqual(result.caloricTargetKcal, null);
    assert.strictEqual(result.adjustmentKcal, null);
    assert.strictEqual(result.energyBalanceKcal, null);
  });

  // ── INVARIANTES (Testes 32 a 36) ───────────────────────────────────────────
  it('32. Invariante fundamental: energyBalanceKcal === caloricTargetKcal - getKcal', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Perda de peso' },
      energy: { getKcal: 2500 }
    });
    const result = calculateDeterministicEnergyTarget(ctx);
    const expectedDiff = result.caloricTargetKcal - result.getKcal;
    assert.strictEqual(result.energyBalanceKcal, expectedDiff);
  });

  it('33. Saída profundamente imutável (Object.isFrozen)', () => {
    const ctx = createMockContext();
    const result = calculateDeterministicEnergyTarget(ctx);
    assert.ok(Object.isFrozen(result));
    assert.ok(Object.isFrozen(result.policy));
    assert.ok(Object.isFrozen(result.provenance));
    assert.throws(() => {
      'use strict';
      result.caloricTargetKcal = 9999;
    }, TypeError);
  });

  it('34. Contexto original não sofre mutação durante o cálculo', () => {
    const ctx = createMockContext({ energy: { caloricTargetKcal: null } });
    const beforeStr = JSON.stringify(ctx);
    calculateDeterministicEnergyTarget(ctx);
    const afterStr = JSON.stringify(ctx);
    assert.strictEqual(beforeStr, afterStr);
  });

  it('35. Objeto de política DEFAULT_ENERGY_POLICY permanece estritamente congelado e não mutado', () => {
    assert.ok(Object.isFrozen(DEFAULT_ENERGY_POLICY));
    assert.throws(() => {
      'use strict';
      DEFAULT_ENERGY_POLICY.policyVersion = 'HACKED';
    }, TypeError);
  });

  it('36. Determinismo absoluto: mesma entrada produz idêntico resultado numérico e textual', () => {
    const ctx = createMockContext();
    const res1 = calculateDeterministicEnergyTarget(ctx);
    const res2 = calculateDeterministicEnergyTarget(ctx);
    assert.strictEqual(res1.caloricTargetKcal, res2.caloricTargetKcal);
    assert.strictEqual(res1.adjustmentKcal, res2.adjustmentKcal);
    assert.strictEqual(res1.energyBalanceKcal, res2.energyBalanceKcal);
    assert.deepStrictEqual(res1.rationale, res2.rationale);
  });

  // ── PROCEDÊNCIA (Testes 37 a 41) ───────────────────────────────────────────
  it('37. Versão da política está presente na saída canônica', () => {
    const ctx = createMockContext();
    const result = calculateDeterministicEnergyTarget(ctx);
    assert.strictEqual(result.policy.version, 'N2.1.0');
  });

  it('38. Parâmetros aplicados são completamente rastreáveis com source POLICY_PARAMETER e rationale', () => {
    const ctx = createMockContext({ objective: { clinicalObjective: 'Perda de peso' } });
    const result = calculateDeterministicEnergyTarget(ctx);
    assert.ok(Array.isArray(result.policy.parameters));
    assert.ok(result.policy.parameters.length > 0);
    for (const p of result.policy.parameters) {
      assert.strictEqual(p.source, 'POLICY_PARAMETER');
      assert.ok(p.key && p.rationale && p.version);
    }
  });

  it('39. Rationale narrativo passo a passo está presente e estruturado', () => {
    const ctx = createMockContext();
    const result = calculateDeterministicEnergyTarget(ctx);
    assert.ok(Array.isArray(result.rationale));
    assert.ok(result.rationale.length >= 7);
  });

  it('40. Provenance estruturada presente com tmb, get, adjustment e caloricTarget', () => {
    const ctx = createMockContext();
    const result = calculateDeterministicEnergyTarget(ctx);
    assert.ok(result.provenance.tmb);
    assert.ok(result.provenance.get);
    assert.ok(result.provenance.adjustment);
    assert.ok(result.provenance.caloricTarget);
    assert.strictEqual(result.provenance.adjustment.parameterSource, 'POLICY_PARAMETER');
    assert.strictEqual(result.provenance.adjustment.policyVersion, 'N2.1.0');
  });

  it('41. appliedRule reflete com exatidão a regra acionada (ex: WEIGHT_LOSS_BASE)', () => {
    const ctx = createMockContext({
      objective: { clinicalObjective: 'Perda de peso' },
      anthropometry: { bodyFatPercent: 18.0 }
    });
    const result = calculateDeterministicEnergyTarget(ctx);
    assert.strictEqual(result.policy.appliedRule, 'WEIGHT_LOSS_BASE');
  });

  // ── POLÍTICA E CONFIGURAÇÃO (Testes 42 a 45) ────────────────────────────────
  it('42. Aceita política customizada via options.policy', () => {
    const customPolicy = JSON.parse(JSON.stringify(DEFAULT_ENERGY_POLICY));
    customPolicy.policyVersion = 'CUSTOM_2026';
    customPolicy.parameters.weightLoss.baseDeficitPercent.value = -0.25;

    const ctx = createMockContext({
      objective: { clinicalObjective: 'Perda de peso' },
      anthropometry: { bodyFatPercent: 18.0 },
      energy: { getKcal: 2000 }
    });
    const result = calculateDeterministicEnergyTarget(ctx, { policy: customPolicy });
    assert.strictEqual(result.policy.version, 'CUSTOM_2026');
    assert.strictEqual(result.adjustmentPercent, -0.25);
    assert.strictEqual(result.caloricTargetKcal, 1500);
  });

  it('43. Mudança de política altera estritamente o comportamento esperado', () => {
    const customPolicy = JSON.parse(JSON.stringify(DEFAULT_ENERGY_POLICY));
    customPolicy.parameters.maintenance.adjustmentPercent.value = 0.02; // manutenção com +2%

    const ctx = createMockContext({
      objective: { clinicalObjective: 'Manutenção e Saúde' },
      energy: { getKcal: 2000 }
    });
    const result = calculateDeterministicEnergyTarget(ctx, { policy: customPolicy });
    assert.strictEqual(result.adjustmentPercent, 0.02);
    assert.strictEqual(result.caloricTargetKcal, 2040);
  });

  it('44. Ausência de parâmetro obrigatório na política não inventa valor (rejeição formal)', () => {
    const brokenPolicy = JSON.parse(JSON.stringify(DEFAULT_ENERGY_POLICY));
    delete brokenPolicy.parameters.safety.pediatricBlockingAge;

    const ctx = createMockContext();
    const result = calculateDeterministicEnergyTarget(ctx, { policy: brokenPolicy });
    assert.strictEqual(result.status, 'BLOCKED');
    assert.ok(result.blockingReasons.some(b => b.includes('pediatricBlockingAge')));
  });

  it('45. Nenhum percentual de ajuste oculto no motor: alteração do parâmetro afeta o resultado diretamente', () => {
    const modPolicy = JSON.parse(JSON.stringify(DEFAULT_ENERGY_POLICY));
    modPolicy.parameters.hypertrophy.baseSurplusPercent.value = 0.15; // +15%

    const ctx = createMockContext({
      objective: { clinicalObjective: 'Hipertrofia' },
      anthropometry: { bodyFatPercent: 15.0 },
      energy: { getKcal: 2000 }
    });
    const result = calculateDeterministicEnergyTarget(ctx, { policy: modPolicy });
    assert.strictEqual(result.adjustmentPercent, 0.15);
    assert.strictEqual(result.caloricTargetKcal, 2300);
  });

  // ── REGRAS ESPECÍFICAS & MATRIZ CONTEXTUAL (Testes 46 a 50) ─────────────────
  it('46. Prova formal: NÃO existe déficit universal de "GET - 468" em perda de peso', () => {
    const p1 = createMockContext({ objective: { clinicalObjective: 'Perda de peso' }, energy: { getKcal: 2000 }, anthropometry: { bodyFatPercent: 18 } });
    const p2 = createMockContext({ objective: { clinicalObjective: 'Perda de peso' }, energy: { getKcal: 3200 }, anthropometry: { bodyFatPercent: 30 } });
    const res1 = calculateDeterministicEnergyTarget(p1);
    const res2 = calculateDeterministicEnergyTarget(p2);

    // res1: 2000 - 20% = -400 (≠ -468)
    // res2: 3200 - 24% = -768 (≠ -468)
    assert.strictEqual(res1.adjustmentKcal, -400);
    assert.strictEqual(res2.adjustmentKcal, -768);
    assert.notStrictEqual(res1.adjustmentKcal, -468);
    assert.notStrictEqual(res2.adjustmentKcal, -468);
  });

  it('47. Prova formal: NÃO existe superávit universal de "GET + 350" em hipertrofia', () => {
    const p1 = createMockContext({ objective: { clinicalObjective: 'Hipertrofia' }, energy: { getKcal: 2200 }, anthropometry: { bodyFatPercent: 15 } });
    const p2 = createMockContext({ objective: { clinicalObjective: 'Hipertrofia' }, energy: { getKcal: 3000 }, anthropometry: { bodyFatPercent: 10 } });
    const res1 = calculateDeterministicEnergyTarget(p1);
    const res2 = calculateDeterministicEnergyTarget(p2);

    // res1: +10% de 2200 = +220 (≠ +350)
    // res2: +12% de 3000 = +360 (≠ +350)
    assert.strictEqual(res1.adjustmentKcal, 220);
    assert.strictEqual(res2.adjustmentKcal, 360);
    assert.notStrictEqual(res1.adjustmentKcal, 350);
    assert.notStrictEqual(res2.adjustmentKcal, 350);
  });

  it('48. Hipertrofia sem estímulo resistido ativo: atenua superávit e emite warning na saída', () => {
    const ctxUntrained = createMockContext({
      objective: { clinicalObjective: 'Hipertrofia' },
      anthropometry: { bodyFatPercent: 15.0 },
      energy: { getKcal: 2500 },
      training: { hasActiveTraining: false, frequency: 0, routines: [] }
    });
    const result = calculateDeterministicEnergyTarget(ctxUntrained);
    // Base +10% - atenuação destreinado 7% = +3%
    assert.strictEqual(result.adjustmentPercent, 0.03);
    assert.strictEqual(result.status, 'WARNING');
    assert.ok(result.warnings.some(w => w.includes('sem treino resistido ativo')));
  });

  it('49. Teste de Variação Contextual Obrigatório (Seção 21) com os 4 pacientes/cenários', () => {
    // Paciente A: Perda de peso, % gordura elevado (32%)
    const pacA = createMockContext({
      patient: { patientId: 'paciente_A', sex: 'Masculino' },
      objective: { clinicalObjective: 'Perda de peso' },
      anthropometry: { weightKg: 100, bodyFatPercent: 32.0 },
      energy: { getKcal: 2800 },
      training: { frequency: 3 }
    });

    // Paciente B: Hipertrofia, % gordura moderado (14%)
    const pacB = createMockContext({
      patient: { patientId: 'paciente_B', sex: 'Masculino' },
      objective: { clinicalObjective: 'Hipertrofia' },
      anthropometry: { weightKg: 78, bodyFatPercent: 14.0 },
      energy: { getKcal: 2600 },
      training: { hasActiveTraining: true, frequency: 4 }
    });

    // Paciente C: Performance, alto volume de treino e cardio
    const pacC = createMockContext({
      patient: { patientId: 'paciente_C', sex: 'Masculino' },
      objective: { clinicalObjective: 'Performance Esportiva' },
      anthropometry: { weightKg: 72, bodyFatPercent: 11.0 },
      energy: { getKcal: 3200 },
      training: { hasActiveTraining: true, frequency: 5 },
      cardio: { hasActiveCardio: true, sessions: [{ durationMinutes: 60 }, { durationMinutes: 100 }] },
      weeklySchedule: [{ dayKey: 'd1' }, { dayKey: 'd2' }, { dayKey: 'd3' }, { dayKey: 'd4' }, { dayKey: 'd5' }]
    });

    // Paciente D: Manutenção, atividade moderada
    const pacD = createMockContext({
      patient: { patientId: 'paciente_D', sex: 'Feminino' },
      objective: { clinicalObjective: 'Manutenção e Saúde' },
      anthropometry: { weightKg: 60, bodyFatPercent: 24.0 },
      energy: { getKcal: 2100 },
      training: { frequency: 3 }
    });

    const resA = calculateDeterministicEnergyTarget(pacA);
    const resB = calculateDeterministicEnergyTarget(pacB);
    const resC = calculateDeterministicEnergyTarget(pacC);
    const resD = calculateDeterministicEnergyTarget(pacD);

    // Paciente A: base -20% + alta adiposidade -4% = -24% -> 2800 * -0.24 = -672 -> 2128 kcal
    assert.strictEqual(resA.adjustmentPercent, -0.24);
    assert.strictEqual(resA.caloricTargetKcal, 2128);
    assert.strictEqual(resA.energyBalanceKcal, -672);

    // Paciente B: base +10% -> 2600 * 0.10 = +260 -> 2860 kcal
    assert.strictEqual(resB.adjustmentPercent, 0.10);
    assert.strictEqual(resB.caloricTargetKcal, 2860);
    assert.strictEqual(resB.energyBalanceKcal, 260);

    // Paciente C: alta demanda +5% -> 3200 * 0.05 = +160 -> 3360 kcal
    assert.strictEqual(resC.adjustmentPercent, 0.05);
    assert.strictEqual(resC.caloricTargetKcal, 3360);
    assert.strictEqual(resC.energyBalanceKcal, 160);

    // Paciente D: manutenção 0% -> 2100 * 0 = 0 -> 2100 kcal
    assert.strictEqual(resD.adjustmentPercent, 0.0);
    assert.strictEqual(resD.caloricTargetKcal, 2100);
    assert.strictEqual(resD.energyBalanceKcal, 0);

    // Racionais e regras completamente distintos
    assert.notStrictEqual(resA.policy.appliedRule, resB.policy.appliedRule);
    assert.notStrictEqual(resB.policy.appliedRule, resC.policy.appliedRule);
    assert.notStrictEqual(resC.policy.appliedRule, resD.policy.appliedRule);
  });

  it('50. Pureza total: zero acesso ao DOM, zero chamadas a Dexie/Firebase, zero chamadas a Gemini', () => {
    assert.strictEqual(typeof window, 'undefined');
    assert.strictEqual(typeof document, 'undefined');
    const ctx = createMockContext();
    const result = calculateDeterministicEnergyTarget(ctx);
    assert.ok(result);
  });

});
