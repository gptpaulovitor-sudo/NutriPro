/**
 * domain/training/index.js
 * 
 * Ponto Único de Entrada do Domínio de Treinamento e Prescrição Modular do NutriAx Pro.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./ModalityCatalog'),
      require('./EquipmentService'),
      require('./RecoveryEngine'),
      require('./ProgressionEngine'),
      require('./ModalityEngineRegistry'),
      require('./InternalTrainingDatabase'),
      require('./DeterministicTrainingGenerator'),
      require('./TrainingGenerationStateMachine')
    );
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Training = factory(
      root.NutriDomain.ModalityCatalog,
      root.NutriDomain.EquipmentService,
      root.NutriDomain.RecoveryEngine,
      root.NutriDomain.ProgressionEngine,
      root.NutriDomain.ModalityEngineRegistry,
      root.NutriDomain.InternalTrainingDatabase,
      root.NutriDomain.DeterministicTrainingGenerator,
      root.NutriDomain.TrainingGenerationStateMachine
    );
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (
  ModalityCatalog,
  EquipmentService,
  RecoveryEngine,
  ProgressionEngine,
  ModalityEngineRegistry,
  InternalTrainingDatabase,
  DeterministicTrainingGenerator,
  TrainingGenerationStateMachine
) {
  'use strict';

  return {
    ModalityCatalog,
    EquipmentService,
    RecoveryEngine,
    ProgressionEngine,
    ModalityEngineRegistry,
    InternalTrainingDatabase,
    DeterministicTrainingGenerator,
    TrainingGenerationStateMachine
  };
});
