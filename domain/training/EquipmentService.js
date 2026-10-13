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
    'ex_str_bench_press_barbell': [
      { id: 'ex_str_bench_press_dumbbell', name: 'Supino Reto com Halteres', reqEquip: ['halteres', 'banco_reto'], stimulusDiff: 'ADM ampliada no fundo; maior demanda de estabilização do ombro.', equivalenceScore: 0.95 },
      { id: 'pe04', name: 'Supino Reto com Halteres', reqEquip: ['halteres', 'banco_reto'], stimulusDiff: 'ADM ampliada no fundo; maior demanda de estabilização do ombro.', equivalenceScore: 0.95 },
      { id: 'pe18', name: 'Flexão de Braços no Solo', reqEquip: ['peso_corporal'], stimulusDiff: 'Carga limitada pelo peso corporal; sem sobrecarga máxima miofibrilar.', equivalenceScore: 0.75 }
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
    ],
    // ── Corrida / Esteira → Ergômetros ──
    'hiit_esteira_sprint': [
      { id: 'hiit_row_sprint', name: '[MÓDULO HIIT] Tiros Máximos no Remo Concept2 RowErg', reqEquip: ['remo_rowerg', 'rowerg'], stimulusDiff: 'Alta demanda metabólica no ergômetro sem impacto articular de corrida.', equivalenceScore: 0.95 },
      { id: 'hiit_skierg_sprint', name: '[MÓDULO HIIT] Intervalos de Alta Potência no SkiErg Concept2', reqEquip: ['skierg'], stimulusDiff: 'Estímulo de tronco superior e cadeia anterior no ergômetro sem impacto de corrida.', equivalenceScore: 0.92 },
      { id: 'hiit_airbike_sprint', name: '[MÓDULO HIIT] Sprints 20s/40s na AirBike / Echo Bike', reqEquip: ['airbike'], stimulusDiff: 'Estímulo metabólico anaeróbio total sem impacto articular axial.', equivalenceScore: 0.90 }
    ],
    'corrida_rua': [
      { id: 'rowerg_sub', name: 'Sessão Contínua Z2 no Remo RowErg', reqEquip: ['remo_rowerg', 'rowerg'], stimulusDiff: 'Capacidade aeróbica contínua sem estresse de impacto em asfalto.', equivalenceScore: 0.90 },
      { id: 'skierg_sub', name: 'Sessão Contínua Z2 no SkiErg Concept2', reqEquip: ['skierg'], stimulusDiff: 'Trabalho cardiovascular contínuo no ergômetro.', equivalenceScore: 0.88 },
      { id: 'airbike_sub', name: 'Cardio Contínuo na AirBike / Echo Bike', reqEquip: ['airbike'], stimulusDiff: 'Trabalho de baixo impacto articular com alto recrutamento oxidativo.', equivalenceScore: 0.88 }
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
          const norm = e.trim().toLowerCase().replace(/\s+/g, '_');
          equipSet.add(norm);
          // Mapeia sinônimos comuns
          if (norm.includes('ski_erg') || norm === 'skierg') { equipSet.add('skierg'); equipSet.add('ski_erg'); }
          if (norm.includes('row_erg') || norm === 'rowerg' || norm.includes('remo')) { equipSet.add('rowerg'); equipSet.add('remo_rowerg'); equipSet.add('remo'); }
          if (norm.includes('air_bike') || norm === 'airbike' || norm.includes('echo_bike')) { equipSet.add('airbike'); equipSet.add('echo_bike'); }
          if (norm.includes('barra')) { equipSet.add('barra_olimpica'); equipSet.add('barra'); }
          if (norm.includes('halter')) { equipSet.add('halteres'); equipSet.add('halteres_ajustaveis'); }
          if (norm.includes('leg_press')) { equipSet.add('leg_press'); }
          if (norm.includes('polia') || norm.includes('crossover')) { equipSet.add('crossover_polias'); }
        }
      });
    } else if (typeof userEquipment === 'string') {
      userEquipment.split(/[,;\n]+/).forEach(e => {
        if (e.trim()) {
          const norm = e.trim().toLowerCase().replace(/\s+/g, '_');
          equipSet.add(norm);
          if (norm.includes('ski_erg') || norm === 'skierg') { equipSet.add('skierg'); equipSet.add('ski_erg'); }
          if (norm.includes('row_erg') || norm === 'rowerg' || norm.includes('remo')) { equipSet.add('rowerg'); equipSet.add('remo_rowerg'); equipSet.add('remo'); }
          if (norm.includes('air_bike') || norm === 'airbike' || norm.includes('echo_bike')) { equipSet.add('airbike'); equipSet.add('echo_bike'); }
          if (norm.includes('barra')) { equipSet.add('barra_olimpica'); equipSet.add('barra'); }
          if (norm.includes('halter')) { equipSet.add('halteres'); equipSet.add('halteres_ajustaveis'); }
          if (norm.includes('leg_press')) { equipSet.add('leg_press'); }
          if (norm.includes('polia') || norm.includes('crossover')) { equipSet.add('crossover_polias'); }
        }
      });
    }

    // Se possui academia completa, inclui todo o rol de academia
    if (equipSet.has('academia_completa') || equipSet.has('academia') || equipSet.has('todos') || equipSet.has('full_gym')) {
      TRAINING_ENVIRONMENTS.ACADEMIA_COMPLETA.equipment.forEach(e => equipSet.add(e));
      equipSet.add('barra');
      equipSet.add('halteres');
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
        if (!availSet.has(normReq) && !availSet.has('academia_completa') && !availSet.has('full_gym')) {
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

  /**
   * Filtra e adapta o catálogo de exercícios segundo a Anamnese real do paciente:
   * 1. Whitelist de Equipamentos: só seleciona exercícios se o equipamento constar na lista da anamnese.
   * 2. Blacklist / Restrições Estritas:
   *    - Exclusão absoluta de exercícios e modalidades proibidas (ex: recusa de corrida / 21km).
   *    - Força fallback estrito em blocos de cardio para os ergômetros liberados (SkiErg, RowErg, AirBike).
   *    - Exclusão de treinos em jejum se o paciente não adere à prática.
   * 3. Otimização Biomecânica via Observações:
   *    - Identifica acessórios de suporte (cinturão de levantamento, joelheiras de compressão).
   *    - Prioriza compostos pesados (Agachamento Livre, Leg Press, Stiff/Terra, Supino Reto) para o topo,
   *      aplicando cargas mais altas e repetições mais baixas (RIR 1-2).
   * 
   * @param {Array<Object>} catalog - Catálogo ou lista de exercícios a filtrar
   * @param {Object} patientAnamnesis - Dados da anamnese / PerformanceContext DTO
   * @returns {Array<Object>} Exercícios filtrados e otimizados
   */
  function filterExercisesByEquipment(catalog = [], patientAnamnesis = {}) {
    if (!Array.isArray(catalog) || catalog.length === 0) return [];

    // 1. Extração de Equipamentos Disponíveis (Whitelist)
    const rawEquip = patientAnamnesis?.constraints?.availableEquipment ??
      patientAnamnesis?.anamnese?.equipamentosDisponiveis ??
      patientAnamnesis?.equipamentosDisponiveis ??
      patientAnamnesis?.availableEquipment ??
      patientAnamnesis?.cardioPreferences?.availableEquipment ??
      [];

    const availSet = normalizeEquipmentList(rawEquip);

    // Identificação de ergômetros liberados
    const hasSkiErg = availSet.has('skierg') || availSet.has('ski_erg');
    const hasRowErg = availSet.has('rowerg') || availSet.has('remo') || availSet.has('remo_rowerg');
    const hasAirBike = availSet.has('airbike') || availSet.has('air_bike') || availSet.has('echo_bike');
    const hasBike = availSet.has('bike') || availSet.has('bicicleta') || availSet.has('bike_spinning');
    const isGymComplete = availSet.has('academia_completa') || availSet.has('academia') || availSet.has('todos') || availSet.has('full_gym');

    // 2. Extração de Restrições, Notas e Modalidades Proibidas (Blacklist)
    const notesText = [
      patientAnamnesis?.clinicalNotes,
      patientAnamnesis?.routineNotes,
      patientAnamnesis?.anamnese?.observacoes,
      patientAnamnesis?.anamnese?.restricoes,
      patientAnamnesis?.anamnese?.notas,
      patientAnamnesis?.clinical?.clinicalNotes,
      patientAnamnesis?.dietaryRestrictions
    ].filter(Boolean).join(' ').toLowerCase();

    const prohibitedExercises = [
      ...(Array.isArray(patientAnamnesis?.constraints?.prohibitedExercises) ? patientAnamnesis.constraints.prohibitedExercises : []),
      ...(Array.isArray(patientAnamnesis?.prohibitedExercises) ? patientAnamnesis.prohibitedExercises : []),
      ...(Array.isArray(patientAnamnesis?.anamnese?.exerciciosProibidos) ? patientAnamnesis.anamnese.exerciciosProibidos : [])
    ].map(s => String(s).toLowerCase().trim());

    const prohibitedModalities = [
      ...(Array.isArray(patientAnamnesis?.constraints?.prohibitedModalities) ? patientAnamnesis.constraints.prohibitedModalities : []),
      ...(Array.isArray(patientAnamnesis?.prohibitedModalities) ? patientAnamnesis.prohibitedModalities : []),
      ...(Array.isArray(patientAnamnesis?.anamnese?.modalidadesProibidas) ? patientAnamnesis.anamnese.modalidadesProibidas : [])
    ].map(s => String(s).toLowerCase().trim());

    const isRunningProhibited = prohibitedModalities.some(m => m.includes('corrida') || m.includes('running') || m.includes('rua') || m.includes('21km')) ||
      /bloqueio.*corrida|recusa.*corrida|n[aã]o.*corr(e|ida)|sem.*corrida|proibido.*corrida|evitar.*corrida|bloqueio.*21km|recusa.*21km|n[aã]o.*faz.*corrida/i.test(notesText);

    // Protocolos alimentares inadequados acoplados ao treino (Jejum)
    const isFastingTrainingProhibited = patientAnamnesis?.constraints?.isFastingTrainingProhibited ||
      patientAnamnesis?.constraints?.allowFastingTraining === false ||
      patientAnamnesis?.prohibitFastingTraining === true ||
      /n[aã]o.*(treina|adere|faz|tolera).*jejum|recusa.*jejum|sem.*treino.*jejum|proibido.*jejum/i.test(notesText);

    // 3. Otimização Biomecânica via Observações (Acessórios de suporte)
    const hasBelt = /cintur[aã]o|cinto de levantamento|lifting belt/i.test(notesText) ||
      patientAnamnesis?.constraints?.supportAccessories?.belt ||
      patientAnamnesis?.supportAccessories?.belt ||
      patientAnamnesis?.anamnese?.acessoriosSuporte?.cinturao;

    const hasKneeSleeves = /joelheira|joelheiras|knee sleeve|knee sleeves|faixa de joelho/i.test(notesText) ||
      patientAnamnesis?.constraints?.supportAccessories?.kneeSleeves ||
      patientAnamnesis?.supportAccessories?.kneeSleeves ||
      patientAnamnesis?.anamnese?.acessoriosSuporte?.joelheiras;

    const hasSupportAccessories = !!(hasBelt || hasKneeSleeves || patientAnamnesis?.constraints?.heavyCompoundPriority);

    const filtered = [];

    for (const ex of catalog) {
      if (!ex) continue;
      const exCopy = { ...ex };
      const exNameLower = String(exCopy.exerciseName || exCopy.name || '').toLowerCase();
      const exIdLower = String(exCopy.exerciseId || exCopy.id || '').toLowerCase();

      // ── Check 1: Exclusão estrita por exercício proibido ──
      const isProhibitedEx = prohibitedExercises.some(p => p && (exNameLower.includes(p) || exIdLower.includes(p)));
      if (isProhibitedEx) {
        const sub = findBestSubstitution(exCopy.exerciseId || exCopy.id, availSet);
        if (sub && sub.isFeasible) {
          exCopy.exerciseId = sub.replacementId;
          exCopy.exerciseName = sub.replacementName;
          exCopy.name = sub.replacementName;
          exCopy.obs = (exCopy.obs ? exCopy.obs + ' ' : '') + `Substituído clinicamente: ${sub.stimulusDifference}`;
        } else {
          continue; // Remove da rotina
        }
      }

      // ── Check 2: Bloqueio estrito de Corrida com Fallback para Ergômetros ──
      const isRunningRelated = /corrida|sprint.*esteira|esteira.*sprint|rua|asfalto|pista|21km/i.test(exNameLower) ||
        /corrida|esteira|pista/i.test(exCopy.hiitModality || '') ||
        /corrida|pista/i.test(exCopy.equipment || '');

      if (isRunningProhibited && isRunningRelated) {
        // Se for bloco de HIIT ou Cardio acoplado, força fallback estrito para ergômetros liberados
        if (exCopy.module === 'HIIT' || exCopy.sessionType === 'CARDIO' || exCopy.hiitModality || /hiit/i.test(exNameLower)) {
          if (hasRowErg) {
            exCopy.exerciseId = 'hiit_row_sprint';
            exCopy.exerciseName = '[MÓDULO HIIT] Tiros Máximos de 100m no Remo Concept2 RowErg';
            exCopy.name = exCopy.exerciseName;
            exCopy.hiitModality = 'Remo RowErg (Damper 6)';
            exCopy.equipment = 'Remo RowErg';
            exCopy.reps = '100m sprint (<18s)';
            exCopy.workRestRatio = '1:2';
            exCopy.obs = 'Fallback estrito de ergômetro (RowErg): corrida bloqueada na anamnese.';
          } else if (hasSkiErg) {
            exCopy.exerciseId = 'hiit_skierg_sprint';
            exCopy.exerciseName = '[MÓDULO HIIT] Intervalos de Alta Potência no SkiErg Concept2';
            exCopy.name = exCopy.exerciseName;
            exCopy.hiitModality = 'SkiErg Concept2';
            exCopy.equipment = 'SkiErg';
            exCopy.reps = '100m sprint (<20s)';
            exCopy.workRestRatio = '1:2';
            exCopy.obs = 'Fallback estrito de ergômetro (SkiErg): corrida bloqueada na anamnese.';
          } else if (hasAirBike) {
            exCopy.exerciseId = 'hiit_airbike_sprint';
            exCopy.exerciseName = '[MÓDULO HIIT] Sprints 20s/40s na AirBike / Echo Bike';
            exCopy.name = exCopy.exerciseName;
            exCopy.hiitModality = 'AirBike (Potência Anaeróbia)';
            exCopy.equipment = 'AirBike';
            exCopy.reps = '20s sprint / 40s giro';
            exCopy.workRestRatio = '1:2';
            exCopy.obs = 'Fallback estrito de ergômetro (AirBike): corrida bloqueada na anamnese.';
          } else if (hasBike) {
            exCopy.exerciseId = 'hiit_bike_sprint';
            exCopy.exerciseName = '[MÓDULO HIIT] Sprints Intervalados na Bike Spinning';
            exCopy.name = exCopy.exerciseName;
            exCopy.hiitModality = 'Bike Spinning';
            exCopy.equipment = 'Bike Spinning';
            exCopy.reps = '30s tiro / 30s leve';
            exCopy.workRestRatio = '1:1';
            exCopy.obs = 'Fallback estrito de ergômetro (Bike): corrida bloqueada na anamnese.';
          } else {
            // Se nenhum ergômetro liberado, converte para calistênico aeróbio
            exCopy.exerciseId = 'burpee_jump';
            exCopy.exerciseName = '[MÓDULO HIIT] Burpee Broad Jumps com Ritmo Controlado';
            exCopy.name = exCopy.exerciseName;
            exCopy.hiitModality = 'Peso Corporal';
            exCopy.equipment = 'Peso Corporal';
            exCopy.reps = '30s esforço / 30s pausa';
            exCopy.workRestRatio = '1:1';
            exCopy.obs = 'Fallback sem ergômetro: corrida bloqueada na anamnese.';
          }
        } else {
          continue; // Remove modalidade de corrida rejeitada
        }
      }

      // ── Check 3: Whitelist de Equipamentos e Substituição Biomecânica ──
      const requiredEquip = (() => {
        if (Array.isArray(exCopy.requiredEquipment) && exCopy.requiredEquipment.length > 0) {
          return exCopy.requiredEquipment;
        }
        if (typeof exCopy.equipment === 'string' && exCopy.equipment.trim()) {
          const raw = exCopy.equipment.toLowerCase();
          if (raw.includes('barra e rack') || raw.includes('barra e banco')) return ['barra_olimpica', 'banco_reto'];
          if (raw.includes('barra fixa')) return ['barra_fixa'];
          if (raw.includes('halteres')) return ['halteres'];
          if (raw.includes('leg press')) return ['leg_press'];
          if (raw.includes('polia') || raw.includes('cabo')) return ['crossover_polias'];
          if (raw.includes('máquina') || raw.includes('maquina')) return ['hack_machine'];
          if (raw.includes('peso corporal')) return ['peso_corporal'];
          if (raw.includes('skierg')) return ['skierg'];
          if (raw.includes('rowerg') || raw.includes('remo')) return ['remo_rowerg'];
          if (raw.includes('airbike')) return ['airbike'];
          return [raw.replace(/\s+/g, '_')];
        }
        return ['peso_corporal'];
      })();

      const feasibility = checkExerciseFeasibility(requiredEquip, availSet);
      if (!feasibility.isFeasible && !isGymComplete) {
        const sub = findBestSubstitution(exCopy.exerciseId || exCopy.id, availSet);
        if (sub && sub.isFeasible) {
          exCopy.exerciseId = sub.replacementId;
          exCopy.exerciseName = sub.replacementName;
          exCopy.name = sub.replacementName;
          exCopy.equipment = sub.requiredEquipment ? sub.requiredEquipment.join(', ') : 'Equipamento alternativo';
          exCopy.obs = (exCopy.obs ? exCopy.obs + ' ' : '') + `Substituído biomecanicamente (${sub.stimulusDifference})`;
        } else {
          continue; // Exclui exercício por falta de equipamento na whitelist
        }
      }

      // ── Check 4: Salvaguarda de Treino em Jejum ──
      if (isFastingTrainingProhibited) {
        if (/jejum/i.test(exCopy.obs || '') || /jejum/i.test(exCopy.notes || '')) {
          exCopy.obs = (exCopy.obs || '').replace(/treino em jejum/gi, 'treino alimentado (pré-treino adequado)').replace(/jejum/gi, 'estado alimentado');
        }
      }

      // ── Check 5: Otimização Biomecânica para Compostos Pesados (Cinturão / Joelheiras) ──
      if (hasSupportAccessories) {
        const isHeavyCompound = /agachamento livre|back squat|leg press|stiff|levantamento terra|deadlift|supino reto/i.test(exNameLower) ||
          exCopy.exerciseId === 'lg01' || exCopy.exerciseId === 'lg04' || exCopy.exerciseId === 'lg10' || exCopy.exerciseId === 'pe01';

        if (isHeavyCompound) {
          exCopy.heavyCompoundPrioritized = true;
          // Aplicação de cargas mais altas e ranges de repetições mais baixos (RIR 1-2)
          exCopy.rir = 1.5;
          exCopy.rpe = 8.5;
          if (exCopy.reps === '8-10' || exCopy.reps === '10-12') {
            exCopy.reps = '6-8';
          } else if (exCopy.reps === '6-8') {
            exCopy.reps = '5-6';
          }
          if (exCopy.loadKg && !isNaN(Number(exCopy.loadKg))) {
            exCopy.loadKg = Math.round(Number(exCopy.loadKg) * 1.05);
          }
          const accLabel = (hasBelt && hasKneeSleeves) ? 'cinturão e joelheiras' : (hasBelt ? 'cinturão' : 'joelheiras');
          exCopy.obs = (exCopy.obs ? exCopy.obs + ' ' : '') + `Priorizado para força pesada (RIR 1-2) com suporte biomecânico (${accLabel}).`;
        }
      }

      filtered.push(exCopy);
    }

    // Priorização posicional: compostos pesados otimizados vêm primeiro na sessão
    if (hasSupportAccessories) {
      filtered.sort((a, b) => {
        const aPri = a.heavyCompoundPrioritized ? 1 : 0;
        const bPri = b.heavyCompoundPrioritized ? 1 : 0;
        return bPri - aPri;
      });
    }

    // Salvaguarda: a rotina nunca fica vazia
    if (filtered.length === 0 && catalog.length > 0) {
      filtered.push({
        exerciseId: 'ex_bodyweight_adaptive',
        exerciseName: 'Agachamento com Peso Corporal e Flexão Adaptada (Piso Livre)',
        name: 'Agachamento com Peso Corporal e Flexão Adaptada',
        sets: 3,
        reps: '12-15',
        rpe: 7.0,
        rest: 60,
        equipment: 'Peso Corporal',
        obs: 'Adaptação funcional de emergência com peso corporal.'
      });
    }

    return filtered;
  }

  return {
    TRAINING_ENVIRONMENTS,
    EQUIVALENCE_SUBSTITUTIONS,
    normalizeEquipmentList,
    checkExerciseFeasibility,
    findBestSubstitution,
    filterExercisesByEquipment
  };
});
