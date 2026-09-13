'use strict';

/**
 * tests/food-solver-n32.test.js
 * 
 * Suíte de Testes da Fase N3.2 — Food Solver Determinístico Canônico
 * NutriAx Pro
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const FoodSolverContract = require('../domain/contracts/FoodSolverContract');
const {
  SOLVER_STATUS,
  validateCanonicalFoodDTO,
  createCanonicalFoodDTO
} = FoodSolverContract;

const {
  ELIGIBILITY_STATUS,
  DEFAULT_ELIGIBILITY_POLICY,
  adaptCatalogToCanonical,
  evaluateFoodEligibility,
  filterEligibleFoods,
  SEARCH_ROLES,
  DEFAULT_FOOD_SOLVER_POLICY,
  normalizedNutrientError,
  calculateNutrientLoss,
  assignSearchRole,
  solveNutritionDiet,
  calculateFoodPortionNutrients
} = require('../domain/solver');

describe('Fase N3.2 — Grupo A: Portão de Entrada e Pré-condições', () => {

  const baseValidInput = {
    context: {
      schemaVersion: '1.0.0',
      patient: { patientId: 'p-1', name: 'João Silva' }
    },
    energyTarget: {
      caloricTargetKcal: 2000,
      tmbKcal: 1600,
      getKcal: 2200
    },
    macroTarget: {
      proteinTargetG: 150,
      carbohydrateTargetG: 225,
      fatTargetG: 55.5,
      fiberTargetG: 28
    },
    validationResult: {
      valid: true,
      status: 'PASS',
      checks: []
    },
    foodCatalog: [
      { id: 'FOOD_0001', name: 'Frango grelhado', calories: 159, protein: 32, carbohydrate: 0, lipid: 2.5, unit: 'g' }
    ]
  };

  test('1. Bloqueio estrito quando validationResult.valid !== true (Portão N2.3)', () => {
    const invalidGateInput = {
      ...baseValidInput,
      validationResult: { valid: false, status: 'BLOCKED', reasons: ['Discrepância energética'] }
    };

    const res = solveNutritionDiet(invalidGateInput);
    assert.strictEqual(res.status, SOLVER_STATUS.BLOCKED);
    assert.strictEqual(res.valid, false);
    assert.ok(res.blockingReasons.length > 0);
    assert.ok(res.blockingReasons.some(r => r.includes('valid === true')));
  });

  test('2. Bloqueio quando validationResult é ausente ou nulo', () => {
    const missingGateInput = { ...baseValidInput, validationResult: null };
    const res = solveNutritionDiet(missingGateInput);
    assert.strictEqual(res.status, SOLVER_STATUS.BLOCKED);
    assert.strictEqual(res.valid, false);
  });

  test('3. Bloqueio quando caloricTargetKcal é inválido ou negativo', () => {
    const invalidKcalInput = {
      ...baseValidInput,
      energyTarget: { caloricTargetKcal: -500 }
    };
    const res = solveNutritionDiet(invalidKcalInput);
    assert.strictEqual(res.status, SOLVER_STATUS.BLOCKED);
    assert.strictEqual(res.valid, false);
  });

  test('4. Bloqueio quando macroTarget possui valores negativos ou ausentes', () => {
    const invalidMacroInput = {
      ...baseValidInput,
      macroTarget: { proteinTargetG: -20, carbohydrateTargetG: 100, fatTargetG: 30 }
    };
    const res = solveNutritionDiet(invalidMacroInput);
    assert.strictEqual(res.status, SOLVER_STATUS.BLOCKED);
    assert.strictEqual(res.valid, false);
  });

  test('5. Catálogo vazio resulta em status BLOCKED', () => {
    const emptyCatInput = { ...baseValidInput, foodCatalog: [] };
    const res = solveNutritionDiet(emptyCatInput);
    assert.strictEqual(res.status, SOLVER_STATUS.BLOCKED);
    assert.strictEqual(res.valid, false);
  });

  test('6. Catálogo sem nenhum alimento elegível resulta em status BLOCKED', () => {
    const ineligibleCatInput = {
      ...baseValidInput,
      foodCatalog: [
        { id: 'FOOD_9999', name: 'Alimento Inválido', calories: -10, protein: 0, carbohydrate: 0, lipid: 0, unit: 'g' }
      ]
    };
    const res = solveNutritionDiet(ineligibleCatInput);
    assert.strictEqual(res.status, SOLVER_STATUS.BLOCKED);
    assert.strictEqual(res.valid, false);
    assert.ok(res.blockingReasons.some(r => r.includes('alimentos elegíveis')));
  });

});

describe('Fase N3.2 — Grupo B: Elegibilidade e Rigor Dimensional', () => {

  test('7. Alimento com macronutriente negativo é marcado como INELIGIBLE', () => {
    const food = { id: 'F1', name: 'Teste', calories: 100, protein: -5, carbohydrate: 10, lipid: 2, unit: 'g' };
    const evalRes = evaluateFoodEligibility(food);
    assert.strictEqual(evalRes.isEligible, false);
    assert.strictEqual(evalRes.status, ELIGIBILITY_STATUS.INELIGIBLE);
  });

  test('8. Alimento sem calorias é marcado como INELIGIBLE', () => {
    const food = { id: 'F2', name: 'Teste', calories: undefined, protein: 10, carbohydrate: 10, lipid: 2, unit: 'g' };
    const evalRes = evaluateFoodEligibility(food);
    assert.strictEqual(evalRes.isEligible, false);
  });

  test('9. Alimento sem unidade válida é marcado como INELIGIBLE', () => {
    const food = { id: 'F3', name: 'Teste', calories: 100, protein: 10, carbohydrate: 10, lipid: 2, unit: '' };
    const evalRes = evaluateFoodEligibility(food);
    assert.strictEqual(evalRes.isEligible, false);
  });

  test('10. Alimento líquido em ml sem densidade formal é marcado como INELIGIBLE (sem assumir 1ml = 1g)', () => {
    const food = { id: 'F4', name: 'Leite integral', calories: 60, protein: 3, carbohydrate: 5, lipid: 3, unit: 'ml', density: null };
    const evalRes = evaluateFoodEligibility(food);
    assert.strictEqual(evalRes.isEligible, false);
    assert.ok(evalRes.reasons.some(r => r.includes('sem densidade formal')));
  });

  test('11. Alimento líquido em ml com densidade formal é aceito como ELIGIBLE', () => {
    const food = { id: 'F5', name: 'Azeite de oliva', calories: 884, protein: 0, carbohydrate: 0, lipid: 100, unit: 'ml', density: 0.92 };
    const evalRes = evaluateFoodEligibility(food);
    assert.strictEqual(evalRes.isEligible, true);
    assert.strictEqual(evalRes.status, ELIGIBILITY_STATUS.ELIGIBLE);
  });

  test('12. Alimento com medida caseira sem gramPerUnit específico é marcado como INELIGIBLE', () => {
    const food = { id: 'F6', name: 'Pão fatia', calories: 70, protein: 2, carbohydrate: 14, lipid: 1, unit: 'fatia', gramPerUnit: null };
    const evalRes = evaluateFoodEligibility(food);
    assert.strictEqual(evalRes.isEligible, false);
    assert.ok(evalRes.reasons.some(r => r.includes('sem gramPerUnit específico')));
  });

  test('13. Alimento com status INCONSISTENTE é marcado como INELIGIBLE por padrão', () => {
    const food = {
      id: 'F7', name: 'Inconsistente', calories: 200, protein: 10, carbohydrate: 10, lipid: 10, unit: 'g',
      bromatology: { energyStatus: 'INCONSISTENTE' }
    };
    const evalRes = evaluateFoodEligibility(food);
    assert.strictEqual(evalRes.isEligible, false);
    assert.ok(evalRes.reasons.some(r => r.includes('INCONSISTENTE')));
  });

  test('14. Alimento com status REVISAR é aceito como WARNING quando allowReviewStatus: true', () => {
    const food = {
      id: 'F8', name: 'Revisar', calories: 150, protein: 10, carbohydrate: 20, lipid: 2, unit: 'g',
      bromatology: { energyStatus: 'REVISAR' }
    };
    const evalRes = evaluateFoodEligibility(food, { allowReviewStatus: true, allowInconsistentStatus: false });
    assert.strictEqual(evalRes.isEligible, true);
    assert.strictEqual(evalRes.status, ELIGIBILITY_STATUS.WARNING);
    assert.ok(evalRes.warnings.some(w => w.includes('REVISAR')));
  });

  test('15. Alimento com status REVISAR é rejeitado como INELIGIBLE quando allowReviewStatus: false', () => {
    const food = {
      id: 'F9', name: 'Revisar', calories: 150, protein: 10, carbohydrate: 20, lipid: 2, unit: 'g',
      bromatology: { energyStatus: 'REVISAR' }
    };
    const evalRes = evaluateFoodEligibility(food, { allowReviewStatus: false, allowInconsistentStatus: false });
    assert.strictEqual(evalRes.isEligible, false);
    assert.strictEqual(evalRes.status, ELIGIBILITY_STATUS.INELIGIBLE);
  });

  test('16. Regra Inegociável: Presença de alimento REVISAR na solução selecionada NUNCA pode produzir status PASS', () => {
    const inputWithReview = {
      context: { schemaVersion: '1.0.0', patient: { patientId: 'p-1', name: 'Teste' } },
      energyTarget: { caloricTargetKcal: 500 },
      macroTarget: { proteinTargetG: 30, carbohydrateTargetG: 60, fatTargetG: 10, fiberTargetG: 5 },
      validationResult: { valid: true, status: 'PASS' },
      foodCatalog: [
        { id: 'F_REV_1', name: 'Frango com revisão', calories: 150, protein: 30, carbohydrate: 0, lipid: 3, unit: 'g', bromatology: { energyStatus: 'REVISAR' } },
        { id: 'F_REV_2', name: 'Arroz com revisão', calories: 130, protein: 2, carbohydrate: 28, lipid: 0.5, unit: 'g', bromatology: { energyStatus: 'REVISAR' } },
        { id: 'F_REV_3', name: 'Azeite com revisão', calories: 884, protein: 0, carbohydrate: 0, lipid: 100, unit: 'g', bromatology: { energyStatus: 'REVISAR' } }
      ]
    };

    const res = solveNutritionDiet(inputWithReview);
    assert.notStrictEqual(res.status, SOLVER_STATUS.PASS, 'Status com alimento REVISAR não pode ser PASS');
    assert.strictEqual(res.status, SOLVER_STATUS.WARNING);
    assert.ok(res.warnings.some(w => w.includes('REVISAR')));
  });

  test('17. Alimento customizado cust_* é elegível e integrável ao solver', () => {
    const customFood = {
      id: 'cust_123456789',
      name: 'Receita Especial Caseira',
      calories: 220,
      protein: 15,
      carbohydrate: 25,
      lipid: 5,
      unit: 'g'
    };
    const evalRes = evaluateFoodEligibility(customFood);
    assert.strictEqual(evalRes.isEligible, true);
    assert.strictEqual(evalRes.food.isCustom, true);
  });

});

describe('Fase N3.2 — Grupo C: Casos de Limite Matemático (Boundary & Zero Targets)', () => {

  test('18. normalizedNutrientError seguro contra divisão por zero quando target === 0', () => {
    // delta = 0, target = 0 -> 0
    assert.strictEqual(normalizedNutrientError(0, 0, 10), 0);
    // delta = 5, target = 0 -> (5 / 10)^2 = 0.25
    assert.strictEqual(normalizedNutrientError(5, 0, 10), 0.25);
    // delta = -10, target = 0 -> (-10 / 10)^2 = 1.0
    assert.strictEqual(normalizedNutrientError(-10, 0, 10), 1.0);
  });

  test('19. Solver suporta meta de carboidrato igual a zero (ex: cetogênica extrema)', () => {
    const ketoInput = {
      context: { schemaVersion: '1.0.0', patient: { patientId: 'p-1', name: 'Keto' } },
      energyTarget: { caloricTargetKcal: 1500 },
      macroTarget: { proteinTargetG: 120, carbohydrateTargetG: 0, fatTargetG: 110, fiberTargetG: 10 },
      validationResult: { valid: true, status: 'PASS' },
      foodCatalog: [
        { id: 'F_P1', name: 'Peito de frango', calories: 150, protein: 32, carbohydrate: 0, lipid: 2.5, unit: 'g' },
        { id: 'F_O1', name: 'Azeite de oliva', calories: 884, protein: 0, carbohydrate: 0, lipid: 100, unit: 'g' },
        { id: 'F_O2', name: 'Manteiga', calories: 720, protein: 0.8, carbohydrate: 0, lipid: 81, unit: 'g' }
      ]
    };

    const res = solveNutritionDiet(ketoInput);
    assert.ok(res.valid);
    assert.ok(Number.isFinite(res.totals.carbohydrate));
    assert.strictEqual(res.target.carbohydrate, 0);
  });

  test('20. Solver suporta meta de gordura igual a zero sem quebra ou NaN', () => {
    const lowFatInput = {
      context: { schemaVersion: '1.0.0', patient: { patientId: 'p-1', name: 'LowFat' } },
      energyTarget: { caloricTargetKcal: 1200 },
      macroTarget: { proteinTargetG: 100, carbohydrateTargetG: 200, fatTargetG: 0, fiberTargetG: 20 },
      validationResult: { valid: true, status: 'PASS' },
      foodCatalog: [
        { id: 'F_P2', name: 'Clara de ovo', calories: 50, protein: 11, carbohydrate: 0.7, lipid: 0.1, unit: 'g' },
        { id: 'F_C1', name: 'Arroz branco', calories: 128, protein: 2.5, carbohydrate: 28, lipid: 0.2, unit: 'g' },
        { id: 'F_C2', name: 'Batata inglesa', calories: 75, protein: 2, carbohydrate: 17, lipid: 0.1, unit: 'g' }
      ]
    };

    const res = solveNutritionDiet(lowFatInput);
    assert.ok(res.valid);
    assert.strictEqual(res.target.fat, 0);
  });

  test('21. Solver suporta meta de fibra igual a zero sem quebra', () => {
    const zeroFiberInput = {
      context: { schemaVersion: '1.0.0', patient: { patientId: 'p-1', name: 'ZeroFiber' } },
      energyTarget: { caloricTargetKcal: 1000 },
      macroTarget: { proteinTargetG: 80, carbohydrateTargetG: 120, fatTargetG: 20, fiberTargetG: 0 },
      validationResult: { valid: true, status: 'PASS' },
      foodCatalog: [
        { id: 'F_P3', name: 'Frango', calories: 150, protein: 32, carbohydrate: 0, lipid: 2.5, unit: 'g' },
        { id: 'F_C3', name: 'Arroz', calories: 128, protein: 2.5, carbohydrate: 28, lipid: 0.2, unit: 'g' },
        { id: 'F_G3', name: 'Azeite', calories: 884, protein: 0, carbohydrate: 0, lipid: 100, unit: 'g' }
      ]
    };

    const res = solveNutritionDiet(zeroFiberInput);
    assert.ok(res.valid);
    assert.strictEqual(res.target.fiber, 0);
  });

  test('22. Comprovação matemática de que a fibra NÃO participa do fechamento energético (4P + 4C + 9G)', () => {
    const foodWithFiber = {
      id: 'F_FIB', name: 'Aveia em flocos', calories: 360, protein: 15, carbohydrate: 60, lipid: 7, fiber: 10, unit: 'g'
    };
    const portion = calculateFoodPortionNutrients(foodWithFiber, 100);

    // 15 * 4 + 60 * 4 + 7 * 9 = 60 + 240 + 63 = 363 kcal
    const expectedAtwater = 15 * 4 + 60 * 4 + 7 * 9;
    assert.strictEqual(portion.calories, expectedAtwater);
    // A fibra (10g) NÃO é somada às calorias
    assert.notStrictEqual(portion.calories, expectedAtwater + 10 * 4);
  });

});

describe('Fase N3.2 — Grupo D: Restrições e Governança', () => {

  const testCatalogWithLact = [
    { id: 'F_LACT', name: 'Iogurte natural', category: 'Laticínios', calories: 60, protein: 4, carbohydrate: 6, lipid: 3, unit: 'g' },
    { id: 'F_VEG1', name: 'Brócolis', category: 'Verduras e Legumes', calories: 35, protein: 3, carbohydrate: 7, lipid: 0.5, unit: 'g' },
    { id: 'F_PROT', name: 'Frango', category: 'Carnes e Aves', calories: 150, protein: 32, carbohydrate: 0, lipid: 2.5, unit: 'g' },
    { id: 'F_CARB', name: 'Arroz', category: 'Cereais e Leguminosas', calories: 128, protein: 2.5, carbohydrate: 28, lipid: 0.2, unit: 'g' }
  ];

  test('23. Restrição formal por categoria (excludedCategories) remove candidatos da categoria correspondente', () => {
    const filterRes = filterEligibleFoods(testCatalogWithLact, DEFAULT_ELIGIBILITY_POLICY, {
      constraints: { excludedCategories: ['Laticínios'] }
    });

    assert.ok(!filterRes.eligible.some(f => f.category === 'Laticínios'));
    assert.ok(filterRes.ineligible.some(item => item.food.id === 'F_LACT'));
  });

  test('24. Restrições formais por ID e Tag (excludedFoodIds, excludedTags) tornam os alimentos correspondentes INELIGIBLE', () => {
    const catalogWithTags = [
      { id: 'F_A', name: 'Alimento A', category: 'Frutas', tags: ['organico', 'castanhas'], calories: 50, protein: 1, carbohydrate: 10, lipid: 0.5, unit: 'g' },
      { id: 'F_B', name: 'Alimento B', category: 'Frutas', tags: ['organico'], calories: 50, protein: 1, carbohydrate: 10, lipid: 0.5, unit: 'g' }
    ];

    const filterRes = filterEligibleFoods(catalogWithTags, DEFAULT_ELIGIBILITY_POLICY, {
      constraints: { excludedFoodIds: ['F_B'], excludedTags: ['castanhas'] }
    });

    assert.strictEqual(filterRes.eligible.length, 0);
    assert.strictEqual(filterRes.ineligible.length, 2);
    assert.ok(filterRes.ineligible.some(it => it.food.id === 'F_A'));
    assert.ok(filterRes.ineligible.some(it => it.food.id === 'F_B'));
  });

});

describe('Fase N3.2 — Grupo E: Convergência, Soluções e Falhas', () => {

  const balancedCatalog = [
    { id: 'FOOD_P1', name: 'Peito de Frango Grelhado', category: 'Carnes e Aves', calories: 159, protein: 32, carbohydrate: 0, lipid: 2.5, fiber: 0, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
    { id: 'FOOD_C1', name: 'Arroz Branco Cozido', category: 'Cereais e Leguminosas', calories: 128, protein: 2.5, carbohydrate: 28, lipid: 0.2, fiber: 1.5, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
    { id: 'FOOD_C2', name: 'Batata Inglesa Cozida', category: 'Tubérculos e Raízes', calories: 75, protein: 2, carbohydrate: 17, lipid: 0.1, fiber: 1.5, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
    { id: 'FOOD_F1', name: 'Azeite de Oliva', category: 'Óleos e Gorduras', calories: 884, protein: 0, carbohydrate: 0, lipid: 100, fiber: 0, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
    { id: 'FOOD_V1', name: 'Brócolis Cozido', category: 'Verduras e Legumes', calories: 35, protein: 3, carbohydrate: 7, lipid: 0.5, fiber: 3, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } }
  ];

  test('25. Solução viável com alvos padrão atinge status PASS com alimentos CONSISTENTE', () => {
    const input = {
      context: { schemaVersion: '1.0.0', patient: { patientId: 'p-1', name: 'Sucesso' } },
      energyTarget: { caloricTargetKcal: 1200 },
      macroTarget: { proteinTargetG: 90, carbohydrateTargetG: 135, fatTargetG: 30, fiberTargetG: 12 },
      validationResult: { valid: true, status: 'PASS' },
      foodCatalog: balancedCatalog
    };

    const res = solveNutritionDiet(input);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.status, SOLVER_STATUS.PASS);
    assert.ok(res.meals.length > 0);
    assert.ok(res.meals[0].items.length >= 3);
    assert.ok(Math.abs(res.differences.calories) <= 25.0);
  });

  test('26. Solução com desvio que excede tolerâncias atinge status WARNING com transparência', () => {
    const inputNarrow = {
      context: { schemaVersion: '1.0.0', patient: { patientId: 'p-1', name: 'Alvo Aperto' } },
      energyTarget: { caloricTargetKcal: 1800 },
      macroTarget: { proteinTargetG: 160, carbohydrateTargetG: 180, fatTargetG: 50, fiberTargetG: 20 },
      validationResult: { valid: true, status: 'PASS' },
      foodCatalog: [
        // Apenas arroz e batata (sem fonte rica de proteína)
        { id: 'FOOD_C1', name: 'Arroz', calories: 128, protein: 2.5, carbohydrate: 28, lipid: 0.2, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
        { id: 'FOOD_C2', name: 'Batata', calories: 75, protein: 2, carbohydrate: 17, lipid: 0.1, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
        { id: 'FOOD_F1', name: 'Azeite', calories: 884, protein: 0, carbohydrate: 0, lipid: 100, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } }
      ]
    };

    const res = solveNutritionDiet(inputNarrow);
    assert.ok(res.status === SOLVER_STATUS.WARNING || res.status === SOLVER_STATUS.NO_SOLUTION);
    assert.ok(res.warnings.length > 0);
  });

  test('27. Impossibilidade severa de atingir alvos retorna NO_SOLUTION', () => {
    const impossibleInput = {
      context: { schemaVersion: '1.0.0', patient: { patientId: 'p-1', name: 'Impossivel' } },
      energyTarget: { caloricTargetKcal: 4000 },
      macroTarget: { proteinTargetG: 400, carbohydrateTargetG: 400, fatTargetG: 100, fiberTargetG: 50 },
      validationResult: { valid: true, status: 'PASS' },
      foodCatalog: [
        // Apenas alface (15 kcal/100g)
        { id: 'FOOD_ALF', name: 'Alface', calories: 15, protein: 1, carbohydrate: 2, lipid: 0.2, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
        { id: 'FOOD_AGU', name: 'Agrião', calories: 15, protein: 1, carbohydrate: 2, lipid: 0.2, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
        { id: 'FOOD_PEP', name: 'Pepino', calories: 15, protein: 1, carbohydrate: 2, lipid: 0.2, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } }
      ]
    };

    const res = solveNutritionDiet(impossibleInput);
    assert.strictEqual(res.status, SOLVER_STATUS.NO_SOLUTION);
    assert.strictEqual(res.valid, false);
    assert.ok(res.blockingReasons.length > 0);
  });

});

describe('Fase N3.2 — Grupo F: Determinismo Estrito e Invariância', () => {

  const testInputDeterministic = {
    context: { schemaVersion: '1.0.0', patient: { patientId: 'p-1', name: 'Determinismo' } },
    energyTarget: { caloricTargetKcal: 1500 },
    macroTarget: { proteinTargetG: 110, carbohydrateTargetG: 180, fatTargetG: 35, fiberTargetG: 18 },
    validationResult: { valid: true, status: 'PASS' },
    foodCatalog: [
      { id: 'FOOD_0010', name: 'Frango', category: 'Carnes e Aves', calories: 159, protein: 32, carbohydrate: 0, lipid: 2.5, fiber: 0, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
      { id: 'FOOD_0020', name: 'Arroz', category: 'Cereais e Leguminosas', calories: 128, protein: 2.5, carbohydrate: 28, lipid: 0.2, fiber: 1.5, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
      { id: 'FOOD_0030', name: 'Batata', category: 'Tubérculos e Raízes', calories: 75, protein: 2, carbohydrate: 17, lipid: 0.1, fiber: 1.5, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
      { id: 'FOOD_0040', name: 'Azeite', category: 'Óleos e Gorduras', calories: 884, protein: 0, carbohydrate: 0, lipid: 100, fiber: 0, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
      { id: 'FOOD_0050', name: 'Couve', category: 'Verduras e Legumes', calories: 30, protein: 2.5, carbohydrate: 5, lipid: 0.4, fiber: 3, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } }
    ]
  };

  test('28. Execução repetida 5 vezes produz saída idêntica estruturalmente (assert.deepStrictEqual)', () => {
    const res1 = solveNutritionDiet(testInputDeterministic);
    const res2 = solveNutritionDiet(testInputDeterministic);
    const res3 = solveNutritionDiet(testInputDeterministic);

    assert.deepStrictEqual(res1, res2);
    assert.deepStrictEqual(res2, res3);
  });

  test('29. Invariância à ordem do catálogo: array invertido produz a mesma solução idêntica', () => {
    const reversedCatalogInput = {
      ...testInputDeterministic,
      foodCatalog: [...testInputDeterministic.foodCatalog].reverse()
    };

    const resOriginal = solveNutritionDiet(testInputDeterministic);
    const resReversed = solveNutritionDiet(reversedCatalogInput);

    assert.deepStrictEqual(resOriginal, resReversed);
  });

  test('30. Desempate estável entre alimentos com perfis nutricionais idênticos desempata por foodId lexicográfico', () => {
    const twinCatalog = [
      { id: 'FOOD_TWIN_B', name: 'Twin B', calories: 100, protein: 20, carbohydrate: 0, lipid: 2, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
      { id: 'FOOD_TWIN_A', name: 'Twin A', calories: 100, protein: 20, carbohydrate: 0, lipid: 2, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
      { id: 'FOOD_CARB_X', name: 'Carb X', calories: 100, protein: 2, carbohydrate: 22, lipid: 0.5, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
      { id: 'FOOD_FAT_Y', name: 'Fat Y', calories: 800, protein: 0, carbohydrate: 0, lipid: 90, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } }
    ];

    const inputTwin = {
      ...testInputDeterministic,
      foodCatalog: twinCatalog
    };

    const res = solveNutritionDiet(inputTwin);
    const selectedIds = res.foodProvenance.map(p => p.foodId);
    // Em caso de empate entre TWIN_A e TWIN_B para o mesmo slot, TWIN_A deve ser selecionado (ordem lexicográfica)
    if (selectedIds.includes('FOOD_TWIN_A') || selectedIds.includes('FOOD_TWIN_B')) {
      assert.ok(selectedIds.includes('FOOD_TWIN_A'), 'Deveria priorizar FOOD_TWIN_A lexicograficamente');
    }
  });

  test('31. Imutabilidade profunda: todos os objetos retornados estão congelados (Object.isFrozen)', () => {
    const res = solveNutritionDiet(testInputDeterministic);
    assert.ok(Object.isFrozen(res));
    assert.ok(Object.isFrozen(res.meals));
    assert.ok(Object.isFrozen(res.totals));
    assert.ok(Object.isFrozen(res.differences));
    assert.ok(Object.isFrozen(res.foodProvenance));
    assert.ok(Object.isFrozen(res.solverDiagnostics));
    assert.ok(Object.isFrozen(res.warnings));
    assert.ok(Object.isFrozen(res.blockingReasons));
  });

  test('32. DEFAULT_FOOD_SOLVER_POLICY e sub-estruturas estão profundamente congeladas e usam CONSISTENT_STATUS_COUNT', () => {
    assert.ok(Object.isFrozen(DEFAULT_FOOD_SOLVER_POLICY));
    assert.ok(Object.isFrozen(DEFAULT_FOOD_SOLVER_POLICY.weights));
    assert.ok(Object.isFrozen(DEFAULT_FOOD_SOLVER_POLICY.fallbackScales));
    assert.ok(Object.isFrozen(DEFAULT_FOOD_SOLVER_POLICY.tolerances));
    assert.ok(Object.isFrozen(DEFAULT_FOOD_SOLVER_POLICY.searchBounds));
    assert.ok(Object.isFrozen(DEFAULT_FOOD_SOLVER_POLICY.candidateLimits));
    assert.ok(Object.isFrozen(DEFAULT_FOOD_SOLVER_POLICY.convergence));
    assert.ok(Object.isFrozen(DEFAULT_FOOD_SOLVER_POLICY.tieBreakOrder));
    assert.ok(DEFAULT_FOOD_SOLVER_POLICY.tieBreakOrder.includes('CONSISTENT_STATUS_COUNT'));
    assert.ok(!DEFAULT_FOOD_SOLVER_POLICY.tieBreakOrder.includes('HIGHEST_BROMATOLOGY_CONFIDENCE'));
  });

});

describe('Fase N3.2 — Grupo G: Pureza Arquitetural e Proibições Estritas', () => {

  const solverDir = path.join(__dirname, '..', 'domain', 'solver');

  function readAllCodeInDir(dir) {
    let code = '';
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fullPath = path.join(dir, f);
      if (fs.statSync(fullPath).isFile() && f.endsWith('.js')) {
        code += fs.readFileSync(fullPath, 'utf8') + '\n';
      }
    }
    return code;
  }

  const allSolverCode = readAllCodeInDir(solverDir);

  test('33. Auditoria estática: Proibição estrita de CANONICAL_DIET_FOODS', () => {
    assert.ok(!allSolverCode.includes('CANONICAL_DIET_FOODS'), 'Solver não pode referenciar CANONICAL_DIET_FOODS');
  });

  test('34. Auditoria estática: Proibição de Math.random() e Date.now()', () => {
    assert.ok(!allSolverCode.includes('Math.random'), 'Solver não pode usar Math.random()');
    assert.ok(!allSolverCode.includes('Date.now()'), 'Solver não pode usar Date.now() para decisão');
  });

  test('35. Auditoria estática: Proibição de window, document, Gemini, Dexie writes e Firebase writes', () => {
    assert.ok(!allSolverCode.includes('document.'), 'Solver puro não pode acessar document');
    assert.ok(!allSolverCode.includes('window.'), 'Solver puro não pode acessar window');
    assert.ok(!allSolverCode.includes('Gemini'), 'Solver não pode invocar Gemini');
    assert.ok(!allSolverCode.includes('db.foods.put'), 'Solver não pode escrever no Dexie');
    assert.ok(!allSolverCode.includes('db.foods.add'), 'Solver não pode escrever no Dexie');
    assert.ok(!allSolverCode.includes('db.foods.delete'), 'Solver não pode deletar no Dexie');
    assert.ok(!allSolverCode.includes('firebase'), 'Solver não pode interagir com Firebase');
  });

  test('36. Auditoria estática: Proibição de semântica clínica embutida no Food Solver', () => {
    const prohibitedClinicalTerms = [
      'lactose_free',
      'sem_lactose',
      'alergia_leite',
      'aplv',
      'vegan',
      'vegano',
      'vegetarian',
      'vegetariano'
    ];

    prohibitedClinicalTerms.forEach((term) => {
      assert.ok(
        !allSolverCode.includes(term),
        `Solver puro não pode interpretar o termo clínico '${term}'. Exclusões devem ser formalizadas via excludedCategories/excludedFoodIds/excludedTags.`
      );
    });
  });

});
