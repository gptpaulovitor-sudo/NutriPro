/**
 * domain/adapters/legacyAdapters.js
 * 
 * Adaptadores do Legado para Contratos Canônicos de Domínio.
 * Padrão Strangler Fig — NutriAx Pro.
 * 
 * Regras Absolutas:
 * 1. Recebem dados existentes do legado.
 * 2. Normalizam nomenclatura para os contratos canônicos.
 * 3. Produzem DTOs válidos e imutáveis.
 * 4. NUNCA mutam os objetos de entrada.
 * 5. NUNCA gravam no banco de dados (Dexie/Firebase).
 * 6. NUNCA tocam no DOM ou na UI.
 */

const { createPatientDTO } = require('../contracts/PatientDTO');
const { createAssessmentDTO } = require('../contracts/AssessmentDTO');
const { createNutritionDTO } = require('../contracts/NutritionDTO');
const { createTrainingPrescriptionDTO } = require('../contracts/TrainingPrescriptionDTO');
const { createCardioPrescriptionDTO } = require('../contracts/CardioPrescriptionDTO');

/**
 * Converte registro legado de paciente (db.patients) para PatientDTO
 * @param {Object} legacyPatient - Registro de paciente do Dexie ou formulário
 * @returns {Readonly<Object>} PatientDTO
 */
function legacyPatientToPatientDTO(legacyPatient = {}) {
  if (!legacyPatient || typeof legacyPatient !== 'object') {
    return createPatientDTO({});
  }

  // Resolução de altura (no legado pode ser metros ex: 1.80 ou cm ex: 180)
  let heightCm = null;
  if (legacyPatient.heightCm != null && !isNaN(Number(legacyPatient.heightCm))) {
    heightCm = Number(legacyPatient.heightCm);
  } else if (legacyPatient.height != null && !isNaN(Number(legacyPatient.height))) {
    const rawH = Number(legacyPatient.height);
    heightCm = rawH < 3.0 ? rawH * 100 : rawH;
  }

  // Resolução de peso
  let weightKg = null;
  const rawWeight = legacyPatient.currentWeight ?? legacyPatient.weightKg ?? legacyPatient.usualWeight;
  if (rawWeight != null && !isNaN(Number(rawWeight))) {
    weightKg = Number(rawWeight);
  }

  // Resolução de idade
  let age = null;
  if (legacyPatient.age != null && !isNaN(parseInt(legacyPatient.age, 10))) {
    age = parseInt(legacyPatient.age, 10);
  }

  // Resolução de sexo
  let sex = null;
  const rawSex = legacyPatient.gender ?? legacyPatient.sex;
  if (rawSex != null) {
    const s = String(rawSex).trim().toLowerCase();
    if (s.startsWith('m')) sex = 'Masculino';
    else if (s.startsWith('f')) sex = 'Feminino';
    else sex = 'Outro';
  }

  return createPatientDTO({
    patientId: legacyPatient.id ?? legacyPatient.patientId ?? '',
    name: legacyPatient.name ?? null,
    age,
    sex,
    patientType: legacyPatient.patientType ?? null,
    objective: legacyPatient.objective ?? null,
    trainingLevel: legacyPatient.trainingLevel ?? null,
    weightKg,
    heightCm
  });
}

/**
 * Converte avaliação antropométrica legada (db.assessments) para AssessmentDTO
 * @param {Object} legacyAssessment - Registro de avaliação do Dexie
 * @returns {Readonly<Object>} AssessmentDTO
 */
