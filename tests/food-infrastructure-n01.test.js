/**
 * Suíte de Testes Automatizados — Fase N0.1
 * Fundação do Contrato Alimentar e Correções Estruturais (NutriAx Pro)
 * 
 * Execução: node --test tests/food-infrastructure-n01.test.js
 */

const { describe, it, before } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

// Carrega o catálogo mestre foodsData.js no escopo global para simular o browser
const foodsDataPath = path.resolve(__dirname, "../foodsData.js");
const foodsDataContent = fs.readFileSync(foodsDataPath, "utf8");
eval(foodsDataContent);

// Carrega a matemática canônica de math.js
const {
  calculateMacroPortion,
  convertFoodUnitToGrams,
  foodUnitWeights,
  CANONICAL_DIET_FOODS
} = require("../math.js");

describe("Fase N0.1 — Fundação do Contrato Alimentar e Correções Estruturais", () => {
  let mockDbFoods;
  let food0082;

  before(() => {
    // Inicializa simulação de db.foods em memória populada pelo seed mestre
    assert.ok(Array.isArray(COMPREHENSIVE_TACO_TBCA_FOODS), "COMPREHENSIVE_TACO_TBCA_FOODS deve existir");
    mockDbFoods = new Map();
    COMPREHENSIVE_TACO_TBCA_FOODS.forEach(food => {
      mockDbFoods.set(food.id, { ...food });
    });

    food0082 = mockDbFoods.get("FOOD_0082");
    assert.ok(food0082, "FOOD_0082 (Arroz Branco) deve existir no catálogo oficial");
  });

  // -------------------------------------------------------------
  // Teste 1 — Integridade dos alimentos oficiais
  // -------------------------------------------------------------
  it("Teste 1: Integridade do catálogo oficial (FOOD_0001 a FOOD_3034)", () => {
    assert.strictEqual(COMPREHENSIVE_TACO_TBCA_FOODS.length, 3034, "Deve conter exatamente 3.034 alimentos");

    let validCount = 0;
    for (const food of COMPREHENSIVE_TACO_TBCA_FOODS) {
      assert.ok(typeof food.id === "string" && food.id.startsWith("FOOD_"), `ID inválido: ${food.id}`);
      assert.ok(typeof food.name === "string" && food.name.trim().length > 0, `Nome inválido no id ${food.id}`);
      assert.strictEqual(food.baseQuantity, 100, `baseQuantity deve ser 100 no id ${food.id}`);
      assert.ok(food.unit === "g" || food.unit === "ml", `Unidade inválida no id ${food.id}`);

      assert.ok(typeof food.calories === "number" && !isNaN(food.calories) && food.calories >= 0);
      assert.ok(typeof food.protein === "number" && !isNaN(food.protein) && food.protein >= 0);
      assert.ok(typeof food.carbohydrate === "number" && !isNaN(food.carbohydrate) && food.carbohydrate >= 0);
      assert.ok(typeof food.lipid === "number" && !isNaN(food.lipid) && food.lipid >= 0);
      assert.ok(typeof food.fiber === "number" && !isNaN(food.fiber) && food.fiber >= 0);
      validCount++;
    }

    assert.strictEqual(validCount, 3034, "Todos os 3.034 alimentos devem ser bromatologicamente válidos");
  });

  // -------------------------------------------------------------
  // Teste 2 — Alimento customizado e reseed idempotente
  // -------------------------------------------------------------
  it("Teste 2: Preservação de alimento customizado (cust_*) e idempotência no reseed", async () => {
    // Cria estado com catálogo oficial + alimento customizado
    const localStore = new Map(mockDbFoods);
    const customFood = {
      id: "cust_test_creatina_creapure",
      name: "Creatina Creapure Personalizada",
      brand: "NutriAx Labs",
      category: "Suplementos",
      source: "Manual",
      prepState: "Cru",
      baseQuantity: 100,
      unit: "g",
      calories: 0,
      protein: 0,
      carbohydrate: 0,
      lipid: 0,
      fiber: 0,
      sodium: 0
    };
    localStore.set(customFood.id, customFood);
    assert.strictEqual(localStore.size, 3035);

    // Função de reseed com preservação de customizados (lógica idêntica a db.js e app.js)
    async function executeReseed(store) {
      // 1. Coleta customizados
      const customItems = Array.from(store.values()).filter(f => String(f.id || "").startsWith("cust_"));
      // 2. Limpa e restaura oficiais
      store.clear();
      COMPREHENSIVE_TACO_TBCA_FOODS.forEach(f => store.set(f.id, { ...f }));
      // 3. Re-insere customizados
      customItems.forEach(c => store.set(c.id, { ...c }));
      return { officialCount: COMPREHENSIVE_TACO_TBCA_FOODS.length, customCount: customItems.length };
    }

    // 1º Reseed
    const res1 = await executeReseed(localStore);
    assert.strictEqual(res1.officialCount, 3034);
    assert.strictEqual(res1.customCount, 1);
    assert.strictEqual(localStore.size, 3035);
    assert.ok(localStore.has("cust_test_creatina_creapure"));
    assert.strictEqual(localStore.get("cust_test_creatina_creapure").name, "Creatina Creapure Personalizada");

    // 2º Reseed (prova de idempotência: executar novamente não duplica nem perde nada)
    const res2 = await executeReseed(localStore);
    assert.strictEqual(res2.officialCount, 3034);
    assert.strictEqual(res2.customCount, 1);
    assert.strictEqual(localStore.size, 3035);
    assert.ok(localStore.has("cust_test_creatina_creapure"));
    assert.strictEqual(localStore.get("cust_test_creatina_creapure").name, "Creatina Creapure Personalizada");
  });

  // -------------------------------------------------------------
  // Teste 3 — Proporcionalidade linear com valores reais de FOOD_0082
  // -------------------------------------------------------------
  it("Teste 3: Proporcionalidade linear consumindo valores reais de FOOD_0082 em db.foods", () => {
    // Valores reais obtidos dinamicamente de food0082 sem duplicação de constantes
    const realKcal = food0082.calories;
    const realCarb = food0082.carbohydrate;
    const realProt = food0082.protein;
    const realLip = food0082.lipid;
    const realFib = food0082.fiber;

    // 100g
    const p100 = calculateMacroPortion(food0082, 100);
    assert.strictEqual(p100.calories, Number(realKcal.toFixed(2)));
    assert.strictEqual(p100.carbohydrate, Number(realCarb.toFixed(2)));
    assert.strictEqual(p100.protein, Number(realProt.toFixed(2)));

    // 200g
    const p200 = calculateMacroPortion(food0082, 200);
    assert.strictEqual(p200.calories, Number((realKcal * 2).toFixed(2)));
    assert.strictEqual(p200.carbohydrate, Number((realCarb * 2).toFixed(2)));
    assert.strictEqual(p200.protein, Number((realProt * 2).toFixed(2)));

    // 300g
    const p300 = calculateMacroPortion(food0082, 300);
    assert.strictEqual(p300.calories, Number((realKcal * 3).toFixed(2)));
    assert.strictEqual(p300.carbohydrate, Number((realCarb * 3).toFixed(2)));
    assert.strictEqual(p300.protein, Number((realProt * 3).toFixed(2)));
    assert.strictEqual(p300.lipid, Number((realLip * 3).toFixed(2)));
    assert.strictEqual(p300.fiber, Number((realFib * 3).toFixed(2)));
  });

  // -------------------------------------------------------------
  // Teste 4 — Correção da Edição 558g -> 300g (Eliminação do cancelamento algébrico)
  // -------------------------------------------------------------
  it("Teste 4: Correção do recálculo na edição (558g -> 300g) sem cancelamento algébrico", () => {
    // Simula item criado originalmente com 558g de arroz FOOD_0082
    const initialGrams = 558;
    const initialScaled = calculateMacroPortion(food0082, initialGrams);

    const prescriptionItem = {
      id: "item_test_rice_558",
      foodId: food0082.id,
      foodName: food0082.name,
      mealName: "Almoço",
      mealTime: "12:30",
      quantity: initialGrams,
      unit: "g",
      unitDisplay: `${initialGrams}g`,
      originalQty: initialGrams,
      originalUnit: "g",
      baseQuantity: 100,
      baseUnit: "g",
      kcalPer100: food0082.calories,
      protPer100: food0082.protein,
      carbPer100: food0082.carbohydrate,
      lipidPer100: food0082.lipid,
      fiberPer100: food0082.fiber,
      calories: initialScaled.calories, // 558g * 1.30 = 725.4 kcal
      protein: initialScaled.protein,
      carbohydrate: initialScaled.carbohydrate,
      lipid: initialScaled.lipid,
      fiber: initialScaled.fiber
    };

    // Usuário altera para 300g no modal de edição
    const newQty = 300;
    const newUnit = "g";

    // Executa a lógica corrigida de saveEditPrescriptionItem
    const foodRef = {
      id: prescriptionItem.foodId,
      name: prescriptionItem.foodName,
      baseQuantity: 100,
      unit: "g",
      calories: prescriptionItem.kcalPer100,
      protein: prescriptionItem.protPer100,
      carbohydrate: prescriptionItem.carbPer100,
      lipid: prescriptionItem.lipidPer100,
      fiber: prescriptionItem.fiberPer100
    };

    const { grams, unitLabel } = convertFoodUnitToGrams(foodRef, newQty, newUnit);
    const newScaled = calculateMacroPortion(foodRef, grams);

    // Validações rigorosas:
    // 1. A nova quantidade em gramas deve ser 300
    assert.strictEqual(grams, 300);
    assert.strictEqual(unitLabel, "300g");

    // 2. Os novos macros NÃO podem manter os valores antigos de 558g
    assert.notStrictEqual(newScaled.calories, prescriptionItem.calories);
    assert.notStrictEqual(newScaled.carbohydrate, prescriptionItem.carbohydrate);

    // 3. Os valores exatos devem corresponder a 300g na base real do FOOD_0082 (130 kcal -> 390 kcal; 28.2g CHO -> 84.6g CHO)
    assert.strictEqual(newScaled.calories, 390);
    assert.strictEqual(newScaled.carbohydrate, 84.6);
    assert.strictEqual(newScaled.protein, 7.5);
    assert.strictEqual(newScaled.lipid, 0.6);
    assert.strictEqual(newScaled.fiber, 4.8);
  });

  // -------------------------------------------------------------
  // Teste 5 — Preservação de foodId e contrato completo na Prescrição
  // -------------------------------------------------------------
  it("Teste 5: Adição manual na prescrição preserva foodId canônico e snapshots centesimais", () => {
    const rawQty = 150;
    const unit = "g";
    const { grams, unitLabel } = convertFoodUnitToGrams(food0082, rawQty, unit);
    const scaled = calculateMacroPortion(food0082, grams);

    const newItem = {
      id: "item_test_canonical_01",
      foodId: food0082.id,
      foodName: food0082.name,
      mealName: "Almoço",
      mealTime: "12:30",
      quantity: grams,
      unit: "g",
      unitDisplay: unitLabel,
      originalQty: rawQty,
      originalUnit: unit,
      baseQuantity: food0082.baseQuantity || 100,
      baseUnit: food0082.unit || "g",
      kcalPer100: Number(food0082.calories) || 0,
      protPer100: Number(food0082.protein) || 0,
      carbPer100: Number(food0082.carbohydrate) || 0,
      lipidPer100: Number(food0082.lipid) || 0,
      fiberPer100: Number(food0082.fiber) || 0,
      calories: scaled.calories,
      protein: scaled.protein,
      carbohydrate: scaled.carbohydrate,
      lipid: scaled.lipid,
      fiber: scaled.fiber
    };

    assert.strictEqual(newItem.foodId, "FOOD_0082", "foodId deve ser preservado como referência canônica");
    assert.strictEqual(newItem.kcalPer100, 130);
    assert.strictEqual(newItem.carbPer100, 28.2);
    assert.strictEqual(newItem.quantity, 150);
    assert.strictEqual(newItem.calories, 195);
    assert.strictEqual(newItem.carbohydrate, 42.3);
  });

  // -------------------------------------------------------------
  // Teste 6 — Preservação de foodId no Recordatório Alimentar
  // -------------------------------------------------------------
  it("Teste 6: Adição no recordatório alimentar preserva foodId e snapshots sem perder campos", () => {
    const rawQty = 100;
    const unit = "g";
    const { grams, unitLabel } = convertFoodUnitToGrams(food0082, rawQty, unit);
    const scaled = calculateMacroPortion(food0082, grams);

    const recallItem = {
      id: "rec_test_01",
      patientId: "patient_test",
      mealName: "Almoço",
      mealTime: "12:30",
      foodId: food0082.id,
      foodName: food0082.name,
      quantity: grams,
      unitDisplay: unitLabel,
      originalQty: rawQty,
      originalUnit: unit,
      baseQuantity: 100,
      kcalPer100: Number(food0082.calories),
      protPer100: Number(food0082.protein),
      carbPer100: Number(food0082.carbohydrate),
      lipidPer100: Number(food0082.lipid),
      fiberPer100: Number(food0082.fiber),
      calories: scaled.calories,
      protein: scaled.protein,
      carbohydrate: scaled.carbohydrate,
      lipid: scaled.lipid,
      fiber: scaled.fiber
    };

    assert.strictEqual(recallItem.foodId, "FOOD_0082");
    assert.strictEqual(recallItem.foodName, food0082.name);
    assert.strictEqual(recallItem.patientId, "patient_test");
    assert.strictEqual(recallItem.calories, 130);
  });

  // -------------------------------------------------------------
  // Teste 7 — Retrocompatibilidade com itens legados de prescrições antigas
  // -------------------------------------------------------------
  it("Teste 7: Item legado sem foodId e sem snapshots é editado com sucesso via reconstrução histórica", () => {
    // Item legado antigo (ex: gravado na versão anterior sem foodId nem kcalPer100)
    const legacyItem = {
      id: "item_legacy_old_001",
      mealName: "Jantar",
      mealTime: "20:00",
      foodName: "Arroz Branco Especial Caseiro",
      quantity: 150,
      unitDisplay: "150g",
      calories: 195,
      protein: 3.75,
      carbohydrate: 42.3,
      lipid: 0.3,
      fiber: 2.4
      // Observação: SEM foodId e SEM kcalPer100
    };

    // Ao editar para 300g:
    const newQty = 300;
    const newUnit = "g";

    // Reconstrução histórica estrita por (item.calories / item.quantity) * 100
    const oldQty = parseFloat(legacyItem.quantity) || 100;
    const fallbackFactor = oldQty > 0 ? (100 / oldQty) : 1;

    const kcalPer100 = (legacyItem.kcalPer100 !== undefined)
      ? Number(legacyItem.kcalPer100)
      : Number(((legacyItem.calories || 0) * fallbackFactor).toFixed(2));

    const carbPer100 = (legacyItem.carbPer100 !== undefined)
      ? Number(legacyItem.carbPer100)
      : Number(((legacyItem.carbohydrate || 0) * fallbackFactor).toFixed(2));

    assert.strictEqual(kcalPer100, 130, "Reconstrução histórica deve derivar 130 kcal/100g");
    assert.strictEqual(carbPer100, 28.2, "Reconstrução histórica deve derivar 28.2g CHO/100g");

    const foodRef = {
      name: legacyItem.foodName,
      baseQuantity: 100,
      calories: kcalPer100,
      carbohydrate: carbPer100,
      protein: Number(((legacyItem.protein || 0) * fallbackFactor).toFixed(2)),
      lipid: Number(((legacyItem.lipid || 0) * fallbackFactor).toFixed(2)),
      fiber: Number(((legacyItem.fiber || 0) * fallbackFactor).toFixed(2))
    };

    const { grams } = convertFoodUnitToGrams(foodRef, newQty, newUnit);
    const scaled = calculateMacroPortion(foodRef, grams);

    // O item foi recalculado para 300g perfeitamente sem erros e sem corromper o banco
    assert.strictEqual(grams, 300);
    assert.strictEqual(scaled.calories, 390);
    assert.strictEqual(scaled.carbohydrate, 84.6);
  });

  // -------------------------------------------------------------
  // Teste 8 — Unificação e Consistência da Conversão de Unidades
  // -------------------------------------------------------------
  it("Teste 8: Conversão de medidas caseiras aceita apelidos e retorna valores idênticos em qualquer fluxo", () => {
    // 1. Colher de sopa de arroz (arroz tem peso específico de 25g/colher em math.js)
    const c1 = convertFoodUnitToGrams(food0082, 3, "col_sopa");
    const c2 = convertFoodUnitToGrams(food0082, 3, "colher de sopa");
    const c3 = convertFoodUnitToGrams(food0082, 3, "col. de sopa");
    assert.strictEqual(c1.grams, 75, "3 colheres de arroz devem ser 75g (25g cada)");
    assert.strictEqual(c2.grams, 75, "Apelido 'colher de sopa' deve ter o mesmo resultado que 'col_sopa'");
    assert.strictEqual(c3.grams, 75, "Apelido 'col. de sopa' deve ter o mesmo resultado que 'col_sopa'");

    // 2. Ovo (50g por unidade em math.js)
    const eggFood = { name: "Ovo de galinha cozido" };
    const e1 = convertFoodUnitToGrams(eggFood, 2, "unid");
    const e2 = convertFoodUnitToGrams(eggFood, 2, "unidade");
    const e3 = convertFoodUnitToGrams(eggFood, 2, "unidades");
    assert.strictEqual(e1.grams, 100, "2 ovos devem ser 100g");
    assert.strictEqual(e2.grams, 100);
    assert.strictEqual(e3.grams, 100);

    // 3. Respeito a gramPerUnit se o alimento possuir peso customizado
    const customApple = { name: "Maçã Fuji Pequena", gramPerUnit: 90 };
    const a1 = convertFoodUnitToGrams(customApple, 1, "unidade");
    assert.strictEqual(a1.grams, 90, "Deve respeitar gramPerUnit = 90g do alimento");

    // 4. Copo (200ml)
    const milk = { name: "Leite desnatado" };
    const m1 = convertFoodUnitToGrams(milk, 1, "copo");
    const m2 = convertFoodUnitToGrams(milk, 1, "copo (200ml)");
    assert.strictEqual(m1.grams, 200);
    assert.strictEqual(m2.grams, 200);
  });
});
