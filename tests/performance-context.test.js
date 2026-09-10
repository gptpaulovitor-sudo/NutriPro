/**
 * tests/performance-context.test.js
 * 
 * Suíte de Testes da Fase 4 — Contexto Canônico de Performance.
 * Padrão Strangler Fig — NutriAx Pro.
 * 
 * Cobre rigorosamente:
 * 1. Teste Crítico: Dois Pacientes Sintéticos Diferentes (Matriz Discriminante Clínica).
 * 2. Teste de Completude dos 13 Domínios Estruturais sem Dados Falsos.
 * 3. Teste de Não-Duplicação Matemática (domain/math/nutritionMath.js).
 * 4. Teste de Imutabilidade Absoluta & Cópia Defensiva (Zero Vazamento de Referência).
 * 5. Teste de Rastreabilidade da Idade e Proveniência Granular.
 * 6. Teste de Perda de Informação da Anamnese (Anamnese Completa vs Apenas Objective).
 * 7. Teste de Relevância para Prescrição (Sinais Clínicos Essenciais).
 * 8. Teste de Separação Estado Atual vs Histórico.
 * 9. Teste de Integração Real: Dexie Mock -> Adapter -> PerformanceContextDTO (Zero DOM).
 */

const test = require('node:test');
const assert = require('node:assert');

const {
  validatePerformanceContextDTO,
  createPerformanceContextDTO
} = require('../domain/contracts/PerformanceContextDTO');

const {
  buildCanonicalPerformanceContext,
  fetchAndBuildCanonicalPerformanceContext,
  calculatePureHeartRateZones,
  resolvePatientAgeAndProvenance
} = require('../domain/adapters/performanceContextAdapter');

const nutritionMath = require('../domain/math/nutritionMath');

/**
 * Helper para remover metadados de geração antes de comparar equivalência clínica
 */
function stripTechnicalMetadata(ctx) {
  if (!ctx) return null;
  const clone = JSON.parse(JSON.stringify(ctx));
  delete clone.generatedAt;
  delete clone.schemaVersion;
  delete clone.provenance;
  return clone;
}

