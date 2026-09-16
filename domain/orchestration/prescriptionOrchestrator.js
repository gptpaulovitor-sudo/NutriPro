/**
 * domain/orchestration/prescriptionOrchestrator.js
 * 
 * Orquestrador Canônico do Pipeline de Prescrição Nutricional — NutriAx Pro.
 * Fase N3.7.1 — Orquestrador Determinístico Puro.
 * 
 * Executa a cadeia sequencial canônica completa:
 * N1.1 -> N2.1 -> N2.2 -> N2.3 -> N3.2 -> N3.3 -> N3.4 -> N3.5 -> N3.6
 * 
 * Restrições Absolutas de Governança:
 * 1. PUREZA ABSOLUTA: Zero DOM, zero window/document, zero Dexie/Firebase, zero Gemini,
 *    zero Date.now(), zero Math.random(), zero I/O de rede ou disco.
 * 2. DETERMINISMO ESTÓICO: Mesma entrada + mesmas políticas = mesma saída estruturada idêntica.
 * 3. IMUTABILIDADE PROFUNDA: Entradas não são mutadas (cópia defensiva pura);
 *    saída profundamente congelada (deepFreeze).
 * 4. FAIL-FAST DETERMINÍSTICO: Interrompe a cadeia imediatamente quando uma etapa obrigatória
 *    retorna BLOCKED/invalid. As etapas subsequentes permanecem null.
 * 5. N3.6 É OBRIGATORIAMENTE A ETAPA FINAL: Nenhuma transformação, ajuste, rebalanceamento,
 *    reagendamento ou alteração de alimentos ocorre após validateGlobalPrescription().
 * 6. ZERO ALIASES SILENCIOSOS: Consome estritamente os contratos canônicos
 *    (proteinTargetG, carbohydrateTargetG, fatTargetG, fiberTargetG).
 * 7. PIPELINE TRACE SEM TIMESTAMPS: Registra deterministicamente os passos executados,
 *    status e razões de bloqueio sem campos temporais variáveis.
 */

'use strict';

const { validateNutritionPrescriptionContextDTO } = require('../contracts/NutritionPrescriptionContextDTO');
const { buildNutritionPrescriptionContext } = require('../adapters/nutritionContextAdapter');
const { calculateDeterministicEnergyTarget } = require('../math/energyTarget');
const { calculateDeterministicMacroTargets } = require('../math/macroTarget');
const { validateNutritionPrescriptionTargets } = require('../math/nutritionTargetValidator');
const { solveNutritionDiet } = require('../solver/foodSolver');
const { assembleMeals } = require('../meal/mealAssembly');
const { scheduleMeals } = require('../timing/mealTiming');
const { analyzeNutrientTiming } = require('../timing/nutrientTiming');
const { validateGlobalPrescription } = require('../validation/globalPrescriptionValidator');

/**
 * Identificadores canônicos das etapas do pipeline
 */
const PIPELINE_STEP = Object.freeze({
  N11_CONTEXT: 'N1.1_CONTEXT',
  N21_ENERGY_TARGET: 'N2.1_ENERGY_TARGET',
  N22_MACRO_TARGET: 'N2.2_MACRO_TARGET',
  N23_NUTRITION_VALIDATOR: 'N2.3_NUTRITION_VALIDATOR',
  N32_FOOD_SOLVER: 'N3.2_FOOD_SOLVER',
  N33_MEAL_ASSEMBLY: 'N3.3_MEAL_ASSEMBLY',
  N34_MEAL_TIMING: 'N3.4_MEAL_TIMING',
  N35_NUTRIENT_TIMING: 'N3.5_NUTRIENT_TIMING',
  N36_GLOBAL_VALIDATION: 'N3.6_GLOBAL_VALIDATION'
});

/**
 * Status formais de execução do orquestrador
 */
const ORCHESTRATOR_STATUS = Object.freeze({
  PASS: 'PASS',
  WARNING: 'WARNING',
  BLOCKED: 'BLOCKED'
});

/**
 * Congelamento profundo determinístico e recursivo
 * @param {any} obj 
 * @returns {any}
 */
function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Object.isFrozen(obj)) {
    return obj;
  }

  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const val = obj[prop];
    if (val !== null && (typeof val === 'object' || typeof val === 'function') && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  });

  return obj;
}

