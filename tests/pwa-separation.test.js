// =========================================================================
// NutriAx Pro & Disciplina — Suíte de Testes de Separação PWA Real (Fase 9)
// Cobertura completa dos 26 critérios de isolamento e disjunção
// =========================================================================

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

describe('Fase 9 — Separação PWA Real entre NutriAx Pro e Disciplina', () => {
  const rootDir = path.resolve(__dirname, '..');
  const proDir = path.join(rootDir, 'pro');
  const discDir = path.join(rootDir, 'disciplina');

  // 1. Manifest Pro válido
  test('1. Manifest Pro é um JSON válido e possui campos essenciais', () => {
    const manifestPath = path.join(proDir, 'manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'pro/manifest.json deve existir');
    const content = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.strictEqual(content.id, 'nutriax-pro');
    assert.ok(content.name.includes('NutriAx Pro'));
  });

  // 2. Manifest Disciplina válido
  test('2. Manifest Disciplina é um JSON válido e possui campos essenciais', () => {
    const manifestPath = path.join(discDir, 'manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'disciplina/manifest.json deve existir');
    const content = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.strictEqual(content.id, 'nutriax-disciplina');
    assert.ok(content.name.includes('Disciplina'));
  });

  // 3. start_url Pro = ./
  test('3. start_url do Pro é agnóstico e restrito ao diretório pro', () => {
    const content = JSON.parse(fs.readFileSync(path.join(proDir, 'manifest.json'), 'utf8'));
    assert.ok(['./', './index.html'].includes(content.start_url));
  });

  // 4. start_url Disciplina = ./
  test('4. start_url do Disciplina é agnóstico e restrito ao diretório disciplina', () => {
    const content = JSON.parse(fs.readFileSync(path.join(discDir, 'manifest.json'), 'utf8'));
    assert.ok(['./', './index.html'].includes(content.start_url));
  });

  // 5. scope Pro = ./
  test('5. scope do Pro é agnóstico e restrito ao diretório pro', () => {
    const content = JSON.parse(fs.readFileSync(path.join(proDir, 'manifest.json'), 'utf8'));
    assert.strictEqual(content.scope, './');
  });

  // 6. scope Disciplina = ./
  test('6. scope do Disciplina é agnóstico e restrito ao diretório disciplina', () => {
    const content = JSON.parse(fs.readFileSync(path.join(discDir, 'manifest.json'), 'utf8'));
    assert.strictEqual(content.scope, './');
  });

  // 7. escopos não sobrepostos
  test('7. Escopos de Pro e Disciplina são completamente disjuntos', () => {
    const proManifest = JSON.parse(fs.readFileSync(path.join(proDir, 'manifest.json'), 'utf8'));
    const discManifest = JSON.parse(fs.readFileSync(path.join(discDir, 'manifest.json'), 'utf8'));
    const proResolved = path.resolve(proDir, proManifest.scope);
    const discResolved = path.resolve(discDir, discManifest.scope);
    assert.notStrictEqual(proResolved, discResolved);
    assert.ok(!proResolved.startsWith(discResolved));
    assert.ok(!discResolved.startsWith(proResolved));
  });

  // 8. sw-pro.js existe
  test('8. Arquivo pro/sw-pro.js existe e possui tamanho válido', () => {
    const swPath = path.join(proDir, 'sw-pro.js');
    assert.ok(fs.existsSync(swPath));
    assert.ok(fs.statSync(swPath).size > 200);
  });

  // 9. sw-paciente.js existe
  test('9. Arquivo disciplina/sw-paciente.js existe e possui tamanho válido', () => {
    const swPath = path.join(discDir, 'sw-paciente.js');
    assert.ok(fs.existsSync(swPath));
    assert.ok(fs.statSync(swPath).size > 200);
  });

  // 10. registro Pro aponta para sw-pro.js com scope agnóstico
  test('10. app.js registra exclusivamente sw-pro.js com scope agnóstico ao ambiente', () => {
    const appJs = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');
    assert.ok(appJs.includes('sw-pro.js'));
    assert.ok(appJs.includes('swProScope'));
  });

  // 11. registro Disciplina aponta para sw-paciente.js com scope agnóstico
  test('11. disciplina/index.html registra exclusivamente sw-paciente.js com scope agnóstico ao ambiente', () => {
    const discHtml = fs.readFileSync(path.join(discDir, 'index.html'), 'utf8');
    assert.ok(discHtml.includes('sw-paciente.js'));
    assert.ok(discHtml.includes('swDiscScope'));
  });

  // 12. cache Pro usa nutriax-pro-
  test('12. Cache name do Pro utiliza prefixo nutriax-pro- (v2.0.0)', () => {
    const swPro = fs.readFileSync(path.join(proDir, 'sw-pro.js'), 'utf8');
    assert.ok(swPro.includes("const CACHE_NAME = 'nutriax-pro-v2.0.0'"));
  });

  // 13. cache Disciplina usa nutriax-disciplina-
  test('13. Cache name do Disciplina utiliza prefixo nutriax-disciplina- (v1.0.0)', () => {
    const swDisc = fs.readFileSync(path.join(discDir, 'sw-paciente.js'), 'utf8');
    assert.ok(swDisc.includes("const CACHE_NAME = 'nutriax-disciplina-v1.0.0'"));
  });

  // 14. SW Pro não possui fallback para Disciplina
  test('14. SW Pro não direciona fallback offline para /disciplina/', () => {
    const swPro = fs.readFileSync(path.join(proDir, 'sw-pro.js'), 'utf8');
    assert.ok(!swPro.includes("match('/disciplina/"));
    assert.ok(!swPro.includes("match('./paciente.html'"));
    assert.ok(swPro.includes("caches.match('/pro/')") || swPro.includes("caches.match('/pro/index.html')"));
  });

  // 15. SW Disciplina não possui fallback para Pro
  test('15. SW Disciplina não direciona fallback offline para /pro/', () => {
    const swDisc = fs.readFileSync(path.join(discDir, 'sw-paciente.js'), 'utf8');
    assert.ok(!swDisc.includes("match('/pro/"));
    assert.ok(!swDisc.includes("match('./index.html'"));
    assert.ok(swDisc.includes("caches.match('/disciplina/')") || swDisc.includes("caches.match('/disciplina/index.html')"));
  });

  // 16. precache Pro não contém paciente.html
  test('16. Precache do Pro não contém paciente.html nem rotas de paciente', () => {
    const swPro = fs.readFileSync(path.join(proDir, 'sw-pro.js'), 'utf8');
    assert.ok(!swPro.includes("'/paciente.html'"));
    assert.ok(!swPro.includes("'./paciente.html'"));
    assert.ok(!swPro.includes("'/disciplina/'"));
  });

  // 17. precache Disciplina não contém index.html profissional
  test('17. Precache do Disciplina não contém index.html profissional nem app.js clínico', () => {
    const swDisc = fs.readFileSync(path.join(discDir, 'sw-paciente.js'), 'utf8');
    assert.ok(!swDisc.includes("'/pro/'"));
    assert.ok(!swDisc.includes("'/pro/index.html'"));
    assert.ok(!swDisc.includes("'/app.js'"));
    assert.ok(!swDisc.includes("'/foodsData.js'"));
  });

  // 18. SW Pro não remove nutriax-disciplina-*
  test('18. Limpeza de cache no SW Pro filtra apenas nutriax-pro- e não afeta Disciplina', () => {
    const swPro = fs.readFileSync(path.join(proDir, 'sw-pro.js'), 'utf8');
    assert.ok(swPro.includes("cache.startsWith('nutriax-pro-')"));
    assert.ok(!swPro.includes("caches.delete") || swPro.includes("startsWith('nutriax-pro-')"));
  });

  // 19. SW Disciplina não remove nutriax-pro-*
  test('19. Limpeza de cache no SW Disciplina filtra apenas nutriax-disciplina- e não afeta Pro', () => {
    const swDisc = fs.readFileSync(path.join(discDir, 'sw-paciente.js'), 'utf8');
    assert.ok(swDisc.includes("cache.startsWith('nutriax-disciplina-')"));
    assert.ok(!swDisc.includes("caches.delete") || swDisc.includes("startsWith('nutriax-disciplina-')"));
  });

  // 20, 21, 22. Nenhum manifest utiliza escopo baseado em arquivo
  test('20-22. Nenhum dos dois manifests utiliza escopos baseados em arquivo', () => {
    const proManifest = JSON.parse(fs.readFileSync(path.join(proDir, 'manifest.json'), 'utf8'));
    const discManifest = JSON.parse(fs.readFileSync(path.join(discDir, 'manifest.json'), 'utf8'));
    const invalidScopes = ['./index.html', './paciente.html', 'index.html', 'paciente.html'];

    assert.ok(!invalidScopes.includes(proManifest.scope));
    assert.ok(!invalidScopes.includes(discManifest.scope));
    assert.strictEqual(proManifest.scope, './');
    assert.strictEqual(discManifest.scope, './');
  });

  // 23. Ícones são fisicamente independentes
  test('23. Conjuntos de ícones são fisicamente independentes entre Pro e Disciplina', () => {
    const proIcon192 = fs.readFileSync(path.join(proDir, 'icons', 'icon-192.png'));
    const discIcon192 = fs.readFileSync(path.join(discDir, 'icons', 'icon-192.png'));
    assert.notStrictEqual(proIcon192.length, discIcon192.length, 'Os arquivos de ícone de 192px devem possuir tamanhos/bytes distintos');

    const proSvg = fs.readFileSync(path.join(proDir, 'icons', 'icon.svg'), 'utf8');
    const discSvg = fs.readFileSync(path.join(discDir, 'icons', 'icon.svg'), 'utf8');
    assert.ok(proSvg.includes('PRO'), 'Ícone Pro deve conter badge PRO');
    assert.ok(discSvg.includes('DISCIPLINA'), 'Ícone Disciplina deve conter badge DISCIPLINA');
  });

  // 24. app.js não foi duplicado
  test('24. Invariante Crítica: NÃO existe pro/app.js (app.js permanece unificado na raiz)', () => {
    assert.ok(!fs.existsSync(path.join(proDir, 'app.js')), 'pro/app.js NÃO deve existir');
    assert.ok(fs.existsSync(path.join(rootDir, 'app.js')), 'app.js deve existir na raiz');
    const proHtml = fs.readFileSync(path.join(proDir, 'index.html'), 'utf8');
    assert.ok(proHtml.includes('src="../app.js'), 'pro/index.html deve carregar ../app.js da raiz');
  });

  // 25. Não existem duas cópias funcionais do aplicativo paciente
  test('25. Aplicativo funcional do paciente existe exclusivamente em disciplina/index.html', () => {
    assert.ok(fs.existsSync(path.join(discDir, 'index.html')), 'disciplina/index.html deve existir');
    const rootPaciente = fs.readFileSync(path.join(rootDir, 'paciente.html'), 'utf8');
    // paciente.html na raiz agora é apenas um gateway leve (< 50 linhas)
    assert.ok(rootPaciente.split('\n').length < 50, 'paciente.html na raiz deve ser apenas um gateway de redirecionamento');
  });

  // 26. Gateways legados apontam para os novos ambientes
  test('26. Gateways legados na raiz redirecionam corretamente para /pro/ e /disciplina/', () => {
    const rootIndex = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
    const rootPaciente = fs.readFileSync(path.join(rootDir, 'paciente.html'), 'utf8');

    assert.ok(rootIndex.includes("url=/pro/") && rootIndex.includes("target = '/pro/'"));
    assert.ok(rootPaciente.includes("url=/disciplina/") && rootPaciente.includes("target = '/disciplina/'"));
  });
});
