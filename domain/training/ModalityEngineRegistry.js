/**
 * domain/training/ModalityEngineRegistry.js
 * 
 * Registro Central e Despachante Canônico dos Motores de Treinamento.
 * Roteia cada uma das 18 modalidades oficiais para o seu respectivo motor de prescrição.
 * 
 * Camada de Domínio Puro — Sem dependência de DOM, Dexie ou Firebase.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./ModalityCatalog'),
      require('./EquipmentService'),
      require('./RecoveryEngine'),
      require('./ProgressionEngine'),
      require('./engines/StrengthEngine'),
      require('./engines/RunningEngine'),
      require('./engines/CyclingEngine'),
      require('./engines/SwimmingEngine'),
      require('./engines/CombatEngine'),
      require('./engines/AerobicEngine'),
      require('./engines/CalisthenicsEngine'),
      require('./engines/HyroxEngine'),
      require('./engines/MetconEngine'),
      require('./engines/CrossfitEngine'),
      require('./engines/HiitStrengthEngine'),
      require('./engines/TriathlonEngine'),
      require('./engines/FunctionalEngine'),
      require('./engines/RunningStrengthEngine'),
      require('./engines/CyclingStrengthEngine'),
      require('./engines/TeamSportsEngine'),
      require('./engines/MixedCardioStrengthEngine'),
      require('./engines/SedentaryEngine')
    );
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Engines = root.NutriDomain.Engines || {};
    root.NutriDomain.ModalityEngineRegistry = factory(
      root.NutriDomain.ModalityCatalog,
      root.NutriDomain.EquipmentService,
      root.NutriDomain.RecoveryEngine,
      root.NutriDomain.ProgressionEngine,
      root.NutriDomain.Engines.StrengthEngine,
      root.NutriDomain.Engines.RunningEngine,
      root.NutriDomain.Engines.CyclingEngine,
      root.NutriDomain.Engines.SwimmingEngine,
      root.NutriDomain.Engines.CombatEngine,
      root.NutriDomain.Engines.AerobicEngine,
      root.NutriDomain.Engines.CalisthenicsEngine,
      root.NutriDomain.Engines.HyroxEngine,
      root.NutriDomain.Engines.MetconEngine,
      root.NutriDomain.Engines.CrossfitEngine,
      root.NutriDomain.Engines.HiitStrengthEngine,
      root.NutriDomain.Engines.TriathlonEngine,
      root.NutriDomain.Engines.FunctionalEngine,
      root.NutriDomain.Engines.RunningStrengthEngine,
      root.NutriDomain.Engines.CyclingStrengthEngine,
      root.NutriDomain.Engines.TeamSportsEngine,
      root.NutriDomain.Engines.MixedCardioStrengthEngine,
      root.NutriDomain.Engines.SedentaryEngine
    );
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (
  ModalityCatalog,
  EquipmentService,
  RecoveryEngine,
  ProgressionEngine,
  StrengthEngine,
  RunningEngine,
  CyclingEngine,
  SwimmingEngine,
  CombatEngine,
  AerobicEngine,
  CalisthenicsEngine,
  HyroxEngine,
  MetconEngine,
  CrossfitEngine,
  HiitStrengthEngine,
  TriathlonEngine,
  FunctionalEngine,
  RunningStrengthEngine,
  CyclingStrengthEngine,
  TeamSportsEngine,
  MixedCardioStrengthEngine,
  SedentaryEngine
) {
  'use strict';

  const ENGINES_MAP = Object.freeze({
    [ModalityCatalog.MODALITY_IDS.STRENGTH]: StrengthEngine,
    [ModalityCatalog.MODALITY_IDS.RUNNING]: RunningEngine,
    [ModalityCatalog.MODALITY_IDS.CYCLING]: CyclingEngine,
    [ModalityCatalog.MODALITY_IDS.SWIMMING]: SwimmingEngine,
    [ModalityCatalog.MODALITY_IDS.COMBAT]: CombatEngine,
    [ModalityCatalog.MODALITY_IDS.AEROBIC]: AerobicEngine,
    [ModalityCatalog.MODALITY_IDS.CALISTHENICS]: CalisthenicsEngine,
    [ModalityCatalog.MODALITY_IDS.HYROX]: HyroxEngine,
    [ModalityCatalog.MODALITY_IDS.METCON]: MetconEngine,
    [ModalityCatalog.MODALITY_IDS.CROSSFIT]: CrossfitEngine,
    [ModalityCatalog.MODALITY_IDS.HIIT_STRENGTH]: HiitStrengthEngine,
    [ModalityCatalog.MODALITY_IDS.TRIATHLON]: TriathlonEngine,
    [ModalityCatalog.MODALITY_IDS.FUNCTIONAL]: FunctionalEngine,
    [ModalityCatalog.MODALITY_IDS.RUNNING_STRENGTH]: RunningStrengthEngine,
    [ModalityCatalog.MODALITY_IDS.CYCLING_STRENGTH]: CyclingStrengthEngine,
    [ModalityCatalog.MODALITY_IDS.TEAM_SPORTS]: TeamSportsEngine,
    [ModalityCatalog.MODALITY_IDS.MIXED_CARDIO_STRENGTH]: MixedCardioStrengthEngine,
    [ModalityCatalog.MODALITY_IDS.SEDENTARY]: SedentaryEngine
  });

  /**
   * Obtém o motor associado à modalidade
   * @param {string} modalityInput 
   * @returns {Object} Motor correspondente
   */
  function getEngine(modalityInput) {
    const canonicalId = ModalityCatalog.resolveModalityId(modalityInput) || modalityInput;
    return ENGINES_MAP[canonicalId] || StrengthEngine;
  }

  /**
   * Gera uma prescrição completa da modalidade
   * @param {string} modalityInput 
   * @param {Object} context 
   * @param {Object} options 
   * @returns {Object} Prescrição gerada pelo motor específico
   */
  function generatePrescription(modalityInput, context = {}, options = {}) {
    const canonicalId = ModalityCatalog.resolveModalityId(modalityInput) || ModalityCatalog.MODALITY_IDS.STRENGTH;
    const metadata = ModalityCatalog.getModalityMetadata(canonicalId);
    const engine = getEngine(canonicalId);

    const plan = engine.generateRoutines(context, { ...options, modalityId: canonicalId, metadata });
    const rawRoutines = Array.isArray(plan?.routines) ? plan.routines : [];
    const normalizedRoutines = rawRoutines.map(r => {
      const routineName = r.name || r.routineName || `Treino ${r.id || 'A'}`;
      const rawExercises = Array.isArray(r.exercises) ? r.exercises : [];
      return {
        ...r,
        id: r.id || 'A',
        name: routineName,
        routineName: routineName,
        exercises: rawExercises.map(ex => {
          const exName = ex.name || ex.exerciseName || 'Exercício';
          return {
            ...ex,
            name: exName,
            exerciseName: exName,
            sets: Number(ex.sets) || 1,
            reps: ex.reps != null ? String(ex.reps) : '10',
            rpe: Number(ex.rpe) || 7,
            rest: ex.rest != null ? Number(ex.rest) : (ex.restSeconds != null ? Number(ex.restSeconds) : 60),
            restSeconds: ex.restSeconds != null ? Number(ex.restSeconds) : (ex.rest != null ? Number(ex.rest) : 60),
            roundsCount: ex.roundsCount || r.roundsCount || (r.format === 'AMRAP' ? 5 : (r.format === 'EMOM' ? 4 : undefined)),
            timeCapMinutes: ex.timeCapMinutes || r.timeCapMinutes || undefined,
            progressionLevel: ex.progressionLevel || (ex.leverageTier ? `Nível ${ex.leverageTier} · Tier ${ex.leverageTier}` : undefined)
          };
        })
      };
    });

    return {
      modalityId: canonicalId,
      modalityName: metadata ? metadata.name : 'Musculação / Força',
      category: metadata ? metadata.category : 'Força & Hipertrofia',
      isHybrid: metadata ? metadata.isHybrid : false,
      primaryMetrics: metadata ? metadata.primaryMetrics : [],
      requiredEquipment: metadata ? metadata.requiredEquipment : [],
      sessionStructure: metadata ? metadata.sessionStructure : 'series_repeticoes',
      split: plan.split || (metadata ? metadata.defaultSplit : 'PPL'),
      routines: normalizedRoutines,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Valida uma rotina segundo as regras da modalidade
   * @param {string} modalityInput 
   * @param {Object} routine 
   * @returns {{ isValid: boolean, errors: Array<string> }}
   */
  function validatePrescription(modalityInput, routine) {
    const canonicalId = ModalityCatalog.resolveModalityId(modalityInput) || ModalityCatalog.MODALITY_IDS.STRENGTH;
    const engine = getEngine(canonicalId);
    if (typeof engine.validateRoutine === 'function') {
      return engine.validateRoutine(routine);
    }
    return { isValid: true, errors: [] };
  }

  return {
    ENGINES_MAP,
    getEngine,
    generatePrescription,
    validatePrescription
  };
});
