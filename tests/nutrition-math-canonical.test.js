/**
 * =========================================================================
 * NutriAx Pro — Suíte de Testes de Equivalência do Motor Matemático Canônico
 * Arquivo: tests/nutrition-math-canonical.test.js
 * Fase 3: Equivalência entre math.js legado e domain/math canônico
 * =========================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 1. Carrega motor matemático canônico
const canonical = require('../domain/math/nutritionMath');

// 2. Carrega motor legado math.js em sandbox limpo para comparação direta
const mathJsCode = fs.readFileSync(path.join(__dirname, '../math.js'), 'utf8');
const legacyContext = { Math, Number, parseFloat, parseInt, isNaN };
vm.createContext(legacyContext);
vm.runInContext(mathJsCode, legacyContext);

console.log('======================================================');
console.log('Fase 3: Testes de Equivalência — Motor Matemático Canônico');
console.log('======================================================');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Detalhe: ${err.message}`);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. EQUIVALÊNCIA: IMC (Índice de Massa Corporal)
// ─────────────────────────────────────────────────────────────────────────────

test('CANONICAL-IMC 1.1: Equivalência estrita com math.js para adulto eutrófico', () => {
  const legacy = legacyContext.calculateIMC(70, 1.75);
  const canon = canonical.calculateIMC(70, 1.75);

  assert.strictEqual(canon.imc, legacy.imc);
  assert.strictEqual(canon.classification, legacy.classification);
  assert.strictEqual(canon.imc, 22.86);
  assert.strictEqual(canon.classification, 'Eutrofia / Adequado');
});

test('CANONICAL-IMC 1.2: Equivalência para atleta obeso grau I por IMC (Paulo Vitor 116kg / 1.96m)', () => {
  const legacy = legacyContext.calculateIMC(116, 1.96);
  const canon = canonical.calculateIMC(116, 1.96);

  assert.strictEqual(canon.imc, legacy.imc);
  assert.strictEqual(canon.classification, legacy.classification);
  assert.strictEqual(canon.imc, 30.2);
  assert.strictEqual(canon.classification, 'Obesidade Grau I');
});

test('CANONICAL-IMC 1.3: Alias calculateBMI idêntico a calculateIMC', () => {
  assert.strictEqual(typeof canonical.calculateBMI, 'function');
  const res = canonical.calculateBMI(80, 1.80);
  assert.strictEqual(res.imc, 24.69);
});

test('CANONICAL-IMC 1.4: Entradas nulas ou inválidas retornam fallback seguro', () => {
  const canonZero = canonical.calculateIMC(0, 0);
  const legacyZero = legacyContext.calculateIMC(0, 0);
  assert.strictEqual(canonZero.imc, legacyZero.imc);
  assert.strictEqual(canonZero.classification, 'Dados insuficientes');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. EQUIVALÊNCIA: TMB (Katch-McArdle e Mifflin-St Jeor)
// ─────────────────────────────────────────────────────────────────────────────

test('CANONICAL-TMB 2.1: Katch-McArdle prioritário quando há massa magra (LBM = 80kg)', () => {
  const legacy = legacyContext.calculateTMB('Masculino', 30, 100, 1.80, 80);
  const canon = canonical.calculateTMB('Masculino', 30, 100, 1.80, 80);

  assert.strictEqual(canon.tmb, legacy.tmb);
  assert.strictEqual(canon.tmb, 2098);
  assert.strictEqual(canon.method, 'Katch-McArdle (Massa Magra)');
});

test('CANONICAL-TMB 2.2: Katch-McArdle para atleta de alto rendimento (LBM = 108.55kg)', () => {
  const legacy = legacyContext.calculateTMB('Masculino', 38, 116, 1.96, 108.55);
  const canon = canonical.calculateTMB('Masculino', 38, 116, 1.96, 108.55);

  assert.strictEqual(canon.tmb, legacy.tmb);
  assert.strictEqual(canon.tmb, 2714.68);
});

test('CANONICAL-TMB 2.3: Mifflin-St Jeor Homem sem massa magra informada', () => {
  const legacy = legacyContext.calculateTMB('Masculino', 30, 70, 1.75, 0);
  const canon = canonical.calculateTMB('Masculino', 30, 70, 1.75, 0);

  assert.strictEqual(canon.tmb, legacy.tmb);
  assert.strictEqual(canon.tmb, 1648.75);
  assert.strictEqual(canon.method, 'Mifflin-St Jeor');
});

test('CANONICAL-TMB 2.4: Mifflin-St Jeor Mulher sem massa magra informada', () => {
  const legacy = legacyContext.calculateTMB('Feminino', 28, 60, 1.65, 0);
  const canon = canonical.calculateTMB('Feminino', 28, 60, 1.65, 0);

  assert.strictEqual(canon.tmb, legacy.tmb);
  assert.strictEqual(canon.tmb, 1330.25);
  assert.strictEqual(canon.method, 'Mifflin-St Jeor');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. EQUIVALÊNCIA: GET (Gasto Energético Total) & Análise do Fator 1.42
// ─────────────────────────────────────────────────────────────────────────────

test('CANONICAL-GET 3.1: Equivalência com Fator de Atividade Padrão (1.42)', () => {
  const legacy = legacyContext.calculateGET(2000, 1.42);
  const canon = canonical.calculateGET(2000, 1.42);

  assert.strictEqual(canon, legacy);
  assert.strictEqual(canon, 2840);
});

test('CANONICAL-GET 3.2: Fator padrão 1.42 adotado automaticamente quando omitido', () => {
  const canonDefault = canonical.calculateGET(2000);
  assert.strictEqual(canonDefault, 2840);
});

test('CANONICAL-GET 3.3: Equivalência com diferentes Fatores de Atividade (1.2 a 1.9)', () => {
  [1.2, 1.375, 1.55, 1.725, 1.9].forEach(fa => {
    const legacy = legacyContext.calculateGET(1850, fa);
    const canon = canonical.calculateGET(1850, fa);
    assert.strictEqual(canon, legacy, `GET para FA ${fa} deve ser rigorosamente idêntico`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. CANÔNICO: Alvo Calórico e Balanço Energético
// ─────────────────────────────────────────────────────────────────────────────

test('CANONICAL-TARGET 4.1: caloricTargetKcal usa prescrição ativa quando existente', () => {
  const res = canonical.calculateCaloricTarget(2300, 2840);
  assert.strictEqual(res.caloricTargetKcal, 2300);
  assert.strictEqual(res.source, 'PRESCRIBED');
});

test('CANONICAL-TARGET 4.2: caloricTargetKcal adota fallback GET quando não há prescrição', () => {
  const resNull = canonical.calculateCaloricTarget(null, 2840);
  assert.strictEqual(resNull.caloricTargetKcal, 2840);
  assert.strictEqual(resNull.source, 'GET_FALLBACK');

  const resZero = canonical.calculateCaloricTarget(0, 2600);
  assert.strictEqual(resZero.caloricTargetKcal, 2600);
  assert.strictEqual(resZero.source, 'GET_FALLBACK');
});

test('CANONICAL-BALANCE 4.3: energyBalanceKcal calcula déficit, superávit e manutenção', () => {
  // Déficit
  const deficit = canonical.calculateEnergyBalance(2300, 2840);
  assert.strictEqual(deficit.energyBalanceKcal, -540);
  assert.strictEqual(deficit.status, 'DEFICIT');

  // Superávit
  const surplus = canonical.calculateEnergyBalance(3200, 2840);
  assert.strictEqual(surplus.energyBalanceKcal, 360);
  assert.strictEqual(surplus.status, 'SURPLUS');

  // Manutenção
  const maint = canonical.calculateEnergyBalance(2850, 2840);
  assert.strictEqual(maint.energyBalanceKcal, 10);
  assert.strictEqual(maint.status, 'MAINTENANCE');
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. EQUIVALÊNCIA: Composição Corporal (Jackson-Pollock 7 Dobras + Siri)
// ─────────────────────────────────────────────────────────────────────────────

test('CANONICAL-COMP 5.1: Jackson-Pollock 7 dobras para Homem com soma moderada', () => {
  const skinfolds = {
    chest: 10,
    axillary: 12,
    triceps: 10,
    subscapular: 14,
    abdominal: 18,
    suprailiac: 12,
    thigh: 16
  };

  const legacy = legacyContext.calculateBodyComposition('Masculino', 30, 80, 1.80, skinfolds);
  const canon = canonical.calculateBodyComposition('Masculino', 30, 80, 1.80, skinfolds);

  assert.strictEqual(canon.sumSkinfolds, legacy.sumSkinfolds);
  assert.strictEqual(canon.bodyDensity, legacy.bodyDensity);
  assert.strictEqual(canon.bodyFatPercent, legacy.bodyFatPercent);
  assert.strictEqual(canon.leanMassKg, legacy.leanMassKg);
  assert.strictEqual(canon.fatMassKg, legacy.fatMassKg);
  assert.strictEqual(canon.ffmi, legacy.ffmi);
});

test('CANONICAL-COMP 5.2: Jackson-Pollock 7 dobras para Mulher com dobras equivalentes', () => {
  const skinfolds = {
    chest: 14,
    axillary: 16,
    triceps: 18,
    subscapular: 16,
    abdominal: 22,
    suprailiac: 20,
    thigh: 24
  };

  const legacy = legacyContext.calculateBodyComposition('Feminino', 25, 60, 1.65, skinfolds);
  const canon = canonical.calculateBodyComposition('Feminino', 25, 60, 1.65, skinfolds);

  assert.strictEqual(canon.sumSkinfolds, legacy.sumSkinfolds);
  assert.strictEqual(canon.bodyDensity, legacy.bodyDensity);
  assert.strictEqual(canon.bodyFatPercent, legacy.bodyFatPercent);
  assert.strictEqual(canon.leanMassKg, legacy.leanMassKg);
  assert.strictEqual(canon.fatMassKg, legacy.fatMassKg);
});

test('CANONICAL-COMP 5.3: Clamp inferior de segurança da fórmula de Siri (mínimo 3%)', () => {
  const skinfoldsAtletaExtremo = {
    chest: 1, axillary: 1, triceps: 1, subscapular: 1, abdominal: 1, suprailiac: 1, thigh: 1
  };

  const canon = canonical.calculateBodyComposition('Masculino', 20, 75, 1.80, skinfoldsAtletaExtremo);
  assert.ok(canon.bodyFatPercent >= 3.0, 'Percentual de gordura nunca deve ser inferior ao clamp biológico de 3%');
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. EQUIVALÊNCIA: Índices Antropométricos (RCQ, RCEst, MME, AMBc)
// ─────────────────────────────────────────────────────────────────────────────

test('CANONICAL-INDICES 6.1: RCQ (Relação Cintura-Quadril) e classificação de risco', () => {
  // Homem no limiar de risco (cintura 92cm, quadril 100cm -> RCQ 0.92)
  const canonMale = canonical.calculateAnthropometricIndices({
    waistCm: 92, hipCm: 100, heightM: 1.80, weightKg: 85, leanMassKg: 70, gender: 'Masculino', age: 30
  });
  assert.strictEqual(canonMale.rcq, 0.92);
  assert.strictEqual(canonMale.rcqClassification, 'Atenção / Risco aumentado');

  // Homem faixa adequada (cintura 82cm, quadril 100cm -> RCQ 0.82)
  const canonMaleOk = canonical.calculateAnthropometricIndices({
    waistCm: 82, hipCm: 100, heightM: 1.80, weightKg: 80, leanMassKg: 68, gender: 'Masculino', age: 30
  });
  assert.strictEqual(canonMaleOk.rcq, 0.82);
  assert.strictEqual(canonMaleOk.rcqClassification, 'Adequado');
});

test('CANONICAL-INDICES 6.2: RCEst e classificação de risco cardiometabólico', () => {
  assert.strictEqual(canonical.classifyRCEst(0.38), 'Magreza extrema / Atenção');
  assert.strictEqual(canonical.classifyRCEst(0.46), 'Ideal / Baixo risco cardiovascular');
  assert.strictEqual(canonical.classifyRCEst(0.55), 'Risco aumentado / Sobrepeso-Adiposidade central');
  assert.strictEqual(canonical.classifyRCEst(0.65), 'Risco altamente elevado');

  const legacyClass = legacyContext.classifyRCEst(0.46);
  assert.strictEqual(canonical.classifyRCEst(0.46), legacyClass);
});

test('CANONICAL-INDICES 6.3: MME (Lee et al.) e AMBc equivalentes ao legado', () => {
  const legacy = legacyContext.calculateAnthropometricIndices(82, 100, 1.80, 80, 68, 'Masculino', 30, 34, 10, 38);
  const canon = canonical.calculateAnthropometricIndices({
    waistCm: 82, hipCm: 100, heightM: 1.80, weightKg: 80, leanMassKg: 68, gender: 'Masculino', age: 30,
    armCircCm: 34, tricepsFoldMm: 10, calfCircCm: 38
  });

  assert.strictEqual(canon.skeletalMuscleMassKg, legacy.skeletalMuscleMassKg);
  assert.strictEqual(canon.armMuscularArea, legacy.armMuscularArea);
  assert.strictEqual(canon.conicityIndex, legacy.conicityIndex);
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. EQUIVALÊNCIA: Porcionamento de Macros e Fatores de Atwater
// ─────────────────────────────────────────────────────────────────────────────

test('CANONICAL-PORTION 7.1: Porcionamento linear na base 100g/ml', () => {
  const food = {
    name: 'Frango Grelhado',
    baseQuantity: 100,
    calories: 165,
    protein: 31.0,
    carbohydrate: 0.0,
    lipid: 3.6,
    fiber: 0.0,
    sodium: 74.0
  };

  const legacyPortion = legacyContext.calculateMacroPortion(food, 150);
  const canonPortion = canonical.calculateMacroPortion(food, 150);

  assert.deepStrictEqual(JSON.parse(JSON.stringify(canonPortion)), JSON.parse(JSON.stringify(legacyPortion)));
  assert.strictEqual(canonPortion.calories, 247.5);
  assert.strictEqual(canonPortion.protein, 46.5);
  assert.strictEqual(canonPortion.lipid, 5.4);
  assert.strictEqual(canonPortion.sodium, 111);
});

test('CANONICAL-PORTION 7.2: Densidade de macronutrientes por kg de peso corporal', () => {
  const density = canonical.calculateMacrosPerKg(160, 80);
  assert.strictEqual(density, 2.0);
});

test('CANONICAL-PORTION 7.3: calculateDietaryMacroTargets para Hipertrofia e Déficit', () => {
  const targetsLoss = canonical.calculateDietaryMacroTargets('Perda de peso', 'Praticante recreativo', 80, 2600, 'Masculino');
  assert.strictEqual(targetsLoss.targetProtKg, 2.0);
  assert.strictEqual(targetsLoss.targetProtG, 160);
  assert.strictEqual(targetsLoss.caloricTarget, 2600 - 468);

  const targetsGain = canonical.calculateDietaryMacroTargets('Hipertrofia', 'Praticante recreativo', 80, 2600, 'Masculino');
  assert.strictEqual(targetsGain.targetProtKg, 1.8);
  assert.strictEqual(targetsGain.targetProtG, 144);
  assert.strictEqual(targetsGain.caloricTarget, 2600 + 350);
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. EQUIVALÊNCIA: Projeção Preditiva de Metas (calculateGoalProjection)
// ─────────────────────────────────────────────────────────────────────────────

test('CANONICAL-PROJECTION 8.1: Projeção preditiva para atleta em recomposição/perda', () => {
  const legacy = legacyContext.calculateGoalProjection(116.0, 15.0, 10.0, 4207, 3739);
  const canon = canonical.calculateGoalProjection(116.0, 15.0, 10.0, 4207, 3739);

  assert.strictEqual(canon.targetWeightKg, legacy.targetWeightKg);
  assert.strictEqual(canon.targetFatMassKg, legacy.targetFatMassKg);
  assert.strictEqual(canon.fatToLoseKg, legacy.fatToLoseKg);
  assert.strictEqual(canon.dailyDeficitKcal, legacy.dailyDeficitKcal);
  assert.strictEqual(canon.dailyDeficitKcal, 468);
  assert.strictEqual(canon.weeksNeeded, legacy.weeksNeeded);
  assert.strictEqual(canon.statusBadge, legacy.statusBadge);
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. CASOS DE BORDA E REGRAS ESPECIAIS (Adolescentes, Idosos e Limites)
// ─────────────────────────────────────────────────────────────────────────────

test('EDGE-CASES 9.1: Regra para Paciente Adolescente (idade < 18 anos)', () => {
  // Teste com paciente de 15 anos: deve calcular TMB e sinalizar flag informativo de revisão
  const teen = canonical.calculateTMB('Masculino', 15, 60, 1.70, 0);

  assert.strictEqual(teen.isAdolescent, true);
  assert.strictEqual(teen.clinicalReviewRequired, true);
  assert.ok(teen.tmb > 1000);
  // Não introduz fórmula pediátrica inventada
  assert.strictEqual(teen.method, 'Mifflin-St Jeor');
});

test('EDGE-CASES 9.2: Paciente Idoso (75 anos)', () => {
  const elderly = canonical.calculateTMB('Feminino', 75, 58, 1.55, 0);
  assert.strictEqual(elderly.isAdolescent, false);
  assert.ok(elderly.tmb > 900 && elderly.tmb < 1400);
});

test('EDGE-CASES 9.3: Peso e Altura fora de limites biológicos disparam fallbacks limpos', () => {
  const invalidImc = canonical.calculateIMC(-80, -1.80);
  assert.strictEqual(invalidImc.imc, 0);
  assert.strictEqual(invalidImc.classification, 'Dados insuficientes');

  const zeroFallbackTmb = canonical.calculateTMB('Masculino', 0, 0, 0, 0);
  assert.strictEqual(zeroFallbackTmb.tmb, 1648.75);

  const extremeNegativeTmb = canonical.calculateTMB('Masculino', 30, -200, 1.75, 0);
  assert.strictEqual(extremeNegativeTmb.tmb, 1500); // Fallback de segurança de Mifflin <= 0
});

console.log('======================================================');
console.log(`📊 Resultado Final dos Testes da Fase 3: ${passedTests}/${totalTests} passaram.`);
console.log('======================================================');
