/**
 * domain/contracts/FoodSolverContract.js
 * 
 * Contrato Canônico de Alimentos e Especificação de I/O do Food Solver — NutriAx Pro.
 * Fase N3.1 — Auditoria Estrutural e Especificação de Contrato Canônico (Revisada).
 * 
 * Camada Pura — Zero DOM, Zero Dexie/Firebase, Zero Gemini, Zero Algoritmo de Solver.
 * 
 * Princípios Arquiteturais (Fase N3.1):
 * 1. PUREZA ABSOLUTA: Funções puras de validação e normalização de contratos.
 * 2. IMUTABILIDADE: Objetos retornados são profundamente congelados (deepFreeze).
 * 3. IDENTIDADE CANÔNICA: O identificador único (id / foodId) é a chave primária estrita. foodName NÃO é chave.
 * 4. FONTE ÚNICA DE CONTEXTO: NutritionPrescriptionContextDTO (N1.1) é a fonte de verdade soberana.
 *    Preferências e restrições operacionais são projeções diretas dele, nunca uma fonte independente.
 * 5. PORTÃO ESTRITO: O solver só aceita execuções com validationResult.valid === true (Fase N2.3).
 * 6. POLÍTICA DE UNIDADES: Massa direta (g), volume (ml requer densidade formal, sem assumir 1ml=1g).
 * 7. MEDIDAS CASEIRAS: Solver automático exige conversão específica; fallbacks genéricos são inelegíveis.
 * 8. PRECISÃO MATEMÁTICA: Ponto flutuante contínuo no solver interno; arredondamento apenas na saída final.
 */

/**
 * Congelamento profundo e recursivo de objetos
 * @param {any} obj 
 * @returns {any}
 */
function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = obj[prop];
    if (value !== null && (typeof value === 'object' || typeof value === 'function') && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });
  return obj;
}

/**
 * Versão da especificação do contrato da Fase N3.1
 */
const FOOD_SOLVER_CONTRACT_VERSION = '1.0.0';

/**
 * Status possíveis de execução do Solver
 */
const SOLVER_STATUS = Object.freeze({
  PASS: 'PASS',
  WARNING: 'WARNING',
  NO_SOLUTION: 'NO_SOLUTION',
  BLOCKED: 'BLOCKED'
});

/**
 * Classificação bromatológica centesimal de energia no catálogo
 * Documentação analítica dos estados:
 * - CONSISTENTE: Discrepância Atwater <= 5% em relação ao rótulo/tabela original.
 * - REVISAR: Discrepância Atwater entre 5% e 10%.
 * - INCONSISTENTE: Discrepância Atwater > 10% nos dados de origem (TBCA/TACO).
 * (Nota: Estes status são documentados para governança. A política de elegibilidade será definida na N3.2).
 */
const BROMATOLOGY_ENERGY_STATUS = Object.freeze({
  CONSISTENTE: 'CONSISTENTE',
  REVISAR: 'REVISAR',
  INCONSISTENTE: 'INCONSISTENTE'
});

/**
 * Fontes conhecidas de alimentos
 */
const FOOD_SOURCES = Object.freeze({
  TACO: 'TACO',
  TBCA: 'TBCA',
  COMMERCIAL: 'Rótulo Comercial',
  CUSTOM: 'Custom',
  MANUAL: 'Manual'
});

/**
 * Tipos de unidades e políticas formais de conversão para o Solver
 */
const UNIT_CONVERSION_POLICY = Object.freeze({
  // Massa direta: g e kg têm conversão direta trivial para gramas
  MASS_UNITS: Object.freeze(['g', 'kg']),
  
  // Volume: ml e l representam volume. NÃO se deve assumir 1 ml = 1 g universalmente.
  // Conversão volume -> massa requer densidade específica formal (rho em g/ml).
  VOLUME_UNITS: Object.freeze(['ml', 'l']),

  // Política para medidas caseiras no Solver Automático:
  // 1. gramPerUnit específico do alimento
  // 2. foodUnitWeights específico do alimento
  // 3. outra conversão formal específica disponível
  // 4. ausência de conversão específica -> unidade NÃO elegível para o solver automático
  // (Fallbacks genéricos da UI manual são expressamente NÃO preferenciais para o solver).
  HOUSEHOLD_SOLVER_ELIGIBILITY: Object.freeze({
    REQUIRE_SPECIFIC_CONVERSION: true,
    ALLOW_GENERIC_FALLBACK: false
  })
});