// =========================================================================
// 1. TESTE CRÍTICO — DOIS PACIENTES SINTÉTICOS DIFERENTES (MATRIZ DISCRIMINANTE)
// =========================================================================
test('PERF-CTX 1.1: Dois pacientes sintéticos produzem contextos materialmente distintos em todos os domínios', () => {
  // Paciente A: Adolescente atleta, hipertrofia, 5x/sem, sem lesões, eutrófico
  const rawPatientA = {
    id: 'patient-teen-athlete',
    name: 'Lucas Pereira',
    gender: 'Masculino',
    birthDate: '2010-04-15', // 16 anos
    height: 1.76,
    currentWeight: 68.0,
    usualWeight: 67.0,
    targetWeight: 72.0,
    objective: 'Hipertrofia & Ganho de Força',
    patientType: 'Atleta',
    trainingLevel: 'Intermediário',
    activityFactor: 1.55,
    workoutType: 'Musculação / Hipertrofia',
    workoutFrequency: '5x/semana',
    workoutDuration: '60 min',
    workoutIntensity: 'Alta',
    sleepHours: 8.5,
    sleepQuality: 'Excelente',
    stressLevel: 'Baixo',
    hydrationLiters: 3.5,
    neatRoutine: 'Moderado',
    prohibitedExercises: [],
    injuries: [],
    clinicalConstraints: [],
    availableEquipment: 'Full Gym'
  };

  const rawAssessmentA = {
    id: 'eval-teen-01',
    patientId: 'patient-teen-athlete',
    date: '2026-08-10',
    weightKg: 68.0,
    heightCm: 176.0,
    fatPercent: 11.5,
    targetBF: 10.0,
    leanMass: 60.18,
    fatMass: 7.82,
    waist: 76.0,
    hip: 94.0,
    skinfolds: { triceps: 7.0, subscapular: 8.5, abdominal: 11.0 }
  };

  const rawPrescriptionA = {
    id: 'presc-teen-01',
    patientId: 'patient-teen-athlete',
    calories: 2850,
    protGKg: 2.2,
    items: [
      { name: 'Frango com arroz', calories: 600, protein: 45 },
      { name: 'Shake hiperproteico', calories: 450, protein: 40 }
    ]
  };

  const rawPerformanceA = {
    activeSplit: 'PPL',
    splitSource: 'HUMAN',
    prescribedCardioId: 'cardio_01',
    cardioPrescription: {
      sessions: [
        { cardioId: 'c1', day: 'Terça', durationMinutes: 40, type: 'Zona 2' },
        { cardioId: 'c2', day: 'Quinta', durationMinutes: 40, type: 'Zona 2' }
      ]
    }
  };

  // Paciente B: Adulto sedentário com lesão e sobrepeso, perda de peso, 3x/sem
  const rawPatientB = {
    id: 'patient-adult-clinical',
    name: 'Roberto Andrade',
    gender: 'Masculino',
    age: 48, // idade direta
    height: 1.72,
    currentWeight: 98.0,
    usualWeight: 100.0,
    targetWeight: 82.0,
    objective: 'Perda de peso & Saúde Metabólica',
    patientType: 'Sedentário',
    trainingLevel: 'Iniciante',
    activityFactor: 1.30,
    workoutType: 'Treinamento Adaptado / Reabilitação',
    workoutFrequency: '3x/semana',
    workoutDuration: '45 min',
    workoutIntensity: 'Leve',
    sleepHours: 6.0,
    sleepQuality: 'Ruim',
    stressLevel: 'Alto',
    hydrationLiters: 2.0,
    neatRoutine: 'Leve',
    prohibitedExercises: ['Agachamento livre profundo', 'Leg press 45'],
    injuries: ['Condromalácia patelar grau 3 joelho direito'],
    clinicalConstraints: ['Evitar sobrecarga axial e impacto articular', 'Hipertensão arterial leve'],
    availableEquipment: 'Home Gym'
  };

  const rawAssessmentB = {
    id: 'eval-adult-01',
    patientId: 'patient-adult-clinical',
    date: '2026-08-15',
    weightKg: 98.0,
    heightCm: 172.0,
    fatPercent: 29.5,
    targetBF: 18.0,
    leanMass: 69.09,
    fatMass: 28.91,
    waist: 102.0,
    hip: 106.0,
    skinfolds: { triceps: 22.0, subscapular: 26.0, abdominal: 34.0 }
  };

  const rawPrescriptionB = {
    id: 'presc-adult-01',
    patientId: 'patient-adult-clinical',
    calories: 2000,
    protGKg: 1.8,
    items: [
      { name: 'Omelete com salada', calories: 400, protein: 30 }
    ]
  };

  const rawPerformanceB = {
    activeSplit: 'FullBody',
    splitSource: 'HUMAN',
    prescribedCardioId: 'cardio_02',
    cardioPrescription: {
      sessions: [
        { cardioId: 'c1', day: 'Quarta', durationMinutes: 30, type: 'Moderado Sem Impacto' }
      ]
    }
  };

  const ctxA = buildCanonicalPerformanceContext({
    rawPatient: rawPatientA,
    rawAssessment: rawAssessmentA,
    rawPrescription: rawPrescriptionA,
    rawPerformance: rawPerformanceA
  });

  const ctxB = buildCanonicalPerformanceContext({
    rawPatient: rawPatientB,
    rawAssessment: rawAssessmentB,
    rawPrescription: rawPrescriptionB,
    rawPerformance: rawPerformanceB
  });

  // 1. Desigualdade fundamental
  assert.notStrictEqual(ctxA, ctxB);
  assert.notDeepStrictEqual(stripTechnicalMetadata(ctxA), stripTechnicalMetadata(ctxB));

  // 2. MATRIZ DISCRIMINANTE OBRIGATÓRIA (Ajuste 4)
  // [patient]
  assert.notStrictEqual(ctxA.patient.age, ctxB.patient.age, 'patient.age deve ser diferente (16 vs 48)');
  assert.notStrictEqual(ctxA.patient.patientType, ctxB.patient.patientType, 'patient.patientType deve ser diferente');
  assert.notStrictEqual(ctxA.patient.trainingLevel, ctxB.patient.trainingLevel, 'patient.trainingLevel deve ser diferente');
  
  // [anamnesis]
  assert.notStrictEqual(ctxA.anamnesis.objective, ctxB.anamnesis.objective, 'anamnesis.objective deve ser diferente');
  assert.notStrictEqual(ctxA.anamnesis.workoutFrequency, ctxB.anamnesis.workoutFrequency, 'anamnesis.workoutFrequency deve ser diferente');
  assert.notStrictEqual(ctxA.anamnesis.sleepHours, ctxB.anamnesis.sleepHours, 'anamnesis.sleepHours deve ser diferente');
  assert.notStrictEqual(ctxA.anamnesis.stressLevel, ctxB.anamnesis.stressLevel, 'anamnesis.stressLevel deve ser diferente');
  
  // [anthropometry & bodyComposition]
  assert.notStrictEqual(ctxA.anthropometry.weightKg, ctxB.anthropometry.weightKg, 'anthropometry.weightKg deve ser diferente');
  assert.notStrictEqual(ctxA.bodyComposition.bodyFatPercent, ctxB.bodyComposition.bodyFatPercent, 'bodyComposition.bodyFatPercent deve ser diferente');
  assert.notStrictEqual(ctxA.bodyComposition.leanMassKg, ctxB.bodyComposition.leanMassKg, 'bodyComposition.leanMassKg deve ser diferente');
  
  // [energy]
  assert.notStrictEqual(ctxA.energy.tmbKcal, ctxB.energy.tmbKcal, 'energy.tmbKcal deve ser diferente');
  assert.notStrictEqual(ctxA.energy.getKcal, ctxB.energy.getKcal, 'energy.getKcal deve ser diferente');
  assert.notStrictEqual(ctxA.energy.energyBalanceKcal, ctxB.energy.energyBalanceKcal, 'energy.energyBalanceKcal deve ser diferente (superávit vs déficit)');
  assert.ok(ctxA.energy.energyBalanceKcal > 0, 'Paciente A deve estar em superávit anabólico');
  assert.ok(ctxB.energy.energyBalanceKcal < 0, 'Paciente B deve estar em déficit calórico');

  // [training]
  assert.strictEqual(ctxA.training.current.weeklyFrequency, 5, 'Treino A deve ter frequência 5');
  assert.strictEqual(ctxB.training.current.weeklyFrequency, 3, 'Treino B deve ter frequência 3');
  assert.notStrictEqual(ctxA.training.current.activeSplit, ctxB.training.current.activeSplit, 'Splits devem ser diferentes (PPL vs FullBody)');

  // [constraints]
  assert.strictEqual(ctxA.constraints.injuries.length, 0, 'Paciente A não possui lesões');
  assert.ok(ctxB.constraints.injuries.length > 0, 'Paciente B possui lesão documentada');
  assert.strictEqual(ctxA.constraints.prohibitedExercises.length, 0, 'Paciente A não possui exercícios proibidos');
  assert.ok(ctxB.constraints.prohibitedExercises.length > 0, 'Paciente B possui exercícios proibidos');

  // [cardio]
  assert.strictEqual(ctxA.cardio.current.weeklyFrequency, 2, 'Cardio A tem 2 sessões');
  assert.strictEqual(ctxB.cardio.current.weeklyFrequency, 1, 'Cardio B tem 1 sessão');
  assert.notStrictEqual(ctxA.cardio.current.prescribedCardioId, ctxB.cardio.current.prescribedCardioId);

  // [clinicalFlags]
  assert.strictEqual(ctxA.clinicalFlags.isMinor, true, 'Paciente A é menor de idade (16 anos)');
  assert.strictEqual(ctxB.clinicalFlags.isMinor, false, 'Paciente B é adulto (48 anos)');
  assert.strictEqual(ctxA.clinicalFlags.clinicalReviewRequired, true, 'Ambos requerem revisão clínica por motivos distintos');
  assert.strictEqual(ctxB.clinicalFlags.clinicalReviewRequired, true);
  assert.ok(ctxA.clinicalFlags.reasons.some(r => r.includes('menor de idade')));
  assert.ok(ctxB.clinicalFlags.reasons.some(r => r.includes('lesões ativas')));
});

