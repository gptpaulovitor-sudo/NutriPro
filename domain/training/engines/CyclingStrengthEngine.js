/**
 * domain/training/engines/CyclingStrengthEngine.js
 * 
 * Motor de Prescrição para Ciclismo + Força.
 * Coordenação entre potência no pedal e sobrecarga miofibrilar, com controle rigoroso
 * da carga em membros inferiores (para evitar pernas travadas na bike) e fortalecimento postural de tronco.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.CyclingStrengthEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function generateRoutines(context = {}, options = {}) {
    const routines = [
      {
        id: 'A',
        routineName: 'Treino A · Força de Membros Inferiores para Ciclismo (Potência de Pedal)',
        sessionType: 'FORCA_INFERIOR_CICLISMO',
        modality: 'ciclismo_forca',
        exercises: [
          {
            exerciseId: 'lg01',
            exerciseName: 'Agachamento Livre com Barra (Sobrecarga Neural)',
            sets: 4,
            reps: '5-6',
            loadKg: 80,
            rpe: 8.5,
            restSeconds: 150,
            notes: 'Desenvolvimento de força máxima para sprints e arrancadas em subidas.'
          },
          {
            exerciseId: 'lg04',
            exerciseName: 'Leg Press 45° com Foco em Quadríceps',
            sets: 3,
            reps: '8-10',
            loadKg: 160,
            rpe: 8.0,
            restSeconds: 90,
            notes: 'Pressão plantar contínua sem travar joelhos.'
          },
          {
            exerciseId: 'lg10',
            exerciseName: 'Stiff com Barra (Cadeia Posterior)',
            sets: 4,
            reps: '6-8',
            loadKg: 70,
            rpe: 8.0,
            restSeconds: 120,
            notes: 'Alongamento de isquiotibiais para equilibrar a puxada do pedal.'
          },
          {
            exerciseId: 'lg20',
            exerciseName: 'Panturrilha em Pé na Máquina',
            sets: 4,
            reps: '10-12',
            loadKg: 60,
            rpe: 8.5,
            restSeconds: 60,
            notes: 'Rigidez de tornozelo para transferir potência direta ao pedal.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Treino B · Ciclismo: Intervalos de Potência VO2max & Subidas',
        sessionType: 'CICLISMO_INTERVALADO_POTENCIA',
        modality: 'ciclismo_forca',
        targetDurationMinutes: 55,
        exercises: [
          {
            exerciseId: 'bike_sprints_vo2',
            exerciseName: 'Tiros de Potência VO2max na Bike (3 min forte / 3 min leve)',
            sets: 5,
            reps: '3 min tiros',
            durationMinutes: 30,
            cadenceRpm: 95,
            powerWatts: 240,
            rpe: 9.0,
            restSeconds: 180,
            notes: 'Alta cadência e pico de frequência cardíaca.'
          },
          {
            exerciseId: 'bike_cadence_recovery',
            exerciseName: 'Giro de Cadência Recuperativa',
            sets: 1,
            reps: '20 min leve',
            durationMinutes: 20,
            cadenceRpm: 90,
            powerWatts: 110,
            rpe: 5.5,
            restSeconds: 0,
            notes: 'Descompressão periférica das coxas.'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Treino C · Tronco, Postura de Guidão & Escápulas',
        sessionType: 'POSTURA_GUIDAO_E_CORE',
        modality: 'ciclismo_forca',
        exercises: [
          {
            exerciseId: 'do08',
            exerciseName: 'Remada Curvada com Barra',
            sets: 4,
            reps: '8-10',
            loadKg: 55,
            rpe: 8.0,
            restSeconds: 90,
            notes: 'Trapézio médio e romboides para prevenir dor cervical e dorsal no pedal longo.'
          },
          {
            exerciseId: 'sh18',
            exerciseName: 'Face Pull na Polia com Rotação Externa',
            sets: 3,
            reps: '12-15',
            loadKg: 25,
            rpe: 7.5,
            restSeconds: 60,
            notes: 'Neutralização da postura curvada das costas ao segurar o guidão.'
          },
          {
            exerciseId: 'ab06',
            exerciseName: 'Prancha Isométrica com Braços Estendidos',
            sets: 3,
            reps: '45s',
            rpe: 8.0,
            restSeconds: 45,
            notes: 'Resistência anti-extensão lombar.'
          }
        ]
      },
      {
        id: 'D',
        routineName: 'Treino D · Longão de Ciclismo (Endurance Z2)',
        sessionType: 'CICLISMO_LONGAO_Z2',
        modality: 'ciclismo_forca',
        targetDurationMinutes: 90,
        exercises: [
          {
            exerciseId: 'bike_long_aerobic',
            exerciseName: 'Rodagem Contínua em Zona 2 (Longão de Ciclismo)',
            sets: 1,
            reps: '90 min no asfalto / rolo',
            durationMinutes: 90,
            cadenceRpm: 88,
            powerWatts: 140,
            rpe: 6.5,
            restSeconds: 0,
            notes: 'Construção da base mitocondrial sem estresse de força.'
          }
        ]
      }
    ];

    return {
      modality: 'ciclismo_forca',
      split: 'Ciclismo_Forca',
      routines: routines
    };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Rotina de ciclismo + força deve conter exercícios.');
      return { isValid: false, errors };
    }
    return { isValid: errors.length === 0, errors };
  }

  return {
    generateRoutines,
    validateRoutine
  };
});