/**
 * Política de Precisão Numérica
 */
const PRECISION_POLICY = Object.freeze({
  // Precisão interna do algoritmo de otimização: ponto flutuante contínuo de 64 bits (IEEE 754)
  SOLVER_INTERNAL: 'IEEE_754_FLOAT64_CONTINUOUS',
  
  // Precisão de exibição e prescrição na UI: arredondamento na saída final
  PRESCRIPTION_UI_MASS: 'INTEGER_OR_ONE_DECIMAL', // ex: 150g ou 150.5g
  PRESCRIPTION_UI_MACROS: 'TWO_DECIMALS'          // conforme calculateMacroPortion()
});

/**
 * Valida a conformidade estrutural de um alimento com o Contrato Canônico de Alimentos (CanonicalFoodDTO)
 * 
 * Regras de Obrigatoriedade:
 * - REQUIRED: id (string não-vazia), name (string não-vazia), baseQuantity (number > 0),
 *             unit (string não-vazia), calories (number >= 0, finito), protein (number >= 0, finito),
 *             carbohydrate (number >= 0, finito), lipid (number >= 0, finito).
 * - OPTIONAL: category, source, brand, prepState, gramPerUnit, density, fiber, sodium, bromatology.
 * - INVALID: valores negativos, NaN, Infinity, tipos incompatíveis.
 * 
 * @param {Object} food 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateCanonicalFoodDTO(food) {
  const errors = [];

  if (!food || typeof food !== 'object' || Array.isArray(food)) {
    return { isValid: false, errors: ['O registro de alimento deve ser um objeto válido e não-nulo.'] };
  }

  // 1. Identidade e Denominação (REQUIRED)
  // foodId é a chave primária operacional obrigatória. foodName NÃO pode ser chave primária.
  const foodId = food.id || food.foodId;
  if (!foodId || typeof foodId !== 'string' || foodId.trim() === '') {
    errors.push('id (ou foodId) é obrigatório e deve ser uma string não-vazia.');
  }

  const foodName = food.name || food.foodName;
  if (!foodName || typeof foodName !== 'string' || foodName.trim() === '') {
    errors.push('name (ou foodName) é obrigatório e deve ser uma string não-vazia.');
  }

  // 2. Base e Unidade (REQUIRED)
  const baseQty = food.baseQuantity !== undefined ? food.baseQuantity : 100;
  if (typeof baseQty !== 'number' || !Number.isFinite(baseQty) || baseQty <= 0) {
    errors.push('baseQuantity deve ser um número finito positivo (geralmente 100).');
  }

  const unit = food.unit || food.baseUnit;
  if (!unit || typeof unit !== 'string' || unit.trim() === '') {
    errors.push('unit (ou baseUnit) é obrigatório e deve ser uma string não-vazia (ex: "g" ou "ml").');
  }

  // 3. Macronutrientes e Calorias (REQUIRED)
  const calories = food.calories !== undefined ? food.calories : food.kcalPer100;
  if (typeof calories !== 'number' || !Number.isFinite(calories) || calories < 0) {
    errors.push('calories (ou kcalPer100) é obrigatório, numérico finito e >= 0.');
  }

  const protein = food.protein !== undefined ? food.protein : food.protPer100;
  if (typeof protein !== 'number' || !Number.isFinite(protein) || protein < 0) {
    errors.push('protein (ou protPer100) é obrigatório, numérico finito e >= 0.');
  }

  const carbohydrate = food.carbohydrate !== undefined ? food.carbohydrate : food.carbPer100;
  if (typeof carbohydrate !== 'number' || !Number.isFinite(carbohydrate) || carbohydrate < 0) {
    errors.push('carbohydrate (ou carbPer100) é obrigatório, numérico finito e >= 0.');
  }

  const lipid = food.lipid !== undefined ? food.lipid : (food.lipPer100 !== undefined ? food.lipPer100 : food.lipidPer100);
  if (typeof lipid !== 'number' || !Number.isFinite(lipid) || lipid < 0) {
    errors.push('lipid (ou lipidPer100 / lipPer100) é obrigatório, numérico finito e >= 0.');
  }

  // 4. Campos Opcionais / Especiais
  // gramPerUnit
  if (food.gramPerUnit !== undefined && food.gramPerUnit !== null) {
    if (typeof food.gramPerUnit !== 'number' || !Number.isFinite(food.gramPerUnit) || food.gramPerUnit <= 0) {
      errors.push('gramPerUnit, quando fornecido, deve ser um número finito positivo.');
    }
  }

  // density (g/ml para conversão de volume)
  if (food.density !== undefined && food.density !== null) {
    if (typeof food.density !== 'number' || !Number.isFinite(food.density) || food.density <= 0) {
      errors.push('density, quando fornecido, deve ser um número finito positivo representando g/ml.');
    }
  }

  // fiber
  const fiber = food.fiber !== undefined ? food.fiber : food.fiberPer100;
  if (fiber !== undefined && fiber !== null) {
    if (typeof fiber !== 'number' || !Number.isFinite(fiber) || fiber < 0) {
      errors.push('fiber, quando fornecido, deve ser um número finito >= 0.');
    }
  }

  // sodium
  const sodium = food.sodium !== undefined ? food.sodium : food.sodiumPer100;
  if (sodium !== undefined && sodium !== null) {
    if (typeof sodium !== 'number' || !Number.isFinite(sodium) || sodium < 0) {
      errors.push('sodium, quando fornecido, deve ser um número finito >= 0.');
    }
  }

  // category, source, brand, prepState
  ['category', 'source', 'brand', 'prepState'].forEach((field) => {
    if (food[field] !== undefined && food[field] !== null && typeof food[field] !== 'string') {
      errors.push(`${field}, quando fornecido, deve ser uma string ou null.`);
    }
  });

  // bromatology
  if (food.bromatology !== undefined && food.bromatology !== null) {
    if (typeof food.bromatology !== 'object' || Array.isArray(food.bromatology)) {
      errors.push('bromatology, quando fornecido, deve ser um objeto.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Cria um CanonicalFoodDTO normalizado e profundamente congelado
 * @param {Object} rawFood 
 * @returns {Object} CanonicalFoodDTO
 */
