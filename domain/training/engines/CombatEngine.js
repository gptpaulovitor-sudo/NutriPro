/**
 * domain/training/engines/CombatEngine.js
 * 
 * Motor de Prescrição para Lutas / Artes Marciais.
 * Modelagem de conteúdo técnico, preparação física específica, rounds (quantidade, duração, pausas),
 * intensidade de contato, equipamentos de proteção e recuperação neuromuscular de pegada e cervical.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.CombatEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function generateRoutines(context = {}, options = {}) {
    const martialArt = options.martialArtStyle || 'Misto (Boxe / Jiu-Jitsu)';

    const routines = [
      {
        id: 'A',
        routineName: 'Treino A · Força Explosiva, Potência de Golpe & Quedas',
        sessionType: 'POTENCIA_NEUROMUSCULAR_COMBATE',
        modality: 'lutas_artes_marciais',
        martialArt: martialArt,
        exercises: [
          {
            exerciseId: 'do16',
            exerciseName: 'Levantamento Terra com Trap Bar / Convencional',
            sets: 4,
            reps: '4-5 reps',
            loadKg: 90,
            rpe: 8.5,
            restSeconds: 120,
            cadence: 'Explosivo',
            notes: 'Potência de cadeia posterior indispensável para quedas, clinch e estabilidade.'
          },
          {
            exerciseId: 'pe01',
            exerciseName: 'Supino Reto com Saída Rápida',
            sets: 4,
            reps: '5-6 reps',
            loadKg: 65,
            rpe: 8.0,
            restSeconds: 90,
            cadence: 'Explosivo',
            notes: 'Velocidade de empurrada para esgrima e controle de distância.'
          },
          {
            exerciseId: 'do01_towel',
            exerciseName: 'Barra Fixa com Pano / Toalha (Grip Pull-up)',
            sets: 3,
            reps: '6-8 reps',
            rpe: 8.5,
            restSeconds: 90,
            notes: 'Fortalecimento severo de pegada (grip) para kimonos e pegadas firmes.'
          },
          {
            exerciseId: 'ab02',
            exerciseName: 'Rotação de Tronco no Cabo / Medicine Ball Slam',
            sets: 4,
            reps: '10 cada lado',
            rpe: 8.0,
            restSeconds: 60,
            notes: 'Transferência de força rotacional para socos, chutes e projeções.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Treino B · Simulação de Rounds & Resistência Lática de Combate',
        sessionType: 'ROUNDS_INTERMITENTES',
        modality: 'lutas_artes_marciais',
        roundsCount: 5,
        roundDurationMinutes: 3,
        restBetweenRoundsSec: 60,
        contactIntensity: 'Técnico / Sparring Controlado',
        protectiveEquipment: ['Luvas 14-16oz', 'Protetor Bucal', 'Caneleiras', 'Bandagens'],
        exercises: [
          {
            exerciseId: 'combat_rounds_sparring',
            exerciseName: 'Rounds de Sparring Técnico ou Sombra com Carga',
            sets: 5,
            reps: '3 min round',
            durationMinutes: 15,
            roundsCount: 5,
            roundDurationMin: 3,
            restSeconds: 60,
            rpe: 8.5,
            contactLevel: 'Moderado (70% potência)',
            notes: 'Controle de distância, esquivas e combinações sob fadiga progressiva.'
          },
          {
            exerciseId: 'combat_bag_intervals',
            exerciseName: 'Tiros no Saco Pesado / Sprawls na Fadiga',
            sets: 4,
            reps: '30s tiros / 30s ativo',
            rpe: 9.0,
            restSeconds: 45,
            notes: 'Simulação dos momentos de explosão e contra-ataque nos segundos finais de round.'
          },
          {
            exerciseId: 'combat_neck_iso',
            exerciseName: 'Isometria Cervical & Trapézio Superior (Anti-Lesão)',
            sets: 3,
            reps: '30s cada direção',
            rpe: 7.5,
            restSeconds: 45,
            notes: 'Proteção contra finalizações, guilhotinas e impactos na cabeça.'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Treino C · Capacidade Aeróbia Específica & Mobilidade de Quadril',
        sessionType: 'AEROBICO_ESPECIFICO_RECUPERACAO',
        modality: 'lutas_artes_marciais',
        exercises: [
          {
            exerciseId: 'lg01_airbike',
            exerciseName: 'AirBike ou Remo em Ritmo Contínuo Z2',
            sets: 1,
            reps: '35 min contínuo',
            durationMinutes: 35,
            rpe: 6.5,
            restSeconds: 0,
            notes: 'Base aeróbica que garante recuperação acelerada entre rounds.'
          },
          {
            exerciseId: 'combat_hip_mobility',
            exerciseName: 'Mobilidade Articular de Quadril & Torácica (90/90 e Cossaco)',
            sets: 3,
            reps: '15 min suave',
            rpe: 5.0,
            restSeconds: 30,
            notes: 'Amplitude para chutes altos, passagens de guarda e flexibilidade do adutor.'
          }
        ]
      }
    ];

    return {
      modality: 'lutas_artes_marciais',
      split: 'Lutas',
      routines: routines
    };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Rotina de combate deve possuir ao menos 1 bloco estruturado.');
      return { isValid: false, errors };
    }
    return { isValid: errors.length === 0, errors };
  }

  return {
    generateRoutines,
    validateRoutine
  };
});
