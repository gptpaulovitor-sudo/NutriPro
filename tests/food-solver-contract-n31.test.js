'use strict';

/**
 * tests/food-solver-contract-n31.test.js
 * 
 * Suíte de Testes da Fase N3.1 — Contrato Canônico de Alimentos e Especificação do Food Solver
 * NutriAx Pro (Versão Revisada)
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const FoodSolverContract = require('../domain/contracts/FoodSolverContract');
const {
  validateCanonicalFoodDTO,
  createCanonicalFoodDTO,
  validateFoodSolverInput,
  validateFoodSolverOutput,
  FOOD_SOLVER_CONTRACT_VERSION,
  SOLVER_STATUS,
  FOOD_SOURCES,
  UNIT_CONVERSION_POLICY,
  PRECISION_POLICY
} = FoodSolverContract;

describe('Fase N3.1 — Contrato Canônico de Alimentos (CanonicalFoodDTO)', () => {

  const validOfficialFood = {
    id: 'FOOD_0001',
    name: 'Arroz branco cozido',
    category: 'Cereais e Leguminosas',
    source: 'TACO',
    brand: null,
    prepState: 'Cozido',
    baseQuantity: 100,
    unit: 'g',
    gramPerUnit: null,
    calories: 128,
    protein: 2.5,
    carbohydrate: 28.1,
    lipid: 0.2,
    fiber: 1.6,
    sodium: 1.0,
    bromatology: {
      energyStatus: 'CONSISTENTE',
      massStatus: 'OK',
      sourceStatus: 'OK'
    }
  };

  test('1. Food DTO válido oficial é validado e normalizado com sucesso', () => {
    const val = validateCanonicalFoodDTO(validOfficialFood);
    assert.strictEqual(val.isValid, true);
    assert.strictEqual(val.errors.length, 0);

    const dto = createCanonicalFoodDTO(validOfficialFood);
    assert.strictEqual(dto.id, 'FOOD_0001');
    assert.strictEqual(dto.name, 'Arroz branco cozido');
    assert.strictEqual(dto.calories, 128);
    assert.strictEqual(dto.protein, 2.5);
    assert.strictEqual(dto.carbohydrate, 28.1);
    assert.strictEqual(dto.lipid, 0.2);
    assert.strictEqual(dto.fiber, 1.6);
    assert.strictEqual(dto.sodium, 1.0);
    assert.strictEqual(dto.isCustom, false);
    assert.strictEqual(dto.baseQuantity, 100);
    assert.strictEqual(dto.unit, 'g');
  });

  test('2. foodId / id é obrigatório como chave primária estrita e rejeita nulo, vazio ou não-string', () => {
    const missingId = { ...validOfficialFood, id: '', foodId: undefined };
    const val = validateCanonicalFoodDTO(missingId);
    assert.strictEqual(val.isValid, false);
    assert.ok(val.errors.some(e => e.includes('id (ou foodId)')));

    assert.throws(() => {
      createCanonicalFoodDTO(missingId);
    }, /Dados inválidos para CanonicalFoodDTO/);
  });

  test('3. name / foodName é obrigatório e rejeita nulo ou vazio', () => {
    const missingName = { ...validOfficialFood, name: '   ', foodName: undefined };
    const val = validateCanonicalFoodDTO(missingName);
    assert.strictEqual(val.isValid, false);
    assert.ok(val.errors.some(e => e.includes('name (ou foodName)')));
  });

  test('4. Nutrientes obrigatórios (calorias, proteína, carboidrato, lipídio) exigem valores numéricos finitos >= 0', () => {
    const invalidNutrients = [
      { ...validOfficialFood, calories: -5 },
      { ...validOfficialFood, protein: NaN },
      { ...validOfficialFood, carbohydrate: '20' },
      { ...validOfficialFood, lipid: Infinity }
    ];

    invalidNutrients.forEach(item => {
      const val = validateCanonicalFoodDTO(item);
      assert.strictEqual(val.isValid, false);
      assert.ok(val.errors.length > 0);
    });
  });

  test('5. Unidade (unit / baseUnit) é obrigatória', () => {
    const missingUnit = { ...validOfficialFood, unit: '', baseUnit: undefined };
    const val = validateCanonicalFoodDTO(missingUnit);
    assert.strictEqual(val.isValid, false);
    assert.ok(val.errors.some(e => e.includes('unit (ou baseUnit)')));
  });

  test('6. gramPerUnit e density, quando fornecidos, devem ser finitos e > 0', () => {
    const validWithMeasures = { ...validOfficialFood, gramPerUnit: 50, density: 1.03 };
    const val1 = validateCanonicalFoodDTO(validWithMeasures);
    assert.strictEqual(val1.isValid, true);

    const dto = createCanonicalFoodDTO(validWithMeasures);
    assert.strictEqual(dto.gramPerUnit, 50);
    assert.strictEqual(dto.density, 1.03);

    const invalidDensity = { ...validOfficialFood, density: -0.5 };
    const val2 = validateCanonicalFoodDTO(invalidDensity);
    assert.strictEqual(val2.isValid, false);
    assert.ok(val2.errors.some(e => e.includes('density')));
  });

  test('7. Alimento customizado (cust_*) é identificado como isCustom: true', () => {
    const customFood = {
      id: 'cust_1720000000000',
      name: 'Pão caseiro artesanal',
      category: 'Pães',
      source: 'Custom',
      baseQuantity: 100,
      unit: 'g',
      calories: 250,
      protein: 7.0,
      carbohydrate: 45.0,
      lipid: 3.5
    };

    const val = validateCanonicalFoodDTO(customFood);
    assert.strictEqual(val.isValid, true);

    const dto = createCanonicalFoodDTO(customFood);
    assert.strictEqual(dto.isCustom, true);
    assert.strictEqual(dto.source, 'Custom');
    assert.strictEqual(dto.fiber, null);
    assert.strictEqual(dto.sodium, null);
    assert.strictEqual(dto.density, null);
  });

  test('8. Alimento oficial não é customizado (isCustom: false)', () => {
    const dto = createCanonicalFoodDTO(validOfficialFood);
    assert.strictEqual(dto.isCustom, false);
  });

  test('9. Campos opcionais ausentes permanecem explicitamente null sem inventar valores ou densidade', () => {
    const minimalFood = {
      id: 'FOOD_9999',
      name: 'Alimento Básico Sem Densidade',
      calories: 100,
      protein: 10,
      carbohydrate: 10,
      lipid: 2,
      baseQuantity: 100,
      unit: 'ml'
    };

    const dto = createCanonicalFoodDTO(minimalFood);
    assert.strictEqual(dto.category, null);
    assert.strictEqual(dto.brand, null);
    assert.strictEqual(dto.prepState, null);
    assert.strictEqual(dto.gramPerUnit, null);
    assert.strictEqual(dto.density, null); // NÃO inventa 1g = 1ml
    assert.strictEqual(dto.fiber, null);
    assert.strictEqual(dto.sodium, null);
    assert.strictEqual(dto.bromatology, null);
  });

  test('10. Dados inválidos são bloqueados por exceção no createCanonicalFoodDTO', () => {
    assert.throws(() => {
      createCanonicalFoodDTO(null);
    }, /Dados inválidos para CanonicalFoodDTO/);

    assert.throws(() => {
      createCanonicalFoodDTO({ id: 'X' });
    }, /Dados inválidos para CanonicalFoodDTO/);
  });

  test('11. Imutabilidade profunda (deepFreeze) protege o objeto contra mutações', () => {
    const dto = createCanonicalFoodDTO(validOfficialFood);
    assert.ok(Object.isFrozen(dto));
    assert.ok(Object.isFrozen(dto.bromatology));

    assert.throws(() => {
      dto.calories = 999;
    }, TypeError);

    assert.throws(() => {
      dto.bromatology.energyStatus = 'ALTERADO';
    }, TypeError);
  });

  test('12. Determinismo: mesma entrada produz sempre saída idêntica', () => {
    const dto1 = createCanonicalFoodDTO(validOfficialFood);
    const dto2 = createCanonicalFoodDTO(validOfficialFood);

    assert.deepStrictEqual(dto1, dto2);
    assert.strictEqual(JSON.stringify(dto1), JSON.stringify(dto2));
  });

});

describe('Fase N3.1 — Políticas Formais de Unidades e Precisão', () => {

  test('13. UNIT_CONVERSION_POLICY distingue massa direta de volume e estabelece política de medidas caseiras', () => {
    assert.ok(UNIT_CONVERSION_POLICY.MASS_UNITS.includes('g'));
    assert.ok(UNIT_CONVERSION_POLICY.VOLUME_UNITS.includes('ml'));
    assert.strictEqual(UNIT_CONVERSION_POLICY.HOUSEHOLD_SOLVER_ELIGIBILITY.REQUIRE_SPECIFIC_CONVERSION, true);
    assert.strictEqual(UNIT_CONVERSION_POLICY.HOUSEHOLD_SOLVER_ELIGIBILITY.ALLOW_GENERIC_FALLBACK, false);
    assert.ok(Object.isFrozen(UNIT_CONVERSION_POLICY));
  });

  test('14. PRECISION_POLICY formaliza precisão interna contínua vs precisão de saída na UI', () => {
    assert.strictEqual(PRECISION_POLICY.SOLVER_INTERNAL, 'IEEE_754_FLOAT64_CONTINUOUS');
    assert.strictEqual(PRECISION_POLICY.PRESCRIPTION_UI_MASS, 'INTEGER_OR_ONE_DECIMAL');
    assert.strictEqual(PRECISION_POLICY.PRESCRIPTION_UI_MACROS, 'TWO_DECIMALS');
    assert.ok(Object.isFrozen(PRECISION_POLICY));
  });

});

describe('Fase N3.1 — Contrato de Entrada e Saída do Food Solver (I/O)', () => {

  const validSolverInput = {
    context: {
      schemaVersion: '1.0.0',
      patient: { patientId: 'p1', name: 'Teste' }
    },
    energyTarget: {
      caloricTargetKcal: 2200,
      tmbKcal: 1750,
      getKcal: 2450
    },
    macroTarget: {
      proteinTargetG: 160,
      carbohydrateTargetG: 250,
      fatTargetG: 62,
      fiberTargetG: 30
    },
    validationResult: {
      valid: true,
      status: 'PASS',
      checks: []
    },
    foodCatalog: [
      { id: 'FOOD_0001', name: 'Arroz', calories: 128, protein: 2.5, carbohydrate: 28.1, lipid: 0.2, unit: 'g' }
    ],
    options: { mealCount: 4 }
  };

  test('15. Input válido passa na validação com isValid: true e isBlocked: false', () => {
    const val = validateFoodSolverInput(validSolverInput);
    assert.strictEqual(val.isValid, true);
    assert.strictEqual(val.isBlocked, false);
    assert.strictEqual(val.errors.length, 0);
  });

  test('16. Portão de entrada BLOQUEIA estritamente se validationResult.valid !== true (Fase N2.3)', () => {
    const invalidValidationInput = {
      ...validSolverInput,
      validationResult: { valid: false, status: 'BLOCKED', reasons: ['Inconsistência calórica'] }
    };

    const val = validateFoodSolverInput(invalidValidationInput);
    assert.strictEqual(val.isValid, false);
    assert.strictEqual(val.isBlocked, true);
    assert.ok(val.errors.some(e => e.includes('valid === true')));
  });

  test('17. Contexto nutricional canônico (N1.1) é obrigatório como fonte única de verdade', () => {
    const missingContext = { ...validSolverInput, context: null };
    const val = validateFoodSolverInput(missingContext);
    assert.strictEqual(val.isValid, false);
    assert.strictEqual(val.isBlocked, true);
    assert.ok(val.errors.some(e => e.includes('context')));
  });

  test('18. Input sem metas de energia ou macros válidas é bloqueado', () => {
    const missingEnergy = { ...validSolverInput, energyTarget: null };
    const val1 = validateFoodSolverInput(missingEnergy);
    assert.strictEqual(val1.isValid, false);
    assert.strictEqual(val1.isBlocked, true);

    const invalidMacros = { ...validSolverInput, macroTarget: { proteinTargetG: -10, carbohydrateTargetG: 200, fatTargetG: 50 } };
    const val2 = validateFoodSolverInput(invalidMacros);
    assert.strictEqual(val2.isValid, false);
    assert.strictEqual(val2.isBlocked, true);
  });

  test('19. Input com catálogo de alimentos vazio é rejeitado', () => {
    const emptyCatalog = { ...validSolverInput, foodCatalog: [] };
    const val = validateFoodSolverInput(emptyCatalog);
    assert.strictEqual(val.isValid, false);
    assert.strictEqual(val.isBlocked, true);
    assert.ok(val.errors.some(e => e.includes('foodCatalog')));
  });

  test('20. Output do Solver com qualquer string de versão válida é aceito (sem fixar "N3.2.0")', () => {
    const validOutput = {
      status: 'PASS',
      valid: true,
      meals: [],
      totals: { calories: 2200, protein: 160, carbohydrate: 250, fat: 62, fiber: 30, sodium: 1500 },
      target: { calories: 2200, protein: 160, carbohydrate: 250, fat: 62, fiber: 30 },
      differences: { calories: 0, protein: 0, carbohydrate: 0, fat: 0, fiber: 0 },
      foodProvenance: [],
      solverDiagnostics: ['Convergence achieved in 12 iterations'],
      warnings: [],
      blockingReasons: [],
      solverVersion: 'solver-custom-build-2026', // aceita qualquer string não-vazia
      provenance: { engine: 'NutriAxDeterministicFoodSolver' }
    };

    const val = validateFoodSolverOutput(validOutput);
    assert.strictEqual(val.isValid, true);
    assert.strictEqual(val.errors.length, 0);
  });

  test('21. Output do Solver com solverVersion vazio, ausente ou não-string é rejeitado', () => {
    const invalidVersions = [
      { solverVersion: '' },
      { solverVersion: '   ' },
      { solverVersion: null },
      { solverVersion: 123 }
    ];

    const baseOutput = {
      status: 'PASS',
      valid: true,
      meals: [],
      totals: { calories: 2000, protein: 150, carbohydrate: 200, fat: 50 },
      target: { calories: 2000, protein: 150, carbohydrate: 200, fat: 50 },
      differences: { calories: 0, protein: 0, carbohydrate: 0, fat: 0 },
      foodProvenance: [],
      solverDiagnostics: [],
      warnings: [],
      blockingReasons: []
    };

    invalidVersions.forEach(iv => {
      const val = validateFoodSolverOutput({ ...baseOutput, ...iv });
      assert.strictEqual(val.isValid, false);
      assert.ok(val.errors.some(e => e.includes('solverVersion')));
    });
  });

});
