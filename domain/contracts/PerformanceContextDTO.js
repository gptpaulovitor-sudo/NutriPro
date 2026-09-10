/**
 * domain/contracts/PerformanceContextDTO.js
 * 
 * Contrato Canônico de Contexto de Performance — Pilar de Performance.
 * Camada Pura — NutriAx Pro.
 * 
 * Princípios Arquiteturais:
 * 1. PUREZA ABSOLUTA: Zero acesso ao DOM, zero I/O, zero chamadas ao banco ou APIs.
 * 2. IMUTABILIDADE: Objeto profundamente congelado (deep freeze).
 * 3. PROVENIÊNCIA EXPLÍCITA: Rastreabilidade de cada domínio.
 * 4. SEPARAÇÃO ATUAL VS HISTÓRICO: Estados correntes e históricos não se misturam.
 * 5. COMPLETUDE DETERMINÍSTICA: Campos ausentes assumem null ou [] explícitos.
 */

/**
 * Função utilitária interna para congelamento profundo e seguro
 * @param {any} obj 
 * @returns {any}
 */
function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = obj[prop];
    if (value !== null && (typeof value === 'object' || typeof value === 'function') && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });
  return obj;
}

/**
 * Validador estrito de conformidade do PerformanceContextDTO
 * @param {Object} context 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validatePerformanceContextDTO(context) {
  const errors = [];

  if (!context || typeof context !== 'object') {
    return { isValid: false, errors: ['Contexto deve ser um objeto válido não-nulo.'] };
  }

  // 1. Metadados e versão
  if (!context.schemaVersion || typeof context.schemaVersion !== 'string') {
    errors.push('schemaVersion é obrigatório e deve ser uma string (ex: "1.0.0").');
  }
  if (!context.generatedAt || typeof context.generatedAt !== 'string') {
    errors.push('generatedAt é obrigatório e deve ser uma string ISO.');
  }

  // 2. Paciente
  if (!context.patient || typeof context.patient !== 'object') {
    errors.push('patient é obrigatório e deve ser um objeto.');
  } else {
    if (!context.patient.patientId || typeof context.patient.patientId !== 'string' || context.patient.patientId.trim() === '') {
      errors.push('patient.patientId é obrigatório e não pode ser vazio.');
    }
    if (context.patient.patientId && /^(ai_gen_|gemini_|temp_ai_)/i.test(context.patient.patientId)) {
      errors.push('patient.patientId não pode ser gerado sinteticamente por IA.');
    }
    if (context.patient.age != null && (typeof context.patient.age !== 'number' || context.patient.age < 0 || context.patient.age > 130)) {
      errors.push('patient.age deve ser um número inteiro entre 0 e 130.');
    }
    if (context.patient.weightKg != null && (typeof context.patient.weightKg !== 'number' || context.patient.weightKg <= 0 || context.patient.weightKg > 500)) {
      errors.push('patient.weightKg deve ser um número positivo realista (0 a 500 kg).');
    }
  }

  // 3. Domínios estruturais obrigatórios (devem existir como objeto ou null/array, nunca undefined)
  const requiredDomains = [
    'anamnesis',
    'assessment',
    'anthropometry',
    'bodyComposition',
    'energy',
    'nutrition',
    'training',
    'cardio',
    'constraints',
    'clinicalFlags',
    'provenance'
  ];

  for (const domain of requiredDomains) {
    if (context[domain] === undefined) {
      errors.push(`Domínio obrigatório "${domain}" não pode ser undefined (deve ser objeto, array ou null).`);
    }
  }

  // 4. Validação de Restrições (constraints)
  if (context.constraints && typeof context.constraints === 'object') {
    if (!Array.isArray(context.constraints.injuries)) {
      errors.push('constraints.injuries deve ser um array.');
    }
    if (!Array.isArray(context.constraints.prohibitedExercises)) {
      errors.push('constraints.prohibitedExercises deve ser um array.');
    }
    if (!Array.isArray(context.constraints.painAreas)) {
      errors.push('constraints.painAreas deve ser um array.');
    }
    if (!Array.isArray(context.constraints.medicalRestrictions)) {
      errors.push('constraints.medicalRestrictions deve ser um array.');
    }
  }

  // 5. Validação de ClinicalFlags
  if (context.clinicalFlags && typeof context.clinicalFlags === 'object') {
    if (typeof context.clinicalFlags.isMinor !== 'boolean') {
      errors.push('clinicalFlags.isMinor deve ser um booleano estrito.');
    }
    if (typeof context.clinicalFlags.clinicalReviewRequired !== 'boolean') {
      errors.push('clinicalFlags.clinicalReviewRequired deve ser um booleano estrito.');
    }
  }

  // 6. Validação de separação Atual vs Histórico em Treino e Nutrição
  if (context.training && typeof context.training === 'object') {
    if (context.training.current === undefined || context.training.history === undefined) {
      errors.push('training deve separar explicitamente "current" e "history".');
    }
    if (context.training.history && !Array.isArray(context.training.history)) {
      errors.push('training.history deve ser um array.');
    }
  }

  if (context.nutrition && typeof context.nutrition === 'object') {
    if (context.nutrition.current === undefined || context.nutrition.history === undefined) {
      errors.push('nutrition deve separar explicitamente "current" e "history".');
    }
    if (context.nutrition.history && !Array.isArray(context.nutrition.history)) {
      errors.push('nutrition.history deve ser um array.');
    }
  }

  // 7. Validação de Cardio
  if (context.cardio && typeof context.cardio === 'object') {
    if (context.cardio.current === undefined || context.cardio.history === undefined) {
      errors.push('cardio deve separar explicitamente "current" e "history".');
    }
    if (context.cardio.current && !Array.isArray(context.cardio.current.sessions)) {
      errors.push('cardio.current.sessions deve ser um array de sessões.');
    }
  }

  // 8. Validação de Proveniência
  if (context.provenance && typeof context.provenance === 'object') {
    if (!context.provenance.patient || !context.provenance.energy) {
      errors.push('provenance deve mapear explicitamente ao menos "patient" e "energy".');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Factory Canônica para criação do PerformanceContextDTO imutável
 * @param {Object} rawData 
 * @returns {Readonly<Object>}
 */
