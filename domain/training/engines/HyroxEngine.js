/**
 * domain/training/engines/HyroxEngine.js
 * 
 * Motor de Prescrição para HYROX / Fitness Racing.
 * Modelagem de corrida de 1 km intercalada, 8 estações oficiais com cargas de prova,
 * transições sob acúmulo de lactato, splits de tempo e compatibilidade com equipamentos.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.HyroxEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const OFFICIAL_STATIONS = Object.freeze({
    STATION_1: { name: '1000m SkiErg', distanceM: 1000, standardCategory: 'Open / Pro' },
    STATION_2: { name: '50m Sled Push', distanceM: 50, loadKgOpenM: 152, loadKgOpenF: 102, loadKgProM: 202, loadKgProF: 152 },
    STATION_3: { name: '50m Sled Pull', distanceM: 50, loadKgOpenM: 103, loadKgOpenF: 78, loadKgProM: 153, loadKgProF: 103 },
    STATION_4: { name: '80m Burpee Broad Jumps', distanceM: 80, standardCategory: 'Open / Pro' },
    STATION_5: { name: '1000m RowErg', distanceM: 1000, standardCategory: 'Open / Pro' },
    STATION_6: { name: '200m Farmers Carry', distanceM: 200, loadKgOpenM: '2x24kg', loadKgOpenF: '2x16kg', loadKgProM: '2x32kg', loadKgProF: '2x24kg' },
    STATION_7: { name: '100m Sandbag Walking Lunges', distanceM: 100, loadKgOpenM: 20, loadKgOpenF: 10, loadKgProM: 30, loadKgProF: 20 },
    STATION_8: { name: '100x Wall Balls', reps: 100, targetHeightM: 3.0, loadKgOpenM: 6, loadKgOpenF: 4, loadKgProM: 9, loadKgProF: 6 }
  });

  function generateRoutines(context = {}, options = {}) {
    const category = options.category || 'Open'; // 'Open' | 'Pro' | 'Doubles'

    const routines = [
      {
        id: 'A',
        routineName: 'Treino A · Ergômetros & Potência Aeróbica HYROX (SkiErg + Remo + Bike)',
        sessionType: 'ERGOMETROS_E_CORRIDA',
        modality: 'hyrox_racing',
        exercises: [
          {
            exerciseId: 'hyrox_skierg',
            exerciseName: 'SkiErg Concept2 (Intervalos de Ritmo de Prova)',
            stationNumber: 1,
            sets: 5,
            reps: '500m',
            targetMeters: 500,
            targetPace: '1:55 - 2:05 / 500m',
            rpe: 8.5,
            restSeconds: 90,
            notes: 'Puxada explosiva com flexão de quadril e core ativo. Simulação do primeiro km de prova.'
          },
          {
            exerciseId: 'hyrox_rowerg',
            exerciseName: 'RowErg Concept2 (Capacidade sob Fadiga)',
            stationNumber: 5,
            sets: 4,
            reps: '750m',
            targetMeters: 750,
            targetPace: '1:50 - 2:00 / 500m',
            rpe: 8.5,
            restSeconds: 90,
            notes: 'Cadência entre 24 e 28 s/m com tração potente de pernas e respiração compassada.'
          },
          {
            exerciseId: 'hyrox_run_intercalada',
            exerciseName: 'Tiros de Corrida Intercalada (Transição pós-ergômetro)',
            sets: 4,
            reps: '800m',
            distanceKm: 3.2,
            targetPace: '4:45 min/km',
            rpe: 8.5,
            restSeconds: 60,
            notes: 'Transição imediata do remo para a corrida simulando o Roxzone.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Treino B · Estações Pesadas HYROX (Sled Push, Sled Pull & Lunges)',
        sessionType: 'ESTACOES_DE_FORCA_RACING',
        modality: 'hyrox_racing',
        exercises: [
          {
            exerciseId: 'hyrox_sled_push',
            exerciseName: 'Sled Push (Empurrão de Trenó com Carga Oficial)',
            stationNumber: 2,
            sets: 4,
            reps: '25m',
            loadKg: category === 'Pro' ? 202 : 152,
            rpe: 9.0,
            restSeconds: 120,
            notes: 'Braços travados ou cotovelos flexionados · passos curtos e potentes sem deslize do tênis.'
          },
          {
            exerciseId: 'hyrox_sled_pull',
            exerciseName: 'Sled Pull (Puxada de Trenó na Corda)',
            stationNumber: 3,
            sets: 4,
            reps: '25m',
            loadKg: category === 'Pro' ? 153 : 103,
            rpe: 8.5,
            restSeconds: 120,
            notes: 'Base aberta, centro de gravidade baixo e tração firme de dorsais e pernas.'
          },
          {
            exerciseId: 'hyrox_sandbag_lunges',
            exerciseName: 'Sandbag Walking Lunges (Passada com Saco)',
            stationNumber: 7,
            sets: 4,
            reps: '25m passadas',
            loadKg: category === 'Pro' ? 30 : 20,
            rpe: 8.5,
            restSeconds: 90,
            notes: 'Joelho de trás toca suavemente o solo. Tronco ereto suportando a carga.'
          },
          {
            exerciseId: 'hyrox_farmers_carry',
            exerciseName: 'Farmers Carry Pesado com Kettlebells / Halteres',
            stationNumber: 6,
            sets: 4,
            reps: '50m',
            loadKg: category === 'Pro' ? '2x32kg' : '2x24kg',
            rpe: 8.5,
            restSeconds: 90,
            notes: 'Postura impecável com escápulas travadas e pegada inabalável.'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Treino C · Simulação Concorrente & Wall Balls (Simulado de Prova)',
        sessionType: 'SIMULADO_PROVA_CONCORRENTE',
        modality: 'hyrox_racing',
        exercises: [
          {
            exerciseId: 'hyrox_sim_run_1k',
            exerciseName: 'Corrida Contínua 1.000m (Pace de Prova)',
            sets: 1,
            reps: '1.000m',
            distanceKm: 1.0,
            targetPace: '4:40 min/km',
            rpe: 8.0,
            restSeconds: 60,
            notes: '1 km de corrida com pernas aquecidas.'
          },
          {
            exerciseId: 'hyrox_burpee_broad',
            exerciseName: 'Burpee Broad Jumps (Salto em Extensão)',
            stationNumber: 4,
            sets: 4,
            reps: '20m salto',
            rpe: 9.0,
            restSeconds: 90,
            notes: 'Peito no chão a cada repetição e salto fluído à frente com os dois pés juntos.'
          },
          {
            exerciseId: 'hyrox_wall_balls',
            exerciseName: 'Wall Balls com Medicine Ball no Alvo de 3m',
            stationNumber: 8,
            sets: 4,
            reps: '25 reps',
            loadKg: category === 'Pro' ? 9 : 6,
            rpe: 9.0,
            restSeconds: 60,
            notes: 'Agachamento abaixo de 90° e arremesso preciso no centro do alvo a 3 metros de altura.'
          }
        ]
      }
    ];

    return {
      modality: 'hyrox_racing',
      split: 'HYROX',
      officialCategory: category,
      routines: routines
    };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Rotina HYROX deve possuir ao menos 1 estação ou bloco de corrida.');
      return { isValid: false, errors };
    }
    return { isValid: errors.length === 0, errors };
  }

  return {
    OFFICIAL_STATIONS,
    generateRoutines,
    validateRoutine
  };
});
