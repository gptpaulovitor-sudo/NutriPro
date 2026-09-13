/**
 * domain/validation/index.js
 * 
 * Ponto Único de Exportação do Subsistema de Validação Global da Prescrição — NutriAx Pro.
 * Fase N3.6 — Validação Global Determinística.
 * 
 * Camada Pura — Sem I/O de infraestrutura, sem persistência externa, sem dependências remotas.
 */

'use strict';

const GlobalPrescriptionValidationContract = require('../contracts/GlobalPrescriptionValidationContract');
const globalPrescriptionValidationPolicy = require('./globalPrescriptionValidationPolicy');
const globalPrescriptionValidator = require('./globalPrescriptionValidator');

const validationSubsystem = {
  // Contratos e Enums
  CONTRACT_VERSION: GlobalPrescriptionValidationContract.CONTRACT_VERSION,
  GLOBAL_VALIDATION_VERSION: GlobalPrescriptionValidationContract.GLOBAL_VALIDATION_VERSION,
  GLOBAL_VALIDATION_STATUS: GlobalPrescriptionValidationContract.GLOBAL_VALIDATION_STATUS,
  GLOBAL_GATE_ID: GlobalPrescriptionValidationContract.GLOBAL_GATE_ID,
  GATE_SEVERITY: GlobalPrescriptionValidationContract.GATE_SEVERITY,
  validateGlobalPrescriptionValidationInput: GlobalPrescriptionValidationContract.validateGlobalPrescriptionValidationInput,
  validateGlobalPrescriptionValidationOutput: GlobalPrescriptionValidationContract.validateGlobalPrescriptionValidationOutput,
  deepFreeze: GlobalPrescriptionValidationContract.deepFreeze,

  // Políticas e Tolerâncias
  DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY: globalPrescriptionValidationPolicy.DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY,
  createGlobalPrescriptionValidationPolicy: globalPrescriptionValidationPolicy.createGlobalPrescriptionValidationPolicy,

  // Motor Determinístico de Validação Global
  validateGlobalPrescription: globalPrescriptionValidator.validateGlobalPrescription
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = validationSubsystem;
}

if (typeof globalThis !== 'undefined') {
  globalThis.NutriDomain = globalThis.NutriDomain || {};
  globalThis.NutriDomain.validation = validationSubsystem;
}
