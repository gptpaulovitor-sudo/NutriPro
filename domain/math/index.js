/**
 * domain/math/index.js
 * 
 * Ponto Único de Exportação do Motor Matemático Canônico.
 * Camada Pura — NutriAx Pro.
 */

const nutritionMath = require('./nutritionMath');

if (typeof module !== 'undefined' && module.exports) {
  module.exports = nutritionMath;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.math = nutritionMath;
}
