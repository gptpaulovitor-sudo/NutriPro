/**
 * domain/training/engines/StrengthEngine.js
 * 
 * Motor de Prescrição para Musculação / Força (Hipertrofia e Força Máxima).
 * Modelagem de séries, repetições, carga (kg), RIR/RPE, intervalo, cadência e volume semanal.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.StrengthEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function generateRoutines(context = {}, options = {}) {
    const frequency = Number(options.frequency || context.frequency) || 4;
    const splitKey = options.split || (frequency <= 3 ? 'PPL' : (frequency === 4 ? 'UpperLower' : 'PHAT'));

    // Rotinas canônicas detalhadas
    const routines = [
      {
        id: 'A',
        routineName: 'Treino A · Peitoral, Deltóide Anterior & Tríceps (Push)',
        sessionType: 'FORCA_MIOFIBRILAR',
        modality: 'musculacao_forca',
        exercises: [
          {
            exerciseId: 'pe01',
            exerciseName: 'Supino Reto com Barra',
            group: 'Peitoral',
            mechanics: 'Composto',
            equipment: 'Barra e Banco',
            sets: 4,
            reps: '6-8',
            loadKg: options.targetLoadKg || 70,
            rpe: 8.5,
            rir: 1.5,
            restSeconds: 120,
            cadence: '3-0-1-0',
            resistProfile: 'uniform',
            notes: 'Pausa de 1s no peito com escápulas travadas.'
          },
          {
            exerciseId: 'pe05',
            exerciseName: 'Supino Inclinado com Halteres',
            group: 'Peitoral',
            mechanics: 'Composto',
            equipment: 'Halteres e Banco Inclinado',
            sets: 4,
            reps: '8-10',
            loadKg: 24,
            rpe: 8.0,
            rir: 2,
            restSeconds: 90,
            cadence: '3-0-1-0',
            resistProfile: 'stretched',
            notes: 'Foco no feixe clavicular superior com máxima amplitude.'
          },
          {
            exerciseId: 'sh01',
            exerciseName: 'Desenvolvimento Militar em Pé (OHP)',
            group: 'Ombros',
            mechanics: 'Composto',
            equipment: 'Barra',
            sets: 3,
            reps: '6-8',
            loadKg: 40,
            rpe: 8.0,
            rir: 2,
            restSeconds: 90,
            cadence: '3-0-1-0',
            resistProfile: 'shortened',
            notes: 'Glúteos e abdômen ativos sem hiperextensão lombar.'
          },
          {
            exerciseId: 'sh09',
            exerciseName: 'Elevação Lateral no Banco 45°',
            group: 'Ombros',
            mechanics: 'Isolador',
            equipment: 'Halteres',
            sets: 4,
            reps: '10-12',
            loadKg: 10,
            rpe: 8.5,
            rir: 1,
            restSeconds: 60,
            cadence: '3-1-1-0',
            resistProfile: 'stretched',
            notes: 'Tensão máxima no deltoide medial alongado.'
          },
          {
            exerciseId: 'tr01',
            exerciseName: 'Tríceps na Polia com Barra Reta (Pushdown)',
            group: 'Tríceps',
            mechanics: 'Isolador',
            equipment: 'Polia Alta',
            sets: 3,
            reps: '10-12',
            loadKg: 30,
            rpe: 8.5,
            rir: 1,
            restSeconds: 60,
            cadence: '3-1-1-0',
            resistProfile: 'shortened',
            notes: '1s de trava isométrica no ponto de extensão total.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Treino B · Dorsal, Deltóide Posterior & Bíceps (Pull)',
        sessionType: 'FORCA_MIOFIBRILAR',
        modality: 'musculacao_forca',
        exercises: [
          {
            exerciseId: 'do01',
            exerciseName: 'Barra Fixa Pronada (Pull-up)',
            group: 'Dorsal',
            mechanics: 'Composto',
            equipment: 'Barra Fixa',
            sets: 4,
            reps: '6-8',
            loadKg: 0,
            rpe: 8.5,
            rir: 1.5,
            restSeconds: 120,
            cadence: '3-0-1-0',
            resistProfile: 'stretched',
            notes: 'Alongamento completo no fundo sem balanço.'
          },
          {
            exerciseId: 'do08',
            exerciseName: 'Remada Curvada com Barra',
            group: 'Dorsal',
            mechanics: 'Composto',
            equipment: 'Barra',
            sets: 4,
            reps: '6-8',
            loadKg: 60,
            rpe: 8.0,
            rir: 2,
            restSeconds: 90,
            cadence: '3-0-1-0',
            resistProfile: 'uniform',
            notes: 'Retração escapular estrita no topo.'
          },
          {
            exerciseId: 'sh15',
            exerciseName: 'Face Pull na Polia com Corda',
            group: 'Ombros',
            mechanics: 'Isolador',
            equipment: 'Polia com Corda',
            sets: 3,
            reps: '12-15',
            loadKg: 25,
            rpe: 8.0,
            rir: 2,
            restSeconds: 60,
            cadence: '2-1-1-0',
            resistProfile: 'shortened',
            notes: 'Saúde do manguito rotador e deltoide posterior.'
          },
          {
            exerciseId: 'bi01',
            exerciseName: 'Rosca Direta com Barra',
            group: 'Bíceps',
            mechanics: 'Isolador',
            equipment: 'Barra W ou Reta',
            sets: 3,
            reps: '8-10',
            loadKg: 26,
            rpe: 8.5,
            rir: 1,
            restSeconds: 60,
            cadence: '3-0-1-0',
            resistProfile: 'uniform',
            notes: 'Cotovelos alinhados ao tronco sem balanço lombar.'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Treino C · Quadríceps, Isquiotibiais & Glúteos (Legs)',
        sessionType: 'FORCA_MIOFIBRILAR',
        modality: 'musculacao_forca',
        exercises: [
          {
            exerciseId: 'lg01',
            exerciseName: 'Agachamento Livre com Barra (Back Squat)',
            group: 'Membros Inferiores',
            mechanics: 'Composto',
            equipment: 'Barra e Rack',
            sets: 4,
            reps: '6-8',
            loadKg: 80,
            rpe: 8.5,
            rir: 1.5,
            restSeconds: 150,
            cadence: '4-0-1-0',
            resistProfile: 'uniform',
            notes: 'Descida controlada de 4s para integridade do tendão patelar.'
          },
          {
            exerciseId: 'lg10',
            exerciseName: 'Stiff com Barra (Terra Romeno)',
            group: 'Posterior de Coxa',
            mechanics: 'Composto',
            equipment: 'Barra',
            sets: 4,
            reps: '6-8',
            loadKg: 70,
            rpe: 8.0,
            rir: 2,
            restSeconds: 120,
            cadence: '4-0-1-0',
            resistProfile: 'stretched',
            notes: 'Anteversão pélvica pura com alongamento máximo dos isquiotibiais.'
          },
          {
            exerciseId: 'lg04',
            exerciseName: 'Leg Press 45°',
            group: 'Membros Inferiores',
            mechanics: 'Composto',
            equipment: 'Leg Press',
            sets: 3,
            reps: '10-12',
            loadKg: 180,
            rpe: 8.0,
            rir: 2,
            restSeconds: 90,
            cadence: '3-0-1-0',
            resistProfile: 'stretched',
            notes: 'Amplitude profunda sem retroversão da bacia.'
          },
          {
            exerciseId: 'lg20',
            exerciseName: 'Panturrilha em Pé na Máquina',
            group: 'Panturrilha',
            mechanics: 'Isolador',
            equipment: 'Máquina de Panturrilha',
            sets: 4,
            reps: '10-12',
            loadKg: 60,
            rpe: 8.5,
            rir: 1,
            restSeconds: 60,
            cadence: '3-2-1-0',
            resistProfile: 'stretched',
            notes: 'Pausa de 2s no fundo para anular reflexo elástico.'
          }
        ]
      }
    ];

    return {
      modality: 'musculacao_forca',
      split: splitKey,
      routines: routines
    };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Rotina de musculação deve possuir ao menos 1 exercício.');
      return { isValid: false, errors };
    }

    routine.exercises.forEach((ex, idx) => {
      if (!ex.exerciseName) errors.push(`Exercício #${idx + 1}: nome obrigatório.`);
      if (!ex.sets || ex.sets < 1) errors.push(`Exercício #${idx + 1}: séries inválidas.`);
      if (!ex.reps) errors.push(`Exercício #${idx + 1}: repetições obrigatórias.`);
    });

    return { isValid: errors.length === 0, errors };
  }

  return {
    generateRoutines,
    validateRoutine
  };
});
