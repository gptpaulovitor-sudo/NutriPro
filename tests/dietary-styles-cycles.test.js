/**
 * tests/dietary-styles-cycles.test.js
 * 
 * Suíte de Testes Automatizados para Estilos Dietéticos Clínicos e Ciclos/Fases:
 * 1. Low Carb (Restrita, Moderada, Liberal)
 * 2. Cetogênica (SKD, CKD Refeed, TKD)
 * 3. Dukan (Ataque PP, Cruzeiro PL, Consolidação)
 * 4. Whole30 (Eliminação, Reintrodução)
 * 5. Blacklist Culinária Universal (Açúcar, BCAA, Banha, etc.)
 * 6. Suplementação Estratégica (Whey Protein on/off)
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

const { calculateDeterministicMacroTargets } = require('../domain/math/macroTarget');
const { filterEligibleFoods, evaluateFoodEligibility } = require('../domain/solver/foodEligibility');
const { solveNutritionDiet } = require('../domain/solver/foodSolver');
const { CANONICAL_DIET_FOODS } = require('../math');

// Base Mock Context
function createMockPatientContext(weightKg = 70, age = 30) {
  return {
    schemaVersion: '1.0.0',
    patient: {
      patientId: 'pat_test_01',
      name: 'Paciente Teste',
      age: age,
      sex: 'M',
      patientType: 'Praticante recreativo'
    },
    anthropometry: {
      weightKg: weightKg,
      heightCm: 175,
      bodyFatPercent: 15,
      leanMassKg: 59.5
    },
    objective: {
      clinicalObjective: 'Perda de peso',
      category: 'weightLoss'
    },
    energy: {
      caloricTargetKcal: 2000,
      tmbKcal: 1700,
      getKcal: 2300,
      source: 'N2.1_DIRECT_RESULT'
    },
    training: { hasActiveTraining: true },
    cardio: { hasActiveCardio: false },
    constraints: {},
    routine: { mealsPerDay: 4 },
    provenance: { version: 'N1.1.0' }
  };
}

// Catalog with canonical foods and test edge cases
const mockCatalog = [
  ...Object.entries(CANONICAL_DIET_FOODS).map(([key, f]) => ({
    id: `canon_${key}`,
    foodId: `canon_${key}`,
    name: f.name,
    calories: f.calories,
    protein: f.protein,
    carbohydrate: f.carbohydrate,
    lipid: f.lipid,
    fiber: f.fiber || 0,
    sodium: f.sodium || 0,
    unit: 'g',
    baseUnit: 'g',
    category: f.category || 'Alimento',
    bromatology: { energyStatus: 'CONSISTENTE' }
  })),
  // Non-meal industrial foods that MUST be blacklisted
  { id: 'sugar_01', foodId: 'sugar_01', name: 'Açúcar Cristal', calories: 387, protein: 0.3, carbohydrate: 99.5, lipid: 0, unit: 'g', baseUnit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
  { id: 'sugar_02', foodId: 'sugar_02', name: 'Açúcar Refinado', calories: 386, protein: 0.3, carbohydrate: 99.4, lipid: 0, unit: 'g', baseUnit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
  { id: 'bcaa_01', foodId: 'bcaa_01', name: 'BCAA em Pó 2:1:1', calories: 400, protein: 100, carbohydrate: 0, lipid: 0, unit: 'g', baseUnit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
  { id: 'glut_01', foodId: 'glut_01', name: 'Glutamina Isolada', calories: 400, protein: 100, carbohydrate: 0, lipid: 0, unit: 'g', baseUnit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
  { id: 'fat_01', foodId: 'fat_01', name: 'Banha de Porco', calories: 902, protein: 0, carbohydrate: 0, lipid: 100, unit: 'g', baseUnit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
  { id: 'soda_01', foodId: 'soda_01', name: 'Refrigerante tipo Cola', calories: 150, protein: 0, carbohydrate: 38, lipid: 0, unit: 'g', baseUnit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } }
];

describe('1. Governança Culinária e Blacklist Universal', () => {

  test('Açúcar refinado e cristal são estritamente inelegíveis para refeições clínicas', () => {
    const sugar1 = mockCatalog.find(f => f.id === 'sugar_01');
    const sugar2 = mockCatalog.find(f => f.id === 'sugar_02');
    const eval1 = evaluateFoodEligibility(sugar1);
    const eval2 = evaluateFoodEligibility(sugar2);
    assert.strictEqual(eval1.isEligible, false);
    assert.strictEqual(eval2.isEligible, false);
    assert.ok(eval1.reasons.some(r => r.includes('industrial') || r.includes('açúcar')));
  });

  test('Aminoácidos e pós isolados (BCAA, Glutamina) são estritamente inelegíveis', () => {
    const bcaa = mockCatalog.find(f => f.id === 'bcaa_01');
    const glut = mockCatalog.find(f => f.id === 'glut_01');
    const evalBcaa = evaluateFoodEligibility(bcaa);
    const evalGlut = evaluateFoodEligibility(glut);
    assert.strictEqual(evalBcaa.isEligible, false);
    assert.strictEqual(evalGlut.isEligible, false);
    assert.ok(evalBcaa.reasons.some(r => r.includes('aminoácido') || r.includes('ergogênico')));
  });

  test('Gorduras industriais de fritura (Banha de Porco) e refrigerantes são estritamente inelegíveis', () => {
    const banha = mockCatalog.find(f => f.id === 'fat_01');
    const soda = mockCatalog.find(f => f.id === 'soda_01');
    const evalBanha = evaluateFoodEligibility(banha);
    const evalSoda = evaluateFoodEligibility(soda);
    assert.strictEqual(evalBanha.isEligible, false);
    assert.strictEqual(evalSoda.isEligible, false);
  });

  test('Alimentos canônicos reais (Frango, Arroz, Feijão, Ovos, Azeite) são 100% elegíveis', () => {
    const frango = mockCatalog.find(f => /frango/i.test(f.name));
    const arroz = mockCatalog.find(f => /arroz/i.test(f.name));
    const feijao = mockCatalog.find(f => /feij[aã]o/i.test(f.name));
    const ovos = mockCatalog.find(f => /ovo/i.test(f.name));
    const azeite = mockCatalog.find(f => /azeite/i.test(f.name));
    assert.ok(frango, 'Frango deve existir no catálogo');
    assert.ok(evaluateFoodEligibility(frango).isEligible);
    assert.ok(evaluateFoodEligibility(arroz).isEligible);
    assert.ok(evaluateFoodEligibility(feijao).isEligible);
    assert.ok(evaluateFoodEligibility(ovos).isEligible);
    assert.ok(evaluateFoodEligibility(azeite).isEligible);
  });

});

describe('2. Metas Determinísticas por Protocolo e Ciclos (N2.2)', () => {

  const context = createMockPatientContext(70);
  const energyTarget = { caloricTargetKcal: 2000, source: 'N2.1' };

  test('Cetogênica Padrão (SKD): Carboidratos fixos em 25g e alta proporção de lipídios', () => {
    const result = calculateDeterministicMacroTargets(context, energyTarget, {
      dietaryStyle: 'cetogenica',
      dietaryCycle: 'keto_padrao'
    });
    assert.strictEqual(result.status, 'PASS');
    assert.strictEqual(result.carbohydrateTargetG, 25);
    assert.strictEqual(result.proteinTargetG, Math.round(70 * 1.8)); // 126g
    assert.ok(result.fatTargetG >= 140, `Gordura (${result.fatTargetG}g) deve ser elevada para fechar 2000 kcal`);
    assert.strictEqual(result.energyDifferenceKcal, 0);
  });

  test('Cetogênica Cíclica (CKD Refeed): Recarga glicídica (alto carboidrato, baixa gordura)', () => {
    const result = calculateDeterministicMacroTargets(context, energyTarget, {
      dietaryStyle: 'cetogenica',
      dietaryCycle: 'keto_ciclica_refeed'
    });
    assert.strictEqual(result.status, 'PASS');
    assert.ok(result.carbohydrateTargetG >= 250, 'Carboidratos devem ser altos no dia de refeed');
    assert.ok(result.fatTargetG <= 40, 'Gorduras devem ser controladas no dia de refeed');
    assert.strictEqual(result.energyDifferenceKcal, 0);
  });

  test('Cetogênica Direcionada (TKD): Aporte moderado para suporte ao treino (~45g)', () => {
    const result = calculateDeterministicMacroTargets(context, energyTarget, {
      dietaryStyle: 'cetogenica',
      dietaryCycle: 'keto_direcionada'
    });
    assert.strictEqual(result.status, 'PASS');
    assert.strictEqual(result.carbohydrateTargetG, 45);
    assert.strictEqual(result.energyDifferenceKcal, 0);
  });

  test('Low Carb Restrita / Indução: Carbs em ~60g e proteína 2.0 g/kg', () => {
    const result = calculateDeterministicMacroTargets(context, energyTarget, {
      dietaryStyle: 'lowcarb',
      dietaryCycle: 'lowcarb_restrita'
    });
    assert.strictEqual(result.status, 'PASS');
    assert.strictEqual(result.carbohydrateTargetG, 60);
    assert.strictEqual(result.proteinTargetG, Math.round(70 * 2.0)); // 140g
    assert.strictEqual(result.energyDifferenceKcal, 0);
  });

  test('Low Carb Moderada: Carbs em 100g e proteína 1.8 g/kg', () => {
    const result = calculateDeterministicMacroTargets(context, energyTarget, {
      dietaryStyle: 'lowcarb',
      dietaryCycle: 'lowcarb_moderada'
    });
    assert.strictEqual(result.status, 'PASS');
    assert.strictEqual(result.carbohydrateTargetG, 100);
    assert.strictEqual(result.proteinTargetG, Math.round(70 * 1.8)); // 126g
    assert.strictEqual(result.energyDifferenceKcal, 0);
  });

  test('Dukan Ataque (PP): Proteína pura maciça (~2.3 g/kg), carboidrato mínimo (~15g) e gordura baixa', () => {
    const result = calculateDeterministicMacroTargets(context, energyTarget, {
      dietaryStyle: 'dukan',
      dietaryCycle: 'dukan_ataque'
    });
    assert.strictEqual(result.status, 'PASS');
    assert.strictEqual(result.proteinTargetG, Math.round(70 * 2.3)); // 161g
    assert.strictEqual(result.carbohydrateTargetG, 15);
    assert.ok(result.fatTargetG <= 30, 'Gordura deve ser muito baixa na fase de ataque');
    assert.strictEqual(result.energyDifferenceKcal, 0);
  });

  test('Dukan Cruzeiro (PL): Proteína + Legumes (~40g carbs sem amido)', () => {
    const result = calculateDeterministicMacroTargets(context, energyTarget, {
      dietaryStyle: 'dukan',
      dietaryCycle: 'dukan_cruzeiro_pl'
    });
    assert.strictEqual(result.status, 'PASS');
    assert.strictEqual(result.proteinTargetG, Math.round(70 * 2.1)); // 147g
    assert.strictEqual(result.carbohydrateTargetG, 40);
    assert.strictEqual(result.energyDifferenceKcal, 0);
  });

  test('Whole30: Proteína 2.0 g/kg, gordura 35% do VET e carbs limpos residuais', () => {
    const result = calculateDeterministicMacroTargets(context, energyTarget, {
      dietaryStyle: 'whole30',
      dietaryCycle: 'whole30_eliminacao'
    });
    assert.strictEqual(result.status, 'PASS');
    assert.strictEqual(result.proteinTargetG, Math.round(70 * 2.0)); // 140g
    assert.ok(result.carbohydrateTargetG > 0);
    assert.ok(result.fatTargetG > 0);
    assert.strictEqual(result.energyDifferenceKcal, 0);
  });

});

describe('3. Filtros e Elegibilidade por Estilo e Ciclo', () => {

  test('Cetogênica: Arroz, feijão, pão, batata e aveia são bloqueados', () => {
    const arroz = mockCatalog.find(f => /arroz/i.test(f.name));
    const feijao = mockCatalog.find(f => /feij[aã]o/i.test(f.name));
    const pao = mockCatalog.find(f => /p[aã]o/i.test(f.name));
    const batata = mockCatalog.find(f => /batata/i.test(f.name));
    const azeite = mockCatalog.find(f => /azeite/i.test(f.name));
    const ovos = mockCatalog.find(f => /ovo/i.test(f.name));

    const ketoOpts = { dietaryStyle: 'cetogenica', dietaryCycle: 'keto_padrao' };
    assert.strictEqual(evaluateFoodEligibility(arroz, undefined, ketoOpts).isEligible, false);
    assert.strictEqual(evaluateFoodEligibility(feijao, undefined, ketoOpts).isEligible, false);
    assert.strictEqual(evaluateFoodEligibility(pao, undefined, ketoOpts).isEligible, false);
    assert.strictEqual(evaluateFoodEligibility(batata, undefined, ketoOpts).isEligible, false);
    assert.strictEqual(evaluateFoodEligibility(azeite, undefined, ketoOpts).isEligible, true);
    assert.strictEqual(evaluateFoodEligibility(ovos, undefined, ketoOpts).isEligible, true);
  });

  test('Whole30: Grãos, leguminosas e laticínios são bloqueados; carnes, ovos, batata doce e azeite são permitidos', () => {
    const arroz = mockCatalog.find(f => /arroz/i.test(f.name));
    const feijao = mockCatalog.find(f => /feij[aã]o/i.test(f.name));
    const queijo = mockCatalog.find(f => /cottage|minas/i.test(f.name));
    const batata = mockCatalog.find(f => /batata\s+doce/i.test(f.name));
    const frango = mockCatalog.find(f => /frango/i.test(f.name));
    const azeite = mockCatalog.find(f => /azeite/i.test(f.name));

    const wholeOpts = { dietaryStyle: 'whole30', dietaryCycle: 'whole30_eliminacao' };
    assert.strictEqual(evaluateFoodEligibility(arroz, undefined, wholeOpts).isEligible, false);
    assert.strictEqual(evaluateFoodEligibility(feijao, undefined, wholeOpts).isEligible, false);
    assert.strictEqual(evaluateFoodEligibility(queijo, undefined, wholeOpts).isEligible, false);
    assert.strictEqual(evaluateFoodEligibility(batata, undefined, wholeOpts).isEligible, true);
    assert.strictEqual(evaluateFoodEligibility(frango, undefined, wholeOpts).isEligible, true);
    assert.strictEqual(evaluateFoodEligibility(azeite, undefined, wholeOpts).isEligible, true);
  });

  test('Dukan Ataque (PP): Somente proteínas magras e farelo de aveia; vegetais, frutas e arroz são bloqueados', () => {
    const frango = mockCatalog.find(f => /frango/i.test(f.name));
    const tilapia = mockCatalog.find(f => /til[aá]pia/i.test(f.name));
    const arroz = mockCatalog.find(f => /arroz/i.test(f.name));
    const banana = mockCatalog.find(f => /banana/i.test(f.name));
    const brocolis = mockCatalog.find(f => /br[oó]colis/i.test(f.name));

    const dukanAtaqueOpts = { dietaryStyle: 'dukan', dietaryCycle: 'dukan_ataque' };
    assert.strictEqual(evaluateFoodEligibility(frango, undefined, dukanAtaqueOpts).isEligible, true);
    assert.strictEqual(evaluateFoodEligibility(tilapia, undefined, dukanAtaqueOpts).isEligible, true);
    assert.strictEqual(evaluateFoodEligibility(arroz, undefined, dukanAtaqueOpts).isEligible, false);
    assert.strictEqual(evaluateFoodEligibility(banana, undefined, dukanAtaqueOpts).isEligible, false);
    assert.strictEqual(evaluateFoodEligibility(brocolis, undefined, dukanAtaqueOpts).isEligible, false);
  });

  test('Dukan Cruzeiro (PL): Vegetais sem amido (brócolis, salada) tornam-se elegíveis', () => {
    const brocolis = mockCatalog.find(f => /br[oó]colis/i.test(f.name));
    const arroz = mockCatalog.find(f => /arroz/i.test(f.name));
    const dukanPLOpts = { dietaryStyle: 'dukan', dietaryCycle: 'dukan_cruzeiro_pl' };

    assert.strictEqual(evaluateFoodEligibility(brocolis, undefined, dukanPLOpts).isEligible, true);
    assert.strictEqual(evaluateFoodEligibility(arroz, undefined, dukanPLOpts).isEligible, false);
  });

  test('Opção de Suplemento (Whey Protein) respeita includeSupplements: false', () => {
    const whey = mockCatalog.find(f => /whey/i.test(f.name));
    if (whey) {
      assert.strictEqual(evaluateFoodEligibility(whey, undefined, { includeSupplements: false }).isEligible, false);
      assert.strictEqual(evaluateFoodEligibility(whey, undefined, { includeSupplements: true }).isEligible, true);
    }
  });

});

describe('4. Resolução Completa do Solver com Dietas Especiais', () => {

  const context = createMockPatientContext(70);

  test('Prescrição Cetogênica gera dieta com alimentos cetogênicos e fecha metas', () => {
    const energyTarget = { caloricTargetKcal: 1800, source: 'N2.1' };
    const macroTarget = calculateDeterministicMacroTargets(context, energyTarget, {
      dietaryStyle: 'cetogenica',
      dietaryCycle: 'keto_padrao'
    });

    const solverInput = {
      context,
      energyTarget,
      macroTarget,
      validationResult: { valid: true, status: 'PASS' },
      foodCatalog: mockCatalog,
      options: {
        dietaryStyle: 'cetogenica',
        dietaryCycle: 'keto_padrao'
      }
    };

    const solution = solveNutritionDiet(solverInput, {});
    assert.strictEqual(solution.valid, true);
    assert.ok(['PASS', 'WARNING'].includes(solution.status));
    
    // Todos os alimentos da solução devem ser estritamente cetogênicos
    const items = solution.meals[0].items;
    assert.ok(items.length >= 3, 'Deve gerar pelo menos 3 alimentos estruturados');
    for (const item of items) {
      const name = item.foodName.toLowerCase();
      assert.ok(!/arroz|feij[aã]o|p[aã]o|tapioca|a[çc][uú]car|bcaa/i.test(name), `Alimento inadequado em dieta keto: ${name}`);
    }
  });

  test('Prescrição Whole30 gera dieta sem grãos, sem leguminosas e sem laticínios', () => {
    const energyTarget = { caloricTargetKcal: 1900, source: 'N2.1' };
    const macroTarget = calculateDeterministicMacroTargets(context, energyTarget, {
      dietaryStyle: 'whole30',
      dietaryCycle: 'whole30_eliminacao'
    });

    const solverInput = {
      context,
      energyTarget,
      macroTarget,
      validationResult: { valid: true, status: 'PASS' },
      foodCatalog: mockCatalog,
      options: {
        dietaryStyle: 'whole30',
        dietaryCycle: 'whole30_eliminacao'
      }
    };

    const solution = solveNutritionDiet(solverInput, {});
    assert.strictEqual(solution.valid, true);
    assert.ok(['PASS', 'WARNING'].includes(solution.status));

    const items = solution.meals[0].items;
    assert.ok(items.length >= 3, 'Deve gerar pelo menos 3 alimentos estruturados');
    for (const item of items) {
      const name = item.foodName.toLowerCase();
      assert.ok(!/arroz|feij[aã]o|leite|queijo|cottage|iogurte|p[aã]o|a[çc][uú]car/i.test(name), `Alimento inadequado em Whole30: ${name}`);
    }
  });

});
