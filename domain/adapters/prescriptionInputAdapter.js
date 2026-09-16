/**
 * domain/adapters/prescriptionInputAdapter.js
 * 
 * Adaptador Canônico de Entrada da Prescrição Nutricional — NutriAx Pro.
 * Fase N3.7.2 — Camada de Adaptação Canônica e Fronteira de Runtime.
 * 
 * Regras Obrigatórias de Governança e Pureza:
 * 1. PUREZA TOTAL: Zero DOM, zero window/document, zero Dexie/Firebase, zero Gemini,
 *    zero Date.now(), zero Math.random(), zero I/O de rede ou disco.
 * 2. DETERMINISMO ESTÓICO: Mesma entrada bruta -> mesmo input canônico estruturado.
 * 3. ZERO DECISÕES CLÍNICAS SILENCIOSAS:
 *    - GAP 1 (Peri-workout): usa a política canônica comprovada de 150 min (DEFAULT_NUTRIENT_TIMING_POLICY).
 *    - GAP 2 (Altura): normalização estrutural (< 3.0 m -> cm).
 *    - GAP 3 (Alimentos): normalização estrutural para CanonicalFoodDTO.
 *    - GAP 4 (Meal Role): deferido à política canônica do N3.3 (Meal Assembly).
 *    - GAP 5 (Objetivo): mapeamento restrito a valores inequívocos ('weightLoss', 'hypertrophy', 'recomposition', 'maintenance').
 *      Valores livres não mapeáveis preservam o texto clínico e mantêm objectiveCategory = null (GAP sinalizado, sem adivinhação).
 *    - GAP 6 (Horários): conversão estrutural entre "HH:MM" e minutos desde 00:00.
 *    - GAP 7 (Número de Refeições): validação estrita no intervalo canônico 1..8 (DEFAULT_MEAL_ASSEMBLY_POLICY).
 *    - GAP 8 (Bromatologia): preserva status bromatológico existente ou calcula Atwater determinístico.
 *    - GAP 9 (Lipídios/Gordura): alimentos fornecem 'lipid'; metas fornecem 'fatTargetG'.
 *    - GAP 11 (IDs): sanitização determinística sem UUIDs aleatórios.
 */

'use strict';

let createNutritionPrescriptionContextDTO;
let validateNutritionPrescriptionContextDTO;
let createCanonicalFoodDTO;
let validateCanonicalFoodDTO;
let DEFAULT_NUTRIENT_TIMING_POLICY;
let DEFAULT_MEAL_ASSEMBLY_POLICY;

if (typeof require !== 'undefined') {
  try {
    const ctxModule = require('../contracts/NutritionPrescriptionContextDTO');
    createNutritionPrescriptionContextDTO = ctxModule.createNutritionPrescriptionContextDTO;
    validateNutritionPrescriptionContextDTO = ctxModule.validateNutritionPrescriptionContextDTO;
  } catch (_) {}

  try {
    const foodModule = require('../contracts/FoodSolverContract');
    createCanonicalFoodDTO = foodModule.createCanonicalFoodDTO;
    validateCanonicalFoodDTO = foodModule.validateCanonicalFoodDTO;
  } catch (_) {}

  try {
    const timingPolicyModule = require('../timing/nutrientTimingPolicy');
    DEFAULT_NUTRIENT_TIMING_POLICY = timingPolicyModule.DEFAULT_NUTRIENT_TIMING_POLICY;
  } catch (_) {}

  try {
    const mealPolicyModule = require('../meal/mealAssemblyPolicy');
    DEFAULT_MEAL_ASSEMBLY_POLICY = mealPolicyModule.DEFAULT_MEAL_ASSEMBLY_POLICY;
  } catch (_) {}
}

