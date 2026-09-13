/**
 * domain/adapters/index.js
 * 
 * Ponto Único de Exportação dos Adaptadores de Domínio.
 * Padrão Strangler Fig — NutriAx Pro.
 */

const legacyAdapters = require('./legacyAdapters');
const nutritionContextAdapter = require('./nutritionContextAdapter');

const allAdapters = {
  ...legacyAdapters,
  ...nutritionContextAdapter
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = allAdapters;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.adapters = allAdapters;
}