function createPerformanceContextDTO(rawData = {}) {
  const data = (rawData && typeof rawData === 'object') ? rawData : {};

  // 1. Paciente
  const rawPatient = data.patient || {};
  const patient = {
    patientId: String(rawPatient.patientId || '').trim(),
    name: rawPatient.name ? String(rawPatient.name).trim() : null,
    age: rawPatient.age != null && !isNaN(Number(rawPatient.age)) ? Math.floor(Number(rawPatient.age)) : null,
    sex: rawPatient.sex ? String(rawPatient.sex).trim() : null,
    birthDate: rawPatient.birthDate ? String(rawPatient.birthDate).trim() : null,
    weightKg: rawPatient.weightKg != null && !isNaN(Number(rawPatient.weightKg)) ? Number(Number(rawPatient.weightKg).toFixed(2)) : null,
    heightCm: rawPatient.heightCm != null && !isNaN(Number(rawPatient.heightCm)) ? Number(Number(rawPatient.heightCm).toFixed(1)) : null,
    bmi: rawPatient.bmi != null && !isNaN(Number(rawPatient.bmi)) ? Number(Number(rawPatient.bmi).toFixed(2)) : null,
    patientType: rawPatient.patientType ? String(rawPatient.patientType).trim() : null,
    trainingLevel: rawPatient.trainingLevel ? String(rawPatient.trainingLevel).trim() : null,
    objective: rawPatient.objective ? String(rawPatient.objective).trim() : null
  };

  // 2. Anamnese
  const rawAnamnesis = data.anamnesis || {};
  const anamnesis = {
    objective: rawAnamnesis.objective ?? patient.objective ?? null,
    usualWeightKg: rawAnamnesis.usualWeightKg != null ? Number(rawAnamnesis.usualWeightKg) : null,
    targetWeightKg: rawAnamnesis.targetWeightKg != null ? Number(rawAnamnesis.targetWeightKg) : null,
    routineNotes: rawAnamnesis.routineNotes ? String(rawAnamnesis.routineNotes).trim() : null,
    clinicalNotes: rawAnamnesis.clinicalNotes ? String(rawAnamnesis.clinicalNotes).trim() : null,
    dietaryRestrictions: rawAnamnesis.dietaryRestrictions ? String(rawAnamnesis.dietaryRestrictions).trim() : null,
    foodAversions: rawAnamnesis.foodAversions ? String(rawAnamnesis.foodAversions).trim() : null,
    preferredFoods: rawAnamnesis.preferredFoods ? String(rawAnamnesis.preferredFoods).trim() : null,
    cookingAvailability: rawAnamnesis.cookingAvailability ? String(rawAnamnesis.cookingAvailability).trim() : null,
    mealPreparer: rawAnamnesis.mealPreparer ? String(rawAnamnesis.mealPreparer).trim() : null,
    mealFrequency: rawAnamnesis.mealFrequency ? String(rawAnamnesis.mealFrequency).trim() : null,
    hydrationLiters: rawAnamnesis.hydrationLiters != null ? Number(rawAnamnesis.hydrationLiters) : null,
    bowelHabit: rawAnamnesis.bowelHabit ? String(rawAnamnesis.bowelHabit).trim() : null,
    neatRoutine: rawAnamnesis.neatRoutine ? String(rawAnamnesis.neatRoutine).trim() : null,
    workoutType: rawAnamnesis.workoutType ? String(rawAnamnesis.workoutType).trim() : null,
    workoutFrequency: rawAnamnesis.workoutFrequency != null ? rawAnamnesis.workoutFrequency : null,
    workoutDuration: rawAnamnesis.workoutDuration != null ? rawAnamnesis.workoutDuration : null,
    workoutIntensity: rawAnamnesis.workoutIntensity ? String(rawAnamnesis.workoutIntensity).trim() : null,
    workoutTime: rawAnamnesis.workoutTime ? String(rawAnamnesis.workoutTime).trim() : null,
    sleepHours: rawAnamnesis.sleepHours != null ? Number(rawAnamnesis.sleepHours) : null,
    sleepQuality: rawAnamnesis.sleepQuality ? String(rawAnamnesis.sleepQuality).trim() : null,
    stressLevel: rawAnamnesis.stressLevel ? String(rawAnamnesis.stressLevel).trim() : null,
    activityFactor: rawAnamnesis.activityFactor != null ? Number(rawAnamnesis.activityFactor) : null,
    restingHeartRate: rawAnamnesis.restingHeartRate != null ? Number(rawAnamnesis.restingHeartRate) : null
  };

  // 3. Avaliação Antropométrica (Assessment DTO snapshot ou null)
  const assessment = data.assessment ? { ...data.assessment } : null;

  // 4. Antropometria consolidada
  const rawAnthro = data.anthropometry || {};
  const anthropometry = {
    weightKg: rawAnthro.weightKg != null ? Number(rawAnthro.weightKg) : patient.weightKg,
    heightCm: rawAnthro.heightCm != null ? Number(rawAnthro.heightCm) : patient.heightCm,
    bmi: rawAnthro.bmi != null ? Number(rawAnthro.bmi) : patient.bmi,
    circumferences: {
      waist: rawAnthro.circumferences?.waist != null ? Number(rawAnthro.circumferences.waist) : null,
      hip: rawAnthro.circumferences?.hip != null ? Number(rawAnthro.circumferences.hip) : null,
      abdomen: rawAnthro.circumferences?.abdomen != null ? Number(rawAnthro.circumferences.abdomen) : null,
      arm: rawAnthro.circumferences?.arm != null ? Number(rawAnthro.circumferences.arm) : null,
      armRelaxed: rawAnthro.circumferences?.armRelaxed != null ? Number(rawAnthro.circumferences.armRelaxed) : null,
      forearm: rawAnthro.circumferences?.forearm != null ? Number(rawAnthro.circumferences.forearm) : null,
      thigh: rawAnthro.circumferences?.thigh != null ? Number(rawAnthro.circumferences.thigh) : null,
      calf: rawAnthro.circumferences?.calf != null ? Number(rawAnthro.circumferences.calf) : null,
      chest: rawAnthro.circumferences?.chest != null ? Number(rawAnthro.circumferences.chest) : null,
      neck: rawAnthro.circumferences?.neck != null ? Number(rawAnthro.circumferences.neck) : null,
      waistToHipRatio: rawAnthro.circumferences?.waistToHipRatio != null ? Number(rawAnthro.circumferences.waistToHipRatio) : null
    },
    skinfolds: rawAnthro.skinfolds ? {
      triceps: rawAnthro.skinfolds.triceps != null ? Number(rawAnthro.skinfolds.triceps) : null,
      subscapular: rawAnthro.skinfolds.subscapular != null ? Number(rawAnthro.skinfolds.subscapular) : null,
      biceps: rawAnthro.skinfolds.biceps != null ? Number(rawAnthro.skinfolds.biceps) : null,
      chest: rawAnthro.skinfolds.chest != null ? Number(rawAnthro.skinfolds.chest) : null,
      axillary: rawAnthro.skinfolds.axillary != null ? Number(rawAnthro.skinfolds.axillary) : null,
      suprailiac: rawAnthro.skinfolds.suprailiac != null ? Number(rawAnthro.skinfolds.suprailiac) : null,
      abdominal: rawAnthro.skinfolds.abdominal != null ? Number(rawAnthro.skinfolds.abdominal) : null,
      thigh: rawAnthro.skinfolds.thigh != null ? Number(rawAnthro.skinfolds.thigh) : null,
      calf: rawAnthro.skinfolds.calf != null ? Number(rawAnthro.skinfolds.calf) : null
    } : null,
    indices: {
      rcq: rawAnthro.indices?.rcq != null ? Number(rawAnthro.indices.rcq) : null,
      rcqClassification: rawAnthro.indices?.rcqClassification || null,
      rcEst: rawAnthro.indices?.rcEst != null ? Number(rawAnthro.indices.rcEst) : null,
      rcEstClassification: rawAnthro.indices?.rcEstClassification || null,
      conicityIndex: rawAnthro.indices?.conicityIndex != null ? Number(rawAnthro.indices.conicityIndex) : null,
      conicityClassification: rawAnthro.indices?.conicityClassification || null,
      ffmi: rawAnthro.indices?.ffmi != null ? Number(rawAnthro.indices.ffmi) : null,
      skeletalMuscleMassKg: rawAnthro.indices?.skeletalMuscleMassKg != null ? Number(rawAnthro.indices.skeletalMuscleMassKg) : null,
      hasCardiometabolicRisk: !!rawAnthro.indices?.hasCardiometabolicRisk
    }
  };

  // 5. Composição Corporal
  const rawBodyComp = data.bodyComposition || {};
  const bodyComposition = {
    bodyFatPercent: rawBodyComp.bodyFatPercent != null ? Number(rawBodyComp.bodyFatPercent) : null,
    targetBodyFatPercent: rawBodyComp.targetBodyFatPercent != null ? Number(rawBodyComp.targetBodyFatPercent) : null,
    leanMassKg: rawBodyComp.leanMassKg != null ? Number(rawBodyComp.leanMassKg) : null,
    fatMassKg: rawBodyComp.fatMassKg != null ? Number(rawBodyComp.fatMassKg) : null,
    boneMassKg: rawBodyComp.boneMassKg != null ? Number(rawBodyComp.boneMassKg) : null,
    residualMassKg: rawBodyComp.residualMassKg != null ? Number(rawBodyComp.residualMassKg) : null,
    protocol: rawBodyComp.protocol || null
  };

  // 6. Matemática Energética Canônica
  const rawEnergy = data.energy || {};
  const energy = {
    tmbKcal: rawEnergy.tmbKcal != null ? Number(rawEnergy.tmbKcal) : null,
    getKcal: rawEnergy.getKcal != null ? Number(rawEnergy.getKcal) : null,
    activityFactor: rawEnergy.activityFactor != null ? Number(rawEnergy.activityFactor) : 1.42,
    caloricTargetKcal: rawEnergy.caloricTargetKcal != null ? Number(rawEnergy.caloricTargetKcal) : null,
    caloricTargetSource: rawEnergy.caloricTargetSource || (rawEnergy.caloricTargetKcal ? 'prescribed' : 'get_fallback'),
    energyBalanceKcal: rawEnergy.energyBalanceKcal != null ? Number(rawEnergy.energyBalanceKcal) : null,
    tmbMethod: rawEnergy.tmbMethod || 'Katch-McArdle',
    goalProjection: rawEnergy.goalProjection ? { ...rawEnergy.goalProjection } : null
  };

  // 7. Nutrição (Separado: Current vs History)
  const rawNutrition = data.nutrition || {};
  const rawNutrCurrent = rawNutrition.current || rawNutrition;
  const nutrition = {
    current: {
      prescribedKcal: rawNutrCurrent.prescribedKcal != null ? Number(rawNutrCurrent.prescribedKcal) : null,
      caloricTargetKcal: rawNutrCurrent.caloricTargetKcal != null ? Number(rawNutrCurrent.caloricTargetKcal) : energy.caloricTargetKcal,
      caloricTargetSource: rawNutrCurrent.caloricTargetSource || energy.caloricTargetSource,
      energyBalanceKcal: rawNutrCurrent.energyBalanceKcal != null ? Number(rawNutrCurrent.energyBalanceKcal) : energy.energyBalanceKcal,
      proteinGPerKg: rawNutrCurrent.proteinGPerKg != null ? Number(rawNutrCurrent.proteinGPerKg) : (rawNutrCurrent.proteinGKg != null ? Number(rawNutrCurrent.proteinGKg) : null),
      carbsGPerKg: rawNutrCurrent.carbsGPerKg != null ? Number(rawNutrCurrent.carbsGPerKg) : null,
      fatGPerKg: rawNutrCurrent.fatGPerKg != null ? Number(rawNutrCurrent.fatGPerKg) : null,
      totalProteinG: rawNutrCurrent.totalProteinG != null ? Number(rawNutrCurrent.totalProteinG) : null,
      totalCarbsG: rawNutrCurrent.totalCarbsG != null ? Number(rawNutrCurrent.totalCarbsG) : null,
      totalFatG: rawNutrCurrent.totalFatG != null ? Number(rawNutrCurrent.totalFatG) : null,
      dietaryRestrictions: rawNutrCurrent.dietaryRestrictions || anamnesis.dietaryRestrictions,
      foodAversions: rawNutrCurrent.foodAversions || anamnesis.foodAversions,
      preferredFoods: rawNutrCurrent.preferredFoods || anamnesis.preferredFoods,
      mealsCount: Array.isArray(rawNutrCurrent.meals) ? rawNutrCurrent.meals.length : (rawNutrCurrent.mealsCount || 0),
      meals: Array.isArray(rawNutrCurrent.meals) ? rawNutrCurrent.meals.map(m => ({ ...m })) : [],
      fasting: rawNutrCurrent.fasting ? { ...rawNutrCurrent.fasting } : null
    },
    history: Array.isArray(rawNutrition.history) ? rawNutrition.history.map(h => ({ ...h })) : []
  };

  // 8. Treinamento (Separado: Current vs History)
  const rawTraining = data.training || {};
  const rawTrainCurrent = rawTraining.current || rawTraining;
  const training = {
    current: {
      mainModality: rawTrainCurrent.mainModality || anamnesis.workoutType || 'Musculação',
      workoutType: rawTrainCurrent.workoutType || anamnesis.workoutType || 'Musculação / Força',
      weeklyFrequency: rawTrainCurrent.weeklyFrequency != null ? Number(rawTrainCurrent.weeklyFrequency) : (typeof anamnesis.workoutFrequency === 'number' ? anamnesis.workoutFrequency : null),
      frequencyLabel: rawTrainCurrent.frequencyLabel || (anamnesis.workoutFrequency ? String(anamnesis.workoutFrequency) : null),
      sessionDurationMinutes: rawTrainCurrent.sessionDurationMinutes != null ? Number(rawTrainCurrent.sessionDurationMinutes) : (typeof anamnesis.workoutDuration === 'number' ? anamnesis.workoutDuration : 60),
      durationLabel: rawTrainCurrent.durationLabel || (anamnesis.workoutDuration ? String(anamnesis.workoutDuration) : '60 min'),
      trainingLevel: rawTrainCurrent.trainingLevel || patient.trainingLevel || 'Iniciante',
      intensity: rawTrainCurrent.intensity || anamnesis.workoutIntensity || 'Moderada',
      preferredTime: rawTrainCurrent.preferredTime || anamnesis.workoutTime || null,
      neatRoutine: rawTrainCurrent.neatRoutine || anamnesis.neatRoutine || 'Moderado',
      activeSplit: rawTrainCurrent.activeSplit || rawTrainCurrent.split || null,
      splitSource: rawTrainCurrent.splitSource || (rawTrainCurrent.activeSplit ? 'LEGACY' : null),
      routines: Array.isArray(rawTrainCurrent.routines) ? rawTrainCurrent.routines.map(r => ({
        routineId: r.routineId || r.id || '',
        routineName: r.routineName || r.name || '',
        day: r.day || null,
        exercises: Array.isArray(r.exercises) ? r.exercises.map(ex => ({
          exerciseName: ex.exerciseName || ex.name || '',
          sets: ex.sets != null ? Number(ex.sets) : 3,
          reps: ex.reps != null ? String(ex.reps) : '8-12',
          rpe: ex.rpe != null ? Number(ex.rpe) : null,
          restSeconds: ex.restSeconds != null ? Number(ex.restSeconds) : null
        })) : []
      })) : [],
      weeklySchedule: Array.isArray(rawTrainCurrent.weeklySchedule) ? rawTrainCurrent.weeklySchedule.map(s => ({ ...s })) : []
    },
    history: Array.isArray(rawTraining.history) ? rawTraining.history.map(h => ({ ...h })) : []
  };

  // 9. Cardio (Separado: Current vs History)
  const rawCardio = data.cardio || {};
  const rawCardioCurrent = rawCardio.current || rawCardio;
  const cardio = {
    current: {
      prescribedCardioId: rawCardioCurrent.prescribedCardioId || null,
      weeklyFrequency: Array.isArray(rawCardioCurrent.sessions) ? rawCardioCurrent.sessions.length : (rawCardioCurrent.weeklyFrequency || 0),
      sessions: Array.isArray(rawCardioCurrent.sessions) ? rawCardioCurrent.sessions.map((s, idx) => ({
        cardioId: s.cardioId || s.sessionId || s.protocolId || `cardio_${idx + 1}`,
        day: s.day || null,
        type: s.type || 'Moderado Contínuo',
        durationMinutes: s.durationMinutes != null ? Number(s.durationMinutes) : 45,
        intensity: s.intensity || null,
        modality: s.modality || s.protocolTitle || null,
        heartRateZone: s.heartRateZone || null,
        targetBpm: s.targetBpm != null ? Number(s.targetBpm) : null
      })) : [],
      heartRate: rawCardioCurrent.heartRate ? {
        maxHR: rawCardioCurrent.heartRate.maxHR != null ? Number(rawCardioCurrent.heartRate.maxHR) : null,
        restingHR: rawCardioCurrent.heartRate.restingHR != null ? Number(rawCardioCurrent.heartRate.restingHR) : null,
        reserveHR: rawCardioCurrent.heartRate.reserveHR != null ? Number(rawCardioCurrent.heartRate.reserveHR) : null,
        isCustom: !!rawCardioCurrent.heartRate.isCustom,
        method: rawCardioCurrent.heartRate.method || 'Tanaka / Karvonen',
        zones: Array.isArray(rawCardioCurrent.heartRate.zones) ? rawCardioCurrent.heartRate.zones.map(z => ({ ...z })) : []
      } : null,
      restrictions: Array.isArray(rawCardioCurrent.restrictions) ? [...rawCardioCurrent.restrictions] : []
    },
    history: Array.isArray(rawCardio.history) ? rawCardio.history.map(h => ({ ...h })) : []
  };

  // 10. Restrições Clínicas e de Segurança (constraints)
  const rawConstraints = data.constraints || {};
  const constraints = {
    injuries: Array.isArray(rawConstraints.injuries) ? [...new Set(rawConstraints.injuries.filter(Boolean).map(String))] : [],
    painAreas: Array.isArray(rawConstraints.painAreas) ? [...new Set(rawConstraints.painAreas.filter(Boolean).map(String))] : [],
    prohibitedExercises: Array.isArray(rawConstraints.prohibitedExercises) ? [...new Set(rawConstraints.prohibitedExercises.filter(Boolean).map(String))] : [],
    restrictedMovements: Array.isArray(rawConstraints.restrictedMovements) ? [...new Set(rawConstraints.restrictedMovements.filter(Boolean).map(String))] : [],
    medicalRestrictions: Array.isArray(rawConstraints.medicalRestrictions) ? [...new Set(rawConstraints.medicalRestrictions.filter(Boolean).map(String))] : [],
    equipmentRestrictions: rawConstraints.equipmentRestrictions ? (Array.isArray(rawConstraints.equipmentRestrictions) ? [...rawConstraints.equipmentRestrictions] : String(rawConstraints.equipmentRestrictions)) : null,
    availableEquipment: rawConstraints.availableEquipment ? String(rawConstraints.availableEquipment) : null,
    scheduleRestrictions: Array.isArray(rawConstraints.scheduleRestrictions) ? [...rawConstraints.scheduleRestrictions] : [],
    recoveryRestrictions: Array.isArray(rawConstraints.recoveryRestrictions) ? [...rawConstraints.recoveryRestrictions] : []
  };

  // 11. Tipo de Paciente e Flags Clínicas
  const isMinor = patient.age !== null ? patient.age < 18 : false;
  const clinicalReviewReasons = [];
  if (isMinor) clinicalReviewReasons.push('Paciente menor de idade (< 18 anos) requer supervisão e autorização pediátrica.');
  if (constraints.injuries.length > 0) clinicalReviewReasons.push(`Presença de lesões ativas: ${constraints.injuries.join(', ')}.`);
  if (constraints.medicalRestrictions.length > 0) clinicalReviewReasons.push(`Restrições médicas informadas: ${constraints.medicalRestrictions.join(', ')}.`);
  if (anthropometry.indices.hasCardiometabolicRisk) clinicalReviewReasons.push('Risco cardiometabólico elevado detectado (RCEst > 0.50 ou Índice de Conicidade elevado).');

  const clinicalFlags = {
    isMinor,
    clinicalReviewRequired: clinicalReviewReasons.length > 0,
    reasons: clinicalReviewReasons
  };

  // 12. Proveniência dos Dados (Rastreabilidade Auditável)
  const rawProvenance = data.provenance || {};
  const provenance = {
    schema: 'PerformanceContextDTO@1.0.0',
    patient: rawProvenance.patient || { source: 'dexie.patients', entity: 'Patient' },
    anamnesis: rawProvenance.anamnesis || { source: 'dexie.patients', entity: 'Anamnesis' },
    assessment: rawProvenance.assessment || (assessment ? { source: 'dexie.assessments', entity: 'Assessment' } : null),
    anthropometry: rawProvenance.anthropometry || { source: 'dexie.assessments', calculation: 'domain/math/nutritionMath.js' },
    bodyComposition: rawProvenance.bodyComposition || { source: 'dexie.assessments', calculation: 'domain/math/nutritionMath.js' },
    energy: rawProvenance.energy || { source: 'domain/math/nutritionMath.js', calculation: 'canonical' },
    nutrition: rawProvenance.nutrition || { source: 'dexie.prescriptions', entity: 'Prescription' },
    training: rawProvenance.training || { source: 'dexie.performanceMetabolica', entity: 'PerformanceWorkout' },
    cardio: rawProvenance.cardio || { source: 'PERF_CARDIO_DB', entity: 'CardioPrescription' },
    constraints: rawProvenance.constraints || { source: 'dexie.patients', field: 'prohibitedExercises/injuries/clinicalConstraints' },
    clinicalFlags: rawProvenance.clinicalFlags || { source: 'domain/rules', rule: 'pediatric_and_clinical_risk_guard' }
  };

  const contextDTO = {
    schemaVersion: '1.0.0',
    generatedAt: data.generatedAt || new Date().toISOString(),
    patient,
    anamnesis,
    assessment,
    anthropometry,
    bodyComposition,
    energy,
    nutrition,
    training,
    cardio,
    constraints,
    clinicalFlags,
    provenance
  };

  const validation = validatePerformanceContextDTO(contextDTO);
  if (!validation.isValid) {
    throw new Error(`[createPerformanceContextDTO] Falha de validação do contrato: ${validation.errors.join('; ')}`);
  }

  return deepFreeze(contextDTO);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validatePerformanceContextDTO,
    createPerformanceContextDTO
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.PerformanceContextDTO = {
    validatePerformanceContextDTO,
    createPerformanceContextDTO
  };
}
