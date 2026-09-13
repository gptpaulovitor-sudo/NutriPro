/**
 * tests/nutrition-prescription-context.test.js
 * 
 * Suíte de Testes Automatizados — Fase N1.1
 * Contexto Nutricional Canônico (NutriAx Pro)
 * 
 * Execução: node --test tests/nutrition-prescription-context.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const {
  validateNutritionPrescriptionContextDTO,
  createNutritionPrescriptionContextDTO
} = require('../domain/contracts/NutritionPrescriptionContextDTO');

const {
  normalizeHeight,
  resolvePatientBio,
  resolveLatestAssessment,
  resolveEnergyTargets,
  resolveConstraintsAndAversions,
  resolveRoutine,
  resolveDietaryRecall,
  resolveTraining,
  resolveCardio,
  resolveWeeklySchedule,
  resolveFastingProtocol,
  resolveClinicalExams,
  resolveCurrentPrescription,
  buildNutritionPrescriptionContext
} = require('../domain/adapters/nutritionContextAdapter');

describe('Fase N1.1 — Contexto Nutricional Canônico', () => {

  // -------------------------------------------------------------
  // Teste 1 — Paciente válido produz contexto
  // -------------------------------------------------------------
  it('Teste 1: Paciente válido produz contexto conforme contrato canônico', async () => {
    const stores = {
      patients: [{
        id: 'patient_001',
        name: 'Carlos Alberto Silva',
        gender: 'Masculino',
        birthDate: '1990-05-15',
        heightCm: 178,
        currentWeight: 80.5,
        objective: 'Hipertrofia Muscular'
      }],
      assessments: [{
        id: 'eval_001',
        patientId: 'patient_001',
        date: '2026-08-01',
        weightKg: 80.5,
        heightCm: 178,
        fatPercent: 14.5
      }]
    };

    const context = await buildNutritionPrescriptionContext('patient_001', { stores });

    assert.ok(context, 'Contexto deve ser gerado');
    assert.strictEqual(context.schemaVersion, '1.0.0');
    assert.strictEqual(context.patient.patientId, 'patient_001');
    assert.strictEqual(context.patient.name, 'Carlos Alberto Silva');
    assert.strictEqual(context.patient.sex, 'Masculino');
    assert.ok(typeof context.patient.age === 'number' && context.patient.age >= 30);

    const validation = validateNutritionPrescriptionContextDTO(context);
    assert.strictEqual(validation.isValid, true, `Erros de validação: ${validation.errors.join('; ')}`);
  });

  // -------------------------------------------------------------
  // Teste 2 — Avaliação mais recente é selecionada deterministicamente
  // -------------------------------------------------------------
  it('Teste 2: Avaliação antropométrica mais recente é selecionada deterministicamente', async () => {
    const stores = {
      patients: [{ id: 'p_eval_test', name: 'Mariana Costa' }],
      assessments: [
        { id: 'eval_old', patientId: 'p_eval_test', date: '2025-01-10', weightKg: 68.0, fatPercent: 28.0 },
        { id: 'eval_latest', patientId: 'p_eval_test', date: '2026-08-20', weightKg: 62.5, fatPercent: 21.0 },
        { id: 'eval_mid', patientId: 'p_eval_test', date: '2025-09-15', weightKg: 65.0, fatPercent: 24.5 }
      ]
    };

    const context = await buildNutritionPrescriptionContext('p_eval_test', { stores });

    assert.strictEqual(context.anthropometry.hasRecentAssessment, true);
    assert.strictEqual(context.anthropometry.assessmentId, 'eval_latest');
    assert.strictEqual(context.anthropometry.assessmentDate, '2026-08-20');
    assert.strictEqual(context.anthropometry.weightKg, 62.5);
    assert.strictEqual(context.anthropometry.bodyFatPercent, 21.0);
  });

  // -------------------------------------------------------------
  // Teste 3 — Peso da avaliação prevalece sobre cadastro antigo
  // -------------------------------------------------------------
  it('Teste 3: Peso da avaliação recente prevalece sobre o cadastro antigo com procedência CANONICAL', async () => {
    const stores = {
      patients: [{
        id: 'p_weight_pref',
        currentWeight: 88.0, // Peso antigo na anamnese
        usualWeight: 85.0
      }],
      assessments: [{
        id: 'eval_recent_weight',
        patientId: 'p_weight_pref',
        date: '2026-09-05',
        weightKg: 81.2 // Peso aferido na consulta mais recente
      }]
    };

    const context = await buildNutritionPrescriptionContext('p_weight_pref', { stores });

    assert.strictEqual(context.anthropometry.weightKg, 81.2, 'Peso deve vir da avaliação mais recente');
    assert.strictEqual(context.provenance.weight.source, 'db.assessments');
    assert.strictEqual(context.provenance.weight.reliability, 'CANONICAL');
  });

  // -------------------------------------------------------------
  // Teste 4 — Altura metros para centímetros
  // -------------------------------------------------------------
  it('Teste 4: Altura em metros (< 3.0) é normalizada para centímetros sem truncamento', () => {
    const h1 = normalizeHeight(1.75);
    const h2 = normalizeHeight('1.82');

    assert.strictEqual(h1, 175.0);
    assert.strictEqual(h2, 182.0);
  });

  // -------------------------------------------------------------
  // Teste 5 — Altura já em centímetros não duplica conversão
  // -------------------------------------------------------------
  it('Teste 5: Altura já em centímetros (>= 3.0) permanece inalterada (não vira 17500 cm)', () => {
    const h1 = normalizeHeight(175);
    const h2 = normalizeHeight(182.5);

    assert.strictEqual(h1, 175.0);
    assert.strictEqual(h2, 182.5);
  });

  // -------------------------------------------------------------
  // Teste 6 — Objetivo e procedência preservados
  // -------------------------------------------------------------
  it('Teste 6: Objetivo clínico e metas corporais são preservados com procedência', async () => {
    const stores = {
      patients: [{
        id: 'p_obj',
        objective: 'Recomposição Corporal',
        targetWeight: 75.0,
        targetBodyFatPercent: 12.0,
        objectiveSource: 'CLINICIAN_DEFINED'
      }]
    };

    const context = await buildNutritionPrescriptionContext('p_obj', { stores });

    assert.strictEqual(context.objective.clinicalObjective, 'Recomposição Corporal');
    assert.strictEqual(context.objective.targetWeightKg, 75.0);
    assert.strictEqual(context.objective.targetBodyFatPercent, 12.0);
    assert.strictEqual(context.objective.source, 'CLINICIAN_DEFINED');
    assert.strictEqual(context.provenance.objective.reliability, 'CLINICIAN_DEFINED');
  });

  // -------------------------------------------------------------
  // Teste 7 — Separação restrições / alergias / intolerâncias / aversões
  // -------------------------------------------------------------
  it('Teste 7: Restrições, alergias, intolerâncias e aversões permanecem estritamente separadas', async () => {
    const stores = {
      patients: [{
        id: 'p_constraints',
        dietaryRestrictions: 'Sem glúten; Vegetariano',
        allergies: ['Amendoim', 'Camarão'],
        intolerances: ['Lactose'],
        foodAversions: 'Fígado, Coentro, Jiló',
        clinicalNotes: 'Refluxo gastroesofágico leve'
      }]
    };

    const context = await buildNutritionPrescriptionContext('p_constraints', { stores });

    // Restrições
    assert.ok(context.constraints.dietaryRestrictions.includes('Sem glúten'));
    assert.ok(context.constraints.dietaryRestrictions.includes('Vegetariano'));

    // Alergias
    assert.deepStrictEqual(context.constraints.allergies, ['Amendoim', 'Camarão']);

    // Intolerâncias
    assert.deepStrictEqual(context.constraints.intolerances, ['Lactose']);

    // Aversões de paladar (NÃO podem estar misturadas em alergias nem intolerâncias!)
    assert.deepStrictEqual(context.constraints.aversions, ['Fígado', 'Coentro', 'Jiló']);
    assert.ok(!context.constraints.allergies.includes('Fígado'), 'Aversão não pode ser classificada como alergia');
    assert.ok(!context.constraints.intolerances.includes('Coentro'), 'Aversão não pode ser classificada como intolerância');

    // Notas clínicas
    assert.strictEqual(context.constraints.clinicalNotes, 'Refluxo gastroesofágico leve');
  });

  // -------------------------------------------------------------
  // Teste 8 — FoodId preservado no recordatório
  // -------------------------------------------------------------
  it('Teste 8: Recordatório alimentar é incorporado sem perda de foodId, quantidade e macros', async () => {
    const stores = {
      patients: [{ id: 'p_recall' }],
      dietaryRecall: [
        {
          id: 'rec_01',
          patientId: 'p_recall',
          foodId: 'FOOD_0082',
          foodName: 'Arroz Branco Cozido',
          quantity: 200,
          unit: 'g',
          mealName: 'Almoço',
          mealTime: '12:30',
          calories: 256.0,
          protein: 5.0,
          carbohydrate: 56.2,
          lipid: 0.6
        },
        {
          id: 'rec_02',
          patientId: 'p_recall',
          foodId: 'FOOD_0120',
          foodName: 'Peito de Frango Grelhado',
          quantity: 150,
          unit: 'g',
          mealName: 'Almoço',
          mealTime: '12:30',
          calories: 238.5,
          protein: 46.5,
          carbohydrate: 0.0,
          lipid: 4.8
        }
      ]
    };

    const context = await buildNutritionPrescriptionContext('p_recall', { stores });

    assert.strictEqual(context.dietaryRecall.hasRecall, true);
    assert.strictEqual(context.dietaryRecall.itemsCount, 2);
    assert.deepStrictEqual(context.dietaryRecall.typicalMealTimes, ['12:30']);

    const item1 = context.dietaryRecall.items[0];
    assert.strictEqual(item1.foodId, 'FOOD_0082');
    assert.strictEqual(item1.foodName, 'Arroz Branco Cozido');
    assert.strictEqual(item1.quantity, 200);
    assert.strictEqual(item1.macros.carbohydrate, 56.2);

    const item2 = context.dietaryRecall.items[1];
    assert.strictEqual(item2.foodId, 'FOOD_0120');
    assert.strictEqual(item2.macros.protein, 46.5);
  });

  // -------------------------------------------------------------
  // Teste 9 — Treino e cardio incorporados
  // -------------------------------------------------------------
  it('Teste 9: Prescrições ativas de treino e cardio são incorporadas como fatos reais', async () => {
    const stores = {
      patients: [{ id: 'p_perf', age: 28, restingHeartRate: 60 }],
      performanceMetabolica: {
        patientId: 'p_perf',
        activeSplit: 'PPL',
        splitSource: 'HUMAN',
        routines: [
          { routineId: 'pull', routineName: 'Pull (Costas/Bíceps)', day: 'Segunda', exercises: [{ name: 'Puxada', sets: 4, reps: '10' }] },
          { routineId: 'push', routineName: 'Push (Peito/Tríceps)', day: 'Terça', exercises: [{ name: 'Supino', sets: 4, reps: '8' }] }
        ]
      }
    };

    const perfCardioPrescription = {
      patientId: 'p_perf',
      sessions: [
        { cardioId: 'c1', type: 'Z2 Aeróbio', durationMinutes: 40, day: 'Quarta', modality: 'Esteira' }
      ]
    };

    const context = await buildNutritionPrescriptionContext('p_perf', { stores, perfCardioPrescription });

    assert.strictEqual(context.training.hasActiveTraining, true);
    assert.strictEqual(context.training.activeSplit, 'PPL');
    assert.strictEqual(context.training.splitSource, 'HUMAN');
    assert.strictEqual(context.training.routines.length, 2);

    assert.strictEqual(context.cardio.hasActiveCardio, true);
    assert.strictEqual(context.cardio.weeklyFrequency, 1);
    assert.strictEqual(context.cardio.sessions[0].cardioId, 'c1');
    assert.strictEqual(context.cardio.sessions[0].durationMinutes, 40);
    assert.ok(context.cardio.heartRate, 'Deve conter zonas de frequência cardíaca calculadas');
  });

  // -------------------------------------------------------------
  // Teste 10 — Microciclo sem HIGH_CARB/LOW_CARB artificial
  // -------------------------------------------------------------
  it('Teste 10: Microciclo semanal reflete apenas a demanda física real sem tags artificiais de carb cycling', async () => {
    const stores = {
      patients: [{ id: 'p_schedule' }],
      performanceMetabolica: {
        patientId: 'p_schedule',
        weeklySchedule: [
          { dayKey: 'segunda', dayName: 'Segunda-feira', training: { routineName: 'Pernas Pesado' }, cardio: null, rest: false },
          { dayKey: 'terca', dayName: 'Terça-feira', training: null, cardio: { type: 'Leve' }, rest: false },
          { dayKey: 'quarta', dayName: 'Quarta-feira', training: null, cardio: null, rest: true }
        ]
      }
    };

    const context = await buildNutritionPrescriptionContext('p_schedule', { stores });

    assert.strictEqual(context.weeklySchedule.length, 3);
    for (const day of context.weeklySchedule) {
      assert.strictEqual(day.demand, undefined, 'PROIBIDO conter demand');
      assert.strictEqual(day.carbLevel, undefined, 'PROIBIDO conter carbLevel');
      assert.ok(!JSON.stringify(day).includes('HIGH_CARB'), 'PROIBIDO conter HIGH_CARB');
      assert.ok(!JSON.stringify(day).includes('LOW_CARB'), 'PROIBIDO conter LOW_CARB');
    }

    // Validação de rejeição estrita se alguém tentar violar o contrato manualmente
    assert.throws(() => {
      createNutritionPrescriptionContextDTO({
        schemaVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
        patient: { patientId: 'p_invalid' },
        weeklySchedule: [{ dayKey: 'segunda', demand: 'HIGH_CARB' }]
      });
    }, /Proibido adicionar regras de carb cycling artificial/);
  });

  // -------------------------------------------------------------
  // Teste 11 — Jejum ativo
  // -------------------------------------------------------------
  it('Teste 11: Protocolo de jejum intermitente ativo é mapeado com precisão factual', async () => {
    const stores = {
      patients: [{ id: 'p_fasting' }],
      fastingProtocols: [{
        id: 'p_fasting_fasting',
        patientId: 'p_fasting',
        enabled: true,
        type: 'TRE',
        subtype: '16:8',
        feedingWindows: [{ start: '12:00', end: '20:00' }],
        fastingWindows: [{ start: '20:00', end: '12:00' }]
      }]
    };

    const context = await buildNutritionPrescriptionContext('p_fasting', { stores });

    assert.strictEqual(context.fasting.hasActiveProtocol, true);
    assert.strictEqual(context.fasting.status, 'ACTIVE');
    assert.strictEqual(context.fasting.type, 'TRE');
    assert.strictEqual(context.fasting.subtype, '16:8');
    assert.strictEqual(context.fasting.feedingWindows[0].start, '12:00');
    assert.strictEqual(context.fasting.feedingWindows[0].end, '20:00');
  });

  // -------------------------------------------------------------
  // Teste 12 — Horários ausentes retornam null
  // -------------------------------------------------------------
  it('Teste 12: Ausência de horários de rotina (wakeUpTime/bedTime) retorna estritamente null (sem 07:00 / 22:00 inventados)', async () => {
    const stores = {
      patients: [{
        id: 'p_no_routine_times',
        neatRoutine: 'Sedentário',
        sleepHours: 7
        // wakeUpTime e bedTime não informados
      }]
    };

    const context = await buildNutritionPrescriptionContext('p_no_routine_times', { stores });

    assert.strictEqual(context.routine.wakeUpTime, null, 'wakeUpTime deve ser estritamente null');
    assert.strictEqual(context.routine.bedTime, null, 'bedTime deve ser estritamente null');
    assert.strictEqual(context.routine.sleepHours, 7);
  });

  // -------------------------------------------------------------
  // Teste 13 — Proveniência e reliability
  // -------------------------------------------------------------
  it('Teste 13: Proveniência auditável existe com classificações canônicas corretas', async () => {
    const stores = {
      patients: [{
        id: 'p_prov',
        age: 30,
        currentWeight: 75.0,
        heightCm: 175,
        objective: 'Manutenção'
      }],
      assessments: [{
        id: 'eval_prov_01',
        patientId: 'p_prov',
        date: '2026-09-01',
        weightKg: 74.8,
        heightCm: 175
      }]
    };

    const context = await buildNutritionPrescriptionContext('p_prov', { stores });

    assert.ok(context.provenance, 'provenance deve existir');
    assert.strictEqual(context.provenance.weight.source, 'db.assessments');
    assert.strictEqual(context.provenance.weight.reliability, 'CANONICAL');
    assert.strictEqual(context.provenance.weight.recordId, 'eval_prov_01');
    assert.strictEqual(context.provenance.energy.reliability, 'DERIVED');
    assert.strictEqual(context.provenance.objective.reliability, 'PATIENT_REPORTED');
  });

  // -------------------------------------------------------------
  // Teste 14 — Dados opcionais ausentes + imutabilidade
  // -------------------------------------------------------------
  it('Teste 14: Dados opcionais ausentes não quebram o contexto; imutabilidade profunda é garantida', async () => {
    const stores = {
      patients: [{ id: 'p_minimal' }] // Registro ultra-minimalista
    };

    const context = await buildNutritionPrescriptionContext('p_minimal', { stores });

    assert.ok(context, 'Contexto mínimo deve ser gerado');
    assert.strictEqual(context.patient.patientId, 'p_minimal');
    assert.strictEqual(context.anthropometry.hasRecentAssessment, false);
    assert.strictEqual(context.training.hasActiveTraining, false);
    assert.strictEqual(context.cardio.hasActiveCardio, false);
    assert.strictEqual(context.dietaryRecall.hasRecall, false);
    assert.strictEqual(context.clinical.exams.length, 0);

    // Validação de congelamento profundo (deepFreeze)
    assert.ok(Object.isFrozen(context), 'Contexto raiz deve estar congelado');
    assert.ok(Object.isFrozen(context.patient), 'patient deve estar congelado');
    assert.ok(Object.isFrozen(context.energy), 'energy deve estar congelado');
    assert.ok(Object.isFrozen(context.constraints), 'constraints deve estar congelado');
    assert.ok(Object.isFrozen(context.constraints.dietaryRestrictions), 'arrays internos devem estar congelados');

    // Tentativa de mutação em tempo de execução
    assert.throws(() => {
      'use strict';
      context.patient.name = 'Tentativa de mutação indevida';
    }, TypeError);
  });

  // -------------------------------------------------------------
  // Teste 15 — TMB e GET são preservados separadamente
  // -------------------------------------------------------------
  it('Teste 15: TMB e GET são preservados separadamente e não confundidos', async () => {
    const stores = {
      patients: [{
        id: 'p_energy_split',
        gender: 'Masculino',
        age: 30,
        heightCm: 180,
        currentWeight: 80,
        activityFactor: 1.55
      }],
      assessments: [{
        id: 'eval_e',
        patientId: 'p_energy_split',
        date: '2026-09-01',
        weightKg: 80,
        heightCm: 180,
        leanMass: 65 // Katch-McArdle: 370 + 21.6 * 65 = 1774 kcal
      }]
    };

    const context = await buildNutritionPrescriptionContext('p_energy_split', { stores });

    assert.ok(typeof context.energy.tmbKcal === 'number' && context.energy.tmbKcal > 1000);
    assert.ok(typeof context.energy.getKcal === 'number' && context.energy.getKcal > context.energy.tmbKcal);
    assert.notStrictEqual(context.energy.tmbKcal, context.energy.getKcal, 'TMB e GET devem ser distintos');
    assert.ok(context.energy.formula.startsWith('Katch-McArdle'), `Fórmula esperada Katch-McArdle, recebido: ${context.energy.formula}`);
  });

  // -------------------------------------------------------------
  // Teste 16 — Meta energética homologada é preservada em caloricTargetKcal
  // -------------------------------------------------------------
  it('Teste 16: Meta energética explicitamente homologada é preservada em caloricTargetKcal', async () => {
    const stores = {
      patients: [{ id: 'p_homologated', currentWeight: 70, heightCm: 170, age: 25 }]
    };

    const context = await buildNutritionPrescriptionContext('p_homologated', {
      stores,
      approvedCaloricTarget: 2350
    });

    assert.strictEqual(context.energy.caloricTargetKcal, 2350, 'caloricTargetKcal deve ser a meta explicitamente homologada');
    assert.strictEqual(context.energy.source, 'HOMOLOGATED_TARGET');
  });

  // -------------------------------------------------------------
  // Teste 17 — Ausência de meta homologada mantém caloricTargetKcal === null
  // -------------------------------------------------------------
  it('Teste 17: Ausência de meta homologada mantém caloricTargetKcal === null (JAMAIS inventar meta)', async () => {
    const stores = {
      patients: [{ id: 'p_no_target', currentWeight: 75, heightCm: 175, age: 30, gender: 'Masculino' }]
    };

    const context = await buildNutritionPrescriptionContext('p_no_target', { stores });

    assert.ok(context.energy.getKcal > 0, 'GET pode estar calculado');
    assert.strictEqual(context.energy.caloricTargetKcal, null, 'caloricTargetKcal DEVE ser null sem homologação');
  });

  // -------------------------------------------------------------
  // Teste 18 — GET não é automaticamente transformado em meta
  // -------------------------------------------------------------
  it('Teste 18: GET calculado NÃO é promovido silenciosamente para caloricTargetKcal', async () => {
    const stores = {
      patients: [{ id: 'p_get_not_target', currentWeight: 80, heightCm: 180, age: 30, activityFactor: 1.5 }]
    };

    const context = await buildNutritionPrescriptionContext('p_get_not_target', { stores });

    assert.ok(context.energy.getKcal > 2000, 'GET deve existir');
    assert.strictEqual(context.energy.caloricTargetKcal, null, 'caloricTargetKcal NÃO pode assumir o GET automaticamente');
    assert.notStrictEqual(context.energy.caloricTargetKcal, context.energy.getKcal);
  });

  // -------------------------------------------------------------
  // Teste 19 — Prescrição histórica não vira automaticamente nova meta
  // -------------------------------------------------------------
  it('Teste 19: Prescrição histórica em db.prescriptions NÃO é promovida a nova meta energética', async () => {
    const stores = {
      patients: [{ id: 'p_hist_presc', currentWeight: 70, heightCm: 175, age: 28 }],
      prescriptions: [{
        id: 'presc_old_01',
        patientId: 'p_hist_presc',
        calories: 1950, // Calorias da prescrição antiga
        isApproved: false // Não é um alvo formalmente homologado para a nova consulta
      }]
    };

    const context = await buildNutritionPrescriptionContext('p_hist_presc', { stores });

    assert.strictEqual(context.currentPrescription.hasCurrentPrescription, true);
    assert.strictEqual(context.currentPrescription.prescribedKcal, 1950);
    assert.strictEqual(context.energy.caloricTargetKcal, null, 'Meta energética atual deve permanecer null');
  });

  // -------------------------------------------------------------
  // Teste 20 — energyBalanceKcal somente existe com GET e meta homologada
  // -------------------------------------------------------------
  it('Teste 20: energyBalanceKcal somente é calculado se GET E meta homologada existirem simultaneamente', async () => {
    // Caso 1: Sem meta homologada
    const ctx1 = await buildNutritionPrescriptionContext('p_bal_1', {
      stores: { patients: [{ id: 'p_bal_1', currentWeight: 70, heightCm: 170, age: 30 }] }
    });
    assert.strictEqual(ctx1.energy.energyBalanceKcal, null, 'Sem meta homologada, energyBalanceKcal deve ser null');

    // Caso 2: Sem GET (dados biométricos insuficientes) mas com meta informada
    const ctx2 = await buildNutritionPrescriptionContext('p_bal_2', {
      stores: { patients: [{ id: 'p_bal_2' }] }, // Sem peso/altura/idade
      approvedCaloricTarget: 2000
    });
    assert.strictEqual(ctx2.energy.getKcal, null);
    assert.strictEqual(ctx2.energy.energyBalanceKcal, null, 'Sem GET, energyBalanceKcal deve ser null');
  });

  // -------------------------------------------------------------
  // Teste 21 — energyBalanceKcal === caloricTargetKcal - getKcal
  // -------------------------------------------------------------
  it('Teste 21: energyBalanceKcal é calculado estritamente como caloricTargetKcal - getKcal', async () => {
    const stores = {
      patients: [{
        id: 'p_bal_calc',
        gender: 'Masculino',
        age: 30,
        heightCm: 180,
        currentWeight: 80,
        activityFactor: 1.5
      }]
    };

    // Submete com meta homologada em déficit
    const ctxDeficit = await buildNutritionPrescriptionContext('p_bal_calc', {
      stores,
      approvedCaloricTarget: 2200
    });

    const getVal = ctxDeficit.energy.getKcal;
    assert.ok(getVal > 0);
    const expectedDeficit = 2200 - getVal;
    assert.strictEqual(ctxDeficit.energy.energyBalanceKcal, expectedDeficit);

    // Submete com meta homologada em superávit
    const ctxSurplus = await buildNutritionPrescriptionContext('p_bal_calc', {
      stores,
      approvedCaloricTarget: 3200
    });
    const expectedSurplus = 3200 - getVal;
    assert.strictEqual(ctxSurplus.energy.energyBalanceKcal, expectedSurplus);
  });

});