// =========================================================================
// 2. TESTE DE COMPLETUDE DOS 13 DOMÍNIOS & PRESERVAÇÃO DE NULOS (SEM DADOS FALSOS)
// =========================================================================
test('PERF-CTX 2.1: Estrutura canônica contém todos os 13 domínios e preserva nulos sem inventar valores clínicos', () => {
  // Paciente com dados mínimos (sem avaliação, sem cardio, sem prescrição)
  const minimalPatient = {
    id: 'pt-min',
    name: 'Paciente Mínimo',
    gender: 'Feminino',
    age: 28
  };

  const ctx = buildCanonicalPerformanceContext({ rawPatient: minimalPatient });

  // 1. Verificação dos 13 domínios
  const requiredDomains = [
    'schemaVersion', 'generatedAt', 'patient', 'anamnesis', 'assessment',
    'anthropometry', 'bodyComposition', 'energy', 'nutrition', 'training',
    'cardio', 'constraints', 'clinicalFlags', 'provenance'
  ];

  for (const d of requiredDomains) {
    assert.notStrictEqual(ctx[d], undefined, `Domínio "${d}" não pode ser undefined`);
  }

  // 2. Verificação de dados ausentes preservados rigorosamente como null ou [] (Ajuste 3)
  assert.strictEqual(ctx.assessment, null, 'assessment deve ser explicitamente null quando ausente');
  assert.strictEqual(ctx.anthropometry.skinfolds, null, 'skinfolds deve ser null quando não avaliado');
  assert.strictEqual(ctx.bodyComposition.bodyFatPercent, null, 'bodyFatPercent deve ser null (NÃO pode inventar 18% ou 25%)');
  assert.strictEqual(ctx.bodyComposition.leanMassKg, null, 'leanMassKg deve ser null');
  assert.strictEqual(ctx.energy.tmbKcal, null, 'tmbKcal deve ser null quando não há peso e altura');
  assert.strictEqual(ctx.energy.getKcal, null, 'getKcal deve ser null');
  assert.strictEqual(ctx.energy.caloricTargetKcal, null, 'caloricTargetKcal deve ser null');
  assert.strictEqual(ctx.energy.energyBalanceKcal, null, 'energyBalanceKcal deve ser null');
  assert.strictEqual(ctx.energy.goalProjection, null, 'goalProjection deve ser null');
  assert.strictEqual(ctx.nutrition.current.prescribedKcal, null, 'prescribedKcal deve ser null');
  assert.strictEqual(ctx.nutrition.current.fasting, null, 'fasting deve ser null quando ausente');
  
  assert.deepStrictEqual(ctx.training.current.routines, [], 'routines deve ser []');
  assert.deepStrictEqual(ctx.training.history, [], 'training.history deve ser []');
  assert.deepStrictEqual(ctx.nutrition.history, [], 'nutrition.history deve ser []');
  assert.deepStrictEqual(ctx.cardio.current.sessions, [], 'cardio.sessions deve ser []');
  assert.deepStrictEqual(ctx.cardio.history, [], 'cardio.history deve ser []');
  assert.deepStrictEqual(ctx.constraints.injuries, [], 'injuries deve ser []');
  assert.deepStrictEqual(ctx.constraints.prohibitedExercises, [], 'prohibitedExercises deve ser []');
  assert.strictEqual(ctx.constraints.availableEquipment, null, 'availableEquipment deve ser null quando ausente');

  // 3. Validação pelo contrato formal
  const validation = validatePerformanceContextDTO(ctx);
  assert.strictEqual(validation.isValid, true, `Contexto mínimo deve ser válido: ${validation.errors.join(', ')}`);
});

