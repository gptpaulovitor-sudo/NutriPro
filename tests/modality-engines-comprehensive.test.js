const { test } = require('node:test');
const assert = require('node:assert');

// Carrega os módulos de domínio de treinamento
const {
  ModalityCatalog,
  EquipmentService,
  RecoveryEngine,
  ProgressionEngine,
  ModalityEngineRegistry
} = require('../domain/training');

const {
  validateTrainingPrescriptionDTO,
  validateTrainingSplit
} = require('../domain/contracts/TrainingPrescriptionDTO');

test('=== BATERIA COMPLETA DE AUDITORIA E TESTES DOS MOTORES DE PRESCRIÇÃO ===', async (t) => {

  await t.test('1. Catálogo e Registro Canônico das 18 Modalidades', () => {
    const modalities = ModalityCatalog.getAllModalities();
    assert.strictEqual(modalities.length, 18, 'O catálogo deve conter exatamente 18 modalidades oficiais');

    for (const mod of modalities) {
      assert.ok(mod.id, `Modalidade deve possuir id: ${JSON.stringify(mod)}`);
      assert.ok(mod.name, `Modalidade ${mod.id} deve possuir name legível`);
      assert.ok(mod.defaultSplit, `Modalidade ${mod.id} deve possuir defaultSplit`);
      assert.ok(Array.isArray(mod.primaryMetrics), `Modalidade ${mod.id} deve listar primaryMetrics`);
      assert.ok(Array.isArray(mod.requiredEquipment), `Modalidade ${mod.id} deve listar requiredEquipment`);

      // Verifica se o defaultSplit é aceito pelo validador canônico
      const splitVal = validateTrainingSplit(mod.defaultSplit);
      assert.strictEqual(splitVal.isValid, true, `defaultSplit "${mod.defaultSplit}" de ${mod.id} deve ser válido no DTO`);

      // Verifica se o motor está registrado no ModalityEngineRegistry
      const engine = ModalityEngineRegistry.getEngine(mod.id);
      assert.ok(engine, `Motor para a modalidade "${mod.id}" deve estar registrado no ModalityEngineRegistry`);
      assert.strictEqual(typeof engine.generateRoutines, 'function', `Motor ${mod.id} deve implementar generateRoutines()`);
    }
  });

  await t.test('2. Geração de Prescrições Específicas para Todas as 18 Modalidades', () => {
    const modalities = ModalityCatalog.getAllModalities();

    for (const mod of modalities) {
      const prescription = ModalityEngineRegistry.generatePrescription(mod.id, {
        experienceLevel: 'intermediario',
        goal: 'condicionamento'
      });

      assert.ok(prescription, `Prescrição gerada para ${mod.id} não deve ser nula`);
      assert.ok(prescription.split, `Prescrição de ${mod.id} deve declarar split: ${prescription.split}`);
      assert.ok(Array.isArray(prescription.routines), `Prescrição de ${mod.id} deve conter array de rotinas`);
      assert.ok(prescription.routines.length >= 1, `Prescrição de ${mod.id} deve conter pelo menos 1 rotina`);

      // Cada rotina deve ter exercícios válidos e parâmetros específicos
      for (const r of prescription.routines) {
        assert.ok(r.id, `Rotina em ${mod.id} deve possuir id`);
        assert.ok(r.name, `Rotina em ${mod.id} deve possuir name`);
        assert.ok(Array.isArray(r.exercises), `Rotina em ${mod.id} deve possuir exercises`);
        assert.ok(r.exercises.length >= 1, `Rotina em ${mod.id} deve possuir ao menos 1 exercício`);

        for (const ex of r.exercises) {
          assert.ok(ex.name, `Exercício em ${mod.id} deve possuir nome`);
          // Compatibilidade obrigatória com infraestrutura legada
          assert.ok(ex.sets >= 1, `Exercício ${ex.name} deve ter sets >= 1`);
          assert.ok(ex.reps, `Exercício ${ex.name} deve ter reps definidos`);
          assert.ok(ex.rpe >= 1 && ex.rpe <= 10, `Exercício ${ex.name} deve ter rpe entre 1 e 10`);
          assert.ok(ex.rest >= 0, `Exercício ${ex.name} deve ter rest >= 0`);
        }
      }

      // Validação estrita do TrainingPrescriptionDTO
      const prescriptionDTO = {
        patientId: 'patient_test_01',
        split: prescription.split,
        splitSource: 'DETERMINISTIC',
        frequency: Math.min(7, Math.max(1, prescription.routines.length)),
        routines: prescription.routines,
        meta: {
          modality: mod.id,
          generatedAt: new Date().toISOString()
        }
      };

      const dtoVal = validateTrainingPrescriptionDTO(prescriptionDTO);
      assert.strictEqual(
        dtoVal.isValid,
        true,
        `Prescrição de ${mod.id} deve ser 100% válida no DTO: ${dtoVal.errors?.join(', ')}`
      );
    }
  });

  await t.test('3. Semântica e Métricas Nativas por Modalidade', () => {
    // 3.1 Corrida: distanceKm, paceMinKm
    const runPresc = ModalityEngineRegistry.generatePrescription('corrida_endurance', { targetDistanceKm: 10, targetPace: '5:15' });
    const runEx = runPresc.routines[0].exercises[0];
    assert.ok(runEx.distanceKm > 0, 'Corrida deve conter distanceKm nativo');
    assert.ok(runEx.paceMinKm, 'Corrida deve conter paceMinKm nativo');

    // 3.2 Ciclismo: powerWatts, cadenceRpm
    const cycPresc = ModalityEngineRegistry.generatePrescription('ciclismo_spinning', { ftpWatts: 220 });
    const cycEx = cycPresc.routines[0].exercises[0];
    assert.ok(cycEx.powerWatts > 0, 'Ciclismo deve conter powerWatts nativo');
    assert.ok(cycEx.cadenceRpm > 0, 'Ciclismo deve conter cadenceRpm nativo');

    // 3.3 Natação: totalMeters, stroke
    const swimPresc = ModalityEngineRegistry.generatePrescription('natacao', { poolLengthMeters: 25 });
    const swimEx = swimPresc.routines[0].exercises[0];
    assert.ok(swimEx.totalMeters > 0, 'Natação deve conter totalMeters nativo');
    assert.ok(swimEx.stroke, 'Natação deve conter estilo (stroke) nativo');

    // 3.4 Metcon: roundsCount, timeCapMinutes
    const metconPresc = ModalityEngineRegistry.generatePrescription('metcon_hibrido', { metconFormat: 'AMRAP' });
    const metconEx = metconPresc.routines[0].exercises[0];
    assert.ok(metconEx.roundsCount > 0, 'Metcon deve conter roundsCount');
    assert.ok(metconEx.timeCapMinutes > 0, 'Metcon deve conter timeCapMinutes');

    // 3.5 Calistenia: leverageTier, progressionLevel
    const calPresc = ModalityEngineRegistry.generatePrescription('calistenia', { pullUpMaxReps: 5 });
    const calEx = calPresc.routines[0].exercises[0];
    assert.ok(calEx.leverageTier >= 1, 'Calistenia deve conter leverageTier');
    assert.ok(calEx.progressionLevel, 'Calistenia deve conter progressionLevel');

    // 3.6 Sedentário: dailyStepsTarget, baixa intensidade clínica (RPE <= 5.5)
    const sedPresc = ModalityEngineRegistry.generatePrescription('nenhum_sedentario', {});
    for (const r of sedPresc.routines) {
      for (const ex of r.exercises) {
        assert.ok(ex.rpe <= 5.5, `Exercício de sedentário ${ex.name} não pode exceder RPE 5.5, recebido ${ex.rpe}`);
      }
    }
  });

  await t.test('4. Serviço de Equipamentos e Substituições Biomecânicas', () => {
    // 4.1 Identificação de disponibilidade
    const userGear = ['halteres', 'banco_reto', 'peso_corporal', 'colchonete'];
    const barbellEquip = ['barra_olimpica', 'banco_reto'];
    const dumbbellEquip = ['halteres', 'banco_reto'];

    const resBarbell = EquipmentService.checkExerciseFeasibility(barbellEquip, userGear);
    const resDumbbell = EquipmentService.checkExerciseFeasibility(dumbbellEquip, userGear);

    assert.strictEqual(resBarbell.isFeasible, false, 'Supino com barra deve ser inviável sem barra olímpica');
    assert.strictEqual(resDumbbell.isFeasible, true, 'Exercício de halteres deve ser viável');

    // 4.2 Substituição com equivalência biomecânica e aviso de desvio de estímulo
    const sub = EquipmentService.findBestSubstitution('pe01', userGear);
    assert.ok(sub, 'Deve encontrar substituto para Supino Reto com Barra');
    assert.strictEqual(sub.replacementId, 'pe04', 'Deve sugerir pe04 (Supino com Halteres)');
    assert.ok(sub.stimulusDifference, 'Deve conter nota explicando a alteração no perfil do estímulo');
  });

  await t.test('5. Motor de Progressão Específico por Modalidade', () => {
    // 5.1 Musculação: Double Progression
    const progStrength = ProgressionEngine.calculateStrengthProgression(
      { sets: 3, reps: '8-10', loadKg: 80, rpe: 8 },
      [{ repsCompleted: 10, rpeExperienced: 8.0, technicalQuality: 'BOA' }] // Bateu teto de 10 reps
    );
    assert.strictEqual(progStrength.decision, ProgressionEngine.DECISIONS.PROGRESS);
    assert.strictEqual(progStrength.action, 'AUMENTAR CARGA');
    assert.strictEqual(progStrength.suggestedLoadKg, 82.5, 'Carga deve subir para 82.5kg (+2.5kg)');

    // Repetir carga por esforço estourado ou técnica comprometida
    const repeatStrength = ProgressionEngine.calculateStrengthProgression(
      { sets: 3, reps: '8-10', loadKg: 85, rpe: 8 },
      [{ repsCompleted: 10, rpeExperienced: 10.0, technicalQuality: 'COMPROMETIDA' }]
    );
    assert.strictEqual(repeatStrength.decision, ProgressionEngine.DECISIONS.REPEAT);

    // 5.2 Corrida: Regra dos 10% de volume
    const progRun = ProgressionEngine.calculateRunningProgression(
      { distanceKm: 10, paceMinKm: '5:20' },
      [{ totalKm: 30, avgRpe: 7.0, discomfortReported: false }]
    );
    assert.strictEqual(progRun.decision, ProgressionEngine.DECISIONS.PROGRESS);
    assert.ok(progRun.suggestedDistanceKm <= 11.0, 'Distância deve respeitar o teto de 10%');

    // 5.3 Ciclismo: Incremento sustentado de FTP / Sweet Spot
    const progCyc = ProgressionEngine.calculateCyclingProgression(
      { durationMinutes: 45, powerWatts: 200, ftpPercentage: '88%' },
      [{ completedFully: true, avgRpe: 7.0 }]
    );
    assert.strictEqual(progCyc.decision, ProgressionEngine.DECISIONS.PROGRESS);
    assert.ok(progCyc.suggestedWatts > 200, 'Watts alvo devem progredir');

    // 5.4 Natação: Redução de intervalo e aumento de metragem
    const progSwim = ProgressionEngine.calculateSwimmingProgression(
      { totalMeters: 1500, intervalRestSeconds: 30 },
      [{ completedMeters: 1500, avgRpe: 7.0 }]
    );
    assert.strictEqual(progSwim.decision, ProgressionEngine.DECISIONS.PROGRESS);
    assert.strictEqual(progSwim.suggestedMeters, 1650, 'Metros devem subir (+150m)');

    // 5.5 Sedentário: Incremento gradual de passos (NEAT)
    const progSed = ProgressionEngine.calculateSedentaryProgression(
      { dailyStepsTarget: 5000, walkingMinutesDay: 20 },
      [{ avgDailySteps: 4800 }]
    );
    assert.strictEqual(progSed.decision, ProgressionEngine.DECISIONS.PROGRESS);
    assert.strictEqual(progSed.suggestedDailySteps, 5750, 'Passos devem subir gradualmente (+750)');
  });

  await t.test('6. Motor de Recuperação e Auditoria de Conflitos Fisiológicos', () => {
    // 6.1 Detecção de prontidão diária
    const readiness = RecoveryEngine.evaluateReadinessAndFatigue({
      rpeScore: 7.0,
      completionRate: 100,
      jointDiscomfort: 'nenhum'
    });
    assert.strictEqual(readiness.readinessStatus, 'OPTIMAL');

    // 6.2 Redução por desconforto articular
    const jointDeload = RecoveryEngine.evaluateReadinessAndFatigue({
      rpeScore: 8.0,
      completionRate: 90,
      jointDiscomfort: 'joelho'
    });
    assert.strictEqual(jointDeload.readinessStatus, 'DELOAD');
    assert.ok(jointDeload.volumeModifier < 1.0, 'Volume deve ser reduzido em caso de dor articular');

    // 6.3 Auditoria de distribuição semanal
    const weeklyCheck = RecoveryEngine.evaluateWeeklyRecoveryDistribution([
      { dayKey: 'd1', type: 'Treino', title: 'Treino Lower Força' },
      { dayKey: 'd2', type: 'Treino', title: 'Treino Legs Hipertrofia' }
    ]);
    assert.strictEqual(weeklyCheck.hasConflicts, true, 'Deve apontar conflito ao treinar quadríceps em dias consecutivos');
    assert.ok(weeklyCheck.warnings.length > 0, 'Deve gerar alertas clínicos de recuperação');
  });

  await t.test('7. Coordenação de Treinos Híbridos Multidisciplinares', () => {
    // 7.1 Triathlon: 3 disciplinas coordenadas com volumes distintos
    const triPresc = ModalityEngineRegistry.generatePrescription('triathlon', {
      raceDistance: 'OLYMPIC',
      weeklyFrequency: 5
    });
    assert.strictEqual(triPresc.split, 'Triathlon');
    const routineNames = triPresc.routines.map(r => r.name.toLowerCase());
    assert.ok(routineNames.some(n => n.includes('natação')), 'Triathlon deve conter sessão de Natação');
    assert.ok(routineNames.some(n => n.includes('ciclismo')), 'Triathlon deve conter sessão de Ciclismo');
    assert.ok(routineNames.some(n => n.includes('corrida')), 'Triathlon deve conter sessão de Corrida');

    // 7.2 Corrida + Musculação: separação de volumes e proteção de pernas
    const runStrPresc = ModalityEngineRegistry.generatePrescription('corrida_musculacao', { priority: 'RUNNING' });
    assert.strictEqual(runStrPresc.split, 'RunningStrength');
    assert.ok(runStrPresc.routines.some(r => r.name.toLowerCase().includes('corrida')), 'Deve ter rotina de corrida');
    assert.ok(runStrPresc.routines.some(r => r.name.toLowerCase().includes('força') || r.name.toLowerCase().includes('upper')), 'Deve ter rotina de força');
  });

  await t.test('8. Segurança Clínica do Protocolo Sedentário', () => {
    const sedPresc = ModalityEngineRegistry.generatePrescription('nenhum_sedentario', { initialMobilityScore: 'low' });

    assert.strictEqual(sedPresc.split, 'Sedentario');
    for (const r of sedPresc.routines) {
      for (const ex of r.exercises) {
        // Garantir que nenhum exercício é levantamento olímpico, agachamento pesado ou RPE excessivo
        assert.ok(!ex.name.toLowerCase().includes('deadlift pesado'), 'Sedentário não deve fazer terra pesado');
        assert.ok(!ex.name.toLowerCase().includes('snatch'), 'Sedentário não deve fazer LPO');
        assert.ok(ex.rpe <= 5.0, 'RPE de sedentário deve ser estritamente leve/moderado (<= 5)');
      }
    }
  });

});
