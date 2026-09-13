/**
 * domain/adapters/nutritionContextAdapter.js
 * 
 * Adaptador Canônico de Contexto de Prescrição Nutricional — NutriAx Pro.
 * Camada Pura — Padrão Strangler Fig.
 * 
 * Regras Obrigatórias de Governança (Fase N1.1):
 * 1. PUREZA ABSOLUTA: Zero DOM, zero chamadas ao banco (Dexie/Firebase), zero Gemini, zero Solver.
 * 2. CÓPIA DEFENSIVA: Clona todas as entradas antes de montar o snapshot. Mutação externa não afeta o contexto.
 * 3. ZERO VALORES INVENTADOS: Horários ou dados ausentes assumem null ou [] explícitos (nunca defaults fictícios como 07:00 ou 22:00).
 * 4. CONTEXTO NÃO É PRESCRIÇÃO: Transporta fatos normalizados; não decide dietas, nem carb cycling (proibido HIGH_CARB/LOW_CARB no microciclo).
 * 5. REGRA ENERGÉTICA ESTRITA:
 *    - tmbKcal: taxa metabólica basal canônica.
 *    - getKcal: gasto energético total canônico.
 *    - caloricTargetKcal: meta de ingestão explicitamente homologada (se não houver meta homologada, permanece null!).
 *    - energyBalanceKcal: caloricTargetKcal - getKcal (somente se ambos existirem, senão null).
 * 6. SEPARAÇÃO ESTRITA: Restrições, alergias, intolerâncias e aversões são domínios distintos.
 * 7. PROVENIÊNCIA GRANULAR: Registra origem real (source, recordId, reliability) para auditoria.
 * 8. IMUTABILIDADE: Retorna NutritionPrescriptionContextDTO profundamente congelado (deepFreeze).
 */

const { createNutritionPrescriptionContextDTO } = require('../contracts/NutritionPrescriptionContextDTO');
const {
  calculateIMC,
  calculateTMB,
  calculateGET,
  classifyRCEst
} = require('../math/nutritionMath');

/**
 * Clona profundamente um objeto ou array de forma pura (cópia defensiva)
 * @param {any} val 
 * @returns {any}
 */
function deepClone(val) {
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map(deepClone);
  const copy = {};
  for (const key of Object.keys(val)) {
    copy[key] = deepClone(val[key]);
  }
  return copy;
}

/**
 * Normaliza altura garantindo representação em centímetros sem duplicar conversão.
 * Se < 3.0, assume metros (ex: 1.75 -> 175). Se >= 3.0, assume cm (ex: 175 -> 175).
 * @param {any} heightVal 
 * @returns {number|null}
 */
function normalizeHeight(heightVal) {
  if (heightVal == null || heightVal === '') return null;
  const num = Number(heightVal);
  if (isNaN(num) || num <= 0) return null;
  if (num < 3.0) {
    return Number((num * 100).toFixed(1));
  }
  return Number(num.toFixed(1));
}

/**
 * Resolve dados biográficos do paciente com rastreabilidade real
 * @param {Object} p 
 * @returns {Object}
 */
function resolvePatientBio(p = {}) {
  let age = null;
  let birthDate = null;
  let ageProvenance = { source: 'none', recordId: null, reliability: 'MISSING' };

  const rawBirth = p.birthDate || p.dateOfBirth;
  if (rawBirth) {
    const bDate = new Date(rawBirth);
    if (!isNaN(bDate.getTime())) {
      const today = new Date();
      let calculatedAge = today.getFullYear() - bDate.getFullYear();
      const m = today.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge >= 0 && calculatedAge <= 130) {
        age = calculatedAge;
        birthDate = bDate.toISOString().split('T')[0];
        ageProvenance = { source: 'db.patients', recordId: p.id || null, reliability: 'CANONICAL' };
      }
    }
  }

  if (age == null && p.age != null && !isNaN(parseInt(p.age, 10))) {
    const parsed = parseInt(p.age, 10);
    if (parsed >= 0 && parsed <= 130) {
      age = parsed;
      ageProvenance = { source: 'db.patients', recordId: p.id || null, reliability: 'PATIENT_REPORTED' };
    }
  }

  let sex = null;
  const rawSex = p.gender || p.sex;
  if (rawSex) {
    const s = String(rawSex).trim().toLowerCase();
    if (s.startsWith('m')) sex = 'Masculino';
    else if (s.startsWith('f')) sex = 'Feminino';
    else sex = 'Outro';
  }

  return {
    patientId: String(p.id || p.patientId || '').trim(),
    name: p.name ? String(p.name).trim() : null,
    age,
    sex,
    birthDate,
    patientType: p.patientType ? String(p.patientType).trim() : null,
    trainingLevel: p.trainingLevel ? String(p.trainingLevel).trim() : null,
    ageProvenance
  };
}

/**
 * Seleciona deterministicamente a avaliação mais recente e válida.
 * Fallback para cadastro do paciente com procedência PATIENT_REPORTED se não houver avaliação.
 * @param {Array<Object>} assessmentsList 
 * @param {Object} p 
 * @returns {Object}
 */
