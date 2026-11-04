const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');

test('Paridade Semanal DIA 1 a DIA 7 & Fichas de Execução Clínicas (PDF vs Disciplina vs Pro)', async (t) => {
  const discHtml = fs.readFileSync('disciplina/index.html', 'utf8');
  const appJs = fs.readFileSync('app.js', 'utf8');

  await t.test('1. Estrutura do App Disciplina suporta protocolos HYROX e 7 Dias', () => {
    assert.ok(discHtml.includes('hyrox_power_engine_45:'), 'disciplina/index.html deve conter hyrox_power_engine_45 no catálogo');
    assert.ok(discHtml.includes('hyrox_station_erg_intervals_30:'), 'disciplina/index.html deve conter hyrox_station_erg_intervals_30 no catálogo');
    assert.ok(discHtml.includes('function resolveCardioProtocolForDay'), 'disciplina/index.html deve conter resolveCardioProtocolForDay');
    assert.ok(discHtml.includes('function renderHeroWorkoutSelector'), 'disciplina/index.html deve conter renderHeroWorkoutSelector');
  });

  await t.test('2. Simulação em Sandbox VM do Disciplina com a Agenda do PDF', () => {
    const sandbox = {
      window: {},
      document: {
        getElementById: () => null,
        querySelectorAll: () => []
      },
      patientState: {
        activeSplit: 'PPL',
        selectedScheduleDay: 1,
        selectedRoutineKey: 'A',
        workoutPlan: [
          { id: 'A', name: 'Treino A · Push', exercises: [{ id: 'sup_reto', name: 'Supino Reto', sets: 4, reps: '8-10' }] },
          { id: 'B', name: 'Treino B · Pull', exercises: [{ id: 'pux_alta', name: 'Puxada Alta', sets: 4, reps: '8-10' }] },
          { id: 'C', name: 'Treino C · Legs', exercises: [{ id: 'agach_livre', name: 'Agachamento Livre', sets: 4, reps: '8-10' }] }
        ],
        cardioPrescription: {
          sessions: [
            { dayKey: 'd3', protocolId: 'hyrox_power_engine_45', protocolTitle: 'HYROX Power Engine & Compromised Running (45 min)' },
            { dayKey: 'd6', protocolId: 'hyrox_station_erg_intervals_30', protocolTitle: 'HYROX Station Builder (SkiErg + RowErg + Wall Balls)' }
          ]
        }
      },
      WORKOUT_DATABASE: {},
      WEEKLY_SCHEDULE_DATA: [],
      selectedScheduleDay: 1,
      selectedRoutineKey: 'A',
      saveState: () => {},
      updateSynergyCard: () => {},
      updateWorkoutVisuals: () => {},
      updateCardioVisuals: () => {},
      renderWorkoutCardioBlock: () => {},
      getLocalDateIso: () => '2026-11-04'
    };
    sandbox.window = sandbox;

    // Extrai o trecho do CANONICAL_CARDIO_CATALOG e funções de resolução
    const startIdx = discHtml.indexOf('const CANONICAL_CARDIO_CATALOG = {');
    const endIdx = discHtml.indexOf('window.CANONICAL_CARDIO_CATALOG = CANONICAL_CARDIO_CATALOG;', startIdx);
    assert.ok(startIdx !== -1 && endIdx !== -1, 'CANONICAL_CARDIO_CATALOG deve ser localizado');
    const catalogCode = discHtml.slice(startIdx, endIdx);
    vm.runInNewContext(catalogCode, sandbox);

    const resolveFnStart = discHtml.indexOf('function resolveCardioProtocolForDay(dayData) {');
    const resolveFnEnd = discHtml.indexOf('function buildCanonicalWeeklyScheduleForPatient', resolveFnStart);
    assert.ok(resolveFnStart !== -1 && resolveFnEnd !== -1, 'resolveCardioProtocolForDay deve ser localizado');
    const resolveCode = discHtml.slice(resolveFnStart, resolveFnEnd);
    vm.runInNewContext(resolveCode, sandbox);

    // Agenda simulada exata do PDF
    const scheduleFromPdf = [
      { dayNum: 1, dayKey: 'd1', dayName: 'DIA 1', routineKey: 'A', type: 'Treino', title: 'Treino A · Push (Peitoral, Deltoides & Tríceps)' },
      { dayNum: 2, dayKey: 'd2', dayName: 'DIA 2', routineKey: 'B', type: 'Treino', title: 'Treino B · Pull (Costas, Bíceps, Trapézio & Core)' },
      { dayNum: 3, dayKey: 'd3', dayName: 'DIA 3', routineKey: 'Cardio', type: 'Cardio', title: 'HYROX Power Engine & Compromised Running (45 min)' },
      { dayNum: 4, dayKey: 'd4', dayName: 'DIA 4', routineKey: 'C', type: 'Treino', title: 'Treino C · Legs (Quadríceps, Isquiotibiais & Panturrilhas)' },
      { dayNum: 5, dayKey: 'd5', dayName: 'DIA 5', routineKey: 'A', type: 'Treino', title: 'Treino A · Push (Densidade Peitoral & Ombros)' },
      { dayNum: 6, dayKey: 'd6', dayName: 'DIA 6', routineKey: 'Cardio', type: 'Cardio', title: 'Protocolo "HYROX Station Builder (SkiErg + RowErg + Wall Balls)"' },
      { dayNum: 7, dayKey: 'd7', dayName: 'DIA 7', routineKey: 'OFF', type: 'Off', title: 'Descanso Total (Regeneração Muscular & Repouso)' }
    ];

    sandbox.WEEKLY_SCHEDULE_DATA = scheduleFromPdf;

    // Teste de resolução do DIA 3 (HYROX Power Engine)
    const day3Proto = sandbox.resolveCardioProtocolForDay(scheduleFromPdf[2]);
    assert.ok(day3Proto, 'Dia 3 deve resolver protocolo de cardio');
    assert.equal(day3Proto.id, 'hyrox_power_engine_45', 'Dia 3 deve resolver para hyrox_power_engine_45');
    assert.equal(day3Proto.blocks.length, 4, 'hyrox_power_engine_45 deve conter 4 blocos');
    assert.ok(day3Proto.blocks[0].name.includes('SkiErg'), 'Bloco 1 do Dia 3 deve conter SkiErg');
    assert.ok(day3Proto.blocks[1].name.includes('Sled Push'), 'Bloco 2 do Dia 3 deve conter Sled Push');
    assert.ok(day3Proto.blocks[2].name.includes('RowErg'), 'Bloco 3 do Dia 3 deve conter RowErg');
    assert.ok(day3Proto.blocks[3].name.includes('Wall Balls'), 'Bloco 4 do Dia 3 deve conter Wall Balls');

    // Teste de resolução do DIA 6 (HYROX Station Builder)
    const day6Proto = sandbox.resolveCardioProtocolForDay(scheduleFromPdf[5]);
    assert.ok(day6Proto, 'Dia 6 deve resolver protocolo de cardio');
    assert.equal(day6Proto.id, 'hyrox_station_erg_intervals_30', 'Dia 6 deve resolver para hyrox_station_erg_intervals_30');
    assert.equal(day6Proto.blocks.length, 3, 'hyrox_station_erg_intervals_30 deve conter 3 blocos');
    assert.ok(day6Proto.blocks[0].name.includes('Tri-Estação'), 'Bloco 1 do Dia 6 deve conter Tri-Estação');
    assert.ok(day6Proto.blocks[1].name.includes('Principal HYROX'), 'Bloco 2 do Dia 6 deve ser Bloco Principal');
  });

  await t.test('3. Paridade no Pro: perfBuildCanonicalWorkoutDatabase e perfFocusDay', () => {
    assert.ok(appJs.includes('Cardio_d${idx + 1}'), 'app.js deve gerar rotinas de cardio por dia Cardio_d3, Cardio_d6');
    assert.ok(appJs.includes('perfFocusDay'), 'app.js deve conter perfFocusDay');
    assert.ok(appJs.includes('D${idx + 1} ${badge}'), 'app.js deve conter atalhos visuais por dia D1..D7');
  });
});
