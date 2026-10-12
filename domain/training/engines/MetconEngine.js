/**
 * domain/training/engines/MetconEngine.js
 * 
 * Motor de Prescrição para Condicionamento Metabólico Híbrido (Metcon).
 * Modelagem de formatos de alta densidade: AMRAP, EMOM, For Time, Tabata e Chippers,
 * com time cap, controle de descanso e placares de pontuação (rounds/reps).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.MetconEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function generateRoutines(context = {}, options = {}) {
    const routines = [
      {
        id: 'A',
        routineName: 'Treino A · EMOM de Força & Potência Anaeróbia (16 Minutos)',
        sessionType: 'METCON_EMOM',
        modality: 'metcon_hibrido',
        format: 'EMOM',
        timeCapMinutes: 16,
        scoringType: 'CONCLUSAO_ESTRITA',
        exercises: [
          {
            exerciseId: 'metcon_emom_deadlift',
            exerciseName: 'Minuto 1: Levantamento Terra Pesado com Trap Bar',
            sets: 4,
            reps: '5 reps',
            loadKg: 100,
            rpe: 8.5,
            restSeconds: 35,
            notes: 'Saída explosiva do solo. Sobra de ~35s para descanso no minuto.'
          },
          {
            exerciseId: 'metcon_emom_pushpress',
            exerciseName: 'Minuto 2: Push Press / OHP com Barra',
            sets: 4,
            reps: '8 reps',
            loadKg: 45,
            rpe: 8.0,
            restSeconds: 30,
            notes: 'Impulso de pernas coordenado com empurrada vertical.'
          },
          {
            exerciseId: 'metcon_emom_airbike',
            exerciseName: 'Minuto 3: AirBike / Echo Bike Sprint Máximo',
            sets: 4,
            reps: '12-15 calorias',
            rpe: 9.0,
            restSeconds: 25,
            notes: 'Potência anaeróbia máxima em tiros de 25-30s.'
          },
          {
            exerciseId: 'metcon_emom_rest',
            exerciseName: 'Minuto 4: Descanso Ativo / Hidratação',
            sets: 4,
            reps: '1 min OFF',
            rpe: 1.0,
            restSeconds: 60,
            notes: 'Redução da frequência cardíaca antes da próxima volta.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Treino B · AMRAP Glicolítico de 20 Minutos (Máx Rounds & Reps)',
        sessionType: 'METCON_AMRAP',
        modality: 'metcon_hibrido',
        format: 'AMRAP',
        timeCapMinutes: 20,
        scoringType: 'ROUNDS_E_REPS',
        exercises: [
          {
            exerciseId: 'metcon_amrap_pullup',
            exerciseName: '1. Barra Fixa Estrita ou Kipping (Pull-ups)',
            sets: 1,
            reps: '10 reps',
            rpe: 8.5,
            restSeconds: 0,
            notes: 'Tração vertical constante com queixo acima da barra.'
          },
          {
            exerciseId: 'metcon_amrap_kb_swing',
            exerciseName: '2. Kettlebell Swing Russo / Americano',
            sets: 1,
            reps: '15 reps',
            loadKg: 24,
            rpe: 8.0,
            restSeconds: 0,
            notes: 'Extensão potente de quadril e ativação glútea sem flexão de coluna.'
          },
          {
            exerciseId: 'metcon_amrap_burpees',
            exerciseName: '3. Burpees com Salto sobre a Caixa',
            sets: 1,
            reps: '12 reps',
            rpe: 8.5,
            restSeconds: 0,
            notes: 'Peito no chão e salto suave sobre a caixa.'
          },
          {
            exerciseId: 'metcon_amrap_row',
            exerciseName: '4. Remo Concept2 RowErg',
            sets: 1,
            reps: '250m sprint',
            rpe: 9.0,
            restSeconds: 0,
            notes: 'Tração ritmada. Ao terminar, anote o round e reinicie imediatamente.'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Treino C · Chipper For Time com Time Cap de 25 Minutos',
        sessionType: 'METCON_FOR_TIME',
        modality: 'metcon_hibrido',
        format: 'FOR_TIME',
        timeCapMinutes: 25,
        scoringType: 'TEMPO_DE_CONCLUSAO',
        exercises: [
          {
            exerciseId: 'metcon_chipper_thrusters',
            exerciseName: 'Thrusters com Halteres / Barra (Agachamento + Press)',
            sets: 3,
            reps: '15 reps',
            loadKg: 35,
            rpe: 8.5,
            restSeconds: 60,
            notes: 'Fluidez biomecânica contínua da descida ao topo.'
          },
          {
            exerciseId: 'metcon_chipper_farmers',
            exerciseName: 'Farmers Carry Pesado',
            sets: 3,
            reps: '50m',
            loadKg: '2x28kg',
            rpe: 8.5,
            restSeconds: 60,
            notes: 'Caminhada firme sob frequência cardíaca elevada.'
          },
          {
            exerciseId: 'metcon_chipper_boxjumps',
            exerciseName: 'Box Jumps na Caixa de 60cm',
            sets: 3,
            reps: '15 saltos',
            rpe: 8.0,
            restSeconds: 60,
            notes: 'Extensão tripla e absorção de impacto.'
          }
        ]
      }
    ];

    return {
      modality: 'metcon_hibrido',
      split: 'Metcon',
      routines: routines
    };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Rotina Metcon deve possuir ao menos 1 circuito ou bloco.');
      return { isValid: false, errors };
    }
    return { isValid: errors.length === 0, errors };
  }

  return {
    generateRoutines,
    validateRoutine
  };
});