function createCanonicalFoodDTO(rawFood) {
  const validation = validateCanonicalFoodDTO(rawFood);
  if (!validation.isValid) {
    throw new Error(`Dados inválidos para CanonicalFoodDTO: ${validation.errors.join('; ')}`);
  }

  const foodId = String(rawFood.id || rawFood.foodId).trim();
  const isCustom = foodId.startsWith('cust_') || rawFood.isCustom === true || rawFood.source === 'Custom' || rawFood.source === 'Manual';

  const calories = Number(rawFood.calories !== undefined ? rawFood.calories : rawFood.kcalPer100);
  const protein = Number(rawFood.protein !== undefined ? rawFood.protein : rawFood.protPer100);
  const carbohydrate = Number(rawFood.carbohydrate !== undefined ? rawFood.carbohydrate : rawFood.carbPer100);
  const lipid = Number(rawFood.lipid !== undefined ? rawFood.lipid : (rawFood.lipPer100 !== undefined ? rawFood.lipPer100 : rawFood.lipidPer100));

  const fiberVal = rawFood.fiber !== undefined ? rawFood.fiber : rawFood.fiberPer100;
  const fiber = fiberVal !== undefined && fiberVal !== null ? Number(fiberVal) : null;

  const sodiumVal = rawFood.sodium !== undefined ? rawFood.sodium : rawFood.sodiumPer100;
  const sodium = sodiumVal !== undefined && sodiumVal !== null ? Number(sodiumVal) : null;

  const gramPerUnit = rawFood.gramPerUnit !== undefined && rawFood.gramPerUnit !== null ? Number(rawFood.gramPerUnit) : null;
  const density = rawFood.density !== undefined && rawFood.density !== null ? Number(rawFood.density) : null;

  const dto = {
    id: foodId,
    name: String(rawFood.name || rawFood.foodName).trim(),
    category: rawFood.category ? String(rawFood.category).trim() : null,
    source: rawFood.source ? String(rawFood.source).trim() : (isCustom ? 'Custom' : null),
    brand: rawFood.brand ? String(rawFood.brand).trim() : null,
    prepState: rawFood.prepState ? String(rawFood.prepState).trim() : null,
    baseQuantity: rawFood.baseQuantity !== undefined ? Number(rawFood.baseQuantity) : 100,
    unit: String(rawFood.unit || rawFood.baseUnit || 'g').trim(),
    gramPerUnit,
    density,
    calories,
    protein,
    carbohydrate,
    lipid,
    fiber,
    sodium,
    isCustom,
    bromatology: rawFood.bromatology ? { ...rawFood.bromatology } : null
  };

  return deepFreeze(dto);
}