function legacyAssessmentToAssessmentDTO(legacyAssessment = {}) {
  if (!legacyAssessment || typeof legacyAssessment !== 'object') {
    return createAssessmentDTO({});
  }

  // Resolução de altura
  let heightCm = null;
  if (legacyAssessment.heightCm != null && !isNaN(Number(legacyAssessment.heightCm))) {
    heightCm = Number(legacyAssessment.heightCm);
  } else if (legacyAssessment.height != null && !isNaN(Number(legacyAssessment.height))) {
    const rawH = Number(legacyAssessment.height);
    heightCm = rawH < 3.0 ? rawH * 100 : rawH;
  }

  // Resolução de peso
  let weightKg = null;
  const rawW = legacyAssessment.weightKg ?? legacyAssessment.weight;
  if (rawW != null && !isNaN(Number(rawW))) {
    weightKg = Number(rawW);
  }

  // Extração de dobras cutâneas legadas
  const skinfolds = {};
  const foldMappings = [
    ['triceps', legacyAssessment.skTriceps ?? legacyAssessment.triceps ?? legacyAssessment.skinfolds?.triceps],
    ['subscapular', legacyAssessment.skSubscapular ?? legacyAssessment.subscapular ?? legacyAssessment.skinfolds?.subscapular],
    ['biceps', legacyAssessment.skBiceps ?? legacyAssessment.biceps ?? legacyAssessment.skinfolds?.biceps],
    ['chest', legacyAssessment.skChest ?? legacyAssessment.chest ?? legacyAssessment.skinfolds?.chest],
    ['axillary', legacyAssessment.skAxillary ?? legacyAssessment.axillary ?? legacyAssessment.skinfolds?.axillary],
    ['suprailiac', legacyAssessment.skSuprailiac ?? legacyAssessment.suprailiac ?? legacyAssessment.skinfolds?.suprailiac],
    ['abdominal', legacyAssessment.skAbdominal ?? legacyAssessment.abdominal ?? legacyAssessment.skinfolds?.abdominal],
    ['thigh', legacyAssessment.skThigh ?? legacyAssessment.thigh ?? legacyAssessment.skinfolds?.thigh],
    ['calf', legacyAssessment.skCalfFold ?? legacyAssessment.skCalf ?? legacyAssessment.calf ?? legacyAssessment.skinfolds?.calf]
  ];

  let hasAnyFold = false;
  foldMappings.forEach(([key, val]) => {
    if (val != null && !isNaN(Number(val))) {
      skinfolds[key] = Number(Number(val).toFixed(1));
      hasAnyFold = true;
    }
  });

  return createAssessmentDTO({
    assessmentId: legacyAssessment.id ?? legacyAssessment.assessmentId ?? null,
    patientId: legacyAssessment.patientId ?? '',
    date: legacyAssessment.date ?? null,
    weightKg,
    heightCm,
    bmi: legacyAssessment.bmi ?? null,
    bodyFatPercent: legacyAssessment.fatPercent ?? legacyAssessment.bodyFatPercent ?? null,
    leanMassKg: legacyAssessment.leanMass ?? legacyAssessment.leanMassKg ?? null,
    fatMassKg: legacyAssessment.fatMass ?? legacyAssessment.fatMassKg ?? null,
    waistCm: legacyAssessment.waist ?? legacyAssessment.waistCm ?? null,
    hipCm: legacyAssessment.hip ?? legacyAssessment.hipCm ?? null,
    neckCm: legacyAssessment.circNeck ?? legacyAssessment.neck ?? legacyAssessment.neckCm ?? null,
    rcq: legacyAssessment.rcq ?? (legacyAssessment.indices?.rcq) ?? null,
    rcest: legacyAssessment.rcEst ?? legacyAssessment.rcest ?? (legacyAssessment.indices?.rcEst) ?? null,
    skinfolds: hasAnyFold ? skinfolds : null
  });
}

/**
 * Converte contexto energético/nutricional legado para NutritionDTO
 * @param {Object} legacyNutritionOrContext - Dados de energia/nutrição (ex: buildPerformanceContext)
 * @returns {Readonly<Object>} NutritionDTO
 */
