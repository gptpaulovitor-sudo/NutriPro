const { test } = require('node:test');
const assert = require('node:assert');

const {
  ModalityCatalog,
  EquipmentService,
  RecoveryEngine,
  ProgressionEngine,
  ModalityEngineRegistry,
  InternalTrainingDatabase,
  DeterministicTrainingGenerator,
  TrainingGenerationStateMachine
} = require('../domain/training');

const {
  validateTrainingPrescriptionDTO,
  validateTrainingSplit
} = require('../domain/contracts/TrainingPrescriptionDTO');

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 1: BASE INTERNA, EQUIPAMENTOS, LESÕES E PROGRESSÃO
// ─────────────────────────────────────────────────────────────────────────────

test('01. Base Interna de Exercícios Estruturada e Integridade das 18 Modalidades', () => {
  assert.ok(InternalTrainingDatabase, 'InternalTrainingDatabase deve estar exportado e acessível');
  assert.strictEqual(InternalTrainingDatabase.VERSION, '1.0.0', 'Versão da base interna deve ser 1.0.0');

  const allExercises = InternalTrainingDatabase.getAllExercises();
  assert.ok(Array.isArray(allExercises) && allExercises.length >= 30, `A base interna deve conter múltiplos exercícios reais (encontrados: ${allExercises.length})`);

  const modalities = ModalityCatalog.getAllModalities();
  assert.strictEqual(modalities.length, 18, 'Devem existir 18 modalidades registradas');

  for (const mod of modalities) {
    const modExercises = InternalTrainingDatabase.getExercisesByModality(mod.id);
    assert.ok(modExercises.length > 0, `Modalidade ${mod.id} deve possuir exercícios cadastrados na base interna`);

    for (const ex of modExercises) {
      assert.ok(ex.id, `Exercício deve possuir ID: ${JSON.stringify(ex)}`);
      assert.ok(ex.canonicalName || ex.name, `Exercício ${ex.id} deve ter name legível`);
      assert.ok(ex.movementPattern, `Exercício ${ex.id} deve ter movementPattern`);
    }
  }
});

test('02. Filtragem por Equipamentos e Substituição Inteligente', () => {
  const availableEquip = ['peso_corporal', 'chao_solo', 'bodyweight'];
  const filtered = InternalTrainingDatabase.filterExercises({
    modalityId: 'CALISTHENICS',
    availableEquipment: availableEquip
  });

  assert.ok(filtered.length > 0, 'Deve retornar exercícios viáveis de calistenia');

  // Busca substituto para supino com barra
  const benchPress = InternalTrainingDatabase.getExerciseById('ex_str_bench_press_barbell');
  assert.ok(benchPress, 'Supino reto com barra deve existir no catálogo com ID canônico');

  const substitute = InternalTrainingDatabase.findSubstitute(benchPress, ['dumbbells', 'halteres', 'banco_reto']);
  assert.ok(substitute, 'Deve encontrar substituto com halteres para supino reto');
  assert.ok(substitute.canonicalName.toLowerCase().includes('halteres') || substitute.canonicalName.toLowerCase().includes('flexão'),
    'Substituto deve ser com halteres ou flexão');
});

test('03. Exclusão Clínica e Contraindicações de Lesões', () => {
  // Paciente com lesão de ombro
  const exercisesNoShoulderInjury = InternalTrainingDatabase.filterExercises({
    modalityId: 'STRENGTH_POWER',
    contraindications: ['ombro']
  });

  const hasOverheadPress = exercisesNoShoulderInjury.some(ex => ex.id === 'ex_str_military_press');
  assert.strictEqual(hasOverheadPress, false, 'Desenvolvimento militar deve ser excluído se paciente tiver lesão no ombro');

  // Paciente com dor patelar/joelho
  const exercisesNoKneeInjury = InternalTrainingDatabase.filterExercises({
    modalityId: 'FUNCTIONAL_CROSS',
    contraindications: ['joelho', 'patelar', 'condromalacia']
  });

  const hasThruster = exercisesNoKneeInjury.some(ex => ex.id === 'ex_cf_thrusters_olympic');
  assert.strictEqual(hasThruster, false, 'Thrusters devem ser excluídos se paciente tiver dor patelar no joelho');
});