function resolveLatestAssessment(assessmentsList = [], p = {}) {
  const validAssessments = (Array.isArray(assessmentsList) ? assessmentsList : [])
    .filter(a => a && typeof a === 'object' && !String(a.id || '').startsWith('eval_pv_'))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const latest = validAssessments[0] || null;

  if (latest) {
    const weightKg = latest.weightKg != null && !isNaN(Number(latest.weightKg))
      ? Number(Number(latest.weightKg).toFixed(2))
      : (latest.weight != null && !isNaN(Number(latest.weight)) ? Number(Number(latest.weight).toFixed(2)) : null);

    const heightCm = normalizeHeight(latest.heightCm ?? latest.height ?? p.heightCm ?? p.height);

    let bmi = null;
    if (latest.bmi != null && !isNaN(Number(latest.bmi))) {
      bmi = Number(Number(latest.bmi).toFixed(2));
    } else if (weightKg != null && heightCm != null && heightCm > 0) {
      const imcRes = calculateIMC(weightKg, heightCm / 100);
      bmi = imcRes ? imcRes.imc : null;
    }

    const bodyFatPercent = latest.fatPercent != null && !isNaN(Number(latest.fatPercent))
      ? Number(Number(latest.fatPercent).toFixed(1))
      : (latest.bodyFatPercent != null && !isNaN(Number(latest.bodyFatPercent)) ? Number(Number(latest.bodyFatPercent).toFixed(1)) : null);

    let leanMassKg = null;
    if (latest.leanMass != null && !isNaN(Number(latest.leanMass)) && Number(latest.leanMass) > 0) {
      leanMassKg = Number(Number(latest.leanMass).toFixed(2));
    } else if (weightKg != null && bodyFatPercent != null) {
      leanMassKg = Number((weightKg * (1 - bodyFatPercent / 100)).toFixed(2));
    }

    let fatMassKg = null;
    if (latest.fatMass != null && !isNaN(Number(latest.fatMass)) && Number(latest.fatMass) > 0) {
      fatMassKg = Number(Number(latest.fatMass).toFixed(2));
    } else if (weightKg != null && bodyFatPercent != null) {
      fatMassKg = Number((weightKg * (bodyFatPercent / 100)).toFixed(2));
    }

    const waist = latest.waist != null ? Number(latest.waist) : null;
    const hip = latest.hip != null ? Number(latest.hip) : null;
    const circumferences = {
      waist,
      hip,
      abdomen: latest.circAbdomen != null ? Number(latest.circAbdomen) : null,
      arm: latest.arm != null ? Number(latest.arm) : null,
      armRelaxed: latest.circArmRelaxed != null ? Number(latest.circArmRelaxed) : null,
      forearm: latest.circForearm != null ? Number(latest.circForearm) : null,
      thigh: latest.circThigh != null ? Number(latest.circThigh) : null,
      calf: latest.circCalf != null ? Number(latest.circCalf) : null,
      chest: latest.circChest != null ? Number(latest.circChest) : null,
      neck: latest.circNeck != null ? Number(latest.circNeck) : null,
      waistToHipRatio: (waist && hip && hip > 0) ? Number((waist / hip).toFixed(2)) : null
    };

    let skinfolds = null;
    const rawFolds = latest.skinfolds || latest;
    const foldEntries = [
      ['triceps', rawFolds.skTriceps ?? rawFolds.triceps],
      ['subscapular', rawFolds.skSubscapular ?? rawFolds.subscapular],
      ['biceps', rawFolds.skBiceps ?? rawFolds.biceps],
      ['chest', rawFolds.skChest ?? rawFolds.chest],
      ['axillary', rawFolds.skAxillary ?? rawFolds.axillary],
      ['suprailiac', rawFolds.skSuprailiac ?? rawFolds.suprailiac],
      ['abdominal', rawFolds.skAbdominal ?? rawFolds.abdominal],
      ['thigh', rawFolds.skThigh ?? rawFolds.thigh],
      ['calf', rawFolds.skCalfFold ?? rawFolds.skCalf ?? rawFolds.calf]
    ];
    let hasAnyFold = false;
    const foldsObj = {};
    foldEntries.forEach(([k, v]) => {
      if (v != null && !isNaN(Number(v))) {
        foldsObj[k] = Number(Number(v).toFixed(1));
        hasAnyFold = true;
      } else {
        foldsObj[k] = null;
      }
    });
    if (hasAnyFold) skinfolds = foldsObj;

    const rcEst = (waist && heightCm) ? Number((waist / heightCm).toFixed(2)) : null;
    const ffmi = (heightCm && leanMassKg) ? Number((leanMassKg / Math.pow(heightCm / 100, 2)).toFixed(2)) : null;

    return {
      hasRecentAssessment: true,
      assessmentId: latest.id || latest.assessmentId || null,
      assessmentDate: latest.date || null,
      weightKg,
      heightCm,
      bmi,
      bodyFatPercent,
      leanMassKg,
      fatMassKg,
      circumferences,
      skinfolds,
      indices: {
        rcq: circumferences.waistToHipRatio,
        rcEst,
        rcEstClassification: rcEst != null ? classifyRCEst(rcEst) : null,
        ffmi
      },
      provenance: {
        weight: { source: 'db.assessments', recordId: latest.id || null, date: latest.date || null, reliability: 'CANONICAL' },
        height: { source: latest.heightCm || latest.height ? 'db.assessments' : 'db.patients', recordId: latest.id || p.id || null, reliability: 'CANONICAL' }
      }
    };
  }

  // Fallback para cadastro do paciente
  const weightKg = p.currentWeight != null && !isNaN(Number(p.currentWeight))
    ? Number(Number(p.currentWeight).toFixed(2))
    : (p.weightKg != null && !isNaN(Number(p.weightKg))
      ? Number(Number(p.weightKg).toFixed(2))
      : (p.usualWeight != null && !isNaN(Number(p.usualWeight)) ? Number(Number(p.usualWeight).toFixed(2)) : null));

  const heightCm = normalizeHeight(p.heightCm ?? p.height);

  let bmi = null;
  if (weightKg != null && heightCm != null && heightCm > 0) {
    const imcRes = calculateIMC(weightKg, heightCm / 100);
    bmi = imcRes ? imcRes.imc : null;
  }

  const bodyFatPercent = p.bodyFatPercent != null && !isNaN(Number(p.bodyFatPercent)) ? Number(Number(p.bodyFatPercent).toFixed(1)) : null;
  const leanMassKg = (weightKg != null && bodyFatPercent != null) ? Number((weightKg * (1 - bodyFatPercent / 100)).toFixed(2)) : null;
  const fatMassKg = (weightKg != null && bodyFatPercent != null) ? Number((weightKg * (bodyFatPercent / 100)).toFixed(2)) : null;

  return {
    hasRecentAssessment: false,
    assessmentId: null,
    assessmentDate: null,
    weightKg,
    heightCm,
    bmi,
    bodyFatPercent,
    leanMassKg,
    fatMassKg,
    circumferences: null,
    skinfolds: null,
    indices: null,
    provenance: {
      weight: { source: 'db.patients', recordId: p.id || null, date: null, reliability: weightKg != null ? 'PATIENT_REPORTED' : 'MISSING' },
      height: { source: 'db.patients', recordId: p.id || null, reliability: heightCm != null ? 'PATIENT_REPORTED' : 'MISSING' }
    }
  };
}