// =========================================================================
// 3. TESTE DE NÃO-DUPLICAÇÃO MATEMÁTICA (MOTOR CANÔNICO)
// =========================================================================
test('PERF-CTX 3.1: Valores de energia e antropometria são estritamente gerados por domain/math/nutritionMath.js', () => {
  const patient = {
    id: 'pt-math-test',
    gender: 'Masculino',
    age: 35,
    height: 1.80,
    currentWeight: 80.0,
    activityFactor: 1.42
  };

  const assessment = {
    id: 'eval-m1',
    patientId: 'pt-math-test',
    date: '2026-09-01',
    weightKg: 80.0,
    heightCm: 180.0,
    fatPercent: 15.0,
    leanMass: 68.0,
    targetBF: 12.0,
    waist: 82.0,
    hip: 98.0
  };

  const prescription = {
    calories: 2200
  };

  const ctx = buildCanonicalPerformanceContext({
    rawPatient: patient,
    rawAssessment: assessment,
    rawPrescription: prescription
  });

  // 1. IMC
  const expectedIMC = nutritionMath.calculateIMC(80.0, 1.80).imc;
  assert.strictEqual(ctx.patient.bmi, expectedIMC);
  assert.strictEqual(ctx.anthropometry.bmi, expectedIMC);

  // 2. TMB (Katch-McArdle pois há massa magra 68kg)
  const expectedTMB = Math.round(nutritionMath.calculateTMB('Masculino', 35, 80.0, 1.80, 68.0).tmb);
  assert.strictEqual(ctx.energy.tmbKcal, expectedTMB);

  // 3. GET
  const expectedGET = Math.round(nutritionMath.calculateGET(expectedTMB, 1.42));
  assert.strictEqual(ctx.energy.getKcal, expectedGET);

  // 4. Caloric Target e Balanço Energético
  const expectedTarget = nutritionMath.calculateCaloricTarget(2200, expectedGET).caloricTargetKcal;
  assert.strictEqual(ctx.energy.caloricTargetKcal, expectedTarget);
  assert.strictEqual(ctx.nutrition.current.caloricTargetKcal, expectedTarget);

  const expectedBalance = nutritionMath.calculateEnergyBalance(expectedTarget, expectedGET).energyBalanceKcal;
  assert.strictEqual(ctx.energy.energyBalanceKcal, expectedBalance);
  assert.strictEqual(ctx.nutrition.current.energyBalanceKcal, expectedBalance);

  // 5. RCEst
  const expectedRCEst = Number((82.0 / 180.0).toFixed(2));
  const expectedRCEstClass = nutritionMath.classifyRCEst(expectedRCEst);
  assert.strictEqual(ctx.anthropometry.indices.rcEst, expectedRCEst);
  assert.strictEqual(ctx.anthropometry.indices.rcEstClassification, expectedRCEstClass);
});

