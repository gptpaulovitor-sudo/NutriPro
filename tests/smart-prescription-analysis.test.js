const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Ler app.js para validar definições e contratos
const appJsPath = path.join(__dirname, '../app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

// Extrair funções isoláveis do app.js para teste unitário determinístico
function extractFunction(fnName, content) {
  const marker = `function ${fnName}(`;
  const startIdx = content.indexOf(marker);
  if (startIdx === -1) throw new Error(`Function ${fnName} not found`);
  
  // Encontrar o bloco da função
  let braceCount = 0;
  let started = false;
  let endIdx = startIdx;
  
  for (let i = startIdx; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++;
      started = true;
    } else if (content[i] === '}') {
      braceCount--;
      if (started && braceCount === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }
  return content.substring(startIdx, endIdx);
}

// Avaliar funções sob teste em contexto controlado
const resolveClinicPoliciesCode = extractFunction('resolveClinicPoliciesFromExams', appJsContent);
const computeEnergeticStrategyCode = extractFunction('computeEnergeticStrategy', appJsContent);

const evalContext = {
  activePatientData: { gender: 'Masculino' }
};

const resolveClinicPoliciesFromExams = new Function('exams', 'activePatientData', `
  ${resolveClinicPoliciesCode}
  return resolveClinicPoliciesFromExams(exams);
`);

const computeEnergeticStrategy = new Function('currentAnthro', 'futureGoal', 'getKcal', `
  ${computeEnergeticStrategyCode}
  return computeEnergeticStrategy(currentAnthro, futureGoal, getKcal);
`);

test('MOTOR PRESCRIÇÃO INTELIGENTE — Análise Clínica de Exames', async (t) => {
  await t.test('1. Glicemia de jejum elevada dispara DIABETES_MELLITUS e ajuste de CHO', () => {
    const exams = [
      { examName: 'Glicemia de Jejum', value: '135' }
    ];
    const res = resolveClinicPoliciesFromExams(exams, { gender: 'Masculino' });
    assert.ok(res.flags.includes('DIABETES_MELLITUS'));
    assert.ok(res.adjustments.some(a => a.target === 'carbohydrate' && a.direction === 'reduce'));
    assert.ok(res.clinicalNotes.some(n => n.includes('DM2')));
  });

  await t.test('2. HbA1c pré-diabetes e DM2', () => {
    const examsPre = [{ examName: 'Hemoglobina Glicada (HbA1c)', value: 5.9 }];
    const resPre = resolveClinicPoliciesFromExams(examsPre, { gender: 'Masculino' });
    assert.ok(resPre.flags.includes('PRE_DIABETES_HBA1C'));

    const examsDm = [{ examName: 'HbA1c', value: 7.2 }];
    const resDm = resolveClinicPoliciesFromExams(examsDm, { gender: 'Masculino' });
    assert.ok(resDm.flags.includes('DIABETES_HBA1C'));
    assert.ok(resDm.adjustments.some(a => a.target === 'carbohydrate'));
  });

  await t.test('3. Colesterol e LDL elevados ajustam restrição de gordura saturada', () => {
    const exams = [
      { examName: 'Colesterol Total', value: 250 },
      { examName: 'LDL Colesterol', value: 165 }
    ];
    const res = resolveClinicPoliciesFromExams(exams, { gender: 'Masculino' });
    assert.ok(res.flags.includes('HIPERCOLESTEROLEMIA_ALTA'));
    assert.ok(res.flags.includes('LDL_ELEVADO'));
    assert.ok(res.adjustments.some(a => a.target === 'saturatedFat' && a.direction === 'reduce'));
  });

  await t.test('4. Hipertrigliceridemia grave (TG >= 500) dispara alerta vermelho e corte de CHO simples', () => {
    const exams = [{ examName: 'Triglicerídeos', value: 520 }];
    const res = resolveClinicPoliciesFromExams(exams, { gender: 'Feminino' });
    assert.ok(res.flags.includes('HIPERTRIGLICERIDEMIA_GRAVE'));
    assert.ok(res.adjustments.some(a => a.target === 'carbohydrate' && a.magnitude === 'very_high'));
  });

  await t.test('5. Ácido Úrico elevado por sexo (M >= 7.0, F >= 6.0)', () => {
    const examsMale = [{ examName: 'Ácido Úrico', value: 7.5 }];
    const resM = resolveClinicPoliciesFromExams(examsMale, { gender: 'Masculino' });
    assert.ok(resM.flags.includes('HIPERURICEMIA'));
    assert.ok(resM.adjustments.some(a => a.target === 'purineRichFoods'));

    const examsFem = [{ examName: 'Ácido Úrico', value: 6.3 }];
    const resF = resolveClinicPoliciesFromExams(examsFem, { gender: 'Feminino' });
    assert.ok(resF.flags.includes('HIPERURICEMIA'));
  });
});

test('MOTOR PRESCRIÇÃO INTELIGENTE — Cálculo de Estratégia Energética Futura', async (t) => {
  await t.test('1. Meta de perda de peso calcula déficit calórico seguro proporcional', () => {
    const current = { weightKg: 85, bodyFatPercent: 25 };
    const goal = { targetWeightKg: 79, targetBodyFatPercent: 18, timeframeWeeks: 12 };
    const getKcal = 2600;

    const res = computeEnergeticStrategy(current, goal, getKcal);
    assert.strictEqual(res.strategy, 'deficit');
    assert.ok(res.dailyDelta < 0);
    assert.ok(res.dailyDelta <= -200 && res.dailyDelta >= -750);
    assert.ok(res.rationale.includes('Déficit'));
  });

  await t.test('2. Meta de ganho de peso (superávit controlado)', () => {
    const current = { weightKg: 70, bodyFatPercent: 12 };
    const goal = { targetWeightKg: 74, targetBodyFatPercent: 13, timeframeWeeks: 16 };
    const getKcal = 2400;

    const res = computeEnergeticStrategy(current, goal, getKcal);
    assert.strictEqual(res.strategy, 'surplus');
    assert.ok(res.dailyDelta > 0);
    assert.ok(res.dailyDelta >= 150 && res.dailyDelta <= 500);
    assert.ok(res.rationale.includes('Superávit'));
  });

  await t.test('3. Recomposição corporal (reduzir %G sem alterar peso total)', () => {
    const current = { weightKg: 75, bodyFatPercent: 22 };
    const goal = { targetWeightKg: 75, targetBodyFatPercent: 17, timeframeWeeks: 12 };
    const getKcal = 2300;

    const res = computeEnergeticStrategy(current, goal, getKcal);
    assert.strictEqual(res.strategy, 'recomposition');
    assert.strictEqual(res.dailyDelta, -150);
  });

  await t.test('4. Manutenção quando valores alvo são equivalentes ao atual', () => {
    const current = { weightKg: 70, bodyFatPercent: 15 };
    const goal = { targetWeightKg: 70, targetBodyFatPercent: 15, timeframeWeeks: 12 };
    const getKcal = 2200;

    const res = computeEnergeticStrategy(current, goal, getKcal);
    assert.strictEqual(res.strategy, 'maintenance');
    assert.strictEqual(res.dailyDelta, 0);
  });
});

test('MOTOR PRESCRIÇÃO INTELIGENTE — Não-Regressão e Arquitetura', async (t) => {
  await t.test('1. Compatibilidade de chamadas: openAIPrescriptionModal existe e delega para openSmartPrescriptionModal', () => {
    assert.ok(appJsContent.includes('function openAIPrescriptionModal()'));
    assert.ok(appJsContent.includes('openSmartPrescriptionModal()'));
  });

  await t.test('2. O novo motor não lê resGet diretamente do DOM', () => {
    const modalStart = appJsContent.indexOf('function openSmartPrescriptionModal()');
    const execStart = appJsContent.indexOf('async function executeSmartPrescriptionGeneration()');
    const subSection = appJsContent.substring(modalStart, execStart + 3500);
    assert.strictEqual(subSection.includes('document.getElementById("resGet")'), false);
  });

  await t.test('3. O resultado da prescrição inteligente exibe modal estruturado (renderSmartPrescSuccess) sem alert() de sucesso', () => {
    const execStart = appJsContent.indexOf('async function executeSmartPrescriptionGeneration()');
    const execEnd = appJsContent.indexOf('function renderSmartPrescSuccess');
    const execBlock = appJsContent.substring(execStart, execEnd);
    assert.ok(execBlock.includes('renderSmartPrescSuccess('));
    // Sucesso não usa alert()
    assert.strictEqual(execBlock.includes("alert('Dieta Canônica Gerada"), false);
  });

  await t.test('4. Exportação global para window', () => {
    assert.ok(appJsContent.includes('window.openSmartPrescriptionModal = openSmartPrescriptionModal;'));
    assert.ok(appJsContent.includes('window.analyzePatientContextForPrescription = analyzePatientContextForPrescription;'));
    assert.ok(appJsContent.includes('window.executeSmartPrescriptionGeneration = executeSmartPrescriptionGeneration;'));
  });

  await t.test('5. Cálculo de Kcal e Macros no renderSmartPrescSuccess consome calories e kcal sem retornar 0', () => {
    const successStart = appJsContent.indexOf('function renderSmartPrescSuccess(');
    const successEnd = appJsContent.indexOf('function renderSmartPrescBlocked(');
    const successCode = appJsContent.substring(successStart, successEnd);
    assert.ok(successCode.includes('Number(i.calories) || Number(i.kcal) || 0'));

    const items = [
      { foodName: 'Banana', calories: 217, protein: 3, carbohydrate: 50.8, lipid: 0.2 },
      { foodName: 'Frango', calories: 509, protein: 108.3, carbohydrate: 0, lipid: 8.5 }
    ];
    const totalKcal = Math.round(items.reduce((s, i) => s + (Number(i.calories) || Number(i.kcal) || 0), 0));
    assert.strictEqual(totalKcal, 726);
  });

  await t.test('6. Afinidade gastronômica e clínica: Patinho e Brócolis não vão para o café da manhã, e Aveia não vai para o jantar', () => {
    const { calculateFoodMealAffinityPenalty } = require('../domain/meal/mealAssemblyPolicy');
    // Café da manhã (SECONDARY / breakfast)
    assert.ok(calculateFoodMealAffinityPenalty('Patinho Bovino (Grelhado)', 'SECONDARY', 0, 5) > 0);
    assert.ok(calculateFoodMealAffinityPenalty('Brócolis (Cozido)', 'SECONDARY', 0, 5) > 0);
    assert.strictEqual(calculateFoodMealAffinityPenalty('Aveia em Flocos', 'SECONDARY', 0, 5), 0);
    assert.strictEqual(calculateFoodMealAffinityPenalty('Banana Nanica', 'SECONDARY', 0, 5), 0);
    assert.strictEqual(calculateFoodMealAffinityPenalty('Ovo de Galinha (Cozido)', 'SECONDARY', 0, 5), 0);

    // Jantar / Almoço (PRIMARY / main)
    assert.ok(calculateFoodMealAffinityPenalty('Aveia em Flocos', 'PRIMARY', 4, 5) > 0);
    assert.strictEqual(calculateFoodMealAffinityPenalty('Peito de Frango (Grelhado)', 'PRIMARY', 4, 5), 0);
    assert.strictEqual(calculateFoodMealAffinityPenalty('Patinho Bovino (Grelhado)', 'PRIMARY', 4, 5), 0);
    assert.strictEqual(calculateFoodMealAffinityPenalty('Arroz Branco (Cozido)', 'PRIMARY', 4, 5), 0);
  });
});

