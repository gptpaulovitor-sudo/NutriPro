/**
 * domain/training/InternalTrainingDatabase.js
 * 
 * Base Interna Estruturada de Exercícios, Protocolos e Regras de Prescrição.
 * Permite ao NutriAx Pro gerar prescrições completas e individualizadas em contingência,
 * sem depender exclusivamente da IA generativa (Gemini).
 * 
 * Versionamento formal: v1.0.0 (Revisão 2026-10-12)
 * Fonte: Consenso Clínico NutriAx Pro & Biomecânica Aplicada
 * 
 * Camada de Domínio Puro — Compatível com Node.js e Navegadores.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./ModalityCatalog'),
      require('./EquipmentService')
    );
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.InternalTrainingDatabase = factory(
      root.NutriDomain.ModalityCatalog,
      root.NutriDomain.EquipmentService
    );
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (ModalityCatalog, EquipmentService) {
  'use strict';

  const VERSION = '1.0.0';
  const REVISION_DATE = '2026-10-12';
  const SOURCE_CONSENSUS = 'NUTRIAX_CLINICAL_CONSENSUS_V1';

  /**
   * Catálogo de Exercícios com identificadores estáveis para as 18 modalidades
   */
  const EXERCISES = Object.freeze([
    // ══════════════════════════════════════════════════════════════════════════
    // 1. MUSCULAÇÃO / FORÇA (musculacao_forca)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_str_bench_press_barbell',
      canonicalName: 'Supino Reto com Barra Olímpica',
      aliases: ['Supino Reto', 'Barbell Bench Press', 'Supino Barra'],
      modalities: ['musculacao_forca', 'hiit_musculacao', 'misto_forca_cardio'],
      objectives: ['Hipertrofia', 'Força Máxima', 'Recomposição Corporal'],
      movementPattern: 'horizontal_push',
      physicalCapacities: ['strength', 'hypertrophy'],
      muscleGroups: ['peitoral_maior', 'deltoide_anterior', 'triceps_braquial'],
      requiredEquipment: ['barra_olimpica', 'banco_reto', 'anilhas'],
      alternativeEquipment: ['halteres', 'crossover_polias', 'maquinas_polias'],
      experienceLevels: ['intermediario', 'avancado', 'atleta'],
      contraindications: ['ombro_impacto', 'lesao_manguito_aguda', 'instabilidade_glenoumeral'],
      modalityParameters: {
        defaultSets: 4,
        defaultReps: '6-8',
        defaultRpe: 8.0,
        defaultRestSeconds: 120,
        tempo: '3-0-1-0',
        obs: 'Adução e depressão escapular ativas, pés firmes no solo, pegada ligeiramente além dos ombros.'
      }
    },
    {
      id: 'ex_str_dumbbell_incline_press',
      canonicalName: 'Supino Inclinado com Halteres',
      aliases: ['Incline Dumbbell Press', 'Supino Inclinado Halteres'],
      modalities: ['musculacao_forca', 'hiit_musculacao', 'misto_forca_cardio'],
      objectives: ['Hipertrofia', 'Força Máxima', 'Recomposição Corporal'],
      movementPattern: 'incline_push',
      physicalCapacities: ['hypertrophy', 'strength'],
      muscleGroups: ['peitoral_clavicular', 'deltoide_anterior', 'triceps_braquial'],
      requiredEquipment: ['halteres', 'banco_inclinado'],
      alternativeEquipment: ['crossover_polias', 'maquinas_polias'],
      experienceLevels: ['iniciante', 'intermediario', 'avancado'],
      contraindications: ['lesao_manguito_aguda'],
      modalityParameters: {
        defaultSets: 3,
        defaultReps: '8-10',
        defaultRpe: 8.0,
        defaultRestSeconds: 90,
        tempo: '2-0-1-0',
        obs: 'Inclinação do banco em 30° a 45°. Manter antebraços verticais no ponto de reversão.'
      }
    },
    {
      id: 'ex_str_barbell_back_squat',
      canonicalName: 'Agachamento Livre com Barra',
      aliases: ['Agachamento Livre', 'Back Squat', 'Barbell Squat'],
      modalities: ['musculacao_forca', 'ciclismo_forca', 'esportes_coletivos', 'misto_forca_cardio'],
      objectives: ['Hipertrofia', 'Força Máxima', 'Potência Neuromuscular'],
      movementPattern: 'knee_dominant',
      physicalCapacities: ['strength', 'hypertrophy', 'neuromuscular_power'],
      muscleGroups: ['quadriceps', 'gluteo_maximo', 'adutores', 'eretores_espinha'],
      requiredEquipment: ['barra_olimpica', 'anilhas', 'rack_agachamento'],
      alternativeEquipment: ['leg_press', 'hack_machine', 'halteres'],
      experienceLevels: ['intermediario', 'avancado', 'atleta'],
      contraindications: ['hernia_discal_aguda', 'lombalgia_severa', 'condromalacia_grau_4'],
      modalityParameters: {
        defaultSets: 4,
        defaultReps: '6-8',
        defaultRpe: 8.0,
        defaultRestSeconds: 150,
        tempo: '3-0-1-0',
        obs: 'Profundidade paralela ou além. Joelhos alinhados com a ponta dos pés, tronco rígido com manobra de Valsalva.'
      }
    },
    {
      id: 'ex_str_romanian_deadlift',
      canonicalName: 'Levantamento Terra Romeno (RDL / Stiff)',
      aliases: ['RDL', 'Stiff com Barra', 'Romanian Deadlift'],
      modalities: ['musculacao_forca', 'corrida_musculacao', 'ciclismo_forca', 'esportes_coletivos'],
      objectives: ['Hipertrofia', 'Prevenção de Lesões', 'Força Posterior'],
      movementPattern: 'hip_dominant',
      physicalCapacities: ['strength', 'hypertrophy'],
      muscleGroups: ['isquiotibiais', 'gluteo_maximo', 'eretores_espinha'],
      requiredEquipment: ['barra_olimpica', 'anilhas'],
      alternativeEquipment: ['halteres', 'kettlebells'],
      experienceLevels: ['iniciante', 'intermediario', 'avancado'],
      contraindications: ['lombalgia_aguda_irradiada', 'ciatalgia_ativa'],
      modalityParameters: {
        defaultSets: 3,
        defaultReps: '8-10',
        defaultRpe: 8.0,
        defaultRestSeconds: 90,
        tempo: '3-1-1-0',
        obs: 'Inicia com flexão suave dos joelhos e posteriorização pura do quadril mantendo a coluna neutra.'
      }
    },
    {
      id: 'ex_str_barbell_bent_over_row',
      canonicalName: 'Remada Curvada com Barra (Pronada)',
      aliases: ['Remada Curvada', 'Bent-Over Row', 'Barbell Row'],
      modalities: ['musculacao_forca', 'misto_forca_cardio'],
      objectives: ['Hipertrofia', 'Força de Tração', 'Estabilidade Torácica'],
      movementPattern: 'horizontal_pull',
      physicalCapacities: ['strength', 'hypertrophy'],
      muscleGroups: ['dorsal_lats', 'romboides', 'trapezio_medio', 'biceps_braquial'],
      requiredEquipment: ['barra_olimpica', 'anilhas'],
      alternativeEquipment: ['halteres', 'crossover_polias', 'remada_baixa_cabo'],
      experienceLevels: ['intermediario', 'avancado'],
      contraindications: ['hernia_discal_aguda', 'lombalgia_ativa'],
      modalityParameters: {
        defaultSets: 4,
        defaultReps: '6-8',
        defaultRpe: 8.0,
        defaultRestSeconds: 90,
        tempo: '2-0-1-1',
        obs: 'Tronco inclinado a ~45°, puxar a barra em direção ao umbigo com retração escapular no topo.'
      }
    },
    {
      id: 'ex_str_military_press',
      canonicalName: 'Desenvolvimento Militar em Pé com Barra',
      aliases: ['Overhead Press', 'OHP', 'Desenvolvimento Militar'],
      modalities: ['musculacao_forca', 'crossfit_funcional'],
      objectives: ['Força Máxima', 'Hipertrofia de Ombros', 'Estabilidade de Core'],
      movementPattern: 'vertical_push',
      physicalCapacities: ['strength', 'hypertrophy'],
      muscleGroups: ['deltoide_anterior', 'deltoide_lateral', 'triceps_braquial', 'core_antiextensao'],
      requiredEquipment: ['barra_olimpica', 'anilhas'],
      alternativeEquipment: ['halteres', 'maquinas_polias'],
      experienceLevels: ['intermediario', 'avancado', 'atleta'],
      contraindications: ['impacto_subacromial', 'lombalgia_em_hiperextensao'],
      modalityParameters: {
        defaultSets: 3,
        defaultReps: '6-8',
        defaultRpe: 7.5,
        defaultRestSeconds: 120,
        tempo: '2-0-1-0',
        obs: 'Glúteos e abdômen contraídos, trajetória vertical da barra passando rente ao queixo.'
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 2. CORRIDA / ENDURANCE (corrida_endurance)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_run_z2_steady_aerobic',
      canonicalName: 'Rodagem Aeróbica Contínua em Zona 2 (Base Oxidativa)',
      aliases: ['Easy Run', 'Rodagem Z2', 'Continuous Endurance Run'],
      modalities: ['corrida_endurance', 'corrida_musculacao', 'triathlon'],
      objectives: ['Condicionamento Cardiorrespiratório', 'Saúde Cardiovascular', 'Capacidade Mitocondrial'],
      movementPattern: 'locomotion_cyclic',
      physicalCapacities: ['aerobic_endurance', 'fat_oxidation'],
      muscleGroups: ['panturrilha_gastrocnemio_soleo', 'quadriceps', 'isquiotibiais', 'cardiovascular'],
      requiredEquipment: ['tenis_corrida', 'esteira_ou_asfalto'],
      alternativeEquipment: ['esteira', 'pista_atletismo'],
      experienceLevels: ['iniciante', 'intermediario', 'avancado', 'atleta'],
      contraindications: ['fratura_estresse_tibia', 'fascite_plantar_aguda'],
      modalityParameters: {
        distanceKm: 8.0,
        durationMinutes: 48,
        paceMinKm: '6:00',
        heartRateZone: 'Z2 (65-75% FCH)',
        rpe: 5.0,
        restSeconds: 0,
        obs: 'Ritmo conversacional estável, respiração puramente nasal se possível. Foco em cadência suave (~170-175 spm).'
      }
    },
    {
      id: 'ex_run_intervals_vo2max',
      canonicalName: 'Tiros Intervalados de 800m em Z4-Z5 (Potência Aeróbica)',
      aliases: ['Tiros 800m', 'Interval Training VO2max', 'Speedwork'],
      modalities: ['corrida_endurance', 'corrida_musculacao', 'triathlon'],
      objectives: ['Performance em Corrida', 'VO2max', 'Tolerância ao Lactato'],
      movementPattern: 'aerobic_intervals',
      physicalCapacities: ['vo2max', 'lactate_tolerance', 'speed_endurance'],
      muscleGroups: ['quadriceps', 'panturrilhas', 'isquiotibiais', 'gluteo_maximo'],
      requiredEquipment: ['tenis_corrida', 'esteira_ou_asfalto'],
      alternativeEquipment: ['pista_atletismo', 'esteira'],
      experienceLevels: ['intermediario', 'avancado', 'atleta'],
      contraindications: ['lesao_muscular_recente', 'tendinopatia_aquiles_aguda'],
      modalityParameters: {
        intervals: '6 x 800m',
        distanceKm: 4.8,
        totalSessionKm: 8.5,
        targetPace: '4:15 min/km',
        heartRateZone: 'Z4-Z5 (>90% FCH)',
        restSecondsPerInterval: 90,
        restType: 'Trote suave regenerativo 200m',
        rpe: 8.5,
        obs: 'Aquecimento prévio obrigatório de 2km trote + educativos. Manter consistência temporal em todas as repetições.'
      }
    },
    {
      id: 'ex_run_tempo_run_threshold',
      canonicalName: 'Tempo Run Contínuo no Limiar de Lactato (Z3-Z4)',
      aliases: ['Tempo Run', 'Limiar Anaeróbio', 'Threshold Run'],
      modalities: ['corrida_endurance', 'corrida_musculacao', 'triathlon'],
      objectives: ['Limiar Anaeróbio', 'Economia de Corrida', 'Resistência Específica'],
      movementPattern: 'locomotion_cyclic',
      physicalCapacities: ['lactate_threshold', 'race_pace_economy'],
      muscleGroups: ['quadriceps', 'panturrilhas', 'isquiotibiais', 'cardiovascular'],
      requiredEquipment: ['tenis_corrida', 'esteira_ou_asfalto'],
      alternativeEquipment: ['esteira'],
      experienceLevels: ['intermediario', 'avancado', 'atleta'],
      contraindications: ['canelite_periostite_ativa'],
      modalityParameters: {
        distanceKm: 6.0,
        durationMinutes: 30,
        paceMinKm: '5:00',
        heartRateZone: 'Z3-Z4 (82-88% FCH)',
        rpe: 7.5,
        restSeconds: 0,
        obs: 'Ritmo confortavelmente duro. Sem oscilações bruscas de velocidade.'
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 3. CICLISMO / SPINNING (ciclismo_spinning)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_cyc_z2_endurance_ride',
      canonicalName: 'Rodagem Aeróbica Longa no Ciclismo em Z2 (Giro Contínuo)',
      aliases: ['Endurance Ride', 'Giro Z2', 'Zone 2 Cycling'],
      modalities: ['ciclismo_spinning', 'ciclismo_forca', 'triathlon'],
      objectives: ['Capacidade Oxidativa', 'Eficiência do Pedal', 'Saúde Cardiovascular'],
      movementPattern: 'locomotion_cyclic',
      physicalCapacities: ['aerobic_endurance', 'fat_metabolism'],
      muscleGroups: ['quadriceps', 'gluteo_maximo', 'soleo_panturrilha'],
      requiredEquipment: ['bicicleta_ou_rolo_ou_spinning'],
      alternativeEquipment: ['bike_ergometrica', 'spinning_bike'],
      experienceLevels: ['iniciante', 'intermediario', 'avancado'],
      contraindications: ['lombalgia_aguda_flexao', 'cervicalgia_severa'],
      modalityParameters: {
        durationMinutes: 60,
        powerWattsZone: 'Z2 (55-75% FTP)',
        cadenceRpm: 90,
        heartRateZone: 'Z2 (65-75% FCH)',
        rpe: 5.0,
        restSeconds: 0,
        obs: 'Cadência fluida entre 85-95 RPM, tronco relaxado no guidão sem tensão escapular desnecessária.'
      }
    },
    {
      id: 'ex_cyc_sweet_spot_intervals',
      canonicalName: 'Intervalos Sweet Spot (88-94% FTP / Potência Sustentada)',
      aliases: ['Sweet Spot Intervals', 'SST', 'Tiros Sweet Spot'],
      modalities: ['ciclismo_spinning', 'ciclismo_forca', 'triathlon'],
      objectives: ['Potência Sustentada', 'Aumento de FTP', 'Condicionamento'],
      movementPattern: 'aerobic_intervals',
      physicalCapacities: ['aerobic_power', 'lactate_clearance'],
      muscleGroups: ['quadriceps', 'gluteos', 'isquiotibiais'],
      requiredEquipment: ['bicicleta_ou_rolo_ou_spinning'],
      alternativeEquipment: ['bike_ergometrica'],
      experienceLevels: ['intermediario', 'avancado', 'atleta'],
      contraindications: ['tendinopatia_patelar_ativa'],
      modalityParameters: {
        intervals: '3 x 12 min em Sweet Spot (88-93% FTP)',
        durationMinutes: 55,
        powerWattsZone: '88-94% FTP',
        cadenceRpm: 88,
        restSecondsPerInterval: 240,
        restType: 'Giro leve regenerativo em Z1 (50% FTP)',
        rpe: 7.5,
        obs: 'Giro firme sem quebrar a cadência. Concentrar na respiração profunda rítmica.'
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 4. NATAÇÃO (natacao)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_swm_crawl_continuous_z2',
      canonicalName: 'Nado Livre Contínuo (Crawl) em Z2 Aeróbica',
      aliases: ['Crawl Contínuo', 'Nado Livre Z2', 'Freestyle Swim'],
      modalities: ['natacao', 'triathlon'],
      objectives: ['Condicionamento Cardiorrespiratório', 'Eficiência Propulsiva'],
      movementPattern: 'aquatic_cyclic',
      physicalCapacities: ['aerobic_endurance', 'shoulder_endurance'],
      muscleGroups: ['dorsal_lats', 'peitoral', 'deltoide_anterior', 'core'],
      requiredEquipment: ['piscina', 'oculos_natacao'],
      alternativeEquipment: ['touca', 'prancha'],
      experienceLevels: ['iniciante', 'intermediario', 'avancado'],
      contraindications: ['ombro_nadador_agudo', 'otite_media_ativa'],
      modalityParameters: {
        distanceMeters: 1000,
        durationMinutes: 25,
        strokeStyle: 'Crawl',
        poolPaceSeconds100m: 135,
        heartRateZone: 'Z2 (65-75% FCH)',
        restSeconds: 0,
        rpe: 5.5,
        obs: 'Respiração bilateral (a cada 3 braçadas), rotação suave do quadril e pegada alta de cotovelo.'
      }
    },
    {
      id: 'ex_swm_interval_sprints',
      canonicalName: 'Séries Intervaladas Fracionadas de 100m Crawl (VO2max Aquático)',
      aliases: ['Tiros 100m Natação', 'Intervalos Natação', 'Swim Drills'],
      modalities: ['natacao', 'triathlon'],
      objectives: ['Velocidade de Nado', 'Potência Aeróbica', 'Tolerância ao Lactato'],
      movementPattern: 'aquatic_intervals',
      physicalCapacities: ['aerobic_power', 'lactate_tolerance'],
      muscleGroups: ['dorsal_lats', 'triceps', 'deltoides', 'quadriceps_pernada'],
      requiredEquipment: ['piscina', 'oculos_natacao'],
      alternativeEquipment: ['palmares', 'pullbuoy'],
      experienceLevels: ['intermediario', 'avancado', 'atleta'],
      contraindications: ['lesao_manguito_nadador'],
      modalityParameters: {
        intervals: '10 x 100m Crawl com palmares ou nado livre',
        distanceMeters: 1000,
        durationMinutes: 30,
        strokeStyle: 'Crawl',
        restSecondsPerInterval: 25,
        restType: 'Pausa passiva na borda',
        rpe: 8.0,
        obs: 'Pernada de sustentação constante. Manter aceleração final na braçada subaquática.'
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 5. LUTAS / ARTES MARCIAIS (lutas_artes_marciais)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_cbt_shadow_boxing_footwork',
      canonicalName: 'Sombra Técnica com Deslocamentos e Esquivas (Shadow Boxing)',
      aliases: ['Shadow Boxing', 'Sombra Técnica', 'Footwork Drills'],
      modalities: ['lutas_artes_marciais'],
      objectives: ['Coordenação Motora Específica', 'Agilidade', 'Aquecimento Neuromuscular'],
      movementPattern: 'skill_drill',
      physicalCapacities: ['neuromuscular_coordination', 'agility', 'aerobic_capacity'],
      muscleGroups: ['deltoides', 'core_rotacional', 'panturrilhas', 'quadriceps'],
      requiredEquipment: ['tatame', 'espaco_livre'],
      alternativeEquipment: ['chao_solo'],
      experienceLevels: ['iniciante', 'intermediario', 'avancado'],
      contraindications: ['entorse_tornozelo_agudo'],
      modalityParameters: {
        roundsCount: 4,
        roundDurationMinutes: 3,
        restBetweenRoundsSeconds: 60,
        intensity: 'Moderada / Técnica',
        rpe: 6.0,
        obs: 'Golpes no ar com retenção articular, movimentação circular, troca de base e controle respiratório.'
      }
    },
    {
      id: 'ex_cbt_heavy_bag_combinations',
      canonicalName: 'Rounds de Saco Pesado com Combinações de Alta Intensidade',
      aliases: ['Saco Pesado', 'Heavy Bag Rounds', 'Combinações de Luta'],
      modalities: ['lutas_artes_marciais'],
      objectives: ['Potência de Golpe', 'Resistência Anaeróbia Lática', 'Condicionamento'],
      movementPattern: 'metabolic_conditioning',
      physicalCapacities: ['anaerobic_power', 'work_capacity', 'strike_impact'],
      muscleGroups: ['peitoral', 'dorsais', 'core_rotacional', 'quadriceps', 'quadris'],
      requiredEquipment: ['saco_pancadas', 'luvas_bandagens'],
      alternativeEquipment: ['manoplas_aparadores'],
      experienceLevels: ['intermediario', 'avancado', 'atleta'],
      contraindications: ['artrite_punho_aguda', 'fratura_metacarpo_recente'],
      modalityParameters: {
        roundsCount: 5,
        roundDurationMinutes: 3,
        restBetweenRoundsSeconds: 60,
        intensity: 'Alta (RPE 8.5)',
        rpe: 8.5,
        obs: 'Bandagens firmes obrigatórias. Alternar combinações rápidas de 3 a 5 golpes com saídas laterais e chutes potentes.'
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 6. AERÓBICO GERAL (aerobico_geral)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_aer_steady_rowing_ergometer',
      canonicalName: 'Remo Ergômetro Contínuo em Ritmo Aeróbico (RowErg Z2)',
      aliases: ['Rowing Steady', 'Remo Ergômetro', 'Concept2 Continuous'],
      modalities: ['aerobico_geral', 'hyrox_racing', 'misto_forca_cardio'],
      objectives: ['Capacidade Cardiorrespiratória Global', 'Gasto Energético', 'Impacto Zero'],
      movementPattern: 'locomotion_cyclic',
      physicalCapacities: ['aerobic_endurance', 'full_body_endurance'],
      muscleGroups: ['dorsais', 'isquiotibiais', 'gluteos', 'quadriceps', 'biceps'],
      requiredEquipment: ['remo_rowerg'],
      alternativeEquipment: ['airbike', 'eliptico'],
      experienceLevels: ['iniciante', 'intermediario', 'avancado'],
      contraindications: ['lombalgia_aguda_flexao_carga'],
      modalityParameters: {
        durationMinutes: 35,
        distanceMeters: 7500,
        strokeRateSpm: 22,
        paceMin500m: '2:15',
        heartRateZone: 'Z2 (65-75% FCH)',
        rpe: 5.5,
        restSeconds: 0,
        obs: 'Sequência biomecânica: pernas empurram, quadril abre, braços puxam. Retorno inverso com controle (ratio 1:2).'
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 7. CALISTENIA (calistenia)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_cal_pushup_progressions',
      canonicalName: 'Flexão de Braços no Solo (Variações e Progressões de Alavanca)',
      aliases: ['Push-up', 'Flexão de Braço', 'Bodyweight Push-up'],
      modalities: ['calistenia', 'funcional_misto', 'misto_forca_cardio'],
      objectives: ['Força de Empurrar com Peso Corporal', 'Estabilidade Escapular'],
      movementPattern: 'horizontal_push',
      physicalCapacities: ['calisthenic_strength', 'muscular_endurance'],
      muscleGroups: ['peitoral_maior', 'triceps_braquial', 'deltoide_anterior', 'serratil_anterior', 'core'],
      requiredEquipment: ['chao_solo', 'peso_corporal'],
      alternativeEquipment: ['paralelas', 'apoios_flexao'],
      experienceLevels: ['iniciante', 'intermediario', 'avancado'],
      contraindications: ['lesao_punho_hiperextensao', 'ombro_impacto_agudo'],
      modalityParameters: {
        leverageTier: 2,
        assistanceType: 'Peso Corporal Livre (ou joelhos para Tier 1, declinado para Tier 3)',
        sets: 4,
        reps: '10-15',
        rpe: 8.0,
        restSeconds: 60,
        obs: 'Corpo rígido em prancha ativa. Peito toca o solo mantendo cotovelos a ~45° do tronco.'
      }
    },
    {
      id: 'ex_cal_pullup_chinup_bars',
      canonicalName: 'Barra Fixa com Pegada Pronada ou Supinada',
      aliases: ['Pull-up', 'Chin-up', 'Barra Fixa'],
      modalities: ['calistenia', 'crossfit_funcional', 'musculacao_forca'],
      objectives: ['Força Relativa', 'Tração Vertical', 'Hipertrofia de Dorsais'],
      movementPattern: 'vertical_pull',
      physicalCapacities: ['calisthenic_strength', 'upper_body_power'],
      muscleGroups: ['dorsal_lats', 'biceps_braquial', 'braquiorradial', 'trapezio_inferior'],
      requiredEquipment: ['barra_fixa'],
      alternativeEquipment: ['argolas_ginasticas', 'elasticos_minibands'],
      experienceLevels: ['intermediario', 'avancado', 'atleta'],
      contraindications: ['epicondilite_medial_aguda', 'tendinite_bicipital'],
      modalityParameters: {
        leverageTier: 3,
        assistanceType: 'Livre (ou com elástico de assistência para iniciantes)',
        sets: 4,
        reps: '6-8',
        rpe: 8.5,
        restSeconds: 90,
        obs: 'Extensão completa no fundo com ativação escapular inicial antes da flexão dos cotovelos.'
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 8. HYROX / FITNESS RACING (hyrox_racing)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_hyx_sled_push_station',
      canonicalName: 'Sled Push (Empurrar Trenó com Carga Oficial HYROX)',
      aliases: ['Sled Push', 'Trenó HYROX', 'Empurrada de Trenó'],
      modalities: ['hyrox_racing', 'crossfit_funcional', 'funcional_misto'],
      objectives: ['Capacidade de Trabalho sob Fadiga', 'Força de Extensão de Quadríceps'],
      movementPattern: 'horizontal_drive',
      physicalCapacities: ['work_capacity', 'anaerobic_endurance', 'quad_power'],
      muscleGroups: ['quadriceps', 'gluteo_maximo', 'panturrilhas', 'core'],
      requiredEquipment: ['sled_treno', 'pista_grama_sintetica'],
      alternativeEquipment: ['esteira_manual', 'leg_press_unilateral_pesado'],
      experienceLevels: ['iniciante', 'intermediario', 'avancado', 'atleta'],
      contraindications: ['fascite_plantar_severa', 'lombalgia_aguda'],
      modalityParameters: {
        stationName: 'Sled Push',
        distanceMeters: '4 x 12.5m (50m total)',
        weightKg: '125kg feminino / 175kg masculino (incluindo trenó)',
        sets: 1,
        reps: '50m contínuos',
        rpe: 8.5,
        restSeconds: 90,
        obs: 'Braços estendidos ou flexionados travados nos postes, passadas firmes empurrando a pista com o antepé.'
      }
    },
    {
      id: 'ex_hyx_wall_balls_target',
      canonicalName: 'Wall Balls (Agachamento com Lançamento de Medicine Ball no Alvo)',
      aliases: ['Wall Balls', 'Wall Ball Shots', 'HYROX Wall Balls'],
      modalities: ['hyrox_racing', 'crossfit_funcional', 'metcon_hibrido'],
      objectives: ['Resistência Muscular Global', 'Finalizador Metabólico'],
      movementPattern: 'thruster_compound',
      physicalCapacities: ['muscular_endurance', 'cardiovascular_capacity'],
      muscleGroups: ['quadriceps', 'gluteos', 'deltoides', 'triceps', 'cardiovascular'],
      requiredEquipment: ['wall_ball', 'alvo_parede'],
      alternativeEquipment: ['medicine_ball', 'halteres_thruster'],
      experienceLevels: ['iniciante', 'intermediario', 'avancado'],
      contraindications: ['condromalacia_grau_4', 'lesao_manguito_aguda'],
      modalityParameters: {
        stationName: 'Wall Balls',
        targetHeightMeters: '2.75m feminino / 3.05m masculino',
        ballWeightKg: '6kg feminino / 9kg masculino',
        sets: 3,
        reps: '25-30 reps (total 75-100 reps)',
        rpe: 8.5,
        restSeconds: 60,
        obs: 'Agachar até quebrar o paralelo (90° de flexão de joelho) e impulsionar no topo acertando o centro do alvo.'
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 9. METCON / CIRCUITOS (metcon_hibrido)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_mtc_amrap_triplet',
      canonicalName: 'Circuito Triplet Funcional (AMRAP 15-20 Minutos)',
      aliases: ['AMRAP Triplet', 'Metcon AMRAP', 'Circuito Funcional'],
      modalities: ['metcon_hibrido', 'crossfit_funcional'],
      objectives: ['Condicionamento Metabólico', 'Densidade de Trabalho', 'Gasto Calórico'],
      movementPattern: 'metabolic_conditioning',
      physicalCapacities: ['glycolytic_power', 'work_capacity'],
      muscleGroups: ['full_body', 'cardiovascular'],
      requiredEquipment: ['kettlebells', 'caixa_salto', 'peso_corporal'],
      alternativeEquipment: ['halteres', 'chao_solo'],
      experienceLevels: ['intermediario', 'avancado'],
      contraindications: ['arritmia_cardiaca_instavel', 'hipertensao_nao_controlada'],
      modalityParameters: {
        circuitFormat: 'AMRAP (As Many Rounds As Possible)',
        timeCapMinutes: 18,
        roundsTarget: '5 a 7 rounds',
        exercisesSequence: '12 Kettlebell Swings (20kg) + 10 Box Jumps (60cm) + 8 Burpees',
        sets: 5,
        reps: '1 round completo',
        rpe: 8.5,
        restSeconds: 0,
        obs: 'Ritmo constante e sustentável. Não abrir em sprint para evitar quebra no terço inicial.'
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 10. CROSSFIT (crossfit_funcional)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_cf_thrusters_olympic',
      canonicalName: 'Thrusters com Barra Olímpica (Agachamento Frontal + Push Press)',
      aliases: ['Thruster', 'Barbell Thruster', 'WOD Thruster'],
      modalities: ['crossfit_funcional', 'metcon_hibrido'],
      objectives: ['Potência Total do Corpo', 'Condicionamento Metabólico Máximo'],
      movementPattern: 'full_body_power',
      physicalCapacities: ['anaerobic_power', 'work_capacity'],
      muscleGroups: ['quadriceps', 'gluteos', 'deltoides', 'triceps', 'core'],
      requiredEquipment: ['barra_olimpica', 'anilhas_bumper'],
      alternativeEquipment: ['halteres', 'kettlebells'],
      experienceLevels: ['intermediario', 'avancado', 'atleta'],
      contraindications: ['dor_femoropatelar_severa', 'impacto_ombro_vertical'],
      modalityParameters: {
        standardWeightKg: '30kg feminino / 43kg masculino (ou adaptado)',
        sets: 4,
        reps: '10-12',
        rpe: 8.5,
        restSeconds: 75,
        obs: 'Fluidez na transição: a extensão explosiva dos quadris impulsiona a barra acima da cabeça em movimento único contínuo.'
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 11. HIIT + MUSCULAÇÃO (hiit_musculacao)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_hit_tabata_airbike_finisher',
      canonicalName: 'Protocolo Tabata / Sprints em AirBike (Finalizador Metabólico Pós-Treino)',
      aliases: ['Tabata AirBike', 'HIIT Finisher', 'Echo Bike Sprints'],
      modalities: ['hiit_musculacao', 'misto_forca_cardio'],
      objectives: ['Queima Calórica Pós-Esforço (EPOC)', 'Capacidade Anaeróbia'],
      movementPattern: 'aerobic_intervals',
      physicalCapacities: ['glycolytic_power', 'vo2max'],
      muscleGroups: ['cardiovascular', 'quadriceps', 'membros_superiores'],
      requiredEquipment: ['airbike'],
      alternativeEquipment: ['esteira', 'corda_naval', 'bike_ergometrica'],
      experienceLevels: ['intermediario', 'avancado'],
      contraindications: ['hipertensao_arterial_descontrolada'],
      modalityParameters: {
        protocol: 'Tabata: 8 séries de 20s ALL-OUT / 10s descanso ativo',
        durationMinutes: 4,
        sets: 8,
        reps: '20s tiro / 10s pausa',
        rpe: 9.5,
        restSeconds: 10,
        obs: 'Executado estritamente APÓS o treino de força ou em turno oposto para evitar interferência mecânica nos pesos.'
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 12. TRIATHLON (triathlon)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_tri_brick_session_bike_run',
      canonicalName: 'Sessão Combinada Brick (Ciclismo Seguido Imediatamente de Corrida)',
      aliases: ['Brick Session', 'Transição T2', 'Bike to Run Brick'],
      modalities: ['triathlon'],
      objectives: ['Adaptação Neuromuscular de Transição (Pernas Pesadas)', 'Ritmo de Prova'],
      movementPattern: 'locomotion_cyclic',
      physicalCapacities: ['endurance_adaptation', 'neuro_motor_transition'],
      muscleGroups: ['quadriceps', 'panturrilhas', 'isquiotibiais', 'cardiovascular'],
      requiredEquipment: ['bicicleta_ou_rolo', 'tenis_corrida', 'asfalto_pista'],
      alternativeEquipment: ['bike_ergometrica', 'esteira'],
      experienceLevels: ['intermediario', 'avancado', 'atleta'],
      contraindications: ['sindrome_trato_iliotibial_ativa'],
      modalityParameters: {
        bikeDurationMinutes: 45,
        bikePowerZone: 'Z3 (75-85% FTP)',
        transitionTimeSeconds: 90,
        runDistanceKm: 4.0,
        runPace: 'Pace Alvo de Prova (ex: 4:45 min/km)',
        sets: 1,
        reps: '1 bloco contínuo',
        rpe: 8.0,
        restSeconds: 0,
        obs: 'Treino chave de transição. Foco em manter passadas rápidas e cadência alta nos primeiros 10 minutos de corrida.'
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 13. FUNCIONAL MISTO (funcional_misto)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_fnc_kettlebell_swing_hip_hinge',
      canonicalName: 'Kettlebell Swing Russo (Extensão Explosiva do Quadril)',
      aliases: ['KB Swing', 'Kettlebell Swing', 'Swing Funcional'],
      modalities: ['funcional_misto', 'metcon_hibrido', 'corrida_musculacao'],
      objectives: ['Potência de Cadeia Posterior', 'Estabilidade Lombar e de Core'],
      movementPattern: 'hip_dominant_ballistic',
      physicalCapacities: ['ballistic_power', 'posterior_chain_endurance'],
      muscleGroups: ['gluteo_maximo', 'isquiotibiais', 'core', 'dorsais'],
      requiredEquipment: ['kettlebells'],
      alternativeEquipment: ['halteres'],
      experienceLevels: ['iniciante', 'intermediario', 'avancado'],
      contraindications: ['lombalgia_aguda'],
      modalityParameters: {
        sets: 4,
        reps: '15-20',
        loadKg: 16,
        rpe: 7.5,
        restSeconds: 60,
        obs: 'Padrão estrito de dobradiça de quadril (hip hinge). Sem flexão primária de joelho e sem elevar o peso com os ombros.'
      }
    },
    {
      id: 'ex_fnc_pallof_press_anti_rotation',
      canonicalName: 'Pallof Press na Polia ou Elástico (Anti-Rotação de Core)',
      aliases: ['Pallof Press', 'Anti-Rotation Press'],
      modalities: ['funcional_misto', 'esportes_coletivos', 'musculacao_forca'],
      objectives: ['Estabilidade Central de Core', 'Proteção Lombar'],
      movementPattern: 'core_anti_rotation',
      physicalCapacities: ['isometric_stability', 'lumbar_protection'],
      muscleGroups: ['obliquos_interno_externo', 'transverso_abdomen', 'quadrado_lombar'],
      requiredEquipment: ['crossover_polias'],
      alternativeEquipment: ['elasticos_minibands'],
      experienceLevels: ['iniciante', 'intermediario', 'avancado'],
      contraindications: [],
      modalityParameters: {
        sets: 3,
        reps: '10-12 cada lado com 2s de pausa no ápice',
        rpe: 7.0,
        restSeconds: 45,
        obs: 'Pés paralelos firmes, bacia imóvel, empurrar o cabo para a frente sem permitir qualquer rotação do tronco.'
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 14. CORRIDA + MUSCULAÇÃO (corrida_musculacao)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_rns_bulgarian_split_squat',
      canonicalName: 'Agachamento Búlgaro com Halteres (Estabilidade Unipodal para Corredores)',
      aliases: ['Bulgarian Split Squat', 'Agachamento Búlgaro', 'Búlgaro Halteres'],
      modalities: ['corrida_musculacao', 'musculacao_forca', 'ciclismo_forca'],
      objectives: ['Força Unilateral', 'Prevenção de Lesões em Corredores', 'Estabilidade Pélvica'],
      movementPattern: 'unilateral_knee_dominant',
      physicalCapacities: ['unilateral_strength', 'glute_stability'],
      muscleGroups: ['quadriceps', 'gluteo_medio', 'gluteo_maximo'],
      requiredEquipment: ['halteres', 'banco_reto'],
      alternativeEquipment: ['peso_corporal'],
      experienceLevels: ['intermediario', 'avancado'],
      contraindications: ['tendinite_patelar_ativa'],
      modalityParameters: {
        sets: 3,
        reps: '8-10 cada perna',
        rpe: 8.0,
        restSeconds: 75,
        obs: 'Tronco ligeiramente inclinado à frente para maior ativação de glúteo e menos cisalhamento no joelho de apoio.'
      }
    },
    {
      id: 'ex_rns_seated_soleus_calf_raise',
      canonicalName: 'Elevação de Panturrilha Sentado (Foco em Sóleo e Tendão de Aquiles)',
      aliases: ['Panturrilha Sentado', 'Soleus Calf Raise', 'Gêmeos Sentado'],
      modalities: ['corrida_musculacao', 'corrida_endurance'],
      objectives: ['Resistência do Tendão de Aquiles', 'Propulsão de Corrida', 'Prevenção de Canelite'],
      movementPattern: 'ankle_plantarflexion',
      physicalCapacities: ['tendon_stiffness', 'muscular_endurance'],
      muscleGroups: ['soleo', 'tendao_aquiles'],
      requiredEquipment: ['maquinas_polias'],
      alternativeEquipment: ['halteres_sobre_joelhos'],
      experienceLevels: ['iniciante', 'intermediario', 'avancado'],
      contraindications: ['tendinopatia_aquiles_insercional_aguda'],
      modalityParameters: {
        sets: 4,
        reps: '12-15 com 2s de pausa no alongamento',
        rpe: 8.0,
        restSeconds: 60,
        obs: 'Com joelhos flexionados a 90°, o sóleo absorve a quase totalidade da carga. Essencial para economia de corrida.'
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 15. CICLISMO + FORÇA (ciclismo_forca)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_cys_leg_press_heavy_power',
      canonicalName: 'Leg Press 45° com Foco em Força e Potência de Pedalada',
      aliases: ['Leg Press 45', 'Leg Press Ciclismo', 'Leg Press Pesado'],
      modalities: ['ciclismo_forca', 'musculacao_forca'],
      objectives: ['Força Neuromuscular de Extensão', 'Potência de Subida na Bike'],
      movementPattern: 'knee_dominant',
      physicalCapacities: ['maximal_strength', 'pedal_power'],
      muscleGroups: ['quadriceps', 'gluteo_maximo'],
      requiredEquipment: ['leg_press', 'anilhas'],
      alternativeEquipment: ['hack_machine', 'agachamento_barra'],
      experienceLevels: ['iniciante', 'intermediario', 'avancado'],
      contraindications: ['lombalgia_em_retroversao_pelve'],
      modalityParameters: {
        sets: 4,
        reps: '6-8',
        rpe: 8.0,
        restSeconds: 120,
        obs: 'Pés na largura do quadril simulando a distância do pedal. Sem descolar a lombar do encosto no ponto de reversão.'
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 16. ESPORTES COLETIVOS (esportes_coletivos)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_tsp_shuttle_run_agility',
      canonicalName: 'Drills de Mudança de Direção (Shuttle Run 5-10-5 / Prontidão em Campo)',
      aliases: ['Shuttle Run', 'Pro Agility Drill', 'COD Agility'],
      modalities: ['esportes_coletivos'],
      objectives: ['Agilidade Reativa', 'Velocidade e Desaceleração', 'Prevenção de Lesões de LCA'],
      movementPattern: 'change_of_direction',
      physicalCapacities: ['agility', 'deceleration_control', 'reactive_power'],
      muscleGroups: ['quadriceps', 'adutores', 'gluteo_medio', 'core'],
      requiredEquipment: ['cones_agilidade', 'espaco_campo_quadra'],
      alternativeEquipment: ['espaco_livre'],
      experienceLevels: ['intermediario', 'avancado', 'atleta'],
      contraindications: ['lesao_ligamentar_joelho_recente', 'pubalgia_ativa'],
      modalityParameters: {
        sets: 5,
        reps: '3 repetições do teste 5-10-5m com 90s de intervalo',
        rpe: 8.5,
        restSeconds: 90,
        obs: 'Baixar o centro de gravidade nas frenagens, frear em 2-3 passos curtos e acelerar com explosão no vetor oposto.'
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 17. MISTO — FORÇA + CARDIO (misto_forca_cardio)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_mxc_incline_treadmill_walk',
      canonicalName: 'Caminhada Inclinada na Esteira em Zona 2 (Cardio Oxidativo Não Concorrente)',
      aliases: ['Incline Walk', 'Esteira Inclinada Z2', 'Cardio Não Concorrente'],
      modalities: ['misto_forca_cardio', 'musculacao_forca'],
      objectives: ['Gasto Calórico Oxidativo', 'Preservação de Massa Muscular'],
      movementPattern: 'locomotion_cyclic',
      physicalCapacities: ['aerobic_endurance', 'fat_oxidation'],
      muscleGroups: ['gluteos', 'panturrilhas', 'cardiovascular'],
      requiredEquipment: ['esteira'],
      alternativeEquipment: ['caminhada_ar_livre_ladeira'],
      experienceLevels: ['iniciante', 'intermediario', 'avancado'],
      contraindications: ['fascite_plantar_severa'],
      modalityParameters: {
        durationMinutes: 30,
        inclinePercent: 10,
        speedKmh: 5.2,
        heartRateZone: 'Z2 (65-75% FCH)',
        rpe: 5.0,
        restSeconds: 0,
        obs: 'Sem segurar nas hastes da esteira. Manter postura ereta com balanço natural dos braços.'
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // 18. NENHUM — SEDENTÁRIO (nenhum_sedentario)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 'ex_sed_daily_steps_accumulation',
      canonicalName: 'Meta de Passos Diários Progressivos no Celular / Relógio (5.000 a 7.000 Passos)',
      aliases: ['Passos Diários', 'Meta de Passos Sedentário', 'NEAT Booster'],
      modalities: ['nenhum_sedentario'],
      objectives: ['Quebra de Comportamento Sedentário', 'Saúde Metabólica Básica'],
      movementPattern: 'active_recovery',
      physicalCapacities: ['general_movement', 'metabolic_activation'],
      muscleGroups: ['full_body_light', 'cardiovascular_light'],
      requiredEquipment: ['peso_corporal'],
      alternativeEquipment: ['chao_solo'],
      experienceLevels: ['iniciante'],
      contraindications: [],
      modalityParameters: {
        initialDailySteps: 5000,
        targetDailySteps: 7000,
        weeklyGoalMinutes: 120,
        rpe: 3.5,
        restSeconds: 0,
        obs: 'Acumular passos ao longo do dia em pequenos blocos de 10 minutos após as refeições. Não exige esforço extenuante.'
      }
    },
    {
      id: 'ex_sed_chair_sit_to_stand',
      canonicalName: 'Sentar e Levantar da Cadeira com Apoio Seguro (Ativação Funcional Básica)',
      aliases: ['Sit to Stand', 'Sentar e Levantar Cadeira', 'Ativação Sedentário'],
      modalities: ['nenhum_sedentario'],
      objectives: ['Autonomia Funcional', 'Força Básica de Membros Inferiores', 'Transição Segura'],
      movementPattern: 'knee_dominant_safe',
      physicalCapacities: ['basic_functional_strength'],
      muscleGroups: ['quadriceps', 'gluteos'],
      requiredEquipment: ['cadeira_comum'],
      alternativeEquipment: ['peso_corporal'],
      experienceLevels: ['iniciante'],
      contraindications: ['tontura_ortostatica_severa'],
      modalityParameters: {
        sets: 3,
        reps: '8-10 reps suaves',
        rpe: 4.0,
        restSeconds: 60,
        obs: 'Sentar de forma controlada sem se jogar na cadeira. Subir empurrando o chão com os calcanhares. Apoiar as mãos nos joelhos se necessário.'
      }
    },
    {
      id: 'ex_sed_postural_breaks_mobility',
      canonicalName: 'Pausas Posturais Ativas & Alongamento Torácico na Parede',
      aliases: ['Pausa Postural', 'Alongamento Sedentário', 'Mobilidade Básica'],
      modalities: ['nenhum_sedentario'],
      objectives: ['Alívio de Tensões e Dores Posturais', 'Mobilidade Articular'],
      movementPattern: 'mobility_activation',
      physicalCapacities: ['joint_mobility'],
      muscleGroups: ['coluna_toracica', 'peitoral', 'isquiotibiais'],
      requiredEquipment: ['peso_corporal'],
      alternativeEquipment: ['toalha_parede'],
      experienceLevels: ['iniciante'],
      contraindications: [],
      modalityParameters: {
        sets: 2,
        reps: '5 minutos ao dia',
        rpe: 2.0,
        restSeconds: 0,
        obs: 'A cada 2 horas sentado, levantar-se, respirar fundo, esticar os braços para cima e abrir o peito por 2 minutos.'
      }
    }
  ]);

  /**
   * Protocolos Organizacionais de Sessões e Microciclos Semanais por Modalidade
   */
  const PROTOCOLS = Object.freeze({
    // Musculação: PPL, UpperLower, FullBody
    [ModalityCatalog.MODALITY_IDS.STRENGTH]: {
      defaultSplit: 'PPL',
      splitsByFrequency: {
        2: 'FullBody',
        3: 'PPL',
        4: 'UpperLower',
        5: 'PPL',
        6: 'PPL'
      },
      routineTemplates: {
        PPL: [
          { id: 'A', name: 'Treino A · Push Performance (Peito, Ombros & Tríceps)', focus: 'Empurrar', exercisesCount: 5 },
          { id: 'B', name: 'Treino B · Pull Performance (Costas, Trapézio & Bíceps)', focus: 'Puxar', exercisesCount: 5 },
          { id: 'C', name: 'Treino C · Legs Performance (Quadríceps, Isquiotibiais & Panturrilhas)', focus: 'Membros Inferiores', exercisesCount: 5 }
        ],
        UpperLower: [
          { id: 'A', name: 'Treino A · Upper Strength & Hypertrophy', focus: 'Membros Superiores', exercisesCount: 5 },
          { id: 'B', name: 'Treino B · Lower Strength & Hypertrophy', focus: 'Membros Inferiores', exercisesCount: 5 },
          { id: 'C', name: 'Treino C · Upper Hypertrophy & Pump', focus: 'Membros Superiores', exercisesCount: 5 },
          { id: 'D', name: 'Treino D · Lower Posterior & Glutes', focus: 'Membros Inferiores', exercisesCount: 5 }
        ],
        FullBody: [
          { id: 'A', name: 'Treino A · Full Body Fundações Motoras', focus: 'Corpo Inteiro', exercisesCount: 5 },
          { id: 'B', name: 'Treino B · Full Body Sobrecarga Global', focus: 'Corpo Inteiro', exercisesCount: 5 }
        ]
      }
    },

    // Corrida / Endurance
    [ModalityCatalog.MODALITY_IDS.RUNNING]: {
      defaultSplit: 'Corrida_Endurance',
      splitsByFrequency: { 2: 'Corrida_Endurance', 3: 'Corrida_Endurance', 4: 'Corrida_Endurance', 5: 'Corrida_Endurance' },
      routineTemplates: {
        Corrida_Endurance: [
          { id: 'A', name: 'Sessão A · Rodagem Aeróbica Contínua em Z2', focus: 'Base Oxidativa' },
          { id: 'B', name: 'Sessão B · Tiros Intervalados & Potência de VO2max', focus: 'Velocidade & Limiar' },
          { id: 'C', name: 'Sessão C · Tempo Run / Ritmo Controlado em Z3', focus: 'Economia de Corrida' },
          { id: 'D', name: 'Sessão D · Longão Dominical em Z2 com Progressão Final', focus: 'Resistência de Longa Duração' }
        ]
      }
    },

    // Ciclismo / Spinning
    [ModalityCatalog.MODALITY_IDS.CYCLING]: {
      defaultSplit: 'Ciclismo_Endurance',
      splitsByFrequency: { 2: 'Ciclismo_Endurance', 3: 'Ciclismo_Endurance', 4: 'Ciclismo_Endurance' },
      routineTemplates: {
        Ciclismo_Endurance: [
          { id: 'A', name: 'Giro A · Rodagem de Base Oxidativa em Z2', focus: 'Eficiência de Giro' },
          { id: 'B', name: 'Giro B · Intervalos Sweet Spot (88-94% FTP)', focus: 'Potência Sustentada' },
          { id: 'C', name: 'Giro C · Longão de Resistência & Cadência Fluida', focus: 'Volume Semanal' }
        ]
      }
    },

    // Natação
    [ModalityCatalog.MODALITY_IDS.SWIMMING]: {
      defaultSplit: 'Natacao_Performance',
      splitsByFrequency: { 2: 'Natacao_Performance', 3: 'Natacao_Performance', 4: 'Natacao_Performance' },
      routineTemplates: {
        Natacao_Performance: [
          { id: 'A', name: 'Treino A · Nado Livre Contínuo em Z2 & Educativos', focus: 'Eficiência de Braçada' },
          { id: 'B', name: 'Treino B · Tiros Fracionados de 100m no Limiar', focus: 'Potência Aeróbica Aquática' },
          { id: 'C', name: 'Treino C · Séries Medley & Resistência com Palmar', focus: 'Resistência Específica' }
        ]
      }
    },

    // Lutas / Artes Marciais
    [ModalityCatalog.MODALITY_IDS.COMBAT]: {
      defaultSplit: 'Lutas_Combate',
      splitsByFrequency: { 2: 'Lutas_Combate', 3: 'Lutas_Combate', 4: 'Lutas_Combate' },
      routineTemplates: {
        Lutas_Combate: [
          { id: 'A', name: 'Sessão A · Sombra Técnica, Deslocamentos & Agilidade', focus: 'Técnica & Timing' },
          { id: 'B', name: 'Sessão B · Rounds de Saco Pesado & Combinações de Impacto', focus: 'Potência & Resistência Lática' },
          { id: 'C', name: 'Sessão C · Sparring Controlado & Condicionamento de Luta', focus: 'Prontidão Combate' }
        ]
      }
    },

    // Aeróbico Geral
    [ModalityCatalog.MODALITY_IDS.AEROBIC]: {
      defaultSplit: 'AerobicoGeral',
      splitsByFrequency: { 2: 'AerobicoGeral', 3: 'AerobicoGeral', 4: 'AerobicoGeral' },
      routineTemplates: {
        AerobicoGeral: [
          { id: 'A', name: 'Sessão A · Remo Ergômetro Contínuo em Z2', focus: 'Capacidade Cardiovascular Total' },
          { id: 'B', name: 'Sessão B · AirBike / Elíptico Intervalado', focus: 'Gasto Calórico & VO2max' },
          { id: 'C', name: 'Sessão C · Caminhada Inclinada Regenerativa', focus: 'Recuperação Ativa' }
        ]
      }
    },

    // Calistenia
    [ModalityCatalog.MODALITY_IDS.CALISTHENICS]: {
      defaultSplit: 'Calistenia_Puro',
      splitsByFrequency: { 2: 'Calistenia_Puro', 3: 'Calistenia_Puro', 4: 'Calistenia_Puro' },
      routineTemplates: {
        Calistenia_Puro: [
          { id: 'A', name: 'Rotina A · Alavancas de Empurrar (Push) & Estabilidade', focus: 'Força de Peito & Ombros' },
          { id: 'B', name: 'Rotina B · Barras & Trações Verticais (Pull)', focus: 'Dorsais & Bíceps' },
          { id: 'C', name: 'Rotina C · Controle Corporal, Pernas & Core Isométrico', focus: 'Força Relativa' }
        ]
      }
    },

    // HYROX
    [ModalityCatalog.MODALITY_IDS.HYROX]: {
      defaultSplit: 'HYROX',
      splitsByFrequency: { 2: 'HYROX', 3: 'HYROX', 4: 'HYROX' },
      routineTemplates: {
        HYROX: [
          { id: 'A', name: 'Treino A · Estações de Força HYROX & Sled Drive', focus: 'Sled Push & Lunges' },
          { id: 'B', name: 'Treino B · Ergômetros (SkiErg / RowErg) & Corrida Intercalada', focus: 'Capacidade Aeróbica Contínua' },
          { id: 'C', name: 'Treino C · Simulado HYROX (Wall Balls, Burpees & Carry)', focus: 'Trabalho sob Fadiga Máxima' }
        ]
      }
    },

    // Metcon
    [ModalityCatalog.MODALITY_IDS.METCON]: {
      defaultSplit: 'MetconHibrido',
      splitsByFrequency: { 2: 'MetconHibrido', 3: 'MetconHibrido', 4: 'MetconHibrido' },
      routineTemplates: {
        MetconHibrido: [
          { id: 'A', name: 'WOD A · AMRAP 18min (Kettlebell, Saltos & Burpees)', focus: 'Densidade Metabólica' },
          { id: 'B', name: 'WOD B · EMOM 16min Força Funcional & Sprint Calórico', focus: 'Potência Intervalada' },
          { id: 'C', name: 'WOD C · For Time Chipper com Time Cap', focus: 'Resistência Anaeróbia' }
        ]
      }
    },

    // CrossFit
    [ModalityCatalog.MODALITY_IDS.CROSSFIT]: {
      defaultSplit: 'CrossFit',
      splitsByFrequency: { 3: 'CrossFit', 4: 'CrossFit', 5: 'CrossFit' },
      routineTemplates: {
        CrossFit: [
          { id: 'A', name: 'Treino A · LPO Força (Snatch/Clean) + Metcon Curto', focus: 'Força & Técnica' },
          { id: 'B', name: 'Treino B · Ginástica em Barra/Argolas + WOD Thrusters', focus: 'Controle Corporal & Potência' },
          { id: 'C', name: 'Treino C · Endurance Monoestrutural & Hero WOD Pacing', focus: 'Capacidade de Trabalho' }
        ]
      }
    },

    // HIIT + Musculação
    [ModalityCatalog.MODALITY_IDS.HIIT_STRENGTH]: {
      defaultSplit: 'HiitMusculacao',
      splitsByFrequency: { 3: 'HiitMusculacao', 4: 'HiitMusculacao' },
      routineTemplates: {
        HiitMusculacao: [
          { id: 'A', name: 'Treino A · Musculação Superior + HIIT AirBike Pós-Treino', focus: 'Força Tronco & EPOC' },
          { id: 'B', name: 'Treino B · Musculação Inferior com Foco Mecânico Puro', focus: 'Membros Inferiores (Sem HIIT Concorrente)' },
          { id: 'C', name: 'Treino C · Full Body Força Funcional + Bloco Tabata', focus: 'Potência & Definição' }
        ]
      }
    },

    // Triathlon
    [ModalityCatalog.MODALITY_IDS.TRIATHLON]: {
      defaultSplit: 'Triathlon_Periodizado',
      splitsByFrequency: { 3: 'Triathlon_Periodizado', 4: 'Triathlon_Periodizado', 5: 'Triathlon_Periodizado' },
      routineTemplates: {
        Triathlon_Periodizado: [
          { id: 'A', name: 'Sessão A · Natação Séries Contínuas & Educativos', focus: 'Água / Técnica' },
          { id: 'B', name: 'Sessão B · Ciclismo Sweet Spot Sustentado', focus: 'Ciclismo / FTP' },
          { id: 'C', name: 'Sessão C · Corrida em Z2 com Tiros Curtos', focus: 'Corrida / Economia' },
          { id: 'D', name: 'Sessão D · Brick Bike-to-Run (Transição T2)', focus: 'Transição Competitiva' }
        ]
      }
    },

    // Funcional Misto
    [ModalityCatalog.MODALITY_IDS.FUNCTIONAL]: {
      defaultSplit: 'FuncionalMisto',
      splitsByFrequency: { 2: 'FuncionalMisto', 3: 'FuncionalMisto', 4: 'FuncionalMisto' },
      routineTemplates: {
        FuncionalMisto: [
          { id: 'A', name: 'Bloco A · Core Anti-Rotacional & Padrões Unipodais', focus: 'Estabilidade & Equilíbrio' },
          { id: 'B', name: 'Bloco B · Potência Balística com Kettlebell & Arremessos', focus: 'Potência Muscular' },
          { id: 'C', name: 'Bloco C · Mobilidade Ativa & Circuito Cardio-Respiratório', focus: 'Capacidade Global' }
        ]
      }
    },

    // Corrida + Musculação
    [ModalityCatalog.MODALITY_IDS.RUNNING_STRENGTH]: {
      defaultSplit: 'RunningStrength',
      splitsByFrequency: { 3: 'RunningStrength', 4: 'RunningStrength' },
      routineTemplates: {
        RunningStrength: [
          { id: 'A', name: 'Dia A · Musculação Protetiva (Posteriores, Glúteos & Panturrilhas)', focus: 'Fortalecimento Estrutural' },
          { id: 'B', name: 'Dia B · Corrida Rodagem Aeróbica Z2', focus: 'Volume de Corrida' },
          { id: 'C', name: 'Dia C · Musculação Superior, Postura & Core Anti-Extensão', focus: 'Tronco & Economia de Corrida' },
          { id: 'D', name: 'Dia D · Corrida Treino de Ritmo / Tempo Run', focus: 'Limiar & Pace' }
        ]
      }
    },

    // Ciclismo + Força
    [ModalityCatalog.MODALITY_IDS.CYCLING_STRENGTH]: {
      defaultSplit: 'Ciclismo_Forca',
      splitsByFrequency: { 3: 'Ciclismo_Forca', 4: 'Ciclismo_Forca' },
      routineTemplates: {
        Ciclismo_Forca: [
          { id: 'A', name: 'Dia A · Força Máxima de Pernas no Leg Press & Core', focus: 'Potência de Pedalada' },
          { id: 'B', name: 'Dia B · Giro no Rolo / Estrada em Sweet Spot (88-93% FTP)', focus: 'Potência Sustentada' },
          { id: 'C', name: 'Dia C · Fortalecimento Postural de Tronco & Isquiotibiais', focus: 'Resistência de Guidão' },
          { id: 'D', name: 'Dia D · Giro Longo de Endurance em Z2', focus: 'Capacidade Oxidativa' }
        ]
      }
    },

    // Esportes Coletivos
    [ModalityCatalog.MODALITY_IDS.TEAM_SPORTS]: {
      defaultSplit: 'EsportesColetivos',
      splitsByFrequency: { 2: 'EsportesColetivos', 3: 'EsportesColetivos', 4: 'EsportesColetivos' },
      routineTemplates: {
        EsportesColetivos: [
          { id: 'A', name: 'Treino A · Força Reativa, Pliometria & Desaceleração', focus: 'Prevenção de Lesões & Pulos' },
          { id: 'B', name: 'Treino B · Mudança de Direção (COD Drills) & Sprints Curtos', focus: 'Agilidade de Jogo' },
          { id: 'C', name: 'Treino C · Força de Tronco, Ombros & Core Rotacional', focus: 'Contato Físico & Estabilidade' }
        ]
      }
    },

    // Misto (Força + Cardio)
    [ModalityCatalog.MODALITY_IDS.MIXED_CARDIO_STRENGTH]: {
      defaultSplit: 'MistoCardio',
      splitsByFrequency: { 3: 'MistoCardio', 4: 'MistoCardio' },
      routineTemplates: {
        MistoCardio: [
          { id: 'A', name: 'Treino A · Força Superior + 20min Cardio Oxidativo', focus: 'Tronco & Gasto Energético' },
          { id: 'B', name: 'Treino B · Força Inferior (Quadríceps & Glúteos)', focus: 'Membros Inferiores Puros' },
          { id: 'C', name: 'Treino C · Força Geral Funcional + Caminhada Inclinada Z2', focus: 'Condicionamento Sustentável' }
        ]
      }
    },

    // Sedentarismo
    [ModalityCatalog.MODALITY_IDS.SEDENTARY]: {
      defaultSplit: 'Sedentario_Adaptacao',
      splitsByFrequency: { 1: 'Sedentario_Adaptacao', 2: 'Sedentario_Adaptacao', 3: 'Sedentario_Adaptacao' },
      routineTemplates: {
        Sedentario_Adaptacao: [
          { id: 'A', name: 'Plano A · Quebra do Sedentarismo & Meta de Passos Diários', focus: 'Movimento Acumulado & Caminhadas Leves' },
          { id: 'B', name: 'Plano B · Mobilidade Básica em Casa & Alívio de Tensões', focus: 'Sentar/Levantar & Postura' }
        ]
      }
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // MÉTODOS DE CONSULTA, FILTRAGEM E SELEÇÃO DETERMINÍSTICA
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Retorna os metadados e versão do catálogo
   */
  function getVersionMetadata() {
    return {
      version: VERSION,
      revisionDate: REVISION_DATE,
      source: SOURCE_CONSENSUS,
      totalExercises: EXERCISES.length,
      supportedModalitiesCount: 18
    };
  }

  /**
   * Busca um exercício por ID estável
   * @param {string} exerciseId
   * @returns {Object|null}
   */
  function findExerciseById(exerciseId) {
    if (!exerciseId) return null;
    return EXERCISES.find(ex => ex.id === exerciseId) || null;
  }

  /**
   * Retorna todos os exercícios compatíveis com uma modalidade
   * @param {string} modalityInput
   * @returns {Array<Object>}
   */
  function getExercisesByModality(modalityInput) {
    const canonicalId = ModalityCatalog.resolveModalityId(modalityInput) || modalityInput;
    return EXERCISES.filter(ex => Array.isArray(ex.modalities) && ex.modalities.includes(canonicalId));
  }

  /**
   * Filtra exercícios elegíveis segundo critérios clínicos do paciente:
   * - Equipamentos disponíveis (ou substituições compatíveis)
   * - Exclusão estrita por lesões, contraindicações e exercícios proibidos
   * - Nível de experiência
   * 
   * @param {Object} criteria
   * @param {string} criteria.modalityId - Modalidade canônica
   * @param {Array<string>} [criteria.availableEquipment] - Equipamentos que o paciente possui
   * @param {Array<string>} [criteria.injuries] - Lesões / queixas clínicas
   * @param {Array<string>} [criteria.prohibitedExercises] - Exercícios explicitamente proibidos
   * @param {string} [criteria.experienceLevel] - 'iniciante' | 'intermediario' | 'avancado'
   * @returns {Array<Object>} Exercícios estritamente seguros e elegíveis
   */
  function filterEligibleExercises(criteria = {}) {
    const modalityId = ModalityCatalog.resolveModalityId(criteria.modalityId) || ModalityCatalog.MODALITY_IDS.STRENGTH;
    const baseExercises = getExercisesByModality(modalityId);

    const availableEquip = Array.isArray(criteria.availableEquipment)
      ? criteria.availableEquipment.map(e => String(e).toLowerCase().trim())
      : [];
    const isGymComplete = availableEquip.length === 0 || availableEquip.some(e => e.includes('completa') || e.includes('full') || e.includes('academia'));

    const injuries = Array.isArray(criteria.injuries)
      ? criteria.injuries.map(i => String(i).toLowerCase().trim())
      : [];

    const prohibitedNames = Array.isArray(criteria.prohibitedExercises)
      ? criteria.prohibitedExercises.map(p => String(p).toLowerCase().trim())
      : [];

    const experience = String(criteria.experienceLevel || 'intermediario').toLowerCase();

    return baseExercises.filter(ex => {
      // 1. Proibição por nome explícito ou alias
      const exNameLower = ex.canonicalName.toLowerCase();
      if (prohibitedNames.some(p => p && (exNameLower.includes(p) || (ex.aliases || []).some(a => a.toLowerCase().includes(p))))) {
        return false;
      }

      // 2. Contraindicação clínica / lesões
      if (injuries.length > 0 && Array.isArray(ex.contraindications)) {
        const hasInjuryConflict = ex.contraindications.some(ci => {
          const ciClean = ci.toLowerCase();
          return injuries.some(inj => inj.includes(ciClean) || ciClean.includes(inj));
        });
        if (hasInjuryConflict) return false;
      }

      // 3. Equipamentos disponíveis
      if (!isGymComplete && Array.isArray(ex.requiredEquipment) && ex.requiredEquipment.length > 0) {
        // Verifica se pelo menos o equipamento requerido ou um alternativo está disponível
        const hasRequired = ex.requiredEquipment.some(req => availableEquip.some(av => av.includes(req) || req.includes(av)));
        const hasAlternative = Array.isArray(ex.alternativeEquipment) && ex.alternativeEquipment.some(alt => availableEquip.some(av => av.includes(alt) || alt.includes(av)));
        const requiresOnlyBodyweight = ex.requiredEquipment.every(req => req.includes('peso_corporal') || req.includes('chao_solo'));

        if (!hasRequired && !hasAlternative && !requiresOnlyBodyweight) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Obtém o protocolo organizacional recomendado para a modalidade e frequência semanal
   * @param {string} modalityInput
   * @param {number} frequency - 1 a 7
   * @returns {Object} Protocolo e templates de rotina
   */
  function getProtocolForModalityAndFrequency(modalityInput, frequency = 3) {
    const canonicalId = ModalityCatalog.resolveModalityId(modalityInput) || ModalityCatalog.MODALITY_IDS.STRENGTH;
    const protocolData = PROTOCOLS[canonicalId] || PROTOCOLS[ModalityCatalog.MODALITY_IDS.STRENGTH];

    const freqNum = Math.max(1, Math.min(7, Number(frequency) || 3));
    const splitKey = (protocolData.splitsByFrequency && protocolData.splitsByFrequency[freqNum])
      ? protocolData.splitsByFrequency[freqNum]
      : (protocolData.defaultSplit || 'PPL');

    const templates = (protocolData.routineTemplates && protocolData.routineTemplates[splitKey])
      ? protocolData.routineTemplates[splitKey]
      : (protocolData.routineTemplates && Object.values(protocolData.routineTemplates)[0]) || [];

    return {
      modalityId: canonicalId,
      split: splitKey,
      frequency: freqNum,
      routineTemplates: templates
    };
  }

  function getAllExercises() {
    return EXERCISES.map(ex => ({
      ...ex,
      name: ex.canonicalName,
      modalityId: ex.modalities && ex.modalities[0] ? (ModalityCatalog.resolveModalityId(ex.modalities[0]) || 'HYPERTROPHY') : 'HYPERTROPHY',
      primaryMuscles: ex.muscleGroups || [],
      prescriptiveDefaults: ex.modalityParameters || { sets: 3, reps: '8-12', rpe: 8, restSeconds: 60 }
    }));
  }

  function getExerciseById(id) {
    const found = findExerciseById(id);
    if (!found) return null;
    return {
      ...found,
      name: found.canonicalName,
      modalityId: found.modalities && found.modalities[0] ? (ModalityCatalog.resolveModalityId(found.modalities[0]) || 'HYPERTROPHY') : 'HYPERTROPHY',
      primaryMuscles: found.muscleGroups || [],
      prescriptiveDefaults: found.modalityParameters || { sets: 3, reps: '8-12', rpe: 8, restSeconds: 60 }
    };
  }

  function filterExercises(criteria = {}) {
    const { modalityId, availableEquipment, contraindications } = criteria;
    const all = getAllExercises();
    return all.filter(ex => {
      if (modalityId) {
        const canonical = ModalityCatalog.resolveModalityId(modalityId);
        const matchesMod = ex.modalities && ex.modalities.some(m => ModalityCatalog.resolveModalityId(m) === canonical);
        if (!matchesMod && ex.modalityId !== canonical) return false;
      }
      if (Array.isArray(availableEquipment) && availableEquipment.length > 0) {
        const req = ex.requiredEquipment || [];
        const hasReq = req.length === 0 || req.some(eq => 
          availableEquipment.includes(eq) || 
          (eq === 'peso_corporal' && availableEquipment.includes('bodyweight')) ||
          (eq === 'bodyweight' && availableEquipment.includes('peso_corporal')) ||
          (eq === 'chao_solo' && availableEquipment.includes('bodyweight'))
        );
        if (!hasReq) return false;
      }
      if (Array.isArray(contraindications) && contraindications.length > 0) {
        const contra = (ex.contraindications || []).map(c => String(c).toLowerCase());
        const hasConflict = contraindications.some(c => {
          const lowerC = String(c).toLowerCase();
          return contra.some(ci => ci.includes(lowerC)) || (lowerC === 'shoulder' && contra.some(ci => ci.includes('ombro'))) || (lowerC === 'knee' && contra.some(ci => ci.includes('joelho') || ci.includes('patelar')));
        });
        if (hasConflict) return false;
      }
      return true;
    });
  }

  function findSubstitute(exercise, availableEquipment = []) {
    if (!exercise) return null;
    const all = getAllExercises();
    const candidate = all.find(cand => {
      if (cand.id === exercise.id) return false;
      const samePattern = cand.movementPattern && cand.movementPattern === exercise.movementPattern;
      const sameMuscle = cand.primaryMuscles && exercise.primaryMuscles && cand.primaryMuscles.some(m => exercise.primaryMuscles.includes(m));
      if (!samePattern && !sameMuscle) return false;
      if (Array.isArray(availableEquipment) && availableEquipment.length > 0) {
        const req = cand.requiredEquipment || [];
        return req.length === 0 || req.some(eq => 
          availableEquipment.includes(eq) || 
          (eq === 'peso_corporal' && availableEquipment.includes('bodyweight')) ||
          (eq === 'halteres' && availableEquipment.includes('dumbbells')) ||
          (eq === 'banco_reto' && availableEquipment.includes('bench'))
        );
      }
      return true;
    });
    return candidate || null;
  }

  return {
    VERSION,
    REVISION_DATE,
    SOURCE_CONSENSUS,
    EXERCISES,
    PROTOCOLS,
    getVersionMetadata,
    findExerciseById,
    getExercisesByModality,
    filterEligibleExercises,
    getProtocolForModalityAndFrequency,
    getAllExercises,
    getExerciseById,
    filterExercises,
    findSubstitute
  };
});
