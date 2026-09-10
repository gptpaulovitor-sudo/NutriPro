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