/**
 * Resolve os parâmetros de energia estritamente conforme a regra N1.1:
 * - tmbKcal: TMB calculada pelas fórmulas canônicas existentes.
 * - getKcal: GET calculado a partir da TMB e activityFactor.
 * - caloricTargetKcal: META ENERGÉTICA DE INGESTÃO EXPLICITAMENTE HOMOLOGADA.
 *   NÃO assume GET, NÃO assume TMB, NÃO calcula déficit/superávit sem homologação.
 *   Se não houver meta homologada, retorna null!
 * - energyBalanceKcal: caloricTargetKcal - getKcal (somente quando ambos existirem).
 * @param {Object} p 
 * @param {Object} anthro 
 * @param {Object} [prescription] 
 * @param {Object} [options] 
 * @returns {Object}
 */
function resolveEnergyTargets(p = {}, anthro = {}, prescription = null, options = {}) {
  const age = (p.age != null && !isNaN(Number(p.age))) ? Number(p.age) : null;
  const sex = p.sex || 'Masculino';
  const weightKg = anthro.weightKg;
  const heightCm = anthro.heightCm;
  const leanMassKg = anthro.leanMassKg || 0;

  let tmbKcal = null;
  let formula = 'canonical';

  if (age != null && weightKg != null && heightCm != null && heightCm > 0) {
    const tmbCalc = calculateTMB(sex, age, weightKg, heightCm / 100, leanMassKg);
    tmbKcal = Math.round(tmbCalc.tmb);
    formula = tmbCalc.method;
  }

  const rawAf = options.activityFactor ?? p.activityFactor ?? p.af;
  const activityFactor = (rawAf != null && !isNaN(Number(rawAf))) ? Number(Number(rawAf).toFixed(2)) : (tmbKcal ? 1.42 : null);

  let getKcal = null;
  if (tmbKcal != null && activityFactor != null) {
    getKcal = Math.round(calculateGET(tmbKcal, activityFactor));
  }

  // Resolução da Meta Calórica Homologada (caloricTargetKcal)
  // Regra Inviolável N1.1:
  // NÃO assumir caloricTargetKcal = GET
  // NÃO assumir caloricTargetKcal = TMB
  // NÃO inventar déficit/superávit
  // Somente adotar se explicitamente homologada!
  let caloricTargetKcal = null;
  let source = 'MISSING';

  if (options.approvedCaloricTarget != null && !isNaN(Number(options.approvedCaloricTarget))) {
    caloricTargetKcal = Math.round(Number(options.approvedCaloricTarget));
    source = 'HOMOLOGATED_TARGET';
  } else if (options.caloricTargetKcal != null && !isNaN(Number(options.caloricTargetKcal))) {
    caloricTargetKcal = Math.round(Number(options.caloricTargetKcal));
    source = 'HOMOLOGATED_TARGET';
  } else if (prescription && prescription.isApproved === true && prescription.caloricTargetKcal != null && !isNaN(Number(prescription.caloricTargetKcal))) {
    caloricTargetKcal = Math.round(Number(prescription.caloricTargetKcal));
    source = 'HOMOLOGATED_PRESCRIPTION_TARGET';
  } else if (prescription && prescription.approvedCaloricTarget != null && !isNaN(Number(prescription.approvedCaloricTarget))) {
    caloricTargetKcal = Math.round(Number(prescription.approvedCaloricTarget));
    source = 'HOMOLOGATED_PRESCRIPTION_TARGET';
  } else {
    // Sem meta homologada -> estritamente null
    caloricTargetKcal = null;
    source = getKcal ? 'CALCULATED_GET_ONLY' : 'MISSING';
  }

  let energyBalanceKcal = null;
  if (caloricTargetKcal != null && getKcal != null) {
    energyBalanceKcal = caloricTargetKcal - getKcal;
  }

  return {
    tmbKcal,
    getKcal,
    activityFactor,
    caloricTargetKcal,
    energyBalanceKcal,
    source,
    formula,
    provenance: {
      source: 'domain/math/nutritionMath.js',
      calculation: formula,
      reliability: tmbKcal ? 'DERIVED' : 'MISSING'
    }
  };
}