function legacyNutritionToNutritionDTO(legacyNutritionOrContext = {}) {
  if (!legacyNutritionOrContext || typeof legacyNutritionOrContext !== 'object') {
    return createNutritionDTO({});
  }

  const pId = legacyNutritionOrContext.patientId ?? legacyNutritionOrContext._meta?.patientId ?? null;
  const energy = legacyNutritionOrContext.energy ?? {};
  const nutrition = legacyNutritionOrContext.nutrition ?? {};

  const tmbKcal = legacyNutritionOrContext.tmbKcal ?? energy.tmbKcal ?? null;
  const getKcal = legacyNutritionOrContext.getKcal ?? energy.getKcal ?? null;
  const activityFactor = legacyNutritionOrContext.activityFactor ?? energy.activityFactor ?? null;
  const caloricTargetKcal = legacyNutritionOrContext.caloricTargetKcal ?? nutrition.caloricTargetKcal ?? null;
  const energyBalanceKcal = legacyNutritionOrContext.energyBalanceKcal ?? nutrition.energyBalanceKcal ?? null;
  const proteinGPerKg = legacyNutritionOrContext.proteinGPerKg ?? nutrition.proteinGKg ?? null;
  const prescribedKcal = legacyNutritionOrContext.prescribedKcal ?? nutrition.prescribedKcal ?? null;
  const nutritionObjective = legacyNutritionOrContext.nutritionObjective ?? legacyNutritionOrContext.patient?.objective ?? null;

  return createNutritionDTO({
    patientId: pId,
    tmbKcal,
    getKcal,
    activityFactor,
    caloricTargetKcal,
    energyBalanceKcal,
    proteinGPerKg,
    prescribedKcal,
    nutritionObjective
  });
}

/**
 * Converte plano de treino legado para TrainingPrescriptionDTO
 * @param {Object} legacyTraining - Objeto de resposta da IA, perfWorkoutPlan ou prescrição Dexie
 * @param {Object} [options] - Metadados adicionais ({ patientId, split, splitSource, frequency })
 * @returns {Readonly<Object>} TrainingPrescriptionDTO
 */
function legacyTrainingToTrainingPrescriptionDTO(legacyTraining = {}, options = {}) {
  if (!legacyTraining || typeof legacyTraining !== 'object') {
    return createTrainingPrescriptionDTO(options);
  }

  const patientId = options.patientId ?? legacyTraining.patientId ?? '';

  // Normalização de rotinas: aceita array ou objeto (ex: { A: {...}, B: {...} })
  let rawRoutines = [];
  if (Array.isArray(legacyTraining.routines)) {
    rawRoutines = legacyTraining.routines;
  } else if (legacyTraining.workoutPlan && typeof legacyTraining.workoutPlan === 'object') {
    rawRoutines = Object.entries(legacyTraining.workoutPlan).map(([letter, data]) => ({
      id: letter,
      name: data.name || `Treino ${letter}`,
      exercises: data.exercises || []
    }));
  } else if (typeof legacyTraining === 'object' && !legacyTraining.routines) {
    const keys = Object.keys(legacyTraining).filter(k => k.length === 1 && k.toUpperCase() === k);
    if (keys.length > 0) {
      rawRoutines = keys.map(k => ({
        id: k,
        name: legacyTraining[k].name || `Treino ${k}`,
        exercises: legacyTraining[k].exercises || []
      }));
    }
  }

  // Dedução ou atribuição formal de split e splitSource
  let split = options.split ?? legacyTraining.split ?? legacyTraining.activeSplit;
  let splitSource = options.splitSource ?? legacyTraining.splitSource;

  if (!split) {
    // Comportamento transitório do legado mantido exclusivamente como fallback no adaptador
    split = rawRoutines.length >= 5 ? 'PHAT' : (rawRoutines.length === 4 ? 'UpperLower' : 'PPL');
    splitSource = splitSource || 'DETERMINISTIC';
  } else if (!splitSource) {
    splitSource = (legacyTraining.source === 'AI' || legacyTraining.generatedBy === 'Gemini') ? 'AI' : 'HUMAN';
  }

  const frequency = options.frequency ?? legacyTraining.frequency ?? rawRoutines.length;

  const normalizedRoutines = rawRoutines.map((r, idx) => ({
    routineId: r.id || r.routineId || `routine_${idx + 1}`,
    routineName: r.routineName || r.name || `Rotina ${idx + 1}`,
    day: r.day || null,
    exercises: (Array.isArray(r.exercises) ? r.exercises : []).map(ex => ({
      exerciseName: ex.exerciseName || ex.name || 'Exercício',
      sets: ex.sets != null ? Number(ex.sets) : 3,
      reps: ex.reps != null ? String(ex.reps) : '8-12',
      rpe: ex.rpe != null ? Number(ex.rpe) : null,
      restSeconds: ex.restSeconds != null ? Number(ex.restSeconds) : null
    }))
  }));

  return createTrainingPrescriptionDTO({
    patientId,
    split,
    splitSource,
    frequency,
    routines: normalizedRoutines
  });
}

