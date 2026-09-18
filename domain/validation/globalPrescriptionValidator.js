/**
 * domain/validation/globalPrescriptionValidator.js
 * 
 * Validador Global da Prescrição Nutricional — NutriAx Pro.
 * Fase N3.6 — Validação Global Determinística.
 * 
 * Camada Pura — Zero DOM, Zero Dexie/Firebase, Zero Gemini, Zero Math.random, Zero Date.now.
 * 
 * Princípio Reitor:
 * "N2/N3 prescrevem/analisam. N3.6 apenas valida a coerência global do resultado."
 * 
 * N3.6 é estritamente um validador. Não seleciona alimentos, não altera gramagens,
 * não recalcula calorias ou macros, não reagenda refeições, não altera jejum/treino.
 */

'use strict';

const {
  GLOBAL_VALIDATION_VERSION,
  GLOBAL_VALIDATION_STATUS,
  GLOBAL_GATE_ID,
  GATE_SEVERITY,
  deepFreeze,
  validateGlobalPrescriptionValidationInput
} = require('../contracts/GlobalPrescriptionValidationContract');

const {
  DEFAULT_GLOBAL_PRESCRIPTION_VALIDATION_POLICY,
  createGlobalPrescriptionValidationPolicy
} = require('./globalPrescriptionValidationPolicy');

const { extractGlobalSolutionItems } = require('../contracts/MealAssemblyContract');

/**
 * Utilitário puro de cópia profunda para verificação de imutabilidade do input
 * @param {any} val 
 * @returns {any}
 */
function cloneDeepPure(val) {
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) {
    return val.map(cloneDeepPure);
  }
  const copy = {};
  for (const k of Object.keys(val)) {
    copy[k] = cloneDeepPure(val[k]);
  }
  return copy;
}

/**
 * Compara recursivamente dois objetos puros para verificar igualdade profunda
 * @param {any} a 
 * @param {any} b 
 * @returns {boolean}
 */
function isDeepEqualPure(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return a === b;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqualPure(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!isDeepEqualPure(a[key], b[key])) return false;
  }
  return true;
}

/**
 * Extrai itens alimentares de uma refeição ou resultado de fase de forma segura
 * @param {Object} phaseResult 
 * @returns {Array<Object>}
 */
function extractItemsFromPhase(phaseResult) {
  if (!phaseResult || typeof phaseResult !== 'object') return [];
  if (Array.isArray(phaseResult.items) && phaseResult.items.length > 0) {
    return phaseResult.items;
  }
  if (Array.isArray(phaseResult.meals)) {
    const items = [];
    phaseResult.meals.forEach(m => {
      if (m && Array.isArray(m.items)) {
        items.push(...m.items);
      }
    });
    return items;
  }
  return [];
}

/**
 * Consolida gramagens por foodId
 * @param {Array<Object>} items 
 * @returns {Map<string, { foodId: string, foodName: string, grams: number }>}
 */
function aggregateFoodGrams(items) {
  const map = new Map();
  items.forEach(it => {
    if (!it || typeof it !== 'object') return;
    const foodId = String(it.foodId || it.id || '').trim();
    if (!foodId) return;
    const rawG = it.grams !== undefined ? it.grams : it.quantity;
    const grams = typeof rawG === 'number' && Number.isFinite(rawG) ? rawG : 0;
    const foodName = String(it.foodName || it.name || foodId).trim();

    if (!map.has(foodId)) {
      map.set(foodId, { foodId, foodName, grams: 0 });
    }
    map.get(foodId).grams += grams;
  });
  return map;
}

/**
 * Soma bromatológica de nutrientes de uma lista de itens
 * @param {Array<Object>} items 
 * @returns {{ calories: number, protein: number, carbohydrate: number, lipid: number, fiber: number, sodium: number|null }}
 */
function sumNutrientsFromItems(items) {
  let calories = 0;
  let protein = 0;
  let carbohydrate = 0;
  let lipid = 0;
  let fiber = 0;
  let sodiumSum = 0;
  let hasSodium = false;

  items.forEach(it => {
    if (!it || typeof it !== 'object') return;
    const n = it.nutrients || {};
    if (typeof n.calories === 'number' && Number.isFinite(n.calories)) calories += n.calories;
    if (typeof n.protein === 'number' && Number.isFinite(n.protein)) protein += n.protein;
    if (typeof n.carbohydrate === 'number' && Number.isFinite(n.carbohydrate)) carbohydrate += n.carbohydrate;
    const lip = n.lipid !== undefined ? n.lipid : n.fat;
    if (typeof lip === 'number' && Number.isFinite(lip)) lipid += lip;
    if (typeof n.fiber === 'number' && Number.isFinite(n.fiber)) fiber += n.fiber;
    if (typeof n.sodium === 'number' && Number.isFinite(n.sodium)) {
      sodiumSum += n.sodium;
      hasSodium = true;
    }
  });

  return {
    calories: Number(calories.toFixed(3)),
    protein: Number(protein.toFixed(3)),
    carbohydrate: Number(carbohydrate.toFixed(3)),
    lipid: Number(lipid.toFixed(3)),
    fiber: Number(fiber.toFixed(3)),
    sodium: hasSodium ? Number(sodiumSum.toFixed(3)) : null
  };
}

/**
 * Função principal pura: Validação Global da Prescrição Nutricional (Fase N3.6)
 * 
 * @param {Object} input DTO contendo context e resultados de N2.1 a N3.5
 * @param {Object} [customPolicy={}] Política de validação customizada opcional
 * @returns {Object} GlobalPrescriptionValidationOutputDTO profundamente congelado
 */