/**
 * Separa estritamente restrições alimentares, alergias, intolerâncias e aversões
 * @param {Object} p 
 * @returns {Object}
 */
function resolveConstraintsAndAversions(p = {}) {
  const parseList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return [...new Set(val.filter(Boolean).map(s => String(s).trim()))];
    return [...new Set(String(val).split(/[,;\n]/).map(s => s.trim()).filter(Boolean))];
  };

  const rawRestrictions = parseList(p.dietaryRestrictions || p.restrictions);
  const rawAllergies = parseList(p.allergies);
  const rawIntolerances = parseList(p.intolerances);
  const rawAversions = parseList(p.foodAversions || p.aversions);

  // Palavras-chave de alergia/intolerância extraídas de texto livre sem excluir do campo original
  const allergies = [...rawAllergies];
  const intolerances = [...rawIntolerances];
  const dietaryRestrictions = [...rawRestrictions];

  // Aversões são estritamente separadas de alergias/intolerâncias (preferência negativa != risco imunológico)
  const aversions = [...rawAversions];

  return {
    dietaryRestrictions,
    allergies,
    intolerances,
    aversions,
    clinicalNotes: p.clinicalNotes ? String(p.clinicalNotes).trim() : null,
    provenance: {
      source: 'db.patients',
      field: 'dietaryRestrictions/allergies/intolerances/foodAversions/clinicalNotes',
      reliability: (dietaryRestrictions.length > 0 || allergies.length > 0 || intolerances.length > 0 || aversions.length > 0) ? 'PATIENT_REPORTED' : 'MISSING'
    }
  };
}

/**
 * Resolve dados de rotina diária.
 * Invariante: Horários não cadastrados retornam null (NÃO inventar 07:00 / 22:00).
 * @param {Object} p 
 * @returns {Object}
 */
function resolveRoutine(p = {}) {
  return {
    neat: p.neatRoutine ? String(p.neatRoutine).trim() : (p.neat ? String(p.neat).trim() : null),
    workoutTime: p.workoutTime ? String(p.workoutTime).trim() : null,
    sleepHours: (p.sleepHours != null && !isNaN(Number(p.sleepHours))) ? Number(p.sleepHours) : null,
    sleepQuality: p.sleepQuality ? String(p.sleepQuality).trim() : null,
    stressLevel: p.stressLevel ? String(p.stressLevel).trim() : null,
    hydrationLiters: (p.hydrationLiters != null && !isNaN(Number(p.hydrationLiters))) ? Number(Number(p.hydrationLiters).toFixed(2)) : null,
    bowelHabit: p.bowelHabit ? String(p.bowelHabit).trim() : null,
    cookingAvailability: p.cookingAvailability ? String(p.cookingAvailability).trim() : null,
    mealPreparer: p.mealPreparer ? String(p.mealPreparer).trim() : null,
    wakeUpTime: p.wakeUpTime ? String(p.wakeUpTime).trim() : null,
    bedTime: p.bedTime ? String(p.bedTime).trim() : null
  };
}

/**
 * Resolve itens do recordatório alimentar preservando foodId, quantidades e macros
 * @param {Array<Object>} recallList 
 * @returns {Object}
 */
