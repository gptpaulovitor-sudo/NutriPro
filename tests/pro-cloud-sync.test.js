// =========================================================================
// NutriAx Pro — Testes de Sincronização Multi-Dispositivo (PC <-> Celular)
// =========================================================================

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

describe('NutriAx Pro — Sincronização em Nuvem Multi-Dispositivo', () => {
  const rootDir = path.resolve(__dirname, '..');
  const appJsPath = path.join(rootDir, 'app.js');
  const firebaseServicePath = path.join(rootDir, 'firebase-service.js');
  const proHtmlPath = path.join(rootDir, 'pro', 'index.html');

  test('1. pro/index.html inclui firebase-service e app.js com cache-buster atualizado', () => {
    const html = fs.readFileSync(proHtmlPath, 'utf8');
    assert.ok(html.includes('firebase-service.js'), 'pro/index.html deve incluir firebase-service.js');
    assert.ok(html.includes('app.js?v=20260921_pro_cloud_sync_v2'), 'app.js deve ter cache buster atualizado');
  });

  test('2. firebase-service.js sincroniza e carrega rawPrescription juntamente com prescription DTO', () => {
    const fbCode = fs.readFileSync(firebaseServicePath, 'utf8');
    assert.ok(fbCode.includes('docData.rawPrescription'), 'firebase-service deve salvar rawPrescription');
    assert.ok(fbCode.includes('res.rawPrescription = data.rawPrescription'), 'firebase-service deve retornar rawPrescription');
  });

  test('3. app.js invoca NutriProFirebase.prescription.syncToCloud ao salvar prescrição no firewall', () => {
    const appJs = fs.readFileSync(appJsPath, 'utf8');
    assert.ok(appJs.includes('window.NutriProFirebase.prescription.syncToCloud(pId,'), 'savePrescriptionWithFirewall deve sincronizar com nuvem');
  });

  test('4. _shouldAcceptCloudPrescriptionInPro aceita nuvem mais recente e rejeita nuvem desatualizada', () => {
    const appJs = fs.readFileSync(appJsPath, 'utf8');
    const fnMatch = appJs.match(/function _shouldAcceptCloudPrescriptionInPro\(cloudDoc, localSaved\) \{[\s\S]*?\n\}/);
    assert.ok(fnMatch, '_shouldAcceptCloudPrescriptionInPro deve estar definida no app.js');

    const fn = new Function('computePrescriptionContentFingerprint', `return ${fnMatch[0]}`)(() => 'fp_dummy');

    // Cenário A: nuvem mais recente que local
    const cloudNewer = {
      rawPrescription: {
        items: [{ id: '1', foodName: 'Ovo' }],
        updatedAt: '2026-09-21T18:00:00.000Z'
      }
    };
    const localOlder = {
      items: [{ id: '1', foodName: 'Frango' }],
      updatedAt: '2026-09-21T12:00:00.000Z'
    };
    assert.strictEqual(fn(cloudNewer, localOlder), true, 'Deve aceitar nuvem mais recente');

    // Cenário B: local mais recente que nuvem
    const cloudOlder = {
      rawPrescription: {
        items: [{ id: '1', foodName: 'Ovo' }],
        updatedAt: '2026-09-21T10:00:00.000Z'
      }
    };
    assert.strictEqual(fn(cloudOlder, localOlder), false, 'Deve rejeitar nuvem mais antiga que o estado local');

    // Cenário C: local vazio
    assert.strictEqual(fn(cloudNewer, null), true, 'Deve aceitar nuvem se local for nulo');
    assert.strictEqual(fn(cloudNewer, { items: [] }), true, 'Deve aceitar nuvem se local não tiver itens');

    // Cenário D: nuvem sem itens
    assert.strictEqual(fn({ updatedAt: '2026-09-21T19:00:00.000Z' }, localOlder), false, 'Deve rejeitar nuvem sem itens');
  });

  test('5. _resolveSavedPrescription e loadPrescriptionForPatient incluem suporte à nuvem e listener em tempo real', () => {
    const appJs = fs.readFileSync(appJsPath, 'utf8');
    assert.ok(appJs.includes('_shouldAcceptCloudPrescriptionInPro(cloudDoc, saved)'), '_resolveSavedPrescription deve consultar nuvem');
    assert.ok(appJs.includes('_setupPrescriptionRealtimeListener(targetId)'), 'loadPrescriptionForPatient deve configurar listener em tempo real');
  });
});
