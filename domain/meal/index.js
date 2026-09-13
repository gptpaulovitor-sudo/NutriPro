/**
 * domain/meal/index.js
 * 
 * Ponto Único de Exportação do Subsistema Meal Assembly — NutriAx Pro.
 * Fase N3.3 — Meal Assembly Determinístico Canônico.
 * 
 * Camada Pura — Sem I/O de infraestrutura, sem persistência externa, sem dependências remotas.
 */

'use strict';

const mealAssemblyPolicy = require('./mealAssemblyPolicy');
const mealAssemblyValidator = require('./mealAssemblyValidator');
const mealAssembly = require('./mealAssembly');

const mealSubsystem = {
  // Política e Funções de Custo
  ROLE_ARCHETYPES: mealAssemblyPolicy.ROLE_ARCHETYPES,
  ROLE_ENERGY_WEIGHTS: mealAssemblyPolicy.ROLE_ENERGY_WEIGHTS,
  FALLBACK_SCALES: mealAssemblyPolicy.FALLBACK_SCALES,
  DEFAULT_MEAL_ASSEMBLY_POLICY: mealAssemblyPolicy.DEFAULT_MEAL_ASSEMBLY_POLICY,
  resolveMealCount: mealAssemblyPolicy.resolveMealCount,
  resolveMealRoles: mealAssemblyPolicy.resolveMealRoles,
  calculateTargetRatios: mealAssemblyPolicy.calculateTargetRatios,
  calculateAssemblyCost: mealAssemblyPolicy.calculateAssemblyCost,

  // Validador de Conservação e Integridade
  roundTo: mealAssemblyValidator.roundTo,
  validateMealAssembly: mealAssemblyValidator.validateMealAssembly,

  // Motor Determinístico
  createSlicesForItem: mealAssembly.createSlicesForItem,
  assembleMeals: mealAssembly.assembleMeals
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = mealSubsystem;
}

if (typeof globalThis !== 'undefined') {
  globalThis.NutriDomain = globalThis.NutriDomain || {};
  globalThis.NutriDomain.meal = mealSubsystem;
}
