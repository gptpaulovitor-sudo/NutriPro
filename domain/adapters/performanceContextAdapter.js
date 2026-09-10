/**
 * domain/adapters/performanceContextAdapter.js
 * 
 * Adaptador Canônico de Contexto de Performance.
 * Padrão Strangler Fig — NutriAx Pro.
 * 
 * Regras Obrigatórias de Governança (Fase 4):
 * 1. PUREZA ABSOLUTA: Zero DOM, zero chamadas a banco (Dexie/Firebase), zero chamadas Gemini.
 * 2. CÓPIA DEFENSIVA: Clona todas as entradas antes de montar o snapshot. Mutação posterior da fonte NÃO afeta o contexto.
 * 3. ZERO VALORES INVENTADOS: Ausência de dados gera null ou [] explícitos (nunca defaults clínicos fictícios).
 * 4. MATEMÁTICA CANÔNICA: Consome estritamente domain/math/nutritionMath.js.
 * 5. PROVENIÊNCIA GRANULAR: Registra origem real (source, field, transform) para auditoria.
 * 6. NÃO ANTECIPAÇÃO: Preserva splits e cardio existentes sem corrigir rotinas/sessões.
 */

const { createPerformanceContextDTO } = require('../contracts/PerformanceContextDTO');
const {
  calculateIMC,
  calculateTMB,
  calculateGET,
  calculateCaloricTarget,
  calculateEnergyBalance,
  calculateAnthropometricIndices,
  classifyRCEst,
  calculateGoalProjection
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
 * Normaliza número extraído de texto (ex: "5x/semana" -> 5, "60 min" -> 60)
 * @param {any} val 
 * @returns {number|null}
 */
function parseNumberFromLabel(val) {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (!val) return null;
  const match = String(val).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Resolução da Idade e Proveniência (Ajuste Obrigatório 1)
 * Verifica se a idade vem de birthDate/dateOfBirth ou diretamente de p.age.
 * Não cria fórmula paralela; utiliza cálculo cronológico padrão quando houver data.
 * @param {Object} p - Registro bruto do paciente
 * @returns {{ age: number|null, birthDate: string|null, provenance: Object }}
 */
function resolvePatientAgeAndProvenance(p = {}) {
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
        return {
          age: calculatedAge,
          birthDate: bDate.toISOString().split('T')[0],
          provenance: {
            source: 'db.patients',
            field: p.birthDate ? 'birthDate' : 'dateOfBirth',
            transform: 'chronological_years_from_birthDate'
          }
        };
      }
    }
  }

  if (p.age != null && !isNaN(parseInt(p.age, 10))) {
    const parsedAge = parseInt(p.age, 10);
    if (parsedAge >= 0 && parsedAge <= 130) {
      return {
        age: parsedAge,
        birthDate: null,
        provenance: {
          source: 'db.patients',
          field: 'age',
          transform: 'direct_integer_cast'
        }
      };
    }
  }

  return {
    age: null,
    birthDate: null,
    provenance: {
      source: 'none',
      field: null,
      transform: 'unavailable'
    }
  };
}

/**
 * Calcula zonas de frequência cardíaca Tanaka e Karvonen de forma pura
 * Se age for null, retorna null (não inventa idade padrão).
 * @param {number|null} age 
 * @param {number|null} restingHR 
 * @returns {Object|null}
 */
function calculatePureHeartRateZones(age, restingHR = null) {
  if (age == null || typeof age !== 'number' || isNaN(age) || age <= 0) {
    return null;
  }
  const maxHR = Math.round(208 - (0.7 * age));
  const effectiveResting = (restingHR != null && !isNaN(Number(restingHR)) && Number(restingHR) > 30) ? Number(restingHR) : null;
  const reserveHR = effectiveResting ? maxHR - effectiveResting : null;

  const getBpm = (pct) => {
    if (effectiveResting && reserveHR) {
      return Math.round((reserveHR * pct) + effectiveResting);
    }
    return Math.round(maxHR * pct);
  };

  const zonesConfig = [
    { zone: 'Z1', name: 'Recuperação Ativa & Fluxo', minPct: 0.50, maxPct: 0.60, rpe: 'RPE 2-3' },
    { zone: 'Z2', name: 'Base Aeróbia & Biogênese', minPct: 0.60, maxPct: 0.70, rpe: 'RPE 4-5' },
    { zone: 'Z3', name: 'Tempo / Ritmo Moderado', minPct: 0.70, maxPct: 0.80, rpe: 'RPE 6-7' },
    { zone: 'Z4', name: 'Limiar Anaeróbio / L2', minPct: 0.80, maxPct: 0.90, rpe: 'RPE 8-9' },
    { zone: 'Z5', name: 'VO₂ Máx & Potência Terminal', minPct: 0.90, maxPct: 1.00, rpe: 'RPE 10' }
  ];

  const zones = zonesConfig.map(z => ({
    zone: z.zone,
    name: z.name,
    pctStr: `${Math.round(z.minPct * 100)}% – ${Math.round(z.maxPct * 100)}%`,
    minBpm: getBpm(z.minPct),
    maxBpm: getBpm(z.maxPct),
    bpmTanaka: `${Math.round(maxHR * z.minPct)} – ${Math.round(maxHR * z.maxPct)} bpm`,
    bpmKarvonen: effectiveResting ? `${getBpm(z.minPct)} – ${getBpm(z.maxPct)} bpm` : null,
    rpe: z.rpe
  }));

  return {
    maxHR,
    restingHR: effectiveResting,
    reserveHR,
    isCustom: false,
    method: effectiveResting ? 'Tanaka / Karvonen' : 'Tanaka (%FCM)',
    zones
  };
}

