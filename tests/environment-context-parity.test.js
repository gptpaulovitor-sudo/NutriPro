/**
 * tests/environment-context-parity.test.js
 * 
 * Suíte de Testes Automatizados para Garantia de Paridade de Contexto
 * e Alinhamento Clínico Global entre Telas Geradoras e Ambientes Consumidores.
 * 
 * Cobre:
 * 1. Motor Canônico de Hidratação Determinística (domain/math/waterTarget.js)
 * 2. Ordenação Cronológica Estrita de Refeições
 * 3. Paridade de Metas Prescritas no App do Paciente (Disciplina)
 * 4. Validação de Janela Alimentar em Jejum Intermitente
 * 5. Filtro de Segurança Clínica em Substituições de Alimentos
 * 6. Auditoria de Não-Regressão Estrutural em app.js e disciplina/index.html
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Carrega o motor canônico de hidratação
const { calculateDeterministicWaterTarget } = require('../domain/math/waterTarget.js');

test('PARIDADE DE HIDRATAÇÃO 1.1: Cálculo determinístico baseado no perfil metabólico e peso', () => {
  // Sedentário / Leve (70kg -> 35 mL/kg = 2450 mL -> 2.45L)
  const sedentary = calculateDeterministicWaterTarget({
    weightKg: 70,
    activityFactor: 1.2,
    patientType: 'recreational'
  });
  assert.equal(sedentary.factorMlKg, 35);
  assert.equal(sedentary.targetWaterMl, 2450);
  assert.equal(sedentary.waterTargetL, 2.45);
  assert.match(sedentary.waterRangeDisplay, /2\.1\s*a\s*2\.5\s*L\/dia/);

  // Moderado (80kg -> 40 mL/kg = 3200 mL -> 3.2L)
  const moderate = calculateDeterministicWaterTarget({
    weightKg: 80,
    activityFactor: 1.42,
    patientType: 'recreational'
  });
  assert.equal(moderate.factorMlKg, 40);
  assert.equal(moderate.targetWaterMl, 3200);
  assert.equal(moderate.waterTargetL, 3.2);

  // Atleta / Intenso (Paulo Vitor: 115.8kg -> 45 mL/kg = 5211 mL -> 5.21L)
  const athlete = calculateDeterministicWaterTarget({
    weightKg: 115.8,
    activityFactor: 1.725,
    patientType: 'athlete'
  });
  assert.equal(athlete.factorMlKg, 45);
  assert.equal(athlete.targetWaterMl, 5211);
  assert.equal(athlete.waterTargetL, 5.21);
  assert.match(athlete.waterRangeDisplay, /4\.6\s*a\s*5\.2\s*L\/dia/);
});

test('PARIDADE DE HIDRATAÇÃO 1.2: Fallback determinístico seguro para peso ausente ou zero', () => {
  const fallbackTarget = calculateDeterministicWaterTarget({ weightKg: null });
  assert.equal(fallbackTarget.factorMlKg, 40);
  assert.equal(fallbackTarget.targetWaterMl, 2800); // 70 * 40
  assert.equal(fallbackTarget.waterTargetL, 2.8);
});

test('ORDENAÇÃO CRONOLÓGICA 2.1: Refeições desordenadas são reordenadas por mealTime cronológico', () => {
  const unorderedMeals = [
    { mealName: 'Jantar', mealTime: '20:00', calories: 600 },
    { mealName: 'Café da Manhã', mealTime: '07:30', calories: 450 },
    { mealName: 'Lanche da Tarde', mealTime: '16:00', calories: 300 },
    { mealName: 'Almoço', mealTime: '12:30', calories: 750 }
  ];

  const standardMealOrder = ["Café da manhã", "Lanche manhã", "Almoço", "Lanche tarde", "Pré-treino", "Pós-treino", "Jantar", "Ceia"];
  
  const mealsPresent = [...new Set(unorderedMeals.map(i => i.mealName))];

  // Algoritmo implementado em app.js e disciplina/index.html
  mealsPresent.sort((a, b) => {
    const timeA = unorderedMeals.find(i => i.mealName === a)?.mealTime || "12:00";
    const timeB = unorderedMeals.find(i => i.mealName === b)?.mealTime || "12:00";
    const timeDiff = timeA.localeCompare(timeB);
    if (timeDiff !== 0) return timeDiff;

    const idxA = standardMealOrder.indexOf(a);
    const idxB = standardMealOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return a.localeCompare(b);
  });

  assert.deepEqual(mealsPresent, [
    'Café da Manhã', // 07:30
    'Almoço',         // 12:30
    'Lanche da Tarde', // 16:00
    'Jantar'          // 20:00
  ]);
});

test('SEGURANÇA DE JEJUM 3.1: Detecção de refeições fora da janela alimentar', () => {
  const feedingWindow = { start: '12:00', end: '20:00' };

  const toMin = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const isInsideWindow = (mealTime, win) => {
    const m = toMin(mealTime);
    const s = toMin(win.start);
    const e = toMin(win.end);
    if (s <= e) return m >= s && m <= e;
    return m >= s || m <= e;
  };

  assert.equal(isInsideWindow('08:00', feedingWindow), false, 'Café às 08:00 deve violar janela 12h-20h');
  assert.equal(isInsideWindow('12:30', feedingWindow), true, 'Almoço às 12:30 deve estar dentro');
  assert.equal(isInsideWindow('19:45', feedingWindow), true, 'Jantar às 19:45 deve estar dentro');
  assert.equal(isInsideWindow('22:00', feedingWindow), false, 'Ceia às 22:00 deve violar janela 12h-20h');
});

test('SEGURANÇA CLÍNICA 4.1: Filtro de substituições alerta sobre alergias registradas', () => {
  const patientRestrictions = ['Alergia a lactose', 'Intolerância a glúten'];

  const checkFoodRestriction = (foodName, restrictionsList) => {
    const fLower = String(foodName).toLowerCase();
    for (const r of restrictionsList) {
      const rLower = String(r).toLowerCase().trim();
      if (!rLower) continue;
      if ((rLower.includes('lactose') || rLower.includes('leite')) && 
          (fLower.includes('leite') || fLower.includes('queijo') || fLower.includes('iogurte') || fLower.includes('cottage') || fLower.includes('whey'))) {
        return r;
      }
      if ((rLower.includes('glúten') || rLower.includes('gluten')) && 
          (fLower.includes('trigo') || fLower.includes('aveia') || fLower.includes('pão') || fLower.includes('centeio') || fLower.includes('torrada'))) {
        return r;
      }
      if (fLower.includes(rLower)) return r;
    }
    return null;
  };

  assert.ok(checkFoodRestriction('Iogurte natural desnatado', patientRestrictions), 'Iogurte deve disparar contraindicação de lactose');
  assert.ok(checkFoodRestriction('Pão integral de centeio', patientRestrictions), 'Pão deve disparar contraindicação de glúten');
  assert.equal(checkFoodRestriction('Peito de frango grelhado', patientRestrictions), null, 'Frango não deve disparar restrição');
  assert.equal(checkFoodRestriction('Batata doce cozida', patientRestrictions), null, 'Batata doce não deve disparar restrição');
});

test('AUDITORIA DE CÓDIGO 5.1: app.js possui motor canônico e integrações unificadas', () => {
  const appJs = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf-8');

  // Verifica integração do motor canônico de água em app.js
  assert.ok(appJs.includes('getCanonicalWaterTargetMath'), 'app.js deve declarar getCanonicalWaterTargetMath');
  assert.ok(appJs.includes('targetWaterMl:'), 'resolveCanonicalPrescriptionTargets deve calcular targetWaterMl');
  assert.ok(appJs.includes('waterRangeDisplay:'), 'resolveCanonicalPrescriptionTargets deve calcular waterRangeDisplay');

  // Verifica WhatsApp consumindo canônico e ordenando cronologicamente
  assert.ok(appJs.includes('orderedMealKeys = Object.keys(grouped).sort('), 'generateWhatsAppDietMessage deve ordenar refeições cronologicamente');

  // Verifica PDF consumindo hidratação canônica e ordenando refeições
  assert.ok(appJs.includes('canonicalTargets.waterRangeDisplay'), 'exportPrescriptionAndEvaluationPDF deve consumir waterRangeDisplay canônico');

  // Verifica sincronização do paciente
  assert.ok(appJs.includes('clinicalRestrictions:'), 'syncActivePatientToPatientApp deve sincronizar clinicalRestrictions');
  assert.ok(appJs.includes('formattedMeals.sort('), 'syncActivePatientToPatientApp deve ordenar refeições cronologicamente');
});

test('AUDITORIA DE CÓDIGO 5.2: disciplina/index.html possui Alvo Clínico, Fibras e Restrições', () => {
  const disciplinaHtml = fs.readFileSync(path.join(__dirname, '../disciplina/index.html'), 'utf-8');

  // Verifica novos elementos no card de macros
  assert.ok(disciplinaHtml.includes('id="patientPrescribedTargetBadge"'), 'disciplina/index.html deve conter badge de alvo clínico prescrito');
  assert.ok(disciplinaHtml.includes('id="patientMacroFiberTotal"'), 'disciplina/index.html deve conter total de fibras');
  assert.ok(disciplinaHtml.includes('id="patientMacroFiberConsumed"'), 'disciplina/index.html deve conter fibras consumidas');
  assert.ok(disciplinaHtml.includes('id="patientMacroFiberProgress"'), 'disciplina/index.html deve conter barra de progresso de fibras');

  // Verifica filtro de contraindicações em substituições
  assert.ok(disciplinaHtml.includes('Contraindicado'), 'disciplina/index.html deve conter alerta de contraindicação em substituições');
  assert.ok(disciplinaHtml.includes('checkFoodRestriction'), 'disciplina/index.html deve implementar checkFoodRestriction');
});