// =========================================================================
// 4. TESTE DE IMUTABILIDADE ABSOLUTA E CÓPIA DEFENSIVA (AJUSTE 8)
// =========================================================================
test('PERF-CTX 4.1: Objeto é profundamente congelado e mutação da fonte original após geração NÃO afeta o contexto', () => {
  const sourceInjuries = ['Dor lombar'];
  const sourceProhibited = ['Stiff'];
  const sourceSessions = [{ cardioId: 'cardio_01', durationMinutes: 45 }];

  const rawPatient = {
    id: 'pt-immutable-test',
    name: 'Carlos Imutável',
    age: 30,
    gender: 'Masculino',
    injuries: sourceInjuries,
    prohibitedExercises: sourceProhibited
  };

  const rawCardio = {
    sessions: sourceSessions
  };

  const ctx = buildCanonicalPerformanceContext({
    rawPatient,
    rawCardio
  });

  // 1. Verificação formal de congelamento profundo (Object.isFrozen)
  assert.strictEqual(Object.isFrozen(ctx), true, 'Contexto raiz deve estar congelado');
  assert.strictEqual(Object.isFrozen(ctx.patient), true, 'ctx.patient deve estar congelado');
  assert.strictEqual(Object.isFrozen(ctx.constraints), true, 'ctx.constraints deve estar congelado');
  assert.strictEqual(Object.isFrozen(ctx.constraints.injuries), true, 'ctx.constraints.injuries deve estar congelado');
  assert.strictEqual(Object.isFrozen(ctx.training.current), true, 'ctx.training.current deve estar congelado');
  assert.strictEqual(Object.isFrozen(ctx.cardio.current.sessions), true, 'ctx.cardio.current.sessions deve estar congelado');

  // Tentativa de mutação direta em modo estrito
  assert.throws(() => {
    'use strict';
    ctx.patient.name = 'Tentativa de Hack';
  }, /Cannot assign to read only property|read only/i);

  assert.throws(() => {
    'use strict';
    ctx.constraints.injuries.push('Nova Lesão Injetada');
  }, /Cannot add property|is not extensible/i);

  assert.throws(() => {
    'use strict';
    ctx.cardio.current.sessions[0].durationMinutes = 999;
  }, /Cannot assign to read only property|read only/i);

  // 2. CÓPIA DEFENSIVA: Mutar arrays/objetos originais NÃO reflete no contexto
  sourceInjuries.push('Entorse de tornozelo posterior');
  sourceProhibited.push('Supino Injetado Posterior');
  sourceSessions.push({ cardioId: 'injected_session' });
  rawPatient.name = 'Nome Alterado Posterior';

  assert.strictEqual(ctx.patient.name, 'Carlos Imutável', 'Nome original congelado deve persistir');
  assert.strictEqual(ctx.constraints.injuries.includes('Entorse de tornozelo posterior'), false, 'Array congelado não pode ser afetado por push no original');
  assert.strictEqual(ctx.constraints.prohibitedExercises.includes('Supino Injetado Posterior'), false);
  assert.strictEqual(ctx.cardio.current.sessions.length, 1, 'Número de sessões não pode mudar após push no original');
});