/**
 * Converte prescrição de cardio legada para CardioPrescriptionDTO (Multi-Sessão)
 * @param {Object} legacyCardio - Prescrição gerada pelo Cardio Engine ou salva no Dexie
 * @param {Object} [options] - Metadados adicionais ({ patientId })
 * @returns {Readonly<Object>} CardioPrescriptionDTO
 */
function legacyCardioToCardioPrescriptionDTO(legacyCardio = {}, options = {}) {
  if (!legacyCardio || typeof legacyCardio !== 'object') {
    return createCardioPrescriptionDTO(options);
  }

  const patientId = options.patientId ?? legacyCardio.patientId ?? '';

  let rawSessions = [];
  if (Array.isArray(legacyCardio.sessions)) {
    rawSessions = legacyCardio.sessions;
  } else if (legacyCardio.cardioPrescription && Array.isArray(legacyCardio.cardioPrescription.sessions)) {
    rawSessions = legacyCardio.cardioPrescription.sessions;
  } else if (legacyCardio.prescribedCardioId) {
    // Caso de sessão única legada
    rawSessions = [{
      protocolId: legacyCardio.prescribedCardioId,
      durationMinutes: 45,
      day: 'Dia 2'
    }];
  }

  const normalizedSessions = rawSessions.map((s, idx) => ({
    cardioId: s.cardioId || s.sessionId || s.protocolId || `cardio_${idx + 1}`,
    day: s.day || null,
    type: s.type || (s.protocolId === 'cardio_03' || s.protocolId === 'cardio_04' ? 'HIIT' : 'Moderado Contínuo'),
    durationMinutes: s.durationMinutes != null ? Number(s.durationMinutes) : 45,
    intensity: s.intensity || null,
    modality: s.modality || s.protocolTitle || null,
    heartRateZone: s.heartRateZone || null,
    targetBpm: s.targetBpm || null
  }));

  return createCardioPrescriptionDTO({
    patientId,
    sessions: normalizedSessions
  });
}

const {
  buildCanonicalPerformanceContext,
  fetchAndBuildCanonicalPerformanceContext,
  calculatePureHeartRateZones,
  resolvePatientAgeAndProvenance
} = require('./performanceContextAdapter');

// Suporte a CommonJS e navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    legacyPatientToPatientDTO,
    legacyAssessmentToAssessmentDTO,
    legacyNutritionToNutritionDTO,
    legacyTrainingToTrainingPrescriptionDTO,
    legacyCardioToCardioPrescriptionDTO,
    buildCanonicalPerformanceContext,
    fetchAndBuildCanonicalPerformanceContext,
    calculatePureHeartRateZones,
    resolvePatientAgeAndProvenance
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.adapters = {
    legacyPatientToPatientDTO,
    legacyAssessmentToAssessmentDTO,
    legacyNutritionToNutritionDTO,
    legacyTrainingToTrainingPrescriptionDTO,
    legacyCardioToCardioPrescriptionDTO,
    buildCanonicalPerformanceContext,
    fetchAndBuildCanonicalPerformanceContext,
    calculatePureHeartRateZones,
    resolvePatientAgeAndProvenance
  };
}