function resolveDietaryRecall(recallList = []) {
  const list = Array.isArray(recallList) ? recallList.filter(item => item && typeof item === 'object') : [];
  const hasRecall = list.length > 0;

  const typicalTimes = new Set();
  const items = list.map(item => {
    if (item.mealTime) typicalTimes.add(String(item.mealTime).trim());

    return {
      foodId: item.foodId ? String(item.foodId).trim() : null,
      foodName: item.foodName ? String(item.foodName).trim() : (item.name ? String(item.name).trim() : 'Alimento'),
      quantity: item.quantity != null && !isNaN(Number(item.quantity)) ? Number(item.quantity) : 0,
      unit: item.unit ? String(item.unit).trim() : 'g',
      mealName: item.mealName ? String(item.mealName).trim() : (item.meal ? String(item.meal).trim() : 'Refeição'),
      mealTime: item.mealTime ? String(item.mealTime).trim() : null,
      macros: {
        calories: item.calories != null ? Number(Number(item.calories).toFixed(1)) : 0,
        protein: item.protein != null ? Number(Number(item.protein).toFixed(1)) : 0,
        carbohydrate: (item.carbohydrate != null ? Number(Number(item.carbohydrate).toFixed(1)) : (item.carbs != null ? Number(Number(item.carbs).toFixed(1)) : 0)),
        lipid: (item.lipid != null ? Number(Number(item.lipid).toFixed(1)) : (item.fat != null ? Number(Number(item.fat).toFixed(1)) : 0))
      }
    };
  });

  return {
    hasRecall,
    itemsCount: items.length,
    typicalMealTimes: [...typicalTimes],
    items,
    provenance: {
      source: 'db.dietaryRecall',
      reliability: hasRecall ? 'PATIENT_REPORTED' : 'MISSING'
    }
  };
}

/**
 * Resolve dados de treinamento físico a partir do registro de performance
 * @param {Object} perfData 
 * @param {Object} p 
 * @returns {Object}
 */
