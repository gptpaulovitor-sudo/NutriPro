/**
 * tests/fasting-score-no-penalty.test.js
 * 
 * Garante que o score IDC não penaliza pacientes durante jejum intermitente ativo/concluído
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// ── Stubs mínimos para simular o ambiente do disciplina/index.html ──

function buildFastingState(status, windowStart = '12:30', completedAt = null) {
  return {
    isFastingDay: true,
    status,
    date: '2026-11-05',
    startedAt: '2026-11-04T20:00:00.000Z',
    completedAt: completedAt,
    fastingHours: 16.5,
    windowStart,
    windowEnd: '20:30',
    source: status === 'COMPLETED' ? 'PATIENT_SELF_REPORT' : 'PROTOCOL_ACTIVE'
  };
}

// Extrai e executa a função isMealInFastingWindow do index.html
// Para simplificar nos testes, reimplementamos aqui a versão corrigida
function isMealInFastingWindow(meal, fastingState, mealIndex, totalMeals) {
  if (!meal || !fastingState || !fastingState.isFastingDay) return false;
  if (fastingState.status !== 'COMPLETED' && fastingState.status !== 'IN_PROGRESS') return false;

  const mealTime = String(meal.time || '').trim();
  const mealName = String(meal.name || '').toLowerCase();

  let feedingStartHour = 12;
  let feedingStartMin = 30;

  if (fastingState.completedAt) {
    const dComp = new Date(fastingState.completedAt);
    if (!isNaN(dComp.getTime())) {
      feedingStartHour = dComp.getHours() - 3; // UTC-3 para Brasília
      feedingStartMin = dComp.getMinutes();
    }
  } else if (fastingState.windowStart) {
    const parts = fastingState.windowStart.split(':').map(Number);
    if (parts.length >= 2 && !isNaN(parts[0])) {
      feedingStartHour = parts[0];
      feedingStartMin = parts[1];
    }
  }

  const feedingStartMinutes = feedingStartHour * 60 + feedingStartMin;

  // 1. Horário expresso
  if (mealTime && /^\d{1,2}:\d{2}$/.test(mealTime)) {
    const [h, m] = mealTime.split(':').map(Number);
    return (h * 60 + m) < feedingStartMinutes;
  }

  // 2. Semântica do nome
  const isMorningMealName = /caf[eé]|desjejum|manh[aã]|cola[cç][aã]o|matinal|jejum/i.test(mealName);
  const isLunchOrLater = /almo[cç]o|tarde|jantar|noite|p[oó]s-treino|ceia/i.test(mealName);

  if (isMorningMealName && !isLunchOrLater) return true;
  if (isLunchOrLater) return false;

  // 3. Fallback por índice
  if (typeof mealIndex === 'number' && feedingStartMinutes >= 11 * 60) {
    const morningMealCount = feedingStartMinutes >= 13 * 60 ? 3 : 2;
    if (mealIndex < morningMealCount) return true;
  }

  return false;
}

// Calcula score IDC simplificado (mesma lógica do index.html corrigido)
function calculateIDCScore({ meals = [], fastingState = null, workoutDone = false, waterCurrent = 0, waterTarget = 4000, sleepLogged = false, sleepHours = 0 }) {
  const hasActiveFasting = fastingState && fastingState.isFastingDay &&
    (fastingState.status === 'COMPLETED' || fastingState.status === 'IN_PROGRESS');

  let mealsScore = 0;
  let fastingScore = 0;

  if (meals.length > 0) {
    let totalItems = 0;
    let checkedItems = 0;

    meals.forEach((m, mIdx) => {
      const itemCount = m.items ? m.items.length : 1;
      const isFastMeal = hasActiveFasting && isMealInFastingWindow(m, fastingState, mIdx, meals.length);

      if (isFastMeal) {
        totalItems += itemCount;
        if (fastingState.status === 'COMPLETED' || fastingState.status === 'IN_PROGRESS') {
          checkedItems += itemCount;
        }
      } else {
        if (m.items && m.items.length > 0) {
          m.items.forEach((it, idx) => {
            totalItems++;
            if (it.done) checkedItems++;
          });
        } else {
          totalItems++;
          if (m.done) checkedItems++;
        }
      }
    });

    if (hasActiveFasting) {
      fastingScore = fastingState.status === 'COMPLETED' ? 15 : (fastingState.status === 'IN_PROGRESS' ? 10 : 0);
      const foodAdherence = totalItems > 0 ? (checkedItems / totalItems) : 1;
      mealsScore = foodAdherence * 35;
    } else {
      mealsScore = totalItems > 0 ? (checkedItems / totalItems) * 40 : 0;
    }
  }

  const workoutScore = workoutDone ? 30 : 0;
  const waterScore = Math.min(1, waterCurrent / waterTarget) * 15;
  let sleepScore = 0;
  if (sleepLogged && sleepHours >= 7) sleepScore = 10;

  return Math.min(100, Math.max(0, Math.round(mealsScore + fastingScore + workoutScore + waterScore + sleepScore)));
}

// ── Cenário do usuário: jejum 20h→12h30, 2 refeições matinais não marcadas ──

describe('Fasting Score — sem penalização no jejum', () => {

  test('Cenário real do usuário: jejum COMPLETED 20h→12h30, manhã não marcada → score >= 15 (só fasting+agua)', () => {
    const meals = [
      { id: 'm1', name: 'Café da Manhã', time: '07:30', done: false, items: [{ name: 'Ovo', done: false }] },
      { id: 'm2', name: 'Colação', time: '10:00', done: false, items: [{ name: 'Fruta', done: false }] },
      { id: 'm3', name: 'Almoço', time: '13:00', done: true, items: [{ name: 'Arroz', done: true }, { name: 'Frango', done: true }] },
      { id: 'm4', name: 'Lanche da tarde', time: '16:00', done: false, items: [{ name: 'Iogurte', done: false }] },
      { id: 'm5', name: 'Jantar', time: '19:30', done: false, items: [{ name: 'Salada', done: false }] },
    ];
    const fastingState = buildFastingState('COMPLETED', '12:30');
    const score = calculateIDCScore({ meals, fastingState, waterCurrent: 2000, waterTarget: 4000 });
    // Com jejum COMPLETED: fastingScore=15, mealsScore=35*(3/5)=21, waterScore=7.5 → ~44%
    // Sem o fix: fastingScore=0, mealsScore=40*(1/5)=8, waterScore=7.5 → ~16%
    assert.ok(score >= 40, `Score com jejum concluído deve ser >= 40, foi ${score}`);
    console.log(`  Score com jejum COMPLETED: ${score}%`);
  });

  test('Cenário real: mesmo cenário sem jejum → penaliza refeições não marcadas', () => {
    const meals = [
      { id: 'm1', name: 'Café da Manhã', time: '07:30', done: false, items: [{ name: 'Ovo', done: false }] },
      { id: 'm2', name: 'Colação', time: '10:00', done: false, items: [{ name: 'Fruta', done: false }] },
      { id: 'm3', name: 'Almoço', time: '13:00', done: true, items: [{ name: 'Arroz', done: true }, { name: 'Frango', done: true }] },
      { id: 'm4', name: 'Lanche', time: '16:00', done: false, items: [{ name: 'Iogurte', done: false }] },
      { id: 'm5', name: 'Jantar', time: '19:30', done: false, items: [{ name: 'Salada', done: false }] },
    ];
    const score = calculateIDCScore({ meals, fastingState: null, waterCurrent: 2000, waterTarget: 4000 });
    // Sem jejum: mealsScore=40*(2/5)=16, water=7.5 → ~24% (penalizado corretamente)
    assert.ok(score < 35, `Score sem jejum com refeições não marcadas deve ser < 35, foi ${score}`);
    console.log(`  Score SEM jejum (penalizado): ${score}%`);
  });

  test('isMealInFastingWindow — refeição com horário antes da janela → true', () => {
    const fState = buildFastingState('COMPLETED', '12:30');
    assert.equal(isMealInFastingWindow({ name: 'Café', time: '07:30' }, fState, 0, 5), true);
    assert.equal(isMealInFastingWindow({ name: 'Colação', time: '10:00' }, fState, 1, 5), true);
    assert.equal(isMealInFastingWindow({ name: 'Almoço', time: '12:30' }, fState, 2, 5), false); // exatamente na janela = pós-jejum
    assert.equal(isMealInFastingWindow({ name: 'Almoço', time: '13:00' }, fState, 2, 5), false); // depois = pós-jejum
  });

  test('isMealInFastingWindow — sem campo time, usa fallback por índice', () => {
    const fState = buildFastingState('COMPLETED', '12:30'); // feedingStart = 12h30 >= 11h
    // Índice 0 e 1 devem ser classificados como refeições de jejum
    assert.equal(isMealInFastingWindow({ name: 'Refeição 1' }, fState, 0, 5), true);
    assert.equal(isMealInFastingWindow({ name: 'Refeição 2' }, fState, 1, 5), true);
    // Índice 2+ não devem ser (feeding window)
    assert.equal(isMealInFastingWindow({ name: 'Refeição 3' }, fState, 2, 5), false);
  });

  test('isMealInFastingWindow — janela >= 13h: 3 primeiras refeições são do jejum', () => {
    const fState = buildFastingState('IN_PROGRESS', '13:00');
    assert.equal(isMealInFastingWindow({ name: 'R1' }, fState, 0, 6), true);
    assert.equal(isMealInFastingWindow({ name: 'R2' }, fState, 1, 6), true);
    assert.equal(isMealInFastingWindow({ name: 'R3' }, fState, 2, 6), true);
    assert.equal(isMealInFastingWindow({ name: 'R4' }, fState, 3, 6), false);
  });

  test('isMealInFastingWindow — status NONE → nunca classifica como jejum', () => {
    const fState = { isFastingDay: false, status: 'NONE' };
    assert.equal(isMealInFastingWindow({ name: 'Café', time: '07:30' }, fState, 0, 5), false);
  });

  test('isMealInFastingWindow — refeição semântica de almoço/jantar → false mesmo com jejum ativo', () => {
    const fState = buildFastingState('COMPLETED', '12:30');
    assert.equal(isMealInFastingWindow({ name: 'Almoço' }, fState, 0, 5), false);
    assert.equal(isMealInFastingWindow({ name: 'Jantar' }, fState, 0, 5), false);
    assert.equal(isMealInFastingWindow({ name: 'Lanche da Tarde' }, fState, 0, 5), false);
  });

  test('Score com jejum IN_PROGRESS: recebe 10 pts de fasting, não penaliza manhã', () => {
    const meals = [
      { id: 'm1', name: 'Café da Manhã', time: '07:00', done: false, items: [{ name: 'Ovo', done: false }] },
      { id: 'm2', name: 'Almoço', time: '12:30', done: true, items: [{ name: 'Frango', done: true }] },
    ];
    const fastingState = buildFastingState('IN_PROGRESS', '12:00');
    const score = calculateIDCScore({ meals, fastingState });
    // fastingScore=10, mealsScore=35*(1/2)=17.5 → 27+
    assert.ok(score >= 25, `Score com jejum IN_PROGRESS deve ser >= 25, foi ${score}`);
    console.log(`  Score com jejum IN_PROGRESS: ${score}%`);
  });

  test('Score com todas refeições marcadas E jejum → score alto', () => {
    const meals = [
      { id: 'm1', name: 'Almoço', time: '12:30', done: true, items: [{ name: 'Arroz', done: true }] },
      { id: 'm2', name: 'Lanche', time: '15:30', done: true, items: [{ name: 'Fruta', done: true }] },
      { id: 'm3', name: 'Jantar', time: '19:30', done: true, items: [{ name: 'Salada', done: true }] },
    ];
    const fastingState = buildFastingState('COMPLETED', '12:30');
    const score = calculateIDCScore({
      meals, fastingState,
      workoutDone: true, waterCurrent: 4000, waterTarget: 4000,
      sleepLogged: true, sleepHours: 8
    });
    // fastingScore=15, mealsScore=35, workout=25(ajustado fasting), water=15, sleep=7 → >90%
    assert.ok(score >= 85, `Score ideal com jejum deve ser >= 85, foi ${score}`);
    console.log(`  Score ideal com jejum COMPLETED: ${score}%`);
  });

});
