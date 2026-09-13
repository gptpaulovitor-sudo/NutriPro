/**
 * tests/meal-assembly-n33.test.js
 * 
 * Suíte de Testes Automatizados — Fase N3.3: Meal Assembly Determinístico Canônico.
 * NutriAx Pro.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const MealAssemblyContract = require('../domain/contracts/MealAssemblyContract');
const {
  ASSEMBLY_STATUS,
  MEAL_ROLES,
  extractGlobalSolutionItems,
  validateMealAssemblyInput,
  validateMealAssemblyOutput
} = MealAssemblyContract;

const mealSubsystem = require('../domain/meal/index');
const {
  DEFAULT_MEAL_ASSEMBLY_POLICY,
  resolveMealCount,
  resolveMealRoles,
  calculateTargetRatios,
  calculateAssemblyCost,
  assembleMeals,
  validateMealAssembly
} = mealSubsystem;

// Fixture canônica de alimentos resolvidos pelo N3.2
function createMockN32Result(overrides = {}) {
  const defaultItems = [
    {
      foodId: 'FOOD_P1',
      foodName: 'Peito de Frango Grelhado',
      quantity: 200,
      grams: 200,
      unit: 'g',
      nutrients: {
        calories: 318,
        protein: 64,
        carbohydrate: 0,
        lipid: 5,
        fiber: 0,
        sodium: 140
      }
    },
    {
      foodId: 'FOOD_C1',
      foodName: 'Arroz Branco Cozido',
      quantity: 300,
      grams: 300,
      unit: 'g',
      nutrients: {
        calories: 384,
        protein: 7.5,
        carbohydrate: 84,
        lipid: 0.6,
        fiber: 4.5,
        sodium: 10
      }
    },
    {
      foodId: 'FOOD_L1',
      foodName: 'Feijão Preto Cozido',
      quantity: 150,
      grams: 150,
      unit: 'g',
      nutrients: {
        calories: 115.5,
        protein: 6.75,
        carbohydrate: 21,
        lipid: 0.75,
        fiber: 12.6,
        sodium: 5
      }
    },
    {
      foodId: 'FOOD_F1',
      foodName: 'Banana Prata',
      quantity: 100,
      grams: 100,
      unit: 'g',
      nutrients: {
        calories: 98,
        protein: 1.3,
        carbohydrate: 26,
        lipid: 0.1,
        fiber: 2,
        sodium: 1
      }
    }
  ];

  const items = overrides.items || defaultItems;

  const totalCal = items.reduce((acc, it) => acc + (it.nutrients.calories || 0), 0);
  const totalProt = items.reduce((acc, it) => acc + (it.nutrients.protein || 0), 0);
  const totalCarb = items.reduce((acc, it) => acc + (it.nutrients.carbohydrate || 0), 0);
  const totalFat = items.reduce((acc, it) => acc + (it.nutrients.lipid !== undefined ? it.nutrients.lipid : (it.nutrients.fat || 0)), 0);
  const totalFib = items.reduce((acc, it) => acc + (it.nutrients.fiber || 0), 0);

  return {
    status: overrides.status || 'PASS',
    valid: overrides.valid !== undefined ? overrides.valid : true,
    solverVersion: overrides.solverVersion || 'N3.2.0',
    meals: [
      {
        mealName: 'Alocação Global Determinística N3.2',
        mealTime: null,
        items,
        totals: {
          calories: totalCal,
          protein: totalProt,
          carbohydrate: totalCarb,
          fat: totalFat,
          fiber: totalFib,
          sodium: 156
        }
      }
    ],
    totals: {
      calories: totalCal,
      protein: totalProt,
      carbohydrate: totalCarb,
      fat: totalFat,
      fiber: totalFib,
      sodium: 156
    },
    warnings: overrides.warnings || []
  };
}

function createMockInput(overrides = {}) {
  return {
    context: overrides.context || {
      schemaVersion: '1.0.0',
      patient: {
        patientId: 'patient_test_1',
        name: 'Paciente Teste',
        routine: {
          mealsPerDay: overrides.mealsPerDay !== undefined ? overrides.mealsPerDay : 3
        }
      }
    },
    validationResult: overrides.validationResult !== undefined ? overrides.validationResult : {
      valid: true,
      status: 'PASS'
    },
    foodSolverResult: overrides.foodSolverResult !== undefined ? overrides.foodSolverResult : createMockN32Result()
  };
}

// ============================================================================
// GRUPO A: Portão de Entrada, Contratos e Estados
// ============================================================================
test('Fase N3.3 — Grupo A: Portão de Entrada e Contratos', async (t) => {

  await t.test('1. Input inválido (nulo ou não-objeto) resulta em status BLOCKED', () => {
    const res = assembleMeals(null);
    assert.strictEqual(res.status, ASSEMBLY_STATUS.BLOCKED);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.meals.length, 0);
  });

  await t.test('2. validationResult ausente bloqueia execução com BLOCKED', () => {
    const input = createMockInput({ validationResult: null });
    const res = assembleMeals(input);
    assert.strictEqual(res.status, ASSEMBLY_STATUS.BLOCKED);
    assert.strictEqual(res.valid, false);
  });

  await t.test('3. N2.3 inválido (validationResult.valid !== true) resulta em status BLOCKED', () => {
    const input = createMockInput({
      validationResult: { valid: false, status: 'BLOCKED', errors: ['Incoerência energética'] }
    });
    const res = assembleMeals(input);
    assert.strictEqual(res.status, ASSEMBLY_STATUS.BLOCKED);
    assert.strictEqual(res.valid, false);
  });

  await t.test('4. foodSolverResult com status BLOCKED resulta em status BLOCKED', () => {
    const input = createMockInput({
      foodSolverResult: { status: 'BLOCKED', valid: false, meals: [] }
    });
    const res = assembleMeals(input);
    assert.strictEqual(res.status, ASSEMBLY_STATUS.BLOCKED);
    assert.strictEqual(res.valid, false);
  });

  await t.test('5. foodSolverResult com status NO_SOLUTION resulta em status NO_SOLUTION', () => {
    const input = createMockInput({
      foodSolverResult: { status: 'NO_SOLUTION', valid: false, meals: [] }
    });
    const res = assembleMeals(input);
    assert.strictEqual(res.status, ASSEMBLY_STATUS.NO_SOLUTION);
    assert.strictEqual(res.valid, false);
  });

  await t.test('6. foodSolverResult com status PASS gera resultado PASS', () => {
    const input = createMockInput();
    const res = assembleMeals(input);
    assert.strictEqual(res.status, ASSEMBLY_STATUS.PASS);
    assert.strictEqual(res.valid, true);
    assert.ok(res.meals.length > 0);
  });

  await t.test('7. foodSolverResult com status WARNING propaga WARNING na proveniência e resultado', () => {
    const input = createMockInput({
      foodSolverResult: createMockN32Result({
        status: 'WARNING',
        warnings: ['Alimento REVISAR no catálogo']
      })
    });
    const res = assembleMeals(input);
    assert.strictEqual(res.status, ASSEMBLY_STATUS.WARNING);
    assert.strictEqual(res.valid, true);
    assert.ok(res.warnings.some(w => w.includes('Alimento REVISAR')));
  });

});

// ============================================================================
// GRUPO B: Estrutura das Refeições
// ============================================================================
test('Fase N3.3 — Grupo B: Estrutura das Refeições', async (t) => {

  await t.test('8. Montagem de 1 refeição aloca todos os itens na única refeição com zero fragmentação', () => {
    const input = createMockInput({ mealsPerDay: 1 });
    const res = assembleMeals(input);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.meals.length, 1);
    assert.strictEqual(res.meals[0].mealIndex, 0);
    assert.strictEqual(res.meals[0].mealRole, MEAL_ROLES.PRIMARY);
    assert.strictEqual(res.meals[0].items.length, 4);
    assert.ok(res.diagnostics.some(d => d.includes('Fragmentações de alimentos executadas: 0')));
  });

  await t.test('9. Montagem de 2 refeições distribui os itens entre 2 refeições primárias', () => {
    const input = createMockInput({ mealsPerDay: 2 });
    const res = assembleMeals(input);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.meals.length, 2);
    assert.strictEqual(res.meals[0].mealRole, MEAL_ROLES.PRIMARY);
    assert.strictEqual(res.meals[1].mealRole, MEAL_ROLES.PRIMARY);
  });

  await t.test('10. Montagem de 3 a 5 refeições gera contagem exata e papéis corretos', () => {
    [3, 4, 5].forEach((mCount) => {
      const input = createMockInput({ mealsPerDay: mCount });
      const res = assembleMeals(input);
      assert.strictEqual(res.meals.length, mCount);
      for (let i = 0; i < mCount; i++) {
        assert.strictEqual(res.meals[i].mealIndex, i);
        assert.strictEqual(res.meals[i].mealId, `meal_${i + 1}`);
      }
    });
  });

  await t.test('11. mealId é estritamente determinístico (meal_1, meal_2, ...)', () => {
    const input = createMockInput({ mealsPerDay: 4 });
    const res = assembleMeals(input);
    assert.strictEqual(res.meals[0].mealId, 'meal_1');
    assert.strictEqual(res.meals[1].mealId, 'meal_2');
    assert.strictEqual(res.meals[2].mealId, 'meal_3');
    assert.strictEqual(res.meals[3].mealId, 'meal_4');
  });

  await t.test('12. mealIndex é sequencial de 0 a M-1 sem lacunas', () => {
    const input = createMockInput({ mealsPerDay: 3 });
    const res = assembleMeals(input);
    const indices = res.meals.map(m => m.mealIndex);
    assert.deepStrictEqual(indices, [0, 1, 2]);
  });

  await t.test('13. Cada item de refeição possui foodId, grams, unit e nutrients completos', () => {
    const input = createMockInput({ mealsPerDay: 3 });
    const res = assembleMeals(input);
    res.meals.forEach(meal => {
      meal.items.forEach(it => {
        assert.ok(it.foodId);
        assert.ok(it.foodName);
        assert.ok(typeof it.grams === 'number' && it.grams > 0);
        assert.strictEqual(it.unit, 'g');
        assert.ok(it.nutrients);
        assert.strictEqual(it.sourceMealSolution, 'N3.2_GLOBAL');
        assert.ok(it.allocationRatio > 0 && it.allocationRatio <= 1.0);
      });
    });
  });

});

// ============================================================================
// GRUPO C: Conservação Estrita de Massa e Nutrientes
// ============================================================================
test('Fase N3.3 — Grupo C: Conservação Estrita de Massa e Nutrientes', async (t) => {

  await t.test('14. Massa global de cada foodId é preservada com precisão exata', () => {
    const input = createMockInput({ mealsPerDay: 3 });
    const res = assembleMeals(input);

    const massMap = new Map();
    res.meals.forEach(meal => {
      meal.items.forEach(it => {
        massMap.set(it.foodId, (massMap.get(it.foodId) || 0) + it.grams);
      });
    });

    assert.strictEqual(massMap.get('FOOD_P1'), 200);
    assert.strictEqual(massMap.get('FOOD_C1'), 300);
    assert.strictEqual(massMap.get('FOOD_L1'), 150);
    assert.strictEqual(massMap.get('FOOD_F1'), 100);
  });

  await t.test('15. Calorias globais são conservadas exatamente sem perda por arredondamento', () => {
    const input = createMockInput({ mealsPerDay: 3 });
    const res = assembleMeals(input);

    const originalKcal = 318 + 384 + 115.5 + 98; // 915.5
    const allocatedKcal = res.meals.reduce((acc, m) => acc + m.totals.calories, 0);

    assert.ok(Math.abs(allocatedKcal - originalKcal) <= 0.05);
    assert.strictEqual(res.globalTotals.calories, 915.5);
  });

  await t.test('16. Proteína global é conservada exatamente', () => {
    const input = createMockInput({ mealsPerDay: 3 });
    const res = assembleMeals(input);

    const originalProt = 64 + 7.5 + 6.75 + 1.3; // 79.55
    const allocatedProt = res.meals.reduce((acc, m) => acc + m.totals.protein, 0);

    assert.ok(Math.abs(allocatedProt - originalProt) <= 0.05);
    assert.strictEqual(res.globalTotals.protein, 79.55);
  });

  await t.test('17. Carboidrato global é conservado exatamente', () => {
    const input = createMockInput({ mealsPerDay: 3 });
    const res = assembleMeals(input);

    const originalCarb = 0 + 84 + 21 + 26; // 131
    const allocatedCarb = res.meals.reduce((acc, m) => acc + m.totals.carbohydrate, 0);

    assert.ok(Math.abs(allocatedCarb - originalCarb) <= 0.05);
    assert.strictEqual(res.globalTotals.carbohydrate, 131);
  });

  await t.test('18. Lipídio global é conservado exatamente', () => {
    const input = createMockInput({ mealsPerDay: 3 });
    const res = assembleMeals(input);

    const originalFat = 5 + 0.6 + 0.75 + 0.1; // 6.45
    const allocatedFat = res.meals.reduce((acc, m) => acc + m.totals.fat, 0);

    assert.ok(Math.abs(allocatedFat - originalFat) <= 0.05);
    assert.strictEqual(res.globalTotals.fat, 6.45);
  });

  await t.test('19. Fibra global é conservada exatamente', () => {
    const input = createMockInput({ mealsPerDay: 3 });
    const res = assembleMeals(input);

    const originalFib = 0 + 4.5 + 12.6 + 2; // 19.1
    const allocatedFib = res.meals.reduce((acc, m) => acc + m.totals.fiber, 0);

    assert.ok(Math.abs(allocatedFib - originalFib) <= 0.05);
    assert.strictEqual(res.globalTotals.fiber, 19.1);
  });

  await t.test('20. Múltiplos alimentos e customizados cust_* são preservados simultaneamente', () => {
    const customItems = [
      {
        foodId: 'cust_whey_blend',
        foodName: 'Whey Protein Customizado',
        quantity: 40,
        grams: 40,
        unit: 'g',
        nutrients: { calories: 160, protein: 32, carbohydrate: 3, lipid: 2, fiber: 0, sodium: 80 }
      },
      {
        foodId: 'FOOD_OATS',
        foodName: 'Aveia',
        quantity: 80,
        grams: 80,
        unit: 'g',
        nutrients: { calories: 280, protein: 11, carbohydrate: 45, lipid: 5, fiber: 8, sodium: 2 }
      }
    ];

    const input = createMockInput({
      foodSolverResult: createMockN32Result({ items: customItems })
    });

    const res = assembleMeals(input);
    assert.strictEqual(res.valid, true);

    const allocatedGramsWhey = res.meals.reduce((acc, m) => {
      const it = m.items.find(i => i.foodId === 'cust_whey_blend');
      return acc + (it ? it.grams : 0);
    }, 0);

    assert.strictEqual(allocatedGramsWhey, 40);
  });

});

// ============================================================================
// GRUPO D: Algoritmo de Assembly e Fragmentação
// ============================================================================
test('Fase N3.3 — Grupo D: Assembly e Fragmentação Controlada', async (t) => {

  await t.test('21. Itens pequenos (massa < minimumPreferredSplitMass) são mantidos inteiros sem fragmentar', () => {
    const input = createMockInput({ mealsPerDay: 3 });
    const res = assembleMeals(input);

    // Banana (100g) tem massa >= 80g no default, mas se alterarmos minimumPreferredSplitMass para 120g:
    const customPolicy = { minimumPreferredSplitMass: 120 };
    const resPolicy = assembleMeals(input, customPolicy);

    // Banana tem 100g < 120g -> Não pode ser fragmentada!
    let bananaAppearances = 0;
    resPolicy.meals.forEach(m => {
      if (m.items.some(it => it.foodId === 'FOOD_F1')) {
        bananaAppearances++;
      }
    });

    assert.strictEqual(bananaAppearances, 1, 'Banana não deve ser fragmentada quando abaixo do limite de política');
  });

  await t.test('22. Bases volumosas (Arroz 300g, Frango 200g) são distribuídas deterministicamente entre refeições primárias', () => {
    const input = createMockInput({ mealsPerDay: 3 });
    const res = assembleMeals(input);

    // Arroz (300g) e Frango (200g) são >= 80g e são divididos entre as refeições primárias (meal_1 e meal_2)
    const meal1HasChicken = res.meals[0].items.some(it => it.foodId === 'FOOD_P1');
    const meal2HasChicken = res.meals[1].items.some(it => it.foodId === 'FOOD_P1');

    assert.ok(meal1HasChicken && meal2HasChicken, 'Frango 200g deve ser compartilhado entre refeições primárias');
  });

  await t.test('23. Empate determinístico resolvido por menos fragmentações e ordem de alocação', () => {
    const policy = DEFAULT_MEAL_ASSEMBLY_POLICY;
    assert.deepStrictEqual(policy.tieBreakOrder, [
      'LOWEST_COST',
      'FEWEST_SPLITS',
      'LEXICOGRAPHICAL_ALLOCATION'
    ]);
  });

  await t.test('24. Solução global do N3.2 é mantida intacta sem recálculo de metas N2.1/N2.2', () => {
    const input = createMockInput();
    const res = assembleMeals(input);
    assert.strictEqual(res.solverVersion, 'N3.2.0');
    assert.strictEqual(res.globalTotals.calories, 915.5);
  });

  await t.test('25. N3.3 NÃO seleciona alimentos novos nem consulta catálogo', () => {
    const input = createMockInput();
    const res = assembleMeals(input);

    const allAllocatedIds = new Set();
    res.meals.forEach(m => m.items.forEach(it => allAllocatedIds.add(it.foodId)));

    // Apenas os 4 alimentos originais estão presentes
    assert.strictEqual(allAllocatedIds.size, 4);
    assert.ok(allAllocatedIds.has('FOOD_P1'));
    assert.ok(allAllocatedIds.has('FOOD_C1'));
    assert.ok(allAllocatedIds.has('FOOD_L1'));
    assert.ok(allAllocatedIds.has('FOOD_F1'));
  });

});

// ============================================================================
// GRUPO E: Contexto e Preferências
// ============================================================================
test('Fase N3.3 — Grupo E: Contexto e Preferências', async (t) => {

  await t.test('26. mealsPerDay estruturado no contexto (rotina) é respeitado com precedência', () => {
    const input = createMockInput({ mealsPerDay: 4 });
    const res = assembleMeals(input);
    assert.strictEqual(res.meals.length, 4);
    assert.ok(res.diagnostics.some(d => d.includes('Contexto (Rotina)')));
  });

  await t.test('27. Ausência de mealsPerDay formal gera WARNING explícito e usa fallback computacional (3)', () => {
    const input = createMockInput();
    delete input.context.patient.routine.mealsPerDay;

    const res = assembleMeals(input);
    assert.strictEqual(res.status, ASSEMBLY_STATUS.WARNING);
    assert.strictEqual(res.meals.length, 3);
    assert.ok(res.warnings.some(w => w.includes('fallback computacional')));
  });

  await t.test('28. Preferência estruturada de rotina respeitada para diferentes valores válidos (ex: 2 e 5)', () => {
    [2, 5].forEach(num => {
      const input = createMockInput({ mealsPerDay: num });
      const res = assembleMeals(input);
      assert.strictEqual(res.meals.length, num);
    });
  });

  await t.test('29. Texto livre ou observações clínicas no contexto NÃO são interpretados', () => {
    const input = createMockInput({ mealsPerDay: 3 });
    input.context.patient.observations = 'paciente quer comer 6 vezes ao dia e treina em jejum';

    const res = assembleMeals(input);
    // Deve ignorar o texto livre e usar o campo estruturado mealsPerDay = 3
    assert.strictEqual(res.meals.length, 3);
  });

});

// ============================================================================
// GRUPO F: Determinismo Estrito e Imutabilidade
// ============================================================================
test('Fase N3.3 — Grupo F: Determinismo Estrito e Imutabilidade', async (t) => {

  await t.test('30. Dez execuções sucessivas com a mesma entrada produzem saída idêntica (deepStrictEqual)', () => {
    const input = createMockInput({ mealsPerDay: 3 });
    const firstRun = assembleMeals(input);

    for (let i = 0; i < 10; i++) {
      const subsequentRun = assembleMeals(input);
      assert.deepStrictEqual(subsequentRun, firstRun);
    }
  });

  await t.test('31. Inversão ou embaralhamento dos itens do N3.2 produz exatamente a mesma saída (invariância)', () => {
    const inputNormal = createMockInput({ mealsPerDay: 3 });
    const normalRun = assembleMeals(inputNormal);

    // Inverte a ordem dos itens da entrada
    const reversedItems = [...inputNormal.foodSolverResult.meals[0].items].reverse();
    const inputReversed = createMockInput({
      mealsPerDay: 3,
      foodSolverResult: createMockN32Result({ items: reversedItems })
    });
    const reversedRun = assembleMeals(inputReversed);

    assert.deepStrictEqual(reversedRun, normalRun);
  });

  await t.test('32. Objeto de saída e sub-estruturas estão profundamente congelados (Object.isFrozen)', () => {
    const input = createMockInput();
    const res = assembleMeals(input);

    assert.ok(Object.isFrozen(res));
    assert.ok(Object.isFrozen(res.meals));
    assert.ok(Object.isFrozen(res.meals[0]));
    assert.ok(Object.isFrozen(res.meals[0].items));
    assert.ok(Object.isFrozen(res.meals[0].items[0]));
    assert.ok(Object.isFrozen(res.globalTotals));
    assert.ok(Object.isFrozen(res.provenance));
  });

  await t.test('33. DEFAULT_MEAL_ASSEMBLY_POLICY e sub-estruturas estão profundamente congeladas', () => {
    assert.ok(Object.isFrozen(DEFAULT_MEAL_ASSEMBLY_POLICY));
    assert.ok(Object.isFrozen(DEFAULT_MEAL_ASSEMBLY_POLICY.weights));
    assert.ok(Object.isFrozen(DEFAULT_MEAL_ASSEMBLY_POLICY.tolerances));
    assert.ok(Object.isFrozen(DEFAULT_MEAL_ASSEMBLY_POLICY.tieBreakOrder));
  });

});

// ============================================================================
// GRUPO G: Pureza Arquitetural e Proibições Estritas
// ============================================================================
test('Fase N3.3 — Grupo G: Pureza Arquitetural e Proibições Estritas', async (t) => {

  const mealDir = path.join(__dirname, '..', 'domain', 'meal');

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

  const allMealCode = readAllCodeInDir(mealDir);

  await t.test('34. Auditoria estática: Proibição estrita de CANONICAL_DIET_FOODS', () => {
    assert.ok(!allMealCode.includes('CANONICAL_DIET_FOODS'), 'Meal Assembly não pode referenciar CANONICAL_DIET_FOODS');
  });

  await t.test('35. Auditoria estática: Proibição estrita de Math.random() e Date.now()', () => {
    assert.ok(!allMealCode.includes('Math.random'), 'Meal Assembly não pode usar Math.random()');
    assert.ok(!allMealCode.includes('Date.now()'), 'Meal Assembly não pode usar Date.now() para lógica');
  });

  await t.test('36. Auditoria estática: Proibição estrita de window e document (DOM)', () => {
    assert.ok(!allMealCode.includes('document.'), 'Meal Assembly não pode acessar DOM document');
    assert.ok(!allMealCode.includes('window.'), 'Meal Assembly não pode acessar DOM window');
  });

  await t.test('37. Auditoria estática: Proibição estrita de Gemini e IA', () => {
    assert.ok(!allMealCode.includes('Gemini'), 'Meal Assembly não pode invocar Gemini');
    assert.ok(!allMealCode.includes('generateContent'), 'Meal Assembly não pode invocar IA');
  });

  await t.test('38. Auditoria estática: Proibição estrita de escrita no Dexie', () => {
    assert.ok(!allMealCode.includes('db.meals.put'), 'Meal Assembly não pode gravar no Dexie');
    assert.ok(!allMealCode.includes('db.meals.add'), 'Meal Assembly não pode gravar no Dexie');
    assert.ok(!allMealCode.includes('db.prescriptions'), 'Meal Assembly não pode gravar prescrições');
  });

  await t.test('39. Auditoria estática: Proibição estrita de escrita no Firebase', () => {
    assert.ok(!allMealCode.includes('firebase'), 'Meal Assembly não pode interagir com Firebase');
  });

  await t.test('40. Auditoria estática: Proibição de semântica clínica e temporal em domain/meal', () => {
    const prohibitedTerms = [
      'pré-treino',
      'pre-treino',
      'pós-treino',
      'pos-treino',
      'hipertrofia',
      'emagrecimento',
      'jejum',
      'cardio',
      'treino'
    ];

    prohibitedTerms.forEach(term => {
      assert.ok(
        !allMealCode.toLowerCase().includes(term.toLowerCase()),
        `domain/meal não pode conter o termo clínico/temporal '${term}'.`
      );
    });
  });

  await t.test('41. Sódio: Conservação exata quando todos os itens possuem sódio conhecido', () => {
    const input = createMockInput({ mealsPerDay: 3 });
    const res = assembleMeals(input);

    assert.strictEqual(res.globalTotals.sodium, 156);
    const allocatedSodium = res.meals.reduce((acc, m) => acc + m.totals.sodium, 0);
    assert.strictEqual(allocatedSodium, 156);
  });

  await t.test('42. Sódio: Preserva null e registra SODIUM_DATA_INCOMPLETE quando algum item tem sódio ausente', () => {
    const itemsWithoutSodium = [
      {
        foodId: 'FOOD_P1',
        foodName: 'Frango',
        quantity: 100,
        grams: 100,
        unit: 'g',
        nutrients: { calories: 150, protein: 30, carbohydrate: 0, lipid: 2, fiber: 0, sodium: 50 }
      },
      {
        foodId: 'FOOD_C1',
        foodName: 'Mandioca',
        quantity: 100,
        grams: 100,
        unit: 'g',
        nutrients: { calories: 125, protein: 1, carbohydrate: 30, lipid: 0.2, fiber: 2, sodium: null }
      }
    ];

    const input = createMockInput({
      foodSolverResult: createMockN32Result({ items: itemsWithoutSodium })
    });

    const res = assembleMeals(input);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.globalTotals.sodium, null);
    assert.strictEqual(res.meals[0].totals.sodium, null);
    assert.ok(res.diagnostics.some(d => d.includes('SODIUM_DATA_INCOMPLETE')));
  });

});