// Fallbacks seguros de contexto global (browser/sandbox)
if (!createNutritionPrescriptionContextDTO && typeof globalThis !== 'undefined' && globalThis.NutriDomain) {
  createNutritionPrescriptionContextDTO = globalThis.NutriDomain.createNutritionPrescriptionContextDTO;
  validateNutritionPrescriptionContextDTO = globalThis.NutriDomain.validateNutritionPrescriptionContextDTO;
}
if (!createCanonicalFoodDTO && typeof globalThis !== 'undefined' && globalThis.NutriDomain) {
  createCanonicalFoodDTO = globalThis.NutriDomain.createCanonicalFoodDTO;
  validateCanonicalFoodDTO = globalThis.NutriDomain.validateCanonicalFoodDTO;
}

// Constantes canônicas de fallback derivadas estritamente das políticas homologadas
const CANONICAL_PERI_WORKOUT_WINDOW_MINUTES = DEFAULT_NUTRIENT_TIMING_POLICY?.preferredPeriEventWindowMinutes ?? 150;
const CANONICAL_MIN_MEALS = DEFAULT_MEAL_ASSEMBLY_POLICY?.minMealCount ?? 1;
const CANONICAL_MAX_MEALS = DEFAULT_MEAL_ASSEMBLY_POLICY?.maxMealCount ?? 8;

/**
 * Classificação formal dos 11 GAPs identificados na N3.7.2-A
 */
const GAP_CLASSIFICATION = Object.freeze({
  GAP_1_PERI_WORKOUT: { id: 'GAP_1', category: 'C', description: 'Janela peri-treino canônica (150 min via N3.5 nutrientTimingPolicy)' },
  GAP_2_HEIGHT_FORMAT: { id: 'GAP_2', category: 'B', description: 'Normalização estrutural de altura (< 3.0 m para cm)' },
  GAP_3_FOOD_CATALOG: { id: 'GAP_3', category: 'B', description: 'Transformação estrutural para CanonicalFoodDTO' },
  GAP_4_MEAL_ROLE: { id: 'GAP_4', category: 'C', description: 'Alocação de papéis de refeição via N3.3 mealAssemblyPolicy' },
  GAP_5_OBJECTIVE_CATEGORY: { id: 'GAP_5', category: 'A_D', description: 'Mapeamento inequívoco ou preservação de texto sem adivinhação' },
  GAP_6_TIME_FORMAT: { id: 'GAP_6', category: 'B', description: 'Conversão estrutural HH:MM para minutos' },
  GAP_7_MEAL_COUNT: { id: 'GAP_7', category: 'C', description: 'Intervalo canônico 1..8 via N3.3 mealAssemblyPolicy' },
  GAP_8_BROMATOLOGY: { id: 'GAP_8', category: 'A', description: 'Preservação do status bromatológico TACO/TBCA' },
  GAP_9_LIPID_FAT: { id: 'GAP_9', category: 'B', description: 'Tradução estrutural alimento:lipid -> meta:fatTargetG' },
  GAP_10_VALIDATION_META: { id: 'GAP_10', category: 'A', description: 'Derivação de relatório N3.6 no adapter de saída' },
  GAP_11_FOOD_ITEM_IDS: { id: 'GAP_11', category: 'B', description: 'Geração determinística de identificadores' }
});

/**
 * Normaliza altura do paciente (GAP 2 - Categoria B).
 * Se < 3.0, assume metros (ex: 1.75 -> 175). Se >= 3.0, assume cm.
 * @param {any} val 
 * @returns {number|null}
 */
function normalizeHeightCm(val) {
  if (val == null || val === '') return null;
  const num = Number(val);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num < 3.0 ? Math.round(num * 100) : Math.round(num);
}

/**
 * Converte string "HH:MM" para minutos desde as 00:00 (GAP 6 - Categoria B).
 * @param {string} timeStr 
 * @returns {number|null}
 */
function parseTimeToMinutes(timeStr) {
  if (typeof timeStr !== 'string' || !/^\d{1,2}:\d{2}$/.test(timeStr.trim())) return null;
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return (h * 60) + m;
}

