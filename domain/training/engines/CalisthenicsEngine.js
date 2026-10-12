/**
 * domain/training/engines/CalisthenicsEngine.js
 * 
 * Motor de Prescrição para Calistenia (Bodyweight).
 * Modelagem de padrões de movimento (Push, Pull, Legs, Core), níveis de alavanca mecânica (Tier 1-5),
 * assistência, séries, repetições estritas, isometrias (segundos) e critérios de progressão técnica.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.CalisthenicsEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function generateRoutines(context = {}, options = {}) {
    const routines = [
      {
        id: 'A',
        routineName: 'Treino A · Tração (Pull) - Força Relativa em Barra & Argolas',
        sessionType: 'CALISTENIA_TRACAO',
        modality: 'calistenia',
        exercises: [
          {
            exerciseId: 'cal_pullup_strict',
            exerciseName: 'Barra Fixa Pronada Estrita (Pull-up)',
            movementPattern: 'Tracao_Vertical',
            leverageTier: 3,
            sets: 4,
            reps: '6-8 estritas',
            rpe: 8.5,
            restSeconds: 120,
            cadence: '3-0-1-0',
            notes: 'Queixo nítido acima da barra · descida total até extensão completa sem balanço ou kipping.'
          },
          {
            exerciseId: 'cal_chinup_iso',
            exerciseName: 'Barra Supinada com Pausa Isométrica no Topo (Chin-up)',
            movementPattern: 'Tracao_Vertical_Supinada',
            leverageTier: 3,
            sets: 3,
            reps: '6-8 reps + 2s ISO',
            rpe: 8.5,
            restSeconds: 90,
            cadence: '3-0-1-2',
            notes: 'Pausa de 2s no topo contraindo dorsais e bíceps.'
          },
          {
            exerciseId: 'cal_row_australian',
            exerciseName: 'Remada Australiana em Barra Baixa / Argolas',
            movementPattern: 'Tracao_Horizontal',
            leverageTier: 2,
            sets: 4,
            reps: '10-12',
            rpe: 8.0,
            restSeconds: 60,
            cadence: '2-1-1-0',
            notes: 'Retração escapular firme com peito tocando a barra.'
          },
          {
            exerciseId: 'cal_toes_to_bar',
            exerciseName: 'Elevação de Pernas Suspenso na Barra (Toes-to-Bar)',
            movementPattern: 'Core_Suspenso',
            leverageTier: 3,
            sets: 4,
            reps: '10-12',
            rpe: 8.0,
            restSeconds: 60,
            notes: 'Pés tocam a barra ou joelhos no peito sem impulso lombar.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Treino B · Empurrar (Push) - Barras Paralelas & Flexões Angulares',
        sessionType: 'CALISTENIA_EMPURRAR',
        modality: 'calistenia',
        exercises: [
          {
            exerciseId: 'cal_dips_parallel',
            exerciseName: 'Mergulho em Barras Paralelas (Dips)',
            movementPattern: 'Empurrar_Vertical',
            leverageTier: 3,
            sets: 4,
            reps: '8-10',
            rpe: 8.5,
            restSeconds: 90,
            cadence: '3-0-1-0',
            notes: 'Cotovelos a 90° e extensão firme no topo.'
          },
          {
            exerciseId: 'cal_diamond_pushup',
            exerciseName: 'Flexão Diamante ou Declinada com Pés Elevados',
            movementPattern: 'Empurrar_Horizontal',
            leverageTier: 2,
            sets: 4,
            reps: '12-15',
            rpe: 8.0,
            restSeconds: 60,
            cadence: '2-0-1-0',
            notes: 'Foco no tríceps e peitoral medial com tronco alinhado.'
          },
          {
            exerciseId: 'cal_pike_pushup',
            exerciseName: 'Pike Push-up (Preparação de Handstand)',
            movementPattern: 'Empurrar_Vertical_Ombro',
            leverageTier: 3,
            sets: 3,
            reps: '8-10',
            rpe: 8.0,
            restSeconds: 90,
            notes: 'Cabeça desce à frente das mãos formando um triângulo no solo.'
          },
          {
            exerciseId: 'cal_hollow_body',
            exerciseName: 'Canoa Isométrica no Solo (Hollow Body Hold)',
            movementPattern: 'Core_Antiextensao',
            leverageTier: 2,
            sets: 4,
            reps: '45s',
            rpe: 8.0,
            restSeconds: 45,
            notes: 'Lombar rigorosamente colada no chão · base ginástica.'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Treino C · Pernas com Peso Corporal & Equilíbrio (Pistol & Core)',
        sessionType: 'CALISTENIA_PERNAS',
        modality: 'calistenia',
        exercises: [
          {
            exerciseId: 'cal_pistol_squat',
            exerciseName: 'Pistol Squat (Agachamento Unilateral Livre)',
            movementPattern: 'Dominancia_Joelho_Unilateral',
            leverageTier: 4,
            sets: 4,
            reps: '5-6 cada perna',
            rpe: 8.5,
            restSeconds: 90,
            notes: 'Equilíbrio e mobilidade máxima de tornozelo (dorsiflexão).'
          },
          {
            exerciseId: 'cal_jumping_lunges',
            exerciseName: 'Passadas com Salto Pliométrico (Jumping Lunges)',
            movementPattern: 'Potencia_Pernas',
            leverageTier: 2,
            sets: 3,
            reps: '12 saltos',
            rpe: 8.0,
            restSeconds: 60,
            notes: 'Aterrissagem elástica e absorção suave com o antepé.'
          },
          {
            exerciseId: 'cal_dragon_flag',
            exerciseName: 'Dragon Flag ou Elevação Reversa de Tronco',
            movementPattern: 'Core_Avancado',
            leverageTier: 4,
            sets: 3,
            reps: '6-8 reps / 30s',
            rpe: 8.5,
            restSeconds: 60,
            notes: 'Corpo em linha reta da ponta dos pés aos ombros.'
          }
        ]
      }
    ];

    return {
      modality: 'calistenia',
      split: 'Calistenia',
      routines: routines
    };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Rotina de calistenia deve possuir ao menos 1 movimento de peso corporal.');
      return { isValid: false, errors };
    }
    return { isValid: errors.length === 0, errors };
  }

  return {
    generateRoutines,
    validateRoutine
  };
});
