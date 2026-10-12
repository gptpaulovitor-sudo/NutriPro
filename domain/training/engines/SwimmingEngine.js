/**
 * domain/training/engines/SwimmingEngine.js
 * 
 * Motor de Prescrição para Natação.
 * Modelagem de aquecimento, educativos de técnica, estilos de nado (crawl, costas, peito, borboleta),
 * metragem total (m), séries fracionadas, ritmo por 100m, intervalos e volta à calma.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.SwimmingEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function generateRoutines(context = {}, options = {}) {
    const routines = [
      {
        id: 'A',
        routineName: 'Treino A · Capacidade Aeróbia Contínua & Fundo (Crawl)',
        sessionType: 'AEROBIA_AQUATICA_FUNDO',
        modality: 'natacao',
        totalMeters: 2000,
        estimatedDurationMinutes: 50,
        exercises: [
          {
            exerciseId: 'swim_warmup',
            exerciseName: 'Aquecimento Fracionado Crawl / Costas',
            sets: 1,
            reps: '400m leve',
            totalMeters: 400,
            stroke: 'Crawl / Costas alternado',
            pace100m: '2:00',
            rpe: 5.0,
            restSeconds: 60,
            notes: 'Soltura articular dos ombros e foco na posição hidrodinâmica da cabeça.'
          },
          {
            exerciseId: 'swim_drills',
            exerciseName: 'Educativos de Braçada & Pegada Alta (Catch Drill)',
            sets: 4,
            reps: '50m educativo',
            totalMeters: 200,
            stroke: 'Crawl com um braço / Prancha',
            rpe: 6.5,
            restSeconds: 30,
            notes: 'Cotovelo alto na tração inicial e rotação axial do tronco (rolamento).'
          },
          {
            exerciseId: 'swim_main_aerobic',
            exerciseName: 'Série Principal: 6 x 200m Crawl em Ritmo de Fundo',
            sets: 6,
            reps: '200m crawl',
            totalMeters: 1200,
            stroke: 'Crawl (Livre)',
            pace100m: '1:45',
            rpe: 7.5,
            restSeconds: 40,
            notes: 'Respiração bilateral a cada 3 braçadas para equilíbrio de tração.'
          },
          {
            exerciseId: 'swim_cooldown',
            exerciseName: 'Soltura e Volta à Calma',
            sets: 1,
            reps: '200m nado suave',
            totalMeters: 200,
            stroke: 'Crawl lento ou Peito',
            rpe: 4.0,
            restSeconds: 0,
            notes: 'Descompressão muscular e restauração respiratória.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Treino B · Tiros de Velocidade & Potência Anaeróbia',
        sessionType: 'TIROS_VELOCIDADE_AQUATICA',
        modality: 'natacao',
        totalMeters: 1600,
        estimatedDurationMinutes: 45,
        exercises: [
          {
            exerciseId: 'swim_warmup_b',
            exerciseName: 'Aquecimento Dinâmico',
            sets: 1,
            reps: '300m livre',
            totalMeters: 300,
            stroke: 'Livre',
            rpe: 5.5,
            restSeconds: 60,
            notes: 'Ativação muscular progressiva.'
          },
          {
            exerciseId: 'swim_kick',
            exerciseName: 'Pernada Forte com Prancha',
            sets: 6,
            reps: '50m pernada',
            totalMeters: 300,
            stroke: 'Pernada Crawl',
            rpe: 8.5,
            restSeconds: 45,
            notes: 'Propulsão partindo do quadril sem dobrar joelhos em excesso.'
          },
          {
            exerciseId: 'swim_sprints',
            exerciseName: 'Tiros Curtos de 50m em Velocidade Máxima',
            sets: 8,
            reps: '50m tiro',
            totalMeters: 400,
            stroke: 'Crawl Sprint',
            pace100m: '1:20',
            rpe: 9.0,
            restSeconds: 60,
            notes: 'Saída explosiva, pernada potente e frequência máxima de braçada.'
          },
          {
            exerciseId: 'swim_pullbuoy',
            exerciseName: 'Regeneração com Pullbuoy (Braço Puro)',
            sets: 1,
            reps: '400m contínuo',
            totalMeters: 400,
            stroke: 'Crawl com Flutuador',
            rpe: 6.0,
            restSeconds: 30,
            notes: 'Isolamento de tronco superior mantendo quadril alto.'
          },
          {
            exerciseId: 'swim_cooldown_b',
            exerciseName: 'Volta à Calma',
            sets: 1,
            reps: '200m solto',
            totalMeters: 200,
            stroke: 'Costas suave',
            rpe: 4.0,
            restSeconds: 0,
            notes: 'Alinhamento postural.'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Treino C · Força em Terra & Estabilidade de Manguito para Nadadores',
        sessionType: 'COMPLEMENTAR_TERRA',
        modality: 'natacao',
        estimatedDurationMinutes: 40,
        exercises: [
          {
            exerciseId: 'do01',
            exerciseName: 'Barra Fixa com Pegada Neutra ou Aberta',
            sets: 4,
            reps: '6-8',
            rpe: 8.0,
            restSeconds: 90,
            notes: 'Potência primária para a fase de puxada subaquática.'
          },
          {
            exerciseId: 'sh18',
            exerciseName: 'Face Pull com Rotação Externa no Cabo',
            sets: 3,
            reps: '12-15',
            rpe: 7.5,
            restSeconds: 60,
            notes: 'Prevenção fundamental do ombro do nadador (impacto subacromial).'
          },
          {
            exerciseId: 'ab06',
            exerciseName: 'Prancha Frontal com Linha de Flutuação Alinhada',
            sets: 3,
            reps: '45s',
            rpe: 7.5,
            restSeconds: 45,
            notes: 'Manutenção do core rígido para evitar arrasto hidrodinâmico na água.'
          }
        ]
      }
    ];

    return {
      modality: 'natacao',
      split: 'Natacao',
      routines: routines
    };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Rotina de natação deve possuir ao menos 1 série aquática ou preventiva.');
      return { isValid: false, errors };
    }
    return { isValid: errors.length === 0, errors };
  }

  return {
    generateRoutines,
    validateRoutine
  };
});
