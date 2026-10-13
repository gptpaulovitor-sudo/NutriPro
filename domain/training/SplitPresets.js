/**
 * domain/training/SplitPresets.js
 * 
 * Presets Canônicos Unificados de Divisões de Treinamento e Inferência da Anamnese.
 * Fonte única da verdade compartilhada entre o Pro Portal (app.js) e o Next.js (page.tsx).
 * 
 * Camada de Domínio Puro — UMD (Node.js, Browser, ESM/Next.js).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.SplitPresets = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Catálogo de Metadados e Rotinas das Divisões de Treinamento
   */
  const TRAINING_SPLITS = Object.freeze({
  "HYROX": {
    "id": "HYROX",
    "name": "HYROX / Fitness Racing",
    "category": "Híbrida & Racing",
    "daysCount": 3,
    "description": "Ergômetros (SkiErg, Remo, AirBike), estações oficiais (trenó, lunges, wall balls) e esteira.",
    "badge": "★ Racing",
    "icon": "⚡🏃🏋️",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Ergômetros & Potência Aeróbica (HYROX)",
        "exercises": [
          {
            "exerciseId": "hy01",
            "name": "SkiErg Concept2 (Intervalos de Potência)",
            "sets": 5,
            "reps": "500m",
            "rpe": 8.5,
            "rest": 90
          },
          {
            "exerciseId": "hy02",
            "name": "Remo Concept2 RowErg (Capacidade Aeróbica)",
            "sets": 4,
            "reps": "750m",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "hy03",
            "name": "AirBike / Echo Bike / CycleAir",
            "sets": 4,
            "reps": "1 min",
            "rpe": 9,
            "rest": 120
          },
          {
            "exerciseId": "hy04",
            "name": "Tiros de Velocidade na Esteira (Sprints)",
            "sets": 5,
            "reps": "400m",
            "rpe": 8.5,
            "rest": 60
          },
          {
            "exerciseId": "ab06",
            "name": "Prancha Isométrica no Solo (Plank)",
            "sets": 4,
            "reps": "45s",
            "rpe": 8,
            "rest": 45
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Força Funcional & Estações HYROX",
        "exercises": [
          {
            "exerciseId": "hy06",
            "name": "Sled Push (Empurrar Trenó com Carga)",
            "sets": 4,
            "reps": "20m",
            "rpe": 9,
            "rest": 120
          },
          {
            "exerciseId": "hy07",
            "name": "Sled Pull (Puxar Trenó com Corda)",
            "sets": 4,
            "reps": "20m",
            "rpe": 8.5,
            "rest": 120
          },
          {
            "exerciseId": "hy08",
            "name": "Burpee Broad Jumps (Salto em Extensão)",
            "sets": 4,
            "reps": "15 reps",
            "rpe": 8.5,
            "rest": 90
          },
          {
            "exerciseId": "hy09",
            "name": "Sandbag Walking Lunges (Passada com Saco)",
            "sets": 4,
            "reps": "20 passos",
            "rpe": 8.5,
            "rest": 90
          },
          {
            "exerciseId": "hy10",
            "name": "Farmers Carry com Halteres / Kettlebells",
            "sets": 4,
            "reps": "50m",
            "rpe": 8.5,
            "rest": 90
          },
          {
            "exerciseId": "hy11",
            "name": "Wall Balls com Medicine Ball (6/9kg)",
            "sets": 4,
            "reps": "20 reps",
            "rpe": 9,
            "rest": 60
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Concorrente & Simulação de Prova",
        "exercises": [
          {
            "exerciseId": "hy05",
            "name": "Corrida Contínua na Esteira (Ritmo Z3/Z4)",
            "sets": 1,
            "reps": "1000m",
            "rpe": 7,
            "rest": 60
          },
          {
            "exerciseId": "hy02",
            "name": "Remo Concept2 RowErg (Capacidade Aeróbica)",
            "sets": 4,
            "reps": "500m",
            "rpe": 8.5,
            "rest": 90
          },
          {
            "exerciseId": "hy01",
            "name": "SkiErg Concept2 (Intervalos de Potência)",
            "sets": 4,
            "reps": "500m",
            "rpe": 8.5,
            "rest": 90
          },
          {
            "exerciseId": "hy11",
            "name": "Wall Balls com Medicine Ball (6/9kg)",
            "sets": 4,
            "reps": "15 reps",
            "rpe": 8.5,
            "rest": 60
          },
          {
            "exerciseId": "hy10",
            "name": "Farmers Carry com Halteres / Kettlebells",
            "sets": 3,
            "reps": "40m",
            "rpe": 8,
            "rest": 60
          }
        ]
      }
    ]
  },
  "CrossFit": {
    "id": "CrossFit",
    "name": "CrossFit / Metcon WOD",
    "category": "Híbrida & Racing",
    "daysCount": 3,
    "description": "Levantamento de peso olímpico (LPO), ginástica funcional e metcon glicolítico.",
    "badge": "★ Híbrida",
    "icon": "🔥🏋️",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Força Básica & LPO",
        "exercises": [
          {
            "exerciseId": "do16",
            "name": "Levantamento Terra Convencional (Deadlift)",
            "sets": 5,
            "reps": "3-5",
            "rpe": 8.5,
            "rest": 150
          },
          {
            "exerciseId": "lg02",
            "name": "Agachamento Frontal com Barra (Front Squat)",
            "sets": 4,
            "reps": "4-6",
            "rpe": 8.5,
            "rest": 120
          },
          {
            "exerciseId": "sh01",
            "name": "Desenvolvimento Militar em Pé (Overhead)",
            "sets": 4,
            "reps": "5-6",
            "rpe": 8,
            "rest": 90
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Metcon Glicolítico & Ginástica",
        "exercises": [
          {
            "exerciseId": "do01",
            "name": "Barra Fixa Pronada (Pull-up)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 90
          },
          {
            "exerciseId": "pe19",
            "name": "Mergulho em Paralelas (Foco Peitoral)",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "hy12",
            "name": "Thrusters com Barra (Agachamento + Press)",
            "sets": 4,
            "reps": "12-15",
            "rpe": 9,
            "rest": 90
          },
          {
            "exerciseId": "ab03",
            "name": "Elevação de Pernas na Barra Fixa (Hanging Leg Raise)",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Resistência Metabólica Mista (WOD)",
        "exercises": [
          {
            "exerciseId": "hy14",
            "name": "Kettlebell Swing Americano",
            "sets": 4,
            "reps": "15-20",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "hy13",
            "name": "Box Jump na Caixa (60cm)",
            "sets": 4,
            "reps": "12 reps",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "hy02",
            "name": "Remo Concept2 RowErg (Capacidade Aeróbica)",
            "sets": 4,
            "reps": "20 cal",
            "rpe": 9,
            "rest": 60
          }
        ]
      }
    ]
  },
  "RunningStrength": {
    "id": "RunningStrength",
    "name": "Corrida + Musculação (Concorrente)",
    "category": "Híbrida & Racing",
    "daysCount": 4,
    "description": "Periodização concorrente com esteira, força de membros inferiores e cadeia posterior.",
    "badge": "★ Híbrida",
    "icon": "🏃🏋️",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Upper Força + Tiros na Esteira",
        "exercises": [
          {
            "exerciseId": "pe01",
            "name": "Supino Reto com Barra",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 120
          },
          {
            "exerciseId": "do08",
            "name": "Remada Curvada com Barra (Pronada)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "sh01",
            "name": "Desenvolvimento Militar em Pé (Overhead)",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "hy04",
            "name": "Tiros de Velocidade na Esteira (Sprints)",
            "sets": 8,
            "reps": "200m",
            "rpe": 9,
            "rest": 45
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Lower Força & Cadeia Posterior",
        "exercises": [
          {
            "exerciseId": "lg01",
            "name": "Agachamento Livre com Barra (Back Squat)",
            "sets": 4,
            "reps": "5-6",
            "rpe": 8,
            "rest": 150
          },
          {
            "exerciseId": "lg10",
            "name": "Stiff com Barra (Terra Romeno)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 120
          },
          {
            "exerciseId": "lg07",
            "name": "Agachamento Búlgaro com Halteres",
            "sets": 3,
            "reps": "8 cada perna",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "lg20",
            "name": "Panturrilha em Pé na Máquina",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Corrida Contínua em Limiar (Tempo Run)",
        "exercises": [
          {
            "exerciseId": "hy05",
            "name": "Corrida Contínua na Esteira (Ritmo Z3/Z4)",
            "sets": 1,
            "reps": "35 min",
            "rpe": 7.5,
            "rest": 0
          },
          {
            "exerciseId": "ab05",
            "name": "Abdominal Rollout (Roda Abdominal)",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "ab06",
            "name": "Prancha Isométrica no Solo (Plank)",
            "sets": 3,
            "reps": "45s",
            "rpe": 8,
            "rest": 45
          }
        ]
      },
      {
        "id": "D",
        "name": "Treino D — Full Body Funcional & Core",
        "exercises": [
          {
            "exerciseId": "do16",
            "name": "Levantamento Terra Convencional (Deadlift)",
            "sets": 4,
            "reps": "6 reps",
            "rpe": 8,
            "rest": 120
          },
          {
            "exerciseId": "pe05",
            "name": "Supino Inclinado com Halteres",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "do11",
            "name": "Remada Unilateral com Halter (Serrote)",
            "sets": 3,
            "reps": "10 reps",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "lg08",
            "name": "Avanço / Passada com Halteres ou Barra",
            "sets": 3,
            "reps": "12 passos",
            "rpe": 7.5,
            "rest": 60
          }
        ]
      }
    ]
  },
  "HIIT_Forca": {
    "id": "HIIT_Forca",
    "name": "HIIT + Musculação",
    "category": "Híbrida & Racing",
    "daysCount": 3,
    "description": "Blocos de musculação hipertrófica combinados com finalizadores na esteira, remo e bike.",
    "badge": "★ Híbrida",
    "icon": "⚡🏋️",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Push & HIIT Esteira",
        "exercises": [
          {
            "exerciseId": "pe01",
            "name": "Supino Reto com Barra",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 120
          },
          {
            "exerciseId": "pe05",
            "name": "Supino Inclinado com Halteres",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "sh06",
            "name": "Elevação Lateral com Halteres",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 45
          },
          {
            "exerciseId": "tr01",
            "name": "Tríceps na Polia com Barra Reta (Pushdown)",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60
          },
          {
            "exerciseId": "hy04",
            "name": "Tiros de Velocidade na Esteira (Sprints)",
            "sets": 8,
            "reps": "30s tiros",
            "rpe": 9,
            "rest": 30
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Pull & HIIT Remo",
        "exercises": [
          {
            "exerciseId": "do01",
            "name": "Barra Fixa Pronada (Pull-up)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 120
          },
          {
            "exerciseId": "do08",
            "name": "Remada Curvada com Barra (Pronada)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "bi01",
            "name": "Rosca Direta com Barra Reta",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "hy02",
            "name": "Remo Concept2 RowErg (Capacidade Aeróbica)",
            "sets": 6,
            "reps": "150m sprint",
            "rpe": 9,
            "rest": 45
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Legs & HIIT AirBike",
        "exercises": [
          {
            "exerciseId": "lg01",
            "name": "Agachamento Livre com Barra (Back Squat)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 150
          },
          {
            "exerciseId": "lg04",
            "name": "Leg Press 45°",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "lg10",
            "name": "Stiff com Barra (Terra Romeno)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 120
          },
          {
            "exerciseId": "hy03",
            "name": "AirBike / Echo Bike / CycleAir",
            "sets": 8,
            "reps": "20s on / 10s off",
            "rpe": 9.5,
            "rest": 10
          }
        ]
      }
    ]
  },
  "PPL": {
    "id": "PPL",
    "name": "Push / Pull / Legs (PPL)",
    "category": "Musculação Tradicional",
    "daysCount": 3,
    "description": "Divisão clássica de 3 a 6 dias separando empurrar, puxar e membros inferiores.",
    "badge": "Clássico",
    "icon": "🏋️",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Push (Empurrar)",
        "exercises": [
          {
            "exerciseId": "pe01",
            "name": "Supino Reto com Barra",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 120
          },
          {
            "exerciseId": "pe05",
            "name": "Supino Inclinado com Halteres",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "sh06",
            "name": "Elevação Lateral com Halteres",
            "sets": 4,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "tr01",
            "name": "Tríceps na Polia com Barra Reta (Pushdown)",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "ab02",
            "name": "Abdominal na Polia Alta com Corda (Cable Crunch)",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Pull (Puxar)",
        "exercises": [
          {
            "exerciseId": "do01",
            "name": "Barra Fixa Pronada (Pull-up)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 120
          },
          {
            "exerciseId": "do08",
            "name": "Remada Curvada com Barra (Pronada)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 90
          },
          {
            "exerciseId": "sh15",
            "name": "Face Pull na Polia com Corda",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8,
            "rest": 45
          },
          {
            "exerciseId": "bi01",
            "name": "Rosca Direta com Barra Reta",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "ab03",
            "name": "Elevação de Pernas na Barra Fixa (Hanging Leg Raise)",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Legs (Pernas)",
        "exercises": [
          {
            "exerciseId": "lg01",
            "name": "Agachamento Livre com Barra (Back Squat)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 150
          },
          {
            "exerciseId": "lg10",
            "name": "Stiff com Barra (Terra Romeno)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 120
          },
          {
            "exerciseId": "lg06",
            "name": "Cadeira Extensora",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "lg13",
            "name": "Cadeira Flexora Sentada",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "lg20",
            "name": "Panturrilha em Pé na Máquina",
            "sets": 4,
            "reps": "12-15",
            "rpe": 8.5,
            "rest": 60
          }
        ]
      }
    ]
  },
  "UpperLower": {
    "id": "UpperLower",
    "name": "Upper / Lower (4 Dias)",
    "category": "Musculação Tradicional",
    "daysCount": 4,
    "description": "Divisão de tronco e membros inferiores para alta frequência e força mecânica.",
    "badge": "Alta Freq.",
    "icon": "⚡",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Upper Força",
        "exercises": [
          {
            "exerciseId": "pe01",
            "name": "Supino Reto com Barra",
            "sets": 4,
            "reps": "5-8",
            "rpe": 8.5,
            "rest": 120
          },
          {
            "exerciseId": "do01",
            "name": "Barra Fixa Pronada (Pull-up)",
            "sets": 4,
            "reps": "5-8",
            "rpe": 8.5,
            "rest": 120
          },
          {
            "exerciseId": "sh01",
            "name": "Desenvolvimento Militar em Pé (Overhead)",
            "sets": 3,
            "reps": "6-8",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "tr01",
            "name": "Tríceps na Polia com Barra Reta (Pushdown)",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 60
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Lower Força",
        "exercises": [
          {
            "exerciseId": "lg01",
            "name": "Agachamento Livre com Barra (Back Squat)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 150
          },
          {
            "exerciseId": "lg10",
            "name": "Stiff com Barra (Terra Romeno)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 120
          },
          {
            "exerciseId": "lg04",
            "name": "Leg Press 45°",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "lg20",
            "name": "Panturrilha em Pé na Máquina",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Upper Hipertrofia",
        "exercises": [
          {
            "exerciseId": "pe05",
            "name": "Supino Inclinado com Halteres",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "do04",
            "name": "Puxada Frontal Aberta na Polia",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "sh06",
            "name": "Elevação Lateral com Halteres",
            "sets": 4,
            "reps": "12-15",
            "rpe": 8,
            "rest": 45
          },
          {
            "exerciseId": "bi01",
            "name": "Rosca Direta com Barra Reta",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60
          }
        ]
      },
      {
        "id": "D",
        "name": "Treino D — Lower Hipertrofia",
        "exercises": [
          {
            "exerciseId": "lg03",
            "name": "Agachamento Hack (Máquina)",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "lg06",
            "name": "Cadeira Extensora",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8.5,
            "rest": 60
          },
          {
            "exerciseId": "lg13",
            "name": "Cadeira Flexora Sentada",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60
          },
          {
            "exerciseId": "lg15",
            "name": "Elevação Pélvica com Barra (Hip Thrust)",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8.5,
            "rest": 90
          }
        ]
      }
    ]
  },
  "FullBody": {
    "id": "FullBody",
    "name": "Full Body (3 Dias)",
    "category": "Musculação Tradicional",
    "daysCount": 3,
    "description": "Corpo inteiro com foco em multiarticulares e recuperação espaçada.",
    "badge": "3 Dias",
    "icon": "⚡",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Full Body Squat & Push",
        "exercises": [
          {
            "exerciseId": "lg01",
            "name": "Agachamento Livre com Barra (Back Squat)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 120
          },
          {
            "exerciseId": "pe01",
            "name": "Supino Reto com Barra",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "do08",
            "name": "Remada Curvada com Barra (Pronada)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "ab06",
            "name": "Prancha Isométrica no Solo (Plank)",
            "sets": 3,
            "reps": "45s",
            "rpe": 8,
            "rest": 45
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Full Body Hinge & Pull",
        "exercises": [
          {
            "exerciseId": "lg10",
            "name": "Stiff com Barra (Terra Romeno)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 120
          },
          {
            "exerciseId": "do01",
            "name": "Barra Fixa Pronada (Pull-up)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 120
          },
          {
            "exerciseId": "sh01",
            "name": "Desenvolvimento Militar em Pé (Overhead)",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "ab03",
            "name": "Elevação de Pernas na Barra Fixa (Hanging Leg Raise)",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Full Body Hipertrofia",
        "exercises": [
          {
            "exerciseId": "lg04",
            "name": "Leg Press 45°",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "pe05",
            "name": "Supino Inclinado com Halteres",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "do04",
            "name": "Puxada Frontal Aberta na Polia",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "sh06",
            "name": "Elevação Lateral com Halteres",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8,
            "rest": 45
          }
        ]
      }
    ]
  },
  "Triathlon": {
    "id": "Triathlon",
    "name": "Triathlon (4 Dias)",
    "category": "Híbrida & Racing",
    "daysCount": 4,
    "description": "Natação técnica, ciclismo de limiar, corrida de ritmo e força preventiva articular.",
    "badge": "★ Triathlon",
    "icon": "🏊🚴🏃",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Natação Técnica & Intervalada",
        "exercises": [
          {
            "exerciseId": "do01",
            "name": "Natação Intervalada na Piscina (Tiros 100m)",
            "sets": 8,
            "reps": "100m tiro",
            "rpe": 8,
            "rest": 30
          },
          {
            "exerciseId": "pe18",
            "name": "Flexões de Braço com Escápula Estável",
            "sets": 3,
            "reps": "12-15",
            "rpe": 7.5,
            "rest": 60
          },
          {
            "exerciseId": "ab06",
            "name": "Prancha Frontal e Isométrica (Plank)",
            "sets": 3,
            "reps": "45s",
            "rpe": 8,
            "rest": 45
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Ciclismo Intervalado de Limiar",
        "exercises": [
          {
            "exerciseId": "hy03",
            "name": "Ciclismo em Limiar de Potência (Sweet Spot)",
            "sets": 4,
            "reps": "8 min",
            "rpe": 8.5,
            "rest": 120
          },
          {
            "exerciseId": "lg08",
            "name": "Giro Regenerativo de Alta Cadência",
            "sets": 1,
            "reps": "15 min",
            "rpe": 6.5,
            "rest": 0
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Corrida em Ritmo de Prova",
        "exercises": [
          {
            "exerciseId": "hy05",
            "name": "Corrida Contínua em Zona 3/4 (Tempo Run)",
            "sets": 1,
            "reps": "35-45 min",
            "rpe": 8,
            "rest": 0
          },
          {
            "exerciseId": "lg20",
            "name": "Panturrilha Unilateral no Degrau",
            "sets": 4,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60
          }
        ]
      },
      {
        "id": "D",
        "name": "Treino D — Força Preventiva para Triatletas",
        "exercises": [
          {
            "exerciseId": "do16",
            "name": "Levantamento Terra com Trap Bar / Barra",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 120
          },
          {
            "exerciseId": "lg07",
            "name": "Agachamento Búlgaro com Halteres",
            "sets": 3,
            "reps": "8-10 cada",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "sh15",
            "name": "Face Pull na Polia com Rotação Externa",
            "sets": 3,
            "reps": "12-15",
            "rpe": 7.5,
            "rest": 60
          },
          {
            "exerciseId": "ab05",
            "name": "Abdominal Rollout (Roda Abdominal)",
            "sets": 3,
            "reps": "10 reps",
            "rpe": 8,
            "rest": 60
          }
        ]
      }
    ]
  },
  "FuncionalMisto": {
    "id": "FuncionalMisto",
    "name": "Funcional Misto (3 Dias)",
    "category": "Híbrida & Racing",
    "daysCount": 3,
    "description": "Padrões motores fundamentais, mobilidade ativa, potência de core e circuito metabólico.",
    "badge": "★ Funcional",
    "icon": "⚡🤸",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Padrões Fundamentais & Mobilidade",
        "exercises": [
          {
            "exerciseId": "lg01",
            "name": "Agachamento Goblet com Halter / Kettlebell",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "do11",
            "name": "Remada Unilateral com Halter (Serrote)",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "pe18",
            "name": "Flexão de Braço no Solo (Push-up)",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "ab06",
            "name": "Prancha Lateral com Elevação de Quadril",
            "sets": 3,
            "reps": "30s / lado",
            "rpe": 7.5,
            "rest": 45
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Potência & Core Integrado",
        "exercises": [
          {
            "exerciseId": "hy14",
            "name": "Kettlebell Swing Russo",
            "sets": 4,
            "reps": "15-20",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "hy10",
            "name": "Farmers Carry com Halteres / Kettlebells",
            "sets": 4,
            "reps": "40m",
            "rpe": 8.5,
            "rest": 90
          },
          {
            "exerciseId": "lg08",
            "name": "Avanço / Passada com Halteres",
            "sets": 3,
            "reps": "12 passos",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "ab03",
            "name": "Elevação de Pernas na Barra Fixa",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Circuito Metabólico Funcional",
        "exercises": [
          {
            "exerciseId": "hy08",
            "name": "Burpees Dinâmicos no Solo",
            "sets": 4,
            "reps": "12 reps",
            "rpe": 8.5,
            "rest": 45
          },
          {
            "exerciseId": "hy02",
            "name": "Remo Concept2 RowErg",
            "sets": 4,
            "reps": "250m",
            "rpe": 8.5,
            "rest": 60
          },
          {
            "exerciseId": "hy13",
            "name": "Box Jump na Caixa (60cm)",
            "sets": 3,
            "reps": "12 cada",
            "rpe": 8,
            "rest": 60
          }
        ]
      }
    ]
  },
  "Ciclismo_Forca": {
    "id": "Ciclismo_Forca",
    "name": "Ciclismo + Força (4 Dias)",
    "category": "Híbrida & Racing",
    "daysCount": 4,
    "description": "Potência máxima de quadríceps, sessões intervaladas na bike e resistência de tronco.",
    "badge": "★ Ciclismo & Força",
    "icon": "🚴💪",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Força de Pernas para Ciclismo",
        "exercises": [
          {
            "exerciseId": "lg01",
            "name": "Agachamento Livre com Barra (Back Squat)",
            "sets": 4,
            "reps": "5-6",
            "rpe": 8.5,
            "rest": 150
          },
          {
            "exerciseId": "lg04",
            "name": "Leg Press 45°",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "lg10",
            "name": "Stiff com Barra (Terra Romeno)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 120
          },
          {
            "exerciseId": "lg20",
            "name": "Panturrilha em Pé na Máquina",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Sessão de Bike Intervalada",
        "exercises": [
          {
            "exerciseId": "hy03",
            "name": "Tiros de Potência VO2max na Bike",
            "sets": 5,
            "reps": "3 min",
            "rpe": 9,
            "rest": 180
          },
          {
            "exerciseId": "lg08",
            "name": "Giro de Cadência Recuperativa",
            "sets": 1,
            "reps": "20 min",
            "rpe": 6,
            "rest": 0
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Tronco & Postura de Guidão",
        "exercises": [
          {
            "exerciseId": "do08",
            "name": "Remada Curvada com Barra (Pronada)",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "pe01",
            "name": "Supino Reto com Barra",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "sh15",
            "name": "Face Pull na Polia com Rotação Externa",
            "sets": 3,
            "reps": "12-15",
            "rpe": 7.5,
            "rest": 60
          },
          {
            "exerciseId": "ab06",
            "name": "Prancha Isométrica de Sustentação",
            "sets": 3,
            "reps": "45s",
            "rpe": 8,
            "rest": 45
          }
        ]
      },
      {
        "id": "D",
        "name": "Treino D — Longão de Ciclismo Z2",
        "exercises": [
          {
            "exerciseId": "hy03",
            "name": "Rodagem Contínua em Zona 2 (Longão)",
            "sets": 1,
            "reps": "75 min",
            "rpe": 7,
            "rest": 0
          }
        ]
      }
    ]
  },
  "EsportesColetivos": {
    "id": "EsportesColetivos",
    "name": "Esportes Coletivos (3 Dias)",
    "category": "Híbrida & Racing",
    "daysCount": 3,
    "description": "Força reativa, pliometria, aceleração/mudança de direção e condicionamento intermitente.",
    "badge": "★ Coletivos",
    "icon": "⚽🏀",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Força Reativa & Pliometria",
        "exercises": [
          {
            "exerciseId": "do16",
            "name": "Levantamento Terra Convencional",
            "sets": 4,
            "reps": "5 reps",
            "rpe": 8,
            "rest": 120
          },
          {
            "exerciseId": "hy13",
            "name": "Box Jump na Caixa (60cm)",
            "sets": 4,
            "reps": "6 saltos",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "lg07",
            "name": "Agachamento Búlgaro com Halteres",
            "sets": 3,
            "reps": "6 cada",
            "rpe": 8,
            "rest": 90
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Agilidade & Mudança de Direção",
        "exercises": [
          {
            "exerciseId": "hy04",
            "name": "Tiros Curtos com Mudança de Direção",
            "sets": 6,
            "reps": "15m percurso",
            "rpe": 8.5,
            "rest": 60
          },
          {
            "exerciseId": "lg10",
            "name": "Flexão Nórdica ou Stiff Unilateral",
            "sets": 3,
            "reps": "6-8 reps",
            "rpe": 8.5,
            "rest": 90
          },
          {
            "exerciseId": "ab06",
            "name": "Prancha Lateral com Abdução de Quadril",
            "sets": 3,
            "reps": "30s / lado",
            "rpe": 8,
            "rest": 45
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Condicionamento Intermitente",
        "exercises": [
          {
            "exerciseId": "hy04",
            "name": "Sprints Intermitentes 15s / 15s",
            "sets": 10,
            "reps": "15s tiro",
            "rpe": 9,
            "rest": 15
          },
          {
            "exerciseId": "pe18",
            "name": "Flexões com Empurrada Explosiva",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "ab02",
            "name": "Rotação de Tronco no Cabo (Woodchopper)",
            "sets": 3,
            "reps": "12 / lado",
            "rpe": 8,
            "rest": 60
          }
        ]
      }
    ]
  },
  "MistoCardio": {
    "id": "MistoCardio",
    "name": "Misto Força + Cardio (4 Dias)",
    "category": "Híbrida & Racing",
    "daysCount": 4,
    "description": "Equilíbrio metabólico e recomposição corporal com musculação e cardio estruturado.",
    "badge": "★ Misto",
    "icon": "⚡🏃",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Upper Força + Cardio Z2",
        "exercises": [
          {
            "exerciseId": "pe01",
            "name": "Supino Reto com Barra",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "do08",
            "name": "Remada Curvada com Barra",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "sh06",
            "name": "Elevação Lateral com Halteres",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8.5,
            "rest": 45
          },
          {
            "exerciseId": "hy05",
            "name": "Cardio Pós-Treino em Zona 2",
            "sets": 1,
            "reps": "25 min",
            "rpe": 7,
            "rest": 0
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Lower Força & Posterior",
        "exercises": [
          {
            "exerciseId": "lg01",
            "name": "Agachamento Livre com Barra",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 120
          },
          {
            "exerciseId": "lg04",
            "name": "Leg Press 45°",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "lg10",
            "name": "Stiff com Barra",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "lg20",
            "name": "Panturrilha em Pé na Máquina",
            "sets": 4,
            "reps": "12-15",
            "rpe": 8.5,
            "rest": 45
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Cardio HIIT Dedicado",
        "exercises": [
          {
            "exerciseId": "hy02",
            "name": "Remo Concept2 ou Esteira (HIIT 1m/1m)",
            "sets": 8,
            "reps": "1m tiro",
            "rpe": 8.5,
            "rest": 60
          },
          {
            "exerciseId": "ab05",
            "name": "Abdominal Rollout ou Prancha Frontal",
            "sets": 3,
            "reps": "12 reps",
            "rpe": 8,
            "rest": 45
          }
        ]
      },
      {
        "id": "D",
        "name": "Treino D — Full Body Funcional & Core",
        "exercises": [
          {
            "exerciseId": "do16",
            "name": "Levantamento Terra com Halteres / Barra",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "pe05",
            "name": "Supino Inclinado com Halteres",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "do04",
            "name": "Puxada Frontal Aberta na Polia",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "lg08",
            "name": "Passada com Halteres (Walking Lunges)",
            "sets": 3,
            "reps": "10 passos",
            "rpe": 8,
            "rest": 60
          }
        ]
      }
    ]
  },
  "Corrida_Endurance": {
    "id": "Corrida_Endurance",
    "name": "Corrida / Endurance (4 Dias)",
    "category": "Modalidade Pura",
    "daysCount": 4,
    "description": "Tiros de velocidade na pista, fortalecimento anti-lesão, ritmo e longão em Zona 2.",
    "badge": "Endurance",
    "icon": "🏃",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Tiros de Velocidade & VO2max",
        "exercises": [
          {
            "exerciseId": "hy04",
            "name": "Tiros de 400m / 800m na Pista/Esteira",
            "sets": 6,
            "reps": "400m tiro",
            "rpe": 9,
            "rest": 90
          },
          {
            "exerciseId": "ab06",
            "name": "Prancha Frontal e Lateral para Estabilidade",
            "sets": 3,
            "reps": "45s",
            "rpe": 8,
            "rest": 45
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Fortalecimento Anti-Lesão de Corrida",
        "exercises": [
          {
            "exerciseId": "lg07",
            "name": "Agachamento Búlgaro com Halteres",
            "sets": 3,
            "reps": "8-10 cada",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "lg10",
            "name": "Stiff Unilateral com Halter",
            "sets": 3,
            "reps": "8 cada perna",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "lg20",
            "name": "Elevação de Panturrilha em Pé com Pausa",
            "sets": 4,
            "reps": "15 reps",
            "rpe": 8.5,
            "rest": 60
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Corrida em Ritmo de Prova",
        "exercises": [
          {
            "exerciseId": "hy05",
            "name": "Corrida Contínua em Ritmo de Limiar (Tempo Run)",
            "sets": 1,
            "reps": "40 min",
            "rpe": 8,
            "rest": 0
          }
        ]
      },
      {
        "id": "D",
        "name": "Treino D — Longão de Rodagem Contínua (Z2)",
        "exercises": [
          {
            "exerciseId": "hy05",
            "name": "Longão de Rodagem em Zona 2 (60-90 min)",
            "sets": 1,
            "reps": "75 min",
            "rpe": 7,
            "rest": 0
          }
        ]
      }
    ]
  },
  "Ciclismo_Endurance": {
    "id": "Ciclismo_Endurance",
    "name": "Ciclismo / Spinning (3 Dias)",
    "category": "Modalidade Pura",
    "daysCount": 3,
    "description": "Intervalos de Sweet Spot no rolo, força de sustentação e longão contínuo de estrada.",
    "badge": "Endurance",
    "icon": "🚴",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Treino de Limiar & Sweet Spot",
        "exercises": [
          {
            "exerciseId": "hy03",
            "name": "Intervalos Sweet Spot (88-93% FTP)",
            "sets": 4,
            "reps": "8 min",
            "rpe": 8.5,
            "rest": 120
          },
          {
            "exerciseId": "ab06",
            "name": "Prancha Isométrica de Sustentação",
            "sets": 3,
            "reps": "45s",
            "rpe": 7.5,
            "rest": 45
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Força de Sustentação & Core",
        "exercises": [
          {
            "exerciseId": "lg01",
            "name": "Agachamento Livre com Barra",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 120
          },
          {
            "exerciseId": "do08",
            "name": "Remada Curvada com Barra",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "lg10",
            "name": "Stiff com Halteres",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Longão de Endurance (Estrada / Rolo)",
        "exercises": [
          {
            "exerciseId": "hy03",
            "name": "Rodagem Longa Contínua (Longão de Ciclismo)",
            "sets": 1,
            "reps": "90-120 min",
            "rpe": 7,
            "rest": 0
          }
        ]
      }
    ]
  },
  "Natacao": {
    "id": "Natacao",
    "name": "Natação (3 Dias)",
    "category": "Modalidade Pura",
    "daysCount": 3,
    "description": "Séries aeróbias fracionadas de fundo, fortalecimento em terra e tiros curtos.",
    "badge": "Endurance",
    "icon": "🏊",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Volume Aeróbio Contínuo & Pacing",
        "exercises": [
          {
            "exerciseId": "do01",
            "name": "Série de Fundo na Piscina (Crawl)",
            "sets": 6,
            "reps": "200m a 400m",
            "rpe": 8,
            "rest": 45
          },
          {
            "exerciseId": "ab06",
            "name": "Prancha Frontal com Respiração Controlada",
            "sets": 3,
            "reps": "45s",
            "rpe": 7.5,
            "rest": 45
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Fortalecimento em Terra para Nadadores",
        "exercises": [
          {
            "exerciseId": "do01",
            "name": "Barra Fixa com Pegada Neutra",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "sh15",
            "name": "Face Pull com Rotação Externa",
            "sets": 3,
            "reps": "12-15",
            "rpe": 7.5,
            "rest": 60
          },
          {
            "exerciseId": "do11",
            "name": "Remada Unilateral com Halter (Serrote)",
            "sets": 3,
            "reps": "10 reps",
            "rpe": 8,
            "rest": 60
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Tiros de Velocidade & Pernada",
        "exercises": [
          {
            "exerciseId": "do01",
            "name": "Tiros de 50m Crawl em Velocidade Máxima",
            "sets": 10,
            "reps": "50m tiro",
            "rpe": 9,
            "rest": 45
          },
          {
            "exerciseId": "lg08",
            "name": "Pernada de Crawl com Prancha",
            "sets": 4,
            "reps": "100m pernada",
            "rpe": 8.5,
            "rest": 45
          }
        ]
      }
    ]
  },
  "Lutas": {
    "id": "Lutas",
    "name": "Lutas / Artes Marciais (3 Dias)",
    "category": "Modalidade Pura",
    "daysCount": 3,
    "description": "Força explosiva para quedas, resiliência cervical, pegada forte e rounds metabólicos.",
    "badge": "Combate",
    "icon": "🥊",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Força Explosiva & Potência",
        "exercises": [
          {
            "exerciseId": "do16",
            "name": "Levantamento Terra Convencional",
            "sets": 4,
            "reps": "4-6",
            "rpe": 8.5,
            "rest": 120
          },
          {
            "exerciseId": "pe01",
            "name": "Supino Reto com Saída Rápida",
            "sets": 4,
            "reps": "5-6",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "do01",
            "name": "Barra Fixa com Pano / Toalha (Grip Pull-up)",
            "sets": 3,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 90
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Pescoço, Grip & Core Rotacional",
        "exercises": [
          {
            "exerciseId": "hy10",
            "name": "Farmers Carry com Halteres / Kettlebells",
            "sets": 4,
            "reps": "40m",
            "rpe": 8.5,
            "rest": 90
          },
          {
            "exerciseId": "ab02",
            "name": "Rotação de Tronco no Cabo / Medicine Ball",
            "sets": 4,
            "reps": "10-12 / lado",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "sh15",
            "name": "Isometria Cervical & Trapézio Superior",
            "sets": 3,
            "reps": "30s",
            "rpe": 7.5,
            "rest": 45
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Resistência Lática & Condicionamento",
        "exercises": [
          {
            "exerciseId": "hy03",
            "name": "AirBike em Tiros de Round (3 min)",
            "sets": 4,
            "reps": "3 min round",
            "rpe": 9,
            "rest": 60
          },
          {
            "exerciseId": "hy08",
            "name": "Sprawls com Kettlebell ou Burpees Rápidos",
            "sets": 4,
            "reps": "12-15 reps",
            "rpe": 8.5,
            "rest": 45
          }
        ]
      }
    ]
  },
  "Calistenia": {
    "id": "Calistenia",
    "name": "Calistenia (3 Dias)",
    "category": "Modalidade Pura",
    "daysCount": 3,
    "description": "Força relativa com peso corporal: barras estritas, mergulhos em paralelas e isometrias.",
    "badge": "Peso Corporal",
    "icon": "🤸",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Tração (Pull) em Barra Fixa",
        "exercises": [
          {
            "exerciseId": "do01",
            "name": "Barra Fixa Pronada Estrita (Pull-up)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 120
          },
          {
            "exerciseId": "do08",
            "name": "Remada Australiana nas Argolas ou Barra Baixa",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "ab03",
            "name": "Toes-to-Bar / Elevação de Joelhos na Barra",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Empurrar (Push) em Paralelas",
        "exercises": [
          {
            "exerciseId": "pe19",
            "name": "Mergulho em Barras Paralelas (Dips)",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8.5,
            "rest": 90
          },
          {
            "exerciseId": "pe18",
            "name": "Flexão Declinada ou Diamante",
            "sets": 4,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "sh01",
            "name": "Pike Push-up ou Flexão na Parede (Handstand)",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90
          },
          {
            "exerciseId": "ab06",
            "name": "Hollow Body Hold (Canoa Isométrica)",
            "sets": 4,
            "reps": "40s",
            "rpe": 8,
            "rest": 45
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Pernas com Peso Corporal & Equilíbrio",
        "exercises": [
          {
            "exerciseId": "lg01",
            "name": "Pistol Squat (Agachamento Unilateral Livre)",
            "sets": 4,
            "reps": "5-6 cada perna",
            "rpe": 8.5,
            "rest": 90
          },
          {
            "exerciseId": "lg08",
            "name": "Passada Saltada / Jumping Lunges",
            "sets": 3,
            "reps": "12 saltos",
            "rpe": 8,
            "rest": 60
          },
          {
            "exerciseId": "ab05",
            "name": "Dragon Flag ou Prancha Abdominal Avançada",
            "sets": 3,
            "reps": "6-8 reps",
            "rpe": 8.5,
            "rest": 60
          }
        ]
      }
    ]
  },
  "Aerobico_Geral": {
    "id": "Aerobico_Geral",
    "name": "Aeróbico Geral (3 Dias)",
    "category": "Modalidade Pura",
    "daysCount": 3,
    "description": "Cardio contínuo de baixo impacto em Zona 2, circuitos aeróbios e caminhadas.",
    "badge": "Cardio Z2",
    "icon": "⚡🚶",
    "routines": [
      {
        "id": "A",
        "name": "Treino A — Cardio Contínuo de Baixo Impacto (Z2)",
        "exercises": [
          {
            "exerciseId": "hy05",
            "name": "Caminhada Inclinada ou Elíptico Z2",
            "sets": 1,
            "reps": "45 min",
            "rpe": 6.5,
            "rest": 0
          },
          {
            "exerciseId": "ab06",
            "name": "Prancha Frontal com Apoio nos Joelhos/Pés",
            "sets": 3,
            "reps": "30-45s",
            "rpe": 7,
            "rest": 45
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B — Circuito Metabólico Aeróbio",
        "exercises": [
          {
            "exerciseId": "lg01",
            "name": "Agachamento com Peso Corporal (Air Squat)",
            "sets": 3,
            "reps": "15-20",
            "rpe": 7,
            "rest": 45
          },
          {
            "exerciseId": "pe18",
            "name": "Flexão de Braço Apoiada no Banco",
            "sets": 3,
            "reps": "10-12",
            "rpe": 7,
            "rest": 45
          },
          {
            "exerciseId": "lg08",
            "name": "Passos no Step ou Marcha Estacionária",
            "sets": 3,
            "reps": "2 min",
            "rpe": 7,
            "rest": 45
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C — Intervalado Aeróbio Moderado (Z3)",
        "exercises": [
          {
            "exerciseId": "hy04",
            "name": "Intervalos Moderados na Esteira ou Bicicleta",
            "sets": 6,
            "reps": "2 min Z3 / 1 min leve",
            "rpe": 7.5,
            "rest": 60
          }
        ]
      }
    ]
  },
  "PHAT": {
    "id": "PHAT",
    "name": "PHAT — Power Hypertrophy Adaptive Training",
    "category": "Musculação Tradicional",
    "daysCount": 5,
    "description": "Protocolo Layne Norton: 2 dias de força pesada (Upper/Lower Power) + 3 dias de hipertrofia com foco em tensão e velocidade.",
    "badge": "★ Power/Hyp",
    "icon": "⚡💥",
    "routines": [
      {
        "id": "A",
        "name": "Treino A · Push A (Força Mecânica e Potência)",
        "exercises": [
          {
            "exerciseId": "pe01",
            "name": "Supino Reto com Barra",
            "sets": 4,
            "reps": "5-7",
            "rpe": 8,
            "rest": 150,
            "obs": "Pausa controlada de 1s no esterno · arco torácico firme.",
            "cadence": "3-0-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "sh01",
            "name": "Desenvolvimento Militar em Pé com Barra",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 120,
            "obs": "Core travado e cotovelos apontados à frente.",
            "cadence": "3-0-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "pe05",
            "name": "Supino Inclinado com Halteres",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Halteres ampliam ADM · foco no feixe clavicular.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "pe19",
            "name": "Paralelas (Dips) com Sobrepesa",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Tronco inclinado 30° à frente · foco peitoral inferior.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "sh06",
            "name": "Elevação Lateral com Halteres",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60,
            "obs": "Pico de torque a 90° com 1s de isometria.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "tr04",
            "name": "Tríceps Testa com Barra W na Prancha",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 75,
            "obs": "Cabeça longa em máximo alongamento.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B · Pull A (Tração e Força Escapular)",
        "exercises": [
          {
            "exerciseId": "do16",
            "name": "Levantamento Terra Convencional",
            "sets": 4,
            "reps": "4-6",
            "rpe": 8,
            "rest": 180,
            "obs": "Tração neural máxima · coluna rigorosamente neutra.",
            "cadence": "3-0-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "do01",
            "name": "Barra Fixa (Weighted Pull-up)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 120,
            "obs": "Hang completo no fundo · latíssimo em máx. comprimento.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "do08",
            "name": "Remada Curvada com Barra (Pegada Pronada)",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Retração escapular estrita para romboides e trapézio.",
            "cadence": "3-0-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "do11",
            "name": "Remada Unilateral com Halter (Serrote)",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 75,
            "obs": "Alongamento máximo da dorsal na posição inferior.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "sh21",
            "name": "Crucifixo Invertido na Polia Alta",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60,
            "obs": "Isolamento de deltoide posterior com tensão contínua.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "bi01",
            "name": "Rosca Direta com Barra Reta",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 75,
            "obs": "Supinação completa sem balanço lombar.",
            "cadence": "3-1-1-0",
            "resistProfile": "uniform"
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C · Legs A (Dominância de Joelho e Potência)",
        "exercises": [
          {
            "exerciseId": "lg01",
            "name": "Agachamento Livre com Barra High Bar",
            "sets": 4,
            "reps": "5-7",
            "rpe": 8,
            "rest": 150,
            "obs": "Excêntrica controlada de 3s protege tendão patelar.",
            "cadence": "3-0-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "lg04",
            "name": "Leg Press 45°",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Amplitude máxima (joelhos > 90°) sem retroversão.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "lg25",
            "name": "Afundo Deslocado com Halteres",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 90,
            "obs": "Passada firme com estabilidade de joelho.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "lg06",
            "name": "Cadeira Extensora",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60,
            "obs": "Pico de EMG no encurtamento do reto femoral.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "lg20",
            "name": "Gêmeos em Pé na Máquina",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60,
            "obs": "Gastrocnêmio em máximo comprimento com 1s pausa.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "ab02",
            "name": "Abdominal Supra na Polia com Carga",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60,
            "obs": "Carga progressiva no reto abdominal.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          }
        ]
      },
      {
        "id": "D",
        "name": "Treino D · Push B (Hipertrofia e Densidade)",
        "exercises": [
          {
            "exerciseId": "pe02",
            "name": "Supino Inclinado com Barra",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 120,
            "obs": "Barra desce até a clavícula · foco feixe superior.",
            "cadence": "3-0-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "pe04",
            "name": "Supino Reto com Halteres",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Maior amplitude e adução no pico concêntrico.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "sh02",
            "name": "Desenvolvimento Seletivo com Halteres (Sentado)",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Trajetória convergente sem travar cotovelos.",
            "cadence": "3-0-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "pe11",
            "name": "Crossover na Polia Média",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60,
            "obs": "Tensão contínua esternal com 1s no pico.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "sh07",
            "name": "Elevação Lateral na Polia Baixa (Unilateral)",
            "sets": 4,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60,
            "obs": "Tensão do cabo desde o início da abdução.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "tr02",
            "name": "Tríceps Pulley com Corda",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60,
            "obs": "Abertura no final ativa cabeça lateral e medial.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          }
        ]
      },
      {
        "id": "E",
        "name": "Treino E · Pull B (Espessura e Cadeia Posterior)",
        "exercises": [
          {
            "exerciseId": "do04",
            "name": "Puxada Alta Articulada ou Polia (Pegada Neutra)",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Fibras superiores do latíssimo no maior comprimento.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "do10",
            "name": "Remada T-Bar (Cavalo) com Apoio",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Sem estresse lombar · retração escapular pesada.",
            "cadence": "3-0-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "do12",
            "name": "Remada Baixa no Cabo com Puxador Triângulo",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 75,
            "obs": "Pico de contração nos romboides e dorsal.",
            "cadence": "3-0-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "sh15",
            "name": "Face Pull no Cabo com Corda",
            "sets": 4,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60,
            "obs": "Deltoide posterior e manguito rotador.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "bi09",
            "name": "Rosca Alternada com Halteres no Banco Inclinado",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 75,
            "obs": "Cabeça longa do bíceps no comprimento máximo.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "bi05",
            "name": "Rosca Martelo na Polia Baixa com Corda",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60,
            "obs": "Braquiorradial e braquial em tensão contínua.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          }
        ]
      },
      {
        "id": "F",
        "name": "Treino F · Legs B (Dominância de Quadril e Estabilidade)",
        "exercises": [
          {
            "exerciseId": "lg10",
            "name": "Stiff com Barra",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 120,
            "obs": "Pico de tensão passiva dos isquiotibiais.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "lg07",
            "name": "Agachamento Búlgaro com Halteres",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Glúteo máximo e quadríceps unilateral.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "lg12",
            "name": "Mesa Flexora",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8,
            "rest": 75,
            "obs": "Isquiotibiais com 1s de isometria no pico.",
            "cadence": "3-1-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "lg15",
            "name": "Elevação Pélvica com Barra",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Glúteo máximo no pico de contração.",
            "cadence": "3-0-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "lg22",
            "name": "Gêmeos No Leg Press",
            "sets": 4,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60,
            "obs": "Gastrocnêmio & sóleo com ADM completa.",
            "cadence": "3-1-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "ab06",
            "name": "Prancha Isométrica com Sobrecarga",
            "sets": 3,
            "reps": "45-60s",
            "rpe": 8,
            "rest": 60,
            "obs": "Estabilização do transverso abdominal.",
            "cadence": "3-1-1-0",
            "resistProfile": "uniform"
          }
        ]
      }
    ]
  },
  "DUP": {
    "id": "DUP",
    "name": "DUP — Periodização Ondulatória Diária",
    "category": "Musculação Tradicional",
    "daysCount": 3,
    "description": "Variação diária ondulatória de zonas de repetição e intensidade (Força / Hipertrofia / Resistência Muscular).",
    "badge": "★ Ondulatória",
    "icon": "📈",
    "routines": [
      {
        "id": "A",
        "name": "Treino A · Dia Neural (Força & Tensão Miofibrilar)",
        "exercises": [
          {
            "exerciseId": "pe01",
            "name": "Supino Reto com Barra",
            "sets": 5,
            "reps": "3-5",
            "rpe": 9,
            "rest": 180,
            "obs": "Excêntrica de 4s · restauração neuroquímica total.",
            "cadence": "4-0-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "lg01",
            "name": "Agachamento Livre com Barra (Back Squat)",
            "sets": 5,
            "reps": "3-5",
            "rpe": 9,
            "rest": 180,
            "obs": "Proteção de LCA/patela · base sólida.",
            "cadence": "4-0-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "do08",
            "name": "Remada Curvada com Barra (Pronada)",
            "sets": 5,
            "reps": "4-6",
            "rpe": 9,
            "rest": 150,
            "obs": "Retração escapular estrita para romboides.",
            "cadence": "4-0-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "sh01",
            "name": "Desenvolvimento Militar em Pé (OHP)",
            "sets": 4,
            "reps": "4-6",
            "rpe": 8.5,
            "rest": 150,
            "obs": "Core blindado e glúteos contraídos.",
            "cadence": "3-0-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "ab05",
            "name": "Abdominal Rollout (Roda Abdominal)",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Estabilidade anti-extensão do core.",
            "cadence": "3-0-2-0",
            "resistProfile": "stretched"
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B · Dia Hipertrófico (Tensão Contínua & ADM Máxima)",
        "exercises": [
          {
            "exerciseId": "pe05",
            "name": "Supino Inclinado com Halteres",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Halteres ampliam ADM no feixe clavicular.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "lg10",
            "name": "Stiff com Barra (Terra Romeno)",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Pico de tensão passiva dos isquiotibiais.",
            "cadence": "4-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "do04",
            "name": "Puxada Frontal Aberta na Polia",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Latíssimo no comprimento máximo.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "lg03",
            "name": "Agachamento Hack (Máquina)",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Maior ADM de coxa sem carga axial.",
            "cadence": "4-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "sh09",
            "name": "Elevação Lateral Inclinada no Banco 45°",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Deltoide medial em máximo comprimento.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "bi09",
            "name": "Rosca Inclinada no Banco 45°",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 60,
            "obs": "Cabeça longa do bíceps no comprimento máximo.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "tr06",
            "name": "Tríceps Francês com Halter",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 60,
            "obs": "Ombro em flexão >90° alonga a cabeça longa.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C · Dia Metabólico & Potência (Pump & Densidade)",
        "exercises": [
          {
            "exerciseId": "pe13",
            "name": "Peck Deck / Voador (Máquina)",
            "sets": 4,
            "reps": "12-15",
            "rpe": 9,
            "rest": 45,
            "obs": "Pico na adução máxima com 1s ISO.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "lg06",
            "name": "Cadeira Extensora",
            "sets": 4,
            "reps": "12-15",
            "rpe": 9,
            "rest": 45,
            "obs": "Máxima ativação no topo com 1s ISO.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "do07",
            "name": "Pulldown na Polia com Braços Retos",
            "sets": 4,
            "reps": "12-15",
            "rpe": 9,
            "rest": 45,
            "obs": "Extensão de ombro com 1s ISO no quadril.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "lg13",
            "name": "Cadeira Flexora Sentada",
            "sets": 4,
            "reps": "12-15",
            "rpe": 9,
            "rest": 45,
            "obs": "Isquiotibiais encurtados · par do Stiff.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "sh06",
            "name": "Elevação Lateral com Halteres",
            "sets": 4,
            "reps": "12-15",
            "rpe": 9,
            "rest": 45,
            "obs": "Pico a 90° com 1s ISO no topo.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "bi06",
            "name": "Rosca Scott com Barra W",
            "sets": 3,
            "reps": "12-15",
            "rpe": 9,
            "rest": 45,
            "obs": "Pico no encurtamento do bíceps.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "tr01",
            "name": "Tríceps na Polia com Barra Reta",
            "sets": 3,
            "reps": "12-15",
            "rpe": 9,
            "rest": 45,
            "obs": "Extensão terminal com 1s ISO.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "lg21",
            "name": "Panturrilha Sentado (Gêmeos / Sóleo)",
            "sets": 4,
            "reps": "15-20",
            "rpe": 9,
            "rest": 45,
            "obs": "Sóleo isolado no encurtamento.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          }
        ]
      }
    ]
  },
  "ABCD": {
    "id": "ABCD",
    "name": "ABCD — 4 Dias de Hipertrofia",
    "category": "Musculação Tradicional",
    "daysCount": 4,
    "description": "Divisão clássica em 4 dias com excelente recuperação semanal por segmento corporal.",
    "badge": "Tradicional",
    "icon": "🏋️‍♂️",
    "routines": [
      {
        "id": "A",
        "name": "Treino A · Peitoral, Tríceps & Reto Abdominal",
        "exercises": [
          {
            "exerciseId": "pe01",
            "name": "Supino Reto com Barra",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 120,
            "obs": "Pico no encurtamento com arco torácico firme.",
            "cadence": "3-0-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "pe05",
            "name": "Supino Inclinado com Halteres",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Feixe clavicular com ADM ampliada.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "pe10",
            "name": "Crossover no Cabo (Polia Alta)",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60,
            "obs": "Peitoral em máximo comprimento (Stretched).",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "pe13",
            "name": "Peck Deck / Voador (Máquina)",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Pico na adução máxima à frente com 1s ISO.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "tr06",
            "name": "Tríceps Francês com Halter",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60,
            "obs": "Cabeça longa em máximo comprimento.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "tr01",
            "name": "Tríceps na Polia com Barra Reta",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Pico de EMG no encurtamento · 1s ISO.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "ab02",
            "name": "Abdominal na Polia Alta com Corda",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60,
            "obs": "Carga progressiva no reto abdominal.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B · Dorsal, Trapézio, Bíceps & Abdômen Infra",
        "exercises": [
          {
            "exerciseId": "do01",
            "name": "Barra Fixa Pronada (Pull-up)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 120,
            "obs": "Hang completo no fundo · tração vertical potente.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "do08",
            "name": "Remada Curvada com Barra (Pronada)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 90,
            "obs": "Retração escapular para romboides.",
            "cadence": "3-0-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "do04",
            "name": "Puxada Frontal Aberta na Polia",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Latíssimo no comprimento máximo.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "do07",
            "name": "Pulldown na Polia com Braços Retos",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Extensão de ombro com 1s ISO no quadril.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "sh18",
            "name": "Encolhimento com Barra (Shrug)",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60,
            "obs": "Pico do trapézio superior no encurtamento.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "bi09",
            "name": "Rosca Inclinada no Banco 45°",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 60,
            "obs": "Cabeça longa do bíceps no comprimento máximo.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "bi06",
            "name": "Rosca Scott com Barra W",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Pico de contração no topo com 1s ISO.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "ab03",
            "name": "Elevação de Pernas na Barra Fixa",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60,
            "obs": "Core no comprimento máximo.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C · Membros Inferiores Completo & Core",
        "exercises": [
          {
            "exerciseId": "lg01",
            "name": "Agachamento Livre com Barra (Back Squat)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 150,
            "obs": "Excêntrica de 4s protege LCA e tendão patelar.",
            "cadence": "4-0-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "lg10",
            "name": "Stiff com Barra (Terra Romeno)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 120,
            "obs": "Pico de tensão passiva dos isquiotibiais.",
            "cadence": "4-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "lg04",
            "name": "Leg Press 45°",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Amplitude máxima sem retroversão.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "lg06",
            "name": "Cadeira Extensora",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Pico de ativação no encurtamento.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "lg13",
            "name": "Cadeira Flexora Sentada",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Isquiotibiais encurtados · par do Stiff.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "lg20",
            "name": "Panturrilha em Pé na Máquina",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Gastrocnêmio em máximo comprimento.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "ab05",
            "name": "Abdominal Rollout (Roda Abdominal)",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60,
            "obs": "Core no comprimento máximo.",
            "cadence": "3-0-2-0",
            "resistProfile": "stretched"
          }
        ]
      },
      {
        "id": "D",
        "name": "Treino D · Deltoides Completo & Oblíquos 3D",
        "exercises": [
          {
            "exerciseId": "sh01",
            "name": "Desenvolvimento Militar em Pé (OHP)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 120,
            "obs": "Core blindado e glúteos contraídos.",
            "cadence": "3-0-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "sh09",
            "name": "Elevação Lateral Inclinada no Banco 45°",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Deltoide medial em máximo comprimento.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "sh06",
            "name": "Elevação Lateral com Halteres",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 45,
            "obs": "Pico a 90° com 1s ISO no topo.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "sh15",
            "name": "Face Pull na Polia com Corda",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8.5,
            "rest": 45,
            "obs": "Deltoide posterior + manguito rotador.",
            "cadence": "2-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "sh13",
            "name": "Crucifixo Inverso com Halteres",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8,
            "rest": 45,
            "obs": "Tronco inclinado com cotovelos abertos.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "ab07",
            "name": "Russian Twist com Halter ou Anilha",
            "sets": 3,
            "reps": "20 reps",
            "rpe": 7.5,
            "rest": 45,
            "obs": "Rotação controlada com estabilidade pélvica.",
            "cadence": "2-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "ab04",
            "name": "Elevação de Pernas na Paralela (Capitão)",
            "sets": 3,
            "reps": "12-15",
            "rpe": 7.5,
            "rest": 60,
            "obs": "Enrolamento pélvico sem impulsos.",
            "cadence": "3-0-1-0",
            "resistProfile": "shortened"
          }
        ]
      }
    ]
  },
  "ABCDE": {
    "id": "ABCDE",
    "name": "ABCDE — Bro Split Isolado",
    "category": "Musculação Tradicional",
    "daysCount": 5,
    "description": "Alto volume por grupamento muscular em sessão única (Peitoral, Costas, Pernas, Ombros, Braços).",
    "badge": "Bro Split",
    "icon": "🏛️",
    "routines": [
      {
        "id": "A",
        "name": "Treino A · Peitoral & Reto Abdominal",
        "exercises": [
          {
            "exerciseId": "pe01",
            "name": "Supino Reto com Barra",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 120,
            "obs": "Pausa de 1s no peito · arco torácico firme.",
            "cadence": "3-0-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "pe05",
            "name": "Supino Inclinado com Halteres",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Feixe clavicular com ADM ampliada.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "pe07",
            "name": "Crucifixo Reto com Halteres",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Pico a 90° de abdução com 1s pausa no fundo.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "pe13",
            "name": "Peck Deck / Voador (Máquina)",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Pico na adução máxima à frente com 1s ISO.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "ab02",
            "name": "Abdominal na Polia Alta com Corda",
            "sets": 4,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60,
            "obs": "Carga progressiva no reto abdominal.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B · Dorsal, Lombar & Infra",
        "exercises": [
          {
            "exerciseId": "do01",
            "name": "Barra Fixa Pronada (Pull-up)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 120,
            "obs": "Hang completo no fundo · tração vertical potente.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "do08",
            "name": "Remada Curvada com Barra (Pronada)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 90,
            "obs": "Retração escapular para romboides.",
            "cadence": "3-0-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "do04",
            "name": "Puxada Frontal Aberta na Polia",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Latíssimo no comprimento máximo.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "do07",
            "name": "Pulldown na Polia com Braços Retos",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Extensão de ombro com 1s ISO no quadril.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "sh18",
            "name": "Encolhimento com Barra (Shrug)",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60,
            "obs": "Pico do trapézio superior no encurtamento.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "ab03",
            "name": "Elevação de Pernas na Barra Fixa",
            "sets": 3,
            "reps": "12-15",
            "rpe": 8,
            "rest": 60,
            "obs": "Core no comprimento máximo.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C · Membros Inferiores Completo",
        "exercises": [
          {
            "exerciseId": "lg01",
            "name": "Agachamento Livre com Barra (Back Squat)",
            "sets": 5,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 150,
            "obs": "Excêntrica de 4s protege LCA e tendão patelar.",
            "cadence": "4-0-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "lg10",
            "name": "Stiff com Barra (Terra Romeno)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8.5,
            "rest": 120,
            "obs": "Pico de tensão passiva dos isquiotibiais.",
            "cadence": "4-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "lg03",
            "name": "Agachamento Hack (Máquina)",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 90,
            "obs": "Maior ADM sem sobrecarga axial lombar.",
            "cadence": "4-0-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "lg06",
            "name": "Cadeira Extensora",
            "sets": 4,
            "reps": "12-15",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Pico de ativação no encurtamento total.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "lg13",
            "name": "Cadeira Flexora Sentada",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Isquiotibiais encurtados · par do Stiff.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "lg20",
            "name": "Panturrilha em Pé na Máquina",
            "sets": 5,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Gastrocnêmio em máximo comprimento.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          }
        ]
      },
      {
        "id": "D",
        "name": "Treino D · Deltoides, Trapézio & Oblíquos",
        "exercises": [
          {
            "exerciseId": "sh01",
            "name": "Desenvolvimento Militar em Pé (OHP)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 120,
            "obs": "Core blindado e glúteos contraídos.",
            "cadence": "3-0-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "sh09",
            "name": "Elevação Lateral Inclinada no Banco 45°",
            "sets": 5,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Deltoide medial em máximo comprimento.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "sh06",
            "name": "Elevação Lateral com Halteres",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 45,
            "obs": "Pico a 90° com 1s ISO no topo.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "sh15",
            "name": "Face Pull na Polia com Corda",
            "sets": 4,
            "reps": "12-15",
            "rpe": 8.5,
            "rest": 45,
            "obs": "Deltoide posterior + manguito rotador.",
            "cadence": "2-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "sh18",
            "name": "Encolhimento com Barra (Shrug)",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60,
            "obs": "Pico do trapézio superior no encurtamento.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "ab07",
            "name": "Russian Twist com Halter ou Anilha",
            "sets": 3,
            "reps": "20 reps",
            "rpe": 7.5,
            "rest": 45,
            "obs": "Rotação controlada com estabilidade pélvica.",
            "cadence": "2-0-1-0",
            "resistProfile": "stretched"
          }
        ]
      },
      {
        "id": "E",
        "name": "Treino E · Braços Completos & Rollout",
        "exercises": [
          {
            "exerciseId": "bi01",
            "name": "Rosca Direta com Barra Reta",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 75,
            "obs": "Flexão pura de cotovelo sem impulso lombar.",
            "cadence": "3-0-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "tr04",
            "name": "Tríceps Testa com Barra W (Skull Crusher)",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8,
            "rest": 75,
            "obs": "Cabeça longa em máximo estiramento.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "bi09",
            "name": "Rosca Inclinada no Banco 45°",
            "sets": 3,
            "reps": "8-10",
            "rpe": 8,
            "rest": 60,
            "obs": "Cabeça longa do bíceps no comprimento máximo.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "tr06",
            "name": "Tríceps Francês com Halter",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60,
            "obs": "Ombro em flexão >90° alonga a cabeça longa.",
            "cadence": "3-1-1-0",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "bi06",
            "name": "Rosca Scott com Barra W",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Pico de contração no topo com 1s ISO.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "tr01",
            "name": "Tríceps na Polia com Barra Reta",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Pico de EMG no encurtamento com 1s ISO.",
            "cadence": "3-1-1-0",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "ab05",
            "name": "Abdominal Rollout (Roda Abdominal)",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60,
            "obs": "Core no comprimento máximo.",
            "cadence": "3-0-2-0",
            "resistProfile": "stretched"
          }
        ]
      }
    ]
  },
  "Metcon": {
    "id": "Metcon",
    "name": "Metcon Híbrido / Condicionamento",
    "category": "Híbrida & Racing",
    "daysCount": 3,
    "description": "Condicionamento metabólico com blocos de força funcional e estações ergométricas.",
    "badge": "★ Metabólico",
    "icon": "🔥",
    "routines": [
      {
        "id": "A",
        "name": "Treino A · Metcon Força & Potência Anaeróbia (EMOM)",
        "exercises": [
          {
            "exerciseId": "do16",
            "name": "Levantamento Terra Convencional / Trap Bar",
            "sets": 4,
            "reps": "5 reps",
            "rpe": 8.5,
            "rest": 90,
            "obs": "Força de tração máxima em bloco metabólico com saída explosiva.",
            "cadence": "Potente",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "sh01",
            "name": "Desenvolvimento Militar (Push Press / OHP)",
            "sets": 4,
            "reps": "6-8",
            "rpe": 8,
            "rest": 60,
            "obs": "Potência de ombro e estabilização de core sob fadiga.",
            "cadence": "Explosivo",
            "resistProfile": "shortened"
          },
          {
            "exerciseId": "lg01",
            "name": "AirBike / Echo Bike (Sprints de 30s)",
            "sets": 5,
            "reps": "30s tiros",
            "rpe": 9,
            "rest": 60,
            "obs": "Pico de potência anaeróbia e produção rápida de lactato.",
            "cadence": "Máx Watts",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "lg08",
            "name": "Box Jump na Caixa (60cm) ou Salto Pliométrico",
            "sets": 4,
            "reps": "8 saltos",
            "rpe": 8,
            "rest": 60,
            "obs": "Ciclo alongamento-encurtamento com absorção suave de impacto.",
            "cadence": "Pliométrico",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "ab06",
            "name": "Prancha Isométrica com Carga ou Hollow Body",
            "sets": 3,
            "reps": "45s",
            "rpe": 8,
            "rest": 45,
            "obs": "Anti-extensão lombar rígida sob frequência cardíaca elevada.",
            "cadence": "Isometria",
            "resistProfile": "shortened"
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B · Metcon Glicolítico & Densidade (AMRAP)",
        "exercises": [
          {
            "exerciseId": "do01",
            "name": "Barra Fixa Estrita ou Kipping (Pull-up)",
            "sets": 4,
            "reps": "8-10",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Tração vertical ritmada com amplitude escapular completa.",
            "cadence": "Ritmo",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "pe19",
            "name": "Mergulho em Paralelas (Dips) ou Flexões no Solo",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8,
            "rest": 60,
            "obs": "Empurrada contínua mantendo cotovelos alinhados.",
            "cadence": "2-0-1-0",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "do01",
            "name": "Remo Concept2 RowErg (Tiros de 250m)",
            "sets": 5,
            "reps": "250m sprint",
            "rpe": 9,
            "rest": 60,
            "obs": "Depleção glicogênica e capacidade de tamponamento muscular.",
            "cadence": "Ritmo 28s/m",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "lg10",
            "name": "Kettlebell Swing Americano / Russo",
            "sets": 4,
            "reps": "15-20",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Extensão potente de quadril e ativação de glúteos.",
            "cadence": "Explosivo",
            "resistProfile": "stretched"
          },
          {
            "exerciseId": "ab03",
            "name": "Toes-to-Bar ou Elevação de Pernas Suspenso",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8,
            "rest": 45,
            "obs": "Flexão de tronco e força de pegada (grip) sustentada.",
            "cadence": "Controlado",
            "resistProfile": "stretched"
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C · Metcon Chipper & Resistência Mista (For Time)",
        "exercises": [
          {
            "exerciseId": "lg01",
            "name": "Thrusters com Barra / Halteres (Agachamento + Press)",
            "sets": 4,
            "reps": "10-12",
            "rpe": 8.5,
            "rest": 90,
            "obs": "Composto multiarticular exigindo capacidade cardiovascular extrema.",
            "cadence": "Fluido",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "lg07",
            "name": "Burpees com Salto sobre a Barra",
            "sets": 4,
            "reps": "12-15",
            "rpe": 8.5,
            "rest": 60,
            "obs": "Movimento corporal dinâmico contínuo sem pausas longas.",
            "cadence": "Constante",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "sh18",
            "name": "Farmers Carry com Halteres / Kettlebells Pesados",
            "sets": 4,
            "reps": "50m",
            "rpe": 8.5,
            "rest": 90,
            "obs": "Transporte de carga sustentada sob respiração ofegante.",
            "cadence": "Passo Firme",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "lg01",
            "name": "Wall Balls com Medicine Ball (6/9kg)",
            "sets": 4,
            "reps": "20 reps",
            "rpe": 9,
            "rest": 60,
            "obs": "Agachamento completo e arremesso preciso no alvo de 3 metros.",
            "cadence": "Fluido",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "ab05",
            "name": "Abdominal Rollout na Roda ou Prancha Lateral",
            "sets": 3,
            "reps": "10-12",
            "rpe": 8,
            "rest": 45,
            "obs": "Estabilização profunda de core para recuperação do SNC.",
            "cadence": "3-0-1-0",
            "resistProfile": "stretched"
          }
        ]
      }
    ]
  },
  "Sedentario": {
    "id": "Sedentario",
    "name": "Sedentário & Readaptação Gradual",
    "category": "Readaptação",
    "daysCount": 3,
    "description": "Reintrodução suave ao exercício físico com foco em ativação postural, mobilidade articular e prevenção de lesões.",
    "badge": "Readaptação",
    "icon": "🌱",
    "routines": [
      {
        "id": "A",
        "name": "Treino A · Reativação Neuromotora Leve",
        "exercises": [
          {
            "exerciseId": "sed_01",
            "name": "Caminhada Contínua Leve em Ritmo Confortável (Z1)",
            "sets": 1,
            "reps": "15-20 min",
            "rpe": 4,
            "rest": 60,
            "obs": "Ritmo conversacional leve sem falta de ar.",
            "cadence": "Confortável",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "sed_02",
            "name": "Mobilidade Articular de Tornozelos e Quadril",
            "sets": 2,
            "reps": "10 cada lado",
            "rpe": 3.5,
            "rest": 30,
            "obs": "Movimentos suaves e sem dor articular.",
            "cadence": "Fluido",
            "resistProfile": "bodyweight"
          },
          {
            "exerciseId": "sed_03",
            "name": "Sentar e Levantar da Cadeira com Apoio",
            "sets": 2,
            "reps": "8-10",
            "rpe": 4.5,
            "rest": 60,
            "obs": "Manter a postura ereta ao subir e descer.",
            "cadence": "Controlado",
            "resistProfile": "bodyweight"
          },
          {
            "exerciseId": "sed_04",
            "name": "Alongamento Suave de Peitoral e Coluna Torácica",
            "sets": 2,
            "reps": "30s sustentação",
            "rpe": 3,
            "rest": 30,
            "obs": "Alívio da tensão postural sentada prolongada.",
            "cadence": "Estático",
            "resistProfile": "bodyweight"
          }
        ]
      },
      {
        "id": "B",
        "name": "Treino B · Estabilidade & Postura Básica",
        "exercises": [
          {
            "exerciseId": "sed_05",
            "name": "Caminhada Estacionária com Elevação Suave dos Joelhos",
            "sets": 3,
            "reps": "2 min",
            "rpe": 4,
            "rest": 60,
            "obs": "Ativação cardiovascular segura em casa ou consultório.",
            "cadence": "Cadenciado",
            "resistProfile": "bodyweight"
          },
          {
            "exerciseId": "sed_06",
            "name": "Ponte de Glúteos no Solo / Colchonete",
            "sets": 2,
            "reps": "8-10",
            "rpe": 4,
            "rest": 45,
            "obs": "Despertar dos glúteos e estabilização pélvica.",
            "cadence": "2-1-2-0",
            "resistProfile": "bodyweight"
          },
          {
            "exerciseId": "sed_07",
            "name": "Flexão de Braços na Parede (Wall Push-up)",
            "sets": 2,
            "reps": "8-10",
            "rpe": 4,
            "rest": 60,
            "obs": "Carga reduzida protegendo cotovelos e ombros.",
            "cadence": "2-1-2-0",
            "resistProfile": "bodyweight"
          },
          {
            "exerciseId": "sed_08",
            "name": "Exercício de Respiração Diafragmática & Relaxamento",
            "sets": 1,
            "reps": "5 min",
            "rpe": 2,
            "rest": 60,
            "obs": "Controle autonômico e redução do estresse basal.",
            "cadence": "Profundo",
            "resistProfile": "bodyweight"
          }
        ]
      },
      {
        "id": "C",
        "name": "Treino C · Resistência Muscular Funcional",
        "exercises": [
          {
            "exerciseId": "sed_09",
            "name": "Caminhada Leve com Mudanças Sutis de Ritmo",
            "sets": 1,
            "reps": "20 min",
            "rpe": 4.5,
            "rest": 60,
            "obs": "Caminhada contínua em terreno plano.",
            "cadence": "Livre",
            "resistProfile": "uniform"
          },
          {
            "exerciseId": "sed_10",
            "name": "Remada com Elástico Leve ou Toalha",
            "sets": 2,
            "reps": "10-12",
            "rpe": 4,
            "rest": 45,
            "obs": "Ativação dos romboides e postura do tronco.",
            "cadence": "Controlado",
            "resistProfile": "band"
          },
          {
            "exerciseId": "sed_11",
            "name": "Elevação de Calcanhares em Pé com Apoio (Panturrilhas)",
            "sets": 2,
            "reps": "12-15",
            "rpe": 4,
            "rest": 45,
            "obs": "Estímulo da bomba muscular da panturrilha para retorno venoso.",
            "cadence": "2-1-1-0",
            "resistProfile": "bodyweight"
          },
          {
            "exerciseId": "sed_12",
            "name": "Meta Diária de Passos Confortáveis (NEAT)",
            "sets": 1,
            "reps": "4.000 a 6.000 passos",
            "rpe": 3,
            "rest": 60,
            "obs": "Incentivo à movimentação espontânea diária.",
            "cadence": "Livre",
            "resistProfile": "daily"
          }
        ]
      }
    ]
  }
});

  /**
   * Mapa direto de rotinas (compatibilidade com PERF_SPLIT_PRESETS do app.js)
   */
  const PERF_SPLIT_PRESETS = Object.freeze({
  "HYROX": [
    {
      "id": "A",
      "name": "Treino A — Ergômetros & Potência Aeróbica (HYROX)",
      "exercises": [
        {
          "exerciseId": "hy01",
          "name": "SkiErg Concept2 (Intervalos de Potência)",
          "sets": 5,
          "reps": "500m",
          "rpe": 8.5,
          "rest": 90
        },
        {
          "exerciseId": "hy02",
          "name": "Remo Concept2 RowErg (Capacidade Aeróbica)",
          "sets": 4,
          "reps": "750m",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "hy03",
          "name": "AirBike / Echo Bike / CycleAir",
          "sets": 4,
          "reps": "1 min",
          "rpe": 9,
          "rest": 120
        },
        {
          "exerciseId": "hy04",
          "name": "Tiros de Velocidade na Esteira (Sprints)",
          "sets": 5,
          "reps": "400m",
          "rpe": 8.5,
          "rest": 60
        },
        {
          "exerciseId": "ab06",
          "name": "Prancha Isométrica no Solo (Plank)",
          "sets": 4,
          "reps": "45s",
          "rpe": 8,
          "rest": 45
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Força Funcional & Estações HYROX",
      "exercises": [
        {
          "exerciseId": "hy06",
          "name": "Sled Push (Empurrar Trenó com Carga)",
          "sets": 4,
          "reps": "20m",
          "rpe": 9,
          "rest": 120
        },
        {
          "exerciseId": "hy07",
          "name": "Sled Pull (Puxar Trenó com Corda)",
          "sets": 4,
          "reps": "20m",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "hy08",
          "name": "Burpee Broad Jumps (Salto em Extensão)",
          "sets": 4,
          "reps": "15 reps",
          "rpe": 8.5,
          "rest": 90
        },
        {
          "exerciseId": "hy09",
          "name": "Sandbag Walking Lunges (Passada com Saco)",
          "sets": 4,
          "reps": "20 passos",
          "rpe": 8.5,
          "rest": 90
        },
        {
          "exerciseId": "hy10",
          "name": "Farmers Carry com Halteres / Kettlebells",
          "sets": 4,
          "reps": "50m",
          "rpe": 8.5,
          "rest": 90
        },
        {
          "exerciseId": "hy11",
          "name": "Wall Balls com Medicine Ball (6/9kg)",
          "sets": 4,
          "reps": "20 reps",
          "rpe": 9,
          "rest": 60
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Concorrente & Simulação de Prova",
      "exercises": [
        {
          "exerciseId": "hy05",
          "name": "Corrida Contínua na Esteira (Ritmo Z3/Z4)",
          "sets": 1,
          "reps": "1000m",
          "rpe": 7,
          "rest": 60
        },
        {
          "exerciseId": "hy02",
          "name": "Remo Concept2 RowErg (Capacidade Aeróbica)",
          "sets": 4,
          "reps": "500m",
          "rpe": 8.5,
          "rest": 90
        },
        {
          "exerciseId": "hy01",
          "name": "SkiErg Concept2 (Intervalos de Potência)",
          "sets": 4,
          "reps": "500m",
          "rpe": 8.5,
          "rest": 90
        },
        {
          "exerciseId": "hy11",
          "name": "Wall Balls com Medicine Ball (6/9kg)",
          "sets": 4,
          "reps": "15 reps",
          "rpe": 8.5,
          "rest": 60
        },
        {
          "exerciseId": "hy10",
          "name": "Farmers Carry com Halteres / Kettlebells",
          "sets": 3,
          "reps": "40m",
          "rpe": 8,
          "rest": 60
        }
      ]
    }
  ],
  "CrossFit": [
    {
      "id": "A",
      "name": "Treino A — Força Básica & LPO",
      "exercises": [
        {
          "exerciseId": "do16",
          "name": "Levantamento Terra Convencional (Deadlift)",
          "sets": 5,
          "reps": "3-5",
          "rpe": 8.5,
          "rest": 150
        },
        {
          "exerciseId": "lg02",
          "name": "Agachamento Frontal com Barra (Front Squat)",
          "sets": 4,
          "reps": "4-6",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "sh01",
          "name": "Desenvolvimento Militar em Pé (Overhead)",
          "sets": 4,
          "reps": "5-6",
          "rpe": 8,
          "rest": 90
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Metcon Glicolítico & Ginástica",
      "exercises": [
        {
          "exerciseId": "do01",
          "name": "Barra Fixa Pronada (Pull-up)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 90
        },
        {
          "exerciseId": "pe19",
          "name": "Mergulho em Paralelas (Foco Peitoral)",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "hy12",
          "name": "Thrusters com Barra (Agachamento + Press)",
          "sets": 4,
          "reps": "12-15",
          "rpe": 9,
          "rest": 90
        },
        {
          "exerciseId": "ab03",
          "name": "Elevação de Pernas na Barra Fixa (Hanging Leg Raise)",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Resistência Metabólica Mista (WOD)",
      "exercises": [
        {
          "exerciseId": "hy14",
          "name": "Kettlebell Swing Americano",
          "sets": 4,
          "reps": "15-20",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "hy13",
          "name": "Box Jump na Caixa (60cm)",
          "sets": 4,
          "reps": "12 reps",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "hy02",
          "name": "Remo Concept2 RowErg (Capacidade Aeróbica)",
          "sets": 4,
          "reps": "20 cal",
          "rpe": 9,
          "rest": 60
        }
      ]
    }
  ],
  "RunningStrength": [
    {
      "id": "A",
      "name": "Treino A — Upper Força + Tiros na Esteira",
      "exercises": [
        {
          "exerciseId": "pe01",
          "name": "Supino Reto com Barra",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 120
        },
        {
          "exerciseId": "do08",
          "name": "Remada Curvada com Barra (Pronada)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "sh01",
          "name": "Desenvolvimento Militar em Pé (Overhead)",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "hy04",
          "name": "Tiros de Velocidade na Esteira (Sprints)",
          "sets": 8,
          "reps": "200m",
          "rpe": 9,
          "rest": 45
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Lower Força & Cadeia Posterior",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Agachamento Livre com Barra (Back Squat)",
          "sets": 4,
          "reps": "5-6",
          "rpe": 8,
          "rest": 150
        },
        {
          "exerciseId": "lg10",
          "name": "Stiff com Barra (Terra Romeno)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 120
        },
        {
          "exerciseId": "lg07",
          "name": "Agachamento Búlgaro com Halteres",
          "sets": 3,
          "reps": "8 cada perna",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "lg20",
          "name": "Panturrilha em Pé na Máquina",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Corrida Contínua em Limiar (Tempo Run)",
      "exercises": [
        {
          "exerciseId": "hy05",
          "name": "Corrida Contínua na Esteira (Ritmo Z3/Z4)",
          "sets": 1,
          "reps": "35 min",
          "rpe": 7.5,
          "rest": 0
        },
        {
          "exerciseId": "ab05",
          "name": "Abdominal Rollout (Roda Abdominal)",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "ab06",
          "name": "Prancha Isométrica no Solo (Plank)",
          "sets": 3,
          "reps": "45s",
          "rpe": 8,
          "rest": 45
        }
      ]
    },
    {
      "id": "D",
      "name": "Treino D — Full Body Funcional & Core",
      "exercises": [
        {
          "exerciseId": "do16",
          "name": "Levantamento Terra Convencional (Deadlift)",
          "sets": 4,
          "reps": "6 reps",
          "rpe": 8,
          "rest": 120
        },
        {
          "exerciseId": "pe05",
          "name": "Supino Inclinado com Halteres",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "do11",
          "name": "Remada Unilateral com Halter (Serrote)",
          "sets": 3,
          "reps": "10 reps",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "lg08",
          "name": "Avanço / Passada com Halteres ou Barra",
          "sets": 3,
          "reps": "12 passos",
          "rpe": 7.5,
          "rest": 60
        }
      ]
    }
  ],
  "HIIT_Forca": [
    {
      "id": "A",
      "name": "Treino A — Push & HIIT Esteira",
      "exercises": [
        {
          "exerciseId": "pe01",
          "name": "Supino Reto com Barra",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 120
        },
        {
          "exerciseId": "pe05",
          "name": "Supino Inclinado com Halteres",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "sh06",
          "name": "Elevação Lateral com Halteres",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 45
        },
        {
          "exerciseId": "tr01",
          "name": "Tríceps na Polia com Barra Reta (Pushdown)",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60
        },
        {
          "exerciseId": "hy04",
          "name": "Tiros de Velocidade na Esteira (Sprints)",
          "sets": 8,
          "reps": "30s tiros",
          "rpe": 9,
          "rest": 30
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Pull & HIIT Remo",
      "exercises": [
        {
          "exerciseId": "do01",
          "name": "Barra Fixa Pronada (Pull-up)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "do08",
          "name": "Remada Curvada com Barra (Pronada)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "bi01",
          "name": "Rosca Direta com Barra Reta",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "hy02",
          "name": "Remo Concept2 RowErg (Capacidade Aeróbica)",
          "sets": 6,
          "reps": "150m sprint",
          "rpe": 9,
          "rest": 45
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Legs & HIIT AirBike",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Agachamento Livre com Barra (Back Squat)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 150
        },
        {
          "exerciseId": "lg04",
          "name": "Leg Press 45°",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "lg10",
          "name": "Stiff com Barra (Terra Romeno)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 120
        },
        {
          "exerciseId": "hy03",
          "name": "AirBike / Echo Bike / CycleAir",
          "sets": 8,
          "reps": "20s on / 10s off",
          "rpe": 9.5,
          "rest": 10
        }
      ]
    }
  ],
  "PPL": [
    {
      "id": "A",
      "name": "Treino A — Push (Empurrar)",
      "exercises": [
        {
          "exerciseId": "pe01",
          "name": "Supino Reto com Barra",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "pe05",
          "name": "Supino Inclinado com Halteres",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "sh06",
          "name": "Elevação Lateral com Halteres",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "tr01",
          "name": "Tríceps na Polia com Barra Reta (Pushdown)",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "ab02",
          "name": "Abdominal na Polia Alta com Corda (Cable Crunch)",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Pull (Puxar)",
      "exercises": [
        {
          "exerciseId": "do01",
          "name": "Barra Fixa Pronada (Pull-up)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "do08",
          "name": "Remada Curvada com Barra (Pronada)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 90
        },
        {
          "exerciseId": "sh15",
          "name": "Face Pull na Polia com Corda",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 45
        },
        {
          "exerciseId": "bi01",
          "name": "Rosca Direta com Barra Reta",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "ab03",
          "name": "Elevação de Pernas na Barra Fixa (Hanging Leg Raise)",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Legs (Pernas)",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Agachamento Livre com Barra (Back Squat)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 150
        },
        {
          "exerciseId": "lg10",
          "name": "Stiff com Barra (Terra Romeno)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "lg06",
          "name": "Cadeira Extensora",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "lg13",
          "name": "Cadeira Flexora Sentada",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "lg20",
          "name": "Panturrilha em Pé na Máquina",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8.5,
          "rest": 60
        }
      ]
    }
  ],
  "UpperLower": [
    {
      "id": "A",
      "name": "Treino A — Upper Força",
      "exercises": [
        {
          "exerciseId": "pe01",
          "name": "Supino Reto com Barra",
          "sets": 4,
          "reps": "5-8",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "do01",
          "name": "Barra Fixa Pronada (Pull-up)",
          "sets": 4,
          "reps": "5-8",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "sh01",
          "name": "Desenvolvimento Militar em Pé (Overhead)",
          "sets": 3,
          "reps": "6-8",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "tr01",
          "name": "Tríceps na Polia com Barra Reta (Pushdown)",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 60
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Lower Força",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Agachamento Livre com Barra (Back Squat)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 150
        },
        {
          "exerciseId": "lg10",
          "name": "Stiff com Barra (Terra Romeno)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "lg04",
          "name": "Leg Press 45°",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "lg20",
          "name": "Panturrilha em Pé na Máquina",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Upper Hipertrofia",
      "exercises": [
        {
          "exerciseId": "pe05",
          "name": "Supino Inclinado com Halteres",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "do04",
          "name": "Puxada Frontal Aberta na Polia",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "sh06",
          "name": "Elevação Lateral com Halteres",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8,
          "rest": 45
        },
        {
          "exerciseId": "bi01",
          "name": "Rosca Direta com Barra Reta",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60
        }
      ]
    },
    {
      "id": "D",
      "name": "Treino D — Lower Hipertrofia",
      "exercises": [
        {
          "exerciseId": "lg03",
          "name": "Agachamento Hack (Máquina)",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "lg06",
          "name": "Cadeira Extensora",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8.5,
          "rest": 60
        },
        {
          "exerciseId": "lg13",
          "name": "Cadeira Flexora Sentada",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60
        },
        {
          "exerciseId": "lg15",
          "name": "Elevação Pélvica com Barra (Hip Thrust)",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8.5,
          "rest": 90
        }
      ]
    }
  ],
  "FullBody": [
    {
      "id": "A",
      "name": "Treino A — Full Body Squat & Push",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Agachamento Livre com Barra (Back Squat)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "pe01",
          "name": "Supino Reto com Barra",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "do08",
          "name": "Remada Curvada com Barra (Pronada)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "ab06",
          "name": "Prancha Isométrica no Solo (Plank)",
          "sets": 3,
          "reps": "45s",
          "rpe": 8,
          "rest": 45
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Full Body Hinge & Pull",
      "exercises": [
        {
          "exerciseId": "lg10",
          "name": "Stiff com Barra (Terra Romeno)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "do01",
          "name": "Barra Fixa Pronada (Pull-up)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "sh01",
          "name": "Desenvolvimento Militar em Pé (Overhead)",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "ab03",
          "name": "Elevação de Pernas na Barra Fixa (Hanging Leg Raise)",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Full Body Hipertrofia",
      "exercises": [
        {
          "exerciseId": "lg04",
          "name": "Leg Press 45°",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "pe05",
          "name": "Supino Inclinado com Halteres",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "do04",
          "name": "Puxada Frontal Aberta na Polia",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "sh06",
          "name": "Elevação Lateral com Halteres",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 45
        }
      ]
    }
  ],
  "Triathlon": [
    {
      "id": "A",
      "name": "Treino A — Natação Técnica & Intervalada",
      "exercises": [
        {
          "exerciseId": "do01",
          "name": "Natação Intervalada na Piscina (Tiros 100m)",
          "sets": 8,
          "reps": "100m tiro",
          "rpe": 8,
          "rest": 30
        },
        {
          "exerciseId": "pe18",
          "name": "Flexões de Braço com Escápula Estável",
          "sets": 3,
          "reps": "12-15",
          "rpe": 7.5,
          "rest": 60
        },
        {
          "exerciseId": "ab06",
          "name": "Prancha Frontal e Isométrica (Plank)",
          "sets": 3,
          "reps": "45s",
          "rpe": 8,
          "rest": 45
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Ciclismo Intervalado de Limiar",
      "exercises": [
        {
          "exerciseId": "hy03",
          "name": "Ciclismo em Limiar de Potência (Sweet Spot)",
          "sets": 4,
          "reps": "8 min",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "lg08",
          "name": "Giro Regenerativo de Alta Cadência",
          "sets": 1,
          "reps": "15 min",
          "rpe": 6.5,
          "rest": 0
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Corrida em Ritmo de Prova",
      "exercises": [
        {
          "exerciseId": "hy05",
          "name": "Corrida Contínua em Zona 3/4 (Tempo Run)",
          "sets": 1,
          "reps": "35-45 min",
          "rpe": 8,
          "rest": 0
        },
        {
          "exerciseId": "lg20",
          "name": "Panturrilha Unilateral no Degrau",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60
        }
      ]
    },
    {
      "id": "D",
      "name": "Treino D — Força Preventiva para Triatletas",
      "exercises": [
        {
          "exerciseId": "do16",
          "name": "Levantamento Terra com Trap Bar / Barra",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 120
        },
        {
          "exerciseId": "lg07",
          "name": "Agachamento Búlgaro com Halteres",
          "sets": 3,
          "reps": "8-10 cada",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "sh15",
          "name": "Face Pull na Polia com Rotação Externa",
          "sets": 3,
          "reps": "12-15",
          "rpe": 7.5,
          "rest": 60
        },
        {
          "exerciseId": "ab05",
          "name": "Abdominal Rollout (Roda Abdominal)",
          "sets": 3,
          "reps": "10 reps",
          "rpe": 8,
          "rest": 60
        }
      ]
    }
  ],
  "FuncionalMisto": [
    {
      "id": "A",
      "name": "Treino A — Padrões Fundamentais & Mobilidade",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Agachamento Goblet com Halter / Kettlebell",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "do11",
          "name": "Remada Unilateral com Halter (Serrote)",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "pe18",
          "name": "Flexão de Braço no Solo (Push-up)",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "ab06",
          "name": "Prancha Lateral com Elevação de Quadril",
          "sets": 3,
          "reps": "30s / lado",
          "rpe": 7.5,
          "rest": 45
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Potência & Core Integrado",
      "exercises": [
        {
          "exerciseId": "hy14",
          "name": "Kettlebell Swing Russo",
          "sets": 4,
          "reps": "15-20",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "hy10",
          "name": "Farmers Carry com Halteres / Kettlebells",
          "sets": 4,
          "reps": "40m",
          "rpe": 8.5,
          "rest": 90
        },
        {
          "exerciseId": "lg08",
          "name": "Avanço / Passada com Halteres",
          "sets": 3,
          "reps": "12 passos",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "ab03",
          "name": "Elevação de Pernas na Barra Fixa",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Circuito Metabólico Funcional",
      "exercises": [
        {
          "exerciseId": "hy08",
          "name": "Burpees Dinâmicos no Solo",
          "sets": 4,
          "reps": "12 reps",
          "rpe": 8.5,
          "rest": 45
        },
        {
          "exerciseId": "hy02",
          "name": "Remo Concept2 RowErg",
          "sets": 4,
          "reps": "250m",
          "rpe": 8.5,
          "rest": 60
        },
        {
          "exerciseId": "hy13",
          "name": "Box Jump na Caixa (60cm)",
          "sets": 3,
          "reps": "12 cada",
          "rpe": 8,
          "rest": 60
        }
      ]
    }
  ],
  "Ciclismo_Forca": [
    {
      "id": "A",
      "name": "Treino A — Força de Pernas para Ciclismo",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Agachamento Livre com Barra (Back Squat)",
          "sets": 4,
          "reps": "5-6",
          "rpe": 8.5,
          "rest": 150
        },
        {
          "exerciseId": "lg04",
          "name": "Leg Press 45°",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "lg10",
          "name": "Stiff com Barra (Terra Romeno)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 120
        },
        {
          "exerciseId": "lg20",
          "name": "Panturrilha em Pé na Máquina",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Sessão de Bike Intervalada",
      "exercises": [
        {
          "exerciseId": "hy03",
          "name": "Tiros de Potência VO2max na Bike",
          "sets": 5,
          "reps": "3 min",
          "rpe": 9,
          "rest": 180
        },
        {
          "exerciseId": "lg08",
          "name": "Giro de Cadência Recuperativa",
          "sets": 1,
          "reps": "20 min",
          "rpe": 6,
          "rest": 0
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Tronco & Postura de Guidão",
      "exercises": [
        {
          "exerciseId": "do08",
          "name": "Remada Curvada com Barra (Pronada)",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "pe01",
          "name": "Supino Reto com Barra",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "sh15",
          "name": "Face Pull na Polia com Rotação Externa",
          "sets": 3,
          "reps": "12-15",
          "rpe": 7.5,
          "rest": 60
        },
        {
          "exerciseId": "ab06",
          "name": "Prancha Isométrica de Sustentação",
          "sets": 3,
          "reps": "45s",
          "rpe": 8,
          "rest": 45
        }
      ]
    },
    {
      "id": "D",
      "name": "Treino D — Longão de Ciclismo Z2",
      "exercises": [
        {
          "exerciseId": "hy03",
          "name": "Rodagem Contínua em Zona 2 (Longão)",
          "sets": 1,
          "reps": "75 min",
          "rpe": 7,
          "rest": 0
        }
      ]
    }
  ],
  "EsportesColetivos": [
    {
      "id": "A",
      "name": "Treino A — Força Reativa & Pliometria",
      "exercises": [
        {
          "exerciseId": "do16",
          "name": "Levantamento Terra Convencional",
          "sets": 4,
          "reps": "5 reps",
          "rpe": 8,
          "rest": 120
        },
        {
          "exerciseId": "hy13",
          "name": "Box Jump na Caixa (60cm)",
          "sets": 4,
          "reps": "6 saltos",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "lg07",
          "name": "Agachamento Búlgaro com Halteres",
          "sets": 3,
          "reps": "6 cada",
          "rpe": 8,
          "rest": 90
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Agilidade & Mudança de Direção",
      "exercises": [
        {
          "exerciseId": "hy04",
          "name": "Tiros Curtos com Mudança de Direção",
          "sets": 6,
          "reps": "15m percurso",
          "rpe": 8.5,
          "rest": 60
        },
        {
          "exerciseId": "lg10",
          "name": "Flexão Nórdica ou Stiff Unilateral",
          "sets": 3,
          "reps": "6-8 reps",
          "rpe": 8.5,
          "rest": 90
        },
        {
          "exerciseId": "ab06",
          "name": "Prancha Lateral com Abdução de Quadril",
          "sets": 3,
          "reps": "30s / lado",
          "rpe": 8,
          "rest": 45
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Condicionamento Intermitente",
      "exercises": [
        {
          "exerciseId": "hy04",
          "name": "Sprints Intermitentes 15s / 15s",
          "sets": 10,
          "reps": "15s tiro",
          "rpe": 9,
          "rest": 15
        },
        {
          "exerciseId": "pe18",
          "name": "Flexões com Empurrada Explosiva",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "ab02",
          "name": "Rotação de Tronco no Cabo (Woodchopper)",
          "sets": 3,
          "reps": "12 / lado",
          "rpe": 8,
          "rest": 60
        }
      ]
    }
  ],
  "MistoCardio": [
    {
      "id": "A",
      "name": "Treino A — Upper Força + Cardio Z2",
      "exercises": [
        {
          "exerciseId": "pe01",
          "name": "Supino Reto com Barra",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "do08",
          "name": "Remada Curvada com Barra",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "sh06",
          "name": "Elevação Lateral com Halteres",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8.5,
          "rest": 45
        },
        {
          "exerciseId": "hy05",
          "name": "Cardio Pós-Treino em Zona 2",
          "sets": 1,
          "reps": "25 min",
          "rpe": 7,
          "rest": 0
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Lower Força & Posterior",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Agachamento Livre com Barra",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 120
        },
        {
          "exerciseId": "lg04",
          "name": "Leg Press 45°",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "lg10",
          "name": "Stiff com Barra",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "lg20",
          "name": "Panturrilha em Pé na Máquina",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8.5,
          "rest": 45
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Cardio HIIT Dedicado",
      "exercises": [
        {
          "exerciseId": "hy02",
          "name": "Remo Concept2 ou Esteira (HIIT 1m/1m)",
          "sets": 8,
          "reps": "1m tiro",
          "rpe": 8.5,
          "rest": 60
        },
        {
          "exerciseId": "ab05",
          "name": "Abdominal Rollout ou Prancha Frontal",
          "sets": 3,
          "reps": "12 reps",
          "rpe": 8,
          "rest": 45
        }
      ]
    },
    {
      "id": "D",
      "name": "Treino D — Full Body Funcional & Core",
      "exercises": [
        {
          "exerciseId": "do16",
          "name": "Levantamento Terra com Halteres / Barra",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "pe05",
          "name": "Supino Inclinado com Halteres",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "do04",
          "name": "Puxada Frontal Aberta na Polia",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "lg08",
          "name": "Passada com Halteres (Walking Lunges)",
          "sets": 3,
          "reps": "10 passos",
          "rpe": 8,
          "rest": 60
        }
      ]
    }
  ],
  "Corrida_Endurance": [
    {
      "id": "A",
      "name": "Treino A — Tiros de Velocidade & VO2max",
      "exercises": [
        {
          "exerciseId": "hy04",
          "name": "Tiros de 400m / 800m na Pista/Esteira",
          "sets": 6,
          "reps": "400m tiro",
          "rpe": 9,
          "rest": 90
        },
        {
          "exerciseId": "ab06",
          "name": "Prancha Frontal e Lateral para Estabilidade",
          "sets": 3,
          "reps": "45s",
          "rpe": 8,
          "rest": 45
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Fortalecimento Anti-Lesão de Corrida",
      "exercises": [
        {
          "exerciseId": "lg07",
          "name": "Agachamento Búlgaro com Halteres",
          "sets": 3,
          "reps": "8-10 cada",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "lg10",
          "name": "Stiff Unilateral com Halter",
          "sets": 3,
          "reps": "8 cada perna",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "lg20",
          "name": "Elevação de Panturrilha em Pé com Pausa",
          "sets": 4,
          "reps": "15 reps",
          "rpe": 8.5,
          "rest": 60
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Corrida em Ritmo de Prova",
      "exercises": [
        {
          "exerciseId": "hy05",
          "name": "Corrida Contínua em Ritmo de Limiar (Tempo Run)",
          "sets": 1,
          "reps": "40 min",
          "rpe": 8,
          "rest": 0
        }
      ]
    },
    {
      "id": "D",
      "name": "Treino D — Longão de Rodagem Contínua (Z2)",
      "exercises": [
        {
          "exerciseId": "hy05",
          "name": "Longão de Rodagem em Zona 2 (60-90 min)",
          "sets": 1,
          "reps": "75 min",
          "rpe": 7,
          "rest": 0
        }
      ]
    }
  ],
  "Ciclismo_Endurance": [
    {
      "id": "A",
      "name": "Treino A — Treino de Limiar & Sweet Spot",
      "exercises": [
        {
          "exerciseId": "hy03",
          "name": "Intervalos Sweet Spot (88-93% FTP)",
          "sets": 4,
          "reps": "8 min",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "ab06",
          "name": "Prancha Isométrica de Sustentação",
          "sets": 3,
          "reps": "45s",
          "rpe": 7.5,
          "rest": 45
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Força de Sustentação & Core",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Agachamento Livre com Barra",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 120
        },
        {
          "exerciseId": "do08",
          "name": "Remada Curvada com Barra",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "lg10",
          "name": "Stiff com Halteres",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Longão de Endurance (Estrada / Rolo)",
      "exercises": [
        {
          "exerciseId": "hy03",
          "name": "Rodagem Longa Contínua (Longão de Ciclismo)",
          "sets": 1,
          "reps": "90-120 min",
          "rpe": 7,
          "rest": 0
        }
      ]
    }
  ],
  "Natacao": [
    {
      "id": "A",
      "name": "Treino A — Volume Aeróbio Contínuo & Pacing",
      "exercises": [
        {
          "exerciseId": "do01",
          "name": "Série de Fundo na Piscina (Crawl)",
          "sets": 6,
          "reps": "200m a 400m",
          "rpe": 8,
          "rest": 45
        },
        {
          "exerciseId": "ab06",
          "name": "Prancha Frontal com Respiração Controlada",
          "sets": 3,
          "reps": "45s",
          "rpe": 7.5,
          "rest": 45
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Fortalecimento em Terra para Nadadores",
      "exercises": [
        {
          "exerciseId": "do01",
          "name": "Barra Fixa com Pegada Neutra",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "sh15",
          "name": "Face Pull com Rotação Externa",
          "sets": 3,
          "reps": "12-15",
          "rpe": 7.5,
          "rest": 60
        },
        {
          "exerciseId": "do11",
          "name": "Remada Unilateral com Halter (Serrote)",
          "sets": 3,
          "reps": "10 reps",
          "rpe": 8,
          "rest": 60
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Tiros de Velocidade & Pernada",
      "exercises": [
        {
          "exerciseId": "do01",
          "name": "Tiros de 50m Crawl em Velocidade Máxima",
          "sets": 10,
          "reps": "50m tiro",
          "rpe": 9,
          "rest": 45
        },
        {
          "exerciseId": "lg08",
          "name": "Pernada de Crawl com Prancha",
          "sets": 4,
          "reps": "100m pernada",
          "rpe": 8.5,
          "rest": 45
        }
      ]
    }
  ],
  "Lutas": [
    {
      "id": "A",
      "name": "Treino A — Força Explosiva & Potência",
      "exercises": [
        {
          "exerciseId": "do16",
          "name": "Levantamento Terra Convencional",
          "sets": 4,
          "reps": "4-6",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "pe01",
          "name": "Supino Reto com Saída Rápida",
          "sets": 4,
          "reps": "5-6",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "do01",
          "name": "Barra Fixa com Pano / Toalha (Grip Pull-up)",
          "sets": 3,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 90
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Pescoço, Grip & Core Rotacional",
      "exercises": [
        {
          "exerciseId": "hy10",
          "name": "Farmers Carry com Halteres / Kettlebells",
          "sets": 4,
          "reps": "40m",
          "rpe": 8.5,
          "rest": 90
        },
        {
          "exerciseId": "ab02",
          "name": "Rotação de Tronco no Cabo / Medicine Ball",
          "sets": 4,
          "reps": "10-12 / lado",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "sh15",
          "name": "Isometria Cervical & Trapézio Superior",
          "sets": 3,
          "reps": "30s",
          "rpe": 7.5,
          "rest": 45
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Resistência Lática & Condicionamento",
      "exercises": [
        {
          "exerciseId": "hy03",
          "name": "AirBike em Tiros de Round (3 min)",
          "sets": 4,
          "reps": "3 min round",
          "rpe": 9,
          "rest": 60
        },
        {
          "exerciseId": "hy08",
          "name": "Sprawls com Kettlebell ou Burpees Rápidos",
          "sets": 4,
          "reps": "12-15 reps",
          "rpe": 8.5,
          "rest": 45
        }
      ]
    }
  ],
  "Calistenia": [
    {
      "id": "A",
      "name": "Treino A — Tração (Pull) em Barra Fixa",
      "exercises": [
        {
          "exerciseId": "do01",
          "name": "Barra Fixa Pronada Estrita (Pull-up)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "do08",
          "name": "Remada Australiana nas Argolas ou Barra Baixa",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "ab03",
          "name": "Toes-to-Bar / Elevação de Joelhos na Barra",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Empurrar (Push) em Paralelas",
      "exercises": [
        {
          "exerciseId": "pe19",
          "name": "Mergulho em Barras Paralelas (Dips)",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8.5,
          "rest": 90
        },
        {
          "exerciseId": "pe18",
          "name": "Flexão Declinada ou Diamante",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "sh01",
          "name": "Pike Push-up ou Flexão na Parede (Handstand)",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "ab06",
          "name": "Hollow Body Hold (Canoa Isométrica)",
          "sets": 4,
          "reps": "40s",
          "rpe": 8,
          "rest": 45
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Pernas com Peso Corporal & Equilíbrio",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Pistol Squat (Agachamento Unilateral Livre)",
          "sets": 4,
          "reps": "5-6 cada perna",
          "rpe": 8.5,
          "rest": 90
        },
        {
          "exerciseId": "lg08",
          "name": "Passada Saltada / Jumping Lunges",
          "sets": 3,
          "reps": "12 saltos",
          "rpe": 8,
          "rest": 60
        },
        {
          "exerciseId": "ab05",
          "name": "Dragon Flag ou Prancha Abdominal Avançada",
          "sets": 3,
          "reps": "6-8 reps",
          "rpe": 8.5,
          "rest": 60
        }
      ]
    }
  ],
  "Aerobico_Geral": [
    {
      "id": "A",
      "name": "Treino A — Cardio Contínuo de Baixo Impacto (Z2)",
      "exercises": [
        {
          "exerciseId": "hy05",
          "name": "Caminhada Inclinada ou Elíptico Z2",
          "sets": 1,
          "reps": "45 min",
          "rpe": 6.5,
          "rest": 0
        },
        {
          "exerciseId": "ab06",
          "name": "Prancha Frontal com Apoio nos Joelhos/Pés",
          "sets": 3,
          "reps": "30-45s",
          "rpe": 7,
          "rest": 45
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Circuito Metabólico Aeróbio",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Agachamento com Peso Corporal (Air Squat)",
          "sets": 3,
          "reps": "15-20",
          "rpe": 7,
          "rest": 45
        },
        {
          "exerciseId": "pe18",
          "name": "Flexão de Braço Apoiada no Banco",
          "sets": 3,
          "reps": "10-12",
          "rpe": 7,
          "rest": 45
        },
        {
          "exerciseId": "lg08",
          "name": "Passos no Step ou Marcha Estacionária",
          "sets": 3,
          "reps": "2 min",
          "rpe": 7,
          "rest": 45
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Intervalado Aeróbio Moderado (Z3)",
      "exercises": [
        {
          "exerciseId": "hy04",
          "name": "Intervalos Moderados na Esteira ou Bicicleta",
          "sets": 6,
          "reps": "2 min Z3 / 1 min leve",
          "rpe": 7.5,
          "rest": 60
        }
      ]
    }
  ],
  "PHAT": [
    {
      "id": "A",
      "name": "Treino A · Push A (Força Mecânica e Potência)",
      "exercises": [
        {
          "exerciseId": "pe01",
          "name": "Supino Reto com Barra",
          "sets": 4,
          "reps": "5-7",
          "rpe": 8,
          "rest": 150,
          "obs": "Pausa controlada de 1s no esterno · arco torácico firme.",
          "cadence": "3-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "sh01",
          "name": "Desenvolvimento Militar em Pé com Barra",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 120,
          "obs": "Core travado e cotovelos apontados à frente.",
          "cadence": "3-0-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "pe05",
          "name": "Supino Inclinado com Halteres",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Halteres ampliam ADM · foco no feixe clavicular.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "pe19",
          "name": "Paralelas (Dips) com Sobrepesa",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Tronco inclinado 30° à frente · foco peitoral inferior.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "sh06",
          "name": "Elevação Lateral com Halteres",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Pico de torque a 90° com 1s de isometria.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "tr04",
          "name": "Tríceps Testa com Barra W na Prancha",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 75,
          "obs": "Cabeça longa em máximo alongamento.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B · Pull A (Tração e Força Escapular)",
      "exercises": [
        {
          "exerciseId": "do16",
          "name": "Levantamento Terra Convencional",
          "sets": 4,
          "reps": "4-6",
          "rpe": 8,
          "rest": 180,
          "obs": "Tração neural máxima · coluna rigorosamente neutra.",
          "cadence": "3-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "do01",
          "name": "Barra Fixa (Weighted Pull-up)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 120,
          "obs": "Hang completo no fundo · latíssimo em máx. comprimento.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "do08",
          "name": "Remada Curvada com Barra (Pegada Pronada)",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Retração escapular estrita para romboides e trapézio.",
          "cadence": "3-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "do11",
          "name": "Remada Unilateral com Halter (Serrote)",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 75,
          "obs": "Alongamento máximo da dorsal na posição inferior.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "sh21",
          "name": "Crucifixo Invertido na Polia Alta",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60,
          "obs": "Isolamento de deltoide posterior com tensão contínua.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "bi01",
          "name": "Rosca Direta com Barra Reta",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 75,
          "obs": "Supinação completa sem balanço lombar.",
          "cadence": "3-1-1-0",
          "resistProfile": "uniform"
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C · Legs A (Dominância de Joelho e Potência)",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Agachamento Livre com Barra High Bar",
          "sets": 4,
          "reps": "5-7",
          "rpe": 8,
          "rest": 150,
          "obs": "Excêntrica controlada de 3s protege tendão patelar.",
          "cadence": "3-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg04",
          "name": "Leg Press 45°",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Amplitude máxima (joelhos > 90°) sem retroversão.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "lg25",
          "name": "Afundo Deslocado com Halteres",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 90,
          "obs": "Passada firme com estabilidade de joelho.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "lg06",
          "name": "Cadeira Extensora",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60,
          "obs": "Pico de EMG no encurtamento do reto femoral.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "lg20",
          "name": "Gêmeos em Pé na Máquina",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Gastrocnêmio em máximo comprimento com 1s pausa.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "ab02",
          "name": "Abdominal Supra na Polia com Carga",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60,
          "obs": "Carga progressiva no reto abdominal.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        }
      ]
    },
    {
      "id": "D",
      "name": "Treino D · Push B (Hipertrofia e Densidade)",
      "exercises": [
        {
          "exerciseId": "pe02",
          "name": "Supino Inclinado com Barra",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 120,
          "obs": "Barra desce até a clavícula · foco feixe superior.",
          "cadence": "3-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "pe04",
          "name": "Supino Reto com Halteres",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Maior amplitude e adução no pico concêntrico.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "sh02",
          "name": "Desenvolvimento Seletivo com Halteres (Sentado)",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Trajetória convergente sem travar cotovelos.",
          "cadence": "3-0-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "pe11",
          "name": "Crossover na Polia Média",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60,
          "obs": "Tensão contínua esternal com 1s no pico.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "sh07",
          "name": "Elevação Lateral na Polia Baixa (Unilateral)",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60,
          "obs": "Tensão do cabo desde o início da abdução.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "tr02",
          "name": "Tríceps Pulley com Corda",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Abertura no final ativa cabeça lateral e medial.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        }
      ]
    },
    {
      "id": "E",
      "name": "Treino E · Pull B (Espessura e Cadeia Posterior)",
      "exercises": [
        {
          "exerciseId": "do04",
          "name": "Puxada Alta Articulada ou Polia (Pegada Neutra)",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Fibras superiores do latíssimo no maior comprimento.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "do10",
          "name": "Remada T-Bar (Cavalo) com Apoio",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Sem estresse lombar · retração escapular pesada.",
          "cadence": "3-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "do12",
          "name": "Remada Baixa no Cabo com Puxador Triângulo",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 75,
          "obs": "Pico de contração nos romboides e dorsal.",
          "cadence": "3-0-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh15",
          "name": "Face Pull no Cabo com Corda",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60,
          "obs": "Deltoide posterior e manguito rotador.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "bi09",
          "name": "Rosca Alternada com Halteres no Banco Inclinado",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 75,
          "obs": "Cabeça longa do bíceps no comprimento máximo.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "bi05",
          "name": "Rosca Martelo na Polia Baixa com Corda",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Braquiorradial e braquial em tensão contínua.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "F",
      "name": "Treino F · Legs B (Dominância de Quadril e Estabilidade)",
      "exercises": [
        {
          "exerciseId": "lg10",
          "name": "Stiff com Barra",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 120,
          "obs": "Pico de tensão passiva dos isquiotibiais.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "lg07",
          "name": "Agachamento Búlgaro com Halteres",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Glúteo máximo e quadríceps unilateral.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "lg12",
          "name": "Mesa Flexora",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 75,
          "obs": "Isquiotibiais com 1s de isometria no pico.",
          "cadence": "3-1-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg15",
          "name": "Elevação Pélvica com Barra",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Glúteo máximo no pico de contração.",
          "cadence": "3-0-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "lg22",
          "name": "Gêmeos No Leg Press",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60,
          "obs": "Gastrocnêmio & sóleo com ADM completa.",
          "cadence": "3-1-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "ab06",
          "name": "Prancha Isométrica com Sobrecarga",
          "sets": 3,
          "reps": "45-60s",
          "rpe": 8,
          "rest": 60,
          "obs": "Estabilização do transverso abdominal.",
          "cadence": "3-1-1-0",
          "resistProfile": "uniform"
        }
      ]
    }
  ],
  "DUP": [
    {
      "id": "A",
      "name": "Treino A · Dia Neural (Força & Tensão Miofibrilar)",
      "exercises": [
        {
          "exerciseId": "pe01",
          "name": "Supino Reto com Barra",
          "sets": 5,
          "reps": "3-5",
          "rpe": 9,
          "rest": 180,
          "obs": "Excêntrica de 4s · restauração neuroquímica total.",
          "cadence": "4-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg01",
          "name": "Agachamento Livre com Barra (Back Squat)",
          "sets": 5,
          "reps": "3-5",
          "rpe": 9,
          "rest": 180,
          "obs": "Proteção de LCA/patela · base sólida.",
          "cadence": "4-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "do08",
          "name": "Remada Curvada com Barra (Pronada)",
          "sets": 5,
          "reps": "4-6",
          "rpe": 9,
          "rest": 150,
          "obs": "Retração escapular estrita para romboides.",
          "cadence": "4-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "sh01",
          "name": "Desenvolvimento Militar em Pé (OHP)",
          "sets": 4,
          "reps": "4-6",
          "rpe": 8.5,
          "rest": 150,
          "obs": "Core blindado e glúteos contraídos.",
          "cadence": "3-0-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "ab05",
          "name": "Abdominal Rollout (Roda Abdominal)",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Estabilidade anti-extensão do core.",
          "cadence": "3-0-2-0",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B · Dia Hipertrófico (Tensão Contínua & ADM Máxima)",
      "exercises": [
        {
          "exerciseId": "pe05",
          "name": "Supino Inclinado com Halteres",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Halteres ampliam ADM no feixe clavicular.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "lg10",
          "name": "Stiff com Barra (Terra Romeno)",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Pico de tensão passiva dos isquiotibiais.",
          "cadence": "4-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "do04",
          "name": "Puxada Frontal Aberta na Polia",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Latíssimo no comprimento máximo.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "lg03",
          "name": "Agachamento Hack (Máquina)",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Maior ADM de coxa sem carga axial.",
          "cadence": "4-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "sh09",
          "name": "Elevação Lateral Inclinada no Banco 45°",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Deltoide medial em máximo comprimento.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "bi09",
          "name": "Rosca Inclinada no Banco 45°",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 60,
          "obs": "Cabeça longa do bíceps no comprimento máximo.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "tr06",
          "name": "Tríceps Francês com Halter",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 60,
          "obs": "Ombro em flexão >90° alonga a cabeça longa.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C · Dia Metabólico & Potência (Pump & Densidade)",
      "exercises": [
        {
          "exerciseId": "pe13",
          "name": "Peck Deck / Voador (Máquina)",
          "sets": 4,
          "reps": "12-15",
          "rpe": 9,
          "rest": 45,
          "obs": "Pico na adução máxima com 1s ISO.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "lg06",
          "name": "Cadeira Extensora",
          "sets": 4,
          "reps": "12-15",
          "rpe": 9,
          "rest": 45,
          "obs": "Máxima ativação no topo com 1s ISO.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "do07",
          "name": "Pulldown na Polia com Braços Retos",
          "sets": 4,
          "reps": "12-15",
          "rpe": 9,
          "rest": 45,
          "obs": "Extensão de ombro com 1s ISO no quadril.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "lg13",
          "name": "Cadeira Flexora Sentada",
          "sets": 4,
          "reps": "12-15",
          "rpe": 9,
          "rest": 45,
          "obs": "Isquiotibiais encurtados · par do Stiff.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh06",
          "name": "Elevação Lateral com Halteres",
          "sets": 4,
          "reps": "12-15",
          "rpe": 9,
          "rest": 45,
          "obs": "Pico a 90° com 1s ISO no topo.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "bi06",
          "name": "Rosca Scott com Barra W",
          "sets": 3,
          "reps": "12-15",
          "rpe": 9,
          "rest": 45,
          "obs": "Pico no encurtamento do bíceps.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "tr01",
          "name": "Tríceps na Polia com Barra Reta",
          "sets": 3,
          "reps": "12-15",
          "rpe": 9,
          "rest": 45,
          "obs": "Extensão terminal com 1s ISO.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "lg21",
          "name": "Panturrilha Sentado (Gêmeos / Sóleo)",
          "sets": 4,
          "reps": "15-20",
          "rpe": 9,
          "rest": 45,
          "obs": "Sóleo isolado no encurtamento.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        }
      ]
    }
  ],
  "ABCD": [
    {
      "id": "A",
      "name": "Treino A · Peitoral, Tríceps & Reto Abdominal",
      "exercises": [
        {
          "exerciseId": "pe01",
          "name": "Supino Reto com Barra",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 120,
          "obs": "Pico no encurtamento com arco torácico firme.",
          "cadence": "3-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "pe05",
          "name": "Supino Inclinado com Halteres",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Feixe clavicular com ADM ampliada.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "pe10",
          "name": "Crossover no Cabo (Polia Alta)",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Peitoral em máximo comprimento (Stretched).",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "pe13",
          "name": "Peck Deck / Voador (Máquina)",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico na adução máxima à frente com 1s ISO.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "tr06",
          "name": "Tríceps Francês com Halter",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Cabeça longa em máximo comprimento.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "tr01",
          "name": "Tríceps na Polia com Barra Reta",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico de EMG no encurtamento · 1s ISO.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "ab02",
          "name": "Abdominal na Polia Alta com Corda",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60,
          "obs": "Carga progressiva no reto abdominal.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B · Dorsal, Trapézio, Bíceps & Abdômen Infra",
      "exercises": [
        {
          "exerciseId": "do01",
          "name": "Barra Fixa Pronada (Pull-up)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120,
          "obs": "Hang completo no fundo · tração vertical potente.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "do08",
          "name": "Remada Curvada com Barra (Pronada)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 90,
          "obs": "Retração escapular para romboides.",
          "cadence": "3-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "do04",
          "name": "Puxada Frontal Aberta na Polia",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Latíssimo no comprimento máximo.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "do07",
          "name": "Pulldown na Polia com Braços Retos",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Extensão de ombro com 1s ISO no quadril.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh18",
          "name": "Encolhimento com Barra (Shrug)",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Pico do trapézio superior no encurtamento.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "bi09",
          "name": "Rosca Inclinada no Banco 45°",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 60,
          "obs": "Cabeça longa do bíceps no comprimento máximo.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "bi06",
          "name": "Rosca Scott com Barra W",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico de contração no topo com 1s ISO.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "ab03",
          "name": "Elevação de Pernas na Barra Fixa",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60,
          "obs": "Core no comprimento máximo.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C · Membros Inferiores Completo & Core",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Agachamento Livre com Barra (Back Squat)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 150,
          "obs": "Excêntrica de 4s protege LCA e tendão patelar.",
          "cadence": "4-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg10",
          "name": "Stiff com Barra (Terra Romeno)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120,
          "obs": "Pico de tensão passiva dos isquiotibiais.",
          "cadence": "4-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "lg04",
          "name": "Leg Press 45°",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Amplitude máxima sem retroversão.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "lg06",
          "name": "Cadeira Extensora",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico de ativação no encurtamento.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "lg13",
          "name": "Cadeira Flexora Sentada",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Isquiotibiais encurtados · par do Stiff.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "lg20",
          "name": "Panturrilha em Pé na Máquina",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Gastrocnêmio em máximo comprimento.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "ab05",
          "name": "Abdominal Rollout (Roda Abdominal)",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Core no comprimento máximo.",
          "cadence": "3-0-2-0",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "D",
      "name": "Treino D · Deltoides Completo & Oblíquos 3D",
      "exercises": [
        {
          "exerciseId": "sh01",
          "name": "Desenvolvimento Militar em Pé (OHP)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 120,
          "obs": "Core blindado e glúteos contraídos.",
          "cadence": "3-0-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh09",
          "name": "Elevação Lateral Inclinada no Banco 45°",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Deltoide medial em máximo comprimento.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "sh06",
          "name": "Elevação Lateral com Halteres",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 45,
          "obs": "Pico a 90° com 1s ISO no topo.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh15",
          "name": "Face Pull na Polia com Corda",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8.5,
          "rest": 45,
          "obs": "Deltoide posterior + manguito rotador.",
          "cadence": "2-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh13",
          "name": "Crucifixo Inverso com Halteres",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 45,
          "obs": "Tronco inclinado com cotovelos abertos.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "ab07",
          "name": "Russian Twist com Halter ou Anilha",
          "sets": 3,
          "reps": "20 reps",
          "rpe": 7.5,
          "rest": 45,
          "obs": "Rotação controlada com estabilidade pélvica.",
          "cadence": "2-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "ab04",
          "name": "Elevação de Pernas na Paralela (Capitão)",
          "sets": 3,
          "reps": "12-15",
          "rpe": 7.5,
          "rest": 60,
          "obs": "Enrolamento pélvico sem impulsos.",
          "cadence": "3-0-1-0",
          "resistProfile": "shortened"
        }
      ]
    }
  ],
  "ABCDE": [
    {
      "id": "A",
      "name": "Treino A · Peitoral & Reto Abdominal",
      "exercises": [
        {
          "exerciseId": "pe01",
          "name": "Supino Reto com Barra",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120,
          "obs": "Pausa de 1s no peito · arco torácico firme.",
          "cadence": "3-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "pe05",
          "name": "Supino Inclinado com Halteres",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Feixe clavicular com ADM ampliada.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "pe07",
          "name": "Crucifixo Reto com Halteres",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico a 90° de abdução com 1s pausa no fundo.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "pe13",
          "name": "Peck Deck / Voador (Máquina)",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico na adução máxima à frente com 1s ISO.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "ab02",
          "name": "Abdominal na Polia Alta com Corda",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60,
          "obs": "Carga progressiva no reto abdominal.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B · Dorsal, Lombar & Infra",
      "exercises": [
        {
          "exerciseId": "do01",
          "name": "Barra Fixa Pronada (Pull-up)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120,
          "obs": "Hang completo no fundo · tração vertical potente.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "do08",
          "name": "Remada Curvada com Barra (Pronada)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 90,
          "obs": "Retração escapular para romboides.",
          "cadence": "3-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "do04",
          "name": "Puxada Frontal Aberta na Polia",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Latíssimo no comprimento máximo.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "do07",
          "name": "Pulldown na Polia com Braços Retos",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Extensão de ombro com 1s ISO no quadril.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh18",
          "name": "Encolhimento com Barra (Shrug)",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Pico do trapézio superior no encurtamento.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "ab03",
          "name": "Elevação de Pernas na Barra Fixa",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60,
          "obs": "Core no comprimento máximo.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C · Membros Inferiores Completo",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Agachamento Livre com Barra (Back Squat)",
          "sets": 5,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 150,
          "obs": "Excêntrica de 4s protege LCA e tendão patelar.",
          "cadence": "4-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg10",
          "name": "Stiff com Barra (Terra Romeno)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120,
          "obs": "Pico de tensão passiva dos isquiotibiais.",
          "cadence": "4-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "lg03",
          "name": "Agachamento Hack (Máquina)",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Maior ADM sem sobrecarga axial lombar.",
          "cadence": "4-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "lg06",
          "name": "Cadeira Extensora",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico de ativação no encurtamento total.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "lg13",
          "name": "Cadeira Flexora Sentada",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Isquiotibiais encurtados · par do Stiff.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "lg20",
          "name": "Panturrilha em Pé na Máquina",
          "sets": 5,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Gastrocnêmio em máximo comprimento.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "D",
      "name": "Treino D · Deltoides, Trapézio & Oblíquos",
      "exercises": [
        {
          "exerciseId": "sh01",
          "name": "Desenvolvimento Militar em Pé (OHP)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 120,
          "obs": "Core blindado e glúteos contraídos.",
          "cadence": "3-0-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh09",
          "name": "Elevação Lateral Inclinada no Banco 45°",
          "sets": 5,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Deltoide medial em máximo comprimento.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "sh06",
          "name": "Elevação Lateral com Halteres",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 45,
          "obs": "Pico a 90° com 1s ISO no topo.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh15",
          "name": "Face Pull na Polia com Corda",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8.5,
          "rest": 45,
          "obs": "Deltoide posterior + manguito rotador.",
          "cadence": "2-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh18",
          "name": "Encolhimento com Barra (Shrug)",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Pico do trapézio superior no encurtamento.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "ab07",
          "name": "Russian Twist com Halter ou Anilha",
          "sets": 3,
          "reps": "20 reps",
          "rpe": 7.5,
          "rest": 45,
          "obs": "Rotação controlada com estabilidade pélvica.",
          "cadence": "2-0-1-0",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "E",
      "name": "Treino E · Braços Completos & Rollout",
      "exercises": [
        {
          "exerciseId": "bi01",
          "name": "Rosca Direta com Barra Reta",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 75,
          "obs": "Flexão pura de cotovelo sem impulso lombar.",
          "cadence": "3-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "tr04",
          "name": "Tríceps Testa com Barra W (Skull Crusher)",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 75,
          "obs": "Cabeça longa em máximo estiramento.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "bi09",
          "name": "Rosca Inclinada no Banco 45°",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 60,
          "obs": "Cabeça longa do bíceps no comprimento máximo.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "tr06",
          "name": "Tríceps Francês com Halter",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Ombro em flexão >90° alonga a cabeça longa.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "bi06",
          "name": "Rosca Scott com Barra W",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico de contração no topo com 1s ISO.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "tr01",
          "name": "Tríceps na Polia com Barra Reta",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico de EMG no encurtamento com 1s ISO.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "ab05",
          "name": "Abdominal Rollout (Roda Abdominal)",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Core no comprimento máximo.",
          "cadence": "3-0-2-0",
          "resistProfile": "stretched"
        }
      ]
    }
  ],
  "Metcon": [
    {
      "id": "A",
      "name": "Treino A · Metcon Força & Potência Anaeróbia (EMOM)",
      "exercises": [
        {
          "exerciseId": "do16",
          "name": "Levantamento Terra Convencional / Trap Bar",
          "sets": 4,
          "reps": "5 reps",
          "rpe": 8.5,
          "rest": 90,
          "obs": "Força de tração máxima em bloco metabólico com saída explosiva.",
          "cadence": "Potente",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "sh01",
          "name": "Desenvolvimento Militar (Push Press / OHP)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 60,
          "obs": "Potência de ombro e estabilização de core sob fadiga.",
          "cadence": "Explosivo",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "lg01",
          "name": "AirBike / Echo Bike (Sprints de 30s)",
          "sets": 5,
          "reps": "30s tiros",
          "rpe": 9,
          "rest": 60,
          "obs": "Pico de potência anaeróbia e produção rápida de lactato.",
          "cadence": "Máx Watts",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg08",
          "name": "Box Jump na Caixa (60cm) ou Salto Pliométrico",
          "sets": 4,
          "reps": "8 saltos",
          "rpe": 8,
          "rest": 60,
          "obs": "Ciclo alongamento-encurtamento com absorção suave de impacto.",
          "cadence": "Pliométrico",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "ab06",
          "name": "Prancha Isométrica com Carga ou Hollow Body",
          "sets": 3,
          "reps": "45s",
          "rpe": 8,
          "rest": 45,
          "obs": "Anti-extensão lombar rígida sob frequência cardíaca elevada.",
          "cadence": "Isometria",
          "resistProfile": "shortened"
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B · Metcon Glicolítico & Densidade (AMRAP)",
      "exercises": [
        {
          "exerciseId": "do01",
          "name": "Barra Fixa Estrita ou Kipping (Pull-up)",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Tração vertical ritmada com amplitude escapular completa.",
          "cadence": "Ritmo",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "pe19",
          "name": "Mergulho em Paralelas (Dips) ou Flexões no Solo",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Empurrada contínua mantendo cotovelos alinhados.",
          "cadence": "2-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "do01",
          "name": "Remo Concept2 RowErg (Tiros de 250m)",
          "sets": 5,
          "reps": "250m sprint",
          "rpe": 9,
          "rest": 60,
          "obs": "Depleção glicogênica e capacidade de tamponamento muscular.",
          "cadence": "Ritmo 28s/m",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg10",
          "name": "Kettlebell Swing Americano / Russo",
          "sets": 4,
          "reps": "15-20",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Extensão potente de quadril e ativação de glúteos.",
          "cadence": "Explosivo",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "ab03",
          "name": "Toes-to-Bar ou Elevação de Pernas Suspenso",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 45,
          "obs": "Flexão de tronco e força de pegada (grip) sustentada.",
          "cadence": "Controlado",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C · Metcon Chipper & Resistência Mista (For Time)",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Thrusters com Barra / Halteres (Agachamento + Press)",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 90,
          "obs": "Composto multiarticular exigindo capacidade cardiovascular extrema.",
          "cadence": "Fluido",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg07",
          "name": "Burpees com Salto sobre a Barra",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Movimento corporal dinâmico contínuo sem pausas longas.",
          "cadence": "Constante",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "sh18",
          "name": "Farmers Carry com Halteres / Kettlebells Pesados",
          "sets": 4,
          "reps": "50m",
          "rpe": 8.5,
          "rest": 90,
          "obs": "Transporte de carga sustentada sob respiração ofegante.",
          "cadence": "Passo Firme",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg01",
          "name": "Wall Balls com Medicine Ball (6/9kg)",
          "sets": 4,
          "reps": "20 reps",
          "rpe": 9,
          "rest": 60,
          "obs": "Agachamento completo e arremesso preciso no alvo de 3 metros.",
          "cadence": "Fluido",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "ab05",
          "name": "Abdominal Rollout na Roda ou Prancha Lateral",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 45,
          "obs": "Estabilização profunda de core para recuperação do SNC.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        }
      ]
    }
  ],
  "Sedentario": [
    {
      "id": "A",
      "name": "Treino A · Reativação Neuromotora Leve",
      "exercises": [
        {
          "exerciseId": "sed_01",
          "name": "Caminhada Contínua Leve em Ritmo Confortável (Z1)",
          "sets": 1,
          "reps": "15-20 min",
          "rpe": 4,
          "rest": 60,
          "obs": "Ritmo conversacional leve sem falta de ar.",
          "cadence": "Confortável",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "sed_02",
          "name": "Mobilidade Articular de Tornozelos e Quadril",
          "sets": 2,
          "reps": "10 cada lado",
          "rpe": 3.5,
          "rest": 30,
          "obs": "Movimentos suaves e sem dor articular.",
          "cadence": "Fluido",
          "resistProfile": "bodyweight"
        },
        {
          "exerciseId": "sed_03",
          "name": "Sentar e Levantar da Cadeira com Apoio",
          "sets": 2,
          "reps": "8-10",
          "rpe": 4.5,
          "rest": 60,
          "obs": "Manter a postura ereta ao subir e descer.",
          "cadence": "Controlado",
          "resistProfile": "bodyweight"
        },
        {
          "exerciseId": "sed_04",
          "name": "Alongamento Suave de Peitoral e Coluna Torácica",
          "sets": 2,
          "reps": "30s sustentação",
          "rpe": 3,
          "rest": 30,
          "obs": "Alívio da tensão postural sentada prolongada.",
          "cadence": "Estático",
          "resistProfile": "bodyweight"
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B · Estabilidade & Postura Básica",
      "exercises": [
        {
          "exerciseId": "sed_05",
          "name": "Caminhada Estacionária com Elevação Suave dos Joelhos",
          "sets": 3,
          "reps": "2 min",
          "rpe": 4,
          "rest": 60,
          "obs": "Ativação cardiovascular segura em casa ou consultório.",
          "cadence": "Cadenciado",
          "resistProfile": "bodyweight"
        },
        {
          "exerciseId": "sed_06",
          "name": "Ponte de Glúteos no Solo / Colchonete",
          "sets": 2,
          "reps": "8-10",
          "rpe": 4,
          "rest": 45,
          "obs": "Despertar dos glúteos e estabilização pélvica.",
          "cadence": "2-1-2-0",
          "resistProfile": "bodyweight"
        },
        {
          "exerciseId": "sed_07",
          "name": "Flexão de Braços na Parede (Wall Push-up)",
          "sets": 2,
          "reps": "8-10",
          "rpe": 4,
          "rest": 60,
          "obs": "Carga reduzida protegendo cotovelos e ombros.",
          "cadence": "2-1-2-0",
          "resistProfile": "bodyweight"
        },
        {
          "exerciseId": "sed_08",
          "name": "Exercício de Respiração Diafragmática & Relaxamento",
          "sets": 1,
          "reps": "5 min",
          "rpe": 2,
          "rest": 60,
          "obs": "Controle autonômico e redução do estresse basal.",
          "cadence": "Profundo",
          "resistProfile": "bodyweight"
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C · Resistência Muscular Funcional",
      "exercises": [
        {
          "exerciseId": "sed_09",
          "name": "Caminhada Leve com Mudanças Sutis de Ritmo",
          "sets": 1,
          "reps": "20 min",
          "rpe": 4.5,
          "rest": 60,
          "obs": "Caminhada contínua em terreno plano.",
          "cadence": "Livre",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "sed_10",
          "name": "Remada com Elástico Leve ou Toalha",
          "sets": 2,
          "reps": "10-12",
          "rpe": 4,
          "rest": 45,
          "obs": "Ativação dos romboides e postura do tronco.",
          "cadence": "Controlado",
          "resistProfile": "band"
        },
        {
          "exerciseId": "sed_11",
          "name": "Elevação de Calcanhares em Pé com Apoio (Panturrilhas)",
          "sets": 2,
          "reps": "12-15",
          "rpe": 4,
          "rest": 45,
          "obs": "Estímulo da bomba muscular da panturrilha para retorno venoso.",
          "cadence": "2-1-1-0",
          "resistProfile": "bodyweight"
        },
        {
          "exerciseId": "sed_12",
          "name": "Meta Diária de Passos Confortáveis (NEAT)",
          "sets": 1,
          "reps": "4.000 a 6.000 passos",
          "rpe": 3,
          "rest": 60,
          "obs": "Incentivo à movimentação espontânea diária.",
          "cadence": "Livre",
          "resistProfile": "daily"
        }
      ]
    }
  ],
  "Bro Split": [
    {
      "id": "A",
      "name": "Treino A · Peitoral & Reto Abdominal",
      "exercises": [
        {
          "exerciseId": "pe01",
          "name": "Supino Reto com Barra",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120,
          "obs": "Pausa de 1s no peito · arco torácico firme.",
          "cadence": "3-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "pe05",
          "name": "Supino Inclinado com Halteres",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Feixe clavicular com ADM ampliada.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "pe07",
          "name": "Crucifixo Reto com Halteres",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico a 90° de abdução com 1s pausa no fundo.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "pe13",
          "name": "Peck Deck / Voador (Máquina)",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico na adução máxima à frente com 1s ISO.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "ab02",
          "name": "Abdominal na Polia Alta com Corda",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60,
          "obs": "Carga progressiva no reto abdominal.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B · Dorsal, Lombar & Infra",
      "exercises": [
        {
          "exerciseId": "do01",
          "name": "Barra Fixa Pronada (Pull-up)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120,
          "obs": "Hang completo no fundo · tração vertical potente.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "do08",
          "name": "Remada Curvada com Barra (Pronada)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 90,
          "obs": "Retração escapular para romboides.",
          "cadence": "3-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "do04",
          "name": "Puxada Frontal Aberta na Polia",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Latíssimo no comprimento máximo.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "do07",
          "name": "Pulldown na Polia com Braços Retos",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Extensão de ombro com 1s ISO no quadril.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh18",
          "name": "Encolhimento com Barra (Shrug)",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Pico do trapézio superior no encurtamento.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "ab03",
          "name": "Elevação de Pernas na Barra Fixa",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60,
          "obs": "Core no comprimento máximo.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C · Membros Inferiores Completo",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Agachamento Livre com Barra (Back Squat)",
          "sets": 5,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 150,
          "obs": "Excêntrica de 4s protege LCA e tendão patelar.",
          "cadence": "4-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg10",
          "name": "Stiff com Barra (Terra Romeno)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120,
          "obs": "Pico de tensão passiva dos isquiotibiais.",
          "cadence": "4-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "lg03",
          "name": "Agachamento Hack (Máquina)",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Maior ADM sem sobrecarga axial lombar.",
          "cadence": "4-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "lg06",
          "name": "Cadeira Extensora",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico de ativação no encurtamento total.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "lg13",
          "name": "Cadeira Flexora Sentada",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Isquiotibiais encurtados · par do Stiff.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "lg20",
          "name": "Panturrilha em Pé na Máquina",
          "sets": 5,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Gastrocnêmio em máximo comprimento.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "D",
      "name": "Treino D · Deltoides, Trapézio & Oblíquos",
      "exercises": [
        {
          "exerciseId": "sh01",
          "name": "Desenvolvimento Militar em Pé (OHP)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 120,
          "obs": "Core blindado e glúteos contraídos.",
          "cadence": "3-0-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh09",
          "name": "Elevação Lateral Inclinada no Banco 45°",
          "sets": 5,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Deltoide medial em máximo comprimento.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "sh06",
          "name": "Elevação Lateral com Halteres",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 45,
          "obs": "Pico a 90° com 1s ISO no topo.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh15",
          "name": "Face Pull na Polia com Corda",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8.5,
          "rest": 45,
          "obs": "Deltoide posterior + manguito rotador.",
          "cadence": "2-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh18",
          "name": "Encolhimento com Barra (Shrug)",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Pico do trapézio superior no encurtamento.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "ab07",
          "name": "Russian Twist com Halter ou Anilha",
          "sets": 3,
          "reps": "20 reps",
          "rpe": 7.5,
          "rest": 45,
          "obs": "Rotação controlada com estabilidade pélvica.",
          "cadence": "2-0-1-0",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "E",
      "name": "Treino E · Braços Completos & Rollout",
      "exercises": [
        {
          "exerciseId": "bi01",
          "name": "Rosca Direta com Barra Reta",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 75,
          "obs": "Flexão pura de cotovelo sem impulso lombar.",
          "cadence": "3-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "tr04",
          "name": "Tríceps Testa com Barra W (Skull Crusher)",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 75,
          "obs": "Cabeça longa em máximo estiramento.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "bi09",
          "name": "Rosca Inclinada no Banco 45°",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 60,
          "obs": "Cabeça longa do bíceps no comprimento máximo.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "tr06",
          "name": "Tríceps Francês com Halter",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Ombro em flexão >90° alonga a cabeça longa.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "bi06",
          "name": "Rosca Scott com Barra W",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico de contração no topo com 1s ISO.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "tr01",
          "name": "Tríceps na Polia com Barra Reta",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico de EMG no encurtamento com 1s ISO.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "ab05",
          "name": "Abdominal Rollout (Roda Abdominal)",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Core no comprimento máximo.",
          "cadence": "3-0-2-0",
          "resistProfile": "stretched"
        }
      ]
    }
  ],
  "BroSplit": [
    {
      "id": "A",
      "name": "Treino A · Peitoral & Reto Abdominal",
      "exercises": [
        {
          "exerciseId": "pe01",
          "name": "Supino Reto com Barra",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120,
          "obs": "Pausa de 1s no peito · arco torácico firme.",
          "cadence": "3-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "pe05",
          "name": "Supino Inclinado com Halteres",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Feixe clavicular com ADM ampliada.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "pe07",
          "name": "Crucifixo Reto com Halteres",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico a 90° de abdução com 1s pausa no fundo.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "pe13",
          "name": "Peck Deck / Voador (Máquina)",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico na adução máxima à frente com 1s ISO.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "ab02",
          "name": "Abdominal na Polia Alta com Corda",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60,
          "obs": "Carga progressiva no reto abdominal.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B · Dorsal, Lombar & Infra",
      "exercises": [
        {
          "exerciseId": "do01",
          "name": "Barra Fixa Pronada (Pull-up)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120,
          "obs": "Hang completo no fundo · tração vertical potente.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "do08",
          "name": "Remada Curvada com Barra (Pronada)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 90,
          "obs": "Retração escapular para romboides.",
          "cadence": "3-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "do04",
          "name": "Puxada Frontal Aberta na Polia",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Latíssimo no comprimento máximo.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "do07",
          "name": "Pulldown na Polia com Braços Retos",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Extensão de ombro com 1s ISO no quadril.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh18",
          "name": "Encolhimento com Barra (Shrug)",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Pico do trapézio superior no encurtamento.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "ab03",
          "name": "Elevação de Pernas na Barra Fixa",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60,
          "obs": "Core no comprimento máximo.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C · Membros Inferiores Completo",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Agachamento Livre com Barra (Back Squat)",
          "sets": 5,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 150,
          "obs": "Excêntrica de 4s protege LCA e tendão patelar.",
          "cadence": "4-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg10",
          "name": "Stiff com Barra (Terra Romeno)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120,
          "obs": "Pico de tensão passiva dos isquiotibiais.",
          "cadence": "4-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "lg03",
          "name": "Agachamento Hack (Máquina)",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90,
          "obs": "Maior ADM sem sobrecarga axial lombar.",
          "cadence": "4-0-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "lg06",
          "name": "Cadeira Extensora",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico de ativação no encurtamento total.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "lg13",
          "name": "Cadeira Flexora Sentada",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Isquiotibiais encurtados · par do Stiff.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "lg20",
          "name": "Panturrilha em Pé na Máquina",
          "sets": 5,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Gastrocnêmio em máximo comprimento.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "D",
      "name": "Treino D · Deltoides, Trapézio & Oblíquos",
      "exercises": [
        {
          "exerciseId": "sh01",
          "name": "Desenvolvimento Militar em Pé (OHP)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 120,
          "obs": "Core blindado e glúteos contraídos.",
          "cadence": "3-0-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh09",
          "name": "Elevação Lateral Inclinada no Banco 45°",
          "sets": 5,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Deltoide medial em máximo comprimento.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "sh06",
          "name": "Elevação Lateral com Halteres",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 45,
          "obs": "Pico a 90° com 1s ISO no topo.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh15",
          "name": "Face Pull na Polia com Corda",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8.5,
          "rest": 45,
          "obs": "Deltoide posterior + manguito rotador.",
          "cadence": "2-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "sh18",
          "name": "Encolhimento com Barra (Shrug)",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Pico do trapézio superior no encurtamento.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "ab07",
          "name": "Russian Twist com Halter ou Anilha",
          "sets": 3,
          "reps": "20 reps",
          "rpe": 7.5,
          "rest": 45,
          "obs": "Rotação controlada com estabilidade pélvica.",
          "cadence": "2-0-1-0",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "E",
      "name": "Treino E · Braços Completos & Rollout",
      "exercises": [
        {
          "exerciseId": "bi01",
          "name": "Rosca Direta com Barra Reta",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 75,
          "obs": "Flexão pura de cotovelo sem impulso lombar.",
          "cadence": "3-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "tr04",
          "name": "Tríceps Testa com Barra W (Skull Crusher)",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 75,
          "obs": "Cabeça longa em máximo estiramento.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "bi09",
          "name": "Rosca Inclinada no Banco 45°",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 60,
          "obs": "Cabeça longa do bíceps no comprimento máximo.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "tr06",
          "name": "Tríceps Francês com Halter",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Ombro em flexão >90° alonga a cabeça longa.",
          "cadence": "3-1-1-0",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "bi06",
          "name": "Rosca Scott com Barra W",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico de contração no topo com 1s ISO.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "tr01",
          "name": "Tríceps na Polia com Barra Reta",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Pico de EMG no encurtamento com 1s ISO.",
          "cadence": "3-1-1-0",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "ab05",
          "name": "Abdominal Rollout (Roda Abdominal)",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Core no comprimento máximo.",
          "cadence": "3-0-2-0",
          "resistProfile": "stretched"
        }
      ]
    }
  ],
  "MetconHibrido": [
    {
      "id": "A",
      "name": "Treino A · Metcon Força & Potência Anaeróbia (EMOM)",
      "exercises": [
        {
          "exerciseId": "do16",
          "name": "Levantamento Terra Convencional / Trap Bar",
          "sets": 4,
          "reps": "5 reps",
          "rpe": 8.5,
          "rest": 90,
          "obs": "Força de tração máxima em bloco metabólico com saída explosiva.",
          "cadence": "Potente",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "sh01",
          "name": "Desenvolvimento Militar (Push Press / OHP)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 60,
          "obs": "Potência de ombro e estabilização de core sob fadiga.",
          "cadence": "Explosivo",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "lg01",
          "name": "AirBike / Echo Bike (Sprints de 30s)",
          "sets": 5,
          "reps": "30s tiros",
          "rpe": 9,
          "rest": 60,
          "obs": "Pico de potência anaeróbia e produção rápida de lactato.",
          "cadence": "Máx Watts",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg08",
          "name": "Box Jump na Caixa (60cm) ou Salto Pliométrico",
          "sets": 4,
          "reps": "8 saltos",
          "rpe": 8,
          "rest": 60,
          "obs": "Ciclo alongamento-encurtamento com absorção suave de impacto.",
          "cadence": "Pliométrico",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "ab06",
          "name": "Prancha Isométrica com Carga ou Hollow Body",
          "sets": 3,
          "reps": "45s",
          "rpe": 8,
          "rest": 45,
          "obs": "Anti-extensão lombar rígida sob frequência cardíaca elevada.",
          "cadence": "Isometria",
          "resistProfile": "shortened"
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B · Metcon Glicolítico & Densidade (AMRAP)",
      "exercises": [
        {
          "exerciseId": "do01",
          "name": "Barra Fixa Estrita ou Kipping (Pull-up)",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Tração vertical ritmada com amplitude escapular completa.",
          "cadence": "Ritmo",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "pe19",
          "name": "Mergulho em Paralelas (Dips) ou Flexões no Solo",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Empurrada contínua mantendo cotovelos alinhados.",
          "cadence": "2-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "do01",
          "name": "Remo Concept2 RowErg (Tiros de 250m)",
          "sets": 5,
          "reps": "250m sprint",
          "rpe": 9,
          "rest": 60,
          "obs": "Depleção glicogênica e capacidade de tamponamento muscular.",
          "cadence": "Ritmo 28s/m",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg10",
          "name": "Kettlebell Swing Americano / Russo",
          "sets": 4,
          "reps": "15-20",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Extensão potente de quadril e ativação de glúteos.",
          "cadence": "Explosivo",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "ab03",
          "name": "Toes-to-Bar ou Elevação de Pernas Suspenso",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 45,
          "obs": "Flexão de tronco e força de pegada (grip) sustentada.",
          "cadence": "Controlado",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C · Metcon Chipper & Resistência Mista (For Time)",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Thrusters com Barra / Halteres (Agachamento + Press)",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 90,
          "obs": "Composto multiarticular exigindo capacidade cardiovascular extrema.",
          "cadence": "Fluido",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg07",
          "name": "Burpees com Salto sobre a Barra",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Movimento corporal dinâmico contínuo sem pausas longas.",
          "cadence": "Constante",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "sh18",
          "name": "Farmers Carry com Halteres / Kettlebells Pesados",
          "sets": 4,
          "reps": "50m",
          "rpe": 8.5,
          "rest": 90,
          "obs": "Transporte de carga sustentada sob respiração ofegante.",
          "cadence": "Passo Firme",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg01",
          "name": "Wall Balls com Medicine Ball (6/9kg)",
          "sets": 4,
          "reps": "20 reps",
          "rpe": 9,
          "rest": 60,
          "obs": "Agachamento completo e arremesso preciso no alvo de 3 metros.",
          "cadence": "Fluido",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "ab05",
          "name": "Abdominal Rollout na Roda ou Prancha Lateral",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 45,
          "obs": "Estabilização profunda de core para recuperação do SNC.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        }
      ]
    }
  ],
  "Metcon_Hibrido": [
    {
      "id": "A",
      "name": "Treino A · Metcon Força & Potência Anaeróbia (EMOM)",
      "exercises": [
        {
          "exerciseId": "do16",
          "name": "Levantamento Terra Convencional / Trap Bar",
          "sets": 4,
          "reps": "5 reps",
          "rpe": 8.5,
          "rest": 90,
          "obs": "Força de tração máxima em bloco metabólico com saída explosiva.",
          "cadence": "Potente",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "sh01",
          "name": "Desenvolvimento Militar (Push Press / OHP)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 60,
          "obs": "Potência de ombro e estabilização de core sob fadiga.",
          "cadence": "Explosivo",
          "resistProfile": "shortened"
        },
        {
          "exerciseId": "lg01",
          "name": "AirBike / Echo Bike (Sprints de 30s)",
          "sets": 5,
          "reps": "30s tiros",
          "rpe": 9,
          "rest": 60,
          "obs": "Pico de potência anaeróbia e produção rápida de lactato.",
          "cadence": "Máx Watts",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg08",
          "name": "Box Jump na Caixa (60cm) ou Salto Pliométrico",
          "sets": 4,
          "reps": "8 saltos",
          "rpe": 8,
          "rest": 60,
          "obs": "Ciclo alongamento-encurtamento com absorção suave de impacto.",
          "cadence": "Pliométrico",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "ab06",
          "name": "Prancha Isométrica com Carga ou Hollow Body",
          "sets": 3,
          "reps": "45s",
          "rpe": 8,
          "rest": 45,
          "obs": "Anti-extensão lombar rígida sob frequência cardíaca elevada.",
          "cadence": "Isometria",
          "resistProfile": "shortened"
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B · Metcon Glicolítico & Densidade (AMRAP)",
      "exercises": [
        {
          "exerciseId": "do01",
          "name": "Barra Fixa Estrita ou Kipping (Pull-up)",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Tração vertical ritmada com amplitude escapular completa.",
          "cadence": "Ritmo",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "pe19",
          "name": "Mergulho em Paralelas (Dips) ou Flexões no Solo",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60,
          "obs": "Empurrada contínua mantendo cotovelos alinhados.",
          "cadence": "2-0-1-0",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "do01",
          "name": "Remo Concept2 RowErg (Tiros de 250m)",
          "sets": 5,
          "reps": "250m sprint",
          "rpe": 9,
          "rest": 60,
          "obs": "Depleção glicogênica e capacidade de tamponamento muscular.",
          "cadence": "Ritmo 28s/m",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg10",
          "name": "Kettlebell Swing Americano / Russo",
          "sets": 4,
          "reps": "15-20",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Extensão potente de quadril e ativação de glúteos.",
          "cadence": "Explosivo",
          "resistProfile": "stretched"
        },
        {
          "exerciseId": "ab03",
          "name": "Toes-to-Bar ou Elevação de Pernas Suspenso",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8,
          "rest": 45,
          "obs": "Flexão de tronco e força de pegada (grip) sustentada.",
          "cadence": "Controlado",
          "resistProfile": "stretched"
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C · Metcon Chipper & Resistência Mista (For Time)",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Thrusters com Barra / Halteres (Agachamento + Press)",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 90,
          "obs": "Composto multiarticular exigindo capacidade cardiovascular extrema.",
          "cadence": "Fluido",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg07",
          "name": "Burpees com Salto sobre a Barra",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8.5,
          "rest": 60,
          "obs": "Movimento corporal dinâmico contínuo sem pausas longas.",
          "cadence": "Constante",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "sh18",
          "name": "Farmers Carry com Halteres / Kettlebells Pesados",
          "sets": 4,
          "reps": "50m",
          "rpe": 8.5,
          "rest": 90,
          "obs": "Transporte de carga sustentada sob respiração ofegante.",
          "cadence": "Passo Firme",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "lg01",
          "name": "Wall Balls com Medicine Ball (6/9kg)",
          "sets": 4,
          "reps": "20 reps",
          "rpe": 9,
          "rest": 60,
          "obs": "Agachamento completo e arremesso preciso no alvo de 3 metros.",
          "cadence": "Fluido",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "ab05",
          "name": "Abdominal Rollout na Roda ou Prancha Lateral",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 45,
          "obs": "Estabilização profunda de core para recuperação do SNC.",
          "cadence": "3-0-1-0",
          "resistProfile": "stretched"
        }
      ]
    }
  ],
  "Sedentary": [
    {
      "id": "A",
      "name": "Treino A · Reativação Neuromotora Leve",
      "exercises": [
        {
          "exerciseId": "sed_01",
          "name": "Caminhada Contínua Leve em Ritmo Confortável (Z1)",
          "sets": 1,
          "reps": "15-20 min",
          "rpe": 4,
          "rest": 60,
          "obs": "Ritmo conversacional leve sem falta de ar.",
          "cadence": "Confortável",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "sed_02",
          "name": "Mobilidade Articular de Tornozelos e Quadril",
          "sets": 2,
          "reps": "10 cada lado",
          "rpe": 3.5,
          "rest": 30,
          "obs": "Movimentos suaves e sem dor articular.",
          "cadence": "Fluido",
          "resistProfile": "bodyweight"
        },
        {
          "exerciseId": "sed_03",
          "name": "Sentar e Levantar da Cadeira com Apoio",
          "sets": 2,
          "reps": "8-10",
          "rpe": 4.5,
          "rest": 60,
          "obs": "Manter a postura ereta ao subir e descer.",
          "cadence": "Controlado",
          "resistProfile": "bodyweight"
        },
        {
          "exerciseId": "sed_04",
          "name": "Alongamento Suave de Peitoral e Coluna Torácica",
          "sets": 2,
          "reps": "30s sustentação",
          "rpe": 3,
          "rest": 30,
          "obs": "Alívio da tensão postural sentada prolongada.",
          "cadence": "Estático",
          "resistProfile": "bodyweight"
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B · Estabilidade & Postura Básica",
      "exercises": [
        {
          "exerciseId": "sed_05",
          "name": "Caminhada Estacionária com Elevação Suave dos Joelhos",
          "sets": 3,
          "reps": "2 min",
          "rpe": 4,
          "rest": 60,
          "obs": "Ativação cardiovascular segura em casa ou consultório.",
          "cadence": "Cadenciado",
          "resistProfile": "bodyweight"
        },
        {
          "exerciseId": "sed_06",
          "name": "Ponte de Glúteos no Solo / Colchonete",
          "sets": 2,
          "reps": "8-10",
          "rpe": 4,
          "rest": 45,
          "obs": "Despertar dos glúteos e estabilização pélvica.",
          "cadence": "2-1-2-0",
          "resistProfile": "bodyweight"
        },
        {
          "exerciseId": "sed_07",
          "name": "Flexão de Braços na Parede (Wall Push-up)",
          "sets": 2,
          "reps": "8-10",
          "rpe": 4,
          "rest": 60,
          "obs": "Carga reduzida protegendo cotovelos e ombros.",
          "cadence": "2-1-2-0",
          "resistProfile": "bodyweight"
        },
        {
          "exerciseId": "sed_08",
          "name": "Exercício de Respiração Diafragmática & Relaxamento",
          "sets": 1,
          "reps": "5 min",
          "rpe": 2,
          "rest": 60,
          "obs": "Controle autonômico e redução do estresse basal.",
          "cadence": "Profundo",
          "resistProfile": "bodyweight"
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C · Resistência Muscular Funcional",
      "exercises": [
        {
          "exerciseId": "sed_09",
          "name": "Caminhada Leve com Mudanças Sutis de Ritmo",
          "sets": 1,
          "reps": "20 min",
          "rpe": 4.5,
          "rest": 60,
          "obs": "Caminhada contínua em terreno plano.",
          "cadence": "Livre",
          "resistProfile": "uniform"
        },
        {
          "exerciseId": "sed_10",
          "name": "Remada com Elástico Leve ou Toalha",
          "sets": 2,
          "reps": "10-12",
          "rpe": 4,
          "rest": 45,
          "obs": "Ativação dos romboides e postura do tronco.",
          "cadence": "Controlado",
          "resistProfile": "band"
        },
        {
          "exerciseId": "sed_11",
          "name": "Elevação de Calcanhares em Pé com Apoio (Panturrilhas)",
          "sets": 2,
          "reps": "12-15",
          "rpe": 4,
          "rest": 45,
          "obs": "Estímulo da bomba muscular da panturrilha para retorno venoso.",
          "cadence": "2-1-1-0",
          "resistProfile": "bodyweight"
        },
        {
          "exerciseId": "sed_12",
          "name": "Meta Diária de Passos Confortáveis (NEAT)",
          "sets": 1,
          "reps": "4.000 a 6.000 passos",
          "rpe": 3,
          "rest": 60,
          "obs": "Incentivo à movimentação espontânea diária.",
          "cadence": "Livre",
          "resistProfile": "daily"
        }
      ]
    }
  ],
  "UPLOWER": [
    {
      "id": "A",
      "name": "Treino A — Upper Força",
      "exercises": [
        {
          "exerciseId": "pe01",
          "name": "Supino Reto com Barra",
          "sets": 4,
          "reps": "5-8",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "do01",
          "name": "Barra Fixa Pronada (Pull-up)",
          "sets": 4,
          "reps": "5-8",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "sh01",
          "name": "Desenvolvimento Militar em Pé (Overhead)",
          "sets": 3,
          "reps": "6-8",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "tr01",
          "name": "Tríceps na Polia com Barra Reta (Pushdown)",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 60
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Lower Força",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Agachamento Livre com Barra (Back Squat)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 150
        },
        {
          "exerciseId": "lg10",
          "name": "Stiff com Barra (Terra Romeno)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "lg04",
          "name": "Leg Press 45°",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "lg20",
          "name": "Panturrilha em Pé na Máquina",
          "sets": 4,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Upper Hipertrofia",
      "exercises": [
        {
          "exerciseId": "pe05",
          "name": "Supino Inclinado com Halteres",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "do04",
          "name": "Puxada Frontal Aberta na Polia",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "sh06",
          "name": "Elevação Lateral com Halteres",
          "sets": 4,
          "reps": "12-15",
          "rpe": 8,
          "rest": 45
        },
        {
          "exerciseId": "bi01",
          "name": "Rosca Direta com Barra Reta",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8,
          "rest": 60
        }
      ]
    },
    {
      "id": "D",
      "name": "Treino D — Lower Hipertrofia",
      "exercises": [
        {
          "exerciseId": "lg03",
          "name": "Agachamento Hack (Máquina)",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "lg06",
          "name": "Cadeira Extensora",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8.5,
          "rest": 60
        },
        {
          "exerciseId": "lg13",
          "name": "Cadeira Flexora Sentada",
          "sets": 3,
          "reps": "10-12",
          "rpe": 8.5,
          "rest": 60
        },
        {
          "exerciseId": "lg15",
          "name": "Elevação Pélvica com Barra (Hip Thrust)",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8.5,
          "rest": 90
        }
      ]
    }
  ],
  "FBODY": [
    {
      "id": "A",
      "name": "Treino A — Full Body Squat & Push",
      "exercises": [
        {
          "exerciseId": "lg01",
          "name": "Agachamento Livre com Barra (Back Squat)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "pe01",
          "name": "Supino Reto com Barra",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "do08",
          "name": "Remada Curvada com Barra (Pronada)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "ab06",
          "name": "Prancha Isométrica no Solo (Plank)",
          "sets": 3,
          "reps": "45s",
          "rpe": 8,
          "rest": 45
        }
      ]
    },
    {
      "id": "B",
      "name": "Treino B — Full Body Hinge & Pull",
      "exercises": [
        {
          "exerciseId": "lg10",
          "name": "Stiff com Barra (Terra Romeno)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "do01",
          "name": "Barra Fixa Pronada (Pull-up)",
          "sets": 4,
          "reps": "6-8",
          "rpe": 8.5,
          "rest": 120
        },
        {
          "exerciseId": "sh01",
          "name": "Desenvolvimento Militar em Pé (Overhead)",
          "sets": 3,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "ab03",
          "name": "Elevação de Pernas na Barra Fixa (Hanging Leg Raise)",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 60
        }
      ]
    },
    {
      "id": "C",
      "name": "Treino C — Full Body Hipertrofia",
      "exercises": [
        {
          "exerciseId": "lg04",
          "name": "Leg Press 45°",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "pe05",
          "name": "Supino Inclinado com Halteres",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "do04",
          "name": "Puxada Frontal Aberta na Polia",
          "sets": 4,
          "reps": "8-10",
          "rpe": 8,
          "rest": 90
        },
        {
          "exerciseId": "sh06",
          "name": "Elevação Lateral com Halteres",
          "sets": 3,
          "reps": "12-15",
          "rpe": 8,
          "rest": 45
        }
      ]
    }
  ]
});

  /**
   * Normaliza qualquer chave ou alias de divisão para o identificador canônico
   * @param {string} splitKey 
   * @returns {string}
   */
  function normalizeSplitKey(splitKey) {
    if (!splitKey || typeof splitKey !== 'string') return 'HYROX';
    const s = splitKey.trim();
    const lower = s.toLowerCase();

    if (lower === 'bro split' || lower === 'brosplit' || lower === 'abcde') return 'ABCDE';
    if (lower === 'uplower' || lower === 'upper/lower' || lower === 'upper_lower' || lower === 'superior_inferior' || lower === 'upperlower') return 'UpperLower';
    if (lower === 'fbody' || lower === 'full body' || lower === 'full_body' || lower === 'corpo inteiro' || lower === 'fullbody') return 'FullBody';
    if (lower === 'metconhibrido' || lower === 'metcon_hibrido' || lower === 'metcon') return 'Metcon';
    if (lower === 'sedentary' || lower === 'sedentario' || lower === 'sedentário') return 'Sedentario';
    if (lower === 'hiit_forca' || lower === 'hiit forca' || lower === 'hiit força' || lower === 'hiit_musculacao') return 'HIIT_Forca';
    if (lower === 'funcionalmisto' || lower === 'funcional misto') return 'FuncionalMisto';
    if (lower === 'runningstrength' || lower === 'corrida_musculacao' || lower === 'corrida + forca') return 'RunningStrength';
    if (lower === 'ciclismo_forca' || lower === 'ciclismo + forca') return 'Ciclismo_Forca';
    if (lower === 'esportescoletivos' || lower === 'esportes coletivos') return 'EsportesColetivos';
    if (lower === 'mistocardio' || lower === 'misto cardio') return 'MistoCardio';
    if (lower === 'corrida_endurance' || lower === 'corrida endurance') return 'Corrida_Endurance';
    if (lower === 'ciclismo_endurance' || lower === 'ciclismo endurance') return 'Ciclismo_Endurance';
    if (lower === 'aerobico_geral' || lower === 'aeróbico geral' || lower === 'aerobico') return 'Aerobico_Geral';
    if (lower === 'ppl' || lower === 'push pull legs' || lower === 'push/pull/legs') return 'PPL';
    if (lower === 'phat') return 'PHAT';
    if (lower === 'dup') return 'DUP';
    if (lower === 'abcd') return 'ABCD';
    if (lower === 'natacao' || lower === 'natação') return 'Natacao';
    if (lower === 'lutas' || lower === 'luta') return 'Lutas';
    if (lower === 'calistenia') return 'Calistenia';
    if (lower === 'triathlon') return 'Triathlon';
    if (lower === 'crossfit') return 'CrossFit';
    if (lower === 'hyrox') return 'HYROX';

    // Se chave direta existe no catálogo, preserva
    if (TRAINING_SPLITS[s]) return s;

    return 'HYROX';
  }

  /**
   * Inferência Canônica Unificada da Divisão de Treino a partir da Anamnese e Frequência Semanal
   * Unifica perfInferSplitFromAnamnese (app.js) e inferSplitFromModality (page.tsx).
   * @param {string} modality - Modalidade preferida declarada na anamnese
   * @param {number|string|null} frequency - Frequência semanal relatada
   * @returns {string} Divisão de treino inferida
   */
  function inferSplitFromModality(modality, frequency = null) {
    if (!modality || typeof modality !== 'string') return 'HYROX';
    const m = modality.toLowerCase().trim();

    // 1. Modalidades Híbridas & Racing
    if (m.includes('hyrox') || m.includes('racing')) return 'HYROX';
    if (m.includes('metcon') || m.includes('condicionamento metab')) return 'Metcon';
    if (m.includes('crossfit')) return 'CrossFit';
    if (m.includes('triathlon')) return 'Triathlon';
    if (m.includes('hiit')) return 'HIIT_Forca';
    if (m.includes('ciclismo') && (m.includes('força') || m.includes('forca') || m.includes('muscula'))) return 'Ciclismo_Forca';
    if (m.includes('corrida') && (m.includes('muscula') || m.includes('concorrente'))) return 'RunningStrength';
    if (m.includes('funcional misto') || m.includes('funcional_misto')) return 'FuncionalMisto';
    if (m.includes('esportes coletivos') || m.includes('esportes_coletivos') || m.includes('futebol') || m.includes('basquete') || m.includes('volei') || m.includes('vôlei')) return 'EsportesColetivos';
    if (m.includes('misto') && (m.includes('força') || m.includes('forca') || m.includes('cardio'))) return 'MistoCardio';

    // 2. Modalidades Específicas Puras
    if (m.includes('luta') || m.includes('artes marciais') || m.includes('artes_marciais') || m.includes('boxe') || m.includes('jiu') || m.includes('muay') || m.includes('judo') || m.includes('judô')) return 'Lutas';
    if (m.includes('natação') || m.includes('natacao')) return 'Natacao';
    if (m.includes('ciclismo') || m.includes('spinning')) return 'Ciclismo_Endurance';
    if (m.includes('corrida') || m.includes('endurance')) return 'Corrida_Endurance';
    if (m.includes('calistenia')) return 'Calistenia';
    if (m.includes('aeróbico') || m.includes('aerobico')) return 'Aerobico_Geral';
    if (m.includes('funcional')) return 'FuncionalMisto';

    // 3. Musculação / Hipertrofia Tradicional (Calibrada pela Frequência)
    if (m.includes('musculação') || m.includes('musculacao') || m.includes('hipertrofia') || m.includes('força') || m.includes('forca') || m.includes('bodybuilding') || m.includes('powerlifting')) {
      const freqMatch = String(frequency || '').match(/\d+/);
      const freqNum = freqMatch ? parseInt(freqMatch[0], 10) : 4;
      if (freqNum <= 3) return 'PPL';
      if (freqNum === 4) return 'UpperLower';
      if (freqNum === 5) return 'PHAT';
      if (freqNum >= 6) return 'PPL';
      return 'PPL';
    }

    // 4. Sedentário / Readaptação
    if (m.includes('sedentário') || m.includes('sedentario') || m.includes('nenhum') || m.includes('inativo')) return 'Sedentario';

    return 'HYROX';
  }

  return {
    TRAINING_SPLITS,
    PERF_SPLIT_PRESETS,
    normalizeSplitKey,
    inferSplitFromModality,
    perfInferSplitFromAnamnese: inferSplitFromModality
  };
});
