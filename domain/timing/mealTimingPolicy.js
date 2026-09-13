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