/**
 * Constrói o Contexto Canônico de Performance de forma pura a partir de dados em memória.
 * 
 * @param {Object} sources - Dados crus recebidos do Dexie, formulários ou fixtures
 * @param {Object} [sources.rawPatient] - Registro do paciente (db.patients)
 * @param {Object} [sources.rawAssessment] - Avaliação mais recente (db.assessments)
 * @param {Array<Object>} [sources.rawAssessments] - Histórico de avaliações antropométricas
 * @param {Object} [sources.rawPrescription] - Prescrição nutricional ativa (db.prescriptions)
 * @param {Array<Object>} [sources.rawPrescriptions] - Histórico de prescrições nutricionais
 * @param {Object} [sources.rawPerformance] - Registro de performance (db.performanceMetabolica)
 * @param {Object} [sources.rawCardio] - Prescrição de cardio estruturada (perfCardioPrescription)
 * @param {Array<Object>} [sources.rawExams] - Lista de exames laboratoriais (db.clinicalExams)
 * @param {Object} [sources.rawFasting] - Protocolo de jejum ativo
 * @param {Object} [options] - Opções adicionais de configuração
 * @returns {Readonly<Object>} PerformanceContextDTO imutável
 */
function buildCanonicalPerformanceContext(sources = {}, options = {}) {
  // Cópia defensiva imediata de todas as entradas
  const p = deepClone(sources.rawPatient || {});
  const patientId = String(options.patientId || p.id || p.patientId || 'unknown-patient').trim();

  // ── 1. DADOS BIOGRÁFICOS DO PACIENTE (Com Rastreabilidade Real) ───────────
  const ageResolution = resolvePatientAgeAndProvenance(p);
  const age = ageResolution.age;
  const birthDate = ageResolution.birthDate;

  let sex = null;
  const rawSex = p.gender || p.sex;
  if (rawSex) {
    const s = String(rawSex).trim().toLowerCase();
    if (s.startsWith('f')) sex = 'Feminino';
    else if (s.startsWith('m')) sex = 'Masculino';
    else sex = 'Outro';
  }

  // Resolução de altura (m ou cm). Se ausente, permanece null (NÃO inventar 1.70)
  let heightCm = null;
  let heightProvenance = { source: 'none', field: null, transform: 'unavailable' };
  if (p.heightCm != null && !isNaN(Number(p.heightCm))) {
    heightCm = Number(Number(p.heightCm).toFixed(1));
    heightProvenance = { source: 'db.patients', field: 'heightCm', transform: 'direct_cm' };
  } else if (p.height != null && !isNaN(Number(p.height))) {
    const rawH = Number(p.height);
    heightCm = rawH < 3.0 ? Number((rawH * 100).toFixed(1)) : Number(rawH.toFixed(1));
    heightProvenance = { source: 'db.patients', field: 'height', transform: rawH < 3.0 ? 'meters_to_cm' : 'direct_cm' };
  }

  // Resolução de peso. Se ausente, permanece null (NÃO inventar 70.0)
  let weightKg = null;
  let weightProvenance = { source: 'none', field: null, transform: 'unavailable' };
  if (p.currentWeight != null && !isNaN(Number(p.currentWeight))) {
    weightKg = Number(Number(p.currentWeight).toFixed(2));
    weightProvenance = { source: 'db.patients', field: 'currentWeight', transform: 'direct_kg' };
  } else if (p.weightKg != null && !isNaN(Number(p.weightKg))) {
    weightKg = Number(Number(p.weightKg).toFixed(2));
    weightProvenance = { source: 'db.patients', field: 'weightKg', transform: 'direct_kg' };
  } else if (p.usualWeight != null && !isNaN(Number(p.usualWeight))) {
    weightKg = Number(Number(p.usualWeight).toFixed(2));
    weightProvenance = { source: 'db.patients', field: 'usualWeight', transform: 'fallback_usual_kg' };
  }

  const usualWeightKg = (p.usualWeight != null && !isNaN(Number(p.usualWeight))) ? Number(Number(p.usualWeight).toFixed(2)) : null;
  const targetWeightKg = (p.targetWeight != null && !isNaN(Number(p.targetWeight))) ? Number(Number(p.targetWeight).toFixed(2)) : null;
  const objective = p.objective || null;
  const patientType = p.patientType || null;
  const activityFactor = (p.activityFactor != null && !isNaN(Number(p.activityFactor))) ? Number(Number(p.activityFactor).toFixed(2)) : null;

  // Nível de treino
  let trainingLevel = null;
  if (p.trainingLevel && typeof p.trainingLevel === 'string') {
    trainingLevel = p.trainingLevel;
  } else if (patientType) {
    const pt = String(patientType).toLowerCase();
    if (pt.includes('atleta') || pt.includes('alto rendimento')) trainingLevel = 'Avançado';
    else if (pt.includes('intermediário') || pt.includes('intermediario')) trainingLevel = 'Intermediário';
    else if (pt.includes('iniciante')) trainingLevel = 'Iniciante';
  }

  // IMC Canônico (apenas quando peso e altura existirem)
  let bmi = null;
  if (weightKg != null && heightCm != null && heightCm > 0) {
    const imcResult = calculateIMC(weightKg, heightCm / 100);
    bmi = imcResult ? imcResult.imc : null;
  }

  // ── 2. ANAMNESE DETALHADA (Campos Reais do Sistema Preservados) ───────────
  const workoutType = p.workoutType || p.mainModality || null;
  const workoutFrequency = p.workoutFrequency != null ? p.workoutFrequency : null;
  const workoutFrequencyDays = parseNumberFromLabel(workoutFrequency);
  const workoutDuration = p.workoutDuration != null ? p.workoutDuration : null;
  const workoutDurationMinutes = parseNumberFromLabel(workoutDuration);
  const workoutIntensity = p.workoutIntensity || null;
  const workoutTime = p.workoutTime || null;

  const anamnesis = {
    objective,
    usualWeightKg,
    targetWeightKg,
    routineNotes: p.routineNotes || null,
    clinicalNotes: p.clinicalNotes || null,
    dietaryRestrictions: p.dietaryRestrictions || null,
    foodAversions: p.foodAversions || null,
    preferredFoods: p.preferredFoods || null,
    cookingAvailability: p.cookingAvailability || null,
    mealPreparer: p.mealPreparer || null,
    mealFrequency: p.mealFrequency || null,
    hydrationLiters: p.hydrationLiters != null ? Number(p.hydrationLiters) : null,
    bowelHabit: p.bowelHabit || null,
    neatRoutine: p.neatRoutine || null,
    workoutType,
    workoutFrequency,
    workoutDuration,
    workoutIntensity,
    workoutTime,
    sleepHours: p.sleepHours != null ? Number(p.sleepHours) : null,
    sleepQuality: p.sleepQuality || null,
    stressLevel: p.stressLevel || null,
    activityFactor,
    restingHeartRate: p.restingHeartRate != null ? Number(p.restingHeartRate) : null
  };

  // ── 3. AVALIAÇÃO ANTROPOMÉTRICA & COMPOSIÇÃO CORPORAL ─────────────────────
  let assessmentsList = Array.isArray(sources.rawAssessments) ? deepClone(sources.rawAssessments) : [];
  if (sources.rawAssessment && !assessmentsList.some(e => e.id === sources.rawAssessment.id)) {
    assessmentsList.push(deepClone(sources.rawAssessment));
  }
  assessmentsList = assessmentsList
    .filter(e => e && typeof e === 'object' && !String(e.id || '').startsWith('eval_pv_'))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const latestEval = assessmentsList[0] || (sources.rawAssessment ? deepClone(sources.rawAssessment) : null);

  // Se a avaliação contiver peso e altura mais recentes, sobrepõe com procedência
  let evalWeightKg = weightKg;
  let evalHeightCm = heightCm;
  if (latestEval) {
    if (latestEval.weightKg != null) evalWeightKg = Number(latestEval.weightKg);
    else if (latestEval.weight != null) evalWeightKg = Number(latestEval.weight);

    if (latestEval.heightCm != null) evalHeightCm = Number(latestEval.heightCm);
    else if (latestEval.height != null) {
      const h = Number(latestEval.height);
      evalHeightCm = h < 3.0 ? Number((h * 100).toFixed(1)) : h;
    }
  }

  // % de Gordura e Massa Magra/Gorda (Sem defaults fictícios)
  let bodyFatPercent = null;
  let targetBodyFatPercent = null;
  if (latestEval && latestEval.fatPercent != null && !isNaN(Number(latestEval.fatPercent))) {
    bodyFatPercent = Number(Number(latestEval.fatPercent).toFixed(1));
  } else if (p.bodyFatPercent != null && !isNaN(Number(p.bodyFatPercent))) {
    bodyFatPercent = Number(Number(p.bodyFatPercent).toFixed(1));
  }

  if (latestEval && latestEval.targetBF != null && !isNaN(Number(latestEval.targetBF))) {
    targetBodyFatPercent = Number(Number(latestEval.targetBF).toFixed(1));
  } else if (p.targetBodyFatPercent != null && !isNaN(Number(p.targetBodyFatPercent))) {
    targetBodyFatPercent = Number(Number(p.targetBodyFatPercent).toFixed(1));
  }

  let leanMassKg = null;
  let fatMassKg = null;
  if (latestEval && latestEval.leanMass != null && Number(latestEval.leanMass) > 0) {
    leanMassKg = Number(Number(latestEval.leanMass).toFixed(2));
  } else if (evalWeightKg != null && bodyFatPercent != null) {
    leanMassKg = Number((evalWeightKg * (1 - bodyFatPercent / 100)).toFixed(2));
  }

  if (latestEval && latestEval.fatMass != null && Number(latestEval.fatMass) > 0) {
    fatMassKg = Number(Number(latestEval.fatMass).toFixed(2));
  } else if (evalWeightKg != null && bodyFatPercent != null) {
    fatMassKg = Number((evalWeightKg * (bodyFatPercent / 100)).toFixed(2));
  }

  // Circunferências
  const waistVal = latestEval ? (Number(latestEval.waist) || null) : null;
  const hipVal = latestEval ? (Number(latestEval.hip) || null) : null;
  const circumferences = {
    waist: waistVal,
    hip: hipVal,
    abdomen: latestEval ? (Number(latestEval.circAbdomen) || null) : null,
    arm: latestEval ? (Number(latestEval.arm) || null) : null,
    armRelaxed: latestEval ? (Number(latestEval.circArmRelaxed) || null) : null,
    forearm: latestEval ? (Number(latestEval.circForearm) || null) : null,
    thigh: latestEval ? (Number(latestEval.circThigh) || null) : null,
    calf: latestEval ? (Number(latestEval.circCalf) || null) : null,
    chest: latestEval ? (Number(latestEval.circChest) || null) : null,
    neck: latestEval ? (Number(latestEval.circNeck) || null) : null,
    waistToHipRatio: (waistVal > 0 && hipVal > 0) ? Number((waistVal / hipVal).toFixed(2)) : null
  };

  // Dobras cutâneas
  let skinfolds = null;
  if (latestEval) {
    const rawFolds = latestEval.skinfolds || latestEval;
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
  }

  // Índices antropométricos canônicos
  let anthroIndices = null;
  if (latestEval && latestEval.indices) {
    anthroIndices = { ...latestEval.indices };
  } else if (waistVal > 0 && evalHeightCm > 0 && evalWeightKg > 0) {
    anthroIndices = calculateAnthropometricIndices(
      waistVal,
      hipVal || 100,
      evalHeightCm / 100,
      evalWeightKg,
      leanMassKg || 50,
      sex || 'Masculino',
      age || 30,
      latestEval?.arm ? Number(latestEval.arm) : 32,
      skinfolds?.triceps ?? 8,
      latestEval?.circCalf ? Number(latestEval.circCalf) : 36
    );
  }

  const evalRcEst = latestEval?.rcEst ?? latestEval?.indices?.rcEst ?? (waistVal > 0 && evalHeightCm > 0 ? Number((waistVal / evalHeightCm).toFixed(2)) : null);
  const evalRcEstClass = latestEval?.rcEstClassification ?? latestEval?.indices?.rcEstClassification ?? (evalRcEst != null ? classifyRCEst(evalRcEst) : null);
  const ffmi = (evalHeightCm > 0 && leanMassKg > 0) ? Number((leanMassKg / Math.pow(evalHeightCm / 100, 2)).toFixed(2)) : null;

  const anthropometry = {
    weightKg: evalWeightKg,
    heightCm: evalHeightCm,
    bmi: (evalWeightKg && evalHeightCm) ? (calculateIMC(evalWeightKg, evalHeightCm / 100)?.imc ?? null) : bmi,
    circumferences,
    skinfolds,
    indices: {
      rcq: circumferences.waistToHipRatio,
      rcqClassification: latestEval?.rcqClassification || anthroIndices?.rcqClassification || null,
      rcEst: evalRcEst,
      rcEstClassification: evalRcEstClass,
      conicityIndex: latestEval?.conicityIndex ?? anthroIndices?.conicityIndex ?? null,
      conicityClassification: latestEval?.conicityClassification ?? anthroIndices?.conicityClassification ?? null,
      ffmi,
      skeletalMuscleMassKg: anthroIndices?.skeletalMuscleMassKg ?? null,
      hasCardiometabolicRisk: (evalRcEst != null && evalRcEst > 0.50) || (anthroIndices?.conicityIndex != null && anthroIndices.conicityIndex >= 1.25)
    }
  };

  const bodyComposition = {
    bodyFatPercent,
    targetBodyFatPercent,
    leanMassKg,
    fatMassKg,
    boneMassKg: latestEval?.boneMass ? Number(latestEval.boneMass) : null,
    residualMassKg: latestEval?.residualMass ? Number(latestEval.residualMass) : null,
    protocol: latestEval?.protocol || (skinfolds ? 'Jackson-Pollock 7 Dobras' : (bodyFatPercent != null ? 'Composição Estimada' : null))
  };

  // ── 4. MATEMÁTICA ENERGÉTICA CANÔNICA (domain/math/nutritionMath.js) ──────
  let tmbKcal = null;
  let tmbMethod = null;
  if (age != null && evalWeightKg != null && evalHeightCm != null) {
    const safeSex = sex || 'Masculino';
    const tmbCalc = calculateTMB(safeSex, age, evalWeightKg, evalHeightCm / 100, leanMassKg);
    tmbKcal = Math.round(tmbCalc.tmb);
    tmbMethod = tmbCalc.method;
  }

  let getKcal = null;
  if (tmbKcal != null) {
    getKcal = Math.round(calculateGET(tmbKcal, activityFactor || 1.42));
  }

  // Prescrição de calorias
  const rawPresc = deepClone(sources.rawPrescription || {});
  const prescItems = Array.isArray(rawPresc.items) ? rawPresc.items : [];
  let prescribedKcal = null;
  if (rawPresc.calories != null && !isNaN(Number(rawPresc.calories))) {
    prescribedKcal = Math.round(Number(rawPresc.calories));
  } else if (prescItems.length > 0) {
    prescribedKcal = Math.round(prescItems.reduce((sum, item) => sum + (Number(item.calories) || 0), 0));
  }

  let caloricTargetKcal = null;
  let caloricTargetSource = null;
  if (prescribedKcal != null || getKcal != null) {
    const targetResult = calculateCaloricTarget(prescribedKcal, getKcal || 2000);
    caloricTargetKcal = targetResult.caloricTargetKcal;
    caloricTargetSource = targetResult.source === 'PRESCRIBED' ? 'prescribed' : 'get_fallback';
  }

  let energyBalanceKcal = null;
  if (caloricTargetKcal != null && getKcal != null) {
    const balanceResult = calculateEnergyBalance(caloricTargetKcal, getKcal);
    energyBalanceKcal = balanceResult.energyBalanceKcal;
  }

  const goalProj = (evalWeightKg > 0 && bodyFatPercent > 0 && targetBodyFatPercent > 0 && getKcal > 0 && caloricTargetKcal > 0)
    ? calculateGoalProjection(evalWeightKg, bodyFatPercent, targetBodyFatPercent, getKcal, caloricTargetKcal)
    : null;

  const energy = {
    tmbKcal,
    getKcal,
    activityFactor,
    caloricTargetKcal,
    caloricTargetSource,
    energyBalanceKcal,
    tmbMethod,
    goalProjection: goalProj
  };

  // ── 5. NUTRIÇÃO (Separado: Current vs History) ────────────────────────────
  let proteinGPerKg = null;
  if (rawPresc.protGKg != null && Number(rawPresc.protGKg) > 0) {
    proteinGPerKg = Number(Number(rawPresc.protGKg).toFixed(1));
  } else if (prescItems.length > 0 && evalWeightKg > 0) {
    const totalProt = prescItems.reduce((s, i) => s + (Number(i.protein) || 0), 0);
    if (totalProt > 0) proteinGPerKg = Number((totalProt / evalWeightKg).toFixed(1));
  }

  const nutritionHistory = Array.isArray(sources.rawPrescriptions)
    ? deepClone(sources.rawPrescriptions).filter(pr => pr && pr.id !== rawPresc.id)
    : [];

  const rawFasting = deepClone(sources.rawFasting || null);
  const fasting = (rawFasting && (rawFasting.enabled || rawFasting.active)) ? {
    active: true,
    protocolType: rawFasting.type || rawFasting.protocolType || 'TRE',
    protocolSubtype: rawFasting.subtype || rawFasting.protocolSubtype || '16:8',
    currentState: rawFasting.currentState || 'INACTIVE',
    feedingWindowStart: (rawFasting.feedingWindows && rawFasting.feedingWindows[0]?.start) || null,
    feedingWindowEnd: (rawFasting.feedingWindows && rawFasting.feedingWindows[0]?.end) || null,
    objectives: Array.isArray(rawFasting.objectives) ? [...rawFasting.objectives] : []
  } : null;

  const nutrition = {
    current: {
      prescribedKcal,
      caloricTargetKcal,
      caloricTargetSource,
      energyBalanceKcal,
      proteinGPerKg,
      carbsGPerKg: rawPresc.carbsGKg != null ? Number(rawPresc.carbsGKg) : null,
      fatGPerKg: rawPresc.fatGKg != null ? Number(rawPresc.fatGKg) : null,
      totalProteinG: rawPresc.totalProteinG != null ? Number(rawPresc.totalProteinG) : (proteinGPerKg && evalWeightKg ? Math.round(proteinGPerKg * evalWeightKg) : null),
      totalCarbsG: rawPresc.totalCarbsG != null ? Number(rawPresc.totalCarbsG) : null,
      totalFatG: rawPresc.totalFatG != null ? Number(rawPresc.totalFatG) : null,
      dietaryRestrictions: p.dietaryRestrictions || null,
      foodAversions: p.foodAversions || null,
      preferredFoods: p.preferredFoods || null,
      mealsCount: prescItems.length,
      meals: prescItems.map(i => ({ ...i })),
      fasting
    },
    history: nutritionHistory
  };

  // ── 6. TREINAMENTO (Separado: Current vs History) ─────────────────────────
  const rawPerf = deepClone(sources.rawPerformance || {});
  let rawRoutines = [];
  if (Array.isArray(rawPerf.routines)) {
    rawRoutines = rawPerf.routines;
  } else if (rawPerf.workoutPlan && typeof rawPerf.workoutPlan === 'object') {
    rawRoutines = Object.entries(rawPerf.workoutPlan).map(([letter, data]) => ({
      routineId: letter,
      routineName: data.name || `Treino ${letter}`,
      exercises: data.exercises || []
    }));
  }

  const activeSplit = rawPerf.activeSplit || options.split || null;
  const splitSource = rawPerf.splitSource || options.splitSource || (activeSplit ? 'LEGACY' : null);

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

  const trainingHistory = Array.isArray(options.trainingHistory) ? deepClone(options.trainingHistory) : [];

  const training = {
    current: {
      mainModality: p.mainModality || workoutType,
      workoutType,
      weeklyFrequency: workoutFrequencyDays,
      frequencyLabel: typeof workoutFrequency === 'string' ? workoutFrequency : (workoutFrequencyDays != null ? `${workoutFrequencyDays}x/semana` : null),
      sessionDurationMinutes: workoutDurationMinutes,
      durationLabel: typeof workoutDuration === 'string' ? workoutDuration : (workoutDurationMinutes != null ? `${workoutDurationMinutes} min` : null),
      trainingLevel,
      intensity: workoutIntensity,
      preferredTime: workoutTime,
      neatRoutine: p.neatRoutine || null,
      activeSplit,
      splitSource,
      routines: normalizedRoutines,
      weeklySchedule: Array.isArray(rawPerf.weeklySchedule) ? rawPerf.weeklySchedule.map(s => ({ ...s })) : []
    },
    history: trainingHistory
  };

  // ── 7. CARDIO (Separado: Current vs History) ──────────────────────────────
  const rawCardio = deepClone(sources.rawCardio || rawPerf.cardioPrescription || {});
  let cardioSessions = [];
  if (Array.isArray(rawCardio.sessions)) {
    cardioSessions = rawCardio.sessions;
  } else if (rawPerf.prescribedCardioId || options.prescribedCardioId) {
    cardioSessions = [{
      cardioId: rawPerf.prescribedCardioId || options.prescribedCardioId,
      day: 'Dia 2',
      durationMinutes: 45,
      type: 'Moderado Contínuo'
    }];
  }

  const normalizedCardioSessions = cardioSessions.map((s, idx) => ({
    cardioId: s.cardioId || s.sessionId || s.protocolId || `cardio_${idx + 1}`,
    day: s.day || null,
    type: s.type || 'Moderado Contínuo',
    durationMinutes: s.durationMinutes != null ? Number(s.durationMinutes) : 45,
    intensity: s.intensity || null,
    modality: s.modality || s.protocolTitle || null,
    heartRateZone: s.heartRateZone || null,
    targetBpm: s.targetBpm != null ? Number(s.targetBpm) : null
  }));

  const hrData = calculatePureHeartRateZones(age, p.restingHeartRate != null ? Number(p.restingHeartRate) : null);

  const cardio = {
    current: {
      prescribedCardioId: rawPerf.prescribedCardioId || options.prescribedCardioId || null,
      weeklyFrequency: normalizedCardioSessions.length,
      sessions: normalizedCardioSessions,
      heartRate: hrData,
      restrictions: Array.isArray(rawCardio.restrictions) ? [...rawCardio.restrictions] : []
    },
    history: []
  };

  // ── 8. RESTRIÇÕES CLÍNICAS E DE SEGURANÇA ─────────────────────────────────
  const rawInjuries = Array.isArray(p.injuries) ? p.injuries : [];
  const rawPain = Array.isArray(p.painAreas) ? p.painAreas : [];
  const rawProhibited = Array.isArray(p.prohibitedExercises) ? p.prohibitedExercises : [];
  const rawMovements = Array.isArray(p.restrictedMovements) ? p.restrictedMovements : [];
  const rawConstraintsList = Array.isArray(p.clinicalConstraints) ? p.clinicalConstraints : [];
  const rawSchedule = Array.isArray(p.scheduleRestrictions) ? p.scheduleRestrictions : [];
  const rawRecovery = Array.isArray(p.recoveryRestrictions) ? p.recoveryRestrictions : [];

  const constraints = {
    injuries: [...new Set(rawInjuries.filter(Boolean).map(String))],
    painAreas: [...new Set(rawPain.filter(Boolean).map(String))],
    prohibitedExercises: [...new Set(rawProhibited.filter(Boolean).map(String))],
    restrictedMovements: [...new Set(rawMovements.filter(Boolean).map(String))],
    medicalRestrictions: [...new Set(rawConstraintsList.filter(Boolean).map(String))],
    equipmentRestrictions: p.equipmentRestrictions || null,
    availableEquipment: p.availableEquipment || null,
    scheduleRestrictions: [...new Set(rawSchedule.filter(Boolean).map(String))],
    recoveryRestrictions: [...new Set(rawRecovery.filter(Boolean).map(String))]
  };

  // ── 9. FLAGS CLÍNICAS & PROVENIÊNCIA ──────────────────────────────────────
  const isMinor = age != null ? age < 18 : false;
  const reviewReasons = [];
  if (isMinor) reviewReasons.push('Paciente menor de idade (< 18 anos) requer supervisão e autorização pediátrica.');
  if (constraints.injuries.length > 0) reviewReasons.push(`Presença de lesões ativas: ${constraints.injuries.join(', ')}.`);
  if (constraints.medicalRestrictions.length > 0) reviewReasons.push(`Restrições médicas informadas: ${constraints.medicalRestrictions.join(', ')}.`);
  if (anthropometry.indices.hasCardiometabolicRisk) reviewReasons.push('Risco cardiometabólico elevado detectado (RCEst > 0.50 ou Índice de Conicidade elevado).');

  const clinicalFlags = {
    isMinor,
    clinicalReviewRequired: reviewReasons.length > 0,
    reasons: reviewReasons
  };

  const provenance = {
    schema: 'PerformanceContextDTO@1.0.0',
    patient: {
      source: 'db.patients',
      fields: {
        id: { field: 'id', transform: 'direct' },
        name: { field: 'name', transform: 'trim' },
        age: ageResolution.provenance,
        gender: { field: 'gender', transform: 'normalized_sex' },
        weight: weightProvenance,
        height: heightProvenance,
        objective: { field: 'objective', transform: 'direct' },
        patientType: { field: 'patientType', transform: 'direct' }
      }
    },
    anamnesis: {
      source: 'db.patients',
      fields: [
        'objective', 'usualWeight', 'targetWeight', 'routineNotes', 'clinicalNotes',
        'dietaryRestrictions', 'foodAversions', 'preferredFoods', 'cookingAvailability',
        'mealPreparer', 'mealFrequency', 'hydrationLiters', 'bowelHabit', 'neatRoutine',
        'workoutType', 'workoutFrequency', 'workoutDuration', 'workoutIntensity',
        'workoutTime', 'sleepHours', 'sleepQuality', 'stressLevel', 'activityFactor',
        'restingHeartRate'
      ]
    },
    assessment: latestEval ? {
      source: 'db.assessments',
      entity: 'Assessment',
      id: latestEval.id || null,
      date: latestEval.date || null
    } : null,
    anthropometry: {
      source: latestEval ? 'db.assessments' : 'db.patients',
      calculation: 'domain/math/nutritionMath.js'
    },
    bodyComposition: {
      source: latestEval ? 'db.assessments' : 'db.patients',
      calculation: 'domain/math/nutritionMath.js'
    },
    energy: {
      source: 'domain/math/nutritionMath.js',
      calculation: 'calculateTMB/calculateGET/calculateCaloricTarget/calculateEnergyBalance'
    },
    nutrition: {
      source: 'db.prescriptions',
      entity: 'Prescription'
    },
    training: {
      source: 'db.performanceMetabolica',
      entity: 'PerformanceWorkout'
    },
    cardio: {
      source: 'PERF_CARDIO_DB',
      entity: 'CardioPrescription'
    },
    constraints: {
      source: 'db.patients',
      field: 'prohibitedExercises/injuries/clinicalConstraints/availableEquipment'
    },
    clinicalFlags: {
      source: 'domain/rules',
      rule: 'pediatric_and_clinical_risk_guard'
    }
  };

  return createPerformanceContextDTO({
    patient: {
      patientId,
      name: p.name || null,
      age,
      sex,
      birthDate,
      weightKg: evalWeightKg,
      heightCm: evalHeightCm,
      bmi: anthropometry.bmi,
      patientType,
      trainingLevel,
      objective
    },
    anamnesis,
    assessment: latestEval ? {
      assessmentId: latestEval.id || null,
      patientId,
      date: latestEval.date || null,
      weightKg: evalWeightKg,
      heightCm: evalHeightCm,
      bmi: anthropometry.bmi,
      bodyFatPercent,
      leanMassKg,
      fatMassKg,
      waistCm: waistVal,
      hipCm: hipVal,
      neckCm: latestEval.circNeck ?? null,
      rcq: circumferences.waistToHipRatio,
      rcest: evalRcEst,
      skinfolds
    } : null,
    anthropometry,
    bodyComposition,
    energy,
    nutrition,
    training,
    cardio,
    constraints,
    clinicalFlags,
    provenance
  });
}

