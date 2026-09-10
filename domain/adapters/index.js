/**
 * domain/adapters/index.js
 * 
 * Ponto Único de Exportação dos Adaptadores de Domínio.
 * Padrão Strangler Fig — NutriAx Pro.
 */

const legacyAdapters = require('./legacyAdapters');

if (typeof module !== 'undefined' && module.exports) {
  module.exports = legacyAdapters;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.adapters = legacyAdapters;
}
