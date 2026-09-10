/**
 * =========================================================================
 * NutriAx Pro — Suíte de Testes dos Contratos Canônicos de Domínio
 * Arquivo: tests/domain-contracts.test.js
 * Fase 2: DTOs Puros, Validação Determinística e Adaptadores do Legado
 * =========================================================================
 */

const assert = require('assert');
const {
  validatePatientDTO,
  createPatientDTO,
  validateAssessmentDTO,
  createAssessmentDTO,
  validateNutritionDTO,
  createNutritionDTO,
  SPLIT_SOURCES,
  validateTrainingPrescriptionDTO,
  createTrainingPrescriptionDTO,
  validateCardioPrescriptionDTO,
  createCardioPrescriptionDTO
} = require('../domain/contracts');

const {
  legacyPatientToPatientDTO,
  legacyAssessmentToAssessmentDTO,
  legacyNutritionToNutritionDTO,
  legacyTrainingToTrainingPrescriptionDTO,
  legacyCardioToCardioPrescriptionDTO
} = require('../domain/adapters');

console.log('======================================================');
console.log('Fase 2: Testes de Contratos Canônicos de Domínio & DTOs');
console.log('======================================================');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Detalhe: ${err.message}`);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TESTES: PatientDTO
// ─────────────────────────────────────────────────────────────────────────────

test('PATIENT 1.1: Validação de PatientDTO válido completo', () => {
  const patient = createPatientDTO({
    patientId: 'pat_pv_001',
    name: 'Paulo Vitor',
    age: 30,
    sex: 'Masculino',
    patientType: 'Praticante recreativo',
    objective: 'Hipertrofia',
    trainingLevel: 'Avançado',
    weightKg: 82.5,
    heightCm: 180
  });

  const res = validatePatientDTO(patient);
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.errors.length, 0);
  assert.strictEqual(patient.patientId, 'pat_pv_001');
  assert.strictEqual(patient.weightKg, 82.5);
  assert.strictEqual(patient.heightCm, 180);
});

test('PATIENT 1.2: Rejeição de patientId ausente ou vazio', () => {
  const patientNoId = createPatientDTO({ name: 'Sem ID' });
  const res = validatePatientDTO(patientNoId);
  assert.strictEqual(res.isValid, false);
  assert.ok(res.errors.some(e => e.includes('patientId')));

  const resNull = validatePatientDTO({ patientId: '' });
  assert.strictEqual(resNull.isValid, false);
});

test('PATIENT 1.3: Rejeição de patientId gerado por IA', () => {
  const patientWithAiId = createPatientDTO({
    patientId: 'ai_generated_123',
    name: 'Paciente Sintético'
  });
  const res = validatePatientDTO(patientWithAiId);
  assert.strictEqual(res.isValid, false);
  assert.ok(res.errors.some(e => e.includes('Inteligência Artificial')));
});

test('PATIENT 1.4: Rejeição de tipos e valores inválidos (idade e peso fora de limites)', () => {
  const patientInvalidAge = createPatientDTO({
    patientId: 'pat_002',
    age: 250 // Implausível
  });
  const resAge = validatePatientDTO(patientInvalidAge);
  assert.strictEqual(resAge.isValid, false);
  assert.ok(resAge.errors.some(e => e.includes('age')));

  const patientInvalidWeight = {
    patientId: 'pat_003',
    weightKg: -10
  };
  const resWeight = validatePatientDTO(patientInvalidWeight);
  assert.strictEqual(resWeight.isValid, false);
  assert.ok(resWeight.errors.some(e => e.includes('weightKg')));

  const patientInvalidSex = {
    patientId: 'pat_004',
    sex: 'Alien'
  };
  const resSex = validatePatientDTO(patientInvalidSex);
  assert.strictEqual(resSex.isValid, false);
  assert.ok(resSex.errors.some(e => e.includes('sex')));
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. TESTES: AssessmentDTO
// ─────────────────────────────────────────────────────────────────────────────

test('ASSESSMENT 2.1: Validação de AssessmentDTO válido com dobras cutâneas', () => {
  const assessment = createAssessmentDTO({
    assessmentId: 'eval_001',
    patientId: 'pat_pv_001',
    date: '2026-03-01',
    weightKg: 82.5,
    heightCm: 180,
    bmi: 25.46,
    bodyFatPercent: 14.2,
    leanMassKg: 70.78,
    fatMassKg: 11.72,
    waistCm: 82.0,
    hipCm: 98.0,
    neckCm: 39.0,
    rcq: 0.84,
    rcest: 0.46,
    skinfolds: {
      triceps: 10.5,
      subscapular: 12.0,
      biceps: 5.0,
      chest: 8.0,
      axillary: 9.0,
      suprailiac: 11.0,
      abdominal: 16.0,
      thigh: 14.0,
      calf: 7.0
    }
  });

  const res = validateAssessmentDTO(assessment);
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.errors.length, 0);
  assert.strictEqual(assessment.bodyFatPercent, 14.2);
  assert.strictEqual(assessment.skinfolds.triceps, 10.5);
});

test('ASSESSMENT 2.2: Rejeição de AssessmentDTO com patientId ausente', () => {
  const res = validateAssessmentDTO({ weightKg: 80 });
  assert.strictEqual(res.isValid, false);
  assert.ok(res.errors.some(e => e.includes('patientId')));
});

test('ASSESSMENT 2.3: Rejeição de campos biométricos com valores fora de limites', () => {
  const invalidAssessment = {
    patientId: 'pat_001',
    bodyFatPercent: 95.0, // Impossível
    waistCm: -5,
    weightKg: 0
  };

  const res = validateAssessmentDTO(invalidAssessment);
  assert.strictEqual(res.isValid, false);
  assert.ok(res.errors.some(e => e.includes('bodyFatPercent')));
  assert.ok(res.errors.some(e => e.includes('waistCm')));
  assert.ok(res.errors.some(e => e.includes('weightKg')));
});

test('ASSESSMENT 2.4: Validação de dobras cutâneas válidas e inválidas', () => {
  const invalidFolds = {
    patientId: 'pat_001',
    skinfolds: {
      triceps: -2,
      subscapular: 200 // Acima de 150mm
    }
  };

  const res = validateAssessmentDTO(invalidFolds);
  assert.strictEqual(res.isValid, false);
  assert.ok(res.errors.some(e => e.includes('triceps')));
  assert.ok(res.errors.some(e => e.includes('subscapular')));
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. TESTES: NutritionDTO
// ─────────────────────────────────────────────────────────────────────────────

test('NUTRITION 3.1: Validação de NutritionDTO válido completo', () => {
  const nutrition = createNutritionDTO({
    patientId: 'pat_pv_001',
    tmbKcal: 1850,
    getKcal: 2627,
    activityFactor: 1.42,
    caloricTargetKcal: 2300,
    energyBalanceKcal: -327, // Déficit controlado
    proteinGPerKg: 2.2,
    prescribedKcal: 2300,
    nutritionObjective: 'Déficit Metabólico'
  });

  const res = validateNutritionDTO(nutrition);
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.errors.length, 0);
  assert.strictEqual(nutrition.energyBalanceKcal, -327);
  assert.strictEqual(nutrition.proteinGPerKg, 2.2);
});

test('NUTRITION 3.2: NutritionDTO aceita campos opcionais ausentes sem erro', () => {
  const minimalNutrition = createNutritionDTO({
    patientId: 'pat_pv_001',
    getKcal: 2500
  });

  const res = validateNutritionDTO(minimalNutrition);
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.errors.length, 0);
  assert.strictEqual(minimalNutrition.prescribedKcal, null);
});

test('NUTRITION 3.3: Rejeição de valores calóricos negativos ou incoerentes', () => {
  const invalidNutrition = {
    tmbKcal: -500,
    activityFactor: 0.2, // Abaixo de 0.8
    proteinGPerKg: 25.0 // Implausível
  };

  const res = validateNutritionDTO(invalidNutrition);
  assert.strictEqual(res.isValid, false);
  assert.ok(res.errors.some(e => e.includes('tmbKcal')));
  assert.ok(res.errors.some(e => e.includes('activityFactor')));
  assert.ok(res.errors.some(e => e.includes('proteinGPerKg')));
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. TESTES: TrainingPrescriptionDTO & Contrato de Split
// ─────────────────────────────────────────────────────────────────────────────

test('TRAINING 4.1: Validação de TrainingPrescriptionDTO com split e splitSource válidos', () => {
  const presc = createTrainingPrescriptionDTO({
    patientId: 'pat_pv_001',
    split: 'BroSplit',
    splitSource: 'HUMAN',
    frequency: 5,
    routines: [
      {
        routineId: 'A',
        routineName: 'Peitoral & Tríceps',
        day: 'Segunda-feira',
        exercises: [
          { exerciseName: 'Supino Reto com Barra', sets: 4, reps: '8-10', rpe: 8.5, restSeconds: 120 },
          { exerciseName: 'Crucifixo Inclinado com Halteres', sets: 3, reps: '10-12', rpe: 8, restSeconds: 90 }
        ]
      },
      {
        routineId: 'B',
        routineName: 'Dorsais & Bíceps',
        day: 'Terça-feira',
        exercises: [
          { exerciseName: 'Puxada Frontal Pegada Aberta', sets: 4, reps: '8-10', rpe: 8.5, restSeconds: 120 }
        ]
      }
    ]
  });

  const res = validateTrainingPrescriptionDTO(presc);
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.errors.length, 0);
  assert.strictEqual(presc.split, 'BroSplit');
  assert.strictEqual(presc.splitSource, 'HUMAN');
  assert.strictEqual(presc.routines.length, 2);
});

test('TRAINING 4.2: Formalização de splitSource e rejeição de fonte inválida', () => {
  assert.deepStrictEqual(SPLIT_SOURCES, ['AI', 'HUMAN', 'CONFIG', 'DETERMINISTIC']);

  const presc = {
    patientId: 'pat_001',
    split: 'PPL',
    splitSource: 'MAGIC_AI_GUESS', // Inválido
    frequency: 3,
    routines: [
      {
        routineName: 'Push',
        exercises: [{ exerciseName: 'Supino', sets: 3, reps: '10' }]
      }
    ]
  };

  const res = validateTrainingPrescriptionDTO(presc);
  assert.strictEqual(res.isValid, false);
  assert.ok(res.errors.some(e => e.includes('splitSource')));
});

test('TRAINING 4.3: Rejeição de rotina vazia ou sem nome', () => {
  const prescNoRoutines = {
    patientId: 'pat_001',
    split: 'FullBody',
    splitSource: 'DETERMINISTIC',
    frequency: 3,
    routines: []
  };

  const res = validateTrainingPrescriptionDTO(prescNoRoutines);
  assert.strictEqual(res.isValid, false);
  assert.ok(res.errors.some(e => e.includes('routines')));

  const prescUnnamedRoutine = {
    patientId: 'pat_001',
    split: 'FullBody',
    splitSource: 'DETERMINISTIC',
    frequency: 1,
    routines: [
      {
        routineName: '',
        exercises: [{ exerciseName: 'Agachamento', sets: 4, reps: '8' }]
      }
    ]
  };

  const resUnnamed = validateTrainingPrescriptionDTO(prescUnnamedRoutine);
  assert.strictEqual(resUnnamed.isValid, false);
  assert.ok(resUnnamed.errors.some(e => e.includes('routineName')));
});

test('TRAINING 4.4: Rejeição de exercício inválido (sets < 1, reps vazio, rpe fora de 1..10)', () => {
  const prescInvalidEx = {
    patientId: 'pat_001',
    split: 'PPL',
    splitSource: 'CONFIG',
    frequency: 1,
    routines: [
      {
        routineName: 'Push A',
        exercises: [
          { exerciseName: 'Desenvolvimento', sets: 0, reps: '', rpe: 12, restSeconds: -30 }
        ]
      }
    ]
  };

  const res = validateTrainingPrescriptionDTO(prescInvalidEx);
  assert.strictEqual(res.isValid, false);
  assert.ok(res.errors.some(e => e.includes('sets')));
  assert.ok(res.errors.some(e => e.includes('reps')));
  assert.ok(res.errors.some(e => e.includes('rpe')));
  assert.ok(res.errors.some(e => e.includes('restSeconds')));
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. TESTES: CardioPrescriptionDTO (Multi-Sessão)
// ─────────────────────────────────────────────────────────────────────────────

test('CARDIO 5.1: Validação de CardioPrescriptionDTO com múltiplas sessões semanais', () => {
  const presc = createCardioPrescriptionDTO({
    patientId: 'pat_pv_001',
    sessions: [
      {
        cardioId: 'cardio_01',
        day: 'Dia 2',
        type: 'Contínuo · LISS',
        durationMinutes: 45,
        intensity: 'Moderada · Contínua (Respiração Nasal)',
        modality: 'Esteira Inclinada',
        heartRateZone: 'Z2',
        targetBpm: '125-138 bpm'
      },
      {
        cardioId: 'cardio_03',
        day: 'Dia 5',
        type: 'HIIT',
        durationMinutes: 20,
        intensity: 'Alta Intensidade Intervalada',
        modality: 'AirBike',
        heartRateZone: 'Z4/Z5',
        targetBpm: '160-175 bpm'
      }
    ]
  });

  const res = validateCardioPrescriptionDTO(presc);
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.errors.length, 0);
  assert.strictEqual(presc.weeklyFrequency, 2);
  assert.strictEqual(presc.totalWeeklyMinutes, 65);
  assert.strictEqual(presc.sessions.length, 2);
});

test('CARDIO 5.2: Rejeição de cardioId ausente e duração inválida', () => {
  const invalidCardio = {
    patientId: 'pat_001',
    sessions: [
      {
        cardioId: '', // Vazio
        durationMinutes: 5 // Abaixo do mínimo de 10 min
      }
    ]
  };

  const res = validateCardioPrescriptionDTO(invalidCardio);
  assert.strictEqual(res.isValid, false);
  assert.ok(res.errors.some(e => e.includes('cardioId')));
  assert.ok(res.errors.some(e => e.includes('durationMinutes')));
});

test('CARDIO 5.3: Rejeição de sessões vazias ou formato não-objeto', () => {
  const resEmpty = validateCardioPrescriptionDTO({ patientId: 'p1', sessions: [] });
  assert.strictEqual(resEmpty.isValid, false);
  assert.ok(resEmpty.errors.some(e => e.includes('sessions')));

  const resNonObj = validateCardioPrescriptionDTO({ patientId: 'p1', sessions: ['sessao_string'] });
  assert.strictEqual(resNonObj.isValid, false);
  assert.ok(resNonObj.errors.some(e => e.includes('deve ser um objeto')));
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. TESTES: Adaptadores do Legado e Garantia de Imutabilidade
// ─────────────────────────────────────────────────────────────────────────────

test('ADAPTER 6.1: legacyPatientToPatientDTO converte sem perdas e NÃO muta o objeto original', () => {
  const legacyPatient = {
    id: 'paulo-vitor',
    name: 'Paulo Vitor',
    age: '30',
    gender: 'Masculino',
    height: '1.80', // Legado armazena em metros como string
    currentWeight: '82.5',
    usualWeight: '80.0',
    objective: 'Hipertrofia',
    trainingLevel: 'Avançado',
    patientType: 'Praticante recreativo'
  };

  const snapshotBefore = JSON.stringify(legacyPatient);
  const dto = legacyPatientToPatientDTO(legacyPatient);
  const snapshotAfter = JSON.stringify(legacyPatient);

  // Prova de imutabilidade
  assert.strictEqual(snapshotBefore, snapshotAfter, 'O objeto legado de entrada NUNCA pode ser mutado');

  // Prova de conformidade do DTO
  assert.strictEqual(dto.patientId, 'paulo-vitor');
  assert.strictEqual(dto.age, 30);
  assert.strictEqual(dto.sex, 'Masculino');
  assert.strictEqual(dto.heightCm, 180.0);
  assert.strictEqual(dto.weightKg, 82.5);

  const val = validatePatientDTO(dto);
  assert.strictEqual(val.isValid, true);
});

test('ADAPTER 6.2: legacyAssessmentToAssessmentDTO mapeia dobras e medidas sem mutar o original', () => {
  const legacyAssessment = {
    id: 'eval_2026_01',
    patientId: 'paulo-vitor',
    date: '2026-02-15',
    weight: 82.5,
    height: 180,
    fatPercent: 14.5,
    leanMass: 70.5,
    fatMass: 12.0,
    waist: 82,
    hip: 98,
    circNeck: 39,
    rcEst: 0.455,
    skTriceps: 10,
    skSubscapular: 12,
    skChest: 8,
    skAbdominal: 15
  };

  const snapshotBefore = JSON.stringify(legacyAssessment);
  const dto = legacyAssessmentToAssessmentDTO(legacyAssessment);
  const snapshotAfter = JSON.stringify(legacyAssessment);

  assert.strictEqual(snapshotBefore, snapshotAfter);
  assert.strictEqual(dto.bodyFatPercent, 14.5);
  assert.strictEqual(dto.leanMassKg, 70.5);
  assert.strictEqual(dto.waistCm, 82.0);
  assert.strictEqual(dto.neckCm, 39.0);
  assert.strictEqual(dto.rcest, 0.455);
  assert.strictEqual(dto.skinfolds.triceps, 10.0);
  assert.strictEqual(dto.skinfolds.abdominal, 15.0);

  const val = validateAssessmentDTO(dto);
  assert.strictEqual(val.isValid, true);
});

test('ADAPTER 6.3: legacyNutritionToNutritionDTO extrai dados de contexto sem mutação', () => {
  const legacyContext = {
    _meta: { patientId: 'paulo-vitor' },
    energy: {
      tmbKcal: 1850,
      getKcal: 2627,
      activityFactor: 1.42
    },
    nutrition: {
      caloricTargetKcal: 2300,
      energyBalanceKcal: -327,
      proteinGKg: 2.2,
      prescribedKcal: 2300
    },
    patient: {
      objective: 'Hipertrofia com Déficit Controlado'
    }
  };

  const snapshotBefore = JSON.stringify(legacyContext);
  const dto = legacyNutritionToNutritionDTO(legacyContext);
  const snapshotAfter = JSON.stringify(legacyContext);

  assert.strictEqual(snapshotBefore, snapshotAfter);
  assert.strictEqual(dto.patientId, 'paulo-vitor');
  assert.strictEqual(dto.tmbKcal, 1850);
  assert.strictEqual(dto.getKcal, 2627);
  assert.strictEqual(dto.caloricTargetKcal, 2300);
  assert.strictEqual(dto.energyBalanceKcal, -327);
  assert.strictEqual(dto.proteinGPerKg, 2.2);

  const val = validateNutritionDTO(dto);
  assert.strictEqual(val.isValid, true);
});

test('ADAPTER 6.4: legacyTrainingToTrainingPrescriptionDTO normaliza IA/legado com splitSource formal', () => {
  const legacyAiWorkout = {
    frequency: 4,
    routines: [
      {
        id: 'A',
        name: 'Upper 1',
        exercises: [
          { name: 'Supino Reto', sets: 4, reps: '6-8', rpe: 8, restSeconds: 120 },
          { name: 'Remada Curvada', sets: 4, reps: '6-8', rpe: 8, restSeconds: 120 }
        ]
      },
      {
        id: 'B',
        name: 'Lower 1',
        exercises: [
          { name: 'Agachamento Livre', sets: 4, reps: '6-8', rpe: 8.5, restSeconds: 180 }
        ]
      }
    ]
  };

  const snapshotBefore = JSON.stringify(legacyAiWorkout);
  const dto = legacyTrainingToTrainingPrescriptionDTO(legacyAiWorkout, {
    patientId: 'paulo-vitor',
    split: 'UpperLower',
    splitSource: 'AI'
  });
  const snapshotAfter = JSON.stringify(legacyAiWorkout);

  assert.strictEqual(snapshotBefore, snapshotAfter);
  assert.strictEqual(dto.patientId, 'paulo-vitor');
  assert.strictEqual(dto.split, 'UpperLower');
  assert.strictEqual(dto.splitSource, 'AI');
  assert.strictEqual(dto.routines.length, 2);
  assert.strictEqual(dto.routines[0].exercises[0].exerciseName, 'Supino Reto');

  const val = validateTrainingPrescriptionDTO(dto);
  assert.strictEqual(val.isValid, true);
});

test('ADAPTER 6.5: legacyCardioToCardioPrescriptionDTO converte prescrições multi-sessão do Cardio Engine', () => {
  const legacyCardio = {
    id: 'cardio_presc_12345',
    frequencyWeekly: 2,
    totalWeeklyMinutes: 65,
    sessions: [
      {
        sessionId: 'c_s1',
        protocolId: 'cardio_01',
        protocolTitle: 'Zona 2 Contínua',
        day: 'Dia 2',
        durationMinutes: 45,
        intensity: 'Moderada · Contínua (Respiração Nasal)',
        heartRateZone: 'Z2',
        targetBpm: '125 – 138 bpm'
      },
      {
        sessionId: 'c_s2',
        protocolId: 'cardio_03',
        protocolTitle: 'HIIT 15s/15s',
        day: 'Dia 5',
        durationMinutes: 20,
        intensity: 'Alta Intensidade Intervalada',
        heartRateZone: 'Z4/Z5',
        targetBpm: '160 – 175 bpm'
      }
    ]
  };

  const snapshotBefore = JSON.stringify(legacyCardio);
  const dto = legacyCardioToCardioPrescriptionDTO(legacyCardio, { patientId: 'paulo-vitor' });
  const snapshotAfter = JSON.stringify(legacyCardio);

  assert.strictEqual(snapshotBefore, snapshotAfter);
  assert.strictEqual(dto.patientId, 'paulo-vitor');
  assert.strictEqual(dto.sessions.length, 2);
  assert.strictEqual(dto.sessions[0].cardioId, 'c_s1');
  assert.strictEqual(dto.sessions[0].durationMinutes, 45);
  assert.strictEqual(dto.sessions[1].cardioId, 'c_s2');
  assert.strictEqual(dto.sessions[1].durationMinutes, 20);

  const val = validateCardioPrescriptionDTO(dto);
  assert.strictEqual(val.isValid, true);
});

console.log('======================================================');
console.log(`📊 Resultado Final dos Testes da Fase 2: ${passedTests}/${totalTests} passaram.`);
console.log('======================================================');