test('04. Progressão Histórica Integrada no Gerador Determinístico', () => {
  const historicalLogs = [
    {
      exerciseId: 'pe01',
      exerciseName: 'Supino Reto com Barra',
      targetRpe: 8,
      actualRpe: 7,
      completedReps: 12,
      targetRepsMin: 6,
      targetRepsMax: 8,
      currentWeightKg: 80
    }
  ];

  const patientContext = {
    patientId: 'pat_progression_test',
    experienceLevel: 'ADVANCED',
    availableEquipment: ['barbell', 'bench', 'dumbbells'],
    historicalLogs
  };

  const prescription = DeterministicTrainingGenerator.generatePrescription('HYPERTROPHY', patientContext);
  const chestRoutine = prescription.routines[0];
  const supino = chestRoutine.exercises.find(ex => ex.exerciseId === 'ex_str_bench_press_barbell' || ex.id === 'ex_str_bench_press_barbell' || ex.exerciseName?.includes('Supino'));

  if (supino) {
    assert.ok(supino.progressed, 'Exercício supino deve ter sinalizador de progressão');
    assert.ok(supino.weightKg >= 80, 'Carga do supino deve ser mantida ou incrementada pela sobrecarga progressiva');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 2: MÁQUINA DE ESTADOS & RESILIÊNCIA DA IA (503, 429, RETRY, JITTER)
// ─────────────────────────────────────────────────────────────────────────────

test('05. Máquina de Estados: Fluxo de Sucesso Direto da IA', async () => {
  const sm = new TrainingGenerationStateMachine({ maxRetries: 2, initialBackoffMs: 10 });
  assert.strictEqual(sm.getState(), TrainingGenerationStateMachine.STATES.IDLE);

  let stateNotifications = [];
  sm.subscribe((state) => {
    stateNotifications.push(state);
  });

  const mockAiGenerator = async () => {
    return {
      split: 'PPL',
      splitSource: 'AI',
      patientId: 'pat_ai_success',
      frequency: 3,
      routines: [
        {
          routineId: 'A',
          routineName: 'Push A',
          exercises: [
            { exerciseName: 'Supino Reto', sets: 4, reps: '8-10', rpe: 8 }
          ]
        }
      ]
    };
  };

  const result = await sm.execute({
    patientContext: { patientId: 'pat_ai_success', preferredSplit: 'PPL' },
    aiGeneratorFn: mockAiGenerator
  });

  assert.strictEqual(result.source, 'AI');
  assert.strictEqual(result.contingencyUsed, false);
  assert.strictEqual(sm.getState(), TrainingGenerationStateMachine.STATES.READY);
  assert.ok(stateNotifications.includes('REQUESTING_AI'));
  assert.ok(stateNotifications.includes('VALIDATING'));
  assert.ok(stateNotifications.includes('READY'));
});

test('06. Máquina de Estados: Recuperação de HTTP 503 Transitório com Backoff e Jitter', async () => {
  const sm = new TrainingGenerationStateMachine({ maxRetries: 3, initialBackoffMs: 10 });
  let attempts = 0;

  const mockFlakyAi = async () => {
    attempts++;
    if (attempts < 2) {
      const err = new Error('Service Unavailable');
      err.status = 503;
      throw err;
    }
    return {
      split: 'UpperLower',
      splitSource: 'AI',
      patientId: 'pat_flaky',
      frequency: 4,
      routines: [
        {
          routineId: 'A',
          routineName: 'Upper A',
          exercises: [
            { exerciseName: 'Supino Inclinado', sets: 4, reps: '10', rpe: 8 }
          ]
        }
      ]
    };
  };

  const result = await sm.execute({
    patientContext: { patientId: 'pat_flaky', preferredSplit: 'UpperLower' },
    aiGeneratorFn: mockFlakyAi
  });

  assert.strictEqual(attempts, 2, 'Deve ter tentado 2 vezes e recuperado');
  assert.strictEqual(result.source, 'AI');
  assert.strictEqual(result.contingencyUsed, false);
  assert.strictEqual(sm.getState(), TrainingGenerationStateMachine.STATES.READY);
});

test('07. Máquina de Estados: HTTP 503 Persistente Ativa Contingência Determinística', async () => {
  const sm = new TrainingGenerationStateMachine({ maxRetries: 2, initialBackoffMs: 5 });
  let attempts = 0;

  const mockPersistent503 = async () => {
    attempts++;
    const err = new Error('Google Gemini 503: The model is overloaded. Please try again later.');
    err.status = 503;
    throw err;
  };

  const result = await sm.execute({
    patientContext: {
      patientId: 'pat_contingency_503',
      preferredSplit: 'PPL',
      modalityId: 'HYPERTROPHY',
      availableEquipment: ['barbell', 'bench', 'dumbbells']
    },
    aiGeneratorFn: mockPersistent503
  });

  assert.strictEqual(attempts, 3, 'Deve tentar 1 inicial + 2 retentativas antes de acionar contingência');
  assert.strictEqual(result.source, 'DETERMINISTIC');
  assert.strictEqual(result.contingencyUsed, true);
  assert.ok(result.contingencyReason.includes('503'), 'Motivo da contingência deve registrar erro 503');
  assert.strictEqual(sm.getState(), TrainingGenerationStateMachine.STATES.READY);

  // Validação estrita do DTO resultante
  const dtoVal = validateTrainingPrescriptionDTO(result.prescription);
  assert.strictEqual(dtoVal.isValid, true, 'Prescrição de contingência deve ser 100% válida');
});

test('08. Máquina de Estados: HTTP 429 (Rate Limit) Aciona Contingência Sem Loop Infinito', async () => {
  const sm = new TrainingGenerationStateMachine({ maxRetries: 3, initialBackoffMs: 5 });
  let attempts = 0;

  const mockRateLimitedAi = async () => {
    attempts++;
    const err = new Error('Resource has been exhausted (e.g. check quota).');
    err.status = 429;
    throw err;
  };

  const result = await sm.execute({
    patientContext: {
      patientId: 'pat_rate_limited',
      modalityId: 'CALISTHENICS',
      preferredSplit: 'FullBody'
    },
    aiGeneratorFn: mockRateLimitedAi
  });

  assert.strictEqual(attempts, 1, 'HTTP 429 deve pular retentativas e acionar contingência imediatamente para evitar penalidades de quota');
  assert.strictEqual(result.source, 'DETERMINISTIC');
  assert.strictEqual(result.contingencyUsed, true);
  assert.ok(result.contingencyReason.includes('429'), 'Motivo deve referenciar erro 429');
  assert.strictEqual(sm.getState(), TrainingGenerationStateMachine.STATES.READY);
});

test('09. Teste Negativo: Rejeição de Estruturas de Prescrição Corrompidas', () => {
  const corruptedPrescriptions = [
    null,
    {},
    { split: 'PPL' },
    { split: 'PPL', routines: [] },
    { split: 'INVALID_SPLIT_XYZ', routines: [{ routineName: 'A', exercises: [{ exerciseName: 'A', sets: 3, reps: '10' }] }] },
    { split: 'PPL', routines: [{ routineName: '', exercises: [{ exerciseName: 'A', sets: 3, reps: '10' }] }] },
    { split: 'PPL', routines: [{ routineName: 'A', exercises: [{ exerciseName: 'A', sets: -1, reps: '10' }] }] },
    { split: 'PPL', routines: [{ routineName: 'A', exercises: [{ exerciseName: 'A', sets: 3, reps: '' }] }] }
  ];

  for (const corrupt of corruptedPrescriptions) {
    const val = validateTrainingPrescriptionDTO(corrupt);
    assert.strictEqual(val.isValid, false, `Estrutura corrompida deve ser rejeitada: ${JSON.stringify(corrupt)}`);
    assert.ok(val.errors.length > 0, 'Deve listar erros descritivos de validação');
  }
});

test('10. Compatibilidade de Persistência com Esquema Dexie e Firebase', () => {
  const prescription = DeterministicTrainingGenerator.generatePrescription('HYPERTROPHY', {
    patientId: 'patient_persistence_123',
    availableEquipment: ['barbell', 'bench']
  });

  const serializedRecord = {
    patientId: prescription.patientId,
    split: prescription.split,
    splitSource: prescription.splitSource,
    frequency: prescription.frequency,
    updatedAt: new Date().toISOString(),
    weeklySchedule: prescription.weeklySchedule,
    routines: prescription.routines,
    metadata: prescription.metadata
  };

  const jsonString = JSON.stringify(serializedRecord);
  const deserializedRecord = JSON.parse(jsonString);

  assert.strictEqual(deserializedRecord.patientId, 'patient_persistence_123');
  assert.strictEqual(deserializedRecord.splitSource, 'DETERMINISTIC');
  assert.strictEqual(deserializedRecord.metadata.generator, 'LOCAL_CONTINGENCY');
  assert.strictEqual(deserializedRecord.routines.length, prescription.routines.length);

  const val = validateTrainingPrescriptionDTO(deserializedRecord);
  assert.strictEqual(val.isValid, true, 'Registro persistido e desserializado deve permanecer 100% válido no DTO');
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 3: TESTES INDIVIDUAIS DE CONTINGÊNCIA PARA TODAS AS 18 MODALIDADES
// ─────────────────────────────────────────────────────────────────────────────

const MODALITY_TEST_CASES = [
  { num: '11', id: 'musculacao_forca', name: 'Musculação / Força', split: 'PPL', code: 'STRENGTH' },
  { num: '12', id: 'corrida_endurance', name: 'Corrida / Endurance', split: 'Corrida_Endurance', code: 'RUNNING' },
  { num: '13', id: 'ciclismo_spinning', name: 'Ciclismo / Spinning', split: 'Ciclismo_Endurance', code: 'CYCLING' },
  { num: '14', id: 'natacao', name: 'Natação', split: 'Natacao', code: 'SWIMMING' },
  { num: '15', id: 'lutas_artes_marciais', name: 'Lutas & Artes Marciais', split: 'Lutas', code: 'COMBAT' },
  { num: '16', id: 'aerobico_geral', name: 'Aeróbico Geral', split: 'Aerobico_Geral', code: 'AEROBIC' },
  { num: '17', id: 'calistenia', name: 'Calistenia', split: 'Calistenia', code: 'CALISTHENICS' },
  { num: '18', id: 'hyrox_racing', name: 'Hyrox Racing', split: 'HYROX', code: 'HYROX' },
  { num: '19', id: 'metcon_hibrido', name: 'Metcon Híbrido', split: 'Metcon', code: 'METCON' },
  { num: '20', id: 'crossfit_funcional', name: 'CrossFit & Condicionamento', split: 'CrossFit', code: 'CROSSFIT' },
  { num: '21', id: 'hiit_musculacao', name: 'HIIT & Força', split: 'HIIT_Forca', code: 'HIIT_STRENGTH' },
  { num: '22', id: 'triathlon', name: 'Triathlon', split: 'Triathlon', code: 'TRIATHLON' },
  { num: '23', id: 'funcional_misto', name: 'Treinamento Funcional Misto', split: 'FuncionalMisto', code: 'FUNCTIONAL' },
  { num: '24', id: 'corrida_musculacao', name: 'Corrida + Musculação Concorrente', split: 'RunningStrength', code: 'RUNNING_STRENGTH' },
  { num: '25', id: 'ciclismo_forca', name: 'Ciclismo + Força', split: 'Ciclismo_Forca', code: 'CYCLING_STRENGTH' },
  { num: '26', id: 'esportes_coletivos', name: 'Esportes Coletivos', split: 'EsportesColetivos', code: 'TEAM_SPORTS' },
  { num: '27', id: 'misto_forca_cardio', name: 'Misto Cardio & Força', split: 'MistoCardio', code: 'MIXED_CARDIO_STRENGTH' },
  { num: '28', id: 'nenhum_sedentario', name: 'Sedentário & Readaptação', split: 'Sedentario', code: 'SEDENTARY' }
];

for (const tc of MODALITY_TEST_CASES) {
  test(`${tc.num}. Contingência Obrigatória: Modalidade [${tc.name}] (${tc.id})`, async () => {
    // 1. Simulação de Falha da IA (HTTP 503)
    const sm = new TrainingGenerationStateMachine({ maxRetries: 1, initialBackoffMs: 5 });
    const mockFailingAi = async () => {
      const err = new Error(`Simulated HTTP 503 Unavailable for ${tc.name}`);
      err.status = 503;
      throw err;
    };

    const patientContext = {
      patientId: `pat_${tc.id}`,
      name: `Paciente Teste ${tc.name}`,
      trainingGoal: tc.name,
      modalityId: tc.id,
      preferredSplit: tc.split,
      availableEquipment: ['bodyweight', 'barbell', 'dumbbells', 'treadmill', 'bike', 'pool'],
      targetFrequency: 3
    };

    // 2. Execução da Máquina de Estados com Fallback
    const result = await sm.execute({
      patientContext,
      aiGeneratorFn: mockFailingAi
    });

    // 3. Confirmação do Acionamento do Fallback
    assert.strictEqual(result.contingencyUsed, true, `Contingência deve ser acionada para ${tc.name}`);
    assert.strictEqual(result.source, 'DETERMINISTIC', `Fonte deve ser DETERMINISTIC para ${tc.name}`);
    assert.ok(result.contingencyReason.includes('503'), `Motivo de contingência deve citar 503 para ${tc.name}`);

    // 4. Verificação da Prescrição e do Motor Acionado
    const presc = result.prescription;
    assert.ok(presc, `Prescrição gerada não pode ser nula para ${tc.name}`);
    assert.strictEqual(presc.metadata.generator, 'LOCAL_CONTINGENCY');
    assert.strictEqual(presc.splitSource, 'DETERMINISTIC');

    // 5. Validação Estrita do Contrato Canônico DTO
    const val = validateTrainingPrescriptionDTO(presc);
    assert.strictEqual(val.isValid, true, `Prescrição de ${tc.name} deve ser 100% válida no DTO. Erros: ${JSON.stringify(val.errors)}`);

    // 6. Verificação de Rotinas e Exercícios
    assert.ok(Array.isArray(presc.routines) && presc.routines.length >= 1, `Deve possuir ao menos 1 rotina em ${tc.name}`);
    for (const r of presc.routines) {
      assert.ok(Array.isArray(r.exercises) && r.exercises.length >= 1, `Rotina "${r.routineName}" deve conter exercícios para ${tc.name}`);
      for (const ex of r.exercises) {
        assert.ok(ex.exerciseName, `Exercício deve possuir nome legível em ${tc.name}`);
        assert.ok(ex.sets >= 1, `Sets >= 1 em ${tc.name}`);
        assert.ok(ex.reps, `Reps presentes em ${tc.name}`);
      }
    }

    // 7. Verificação do Microciclo de 7 Dias
    assert.ok(Array.isArray(presc.weeklySchedule) && presc.weeklySchedule.length === 7, `Schedule semanal deve ter 7 dias em ${tc.name}`);

    // 8. Simulação de Persistência e Recuperação
    const savedPayload = JSON.parse(JSON.stringify(presc));
    assert.strictEqual(savedPayload.patientId, `pat_${tc.id}`);
    assert.strictEqual(savedPayload.splitSource, 'DETERMINISTIC');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 4: TESTE DE INTEGRAÇÃO DE PONTA A PONTA
// ─────────────────────────────────────────────────────────────────────────────

test('29. Teste de Ponta a Ponta: Falha 503 -> Fallback -> DTO -> Persistência -> Renderização Paciente', async () => {
  const patientId = 'pt_e2e_resilience_homologation';

  // 1. Simula chamada à IA com falha persistente de sobrecarga (503)
  const sm = new TrainingGenerationStateMachine({ maxRetries: 2, initialBackoffMs: 5 });
  const failingAi = async () => {
    const err = new Error('Google Gemini 503: The model is overloaded.');
    err.status = 503;
    throw err;
  };

  const patientCtx = {
    patientId,
    name: 'Paciente E2E Homologado',
    preferredSplit: 'HYROX',
    modalityId: 'hyrox_racing',
    availableEquipment: ['skierg', 'sled', 'rower', 'wall_ball'],
    historicalLogs: []
  };

  const execResult = await sm.execute({
    patientContext: patientCtx,
    aiGeneratorFn: failingAi
  });

  assert.strictEqual(execResult.contingencyUsed, true);
  assert.strictEqual(execResult.source, 'DETERMINISTIC');

  // 2. Validação canônica DTO
  const dtoVal = validateTrainingPrescriptionDTO(execResult.prescription);
  assert.strictEqual(dtoVal.isValid, true);

  // 3. Simula gravação no formato persistido por savePerformanceForPatient
  const performanceRecord = {
    id: patientId,
    patientId: patientId,
    activeSplit: execResult.prescription.split,
    workoutPlan: execResult.prescription.routines.map(r => ({
      id: r.routineId || r.id || 'A',
      name: r.routineName || r.name || 'Treino A',
      exercises: r.exercises.map(ex => ({
        name: ex.exerciseName || ex.name,
        sets: ex.sets,
        reps: ex.reps,
        rpe: ex.rpe || 8,
        rest: ex.rest || 60,
        obs: ex.notes || ''
      }))
    })),
    weeklySchedule: execResult.prescription.weeklySchedule,
    meta: {
      isAIGenerated: false,
      isContingency: true,
      splitSource: 'DETERMINISTIC',
      contingencyReason: execResult.contingencyReason,
      validatedAt: null
    },
    lastUpdated: new Date().toISOString()
  };

  // 4. Validação de formato para o App do Paciente (disciplina)
  assert.ok(Array.isArray(performanceRecord.workoutPlan) && performanceRecord.workoutPlan.length >= 1);
  assert.strictEqual(performanceRecord.meta.splitSource, 'DETERMINISTIC');
  assert.strictEqual(performanceRecord.meta.isContingency, true);
  assert.strictEqual(performanceRecord.weeklySchedule.length, 7);

  // 5. Teste de desserialização (leitura do Dexie / Firestore)
  const roundtripJson = JSON.parse(JSON.stringify(performanceRecord));
  assert.strictEqual(roundtripJson.patientId, patientId);
  assert.strictEqual(roundtripJson.activeSplit, 'HYROX');
  assert.strictEqual(roundtripJson.workoutPlan[0].exercises.length > 0, true);
});
