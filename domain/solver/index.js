/**
 * domain/solver/index.js
 * 
 * Ponto Único de Exportação do Subsistema Food Solver — NutriAx Pro.
 * Fase N3.2 — Food Solver Determinístico Canônico.
 * 
 * Camada Pura — Sem I/O de infraestrutura, sem persistência externa, sem dependências remotas.
 */

'use strict';

const foodEligibility = require('./foodEligibility');
const foodSolverPolicy = require('./foodSolverPolicy');
const foodSolver = require('./foodSolver');

const solverSubsystem = {
  // Elegibilidade
  ELIGIBILITY_STATUS: foodEligibility.ELIGIBILITY_STATUS,
  DEFAULT_ELIGIBILITY_POLICY: foodEligibility.DEFAULT_ELIGIBILITY_POLICY,
  adaptCatalogToCanonical: foodEligibility.adaptCatalogToCanonical,
  evaluateFoodEligibility: foodEligibility.evaluateFoodEligibility,
  filterEligibleFoods: foodEligibility.filterEligibleFoods,

  // Política e Funções de Perda
  SEARCH_ROLES: foodSolverPolicy.SEARCH_ROLES,
  DEFAULT_FOOD_SOLVER_POLICY: foodSolverPolicy.DEFAULT_FOOD_SOLVER_POLICY,
  normalizedNutrientError: foodSolverPolicy.normalizedNutrientError,
  calculateNutrientLoss: foodSolverPolicy.calculateNutrientLoss,
  assignSearchRole: foodSolverPolicy.assignSearchRole,

  // Motor Determinístico
  solveNutritionDiet: foodSolver.solveNutritionDiet,
  calculateFoodPortionNutrients: foodSolver.calculateFoodPortionNutrients,
  reduceSearchCandidates: foodSolver.reduceSearchCandidates,

  // Despachante Não-Bloqueante (N3.7.5)
  bridge: require('./foodSolverBridge'),
  solveNutritionDietAsync: require('./foodSolverBridge').solveNutritionDietAsync,
  solveNutritionDietSync: require('./foodSolverBridge').solveNutritionDietSync
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = solverSubsystem;
}

if (typeof globalThis !== 'undefined') {
  globalThis.NutriDomain = globalThis.NutriDomain || {};
  globalThis.NutriDomain.solver = solverSubsystem;
}