/**
 * Valida o Contrato de Entrada do Food Solver (FoodSolverInputDTO)
 * 
 * Regras Canônicas de Governança:
 * 1. context: OBRIGATÓRIO (NutritionPrescriptionContextDTO). É a ÚNICA fonte de verdade clínica e nutricional.
 * 2. energyTarget: OBRIGATÓRIO (resultado da Fase N2.1).
 * 3. macroTarget: OBRIGATÓRIO (resultado da Fase N2.2).
 * 4. validationResult: OBRIGATÓRIO (resultado da Fase N2.3). Se valid !== true, o solver é BLOQUEADO.
 * 5. foodCatalog: OBRIGATÓRIO (catálogo de alimentos operacionais de db.foods). Array não-vazio ou repositório.
 * 6. options: Opcional. Opções operacionais de execução do algoritmo (ex: mealCount).
 *    Avisos de governança: constraints e preferences não podem contradizer o context canônico.
 * 
 * @param {Object} input 
 * @returns {{ isValid: boolean, isBlocked: boolean, errors: string[] }}
 */
function validateFoodSolverInput(input) {
  const errors = [];
  let isBlocked = false;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { isValid: false, isBlocked: true, errors: ['Input do Solver deve ser um objeto válido e não-nulo.'] };
  }

  // 1. Contexto Canônico (N1.1) — FONTE ÚNICA DE VERDADE CLÍNICA
  if (!input.context || typeof input.context !== 'object' || Array.isArray(input.context)) {
    errors.push('context é obrigatório e deve ser um objeto NutritionPrescriptionContextDTO válido (fonte única de verdade clínica).');
    isBlocked = true;
  }

  // 2. Meta Energética (N2.1)
  if (!input.energyTarget || typeof input.energyTarget !== 'object') {
    errors.push('energyTarget é obrigatório (resultado determinístico da Fase N2.1).');
    isBlocked = true;
  } else {
    const kcal = input.energyTarget.caloricTargetKcal;
    if (typeof kcal !== 'number' || !Number.isFinite(kcal) || kcal <= 0) {
      errors.push('energyTarget.caloricTargetKcal deve ser um número finito positivo.');
      isBlocked = true;
    }
  }

  // 3. Metas de Macros (N2.2)
  if (!input.macroTarget || typeof input.macroTarget !== 'object') {
    errors.push('macroTarget é obrigatório (resultado determinístico da Fase N2.2).');
    isBlocked = true;
  } else {
    const { proteinTargetG, carbohydrateTargetG, fatTargetG } = input.macroTarget;
    if (typeof proteinTargetG !== 'number' || !Number.isFinite(proteinTargetG) || proteinTargetG < 0) {
      errors.push('macroTarget.proteinTargetG deve ser um número finito >= 0.');
      isBlocked = true;
    }
    if (typeof carbohydrateTargetG !== 'number' || !Number.isFinite(carbohydrateTargetG) || carbohydrateTargetG < 0) {
      errors.push('macroTarget.carbohydrateTargetG deve ser um número finito >= 0.');
      isBlocked = true;
    }
    if (typeof fatTargetG !== 'number' || !Number.isFinite(fatTargetG) || fatTargetG < 0) {
      errors.push('macroTarget.fatTargetG deve ser um número finito >= 0.');
      isBlocked = true;
    }
  }

  // 4. Validador Prévio (N2.3) — PORTÃO DE SEGURANÇA ABSOLUTO
  if (!input.validationResult || typeof input.validationResult !== 'object') {
    errors.push('validationResult é obrigatório (resultado do validador prévio da Fase N2.3).');
    isBlocked = true;
  } else if (input.validationResult.valid !== true) {
    errors.push('O validador prévio (N2.3) deve possuir status valid === true para autorizar o Food Solver.');
    isBlocked = true;
  }

  // 5. Catálogo Operacional
  if (!input.foodCatalog) {
    errors.push('foodCatalog é obrigatório (catálogo de alimentos operacionais oriundos de db.foods).');
    isBlocked = true;
  } else if (Array.isArray(input.foodCatalog)) {
    if (input.foodCatalog.length === 0) {
      errors.push('foodCatalog fornecido como array não pode estar vazio.');
      isBlocked = true;
    }
  } else if (typeof input.foodCatalog !== 'function' && typeof input.foodCatalog !== 'object') {
    errors.push('foodCatalog deve ser um Array de alimentos ou um repositório com método de consulta.');
    isBlocked = true;
  }

  return {
    isValid: errors.length === 0,
    isBlocked,
    errors
  };
}

