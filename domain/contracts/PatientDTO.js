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