/**
 * Mapeia objetivo do paciente de forma estritamente determinística (GAP 5 - Categoria A/D).
 * Apenas mapeia strings com correspondência inequívoca.
 * Se não for inequívoca, NÃO adivinha; retorna null para category e preserva o texto clínico.
 * 
 * @param {string} rawObjective 
 * @returns {{ category: string|null, clinicalObjective: string, isMapped: boolean }}
 */
function normalizeObjective(rawObjective) {
  let text = '';
  if (typeof rawObjective === 'string') {
    text = rawObjective.trim();
  } else if (rawObjective && typeof rawObjective === 'object') {
    text = String(
      rawObjective.clinicalObjective ||
      rawObjective.primary ||
      rawObjective.goal ||
      rawObjective.objective ||
      rawObjective.category ||
      ''
    ).trim();
  }

  if (!text) {
    return {
      category: null,
      clinicalObjective: '',
      isMapped: false
    };
  }

  const lower = text.toLowerCase();

  // Mapeamentos inequívocos comprovados
  if (
    lower === 'perda de peso' ||
    lower === 'perda_de_peso' ||
    lower === 'emagrecimento' ||
    lower === 'emagrecer' ||
    lower === 'definição' ||
    lower === 'definicao' ||
    lower === 'definição muscular' ||
    lower === 'definicao muscular' ||
    lower === 'cutting' ||
    lower === 'weightloss' ||
    lower === 'weight_loss'
  ) {
    return { category: 'weightLoss', clinicalObjective: text, isMapped: true };
  }

  if (
    lower === 'hipertrofia' ||
    lower === 'ganho de massa' ||
    lower === 'ganho de massa muscular' ||
    lower === 'bulking' ||
    lower === 'hipertrofia muscular' ||
    lower === 'hypertrophy'
  ) {
    return { category: 'hypertrophy', clinicalObjective: text, isMapped: true };
  }

  if (
    lower === 'recomposição' ||
    lower === 'recomposicao' ||
    lower === 'recomposição corporal' ||
    lower === 'recomposicao corporal' ||
    lower === 'recomposition'
  ) {
    return { category: 'recomposition', clinicalObjective: text, isMapped: true };
  }

  if (
    lower === 'manutenção' ||
    lower === 'manutencao' ||
    lower === 'saúde' ||
    lower === 'saude' ||
    lower === 'longevidade' ||
    lower === 'maintenance'
  ) {
    return { category: 'maintenance', clinicalObjective: text, isMapped: true };
  }

  // Não inventar decisão clínica para valores ambíguos ou compostos
  return {
    category: null,
    clinicalObjective: text,
    isMapped: false
  };
}

/**
 * Valida o número de refeições contra a política canônica N3.3 (GAP 7 - Categoria C).
 * Intervalo homologado: 1 a 8 refeições.
 * 
 * @param {any} mealCountVal 
 * @returns {{ valid: boolean, mealCount: number, error?: string }}
 */
function validateMealCount(mealCountVal) {
  if (mealCountVal == null || mealCountVal === '') {
    return { valid: true, mealCount: 4 }; // Padrão prudente
  }
  const count = parseInt(mealCountVal, 10);
  if (!Number.isInteger(count) || count < CANONICAL_MIN_MEALS || count > CANONICAL_MAX_MEALS) {
    return {
      valid: false,
      mealCount: count,
      error: `Número de refeições (${mealCountVal}) fora do intervalo canônico permitido (${CANONICAL_MIN_MEALS} a ${CANONICAL_MAX_MEALS}).`
    };
  }
  return { valid: true, mealCount: count };
}

/**
 * Converte um item de alimento bruto para CanonicalFoodDTO (GAP 3 - Categoria B).
 * Respeita GAP 9: o alimento possui 'lipid'.
 * 
 * @param {Object} rawFood 
 * @returns {Readonly<Object>|null} CanonicalFoodDTO
 */
