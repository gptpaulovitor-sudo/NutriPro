/**
 * tests/prescription-output-adapter.test.js
 * 
 * Suíte de Testes Automatizados da Subfase N3.7.2 — Adaptador Canônico de Saída.
 * NutriAx Pro.
 * 
 * Cobertura Obrigatória:
 * 1. Tradução pura de refeições canônicas para currentPrescriptionItems;
 * 2. Determinismo estrito de identificadores: `${meal.mealId}_item_${item.foodId}`;
 * 3. Zero aleatoriedade (Math.random) e zero timestamps internos (Date.now/new Date);
 * 4. GAP 9: Fornecimento simultâneo de 'lipid' e 'fat' em cada item adaptado;
 * 5. Resolução de horário nominal a partir de minutos ou timeString;
 * 6. Soberania do status N3.6: PASS, WARNING, BLOCKED;
 * 7. validationVerdict é estritamente derivado de validationStatus (alias não-concorrente);
 * 8. Metadados completos: validationReport, validationScore, pipelineTrace, provenance;
 * 9. Diferenciação de WARNING: gerado como rascunho (isClinicallyValidated: false por padrão);
 * 10. Pipeline BLOCKED: reflete status BLOCKED e isCompliant = false;
 * 11. Imutabilidade profunda: objetos retornados são congelados (Object.isFrozen);
 * 12. Determinismo estóico: duas execuções com mesma entrada produzem saída idêntica.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  formatMinutesToTimeString,
  resolveMealTimeString,
  resolveClinicalMealName,
  adaptCanonicalMealsToRuntimeItems,
  adaptCanonicalMetaToRuntimeMeta,
  adaptPrescriptionPipelineOutput
} = require('../domain/adapters/prescriptionOutputAdapter');

describe('Subfase N3.7.2 — Adaptador Canônico de Saída (prescriptionOutputAdapter)', () => {

  test('1. formatMinutesToTimeString: converte minutos inteiros em formato HH:MM com wrap de 24h', () => {
    assert.strictEqual(formatMinutesToTimeString(0), '00:00');
    assert.strictEqual(formatMinutesToTimeString(450), '07:30');
    assert.strictEqual(formatMinutesToTimeString(720), '12:00');
    assert.strictEqual(formatMinutesToTimeString(1230), '20:30');
    assert.strictEqual(formatMinutesToTimeString(1439), '23:59');
    assert.strictEqual(formatMinutesToTimeString(null), '12:00');
  });

  test('2. resolveMealTimeString: extrai horário canônico de múltiplas fontes válidas', () => {
    assert.strictEqual(resolveMealTimeString({ scheduledTime: '08:00' }), '08:00');
    assert.strictEqual(resolveMealTimeString({ targetTime: '13:15' }), '13:15');
    assert.strictEqual(resolveMealTimeString({ scheduledTimeMinutes: 750 }), '12:30');
    assert.strictEqual(resolveMealTimeString({ timeWindow: { start: '19:00', end: '20:00' } }), '19:00');
    assert.strictEqual(resolveMealTimeString(null), '12:00');
  });

  test('3. adaptCanonicalMealsToRuntimeItems: gera IDs determinísticos estáveis sem Math.random', () => {
    const meals = [
      {
        mealId: 'meal_1',
        mealName: 'Café da Manhã',
        scheduledTime: '07:30',
        mealRole: 'PRIMARY',
        items: [
          {
            foodId: 'FOOD_001',
            foodName: 'Ovo Cozido',
            grams: 100,
            unit: 'g',
            nutrients: { calories: 146, protein: 13, carbohydrate: 0.6, lipid: 8.9, fiber: 0, sodium: 146 }
          },
          {
            foodId: 'FOOD_002',
            foodName: 'Aveia em Flocos',
            grams: 50,
            unit: 'g',
            nutrients: { calories: 197, protein: 7, carbohydrate: 33, lipid: 4.2, fiber: 4.5, sodium: 2 }
          }
        ]
      }
    ];

    const items = adaptCanonicalMealsToRuntimeItems(meals);
    assert.strictEqual(items.length, 2);
    assert.strictEqual(items[0].id, 'meal_1_item_FOOD_001');
    assert.strictEqual(items[1].id, 'meal_1_item_FOOD_002');
  });

  test('4. GAP 9: Cada item adaptado possui tanto lipid quanto fat preenchidos e coerentes', () => {
    const meals = [
      {
        mealId: 'm1',
        items: [
          {
            foodId: 'F_LIP',
            foodName: 'Azeite',
            grams: 15,
            nutrients: { calories: 132, protein: 0, carbohydrate: 0, lipid: 15, fiber: 0, sodium: 0 }
          }
        ]
      }
    ];

    const items = adaptCanonicalMealsToRuntimeItems(meals);
    assert.strictEqual(items[0].lipid, 15);
    assert.strictEqual(items[0].fat, 15);
  });

  test('5. adaptCanonicalMetaToRuntimeMeta: preserva status N3.6 e deriva validationVerdict sem criar autoridade concorrente', () => {
    const mockResult = {
      status: 'WARNING',
      orchestratorVersion: 'N3.7.1',
      warnings: ['Refeição 3 próxima do treino'],
      globalValidationResult: {
        valid: true,
        validationScore: 88,
        gateResults: [{ gateId: 'GATE_01', status: 'PASS' }]
      },
      pipelineTrace: [{ step: 'N3.6_GLOBAL_VALIDATION', status: 'WARNING' }]
    };

    const meta = adaptCanonicalMetaToRuntimeMeta(mockResult, {
      generatedAt: '2026-09-14T12:00:00.000Z',
      isClinicallyValidated: false
    });

    assert.strictEqual(meta.validationStatus, 'WARNING');
    assert.strictEqual(meta.validationVerdict, 'WARNING');
    assert.strictEqual(meta.validationScore, 88);
    assert.strictEqual(meta.isClinicallyValidated, false);
    assert.strictEqual(meta.isAIGenerated, true);
    assert.strictEqual(meta.generatedAt, '2026-09-14T12:00:00.000Z');
    assert.ok(Object.isFrozen(meta));
  });

  test('6. WARNING não é aprovado clinicamente por padrão (requer aprovação explícita)', () => {
    const mockResult = {
      status: 'WARNING',
      globalValidationResult: { valid: true }
    };

    const out = adaptPrescriptionPipelineOutput(mockResult);
    assert.strictEqual(out.meta.isClinicallyValidated, false);
    assert.strictEqual(out.meta.validationStatus, 'WARNING');
  });

  test('7. adaptPrescriptionPipelineOutput: lida com resultado nulo retornando status BLOCKED seguro', () => {
    const out = adaptPrescriptionPipelineOutput(null);
    assert.strictEqual(out.status, 'BLOCKED');
    assert.strictEqual(out.isCompliant, false);
    assert.strictEqual(out.items.length, 0);
    assert.strictEqual(out.meta.validationStatus, 'BLOCKED');
    assert.strictEqual(out.meta.isClinicallyValidated, false);
  });

  test('8. Pureza absoluta: quando options omite timestamps, generatedAt permanece null sem chamar Date.now', () => {
    const mockResult = { status: 'PASS', globalValidationResult: { valid: true } };
    const out = adaptPrescriptionPipelineOutput(mockResult);
    assert.strictEqual(out.meta.generatedAt, null);
    assert.strictEqual(out.meta.validatedAt, null);
  });

  test('9. Determinismo: duas invocações com mesma entrada e options produzem saída idêntica', () => {
    const mockResult = {
      status: 'PASS',
      orchestratorVersion: 'N3.7.1',
      mealTimingResult: {
        meals: [
          {
            mealId: 'meal_1',
            mealName: 'Almoço',
            scheduledTime: '12:30',
            mealRole: 'PRIMARY',
            items: [
              {
                foodId: 'FOOD_001',
                foodName: 'Frango',
                grams: 150,
                nutrients: { calories: 238.5, protein: 48, carbohydrate: 0, lipid: 3.75, fiber: 0, sodium: 75 }
              }
            ]
          }
        ]
      },
      globalValidationResult: { valid: true, validationScore: 100 }
    };

    const options = { generatedAt: '2026-09-14T10:00:00.000Z', isClinicallyValidated: false };

    const out1 = adaptPrescriptionPipelineOutput(mockResult, options);
    const out2 = adaptPrescriptionPipelineOutput(mockResult, options);

    assert.deepStrictEqual(out1, out2);
  });

  test('10. resolveClinicalMealName: mapeia refeições genéricas para nomes clínicos conforme total de refeições', () => {
    // Para plano de 6 refeições (como na tela do usuário)
    assert.strictEqual(resolveClinicalMealName({ mealName: 'Refeição 1' }, 0, 6), 'Café da manhã');
    assert.strictEqual(resolveClinicalMealName({ mealName: 'Refeição 2' }, 1, 6), 'Lanche manhã');
    assert.strictEqual(resolveClinicalMealName({ mealName: 'Refeição 3' }, 2, 6), 'Almoço');
    assert.strictEqual(resolveClinicalMealName({ mealName: 'Refeição 4' }, 3, 6), 'Pré-treino');
    assert.strictEqual(resolveClinicalMealName({ mealName: 'Refeição 5' }, 4, 6), 'Pós-treino');
    assert.strictEqual(resolveClinicalMealName({ mealName: 'Refeição 6' }, 5, 6), 'Jantar');

    // Para plano de 4 refeições
    assert.strictEqual(resolveClinicalMealName({ mealName: 'Refeição 1' }, 0, 4), 'Café da manhã');
    assert.strictEqual(resolveClinicalMealName({ mealName: 'Refeição 2' }, 1, 4), 'Almoço');
    assert.strictEqual(resolveClinicalMealName({ mealName: 'Refeição 3' }, 2, 4), 'Pré-treino');
    assert.strictEqual(resolveClinicalMealName({ mealName: 'Refeição 4' }, 3, 4), 'Jantar');
  });

  test('11. resolveClinicalMealName: preserva nomes clínicos pré-existentes não-genéricos', () => {
    assert.strictEqual(resolveClinicalMealName({ mealName: 'Desjejum Especial' }, 0, 6), 'Desjejum Especial');
    assert.strictEqual(resolveClinicalMealName({ mealName: 'Almoço de Domingo' }, 2, 6), 'Almoço de Domingo');
    assert.strictEqual(resolveClinicalMealName({ mealName: 'Shake Noturno' }, 5, 6), 'Shake Noturno');
  });

  test('12. adaptCanonicalMealsToRuntimeItems: converte plano canônico de 6 refeições em itens com nomes clínicos padrão', () => {
    const meals = Array.from({ length: 6 }, (_, i) => ({
      mealId: `meal_${i + 1}`,
      mealName: `Refeição ${i + 1}`,
      scheduledTime: `${7 + i * 3}:00`,
      items: [
        {
          foodId: `FOOD_${i + 1}`,
          foodName: `Alimento ${i + 1}`,
          grams: 100,
          nutrients: { calories: 200, protein: 20, carbohydrate: 20, lipid: 5, fiber: 2, sodium: 50 }
        }
      ]
    }));

    const runtimeItems = adaptCanonicalMealsToRuntimeItems(meals);
    assert.strictEqual(runtimeItems.length, 6);
    assert.strictEqual(runtimeItems[0].mealName, 'Café da manhã');
    assert.strictEqual(runtimeItems[1].mealName, 'Lanche manhã');
    assert.strictEqual(runtimeItems[2].mealName, 'Almoço');
    assert.strictEqual(runtimeItems[3].mealName, 'Pré-treino');
    assert.strictEqual(runtimeItems[4].mealName, 'Pós-treino');
    assert.strictEqual(runtimeItems[5].mealName, 'Jantar');
  });
});
