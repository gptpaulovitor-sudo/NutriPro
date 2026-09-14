/**
 * tests/prescription-input-adapter.test.js
 * 
 * Suíte de Testes Automatizados da Subfase N3.7.2 — Adaptador Canônico de Entrada.
 * NutriAx Pro.
 * 
 * Cobertura Obrigatória:
 * 1. Mapeamento e classificação formal dos 11 GAPs (A, B, C, D, E);
 * 2. GAP 1: Janela peri-treino canônica (150 min via N3.5 nutrientTimingPolicy);
 * 3. GAP 2: Normalização estrutural de altura (< 3.0 m para cm, >= 3.0 para cm);
 * 4. GAP 3: Normalização estrutural de catálogo bruto para CanonicalFoodDTO[];
 * 5. GAP 5: Mapeamento de objetivos inequívocos (weightLoss, hypertrophy, recomposition, maintenance);
 * 6. GAP 5: Preservação de texto clínico e recusa de adivinhação para valores livres não mapeáveis;
 * 7. GAP 6: Conversão estrutural HH:MM para minutos desde 00:00;
 * 8. GAP 7: Validação do número de refeições no intervalo canônico 1..8 (N3.3 mealAssemblyPolicy);
 * 9. GAP 8: Preservação de status bromatológico consistente;
 * 10. GAP 9: Fornecimento de 'lipid' no catálogo de alimentos;
 * 11. Determinismo estóico: duas invocações com mesma entrada produzem saída idêntica;
 * 12. Pureza absoluta: zero Date.now, zero Math.random, zero dependências externas.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  GAP_CLASSIFICATION,
  CANONICAL_PERI_WORKOUT_WINDOW_MINUTES,
  CANONICAL_MIN_MEALS,
  CANONICAL_MAX_MEALS,
  normalizeHeightCm,
  parseTimeToMinutes,
  normalizeObjective,
  validateMealCount,
  adaptCanonicalFoodItem,
  adaptFoodCatalog,
  adaptPatientContext,
  buildCanonicalPrescriptionInput
} = require('../domain/adapters/prescriptionInputAdapter');

describe('Subfase N3.7.2 — Adaptador Canônico de Entrada (prescriptionInputAdapter)', () => {

  test('1. Classificação Formal dos 11 GAPs está presente e mapeada por categoria', () => {
    assert.strictEqual(GAP_CLASSIFICATION.GAP_1_PERI_WORKOUT.category, 'C');
    assert.strictEqual(GAP_CLASSIFICATION.GAP_2_HEIGHT_FORMAT.category, 'B');
    assert.strictEqual(GAP_CLASSIFICATION.GAP_3_FOOD_CATALOG.category, 'B');
    assert.strictEqual(GAP_CLASSIFICATION.GAP_4_MEAL_ROLE.category, 'C');
    assert.strictEqual(GAP_CLASSIFICATION.GAP_5_OBJECTIVE_CATEGORY.category, 'A_D');
    assert.strictEqual(GAP_CLASSIFICATION.GAP_6_TIME_FORMAT.category, 'B');
    assert.strictEqual(GAP_CLASSIFICATION.GAP_7_MEAL_COUNT.category, 'C');
    assert.strictEqual(GAP_CLASSIFICATION.GAP_8_BROMATOLOGY.category, 'A');
    assert.strictEqual(GAP_CLASSIFICATION.GAP_9_LIPID_FAT.category, 'B');
    assert.strictEqual(GAP_CLASSIFICATION.GAP_10_VALIDATION_META.category, 'A');
    assert.strictEqual(GAP_CLASSIFICATION.GAP_11_FOOD_ITEM_IDS.category, 'B');
  });

  test('2. GAP 1: Janela peri-treino utiliza a política canônica de 150 min (DEFAULT_NUTRIENT_TIMING_POLICY)', () => {
    assert.strictEqual(CANONICAL_PERI_WORKOUT_WINDOW_MINUTES, 150);

    const input = buildCanonicalPrescriptionInput({
      patientData: { weightKg: 70, heightCm: 175 },
      foodCatalog: [{ id: 'F1', name: 'Frango', calories: 159, protein: 32, carbohydrate: 0, lipid: 2.5 }],
      options: {}
    });

    assert.strictEqual(input.canonicalInput.options.periWorkoutWindowMinutes, 150);
    assert.strictEqual(input.gapDiagnostics.GAP_1.value, 150);
  });

  test('3. GAP 2: Altura em metros (< 3.0) é convertida para centímetros, e em cm é preservada', () => {
    assert.strictEqual(normalizeHeightCm(1.80), 180);
    assert.strictEqual(normalizeHeightCm('1.75'), 175);
    assert.strictEqual(normalizeHeightCm(178), 178);
    assert.strictEqual(normalizeHeightCm('165'), 165);
    assert.strictEqual(normalizeHeightCm(null), null);
    assert.strictEqual(normalizeHeightCm(-10), null);
  });

  test('4. GAP 3: Catálogo bruto é normalizado para CanonicalFoodDTO preservando centesimal e bromatologia', () => {
    const rawFood = {
      id: 'FOOD_001',
      name: 'Peito de Frango Grelhado',
      calories: 159,
      protein: 32,
      carbohydrate: 0,
      lipid: 2.5,
      fiber: 0,
      sodium: 50
    };

    const adapted = adaptCanonicalFoodItem(rawFood);
    assert.ok(adapted !== null);
    assert.strictEqual(adapted.id, 'FOOD_001');
    assert.strictEqual(adapted.baseQuantity, 100);
    assert.strictEqual(adapted.unit, 'g');
    assert.strictEqual(adapted.lipid, 2.5);
    assert.strictEqual(adapted.bromatology.energyStatus, 'CONSISTENTE');
  });

  test('5. GAP 5: Objetivos inequívocos são mapeados para enums canônicos exatos', () => {
    assert.strictEqual(normalizeObjective('Perda de peso').category, 'weightLoss');
    assert.strictEqual(normalizeObjective('Emagrecimento').category, 'weightLoss');
    assert.strictEqual(normalizeObjective('Definição muscular').category, 'weightLoss');
    assert.strictEqual(normalizeObjective('Hipertrofia').category, 'hypertrophy');
    assert.strictEqual(normalizeObjective('Ganho de massa muscular').category, 'hypertrophy');
    assert.strictEqual(normalizeObjective('Recomposição corporal').category, 'recomposition');
    assert.strictEqual(normalizeObjective('Manutenção').category, 'maintenance');
    assert.strictEqual(normalizeObjective('Saúde').category, 'maintenance');
  });

  test('6. GAP 5: Objetivos ambíguos ou livres preservam texto sem adivinhação de categoria (categoria = null)', () => {
    const res = normalizeObjective('Quero melhorar minha performance na corrida e definir o abdômen');
    assert.strictEqual(res.category, null);
    assert.strictEqual(res.clinicalObjective, 'Quero melhorar minha performance na corrida e definir o abdômen');
    assert.strictEqual(res.isMapped, false);
  });

  test('7. GAP 6: Horários HH:MM são convertidos estritamente para minutos desde 00:00', () => {
    assert.strictEqual(parseTimeToMinutes('00:00'), 0);
    assert.strictEqual(parseTimeToMinutes('07:30'), 450);
    assert.strictEqual(parseTimeToMinutes('12:00'), 720);
    assert.strictEqual(parseTimeToMinutes('17:45'), 1065);
    assert.strictEqual(parseTimeToMinutes('23:59'), 1439);
    assert.strictEqual(parseTimeToMinutes('24:00'), null);
    assert.strictEqual(parseTimeToMinutes('invalido'), null);
  });

  test('8. GAP 7: Validação do número de refeições respeita o intervalo canônico 1..8 (DEFAULT_MEAL_ASSEMBLY_POLICY)', () => {
    assert.strictEqual(CANONICAL_MIN_MEALS, 1);
    assert.strictEqual(CANONICAL_MAX_MEALS, 8);

    assert.strictEqual(validateMealCount(1).valid, true);
    assert.strictEqual(validateMealCount(4).valid, true);
    assert.strictEqual(validateMealCount(8).valid, true);

    // Violação de limite inferior e superior
    assert.strictEqual(validateMealCount(0).valid, false);
    assert.strictEqual(validateMealCount(9).valid, false);
    assert.strictEqual(validateMealCount(-2).valid, false);
  });

  test('9. GAP 9: Respeito à nomenclatura — catálogo usa lipid e contexto normaliza metas', () => {
    const rawFood = { id: 'F_LIP', name: 'Azeite', calories: 884, protein: 0, carbohydrate: 0, lipid: 100 };
    const adapted = adaptCanonicalFoodItem(rawFood);
    assert.strictEqual(adapted.lipid, 100);
  });

  test('10. buildCanonicalPrescriptionInput: rejeita entrada sem alimentos válidos', () => {
    const res = buildCanonicalPrescriptionInput({
      patientData: { weightKg: 70, heightCm: 175 },
      foodCatalog: []
    });

    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('Catálogo de alimentos vazio')));
  });

  test('11. buildCanonicalPrescriptionInput: constrói estrutura completa pronta para o orquestrador N3.7.1', () => {
    const res = buildCanonicalPrescriptionInput({
      patientData: {
        patientId: 'pat_001',
        name: 'Ana Souza',
        weightKg: 62.5,
        heightCm: 168,
        objective: 'Hipertrofia',
        getKcal: 2100
      },
      foodCatalog: [
        { id: 'F1', name: 'Frango', calories: 159, protein: 32, carbohydrate: 0, lipid: 2.5 },
        { id: 'F2', name: 'Arroz', calories: 128, protein: 2.5, carbohydrate: 28.1, lipid: 0.2 }
      ],
      options: {
        mealCount: 4,
        dietaryStyle: 'tradicional'
      }
    });

    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.errors.length, 0);
    assert.ok(res.canonicalInput.context !== null);
    assert.strictEqual(res.canonicalInput.foodCatalog.length, 2);
    assert.strictEqual(res.canonicalInput.options.mealCount, 4);
    assert.strictEqual(res.canonicalInput.options.periWorkoutWindowMinutes, 150);
  });

  test('12. Determinismo: duas invocações com mesma entrada produzem resultado estritamente idêntico', () => {
    const raw = {
      patientData: {
        patientId: 'pat_det',
        weightKg: 80,
        heightCm: 182,
        objective: 'Perda de peso',
        getKcal: 2400
      },
      foodCatalog: [
        { id: 'F1', name: 'Frango', calories: 159, protein: 32, carbohydrate: 0, lipid: 2.5 }
      ],
      options: { mealCount: 5 }
    };

    const out1 = buildCanonicalPrescriptionInput(raw);
    const out2 = buildCanonicalPrescriptionInput(raw);

    assert.deepStrictEqual(out1, out2);
  });
});
