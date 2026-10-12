/**
 * domain/training/ModalityCatalog.js
 * 
 * Catálogo Central Canônico das 18 Modalidades de Treinamento do NutriAx Pro.
 * Define os identificadores estáveis, categorias, objetivos compatíveis,
 * estruturas de sessão, métricas primárias, equipamentos e diretrizes clínicas.
 * 
 * Camada de Domínio Puro — Sem dependência de DOM, Dexie ou Firebase.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.ModalityCatalog = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Identificadores Canônicos das 18 Modalidades Oficiais
   */
  const MODALITY_IDS = Object.freeze({
    STRENGTH: 'musculacao_forca',
    RUNNING: 'corrida_endurance',
    CYCLING: 'ciclismo_spinning',
    SWIMMING: 'natacao',
    COMBAT: 'lutas_artes_marciais',
    AEROBIC: 'aerobico_geral',
    CALISTHENICS: 'calistenia',
    HYROX: 'hyrox_racing',
    METCON: 'metcon_hibrido',
    CROSSFIT: 'crossfit_funcional',
    HIIT_STRENGTH: 'hiit_musculacao',
    TRIATHLON: 'triathlon',
    FUNCTIONAL: 'funcional_misto',
    RUNNING_STRENGTH: 'corrida_musculacao',
    CYCLING_STRENGTH: 'ciclismo_forca',
    TEAM_SPORTS: 'esportes_coletivos',
    MIXED_CARDIO_STRENGTH: 'misto_forca_cardio',
    SEDENTARY: 'nenhum_sedentario'
  });

  /**
   * Catálogo de Metadados Completos das 18 Modalidades
   */
  const MODALITIES = Object.freeze({
    [MODALITY_IDS.STRENGTH]: {
      id: MODALITY_IDS.STRENGTH,
      code: 'STRENGTH',
      name: 'Musculação / Força',
      selectorLabel: '🏋️ Musculação / Força (Hipertrofia)',
      anamneseValue: 'Musculação / Força',
      defaultSplit: 'PPL',
      supportedSplits: ['PPL', 'UpperLower', 'PHAT', 'DUP', 'FullBody', 'ABCD', 'ABCDE', 'Bro Split'],
      category: 'Força & Hipertrofia',
      isHybrid: false,
      primaryMetrics: ['sets', 'reps', 'loadKg', 'rpe', 'rir', 'restSeconds', 'cadence', 'weeklyVolumeSets'],
      requiredEquipment: ['barra', 'halteres', 'banco', 'anilhas', 'maquinas_polias'],
      sessionStructure: 'series_repeticoes',
      defaultWeeklyFrequency: 4,
      compatibleObjectives: ['Hipertrofia', 'Emagrecimento', 'Força Máxima', 'Recomposição Corporal', 'Manutenção & Saúde'],
      description: 'Treinamento de sobrecarga com foco em tensão mecânica, volume muscular semanal e progressão dupla.'
    },

    [MODALITY_IDS.RUNNING]: {
      id: MODALITY_IDS.RUNNING,
      code: 'RUNNING',
      name: 'Corrida / Endurance',
      selectorLabel: '🏃 Corrida / Endurance',
      anamneseValue: 'Endurance & Corrida',
      defaultSplit: 'Corrida_Endurance',
      supportedSplits: ['Corrida_Endurance'],
      category: 'Endurance Puro',
      isHybrid: false,
      primaryMetrics: ['distanceKm', 'durationMinutes', 'paceMinKm', 'heartRateZone', 'elevationGainM', 'intervals'],
      requiredEquipment: ['tenis_corrida', 'esteira_ou_asfalto'],
      sessionStructure: 'distancia_ritmo_duracao',
      defaultWeeklyFrequency: 4,
      compatibleObjectives: ['Condicionamento Cardiorrespiratório', 'Emagrecimento', 'Performance em Corrida', 'Saúde Cardiovascular'],
      description: 'Treinamento contínuo e intervalado com periodização polarizada de zonas cardíacas e controle de volume (km).'
    },

    [MODALITY_IDS.CYCLING]: {
      id: MODALITY_IDS.CYCLING,
      code: 'CYCLING',
      name: 'Ciclismo / Spinning',
      selectorLabel: '🚴 Ciclismo / Spinning',
      anamneseValue: 'Ciclismo',
      defaultSplit: 'Ciclismo_Endurance',
      supportedSplits: ['Ciclismo_Endurance'],
      category: 'Endurance Puro',
      isHybrid: false,
      primaryMetrics: ['durationMinutes', 'powerWatts', 'ftpPercentage', 'cadenceRpm', 'heartRateZone', 'resistanceLevel'],
      requiredEquipment: ['bicicleta_ou_rolo_ou_spinning'],
      sessionStructure: 'tempo_potencia_cadencia',
      defaultWeeklyFrequency: 3,
      compatibleObjectives: ['Potência Aeróbica', 'Emagrecimento', 'Condicionamento', 'Performance no Pedal'],
      description: 'Prescrição por zonas de potência (FTP) ou FC, cadência de giro e intervalos de Sweet Spot e VO2max.'
    },

    [MODALITY_IDS.SWIMMING]: {
      id: MODALITY_IDS.SWIMMING,
      code: 'SWIMMING',
      name: 'Natação',
      selectorLabel: '🏊 Natação',
      anamneseValue: 'Natação',
      defaultSplit: 'Natacao',
      supportedSplits: ['Natacao'],
      category: 'Endurance Aquático',
      isHybrid: false,
      primaryMetrics: ['totalMeters', 'stroke', 'pace100m', 'intervalRestSeconds', 'drills', 'rpe'],
      requiredEquipment: ['piscina', 'oculos_natacao', 'prancha_pullbuoy'],
      sessionStructure: 'metragem_estilos_series',
      defaultWeeklyFrequency: 3,
      compatibleObjectives: ['Capacidade Aeróbica Aquática', 'Saúde Articular', 'Condicionamento Geral', 'Emagrecimento'],
      description: 'Sessões fracionadas em aquecimento, educativos de técnica, séries principais por estilo e volta à calma.'
    },

    [MODALITY_IDS.COMBAT]: {
      id: MODALITY_IDS.COMBAT,
      code: 'COMBAT',
      name: 'Lutas / Artes Marciais',
      selectorLabel: '🥊 Lutas / Artes Marciais',
      anamneseValue: 'Lutas / Artes Marciais',
      defaultSplit: 'Lutas',
      supportedSplits: ['Lutas'],
      category: 'Combate & Potência',
      isHybrid: false,
      primaryMetrics: ['roundsCount', 'roundDurationMinutes', 'restBetweenRoundsSec', 'contactIntensity', 'martialArtStyle', 'technicalDrills'],
      requiredEquipment: ['tatame_ou_ringue', 'luvas_bandagens', 'protetor_bucal'],
      sessionStructure: 'rounds_tecnica_preparacao',
      defaultWeeklyFrequency: 3,
      compatibleObjectives: ['Potência de Combate', 'Agilidade', 'Condicionamento Intermitente', 'Defesa & Técnica'],
      description: 'Integração de preparação neuromuscular de pegada (grip), rotação de tronco e condicionamento por rounds.'
    },

    [MODALITY_IDS.AEROBIC]: {
      id: MODALITY_IDS.AEROBIC,
      code: 'AEROBIC',
      name: 'Aeróbico Geral',
      selectorLabel: '⚡ Aeróbico Geral',
      anamneseValue: 'Aeróbico Geral',
      defaultSplit: 'Aerobico_Geral',
      supportedSplits: ['Aerobico_Geral'],
      category: 'Saúde & Condicionamento',
      isHybrid: false,
      primaryMetrics: ['activityType', 'durationMinutes', 'heartRateZone', 'rpe', 'continuousOrInterval'],
      requiredEquipment: ['ergometro_qualquer_ou_caminhada'],
      sessionStructure: 'atividade_duracao_intensidade',
      defaultWeeklyFrequency: 3,
      compatibleObjectives: ['Saúde Cardiovascular', 'Emagrecimento', 'Redução de Estresse', 'Manutenção'],
      description: 'Atividades aeróbicas contínuas em Zona 2 ou circuitos leves acessíveis a qualquer ambiente.'
    },

    [MODALITY_IDS.CALISTHENICS]: {
      id: MODALITY_IDS.CALISTHENICS,
      code: 'CALISTHENICS',
      name: 'Calistenia',
      selectorLabel: '🤸 Calistenia',
      anamneseValue: 'Calistenia',
      defaultSplit: 'Calistenia',
      supportedSplits: ['Calistenia'],
      category: 'Força com Peso Corporal',
      isHybrid: false,
      primaryMetrics: ['movementPattern', 'variationLevel', 'assistanceMethod', 'repsOrHoldSec', 'rpe', 'leverageTier'],
      requiredEquipment: ['barra_fixa', 'paralelas_ou_chao', 'argolas_opcionais'],
      sessionStructure: 'padroes_movimento_alavanca',
      defaultWeeklyFrequency: 3,
      compatibleObjectives: ['Força Relativa', 'Controle Motor', 'Hipertrofia Funcional', 'Definição Corporal'],
      description: 'Progressão por alavanca biomecânica, exercícios estritos em barra, paralelas e trabalho de core ginástico.'
    },

    [MODALITY_IDS.HYROX]: {
      id: MODALITY_IDS.HYROX,
      code: 'HYROX',
      name: 'HYROX / Fitness Racing',
      selectorLabel: '★ HYROX / Fitness Racing (Ergômetros, Corrida, Força)',
      anamneseValue: 'HYROX / Fitness Racing',
      defaultSplit: 'HYROX',
      supportedSplits: ['HYROX'],
      category: 'Híbrida & Racing',
      isHybrid: true,
      primaryMetrics: ['runningKm', 'stationName', 'stationLoadKg', 'stationRepsOrMeters', 'splitTimeSec', 'transitionTimeSec'],
      requiredEquipment: ['skierg', 'rowerg', 'sled_treno', 'sandbag', 'wall_ball', 'esteira_ou_pista'],
      sessionStructure: 'corrida_estacoes_transicoes',
      defaultWeeklyFrequency: 3,
      compatibleObjectives: ['Competição HYROX', 'Resistência Muscular Total', 'Potência Híbrida', 'Alta Performance'],
      description: 'Combinação das 8 estações oficiais com 1 km de corrida intercalada e protocolos de transição sob lactato.'
    },

    [MODALITY_IDS.METCON]: {
      id: MODALITY_IDS.METCON,
      code: 'METCON',
      name: 'Condicionamento Metabólico Híbrido (Metcon)',
      selectorLabel: '★ Condicionamento Metabólico Híbrido (Metcon)',
      anamneseValue: 'Treino de Condicionamento Metabólico Híbrido (Metcon)',
      defaultSplit: 'Metcon',
      supportedSplits: ['Metcon', 'MetconHibrido', 'Metcon_Hibrido'],
      category: 'Híbrida & Alta Densidade',
      isHybrid: true,
      primaryMetrics: ['formatType', 'timeCapMinutes', 'roundsCompleted', 'repsCompleted', 'workRestRatio', 'rpe'],
      requiredEquipment: ['kettlebells', 'halteres_ou_barra', 'caixa_salto', 'ergometro'],
      sessionStructure: 'formato_amrap_emom_chipper',
      defaultWeeklyFrequency: 3,
      compatibleObjectives: ['Capacidade de Trabalho', 'Queima Calórica Alta', 'Resistência à Fadiga', 'Condicionamento'],
      description: 'Circuitos sob estresse de tempo: AMRAP (máx. rounds), EMOM (a cada minuto), For Time e Chippers.'
    },

    [MODALITY_IDS.CROSSFIT]: {
      id: MODALITY_IDS.CROSSFIT,
      code: 'CROSSFIT',
      name: 'CrossFit & Funcional',
      selectorLabel: '★ CrossFit & Funcional',
      anamneseValue: 'Crossfit & Funcional',
      defaultSplit: 'CrossFit',
      supportedSplits: ['CrossFit'],
      category: 'Híbrida & Funcional',
      isHybrid: true,
      primaryMetrics: ['skillBlock', 'strengthBlockLoadKg', 'wodFormat', 'scaleLevel', 'wodScore', 'timeCapMinutes'],
      requiredEquipment: ['barra_olimpica', 'anilhas', 'barra_fixa', 'kettlebell', 'ergometros'],
      sessionStructure: 'bloco_skill_forca_wod',
      defaultWeeklyFrequency: 3,
      compatibleObjectives: ['Performance CrossFit', 'Potência Olímpica', 'Ginástica Funcional', 'Capacidade Metabólica'],
      description: 'Estrutura clássica de box: aquecimento dinâmico, bloco técnico/força (LPO) e WOD de alta intensidade.'
    },

    [MODALITY_IDS.HIIT_STRENGTH]: {
      id: MODALITY_IDS.HIIT_STRENGTH,
      code: 'HIIT_STRENGTH',
      name: 'HIIT + Musculação',
      selectorLabel: '★ HIIT + Musculação',
      anamneseValue: 'HIIT + Musculação',
      defaultSplit: 'HIIT_Forca',
      supportedSplits: ['HIIT_Forca'],
      category: 'Híbrida Duplo Estresse',
      isHybrid: true,
      primaryMetrics: ['strengthSets', 'strengthReps', 'strengthRpe', 'hiitWorkSec', 'hiitRestSec', 'hiitRounds', 'hiitModality'],
      requiredEquipment: ['pesos_livres', 'esteira_ou_remo_ou_bike'],
      sessionStructure: 'dois_motores_coordenados',
      defaultWeeklyFrequency: 3,
      compatibleObjectives: ['Hipertrofia com Definição', 'Emagrecimento Acelerado', 'Eficiência de Tempo'],
      description: 'Dois motores coordenados: sessão miofibrilar estrita seguida ou alternada com blocos de HIIT anaeróbio.'
    },

    [MODALITY_IDS.TRIATHLON]: {
      id: MODALITY_IDS.TRIATHLON,
      code: 'TRIATHLON',
      name: 'Triathlon',
      selectorLabel: '★ Triathlon (Natação + Ciclismo + Corrida)',
      anamneseValue: 'Triathlon',
      defaultSplit: 'Triathlon',
      supportedSplits: ['Triathlon'],
      category: 'Multi-Disciplina Endurance',
      isHybrid: true,
      primaryMetrics: ['swimMeters', 'bikeKmOrMin', 'runKmOrMin', 'brickSession', 'weeklyDistribution', 'trainingPhase'],
      requiredEquipment: ['piscina', 'bicicleta_estrada', 'tenis_corrida', 'acessorios_tri'],
      sessionStructure: 'tres_disciplinas_coordenadas',
      defaultWeeklyFrequency: 4,
      compatibleObjectives: ['Provas de Triathlon (Sprint, Olímpico, 70.3, IronMan)', 'Endurance Extremo'],
      description: 'Três motores independentes integrados em microciclo semanal com treinos combinados (Brick Bike+Run).'
    },

    [MODALITY_IDS.FUNCTIONAL]: {
      id: MODALITY_IDS.FUNCTIONAL,
      code: 'FUNCTIONAL',
      name: 'Funcional Misto',
      selectorLabel: '★ Funcional Misto',
      anamneseValue: 'Funcional Misto',
      defaultSplit: 'FuncionalMisto',
      supportedSplits: ['FuncionalMisto'],
      category: 'Movimento & Capacidades',
      isHybrid: true,
      primaryMetrics: ['targetCapacities', 'movementPatterns', 'circuitBlocks', 'dosageRepsOrSec', 'qualityCriteria'],
      requiredEquipment: ['elasticos', 'kettlebells', 'medicine_ball', 'solo_peso_corporal'],
      sessionStructure: 'blocos_capacidades_alvo',
      defaultWeeklyFrequency: 3,
      compatibleObjectives: ['Mobilidade & Estabilidade', 'Prevenção de Lesões', 'Condicionamento Global', 'Postura'],
      description: 'Blocos integrados de ativação, estabilidade de core rotacional, força em padrões múltiplos e finalização metabólica.'
    },

    [MODALITY_IDS.RUNNING_STRENGTH]: {
      id: MODALITY_IDS.RUNNING_STRENGTH,
      code: 'RUNNING_STRENGTH',
      name: 'Corrida + Musculação',
      selectorLabel: '★ Corrida + Musculação (Treinamento Concorrente)',
      anamneseValue: 'Corrida + Musculação',
      defaultSplit: 'RunningStrength',
      supportedSplits: ['RunningStrength'],
      category: 'Treinamento Concorrente',
      isHybrid: true,
      primaryMetrics: ['concurrentPriority', 'strengthVolumeSets', 'runningWeeklyKm', 'sessionSeparationHours', 'interferenceControl'],
      requiredEquipment: ['pesos_livres', 'esteira_ou_pista'],
      sessionStructure: 'forca_e_corrida_concorrente',
      defaultWeeklyFrequency: 4,
      compatibleObjectives: ['Economia de Corrida', 'Prevenção de Lesões em Corredores', 'Hipertrofia Funcional'],
      description: 'Gestão científica da interferência: fortalecimento de membros inferiores e core sem prejudicar o pace e a rodagem.'
    },

    [MODALITY_IDS.CYCLING_STRENGTH]: {
      id: MODALITY_IDS.CYCLING_STRENGTH,
      code: 'CYCLING_STRENGTH',
      name: 'Ciclismo + Força',
      selectorLabel: '★ Ciclismo + Força',
      anamneseValue: 'Ciclismo + Força',
      defaultSplit: 'Ciclismo_Forca',
      supportedSplits: ['Ciclismo_Forca'],
      category: 'Treinamento Concorrente',
      isHybrid: true,
      primaryMetrics: ['cyclingHoursWeekly', 'strengthSetsLegs', 'postureTrunkSets', 'interferenceManagement', 'rpe'],
      requiredEquipment: ['bicicleta_ou_rolo', 'pesos_livres_academia'],
      sessionStructure: 'potencia_pedal_e_sobrecarga',
      defaultWeeklyFrequency: 4,
      compatibleObjectives: ['Potência de Subida na Bike', 'Resistência Postural de Guidão', 'Força Neuromuscular'],
      description: 'Harmonização de agachamentos pesados e tiros de potência no pedal com controle de fadiga periférica de quadríceps.'
    },

    [MODALITY_IDS.TEAM_SPORTS]: {
      id: MODALITY_IDS.TEAM_SPORTS,
      code: 'TEAM_SPORTS',
      name: 'Esportes Coletivos',
      selectorLabel: '★ Esportes Coletivos (Futebol, Basquete)',
      anamneseValue: 'Esportes Coletivos',
      defaultSplit: 'EsportesColetivos',
      supportedSplits: ['EsportesColetivos'],
      category: 'Agilidade & Prontidão',
      isHybrid: true,
      primaryMetrics: ['sportName', 'matchDayTiming', 'reactiveStrengthRfd', 'codAgilityDrills', 'jumpLoadSets', 'injuryPreventionSets'],
      requiredEquipment: ['pesos_livres', 'cones_agilidade', 'espaco_campo_quadra'],
      sessionStructure: 'potencia_rfd_agilidade_jogos',
      defaultWeeklyFrequency: 3,
      compatibleObjectives: ['Performance em Partidas', 'Prevenção de Lesões (LCA/Isquiotibiais)', 'Velocidade e Mudança de Direção'],
      description: 'Preparação física atlética com pliometria, força reativa unilateral, sprints curtos e desaceleração controlada.'
    },

    [MODALITY_IDS.MIXED_CARDIO_STRENGTH]: {
      id: MODALITY_IDS.MIXED_CARDIO_STRENGTH,
      code: 'MIXED_CARDIO_STRENGTH',
      name: 'Misto — Força + Cardio',
      selectorLabel: 'Misto (Força + Cardio)',
      anamneseValue: 'Misto (Força + Cardio)',
      defaultSplit: 'MistoCardio',
      supportedSplits: ['MistoCardio'],
      category: 'Equilíbrio Metabólico',
      isHybrid: true,
      primaryMetrics: ['strengthPortion', 'cardioPortionMinutes', 'cardioModalityType', 'orderOfExecution', 'intensityDistribution'],
      requiredEquipment: ['pesos_livres', 'ergometro_ou_corrida'],
      sessionStructure: 'modulos_independentes_forca_cardio',
      defaultWeeklyFrequency: 4,
      compatibleObjectives: ['Composição Corporal', 'Emagrecimento Sustentável', 'Saúde e Longevidade', 'Capacidade Geral'],
      description: 'Módulos independentes de força e cardio sem presumir que o cardio seja HIIT: cardio oxidativo planejado.'
    },

    [MODALITY_IDS.SEDENTARY]: {
      id: MODALITY_IDS.SEDENTARY,
      code: 'SEDENTARY',
      name: 'Nenhum — Sedentário',
      selectorLabel: 'Nenhum (Sedentário)',
      anamneseValue: 'Nenhum (Sedentário)',
      defaultSplit: 'Sedentario',
      supportedSplits: ['Sedentario'],
      category: 'Introdução & Saúde Básica',
      isHybrid: false,
      primaryMetrics: ['dailyStepsTarget', 'walkingMinutesDay', 'mobilityRoutineDuration', 'postureBreaksCount', 'readinessScore'],
      requiredEquipment: ['nenhum_apenas_calcado_confortavel'],
      sessionStructure: 'metas_graduais_passos_mobilidade',
      defaultWeeklyFrequency: 3,
      compatibleObjectives: ['Quebra do Sedentarismo', 'Introdução Segura ao Movimento', 'Alívio de Dores Posturais', 'Saúde Metabólica'],
      description: 'Avaliação inicial de prontidão, metas graduais de passos diários, mobilidade leve e transição segura sem cargas agressivas.'
    }
  });

  /**
   * Mapeia qualquer termo ou valor vindo da Anamnese, do seletor ou de texto livre
   * para o ID canônico correspondente do catálogo.
   * @param {string} input - Valor a ser mapeado
   * @returns {string|null} ID canônico da modalidade ou null
   */
  function resolveModalityId(input) {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (MODALITY_IDS[trimmed]) return MODALITY_IDS[trimmed];
    const upper = trimmed.toUpperCase();
    if (MODALITY_IDS[upper]) return MODALITY_IDS[upper];
    for (const v of Object.values(MODALITY_IDS)) {
      if (v.toLowerCase() === trimmed.toLowerCase()) return v;
    }

    const str = trimmed.toLowerCase();

    // 1. Sedentário
    if (str.includes('sedentário') || str.includes('sedentario') || str.includes('nenhum')) {
      return MODALITY_IDS.SEDENTARY;
    }

    // 2. HYROX / Racing
    if (str.includes('hyrox') || str.includes('fitness racing') || str.includes('racing')) {
      return MODALITY_IDS.HYROX;
    }

    // 3. Metcon
    if (str.includes('metcon') || str.includes('condicionamento metabólico') || str.includes('condicionamento metabolico')) {
      return MODALITY_IDS.METCON;
    }

    // 4. CrossFit
    if (str.includes('crossfit') || str.includes('cross fit')) {
      return MODALITY_IDS.CROSSFIT;
    }

    // 5. Triathlon
    if (str.includes('triathlon') || str.includes('triatlo')) {
      return MODALITY_IDS.TRIATHLON;
    }

    // 6. HIIT + Musculação
    if (str.includes('hiit') && (str.includes('muscula') || str.includes('força') || str.includes('forca'))) {
      return MODALITY_IDS.HIIT_STRENGTH;
    }

    // 7. Corrida + Musculação
    if ((str.includes('corrida') || str.includes('running')) && (str.includes('muscula') || str.includes('concorrente') || str.includes('força') || str.includes('forca'))) {
      return MODALITY_IDS.RUNNING_STRENGTH;
    }

    // 8. Ciclismo + Força
    if ((str.includes('ciclismo') || str.includes('bike')) && (str.includes('força') || str.includes('forca') || str.includes('muscula'))) {
      return MODALITY_IDS.CYCLING_STRENGTH;
    }

    // 9. Esportes Coletivos
    if (str.includes('esportes coletivos') || str.includes('futebol') || str.includes('basquete') || str.includes('volei') || str.includes('vôlei') || str.includes('handebol') || str.includes('rugby')) {
      return MODALITY_IDS.TEAM_SPORTS;
    }

    // 10. Misto (Força + Cardio)
    if (str.includes('misto') && (str.includes('cardio') || str.includes('força') || str.includes('forca'))) {
      return MODALITY_IDS.MIXED_CARDIO_STRENGTH;
    }

    // 11. Funcional Misto
    if (str.includes('funcional misto') || (str.includes('funcional') && !str.includes('crossfit'))) {
      return MODALITY_IDS.FUNCTIONAL;
    }

    // 12. Calistenia
    if (str.includes('calistenia') || str.includes('bodyweight') || str.includes('peso corporal')) {
      return MODALITY_IDS.CALISTHENICS;
    }

    // 13. Lutas / Artes Marciais
    if (str.includes('luta') || str.includes('artes marciais') || str.includes('boxe') || str.includes('jiu') || str.includes('muay') || str.includes('judô') || str.includes('judo') || str.includes('mma') || str.includes('karate') || str.includes('karatê')) {
      return MODALITY_IDS.COMBAT;
    }

    // 14. Natação
    if (str.includes('natação') || str.includes('natacao') || str.includes('aquática') || str.includes('aquatica')) {
      return MODALITY_IDS.SWIMMING;
    }

    // 15. Ciclismo Puro
    if (str.includes('ciclismo') || str.includes('spinning') || str.includes('speed') || str.includes('mtb')) {
      return MODALITY_IDS.CYCLING;
    }

    // 16. Corrida Pura / Endurance
    if (str.includes('endurance') || str.includes('corrida') || str.includes('maratona') || str.includes('meia maratona')) {
      return MODALITY_IDS.RUNNING;
    }

    // 17. Aeróbico Geral
    if (str.includes('aeróbico') || str.includes('aerobico')) {
      return MODALITY_IDS.AEROBIC;
    }

    // 18. Musculação / Força Pura
    if (str.includes('musculação') || str.includes('musculacao') || str.includes('hipertrofia') || str.includes('força') || str.includes('forca') || str.includes('bodybuilding') || str.includes('powerlifting')) {
      return MODALITY_IDS.STRENGTH;
    }

    return null;
  }

  /**
   * Retorna os metadados de uma modalidade a partir de seu ID ou termo equivalente
   * @param {string} input - ID ou nome
   * @returns {Object|null} Metadados da modalidade
   */
  function getModalityMetadata(input) {
    const id = resolveModalityId(input) || input;
    return MODALITIES[id] || null;
  }

  /**
   * Retorna todas as 18 modalidades oficiais em array ordenado
   * @returns {Array<Object>}
   */
  function getAllModalities() {
    return Object.values(MODALITIES);
  }

  return {
    MODALITY_IDS,
    MODALITIES,
    resolveModalityId,
    getModalityMetadata,
    getAllModalities
  };
});
