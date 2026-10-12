/**
 * domain/training/engines/RunningStrengthEngine.js
 * 
 * Motor de Prescrição para Corrida + Musculação (Treinamento Concorrente).
 * Coordenação entre estímulos concorrentes: volume separado de corrida e musculação,
 * ordem prioritária das sessões, gestão da fadiga neuromuscular e fortalecimento de tendões.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.RunningStrengthEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function generateRoutines(context = {}, options = {}) {
    const primaryFocus = options.primaryFocus || 'EQUILIBRADO'; // 'CORRIDA_PRIORITARIA' | 'HIPERTROFIA_PRIORITARIA' | 'EQUILIBRADO'

    const routines = [
      {
        id: 'A',
        routineName: 'Treino A · Tronco Superior (Força) + Tiros de Corrida (Esteira/Pista)',
        sessionType: 'CONCORRENTE_SUPERIOR_E_TIROS',
        modality: 'corrida_musculacao',
        exercises: [
          // Módulo Força Superior
          {
            exerciseId: 'pe01',
            exerciseName: '[FORÇA TRONCO] Supino Reto com Barra',
            module: 'FORCA',
            sets: 4,
            reps: '6-8',
            loadKg: 70,
            rpe: 8.0,
            restSeconds: 120,
            notes: 'Força básica sem fadigar membros inferiores.'
          },
          {
            exerciseId: 'do08',
            exerciseName: '[FORÇA TRONCO] Remada Curvada com Barra',
            module: 'FORCA',
            sets: 4,
            reps: '8-10',
            loadKg: 60,
            rpe: 8.0,
            restSeconds: 90,
            notes: 'Postura de escápulas e tronco para economia de corrida.'
          },
          // Módulo Tiros
          {
            exerciseId: 'run_sprints_concorrente',
            exerciseName: '[TIROS CORRIDA] 8x 200m Sprints na Esteira ou Pista',
            module: 'CORRIDA',
            sets: 8,
            reps: '200m sprint / 45s caminhada',
            distanceKm: 1.6,
            durationMinutes: 12,
            targetPaceMinKm: '3:50 - 4:10',
            rpe: 9.0,
            restSeconds: 45,
            notes: 'Desenvolvimento de cadência alta de passada e reatividade neuromuscular.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Treino B · Membros Inferiores (Força & Rigidez de Tendão)',
        sessionType: 'FORCA_INFERIOR_ANTI_LESAO',
        modality: 'corrida_musculacao',
        exercises: [
          {
            exerciseId: 'lg01',
            exerciseName: 'Agachamento Livre com Barra (Carga Controlada)',
            sets: 4,
            reps: '5-6',
            loadKg: 75,
            rpe: 8.0,
            restSeconds: 150,
            cadence: '3-0-1-0',
            notes: 'Intensidade neural sem esgotamento metabólico extremo.'
          },
          {
            exerciseId: 'lg10',
            exerciseName: 'Stiff com Barra (Fortalecimento Excêntrico)',
            sets: 4,
            reps: '6-8',
            loadKg: 65,
            rpe: 8.0,
            restSeconds: 120,
            cadence: '4-0-1-0',
            notes: 'Proteção contra estiramentos de isquiotibiais em velocidade.'
          },
          {
            exerciseId: 'lg07',
            exerciseName: 'Agachamento Búlgaro com Halteres',
            sets: 3,
            reps: '8 cada perna',
            loadKg: 16,
            rpe: 8.0,
            restSeconds: 90,
            notes: 'Alinhamento patelar e estabilidade do glúteo médio.'
          },
          {
            exerciseId: 'lg20',
            exerciseName: 'Elevação de Panturrilha em Pé com Pausa Isométrica',
            sets: 4,
            reps: '12 reps',
            loadKg: 50,
            rpe: 8.5,
            restSeconds: 60,
            cadence: '3-2-1-0',
            notes: '2s de pausa no estiramento para fortalecer o tendão de Aquiles e a fáscia plantar.'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Treino C · Corrida em Ritmo de Limiar (Tempo Run 35 min)',
        sessionType: 'CORRIDA_LIMIAR_DEDICADA',
        modality: 'corrida_musculacao',
        targetDistanceKm: 7.0,
        targetDurationMinutes: 38,
        exercises: [
          {
            exerciseId: 'run_tempo_concorrente',
            exerciseName: 'Corrida Contínua no Limiar Anaeróbio',
            sets: 1,
            reps: '35 min em ritmo firme',
            distanceKm: 7.0,
            durationMinutes: 35,
            paceMinKm: '5:00',
            heartRateZone: 'Zona 4',
            rpe: 8.0,
            restSeconds: 0,
            notes: 'Sessão isolada de corrida para evitar estresse mecânico de musculação no mesmo dia.'
          },
          {
            exerciseId: 'ab05',
            exerciseName: 'Abdominal Rollout na Roda',
            sets: 3,
            reps: '10-12',
            rpe: 7.5,
            restSeconds: 60,
            notes: 'Anti-extensão de tronco para evitar colapso postural no final das corridas.'
          }
        ]
      },
      {
        id: 'D',
        routineName: 'Treino D · Longão de Rodagem Contínua (Zona 2) & Core Estável',
        sessionType: 'RODAGEM_LONGA_REGENERATIVA',
        modality: 'corrida_musculacao',
        targetDistanceKm: 10.0,
        targetDurationMinutes: 60,
        exercises: [
          {
            exerciseId: 'run_long_concorrente',
            exerciseName: 'Rodagem Contínua em Zona 2 (Conversacional)',
            sets: 1,
            reps: '10 km contínuos',
            distanceKm: 10.0,
            durationMinutes: 60,
            paceMinKm: '6:00',
            heartRateZone: 'Zona 2',
            rpe: 6.5,
            restSeconds: 0,
            notes: 'Oxidação de gorduras e aumento da densidade capilar periférica sem dano muscular.'
          }
        ]
      }
    ];

    return {
      modality: 'corrida_musculacao',
      split: 'RunningStrength',
      concurrentPriority: primaryFocus,
      routines: routines
    };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Rotina de corrida + musculação deve conter exercícios estruturados.');
      return { isValid: false, errors };
    }
    return { isValid: errors.length === 0, errors };
  }

  return {
    generateRoutines,
    validateRoutine
  };
});
