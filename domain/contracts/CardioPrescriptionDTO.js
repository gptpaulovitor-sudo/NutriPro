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
