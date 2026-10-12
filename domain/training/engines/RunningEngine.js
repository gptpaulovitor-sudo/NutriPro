/**
 * domain/training/engines/RunningEngine.js
 * 
 * Motor de Prescrição para Corrida / Endurance.
 * Modelagem de distância (km), duração (min), ritmo/pace (min/km), zonas de FC (Z1-Z5),
 * intervalos (tiros), aquecimento, rodagem e distribuição semanal de volume.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.RunningEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function generateRoutines(context = {}, options = {}) {
    const targetDistance = Number(options.weeklyKm || context.runningWeeklyKm) || 25;
    const basePace = options.basePace || '5:30';

    const routines = [
      {
        id: 'A',
        routineName: 'Treino A · Tiros de Velocidade & VO2max (Pista / Esteira)',
        sessionType: 'INTERVALADO_ALTA_INTENSIDADE',
        modality: 'corrida_endurance',
        targetDistanceKm: 6.0,
        targetDurationMinutes: 45,
        targetPaceMinKm: '4:15 - 4:30',
        heartRateZone: 'Zona 4 / Zona 5 (88-95% FCmáx)',
        exercises: [
          {
            exerciseId: 'run_warmup',
            exerciseName: 'Aquecimento Dinâmico & Trote Leve em Z1/Z2',
            sets: 1,
            reps: '15 min trote',
            distanceKm: 2.0,
            durationMinutes: 15,
            paceMinKm: '6:15',
            heartRateZone: 'Zona 1/2',
            rpe: 5.5,
            restSeconds: 120,
            notes: 'Elevação progressiva da temperatura corporal e mobilidade de tornozelo/quadril.'
          },
          {
            exerciseId: 'run_intervals',
            exerciseName: 'Tiros de 400m em Ritmo de VO2max (Pista / Esteira)',
            sets: 8,
            reps: '400m tiro',
            distanceKm: 3.2,
            durationMinutes: 20,
            intervalDistanceMeters: 400,
            targetPaceMinKm: '4:15',
            heartRateZone: 'Zona 5',
            rpe: 9.0,
            restSeconds: 90,
            restType: 'Trote leve ou caminhada',
            notes: 'Frequência de passada rápida, tronco levemente inclinado e amortecimento médio-pé.'
          },
          {
            exerciseId: 'run_cooldown',
            exerciseName: 'Desaquecimento & Volta à Calma',
            sets: 1,
            reps: '10 min leve',
            distanceKm: 1.0,
            durationMinutes: 10,
            paceMinKm: '6:30',
            heartRateZone: 'Zona 1',
            rpe: 4.0,
            restSeconds: 0,
            notes: 'Recuperação de lactato e normalização respiratória.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Treino B · Fortalecimento Específico do Corredor (Anti-Lesão)',
        sessionType: 'COMPLEMENTAR_FORCA',
        modality: 'corrida_endurance',
        targetDurationMinutes: 40,
        exercises: [
          {
            exerciseId: 'lg07',
            exerciseName: 'Agachamento Búlgaro com Halteres',
            sets: 3,
            reps: '8-10 cada perna',
            rpe: 8.0,
            restSeconds: 60,
            notes: 'Estabilidade pélvica e prevenção de valgo dinâmico.'
          },
          {
            exerciseId: 'lg10',
            exerciseName: 'Stiff Unilateral com Halter',
            sets: 3,
            reps: '8-10 cada perna',
            rpe: 8.0,
            restSeconds: 60,
            notes: 'Fortalecimento excêntrico de isquiotibiais para absorção de passada.'
          },
          {
            exerciseId: 'lg20',
            exerciseName: 'Panturrilha em Pé com Pausa no Fundo (Tendão de Aquiles)',
            sets: 4,
            reps: '15 reps',
            rpe: 8.5,
            restSeconds: 45,
            notes: '2s de pausa na posição esticada para aumentar a rigidez tendínea.'
          },
          {
            exerciseId: 'ab06',
            exerciseName: 'Prancha Frontal e Lateral para Estabilidade de Tronco',
            sets: 3,
            reps: '45s cada',
            rpe: 7.5,
            restSeconds: 45,
            notes: 'Minimiza a rotação parasitária do tronco na corrida.'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Treino C · Corrida em Ritmo de Prova (Tempo Run / Limiar)',
        sessionType: 'LIMIAR_ANAEROBIO',
        modality: 'corrida_endurance',
        targetDistanceKm: 7.0,
        targetDurationMinutes: 40,
        targetPaceMinKm: '5:00 - 5:10',
        heartRateZone: 'Zona 3 / Zona 4 (82-88% FCmáx)',
        exercises: [
          {
            exerciseId: 'run_tempo',
            exerciseName: 'Corrida Contínua em Ritmo de Limiar (Tempo Run)',
            sets: 1,
            reps: '7 km contínuos',
            distanceKm: 7.0,
            durationMinutes: 38,
            paceMinKm: '5:05',
            heartRateZone: 'Zona 4',
            rpe: 8.0,
            restSeconds: 0,
            notes: 'Ritmo confortavelmente difícil · sustentação da taxa de depuração de lactato.'
          }
        ]
      },
      {
        id: 'D',
        routineName: 'Treino D · Longão de Rodagem Contínua (Base Mitocondrial Z2)',
        sessionType: 'RODAGEM_AEROBICA_LONGA',
        modality: 'corrida_endurance',
        targetDistanceKm: 12.0,
        targetDurationMinutes: 75,
        targetPaceMinKm: '5:50 - 6:10',
        heartRateZone: 'Zona 2 (65-75% FCmáx)',
        exercises: [
          {
            exerciseId: 'run_long',
            exerciseName: 'Longão Contínuo em Zona 2 (Conversacional)',
            sets: 1,
            reps: '12 km contínuos',
            distanceKm: 12.0,
            durationMinutes: 72,
            paceMinKm: '6:00',
            heartRateZone: 'Zona 2',
            rpe: 6.5,
            restSeconds: 0,
            notes: 'Respiração nasal predominante, queima oxidativa e biogênese mitocondrial. Hidratação constante.'
          }
        ]
      }
    ];

    return {
      modality: 'corrida_endurance',
      split: 'Corrida_Endurance',
      totalWeeklyKm: 25.0,
      routines: routines
    };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Rotina de corrida deve possuir ao menos 1 bloco ou exercício.');
      return { isValid: false, errors };
    }

    return { isValid: errors.length === 0, errors };
  }

  return {
    generateRoutines,
    validateRoutine
  };
});
