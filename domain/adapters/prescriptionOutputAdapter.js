/**
 * domain/adapters/prescriptionOutputAdapter.js
 * 
 * Adaptador Canônico de Saída da Prescrição Nutricional — NutriAx Pro.
 * Fase N3.7.2 — Camada de Tradução Pura do Pipeline Canônico para o Runtime.
 * 
 * Regras Obrigatórias de Governança e Pureza:
 * 1. PUREZA ABSOLUTA: Zero DOM, zero window/document, zero Dexie/Firebase, zero Gemini,
 *    zero Date.now(), zero Math.random(), zero I/O de rede ou disco.
 * 2. DETERMINISMO ESTÓICO: Mesma entrada canônica -> mesma saída adaptada idêntica.
 * 3. ZERO RECALCULO / ZERO REBALANCEAMENTO:
 *    O adaptador de saída NÃO corrige, NÃO rebalanceia, NÃO recalcula,
 *    NÃO substitui alimentos, NÃO altera horários, NÃO altera macros e
 *    NÃO modifica o status N3.6. Somente traduz estruturas.
 * 4. DETERMINISMO DE IDENTIFICADORES:
 *    IDs de itens são estritamente derivados de `${meal.mealId}_item_${item.foodId || index + 1}`.
 * 5. SEPARAÇÃO DE TEMPO:
 *    Timestamps (generatedAt, validatedAt) são recebidos via options (fornecidos pelo runtime),
 *    NUNCA gerados dentro deste módulo puro.
 * 6. SOBERANIA N3.6:
 *    O status canônico é PASS | WARNING | BLOCKED.
 *    validationVerdict é derivado estritamente de N3.6.status como alias de leitura,
 *    nunca como fonte paralela de autoridade.
 */

'use strict';

/**
 * Formata minutos inteiros (0..1439) para string no padrão "HH:MM".
 * Função pura e determinística.
 * 
 * @param {number} minutes 
 * @returns {string} "HH:MM"
 */
