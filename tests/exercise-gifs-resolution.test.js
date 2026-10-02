const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

test('Resolução e Integridade dos GIFs de Demonstração dos Exercícios', async (t) => {
  const appJs = fs.readFileSync('app.js', 'utf8');
  const discHtml = fs.readFileSync('disciplina/index.html', 'utf8');

  await t.test('1. app.js e disciplina/index.html não atribuem URLs 404 conhecidas como GIF de exercício', () => {
    const brokenUrls = [
      'shoulders/dumbbell-seated-shoulder-press.gif',
      'glutes/dumbbell-lunges.gif',
      'glutes/dumbbell-sumo-squat.gif',
      'glutes/bodyweight-single-leg-hip-thrust.gif'
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

  await t.test('2. GROUP_DEFAULT_GIFS está definido em app.js e disciplina/index.html com endpoints 200 OK', () => {
    assert.strictEqual(appJs.includes("const GROUP_DEFAULT_GIFS ="), true);
    assert.strictEqual(discHtml.includes("const GROUP_DEFAULT_GIFS ="), true);
    assert.strictEqual(discHtml.includes("delts/dumbbell-seated-shoulder-press.gif"), true);
    assert.strictEqual(discHtml.includes("cardio/walking-on-incline-treadmill.gif"), true);
    assert.strictEqual(appJs.includes("delts/dumbbell-seated-shoulder-press.gif"), true);
  });

  await t.test('3. resolveExerciseGif resolve nomes de exercícios populares e grupos sem deixar gif vazio', () => {
    assert.strictEqual(discHtml.includes("function resolveExerciseGif("), true);

    // Extrai o corpo da função do HTML para testar em isolamento
    const fnMatch = discHtml.match(/function resolveExerciseGif\([\s\S]*?\n    \}/);
    assert.ok(fnMatch, 'resolveExerciseGif deve ser encontrada no código');

    const evalFn = new Function('GROUP_DEFAULT_GIFS', `${fnMatch[0]}; return resolveExerciseGif;`);
    const groupGifs = {
      'Peitoral': 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif',
      'Dorsal': 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-bar-lateral-pulldown.gif',
      'Pernas': 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-full-squat-back-pov.gif',
      'Ombros': 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-seated-shoulder-press.gif',
      'Bíceps': 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-curl.gif',
      'Tríceps': 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-pushdown.gif'
    };
    const resolver = evalFn(groupGifs);

    const testCases = [
      { ex: { name: 'Supino Reto com Barra', group: 'Peitoral' }, mustInclude: 'barbell-bench-press.gif' },
      { ex: { name: 'Puxada Frontal Aberta', group: 'Dorsal' }, mustInclude: 'cable-bar-lateral-pulldown.gif' },
      { ex: { name: 'Elevação Lateral com Halteres', group: 'Ombros' }, mustInclude: 'dumbbell-lateral-raise.gif' },
      { ex: { name: 'Agachamento Livre', group: 'Pernas' }, mustInclude: 'barbell-full-squat-back-pov.gif' },
      { ex: { name: 'Rosca Martelo na Polia', group: 'Bíceps' }, mustInclude: 'biceps' },
      { ex: { name: 'Tríceps Corda', group: 'Tríceps' }, mustInclude: 'triceps' },
      { ex: { name: 'Exercício Desconhecido', group: 'Peitoral' }, mustInclude: 'barbell-bench-press.gif' }
    ];

    testCases.forEach(({ ex, mustInclude }) => {
      const res = resolver(ex);
      assert.ok(res && res.startsWith('http'), `GIF deve ser uma URL válida para ${ex.name}`);
      assert.ok(res.includes(mustInclude), `GIF ${res} deve conter ${mustInclude} para ${ex.name}`);
    });
  });

  await t.test('4. applyPrescriptionPayload e openExerciseGuideModal garantem resolução de GIF', () => {
    assert.strictEqual(discHtml.includes("gif: resolveExerciseGif(ex)"), true);
    assert.strictEqual(discHtml.includes("const resolvedGif = resolveExerciseGif(foundEx);"), true);
  });
});