/**
 * Cópia profunda pura para proteção defensiva das entradas
 * @param {any} val 
 * @returns {any}
 */
function cloneDeepPure(val) {
  if (val === null || typeof val !== 'object') {
    return val;
  }
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
 * Valida a integridade estrutural do input fornecido ao orquestrador
 * @param {Object} input 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateOrchestratorInput(input) {
  const errors = [];

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      errors: ['Input do orquestrador deve ser um objeto válido e não-nulo.']
    };
  }

  // Deve fornecer context OU (patientId + stores)
  const hasContext = input.context != null && typeof input.context === 'object';
  const hasPatientIdAndStores = typeof input.patientId === 'string' && input.patientId.trim() !== '' && input.stores != null;

  if (!hasContext && !hasPatientIdAndStores) {
    errors.push('Input deve conter "context" (NutritionPrescriptionContextDTO) ou "patientId" + "stores".');
  }

  if (input.foodCatalog !== undefined && input.foodCatalog !== null && !Array.isArray(input.foodCatalog)) {
    errors.push('foodCatalog, quando fornecido, deve ser um Array.');
  }

  if (input.policies !== undefined && input.policies !== null && (typeof input.policies !== 'object' || Array.isArray(input.policies))) {
    errors.push('policies, quando fornecido, deve ser um objeto.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Monta a estrutura canônica imutável de resultado do pipeline
 * @param {Object} params 
 * @returns {Readonly<Object>}
 */
function buildPipelineOutput(params) {
  const output = {
    orchestratorVersion: 'N3.7.1',
    success: Boolean(params.success),
    status: params.status || ORCHESTRATOR_STATUS.BLOCKED,
    interruptedAt: params.interruptedAt || null,
    blockingReasons: Array.isArray(params.blockingReasons) ? [...params.blockingReasons] : [],
    warnings: Array.isArray(params.warnings) ? [...params.warnings] : [],
    context: params.context || null,
    energyTargetResult: params.energyTargetResult || null,
    macroTargetResult: params.macroTargetResult || null,
    nutritionValidatorResult: params.nutritionValidatorResult || null,
    foodSolverResult: params.foodSolverResult || null,
    mealAssemblyResult: params.mealAssemblyResult || null,
    mealTimingResult: params.mealTimingResult || null,
    nutrientTimingResult: params.nutrientTimingResult || null,
    globalValidationResult: params.globalValidationResult || null,
    pipelineTrace: Array.isArray(params.pipelineTrace) ? [...params.pipelineTrace] : []
  };

  return deepFreeze(output);
}

/**
 * Execução síncrona central do pipeline determinístico a partir de um context já resolvido.
 * 
 * @param {Object} resolvedContext - NutritionPrescriptionContextDTO canônico
 * @param {Array<Object>} foodCatalog - Catálogo de alimentos para N3.2
 * @param {Object} [policies={}] - Políticas versionadas para as etapas
 * @param {Object} [options={}] - Opções de execução adicionais
 * @returns {Readonly<Object>} PrescriptionPipelineResultDTO imutável
 */
function executePipelineCore(resolvedContext, foodCatalog, policies = {}, options = {}) {
  const pipelineTrace = [];
  const accumulatedWarnings = [];

  let currentContext = resolvedContext;
  if (options && (options.mealCount || options.mealsPerDay) && currentContext) {
    const desiredMealCount = options.mealCount || options.mealsPerDay;
    if (typeof desiredMealCount === 'number' && desiredMealCount >= 1 && desiredMealCount <= 8) {
      currentContext = {
        ...currentContext,
        mealsPerDay: desiredMealCount,
        mealCount: desiredMealCount,
        routine: {
          ...(currentContext.routine || {}),
          mealsPerDay: desiredMealCount,
          mealCount: desiredMealCount
        }
      };
    }
  }
  let energyTargetResult = null;
  let macroTargetResult = null;
  let nutritionValidatorResult = null;
  let foodSolverResult = null;
  let mealAssemblyResult = null;
  let mealTimingResult = null;
  let nutrientTimingResult = null;
  let globalValidationResult = null;

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 1: N1.1 — CONTEXTO CANÔNICO DE PRESCRIÇÃO NUTRICIONAL
  // ═══════════════════════════════════════════════════════════════════════════
  const contextValidation = validateNutritionPrescriptionContextDTO(currentContext);
  if (!contextValidation.isValid) {
    const reasons = [...contextValidation.errors];
    pipelineTrace.push({
      step: PIPELINE_STEP.N11_CONTEXT,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: 'Contexto de prescrição nutricional não atende ao schema contratual N1.1.'
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N11_CONTEXT,
      blockingReasons: reasons,
      context: currentContext,
      pipelineTrace
    });
  }

  pipelineTrace.push({
    step: PIPELINE_STEP.N11_CONTEXT,
    status: ORCHESTRATOR_STATUS.PASS,
    details: 'Contexto canônico N1.1 validado com sucesso.'
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 2: N2.1 — DETERMINISTIC ENERGY TARGET
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    energyTargetResult = calculateDeterministicEnergyTarget(currentContext, {
      policy: policies.energyPolicy
    });
  } catch (err) {
    const reasons = [err.message || 'Erro inesperado no cálculo da meta energética N2.1.'];
    pipelineTrace.push({
      step: PIPELINE_STEP.N21_ENERGY_TARGET,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons[0]
    });
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N21_ENERGY_TARGET,
      blockingReasons: reasons,
      context: currentContext,
      pipelineTrace
    });
  }

  if (energyTargetResult.status === 'BLOCKED' || !energyTargetResult.caloricTargetKcal || energyTargetResult.caloricTargetKcal <= 0) {
    const reasons = Array.isArray(energyTargetResult.blockingReasons) && energyTargetResult.blockingReasons.length > 0
      ? [...energyTargetResult.blockingReasons]
      : ['Meta energética não pôde ser calculada ou retornou valor não-positivo.'];

    pipelineTrace.push({
      step: PIPELINE_STEP.N21_ENERGY_TARGET,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons.join('; ')
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N21_ENERGY_TARGET,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      pipelineTrace
    });
  }

  if (Array.isArray(energyTargetResult.warnings) && energyTargetResult.warnings.length > 0) {
    accumulatedWarnings.push(...energyTargetResult.warnings.map(w => `[N2.1] ${w}`));
  }

  pipelineTrace.push({
    step: PIPELINE_STEP.N21_ENERGY_TARGET,
    status: energyTargetResult.status || ORCHESTRATOR_STATUS.PASS,
    details: `Meta energética calculada: ${energyTargetResult.caloricTargetKcal} kcal (TMB: ${energyTargetResult.tmbKcal} kcal, GET: ${energyTargetResult.getKcal} kcal).`,
    warnings: energyTargetResult.warnings || []
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 3: N2.2 — DETERMINISTIC MACRONUTRIENT TARGETS
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    macroTargetResult = calculateDeterministicMacroTargets(currentContext, energyTargetResult, {
      policy: policies.macroPolicy
    });
  } catch (err) {
    const reasons = [err.message || 'Erro inesperado no cálculo de macronutrientes N2.2.'];
    pipelineTrace.push({
      step: PIPELINE_STEP.N22_MACRO_TARGET,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons[0]
    });
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N22_MACRO_TARGET,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      pipelineTrace
    });
  }

  if (macroTargetResult.status === 'BLOCKED') {
    const reasons = Array.isArray(macroTargetResult.blockingReasons) && macroTargetResult.blockingReasons.length > 0
      ? [...macroTargetResult.blockingReasons]
      : ['Distribuição de macronutrientes bloqueada pela política N2.2.'];

    pipelineTrace.push({
      step: PIPELINE_STEP.N22_MACRO_TARGET,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons.join('; ')
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N22_MACRO_TARGET,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      pipelineTrace
    });
  }

  if (Array.isArray(macroTargetResult.warnings) && macroTargetResult.warnings.length > 0) {
    accumulatedWarnings.push(...macroTargetResult.warnings.map(w => `[N2.2] ${w}`));
  }

  pipelineTrace.push({
    step: PIPELINE_STEP.N22_MACRO_TARGET,
    status: macroTargetResult.status || ORCHESTRATOR_STATUS.PASS,
    details: `Metas de macronutrientes: Proteína=${macroTargetResult.proteinTargetG}g, Carboidrato=${macroTargetResult.carbohydrateTargetG}g, Gordura=${macroTargetResult.fatTargetG}g, Fibras=${macroTargetResult.fiberTargetG || 0}g.`,
    warnings: macroTargetResult.warnings || []
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 4: N2.3 — DETERMINISTIC NUTRITION TARGET VALIDATOR
  try {
    const nutritionValidationOptions = (policies.nutritionValidationPolicy && typeof policies.nutritionValidationPolicy === 'object')
      ? { ...policies.nutritionValidationPolicy }
      : {};

    nutritionValidatorResult = validateNutritionPrescriptionTargets(
      currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidationOptions
    );
  } catch (err) {
    const reasons = [err.message || 'Erro inesperado na validação de metas N2.3.'];
    pipelineTrace.push({
      step: PIPELINE_STEP.N23_NUTRITION_VALIDATOR,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons[0]
    });
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N23_NUTRITION_VALIDATOR,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      pipelineTrace
    });
  }

  if (nutritionValidatorResult.status === 'BLOCKED' || nutritionValidatorResult.valid !== true) {
    const reasons = Array.isArray(nutritionValidatorResult.blockingReasons) && nutritionValidatorResult.blockingReasons.length > 0
      ? [...nutritionValidatorResult.blockingReasons]
      : ['Validação bromatológica e energética das metas reprovada no portão N2.3.'];

    pipelineTrace.push({
      step: PIPELINE_STEP.N23_NUTRITION_VALIDATOR,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons.join('; ')
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N23_NUTRITION_VALIDATOR,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      pipelineTrace
    });
  }

  if (Array.isArray(nutritionValidatorResult.warnings) && nutritionValidatorResult.warnings.length > 0) {
    accumulatedWarnings.push(...nutritionValidatorResult.warnings.map(w => `[N2.3] ${w}`));
  }

  pipelineTrace.push({
    step: PIPELINE_STEP.N23_NUTRITION_VALIDATOR,
    status: nutritionValidatorResult.status || ORCHESTRATOR_STATUS.PASS,
    details: 'Validação termodinâmica e bromatológica pré-cardápio aprovada.',
    warnings: nutritionValidatorResult.warnings || []
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 5: N3.2 — DETERMINISTIC FOOD SOLVER
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    const solverInput = {
      context: currentContext,
      energyTarget: energyTargetResult,
      macroTarget: macroTargetResult,
      validationResult: nutritionValidatorResult,
      foodCatalog: Array.isArray(foodCatalog) ? foodCatalog : [],
      options: options.solverOptions || {}
    };

    foodSolverResult = solveNutritionDiet(solverInput, policies.foodSolverPolicy || {});
  } catch (err) {
    const reasons = [err.message || 'Erro inesperado na execução do Food Solver N3.2.'];
    pipelineTrace.push({
      step: PIPELINE_STEP.N32_FOOD_SOLVER,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons[0]
    });
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N32_FOOD_SOLVER,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      pipelineTrace
    });
  }

  // N3.7.5: Tratamento explícito de SEARCH_LIMIT_REACHED antes da verificação genérica.
  // Este status indica que o solver interrompeu a busca por limite computacional, não por
  // ausência de solução. O diagnóstico deve ser claro e acionável para o nutricionista.
  if (foodSolverResult.status === 'SEARCH_LIMIT_REACHED') {
    const reasons = Array.isArray(foodSolverResult.blockingReasons) && foodSolverResult.blockingReasons.length > 0
      ? [...foodSolverResult.blockingReasons]
      : [
          'O Food Solver atingiu o limite computacional de busca combinatória (SEARCH_LIMIT_REACHED).',
          'A prescrição não pode ser gerada com o catálogo atual neste ambiente.',
          'Ação recomendada: reduza o número de alimentos elegíveis no catálogo ou use o modo servidor (Node.js) com limite expandido.'
        ];

    pipelineTrace.push({
      step: PIPELINE_STEP.N32_FOOD_SOLVER,
      status: 'SEARCH_LIMIT_REACHED',
      blockingReasons: reasons,
      details: `Solver interrompido por limite computacional. Diagnósticos: ${(foodSolverResult.solverDiagnostics || []).join(' | ')}`,
      warnings: foodSolverResult.warnings || []
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N32_FOOD_SOLVER,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      pipelineTrace
    });
  }

  if (foodSolverResult.status === 'BLOCKED' || foodSolverResult.status === 'NO_SOLUTION' || foodSolverResult.valid !== true) {
    const reasons = Array.isArray(foodSolverResult.blockingReasons) && foodSolverResult.blockingReasons.length > 0
      ? [...foodSolverResult.blockingReasons]
      : [`Otimização do Food Solver bloqueada com status "${foodSolverResult.status}".`];

    pipelineTrace.push({
      step: PIPELINE_STEP.N32_FOOD_SOLVER,
      status: foodSolverResult.status || ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons.join('; ')
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N32_FOOD_SOLVER,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      pipelineTrace
    });
  }


  if (Array.isArray(foodSolverResult.warnings) && foodSolverResult.warnings.length > 0) {
    accumulatedWarnings.push(...foodSolverResult.warnings.map(w => `[N3.2] ${w}`));
  }

  const solverItemCount = foodSolverResult.items?.length || (foodSolverResult.meals?.[0]?.items?.length) || 0;
  pipelineTrace.push({
    step: PIPELINE_STEP.N32_FOOD_SOLVER,
    status: foodSolverResult.status || ORCHESTRATOR_STATUS.PASS,
    details: `Seleção e porcionamento determinístico concluídos (${solverItemCount} alimentos resolvidos).`,
    warnings: foodSolverResult.warnings || []
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 6: N3.3 — DETERMINISTIC MEAL ASSEMBLY
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    const assemblyInput = {
      context: currentContext,
      validationResult: nutritionValidatorResult,
      foodSolverResult,
      options
    };

    mealAssemblyResult = assembleMeals(assemblyInput, policies.mealAssemblyPolicy || {});
  } catch (err) {
    const reasons = [err.message || 'Erro inesperado no Meal Assembly N3.3.'];
    pipelineTrace.push({
      step: PIPELINE_STEP.N33_MEAL_ASSEMBLY,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons[0]
    });
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N33_MEAL_ASSEMBLY,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      pipelineTrace
    });
  }

  if (mealAssemblyResult.status === 'BLOCKED' || mealAssemblyResult.status === 'NO_SOLUTION' || mealAssemblyResult.valid !== true) {
    const reasons = Array.isArray(mealAssemblyResult.blockingReasons) && mealAssemblyResult.blockingReasons.length > 0
      ? [...mealAssemblyResult.blockingReasons]
      : [`Montagem de refeições N3.3 bloqueada com status "${mealAssemblyResult.status}".`];

    pipelineTrace.push({
      step: PIPELINE_STEP.N33_MEAL_ASSEMBLY,
      status: mealAssemblyResult.status || ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons.join('; ')
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N33_MEAL_ASSEMBLY,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      mealAssemblyResult,
      pipelineTrace
    });
  }

  if (Array.isArray(mealAssemblyResult.warnings) && mealAssemblyResult.warnings.length > 0) {
    const solverWarnSet = new Set(Array.isArray(foodSolverResult?.warnings) ? foodSolverResult.warnings : []);
    const assemblyOnlyWarnings = mealAssemblyResult.warnings.filter(w => !solverWarnSet.has(w));
    if (assemblyOnlyWarnings.length > 0) {
      accumulatedWarnings.push(...assemblyOnlyWarnings.map(w => `[N3.3] ${w}`));
    }
  }

  const assembledMealCount = Array.isArray(mealAssemblyResult.meals) ? mealAssemblyResult.meals.length : 0;
  pipelineTrace.push({
    step: PIPELINE_STEP.N33_MEAL_ASSEMBLY,
    status: mealAssemblyResult.status || ORCHESTRATOR_STATUS.PASS,
    details: `Alimentos distribuídos em ${assembledMealCount} refeições estruturadas com preservação de massa e nutrientes.`,
    warnings: mealAssemblyResult.warnings || []
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 7: N3.4 — DETERMINISTIC MEAL TIMING
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    const timingInput = {
      context: currentContext,
      mealAssemblyResult
    };

    mealTimingResult = scheduleMeals(timingInput, policies.mealTimingPolicy || {});
  } catch (err) {
    const reasons = [err.message || 'Erro inesperado no agendamento temporal de refeições N3.4.'];
    pipelineTrace.push({
      step: PIPELINE_STEP.N34_MEAL_TIMING,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons[0]
    });
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N34_MEAL_TIMING,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      mealAssemblyResult,
      pipelineTrace
    });
  }

  if (mealTimingResult.status === 'BLOCKED' || mealTimingResult.valid !== true) {
    const reasons = Array.isArray(mealTimingResult.blockingReasons) && mealTimingResult.blockingReasons.length > 0
      ? [...mealTimingResult.blockingReasons]
      : [`Agendamento temporal N3.4 bloqueado com status "${mealTimingResult.status}".`];

    pipelineTrace.push({
      step: PIPELINE_STEP.N34_MEAL_TIMING,
      status: mealTimingResult.status || ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons.join('; ')
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N34_MEAL_TIMING,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      mealAssemblyResult,
      mealTimingResult,
      pipelineTrace
    });
  }

  if (Array.isArray(mealTimingResult.warnings) && mealTimingResult.warnings.length > 0) {
    const assemblyWarnSet = new Set(Array.isArray(mealAssemblyResult?.warnings) ? mealAssemblyResult.warnings : []);
    const timingOnlyWarnings = mealTimingResult.warnings.filter(w => !assemblyWarnSet.has(w));
    if (timingOnlyWarnings.length > 0) {
      accumulatedWarnings.push(...timingOnlyWarnings.map(w => `[N3.4] ${w}`));
    }
  }

  pipelineTrace.push({
    step: PIPELINE_STEP.N34_MEAL_TIMING,
    status: mealTimingResult.status || ORCHESTRATOR_STATUS.PASS,
    details: 'Refeições posicionadas temporalmente com respeito à janela alimentar, rotina e sono.',
    warnings: mealTimingResult.warnings || []
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 8: N3.5 — NUTRIENT TIMING ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    const nutrientTimingInput = {
      context: currentContext,
      mealAssemblyResult,
      mealTimingResult
    };

    nutrientTimingResult = analyzeNutrientTiming(nutrientTimingInput, policies.nutrientTimingPolicy || {});
  } catch (err) {
    const reasons = [err.message || 'Erro inesperado na análise de nutrient timing N3.5.'];
    pipelineTrace.push({
      step: PIPELINE_STEP.N35_NUTRIENT_TIMING,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons[0]
    });
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N35_NUTRIENT_TIMING,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      mealAssemblyResult,
      mealTimingResult,
      pipelineTrace
    });
  }

  if (nutrientTimingResult.status === 'BLOCKED' || nutrientTimingResult.valid !== true) {
    const reasons = Array.isArray(nutrientTimingResult.blockingReasons) && nutrientTimingResult.blockingReasons.length > 0
      ? [...nutrientTimingResult.blockingReasons]
      : [`Análise de nutrient timing N3.5 bloqueada com status "${nutrientTimingResult.status}".`];

    pipelineTrace.push({
      step: PIPELINE_STEP.N35_NUTRIENT_TIMING,
      status: nutrientTimingResult.status || ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons.join('; ')
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N35_NUTRIENT_TIMING,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      mealAssemblyResult,
      mealTimingResult,
      nutrientTimingResult,
      pipelineTrace
    });
  }

  if (Array.isArray(nutrientTimingResult.warnings) && nutrientTimingResult.warnings.length > 0) {
    const timingWarnSet = new Set(Array.isArray(mealTimingResult?.warnings) ? mealTimingResult.warnings : []);
    const nutrientTimingOnlyWarnings = nutrientTimingResult.warnings.filter(w => !timingWarnSet.has(w));
    if (nutrientTimingOnlyWarnings.length > 0) {
      accumulatedWarnings.push(...nutrientTimingOnlyWarnings.map(w => `[N3.5] ${w}`));
    }
  }

  pipelineTrace.push({
    step: PIPELINE_STEP.N35_NUTRIENT_TIMING,
    status: nutrientTimingResult.status || ORCHESTRATOR_STATUS.PASS,
    details: 'Relação temporal entre refeições, treino, cardio e jejum analisada.',
    warnings: nutrientTimingResult.warnings || []
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 9: N3.6 — GLOBAL PRESCRIPTION VALIDATOR (JUIZ FINAL OBRIGATÓRIO)
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    const globalValidationInput = {
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      mealAssemblyResult,
      mealTimingResult,
      nutrientTimingResult
    };

    globalValidationResult = validateGlobalPrescription(globalValidationInput, policies.globalValidationPolicy || {});
  } catch (err) {
    const reasons = [err.message || 'Erro inesperado na validação global N3.6.'];
    pipelineTrace.push({
      step: PIPELINE_STEP.N36_GLOBAL_VALIDATION,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons,
      details: reasons[0]
    });
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N36_GLOBAL_VALIDATION,
      blockingReasons: reasons,
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      mealAssemblyResult,
      mealTimingResult,
      nutrientTimingResult,
      pipelineTrace
    });
  }

  const finalStatus = globalValidationResult.status || ORCHESTRATOR_STATUS.BLOCKED;
  const isPipelineCompliant = finalStatus !== ORCHESTRATOR_STATUS.BLOCKED && globalValidationResult.valid === true;

  if (Array.isArray(globalValidationResult.validationWarnings) && globalValidationResult.validationWarnings.length > 0) {
    accumulatedWarnings.push(...globalValidationResult.validationWarnings.map(w => `[N3.6] ${w}`));
  }

  const passedGates = Array.isArray(globalValidationResult.gateResults)
    ? globalValidationResult.gateResults.filter(g => g.status === 'PASS').length
    : 0;
  const totalGates = Array.isArray(globalValidationResult.gateResults)
    ? globalValidationResult.gateResults.length
    : 20;

  const gateDetails = `Validação global N3.6 concluída com status "${finalStatus}" (${passedGates}/${totalGates} portões aprovados).`;

  if (!isPipelineCompliant) {
    const reasons = Array.isArray(globalValidationResult.blockingReasons) && globalValidationResult.blockingReasons.length > 0
      ? [...globalValidationResult.blockingReasons]
      : ['Validação global N3.6 reprovada em um ou mais portões clínicos.'];

    pipelineTrace.push({
      step: PIPELINE_STEP.N36_GLOBAL_VALIDATION,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      blockingReasons: reasons.length > 0 ? reasons : ['Portão clínico bloqueante violado.'],
      details: gateDetails
    });

    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: PIPELINE_STEP.N36_GLOBAL_VALIDATION,
      blockingReasons: reasons.length > 0 ? reasons : ['Portão clínico bloqueante violado.'],
      warnings: [...new Set(accumulatedWarnings)],
      context: currentContext,
      energyTargetResult,
      macroTargetResult,
      nutritionValidatorResult,
      foodSolverResult,
      mealAssemblyResult,
      mealTimingResult,
      nutrientTimingResult,
      globalValidationResult,
      pipelineTrace
    });
  }

  pipelineTrace.push({
    step: PIPELINE_STEP.N36_GLOBAL_VALIDATION,
    status: finalStatus,
    details: gateDetails,
    warnings: Array.isArray(globalValidationResult.validationWarnings) ? globalValidationResult.validationWarnings : []
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INVARIANTE ABSOLUTO N3.7:
  // Nenhuma alteração, recálculo, reajuste ou reagendamento de alimentos
  // é permitido após o validateGlobalPrescription().
  // O resultado congelado é retornado imediatamente.
  // ═══════════════════════════════════════════════════════════════════════════
  return buildPipelineOutput({
    success: true,
    status: finalStatus,
    interruptedAt: null,
    blockingReasons: [],
    warnings: [...new Set(accumulatedWarnings)],
    context: currentContext,
    energyTargetResult,
    macroTargetResult,
    nutritionValidatorResult,
    foodSolverResult,
    mealAssemblyResult,
    mealTimingResult,
    nutrientTimingResult,
    globalValidationResult,
    pipelineTrace
  });
}

/**
 * Executa o pipeline de forma síncrona quando o context (N1.1) já foi construído e fornecido.
 * 
 * @param {Object} input - Objeto de entrada contendo { context, foodCatalog, policies, options }
 * @returns {Readonly<Object>} PrescriptionPipelineResultDTO imutável
 */
function executePrescriptionPipelineSync(input) {
  const inputValidation = validateOrchestratorInput(input);
  if (!inputValidation.isValid) {
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: 'ORCHESTRATOR_INPUT_VALIDATION',
      blockingReasons: inputValidation.errors,
      pipelineTrace: [{
        step: 'INPUT_VALIDATION',
        status: ORCHESTRATOR_STATUS.BLOCKED,
        blockingReasons: inputValidation.errors,
        details: 'Falha na validação dos parâmetros de entrada do orquestrador.'
      }]
    });
  }

  if (!input.context || typeof input.context !== 'object') {
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: 'ORCHESTRATOR_INPUT_VALIDATION',
      blockingReasons: ['executePrescriptionPipelineSync exige a passagem de "context" resolvido.'],
      pipelineTrace: [{
        step: 'INPUT_VALIDATION',
        status: ORCHESTRATOR_STATUS.BLOCKED,
        blockingReasons: ['executePrescriptionPipelineSync exige a passagem de "context" resolvido.'],
        details: 'Contexto ausente para execução síncrona.'
      }]
    });
  }

  // Clonagem defensiva pura para assegurar que inputs nunca sofram mutações externas
  const safeContext = cloneDeepPure(input.context);
  const safeCatalog = Array.isArray(input.foodCatalog) ? cloneDeepPure(input.foodCatalog) : [];
  const safePolicies = (input.policies && typeof input.policies === 'object') ? { ...input.policies } : {};
  const safeOptions = (input.options && typeof input.options === 'object') ? { ...input.options } : {};

  return executePipelineCore(safeContext, safeCatalog, safePolicies, safeOptions);
}

