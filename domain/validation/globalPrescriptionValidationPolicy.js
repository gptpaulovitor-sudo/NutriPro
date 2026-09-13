/**
 * domain/validation/globalPrescriptionValidationPolicy.js
 * 
 * Política Versionada de Validação Global da Prescrição Nutricional — NutriAx Pro.
 * Fase N3.6 — Validação Global Determinística.
 * 
 * Camada Pura — Zero I/O, sem dependências externas, parâmetros técnicos e auditáveis.
 * 
 * REGRA CANÔNICA DE TOLERÂNCIAS:
 * Zero alteração semântica downstream, com tolerâncias numéricas técnicas explicitamente
 * versionadas para absorver representação decimal e resíduos de ponto flutuante.
 */

'use strict';

const { deepFreeze } = require('../contracts/GlobalPrescriptionValidationContract');

const DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY = Object.freeze({
  version: 'N3.6.0',

  // Tolerâncias técnicas downstream (N3.2 -> N3.3 -> N3.4 -> N3.5 -> N3.6)
  massToleranceGrams: 0.01,
  calorieToleranceKcal: 0.05,
  proteinToleranceGrams: 0.05,
  carbohydrateToleranceGrams: 0.05,
  lipidToleranceGrams: 0.05,
  fiberToleranceGrams: 0.05,
  sodiumToleranceMg: 0.05,

  // Tolerância para coerência Atwater (4P + 4C + 9F vs valor fechado)
  atwaterToleranceKcal: 1.0,

  // Tratamento de Fasted Training
  allowFastedTrainingWithWarning: true,

  // Obrigatoriedade de congelamento profundo
  enforceDeepFreeze: true
});

/**
 * Cria uma instância validada e imutável de política de validação global
 * @param {Object} [overrides={}] 
 * @returns {Object}
 */
function createGlobalPrescriptionValidationPolicy(overrides = {}) {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    return DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY;
  }

  const policy = {
    version: overrides.version || DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.version,
    massToleranceGrams: typeof overrides.massToleranceGrams === 'number' && Number.isFinite(overrides.massToleranceGrams)
      ? Math.abs(overrides.massToleranceGrams)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.massToleranceGrams,
    calorieToleranceKcal: typeof overrides.calorieToleranceKcal === 'number' && Number.isFinite(overrides.calorieToleranceKcal)
      ? Math.abs(overrides.calorieToleranceKcal)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.calorieToleranceKcal,
    proteinToleranceGrams: typeof overrides.proteinToleranceGrams === 'number' && Number.isFinite(overrides.proteinToleranceGrams)
      ? Math.abs(overrides.proteinToleranceGrams)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.proteinToleranceGrams,
    carbohydrateToleranceGrams: typeof overrides.carbohydrateToleranceGrams === 'number' && Number.isFinite(overrides.carbohydrateToleranceGrams)
      ? Math.abs(overrides.carbohydrateToleranceGrams)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.carbohydrateToleranceGrams,
    lipidToleranceGrams: typeof overrides.lipidToleranceGrams === 'number' && Number.isFinite(overrides.lipidToleranceGrams)
      ? Math.abs(overrides.lipidToleranceGrams)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.lipidToleranceGrams,
    fiberToleranceGrams: typeof overrides.fiberToleranceGrams === 'number' && Number.isFinite(overrides.fiberToleranceGrams)
      ? Math.abs(overrides.fiberToleranceGrams)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.fiberToleranceGrams,
    sodiumToleranceMg: typeof overrides.sodiumToleranceMg === 'number' && Number.isFinite(overrides.sodiumToleranceMg)
      ? Math.abs(overrides.sodiumToleranceMg)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.sodiumToleranceMg,
    atwaterToleranceKcal: typeof overrides.atwaterToleranceKcal === 'number' && Number.isFinite(overrides.atwaterToleranceKcal)
      ? Math.abs(overrides.atwaterToleranceKcal)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.atwaterToleranceKcal,
    allowFastedTrainingWithWarning: overrides.allowFastedTrainingWithWarning !== undefined
      ? Boolean(overrides.allowFastedTrainingWithWarning)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.allowFastedTrainingWithWarning,
    enforceDeepFreeze: overrides.enforceDeepFreeze !== undefined
      ? Boolean(overrides.enforceDeepFreeze)
      : DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY.enforceDeepFreeze
  };

  return deepFreeze(policy);
}

module.exports = deepFreeze({
  DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY,
  createGlobalPrescriptionValidationPolicy
});