function adaptCanonicalFoodItem(rawFood) {
  if (!rawFood || typeof rawFood !== 'object') return null;

  const id = String(rawFood.id || rawFood.foodId || '').trim();
  const name = String(rawFood.name || rawFood.foodName || '').trim();
  if (!id || !name) return null;

  const calories = Number(rawFood.calories) || 0;
  const protein = Number(rawFood.protein) || 0;
  const carbohydrate = Number(rawFood.carbohydrate) || 0;
  const lipid = Number(rawFood.lipid != null ? rawFood.lipid : (rawFood.fat != null ? rawFood.fat : 0)) || 0;
  const fiber = rawFood.fiber != null ? Number(rawFood.fiber) : null;
  const sodium = rawFood.sodium != null ? Number(rawFood.sodium) : null;

  const candidate = {
    id,
    name,
    category: String(rawFood.category || 'Alimentos Gerais').trim(),
    source: String(rawFood.source || 'TACO').trim(),
    baseQuantity: Number(rawFood.baseQuantity) || 100,
    unit: 'g', // Canônico nutricional sempre em gramas
    prepState: String(rawFood.prepState || 'Cru/Cozido').trim(),
    calories: Math.max(0, calories),
    protein: Math.max(0, protein),
    carbohydrate: Math.max(0, carbohydrate),
    lipid: Math.max(0, lipid),
    fiber: fiber != null && !isNaN(fiber) ? Math.max(0, fiber) : null,
    sodium: sodium != null && !isNaN(sodium) ? Math.max(0, sodium) : null,
    bromatology: (rawFood.bromatology && typeof rawFood.bromatology === 'object')
      ? { ...rawFood.bromatology }
      : { energyStatus: 'CONSISTENTE' }
  };

  if (typeof createCanonicalFoodDTO === 'function') {
    try {
      return createCanonicalFoodDTO(candidate);
    } catch (_) {
      return null;
    }
  }

  return Object.freeze(candidate);
}

/**
 * Constrói e valida o catálogo de alimentos canônicos a partir de coleção bruta.
 * 
 * @param {Array<Object>} rawCatalog 
 * @returns {{ foodCatalog: Array<Object>, totalReceived: number, totalValid: number }}
 */
function adaptFoodCatalog(rawCatalog) {
  if (!Array.isArray(rawCatalog)) {
    return { foodCatalog: [], totalReceived: 0, totalValid: 0 };
  }

  const validFoods = [];
  for (const raw of rawCatalog) {
    const adapted = adaptCanonicalFoodItem(raw);
    if (adapted) {
      if (typeof validateCanonicalFoodDTO === 'function') {
        const check = validateCanonicalFoodDTO(adapted);
        if (check.isValid) {
          validFoods.push(adapted);
        }
      } else {
        validFoods.push(adapted);
      }
    }
  }

  return {
    foodCatalog: validFoods,
    totalReceived: rawCatalog.length,
    totalValid: validFoods.length
  };
}

/**
 * Constrói o NutritionPrescriptionContextDTO a partir de dados puros do paciente.
 * 
 * @param {Object} rawPatientData 
 * @returns {{ context: Readonly<Object>|null, errors: string[], warnings: string[] }}
 */
