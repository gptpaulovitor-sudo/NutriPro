const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

test('Resolução e Integridade dos GIFs de Demonstração dos Exercícios', async (t) => {
  const appJs = fs.readFileSync('app.js', 'utf8');
  const discHtml = fs.readFileSync('disciplina/index.html', 'utf8');
  const gifsDb = JSON.parse(fs.readFileSync('scratch/exercise_gifs_db.json', 'utf8').replace(/^\uFEFF/, ''));
  const validFiles = new Set(gifsDb.map(g => g.file));

  await t.test('1. app.js e disciplina/index.html não atribuem URLs 404 conhecidas como GIF de exercício', () => {
    const brokenUrls = [
      'shoulders/dumbbell-seated-shoulder-press.gif',
      'glutes/dumbbell-lunges.gif',
      'glutes/dumbbell-sumo-squat.gif',
      'glutes/bodyweight-single-leg-hip-thrust.gif',
      'delts/dumbbell-shrug.gif',
      'triceps/cable-standing-one-arm-overhead-triceps-extension.gif',
      'cardio/stationary-bike-run.gif',
      'cardio/rowing-machine.gif'
    ];

    brokenUrls.forEach(urlSnippet => {
      const assignmentPattern = new RegExp(`gif:\\s*['"][^'"]*${urlSnippet}`);
      assert.strictEqual(
        assignmentPattern.test(appJs),
        false,
        `app.js ainda atribui URL inválida: ${urlSnippet}`
      );
      assert.strictEqual(
        assignmentPattern.test(discHtml),
        false,
        `disciplina/index.html ainda atribui URL inválida: ${urlSnippet}`
      );
    });
  });

  await t.test('2. GROUP_DEFAULT_GIFS e PERF_EXERCISE_GUIDE_MAP possuem suporte a Cardio, Funcional/HYROX, Mobilidade e Regeneração', () => {
    assert.strictEqual(appJs.includes("const GROUP_DEFAULT_GIFS ="), true);
    assert.strictEqual(discHtml.includes("const GROUP_DEFAULT_GIFS ="), true);
    assert.strictEqual(discHtml.includes("const CANONICAL_EXERCISE_GIFS ="), true);

    // Grupos essenciais para evitar fallback cego para supino
    const requiredGroups = [
      'Cardio & Ergômetros',
      'Funcional / HYROX',
      'Glúteo',
      'Panturrilha',
      'Mobilidade',
      'Regeneração'
    ];
    requiredGroups.forEach(group => {
      assert.strictEqual(appJs.includes(`'${group}':`), true, `app.js GROUP_DEFAULT_GIFS deve conter ${group}`);
      assert.strictEqual(discHtml.includes(`'${group}':`), true, `disciplina/index.html GROUP_DEFAULT_GIFS deve conter ${group}`);
    });

    // 18 Exercícios antes faltantes em PERF_EXERCISE_GUIDE_MAP
    const requiredExIds = [
      'hy01', 'hy02', 'hy03', 'hy04', 'hy05', 'cardio_esteira', 'cardio_airbike', 'cardio_rowerg', 'cardio_recuperativo_z1',
      'hy06', 'hy07', 'hy08', 'hy09', 'hy10', 'hy11', 'hy12', 'hy13', 'hy14'
    ];
    requiredExIds.forEach(id => {
      assert.strictEqual(appJs.includes(`${id}: {`), true, `app.js PERF_EXERCISE_GUIDE_MAP deve conter ${id}`);
    });
  });

  await t.test('3. Todas as URLs CDN nos arquivos são 100% válidas no banco de dados verificado', () => {
    const urlRegex = /https:\/\/cdn\.jsdelivr\.net\/gh\/JahelCuadrado\/ExerciseGymGifsDB@v1\.1\.0\/([^'"\s]+)/g;

    function getUrls(source) {
      let match;
      const set = new Set();
      while ((match = urlRegex.exec(source)) !== null) {
        set.add(match[1]);
      }
      return set;
    }

    const appUrls = getUrls(appJs);
    const discUrls = getUrls(discHtml);

    appUrls.forEach(file => {
      assert.strictEqual(validFiles.has(file), true, `app.js contém URL inválida: ${file}`);
    });
    discUrls.forEach(file => {
      assert.strictEqual(validFiles.has(file), true, `disciplina/index.html contém URL inválida: ${file}`);
    });
  });

  await t.test('4. resolveExerciseGif resolve rigorosamente nomes específicos antes de termos genéricos', () => {
    assert.strictEqual(discHtml.includes("function resolveExerciseGif("), true);

    const blockMatch = discHtml.match(/const CANONICAL_EXERCISE_GIFS = \{[\s\S]*?window\.GROUP_DEFAULT_GIFS = GROUP_DEFAULT_GIFS;/);
    assert.ok(blockMatch, 'Bloco de biomecânica deve ser encontrado no HTML');

    const evalFn = new Function('window', `${blockMatch[0]}; return resolveExerciseGif;`);
    const resolver = evalFn({});

    const precedenceCases = [
      // Precedência de Deltoide Posterior vs Crucifixo Peitoral
      { ex: { name: 'Crucifixo Invertido na Polia Alta', group: 'Ombros' }, mustInclude: 'delts/cable-rear-delt-row-with-rope.gif', mustNotInclude: 'dumbbell-fly' },
      // Precedência de Supino Fechado vs Supino Peitoral
      { ex: { name: 'Supino Fechado com Barra', group: 'Tríceps' }, mustInclude: 'triceps/barbell-close-grip-bench-press.gif', mustNotInclude: 'barbell-bench-press.gif' },
      // Precedência de Remada Alta (Ombro/Trapézio) vs Remada Curvada Dorsal
      { ex: { name: 'Remada Alta com Barra', group: 'Ombros' }, mustInclude: 'delts/barbell-upright-row-v-2.gif', mustNotInclude: 'bent-over-row' },
      // Precedência de Agachamento Búlgaro vs Agachamento Livre
      { ex: { name: 'Agachamento Búlgaro com Halteres', group: 'Pernas' }, mustInclude: 'quads/dumbbell-single-leg-split-squat.gif', mustNotInclude: 'full-squat' },
      // Precedência de Stiff vs Levantamento Terra Convencional
      { ex: { name: 'Stiff com Barra (Terra Romeno)', group: 'Pernas' }, mustInclude: 'glutes/barbell-romanian-deadlift.gif', mustNotInclude: 'glutes/barbell-deadlift.gif' },
      // Cardio & Ergômetros específicos
      { ex: { name: 'SkiErg Concept2 (Intervalos de Potência)', group: 'Cardio & Ergômetros' }, mustInclude: 'cardio/ski-step.gif' },
      { ex: { name: 'AirBike / Echo Bike', group: 'Cardio & Ergômetros' }, mustInclude: 'cardio/stationary-bike-run-v-3.gif' },
      { ex: { name: 'Remo Concept2 RowErg', group: 'Cardio & Ergômetros' }, mustInclude: 'upper-back/cable-seated-row.gif' },
      { ex: { name: 'Tiros de Velocidade na Esteira', group: 'Cardio & Ergômetros' }, mustInclude: 'cardio/run.gif' },
      // Funcional / HYROX
      { ex: { name: 'Burpee Broad Jumps', group: 'Funcional / HYROX' }, mustInclude: 'cardio/burpee.gif' },
      { ex: { name: 'Thrusters com Barra', group: 'Funcional / HYROX' }, mustInclude: 'delts/barbell-thruster.gif' },
      { ex: { name: 'Kettlebell Swing Americano', group: 'Funcional / HYROX' }, mustInclude: 'glutes/kettlebell-swing.gif' },
      { ex: { name: 'Box Jump na Caixa', group: 'Funcional / HYROX' }, mustInclude: 'calves/box-jump-down-with-one-leg-stabilization.gif' },
      { ex: { name: 'Wall Balls com Medicine Ball', group: 'Funcional / HYROX' }, mustInclude: 'upper-back/medicine-ball-overhead-slam.gif' },
      // OFF & Regeneração
      { ex: { name: 'Sono Anabólico Reparador', group: 'Regeneração' }, mustInclude: 'spine/spine-stretch.gif', mustNotInclude: 'plank' },
      { ex: { name: 'Mobilidade Articular e Liberação', group: 'Mobilidade' }, mustInclude: 'spine/roller-back-stretch.gif', mustNotInclude: 'deadlift' },
      { ex: { name: 'Hidratação Eletrolítica', group: 'Nutrição' }, mustInclude: 'spine/sphinx.gif', mustNotInclude: 'bench-press' },
      // Proteção contra fallback indevido vindo de payloads salvos
      { ex: { name: 'SkiErg Concept2', group: 'Cardio & Ergômetros', gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif' }, mustInclude: 'cardio/ski-step.gif' },
      // Resolução direta por ID canônico
      { ex: { id: 'sh07', name: 'Elevação Lateral na Polia Baixa' }, mustInclude: 'delts/cable-lateral-raise.gif' },
      { ex: { id: 'lg04', name: 'Leg Press 45°' }, mustInclude: 'glutes/sled-45-leg-press.gif' }
    ];

    precedenceCases.forEach(({ ex, mustInclude, mustNotInclude }) => {
      const res = resolver(ex);
      assert.ok(res && res.startsWith('http'), `GIF deve ser uma URL válida para ${ex.name}`);
      assert.ok(res.includes(mustInclude), `GIF ${res} deve conter ${mustInclude} para ${ex.name}`);
      if (mustNotInclude) {
        assert.strictEqual(res.includes(mustNotInclude), false, `GIF ${res} NÃO deve conter ${mustNotInclude} para ${ex.name}`);
      }
    });
  });

  await t.test('5. WORKOUT_DATABASE em disciplina/index.html atribui GIFs biomecanicamente condizentes', () => {
    assert.strictEqual(discHtml.includes("id: 'lg04', name: 'Leg Press 45°'"), true);
    assert.strictEqual(discHtml.includes("id: 'sh07', name: 'Elevação Lateral na Polia Baixa (Unilateral)'"), true);

    // lg04 não pode ser panturrilha ou unilateral
    const lg04Match = discHtml.match(/id:\s*'lg04'[\s\S]*?gif:\s*'([^']+)'/);
    assert.ok(lg04Match);
    assert.strictEqual(lg04Match[1], 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/sled-45-leg-press.gif');

    // sh07 deve ser cabo
    const sh07Match = discHtml.match(/id:\s*'sh07'[\s\S]*?gif:\s*'([^']+)'/);
    assert.ok(sh07Match);
    assert.strictEqual(sh07Match[1], 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-lateral-raise.gif');

    // Rotina OFF
    const recSleepMatch = discHtml.match(/id:\s*'rec_sleep'[\s\S]*?gif:\s*'([^']+)'/);
    assert.ok(recSleepMatch);
    assert.strictEqual(recSleepMatch[1], 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/spine/spine-stretch.gif');

    const recMobMatch = discHtml.match(/id:\s*'rec_mob'[\s\S]*?gif:\s*'([^']+)'/);
    assert.ok(recMobMatch);
    assert.strictEqual(recMobMatch[1], 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/spine/roller-back-stretch.gif');

    const recElecMatch = discHtml.match(/id:\s*'rec_elec'[\s\S]*?gif:\s*'([^']+)'/);
    assert.ok(recElecMatch);
    assert.strictEqual(recElecMatch[1], 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/spine/sphinx.gif');
  });

  await t.test('6. applyPrescriptionPayload e openExerciseGuideModal garantem resolução de GIF', () => {
    assert.strictEqual(discHtml.includes("gif: resolveExerciseGif(ex)"), true);
    assert.strictEqual(discHtml.includes("const resolvedGif = resolveExerciseGif(foundEx);"), true);
  });
});

