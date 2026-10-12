/**
 * domain/training/engines/CrossfitEngine.js
 * 
 * Motor de Prescrição para CrossFit & Funcional.
 * Modelagem tripartite canônica: Bloco de Habilidade / Força (LPO/Ginástica),
 * WOD / Metcon principal com padrões Rx vs Scaled, e Acessórios / Mobilidade.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.CrossfitEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function generateRoutines(context = {}, options = {}) {
    const scale = options.scaleLevel || 'Rx'; // 'Rx' | 'Scaled'

    const routines = [
      {
        id: 'A',
        routineName: 'Treino A · Força LPO & WOD "Fran" Adaptado',
        sessionType: 'CROSSFIT_COMPLETO',
        modality: 'crossfit_funcional',
        scaleLevel: scale,
        exercises: [
          // Bloco 1: Força / Técnica (LPO)
          {
            exerciseId: 'cf_strength_front_squat',
            exerciseName: '[BLOCO 1 · FORÇA] Front Squat (Agachamento Frontal com Barra)',
            blockType: 'FORCA_LPO',
            sets: 5,
            reps: '3-3-3-3-3',
            loadKg: scale === 'Rx' ? 85 : 55,
            rpe: 8.5,
            restSeconds: 120,
            notes: 'Cotovelos altos, tronco vertical e profundidade abaixo do paralelo.'
          },
          // Bloco 2: WOD (21-15-9)
          {
            exerciseId: 'cf_wod_thruster',
            exerciseName: '[BLOCO 2 · WOD 21-15-9] Thrusters com Barra Olímpica',
            blockType: 'WOD_METCON',
            sets: 3,
            reps: '21 - 15 - 9',
            loadKg: scale === 'Rx' ? 43 : 30,
            rpe: 9.5,
            restSeconds: 0,
            notes: 'Combinação contínua sem pausas com pull-ups em formato sprint.'
          },
          {
            exerciseId: 'cf_wod_pullups',
            exerciseName: '[BLOCO 2 · WOD 21-15-9] Pull-ups (Kipping ou Butterfly)',
            blockType: 'WOD_METCON',
            sets: 3,
            reps: '21 - 15 - 9',
            rpe: 9.5,
            restSeconds: 0,
            notes: 'Queixo acima da barra a cada repetição. Versão Scaled com Jumping Pull-ups ou Elástico.'
          },
          // Bloco 3: Acessório & Core
          {
            exerciseId: 'cf_acc_hollow_rock',
            exerciseName: '[BLOCO 3 · ACESSÓRIO] Hollow Rocks & Arch Body',
            blockType: 'CORE_ACESSORIO',
            sets: 3,
            reps: '20 rocks + 30s arch',
            rpe: 7.5,
            restSeconds: 45,
            notes: 'Fortalecimento da cadeia anterior e posterior para ginástica.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Treino B · Habilidade Ginástica & WOD Chipper com Ergômetro',
        sessionType: 'CROSSFIT_GINASTICA_E_WOD',
        modality: 'crossfit_funcional',
        scaleLevel: scale,
        exercises: [
          {
            exerciseId: 'cf_skill_hspu',
            exerciseName: '[BLOCO 1 · TÉCNICA] Handstand Push-up (HSPU) ou Pike Push-up',
            blockType: 'SKILL_GINASTICA',
            sets: 4,
            reps: '5-8 estritos',
            rpe: 8.0,
            restSeconds: 90,
            notes: 'Controle na descida até encostar no abmat e empurrada vertical.'
          },
          {
            exerciseId: 'cf_wod_row_burpee',
            exerciseName: '[BLOCO 2 · WOD 15 MIN AMRAP] 15 Cal Remo + 12 Box Jumps + 9 T2B',
            blockType: 'WOD_METCON',
            sets: 1,
            reps: '15 min AMRAP',
            rpe: 9.0,
            restSeconds: 0,
            notes: 'Manter ritmo constante round a round sem quebras prematuras.'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Treino C · Força Básica & WOD de Resistência Metabólica (Kettlebell & Sprints)',
        sessionType: 'CROSSFIT_ENDURANCE',
        modality: 'crossfit_funcional',
        scaleLevel: scale,
        exercises: [
          {
            exerciseId: 'cf_strength_deadlift',
            exerciseName: '[BLOCO 1 · FORÇA] Levantamento Terra Convencional Pesado',
            blockType: 'FORCA_LPO',
            sets: 4,
            reps: '5-5-5-5',
            loadKg: scale === 'Rx' ? 120 : 80,
            rpe: 8.5,
            restSeconds: 150,
            notes: 'Base neuromuscular sólida.'
          },
          {
            exerciseId: 'cf_wod_kb_swing_lunge',
            exerciseName: '[BLOCO 2 · WOD FOR TIME] 50 KB Swings + 40 Wall Balls + 30 Burpees',
            blockType: 'WOD_METCON',
            sets: 1,
            reps: 'For Time (Cap 18m)',
            rpe: 9.0,
            restSeconds: 0,
            notes: 'Divisão estratégica das séries de kettlebell para evitar falha de antebraço.'
          }
        ]
      }
    ];

    return {
      modality: 'crossfit_funcional',
      split: 'CrossFit',
      routines: routines
    };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Rotina de CrossFit deve possuir blocos de treino estruturados.');
      return { isValid: false, errors };
    }
    return { isValid: errors.length === 0, errors };
  }

  return {
    generateRoutines,
    validateRoutine
  };
});
