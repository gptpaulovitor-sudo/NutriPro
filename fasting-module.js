/**
 * =========================================================================
 * NutriAx Pro — Módulo de Jejum Intermitente (Fasting Module)
 * =========================================================================
 * 
 * Arquitetura:
 * - Firewall Clínico Determinístico (Camada de Domínio)
 * - Extração de Sinais de Risco com desambiguação e detecção de negação
 * - Modelo FastingProtocol com versionamento estrito e audit trail
 * - Guard de persistência (BLOCK e REVIEW_REQUIRED sem aprovação são rejeitados)
 * - Timer Engine dinâmico (sem contadores persistidos, suporta meia-noite e timezones)
 * - Persistência Dexie v9 (offline-first) + sincronização Firebase
 * - API compatível com Navegador e Node.js (CommonJS)
 */

(function (global) {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // 1. CONSTANTES E TAXONOMIA DO MÓDULO
  // ─────────────────────────────────────────────────────────────────────────

  const PROTOCOL_TYPES = Object.freeze({
    TRE: 'TRE',
    EXTENDED: 'EXTENDED',
    OMAD: 'OMAD',
    CUSTOM: 'CUSTOM'
  });

  const PROTOCOL_SUBTYPES = Object.freeze({
    '14:10': '14:10',
    '16:8': '16:8',
    '18:6': '18:6',
    '20:4': '20:4',
    'OMAD': 'OMAD',
    'CUSTOM': 'CUSTOM'
  });

  const PROTOCOL_OBJECTIVES = Object.freeze({
    // Composição Corporal
    FAT_LOSS: 'FAT_LOSS',
    BODY_COMPOSITION: 'BODY_COMPOSITION',
    CALORIC_CONTROL: 'CALORIC_CONTROL',
    LEAN_MASS_PRESERVATION: 'LEAN_MASS_PRESERVATION',
    // Metabólicos / Cardiovasculares
    GLUCOSE_CONTROL: 'GLUCOSE_CONTROL',
    INSULIN_SENSITIVITY: 'INSULIN_SENSITIVITY',
    CARDIOVASCULAR_HEALTH: 'CARDIOVASCULAR_HEALTH',
    LIPID_PROFILE: 'LIPID_PROFILE',
    // Educacionais / Subjetivos
    AUTOPHAGY: 'AUTOPHAGY',
    MENTAL_FOCUS: 'MENTAL_FOCUS'
  });

  const SEVERITY_LEVELS = Object.freeze({
    PASS: 'PASS',
    WARNING: 'WARNING',
    REVIEW_REQUIRED: 'REVIEW_REQUIRED',
    BLOCK: 'BLOCK'
  });

  const PROTOCOL_STATUS = Object.freeze({
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    SUSPENDED: 'SUSPENDED'
  });

  const ADHERENCE_STATUS = Object.freeze({
    COMPLETED: 'COMPLETED',
    BROKEN: 'BROKEN',
    PARTIAL: 'PARTIAL',
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS'
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. EXTRAÇÃO DE SINAIS CLÍNICOS (CLINICAL RISK SIGNALS)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Remove acentos e normaliza texto para análise lexical
   */
  function normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  /**
   * Extrai sinais clínicos estruturados a partir da anamnese e exames.
   * Diferencia:
   * - Condição confirmada no paciente
   * - Condição negada ("nega gestação", "sem diabetes")
   * - Histórico familiar ("mãe com diabetes", "irmã teve transtorno")
   * - Condição ambígua / possível
   * - Condição desconhecida / ausência de dados
   */
  function extractClinicalRiskSignals(patientData = {}, clinicalExams = []) {
    const rawNotes = [
      patientData.clinicalNotes || '',
      patientData.anamnesis || '',
      Array.isArray(patientData.clinicalConstraints) ? patientData.clinicalConstraints.join('; ') : (patientData.clinicalConstraints || ''),
      patientData.dietaryRestrictions || '',
      patientData.routineNotes || '',
      patientData.objective || '',
      patientData.lifestyleObservations || '',
      patientData.medicalHistory || ''
    ].join('\n');

    const normalizedNotes = normalizeText(rawNotes);

    // Estrutura de retorno exigida
    const signals = {
      pregnancy: { status: 'UNKNOWN', evidence: [] },
      lactation: { status: 'UNKNOWN', evidence: [] },
      eatingDisorder: { status: 'UNKNOWN', evidence: [] },
      insulinUse: { status: 'UNKNOWN', evidence: [] },
      diabetes: { status: 'UNKNOWN', evidence: [] }
    };

    // Quebra em orações/frases para evitar contaminação de contexto entre sentenças
    const clauses = normalizedNotes
      .split(/[.\n;]/)
      .map(c => c.trim())
      .filter(Boolean);

    // Helpers de negação e histórico familiar
    const isNegatedClause = (clause, targetPattern) => {
      const negationPatterns = [
        new RegExp(`(?:nega|sem|nao|livre de|ausencia de|descartad[ao]|zero)\\s+(?:sinais de\\s+|historico de\\s+|relato de\\s+)?${targetPattern}`, 'i'),
        new RegExp(`${targetPattern}\\s+(?:negad[ao]|ausente|descartad[ao]|improvavel)`, 'i'),
        new RegExp(`(?:nega|sem|nao)\\b.*?${targetPattern}`, 'i')
      ];
      return negationPatterns.some(p => p.test(clause));
    };

    const isFamilyHistoryClause = (clause, targetPattern) => {
      if (/(?:historico familiar|antecedente(?:s)? familiar(?:es)?|historia familiar|heranca familiar)/i.test(clause)) {
        return true;
      }
      const familySubject = /(?:familiar|familia|pais?|mae|pai|irmao|irma|irmaos|irmas|avos?|tios?|parentes?|primos?)/i;
      const familyVerb = /(?:teve|tem|tinha|apresenta|apresentava|com|era|portador|diagnostico|historico)/i;
      if (familySubject.test(clause) && familyVerb.test(clause)) {
        return true;
      }
      const directPattern = new RegExp(`(?:familiar|pais?|mae|pai|irmao|irma|avos?|tios?|parentes?)\\b.*?${targetPattern}`, 'i');
      const postfixPattern = new RegExp(`${targetPattern}\\b.*?familiar`, 'i');
      return directPattern.test(clause) || postfixPattern.test(clause);
    };

    // ── GESTAÇÃO ──
    const pregTerms = '(?:gestacao|gravidez|gestante|gravida)';
    let pregFound = false;
    for (const clause of clauses) {
      if (new RegExp(pregTerms, 'i').test(clause)) {
        pregFound = true;
        if (isFamilyHistoryClause(clause, pregTerms)) {
          signals.pregnancy.evidence.push(`Histórico familiar: "${clause}"`);
        } else if (isNegatedClause(clause, pregTerms)) {
          signals.pregnancy.status = 'NEGATED';
          signals.pregnancy.evidence.push(`Negação documentada: "${clause}"`);
        } else if (/(?:suspeita|atraso menstrual|possivel|duvida)/i.test(clause)) {
          if (signals.pregnancy.status !== 'CONFIRMED') {
            signals.pregnancy.status = 'POSSIBLE';
            signals.pregnancy.evidence.push(`Suspeita/Ambiguidade: "${clause}"`);
          }
        } else {
          signals.pregnancy.status = 'CONFIRMED';
          signals.pregnancy.evidence.push(`Gravidez identificada: "${clause}"`);
        }
      }
    }
    if (!pregFound && patientData.isPregnant === true) {
      signals.pregnancy.status = 'CONFIRMED';
      signals.pregnancy.evidence.push('Sinalizador booleano isPregnant=true');
    } else if (!pregFound && patientData.isPregnant === false) {
      signals.pregnancy.status = 'NEGATED';
      signals.pregnancy.evidence.push('Sinalizador booleano isPregnant=false');
    }

    // ── LACTAÇÃO ──
    const lactTerms = '(?:lactacao|amamentacao|amamentando|lactante|peito)';
    let lactFound = false;
    for (const clause of clauses) {
      if (new RegExp(lactTerms, 'i').test(clause)) {
        lactFound = true;
        if (isFamilyHistoryClause(clause, lactTerms)) {
          signals.lactation.evidence.push(`Histórico familiar: "${clause}"`);
        } else if (isNegatedClause(clause, lactTerms)) {
          signals.lactation.status = 'NEGATED';
          signals.lactation.evidence.push(`Negação documentada: "${clause}"`);
        } else {
          signals.lactation.status = 'CONFIRMED';
          signals.lactation.evidence.push(`Lactação identificada: "${clause}"`);
        }
      }
    }
    if (!lactFound && patientData.isLactating === true) {
      signals.lactation.status = 'CONFIRMED';
      signals.lactation.evidence.push('Sinalizador booleano isLactating=true');
    } else if (!lactFound && patientData.isLactating === false) {
      signals.lactation.status = 'NEGATED';
      signals.lactation.evidence.push('Sinalizador booleano isLactating=false');
    }

    // ── TRANSTORNO ALIMENTAR (Eating Disorder) ──
    const edTerms = '(?:transtorno alimentar|anorexia|bulimia|tcap|compulsao alimentar|purga|vomito induzido)';
    let edFound = false;
    for (const clause of clauses) {
      if (new RegExp(edTerms, 'i').test(clause)) {
        edFound = true;
        if (isFamilyHistoryClause(clause, edTerms)) {
          signals.eatingDisorder.evidence.push(`Histórico familiar (não atribuível ao paciente): "${clause}"`);
          if (signals.eatingDisorder.status === 'UNKNOWN') {
            signals.eatingDisorder.status = 'UNKNOWN';
          }
        } else if (isNegatedClause(clause, edTerms)) {
          signals.eatingDisorder.status = 'NEGATED';
          signals.eatingDisorder.evidence.push(`Negação documentada: "${clause}"`);
        } else if (/(?:passado|remissao|historico pessoal antigo|ha 5 anos|ha 10 anos)/i.test(clause)) {
          signals.eatingDisorder.status = 'POSSIBLE';
          signals.eatingDisorder.evidence.push(`Histórico prévio/remissão: "${clause}"`);
        } else {
          signals.eatingDisorder.status = 'CONFIRMED';
          signals.eatingDisorder.evidence.push(`Transtorno alimentar ativo/confirmado: "${clause}"`);
        }
      }
    }

    // ── USO DE INSULINA ──
    const insulinTerms = '(?:insulina|nph|glargina|lantus|tresiba|lispro|humalog|novorapid|aspart|degludeca)';
    for (const clause of clauses) {
      if (new RegExp(insulinTerms, 'i').test(clause)) {
        if (isFamilyHistoryClause(clause, insulinTerms)) {
          signals.insulinUse.evidence.push(`Histórico familiar: "${clause}"`);
        } else if (isNegatedClause(clause, insulinTerms)) {
          signals.insulinUse.status = 'NEGATED';
          signals.insulinUse.evidence.push(`Negação documentada: "${clause}"`);
        } else {
          signals.insulinUse.status = 'CONFIRMED';
          signals.insulinUse.evidence.push(`Uso de insulina identificado: "${clause}"`);
        }
      }
    }

    // ── DIABETES & EXAMES ──
    const dmTerms = '(?:diabetes|diabetico|diabetica|dm1|dm 1|dm2|dm 2)';
    for (const clause of clauses) {
      if (new RegExp(dmTerms, 'i').test(clause)) {
        if (isFamilyHistoryClause(clause, dmTerms)) {
          signals.diabetes.evidence.push(`Histórico familiar: "${clause}"`);
        } else if (isNegatedClause(clause, dmTerms)) {
          signals.diabetes.status = 'NEGATED';
          signals.diabetes.evidence.push(`Negação documentada: "${clause}"`);
        } else if (/(?:tipo 1|tipo i\b|dm1|dm 1|insulinodependente)/i.test(clause)) {
          signals.diabetes.status = 'CONFIRMED';
          signals.diabetes.type = 'TYPE_1';
          signals.diabetes.evidence.push(`Diabetes Tipo 1 identificado: "${clause}"`);
        } else if (/(?:tipo 2|tipo ii\b|dm2|dm 2)/i.test(clause)) {
          signals.diabetes.status = 'CONFIRMED';
          signals.diabetes.type = 'TYPE_2';
          signals.diabetes.evidence.push(`Diabetes Tipo 2 identificado: "${clause}"`);
        } else {
          // Menção sem tipo explícito -> ambíguo
          if (signals.diabetes.status !== 'CONFIRMED') {
            signals.diabetes.status = 'POSSIBLE';
            signals.diabetes.evidence.push(`Menção a diabetes sem especificação completa de tipo/tratamento: "${clause}"`);
          }
        }
      }
    }

    // Análise de exames bioquímicos laboratoriais
    if (Array.isArray(clinicalExams) && clinicalExams.length > 0) {
      clinicalExams.forEach(exam => {
        const name = normalizeText(exam.examName || exam.name || '');
        const val = parseFloat(String(exam.result || exam.value || '').replace(',', '.'));
        if (isNaN(val)) return;

        // Glicemia de jejum
        if (name.includes('glicemia') || name.includes('glicose')) {
          if (val >= 126) {
            signals.diabetes.status = 'CONFIRMED';
            signals.diabetes.evidence.push(`Glicemia de jejum alterada em nível diagnóstico: ${val} mg/dL (>=126 mg/dL)`);
          } else if (val >= 100) {
            if (signals.diabetes.status === 'UNKNOWN') signals.diabetes.status = 'POSSIBLE';
            signals.diabetes.evidence.push(`Glicemia de jejum alterada (pré-diabetes): ${val} mg/dL (100-125 mg/dL)`);
          }
        }

        // Hemoglobina Glicada (HbA1c)
        if (name.includes('hba1c') || name.includes('glicada')) {
          if (val >= 6.5) {
            signals.diabetes.status = 'CONFIRMED';
            signals.diabetes.evidence.push(`HbA1c alterada em nível diagnóstico: ${val}% (>=6.5%)`);
          } else if (val >= 5.7) {
            if (signals.diabetes.status === 'UNKNOWN') signals.diabetes.status = 'POSSIBLE';
            signals.diabetes.evidence.push(`HbA1c em faixa de atenção/pré-diabetes: ${val}% (5.7%-6.4%)`);
          }
        }
      });
    }

    return signals;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. FIREWALL CLÍNICO DETERMINÍSTICO (EVALUATE ELIGIBILITY)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Avalia a elegibilidade clínica determinística para prescrição de jejum.
   * Regra absoluta: Ausência de dados suficientes gera REVIEW_REQUIRED, NUNCA PASS.
   */
  function evaluateFastingEligibility(patientData = {}, clinicalExams = []) {
    const reasons = [];
    const warnings = [];
    let severity = SEVERITY_LEVELS.PASS;

    // Helper para elevar gravidade
    const escalate = (targetSeverity, message, isWarning = false) => {
      if (isWarning) {
        warnings.push(message);
      } else {
        reasons.push(message);
      }

      const priority = {
        [SEVERITY_LEVELS.PASS]: 0,
        [SEVERITY_LEVELS.WARNING]: 1,
        [SEVERITY_LEVELS.REVIEW_REQUIRED]: 2,
        [SEVERITY_LEVELS.BLOCK]: 3
      };

      if (priority[targetSeverity] > priority[severity]) {
        severity = targetSeverity;
      }
    };

    // Helper de parsing numérico com suporte a locale brasileiro (vírgula decimal)
    const parseNum = (val) => {
      if (val === undefined || val === null || val === '') return null;
      if (typeof val === 'number') return isNaN(val) ? null : val;
      const clean = String(val).trim().replace(',', '.');
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? null : parsed;
    };

    // ── REGRA 1: DADOS SUFICIENTES OBRIGATÓRIOS ──
    const ageVal = parseNum(patientData.age);
    const hasAge = ageVal !== null && ageVal > 0;

    // Suporte flexível para nomenclaturas do sistema NutriAx Pro (weight, currentWeight, usualWeight, weightKg)
    const rawWeight = parseNum(
      patientData.weight ??
      patientData.currentWeight ??
      patientData.usualWeight ??
      patientData.weightKg
    );

    // Suporte flexível para altura (height em m ou cm, heightCm, heightM)
    const rawHeight = parseNum(
      patientData.height ??
      patientData.heightCm ??
      patientData.heightM
    );

    const hasWeight = rawWeight !== null && rawWeight > 0;
    const hasHeight = rawHeight !== null && rawHeight > 0;

    let bmi = null;
    if (patientData.bmi && parseNum(patientData.bmi) !== null) {
      bmi = parseNum(patientData.bmi);
    } else if (hasWeight && hasHeight) {
      const heightM = rawHeight > 3 ? rawHeight / 100 : rawHeight;
      if (heightM > 0) {
        bmi = rawWeight / (heightM * heightM);
      }
    }

    // Se dados vitais ou antropometria faltarem completamente
    if (!hasAge || bmi === null) {
      escalate(
        SEVERITY_LEVELS.REVIEW_REQUIRED,
        'Dados antropométricos essenciais incompletos (idade, peso ou altura ausentes). A avaliação profissional presencial é mandatória.'
      );
    }

    // Se a anamnese geral for completamente ausente ou vazia
    const hasAnyAnamnesis = !!(
      (patientData.clinicalNotes && String(patientData.clinicalNotes).trim().length >= 3) ||
      (patientData.anamnesis && String(patientData.anamnesis).trim().length >= 3) ||
      (patientData.routineNotes && String(patientData.routineNotes).trim().length >= 3) ||
      (patientData.dietaryRestrictions && String(patientData.dietaryRestrictions).trim().length >= 3) ||
      (patientData.objective && String(patientData.objective).trim().length >= 3) ||
      (patientData.patientType && String(patientData.patientType).trim().length >= 3) ||
      (Array.isArray(patientData.clinicalConstraints) && patientData.clinicalConstraints.length > 0) ||
      (Array.isArray(clinicalExams) && clinicalExams.length > 0) ||
      patientData.hasAnamnesis === true
    );

    if (!hasAnyAnamnesis) {
      escalate(
        SEVERITY_LEVELS.REVIEW_REQUIRED,
        'Anamnese clínica não preenchida. Ausência de dados não garante ausência de contraindicação clínica.'
      );
    }

    // ── REGRA 2: IDADE ──
    if (hasAge) {
      const age = Number(ageVal);
      if (age < 14) {
        escalate(
          SEVERITY_LEVELS.BLOCK,
          `Idade (${age} anos) abaixo do limite de segurança pediátrico (< 14 anos). Contraindicação absoluta.`
        );
      } else if (age >= 14 && age < 18) {
        escalate(
          SEVERITY_LEVELS.REVIEW_REQUIRED,
          `Faixa etária adolescente (${age} anos): Jejum exige estrita avaliação clínica e nutricional individualizada.`
        );
      }
    }

    // ── REGRA 3: IMC ──
    if (bmi !== null) {
      if (bmi < 18.5) {
        escalate(
          SEVERITY_LEVELS.BLOCK,
          `Baixo peso / IMC (${bmi.toFixed(1)} kg/m²) abaixo de 18,5 kg/m². Risco de desnutrição e sarcopenia. Contraindicação absoluta.`
        );
      } else if (bmi >= 18.5 && bmi < 20.0) {
        escalate(
          SEVERITY_LEVELS.WARNING,
          `IMC limítrofe (${bmi.toFixed(1)} kg/m² entre 18,5 e 20,0). Monitorar rigorosamente a ingestão de calorias e proteínas para evitar perda de massa magra.`,
          true
        );
      }
    }

    // ── REGRA 4: SINAIS CLÍNICOS E PATOLOGIAS ──
    const signals = extractClinicalRiskSignals(patientData, clinicalExams);

    // Gestação confirmada -> BLOCK
    if (signals.pregnancy.status === 'CONFIRMED') {
      escalate(
        SEVERITY_LEVELS.BLOCK,
        'Gestação confirmada: contraindicação absoluta para jejum intermitente devido às necessidades de desenvolvimento fetal.'
      );
    } else if (signals.pregnancy.status === 'POSSIBLE') {
      escalate(
        SEVERITY_LEVELS.REVIEW_REQUIRED,
        'Suspeita ou relato ambíguo de gestação. Requer confirmação ou teste laboratorial prévio.'
      );
    }

    // Lactação confirmada -> BLOCK
    if (signals.lactation.status === 'CONFIRMED') {
      escalate(
        SEVERITY_LEVELS.BLOCK,
        'Lactação/Amamentação confirmada: contraindicação absoluta devido às demandas hidroeletrolíticas e calóricas da síntese láctea.'
      );
    }

    // Transtorno alimentar atual/confirmado -> BLOCK
    if (signals.eatingDisorder.status === 'CONFIRMED') {
      escalate(
        SEVERITY_LEVELS.BLOCK,
        'Transtorno do comportamento alimentar ativo documentado: jejum contraindicado devido a alto risco de gatilhos e episódios de compulsão/purgação.'
      );
    } else if (signals.eatingDisorder.status === 'POSSIBLE') {
      escalate(
        SEVERITY_LEVELS.REVIEW_REQUIRED,
        'Histórico prévio ou ambiguidade quanto a comportamento alimentar desordenado. Exige avaliação psicológica/nutricional especializada.'
      );
    }

    // Diabetes e Insulina
    const isDM1 = signals.diabetes.status === 'CONFIRMED' && (
      signals.diabetes.type === 'TYPE_1' ||
      signals.diabetes.evidence.some(e => !e.startsWith('Histórico familiar') && /tipo 1|dm1/i.test(e))
    );
    const usesInsulin = signals.insulinUse.status === 'CONFIRMED';

    if (isDM1 || (signals.diabetes.status === 'CONFIRMED' && usesInsulin)) {
      escalate(
        SEVERITY_LEVELS.BLOCK,
        'Diabetes Mellitus Tipo 1 ou uso ativo de insulina: risco crítico de hipoglicemia grave e cetoacidose euglicêmica. Contraindicação absoluta para protocolos autônomos de jejum.'
      );
    } else if (signals.diabetes.status === 'CONFIRMED' || signals.diabetes.status === 'POSSIBLE') {
      // Diabetes identificado mas sem detalhamento seguro de conduta medicamentosa
      escalate(
        SEVERITY_LEVELS.REVIEW_REQUIRED,
        'Quadro de Diabetes ou hiperglicemia documentado sem protocolo de ajuste medicamentoso alinhado. Exige aprovação profissional expressa.'
      );
    }

    // Verificação de exames laboratoriais complementares
    if (Array.isArray(clinicalExams)) {
      clinicalExams.forEach(exam => {
        const name = normalizeText(exam.examName || exam.name || '');
        const val = parseFloat(String(exam.result || exam.value || '').replace(',', '.'));
        if (isNaN(val)) return;

        if ((name.includes('glicemia') || name.includes('glicose')) && val >= 126 && severity !== SEVERITY_LEVELS.BLOCK) {
          escalate(
            SEVERITY_LEVELS.REVIEW_REQUIRED,
            `Glicemia de jejum elevada (${val} mg/dL): requer confirmação clínica e avaliação de tolerância antes de jejum prolongado.`
          );
        }
        if ((name.includes('hba1c') || name.includes('glicada')) && val >= 6.5 && severity !== SEVERITY_LEVELS.BLOCK) {
          escalate(
            SEVERITY_LEVELS.REVIEW_REQUIRED,
            `HbA1c em faixa de diabetes (${val}%): requer alinhamento médico/nutricional rigoroso.`
          );
        }
      });
    }

    const eligible = severity !== SEVERITY_LEVELS.BLOCK;
    const requiresProfessionalApproval = severity === SEVERITY_LEVELS.REVIEW_REQUIRED;

    return {
      eligible,
      severity,
      requiresProfessionalApproval,
      reasons,
      warnings,
      clinicalSignals: signals
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. MODELO DO PROTOCOLO, VERSIONAMENTO E APROVAÇÃO
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Cria objeto canônico FastingProtocol com dados padrão e audit trail inicial
   */
  function createFastingProtocol(patientId, config = {}) {
    if (!patientId) throw new Error('patientId é obrigatório para criar FastingProtocol');

    const nowIso = new Date().toISOString();
    const type = config.type || PROTOCOL_TYPES.TRE;
    const subtype = config.subtype || '16:8';

    // Determina janelas padrão conforme subtipo
    let defaultStart = '12:00';
    let defaultEnd = '20:00';

    if (subtype === '14:10') { defaultStart = '10:00'; defaultEnd = '20:00'; }
    else if (subtype === '18:6') { defaultStart = '12:00'; defaultEnd = '18:00'; }
    else if (subtype === '20:4') { defaultStart = '14:00'; defaultEnd = '18:00'; }
    else if (subtype === 'OMAD') { defaultStart = '18:00'; defaultEnd = '19:00'; }

    return {
      id: `${patientId}_fasting`,
      patientId: String(patientId).trim(),
      enabled: config.enabled !== undefined ? !!config.enabled : false,
      type: type,
      subtype: subtype,
      objectives: Array.isArray(config.objectives) ? [...config.objectives] : [PROTOCOL_OBJECTIVES.FAT_LOSS, PROTOCOL_OBJECTIVES.INSULIN_SENSITIVITY],
      timezone: config.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
      feedingWindows: Array.isArray(config.feedingWindows) && config.feedingWindows.length > 0
        ? config.feedingWindows
        : [{ start: defaultStart, end: defaultEnd }],
      activeDays: Array.isArray(config.activeDays) ? config.activeDays : [0, 1, 2, 3, 4, 5, 6], // 0=Domingo..6=Sábado
      protocolVersion: 1,
      status: config.status || PROTOCOL_STATUS.ACTIVE,
      prescribedAt: config.prescribedAt || nowIso,
      updatedAt: nowIso,
      approval: {
        approved: !!config.approved,
        approvedBy: config.approvedBy || null,
        approvedAt: config.approved ? (config.approvedAt || nowIso) : null,
        eligibilitySeverity: config.eligibilitySeverity || SEVERITY_LEVELS.PASS,
        eligibilitySnapshot: config.eligibilitySnapshot || {}
      },
      clinicalNotes: config.clinicalNotes || '',
      auditTrail: []
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. TIMER ENGINE DINÂMICO (COMPUTE FASTING STATE)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Converte string "HH:MM" em minutos desde o início do dia
   */
  function timeStringToMinutes(hhmm) {
    if (!hhmm || typeof hhmm !== 'string' || !hhmm.includes(':')) return 0;
    const [h, m] = hhmm.split(':').map(Number);
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  }

  /**
   * Calcula o estado dinâmico do jejum/alimentação no momento `now`.
   * Suporta:
   * - Janelas normais (ex: 12:00 às 20:00)
   * - Janelas que atravessam meia-noite (ex: 20:00 às 04:00)
   * - Dias inativos da semana
   * - Subtipos 14:10, 16:8, 18:6, 20:4, OMAD, CUSTOM
   */
  function computeFastingState(protocol, now = new Date()) {
    if (!protocol || !protocol.enabled || protocol.status !== PROTOCOL_STATUS.ACTIVE) {
      return {
        currentState: 'INACTIVE',
        feedingWindowStart: null,
        feedingWindowEnd: null,
        elapsedMinutes: 0,
        remainingMinutes: 0,
        progressPercent: 0,
        nextTransitionAt: null,
        isActiveDay: false,
        fastingDurationHours: 0,
        feedingDurationHours: 0
      };
    }

    const nowDate = (now instanceof Date && !isNaN(now.getTime())) ? now : new Date();
    const currentDay = nowDate.getDay(); // 0 = Domingo, 6 = Sábado
    const activeDays = Array.isArray(protocol.activeDays) ? protocol.activeDays : [0, 1, 2, 3, 4, 5, 6];
    const isActiveDay = activeDays.includes(currentDay);

    const windowCfg = (protocol.feedingWindows && protocol.feedingWindows[0]) || { start: '12:00', end: '20:00' };
    const startStr = windowCfg.start || '12:00';
    const endStr = windowCfg.end || '20:00';

    const startMin = timeStringToMinutes(startStr);
    const endMin = timeStringToMinutes(endStr);
    const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();

    // Se o dia de hoje for inativo segundo a escala semanal
    if (!isActiveDay) {
      return {
        currentState: 'INACTIVE',
        feedingWindowStart: startStr,
        feedingWindowEnd: endStr,
        elapsedMinutes: 0,
        remainingMinutes: 0,
        progressPercent: 0,
        nextTransitionAt: null,
        isActiveDay: false,
        fastingDurationHours: 0,
        feedingDurationHours: 0
      };
    }

    // Calcula duração da janela de alimentação (em minutos)
    let feedingDurationMin;
    let crossesMidnight = false;

    if (endMin > startMin) {
      feedingDurationMin = endMin - startMin;
    } else if (endMin < startMin) {
      crossesMidnight = true;
      feedingDurationMin = (1440 - startMin) + endMin;
    } else {
      // 24h ou zero (OMAD extremo ou janela de 1h mínima padrão)
      feedingDurationMin = 60;
    }

    const fastingDurationMin = 1440 - feedingDurationMin;
    const feedingDurationHours = Math.round((feedingDurationMin / 60) * 10) / 10;
    const fastingDurationHours = Math.round((fastingDurationMin / 60) * 10) / 10;

    let isFeeding = false;
    let elapsedMinutes = 0;
    let remainingMinutes = 0;
    let nextTransitionMin = 0;
    let nextTransitionIsTomorrow = false;

    if (!crossesMidnight) {
      // Exemplo: 12:00 às 20:00
      if (nowMin >= startMin && nowMin < endMin) {
        isFeeding = true;
        elapsedMinutes = nowMin - startMin;
        remainingMinutes = endMin - nowMin;
        nextTransitionMin = endMin;
      } else {
        isFeeding = false;
        if (nowMin < startMin) {
          // Antes do almoço: o jejum iniciou no fim da janela de ontem (endMin do dia anterior)
          const fastingStartYesterday = endMin - 1440;
          elapsedMinutes = nowMin - fastingStartYesterday;
          remainingMinutes = startMin - nowMin;
          nextTransitionMin = startMin;
        } else {
          // Depois das 20h: jejum iniciou às 20h de hoje
          elapsedMinutes = nowMin - endMin;
          remainingMinutes = (1440 - nowMin) + startMin;
          nextTransitionMin = startMin;
          nextTransitionIsTomorrow = true;
        }
      }
    } else {
      // Janela que atravessa meia-noite (ex: 20:00 às 04:00)
      if (nowMin >= startMin || nowMin < endMin) {
        isFeeding = true;
        if (nowMin >= startMin) {
          elapsedMinutes = nowMin - startMin;
          remainingMinutes = (1440 - nowMin) + endMin;
          nextTransitionMin = endMin;
          nextTransitionIsTomorrow = true;
        } else {
          elapsedMinutes = (1440 - startMin) + nowMin;
          remainingMinutes = endMin - nowMin;
          nextTransitionMin = endMin;
        }
      } else {
        // Em jejum (ex: 04:00 às 20:00)
        isFeeding = false;
        elapsedMinutes = nowMin - endMin;
        remainingMinutes = startMin - nowMin;
        nextTransitionMin = startMin;
      }
    }

    const currentState = isFeeding ? 'FEEDING' : 'FASTING';
    const totalCycleMin = isFeeding ? feedingDurationMin : fastingDurationMin;
    const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMinutes / totalCycleMin) * 100)));

    // Monta timestamp da próxima transição
    const nextDate = new Date(nowDate.getTime());
    if (nextTransitionIsTomorrow) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    nextDate.setHours(Math.floor(nextTransitionMin / 60), nextTransitionMin % 60, 0, 0);

    return {
      currentState,
      feedingWindowStart: startStr,
      feedingWindowEnd: endStr,
      elapsedMinutes,
      remainingMinutes,
      progressPercent,
      nextTransitionAt: nextDate.toISOString(),
      isActiveDay: true,
      fastingDurationHours,
      feedingDurationHours
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. PERSISTÊNCIA DEXIE + FALLBACK LOCAL (OFFLINE-FIRST)
  // ─────────────────────────────────────────────────────────────────────────

  function getLocalDexieDb() {
    if (typeof db !== 'undefined' && db && typeof db.table === 'function') {
      return db;
    }
    if (typeof window !== 'undefined' && window.db && typeof window.db.table === 'function') {
      return window.db;
    }
    return null;
  }

  /**
   * Salva protocolo com GUARDA DE PERSISTÊNCIA determinística e versionamento
   */
  async function saveFastingProtocol(patientId, protocol, author = 'Nutricionista') {
    if (!patientId || !protocol) {
      throw new Error('[saveFastingProtocol] patientId e protocol são obrigatórios.');
    }

    const sanitizedId = String(patientId).trim();
    const isEnabling = protocol.enabled === true || protocol.status === PROTOCOL_STATUS.ACTIVE;

    // ── FIREWALL DE DOMÍNIO: PERSISTENCE GUARD ──
    const severity = protocol.approval?.eligibilitySeverity;
    const isApproved = !!protocol.approval?.approved;

    if (isEnabling) {
      if (severity === SEVERITY_LEVELS.BLOCK) {
        throw new Error(
          `[PERSISTENCE GUARD REJECT] Protocolo com status BLOCK não pode ser ativado nem salvo como habilitado para o paciente "${sanitizedId}". Contraindicação clínica absoluta.`
        );
      }
      if (severity === SEVERITY_LEVELS.REVIEW_REQUIRED && !isApproved) {
        throw new Error(
          `[PERSISTENCE GUARD REJECT] Protocolo com status REVIEW_REQUIRED exige aprovação profissional explícita antes da ativação (paciente "${sanitizedId}").`
        );
      }
    }

    // Carrega versão anterior para gerenciar versionamento e audit trail
    const existing = await loadFastingProtocol(sanitizedId);
    let nextVersion = 1;
    const auditTrail = Array.isArray(protocol.auditTrail) ? [...protocol.auditTrail] : [];

    if (existing) {
      // Detecção de conflito: Protocolo com versão inferior não pode sobrescrever versão superior existente
      if (protocol.protocolVersion && protocol.protocolVersion < existing.protocolVersion) {
        throw new Error(
          `[VERSION CONFLICT REJECT] Versão do protocolo recebido (v${protocol.protocolVersion}) é anterior à versão existente no banco (v${existing.protocolVersion}). Sobrescrita negada.`
        );
      }

      // Se for uma modificação de um protocolo existente, incrementa a versão
      nextVersion = (existing.protocolVersion || 1) + 1;

      // Preserva snapshot da versão anterior no audit trail
      const { auditTrail: _, ...previousSnapshot } = existing;
      auditTrail.push({
        version: existing.protocolVersion || 1,
        changedAt: new Date().toISOString(),
        changedBy: author || 'Profissional',
        previousProtocol: previousSnapshot
      });
    }

    const nowIso = new Date().toISOString();
    const finalProtocol = {
      ...protocol,
      id: `${sanitizedId}_fasting`,
      patientId: sanitizedId,
      protocolVersion: protocol.protocolVersion && !existing ? protocol.protocolVersion : nextVersion,
      updatedAt: nowIso,
      auditTrail
    };

    // 1. Salva no Dexie (se disponível)
    const dexieInstance = getLocalDexieDb();
    if (dexieInstance && dexieInstance.fastingProtocols) {
      try {
        await dexieInstance.fastingProtocols.put(finalProtocol);
      } catch (dexieErr) {
        console.warn('[NutriAx Fasting] Falha ao persistir no Dexie:', dexieErr);
      }
    }

    // 2. Salva em LocalStorage para disponibilidade offline e paciente.html
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`nutriax_fasting_protocol_${sanitizedId}`, JSON.stringify(finalProtocol));
      }
    } catch (_) {}

    // 3. Sincroniza com o Firebase se disponível
    if (typeof window !== 'undefined' && window.NutriProFirebase?.fasting?.syncProtocolToCloud) {
      try {
        await window.NutriProFirebase.fasting.syncProtocolToCloud(sanitizedId, finalProtocol);
      } catch (cloudErr) {
        console.info('[NutriAx Fasting] Sincronização em nuvem diferida (offline):', cloudErr);
      }
    }

    return finalProtocol;
  }

  /**
   * Carrega o protocolo de jejum vigente do paciente
   */
  async function loadFastingProtocol(patientId) {
    if (!patientId) return null;
    const sanitizedId = String(patientId).trim();

    // 1. Tenta carregar do Dexie
    const dexieInstance = getLocalDexieDb();
    if (dexieInstance && dexieInstance.fastingProtocols) {
      try {
        const doc = await dexieInstance.fastingProtocols.get(`${sanitizedId}_fasting`);
        if (doc) return doc;
      } catch (err) {
        console.warn('[NutriAx Fasting] Erro ao ler Dexie fastingProtocols:', err);
      }
    }

    // 2. Tenta carregar do LocalStorage
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(`nutriax_fasting_protocol_${sanitizedId}`);
        if (raw) return JSON.parse(raw);
      }
    } catch (_) {}

    // 3. Tenta carregar da Nuvem se conectado
    if (typeof window !== 'undefined' && window.NutriProFirebase?.fasting?.loadProtocolFromCloud) {
      try {
        const cloudDoc = await window.NutriProFirebase.fasting.loadProtocolFromCloud(sanitizedId);
        if (cloudDoc) {
          // Grava no Dexie/LocalStorage em cache não-bloqueante
          if (dexieInstance && dexieInstance.fastingProtocols) {
            dexieInstance.fastingProtocols.put(cloudDoc).catch(() => {});
          }
          return cloudDoc;
        }
      } catch (_) {}
    }

    return null;
  }

  /**
   * Salva registro diário (log) de cumprimento ou quebra pelo paciente.
   * Garante idempotência: ID determinístico `${patientId}_${date}` previne duplicatas.
   */
  async function saveFastingLog(patientId, logEntry) {
    if (!patientId || !logEntry || !logEntry.date) {
      throw new Error('[saveFastingLog] patientId e logEntry com date são obrigatórios.');
    }

    const sanitizedId = String(patientId).trim();
    const logId = logEntry.id || `${sanitizedId}_${logEntry.date}`;
    const nowIso = new Date().toISOString();

    const canonicalLog = {
      id: logId,
      patientId: sanitizedId,
      date: logEntry.date,
      protocolVersion: Number(logEntry.protocolVersion) || 1,
      protocolType: logEntry.protocolType || 'TRE',
      windowStart: logEntry.windowStart || '12:00',
      windowEnd: logEntry.windowEnd || '20:00',
      adherenceStatus: logEntry.adherenceStatus || ADHERENCE_STATUS.COMPLETED,
      startedAt: logEntry.startedAt || (logEntry.adherenceStatus === ADHERENCE_STATUS.IN_PROGRESS ? nowIso : null),
      brokenAt: logEntry.adherenceStatus === ADHERENCE_STATUS.BROKEN ? (logEntry.brokenAt || nowIso) : null,
      source: 'PATIENT_SELF_REPORT',
      notes: logEntry.notes || null,
      subjectiveMetrics: {
        hunger: logEntry.subjectiveMetrics?.hunger ?? null,
        energy: logEntry.subjectiveMetrics?.energy ?? null,
        mentalFocus: logEntry.subjectiveMetrics?.mentalFocus ?? null,
        wellbeing: logEntry.subjectiveMetrics?.wellbeing ?? null
      },
      syncStatus: 'PENDING_SYNC',
      createdAt: logEntry.createdAt || nowIso,
      updatedAt: nowIso
    };

    // 1. Grava no Dexie
    const dexieInstance = getLocalDexieDb();
    if (dexieInstance && dexieInstance.fastingLogs) {
      try {
        await dexieInstance.fastingLogs.put(canonicalLog);
      } catch (err) {
        console.warn('[NutriAx Fasting] Erro ao gravar fastingLog no Dexie:', err);
      }
    }

    // 2. Grava no LocalStorage (histórico recente)
    try {
      if (typeof localStorage !== 'undefined') {
        const storageKey = `nutriax_fasting_logs_${sanitizedId}`;
        const existingLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updatedLogs = existingLogs.filter(l => l.id !== logId);
        updatedLogs.push(canonicalLog);
        localStorage.setItem(storageKey, JSON.stringify(updatedLogs));
      }
    } catch (_) {}

    // 3. Sincroniza com Firebase se online
    if (typeof window !== 'undefined' && window.NutriProFirebase?.fasting?.syncLogToCloud) {
      try {
        const synced = await window.NutriProFirebase.fasting.syncLogToCloud(sanitizedId, canonicalLog);
        if (synced) {
          canonicalLog.syncStatus = 'SYNCED';
          if (dexieInstance && dexieInstance.fastingLogs) {
            await dexieInstance.fastingLogs.update(logId, { syncStatus: 'SYNCED' });
          }
        }
      } catch (_) {}
    }

    return canonicalLog;
  }

  /**
   * Carrega histórico de registros em uma faixa de datas
   */
  async function loadFastingLogs(patientId, dateFrom = null, dateTo = null) {
    if (!patientId) return [];
    const sanitizedId = String(patientId).trim();
    let logs = [];

    // 1. Tenta carregar do Dexie
    const dexieInstance = getLocalDexieDb();
    if (dexieInstance && dexieInstance.fastingLogs) {
      try {
        logs = await dexieInstance.fastingLogs
          .where('patientId')
          .equals(sanitizedId)
          .toArray();
      } catch (_) {}
    }

    // 2. Fallback para LocalStorage se Dexie estiver vazio ou inacessível
    if (!logs || logs.length === 0) {
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(`nutriax_fasting_logs_${sanitizedId}`);
          if (raw) logs = JSON.parse(raw);
        }
      } catch (_) {}
    }

    // Aplica filtro de datas se informado
    if (Array.isArray(logs)) {
      if (dateFrom) logs = logs.filter(l => l.date >= dateFrom);
      if (dateTo) logs = logs.filter(l => l.date <= dateTo);
      // Ordena por data decrescente
      logs.sort((a, b) => (b.date > a.date ? 1 : -1));
    }

    return logs || [];
  }

  /**
   * Sincroniza logs pendentes (offline-first) com a nuvem
   */
  async function syncPendingFastingLogs(patientId) {
    if (!patientId) return 0;
    const sanitizedId = String(patientId).trim();
    const logs = await loadFastingLogs(sanitizedId);
    const pending = logs.filter(l => l.syncStatus === 'PENDING_SYNC' || l.syncStatus === 'LOCAL');

    if (pending.length === 0) return 0;
    if (typeof window === 'undefined' || !window.NutriProFirebase?.fasting?.syncLogToCloud) return 0;

    let syncedCount = 0;
    const dexieInstance = getLocalDexieDb();

    for (const log of pending) {
      try {
        const ok = await window.NutriProFirebase.fasting.syncLogToCloud(sanitizedId, log);
        if (ok) {
          syncedCount++;
          log.syncStatus = 'SYNCED';
          if (dexieInstance && dexieInstance.fastingLogs) {
            await dexieInstance.fastingLogs.update(log.id, { syncStatus: 'SYNCED' });
          }
        }
      } catch (_) {}
    }

    return syncedCount;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. VALIDADOR DETERMINÍSTICO (CIRCUIT-BREAKER) PARA PRESCRIÇÃO POR IA
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Validador Determinístico (Circuit-Breaker) para Prescrição de Jejum Intermitente por IA.
   * Atua sob SUBORDINAÇÃO TOTAL às regras de segurança, metabólicas e operacionais.
   *
   * @param {Object} aiOutput - Objeto retornado pela IA ({ fastingProtocol: { type, frequencyPerWeek, allocatedDays, clinicalJustification, warningSafety } })
   * @param {Object} context - PerformanceContext canônico do paciente
   * @returns {Object} { isValid, status, errors, warnings, circuitBreakersTriggered, sanitizedProtocol }
   */
  function validateAIFastingPrescription(aiOutput, context = {}) {
    const errors = [];
    const warnings = [];
    const circuitBreakers = [];

    // Extrai payload raiz ou aninhado
    const rawProto = aiOutput?.fastingProtocol || aiOutput || {};

    let typeStr = String(rawProto.type || '16/8').trim();
    let frequencyPerWeek = parseInt(rawProto.frequencyPerWeek, 10) || 5;
    let allocatedDays = Array.isArray(rawProto.allocatedDays) ? [...rawProto.allocatedDays] : [];
    let clinicalJustification = String(rawProto.clinicalJustification || '').trim();
    let warningSafety = rawProto.warningSafety ? String(rawProto.warningSafety).trim() : null;

    const patientObj = context.patient || {};
    const energyObj = context.energy || {};
    const nutritionObj = context.nutrition || {};
    const cardiometabolicObj = context.cardiometabolic || {};
    const workoutSchedule = context.workoutSchedule || context.microcycle || [];

    const getKcal = parseFloat(energyObj.getKcal) || 0;
    const caloricTargetKcal = parseFloat(nutritionObj.caloricTargetKcal) || getKcal;
    const totalEnergy = Math.max(getKcal, caloricTargetKcal);
    const patientGoal = String(patientObj.objective || '').toLowerCase();
    const isLeanMassPreservation = /(?:preservacao de mm|preservar massa|massa magra|recomposicao corporal|recomposicao|hipertrofia|ganho de massa)/i.test(patientGoal);
    const rcEst = parseFloat(cardiometabolicObj.rcEst) || 0;

    // Helper para detectar horas de jejum a partir do tipo
    const parseFastingHours = (tStr) => {
      if (/12[:/]12/i.test(tStr)) return 12;
      if (/14[:/]10/i.test(tStr)) return 14;
      if (/16[:/]8/i.test(tStr)) return 16;
      if (/18[:/]6/i.test(tStr)) return 18;
      if (/20[:/]4/i.test(tStr)) return 20;
      if (/omad|23[:/]1/i.test(tStr)) return 23;
      if (/24h|eat-stop-eat/i.test(tStr)) return 24;
      return 16;
    };

    let fastingHours = parseFastingHours(typeStr);

    // ── 1. REGRAS DE SEGURANÇA (SAFETY - PRIORIDADE MÁXIMA) ──

    // BLOQUEIO CALÓRICO:
    // Se TMB/Gasto Total > 3.000 kcal/dia E objetivo incluir "Preservação de MM" ou "Recomposição Corporal":
    // Proibido jejuns superiores a 12 horas.
    if (totalEnergy > 3000 && isLeanMassPreservation) {
      if (fastingHours > 12) {
        circuitBreakers.push('BLOQUEIO_CALORICO_SEGURANCA');
        warnings.push('BLOQUEIO CALÓRICO ATIVADO: Gasto total/prescrito > 3.000 kcal com objetivo de preservação/recomposição. Jejum limitado determinísticamente a 12/12 (Descanso Noturno).');
        warningSafety = warningSafety || 'Bloqueio Calórico Ativado: Limitação de 12 horas para garantir aporte calórico e evitar catabolismo muscular.';
        typeStr = '12/12';
        fastingHours = 12;
      }
    }

    // PROTEÇÃO NEUROMUSCULAR:
    // Proibido alocar janelas de jejum em dias de treinamento de força pesada focados em
    // Membros Inferiores (Legs), Agachamentos, Levantamento Terra pesado ou Pull I pesado.
    const forbiddenPatterns = /(?:legs|perna|membros inferiores|inferiores|agachamento|squat|levantamento terra|deadlift|pull i\b|pull 1\b)/i;

    const safeAllocatedDays = [];
    const removedForbiddenDays = [];

    allocatedDays.forEach(dayStr => {
      const dStr = String(dayStr);
      if (forbiddenPatterns.test(dStr)) {
        removedForbiddenDays.push(dStr);
        return;
      }

      if (Array.isArray(workoutSchedule) && workoutSchedule.length > 0) {
        const matchNum = dStr.match(/dia\s*(\d+)/i);
        const dayIdx = matchNum ? parseInt(matchNum[1], 10) - 1 : null;
        if (dayIdx !== null && workoutSchedule[dayIdx]) {
          const schedItem = workoutSchedule[dayIdx];
          const schedText = `${schedItem.workoutName || ''} ${schedItem.type || ''} ${schedItem.details || ''}`;
          if (forbiddenPatterns.test(schedText)) {
            removedForbiddenDays.push(`${dStr} (${schedItem.workoutName || 'Treino Pesado'})`);
            return;
          }
        }
      }

      safeAllocatedDays.push(dStr);
    });

    if (removedForbiddenDays.length > 0) {
      circuitBreakers.push('PROTECAO_NEUROMUSCULAR');
      warnings.push(`PROTEÇÃO NEUROMUSCULAR ATIVADA: Janela de jejum vetada e removida dos dias de treino pesado: ${removedForbiddenDays.join(', ')}.`);
      warningSafety = warningSafety || 'Proteção Neuromuscular: Dias com treinos pesados de pernas/agachamento/terra preservados fora do jejum.';
      allocatedDays = safeAllocatedDays;
    }

    // ── 2. REGRAS METABÓLICAS (HEURISTIC) ──

    // QUEIMA DE GORDURA & INSULINA:
    // Objetivos "Queima de Gordura" + "Sensibilidade à Insulina" + RCEst >= 0,50 -> 16/8 de 5 a 7 dias
    const isFatLoss = /(?:queima de gordura|emagrecimento|perda de peso|definicao)/i.test(patientGoal);
    const isInsulinSensitivity = /(?:sensibilidade a insulina|resistencia insulinica|insulina|glicemia)/i.test(patientGoal) || (context.fasting && context.fasting.objectives?.includes('INSULIN_SENSITIVITY'));

    if (isFatLoss && isInsulinSensitivity && rcEst >= 0.50) {
      if (!/16/i.test(typeStr)) {
        circuitBreakers.push('METABOLICO_RCEST_16_8');
        warnings.push('REGRA METABÓLICA: RCEst >= 0,50 associado a Queima de Gordura e Sensibilidade à Insulina exige protocolo 16/8.');
        typeStr = '16/8';
        fastingHours = 16;
      }
      if (frequencyPerWeek < 5) {
        frequencyPerWeek = 5;
        warnings.push('FREQUÊNCIA AJUSTADA: Frequência elevada para o mínimo de 5 dias/semana devido à indicação metabólica (RCEst >= 0,50).');
      }
    }

    // LONGEVIDADE:
    // Objetivo "Estímulo Autofágico" -> OMAD 23:1 ou Eat-Stop-Eat 24h, max 1-2x/mês
    const isAutophagy = /(?:autofag|longevidade|estimulo autofagico)/i.test(patientGoal);
    if (isAutophagy) {
      if (!/omad|24h|eat-stop-eat|23[:/]1/i.test(typeStr)) {
        typeStr = 'OMAD 23:1';
        fastingHours = 23;
        warnings.push('PROTOCOLO DE LONGEVIDADE: Ajustado para OMAD 23:1 / estímulo autofágico.');
      }
      if (frequencyPerWeek > 2) {
        frequencyPerWeek = 1;
        warnings.push('FREQUÊNCIA DE SEGURANÇA: Protocolos de jejum longo/autofagia limitados a 1-2 vezes ao mês.');
      }
    }

    // COGNIÇÃO:
    // Objetivo "Controle da Ingestão" ou "Foco Mental" -> 14/10 ou 16/8
    const isCognition = /(?:foco mental|cognicao|controle da ingestao|clareza mental)/i.test(patientGoal);
    if (isCognition && !isAutophagy && !(totalEnergy > 3000 && isLeanMassPreservation)) {
      if (!/14[:/]10|16[:/]8/i.test(typeStr)) {
        typeStr = '16/8';
        fastingHours = 16;
      }
    }

    // ── 3. REGRAS DE ALOCAÇÃO OPERACIONAL E MAPEAMENTO PARA ÍNDICES (0 a 6) ──
    const dayMap = {
      'domingo': 0, 'dom': 0, 'dia 7': 0,
      'segunda': 1, 'seg': 1, 'dia 1': 1,
      'terca': 2, 'terça': 2, 'ter': 2, 'dia 2': 2,
      'quarta': 3, 'qua': 3, 'dia 3': 3,
      'quinta': 4, 'qui': 4, 'dia 4': 4,
      'sexta': 5, 'sex': 5, 'dia 5': 5,
      'sabado': 6, 'sábado': 6, 'sab': 6, 'dia 6': 6
    };

    let activeDays = [];
    allocatedDays.forEach(d => {
      const lower = normalizeText(String(d));
      for (const key of Object.keys(dayMap)) {
        if (lower.includes(key)) {
          activeDays.push(dayMap[key]);
          break;
        }
      }
    });
    activeDays = [...new Set(activeDays)].sort((a, b) => a - b);

    if (activeDays.length === 0) {
      if (frequencyPerWeek >= 7) activeDays = [0, 1, 2, 3, 4, 5, 6];
      else if (frequencyPerWeek === 6) activeDays = [1, 2, 3, 4, 5, 6];
      else if (frequencyPerWeek === 5) activeDays = [1, 2, 3, 4, 5];
      else if (frequencyPerWeek === 4) activeDays = [1, 2, 4, 5];
      else if (frequencyPerWeek === 3) activeDays = [1, 3, 5];
      else if (frequencyPerWeek === 2) activeDays = [2, 4];
      else activeDays = [0];
    }

    let canonicalType = 'TRE';
    let canonicalSubtype = '16:8';
    let defaultWindow = [{ start: '12:00', end: '20:00' }];

    if (/12[:/]12/i.test(typeStr)) {
      canonicalType = 'TRE';
      canonicalSubtype = '12:12';
      defaultWindow = [{ start: '08:00', end: '20:00' }];
    } else if (/14[:/]10/i.test(typeStr)) {
      canonicalType = 'TRE';
      canonicalSubtype = '14:10';
      defaultWindow = [{ start: '10:00', end: '20:00' }];
    } else if (/18[:/]6/i.test(typeStr)) {
      canonicalType = 'TRE';
      canonicalSubtype = '18:6';
      defaultWindow = [{ start: '12:00', end: '18:00' }];
    } else if (/20[:/]4/i.test(typeStr)) {
      canonicalType = 'TRE';
      canonicalSubtype = '20:4';
      defaultWindow = [{ start: '14:00', end: '18:00' }];
    } else if (/omad|23[:/]1/i.test(typeStr)) {
      canonicalType = 'OMAD';
      canonicalSubtype = 'OMAD';
      defaultWindow = [{ start: '18:00', end: '19:00' }];
    } else if (/24h|eat-stop-eat/i.test(typeStr)) {
      canonicalType = 'EXTENDED';
      canonicalSubtype = 'CUSTOM';
      defaultWindow = [{ start: '20:00', end: '20:00' }];
    }

    if (!clinicalJustification) {
      clinicalJustification = `Protocolo ${canonicalSubtype} alinhado aos objetivos metabólicos e rotina de treinos.`;
    }

    const normalizeObjectiveCode = (code) => {
      if (!code || typeof code !== 'string') return null;
      const c = code.trim().toUpperCase();
      if (c === 'FAT_LOSS' || c.includes('GORDURA')) return 'FAT_LOSS';
      if (c === 'BODY_COMPOSITION' || c.includes('RECOMPOSICAO') || c.includes('RECOMPOSIÇÃO')) return 'BODY_COMPOSITION';
      if (c === 'CALORIC_CONTROL' || c.includes('INGESTAO') || c.includes('INGESTÃO')) return 'CALORIC_CONTROL';
      if (c === 'LEAN_MASS_PRESERVATION' || c.includes('MASSA MAGRA') || c.includes('PRESERVACAO') || c.includes('PRESERVAÇÃO') || c.includes('MM')) return 'LEAN_MASS_PRESERVATION';
      if (c === 'GLUCOSE_CONTROL' || c.includes('GLICEMICO') || c.includes('GLICÊMICO') || c.includes('GLICOSE')) return 'GLUCOSE_CONTROL';
      if (c === 'INSULIN_SENSITIVITY' || c.includes('INSULINA')) return 'INSULIN_SENSITIVITY';
      if (c === 'CARDIOVASCULAR_HEALTH' || c.includes('CARDIOVASCULAR') || c.includes('CORACAO') || c.includes('CORAÇÃO')) return 'CARDIOVASCULAR_HEALTH';
      if (c === 'LIPID_PROFILE' || c.includes('LIPIDICO') || c.includes('LIPÍDICO') || c.includes('COLESTEROL')) return 'LIPID_PROFILE';
      if (c === 'AUTOPHAGY' || c.includes('AUTOFAGICO') || c.includes('AUTOFÁGICO') || c.includes('AUTOFAGIA')) return 'AUTOPHAGY';
      if (c === 'MENTAL_FOCUS' || c.includes('FOCO') || c.includes('CLAREZA') || c.includes('COGNITIVO')) return 'MENTAL_FOCUS';
      return null;
    };

    // Objetivos Clínicos Estruturados derivados da prescrição e do contexto do paciente
    let rawObjs = Array.isArray(rawProto.objectives) ? rawProto.objectives.map(normalizeObjectiveCode).filter(Boolean) : [];
    let objectives = [...rawObjs];
    if (objectives.length === 0) {
      if (isFatLoss || rcEst >= 0.50 || /16[:/]8/i.test(canonicalSubtype)) {
        objectives.push('FAT_LOSS');
        objectives.push('INSULIN_SENSITIVITY');
        objectives.push('GLUCOSE_CONTROL');
        if (rcEst >= 0.50) objectives.push('CARDIOVASCULAR_HEALTH');
      }
      if (isLeanMassPreservation || totalEnergy > 3000) {
        objectives.push('LEAN_MASS_PRESERVATION');
        objectives.push('BODY_COMPOSITION');
      }
      if (isAutophagy || /omad|24h/i.test(canonicalSubtype)) {
        objectives.push('AUTOPHAGY');
      }
      if (isCognition) {
        objectives.push('MENTAL_FOCUS');
        objectives.push('CALORIC_CONTROL');
      }
    }
    objectives = [...new Set(objectives)];

    return {
      isValid: errors.length === 0,
      status: circuitBreakers.length > 0 ? 'CORRECTED' : 'APPROVED',
      circuitBreakersTriggered: circuitBreakers,
      errors,
      warnings,
      sanitizedProtocol: {
        type: canonicalType,
        subtype: canonicalSubtype,
        frequencyPerWeek,
        allocatedDays,
        activeDays,
        feedingWindows: defaultWindow,
        clinicalJustification,
        warningSafety: warningSafety || null,
        objectives: objectives.length > 0 ? objectives : ['FAT_LOSS', 'INSULIN_SENSITIVITY']
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8. EXPOSIÇÃO GLOBAL DO MÓDULO (BROWSER & NODE.JS / COMMONJS)
  // ─────────────────────────────────────────────────────────────────────────

  const NutriAxFasting = {
    PROTOCOL_TYPES,
    PROTOCOL_SUBTYPES,
    PROTOCOL_OBJECTIVES,
    SEVERITY_LEVELS,
    PROTOCOL_STATUS,
    ADHERENCE_STATUS,
    normalizeText,
    extractClinicalRiskSignals,
    evaluateFastingEligibility,
    createFastingProtocol,
    computeFastingState,
    saveFastingProtocol,
    loadFastingProtocol,
    saveFastingLog,
    loadFastingLogs,
    syncPendingFastingLogs,
    validateAIFastingPrescription
  };

  // Exposição universal
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NutriAxFasting;
  }
  if (typeof window !== 'undefined') {
    window.NutriAxFasting = NutriAxFasting;
  }
  global.NutriAxFasting = NutriAxFasting;

})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