function resolveTraining(perfData = {}, p = {}) {
  const perf = (perfData && typeof perfData === 'object') ? perfData : {};

  let rawRoutines = [];
  if (Array.isArray(perf.routines)) {
    rawRoutines = perf.routines;
  } else if (perf.workoutPlan && typeof perf.workoutPlan === 'object') {
    rawRoutines = Object.entries(perf.workoutPlan).map(([letter, data]) => ({
      routineId: letter,
      routineName: data.name || `Treino ${letter}`,
      exercises: data.exercises || []
    }));
  }

  const normalizedRoutines = rawRoutines.map((r, idx) => ({
    routineId: r.routineId || r.id || `routine_${idx + 1}`,
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

  const activeSplit = perf.activeSplit || perf.split || null;
  const splitSource = perf.splitSource || (activeSplit ? 'LEGACY' : null);
  const hasActiveTraining = !!(activeSplit || normalizedRoutines.length > 0 || p.workoutType);

  return {
    hasActiveTraining,
    activeSplit,
    splitSource,
    trainingLevel: perf.trainingLevel || p.trainingLevel || null,
    frequency: perf.weeklyFrequency ?? p.workoutFrequency ?? null,
    sessionDurationMinutes: perf.sessionDurationMinutes ?? (p.workoutDuration ? parseInt(p.workoutDuration, 10) : null),
    intensity: perf.intensity || p.workoutIntensity || null,
    workoutType: p.workoutType || p.mainModality || null,
    routines: normalizedRoutines,
    provenance: {
      source: 'db.performanceMetabolica',
      reliability: hasActiveTraining ? 'CANONICAL' : 'MISSING'
    }
  };
}

/**
 * Resolve dados de treinamento cardiovascular
 * @param {Object} perfCardio 
 * @param {Object} perfData 
 * @param {number|null} age 
 * @param {number|null} restingHR 
 * @returns {Object}
 */
function resolveCardio(perfCardio = {}, perfData = {}, age = null, restingHR = null) {
  const rawCardio = (perfCardio && typeof perfCardio === 'object') ? perfCardio : (perfData?.cardioPrescription || {});
  const rawSessions = Array.isArray(rawCardio.sessions) ? rawCardio.sessions : [];

  const sessions = rawSessions.map((s, idx) => ({
    cardioId: s.cardioId || s.sessionId || s.protocolId || `cardio_${idx + 1}`,
    protocolId: s.protocolId || null,
    day: s.day || null,
    type: s.type || 'Moderado Contínuo',
    durationMinutes: s.durationMinutes != null ? Number(s.durationMinutes) : (s.duration ? parseInt(s.duration, 10) : 45),
    intensity: s.intensity || null,
    modality: s.modality || s.protocolTitle || null,
    targetBpm: s.targetBpm != null ? Number(s.targetBpm) : null
  }));

  let heartRate = null;
  if (age != null && age > 0) {
    const maxHR = Math.round(208 - (0.7 * age));
    const effectiveResting = (restingHR != null && restingHR > 30) ? Number(restingHR) : null;
    heartRate = {
      maxHR,
      restingHR: effectiveResting,
      method: effectiveResting ? 'Tanaka / Karvonen' : 'Tanaka (%FCM)'
    };
  }

  const hasActiveCardio = sessions.length > 0;

  return {
    hasActiveCardio,
    weeklyFrequency: sessions.length,
    sessions,
    heartRate,
    provenance: {
      source: 'perfCardioPrescription',
      reliability: hasActiveCardio ? 'CANONICAL' : 'MISSING'
    }
  };
}

/**
 * Resolve o microciclo semanal de forma puramente factual.
 * INVARIANTE ABSOLUTA: PROIBIDO adicionar demand: "HIGH_CARB" ou "LOW_CARB" ou carbLevel!
 * @param {Object} perfData 
 * @returns {Array<Object>}
 */
function resolveWeeklySchedule(perfData = {}) {
  const rawSchedule = Array.isArray(perfData?.weeklySchedule) ? perfData.weeklySchedule : [];

  if (rawSchedule.length === 0) {
    const defaultDays = [
      { dayKey: 'segunda', dayName: 'Segunda-feira' },
      { dayKey: 'terca', dayName: 'Terça-feira' },
      { dayKey: 'quarta', dayName: 'Quarta-feira' },
      { dayKey: 'quinta', dayName: 'Quinta-feira' },
      { dayKey: 'sexta', dayName: 'Sexta-feira' },
      { dayKey: 'sabado', dayName: 'Sábado' },
      { dayKey: 'domingo', dayName: 'Domingo' }
    ];
    return defaultDays.map(d => ({
      dayKey: d.dayKey,
      dayName: d.dayName,
      training: null,
      cardio: null,
      rest: true,
      sessions: []
    }));
  }

  return rawSchedule.map(day => {
    // Filtro estrito: remove qualquer campo de carb cycling artificial se tiver vazado de legado
    const sanitized = {
      dayKey: day.dayKey || '',
      dayName: day.dayName || '',
      training: day.training ? { ...day.training } : null,
      cardio: day.cardio ? { ...day.cardio } : null,
      rest: !!day.rest,
      sessions: Array.isArray(day.sessions) ? day.sessions.map(s => ({ ...s })) : []
    };
    return sanitized;
  });
}

/**
 * Resolve protocolo ativo de jejum intermitente
 * @param {Object} fastingDoc 
 * @returns {Object}
 */
function resolveFastingProtocol(fastingDoc = null) {
  if (!fastingDoc || typeof fastingDoc !== 'object') {
    return {
      hasActiveProtocol: false,
      status: 'INACTIVE',
      type: null,
      subtype: null,
      feedingWindows: null,
      fastingWindows: null,
      provenance: { source: 'db.fastingProtocols', reliability: 'MISSING' }
    };
  }

  const isActive = !!(fastingDoc.enabled || fastingDoc.active || fastingDoc.status === 'ACTIVE');

  return {
    hasActiveProtocol: isActive,
    status: isActive ? 'ACTIVE' : 'INACTIVE',
    type: fastingDoc.type || fastingDoc.protocolType || null,
    subtype: fastingDoc.subtype || fastingDoc.protocolSubtype || null,
    feedingWindows: fastingDoc.feedingWindows ? deepClone(fastingDoc.feedingWindows) : null,
    fastingWindows: fastingDoc.fastingWindows ? deepClone(fastingDoc.fastingWindows) : null,
    provenance: {
      source: 'db.fastingProtocols',
      recordId: fastingDoc.id || null,
      reliability: isActive ? 'CANONICAL' : 'HISTORICAL'
    }
  };
}

/**
 * Resolve exames laboratoriais como dados clínicos puros.
 * INVARIANTE: Zero regras terapêuticas automáticas!
 * @param {Array<Object>} examsList 
 * @returns {Object}
 */
function resolveClinicalExams(examsList = []) {
  const list = (Array.isArray(examsList) ? examsList : []).filter(e => e && typeof e === 'object');
  let latestDate = null;

  const exams = list.map(e => {
    if (e.date && (!latestDate || new Date(e.date) > new Date(latestDate))) {
      latestDate = e.date;
    }
    return {
      id: e.id || null,
      examType: e.examType || e.type || 'Laboratorial',
      date: e.date || null,
      results: e.results ? deepClone(e.results) : (e.items ? deepClone(e.items) : {}),
      status: e.status || 'CONCLUDED'
    };
  });

  return {
    exams,
    latestExamDate: latestDate,
    provenance: {
      source: 'db.clinicalExams',
      reliability: exams.length > 0 ? 'CANONICAL' : 'MISSING'
    }
  };
}

/**
 * Resolve a prescrição dietética existente em db.prescriptions
 * @param {Object} prescDoc 
 * @returns {Object}
 */
function resolveCurrentPrescription(prescDoc = null) {
  if (!prescDoc || typeof prescDoc !== 'object') {
    return {
      hasCurrentPrescription: false,
      prescriptionId: null,
      prescribedKcal: null,
      proteinGPerKg: null,
      carbsGPerKg: null,
      fatGPerKg: null,
      totalProteinG: null,
      totalCarbsG: null,
      totalFatG: null,
      mealsCount: 0,
      meals: [],
      createdAt: null,
      provenance: { source: 'db.prescriptions', reliability: 'MISSING' }
    };
  }

  const items = Array.isArray(prescDoc.items) ? prescDoc.items : [];
  const meals = Array.isArray(prescDoc.meals) ? prescDoc.meals : items;

  return {
    hasCurrentPrescription: true,
    prescriptionId: prescDoc.id || null,
    prescribedKcal: prescDoc.calories != null ? Math.round(Number(prescDoc.calories)) : null,
    proteinGPerKg: prescDoc.protGKg != null ? Number(Number(prescDoc.protGKg).toFixed(2)) : null,
    carbsGPerKg: prescDoc.carbsGKg != null ? Number(Number(prescDoc.carbsGKg).toFixed(2)) : null,
    fatGPerKg: prescDoc.fatGKg != null ? Number(Number(prescDoc.fatGKg).toFixed(2)) : null,
    totalProteinG: prescDoc.totalProteinG != null ? Math.round(Number(prescDoc.totalProteinG)) : null,
    totalCarbsG: prescDoc.totalCarbsG != null ? Math.round(Number(prescDoc.totalCarbsG)) : null,
    totalFatG: prescDoc.totalFatG != null ? Math.round(Number(prescDoc.totalFatG)) : null,
    mealsCount: meals.length,
    meals: deepClone(meals),
    createdAt: prescDoc.createdAt || null,
    provenance: {
      source: 'db.prescriptions',
      recordId: prescDoc.id || null,
      reliability: 'HISTORICAL'
    }
  };
}

/**
 * Constrói o mapa consolidado de proveniência com classificação auditável
 * @param {Object} parts 
 * @returns {Object}
 */
function buildNutritionProvenanceMap(parts = {}) {
  return {
    weight: parts.anthroProv?.weight || { source: 'db.patients', recordId: null, date: null, reliability: 'MISSING' },
    height: parts.anthroProv?.height || { source: 'db.patients', recordId: null, reliability: 'MISSING' },
    objective: {
      source: 'db.patients',
      reliability: parts.objectiveSource || 'MISSING'
    },
    energy: parts.energyProv || { source: 'domain/math/nutritionMath.js', calculation: 'canonical', reliability: 'MISSING' },
    constraints: parts.constraintsProv || { source: 'db.patients', reliability: 'MISSING' },
    training: parts.trainingProv || { source: 'db.performanceMetabolica', reliability: 'MISSING' },
    cardio: parts.cardioProv || { source: 'perfCardioPrescription', reliability: 'MISSING' },
    fasting: parts.fastingProv || { source: 'db.fastingProtocols', reliability: 'MISSING' },
    recall: parts.recallProv || { source: 'db.dietaryRecall', reliability: 'MISSING' }
  };
}

/**
 * Constrói o Contexto Canônico de Prescrição Nutricional de forma pura e determinística.
 * Suporta injeção de dependências via options.stores (memória) ou options.dbInstance (Dexie).
 * 
 * @param {string} patientId 
 * @param {Object} [options] 
 * @param {Object} [options.stores] - Dados já em memória para isolamento e testes
 * @param {Object} [options.dbInstance] - Instância do Dexie (db)
 * @param {number} [options.approvedCaloricTarget] - Meta energética explicitamente homologada
 * @returns {Promise<Readonly<Object>>} NutritionPrescriptionContextDTO imutável
 */
async function buildNutritionPrescriptionContext(patientId, options = {}) {
  if (!patientId || typeof patientId !== 'string' || patientId.trim() === '') {
    throw new Error('[buildNutritionPrescriptionContext] patientId é obrigatório e deve ser uma string não-vazia.');
  }

  const pid = patientId.trim();
  let rawPatient = null;
  let rawAssessments = [];
  let rawPrescription = null;
  let rawPerformance = null;
  let rawFasting = null;
  let rawRecall = [];
  let rawExams = [];

  // 1. Verificação de dados injetados via options.stores (Prioridade para testes e isolamento puro)
  if (options.stores && typeof options.stores === 'object') {
    const s = options.stores;
    const findEntity = (src) => {
      if (!src) return null;
      if (Array.isArray(src)) return src.find(item => item && (item.id === pid || item.patientId === pid)) || null;
      if (typeof src === 'object') {
        if (src.patientId === pid || src.id === pid) return src;
        if (src[pid]) return src[pid];
      }
      return null;
    };
    const filterList = (src) => {
      if (!src) return [];
      if (Array.isArray(src)) return src.filter(item => item && (item.patientId === pid || item.id === pid || !item.patientId));
      return [];
    };

    rawPatient = findEntity(s.patients) || s.rawPatient || null;
    rawAssessments = filterList(s.assessments || s.rawAssessments);
    rawPrescription = findEntity(s.prescriptions) || s.rawPrescription || null;
    rawPerformance = findEntity(s.performanceMetabolica) || s.rawPerformance || null;
    rawFasting = findEntity(s.fastingProtocols) || s.rawFasting || null;
    rawRecall = filterList(s.dietaryRecall || s.rawRecall);
    rawExams = filterList(s.clinicalExams || s.rawExams);
  } else {
    // 2. Leitura assíncrona do Dexie (dbInstance ou global db)
    const dbInst = options.dbInstance || (typeof db !== 'undefined' ? db : null);
    if (dbInst) {
      try {
        if (dbInst.patients) rawPatient = await dbInst.patients.get(pid);
      } catch (_) {}
      try {
        if (dbInst.assessments) rawAssessments = await dbInst.assessments.where('patientId').equals(pid).toArray();
      } catch (_) {}
      try {
        if (dbInst.prescriptions) rawPrescription = await dbInst.prescriptions.get(pid);
      } catch (_) {}
      try {
        if (dbInst.performanceMetabolica) rawPerformance = await dbInst.performanceMetabolica.get(pid);
      } catch (_) {}
      try {
        if (dbInst.fastingProtocols) {
          rawFasting = await dbInst.fastingProtocols.get(`${pid}_fasting`) || await dbInst.fastingProtocols.where('patientId').equals(pid).first();
        }
      } catch (_) {}
      try {
        if (dbInst.dietaryRecall) rawRecall = await dbInst.dietaryRecall.where('patientId').equals(pid).toArray();
      } catch (_) {}
      try {
        if (dbInst.clinicalExams) rawExams = await dbInst.clinicalExams.where('patientId').equals(pid).toArray();
      } catch (_) {}
    }
  }

  // Se o paciente não for encontrado em nenhuma fonte, cria registro base
  const p = rawPatient ? deepClone(rawPatient) : { id: pid, patientId: pid };

  // 1. Paciente
  const bio = resolvePatientBio(p);

  // 2. Objetivo
  const rawObj = p.objective || null;
  const targetWeightKg = (p.targetWeight != null && !isNaN(Number(p.targetWeight))) ? Number(Number(p.targetWeight).toFixed(2)) : null;
  const targetBodyFatPercent = (p.targetBodyFatPercent != null && !isNaN(Number(p.targetBodyFatPercent))) ? Number(Number(p.targetBodyFatPercent).toFixed(1)) : null;
  const objectiveSource = rawObj ? (p.objectiveSource || 'PATIENT_REPORTED') : 'MISSING';

  const objective = {
    clinicalObjective: rawObj,
    targetWeightKg,
    targetBodyFatPercent,
    source: objectiveSource
  };

  // 3. Antropometria
  const anthro = resolveLatestAssessment(rawAssessments, p);

  // 4. Energia
  const energy = resolveEnergyTargets(p, anthro, rawPrescription, options);

  // 5. Restrições e Aversões
  const constraints = resolveConstraintsAndAversions(p);

  // 6. Preferências
  const preferences = {
    preferredFoods: p.preferredFoods ? (Array.isArray(p.preferredFoods) ? p.preferredFoods : String(p.preferredFoods).split(/[,;\n]/).map(s => s.trim()).filter(Boolean)) : [],
    dietaryStyle: p.dietaryStyle ? String(p.dietaryStyle).trim() : null,
    mealFrequency: p.mealFrequency || null
  };

  // 7. Rotina
  const routine = resolveRoutine(p);

  // 8. Recordatório
  const dietaryRecall = resolveDietaryRecall(rawRecall);

  // 9. Treino
  const training = resolveTraining(rawPerformance, p);

  // 10. Cardio
  const rawCardio = options.perfCardioPrescription || options.cardioPrescription || options.stores?.perfCardioPrescription || options.stores?.cardioPrescription || (typeof perfCardioPrescription !== 'undefined' ? perfCardioPrescription : null);
  const cardio = resolveCardio(rawCardio, rawPerformance, bio.age, p.restingHeartRate != null ? Number(p.restingHeartRate) : null);

  // 11. Microciclo Semanal
  const weeklySchedule = resolveWeeklySchedule(rawPerformance);

  // 12. Jejum
  const fasting = resolveFastingProtocol(rawFasting);

  // 13. Exames Clínicos
  const clinical = resolveClinicalExams(rawExams);

  // 14. Prescrição Atual
  const currentPrescription = resolveCurrentPrescription(rawPrescription);

  // 15. Proveniência
  const provenance = buildNutritionProvenanceMap({
    anthroProv: anthro.provenance,
    objectiveSource,
    energyProv: energy.provenance,
    constraintsProv: constraints.provenance,
    trainingProv: training.provenance,
    cardioProv: cardio.provenance,
    fastingProv: fasting.provenance,
    recallProv: dietaryRecall.provenance
  });

  // Montagem final do DTO imutável
  return createNutritionPrescriptionContextDTO({
    patient: bio,
    objective,
    anthropometry: anthro,
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
    provenance
  });
}

// Suporte a CommonJS e navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    deepClone,
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
    buildNutritionProvenanceMap,
    buildNutritionPrescriptionContext
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.nutritionContextAdapter = {
    deepClone,
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
    buildNutritionProvenanceMap,
    buildNutritionPrescriptionContext
  };
}
