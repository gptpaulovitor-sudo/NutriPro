/**
 * domain/training/engines/AerobicEngine.js
 * 
 * Motor de Prescrição para Aeróbico Geral.
 * Modelagem de seleção da atividade disponível (esteira, esteira inclinada, bike, elíptico, remo, escada),
 * duração contínua ou intervalada, zonas de FC (Zona 2/3), RPE e recuperação.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.AerobicEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function generateRoutines(context = {}, options = {}) {
    const defaultActivity = options.preferredActivity || 'Esteira Inclinada / Caminhada Rápida';

    const routines = [
      {
        id: 'A',
        routineName: 'Treino A · Cardio Contínuo de Baixo Impacto (Zona 2 Oxidativa)',
        sessionType: 'CONTINUO_ESTADO_ESTAVEL',
        modality: 'aerobico_geral',
        targetDurationMinutes: 45,
        heartRateZone: 'Zona 2 (60-70% FCmáx)',
        exercises: [
          {
            exerciseId: 'aero_z2_cont',
            exerciseName: `${defaultActivity} em Zona 2`,
            sets: 1,
            reps: '45 min contínuos',
            durationMinutes: 45,
            activityType: defaultActivity,
            heartRateZone: 'Zona 2',
            rpe: 6.5,
            restSeconds: 0,
            notes: 'Mantenha a intensidade conversacional confortável. Oxidação lipídica pura e sensibilidade à insulina.'
          },
          {
            exerciseId: 'ab06',
            exerciseName: 'Prancha Frontal para Ativação Postural',
            sets: 3,
            reps: '40s',
            rpe: 7.0,
            restSeconds: 45,
            notes: 'Ativação do transverso abdominal.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Treino B · Circuito Aeróbio Funcional sem Impacto',
        sessionType: 'CIRCUITO_AEROBIO',
        modality: 'aerobico_geral',
        targetDurationMinutes: 40,
        exercises: [
          {
            exerciseId: 'aero_eliptico',
            exerciseName: 'Elíptico / Simulador de Caminhada',
            sets: 3,
            reps: '8 min',
            durationMinutes: 24,
            rpe: 7.0,
            restSeconds: 60,
            notes: 'Cadência constante sem pressão plantar exagerada.'
          },
          {
            exerciseId: 'aero_bike_recup',
            exerciseName: 'Bicicleta Ergométrica com Carga Moderada',
            sets: 2,
            reps: '8 min',
            durationMinutes: 16,
            rpe: 6.5,
            restSeconds: 60,
            notes: 'Giro suave a 80-85 RPM.'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Treino C · Intervalado Aeróbio Suave (Alternância Z2/Z3)',
        sessionType: 'INTERVALADO_MODERADO',
        modality: 'aerobico_geral',
        targetDurationMinutes: 35,
        exercises: [
          {
            exerciseId: 'aero_interval_soft',
            exerciseName: 'Intervalos de 3 min Moderado / 2 min Leve',
            sets: 6,
            reps: '5 min bloco',
            durationMinutes: 30,
            rpe: 7.5,
            restSeconds: 0,
            notes: 'Elevação controlada do gasto energético com retorno suave à frequência de base.'
          }
        ]
      }
    ];

    return {
      modality: 'aerobico_geral',
      split: 'Aerobico_Geral',
      routines: routines
    };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Rotina aeróbica deve possuir ao menos 1 bloco.');
      return { isValid: false, errors };
    }
    return { isValid: errors.length === 0, errors };
  }

  return {
    generateRoutines,
    validateRoutine
  };
});
