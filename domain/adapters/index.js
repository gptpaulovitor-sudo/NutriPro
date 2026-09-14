/**
 * domain/adapters/index.js
 * 
 * Ponto Único de Exportação dos Adaptadores de Domínio.
 * Padrão Strangler Fig — NutriAx Pro.
 */

const legacyAdapters = require('./legacyAdapters');
const nutritionContextAdapter = require('./nutritionContextAdapter');
const prescriptionInputAdapter = require('./prescriptionInputAdapter');
const prescriptionOutputAdapter = require('./prescriptionOutputAdapter');

const allAdapters = {
  ...legacyAdapters,
  ...nutritionContextAdapter,
  ...prescriptionInputAdapter,
  ...prescriptionOutputAdapter
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = allAdapters;
}

if (typeof globalThis !== 'undefined') {
  globalThis.NutriDomain = globalThis.NutriDomain || {};
  globalThis.NutriDomain.adapters = allAdapters;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.adapters = allAdapters;
}
