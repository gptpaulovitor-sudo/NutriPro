/**
 * tests/scientific-prescription-evaluator.test.js
 * 
 * Suíte de Testes Automatizados — Avaliação Científica de Prescrições (ISSN / ACSM / SBNE).
 * NutriAx Pro.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  GLYCEMIC_INDEX,
  PROTEIN_QUALITY,
  GASTRIC_EMPTYING,
  classifyFoodScience,
  evaluateMealScience,
  evaluatePrescriptionScience
} = require('../domain/clinical/scientificPrescriptionEvaluator');

test('AVALIAÇÃO CIENTÍFICA — Classificação de Alimentos', async (t) => {
  await t.test('1. Classifica carboidratos de baixo índice glicêmico', () => {
    const aveia = classifyFoodScience('Aveia em Flocos');
    assert.strictEqual(aveia.ig, GLYCEMIC_INDEX.LOW);
    assert.ok(aveia.igValue <= 55);

    const batataDoce = classifyFoodScience('Batata Doce (Cozida)');
    assert.strictEqual(batataDoce.ig, GLYCEMIC_INDEX.LOW);
    assert.ok(batataDoce.igValue <= 55);

    const feijao = classifyFoodScience('Feijão Carioca (Cozido)');
    assert.strictEqual(feijao.ig, GLYCEMIC_INDEX.LOW);
  });

  await t.test('2. Classifica carboidratos de médio e alto índice glicêmico', () => {
    const banana = classifyFoodScience('Banana Nanica (Crua)');
    assert.strictEqual(banana.ig, GLYCEMIC_INDEX.MEDIUM);

    const arrozBranco = classifyFoodScience('Arroz Branco (Cozido)');
    assert.strictEqual(arrozBranco.ig, GLYCEMIC_INDEX.HIGH);
    assert.ok(arrozBranco.igValue >= 70);
  });

  await t.test('3. Classifica proteínas de alto valor biológico (alto VB) com leucina', () => {
    const frango = classifyFoodScience('Peito de Frango (Grelhado)');
    assert.strictEqual(frango.vb, PROTEIN_QUALITY.HIGH_VB);
    assert.ok(frango.leucinePer100g >= 2.0);

    const carne = classifyFoodScience('Patinho Bovino (Grelhado)');
    assert.strictEqual(carne.vb, PROTEIN_QUALITY.HIGH_VB);

    const ovo = classifyFoodScience('Ovo de Galinha (Cozido)');
    assert.strictEqual(ovo.vb, PROTEIN_QUALITY.HIGH_VB);
  });

  await t.test('4. Identifica alimentos com lentidão no esvaziamento gástrico', () => {
    const azeite = classifyFoodScience('Azeite de Oliva Extravirgem');
    assert.strictEqual(azeite.emptying, GASTRIC_EMPTYING.SLOW);
  });
});

test('AVALIAÇÃO CIENTÍFICA — Refeição Pré-Treino (ISSN / ACSM)', async (t) => {
  await t.test('1. Pré-treino com baixo IG (Batata Doce) recebe parecer de liberação sustentada e alta pontuação', () => {
    const items = [
      { foodName: 'Batata Doce (Cozida)', calories: 200, protein: 3, carbohydrate: 45, lipid: 0.5 },
      { foodName: 'Ovo de Galinha (Cozido)', calories: 140, protein: 13, carbohydrate: 1, lipid: 9.5 }
    ];
    const res = evaluateMealScience('Pré-treino', items);
    assert.ok(res.score >= 85);
    assert.ok(res.scientificRationale.includes('baixo/médio índice glicêmico'));
    assert.ok(res.scientificRationale.includes('ISSN/ACSM'));
    assert.strictEqual(res.overallIg, GLYCEMIC_INDEX.LOW);
    assert.strictEqual(res.clinicalAlerts.length, 0);
  });

  await t.test('2. Pré-treino com excesso de gorduras (> 20g) emite alerta de retardo no esvaziamento gástrico', () => {
    const items = [
      { foodName: 'Arroz Branco (Cozido)', calories: 200, protein: 4, carbohydrate: 45, lipid: 1 },
      { foodName: 'Azeite de Oliva Extravirgem', calories: 220, protein: 0, carbohydrate: 0, lipid: 25 }
    ];
    const res = evaluateMealScience('Pré-treino', items);
    assert.ok(res.score < 80);
    assert.ok(res.clinicalAlerts.some(a => a.includes('esvaziamento gástrico')));
  });

  await t.test('3. Pré-treino com carboidrato insuficiente (< 15g) gera alerta de substrato energético limitado', () => {
    const items = [
      { foodName: 'Clara de Ovo', calories: 80, protein: 18, carbohydrate: 2, lipid: 0 }
    ];
    const res = evaluateMealScience('Pré-treino', items);
    assert.ok(res.clinicalAlerts.some(a => a.includes('carboidrato pré-treino reduzido')));
  });
});

test('AVALIAÇÃO CIENTÍFICA — Refeição Pós-Treino (MPS & Ressíntese de Glicogênio)', async (t) => {
  await t.test('1. Pós-treino com proteína de alto VB (>= 20g) e carboidratos ativa limiar de leucina/mTOR e ressíntese de glicogênio', () => {
    const items = [
      { foodName: 'Peito de Frango (Grelhado)', calories: 300, protein: 60, carbohydrate: 0, lipid: 5 },
      { foodName: 'Arroz Branco (Cozido)', calories: 250, protein: 5, carbohydrate: 55, lipid: 0.5 }
    ];
    const res = evaluateMealScience('Pós-treino', items);
    assert.ok(res.score >= 90);
    assert.ok(res.scientificRationale.includes('limiar anabólico de leucina'));
    assert.ok(res.scientificRationale.includes('via mTOR'));
    assert.ok(res.scientificRationale.includes('GLUT-4'));
    assert.strictEqual(res.hasHighVbProtein, true);
  });

  await t.test('2. Pós-treino com proteína insuficiente (< 20g) emite alerta de estímulo subótimo', () => {
    const items = [
      { foodName: 'Banana Nanica', calories: 150, protein: 2, carbohydrate: 35, lipid: 0.5 }
    ];
    const res = evaluateMealScience('Pós-treino', items);
    assert.ok(res.score < 85);
    assert.ok(res.clinicalAlerts.some(a => a.includes('Proteína pós-treino insuficiente')));
  });
});

test('AVALIAÇÃO CIENTÍFICA — Avaliação Global da Prescrição', async (t) => {
  await t.test('1. Prescrição completa com 5 refeições coerentes atinge nota A+ e destaques científicos', () => {
    const meals = [
      {
        mealName: 'Café da manhã',
        items: [
          { foodName: 'Aveia em Flocos', calories: 250, protein: 10, carbohydrate: 40, lipid: 4 },
          { foodName: 'Banana Nanica', calories: 120, protein: 1.5, carbohydrate: 28, lipid: 0.2 },
          { foodName: 'Ovo de Galinha (Cozido)', calories: 140, protein: 13, carbohydrate: 1, lipid: 9.5 }
        ]
      },
      {
        mealName: 'Lanche manhã',
        items: [
          { foodName: 'Ovo de Galinha (Cozido)', calories: 140, protein: 13, carbohydrate: 1, lipid: 9.5 }
        ]
      },
      {
        mealName: 'Almoço',
        items: [
          { foodName: 'Arroz Branco (Cozido)', calories: 240, protein: 5, carbohydrate: 55, lipid: 0.5 },
          { foodName: 'Feijão Carioca (Cozido)', calories: 100, protein: 6, carbohydrate: 17, lipid: 0.5 },
          { foodName: 'Patinho Bovino (Grelhado)', calories: 300, protein: 52, carbohydrate: 0, lipid: 10 },
          { foodName: 'Brócolis (Cozido)', calories: 40, protein: 3, carbohydrate: 6, lipid: 0.5 }
        ]
      },
      {
        mealName: 'Pré-treino',
        items: [
          { foodName: 'Batata Doce (Cozida)', calories: 150, protein: 2, carbohydrate: 35, lipid: 0.2 },
          { foodName: 'Ovo de Galinha (Cozido)', calories: 140, protein: 13, carbohydrate: 1, lipid: 9.5 }
        ]
      },
      {
        mealName: 'Jantar',
        items: [
          { foodName: 'Arroz Branco (Cozido)', calories: 240, protein: 5, carbohydrate: 55, lipid: 0.5 },
          { foodName: 'Peito de Frango (Grelhado)', calories: 300, protein: 60, carbohydrate: 0, lipid: 5 },
          { foodName: 'Azeite de Oliva Extravirgem', calories: 90, protein: 0, carbohydrate: 0, lipid: 10 }
        ]
      }
    ];

    const report = evaluatePrescriptionScience(meals);
    assert.ok(report.scientificScore >= 90);
    assert.strictEqual(report.grade, 'A+ (Excelente)');
    assert.ok(report.globalHighlights.some(h => h.includes('Pré-Treino Otimizado')));
    assert.ok(report.globalHighlights.some(h => h.includes('Desjejum Anti-catabólico')));
    assert.strictEqual(report.mealEvaluations.length, 5);
  });
});
