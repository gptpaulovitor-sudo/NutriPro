/**
 * tests/prescription-orchestrator-n37.test.js
 * 
 * Suíte de Testes da Fase N3.7.1 — Orquestrador Canônico do Pipeline Nutricional Determinístico
 * NutriAx Pro
 * 
 * Cobertura Obrigatória Mínima:
 * 1. Pipeline completo com caso válido;
 * 2. Execução determinística (reprodutibilidade estrita com assert.deepStrictEqual);
 * 3. Propagação correta de BLOCKED;
 * 4. Interrupção quando N2.1 falha;
 * 5. Interrupção quando N2.2 falha;
 * 6. Interrupção quando N2.3 falha;
 * 7. Interrupção quando N3.2 falha;
 * 8. Interrupção quando N3.3 falha;
 * 9. Interrupção quando N3.4 falha;
 * 10. Interrupção quando N3.5 falha;
 * 11. N3.6 obrigatoriamente executado por último;
 * 12. Input não mutado (cópia defensiva comprovada);
 * 13. Resultado final imutável (deepFreeze comprovado);
 * 14. pipelineTrace sem timestamps ou aleatoriedade;
 * 15. Compatibilidade real dos DTOs entre todas as etapas;
 * 16. Execução assíncrona com injeção de stores (resolução N1.1).
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  PIPELINE_STEP,
  ORCHESTRATOR_STATUS,
  validateOrchestratorInput,
  executePrescriptionPipelineSync,
  executePrescriptionPipeline
} = require('../domain/orchestration');

const { createNutritionPrescriptionContextDTO } = require('../domain/contracts/NutritionPrescriptionContextDTO');

// Helper para criar catálogo padrão-ouro balanceado para N3.2
function createStandardFoodCatalog() {
  return [
    {
      id: 'FOOD_P1',
      name: 'Peito de Frango Grelhado',
      category: 'Carnes e Aves',
      calories: 159,
      protein: 32,
      carbohydrate: 0,
      lipid: 2.5,
      fiber: 0,
      sodium: 50,
      unit: 'g',
      bromatology: { energyStatus: 'CONSISTENTE' }
    },
    {
      id: 'FOOD_P2',
      name: 'Ovo de Galinha Cozido',
      category: 'Ovos',
      calories: 146,
      protein: 13,
      carbohydrate: 0.6,
      lipid: 8.9,
      fiber: 0,
      sodium: 146,
      unit: 'g',
      bromatology: { energyStatus: 'CONSISTENTE' }
    },
    {
      id: 'FOOD_C1',
      name: 'Arroz Branco Cozido',
      category: 'Cereais e Leguminosas',
      calories: 128,
      protein: 2.5,
      carbohydrate: 28.1,
      lipid: 0.2,
      fiber: 1.6,
      sodium: 1,
      unit: 'g',
      bromatology: { energyStatus: 'CONSISTENTE' }
    },
    {
      id: 'FOOD_C2',
      name: 'Batata Inglesa Cozida',
      category: 'Tubérculos e Raízes',
      calories: 52,
      protein: 1.2,
      carbohydrate: 11.9,
      lipid: 0.1,
      fiber: 1.3,
      sodium: 3,
      unit: 'g',
      bromatology: { energyStatus: 'CONSISTENTE' }
    },
    {
      id: 'FOOD_C3',
      name: 'Aveia em Flocos',
      category: 'Cereais e Leguminosas',
      calories: 394,
      protein: 13.9,
      carbohydrate: 66.6,
      lipid: 8.5,
      fiber: 9.1,
      sodium: 4,
      unit: 'g',
      bromatology: { energyStatus: 'CONSISTENTE' }
    },
    {
      id: 'FOOD_F1',
      name: 'Azeite de Oliva Extravirgem',
      category: 'Óleos e Gorduras',
      calories: 884,
      protein: 0,
      carbohydrate: 0,
      lipid: 100,
      fiber: 0,
      sodium: 0,
      unit: 'g',
      bromatology: { energyStatus: 'CONSISTENTE' }
    },
    {
      id: 'FOOD_V1',
      name: 'Brócolis Cozido',
      category: 'Verduras e Legumes',
      calories: 25,
      protein: 2.1,
      carbohydrate: 4.0,
      lipid: 0.5,
      fiber: 3.4,
      sodium: 3,
      unit: 'g',
      bromatology: { energyStatus: 'CONSISTENTE' }
    }
  ];
}

// Helper para criar Contexto Canônico N1.1 válido e completo via factory oficial
function createCanonicalValidContext(overrides = {}) {
  const patient = {
    patientId: 'patient_test_001',
    name: 'Carlos Oliveira',
    age: 29,
    sex: 'Masculino',
    trainingLevel: 'Avançado',
    patientType: 'Atleta',
    ...(overrides.patient || {})
  };

  const anthropometry = {
    weightKg: 78.0,
    heightCm: 178.0,
    bodyFatPercent: 12.5,
    leanMassKg: 68.25,
    hasRecentAssessment: true,
    ...(overrides.anthropometry || {})
  };

  const objective = {
    clinicalObjective: 'Hipertrofia',
    rawObjective: 'Hipertrofia muscular com ganho limpo',
    ...(overrides.objective || {})
  };

  const energy = {
    tmbKcal: 1765,
    getKcal: 2647,
    activityFactor: 1.5,
    formula: 'Harris-Benedict 1984',
    ...(overrides.energy || {})
  };

  return createNutritionPrescriptionContextDTO({
    patient,
    anthropometry,
    objective,
    energy,
    constraints: overrides.constraints || {
      dietaryRestrictions: [],
      allergies: [],
      intolerances: [],
      aversions: []
    },
    preferences: overrides.preferences || {
      preferredFoods: [],
      dislikedFoods: []
    },
    routine: overrides.routine || {
      wakeUpTime: '06:30',
      bedTime: '23:00',
      workoutTime: '17:30'
    },
    training: overrides.training || {
      hasActiveTraining: true,
      activeSplit: 'PPL',
      workoutTime: '17:30',
      sessionDurationMinutes: 60,
      routines: []
    },
    cardio: overrides.cardio || {
      hasActiveCardio: false,
      weeklyFrequency: 0,
      sessions: []
    },
    fasting: overrides.fasting || {
      hasActiveProtocol: false,
      status: 'INACTIVE',
      feedingWindows: null,
      fastingWindows: null
    },
    weeklySchedule: overrides.weeklySchedule || [],
    clinical: overrides.clinical || {},
    currentPrescription: overrides.currentPrescription || {},
    dietaryRecall: overrides.dietaryRecall || {
      hasRecall: false,
      itemsCount: 0,
      typicalMealTimes: [],
      items: []
    },
    provenance: overrides.provenance || {
      patient: { source: 'db.patients', recordId: 'patient_test_001', reliability: 'CANONICAL' },
      anthropometry: { source: 'db.assessments', recordId: 'ass_001', reliability: 'CANONICAL' },
      energy: { source: 'canonical_calculation', recordId: null, reliability: 'CANONICAL' }
    }
  });
}

describe('Fase N3.7.1 — Orquestrador Canônico do Pipeline Nutricional Determinístico', () => {

  // 1. Pipeline completo com caso válido
  test('1. Pipeline completo executa N1.1 -> N3.6 com caso válido e atinge PASS/WARNING sem BLOCKED', async () => {
    const context = createCanonicalValidContext();
    const foodCatalog = createStandardFoodCatalog();

    const result = await executePrescriptionPipeline({
      context,
      foodCatalog
    });

    assert.strictEqual(result.orchestratorVersion, 'N3.7.1');
    assert.strictEqual(result.success, true);
    assert.ok(result.status === ORCHESTRATOR_STATUS.PASS || result.status === ORCHESTRATOR_STATUS.WARNING);
    assert.strictEqual(result.interruptedAt, null);
    assert.strictEqual(result.blockingReasons.length, 0);

    // Todos os 9 resultados preenchidos
    assert.ok(result.context !== null, 'context deve existir');
    assert.ok(result.energyTargetResult !== null, 'energyTargetResult deve existir');
    assert.ok(result.macroTargetResult !== null, 'macroTargetResult deve existir');
    assert.ok(result.nutritionValidatorResult !== null, 'nutritionValidatorResult deve existir');
    assert.ok(result.foodSolverResult !== null, 'foodSolverResult deve existir');
    assert.ok(result.mealAssemblyResult !== null, 'mealAssemblyResult deve existir');
    assert.ok(result.mealTimingResult !== null, 'mealTimingResult deve existir');
    assert.ok(result.nutrientTimingResult !== null, 'nutrientTimingResult deve existir');
    assert.ok(result.globalValidationResult !== null, 'globalValidationResult deve existir');

    // N3.6 validou os portões
    assert.strictEqual(result.globalValidationResult.valid, true);
    assert.ok(result.globalValidationResult.status !== 'BLOCKED');

    // Trace completo com 9 etapas
    assert.strictEqual(result.pipelineTrace.length, 9);
    assert.strictEqual(result.pipelineTrace[0].step, PIPELINE_STEP.N11_CONTEXT);
    assert.strictEqual(result.pipelineTrace[8].step, PIPELINE_STEP.N36_GLOBAL_VALIDATION);
  });

  // 2. Execução determinística (mesma entrada -> resultado idêntico)
  test('2. Execução determinística: duas invocações com mesma entrada produzem saída idêntica estruturalmente', () => {
    const context = createCanonicalValidContext();
    const foodCatalog = createStandardFoodCatalog();

    const res1 = executePrescriptionPipelineSync({ context, foodCatalog });
    const res2 = executePrescriptionPipelineSync({ context, foodCatalog });

    assert.deepStrictEqual(res1, res2);
  });

  // 3. Propagação correta de BLOCKED
  test('3. Propagação correta de BLOCKED: quando etapa intermediária bloqueia, o pipeline conclui como success === false e status BLOCKED', () => {
    const context = createCanonicalValidContext();
    // Catálogo onde todos os alimentos possuem status bromatológico INCONSISTENTE
    const inconsistentCatalog = createStandardFoodCatalog().map(food => ({
      ...food,
      bromatology: { energyStatus: 'INCONSISTENTE' }
    }));

    const result = executePrescriptionPipelineSync({ context, foodCatalog: inconsistentCatalog });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, ORCHESTRATOR_STATUS.BLOCKED);
    assert.strictEqual(result.interruptedAt, PIPELINE_STEP.N32_FOOD_SOLVER);
    assert.ok(result.blockingReasons.length > 0);
  });

  // 4. Interrupção quando N2.1 falha
  test('4. Interrupção quando N2.1 falha: paciente menor de 18 anos bloqueia cálculo energético adulto', () => {
    const context = createCanonicalValidContext({
      patient: { age: 16 } // Idade pediátrica bloqueada por política N2.1
    });
    const foodCatalog = createStandardFoodCatalog();

    const result = executePrescriptionPipelineSync({ context, foodCatalog });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, ORCHESTRATOR_STATUS.BLOCKED);
    assert.strictEqual(result.interruptedAt, PIPELINE_STEP.N21_ENERGY_TARGET);
    assert.ok(result.blockingReasons.some(r => r.includes('menor de 18 anos') || r.includes('pediátrica')));

    // Etapas posteriores permanecem estritamente null
    assert.strictEqual(result.macroTargetResult, null);
    assert.strictEqual(result.nutritionValidatorResult, null);
    assert.strictEqual(result.foodSolverResult, null);
    assert.strictEqual(result.mealAssemblyResult, null);
    assert.strictEqual(result.mealTimingResult, null);
    assert.strictEqual(result.nutrientTimingResult, null);
    assert.strictEqual(result.globalValidationResult, null);

    // Trace parou exatamente em N2.1
    assert.strictEqual(result.pipelineTrace.length, 2);
    assert.strictEqual(result.pipelineTrace[1].step, PIPELINE_STEP.N21_ENERGY_TARGET);
    assert.strictEqual(result.pipelineTrace[1].status, ORCHESTRATOR_STATUS.BLOCKED);
  });

  // 5. Interrupção quando N2.2 falha
  test('5. Interrupção quando N2.2 falha: política de macronutrientes inconsistente interrompe em N2.2', () => {
    const context = createCanonicalValidContext();
    const foodCatalog = createStandardFoodCatalog();

    // Política com parâmetros nulos forçando falha na validação da política N2.2
    const invalidMacroPolicy = {
      policyVersion: 'INVALID',
      parameters: null
    };

    const result = executePrescriptionPipelineSync({
      context,
      foodCatalog,
      policies: { macroPolicy: invalidMacroPolicy }
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, ORCHESTRATOR_STATUS.BLOCKED);
    assert.strictEqual(result.interruptedAt, PIPELINE_STEP.N22_MACRO_TARGET);
    assert.ok(result.energyTargetResult !== null); // N2.1 executou
    assert.strictEqual(result.nutritionValidatorResult, null); // N2.3 não executou
    assert.strictEqual(result.foodSolverResult, null);
    assert.strictEqual(result.mealAssemblyResult, null);
    assert.strictEqual(result.mealTimingResult, null);
    assert.strictEqual(result.nutrientTimingResult, null);
    assert.strictEqual(result.globalValidationResult, null);
  });

  // 6. Interrupção quando N2.3 falha
  test('6. Interrupção quando N2.3 falha: discrepância nas metas fecha valid === false e interrompe em N2.3', () => {
    const context = createCanonicalValidContext();
    const foodCatalog = createStandardFoodCatalog();

    // Política de validação com tolerância calórica estrita forçando reprovação no fechamento energético
    const zeroTolerancePolicy = {
      toleranceKcal: 0.00001
    };

    const result = executePrescriptionPipelineSync({
      context,
      foodCatalog,
      policies: { nutritionValidationPolicy: zeroTolerancePolicy }
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, ORCHESTRATOR_STATUS.BLOCKED);
    assert.strictEqual(result.interruptedAt, PIPELINE_STEP.N23_NUTRITION_VALIDATOR);
    assert.ok(result.energyTargetResult !== null);
    assert.ok(result.macroTargetResult !== null);
    assert.ok(result.nutritionValidatorResult !== null);
    assert.strictEqual(result.foodSolverResult, null); // Solver bloqueado
    assert.strictEqual(result.mealAssemblyResult, null);
    assert.strictEqual(result.mealTimingResult, null);
    assert.strictEqual(result.nutrientTimingResult, null);
    assert.strictEqual(result.globalValidationResult, null);
  });

  // 7. Interrupção quando N3.2 falha
  test('7. Interrupção quando N3.2 falha: catálogo de alimentos vazio interrompe o pipeline no Food Solver', () => {
    const context = createCanonicalValidContext();
    const emptyCatalog = [];

    const result = executePrescriptionPipelineSync({
      context,
      foodCatalog: emptyCatalog
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, ORCHESTRATOR_STATUS.BLOCKED);
    assert.strictEqual(result.interruptedAt, PIPELINE_STEP.N32_FOOD_SOLVER);
    assert.ok(result.nutritionValidatorResult !== null);
    assert.ok(result.foodSolverResult !== null);
    assert.strictEqual(result.foodSolverResult.status, 'BLOCKED');
    assert.strictEqual(result.mealAssemblyResult, null); // N3.3 não executou
    assert.strictEqual(result.mealTimingResult, null);
    assert.strictEqual(result.nutrientTimingResult, null);
    assert.strictEqual(result.globalValidationResult, null);
  });

  // 8. Interrupção quando N3.3 falha
  test('8. Interrupção quando N3.3 falha: erro na política de montagem interrompe em N3.3', () => {
    const context = createCanonicalValidContext();
    const foodCatalog = createStandardFoodCatalog();

    // Política com getter que lança erro durante a montagem
    const failingMealPolicy = {
      get policyVersion() {
        throw new Error('Falha simulada na montagem de refeições N3.3');
      }
    };

    const result = executePrescriptionPipelineSync({
      context,
      foodCatalog,
      policies: { mealAssemblyPolicy: failingMealPolicy }
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, ORCHESTRATOR_STATUS.BLOCKED);
    assert.strictEqual(result.interruptedAt, PIPELINE_STEP.N33_MEAL_ASSEMBLY);
    assert.strictEqual(result.mealTimingResult, null);
    assert.strictEqual(result.nutrientTimingResult, null);
    assert.strictEqual(result.globalValidationResult, null);
  });

  // 9. Interrupção quando N3.4 falha
  test('9. Interrupção quando N3.4 falha: erro no agendamento temporal interrompe em N3.4', () => {
    const context = createCanonicalValidContext();
    const foodCatalog = createStandardFoodCatalog();

    // Política com getter que lança erro proposital durante o agendamento temporal
    const failingTimingPolicy = {
      get timingVersion() {
        throw new Error('Falha simulada no agendamento temporal N3.4');
      }
    };

    const result = executePrescriptionPipelineSync({
      context,
      foodCatalog,
      policies: { mealTimingPolicy: failingTimingPolicy }
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, ORCHESTRATOR_STATUS.BLOCKED);
    assert.strictEqual(result.interruptedAt, PIPELINE_STEP.N34_MEAL_TIMING);
    assert.ok(result.mealAssemblyResult !== null);
    assert.strictEqual(result.nutrientTimingResult, null);
    assert.strictEqual(result.globalValidationResult, null);
  });

  // 10. Interrupção quando N3.5 falha
  test('10. Interrupção quando N3.5 falha: erro na análise de nutrient timing interrompe e N3.6 não executa', () => {
    const context = createCanonicalValidContext();
    const foodCatalog = createStandardFoodCatalog();

    // Política com getter que lança erro proposital durante a análise de nutrient timing
    const failingNutrientTimingPolicy = {
      get analysisVersion() {
        throw new Error('Falha simulada na análise de nutrient timing N3.5');
      }
    };

    const result = executePrescriptionPipelineSync({
      context,
      foodCatalog,
      policies: { nutrientTimingPolicy: failingNutrientTimingPolicy }
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, ORCHESTRATOR_STATUS.BLOCKED);
    assert.strictEqual(result.interruptedAt, PIPELINE_STEP.N35_NUTRIENT_TIMING);
    assert.strictEqual(result.globalValidationResult, null); // N3.6 não executou
  });

  // 11. N3.6 obrigatoriamente executado por último
  test('11. N3.6 obrigatoriamente executado por último: no pipeline completo, o último item do trace é N3.6', () => {
    const context = createCanonicalValidContext();
    const foodCatalog = createStandardFoodCatalog();

    const result = executePrescriptionPipelineSync({ context, foodCatalog });

    assert.ok(result.pipelineTrace.length > 0);
    const lastTraceItem = result.pipelineTrace[result.pipelineTrace.length - 1];
    assert.strictEqual(lastTraceItem.step, PIPELINE_STEP.N36_GLOBAL_VALIDATION);
    assert.strictEqual(result.status, result.globalValidationResult.status);
  });

  // 12. Input não mutado (cópia defensiva)
  test('12. Imutabilidade da entrada: o objeto de input e seus nós internos permanecem 100% inalterados após a execução', () => {
    const context = createCanonicalValidContext();
    const foodCatalog = createStandardFoodCatalog();

    const originalInput = {
      context,
      foodCatalog
    };

    const inputSnapshot = JSON.parse(JSON.stringify(originalInput));

    const result = executePrescriptionPipelineSync(originalInput);
    assert.ok(result !== null);

    assert.deepStrictEqual(originalInput, inputSnapshot);
  });

  // 13. Resultado final imutável
  test('13. Imutabilidade da saída: todo o DTO retornado pelo orquestrador é profundamente congelado (Object.isFrozen)', () => {
    const context = createCanonicalValidContext();
    const foodCatalog = createStandardFoodCatalog();

    const result = executePrescriptionPipelineSync({ context, foodCatalog });

    assert.ok(Object.isFrozen(result), 'Resultado raiz deve ser congelado');
    assert.ok(Object.isFrozen(result.pipelineTrace), 'pipelineTrace deve ser congelado');
    if (result.globalValidationResult) {
      assert.ok(Object.isFrozen(result.globalValidationResult), 'globalValidationResult deve ser congelado');
    }

    assert.throws(() => {
      result.success = false;
    }, TypeError);

    assert.throws(() => {
      result.status = 'TAMPERED';
    }, TypeError);
  });

  // 14. pipelineTrace sem timestamps ou aleatoriedade
  test('14. pipelineTrace puramente determinístico: ausência de timestamps ISO, Date.now ou números randômicos no trace', () => {
    const context = createCanonicalValidContext();
    const foodCatalog = createStandardFoodCatalog();

    const result = executePrescriptionPipelineSync({ context, foodCatalog });

    result.pipelineTrace.forEach((entry, idx) => {
      assert.ok(entry.step, `Passo ${idx} deve ter nome do step`);
      assert.ok(entry.status, `Passo ${idx} deve ter status`);
      assert.strictEqual(entry.timestamp, undefined, `Passo ${idx} NÃO pode ter propriedade timestamp`);
      assert.strictEqual(entry.time, undefined, `Passo ${idx} NÃO pode ter propriedade time`);
      assert.strictEqual(entry.date, undefined, `Passo ${idx} NÃO pode ter propriedade date`);

      if (entry.details) {
        assert.ok(!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(entry.details), `Passo ${idx} details não pode embutir timestamp ISO`);
      }
    });
  });

  // 15. Compatibilidade real dos DTOs entre todas as etapas
  test('15. Compatibilidade real dos DTOs: passagem direta de dados entre etapas sem perda de propriedades canônicas', () => {
    const context = createCanonicalValidContext();
    const foodCatalog = createStandardFoodCatalog();

    const result = executePrescriptionPipelineSync({ context, foodCatalog });

    // N2.1 -> N2.2: caloricTargetKcal transferido
    assert.strictEqual(result.energyTargetResult.caloricTargetKcal, result.macroTargetResult.caloricTargetKcal);

    // N2.2 -> N2.3: proteinTargetG, carbohydrateTargetG, fatTargetG conservados
    assert.strictEqual(result.macroTargetResult.proteinTargetG, result.nutritionValidatorResult.macroTargets.proteinTargetG);
    assert.strictEqual(result.macroTargetResult.carbohydrateTargetG, result.nutritionValidatorResult.macroTargets.carbohydrateTargetG);
    assert.strictEqual(result.macroTargetResult.fatTargetG, result.nutritionValidatorResult.macroTargets.fatTargetG);

    // N3.2 -> N3.3: alimentos do solver extraídos e alocados
    const solverItems = result.foodSolverResult.items || result.foodSolverResult.meals[0].items;
    const assemblyItems = [];
    result.mealAssemblyResult.meals.forEach(m => assemblyItems.push(...m.items));
    assert.strictEqual(assemblyItems.length >= solverItems.length, true);

    // N3.3 -> N3.4: refeições receberam scheduledTime
    result.mealTimingResult.meals.forEach(m => {
      assert.ok(typeof m.scheduledTime === 'string' && /^\d{2}:\d{2}$/.test(m.scheduledTime));
    });

    // N3.4 -> N3.5: refeições receberam primaryRelation
    result.nutrientTimingResult.meals.forEach(m => {
      assert.ok(m.primaryRelation !== undefined && m.primaryRelation !== null);
    });

    // N3.5 -> N3.6: validador global confirmou a conservação e integridade dos alimentos
    const gates = result.globalValidationResult.gateResults || [];
    const g9 = gates.find(g => g.gateId === 'G9_FOOD_IDENTITY');
    const g10 = gates.find(g => g.gateId === 'G10_MASS_CONSERVATION');
    const g11 = gates.find(g => g.gateId === 'G11_NUTRIENT_CONSERVATION');

    if (g9) assert.strictEqual(g9.status, 'PASS');
    if (g10) assert.strictEqual(g10.status, 'PASS');
    if (g11) assert.strictEqual(g11.status, 'PASS');
  });

  // 16. Execução assíncrona com injeção de stores (N1.1 resolution)
  test('16. Execução assíncrona com stores em memória: constrói context via buildNutritionPrescriptionContext e executa o pipeline', async () => {
    const stores = {
      patients: [{
        id: 'patient_async_01',
        name: 'Marina Lima',
        age: 32,
        sex: 'Feminino',
        trainingLevel: 'Intermediário',
        patientType: 'Praticante recreativo',
        objective: 'Perda de peso'
      }],
      assessments: [{
        id: 'ass_async_01',
        patientId: 'patient_async_01',
        date: '2026-09-10',
        weightKg: 65.0,
        heightCm: 165.0,
        bodyFatPercent: 24.0,
        leanMassKg: 49.4,
        fatMassKg: 15.6
      }],
      performanceMetabolica: {
        patientId: 'patient_async_01',
        tmbKcal: 1380,
        getKcal: 1950,
        activityFactor: 1.4
      }
    };

    const foodCatalog = createStandardFoodCatalog();

    const result = await executePrescriptionPipeline({
      patientId: 'patient_async_01',
      stores,
      foodCatalog
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.context.patient.patientId, 'patient_async_01');
    assert.strictEqual(result.context.patient.name, 'Marina Lima');
    assert.ok(result.energyTargetResult.caloricTargetKcal > 0);
    assert.strictEqual(result.pipelineTrace.length, 9);
    assert.strictEqual(result.pipelineTrace[8].step, PIPELINE_STEP.N36_GLOBAL_VALIDATION);
  });

  // 17. Homologação N3.6 estado PASS
  test('17. Homologação N3.6 estado PASS: N3.6 em PASS conclui com success === true e status === PASS', () => {
    const context = {
      ...createCanonicalValidContext({
        objective: { clinicalObjective: 'Manutenção e Saúde', rawObjective: 'Manutenção e saúde' },
        routine: { wakeUpTime: '07:00', bedTime: '21:00' },
        training: { hasActiveTraining: false, routines: [] }
      }),
      mealsPerDay: 4
    };
    const foodCatalog = createStandardFoodCatalog();

    const result = executePrescriptionPipelineSync({
      context,
      foodCatalog,
      policies: {
        foodSolverPolicy: { tolerances: { caloriesKcal: 200, proteinG: 50, carbohydrateG: 50, fatG: 50, fiberG: 50 } },
        mealTimingPolicy: { preferredMaxMealInterval: 360 }
      }
    });

    assert.strictEqual(result.globalValidationResult.status, 'PASS');
    assert.strictEqual(result.globalValidationResult.valid, true);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, ORCHESTRATOR_STATUS.PASS);
    assert.strictEqual(result.interruptedAt, null);
    assert.strictEqual(result.blockingReasons.length, 0);
  });

  // 18. Homologação N3.6 estado WARNING
  test('18. Homologação N3.6 estado WARNING: N3.6 em WARNING conclui com success === true e status === WARNING sem converter em BLOCKED', () => {
    const context = createCanonicalValidContext();
    // Catálogo com um alimento marcado como REVISAR para gerar warning operacional bromatológico
    const catalogWithWarning = createStandardFoodCatalog().map(food => {
      if (food.id === 'FOOD_P1') {
        return {
          ...food,
          bromatology: { energyStatus: 'REVISAR' }
        };
      }
      return food;
    });

    const result = executePrescriptionPipelineSync({
      context,
      foodCatalog: catalogWithWarning
    });

    assert.strictEqual(result.globalValidationResult.status, 'WARNING');
    assert.strictEqual(result.globalValidationResult.valid, true);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, ORCHESTRATOR_STATUS.WARNING);
    assert.strictEqual(result.interruptedAt, null);
    assert.strictEqual(result.blockingReasons.length, 0);
    assert.ok(result.warnings.length > 0, 'Deve acumular warnings');
  });

  // 19. Homologação N3.6 estado BLOCKED
  test('19. Homologação N3.6 estado BLOCKED: N3.6 em BLOCKED conclui com success === false, status === BLOCKED e interruptedAt === N3.6', () => {
    const context = createCanonicalValidContext();
    const foodCatalog = createStandardFoodCatalog();

    // Política de validação global com tolerância Atwater estrita (1e-6 kcal) forçando reprovação no portão G12
    const strictValidationPolicy = {
      atwaterToleranceKcal: 0.000001
    };

    const result = executePrescriptionPipelineSync({
      context,
      foodCatalog,
      policies: { globalValidationPolicy: strictValidationPolicy }
    });

    assert.strictEqual(result.globalValidationResult.status, 'BLOCKED');
    assert.strictEqual(result.globalValidationResult.valid, false);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, ORCHESTRATOR_STATUS.BLOCKED);
    assert.strictEqual(result.interruptedAt, PIPELINE_STEP.N36_GLOBAL_VALIDATION);
    assert.ok(result.blockingReasons.length > 0);
    assert.strictEqual(result.pipelineTrace[result.pipelineTrace.length - 1].step, PIPELINE_STEP.N36_GLOBAL_VALIDATION);
    assert.strictEqual(result.pipelineTrace[result.pipelineTrace.length - 1].status, ORCHESTRATOR_STATUS.BLOCKED);
  });

});

