/**
 * domain/math/index.js
 * 
 * Ponto Único de Exportação do Motor Matemático Canônico e Política Energética.
 * Camada Pura — NutriAx Pro.
 */

const nutritionMath = require('./nutritionMath');
const { DEFAULT_ENERGY_POLICY, validateEnergyPolicy } = require('./energyPolicy');
const { calculateDeterministicEnergyTarget } = require('./energyTarget');
const { DEFAULT_MACRO_POLICY, validateMacroPolicy } = require('./macroPolicy');
const { calculateDeterministicMacroTargets, isAthleteOrHighDemand, normalizeObjectiveCategory } = require('./macroTarget');
const { validateNutritionPrescriptionTargets } = require('./nutritionTargetValidator');

const { calculateDeterministicWaterTarget } = require('./waterTarget');

const combined = {
  ...nutritionMath,
  DEFAULT_ENERGY_POLICY,
  validateEnergyPolicy,
  calculateDeterministicEnergyTarget,
  DEFAULT_MACRO_POLICY,
  validateMacroPolicy,
  calculateDeterministicMacroTargets,
  isAthleteOrHighDemand,
  normalizeObjectiveCategory,
  validateNutritionPrescriptionTargets,
  calculateDeterministicWaterTarget
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = combined;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.math = combined;
  window.NutriDomain.energyPolicy = { DEFAULT_ENERGY_POLICY, validateEnergyPolicy };
  window.NutriDomain.energyTarget = { calculateDeterministicEnergyTarget };
  window.NutriDomain.macroPolicy = { DEFAULT_MACRO_POLICY, validateMacroPolicy };
  window.NutriDomain.macroTarget = { calculateDeterministicMacroTargets, isAthleteOrHighDemand, normalizeObjectiveCategory };
  window.NutriDomain.targetValidator = { validateNutritionPrescriptionTargets };
  window.NutriDomain.waterTarget = { calculateDeterministicWaterTarget };
}

