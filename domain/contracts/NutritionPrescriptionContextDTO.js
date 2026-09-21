/**
 * domain/contracts/NutritionPrescriptionContextDTO.js
 * 
 * Contrato Canônico de Contexto de Prescrição Nutricional — NutriAx Pro.
 * Camada Pura — Zero DOM, Zero Dexie/Firebase, Zero Gemini, Zero Solver.
 * 
 * Princípios Arquiteturais (Fase N1.1):
 * 1. PUREZA ABSOLUTA: Nenhum I/O, nenhuma dependência externa de infraestrutura.
 * 2. IMUTABILIDADE: Objeto profundamente congelado (deepFreeze).
 * 3. PROVENIÊNCIA EXPLÍCITA: Rastreabilidade granular de cada domínio.
 * 4. CONTEXTO NÃO É PRESCRIÇÃO: Transporta fatos normalizados, não decide dietas nem carb cycling.
 * 5. SEPARAÇÃO ESTRITA: Restrições vs Aversões, TMB vs GET vs CaloricTargetKcal.
 * 6. COMPLETUDE DETERMINÍSTICA: Ausência de dados gera null ou [] explícitos.
 */

/**
 * Função utilitária para congelamento profundo e seguro (deep freeze recursivo)
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
 * Validador estrito de conformidade do NutritionPrescriptionContextDTO
 * @param {Object} context 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateNutritionPrescriptionContextDTO(context) {
  const errors = [];

  if (!context || typeof context !== 'object' || Array.isArray(context)) {
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
  if (!context.patient || typeof context.patient !== 'object' || Array.isArray(context.patient)) {
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
    if (context.patient.sex != null && !['Masculino', 'Feminino', 'Outro'].includes(context.patient.sex)) {
      errors.push('patient.sex deve ser "Masculino", "Feminino", "Outro" ou null.');
    }
  }

  // 3. Objetivo
  if (!context.objective || typeof context.objective !== 'object' || Array.isArray(context.objective)) {
    errors.push('objective é obrigatório e deve ser um objeto.');
  } else {
    const validSources = ['PATIENT_REPORTED', 'CLINICIAN_DEFINED', 'DERIVED', 'MISSING'];
    if (context.objective.source && !validSources.includes(context.objective.source)) {
      errors.push(`objective.source deve ser um dos valores: ${validSources.join(', ')}.`);
    }
  }

  // 4. Antropometria
  if (!context.anthropometry || typeof context.anthropometry !== 'object' || Array.isArray(context.anthropometry)) {
    errors.push('anthropometry é obrigatório e deve ser um objeto.');
  } else {
    if (typeof context.anthropometry.hasRecentAssessment !== 'boolean') {
      errors.push('anthropometry.hasRecentAssessment deve ser um booleano.');
    }
    if (context.anthropometry.weightKg != null && (typeof context.anthropometry.weightKg !== 'number' || context.anthropometry.weightKg <= 0 || context.anthropometry.weightKg > 500)) {
      errors.push('anthropometry.weightKg deve ser um número positivo realista (0 a 500 kg).');
    }
    if (context.anthropometry.heightCm != null && (typeof context.anthropometry.heightCm !== 'number' || context.anthropometry.heightCm <= 0 || context.anthropometry.heightCm > 300)) {
      errors.push('anthropometry.heightCm deve ser um número positivo realista em cm (0 a 300 cm).');
    }
  }

  // 5. Energia (Regras Estritas de Fase N1.1)
  if (!context.energy || typeof context.energy !== 'object' || Array.isArray(context.energy)) {
    errors.push('energy é obrigatório e deve ser um objeto.');
  } else {
    if (context.energy.tmbKcal != null && (typeof context.energy.tmbKcal !== 'number' || isNaN(context.energy.tmbKcal) || context.energy.tmbKcal < 0)) {
      errors.push('energy.tmbKcal deve ser um número não-negativo ou null.');
    }
    if (context.energy.getKcal != null && (typeof context.energy.getKcal !== 'number' || isNaN(context.energy.getKcal) || context.energy.getKcal < 0)) {
      errors.push('energy.getKcal deve ser um número não-negativo ou null.');
    }
    if (context.energy.caloricTargetKcal != null && (typeof context.energy.caloricTargetKcal !== 'number' || isNaN(context.energy.caloricTargetKcal) || context.energy.caloricTargetKcal < 0)) {
      errors.push('energy.caloricTargetKcal deve ser um número não-negativo ou null.');
    }
    if (context.energy.energyBalanceKcal != null && (typeof context.energy.energyBalanceKcal !== 'number' || isNaN(context.energy.energyBalanceKcal))) {
      errors.push('energy.energyBalanceKcal deve ser um número ou null.');
    }
  }

  // 6. Restrições e Aversões (Devem ser arrays estritamente separados)
  if (!context.constraints || typeof context.constraints !== 'object' || Array.isArray(context.constraints)) {
    errors.push('constraints é obrigatório e deve ser um objeto.');
  } else {
    if (!Array.isArray(context.constraints.dietaryRestrictions)) {
      errors.push('constraints.dietaryRestrictions deve ser um array.');
    }
    if (!Array.isArray(context.constraints.allergies)) {
      errors.push('constraints.allergies deve ser um array.');
    }
    if (!Array.isArray(context.constraints.intolerances)) {
      errors.push('constraints.intolerances deve ser um array.');
    }
    if (!Array.isArray(context.constraints.aversions)) {
      errors.push('constraints.aversions deve ser um array.');
    }
  }

  // 7. Preferências
  if (!context.preferences || typeof context.preferences !== 'object' || Array.isArray(context.preferences)) {
    errors.push('preferences é obrigatório e deve ser um objeto.');
  } else {
    if (!Array.isArray(context.preferences.preferredFoods)) {
      errors.push('preferences.preferredFoods deve ser um array.');
    }
  }

  // 8. Rotina
  if (!context.routine || typeof context.routine !== 'object' || Array.isArray(context.routine)) {
    errors.push('routine é obrigatório e deve ser um objeto.');
  }

  // 9. Recordatório
  if (!context.dietaryRecall || typeof context.dietaryRecall !== 'object' || Array.isArray(context.dietaryRecall)) {
    errors.push('dietaryRecall é obrigatório e deve ser um objeto.');
  } else {
    if (typeof context.dietaryRecall.hasRecall !== 'boolean') {
      errors.push('dietaryRecall.hasRecall deve ser um booleano.');
    }
    if (typeof context.dietaryRecall.itemsCount !== 'number') {
      errors.push('dietaryRecall.itemsCount deve ser um número.');
    }
    if (!Array.isArray(context.dietaryRecall.typicalMealTimes)) {
      errors.push('dietaryRecall.typicalMealTimes deve ser um array.');
    }
    if (!Array.isArray(context.dietaryRecall.items)) {
      errors.push('dietaryRecall.items deve ser um array.');
    }
  }

  // 10. Treino e Cardio
  if (!context.training || typeof context.training !== 'object' || Array.isArray(context.training)) {
    errors.push('training é obrigatório e deve ser um objeto.');
  } else {
    if (typeof context.training.hasActiveTraining !== 'boolean') {
      errors.push('training.hasActiveTraining deve ser um booleano.');
    }
    if (!Array.isArray(context.training.routines)) {
      errors.push('training.routines deve ser um array.');
    }
  }

  if (!context.cardio || typeof context.cardio !== 'object' || Array.isArray(context.cardio)) {
    errors.push('cardio é obrigatório e deve ser um objeto.');
  } else {
    if (typeof context.cardio.hasActiveCardio !== 'boolean') {
      errors.push('cardio.hasActiveCardio deve ser um booleano.');
    }
    if (typeof context.cardio.weeklyFrequency !== 'number') {
      errors.push('cardio.weeklyFrequency deve ser um número.');
    }
    if (!Array.isArray(context.cardio.sessions)) {
      errors.push('cardio.sessions deve ser um array.');
    }
  }

  // 11. Microciclo Semanal (weeklySchedule) — Invariante Crítica: PROIBIDO CARB CYCLING ARTIFICIAL
  if (!Array.isArray(context.weeklySchedule)) {
    errors.push('weeklySchedule deve ser um array.');
  } else {
    for (let i = 0; i < context.weeklySchedule.length; i++) {
      const day = context.weeklySchedule[i];
      if (day && typeof day === 'object') {
        if (day.demand != null && /carb/i.test(String(day.demand))) {
          errors.push(`weeklySchedule[${i}]: Proibido adicionar regras de carb cycling artificial ("${day.demand}").`);
        }
        if (day.carbLevel != null) {
          errors.push(`weeklySchedule[${i}]: Proibido adicionar carbLevel no microciclo em N1.1.`);
        }
      }
    }
  }

  // 12. Jejum
  if (!context.fasting || typeof context.fasting !== 'object' || Array.isArray(context.fasting)) {
    errors.push('fasting é obrigatório e deve ser um objeto.');
  } else {
    if (typeof context.fasting.hasActiveProtocol !== 'boolean') {
      errors.push('fasting.hasActiveProtocol deve ser um booleano.');
    }
    if (!['ACTIVE', 'INACTIVE'].includes(context.fasting.status)) {
      errors.push('fasting.status deve ser "ACTIVE" ou "INACTIVE".');
    }
  }

  // 13. Clínico
  if (!context.clinical || typeof context.clinical !== 'object' || Array.isArray(context.clinical)) {
    errors.push('clinical é obrigatório e deve ser um objeto.');
  } else {
    if (!Array.isArray(context.clinical.exams)) {
      errors.push('clinical.exams deve ser um array.');
    }
  }

  // 14. Prescrição Atual
  if (!context.currentPrescription || typeof context.currentPrescription !== 'object' || Array.isArray(context.currentPrescription)) {
    errors.push('currentPrescription é obrigatório e deve ser um objeto.');
  } else {
    if (typeof context.currentPrescription.hasCurrentPrescription !== 'boolean') {
      errors.push('currentPrescription.hasCurrentPrescription deve ser um booleano.');
    }
    if (!Array.isArray(context.currentPrescription.meals)) {
      errors.push('currentPrescription.meals deve ser um array.');
    }
  }

  // 15. Proveniência
  if (!context.provenance || typeof context.provenance !== 'object' || Array.isArray(context.provenance)) {
    errors.push('provenance é obrigatório e deve ser um objeto.');
  } else {
    const criticalProvenanceKeys = ['weight', 'height', 'objective', 'energy', 'constraints', 'training', 'cardio', 'fasting', 'recall'];
    for (const key of criticalProvenanceKeys) {
      if (!context.provenance[key] || typeof context.provenance[key] !== 'object') {
        errors.push(`provenance.${key} é obrigatório e deve ser um objeto descritivo.`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Factory Canônica para criação do NutritionPrescriptionContextDTO imutável
 * @param {Object} rawData 
 * @returns {Readonly<Object>}
 */