function formatMinutesToTimeString(minutes) {
  if (minutes == null || !Number.isFinite(minutes)) return '12:00';
  const totalMins = Math.round(minutes) % 1440;
  const normalized = totalMins < 0 ? totalMins + 1440 : totalMins;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Extrai o horário canônico da refeição em formato texto "HH:MM".
 * 
 * @param {Object} meal 
 * @returns {string}
 */
function resolveMealTimeString(meal) {
  if (!meal || typeof meal !== 'object') return '12:00';
  if (typeof meal.scheduledTime === 'string' && /^\d{1,2}:\d{2}$/.test(meal.scheduledTime.trim())) {
    return meal.scheduledTime.trim();
  }
  if (typeof meal.targetTime === 'string' && /^\d{1,2}:\d{2}$/.test(meal.targetTime.trim())) {
    return meal.targetTime.trim();
  }
  if (Number.isFinite(meal.scheduledTimeMinutes)) {
    return formatMinutesToTimeString(meal.scheduledTimeMinutes);
  }
  if (Number.isFinite(meal.targetTimeMinutes)) {
    return formatMinutesToTimeString(meal.targetTimeMinutes);
  }
  if (meal.timeWindow && typeof meal.timeWindow.start === 'string') {
    return meal.timeWindow.start;
  }
  return '12:00';
}

const STANDARD_CLINICAL_MEAL_NAMES = {
  1: ['Refeição Principal'],
  2: ['Almoço', 'Jantar'],
  3: ['Café da manhã', 'Almoço', 'Jantar'],
  4: ['Café da manhã', 'Almoço', 'Pré-treino', 'Jantar'],
  5: ['Café da manhã', 'Lanche manhã', 'Almoço', 'Pré-treino', 'Jantar'],
  6: ['Café da manhã', 'Lanche manhã', 'Almoço', 'Pré-treino', 'Pós-treino', 'Jantar'],
  7: ['Café da manhã', 'Lanche manhã', 'Almoço', 'Pré-treino', 'Pós-treino', 'Jantar', 'Ceia'],
  8: ['Café da manhã', 'Lanche manhã', 'Almoço', 'Lanche tarde', 'Pré-treino', 'Pós-treino', 'Jantar', 'Ceia']
};

/**
 * Resolve o nome clínico da refeição para a camada de visualização e runtime.
 * Se meal.mealName já for clínico (ex: 'Café da Manhã', 'Almoço', 'Ceia'), preserva-o.
 * Se for genérico ('Refeição 1', 'Refeição 2', etc.) ou indefinido, mapeia para o nome clínico
 * correspondente ao índice e ao total de refeições do plano.
 * 
 * @param {Object} meal 
 * @param {number} mealIdx 
 * @param {number} totalMeals 
 * @returns {string}
 */
function resolveClinicalMealName(meal, mealIdx, totalMeals) {
  if (meal && typeof meal.mealName === 'string') {
    const trimmed = meal.mealName.trim();
    if (trimmed && !/^Refeição(\s*\d+)?$/i.test(trimmed) && !/^Meal(\s*\d+)?$/i.test(trimmed)) {
      return trimmed;
    }
  }

  const count = Number(totalMeals) || 1;
  const standardList = STANDARD_CLINICAL_MEAL_NAMES[count];
  if (standardList && standardList[mealIdx]) {
    return standardList[mealIdx];
  }

  return meal?.mealName || `Refeição ${mealIdx + 1}`;
}

/**
 * Traduz os itens de refeição canônicos para o array linear currentPrescriptionItems do runtime.
 * Pura tradução estrutural — preserva calorias, proteínas, carboidratos, lipidios, fibras e sódio.
 * Fornece tanto 'lipid' quanto 'fat' para compatibilidade com os diferentes consumidores legados.
 * 
 * @param {Array<Object>} meals - Refeições do resultado canônico N3.4 ou N3.3
 * @returns {Array<Object>} Lista de itens desnormalizados para o runtime
 */
function adaptCanonicalMealsToRuntimeItems(meals) {
  if (!Array.isArray(meals) || meals.length === 0) return [];

  const runtimeItems = [];
  const totalMeals = meals.length;

  meals.forEach((meal, mealIdx) => {
    const mealId = meal.mealId || `meal_${mealIdx + 1}`;
    const mealName = resolveClinicalMealName(meal, mealIdx, totalMeals);
    const mealTime = resolveMealTimeString(meal);
    const mealRole = meal.mealRole || 'PRIMARY';

    const items = Array.isArray(meal.items) ? meal.items : [];
    items.forEach((item, itemIdx) => {
      const foodId = String(item.foodId || `food_${itemIdx + 1}`).trim();
      const foodName = String(item.foodName || 'Alimento').trim();
      const quantity = Number(item.grams || item.portionGrams || 100);

      // Nutrientes escalados da refeição canônica
      const cal = Number(item.nutrients?.calories ?? 0);
      const prot = Number(item.nutrients?.protein ?? 0);
      const carb = Number(item.nutrients?.carbohydrate ?? 0);
      const lipidVal = item.nutrients?.lipid != null
        ? Number(item.nutrients.lipid)
        : (item.nutrients?.fat != null ? Number(item.nutrients.fat) : 0);
      const fatVal = item.nutrients?.fat != null
        ? Number(item.nutrients.fat)
        : (item.nutrients?.lipid != null ? Number(item.nutrients.lipid) : 0);
      const fib = Number(item.nutrients?.fiber ?? 0);
      const sod = Number(item.nutrients?.sodium ?? 0);

      // Identificador de item determinístico estável
      const itemId = `${mealId}_item_${foodId}`;

      const runtimeItem = {
        id: itemId,
        foodId,
        foodName,
        mealName,
        mealTime,
        mealRole,
        quantity,
        unit: item.unit || 'g',
        unitDisplay: `${quantity}g`,
        baseQuantity: 100,
        baseUnit: 'g',
        calories: cal,
        kcal: cal,
        protein: prot,
        carbohydrate: carb,
        carb: carb,
        lipid: lipidVal, // GAP 9: campo centesimal padrão para renderPrescriptionTotals
        fat: fatVal,     // GAP 9: campo alias canônico para o Patient App
        fiber: fib,
        sodium: sod,
        sourceMealSolution: item.sourceMealSolution || 'CANONICAL_SOLVER',
        allocationRatio: item.allocationRatio ?? 1.0
      };

      runtimeItems.push(Object.freeze(runtimeItem));
    });
  });

  return runtimeItems;
}

/**
 * Computa um fingerprint determinístico e canônico do conteúdo clínico da prescrição.
 * 
 * Invariantes de Pureza e Segurança:
 * - 100% puro e determinístico (sem Date.now, sem Math.random, sem I/O, sem DOM, sem storage);
 * - Normaliza e canoniciza campos clinicamente relevantes: foodId, foodName, quantity, unit, mealName/mealId, mealTime;
 * - Independente da ordem dos itens;
 * - Sensível a alterações de quantidade, unidade, refeição, horário e substituição de alimento.
 * 
 * @param {Array<Object>} items - Array de itens da prescrição
 * @returns {string} Fingerprint canônico formatado (ex: "cfp_xxxxxxxxxxxxxxxx")
 */
function computePrescriptionContentFingerprint(items) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return 'cfp_empty_0000000000000000';
  }

  const normalizedTokens = items.map((item) => {
    const foodId = String(item.foodId || item.id || '').trim().toLowerCase();
    const foodName = String(item.foodName || item.name || '').trim().toLowerCase();
    const qty = Number(Number(item.quantity || 0).toFixed(2));
    const unit = String(item.unit || item.baseUnit || 'g').trim().toLowerCase();
    const meal = String(item.mealName || item.mealId || '').trim().toLowerCase();
    const time = String(item.mealTime || '').trim();
    return `${meal}@${time}:${foodId}#${foodName}@${qty}${unit}`;
  });

  normalizedTokens.sort();
  const canonicalString = normalizedTokens.join('|');

  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < canonicalString.length; i++) {
    const ch = canonicalString.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ (ch + i), 0x5bd1e995);
  }

  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `cfp_${p1}${p2}`;
}

