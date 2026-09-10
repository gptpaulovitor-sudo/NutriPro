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