// =========================================================================
// 5. TESTE DE RASTREABILIDADE DA IDADE E PROVENIÊNCIA GRANULAR (AJUSTES 1 E 9)
// =========================================================================
test('PERF-CTX 5.1: Rastreabilidade real da idade (birthDate vs age direto) e proveniência granular auditável', () => {
  // Caso 1: Idade calculada a partir de birthDate
  const patientWithBirth = {
    id: 'pt-birth',
    birthDate: '2000-01-01',
    gender: 'Masculino'
  };
  const ctxBirth = buildCanonicalPerformanceContext({ rawPatient: patientWithBirth });
  assert.strictEqual(typeof ctxBirth.patient.age, 'number');
  assert.ok(ctxBirth.patient.age >= 26);
  assert.strictEqual(ctxBirth.provenance.patient.fields.age.transform, 'chronological_years_from_birthDate');

  // Caso 2: Idade lida diretamente de p.age
  const patientDirectAge = {
    id: 'pt-direct',
    age: 42,
    gender: 'Feminino'
  };
  const ctxDirect = buildCanonicalPerformanceContext({ rawPatient: patientDirectAge });
  assert.strictEqual(ctxDirect.patient.age, 42);
  assert.strictEqual(ctxDirect.provenance.patient.fields.age.transform, 'direct_integer_cast');

  // Caso 3: Proveniência granular de todos os blocos principais
  assert.strictEqual(ctxDirect.provenance.schema, 'PerformanceContextDTO@1.0.0');
  assert.strictEqual(ctxDirect.provenance.energy.source, 'domain/math/nutritionMath.js');
  assert.strictEqual(ctxDirect.provenance.constraints.source, 'db.patients');
  assert.strictEqual(ctxDirect.provenance.clinicalFlags.source, 'domain/rules');
});

// =========================================================================
// 6. TESTE DE PERDA DE INFORMAÇÃO DA ANAMNESE (AJUSTE 6)
// =========================================================================
test('PERF-CTX 6.1: Anamnese completa é preservada integralmente e NÃO reduzida apenas a objective', () => {
  const fullAnamnesisPatient = {
    id: 'pt-full-anamnese',
    objective: 'Recomposição Corporal',
    usualWeight: 84.5,
    targetWeight: 79.0,
    routineNotes: 'Trabalho de escritório sentado 8h/dia + caminhadas noturnas',
    clinicalNotes: 'Histórico de gastrite leve. Sem medicação contínua.',
    dietaryRestrictions: 'Sem lactose estrita',
    foodAversions: 'Fígado, coentro',
    preferredFoods: 'Frango, ovos, aveia, banana, pasta de amendoim',
    cookingAvailability: 'Alta nos finais de semana, moderada durante a semana',
    mealPreparer: 'O próprio paciente',
    mealFrequency: '4 refeições/dia',
    hydrationLiters: 3.2,
    bowelHabit: 'Regular (1x/dia)',
    neatRoutine: 'Moderado',
    workoutType: 'Musculação + Corrida Híbrida',
    workoutFrequency: '5x/semana',
    workoutDuration: '60 min',
    workoutIntensity: 'Alta',
    workoutTime: 'Manhã (06:30)',
    sleepHours: 7.5,
    sleepQuality: 'Boa',
    stressLevel: 'Moderado',
    activityFactor: 1.55,
    restingHeartRate: 58,
    prohibitedExercises: ['Tríceps testa na barra reta'],
    injuries: ['Tendinite patelar antiga resolvida'],
    clinicalConstraints: ['Proibido hiperextensão lombar com carga'],
    availableEquipment: 'Full Gym'
  };

  const ctx = buildCanonicalPerformanceContext({ rawPatient: fullAnamnesisPatient });

  // Verificações campo a campo comprovando ZERO perda de informação
  assert.strictEqual(ctx.anamnesis.objective, 'Recomposição Corporal');
  assert.strictEqual(ctx.anamnesis.usualWeightKg, 84.5);
  assert.strictEqual(ctx.anamnesis.targetWeightKg, 79.0);
  assert.strictEqual(ctx.anamnesis.routineNotes, fullAnamnesisPatient.routineNotes);
  assert.strictEqual(ctx.anamnesis.clinicalNotes, fullAnamnesisPatient.clinicalNotes);
  assert.strictEqual(ctx.anamnesis.dietaryRestrictions, 'Sem lactose estrita');
  assert.strictEqual(ctx.anamnesis.foodAversions, 'Fígado, coentro');
  assert.strictEqual(ctx.anamnesis.preferredFoods, fullAnamnesisPatient.preferredFoods);
  assert.strictEqual(ctx.anamnesis.cookingAvailability, 'Alta nos finais de semana, moderada durante a semana');
  assert.strictEqual(ctx.anamnesis.mealPreparer, 'O próprio paciente');
  assert.strictEqual(ctx.anamnesis.mealFrequency, '4 refeições/dia');
  assert.strictEqual(ctx.anamnesis.hydrationLiters, 3.2);
  assert.strictEqual(ctx.anamnesis.bowelHabit, 'Regular (1x/dia)');
  assert.strictEqual(ctx.anamnesis.neatRoutine, 'Moderado');
  assert.strictEqual(ctx.anamnesis.workoutType, 'Musculação + Corrida Híbrida');
  assert.strictEqual(ctx.anamnesis.workoutFrequency, '5x/semana');
  assert.strictEqual(ctx.anamnesis.workoutDuration, '60 min');
  assert.strictEqual(ctx.anamnesis.workoutIntensity, 'Alta');
  assert.strictEqual(ctx.anamnesis.workoutTime, 'Manhã (06:30)');
  assert.strictEqual(ctx.anamnesis.sleepHours, 7.5);
  assert.strictEqual(ctx.anamnesis.sleepQuality, 'Boa');
  assert.strictEqual(ctx.anamnesis.stressLevel, 'Moderado');
  assert.strictEqual(ctx.anamnesis.activityFactor, 1.55);
  assert.strictEqual(ctx.anamnesis.restingHeartRate, 58);

  // Restrições estruturadas
  assert.deepStrictEqual(ctx.constraints.prohibitedExercises, ['Tríceps testa na barra reta']);
  assert.deepStrictEqual(ctx.constraints.injuries, ['Tendinite patelar antiga resolvida']);
  assert.deepStrictEqual(ctx.constraints.medicalRestrictions, ['Proibido hiperextensão lombar com carga']);
  assert.strictEqual(ctx.constraints.availableEquipment, 'Full Gym');
});

