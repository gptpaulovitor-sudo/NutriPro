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