/**
 * Traduz o resultado do pipeline canônico N3.7.1 para a estrutura de metadados do runtime.
 * 
 * @param {Object} pipelineResult - PrescriptionPipelineResultDTO
 * @param {Object} [options] - Opções externas { generatedAt, validatedAt, isClinicallyValidated, isStale, staleReason, validatedContentFingerprint, runtimeItems }
 * @returns {Readonly<Object>} currentPrescriptionMeta
 */
function adaptCanonicalMetaToRuntimeMeta(pipelineResult, options = {}) {
  const status = pipelineResult?.status || 'BLOCKED';
  const globalRes = pipelineResult?.globalValidationResult || {};

  const validatedFingerprint = options.validatedContentFingerprint ||
    (Array.isArray(options.runtimeItems) && options.runtimeItems.length > 0
      ? computePrescriptionContentFingerprint(options.runtimeItems)
      : null);

  const validationReport = {
    status,
    valid: globalRes.valid === true,
    validationScore: globalRes.validationScore ?? null,
    blockingReasons: Array.isArray(pipelineResult?.blockingReasons) ? [...pipelineResult.blockingReasons] : [],
    warnings: Array.isArray(pipelineResult?.warnings) ? [...pipelineResult.warnings] : [],
    gateResults: Array.isArray(globalRes.gateResults) ? [...globalRes.gateResults] : [],
    interruptedAt: pipelineResult?.interruptedAt || null,
    validatedContentFingerprint: validatedFingerprint
  };

  const energyTarget = pipelineResult?.energyTargetResult || options.energyTargetResult || null;
  const macroTarget = pipelineResult?.macroTargetResult || options.macroTargetResult || null;
  const targetValidation = pipelineResult?.nutritionValidatorResult || pipelineResult?.targetValidationResult || options.targetValidationResult || null;

  const targets = Object.freeze({
    tmbKcal: energyTarget?.tmbKcal ?? options.targets?.tmbKcal ?? null,
    getKcal: energyTarget?.getKcal ?? options.targets?.getKcal ?? null,
    caloricTargetKcal: energyTarget?.caloricTargetKcal ?? options.targets?.caloricTargetKcal ?? null,
    proteinTargetG: macroTarget?.proteinTargetG ?? options.targets?.proteinTargetG ?? null,
    carbohydrateTargetG: macroTarget?.carbohydrateTargetG ?? options.targets?.carbohydrateTargetG ?? null,
    fatTargetG: macroTarget?.fatTargetG ?? options.targets?.fatTargetG ?? null,
    fiberTargetG: macroTarget?.fiberTargetG ?? options.targets?.fiberTargetG ?? null,
    energyTargetResult: energyTarget ? Object.freeze({ ...energyTarget }) : (options.targets?.energyTargetResult || null),
    macroTargetResult: macroTarget ? Object.freeze({ ...macroTarget }) : (options.targets?.macroTargetResult || null),
    targetValidationResult: targetValidation ? Object.freeze({ ...targetValidation }) : (options.targets?.targetValidationResult || null)
  });

  const meta = {
    isAIGenerated: true,
    // Validação clínica: somente se explicitamente aprovado (WARNING ou PASS não são aprovados automaticamente)
    isClinicallyValidated: options.isClinicallyValidated === true,
    isStale: options.isStale === true,
    staleReason: options.staleReason || null,
    generatedAt: options.generatedAt || null,
    validatedAt: options.validatedAt || null,
    // Status canônico N3.6 soberano
    validationStatus: status,
    validationScore: globalRes.validationScore ?? null,
    // Alias de leitura para o runtime legado (sempre derivado de N3.6.status, nunca autoridade concorrente)
    validationVerdict: status,
    validationReport,
    validatedContentFingerprint: validatedFingerprint,
    pipelineTrace: Array.isArray(pipelineResult?.pipelineTrace) ? [...pipelineResult.pipelineTrace] : [],
    provenance: pipelineResult?.context?.provenance || null,
    orchestratorVersion: pipelineResult?.orchestratorVersion || 'N3.7.1',
    // Metas Canônicas N2.1 e N2.2 persistidas e auditáveis
    targets,
    tmbKcal: targets.tmbKcal,
    getKcal: targets.getKcal,
    caloricTargetKcal: targets.caloricTargetKcal,
    proteinTargetG: targets.proteinTargetG,
    carbohydrateTargetG: targets.carbohydrateTargetG,
    fatTargetG: targets.fatTargetG,
    fiberTargetG: targets.fiberTargetG
  };

  return Object.freeze(meta);
}