function createNutritionPrescriptionContextDTO(rawData = {}) {
  const data = (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) ? rawData : {};

  // 1. Paciente
  const rawPatient = data.patient || {};
  const patient = {
    patientId: String(rawPatient.patientId || '').trim(),
    name: rawPatient.name ? String(rawPatient.name).trim() : null,
    age: (rawPatient.age != null && !isNaN(Number(rawPatient.age))) ? Math.floor(Number(rawPatient.age)) : null,
    sex: rawPatient.sex ? String(rawPatient.sex).trim() : null,
    birthDate: rawPatient.birthDate ? String(rawPatient.birthDate).trim() : null,
    patientType: rawPatient.patientType ? String(rawPatient.patientType).trim() : null,
    trainingLevel: rawPatient.trainingLevel ? String(rawPatient.trainingLevel).trim() : null
  };
  if (rawPatient.allowAdolescent !== undefined) {
    patient.allowAdolescent = Boolean(rawPatient.allowAdolescent);
  }

  // 2. Objetivo
  const rawObj = data.objective || {};
  const objective = {
    clinicalObjective: rawObj.clinicalObjective ? String(rawObj.clinicalObjective).trim() : null,
    targetWeightKg: (rawObj.targetWeightKg != null && !isNaN(Number(rawObj.targetWeightKg))) ? Number(Number(rawObj.targetWeightKg).toFixed(2)) : null,
    targetBodyFatPercent: (rawObj.targetBodyFatPercent != null && !isNaN(Number(rawObj.targetBodyFatPercent))) ? Number(Number(rawObj.targetBodyFatPercent).toFixed(1)) : null,
    source: rawObj.source || 'MISSING'
  };

  // 3. Antropometria
  const rawAnthro = data.anthropometry || {};
  const anthropometry = {
    hasRecentAssessment: !!rawAnthro.hasRecentAssessment,
    assessmentId: rawAnthro.assessmentId ? String(rawAnthro.assessmentId).trim() : null,
    assessmentDate: rawAnthro.assessmentDate ? String(rawAnthro.assessmentDate).trim() : null,
    weightKg: (rawAnthro.weightKg != null && !isNaN(Number(rawAnthro.weightKg))) ? Number(Number(rawAnthro.weightKg).toFixed(2)) : null,
    heightCm: (rawAnthro.heightCm != null && !isNaN(Number(rawAnthro.heightCm))) ? Number(Number(rawAnthro.heightCm).toFixed(1)) : null,
    bmi: (rawAnthro.bmi != null && !isNaN(Number(rawAnthro.bmi))) ? Number(Number(rawAnthro.bmi).toFixed(2)) : null,
    bodyFatPercent: (rawAnthro.bodyFatPercent != null && !isNaN(Number(rawAnthro.bodyFatPercent))) ? Number(Number(rawAnthro.bodyFatPercent).toFixed(1)) : null,
    leanMassKg: (rawAnthro.leanMassKg != null && !isNaN(Number(rawAnthro.leanMassKg))) ? Number(Number(rawAnthro.leanMassKg).toFixed(2)) : null,
    fatMassKg: (rawAnthro.fatMassKg != null && !isNaN(Number(rawAnthro.fatMassKg))) ? Number(Number(rawAnthro.fatMassKg).toFixed(2)) : null,
    circumferences: (rawAnthro.circumferences && typeof rawAnthro.circumferences === 'object' && !Array.isArray(rawAnthro.circumferences)) ? { ...rawAnthro.circumferences } : null,
    skinfolds: (rawAnthro.skinfolds && typeof rawAnthro.skinfolds === 'object' && !Array.isArray(rawAnthro.skinfolds)) ? { ...rawAnthro.skinfolds } : null,
    indices: (rawAnthro.indices && typeof rawAnthro.indices === 'object' && !Array.isArray(rawAnthro.indices)) ? { ...rawAnthro.indices } : null
  };

  // 4. Energia
  const rawEnergy = data.energy || {};
  const energy = {
    tmbKcal: (rawEnergy.tmbKcal != null && !isNaN(Number(rawEnergy.tmbKcal))) ? Math.round(Number(rawEnergy.tmbKcal)) : null,
    getKcal: (rawEnergy.getKcal != null && !isNaN(Number(rawEnergy.getKcal))) ? Math.round(Number(rawEnergy.getKcal)) : null,
    activityFactor: (rawEnergy.activityFactor != null && !isNaN(Number(rawEnergy.activityFactor))) ? Number(Number(rawEnergy.activityFactor).toFixed(2)) : null,
    caloricTargetKcal: (rawEnergy.caloricTargetKcal != null && !isNaN(Number(rawEnergy.caloricTargetKcal))) ? Math.round(Number(rawEnergy.caloricTargetKcal)) : null,
    energyBalanceKcal: (rawEnergy.energyBalanceKcal != null && !isNaN(Number(rawEnergy.energyBalanceKcal))) ? Math.round(Number(rawEnergy.energyBalanceKcal)) : null,
    source: rawEnergy.source ? String(rawEnergy.source).trim() : 'MISSING',
    formula: rawEnergy.formula ? String(rawEnergy.formula).trim() : 'canonical'
  };

  // 5. Restrições (Separadas de Aversões)
  const rawConstraints = data.constraints || {};
  const constraints = {
    dietaryRestrictions: Array.isArray(rawConstraints.dietaryRestrictions) ? [...new Set(rawConstraints.dietaryRestrictions.filter(Boolean).map(String))] : [],
    allergies: Array.isArray(rawConstraints.allergies) ? [...new Set(rawConstraints.allergies.filter(Boolean).map(String))] : [],
    intolerances: Array.isArray(rawConstraints.intolerances) ? [...new Set(rawConstraints.intolerances.filter(Boolean).map(String))] : [],
    aversions: Array.isArray(rawConstraints.aversions) ? [...new Set(rawConstraints.aversions.filter(Boolean).map(String))] : [],
    clinicalNotes: rawConstraints.clinicalNotes ? (Array.isArray(rawConstraints.clinicalNotes) ? [...rawConstraints.clinicalNotes] : String(rawConstraints.clinicalNotes).trim()) : null
  };

  // 6. Preferências
  const rawPrefs = data.preferences || {};
  const accessibilityPreferences = rawPrefs.accessibilityPreferences || data.accessibilityPreferences || data.questionarioAcessibilidade || null;
  const dietaryStyle = rawPrefs.dietaryStyle || data.dietaryStyle ? String(rawPrefs.dietaryStyle || data.dietaryStyle).trim() : null;
  const dietaryCycle = rawPrefs.dietaryCycle || data.dietaryCycle ? String(rawPrefs.dietaryCycle || data.dietaryCycle).trim() : null;
  const preferences = {
    preferredFoods: Array.isArray(rawPrefs.preferredFoods) ? [...new Set(rawPrefs.preferredFoods.filter(Boolean).map(String))] : [],
    dietaryStyle,
    dietaryCycle,
    mealFrequency: rawPrefs.mealFrequency != null ? rawPrefs.mealFrequency : null,
    accessibilityPreferences: accessibilityPreferences ? (typeof accessibilityPreferences === 'object' ? { ...accessibilityPreferences } : accessibilityPreferences) : null
  };

  // 7. Rotina (Horários inexistentes permanecem estritamente null)
  const rawRoutine = data.routine || {};
  const routine = {
    neat: rawRoutine.neat ? String(rawRoutine.neat).trim() : null,
    workoutTime: rawRoutine.workoutTime ? String(rawRoutine.workoutTime).trim() : null,
    sleepHours: (rawRoutine.sleepHours != null && !isNaN(Number(rawRoutine.sleepHours))) ? Number(rawRoutine.sleepHours) : null,
    sleepQuality: rawRoutine.sleepQuality ? String(rawRoutine.sleepQuality).trim() : null,
    stressLevel: rawRoutine.stressLevel ? String(rawRoutine.stressLevel).trim() : null,
    hydrationLiters: (rawRoutine.hydrationLiters != null && !isNaN(Number(rawRoutine.hydrationLiters))) ? Number(Number(rawRoutine.hydrationLiters).toFixed(2)) : null,
    bowelHabit: rawRoutine.bowelHabit ? String(rawRoutine.bowelHabit).trim() : null,
    cookingAvailability: rawRoutine.cookingAvailability ? String(rawRoutine.cookingAvailability).trim() : null,
    mealPreparer: rawRoutine.mealPreparer ? String(rawRoutine.mealPreparer).trim() : null,
    wakeUpTime: rawRoutine.wakeUpTime ? String(rawRoutine.wakeUpTime).trim() : null,
    bedTime: rawRoutine.bedTime ? String(rawRoutine.bedTime).trim() : null,
    mealsPerDay: (rawRoutine.mealsPerDay != null && !isNaN(Number(rawRoutine.mealsPerDay))) ? Number(rawRoutine.mealsPerDay) : null,
    mealCount: (rawRoutine.mealCount != null && !isNaN(Number(rawRoutine.mealCount))) ? Number(rawRoutine.mealCount) : null
  };

  // 8. Recordatório
  const rawRecall = data.dietaryRecall || {};
  const dietaryRecall = {
    hasRecall: !!rawRecall.hasRecall,
    itemsCount: typeof rawRecall.itemsCount === 'number' ? rawRecall.itemsCount : (Array.isArray(rawRecall.items) ? rawRecall.items.length : 0),
    typicalMealTimes: Array.isArray(rawRecall.typicalMealTimes) ? [...new Set(rawRecall.typicalMealTimes.filter(Boolean).map(String))] : [],
    items: Array.isArray(rawRecall.items) ? rawRecall.items.map(item => ({
      foodId: item.foodId ? String(item.foodId).trim() : null,
      foodName: item.foodName ? String(item.foodName).trim() : '',
      quantity: item.quantity != null ? Number(item.quantity) : 0,
      unit: item.unit ? String(item.unit).trim() : 'g',
      mealName: item.mealName ? String(item.mealName).trim() : '',
      mealTime: item.mealTime ? String(item.mealTime).trim() : null,
      macros: item.macros ? {
        calories: item.macros.calories != null ? Number(item.macros.calories) : 0,
        protein: item.macros.protein != null ? Number(item.macros.protein) : 0,
        carbohydrate: item.macros.carbohydrate != null ? Number(item.macros.carbohydrate) : 0,
        lipid: item.macros.lipid != null ? Number(item.macros.lipid) : 0
      } : null
    })) : []
  };

  // 9. Treino
  const rawTraining = data.training || {};
  const training = {
    hasActiveTraining: !!rawTraining.hasActiveTraining,
    activeSplit: rawTraining.activeSplit ? String(rawTraining.activeSplit).trim() : null,
    splitSource: rawTraining.splitSource ? String(rawTraining.splitSource).trim() : null,
    trainingLevel: rawTraining.trainingLevel ? String(rawTraining.trainingLevel).trim() : null,
    frequency: rawTraining.frequency != null ? rawTraining.frequency : null,
    sessionDurationMinutes: (rawTraining.sessionDurationMinutes != null && !isNaN(Number(rawTraining.sessionDurationMinutes))) ? Number(rawTraining.sessionDurationMinutes) : null,
    intensity: rawTraining.intensity ? String(rawTraining.intensity).trim() : null,
    workoutType: rawTraining.workoutType ? String(rawTraining.workoutType).trim() : null,
    routines: Array.isArray(rawTraining.routines) ? rawTraining.routines.map(r => ({
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
    })) : []
  };

  // 10. Cardio
  const rawCardio = data.cardio || {};
  const cardio = {
    hasActiveCardio: !!rawCardio.hasActiveCardio,
    weeklyFrequency: typeof rawCardio.weeklyFrequency === 'number' ? rawCardio.weeklyFrequency : (Array.isArray(rawCardio.sessions) ? rawCardio.sessions.length : 0),
    sessions: Array.isArray(rawCardio.sessions) ? rawCardio.sessions.map((s, idx) => ({
      cardioId: s.cardioId || s.sessionId || s.protocolId || `cardio_${idx + 1}`,
      protocolId: s.protocolId || null,
      day: s.day || null,
      type: s.type || 'Moderado Contínuo',
      durationMinutes: s.durationMinutes != null ? Number(s.durationMinutes) : 45,
      intensity: s.intensity || null,
      modality: s.modality || s.protocolTitle || null,
      targetBpm: s.targetBpm != null ? Number(s.targetBpm) : null
    })) : [],
    heartRate: (rawCardio.heartRate && typeof rawCardio.heartRate === 'object' && !Array.isArray(rawCardio.heartRate)) ? { ...rawCardio.heartRate } : null
  };

  // 11. Microciclo Semanal (weeklySchedule)
  const weeklySchedule = Array.isArray(data.weeklySchedule) ? data.weeklySchedule.map(s => {
    const dayCopy = {
      dayKey: s.dayKey || '',
      dayName: s.dayName || '',
      training: s.training ? { ...s.training } : null,
      cardio: s.cardio ? { ...s.cardio } : null,
      rest: !!s.rest,
      sessions: Array.isArray(s.sessions) ? s.sessions.map(sess => ({ ...sess })) : []
    };
    if (s.demand !== undefined) dayCopy.demand = s.demand;
    if (s.carbLevel !== undefined) dayCopy.carbLevel = s.carbLevel;
    return dayCopy;
  }) : [];

  // 12. Jejum
  const rawFasting = data.fasting || {};
  const fasting = {
    hasActiveProtocol: !!rawFasting.hasActiveProtocol,
    status: rawFasting.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
    type: rawFasting.type ? String(rawFasting.type).trim() : null,
    subtype: rawFasting.subtype ? String(rawFasting.subtype).trim() : null,
    feedingWindows: rawFasting.feedingWindows ? (Array.isArray(rawFasting.feedingWindows) ? rawFasting.feedingWindows.map(w => ({ ...w })) : { ...rawFasting.feedingWindows }) : null,
    fastingWindows: rawFasting.fastingWindows ? (Array.isArray(rawFasting.fastingWindows) ? rawFasting.fastingWindows.map(w => ({ ...w })) : { ...rawFasting.fastingWindows }) : null
  };

  // 13. Exames Clínicos
  const rawClinical = data.clinical || {};
  const clinical = {
    exams: Array.isArray(rawClinical.exams) ? rawClinical.exams.map(e => ({ ...e })) : [],
    latestExamDate: rawClinical.latestExamDate ? String(rawClinical.latestExamDate).trim() : null
  };

  // 14. Prescrição Atual
  const rawPresc = data.currentPrescription || {};
  const currentPrescription = {
    hasCurrentPrescription: !!rawPresc.hasCurrentPrescription,
    prescriptionId: rawPresc.prescriptionId ? String(rawPresc.prescriptionId).trim() : null,
    prescribedKcal: (rawPresc.prescribedKcal != null && !isNaN(Number(rawPresc.prescribedKcal))) ? Math.round(Number(rawPresc.prescribedKcal)) : null,
    proteinGPerKg: (rawPresc.proteinGPerKg != null && !isNaN(Number(rawPresc.proteinGPerKg))) ? Number(Number(rawPresc.proteinGPerKg).toFixed(2)) : null,
    carbsGPerKg: (rawPresc.carbsGPerKg != null && !isNaN(Number(rawPresc.carbsGPerKg))) ? Number(Number(rawPresc.carbsGPerKg).toFixed(2)) : null,
    fatGPerKg: (rawPresc.fatGPerKg != null && !isNaN(Number(rawPresc.fatGPerKg))) ? Number(Number(rawPresc.fatGPerKg).toFixed(2)) : null,
    totalProteinG: (rawPresc.totalProteinG != null && !isNaN(Number(rawPresc.totalProteinG))) ? Math.round(Number(rawPresc.totalProteinG)) : null,
    totalCarbsG: (rawPresc.totalCarbsG != null && !isNaN(Number(rawPresc.totalCarbsG))) ? Math.round(Number(rawPresc.totalCarbsG)) : null,
    totalFatG: (rawPresc.totalFatG != null && !isNaN(Number(rawPresc.totalFatG))) ? Math.round(Number(rawPresc.totalFatG)) : null,
    mealsCount: typeof rawPresc.mealsCount === 'number' ? rawPresc.mealsCount : (Array.isArray(rawPresc.meals) ? rawPresc.meals.length : 0),
    meals: Array.isArray(rawPresc.meals) ? rawPresc.meals.map(m => ({ ...m })) : [],
    createdAt: rawPresc.createdAt ? String(rawPresc.createdAt).trim() : null
  };

  // 15. Proveniência dos Dados
  const rawProv = data.provenance || {};
  const provenance = {
    weight: rawProv.weight ? { ...rawProv.weight } : { source: 'db.patients', recordId: null, date: null, reliability: 'MISSING' },
    height: rawProv.height ? { ...rawProv.height } : { source: 'db.patients', recordId: null, reliability: 'MISSING' },
    objective: rawProv.objective ? { ...rawProv.objective } : { source: 'db.patients', reliability: 'MISSING' },
    energy: rawProv.energy ? { ...rawProv.energy } : { source: 'canonical_math', calculation: 'tmb_get', reliability: 'MISSING' },
    constraints: rawProv.constraints ? { ...rawProv.constraints } : { source: 'db.patients', reliability: 'MISSING' },
    training: rawProv.training ? { ...rawProv.training } : { source: 'db.performanceMetabolica', reliability: 'MISSING' },
    cardio: rawProv.cardio ? { ...rawProv.cardio } : { source: 'perfCardioPrescription', reliability: 'MISSING' },
    fasting: rawProv.fasting ? { ...rawProv.fasting } : { source: 'db.fastingProtocols', reliability: 'MISSING' },
    recall: rawProv.recall ? { ...rawProv.recall } : { source: 'db.dietaryRecall', reliability: 'MISSING' }
  };

  const contextDTO = {
    schemaVersion: '1.0.0',
    generatedAt: data.generatedAt || new Date().toISOString(),
    patient,
    objective,
    anthropometry,
    energy,
    constraints,
    preferences,
    routine,
    dietaryRecall,
    training,
    cardio,
    weeklySchedule,
    fasting,
    clinical,
    currentPrescription,
    mealsPerDay: (data.mealsPerDay != null && !isNaN(Number(data.mealsPerDay))) ? Number(data.mealsPerDay) : (routine.mealsPerDay ?? null),
    mealCount: (data.mealCount != null && !isNaN(Number(data.mealCount))) ? Number(data.mealCount) : (routine.mealCount ?? null),
    dietaryStyle: preferences.dietaryStyle || null,
    dietaryCycle: preferences.dietaryCycle || null,
    accessibilityPreferences: preferences.accessibilityPreferences || null,
    questionarioAcessibilidade: preferences.accessibilityPreferences || null,
    provenance
  };

  const validation = validateNutritionPrescriptionContextDTO(contextDTO);
  if (!validation.isValid) {
    throw new Error(`[createNutritionPrescriptionContextDTO] Falha de validação do contrato: ${validation.errors.join('; ')}`);
  }

  return deepFreeze(contextDTO);
}

// Suporte a CommonJS e navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    deepFreeze,
    validateNutritionPrescriptionContextDTO,
    createNutritionPrescriptionContextDTO
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.NutritionPrescriptionContextDTO = {
    deepFreeze,
    validateNutritionPrescriptionContextDTO,
    createNutritionPrescriptionContextDTO
  };
}
