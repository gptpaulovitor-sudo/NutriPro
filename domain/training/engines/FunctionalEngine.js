/**
 * domain/training/engines/FunctionalEngine.js
 * 
 * Motor de Prescrição para Funcional Misto.
 * Modelagem por blocos de capacidades-alvo: Ativação/Mobilidade, Estabilidade de Core,
 * Padrões Fundamentais de Força Multiplanar e Condicionamento Metabólico de Finalização.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.FunctionalEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function generateRoutines(context = {}, options = {}) {
    const routines = [
      {
        id: 'A',
        routineName: 'Treino A · Mobilidade, Cadeia Posterior & Potência de Quadril',
        sessionType: 'FUNCIONAL_POTENCIA_POSTERIOR',
        modality: 'funcional_misto',
        targetDurationMinutes: 50,
        exercises: [
          // Bloco 1: Ativação & Mobilidade
          {
            exerciseId: 'func_mob_hip',
            exerciseName: '[BLOCO 1 · MOBILIDADE] Mobilidade de Quadril 90/90 & World Greatest Stretch',
            blockType: 'ATIVACAO_MOBILIDADE',
            sets: 3,
            reps: '8 cada lado',
            rpe: 5.0,
            restSeconds: 30,
            notes: 'Abertura capsular de quadril e rotação torácica suave.'
          },
          // Bloco 2: Força & Padrões Multiplanares
          {
            exerciseId: 'func_kb_deadlift',
            exerciseName: '[BLOCO 2 · FORÇA] Levantamento Terra Romeno com Kettlebells Duplos',
            blockType: 'FORCA_FUNDAMENTAL',
            sets: 4,
            reps: '10-12',
            loadKg: '2x20kg',
            rpe: 8.0,
            restSeconds: 75,
            notes: 'Padrão Hinge estrito com retração escapular.'
          },
          {
            exerciseId: 'func_goblet_squat',
            exerciseName: '[BLOCO 2 · FORÇA] Goblet Squat com Kettlebell Pesado',
            blockType: 'FORCA_FUNDAMENTAL',
            sets: 4,
            reps: '10-12',
            loadKg: 24,
            rpe: 8.0,
            restSeconds: 60,
            notes: 'Profundidade confortável mantendo o tronco ereto.'
          },
          // Bloco 3: Core & Condicionamento
          {
            exerciseId: 'func_woodchopper',
            exerciseName: '[BLOCO 3 · CORE] Woodchopper Rotacional com Elástico / Polia',
            blockType: 'CORE_ROTACIONAL',
            sets: 3,
            reps: '12 cada lado',
            rpe: 7.5,
            restSeconds: 45,
            notes: 'Transferência de força diagonal com pés firmes.'
          },
          {
            exerciseId: 'func_kettlebell_carry',
            exerciseName: '[BLOCO 3 · FINALIZADOR] Suitcase Carry Unilateral',
            blockType: 'METABOLICO_FINALIZADOR',
            sets: 3,
            reps: '40m cada lado',
            loadKg: 20,
            rpe: 8.0,
            restSeconds: 60,
            notes: 'Anti-flexão lateral do tronco.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Treino B · Estabilidade Escapular, Empurrar/Puxar & Agilidade',
        sessionType: 'FUNCIONAL_TRONCO_AGILIDADE',
        modality: 'funcional_misto',
        targetDurationMinutes: 45,
        exercises: [
          {
            exerciseId: 'func_bear_crawl',
            exerciseName: '[BLOCO 1 · CORE] Rastejo do Urso com Joelhos Flutuando (Bear Crawl)',
            sets: 4,
            reps: '15m ida e volta',
            rpe: 7.5,
            restSeconds: 45,
            notes: 'Coordenação cruzada contralateral e estabilidade escapulotorácica.'
          },
          {
            exerciseId: 'func_renegade_row',
            exerciseName: '[BLOCO 2 · FORÇA] Remada Renegada na Prancha com Halteres',
            sets: 3,
            reps: '8 cada braço',
            loadKg: 14,
            rpe: 8.0,
            restSeconds: 60,
            notes: 'Anti-rotação de bacia com puxada firme de cotovelo.'
          },
          {
            exerciseId: 'func_pushup_step',
            exerciseName: '[BLOCO 2 · FORÇA] Flexão de Braço com Toque no Ombro Oposto',
            sets: 3,
            reps: '12 flexões',
            rpe: 8.0,
            restSeconds: 60,
            notes: 'Estabilidade anterior sob apoio unilateral temporário.'
          },
          {
            exerciseId: 'func_ball_slams',
            exerciseName: '[BLOCO 3 · FINALIZADOR] Medicine Ball Slams Explosivos no Solo',
            sets: 4,
            reps: '15 pancadas',
            loadKg: 8,
            rpe: 8.5,
            restSeconds: 45,
            notes: 'Extensão tripla seguida de flexão violenta de tronco com bola.'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Treino C · Circuitos Dinâmicos de Agilidade & Resistência Global',
        sessionType: 'FUNCIONAL_RESISTENCIA_GLOBAL',
        modality: 'funcional_misto',
        targetDurationMinutes: 45,
        exercises: [
          {
            exerciseId: 'func_lateral_lunges',
            exerciseName: '[BLOCO 1 · FORÇA LATERAL] Passada Lateral (Cossack / Lateral Lunge)',
            sets: 3,
            reps: '10 cada lado',
            rpe: 7.5,
            restSeconds: 60,
            notes: 'Trabalho no plano frontal ampliando mobilidade de adutores.'
          },
          {
            exerciseId: 'func_kettlebell_swing',
            exerciseName: '[BLOCO 2 · POTÊNCIA] Kettlebell Swing Russo em Ritmo Fluido',
            sets: 4,
            reps: '20 reps',
            loadKg: 20,
            rpe: 8.0,
            restSeconds: 60,
            notes: 'Potência pura de quadril sem flexão excessiva de joelhos.'
          },
          {
            exerciseId: 'func_plank_reach',
            exerciseName: '[BLOCO 3 · CORE] Prancha Frontal com Alcance Alternado de Braços',
            sets: 3,
            reps: '16 alcances',
            rpe: 7.5,
            restSeconds: 45,
            notes: 'Isometria de tronco sem balançar quadril.'
          }
        ]
      }
    ];

    return {
      modality: 'funcional_misto',
      split: 'FuncionalMisto',
      routines: routines
    };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Rotina funcional deve possuir ao menos 1 exercício ou bloco.');
      return { isValid: false, errors };
    }
    return { isValid: errors.length === 0, errors };
  }

  return {
    generateRoutines,
    validateRoutine
  };
});
