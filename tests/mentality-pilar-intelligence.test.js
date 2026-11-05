/**
 * tests/mentality-pilar-intelligence.test.js
 * 
 * Validação da Inteligência Comportamental, Psicometria e Prevenção de Churn
 * no Pilar 1 (Mentalidade) do NutriAx Pro (app.js e pro/index.html).
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('Pilar 1: Mentalidade & Inteligência Comportamental (NutriAx Pro)', () => {
  const appJsPath = path.join(__dirname, '..', 'app.js');
  const proIndexPath = path.join(__dirname, '..', 'pro', 'index.html');

  const appJsContent = fs.readFileSync(appJsPath, 'utf8');
  const proIndexContent = fs.readFileSync(proIndexPath, 'utf8');

  test('MENT-01: PILAR_CONFIG[1] configurado com os 5 módulos de Inteligência Comportamental', () => {
    assert.match(appJsContent, /title:\s*'MENTALIDADE'/);
    assert.match(appJsContent, /name:\s*'Mentalidade & Inteligência Comportamental'/);
    assert.match(appJsContent, /defaultModule:\s*'radar'/);
    
    // Verifica presença dos módulos essenciais
    assert.match(appJsContent, /id:\s*'radar',\s*label:\s*'Radar Comportamental'/);
    assert.match(appJsContent, /id:\s*'vulnerabilities',\s*label:\s*'Mapa de Vulnerabilidades'/);
    assert.match(appJsContent, /id:\s*'resilience',\s*label:\s*'Resiliência & SOS'/);
    assert.match(appJsContent, /id:\s*'contract',\s*label:\s*'Pacto & Compromisso'/);
    assert.match(appJsContent, /id:\s*'nudges',\s*label:\s*'Nudges & WhatsApp'/);
  });

  test('MENT-02: selectContextualModule e updateMobileSubnavActiveVisuals integrados aos módulos do Pilar 1', () => {
    assert.match(appJsContent, /if\s*\(pilarId === 1\)\s*\{[\s\S]*?selectMentalitySubView\(moduleId\)/);
    assert.match(appJsContent, /const p1Tools = \['radar', 'vulnerabilities', 'resilience', 'contract', 'nudges', 'goals', 'mindset'\]/);
  });

  test('MENT-03: switchTab("mentality") dispara renderMentalityDashboard()', () => {
    assert.match(appJsContent, /tabName === 'mentality'[\s\S]*?renderMentalityDashboard\(\)/);
  });

  test('MENT-04: pro/index.html possui estrutura completa do Banner Hero e Termômetro de Churn', () => {
    assert.match(proIndexContent, /id="tab-mentality"/);
    assert.match(proIndexContent, /id="pilar1HeroBanner"/);
    assert.match(proIndexContent, /id="mentalityPatientName"/);
    assert.match(proIndexContent, /id="mentalityPatientGoal"/);
    assert.match(proIndexContent, /id="mentalityChurnBadge"/);
    assert.match(proIndexContent, /id="mentalityChurnDesc"/);
    assert.match(proIndexContent, /id="mentalityHeroIDC"/);
  });

  test('MENT-05: pro/index.html possui subnavegação rápida com todos os 5 módulos clínicos', () => {
    assert.match(proIndexContent, /id="pilar1-subnav-radar"/);
    assert.match(proIndexContent, /id="pilar1-subnav-vulnerabilities"/);
    assert.match(proIndexContent, /id="pilar1-subnav-resilience"/);
    assert.match(proIndexContent, /id="pilar1-subnav-contract"/);
    assert.match(proIndexContent, /id="pilar1-subnav-nudges"/);
  });

  test('MENT-06: pro/index.html possui as 5 seções de módulos com os IDs corretos', () => {
    assert.match(proIndexContent, /id="mentalityRadarSection"/);
    assert.match(proIndexContent, /id="mentalityVulnerabilitiesSection"/);
    assert.match(proIndexContent, /id="mentalityResilienceSection"/);
    assert.match(proIndexContent, /id="mentalityContractSection"/);
    assert.match(proIndexContent, /id="mentalityNudgesSection"/);
  });

  test('MENT-07: Seção Radar possui seletores de período (7d, 30d, 90d) e container do gráfico dinâmico', () => {
    assert.match(proIndexContent, /id="mentalityPeriodBtn7"[^>]*onclick="setMentalityPeriod\(7\)"/);
    assert.match(proIndexContent, /id="mentalityPeriodBtn30"[^>]*onclick="setMentalityPeriod\(30\)"/);
    assert.match(proIndexContent, /id="mentalityPeriodBtn90"[^>]*onclick="setMentalityPeriod\(90\)"/);
    assert.match(proIndexContent, /id="mentalityEvolutionSvg"/);
    assert.match(proIndexContent, /id="mentalityAvgIDC"/);
    assert.match(proIndexContent, /id="mentalityActiveDays"/);
    assert.match(proIndexContent, /id="mentalityStreakVal"/);
  });

  test('MENT-08: Seções de Resiliência, Vulnerabilidades, Contrato e Nudges possuem elementos dinâmicos e WhatsApp', () => {
    assert.match(proIndexContent, /id="mentalityWorstDayLabel"/);
    assert.match(proIndexContent, /id="mentalityBestDayLabel"/);
    assert.match(proIndexContent, /id="mentalityResilienceRate"/);
    assert.match(proIndexContent, /id="mentalityDominoControl"/);
    assert.match(proIndexContent, /id="mentalityNudge1Text"/);
    assert.match(proIndexContent, /id="mentalityNudge2Text"/);
    assert.match(proIndexContent, /id="mentalityNudge3Text"/);
    assert.match(proIndexContent, /onclick="sendMentalityNudgeWhatsApp\(/);
    assert.match(proIndexContent, /onclick="copyMentalityNudge\(/);
  });

  test('MENT-09: Funções de lógica comportamental em app.js executam e calculam métricas corretamente', async () => {
    // Cria ambiente sandbox simulado
    const elements = {};
    function mockElement(id) {
      if (!elements[id]) {
        elements[id] = {
          id,
          innerText: '',
          textContent: '',
          innerHTML: '',
          value: '',
          className: '',
          style: {},
          classList: {
            classes: new Set(),
            add: function(...args) { args.forEach(c => this.classes.add(c)); },
            remove: function(...args) { args.forEach(c => this.classes.delete(c)); },
            contains: function(c) { return this.classes.has(c); }
          },
          scrollIntoView: () => {},
          addEventListener: () => {}
        };
      }
      return elements[id];
    }

    const domContext = {
      window: {
        location: { href: 'http://localhost/pro/' },
        open: (url) => { domContext.lastOpenedUrl = url; },
        navigator: {
          clipboard: {
            writeText: async (text) => { domContext.lastCopiedText = text; }
          }
        }
      },
      document: {
        getElementById: (id) => mockElement(id),
        querySelectorAll: () => [],
        addEventListener: () => {}
      },
      localStorage: {
        _store: {},
        getItem: function(k) { return this._store[k] || null; },
        setItem: function(k, v) { this._store[k] = String(v); }
      },
      lucide: { createIcons: () => {} },
      showToast: () => {},
      currentActivePilar: 1,
      patientState: {
        currentPatientId: 'paciente_paulo',
        name: 'Paulo Vitor Ribeiro',
        objective: 'Definição e Consistência'
      },
      activePatientId: 'paciente_paulo',
      console: console
    };
    domContext.global = domContext;
    domContext.globalThis = domContext;
    domContext.window.globalThis = domContext;

    // Extrai o bloco de funções de mentalidade de app.js
    const mentalityCodeMatch = appJsContent.match(/\/\/ PILAR 1 — MENTALIDADE & INTELIGÊNCIA COMPORTAMENTAL[\s\S]*$/);
    assert.ok(mentalityCodeMatch, 'Bloco de funções de mentalidade deve estar presente em app.js');

    const script = new vm.Script(mentalityCodeMatch[0]);
    vm.createContext(domContext);
    script.runInContext(domContext);

    assert.equal(typeof domContext.renderMentalityDashboard, 'function');
    assert.equal(typeof domContext.selectMentalitySubView, 'function');
    assert.equal(typeof domContext.setMentalityPeriod, 'function');
    assert.equal(typeof domContext.sendMentalityNudgeWhatsApp, 'function');

    // Executa renderMentalityDashboard com dados simulados
    domContext.localStorage.setItem('nutriax_patient_discipline_v3_paciente_paulo', JSON.stringify({
      history: [
        { date: '2026-11-01', compliance: 85, dimensions: { meals: 90, workout: 80, water: 90, habits: 80 } },
        { date: '2026-11-02', compliance: 90, dimensions: { meals: 95, workout: 85, water: 95, habits: 85 } },
        { date: '2026-11-03', compliance: 50, dimensions: { meals: 60, workout: 0, water: 70, habits: 70 } },
        { date: '2026-11-04', compliance: 88, dimensions: { meals: 90, workout: 90, water: 85, habits: 85 } }
      ]
    }));

    await domContext.renderMentalityDashboard();

    // Valida que o nome do paciente foi inserido
    assert.equal(mockElement('mentalityPatientName').textContent, 'Paulo Vitor Ribeiro');

    // Valida mensagens dos nudges gerados com o primeiro nome do paciente
    assert.match(mockElement('mentalityNudge1Text').value, /Paulo/);
    assert.match(mockElement('mentalityNudge2Text').value, /Paulo/);

    // Valida envio via WhatsApp
    mockElement('mentalityNudge1Text').value = 'Olá Paulo Vitor Ribeiro! Parabéns!';
    domContext.sendMentalityNudgeWhatsApp('mentalityNudge1Text');
    assert.match(domContext.lastOpenedUrl, /api\.whatsapp\.com\/send\?text=Ol%C3%A1%20Paulo%20Vitor/);
  });
});
