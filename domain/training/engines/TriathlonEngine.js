/**
 * domain/training/engines/TriathlonEngine.js
 * 
 * Motor de Prescrição para Triathlon.
 * Três motores autônomos e independentes (Natação, Ciclismo, Corrida)
 * coordenados por microciclo semanal, com treinos combinados de transição (Brick Bike+Run)
 * e fases de periodização (Base, Construção, Pico, Taper).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.TriathlonEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function generateRoutines(context = {}, options = {}) {
    const phase = options.trainingPhase || 'BASE_CONSTRUCAO'; // 'BASE' | 'BUILD' | 'PEAK' | 'TAPER'
    const raceDistance = options.raceDistance || '70.3_MEIO_IRONMAN'; // 'SPRINT' | 'OLIMPICO' | '70.3_MEIO_IRONMAN' | 'IRONMAN'

    const routines = [
      {
        id: 'A',
        routineName: 'Treino A · Natação: Volume Aeróbio & Pacing (Piscina / Águas Abertas)',
        sessionType: 'DISCIPLINA_NATACAO',
        modality: 'triathlon',
        discipline: 'NATACAO',
        totalMeters: 2200,
        estimatedDurationMinutes: 50,
        exercises: [
          {
            exerciseId: 'tri_swim_warmup',
            exerciseName: '[NATAÇÃO] Aquecimento Progressivo Crawl',
            sets: 1,
            reps: '400m leve',
            totalMeters: 400,
            stroke: 'Crawl',
            rpe: 5.5,
            restSeconds: 60,
            notes: 'Foco na extensão da braçada e rolamento do tronco.'
          },
          {
            exerciseId: 'tri_swim_main',
            exerciseName: '[NATAÇÃO] Série Principal: 5 x 300m Crawl em Ritmo de Prova',
            sets: 5,
            reps: '300m crawl',
            totalMeters: 1500,
            stroke: 'Crawl com respiração bilateral',
            pace100m: '1:45',
            rpe: 7.5,
            restSeconds: 40,
            notes: 'Simulação do ritmo de nado sustentável para prova de Triathlon.'
          },
          {
            exerciseId: 'tri_swim_cool',
            exerciseName: '[NATAÇÃO] Soltura com Pullbuoy & Volta à Calma',
            sets: 1,
            reps: '300m leve',
            totalMeters: 300,
            stroke: 'Crawl suave',
            rpe: 4.0,
            restSeconds: 0,
            notes: 'Descompressão e relaxamento de ombros.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Treino B · Ciclismo: Intervalos de Potência e Sustentação Aero (Bike)',
        sessionType: 'DISCIPLINA_CICLISMO',
        modality: 'triathlon',
        discipline: 'CICLISMO',
        targetDurationMinutes: 75,
        exercises: [
          {
            exerciseId: 'tri_bike_intervals',
            exerciseName: '[CICLISMO] Blocos de Sustentação na Posição Aero (85-90% FTP)',
            sets: 4,
            reps: '12 min aero',
            durationMinutes: 48,
            cadenceRpm: 88,
            ftpPercentage: '88%',
            rpe: 8.0,
            restSeconds: 180,
            notes: 'Adaptação muscular prolongada no clip de contra-relógio/triathlon.'
          },
          {
            exerciseId: 'tri_bike_spin',
            exerciseName: '[CICLISMO] Giro de Cadência Solta',
            sets: 1,
            reps: '15 min leve',
            durationMinutes: 15,
            cadenceRpm: 95,
            ftpPercentage: '55%',
            rpe: 4.5,
            restSeconds: 0,
            notes: 'Recuperação ativa.'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Treino C · Sessão Combinada "Brick" (Ciclismo + Transição Imediata para Corrida)',
        sessionType: 'SESSAO_COMBINADA_BRICK',
        modality: 'triathlon',
        discipline: 'BRICK_BIKE_RUN',
        targetDurationMinutes: 65,
        exercises: [
          {
            exerciseId: 'tri_brick_bike',
            exerciseName: '[BRICK ETAPA 1] Pedal Rápido em Ritmo de Prova',
            sets: 1,
            reps: '45 min pedal',
            durationMinutes: 45,
            cadenceRpm: 90,
            rpe: 8.0,
            restSeconds: 60,
            notes: 'Simulação dos últimos quilômetros da bike com cadência alta para soltar pernas.'
          },
          {
            exerciseId: 'tri_brick_run',
            exerciseName: '[BRICK ETAPA 2] Corrida Imediata pós-bike (Transição T2)',
            sets: 1,
            reps: '4 km corrida',
            distanceKm: 4.0,
            durationMinutes: 20,
            paceMinKm: '5:00',
            rpe: 8.5,
            restSeconds: 0,
            notes: 'Adaptação neural à sensação de pernas pesadas e passada encurtada inicial.'
          }
        ]
      },
      {
        id: 'D',
        routineName: 'Treino D · Corrida de Longa Distância (Longão Z2) & Força Funcional',
        sessionType: 'DISCIPLINA_CORRIDA_E_FORCA',
        modality: 'triathlon',
        discipline: 'CORRIDA_LONGA',
        targetDistanceKm: 14.0,
        targetDurationMinutes: 80,
        exercises: [
          {
            exerciseId: 'tri_run_long',
            exerciseName: '[CORRIDA] Longão em Zona 2 Estrita (Conversacional)',
            sets: 1,
            reps: '14 km contínuos',
            distanceKm: 14.0,
            durationMinutes: 77,
            paceMinKm: '5:30',
            heartRateZone: 'Zona 2',
            rpe: 6.5,
            restSeconds: 0,
            notes: 'Construção da base de resistência e teste de suplementação intra-treino.'
          }
        ]
      }
    ];

    return {
      modality: 'triathlon',
      split: 'Triathlon',
      trainingPhase: phase,
      raceDistance: raceDistance,
      routines: routines
    };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Rotina de triathlon deve conter blocos estruturados.');
      return { isValid: false, errors };
    }
    return { isValid: errors.length === 0, errors };
  }

  return {
    generateRoutines,
    validateRoutine
  };
});
