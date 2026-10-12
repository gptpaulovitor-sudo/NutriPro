/**
 * domain/training/engines/SedentaryEngine.js
 * 
 * Motor de Prescrição para Praticantes Sedentários (Nenhum — Sedentário).
 * Proibida a geração de treinos de musculação pesada ou treinos intensos automáticos.
 * Focado em: Avaliação de prontidão, metas graduais de passos (ex: 5.000 -> 7.000/dia),
 * caminhadas leves, quebra de comportamento sedentário, mobilidade e transição segura.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.SedentaryEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function generateRoutines(context = {}, options = {}) {
    const initialStepsTarget = Number(options.initialStepsTarget) || 5000;

    const routines = [
      {
        id: 'A',
        routineName: 'Plano A · Quebra do Comportamento Sedentário & Meta Diária de Passos',
        sessionType: 'ATIVIDADE_BASICA_SEDENTARIO',
        modality: 'nenhum_sedentario',
        isSedentaryPlan: true,
        dailyStepsTarget: initialStepsTarget,
        weeklyGoalMinutes: 100,
        exercises: [
          {
            exerciseId: 'sed_steps_daily',
            exerciseName: 'Meta de Movimento Diário: Passos Acumulados no Celular / Relógio',
            module: 'PASSOS_DIARIOS',
            sets: 1,
            reps: `${initialStepsTarget} passos/dia`,
            dailyStepsGoal: initialStepsTarget,
            rpe: 4.0,
            restSeconds: 0,
            notes: 'Acumule passos fracionados ao longo do dia: caminhadas de 10 minutos após refeições, subir escadas e evitar longos períodos sentado contínuos.'
          },
          {
            exerciseId: 'sed_walking_soft',
            exerciseName: 'Caminhada Leve Contínua em Terreno Plano',
            module: 'CAMINHADA_ADAPTACAO',
            sets: 3,
            reps: '20 min confortáveis',
            durationMinutes: 20,
            rpe: 4.5,
            restSeconds: 0,
            notes: 'Ritmo suave e agradável. Use tênis confortável com amortecimento. Não force a velocidade.'
          },
          {
            exerciseId: 'sed_posture_mob',
            exerciseName: 'Pausas Posturais & Respiração Diafragmática',
            module: 'MOBILIDADE_POSTURAL',
            sets: 2,
            reps: '5 min ao dia',
            durationMinutes: 5,
            rpe: 2.0,
            restSeconds: 0,
            notes: 'A cada 2 horas sentado, levante-se por 2 minutos, estique os braços para cima e respire profundamente.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Plano B · Mobilidade Articular Básica em Casa & Alívio de Dores',
        sessionType: 'MOBILIDADE_LEVE_CASA',
        modality: 'nenhum_sedentario',
        isSedentaryPlan: true,
        exercises: [
          {
            exerciseId: 'sed_chair_sit_stand',
            exerciseName: 'Sentar e Levantar da Cadeira com Controle (Ativação Funcional)',
            sets: 3,
            reps: '8-10 reps',
            rpe: 4.5,
            restSeconds: 60,
            notes: 'Sem peso adicional. Apenas apoiar os pés firmes, sentar de forma suave e levantar estendendo os joelhos.'
          },
          {
            exerciseId: 'sed_cat_cow',
            exerciseName: 'Alongamento Gato-Vaca (Alívio Lombar e Torácico)',
            sets: 2,
            reps: '10 respirações suaves',
            rpe: 2.0,
            restSeconds: 30,
            notes: 'No colchonete ou cama: mobilize suavemente a coluna sem dor.'
          },
          {
            exerciseId: 'sed_ankle_mob',
            exerciseName: 'Mobilidade de Tornozelo e Panturrilha na Parede',
            sets: 2,
            reps: '10 cada lado',
            rpe: 3.0,
            restSeconds: 30,
            notes: 'Favorece o retorno venoso e a estabilidade da marcha.'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Plano C · Transição e Preparação para Modalidade Ativa',
        sessionType: 'TRANSICAO_MODALIDADE_ATIVA',
        modality: 'nenhum_sedentario',
        isSedentaryPlan: true,
        exercises: [
          {
            exerciseId: 'sed_walk_expanded',
            exerciseName: 'Caminhada Rítmica de 30 Minutos em Parque ou Esteira',
            sets: 1,
            reps: '30 min contínuos',
            durationMinutes: 30,
            rpe: 5.0,
            restSeconds: 0,
            notes: 'Ritmo conversacional ligeiramente mais animado para testar a capacidade cardiorrespiratória antes de migrar para uma modalidade formal.'
          },
          {
            exerciseId: 'sed_readiness_check',
            exerciseName: 'Check-in de Prontidão: Como seu corpo respondeu?',
            sets: 1,
            reps: 'Avaliação',
            rpe: 1.0,
            restSeconds: 0,
            notes: 'Se completou 2 semanas sem dores com mais de 6.000 passos/dia, convide o profissional a escolher Musculação, Caminhada Rápida ou Natação!'
          }
        ]
      }
    ];

    return {
      modality: 'nenhum_sedentario',
      split: 'Sedentario',
      isSedentaryPlan: true,
      initialStepsTarget: initialStepsTarget,
      routines: routines
    };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Plano sedentário deve possuir ao menos 1 meta de passos ou caminhada.');
      return { isValid: false, errors };
    }

    // Validação estrita de segurança clínica para sedentários: NÃO permitir supino pesado ou agachamento máximo
    const containsHeavyBarbell = routine.exercises.some(ex => {
      const name = String(ex.exerciseName || ex.name || '').toLowerCase();
      return name.includes('supino reto com barra') || name.includes('agachamento livre com barra') || name.includes('deadlift');
    });

    if (containsHeavyBarbell) {
      errors.push('SEGURANÇA CLÍNICA VIOLADA: Praticantes sedentários não podem receber exercícios pesados com barra sem período prévio de adaptação.');
    }

    return { isValid: errors.length === 0, errors };
  }

  return {
    generateRoutines,
    validateRoutine
  };
});
