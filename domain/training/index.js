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
      require('./ModalityEngineRegistry')
    );
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.Training = factory(
      root.NutriDomain.ModalityCatalog,
      root.NutriDomain.EquipmentService,
      root.NutriDomain.RecoveryEngine,
      root.NutriDomain.ProgressionEngine,
      root.NutriDomain.ModalityEngineRegistry
    );
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (
  ModalityCatalog,
  EquipmentService,
  RecoveryEngine,
  ProgressionEngine,
  ModalityEngineRegistry
) {
  'use strict';

  return {
    ModalityCatalog,
    EquipmentService,
    RecoveryEngine,
    ProgressionEngine,
    ModalityEngineRegistry
  };
});
