/**
 * workout-cycle-module.js
 * Módulo Canônico de Ciclos de Treino de 4 Semanas (Mesociclos) — NutriAx Pro / Disciplina
 *
 * Responsável pela modelagem, métricas de contagem temporal e de volume,
 * transições de estado do ciclo e avaliação de fechamento.
 *
 * Compatível com ambientes Node.js e Navegadores (Universal/UMD).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriAxWorkoutCycle = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CYCLE_DURATION_WEEKS = 4;
  const CYCLE_DURATION_DAYS = 28;

  const CYCLE_STATUS = Object.freeze({
    ACTIVE: 'ACTIVE',
    NEEDS_EVALUATION: 'NEEDS_EVALUATION',
    COMPLETED: 'COMPLETED',
    ARCHIVED: 'ARCHIVED'
  });

  const DEFAULT_MICROCICLES = [
    { week: 1, label: 'Semana 1', focus: 'Adaptação & Calibração de RIR' },
    { week: 2, label: 'Semana 2', focus: 'Sobrecarga Progressiva Linear' },
    { week: 3, label: 'Semana 3', focus: 'Pico de Volume & Densidade' },
    { week: 4, label: 'Semana 4', focus: 'Deload Estratégico ou Teste de Cargas' }
  ];

  /**
   * Utilitário para formatar data como YYYY-MM-DD
   */
  function formatDateIso(dateObj) {
    const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Adiciona dias a uma data em formato ISO
   */
  function addDaysToIso(isoStr, days) {
    const parts = isoStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + days);
    return formatDateIso(d);
  }

  /**
   * Calcula diferença em dias entre duas strings ISO (data2 - data1)
   */
  function diffDaysIso(date1Iso, date2Iso) {
    const p1 = date1Iso.split('-').map(Number);
    const p2 = date2Iso.split('-').map(Number);
    const d1 = new Date(p1[0], p1[1] - 1, p1[2]);
    const d2 = new Date(p2[0], p2[1] - 1, p2[2]);
    const diffTime = d2.getTime() - d1.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Constrói um objeto canônico WorkoutCycle
   * @param {Object} params
   * @returns {Object} WorkoutCycle DTO
   */
  function createWorkoutCycle(params = {}) {
    const now = new Date();
    const todayIso = formatDateIso(now);
    const startDate = params.startDate ? String(params.startDate).slice(0, 10) : todayIso;
    const durationWeeks = Number(params.durationWeeks) || CYCLE_DURATION_WEEKS;
    const durationDays = durationWeeks * 7;
    const endDate = params.endDate ? String(params.endDate).slice(0, 10) : addDaysToIso(startDate, durationDays - 1);
    const prescribedFreq = Number(params.prescribedWeeklyFrequency) || 5;
    const totalWorkouts = Number(params.totalPrescribedWorkouts) || (durationWeeks * prescribedFreq);

    const cycleId = params.cycleId || `cycle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      cycleId: cycleId,
      patientId: params.patientId || null,
      protocolName: params.protocolName || 'Periodização 4 Semanas',
      split: params.split || 'PHAT',
      durationWeeks: durationWeeks,
      durationDays: durationDays,
      startDate: startDate,
      endDate: endDate,
      prescribedWeeklyFrequency: prescribedFreq,
      totalPrescribedWorkouts: totalWorkouts,
      microcycles: Array.isArray(params.microcycles) && params.microcycles.length === durationWeeks
        ? params.microcycles
        : JSON.parse(JSON.stringify(DEFAULT_MICROCICLES)),
      status: params.status || CYCLE_STATUS.ACTIVE,
      evaluation: params.evaluation || null,
      createdAt: params.createdAt || now.toISOString(),
      updatedAt: now.toISOString()
    };
  }

  /**
   * Calcula métricas do ciclo de treino em tempo real com base no histórico
   * @param {Object} cycle - WorkoutCycle DTO
   * @param {Object} history - Mapa de histórico { [dateIso]: { workoutDone: boolean, ... } }
   * @param {string} [currentDateIso] - Data de referência (padrão hoje)
   * @returns {Object} CycleMetrics DTO
   */
  function calculateCycleMetrics(cycle, history = {}, currentDateIso = null) {
    if (!cycle || !cycle.startDate) {
      return null;
    }

    const todayIso = currentDateIso ? String(currentDateIso).slice(0, 10) : formatDateIso(new Date());
    const daysElapsed = Math.max(0, diffDaysIso(cycle.startDate, todayIso));
    const durationDays = cycle.durationDays || (cycle.durationWeeks ? cycle.durationWeeks * 7 : CYCLE_DURATION_DAYS);
    const daysRemaining = Math.max(0, durationDays - daysElapsed);

    // Semana atual: 1 a 4
    let currentWeek = Math.floor(daysElapsed / 7) + 1;
    if (currentWeek > cycle.durationWeeks) {
      currentWeek = cycle.durationWeeks;
    }
    if (currentWeek < 1) currentWeek = 1;

    // Filtra treinos executados dentro do período do ciclo
    const completedDates = [];
    const hist = history && typeof history === 'object' ? history : {};

    Object.keys(hist).forEach(dateKey => {
      const entry = hist[dateKey];
      if (entry && (entry.workoutDone === true || entry.done === true)) {
        // Verifica se a data está no intervalo do ciclo [startDate, endDate]
        if (dateKey >= cycle.startDate && dateKey <= cycle.endDate) {
          completedDates.push(dateKey);
        }
      }
    });

    const completedWorkoutsCount = completedDates.length;
    const totalPrescribed = cycle.totalPrescribedWorkouts || (cycle.durationWeeks * cycle.prescribedWeeklyFrequency) || 20;
    const adherencePercent = Math.min(100, Math.round((completedWorkoutsCount / totalPrescribed) * 100));

    // Aderência relativa (em relação ao tempo decorrido)
    const expectedWorkoutsToDate = Math.min(
      totalPrescribed,
      Math.max(1, Math.round(((daysElapsed + 1) / durationDays) * totalPrescribed))
    );
    const relativeAdherencePercent = Math.min(100, Math.round((completedWorkoutsCount / expectedWorkoutsToDate) * 100));

    // Avaliação detalhada de cada microciclo (Semana 1..4)
    const microcyclesProgress = (cycle.microcycles || DEFAULT_MICROCICLES).map((micro, idx) => {
      const weekNum = idx + 1;
      const weekStartIso = addDaysToIso(cycle.startDate, (weekNum - 1) * 7);
      const weekEndIso = addDaysToIso(cycle.startDate, (weekNum * 7) - 1);

      const workoutsInWeek = completedDates.filter(d => d >= weekStartIso && d <= weekEndIso).length;
      const targetWeekly = cycle.prescribedWeeklyFrequency || 5;

      const isCurrent = (weekNum === currentWeek && daysElapsed < durationDays);
      const isPast = (weekNum < currentWeek || daysElapsed >= durationDays);
      const isFuture = (weekNum > currentWeek && daysElapsed < durationDays);
      const isWeekCompleted = workoutsInWeek >= targetWeekly;

      return {
        week: weekNum,
        label: micro.label || `Semana ${weekNum}`,
        focus: micro.focus || '',
        startDate: weekStartIso,
        endDate: weekEndIso,
        workoutsDone: workoutsInWeek,
        targetWorkouts: targetWeekly,
        isCurrent,
        isPast,
        isFuture,
        isCompleted: isWeekCompleted || (isPast && workoutsInWeek > 0)
      };
    });

    // Detecção de necessidade de avaliação:
    // O ciclo encerra e requer avaliação se:
    // 1. Atingiu ou ultrapassou a duração total em dias (>= 28 dias) OU
    // 2. Todos os treinos do ciclo foram concluídos (completedWorkoutsCount >= totalPrescribed)
    const isTimeExpired = daysElapsed >= durationDays;
    const isTargetAchieved = completedWorkoutsCount >= totalPrescribed;
    const shouldPromptEvaluation = (isTimeExpired || isTargetAchieved) && cycle.status !== CYCLE_STATUS.COMPLETED;

    let computedStatus = cycle.status || CYCLE_STATUS.ACTIVE;
    if (computedStatus === CYCLE_STATUS.ACTIVE && shouldPromptEvaluation) {
      computedStatus = CYCLE_STATUS.NEEDS_EVALUATION;
    }

    const currentMicro = microcyclesProgress.find(m => m.week === currentWeek) || microcyclesProgress[0];

    return {
      cycleId: cycle.cycleId,
      status: computedStatus,
      daysElapsed,
      daysRemaining,
      durationDays,
      currentWeek,
      totalWeeks: cycle.durationWeeks || CYCLE_DURATION_WEEKS,
      currentMicrocycleFocus: currentMicro ? currentMicro.focus : '',
      completedWorkoutsCount,
      totalPrescribedWorkouts: totalPrescribed,
      adherencePercent,
      relativeAdherencePercent,
      isTimeExpired,
      isTargetAchieved,
      shouldPromptEvaluation,
      microcycles: microcyclesProgress,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Finaliza a avaliação de fechamento do ciclo de 4 semanas
   * @param {Object} cycle - WorkoutCycle DTO
   * @param {Object} evaluationPayload - Respostas do formulário de check-in
   * @returns {Object} Ciclo atualizado com status COMPLETED
   */
  function completeCycleEvaluation(cycle, evaluationPayload = {}) {
    if (!cycle) throw new Error('Ciclo inválido');

    const evaluation = {
      rpeScore: Number(evaluationPayload.rpeScore) || 8, // 1-10
      loadProgression: evaluationPayload.loadProgression || 'aumentou', // 'aumentou' | 'parcial' | 'estagnou'
      jointDiscomfort: Array.isArray(evaluationPayload.jointDiscomfort)
        ? evaluationPayload.jointDiscomfort
        : [evaluationPayload.jointDiscomfort || 'nenhum'],
      splitPreference: evaluationPayload.splitPreference || 'manter', // 'manter' | 'trocar'
      preferredSplitTarget: evaluationPayload.preferredSplitTarget || null,
      patientNotes: evaluationPayload.patientNotes || '',
      completedAt: new Date().toISOString(),
      adherenceAtClosing: evaluationPayload.adherencePercent || null,
      totalWorkoutsCompleted: evaluationPayload.completedWorkoutsCount || null
    };

    return {
      ...cycle,
      status: CYCLE_STATUS.COMPLETED,
      evaluation: evaluation,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  return {
    CYCLE_DURATION_WEEKS,
    CYCLE_DURATION_DAYS,
    CYCLE_STATUS,
    DEFAULT_MICROCICLES,
    createWorkoutCycle,
    calculateCycleMetrics,
    completeCycleEvaluation
  };
});
