/**
 * tests/patient-progress-nudges-and-sos.test.js
 * 
 * Validação do Motor de Nudges Clínicos na Aba Progresso do Disciplina
 * e da Telemetria Real de SOS e Resiliência (Disciplina e Pro).
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('Motor de Nudges Clínicos (Progresso) & Telemetria Dinâmica de SOS', () => {
  const discHtmlPath = path.join(__dirname, '..', 'disciplina', 'index.html');
  const appJsPath = path.join(__dirname, '..', 'app.js');

  const discHtml = fs.readFileSync(discHtmlPath, 'utf8');
  const appJs = fs.readFileSync(appJsPath, 'utf8');

  test('NUDGE-01: HTML da Aba Progresso possui Card do Motor de Nudges Clínicos Dinâmico', () => {
    assert.match(discHtml, /id="progressoNudgesCard"/);
    assert.match(discHtml, /id="nudgeStatusBadge"/);
    assert.match(discHtml, /id="nudgeIconBox"/);
    assert.match(discHtml, /id="nudgeEmoji"/);
    assert.match(discHtml, /id="nudgeTitle"/);
    assert.match(discHtml, /id="nudgeMessage"/);
  });

  test('NUDGE-02: Card possui ações de Engajamento Direto (Compartilhar no WhatsApp e Acionar SOS)', () => {
    assert.match(discHtml, /onclick="shareProgressToWhatsApp\(\)"/);
    assert.match(discHtml, /onclick="openSosModal\(\)"/);
  });

  test('NUDGE-03: Modal SOS possui botão explícito para registrar deslize sem culpa', () => {
    assert.match(discHtml, /onclick="registerSosSlip\(\)"/);
    assert.match(discHtml, /Registrar Refeição Livre \/ Deslize Sem Culpa/);
  });

  test('NUDGE-04: Funções estão expostas globalmente no Disciplina', () => {
    assert.match(discHtml, /window\.renderClinicalNudgesProgresso\s*=\s*renderClinicalNudgesProgresso/);
    assert.match(discHtml, /window\.shareProgressToWhatsApp\s*=\s*shareProgressToWhatsApp/);
    assert.match(discHtml, /window\.registerSosSlip\s*=\s*registerSosSlip/);
  });

  test('NUDGE-05: renderClinicalNudgesProgresso altera conteúdo dinamicamente com base no IDC e SOS', () => {
    const elements = {};
    function mockElement(id) {
      if (!elements[id]) {
        elements[id] = {
          id,
          innerText: '',
          textContent: '',
          className: '',
          classList: {
            classes: new Set(),
            add: function(...args) { args.forEach(c => this.classes.add(c)); },
            remove: function(...args) { args.forEach(c => this.classes.delete(c)); },
            contains: function(c) { return this.classes.has(c); }
          }
        };
      }
      return elements[id];
    }

    const domContext = {
      window: {
        location: { href: 'http://localhost/disciplina/' },
        open: (url) => { domContext.lastOpenedUrl = url; }
      },
      document: {
        getElementById: (id) => mockElement(id)
      },
      getLocalDateIso: () => '2026-11-05',
      calculateDailyIDCValue: () => 85,
      currentScoresPeriod: 7,
      patientState: {
        name: 'Paulo Vitor',
        scoreIDC: 85,
        history: {}
      },
      lucide: { createIcons: () => {} },
      logPatientActivity: () => {},
      saveState: () => { domContext.stateSaved = true; },
      closeSosModal: () => { domContext.sosClosed = true; },
      showToast: (msg) => { domContext.lastToast = msg; },
      console: console
    };
    domContext.global = domContext;
    domContext.globalThis = domContext;

    // Extrai o bloco de funções
    const match = discHtml.match(/function registerSosSlip\(\)[\s\S]*?window\.renderClinicalNudgesProgresso = renderClinicalNudgesProgresso;/);
    assert.ok(match, 'Bloco de funções deve existir no script');

    const script = new vm.Script(match[0]);
    vm.createContext(domContext);
    script.runInContext(domContext);

    // Cenário 1: IDC Alto (>= 80%)
    mockElement('globalScoreCenterVal').textContent = '92%';
    domContext.renderClinicalNudgesProgresso();
    assert.equal(mockElement('nudgeEmoji').textContent, '🚀');
    assert.match(mockElement('nudgeStatusBadge').textContent, /Alta Adesão/);
    assert.match(mockElement('nudgeTitle').textContent, /Rotina Blindada/);
    assert.match(mockElement('nudgeMessage').textContent, /92%/);

    // Cenário 2: IDC Médio (60 a 79%)
    mockElement('globalScoreCenterVal').textContent = '72%';
    domContext.renderClinicalNudgesProgresso();
    assert.equal(mockElement('nudgeEmoji').textContent, '⚡');
    assert.match(mockElement('nudgeStatusBadge').textContent, /Fase de Ajuste/);
    assert.match(mockElement('nudgeTitle').textContent, /Ponto de Calibração/);
    assert.match(mockElement('nudgeMessage').textContent, /72%/);

    // Cenário 3: IDC Baixo (< 60%)
    mockElement('globalScoreCenterVal').textContent = '45%';
    domContext.renderClinicalNudgesProgresso();
    assert.equal(mockElement('nudgeEmoji').textContent, '🎯');
    assert.match(mockElement('nudgeStatusBadge').textContent, /Foco em Retomada/);
    assert.match(mockElement('nudgeTitle').textContent, /Retomada Imediata/);

    // Cenário 4: SOS Acionado hoje
    domContext.registerSosSlip();
    assert.equal(domContext.patientState.sosTriggered, true);
    assert.equal(domContext.patientState.history['2026-11-05'].sosTriggered, true);
    assert.equal(domContext.stateSaved, true);
    assert.equal(domContext.sosClosed, true);

    domContext.renderClinicalNudgesProgresso();
    assert.equal(mockElement('nudgeEmoji').textContent, '🛡️');
    assert.match(mockElement('nudgeStatusBadge').textContent, /SOS Ativo/);
    assert.match(mockElement('nudgeTitle').textContent, /Protocolo de Contenção/);

    // Cenário 5: Compartilhamento WhatsApp do paciente
    mockElement('globalScoreCenterVal').textContent = '88%';
    mockElement('heroProgStreakVal').textContent = '12';
    domContext.shareProgressToWhatsApp();
    assert.match(domContext.lastOpenedUrl, /api\.whatsapp\.com\/send\?text=/);
    assert.match(decodeURIComponent(domContext.lastOpenedUrl), /Score IDC Médio: 88%/);
    assert.match(decodeURIComponent(domContext.lastOpenedUrl), /Streak Atual: 12 dias/);
  });

  test('NUDGE-06: app.js calcula Resiliência e Efeito Dominó dinamicamente do histórico', async () => {
    const elements = {};
    function mockElement(id) {
      if (!elements[id]) {
        elements[id] = {
          id,
          innerText: '',
          textContent: '',
          className: '',
          classList: {
            classes: new Set(),
            add: function(...args) { args.forEach(c => this.classes.add(c)); },
            remove: function(...args) { args.forEach(c => this.classes.delete(c)); },
            contains: function(c) { return this.classes.has(c); }
          },
          scrollIntoView: () => {}
        };
      }
      return elements[id];
    }

    const domContext = {
      window: { location: { href: 'http://localhost/pro/' } },
      document: {
        getElementById: (id) => mockElement(id),
        querySelectorAll: () => []
      },
      localStorage: {
        _store: {},
        getItem: function(k) { return this._store[k] || null; },
        setItem: function(k, v) { this._store[k] = String(v); }
      },
      lucide: { createIcons: () => {} },
      activePatientId: 'paciente_paulo',
      console: console
    };
    domContext.global = domContext;
    domContext.globalThis = domContext;

    const mentalityCodeMatch = appJs.match(/\/\/ PILAR 1 — MENTALIDADE & INTELIGÊNCIA COMPORTAMENTAL[\s\S]*$/);
    assert.ok(mentalityCodeMatch);

    const script = new vm.Script(mentalityCodeMatch[0]);
    vm.createContext(domContext);
    script.runInContext(domContext);

    // Simula histórico com 1 deslize (dia 02) seguido de retomada imediata (dia 03 com 85%)
    domContext.localStorage.setItem('nutriax_patient_discipline_v3_paciente_paulo', JSON.stringify({
      history: {
        '2026-11-01': { date: '2026-11-01', scoreIDC: 90 },
        '2026-11-02': { date: '2026-11-02', scoreIDC: 30, sosTriggered: true }, // Deslize
        '2026-11-03': { date: '2026-11-03', scoreIDC: 85 }, // Retomada em <24h
        '2026-11-04': { date: '2026-11-04', scoreIDC: 92 }
      }
    }));

    await domContext.renderMentalityDashboard();

    // 1 deslize e 1 retomada = 100% de resiliência em <24h
    assert.equal(mockElement('mentalityResilienceRate').textContent, '100%');
    assert.match(mockElement('mentalityDominoControl').textContent, /Excelente \(0 quebras consecutivas > 1 dia\)/);
  });
});

