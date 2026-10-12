/**
 * domain/training/EquipmentService.js
 * 
 * Serviço Canônico de Equipamentos e Compatibilidade Biomecânica.
 * Mapeia equipamentos disponíveis do praticante, valida exequibilidade
 * de exercícios e rotinas, e sugere substituições técnicas coerentes
 * informando eventuais alterações no perfil do estímulo.
 * 
 * Camada de Domínio Puro — Sem dependência de DOM, Dexie ou Firebase.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.EquipmentService = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Catálogo de Ambientes de Treino e Equipamentos Padrão Associados
   */
  const TRAINING_ENVIRONMENTS = Object.freeze({
    ACADEMIA_COMPLETA: {
      id: 'academia_completa',
      label: 'Academia Comercial Completa',
      equipment: [
        'barra_olimpica', 'halteres', 'banco_reto', 'banco_inclinado', 'anilhas',
        'crossover_polias', 'leg_press', 'cadeira_extensora', 'cadeira_flexora',
        'hack_machine', 'barra_fixa', 'paralelas', 'esteira', 'bike_ergometrica',
        'remo_rowerg', 'kettlebells', 'caixa_salto', 'tatame'
      ]
    },
    HOME_GYM_BASICA: {
      id: 'home_gym_basica',
      label: 'Home Gym Básica (Halteres e Elásticos)',
      equipment: [
        'halteres_ajustaveis', 'elasticos_minibands', 'colchonete', 'banco_simples',
        'peso_corporal'
      ]
    },
    CALISTENIA_PARQUE: {
      id: 'calistenia_parque',
      label: 'Parque / Estrutura de Calistenia',
      equipment: [
        'barra_fixa', 'paralelas', 'espaldar', 'chao_solo', 'peso_corporal',
        'argolas_ginasticas'
      ]
    },
    AR_LIVRE_CORRIDA: {
      id: 'ar_livre_corrida',
      label: 'Rua / Pista de Corrida',
      equipment: [
        'tenis_corrida', 'asfalto_pista', 'relogio_gps'
      ]
    },
    CICLISMO_ESTRADA: {
      id: 'ciclismo_estrada',
      label: 'Ciclismo de Estrada / Rolo Smart',
      equipment: [
        'bicicleta_estrada', 'capacete', 'rolo_treino', 'potenciometro'
      ]
    },
    PISCINA: {
      id: 'piscina',
      label: 'Piscina Olímpica / Semi-Olímpica',
      equipment: [
        'piscina', 'oculos_natacao', 'prancha', 'pullbuoy', 'palmares'
      ]
    },
    BOX_CROSSFIT_HYROX: {
      id: 'box_crossfit_hyrox',
      label: 'Box de CrossFit / Centro HYROX',
      equipment: [
        'barra_olimpica', 'anilhas_bumper', 'rig_barra_fixa', 'argolas',
        'skierg', 'rowerg', 'airbike', 'sled_treno', 'sandbag', 'wall_ball',
        'kettlebells', 'caixa_salto'
      ]
    },
    CASA_SEM_EQUIPAMENTOS: {
      id: 'casa_sem_equipamentos',
      label: 'Casa Sem Equipamentos (Apenas Peso Corporal)',
      equipment: [
        'peso_corporal', 'chao_solo', 'cadeira_comum', 'toalha_parede'
      ]
    }
  });

  /**
   * Tabela de Substituições Biomecanicamente Equivalentes
   * Define substituto alternativo, alteração no perfil de resistência e nota técnica.
   */
  const EQUIVALENCE_SUBSTITUTIONS = Object.freeze({
    // ── Peitoral ──
    'pe01': [ // Supino Reto com Barra
      { id: 'pe04', name: 'Supino Reto com Halteres', reqEquip: ['halteres', 'banco_reto'], stimulusDiff: 'ADM ampliada no fundo; maior demanda de estabilização do ombro.', equivalenceScore: 0.95 },
      { id: 'pe18', name: 'Flexão de Braços no Solo', reqEquip: ['peso_corporal'], stimulusDiff: 'Carga limitada pelo peso corporal; sem sobrecarga máxima miofibrilar.', equivalenceScore: 0.75 },
      { id: 'pe14', name: 'Supino Máquina Sentado', reqEquip: ['maquinas_polias'], stimulusDiff: 'Estabilidade guiada; ausência de sinergismo estabilizador.', equivalenceScore: 0.90 }
    ],
    // ── Dorsal / Costas ──
    'do01': [ // Barra Fixa Pronada
      { id: 'do04', name: 'Puxada Frontal Aberta na Polia', reqEquip: ['crossover_polias'], stimulusDiff: 'Mesmo plano de tração vertical; permite regulagem milimétrica de carga.', equivalenceScore: 0.92 },
      { id: 'do08_inv', name: 'Remada Australiana em Barra Baixa / Argolas', reqEquip: ['barra_fixa', 'peso_corporal'], stimulusDiff: 'Plano mais horizontal; menor sobrecarga absoluta.', equivalenceScore: 0.80 }
    ],
    // ── Quadríceps / Agachamento ──
    'lg01': [ // Agachamento Livre com Barra
      { id: 'lg04', name: 'Leg Press 45°', reqEquip: ['leg_press'], stimulusDiff: 'Elimina sobrecarga axial na coluna lombar; foco puro em quadríceps/glúteo.', equivalenceScore: 0.90 },
      { id: 'lg07', name: 'Agachamento Búlgaro com Halteres', reqEquip: ['halteres', 'banco_simples'], stimulusDiff: 'Sobrecarga unilateral; maior demanda de estabilidade pélvica.', equivalenceScore: 0.88 },
      { id: 'lg01_body', name: 'Agachamento com Peso Corporal (Air Squat)', reqEquip: ['peso_corporal'], stimulusDiff: 'Estímulo de resistência muscular; ausência de sobrecarga hipertrófica pesada.', equivalenceScore: 0.65 }
    ],
    // ── Isquiotibiais ──
    'lg10': [ // Stiff com Barra
      { id: 'lg10_dumb', name: 'Stiff com Halteres', reqEquip: ['halteres'], stimulusDiff: 'Pegada livre permite alinhamento anatômico mais confortável de punhos.', equivalenceScore: 0.95 },
      { id: 'lg10_uni', name: 'Stiff Unilateral com Halter', reqEquip: ['halteres'], stimulusDiff: 'Equilíbrio unilateral e maior ativação de glúteo médio.', equivalenceScore: 0.85 }
    ],
    // ── Ergômetros HYROX / Cardio ──
    'skierg_comp': [
      { id: 'burpee_jump', name: 'Burpee Broad Jumps com Ritmo Controlado', reqEquip: ['peso_corporal'], stimulusDiff: 'Alta demanda metabólica do tronco superior e pernas, sem ergômetro.', equivalenceScore: 0.78 },
      { id: 'rowerg_sub', name: 'Remo RowErg em Tiros Fortes', reqEquip: ['remo_rowerg'], stimulusDiff: 'Alta demanda de dorsal e cadeia posterior no ergômetro.', equivalenceScore: 0.85 }
    ],
    'sled_push_comp': [
      { id: 'leg_press_heavy', name: 'Leg Press 45° Pesado com Passadas Curtas', reqEquip: ['leg_press'], stimulusDiff: 'Empurrada pesada de membros inferiores sem vetor horizontal.', equivalenceScore: 0.80 },
      { id: 'plate_push', name: 'Empurrão de Anilha no Piso Aderente', reqEquip: ['anilhas'], stimulusDiff: 'Simula a inclinação de tronco do trenó com carga moderada.', equivalenceScore: 0.88 }
    ],
    'sled_pull_comp': [
      { id: 'rope_cable_pull', name: 'Puxada de Corda na Polia Baixa', reqEquip: ['crossover_polias'], stimulusDiff: 'Tração contínua de membros superiores e costas com isometria de pernas.', equivalenceScore: 0.82 }
    ]
  });

  /**
   * Normaliza lista de equipamentos do paciente
   * @param {Array<string>|string|null} userEquipment
   * @returns {Set<string>}
   */
  function normalizeEquipmentList(userEquipment) {
    const equipSet = new Set();
    if (!userEquipment) return equipSet;

    if (Array.isArray(userEquipment)) {
      userEquipment.forEach(e => {
        if (typeof e === 'string' && e.trim()) {
          equipSet.add(e.trim().toLowerCase().replace(/\s+/g, '_'));
        }
      });
    } else if (typeof userEquipment === 'string') {
      userEquipment.split(/[,;\n]+/).forEach(e => {
        if (e.trim()) {
          equipSet.add(e.trim().toLowerCase().replace(/\s+/g, '_'));
        }
      });
    }

    // Se possui academia completa, inclui todo o rol de academia
    if (equipSet.has('academia_completa') || equipSet.has('academia') || equipSet.has('todos')) {
      TRAINING_ENVIRONMENTS.ACADEMIA_COMPLETA.equipment.forEach(e => equipSet.add(e));
    }

    // Peso corporal está sempre disponível
    equipSet.add('peso_corporal');
    equipSet.add('chao_solo');

    return equipSet;
  }

  /**
   * Verifica se os equipamentos necessários para um exercício estão disponíveis
   * @param {Array<string>} requiredEquip - Equipamentos requeridos pelo exercício
   * @param {Set<string>|Array<string>} availableEquip - Equipamentos disponíveis do praticante
   * @returns {{ isFeasible: boolean, missingEquip: Array<string> }}
   */
  function checkExerciseFeasibility(requiredEquip, availableEquip) {
    const availSet = availableEquip instanceof Set ? availableEquip : normalizeEquipmentList(availableEquip);
    if (!Array.isArray(requiredEquip) || requiredEquip.length === 0) {
      return { isFeasible: true, missingEquip: [] };
    }

    const missing = [];
    requiredEquip.forEach(req => {
      const normReq = req.toLowerCase().trim().replace(/\s+/g, '_');
      // Casos especiais de flexibilidade (ex: "barra_ou_halteres")
      if (normReq.includes('_ou_')) {
        const options = normReq.split('_ou_');
        const hasAny = options.some(opt => availSet.has(opt));
        if (!hasAny) missing.push(req);
      } else {
        if (!availSet.has(normReq) && !availSet.has('academia_completa')) {
          missing.push(req);
        }
      }
    });

    return {
      isFeasible: missing.length === 0,
      missingEquip: missing
    };
  }

  /**
   * Encontra a melhor substituição biomecânica para um exercício inexequível
   * @param {string} exerciseId - ID do exercício original
   * @param {Set<string>|Array<string>} availableEquip - Equipamentos disponíveis
   * @returns {Object|null} Substituição recomendada com explicação técnica
   */
  function findBestSubstitution(exerciseId, availableEquip) {
    const availSet = availableEquip instanceof Set ? availableEquip : normalizeEquipmentList(availableEquip);
    const subList = EQUIVALENCE_SUBSTITUTIONS[exerciseId];
    if (!Array.isArray(subList) || subList.length === 0) return null;

    for (const sub of subList) {
      const feasibility = checkExerciseFeasibility(sub.reqEquip, availSet);
      if (feasibility.isFeasible) {
        return {
          originalId: exerciseId,
          replacementId: sub.id,
          replacementName: sub.name,
          equivalenceScore: sub.equivalenceScore,
          stimulusDifference: sub.stimulusDiff,
          requiredEquipment: sub.reqEquip,
          isFeasible: true
        };
      }
    }

    return null;
  }

  return {
    TRAINING_ENVIRONMENTS,
    EQUIVALENCE_SUBSTITUTIONS,
    normalizeEquipmentList,
    checkExerciseFeasibility,
    findBestSubstitution
  };
});
