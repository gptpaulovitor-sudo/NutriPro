/**
 * domain/training/engines/HiitStrengthEngine.js
 * 
 * Motor de Prescrição para HIIT + Musculação (Dois Motores Coordenados).
 * Preserva o motor de musculação com seus parâmetros estritos (séries, repetições, carga, RPE)
 * e acopla um motor autônomo de HIIT com intervalos trabalho:pausa, modalidade ergométrica e densidade.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.Engines.HiitStrengthEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function generateRoutines(context = {}, options = {}) {
    const routines = [
      {
        id: 'A',
        routineName: 'Treino A · Peitoral & Ombros (Força) + HIIT Esteira (30s/30s)',
        sessionType: 'DUPLO_MOTOR_FORCA_E_HIIT',
        modality: 'hiit_musculacao',
        coordinationOrder: 'FORCA_PRIMEIRO_DEPOIS_HIIT',
        exercises: [
          // Módulo 1: Musculação Pura
          {
            exerciseId: 'pe01',
            exerciseName: '[MÓDULO FORÇA] Supino Reto com Barra',
            module: 'FORCA',
            sets: 4,
            reps: '6-8',
            loadKg: 70,
            rpe: 8.0,
            restSeconds: 120,
            cadence: '3-0-1-0',
            notes: 'Foco puro na tensão mecânica miofibrilar antes da fadiga metabólica.'
          },
          {
            exerciseId: 'pe05',
            exerciseName: '[MÓDULO FORÇA] Supino Inclinado com Halteres',
            module: 'FORCA',
            sets: 3,
            reps: '8-10',
            loadKg: 24,
            rpe: 8.0,
            restSeconds: 90,
            cadence: '3-0-1-0',
            notes: 'Feixe clavicular com amplitude completa.'
          },
          {
            exerciseId: 'sh06',
            exerciseName: '[MÓDULO FORÇA] Elevação Lateral com Halteres',
            module: 'FORCA',
            sets: 4,
            reps: '10-12',
            loadKg: 10,
            rpe: 8.5,
            restSeconds: 45,
            notes: 'Deltoide medial isolado.'
          },
          // Módulo 2: HIIT Coordenado
          {
            exerciseId: 'hiit_esteira_sprint',
            exerciseName: '[MÓDULO HIIT] Protocolo 10x 30s/30s na Esteira Inclinada',
            module: 'HIIT',
            sets: 10,
            reps: '30s sprint / 30s caminhada',
            durationMinutes: 10,
            workDurationSec: 30,
            restDurationSec: 30,
            workRestRatio: '1:1',
            hiitModality: 'Esteira 15-18 km/h (inclinação 1.5%)',
            heartRateZone: 'Zona 5 (>90% FCmáx)',
            rpe: 9.5,
            restSeconds: 30,
            notes: 'Depleção glicogênica profunda e pico de VO2max sem impacto no estímulo de membros superiores.'
          }
        ]
      },
      {
        id: 'B',
        routineName: 'Treino B · Dorsais & Braços (Força) + HIIT Remo Concept2 (100m/45s)',
        sessionType: 'DUPLO_MOTOR_FORCA_E_HIIT',
        modality: 'hiit_musculacao',
        coordinationOrder: 'FORCA_PRIMEIRO_DEPOIS_HIIT',
        exercises: [
          // Módulo 1: Musculação
          {
            exerciseId: 'do01',
            exerciseName: '[MÓDULO FORÇA] Barra Fixa Pronada Estrita',
            module: 'FORCA',
            sets: 4,
            reps: '6-8',
            loadKg: 0,
            rpe: 8.5,
            restSeconds: 120,
            notes: 'Tração vertical pura com amplitude completa.'
          },
          {
            exerciseId: 'do08',
            exerciseName: '[MÓDULO FORÇA] Remada Curvada com Barra',
            module: 'FORCA',
            sets: 4,
            reps: '8-10',
            loadKg: 60,
            rpe: 8.0,
            restSeconds: 90,
            notes: 'Espessura dorsal e romboides.'
          },
          {
            exerciseId: 'bi01',
            exerciseName: '[MÓDULO FORÇA] Rosca Direta com Barra',
            module: 'FORCA',
            sets: 3,
            reps: '8-10',
            loadKg: 26,
            rpe: 8.5,
            restSeconds: 60,
            notes: 'Flexores de cotovelo.'
          },
          // Módulo 2: HIIT
          {
            exerciseId: 'hiit_row_sprint',
            exerciseName: '[MÓDULO HIIT] Tiros Máximos de 100m no Remo Concept2 RowErg',
            module: 'HIIT',
            sets: 8,
            reps: '100m sprint (<18s)',
            durationMinutes: 8,
            workDurationSec: 18,
            restDurationSec: 42,
            workRestRatio: '1:2',
            hiitModality: 'Remo RowErg (Damper 6)',
            heartRateZone: 'Zona 5',
            rpe: 9.5,
            restSeconds: 45,
            notes: 'Potência anaeróbia máxima em ritmo < 1:30/500m com descanso ativo suave.'
          }
        ]
      },
      {
        id: 'C',
        routineName: 'Treino C · Pernas Completo (Força RIR 2) + Cardio Recuperativo Z1/Z2',
        sessionType: 'DUPLO_MOTOR_FORCA_E_RECUPERACAO',
        modality: 'hiit_musculacao',
        coordinationOrder: 'FORCA_PRIMEIRO_DEPOIS_RECUPERACAO',
        exercises: [
          // Módulo 1: Musculação (Alta Intensidade Miofibrilar)
          {
            exerciseId: 'lg01',
            exerciseName: '[MÓDULO FORÇA] Agachamento Livre com Barra',
            module: 'FORCA',
            sets: 4,
            reps: '6-8',
            loadKg: 80,
            rpe: 8.0,
            restSeconds: 150,
            notes: 'Força básica de quadríceps com excêntrica de 3s (RIR 2).'
          },
          {
            exerciseId: 'lg10',
            exerciseName: '[MÓDULO FORÇA] Stiff com Barra',
            module: 'FORCA',
            sets: 4,
            reps: '6-8',
            loadKg: 70,
            rpe: 8.0,
            restSeconds: 120,
            notes: 'Cadeia posterior e isquiotibiais (RIR 2).'
          },
          // Módulo 2: Cardio Recuperativo Z1/Z2 (Salvaguarda Clínica Anti-Concorrência)
          // Regra Fisiológica: se força de pernas possui carga alta (RIR <= 2), HIIT glicolítico de pernas é proibido.
          {
            exerciseId: 'cardio_recuperativo_z1',
            exerciseName: '[MÓDULO RECUPERAÇÃO] Desaquecimento Ativo & Flush Metabólico Z1/Z2 (Bike Suave / Caminhada Plana)',
            module: 'CARDIO_RECUPERATIVO',
            sets: 1,
            reps: '15 min contínuos',
            durationMinutes: 15,
            hiitModality: 'Bike Spinning ou Esteira Plana (Sem Impacto)',
            heartRateZone: 'Zona 1 a Zona 2 (<65% FCmáx)',
            rpe: 5.0,
            restSeconds: 0,
            notes: 'Proteção neuromuscular: após musculação pesada de pernas (RIR 2), HIIT glicolítico em ergômetros de perna é estritamente proibido para evitar concorrência metabólica severa e sobrecarga excêntrica. Prescrito flush ativo Z1/Z2 para depuração de lactato.'
          }
        ]
      }
    ];

    return {
      modality: 'hiit_musculacao',
      split: 'HIIT_Forca',
      routines: routines
    };
  }

  /**
   * Avalia compatibilidade metabólica entre força e cardio acoplado
   * @param {Array} exercises 
   * @returns {{ isSafe: boolean, conflictReason: string|null }}
   */
  function auditMetabolicConcurrency(exercises = []) {
    const hasHeavyLegs = exercises.some(e =>
      (e.module === 'FORCA' || !e.module) &&
      (e.exerciseId === 'lg01' || e.exerciseId === 'lg10' || /perna|squat|agacha|stiff|leg/i.test(e.exerciseName || '')) &&
      (Number(e.rpe) >= 8.0)
    );

    const hasIntenseLegHiit = exercises.some(e =>
      (e.module === 'HIIT') &&
      (/airbike|echo|esteira.*sprint|tabata.*perna|sprint/i.test(e.exerciseName || '') || /airbike/i.test(e.hiitModality || '')) &&
      (Number(e.rpe) >= 8.5)
    );

    if (hasHeavyLegs && hasIntenseLegHiit) {
      return {
        isSafe: false,
        conflictReason: 'Concorrência metabólica severa detectada: musculação pesada de pernas (RIR <= 2) associada a HIIT glicolítico de alta intensidade no mesmo dia. Cardio deve ser convertido para Zona 1/2 recuperativo.'
      };
    }

    return { isSafe: true, conflictReason: null };
  }

  function validateRoutine(routine) {
    const errors = [];
    if (!routine || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push('Rotina HIIT + Musculação deve conter exercícios.');
      return { isValid: false, errors };
    }

    const audit = auditMetabolicConcurrency(routine.exercises);
    if (!audit.isSafe) {
      errors.push(audit.conflictReason);
    }

    return { isValid: errors.length === 0, errors };
  }

  return {
    generateRoutines,
    auditMetabolicConcurrency,
    validateRoutine
  };
});