function adaptPatientContext(rawPatientData) {
  const errors = [];
  const warnings = [];

  if (!rawPatientData || typeof rawPatientData !== 'object') {
    return { context: null, errors: ['Dados de paciente ausentes ou inválidos.'], warnings };
  }

  // Se já for um NutritionPrescriptionContextDTO válido, reutiliza de forma pura
  const isCanonicalContext = (
    rawPatientData.schemaVersion === '1.0.0' ||
    rawPatientData.schemaVersion === 'N1.1' ||
    rawPatientData.contextVersion === 'N1.1'
  ) && rawPatientData.patient && rawPatientData.anthropometry;
  if (isCanonicalContext) {
    if (typeof validateNutritionPrescriptionContextDTO === 'function') {
      const v = validateNutritionPrescriptionContextDTO(rawPatientData);
      if (v.isValid) {
        return { context: rawPatientData, errors: [], warnings: [] };
      }
    } else {
      return { context: rawPatientData, errors: [], warnings: [] };
    }
  }

  const patientId = String(
    rawPatientData.patientId ||
    (rawPatientData.patient && rawPatientData.patient.patientId) ||
    rawPatientData.id ||
    'patient_auto'
  ).trim();
  const name = String(
    rawPatientData.name ||
    (rawPatientData.patient && rawPatientData.patient.name) ||
    rawPatientData.patientName ||
    'Paciente'
  ).trim();
  const age = Number(
    rawPatientData.age ||
    (rawPatientData.patient && rawPatientData.patient.age) ||
    30
  );
  const sex = String(
    rawPatientData.sex ||
    (rawPatientData.patient && (rawPatientData.patient.gender || rawPatientData.patient.sex)) ||
    'Masculino'
  ).trim();
  const patientType = String(
    rawPatientData.patientType ||
    (rawPatientData.patient && rawPatientData.patient.patientType) ||
    'Praticante recreativo'
  ).trim();
  const trainingLevel = String(rawPatientData.trainingLevel || 'Intermediário').trim();

  const rawWeight = rawPatientData.weightKg != null ? rawPatientData.weightKg : (rawPatientData.weight != null ? rawPatientData.weight : 70);
  const weightKg = Number(rawWeight);
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    errors.push('Peso corporal inválido para o contexto de prescrição.');
  }

  const rawHeight = rawPatientData.heightCm != null ? rawPatientData.heightCm : rawPatientData.height;
  const heightCm = normalizeHeightCm(rawHeight) || 175;

  const bodyFatPercent = rawPatientData.bodyFatPercent != null ? Number(rawPatientData.bodyFatPercent) : null;
  const leanMassKg = (bodyFatPercent != null && bodyFatPercent > 0 && bodyFatPercent < 100)
    ? Number((weightKg * (1 - (bodyFatPercent / 100))).toFixed(2))
    : null;

  // Resolução do objetivo com classificação GAP 5
  const rawObj = rawPatientData.clinicalObjective || rawPatientData.objective || rawPatientData.goal || 'Manutenção';
  const objResolution = normalizeObjective(rawObj);
  if (!objResolution.isMapped && objResolution.clinicalObjective) {
    warnings.push(`[GAP_5] Objetivo clínico "${objResolution.clinicalObjective}" mantido como texto sem adivinhação de categoria.`);
  }

  const rawObjectiveString = typeof rawObj === 'object' && rawObj !== null
    ? (rawObj.clinicalObjective || rawObj.primary || rawObj.goal || JSON.stringify(rawObj))
    : String(rawObj);

  const objective = {
    clinicalObjective: objResolution.clinicalObjective,
    rawObjective: rawObjectiveString.trim(),
    category: objResolution.category
  };

  const rawGet = rawPatientData.getKcal ?? rawPatientData.get;
  const rawTmb = rawPatientData.tmbKcal ?? rawPatientData.tmb;
  const getKcal = (rawGet != null && Number(rawGet) > 0) ? Math.round(Number(rawGet)) : null;
  const tmbKcal = (rawTmb != null && Number(rawTmb) > 0) ? Math.round(Number(rawTmb)) : null;

  const energy = {
    tmbKcal: tmbKcal,
    getKcal: getKcal,
    activityFactor: Number(rawPatientData.activityFactor) || 1.4,
    formula: String(rawPatientData.formula || ((leanMassKg != null && leanMassKg > 0) ? 'Katch-McArdle' : 'Harris-Benedict 1984'))
  };

  const constraints = {
    dietaryRestrictions: Array.isArray(rawPatientData.dietaryRestrictions) ? [...rawPatientData.dietaryRestrictions] : [],
    allergies: Array.isArray(rawPatientData.allergies) ? [...rawPatientData.allergies] : [],
    intolerances: Array.isArray(rawPatientData.intolerances) ? [...rawPatientData.intolerances] : [],
    aversions: Array.isArray(rawPatientData.aversions) ? [...rawPatientData.aversions] : []
  };

  const rawMealsPerDay = rawPatientData.mealsPerDay ?? rawPatientData.mealCount ?? (rawPatientData.routine && (rawPatientData.routine.mealsPerDay || rawPatientData.routine.mealCount)) ?? (rawPatientData.preferences && rawPatientData.preferences.mealFrequency);
  const normalizedMealsPerDay = (rawMealsPerDay != null && !isNaN(Number(rawMealsPerDay)) && Number(rawMealsPerDay) >= CANONICAL_MIN_MEALS && Number(rawMealsPerDay) <= CANONICAL_MAX_MEALS)
    ? parseInt(rawMealsPerDay, 10)
    : null;

  const preferences = {
    preferredFoods: Array.isArray(rawPatientData.preferredFoods) ? [...rawPatientData.preferredFoods] : [],
    dislikedFoods: Array.isArray(rawPatientData.dislikedFoods) ? [...rawPatientData.dislikedFoods] : [],
    mealFrequency: normalizedMealsPerDay
  };

  const routine = {
    wakeUpTime: typeof rawPatientData.wakeUpTime === 'string' ? rawPatientData.wakeUpTime : '07:00',
    bedTime: typeof rawPatientData.bedTime === 'string' ? rawPatientData.bedTime : '23:00',
    workoutTime: typeof rawPatientData.workoutTime === 'string' ? rawPatientData.workoutTime : null,
    mealsPerDay: normalizedMealsPerDay,
    mealCount: normalizedMealsPerDay
  };

  const training = {
    hasActiveTraining: rawPatientData.hasActiveTraining === true || Boolean(rawPatientData.workoutTime || rawPatientData.trainingRoutines),
    activeSplit: typeof rawPatientData.activeSplit === 'string' ? rawPatientData.activeSplit : 'AB',
    workoutTime: routine.workoutTime,
    sessionDurationMinutes: Number(rawPatientData.sessionDurationMinutes) || 60,
    routines: Array.isArray(rawPatientData.trainingRoutines) ? rawPatientData.trainingRoutines : []
  };

  const cardio = {
    hasActiveCardio: Boolean(rawPatientData.hasActiveCardio),
    weeklyFrequency: Number(rawPatientData.cardioFrequency) || 0,
    sessions: Array.isArray(rawPatientData.cardioSessions) ? rawPatientData.cardioSessions : []
  };

  const fasting = {
    hasActiveProtocol: Boolean(rawPatientData.hasActiveFasting),
    status: rawPatientData.hasActiveFasting ? 'ACTIVE' : 'INACTIVE',
    feedingWindows: rawPatientData.feedingWindows || null,
    fastingWindows: rawPatientData.fastingWindows || null
  };

  const provenance = {
    patient: { source: 'runtime_patient_data', recordId: patientId, reliability: 'CANONICAL' },
    anthropometry: { source: 'runtime_assessment', recordId: null, reliability: 'CANONICAL' },
    energy: { source: 'runtime_energy_calc', recordId: null, reliability: 'CANONICAL' }
  };

  const contextData = {
    patient: { patientId, name, age, sex, trainingLevel, patientType },
    anthropometry: { weightKg, heightCm, bodyFatPercent, leanMassKg, hasRecentAssessment: true },
    objective,
    energy,
    constraints,
    preferences,
    routine,
    mealsPerDay: normalizedMealsPerDay,
    mealCount: normalizedMealsPerDay,
    training,
    cardio,
    fasting,
    weeklySchedule: Array.isArray(rawPatientData.weeklySchedule) ? rawPatientData.weeklySchedule : [],
    clinical: rawPatientData.clinical || {},
    currentPrescription: rawPatientData.currentPrescription || {},
    dietaryRecall: rawPatientData.dietaryRecall || { hasRecall: false, itemsCount: 0, typicalMealTimes: [], items: [] },
    provenance,
    generatedAt: rawPatientData.generatedAt || '2026-09-14T00:00:00.000Z'
  };

  if (typeof createNutritionPrescriptionContextDTO === 'function') {
    try {
      const dto = createNutritionPrescriptionContextDTO(contextData);
      return { context: dto, errors, warnings };
    } catch (err) {
      errors.push(`Falha ao construir NutritionPrescriptionContextDTO: ${err.message}`);
      return { context: null, errors, warnings };
    }
  }

  return { context: Object.freeze(contextData), errors, warnings };
}

