/**
 * domain/training/engines/TeamSportsEngine.js
 * 
 * Motor de Prescrição para Esportes Coletivos (Futebol, Basquete, Vôlei, etc.).
 * Modelagem de taxa de desenvolvimento de força (RFD), agilidade e mudança de direção (COD),
 * controle de saltos e aterrissagens, aceleração/desaceleração e prevenção de lesões (LCA/Isquiotibiais).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.TeamSportsEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function generateRoutines(context = {}, options = {}) {
    const sport = options.sportName || 'Futebol / Esporte Intermitente';

    const routines = [
      {
        id: 'A',
        routineName: 'Treino A · Força Reativa & Pliometria (Taxa de Força / RFD)',
        sessionType: 'POTENCIA_E_PLIOMETRIA',
        modality: 'esportes_coletivos',
        sportName: sport,
        exercises: [
          {
            exerciseId: 'do16_trapbar',
            exerciseName: 'Levantamento Terra com Trap Bar (Saída Explosiva)',
            sets: 4,
            reps: '4-5 reps',
            loadKg: 95,
            rpe: 8.0,
            restSeconds: 120,
            cadence: 'Explosivo',
            notes: 'Produção rápida de força contra o solo (RFD).'
          },
          {
            exerciseId: 'team_box_jumps',
            exerciseName: 'Saltos em Caixa com Extensão Tripla e Amortecimento Macio',
            sets: 4,
            reps: '5 saltos',
            rpe: 7.5,
            restSeconds: 90,
            notes: 'Foco no amortecimento elástico sem colapso valgo do joelho.'
          },
          {
            exerciseId: 'lg07_plyo',
            exerciseName: 'Agachamento Búlgaro com Salto / Carga Unilateral',
            sets: 3,
            reps: '6 cada perna',
            loadKg: 14,
            rpe: 8.0,
            restSeconds: 90,
            notes: 'Força unilateral indispensável para passadas rápidas em campo/quadra.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Treino B · Agilidade, Mudança de Direção (COD) & Excêntrico Nórdico',
        sessionType: 'AGILIDADE_E_PREVENCAO',
        modality: 'esportes_coletivos',
        sportName: sport,
        exercises: [
          {
            exerciseId: 'team_cod_drills',
            exerciseName: 'Drills de Mudança de Direção em Cones (Teste em T / 5-10-5)',
            sets: 6,
            reps: '15m percurso',
            rpe: 8.5,
            restSeconds: 60,
            notes: 'Aceleração, frenagem controlada com centro de gravidade baixo e re-aceleração.'
          },
          {
            exerciseId: 'team_nordic_curls',
            exerciseName: 'Flexão Nórdica de Isquiotibiais (Nordic Hamstring Curl)',
            sets: 3,
            reps: '5-6 excêntricas lentas',
            rpe: 8.5,
            restSeconds: 90,
            cadence: '4-0-0-0',
            notes: 'Padrão ouro mundial na prevenção de estiramento de isquiotibiais em sprints.'
          },
          {
            exerciseId: 'ab06_abduction',
            exerciseName: 'Prancha Lateral com Abdução de Quadril (Glúteo Médio)',
            sets: 3,
            reps: '30s cada lado',
            rpe: 7.5,
            restSeconds: 45,
            notes: 'Estabilizador primário contra lesão de ligamento cruzado anterior (LCA).'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Treino C · Condicionamento Intermitente Específico (Shuttle Sprints)',
        sessionType: 'CONDICIONAMENTO_INTERMITENTE',
        modality: 'esportes_coletivos',
        sportName: sport,
        exercises: [
          {
            exerciseId: 'team_shuttle_runs',
            exerciseName: 'Sprints Intermitentes 15s / 15s (Shuttle Run com Ida e Volta)',
            sets: 10,
            reps: '15s sprint / 15s trote',
            rpe: 9.0,
            restSeconds: 15,
            notes: 'Capacidade de repetir sprints em estado de fadiga de segundo tempo de partida.'
          },
          {
            exerciseId: 'pe18_explosive',
            exerciseName: 'Flexões com Empurrada Explosiva / Batida de Mão',
            sets: 3,
            reps: '8-10',
            rpe: 8.0,
            restSeconds: 60,
            notes: 'Potência de tronco para disputas de espaço e contato corporal.'
          },
          {
            exerciseId: 'ab02_woodchop',
            exerciseName: 'Rotação de Tronco no Cabo (Woodchopper)',
            sets: 3,
            reps: '12 cada lado',
            rpe: 7.5,
            restSeconds: 45,
            notes: 'Potência rotacional para chutes, arremessos e giros de marcação.'
          }
        ]
      }
    ];

    return {
      modality: 'esportes_coletivos',
      split: 'EsportesColetivos',
      routines: routines
    };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Rotina de esportes coletivos deve possuir exercícios estruturados.');
      return { isValid: false, errors };
    }
    return { isValid: errors.length === 0, errors };
  }

  return {
    generateRoutines,
    validateRoutine
  };
});
