/**
 * domain/clinical/index.js
 * 
 * Exportação consolidada do subsistema de Avaliação Clínica & Científica de Prescrições.
 * NutriAx Pro.
 */

'use strict';

const scientificPrescriptionEvaluator = require('./scientificPrescriptionEvaluator');

module.exports = Object.freeze({
  ...scientificPrescriptionEvaluator
});
