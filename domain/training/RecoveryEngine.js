/**
 * domain/training/RecoveryEngine.js
 * 
 * Motor Canônico de Recuperação e Gestão de Fadiga Biomecânica.
 * Avalia demanda acumulada, interferência concorrente entre estímulos,
 * tempos de recuperação articular/muscular e critérios de deload.
 * 
 * Camada de Domínio Puro — Sem dependência de DOM, Dexie ou Firebase.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.RecoveryEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Prazos Fisiológicos Mínimos de Recuperação por Tipo de Estímulo
   */
  const RECOVERY_TIMEFRAMES_HOURS = Object.freeze({
    MAXIMAL_STRENGTH_LOWER: 72,      // Pernas pesado (Squat/Deadlift RPE >= 8.5)
    MAXIMAL_STRENGTH_UPPER: 48,      // Tronco pesado (Bench/Row RPE >= 8.5)
    HYPERTROPHY_MODERATE: 48,        // Hipertrofia padrão (RPE 7-8)
    HIGH_INTENSITY_INTERVALS: 48,    // HIIT / Tiros de corrida / Sprints
    ZONE_2_ENDURANCE: 24,            // Rodagem Z2 / Giro leve
    METCON_MAXIMAL: 48,              // WOD anaeróbio extenuante
    TECHNICAL_SKILL: 24,             // Educativos técnicos / Mobilidade
    ACTIVE_REST: 12                  // Caminhada leve / Recuperação ativa
  });

  /**
   * Avalia a distribuição semanal e detecta conflitos de recuperação
   * @param {Array<Object>} weeklySchedule - Array com os 7 dias da semana
   * @returns {{ hasConflicts: boolean, warnings: Array<string>, recommendations: Array<string> }}
   */
  function evaluateWeeklyRecoveryDistribution(weeklySchedule) {
    if (!Array.isArray(weeklySchedule) || weeklySchedule.length < 2) {
      return { hasConflicts: false, warnings: [], recommendations: [] };
    }

    const warnings = [];
    const recommendations = [];

    // 1. Verifica dias consecutivos de pernas pesadas ou treino concorrente agressivo
    for (let i = 0; i < weeklySchedule.length; i++) {
      const current = weeklySchedule[i];
      const next = weeklySchedule[(i + 1) % weeklySchedule.length];

      const currentTitle = String(current.title || current.name || '').toLowerCase();
      const nextTitle = String(next.title || next.name || '').toLowerCase();

      // Conflito Pernas -> Pernas consecutivo
      const isLegsToday = currentTitle.includes('lower') || currentTitle.includes('legs') || currentTitle.includes('perna');
      const isLegsTomorrow = nextTitle.includes('lower') || nextTitle.includes('legs') || nextTitle.includes('perna');
      if (isLegsToday && isLegsTomorrow && current.type === 'Treino' && next.type === 'Treino') {
        warnings.push(`Treinos de membros inferiores alocados em dias consecutivos (Dia ${i + 1} e Dia ${((i + 1) % 7) + 1}).`);
        recommendations.push(`Insira um intervalo de pelo menos 48h a 72h entre sessões intensas de pernas para permitir supercompensação.`);
      }

      // Conflito Pernas Pesado -> Tiros de Corrida / HIIT de alto impacto
      const isCardioHighTomorrow = next.type === 'Cardio' && (nextTitle.includes('tiro') || nextTitle.includes('hiit') || nextTitle.includes('vo2'));
      if (isLegsToday && isCardioHighTomorrow) {
        warnings.push(`Sessão de alta intensidade cardiovascular imediatamente após treino pesado de pernas.`);
        recommendations.push(`Prefira cardio oxidativo em Zona 2 ou descanso após pernas pesadas para proteger tendões patelares e isquiotibiais.`);
      }
    }

    // 2. Verifica se a semana possui ao menos 1 dia completo de recuperação (OFF)
    const offDaysCount = weeklySchedule.filter(d => d.type === 'Off' || d.type === 'Descanso' || String(d.title).toLowerCase().includes('descanso')).length;
    if (offDaysCount === 0) {
      warnings.push('Ausência de dias de descanso (OFF) no microciclo de 7 dias.');
      recommendations.push('Recomenda-se reservar pelo menos 1 a 2 dias semanais para recuperação neural e celular sistêmica.');
    }

    return {
      hasConflicts: warnings.length > 0,
      warnings,
      recommendations
    };
  }

  /**
   * Calcula a prontidão para o próximo treino com base no esforço subjetivo e dores articulares
   * @param {Object} lastSessionFeedback - Feedback da última sessão { rpeScore, jointDiscomfort, completionRate }
   * @returns {{ readinessStatus: 'OPTIMAL'|'MAINTAIN'|'REDUCE'|'DELOAD', advice: string, volumeModifier: number }}
   */
  function evaluateReadinessAndFatigue(lastSessionFeedback = {}) {
    const rpe = Number(lastSessionFeedback.rpeScore) || 7;
    const joints = Array.isArray(lastSessionFeedback.jointDiscomfort)
      ? lastSessionFeedback.jointDiscomfort
      : [lastSessionFeedback.jointDiscomfort || 'nenhum'];
    const hasJointPain = joints.some(j => j && j !== 'nenhum');
    const completion = Number(lastSessionFeedback.completionRate) || 100;

    // Caso de dor articular declarada: redução preventiva imediata
    if (hasJointPain) {
      return {
        readinessStatus: 'DELOAD',
        advice: `Desconforto articular relatado (${joints.filter(j => j !== 'nenhum').join(', ')}). Reduzir cargas axiais em 20-30% e substituir movimentos de impacto por variações suaves.`,
        volumeModifier: 0.75
      };
    }

    // Fadiga excessiva acumulada (RPE 9.5-10 constante com quebra de conclusão)
    if (rpe >= 9.5 && completion < 85) {
      return {
        readinessStatus: 'REDUCE',
        advice: 'Sinais de estafa neural e incapacidade de sustentar volume. Reduzir 1 série por exercício e priorizar sono e hidratação.',
        volumeModifier: 0.85
      };
    }

    // RPE moderado e conclusão plena: ótimo para progredir
    if (rpe <= 8 && completion >= 90) {
      return {
        readinessStatus: 'OPTIMAL',
        advice: 'Excelente capacidade de recuperação demonstrada. Condições favoráveis para progressão planejada.',
        volumeModifier: 1.05
      };
    }

    // Estado neutro sustentável
    return {
      readinessStatus: 'MAINTAIN',
      advice: 'Recuperação adequada. Manter parâmetros planejados sem aceleração precipitada.',
      volumeModifier: 1.0
    };
  }

  return {
    RECOVERY_TIMEFRAMES_HOURS,
    evaluateWeeklyRecoveryDistribution,
    evaluateReadinessAndFatigue
  };
});