// =========================================================================
// 7. TESTE DE RELEVÂNCIA PARA PRESCRIÇÃO (SINAIS ESSENCIAIS - AJUSTE 5)
// =========================================================================
test('PERF-CTX 7.1: Todos os sinais essenciais para prescrição de IA estão acessíveis no DTO', () => {
  const patient = {
    id: 'pt-signals-test',
    gender: 'Masculino',
    age: 29,
    patientType: 'Atleta amador',
    objective: 'Hipertrofia',
    trainingLevel: 'Avançado',
    workoutFrequency: '6x/semana',
    workoutDuration: '75 min',
    sleepHours: 8.0,
    stressLevel: 'Baixo',
    neatRoutine: 'Intenso',
    height: 1.82,
    currentWeight: 85.0,
    availableEquipment: 'Full Gym',
    injuries: ['Leve desconforto manguito rotador esquerdo'],
    prohibitedExercises: ['Desenvolvimento militar por trás da nuca'],
    clinicalConstraints: ['Manter escápulas aduzidas em presses'],
    activityFactor: 1.6
  };

  const assessment = {
    id: 'eval-signals-01',
    fatPercent: 12.0,
    targetBF: 10.0,
    leanMass: 74.8,
    fatMass: 10.2
  };

  const fastingProto = {
    enabled: true,
    type: 'TRE',
    subtype: '16:8',
    currentState: 'FASTING',
    feedingWindows: [{ start: '12:00', end: '20:00' }],
    objectives: ['Autofagia', 'Sensibilidade insulínica']
  };

  const cardioData = {
    prescribedCardioId: 'cardio_01',
    sessions: [{ cardioId: 'cardio_01', durationMinutes: 45, type: 'Zona 2' }]
  };

  const ctx = buildCanonicalPerformanceContext({
    rawPatient: patient,
    rawAssessment: assessment,
    rawFasting: fastingProto,
    rawCardio: cardioData
  });

  // Lista de verificação do Ajuste 5:
  assert.ok(ctx.patient.age === 29, 'idade presente');
  assert.ok(ctx.patient.patientType === 'Atleta amador', 'tipo de paciente presente');
  assert.ok(ctx.patient.objective === 'Hipertrofia', 'objetivo presente');
  assert.ok(ctx.patient.trainingLevel === 'Avançado', 'nível de treino presente');
  assert.ok(ctx.training.current.weeklyFrequency === 6, 'frequência semanal numérica presente');
  assert.ok(ctx.training.current.sessionDurationMinutes === 75, 'duração presente');
  assert.ok(ctx.anamnesis.sleepHours === 8.0, 'sono presente');
  assert.ok(ctx.anamnesis.stressLevel === 'Baixo', 'estresse presente');
  assert.ok(ctx.anamnesis.neatRoutine === 'Intenso', 'NEAT presente');
  assert.ok(ctx.patient.weightKg === 85.0, 'peso presente');
  assert.ok(ctx.patient.heightCm === 182.0, 'altura presente');
  assert.ok(ctx.bodyComposition.bodyFatPercent === 12.0, '% gordura presente');
  assert.ok(ctx.bodyComposition.leanMassKg === 74.8, 'massa magra presente');
  assert.ok(ctx.energy.getKcal > 0, 'GET calculado');
  assert.ok(ctx.constraints.injuries.includes('Leve desconforto manguito rotador esquerdo'), 'lesão preservada');
  assert.ok(ctx.constraints.prohibitedExercises.includes('Desenvolvimento militar por trás da nuca'), 'proibição preservada');
  assert.ok(ctx.constraints.availableEquipment === 'Full Gym', 'equipamento presente');
  assert.ok(ctx.cardio.current.sessions.length === 1, 'cardio presente');
  assert.ok(ctx.nutrition.current.fasting !== null && ctx.nutrition.current.fasting.active === true, 'jejum ativo presente');
});