function validateGlobalPrescription(input, customPolicy = {}) {
  // Snapshot prévio de entrada para auditar G20 (Imutabilidade)
  const inputSnapshot = cloneDeepPure(input);

  const policy = createGlobalPrescriptionValidationPolicy(
    (input && input.options && input.options.customPolicy) || customPolicy
  );

  // 1. Validação inicial de contrato de entrada
  const inputValidation = validateGlobalPrescriptionValidationInput(input);
  if (!inputValidation.isValid) {
    return deepFreeze({
      globalValidationVersion: GLOBAL_VALIDATION_VERSION,
      status: GLOBAL_VALIDATION_STATUS.BLOCKED,
      valid: false,
      gateResults: [
        {
          gateId: GLOBAL_GATE_ID.G1_CONTEXT,
          name: 'Context & Input Contract Integrity',
          status: 'FAIL',
          severity: GATE_SEVERITY.BLOCKING,
          message: 'Falha no contrato de entrada da validação global.',
          details: { errors: inputValidation.errors }
        }
      ],
      conservationAudit: {
        isStrictlyConserved: false
      },
      temporalAudit: {
        mealsCount: 0,
        hasCollisions: false,
        hasFastedTraining: false
      },
      globalDiagnostics: ['Input inválido ou malformado fornecido à N3.6.'],
      inheritedWarnings: [],
      validationWarnings: [],
      blockingReasons: inputValidation.errors,
      globalProvenance: {
        engine: 'NutriAxGlobalPrescriptionValidator',
        validationVersion: GLOBAL_VALIDATION_VERSION,
        status: GLOBAL_VALIDATION_STATUS.BLOCKED
      }
    });
  }

  // 2. Normalização e Extração das Fases Anteriores
  const context = input.context;
  const energyTargetResult = input.energyTargetResult ||
    (input.macroTargetResult && input.macroTargetResult.energyResult) ||
    (context && context.energy) || null;
  const macroTargetResult = input.macroTargetResult || null;
  const nutritionValidatorResult = input.nutritionValidatorResult || null;
  const foodSolverResult = input.foodSolverResult || null;
  const mealAssemblyResult = input.mealAssemblyResult || null;
  const mealTimingResult = input.mealTimingResult ||
    (input.nutrientTimingResult && input.nutrientTimingResult.sourceTimingResult) || null;
  const nutrientTimingResult = input.nutrientTimingResult || null;

  const gateResults = [];
  const globalDiagnostics = [];
  const inheritedWarnings = [];
  const validationWarnings = [];
  const blockingReasons = [];

  function recordGate(gateId, name, status, severity, message, details = {}) {
    gateResults.push({
      gateId,
      name,
      status,
      severity,
      message,
      details
    });

    if (status === 'FAIL') {
      if (severity === GATE_SEVERITY.BLOCKING) {
        blockingReasons.push(`[${gateId}] ${message}`);
      } else if (severity === GATE_SEVERITY.WARNING) {
        validationWarnings.push(`[${gateId}] ${message}`);
      }
    } else if (status === 'WARNING') {
      validationWarnings.push(`[${gateId}] ${message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G1 — CONTEXT INTEGRITY
  // ─────────────────────────────────────────────────────────────────────────
  if (!context || typeof context !== 'object') {
    recordGate(GLOBAL_GATE_ID.G1_CONTEXT, 'Context Integrity', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Contexto canônico N1.1 ausente ou inválido.');
  } else {
    const p = context.patient;
    const a = context.anthropometry;
    const isContextPlausible = p && typeof p === 'object' && a && typeof a === 'object' &&
      typeof a.weightKg === 'number' && a.weightKg > 0 &&
      typeof a.heightCm === 'number' && a.heightCm > 0;

    if (!isContextPlausible) {
      recordGate(GLOBAL_GATE_ID.G1_CONTEXT, 'Context Integrity', 'FAIL', GATE_SEVERITY.BLOCKING,
        'Contexto canônico contém dados antropométricos ausentes ou não-plausíveis.');
    } else {
      recordGate(GLOBAL_GATE_ID.G1_CONTEXT, 'Context Integrity', 'PASS', GATE_SEVERITY.INFORMATIONAL,
        'Contexto canônico N1.1 íntegro e consistente.');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G2 — N2.1 COMPLIANCE (Energy Target)
  // ─────────────────────────────────────────────────────────────────────────
  if (!energyTargetResult || typeof energyTargetResult !== 'object') {
    recordGate(GLOBAL_GATE_ID.G2_ENERGY_TARGET, 'N2.1 Energy Target Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Resultado energético N2.1 ausente.');
  } else {
    if (energyTargetResult.status === 'BLOCKED') {
      recordGate(GLOBAL_GATE_ID.G2_ENERGY_TARGET, 'N2.1 Energy Target Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        'Fase N2.1 possui status BLOCKED.', { blockingReasons: energyTargetResult.blockingReasons || [] });
    } else {
      const cTarget = energyTargetResult.caloricTargetKcal;
      const tmb = energyTargetResult.tmbKcal;
      const get = energyTargetResult.getKcal;
      const isNum = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

      if (!isNum(cTarget) || !isNum(tmb) || !isNum(get)) {
        recordGate(GLOBAL_GATE_ID.G2_ENERGY_TARGET, 'N2.1 Energy Target Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
          'Valores energéticos de N2.1 (caloricTargetKcal, tmbKcal, getKcal) devem ser números positivos finitos.');
      } else {
        recordGate(GLOBAL_GATE_ID.G2_ENERGY_TARGET, 'N2.1 Energy Target Compliance', 'PASS', GATE_SEVERITY.INFORMATIONAL,
          'Meta energética N2.1 válida e homologada.', { caloricTargetKcal: cTarget, tmbKcal: tmb, getKcal: get });
      }
    }
    if (Array.isArray(energyTargetResult.warnings)) {
      inheritedWarnings.push(...energyTargetResult.warnings.map(w => `[N2.1] ${w}`));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G3 — N2.2 COMPLIANCE (Macro Targets)
  // ─────────────────────────────────────────────────────────────────────────
  if (!macroTargetResult || typeof macroTargetResult !== 'object') {
    recordGate(GLOBAL_GATE_ID.G3_MACRO_TARGET, 'N2.2 Macro Targets Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Resultado de macronutrientes N2.2 ausente.');
  } else {
    if (macroTargetResult.status === 'BLOCKED') {
      recordGate(GLOBAL_GATE_ID.G3_MACRO_TARGET, 'N2.2 Macro Targets Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        'Fase N2.2 possui status BLOCKED.', { blockingReasons: macroTargetResult.blockingReasons || [] });
    } else {
      const p = macroTargetResult.proteinTargetG;
      const c = macroTargetResult.carbohydrateTargetG;
      const f = macroTargetResult.fatTargetG;
      const isNum = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

      if (!isNum(p) || !isNum(c) || !isNum(f)) {
        recordGate(GLOBAL_GATE_ID.G3_MACRO_TARGET, 'N2.2 Macro Targets Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
          'Metas de macronutrientes N2.2 (P, C, G) devem ser números finitos não-negativos.');
      } else {
        recordGate(GLOBAL_GATE_ID.G3_MACRO_TARGET, 'N2.2 Macro Targets Compliance', 'PASS', GATE_SEVERITY.INFORMATIONAL,
          'Metas de macronutrientes N2.2 válidas e homologadas.', { proteinTargetG: p, carbohydrateTargetG: c, fatTargetG: f });
      }
    }
    if (Array.isArray(macroTargetResult.warnings)) {
      inheritedWarnings.push(...macroTargetResult.warnings.map(w => `[N2.2] ${w}`));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G4 — N2.3 QUALITY GATE (Nutrition Target Validator)
  // ─────────────────────────────────────────────────────────────────────────
  if (!nutritionValidatorResult || typeof nutritionValidatorResult !== 'object') {
    recordGate(GLOBAL_GATE_ID.G4_NUTRITION_VALIDATOR, 'N2.3 Nutrition Target Quality Gate', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Resultado do validador nutricional N2.3 ausente.');
  } else {
    if (nutritionValidatorResult.valid !== true || nutritionValidatorResult.status === 'BLOCKED') {
      recordGate(GLOBAL_GATE_ID.G4_NUTRITION_VALIDATOR, 'N2.3 Nutrition Target Quality Gate', 'FAIL', GATE_SEVERITY.BLOCKING,
        'Portão de qualidade N2.3 reprovado (valid !== true ou status BLOCKED).', {
          blockingReasons: nutritionValidatorResult.blockingReasons || []
        });
    } else {
      const gateStatus = nutritionValidatorResult.status === 'WARNING' ? 'WARNING' : 'PASS';
      recordGate(GLOBAL_GATE_ID.G4_NUTRITION_VALIDATOR, 'N2.3 Nutrition Target Quality Gate', gateStatus, GATE_SEVERITY.INFORMATIONAL,
        `Portão de qualidade N2.3 aprovado (${gateStatus}).`);
    }
    if (Array.isArray(nutritionValidatorResult.warnings)) {
      inheritedWarnings.push(...nutritionValidatorResult.warnings.map(w => `[N2.3] ${w}`));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G5 — N3.2 COMPLIANCE (Food Solver)
  // ─────────────────────────────────────────────────────────────────────────
  let solverItems = [];
  if (!foodSolverResult || typeof foodSolverResult !== 'object') {
    recordGate(GLOBAL_GATE_ID.G5_FOOD_SOLVER, 'N3.2 Food Solver Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Resultado do Food Solver N3.2 ausente.');
  } else {
    solverItems = extractGlobalSolutionItems(foodSolverResult);
    if (foodSolverResult.valid !== true || foodSolverResult.status === 'BLOCKED' || foodSolverResult.status === 'NO_SOLUTION') {
      recordGate(GLOBAL_GATE_ID.G5_FOOD_SOLVER, 'N3.2 Food Solver Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        `Food Solver N3.2 inválido ou sem solução (status "${foodSolverResult.status}").`);
    } else if (solverItems.length === 0) {
      recordGate(GLOBAL_GATE_ID.G5_FOOD_SOLVER, 'N3.2 Food Solver Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        'Food Solver N3.2 gerou uma cesta de alimentos vazia.');
    } else {
      recordGate(GLOBAL_GATE_ID.G5_FOOD_SOLVER, 'N3.2 Food Solver Compliance', 'PASS', GATE_SEVERITY.INFORMATIONAL,
        'Food Solver N3.2 convergido com sucesso.', { foodsCount: solverItems.length });
    }
    if (Array.isArray(foodSolverResult.warnings)) {
      inheritedWarnings.push(...foodSolverResult.warnings.map(w => `[N3.2] ${w}`));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G6 — N3.3 COMPLIANCE (Meal Assembly)
  // ─────────────────────────────────────────────────────────────────────────
  let assemblyItems = [];
  if (!mealAssemblyResult || typeof mealAssemblyResult !== 'object') {
    recordGate(GLOBAL_GATE_ID.G6_MEAL_ASSEMBLY, 'N3.3 Meal Assembly Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Resultado do Meal Assembly N3.3 ausente.');
  } else {
    assemblyItems = extractItemsFromPhase(mealAssemblyResult);
    if (mealAssemblyResult.valid !== true || mealAssemblyResult.status === 'BLOCKED' || mealAssemblyResult.status === 'NO_SOLUTION') {
      recordGate(GLOBAL_GATE_ID.G6_MEAL_ASSEMBLY, 'N3.3 Meal Assembly Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        `Meal Assembly N3.3 inválido ou bloqueado (status "${mealAssemblyResult.status}").`);
    } else if (!Array.isArray(mealAssemblyResult.meals) || mealAssemblyResult.meals.length === 0) {
      recordGate(GLOBAL_GATE_ID.G6_MEAL_ASSEMBLY, 'N3.3 Meal Assembly Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        'Meal Assembly N3.3 não produziu refeições estruturadas.');
    } else {
      recordGate(GLOBAL_GATE_ID.G6_MEAL_ASSEMBLY, 'N3.3 Meal Assembly Compliance', 'PASS', GATE_SEVERITY.INFORMATIONAL,
        'Meal Assembly N3.3 estruturado e válido.', { mealsCount: mealAssemblyResult.meals.length });
    }
    if (Array.isArray(mealAssemblyResult.warnings) && mealAssemblyResult.warnings.length > 0) {
      const solverWarnSet = new Set(Array.isArray(foodSolverResult?.warnings) ? foodSolverResult.warnings : []);
      const assemblyOnlyWarnings = mealAssemblyResult.warnings.filter(w => !solverWarnSet.has(w));
      if (assemblyOnlyWarnings.length > 0) {
        inheritedWarnings.push(...assemblyOnlyWarnings.map(w => `[N3.3] ${w}`));
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G7 — N3.4 COMPLIANCE (Meal Timing)
  // ─────────────────────────────────────────────────────────────────────────
  let timingItems = [];
  if (!mealTimingResult || typeof mealTimingResult !== 'object') {
    recordGate(GLOBAL_GATE_ID.G7_MEAL_TIMING, 'N3.4 Meal Timing Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Resultado do Meal Timing N3.4 ausente.');
  } else {
    timingItems = extractItemsFromPhase(mealTimingResult);
    if (mealTimingResult.valid !== true || mealTimingResult.status === 'BLOCKED') {
      recordGate(GLOBAL_GATE_ID.G7_MEAL_TIMING, 'N3.4 Meal Timing Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        `Meal Timing N3.4 inválido ou bloqueado (status "${mealTimingResult.status}").`);
    } else if (!Array.isArray(mealTimingResult.meals) || mealTimingResult.meals.length === 0) {
      recordGate(GLOBAL_GATE_ID.G7_MEAL_TIMING, 'N3.4 Meal Timing Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        'Meal Timing N3.4 não possui refeições agendadas.');
    } else {
      recordGate(GLOBAL_GATE_ID.G7_MEAL_TIMING, 'N3.4 Meal Timing Compliance', 'PASS', GATE_SEVERITY.INFORMATIONAL,
        'Meal Timing N3.4 válido e agendado.');
    }
    if (Array.isArray(mealTimingResult.warnings) && mealTimingResult.warnings.length > 0) {
      const assemblyWarnSet = new Set(Array.isArray(mealAssemblyResult?.warnings) ? mealAssemblyResult.warnings : []);
      const timingOnlyWarnings = mealTimingResult.warnings.filter(w => !assemblyWarnSet.has(w));
      if (timingOnlyWarnings.length > 0) {
        inheritedWarnings.push(...timingOnlyWarnings.map(w => `[N3.4] ${w}`));
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G8 — N3.5 COMPLIANCE (Nutrient Timing)
  // ─────────────────────────────────────────────────────────────────────────
  let finalItems = [];
  const finalMeals = (nutrientTimingResult && Array.isArray(nutrientTimingResult.meals))
    ? nutrientTimingResult.meals
    : [];

  if (!nutrientTimingResult || typeof nutrientTimingResult !== 'object') {
    recordGate(GLOBAL_GATE_ID.G8_NUTRIENT_TIMING, 'N3.5 Nutrient Timing Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Resultado de Nutrient Timing N3.5 ausente.');
  } else {
    finalItems = extractItemsFromPhase(nutrientTimingResult);
    if (nutrientTimingResult.valid !== true || nutrientTimingResult.status === 'BLOCKED') {
      recordGate(GLOBAL_GATE_ID.G8_NUTRIENT_TIMING, 'N3.5 Nutrient Timing Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        `Nutrient Timing N3.5 inválido ou bloqueado (status "${nutrientTimingResult.status}").`);
    } else if (finalMeals.length === 0) {
      recordGate(GLOBAL_GATE_ID.G8_NUTRIENT_TIMING, 'N3.5 Nutrient Timing Compliance', 'FAIL', GATE_SEVERITY.BLOCKING,
        'Nutrient Timing N3.5 não contém refeições analisadas.');
    } else {
      recordGate(GLOBAL_GATE_ID.G8_NUTRIENT_TIMING, 'N3.5 Nutrient Timing Compliance', 'PASS', GATE_SEVERITY.INFORMATIONAL,
        'Nutrient Timing N3.5 validado com sucesso.');
    }
    if (Array.isArray(nutrientTimingResult.warnings) && nutrientTimingResult.warnings.length > 0) {
      const timingWarnSet = new Set(Array.isArray(mealTimingResult?.warnings) ? mealTimingResult.warnings : []);
      const nutrientTimingOnlyWarnings = nutrientTimingResult.warnings.filter(w => !timingWarnSet.has(w));
      if (nutrientTimingOnlyWarnings.length > 0) {
        inheritedWarnings.push(...nutrientTimingOnlyWarnings.map(w => `[N3.5] ${w}`));
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G9 — FOOD IDENTITY (N3.2 -> N3.3 -> N3.4 -> N3.5)
  // ─────────────────────────────────────────────────────────────────────────
  const solverFoodsMap = aggregateFoodGrams(solverItems);
  const finalFoodsMap = aggregateFoodGrams(finalItems);

  const solverFoodIds = new Set(solverFoodsMap.keys());
  const finalFoodIds = new Set(finalFoodsMap.keys());

  const missingInFinal = [];
  const inventedInFinal = [];

  solverFoodIds.forEach(id => {
    if (!finalFoodIds.has(id)) missingInFinal.push(id);
  });

  finalFoodIds.forEach(id => {
    if (!solverFoodIds.has(id)) inventedInFinal.push(id);
  });

  if (missingInFinal.length > 0 || inventedInFinal.length > 0) {
    recordGate(GLOBAL_GATE_ID.G9_FOOD_IDENTITY, 'Food Identity Invariant', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Quebra de identidade de alimentos entre N3.2 e N3.5.', {
        missingInFinal,
        inventedInFinal
      });
  } else {
    recordGate(GLOBAL_GATE_ID.G9_FOOD_IDENTITY, 'Food Identity Invariant', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Identidade canônica dos alimentos 100% preservada de N3.2 a N3.5.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G10 — MASS CONSERVATION (N3.2 -> N3.5)
  // ─────────────────────────────────────────────────────────────────────────
  let solverTotalMass = 0;
  let finalTotalMass = 0;
  const massDivergences = [];

  solverFoodsMap.forEach((sData, fId) => {
    solverTotalMass += sData.grams;
    const fData = finalFoodsMap.get(fId);
    const fGrams = fData ? fData.grams : 0;
    const delta = Math.abs(fGrams - sData.grams);
    if (delta > policy.massToleranceGrams) {
      massDivergences.push({
        foodId: fId,
        solverGrams: sData.grams,
        finalGrams: fGrams,
        deltaGrams: Number(delta.toFixed(4))
      });
    }
  });

  finalFoodsMap.forEach(fData => {
    finalTotalMass += fData.grams;
  });

  const deltaTotalMass = Math.abs(finalTotalMass - solverTotalMass);
  if (deltaTotalMass > policy.massToleranceGrams || massDivergences.length > 0) {
    recordGate(GLOBAL_GATE_ID.G10_MASS_CONSERVATION, 'Mass Conservation Invariant', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Quebra na conservação de massa downstream entre o Solver e as refeições finais.', {
        deltaTotalMass: Number(deltaTotalMass.toFixed(4)),
        tolerance: policy.massToleranceGrams,
        massDivergences
      });
  } else {
    recordGate(GLOBAL_GATE_ID.G10_MASS_CONSERVATION, 'Mass Conservation Invariant', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Massa total de alimentos 100% conservada downstream.', {
        totalGrams: Number(finalTotalMass.toFixed(2)),
        deltaTotalMass: Number(deltaTotalMass.toFixed(4))
      });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G11 — NUTRIENT CONSERVATION (N3.2 -> N3.5)
  // ─────────────────────────────────────────────────────────────────────────
  const solverNutrients = sumNutrientsFromItems(solverItems);
  const finalNutrients = sumNutrientsFromItems(finalItems);

  const deltaCalories = Math.abs(finalNutrients.calories - solverNutrients.calories);
  const deltaProtein = Math.abs(finalNutrients.protein - solverNutrients.protein);
  const deltaCarbs = Math.abs(finalNutrients.carbohydrate - solverNutrients.carbohydrate);
  const deltaLipid = Math.abs(finalNutrients.lipid - solverNutrients.lipid);
  const deltaFiber = Math.abs(finalNutrients.fiber - solverNutrients.fiber);

  let deltaSodium = 0;
  let sodiumChecked = false;
  if (solverNutrients.sodium !== null && finalNutrients.sodium !== null) {
    deltaSodium = Math.abs(finalNutrients.sodium - solverNutrients.sodium);
    sodiumChecked = true;
  }

  const nutrientBreaks = [];
  if (deltaCalories > policy.calorieToleranceKcal) {
    nutrientBreaks.push(`Calorias divergem (Δ=${deltaCalories.toFixed(3)} > ${policy.calorieToleranceKcal})`);
  }
  if (deltaProtein > policy.proteinToleranceGrams) {
    nutrientBreaks.push(`Proteína diverge (Δ=${deltaProtein.toFixed(3)} > ${policy.proteinToleranceGrams})`);
  }
  if (deltaCarbs > policy.carbohydrateToleranceGrams) {
    nutrientBreaks.push(`Carboidrato diverge (Δ=${deltaCarbs.toFixed(3)} > ${policy.carbohydrateToleranceGrams})`);
  }
  if (deltaLipid > policy.lipidToleranceGrams) {
    nutrientBreaks.push(`Lipídios divergem (Δ=${deltaLipid.toFixed(3)} > ${policy.lipidToleranceGrams})`);
  }
  if (deltaFiber > policy.fiberToleranceGrams) {
    nutrientBreaks.push(`Fibra diverge (Δ=${deltaFiber.toFixed(3)} > ${policy.fiberToleranceGrams})`);
  }
  if (sodiumChecked && deltaSodium > policy.sodiumToleranceMg) {
    nutrientBreaks.push(`Sódio diverge (Δ=${deltaSodium.toFixed(3)} > ${policy.sodiumToleranceMg})`);
  }

  if (nutrientBreaks.length > 0) {
    recordGate(GLOBAL_GATE_ID.G11_NUTRIENT_CONSERVATION, 'Nutrient Conservation Invariant', 'FAIL', GATE_SEVERITY.BLOCKING,
      `Quebra de conservação nutricional entre Solver N3.2 e refeições finais: ${nutrientBreaks.join(', ')}.`, {
        nutrientBreaks,
        solverNutrients,
        finalNutrients
      });
  } else {
    recordGate(GLOBAL_GATE_ID.G11_NUTRIENT_CONSERVATION, 'Nutrient Conservation Invariant', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Nutrientes estritamente conservados downstream.', {
        deltaCalories: Number(deltaCalories.toFixed(3)),
        deltaProtein: Number(deltaProtein.toFixed(3)),
        deltaCarbs: Number(deltaCarbs.toFixed(3)),
        deltaLipid: Number(deltaLipid.toFixed(3)),
        deltaFiber: Number(deltaFiber.toFixed(3)),
        deltaSodium: sodiumChecked ? Number(deltaSodium.toFixed(3)) : null
      });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G12 — ATWATER CLOSURE (Consistência 4P + 4C + 9G)
  // ─────────────────────────────────────────────────────────────────────────
  const atwaterCalculatedKcal = Number((
    (4 * finalNutrients.protein) +
    (4 * finalNutrients.carbohydrate) +
    (9 * finalNutrients.lipid)
  ).toFixed(3));

  // Comparar Atwater dos macros finais com as calorias somadas dos alimentos
  const deltaAtwaterClosure = Math.abs(atwaterCalculatedKcal - finalNutrients.calories);
  if (deltaAtwaterClosure > policy.atwaterToleranceKcal) {
    recordGate(GLOBAL_GATE_ID.G12_ATWATER_CLOSURE, 'Atwater Energy Closure', 'FAIL', GATE_SEVERITY.BLOCKING,
      `Fechamento Atwater diverge da soma calórica dos alimentos (Δ=${deltaAtwaterClosure.toFixed(2)} kcal > ${policy.atwaterToleranceKcal} kcal).`, {
        atwaterCalculatedKcal,
        finalNutrientsCalories: finalNutrients.calories,
        deltaAtwaterClosure
      });
  } else {
    recordGate(GLOBAL_GATE_ID.G12_ATWATER_CLOSURE, 'Atwater Energy Closure', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Fechamento calórico Atwater (4P + 4C + 9F) consistente.', {
        atwaterCalculatedKcal,
        finalNutrientsCalories: finalNutrients.calories,
        deltaKcal: Number(deltaAtwaterClosure.toFixed(3))
      });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G13 — MEAL IDENTITY (N3.3 -> N3.4 -> N3.5)
  // ─────────────────────────────────────────────────────────────────────────
  const assemblyMeals = (mealAssemblyResult && Array.isArray(mealAssemblyResult.meals)) ? mealAssemblyResult.meals : [];
  const timingMeals = (mealTimingResult && Array.isArray(mealTimingResult.meals)) ? mealTimingResult.meals : [];

  let mealIdentityBreak = false;
  const mealIdentityDetails = [];

  if (assemblyMeals.length > 0 && finalMeals.length !== assemblyMeals.length) {
    mealIdentityBreak = true;
    mealIdentityDetails.push(`Contagem de refeições divergiu: N3.3 continha ${assemblyMeals.length}, N3.5 contém ${finalMeals.length}.`);
  }
  if (timingMeals.length > 0 && finalMeals.length !== timingMeals.length) {
    mealIdentityBreak = true;
    mealIdentityDetails.push(`Contagem de refeições divergiu: N3.4 continha ${timingMeals.length}, N3.5 contém ${finalMeals.length}.`);
  }

  const minLen = Math.min(assemblyMeals.length, finalMeals.length);
  for (let i = 0; i < minLen; i++) {
    const am = assemblyMeals[i];
    const fm = finalMeals[i];
    if (am.mealId !== fm.mealId) {
      mealIdentityBreak = true;
      mealIdentityDetails.push(`Refeição no índice ${i} teve mealId alterado ("${am.mealId}" -> "${fm.mealId}").`);
    }
    if (am.mealIndex !== fm.mealIndex) {
      mealIdentityBreak = true;
      mealIdentityDetails.push(`Refeição "${am.mealId}" teve mealIndex alterado (${am.mealIndex} -> ${fm.mealIndex}).`);
    }
    if (am.mealRole && fm.mealRole && am.mealRole !== fm.mealRole) {
      mealIdentityBreak = true;
      mealIdentityDetails.push(`Refeição "${am.mealId}" teve mealRole alterado ("${am.mealRole}" -> "${fm.mealRole}").`);
    }
  }

  if (mealIdentityBreak) {
    recordGate(GLOBAL_GATE_ID.G13_MEAL_IDENTITY, 'Meal Identity Invariant', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Violação de identidade de refeições downstream.', { details: mealIdentityDetails });
  } else {
    recordGate(GLOBAL_GATE_ID.G13_MEAL_IDENTITY, 'Meal Identity Invariant', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Identidade, quantidade e papéis de refeições 100% preservados downstream.', { mealsCount: finalMeals.length });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G14 — TEMPORAL INTEGRITY (N3.4 -> N3.5)
  // ─────────────────────────────────────────────────────────────────────────
  let temporalBreak = false;
  const temporalBreakDetails = [];

  for (let i = 0; i < Math.min(timingMeals.length, finalMeals.length); i++) {
    const tm = timingMeals[i];
    const fm = finalMeals[i];
    if (tm.scheduledTime !== fm.scheduledTime) {
      temporalBreak = true;
      temporalBreakDetails.push(`Refeição "${fm.mealId}": scheduledTime alterado ("${tm.scheduledTime}" -> "${fm.scheduledTime}").`);
    }
    if (tm.scheduledMinutes !== fm.scheduledMinutes) {
      temporalBreak = true;
      temporalBreakDetails.push(`Refeição "${fm.mealId}": scheduledMinutes alterado (${tm.scheduledMinutes} -> ${fm.scheduledMinutes}).`);
    }
  }

  if (temporalBreak) {
    recordGate(GLOBAL_GATE_ID.G14_TEMPORAL_INTEGRITY, 'Temporal Schedule Integrity', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Horários das refeições agendadas na N3.4 foram alterados ou corrompidos na N3.5.', { details: temporalBreakDetails });
  } else {
    recordGate(GLOBAL_GATE_ID.G14_TEMPORAL_INTEGRITY, 'Temporal Schedule Integrity', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Horários e minutos cronológicos intactos entre N3.4 e N3.5.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G15 — EVENT TRACEABILITY (Treino e Cardio)
  // ─────────────────────────────────────────────────────────────────────────
  const trainingContext = context && context.training;
  const cardioContext = context && context.cardio;

  let eventTraceWarning = false;
  const eventWarnings = [];

  if (trainingContext && trainingContext.hasActiveTraining) {
    if (!trainingContext.workoutTime) {
      eventTraceWarning = true;
      eventWarnings.push('Treino ativo declarado no contexto, mas workoutTime não foi informado (DATA_INSUFFICIENT).');
    }
  }

  if (cardioContext && cardioContext.hasActiveCardio) {
    const hasCardioWithoutTime = Array.isArray(cardioContext.sessions) &&
      cardioContext.sessions.some(s => s && !s.startTime && !s.workoutTime);
    if (hasCardioWithoutTime) {
      eventTraceWarning = true;
      eventWarnings.push('Sessão de cardio ativa declarada sem horário de início estruturado (DATA_INSUFFICIENT).');
    }
  }

  if (eventTraceWarning) {
    recordGate(GLOBAL_GATE_ID.G15_EVENT_TRACEABILITY, 'Event Traceability & Completeness', 'WARNING', GATE_SEVERITY.WARNING,
      'Eventos de exercício físico possuem dados opcionais insuficientes para cálculo peri-evento exato.', {
        warnings: eventWarnings
      });
  } else {
    recordGate(GLOBAL_GATE_ID.G15_EVENT_TRACEABILITY, 'Event Traceability & Completeness', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Rastreabilidade de eventos estruturados de treino e cardio em conformidade.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G16 — FASTING COHERENCE (Jejum Intermitente)
  // ─────────────────────────────────────────────────────────────────────────
  const fastingContext = context && context.fasting;
  let fastingBlocked = false;
  let fastingWarning = false;
  const fastingDetails = [];

  const eatingWindow = (mealTimingResult && mealTimingResult.eatingWindow) || null;

  if (fastingContext && fastingContext.hasActiveProtocol) {
    const isHardWindow = eatingWindow && eatingWindow.strength === 'HARD';
    
    // Verificar se alguma refeição ficou fora da janela de alimentação declarada
    if (eatingWindow && typeof eatingWindow.startMinutes === 'number' && typeof eatingWindow.endMinutes === 'number') {
      finalMeals.forEach(m => {
        if (typeof m.scheduledMinutes === 'number') {
          const isOutside = m.scheduledMinutes < eatingWindow.startMinutes || m.scheduledMinutes > eatingWindow.endMinutes;
          if (isOutside) {
            if (isHardWindow) {
              fastingBlocked = true;
              fastingDetails.push(`Refeição "${m.mealId}" agendada às ${m.scheduledTime} viola janela HARD (${eatingWindow.start} - ${eatingWindow.end}).`);
            } else {
              fastingWarning = true;
              fastingDetails.push(`Refeição "${m.mealId}" agendada às ${m.scheduledTime} fora da janela PREFERRED (${eatingWindow.start} - ${eatingWindow.end}).`);
            }
          }
        }
      });
    }

    // Fasted Training
    const hasFastedTraining = finalMeals.some(m =>
      Array.isArray(m.secondaryRelations) && m.secondaryRelations.includes('FASTING_CONSTRAINED')
    ) || (nutrientTimingResult && nutrientTimingResult.diagnostics &&
      nutrientTimingResult.diagnostics.some(d => /FASTED_TRAINING/i.test(d)));

    if (hasFastedTraining) {
      if (policy.allowFastedTrainingWithWarning) {
        fastingWarning = true;
        fastingDetails.push('Treino em jejum identificado. Registrado como observação operacional.');
      }
    }
  }

  if (fastingBlocked) {
    recordGate(GLOBAL_GATE_ID.G16_FASTING_COHERENCE, 'Fasting Protocol Coherence', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Violação estrita do protocolo de jejum intermitente (janela HARD).', { details: fastingDetails });
  } else if (fastingWarning) {
    recordGate(GLOBAL_GATE_ID.G16_FASTING_COHERENCE, 'Fasting Protocol Coherence', 'WARNING', GATE_SEVERITY.WARNING,
      'Observações contextuais sobre protocolo de jejum / fasted training.', { details: fastingDetails });
  } else {
    recordGate(GLOBAL_GATE_ID.G16_FASTING_COHERENCE, 'Fasting Protocol Coherence', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Protocolo de jejum e janela alimentar coerentes ou inativos.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G17 — NUTRIENT TIMING INTEGRITY (Classificações e ausência de colisão)
  // ─────────────────────────────────────────────────────────────────────────
  let hasCollision = false;
  finalMeals.forEach(m => {
    if (m.primaryRelation === 'OVERLAPPING_EVENT') {
      hasCollision = true;
    }
  });

  if (hasCollision) {
    recordGate(GLOBAL_GATE_ID.G17_NUTRIENT_TIMING_INTEGRITY, 'Nutrient Timing Integrity', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Refeição com colisão física temporal com sessão de exercício (OVERLAPPING_EVENT). Proibido aprovar.');
  } else {
    recordGate(GLOBAL_GATE_ID.G17_NUTRIENT_TIMING_INTEGRITY, 'Nutrient Timing Integrity', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Classificações de nutrient timing válidas e livres de sobreposição física.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G21 — MEAL MACRO COHERENCE (Coerência de macros por refeição)
  // ─────────────────────────────────────────────────────────────────────────
  const mealMacroFailures = [];
  const totalDailyCarbs = (macroTargetResult && typeof macroTargetResult.carbohydrateTargetG === 'number')
    ? macroTargetResult.carbohydrateTargetG
    : (finalNutrients.carbohydrate || 0);

  const activeStyle = (
    (context && (context.dietaryStyle || context.options?.dietaryStyle)) ||
    (input && (input.options?.dietaryStyle || input.dietaryStyle)) ||
    ''
  ).toLowerCase();

  const isKetoOrVeryLowCarb = totalDailyCarbs < 80 || ['cetogenica', 'dukan', 'whole30'].includes(activeStyle);
  const isLowCarbProtocol = isKetoOrVeryLowCarb || totalDailyCarbs <= 130 || activeStyle === 'lowcarb';

  if (finalMeals.length > 0) {
    finalMeals.forEach(meal => {
      const isMainMeal = meal.mealRole === 'PRIMARY' || /almo[cç]o|jantar/i.test(meal.mealName || '');
      const mealCarbs = (meal.totals && typeof meal.totals.carbohydrate === 'number')
        ? meal.totals.carbohydrate
        : (Array.isArray(meal.items) ? meal.items.reduce((acc, it) => acc + (it.nutrients?.carbohydrate || 0), 0) : 0);

      // Verificação de aporte mínimo de carboidratos em refeições principais (apenas para estilos com carboidrato livre/tradicional)
      if (isMainMeal && !isLowCarbProtocol) {
        if (mealCarbs < policy.minMainMealCarbsGrams) {
          mealMacroFailures.push(`Refeição principal "${meal.mealName || meal.mealId}" possui apenas ${mealCarbs.toFixed(1)}g de carboidrato (mínimo exigido: ${policy.minMainMealCarbsGrams}g).`);
        }
      }

      // Verificação de hiperconcentração de carboidratos em uma única refeição (quando há >= 3 refeições e aporte diário relevante)
      if (finalMeals.length >= 3 && totalDailyCarbs >= 80) {
        const allowedRatio = isLowCarbProtocol
          ? (finalMeals.length <= 3 ? 0.75 : Math.max(policy.maxSingleMealCarbRatio, 0.65))
          : policy.maxSingleMealCarbRatio;
        const carbRatio = mealCarbs / totalDailyCarbs;
        if (carbRatio > allowedRatio) {
          mealMacroFailures.push(`Refeição "${meal.mealName || meal.mealId}" concentra ${(carbRatio * 100).toFixed(1)}% dos carboidratos diários (${mealCarbs.toFixed(1)}g de ${totalDailyCarbs}g; máximo permitido: ${(allowedRatio * 100).toFixed(0)}%).`);
        }
      }
    });
  }

  if (mealMacroFailures.length > 0) {
    recordGate(GLOBAL_GATE_ID.G21_MEAL_MACRO_COHERENCE, 'Meal Macro Coherence', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Incoerência na distribuição de carboidratos entre as refeições.', { failures: mealMacroFailures });
  } else {
    recordGate(GLOBAL_GATE_ID.G21_MEAL_MACRO_COHERENCE, 'Meal Macro Coherence', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Distribuição de macronutrientes e aporte de carboidratos por refeição clinicamente coerente.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G22 — FOOD DIVERSITY AND REPETITION (Porções e diversidade global)
  // ─────────────────────────────────────────────────────────────────────────
  const diversityFailures = [];
  const allFinalFoodIds = new Set();

  finalMeals.forEach(meal => {
    if (Array.isArray(meal.items)) {
      meal.items.forEach(it => {
        const foodId = String(it.foodId || it.id || '').trim();
        if (foodId) allFinalFoodIds.add(foodId);
        const g = (typeof it.grams === 'number' && Number.isFinite(it.grams)) ? it.grams : (it.quantity || 0);

        // Vegetais e folhosos de baixa densidade calórica (< 40 kcal/100g) admitem até 500g de volume
        const isLowDensityVegetable = (it.nutrients && g > 0 && (it.nutrients.calories / (g / 100)) <= 40) ||
          /br[oó]colis|salada|alface|couve|pepino|tomate|abobrinha|espinafre|folhas/i.test(it.foodName || '');
        const maxAllowedGrams = isLowDensityVegetable ? 500.0 : policy.maxIndividualPortionGrams;

        if (g > maxAllowedGrams) {
          diversityFailures.push(`Porção excessiva do item "${it.foodName || foodId}" na refeição "${meal.mealName || meal.mealId}": ${g}g (limite seguro: ${maxAllowedGrams}g).`);
        }
      });
    }
  });

  const totalAvailableDistinct = solverFoodIds.size > 0 ? solverFoodIds.size : allFinalFoodIds.size;
  const effectiveMinDistinct = Math.min(policy.minDistinctDietFoods, totalAvailableDistinct);

  if (finalMeals.length >= 3 && allFinalFoodIds.size < effectiveMinDistinct) {
    diversityFailures.push(`Variedade alimentar insuficiente: prescrição de ${finalMeals.length} refeições contém apenas ${allFinalFoodIds.size} alimentos distintos (mínimo exigido: ${effectiveMinDistinct}).`);
  }

  if (diversityFailures.length > 0) {
    recordGate(GLOBAL_GATE_ID.G22_FOOD_DIVERSITY_AND_REPETITION, 'Food Diversity and Repetition', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Violação de limites de porção individual ou diversidade alimentar global.', { failures: diversityFailures });
  } else {
    recordGate(GLOBAL_GATE_ID.G22_FOOD_DIVERSITY_AND_REPETITION, 'Food Diversity and Repetition', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Porções individuais seguras e diversidade alimentar diária adequada.', { distinctFoodsCount: allFinalFoodIds.size });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G23 — MEAL FOOD STRUCTURE (Estrutura de composição da refeição)
  // ─────────────────────────────────────────────────────────────────────────
  const structureFailures = [];
  const isMainMealStructureStrict = totalAvailableDistinct >= 4;

  finalMeals.forEach(meal => {
    const isMainMeal = meal.mealRole === 'PRIMARY' || /almo[cç]o|jantar/i.test(meal.mealName || '');
    const itemCount = Array.isArray(meal.items) ? meal.items.length : 0;

    if (isMainMealStructureStrict && isMainMeal && itemCount < policy.minItemsInMainMeal) {
      structureFailures.push(`Refeição principal "${meal.mealName || meal.mealId}" estruturalmente incompleta com apenas ${itemCount} alimento(s) (mínimo: ${policy.minItemsInMainMeal}).`);
    }
  });

  if (structureFailures.length > 0) {
    recordGate(GLOBAL_GATE_ID.G23_MEAL_FOOD_STRUCTURE, 'Meal Food Structure', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Estrutura de montagem de refeições principais incompleta ou inadequada.', { failures: structureFailures });
  } else {
    recordGate(GLOBAL_GATE_ID.G23_MEAL_FOOD_STRUCTURE, 'Meal Food Structure', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Estrutura de composição de todas as refeições principais em conformidade.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // G18 — GLOBAL PROVENANCE INTEGRITY
  // ─────────────────────────────────────────────────────────────────────────
  const globalProvenance = {
    engine: 'NutriAxGlobalPrescriptionValidator',
    validationVersion: GLOBAL_VALIDATION_VERSION,
    chainVersions: {
      context: (context && context.schemaVersion) || '1.0.0',
      n21_energy: (energyTargetResult && energyTargetResult.provenance && energyTargetResult.provenance.policyVersion) || 'N2.1.0',
      n22_macro: (macroTargetResult && macroTargetResult.provenance && macroTargetResult.provenance.policyVersion) || 'N2.2.0',
      n23_validator: (nutritionValidatorResult && nutritionValidatorResult.validationVersion) || 'N2.3.0',
      n32_solver: (foodSolverResult && foodSolverResult.solverVersion) || 'N3.2.0',
      n33_assembly: (mealAssemblyResult && mealAssemblyResult.assemblyVersion) || 'N3.3.0',
      n34_timing: (mealTimingResult && mealTimingResult.timingVersion) || 'N3.4.0',
      n35_nutrientTiming: (nutrientTimingResult && nutrientTimingResult.timingAnalysisVersion) || 'N3.5.0'
    },
    traceabilitySummary: {
      q1_targetEnergetico: {
        caloricTargetKcal: energyTargetResult ? energyTargetResult.caloricTargetKcal : null,
        tmbKcal: energyTargetResult ? energyTargetResult.tmbKcal : null,
        getKcal: energyTargetResult ? energyTargetResult.getKcal : null,
        energyBalanceKcal: energyTargetResult ? energyTargetResult.energyBalanceKcal : null,
        sourcePhase: 'N2.1'
      },
      q2_politicaEnergetica: {
        policyVersion: energyTargetResult?.provenance?.policyVersion || 'DEFAULT',
        appliedRule: energyTargetResult?.provenance?.rule || 'DETERMINISTIC_TARGET',
        sourcePhase: 'N2.1'
      },
      q3_macrosHomologados: {
        proteinTargetG: macroTargetResult ? macroTargetResult.proteinTargetG : null,
        carbohydrateTargetG: macroTargetResult ? macroTargetResult.carbohydrateTargetG : null,
        fatTargetG: macroTargetResult ? macroTargetResult.fatTargetG : null,
        closedKcal: atwaterCalculatedKcal,
        sourcePhase: 'N2.2'
      },
      q4_alimentosSelecionados: {
        foodsCount: solverFoodIds.size,
        foodIds: Array.from(solverFoodIds),
        sourcePhase: 'N3.2'
      },
      q5_solucaoSolver: {
        status: foodSolverResult ? foodSolverResult.status : null,
        cost: foodSolverResult ? foodSolverResult.cost : null,
        solverKcal: solverNutrients.calories,
        sourcePhase: 'N3.2'
      },
      q6_distribuicaoRefeicoes: {
        mealsCount: finalMeals.length,
        massConservation: deltaTotalMass <= policy.massToleranceGrams ? 'EXACT' : 'DIVERGENT',
        sourcePhase: 'N3.3'
      },
      q7_horariosAtribuidos: {
        eatingWindow: eatingWindow ? `${eatingWindow.start} - ${eatingWindow.end}` : null,
        windowStrength: eatingWindow ? eatingWindow.strength : null,
        mealsSchedule: finalMeals.map(m => ({ mealId: m.mealId, scheduledTime: m.scheduledTime })),
        sourcePhase: 'N3.4'
      },
      q8_relacaoTemporalDetectada: {
        mealsRelations: finalMeals.map(m => ({
          mealId: m.mealId,
          primaryRelation: m.primaryRelation,
          secondaryRelations: m.secondaryRelations || []
        })),
        sourcePhase: 'N3.5'
      },
      q9_warningsExistentes: {
        inheritedCount: inheritedWarnings.length,
        validationCount: validationWarnings.length,
        totalWarnings: inheritedWarnings.length + validationWarnings.length
      },
      q10_motivoStatusFinal: {
        provisionalStatus: blockingReasons.length > 0
          ? GLOBAL_VALIDATION_STATUS.BLOCKED
          : ((inheritedWarnings.length > 0 || validationWarnings.length > 0)
            ? GLOBAL_VALIDATION_STATUS.WARNING
            : GLOBAL_VALIDATION_STATUS.PASS),
        blockingCount: blockingReasons.length
      }
    }
  };

  recordGate(GLOBAL_GATE_ID.G18_PROVENANCE_INTEGRITY, 'Global Provenance Integrity', 'PASS', GATE_SEVERITY.INFORMATIONAL,
    'Árvore de proveniência unificada de ponta a ponta (N2.1 a N3.6) montada com sucesso.');

  // ─────────────────────────────────────────────────────────────────────────
  // G19 — DETERMINISM
  // ─────────────────────────────────────────────────────────────────────────
  recordGate(GLOBAL_GATE_ID.G19_DETERMINISM, 'Determinism Invariant', 'PASS', GATE_SEVERITY.INFORMATIONAL,
    'Função de validação estritamente determinística, com avaliação pura e idempotente sem efeitos colaterais.');

  // ─────────────────────────────────────────────────────────────────────────
  // G20 — DEEP IMMUTABILITY (Verificação do input e congelamento)
  // ─────────────────────────────────────────────────────────────────────────
  const isInputUnmutated = isDeepEqualPure(input, inputSnapshot);
  if (!isInputUnmutated) {
    recordGate(GLOBAL_GATE_ID.G20_IMMUTABILITY, 'Deep Immutability Invariant', 'FAIL', GATE_SEVERITY.BLOCKING,
      'Mutação detectada em um dos objetos de entrada durante a execução da N3.6.');
  } else {
    recordGate(GLOBAL_GATE_ID.G20_IMMUTABILITY, 'Deep Immutability Invariant', 'PASS', GATE_SEVERITY.INFORMATIONAL,
      'Objetos de entrada 100% preservados e imutáveis.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DETERMINAÇÃO DO STATUS FINAL
  // ─────────────────────────────────────────────────────────────────────────
  let finalStatus = GLOBAL_VALIDATION_STATUS.PASS;
  let finalValid = true;

  if (blockingReasons.length > 0) {
    finalStatus = GLOBAL_VALIDATION_STATUS.BLOCKED;
    finalValid = false;
  } else if (inheritedWarnings.length > 0 || validationWarnings.length > 0) {
    finalStatus = GLOBAL_VALIDATION_STATUS.WARNING;
    finalValid = true;
  }

  globalProvenance.traceabilitySummary.q10_motivoStatusFinal.finalStatus = finalStatus;
  globalProvenance.traceabilitySummary.q10_motivoStatusFinal.valid = finalValid;
  globalProvenance.traceabilitySummary.q10_motivoStatusFinal.summary = finalStatus === GLOBAL_VALIDATION_STATUS.PASS
    ? 'Prescrição validada com sucesso em todos os 20 portões globais determinísticos.'
    : (finalStatus === GLOBAL_VALIDATION_STATUS.WARNING
      ? 'Prescrição aprovada com observações operacionais/limitações de dados documentadas.'
      : 'Prescrição bloqueada por violação de invariantes técnicos determinísticos.');

  // DTO de Saída Canônico
  const outputDTO = {
    globalValidationVersion: GLOBAL_VALIDATION_VERSION,
    status: finalStatus,
    valid: finalValid,
    gateResults,
    conservationAudit: {
      energyTargetKcal: energyTargetResult?.caloricTargetKcal || null,
      macroClosedKcal: atwaterCalculatedKcal,
      solverKcal: solverNutrients.calories,
      finalKcal: finalNutrients.calories,
      deltaKcalFinalVsSolver: Number(deltaCalories.toFixed(4)),
      proteinTargetG: macroTargetResult?.proteinTargetG || null,
      solverProteinG: solverNutrients.protein,
      finalProteinG: finalNutrients.protein,
      deltaProteinG: Number(deltaProtein.toFixed(4)),
      carbsTargetG: macroTargetResult?.carbohydrateTargetG || null,
      solverCarbsG: solverNutrients.carbohydrate,
      finalCarbsG: finalNutrients.carbohydrate,
      deltaCarbsG: Number(deltaCarbs.toFixed(4)),
      fatTargetG: macroTargetResult?.fatTargetG || null,
      solverFatG: solverNutrients.lipid,
      finalFatG: finalNutrients.lipid,
      deltaFatG: Number(deltaLipid.toFixed(4)),
      fiberG: finalNutrients.fiber,
      solverFiberG: solverNutrients.fiber,
      deltaFiberG: Number(deltaFiber.toFixed(4)),
      sodiumMg: finalNutrients.sodium,
      solverSodiumMg: solverNutrients.sodium,
      deltaSodiumMg: sodiumChecked ? Number(deltaSodium.toFixed(4)) : null,
      totalFoodMassGrams: Number(finalTotalMass.toFixed(2)),
      solverFoodMassGrams: Number(solverTotalMass.toFixed(2)),
      deltaMassFinalVsSolverGrams: Number(deltaTotalMass.toFixed(4)),
      isStrictlyConserved: deltaTotalMass <= policy.massToleranceGrams &&
        deltaCalories <= policy.calorieToleranceKcal &&
        deltaProtein <= policy.proteinToleranceGrams &&
        deltaCarbs <= policy.carbohydrateToleranceGrams &&
        deltaLipid <= policy.lipidToleranceGrams
    },
    temporalAudit: {
      eatingWindow,
      mealsCount: finalMeals.length,
      mealsSchedule: finalMeals.map(m => ({
        mealId: m.mealId,
        mealIndex: m.mealIndex,
        scheduledTime: m.scheduledTime,
        scheduledMinutes: m.scheduledMinutes,
        primaryRelation: m.primaryRelation,
        secondaryRelations: m.secondaryRelations || []
      })),
      hasCollisions: hasCollision,
      hasFastedTraining: finalMeals.some(m => Array.isArray(m.secondaryRelations) && m.secondaryRelations.includes('FASTING_CONSTRAINED'))
    },
    globalDiagnostics,
    inheritedWarnings,
    validationWarnings,
    blockingReasons,
    globalProvenance
  };

  return policy.enforceDeepFreeze ? deepFreeze(outputDTO) : outputDTO;
}

module.exports = deepFreeze({
  validateGlobalPrescription
});
