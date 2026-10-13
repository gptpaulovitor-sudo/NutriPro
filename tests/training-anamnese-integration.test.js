const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

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

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 1: WHITELIST DE EQUIPAMENTOS E SUBSTITUIÇÃO BIOMECÂNICA
// ─────────────────────────────────────────────────────────────────────────────

test('1. Whitelist de Equipamentos: Permite apenas equipamentos disponíveis e substitui', () => {
  const catalog = [
    {
      exerciseId: 'ex_str_bench_press_barbell',
      name: 'Supino Reto com Barra Olímpica',
      equipment: 'Barra e banco',
      sets: 4,
      reps: '8-10',
      rpe: 8.0,
      rest: 90
    },
    {
      exerciseId: 'ex_str_dumbbell_row',
      name: 'Remada Unilateral com Halteres',
      equipment: 'Halteres',
      sets: 3,
      reps: '10-12',
      rpe: 8.0,
      rest: 60
    },
    {
      exerciseId: 'ex_str_cable_crossover',
      name: 'Crucifixo no Crossover Polia Alta',
      equipment: 'Crossover / Polias',
      sets: 3,
      reps: '12-15',
      rpe: 7.5,
      rest: 45
    }
  ];

  // Paciente que só tem halteres e banco reto em casa (sem barras, sem máquinas/polias)
  const patientAnamnesis = {
    equipamentosDisponiveis: ['Halteres', 'Banco Reto', 'Peso Corporal'],
    anamnese: {
      observacoes: 'Treina em home gym simples com halteres ajustáveis e banco.'
    }
  };

  const filtered = EquipmentService.filterExercisesByEquipment(catalog, patientAnamnesis);

  assert.ok(Array.isArray(filtered), 'Retorno deve ser um array');
  assert.ok(filtered.length >= 2, 'Deve manter exercícios compatíveis ou substituídos');

  // Supino com barra deve ter sido substituído por supino com halteres
  const bench = filtered.find(e => e.exerciseId === 'ex_str_bench_press_dumbbell' || e.name.toLowerCase().includes('halter'));
  assert.ok(bench, 'Supino com barra deve ser substituído por variante com halteres');
  assert.ok(bench.obs.includes('Substituído biomecanicamente'), 'Deve conter observação clínica da substituição');

  // Remada com halteres deve ser preservada intacta
  const row = filtered.find(e => e.exerciseId === 'ex_str_dumbbell_row');
  assert.ok(row, 'Remada com halteres deve ser mantida');

  // Crossover sem polias e sem substituto no home gym deve ser filtrado
  const crossover = filtered.find(e => e.exerciseId === 'ex_str_cable_crossover');
  assert.strictEqual(crossover, undefined, 'Crucifixo em polia deve ser removido por falta de equipamento');
});