// =========================================================================
// 8. TESTE DE INTEGRAÇÃO REAL: DEXIE MOCK -> ADAPTER -> PerformanceContextDTO
// =========================================================================
test('PERF-CTX 8.1: fetchAndBuildCanonicalPerformanceContext lê dados assíncronos do banco e produz DTO sem tocar no DOM', async () => {
  // Mock puro do Dexie
  const mockDb = {
    patients: {
      get: async (id) => ({
        id,
        name: 'Ana Carolina Mendes',
        gender: 'Feminino',
        age: 27,
        height: 1.65,
        currentWeight: 58.0,
        objective: 'Definição & Ganho de Massa',
        patientType: 'Praticante recreativo',
        workoutFrequency: '4x/semana',
        workoutDuration: '50 min',
        activityFactor: 1.45,
        injuries: [],
        prohibitedExercises: []
      })
    },
    assessments: {
      where: (field) => ({
        equals: (val) => ({
          toArray: async () => ([
            {
              id: 'eval-ana-01',
              patientId: val,
              date: '2026-08-20',
              weightKg: 58.0,
              heightCm: 165.0,
              fatPercent: 19.5,
              leanMass: 46.69,
              fatMass: 11.31,
              waist: 68.0,
              hip: 96.0
            }
          ])
        })
      })
    },
    prescriptions: {
      get: async (id) => ({
        id,
        patientId: id,
        calories: 1900,
        protGKg: 2.0,
        items: [{ name: 'Refeição padrão', calories: 1900, protein: 116 }]
      })
    },
    performanceMetabolica: {
      get: async (id) => ({
        id,
        patientId: id,
        activeSplit: 'UpperLower',
        splitSource: 'HUMAN',
        prescribedCardioId: 'cardio_01',
        cardioPrescription: {
          sessions: [{ cardioId: 'c1', durationMinutes: 40, type: 'Moderado' }]
        }
      })
    },
    fastingProtocols: {
      where: () => ({
        equals: () => ({
          first: async () => null
        })
      })
    }
  };

  const context = await fetchAndBuildCanonicalPerformanceContext('ana-mendes', mockDb);

  assert.notStrictEqual(context, null);
  assert.strictEqual(context.patient.patientId, 'ana-mendes');
  assert.strictEqual(context.patient.name, 'Ana Carolina Mendes');
  assert.strictEqual(context.patient.age, 27);
  assert.strictEqual(context.patient.sex, 'Feminino');
  assert.strictEqual(context.bodyComposition.bodyFatPercent, 19.5);
  assert.strictEqual(context.energy.caloricTargetKcal, 1900);
  assert.strictEqual(context.training.current.activeSplit, 'UpperLower');
  assert.strictEqual(context.training.current.splitSource, 'HUMAN');
  assert.strictEqual(context.cardio.current.sessions.length, 1);
  assert.strictEqual(context.clinicalFlags.isMinor, false);

  // Validação estrita de contrato
  const val = validatePerformanceContextDTO(context);
  assert.strictEqual(val.isValid, true, `Contexto carregado do banco deve ser válido: ${val.errors.join(', ')}`);
});
