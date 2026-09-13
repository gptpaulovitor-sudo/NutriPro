/**
 * domain/timing/index.js
 * 
 * Ponto Único de Exportação do Subsistema Meal Timing — NutriAx Pro.
 * Fase N3.4 — Meal Timing / Distribuição Temporal Determinística.
 * 
 * Camada Pura — Sem I/O de infraestrutura, sem persistência externa, sem dependências remotas.
 */

'use strict';

const mealTimingPolicy = require('./mealTimingPolicy');
const mealTimingValidator = require('./mealTimingValidator');
const mealTiming = require('./mealTiming');

const nutrientTimingPolicy = require('./nutrientTimingPolicy');
const nutrientTimingValidator = require('./nutrientTimingValidator');
const nutrientTiming = require('./nutrientTiming');

const timingSubsystem = {
  // Política e Utilitários de Tempo (N3.4)
  DEFAULT_MEAL_TIMING_POLICY: mealTimingPolicy.DEFAULT_MEAL_TIMING_POLICY,
  timeStringToMinutes: mealTimingPolicy.timeStringToMinutes,
  minutesToTimeString: mealTimingPolicy.minutesToTimeString,
  resolveEatingWindow: mealTimingPolicy.resolveEatingWindow,
  extractTemporalEvents: mealTimingPolicy.extractTemporalEvents,

  // Validador Temporal (N3.4)
  validateMealTiming: mealTimingValidator.validateMealTiming,

  // Motor Determinístico de Agendamento (N3.4)
  scheduleMeals: mealTiming.scheduleMeals,

  // Política e Utilitários de Nutrient Timing (N3.5)
  DEFAULT_NUTRIENT_TIMING_POLICY: nutrientTimingPolicy.DEFAULT_NUTRIENT_TIMING_POLICY,
  resolveDayEvents: nutrientTimingPolicy.resolveDayEvents,

  // Validador de Nutrient Timing (N3.5)
  validateNutrientTiming: nutrientTimingValidator.validateNutrientTiming,

  // Motor Determinístico de Análise de Nutrient Timing (N3.5)
  analyzeNutrientTiming: nutrientTiming.analyzeNutrientTiming
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = timingSubsystem;
}

if (typeof globalThis !== 'undefined') {
  globalThis.NutriDomain = globalThis.NutriDomain || {};
  globalThis.NutriDomain.timing = timingSubsystem;
}