test('2. Whitelist com Ergômetros de Alta Performance (SkiErg, RowErg, AirBike)', () => {
  const catalog = [
    {
      exerciseId: 'hiit_skierg_sprint',
      name: 'SkiErg Concept2 Sprints',
      equipment: 'SkiErg',
      module: 'HIIT',
      sets: 5,
      reps: '100m sprint'
    },
    {
      exerciseId: 'hiit_row_sprint',
      name: 'Remo RowErg Sprints',
      equipment: 'Remo RowErg',
      module: 'HIIT',
      sets: 5,
      reps: '100m sprint'
    },
    {
      exerciseId: 'hiit_airbike_sprint',
      name: 'AirBike Anaerobic Power',
      equipment: 'AirBike',
      module: 'HIIT',
      sets: 5,
      reps: '20s sprint'
    }
  ];

  const patientAnamnesis = {
    equipamentosDisponiveis: ['SkiErg', 'RowErg', 'AirBike', 'Barra Olímpica'],
    constraints: {
      equipmentDetails: {
        hasSkiErg: true,
        hasRowErg: true,
        hasAirBike: true
      }
    }
  };

  const filtered = EquipmentService.filterExercisesByEquipment(catalog, patientAnamnesis);
  assert.strictEqual(filtered.length, 3, 'Todos os ergômetros cadastrados devem ser aceitos');
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 2: BLACKLIST ESTREITA — RECUSA DE CORRIDA E SALVAGUARDA DE JEJUM
// ─────────────────────────────────────────────────────────────────────────────

test('3. Blacklist Estrita de Corrida com Fallback para Ergômetros Disponíveis', () => {
  const catalogWithRunning = [
    {
      exerciseId: 'hiit_esteira_sprint',
      name: 'Sprint Máximo em Esteira Inclinada',
      equipment: 'Esteira',
      module: 'HIIT',
      sessionType: 'CARDIO',
      hiitModality: 'Esteira',
      sets: 6,
      reps: '30s sprint / 30s descanso',
      rpe: 9.0
    },
    {
      exerciseId: 'lg01',
      name: 'Agachamento Livre com Barra',
      equipment: 'Barra e Rack',
      sets: 4,
      reps: '6-8',
      rpe: 8.5
    }
  ];

  // Paciente recusa corrida de rua / 21km, mas possui RowErg disponível
  const patientAnamnesis = {
    equipamentosDisponiveis: ['RowErg', 'Barra Olímpica', 'Halteres'],
    anamnese: {
      observacoes: 'Paciente tem histórico de condromalácia patelar e recusa corrida de rua e provas de 21km.'
    }
  };

  const filtered = EquipmentService.filterExercisesByEquipment(catalogWithRunning, patientAnamnesis);

  // Não deve conter esteira nem corrida
  const hasRunning = filtered.some(e => /esteira|corrida|rua/i.test(e.name || '') || /esteira|corrida/i.test(e.hiitModality || ''));
  assert.strictEqual(hasRunning, false, 'Nenhum exercício de corrida ou esteira pode permanecer');

  // Bloco de HIIT deve ter feito fallback para RowErg
  const hiitBlock = filtered.find(e => e.module === 'HIIT');
  assert.ok(hiitBlock, 'Módulo de HIIT deve ser preservado');
  assert.strictEqual(hiitBlock.exerciseId, 'hiit_row_sprint', 'Exercício de HIIT deve ter fallback para RowErg');
  assert.ok(hiitBlock.name.includes('RowErg'), 'Nome do exercício deve indicar Remo RowErg');
  assert.ok(hiitBlock.obs.includes('corrida bloqueada na anamnese'), 'Observação deve registrar a restrição clínica');
});

test('4. Salvaguarda de Treino em Jejum (Exclusão quando Não Tolerado)', () => {
  const catalog = [
    {
      exerciseId: 'cardio_fasted_01',
      name: 'Cardio LISS em Estado de Jejum Matinal',
      equipment: 'Bicicleta Ergométrica',
      obs: 'Protocolo de treino em jejum matinal para oxidação de gorduras.',
      sets: 1,
      reps: '40 min'
    }
  ];

  const patientAnamnesis = {
    equipamentosDisponiveis: ['Full Gym'],
    anamnese: {
      observacoes: 'Paciente relata episódios de hipoglicemia e tontura; não tolera treino em jejum.'
    }
  };

  const filtered = EquipmentService.filterExercisesByEquipment(catalog, patientAnamnesis);
  assert.ok(filtered.length > 0);
  assert.strictEqual(/jejum/i.test(filtered[0].obs), false, 'Observação não deve conter prescrição de jejum');
  assert.ok(filtered[0].obs.includes('treino alimentado'), 'Deve recomendar treino em estado alimentado');
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 3: OTIMIZAÇÃO BIOMECÂNICA (ACESSÓRIOS DE SUPORTE: CINTURÃO E JOELHEIRAS)
// ─────────────────────────────────────────────────────────────────────────────

test('5. Otimização Biomecânica: Cinturão e Joelheiras priorizam compostos pesados no topo da rotina', () => {
  const routineExercises = [
    {
      exerciseId: 'pe08',
      name: 'Elevação Lateral com Halteres',
      equipment: 'Halteres',
      sets: 3,
      reps: '12-15',
      rpe: 7.5,
      rest: 60
    },
    {
      exerciseId: 'lg01',
      name: 'Agachamento Livre com Barra Olímpica',
      equipment: 'Barra e Rack',
      sets: 4,
      reps: '8-10',
      rpe: 8.0,
      rest: 120
    },
    {
      exerciseId: 'lg04',
      name: 'Leg Press 45° Articulado',
      equipment: 'Leg Press',
      sets: 3,
      reps: '10-12',
      rpe: 8.0,
      rest: 90
    },
    {
      exerciseId: 'pe12',
      name: 'Tríceps Corda na Polia',
      equipment: 'Crossover / Polias',
      sets: 3,
      reps: '12-15',
      rpe: 8.0,
      rest: 45
    }
  ];

  // Paciente com cinturão e joelheiras relatados na anamnese
  const patientAnamnesis = {
    equipamentosDisponiveis: ['Full Gym'],
    anamnese: {
      observacoes: 'Utiliza cinturão de levantamento peso e joelheiras de neoprene 7mm para agachamento e leg press pesados.'
    }
  };

  const optimized = EquipmentService.filterExercisesByEquipment(routineExercises, patientAnamnesis);

  // 1. Agachamento Livre e Leg Press devem vir primeiro (topo da rotina)
  assert.strictEqual(optimized[0].exerciseId, 'lg01', 'Agachamento Livre deve ser o primeiro exercício da sessão');
  assert.strictEqual(optimized[1].exerciseId, 'lg04', 'Leg Press 45° deve ser o segundo exercício da sessão');

  // 2. Parâmetros de intensidade devem ser calibrados para força pesada (RIR 1-2)
  const squat = optimized[0];
  assert.strictEqual(squat.heavyCompoundPrioritized, true, 'Agachamento deve ser marcado como priorizado');
  assert.strictEqual(squat.rir, 1.5, 'RIR deve estar estritamente entre 1 e 2 (1.5)');
  assert.strictEqual(squat.rpe, 8.5, 'RPE deve ser elevado para 8.5');
  assert.strictEqual(squat.reps, '6-8', 'Repetições devem ser ajustadas para faixa mais baixa');
  assert.ok(squat.obs.includes('cinturão e joelheiras'), 'Observação deve explicitar o suporte biomecânico');

  const legPress = optimized[1];
  assert.strictEqual(legPress.heavyCompoundPrioritized, true);
  assert.strictEqual(legPress.rir, 1.5);
  assert.strictEqual(legPress.rpe, 8.5);
  assert.strictEqual(legPress.reps, '6-8');
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 4: INTEGRAÇÃO DOS MOTORES DE MODALIDADE COM filterExercisesByEquipment
// ─────────────────────────────────────────────────────────────────────────────

test('6. StrengthEngine e HiitStrengthEngine executam filterExercisesByEquipment', () => {
  const strengthEngine = ModalityEngineRegistry.getEngine('STRENGTH_HYPERTROPHY');
  const hiitEngine = ModalityEngineRegistry.getEngine('HIIT_STRENGTH');

  assert.ok(strengthEngine, 'StrengthEngine deve estar registrado');
  assert.ok(hiitEngine, 'HiitStrengthEngine deve estar registrado');
  assert.strictEqual(typeof strengthEngine.filterExercisesByEquipment, 'function');
  assert.strictEqual(typeof hiitEngine.filterExercisesByEquipment, 'function');

  // Geração de rotinas no HiitStrengthEngine com bloqueio de corrida
  const hiitResult = hiitEngine.generateRoutines({
    experienceLevel: 'avancado',
    patientAnamnese: {
      equipamentosDisponiveis: ['SkiErg', 'AirBike', 'Barra Olímpica', 'Halteres'],
      anamnese: {
        observacoes: 'Não tolera corrida de rua. Ergômetros disponíveis: SkiErg e AirBike.'
      }
    }
  });

  const hiitRoutines = Array.isArray(hiitResult) ? hiitResult : (hiitResult.routines || []);
  assert.ok(Array.isArray(hiitRoutines) && hiitRoutines.length > 0, 'Deve gerar rotinas');
  for (const routine of hiitRoutines) {
    for (const ex of routine.exercises) {
      assert.strictEqual(/corrida|rua|asfalto/i.test(ex.name || ''), false, `Exercício ${ex.name} não pode ser corrida`);
    }
  }

  // Geração no StrengthEngine com acessórios de suporte
  const strengthResult = strengthEngine.generateRoutines({
    split: 'PPL',
    experienceLevel: 'avancado',
    patientAnamnese: {
      equipamentosDisponiveis: ['Full Gym'],
      anamnese: {
        observacoes: 'Usa cinturão e joelheiras para treinos pesados de perna.'
      }
    }
  });

  const strengthRoutines = Array.isArray(strengthResult) ? strengthResult : (strengthResult.routines || []);
  assert.ok(Array.isArray(strengthRoutines) && strengthRoutines.length > 0, 'Deve gerar rotinas de força');
  const legDay = strengthRoutines.find(r => r.id === 'C' || /perna|legs/i.test(r.name || r.routineName || ''));
  if (legDay && legDay.exercises.length > 0) {
    const firstEx = legDay.exercises[0];
    assert.ok(
      firstEx.heavyCompoundPrioritized || /agachamento|leg press|squat/i.test(firstEx.name || firstEx.exerciseName || ''),
      'Primeiro exercício do dia de perna deve ser composto pesado priorizado'
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 5: GERADOR DETERMINÍSTICO E RESILIÊNCIA CONTINGENCIAL
// ─────────────────────────────────────────────────────────────────────────────

test('7. DeterministicTrainingGenerator aplica filtragem de equipamentos da anamnese', () => {
  const result = DeterministicTrainingGenerator.generatePrescription('STRENGTH_HYPERTROPHY', {
    split: 'PPL',
    patientAnamnese: {
      equipamentosDisponiveis: ['Halteres', 'Banco Reto', 'Peso Corporal'],
      anamnese: {
        observacoes: 'Apenas halteres e banco em casa.'
      }
    }
  });

  assert.ok(result && result.routines, 'Plano contingencial deve ser gerado');
  for (const routine of result.routines) {
    for (const ex of routine.exercises) {
      // Nenhum exercício deve exigir barra olímpica sem substituição
      assert.strictEqual(
        /barra olímpica/i.test(ex.equipment || '') && !/halter/i.test(ex.name || ''),
        false,
        `Exercício ${ex.name} deve ser viável apenas com halteres/peso corporal`
      );
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 6: EXTRAÇÃO DE CONTEXTO EM APP.JS (buildPerformanceContext)
// ─────────────────────────────────────────────────────────────────────────────

test('8. Validação Estrutural da Extração da Anamnese em app.js', () => {
  const appJsCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  // 1. Verifica presença das regras de extração de equipamentos
  assert.ok(appJsCode.includes('rawEquipSources.push(p.anamnese.equipamentosDisponiveis)'), 'Deve extrair equipamentosDisponiveis da anamnese');
  assert.ok(appJsCode.includes('hasSkiErg:'), 'Deve calcular boolean hasSkiErg');
  assert.ok(appJsCode.includes('hasRowErg:'), 'Deve calcular boolean hasRowErg');
  assert.ok(appJsCode.includes('hasAirBike:'), 'Deve calcular boolean hasAirBike');
  assert.ok(appJsCode.includes('hasBarbell:'), 'Deve calcular boolean hasBarbell');
  assert.ok(appJsCode.includes('hasDumbbells:'), 'Deve calcular boolean hasDumbbells');

  // 2. Verifica presença de histórico de rotina (PHAT, Upper/Lower, etc.)
  assert.ok(appJsCode.includes('p.anamnese?.rotina'), 'Deve inspecionar p.anamnese.rotina');
  assert.ok(appJsCode.includes('p.anamnese?.divisaoRotina'), 'Deve inspecionar divisaoRotina');
  assert.ok(appJsCode.includes('p.anamnese?.historicoRotina'), 'Deve inspecionar historicoRotina');
  assert.ok(appJsCode.includes('splitsReported.push(\'PHAT\')'), 'Deve reconhecer divisão PHAT');
  assert.ok(appJsCode.includes('splitsReported.push(\'UpperLower\')'), 'Deve reconhecer divisão UpperLower');

  // 3. Verifica proibição de corrida e acessórios de suporte
  assert.ok(appJsCode.includes('prohibitedModalities: extractedProhibitedModalities'), 'Deve expor prohibitedModalities');
  assert.ok(appJsCode.includes('supportAccessories: supportAccessories'), 'Deve expor supportAccessories');
  assert.ok(appJsCode.includes('heavyCompoundPriority: heavyCompoundPriority'), 'Deve expor heavyCompoundPriority');
  assert.ok(appJsCode.includes('filterExercisesByEquipment'), 'app.js deve invocar filterExercisesByEquipment');

  // 4. Invariante: peso 115.8 hardcoded foi completamente removido
  assert.strictEqual(appJsCode.includes('115.8'), false, 'Não deve existir peso 115.8 hardcoded em app.js');
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 7: FONTES DE VERDADE UNIFICADAS (ExerciseCatalog & SplitPresets)
// ─────────────────────────────────────────────────────────────────────────────

test('9. ExerciseCatalog e SplitPresets são a fonte canônica única compartilhada', () => {
  const { ExerciseCatalog, SplitPresets } = require('../domain/training');

  // 1. ExerciseCatalog
  assert.ok(ExerciseCatalog, 'ExerciseCatalog deve ser exportado');
  assert.ok(Array.isArray(ExerciseCatalog.EXERCISE_DATABASE), 'EXERCISE_DATABASE deve ser array');
  assert.ok(ExerciseCatalog.EXERCISE_DATABASE.length >= 130, 'Deve conter catálogo completo de exercícios');
  
  // Verifica estações HYROX unificadas
  const hy06 = ExerciseCatalog.findExerciseById('hy06');
  assert.ok(hy06 && /sled push/i.test(hy06.name), 'Deve conter estações HYROX como Sled Push');

  // 2. SplitPresets
  assert.ok(SplitPresets, 'SplitPresets deve ser exportado');
  assert.ok(SplitPresets.TRAINING_SPLITS.HYROX, 'Deve conter split HYROX');
  assert.ok(SplitPresets.TRAINING_SPLITS.PHAT, 'Deve conter split PHAT');
  assert.ok(SplitPresets.TRAINING_SPLITS.PPL, 'Deve conter split PPL');
  assert.ok(SplitPresets.TRAINING_SPLITS.UpperLower, 'Deve conter split UpperLower');
  assert.ok(SplitPresets.TRAINING_SPLITS.Sedentario, 'Deve conter split Sedentario');

  // 3. Inferência canônica unificada
  assert.strictEqual(SplitPresets.inferSplitFromModality('HYROX Racing'), 'HYROX');
  assert.strictEqual(SplitPresets.inferSplitFromModality('Corrida e Musculação'), 'RunningStrength');
  assert.strictEqual(SplitPresets.inferSplitFromModality('Musculação', 4), 'UpperLower');
  assert.strictEqual(SplitPresets.inferSplitFromModality('Musculação', 5), 'PHAT');
  assert.strictEqual(SplitPresets.inferSplitFromModality('Musculação', 3), 'PPL');
  assert.strictEqual(SplitPresets.inferSplitFromModality('Sedentário'), 'Sedentario');

  // 4. Verificação de desduplicação em page.tsx
  const pageTsxCode = fs.readFileSync(path.join(__dirname, '..', 'app', 'dashboard', 'performance', 'page.tsx'), 'utf8');
  assert.ok(pageTsxCode.includes('@/domain/training/ExerciseCatalog'), 'page.tsx deve importar ExerciseCatalog canônico');
  assert.ok(pageTsxCode.includes('@/domain/training/SplitPresets'), 'page.tsx deve importar SplitPresets canônico');
  assert.ok(pageTsxCode.includes('TrainingGenerationStateMachine'), 'page.tsx deve importar TrainingGenerationStateMachine');
  assert.strictEqual(pageTsxCode.includes('setTimeout(resolve, 1800)'), false, 'page.tsx não deve ter mock estático de setTimeout 1800ms');
});

