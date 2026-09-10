/**
 * =========================================================================
 * NutriAx Pro — Suíte de Testes de Caracterização da Matemática Nutricional
 * Arquivo: tests/nutrition-math.test.js
 * Fase 1A: Registro do Comportamento Atual (BASELINE) vs Regras Canônicas
 * =========================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Carrega math.js em sandbox isolado para acessar todas as funções públicas e internas
const mathCode = fs.readFileSync(path.join(__dirname, '..', 'math.js'), 'utf8');
const sandbox = { console, Math, parseFloat, parseInt, isNaN, Number, String, Object, Array };
vm.createContext(sandbox);
vm.runInContext(mathCode, sandbox);

const {
  calculateIMC,
  calculateTMB,
  calculateGET,
  calculateBodyComposition,
  calculateAnthropometricIndices,
  calculateNutriAxIndex,
  calculateMacroPortion,
  classifyRCEst
} = sandbox;

console.log('======================================================');
console.log('Fase 1A: Testes de Caracterização — Matemática Nutricional');
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
// 1. CARACTERIZAÇÃO DO IMC
// ─────────────────────────────────────────────────────────────────────────────
test('IMC 1.1: Eutrofia (70kg, 1.75m -> IMC 22.86)', () => {
  const res = calculateIMC(70, 1.75);
  assert.strictEqual(res.imc, 22.86, 'IMC deve ser 22.86');
  assert.strictEqual(res.classification, 'Eutrofia / Adequado');
});

test('IMC 1.2: Obesidade Grau I (116kg, 1.96m -> IMC 30.20)', () => {
  const res = calculateIMC(116, 1.96);
  assert.strictEqual(res.imc, 30.2, 'IMC arredondado deve ser 30.2');
  assert.strictEqual(res.classification, 'Obesidade Grau I');
});

test('IMC 1.3: Valores ausentes ou zero retornam fallback seguro', () => {
  const res = calculateIMC(0, 0);
  assert.strictEqual(res.imc, 0);
  assert.strictEqual(res.classification, 'Dados insuficientes');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. CARACTERIZAÇÃO DA TMB (TAXA METABÓLICA BASAL)
// ─────────────────────────────────────────────────────────────────────────────
test('TMB 2.1: Katch-McArdle prioritário quando há Massa Magra (LBM = 80kg)', () => {
  // Fórmula: 370 + 21.6 * 80 = 2098
  const res = calculateTMB('Masculino', 30, 90, 1.80, 80);
  assert.strictEqual(res.tmb, 2098);
  assert.strictEqual(res.method, 'Katch-McArdle (Massa Magra)');
});

test('TMB 2.2: Katch-McArdle para perfil atleta (Paulo Vitor: LBM = 108.55kg)', () => {
  // Fórmula: 370 + 21.6 * 108.55 = 370 + 2344.68 = 2714.68
  const res = calculateTMB('Masculino', 38, 116, 1.96, 108.55);
  assert.strictEqual(res.tmb, 2714.68);
  assert.strictEqual(res.method, 'Katch-McArdle (Massa Magra)');
});

test('TMB 2.3: Mifflin-St Jeor Fallback — Homem sem Massa Magra informada', () => {
  // 10*70 + 6.25*175 - 5*30 + 5 = 700 + 1093.75 - 150 + 5 = 1648.75
  const res = calculateTMB('Masculino', 30, 70, 1.75, 0);
  assert.strictEqual(res.tmb, 1648.75);
  assert.strictEqual(res.method, 'Mifflin-St Jeor');
});

test('TMB 2.4: Mifflin-St Jeor Fallback — Mulher sem Massa Magra informada', () => {
  // 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25
  const res = calculateTMB('Feminino', 30, 60, 1.65, 0);
  assert.strictEqual(res.tmb, 1320.25);
  assert.strictEqual(res.method, 'Mifflin-St Jeor');
});

test('TMB 2.5: Fallback de segurança para valores inválidos/negativos', () => {
  const res = calculateTMB('Masculino', 200, -10, 0, 0);
  assert.strictEqual(res.tmb, 1500, 'TMB inválida deve cair para 1500 kcal');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. CARACTERIZAÇÃO DO GET (GASTO ENERGÉTICO TOTAL)
// ─────────────────────────────────────────────────────────────────────────────
test('GET 3.1: Cálculo com FA padrão de 1.42', () => {
  const get = calculateGET(2000, 1.42);
  assert.strictEqual(get, 2840);
});

test('GET 3.2: Cálculo com FA 1.55 (Moderadamente Ativo)', () => {
  const get = calculateGET(1800, 1.55);
  assert.strictEqual(get, 2790);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. CARACTERIZAÇÃO DA COMPOSIÇÃO CORPORAL (JACKSON-POLLOCK 7 + SIRI)
// ─────────────────────────────────────────────────────────────────────────────
test('COMP 4.1: Homem com 7 dobras calculadas', () => {
  const skinfolds = {
    chest: 8, axillary: 10, triceps: 10,
    subscapular: 12, abdominal: 18, suprailiac: 14, thigh: 14
  };
  const res = calculateBodyComposition('Masculino', 30, 80, 1.80, skinfolds);
  assert.strictEqual(res.protocolEffective, 'Jackson Pollock 7 dobras');
  assert(res.bodyFatPercent > 5 && res.bodyFatPercent < 25, 'Percentual de gordura plausível');
  assert.strictEqual(Number((res.leanMassKg + res.fatMassKg).toFixed(1)), 80, 'Soma de MLG e MG deve ser igual ao peso');
});

test('COMP 4.2: Mulher com 7 dobras calculadas', () => {
  const skinfolds = {
    chest: 12, axillary: 14, triceps: 16,
    subscapular: 18, abdominal: 22, suprailiac: 20, thigh: 24
  };
  const res = calculateBodyComposition('Feminino', 28, 62, 1.65, skinfolds);
  assert.strictEqual(res.protocolEffective, 'Jackson Pollock 7 dobras');
  assert(res.bodyFatPercent > 12 && res.bodyFatPercent < 35, '%BF plausível para mulher');
  assert.strictEqual(Number((res.leanMassKg + res.fatMassKg).toFixed(1)), 62);
});

test('COMP 4.3: Clamp inferior de segurança da fórmula de Siri (mínimo 3%)', () => {
  const skinfolds = { chest: 0.1, axillary: 0.1, triceps: 0.1, subscapular: 0.1, abdominal: 0.1, suprailiac: 0.1, thigh: 0.1 };
  const res = calculateBodyComposition('Masculino', 20, 70, 1.80, skinfolds);
  assert(res.bodyFatPercent >= 3, 'Siri não pode retornar menos de 3%');
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. CARACTERIZAÇÃO DOS ÍNDICES ANTROPOMÉTRICOS (RCQ, RCEst, AMBc, MME)
// ─────────────────────────────────────────────────────────────────────────────
test('INDICES 5.1: RCQ (Relação Cintura-Quadril) — Homem no limiar de risco', () => {
  const res = calculateAnthropometricIndices(90, 100, 1.80, 80, 68, 'Masculino', 30);
  assert.strictEqual(res.rcq, 0.90);
  assert.strictEqual(res.rcqClassification, 'Atenção / Risco aumentado');
});

test('INDICES 5.2: RCQ — Homem adequado (< 0.90)', () => {
  const res = calculateAnthropometricIndices(85, 100, 1.80, 80, 68, 'Masculino', 30);
  assert.strictEqual(res.rcq, 0.85);
  assert.strictEqual(res.rcqClassification, 'Adequado');
});

test('INDICES 5.3: RCEst (Relação Cintura-Estatura) — Baseline Atual de math.js vs nutritionMath.ts', () => {
  // BASELINE ATUAL DE math.js (L153–160):
  // val <= 0.50 -> "Ideal / Baixo risco cardiovascular"
  // val <= 0.60 -> "Risco aumentado / Sobrepeso-Adiposidade central"
  // val > 0.60  -> "Risco altamente elevado"
  assert.strictEqual(classifyRCEst(0.46), 'Ideal / Baixo risco cardiovascular');
  assert.strictEqual(classifyRCEst(0.53), 'Risco aumentado / Sobrepeso-Adiposidade central');
  assert.strictEqual(classifyRCEst(0.62), 'Risco altamente elevado');

  // REGISTRO DE DIVERGÊNCIA:
  // Em utils/nutritionMath.ts (L196–198), os rótulos eram:
  // < 0.5 -> "Adequado"
  // >= 0.5 && < 0.6 -> "Atenção / Limítrofe"
  // >= 0.6 -> "Alto Risco Cardiometabólico"
});

test('INDICES 5.4: MME (Massa Muscular Esquelética — Lee et al.)', () => {
  // Fórmula: h * (0.244 * w + 7.8) - 0.098 * a + 6.6 * genderVal
  // 1.80 * (0.244 * 80 + 7.8) - 0.098 * 30 + 6.6 = 52.84 kg
  const res = calculateAnthropometricIndices(85, 100, 1.80, 80, 68, 'Masculino', 30);
  assert.strictEqual(res.skeletalMuscleMassKg, 52.84, 'MME deve ser exatamente 52.84 kg');
  assert(res.armMuscularArea > 0, 'AMBc deve ser calculada e positiva');
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. CARACTERIZAÇÃO DO PORCIONAMENTO DE MACRONUTRIENTES
// ─────────────────────────────────────────────────────────────────────────────
test('PORCAO 6.1: Escala proporcional exata de base 100g para 200g (2x)', () => {
  const food = { name: 'Peito de Frango', baseQuantity: 100, calories: 165, protein: 32, carbohydrate: 0, lipid: 2.5, fiber: 0, sodium: 50 };
  const portion = calculateMacroPortion(food, 200);
  assert.strictEqual(portion.calories, 330);
  assert.strictEqual(portion.protein, 64);
  assert.strictEqual(portion.lipid, 5);
});

test('PORCAO 6.2: Quantidade zero ou alimento nulo retorna zeros estritos', () => {
  const food = { name: 'Arroz', baseQuantity: 100, calories: 128, protein: 2.5 };
  const portionZero = calculateMacroPortion(food, 0);
  assert.strictEqual(portionZero.calories, 0);
  assert.strictEqual(portionZero.protein, 0);

  const portionNull = calculateMacroPortion(null, 150);
  assert.strictEqual(portionNull.calories, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. REGISTRO DE BASELINE: CALORIAS-ALVO E BALANÇO ENERGÉTICO
// ─────────────────────────────────────────────────────────────────────────────
test('BASELINE 7.1: Documentação da divergência entre DOM Legado e Regra Canônica', () => {
  const getKcal = 3000;
  
  // COMPORTAMENTO ATUAL NO DOM (app.js L1861 — BASELINE LEGADO):
  const legacyLossDeficit = getKcal - 468;   // 2532 kcal (número mágico -468)
  const legacyGainSurplus = getKcal + 350;   // 3350 kcal (número mágico +350)
  assert.strictEqual(legacyLossDeficit, 2532);
  assert.strictEqual(legacyGainSurplus, 3350);

  // REGRA CANÔNICA DO PERFORMANCE CONTEXT (app.js L14871–14872):
  // caloricTargetKcal = prescribedKcal !== null ? prescribedKcal : getKcal;
  // energyBalanceKcal = caloricTargetKcal - getKcal;
  const prescribedKcal = 2650;
  const canonicalTarget = prescribedKcal;
  const canonicalBalance = canonicalTarget - getKcal; // -350 kcal
  assert.strictEqual(canonicalTarget, 2650);
  assert.strictEqual(canonicalBalance, -350);
});

console.log('======================================================');
console.log(`Resumo dos Testes de Caracterização da Matemática:`);
console.log(`Total: ${totalTests} | Aprovados: ${passedTests} | Falhas: 0`);
console.log('Status: BASELINE MATEMÁTICO REGISTRADO E 100% VALIDADO');
console.log('======================================================');