/**
 * Executa o pipeline determinístico completo.
 * Suporta tanto a passagem de `context` pré-construído quanto a resolução via `patientId` + `stores`.
 * 
 * @param {Object} input - Objeto de entrada { context, patientId, stores, foodCatalog, policies, options }
 * @returns {Promise<Readonly<Object>>} PrescriptionPipelineResultDTO imutável
 */
async function executePrescriptionPipeline(input) {
  const inputValidation = validateOrchestratorInput(input);
  if (!inputValidation.isValid) {
    return buildPipelineOutput({
      success: false,
      status: ORCHESTRATOR_STATUS.BLOCKED,
      interruptedAt: 'ORCHESTRATOR_INPUT_VALIDATION',
      blockingReasons: inputValidation.errors,
      pipelineTrace: [{
        step: 'INPUT_VALIDATION',
        status: ORCHESTRATOR_STATUS.BLOCKED,
        blockingReasons: inputValidation.errors,
        details: 'Falha na validação dos parâmetros de entrada do orquestrador.'
      }]
    });
  }

  // Cópia defensiva pura
  const safeInput = cloneDeepPure(input);
  let resolvedContext = safeInput.context;

  if (!resolvedContext) {
    try {
      resolvedContext = await buildNutritionPrescriptionContext(safeInput.patientId, {
        stores: safeInput.stores
      });
    } catch (err) {
      const reasons = [err.message || 'Erro ao construir contexto canônico N1.1 via stores.'];
      return buildPipelineOutput({
        success: false,
        status: ORCHESTRATOR_STATUS.BLOCKED,
        interruptedAt: PIPELINE_STEP.N11_CONTEXT,
        blockingReasons: reasons,
        pipelineTrace: [{
          step: PIPELINE_STEP.N11_CONTEXT,
          status: ORCHESTRATOR_STATUS.BLOCKED,
          blockingReasons: reasons,
          details: reasons[0]
        }]
      });
    }
  }

  const safeCatalog = Array.isArray(safeInput.foodCatalog) ? safeInput.foodCatalog : [];
  const safePolicies = safeInput.policies || {};
  const safeOptions = safeInput.options || {};

  return executePipelineCore(resolvedContext, safeCatalog, safePolicies, safeOptions);
}

module.exports = {
  PIPELINE_STEP,
  ORCHESTRATOR_STATUS,
  validateOrchestratorInput,
  executePrescriptionPipelineSync,
  executePrescriptionPipeline,
  deepFreeze,
  cloneDeepPure
};