/**
 * Valida o Contrato de Saída do Food Solver (FoodSolverOutputDTO)
 * 
 * Regras:
 * - solverVersion: string não-vazia genérica (a versão concreta N3.2.x só é definida na implementação).
 * - status: PASS | WARNING | BLOCKED.
 * - meals: array de refeições geradas.
 * - totals, target, differences: blocos nutricionais com números finitos.
 * 
 * @param {Object} output 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateFoodSolverOutput(output) {
  const errors = [];

  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return { isValid: false, errors: ['Output do Solver deve ser um objeto válido e não-nulo.'] };
  }

  // 1. Status e Validade
  if (!output.status || !Object.values(SOLVER_STATUS).includes(output.status)) {
    errors.push(`status deve ser um dos valores: ${Object.values(SOLVER_STATUS).join(', ')}.`);
  }
  if (typeof output.valid !== 'boolean') {
    errors.push('valid deve ser um booleano.');
  }

  // 2. Refeições
  if (!Array.isArray(output.meals)) {
    errors.push('meals deve ser um array de refeições geradas.');
  }

  // 3. Totais, Metas e Diferenças
  const requiredNutritionBlocks = ['totals', 'target', 'differences'];
  requiredNutritionBlocks.forEach((block) => {
    if (!output[block] || typeof output[block] !== 'object') {
      errors.push(`${block} deve ser um objeto com valores nutricionais.`);
    } else {
      ['calories', 'protein', 'carbohydrate', 'fat'].forEach((nutrient) => {
        const val = output[block][nutrient];
        if (typeof val !== 'number' || !Number.isFinite(val)) {
          errors.push(`${block}.${nutrient} deve ser um número finito.`);
        }
      });
    }
  });

  // 4. Rastreabilidade e Diagnósticos
  if (!Array.isArray(output.foodProvenance)) {
    errors.push('foodProvenance deve ser um array de procedência de alimentos.');
  }
  if (!Array.isArray(output.solverDiagnostics)) {
    errors.push('solverDiagnostics deve ser um array de diagnósticos.');
  }
  if (!Array.isArray(output.warnings)) {
    errors.push('warnings deve ser um array de avisos.');
  }
  if (!Array.isArray(output.blockingReasons)) {
    errors.push('blockingReasons deve ser um array de motivos de bloqueio.');
  }

  // 5. Versionamento genérico (string não-vazia, sem fixar número na N3.1)
  if (!output.solverVersion || typeof output.solverVersion !== 'string' || output.solverVersion.trim() === '') {
    errors.push('solverVersion é obrigatório e deve ser uma string não-vazia informando a versão do solver.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

const FoodSolverContract = {
  CONTRACT_VERSION: FOOD_SOLVER_CONTRACT_VERSION,
  SOLVER_STATUS,
  BROMATOLOGY_ENERGY_STATUS,
  FOOD_SOURCES,
  UNIT_CONVERSION_POLICY,
  PRECISION_POLICY,
  deepFreeze,
  validateCanonicalFoodDTO,
  createCanonicalFoodDTO,
  validateFoodSolverInput,
  validateFoodSolverOutput
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FoodSolverContract;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.FoodSolverContract = FoodSolverContract;
}
