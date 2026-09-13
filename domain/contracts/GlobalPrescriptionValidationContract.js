/**
 * domain/contracts/GlobalPrescriptionValidationContract.js
 * 
 * Contrato Canônico de Entrada e Saída da Validação Global da Prescrição Nutricional — NutriAx Pro.
 * Fase N3.6 — Auditoria e Validação Global Determinística.
 * 
 * Camada Pura — Sem I/O, sem UI, sem dependências externas, sem efeitos colaterais.
 * 
 * Princípio Reitor:
 * "N2/N3 prescrevem/analisam. N3.6 apenas valida a coerência global do resultado."
 */

'use strict';

const CONTRACT_VERSION = 'N3.6.0';
const GLOBAL_VALIDATION_VERSION = 'N3.6.0';

/**
 * Status formais de saída da Validação Global
 * NOTA ARQUITETURAL: Não existe NO_SOLUTION na N3.6 (pertence exclusivamente ao Solver N3.2).
 */
const GLOBAL_VALIDATION_STATUS = Object.freeze({
  PASS: 'PASS',
  WARNING: 'WARNING',
  BLOCKED: 'BLOCKED'
});

/**
 * Identificadores canônicos dos 20 Portões Invariantes Globais (G1 a G20)
 */
const GLOBAL_GATE_ID = Object.freeze({
  G1_CONTEXT: 'G1_CONTEXT',
  G2_ENERGY_TARGET: 'G2_ENERGY_TARGET',
  G3_MACRO_TARGET: 'G3_MACRO_TARGET',
  G4_NUTRITION_VALIDATOR: 'G4_NUTRITION_VALIDATOR',
  G5_FOOD_SOLVER: 'G5_FOOD_SOLVER',
  G6_MEAL_ASSEMBLY: 'G6_MEAL_ASSEMBLY',
  G7_MEAL_TIMING: 'G7_MEAL_TIMING',
  G8_NUTRIENT_TIMING: 'G8_NUTRIENT_TIMING',
  G9_FOOD_IDENTITY: 'G9_FOOD_IDENTITY',
  G10_MASS_CONSERVATION: 'G10_MASS_CONSERVATION',
  G11_NUTRIENT_CONSERVATION: 'G11_NUTRIENT_CONSERVATION',
  G12_ATWATER_CLOSURE: 'G12_ATWATER_CLOSURE',
  G13_MEAL_IDENTITY: 'G13_MEAL_IDENTITY',
  G14_TEMPORAL_INTEGRITY: 'G14_TEMPORAL_INTEGRITY',
  G15_EVENT_TRACEABILITY: 'G15_EVENT_TRACEABILITY',
  G16_FASTING_COHERENCE: 'G16_FASTING_COHERENCE',
  G17_NUTRIENT_TIMING_INTEGRITY: 'G17_NUTRIENT_TIMING_INTEGRITY',
  G18_PROVENANCE_INTEGRITY: 'G18_PROVENANCE_INTEGRITY',
  G19_DETERMINISM: 'G19_DETERMINISM',
  G20_IMMUTABILITY: 'G20_IMMUTABILITY'
});

/**
 * Severidade de cada verificação
 */
const GATE_SEVERITY = Object.freeze({
  BLOCKING: 'BLOCKING',
  WARNING: 'WARNING',
  INFORMATIONAL: 'INFORMATIONAL'
});

/**
 * Congelamento profundo determinístico e recursivo
 * @param {Object} obj 
 * @returns {Object}
 */
function deepFreeze(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Object.isFrozen(obj)) return obj;

  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const val = obj[prop];
    if (val !== null && (typeof val === 'object' || typeof val === 'function') && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  });

  return obj;
}

/**
 * Valida o Contrato de Entrada GlobalPrescriptionValidationInputDTO
 * @param {Object} input 
 * @returns {{ isValid: boolean, isBlocked: boolean, errors: string[] }}
 */
function validateGlobalPrescriptionValidationInput(input) {
  const errors = [];
  let isBlocked = false;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      isBlocked: true,
      errors: ['Input de validação global deve ser um objeto válido e não-nulo.']
    };
  }

  // 1. Contexto Canônico de Prescrição Nutricional (N1.1)
  if (!input.context || typeof input.context !== 'object') {
    errors.push('context é obrigatório e deve ser um objeto.');
    isBlocked = true;
  }

  // 2. Verificação de Presença de Resultados Anteriores (ou pacote consolidado)
  const hasDecoupledChain = (
    input.energyTargetResult ||
    input.macroTargetResult ||
    input.nutritionValidatorResult ||
    input.foodSolverResult ||
    input.mealAssemblyResult ||
    input.mealTimingResult ||
    input.nutrientTimingResult
  );

  if (!hasDecoupledChain) {
    errors.push('Input de validação global deve conter resultados das fases anteriores (de N2.1 a N3.5).');
    isBlocked = true;
  }

  return {
    isValid: errors.length === 0,
    isBlocked,
    errors
  };
}

/**
 * Valida o Contrato de Saída GlobalPrescriptionValidationOutputDTO
 * @param {Object} output 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateGlobalPrescriptionValidationOutput(output) {
  const errors = [];

  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return {
      isValid: false,
      errors: ['Output de validação global deve ser um objeto válido e não-nulo.']
    };
  }

  if (output.globalValidationVersion !== GLOBAL_VALIDATION_VERSION) {
    errors.push(`globalValidationVersion inválida (esperado "${GLOBAL_VALIDATION_VERSION}", recebido "${output.globalValidationVersion}").`);
  }

  if (!output.status || !Object.values(GLOBAL_VALIDATION_STATUS).includes(output.status)) {
    errors.push(`status inválido: "${output.status}".`);
  }

  if (typeof output.valid !== 'boolean') {
    errors.push('valid deve ser um booleano.');
  }

  if (!Array.isArray(output.gateResults)) {
    errors.push('gateResults deve ser um array de resultados dos portões.');
  }

  if (!output.conservationAudit || typeof output.conservationAudit !== 'object') {
    errors.push('conservationAudit deve ser um objeto com os cálculos de auditoria bromatológica.');
  }

  if (!output.temporalAudit || typeof output.temporalAudit !== 'object') {
    errors.push('temporalAudit deve ser um objeto com a auditoria de horários.');
  }

  if (!Array.isArray(output.globalDiagnostics)) {
    errors.push('globalDiagnostics deve ser um array.');
  }

  if (!Array.isArray(output.inheritedWarnings)) {
    errors.push('inheritedWarnings deve ser um array.');
  }

  if (!Array.isArray(output.validationWarnings)) {
    errors.push('validationWarnings deve ser um array.');
  }

  if (!Array.isArray(output.blockingReasons)) {
    errors.push('blockingReasons deve ser um array.');
  }

  if (!output.globalProvenance || typeof output.globalProvenance !== 'object') {
    errors.push('globalProvenance deve ser um objeto estruturado de rastreabilidade.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = deepFreeze({
  CONTRACT_VERSION,
  GLOBAL_VALIDATION_VERSION,
  GLOBAL_VALIDATION_STATUS,
  GLOBAL_GATE_ID,
  GATE_SEVERITY,
  deepFreeze,
  validateGlobalPrescriptionValidationInput,
  validateGlobalPrescriptionValidationOutput
});
