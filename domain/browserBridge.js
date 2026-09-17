/**
 * domain/browserBridge.js
 * Ponto Único de Disponibilização do Domínio Canônico para o Runtime do Navegador.
 * NutriAx Pro — Fase N3.7.4.
 * 
 * Auto-gerado a partir dos módulos canônicos de domain/.
 * ZERO duplicação de fórmulas. ZERO alteração de regras de negócio.
 */
(function(global) {
  'use strict';

  const registry = {};
  const cache = {};

  function defineModule(id, factory) {
    registry[id] = factory;
    // Registra aliases comuns para resolução flexível
    if (id.endsWith('.js')) {
      const withoutExt = id.slice(0, -3);
      if (!registry[withoutExt]) registry[withoutExt] = factory;
      if (withoutExt.endsWith('/index')) {
        const dirOnly = withoutExt.slice(0, -6);
        if (!registry[dirOnly]) registry[dirOnly] = factory;
      }
    }
  }

  function resolvePath(baseDir, target) {
    if (!target.startsWith('.')) {
      if (registry[target]) return target;
      if (registry[target + '.js']) return target + '.js';
      if (registry['domain/' + target]) return 'domain/' + target;
      if (registry['domain/' + target + '.js']) return 'domain/' + target + '.js';
      if (registry['domain/' + target + '/index.js']) return 'domain/' + target + '/index.js';
      return target;
    }

    const combined = baseDir ? (baseDir + '/' + target) : target;
    const parts = combined.split('/');
    const resolved = [];
    for (const p of parts) {
      if (!p || p === '.') continue;
      if (p === '..') {
        resolved.pop();
      } else {
        resolved.push(p);
      }
    }
    const cleanPath = resolved.join('/');
    if (registry[cleanPath]) return cleanPath;
    if (registry[cleanPath + '.js']) return cleanPath + '.js';
    if (registry[cleanPath + '/index']) return cleanPath + '/index';
    if (registry[cleanPath + '/index.js']) return cleanPath + '/index.js';
    return cleanPath;
  }

  function createRequire(currentDir) {
    return function localRequire(id) {
      const resolvedId = resolvePath(currentDir, id);
      if (cache[resolvedId]) {
        return cache[resolvedId].exports;
      }
      const factory = registry[resolvedId] || registry[resolvedId + '.js'] || registry[resolvedId + '/index.js'] || registry[resolvedId + '/index'];
      if (!factory) {
        throw new Error('[NutriDomain BrowserBridge] Módulo não encontrado: "' + id + '" (resolvido como "' + resolvedId + '") a partir de "' + currentDir + '"');
      }
      const mod = { exports: {} };
      cache[resolvedId] = mod;
      factory(createRequire(resolvedId.substring(0, resolvedId.lastIndexOf('/'))), mod, mod.exports);
      return mod.exports;
    };
  }

  // ── MÓDULO: domain/contracts/PatientDTO.js ──
  defineModule("domain/contracts/PatientDTO.js", function(require, module, exports) {
/**
 * domain/contracts/PatientDTO.js
 * 
 * Contrato Canônico de Dados Essenciais do Paciente.
 * Camada de Domínio Puro — Sem DOM, Sem Dexie, Sem Firebase, Sem IA.
 */

/**
 * Validação determinística de PatientDTO
 * @param {Object} patient
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validatePatientDTO(patient) {
  const errors = [];

  if (!patient || typeof patient !== 'object' || Array.isArray(patient)) {
    return { isValid: false, errors: ['PatientDTO deve ser um objeto.'] };
  }

  // patientId: obrigatório, string não-vazia
  if (typeof patient.patientId !== 'string' || patient.patientId.trim() === '') {
    errors.push('Campo "patientId" é obrigatório e deve ser uma string não-vazia.');
  } else if (patient.patientId.startsWith('ai_generated_') || patient.source === 'AI') {
    errors.push('A Inteligência Artificial não pode ser a origem primária do "patientId".');
  }

  // name: opcional, se fornecido deve ser string
  if (patient.name != null && typeof patient.name !== 'string') {
    errors.push('Campo "name", quando informado, deve ser uma string.');
  }

  // age: opcional, se fornecido deve ser número inteiro plausível (0 a 130)
  if (patient.age != null) {
    if (typeof patient.age !== 'number' || isNaN(patient.age) || !Number.isInteger(patient.age) || patient.age < 0 || patient.age > 130) {
      errors.push('Campo "age", quando informado, deve ser um número inteiro entre 0 e 130.');
    }
  }

  // sex: opcional, se fornecido deve ser string conhecida
  if (patient.sex != null) {
    if (typeof patient.sex !== 'string' || !['Masculino', 'Feminino', 'Outro'].includes(patient.sex)) {
      errors.push('Campo "sex", quando informado, deve ser "Masculino", "Feminino" ou "Outro".');
    }
  }

  // patientType: opcional, se fornecido deve ser string
  if (patient.patientType != null && typeof patient.patientType !== 'string') {
    errors.push('Campo "patientType", quando informado, deve ser uma string.');
  }

  // objective: opcional, se fornecido deve ser string
  if (patient.objective != null && typeof patient.objective !== 'string') {
    errors.push('Campo "objective", quando informado, deve ser uma string.');
  }

  // trainingLevel: opcional, se fornecido deve ser string
  if (patient.trainingLevel != null && typeof patient.trainingLevel !== 'string') {
    errors.push('Campo "trainingLevel", quando informado, deve ser uma string.');
  }

  // weightKg: opcional, se fornecido deve ser número positivo plausível (1 a 500)
  if (patient.weightKg != null) {
    if (typeof patient.weightKg !== 'number' || isNaN(patient.weightKg) || patient.weightKg <= 0 || patient.weightKg > 500) {
      errors.push('Campo "weightKg", quando informado, deve ser um número positivo entre 1 e 500 kg.');
    }
  }

  // heightCm: opcional, se fornecido deve ser número positivo plausível (30 a 300)
  if (patient.heightCm != null) {
    if (typeof patient.heightCm !== 'number' || isNaN(patient.heightCm) || patient.heightCm <= 0 || patient.heightCm > 300) {
      errors.push('Campo "heightCm", quando informado, deve ser um número positivo entre 30 e 300 cm.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Cria uma instância validada ou normalizada de PatientDTO
 * @param {Object} data
 * @returns {Readonly<{patientId: string, name: string|null, age: number|null, sex: string|null, patientType: string|null, objective: string|null, trainingLevel: string|null, weightKg: number|null, heightCm: number|null}>}
 */
function createPatientDTO(data = {}) {
  const dto = {
    patientId: data.patientId != null ? String(data.patientId).trim() : '',
    name: data.name != null ? String(data.name).trim() : null,
    age: (typeof data.age === 'number' && !isNaN(data.age)) ? Math.round(data.age) : null,
    sex: data.sex != null ? String(data.sex).trim() : null,
    patientType: data.patientType != null ? String(data.patientType).trim() : null,
    objective: data.objective != null ? String(data.objective).trim() : null,
    trainingLevel: data.trainingLevel != null ? String(data.trainingLevel).trim() : null,
    weightKg: (typeof data.weightKg === 'number' && !isNaN(data.weightKg)) ? Number(data.weightKg.toFixed(2)) : null,
    heightCm: (typeof data.heightCm === 'number' && !isNaN(data.heightCm)) ? Number(data.heightCm.toFixed(1)) : null
  };

  return Object.freeze(dto);
}

// Suporte a CommonJS e navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validatePatientDTO,
    createPatientDTO
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.PatientDTO = {
    validatePatientDTO,
    createPatientDTO
  };
}

  });

  // ── MÓDULO: domain/contracts/AssessmentDTO.js ──
  defineModule("domain/contracts/AssessmentDTO.js", function(require, module, exports) {
/**
 * domain/contracts/AssessmentDTO.js
 * 
 * Contrato Canônico de Avaliação Antropométrica e Composição Corporal.
 * Camada de Domínio Puro — Sem DOM, Sem Dexie, Sem Firebase, Sem IA.
 */

/**
 * Validação determinística de AssessmentDTO
 * @param {Object} assessment
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateAssessmentDTO(assessment) {
  const errors = [];

  if (!assessment || typeof assessment !== 'object' || Array.isArray(assessment)) {
    return { isValid: false, errors: ['AssessmentDTO deve ser um objeto.'] };
  }

  // patientId: obrigatório, string não-vazia
  if (typeof assessment.patientId !== 'string' || assessment.patientId.trim() === '') {
    errors.push('Campo "patientId" é obrigatório e deve ser uma string não-vazia.');
  }

  // assessmentId: opcional, se fornecido deve ser string
  if (assessment.assessmentId != null && typeof assessment.assessmentId !== 'string') {
    errors.push('Campo "assessmentId", quando informado, deve ser uma string.');
  }

  // date: opcional, se fornecido deve ser string de data válida
  if (assessment.date != null) {
    if (typeof assessment.date !== 'string' || isNaN(Date.parse(assessment.date))) {
      errors.push('Campo "date", quando informado, deve ser uma string de data válida (ex: ISO ou YYYY-MM-DD).');
    }
  }

  // weightKg: opcional, número positivo
  if (assessment.weightKg != null) {
    if (typeof assessment.weightKg !== 'number' || isNaN(assessment.weightKg) || assessment.weightKg <= 0 || assessment.weightKg > 500) {
      errors.push('Campo "weightKg", quando informado, deve ser um número positivo entre 1 e 500 kg.');
    }
  }

  // heightCm: opcional, número positivo
  if (assessment.heightCm != null) {
    if (typeof assessment.heightCm !== 'number' || isNaN(assessment.heightCm) || assessment.heightCm <= 0 || assessment.heightCm > 300) {
      errors.push('Campo "heightCm", quando informado, deve ser um número positivo entre 30 e 300 cm.');
    }
  }

  // bmi: opcional, número positivo
  if (assessment.bmi != null) {
    if (typeof assessment.bmi !== 'number' || isNaN(assessment.bmi) || assessment.bmi <= 0 || assessment.bmi > 100) {
      errors.push('Campo "bmi", quando informado, deve ser um número positivo entre 1 e 100.');
    }
  }

  // bodyFatPercent: opcional, percentual 1 a 80%
  if (assessment.bodyFatPercent != null) {
    if (typeof assessment.bodyFatPercent !== 'number' || isNaN(assessment.bodyFatPercent) || assessment.bodyFatPercent < 1 || assessment.bodyFatPercent > 80) {
      errors.push('Campo "bodyFatPercent", quando informado, deve ser um percentual entre 1% e 80%.');
    }
  }

  // leanMassKg: opcional, número positivo
  if (assessment.leanMassKg != null) {
    if (typeof assessment.leanMassKg !== 'number' || isNaN(assessment.leanMassKg) || assessment.leanMassKg < 0) {
      errors.push('Campo "leanMassKg", quando informado, deve ser um número não-negativo.');
    }
  }

  // fatMassKg: opcional, número positivo
  if (assessment.fatMassKg != null) {
    if (typeof assessment.fatMassKg !== 'number' || isNaN(assessment.fatMassKg) || assessment.fatMassKg < 0) {
      errors.push('Campo "fatMassKg", quando informado, deve ser um número não-negativo.');
    }
  }

  // Circunferências (waistCm, hipCm, neckCm)
  ['waistCm', 'hipCm', 'neckCm'].forEach(prop => {
    if (assessment[prop] != null) {
      if (typeof assessment[prop] !== 'number' || isNaN(assessment[prop]) || assessment[prop] <= 0 || assessment[prop] > 300) {
        errors.push(`Campo "${prop}", quando informado, deve ser um número positivo entre 1 e 300 cm.`);
      }
    }
  });

  // rcq: opcional, razão cintura/quadril (0.3 a 2.5)
  if (assessment.rcq != null) {
    if (typeof assessment.rcq !== 'number' || isNaN(assessment.rcq) || assessment.rcq <= 0 || assessment.rcq > 3) {
      errors.push('Campo "rcq", quando informado, deve ser um número positivo plausível.');
    }
  }

  // rcest: opcional, razão cintura/estatura (0.2 a 2.0)
  if (assessment.rcest != null) {
    if (typeof assessment.rcest !== 'number' || isNaN(assessment.rcest) || assessment.rcest <= 0 || assessment.rcest > 3) {
      errors.push('Campo "rcest", quando informado, deve ser um número positivo plausível.');
    }
  }

  // skinfolds: opcional, se fornecido deve ser objeto com valores numéricos não-negativos
  if (assessment.skinfolds != null) {
    if (typeof assessment.skinfolds !== 'object' || Array.isArray(assessment.skinfolds)) {
      errors.push('Campo "skinfolds", quando informado, deve ser um objeto contendo dobras em mm.');
    } else {
      for (const [foldName, foldVal] of Object.entries(assessment.skinfolds)) {
        if (foldVal != null && (typeof foldVal !== 'number' || isNaN(foldVal) || foldVal < 0 || foldVal > 150)) {
          errors.push(`Dobra cutânea "${foldName}" deve ser um número não-negativo até 150 mm.`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Cria uma instância validada ou normalizada de AssessmentDTO
 * @param {Object} data
 * @returns {Readonly<Object>}
 */
function createAssessmentDTO(data = {}) {
  const parseNum = (val, decimals = 2) => {
    if (val == null) return null;
    const n = Number(val);
    return !isNaN(n) ? Number(n.toFixed(decimals)) : null;
  };

  const skinfolds = data.skinfolds && typeof data.skinfolds === 'object' && !Array.isArray(data.skinfolds)
    ? Object.freeze(Object.entries(data.skinfolds).reduce((acc, [k, v]) => {
        acc[k] = parseNum(v, 1);
        return acc;
      }, {}))
    : null;

  const dto = {
    assessmentId: data.assessmentId != null ? String(data.assessmentId).trim() : null,
    patientId: data.patientId != null ? String(data.patientId).trim() : '',
    date: data.date != null ? String(data.date).trim() : null,
    weightKg: parseNum(data.weightKg, 2),
    heightCm: parseNum(data.heightCm, 1),
    bmi: parseNum(data.bmi, 2),
    bodyFatPercent: parseNum(data.bodyFatPercent, 2),
    leanMassKg: parseNum(data.leanMassKg, 2),
    fatMassKg: parseNum(data.fatMassKg, 2),
    waistCm: parseNum(data.waistCm, 1),
    hipCm: parseNum(data.hipCm, 1),
    neckCm: parseNum(data.neckCm, 1),
    rcq: parseNum(data.rcq, 3),
    rcest: parseNum(data.rcest, 3),
    skinfolds
  };

  return Object.freeze(dto);
}

// Suporte a CommonJS e navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateAssessmentDTO,
    createAssessmentDTO
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.AssessmentDTO = {
    validateAssessmentDTO,
    createAssessmentDTO
  };
}

  });

  // ── MÓDULO: domain/contracts/NutritionDTO.js ──
  defineModule("domain/contracts/NutritionDTO.js", function(require, module, exports) {
/**
 * domain/contracts/NutritionDTO.js
 * 
 * Contrato Canônico de Contexto Energético e Nutricional Relevante à Performance.
 * Camada de Domínio Puro — Sem DOM, Sem Dexie, Sem Firebase, Sem IA.
 */

/**
 * Validação determinística de NutritionDTO
 * @param {Object} nutrition
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateNutritionDTO(nutrition) {
  const errors = [];

  if (!nutrition || typeof nutrition !== 'object' || Array.isArray(nutrition)) {
    return { isValid: false, errors: ['NutritionDTO deve ser um objeto.'] };
  }

  // patientId: opcional ou obrigatório dependendo do contexto, se fornecido deve ser string
  if (nutrition.patientId != null && typeof nutrition.patientId !== 'string') {
    errors.push('Campo "patientId", quando informado, deve ser uma string.');
  }

  // tmbKcal: opcional, se fornecido deve ser número finito >= 0
  if (nutrition.tmbKcal != null) {
    if (typeof nutrition.tmbKcal !== 'number' || isNaN(nutrition.tmbKcal) || nutrition.tmbKcal < 0 || nutrition.tmbKcal > 10000) {
      errors.push('Campo "tmbKcal", quando informado, deve ser um número finito entre 0 e 10000 kcal.');
    }
  }

  // getKcal: opcional, se fornecido deve ser número finito >= 0
  if (nutrition.getKcal != null) {
    if (typeof nutrition.getKcal !== 'number' || isNaN(nutrition.getKcal) || nutrition.getKcal < 0 || nutrition.getKcal > 15000) {
      errors.push('Campo "getKcal", quando informado, deve ser um número finito entre 0 e 15000 kcal.');
    }
  }

  // activityFactor: opcional, se fornecido deve ser número positivo plausível (1.0 a 3.0)
  if (nutrition.activityFactor != null) {
    if (typeof nutrition.activityFactor !== 'number' || isNaN(nutrition.activityFactor) || nutrition.activityFactor < 0.8 || nutrition.activityFactor > 3.0) {
      errors.push('Campo "activityFactor", quando informado, deve ser um número entre 0.8 e 3.0.');
    }
  }

  // caloricTargetKcal: opcional, se fornecido deve ser número finito >= 0
  if (nutrition.caloricTargetKcal != null) {
    if (typeof nutrition.caloricTargetKcal !== 'number' || isNaN(nutrition.caloricTargetKcal) || nutrition.caloricTargetKcal < 0 || nutrition.caloricTargetKcal > 15000) {
      errors.push('Campo "caloricTargetKcal", quando informado, deve ser um número finito entre 0 e 15000 kcal.');
    }
  }

  // energyBalanceKcal: opcional, pode ser negativo (déficit) ou positivo (superávit)
  if (nutrition.energyBalanceKcal != null) {
    if (typeof nutrition.energyBalanceKcal !== 'number' || isNaN(nutrition.energyBalanceKcal) || Math.abs(nutrition.energyBalanceKcal) > 10000) {
      errors.push('Campo "energyBalanceKcal", quando informado, deve ser um número finito razoável.');
    }
  }

  // proteinGPerKg: opcional, se fornecido deve ser número finito >= 0
  if (nutrition.proteinGPerKg != null) {
    if (typeof nutrition.proteinGPerKg !== 'number' || isNaN(nutrition.proteinGPerKg) || nutrition.proteinGPerKg < 0 || nutrition.proteinGPerKg > 10.0) {
      errors.push('Campo "proteinGPerKg", quando informado, deve ser um número entre 0 e 10.0 g/kg.');
    }
  }

  // prescribedKcal: opcional, se fornecido deve ser número finito >= 0
  if (nutrition.prescribedKcal != null) {
    if (typeof nutrition.prescribedKcal !== 'number' || isNaN(nutrition.prescribedKcal) || nutrition.prescribedKcal < 0 || nutrition.prescribedKcal > 15000) {
      errors.push('Campo "prescribedKcal", quando informado, deve ser um número finito entre 0 e 15000 kcal.');
    }
  }

  // nutritionObjective: opcional, se fornecido deve ser string
  if (nutrition.nutritionObjective != null && typeof nutrition.nutritionObjective !== 'string') {
    errors.push('Campo "nutritionObjective", quando informado, deve ser uma string.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Cria uma instância validada ou normalizada de NutritionDTO
 * @param {Object} data
 * @returns {Readonly<Object>}
 */
function createNutritionDTO(data = {}) {
  const parseNum = (val, decimals = 0) => {
    if (val == null) return null;
    const n = Number(val);
    return !isNaN(n) ? Number(n.toFixed(decimals)) : null;
  };

  const dto = {
    patientId: data.patientId != null ? String(data.patientId).trim() : null,
    tmbKcal: parseNum(data.tmbKcal, 0),
    getKcal: parseNum(data.getKcal, 0),
    activityFactor: parseNum(data.activityFactor, 2),
    caloricTargetKcal: parseNum(data.caloricTargetKcal, 0),
    energyBalanceKcal: parseNum(data.energyBalanceKcal, 0),
    proteinGPerKg: parseNum(data.proteinGPerKg, 2),
    prescribedKcal: parseNum(data.prescribedKcal, 0),
    nutritionObjective: data.nutritionObjective != null ? String(data.nutritionObjective).trim() : null
  };

  return Object.freeze(dto);
}

// Suporte a CommonJS e navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateNutritionDTO,
    createNutritionDTO
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.NutritionDTO = {
    validateNutritionDTO,
    createNutritionDTO
  };
}

  });

  // ── MÓDULO: domain/contracts/TrainingPrescriptionDTO.js ──
  defineModule("domain/contracts/TrainingPrescriptionDTO.js", function(require, module, exports) {
/**
 * domain/contracts/TrainingPrescriptionDTO.js
 * 
 * Contrato Canônico de Prescrição de Treinamento.
 * Camada de Domínio Puro — Sem DOM, Sem Dexie, Sem Firebase, Sem IA.
 */

const SPLIT_SOURCES = Object.freeze(['AI', 'HUMAN', 'CONFIG', 'DETERMINISTIC']);

/**
 * Whitelist canônica e única de divisões de treinamento oficialmente suportadas pelo runtime.
 * Definida uma única vez no contrato de domínio canônico.
 */
const VALID_TRAINING_SPLITS = Object.freeze([
  'PPL',
  'UpperLower',
  'PHAT',
  'DUP',
  'FullBody',
  'ABCD',
  'ABCDE',
  'Bro Split',
  'BroSplit'
]);

/**
 * Normaliza o split para sua representação canônica única.
 * 'BroSplit' é normalizado para 'Bro Split'.
 * @param {string} split
 * @returns {string}
 */
function normalizeTrainingSplit(split) {
  if (typeof split !== 'string') return '';
  const trimmed = split.trim();
  if (trimmed.toLowerCase() === 'brosplit' || trimmed.toLowerCase() === 'bro split') {
    return 'Bro Split';
  }
  return trimmed;
}

/**
 * Validação determinística e pura de split de treinamento.
 * Responde apenas à pergunta: "Este valor representa um split oficialmente suportado?".
 * Rejeita null, undefined, '', tipos não-string e splits desconhecidos.
 * NÃO consulta DOM, Dexie, Firebase, Gemini ou routines[].
 * 
 * @param {*} split
 * @returns {{ isValid: boolean, error?: string, normalizedSplit?: string }}
 */
function validateTrainingSplit(split) {
  if (split === null || split === undefined) {
    return { isValid: false, error: 'Split de treino é obrigatório (recebido null ou undefined).' };
  }
  if (typeof split !== 'string') {
    return { isValid: false, error: `Split de treino deve ser uma string, recebido tipo "${typeof split}".` };
  }
  const trimmed = split.trim();
  if (trimmed === '') {
    return { isValid: false, error: 'Split de treino não pode ser uma string vazia.' };
  }
  const normalized = normalizeTrainingSplit(trimmed);
  const isValid = VALID_TRAINING_SPLITS.includes(trimmed) || VALID_TRAINING_SPLITS.includes(normalized);
  if (!isValid) {
    return {
      isValid: false,
      error: `Split de treino desconhecido: "${trimmed}". Splits reconhecidos: ${VALID_TRAINING_SPLITS.join(', ')}.`
    };
  }
  return { isValid: true, normalizedSplit: normalized };
}

/**
 * Validação determinística de TrainingPrescriptionDTO
 * @param {Object} prescription
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateTrainingPrescriptionDTO(prescription) {
  const errors = [];

  if (!prescription || typeof prescription !== 'object' || Array.isArray(prescription)) {
    return { isValid: false, errors: ['TrainingPrescriptionDTO deve ser um objeto.'] };
  }

  // patientId: obrigatório, string não-vazia
  if (typeof prescription.patientId !== 'string' || prescription.patientId.trim() === '') {
    errors.push('Campo "patientId" é obrigatório e deve ser uma string não-vazia.');
  }

  // split: obrigatório, validado contra whitelist única canônica
  const splitRes = validateTrainingSplit(prescription.split);
  if (!splitRes.isValid) {
    errors.push(splitRes.error);
  }

  // splitSource: obrigatório, enum ('AI' | 'HUMAN' | 'CONFIG' | 'DETERMINISTIC')
  if (!SPLIT_SOURCES.includes(prescription.splitSource)) {
    errors.push(`Campo "splitSource" inválido: recebido "${prescription.splitSource}". Valores permitidos: ${SPLIT_SOURCES.join(', ')}.`);
  }

  // frequency: obrigatório, inteiro 1 a 7
  if (typeof prescription.frequency !== 'number' || !Number.isInteger(prescription.frequency) || prescription.frequency < 1 || prescription.frequency > 7) {
    errors.push(`Campo "frequency" inválido: deve ser um número inteiro entre 1 e 7, recebido "${prescription.frequency}".`);
  }

  // routines: obrigatório, array não-vazio
  if (!Array.isArray(prescription.routines) || prescription.routines.length === 0) {
    errors.push('Campo "routines" deve ser um array não-vazio contendo as rotinas de treino.');
    return { isValid: false, errors };
  }

  prescription.routines.forEach((routine, rIdx) => {
    const rLabel = `routines[${rIdx}]`;
    if (!routine || typeof routine !== 'object' || Array.isArray(routine)) {
      errors.push(`${rLabel}: deve ser um objeto.`);
      return;
    }

    const rName = routine.routineName || routine.name;
    if (typeof rName !== 'string' || rName.trim() === '') {
      errors.push(`${rLabel}: deve possuir "routineName" como string não-vazia.`);
    }

    if (!Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push(`${rLabel}: "exercises" deve ser um array não-vazio.`);
      return;
    }

    routine.exercises.forEach((ex, eIdx) => {
      const eLabel = `${rLabel}.exercises[${eIdx}]`;
      if (!ex || typeof ex !== 'object' || Array.isArray(ex)) {
        errors.push(`${eLabel}: deve ser um objeto.`);
        return;
      }

      const exName = ex.exerciseName || ex.name;
      if (typeof exName !== 'string' || exName.trim() === '') {
        errors.push(`${eLabel}: deve possuir "exerciseName" como string não-vazia.`);
      }

      const rawSets = ex.sets;
      const numSets = typeof rawSets === 'number' ? rawSets : (typeof rawSets === 'string' && !rawSets.includes('.') ? parseInt(rawSets, 10) : NaN);
      if (!Number.isInteger(numSets) || numSets < 1) {
        errors.push(`${eLabel}.sets: deve ser um número inteiro >= 1, recebido "${rawSets}".`);
      }

      const rawReps = ex.reps != null ? String(ex.reps).trim() : '';
      if (rawReps === '') {
        errors.push(`${eLabel}.reps: deve ser uma string ou número não-vazio (ex: "8-12" ou 10).`);
      }

      if (ex.rpe != null) {
        const numRpe = Number(ex.rpe);
        if (isNaN(numRpe) || numRpe < 1 || numRpe > 10) {
          errors.push(`${eLabel}.rpe: quando informado, deve ser um número entre 1 e 10.`);
        }
      }

      if (ex.restSeconds != null) {
        const numRest = Number(ex.restSeconds);
        if (isNaN(numRest) || numRest < 0 || numRest > 600) {
          errors.push(`${eLabel}.restSeconds: quando informado, deve ser um número não-negativo em segundos (0 a 600).`);
        }
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Cria uma instância validada ou normalizada de TrainingPrescriptionDTO
 * @param {Object} data
 * @returns {Readonly<Object>}
 */
function createTrainingPrescriptionDTO(data = {}) {
  const normalizedRoutines = Array.isArray(data.routines)
    ? data.routines.map((r, rIdx) => {
        const exercises = Array.isArray(r.exercises)
          ? r.exercises.map(ex => ({
              exerciseName: String(ex.exerciseName || ex.name || '').trim(),
              sets: Number.isInteger(Number(ex.sets)) ? Number(ex.sets) : 3,
              reps: ex.reps != null ? String(ex.reps).trim() : '8-12',
              rpe: (ex.rpe != null && !isNaN(Number(ex.rpe))) ? Number(ex.rpe) : null,
              restSeconds: (ex.restSeconds != null && !isNaN(Number(ex.restSeconds))) ? Math.round(Number(ex.restSeconds)) : null
            }))
          : [];

        return {
          routineId: r.routineId || r.id || `routine_${rIdx + 1}`,
          routineName: String(r.routineName || r.name || `Treino ${rIdx + 1}`).trim(),
          day: r.day != null ? String(r.day).trim() : null,
          exercises
        };
      })
    : [];

  const rawSplit = data.split != null ? String(data.split).trim() : '';

  const dto = {
    patientId: data.patientId != null ? String(data.patientId).trim() : '',
    split: rawSplit,
    splitSource: data.splitSource || 'DETERMINISTIC',
    frequency: Number.isInteger(Number(data.frequency)) ? Number(data.frequency) : normalizedRoutines.length,
    routines: normalizedRoutines
  };

  return Object.freeze(dto);
}

// Suporte a CommonJS e navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SPLIT_SOURCES,
    VALID_TRAINING_SPLITS,
    normalizeTrainingSplit,
    validateTrainingSplit,
    validateTrainingPrescriptionDTO,
    createTrainingPrescriptionDTO
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.TrainingPrescriptionDTO = {
    SPLIT_SOURCES,
    VALID_TRAINING_SPLITS,
    normalizeTrainingSplit,
    validateTrainingSplit,
    validateTrainingPrescriptionDTO,
    createTrainingPrescriptionDTO
  };
}

  });

  // ── MÓDULO: domain/contracts/CardioPrescriptionDTO.js ──
  defineModule("domain/contracts/CardioPrescriptionDTO.js", function(require, module, exports) {
/**
 * domain/contracts/CardioPrescriptionDTO.js
 * 
 * Contrato Canônico de Prescrição de Treinamento Cardiovascular (Multi-Sessão).
 * Camada de Domínio Puro — Sem DOM, Sem Dexie, Sem Firebase, Sem IA.
 */

/**
 * Validação determinística de CardioPrescriptionDTO
 * @param {Object} prescription
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateCardioPrescriptionDTO(prescription) {
  const errors = [];

  if (!prescription || typeof prescription !== 'object' || Array.isArray(prescription)) {
    return { isValid: false, errors: ['CardioPrescriptionDTO deve ser um objeto.'] };
  }

  // patientId: obrigatório, string não-vazia
  if (typeof prescription.patientId !== 'string' || prescription.patientId.trim() === '') {
    errors.push('Campo "patientId" é obrigatório e deve ser uma string não-vazia.');
  }

  // sessions: obrigatório, array com pelo menos 1 sessão
  if (!Array.isArray(prescription.sessions) || prescription.sessions.length === 0) {
    errors.push('Campo "sessions" deve ser um array não-vazio contendo as sessões de cardio.');
    return { isValid: false, errors };
  }

  // distributionMode: se informado, deve ser string
  if (prescription.distributionMode != null && typeof prescription.distributionMode !== 'string') {
    errors.push('Campo "distributionMode", quando informado, deve ser uma string.');
  }

  // sessionDurations: se informado, deve ser array de números
  if (prescription.sessionDurations != null) {
    if (!Array.isArray(prescription.sessionDurations)) {
      errors.push('Campo "sessionDurations", quando informado, deve ser um array de números.');
    } else if (prescription.sessionDurations.some(d => typeof d !== 'number' || isNaN(d) || d <= 0)) {
      errors.push('Todos os elementos de "sessionDurations" devem ser números positivos.');
    }
  }

  prescription.sessions.forEach((session, sIdx) => {
    const sLabel = `sessions[${sIdx}]`;
    if (!session || typeof session !== 'object' || Array.isArray(session)) {
      errors.push(`${sLabel}: deve ser um objeto.`);
      return;
    }

    const cardioId = session.cardioId || session.sessionId || session.protocolId;
    if (typeof cardioId !== 'string' || cardioId.trim() === '') {
      errors.push(`${sLabel}: deve possuir "cardioId" (ou "sessionId"/"protocolId") como string não-vazia.`);
    }

    const rawDur = session.durationMinutes != null ? session.durationMinutes : session.duration;
    const numDur = typeof rawDur === 'number' ? rawDur : (typeof rawDur === 'string' ? parseInt(rawDur, 10) : NaN);
    if (!Number.isInteger(numDur) || numDur < 10 || numDur > 300) {
      errors.push(`${sLabel}.durationMinutes: deve ser um número inteiro entre 10 e 300 minutos, recebido "${rawDur}".`);
    }

    if (session.day != null && typeof session.day !== 'string') {
      errors.push(`${sLabel}.day: quando informado, deve ser uma string.`);
    }

    if (session.type != null && typeof session.type !== 'string') {
      errors.push(`${sLabel}.type: quando informado, deve ser uma string.`);
    }

    if (session.intensity != null && typeof session.intensity !== 'string') {
      errors.push(`${sLabel}.intensity: quando informado, deve ser uma string.`);
    }

    if (session.modality != null && typeof session.modality !== 'string') {
      errors.push(`${sLabel}.modality: quando informado, deve ser uma string.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Cria uma instância validada ou normalizada de CardioPrescriptionDTO
 * @param {Object} data
 * @returns {Readonly<Object>}
 */
function createCardioPrescriptionDTO(data = {}) {
  const sessions = Array.isArray(data.sessions)
    ? data.sessions.map((s, idx) => {
        const rawDur = s.durationMinutes != null ? Number(s.durationMinutes) : (s.duration != null ? Number(s.duration) : 45);
        const durationMinutes = Number.isInteger(rawDur) && rawDur > 0 ? rawDur : 45;
        const cardioId = String(s.cardioId || s.sessionId || s.protocolId || `cardio_${idx + 1}`).trim();
        const protocolId = String(s.protocolId || s.cardioId || s.sessionId || `cardio_${idx + 1}`).trim();

        return {
          cardioId,
          protocolId,
          day: s.day != null ? String(s.day).trim() : null,
          dayKey: s.dayKey != null ? String(s.dayKey).trim() : (s.day ? String(s.day).trim().toLowerCase().replace(/\s+/g, '_') : null),
          type: s.type != null ? String(s.type).trim() : null,
          durationMinutes,
          intensity: s.intensity != null ? String(s.intensity).trim() : null,
          modality: s.modality != null ? String(s.modality).trim() : (s.protocolTitle != null ? String(s.protocolTitle).trim() : null),
          heartRateZone: s.heartRateZone != null ? String(s.heartRateZone).trim() : null,
          targetBpm: s.targetBpm != null ? String(s.targetBpm).trim() : null,
          components: Array.isArray(s.components) ? s.components : null,
          isLegacy: Boolean(s.isLegacy)
        };
      })
    : [];

  const totalWeeklyMinutes = data.totalWeeklyMinutes != null && !isNaN(Number(data.totalWeeklyMinutes))
    ? Number(data.totalWeeklyMinutes)
    : sessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  const sessionDurations = Array.isArray(data.sessionDurations)
    ? data.sessionDurations.map(d => Number(d))
    : sessions.map(s => s.durationMinutes);

  const distributionMode = data.distributionMode != null ? String(data.distributionMode).trim() : 'DISTRIBUTED';
  const freq = data.frequencyWeekly != null ? Number(data.frequencyWeekly) : (data.weeklyFrequency != null ? Number(data.weeklyFrequency) : sessions.length);

  const dto = {
    patientId: data.patientId != null ? String(data.patientId).trim() : '',
    weeklyFrequency: freq,
    frequencyWeekly: freq,
    totalWeeklyMinutes,
    distributionMode,
    sessionDurations,
    sessions,
    isLegacy: Boolean(data.isLegacy),
    legacyPrescribedCardioId: data.legacyPrescribedCardioId != null ? String(data.legacyPrescribedCardioId).trim() : null
  };

  return Object.freeze(dto);
}

// Suporte a CommonJS e navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateCardioPrescriptionDTO,
    createCardioPrescriptionDTO
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.CardioPrescriptionDTO = {
    validateCardioPrescriptionDTO,
    createCardioPrescriptionDTO
  };
}

  });

  // ── MÓDULO: domain/contracts/index.js ──
  defineModule("domain/contracts/index.js", function(require, module, exports) {
/**
 * domain/contracts/index.js
 * 
 * Ponto Único de Exportação dos Contratos Canônicos de Domínio.
 * Camada Pura — NutriAx Pro.
 */

const PatientDTO = require('./PatientDTO');
const AssessmentDTO = require('./AssessmentDTO');
const NutritionDTO = require('./NutritionDTO');
const TrainingPrescriptionDTO = require('./TrainingPrescriptionDTO');
const CardioPrescriptionDTO = require('./CardioPrescriptionDTO');
const PerformanceContextDTO = require('./PerformanceContextDTO');
const NutritionPrescriptionContextDTO = require('./NutritionPrescriptionContextDTO');
const FoodSolverContract = require('./FoodSolverContract');
const MealAssemblyContract = require('./MealAssemblyContract');
const MealTimingContract = require('./MealTimingContract');
const NutrientTimingContract = require('./NutrientTimingContract');
const GlobalPrescriptionValidationContract = require('./GlobalPrescriptionValidationContract');

const contracts = {
  // Patient
  validatePatientDTO: PatientDTO.validatePatientDTO,
  createPatientDTO: PatientDTO.createPatientDTO,

  // Assessment
  validateAssessmentDTO: AssessmentDTO.validateAssessmentDTO,
  createAssessmentDTO: AssessmentDTO.createAssessmentDTO,

  // Nutrition
  validateNutritionDTO: NutritionDTO.validateNutritionDTO,
  createNutritionDTO: NutritionDTO.createNutritionDTO,

  // Training Prescription
  SPLIT_SOURCES: TrainingPrescriptionDTO.SPLIT_SOURCES,
  VALID_TRAINING_SPLITS: TrainingPrescriptionDTO.VALID_TRAINING_SPLITS,
  normalizeTrainingSplit: TrainingPrescriptionDTO.normalizeTrainingSplit,
  validateTrainingSplit: TrainingPrescriptionDTO.validateTrainingSplit,
  validateTrainingPrescriptionDTO: TrainingPrescriptionDTO.validateTrainingPrescriptionDTO,
  createTrainingPrescriptionDTO: TrainingPrescriptionDTO.createTrainingPrescriptionDTO,

  // Cardio Prescription
  validateCardioPrescriptionDTO: CardioPrescriptionDTO.validateCardioPrescriptionDTO,
  createCardioPrescriptionDTO: CardioPrescriptionDTO.createCardioPrescriptionDTO,

  // Performance Context
  validatePerformanceContextDTO: PerformanceContextDTO.validatePerformanceContextDTO,
  createPerformanceContextDTO: PerformanceContextDTO.createPerformanceContextDTO,

  // Nutrition Prescription Context (Fase N1.1)
  validateNutritionPrescriptionContextDTO: NutritionPrescriptionContextDTO.validateNutritionPrescriptionContextDTO,
  createNutritionPrescriptionContextDTO: NutritionPrescriptionContextDTO.createNutritionPrescriptionContextDTO,

  // Food Solver Contract (Fase N3.1)
  FOOD_SOLVER_CONTRACT_VERSION: FoodSolverContract.CONTRACT_VERSION,
  SOLVER_STATUS: FoodSolverContract.SOLVER_STATUS,
  BROMATOLOGY_ENERGY_STATUS: FoodSolverContract.BROMATOLOGY_ENERGY_STATUS,
  FOOD_SOURCES: FoodSolverContract.FOOD_SOURCES,
  UNIT_CONVERSION_POLICY: FoodSolverContract.UNIT_CONVERSION_POLICY,
  PRECISION_POLICY: FoodSolverContract.PRECISION_POLICY,
  validateCanonicalFoodDTO: FoodSolverContract.validateCanonicalFoodDTO,
  createCanonicalFoodDTO: FoodSolverContract.createCanonicalFoodDTO,
  validateFoodSolverInput: FoodSolverContract.validateFoodSolverInput,
  validateFoodSolverOutput: FoodSolverContract.validateFoodSolverOutput,

  // Meal Assembly Contract (Fase N3.3)
  MEAL_ASSEMBLY_CONTRACT_VERSION: MealAssemblyContract.CONTRACT_VERSION,
  ASSEMBLY_STATUS: MealAssemblyContract.ASSEMBLY_STATUS,
  MEAL_ROLES: MealAssemblyContract.MEAL_ROLES,
  extractGlobalSolutionItems: MealAssemblyContract.extractGlobalSolutionItems,
  validateMealAssemblyInput: MealAssemblyContract.validateMealAssemblyInput,
  validateMealAssemblyOutput: MealAssemblyContract.validateMealAssemblyOutput,

  // Meal Timing Contract (Fase N3.4)
  MEAL_TIMING_CONTRACT_VERSION: MealTimingContract.CONTRACT_VERSION,
  TIMING_STATUS: MealTimingContract.TIMING_STATUS,
  WINDOW_STRENGTH: MealTimingContract.WINDOW_STRENGTH,
  TEMPORAL_STATUS: MealTimingContract.TEMPORAL_STATUS,
  TIMING_SOURCES: MealTimingContract.TIMING_SOURCES,
  TEMPORAL_EVENT_TYPES: MealTimingContract.TEMPORAL_EVENT_TYPES,
  validateMealTimingInput: MealTimingContract.validateMealTimingInput,
  validateMealTimingOutput: MealTimingContract.validateMealTimingOutput,

  // Nutrient Timing Contract (Fase N3.5)
  NUTRIENT_TIMING_CONTRACT_VERSION: NutrientTimingContract.CONTRACT_VERSION,
  TIMING_ANALYSIS_VERSION: NutrientTimingContract.TIMING_ANALYSIS_VERSION,
  NUTRIENT_TIMING_STATUS: NutrientTimingContract.NUTRIENT_TIMING_STATUS,
  TEMPORAL_PRIMARY_RELATION: NutrientTimingContract.TEMPORAL_PRIMARY_RELATION,
  TEMPORAL_SECONDARY_RELATION: NutrientTimingContract.TEMPORAL_SECONDARY_RELATION,
  EVENT_RELATIONS: NutrientTimingContract.EVENT_RELATIONS,
  validateNutrientTimingInput: NutrientTimingContract.validateNutrientTimingInput,
  validateNutrientTimingOutput: NutrientTimingContract.validateNutrientTimingOutput,

  // Global Prescription Validation Contract (Fase N3.6)
  GLOBAL_VALIDATION_CONTRACT_VERSION: GlobalPrescriptionValidationContract.CONTRACT_VERSION,
  GLOBAL_VALIDATION_VERSION: GlobalPrescriptionValidationContract.GLOBAL_VALIDATION_VERSION,
  GLOBAL_VALIDATION_STATUS: GlobalPrescriptionValidationContract.GLOBAL_VALIDATION_STATUS,
  GLOBAL_GATE_ID: GlobalPrescriptionValidationContract.GLOBAL_GATE_ID,
  GATE_SEVERITY: GlobalPrescriptionValidationContract.GATE_SEVERITY,
  validateGlobalPrescriptionValidationInput: GlobalPrescriptionValidationContract.validateGlobalPrescriptionValidationInput,
  validateGlobalPrescriptionValidationOutput: GlobalPrescriptionValidationContract.validateGlobalPrescriptionValidationOutput
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = contracts;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  Object.assign(window.NutriDomain, contracts);
}

  });

  // ── MÓDULO: domain/contracts/PerformanceContextDTO.js ──
  defineModule("domain/contracts/PerformanceContextDTO.js", function(require, module, exports) {
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

  });

  // ── MÓDULO: domain/contracts/NutritionPrescriptionContextDTO.js ──
  defineModule("domain/contracts/NutritionPrescriptionContextDTO.js", function(require, module, exports) {
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
  const preferences = {
    preferredFoods: Array.isArray(rawPrefs.preferredFoods) ? [...new Set(rawPrefs.preferredFoods.filter(Boolean).map(String))] : [],
    dietaryStyle: rawPrefs.dietaryStyle ? String(rawPrefs.dietaryStyle).trim() : null,
    mealFrequency: rawPrefs.mealFrequency != null ? rawPrefs.mealFrequency : null
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

  });

  // ── MÓDULO: domain/contracts/FoodSolverContract.js ──
  defineModule("domain/contracts/FoodSolverContract.js", function(require, module, exports) {
/**
 * domain/contracts/FoodSolverContract.js
 * 
 * Contrato Canônico de Alimentos e Especificação de I/O do Food Solver — NutriAx Pro.
 * Fase N3.1 — Auditoria Estrutural e Especificação de Contrato Canônico (Revisada).
 * 
 * Camada Pura — Zero DOM, Zero Dexie/Firebase, Zero Gemini, Zero Algoritmo de Solver.
 * 
 * Princípios Arquiteturais (Fase N3.1):
 * 1. PUREZA ABSOLUTA: Funções puras de validação e normalização de contratos.
 * 2. IMUTABILIDADE: Objetos retornados são profundamente congelados (deepFreeze).
 * 3. IDENTIDADE CANÔNICA: O identificador único (id / foodId) é a chave primária estrita. foodName NÃO é chave.
 * 4. FONTE ÚNICA DE CONTEXTO: NutritionPrescriptionContextDTO (N1.1) é a fonte de verdade soberana.
 *    Preferências e restrições operacionais são projeções diretas dele, nunca uma fonte independente.
 * 5. PORTÃO ESTRITO: O solver só aceita execuções com validationResult.valid === true (Fase N2.3).
 * 6. POLÍTICA DE UNIDADES: Massa direta (g), volume (ml requer densidade formal, sem assumir 1ml=1g).
 * 7. MEDIDAS CASEIRAS: Solver automático exige conversão específica; fallbacks genéricos são inelegíveis.
 * 8. PRECISÃO MATEMÁTICA: Ponto flutuante contínuo no solver interno; arredondamento apenas na saída final.
 */

/**
 * Congelamento profundo e recursivo de objetos
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
 * Versão da especificação do contrato da Fase N3.1
 */
const FOOD_SOLVER_CONTRACT_VERSION = '1.0.0';

/**
 * Status possíveis de execução do Solver
 */
const SOLVER_STATUS = Object.freeze({
  PASS: 'PASS',
  WARNING: 'WARNING',
  NO_SOLUTION: 'NO_SOLUTION',
  BLOCKED: 'BLOCKED',
  // N3.7.5: Limite computacional de busca atingido antes de examinar todas as combinações.
  // Indica que a melhor solução encontrada até o ponto de interrupção foi retornada (quando
  // returnBestPartial=true), ou que não há solução disponível (quando returnBestPartial=false).
  // O orchestrator NUNCA persiste um resultado com este status como prescrição validada.
  SEARCH_LIMIT_REACHED: 'SEARCH_LIMIT_REACHED'
});

/**
 * Classificação bromatológica centesimal de energia no catálogo
 * Documentação analítica dos estados:
 * - CONSISTENTE: Discrepância Atwater <= 5% em relação ao rótulo/tabela original.
 * - REVISAR: Discrepância Atwater entre 5% e 10%.
 * - INCONSISTENTE: Discrepância Atwater > 10% nos dados de origem (TBCA/TACO).
 * (Nota: Estes status são documentados para governança. A política de elegibilidade será definida na N3.2).
 */
const BROMATOLOGY_ENERGY_STATUS = Object.freeze({
  CONSISTENTE: 'CONSISTENTE',
  REVISAR: 'REVISAR',
  INCONSISTENTE: 'INCONSISTENTE'
});

/**
 * Fontes conhecidas de alimentos
 */
const FOOD_SOURCES = Object.freeze({
  TACO: 'TACO',
  TBCA: 'TBCA',
  COMMERCIAL: 'Rótulo Comercial',
  CUSTOM: 'Custom',
  MANUAL: 'Manual'
});

/**
 * Tipos de unidades e políticas formais de conversão para o Solver
 */
const UNIT_CONVERSION_POLICY = Object.freeze({
  // Massa direta: g e kg têm conversão direta trivial para gramas
  MASS_UNITS: Object.freeze(['g', 'kg']),
  
  // Volume: ml e l representam volume. NÃO se deve assumir 1 ml = 1 g universalmente.
  // Conversão volume -> massa requer densidade específica formal (rho em g/ml).
  VOLUME_UNITS: Object.freeze(['ml', 'l']),

  // Política para medidas caseiras no Solver Automático:
  // 1. gramPerUnit específico do alimento
  // 2. foodUnitWeights específico do alimento
  // 3. outra conversão formal específica disponível
  // 4. ausência de conversão específica -> unidade NÃO elegível para o solver automático
  // (Fallbacks genéricos da UI manual são expressamente NÃO preferenciais para o solver).
  HOUSEHOLD_SOLVER_ELIGIBILITY: Object.freeze({
    REQUIRE_SPECIFIC_CONVERSION: true,
    ALLOW_GENERIC_FALLBACK: false
  })
});

/**
 * Política de Precisão Numérica
 */
const PRECISION_POLICY = Object.freeze({
  // Precisão interna do algoritmo de otimização: ponto flutuante contínuo de 64 bits (IEEE 754)
  SOLVER_INTERNAL: 'IEEE_754_FLOAT64_CONTINUOUS',
  
  // Precisão de exibição e prescrição na UI: arredondamento na saída final
  PRESCRIPTION_UI_MASS: 'INTEGER_OR_ONE_DECIMAL', // ex: 150g ou 150.5g
  PRESCRIPTION_UI_MACROS: 'TWO_DECIMALS'          // conforme calculateMacroPortion()
});

/**
 * Valida a conformidade estrutural de um alimento com o Contrato Canônico de Alimentos (CanonicalFoodDTO)
 * 
 * Regras de Obrigatoriedade:
 * - REQUIRED: id (string não-vazia), name (string não-vazia), baseQuantity (number > 0),
 *             unit (string não-vazia), calories (number >= 0, finito), protein (number >= 0, finito),
 *             carbohydrate (number >= 0, finito), lipid (number >= 0, finito).
 * - OPTIONAL: category, source, brand, prepState, gramPerUnit, density, fiber, sodium, bromatology.
 * - INVALID: valores negativos, NaN, Infinity, tipos incompatíveis.
 * 
 * @param {Object} food 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateCanonicalFoodDTO(food) {
  const errors = [];

  if (!food || typeof food !== 'object' || Array.isArray(food)) {
    return { isValid: false, errors: ['O registro de alimento deve ser um objeto válido e não-nulo.'] };
  }

  // 1. Identidade e Denominação (REQUIRED)
  // foodId é a chave primária operacional obrigatória. foodName NÃO pode ser chave primária.
  const foodId = food.id || food.foodId;
  if (!foodId || typeof foodId !== 'string' || foodId.trim() === '') {
    errors.push('id (ou foodId) é obrigatório e deve ser uma string não-vazia.');
  }

  const foodName = food.name || food.foodName;
  if (!foodName || typeof foodName !== 'string' || foodName.trim() === '') {
    errors.push('name (ou foodName) é obrigatório e deve ser uma string não-vazia.');
  }

  // 2. Base e Unidade (REQUIRED)
  const baseQty = food.baseQuantity !== undefined ? food.baseQuantity : 100;
  if (typeof baseQty !== 'number' || !Number.isFinite(baseQty) || baseQty <= 0) {
    errors.push('baseQuantity deve ser um número finito positivo (geralmente 100).');
  }

  const unit = food.unit || food.baseUnit;
  if (!unit || typeof unit !== 'string' || unit.trim() === '') {
    errors.push('unit (ou baseUnit) é obrigatório e deve ser uma string não-vazia (ex: "g" ou "ml").');
  }

  // 3. Macronutrientes e Calorias (REQUIRED)
  const calories = food.calories !== undefined ? food.calories : food.kcalPer100;
  if (typeof calories !== 'number' || !Number.isFinite(calories) || calories < 0) {
    errors.push('calories (ou kcalPer100) é obrigatório, numérico finito e >= 0.');
  }

  const protein = food.protein !== undefined ? food.protein : food.protPer100;
  if (typeof protein !== 'number' || !Number.isFinite(protein) || protein < 0) {
    errors.push('protein (ou protPer100) é obrigatório, numérico finito e >= 0.');
  }

  const carbohydrate = food.carbohydrate !== undefined ? food.carbohydrate : food.carbPer100;
  if (typeof carbohydrate !== 'number' || !Number.isFinite(carbohydrate) || carbohydrate < 0) {
    errors.push('carbohydrate (ou carbPer100) é obrigatório, numérico finito e >= 0.');
  }

  const lipid = food.lipid !== undefined ? food.lipid : (food.lipPer100 !== undefined ? food.lipPer100 : food.lipidPer100);
  if (typeof lipid !== 'number' || !Number.isFinite(lipid) || lipid < 0) {
    errors.push('lipid (ou lipidPer100 / lipPer100) é obrigatório, numérico finito e >= 0.');
  }

  // 4. Campos Opcionais / Especiais
  // gramPerUnit
  if (food.gramPerUnit !== undefined && food.gramPerUnit !== null) {
    if (typeof food.gramPerUnit !== 'number' || !Number.isFinite(food.gramPerUnit) || food.gramPerUnit <= 0) {
      errors.push('gramPerUnit, quando fornecido, deve ser um número finito positivo.');
    }
  }

  // density (g/ml para conversão de volume)
  if (food.density !== undefined && food.density !== null) {
    if (typeof food.density !== 'number' || !Number.isFinite(food.density) || food.density <= 0) {
      errors.push('density, quando fornecido, deve ser um número finito positivo representando g/ml.');
    }
  }

  // fiber
  const fiber = food.fiber !== undefined ? food.fiber : food.fiberPer100;
  if (fiber !== undefined && fiber !== null) {
    if (typeof fiber !== 'number' || !Number.isFinite(fiber) || fiber < 0) {
      errors.push('fiber, quando fornecido, deve ser um número finito >= 0.');
    }
  }

  // sodium
  const sodium = food.sodium !== undefined ? food.sodium : food.sodiumPer100;
  if (sodium !== undefined && sodium !== null) {
    if (typeof sodium !== 'number' || !Number.isFinite(sodium) || sodium < 0) {
      errors.push('sodium, quando fornecido, deve ser um número finito >= 0.');
    }
  }

  // category, source, brand, prepState
  ['category', 'source', 'brand', 'prepState'].forEach((field) => {
    if (food[field] !== undefined && food[field] !== null && typeof food[field] !== 'string') {
      errors.push(`${field}, quando fornecido, deve ser uma string ou null.`);
    }
  });

  // bromatology
  if (food.bromatology !== undefined && food.bromatology !== null) {
    if (typeof food.bromatology !== 'object' || Array.isArray(food.bromatology)) {
      errors.push('bromatology, quando fornecido, deve ser um objeto.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Cria um CanonicalFoodDTO normalizado e profundamente congelado
 * @param {Object} rawFood 
 * @returns {Object} CanonicalFoodDTO
 */
function createCanonicalFoodDTO(rawFood) {
  const validation = validateCanonicalFoodDTO(rawFood);
  if (!validation.isValid) {
    throw new Error(`Dados inválidos para CanonicalFoodDTO: ${validation.errors.join('; ')}`);
  }

  const foodId = String(rawFood.id || rawFood.foodId).trim();
  const isCustom = foodId.startsWith('cust_') || rawFood.isCustom === true || rawFood.source === 'Custom' || rawFood.source === 'Manual';

  const calories = Number(rawFood.calories !== undefined ? rawFood.calories : rawFood.kcalPer100);
  const protein = Number(rawFood.protein !== undefined ? rawFood.protein : rawFood.protPer100);
  const carbohydrate = Number(rawFood.carbohydrate !== undefined ? rawFood.carbohydrate : rawFood.carbPer100);
  const lipid = Number(rawFood.lipid !== undefined ? rawFood.lipid : (rawFood.lipPer100 !== undefined ? rawFood.lipPer100 : rawFood.lipidPer100));

  const fiberVal = rawFood.fiber !== undefined ? rawFood.fiber : rawFood.fiberPer100;
  const fiber = fiberVal !== undefined && fiberVal !== null ? Number(fiberVal) : null;

  const sodiumVal = rawFood.sodium !== undefined ? rawFood.sodium : rawFood.sodiumPer100;
  const sodium = sodiumVal !== undefined && sodiumVal !== null ? Number(sodiumVal) : null;

  const gramPerUnit = rawFood.gramPerUnit !== undefined && rawFood.gramPerUnit !== null ? Number(rawFood.gramPerUnit) : null;
  const density = rawFood.density !== undefined && rawFood.density !== null ? Number(rawFood.density) : null;

  const dto = {
    id: foodId,
    name: String(rawFood.name || rawFood.foodName).trim(),
    category: rawFood.category ? String(rawFood.category).trim() : null,
    source: rawFood.source ? String(rawFood.source).trim() : (isCustom ? 'Custom' : null),
    brand: rawFood.brand ? String(rawFood.brand).trim() : null,
    prepState: rawFood.prepState ? String(rawFood.prepState).trim() : null,
    baseQuantity: rawFood.baseQuantity !== undefined ? Number(rawFood.baseQuantity) : 100,
    unit: String(rawFood.unit || rawFood.baseUnit || 'g').trim(),
    gramPerUnit,
    density,
    calories,
    protein,
    carbohydrate,
    lipid,
    fiber,
    sodium,
    isCustom,
    bromatology: rawFood.bromatology ? { ...rawFood.bromatology } : null
  };

  return deepFreeze(dto);
}

/**
 * Valida o Contrato de Entrada do Food Solver (FoodSolverInputDTO)
 * 
 * Regras Canônicas de Governança:
 * 1. context: OBRIGATÓRIO (NutritionPrescriptionContextDTO). É a ÚNICA fonte de verdade clínica e nutricional.
 * 2. energyTarget: OBRIGATÓRIO (resultado da Fase N2.1).
 * 3. macroTarget: OBRIGATÓRIO (resultado da Fase N2.2).
 * 4. validationResult: OBRIGATÓRIO (resultado da Fase N2.3). Se valid !== true, o solver é BLOQUEADO.
 * 5. foodCatalog: OBRIGATÓRIO (catálogo de alimentos operacionais de db.foods). Array não-vazio ou repositório.
 * 6. options: Opcional. Opções operacionais de execução do algoritmo (ex: mealCount).
 *    Avisos de governança: constraints e preferences não podem contradizer o context canônico.
 * 
 * @param {Object} input 
 * @returns {{ isValid: boolean, isBlocked: boolean, errors: string[] }}
 */
function validateFoodSolverInput(input) {
  const errors = [];
  let isBlocked = false;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { isValid: false, isBlocked: true, errors: ['Input do Solver deve ser um objeto válido e não-nulo.'] };
  }

  // 1. Contexto Canônico (N1.1) — FONTE ÚNICA DE VERDADE CLÍNICA
  if (!input.context || typeof input.context !== 'object' || Array.isArray(input.context)) {
    errors.push('context é obrigatório e deve ser um objeto NutritionPrescriptionContextDTO válido (fonte única de verdade clínica).');
    isBlocked = true;
  }

  // 2. Meta Energética (N2.1)
  if (!input.energyTarget || typeof input.energyTarget !== 'object') {
    errors.push('energyTarget é obrigatório (resultado determinístico da Fase N2.1).');
    isBlocked = true;
  } else {
    const kcal = input.energyTarget.caloricTargetKcal;
    if (typeof kcal !== 'number' || !Number.isFinite(kcal) || kcal <= 0) {
      errors.push('energyTarget.caloricTargetKcal deve ser um número finito positivo.');
      isBlocked = true;
    }
  }

  // 3. Metas de Macros (N2.2)
  if (!input.macroTarget || typeof input.macroTarget !== 'object') {
    errors.push('macroTarget é obrigatório (resultado determinístico da Fase N2.2).');
    isBlocked = true;
  } else {
    const { proteinTargetG, carbohydrateTargetG, fatTargetG } = input.macroTarget;
    if (typeof proteinTargetG !== 'number' || !Number.isFinite(proteinTargetG) || proteinTargetG < 0) {
      errors.push('macroTarget.proteinTargetG deve ser um número finito >= 0.');
      isBlocked = true;
    }
    if (typeof carbohydrateTargetG !== 'number' || !Number.isFinite(carbohydrateTargetG) || carbohydrateTargetG < 0) {
      errors.push('macroTarget.carbohydrateTargetG deve ser um número finito >= 0.');
      isBlocked = true;
    }
    if (typeof fatTargetG !== 'number' || !Number.isFinite(fatTargetG) || fatTargetG < 0) {
      errors.push('macroTarget.fatTargetG deve ser um número finito >= 0.');
      isBlocked = true;
    }
  }

  // 4. Validador Prévio (N2.3) — PORTÃO DE SEGURANÇA ABSOLUTO
  if (!input.validationResult || typeof input.validationResult !== 'object') {
    errors.push('validationResult é obrigatório (resultado do validador prévio da Fase N2.3).');
    isBlocked = true;
  } else if (input.validationResult.valid !== true) {
    errors.push('O validador prévio (N2.3) deve possuir status valid === true para autorizar o Food Solver.');
    isBlocked = true;
  }

  // 5. Catálogo Operacional
  if (!input.foodCatalog) {
    errors.push('foodCatalog é obrigatório (catálogo de alimentos operacionais oriundos de db.foods).');
    isBlocked = true;
  } else if (Array.isArray(input.foodCatalog)) {
    if (input.foodCatalog.length === 0) {
      errors.push('foodCatalog fornecido como array não pode estar vazio.');
      isBlocked = true;
    }
  } else if (typeof input.foodCatalog !== 'function' && typeof input.foodCatalog !== 'object') {
    errors.push('foodCatalog deve ser um Array de alimentos ou um repositório com método de consulta.');
    isBlocked = true;
  }

  return {
    isValid: errors.length === 0,
    isBlocked,
    errors
  };
}

/**
 * Valida o Contrato de Saída do Food Solver (FoodSolverOutputDTO)
 * 
 * Regras:
 * - solverVersion: string não-vazia genérica (a versão concreta N3.2.x só é definida na implementação).
 * - status: PASS | WARNING | BLOCKED.
 * - meals: array de refeições geradas.
 * - totals, target, differences: blocos nutricionais com números finitos.
 * 
 * @param {Object} output 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateFoodSolverOutput(output) {
  const errors = [];

  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return { isValid: false, errors: ['Output do Solver deve ser um objeto válido e não-nulo.'] };
  }

  // 1. Status e Validade
  if (!output.status || !Object.values(SOLVER_STATUS).includes(output.status)) {
    errors.push(`status deve ser um dos valores: ${Object.values(SOLVER_STATUS).join(', ')}.`);
  }
  if (typeof output.valid !== 'boolean') {
    errors.push('valid deve ser um booleano.');
  }

  // 2. Refeições
  if (!Array.isArray(output.meals)) {
    errors.push('meals deve ser um array de refeições geradas.');
  }

  // 3. Totais, Metas e Diferenças
  const requiredNutritionBlocks = ['totals', 'target', 'differences'];
  requiredNutritionBlocks.forEach((block) => {
    if (!output[block] || typeof output[block] !== 'object') {
      errors.push(`${block} deve ser um objeto com valores nutricionais.`);
    } else {
      ['calories', 'protein', 'carbohydrate', 'fat'].forEach((nutrient) => {
        const val = output[block][nutrient];
        if (typeof val !== 'number' || !Number.isFinite(val)) {
          errors.push(`${block}.${nutrient} deve ser um número finito.`);
        }
      });
    }
  });

  // 4. Rastreabilidade e Diagnósticos
  if (!Array.isArray(output.foodProvenance)) {
    errors.push('foodProvenance deve ser um array de procedência de alimentos.');
  }
  if (!Array.isArray(output.solverDiagnostics)) {
    errors.push('solverDiagnostics deve ser um array de diagnósticos.');
  }
  if (!Array.isArray(output.warnings)) {
    errors.push('warnings deve ser um array de avisos.');
  }
  if (!Array.isArray(output.blockingReasons)) {
    errors.push('blockingReasons deve ser um array de motivos de bloqueio.');
  }

  // 5. Versionamento genérico (string não-vazia, sem fixar número na N3.1)
  if (!output.solverVersion || typeof output.solverVersion !== 'string' || output.solverVersion.trim() === '') {
    errors.push('solverVersion é obrigatório e deve ser uma string não-vazia informando a versão do solver.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

const FoodSolverContract = {
  CONTRACT_VERSION: FOOD_SOLVER_CONTRACT_VERSION,
  SOLVER_STATUS,
  BROMATOLOGY_ENERGY_STATUS,
  FOOD_SOURCES,
  UNIT_CONVERSION_POLICY,
  PRECISION_POLICY,
  deepFreeze,
  validateCanonicalFoodDTO,
  createCanonicalFoodDTO,
  validateFoodSolverInput,
  validateFoodSolverOutput
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FoodSolverContract;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.FoodSolverContract = FoodSolverContract;
}

  });

  // ── MÓDULO: domain/contracts/MealAssemblyContract.js ──
  defineModule("domain/contracts/MealAssemblyContract.js", function(require, module, exports) {
/**
 * domain/contracts/MealAssemblyContract.js
 * 
 * Contrato Canônico de Entrada e Saída do Meal Assembly — NutriAx Pro.
 * Fase N3.3 — Meal Assembly Determinístico Canônico.
 * 
 * Camada Pura — Sem I/O, sem UI, sem dependências externas.
 */

'use strict';

const MEAL_ASSEMBLY_CONTRACT_VERSION = '1.0.0';

/**
 * Status formais de saída do Meal Assembly
 */
const ASSEMBLY_STATUS = Object.freeze({
  PASS: 'PASS',
  WARNING: 'WARNING',
  NO_SOLUTION: 'NO_SOLUTION',
  BLOCKED: 'BLOCKED'
});

/**
 * Papéis computacionais de refeição (não clínicos, não temporais)
 */
const MEAL_ROLES = Object.freeze({
  PRIMARY: 'PRIMARY',
  SECONDARY: 'SECONDARY',
  SNACK: 'SNACK',
  FLEXIBLE: 'FLEXIBLE'
});

/**
 * Congelamento profundo determinístico e recursivo
 * @param {Object} obj 
 * @returns {Object}
 */
function deepFreeze(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Object.isFrozen(obj)) return obj;

  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const val = obj[prop];
    if (val !== null && (typeof val === 'object' || typeof val === 'function') && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  });

  return obj;
}

/**
 * Extrai deterministicamente a lista canônica de itens da solução global do N3.2
 * @param {Object} foodSolverResult 
 * @returns {Array<Object>} Lista normalizada de itens globais
 */
function extractGlobalSolutionItems(foodSolverResult) {
  if (!foodSolverResult || typeof foodSolverResult !== 'object') {
    return [];
  }

  let rawItems = [];

  // Forma 1: foodSolverResult.items explícito no contrato
  if (Array.isArray(foodSolverResult.items) && foodSolverResult.items.length > 0) {
    rawItems = foodSolverResult.items;
  }
  // Forma 2: foodSolverResult.meals canônico do N3.2 (ex: meals[0].items ou flatten de meals)
  else if (Array.isArray(foodSolverResult.meals) && foodSolverResult.meals.length > 0) {
    for (let m = 0; m < foodSolverResult.meals.length; m++) {
      const meal = foodSolverResult.meals[m];
      if (meal && Array.isArray(meal.items)) {
        rawItems.push(...meal.items);
      }
    }
  }

  const normalized = [];
  for (let i = 0; i < rawItems.length; i++) {
    const it = rawItems[i];
    if (!it || typeof it !== 'object') continue;

    const foodId = String(it.foodId || it.id || '').trim();
    const foodName = String(it.foodName || it.name || '').trim();
    const rawGrams = it.grams !== undefined ? it.grams : it.quantity;
    const grams = typeof rawGrams === 'number' && Number.isFinite(rawGrams) ? rawGrams : 0;
    const unit = String(it.unit || 'g').trim();

    const rawNutrients = it.nutrients || {};
    const calories = typeof rawNutrients.calories === 'number' && Number.isFinite(rawNutrients.calories) ? rawNutrients.calories : 0;
    const protein = typeof rawNutrients.protein === 'number' && Number.isFinite(rawNutrients.protein) ? rawNutrients.protein : 0;
    const carbohydrate = typeof rawNutrients.carbohydrate === 'number' && Number.isFinite(rawNutrients.carbohydrate) ? rawNutrients.carbohydrate : 0;
    const lipidVal = rawNutrients.lipid !== undefined ? rawNutrients.lipid : rawNutrients.fat;
    const lipid = typeof lipidVal === 'number' && Number.isFinite(lipidVal) ? lipidVal : 0;
    const fiber = typeof rawNutrients.fiber === 'number' && Number.isFinite(rawNutrients.fiber) ? rawNutrients.fiber : 0;

    // Preservação de dados ausentes de sódio (não converter null/undefined para zero)
    let sodium = null;
    if (typeof rawNutrients.sodium === 'number' && Number.isFinite(rawNutrients.sodium)) {
      sodium = rawNutrients.sodium;
    }

    normalized.push({
      foodId,
      foodName,
      grams,
      unit,
      nutrients: {
        calories,
        protein,
        carbohydrate,
        lipid,
        fiber,
        sodium
      },
      provenance: it.provenance || null
    });
  }

  return deepFreeze(normalized);
}

/**
 * Valida o Contrato de Entrada MealAssemblyInputDTO
 * @param {Object} input 
 * @returns {{ isValid: boolean, isBlocked: boolean, isNoSolution: boolean, errors: string[] }}
 */
function validateMealAssemblyInput(input) {
  const errors = [];
  let isBlocked = false;
  let isNoSolution = false;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      isBlocked: true,
      isNoSolution: false,
      errors: ['Input de Meal Assembly deve ser um objeto válido e não-nulo.']
    };
  }

  // 1. Contexto Clínico Canônico
  if (!input.context || typeof input.context !== 'object') {
    errors.push('context é obrigatório e deve ser um objeto.');
    isBlocked = true;
  }

  // 2. Validador Nutricional N2.3 (Portão de Entrada Inegociável)
  if (!input.validationResult || typeof input.validationResult !== 'object') {
    errors.push('validationResult é obrigatório (portão de validação N2.3).');
    isBlocked = true;
  } else if (input.validationResult.valid !== true) {
    errors.push(`validationResult.valid deve ser true para avançar para montagem de refeições (status: ${input.validationResult.status || 'INVALID'}).`);
    isBlocked = true;
  }

  // 3. Resultado do Food Solver N3.2
  if (!input.foodSolverResult || typeof input.foodSolverResult !== 'object') {
    errors.push('foodSolverResult é obrigatório.');
    isBlocked = true;
  } else {
    const solverStatus = input.foodSolverResult.status;
    if (solverStatus === 'BLOCKED') {
      errors.push('foodSolverResult está com status BLOCKED.');
      isBlocked = true;
    } else if (solverStatus === 'NO_SOLUTION') {
      errors.push('foodSolverResult está com status NO_SOLUTION.');
      isNoSolution = true;
    } else if (solverStatus !== 'PASS' && solverStatus !== 'WARNING') {
      errors.push(`foodSolverResult possui status inválido ou desconhecido: ${solverStatus}.`);
      isBlocked = true;
    }

    // 4. Verificação dos itens produzidos pelo solver
    const items = extractGlobalSolutionItems(input.foodSolverResult);
    if (!isBlocked && !isNoSolution) {
      if (!Array.isArray(items) || items.length === 0) {
        errors.push('foodSolverResult não contém itens de alimentos válidos para montagem.');
        isBlocked = true;
      } else {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item.foodId || typeof item.foodId !== 'string') {
            errors.push(`Item de índice ${i} não possui foodId válido.`);
            isBlocked = true;
          }
          if (typeof item.grams !== 'number' || !Number.isFinite(item.grams) || item.grams <= 0) {
            errors.push(`Item '${item.foodId || i}' possui quantidade de massa inválida ou <= 0 (${item.grams}).`);
            isBlocked = true;
          }
          if (!item.nutrients || typeof item.nutrients !== 'object') {
            errors.push(`Item '${item.foodId || i}' não possui bloco de nutrientes válido.`);
            isBlocked = true;
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    isBlocked,
    isNoSolution,
    errors
  };
}

/**
 * Valida a estrutura de saída do MealAssemblyOutputDTO
 * @param {Object} output 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateMealAssemblyOutput(output) {
  const errors = [];

  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return { isValid: false, errors: ['Output de Meal Assembly deve ser um objeto válido.'] };
  }

  if (!output.assemblyVersion || typeof output.assemblyVersion !== 'string') {
    errors.push('assemblyVersion é obrigatório e deve ser uma string.');
  }

  if (!output.solverVersion || typeof output.solverVersion !== 'string') {
    errors.push('solverVersion é obrigatório e deve ser uma string informando a versão de origem do solver.');
  }

  if (!output.status || !Object.values(ASSEMBLY_STATUS).includes(output.status)) {
    errors.push(`status deve ser um dos valores: ${Object.values(ASSEMBLY_STATUS).join(', ')}.`);
  }

  if (typeof output.valid !== 'boolean') {
    errors.push('valid deve ser um booleano.');
  }

  if (!Array.isArray(output.meals)) {
    errors.push('meals deve ser um array de refeições.');
  }

  if (!output.globalTotals || typeof output.globalTotals !== 'object') {
    errors.push('globalTotals deve ser um objeto de totais nutricionais.');
  }

  ['diagnostics', 'warnings', 'blockingReasons'].forEach((field) => {
    if (!Array.isArray(output[field])) {
      errors.push(`${field} deve ser um array.`);
    }
  });

  if (!output.provenance || typeof output.provenance !== 'object') {
    errors.push('provenance deve ser um objeto com metadados de execução.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

const MealAssemblyContract = {
  CONTRACT_VERSION: MEAL_ASSEMBLY_CONTRACT_VERSION,
  ASSEMBLY_STATUS,
  MEAL_ROLES,
  deepFreeze,
  extractGlobalSolutionItems,
  validateMealAssemblyInput,
  validateMealAssemblyOutput
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MealAssemblyContract;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.MealAssemblyContract = MealAssemblyContract;
}

  });

  // ── MÓDULO: domain/contracts/MealTimingContract.js ──
  defineModule("domain/contracts/MealTimingContract.js", function(require, module, exports) {
/**
 * domain/contracts/MealTimingContract.js
 * 
 * Contrato Canônico de Entrada e Saída do Meal Timing — NutriAx Pro.
 * Fase N3.4 — Meal Timing / Distribuição Temporal Determinística.
 * 
 * Camada Pura — Sem I/O, sem UI, sem dependências externas.
 */

'use strict';

const MEAL_TIMING_CONTRACT_VERSION = '1.0.0';

/**
 * Status formais de saída do Meal Timing
 */
const TIMING_STATUS = Object.freeze({
  PASS: 'PASS',
  WARNING: 'WARNING',
  BLOCKED: 'BLOCKED'
});

/**
 * Força da janela temporal (HARD bloqueia se violada; PREFERRED apenas orienta)
 */
const WINDOW_STRENGTH = Object.freeze({
  HARD: 'HARD',
  PREFERRED: 'PREFERRED'
});

/**
 * Status individual de agendamento de cada refeição
 */
const TEMPORAL_STATUS = Object.freeze({
  CONFIRMED: 'CONFIRMED',
  ADJUSTED: 'ADJUSTED',
  FALLBACK: 'FALLBACK'
});

/**
 * Origem auditável do posicionamento temporal
 */
const TIMING_SOURCES = Object.freeze({
  STRUCTURED_ROUTINE: 'STRUCTURED_ROUTINE',
  FASTING_PROTOCOL: 'FASTING_PROTOCOL',
  STRUCTURED_TRAINING: 'STRUCTURED_TRAINING',
  STRUCTURED_CARDIO: 'STRUCTURED_CARDIO',
  PREFERRED_DISTRIBUTION: 'PREFERRED_DISTRIBUTION',
  POLICY_FALLBACK: 'POLICY_FALLBACK'
});

/**
 * Tipos computacionais de eventos temporais (não dietéticos)
 */
const TEMPORAL_EVENT_TYPES = Object.freeze({
  TRAINING: 'TRAINING',
  CARDIO: 'CARDIO',
  SLEEP: 'SLEEP',
  WORK: 'WORK',
  FASTING: 'FASTING'
});

/**
 * Congelamento profundo determinístico e recursivo
 * @param {Object} obj 
 * @returns {Object}
 */
function deepFreeze(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Object.isFrozen(obj)) return obj;

  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const val = obj[prop];
    if (val !== null && (typeof val === 'object' || typeof val === 'function') && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  });

  return obj;
}

/**
 * Valida o Contrato de Entrada MealTimingInputDTO
 * @param {Object} input 
 * @returns {{ isValid: boolean, isBlocked: boolean, errors: string[] }}
 */
function validateMealTimingInput(input) {
  const errors = [];
  let isBlocked = false;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      isBlocked: true,
      errors: ['Input de Meal Timing deve ser um objeto válido e não-nulo.']
    };
  }

  // 1. Contexto Canônico
  if (!input.context || typeof input.context !== 'object') {
    errors.push('context é obrigatório e deve ser um objeto.');
    isBlocked = true;
  }

  // 2. Resultado da Fase N3.3 (Meal Assembly)
  if (!input.mealAssemblyResult || typeof input.mealAssemblyResult !== 'object') {
    errors.push('mealAssemblyResult é obrigatório (portão de entrada da Fase N3.3).');
    isBlocked = true;
  } else {
    const assemblyStatus = input.mealAssemblyResult.status;
    if (assemblyStatus === 'BLOCKED') {
      errors.push('mealAssemblyResult está com status BLOCKED.');
      isBlocked = true;
    } else if (assemblyStatus !== 'PASS' && assemblyStatus !== 'WARNING') {
      errors.push(`mealAssemblyResult possui status inválido: ${assemblyStatus}.`);
      isBlocked = true;
    }

    if (input.mealAssemblyResult.valid !== true) {
      errors.push('mealAssemblyResult.valid deve ser true.');
      isBlocked = true;
    }

    if (!Array.isArray(input.mealAssemblyResult.meals) || input.mealAssemblyResult.meals.length === 0) {
      errors.push('mealAssemblyResult.meals deve ser um array de refeições não-vazio.');
      isBlocked = true;
    } else {
      for (let m = 0; m < input.mealAssemblyResult.meals.length; m++) {
        const meal = input.mealAssemblyResult.meals[m];
        if (!meal || typeof meal !== 'object') {
          errors.push(`Refeição no índice ${m} de mealAssemblyResult é inválida.`);
          isBlocked = true;
        } else {
          if (!meal.mealId || typeof meal.mealId !== 'string') {
            errors.push(`Refeição no índice ${m} não possui mealId válido.`);
            isBlocked = true;
          }
          if (typeof meal.mealIndex !== 'number' || !Number.isInteger(meal.mealIndex)) {
            errors.push(`Refeição no índice ${m} não possui mealIndex válido.`);
            isBlocked = true;
          }
          if (!Array.isArray(meal.items) || meal.items.length === 0) {
            errors.push(`Refeição '${meal.mealId || m}' possui items vazio ou inválido.`);
            isBlocked = true;
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    isBlocked,
    errors
  };
}

/**
 * Valida a estrutura de saída do MealTimingOutputDTO
 * @param {Object} output 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateMealTimingOutput(output) {
  const errors = [];

  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return { isValid: false, errors: ['Output de Meal Timing deve ser um objeto válido.'] };
  }

  if (!output.timingVersion || typeof output.timingVersion !== 'string') {
    errors.push('timingVersion é obrigatório e deve ser uma string.');
  }

  if (!output.assemblyVersion || typeof output.assemblyVersion !== 'string') {
    errors.push('assemblyVersion é obrigatório e deve ser uma string.');
  }

  if (!output.solverVersion || typeof output.solverVersion !== 'string') {
    errors.push('solverVersion é obrigatório e deve ser uma string.');
  }

  if (!output.status || !Object.values(TIMING_STATUS).includes(output.status)) {
    errors.push(`status deve ser um dos valores: ${Object.values(TIMING_STATUS).join(', ')}.`);
  }

  if (typeof output.valid !== 'boolean') {
    errors.push('valid deve ser um booleano.');
  }

  if (!Array.isArray(output.meals)) {
    errors.push('meals deve ser um array de refeições agendadas.');
  }

  if (!output.eatingWindow || typeof output.eatingWindow !== 'object') {
    errors.push('eatingWindow deve ser um objeto descrevendo a janela alimentar.');
  } else {
    if (typeof output.eatingWindow.startMinutes !== 'number' || typeof output.eatingWindow.endMinutes !== 'number') {
      errors.push('eatingWindow deve conter startMinutes e endMinutes numéricos.');
    }
  }

  if (!Array.isArray(output.temporalEvents)) {
    errors.push('temporalEvents deve ser um array de eventos temporais.');
  }

  if (!output.globalTotals || typeof output.globalTotals !== 'object') {
    errors.push('globalTotals deve ser um objeto de totais nutricionais.');
  }

  ['diagnostics', 'warnings', 'blockingReasons'].forEach((field) => {
    if (!Array.isArray(output[field])) {
      errors.push(`${field} deve ser um array.`);
    }
  });

  if (!output.provenance || typeof output.provenance !== 'object') {
    errors.push('provenance deve ser um objeto de proveniência de execução.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

const MealTimingContract = {
  CONTRACT_VERSION: MEAL_TIMING_CONTRACT_VERSION,
  TIMING_STATUS,
  WINDOW_STRENGTH,
  TEMPORAL_STATUS,
  TIMING_SOURCES,
  TEMPORAL_EVENT_TYPES,
  deepFreeze,
  validateMealTimingInput,
  validateMealTimingOutput
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MealTimingContract;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.MealTimingContract = MealTimingContract;
}

  });

  // ── MÓDULO: domain/contracts/NutrientTimingContract.js ──
  defineModule("domain/contracts/NutrientTimingContract.js", function(require, module, exports) {
/**
 * domain/contracts/NutrientTimingContract.js
 * 
 * Contrato Canônico de Entrada e Saída da Análise de Nutrient Timing — NutriAx Pro.
 * Fase N3.5 — Nutrient Timing Específico.
 * 
 * Camada Pura — Sem I/O, sem UI, sem dependências externas, sem efeitos colaterais.
 */

'use strict';

const CONTRACT_VERSION = 'N3.5.0';
const TIMING_ANALYSIS_VERSION = 'N3.5.0';

/**
 * Status formais de saída da Análise de Nutrient Timing
 */
const NUTRIENT_TIMING_STATUS = Object.freeze({
  PASS: 'PASS',
  WARNING: 'WARNING',
  BLOCKED: 'BLOCKED'
});

/**
 * Relações temporais primárias canônicas (mutuamente exclusivas por refeição)
 */
const TEMPORAL_PRIMARY_RELATION = Object.freeze({
  NEUTRAL: 'NEUTRAL',
  PRE_TRAINING: 'PRE_TRAINING',
  POST_TRAINING: 'POST_TRAINING',
  PRE_CARDIO: 'PRE_CARDIO',
  POST_CARDIO: 'POST_CARDIO',
  BETWEEN_TRAINING_AND_CARDIO: 'BETWEEN_TRAINING_AND_CARDIO',
  REST_DAY: 'REST_DAY',
  OVERLAPPING_EVENT: 'OVERLAPPING_EVENT'
});

/**
 * Relações temporais secundárias canônicas (podem coexistir como tags)
 */
const TEMPORAL_SECONDARY_RELATION = Object.freeze({
  FASTING_CONSTRAINED: 'FASTING_CONSTRAINED',
  CLOSE_EVENT_PROXIMITY: 'CLOSE_EVENT_PROXIMITY',
  DATA_INSUFFICIENT: 'DATA_INSUFFICIENT'
});

/**
 * Relações e diagnósticos de eventos contextuais
 */
const EVENT_RELATIONS = Object.freeze({
  FASTED_TRAINING: 'FASTED_TRAINING',
  CONSECUTIVE_CARDIO_TRAINING: 'CONSECUTIVE_CARDIO_TRAINING',
  UNSCHEDULED_CARDIO: 'UNSCHEDULED_CARDIO',
  TRAINING_OUTSIDE_FEEDING_WINDOW: 'TRAINING_OUTSIDE_FEEDING_WINDOW'
});

/**
 * Congelamento profundo determinístico e recursivo
 * @param {Object} obj 
 * @returns {Object}
 */
function deepFreeze(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Object.isFrozen(obj)) return obj;

  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const val = obj[prop];
    if (val !== null && (typeof val === 'object' || typeof val === 'function') && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  });

  return obj;
}

/**
 * Valida o Contrato de Entrada NutrientTimingInputDTO
 * @param {Object} input 
 * @returns {{ isValid: boolean, isBlocked: boolean, errors: string[] }}
 */
function validateNutrientTimingInput(input) {
  const errors = [];
  let isBlocked = false;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      isBlocked: true,
      errors: ['Input de Nutrient Timing deve ser um objeto válido e não-nulo.']
    };
  }

  // 1. Contexto Canônico de Prescrição Nutricional
  if (!input.context || typeof input.context !== 'object') {
    errors.push('context é obrigatório e deve ser um objeto.');
    isBlocked = true;
  }

  // 2. Resultado da Fase N3.4 (Meal Timing)
  if (!input.mealTimingResult || typeof input.mealTimingResult !== 'object') {
    errors.push('mealTimingResult é obrigatório (portão de entrada da Fase N3.4).');
    isBlocked = true;
  } else {
    const timingStatus = input.mealTimingResult.status;
    if (timingStatus === 'BLOCKED') {
      errors.push('mealTimingResult está com status BLOCKED. Análise N3.5 bloqueada.');
      isBlocked = true;
    } else if (timingStatus !== 'PASS' && timingStatus !== 'WARNING') {
      errors.push(`mealTimingResult possui status inválido: ${timingStatus}.`);
      isBlocked = true;
    }

    if (input.mealTimingResult.valid !== true) {
      errors.push('mealTimingResult.valid deve ser true.');
      isBlocked = true;
    }

    if (!Array.isArray(input.mealTimingResult.meals) || input.mealTimingResult.meals.length === 0) {
      errors.push('mealTimingResult.meals deve ser um array de refeições não-vazio.');
      isBlocked = true;
    } else {
      for (let m = 0; m < input.mealTimingResult.meals.length; m++) {
        const meal = input.mealTimingResult.meals[m];
        if (!meal || typeof meal !== 'object') {
          errors.push(`Refeição no índice ${m} de mealTimingResult é inválida.`);
          isBlocked = true;
        } else {
          if (!meal.mealId || typeof meal.mealId !== 'string') {
            errors.push(`Refeição no índice ${m} não possui mealId válido.`);
            isBlocked = true;
          }
          if (typeof meal.mealIndex !== 'number' || !Number.isInteger(meal.mealIndex)) {
            errors.push(`Refeição '${meal.mealId || m}' não possui mealIndex válido.`);
            isBlocked = true;
          }
          if (typeof meal.scheduledMinutes !== 'number' || isNaN(meal.scheduledMinutes)) {
            errors.push(`Refeição '${meal.mealId || m}' não possui scheduledMinutes válido.`);
            isBlocked = true;
          }
          if (!meal.scheduledTime || typeof meal.scheduledTime !== 'string') {
            errors.push(`Refeição '${meal.mealId || m}' não possui scheduledTime válido.`);
            isBlocked = true;
          }
          if (!Array.isArray(meal.items) || meal.items.length === 0) {
            errors.push(`Refeição '${meal.mealId || m}' possui items vazio ou inválido.`);
            isBlocked = true;
          }
          if (!meal.totals || typeof meal.totals !== 'object') {
            errors.push(`Refeição '${meal.mealId || m}' não possui totals válido.`);
            isBlocked = true;
          }
        }
      }
    }
  }

  // 3. Validação Opcional de N3.3 se fornecido
  if (input.mealAssemblyResult) {
    if (input.mealAssemblyResult.valid !== true || input.mealAssemblyResult.status === 'BLOCKED') {
      errors.push('mealAssemblyResult fornecido está inválido ou bloqueado.');
      isBlocked = true;
    }
  }

  return {
    isValid: errors.length === 0,
    isBlocked,
    errors
  };
}

/**
 * Valida a estrutura de saída do NutrientTimingOutputDTO
 * @param {Object} output 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateNutrientTimingOutput(output) {
  const errors = [];

  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return { isValid: false, errors: ['Output de Nutrient Timing deve ser um objeto válido.'] };
  }

  if (!output.timingAnalysisVersion || typeof output.timingAnalysisVersion !== 'string') {
    errors.push('timingAnalysisVersion é obrigatório e deve ser uma string.');
  }

  if (!output.timingVersion || typeof output.timingVersion !== 'string') {
    errors.push('timingVersion é obrigatório e deve ser uma string.');
  }

  if (!output.assemblyVersion || typeof output.assemblyVersion !== 'string') {
    errors.push('assemblyVersion é obrigatório e deve ser uma string.');
  }

  if (!output.solverVersion || typeof output.solverVersion !== 'string') {
    errors.push('solverVersion é obrigatório e deve ser uma string.');
  }

  if (!output.status || !Object.values(NUTRIENT_TIMING_STATUS).includes(output.status)) {
    errors.push(`status deve ser um dos valores: ${Object.values(NUTRIENT_TIMING_STATUS).join(', ')}.`);
  }

  if (typeof output.valid !== 'boolean') {
    errors.push('valid deve ser um booleano.');
  }

  if (!Array.isArray(output.meals)) {
    errors.push('meals deve ser um array de refeições analisadas.');
  } else {
    for (let i = 0; i < output.meals.length; i++) {
      const m = output.meals[i];
      if (!m || typeof m !== 'object') {
        errors.push(`Refeição analisada no índice ${i} é inválida.`);
        continue;
      }
      if (!m.primaryRelation || !Object.values(TEMPORAL_PRIMARY_RELATION).includes(m.primaryRelation)) {
        errors.push(`Refeição '${m.mealId || i}' possui primaryRelation inválida: "${m.primaryRelation}".`);
      }
      if (!Array.isArray(m.secondaryRelations)) {
        errors.push(`Refeição '${m.mealId || i}' deve possuir secondaryRelations como array.`);
      }
      if (typeof m.analysisReason !== 'string' || m.analysisReason.trim() === '') {
        errors.push(`Refeição '${m.mealId || i}' deve possuir analysisReason como string não-vazia.`);
      }
    }
  }

  ['globalDiagnostics', 'conflicts', 'warnings', 'blockingReasons'].forEach((field) => {
    if (!Array.isArray(output[field])) {
      errors.push(`${field} deve ser um array.`);
    }
  });

  if (!output.globalTotals || typeof output.globalTotals !== 'object') {
    errors.push('globalTotals deve ser um objeto de totais nutricionais.');
  }

  if (!output.provenance || typeof output.provenance !== 'object') {
    errors.push('provenance deve ser um objeto de proveniência.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

const NutrientTimingContract = {
  CONTRACT_VERSION,
  TIMING_ANALYSIS_VERSION,
  NUTRIENT_TIMING_STATUS,
  TEMPORAL_PRIMARY_RELATION,
  TEMPORAL_SECONDARY_RELATION,
  EVENT_RELATIONS,
  deepFreeze,
  validateNutrientTimingInput,
  validateNutrientTimingOutput
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NutrientTimingContract;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.NutrientTimingContract = NutrientTimingContract;
}

  });

  // ── MÓDULO: domain/contracts/GlobalPrescriptionValidationContract.js ──
  defineModule("domain/contracts/GlobalPrescriptionValidationContract.js", function(require, module, exports) {
/**
 * domain/contracts/GlobalPrescriptionValidationContract.js
 * 
 * Contrato Canônico de Entrada e Saída da Validação Global da Prescrição Nutricional — NutriAx Pro.
 * Fase N3.6 — Auditoria e Validação Global Determinística.
 * 
 * Camada Pura — Sem I/O, sem UI, sem dependências externas, sem efeitos colaterais.
 * 
 * Princípio Reitor:
 * "N2/N3 prescrevem/analisam. N3.6 apenas valida a coerência global do resultado."
 */

'use strict';

const CONTRACT_VERSION = 'N3.6.0';
const GLOBAL_VALIDATION_VERSION = 'N3.6.0';

/**
 * Status formais de saída da Validação Global
 * NOTA ARQUITETURAL: Não existe NO_SOLUTION na N3.6 (pertence exclusivamente ao Solver N3.2).
 */
const GLOBAL_VALIDATION_STATUS = Object.freeze({
  PASS: 'PASS',
  WARNING: 'WARNING',
  BLOCKED: 'BLOCKED'
});

/**
 * Identificadores canônicos dos 20 Portões Invariantes Globais (G1 a G20)
 */
const GLOBAL_GATE_ID = Object.freeze({
  G1_CONTEXT: 'G1_CONTEXT',
  G2_ENERGY_TARGET: 'G2_ENERGY_TARGET',
  G3_MACRO_TARGET: 'G3_MACRO_TARGET',
  G4_NUTRITION_VALIDATOR: 'G4_NUTRITION_VALIDATOR',
  G5_FOOD_SOLVER: 'G5_FOOD_SOLVER',
  G6_MEAL_ASSEMBLY: 'G6_MEAL_ASSEMBLY',
  G7_MEAL_TIMING: 'G7_MEAL_TIMING',
  G8_NUTRIENT_TIMING: 'G8_NUTRIENT_TIMING',
  G9_FOOD_IDENTITY: 'G9_FOOD_IDENTITY',
  G10_MASS_CONSERVATION: 'G10_MASS_CONSERVATION',
  G11_NUTRIENT_CONSERVATION: 'G11_NUTRIENT_CONSERVATION',
  G12_ATWATER_CLOSURE: 'G12_ATWATER_CLOSURE',
  G13_MEAL_IDENTITY: 'G13_MEAL_IDENTITY',
  G14_TEMPORAL_INTEGRITY: 'G14_TEMPORAL_INTEGRITY',
  G15_EVENT_TRACEABILITY: 'G15_EVENT_TRACEABILITY',
  G16_FASTING_COHERENCE: 'G16_FASTING_COHERENCE',
  G17_NUTRIENT_TIMING_INTEGRITY: 'G17_NUTRIENT_TIMING_INTEGRITY',
  G18_PROVENANCE_INTEGRITY: 'G18_PROVENANCE_INTEGRITY',
  G19_DETERMINISM: 'G19_DETERMINISM',
  G20_IMMUTABILITY: 'G20_IMMUTABILITY'
});

/**
 * Severidade de cada verificação
 */
const GATE_SEVERITY = Object.freeze({
  BLOCKING: 'BLOCKING',
  WARNING: 'WARNING',
  INFORMATIONAL: 'INFORMATIONAL'
});

/**
 * Congelamento profundo determinístico e recursivo
 * @param {Object} obj 
 * @returns {Object}
 */
function deepFreeze(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Object.isFrozen(obj)) return obj;

  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const val = obj[prop];
    if (val !== null && (typeof val === 'object' || typeof val === 'function') && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  });

  return obj;
}

/**
 * Valida o Contrato de Entrada GlobalPrescriptionValidationInputDTO
 * @param {Object} input 
 * @returns {{ isValid: boolean, isBlocked: boolean, errors: string[] }}
 */
function validateGlobalPrescriptionValidationInput(input) {
  const errors = [];
  let isBlocked = false;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      isBlocked: true,
      errors: ['Input de validação global deve ser um objeto válido e não-nulo.']
    };
  }

  // 1. Contexto Canônico de Prescrição Nutricional (N1.1)
  if (!input.context || typeof input.context !== 'object') {
    errors.push('context é obrigatório e deve ser um objeto.');
    isBlocked = true;
  }

  // 2. Verificação de Presença de Resultados Anteriores (ou pacote consolidado)
  const hasDecoupledChain = (
    input.energyTargetResult ||
    input.macroTargetResult ||
    input.nutritionValidatorResult ||
    input.foodSolverResult ||
    input.mealAssemblyResult ||
    input.mealTimingResult ||
    input.nutrientTimingResult
  );

  if (!hasDecoupledChain) {
    errors.push('Input de validação global deve conter resultados das fases anteriores (de N2.1 a N3.5).');
    isBlocked = true;
  }

  return {
    isValid: errors.length === 0,
    isBlocked,
    errors
  };
}

/**
 * Valida o Contrato de Saída GlobalPrescriptionValidationOutputDTO
 * @param {Object} output 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateGlobalPrescriptionValidationOutput(output) {
  const errors = [];

  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return {
      isValid: false,
      errors: ['Output de validação global deve ser um objeto válido e não-nulo.']
    };
  }

  if (output.globalValidationVersion !== GLOBAL_VALIDATION_VERSION) {
    errors.push(`globalValidationVersion inválida (esperado "${GLOBAL_VALIDATION_VERSION}", recebido "${output.globalValidationVersion}").`);
  }

  if (!output.status || !Object.values(GLOBAL_VALIDATION_STATUS).includes(output.status)) {
    errors.push(`status inválido: "${output.status}".`);
  }

  if (typeof output.valid !== 'boolean') {
    errors.push('valid deve ser um booleano.');
  }

  if (!Array.isArray(output.gateResults)) {
    errors.push('gateResults deve ser um array de resultados dos portões.');
  }

  if (!output.conservationAudit || typeof output.conservationAudit !== 'object') {
    errors.push('conservationAudit deve ser um objeto com os cálculos de auditoria bromatológica.');
  }

  if (!output.temporalAudit || typeof output.temporalAudit !== 'object') {
    errors.push('temporalAudit deve ser um objeto com a auditoria de horários.');
  }

  if (!Array.isArray(output.globalDiagnostics)) {
    errors.push('globalDiagnostics deve ser um array.');
  }

  if (!Array.isArray(output.inheritedWarnings)) {
    errors.push('inheritedWarnings deve ser um array.');
  }

  if (!Array.isArray(output.validationWarnings)) {
    errors.push('validationWarnings deve ser um array.');
  }

  if (!Array.isArray(output.blockingReasons)) {
    errors.push('blockingReasons deve ser um array.');
  }

  if (!output.globalProvenance || typeof output.globalProvenance !== 'object') {
    errors.push('globalProvenance deve ser um objeto estruturado de rastreabilidade.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = deepFreeze({
  CONTRACT_VERSION,
  GLOBAL_VALIDATION_VERSION,
  GLOBAL_VALIDATION_STATUS,
  GLOBAL_GATE_ID,
  GATE_SEVERITY,
  deepFreeze,
  validateGlobalPrescriptionValidationInput,
  validateGlobalPrescriptionValidationOutput
});

  });

  // ── MÓDULO: domain/adapters/legacyAdapters.js ──
  defineModule("domain/adapters/legacyAdapters.js", function(require, module, exports) {
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

  // Resolução canônica de split e splitSource
  let split = options.split ?? legacyTraining.split ?? legacyTraining.activeSplit;
  let splitSource = options.splitSource ?? legacyTraining.splitSource;

  if (split) {
    if (!splitSource) {
      if (options.split || legacyTraining.split) {
        splitSource = (legacyTraining.source === 'AI' || legacyTraining.generatedBy === 'Gemini') ? 'AI' : 'HUMAN';
      } else if (legacyTraining.activeSplit) {
        splitSource = 'HUMAN';
      } else {
        splitSource = 'DETERMINISTIC';
      }
    }
  } else {
    // ══════════════════════════════════════════════════════════════════════════
    // COMPATIBILIDADE LEGADA
    // não representa regra de geração atual
    // Preservado exclusivamente para leitura de registros históricos antigos
    // onde o split não era persistido e o runtime legado deduzia por rotinas.
    // NÃO utilizar em novas prescrições, approval gate ou Gemini.
    // ══════════════════════════════════════════════════════════════════════════
    split = rawRoutines.length >= 5 ? 'PHAT' : (rawRoutines.length === 4 ? 'UpperLower' : 'PPL');
    splitSource = 'DETERMINISTIC';
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
  let isLegacySingle = false;

  if (Array.isArray(legacyCardio.sessions)) {
    rawSessions = legacyCardio.sessions;
  } else if (legacyCardio.cardioPrescription && Array.isArray(legacyCardio.cardioPrescription.sessions)) {
    rawSessions = legacyCardio.cardioPrescription.sessions;
  } else if (legacyCardio.prescribedCardioId || legacyCardio.perfPrescribedCardioId) {
    // Caso de sessão única legada (compatibilidade histórica)
    isLegacySingle = true;
    const pId = legacyCardio.prescribedCardioId || legacyCardio.perfPrescribedCardioId;
    const dur = legacyCardio.durationMinutes != null 
      ? Number(legacyCardio.durationMinutes) 
      : (legacyCardio.duration != null ? Number(legacyCardio.duration) : 45);
    rawSessions = [{
      protocolId: pId,
      cardioId: pId,
      durationMinutes: dur,
      day: legacyCardio.day || 'Dia 2',
      dayKey: legacyCardio.dayKey || 'day_2',
      isLegacy: true
    }];
  }

  const normalizedSessions = rawSessions.map((s, idx) => ({
    cardioId: s.cardioId || s.sessionId || s.protocolId || `cardio_${idx + 1}`,
    protocolId: s.protocolId || s.cardioId || s.sessionId || `cardio_${idx + 1}`,
    day: s.day || null,
    dayKey: s.dayKey || (s.day ? String(s.day).trim().toLowerCase().replace(/\s+/g, '_') : null),
    type: s.type || (s.protocolId === 'cardio_03' || s.protocolId === 'cardio_04' ? 'HIIT' : 'Moderado Contínuo'),
    durationMinutes: s.durationMinutes != null ? Number(s.durationMinutes) : (s.duration != null ? Number(s.duration) : 45),
    intensity: s.intensity || null,
    modality: s.modality || s.protocolTitle || null,
    heartRateZone: s.heartRateZone || null,
    targetBpm: s.targetBpm || null,
    components: Array.isArray(s.components) ? s.components : null,
    isLegacy: Boolean(s.isLegacy || isLegacySingle)
  }));

  const totalWeeklyMinutes = legacyCardio.totalWeeklyMinutes != null
    ? Number(legacyCardio.totalWeeklyMinutes)
    : normalizedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  const sessionDurations = Array.isArray(legacyCardio.sessionDurations)
    ? legacyCardio.sessionDurations.map(d => Number(d))
    : normalizedSessions.map(s => s.durationMinutes);

  const distributionMode = legacyCardio.distributionMode || (isLegacySingle ? 'CONCENTRATED' : 'DISTRIBUTED');

  return createCardioPrescriptionDTO({
    patientId,
    frequencyWeekly: normalizedSessions.length,
    weeklyFrequency: normalizedSessions.length,
    totalWeeklyMinutes,
    distributionMode,
    sessionDurations,
    sessions: normalizedSessions,
    isLegacy: Boolean(isLegacySingle || legacyCardio.isLegacy),
    legacyPrescribedCardioId: legacyCardio.prescribedCardioId || legacyCardio.perfPrescribedCardioId || null
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


  });

  // ── MÓDULO: domain/adapters/index.js ──
  defineModule("domain/adapters/index.js", function(require, module, exports) {
/**
 * domain/adapters/index.js
 * 
 * Ponto Único de Exportação dos Adaptadores de Domínio.
 * Padrão Strangler Fig — NutriAx Pro.
 */

const legacyAdapters = require('./legacyAdapters');
const nutritionContextAdapter = require('./nutritionContextAdapter');
const prescriptionInputAdapter = require('./prescriptionInputAdapter');
const prescriptionOutputAdapter = require('./prescriptionOutputAdapter');

const allAdapters = {
  ...legacyAdapters,
  ...nutritionContextAdapter,
  ...prescriptionInputAdapter,
  ...prescriptionOutputAdapter
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = allAdapters;
}

if (typeof globalThis !== 'undefined') {
  globalThis.NutriDomain = globalThis.NutriDomain || {};
  globalThis.NutriDomain.adapters = allAdapters;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.adapters = allAdapters;
}

  });

  // ── MÓDULO: domain/adapters/performanceContextAdapter.js ──
  defineModule("domain/adapters/performanceContextAdapter.js", function(require, module, exports) {
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

  });

  // ── MÓDULO: domain/adapters/nutritionContextAdapter.js ──
  defineModule("domain/adapters/nutritionContextAdapter.js", function(require, module, exports) {
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

  });

  // ── MÓDULO: domain/adapters/prescriptionInputAdapter.js ──
  defineModule("domain/adapters/prescriptionInputAdapter.js", function(require, module, exports) {
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
    dietaryCycle: String(rawOptions.dietaryCycle || '').trim(),
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

  });

  // ── MÓDULO: domain/adapters/prescriptionOutputAdapter.js ──
  defineModule("domain/adapters/prescriptionOutputAdapter.js", function(require, module, exports) {
/**
 * domain/adapters/prescriptionOutputAdapter.js
 * 
 * Adaptador Canônico de Saída da Prescrição Nutricional — NutriAx Pro.
 * Fase N3.7.2 — Camada de Tradução Pura do Pipeline Canônico para o Runtime.
 * 
 * Regras Obrigatórias de Governança e Pureza:
 * 1. PUREZA ABSOLUTA: Zero DOM, zero window/document, zero Dexie/Firebase, zero Gemini,
 *    zero Date.now(), zero Math.random(), zero I/O de rede ou disco.
 * 2. DETERMINISMO ESTÓICO: Mesma entrada canônica -> mesma saída adaptada idêntica.
 * 3. ZERO RECALCULO / ZERO REBALANCEAMENTO:
 *    O adaptador de saída NÃO corrige, NÃO rebalanceia, NÃO recalcula,
 *    NÃO substitui alimentos, NÃO altera horários, NÃO altera macros e
 *    NÃO modifica o status N3.6. Somente traduz estruturas.
 * 4. DETERMINISMO DE IDENTIFICADORES:
 *    IDs de itens são estritamente derivados de `${meal.mealId}_item_${item.foodId || index + 1}`.
 * 5. SEPARAÇÃO DE TEMPO:
 *    Timestamps (generatedAt, validatedAt) são recebidos via options (fornecidos pelo runtime),
 *    NUNCA gerados dentro deste módulo puro.
 * 6. SOBERANIA N3.6:
 *    O status canônico é PASS | WARNING | BLOCKED.
 *    validationVerdict é derivado estritamente de N3.6.status como alias de leitura,
 *    nunca como fonte paralela de autoridade.
 */

'use strict';

/**
 * Formata minutos inteiros (0..1439) para string no padrão "HH:MM".
 * Função pura e determinística.
 * 
 * @param {number} minutes 
 * @returns {string} "HH:MM"
 */
function formatMinutesToTimeString(minutes) {
  if (minutes == null || !Number.isFinite(minutes)) return '12:00';
  const totalMins = Math.round(minutes) % 1440;
  const normalized = totalMins < 0 ? totalMins + 1440 : totalMins;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Extrai o horário canônico da refeição em formato texto "HH:MM".
 * 
 * @param {Object} meal 
 * @returns {string}
 */
function resolveMealTimeString(meal) {
  if (!meal || typeof meal !== 'object') return '12:00';
  if (typeof meal.scheduledTime === 'string' && /^\d{1,2}:\d{2}$/.test(meal.scheduledTime.trim())) {
    return meal.scheduledTime.trim();
  }
  if (typeof meal.targetTime === 'string' && /^\d{1,2}:\d{2}$/.test(meal.targetTime.trim())) {
    return meal.targetTime.trim();
  }
  if (Number.isFinite(meal.scheduledTimeMinutes)) {
    return formatMinutesToTimeString(meal.scheduledTimeMinutes);
  }
  if (Number.isFinite(meal.targetTimeMinutes)) {
    return formatMinutesToTimeString(meal.targetTimeMinutes);
  }
  if (meal.timeWindow && typeof meal.timeWindow.start === 'string') {
    return meal.timeWindow.start;
  }
  return '12:00';
}

const STANDARD_CLINICAL_MEAL_NAMES = {
  1: ['Refeição Principal'],
  2: ['Almoço', 'Jantar'],
  3: ['Café da manhã', 'Almoço', 'Jantar'],
  4: ['Café da manhã', 'Almoço', 'Pré-treino', 'Jantar'],
  5: ['Café da manhã', 'Lanche manhã', 'Almoço', 'Pré-treino', 'Jantar'],
  6: ['Café da manhã', 'Lanche manhã', 'Almoço', 'Pré-treino', 'Pós-treino', 'Jantar'],
  7: ['Café da manhã', 'Lanche manhã', 'Almoço', 'Pré-treino', 'Pós-treino', 'Jantar', 'Ceia'],
  8: ['Café da manhã', 'Lanche manhã', 'Almoço', 'Lanche tarde', 'Pré-treino', 'Pós-treino', 'Jantar', 'Ceia']
};

/**
 * Resolve o nome clínico da refeição para a camada de visualização e runtime.
 * Se meal.mealName já for clínico (ex: 'Café da Manhã', 'Almoço', 'Ceia'), preserva-o.
 * Se for genérico ('Refeição 1', 'Refeição 2', etc.) ou indefinido, mapeia para o nome clínico
 * correspondente ao índice e ao total de refeições do plano.
 * 
 * @param {Object} meal 
 * @param {number} mealIdx 
 * @param {number} totalMeals 
 * @returns {string}
 */
function resolveClinicalMealName(meal, mealIdx, totalMeals) {
  if (meal && typeof meal.mealName === 'string') {
    const trimmed = meal.mealName.trim();
    if (trimmed && !/^Refeição(\s*\d+)?$/i.test(trimmed) && !/^Meal(\s*\d+)?$/i.test(trimmed)) {
      return trimmed;
    }
  }

  const count = Number(totalMeals) || 1;
  const standardList = STANDARD_CLINICAL_MEAL_NAMES[count];
  if (standardList && standardList[mealIdx]) {
    return standardList[mealIdx];
  }

  return meal?.mealName || `Refeição ${mealIdx + 1}`;
}

/**
 * Traduz os itens de refeição canônicos para o array linear currentPrescriptionItems do runtime.
 * Pura tradução estrutural — preserva calorias, proteínas, carboidratos, lipidios, fibras e sódio.
 * Fornece tanto 'lipid' quanto 'fat' para compatibilidade com os diferentes consumidores legados.
 * 
 * @param {Array<Object>} meals - Refeições do resultado canônico N3.4 ou N3.3
 * @returns {Array<Object>} Lista de itens desnormalizados para o runtime
 */
function adaptCanonicalMealsToRuntimeItems(meals) {
  if (!Array.isArray(meals) || meals.length === 0) return [];

  const runtimeItems = [];
  const totalMeals = meals.length;

  meals.forEach((meal, mealIdx) => {
    const mealId = meal.mealId || `meal_${mealIdx + 1}`;
    const mealName = resolveClinicalMealName(meal, mealIdx, totalMeals);
    const mealTime = resolveMealTimeString(meal);
    const mealRole = meal.mealRole || 'PRIMARY';

    const items = Array.isArray(meal.items) ? meal.items : [];
    items.forEach((item, itemIdx) => {
      const foodId = String(item.foodId || `food_${itemIdx + 1}`).trim();
      const foodName = String(item.foodName || 'Alimento').trim();
      const quantity = Number(item.grams || item.portionGrams || 100);

      // Nutrientes escalados da refeição canônica
      const cal = Number(item.nutrients?.calories ?? 0);
      const prot = Number(item.nutrients?.protein ?? 0);
      const carb = Number(item.nutrients?.carbohydrate ?? 0);
      const lipidVal = item.nutrients?.lipid != null
        ? Number(item.nutrients.lipid)
        : (item.nutrients?.fat != null ? Number(item.nutrients.fat) : 0);
      const fatVal = item.nutrients?.fat != null
        ? Number(item.nutrients.fat)
        : (item.nutrients?.lipid != null ? Number(item.nutrients.lipid) : 0);
      const fib = Number(item.nutrients?.fiber ?? 0);
      const sod = Number(item.nutrients?.sodium ?? 0);

      // Identificador de item determinístico estável
      const itemId = `${mealId}_item_${foodId}`;

      const runtimeItem = {
        id: itemId,
        foodId,
        foodName,
        mealName,
        mealTime,
        mealRole,
        quantity,
        unit: item.unit || 'g',
        unitDisplay: `${quantity}g`,
        baseQuantity: 100,
        baseUnit: 'g',
        calories: cal,
        protein: prot,
        carbohydrate: carb,
        lipid: lipidVal, // GAP 9: campo centesimal padrão para renderPrescriptionTotals
        fat: fatVal,     // GAP 9: campo alias canônico para o Patient App
        fiber: fib,
        sodium: sod,
        sourceMealSolution: item.sourceMealSolution || 'CANONICAL_SOLVER',
        allocationRatio: item.allocationRatio ?? 1.0
      };

      runtimeItems.push(Object.freeze(runtimeItem));
    });
  });

  return runtimeItems;
}

/**
 * Computa um fingerprint determinístico e canônico do conteúdo clínico da prescrição.
 * 
 * Invariantes de Pureza e Segurança:
 * - 100% puro e determinístico (sem Date.now, sem Math.random, sem I/O, sem DOM, sem storage);
 * - Normaliza e canoniciza campos clinicamente relevantes: foodId, foodName, quantity, unit, mealName/mealId, mealTime;
 * - Independente da ordem dos itens;
 * - Sensível a alterações de quantidade, unidade, refeição, horário e substituição de alimento.
 * 
 * @param {Array<Object>} items - Array de itens da prescrição
 * @returns {string} Fingerprint canônico formatado (ex: "cfp_xxxxxxxxxxxxxxxx")
 */
function computePrescriptionContentFingerprint(items) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return 'cfp_empty_0000000000000000';
  }

  const normalizedTokens = items.map((item) => {
    const foodId = String(item.foodId || item.id || '').trim().toLowerCase();
    const foodName = String(item.foodName || item.name || '').trim().toLowerCase();
    const qty = Number(Number(item.quantity || 0).toFixed(2));
    const unit = String(item.unit || item.baseUnit || 'g').trim().toLowerCase();
    const meal = String(item.mealName || item.mealId || '').trim().toLowerCase();
    const time = String(item.mealTime || '').trim();
    return `${meal}@${time}:${foodId}#${foodName}@${qty}${unit}`;
  });

  normalizedTokens.sort();
  const canonicalString = normalizedTokens.join('|');

  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < canonicalString.length; i++) {
    const ch = canonicalString.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ (ch + i), 0x5bd1e995);
  }

  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `cfp_${p1}${p2}`;
}

/**
 * Traduz o resultado do pipeline canônico N3.7.1 para a estrutura de metadados do runtime.
 * 
 * @param {Object} pipelineResult - PrescriptionPipelineResultDTO
 * @param {Object} [options] - Opções externas { generatedAt, validatedAt, isClinicallyValidated, isStale, staleReason, validatedContentFingerprint, runtimeItems }
 * @returns {Readonly<Object>} currentPrescriptionMeta
 */
function adaptCanonicalMetaToRuntimeMeta(pipelineResult, options = {}) {
  const status = pipelineResult?.status || 'BLOCKED';
  const globalRes = pipelineResult?.globalValidationResult || {};

  const validatedFingerprint = options.validatedContentFingerprint ||
    (Array.isArray(options.runtimeItems) && options.runtimeItems.length > 0
      ? computePrescriptionContentFingerprint(options.runtimeItems)
      : null);

  const validationReport = {
    status,
    valid: globalRes.valid === true,
    validationScore: globalRes.validationScore ?? null,
    blockingReasons: Array.isArray(pipelineResult?.blockingReasons) ? [...pipelineResult.blockingReasons] : [],
    warnings: Array.isArray(pipelineResult?.warnings) ? [...pipelineResult.warnings] : [],
    gateResults: Array.isArray(globalRes.gateResults) ? [...globalRes.gateResults] : [],
    interruptedAt: pipelineResult?.interruptedAt || null,
    validatedContentFingerprint: validatedFingerprint
  };

  const energyTarget = pipelineResult?.energyTargetResult || options.energyTargetResult || null;
  const macroTarget = pipelineResult?.macroTargetResult || options.macroTargetResult || null;
  const targetValidation = pipelineResult?.nutritionValidatorResult || pipelineResult?.targetValidationResult || options.targetValidationResult || null;

  const targets = Object.freeze({
    tmbKcal: energyTarget?.tmbKcal ?? options.targets?.tmbKcal ?? null,
    getKcal: energyTarget?.getKcal ?? options.targets?.getKcal ?? null,
    caloricTargetKcal: energyTarget?.caloricTargetKcal ?? options.targets?.caloricTargetKcal ?? null,
    proteinTargetG: macroTarget?.proteinTargetG ?? options.targets?.proteinTargetG ?? null,
    carbohydrateTargetG: macroTarget?.carbohydrateTargetG ?? options.targets?.carbohydrateTargetG ?? null,
    fatTargetG: macroTarget?.fatTargetG ?? options.targets?.fatTargetG ?? null,
    fiberTargetG: macroTarget?.fiberTargetG ?? options.targets?.fiberTargetG ?? null,
    energyTargetResult: energyTarget ? Object.freeze({ ...energyTarget }) : (options.targets?.energyTargetResult || null),
    macroTargetResult: macroTarget ? Object.freeze({ ...macroTarget }) : (options.targets?.macroTargetResult || null),
    targetValidationResult: targetValidation ? Object.freeze({ ...targetValidation }) : (options.targets?.targetValidationResult || null)
  });

  const meta = {
    isAIGenerated: true,
    // Validação clínica: somente se explicitamente aprovado (WARNING ou PASS não são aprovados automaticamente)
    isClinicallyValidated: options.isClinicallyValidated === true,
    isStale: options.isStale === true,
    staleReason: options.staleReason || null,
    generatedAt: options.generatedAt || null,
    validatedAt: options.validatedAt || null,
    // Status canônico N3.6 soberano
    validationStatus: status,
    validationScore: globalRes.validationScore ?? null,
    // Alias de leitura para o runtime legado (sempre derivado de N3.6.status, nunca autoridade concorrente)
    validationVerdict: status,
    validationReport,
    validatedContentFingerprint: validatedFingerprint,
    pipelineTrace: Array.isArray(pipelineResult?.pipelineTrace) ? [...pipelineResult.pipelineTrace] : [],
    provenance: pipelineResult?.context?.provenance || null,
    orchestratorVersion: pipelineResult?.orchestratorVersion || 'N3.7.1',
    // Metas Canônicas N2.1 e N2.2 persistidas e auditáveis
    targets,
    tmbKcal: targets.tmbKcal,
    getKcal: targets.getKcal,
    caloricTargetKcal: targets.caloricTargetKcal,
    proteinTargetG: targets.proteinTargetG,
    carbohydrateTargetG: targets.carbohydrateTargetG,
    fatTargetG: targets.fatTargetG,
    fiberTargetG: targets.fiberTargetG
  };

  return Object.freeze(meta);
}

/**
 * Adaptador completo de saída: converte o resultado do orquestrador canônico N3.7.1
 * para o par { items, meta, targets } consumível diretamente pelo runtime e persistível no Dexie.
 * 
 * @param {Object} pipelineResult - PrescriptionPipelineResultDTO produzido pelo orquestrador
 * @param {Object} [options] - Opções externas { generatedAt, validatedAt, isClinicallyValidated, isStale, staleReason }
 * @returns {{ items: Array<Object>, meta: Readonly<Object>, targets: Readonly<Object>, status: string, isCompliant: boolean }}
 */
function adaptPrescriptionPipelineOutput(pipelineResult, options = {}) {
  if (!pipelineResult || typeof pipelineResult !== 'object') {
    const emptyTargets = Object.freeze({
      tmbKcal: null,
      getKcal: null,
      caloricTargetKcal: null,
      proteinTargetG: null,
      carbohydrateTargetG: null,
      fatTargetG: null,
      fiberTargetG: null,
      energyTargetResult: null,
      macroTargetResult: null,
      targetValidationResult: null
    });

    return {
      items: [],
      meta: Object.freeze({
        isAIGenerated: true,
        isClinicallyValidated: false,
        isStale: false,
        staleReason: null,
        generatedAt: options.generatedAt || null,
        validatedAt: null,
        validationStatus: 'BLOCKED',
        validationVerdict: 'BLOCKED',
        validationReport: {
          status: 'BLOCKED',
          valid: false,
          blockingReasons: ['Resultado do pipeline canônico nulo ou inválido.'],
          warnings: [],
          validatedContentFingerprint: null
        },
        validatedContentFingerprint: null,
        targets: emptyTargets,
        tmbKcal: null,
        getKcal: null,
        caloricTargetKcal: null,
        proteinTargetG: null,
        carbohydrateTargetG: null,
        fatTargetG: null,
        fiberTargetG: null
      }),
      targets: emptyTargets,
      status: 'BLOCKED',
      isCompliant: false
    };
  }

  // Refeições resolvidas pelo N3.4 (Meal Timing) ou N3.3 (Meal Assembly)
  const canonicalMeals = pipelineResult.mealTimingResult?.meals ||
                         pipelineResult.mealTimingResult?.scheduledMeals ||
                         pipelineResult.mealAssemblyResult?.meals ||
                         [];

  const items = adaptCanonicalMealsToRuntimeItems(canonicalMeals);
  const meta = adaptCanonicalMetaToRuntimeMeta(pipelineResult, {
    ...options,
    runtimeItems: items
  });

  const status = pipelineResult.status || 'BLOCKED';
  const isCompliant = status !== 'BLOCKED' && (pipelineResult.globalValidationResult?.valid === true);

  return {
    items,
    meta,
    targets: meta.targets,
    status,
    isCompliant
  };
}

// Suporte a CommonJS e navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatMinutesToTimeString,
    resolveMealTimeString,
    resolveClinicalMealName,
    STANDARD_CLINICAL_MEAL_NAMES,
    computePrescriptionContentFingerprint,
    adaptCanonicalMealsToRuntimeItems,
    adaptCanonicalMetaToRuntimeMeta,
    adaptPrescriptionPipelineOutput
  };
}

if (typeof globalThis !== 'undefined') {
  globalThis.NutriDomain = globalThis.NutriDomain || {};
  globalThis.NutriDomain.prescriptionOutputAdapter = {
    formatMinutesToTimeString,
    resolveMealTimeString,
    resolveClinicalMealName,
    STANDARD_CLINICAL_MEAL_NAMES,
    computePrescriptionContentFingerprint,
    adaptCanonicalMealsToRuntimeItems,
    adaptCanonicalMetaToRuntimeMeta,
    adaptPrescriptionPipelineOutput
  };
}

  });

  // ── MÓDULO: domain/math/nutritionMath.js ──
  defineModule("domain/math/nutritionMath.js", function(require, module, exports) {
/**
 * domain/math/nutritionMath.js
 * 
 * Motor Matemático Canônico de Nutrição e Antropometria — NutriAx Pro.
 * Camada Pura — Sem DOM, Sem Dexie, Sem Firebase, Sem Gemini, Sem Efeitos Colaterais.
 */

/**
 * 1. Cálculo de IMC (Índice de Massa Corporal) e Classificação OMS
 * @param {number} weightKg - Peso corporal em kg
 * @param {number} heightM - Estatura em metros
 * @returns {{ imc: number, classification: string }}
 */
function calculateIMC(weightKg, heightM) {
  const w = parseFloat(weightKg) || 0;
  const h = parseFloat(heightM) || 0;

  if (w <= 0 || h <= 0) {
    return { imc: 0, classification: "Dados insuficientes" };
  }

  const rawImc = w / (h * h);
  let classification = "Eutrofia / Adequado";

  if (rawImc < 18.5) classification = "Abaixo do peso";
  else if (rawImc < 25) classification = "Eutrofia / Adequado";
  else if (rawImc < 30) classification = "Sobrepeso";
  else if (rawImc < 35) classification = "Obesidade Grau I";
  else if (rawImc < 40) classification = "Obesidade Grau II";
  else classification = "Obesidade Grau III";

  return {
    imc: Number(rawImc.toFixed(2)),
    classification
  };
}

const calculateBMI = calculateIMC;

/**
 * 2. Cálculo da Taxa Metabólica Basal (TMB)
 * Prioridade canônica: Katch-McArdle (quando há Massa Magra > 0); fallback: Mifflin-St Jeor.
 * @param {string} gender - 'Masculino' | 'Feminino'
 * @param {number} age - Idade em anos
 * @param {number} weightKg - Peso em kg
 * @param {number} heightM - Estatura em metros
 * @param {number} leanMassKg - Massa Magra em kg (opcional)
 * @returns {{ tmb: number, method: string, isAdolescent: boolean, clinicalReviewRequired?: boolean }}
 */
function calculateTMB(gender = "Masculino", age = 30, weightKg = 70, heightM = 1.75, leanMassKg = 0) {
  const w = parseFloat(weightKg) || 70;
  const h = parseFloat(heightM) || 1.75;
  const a = parseFloat(age) || 30;
  const lbm = parseFloat(leanMassKg) || 0;
  const isMale = String(gender).toLowerCase().startsWith("m");
  const isAdolescent = a < 18;

  // 1. Katch-McArdle (Prioridade absoluta quando Massa Magra disponível)
  if (lbm > 0) {
    const tmbKatch = 370 + 21.6 * lbm;
    return {
      tmb: Number(tmbKatch.toFixed(2)),
      method: "Katch-McArdle (Massa Magra)",
      isAdolescent,
      ...(isAdolescent ? { clinicalReviewRequired: true, notes: "Paciente adolescente: TMB requer avaliação clínica individualizada." } : {})
    };
  }

  // 2. Mifflin-St Jeor (Fallback)
  const heightCm = h * 100;
  let tmbMifflin = 10 * w + 6.25 * heightCm - 5 * a;
  if (isMale) {
    tmbMifflin += 5;
  } else {
    tmbMifflin -= 161;
  }

  if (isNaN(tmbMifflin) || tmbMifflin <= 0) {
    tmbMifflin = 1500;
  }

  return {
    tmb: Number(tmbMifflin.toFixed(2)),
    method: "Mifflin-St Jeor",
    isAdolescent,
    ...(isAdolescent ? { clinicalReviewRequired: true, notes: "Paciente adolescente: TMB calculada por equação adulta de transição; requer avaliação especializada." } : {})
  };
}

/**
 * 3. Cálculo do Gasto Energético Total (GET)
 * @param {number} tmb - Taxa metabólica basal em kcal
 * @param {number} activityFactor - Fator de atividade física (padrão de sistema: 1.42)
 * @returns {number} GET em kcal (2 casas decimais)
 */
function calculateGET(tmb, activityFactor = 1.42) {
  const t = parseFloat(tmb) || 1500;
  const fa = parseFloat(activityFactor) || 1.42;
  return Number((t * fa).toFixed(2));
}

/**
 * 4. Resolução Canônica do Alvo Calórico (Caloric Target)
 * Regra: se houver plano prescrito ativo (> 0), usa a prescrição real; senão, adota o GET.
 * @param {number|null} prescribedKcal - Total calórico somado da prescrição ativa
 * @param {number} getKcal - Gasto energético total estimado
 * @returns {{ caloricTargetKcal: number, source: 'PRESCRIBED' | 'GET_FALLBACK' }}
 */
function calculateCaloricTarget(prescribedKcal, getKcal) {
  const get = Math.round(parseFloat(getKcal) || 2000);
  const presc = (prescribedKcal != null && !isNaN(Number(prescribedKcal)) && Number(prescribedKcal) > 0)
    ? Math.round(Number(prescribedKcal))
    : null;

  if (presc !== null) {
    return {
      caloricTargetKcal: presc,
      source: 'PRESCRIBED'
    };
  }

  return {
    caloricTargetKcal: get,
    source: 'GET_FALLBACK'
  };
}

/**
 * 5. Cálculo do Balanço Energético Canônico
 * @param {number} caloricTargetKcal - Alvo calórico da dieta (ou prescrito)
 * @param {number} getKcal - Gasto energético total
 * @returns {{ energyBalanceKcal: number, status: 'DEFICIT' | 'SURPLUS' | 'MAINTENANCE' }}
 */
function calculateEnergyBalance(caloricTargetKcal, getKcal) {
  const target = Math.round(parseFloat(caloricTargetKcal) || 2000);
  const get = Math.round(parseFloat(getKcal) || 2000);
  const diff = target - get;

  let status = 'MAINTENANCE';
  if (diff < -50) status = 'DEFICIT';
  else if (diff > 50) status = 'SURPLUS';

  return {
    energyBalanceKcal: diff,
    status
  };
}

/**
 * 6. Cálculo da Composição Corporal (Jackson-Pollock 7 Dobras + Equação de Siri)
 * @param {string} gender - 'Masculino' | 'Feminino'
 * @param {number} age - Idade
 * @param {number} weightKg - Peso em kg
 * @param {number} heightM - Altura em metros
 * @param {Object} skinfolds - Dobras cutâneas em mm
 * @returns {Object}
 */
function calculateBodyComposition(gender = "Masculino", age = 30, weightKg = 70, heightM = 1.75, skinfolds = {}) {
  const isMale = String(gender).toLowerCase().startsWith("m");
  const a = Math.max(10, parseFloat(age) || 30);
  const w = Math.max(20, parseFloat(weightKg) || 70);
  const h = Math.max(0.5, parseFloat(heightM) || 1.75);

  const sum7 =
    (parseFloat(skinfolds.chest) || 0) +
    (parseFloat(skinfolds.axillary) || 0) +
    (parseFloat(skinfolds.triceps) || 0) +
    (parseFloat(skinfolds.subscapular) || 0) +
    (parseFloat(skinfolds.abdominal) || 0) +
    (parseFloat(skinfolds.suprailiac) || 0) +
    (parseFloat(skinfolds.thigh) || 0);

  let bodyDensity = 1.08;
  let protocol = "Jackson Pollock 7 dobras";

  if (sum7 > 0) {
    if (isMale) {
      bodyDensity =
        1.112 -
        0.00043499 * sum7 +
        0.00000055 * Math.pow(sum7, 2) -
        0.00028826 * a;
    } else {
      bodyDensity =
        1.097 -
        0.00046971 * sum7 +
        0.00000056 * Math.pow(sum7, 2) -
        0.00012828 * a;
    }
  } else {
    protocol = "Estimativa Básica";
    bodyDensity = isMale ? 1.065 : 1.045;
  }

  if (bodyDensity <= 0 || isNaN(bodyDensity)) {
    bodyDensity = 1.065;
  }

  // Equação de Siri: %Gordura = ((4.95 / Densidade) - 4.50) * 100
  let bodyFatPercent = ((4.95 / bodyDensity) - 4.5) * 100;
  if (bodyFatPercent < 3) bodyFatPercent = 3;
  if (bodyFatPercent > 65) bodyFatPercent = 65;

  const fatMassKg = w * (bodyFatPercent / 100);
  const leanMassKg = Math.max(10, w - fatMassKg);

  const heightSq = h * h;
  const ffmi = heightSq > 0 ? leanMassKg / heightSq : 0;
  const fmi = heightSq > 0 ? fatMassKg / heightSq : 0;

  return {
    protocolEffective: protocol,
    sumSkinfolds: Number(sum7.toFixed(2)),
    bodyDensity: Number(bodyDensity.toFixed(4)),
    bodyFatPercent: Number(bodyFatPercent.toFixed(2)),
    fatMassKg: Number(fatMassKg.toFixed(2)),
    leanMassKg: Number(leanMassKg.toFixed(2)),
    ffmi: Number(ffmi.toFixed(2)),
    fmi: Number(fmi.toFixed(2)),
  };
}

/**
 * 7. Classificação Canônica da Relação Cintura-Estatura (RCEst)
 * @param {number} rcEst
 * @returns {string}
 */
function classifyRCEst(rcEst) {
  const val = parseFloat(rcEst);
  if (isNaN(val) || val <= 0) return "Não informado";
  if (val < 0.40) return "Magreza extrema / Atenção";
  if (val <= 0.50) return "Ideal / Baixo risco cardiovascular";
  if (val <= 0.60) return "Risco aumentado / Sobrepeso-Adiposidade central";
  return "Risco altamente elevado";
}

/**
 * 8. Cálculo de Índices Antropométricos e Proporções Corporais
 * @param {Object} params
 * @returns {Object}
 */
function calculateAnthropometricIndices({
  waistCm = 80,
  hipCm = 100,
  heightM = 1.75,
  weightKg = 70,
  leanMassKg = 55,
  gender = "Masculino",
  age = 30,
  armCircCm = 32,
  tricepsFoldMm = 8,
  calfCircCm = 36
} = {}) {
  const isMale = String(gender).toLowerCase().startsWith("m");
  const h = Math.max(0.5, parseFloat(heightM) || 1.75);
  const w = Math.max(20, parseFloat(weightKg) || 70);
  const a = Math.max(10, parseFloat(age) || 30);
  const heightCm = h * 100;
  const waist = parseFloat(waistCm) || 0;
  const hip = parseFloat(hipCm) || 0;

  // Relação Cintura-Quadril (RCQ)
  const rcq = waist > 0 && hip > 0 ? waist / hip : 0;
  let rcqClass = "Adequado";
  if (isMale && rcq >= 0.90) rcqClass = "Atenção / Risco aumentado";
  if (!isMale && rcq >= 0.85) rcqClass = "Atenção / Risco aumentado";

  // Relação Cintura-Estatura (RCEst)
  const rcEst = waist > 0 && heightCm > 0 ? waist / heightCm : 0;
  const rcEstClass = classifyRCEst(rcEst);

  // Massa Muscular Esquelética (MME - Lee et al.)
  const genderVal = isMale ? 1 : 0;
  const mme = h * (0.244 * w + 7.8) - 0.098 * a + 6.6 * genderVal;
  const immeSmi = h > 0 ? mme / (h * h) : 0;

  // Área Muscular do Braço Corrigida (AMBc)
  const arm = parseFloat(armCircCm) || 30;
  const tri = parseFloat(tricepsFoldMm) || 8;
  const cmb = arm - Math.PI * (tri / 10);
  const sexCorrection = isMale ? 10 : 6.5;
  const ambc = Math.max(1, (Math.pow(cmb, 2) / (4 * Math.PI)) - sexCorrection);

  let muscleScore = 80;
  if (immeSmi > 10.5 && ambc > 35) {
    muscleScore = 95;
  } else if (immeSmi > 8.5) {
    muscleScore = 85;
  }

  // Índice de Conicidade (Valdez 1991)
  const waistM = waist / 100;
  const conicity = (w > 0 && h > 0 && waistM > 0)
    ? waistM / (0.109 * Math.sqrt(w / h))
    : 1.15;
  let conicityClass = conicity < 1.18 ? "Adequado (Sem acúmulo visceral)" :
                      conicity < 1.25 ? "Moderado (Acúmulo abdominal)" : "Elevado (Risco Coronariano / Visceral)";

  return {
    rcq: Number(rcq.toFixed(2)),
    rcqClassification: rcqClass,
    rcEst: Number(rcEst.toFixed(2)),
    rcEstClassification: rcEstClass,
    conicityIndex: Number(conicity.toFixed(2)),
    conicityClassification: conicityClass,
    skeletalMuscleMassKg: Number(mme.toFixed(2)),
    immeSmi: Number(immeSmi.toFixed(2)),
    armMuscularArea: Number(ambc.toFixed(2)),
    calfCircumference: parseFloat(calfCircCm) || 36,
    muscleScore,
  };
}

/**
 * 9. Porcionamento Proporcional de Nutrientes na Base 100g/ml
 * @param {Object} foodItem - Item alimentar da base
 * @param {number} targetQuantity - Quantidade prescrita
 * @returns {Object}
 */
function calculateMacroPortion(foodItem, targetQuantity) {
  const target = parseFloat(targetQuantity) || 0;
  if (!foodItem || target <= 0) {
    return { calories: 0, protein: 0, carbohydrate: 0, lipid: 0, fiber: 0, sodium: 0 };
  }

  const baseQty = parseFloat(foodItem.baseQuantity) || 100;
  const factor = target / baseQty;

  return {
    calories: Number(((parseFloat(foodItem.calories) || 0) * factor).toFixed(2)),
    protein: Number(((parseFloat(foodItem.protein) || 0) * factor).toFixed(2)),
    carbohydrate: Number(((parseFloat(foodItem.carbohydrate) || 0) * factor).toFixed(2)),
    lipid: Number(((parseFloat(foodItem.lipid) || 0) * factor).toFixed(2)),
    fiber: Number(((parseFloat(foodItem.fiber) || 0) * factor).toFixed(2)),
    sodium: Number(((parseFloat(foodItem.sodium) || 0) * factor).toFixed(2)),
  };
}

/**
 * 10. Densidade de Macronutrientes por Peso (g/kg)
 * @param {number} totalGrams
 * @param {number} bodyWeightKg
 * @returns {number}
 */
function calculateMacrosPerKg(totalGrams, bodyWeightKg) {
  const grams = parseFloat(totalGrams) || 0;
  const weight = parseFloat(bodyWeightKg) || 1;
  if (weight <= 0) return 0;
  return Number((grams / weight).toFixed(2));
}

/**
 * 11. Cálculo de Metas de Macronutrientes e Calorias por Objetivo Clínico
 * @param {string} objective
 * @param {string} patientType
 * @param {number} weightKg
 * @param {number} getKcal
 * @param {string} gender
 * @returns {Object}
 */
function calculateDietaryMacroTargets(objective = "Perda de peso", patientType = "Praticante recreativo", weightKg = 70.0, getKcal = 2000, gender = "Masculino") {
  const w = parseFloat(weightKg) || 70.0;
  const get = parseFloat(getKcal) || 2000;
  const obj = String(objective).toLowerCase();
  const type = String(patientType).toLowerCase();

  let caloricTarget = get;
  let targetProtKg = 2.0;
  let targetLipKg = 0.8;
  let objectiveLabel = "Perda de peso";
  let guideline = "Déficit calórico moderado com alta densidade proteica para retenção de massa magra.";

  if (obj.includes("perda") || obj.includes("déficit") || obj.includes("deficit") || obj.includes("cutting") || obj.includes("emagrecimento")) {
    caloricTarget = Math.round(get - (w > 90 ? 550 : 468));
    targetProtKg = (type.includes("alto rendimento") || type.includes("atleta")) ? 2.2 : 2.0;
    targetLipKg = 0.75;
    objectiveLabel = "Perda de Peso (Déficit)";
    guideline = "Déficit calórico de ~450-550 kcal com aporte proteico elevado (2.0-2.2 g/kg) para preservar a massa magra.";
  } else if (obj.includes("hipertrofia") || obj.includes("bulking") || obj.includes("superávit") || obj.includes("superavit") || obj.includes("massa")) {
    caloricTarget = Math.round(get + 350);
    targetProtKg = type.includes("atleta") ? 2.0 : 1.8;
    targetLipKg = 0.9;
    objectiveLabel = "Hipertrofia (Superávit)";
    guideline = "Superávit calórico controlado (+350 kcal) com alto aporte de carboidratos para maximizar a síntese proteica e glicogênio.";
  } else if (obj.includes("recomposição") || obj.includes("recomposicao")) {
    caloricTarget = Math.round(get - 150);
    targetProtKg = 2.2;
    targetLipKg = 0.8;
    objectiveLabel = "Recomposição Corporal";
    guideline = "Leve déficit com aporte proteico alto (2.2 g/kg) e estímulo resistido para queima de gordura e ganho muscular simultâneo.";
  } else if (obj.includes("performance") || obj.includes("esportiva") || obj.includes("atleta")) {
    caloricTarget = Math.round(get + 150);
    targetProtKg = 1.8;
    targetLipKg = 0.9;
    objectiveLabel = "Performance Esportiva";
    guideline = "Aporte prioritário de carboidratos complexos (4.5 a 6.0 g/kg) para suporte à alta demanda glicolítica e recuperação muscular.";
  } else {
    caloricTarget = Math.round(get);
    targetProtKg = 1.6;
    targetLipKg = 0.85;
    objectiveLabel = "Manutenção & Saúde";
    guideline = "Plano normocalórico equilibrado com distribuição harmônica de macronutrientes e fibras.";
  }

  const targetProtG = Math.round(w * targetProtKg);
  const targetLipG = Math.round(w * targetLipKg);

  const kcalProtAndLip = (targetProtG * 4) + (targetLipG * 9);
  const targetCarbG = Math.max(20, Math.round((caloricTarget - kcalProtAndLip) / 4));
  const targetCarbKg = Number((targetCarbG / w).toFixed(2));

  const minFiber = Math.max(25, Math.round((caloricTarget / 1000) * 14));

  return {
    caloricTarget,
    getKcal: Math.round(get),
    targetProtG,
    targetProtKg: Number(targetProtKg.toFixed(2)),
    targetLipG,
    targetLipKg: Number(targetLipKg.toFixed(2)),
    targetCarbG,
    targetCarbKg,
    minFiber,
    objectiveLabel,
    guideline
  };
}

/**
 * 12. Projeção Preditiva de Metas de Peso e Gordura
 * @param {number} currentWeightKg
 * @param {number} currentFatPercent
 * @param {number} targetFatPercent
 * @param {number} getKcal
 * @param {number} targetCaloricIntake
 * @returns {Object}
 */
function calculateGoalProjection(
  currentWeightKg = 116.0,
  currentFatPercent = 6.42,
  targetFatPercent = 10.0,
  getKcal = 4207,
  targetCaloricIntake = 3739
) {
  const weight = Math.max(20, parseFloat(currentWeightKg) || 116.0);
  const currentBF = Math.max(3, Math.min(65, parseFloat(currentFatPercent) || 15.0));
  const targetBF = Math.max(3, Math.min(50, parseFloat(targetFatPercent) || 10.0));
  const get = Math.max(800, parseFloat(getKcal) || 2500);
  const intake = Math.max(800, parseFloat(targetCaloricIntake) || 2000);

  const currentFatMassKg = weight * (currentBF / 100);
  const leanMassKg = weight - currentFatMassKg;

  // Peso Alvo preservando MLG: PesoAlvo = MLG / (1 - TargetBF / 100)
  const targetWeightKg = leanMassKg / (1 - (targetBF / 100));
  const targetFatMassKg = targetWeightKg * (targetBF / 100);
  const fatToLoseKg = weight - targetWeightKg;

  const dailyDeficitKcal = Math.round(get - intake);

  let daysNeeded = 0;
  let weeksNeeded = 0;
  let monthsNeeded = 0;
  let weeklyRateKg = 0;
  let status = "Manutenção";
  let statusBadge = "Manutenção";

  if (fatToLoseKg > 0.1) {
    const totalKcalToDeficit = fatToLoseKg * 7700;

    if (dailyDeficitKcal >= 80) {
      daysNeeded = Math.round(totalKcalToDeficit / dailyDeficitKcal);
      weeksNeeded = Number((daysNeeded / 7).toFixed(1));
      monthsNeeded = Number((daysNeeded / 30.4).toFixed(1));
      weeklyRateKg = Number(((dailyDeficitKcal * 7) / 7700).toFixed(2));

      if (weeklyRateKg > 1.2) {
        status = "Déficit agressivo (> 1.2 kg/sem). Risco aumentado de perda de massa magra.";
        statusBadge = "Agressivo / Atenção";
      } else if (weeklyRateKg >= 0.4) {
        status = "Taxa ideal e sustentável (~0.4 - 1.0 kg/sem) com máxima preservação de massa magra.";
        statusBadge = "Excelente / Sustentável";
      } else {
        status = "Déficit suave (< 0.4 kg/sem). Ideal para recomposição corporal e alta adesão.";
        statusBadge = "Gradual / Recomposição";
      }
    } else {
      const refDeficit = 450;
      const refDays = Math.round(totalKcalToDeficit / refDeficit);
      weeksNeeded = Number((refDays / 7).toFixed(1));
      monthsNeeded = Number((refDays / 30.4).toFixed(1));
      weeklyRateKg = Number(((refDeficit * 7) / 7700).toFixed(2));
      status = "Plano atual sem déficit calórico ativo. Estimativa calculada para déficit clínico padrão de 450 kcal/dia.";
      statusBadge = "Manutenção / Estimativa 450 kcal";
    }
  } else {
    status = "Meta de percentual de gordura atingida ou foco em hipertrofia.";
    statusBadge = "Meta Atingida";
    daysNeeded = 0;
    weeksNeeded = 0;
    monthsNeeded = 0;
    weeklyRateKg = 0;
  }

  return {
    currentWeightKg: Number(weight.toFixed(2)),
    leanMassKg: Number(leanMassKg.toFixed(2)),
    currentFatMassKg: Number(currentFatMassKg.toFixed(2)),
    targetFatPercent: Number(targetBF.toFixed(1)),
    targetWeightKg: Number(targetWeightKg.toFixed(2)),
    targetFatMassKg: Number(targetFatMassKg.toFixed(2)),
    fatToLoseKg: Number(fatToLoseKg.toFixed(2)),
    dailyDeficitKcal: Math.max(0, dailyDeficitKcal),
    daysNeeded,
    weeksNeeded,
    monthsNeeded,
    weeklyRateKg,
    status,
    statusBadge,
  };
}

const canonicalMath = {
  calculateIMC,
  calculateBMI,
  calculateTMB,
  calculateGET,
  calculateCaloricTarget,
  calculateEnergyBalance,
  calculateBodyComposition,
  classifyRCEst,
  calculateAnthropometricIndices,
  calculateMacroPortion,
  calculateMacrosPerKg,
  calculateDietaryMacroTargets,
  calculateGoalProjection
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = canonicalMath;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.math = canonicalMath;
}

  });

  // ── MÓDULO: domain/math/index.js ──
  defineModule("domain/math/index.js", function(require, module, exports) {
/**
 * domain/math/index.js
 * 
 * Ponto Único de Exportação do Motor Matemático Canônico e Política Energética.
 * Camada Pura — NutriAx Pro.
 */

const nutritionMath = require('./nutritionMath');
const { DEFAULT_ENERGY_POLICY, validateEnergyPolicy } = require('./energyPolicy');
const { calculateDeterministicEnergyTarget } = require('./energyTarget');
const { DEFAULT_MACRO_POLICY, validateMacroPolicy } = require('./macroPolicy');
const { calculateDeterministicMacroTargets, isAthleteOrHighDemand, normalizeObjectiveCategory } = require('./macroTarget');
const { validateNutritionPrescriptionTargets } = require('./nutritionTargetValidator');

const combined = {
  ...nutritionMath,
  DEFAULT_ENERGY_POLICY,
  validateEnergyPolicy,
  calculateDeterministicEnergyTarget,
  DEFAULT_MACRO_POLICY,
  validateMacroPolicy,
  calculateDeterministicMacroTargets,
  isAthleteOrHighDemand,
  normalizeObjectiveCategory,
  validateNutritionPrescriptionTargets
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = combined;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.math = combined;
  window.NutriDomain.energyPolicy = { DEFAULT_ENERGY_POLICY, validateEnergyPolicy };
  window.NutriDomain.energyTarget = { calculateDeterministicEnergyTarget };
  window.NutriDomain.macroPolicy = { DEFAULT_MACRO_POLICY, validateMacroPolicy };
  window.NutriDomain.macroTarget = { calculateDeterministicMacroTargets, isAthleteOrHighDemand, normalizeObjectiveCategory };
  window.NutriDomain.targetValidator = { validateNutritionPrescriptionTargets };
}

  });

  // ── MÓDULO: domain/math/energyPolicy.js ──
  defineModule("domain/math/energyPolicy.js", function(require, module, exports) {
/**
 * domain/math/energyPolicy.js
 * 
 * Especificação e Política Canônica de Metas Energéticas — NutriAx Pro.
 * Fase N2.1: Separação estrita entre Matemática, Política Energética, Segurança e Procedência.
 * Camada Pura — Zero DOM, Zero Dexie/Firebase, Zero Gemini, Zero I/O.
 */

/**
 * Utilitário de congelamento profundo seguro
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
 * Política Energética Canônica Padrão — Versão N2.1.0
 * 
 * AVISO DE GOVERNANÇA:
 * Todos os valores numéricos abaixo são POLICY_PARAMETERS (parâmetros de configuração de política),
 * e NÃO verdades fisiológicas universais ou absolutas.
 */
const DEFAULT_ENERGY_POLICY = deepFreeze({
  policyVersion: "N2.1.0",
  policyName: "Política Canônica de Modulação Energética Contextual NutriAx Pro",
  parameters: {
    weightLoss: {
      baseDeficitPercent: {
        value: -0.20,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Déficit calórico base configurado na política energética N2.1.0 (20% do GET)."
      },
      highAdiposityModulationPercent: {
        value: -0.04,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Adicional de déficit para indivíduos classificados na política com alta adiposidade (-4% do GET)."
      },
      lowAdiposityModulationPercent: {
        value: 0.05,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Atenuação de déficit para indivíduos classificados na política com baixa adiposidade (+5% do GET)."
      },
      highVolumeTrainingAttenuationPercent: {
        value: 0.03,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Atenuação de déficit configurada para contexto de alto volume de treinamento (+3% do GET)."
      }
    },
    hypertrophy: {
      baseSurplusPercent: {
        value: 0.10,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Superávit calórico base configurado na política energética N2.1.0 (+10% do GET)."
      },
      leanIndividualModulationPercent: {
        value: 0.02,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Acréscimo de superávit para indivíduos classificados na política como magros/atléticos (+2% do GET)."
      },
      highAdiposityModulationPercent: {
        value: -0.06,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Redução de superávit para indivíduos classificados na política com adiposidade elevada (-6% do GET)."
      },
      untrainedAttenuationPercent: {
        value: -0.07,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Atenuação de superávit para ausência de treinamento resistido ativo (-7% do GET)."
      }
    },
    recomposition: {
      baseAdjustmentPercent: {
        value: -0.06,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Ajuste calórico base de recomposição corporal configurado na política N2.1.0 (-6% do GET)."
      },
      highAdiposityDeficitPercent: {
        value: -0.10,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Déficit de recomposição configurado para indivíduos com adiposidade elevada (-10% do GET)."
      },
      leanIndividualAdjustmentPercent: {
        value: -0.02,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Ajuste de recomposição configurado para indivíduos magros/atléticos (-2% do GET)."
      }
    },
    performance: {
      baseAdjustmentPercent: {
        value: 0.03,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Ajuste calórico base para performance esportiva na política N2.1.0 (+3% do GET)."
      },
      highDemandAdjustmentPercent: {
        value: 0.05,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Ajuste para microciclo de alta demanda esportiva na política N2.1.0 (+5% do GET)."
      }
    },
    maintenance: {
      adjustmentPercent: {
        value: 0.0,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Ajuste nulo para manutenção e saúde na política N2.1.0 (0% do GET, meta idêntica ao GET)."
      }
    },
    compositionThresholds: {
      bodyFat: {
        highMale: {
          value: 25.0,
          unit: "percent",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de alta adiposidade masculino configurado na política N2.1.0 (> 25% gordura)."
        },
        highFemale: {
          value: 32.0,
          unit: "percent",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de alta adiposidade feminino configurado na política N2.1.0 (> 32% gordura)."
        },
        lowMale: {
          value: 16.0,
          unit: "percent",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de baixa adiposidade masculino em perda de peso configurado na política N2.1.0 (< 16% gordura)."
        },
        lowFemale: {
          value: 23.0,
          unit: "percent",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de baixa adiposidade feminino em perda de peso configurado na política N2.1.0 (< 23% gordura)."
        },
        leanHypertrophyMale: {
          value: 12.0,
          unit: "percent",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de indivíduo magro para ampliação de superávit em hipertrofia masculino (< 12% gordura)."
        },
        leanHypertrophyFemale: {
          value: 20.0,
          unit: "percent",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de indivíduo magro para ampliação de superávit em hipertrofia feminino (< 20% gordura)."
        },
        highHypertrophyMale: {
          value: 18.0,
          unit: "percent",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de adiposidade elevada para contenção de superávit em hipertrofia masculino (> 18% gordura)."
        },
        highHypertrophyFemale: {
          value: 26.0,
          unit: "percent",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de adiposidade elevada para contenção de superávit em hipertrofia feminino (> 26% gordura)."
        }
      },
      bmiFallback: {
        high: {
          value: 30.0,
          unit: "kg/m2",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de IMC de alta adiposidade para fallback quando ausente %G (IMC >= 30)."
        },
        low: {
          value: 22.0,
          unit: "kg/m2",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de IMC de baixa adiposidade para fallback quando ausente %G (IMC < 22)."
        }
      }
    },
    trainingThresholds: {
      highFrequencyDays: {
        value: 5,
        unit: "days_per_week",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Limiar de frequência de treino semanal classificado como alto volume na política N2.1.0 (>= 5 dias)."
      },
      highCardioWeeklyMinutes: {
        value: 150,
        unit: "minutes_per_week",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Limiar de minutos semanais de cardio classificado como alta demanda na política N2.1.0 (>= 150 min)."
      }
    },
    safety: {
      pediatricBlockingAge: {
        value: 18,
        unit: "years",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Idade mínima para aplicação da política energética adulta. Menores de 18 anos são estritamente bloqueados."
      },
      minimumTargetGuard: {
        maleKcal: 1200,
        femaleKcal: 1000,
        tmbRatio: 0.80,
        enforcement: "WARNING",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Guarda-corpo de piso calórico configurado na política energética N2.1.0 para sinalizar metas energéticas excessivamente restritivas."
      },
      maxDeficitPercent: {
        value: -0.30,
        unit: "ratio_of_get",
        enforcement: "WARNING",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Guarda-corpo de déficit percentual máximo configurado na política N2.1.0 (-30% do GET)."
      },
      maxDeficitKcal: {
        value: -1000,
        unit: "kcal",
        enforcement: "WARNING",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Guarda-corpo de déficit calórico absoluto máximo configurado na política N2.1.0 (-1000 kcal/dia)."
      },
      maxSurplusPercent: {
        value: 0.25,
        unit: "ratio_of_get",
        enforcement: "WARNING",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Guarda-corpo de superávit percentual máximo configurado na política N2.1.0 (+25% do GET)."
      },
      maxSurplusKcal: {
        value: 750,
        unit: "kcal",
        enforcement: "WARNING",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Guarda-corpo de superávit calórico absoluto máximo configurado na política N2.1.0 (+750 kcal/dia)."
      },
      maxRecallDiscrepancyKcal: {
        value: 600,
        unit: "kcal",
        enforcement: "WARNING",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Discrepância máxima configurada entre recordatório alimentar e meta calculada para emissão de alerta de transição (600 kcal)."
      }
    }
  }
});

/**
 * Validador de integridade e completude de um objeto de política energética
 * @param {Object} policy 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateEnergyPolicy(policy) {
  const errors = [];
  if (!policy || typeof policy !== 'object') {
    return { isValid: false, errors: ['Política deve ser um objeto válido.'] };
  }
  if (typeof policy.policyVersion !== 'string' || policy.policyVersion.trim() === '') {
    errors.push('policyVersion é obrigatório e deve ser uma string não-vazia.');
  }
  if (!policy.parameters || typeof policy.parameters !== 'object') {
    errors.push('parameters é obrigatório e deve ser um objeto.');
    return { isValid: false, errors };
  }

  const p = policy.parameters;
  const requiredCategories = ['weightLoss', 'hypertrophy', 'recomposition', 'performance', 'maintenance', 'compositionThresholds', 'trainingThresholds', 'safety'];
  for (const cat of requiredCategories) {
    if (!p[cat] || typeof p[cat] !== 'object') {
      errors.push(`Categoria de política "${cat}" é obrigatória.`);
    }
  }

  if (p.safety) {
    if (!p.safety.pediatricBlockingAge || typeof p.safety.pediatricBlockingAge.value !== 'number') {
      errors.push('safety.pediatricBlockingAge.value é obrigatório e deve ser numérico.');
    }
    if (!p.safety.minimumTargetGuard || typeof p.safety.minimumTargetGuard.maleKcal !== 'number') {
      errors.push('safety.minimumTargetGuard.maleKcal é obrigatório e deve ser numérico.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_ENERGY_POLICY,
    validateEnergyPolicy,
    deepFreeze
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.energyPolicy = {
    DEFAULT_ENERGY_POLICY,
    validateEnergyPolicy,
    deepFreeze
  };
}

  });

  // ── MÓDULO: domain/math/energyTarget.js ──
  defineModule("domain/math/energyTarget.js", function(require, module, exports) {
/**
 * domain/math/energyTarget.js
 * 
 * Motor Determinístico de Meta Energética (caloricTargetKcal) — NutriAx Pro.
 * Fase N2.1: Cálculo determinístico, puro, versionado, auditável e individualizado.
 * 
 * Separação Obrigatória dos Pilares:
 * 1. Matemática: Reutiliza calculateTMB e calculateGET de domain/math/nutritionMath.js.
 * 2. Política Energética: DEFAULT_ENERGY_POLICY (vN2.1.0) em domain/math/energyPolicy.js.
 * 3. Segurança: Rejeição de inconsistências matemáticas e bloqueio estrito para menores de 18 anos.
 * 4. Procedência: Rastreabilidade granular de cada parâmetro de política efetivamente utilizado.
 * 
 * Camada Pura — Zero DOM, Zero Dexie/Firebase, Zero Gemini, Zero I/O, Zero Efeitos Colaterais.
 */

const { calculateTMB, calculateGET } = require('./nutritionMath');
const { DEFAULT_ENERGY_POLICY, validateEnergyPolicy, deepFreeze } = require('./energyPolicy');

/**
 * Calcula determinística e contextualmente a meta energética de ingestão do paciente.
 * 
 * @param {Object} context - NutritionPrescriptionContextDTO validado da Fase N1.1
 * @param {Object} [options={}] - Opções opcionais de execução e override de política
 * @param {Object} [options.policy] - Política energética alternativa (opcional)
 * @returns {Readonly<Object>} Resultado canônico e imutável da meta energética
 */
function calculateDeterministicEnergyTarget(context, options = {}) {
  const policy = options.policy || DEFAULT_ENERGY_POLICY;

  // ── 1. VALIDAÇÃO DE SEGURANÇA DA POLÍTICA ──────────────────────────────────
  const policyValidation = validateEnergyPolicy(policy);
  if (!policyValidation.isValid) {
    const errorBlock = {
      status: "BLOCKED",
      tmbKcal: null,
      getKcal: null,
      adjustmentKcal: null,
      adjustmentPercent: null,
      caloricTargetKcal: null,
      energyBalanceKcal: null,
      objective: null,
      calculationMethod: "DETERMINISTIC_ENERGY_TARGET_N21",
      factorsConsidered: [],
      warnings: [],
      blockingReasons: [`Política energética inválida ou incompleta: ${policyValidation.errors.join('; ')}`],
      rationale: ["Execução bloqueada por não conformidade ou ausência de parâmetros obrigatórios na política energética."],
      policy: {
        version: policy?.policyVersion || "UNKNOWN",
        appliedRule: "INVALID_POLICY_BLOCK",
        parameters: []
      },
      provenance: {
        tmb: { value: null, method: null, source: "MISSING" },
        get: { value: null, activityFactor: null, source: "MISSING" },
        adjustment: { adjustmentKcal: null, adjustmentPercent: null, parameterSource: "INVALID_POLICY", policyVersion: "UNKNOWN" },
        caloricTarget: { caloricTargetKcal: null, energyBalanceKcal: null, safetyStatus: "BLOCKED" }
      }
    };
    return deepFreeze(errorBlock);
  }

  const p = policy.parameters;
  const factorsConsidered = [];
  const warnings = [];
  const blockingReasons = [];
  const rationale = [];
  const appliedParameters = [];

  // ── 2. VALIDAÇÃO ESTRUTURAL DO CONTEXTO DE ENTRADA ─────────────────────────
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    blockingReasons.push("Contexto de prescrição ausente ou inválido (deve ser um objeto não-nulo).");
    return deepFreeze(buildBlockedOutput(null, null, null, factorsConsidered, warnings, blockingReasons, ["Contexto nulo ou de tipo incorreto."], policy, "INVALID_CONTEXT_BLOCK"));
  }

  const patient = context.patient || {};
  const objective = context.objective || {};
  const anthro = context.anthropometry || {};
  const energy = context.energy || {};
  const routine = context.routine || {};
  const training = context.training || {};
  const cardio = context.cardio || {};
  const weeklySchedule = Array.isArray(context.weeklySchedule) ? context.weeklySchedule : [];
  const dietaryRecall = context.dietaryRecall || {};
  const currentPrescription = context.currentPrescription || {};
  const clinical = context.clinical || {};

  // Validação de identificação
  if (!patient.patientId || typeof patient.patientId !== 'string' || patient.patientId.trim() === '') {
    blockingReasons.push("Identificador do paciente (patientId) ausente ou inválido.");
  }

  // Validação biométrica estrita
  const age = patient.age;
  if (age == null || typeof age !== 'number' || isNaN(age) || !isFinite(age) || age < 0 || age > 130) {
    blockingReasons.push("Idade do paciente ausente ou inválida (deve ser um número finito entre 0 e 130).");
  }

  const weightKg = anthro.weightKg;
  if (weightKg == null || typeof weightKg !== 'number' || isNaN(weightKg) || !isFinite(weightKg) || weightKg <= 0 || weightKg > 500) {
    blockingReasons.push("Peso corporal ausente ou inválido (deve ser um número finito > 0 e <= 500 kg).");
  }

  const heightCm = anthro.heightCm;
  if (heightCm == null || typeof heightCm !== 'number' || isNaN(heightCm) || !isFinite(heightCm) || heightCm <= 0 || heightCm > 300) {
    blockingReasons.push("Estatura ausente ou inválida (deve ser um número finito > 0 e <= 300 cm).");
  }

  const clinicalObjective = objective.clinicalObjective ? String(objective.clinicalObjective).trim() : null;
  if (!clinicalObjective || clinicalObjective === '' || clinicalObjective === 'MISSING') {
    blockingReasons.push("Objetivo clínico ausente ou não informado.");
  }

  // Se houver qualquer bloqueio estrutural prévio, encerra imediatamente
  if (blockingReasons.length > 0) {
    return deepFreeze(buildBlockedOutput(null, null, clinicalObjective, factorsConsidered, warnings, blockingReasons, ["Dados estruturais obrigatórios ausentes ou inconsistentes."], policy, "STRUCTURAL_DATA_BLOCK"));
  }

  factorsConsidered.push("Dados Biométricos (Peso, Estatura, Idade, Sexo)");
  factorsConsidered.push("Objetivo Clínico");

  // ── 3. GUARDA-CORPO DE SEGURANÇA PEDIÁTRICA (REGRA OBRIGATÓRIA SEÇÃO 7) ─────
  const pediatricThreshold = p.safety.pediatricBlockingAge.value;
  if (age < pediatricThreshold) {
    appliedParameters.push({
      key: "safety.pediatricBlockingAge",
      value: pediatricThreshold,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.safety.pediatricBlockingAge.rationale
    });

    blockingReasons.push(`Paciente menor de 18 anos (${age} anos): Aplicação de política energética adulta de déficit/superávit é estritamente bloqueada. Requer avaliação e prescrição pediátrica especializada.`);
    rationale.push(`Paciente com idade (${age} anos) inferior ao limite da política adulta (${pediatricThreshold} anos).`);
    rationale.push("Cálculo automático de meta energética adulta bloqueado por protocolo de segurança clínica pediátrica.");

    return deepFreeze(buildBlockedOutput(null, null, clinicalObjective, factorsConsidered, warnings, blockingReasons, rationale, policy, "PEDIATRIC_SAFETY_BLOCK", appliedParameters));
  }

  // ── 4. RESOLUÇÃO MATEMÁTICA CANÔNICA DE TMB E GET (SEÇÃO 3) ────────────────
  const sex = patient.sex || 'Masculino';
  const leanMassKg = (anthro.leanMassKg != null && !isNaN(anthro.leanMassKg) && anthro.leanMassKg > 0) ? anthro.leanMassKg : 0;

  let tmbKcal = null;
  let tmbMethod = null;

  if (energy.tmbKcal != null) {
    if (typeof energy.tmbKcal !== 'number' || isNaN(energy.tmbKcal) || !isFinite(energy.tmbKcal) || energy.tmbKcal <= 0) {
      blockingReasons.push("Taxa Metabólica Basal (TMB) informada é inválida, nula ou não-positiva.");
      return deepFreeze(buildBlockedOutput(null, null, clinicalObjective, factorsConsidered, warnings, blockingReasons, ["Falha de segurança: TMB informada é inválida ou não-positiva."], policy, "INVALID_TMB_BLOCK"));
    }
    tmbKcal = Math.round(energy.tmbKcal);
    tmbMethod = energy.formula || 'Context Energy TMB';
  } else {
    const tmbCalc = calculateTMB(sex, age, weightKg, heightCm / 100, leanMassKg);
    tmbKcal = Math.round(tmbCalc.tmb);
    tmbMethod = tmbCalc.method;
  }

  if (tmbKcal == null || isNaN(tmbKcal) || !isFinite(tmbKcal) || tmbKcal <= 0) {
    blockingReasons.push("Taxa Metabólica Basal (TMB) calculada como inválida ou não-positiva.");
    return deepFreeze(buildBlockedOutput(null, null, clinicalObjective, factorsConsidered, warnings, blockingReasons, ["Falha no cálculo da TMB."], policy, "INVALID_TMB_BLOCK"));
  }

  factorsConsidered.push(`Taxa Metabólica Basal (TMB: ${tmbKcal} kcal via ${tmbMethod})`);
  rationale.push(`1. TMB calculada em ${tmbKcal} kcal/dia utilizando o método canônico "${tmbMethod}".`);

  // Fator de atividade física
  let rawAf = energy.activityFactor;
  if (rawAf == null || isNaN(rawAf) || rawAf <= 0) {
    rawAf = 1.42; // padrão canônico
  }
  const activityFactor = Number(Number(rawAf).toFixed(2));

  let getKcal = null;
  if (energy.getKcal != null) {
    if (typeof energy.getKcal !== 'number' || isNaN(energy.getKcal) || !isFinite(energy.getKcal) || energy.getKcal <= 0) {
      blockingReasons.push("Gasto Energético Total (GET) informado é inválido, nulo ou não-positivo.");
      return deepFreeze(buildBlockedOutput(tmbKcal, null, clinicalObjective, factorsConsidered, warnings, blockingReasons, ["Falha de segurança: GET informado é inválido ou não-positivo."], policy, "INVALID_GET_BLOCK"));
    }
    getKcal = Math.round(energy.getKcal);
  } else {
    getKcal = Math.round(calculateGET(tmbKcal, activityFactor));
  }

  if (getKcal == null || isNaN(getKcal) || !isFinite(getKcal) || getKcal <= 0) {
    blockingReasons.push("Gasto Energético Total (GET) calculado como inválido ou não-positivo.");
    return deepFreeze(buildBlockedOutput(tmbKcal, null, clinicalObjective, factorsConsidered, warnings, blockingReasons, ["Falha no cálculo do GET."], policy, "INVALID_GET_BLOCK"));
  }

  // Verificação de consistência matemática TMB vs GET
  if (activityFactor < 1.0) {
    warnings.push(`Fator de atividade incomum (${activityFactor} < 1.0). Gasto energético total estimado inferior ao metabolismo basal.`);
  }

  factorsConsidered.push(`Gasto Energético Total (GET: ${getKcal} kcal, Fator de Atividade: ${activityFactor})`);
  rationale.push(`2. GET estimado em ${getKcal} kcal/dia (TMB ${tmbKcal} × FA ${activityFactor}). O GET já incorpora o gasto energético de rotina, ocupacional e de treinamento/cardio.`);

  // ── 5. IDENTIFICAÇÃO DO OBJETIVO CLÍNICO E POLÍTICA CORRESPONDENTE ────────
  const normalizedObj = clinicalObjective.toLowerCase();
  let objectiveCategory = 'MAINTENANCE';

  if (normalizedObj.includes('perda') || normalizedObj.includes('emagrecimento') || normalizedObj.includes('déficit') || normalizedObj.includes('deficit') || normalizedObj.includes('cutting') || normalizedObj.includes('definir')) {
    objectiveCategory = 'WEIGHT_LOSS';
  } else if (normalizedObj.includes('hipertrofia') || normalizedObj.includes('ganho') || normalizedObj.includes('bulking') || normalizedObj.includes('superávit') || normalizedObj.includes('superavit') || normalizedObj.includes('massa')) {
    objectiveCategory = 'HYPERTROPHY';
  } else if (normalizedObj.includes('recomposição') || normalizedObj.includes('recomposicao')) {
    objectiveCategory = 'RECOMPOSITION';
  } else if (normalizedObj.includes('performance') || normalizedObj.includes('esportiva') || normalizedObj.includes('rendimento') || normalizedObj.includes('atleta')) {
    objectiveCategory = 'PERFORMANCE';
  } else {
    objectiveCategory = 'MAINTENANCE';
  }

  // ── 6. ANÁLISE DE CONTEXTO E MODULAÇÃO CONFORME A POLÍTICA ─────────────────
  let calculatedAdjustmentPercent = 0.0;
  let appliedRule = "";
  const isMale = String(sex).toLowerCase().startsWith('m');

  // Dados de Composição Corporal
  const bodyFat = (anthro.bodyFatPercent != null && !isNaN(anthro.bodyFatPercent) && anthro.bodyFatPercent > 0) ? anthro.bodyFatPercent : null;
  const bmi = (anthro.bmi != null && !isNaN(anthro.bmi) && anthro.bmi > 0) ? anthro.bmi : null;

  if (bodyFat != null) {
    factorsConsidered.push(`Composição Corporal (% Gordura: ${bodyFat}%)`);
  } else if (bmi != null) {
    factorsConsidered.push(`Composição Corporal via IMC (${bmi} kg/m²) [Fallback]`);
  } else {
    factorsConsidered.push("Composição Corporal: Dados antropométricos detalhados ausentes");
  }

  // Dados de Treino, Cardio e Microciclo
  const hasActiveTraining = !!training.hasActiveTraining;
  const trainingFrequency = (training.frequency != null && typeof training.frequency === 'number') ? training.frequency : (Array.isArray(training.routines) ? training.routines.length : 0);
  const cardioFrequency = (cardio.weeklyFrequency != null && typeof cardio.weeklyFrequency === 'number') ? cardio.weeklyFrequency : (Array.isArray(cardio.sessions) ? cardio.sessions.length : 0);
  
  let totalCardioMinutes = 0;
  if (Array.isArray(cardio.sessions)) {
    totalCardioMinutes = cardio.sessions.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
  }

  const isHighTrainingVolume = trainingFrequency >= p.trainingThresholds.highFrequencyDays.value || totalCardioMinutes >= p.trainingThresholds.highCardioWeeklyMinutes.value;
  if (hasActiveTraining || trainingFrequency > 0) {
    factorsConsidered.push(`Treinamento Físico (${trainingFrequency} sessões/sem, split: ${training.activeSplit || 'Geral'})`);
  }
  if (cardio.hasActiveCardio || cardioFrequency > 0) {
    factorsConsidered.push(`Cardio (${cardioFrequency} sessões/sem, total: ${totalCardioMinutes} min/sem)`);
  }
  if (weeklySchedule.length > 0) {
    factorsConsidered.push(`Microciclo Semanal (${weeklySchedule.length} dias mapeados)`);
  }

  // Invariante de dupla contagem: treino/cardio nunca somam calorias sobre o GET
  rationale.push("3. Dupla contagem rigorosamente evitada: nenhuma caloria de treinamento ou cardio foi somada ao GET.");

  // APLICAÇÃO DA POLÍTICA POR OBJETIVO
  if (objectiveCategory === 'WEIGHT_LOSS') {
    appliedRule = "WEIGHT_LOSS_BASE";
    const baseParam = p.weightLoss.baseDeficitPercent;
    calculatedAdjustmentPercent = baseParam.value;
    appliedParameters.push({
      key: "weightLoss.baseDeficitPercent",
      value: baseParam.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: baseParam.rationale
    });
    rationale.push(`4. Objetivo "${clinicalObjective}" classificado como Perda de Peso. Aplicação de déficit base de ${(baseParam.value * 100).toFixed(1)}% do GET pela política.`);

    // Modulação por Adiposidade
    const highBfThreshold = isMale ? p.compositionThresholds.bodyFat.highMale.value : p.compositionThresholds.bodyFat.highFemale.value;
    const lowBfThreshold = isMale ? p.compositionThresholds.bodyFat.lowMale.value : p.compositionThresholds.bodyFat.lowFemale.value;

    if (bodyFat != null) {
      if (bodyFat >= highBfThreshold) {
        const modParam = p.weightLoss.highAdiposityModulationPercent;
        calculatedAdjustmentPercent += modParam.value;
        appliedRule = "WEIGHT_LOSS_HIGH_ADIPOSITY";
        appliedParameters.push({
          key: "weightLoss.highAdiposityModulationPercent",
          value: modParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: modParam.rationale
        });
        rationale.push(`5. Composição corporal com alta adiposidade (%G ${bodyFat}% >= limiar ${highBfThreshold}%): modulação de ${(modParam.value * 100).toFixed(1)}% do GET aplicada.`);
      } else if (bodyFat <= lowBfThreshold) {
        const modParam = p.weightLoss.lowAdiposityModulationPercent;
        calculatedAdjustmentPercent += modParam.value;
        appliedRule = "WEIGHT_LOSS_LOW_ADIPOSITY";
        appliedParameters.push({
          key: "weightLoss.lowAdiposityModulationPercent",
          value: modParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: modParam.rationale
        });
        rationale.push(`5. Composição corporal atlética/baixa adiposidade (%G ${bodyFat}% <= limiar ${lowBfThreshold}%): atenuação de déficit de +${(modParam.value * 100).toFixed(1)}% do GET aplicada.`);
      } else {
        rationale.push(`5. Composição corporal com adiposidade intermediária (%G ${bodyFat}%): déficit base preservado.`);
      }
    } else if (bmi != null) {
      // Fallback via IMC
      if (bmi >= p.compositionThresholds.bmiFallback.high.value) {
        const modParam = p.weightLoss.highAdiposityModulationPercent;
        calculatedAdjustmentPercent += modParam.value;
        appliedRule = "WEIGHT_LOSS_HIGH_ADIPOSITY_BMI_FALLBACK";
        appliedParameters.push({
          key: "weightLoss.highAdiposityModulationPercent",
          value: modParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: "Fallback via IMC elevado (>= 30 kg/m²)."
        });
        rationale.push(`5. Fallback por IMC elevado (${bmi} kg/m² >= 30): modulação de ${(modParam.value * 100).toFixed(1)}% do GET aplicada.`);
      } else if (bmi <= p.compositionThresholds.bmiFallback.low.value) {
        const modParam = p.weightLoss.lowAdiposityModulationPercent;
        calculatedAdjustmentPercent += modParam.value;
        appliedRule = "WEIGHT_LOSS_LOW_ADIPOSITY_BMI_FALLBACK";
        appliedParameters.push({
          key: "weightLoss.lowAdiposityModulationPercent",
          value: modParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: "Fallback via IMC baixo (< 22 kg/m²)."
        });
        rationale.push(`5. Fallback por IMC baixo (${bmi} kg/m² < 22): atenuação de déficit de +${(modParam.value * 100).toFixed(1)}% do GET aplicada.`);
      }
    }

    // Modulação por Carga de Treinamento
    if (isHighTrainingVolume) {
      const trainParam = p.weightLoss.highVolumeTrainingAttenuationPercent;
      calculatedAdjustmentPercent += trainParam.value;
      appliedRule += "_HIGH_VOLUME_ATTENUATED";
      appliedParameters.push({
        key: "weightLoss.highVolumeTrainingAttenuationPercent",
        value: trainParam.value,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: trainParam.rationale
      });
      appliedParameters.push({
        key: "trainingThresholds.highFrequencyDays",
        value: p.trainingThresholds.highFrequencyDays.value,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: p.trainingThresholds.highFrequencyDays.rationale
      });
      rationale.push(`6. Volume elevado de treino/cardio (${trainingFrequency} dias, ${totalCardioMinutes} min cardio): atenuação de déficit de +${(trainParam.value * 100).toFixed(1)}% do GET aplicada.`);
    }

  } else if (objectiveCategory === 'HYPERTROPHY') {
    appliedRule = "HYPERTROPHY_BASE";
    const baseParam = p.hypertrophy.baseSurplusPercent;
    calculatedAdjustmentPercent = baseParam.value;
    appliedParameters.push({
      key: "hypertrophy.baseSurplusPercent",
      value: baseParam.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: baseParam.rationale
    });
    rationale.push(`4. Objetivo "${clinicalObjective}" classificado como Hipertrofia. Aplicação de superávit base de +${(baseParam.value * 100).toFixed(1)}% do GET pela política.`);

    // Modulação por Composição Corporal em Hipertrofia
    const leanBfThreshold = isMale ? p.compositionThresholds.bodyFat.leanHypertrophyMale.value : p.compositionThresholds.bodyFat.leanHypertrophyFemale.value;
    const highHypBfThreshold = isMale ? p.compositionThresholds.bodyFat.highHypertrophyMale.value : p.compositionThresholds.bodyFat.highHypertrophyFemale.value;

    if (bodyFat != null) {
      if (bodyFat <= leanBfThreshold) {
        const leanParam = p.hypertrophy.leanIndividualModulationPercent;
        calculatedAdjustmentPercent += leanParam.value;
        appliedRule = "HYPERTROPHY_LEAN_INDIVIDUAL";
        appliedParameters.push({
          key: "hypertrophy.leanIndividualModulationPercent",
          value: leanParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: leanParam.rationale
        });
        rationale.push(`5. Indivíduo com adiposidade reduzida (%G ${bodyFat}% <= limiar ${leanBfThreshold}%): acréscimo de superávit de +${(leanParam.value * 100).toFixed(1)}% do GET aplicado.`);
      } else if (bodyFat >= highHypBfThreshold) {
        const highParam = p.hypertrophy.highAdiposityModulationPercent;
        calculatedAdjustmentPercent += highParam.value;
        appliedRule = "HYPERTROPHY_HIGH_ADIPOSITY_CONSTRAINED";
        appliedParameters.push({
          key: "hypertrophy.highAdiposityModulationPercent",
          value: highParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: highParam.rationale
        });
        rationale.push(`5. Indivíduo com adiposidade elevada (%G ${bodyFat}% >= limiar ${highHypBfThreshold}%): contenção de superávit de ${(highParam.value * 100).toFixed(1)}% do GET aplicada.`);
      }
    }

    // Verificação de Ausência de Treinamento Resistido
    if (!hasActiveTraining && trainingFrequency === 0) {
      const untrainedParam = p.hypertrophy.untrainedAttenuationPercent;
      calculatedAdjustmentPercent += untrainedParam.value;
      appliedRule += "_UNTRAINED_ATTENUATED";
      appliedParameters.push({
        key: "hypertrophy.untrainedAttenuationPercent",
        value: untrainedParam.value,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: untrainedParam.rationale
      });
      warnings.push("Objetivo de hipertrofia selecionado sem treino resistido ativo cadastrado. Superávit atenuado pela política.");
      rationale.push(`6. Ausência de treinamento resistido ativo: atenuação de superávit de ${(untrainedParam.value * 100).toFixed(1)}% do GET aplicada.`);
    }

  } else if (objectiveCategory === 'RECOMPOSITION') {
    appliedRule = "RECOMPOSITION_BASE";
    const baseParam = p.recomposition.baseAdjustmentPercent;
    calculatedAdjustmentPercent = baseParam.value;
    appliedParameters.push({
      key: "recomposition.baseAdjustmentPercent",
      value: baseParam.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: baseParam.rationale
    });
    rationale.push(`4. Objetivo "${clinicalObjective}" classificado como Recomposição Corporal. Ajuste base de ${(baseParam.value * 100).toFixed(1)}% do GET pela política.`);

    const highBfThreshold = isMale ? p.compositionThresholds.bodyFat.highMale.value : p.compositionThresholds.bodyFat.highFemale.value;
    const lowBfThreshold = isMale ? p.compositionThresholds.bodyFat.lowMale.value : p.compositionThresholds.bodyFat.lowFemale.value;

    if (bodyFat != null) {
      if (bodyFat >= highBfThreshold) {
        const highParam = p.recomposition.highAdiposityDeficitPercent;
        calculatedAdjustmentPercent = highParam.value;
        appliedRule = "RECOMPOSITION_HIGH_ADIPOSITY";
        appliedParameters.push({
          key: "recomposition.highAdiposityDeficitPercent",
          value: highParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: highParam.rationale
        });
        rationale.push(`5. Recomposição com adiposidade elevada (%G ${bodyFat}%): déficit definido em ${(highParam.value * 100).toFixed(1)}% do GET.`);
      } else if (bodyFat <= lowBfThreshold) {
        const leanParam = p.recomposition.leanIndividualAdjustmentPercent;
        calculatedAdjustmentPercent = leanParam.value;
        appliedRule = "RECOMPOSITION_LEAN";
        appliedParameters.push({
          key: "recomposition.leanIndividualAdjustmentPercent",
          value: leanParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: leanParam.rationale
        });
        rationale.push(`5. Recomposição em indivíduo magro/atlético (%G ${bodyFat}%): ajuste definido em ${(leanParam.value * 100).toFixed(1)}% do GET.`);
      }
    }

  } else if (objectiveCategory === 'PERFORMANCE') {
    appliedRule = "PERFORMANCE_BASE";
    const baseParam = p.performance.baseAdjustmentPercent;
    calculatedAdjustmentPercent = baseParam.value;
    appliedParameters.push({
      key: "performance.baseAdjustmentPercent",
      value: baseParam.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: baseParam.rationale
    });
    rationale.push(`4. Objetivo "${clinicalObjective}" classificado como Performance Esportiva. Ajuste base de +${(baseParam.value * 100).toFixed(1)}% do GET.`);

    if (isHighTrainingVolume || weeklySchedule.length >= 5) {
      const demandParam = p.performance.highDemandAdjustmentPercent;
      calculatedAdjustmentPercent = demandParam.value;
      appliedRule = "PERFORMANCE_HIGH_DEMAND";
      appliedParameters.push({
        key: "performance.highDemandAdjustmentPercent",
        value: demandParam.value,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: demandParam.rationale
      });
      rationale.push(`5. Microciclo de alta demanda esportiva: ajuste definido em +${(demandParam.value * 100).toFixed(1)}% do GET.`);
    }

  } else {
    // MAINTENANCE
    appliedRule = "MAINTENANCE_NORMOCALORIC";
    const maintParam = p.maintenance.adjustmentPercent;
    calculatedAdjustmentPercent = maintParam.value;
    appliedParameters.push({
      key: "maintenance.adjustmentPercent",
      value: maintParam.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: maintParam.rationale
    });
    rationale.push(`4. Objetivo "${clinicalObjective}" classificado como Manutenção & Saúde. Meta normocalórica idêntica ao GET (ajuste de 0%).`);
  }

  // ── 7. CÁLCULO DA META ENERGÉTICA E BALANÇO ─────────────────────────────────
  const adjustmentPercent = Number(calculatedAdjustmentPercent.toFixed(4));
  const adjustmentKcal = Math.round(getKcal * adjustmentPercent);
  const caloricTargetKcal = Math.round(getKcal + adjustmentKcal);
  const energyBalanceKcal = caloricTargetKcal - getKcal;

  rationale.push(`7. Ajuste energético final determinado: ${adjustmentKcal >= 0 ? '+' : ''}${adjustmentKcal} kcal (${(adjustmentPercent * 100).toFixed(1)}% do GET).`);
  rationale.push(`8. Meta energética calculada (caloricTargetKcal): ${caloricTargetKcal} kcal/dia.`);
  rationale.push(`9. Balanço energético estimado (energyBalanceKcal): ${energyBalanceKcal >= 0 ? '+' : ''}${energyBalanceKcal} kcal/dia.`);

  // ── 8. CONTEXTUALIZAÇÃO DO RECORDATÓRIO ALIMENTAR (SEÇÃO 11) ────────────────
  if (dietaryRecall && dietaryRecall.hasRecall && Array.isArray(dietaryRecall.items) && dietaryRecall.items.length > 0) {
    factorsConsidered.push(`Recordatório Alimentar (${dietaryRecall.items.length} itens relatados)`);
    const recallKcal = Math.round(dietaryRecall.items.reduce((acc, it) => acc + (it.macros?.calories || 0), 0));
    
    if (recallKcal > 0) {
      rationale.push(`10. Recordatório alimentar atual totaliza ${recallKcal} kcal/dia. O recordatório serve como referência de consumo habitual e NÃO sobrescreve a meta energética.`);
      const discrepancy = Math.abs(caloricTargetKcal - recallKcal);
      const maxDiscrepancyParam = p.safety.maxRecallDiscrepancyKcal;

      if (discrepancy >= maxDiscrepancyParam.value) {
        warnings.push(`Discrepância acentuada (${discrepancy} kcal) entre o consumo habitual relatado no recordatório (${recallKcal} kcal) e a meta calculada (${caloricTargetKcal} kcal). Recomenda-se transição progressiva de calorias.`);
        appliedParameters.push({
          key: "safety.maxRecallDiscrepancyKcal",
          value: maxDiscrepancyParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: maxDiscrepancyParam.rationale
        });
      }
    }
  }

  // ── 9. PRESCRIÇÃO HISTÓRICA E META HOMOLOGADA ──────────────────────────────
  if (currentPrescription && currentPrescription.prescribedKcal != null) {
    factorsConsidered.push(`Prescrição Anterior (${currentPrescription.prescribedKcal} kcal)`);
    rationale.push(`11. Prescrição histórica no prontuário (${currentPrescription.prescribedKcal} kcal) avaliada como histórico e NÃO sobrescreve a meta atual determinada pelo motor.`);
  }

  if (energy.source === 'HOMOLOGATED_TARGET' || (energy.caloricTargetKcal != null && options.approvedCaloricTarget != null)) {
    factorsConsidered.push("Meta Homologada Prévia");
    rationale.push(`12. Meta homologada prévia identificada no contexto (${energy.caloricTargetKcal} kcal). O motor determinístico reporta sua recomendação independente.`);
  }

  // ── 10. DADOS CLÍNICOS E EXAMES ─────────────────────────────────────────────
  if (clinical && Array.isArray(clinical.exams) && clinical.exams.length > 0) {
    factorsConsidered.push(`Exames Clínicos Laboratoriais (${clinical.exams.length} exames)`);
    rationale.push("13. Exames clínicos laboratoriais considerados no contexto; nenhum ajuste calórico arbitrário aplicado (clinicalAdjustmentKcal = 0, clinicalRuleApplied: false).");
  }

  // ── 11. GUARDA-CORPOS DE SEGURANÇA E ALERTAS DA POLÍTICA ────────────────────
  // Piso Calórico Seguro da Política
  const minFloor = isMale ? p.safety.minimumTargetGuard.maleKcal : p.safety.minimumTargetGuard.femaleKcal;
  const tmbRatioFloor = Math.round(tmbKcal * p.safety.minimumTargetGuard.tmbRatio);
  const effectiveFloor = Math.max(minFloor, tmbRatioFloor);

  if (caloricTargetKcal < effectiveFloor) {
    warnings.push(`Meta energética calculada (${caloricTargetKcal} kcal) abaixo do piso de segurança da política (${effectiveFloor} kcal). Requer acompanhamento clínico.`);
    appliedParameters.push({
      key: "safety.minimumTargetGuard",
      value: minFloor,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.safety.minimumTargetGuard.rationale
    });
  }

  if (caloricTargetKcal < tmbKcal) {
    warnings.push(`Meta energética calculada (${caloricTargetKcal} kcal) abaixo da TMB (${tmbKcal} kcal). Monitorar sustentabilidade metabólica.`);
  }

  // Déficit Máximo
  if (adjustmentPercent < p.safety.maxDeficitPercent.value) {
    warnings.push(`Déficit percentual (${(adjustmentPercent * 100).toFixed(1)}%) ultrapassa o limite de alerta da política (${(p.safety.maxDeficitPercent.value * 100).toFixed(1)}%).`);
    appliedParameters.push({
      key: "safety.maxDeficitPercent",
      value: p.safety.maxDeficitPercent.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.safety.maxDeficitPercent.rationale
    });
  }

  if (adjustmentKcal < p.safety.maxDeficitKcal.value) {
    warnings.push(`Déficit absoluto (${adjustmentKcal} kcal) ultrapassa o limite de alerta da política (${p.safety.maxDeficitKcal.value} kcal).`);
    appliedParameters.push({
      key: "safety.maxDeficitKcal",
      value: p.safety.maxDeficitKcal.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.safety.maxDeficitKcal.rationale
    });
  }

  // Superávit Máximo
  if (adjustmentPercent > p.safety.maxSurplusPercent.value) {
    warnings.push(`Superávit percentual (+${(adjustmentPercent * 100).toFixed(1)}%) ultrapassa o limite de alerta da política (+${(p.safety.maxSurplusPercent.value * 100).toFixed(1)}%).`);
    appliedParameters.push({
      key: "safety.maxSurplusPercent",
      value: p.safety.maxSurplusPercent.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.safety.maxSurplusPercent.rationale
    });
  }

  if (adjustmentKcal > p.safety.maxSurplusKcal.value) {
    warnings.push(`Superávit absoluto (+${adjustmentKcal} kcal) ultrapassa o limite de alerta da política (+${p.safety.maxSurplusKcal.value} kcal).`);
    appliedParameters.push({
      key: "safety.maxSurplusKcal",
      value: p.safety.maxSurplusKcal.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.safety.maxSurplusKcal.rationale
    });
  }

  // Ausência de avaliação antropométrica recente
  if (anthro.hasRecentAssessment === false) {
    warnings.push("Ausência de avaliação antropométrica recente no prontuário. Cálculo executado com base nos dados biométricos cadastrais.");
  }

  // ── 12. DETERMINAÇÃO FINAL DO STATUS E ESTRUTURAÇÃO DA SAÍDA ───────────────
  const finalStatus = warnings.length > 0 ? "WARNING" : "PASS";

  const result = {
    status: finalStatus,
    tmbKcal,
    getKcal,
    adjustmentKcal,
    adjustmentPercent,
    caloricTargetKcal,
    energyBalanceKcal,
    objective: clinicalObjective,
    calculationMethod: "DETERMINISTIC_ENERGY_TARGET_N21",
    factorsConsidered,
    warnings,
    blockingReasons,
    rationale,
    policy: {
      version: policy.policyVersion,
      appliedRule,
      parameters: appliedParameters
    },
    provenance: {
      tmb: {
        value: tmbKcal,
        method: tmbMethod,
        source: "domain/math/nutritionMath.js"
      },
      get: {
        value: getKcal,
        activityFactor,
        source: "domain/math/nutritionMath.js"
      },
      adjustment: {
        adjustmentKcal,
        adjustmentPercent,
        parameterSource: "POLICY_PARAMETER",
        policyVersion: policy.policyVersion
      },
      caloricTarget: {
        caloricTargetKcal,
        energyBalanceKcal,
        safetyStatus: finalStatus
      }
    }
  };

  return deepFreeze(result);
}

/**
 * Função utilitária interna para construção de saídas no estado BLOCKED
 */
function buildBlockedOutput(tmbKcal, getKcal, objective, factorsConsidered, warnings, blockingReasons, rationale, policy, appliedRule, appliedParameters = []) {
  return {
    status: "BLOCKED",
    tmbKcal: tmbKcal || null,
    getKcal: getKcal || null,
    adjustmentKcal: null,
    adjustmentPercent: null,
    caloricTargetKcal: null,
    energyBalanceKcal: null,
    objective: objective || null,
    calculationMethod: "DETERMINISTIC_ENERGY_TARGET_N21",
    factorsConsidered: factorsConsidered || [],
    warnings: warnings || [],
    blockingReasons: blockingReasons || [],
    rationale: rationale || [],
    policy: {
      version: policy?.policyVersion || "UNKNOWN",
      appliedRule: appliedRule || "BLOCKED_RULE",
      parameters: appliedParameters || []
    },
    provenance: {
      tmb: { value: tmbKcal || null, method: null, source: tmbKcal ? "domain/math/nutritionMath.js" : "MISSING" },
      get: { value: getKcal || null, activityFactor: null, source: getKcal ? "domain/math/nutritionMath.js" : "MISSING" },
      adjustment: { adjustmentKcal: null, adjustmentPercent: null, parameterSource: "BLOCKED", policyVersion: policy?.policyVersion || "UNKNOWN" },
      caloricTarget: { caloricTargetKcal: null, energyBalanceKcal: null, safetyStatus: "BLOCKED" }
    }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateDeterministicEnergyTarget
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.energyTarget = {
    calculateDeterministicEnergyTarget
  };
}

  });

  // ── MÓDULO: domain/math/macroPolicy.js ──
  defineModule("domain/math/macroPolicy.js", function(require, module, exports) {
/**
 * domain/math/macroPolicy.js
 * 
 * Especificação e Política Canônica de Metas de Macronutrientes — NutriAx Pro.
 * Fase N2.2: Separação estrita entre Matemática Atwater, Política de Macronutrientes, Segurança e Procedência.
 * Camada Pura — Zero DOM, Zero Dexie/Firebase, Zero Gemini, Zero I/O.
 */

/**
 * Utilitário de congelamento profundo recursivo
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
 * Política Canônica de Macronutrientes Padrão — Versão N2.2.0
 * 
 * AVISO DE GOVERNANÇA:
 * Todos os valores numéricos abaixo são POLICY_PARAMETERS (parâmetros de configuração de política),
 * e NÃO verdades fisiológicas universais ou absolutas.
 */
const DEFAULT_MACRO_POLICY = deepFreeze({
  policyVersion: "N2.2.0",
  policyName: "Política Canônica de Distribuição de Macronutrientes NutriAx Pro",
  parameters: {
    protein: {
      defaultStrategy: "TOTAL_BODY_WEIGHT",
      byObjective: {
        weightLoss: {
          baseGPerKg: {
            value: 2.0,
            unit: "g/kg",
            source: "POLICY_PARAMETER",
            version: "N2.2.0",
            rationale: "Aporte proteico base para perda de peso e preservação de massa magra sob restrição energética (2.0 g/kg)."
          },
          athleteOrHighDemandModulation: {
            value: 0.2,
            unit: "g/kg",
            source: "POLICY_PARAMETER",
            version: "N2.2.0",
            rationale: "Adicional proteico para atletas ou praticantes com alta demanda esportiva em déficit calórico (+0.2 g/kg, resultando em 2.2 g/kg)."
          }
        },
        hypertrophy: {
          baseGPerKg: {
            value: 1.8,
            unit: "g/kg",
            source: "POLICY_PARAMETER",
            version: "N2.2.0",
            rationale: "Aporte proteico base para maximização da síntese proteica muscular em superávit calórico (1.8 g/kg)."
          },
          athleteOrHighDemandModulation: {
            value: 0.2,
            unit: "g/kg",
            source: "POLICY_PARAMETER",
            version: "N2.2.0",
            rationale: "Adicional proteico para atletas de alto rendimento em hipertrofia (+0.2 g/kg, resultando em 2.0 g/kg)."
          }
        },
        recomposition: {
          baseGPerKg: {
            value: 2.2,
            unit: "g/kg",
            source: "POLICY_PARAMETER",
            version: "N2.2.0",
            rationale: "Aporte proteico elevado para estímulo anabólico simultâneo à oxidação lipídica em recomposição corporal (2.2 g/kg)."
          }
        },
        performance: {
          baseGPerKg: {
            value: 1.8,
            unit: "g/kg",
            source: "POLICY_PARAMETER",
            version: "N2.2.0",
            rationale: "Aporte proteico equilibrado para suporte à recuperação neuromuscular sem comprometer a cota glicídica (1.8 g/kg)."
          },
          athleteOrHighDemandModulation: {
            value: 0.2,
            unit: "g/kg",
            source: "POLICY_PARAMETER",
            version: "N2.2.0",
            rationale: "Adicional proteico para atletas competitivos de alta intensidade (+0.2 g/kg, resultando em 2.0 g/kg)."
          }
        },
        maintenance: {
          baseGPerKg: {
            value: 1.6,
            unit: "g/kg",
            source: "POLICY_PARAMETER",
            version: "N2.2.0",
            rationale: "Aporte proteico normocalórico para manutenção da massa magra e saúde geral (1.6 g/kg)."
          }
        }
      },
      leanMassTargetGPerKg: {
        weightLoss: {
          value: 2.4,
          unit: "g/kg_lbm",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte proteico por kg de massa magra (FFM) em déficit calórico (2.4 g/kg LBM)."
        },
        hypertrophy: {
          value: 2.2,
          unit: "g/kg_lbm",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte proteico por kg de massa magra (FFM) em hipertrofia (2.2 g/kg LBM)."
        },
        recomposition: {
          value: 2.5,
          unit: "g/kg_lbm",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte proteico por kg de massa magra (FFM) em recomposição (2.5 g/kg LBM)."
        },
        performance: {
          value: 2.2,
          unit: "g/kg_lbm",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte proteico por kg de massa magra (FFM) em performance (2.2 g/kg LBM)."
        },
        maintenance: {
          value: 2.0,
          unit: "g/kg_lbm",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte proteico por kg de massa magra (FFM) em manutenção (2.0 g/kg LBM)."
        }
      },
      safety: {
        maxProteinGPerKg: {
          value: 3.5,
          unit: "g/kg",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Limiar de alerta para aporte proteico elevado (> 3.5 g/kg de peso corporal)."
        }
      }
    },
    fat: {
      byObjective: {
        weightLoss: {
          value: 0.75,
          unit: "g/kg",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte lipídico controlado em perda de peso para preservar cotas de carboidrato (0.75 g/kg)."
        },
        hypertrophy: {
          value: 0.90,
          unit: "g/kg",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte lipídico adequado para suporte hormonal e densidade calórica em superávit (0.90 g/kg)."
        },
        recomposition: {
          value: 0.80,
          unit: "g/kg",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte lipídico intermediário em recomposição corporal (0.80 g/kg)."
        },
        performance: {
          value: 0.90,
          unit: "g/kg",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte lipídico para sustentação energética e recuperação em atletas (0.90 g/kg)."
        },
        maintenance: {
          value: 0.85,
          unit: "g/kg",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte lipídico de referência para manutenção e saúde geral (0.85 g/kg)."
        }
      },
      guards: {
        minFatGPerKg: {
          value: 0.60,
          unit: "g/kg",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Piso de segurança lipídica por peso corporal para assegurar absorção de vitaminas lipossolúveis e função hormonal mínima (0.60 g/kg)."
        },
        minFatPercent: {
          value: 0.15,
          unit: "ratio_of_calories",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Piso de segurança lipídica percentual (15% das calorias totais) para evitar dietas ultra-pobres em lipídios essenciais."
        }
      }
    },
    carbohydrate: {
      strategy: "RESIDUAL_ENERGY_ATWATER",
      guards: {
        minimumCarbG: {
          value: 20,
          unit: "g",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Piso mínimo de segurança de carboidrato diário para suporte fisiológico basal de tecidos estritamente glicodependentes (20g/dia)."
        }
      }
    },
    fiber: {
      enabled: true,
      fiberPer1000Kcal: {
        value: 14.0,
        unit: "g/1000kcal",
        source: "POLICY_PARAMETER",
        version: "N2.2.0",
        rationale: "Diretriz DRI / FAO de ingestão de fibras (14g por 1000 kcal da meta energética)."
      },
      minimumFiberG: {
        value: 25.0,
        unit: "g",
        source: "POLICY_PARAMETER",
        version: "N2.2.0",
        rationale: "Piso mínimo absoluto de ingestão diária de fibras para adultos (25g/dia)."
      }
    },
    energyCoefficients: {
      proteinKcalPerG: {
        value: 4,
        unit: "kcal/g",
        source: "MATHEMATICAL_CONSTANT",
        version: "N2.2.0",
        rationale: "Fator clássico de Atwater para densidade energética da proteína (4 kcal/g)."
      },
      carbohydrateKcalPerG: {
        value: 4,
        unit: "kcal/g",
        source: "MATHEMATICAL_CONSTANT",
        version: "N2.2.0",
        rationale: "Fator clássico de Atwater para densidade energética do carboidrato (4 kcal/g)."
      },
      fatKcalPerG: {
        value: 9,
        unit: "kcal/g",
        source: "MATHEMATICAL_CONSTANT",
        version: "N2.2.0",
        rationale: "Fator clássico de Atwater para densidade energética dos lipídios (9 kcal/g)."
      }
    },
    safety: {
      pediatricBlockingAge: {
        value: 18,
        unit: "years",
        source: "POLICY_PARAMETER",
        version: "N2.2.0",
        rationale: "Idade mínima para aplicação de distribuição de macronutrientes adulta. Menores de 18 anos são estritamente bloqueados."
      },
      energyToleranceKcal: {
        value: 5,
        unit: "kcal",
        source: "POLICY_PARAMETER",
        version: "N2.2.0",
        rationale: "Tolerância técnica máxima aceitável para discrepância entre a soma dos macronutrientes (4P+4C+9G) e caloricTargetKcal devido ao arredondamento em gramas inteiras."
      }
    }
  }
});

/**
 * Validador de integridade e completude de um objeto de política de macronutrientes
 * @param {Object} policy 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateMacroPolicy(policy) {
  const errors = [];
  if (!policy || typeof policy !== 'object') {
    return { isValid: false, errors: ['Política deve ser um objeto válido não-nulo.'] };
  }
  if (typeof policy.policyVersion !== 'string' || policy.policyVersion.trim() === '') {
    errors.push('policyVersion é obrigatório e deve ser uma string não-vazia.');
  }
  if (!policy.parameters || typeof policy.parameters !== 'object') {
    errors.push('parameters é obrigatório e deve ser um objeto.');
    return { isValid: false, errors };
  }

  const p = policy.parameters;
  const requiredSections = ['protein', 'fat', 'carbohydrate', 'safety'];
  for (const sec of requiredSections) {
    if (!p[sec] || typeof p[sec] !== 'object') {
      errors.push(`Seção de política "${sec}" é obrigatória.`);
    }
  }

  if (p.protein) {
    if (!p.protein.byObjective || typeof p.protein.byObjective !== 'object') {
      errors.push('protein.byObjective é obrigatório e deve ser um objeto.');
    } else {
      const objectives = ['weightLoss', 'hypertrophy', 'recomposition', 'performance', 'maintenance'];
      for (const obj of objectives) {
        if (!p.protein.byObjective[obj] || typeof p.protein.byObjective[obj].baseGPerKg?.value !== 'number') {
          errors.push(`protein.byObjective.${obj}.baseGPerKg.value é obrigatório e numérico.`);
        }
      }
    }
  }

  if (p.fat) {
    if (!p.fat.byObjective || typeof p.fat.byObjective !== 'object') {
      errors.push('fat.byObjective é obrigatório e deve ser um objeto.');
    } else {
      const objectives = ['weightLoss', 'hypertrophy', 'recomposition', 'performance', 'maintenance'];
      for (const obj of objectives) {
        if (!p.fat.byObjective[obj] || typeof p.fat.byObjective[obj].value !== 'number') {
          errors.push(`fat.byObjective.${obj}.value é obrigatório e numérico.`);
        }
      }
    }
    if (!p.fat.guards || typeof p.fat.guards.minFatGPerKg?.value !== 'number' || typeof p.fat.guards.minFatPercent?.value !== 'number') {
      errors.push('fat.guards com minFatGPerKg e minFatPercent numéricos são obrigatórios.');
    }
  }

  if (p.carbohydrate) {
    if (!p.carbohydrate.guards || typeof p.carbohydrate.guards.minimumCarbG?.value !== 'number') {
      errors.push('carbohydrate.guards.minimumCarbG.value é obrigatório e deve ser numérico.');
    }
  }

  if (p.safety) {
    if (!p.safety.pediatricBlockingAge || typeof p.safety.pediatricBlockingAge.value !== 'number') {
      errors.push('safety.pediatricBlockingAge.value é obrigatório e deve ser numérico.');
    }
    if (!p.safety.energyToleranceKcal || typeof p.safety.energyToleranceKcal.value !== 'number') {
      errors.push('safety.energyToleranceKcal.value é obrigatório e deve ser numérico.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_MACRO_POLICY,
    validateMacroPolicy,
    deepFreeze
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.macroPolicy = {
    DEFAULT_MACRO_POLICY,
    validateMacroPolicy,
    deepFreeze
  };
}

  });

  // ── MÓDULO: domain/math/macroTarget.js ──
  defineModule("domain/math/macroTarget.js", function(require, module, exports) {
/**
 * domain/math/macroTarget.js
 * 
 * Motor Determinístico de Metas de Macronutrientes (N2.2) — NutriAx Pro.
 * Fase N2.2: Cálculo determinístico, puro, versionado, auditável e individualizado.
 * 
 * Separação Obrigatória dos Pilares:
 * 1. Matemática Atwater: 4 kcal/g para proteína, 4 kcal/g para carboidrato, 9 kcal/g para lipídios.
 * 2. Política de Macronutrientes: DEFAULT_MACRO_POLICY (vN2.2.0) em domain/math/macroPolicy.js.
 * 3. Segurança: Rejeição estrita de inconsistências matemáticas, bloqueio pediátrico e resíduo negativo.
 * 4. Procedência: Rastreabilidade granular de cada parâmetro de política efetivamente utilizado.
 * 
 * Camada Pura — Zero DOM, Zero Dexie/Firebase, Zero Gemini, Zero I/O, Zero Efeitos Colaterais.
 */

const { DEFAULT_MACRO_POLICY, validateMacroPolicy, deepFreeze } = require('./macroPolicy');

/**
 * Avalia se o paciente possui perfil de atleta ou alta demanda esportiva formalmente cadastrado
 * @param {Object} context 
 * @returns {boolean}
 */
function isAthleteOrHighDemand(context) {
  const patientType = String(context?.patient?.patientType || '').toLowerCase();
  const trainingLevel = String(context?.patient?.trainingLevel || '').toLowerCase();
  const isAthleteType = patientType.includes('atleta') || patientType.includes('alto rendimento');
  const isAthleteLevel = trainingLevel.includes('atleta') || trainingLevel.includes('competidor');
  return isAthleteType || isAthleteLevel;
}

/**
 * Normaliza e identifica a categoria de objetivo clínico formal
 * @param {string} objectiveStr 
 * @returns {string|null}
 */
function normalizeObjectiveCategory(objectiveStr) {
  if (!objectiveStr || typeof objectiveStr !== 'string') return null;
  const obj = objectiveStr.trim().toLowerCase();
  if (obj === '' || obj === 'missing') return null;

  if (obj.includes('perda') || obj.includes('emagrecimento') || obj.includes('déficit') || obj.includes('deficit') || obj.includes('cutting') || obj.includes('definir')) {
    return 'weightLoss';
  }
  if (obj.includes('hipertrofia') || obj.includes('ganho') || obj.includes('bulking') || obj.includes('superávit') || obj.includes('superavit') || obj.includes('massa')) {
    return 'hypertrophy';
  }
  if (obj.includes('recomposição') || obj.includes('recomposicao')) {
    return 'recomposition';
  }
  if (obj.includes('performance') || obj.includes('esportiva') || obj.includes('rendimento') || obj.includes('atleta')) {
    return 'performance';
  }
  if (obj.includes('manutenção') || obj.includes('manutencao') || obj.includes('saúde') || obj.includes('saude') || obj.includes('geral') || obj.includes('equilíbrio') || obj.includes('equilibrio')) {
    return 'maintenance';
  }
  return null;
}

/**
 * Calcula de forma pura, determinística e rastreável a distribuição de macronutrientes.
 * 
 * @param {Object} context - NutritionPrescriptionContextDTO validado da Fase N1.1
 * @param {Object} [energyTargetResult=null] - Resultado da Fase N2.1 (ou null se presente no context)
 * @param {Object} [options={}] - Opções opcionais (política alternativa, estratégia de proteína)
 * @returns {Readonly<Object>} Resultado canônico e imutável das metas de macronutrientes
 */
function calculateDeterministicMacroTargets(context, energyTargetResult = null, options = {}) {
  const policy = options.policy || DEFAULT_MACRO_POLICY;

  const factorsConsidered = [];
  const warnings = [];
  const blockingReasons = [];
  const rationale = [];
  const appliedParameters = [];
  const appliedRules = [];

  // ── 1. VALIDAÇÃO DE SEGURANÇA DA POLÍTICA ──────────────────────────────────
  const policyValidation = validateMacroPolicy(policy);
  if (!policyValidation.isValid) {
    blockingReasons.push(`Política de macronutrientes inválida ou incompleta: ${policyValidation.errors.join('; ')}`);
    return deepFreeze(buildBlockedOutput(null, null, factorsConsidered, warnings, blockingReasons, ["Execução bloqueada por não conformidade da política."], policy, ["INVALID_POLICY_BLOCK"], appliedParameters));
  }

  const p = policy.parameters;

  // ── 2. VALIDAÇÃO ESTRUTURAL DO CONTEXTO DE ENTRADA ─────────────────────────
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    blockingReasons.push("Contexto de prescrição ausente ou inválido (deve ser um objeto não-nulo).");
    return deepFreeze(buildBlockedOutput(null, null, factorsConsidered, warnings, blockingReasons, ["Contexto nulo ou de formato incorreto."], policy, ["INVALID_CONTEXT_BLOCK"], appliedParameters));
  }

  const patient = context.patient || {};
  const objective = context.objective || {};
  const anthro = context.anthropometry || {};
  const energy = context.energy || {};
  const training = context.training || {};
  const cardio = context.cardio || {};
  const weeklySchedule = Array.isArray(context.weeklySchedule) ? context.weeklySchedule : [];
  const constraints = context.constraints || {};
  const fasting = context.fasting || {};
  const dietaryRecall = context.dietaryRecall || {};

  // Validação de identificação do paciente
  if (!patient.patientId || typeof patient.patientId !== 'string' || patient.patientId.trim() === '') {
    blockingReasons.push("Identificador do paciente (patientId) ausente ou inválido.");
  }

  // Validação biométrica de idade
  const age = patient.age;
  if (age == null || typeof age !== 'number' || isNaN(age) || !isFinite(age) || age < 0 || age > 130) {
    blockingReasons.push("Idade do paciente ausente ou inválida (deve ser um número finito entre 0 e 130).");
  }

  // Validação biométrica de peso
  const weightKg = anthro.weightKg;
  if (weightKg == null || typeof weightKg !== 'number' || isNaN(weightKg) || !isFinite(weightKg) || weightKg <= 0 || weightKg > 500) {
    blockingReasons.push("Peso corporal ausente ou inválido (deve ser um número finito > 0 e <= 500 kg).");
  }

  // Validação estrita do objetivo clínico (ETAPA 12)
  const rawObjective = objective.clinicalObjective;
  const objectiveKey = normalizeObjectiveCategory(rawObjective);
  if (!rawObjective || typeof rawObjective !== 'string' || rawObjective.trim() === '' || rawObjective === 'MISSING') {
    blockingReasons.push("Objetivo clínico ausente ou não informado no contexto.");
  } else if (!objectiveKey) {
    blockingReasons.push(`Objetivo clínico "${rawObjective}" não reconhecido pela política de macronutrientes.`);
  }

  if (blockingReasons.length > 0) {
    return deepFreeze(buildBlockedOutput(null, rawObjective || null, factorsConsidered, warnings, blockingReasons, ["Dados estruturais obrigatórios ausentes ou inconsistentes."], policy, ["STRUCTURAL_DATA_BLOCK"], appliedParameters));
  }

  factorsConsidered.push(`Dados Biométricos (Peso: ${weightKg} kg, Idade: ${age} anos)`);
  factorsConsidered.push(`Objetivo Clínico: "${rawObjective}" (Mapeado: ${objectiveKey})`);

  // ── 3. SEGURANÇA PEDIÁTRICA (ETAPA 13) ──────────────────────────────────────
  const pediatricThreshold = p.safety.pediatricBlockingAge.value;
  if (age < pediatricThreshold) {
    appliedParameters.push({
      key: "safety.pediatricBlockingAge",
      value: pediatricThreshold,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.safety.pediatricBlockingAge.rationale
    });
    appliedRules.push("PEDIATRIC_SAFETY_BLOCK");
    blockingReasons.push(`Paciente menor de 18 anos (${age} anos): Aplicação de distribuição de macronutrientes adulta é estritamente bloqueada por protocolo de segurança clínica.`);
    rationale.push(`Paciente pediátrico (${age} anos < limiar ${pediatricThreshold} anos). Prescrição automatizada bloqueada.`);

    return deepFreeze(buildBlockedOutput(null, rawObjective, factorsConsidered, warnings, blockingReasons, rationale, policy, appliedRules, appliedParameters));
  }

  // ── 4. RESOLUÇÃO E VALIDAÇÃO DA META ENERGÉTICA N2.1 (ETAPA 11) ───────────
  let caloricTargetKcal = null;
  let energySource = "UNKNOWN";
  let energyPolicyVersion = "UNKNOWN";

  if (energyTargetResult && typeof energyTargetResult === 'object') {
    if (energyTargetResult.status === 'BLOCKED') {
      appliedRules.push("N21_BLOCKED_PROPAGATION");
      blockingReasons.push(`Motor N2.1 bloqueado: ${Array.isArray(energyTargetResult.blockingReasons) ? energyTargetResult.blockingReasons.join('; ') : 'Bloqueio de meta energética.'}`);
      rationale.push("Execução N2.2 bloqueada devido ao bloqueio prévio do motor energético N2.1.");
      return deepFreeze(buildBlockedOutput(null, rawObjective, factorsConsidered, warnings, blockingReasons, rationale, policy, appliedRules, appliedParameters));
    }
    caloricTargetKcal = energyTargetResult.caloricTargetKcal;
    energySource = energyTargetResult.calculationMethod || "N2.1_DIRECT_RESULT";
    energyPolicyVersion = energyTargetResult.policy?.version || "N2.1.0";
  } else if (context.energy && context.energy.caloricTargetKcal != null) {
    caloricTargetKcal = context.energy.caloricTargetKcal;
    energySource = context.energy.source || "CONTEXT_ENERGY_CALORIC_TARGET";
    energyPolicyVersion = "CONTEXT_INHERITED";
  } else if (options.approvedCaloricTarget != null) {
    caloricTargetKcal = options.approvedCaloricTarget;
    energySource = "APPROVED_OVERRIDE";
    energyPolicyVersion = "MANUAL_OVERRIDE";
  }

  if (caloricTargetKcal == null || typeof caloricTargetKcal !== 'number' || isNaN(caloricTargetKcal) || !isFinite(caloricTargetKcal) || caloricTargetKcal <= 0) {
    appliedRules.push("MISSING_ENERGY_TARGET_BLOCK");
    blockingReasons.push("Meta energética (caloricTargetKcal) ausente, não-positiva ou inválida. N2.2 requer resultado energético válido de N2.1.");
    rationale.push("Sem meta energética válida definida, a distribuição determinística de macronutrientes não pode ser calculada.");
    return deepFreeze(buildBlockedOutput(null, rawObjective, factorsConsidered, warnings, blockingReasons, rationale, policy, appliedRules, appliedParameters));
  }

  factorsConsidered.push(`Meta Energética de Ingestão: ${caloricTargetKcal} kcal/dia (Origem: ${energySource})`);
  rationale.push(`1. Meta energética consumida de N2.1: ${caloricTargetKcal} kcal/dia.`);

  // ── 5. ANÁLISE DE CONTEXTO SEM RECALCULAR CALORIAS (ETAPAS 16, 17, 18, 19) ─
  const isAthlete = isAthleteOrHighDemand(context);
  if (isAthlete) {
    factorsConsidered.push(`Condição de Atleta / Alta Demanda Formalmente Reconhecida (${patient.patientType || patient.trainingLevel})`);
  }

  if (training.hasActiveTraining || (training.routines && training.routines.length > 0)) {
    factorsConsidered.push(`Treino Musculação (${training.routines?.length || 0} rotinas, split: ${training.activeSplit || 'Geral'})`);
  }
  if (cardio.hasActiveCardio || (cardio.sessions && cardio.sessions.length > 0)) {
    factorsConsidered.push(`Cardio (${cardio.sessions?.length || 0} sessões cadastradas)`);
  }
  if (weeklySchedule.length > 0) {
    factorsConsidered.push(`Microciclo Semanal (${weeklySchedule.length} dias mapeados — sem carb cycling)`);
  }
  if (constraints.dietaryRestrictions?.length > 0 || constraints.allergies?.length > 0 || constraints.intolerances?.length > 0 || constraints.aversions?.length > 0) {
    factorsConsidered.push("Restrições e Alergias mapeadas (preservadas para o Solver N3)");
  }
  if (fasting.hasActiveProtocol) {
    factorsConsidered.push(`Jejum Intermitente (${fasting.protocolType || 'Ativo'} — preservado para o Solver N3)`);
  }
  if (dietaryRecall.hasRecall && Array.isArray(dietaryRecall.items) && dietaryRecall.items.length > 0) {
    factorsConsidered.push(`Recordatório Alimentar (${dietaryRecall.items.length} itens — referência contextual não sobrescreve metas)`);
  }

  // ── 5.5 PROTOCOLOS CLÍNICOS ESPECIAIS & CICLOS (Low Carb, Cetogênica, Dukan, Whole30) ──
  let activeStyle = String(options.dietaryStyle || (context.options && context.options.dietaryStyle) || (context.patient && context.patient.dietaryStyle) || '').trim().toLowerCase().replace(/[\s_-]/g, '');
  if (activeStyle === 'lowvab' || activeStyle === 'lowcarb') activeStyle = 'lowcarb';
  if (activeStyle === 'keto') activeStyle = 'cetogenica';
  if (activeStyle === 'while30') activeStyle = 'whole30';
  const activeCycle = String(options.dietaryCycle || (context.options && context.options.dietaryCycle) || (context.patient && context.patient.dietaryCycle) || '').trim().toLowerCase();

  const isProtocolStyle = ['cetogenica', 'lowcarb', 'dukan', 'whole30'].includes(activeStyle);

  if (isProtocolStyle) {
    factorsConsidered.push(`Protocolo Dietético Clínico: ${activeStyle.toUpperCase()} (Ciclo/Fase: ${activeCycle || 'Padrão'})`);

    let pTarget = 0;
    let cTarget = 0;
    let fTarget = 0;
    let fibTarget = 25;
    let effectiveCalTarget = caloricTargetKcal;

    if (activeStyle === 'cetogenica') {
      if (activeCycle === 'keto_ciclica_refeed') {
        pTarget = Math.round(weightKg * 1.8);
        fTarget = Math.max(25, Math.round((caloricTargetKcal * 0.15) / 9));
        cTarget = Math.max(50, Math.round((caloricTargetKcal - (pTarget * 4) - (fTarget * 9)) / 4));
        fibTarget = 25;
      } else if (activeCycle === 'keto_direcionada') {
        pTarget = Math.round(weightKg * 1.8);
        cTarget = 45;
        fTarget = Math.max(30, Math.round((caloricTargetKcal - (pTarget * 4) - (cTarget * 4)) / 9));
        fibTarget = 15;
      } else {
        // keto_padrao (SKD) ou keto_ciclica_keto
        pTarget = Math.round(weightKg * 1.8);
        cTarget = 25;
        fTarget = Math.max(30, Math.round((caloricTargetKcal - (pTarget * 4) - (cTarget * 4)) / 9));
        fibTarget = 15;
      }
    } else if (activeStyle === 'lowcarb') {
      if (activeCycle === 'lowcarb_restrita' || activeCycle === 'lowcarb_inducao') {
        pTarget = Math.round(weightKg * 2.0);
        cTarget = 60;
        fTarget = Math.max(30, Math.round((caloricTargetKcal - (pTarget * 4) - (cTarget * 4)) / 9));
        fibTarget = 20;
      } else if (activeCycle === 'lowcarb_liberal') {
        pTarget = Math.round(weightKg * 1.8);
        cTarget = 130;
        fTarget = Math.max(30, Math.round((caloricTargetKcal - (pTarget * 4) - (cTarget * 4)) / 9));
        fibTarget = 25;
      } else {
        // lowcarb_moderada / padrão
        pTarget = Math.round(weightKg * 1.8);
        cTarget = 100;
        fTarget = Math.max(30, Math.round((caloricTargetKcal - (pTarget * 4) - (cTarget * 4)) / 9));
        fibTarget = 25;
      }
    } else if (activeStyle === 'dukan') {
      if (activeCycle === 'dukan_cruzeiro_pl') {
        pTarget = Math.round(weightKg * 2.1);
        cTarget = 40;
        // Cruzeiro PL: gordura principalmente de ovos e traços de proteínas magras + legumes.
        // Limitar para valor atingível com alimentos Dukan-elegíveis.
        fTarget = Math.max(15, Math.min(25, Math.round(weightKg * 0.20)));
        fibTarget = 15;
      } else if (activeCycle === 'dukan_consolidacao') {
        pTarget = Math.round(weightKg * 2.0);
        cTarget = 90;
        fTarget = Math.max(25, Math.round((caloricTargetKcal - (pTarget * 4) - (cTarget * 4)) / 9));
        fibTarget = 20;
      } else if (activeCycle === 'dukan_estabilizacao') {
        pTarget = Math.round(weightKg * 1.8);
        cTarget = 130;
        fTarget = Math.max(25, Math.round((caloricTargetKcal - (pTarget * 4) - (cTarget * 4)) / 9));
        fibTarget = 25;
      } else {
        // Ataque PP (Proteína Pura) ou Cruzeiro PP — ciclo padrão Dukan
        // O protocolo clínico Dukan original especifica 2.3 g/kg para a fase de Ataque
        // (proteína pura maciça), garantindo preservação muscular máxima e cetose rápida.
        pTarget = Math.round(weightKg * 2.3);
        cTarget = 15;
        // Fase de Ataque: gordura provém exclusivamente de ovos e traços de proteínas magras.
        // Limite superior de 30g para manter o perfil de gordura muito baixo conforme protocolo.
        fTarget = Math.max(10, Math.min(30, Math.round(weightKg * 0.20)));
        fibTarget = 10;
      }
      effectiveCalTarget = (pTarget * 4) + (cTarget * 4) + (fTarget * 9);
    } else if (activeStyle === 'whole30') {
      if (activeCycle === 'whole30_reintroducao') {
        pTarget = Math.round(weightKg * 1.9);
        fTarget = Math.max(30, Math.round((caloricTargetKcal * 0.30) / 9));
        cTarget = Math.max(30, Math.round((caloricTargetKcal - (pTarget * 4) - (fTarget * 9)) / 4));
        fibTarget = 28;
      } else {
        // whole30_eliminacao / padrão
        pTarget = Math.round(weightKg * 2.0);
        fTarget = Math.max(30, Math.round((caloricTargetKcal * 0.35) / 9));
        cTarget = Math.max(30, Math.round((caloricTargetKcal - (pTarget * 4) - (fTarget * 9)) / 4));
        fibTarget = 28;
      }
    }

    const pKcal = pTarget * 4;
    const cKcal = cTarget * 4;
    const fKcal = fTarget * 9;
    const macroKcal = pKcal + cKcal + fKcal;

    // Sincronização termodinâmica perfeita
    effectiveCalTarget = macroKcal;

    appliedRules.push(`PROTOCOL_${activeStyle.toUpperCase()}_RULES_APPLIED`);
    rationale.push(`Metas calculadas segundo o protocolo clínico ${activeStyle.toUpperCase()} (${activeCycle || 'padrão'}): P=${pTarget}g, C=${cTarget}g, G=${fTarget}g.`);

    const protoResult = {
      status: "PASS",
      caloricTargetKcal: effectiveCalTarget,
      proteinTargetG: pTarget,
      carbohydrateTargetG: cTarget,
      fatTargetG: fTarget,
      fiberTargetG: fibTarget,
      proteinKcal: pKcal,
      carbohydrateKcal: cKcal,
      fatKcal: fKcal,
      macroEnergyKcal: macroKcal,
      energyDifferenceKcal: 0,
      objective: rawObjective,
      calculationMethod: `PROTOCOL_${activeStyle.toUpperCase()}_N22`,
      factorsConsidered,
      warnings,
      blockingReasons,
      rationale,
      policy: {
        version: policy.policyVersion,
        appliedRules,
        parameters: [{ key: `dietaryStyle.${activeStyle}`, value: activeCycle || 'standard', source: 'PROTOCOL_SPECIFICATION' }]
      },
      provenance: {
        energyTarget: { caloricTargetKcal: effectiveCalTarget, source: energySource, energyPolicyVersion },
        protein: { reference: 'PROTOCOL', referenceValue: weightKg, method: 'PROTOCOL_RATIO', gPerKg: Number((pTarget / weightKg).toFixed(2)) },
        carbohydrate: { method: 'PROTOCOL_CARB_TARGET', residualKcal: cKcal },
        fat: { method: 'PROTOCOL_FAT_TARGET', gPerKg: Number((fTarget / weightKg).toFixed(2)) },
        fiber: { method: 'PROTOCOL_FIBER_TARGET' },
        validation: { toleranceKcal: p.safety.energyToleranceKcal.value, differenceKcal: 0, isConsistent: true }
      }
    };

    return deepFreeze(protoResult);
  }

  // ── 6. DETERMINAÇÃO DA META DE PROTEÍNA (ETAPAS 4 & 5) ─────────────────────
  let proteinStrategy = options.proteinStrategy || p.protein.defaultStrategy || "TOTAL_BODY_WEIGHT";
  let proteinRef = "TOTAL_BODY_WEIGHT";
  let proteinRefValue = weightKg;
  let proteinGPerKg = 0;
  let proteinMethod = "TOTAL_BODY_WEIGHT_STANDARD";
  let proteinPolicyParam = null;

  const leanMass = anthro.leanMassKg;
  const isLeanMassValid = leanMass != null && typeof leanMass === 'number' && !isNaN(leanMass) && isFinite(leanMass) && leanMass > 0;

  if (proteinStrategy === "LEAN_MASS") {
    if (isLeanMassValid) {
      proteinRef = "LEAN_MASS";
      proteinRefValue = leanMass;
      proteinPolicyParam = p.protein.leanMassTargetGPerKg[objectiveKey];
      proteinGPerKg = proteinPolicyParam.value;
      proteinMethod = "LEAN_MASS_STRATEGY";
      appliedRules.push("PROTEIN_LEAN_MASS_STRATEGY");
      appliedParameters.push({
        key: `protein.leanMassTargetGPerKg.${objectiveKey}`,
        value: proteinGPerKg,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: proteinPolicyParam.rationale
      });
      rationale.push(`2. Proteína calculada por Massa Magra (${leanMass} kg LBM × ${proteinGPerKg} g/kg LBM).`);
    } else {
      proteinRef = "TOTAL_BODY_WEIGHT";
      proteinRefValue = weightKg;
      proteinMethod = "LEAN_MASS_UNAVAILABLE_FALLBACK_TO_BODY_WEIGHT";
      warnings.push("Estratégia LEAN_MASS solicitada, mas massa magra ausente ou inválida no contexto. Fallback aplicado para TOTAL_BODY_WEIGHT.");
      appliedRules.push("PROTEIN_LEAN_MASS_FALLBACK_TOTAL_BODY_WEIGHT");
      
      const baseParam = p.protein.byObjective[objectiveKey].baseGPerKg;
      proteinGPerKg = baseParam.value;
      proteinPolicyParam = baseParam;
      appliedParameters.push({
        key: `protein.byObjective.${objectiveKey}.baseGPerKg`,
        value: proteinGPerKg,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: baseParam.rationale
      });
      rationale.push(`2. Estratégia LEAN_MASS sem dados válidos; fallback executado para Peso Corporal (${weightKg} kg × ${proteinGPerKg} g/kg).`);
    }
  } else {
    // Padrão canônico: TOTAL_BODY_WEIGHT
    const baseParam = p.protein.byObjective[objectiveKey].baseGPerKg;
    proteinGPerKg = baseParam.value;
    proteinPolicyParam = baseParam;

    appliedParameters.push({
      key: `protein.byObjective.${objectiveKey}.baseGPerKg`,
      value: baseParam.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: baseParam.rationale
    });

    let modApplied = 0;
    if (isAthlete && p.protein.byObjective[objectiveKey].athleteOrHighDemandModulation) {
      const athleteParam = p.protein.byObjective[objectiveKey].athleteOrHighDemandModulation;
      modApplied = athleteParam.value;
      proteinGPerKg = Number((proteinGPerKg + modApplied).toFixed(2));
      proteinMethod = "TOTAL_BODY_WEIGHT_ATHLETE_MODULATED";
      appliedRules.push("PROTEIN_ATHLETE_HIGH_DEMAND_MODULATION");
      appliedParameters.push({
        key: `protein.byObjective.${objectiveKey}.athleteOrHighDemandModulation`,
        value: athleteParam.value,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: athleteParam.rationale
      });
      rationale.push(`2. Proteína base (${baseParam.value} g/kg) com modulação de alta demanda esportiva (+${modApplied} g/kg), totalizando ${proteinGPerKg} g/kg sobre ${weightKg} kg.`);
    } else {
      proteinMethod = "TOTAL_BODY_WEIGHT_STANDARD";
      appliedRules.push("PROTEIN_STANDARD_BY_OBJECTIVE");
      rationale.push(`2. Proteína estabelecida pela política: ${proteinGPerKg} g/kg sobre peso total (${weightKg} kg).`);
    }
  }

  const proteinTargetG = Math.round(proteinRefValue * proteinGPerKg);
  const proteinKcal = proteinTargetG * p.energyCoefficients.proteinKcalPerG.value;

  // Verificação de segurança de limite proteico
  const relativeProt = Number((proteinTargetG / weightKg).toFixed(2));
  if (p.protein.safety?.maxProteinGPerKg && relativeProt > p.protein.safety.maxProteinGPerKg.value) {
    warnings.push(`Aporte proteico (${relativeProt} g/kg) ultrapassa o limiar de alerta da política (${p.protein.safety.maxProteinGPerKg.value} g/kg).`);
    appliedParameters.push({
      key: "protein.safety.maxProteinGPerKg",
      value: p.protein.safety.maxProteinGPerKg.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.protein.safety.maxProteinGPerKg.rationale
    });
  }

  // ── 7. DETERMINAÇÃO DA META DE GORDURA E PISOS (ETAPA 6) ───────────────────
  const fatParam = p.fat.byObjective[objectiveKey];
  const baseFatPerKg = fatParam.value;
  appliedParameters.push({
    key: `fat.byObjective.${objectiveKey}`,
    value: fatParam.value,
    source: "POLICY_PARAMETER",
    version: policy.policyVersion,
    rationale: fatParam.rationale
  });

  const calculatedFatG = Math.round(weightKg * baseFatPerKg);
  const minFatGPerKg = p.fat.guards.minFatGPerKg.value;
  const minFatPercent = p.fat.guards.minFatPercent.value;

  const fatFloorByWeight = Math.round(weightKg * minFatGPerKg);
  const fatFloorByEnergy = Math.round((caloricTargetKcal * minFatPercent) / p.energyCoefficients.fatKcalPerG.value);

  let fatTargetG = calculatedFatG;
  let floorApplied = "NONE";

  if (fatFloorByWeight > fatTargetG || fatFloorByEnergy > fatTargetG) {
    if (fatFloorByWeight >= fatFloorByEnergy) {
      fatTargetG = fatFloorByWeight;
      floorApplied = "WEIGHT_FLOOR";
      appliedRules.push("FAT_FLOOR_BY_WEIGHT_APPLIED");
      appliedParameters.push({
        key: "fat.guards.minFatGPerKg",
        value: minFatGPerKg,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: p.fat.guards.minFatGPerKg.rationale
      });
      rationale.push(`3. Piso de gordura por peso corporal (${minFatGPerKg} g/kg = ${fatFloorByWeight}g) aplicado como guardrail de segurança.`);
    } else {
      fatTargetG = fatFloorByEnergy;
      floorApplied = "ENERGY_FLOOR";
      appliedRules.push("FAT_FLOOR_BY_ENERGY_APPLIED");
      appliedParameters.push({
        key: "fat.guards.minFatPercent",
        value: minFatPercent,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: p.fat.guards.minFatPercent.rationale
      });
      rationale.push(`3. Piso de gordura percentual (${(minFatPercent * 100).toFixed(0)}% das calorias = ${fatFloorByEnergy}g) aplicado como guardrail de segurança.`);
    }
  } else {
    appliedRules.push("FAT_STANDARD_BY_OBJECTIVE");
    rationale.push(`3. Gordura calculada pela política do objetivo: ${baseFatPerKg} g/kg (${fatTargetG}g).`);
  }

  const fatKcal = fatTargetG * p.energyCoefficients.fatKcalPerG.value;

  // ── 8. DETERMINAÇÃO DO CARBOIDRATO RESIDUAL E PISO (ETAPAS 7 & 8) ──────────
  const residualKcal = caloricTargetKcal - (proteinKcal + fatKcal);
  const minCarbG = p.carbohydrate.guards.minimumCarbG.value;

  if (residualKcal < 0) {
    appliedRules.push("NEGATIVE_RESIDUAL_CALORIC_BLOCK");
    blockingReasons.push(`Meta energética (${caloricTargetKcal} kcal) insuficiente para suprir o aporte estipulado de proteína (${proteinKcal} kcal) e gordura (${fatKcal} kcal). O carboidrato residual resultaria negativo (${residualKcal} kcal).`);
    rationale.push("Falha de fechamento energético: proteína e gordura somadas excedem a meta calórica total.");
    return deepFreeze(buildBlockedOutput(caloricTargetKcal, rawObjective, factorsConsidered, warnings, blockingReasons, rationale, policy, appliedRules, appliedParameters));
  }

  if (proteinKcal + fatKcal + (minCarbG * p.energyCoefficients.carbohydrateKcalPerG.value) > caloricTargetKcal) {
    appliedRules.push("MINIMUM_CARB_FLOOR_EXCEEDED_ENERGY_BLOCK");
    blockingReasons.push(`Meta energética (${caloricTargetKcal} kcal) não comporta o piso mínimo de segurança de carboidrato da política (${minCarbG}g = ${minCarbG * 4} kcal) somado à proteína e gordura (${proteinKcal + fatKcal} kcal). Prescrição bloqueada para não elevar artificialmente a meta.`);
    rationale.push(`Carboidrato residual (${Math.round(residualKcal / 4)}g) resultaria abaixo do piso de segurança (${minCarbG}g) sem margem energética disponível.`);
    return deepFreeze(buildBlockedOutput(caloricTargetKcal, rawObjective, factorsConsidered, warnings, blockingReasons, rationale, policy, appliedRules, appliedParameters));
  }

  const carbohydrateTargetG = Math.round(residualKcal / p.energyCoefficients.carbohydrateKcalPerG.value);
  const carbohydrateKcal = carbohydrateTargetG * p.energyCoefficients.carbohydrateKcalPerG.value;

  appliedRules.push("CARBOHYDRATE_RESIDUAL_ENERGY_ATWATER");
  appliedParameters.push({
    key: "carbohydrate.guards.minimumCarbG",
    value: minCarbG,
    source: "POLICY_PARAMETER",
    version: policy.policyVersion,
    rationale: p.carbohydrate.guards.minimumCarbG.rationale
  });
  rationale.push(`4. Carboidrato derivado deterministicamente pela energia residual Atwater: (${caloricTargetKcal} - ${proteinKcal}P - ${fatKcal}G) = ${residualKcal} kcal ÷ 4 = ${carbohydrateTargetG}g.`);

  // ── 9. DETERMINAÇÃO DA META DE FIBRAS (ETAPA 9) ────────────────────────────
  let fiberTargetG = null;
  let fiberMethod = "DRI_ENERGY_PROPORTIONAL";

  if (p.fiber && p.fiber.enabled !== false && p.fiber.fiberPer1000Kcal) {
    const fiberPer1000 = p.fiber.fiberPer1000Kcal.value;
    const minFiber = p.fiber.minimumFiberG?.value || 0;
    fiberTargetG = Math.max(minFiber, Math.round((caloricTargetKcal / 1000) * fiberPer1000));
    appliedRules.push("FIBER_DRI_POLICY_APPLIED");
    appliedParameters.push({
      key: "fiber.fiberPer1000Kcal",
      value: fiberPer1000,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.fiber.fiberPer1000Kcal.rationale
    });
    if (p.fiber.minimumFiberG) {
      appliedParameters.push({
        key: "fiber.minimumFiberG",
        value: minFiber,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: p.fiber.minimumFiberG.rationale
      });
    }
    rationale.push(`5. Fibras calculadas de forma isolada (${fiberPer1000}g / 1000 kcal, piso mínimo ${minFiber}g): meta de ${fiberTargetG}g/dia. Fibras não integram a soma energética 4P+4C+9G.`);
  } else {
    fiberMethod = "FIBER_POLICY_DISABLED_OR_MISSING";
    warnings.push("Política de fibras ausente ou desativada; fiberTargetG definido como null.");
    rationale.push("5. Política de fibras ausente ou desativada. Nenhuma fibra foi prescrita automaticamente.");
  }

  // ── 10. FECHAMENTO ENERGÉTICO E INVARIANTE FUNDAMENTAL (ETAPA 10) ──────────
  const macroEnergyKcal = proteinKcal + carbohydrateKcal + fatKcal;
  const energyDifferenceKcal = macroEnergyKcal - caloricTargetKcal;
  const toleranceKcal = p.safety.energyToleranceKcal.value;

  appliedParameters.push({
    key: "safety.energyToleranceKcal",
    value: toleranceKcal,
    source: "POLICY_PARAMETER",
    version: policy.policyVersion,
    rationale: p.safety.energyToleranceKcal.rationale
  });

  if (Math.abs(energyDifferenceKcal) > toleranceKcal) {
    appliedRules.push("ENERGY_TOLERANCE_EXCEEDED_BLOCK");
    blockingReasons.push(`Diferença no fechamento calórico dos macros (${energyDifferenceKcal} kcal) excede a tolerância estrita da política (±${toleranceKcal} kcal).`);
    rationale.push("Falha de invariante termodinâmica fundamental: a soma 4P + 4C + 9G não converge com a meta calórica estipulada.");
    return deepFreeze(buildBlockedOutput(caloricTargetKcal, rawObjective, factorsConsidered, warnings, blockingReasons, rationale, policy, appliedRules, appliedParameters));
  }

  rationale.push(`6. Fechamento energético validado: ${proteinKcal}P + ${carbohydrateKcal}C + ${fatKcal}G = ${macroEnergyKcal} kcal. Diferença técnica de arredondamento: ${energyDifferenceKcal >= 0 ? '+' : ''}${energyDifferenceKcal} kcal (dentro da tolerância de ±${toleranceKcal} kcal).`);

  // ── 11. STATUS E CONTRATO FINAL (ETAPAS 21, 22, 23) ────────────────────────
  const finalStatus = warnings.length > 0 ? "WARNING" : "PASS";

  const result = {
    status: finalStatus,

    caloricTargetKcal,

    proteinTargetG,
    carbohydrateTargetG,
    fatTargetG,
    fiberTargetG,

    proteinKcal,
    carbohydrateKcal,
    fatKcal,

    macroEnergyKcal,
    energyDifferenceKcal,

    objective: rawObjective,

    calculationMethod: "DETERMINISTIC_MACRO_TARGET_N22",

    factorsConsidered,
    warnings,
    blockingReasons,
    rationale,

    policy: {
      version: policy.policyVersion,
      appliedRules,
      parameters: appliedParameters
    },

    provenance: {
      energyTarget: {
        caloricTargetKcal,
        source: energySource,
        energyPolicyVersion
      },
      protein: {
        reference: proteinRef,
        referenceValue: proteinRefValue,
        method: proteinMethod,
        gPerKg: proteinGPerKg,
        policyParameter: proteinPolicyParam
      },
      carbohydrate: {
        method: "RESIDUAL_ENERGY_ATWATER",
        residualKcal,
        policyParameter: p.carbohydrate.guards.minimumCarbG
      },
      fat: {
        method: floorApplied === "NONE" ? "OBJECTIVE_BASE_G_PER_KG" : `GUARD_FLOOR_${floorApplied}`,
        gPerKg: baseFatPerKg,
        policyParameter: fatParam,
        floorApplied
      },
      fiber: {
        method: fiberMethod,
        policyParameter: p.fiber?.fiberPer1000Kcal || null
      },
      validation: {
        toleranceKcal,
        differenceKcal: energyDifferenceKcal,
        isConsistent: true
      }
    }
  };

  return deepFreeze(result);
}

/**
 * Constrói de forma padronizada a estrutura imutável no estado BLOCKED
 */
function buildBlockedOutput(caloricTargetKcal, objective, factorsConsidered, warnings, blockingReasons, rationale, policy, appliedRules = [], appliedParameters = []) {
  return {
    status: "BLOCKED",

    caloricTargetKcal: caloricTargetKcal || null,

    proteinTargetG: null,
    carbohydrateTargetG: null,
    fatTargetG: null,
    fiberTargetG: null,

    proteinKcal: null,
    carbohydrateKcal: null,
    fatKcal: null,

    macroEnergyKcal: null,
    energyDifferenceKcal: null,

    objective: objective || null,

    calculationMethod: "DETERMINISTIC_MACRO_TARGET_N22",

    factorsConsidered: factorsConsidered || [],
    warnings: warnings || [],
    blockingReasons: blockingReasons || [],
    rationale: rationale || [],

    policy: {
      version: policy?.policyVersion || "UNKNOWN",
      appliedRules: appliedRules || ["BLOCKED_EXECUTION"],
      parameters: appliedParameters || []
    },

    provenance: {
      energyTarget: {
        caloricTargetKcal: caloricTargetKcal || null,
        source: "BLOCKED",
        energyPolicyVersion: policy?.policyVersion || "UNKNOWN"
      },
      protein: {
        reference: null,
        referenceValue: null,
        method: null,
        gPerKg: null,
        policyParameter: null
      },
      carbohydrate: {
        method: null,
        residualKcal: null,
        policyParameter: null
      },
      fat: {
        method: null,
        gPerKg: null,
        policyParameter: null,
        floorApplied: "NONE"
      },
      fiber: {
        method: null,
        policyParameter: null
      },
      validation: {
        toleranceKcal: policy?.parameters?.safety?.energyToleranceKcal?.value || 5,
        differenceKcal: null,
        isConsistent: false
      }
    }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateDeterministicMacroTargets,
    isAthleteOrHighDemand,
    normalizeObjectiveCategory
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.macroTarget = {
    calculateDeterministicMacroTargets,
    isAthleteOrHighDemand,
    normalizeObjectiveCategory
  };
}

  });

  // ── MÓDULO: domain/math/nutritionTargetValidator.js ──
  defineModule("domain/math/nutritionTargetValidator.js", function(require, module, exports) {
/**
 * domain/math/nutritionTargetValidator.js
 * 
 * Validador Energético e Bromatológico de Metas Nutricionais — NutriAx Pro.
 * Fase N2.3: Validador puro, determinístico e auditável que atua como portão de qualidade
 * entre as metas calculadas (N2.1 + N2.2) e o futuro solver de cardápio (N3).
 * 
 * Princípios de Governança:
 * 1. PUREZA ABSOLUTA: Sem DOM, sem Dexie/Firebase, sem Gemini, sem Date, sem Math.random.
 * 2. GOVERNANÇA BROMATOLÓGICA: Valida a consistência matemática das metas pré-cardápio.
 *    Não afirma que "a dieta está bromatologicamente validada", pois ainda não há alimentos concretos.
 * 3. REUSO MATEMÁTICO: Consome os resultados de N2.1 e N2.2 sem recalcular políticas.
 * 4. IMUTABILIDADE: Resultado profundamente congelado (deepFreeze).
 */

/**
 * Utilitário de congelamento profundo recursivo
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
 * Normaliza e identifica a categoria canônica do objetivo clínico
 * @param {string} objectiveStr 
 * @returns {string|null}
 */
function normalizeObjective(objectiveStr) {
  if (!objectiveStr || typeof objectiveStr !== 'string') return null;
  const obj = objectiveStr.trim().toLowerCase();
  if (obj === '' || obj === 'missing') return null;

  if (obj.includes('perda') || obj.includes('emagrecimento') || obj.includes('déficit') || obj.includes('deficit') || obj.includes('cutting') || obj.includes('definir')) {
    return 'Perda de peso';
  }
  if (obj.includes('hipertrofia') || obj.includes('ganho') || obj.includes('bulking') || obj.includes('superávit') || obj.includes('superavit') || obj.includes('massa')) {
    return 'Hipertrofia';
  }
  if (obj.includes('recomposição') || obj.includes('recomposicao')) {
    return 'Recomposição Corporal';
  }
  if (obj.includes('performance') || obj.includes('esportiva') || obj.includes('rendimento') || obj.includes('atleta')) {
    return 'Performance Esportiva';
  }
  if (obj.includes('manutenção') || obj.includes('manutencao') || obj.includes('saúde') || obj.includes('saude') || obj.includes('geral') || obj.includes('equilíbrio') || obj.includes('equilibrio')) {
    return 'Manutenção e Saúde';
  }
  return null;
}

/**
 * Executa a validação formal, matemática e bromatológica das metas nutricionais.
 * 
 * @param {Object} context - NutritionPrescriptionContextDTO validado da Fase N1.1
 * @param {Object} energyTargetResult - Resultado do motor energético da Fase N2.1
 * @param {Object} macroTargetResult - Resultado do motor de macronutrientes da Fase N2.2
 * @param {Object} [options={}] - Opções opcionais (ex: tolerância customizada)
 * @returns {Readonly<Object>} Relatório imutável de validação de metas nutricionais
 */
function validateNutritionPrescriptionTargets(context, energyTargetResult, macroTargetResult, options = {}) {
  const checks = [];
  const warnings = [];
  const blockingReasons = [];

  function recordCheck(id, status, message, details = {}) {
    const check = {
      id,
      status, // "PASS" | "WARNING" | "FAIL"
      message,
      ...details
    };
    checks.push(check);
    if (status === 'FAIL') {
      blockingReasons.push(`[${id}] ${message}`);
    } else if (status === 'WARNING') {
      warnings.push(`[${id}] ${message}`);
    }
    return check;
  }

  // ── 1. VALIDAÇÃO DO CONTEXTO DE ENTRADA (N1.1) ────────────────────────────
  const isContextObject = context != null && typeof context === 'object' && !Array.isArray(context);
  if (!isContextObject) {
    recordCheck('CHECK_CONTEXT_VALIDITY', 'FAIL', 'Contexto N1.1 ausente ou não é um objeto.', { expected: 'Object', actual: typeof context });
  }

  const patientAge = context?.patient?.age;
  const isPediatric = typeof patientAge === 'number' && patientAge < 18;
  if (isPediatric) {
    recordCheck('CHECK_PEDIATRIC_SAFETY', 'FAIL', `Paciente menor de 18 anos (${patientAge} anos): prescrição adulta bloqueada por segurança clínica.`);
  }

  // ── 2. VALIDAÇÃO DO RESULTADO ENERGÉTICO (N2.1) ───────────────────────────
  let caloricTargetKcal = null;
  const isEnergyObject = energyTargetResult != null && typeof energyTargetResult === 'object' && !Array.isArray(energyTargetResult);

  if (!isEnergyObject) {
    recordCheck('CHECK_N21_ENERGY_TARGET', 'FAIL', 'Resultado N2.1 ausente ou nulo.', { expected: 'Object', actual: typeof energyTargetResult });
  } else if (energyTargetResult.status === 'BLOCKED') {
    recordCheck('CHECK_N21_ENERGY_TARGET', 'FAIL', 'Resultado N2.1 encontra-se no estado BLOCKED.', { reasons: energyTargetResult.blockingReasons || [] });
  } else {
    caloricTargetKcal = energyTargetResult.caloricTargetKcal;
    const isValidKcal = typeof caloricTargetKcal === 'number' && !isNaN(caloricTargetKcal) && isFinite(caloricTargetKcal) && caloricTargetKcal > 0;
    if (!isValidKcal) {
      recordCheck('CHECK_N21_ENERGY_TARGET', 'FAIL', 'Meta energética (caloricTargetKcal) de N2.1 é inválida, nula, não-finita ou <= 0.', { caloricTargetKcal });
    } else {
      recordCheck('CHECK_N21_ENERGY_TARGET', 'PASS', 'Meta energética N2.1 válida.', { caloricTargetKcal });
    }
  }

  // ── 3. VALIDAÇÃO DO RESULTADO DE MACRONUTRIENTES (N2.2) ───────────────────
  let proteinTargetG = null;
  let carbohydrateTargetG = null;
  let fatTargetG = null;
  let fiberTargetG = null;
  let proteinKcal = null;
  let carbohydrateKcal = null;
  let fatKcal = null;
  let macroEnergyKcal = null;
  let energyDifferenceKcal = null;

  const isMacroObject = macroTargetResult != null && typeof macroTargetResult === 'object' && !Array.isArray(macroTargetResult);

  if (!isMacroObject) {
    recordCheck('CHECK_N22_MACRO_TARGET', 'FAIL', 'Resultado N2.2 ausente ou nulo.', { expected: 'Object', actual: typeof macroTargetResult });
  } else if (macroTargetResult.status === 'BLOCKED') {
    recordCheck('CHECK_N22_MACRO_TARGET', 'FAIL', 'Resultado N2.2 encontra-se no estado BLOCKED.', { reasons: macroTargetResult.blockingReasons || [] });
  } else {
    proteinTargetG = macroTargetResult.proteinTargetG;
    carbohydrateTargetG = macroTargetResult.carbohydrateTargetG;
    fatTargetG = macroTargetResult.fatTargetG;
    fiberTargetG = macroTargetResult.fiberTargetG;

    proteinKcal = macroTargetResult.proteinKcal;
    carbohydrateKcal = macroTargetResult.carbohydrateKcal;
    fatKcal = macroTargetResult.fatKcal;
    macroEnergyKcal = macroTargetResult.macroEnergyKcal;
    energyDifferenceKcal = macroTargetResult.energyDifferenceKcal;

    // Metas de proteína, carboidrato e gordura NÃO precisam ser inteiras. Devem ser number e finitas.
    const areMacrosNumbers = typeof proteinTargetG === 'number' && isFinite(proteinTargetG) &&
                             typeof carbohydrateTargetG === 'number' && isFinite(carbohydrateTargetG) &&
                             typeof fatTargetG === 'number' && isFinite(fatTargetG);

    if (!areMacrosNumbers) {
      recordCheck('CHECK_N22_MACRO_TARGET', 'FAIL', 'Metas de macronutrientes de N2.2 contêm campos não-numéricos ou não-finitos.', {
        proteinTargetG,
        carbohydrateTargetG,
        fatTargetG
      });
    } else {
      recordCheck('CHECK_N22_MACRO_TARGET', 'PASS', 'Metas de macronutrientes N2.2 presentes e com tipos numéricos válidos.');
    }
  }

  // Se já houver bloqueio estrutural essencial, encerra cedo os checks matemáticos dependentes
  const hasStructuralBlock = blockingReasons.length > 0;

  // ── 4. NÃO-NEGATIVIDADE DOS MACROS E ENERGIA ──────────────────────────────
  if (!hasStructuralBlock) {
    const isAnyMacroNegative = proteinTargetG < 0 || carbohydrateTargetG < 0 || fatTargetG < 0 ||
                               proteinKcal < 0 || carbohydrateKcal < 0 || fatKcal < 0 || macroEnergyKcal < 0;
    if (isAnyMacroNegative) {
      recordCheck('CHECK_NON_NEGATIVE_MACROS', 'FAIL', 'Um ou mais macronutrientes ou cotas energéticas resultaram em valores negativos.', {
        proteinTargetG,
        carbohydrateTargetG,
        fatTargetG,
        proteinKcal,
        carbohydrateKcal,
        fatKcal,
        macroEnergyKcal
      });
    } else {
      recordCheck('CHECK_NON_NEGATIVE_MACROS', 'PASS', 'Todos os macronutrientes e cotas energéticas são não-negativos.');
    }
  }

  // ── 5. INTEGRIDADE NUMÉRICA E REJEIÇÃO DE NAN/INFINITY ─────────────────────
  if (!hasStructuralBlock) {
    const numericFields = [
      { name: 'caloricTargetKcal', val: caloricTargetKcal },
      { name: 'proteinTargetG', val: proteinTargetG },
      { name: 'carbohydrateTargetG', val: carbohydrateTargetG },
      { name: 'fatTargetG', val: fatTargetG },
      { name: 'proteinKcal', val: proteinKcal },
      { name: 'carbohydrateKcal', val: carbohydrateKcal },
      { name: 'fatKcal', val: fatKcal },
      { name: 'macroEnergyKcal', val: macroEnergyKcal },
      { name: 'energyDifferenceKcal', val: energyDifferenceKcal }
    ];

    const invalidField = numericFields.find(f => typeof f.val !== 'number' || isNaN(f.val) || !isFinite(f.val));
    if (invalidField) {
      recordCheck('CHECK_NUMERIC_INTEGRITY', 'FAIL', `Inconsistência de tipo numérico no campo "${invalidField.name}" (NaN, Infinity ou não-numérico).`, { field: invalidField.name, value: invalidField.val });
    } else {
      recordCheck('CHECK_NUMERIC_INTEGRITY', 'PASS', 'Integridade numérica estrita validada (sem NaN ou Infinity).');
    }
  }

  // ── 6. COERÊNCIA DA PROTEÍNA COM ATWATER (P × 4) E PROCEDÊNCIA ─────────────
  if (!hasStructuralBlock && proteinTargetG != null && proteinKcal != null) {
    const expectedProtKcal = proteinTargetG * 4;
    const diffProt = Math.abs(proteinKcal - expectedProtKcal);

    if (diffProt > 0.01) {
      recordCheck('CHECK_PROTEIN_ENERGY_CONSISTENCY', 'FAIL', 'Calorias de proteína divergem da multiplicação Atwater (proteinTargetG * 4).', {
        expected: expectedProtKcal,
        actual: proteinKcal,
        diff: diffProt
      });
    } else {
      const provProt = macroTargetResult?.provenance?.protein;
      if (!provProt || !provProt.reference || !provProt.method || provProt.gPerKg == null) {
        recordCheck('CHECK_PROTEIN_ENERGY_CONSISTENCY', 'WARNING', 'Proteína consistente com Atwater 4P, porém procedência mínima incompleta.', { provenance: provProt });
      } else {
        recordCheck('CHECK_PROTEIN_ENERGY_CONSISTENCY', 'PASS', 'Proteína consistente com Atwater (P * 4) e com procedência válida.', {
          proteinTargetG,
          proteinKcal,
          reference: provProt.reference,
          method: provProt.method
        });
      }
    }
  }

  // ── 7. COERÊNCIA DA GORDURA COM ATWATER (G × 9) E PROCEDÊNCIA ──────────────
  if (!hasStructuralBlock && fatTargetG != null && fatKcal != null) {
    const expectedFatKcal = fatTargetG * 9;
    const diffFat = Math.abs(fatKcal - expectedFatKcal);

    if (diffFat > 0.01) {
      recordCheck('CHECK_FAT_ENERGY_CONSISTENCY', 'FAIL', 'Calorias de gordura divergem da multiplicação Atwater (fatTargetG * 9).', {
        expected: expectedFatKcal,
        actual: fatKcal,
        diff: diffFat
      });
    } else {
      const provFat = macroTargetResult?.provenance?.fat;
      recordCheck('CHECK_FAT_ENERGY_CONSISTENCY', 'PASS', 'Gordura consistente com Atwater (G * 9) e com procedência válida.', {
        fatTargetG,
        fatKcal,
        floorApplied: provFat?.floorApplied || 'NONE'
      });
    }
  }

  // ── 8. COERÊNCIA DO CARBOIDRATO COM ATWATER (C × 4) E FECHAMENTO RESIDUAL ──
  const toleranceKcal = options.toleranceKcal != null && typeof options.toleranceKcal === 'number'
    ? options.toleranceKcal
    : (macroTargetResult?.provenance?.validation?.toleranceKcal || 5);

  if (!hasStructuralBlock && carbohydrateTargetG != null && carbohydrateKcal != null && caloricTargetKcal != null) {
    const expectedCarbKcal = carbohydrateTargetG * 4;
    const diffCarb = Math.abs(carbohydrateKcal - expectedCarbKcal);

    if (diffCarb > 0.01) {
      recordCheck('CHECK_CARBOHYDRATE_ENERGY_CONSISTENCY', 'FAIL', 'Calorias de carboidrato divergem da multiplicação Atwater (carbohydrateTargetG * 4).', {
        expected: expectedCarbKcal,
        actual: carbohydrateKcal,
        diff: diffCarb
      });
    } else {
      const expectedResidualKcal = caloricTargetKcal - (proteinKcal + fatKcal);
      const diffResidual = Math.abs(carbohydrateKcal - expectedResidualKcal);

      if (diffResidual > toleranceKcal) {
        recordCheck('CHECK_CARBOHYDRATE_ENERGY_CONSISTENCY', 'FAIL', 'Carboidrato diverge do fechamento residual Atwater acima da tolerância.', {
          expectedResidualKcal,
          actualCarbKcal: carbohydrateKcal,
          diffResidual,
          toleranceKcal
        });
      } else {
        recordCheck('CHECK_CARBOHYDRATE_ENERGY_CONSISTENCY', 'PASS', 'Carboidrato consistente com Atwater (C * 4) e fechamento residual válido.', {
          carbohydrateTargetG,
          carbohydrateKcal,
          residualKcal: expectedResidualKcal
        });
      }
    }
  }

  // ── 9. INVARIANTE FUNDAMENTAL DE FECHAMENTO ENERGÉTICO (4P + 4C + 9G) ──────
  let isClosed = false;
  if (!hasStructuralBlock && proteinKcal != null && carbohydrateKcal != null && fatKcal != null && caloricTargetKcal != null) {
    const calculatedSumKcal = proteinKcal + carbohydrateKcal + fatKcal;
    const diffEnergy = calculatedSumKcal - caloricTargetKcal;

    if (macroEnergyKcal != null && Math.abs(macroEnergyKcal - calculatedSumKcal) > 0.01) {
      recordCheck('CHECK_ENERGY_CLOSURE', 'FAIL', 'macroEnergyKcal diverge da soma direta das parcelas (4P + 4C + 9G).', {
        macroEnergyKcal,
        calculatedSumKcal
      });
    } else if (Math.abs(diffEnergy) > toleranceKcal) {
      recordCheck('CHECK_ENERGY_CLOSURE', 'FAIL', 'ENERGY_CLOSURE_FAILED: Diferença entre soma dos macros e meta calórica excede a tolerância da política.', {
        macroEnergyKcal: calculatedSumKcal,
        caloricTargetKcal,
        differenceKcal: diffEnergy,
        toleranceKcal
      });
    } else {
      isClosed = true;
      recordCheck('CHECK_ENERGY_CLOSURE', 'PASS', 'Fechamento energético validado dentro da tolerância técnica da política.', {
        macroEnergyKcal: calculatedSumKcal,
        caloricTargetKcal,
        differenceKcal: diffEnergy,
        toleranceKcal,
        closed: true
      });
    }
  }

  // ── 10. VALIDAÇÃO DE FIBRAS E ISOLAMENTO ENERGÉTICO ────────────────────────
  // A validação da fibra confirma que macroEnergyKcal utiliza exclusivamente 4P + 4C + 9G, sem incluir fiberTargetG.
  if (fiberTargetG !== null && fiberTargetG !== undefined) {
    if (typeof fiberTargetG !== 'number' || isNaN(fiberTargetG) || !isFinite(fiberTargetG) || fiberTargetG < 0) {
      recordCheck('CHECK_FIBER_ISOLATION_AND_VALIDITY', 'FAIL', 'Meta de fibras inválida ou negativa.', { fiberTargetG });
    } else {
      recordCheck('CHECK_FIBER_ISOLATION_AND_VALIDITY', 'PASS', 'Fibras isoladas da equação calórica 4P+4C+9G e meta diária não-negativa.', {
        fiberTargetG,
        includedInMacroEnergyKcal: false
      });
    }
  } else {
    recordCheck('CHECK_FIBER_ISOLATION_AND_VALIDITY', 'WARNING', 'Meta de fibras diárias não informada na prescrição (fiberTargetG === null).', {
      fiberTargetG: null,
      includedInMacroEnergyKcal: false
    });
  }

  // ── 11. PLAUSIBILIDADE DA DISTRIBUIÇÃO PERCENTUAL DE MACROS ───────────────
  let proteinPercent = null;
  let carbohydratePercent = null;
  let fatPercent = null;

  if (!hasStructuralBlock && caloricTargetKcal != null && caloricTargetKcal > 0 &&
      proteinKcal != null && carbohydrateKcal != null && fatKcal != null) {
    proteinPercent = Number(((proteinKcal / caloricTargetKcal) * 100).toFixed(2));
    carbohydratePercent = Number(((carbohydrateKcal / caloricTargetKcal) * 100).toFixed(2));
    fatPercent = Number(((fatKcal / caloricTargetKcal) * 100).toFixed(2));

    const sumPercent = Number((proteinPercent + carbohydratePercent + fatPercent).toFixed(2));
    const percentDiff = Math.abs(sumPercent - 100.0);

    if (percentDiff <= 0.6) {
      recordCheck('CHECK_MACRO_DISTRIBUTION_PLAUSIBILITY', 'PASS', 'Distribuição percentual dos macronutrientes convergente para 100%.', {
        proteinPercent,
        carbohydratePercent,
        fatPercent,
        sumPercent
      });
    } else {
      recordCheck('CHECK_MACRO_DISTRIBUTION_PLAUSIBILITY', 'FAIL', 'Soma percentual dos macronutrientes diverge significativamente de 100%.', {
        sumPercent,
        percentDiff
      });
    }
  }

  // ── 12. INTEGRIDADE, PRESENÇA E NÃO-SOBREESCRITA DO CONTEXTO ──────────────
  // CHECK_OBJECTIVE_AND_CONTEXT_COHERENCE verifica apenas integridade, presença e não-sobrescrita dos dados do contexto.
  // Não cria nova política clínica ou nutricional dentro da N2.3.
  const rawContextObj = context?.objective?.clinicalObjective;
  const normalizedObj = normalizeObjective(rawContextObj);

  if (!rawContextObj || !normalizedObj) {
    recordCheck('CHECK_OBJECTIVE_AND_CONTEXT_COHERENCE', 'FAIL', 'Objetivo clínico ausente, não informado ou não reconhecido no contexto N1.1.', {
      objective: rawContextObj || null
    });
  } else {
    // Validar coerência do objetivo com N2.1 e N2.2 se presentes
    const n21Obj = energyTargetResult?.objective;
    const n22Obj = macroTargetResult?.objective;
    const isCoherent = (!n21Obj || normalizeObjective(n21Obj) === normalizedObj) &&
                       (!n22Obj || normalizeObjective(n22Obj) === normalizedObj);

    if (!isCoherent) {
      recordCheck('CHECK_OBJECTIVE_AND_CONTEXT_COHERENCE', 'FAIL', 'Divergência entre o objetivo do contexto N1.1 e os resultados de N2.1/N2.2.', {
        contextObjective: rawContextObj,
        n21Objective: n21Obj,
        n22Objective: n22Obj
      });
    } else {
      // Verificar não-sobrescrita do recordatório
      const recallKcal = context?.dietaryRecall?.items?.reduce((acc, it) => acc + (it.macros?.calories || 0), 0) || 0;
      if (recallKcal > 0 && caloricTargetKcal != null && Math.abs(caloricTargetKcal - recallKcal) === 0 && energyTargetResult?.adjustmentKcal !== 0) {
        recordCheck('CHECK_OBJECTIVE_AND_CONTEXT_COHERENCE', 'WARNING', 'Meta energética coincide exatamente com o recordatório alimentar; assegurar que não houve sobreposição indevida.', { recallKcal, caloricTargetKcal });
      } else {
        recordCheck('CHECK_OBJECTIVE_AND_CONTEXT_COHERENCE', 'PASS', 'Integridade e coerência contextual validadas sem sobrescrita de dados.', {
          objective: rawContextObj,
          hasTrainingContext: !!(context?.training?.hasActiveTraining || context?.training?.routines?.length),
          hasCardioContext: !!(context?.cardio?.hasActiveCardio || context?.cardio?.sessions?.length),
          hasWeeklySchedule: Array.isArray(context?.weeklySchedule) && context.weeklySchedule.length > 0,
          hasConstraints: Array.isArray(context?.constraints?.dietaryRestrictions) && context.constraints.dietaryRestrictions.length > 0
        });
      }
    }
  }

  // ── 13. PRESERVAÇÃO DE ALERTAS PREEXISTENTES DE N2.1 E N2.2 ───────────────
  if (Array.isArray(macroTargetResult?.warnings)) {
    for (const w of macroTargetResult.warnings) {
      if (!warnings.includes(w)) {
        warnings.push(`[N2.2_WARNING] ${w}`);
      }
    }
  }
  if (Array.isArray(energyTargetResult?.warnings)) {
    for (const w of energyTargetResult.warnings) {
      if (!warnings.includes(w)) {
        warnings.push(`[N2.1_WARNING] ${w}`);
      }
    }
  }

  // ── 14. DETERMINAÇÃO DO STATUS GERAL E CONTRATO DE SAÍDA ──────────────────
  let overallStatus = "PASS";
  if (blockingReasons.length > 0) {
    overallStatus = "BLOCKED";
  } else if (warnings.length > 0) {
    overallStatus = "WARNING";
  }

  const isValid = overallStatus !== "BLOCKED";

  const result = {
    status: overallStatus,
    valid: isValid,

    caloricTargetKcal: caloricTargetKcal ?? null,

    macroTargets: {
      proteinTargetG: proteinTargetG ?? null,
      carbohydrateTargetG: carbohydrateTargetG ?? null,
      fatTargetG: fatTargetG ?? null,
      fiberTargetG: fiberTargetG ?? null
    },

    energyValidation: {
      proteinKcal: proteinKcal ?? null,
      carbohydrateKcal: carbohydrateKcal ?? null,
      fatKcal: fatKcal ?? null,
      macroEnergyKcal: macroEnergyKcal ?? null,
      energyDifferenceKcal: energyDifferenceKcal ?? null,
      toleranceKcal: toleranceKcal ?? null,
      closed: isClosed
    },

    macroDistribution: {
      proteinPercent: proteinPercent ?? null,
      carbohydratePercent: carbohydratePercent ?? null,
      fatPercent: fatPercent ?? null
    },

    warnings,
    blockingReasons,
    checks,

    provenance: {
      energyTarget: {
        source: energyTargetResult?.calculationMethod || energyTargetResult?.provenance?.energyTarget?.source || 'UNKNOWN',
        caloricTargetKcal: caloricTargetKcal ?? null,
        energyPolicyVersion: energyTargetResult?.policy?.version || 'UNKNOWN'
      },
      macroTarget: {
        method: macroTargetResult?.calculationMethod || 'UNKNOWN',
        macroEnergyKcal: macroEnergyKcal ?? null,
        macroPolicyVersion: macroTargetResult?.policy?.version || 'N2.2.0'
      },
      validation: {
        validationMethod: "DETERMINISTIC_NUTRITION_TARGET_VALIDATION_N23",
        toleranceKcal,
        differenceKcal: energyDifferenceKcal ?? null,
        isConsistent: isValid
      }
    },

    validationMethod: "DETERMINISTIC_NUTRITION_TARGET_VALIDATION_N23",

    policyVersions: {
      energy: energyTargetResult?.policy?.version || 'UNKNOWN',
      macro: macroTargetResult?.policy?.version || 'N2.2.0'
    }
  };

  return deepFreeze(result);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateNutritionPrescriptionTargets,
    normalizeObjective,
    deepFreeze
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.targetValidator = {
    validateNutritionPrescriptionTargets,
    normalizeObjective,
    deepFreeze
  };
}

  });

  // ── MÓDULO: domain/solver/foodEligibility.js ──
  defineModule("domain/solver/foodEligibility.js", function(require, module, exports) {
/**
 * domain/solver/foodEligibility.js
 * 
 * Política e Motor de Avaliação de Elegibilidade de Alimentos — NutriAx Pro.
 * Fase N3.2 — Food Solver Determinístico Canônico.
 * 
 * Camada Pura — Sem I/O de infraestrutura, sem persistência externa, sem dependências remotas.
 * 
 * Princípios de Elegibilidade:
 * 1. PUREZA ABSOLUTA: Funções puras e imutáveis.
 * 2. RIGOR DIMENSIONAL: g = massa direta; ml requer densidade formal (sem assumir 1ml=1g);
 *    medidas caseiras requerem gramPerUnit específico (sem fallback genérico).
 * 3. GOVERNANÇA BROMATOLÓGICA:
 *    - CONSISTENTE: ELIGIBLE (candidato padrão).
 *    - REVISAR: governado por allowReviewStatus (default true -> WARNING; false -> INELIGIBLE).
 *    - INCONSISTENTE: INELIGIBLE por padrão.
 * 4. ALIMENTOS CUSTOMIZADOS: cust_* elegíveis se cumprirem os mesmos requisitos canônicos.
 * 5. RESTRIÇÕES ESTRUTURADAS: Exclusão formal por categorias e metadados estruturados.
 *    Restrições sem metadados geram warning explícito de limitação de cobertura.
 */

'use strict';

const FoodSolverContract = require('../contracts/FoodSolverContract');
const {
  validateCanonicalFoodDTO,
  createCanonicalFoodDTO,
  deepFreeze
} = FoodSolverContract;

/**
 * Status de elegibilidade
 */
const ELIGIBILITY_STATUS = Object.freeze({
  ELIGIBLE: 'ELIGIBLE',
  WARNING: 'WARNING',
  INELIGIBLE: 'INELIGIBLE'
});

/**
 * Política padrão de elegibilidade
 */
const DEFAULT_ELIGIBILITY_POLICY = Object.freeze({
  allowReviewStatus: true,
  allowInconsistentStatus: false,
  requireSpecificConversion: true,
  allowGenericUnitFallback: false
});

/**
 * Adapta uma coleção de registros de alimentos para CanonicalFoodDTO[]
 * @param {Array<Object>} rawCatalog 
 * @returns {Array<Object>}
 */
function adaptCatalogToCanonical(rawCatalog) {
  if (!Array.isArray(rawCatalog)) {
    return [];
  }
  const adapted = [];
  for (let i = 0; i < rawCatalog.length; i++) {
    const raw = rawCatalog[i];
    try {
      const canonical = createCanonicalFoodDTO(raw);
      adapted.push(canonical);
    } catch {
      // Itens que falham na validação estrutural básica de DTO são descartados
    }
  }
  return deepFreeze(adapted);
}

/**
 * Avalia a elegibilidade de um único alimento para o Food Solver
 * @param {Object} food Alimento (CanonicalFoodDTO ou objeto equivalente)
 * @param {Object} [policy] Política de elegibilidade
 * @param {Object} [options] Opções contextuais
 * @returns {{ status: string, isEligible: boolean, reasons: string[], warnings: string[], food: Object|null }}
 */
function evaluateFoodEligibility(food, policy = DEFAULT_ELIGIBILITY_POLICY, options = {}) {
  const reasons = [];
  const warnings = [];

  if (!food || typeof food !== 'object') {
    return deepFreeze({
      status: ELIGIBILITY_STATUS.INELIGIBLE,
      isEligible: false,
      reasons: ['Registro de alimento nulo ou inválido.'],
      warnings: [],
      food: null
    });
  }

  // 1. Verificação Estrutural Canônica
  const val = validateCanonicalFoodDTO(food);
  if (!val.isValid) {
    return deepFreeze({
      status: ELIGIBILITY_STATUS.INELIGIBLE,
      isEligible: false,
      reasons: val.errors,
      warnings: [],
      food: null
    });
  }

  let canonicalFood = food;
  if (food.isCustom === undefined) {
    try {
      canonicalFood = createCanonicalFoodDTO(food);
    } catch {
      canonicalFood = food;
    }
  }

  const foodId = canonicalFood.id || canonicalFood.foodId;
  const foodName = canonicalFood.name || canonicalFood.foodName;
  const unit = (canonicalFood.unit || canonicalFood.baseUnit || '').trim().toLowerCase();

  // 2. Rigor Dimensional de Unidade e Conversão
  if (unit === 'g' || unit === 'grama' || unit === 'gramas') {
    // Massa direta: perfeitamente elegível
  } else if (unit === 'ml' || unit === 'mls') {
    // Volume: requer densidade formal (g/ml)
    if (canonicalFood.density === undefined || canonicalFood.density === null || typeof canonicalFood.density !== 'number' || !Number.isFinite(canonicalFood.density) || canonicalFood.density <= 0) {
      reasons.push(`Alimento líquido em '${unit}' sem densidade formal cadastrada. Proibido assumir 1 ml = 1 g.`);
    }
  } else {
    // Medidas caseiras: exigem gramPerUnit específico
    if (canonicalFood.gramPerUnit === undefined || canonicalFood.gramPerUnit === null || typeof canonicalFood.gramPerUnit !== 'number' || !Number.isFinite(canonicalFood.gramPerUnit) || canonicalFood.gramPerUnit <= 0) {
      reasons.push(`Medida caseira '${unit}' sem gramPerUnit específico. Fallback genérico não permitido para o solver.`);
    }
  }

  // 3. Governança de Estado Bromatológico
  const bromatology = canonicalFood.bromatology || {};
  const energyStatus = bromatology.energyStatus;

  if (energyStatus === 'INCONSISTENTE') {
    if (!policy.allowInconsistentStatus) {
      reasons.push("Status bromatológico 'INCONSISTENTE' (discrepância Atwater > 10% nos dados de origem).");
    } else {
      warnings.push("Status bromatológico 'INCONSISTENTE' admitido sob override de política.");
    }
  } else if (energyStatus === 'REVISAR') {
    if (!policy.allowReviewStatus) {
      reasons.push("Status bromatológico 'REVISAR' rejeitado pela política (allowReviewStatus: false).");
    } else {
      warnings.push("Status bromatológico 'REVISAR' (discrepância Atwater 5-10% no catálogo).");
    }
  }

  // 4. Governança Culinária e Blacklist de Não-Refeições
  const excludeNonMealItems = options.excludeNonMealItems !== false && policy.excludeNonMealItems !== false;
  if (excludeNonMealItems && foodName) {
    const fn = foodName.trim();
    const isWithoutSugar = /sem\s+a[çc][uú]car/i.test(fn);
    if (!isWithoutSugar && (/(?:^|[,\s])a[çc][uú]car(?:[,\s]|$)|gla[çc][uú]car|xarope|melado|sacarose/i.test(fn))) {
      reasons.push("Ingrediente culinário industrial (açúcar/xarope puro) inelegível como refeição clínica.");
    } else if (/bcaa|glutamina|beta-alanina|creatina|arginina|citrulina|carnitina/i.test(fn)) {
      reasons.push("Pó isolado de aminoácido/ergogênico inelegível como alimento estruturador de refeição.");
    } else if (/banha\s+de\s+porco|gordura\s+vegetal\s+hidrogenada|azeite\s+de\s+dend[eê]/i.test(fn)) {
      reasons.push("Gordura industrial de cocção inelegível como alimento direto de cardápio.");
    } else if (/^sal\b|sal\s+(?:refinado|grosso|marinho|rosa|iodado|de\s+parrilla)|color[ií]fico|fermento\s+qu[ií]mico|bicarbonato|ado[çc]ante|sucralose|eritritol|xilitol|est[eé]via/i.test(fn)) {
      reasons.push("Condimento puro, sal, adoçante ou aditivo químico inelegível como alimento de refeição.");
    } else if (/refrigerante|bebida\s+energ[eé]tica/i.test(fn)) {
      reasons.push("Bebida gaseificada/refrigerante inelegível como alimento estruturador de refeição clínica.");
    }
  }

  // 5. Governança de Estilo Dietético & Protocolos com Ciclos/Fases
  let dietaryStyle = String(options.dietaryStyle || (options.context && options.context.options && options.context.options.dietaryStyle) || (options.solverOptions && options.solverOptions.dietaryStyle) || '').trim().toLowerCase().replace(/[\s_-]/g, '');
  if (dietaryStyle === 'lowvab' || dietaryStyle === 'lowcarb') dietaryStyle = 'lowcarb';
  if (dietaryStyle === 'keto') dietaryStyle = 'cetogenica';
  if (dietaryStyle === 'while30') dietaryStyle = 'whole30';
  const dietaryCycle = String(options.dietaryCycle || (options.context && options.context.options && options.context.options.dietaryCycle) || (options.solverOptions && options.solverOptions.dietaryCycle) || '').trim().toLowerCase();
  const includeSupplements = options.includeSupplements !== false && (options.context?.options?.includeSupplements !== false) && (options.solverOptions?.includeSupplements !== false);

  if (foodName) {
    const fn = foodName.trim();

    // Suplementação desativada
    if (!includeSupplements && /whey|suplemento|albumina\s+em\s+p[oó]|prote[ií]na\s+isolada/i.test(fn)) {
      reasons.push("Suplemento proteico desativado pelo nutricionista (includeSupplements: false).");
    }

    // Padrão Ovo-Lacto (plant-based com ovos e lácteos)
    if (dietaryStyle === 'ovolacto' || dietaryStyle === 'plant_based') {
      const isEgg = /ovo|clara/i.test(fn);
      const isMeatOrFish = !isEgg && /\b(frango|galinha|patinho|alcatra|maminha|picanha|bovino|boi|vaca|carne|peixe|til[aá]pia|atum|salm[aã]o|sardinha|bacalhau|merluza|pescada|camar[aã]o|lula|polvo|marisco|su[ií]no|porco|bacon|presunto|peru|chester|cordeiro)\b/i.test(fn);
      if (isMeatOrFish) {
        reasons.push("Alimento de origem animal (carne/peixe) incompatível com padrão ovo-lacto.");
      }
    }

    // Dukan: Fase de Ataque (PP) ou Cruzeiro (PP)
    if (dietaryStyle === 'dukan' && (dietaryCycle === 'dukan_ataque' || dietaryCycle === 'dukan_cruzeiro_pp' || !dietaryCycle)) {
      const isLeanProtein = /frango|patinho|alcatra|til[aá]pia|merluza|pescada|atum|salm[aã]o|sardinha|ovo|clara|cottage|ricota|leite\s+desnatado|iogurte\s+desnatado|whey/i.test(fn);
      const isOatBran = /farelo\s+de\s+aveia/i.test(fn);
      if (!isLeanProtein && !isOatBran) {
        reasons.push("Fase de Ataque/PP da Dieta Dukan permite exclusivamente proteínas magras e farelo de aveia.");
      }
    }

    // Dukan: Fase de Cruzeiro (PL - Proteína + Legumes)
    if (dietaryStyle === 'dukan' && dietaryCycle === 'dukan_cruzeiro_pl') {
      const isProtein = /frango|patinho|alcatra|til[aá]pia|merluza|pescada|atum|salm[aã]o|sardinha|ovo|clara|cottage|ricota|iogurte\s+desnatado|whey/i.test(fn);
      const isOatBran = /farelo\s+de\s+aveia/i.test(fn);
      const isAllowedVeg = /br[oó]colis|salada|alface|tomate|pepino|abobrinha|espinafre|couve|cogumelo|palmito|berinjela|cenoura/i.test(fn);
      if (!isProtein && !isOatBran && !isAllowedVeg) {
        reasons.push("Fase de Cruzeiro (PL) da Dieta Dukan restringe carboidratos feculentos, grãos, tubérculos e frutas.");
      }
    }

    // Cetogênica (Keto)
    if (dietaryStyle === 'cetogenica' && dietaryCycle !== 'keto_ciclica_refeed') {
      const isHighCarb = /arroz|feij[aã]o|gr[aã]o-de-bico|lentilha|batata|mandioca|aipim|aveia|p[aã]o|tapioca|torrada|biscoito|macarr[aã]o|milho|banana|mam[aã]o|ma[cç][aã]|manga|uva/i.test(fn);
      if (isHighCarb) {
        reasons.push("Alimento com alto teor de carboidratos incompatível com indução cetogênica.");
      }
    }

    // Whole30
    if (dietaryStyle === 'whole30' && dietaryCycle !== 'whole30_reintroducao') {
      const isGrain = /arroz|aveia|trigo|p[aã]o|milho|tapioca|quinoa|centeio|cevada|macarr[aã]o/i.test(fn);
      const isLegume = /feij[aã]o|lentilha|gr[aã]o-de-bico|amendoim|pasta\s+de\s+amendoim|soja|tofu/i.test(fn);
      const isDairy = /leite|queijo|cottage|minas|iogurte|manteiga|requeij[aã]o|nata|creme\s+de\s+leite|whey/i.test(fn);
      if (isGrain) {
        reasons.push("Whole30 proíbe rigorosamente todos os grãos e cereais.");
      } else if (isLegume) {
        reasons.push("Whole30 proíbe todas as leguminosas (feijões, soja, amendoim).");
      } else if (isDairy) {
        reasons.push("Whole30 proíbe laticínios de qualquer origem animal.");
      }
    }

    // Low Carb
    if (dietaryStyle === 'lowcarb') {
      const isUltraCarb = /p[aã]o\s+franc[eê]s|tapioca|refrigerante/i.test(fn);
      if (isUltraCarb) {
        reasons.push("Alimento de alta carga glicêmica incompatível com o padrão Low Carb.");
      }
      if (dietaryCycle === 'lowcarb_restrita' && /arroz|feij[aã]o|batata/i.test(fn)) {
        reasons.push("Alimento com densidade glicídica incompatível com Low Carb Restrita / Indução.");
      }
    }
  }

  // Se houver qualquer razão de bloqueio, o alimento é inelegível
  if (reasons.length > 0) {
    return deepFreeze({
      status: ELIGIBILITY_STATUS.INELIGIBLE,
      isEligible: false,
      reasons,
      warnings,
      food: null
    });
  }

  // Se houver avisos (ex: REVISAR), status é WARNING
  const status = warnings.length > 0 ? ELIGIBILITY_STATUS.WARNING : ELIGIBILITY_STATUS.ELIGIBLE;

  return deepFreeze({
    status,
    isEligible: true,
    reasons: [],
    warnings,
    food: canonicalFood
  });
}

/**
 * Filtra e categoriza um catálogo completo de alimentos com base na elegibilidade e restrições estruturadas
 * @param {Array<Object>} catalog 
 * @param {Object} [policy] 
 * @param {Object} [options] 
 * @returns {{ eligible: Array<Object>, warnings: Array<Object>, ineligible: Array<Object>, governanceWarnings: string[], summary: Object }}
 */
function filterEligibleFoods(catalog, policy = DEFAULT_ELIGIBILITY_POLICY, options = {}) {
  const eligible = [];
  const warningList = [];
  const ineligible = [];
  const governanceWarnings = [];

  const rawList = Array.isArray(catalog) ? catalog : [];
  const constraints = options.constraints || (options.context && options.context.constraints) || {};
  const excludedCategories = new Set(Array.isArray(constraints.excludedCategories) ? constraints.excludedCategories : []);
  const excludedFoodIds = new Set(Array.isArray(constraints.excludedFoodIds) ? constraints.excludedFoodIds : []);
  const excludedTags = new Set(Array.isArray(constraints.excludedTags) ? constraints.excludedTags : []);

  for (let i = 0; i < rawList.length; i++) {
    const rawFood = rawList[i];
    const foodId = rawFood && (rawFood.id || rawFood.foodId);

    // 1. Exclusão por ID explícito (food.id ∈ constraints.excludedFoodIds -> INELIGIBLE)
    if (foodId && excludedFoodIds.has(foodId)) {
      ineligible.push({
        food: rawFood,
        reasons: [`Alimento expressamente excluído por restrição formal de ID (foodId: ${foodId}).`]
      });
      continue;
    }

    // 2. Exclusão formal por categoria canônica (food.category ∈ constraints.excludedCategories -> INELIGIBLE)
    const category = rawFood && rawFood.category;
    if (category && excludedCategories.has(category)) {
      ineligible.push({
        food: rawFood,
        reasons: [`Categoria '${category}' excluída pelas restrições formais de categoria.`]
      });
      continue;
    }

    // 3. Exclusão formal por tag (food.tag ∈ constraints.excludedTags -> INELIGIBLE)
    if (rawFood && Array.isArray(rawFood.tags) && rawFood.tags.some((tag) => excludedTags.has(tag))) {
      ineligible.push({
        food: rawFood,
        reasons: ['Alimento excluído por conter tag formalmente restrita.']
      });
      continue;
    }

    // 3. Avaliação de elegibilidade padrão
    const evalResult = evaluateFoodEligibility(rawFood, policy, options);

    if (evalResult.isEligible) {
      if (evalResult.status === ELIGIBILITY_STATUS.WARNING) {
        warningList.push({
          food: evalResult.food,
          warnings: evalResult.warnings
        });
      }
      eligible.push(evalResult.food);
    } else {
      ineligible.push({
        food: rawFood,
        reasons: evalResult.reasons
      });
    }
  }

  // Ordenação determinística prévia dos elegíveis:
  // 1. Status bromatológico: CONSISTENTE antes de REVISAR
  // 2. foodId lexicográfico
  eligible.sort((a, b) => {
    const statusA = (a.bromatology && a.bromatology.energyStatus) || 'CONSISTENTE';
    const statusB = (b.bromatology && b.bromatology.energyStatus) || 'CONSISTENTE';
    if (statusA === 'CONSISTENTE' && statusB !== 'CONSISTENTE') return -1;
    if (statusA !== 'CONSISTENTE' && statusB === 'CONSISTENTE') return 1;
    return String(a.id || a.foodId).localeCompare(String(b.id || b.foodId));
  });

  const summary = {
    totalReceived: rawList.length,
    eligibleCount: eligible.length,
    warningCount: warningList.length,
    ineligibleCount: ineligible.length
  };

  return deepFreeze({
    eligible,
    warnings: warningList,
    ineligible,
    governanceWarnings,
    summary
  });
}

module.exports = {
  ELIGIBILITY_STATUS,
  DEFAULT_ELIGIBILITY_POLICY,
  adaptCatalogToCanonical,
  evaluateFoodEligibility,
  filterEligibleFoods
};

  });

  // ── MÓDULO: domain/solver/foodSolverPolicy.js ──
  defineModule("domain/solver/foodSolverPolicy.js", function(require, module, exports) {
/**
 * domain/solver/foodSolverPolicy.js
 * 
 * Política Numérica, Função de Custo e Parâmetros do Food Solver — NutriAx Pro.
 * Fase N3.2 — Food Solver Determinístico Canônico.
 * 
 * Camada Pura — Sem I/O de infraestrutura, sem dependências remotas, determinismo total.
 * 
 * Princípios:
 * 1. DESACOPLAMENTO CLÍNICO: Parâmetros numéricos são limites computacionais do algoritmo,
 *    NUNCA recomendações clínicas ou prescrições fixas.
 * 2. DETERMINISMO ESTÓICO: Comportamento 100% reproduzível e auditável.
 * 3. PREVENÇÃO DE DIVISÃO POR ZERO: normalizedNutrientError seguro para target === 0.
 * 4. SEPARAÇÃO ENERGÉTICA: Fibras não entram na soma de calorias (4P + 4C + 9G).
 */

'use strict';

const FoodSolverContract = require('../contracts/FoodSolverContract');
const { deepFreeze } = FoodSolverContract;

/**
 * Papéis de Busca Computacional (Solver Search Roles)
 * Baseados estritamente em critérios objetivos físico-químicos centesimais (por 100g)
 */
const SEARCH_ROLES = Object.freeze({
  ROLE_PROTEIN_DENSE: 'ROLE_PROTEIN_DENSE',
  ROLE_CARB_DENSE: 'ROLE_CARB_DENSE',
  ROLE_FAT_DENSE: 'ROLE_FAT_DENSE',
  ROLE_FIBER_VOLUME: 'ROLE_FIBER_VOLUME',
  ROLE_BALANCED: 'ROLE_BALANCED'
});

/**
 * Política padrão do Food Solver (totalmente congelada)
 */
const DEFAULT_FOOD_SOLVER_POLICY = Object.freeze({
  policyVersion: '1.0.0',
  solverVersion: 'N3.2.0',

  // Pesos da função de custo
  weights: Object.freeze({
    calories: 1.0,
    protein: 1.2,
    carbohydrate: 1.0,
    fat: 1.0,
    fiber: 0.5
  }),

  // Escalas de normalização para targets nulos ou muito baixos (evita divisão por zero)
  fallbackScales: Object.freeze({
    calories: 100.0,    // kcal
    protein: 10.0,      // g
    carbohydrate: 15.0, // g
    fat: 5.0,           // g
    fiber: 5.0          // g
  }),

  // Tolerâncias de aceitação para status PASS vs WARNING
  tolerances: Object.freeze({
    caloriesKcal: 35.0,
    proteinG: 5.0,
    carbohydrateG: 8.0,
    fatG: 2.5,
    fiberG: 30.0
  }),

  // Limites computacionais de busca (NÃO são recomendações clínicas)
  searchBounds: Object.freeze({
    minGramsPerItem: 10.0,
    maxGramsPerItem: 450.0,
    stepGrams: 5.0,
    targetItemCountMin: 3,
    targetItemCountMax: 5
  }),

  // Limites para redução determinística do espaço de busca
  candidateLimits: Object.freeze({
    perRoleLimit: 5,
    globalCandidateLimit: 25
  }),

  // Parâmetros de iteração do algoritmo
  convergence: Object.freeze({
    maxIterations: 150,
    minCostImprovement: 1e-4,
    enableEarlyStop: true,
    earlyStopCost: 0.05
  }),

  // ── LIMITE DE BUSCA COMBINATÓRIA (N3.7.5) ─────────────────────────────────
  // Proteção determinística contra explosão combinatória na thread principal.
  //
  // Justificativa técnica:
  //   C(20,3)=1.140 + C(20,4)=4.845 + C(20,5)=15.504 + C(20,6)=38.760 +
  //   C(20,7)=77.520 = ~137.769 combinações × até 150 iterações/otimização
  //   ≈ 20 milhões de avaliações síncronas → trava o event loop do browser.
  //
  // Comportamento quando atingido:
  //   O solver retorna status SEARCH_LIMIT_REACHED com a melhor solução
  //   encontrada até o momento e diagnóstico explícito.
  //   O orchestrator NÃO persiste esse resultado como prescrição validada.
  //
  // Valor padrão: 5.000 combinações
  //   → permite C(20,3)+C(20,4) = ~5.985 (todos k=3,4 e início de k=5)
  //   → entrega solução de qualidade em <200ms no browser
  //   → configurável por política de runtime (ex: Node pode usar Infinity)
  //
  // Este parâmetro é COMPUTACIONAL, não clínico.
  // Não altera TMB, GET, macros, déficit ou regras de N3.6.
  searchLimit: Object.freeze({
    maxCombosToTest: 5000,
    // Diagnóstico emitido quando o limite é atingido
    diagnosticCode: 'SEARCH_LIMIT_REACHED',
    // true = retornar melhor resultado parcial; false = retornar BLOCKED
    returnBestPartial: true
  }),

  // Hierarquia determinística de desempate
  tieBreakOrder: Object.freeze([
    'LOWEST_COST',
    'CONSISTENT_STATUS_COUNT',
    'SMALLEST_ITEM_COUNT',
    'LEXICOGRAPHICAL_FOOD_ID'
  ]),

  // Opções de elegibilidade integradas
  eligibility: Object.freeze({
    allowReviewStatus: true,
    allowInconsistentStatus: false
  })
});

/**
 * Normaliza o erro de desvio com segurança estrita contra divisão por zero
 * @param {number} delta Diferença (entregue - meta)
 * @param {number} target Meta numérica (pode ser 0)
 * @param {number} fallbackScale Escala de referência técnica da política
 * @returns {number}
 */
function normalizedNutrientError(delta, target, fallbackScale) {
  if (typeof delta !== 'number' || !Number.isFinite(delta)) {
    return 0;
  }
  const tgt = typeof target === 'number' && Number.isFinite(target) ? target : 0;
  const scale = typeof fallbackScale === 'number' && Number.isFinite(fallbackScale) && fallbackScale > 0 ? fallbackScale : 10.0;

  if (tgt > 0) {
    return Math.pow(delta / tgt, 2);
  }
  // Se target === 0
  if (Math.abs(delta) < 1e-9) {
    return 0;
  }
  return Math.pow(delta / scale, 2);
}

/**
 * Calcula a perda nutricional multidimensional ponderada
 * @param {Object} totals Nutrientes entregues { calories, protein, carbohydrate, fat, fiber }
 * @param {Object} targets Metas { calories, protein, carbohydrate, fat, fiber }
 * @param {Object} weights Pesos { calories, protein, carbohydrate, fat, fiber }
 * @param {Object} fallbackScales Escalas { calories, protein, carbohydrate, fat, fiber }
 * @returns {{ totalCost: number, errors: Object, diffs: Object }}
 */
function calculateNutrientLoss(totals, targets, weights = DEFAULT_FOOD_SOLVER_POLICY.weights, fallbackScales = DEFAULT_FOOD_SOLVER_POLICY.fallbackScales) {
  const diffs = {
    calories: (totals.calories || 0) - (targets.calories || 0),
    protein: (totals.protein || 0) - (targets.protein || 0),
    carbohydrate: (totals.carbohydrate || 0) - (targets.carbohydrate || 0),
    fat: (totals.fat || 0) - (targets.fat || 0),
    fiber: (totals.fiber || 0) - (targets.fiber || 0)
  };

  const errKcal = normalizedNutrientError(diffs.calories, targets.calories, fallbackScales.calories);
  const errProt = normalizedNutrientError(diffs.protein, targets.protein, fallbackScales.protein);
  const errCarb = normalizedNutrientError(diffs.carbohydrate, targets.carbohydrate, fallbackScales.carbohydrate);
  const errFat = normalizedNutrientError(diffs.fat, targets.fat, fallbackScales.fat);
  const errFiber = normalizedNutrientError(diffs.fiber, targets.fiber, fallbackScales.fiber);

  const totalCost = 
    (weights.calories || 1.0) * errKcal +
    (weights.protein || 1.0) * errProt +
    (weights.carbohydrate || 1.0) * errCarb +
    (weights.fat || 1.0) * errFat +
    (weights.fiber || 0.5) * errFiber;

  return {
    totalCost,
    errors: {
      calories: errKcal,
      protein: errProt,
      carbohydrate: errCarb,
      fat: errFat,
      fiber: errFiber
    },
    diffs
  };
}

/**
 * Determina o papel computacional de busca (Search Role) de um alimento
 * Baseado estritamente em critérios objetivos centesimais (por 100g)
 * @param {Object} food 
 * @returns {string} SEARCH_ROLES
 */
function assignSearchRole(food) {
  if (!food) return SEARCH_ROLES.ROLE_BALANCED;

  const prot = Number(food.protein || 0);
  const carb = Number(food.carbohydrate || 0);
  const fat = Number(food.lipid || 0);
  const kcal = Number(food.calories || 0);
  const fiber = Number(food.fiber || 0);

  // Energia por macros
  const protKcal = prot * 4;
  const carbKcal = carb * 4;
  const fatKcal = fat * 9;
  const totalMacroKcal = protKcal + carbKcal + fatKcal;

  if (totalMacroKcal > 0) {
    const protRatio = protKcal / totalMacroKcal;
    const carbRatio = carbKcal / totalMacroKcal;
    const fatRatio = fatKcal / totalMacroKcal;

    if (protRatio >= 0.35 || prot >= 12) {
      return SEARCH_ROLES.ROLE_PROTEIN_DENSE;
    }
    if (carbRatio >= 0.50 || carb >= 18) {
      return SEARCH_ROLES.ROLE_CARB_DENSE;
    }
    if (fatRatio >= 0.40 || fat >= 12) {
      return SEARCH_ROLES.ROLE_FAT_DENSE;
    }
  }

  if (fiber >= 3.0 || (kcal > 0 && kcal <= 60)) {
    return SEARCH_ROLES.ROLE_FIBER_VOLUME;
  }

  return SEARCH_ROLES.ROLE_BALANCED;
}

module.exports = {
  SEARCH_ROLES,
  DEFAULT_FOOD_SOLVER_POLICY,
  normalizedNutrientError,
  calculateNutrientLoss,
  assignSearchRole
};

  });

  // ── MÓDULO: domain/solver/foodSolver.js ──
  defineModule("domain/solver/foodSolver.js", function(require, module, exports) {
/**
 * domain/solver/foodSolver.js
 * 
 * Motor Determinístico de Otimização e Fechamento Nutricional (Deterministic Bounded Nutrient Optimization).
 * Fase N3.2 — Food Solver Determinístico Canônico — NutriAx Pro.
 * 
 * Camada Pura — Sem I/O de infraestrutura, sem persistência externa, sem dependências remotas.
 * 
 * Princípios de Execução:
 * 1. PUREZA ABSOLUTA: Função pura sem efeitos colaterais.
 * 2. DETERMINISMO ESTÓICO: Comportamento 100% reproduzível e auditável.
 * 3. INVARIÂNCIA À ORDEM: A ordem do array de entrada não altera o resultado.
 * 4. PORTÃO ESTRITO: Exige validationResult.valid === true (Fase N2.3).
 * 5. SEPARAÇÃO ENERGÉTICA: Fibras não entram na soma calórica (4P + 4C + 9G).
 * 6. GOVERNANÇA DE REVISAR: Alimentos com status REVISAR NUNCA podem produzir status PASS.
 * 7. PRECISÃO MATEMÁTICA: Otimização contínua com ponto flutuante Float64; arredondamento na saída.
 */

'use strict';

const FoodSolverContract = require('../contracts/FoodSolverContract');
const {
  SOLVER_STATUS,
  validateFoodSolverInput,
  validateFoodSolverOutput,
  deepFreeze
} = FoodSolverContract;

const {
  adaptCatalogToCanonical,
  filterEligibleFoods,
  ELIGIBILITY_STATUS
} = require('./foodEligibility');

const {
  DEFAULT_FOOD_SOLVER_POLICY,
  SEARCH_ROLES,
  calculateNutrientLoss,
  assignSearchRole
} = require('./foodSolverPolicy');

/**
 * Arredonda valor para número específico de casas decimais
 * @param {number} val 
 * @param {number} decimals 
 * @returns {number}
 */
function roundTo(val, decimals = 2) {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

/**
 * Calcula os nutrientes fornecidos por um alimento em dada massa em gramas
 * @param {Object} food 
 * @param {number} grams 
 * @returns {{ calories: number, protein: number, carbohydrate: number, lipid: number, fiber: number, sodium: number }}
 */
function calculateFoodPortionNutrients(food, grams) {
  const baseQty = food.baseQuantity && food.baseQuantity > 0 ? food.baseQuantity : 100;
  const factor = grams / baseQty;

  const prot = (food.protein || 0) * factor;
  const carb = (food.carbohydrate || 0) * factor;
  const fat = (food.lipid || 0) * factor;
  const fib = (food.fiber || 0) * factor;
  const sod = (food.sodium || 0) * factor;

  // Energia canônica baseada estritamente em Atwater (4P + 4C + 9G) para consistência termodinâmica
  const cal = prot * 4 + carb * 4 + fat * 9;

  return {
    calories: cal,
    protein: prot,
    carbohydrate: carb,
    lipid: fat,
    fiber: fib,
    sodium: sod
  };
}

/**
 * Pontuação determinística de afinidade clínica e gastronômica por estilo e ciclo
 * @param {Object} food 
 * @param {string} role 
 * @param {Object} options 
 * @returns {number}
 */
function calculateClinicalStapleScore(food, role, options = {}) {
  const name = String(food.name || food.foodName || '').toLowerCase();
  let style = String(options.dietaryStyle || '').toLowerCase().replace(/[\s_-]/g, '');
  if (style === 'lowvab' || style === 'lowcarb') style = 'lowcarb';
  if (style === 'keto') style = 'cetogenica';
  if (style === 'while30') style = 'whole30';
  const cycle = String(options.dietaryCycle || '').toLowerCase();
  const includeSupplements = options.includeSupplements !== false;

  let score = 0;

  // 1. Pilares universais da alimentação clínica real brasileira
  if (/arroz/i.test(name)) score += 600;
  if (/feij[aã]o/i.test(name)) score += 600;
  if (/frango/i.test(name)) score += 550;
  if (/patinho|alcatra|maminha/i.test(name)) score += 500;
  if (/til[aá]pia|merluza|pescada/i.test(name)) score += 480;
  if (/salm[aã]o|sardinha|atum/i.test(name)) score += 470;
  if (/ovo\s+de\s+galinha|ovos/i.test(name)) score += 550;
  if (/clara/i.test(name)) score += 450;
  if (/batata\s+doce/i.test(name)) score += 500;
  if (/batata\s+inglesa/i.test(name)) score += 450;
  if (/mandioca|aipim/i.test(name)) score += 420;
  if (/aveia/i.test(name)) score += 500;
  if (/p[aã]o.*integral/i.test(name)) score += 480;
  if (/banana/i.test(name)) score += 450;
  if (/ma[cç][aã]/i.test(name)) score += 400;
  if (/mam[aã]o/i.test(name)) score += 400;
  if (/morango/i.test(name)) score += 420;
  if (/br[oó]colis/i.test(name)) score += 450;
  if (/salada|alface|tomate|pepino|espinafre/i.test(name)) score += 450;
  if (/azeite.*oliva/i.test(name)) score += 550;
  if (/castanha|nozes/i.test(name)) score += 450;
  if (/abacate/i.test(name)) score += 450;
  if (/iogurte/i.test(name)) score += 450;
  if (/cottage|minas|ricota/i.test(name)) score += 450;

  // 2. Modulações de Afinidade por Estilo & Ciclo
  if (style === 'tradicional') {
    if (/arroz/i.test(name)) score += 250;
    if (/feij[aã]o/i.test(name)) score += 250;
    if (/frango|patinho|ovo/i.test(name)) score += 200;
    if (/batata|p[aã]o/i.test(name)) score += 150;
    if (/banana|salada/i.test(name)) score += 150;
  } else if (style === 'fitness') {
    if (/frango|til[aá]pia|clara/i.test(name)) score += 300;
    if (/batata\s+doce|aveia/i.test(name)) score += 250;
    if (/whey/i.test(name)) score += (includeSupplements ? 350 : -9999);
    if (/br[oó]colis|salada/i.test(name)) score += 200;
    if (/pasta\s+de\s+amendoim/i.test(name)) score += 200;
  } else if (style === 'pratico') {
    if (/p[aã]o|iogurte|aveia|banana|ovo|cottage|minas/i.test(name)) score += 300;
    if (/whey/i.test(name)) score += (includeSupplements ? 300 : -9999);
    if (/atum/i.test(name)) score += 250;
  } else if (style === 'ovolacto' || style === 'plant_based') {
    if (/ovo|queijo|iogurte|leite/i.test(name)) score += 300;
    if (/feij[aã]o|lentilha|gr[aã]o-de-bico/i.test(name)) score += 300;
    if (/aveia|arroz|castanha|tofu/i.test(name)) score += 250;
    if (/frango|carne|peixe|su[ií]no/i.test(name)) score = -9999;
  } else if (style === 'cetogenica') {
    if (cycle === 'keto_ciclica_refeed') {
      if (/arroz|batata|aveia|frutas/i.test(name)) score += 400;
      if (/frango|til[aá]pia|clara/i.test(name)) score += 300;
    } else {
      if (/azeite.*oliva|castanha|abacate|manteiga/i.test(name)) score += 400;
      if (/ovo|frango|salm[aã]o|sardinha|patinho|queijo/i.test(name)) score += 350;
      if (/br[oó]colis|salada|abobrinha|espinafre/i.test(name)) score += 300;
      if (/arroz|feij[aã]o|p[aã]o|batata|aveia|tapioca|banana|ma[cç][aã]|mam[aã]o/i.test(name)) score = -9999;
    }
  } else if (style === 'lowcarb') {
    if (/ovo|frango|peixe|patinho|queijo/i.test(name)) score += 300;
    if (/azeite.*oliva|castanha|abacate/i.test(name)) score += 300;
    if (/br[oó]colis|salada|morango/i.test(name)) score += 250;
    if (/p[aã]o\s+franc[eê]s|tapioca/i.test(name)) score = -9999;
    if (cycle === 'lowcarb_restrita' && /arroz|feij[aã]o|batata/i.test(name)) score = -9999;
    if (cycle === 'lowcarb_moderada') {
      if (/batata\s+doce|aveia|arroz\s+integral/i.test(name)) score += 200;
    }
  } else if (style === 'dukan') {
    if (cycle === 'dukan_ataque' || cycle === 'dukan_cruzeiro_pp' || !cycle) {
      if (/frango|clara|ovo|patinho|til[aá]pia|merluza|sardinha|salm[aã]o|atum/i.test(name)) score += 500;
      if (/farelo\s+de\s+aveia/i.test(name)) score += 500;
      if (/cottage|ricota/i.test(name)) score += 300;
      if (/arroz|feij[aã]o|p[aã]o|batata|fruta|br[oó]colis|salada|azeite/i.test(name)) score = -9999;
    } else if (cycle === 'dukan_cruzeiro_pl') {
      if (/frango|patinho|til[aá]pia|merluza|sardinha|salm[aã]o|ovo|clara/i.test(name)) score += 500;
      if (/farelo\s+de\s+aveia/i.test(name)) score += 500;
      if (/br[oó]colis|salada|alface|tomate|pepino|abobrinha|espinafre/i.test(name)) score += 400;
      if (/arroz|feij[aã]o|p[aã]o|batata|fruta|azeite/i.test(name)) score = -9999;
    } else if (cycle === 'dukan_consolidacao') {
      if (/frango|patinho|peixe|ovo|farelo/i.test(name)) score += 400;
      if (/ma[cç][aã]|morango|p[aã]o.*integral/i.test(name)) score += 350;
    }
  } else if (style === 'whole30') {
    if (/ovo|frango|patinho|til[aá]pia|salm[aã]o|sardinha|merluza/i.test(name)) score += 400;
    if (/batata\s+doce|batata\s+inglesa|mandioca|aipim/i.test(name)) score += 350;
    if (/salada|br[oó]colis|abobrinha|espinafre|banana|ma[cç][aã]|mam[aã]o|morango/i.test(name)) score += 350;
    if (/azeite.*oliva|castanha|abacate/i.test(name)) score += 400;
    if (/arroz|aveia|p[aã]o|feij[aã]o|leite|queijo|iogurte|amendoim|whey/i.test(name)) score = -9999;
  }

  // Suplementos desativados
  if (!includeSupplements && /whey/i.test(name)) {
    score = -9999;
  }

  return score;
}

/**
 * Redução determinística e estável do espaço de busca
 * Agrupa por Search Roles e limita a K candidatos de alta relevância por papel
 * @param {Array<Object>} eligibleFoods 
 * @param {Object} policy 
 * @param {Object} [options]
 * @returns {Array<Object>} Candidatos selecionados para a busca combinatória
 */
function reduceSearchCandidates(eligibleFoods, policy, options = {}) {
  const perRoleLimit = policy.candidateLimits.perSearchRole || 4;
  const globalLimit = policy.candidateLimits.globalCandidateLimit || 20;

  const roleBuckets = {
    [SEARCH_ROLES.ROLE_PROTEIN_DENSE]: [],
    [SEARCH_ROLES.ROLE_CARB_DENSE]: [],
    [SEARCH_ROLES.ROLE_FAT_DENSE]: [],
    [SEARCH_ROLES.ROLE_FIBER_VOLUME]: [],
    [SEARCH_ROLES.ROLE_BALANCED]: []
  };

  // 1. Agrupar em buckets
  for (let i = 0; i < eligibleFoods.length; i++) {
    const food = eligibleFoods[i];
    const role = assignSearchRole(food);
    if (roleBuckets[role]) {
      roleBuckets[role].push(food);
    } else {
      roleBuckets[SEARCH_ROLES.ROLE_BALANCED].push(food);
    }
  }

  // 2. Ordenar deterministicamente cada bucket:
  // Critério:
  // a) Status bromatológico: CONSISTENTE antes de REVISAR
  // b) Pontuação de Afinidade Clínica e Estilo Gastronômico + Densidade de Papel
  // c) Desempate estrito por foodId lexicográfico
  const comparator = (role) => (a, b) => {
    const statusA = (a.bromatology && a.bromatology.energyStatus) || 'CONSISTENTE';
    const statusB = (b.bromatology && b.bromatology.energyStatus) || 'CONSISTENTE';
    if (statusA === 'CONSISTENTE' && statusB !== 'CONSISTENTE') return -1;
    if (statusA !== 'CONSISTENTE' && statusB === 'CONSISTENTE') return 1;

    const stapleA = calculateClinicalStapleScore(a, role, options);
    const stapleB = calculateClinicalStapleScore(b, role, options);

    let densityA = 0;
    let densityB = 0;
    if (role === SEARCH_ROLES.ROLE_PROTEIN_DENSE) {
      densityA = a.protein || 0;
      densityB = b.protein || 0;
    } else if (role === SEARCH_ROLES.ROLE_CARB_DENSE) {
      densityA = a.carbohydrate || 0;
      densityB = b.carbohydrate || 0;
    } else if (role === SEARCH_ROLES.ROLE_FAT_DENSE) {
      densityA = a.lipid || 0;
      densityB = b.lipid || 0;
    } else if (role === SEARCH_ROLES.ROLE_FIBER_VOLUME) {
      densityA = a.fiber || 0;
      densityB = b.fiber || 0;
    } else {
      densityA = a.calories || 0;
      densityB = b.calories || 0;
    }

    const totalA = stapleA + densityA;
    const totalB = stapleB + densityB;

    if (Math.abs(totalB - totalA) > 1e-5) {
      return totalB - totalA; // Maior pontuação total primeiro
    }

    // Desempate estável final
    return String(a.id || a.foodId).localeCompare(String(b.id || b.foodId));
  };

  const selectedCandidates = [];
  const rolesOrder = [
    SEARCH_ROLES.ROLE_PROTEIN_DENSE,
    SEARCH_ROLES.ROLE_CARB_DENSE,
    SEARCH_ROLES.ROLE_FAT_DENSE,
    SEARCH_ROLES.ROLE_FIBER_VOLUME,
    SEARCH_ROLES.ROLE_BALANCED
  ];

  rolesOrder.forEach((role) => {
    const bucket = roleBuckets[role];
    bucket.sort(comparator(role));
    const topFromRole = bucket.slice(0, perRoleLimit);
    topFromRole.forEach((f) => {
      if (selectedCandidates.length < globalLimit && !selectedCandidates.some((sc) => sc.id === f.id)) {
        selectedCandidates.push(f);
      }
    });
  });

  // Ordenação canônica final do pool reduzido para garantir invariância
  selectedCandidates.sort((a, b) => String(a.id).localeCompare(String(b.id)));

  return selectedCandidates;
}

/**
 * Otimiza deterministicamente as porções contínuas de um subconjunto fixo de alimentos
 * usando Deterministic Bounded Coordinate Search (busca local determinística com step sizes decrescentes)
 * @param {Array<Object>} combo Conjunto de alimentos selecionados
 * @param {Object} targets Metas nutricionais { calories, protein, carbohydrate, fat, fiber }
 * @param {Object} policy Política do solver
 * @returns {{ portions: number[], totals: Object, cost: number, iterations: number }}
 */
function optimizeComboPortions(combo, targets, policy) {
  const k = combo.length;
  const minG = policy.searchBounds.minGramsPerItem;
  const maxG = policy.searchBounds.maxGramsPerItem;
  const maxIter = policy.convergence.maxIterations;
  const minImprovement = policy.convergence.minCostImprovement;

  // Inicialização determinística proporcional ao alvo calórico
  const avgInitGrams = Math.min(maxG, Math.max(minG, (targets.calories / (k * 150)) * 100));
  const portions = new Array(k).fill(avgInitGrams);

  // Função interna para calcular totais atuais
  function getTotals(currentPortions) {
    let cal = 0, prot = 0, carb = 0, fat = 0, fib = 0, sod = 0;
    for (let i = 0; i < k; i++) {
      const p = calculateFoodPortionNutrients(combo[i], currentPortions[i]);
      cal += p.calories;
      prot += p.protein;
      carb += p.carbohydrate;
      fat += p.lipid;
      fib += p.fiber;
      sod += p.sodium;
    }
    return { calories: cal, protein: prot, carbohydrate: carb, fat: fat, fiber: fib, sodium: sod };
  }

  let currentTotals = getTotals(portions);
  let currentCostObj = calculateNutrientLoss(currentTotals, targets, policy.weights, policy.fallbackScales);
  let currentCost = currentCostObj.totalCost;
  let iterations = 0;

  // Passos de exploração da busca unidimensional determinística
  const stepSizes = [25.0, 10.0, 5.0, 2.0, 1.0, 0.5];

  for (let iter = 0; iter < maxIter; iter++) {
    iterations++;
    let improvedInIter = false;

    for (let i = 0; i < k; i++) {
      let bestPortionForI = portions[i];
      let bestCostForI = currentCost;

      for (let s = 0; s < stepSizes.length; s++) {
        const step = stepSizes[s];
        
        // Testa aumento
        const testUp = Math.min(maxG, bestPortionForI + step);
        if (testUp !== bestPortionForI) {
          const testPortions = [...portions];
          testPortions[i] = testUp;
          const tTotals = getTotals(testPortions);
          const tCost = calculateNutrientLoss(tTotals, targets, policy.weights, policy.fallbackScales).totalCost;
          if (tCost < bestCostForI - 1e-9) {
            bestCostForI = tCost;
            bestPortionForI = testUp;
          }
        }

        // Testa redução
        const testDown = Math.max(minG, bestPortionForI - step);
        if (testDown !== bestPortionForI) {
          const testPortions = [...portions];
          testPortions[i] = testDown;
          const tTotals = getTotals(testPortions);
          const tCost = calculateNutrientLoss(tTotals, targets, policy.weights, policy.fallbackScales).totalCost;
          if (tCost < bestCostForI - 1e-9) {
            bestCostForI = tCost;
            bestPortionForI = testDown;
          }
        }
      }

      if (bestCostForI < currentCost - 1e-9) {
        portions[i] = bestPortionForI;
        currentCost = bestCostForI;
        improvedInIter = true;
      }
    }

    if (!improvedInIter || currentCost < 1e-6) {
      break;
    }
  }

  currentTotals = getTotals(portions);
  return {
    portions,
    totals: currentTotals,
    cost: currentCost,
    iterations
  };
}

/**
 * Gera combinações determinísticas de tamanho k a partir de uma lista ordenada
 * @param {Array} arr 
 * @param {number} k 
 * @returns {Array<Array>}
 */
function getCombinations(arr, k) {
  const result = [];
  function backtrack(start, currentCombo) {
    if (currentCombo.length === k) {
      result.push([...currentCombo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      currentCombo.push(arr[i]);
      backtrack(i + 1, currentCombo);
      currentCombo.pop();
    }
  }
  backtrack(0, []);
  return result;
}

/**
 * Executa o Food Solver determinístico (Deterministic Bounded Nutrient Optimization)
 * @param {Object} input Contrato de Entrada FoodSolverInputDTO
 * @param {Object} [customPolicy] Política customizada opcional
 * @returns {Object} Contrato de Saída FoodSolverOutputDTO
 */
function solveNutritionDiet(input, customPolicy = {}) {
  const policy = {
    ...DEFAULT_FOOD_SOLVER_POLICY,
    ...customPolicy,
    weights: { ...DEFAULT_FOOD_SOLVER_POLICY.weights, ...(customPolicy.weights || {}) },
    tolerances: { ...DEFAULT_FOOD_SOLVER_POLICY.tolerances, ...(customPolicy.tolerances || {}) },
    searchBounds: { ...DEFAULT_FOOD_SOLVER_POLICY.searchBounds, ...(customPolicy.searchBounds || {}) },
    candidateLimits: { ...DEFAULT_FOOD_SOLVER_POLICY.candidateLimits, ...(customPolicy.candidateLimits || {}) },
    convergence: { ...DEFAULT_FOOD_SOLVER_POLICY.convergence, ...(customPolicy.convergence || {}) },
    eligibility: { ...DEFAULT_FOOD_SOLVER_POLICY.eligibility, ...(customPolicy.eligibility || {}) }
  };

  const solverVersion = policy.solverVersion || 'N3.2.0';

  // 1. Portão de Entrada Obrigatório (N2.3 Validation Gate)
  const inputValidation = validateFoodSolverInput(input);
  if (!inputValidation.isValid || inputValidation.isBlocked) {
    return deepFreeze({
      status: SOLVER_STATUS.BLOCKED,
      valid: false,
      meals: [],
      totals: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0, sodium: 0 },
      target: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0 },
      differences: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0 },
      foodProvenance: [],
      solverDiagnostics: ['Execução bloqueada pelo portão de validação de entrada.'],
      warnings: [],
      blockingReasons: inputValidation.errors,
      solverVersion,
      provenance: { engine: 'NutriAxDeterministicFoodSolver', policyVersion: policy.policyVersion }
    });
  }

  // 2. Extração das Metas Canônicas
  const targets = {
    calories: Number(input.energyTarget.caloricTargetKcal),
    protein: Number(input.macroTarget.proteinTargetG),
    carbohydrate: Number(input.macroTarget.carbohydrateTargetG),
    fat: Number(input.macroTarget.fatTargetG),
    fiber: Number(input.macroTarget.fiberTargetG || 0)
  };

  // 3. Adaptação e Filtragem do Catálogo
  const rawCatalog = Array.isArray(input.foodCatalog) ? input.foodCatalog : [];
  const canonicalCatalog = adaptCatalogToCanonical(rawCatalog);

  const filterOptions = {
    context: input.context,
    constraints: input.constraints || (input.context && input.context.constraints) || {},
    ...(input.options || {}),
    dietaryStyle: input.options?.dietaryStyle || input.context?.options?.dietaryStyle || input.context?.dietaryStyle,
    dietaryCycle: input.options?.dietaryCycle || input.context?.options?.dietaryCycle || input.context?.dietaryCycle,
    includeSupplements: input.options?.includeSupplements !== false && input.context?.options?.includeSupplements !== false
  };

  const filterResult = filterEligibleFoods(canonicalCatalog, policy.eligibility, filterOptions);
  const eligibleFoods = filterResult.eligible;
  const governanceWarnings = [...filterResult.governanceWarnings];

  if (eligibleFoods.length === 0) {
    return deepFreeze({
      status: SOLVER_STATUS.BLOCKED,
      valid: false,
      meals: [],
      totals: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0, sodium: 0 },
      target: targets,
      differences: {
        calories: -targets.calories,
        protein: -targets.protein,
        carbohydrate: -targets.carbohydrate,
        fat: -targets.fat,
        fiber: -targets.fiber
      },
      foodProvenance: [],
      solverDiagnostics: ['Nenhum alimento elegível disponível no catálogo após filtros e restrições.'],
      warnings: governanceWarnings,
      blockingReasons: ['Catálogo de alimentos vazio ou sem alimentos elegíveis para otimização.'],
      solverVersion,
      provenance: { engine: 'NutriAxDeterministicFoodSolver', policyVersion: policy.policyVersion }
    });
  }

  // 4. Redução Determinística do Espaço de Busca
  const candidatePool = reduceSearchCandidates(eligibleFoods, policy, filterOptions);

  // 5. Busca Bounded e Otimização Combinatória com Limite Determinístico (N3.7.5)
  const targetItemCountMin = Math.min(policy.searchBounds.targetItemCountMin, candidatePool.length);
  const targetItemCountMax = Math.min(policy.searchBounds.targetItemCountMax, candidatePool.length);

  // Limite computacional de busca — proteção contra explosão combinatória.
  // NÃO é um parâmetro clínico: não altera TMB, GET, macros ou regras N3.6.
  // Configurável pela policy para ambientes diferentes (browser: 5000, Node: Infinity).
  const searchLimitPolicy = policy.searchLimit || {};
  const maxCombosToTest = (typeof searchLimitPolicy.maxCombosToTest === 'number' && searchLimitPolicy.maxCombosToTest > 0)
    ? searchLimitPolicy.maxCombosToTest
    : Infinity;
  const returnBestPartial = searchLimitPolicy.returnBestPartial !== false;

  let bestSolution = null;
  let totalCombosTested = 0;
  let totalIterationsExecuted = 0;
  let searchLimitReached = false;
  let earlyConverged = false;

  const enableEarlyStop = policy.convergence && policy.convergence.enableEarlyStop !== false;
  const earlyStopCost = (policy.convergence && typeof policy.convergence.earlyStopCost === 'number')
    ? policy.convergence.earlyStopCost
    : 0.05;

  outerLoop:
  for (let k = targetItemCountMin; k <= targetItemCountMax; k++) {
    const combos = getCombinations(candidatePool, k);

    for (let c = 0; c < combos.length; c++) {
      // Verificação do limite antes de avaliar a próxima combinação
      if (totalCombosTested >= maxCombosToTest) {
        searchLimitReached = true;
        break outerLoop;
      }

      totalCombosTested++;
      const combo = combos[c];
      const opt = optimizeComboPortions(combo, targets, policy);
      totalIterationsExecuted += opt.iterations;

      if (!bestSolution) {
        bestSolution = { combo, ...opt };
      } else {
        // Desempate Estóico e Determinístico
        const isBetterCost = opt.cost < bestSolution.cost - 1e-6;
        const isSameCost = Math.abs(opt.cost - bestSolution.cost) <= 1e-6;

        if (isBetterCost) {
          bestSolution = { combo, ...opt };
        } else if (isSameCost) {
          // Desempate 2 (CONSISTENT_STATUS_COUNT): Contagem de alimentos com status CONSISTENTE
          const consistentCountOpt = combo.filter(f => (f.bromatology && f.bromatology.energyStatus) === 'CONSISTENTE').length;
          const consistentCountBest = bestSolution.combo.filter(f => (f.bromatology && f.bromatology.energyStatus) === 'CONSISTENTE').length;

          if (consistentCountOpt > consistentCountBest) {
            bestSolution = { combo, ...opt };
          } else if (consistentCountOpt === consistentCountBest) {
            // Desempate 3: Menor quantidade de itens
            if (combo.length < bestSolution.combo.length) {
              bestSolution = { combo, ...opt };
            } else if (combo.length === bestSolution.combo.length) {
              // Desempate 4: Ordem lexicográfica dos IDs
              const idStrOpt = combo.map(f => f.id).join('-');
              const idStrBest = bestSolution.combo.map(f => f.id).join('-');
              if (idStrOpt.localeCompare(idStrBest) < 0) {
                bestSolution = { combo, ...opt };
              }
            }
          }
        }
      }

      // Early Stop determinístico (N3.7.6):
      // Se a solução atual satisfaz integralmente as tolerâncias canônicas da política,
      // não contém alimentos com status REVISAR, possui quantidade de itens suficiente
      // para cobrir todas as refeições diárias e atinge o limiar de custo de parada antecipada,
      // interrompe a busca imediatamente com garantia de conformidade clínica PASS.
      if (enableEarlyStop) {
        const requiredMealCount = (input.context && (input.context.mealsPerDay || (input.context.patient && input.context.patient.mealsPerDay))) ||
          (input.options && input.options.mealCount) ||
          policy.searchBounds.targetItemCountMin ||
          3;

        const containsReview = combo.some(f => (f.bromatology && f.bromatology.energyStatus) === 'REVISAR');
        if (!containsReview && combo.length >= requiredMealCount && opt.cost <= earlyStopCost) {
          const diffCal = Math.abs(opt.totals.calories - targets.calories);
          const diffProt = Math.abs(opt.totals.protein - targets.protein);
          const diffCarb = Math.abs(opt.totals.carbohydrate - targets.carbohydrate);
          const diffFat = Math.abs(opt.totals.fat - targets.fat);
          const diffFib = Math.abs(opt.totals.fiber - targets.fiber);

          const comboWithinTolerances = 
            diffCal <= policy.tolerances.caloriesKcal &&
            diffProt <= policy.tolerances.proteinG &&
            diffCarb <= policy.tolerances.carbohydrateG &&
            diffFat <= policy.tolerances.fatG &&
            diffFib <= policy.tolerances.fiberG;

          if (comboWithinTolerances) {
            bestSolution = { combo, ...opt };
            earlyConverged = true;
            break outerLoop;
          }
        }
      }
    }
  }

  // 5a. Verificação de limite atingido (N3.7.5)
  // Quando o limite é atingido sem nenhuma solução parcial, bloqueamos.
  // Quando há uma solução parcial e returnBestPartial=true, retornamos com status explícito.
  // O orchestrator NUNCA persiste um resultado SEARCH_LIMIT_REACHED como prescrição validada.
  if (searchLimitReached && !bestSolution) {
    return deepFreeze({
      status: SOLVER_STATUS.SEARCH_LIMIT_REACHED,
      valid: false,
      meals: [],
      totals: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0, sodium: 0 },
      target: targets,
      differences: {
        calories: -targets.calories,
        protein: -targets.protein,
        carbohydrate: -targets.carbohydrate,
        fat: -targets.fat,
        fiber: -targets.fiber
      },
      foodProvenance: [],
      solverDiagnostics: [
        `Limite computacional atingido após ${totalCombosTested} combinações testadas.`,
        `Nenhuma solução parcial disponível para retornar.`,
        `Diagnóstico: ${searchLimitPolicy.diagnosticCode || 'SEARCH_LIMIT_REACHED'}`
      ],
      warnings: governanceWarnings,
      blockingReasons: [
        `Limite de busca combinatória (maxCombosToTest=${maxCombosToTest}) atingido sem solução disponível.`,
        'Aumente o catálogo de alimentos ou ajuste a política de busca.'
      ],
      solverVersion,
      provenance: { engine: 'NutriAxDeterministicFoodSolver', policyVersion: policy.policyVersion }
    });
  }

  // Se não foi possível gerar nenhuma solução (sem limite atingido)
  if (!bestSolution || bestSolution.portions.length === 0) {
    return deepFreeze({
      status: SOLVER_STATUS.NO_SOLUTION,
      valid: false,
      meals: [],
      totals: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0, sodium: 0 },
      target: targets,
      differences: {
        calories: -targets.calories,
        protein: -targets.protein,
        carbohydrate: -targets.carbohydrate,
        fat: -targets.fat,
        fiber: -targets.fiber
      },
      foodProvenance: [],
      solverDiagnostics: ['Impossibilidade de gerar solução com os candidatos e limites atuais.'],
      warnings: governanceWarnings,
      blockingReasons: ['Nenhuma combinação de alimentos viável dentro dos limites computacionais de busca.'],
      solverVersion,
      provenance: { engine: 'NutriAxDeterministicFoodSolver', policyVersion: policy.policyVersion }
    });
  }

  // 6. Avaliação de Tolerâncias e Status Final
  const rawTotals = bestSolution.totals;
  const diffs = {
    calories: roundTo(rawTotals.calories - targets.calories, 2),
    protein: roundTo(rawTotals.protein - targets.protein, 2),
    carbohydrate: roundTo(rawTotals.carbohydrate - targets.carbohydrate, 2),
    fat: roundTo(rawTotals.fat - targets.fat, 2),
    fiber: roundTo(rawTotals.fiber - targets.fiber, 2)
  };

  const withinTolerances = 
    Math.abs(diffs.calories) <= policy.tolerances.caloriesKcal &&
    Math.abs(diffs.protein) <= policy.tolerances.proteinG &&
    Math.abs(diffs.carbohydrate) <= policy.tolerances.carbohydrateG &&
    Math.abs(diffs.fat) <= policy.tolerances.fatG &&
    Math.abs(diffs.fiber) <= policy.tolerances.fiberG;

  const warnings = [...governanceWarnings];
  const containsReviewFood = bestSolution.combo.some(f => (f.bromatology && f.bromatology.energyStatus) === 'REVISAR');

  if (containsReviewFood) {
    warnings.push('A solução contém alimento(s) com status bromatológico REVISAR no catálogo.');
  }

  if (!withinTolerances) {
    const exceeded = [];
    if (Math.abs(diffs.calories) > policy.tolerances.caloriesKcal) {
      exceeded.push(`calorias: ${diffs.calories > 0 ? '+' : ''}${diffs.calories} kcal (tol: ±${policy.tolerances.caloriesKcal} kcal)`);
    }
    if (Math.abs(diffs.protein) > policy.tolerances.proteinG) {
      exceeded.push(`proteína: ${diffs.protein > 0 ? '+' : ''}${diffs.protein}g (tol: ±${policy.tolerances.proteinG}g)`);
    }
    if (Math.abs(diffs.carbohydrate) > policy.tolerances.carbohydrateG) {
      exceeded.push(`carboidratos: ${diffs.carbohydrate > 0 ? '+' : ''}${diffs.carbohydrate}g (tol: ±${policy.tolerances.carbohydrateG}g)`);
    }
    if (Math.abs(diffs.fat) > policy.tolerances.fatG) {
      exceeded.push(`gordura: ${diffs.fat > 0 ? '+' : ''}${diffs.fat}g (tol: ±${policy.tolerances.fatG}g)`);
    }
    if (Math.abs(diffs.fiber) > policy.tolerances.fiberG) {
      exceeded.push(`fibras: ${diffs.fiber > 0 ? '+' : ''}${diffs.fiber}g (tol: ±${policy.tolerances.fiberG}g)`);
    }
    warnings.push(`Resíduo nutricional excedeu tolerâncias de política: ${exceeded.join(', ')}.`);
  }

  // Regra Inegociável de Status:
  // - PASS: dentro das tolerâncias, zero REVISAR, zero limitações críticas.
  // - WARNING: dentro ou próximo das tolerâncias, mas contém REVISAR ou alertas não-críticos.
  // - REVISAR NUNCA PODE RESULTAR EM PASS.
  // - SEARCH_LIMIT_REACHED (N3.7.5): busca interrompida antes do espaço completo ser explorado.
  //   Mesmo que a solução parcial esteja dentro das tolerâncias, NUNCA pode ser validada como PASS
  //   porque existem combinações não-exploradas que poderiam ser superiores.
  let finalStatus;
  let isValid;

  if (searchLimitReached) {
    // N3.7.5: Resultado parcial — independentemente da qualidade da solução encontrada,
    // o status é SEARCH_LIMIT_REACHED. O orchestrator NÃO persiste como prescrição validada.
    finalStatus = SOLVER_STATUS.SEARCH_LIMIT_REACHED;
    isValid = false;
    warnings.push(
      `SEARCH_LIMIT_REACHED: busca interrompida após ${totalCombosTested} combinações ` +
      `(limite: ${maxCombosToTest}). Solução parcial retornada como diagnóstico — ` +
      `NÃO persista como prescrição clínica validada.`
    );
  } else if (withinTolerances && !containsReviewFood && warnings.length === 0) {
    finalStatus = SOLVER_STATUS.PASS;
    isValid = true;
  } else if (withinTolerances || bestSolution.cost <= 1.0) {
    finalStatus = SOLVER_STATUS.WARNING;
    isValid = true;
  } else {
    // Desvio severo sem capacidade de fechar
    finalStatus = SOLVER_STATUS.NO_SOLUTION;
    isValid = false;
  }

  // 7. Construção dos Itens de Prescrição e Proveniência
  const mealItems = [];
  const foodProvenance = [];

  for (let i = 0; i < bestSolution.combo.length; i++) {
    const food = bestSolution.combo[i];
    const rawGrams = bestSolution.portions[i];
    const displayGrams = roundTo(rawGrams, 1);
    const portionNutrients = calculateFoodPortionNutrients(food, displayGrams);

    const isReview = (food.bromatology && food.bromatology.energyStatus) === 'REVISAR';

    const item = {
      foodId: food.id,
      foodName: food.name,
      quantity: displayGrams,
      unit: food.unit || 'g',
      unitDisplay: `${displayGrams}${food.unit || 'g'}`,
      grams: displayGrams,
      nutrients: {
        calories: roundTo(portionNutrients.calories, 2),
        protein: roundTo(portionNutrients.protein, 2),
        carbohydrate: roundTo(portionNutrients.carbohydrate, 2),
        lipid: roundTo(portionNutrients.lipid, 2),
        fiber: roundTo(portionNutrients.fiber, 2),
        sodium: roundTo(portionNutrients.sodium, 2)
      },
      provenance: {
        source: food.source || 'Catálogo',
        prepState: food.prepState || null,
        conversionUsed: food.unit === 'g' ? 'DIRECT_MASS_1_TO_1' : 'FORMAL_SPECIFIC_CONVERSION'
      }
    };
    mealItems.push(item);

    foodProvenance.push({
      foodId: food.id,
      foodName: food.name,
      source: food.source || 'Catálogo',
      prepState: food.prepState || null,
      grams: displayGrams,
      unit: food.unit || 'g',
      nutrientContribution: item.nutrients,
      eligibilityStatus: isReview ? 'WARNING' : 'ELIGIBLE',
      selectionReason: `Otimizado para o papel ${assignSearchRole(food)} com minimização determinística de perda.`
    });
  }

  // Recalcular totais finais baseados nos displayGrams arredondados para consistência de apresentação
  const finalTotals = {
    calories: roundTo(mealItems.reduce((acc, it) => acc + it.nutrients.calories, 0), 2),
    protein: roundTo(mealItems.reduce((acc, it) => acc + it.nutrients.protein, 0), 2),
    carbohydrate: roundTo(mealItems.reduce((acc, it) => acc + it.nutrients.carbohydrate, 0), 2),
    fat: roundTo(mealItems.reduce((acc, it) => acc + it.nutrients.lipid, 0), 2),
    fiber: roundTo(mealItems.reduce((acc, it) => acc + it.nutrients.fiber, 0), 2),
    sodium: roundTo(mealItems.reduce((acc, it) => acc + it.nutrients.sodium, 0), 2)
  };

  const finalDifferences = {
    calories: roundTo(finalTotals.calories - targets.calories, 2),
    protein: roundTo(finalTotals.protein - targets.protein, 2),
    carbohydrate: roundTo(finalTotals.carbohydrate - targets.carbohydrate, 2),
    fat: roundTo(finalTotals.fat - targets.fat, 2),
    fiber: roundTo(finalTotals.fiber - targets.fiber, 2)
  };

  const convergenceLabel = earlyConverged
    ? 'EARLY_CONVERGED_CLINICAL_TOLERANCE'
    : (searchLimitReached ? (isValid ? 'SEARCH_LIMIT_PARTIAL_VIABLE' : 'SEARCH_LIMIT_REACHED') : 'CONVERGED');
  const solverDiagnostics = [
    `Candidatos recebidos: ${rawCatalog.length}`,
    `Candidatos elegíveis: ${eligibleFoods.length}`,
    `Candidatos reduzidos para busca: ${candidatePool.length}`,
    `Combinações testadas: ${totalCombosTested}`,
    `Limite computacional configurado: ${maxCombosToTest}`,
    `Iterações de otimização executadas: ${totalIterationsExecuted}`,
    `Custo residual final: ${roundTo(bestSolution.cost, 6)}`,
    `Convergência determinística: ${convergenceLabel}`,
    `Versão da política: ${policy.policyVersion}`
  ];

  // Bloco neutro de refeições diárias (Meal Assembly pertence a N3.3)
  const meals = [
    {
      mealName: 'Alocação Global Determinística N3.2',
      mealTime: null,
      items: mealItems,
      totals: finalTotals
    }
  ];

  const blockingReasons = [];
  if (!isValid) {
    if (searchLimitReached) {
      blockingReasons.push(
        `Limite computacional de busca atingido (${totalCombosTested}/${maxCombosToTest} combinações). ` +
        'Resultado parcial não pode ser usado como prescrição validada. ' +
        'Reduza o catálogo de candidatos ou aumente maxCombosToTest na política.'
      );
    } else {
      blockingReasons.push('A solução final não atingiu tolerâncias admissíveis.');
    }
  }

  const output = {
    status: finalStatus,
    valid: isValid,
    // searchLimitReached: campo de diagnóstico explícito para orchestrators e tests
    searchLimitReached: searchLimitReached === true,
    earlyConverged: earlyConverged === true,
    meals,
    totals: finalTotals,
    target: {
      calories: targets.calories,
      protein: targets.protein,
      carbohydrate: targets.carbohydrate,
      fat: targets.fat,
      fiber: targets.fiber
    },
    differences: finalDifferences,
    foodProvenance,
    solverDiagnostics,
    warnings,
    blockingReasons,
    solverVersion,
    provenance: {
      engine: 'NutriAxDeterministicFoodSolver',
      policyVersion: policy.policyVersion
    }
  };

  return deepFreeze(output);
}

module.exports = {
  solveNutritionDiet,
  calculateFoodPortionNutrients,
  reduceSearchCandidates
};

  });

  // ── MÓDULO: domain/solver/index.js ──
  defineModule("domain/solver/index.js", function(require, module, exports) {
/**
 * domain/solver/index.js
 * 
 * Ponto Único de Exportação do Subsistema Food Solver — NutriAx Pro.
 * Fase N3.2 — Food Solver Determinístico Canônico.
 * 
 * Camada Pura — Sem I/O de infraestrutura, sem persistência externa, sem dependências remotas.
 */

'use strict';

const foodEligibility = require('./foodEligibility');
const foodSolverPolicy = require('./foodSolverPolicy');
const foodSolver = require('./foodSolver');

const solverSubsystem = {
  // Elegibilidade
  ELIGIBILITY_STATUS: foodEligibility.ELIGIBILITY_STATUS,
  DEFAULT_ELIGIBILITY_POLICY: foodEligibility.DEFAULT_ELIGIBILITY_POLICY,
  adaptCatalogToCanonical: foodEligibility.adaptCatalogToCanonical,
  evaluateFoodEligibility: foodEligibility.evaluateFoodEligibility,
  filterEligibleFoods: foodEligibility.filterEligibleFoods,

  // Política e Funções de Perda
  SEARCH_ROLES: foodSolverPolicy.SEARCH_ROLES,
  DEFAULT_FOOD_SOLVER_POLICY: foodSolverPolicy.DEFAULT_FOOD_SOLVER_POLICY,
  normalizedNutrientError: foodSolverPolicy.normalizedNutrientError,
  calculateNutrientLoss: foodSolverPolicy.calculateNutrientLoss,
  assignSearchRole: foodSolverPolicy.assignSearchRole,

  // Motor Determinístico
  solveNutritionDiet: foodSolver.solveNutritionDiet,
  calculateFoodPortionNutrients: foodSolver.calculateFoodPortionNutrients,
  reduceSearchCandidates: foodSolver.reduceSearchCandidates,

  // Despachante Não-Bloqueante (N3.7.5)
  bridge: require('./foodSolverBridge'),
  solveNutritionDietAsync: require('./foodSolverBridge').solveNutritionDietAsync,
  solveNutritionDietSync: require('./foodSolverBridge').solveNutritionDietSync
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = solverSubsystem;
}

if (typeof globalThis !== 'undefined') {
  globalThis.NutriDomain = globalThis.NutriDomain || {};
  globalThis.NutriDomain.solver = solverSubsystem;
}

  });

  // ── MÓDULO: domain/solver/foodSolverWorker.js ──
  defineModule("domain/solver/foodSolverWorker.js", function(require, module, exports) {
/**
 * domain/solver/foodSolverWorker.js
 * 
 * Web Worker Puro para o Food Solver Canônico (N3.2).
 * NutriAx Pro — Fase N3.7.5.
 * 
 * Executa a busca combinatória de alimentos em uma thread dedicada (Web Worker)
 * para evitar qualquer bloqueio do Event Loop da UI na thread principal.
 * 
 * Sem dependências externas, sem mutação de regras clínicas.
 */

'use strict';

// Carrega o domínio canônico no escopo do Worker se disponível
if (typeof importScripts === 'function') {
  try {
    // Caminho relativo a partir de domain/solver/foodSolverWorker.js
    importScripts('../browserBridge.js');
  } catch (err1) {
    try {
      // Fallback para caminhos absolutos ou relativos à raiz
      importScripts('/domain/browserBridge.js');
    } catch (err2) {
      // Se não carregar via importScripts, o solver pode ter sido injetado
    }
  }
}

/**
 * Resolve a função solveNutritionDiet no contexto do Worker
 */
function getWorkerSolver() {
  if (typeof self !== 'undefined' && self.NutriDomain && self.NutriDomain.solver && typeof self.NutriDomain.solver.solveNutritionDiet === 'function') {
    return self.NutriDomain.solver.solveNutritionDiet;
  }
  if (typeof solveNutritionDiet === 'function') {
    return solveNutritionDiet;
  }
  if (typeof require === 'function') {
    try {
      const solverModule = require('./foodSolver');
      return solverModule.solveNutritionDiet;
    } catch (e) {}
  }
  return null;
}

/**
 * Processador central de mensagens do Worker.
 * Exportado para permitir testes determinísticos unitários em Node.js.
 */
function handleWorkerMessage(data, postMessageFn) {
  const { type, correlationId, payload } = data || {};

  if (type === 'PING') {
    postMessageFn({ type: 'PONG', correlationId, ok: true });
    return;
  }

  if (type === 'SOLVE') {
    try {
      const solver = getWorkerSolver();
      if (!solver) {
        postMessageFn({
          type: 'SOLVE_ERROR',
          correlationId,
          error: {
            code: 'SOLVER_UNAVAILABLE',
            message: 'Motor Food Solver determinístico não disponível no contexto do Worker.'
          }
        });
        return;
      }

      const { input, customPolicy } = payload || {};
      const result = solver(input, customPolicy);

      postMessageFn({
        type: 'SOLVE_SUCCESS',
        correlationId,
        result
      });
    } catch (err) {
      postMessageFn({
        type: 'SOLVE_ERROR',
        correlationId,
        error: {
          code: 'SOLVER_EXECUTION_EXCEPTION',
          message: err && err.message ? err.message : String(err),
          stack: err && err.stack ? err.stack : null
        }
      });
    }
    return;
  }

  postMessageFn({
    type: 'UNKNOWN_COMMAND',
    correlationId,
    error: {
      code: 'UNSUPPORTED_MESSAGE_TYPE',
      message: `Tipo de mensagem desconhecido: ${type}`
    }
  });
}

// Configura o listener no ambiente do Worker
if (typeof self !== 'undefined' && typeof self.addEventListener === 'function') {
  self.addEventListener('message', function(event) {
    handleWorkerMessage(event.data, function(response) {
      self.postMessage(response);
    });
  });
}

// Export para Node.js / Suíte de testes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleWorkerMessage,
    getWorkerSolver
  };
}

  });

  // ── MÓDULO: domain/solver/foodSolverBridge.js ──
  defineModule("domain/solver/foodSolverBridge.js", function(require, module, exports) {
/**
 * domain/solver/foodSolverBridge.js
 * 
 * Despachante Não-Bloqueante do Food Solver Determinístico Canônico (N3.2).
 * NutriAx Pro — Fase N3.7.5.
 * 
 * Fornece interface unificada e segura para execução assíncrona do solver:
 * - Em ambientes com Web Worker (Browser com suporte): executa fora da thread da UI.
 * - Em ambientes sem Web Worker (Node.js, SSR, ou fallback de segurança): executa
 *   de forma determinística in-process sem quebrar o fluxo.
 * - Suporta timeout configurável e cancelamento seguro.
 * 
 * Camada Pura de Domínio — Sem dependências externas de framework.
 */

'use strict';

const { solveNutritionDiet } = require('./foodSolver');

let activeWorker = null;
let pendingRequests = new Map();
let correlationCounter = 0;

/**
 * Verifica se o ambiente atual suporta Web Workers
 * @returns {boolean}
 */
function isWorkerSupported() {
  return typeof Worker !== 'undefined';
}

/**
 * Resolve a URL do worker dependendo do contexto do runtime
 * @param {string} [customUrl]
 * @returns {string}
 */
function resolveWorkerUrl(customUrl) {
  if (customUrl) return customUrl;
  if (typeof location !== 'undefined' && location.href) {
    // No ambiente do pro/index.html
    return '../domain/solver/foodSolverWorker.js';
  }
  return './foodSolverWorker.js';
}

/**
 * Inicializa ou retorna a instância do Worker compartilhado
 * @param {string} [workerUrl]
 * @returns {Worker}
 */
function getOrCreateWorker(workerUrl) {
  if (activeWorker) return activeWorker;

  const url = resolveWorkerUrl(workerUrl);
  const worker = new Worker(url);

  worker.onmessage = function(event) {
    const { type, correlationId, result, error } = event.data || {};
    const pending = pendingRequests.get(correlationId);
    if (!pending) return;

    pendingRequests.delete(correlationId);
    if (pending.timeoutTimer) {
      clearTimeout(pending.timeoutTimer);
    }

    if (type === 'SOLVE_SUCCESS') {
      pending.resolve(result);
    } else {
      const err = new Error(error?.message || 'Falha na execução do Worker do Food Solver.');
      err.code = error?.code || 'WORKER_SOLVE_FAILED';
      err.stack = error?.stack || err.stack;
      pending.reject(err);
    }
  };

  worker.onerror = function(event) {
    // Rejeita todas as requisições pendentes em caso de erro fatal do worker
    const errMsg = event && event.message ? event.message : 'Erro no Web Worker do Food Solver.';
    for (const [id, pending] of pendingRequests.entries()) {
      if (pending.timeoutTimer) clearTimeout(pending.timeoutTimer);
      const err = new Error(errMsg);
      err.code = 'WORKER_FATAL_ERROR';
      pending.reject(err);
    }
    pendingRequests.clear();
    activeWorker = null;
  };

  activeWorker = worker;
  return activeWorker;
}

/**
 * Encerra o worker ativo e cancela todas as requisições pendentes
 */
function terminateWorker() {
  if (activeWorker) {
    try {
      activeWorker.terminate();
    } catch (e) {}
    activeWorker = null;
  }
  for (const [id, pending] of pendingRequests.entries()) {
    if (pending.timeoutTimer) clearTimeout(pending.timeoutTimer);
    const err = new Error('Operação do Food Solver cancelada: Worker encerrado.');
    err.code = 'WORKER_TERMINATED';
    pending.reject(err);
  }
  pendingRequests.clear();
}

/**
 * Executa o solver de forma síncrona diretamente (in-process).
 * Útil para testes em Node.js ou quando o consumidor exige retorno imediato.
 * 
 * @param {Object} input - DTO de entrada do solver
 * @param {Object} [customPolicy] - Política customizada opcional
 * @returns {Object} FoodSolverResultDTO
 */
function solveNutritionDietSync(input, customPolicy = {}) {
  return solveNutritionDiet(input, customPolicy);
}

/**
 * Executa o solver de forma assíncrona, usando Web Worker quando disponível
 * ou agendamento não-bloqueante in-process como fallback seguro.
 * 
 * @param {Object} input - DTO de entrada do solver
 * @param {Object} [customPolicy] - Política customizada opcional
 * @param {Object} [options] - Opções de execução ({ timeoutMs, preferWorker, workerUrl, fallbackOnTimeout })
 * @returns {Promise<Object>} Promessa resolvida com FoodSolverResultDTO
 */
async function solveNutritionDietAsync(input, customPolicy = {}, options = {}) {
  const timeoutMs = typeof options.timeoutMs === 'number' && options.timeoutMs > 0
    ? options.timeoutMs
    : 10000;
  const preferWorker = options.preferWorker !== false;
  const fallbackOnTimeout = options.fallbackOnTimeout !== false;

  // Se não estiver no browser ou se worker não for preferido / suportado:
  if (!preferWorker || !isWorkerSupported()) {
    return new Promise((resolve, reject) => {
      // Usa setImmediate (Node) ou setTimeout (Browser) para descolar da pilha atual
      const schedule = typeof setImmediate === 'function' ? setImmediate : (fn) => setTimeout(fn, 0);
      schedule(() => {
        try {
          const result = solveNutritionDiet(input, customPolicy);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  // No Browser com suporte a Web Worker:
  return new Promise((resolve, reject) => {
    let worker;
    try {
      worker = getOrCreateWorker(options.workerUrl);
    } catch (createErr) {
      // Fallback seguro se new Worker falhar (ex: restrição de file:// ou CSP)
      console.warn('[foodSolverBridge] Falha ao instanciar Web Worker, usando execução síncrona controlada:', createErr.message);
      try {
        const result = solveNutritionDiet(input, customPolicy);
        return resolve(result);
      } catch (syncErr) {
        return reject(syncErr);
      }
    }

    const correlationId = `solver_req_${++correlationCounter}`;

    const timeoutTimer = setTimeout(() => {
      pendingRequests.delete(correlationId);
      // Se houver timeout do worker, recria o worker para limpar estado
      terminateWorker();

      if (fallbackOnTimeout) {
        console.warn(`[foodSolverBridge] Timeout do Worker (${timeoutMs}ms) atingido. Executando fallback controlado.`);
        try {
          const fallbackResult = solveNutritionDiet(input, customPolicy);
          resolve(fallbackResult);
        } catch (fbErr) {
          reject(fbErr);
        }
      } else {
        const timeoutErr = new Error(`Tempo limite de busca do Food Solver atingido (${timeoutMs}ms).`);
        timeoutErr.code = 'WORKER_TIMEOUT';
        reject(timeoutErr);
      }
    }, timeoutMs);

    pendingRequests.set(correlationId, {
      resolve,
      reject,
      timeoutTimer
    });

    try {
      worker.postMessage({
        type: 'SOLVE',
        correlationId,
        payload: {
          input,
          customPolicy
        }
      });
    } catch (postErr) {
      clearTimeout(timeoutTimer);
      pendingRequests.delete(correlationId);
      // Fallback imediato se o postMessage falhar
      try {
        const result = solveNutritionDiet(input, customPolicy);
        resolve(result);
      } catch (fbErr) {
        reject(fbErr);
      }
    }
  });
}

const foodSolverBridge = {
  isWorkerSupported,
  getOrCreateWorker,
  terminateWorker,
  solveNutritionDietSync,
  solveNutritionDietAsync
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = foodSolverBridge;
}

if (typeof globalThis !== 'undefined') {
  globalThis.NutriDomain = globalThis.NutriDomain || {};
  globalThis.NutriDomain.solverBridge = foodSolverBridge;
}

  });

  // ── MÓDULO: domain/meal/mealAssemblyPolicy.js ──
  defineModule("domain/meal/mealAssemblyPolicy.js", function(require, module, exports) {
/**
 * domain/meal/mealAssemblyPolicy.js
 * 
 * Política de Montagem e Distribuição de Refeições — NutriAx Pro.
 * Fase N3.3 — Meal Assembly Determinístico Canônico.
 * 
 * Camada Pura — Sem I/O, sem UI, sem termos clínicos/temporais.
 */

'use strict';

const MealAssemblyContract = require('../contracts/MealAssemblyContract');
const { MEAL_ROLES, deepFreeze } = MealAssemblyContract;

/**
 * Papéis computacionais padronizados por número de refeições (M de 1 a 8)
 */
const ROLE_ARCHETYPES = Object.freeze({
  1: Object.freeze([MEAL_ROLES.PRIMARY]),
  2: Object.freeze([MEAL_ROLES.PRIMARY, MEAL_ROLES.PRIMARY]),
  3: Object.freeze([MEAL_ROLES.PRIMARY, MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY]),
  4: Object.freeze([MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY]),
  5: Object.freeze([MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.SNACK]),
  6: Object.freeze([MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.SNACK, MEAL_ROLES.FLEXIBLE]),
  7: Object.freeze([MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.SNACK, MEAL_ROLES.FLEXIBLE, MEAL_ROLES.FLEXIBLE]),
  8: Object.freeze([MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.PRIMARY, MEAL_ROLES.SECONDARY, MEAL_ROLES.SNACK, MEAL_ROLES.SNACK, MEAL_ROLES.FLEXIBLE, MEAL_ROLES.FLEXIBLE])
});

/**
 * Pesos computacionais dos papéis para cálculo de meta relativa por refeição
 */
const ROLE_ENERGY_WEIGHTS = Object.freeze({
  [MEAL_ROLES.PRIMARY]: 1.25,
  [MEAL_ROLES.SECONDARY]: 0.85,
  [MEAL_ROLES.SNACK]: 0.50,
  [MEAL_ROLES.FLEXIBLE]: 0.70
});

/**
 * Escalas de referência para normalização segura contra divisão por zero
 */
const FALLBACK_SCALES = Object.freeze({
  calories: 100.0,
  protein: 10.0,
  carbohydrate: 10.0,
  fat: 5.0,
  fiber: 5.0
});

/**
 * Política padrão de montagem determinística de refeições
 */
const DEFAULT_MEAL_ASSEMBLY_POLICY = Object.freeze({
  policyVersion: '1.0.0',
  assemblyVersion: 'N3.3.0',

  // Limites computacionais de refeições diárias
  defaultMealCount: 3,
  minMealCount: 1,
  maxMealCount: 8,

  /**
   * Critério operacional de preferência para evitar fragmentação excessiva de alimentos.
   * Não constitui limite clínico ou fisiológico.
   */
  minimumPreferredSplitMass: 80.0,

  /**
   * Limite máximo de fragmentações por item (um item é colocado em no máximo 2 refeições)
   */
  maxSplitsPerItem: 2,

  /**
   * Pesos da função de custo de assembly:
   * J = w_cal * E_cal + w_prot * E_prot + w_carb * E_carb + w_fat * E_fat + w_frag * N_splits
   */
  weights: Object.freeze({
    w_cal: 1.0,
    w_prot: 1.5,
    w_carb: 1.0,
    w_fat: 1.2,
    w_frag: 0.5
  }),

  /**
   * Tolerância de conservação numérica (flutuante residual máximo)
   */
  tolerances: Object.freeze({
    massGram: 0.01,
    caloriesKcal: 0.05,
    macronutrientGram: 0.05
  }),

  /**
   * Ordem estóica e determinística de desempate de distribuições
   */
  tieBreakOrder: Object.freeze([
    'LOWEST_COST',
    'FEWEST_SPLITS',
    'LEXICOGRAPHICAL_ALLOCATION'
  ])
});

/**
 * Resolve determinística e estruturadamente o número de refeições do paciente
 * @param {Object} context Contexto nutricional canônico
 * @param {Object} [policy] Política de assembly
 * @returns {{ mealCount: number, isFromContext: boolean, warning: string|null }}
 */
function resolveMealCount(context, policy = DEFAULT_MEAL_ASSEMBLY_POLICY) {
  const minM = policy.minMealCount || 1;
  const maxM = policy.maxMealCount || 8;
  const defaultM = policy.defaultMealCount || 3;

  if (context && typeof context === 'object') {
    // Busca em propriedades estruturadas canônicas de rotina
    const candidates = [
      context.patient && context.patient.routine && context.patient.routine.mealsPerDay,
      context.patient && context.patient.routine && context.patient.routine.mealCount,
      context.routine && context.routine.mealsPerDay,
      context.routine && context.routine.mealCount,
      context.preferences && context.preferences.mealFrequency,
      context.options && context.options.mealCount,
      context.options && context.options.mealsPerDay,
      context.mealsPerDay,
      context.mealCount
    ];

    for (let i = 0; i < candidates.length; i++) {
      const val = candidates[i];
      if (typeof val === 'number' && Number.isInteger(val) && val >= minM && val <= maxM) {
        return {
          mealCount: val,
          isFromContext: true,
          warning: null
        };
      }
    }
  }

  // Fallback operacional documentado
  return {
    mealCount: defaultM,
    isFromContext: false,
    warning: `Número formal de refeições ausente ou inválido no contexto. Utilizado fallback computacional versionado de política (${defaultM} refeições).`
  };
}

/**
 * Retorna os papéis computacionais para uma dada quantidade de refeições M
 * @param {number} mealCount 
 * @returns {Array<string>}
 */
function resolveMealRoles(mealCount) {
  const m = Math.max(1, Math.min(8, Math.round(mealCount)));
  return ROLE_ARCHETYPES[m] || new Array(m).fill(MEAL_ROLES.PRIMARY);
}

/**
 * Calcula as frações relativas alvo de nutrientes para cada refeição com base nos papéis
 * @param {Array<string>} roles 
 * @returns {Array<number>} Proporções que somam 1.0
 */
function calculateTargetRatios(roles) {
  const weights = roles.map((r) => ROLE_ENERGY_WEIGHTS[r] || 1.0);
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  if (totalWeight <= 0) {
    return roles.map(() => 1 / roles.length);
  }
  return weights.map((w) => w / totalWeight);
}

/**
 * Calcula o custo determinístico de uma configuração de refeições:
 * J = w_cal * E_cal + w_prot * E_prot + w_carb * E_carb + w_fat * E_fat + w_frag * N_splits
 * 
 * @param {Array<Object>} mealTotals Totais atuais calculados de cada refeição
 * @param {Object} globalTotals Totais globais fornecidos pelo N3.2
 * @param {Array<number>} targetRatios Frações alvo por refeição
 * @param {Object} weights Pesos da função de custo
 * @param {number} totalSplits Número total de fragmentações realizadas
 * @returns {{ totalCost: number, eCal: number, eProt: number, eCarb: number, eFat: number, splitPenalty: number }}
 */
function calculateAssemblyCost(mealTotals, globalTotals, targetRatios, weights = DEFAULT_MEAL_ASSEMBLY_POLICY.weights, totalSplits = 0) {
  const m = mealTotals.length;
  if (m <= 1) {
    return { totalCost: 0, eCal: 0, eProt: 0, eCarb: 0, eFat: 0, splitPenalty: 0 };
  }

  const nutrients = [
    { key: 'calories', targetKey: 'calories', w: weights.w_cal, scale: FALLBACK_SCALES.calories },
    { key: 'protein', targetKey: 'protein', w: weights.w_prot, scale: FALLBACK_SCALES.protein },
    { key: 'carbohydrate', targetKey: 'carbohydrate', w: weights.w_carb, scale: FALLBACK_SCALES.carbohydrate },
    { key: 'lipid', targetKey: 'fat', w: weights.w_fat, scale: FALLBACK_SCALES.fat }
  ];

  let nutrientErrorTotal = 0;
  const errors = {};

  nutrients.forEach((n) => {
    const globalTotal = globalTotals[n.targetKey] !== undefined ? globalTotals[n.targetKey] : (globalTotals[n.key] || 0);
    let sumSquaredError = 0;

    for (let i = 0; i < m; i++) {
      const mealActual = mealTotals[i] ? (mealTotals[i][n.key] || 0) : 0;
      const mealExpected = globalTotal * targetRatios[i];
      const delta = mealActual - mealExpected;
      const divisor = mealExpected > 1e-4 ? mealExpected : n.scale;
      const normalizedErr = delta / divisor;
      sumSquaredError += normalizedErr * normalizedErr;
    }

    const meanSquaredErr = sumSquaredError / m;
    errors[n.key] = meanSquaredErr;
    nutrientErrorTotal += n.w * meanSquaredErr;
  });

  const splitPenalty = (weights.w_frag || 0) * totalSplits;
  const totalCost = nutrientErrorTotal + splitPenalty;

  return {
    totalCost,
    eCal: errors.calories || 0,
    eProt: errors.protein || 0,
    eCarb: errors.carbohydrate || 0,
    eFat: errors.lipid || 0,
    splitPenalty
  };
}

module.exports = deepFreeze({
  ROLE_ARCHETYPES,
  ROLE_ENERGY_WEIGHTS,
  FALLBACK_SCALES,
  DEFAULT_MEAL_ASSEMBLY_POLICY,
  resolveMealCount,
  resolveMealRoles,
  calculateTargetRatios,
  calculateAssemblyCost
});

  });

  // ── MÓDULO: domain/meal/mealAssemblyValidator.js ──
  defineModule("domain/meal/mealAssemblyValidator.js", function(require, module, exports) {
/**
 * domain/meal/mealAssemblyValidator.js
 * 
 * Validador Canônico de Conservação e Integridade de Refeições — NutriAx Pro.
 * Fase N3.3 — Meal Assembly Determinístico Canônico.
 * 
 * Camada Pura — Sem I/O, sem UI, sem termos clínicos/temporais.
 */

'use strict';

const MealAssemblyContract = require('../contracts/MealAssemblyContract');
const { deepFreeze } = MealAssemblyContract;

/**
 * Arredonda valor para número fixo de casas decimais
 * @param {number} val 
 * @param {number} decimals 
 * @returns {number}
 */
function roundTo(val, decimals = 2) {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 0;
  const factor = 10 ** decimals;
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Valida integralmente as invariantes de conservação e estrutura do Meal Assembly
 * 
 * @param {Object} output Saída proposta do Meal Assembly (ou dados estruturados de refeições)
 * @param {Array<Object>} sourceItems Itens canônicos originais produzidos pelo N3.2
 * @param {Object} globalSourceTotals Totais nutricionais originais do N3.2
 * @param {Object} [options] Opções de tolerância
 * @returns {{ isValid: boolean, isBlocked: boolean, errors: string[], warnings: string[], diagnostics: string[] }}
 */
function validateMealAssembly(output, sourceItems, globalSourceTotals, options = {}) {
  const errors = [];
  const warnings = [];
  const diagnostics = [];

  const massTolerance = options.massTolerance !== undefined ? options.massTolerance : 0.05;
  const energyTolerance = options.energyTolerance !== undefined ? options.energyTolerance : 0.10;
  const macroTolerance = options.macroTolerance !== undefined ? options.macroTolerance : 0.10;

  if (!output || typeof output !== 'object') {
    return {
      isValid: false,
      isBlocked: true,
      errors: ['Saída de Meal Assembly nula ou inválida.'],
      warnings: [],
      diagnostics: []
    };
  }

  const meals = Array.isArray(output.meals) ? output.meals : [];
  if (meals.length === 0) {
    return {
      isValid: false,
      isBlocked: true,
      errors: ['O array de refeições gerado está vazio.'],
      warnings: [],
      diagnostics: []
    };
  }

  // 1. Estrutura de Refeições e Índices Únicos
  const seenMealIndices = new Set();
  const seenMealIds = new Set();

  for (let m = 0; m < meals.length; m++) {
    const meal = meals[m];
    if (!meal || typeof meal !== 'object') {
      errors.push(`Refeição no índice ${m} é nula ou inválida.`);
      continue;
    }

    if (typeof meal.mealIndex !== 'number' || !Number.isInteger(meal.mealIndex) || meal.mealIndex < 0) {
      errors.push(`Refeição no índice ${m} possui mealIndex inválido (${meal.mealIndex}).`);
    } else if (seenMealIndices.has(meal.mealIndex)) {
      errors.push(`mealIndex duplicado detectado: ${meal.mealIndex}.`);
    } else {
      seenMealIndices.add(meal.mealIndex);
    }

    if (!meal.mealId || typeof meal.mealId !== 'string') {
      errors.push(`Refeição no índice ${m} possui mealId inválido.`);
    } else if (seenMealIds.has(meal.mealId)) {
      errors.push(`mealId duplicado detectado: ${meal.mealId}.`);
    } else {
      seenMealIds.add(meal.mealId);
    }

    if (!meal.mealRole || typeof meal.mealRole !== 'string') {
      errors.push(`Refeição '${meal.mealId || m}' não possui mealRole definido.`);
    }

    if (!Array.isArray(meal.items)) {
      errors.push(`Refeição '${meal.mealId || m}' possui items inválido (não é array).`);
    }
  }

  // 2. Mapeamento de Itens Fonte do N3.2
  const sourceItemsMap = new Map();
  const sourceIdsSet = new Set();

  for (let i = 0; i < sourceItems.length; i++) {
    const sItem = sourceItems[i];
    sourceItemsMap.set(sItem.foodId, sItem);
    sourceIdsSet.add(sItem.foodId);
  }

  // 3. Verificação de Alimentos Alocados
  const allocatedMassByFoodId = new Map();
  const allocatedFoodIds = new Set();

  let totalAllocatedCalories = 0;
  let totalAllocatedProtein = 0;
  let totalAllocatedCarb = 0;
  let totalAllocatedFat = 0;
  let totalAllocatedFiber = 0;
  let totalAllocatedSodium = 0;

  let allSourceItemsHaveSodium = true;
  for (let i = 0; i < sourceItems.length; i++) {
    if (sourceItems[i].nutrients.sodium === null || sourceItems[i].nutrients.sodium === undefined) {
      allSourceItemsHaveSodium = false;
      break;
    }
  }

  for (let m = 0; m < meals.length; m++) {
    const meal = meals[m];
    const items = Array.isArray(meal.items) ? meal.items : [];
    const itemsInThisMeal = new Set();

    let mealCal = 0;
    let mealProt = 0;
    let mealCarb = 0;
    let mealFat = 0;
    let mealFib = 0;
    let mealSod = 0;
    let mealHasUnknownSodium = false;

    for (let j = 0; j < items.length; j++) {
      const it = items[j];
      if (!it || typeof it !== 'object') {
        errors.push(`Item de índice ${j} na refeição '${meal.mealId}' é inválido.`);
        continue;
      }

      // Proibição de duplicação indevida na MESMA refeição
      if (itemsInThisMeal.has(it.foodId)) {
        errors.push(`Alimento '${it.foodId}' duplicado indevidamente na mesma refeição '${meal.mealId}'.`);
      }
      itemsInThisMeal.add(it.foodId);

      // Nenhum foodId inventado ou desconhecido
      if (!sourceIdsSet.has(it.foodId)) {
        errors.push(`Alimento desconhecido '${it.foodId}' encontrado na refeição '${meal.mealId}'. Alimentos novos são proibidos no Meal Assembly.`);
      }

      // Nenhuma quantidade <= 0
      if (typeof it.grams !== 'number' || !Number.isFinite(it.grams) || it.grams <= 0) {
        errors.push(`Alimento '${it.foodId}' na refeição '${meal.mealId}' possui massa inválida ou <= 0 (${it.grams}).`);
      } else {
        const currentMass = allocatedMassByFoodId.get(it.foodId) || 0;
        allocatedMassByFoodId.set(it.foodId, currentMass + it.grams);
      }

      allocatedFoodIds.add(it.foodId);

      // Agregação de nutrientes
      const nut = it.nutrients || {};
      mealCal += (nut.calories || 0);
      mealProt += (nut.protein || 0);
      mealCarb += (nut.carbohydrate || 0);
      mealFat += (nut.lipid !== undefined ? nut.lipid : (nut.fat || 0));
      mealFib += (nut.fiber || 0);

      if (nut.sodium === null || nut.sodium === undefined) {
        mealHasUnknownSodium = true;
      } else {
        mealSod += nut.sodium;
      }
    }

    // Validação de coerência dos totais da refeição
    const mealTotals = meal.totals || {};
    if (Math.abs((mealTotals.calories || 0) - mealCal) > energyTolerance) {
      errors.push(`Refeição '${meal.mealId}': total de calorias declarado (${mealTotals.calories}) difere da soma dos itens (${roundTo(mealCal, 2)}).`);
    }
    if (Math.abs((mealTotals.protein || 0) - mealProt) > macroTolerance) {
      errors.push(`Refeição '${meal.mealId}': total de proteína declarado (${mealTotals.protein}) difere da soma dos itens (${roundTo(mealProt, 2)}).`);
    }

    totalAllocatedCalories += mealCal;
    totalAllocatedProtein += mealProt;
    totalAllocatedCarb += mealCarb;
    totalAllocatedFat += mealFat;
    totalAllocatedFiber += mealFib;
    if (!mealHasUnknownSodium) {
      totalAllocatedSodium += mealSod;
    }
  }

  // 4. Invariante Obrigatória: Nenhum alimento perdido
  sourceIdsSet.forEach((srcId) => {
    if (!allocatedFoodIds.has(srcId)) {
      errors.push(`Alimento '${srcId}' da solução global N3.2 foi perdido e não alocado em nenhuma refeição.`);
    }
  });

  // 5. Invariante Obrigatória: Conservação exata de massa por foodId
  sourceItems.forEach((src) => {
    const allocatedMass = allocatedMassByFoodId.get(src.foodId) || 0;
    const diffMass = Math.abs(allocatedMass - src.grams);
    if (diffMass > massTolerance) {
      errors.push(`Quebra de conservação de massa no alimento '${src.foodId}': N3.2 forneceu ${src.grams} g, mas refeições somaram ${roundTo(allocatedMass, 2)} g (diff: ${roundTo(diffMass, 3)} g).`);
    }
  });

  // 6. Invariante Obrigatória: Conservação Global de Energia e Macronutrientes
  const sourceCal = globalSourceTotals.calories !== undefined ? globalSourceTotals.calories : 0;
  const sourceProt = globalSourceTotals.protein !== undefined ? globalSourceTotals.protein : 0;
  const sourceCarb = globalSourceTotals.carbohydrate !== undefined ? globalSourceTotals.carbohydrate : 0;
  const sourceFat = globalSourceTotals.fat !== undefined ? globalSourceTotals.fat : (globalSourceTotals.lipid || 0);
  const sourceFib = globalSourceTotals.fiber !== undefined ? globalSourceTotals.fiber : 0;

  const diffCal = Math.abs(totalAllocatedCalories - sourceCal);
  if (diffCal > energyTolerance) {
    errors.push(`Quebra de conservação global de energia: N3.2 forneceu ${sourceCal} kcal, refeições somaram ${roundTo(totalAllocatedCalories, 2)} kcal (diff: ${roundTo(diffCal, 2)} kcal).`);
  }

  const diffProt = Math.abs(totalAllocatedProtein - sourceProt);
  if (diffProt > macroTolerance) {
    errors.push(`Quebra de conservação global de proteína: N3.2 forneceu ${sourceProt} g, refeições somaram ${roundTo(totalAllocatedProtein, 2)} g.`);
  }

  const diffCarb = Math.abs(totalAllocatedCarb - sourceCarb);
  if (diffCarb > macroTolerance) {
    errors.push(`Quebra de conservação global de carboidratos: N3.2 forneceu ${sourceCarb} g, refeições somaram ${roundTo(totalAllocatedCarb, 2)} g.`);
  }

  const diffFat = Math.abs(totalAllocatedFat - sourceFat);
  if (diffFat > macroTolerance) {
    errors.push(`Quebra de conservação global de lipídios: N3.2 forneceu ${sourceFat} g, refeições somaram ${roundTo(totalAllocatedFat, 2)} g.`);
  }

  const diffFib = Math.abs(totalAllocatedFiber - sourceFib);
  if (diffFib > macroTolerance) {
    errors.push(`Quebra de conservação global de fibras: N3.2 forneceu ${sourceFib} g, refeições somaram ${roundTo(totalAllocatedFiber, 2)} g.`);
  }

  // 7. Conservação de Sódio ou Diagnóstico de Dados Ausentes
  if (allSourceItemsHaveSodium) {
    const sourceSod = globalSourceTotals.sodium !== undefined ? globalSourceTotals.sodium : 0;
    const diffSod = Math.abs(totalAllocatedSodium - sourceSod);
    if (diffSod > 1.0) {
      errors.push(`Quebra de conservação global de sódio: N3.2 forneceu ${sourceSod} mg, refeições somaram ${roundTo(totalAllocatedSodium, 2)} mg.`);
    }
  } else {
    diagnostics.push('SODIUM_DATA_INCOMPLETE: Um ou mais alimentos não possuem dados de sódio cadastrados. O valor não foi fabricado e a conservação global de sódio foi preservada como indeterminada.');
  }

  return deepFreeze({
    isValid: errors.length === 0,
    isBlocked: errors.length > 0,
    errors,
    warnings,
    diagnostics
  });
}

module.exports = deepFreeze({
  roundTo,
  validateMealAssembly
});

  });

  // ── MÓDULO: domain/meal/mealAssembly.js ──
  defineModule("domain/meal/mealAssembly.js", function(require, module, exports) {
/**
 * domain/meal/mealAssembly.js
 * 
 * Motor de Montagem e Agrupamento Determinístico de Refeições — NutriAx Pro.
 * Fase N3.3 — Meal Assembly Determinístico Canônico.
 * 
 * Camada Pura — Sem I/O, sem UI, sem termos clínicos/temporais.
 */

'use strict';

const MealAssemblyContract = require('../contracts/MealAssemblyContract');
const {
  ASSEMBLY_STATUS,
  deepFreeze,
  extractGlobalSolutionItems,
  validateMealAssemblyInput
} = MealAssemblyContract;

const mealAssemblyPolicy = require('./mealAssemblyPolicy');
const {
  DEFAULT_MEAL_ASSEMBLY_POLICY,
  resolveMealCount,
  resolveMealRoles,
  calculateTargetRatios,
  calculateAssemblyCost
} = mealAssemblyPolicy;

const mealAssemblyValidator = require('./mealAssemblyValidator');
const { roundTo, validateMealAssembly } = mealAssemblyValidator;

/**
 * Cria fatias determinísticas de um item e distribui conservando exatamente a massa e os nutrientes
 * @param {Object} item Item global original
 * @param {Array<{ mealIndex: number, ratio: number }>} allocations Alocações do item
 * @returns {Array<{ mealIndex: number, mealItem: Object }>}
 */
function createSlicesForItem(item, allocations) {
  const totalGrams = item.grams;
  const S = allocations.length;
  const slices = [];

  let allocatedGramsSum = 0;
  let allocatedCalSum = 0;
  let allocatedProtSum = 0;
  let allocatedCarbSum = 0;
  let allocatedFatSum = 0;
  let allocatedFibSum = 0;
  let allocatedSodSum = 0;

  const srcNut = item.nutrients || {};
  const hasSodium = srcNut.sodium !== null && srcNut.sodium !== undefined && typeof srcNut.sodium === 'number' && Number.isFinite(srcNut.sodium);

  for (let s = 0; s < S; s++) {
    const alloc = allocations[s];
    const isLast = (s === S - 1);

    let sliceGrams;
    if (!isLast) {
      sliceGrams = roundTo(totalGrams * alloc.ratio, 1);
      allocatedGramsSum += sliceGrams;
    } else {
      // A última fatia absorve exatamente qualquer resíduo de massa
      sliceGrams = roundTo(totalGrams - allocatedGramsSum, 1);
    }

    const actualRatio = totalGrams > 0 ? (sliceGrams / totalGrams) : (1 / S);

    let sliceCal, sliceProt, sliceCarb, sliceFat, sliceFib, sliceSod;

    if (!isLast) {
      sliceCal = roundTo((srcNut.calories || 0) * actualRatio, 2);
      sliceProt = roundTo((srcNut.protein || 0) * actualRatio, 2);
      sliceCarb = roundTo((srcNut.carbohydrate || 0) * actualRatio, 2);
      sliceFat = roundTo((srcNut.lipid !== undefined ? srcNut.lipid : (srcNut.fat || 0)) * actualRatio, 2);
      sliceFib = roundTo((srcNut.fiber || 0) * actualRatio, 2);

      allocatedCalSum += sliceCal;
      allocatedProtSum += sliceProt;
      allocatedCarbSum += sliceCarb;
      allocatedFatSum += sliceFat;
      allocatedFibSum += sliceFib;

      if (hasSodium) {
        sliceSod = roundTo(srcNut.sodium * actualRatio, 2);
        allocatedSodSum += sliceSod;
      } else {
        sliceSod = null;
      }
    } else {
      // A última fatia absorve exatamente qualquer resíduo nutricional
      sliceCal = roundTo((srcNut.calories || 0) - allocatedCalSum, 2);
      sliceProt = roundTo((srcNut.protein || 0) - allocatedProtSum, 2);
      sliceCarb = roundTo((srcNut.carbohydrate || 0) - allocatedCarbSum, 2);
      sliceFat = roundTo((srcNut.lipid !== undefined ? srcNut.lipid : (srcNut.fat || 0)) - allocatedFatSum, 2);
      sliceFib = roundTo((srcNut.fiber || 0) - allocatedFibSum, 2);

      if (hasSodium) {
        sliceSod = roundTo(srcNut.sodium - allocatedSodSum, 2);
      } else {
        sliceSod = null;
      }
    }

    const mealItem = {
      foodId: item.foodId,
      foodName: item.foodName,
      grams: sliceGrams,
      unit: item.unit || 'g',
      nutrients: {
        calories: sliceCal,
        protein: sliceProt,
        carbohydrate: sliceCarb,
        lipid: sliceFat,
        fiber: sliceFib,
        sodium: sliceSod
      },
      sourceMealSolution: 'N3.2_GLOBAL',
      allocationRatio: roundTo(actualRatio, 4),
      provenance: item.provenance || null
    };

    slices.push({
      mealIndex: alloc.mealIndex,
      mealItem
    });
  }

  return slices;
}

/**
 * Monta deterministicamente o conjunto canônico de refeições a partir da solução global do N3.2
 * 
 * @param {Object} input Contrato de Entrada MealAssemblyInputDTO
 * @param {Object} [customPolicy] Política customizada opcional
 * @returns {Object} MealAssemblyOutputDTO profundamente congelado
 */
function assembleMeals(input, customPolicy = {}) {
  const policy = {
    ...DEFAULT_MEAL_ASSEMBLY_POLICY,
    ...customPolicy,
    weights: { ...DEFAULT_MEAL_ASSEMBLY_POLICY.weights, ...(customPolicy.weights || {}) },
    tolerances: { ...DEFAULT_MEAL_ASSEMBLY_POLICY.tolerances, ...(customPolicy.tolerances || {}) }
  };

  const assemblyVersion = policy.assemblyVersion || 'N3.3.0';
  const solverVersion = (input && input.foodSolverResult && input.foodSolverResult.solverVersion) || 'N3.2.0';

  // 1. Portão de Validação do Contrato de Entrada
  const inputValidation = validateMealAssemblyInput(input);

  if (!inputValidation.isValid) {
    const isNoSolution = inputValidation.isNoSolution;
    const status = isNoSolution ? ASSEMBLY_STATUS.NO_SOLUTION : ASSEMBLY_STATUS.BLOCKED;

    return deepFreeze({
      assemblyVersion,
      solverVersion,
      status,
      valid: false,
      meals: [],
      globalTotals: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0, sodium: null },
      diagnostics: ['Execução bloqueada pelo portão de validação de entrada.'],
      warnings: [],
      blockingReasons: inputValidation.errors,
      provenance: {
        engine: 'NutriAxDeterministicMealAssembly',
        policyVersion: policy.policyVersion
      }
    });
  }

  // 2. Extração Canônica dos Itens N3.2
  const sourceItems = extractGlobalSolutionItems(input.foodSolverResult);
  const solverStatus = input.foodSolverResult.status;
  const solverWarnings = Array.isArray(input.foodSolverResult.warnings) ? [...input.foodSolverResult.warnings] : [];

  // 3. Resolução de Refeições e Papéis
  const contextForResolution = {
    ...(input.context || {}),
    ...(input.options ? { options: input.options } : {})
  };
  const { mealCount, isFromContext, warning: countWarning } = resolveMealCount(contextForResolution, policy);
  const warnings = [...solverWarnings];
  if (countWarning) {
    warnings.push(countWarning);
  }

  const roles = resolveMealRoles(mealCount);
  const targetRatios = calculateTargetRatios(roles);

  // Totais globais da solução N3.2
  const globalTotals = {
    calories: roundTo(sourceItems.reduce((acc, it) => acc + (it.nutrients.calories || 0), 0), 2),
    protein: roundTo(sourceItems.reduce((acc, it) => acc + (it.nutrients.protein || 0), 0), 2),
    carbohydrate: roundTo(sourceItems.reduce((acc, it) => acc + (it.nutrients.carbohydrate || 0), 0), 2),
    fat: roundTo(sourceItems.reduce((acc, it) => acc + (it.nutrients.lipid !== undefined ? it.nutrients.lipid : (it.nutrients.fat || 0)), 0), 2),
    fiber: roundTo(sourceItems.reduce((acc, it) => acc + (it.nutrients.fiber || 0), 0), 2),
    sodium: null
  };

  const allHaveSodium = sourceItems.every(it => it.nutrients && it.nutrients.sodium !== null && it.nutrients.sodium !== undefined);
  if (allHaveSodium) {
    globalTotals.sodium = roundTo(sourceItems.reduce((acc, it) => acc + it.nutrients.sodium, 0), 2);
  }

  // 4. Algoritmo Determinístico de Distribuição (Bounded Pattern Assembly)
  // Cria cópia ordenada canônica dos itens para garantir invariância à ordem de entrada
  const sortedItems = [...sourceItems].sort((a, b) => {
    if (Math.abs(b.grams - a.grams) > 1e-4) {
      return b.grams - a.grams; // Mais pesados primeiro
    }
    return String(a.foodId).localeCompare(String(b.foodId)); // Desempate lexicográfico estável
  });

  // Estruturas de trabalho para refeições
  const workingMeals = [];
  for (let m = 0; m < mealCount; m++) {
    workingMeals.push({
      mealId: `meal_${m + 1}`,
      mealName: `Refeição ${m + 1}`,
      mealIndex: m,
      mealRole: roles[m],
      items: [],
      totals: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0, sodium: allHaveSodium ? 0 : null }
    });
  }

  // Identifica índices de refeições candidatas para receber divisões
  const allMealIndices = [];
  for (let m = 0; m < mealCount; m++) {
    allMealIndices.push(m);
  }
  const splitCandidateMeals = allMealIndices.length >= 2 ? allMealIndices : [0];

  let totalSplitsCount = 0;

  // Função auxiliar para recalcular totais de refeições de trabalho
  function getWorkingTotals(mealsArr) {
    return mealsArr.map(m => ({
      calories: m.items.reduce((acc, it) => acc + (it.nutrients.calories || 0), 0),
      protein: m.items.reduce((acc, it) => acc + (it.nutrients.protein || 0), 0),
      carbohydrate: m.items.reduce((acc, it) => acc + (it.nutrients.carbohydrate || 0), 0),
      lipid: m.items.reduce((acc, it) => acc + (it.nutrients.lipid !== undefined ? it.nutrients.lipid : (it.nutrients.fat || 0)), 0),
      fiber: m.items.reduce((acc, it) => acc + (it.nutrients.fiber || 0), 0)
    }));
  }

  // Alocação gulosa determinística com teste de fragmentação bounded
  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i];

    // Se só há 1 refeição, tudo vai para ela sem dividir
    if (mealCount === 1) {
      const slices = createSlicesForItem(item, [{ mealIndex: 0, ratio: 1.0 }]);
      workingMeals[0].items.push(slices[0].mealItem);
      continue;
    }

    // Opções candidatas de alocação para este item
    const candidateAllocations = [];

    // Opção A: Alocar inteiro em cada uma das M refeições
    for (let m = 0; m < mealCount; m++) {
      candidateAllocations.push({
        type: 'SINGLE',
        allocations: [{ mealIndex: m, ratio: 1.0 }],
        isSplit: false,
        sortKey: `0_${m}`
      });
    }

    // Opção B: Dividir em 2 refeições se a massa for substancial (>= minimumPreferredSplitMass)
    const canSplit = (item.grams >= policy.minimumPreferredSplitMass) && (policy.maxSplitsPerItem >= 2) && (mealCount >= 2);
    if (canSplit) {
      // Testa divisão 50%/50% entre pares de refeições de base
      for (let p1 = 0; p1 < splitCandidateMeals.length; p1++) {
        for (let p2 = p1 + 1; p2 < splitCandidateMeals.length; p2++) {
          const m1 = splitCandidateMeals[p1];
          const m2 = splitCandidateMeals[p2];
          candidateAllocations.push({
            type: 'SPLIT_PAIR',
            allocations: [
              { mealIndex: m1, ratio: 0.5 },
              { mealIndex: m2, ratio: 0.5 }
            ],
            isSplit: true,
            sortKey: `1_${m1}_${m2}`
          });
        }
      }
    }

    // Avalia cada candidato com a função de custo J
    let bestCand = null;
    let bestCost = Infinity;

    for (let c = 0; c < candidateAllocations.length; c++) {
      const cand = candidateAllocations[c];
      const slices = createSlicesForItem(item, cand.allocations);

      // Clona temporariamente os totais de trabalho para teste de custo
      const tempMeals = workingMeals.map(wm => ({
        ...wm,
        items: [...wm.items]
      }));

      slices.forEach(sl => {
        tempMeals[sl.mealIndex].items.push(sl.mealItem);
      });

      const tempTotals = getWorkingTotals(tempMeals);
      const costObj = calculateAssemblyCost(
        tempTotals,
        globalTotals,
        targetRatios,
        policy.weights,
        totalSplitsCount + (cand.isSplit ? 1 : 0)
      );

      const cost = costObj.totalCost;

      if (cost < bestCost - 1e-6) {
        bestCost = cost;
        bestCand = cand;
      } else if (Math.abs(cost - bestCost) <= 1e-6) {
        // Desempate estóico 1: Menos fragmentações
        if (!cand.isSplit && bestCand.isSplit) {
          bestCost = cost;
          bestCand = cand;
        } else if (cand.isSplit === bestCand.isSplit) {
          // Desempate 2: Ordem lexicográfica da chave de alocação
          if (cand.sortKey.localeCompare(bestCand.sortKey) < 0) {
            bestCost = cost;
            bestCand = cand;
          }
        }
      }
    }

    // Aplica a melhor alocação encontrada
    const chosenSlices = createSlicesForItem(item, bestCand.allocations);
    chosenSlices.forEach(sl => {
      workingMeals[sl.mealIndex].items.push(sl.mealItem);
    });

    if (bestCand.isSplit) {
      totalSplitsCount++;
    }
  }

  // 4.1 Garantia estrita de que nenhuma refeição fica vazia se houver itens distribuíveis
  for (let m = 0; m < workingMeals.length; m++) {
    if (workingMeals[m].items.length === 0) {
      let donorMeal = null;
      let donorItemIdx = -1;
      let maxGrams = 0;
      for (let dm = 0; dm < workingMeals.length; dm++) {
        if (dm !== m && workingMeals[dm].items.length > 0) {
          for (let itIdx = 0; itIdx < workingMeals[dm].items.length; itIdx++) {
            const it = workingMeals[dm].items[itIdx];
            if (workingMeals[dm].items.length > 1 || it.grams >= 20) {
              if (it.grams > maxGrams) {
                maxGrams = it.grams;
                donorMeal = workingMeals[dm];
                donorItemIdx = itIdx;
              }
            }
          }
        }
      }

      if (donorMeal && donorItemIdx >= 0) {
        if (donorMeal.items.length > 1) {
          const [movedItem] = donorMeal.items.splice(donorItemIdx, 1);
          workingMeals[m].items.push(movedItem);
        } else {
          const fullItem = donorMeal.items[donorItemIdx];
          const halfGrams = roundTo(fullItem.grams / 2, 1);
          donorMeal.items[donorItemIdx] = {
            ...fullItem,
            grams: roundTo(fullItem.grams - halfGrams, 1),
            nutrients: {
              calories: roundTo(fullItem.nutrients.calories / 2, 2),
              protein: roundTo(fullItem.nutrients.protein / 2, 2),
              carbohydrate: roundTo(fullItem.nutrients.carbohydrate / 2, 2),
              lipid: roundTo(fullItem.nutrients.lipid / 2, 2),
              fiber: roundTo(fullItem.nutrients.fiber / 2, 2),
              sodium: fullItem.nutrients.sodium != null ? roundTo(fullItem.nutrients.sodium / 2, 2) : null
            }
          };
          workingMeals[m].items.push({
            ...fullItem,
            grams: halfGrams,
            nutrients: { ...donorMeal.items[donorItemIdx].nutrients }
          });
        }
      }
    }
  }

  // 5. Ordenação canônica dos itens dentro de cada refeição (foodId lexicográfico)
  workingMeals.forEach(meal => {
    meal.items.sort((a, b) => String(a.foodId).localeCompare(String(b.foodId)));
  });

  // 6. Recalcular e arredondar totais finais de cada refeição
  const finalizedMeals = workingMeals.map(meal => {
    const items = meal.items;
    const totals = {
      calories: roundTo(items.reduce((acc, it) => acc + (it.nutrients.calories || 0), 0), 2),
      protein: roundTo(items.reduce((acc, it) => acc + (it.nutrients.protein || 0), 0), 2),
      carbohydrate: roundTo(items.reduce((acc, it) => acc + (it.nutrients.carbohydrate || 0), 0), 2),
      fat: roundTo(items.reduce((acc, it) => acc + (it.nutrients.lipid !== undefined ? it.nutrients.lipid : (it.nutrients.fat || 0)), 0), 2),
      fiber: roundTo(items.reduce((acc, it) => acc + (it.nutrients.fiber || 0), 0), 2),
      sodium: allHaveSodium ? roundTo(items.reduce((acc, it) => acc + (it.nutrients.sodium || 0), 0), 2) : null
    };

    return {
      mealId: meal.mealId,
      mealName: meal.mealName,
      mealIndex: meal.mealIndex,
      mealRole: meal.mealRole,
      items,
      totals
    };
  });

  const diagnostics = [
    `Itens globais N3.2 processados: ${sourceItems.length}`,
    `Refeições estruturadas: ${mealCount}`,
    `Origem da contagem de refeições: ${isFromContext ? 'Contexto (Rotina)' : 'Fallback Operacional de Política'}`,
    `Fragmentações de alimentos executadas: ${totalSplitsCount}`,
    `Papéis atribuídos: ${roles.join(', ')}`,
    `Versão da política: ${policy.policyVersion}`
  ];

  // 7. Validação Canônica das 17 Invariantes
  const candidateOutput = {
    assemblyVersion,
    solverVersion,
    status: ASSEMBLY_STATUS.PASS,
    valid: true,
    meals: finalizedMeals,
    globalTotals,
    diagnostics,
    warnings,
    blockingReasons: [],
    provenance: {
      engine: 'NutriAxDeterministicMealAssembly',
      policyVersion: policy.policyVersion
    }
  };

  const valResult = validateMealAssembly(candidateOutput, sourceItems, globalTotals, policy.tolerances);

  if (valResult.diagnostics && valResult.diagnostics.length > 0) {
    diagnostics.push(...valResult.diagnostics);
  }

  let finalStatus;
  let isValid;

  if (!valResult.isValid) {
    finalStatus = ASSEMBLY_STATUS.BLOCKED;
    isValid = false;
  } else if (solverStatus === 'WARNING' || warnings.length > 0) {
    finalStatus = ASSEMBLY_STATUS.WARNING;
    isValid = true;
  } else {
    finalStatus = ASSEMBLY_STATUS.PASS;
    isValid = true;
  }

  return deepFreeze({
    assemblyVersion,
    solverVersion,
    status: finalStatus,
    valid: isValid,
    meals: finalizedMeals,
    globalTotals,
    diagnostics,
    warnings,
    blockingReasons: valResult.errors,
    provenance: {
      engine: 'NutriAxDeterministicMealAssembly',
      policyVersion: policy.policyVersion
    }
  });
}

module.exports = deepFreeze({
  createSlicesForItem,
  assembleMeals
});

  });

  // ── MÓDULO: domain/meal/index.js ──
  defineModule("domain/meal/index.js", function(require, module, exports) {
/**
 * domain/meal/index.js
 * 
 * Ponto Único de Exportação do Subsistema Meal Assembly — NutriAx Pro.
 * Fase N3.3 — Meal Assembly Determinístico Canônico.
 * 
 * Camada Pura — Sem I/O de infraestrutura, sem persistência externa, sem dependências remotas.
 */

'use strict';

const mealAssemblyPolicy = require('./mealAssemblyPolicy');
const mealAssemblyValidator = require('./mealAssemblyValidator');
const mealAssembly = require('./mealAssembly');

const mealSubsystem = {
  // Política e Funções de Custo
  ROLE_ARCHETYPES: mealAssemblyPolicy.ROLE_ARCHETYPES,
  ROLE_ENERGY_WEIGHTS: mealAssemblyPolicy.ROLE_ENERGY_WEIGHTS,
  FALLBACK_SCALES: mealAssemblyPolicy.FALLBACK_SCALES,
  DEFAULT_MEAL_ASSEMBLY_POLICY: mealAssemblyPolicy.DEFAULT_MEAL_ASSEMBLY_POLICY,
  resolveMealCount: mealAssemblyPolicy.resolveMealCount,
  resolveMealRoles: mealAssemblyPolicy.resolveMealRoles,
  calculateTargetRatios: mealAssemblyPolicy.calculateTargetRatios,
  calculateAssemblyCost: mealAssemblyPolicy.calculateAssemblyCost,

  // Validador de Conservação e Integridade
  roundTo: mealAssemblyValidator.roundTo,
  validateMealAssembly: mealAssemblyValidator.validateMealAssembly,

  // Motor Determinístico
  createSlicesForItem: mealAssembly.createSlicesForItem,
  assembleMeals: mealAssembly.assembleMeals
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = mealSubsystem;
}

if (typeof globalThis !== 'undefined') {
  globalThis.NutriDomain = globalThis.NutriDomain || {};
  globalThis.NutriDomain.meal = mealSubsystem;
}

  });

  // ── MÓDULO: domain/timing/mealTimingPolicy.js ──
  defineModule("domain/timing/mealTimingPolicy.js", function(require, module, exports) {
/**
 * domain/timing/mealTimingPolicy.js
 * 
 * Política de Posicionamento Temporal de Refeições — NutriAx Pro.
 * Fase N3.4 — Meal Timing / Distribuição Temporal Determinística.
 * 
 * Camada Pura — Sem I/O, sem UI, sem termos clínicos/dietéticos.
 */

'use strict';

const MealTimingContract = require('../contracts/MealTimingContract');
const {
  WINDOW_STRENGTH,
  TIMING_SOURCES,
  deepFreeze
} = MealTimingContract;

/**
 * Converte string 'HH:MM' para minutos desde a meia-noite (0..1439)
 * @param {string} timeStr 
 * @returns {number|null} Minutos ou null se formato inválido
 */
function timeStringToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.trim().match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours * 60 + minutes;
}

/**
 * Converte minutos desde a meia-noite (0..1439) para string 'HH:MM'
 * @param {number} totalMinutes 
 * @returns {string}
 */
function minutesToTimeString(totalMinutes) {
  if (typeof totalMinutes !== 'number' || !Number.isFinite(totalMinutes)) return '00:00';
  let m = Math.round(totalMinutes) % 1440;
  if (m < 0) m += 1440;
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Política padrão de posicionamento temporal
 */
const DEFAULT_MEAL_TIMING_POLICY = Object.freeze({
  policyVersion: '1.0.0',
  timingVersion: 'N3.4.0',

  // Horários operacionais de fallback para sono e vigília
  defaultWakeTime: '07:00',      // 420 min
  defaultSleepTime: '22:30',     // 1350 min

  // Margens operacionais em relação aos extremos da rotina
  firstMealOffsetMinutes: 30,    // 30 min após acordar ou início da janela
  lastMealBufferMinutes: 90,     // 90 min antes de dormir ou fim da janela

  // Intervalos operacionais entre refeições
  hardMinMealInterval: 45,       // Intervalo físico mínimo estrito (minutos)
  preferredMinMealInterval: 120, // 2 horas (mínimo desejável)
  preferredMaxMealInterval: 300, // 5 horas (máximo desejável antes de emitir alerta)

  // Preferências operacionais de relação temporal com Treino
  preferredMealBeforeTrainingMinutes: 75,
  preferredMealAfterTrainingMinutes: 45,

  // Preferências operacionais de relação temporal com Cardio
  preferredMealBeforeCardioMinutes: 60,
  preferredMealAfterCardioMinutes: 40,

  // Buffer mínimo de não-colisão com eventos de treino e cardio
  minEventBufferMinutes: 30,

  // Duração padrão estimada de sessão quando não informada (minutos)
  defaultSessionDurationMinutes: 60
});

/**
 * Resolve e extrai a janela alimentar eficaz do paciente
 * 
 * Regras de Força (windowStrength):
 * 1. Jejum estruturado ativo -> feedingWindow = HARD
 * 2. Restrição temporal expressa no contexto -> HARD
 * 3. Rotina sono/vigília estruturada -> PREFERRED
 * 4. Fallback de política -> PREFERRED + WARNING
 * 
 * @param {Object} context Contexto nutricional canônico
 * @param {Object} [fastingContext] Contexto opcional de jejum
 * @param {Object} [policy] Política de timing
 * @returns {{ startMinutes: number, endMinutes: number, start: string, end: string, durationMinutes: number, strength: string, source: string, warning: string|null }}
 */
function resolveEatingWindow(context, fastingContext = null, policy = DEFAULT_MEAL_TIMING_POLICY) {
  let warning = null;

  // Prioridade 1: Protocolo de Jejum ativo (HARD)
  const fasting = fastingContext || (context && context.fasting) || null;
  if (fasting && fasting.hasActiveProtocol && (fasting.status === 'ACTIVE' || fasting.status === undefined)) {
    let feedStart = null;
    let feedEnd = null;

    if (fasting.feedingWindows) {
      if (Array.isArray(fasting.feedingWindows) && fasting.feedingWindows.length > 0) {
        const w = fasting.feedingWindows[0];
        feedStart = w.start || w.startTime || w.windowStart;
        feedEnd = w.end || w.endTime || w.windowEnd;
      } else if (typeof fasting.feedingWindows === 'object') {
        feedStart = fasting.feedingWindows.start || fasting.feedingWindows.startTime;
        feedEnd = fasting.feedingWindows.end || fasting.feedingWindows.endTime;
      }
    }

    const startM = timeStringToMinutes(feedStart);
    const endM = timeStringToMinutes(feedEnd);

    if (startM !== null && endM !== null && endM > startM) {
      return {
        startMinutes: startM,
        endMinutes: endM,
        start: minutesToTimeString(startM),
        end: minutesToTimeString(endM),
        durationMinutes: endM - startM,
        strength: WINDOW_STRENGTH.HARD,
        source: TIMING_SOURCES.FASTING_PROTOCOL,
        warning: null
      };
    }
  }

  // Prioridade 2: Janela alimentar explicitamente restrita no contexto (HARD)
  if (context && context.constraints && context.constraints.availableEatingWindow) {
    const rawWin = context.constraints.availableEatingWindow;
    const startM = timeStringToMinutes(rawWin.start || rawWin.startTime);
    const endM = timeStringToMinutes(rawWin.end || rawWin.endTime);
    if (startM !== null && endM !== null && endM > startM) {
      return {
        startMinutes: startM,
        endMinutes: endM,
        start: minutesToTimeString(startM),
        end: minutesToTimeString(endM),
        durationMinutes: endM - startM,
        strength: WINDOW_STRENGTH.HARD,
        source: TIMING_SOURCES.STRUCTURED_ROUTINE,
        warning: null
      };
    }
  }

  // Prioridade 3: Rotina estruturada de sono e vigília (PREFERRED)
  const routine = (context && context.routine) || (context && context.patient && context.patient.routine) || {};
  const rawWake = routine.wakeUpTime || routine.wakeTime;
  const rawSleep = routine.bedTime || routine.sleepTime;

  const wakeM = timeStringToMinutes(rawWake);
  const sleepM = timeStringToMinutes(rawSleep);

  if (wakeM !== null && sleepM !== null && sleepM > wakeM) {
    const startM = wakeM + policy.firstMealOffsetMinutes;
    const endM = sleepM - policy.lastMealBufferMinutes;
    if (endM > startM) {
      return {
        startMinutes: startM,
        endMinutes: endM,
        start: minutesToTimeString(startM),
        end: minutesToTimeString(endM),
        durationMinutes: endM - startM,
        strength: WINDOW_STRENGTH.PREFERRED,
        source: TIMING_SOURCES.STRUCTURED_ROUTINE,
        warning: null
      };
    }
  }

  // Prioridade 4: Fallback operacional de política (PREFERRED + WARNING)
  const defaultWakeM = timeStringToMinutes(policy.defaultWakeTime);
  const defaultSleepM = timeStringToMinutes(policy.defaultSleepTime);
  const startM = defaultWakeM + policy.firstMealOffsetMinutes;
  const endM = defaultSleepM - policy.lastMealBufferMinutes;

  return {
    startMinutes: startM,
    endMinutes: endM,
    start: minutesToTimeString(startM),
    end: minutesToTimeString(endM),
    durationMinutes: endM - startM,
    strength: WINDOW_STRENGTH.PREFERRED,
    source: TIMING_SOURCES.POLICY_FALLBACK,
    warning: 'Horários formais de sono/vigília não informados no contexto. Utilizada janela alimentar computacional de política (fallback operacional).'
  };
}

/**
 * Extrai eventos temporais de treino e cardio do contexto de forma puramente computacional
 * @param {Object} context Contexto canônico
 * @param {Object} [trainingContext] Contexto opcional de treino
 * @param {Object} [cardioContext] Contexto opcional de cardio
 * @param {Object} [policy] Política de timing
 * @returns {Array<Object>} Lista de eventos temporais ordenados
 */
function extractTemporalEvents(context, trainingContext = null, cardioContext = null, policy = DEFAULT_MEAL_TIMING_POLICY) {
  const events = [];

  // 1. Evento de Treinamento
  const train = trainingContext || (context && context.training) || {};
  const routine = (context && context.routine) || {};

  const rawTrainTime = train.workoutTime || train.trainingStart || routine.workoutTime;
  const trainStartM = timeStringToMinutes(rawTrainTime);

  if (trainStartM !== null) {
    const duration = (typeof train.sessionDurationMinutes === 'number' && train.sessionDurationMinutes > 0)
      ? train.sessionDurationMinutes
      : policy.defaultSessionDurationMinutes;

    const trainEndM = trainStartM + duration;

    events.push({
      eventType: 'TRAINING',
      startMinutes: trainStartM,
      endMinutes: trainEndM,
      start: minutesToTimeString(trainStartM),
      end: minutesToTimeString(trainEndM),
      durationMinutes: duration,
      source: TIMING_SOURCES.STRUCTURED_TRAINING
    });
  }

  // 2. Evento de Cardio
  const cardio = cardioContext || (context && context.cardio) || {};
  if (cardio && Array.isArray(cardio.sessions) && cardio.sessions.length > 0) {
    for (let i = 0; i < cardio.sessions.length; i++) {
      const session = cardio.sessions[i];
      const rawCardioTime = session.startTime || session.start || session.time;
      const cardioStartM = timeStringToMinutes(rawCardioTime);
      if (cardioStartM !== null) {
        const duration = (typeof session.durationMinutes === 'number' && session.durationMinutes > 0)
          ? session.durationMinutes
          : 45;
        const cardioEndM = cardioStartM + duration;
        events.push({
          eventType: 'CARDIO',
          startMinutes: cardioStartM,
          endMinutes: cardioEndM,
          start: minutesToTimeString(cardioStartM),
          end: minutesToTimeString(cardioEndM),
          durationMinutes: duration,
          source: TIMING_SOURCES.STRUCTURED_CARDIO
        });
      }
    }
  }

  // Ordenação determinística por horário de início
  events.sort((a, b) => a.startMinutes - b.startMinutes);

  return deepFreeze(events);
}

module.exports = deepFreeze({
  timeStringToMinutes,
  minutesToTimeString,
  DEFAULT_MEAL_TIMING_POLICY,
  resolveEatingWindow,
  extractTemporalEvents
});

  });

  // ── MÓDULO: domain/timing/mealTimingValidator.js ──
  defineModule("domain/timing/mealTimingValidator.js", function(require, module, exports) {
/**
 * domain/timing/mealTimingValidator.js
 * 
 * Validador Canônico de Integridade e Conservação Temporal — NutriAx Pro.
 * Fase N3.4 — Meal Timing / Distribuição Temporal Determinística.
 * 
 * Camada Pura — Sem I/O, sem UI, sem termos clínicos/dietéticos.
 */

'use strict';

const MealTimingContract = require('../contracts/MealTimingContract');
const { WINDOW_STRENGTH, deepFreeze } = MealTimingContract;

/**
 * Valida integralmente a conservação, coerência e integridade temporal do Meal Timing
 * 
 * @param {Object} output Saída proposta do Meal Timing
 * @param {Object} sourceAssemblyResult Resultado canônico da Fase N3.3 (Meal Assembly)
 * @param {Object} eatingWindow Janela alimentar resolvida
 * @param {Array<Object>} temporalEvents Eventos temporais mapeados
 * @param {Object} [policy] Política de timing
 * @returns {{ isValid: boolean, isBlocked: boolean, errors: string[], warnings: string[], diagnostics: string[] }}
 */
function validateMealTiming(output, sourceAssemblyResult, eatingWindow, temporalEvents = [], policy = {}) {
  const errors = [];
  const warnings = [];
  const diagnostics = [];

  if (!output || typeof output !== 'object') {
    return {
      isValid: false,
      isBlocked: true,
      errors: ['Saída de Meal Timing nula ou inválida.'],
      warnings: [],
      diagnostics: []
    };
  }

  const scheduledMeals = Array.isArray(output.meals) ? output.meals : [];
  const sourceMeals = (sourceAssemblyResult && Array.isArray(sourceAssemblyResult.meals)) ? sourceAssemblyResult.meals : [];

  // 1. Invariante de Quantidade de Refeições
  if (scheduledMeals.length !== sourceMeals.length) {
    errors.push(`Quantidade de refeições alterada: N3.3 continha ${sourceMeals.length}, N3.4 gerou ${scheduledMeals.length}.`);
  }

  // Mapeamento das refeições originais por mealId
  const sourceMealsMap = new Map();
  sourceMeals.forEach(sm => sourceMealsMap.set(sm.mealId, sm));

  let prevMinutes = -1;

  for (let i = 0; i < scheduledMeals.length; i++) {
    const sm = scheduledMeals[i];
    if (!sm || typeof sm !== 'object') {
      errors.push(`Refeição agendada no índice ${i} é inválida.`);
      continue;
    }

    // 2. Preservação de Identidade da Refeição
    const originalMeal = sourceMealsMap.get(sm.mealId);
    if (!originalMeal) {
      errors.push(`Refeição desconhecida ou mealId inventado: '${sm.mealId}'. Proibido alterar identidade de refeição.`);
      continue;
    }

    if (sm.mealIndex !== originalMeal.mealIndex) {
      errors.push(`Refeição '${sm.mealId}' teve seu mealIndex alterado de ${originalMeal.mealIndex} para ${sm.mealIndex}.`);
    }

    if (sm.mealName !== originalMeal.mealName) {
      errors.push(`Refeição '${sm.mealId}' teve seu mealName alterado.`);
    }

    if (sm.mealRole !== originalMeal.mealRole) {
      errors.push(`Refeição '${sm.mealId}' teve seu mealRole alterado.`);
    }

    // 3. Validação dos Campos de Horário
    if (!sm.scheduledTime || typeof sm.scheduledTime !== 'string' || !/^[0-2][0-9]:[0-5][0-9]$/.test(sm.scheduledTime)) {
      errors.push(`Refeição '${sm.mealId}' possui scheduledTime inválido (${sm.scheduledTime}).`);
    }

    if (typeof sm.scheduledMinutes !== 'number' || !Number.isInteger(sm.scheduledMinutes) || sm.scheduledMinutes < 0 || sm.scheduledMinutes > 1439) {
      errors.push(`Refeição '${sm.mealId}' possui scheduledMinutes inválido (${sm.scheduledMinutes}).`);
    }

    // 4. Ordem Temporal Sequencial Crescente
    if (sm.scheduledMinutes !== undefined && sm.scheduledMinutes <= prevMinutes) {
      errors.push(`Inversão ou colisão temporal: refeição '${sm.mealId}' (${sm.scheduledTime}, ${sm.scheduledMinutes} min) agendada antes ou no mesmo horário da anterior (${prevMinutes} min).`);
    }
    prevMinutes = sm.scheduledMinutes;

    // 5. Preservação Integral de Alimentos e Nutrientes de Cada Refeição
    const sourceItems = originalMeal.items || [];
    const scheduledItems = sm.items || [];

    if (scheduledItems.length !== sourceItems.length) {
      errors.push(`Refeição '${sm.mealId}': quantidade de alimentos alterada (esperado ${sourceItems.length}, encontrado ${scheduledItems.length}).`);
    }

    for (let j = 0; j < sourceItems.length; j++) {
      const srcItem = sourceItems[j];
      const schItem = scheduledItems.find(it => it.foodId === srcItem.foodId);

      if (!schItem) {
        errors.push(`Refeição '${sm.mealId}': alimento '${srcItem.foodId}' foi perdido no timing.`);
      } else {
        if (Math.abs(schItem.grams - srcItem.grams) > 0.01) {
          errors.push(`Refeição '${sm.mealId}': massa do alimento '${srcItem.foodId}' alterada (esperado ${srcItem.grams} g, encontrado ${schItem.grams} g).`);
        }
        if (Math.abs((schItem.nutrients && schItem.nutrients.calories || 0) - (srcItem.nutrients && srcItem.nutrients.calories || 0)) > 0.05) {
          errors.push(`Refeição '${sm.mealId}': calorias do alimento '${srcItem.foodId}' alteradas.`);
        }
      }
    }

    // 6. Conformidade com a Janela Alimentar
    if (eatingWindow && typeof eatingWindow.startMinutes === 'number' && typeof eatingWindow.endMinutes === 'number') {
      const isOutsideWindow = sm.scheduledMinutes < eatingWindow.startMinutes || sm.scheduledMinutes > eatingWindow.endMinutes;
      if (isOutsideWindow) {
        if (eatingWindow.strength === WINDOW_STRENGTH.HARD) {
          errors.push(`Refeição '${sm.mealId}' (${sm.scheduledTime}) posicionada fora da janela alimentar estrita HARD (${eatingWindow.start} - ${eatingWindow.end}).`);
        } else {
          warnings.push(`Refeição '${sm.mealId}' (${sm.scheduledTime}) extrapolou a janela preferencial PREFERRED (${eatingWindow.start} - ${eatingWindow.end}).`);
        }
      }
    }

    // 7. Não-colisão com Eventos de Treino e Cardio
    temporalEvents.forEach(ev => {
      // Sobreposição física: se a refeição está dentro da sessão de treino/cardio
      if (sm.scheduledMinutes >= ev.startMinutes && sm.scheduledMinutes <= ev.endMinutes) {
        errors.push(`Refeição '${sm.mealId}' (${sm.scheduledTime}) colidiu fisicamente com o evento de ${ev.eventType} (${ev.start} - ${ev.end}).`);
      }
    });
  }

  // 8. Conservação dos Totais Globais
  const sourceTotals = sourceAssemblyResult.globalTotals || {};
  const currentTotals = output.globalTotals || {};

  ['calories', 'protein', 'carbohydrate', 'fat', 'fiber'].forEach(nut => {
    const srcVal = sourceTotals[nut] !== undefined ? sourceTotals[nut] : 0;
    const curVal = currentTotals[nut] !== undefined ? currentTotals[nut] : 0;
    if (Math.abs(curVal - srcVal) > 0.05) {
      errors.push(`Quebra de conservação global de ${nut}: N3.3 forneceu ${srcVal}, N3.4 possui ${curVal}.`);
    }
  });

  // 9. Intervalos Mínimos e Máximos
  const hardMinInterval = policy.hardMinMealInterval || 45;
  const preferredMinInterval = policy.preferredMinMealInterval || 120;
  const preferredMaxInterval = policy.preferredMaxMealInterval || 300;

  for (let i = 0; i < scheduledMeals.length - 1; i++) {
    const diff = scheduledMeals[i + 1].scheduledMinutes - scheduledMeals[i].scheduledMinutes;

    if (diff < hardMinInterval) {
      errors.push(`Intervalo entre refeição ${i + 1} e ${i + 2} (${diff} min) violou o limite físico estrito de ${hardMinInterval} min.`);
    } else if (diff < preferredMinInterval) {
      warnings.push(`Intervalo entre refeição ${i + 1} e ${i + 2} (${diff} min) menor que o preferencial de ${preferredMinInterval} min.`);
    }

    if (diff > preferredMaxInterval) {
      warnings.push(`Intervalo entre refeição ${i + 1} e ${i + 2} (${diff} min) maior que o preferencial de ${preferredMaxInterval} min.`);
    }
  }

  return deepFreeze({
    isValid: errors.length === 0,
    isBlocked: errors.length > 0,
    errors,
    warnings,
    diagnostics
  });
}

module.exports = deepFreeze({
  validateMealTiming
});

  });

  // ── MÓDULO: domain/timing/mealTiming.js ──
  defineModule("domain/timing/mealTiming.js", function(require, module, exports) {
/**
 * domain/timing/mealTiming.js
 * 
 * Motor de Posicionamento Temporal Determinístico de Refeições — NutriAx Pro.
 * Fase N3.4 — Meal Timing / Distribuição Temporal Determinística.
 * 
 * Camada Pura — Sem I/O, sem UI, sem termos clínicos/dietéticos.
 */

'use strict';

const MealTimingContract = require('../contracts/MealTimingContract');
const {
  TIMING_STATUS,
  WINDOW_STRENGTH,
  TEMPORAL_STATUS,
  TIMING_SOURCES,
  deepFreeze,
  validateMealTimingInput
} = MealTimingContract;

const mealTimingPolicy = require('./mealTimingPolicy');
const {
  DEFAULT_MEAL_TIMING_POLICY,
  timeStringToMinutes,
  minutesToTimeString,
  resolveEatingWindow,
  extractTemporalEvents
} = mealTimingPolicy;

const mealTimingValidator = require('./mealTimingValidator');
const { validateMealTiming } = mealTimingValidator;

/**
 * Posiciona deterministicamente as refeições da N3.3 no ciclo diário
 * 
 * @param {Object} input Contrato de Entrada MealTimingInputDTO
 * @param {Object} [customPolicy] Política customizada opcional
 * @returns {Object} MealTimingOutputDTO profundamente congelado
 */
function scheduleMeals(input, customPolicy = {}) {
  const policy = {
    ...DEFAULT_MEAL_TIMING_POLICY,
    ...customPolicy
  };

  const timingVersion = policy.timingVersion || 'N3.4.0';
  const assemblyVersion = (input && input.mealAssemblyResult && input.mealAssemblyResult.assemblyVersion) || 'N3.3.0';
  const solverVersion = (input && input.mealAssemblyResult && input.mealAssemblyResult.solverVersion) || 'N3.2.0';

  // 1. Validação do Portão de Entrada
  const inputValidation = validateMealTimingInput(input);
  if (!inputValidation.isValid) {
    return deepFreeze({
      timingVersion,
      assemblyVersion,
      solverVersion,
      status: TIMING_STATUS.BLOCKED,
      valid: false,
      meals: [],
      eatingWindow: {
        start: '00:00',
        startMinutes: 0,
        end: '00:00',
        endMinutes: 0,
        durationMinutes: 0,
        strength: WINDOW_STRENGTH.HARD,
        source: TIMING_SOURCES.POLICY_FALLBACK
      },
      temporalEvents: [],
      globalTotals: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0, sodium: null },
      diagnostics: ['Execução bloqueada pelo portão de validação de entrada.'],
      warnings: [],
      blockingReasons: inputValidation.errors,
      provenance: {
        engine: 'NutriAxDeterministicMealTiming',
        policyVersion: policy.policyVersion
      }
    });
  }

  const sourceAssembly = input.mealAssemblyResult;
  const rawMeals = [...sourceAssembly.meals];
  const globalTotals = sourceAssembly.globalTotals;
  const warnings = Array.isArray(sourceAssembly.warnings) ? [...sourceAssembly.warnings] : [];
  const diagnostics = [];

  // 2. Ordenação Canônica das Refeições por mealIndex para Garantir Invariância
  rawMeals.sort((a, b) => a.mealIndex - b.mealIndex);
  const M = rawMeals.length;

  // 3. Resolução da Janela Alimentar Eficaz
  const eatingWindow = resolveEatingWindow(input.context, input.fastingContext, policy);
  if (eatingWindow.warning) {
    warnings.push(eatingWindow.warning);
  }

  // 4. Extração de Eventos Temporais (Treino e Cardio)
  const temporalEvents = extractTemporalEvents(input.context, input.trainingContext, input.cardioContext, policy);

  // 5. Verificação de Viabilidade Matemática Estrita (Apenas para Janela HARD)
  const hardMinInterval = policy.hardMinMealInterval;
  const minRequiredWindow = M > 1 ? (M - 1) * hardMinInterval : 0;

  if (eatingWindow.strength === WINDOW_STRENGTH.HARD && eatingWindow.durationMinutes < minRequiredWindow) {
    return deepFreeze({
      timingVersion,
      assemblyVersion,
      solverVersion,
      status: TIMING_STATUS.BLOCKED,
      valid: false,
      meals: [],
      eatingWindow,
      temporalEvents,
      globalTotals,
      diagnostics: ['Inviabilidade temporal matemática estrita.'],
      warnings,
      blockingReasons: [
        `Janela alimentar estrita HARD (${eatingWindow.durationMinutes} min) insuficiente para acomodar ${M} refeições com intervalo mínimo físico de ${hardMinInterval} min (mínimo necessário: ${minRequiredWindow} min).`
      ],
      provenance: {
        engine: 'NutriAxDeterministicMealTiming',
        policyVersion: policy.policyVersion
      }
    });
  }

  // Se a janela for PREFERRED e curta demais, expandimos computacionalmente e alertamos
  let effectiveStart = eatingWindow.startMinutes;
  let effectiveEnd = eatingWindow.endMinutes;

  if (eatingWindow.strength === WINDOW_STRENGTH.PREFERRED && eatingWindow.durationMinutes < minRequiredWindow) {
    warnings.push(`Janela preferencial (${eatingWindow.durationMinutes} min) insuficiente para ${M} refeições; expandida automaticamente para ${minRequiredWindow} min para viabilidade física.`);
    effectiveEnd = effectiveStart + minRequiredWindow;
  }

  // 6. Verificação de Preferências Estruturadas de Horários no Contexto (ex: typicalMealTimes)
  let structuredTimes = null;
  const recall = input.context && input.context.dietaryRecall;
  if (recall && Array.isArray(recall.typicalMealTimes) && recall.typicalMealTimes.length === M) {
    const parsedMinutes = recall.typicalMealTimes.map(t => timeStringToMinutes(t));
    const allValid = parsedMinutes.every(m => m !== null);
    const isAscending = allValid && parsedMinutes.every((m, idx) => idx === 0 || m > parsedMinutes[idx - 1]);

    if (allValid && isAscending) {
      // Se a janela for HARD, valida se estão todos dentro
      const withinHard = (eatingWindow.strength !== WINDOW_STRENGTH.HARD) ||
        parsedMinutes.every(m => m >= eatingWindow.startMinutes && m <= eatingWindow.endMinutes);

      if (withinHard) {
        structuredTimes = parsedMinutes;
      }
    }
  }

  // 7. Algoritmo Determinístico de Posicionamento Temporal
  const scheduledMinutesList = new Array(M);
  const timingSourcesList = new Array(M);
  const temporalStatusList = new Array(M);
  const timingReasonsList = new Array(M);

  if (structuredTimes) {
    // Aplica horários estruturados da rotina do paciente
    for (let i = 0; i < M; i++) {
      scheduledMinutesList[i] = structuredTimes[i];
      timingSourcesList[i] = TIMING_SOURCES.STRUCTURED_ROUTINE;
      temporalStatusList[i] = TEMPORAL_STATUS.CONFIRMED;
      timingReasonsList[i] = 'STRUCTURED_ROUTINE_SLOT';
    }
    diagnostics.push(`Horários definidos a partir de rotina estruturada de horários típicos (${M} horários).`);
  } else {
    // Distribuição Uniforme Ancorada com Respeito a Eventos de Treino e Cardio
    const duration = effectiveEnd - effectiveStart;

    if (M === 1) {
      // 1 refeição: posiciona no meio da janela
      scheduledMinutesList[0] = Math.round(effectiveStart + duration / 2);
      timingSourcesList[0] = eatingWindow.source;
      temporalStatusList[0] = eatingWindow.source === TIMING_SOURCES.POLICY_FALLBACK ? TEMPORAL_STATUS.FALLBACK : TEMPORAL_STATUS.CONFIRMED;
      timingReasonsList[0] = 'SINGLE_MEAL_MID_WINDOW';
    } else {
      // M >= 2 refeições
      for (let i = 0; i < M; i++) {
        const fraction = i / (M - 1);
        const nominalTime = Math.round(effectiveStart + fraction * duration);
        scheduledMinutesList[i] = nominalTime;
        timingSourcesList[i] = eatingWindow.source;
        temporalStatusList[i] = eatingWindow.source === TIMING_SOURCES.POLICY_FALLBACK ? TEMPORAL_STATUS.FALLBACK : TEMPORAL_STATUS.CONFIRMED;
        timingReasonsList[i] = 'PREFERRED_DISTRIBUTION';
      }

      // Ajuste de não-colisão e proximidade com Treino e Cardio
      temporalEvents.forEach(ev => {
        const evStart = ev.startMinutes;
        const evEnd = ev.endMinutes;
        const buffer = policy.minEventBufferMinutes;

        // Verifica refeições que colidiriam fisicamente com a sessão
        for (let i = 0; i < M; i++) {
          const mTime = scheduledMinutesList[i];
          if (mTime >= evStart - buffer && mTime <= evEnd + buffer) {
            // Se está mais perto do início, move para antes do evento
            if (mTime < (evStart + evEnd) / 2) {
              const adjustedTime = Math.max(effectiveStart, evStart - policy.preferredMealBeforeTrainingMinutes);
              scheduledMinutesList[i] = adjustedTime;
              timingSourcesList[i] = ev.source;
              temporalStatusList[i] = TEMPORAL_STATUS.ADJUSTED;
              timingReasonsList[i] = `PRE_${ev.eventType}_BUFFER`;
            } else {
              // Move para depois do evento
              const adjustedTime = Math.min(effectiveEnd, evEnd + policy.preferredMealAfterTrainingMinutes);
              scheduledMinutesList[i] = adjustedTime;
              timingSourcesList[i] = ev.source;
              temporalStatusList[i] = TEMPORAL_STATUS.ADJUSTED;
              timingReasonsList[i] = `POST_${ev.eventType}_BUFFER`;
            }
          }
        }
      });

      // Passada determinística de garantia de monotonicidade (hardMinInterval)
      for (let i = 1; i < M; i++) {
        if (scheduledMinutesList[i] - scheduledMinutesList[i - 1] < hardMinInterval) {
          scheduledMinutesList[i] = scheduledMinutesList[i - 1] + hardMinInterval;
          temporalStatusList[i] = TEMPORAL_STATUS.ADJUSTED;
          timingReasonsList[i] = 'HARD_INTERVAL_ENFORCEMENT';
        }
      }

      // Se o ajuste final ultrapassou o final da janela
      if (scheduledMinutesList[M - 1] > effectiveEnd) {
        if (eatingWindow.strength === WINDOW_STRENGTH.HARD) {
          // Ajusta retroativamente empurrando para trás a partir do final
          scheduledMinutesList[M - 1] = effectiveEnd;
          for (let i = M - 2; i >= 0; i--) {
            if (scheduledMinutesList[i + 1] - scheduledMinutesList[i] < hardMinInterval) {
              scheduledMinutesList[i] = scheduledMinutesList[i + 1] - hardMinInterval;
              temporalStatusList[i] = TEMPORAL_STATUS.ADJUSTED;
            }
          }
        } else {
          warnings.push(`Extensão de horário no fechamento (${scheduledMinutesList[M - 1]} min) acomodada sob janela preferencial PREFERRED.`);
        }
      }

      diagnostics.push(`Refeições distribuídas deterministicamente em janela ${eatingWindow.start} - ${eatingWindow.end} (${M} refeições).`);
    }
  }

  // 8. Construção das ScheduledMealDTO preservando 100% dos dados da N3.3
  const scheduledMeals = [];
  for (let i = 0; i < M; i++) {
    const originalMeal = rawMeals[i];
    const schedM = scheduledMinutesList[i];
    const nextM = (i < M - 1) ? scheduledMinutesList[i + 1] : null;
    const intervalToNext = nextM !== null ? (nextM - schedM) : null;

    scheduledMeals.push({
      mealId: originalMeal.mealId,
      mealIndex: originalMeal.mealIndex,
      mealName: originalMeal.mealName,
      mealRole: originalMeal.mealRole,
      scheduledTime: minutesToTimeString(schedM),
      scheduledMinutes: schedM,
      intervalToNextMinutes: intervalToNext,
      temporalStatus: temporalStatusList[i],
      timingReason: timingReasonsList[i],
      timingSource: timingSourcesList[i],
      items: originalMeal.items,
      totals: originalMeal.totals
    });
  }

  // 9. Validação Canônica das 18 Invariantes Temporais
  const candidateOutput = {
    timingVersion,
    assemblyVersion,
    solverVersion,
    status: TIMING_STATUS.PASS,
    valid: true,
    meals: scheduledMeals,
    eatingWindow,
    temporalEvents,
    globalTotals,
    diagnostics,
    warnings,
    blockingReasons: [],
    provenance: {
      engine: 'NutriAxDeterministicMealTiming',
      policyVersion: policy.policyVersion
    }
  };

  const valResult = validateMealTiming(candidateOutput, sourceAssembly, eatingWindow, temporalEvents, policy);

  if (valResult.warnings && valResult.warnings.length > 0) {
    warnings.push(...valResult.warnings);
  }

  let finalStatus;
  let isValid;

  if (!valResult.isValid) {
    finalStatus = TIMING_STATUS.BLOCKED;
    isValid = false;
  } else if (warnings.length > 0) {
    finalStatus = TIMING_STATUS.WARNING;
    isValid = true;
  } else {
    finalStatus = TIMING_STATUS.PASS;
    isValid = true;
  }

  return deepFreeze({
    timingVersion,
    assemblyVersion,
    solverVersion,
    status: finalStatus,
    valid: isValid,
    meals: scheduledMeals,
    eatingWindow,
    temporalEvents,
    globalTotals,
    diagnostics,
    warnings: [...new Set(warnings)],
    blockingReasons: valResult.errors,
    provenance: {
      engine: 'NutriAxDeterministicMealTiming',
      policyVersion: policy.policyVersion
    }
  });
}

module.exports = deepFreeze({
  scheduleMeals
});

  });

  // ── MÓDULO: domain/timing/index.js ──
  defineModule("domain/timing/index.js", function(require, module, exports) {
/**
 * domain/timing/index.js
 * 
 * Ponto Único de Exportação do Subsistema Meal Timing — NutriAx Pro.
 * Fase N3.4 — Meal Timing / Distribuição Temporal Determinística.
 * 
 * Camada Pura — Sem I/O de infraestrutura, sem persistência externa, sem dependências remotas.
 */

'use strict';

const mealTimingPolicy = require('./mealTimingPolicy');
const mealTimingValidator = require('./mealTimingValidator');
const mealTiming = require('./mealTiming');

const nutrientTimingPolicy = require('./nutrientTimingPolicy');
const nutrientTimingValidator = require('./nutrientTimingValidator');
const nutrientTiming = require('./nutrientTiming');

const timingSubsystem = {
  // Política e Utilitários de Tempo (N3.4)
  DEFAULT_MEAL_TIMING_POLICY: mealTimingPolicy.DEFAULT_MEAL_TIMING_POLICY,
  timeStringToMinutes: mealTimingPolicy.timeStringToMinutes,
  minutesToTimeString: mealTimingPolicy.minutesToTimeString,
  resolveEatingWindow: mealTimingPolicy.resolveEatingWindow,
  extractTemporalEvents: mealTimingPolicy.extractTemporalEvents,

  // Validador Temporal (N3.4)
  validateMealTiming: mealTimingValidator.validateMealTiming,

  // Motor Determinístico de Agendamento (N3.4)
  scheduleMeals: mealTiming.scheduleMeals,

  // Política e Utilitários de Nutrient Timing (N3.5)
  DEFAULT_NUTRIENT_TIMING_POLICY: nutrientTimingPolicy.DEFAULT_NUTRIENT_TIMING_POLICY,
  resolveDayEvents: nutrientTimingPolicy.resolveDayEvents,

  // Validador de Nutrient Timing (N3.5)
  validateNutrientTiming: nutrientTimingValidator.validateNutrientTiming,

  // Motor Determinístico de Análise de Nutrient Timing (N3.5)
  analyzeNutrientTiming: nutrientTiming.analyzeNutrientTiming
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = timingSubsystem;
}

if (typeof globalThis !== 'undefined') {
  globalThis.NutriDomain = globalThis.NutriDomain || {};
  globalThis.NutriDomain.timing = timingSubsystem;
}

  });

  // ── MÓDULO: domain/timing/nutrientTimingPolicy.js ──
  defineModule("domain/timing/nutrientTimingPolicy.js", function(require, module, exports) {
/**
 * domain/timing/nutrientTimingPolicy.js
 * 
 * Política de Análise de Nutrient Timing — NutriAx Pro.
 * Fase N3.5 — Nutrient Timing Específico.
 * 
 * Camada Pura — Sem I/O, sem UI, sem termos clínicos não fundamentados.
 */

'use strict';

const NutrientTimingContract = require('../contracts/NutrientTimingContract');
const { deepFreeze } = NutrientTimingContract;

/**
 * Converte string 'HH:MM' para minutos desde a meia-noite (0..1439)
 * @param {string} timeStr 
 * @returns {number|null} Minutos ou null se formato inválido
 */
function timeStringToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.trim().match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours * 60 + minutes;
}

/**
 * Converte minutos desde a meia-noite (0..1439) para string 'HH:MM'
 * @param {number} totalMinutes 
 * @returns {string}
 */
function minutesToTimeString(totalMinutes) {
  if (typeof totalMinutes !== 'number' || !Number.isFinite(totalMinutes)) return '00:00';
  let m = Math.round(totalMinutes) % 1440;
  if (m < 0) m += 1440;
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Política padrão de análise de Nutrient Timing
 */
const DEFAULT_NUTRIENT_TIMING_POLICY = Object.freeze({
  policyVersion: '1.0.0',
  analysisVersion: 'N3.5.0',

  // Janela operacional preferencial peri-evento (minutos)
  // Natureza estritamente PREFERRED: violação gera WARNING operacional, nunca BLOCKED.
  // Não significa que refeição peri-treino seja clinicamente obrigatória.
  preferredPeriEventWindowMinutes: 150,

  // Separação temporal operacional preferencial entre refeição e evento (minutos)
  // Espaçamento prático de rotina; NÃO representa tempo fisiológico de digestão.
  preferredMealEventSeparationMinutes: 45,

  // Separação temporal operacional preferencial entre cardio e sono (minutos)
  // Avaliado estritamente quando existirem simultaneamente cardioEndMinutes e bedTime.
  preferredCardioSleepSeparationMinutes: 120,

  // Duração padrão de sessão quando não informada (minutos)
  defaultSessionDurationMinutes: 60,

  // Limiar de proximidade para considerar refeição ancorada no jejum (minutos)
  fastingWindowAnchorThresholdMinutes: 30
});

/**
 * Resolve os eventos estruturados para o dia especificado no microciclo
 * 
 * Regra Arquitetural: Só classifica rest === true se o campo estruturado booleano
 * for estritamente true. Nunca deduz descanso por ausência de treino ou texto livre.
 * 
 * @param {Object} context Contexto de prescrição nutricional
 * @param {string|null} targetDayKey Identificador opcional do dia (ex: 'd1', 'd2')
 * @param {Object} policy Política de timing
 * @returns {Object} { isRestDay: boolean, trainingEvent: Object|null, cardioEvents: Array<Object>, unscheduledCardioCount: number }
 */
function resolveDayEvents(context, targetDayKey = null, policy = DEFAULT_NUTRIENT_TIMING_POLICY) {
  let isRestDay = false;
  let targetDay = null;

  // 1. Inspeciona o microciclo se targetDayKey for especificado
  if (context && Array.isArray(context.weeklySchedule) && context.weeklySchedule.length > 0) {
    if (targetDayKey) {
      targetDay = context.weeklySchedule.find(d => d.dayKey === targetDayKey || d.dayName === targetDayKey) || null;
    }
  }

  // Verifica explicitamente rest === true
  if (targetDay && targetDay.rest === true) {
    isRestDay = true;
  }

  // 2. Evento de Treinamento
  let trainingEvent = null;
  const train = (targetDay && targetDay.training) || (context && context.training) || {};
  const routine = (context && context.routine) || {};

  const rawTrainTime = train.workoutTime || train.trainingStart || routine.workoutTime;
  const trainStartM = timeStringToMinutes(rawTrainTime);

  if (!isRestDay && trainStartM !== null) {
    const duration = (typeof train.sessionDurationMinutes === 'number' && train.sessionDurationMinutes > 0)
      ? train.sessionDurationMinutes
      : policy.defaultSessionDurationMinutes;

    trainingEvent = {
      eventType: 'TRAINING',
      start: minutesToTimeString(trainStartM),
      end: minutesToTimeString(trainStartM + duration),
      startMinutes: trainStartM,
      endMinutes: trainStartM + duration,
      durationMinutes: duration,
      routineId: train.routineId || null
    };
  }

  // 3. Eventos de Cardio
  const cardioEvents = [];
  let unscheduledCardioCount = 0;

  const cardio = (context && context.cardio) || {};
  const sessions = Array.isArray(cardio.sessions) ? cardio.sessions : [];

  if (!isRestDay && sessions.length > 0) {
    sessions.forEach((s, idx) => {
      // Se targetDayKey for especificado, filtra sessões do dia se dayKey estiver cadastrado
      if (targetDayKey && s.dayKey && s.dayKey !== targetDayKey) {
        return;
      }

      const rawCardioTime = s.startTime || s.start || s.time;
      const cardioStartM = timeStringToMinutes(rawCardioTime);

      if (cardioStartM !== null) {
        const duration = (typeof s.durationMinutes === 'number' && s.durationMinutes > 0)
          ? s.durationMinutes
          : 45;

        cardioEvents.push({
          eventType: 'CARDIO',
          cardioId: s.cardioId || `cardio_${idx + 1}`,
          start: minutesToTimeString(cardioStartM),
          end: minutesToTimeString(cardioStartM + duration),
          startMinutes: cardioStartM,
          endMinutes: cardioStartM + duration,
          durationMinutes: duration,
          modality: s.modality || null,
          intensity: s.intensity || null
        });
      } else {
        unscheduledCardioCount++;
      }
    });
  }

  // Ordenação determinística de cardio por início
  cardioEvents.sort((a, b) => a.startMinutes - b.startMinutes);

  return {
    isRestDay,
    trainingEvent,
    cardioEvents,
    unscheduledCardioCount
  };
}

module.exports = deepFreeze({
  DEFAULT_NUTRIENT_TIMING_POLICY,
  timeStringToMinutes,
  minutesToTimeString,
  resolveDayEvents
});

  });

  // ── MÓDULO: domain/timing/nutrientTimingValidator.js ──
  defineModule("domain/timing/nutrientTimingValidator.js", function(require, module, exports) {
/**
 * domain/timing/nutrientTimingValidator.js
 * 
 * Validador Canônico de Conservação, Integridade e Coerência de Nutrient Timing — NutriAx Pro.
 * Fase N3.5 — Nutrient Timing Específico.
 * 
 * Camada Pura — Sem I/O, sem UI, sem termos clínicos não fundamentados.
 */

'use strict';

const NutrientTimingContract = require('../contracts/NutrientTimingContract');
const {
  NUTRIENT_TIMING_STATUS,
  TEMPORAL_PRIMARY_RELATION,
  TEMPORAL_SECONDARY_RELATION,
  deepFreeze
} = NutrientTimingContract;

/**
 * Valida integralmente a saída da análise de Nutrient Timing contra as fases anteriores
 * 
 * @param {Object} output Saída proposta do Nutrient Timing
 * @param {Object} sourceTimingResult Resultado canônico da Fase N3.4 (Meal Timing)
 * @param {Object} [sourceAssemblyResult] Resultado opcional da Fase N3.3 (Meal Assembly)
 * @param {Object} [policy] Política de timing
 * @returns {{ isValid: boolean, isBlocked: boolean, errors: string[], warnings: string[], diagnostics: string[] }}
 */
function validateNutrientTiming(output, sourceTimingResult, sourceAssemblyResult = null, policy = {}) {
  const errors = [];
  const warnings = [];
  const diagnostics = [];

  // 1. Validação de Input
  if (!output || typeof output !== 'object') {
    return {
      isValid: false,
      isBlocked: true,
      errors: ['Saída de Nutrient Timing nula ou inválida.'],
      warnings: [],
      diagnostics: []
    };
  }

  // 2. Validação da N3.4 de Origem
  if (!sourceTimingResult || typeof sourceTimingResult !== 'object' || !Array.isArray(sourceTimingResult.meals)) {
    errors.push('sourceTimingResult da Fase N3.4 ausente ou inválido.');
    return {
      isValid: false,
      isBlocked: true,
      errors,
      warnings,
      diagnostics
    };
  }

  const analyzedMeals = Array.isArray(output.meals) ? output.meals : [];
  const sourceMeals = sourceTimingResult.meals;

  // 3. Invariante de Quantidade de Refeições
  if (analyzedMeals.length !== sourceMeals.length) {
    errors.push(`Quantidade de refeições alterada: N3.4 continha ${sourceMeals.length}, N3.5 gerou ${analyzedMeals.length}.`);
  }

  // Mapeamento das refeições originais por mealId
  const sourceMealsMap = new Map();
  sourceMeals.forEach(sm => sourceMealsMap.set(sm.mealId, sm));

  for (let i = 0; i < analyzedMeals.length; i++) {
    const am = analyzedMeals[i];
    if (!am || typeof am !== 'object') {
      errors.push(`Refeição analisada no índice ${i} é inválida.`);
      continue;
    }

    // 4. Preservação de Identidade da Refeição
    const originalMeal = sourceMealsMap.get(am.mealId);
    if (!originalMeal) {
      errors.push(`Refeição desconhecida ou mealId inventado: '${am.mealId}'. Proibido alterar identidade.`);
      continue;
    }

    if (am.mealIndex !== originalMeal.mealIndex) {
      errors.push(`Refeição '${am.mealId}': mealIndex alterado de ${originalMeal.mealIndex} para ${am.mealIndex}.`);
    }

    if (am.mealName !== originalMeal.mealName) {
      errors.push(`Refeição '${am.mealId}': mealName alterado.`);
    }

    if (am.mealRole !== originalMeal.mealRole) {
      errors.push(`Refeição '${am.mealId}': mealRole alterado.`);
    }

    // 5. Preservação Absoluta de Horários da N3.4
    if (am.scheduledTime !== originalMeal.scheduledTime) {
      errors.push(`Refeição '${am.mealId}': scheduledTime alterado (esperado "${originalMeal.scheduledTime}", recebido "${am.scheduledTime}"). N3.5 não pode alterar horários.`);
    }

    if (am.scheduledMinutes !== originalMeal.scheduledMinutes) {
      errors.push(`Refeição '${am.mealId}': scheduledMinutes alterado (esperado ${originalMeal.scheduledMinutes}, recebido ${am.scheduledMinutes}).`);
    }

    // 6. Preservação de Alimentos e Gramagens
    const origItems = originalMeal.items || [];
    const anItems = am.items || [];

    if (anItems.length !== origItems.length) {
      errors.push(`Refeição '${am.mealId}': quantidade de itens alterada (esperado ${origItems.length}, recebido ${anItems.length}).`);
    }

    for (let j = 0; j < origItems.length; j++) {
      const oItem = origItems[j];
      const aItem = anItems.find(it => it.foodId === oItem.foodId);

      if (!aItem) {
        errors.push(`Refeição '${am.mealId}': alimento '${oItem.foodId}' ausente na análise N3.5.`);
      } else {
        if (Math.abs(aItem.grams - oItem.grams) > 0.01) {
          errors.push(`Refeição '${am.mealId}': gramagem do alimento '${oItem.foodId}' alterada (${oItem.grams}g -> ${aItem.grams}g).`);
        }
      }
    }

    // 7. Preservação de Nutrientes por Refeição
    const oTot = originalMeal.totals || {};
    const aTot = am.totals || {};

    ['calories', 'protein', 'carbohydrate', 'fat'].forEach(nut => {
      const oVal = oTot[nut] !== undefined ? oTot[nut] : 0;
      const aVal = aTot[nut] !== undefined ? aTot[nut] : 0;
      if (Math.abs(aVal - oVal) > 0.05) {
        errors.push(`Refeição '${am.mealId}': total de ${nut} alterado (${oVal} -> ${aVal}). Proibido rebalancear na N3.5.`);
      }
    });

    // 8. Coerência das Relações Temporais
    if (!am.primaryRelation || !Object.values(TEMPORAL_PRIMARY_RELATION).includes(am.primaryRelation)) {
      errors.push(`Refeição '${am.mealId}': primaryRelation inválida ("${am.primaryRelation}").`);
    }

    if (!Array.isArray(am.secondaryRelations)) {
      errors.push(`Refeição '${am.mealId}': secondaryRelations deve ser um array.`);
    } else {
      am.secondaryRelations.forEach(sec => {
        if (!Object.values(TEMPORAL_SECONDARY_RELATION).includes(sec)) {
          errors.push(`Refeição '${am.mealId}': secondaryRelation desconhecida ("${sec}").`);
        }
      });
    }

    // 9. Explicabilidade (analysisReason)
    if (!am.analysisReason || typeof am.analysisReason !== 'string' || am.analysisReason.trim() === '') {
      errors.push(`Refeição '${am.mealId}': analysisReason obrigatória não informada.`);
    }

    // 10. Proibição de inventar distâncias quando eventos não possuem horários
    if (am.distanceToTrainingMinutes !== null && am.distanceToTrainingMinutes !== undefined) {
      if (typeof am.distanceToTrainingMinutes !== 'number' || isNaN(am.distanceToTrainingMinutes) || am.distanceToTrainingMinutes < 0) {
        errors.push(`Refeição '${am.mealId}': distanceToTrainingMinutes deve ser número não-negativo ou null.`);
      }
    }

    if (am.distanceToCardioMinutes !== null && am.distanceToCardioMinutes !== undefined) {
      if (typeof am.distanceToCardioMinutes !== 'number' || isNaN(am.distanceToCardioMinutes) || am.distanceToCardioMinutes < 0) {
        errors.push(`Refeição '${am.mealId}': distanceToCardioMinutes deve ser número não-negativo ou null.`);
      }
    }

    // 11. Colisão Física: OVERLAPPING_EVENT não pode resultar em PASS
    if (am.primaryRelation === TEMPORAL_PRIMARY_RELATION.OVERLAPPING_EVENT && output.status === NUTRIENT_TIMING_STATUS.PASS) {
      errors.push(`Refeição '${am.mealId}' possui colisão física OVERLAPPING_EVENT; status não pode ser PASS.`);
    }
  }

  // 12. Preservação dos Totais Globais
  const srcGlobal = sourceTimingResult.globalTotals || {};
  const curGlobal = output.globalTotals || {};

  ['calories', 'protein', 'carbohydrate', 'fat', 'fiber'].forEach(nut => {
    const sVal = srcGlobal[nut] !== undefined ? srcGlobal[nut] : 0;
    const cVal = curGlobal[nut] !== undefined ? curGlobal[nut] : 0;
    if (Math.abs(cVal - sVal) > 0.05) {
      errors.push(`Quebra de conservação global de ${nut}: N3.4 forneceu ${sVal}, N3.5 gerou ${cVal}.`);
    }
  });

  // 13. Preservação de Sódio quando disponível
  if (srcGlobal.sodium !== undefined && srcGlobal.sodium !== null) {
    if (Math.abs((curGlobal.sodium || 0) - srcGlobal.sodium) > 0.05) {
      errors.push(`Quebra de conservação global de sódio: N3.4 forneceu ${srcGlobal.sodium}, N3.5 gerou ${curGlobal.sodium}.`);
    }
  }

  // 14. Proveniência e Metadados
  if (!output.provenance || typeof output.provenance !== 'object') {
    errors.push('output.provenance deve ser um objeto descritivo.');
  } else {
    if (!output.provenance.engine || typeof output.provenance.engine !== 'string') {
      errors.push('output.provenance.engine é obrigatório.');
    }
    if (!output.provenance.analysisVersion || typeof output.provenance.analysisVersion !== 'string') {
      errors.push('output.provenance.analysisVersion é obrigatório.');
    }
  }

  // 15. Coerência de Status de Bloqueio
  if (output.status === NUTRIENT_TIMING_STATUS.BLOCKED && (!Array.isArray(output.blockingReasons) || output.blockingReasons.length === 0)) {
    errors.push('Status BLOCKED exige blockingReasons contendo pelo menos um motivo explicativo.');
  }

  // 16. Coerência de REST_DAY
  if (analyzedMeals.some(m => m.primaryRelation === TEMPORAL_PRIMARY_RELATION.REST_DAY)) {
    const isExplicitRest = output.globalDiagnostics && output.globalDiagnostics.some(d => /rest === true/i.test(d));
    if (!isExplicitRest) {
      warnings.push('Refeições classificadas como REST_DAY sem registro explícito de rest === true.');
    }
  }

  return deepFreeze({
    isValid: errors.length === 0,
    isBlocked: errors.length > 0,
    errors,
    warnings,
    diagnostics
  });
}

module.exports = deepFreeze({
  validateNutrientTiming
});

  });

  // ── MÓDULO: domain/timing/nutrientTiming.js ──
  defineModule("domain/timing/nutrientTiming.js", function(require, module, exports) {
/**
 * domain/timing/nutrientTiming.js
 * 
 * Motor Determinístico de Análise de Nutrient Timing — NutriAx Pro.
 * Fase N3.5 — Nutrient Timing Específico.
 * 
 * Camada Pura — Sem I/O, sem UI, sem efeitos colaterais, sem dependências externas.
 * 
 * Princípios Fundamentais:
 * 1. PUREZA ANALÍTICA: N3.5 NÃO prescreve nutrientes; N3.5 apenas analisa e classifica.
 * 2. IMUTABILIDADE & CONSERVAÇÃO: Preservação de 100% dos alimentos, gramas, calorias,
 *    macronutrientes e horários gerados nas Fases N2.1 a N3.4.
 * 3. DETERMINISMO: Mesma entrada lógica + mesma política = resultado idêntico (deepStrictEqual).
 * 4. SEM REGRAS CLÍNICAS MÁGICAS: Parâmetros PREFERRED nunca bloqueiam e não forçam refeições.
 */

'use strict';

const NutrientTimingContract = require('../contracts/NutrientTimingContract');
const {
  NUTRIENT_TIMING_STATUS,
  TEMPORAL_PRIMARY_RELATION,
  TEMPORAL_SECONDARY_RELATION,
  EVENT_RELATIONS,
  deepFreeze,
  validateNutrientTimingInput
} = NutrientTimingContract;

const nutrientTimingPolicy = require('./nutrientTimingPolicy');
const {
  DEFAULT_NUTRIENT_TIMING_POLICY,
  timeStringToMinutes,
  minutesToTimeString,
  resolveDayEvents
} = nutrientTimingPolicy;

const nutrientTimingValidator = require('./nutrientTimingValidator');
const { validateNutrientTiming } = nutrientTimingValidator;

/**
 * Analisa deterministicamente a relação temporal das refeições com treino, cardio, jejum e microciclo
 * 
 * @param {Object} input Contrato de Entrada NutrientTimingInputDTO
 * @param {Object} [customPolicy] Política customizada opcional
 * @returns {Object} NutrientTimingOutputDTO profundamente congelado
 */
function analyzeNutrientTiming(input, customPolicy = {}) {
  const policy = {
    ...DEFAULT_NUTRIENT_TIMING_POLICY,
    ...customPolicy
  };

  const timingAnalysisVersion = policy.analysisVersion || 'N3.5.0';
  const timingVersion = (input && input.mealTimingResult && input.mealTimingResult.timingVersion) || 'N3.4.0';
  const assemblyVersion = (input && input.mealTimingResult && input.mealTimingResult.assemblyVersion) || 'N3.3.0';
  const solverVersion = (input && input.mealTimingResult && input.mealTimingResult.solverVersion) || 'N3.2.0';

  // 1. Validação do Portão de Entrada
  const inputValidation = validateNutrientTimingInput(input);
  if (!inputValidation.isValid) {
    return deepFreeze({
      timingAnalysisVersion,
      timingVersion,
      assemblyVersion,
      solverVersion,
      status: NUTRIENT_TIMING_STATUS.BLOCKED,
      valid: false,
      meals: [],
      mealAnalyses: [],
      globalDiagnostics: ['Execução bloqueada pelo portão de validação de entrada.'],
      temporalEvents: [],
      conflicts: inputValidation.errors.map(err => ({
        type: 'INPUT_GATE_ERROR',
        severity: 'BLOCK',
        description: err,
        entityId: 'input'
      })),
      warnings: [],
      blockingReasons: inputValidation.errors,
      globalTotals: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0, sodium: null },
      provenance: {
        engine: 'NutriAxDeterministicNutrientTiming',
        policyVersion: policy.policyVersion,
        analysisVersion: timingAnalysisVersion
      }
    });
  }

  const mealTimingResult = input.mealTimingResult;
  const rawMeals = [...mealTimingResult.meals];
  const globalTotals = mealTimingResult.globalTotals;
  const eatingWindow = mealTimingResult.eatingWindow;
  const context = input.context;
  const targetDayKey = input.targetDayKey || null;

  // Ordenação canônica por scheduledMinutes
  rawMeals.sort((a, b) => a.scheduledMinutes - b.scheduledMinutes);
  const M = rawMeals.length;

  const globalDiagnostics = [];
  const conflicts = [];
  const warnings = Array.isArray(mealTimingResult.warnings) ? [...mealTimingResult.warnings] : [];
  const blockingReasons = [];

  // 2. Resolução Estruturada de Eventos do Microciclo (Treino, Cardio, Descanso)
  const dayEvents = resolveDayEvents(context, targetDayKey, policy);
  const isRestDay = dayEvents.isRestDay;
  const trainingEvent = dayEvents.trainingEvent;
  const cardioEvents = dayEvents.cardioEvents;
  const unscheduledCardioCount = dayEvents.unscheduledCardioCount;

  if (isRestDay) {
    globalDiagnostics.push('Dia classificado como descanso (rest === true no microciclo estruturado).');
  }

  // Lista consolidada de eventos temporais ativos no dia
  const activeEvents = [];
  if (!isRestDay) {
    if (trainingEvent) activeEvents.push(trainingEvent);
    cardioEvents.forEach(cev => activeEvents.push(cev));
  }
  activeEvents.sort((a, b) => a.startMinutes - b.startMinutes);

  // 3. Verificação de Treino em Jejum (FASTED_TRAINING)
  // Regra Arquitetural: Diagnóstico puro; NÃO gera WARNING automaticamente,
  // salvo se houver conflito formal expresso no contexto.
  if (trainingEvent && eatingWindow && typeof eatingWindow.startMinutes === 'number') {
    const isOutsideFeeding = (trainingEvent.startMinutes < eatingWindow.startMinutes) || (trainingEvent.endMinutes > eatingWindow.endMinutes);
    if (isOutsideFeeding) {
      globalDiagnostics.push(`Treino estruturado (${trainingEvent.start} - ${trainingEvent.end}) ocorre fora da janela alimentar (${eatingWindow.start} - ${eatingWindow.end}): diagnóstico FASTED_TRAINING.`);
      
      const fastingConstraint = (context.constraints && context.constraints.prohibitFastedTraining) ||
                                (context.fasting && context.fasting.prohibitFastedTraining);
      if (fastingConstraint) {
        conflicts.push({
          type: 'FASTED_TRAINING_CONTRAINDICATION',
          severity: 'WARNING',
          description: 'Treino em jejum incompatível com restrição formal documentada no contexto.',
          entityId: 'training'
        });
        warnings.push('Treino em jejum incompatível com restrição formal documentada no contexto.');
      }
    }
  }

  // 4. Verificação de Cardio -> Sono (Apenas se ambos forem estruturados)
  if (cardioEvents.length > 0 && context.routine && context.routine.bedTime) {
    const bedM = timeStringToMinutes(context.routine.bedTime);
    const lastCardio = cardioEvents[cardioEvents.length - 1];

    if (bedM !== null && lastCardio && typeof lastCardio.endMinutes === 'number') {
      if (bedM > lastCardio.endMinutes) {
        const cardioSleepDist = bedM - lastCardio.endMinutes;
        if (cardioSleepDist < policy.preferredCardioSleepSeparationMinutes) {
          warnings.push(`Separação entre término do cardio (${lastCardio.end}) e horário de sono (${context.routine.bedTime}) é de ${cardioSleepDist} min, menor que o preferencial de ${policy.preferredCardioSleepSeparationMinutes} min.`);
        }
      }
    }
  }

  if (unscheduledCardioCount > 0) {
    globalDiagnostics.push(`Identificada(s) ${unscheduledCardioCount} sessão(ões) de cardio sem horário de início estruturado (DATA_INSUFFICIENT).`);
    warnings.push('Sessão de cardio cadastrada sem horário de início estruturado. Análise peri-cardio classificada como DATA_INSUFFICIENT.');
  }

  // 5. Identificação Prévia de Refeições Pré e Pós Treino
  let preTrainingMealId = null;
  let postTrainingMealId = null;

  if (!isRestDay && trainingEvent) {
    const tStart = trainingEvent.startMinutes;
    const tEnd = trainingEvent.endMinutes;

    // Candidatos pré-treino
    const preCandidates = rawMeals
      .filter(m => m.scheduledMinutes < tStart && (tStart - m.scheduledMinutes) <= policy.preferredPeriEventWindowMinutes)
      .sort((a, b) => (tStart - a.scheduledMinutes) - (tStart - b.scheduledMinutes)); // mais próximo primeiro

    if (preCandidates.length > 0) {
      preTrainingMealId = preCandidates[0].mealId;
    }

    // Candidatos pós-treino
    const postCandidates = rawMeals
      .filter(m => m.scheduledMinutes > tEnd && (m.scheduledMinutes - tEnd) <= policy.preferredPeriEventWindowMinutes)
      .sort((a, b) => (a.scheduledMinutes - tEnd) - (b.scheduledMinutes - tEnd)); // mais próximo primeiro

    if (postCandidates.length > 0) {
      postTrainingMealId = postCandidates[0].mealId;
    }
  }

  // 6. Identificação Prévia de Refeições Pré e Pós Cardio
  let preCardioMealId = null;
  let postCardioMealId = null;

  if (!isRestDay && cardioEvents.length > 0) {
    const firstCardio = cardioEvents[0];
    const lastCardio = cardioEvents[cardioEvents.length - 1];

    const preCardioCandidates = rawMeals
      .filter(m => m.scheduledMinutes < firstCardio.startMinutes && (firstCardio.startMinutes - m.scheduledMinutes) <= policy.preferredPeriEventWindowMinutes)
      .sort((a, b) => (firstCardio.startMinutes - a.scheduledMinutes) - (firstCardio.startMinutes - b.scheduledMinutes));

    if (preCardioCandidates.length > 0 && preCardioCandidates[0].mealId !== preTrainingMealId) {
      preCardioMealId = preCardioCandidates[0].mealId;
    }

    const postCardioCandidates = rawMeals
      .filter(m => m.scheduledMinutes > lastCardio.endMinutes && (m.scheduledMinutes - lastCardio.endMinutes) <= policy.preferredPeriEventWindowMinutes)
      .sort((a, b) => (a.scheduledMinutes - lastCardio.endMinutes) - (b.scheduledMinutes - lastCardio.endMinutes));

    if (postCardioCandidates.length > 0 && postCardioCandidates[0].mealId !== postTrainingMealId) {
      postCardioMealId = postCardioCandidates[0].mealId;
    }
  }

  // 7. Processamento e Classificação de Cada Refeição
  const analyzedMeals = [];

  for (let i = 0; i < M; i++) {
    const meal = rawMeals[i];
    const mTime = meal.scheduledMinutes;

    let primaryRelation = TEMPORAL_PRIMARY_RELATION.NEUTRAL;
    const secondaryRelations = [];
    const eventRelations = [];
    let distanceToTrainingMinutes = null;
    let distanceToCardioMinutes = null;
    let analysisReason = '';

    // Distância até Treino
    if (trainingEvent) {
      const tStart = trainingEvent.startMinutes;
      const tEnd = trainingEvent.endMinutes;
      if (mTime < tStart) {
        distanceToTrainingMinutes = tStart - mTime;
      } else if (mTime > tEnd) {
        distanceToTrainingMinutes = mTime - tEnd;
      } else {
        distanceToTrainingMinutes = 0;
      }
    }

    // Distância até Cardio
    if (cardioEvents.length > 0) {
      let minCardioDist = null;
      cardioEvents.forEach(cev => {
        let dist = null;
        if (mTime < cev.startMinutes) dist = cev.startMinutes - mTime;
        else if (mTime > cev.endMinutes) dist = mTime - cev.endMinutes;
        else dist = 0;
        if (dist !== null && (minCardioDist === null || dist < minCardioDist)) {
          minCardioDist = dist;
        }
      });
      distanceToCardioMinutes = minCardioDist;
    } else if (unscheduledCardioCount > 0) {
      secondaryRelations.push(TEMPORAL_SECONDARY_RELATION.DATA_INSUFFICIENT);
    }

    // Tag Secundária: Âncora de Jejum
    if (eatingWindow && typeof eatingWindow.startMinutes === 'number') {
      const distFeedStart = Math.abs(mTime - eatingWindow.startMinutes);
      const distFeedEnd = Math.abs(mTime - eatingWindow.endMinutes);
      if (distFeedStart <= policy.fastingWindowAnchorThresholdMinutes ||
          distFeedEnd <= policy.fastingWindowAnchorThresholdMinutes ||
          meal.timingSource === 'FASTING_PROTOCOL') {
        secondaryRelations.push(TEMPORAL_SECONDARY_RELATION.FASTING_CONSTRAINED);
      }

      // Violação de Janela Alimentar HARD
      if (eatingWindow.strength === 'HARD' && (mTime < eatingWindow.startMinutes || mTime > eatingWindow.endMinutes)) {
        conflicts.push({
          type: 'FASTING_VIOLATION',
          severity: 'BLOCK',
          description: `Refeição '${meal.mealId}' (${meal.scheduledTime}) posicionada fora da janela alimentar estrita HARD (${eatingWindow.start} - ${eatingWindow.end}).`,
          entityId: meal.mealId
        });
        blockingReasons.push(`Refeição '${meal.mealId}' está fora da janela alimentar estrita HARD (${eatingWindow.start} - ${eatingWindow.end}).`);
      }
    }

    // A. Verificação de Colisão Física (Violação Contratual HARD)
    let collisionDetected = false;
    activeEvents.forEach(ev => {
      if (mTime >= ev.startMinutes && mTime <= ev.endMinutes) {
        collisionDetected = true;
        primaryRelation = TEMPORAL_PRIMARY_RELATION.OVERLAPPING_EVENT;
        analysisReason = `Refeição posicionada dentro do intervalo do evento de ${ev.eventType} (${ev.start} - ${ev.end}). Violação de separação temporal.`;
        conflicts.push({
          type: 'EVENT_COLLISION',
          severity: 'BLOCK',
          description: `Refeição '${meal.mealId}' (${meal.scheduledTime}) colide fisicamente com ${ev.eventType} (${ev.start} - ${ev.end}).`,
          entityId: meal.mealId
        });
        blockingReasons.push(`Refeição '${meal.mealId}' colide fisicamente com o evento ${ev.eventType} (${ev.start} - ${ev.end}). Invariante de integridade temporal violada.`);
      }
    });

    if (!collisionDetected) {
      // B. Dia de Descanso Estruturado
      if (isRestDay) {
        primaryRelation = TEMPORAL_PRIMARY_RELATION.REST_DAY;
        analysisReason = 'Refeição inserida em dia de descanso estruturado (rest === true no microciclo).';
      }
      // C. Pré-Treino de Musculação
      else if (meal.mealId === preTrainingMealId) {
        primaryRelation = TEMPORAL_PRIMARY_RELATION.PRE_TRAINING;
        analysisReason = `Refeição posicionada ${distanceToTrainingMinutes} min antes do início da sessão de musculação estruturada (${trainingEvent.start}).`;

        if (distanceToTrainingMinutes < policy.preferredMealEventSeparationMinutes) {
          secondaryRelations.push(TEMPORAL_SECONDARY_RELATION.CLOSE_EVENT_PROXIMITY);
          warnings.push(`Refeição '${meal.mealId}' posicionada a ${distanceToTrainingMinutes} min do treino, menor que a separação operacional preferencial de ${policy.preferredMealEventSeparationMinutes} min.`);
        }
      }
      // D. Pós-Treino de Musculação
      else if (meal.mealId === postTrainingMealId) {
        primaryRelation = TEMPORAL_PRIMARY_RELATION.POST_TRAINING;
        analysisReason = `Refeição posicionada ${distanceToTrainingMinutes} min após o término da sessão de musculação estruturada (${trainingEvent.end}).`;

        if (distanceToTrainingMinutes < policy.preferredMealEventSeparationMinutes) {
          secondaryRelations.push(TEMPORAL_SECONDARY_RELATION.CLOSE_EVENT_PROXIMITY);
          warnings.push(`Refeição '${meal.mealId}' posicionada a ${distanceToTrainingMinutes} min do término do treino, menor que a separação operacional preferencial de ${policy.preferredMealEventSeparationMinutes} min.`);
        }
      }
      // E. Pré-Cardio
      else if (meal.mealId === preCardioMealId) {
        primaryRelation = TEMPORAL_PRIMARY_RELATION.PRE_CARDIO;
        analysisReason = `Refeição posicionada ${distanceToCardioMinutes} min antes do início da sessão de cardio estruturada (${cardioEvents[0].start}).`;

        if (distanceToCardioMinutes !== null && distanceToCardioMinutes < policy.preferredMealEventSeparationMinutes) {
          secondaryRelations.push(TEMPORAL_SECONDARY_RELATION.CLOSE_EVENT_PROXIMITY);
          warnings.push(`Refeição '${meal.mealId}' posicionada a ${distanceToCardioMinutes} min do cardio, menor que a separação operacional preferencial de ${policy.preferredMealEventSeparationMinutes} min.`);
        }
      }
      // F. Pós-Cardio
      else if (meal.mealId === postCardioMealId) {
        primaryRelation = TEMPORAL_PRIMARY_RELATION.POST_CARDIO;
        analysisReason = `Refeição posicionada ${distanceToCardioMinutes} min após o término da sessão de cardio estruturada (${cardioEvents[cardioEvents.length - 1].end}).`;

        if (distanceToCardioMinutes !== null && distanceToCardioMinutes < policy.preferredMealEventSeparationMinutes) {
          secondaryRelations.push(TEMPORAL_SECONDARY_RELATION.CLOSE_EVENT_PROXIMITY);
          warnings.push(`Refeição '${meal.mealId}' posicionada a ${distanceToCardioMinutes} min do término do cardio, menor que a separação operacional preferencial de ${policy.preferredMealEventSeparationMinutes} min.`);
        }
      }
      // G. Entre Treino e Cardio no Mesmo Dia
      else if (trainingEvent && cardioEvents.length > 0 &&
               trainingEvent.endMinutes < cardioEvents[0].startMinutes &&
               mTime > trainingEvent.endMinutes && mTime < cardioEvents[0].startMinutes) {
        primaryRelation = TEMPORAL_PRIMARY_RELATION.BETWEEN_TRAINING_AND_CARDIO;
        analysisReason = `Refeição situada no intervalo entre a sessão de musculação (término às ${trainingEvent.end}) e a de cardio (início às ${cardioEvents[0].start}).`;
      }
      // H. Neutra
      else {
        primaryRelation = TEMPORAL_PRIMARY_RELATION.NEUTRAL;
        analysisReason = 'Refeição sem proximidade imediata com eventos de exercício físico estruturados.';
      }
    }

    analyzedMeals.push({
      mealId: meal.mealId,
      mealIndex: meal.mealIndex,
      mealName: meal.mealName,
      mealRole: meal.mealRole,
      scheduledTime: meal.scheduledTime,
      scheduledMinutes: meal.scheduledMinutes,
      intervalToNextMinutes: meal.intervalToNextMinutes,
      primaryRelation,
      secondaryRelations: [...new Set(secondaryRelations)],
      eventRelations: [...new Set(eventRelations)],
      distanceToTrainingMinutes,
      distanceToCardioMinutes,
      temporalStatus: meal.temporalStatus,
      timingReason: meal.timingReason,
      analysisReason,
      items: meal.items,
      totals: meal.totals
    });
  }

  // 8. Recomendações e Diagnósticos de Nutrient Timing (Sem Mutação de Dados)
  const clinicalObj = (context.objective && context.objective.clinicalObjective) || '';
  if (/hipertrofia|ganho de massa/i.test(clinicalObj) && postTrainingMealId) {
    const postMeal = analyzedMeals.find(m => m.mealId === postTrainingMealId);
    if (postMeal && postMeal.totals && postMeal.totals.protein < 10) {
      globalDiagnostics.push('Observação consultiva de nutrient timing: Em hipertrofia, sugere-se maior disponibilidade proteica na refeição pós-treino imediata. Prescrição conservada sem alterações.');
    }
  }

  // 9. Construção do DTO de Saída Candidato
  let finalStatus;
  let isValid;

  if (blockingReasons.length > 0) {
    finalStatus = NUTRIENT_TIMING_STATUS.BLOCKED;
    isValid = false;
  } else if (warnings.length > 0) {
    finalStatus = NUTRIENT_TIMING_STATUS.WARNING;
    isValid = true;
  } else {
    finalStatus = NUTRIENT_TIMING_STATUS.PASS;
    isValid = true;
  }

  const candidateOutput = {
    timingAnalysisVersion,
    timingVersion,
    assemblyVersion,
    solverVersion,
    status: finalStatus,
    valid: isValid,
    meals: analyzedMeals,
    mealAnalyses: analyzedMeals,
    globalDiagnostics,
    temporalEvents: activeEvents,
    conflicts,
    warnings: [...new Set(warnings)],
    blockingReasons,
    globalTotals,
    provenance: {
      engine: 'NutriAxDeterministicNutrientTiming',
      policyVersion: policy.policyVersion,
      analysisVersion: timingAnalysisVersion
    }
  };

  // 10. Validação Canônica Estrita de Invariantes
  const valResult = validateNutrientTiming(candidateOutput, mealTimingResult, input.mealAssemblyResult, policy);
  if (!valResult.isValid) {
    candidateOutput.status = NUTRIENT_TIMING_STATUS.BLOCKED;
    candidateOutput.valid = false;
    candidateOutput.blockingReasons.push(...valResult.errors);
  }

  return deepFreeze(candidateOutput);
}

module.exports = deepFreeze({
  analyzeNutrientTiming
});

  });

  // ── MÓDULO: domain/validation/globalPrescriptionValidationPolicy.js ──
  defineModule("domain/validation/globalPrescriptionValidationPolicy.js", function(require, module, exports) {
/**
 * domain/validation/globalPrescriptionValidationPolicy.js
 * 
 * Política Versionada de Validação Global da Prescrição Nutricional — NutriAx Pro.
 * Fase N3.6 — Validação Global Determinística.
 * 
 * Camada Pura — Zero I/O, sem dependências externas, parâmetros técnicos e auditáveis.
 * 
 * REGRA CANÔNICA DE TOLERÂNCIAS:
 * Zero alteração semântica downstream, com tolerâncias numéricas técnicas explicitamente
 * versionadas para absorver representação decimal e resíduos de ponto flutuante.
 */

'use strict';

const { deepFreeze } = require('../contracts/GlobalPrescriptionValidationContract');

const DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY = Object.freeze({
  version: 'N3.6.0',

  // Tolerâncias técnicas downstream (N3.2 -> N3.3 -> N3.4 -> N3.5 -> N3.6)
  massToleranceGrams: 0.01,
  calorieToleranceKcal: 0.05,
  proteinToleranceGrams: 0.05,
  carbohydrateToleranceGrams: 0.05,
  lipidToleranceGrams: 0.05,
  fiberToleranceGrams: 0.05,
  sodiumToleranceMg: 0.05,

  // Tolerância para coerência Atwater (4P + 4C + 9F vs valor fechado)
  atwaterToleranceKcal: 1.0,

  // Tratamento de Fasted Training
  allowFastedTrainingWithWarning: true,

  // Obrigatoriedade de congelamento profundo
  enforceDeepFreeze: true
});

/**
 * Cria uma instância validada e imutável de política de validação global
 * @param {Object} [overrides={}] 
 * @returns {Object}
 */
function createGlobalPrescriptionValidationPolicy(overrides = {}) {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    return DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY;
  }

  const policy = {
    version: overrides.version || DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.version,
    massToleranceGrams: typeof overrides.massToleranceGrams === 'number' && Number.isFinite(overrides.massToleranceGrams)
      ? Math.abs(overrides.massToleranceGrams)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.massToleranceGrams,
    calorieToleranceKcal: typeof overrides.calorieToleranceKcal === 'number' && Number.isFinite(overrides.calorieToleranceKcal)
      ? Math.abs(overrides.calorieToleranceKcal)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.calorieToleranceKcal,
    proteinToleranceGrams: typeof overrides.proteinToleranceGrams === 'number' && Number.isFinite(overrides.proteinToleranceGrams)
      ? Math.abs(overrides.proteinToleranceGrams)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.proteinToleranceGrams,
    carbohydrateToleranceGrams: typeof overrides.carbohydrateToleranceGrams === 'number' && Number.isFinite(overrides.carbohydrateToleranceGrams)
      ? Math.abs(overrides.carbohydrateToleranceGrams)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.carbohydrateToleranceGrams,
    lipidToleranceGrams: typeof overrides.lipidToleranceGrams === 'number' && Number.isFinite(overrides.lipidToleranceGrams)
      ? Math.abs(overrides.lipidToleranceGrams)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.lipidToleranceGrams,
    fiberToleranceGrams: typeof overrides.fiberToleranceGrams === 'number' && Number.isFinite(overrides.fiberToleranceGrams)
      ? Math.abs(overrides.fiberToleranceGrams)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.fiberToleranceGrams,
    sodiumToleranceMg: typeof overrides.sodiumToleranceMg === 'number' && Number.isFinite(overrides.sodiumToleranceMg)
      ? Math.abs(overrides.sodiumToleranceMg)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.sodiumToleranceMg,
    atwaterToleranceKcal: typeof overrides.atwaterToleranceKcal === 'number' && Number.isFinite(overrides.atwaterToleranceKcal)
      ? Math.abs(overrides.atwaterToleranceKcal)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.atwaterToleranceKcal,
    allowFastedTrainingWithWarning: overrides.allowFastedTrainingWithWarning !== undefined
      ? Boolean(overrides.allowFastedTrainingWithWarning)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.allowFastedTrainingWithWarning,
    enforceDeepFreeze: overrides.enforceDeepFreeze !== undefined
      ? Boolean(overrides.enforceDeepFreeze)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.enforceDeepFreeze
  };

  return deepFreeze(policy);
}

module.exports = deepFreeze({
  DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY,
  createGlobalPrescriptionValidationPolicy
});

  });

  // ── MÓDULO: domain/validation/globalPrescriptionValidator.js ──
  defineModule("domain/validation/globalPrescriptionValidator.js", function(require, module, exports) {
/**
 * domain/validation/globalPrescriptionValidator.js
 * 
 * Validador Global da Prescrição Nutricional — NutriAx Pro.
 * Fase N3.6 — Validação Global Determinística.
 * 
 * Camada Pura — Zero DOM, Zero Dexie/Firebase, Zero Gemini, Zero Math.random, Zero Date.now.
 * 
 * Princípio Reitor:
 * "N2/N3 prescrevem/analisam. N3.6 apenas valida a coerência global do resultado."
 * 
 * N3.6 é estritamente um validador. Não seleciona alimentos, não altera gramagens,
 * não recalcula calorias ou macros, não reagenda refeições, não altera jejum/treino.
 */

'use strict';

const {
  GLOBAL_VALIDATION_VERSION,
  GLOBAL_VALIDATION_STATUS,
  GLOBAL_GATE_ID,
  GATE_SEVERITY,
  deepFreeze,
  validateGlobalPrescriptionValidationInput
} = require('../contracts/GlobalPrescriptionValidationContract');

const {
  DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY,
  createGlobalPrescriptionValidationPolicy
} = require('./globalPrescriptionValidationPolicy');

const { extractGlobalSolutionItems } = require('../contracts/MealAssemblyContract');

/**
 * Utilitário puro de cópia profunda para verificação de imutabilidade do input
 * @param {any} val 
 * @returns {any}
 */
function cloneDeepPure(val) {
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) {
    return val.map(cloneDeepPure);
  }
  const copy = {};
  for (const k of Object.keys(val)) {
    copy[k] = cloneDeepPure(val[k]);
  }
  return copy;
}

/**
 * Compara recursivamente dois objetos puros para verificar igualdade profunda
 * @param {any} a 
 * @param {any} b 
 * @returns {boolean}
 */
function isDeepEqualPure(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return a === b;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqualPure(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!isDeepEqualPure(a[key], b[key])) return false;
  }
  return true;
}

/**
 * Extrai itens alimentares de uma refeição ou resultado de fase de forma segura
 * @param {Object} phaseResult 
 * @returns {Array<Object>}
 */
function extractItemsFromPhase(phaseResult) {
  if (!phaseResult || typeof phaseResult !== 'object') return [];
  if (Array.isArray(phaseResult.items) && phaseResult.items.length > 0) {
    return phaseResult.items;
  }
  if (Array.isArray(phaseResult.meals)) {
    const items = [];
    phaseResult.meals.forEach(m => {
      if (m && Array.isArray(m.items)) {
        items.push(...m.items);
      }
    });
    return items;
  }
  return [];
}

/**
 * Consolida gramagens por foodId
 * @param {Array<Object>} items 
 * @returns {Map<string, { foodId: string, foodName: string, grams: number }>}
 */
function aggregateFoodGrams(items) {
  const map = new Map();
  items.forEach(it => {
    if (!it || typeof it !== 'object') return;
    const foodId = String(it.foodId || it.id || '').trim();
    if (!foodId) return;
    const rawG = it.grams !== undefined ? it.grams : it.quantity;
    const grams = typeof rawG === 'number' && Number.isFinite(rawG) ? rawG : 0;
    const foodName = String(it.foodName || it.name || foodId).trim();

    if (!map.has(foodId)) {
      map.set(foodId, { foodId, foodName, grams: 0 });
    }
    map.get(foodId).grams += grams;
  });
  return map;
}

/**
 * Soma bromatológica de nutrientes de uma lista de itens
 * @param {Array<Object>} items 
 * @returns {{ calories: number, protein: number, carbohydrate: number, lipid: number, fiber: number, sodium: number|null }}
 */
function sumNutrientsFromItems(items) {
  let calories = 0;
  let protein = 0;
  let carbohydrate = 0;
  let lipid = 0;
  let fiber = 0;
  let sodiumSum = 0;
  let hasSodium = false;

  items.forEach(it => {
    if (!it || typeof it !== 'object') return;
    const n = it.nutrients || {};
    if (typeof n.calories === 'number' && Number.isFinite(n.calories)) calories += n.calories;
    if (typeof n.protein === 'number' && Number.isFinite(n.protein)) protein += n.protein;
    if (typeof n.carbohydrate === 'number' && Number.isFinite(n.carbohydrate)) carbohydrate += n.carbohydrate;
    const lip = n.lipid !== undefined ? n.lipid : n.fat;
    if (typeof lip === 'number' && Number.isFinite(lip)) lipid += lip;
    if (typeof n.fiber === 'number' && Number.isFinite(n.fiber)) fiber += n.fiber;
    if (typeof n.sodium === 'number' && Number.isFinite(n.sodium)) {
      sodiumSum += n.sodium;
      hasSodium = true;
    }
  });

  return {
    calories: Number(calories.toFixed(3)),
    protein: Number(protein.toFixed(3)),
    carbohydrate: Number(carbohydrate.toFixed(3)),
    lipid: Number(lipid.toFixed(3)),
    fiber: Number(fiber.toFixed(3)),
    sodium: hasSodium ? Number(sodiumSum.toFixed(3)) : null
  };
}

/**
 * Função principal pura: Validação Global da Prescrição Nutricional (Fase N3.6)
 * 
 * @param {Object} input DTO contendo context e resultados de N2.1 a N3.5
 * @param {Object} [customPolicy={}] Política de validação customizada opcional
 * @returns {Object} GlobalPrescriptionValidationOutputDTO profundamente congelado
 */
function validateGlobalPrescription(input, customPolicy = {}) {
  // Snapshot prévio de entrada para auditar G20 (Imutabilidade)
  const inputSnapshot = cloneDeepPure(input);

  const policy = createGlobalPrescriptionValidationPolicy(
    (input && input.options && input.options.customPolicy) || customPolicy
  );

  // 1. Validação inicial de contrato de entrada
  const inputValidation = validateGlobalPrescriptionValidationInput(input);
  if (!inputValidation.isValid) {
    return deepFreeze({
      globalValidationVersion: GLOBAL_VALIDATION_VERSION,
      status: GLOBAL_VALIDATION_STATUS.BLOCKED,
      valid: false,
      gateResults: [
        {
          gateId: GLOBAL_GATE_ID.G1_CONTEXT,
          name: 'Context & Input Contract Integrity',
          status: 'FAIL',
          severity: GATE_SEVERITY.BLOCKING,
          message: 'Falha no contrato de entrada da validação global.',
          details: { errors: inputValidation.errors }
        }
      ],
      conservationAudit: {
        isStrictlyConserved: false
      },
      temporalAudit: {
        mealsCount: 0,
        hasCollisions: false,
        hasFastedTraining: false
      },
      globalDiagnostics: ['Input inválido ou malformado fornecido à N3.6.'],
      inheritedWarnings: [],
      validationWarnings: [],
      blockingReasons: inputValidation.errors,
      globalProvenance: {
        engine: 'NutriAxGlobalPrescriptionValidator',
        validationVersion: GLOBAL_VALIDATION_VERSION,
        status: GLOBAL_VALIDATION_STATUS.BLOCKED
      }
    });
  }

  // 2. Normalização e Extração das Fases Anteriores
  const context = input.context;
  const energyTargetResult = input.energyTargetResult ||
    (input.macroTargetResult && input.macroTargetResult.energyResult) ||
    (context && context.energy) || null;
  const macroTargetResult = input.macroTargetResult || null;
  const nutritionValidatorResult = input.nutritionValidatorResult || null;
  const foodSolverResult = input.foodSolverResult || null;
  const mealAssemblyResult = input.mealAssemblyResult || null;
  const mealTimingResult = input.mealTimingResult ||
    (input.nutrientTimingResult && input.nutrientTimingResult.sourceTimingResult) || null;
  const nutrientTimingResult = input.nutrientTimingResult || null;

  const gateResults = [];
  const globalDiagnostics = [];
  const inheritedWarnings = [];
  const validationWarnings = [];
  const blockingReasons = [];

  function recordGate(gateId, name, status, severity, message, details = {}) {
    gateResults.push({
      gateId,
      name,
      status,
      severity,
      message,
      details
    });

    if (status === 'FAIL') {
      if (severity === GATE_SEVERITY.BLOCKING) {
        blockingReasons.push(`[${gateId}] ${message}`);
      } else if (severity === GATE_SEVERITY.WARNING) {
        validationWarnings.push(`[${gateId}] ${message}`);
      }
    } else if (status === 'WARNING') {
      validationWarnings.push(`[${gateId}] ${message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G1 — CONTEXT INTEGRITY
  // ─────────────────────────────────────────────────────────────────────────
  if (!context || typeof context !== 'object') {
    recordGate(GLOBAL_GATE_ID.G1_CONTEXT, 'Context Integrity', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Contexto canônico N1.1 ausente ou inválido.');
  } else {
    const p = context.patient;
    const a = context.anthropometry;
    const isContextPlausible = p && typeof p === 'object' && a && typeof a === 'object' &&
      typeof a.weightKg === 'number' && a.weightKg > 0 &&
      typeof a.heightCm === 'number' && a.heightCm > 0;

    if (!isContextPlausible) {
      recordGate(GLOBAL_GATE_ID.G1_CONTEXT, 'Context Integrity', 'FAIL', GATE_SEVERITY.BLOCKING,
        'Contexto canônico contém dados antropométricos ausentes ou não-plausíveis.');
    } else {
      recordGate(GLOBAL_GATE_ID.G1_CONTEXT, 'Context Integrity', 'PASS', GATE_SEVERITY.INFORMATIONAL,
        'Contexto canônico N1.1 íntegro e consistente.');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G2 — N2.1 COMPLIANCE (Energy Target)
  // ─────────────────────────────────────────────────────────────────────────
  if (!energyTargetResult || typeof energyTargetResult !== 'object') {
    recordGate(GLOBAL_GATE_ID.G2_ENERGY_TARGET, 'N2.1 Energy Target Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Resultado energético N2.1 ausente.');
  } else {
    if (energyTargetResult.status === 'BLOCKED') {
      recordGate(GLOBAL_GATE_ID.G2_ENERGY_TARGET, 'N2.1 Energy Target Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        'Fase N2.1 possui status BLOCKED.', { blockingReasons: energyTargetResult.blockingReasons || [] });
    } else {
      const cTarget = energyTargetResult.caloricTargetKcal;
      const tmb = energyTargetResult.tmbKcal;
      const get = energyTargetResult.getKcal;
      const isNum = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

      if (!isNum(cTarget) || !isNum(tmb) || !isNum(get)) {
        recordGate(GLOBAL_GATE_ID.G2_ENERGY_TARGET, 'N2.1 Energy Target Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
          'Valores energéticos de N2.1 (caloricTargetKcal, tmbKcal, getKcal) devem ser números positivos finitos.');
      } else {
        recordGate(GLOBAL_GATE_ID.G2_ENERGY_TARGET, 'N2.1 Energy Target Compliance', 'PASS', GATE_SEVERITY.INFORMATIONAL,
          'Meta energética N2.1 válida e homologada.', { caloricTargetKcal: cTarget, tmbKcal: tmb, getKcal: get });
      }
    }
    if (Array.isArray(energyTargetResult.warnings)) {
      inheritedWarnings.push(...energyTargetResult.warnings.map(w => `[N2.1] ${w}`));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G3 — N2.2 COMPLIANCE (Macro Targets)
  // ─────────────────────────────────────────────────────────────────────────
  if (!macroTargetResult || typeof macroTargetResult !== 'object') {
    recordGate(GLOBAL_GATE_ID.G3_MACRO_TARGET, 'N2.2 Macro Targets Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Resultado de macronutrientes N2.2 ausente.');
  } else {
    if (macroTargetResult.status === 'BLOCKED') {
      recordGate(GLOBAL_GATE_ID.G3_MACRO_TARGET, 'N2.2 Macro Targets Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        'Fase N2.2 possui status BLOCKED.', { blockingReasons: macroTargetResult.blockingReasons || [] });
    } else {
      const p = macroTargetResult.proteinTargetG;
      const c = macroTargetResult.carbohydrateTargetG;
      const f = macroTargetResult.fatTargetG;
      const isNum = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

      if (!isNum(p) || !isNum(c) || !isNum(f)) {
        recordGate(GLOBAL_GATE_ID.G3_MACRO_TARGET, 'N2.2 Macro Targets Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
          'Metas de macronutrientes N2.2 (P, C, G) devem ser números finitos não-negativos.');
      } else {
        recordGate(GLOBAL_GATE_ID.G3_MACRO_TARGET, 'N2.2 Macro Targets Compliance', 'PASS', GATE_SEVERITY.INFORMATIONAL,
          'Metas de macronutrientes N2.2 válidas e homologadas.', { proteinTargetG: p, carbohydrateTargetG: c, fatTargetG: f });
      }
    }
    if (Array.isArray(macroTargetResult.warnings)) {
      inheritedWarnings.push(...macroTargetResult.warnings.map(w => `[N2.2] ${w}`));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G4 — N2.3 QUALITY GATE (Nutrition Target Validator)
  // ─────────────────────────────────────────────────────────────────────────
  if (!nutritionValidatorResult || typeof nutritionValidatorResult !== 'object') {
    recordGate(GLOBAL_GATE_ID.G4_NUTRITION_VALIDATOR, 'N2.3 Nutrition Target Quality Gate', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Resultado do validador nutricional N2.3 ausente.');
  } else {
    if (nutritionValidatorResult.valid !== true || nutritionValidatorResult.status === 'BLOCKED') {
      recordGate(GLOBAL_GATE_ID.G4_NUTRITION_VALIDATOR, 'N2.3 Nutrition Target Quality Gate', 'FAIL', GATE_SEVERITY.BLOCKING,
        'Portão de qualidade N2.3 reprovado (valid !== true ou status BLOCKED).', {
          blockingReasons: nutritionValidatorResult.blockingReasons || []
        });
    } else {
      const gateStatus = nutritionValidatorResult.status === 'WARNING' ? 'WARNING' : 'PASS';
      recordGate(GLOBAL_GATE_ID.G4_NUTRITION_VALIDATOR, 'N2.3 Nutrition Target Quality Gate', gateStatus, GATE_SEVERITY.INFORMATIONAL,
        `Portão de qualidade N2.3 aprovado (${gateStatus}).`);
    }
    if (Array.isArray(nutritionValidatorResult.warnings)) {
      inheritedWarnings.push(...nutritionValidatorResult.warnings.map(w => `[N2.3] ${w}`));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G5 — N3.2 COMPLIANCE (Food Solver)
  // ─────────────────────────────────────────────────────────────────────────
  let solverItems = [];
  if (!foodSolverResult || typeof foodSolverResult !== 'object') {
    recordGate(GLOBAL_GATE_ID.G5_FOOD_SOLVER, 'N3.2 Food Solver Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Resultado do Food Solver N3.2 ausente.');
  } else {
    solverItems = extractGlobalSolutionItems(foodSolverResult);
    if (foodSolverResult.valid !== true || foodSolverResult.status === 'BLOCKED' || foodSolverResult.status === 'NO_SOLUTION') {
      recordGate(GLOBAL_GATE_ID.G5_FOOD_SOLVER, 'N3.2 Food Solver Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        `Food Solver N3.2 inválido ou sem solução (status "${foodSolverResult.status}").`);
    } else if (solverItems.length === 0) {
      recordGate(GLOBAL_GATE_ID.G5_FOOD_SOLVER, 'N3.2 Food Solver Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        'Food Solver N3.2 gerou uma cesta de alimentos vazia.');
    } else {
      recordGate(GLOBAL_GATE_ID.G5_FOOD_SOLVER, 'N3.2 Food Solver Compliance', 'PASS', GATE_SEVERITY.INFORMATIONAL,
        'Food Solver N3.2 convergido com sucesso.', { foodsCount: solverItems.length });
    }
    if (Array.isArray(foodSolverResult.warnings)) {
      inheritedWarnings.push(...foodSolverResult.warnings.map(w => `[N3.2] ${w}`));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G6 — N3.3 COMPLIANCE (Meal Assembly)
  // ─────────────────────────────────────────────────────────────────────────
  let assemblyItems = [];
  if (!mealAssemblyResult || typeof mealAssemblyResult !== 'object') {
    recordGate(GLOBAL_GATE_ID.G6_MEAL_ASSEMBLY, 'N3.3 Meal Assembly Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Resultado do Meal Assembly N3.3 ausente.');
  } else {
    assemblyItems = extractItemsFromPhase(mealAssemblyResult);
    if (mealAssemblyResult.valid !== true || mealAssemblyResult.status === 'BLOCKED' || mealAssemblyResult.status === 'NO_SOLUTION') {
      recordGate(GLOBAL_GATE_ID.G6_MEAL_ASSEMBLY, 'N3.3 Meal Assembly Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        `Meal Assembly N3.3 inválido ou bloqueado (status "${mealAssemblyResult.status}").`);
    } else if (!Array.isArray(mealAssemblyResult.meals) || mealAssemblyResult.meals.length === 0) {
      recordGate(GLOBAL_GATE_ID.G6_MEAL_ASSEMBLY, 'N3.3 Meal Assembly Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        'Meal Assembly N3.3 não produziu refeições estruturadas.');
    } else {
      recordGate(GLOBAL_GATE_ID.G6_MEAL_ASSEMBLY, 'N3.3 Meal Assembly Compliance', 'PASS', GATE_SEVERITY.INFORMATIONAL,
        'Meal Assembly N3.3 estruturado e válido.', { mealsCount: mealAssemblyResult.meals.length });
    }
    if (Array.isArray(mealAssemblyResult.warnings) && mealAssemblyResult.warnings.length > 0) {
      const solverWarnSet = new Set(Array.isArray(foodSolverResult?.warnings) ? foodSolverResult.warnings : []);
      const assemblyOnlyWarnings = mealAssemblyResult.warnings.filter(w => !solverWarnSet.has(w));
      if (assemblyOnlyWarnings.length > 0) {
        inheritedWarnings.push(...assemblyOnlyWarnings.map(w => `[N3.3] ${w}`));
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G7 — N3.4 COMPLIANCE (Meal Timing)
  // ─────────────────────────────────────────────────────────────────────────
  let timingItems = [];
  if (!mealTimingResult || typeof mealTimingResult !== 'object') {
    recordGate(GLOBAL_GATE_ID.G7_MEAL_TIMING, 'N3.4 Meal Timing Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Resultado do Meal Timing N3.4 ausente.');
  } else {
    timingItems = extractItemsFromPhase(mealTimingResult);
    if (mealTimingResult.valid !== true || mealTimingResult.status === 'BLOCKED') {
      recordGate(GLOBAL_GATE_ID.G7_MEAL_TIMING, 'N3.4 Meal Timing Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        `Meal Timing N3.4 inválido ou bloqueado (status "${mealTimingResult.status}").`);
    } else if (!Array.isArray(mealTimingResult.meals) || mealTimingResult.meals.length === 0) {
      recordGate(GLOBAL_GATE_ID.G7_MEAL_TIMING, 'N3.4 Meal Timing Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        'Meal Timing N3.4 não possui refeições agendadas.');
    } else {
      recordGate(GLOBAL_GATE_ID.G7_MEAL_TIMING, 'N3.4 Meal Timing Compliance', 'PASS', GATE_SEVERITY.INFORMATIONAL,
        'Meal Timing N3.4 válido e agendado.');
    }
    if (Array.isArray(mealTimingResult.warnings) && mealTimingResult.warnings.length > 0) {
      const assemblyWarnSet = new Set(Array.isArray(mealAssemblyResult?.warnings) ? mealAssemblyResult.warnings : []);
      const timingOnlyWarnings = mealTimingResult.warnings.filter(w => !assemblyWarnSet.has(w));
      if (timingOnlyWarnings.length > 0) {
        inheritedWarnings.push(...timingOnlyWarnings.map(w => `[N3.4] ${w}`));
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G8 — N3.5 COMPLIANCE (Nutrient Timing)
  // ─────────────────────────────────────────────────────────────────────────
  let finalItems = [];
  const finalMeals = (nutrientTimingResult && Array.isArray(nutrientTimingResult.meals))
    ? nutrientTimingResult.meals
    : [];

  if (!nutrientTimingResult || typeof nutrientTimingResult !== 'object') {
    recordGate(GLOBAL_GATE_ID.G8_NUTRIENT_TIMING, 'N3.5 Nutrient Timing Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Resultado de Nutrient Timing N3.5 ausente.');
  } else {
    finalItems = extractItemsFromPhase(nutrientTimingResult);
    if (nutrientTimingResult.valid !== true || nutrientTimingResult.status === 'BLOCKED') {
      recordGate(GLOBAL_GATE_ID.G8_NUTRIENT_TIMING, 'N3.5 Nutrient Timing Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        `Nutrient Timing N3.5 inválido ou bloqueado (status "${nutrientTimingResult.status}").`);
    } else if (finalMeals.length === 0) {
      recordGate(GLOBAL_GATE_ID.G8_NUTRIENT_TIMING, 'N3.5 Nutrient Timing Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        'Nutrient Timing N3.5 não contém refeições analisadas.');
    } else {
      recordGate(GLOBAL_GATE_ID.G8_NUTRIENT_TIMING, 'N3.5 Nutrient Timing Compliance', 'PASS', GATE_SEVERITY.INFORMATIONAL,
        'Nutrient Timing N3.5 validado com sucesso.');
    }
    if (Array.isArray(nutrientTimingResult.warnings) && nutrientTimingResult.warnings.length > 0) {
      const timingWarnSet = new Set(Array.isArray(mealTimingResult?.warnings) ? mealTimingResult.warnings : []);
      const nutrientTimingOnlyWarnings = nutrientTimingResult.warnings.filter(w => !timingWarnSet.has(w));
      if (nutrientTimingOnlyWarnings.length > 0) {
        inheritedWarnings.push(...nutrientTimingOnlyWarnings.map(w => `[N3.5] ${w}`));
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G9 — FOOD IDENTITY (N3.2 -> N3.3 -> N3.4 -> N3.5)
  // ─────────────────────────────────────────────────────────────────────────
  const solverFoodsMap = aggregateFoodGrams(solverItems);
  const finalFoodsMap = aggregateFoodGrams(finalItems);

  const solverFoodIds = new Set(solverFoodsMap.keys());
  const finalFoodIds = new Set(finalFoodsMap.keys());

  const missingInFinal = [];
  const inventedInFinal = [];

  solverFoodIds.forEach(id => {
    if (!finalFoodIds.has(id)) missingInFinal.push(id);
  });

  finalFoodIds.forEach(id => {
    if (!solverFoodIds.has(id)) inventedInFinal.push(id);
  });

  if (missingInFinal.length > 0 || inventedInFinal.length > 0) {
    recordGate(GLOBAL_GATE_ID.G9_FOOD_IDENTITY, 'Food Identity Invariant', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Quebra de identidade de alimentos entre N3.2 e N3.5.', {
        missingInFinal,
        inventedInFinal
      });
  } else {
    recordGate(GLOBAL_GATE_ID.G9_FOOD_IDENTITY, 'Food Identity Invariant', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Identidade canônica dos alimentos 100% preservada de N3.2 a N3.5.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G10 — MASS CONSERVATION (N3.2 -> N3.5)
  // ─────────────────────────────────────────────────────────────────────────
  let solverTotalMass = 0;
  let finalTotalMass = 0;
  const massDivergences = [];

  solverFoodsMap.forEach((sData, fId) => {
    solverTotalMass += sData.grams;
    const fData = finalFoodsMap.get(fId);
    const fGrams = fData ? fData.grams : 0;
    const delta = Math.abs(fGrams - sData.grams);
    if (delta > policy.massToleranceGrams) {
      massDivergences.push({
        foodId: fId,
        solverGrams: sData.grams,
        finalGrams: fGrams,
        deltaGrams: Number(delta.toFixed(4))
      });
    }
  });

  finalFoodsMap.forEach(fData => {
    finalTotalMass += fData.grams;
  });

  const deltaTotalMass = Math.abs(finalTotalMass - solverTotalMass);
  if (deltaTotalMass > policy.massToleranceGrams || massDivergences.length > 0) {
    recordGate(GLOBAL_GATE_ID.G10_MASS_CONSERVATION, 'Mass Conservation Invariant', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Quebra na conservação de massa downstream entre o Solver e as refeições finais.', {
        deltaTotalMass: Number(deltaTotalMass.toFixed(4)),
        tolerance: policy.massToleranceGrams,
        massDivergences
      });
  } else {
    recordGate(GLOBAL_GATE_ID.G10_MASS_CONSERVATION, 'Mass Conservation Invariant', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Massa total de alimentos 100% conservada downstream.', {
        totalGrams: Number(finalTotalMass.toFixed(2)),
        deltaTotalMass: Number(deltaTotalMass.toFixed(4))
      });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G11 — NUTRIENT CONSERVATION (N3.2 -> N3.5)
  // ─────────────────────────────────────────────────────────────────────────
  const solverNutrients = sumNutrientsFromItems(solverItems);
  const finalNutrients = sumNutrientsFromItems(finalItems);

  const deltaCalories = Math.abs(finalNutrients.calories - solverNutrients.calories);
  const deltaProtein = Math.abs(finalNutrients.protein - solverNutrients.protein);
  const deltaCarbs = Math.abs(finalNutrients.carbohydrate - solverNutrients.carbohydrate);
  const deltaLipid = Math.abs(finalNutrients.lipid - solverNutrients.lipid);
  const deltaFiber = Math.abs(finalNutrients.fiber - solverNutrients.fiber);

  let deltaSodium = 0;
  let sodiumChecked = false;
  if (solverNutrients.sodium !== null && finalNutrients.sodium !== null) {
    deltaSodium = Math.abs(finalNutrients.sodium - solverNutrients.sodium);
    sodiumChecked = true;
  }

  const nutrientBreaks = [];
  if (deltaCalories > policy.calorieToleranceKcal) {
    nutrientBreaks.push(`Calorias divergem (Δ=${deltaCalories.toFixed(3)} > ${policy.calorieToleranceKcal})`);
  }
  if (deltaProtein > policy.proteinToleranceGrams) {
    nutrientBreaks.push(`Proteína diverge (Δ=${deltaProtein.toFixed(3)} > ${policy.proteinToleranceGrams})`);
  }
  if (deltaCarbs > policy.carbohydrateToleranceGrams) {
    nutrientBreaks.push(`Carboidrato diverge (Δ=${deltaCarbs.toFixed(3)} > ${policy.carbohydrateToleranceGrams})`);
  }
  if (deltaLipid > policy.lipidToleranceGrams) {
    nutrientBreaks.push(`Lipídios divergem (Δ=${deltaLipid.toFixed(3)} > ${policy.lipidToleranceGrams})`);
  }
  if (deltaFiber > policy.fiberToleranceGrams) {
    nutrientBreaks.push(`Fibra diverge (Δ=${deltaFiber.toFixed(3)} > ${policy.fiberToleranceGrams})`);
  }
  if (sodiumChecked && deltaSodium > policy.sodiumToleranceMg) {
    nutrientBreaks.push(`Sódio diverge (Δ=${deltaSodium.toFixed(3)} > ${policy.sodiumToleranceMg})`);
  }

  if (nutrientBreaks.length > 0) {
    recordGate(GLOBAL_GATE_ID.G11_NUTRIENT_CONSERVATION, 'Nutrient Conservation Invariant', 'FAIL', GATE_SEVERITY.BLOCKING,
      `Quebra de conservação nutricional entre Solver N3.2 e refeições finais: ${nutrientBreaks.join(', ')}.`, {
        nutrientBreaks,
        solverNutrients,
        finalNutrients
      });
  } else {
    recordGate(GLOBAL_GATE_ID.G11_NUTRIENT_CONSERVATION, 'Nutrient Conservation Invariant', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Nutrientes estritamente conservados downstream.', {
        deltaCalories: Number(deltaCalories.toFixed(3)),
        deltaProtein: Number(deltaProtein.toFixed(3)),
        deltaCarbs: Number(deltaCarbs.toFixed(3)),
        deltaLipid: Number(deltaLipid.toFixed(3)),
        deltaFiber: Number(deltaFiber.toFixed(3)),
        deltaSodium: sodiumChecked ? Number(deltaSodium.toFixed(3)) : null
      });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G12 — ATWATER CLOSURE (Consistência 4P + 4C + 9G)
  // ─────────────────────────────────────────────────────────────────────────
  const atwaterCalculatedKcal = Number((
    (4 * finalNutrients.protein) +
    (4 * finalNutrients.carbohydrate) +
    (9 * finalNutrients.lipid)
  ).toFixed(3));

  // Comparar Atwater dos macros finais com as calorias somadas dos alimentos
  const deltaAtwaterClosure = Math.abs(atwaterCalculatedKcal - finalNutrients.calories);
  if (deltaAtwaterClosure > policy.atwaterToleranceKcal) {
    recordGate(GLOBAL_GATE_ID.G12_ATWATER_CLOSURE, 'Atwater Energy Closure', 'FAIL', GATE_SEVERITY.BLOCKING,
      `Fechamento Atwater diverge da soma calórica dos alimentos (Δ=${deltaAtwaterClosure.toFixed(2)} kcal > ${policy.atwaterToleranceKcal} kcal).`, {
        atwaterCalculatedKcal,
        finalNutrientsCalories: finalNutrients.calories,
        deltaAtwaterClosure
      });
  } else {
    recordGate(GLOBAL_GATE_ID.G12_ATWATER_CLOSURE, 'Atwater Energy Closure', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Fechamento calórico Atwater (4P + 4C + 9F) consistente.', {
        atwaterCalculatedKcal,
        finalNutrientsCalories: finalNutrients.calories,
        deltaKcal: Number(deltaAtwaterClosure.toFixed(3))
      });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G13 — MEAL IDENTITY (N3.3 -> N3.4 -> N3.5)
  // ─────────────────────────────────────────────────────────────────────────
  const assemblyMeals = (mealAssemblyResult && Array.isArray(mealAssemblyResult.meals)) ? mealAssemblyResult.meals : [];
  const timingMeals = (mealTimingResult && Array.isArray(mealTimingResult.meals)) ? mealTimingResult.meals : [];

  let mealIdentityBreak = false;
  const mealIdentityDetails = [];

  if (assemblyMeals.length > 0 && finalMeals.length !== assemblyMeals.length) {
    mealIdentityBreak = true;
    mealIdentityDetails.push(`Contagem de refeições divergiu: N3.3 continha ${assemblyMeals.length}, N3.5 contém ${finalMeals.length}.`);
  }
  if (timingMeals.length > 0 && finalMeals.length !== timingMeals.length) {
    mealIdentityBreak = true;
    mealIdentityDetails.push(`Contagem de refeições divergiu: N3.4 continha ${timingMeals.length}, N3.5 contém ${finalMeals.length}.`);
  }

  const minLen = Math.min(assemblyMeals.length, finalMeals.length);
  for (let i = 0; i < minLen; i++) {
    const am = assemblyMeals[i];
    const fm = finalMeals[i];
    if (am.mealId !== fm.mealId) {
      mealIdentityBreak = true;
      mealIdentityDetails.push(`Refeição no índice ${i} teve mealId alterado ("${am.mealId}" -> "${fm.mealId}").`);
    }
    if (am.mealIndex !== fm.mealIndex) {
      mealIdentityBreak = true;
      mealIdentityDetails.push(`Refeição "${am.mealId}" teve mealIndex alterado (${am.mealIndex} -> ${fm.mealIndex}).`);
    }
    if (am.mealRole && fm.mealRole && am.mealRole !== fm.mealRole) {
      mealIdentityBreak = true;
      mealIdentityDetails.push(`Refeição "${am.mealId}" teve mealRole alterado ("${am.mealRole}" -> "${fm.mealRole}").`);
    }
  }

  if (mealIdentityBreak) {
    recordGate(GLOBAL_GATE_ID.G13_MEAL_IDENTITY, 'Meal Identity Invariant', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Violação de identidade de refeições downstream.', { details: mealIdentityDetails });
  } else {
    recordGate(GLOBAL_GATE_ID.G13_MEAL_IDENTITY, 'Meal Identity Invariant', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Identidade, quantidade e papéis de refeições 100% preservados downstream.', { mealsCount: finalMeals.length });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G14 — TEMPORAL INTEGRITY (N3.4 -> N3.5)
  // ─────────────────────────────────────────────────────────────────────────
  let temporalBreak = false;
  const temporalBreakDetails = [];

  for (let i = 0; i < Math.min(timingMeals.length, finalMeals.length); i++) {
    const tm = timingMeals[i];
    const fm = finalMeals[i];
    if (tm.scheduledTime !== fm.scheduledTime) {
      temporalBreak = true;
      temporalBreakDetails.push(`Refeição "${fm.mealId}": scheduledTime alterado ("${tm.scheduledTime}" -> "${fm.scheduledTime}").`);
    }
    if (tm.scheduledMinutes !== fm.scheduledMinutes) {
      temporalBreak = true;
      temporalBreakDetails.push(`Refeição "${fm.mealId}": scheduledMinutes alterado (${tm.scheduledMinutes} -> ${fm.scheduledMinutes}).`);
    }
  }

  if (temporalBreak) {
    recordGate(GLOBAL_GATE_ID.G14_TEMPORAL_INTEGRITY, 'Temporal Schedule Integrity', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Horários das refeições agendadas na N3.4 foram alterados ou corrompidos na N3.5.', { details: temporalBreakDetails });
  } else {
    recordGate(GLOBAL_GATE_ID.G14_TEMPORAL_INTEGRITY, 'Temporal Schedule Integrity', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Horários e minutos cronológicos intactos entre N3.4 e N3.5.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G15 — EVENT TRACEABILITY (Treino e Cardio)
  // ─────────────────────────────────────────────────────────────────────────
  const trainingContext = context && context.training;
  const cardioContext = context && context.cardio;

  let eventTraceWarning = false;
  const eventWarnings = [];

  if (trainingContext && trainingContext.hasActiveTraining) {
    if (!trainingContext.workoutTime) {
      eventTraceWarning = true;
      eventWarnings.push('Treino ativo declarado no contexto, mas workoutTime não foi informado (DATA_INSUFFICIENT).');
    }
  }

  if (cardioContext && cardioContext.hasActiveCardio) {
    const hasCardioWithoutTime = Array.isArray(cardioContext.sessions) &&
      cardioContext.sessions.some(s => s && !s.startTime && !s.workoutTime);
    if (hasCardioWithoutTime) {
      eventTraceWarning = true;
      eventWarnings.push('Sessão de cardio ativa declarada sem horário de início estruturado (DATA_INSUFFICIENT).');
    }
  }

  if (eventTraceWarning) {
    recordGate(GLOBAL_GATE_ID.G15_EVENT_TRACEABILITY, 'Event Traceability & Completeness', 'WARNING', GATE_SEVERITY.WARNING,
      'Eventos de exercício físico possuem dados opcionais insuficientes para cálculo peri-evento exato.', {
        warnings: eventWarnings
      });
  } else {
    recordGate(GLOBAL_GATE_ID.G15_EVENT_TRACEABILITY, 'Event Traceability & Completeness', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Rastreabilidade de eventos estruturados de treino e cardio em conformidade.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G16 — FASTING COHERENCE (Jejum Intermitente)
  // ─────────────────────────────────────────────────────────────────────────
  const fastingContext = context && context.fasting;
  let fastingBlocked = false;
  let fastingWarning = false;
  const fastingDetails = [];

  const eatingWindow = (mealTimingResult && mealTimingResult.eatingWindow) || null;

  if (fastingContext && fastingContext.hasActiveProtocol) {
    const isHardWindow = eatingWindow && eatingWindow.strength === 'HARD';
    
    // Verificar se alguma refeição ficou fora da janela de alimentação declarada
    if (eatingWindow && typeof eatingWindow.startMinutes === 'number' && typeof eatingWindow.endMinutes === 'number') {
      finalMeals.forEach(m => {
        if (typeof m.scheduledMinutes === 'number') {
          const isOutside = m.scheduledMinutes < eatingWindow.startMinutes || m.scheduledMinutes > eatingWindow.endMinutes;
          if (isOutside) {
            if (isHardWindow) {
              fastingBlocked = true;
              fastingDetails.push(`Refeição "${m.mealId}" agendada às ${m.scheduledTime} viola janela HARD (${eatingWindow.start} - ${eatingWindow.end}).`);
            } else {
              fastingWarning = true;
              fastingDetails.push(`Refeição "${m.mealId}" agendada às ${m.scheduledTime} fora da janela PREFERRED (${eatingWindow.start} - ${eatingWindow.end}).`);
            }
          }
        }
      });
    }

    // Fasted Training
    const hasFastedTraining = finalMeals.some(m =>
      Array.isArray(m.secondaryRelations) && m.secondaryRelations.includes('FASTING_CONSTRAINED')
    ) || (nutrientTimingResult && nutrientTimingResult.diagnostics &&
      nutrientTimingResult.diagnostics.some(d => /FASTED_TRAINING/i.test(d)));

    if (hasFastedTraining) {
      if (policy.allowFastedTrainingWithWarning) {
        fastingWarning = true;
        fastingDetails.push('Treino em jejum identificado. Registrado como observação operacional.');
      }
    }
  }

  if (fastingBlocked) {
    recordGate(GLOBAL_GATE_ID.G16_FASTING_COHERENCE, 'Fasting Protocol Coherence', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Violação estrita do protocolo de jejum intermitente (janela HARD).', { details: fastingDetails });
  } else if (fastingWarning) {
    recordGate(GLOBAL_GATE_ID.G16_FASTING_COHERENCE, 'Fasting Protocol Coherence', 'WARNING', GATE_SEVERITY.WARNING,
      'Observações contextuais sobre protocolo de jejum / fasted training.', { details: fastingDetails });
  } else {
    recordGate(GLOBAL_GATE_ID.G16_FASTING_COHERENCE, 'Fasting Protocol Coherence', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Protocolo de jejum e janela alimentar coerentes ou inativos.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G17 — NUTRIENT TIMING INTEGRITY (Classificações e ausência de colisão)
  // ─────────────────────────────────────────────────────────────────────────
  let hasCollision = false;
  finalMeals.forEach(m => {
    if (m.primaryRelation === 'OVERLAPPING_EVENT') {
      hasCollision = true;
    }
  });

  if (hasCollision) {
    recordGate(GLOBAL_GATE_ID.G17_NUTRIENT_TIMING_INTEGRITY, 'Nutrient Timing Integrity', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Refeição com colisão física temporal com sessão de exercício (OVERLAPPING_EVENT). Proibido aprovar.');
  } else {
    recordGate(GLOBAL_GATE_ID.G17_NUTRIENT_TIMING_INTEGRITY, 'Nutrient Timing Integrity', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Classificações de nutrient timing válidas e livres de sobreposição física.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G18 — GLOBAL PROVENANCE INTEGRITY
  // ─────────────────────────────────────────────────────────────────────────
  const globalProvenance = {
    engine: 'NutriAxGlobalPrescriptionValidator',
    validationVersion: GLOBAL_VALIDATION_VERSION,
    chainVersions: {
      context: (context && context.schemaVersion) || '1.0.0',
      n21_energy: (energyTargetResult && energyTargetResult.provenance && energyTargetResult.provenance.policyVersion) || 'N2.1.0',
      n22_macro: (macroTargetResult && macroTargetResult.provenance && macroTargetResult.provenance.policyVersion) || 'N2.2.0',
      n23_validator: (nutritionValidatorResult && nutritionValidatorResult.validationVersion) || 'N2.3.0',
      n32_solver: (foodSolverResult && foodSolverResult.solverVersion) || 'N3.2.0',
      n33_assembly: (mealAssemblyResult && mealAssemblyResult.assemblyVersion) || 'N3.3.0',
      n34_timing: (mealTimingResult && mealTimingResult.timingVersion) || 'N3.4.0',
      n35_nutrientTiming: (nutrientTimingResult && nutrientTimingResult.timingAnalysisVersion) || 'N3.5.0'
    },
    traceabilitySummary: {
      q1_targetEnergetico: {
        caloricTargetKcal: energyTargetResult ? energyTargetResult.caloricTargetKcal : null,
        tmbKcal: energyTargetResult ? energyTargetResult.tmbKcal : null,
        getKcal: energyTargetResult ? energyTargetResult.getKcal : null,
        energyBalanceKcal: energyTargetResult ? energyTargetResult.energyBalanceKcal : null,
        sourcePhase: 'N2.1'
      },
      q2_politicaEnergetica: {
        policyVersion: energyTargetResult?.provenance?.policyVersion || 'DEFAULT',
        appliedRule: energyTargetResult?.provenance?.rule || 'DETERMINISTIC_TARGET',
        sourcePhase: 'N2.1'
      },
      q3_macrosHomologados: {
        proteinTargetG: macroTargetResult ? macroTargetResult.proteinTargetG : null,
        carbohydrateTargetG: macroTargetResult ? macroTargetResult.carbohydrateTargetG : null,
        fatTargetG: macroTargetResult ? macroTargetResult.fatTargetG : null,
        closedKcal: atwaterCalculatedKcal,
        sourcePhase: 'N2.2'
      },
      q4_alimentosSelecionados: {
        foodsCount: solverFoodIds.size,
        foodIds: Array.from(solverFoodIds),
        sourcePhase: 'N3.2'
      },
      q5_solucaoSolver: {
        status: foodSolverResult ? foodSolverResult.status : null,
        cost: foodSolverResult ? foodSolverResult.cost : null,
        solverKcal: solverNutrients.calories,
        sourcePhase: 'N3.2'
      },
      q6_distribuicaoRefeicoes: {
        mealsCount: finalMeals.length,
        massConservation: deltaTotalMass <= policy.massToleranceGrams ? 'EXACT' : 'DIVERGENT',
        sourcePhase: 'N3.3'
      },
      q7_horariosAtribuidos: {
        eatingWindow: eatingWindow ? `${eatingWindow.start} - ${eatingWindow.end}` : null,
        windowStrength: eatingWindow ? eatingWindow.strength : null,
        mealsSchedule: finalMeals.map(m => ({ mealId: m.mealId, scheduledTime: m.scheduledTime })),
        sourcePhase: 'N3.4'
      },
      q8_relacaoTemporalDetectada: {
        mealsRelations: finalMeals.map(m => ({
          mealId: m.mealId,
          primaryRelation: m.primaryRelation,
          secondaryRelations: m.secondaryRelations || []
        })),
        sourcePhase: 'N3.5'
      },
      q9_warningsExistentes: {
        inheritedCount: inheritedWarnings.length,
        validationCount: validationWarnings.length,
        totalWarnings: inheritedWarnings.length + validationWarnings.length
      },
      q10_motivoStatusFinal: {
        provisionalStatus: blockingReasons.length > 0
          ? GLOBAL_VALIDATION_STATUS.BLOCKED
          : ((inheritedWarnings.length > 0 || validationWarnings.length > 0)
            ? GLOBAL_VALIDATION_STATUS.WARNING
            : GLOBAL_VALIDATION_STATUS.PASS),
        blockingCount: blockingReasons.length
      }
    }
  };

  recordGate(GLOBAL_GATE_ID.G18_PROVENANCE_INTEGRITY, 'Global Provenance Integrity', 'PASS', GATE_SEVERITY.INFORMATIONAL,
    'Árvore de proveniência unificada de ponta a ponta (N2.1 a N3.6) montada com sucesso.');

  // ─────────────────────────────────────────────────────────────────────────
  // G19 — DETERMINISM
  // ─────────────────────────────────────────────────────────────────────────
  recordGate(GLOBAL_GATE_ID.G19_DETERMINISM, 'Determinism Invariant', 'PASS', GATE_SEVERITY.INFORMATIONAL,
    'Função de validação estritamente determinística, com avaliação pura e idempotente sem efeitos colaterais.');

  // ─────────────────────────────────────────────────────────────────────────
  // G20 — DEEP IMMUTABILITY (Verificação do input e congelamento)
  // ─────────────────────────────────────────────────────────────────────────
  const isInputUnmutated = isDeepEqualPure(input, inputSnapshot);
  if (!isInputUnmutated) {
    recordGate(GLOBAL_GATE_ID.G20_IMMUTABILITY, 'Deep Immutability Invariant', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Mutação detectada em um dos objetos de entrada durante a execução da N3.6.');
  } else {
    recordGate(GLOBAL_GATE_ID.G20_IMMUTABILITY, 'Deep Immutability Invariant', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Objetos de entrada 100% preservados e imutáveis.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DETERMINAÇÃO DO STATUS FINAL
  // ─────────────────────────────────────────────────────────────────────────
  let finalStatus = GLOBAL_VALIDATION_STATUS.PASS;
  let finalValid = true;

  if (blockingReasons.length > 0) {
    finalStatus = GLOBAL_VALIDATION_STATUS.BLOCKED;
    finalValid = false;
  } else if (inheritedWarnings.length > 0 || validationWarnings.length > 0) {
    finalStatus = GLOBAL_VALIDATION_STATUS.WARNING;
    finalValid = true;
  }

  globalProvenance.traceabilitySummary.q10_motivoStatusFinal.finalStatus = finalStatus;
  globalProvenance.traceabilitySummary.q10_motivoStatusFinal.valid = finalValid;
  globalProvenance.traceabilitySummary.q10_motivoStatusFinal.summary = finalStatus === GLOBAL_VALIDATION_STATUS.PASS
    ? 'Prescrição validada com sucesso em todos os 20 portões globais determinísticos.'
    : (finalStatus === GLOBAL_VALIDATION_STATUS.WARNING
      ? 'Prescrição aprovada com observações operacionais/limitações de dados documentadas.'
      : 'Prescrição bloqueada por violação de invariantes técnicos determinísticos.');

  // DTO de Saída Canônico
  const outputDTO = {
    globalValidationVersion: GLOBAL_VALIDATION_VERSION,
    status: finalStatus,
    valid: finalValid,
    gateResults,
    conservationAudit: {
      energyTargetKcal: energyTargetResult?.caloricTargetKcal || null,
      macroClosedKcal: atwaterCalculatedKcal,
      solverKcal: solverNutrients.calories,
      finalKcal: finalNutrients.calories,
      deltaKcalFinalVsSolver: Number(deltaCalories.toFixed(4)),
      proteinTargetG: macroTargetResult?.proteinTargetG || null,
      solverProteinG: solverNutrients.protein,
      finalProteinG: finalNutrients.protein,
      deltaProteinG: Number(deltaProtein.toFixed(4)),
      carbsTargetG: macroTargetResult?.carbohydrateTargetG || null,
      solverCarbsG: solverNutrients.carbohydrate,
      finalCarbsG: finalNutrients.carbohydrate,
      deltaCarbsG: Number(deltaCarbs.toFixed(4)),
      fatTargetG: macroTargetResult?.fatTargetG || null,
      solverFatG: solverNutrients.lipid,
      finalFatG: finalNutrients.lipid,
      deltaFatG: Number(deltaLipid.toFixed(4)),
      fiberG: finalNutrients.fiber,
      solverFiberG: solverNutrients.fiber,
      deltaFiberG: Number(deltaFiber.toFixed(4)),
      sodiumMg: finalNutrients.sodium,
      solverSodiumMg: solverNutrients.sodium,
      deltaSodiumMg: sodiumChecked ? Number(deltaSodium.toFixed(4)) : null,
      totalFoodMassGrams: Number(finalTotalMass.toFixed(2)),
      solverFoodMassGrams: Number(solverTotalMass.toFixed(2)),
      deltaMassFinalVsSolverGrams: Number(deltaTotalMass.toFixed(4)),
      isStrictlyConserved: deltaTotalMass <= policy.massToleranceGrams &&
        deltaCalories <= policy.calorieToleranceKcal &&
        deltaProtein <= policy.proteinToleranceGrams &&
        deltaCarbs <= policy.carbohydrateToleranceGrams &&
        deltaLipid <= policy.lipidToleranceGrams
    },
    temporalAudit: {
      eatingWindow,
      mealsCount: finalMeals.length,
      mealsSchedule: finalMeals.map(m => ({
        mealId: m.mealId,
        mealIndex: m.mealIndex,
        scheduledTime: m.scheduledTime,
        scheduledMinutes: m.scheduledMinutes,
        primaryRelation: m.primaryRelation,
        secondaryRelations: m.secondaryRelations || []
      })),
      hasCollisions: hasCollision,
      hasFastedTraining: finalMeals.some(m => Array.isArray(m.secondaryRelations) && m.secondaryRelations.includes('FASTING_CONSTRAINED'))
    },
    globalDiagnostics,
    inheritedWarnings,
    validationWarnings,
    blockingReasons,
    globalProvenance
  };

  return policy.enforceDeepFreeze ? deepFreeze(outputDTO) : outputDTO;
}

module.exports = deepFreeze({
  validateGlobalPrescription
});

  });

  // ── MÓDULO: domain/validation/index.js ──
  defineModule("domain/validation/index.js", function(require, module, exports) {
/**
 * domain/validation/index.js
 * 
 * Ponto Único de Exportação do Subsistema de Validação Global da Prescrição — NutriAx Pro.
 * Fase N3.6 — Validação Global Determinística.
 * 
 * Camada Pura — Sem I/O de infraestrutura, sem persistência externa, sem dependências remotas.
 */

'use strict';

const GlobalPrescriptionValidationContract = require('../contracts/GlobalPrescriptionValidationContract');
const globalPrescriptionValidationPolicy = require('./globalPrescriptionValidationPolicy');
const globalPrescriptionValidator = require('./globalPrescriptionValidator');

const validationSubsystem = {
  // Contratos e Enums
  CONTRACT_VERSION: GlobalPrescriptionValidationContract.CONTRACT_VERSION,
  GLOBAL_VALIDATION_VERSION: GlobalPrescriptionValidationContract.GLOBAL_VALIDATION_VERSION,
  GLOBAL_VALIDATION_STATUS: GlobalPrescriptionValidationContract.GLOBAL_VALIDATION_STATUS,
  GLOBAL_GATE_ID: GlobalPrescriptionValidationContract.GLOBAL_GATE_ID,
  GATE_SEVERITY: GlobalPrescriptionValidationContract.GATE_SEVERITY,
  validateGlobalPrescriptionValidationInput: GlobalPrescriptionValidationContract.validateGlobalPrescriptionValidationInput,
  validateGlobalPrescriptionValidationOutput: GlobalPrescriptionValidationContract.validateGlobalPrescriptionValidationOutput,
  deepFreeze: GlobalPrescriptionValidationContract.deepFreeze,

  // Políticas e Tolerâncias
  DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY: globalPrescriptionValidationPolicy.DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY,
  createGlobalPrescriptionValidationPolicy: globalPrescriptionValidationPolicy.createGlobalPrescriptionValidationPolicy,

  // Motor Determinístico de Validação Global
  validateGlobalPrescription: globalPrescriptionValidator.validateGlobalPrescription
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = validationSubsystem;
}

if (typeof globalThis !== 'undefined') {
  globalThis.NutriDomain = globalThis.NutriDomain || {};
  globalThis.NutriDomain.validation = validationSubsystem;
}

  });

  // ── MÓDULO: domain/orchestration/prescriptionOrchestrator.js ──
  defineModule("domain/orchestration/prescriptionOrchestrator.js", function(require, module, exports) {
/**
 * domain/orchestration/prescriptionOrchestrator.js
 * 
 * Orquestrador Canônico do Pipeline de Prescrição Nutricional — NutriAx Pro.
 * Fase N3.7.1 — Orquestrador Determinístico Puro.
 * 
 * Executa a cadeia sequencial canônica completa:
 * N1.1 -> N2.1 -> N2.2 -> N2.3 -> N3.2 -> N3.3 -> N3.4 -> N3.5 -> N3.6
 * 
 * Restrições Absolutas de Governança:
 * 1. PUREZA ABSOLUTA: Zero DOM, zero window/document, zero Dexie/Firebase, zero Gemini,
 *    zero Date.now(), zero Math.random(), zero I/O de rede ou disco.
 * 2. DETERMINISMO ESTÓICO: Mesma entrada + mesmas políticas = mesma saída estruturada idêntica.
 * 3. IMUTABILIDADE PROFUNDA: Entradas não são mutadas (cópia defensiva pura);
 *    saída profundamente congelada (deepFreeze).
 * 4. FAIL-FAST DETERMINÍSTICO: Interrompe a cadeia imediatamente quando uma etapa obrigatória
 *    retorna BLOCKED/invalid. As etapas subsequentes permanecem null.
 * 5. N3.6 É OBRIGATORIAMENTE A ETAPA FINAL: Nenhuma transformação, ajuste, rebalanceamento,
 *    reagendamento ou alteração de alimentos ocorre após validateGlobalPrescription().
 * 6. ZERO ALIASES SILENCIOSOS: Consome estritamente os contratos canônicos
 *    (proteinTargetG, carbohydrateTargetG, fatTargetG, fiberTargetG).
 * 7. PIPELINE TRACE SEM TIMESTAMPS: Registra deterministicamente os passos executados,
 *    status e razões de bloqueio sem campos temporais variáveis.
 */

'use strict';

const { validateNutritionPrescriptionContextDTO } = require('../contracts/NutritionPrescriptionContextDTO');
const { buildNutritionPrescriptionContext } = require('../adapters/nutritionContextAdapter');
const { calculateDeterministicEnergyTarget } = require('../math/energyTarget');
const { calculateDeterministicMacroTargets } = require('../math/macroTarget');
const { validateNutritionPrescriptionTargets } = require('../math/nutritionTargetValidator');
const { solveNutritionDiet } = require('../solver/foodSolver');
const { assembleMeals } = require('../meal/mealAssembly');
const { scheduleMeals } = require('../timing/mealTiming');
const { analyzeNutrientTiming } = require('../timing/nutrientTiming');
const { validateGlobalPrescription } = require('../validation/globalPrescriptionValidator');

/**
 * Identificadores canônicos das etapas do pipeline
 */
const PIPELINE_STEP = Object.freeze({
  N11_CONTEXT: 'N1.1_CONTEXT',
  N21_ENERGY_TARGET: 'N2.1_ENERGY_TARGET',
  N22_MACRO_TARGET: 'N2.2_MACRO_TARGET',
  N23_NUTRITION_VALIDATOR: 'N2.3_NUTRITION_VALIDATOR',
  N32_FOOD_SOLVER: 'N3.2_FOOD_SOLVER',
  N33_MEAL_ASSEMBLY: 'N3.3_MEAL_ASSEMBLY',
  N34_MEAL_TIMING: 'N3.4_MEAL_TIMING',
  N35_NUTRIENT_TIMING: 'N3.5_NUTRIENT_TIMING',
  N36_GLOBAL_VALIDATION: 'N3.6_GLOBAL_VALIDATION'
});

/**
 * Status formais de execução do orquestrador
 */
const ORCHESTRATOR_STATUS = Object.freeze({
  PASS: 'PASS',
  WARNING: 'WARNING',
  BLOCKED: 'BLOCKED'
});

/**
 * Congelamento profundo determinístico e recursivo
 * @param {any} obj 
 * @returns {any}
 */
function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Object.isFrozen(obj)) {
    return obj;
  }

  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const val = obj[prop];
    if (val !== null && (typeof val === 'object' || typeof val === 'function') && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  });

  return obj;
}

/**
 * Cópia profunda pura para proteção defensiva das entradas
 * @param {any} val 
 * @returns {any}
 */
function cloneDeepPure(val) {
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(cloneDeepPure);
  }
  const copy = {};
  for (const k of Object.keys(val)) {
    copy[k] = cloneDeepPure(val[k]);
  }
  return copy;
}

/**
 * Valida a integridade estrutural do input fornecido ao orquestrador
 * @param {Object} input 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateOrchestratorInput(input) {
  const errors = [];

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      errors: ['Input do orquestrador deve ser um objeto válido e não-nulo.']
    };
  }

  // Deve fornecer context OU (patientId + stores)
  const hasContext = input.context != null && typeof input.context === 'object';
  const hasPatientIdAndStores = typeof input.patientId === 'string' && input.patientId.trim() !== '' && input.stores != null;

  if (!hasContext && !hasPatientIdAndStores) {
    errors.push('Input deve conter "context" (NutritionPrescriptionContextDTO) ou "patientId" + "stores".');
  }

  if (input.foodCatalog !== undefined && input.foodCatalog !== null && !Array.isArray(input.foodCatalog)) {
    errors.push('foodCatalog, quando fornecido, deve ser um Array.');
  }

  if (input.policies !== undefined && input.policies !== null && (typeof input.policies !== 'object' || Array.isArray(input.policies))) {
    errors.push('policies, quando fornecido, deve ser um objeto.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Monta a estrutura canônica imutável de resultado do pipeline
 * @param {Object} params 
 * @returns {Readonly<Object>}
 */
function buildPipelineOutput(params) {
  const output = {
    orchestratorVersion: 'N3.7.1',
    success: Boolean(params.success),
    status: params.status || ORCHESTRATOR_STATUS.BLOCKED,
    interruptedAt: params.interruptedAt || null,
    blockingReasons: Array.isArray(params.blockingReasons) ? [...params.blockingReasons] : [],
    warnings: Array.isArray(params.warnings) ? [...params.warnings] : [],
    context: params.context || null,
    energyTargetResult: params.energyTargetResult || null,
    macroTargetResult: params.macroTargetResult || null,
    nutritionValidatorResult: params.nutritionValidatorResult || null,
    foodSolverResult: params.foodSolverResult || null,
    mealAssemblyResult: params.mealAssemblyResult || null,
    mealTimingResult: params.mealTimingResult || null,
    nutrientTimingResult: params.nutrientTimingResult || null,
    globalValidationResult: params.globalValidationResult || null,
    pipelineTrace: Array.isArray(params.pipelineTrace) ? [...params.pipelineTrace] : []
  };

  return deepFreeze(output);
}

/**
 * Execução síncrona central do pipeline determinístico a partir de um context já resolvido.
 * 
 * @param {Object} resolvedContext - NutritionPrescriptionContextDTO canônico
 * @param {Array<Object>} foodCatalog - Catálogo de alimentos para N3.2
 * @param {Object} [policies={}] - Políticas versionadas para as etapas
 * @param {Object} [options={}] - Opções de execução adicionais
 * @returns {Readonly<Object>} PrescriptionPipelineResultDTO imutável
 */
function executePipelineCore(resolvedContext, foodCatalog, policies = {}, options = {}) {
  const pipelineTrace = [];
  const accumulatedWarnings = [];

  let currentContext = resolvedContext;
  if (options && (options.mealCount || options.mealsPerDay) && currentContext) {
    const desiredMealCount = options.mealCount || options.mealsPerDay;
    if (typeof desiredMealCount === 'number' && desiredMealCount >= 1 && desiredMealCount <= 8) {
      currentContext = {
        ...currentContext,
        mealsPerDay: desiredMealCount,
        mealCount: desiredMealCount,
        routine: {
          ...(currentContext.routine || {}),
          mealsPerDay: desiredMealCount,
          mealCount: desiredMealCount
        }
      };
    }
  }
  let energyTargetResult = null;
  let macroTargetResult = null;
  let nutritionValidatorResult = null;
  let foodSolverResult = null;
  let mealAssemblyResult = null;
  let mealTimingResult = null;
  let nutrientTimingResult = null;
  let globalValidationResult = null;

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 1: N1.1 — CONTEXTO CANÔNICO DE PRESCRIÇÃO NUTRICIONAL
  // ═══════════════════════════════════════════════════════════════════════════
  const contextValidation = validateNutritionPrescriptionContextDTO(currentContext);
  if (!contextValidation.isValid) {
    const reasons = [...contextValidation.errors];
    pipelineTrace.push({
      step: PIPELINE_STEP.N11_CONTEXT,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: 'Contexto de prescrição nutricional não atende ao schema contratual N1.1.'
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N11_CONTEXT,
      blockingReasons: reasons,
      context: currentContext,
      pipelineTrace
    });
  }

  pipelineTrace.push({
    step: PIPELINE_STEP.N11_CONTEXT,
    status: ORCHESTRATOR_STATUS.PASS,
    details: 'Contexto canônico N1.1 validado com sucesso.'
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 2: N2.1 — DETERMINISTIC ENERGY TARGET
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    energyTargetResult = calculateDeterministicEnergyTarget(currentContext, {
      policy: policies.energyPolicy
    });
  } catch (err) {
    const reasons = [err.message || 'Erro inesperado no cálculo da meta energética N2.1.'];
    pipelineTrace.push({
      step: PIPELINE_STEP.N21_ENERGY_TARGET,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons[0]
    });
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N21_ENERGY_TARGET,
      blockingReasons: reasons,
      context: currentContext,
      pipelineTrace
    });
  }

  if (energyTargetResult.status === 'BLOCKED' || !energyTargetResult.caloricTargetKcal || energyTargetResult.caloricTargetKcal <= 0) {
    const reasons = Array.isArray(energyTargetResult.blockingReasons) && energyTargetResult.blockingReasons.length > 0
      ? [...energyTargetResult.blockingReasons]
      : ['Meta energética não pôde ser calculada ou retornou valor não-positivo.'];

    pipelineTrace.push({
      step: PIPELINE_STEP.N21_ENERGY_TARGET,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons.join('; ')
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N21_ENERGY_TARGET,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      pipelineTrace
    });
  }

  if (Array.isArray(energyTargetResult.warnings) && energyTargetResult.warnings.length > 0) {
    accumulatedWarnings.push(...energyTargetResult.warnings.map(w => `[N2.1] ${w}`));
  }

  pipelineTrace.push({
    step: PIPELINE_STEP.N21_ENERGY_TARGET,
    status: energyTargetResult.status || ORCHESTRATOR_STATUS.PASS,
    details: `Meta energética calculada: ${energyTargetResult.caloricTargetKcal} kcal (TMB: ${energyTargetResult.tmbKcal} kcal, GET: ${energyTargetResult.getKcal} kcal).`,
    warnings: energyTargetResult.warnings || []
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 3: N2.2 — DETERMINISTIC MACRONUTRIENT TARGETS
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    macroTargetResult = calculateDeterministicMacroTargets(currentContext, energyTargetResult, {
      policy: policies.macroPolicy,
      dietaryStyle: options.dietaryStyle || currentContext.options?.dietaryStyle,
      dietaryCycle: options.dietaryCycle || currentContext.options?.dietaryCycle,
      ...(options || {})
    });
  } catch (err) {
    const reasons = [err.message || 'Erro inesperado no cálculo de macronutrientes N2.2.'];
    pipelineTrace.push({
      step: PIPELINE_STEP.N22_MACRO_TARGET,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons[0]
    });
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N22_MACRO_TARGET,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      pipelineTrace
    });
  }

  if (macroTargetResult.status === 'BLOCKED') {
    const reasons = Array.isArray(macroTargetResult.blockingReasons) && macroTargetResult.blockingReasons.length > 0
      ? [...macroTargetResult.blockingReasons]
      : ['Distribuição de macronutrientes bloqueada pela política N2.2.'];

    pipelineTrace.push({
      step: PIPELINE_STEP.N22_MACRO_TARGET,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons.join('; ')
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N22_MACRO_TARGET,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      pipelineTrace
    });
  }

  if (Array.isArray(macroTargetResult.warnings) && macroTargetResult.warnings.length > 0) {
    accumulatedWarnings.push(...macroTargetResult.warnings.map(w => `[N2.2] ${w}`));
  }

  pipelineTrace.push({
    step: PIPELINE_STEP.N22_MACRO_TARGET,
    status: macroTargetResult.status || ORCHESTRATOR_STATUS.PASS,
    details: `Metas de macronutrientes: Proteína=${macroTargetResult.proteinTargetG}g, Carboidrato=${macroTargetResult.carbohydrateTargetG}g, Gordura=${macroTargetResult.fatTargetG}g, Fibras=${macroTargetResult.fiberTargetG || 0}g.`,
    warnings: macroTargetResult.warnings || []
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 4: N2.3 — DETERMINISTIC NUTRITION TARGET VALIDATOR
  try {
    const nutritionValidationOptions = (policies.nutritionValidationPolicy && typeof policies.nutritionValidationPolicy === 'object')
      ? { ...policies.nutritionValidationPolicy }
      : {};

    const effectiveEnergyTarget = (macroTargetResult && Number.isFinite(macroTargetResult.caloricTargetKcal) && macroTargetResult.caloricTargetKcal !== energyTargetResult.caloricTargetKcal)
      ? { ...energyTargetResult, caloricTargetKcal: macroTargetResult.caloricTargetKcal }
      : energyTargetResult;

    nutritionValidatorResult = validateNutritionPrescriptionTargets(
      currentContext,
      effectiveEnergyTarget,
      macroTargetResult,
      nutritionValidationOptions
    );
  } catch (err) {
    const reasons = [err.message || 'Erro inesperado na validação de metas N2.3.'];
    pipelineTrace.push({
      step: PIPELINE_STEP.N23_NUTRITION_VALIDATOR,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons[0]
    });
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N23_NUTRITION_VALIDATOR,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      pipelineTrace
    });
  }

  if (nutritionValidatorResult.status === 'BLOCKED' || nutritionValidatorResult.valid !== true) {
    const reasons = Array.isArray(nutritionValidatorResult.blockingReasons) && nutritionValidatorResult.blockingReasons.length > 0
      ? [...nutritionValidatorResult.blockingReasons]
      : ['Validação bromatológica e energética das metas reprovada no portão N2.3.'];

    pipelineTrace.push({
      step: PIPELINE_STEP.N23_NUTRITION_VALIDATOR,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons.join('; ')
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N23_NUTRITION_VALIDATOR,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      pipelineTrace
    });
  }

  if (Array.isArray(nutritionValidatorResult.warnings) && nutritionValidatorResult.warnings.length > 0) {
    accumulatedWarnings.push(...nutritionValidatorResult.warnings.map(w => `[N2.3] ${w}`));
  }

  pipelineTrace.push({
    step: PIPELINE_STEP.N23_NUTRITION_VALIDATOR,
    status: nutritionValidatorResult.status || ORCHESTRATOR_STATUS.PASS,
    details: 'Validação termodinâmica e bromatológica pré-cardápio aprovada.',
    warnings: nutritionValidatorResult.warnings || []
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 5: N3.2 — DETERMINISTIC FOOD SOLVER
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    const effectiveEnergyTarget = (macroTargetResult && Number.isFinite(macroTargetResult.caloricTargetKcal) && macroTargetResult.caloricTargetKcal !== energyTargetResult.caloricTargetKcal)
      ? { ...energyTargetResult, caloricTargetKcal: macroTargetResult.caloricTargetKcal }
      : energyTargetResult;

    const solverInput = {
      context: currentContext,
      energyTarget: effectiveEnergyTarget,
      macroTarget: macroTargetResult,
      validationResult: nutritionValidatorResult,
      foodCatalog: Array.isArray(foodCatalog) ? foodCatalog : [],
      options: {
        ...(options || {}),
        ...(options.solverOptions || {})
      }
    };

    foodSolverResult = solveNutritionDiet(solverInput, policies.foodSolverPolicy || {});
  } catch (err) {
    const reasons = [err.message || 'Erro inesperado na execução do Food Solver N3.2.'];
    pipelineTrace.push({
      step: PIPELINE_STEP.N32_FOOD_SOLVER,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons[0]
    });
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N32_FOOD_SOLVER,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      pipelineTrace
    });
  }

  // N3.7.5: Tratamento explícito de SEARCH_LIMIT_REACHED antes da verificação genérica.
  // Este status indica que o solver interrompeu a busca por limite computacional, não por
  // ausência de solução. O diagnóstico deve ser claro e acionável para o nutricionista.
  if (foodSolverResult.status === 'SEARCH_LIMIT_REACHED') {
    const reasons = Array.isArray(foodSolverResult.blockingReasons) && foodSolverResult.blockingReasons.length > 0
      ? [...foodSolverResult.blockingReasons]
      : [
          'O Food Solver atingiu o limite computacional de busca combinatória (SEARCH_LIMIT_REACHED).',
          'A prescrição não pode ser gerada com o catálogo atual neste ambiente.',
          'Ação recomendada: reduza o número de alimentos elegíveis no catálogo ou use o modo servidor (Node.js) com limite expandido.'
        ];

    pipelineTrace.push({
      step: PIPELINE_STEP.N32_FOOD_SOLVER,
      status: 'SEARCH_LIMIT_REACHED',
      blockingReasons: reasons,
      details: `Solver interrompido por limite computacional. Diagnósticos: ${(foodSolverResult.solverDiagnostics || []).join(' | ')}`,
      warnings: foodSolverResult.warnings || []
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N32_FOOD_SOLVER,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      pipelineTrace
    });
  }

  if (foodSolverResult.status === 'BLOCKED' || foodSolverResult.status === 'NO_SOLUTION' || foodSolverResult.valid !== true) {
    const reasons = Array.isArray(foodSolverResult.blockingReasons) && foodSolverResult.blockingReasons.length > 0
      ? [...foodSolverResult.blockingReasons]
      : [`Otimização do Food Solver bloqueada com status "${foodSolverResult.status}".`];

    pipelineTrace.push({
      step: PIPELINE_STEP.N32_FOOD_SOLVER,
      status: foodSolverResult.status || ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons.join('; ')
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N32_FOOD_SOLVER,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      pipelineTrace
    });
  }


  if (Array.isArray(foodSolverResult.warnings) && foodSolverResult.warnings.length > 0) {
    accumulatedWarnings.push(...foodSolverResult.warnings.map(w => `[N3.2] ${w}`));
  }

  const solverItemCount = foodSolverResult.items?.length || (foodSolverResult.meals?.[0]?.items?.length) || 0;
  pipelineTrace.push({
    step: PIPELINE_STEP.N32_FOOD_SOLVER,
    status: foodSolverResult.status || ORCHESTRATOR_STATUS.PASS,
    details: `Seleção e porcionamento determinístico concluídos (${solverItemCount} alimentos resolvidos).`,
    warnings: foodSolverResult.warnings || []
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 6: N3.3 — DETERMINISTIC MEAL ASSEMBLY
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    const assemblyInput = {
      context: currentContext,
      validationResult: nutritionValidatorResult,
      foodSolverResult,
      options
    };

    mealAssemblyResult = assembleMeals(assemblyInput, policies.mealAssemblyPolicy || {});
  } catch (err) {
    const reasons = [err.message || 'Erro inesperado no Meal Assembly N3.3.'];
    pipelineTrace.push({
      step: PIPELINE_STEP.N33_MEAL_ASSEMBLY,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons[0]
    });
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N33_MEAL_ASSEMBLY,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      pipelineTrace
    });
  }

  if (mealAssemblyResult.status === 'BLOCKED' || mealAssemblyResult.status === 'NO_SOLUTION' || mealAssemblyResult.valid !== true) {
    const reasons = Array.isArray(mealAssemblyResult.blockingReasons) && mealAssemblyResult.blockingReasons.length > 0
      ? [...mealAssemblyResult.blockingReasons]
      : [`Montagem de refeições N3.3 bloqueada com status "${mealAssemblyResult.status}".`];

    pipelineTrace.push({
      step: PIPELINE_STEP.N33_MEAL_ASSEMBLY,
      status: mealAssemblyResult.status || ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons.join('; ')
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N33_MEAL_ASSEMBLY,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      mealAssemblyResult,
      pipelineTrace
    });
  }

  if (Array.isArray(mealAssemblyResult.warnings) && mealAssemblyResult.warnings.length > 0) {
    const solverWarnSet = new Set(Array.isArray(foodSolverResult?.warnings) ? foodSolverResult.warnings : []);
    const assemblyOnlyWarnings = mealAssemblyResult.warnings.filter(w => !solverWarnSet.has(w));
    if (assemblyOnlyWarnings.length > 0) {
      accumulatedWarnings.push(...assemblyOnlyWarnings.map(w => `[N3.3] ${w}`));
    }
  }

  const assembledMealCount = Array.isArray(mealAssemblyResult.meals) ? mealAssemblyResult.meals.length : 0;
  pipelineTrace.push({
    step: PIPELINE_STEP.N33_MEAL_ASSEMBLY,
    status: mealAssemblyResult.status || ORCHESTRATOR_STATUS.PASS,
    details: `Alimentos distribuídos em ${assembledMealCount} refeições estruturadas com preservação de massa e nutrientes.`,
    warnings: mealAssemblyResult.warnings || []
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 7: N3.4 — DETERMINISTIC MEAL TIMING
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    const timingInput = {
      context: currentContext,
      mealAssemblyResult
    };

    mealTimingResult = scheduleMeals(timingInput, policies.mealTimingPolicy || {});
  } catch (err) {
    const reasons = [err.message || 'Erro inesperado no agendamento temporal de refeições N3.4.'];
    pipelineTrace.push({
      step: PIPELINE_STEP.N34_MEAL_TIMING,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons[0]
    });
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N34_MEAL_TIMING,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      mealAssemblyResult,
      pipelineTrace
    });
  }

  if (mealTimingResult.status === 'BLOCKED' || mealTimingResult.valid !== true) {
    const reasons = Array.isArray(mealTimingResult.blockingReasons) && mealTimingResult.blockingReasons.length > 0
      ? [...mealTimingResult.blockingReasons]
      : [`Agendamento temporal N3.4 bloqueado com status "${mealTimingResult.status}".`];

    pipelineTrace.push({
      step: PIPELINE_STEP.N34_MEAL_TIMING,
      status: mealTimingResult.status || ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons.join('; ')
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N34_MEAL_TIMING,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      mealAssemblyResult,
      mealTimingResult,
      pipelineTrace
    });
  }

  if (Array.isArray(mealTimingResult.warnings) && mealTimingResult.warnings.length > 0) {
    const assemblyWarnSet = new Set(Array.isArray(mealAssemblyResult?.warnings) ? mealAssemblyResult.warnings : []);
    const timingOnlyWarnings = mealTimingResult.warnings.filter(w => !assemblyWarnSet.has(w));
    if (timingOnlyWarnings.length > 0) {
      accumulatedWarnings.push(...timingOnlyWarnings.map(w => `[N3.4] ${w}`));
    }
  }

  pipelineTrace.push({
    step: PIPELINE_STEP.N34_MEAL_TIMING,
    status: mealTimingResult.status || ORCHESTRATOR_STATUS.PASS,
    details: 'Refeições posicionadas temporalmente com respeito à janela alimentar, rotina e sono.',
    warnings: mealTimingResult.warnings || []
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 8: N3.5 — NUTRIENT TIMING ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    const nutrientTimingInput = {
      context: currentContext,
      mealAssemblyResult,
      mealTimingResult
    };

    nutrientTimingResult = analyzeNutrientTiming(nutrientTimingInput, policies.nutrientTimingPolicy || {});
  } catch (err) {
    const reasons = [err.message || 'Erro inesperado na análise de nutrient timing N3.5.'];
    pipelineTrace.push({
      step: PIPELINE_STEP.N35_NUTRIENT_TIMING,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons[0]
    });
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N35_NUTRIENT_TIMING,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      mealAssemblyResult,
      mealTimingResult,
      pipelineTrace
    });
  }

  if (nutrientTimingResult.status === 'BLOCKED' || nutrientTimingResult.valid !== true) {
    const reasons = Array.isArray(nutrientTimingResult.blockingReasons) && nutrientTimingResult.blockingReasons.length > 0
      ? [...nutrientTimingResult.blockingReasons]
      : [`Análise de nutrient timing N3.5 bloqueada com status "${nutrientTimingResult.status}".`];

    pipelineTrace.push({
      step: PIPELINE_STEP.N35_NUTRIENT_TIMING,
      status: nutrientTimingResult.status || ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons.join('; ')
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N35_NUTRIENT_TIMING,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      mealAssemblyResult,
      mealTimingResult,
      nutrientTimingResult,
      pipelineTrace
    });
  }

  if (Array.isArray(nutrientTimingResult.warnings) && nutrientTimingResult.warnings.length > 0) {
    const timingWarnSet = new Set(Array.isArray(mealTimingResult?.warnings) ? mealTimingResult.warnings : []);
    const nutrientTimingOnlyWarnings = nutrientTimingResult.warnings.filter(w => !timingWarnSet.has(w));
    if (nutrientTimingOnlyWarnings.length > 0) {
      accumulatedWarnings.push(...nutrientTimingOnlyWarnings.map(w => `[N3.5] ${w}`));
    }
  }

  pipelineTrace.push({
    step: PIPELINE_STEP.N35_NUTRIENT_TIMING,
    status: nutrientTimingResult.status || ORCHESTRATOR_STATUS.PASS,
    details: 'Relação temporal entre refeições, treino, cardio e jejum analisada.',
    warnings: nutrientTimingResult.warnings || []
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 9: N3.6 — GLOBAL PRESCRIPTION VALIDATOR (JUIZ FINAL OBRIGATÓRIO)
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    const globalValidationInput = {
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      mealAssemblyResult,
      mealTimingResult,
      nutrientTimingResult
    };

    globalValidationResult = validateGlobalPrescription(globalValidationInput, policies.globalValidationPolicy || {});
  } catch (err) {
    const reasons = [err.message || 'Erro inesperado na validação global N3.6.'];
    pipelineTrace.push({
      step: PIPELINE_STEP.N36_GLOBAL_VALIDATION,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons[0]
    });
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N36_GLOBAL_VALIDATION,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      mealAssemblyResult,
      mealTimingResult,
      nutrientTimingResult,
      pipelineTrace
    });
  }

  const finalStatus = globalValidationResult.status || ORCHESTRATOR_STATUS.BLOCKED;
  const isPipelineCompliant = finalStatus !== ORCHESTRATOR_STATUS.BLOCKED && globalValidationResult.valid === true;

  if (Array.isArray(globalValidationResult.validationWarnings) && globalValidationResult.validationWarnings.length > 0) {
    accumulatedWarnings.push(...globalValidationResult.validationWarnings.map(w => `[N3.6] ${w}`));
  }

  const passedGates = Array.isArray(globalValidationResult.gateResults)
    ? globalValidationResult.gateResults.filter(g => g.status === 'PASS').length
    : 0;
  const totalGates = Array.isArray(globalValidationResult.gateResults)
    ? globalValidationResult.gateResults.length
    : 20;

  const gateDetails = `Validação global N3.6 concluída com status "${finalStatus}" (${passedGates}/${totalGates} portões aprovados).`;

  if (!isPipelineCompliant) {
    const reasons = Array.isArray(globalValidationResult.blockingReasons) && globalValidationResult.blockingReasons.length > 0
      ? [...globalValidationResult.blockingReasons]
      : ['Validação global N3.6 reprovada em um ou mais portões clínicos.'];

    pipelineTrace.push({
      step: PIPELINE_STEP.N36_GLOBAL_VALIDATION,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons.length > 0 ? reasons : ['Portão clínico bloqueante violado.'],
      details: gateDetails
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N36_GLOBAL_VALIDATION,
      blockingReasons: reasons.length > 0 ? reasons : ['Portão clínico bloqueante violado.'],
      warnings: [...new Set(accumulatedWarnings)],
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      mealAssemblyResult,
      mealTimingResult,
      nutrientTimingResult,
      globalValidationResult,
      pipelineTrace
    });
  }

  pipelineTrace.push({
    step: PIPELINE_STEP.N36_GLOBAL_VALIDATION,
    status: finalStatus,
    details: gateDetails,
    warnings: Array.isArray(globalValidationResult.validationWarnings) ? globalValidationResult.validationWarnings : []
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INVARIANTE ABSOLUTO N3.7:
  // Nenhuma alteração, recálculo, reajuste ou reagendamento de alimentos
  // é permitido após o validateGlobalPrescription().
  // O resultado congelado é retornado imediatamente.
  // ═══════════════════════════════════════════════════════════════════════════
  return buildPipelineOutput({
    success: true,
    status: finalStatus,
    interruptedAt: null,
    blockingReasons: [],
    warnings: [...new Set(accumulatedWarnings)],
    context: currentContext,
    energyTargetResult,
    macroTargetResult,
    nutritionValidatorResult,
    foodSolverResult,
    mealAssemblyResult,
    mealTimingResult,
    nutrientTimingResult,
    globalValidationResult,
    pipelineTrace
  });
}

/**
 * Executa o pipeline de forma síncrona quando o context (N1.1) já foi construído e fornecido.
 * 
 * @param {Object} input - Objeto de entrada contendo { context, foodCatalog, policies, options }
 * @returns {Readonly<Object>} PrescriptionPipelineResultDTO imutável
 */
function executePrescriptionPipelineSync(input) {
  const inputValidation = validateOrchestratorInput(input);
  if (!inputValidation.isValid) {
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: 'ORCHESTRATOR_INPUT_VALIDATION',
      blockingReasons: inputValidation.errors,
      pipelineTrace: [{
        step: 'INPUT_VALIDATION',
        status: ORCHESTRATOR_STATUS.BLOCKED,
        blockingReasons: inputValidation.errors,
        details: 'Falha na validação dos parâmetros de entrada do orquestrador.'
      }]
    });
  }

  if (!input.context || typeof input.context !== 'object') {
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: 'ORCHESTRATOR_INPUT_VALIDATION',
      blockingReasons: ['executePrescriptionPipelineSync exige a passagem de "context" resolvido.'],
      pipelineTrace: [{
        step: 'INPUT_VALIDATION',
        status: ORCHESTRATOR_STATUS.BLOCKED,
        blockingReasons: ['executePrescriptionPipelineSync exige a passagem de "context" resolvido.'],
        details: 'Contexto ausente para execução síncrona.'
      }]
    });
  }

  // Clonagem defensiva pura para assegurar que inputs nunca sofram mutações externas
  const safeContext = cloneDeepPure(input.context);
  const safeCatalog = Array.isArray(input.foodCatalog) ? cloneDeepPure(input.foodCatalog) : [];
  const safePolicies = (input.policies && typeof input.policies === 'object') ? { ...input.policies } : {};
  const safeOptions = (input.options && typeof input.options === 'object') ? { ...input.options } : {};

  return executePipelineCore(safeContext, safeCatalog, safePolicies, safeOptions);
}

/**
 * Executa o pipeline determinístico completo.
 * Suporta tanto a passagem de `context` pré-construído quanto a resolução via `patientId` + `stores`.
 * 
 * @param {Object} input - Objeto de entrada { context, patientId, stores, foodCatalog, policies, options }
 * @returns {Promise<Readonly<Object>>} PrescriptionPipelineResultDTO imutável
 */
async function executePrescriptionPipeline(input) {
  const inputValidation = validateOrchestratorInput(input);
  if (!inputValidation.isValid) {
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: 'ORCHESTRATOR_INPUT_VALIDATION',
      blockingReasons: inputValidation.errors,
      pipelineTrace: [{
        step: 'INPUT_VALIDATION',
        status: ORCHESTRATOR_STATUS.BLOCKED,
        blockingReasons: inputValidation.errors,
        details: 'Falha na validação dos parâmetros de entrada do orquestrador.'
      }]
    });
  }

  // Cópia defensiva pura
  const safeInput = cloneDeepPure(input);
  let resolvedContext = safeInput.context;

  if (!resolvedContext) {
    try {
      resolvedContext = await buildNutritionPrescriptionContext(safeInput.patientId, {
        stores: safeInput.stores
      });
    } catch (err) {
      const reasons = [err.message || 'Erro ao construir contexto canônico N1.1 via stores.'];
      return buildPipelineOutput({
        success: false,
        status: ORCHESTRATOR_STATUS.BLOCKED,
        interruptedAt: PIPELINE_STEP.N11_CONTEXT,
        blockingReasons: reasons,
        pipelineTrace: [{
          step: PIPELINE_STEP.N11_CONTEXT,
          status: ORCHESTRATOR_STATUS.BLOCKED,
          blockingReasons: reasons,
          details: reasons[0]
        }]
      });
    }
  }

  const safeCatalog = Array.isArray(safeInput.foodCatalog) ? safeInput.foodCatalog : [];
  const safePolicies = safeInput.policies || {};
  const safeOptions = safeInput.options || {};

  return executePipelineCore(resolvedContext, safeCatalog, safePolicies, safeOptions);
}

module.exports = {
  PIPELINE_STEP,
  ORCHESTRATOR_STATUS,
  validateOrchestratorInput,
  executePrescriptionPipelineSync,
  executePrescriptionPipeline,
  deepFreeze,
  cloneDeepPure
};

  });

  // ── MÓDULO: domain/orchestration/index.js ──
  defineModule("domain/orchestration/index.js", function(require, module, exports) {
/**
 * domain/orchestration/index.js
 * 
 * Ponto Único de Exportação do Subsistema de Orquestração da Prescrição — NutriAx Pro.
 * Fase N3.7.1 — Orquestrador Canônico do Pipeline Nutricional Determinístico.
 * 
 * Camada Pura — Sem I/O de infraestrutura, sem persistência externa, sem dependências remotas.
 */

'use strict';

const prescriptionOrchestrator = require('./prescriptionOrchestrator');

const orchestrationSubsystem = {
  PIPELINE_STEP: prescriptionOrchestrator.PIPELINE_STEP,
  ORCHESTRATOR_STATUS: prescriptionOrchestrator.ORCHESTRATOR_STATUS,
  validateOrchestratorInput: prescriptionOrchestrator.validateOrchestratorInput,
  executePrescriptionPipelineSync: prescriptionOrchestrator.executePrescriptionPipelineSync,
  executePrescriptionPipeline: prescriptionOrchestrator.executePrescriptionPipeline,
  deepFreeze: prescriptionOrchestrator.deepFreeze,
  cloneDeepPure: prescriptionOrchestrator.cloneDeepPure
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = orchestrationSubsystem;
}

if (typeof globalThis !== 'undefined') {
  globalThis.NutriDomain = globalThis.NutriDomain || {};
  globalThis.NutriDomain.orchestration = orchestrationSubsystem;
}

  });

  // Inicialização e Exposição Canônica das Camadas N1.1 a N3.7
  const rootRequire = createRequire('domain');

  const contracts = rootRequire('./contracts/index');
  const math = rootRequire('./math/index');
  const solver = rootRequire('./solver/index');
  const meal = rootRequire('./meal/index');
  const timing = rootRequire('./timing/index');
  const validation = rootRequire('./validation/index');
  const orchestration = rootRequire('./orchestration/index');
  const adapters = rootRequire('./adapters/index');

  const NutriDomain = {
    contracts,
    math,
    solver,
    meal,
    timing,
    validation,
    orchestration,
    adapters,
    energyTarget: {
      calculateDeterministicEnergyTarget: math.calculateDeterministicEnergyTarget,
      DEFAULT_ENERGY_POLICY: math.DEFAULT_ENERGY_POLICY,
      validateEnergyPolicy: math.validateEnergyPolicy
    },
    macroTarget: {
      calculateDeterministicMacroTargets: math.calculateDeterministicMacroTargets,
      DEFAULT_MACRO_POLICY: math.DEFAULT_MACRO_POLICY,
      validateMacroPolicy: math.validateMacroPolicy,
      isAthleteOrHighDemand: math.isAthleteOrHighDemand,
      normalizeObjectiveCategory: math.normalizeObjectiveCategory
    },
    targetValidator: {
      validateNutritionPrescriptionTargets: math.validateNutritionPrescriptionTargets
    }
  };

  if (typeof global !== 'undefined') {
    global.NutriDomain = NutriDomain;
  }
  if (typeof window !== 'undefined') {
    window.NutriDomain = NutriDomain;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.NutriDomain = NutriDomain;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NutriDomain;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
