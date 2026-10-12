/**
 * domain/training/engines/MixedCardioStrengthEngine.js
 * 
 * Motor de Prescrição para Misto — Força + Cardio.
 * Módulos independentes e bem equilibrados de força muscular e cardio oxidativo,
 * com ordem de execução explícita, sem presumir automaticamente que o cardio seja HIIT.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.MixedCardioStrengthEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function generateRoutines(context = {}, options = {}) {
    const routines = [
      {
        id: 'A',
        routineName: 'Treino A · Tronco Superior (Força) + Cardio Contínuo Z2 (Pós-Treino)',
        sessionType: 'MISTO_SUPERIOR_E_CARDIO_Z2',
        modality: 'misto_forca_cardio',
        coordinationOrder: 'FORCA_PRIMEIRO_DEPOIS_CARDIO',
        exercises: [
          // Bloco de Força
          {
            exerciseId: 'pe01',
            exerciseName: '[FORÇA TRONCO] Supino Reto com Barra',
            module: 'FORCA',
            sets: 4,
            reps: '8-10',
            loadKg: 65,
            rpe: 8.0,
            restSeconds: 90,
            notes: 'Tensão mecânica no peitoral maior.'
          },
          {
            exerciseId: 'do08',
            exerciseName: '[FORÇA TRONCO] Remada Curvada com Barra',
            module: 'FORCA',
            sets: 4,
            reps: '8-10',
            loadKg: 55,
            rpe: 8.0,
            restSeconds: 90,
            notes: 'Espessura de costas e romboides.'
          },
          {
            exerciseId: 'sh06',
            exerciseName: '[FORÇA TRONCO] Elevação Lateral com Halteres',
            module: 'FORCA',
            sets: 3,
            reps: '12-15',
            loadKg: 10,
            rpe: 8.5,
            restSeconds: 45,
            notes: 'Deltoide medial.'
          },
          // Bloco Cardio Oxidativo Z2 (Sem HIIT)
          {
            exerciseId: 'mixed_cardio_z2_post',
            exerciseName: '[CARDIO OXIDATIVO] Esteira Inclinada / Bike em Zona 2',
            module: 'CARDIO',
            sets: 1,
            reps: '25 min contínuos',
            durationMinutes: 25,
            heartRateZone: 'Zona 2 (60-70% FCmáx)',
            rpe: 6.5,
            restSeconds: 0,
            notes: 'Oxidação de ácidos graxos sem choque neuromuscular após a musculação.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Treino B · Membros Inferiores (Força & Hipertrofia Completa)',
        sessionType: 'FORCA_INFERIOR_DEDICADA',
        modality: 'misto_forca_cardio',
        exercises: [
          {
            exerciseId: 'lg01',
            exerciseName: 'Agachamento Livre com Barra',
            sets: 4,
            reps: '6-8',
            loadKg: 80,
            rpe: 8.0,
            restSeconds: 120,
            notes: 'Quadríceps e glúteos com amplitude profunda.'
          },
          {
            exerciseId: 'lg04',
            exerciseName: 'Leg Press 45°',
            sets: 3,
            reps: '10-12',
            loadKg: 170,
            rpe: 8.0,
            restSeconds: 90,
            notes: 'Volume articular seguro.'
          },
          {
            exerciseId: 'lg10',
            exerciseName: 'Stiff com Barra (Cadeia Posterior)',
            sets: 4,
            reps: '8-10',
            loadKg: 65,
            rpe: 8.0,
            restSeconds: 90,
            notes: 'Alongamento de isquiotibiais.'
          },
          {
            exerciseId: 'lg20',
            exerciseName: 'Panturrilha em Pé na Máquina',
            sets: 4,
            reps: '12-15',
            loadKg: 60,
            rpe: 8.5,
            restSeconds: 45,
            notes: 'Pausa no fundo.'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Treino C · Sessão Cardiovascular Dedicada (Ergômetros / Pista Z2/Z3)',
        sessionType: 'CARDIO_DEDICADO_ISOLADO',
        modality: 'misto_forca_cardio',
        exercises: [
          {
            exerciseId: 'mixed_dedicated_cardio',
            exerciseName: 'Sessão Contínua de Remo Concept2 ou Esteira (40 min)',
            sets: 1,
            reps: '40 min contínuos',
            durationMinutes: 40,
            heartRateZone: 'Zona 2 / Zona 3',
            rpe: 7.0,
            restSeconds: 0,
            notes: 'Sessão dedicada exclusiva para aprimoramento cardiorrespiratório sem treino de força no dia.'
          },
          {
            exerciseId: 'ab05',
            exerciseName: 'Abdominal Rollout na Roda ou Prancha Frontal',
            sets: 3,
            reps: '12 reps / 45s',
            rpe: 8.0,
            restSeconds: 45,
            notes: 'Estabilização de core.'
          }
        ]
      },
      {
        id: 'D',
        routineName: 'Treino D · Full Body Funcional & Core Integrador',
        sessionType: 'FORCA_FULLBODY_INTEGRADORA',
        modality: 'misto_forca_cardio',
        exercises: [
          {
            exerciseId: 'do16',
            exerciseName: 'Levantamento Terra com Halteres / Barra',
            sets: 3,
            reps: '8-10',
            loadKg: 75,
            rpe: 8.0,
            restSeconds: 90,
            notes: 'Cadeia posterior completa.'
          },
          {
            exerciseId: 'pe05',
            exerciseName: 'Supino Inclinado com Halteres',
            sets: 3,
            reps: '10-12',
            loadKg: 22,
            rpe: 8.0,
            restSeconds: 60,
            notes: 'Peitoral superior.'
          },
          {
            exerciseId: 'do11',
            exerciseName: 'Puxada Alta na Polia (Lat Pulldown)',
            sets: 3,
            reps: '10-12',
            loadKg: 50,
            rpe: 8.0,
            restSeconds: 60,
            notes: 'Dorsais abertas.'
          },
          {
            exerciseId: 'lg08',
            exerciseName: 'Passada com Halteres (Walking Lunges)',
            sets: 3,
            reps: '10 passos cada perna',
            loadKg: 14,
            rpe: 8.0,
            restSeconds: 60,
            notes: 'Glúteos e pernas unilaterais.'
          }
        ]
      }
    ];

    return {
      modality: 'misto_forca_cardio',
      split: 'MistoCardio',
      routines: routines
    };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Rotina Misto (Força + Cardio) deve conter exercícios.');
      return { isValid: false, errors };
    }
    return { isValid: errors.length === 0, errors };
  }

  return {
    generateRoutines,
    validateRoutine
  };
});
