/**
 * domain/training/ProgressionEngine.js
 * 
 * Motor Canônico de Progressão e Adaptação Específico por Modalidade.
 * Elimina aumentos fixos universais. Determina se a próxima sessão deve
 * Progredir, Manter, Reduzir, Repetir ou Deload com base em dados reais de execução.
 * 
 * Camada de Domínio Puro — Sem dependência de DOM, Dexie ou Firebase.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./RecoveryEngine'),
      require('./ModalityCatalog')
    );
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.ProgressionEngine = factory(
      root.NutriDomain.RecoveryEngine,
      root.NutriDomain.ModalityCatalog
    );
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (RecoveryEngine, ModalityCatalog) {
  'use strict';

  const DECISIONS = Object.freeze({
    PROGRESS: 'PROGRESS',
    MAINTAIN: 'MAINTAIN',
    REDUCE: 'REDUCE',
    REPEAT: 'REPEAT',
    DELOAD: 'DELOAD'
  });

  /**
   * 1. PROGRESSÃO PARA MUSCULAÇÃO / FORÇA (Dupla Progressão)
   * Se bateu o teto de repetições em todas as séries com RIR >= 1: aumenta carga (2-5%).
   * Se bateu repetições com RIR 0 ou falha técnica: repete a carga e busca mais reps.
   * Se não bateu o piso de repetições: mantém ou reduz.
   */
  function calculateStrengthProgression(exercise, historyLogs = []) {
    if (!exercise) return { decision: DECISIONS.MAINTAIN, rationale: 'Exercício não fornecido' };

    const currentSets = Number(exercise.sets) || 3;
    const currentReps = String(exercise.reps || '8-10');
    const currentLoad = Number(exercise.loadKg) || 0;
    const targetRpe = Number(exercise.rpe) || 8;

    // Extrai piso e teto da faixa de repetições (ex: "8-12" -> min 8, max 12)
    const match = currentReps.match(/(\d+)\s*[-–a]\s*(\d+)/);
    const minReps = match ? parseInt(match[1], 10) : parseInt(currentReps, 10) || 8;
    const maxReps = match ? parseInt(match[2], 10) : minReps;

    if (!Array.isArray(historyLogs) || historyLogs.length === 0) {
      return {
        decision: DECISIONS.MAINTAIN,
        action: 'MANTER',
        suggestedSets: currentSets,
        suggestedReps: currentReps,
        suggestedLoadKg: currentLoad,
        suggestedRpe: targetRpe,
        rationale: 'Dados de execução insuficientes. Mantendo parâmetros conservadores.'
      };
    }

    const lastLog = historyLogs[historyLogs.length - 1];
    const performedReps = Number(lastLog.repsCompleted) || 0;
    const performedRpe = Number(lastLog.rpeExperienced) || targetRpe;
    const technicalQuality = lastLog.technicalQuality || 'BOA'; // 'EXCELENTE' | 'BOA' | 'COMPROMETIDA'

    if (technicalQuality === 'COMPROMETIDA' || performedRpe >= 10) {
      return {
        decision: DECISIONS.REPEAT,
        action: 'REPETIR COM FOCO TÉCNICO',
        suggestedSets: currentSets,
        suggestedReps: currentReps,
        suggestedLoadKg: currentLoad,
        suggestedRpe: Math.max(7, targetRpe - 1),
        rationale: 'Falha técnica ou esforço máximo identificado. Repetir carga com cadência estrita antes de progredir.'
      };
    }

    // Atingiu o teto de repetições com boa técnica e reserva de esforço (RIR >= 1)
    if (performedReps >= maxReps && performedRpe <= 9) {
      const incrementKg = currentLoad > 0 ? (currentLoad >= 50 ? 2.5 : 1.0) : 0;
      return {
        decision: DECISIONS.PROGRESS,
        action: 'AUMENTAR CARGA',
        suggestedSets: currentSets,
        suggestedReps: `${minReps}-${minReps + 2}`,
        suggestedLoadKg: currentLoad + incrementKg,
        suggestedRpe: targetRpe,
        rationale: `Teto de repetições (${maxReps} reps) superado com boa execução. Progredindo sobrecarga (+${incrementKg}kg).`
      };
    }

    // Está dentro da faixa de repetições: busca aumentar 1 repetição na próxima sessão
    if (performedReps >= minReps && performedReps < maxReps) {
      return {
        decision: DECISIONS.PROGRESS,
        action: 'PROGREDIR REPETIÇÕES',
        suggestedSets: currentSets,
        suggestedReps: `${performedReps + 1}-${maxReps}`,
        suggestedLoadKg: currentLoad,
        suggestedRpe: targetRpe,
        rationale: `Mantendo carga (${currentLoad}kg) e buscando mais repetições até o teto (${maxReps}).`
      };
    }

    return {
      decision: DECISIONS.MAINTAIN,
      action: 'CONSOLIDAR CARGA',
      suggestedSets: currentSets,
      suggestedReps: currentReps,
      suggestedLoadKg: currentLoad,
      suggestedRpe: targetRpe,
      rationale: 'Consolidando base técnica e volume no ciclo atual.'
    };
  }

  /**
   * 2. PROGRESSÃO PARA CORRIDA / ENDURANCE
   * Aplica a Regra dos 10% de volume semanal (km) e ajustes de pace.
   */
  function calculateRunningProgression(session, weeklyHistory = []) {
    const currentDistance = Number(session.distanceKm) || 5.0;
    const currentPace = String(session.paceMinKm || '5:30');
    const sessionType = session.sessionType || 'RODAGEM'; // 'TIROS' | 'TEMPO_RUN' | 'RODAGEM' | 'LONGAO'

    if (!Array.isArray(weeklyHistory) || weeklyHistory.length === 0) {
      return {
        decision: DECISIONS.MAINTAIN,
        suggestedDistanceKm: currentDistance,
        suggestedPaceMinKm: currentPace,
        rationale: 'Sem histórico de semanas anteriores. Mantendo volume seguro.'
      };
    }

    const lastWeek = weeklyHistory[weeklyHistory.length - 1];
    const completedDistance = Number(lastWeek.totalKm) || currentDistance;
    const avgRpe = Number(lastWeek.avgRpe) || 7;
    const anyDiscomfort = Boolean(lastWeek.discomfortReported);

    if (anyDiscomfort || avgRpe >= 9) {
      return {
        decision: DECISIONS.REDUCE,
        suggestedDistanceKm: Number((currentDistance * 0.85).toFixed(1)),
        suggestedPaceMinKm: currentPace,
        rationale: 'Sinais de estresse articular ou canelite. Reduzindo 15% da rodagem para regeneração tecidual.'
      };
    }

    // Regra dos 10% de sobrecarga semanal de volume seguro
    if (avgRpe <= 7.5) {
      const nextDistance = Number((currentDistance * 1.08).toFixed(1)); // +8% seguro
      return {
        decision: DECISIONS.PROGRESS,
        suggestedDistanceKm: nextDistance,
        suggestedPaceMinKm: currentPace,
        rationale: `Aderência excelente em Z2. Progressão segura de volume (+8% distância: ${nextDistance}km).`
      };
    }

    return {
      decision: DECISIONS.MAINTAIN,
      suggestedDistanceKm: currentDistance,
      suggestedPaceMinKm: currentPace,
      rationale: 'Manutenção da rodagem semanal para adaptação mitocondrial plena.'
    };
  }

  /**
   * 3. PROGRESSÃO PARA CICLISMO / SPINNING
   * Aumenta tempo na zona Sweet Spot ou potência alvo (Watts).
   */
  function calculateCyclingProgression(session, history = []) {
    const duration = Number(session.durationMinutes) || 45;
    const watts = Number(session.powerWatts) || 180;
    const ftpPct = session.ftpPercentage || '85-90%';

    const last = history[history.length - 1];
    if (last && last.completedFully && Number(last.avgRpe) <= 7.5) {
      return {
        decision: DECISIONS.PROGRESS,
        suggestedDurationMin: Math.min(120, duration + 5),
        suggestedWatts: watts > 0 ? Math.round(watts * 1.03) : null,
        suggestedFtpPct: ftpPct,
        rationale: 'Boa tolerância ao lactato. Aumentando 5 min de sustentação no Sweet Spot ou +3% watts.'
      };
    }

    return {
      decision: DECISIONS.MAINTAIN,
      suggestedDurationMin: duration,
      suggestedWatts: watts,
      suggestedFtpPct: ftpPct,
      rationale: 'Manutenção da potência e cadência para consolidação aeróbica.'
    };
  }

  /**
   * 4. PROGRESSÃO PARA NATAÇÃO
   * Controla metragem total e densidade de pausas.
   */
  function calculateSwimmingProgression(session, history = []) {
    const meters = Number(session.totalMeters) || 1500;
    const restSec = Number(session.intervalRestSeconds) || 30;

    const last = history[history.length - 1];
    if (last && last.completedMeters >= meters && Number(last.avgRpe) <= 7.5) {
      return {
        decision: DECISIONS.PROGRESS,
        suggestedMeters: meters + 150,
        suggestedRestSeconds: Math.max(15, restSec - 5),
        rationale: `Metragem completada com técnica estável. Progredindo +150m (${meters + 150}m) e refinando pausas.`
      };
    }

    return {
      decision: DECISIONS.MAINTAIN,
      suggestedMeters: meters,
      suggestedRestSeconds: restSec,
      rationale: 'Consolidação de eficiência de braçada e ritmo por 100m.'
    };
  }

  /**
   * 5. PROGRESSÃO PARA CALISTENIA
   * Evolução por níveis de alavanca mecânica (Tier 1 a 5).
   */
  function calculateCalisthenicsProgression(movement, history = []) {
    const currentTier = Number(movement.leverageTier) || 1;
    const last = history[history.length - 1];

    if (last && Number(last.repsCompleted) >= 15 && Number(last.rpe) <= 8) {
      return {
        decision: DECISIONS.PROGRESS,
        suggestedTier: Math.min(5, currentTier + 1),
        rationale: 'Domínio motor pleno na variante atual (>15 reps estritas). Progredindo para variante com maior alavanca corporal.'
      };
    }

    return {
      decision: DECISIONS.MAINTAIN,
      suggestedTier: currentTier,
      rationale: 'Construindo força de sustentação e estabilidade articular na variante presente.'
    };
  }

  /**
   * 6. PROGRESSÃO PARA SEDENTÁRIO
   * Incremento seguro de passos diários e minutos ativos sem carga excessiva.
   */
  function calculateSedentaryProgression(currentGoals = {}, history = []) {
    const steps = Number(currentGoals.dailyStepsTarget) || 5000;
    const minutes = Number(currentGoals.walkingMinutesDay) || 20;

    const last = history[history.length - 1];
    const achievedSteps = Number(last?.avgDailySteps) || 0;

    if (achievedSteps >= steps * 0.9) {
      const nextSteps = Math.min(10000, steps + 750);
      const nextMinutes = Math.min(45, minutes + 5);
      return {
        decision: DECISIONS.PROGRESS,
        suggestedDailySteps: nextSteps,
        suggestedWalkingMinutes: nextMinutes,
        rationale: `Meta de passos alcançada com consistência. Evoluindo suavemente (+750 passos: meta ${nextSteps}/dia).`
      };
    }

    return {
      decision: DECISIONS.MAINTAIN,
      suggestedDailySteps: steps,
      suggestedWalkingMinutes: minutes,
      rationale: 'Consolidando o hábito diário de caminhada antes de elevar o volume.'
    };
  }

  /**
   * Despachante Canônico de Progressão por Modalidade
   */
  function calculateProgressionForModality(modalityId, entity, history = []) {
    const id = ModalityCatalog.resolveModalityId(modalityId) || modalityId;

    switch (id) {
      case ModalityCatalog.MODALITY_IDS.RUNNING:
      case ModalityCatalog.MODALITY_IDS.RUNNING_STRENGTH:
        return calculateRunningProgression(entity, history);

      case ModalityCatalog.MODALITY_IDS.CYCLING:
      case ModalityCatalog.MODALITY_IDS.CYCLING_STRENGTH:
        return calculateCyclingProgression(entity, history);

      case ModalityCatalog.MODALITY_IDS.SWIMMING:
        return calculateSwimmingProgression(entity, history);

      case ModalityCatalog.MODALITY_IDS.CALISTHENICS:
        return calculateCalisthenicsProgression(entity, history);

      case ModalityCatalog.MODALITY_IDS.SEDENTARY:
        return calculateSedentaryProgression(entity, history);

      case ModalityCatalog.MODALITY_IDS.STRENGTH:
      default:
        return calculateStrengthProgression(entity, history);
    }
  }

  return {
    DECISIONS,
    calculateStrengthProgression,
    calculateRunningProgression,
    calculateCyclingProgression,
    calculateSwimmingProgression,
    calculateCalisthenicsProgression,
    calculateSedentaryProgression,
    calculateProgressionForModality
  };
});
