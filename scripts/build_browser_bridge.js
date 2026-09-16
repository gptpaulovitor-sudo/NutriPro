/**
 * scripts/build_browser_bridge.js
 * 
 * Reconstrói domain/browserBridge.js a partir dos módulos canônicos de domain/.
 * Garante que todas as atualizações de regras, elegibilidade, solvers e políticas
 * estejam 100% sincronizadas no ambiente do navegador.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const header = `/**
 * domain/browserBridge.js
 * Ponto Único de Disponibilização do Domínio Canônico para o Runtime do Navegador.
 * NutriAx Pro — Fase N3.7.4.
 * 
 * Auto-gerado a partir dos módulos canônicos de domain/.
 * ZERO duplicação de fórmulas. ZERO alteração de regras de negócio.
 */
(function(global) {
  'use strict';

  const registry = {};
  const cache = {};

  function defineModule(id, factory) {
    registry[id] = factory;
    // Registra aliases comuns para resolução flexível
    if (id.endsWith('.js')) {
      const withoutExt = id.slice(0, -3);
      if (!registry[withoutExt]) registry[withoutExt] = factory;
      if (withoutExt.endsWith('/index')) {
        const dirOnly = withoutExt.slice(0, -6);
        if (!registry[dirOnly]) registry[dirOnly] = factory;
      }
    }
  }

  function resolvePath(baseDir, target) {
    if (!target.startsWith('.')) {
      if (registry[target]) return target;
      if (registry[target + '.js']) return target + '.js';
      if (registry['domain/' + target]) return 'domain/' + target;
      if (registry['domain/' + target + '.js']) return 'domain/' + target + '.js';
      if (registry['domain/' + target + '/index.js']) return 'domain/' + target + '/index.js';
      return target;
    }

    const combined = baseDir ? (baseDir + '/' + target) : target;
    const parts = combined.split('/');
    const resolved = [];
    for (const p of parts) {
      if (!p || p === '.') continue;
      if (p === '..') {
        resolved.pop();
      } else {
        resolved.push(p);
      }
    }
    const cleanPath = resolved.join('/');
    if (registry[cleanPath]) return cleanPath;
    if (registry[cleanPath + '.js']) return cleanPath + '.js';
    if (registry[cleanPath + '/index']) return cleanPath + '/index';
    if (registry[cleanPath + '/index.js']) return cleanPath + '/index.js';
    return cleanPath;
  }

  function createRequire(currentDir) {
    return function localRequire(id) {
      const resolvedId = resolvePath(currentDir, id);
      if (cache[resolvedId]) {
        return cache[resolvedId].exports;
      }
      const factory = registry[resolvedId] || registry[resolvedId + '.js'] || registry[resolvedId + '/index.js'] || registry[resolvedId + '/index'];
      if (!factory) {
        throw new Error('[NutriDomain BrowserBridge] Módulo não encontrado: "' + id + '" (resolvido como "' + resolvedId + '") a partir de "' + currentDir + '"');
      }
      const mod = { exports: {} };
      cache[resolvedId] = mod;
      factory(createRequire(resolvedId.substring(0, resolvedId.lastIndexOf('/'))), mod, mod.exports);
      return mod.exports;
    };
  }
`;

const footer = `
  // Inicialização e Exposição Canônica das Camadas N1.1 a N3.7
  const rootRequire = createRequire('domain');

  const contracts = rootRequire('./contracts/index');
  const math = rootRequire('./math/index');
  const solver = rootRequire('./solver/index');
  const meal = rootRequire('./meal/index');
  const timing = rootRequire('./timing/index');
  const validation = rootRequire('./validation/index');
  const orchestration = rootRequire('./orchestration/index');
  const adapters = rootRequire('./adapters/index');

  const NutriDomain = {
    contracts,
    math,
    solver,
    meal,
    timing,
    validation,
    orchestration,
    adapters,
    energyTarget: {
      calculateDeterministicEnergyTarget: math.calculateDeterministicEnergyTarget,
      DEFAULT_ENERGY_POLICY: math.DEFAULT_ENERGY_POLICY,
      validateEnergyPolicy: math.validateEnergyPolicy
    },
    macroTarget: {
      calculateDeterministicMacroTargets: math.calculateDeterministicMacroTargets,
      DEFAULT_MACRO_POLICY: math.DEFAULT_MACRO_POLICY,
      validateMacroPolicy: math.validateMacroPolicy,
      isAthleteOrHighDemand: math.isAthleteOrHighDemand,
      normalizeObjectiveCategory: math.normalizeObjectiveCategory
    },
    targetValidator: {
      validateNutritionPrescriptionTargets: math.validateNutritionPrescriptionTargets
    }
  };

  if (typeof global !== 'undefined') {
    global.NutriDomain = NutriDomain;
  }
  if (typeof window !== 'undefined') {
    window.NutriDomain = NutriDomain;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.NutriDomain = NutriDomain;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NutriDomain;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
`;

const modules = [
  "domain/contracts/PatientDTO.js",
  "domain/contracts/AssessmentDTO.js",
  "domain/contracts/NutritionDTO.js",
  "domain/contracts/TrainingPrescriptionDTO.js",
  "domain/contracts/CardioPrescriptionDTO.js",
  "domain/contracts/index.js",
  "domain/contracts/PerformanceContextDTO.js",
  "domain/contracts/NutritionPrescriptionContextDTO.js",
  "domain/contracts/FoodSolverContract.js",
  "domain/contracts/MealAssemblyContract.js",
  "domain/contracts/MealTimingContract.js",
  "domain/contracts/NutrientTimingContract.js",
  "domain/contracts/GlobalPrescriptionValidationContract.js",
  "domain/adapters/legacyAdapters.js",
  "domain/adapters/index.js",
  "domain/adapters/performanceContextAdapter.js",
  "domain/adapters/nutritionContextAdapter.js",
  "domain/adapters/prescriptionInputAdapter.js",
  "domain/adapters/prescriptionOutputAdapter.js",
  "domain/math/nutritionMath.js",
  "domain/math/index.js",
  "domain/math/energyPolicy.js",
  "domain/math/energyTarget.js",
  "domain/math/macroPolicy.js",
  "domain/math/macroTarget.js",
  "domain/math/nutritionTargetValidator.js",
  "domain/solver/foodEligibility.js",
  "domain/solver/foodSolverPolicy.js",
  "domain/solver/foodSolver.js",
  "domain/solver/index.js",
  "domain/solver/foodSolverWorker.js",
  "domain/solver/foodSolverBridge.js",
  "domain/meal/mealAssemblyPolicy.js",
  "domain/meal/mealAssemblyValidator.js",
  "domain/meal/mealAssembly.js",
  "domain/meal/index.js",
  "domain/timing/mealTimingPolicy.js",
  "domain/timing/mealTimingValidator.js",
  "domain/timing/mealTiming.js",
  "domain/timing/index.js",
  "domain/timing/nutrientTimingPolicy.js",
  "domain/timing/nutrientTimingValidator.js",
  "domain/timing/nutrientTiming.js",
  "domain/validation/globalPrescriptionValidationPolicy.js",
  "domain/validation/globalPrescriptionValidator.js",
  "domain/validation/index.js",
  "domain/orchestration/prescriptionOrchestrator.js",
  "domain/orchestration/index.js"
];

let bundle = header;

for (const modPath of modules) {
  const fullPath = path.join(rootDir, modPath);
  const content = fs.readFileSync(fullPath, 'utf8');
  bundle += `\n  // ── MÓDULO: ${modPath} ──\n`;
  bundle += `  defineModule("${modPath}", function(require, module, exports) {\n`;
  bundle += content;
  bundle += `\n  });\n`;
}

bundle += footer;

const targetPath = path.join(rootDir, 'domain', 'browserBridge.js');
fs.writeFileSync(targetPath, bundle, 'utf8');
console.log(`domain/browserBridge.js reconstruído com sucesso! (${modules.length} módulos, ${(bundle.length / 1024).toFixed(1)} KB)`);