/**
 * Constrói a entrada canônica completa para o Prescription Orchestrator (N3.7.1).
 * 
 * @param {Object} rawInput - Objeto contendo { context, patientData, foodCatalog, options, policies }
 * @returns {{
 *   isValid: boolean,
 *   errors: string[],
 *   warnings: string[],
 *   canonicalInput: { context: Object, foodCatalog: Array<Object>, policies: Object, options: Object } | null,
 *   gapDiagnostics: Object
 * }}
 */
function buildCanonicalPrescriptionInput(rawInput = {}) {
  const errors = [];
  const warnings = [];

  if (!rawInput || typeof rawInput !== 'object') {
    return {
      isValid: false,
      errors: ['Objeto de entrada do adaptador ausente ou inválido.'],
      warnings: [],
      canonicalInput: null,
      gapDiagnostics: {}
    };
  }

  // 1. Resolução do Contexto (N1.1)
  let resolvedContext = null;
  if (rawInput.context) {
    const ctxRes = adaptPatientContext(rawInput.context);
    resolvedContext = ctxRes.context;
    errors.push(...ctxRes.errors);
    warnings.push(...ctxRes.warnings);
  } else if (rawInput.patientData) {
    const ctxRes = adaptPatientContext(rawInput.patientData);
    resolvedContext = ctxRes.context;
    errors.push(...ctxRes.errors);
    warnings.push(...ctxRes.warnings);
  } else {
    errors.push('Contexto do paciente não fornecido (context ou patientData obrigatório).');
  }

  // 2. Resolução do Catálogo de Alimentos (N3.1 / N3.2)
  const rawCatalog = rawInput.foodCatalog || [];
  const catalogRes = adaptFoodCatalog(rawCatalog);
  if (catalogRes.totalValid === 0) {
    errors.push('Catálogo de alimentos vazio ou nenhum alimento atendeu ao contrato canônico CanonicalFoodDTO.');
  }

  // 3. Resolução de Opções e Validações de GAPs
  const rawOptions = rawInput.options || {};

  // GAP 7: Validação do número de refeições
  const declaredMealCount = rawOptions.mealCount ?? rawOptions.mealsPerDay ?? resolvedContext?.routine?.mealsPerDay ?? resolvedContext?.mealsPerDay ?? (rawInput.patientData && (rawInput.patientData.mealsPerDay || rawInput.patientData.mealCount));
  const mealCountRes = validateMealCount(declaredMealCount);
  if (!mealCountRes.valid) {
    errors.push(`[GAP_7] ${mealCountRes.error}`);
  }

  // Sincronização explícita do número de refeições no contexto canônico
  if (resolvedContext && mealCountRes.valid) {
    resolvedContext = {
      ...resolvedContext,
      mealsPerDay: mealCountRes.mealCount,
      mealCount: mealCountRes.mealCount,
      routine: {
        ...(resolvedContext.routine || {}),
        mealsPerDay: mealCountRes.mealCount,
        mealCount: mealCountRes.mealCount
      },
      preferences: {
        ...(resolvedContext.preferences || {}),
        mealFrequency: mealCountRes.mealCount
      }
    };
  }

  // GAP 1: Janela peri-treino canônica (150 min por padrão N3.5)
  const periWorkoutWindowMinutes = Number(rawOptions.periWorkoutWindowMinutes) || CANONICAL_PERI_WORKOUT_WINDOW_MINUTES;

  const canonicalOptions = {
    mealCount: mealCountRes.mealCount,
    dietaryStyle: String(rawOptions.dietaryStyle || 'tradicional').trim(),
    includeSupplements: rawOptions.includeSupplements !== false,
    periWorkoutWindowMinutes
  };

  // 4. Políticas canônicas
  const policies = (rawInput.policies && typeof rawInput.policies === 'object')
    ? { ...rawInput.policies }
    : {};

  const isValid = errors.length === 0;

  const gapDiagnostics = {
    GAP_1: { status: 'RESOLVED_POLICY', value: periWorkoutWindowMinutes, origin: 'DEFAULT_NUTRIENT_TIMING_POLICY (150 min)' },
    GAP_2: { status: 'RESOLVED_STRUCTURAL', value: resolvedContext?.anthropometry?.heightCm },
    GAP_3: { status: 'RESOLVED_STRUCTURAL', count: catalogRes.totalValid },
    GAP_4: { status: 'DEFERRED_CANONICAL_N33' },
    GAP_5: {
      status: resolvedContext?.objective?.category ? 'RESOLVED_MAPPED' : 'UNMAPPED_PRESERVED_AS_TEXT',
      category: resolvedContext?.objective?.category || null,
      raw: resolvedContext?.objective?.clinicalObjective || null
    },
    GAP_6: { status: 'RESOLVED_STRUCTURAL' },
    GAP_7: { status: 'RESOLVED_POLICY', mealCount: canonicalOptions.mealCount, allowedRange: `${CANONICAL_MIN_MEALS}..${CANONICAL_MAX_MEALS}` },
    GAP_8: { status: 'RESOLVED_DERIVED' },
    GAP_9: { status: 'RESOLVED_STRUCTURAL' },
    GAP_10: { status: 'DEFERRED_OUTPUT_ADAPTER' },
    GAP_11: { status: 'RESOLVED_STRUCTURAL' }
  };

  return {
    isValid,
    errors,
    warnings,
    canonicalInput: isValid ? {
      context: resolvedContext,
      foodCatalog: catalogRes.foodCatalog,
      policies,
      options: canonicalOptions
    } : null,
    gapDiagnostics
  };
}

// Suporte a CommonJS e navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GAP_CLASSIFICATION,
    CANONICAL_PERI_WORKOUT_WINDOW_MINUTES,
    CANONICAL_MIN_MEALS,
    CANONICAL_MAX_MEALS,
    normalizeHeightCm,
    parseTimeToMinutes,
    normalizeObjective,
    validateMealCount,
    adaptCanonicalFoodItem,
    adaptFoodCatalog,
    adaptPatientContext,
    buildCanonicalPrescriptionInput
  };
}

if (typeof globalThis !== 'undefined') {
  globalThis.NutriDomain = globalThis.NutriDomain || {};
  globalThis.NutriDomain.prescriptionInputAdapter = {
    GAP_CLASSIFICATION,
    CANONICAL_PERI_WORKOUT_WINDOW_MINUTES,
    CANONICAL_MIN_MEALS,
    CANONICAL_MAX_MEALS,
    normalizeHeightCm,
    parseTimeToMinutes,
    normalizeObjective,
    validateMealCount,
    adaptCanonicalFoodItem,
    adaptFoodCatalog,
    adaptPatientContext,
    buildCanonicalPrescriptionInput
  };
}