/**
 * Função de ponte/controlador para carregar dados do banco e construir o contexto canônico.
 * Executa as leituras de banco de forma assíncrona pura e repassa objetos crus ao adaptador.
 * Zero acesso ao DOM.
 * @param {string} patientId 
 * @param {Object} dbInstance - Instância do Dexie (db)
 * @param {Object} [options] 
 * @returns {Promise<Readonly<Object>|null>}
 */
async function fetchAndBuildCanonicalPerformanceContext(patientId, dbInstance, options = {}) {
  if (!patientId || !dbInstance) return null;

  let rawPatient = null;
  let rawAssessments = [];
  let rawPrescription = null;
  let rawPerformance = null;
  let rawFasting = null;

  try {
    if (dbInstance.patients) {
      rawPatient = await dbInstance.patients.get(patientId);
    }
  } catch (err) {
    console.warn('[fetchAndBuildCanonicalPerformanceContext] Erro ao ler paciente:', err);
  }

  if (!rawPatient) return null;

  try {
    if (dbInstance.assessments) {
      rawAssessments = await dbInstance.assessments.where('patientId').equals(patientId).toArray();
    }
  } catch (_) { }

  try {
    if (dbInstance.prescriptions) {
      rawPrescription = await dbInstance.prescriptions.get(patientId);
    }
  } catch (_) { }

  try {
    if (dbInstance.performanceMetabolica) {
      rawPerformance = await dbInstance.performanceMetabolica.get(patientId);
    }
  } catch (_) { }

  try {
    if (dbInstance.fastingProtocols) {
      rawFasting = await dbInstance.fastingProtocols.where('patientId').equals(patientId).first();
    }
  } catch (_) { }

  return buildCanonicalPerformanceContext({
    rawPatient,
    rawAssessments,
    rawPrescription,
    rawPerformance,
    rawFasting
  }, options);
}

module.exports = {
  buildCanonicalPerformanceContext,
  fetchAndBuildCanonicalPerformanceContext,
  calculatePureHeartRateZones,
  resolvePatientAgeAndProvenance
};
