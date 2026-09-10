/**
 * =========================================================================
 * NutriAx Pro — Suíte de Testes do Split Engine & Contrato de Divisão
 * Arquivo: tests/split-engine.test.js
 * Fase 5: Desacoplamento Determinístico do Split
 * =========================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const {
  SPLIT_SOURCES,
  VALID_TRAINING_SPLITS,
  normalizeTrainingSplit,
  validateTrainingSplit,
  validateTrainingPrescriptionDTO,
  createTrainingPrescriptionDTO
} = require('../domain/contracts');

const {
  legacyTrainingToTrainingPrescriptionDTO
} = require('../domain/adapters');

// ─────────────────────────────────────────────────────────────────────────────
// SANDBOX PARA EXECUÇÃO ISOLADA DE APP.JS (SEM POLUIR O AMBIENTE NODE)
// ─────────────────────────────────────────────────────────────────────────────
const appJsCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

const sandbox = {
  window: { addEventListener: () => {} },
  addEventListener: () => {},
  document: {
    addEventListener: () => {},
    getElementById: (id) => {
      if (id === 'perf-split-select') {
        return { value: 'PPL', options: [{ text: 'PPL' }], selectedIndex: 0 };
      }
      if (id === 'perf-ai-toast') {
        return { style: { display: 'none' }, innerHTML: '' };
      }
      return null;
    },
    querySelectorAll: () => [],
    querySelector: () => null,
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  navigator: { userAgent: 'Node' },
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Math,
  parseFloat,
  parseInt,
  isNaN,
  Number,
  String,
  Object,
  Array,
  Date,
  JSON,
  RegExp,
  Set,
  Map,
  AbortController: global.AbortController,
  fetch: () => Promise.resolve({ ok: true, json: () => ({}) }),
  alert: () => {}
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

// Injeta NutriDomain no sandbox antes de carregar app.js
const NutriContracts = require('../domain/contracts');
sandbox.window.NutriDomain = NutriContracts;
sandbox.NutriDomain = NutriContracts;

vm.createContext(sandbox);
vm.runInContext(appJsCode, sandbox);

console.log('======================================================');
console.log('Fase 5: Testes do Split Engine — Desacoplamento Determinístico');
console.log('======================================================');

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CARACTERIZAÇÃO DO COMPORTAMENTO LEGADO (BASELINE FASE 1A)
// ─────────────────────────────────────────────────────────────────────────────
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
  const broSplitRoutines = [
    { id: 'A', name: 'Treino A · Peitoral' },
    { id: 'B', name: 'Treino B · Dorsal' },
    { id: 'C', name: 'Treino C · Pernas Completo' },
    { id: 'D', name: 'Treino D · Deltóides' },
    { id: 'E', name: 'Treino E · Braços (Bíceps e Tríceps)' }
  ];

  const splitDeduzidoIncorretamente = legacyDeduceSplit(broSplitRoutines.length);
  assert.strictEqual(splitDeduzidoIncorretamente, 'PHAT');
  assert.notStrictEqual(splitDeduzidoIncorretamente, 'Bro Split');
});

test('SPLIT 1.3: Prova de falha clínica — 3 rotinas Full Body são forçadas para PPL', () => {
  const fullBodyRoutines = [
    { id: 'A', name: 'Full Body 1' },
    { id: 'B', name: 'Full Body 2' },
    { id: 'C', name: 'Full Body 3' }
  ];

  const splitDeduzidoIncorretamente = legacyDeduceSplit(fullBodyRoutines.length);
  assert.strictEqual(splitDeduzidoIncorretamente, 'PPL');
});

test('CONTRATO SPLIT 2.1: Estrutura canônica com split e splitSource explícitos', () => {
  const prescricaoBroSplit = createTrainingPrescriptionDTO({
    patientId: 'pat_001',
    split: 'Bro Split',
    splitSource: 'AI',
    routines: [
      { routineName: 'Peito', exercises: [{ exerciseName: 'Supino', sets: 4, reps: '10' }] },
      { routineName: 'Costas', exercises: [{ exerciseName: 'Remada', sets: 4, reps: '10' }] },
      { routineName: 'Pernas', exercises: [{ exerciseName: 'Agachamento', sets: 4, reps: '10' }] },
      { routineName: 'Ombros', exercises: [{ exerciseName: 'Desenvolvimento', sets: 4, reps: '10' }] },
      { routineName: 'Braços', exercises: [{ exerciseName: 'Rosca Direta', sets: 4, reps: '10' }] }
    ]
  });
  const valBro = validateTrainingPrescriptionDTO(prescricaoBroSplit);
  assert.strictEqual(valBro.isValid, true);
  assert.strictEqual(prescricaoBroSplit.split, 'Bro Split');
  assert.strictEqual(prescricaoBroSplit.splitSource, 'AI');

  const prescricaoHuman = createTrainingPrescriptionDTO({
    patientId: 'pat_002',
    split: 'UpperLower',
    splitSource: 'HUMAN',
    routines: [
      { routineName: 'Upper 1', exercises: [{ exerciseName: 'Supino', sets: 4, reps: '10' }] },
      { routineName: 'Lower 1', exercises: [{ exerciseName: 'Agachamento', sets: 4, reps: '10' }] },
      { routineName: 'Upper 2', exercises: [{ exerciseName: 'Puxada', sets: 4, reps: '10' }] },
      { routineName: 'Lower 2', exercises: [{ exerciseName: 'Leg Press', sets: 4, reps: '10' }] }
    ]
  });
  const valHuman = validateTrainingPrescriptionDTO(prescricaoHuman);
  assert.strictEqual(valHuman.isValid, true);
  assert.strictEqual(prescricaoHuman.split, 'UpperLower');
  assert.strictEqual(prescricaoHuman.splitSource, 'HUMAN');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. TESTES OBRIGATÓRIOS DA FASE 5 (SEÇÃO 16)
// ─────────────────────────────────────────────────────────────────────────────

test('F5 TESTE 1: 5 rotinas com split explícito "Bro Split" resulta em "Bro Split" e NÃO "PHAT"', () => {
  const presc = createTrainingPrescriptionDTO({
    patientId: 'pat_101',
    split: 'Bro Split',
    splitSource: 'AI',
    routines: [
      { routineName: 'Peito', exercises: [{ exerciseName: 'Supino', sets: 4, reps: '10' }] },
      { routineName: 'Costas', exercises: [{ exerciseName: 'Remada', sets: 4, reps: '10' }] },
      { routineName: 'Pernas', exercises: [{ exerciseName: 'Agachamento', sets: 4, reps: '10' }] },
      { routineName: 'Ombros', exercises: [{ exerciseName: 'Elevação Lateral', sets: 4, reps: '12' }] },
      { routineName: 'Braços', exercises: [{ exerciseName: 'Tríceps Corda', sets: 4, reps: '12' }] }
    ]
  });

  assert.strictEqual(presc.routines.length, 5);
  assert.strictEqual(presc.split, 'Bro Split');
  assert.notStrictEqual(presc.split, 'PHAT', 'NÃO pode ser sobrescrito para PHAT por ter 5 rotinas');
});

test('F5 TESTE 2: 4 rotinas com split explícito "PPL" resulta em "PPL" e NÃO "UpperLower"', () => {
  const presc = createTrainingPrescriptionDTO({
    patientId: 'pat_102',
    split: 'PPL',
    splitSource: 'HUMAN',
    routines: [
      { routineName: 'Push 1', exercises: [{ exerciseName: 'Supino', sets: 4, reps: '10' }] },
      { routineName: 'Pull 1', exercises: [{ exerciseName: 'Remada', sets: 4, reps: '10' }] },
      { routineName: 'Legs 1', exercises: [{ exerciseName: 'Agachamento', sets: 4, reps: '10' }] },
      { routineName: 'Push 2', exercises: [{ exerciseName: 'Militar', sets: 4, reps: '10' }] }
    ]
  });

  assert.strictEqual(presc.routines.length, 4);
  assert.strictEqual(presc.split, 'PPL');
  assert.notStrictEqual(presc.split, 'UpperLower', 'NÃO pode ser sobrescrito para UpperLower por ter 4 rotinas');
});

test('F5 TESTE 3: 3 rotinas com split explícito "FullBody" resulta em "FullBody" e NÃO "PPL"', () => {
  const presc = createTrainingPrescriptionDTO({
    patientId: 'pat_103',
    split: 'FullBody',
    splitSource: 'AI',
    routines: [
      { routineName: 'Full Body A', exercises: [{ exerciseName: 'Agachamento', sets: 3, reps: '8' }] },
      { routineName: 'Full Body B', exercises: [{ exerciseName: 'Supino', sets: 3, reps: '8' }] },
      { routineName: 'Full Body C', exercises: [{ exerciseName: 'Levantamento Terra', sets: 3, reps: '8' }] }
    ]
  });

  assert.strictEqual(presc.routines.length, 3);
  assert.strictEqual(presc.split, 'FullBody');
  assert.notStrictEqual(presc.split, 'PPL', 'NÃO pode ser sobrescrito para PPL por ter 3 rotinas');
});

test('F5 TESTE 4: Split inválido é estritamente REJEITADO (validateTrainingSplit e validateTrainingPrescriptionDTO)', () => {
  const invalidSplits = ['SplitInventado', 'CrossfitHardcore', 'RandomSplit', '123', ''];

  for (const inv of invalidSplits) {
    const val = validateTrainingSplit(inv);
    assert.strictEqual(val.isValid, false, `Split "${inv}" deveria ser rejeitado por validateTrainingSplit`);

    const dto = createTrainingPrescriptionDTO({
      patientId: 'pat_err',
      split: inv,
      splitSource: 'AI',
      routines: [{ routineName: 'Treino', exercises: [{ exerciseName: 'Ex', sets: 3, reps: '10' }] }]
    });
    const dtoVal = validateTrainingPrescriptionDTO(dto);
    assert.strictEqual(dtoVal.isValid, false, `DTO com split "${inv}" deveria ser inválido`);
    assert(dtoVal.errors.some(e => e.includes('Split de treino')), `Erro de split esperado para "${inv}"`);
  }
});

test('F5 TESTE 5: Split ausente ou nulo é estritamente REJEITADO no approval gate (sem fallback para routines.length)', async () => {
  assert.strictEqual(validateTrainingSplit(null).isValid, false);
  assert.strictEqual(validateTrainingSplit(undefined).isValid, false);

  // Sem seleção humana prévia
  sandbox.perfActiveSplit = null;
  sandbox.perfPendingAIValidation = null;
  sandbox.perfWorkoutMeta = null;

  // Prescrição sem split explícito
  const prescriptionWithoutSplit = {
    patientId: 'pat_no_split',
    routines: [
      { id: 'A', name: 'Rotina 1', exercises: [{ name: 'Supino', sets: 3, reps: '10' }] },
      { id: 'B', name: 'Rotina 2', exercises: [{ name: 'Remada', sets: 3, reps: '10' }] },
      { id: 'C', name: 'Rotina 3', exercises: [{ name: 'Agachamento', sets: 3, reps: '10' }] },
      { id: 'D', name: 'Rotina 4', exercises: [{ name: 'Militar', sets: 3, reps: '10' }] },
      { id: 'E', name: 'Rotina 5', exercises: [{ name: 'Bíceps', sets: 3, reps: '10' }] }
    ]
  };

  const res = await sandbox.approveAITraining('pat_no_split', prescriptionWithoutSplit);
  assert.strictEqual(res.status, 'REJECT', 'Approval gate deve rejeitar prescrição sem split explícito');
  assert(res.errors && res.errors.length > 0, 'Deve conter mensagem de erro justificando a rejeição');
  assert(res.errors[0].includes('sem split explícito válido'), 'Erro deve citar ausência de split explícito');
});

test('F5 TESTE 6: Preservação estrita das fontes válidas (AI, HUMAN, CONFIG, DETERMINISTIC)', () => {
  assert.deepStrictEqual(SPLIT_SOURCES, ['AI', 'HUMAN', 'CONFIG', 'DETERMINISTIC']);

  for (const src of SPLIT_SOURCES) {
    const dto = createTrainingPrescriptionDTO({
      patientId: 'pat_src',
      split: 'PPL',
      splitSource: src,
      routines: [{ routineName: 'Push', exercises: [{ exerciseName: 'Supino', sets: 3, reps: '10' }] }]
    });
    const val = validateTrainingPrescriptionDTO(dto);
    assert.strictEqual(val.isValid, true, `Fonte legítima "${src}" deve ser aceita`);
    assert.strictEqual(dto.splitSource, src, `Fonte "${src}" deve ser preservada no DTO`);
  }

  // Fonte arbitrária não autorizada
  const dtoInvalidSource = {
    patientId: 'pat_src',
    split: 'PPL',
    splitSource: 'AI_FALLBACK_GUESS',
    frequency: 3,
    routines: [{ routineName: 'Push', exercises: [{ exerciseName: 'Supino', sets: 3, reps: '10' }] }]
  };
  const valInv = validateTrainingPrescriptionDTO(dtoInvalidSource);
  assert.strictEqual(valInv.isValid, false);
  assert(valInv.errors.some(e => e.includes('splitSource')));
});

test('F5 TESTE 7: perfWeeklySchedule é construído diretamente a partir do split explícito', () => {
  // Teste 7.1: Split UpperLower
  const schedUL = sandbox.perfBuildWeeklySchedule('UpperLower');
  assert.strictEqual(schedUL.length, 7);
  assert.strictEqual(schedUL[0].title, 'Treino A · Upper Força');
  assert.strictEqual(schedUL[1].title, 'Treino B · Lower Força');
  assert.strictEqual(schedUL[3].title, 'Treino C · Upper Hipertrofia');
  assert.strictEqual(schedUL[4].title, 'Treino D · Lower Hipertrofia');

  // Teste 7.2: Split Bro Split / ABCDE
  const schedBro = sandbox.perfBuildWeeklySchedule('Bro Split');
  assert.strictEqual(schedBro.length, 7);
  assert.strictEqual(schedBro[0].title, 'Treino A · Peitoral');
  assert.strictEqual(schedBro[1].title, 'Treino B · Dorsal');
  assert.strictEqual(schedBro[2].title, 'Treino C · Pernas');
  assert.strictEqual(schedBro[3].title, 'Treino D · Ombros & Trapézio');
  assert.strictEqual(schedBro[4].title, 'Treino E · Braços (Bíceps/Tríceps)');

  // Teste 7.3: Split FullBody
  const schedFB = sandbox.perfBuildWeeklySchedule('FullBody');
  assert.strictEqual(schedFB.length, 7);
  assert.strictEqual(schedFB[0].title, 'Treino A · Full Body Força');
  assert.strictEqual(schedFB[2].title, 'Treino B · Full Body Hinge');
  assert.strictEqual(schedFB[4].title, 'Treino C · Full Body Hyp');

  // Teste 7.4: Split DUP
  const schedDUP = sandbox.perfBuildWeeklySchedule('DUP');
  assert.strictEqual(schedDUP.length, 7);
  assert.strictEqual(schedDUP[0].title, 'Treino A · Dia Neural (Força)');
  assert.strictEqual(schedDUP[2].title, 'Treino B · Dia Hipertrófico');
  assert.strictEqual(schedDUP[4].title, 'Treino C · Dia Metabólico');
});

test('F5 TESTE 8: Provar que split declarado tem precedência absoluta sobre routines.length', () => {
  // Simulamos o estado interno do runtime contendo 6 rotinas na memória
  sandbox.perfWorkoutPlan = [
    { id: 'A', name: 'R1' }, { id: 'B', name: 'R2' }, { id: 'C', name: 'R3' },
    { id: 'D', name: 'R4' }, { id: 'E', name: 'R5' }, { id: 'F', name: 'R6' }
  ];

  // Se o profissional ou IA declarar 'UpperLower', o microciclo DEVE ser de UpperLower (4 dias),
  // e NUNCA ser sobrescrito para PHAT só porque existem 6 rotinas no array
  const sched = sandbox._perfBuildRawWeeklySchedule('UpperLower');
  assert.strictEqual(sched[0].title, 'Treino A · Upper Força');
  assert.strictEqual(sched[1].title, 'Treino B · Lower Força');
  assert.strictEqual(sched[3].title, 'Treino C · Upper Hipertrofia');
  assert.strictEqual(sched[4].title, 'Treino D · Lower Hipertrofia');
  assert.notStrictEqual(sched[0].title, 'Treino A · Push A (Força)', 'NÃO pode forçar PHAT');
});

test('F5 TESTE 9: Conflito IA × HUMANO é detectado, registrado e não resolvido silenciosamente', async () => {
  // Estado inicial no runtime: o nutricionista/profissional havia selecionado 'PHAT'
  sandbox.perfActiveSplit = 'PHAT';
  sandbox.perfWorkoutMeta = { patientId: 'pat_conflict_test' };
  sandbox.perfPendingAIValidation = null;

  // Prescrição da IA chega com split declarado 'PPL'
  const aiPrescription = {
    patientId: 'pat_conflict_test',
    split: 'PPL',
    splitSource: 'AI',
    routines: [
      { id: 'A', name: 'Push', exercises: [{ name: 'Supino', sets: 4, reps: '10' }] },
      { id: 'B', name: 'Pull', exercises: [{ name: 'Remada', sets: 4, reps: '10' }] },
      { id: 'C', name: 'Legs', exercises: [{ name: 'Agachamento', sets: 4, reps: '10' }] }
    ]
  };

  // Ao aprovar formalmente no gate:
  const approval = await sandbox.approveAITraining('pat_conflict_test', aiPrescription);
  assert.strictEqual(approval.status, 'APPROVED');
  assert.strictEqual(approval.hasSplitConflict, true, 'Deve sinalizar conflito entre IA e humano');
  assert.notStrictEqual(approval.splitConflict, null, 'Deve conter o objeto de auditoria do conflito');
  assert.strictEqual(approval.splitConflict.aiSplit, 'PPL');
  assert.strictEqual(approval.splitConflict.humanSplit, 'PHAT');
  assert.strictEqual(approval.splitConflict.resolution, 'HUMAN_APPROVAL_CONFIRMED');
  assert.strictEqual(approval.split, 'PPL', 'A aprovação formal confirma o split explicitamente auditado');
});

test('F5 TESTE 10: Prescrição legada antiga sem split é adaptada deterministicamente sem mutação do registro original', () => {
  const rawLegacy = {
    patientId: 'pat_historical_1990',
    frequency: 5,
    routines: [
      { id: 'A', name: 'Rotina A', exercises: [{ name: 'Ex 1', sets: 3, reps: '10' }] },
      { id: 'B', name: 'Rotina B', exercises: [{ name: 'Ex 2', sets: 3, reps: '10' }] },
      { id: 'C', name: 'Rotina C', exercises: [{ name: 'Ex 3', sets: 3, reps: '10' }] },
      { id: 'D', name: 'Rotina D', exercises: [{ name: 'Ex 4', sets: 3, reps: '10' }] },
      { id: 'E', name: 'Rotina E', exercises: [{ name: 'Ex 5', sets: 3, reps: '10' }] }
    ]
  };

  const rawCopy = JSON.parse(JSON.stringify(rawLegacy));

  // Executa adaptação de leitura legada
  const dto = legacyTrainingToTrainingPrescriptionDTO(rawLegacy);

  // 1. O objeto original NÃO pode ser modificado
  assert.deepStrictEqual(rawLegacy, rawCopy, 'O registro histórico do banco NÃO pode ser mutado');
  assert.strictEqual(rawLegacy.split, undefined, 'Registro original não deve ter recebido propriedade split');

  // 2. O DTO de leitura recebe proveniência DETERMINISTIC explícita
  assert.strictEqual(dto.splitSource, 'DETERMINISTIC', 'Fallback histórico deve registrar DETERMINISTIC');
  assert.strictEqual(dto.split, 'PHAT', 'Compatibilidade determinística de registros antigos');
  assert.strictEqual(dto.routines.length, 5);

  // 3. Validação do DTO adaptado
  const val = validateTrainingPrescriptionDTO(dto);
  assert.strictEqual(val.isValid, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. MATRIZ DE REGRESSÃO OBRIGATÓRIA (SEÇÃO 17)
// ─────────────────────────────────────────────────────────────────────────────

const REGRESSION_MATRIX = [
  { routinesCount: 3, declaredSplit: 'FullBody', expectedResult: 'FullBody' },
  { routinesCount: 4, declaredSplit: 'PPL',      expectedResult: 'PPL' },
  { routinesCount: 4, declaredSplit: 'ABCD',     expectedResult: 'ABCD' },
  { routinesCount: 5, declaredSplit: 'PHAT',     expectedResult: 'PHAT' },
  { routinesCount: 5, declaredSplit: 'Bro Split', expectedResult: 'Bro Split' },
  { routinesCount: 5, declaredSplit: 'ABCDE',    expectedResult: 'ABCDE' },
  { routinesCount: 6, declaredSplit: 'DUP',      expectedResult: 'DUP' }
];

REGRESSION_MATRIX.forEach(({ routinesCount, declaredSplit, expectedResult }, idx) => {
  test(`MATRIZ REGRESSÃO ${idx + 1}: ${routinesCount} rotinas + Split declarado "${declaredSplit}" -> Resultado "${expectedResult}"`, () => {
    // 1. Monta rotinas sintéticas
    const routines = [];
    for (let i = 0; i < routinesCount; i++) {
      const letter = String.fromCharCode(65 + i);
      routines.push({
        routineName: `Rotina ${letter}`,
        exercises: [{ exerciseName: `Ex ${letter}1`, sets: 3, reps: '10-12', rpe: 8, restSeconds: 90 }]
      });
    }

    // 2. Cria DTO canônico com split declarado
    const dto = createTrainingPrescriptionDTO({
      patientId: `pat_matrix_${idx}`,
      split: declaredSplit,
      splitSource: 'AI',
      routines
    });

    // 3. Valida contrato
    const val = validateTrainingPrescriptionDTO(dto);
    assert.strictEqual(val.isValid, true, `DTO para ${declaredSplit} deve ser válido`);

    // 4. Comprova resultado === split declarado
    assert.strictEqual(
      dto.split,
      expectedResult,
      `Resultado deve ser rigorosamente "${expectedResult}" independentemente de possuir ${routinesCount} rotinas`
    );

    // 5. Comprova que o runtime constrói o microciclo sem erros
    const schedule = sandbox.perfBuildWeeklySchedule(declaredSplit);
    assert.strictEqual(Array.isArray(schedule), true);
    assert.strictEqual(schedule.length, 7);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. TESTES COMPLEMENTARES DE PUREZA, ALIAS E RUNTIME
// ─────────────────────────────────────────────────────────────────────────────

test('F5 COMPLEMENTAR 1: Pureza de validateTrainingSplit — Rejeita tipos não-string e não consulta DOM', () => {
  assert.strictEqual(validateTrainingSplit(null).isValid, false);
  assert.strictEqual(validateTrainingSplit(undefined).isValid, false);
  assert.strictEqual(validateTrainingSplit(12345).isValid, false);
  assert.strictEqual(validateTrainingSplit(true).isValid, false);
  assert.strictEqual(validateTrainingSplit({ split: 'PPL' }).isValid, false);
  assert.strictEqual(validateTrainingSplit(['PPL']).isValid, false);
  assert.strictEqual(validateTrainingSplit('').isValid, false);
  assert.strictEqual(validateTrainingSplit('   ').isValid, false);
  assert.strictEqual(validateTrainingSplit('PPL').isValid, true);
  assert.strictEqual(validateTrainingSplit('UpperLower').isValid, true);
});

test('F5 COMPLEMENTAR 2: Normalização de Aliases — "BroSplit" e "Bro Split" são suportados', () => {
  assert.strictEqual(normalizeTrainingSplit('BroSplit'), 'Bro Split');
  assert.strictEqual(normalizeTrainingSplit('Bro Split'), 'Bro Split');
  assert.strictEqual(normalizeTrainingSplit('PPL'), 'PPL');

  const valBroSpaced = validateTrainingSplit('Bro Split');
  assert.strictEqual(valBroSpaced.isValid, true);
  assert.strictEqual(valBroSpaced.normalizedSplit, 'Bro Split');

  const valBroJoint = validateTrainingSplit('BroSplit');
  assert.strictEqual(valBroJoint.isValid, true);
  assert.strictEqual(valBroJoint.normalizedSplit, 'Bro Split');
});

test('F5 COMPLEMENTAR 3: Runtime perfSetSplit valida split e define splitSource="HUMAN"', async () => {
  // Chamada com split válido
  await sandbox.perfSetSplit('Bro Split');
  const activeSplit = vm.runInContext('perfActiveSplit', sandbox);
  assert.strictEqual(activeSplit, 'Bro Split');
  const workoutMeta = vm.runInContext('perfWorkoutMeta', sandbox);
  assert.strictEqual(workoutMeta.split, 'Bro Split');
  assert.strictEqual(workoutMeta.splitSource, 'HUMAN');
  assert.strictEqual(workoutMeta.isAIGenerated, false);

  // Tentativa de selecionar split inválido não corrompe o estado
  await sandbox.perfSetSplit('InvalidSplitXYZ');
  const activeSplitAfterInvalid = vm.runInContext('perfActiveSplit', sandbox);
  assert.strictEqual(activeSplitAfterInvalid, 'Bro Split', 'Não deve aceitar split inválido');
});

test('F5 COMPLEMENTAR 4: Runtime approveAITraining assina e persiste com split e splitSource explícitos', async () => {
  vm.runInContext('perfWorkoutMeta = { patientId: "pat_approval_audit" };', sandbox);
  vm.runInContext('perfPendingAIValidation = null;', sandbox);

  const presc = {
    patientId: 'pat_approval_audit',
    split: 'DUP',
    splitSource: 'AI',
    routines: [
      { id: 'A', name: 'Neural', exercises: [{ name: 'Supino', sets: 5, reps: '3-5' }] },
      { id: 'B', name: 'Hyp', exercises: [{ name: 'Remada', sets: 4, reps: '8-10' }] },
      { id: 'C', name: 'Meta', exercises: [{ name: 'Agachamento', sets: 3, reps: '12-15' }] }
    ]
  };

  const res = await sandbox.approveAITraining('pat_approval_audit', presc);
  assert.strictEqual(res.status, 'APPROVED');
  assert.strictEqual(res.split, 'DUP');
  assert.strictEqual(res.splitSource, 'AI');
  const workoutMeta = vm.runInContext('perfWorkoutMeta', sandbox);
  assert.strictEqual(workoutMeta.split, 'DUP');
  assert.strictEqual(workoutMeta.splitSource, 'AI');
  const activeSplit = vm.runInContext('perfActiveSplit', sandbox);
  assert.strictEqual(activeSplit, 'DUP');
});

// ─────────────────────────────────────────────────────────────────────────────
// EXECUÇÃO SEQUENCIAL DOS TESTES COM SUPORTE ASSÍNCRONO
// ─────────────────────────────────────────────────────────────────────────────
(async () => {
  let passedTests = 0;
  let totalTests = 0;

  for (const t of tests) {
    totalTests++;
    try {
      await t.fn();
      console.log(`✅ [PASS] ${t.name}`);
      passedTests++;
    } catch (err) {
      console.error(`❌ [FAIL] ${t.name}`);
      console.error(`   Detalhe: ${err.message}`);
      process.exitCode = 1;
      throw err;
    }
  }

  console.log('======================================================');
  console.log(`Resumo dos Testes do Split Engine:`);
  console.log(`Total: ${totalTests} | Aprovados: ${passedTests} | Falhas: 0`);
  console.log('Status: FASE 5 — DESACOPLAMENTO DETERMINÍSTICO 100% VALIDADO');
  console.log('======================================================');
})();