/**
 * Adaptador completo de saída: converte o resultado do orquestrador canônico N3.7.1
 * para o par { items, meta, targets } consumível diretamente pelo runtime e persistível no Dexie.
 * 
 * @param {Object} pipelineResult - PrescriptionPipelineResultDTO produzido pelo orquestrador
 * @param {Object} [options] - Opções externas { generatedAt, validatedAt, isClinicallyValidated, isStale, staleReason }
 * @returns {{ items: Array<Object>, meta: Readonly<Object>, targets: Readonly<Object>, status: string, isCompliant: boolean }}
 */
function adaptPrescriptionPipelineOutput(pipelineResult, options = {}) {
  if (!pipelineResult || typeof pipelineResult !== 'object') {
    const emptyTargets = Object.freeze({
      tmbKcal: null,
      getKcal: null,
      caloricTargetKcal: null,
      proteinTargetG: null,
      carbohydrateTargetG: null,
      fatTargetG: null,
      fiberTargetG: null,
      energyTargetResult: null,
      macroTargetResult: null,
      targetValidationResult: null
    });

    return {
      items: [],
      meta: Object.freeze({
        isAIGenerated: true,
        isClinicallyValidated: false,
        isStale: false,
        staleReason: null,
        generatedAt: options.generatedAt || null,
        validatedAt: null,
        validationStatus: 'BLOCKED',
        validationVerdict: 'BLOCKED',
        validationReport: {
          status: 'BLOCKED',
          valid: false,
          blockingReasons: ['Resultado do pipeline canônico nulo ou inválido.'],
          warnings: [],
          validatedContentFingerprint: null
        },
        validatedContentFingerprint: null,
        targets: emptyTargets,
        tmbKcal: null,
        getKcal: null,
        caloricTargetKcal: null,
        proteinTargetG: null,
        carbohydrateTargetG: null,
        fatTargetG: null,
        fiberTargetG: null
      }),
      targets: emptyTargets,
      status: 'BLOCKED',
      isCompliant: false
    };
  }

  // Refeições resolvidas pelo N3.4 (Meal Timing) ou N3.3 (Meal Assembly)
  const canonicalMeals = pipelineResult.mealTimingResult?.meals ||
                         pipelineResult.mealTimingResult?.scheduledMeals ||
                         pipelineResult.mealAssemblyResult?.meals ||
                         [];

  const items = adaptCanonicalMealsToRuntimeItems(canonicalMeals);
  const meta = adaptCanonicalMetaToRuntimeMeta(pipelineResult, {
    ...options,
    runtimeItems: items
  });

  const status = pipelineResult.status || 'BLOCKED';
  const isCompliant = status !== 'BLOCKED' && (pipelineResult.globalValidationResult?.valid === true);

  return {
    items,
    meta,
    targets: meta.targets,
    status,
    isCompliant
  };
}

// Suporte a CommonJS e navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatMinutesToTimeString,
    resolveMealTimeString,
    resolveClinicalMealName,
    STANDARD_CLINICAL_MEAL_NAMES,
    computePrescriptionContentFingerprint,
    adaptCanonicalMealsToRuntimeItems,
    adaptCanonicalMetaToRuntimeMeta,
    adaptPrescriptionPipelineOutput
  };
}

if (typeof globalThis !== 'undefined') {
  globalThis.NutriDomain = globalThis.NutriDomain || {};
  globalThis.NutriDomain.prescriptionOutputAdapter = {
    formatMinutesToTimeString,
    resolveMealTimeString,
    resolveClinicalMealName,
    STANDARD_CLINICAL_MEAL_NAMES,
    computePrescriptionContentFingerprint,
    adaptCanonicalMealsToRuntimeItems,
    adaptCanonicalMetaToRuntimeMeta,
    adaptPrescriptionPipelineOutput
  };
}
