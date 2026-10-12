/**
 * domain/training/engines/CyclingEngine.js
 * 
 * Motor de Prescrição para Ciclismo / Spinning.
 * Modelagem de duração (min), potência alvo (Watts / %FTP), cadência (RPM),
 * resistência mecânica, zonas cardíacas, intervalos Sweet Spot / VO2 e rodagem longa.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.CyclingEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function generateRoutines(context = {}, options = {}) {
    const userFtp = Number(options.ftpWatts || context.ftpWatts) || 200;

    const routines = [
      {
        id: 'A',
        routineName: 'Treino A · Limiar & Sweet Spot (Bike / Rolo Smart)',
        sessionType: 'SWEET_SPOT_LIMIAR',
        modality: 'ciclismo_spinning',
        targetDurationMinutes: 60,
        heartRateZone: 'Zona 3 / Zona 4 (88-93% do FTP)',
        targetFtpPct: '88-93%',
        exercises: [
          {
            exerciseId: 'bike_warmup',
            exerciseName: 'Aquecimento Progressivo de Giro',
            sets: 1,
            reps: '15 min giro',
            durationMinutes: 15,
            cadenceRpm: 90,
            powerWatts: Math.round(userFtp * 0.60),
            ftpPercentage: '60%',
            rpe: 5.0,
            restSeconds: 0,
            notes: 'Cadência fluida e solta para oxigenar pernas.'
          },
          {
            exerciseId: 'bike_sweetspot',
            exerciseName: 'Blocos de Sweet Spot (88-93% FTP)',
            sets: 3,
            reps: '10 min bloco',
            durationMinutes: 30,
            cadenceRpm: 88,
            powerWatts: Math.round(userFtp * 0.90),
            ftpPercentage: '90%',
            rpe: 8.0,
            restSeconds: 180,
            restType: 'Giro suave em 50% FTP',
            notes: 'Potência estável sem oscilações bruscas · foco na respiração rítmica.'
          },
          {
            exerciseId: 'bike_cooldown',
            exerciseName: 'Giro Descompressivo de Recuperação',
            sets: 1,
            reps: '10 min leve',
            durationMinutes: 10,
            cadenceRpm: 95,
            powerWatts: Math.round(userFtp * 0.50),
            ftpPercentage: '50%',
            rpe: 4.0,
            restSeconds: 0,
            notes: 'Desaceleração gradual e eliminação de subprodutos metabólicos.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Treino B · Tiros de Alta Potência & VO2max (Subidas / Sprints)',
        sessionType: 'VO2MAX_POTENCIA',
        modality: 'ciclismo_spinning',
        targetDurationMinutes: 50,
        heartRateZone: 'Zona 5 (105-120% do FTP)',
        targetFtpPct: '110-120%',
        exercises: [
          {
            exerciseId: 'bike_intervals_vo2',
            exerciseName: 'Tiros de Potência VO2max na Bike',
            sets: 5,
            reps: '3 min forte',
            durationMinutes: 15,
            cadenceRpm: 95,
            powerWatts: Math.round(userFtp * 1.15),
            ftpPercentage: '115%',
            rpe: 9.0,
            restSeconds: 180,
            notes: 'Intensidade máxima de sustentação aeróbica para expansão do teto cardíaco.'
          },
          {
            exerciseId: 'ab06',
            exerciseName: 'Prancha Isométrica de Sustentação de Tronco',
            sets: 3,
            reps: '45s',
            rpe: 7.5,
            restSeconds: 45,
            notes: 'Core forte para não dissipar energia do quadril no pedal.'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Treino C · Longão de Endurance no Asfalto / Rolo (Base Z2)',
        sessionType: 'RODAGEM_ENDURANCE_LONGA',
        modality: 'ciclismo_spinning',
        targetDurationMinutes: 90,
        heartRateZone: 'Zona 2 (60-70% do FTP)',
        targetFtpPct: '65%',
        exercises: [
          {
            exerciseId: 'bike_long',
            exerciseName: 'Rodagem Contínua de Base Aeróbica (Longão)',
            sets: 1,
            reps: '90 min contínuo',
            durationMinutes: 90,
            cadenceRpm: 85,
            powerWatts: Math.round(userFtp * 0.65),
            ftpPercentage: '65%',
            rpe: 6.5,
            restSeconds: 0,
            notes: 'Ritmo conversacional no pedal. Reposição de carboidrato (30-60g/hora) e água a cada 20 min.'
          }
        ]
      }
    ];

    return {
      modality: 'ciclismo_spinning',
      split: 'Ciclismo_Endurance',
      routines: routines
    };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Rotina de ciclismo deve possuir ao menos 1 bloco de pedal.');
      return { isValid: false, errors };
    }
    return { isValid: errors.length === 0, errors };
  }

  return {
    generateRoutines,
    validateRoutine
  };
});
