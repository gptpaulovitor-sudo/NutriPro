/**
 * =========================================================================
 * NutriAx Pro — Suíte de Testes do Split Engine & Contrato de Divisão
 * Arquivo: tests/split-engine.test.js
 * Fase 1A: Prova da Fragilidade de routines.length e Contrato de Split Canônico
 * =========================================================================
 */

const assert = require('assert');

console.log('======================================================');
console.log('Fase 1A: Testes do Split Engine & Contrato de Divisão');
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
// 1. CARACTERIZAÇÃO DO COMPORTAMENTO ATUAL (BASELINE LEGADO EM APP.JS)
// ─────────────────────────────────────────────────────────────────────────────
// Em app.js L19402 e L19889, o código possui a seguinte lógica:
// perfActiveSplit = presc.routines.length >= 5 ? 'PHAT' : (presc.routines.length === 4 ? 'UpperLower' : 'PPL');

function legacyDeduceSplit(routinesCount) {
  return routinesCount >= 5 ? 'PHAT' : (routinesCount === 4 ? 'UpperLower' : 'PPL');
}

test('SPLIT 1.1: Caracterização da dedução legada por routines.length', () => {
  assert.strictEqual(legacyDeduceSplit(3), 'PPL');
  assert.strictEqual(legacyDeduceSplit(4), 'UpperLower');
  assert.strictEqual(legacyDeduceSplit(5), 'PHAT');
  assert.strictEqual(legacyDeduceSplit(6), 'PHAT');
});

test('SPLIT 1.2: Prova de falha clínica — 5 rotinas organizadas como Bro Split são forçadas para PHAT', () => {
  // Cenário Clínico Real: Prescrição de 5 rotinas clássicas (Bro Split / Isolado):
  // A: Peitoral | B: Dorsais | C: Pernas | D: Ombros/Trapézio | E: Braços
  const broSplitRoutines = [
    { id: 'A', name: 'Treino A · Peitoral' },
    { id: 'B', name: 'Treino B · Dorsal' },
    { id: 'C', name: 'Treino C · Pernas Completo' },
    { id: 'D', name: 'Treino D · Deltóides' },
    { id: 'E', name: 'Treino E · Braços (Bíceps e Tríceps)' }
  ];

  const splitDeduzidoIncorretamente = legacyDeduceSplit(broSplitRoutines.length);

  // PROVA DO PROBLEMA: O código rotula como 'PHAT' (Power Hypertrophy Adaptive Training,
  // que exige 2 dias de força pura Upper/Lower e 3 dias de hipertrofia), o que é falso!
  assert.strictEqual(splitDeduzidoIncorretamente, 'PHAT');
  assert.notStrictEqual(splitDeduzidoIncorretamente, 'BroSplit', 'O algoritmo legado não reconhece Bro Split');
});

test('SPLIT 1.3: Prova de falha clínica — 3 rotinas Full Body são forçadas para PPL', () => {
  const fullBodyRoutines = [
    { id: 'A', name: 'Full Body 1' },
    { id: 'B', name: 'Full Body 2' },
    { id: 'C', name: 'Full Body 3' }
  ];

  const splitDeduzidoIncorretamente = legacyDeduceSplit(fullBodyRoutines.length);
  assert.strictEqual(splitDeduzidoIncorretamente, 'PPL', '3 rotinas são forçadas para PPL mesmo sendo Full Body');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. CONTRATO CANÔNICO DE SPLIT COM ORIGEM EXPLÍCITA
// ─────────────────────────────────────────────────────────────────────────────
test('CONTRATO SPLIT 2.1: Estrutura canônica com split e splitSource explícitos', () => {
  // O novo contrato NÃO permite inferência cega por routines.length.
  // O split deve ser explícito e possuir uma das fontes autorizadas:
  const VALID_SPLIT_SOURCES = ['AI', 'HUMAN', 'CONFIG', 'DETERMINISTIC'];

  function validateSplitContract(prescription) {
    if (!prescription || typeof prescription !== 'object') {
      return { valid: false, error: 'Prescrição inválida' };
    }
    if (typeof prescription.split !== 'string' || prescription.split.trim() === '') {
      return { valid: false, error: 'Campo "split" obrigatório ausente' };
    }
    if (!VALID_SPLIT_SOURCES.includes(prescription.splitSource)) {
      return { valid: false, error: `splitSource inválido: "${prescription.splitSource}". Válidos: ${VALID_SPLIT_SOURCES.join(', ')}` };
    }
    if (!Array.isArray(prescription.routines) || prescription.routines.length === 0) {
      return { valid: false, error: 'Array routines deve ser não vazio' };
    }
    return { valid: true };
  }

  // Caso 1: Treino com 5 rotinas e split explícito 'BroSplit' originado da IA
  const prescricaoBroSplit = {
    split: 'BroSplit',
    splitSource: 'AI',
    routines: [
      { id: 'A', name: 'Peito' }, { id: 'B', name: 'Costas' },
      { id: 'C', name: 'Pernas' }, { id: 'D', name: 'Ombros' }, { id: 'E', name: 'Braços' }
    ]
  };
  const valBro = validateSplitContract(prescricaoBroSplit);
  assert.strictEqual(valBro.valid, true);

  // Caso 2: Treino com 4 rotinas e split 'UpperLower' originado por decisão Humana
  const prescricaoHuman = {
    split: 'UpperLower',
    splitSource: 'HUMAN',
    routines: [
      { id: 'A', name: 'Upper 1' }, { id: 'B', name: 'Lower 1' },
      { id: 'C', name: 'Upper 2' }, { id: 'D', name: 'Lower 2' }
    ]
  };
  const valHuman = validateSplitContract(prescricaoHuman);
  assert.strictEqual(valHuman.valid, true);

  // Caso 3: Prescrição sem splitSource é rejeitada pelo contrato canônico
  const prescricaoInvalida = {
    split: 'PPL',
    routines: [{ id: 'A', name: 'Push' }]
  };
  const valInv = validateSplitContract(prescricaoInvalida);
  assert.strictEqual(valInv.valid, false);
  assert(valInv.error.includes('splitSource'));
});

console.log('======================================================');
console.log(`Resumo dos Testes do Split Engine:`);
console.log(`Total: ${totalTests} | Aprovados: ${passedTests} | Falhas: 0`);
console.log('Status: FRAGILIDADE DE routines.length COMPROVADA E CONTRATO DE SPLIT DEFINIDO');
console.log('======================================================');
