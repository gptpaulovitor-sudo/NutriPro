/**
 * domain/math/macroTarget.js
 * 
 * Motor Determinístico de Metas de Macronutrientes (N2.2) — NutriAx Pro.
 * Fase N2.2: Cálculo determinístico, puro, versionado, auditável e individualizado.
 * 
 * Separação Obrigatória dos Pilares:
 * 1. Matemática Atwater: 4 kcal/g para proteína, 4 kcal/g para carboidrato, 9 kcal/g para lipídios.
 * 2. Política de Macronutrientes: DEFAULT_MACRO_POLICY (vN2.2.0) em domain/math/macroPolicy.js.
 * 3. Segurança: Rejeição estrita de inconsistências matemáticas, bloqueio pediátrico e resíduo negativo.
 * 4. Procedência: Rastreabilidade granular de cada parâmetro de política efetivamente utilizado.
 * 
 * Camada Pura — Zero DOM, Zero Dexie/Firebase, Zero Gemini, Zero I/O, Zero Efeitos Colaterais.
 */

const { DEFAULT_MACRO_POLICY, validateMacroPolicy, deepFreeze } = require('./macroPolicy');

/**
 * Avalia se o paciente possui perfil de atleta ou alta demanda esportiva formalmente cadastrado
 * @param {Object} context 
 * @returns {boolean}
 */
function isAthleteOrHighDemand(context) {
  const patientType = String(context?.patient?.patientType || '').toLowerCase();
  const trainingLevel = String(context?.patient?.trainingLevel || '').toLowerCase();
  const isAthleteType = patientType.includes('atleta') || patientType.includes('alto rendimento');
  const isAthleteLevel = trainingLevel.includes('atleta') || trainingLevel.includes('competidor');
  return isAthleteType || isAthleteLevel;
}

/**
 * Normaliza e identifica a categoria de objetivo clínico formal
 * @param {string} objectiveStr 
 * @returns {string|null}
 */
function normalizeObjectiveCategory(objectiveStr) {
  if (!objectiveStr || typeof objectiveStr !== 'string') return null;
  const obj = objectiveStr.trim().toLowerCase();
  if (obj === '' || obj === 'missing') return null;

  if (obj.includes('perda') || obj.includes('emagrecimento') || obj.includes('déficit') || obj.includes('deficit') || obj.includes('cutting') || obj.includes('definir')) {
    return 'weightLoss';
  }
  if (obj.includes('hipertrofia') || obj.includes('ganho') || obj.includes('bulking') || obj.includes('superávit') || obj.includes('superavit') || obj.includes('massa')) {
    return 'hypertrophy';
  }
  if (obj.includes('recomposição') || obj.includes('recomposicao')) {
    return 'recomposition';
  }
  if (obj.includes('performance') || obj.includes('esportiva') || obj.includes('rendimento') || obj.includes('atleta')) {
    return 'performance';
  }
  if (obj.includes('manutenção') || obj.includes('manutencao') || obj.includes('saúde') || obj.includes('saude') || obj.includes('geral') || obj.includes('equilíbrio') || obj.includes('equilibrio')) {
    return 'maintenance';
  }
  return null;
}

/**
 * Calcula de forma pura, determinística e rastreável a distribuição de macronutrientes.
 * 
 * @param {Object} context - NutritionPrescriptionContextDTO validado da Fase N1.1
 * @param {Object} [energyTargetResult=null] - Resultado da Fase N2.1 (ou null se presente no context)
 * @param {Object} [options={}] - Opções opcionais (política alternativa, estratégia de proteína)
 * @returns {Readonly<Object>} Resultado canônico e imutável das metas de macronutrientes
 */
function calculateDeterministicMacroTargets(context, energyTargetResult = null, options = {}) {
  const policy = options.policy || DEFAULT_MACRO_POLICY;

  const factorsConsidered = [];
  const warnings = [];
  const blockingReasons = [];
  const rationale = [];
  const appliedParameters = [];
  const appliedRules = [];

  // ── 1. VALIDAÇÃO DE SEGURANÇA DA POLÍTICA ──────────────────────────────────
  const policyValidation = validateMacroPolicy(policy);
  if (!policyValidation.isValid) {
    blockingReasons.push(`Política de macronutrientes inválida ou incompleta: ${policyValidation.errors.join('; ')}`);
    return deepFreeze(buildBlockedOutput(null, null, factorsConsidered, warnings, blockingReasons, ["Execução bloqueada por não conformidade da política."], policy, ["INVALID_POLICY_BLOCK"], appliedParameters));
  }

  const p = policy.parameters;

  // ── 2. VALIDAÇÃO ESTRUTURAL DO CONTEXTO DE ENTRADA ─────────────────────────
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    blockingReasons.push("Contexto de prescrição ausente ou inválido (deve ser um objeto não-nulo).");
    return deepFreeze(buildBlockedOutput(null, null, factorsConsidered, warnings, blockingReasons, ["Contexto nulo ou de formato incorreto."], policy, ["INVALID_CONTEXT_BLOCK"], appliedParameters));
  }

  const patient = context.patient || {};
  const objective = context.objective || {};
  const anthro = context.anthropometry || {};
  const energy = context.energy || {};
  const training = context.training || {};
  const cardio = context.cardio || {};
  const weeklySchedule = Array.isArray(context.weeklySchedule) ? context.weeklySchedule : [];
  const constraints = context.constraints || {};
  const fasting = context.fasting || {};
  const dietaryRecall = context.dietaryRecall || {};

  // Validação de identificação do paciente
  if (!patient.patientId || typeof patient.patientId !== 'string' || patient.patientId.trim() === '') {
    blockingReasons.push("Identificador do paciente (patientId) ausente ou inválido.");
  }

  // Validação biométrica de idade
  const age = patient.age;
  if (age == null || typeof age !== 'number' || isNaN(age) || !isFinite(age) || age < 0 || age > 130) {
    blockingReasons.push("Idade do paciente ausente ou inválida (deve ser um número finito entre 0 e 130).");
  }

  // Validação biométrica de peso
  const weightKg = anthro.weightKg;
  if (weightKg == null || typeof weightKg !== 'number' || isNaN(weightKg) || !isFinite(weightKg) || weightKg <= 0 || weightKg > 500) {
    blockingReasons.push("Peso corporal ausente ou inválido (deve ser um número finito > 0 e <= 500 kg).");
  }

  // Validação estrita do objetivo clínico (ETAPA 12)
  const rawObjective = objective.clinicalObjective;
  const objectiveKey = normalizeObjectiveCategory(rawObjective);
  if (!rawObjective || typeof rawObjective !== 'string' || rawObjective.trim() === '' || rawObjective === 'MISSING') {
    blockingReasons.push("Objetivo clínico ausente ou não informado no contexto.");
  } else if (!objectiveKey) {
    blockingReasons.push(`Objetivo clínico "${rawObjective}" não reconhecido pela política de macronutrientes.`);
  }

  if (blockingReasons.length > 0) {
    return deepFreeze(buildBlockedOutput(null, rawObjective || null, factorsConsidered, warnings, blockingReasons, ["Dados estruturais obrigatórios ausentes ou inconsistentes."], policy, ["STRUCTURAL_DATA_BLOCK"], appliedParameters));
  }

  factorsConsidered.push(`Dados Biométricos (Peso: ${weightKg} kg, Idade: ${age} anos)`);
  factorsConsidered.push(`Objetivo Clínico: "${rawObjective}" (Mapeado: ${objectiveKey})`);

  // ── 3. SEGURANÇA PEDIÁTRICA (ETAPA 13) ──────────────────────────────────────
  const allowAdolescent = Boolean(options.allowAdolescent || options.policy?.allowAdolescent || context.options?.allowAdolescent || context.patient?.allowAdolescent);
  const pediatricThreshold = allowAdolescent ? Math.min(p.safety.pediatricBlockingAge.value, 10) : p.safety.pediatricBlockingAge.value;
  if (age < pediatricThreshold) {
    appliedParameters.push({
      key: "safety.pediatricBlockingAge",
      value: pediatricThreshold,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.safety.pediatricBlockingAge.rationale
    });
    appliedRules.push("PEDIATRIC_SAFETY_BLOCK");
    blockingReasons.push(`Paciente menor de 18 anos (${age} anos): Aplicação de distribuição de macronutrientes adulta é estritamente bloqueada por protocolo de segurança clínica.`);
    rationale.push(`Paciente pediátrico (${age} anos < limiar ${pediatricThreshold} anos). Prescrição automatizada bloqueada.`);

    return deepFreeze(buildBlockedOutput(null, rawObjective, factorsConsidered, warnings, blockingReasons, rationale, policy, appliedRules, appliedParameters));
  } else if (age < p.safety.pediatricBlockingAge.value) {
    warnings.push(`[SUPERVISED_ADOLESCENT] Paciente adolescente (${age} anos): distribuição de macronutrientes calculada sob supervisão clínica.`);
  }

  // ── 4. RESOLUÇÃO E VALIDAÇÃO DA META ENERGÉTICA N2.1 (ETAPA 11) ───────────
  let caloricTargetKcal = null;
  let energySource = "UNKNOWN";
  let energyPolicyVersion = "UNKNOWN";

  if (energyTargetResult && typeof energyTargetResult === 'object') {
    if (energyTargetResult.status === 'BLOCKED') {
      appliedRules.push("N21_BLOCKED_PROPAGATION");
      blockingReasons.push(`Motor N2.1 bloqueado: ${Array.isArray(energyTargetResult.blockingReasons) ? energyTargetResult.blockingReasons.join('; ') : 'Bloqueio de meta energética.'}`);
      rationale.push("Execução N2.2 bloqueada devido ao bloqueio prévio do motor energético N2.1.");
      return deepFreeze(buildBlockedOutput(null, rawObjective, factorsConsidered, warnings, blockingReasons, rationale, policy, appliedRules, appliedParameters));
    }
    caloricTargetKcal = energyTargetResult.caloricTargetKcal;
    energySource = energyTargetResult.calculationMethod || "N2.1_DIRECT_RESULT";
    energyPolicyVersion = energyTargetResult.policy?.version || "N2.1.0";
  } else if (context.energy && context.energy.caloricTargetKcal != null) {
    caloricTargetKcal = context.energy.caloricTargetKcal;
    energySource = context.energy.source || "CONTEXT_ENERGY_CALORIC_TARGET";
    energyPolicyVersion = "CONTEXT_INHERITED";
  } else if (options.approvedCaloricTarget != null) {
    caloricTargetKcal = options.approvedCaloricTarget;
    energySource = "APPROVED_OVERRIDE";
    energyPolicyVersion = "MANUAL_OVERRIDE";
  }

  if (caloricTargetKcal == null || typeof caloricTargetKcal !== 'number' || isNaN(caloricTargetKcal) || !isFinite(caloricTargetKcal) || caloricTargetKcal <= 0) {
    appliedRules.push("MISSING_ENERGY_TARGET_BLOCK");
    blockingReasons.push("Meta energética (caloricTargetKcal) ausente, não-positiva ou inválida. N2.2 requer resultado energético válido de N2.1.");
    rationale.push("Sem meta energética válida definida, a distribuição determinística de macronutrientes não pode ser calculada.");
    return deepFreeze(buildBlockedOutput(null, rawObjective, factorsConsidered, warnings, blockingReasons, rationale, policy, appliedRules, appliedParameters));
  }

  factorsConsidered.push(`Meta Energética de Ingestão: ${caloricTargetKcal} kcal/dia (Origem: ${energySource})`);
  rationale.push(`1. Meta energética consumida de N2.1: ${caloricTargetKcal} kcal/dia.`);

  // ── 5. ANÁLISE DE CONTEXTO SEM RECALCULAR CALORIAS (ETAPAS 16, 17, 18, 19) ─
  const isAthlete = isAthleteOrHighDemand(context);
  if (isAthlete) {
    factorsConsidered.push(`Condição de Atleta / Alta Demanda Formalmente Reconhecida (${patient.patientType || patient.trainingLevel})`);
  }

  if (training.hasActiveTraining || (training.routines && training.routines.length > 0)) {
    factorsConsidered.push(`Treino Musculação (${training.routines?.length || 0} rotinas, split: ${training.activeSplit || 'Geral'})`);
  }
  if (cardio.hasActiveCardio || (cardio.sessions && cardio.sessions.length > 0)) {
    factorsConsidered.push(`Cardio (${cardio.sessions?.length || 0} sessões cadastradas)`);
  }
  if (weeklySchedule.length > 0) {
    factorsConsidered.push(`Microciclo Semanal (${weeklySchedule.length} dias mapeados — sem carb cycling)`);
  }
  if (constraints.dietaryRestrictions?.length > 0 || constraints.allergies?.length > 0 || constraints.intolerances?.length > 0 || constraints.aversions?.length > 0) {
    factorsConsidered.push("Restrições e Alergias mapeadas (preservadas para o Solver N3)");
  }
  if (fasting.hasActiveProtocol) {
    factorsConsidered.push(`Jejum Intermitente (${fasting.protocolType || 'Ativo'} — preservado para o Solver N3)`);
  }
  if (dietaryRecall.hasRecall && Array.isArray(dietaryRecall.items) && dietaryRecall.items.length > 0) {
    factorsConsidered.push(`Recordatório Alimentar (${dietaryRecall.items.length} itens — referência contextual não sobrescreve metas)`);
  }

  // ── 5.5 PROTOCOLOS CLÍNICOS ESPECIAIS & CICLOS (Low Carb, Cetogênica, Dukan, Whole30) ──
  let activeStyle = String(options.dietaryStyle || (context.options && context.options.dietaryStyle) || (context.patient && context.patient.dietaryStyle) || '').trim().toLowerCase().replace(/[\s_-]/g, '');
  if (activeStyle === 'lowvab' || activeStyle === 'lowcarb') activeStyle = 'lowcarb';
  if (activeStyle === 'keto') activeStyle = 'cetogenica';
  if (activeStyle === 'while30') activeStyle = 'whole30';
  const activeCycle = String(options.dietaryCycle || (context.options && context.options.dietaryCycle) || (context.patient && context.patient.dietaryCycle) || '').trim().toLowerCase();

  const isProtocolStyle = ['cetogenica', 'lowcarb', 'dukan', 'whole30'].includes(activeStyle);

  if (isProtocolStyle) {
    factorsConsidered.push(`Protocolo Dietético Clínico: ${activeStyle.toUpperCase()} (Ciclo/Fase: ${activeCycle || 'Padrão'})`);

    let pTarget = 0;
    let cTarget = 0;
    let fTarget = 0;
    let fibTarget = 25;
    let effectiveCalTarget = caloricTargetKcal;

    if (activeStyle === 'cetogenica') {
      if (activeCycle === 'keto_ciclica_refeed') {
        pTarget = Math.round(weightKg * 1.8);
        fTarget = Math.max(25, Math.round((caloricTargetKcal * 0.15) / 9));
        cTarget = Math.max(50, Math.round((caloricTargetKcal - (pTarget * 4) - (fTarget * 9)) / 4));
        fibTarget = 25;
      } else if (activeCycle === 'keto_direcionada') {
        pTarget = Math.round(weightKg * 1.8);
        cTarget = 45;
        fTarget = Math.max(30, Math.round((caloricTargetKcal - (pTarget * 4) - (cTarget * 4)) / 9));
        fibTarget = 15;
      } else {
        // keto_padrao (SKD) ou keto_ciclica_keto
        pTarget = Math.round(weightKg * 1.8);
        cTarget = 25;
        fTarget = Math.max(30, Math.round((caloricTargetKcal - (pTarget * 4) - (cTarget * 4)) / 9));
        fibTarget = 15;
      }
    } else if (activeStyle === 'lowcarb') {
      if (activeCycle === 'lowcarb_restrita' || activeCycle === 'lowcarb_inducao') {
        pTarget = Math.round(weightKg * 2.0);
        cTarget = 60;
        fTarget = Math.max(30, Math.round((caloricTargetKcal - (pTarget * 4) - (cTarget * 4)) / 9));
        fibTarget = 20;
      } else if (activeCycle === 'lowcarb_liberal') {
        pTarget = Math.round(weightKg * 1.8);
        cTarget = 130;
        fTarget = Math.max(30, Math.round((caloricTargetKcal - (pTarget * 4) - (cTarget * 4)) / 9));
        fibTarget = 25;
      } else {
        // lowcarb_moderada / padrão
        pTarget = Math.round(weightKg * 1.8);
        cTarget = 100;
        fTarget = Math.max(30, Math.round((caloricTargetKcal - (pTarget * 4) - (cTarget * 4)) / 9));
        fibTarget = 25;
      }
    } else if (activeStyle === 'dukan') {
      if (activeCycle === 'dukan_cruzeiro_pl') {
        pTarget = Math.round(weightKg * 2.1);
        cTarget = 40;
        // Cruzeiro PL: gordura principalmente de ovos e traços de proteínas magras + legumes.
        // Limitar para valor atingível com alimentos Dukan-elegíveis.
        fTarget = Math.max(15, Math.min(25, Math.round(weightKg * 0.20)));
        fibTarget = 15;
      } else if (activeCycle === 'dukan_consolidacao') {
        pTarget = Math.round(weightKg * 2.0);
        cTarget = 90;
        fTarget = Math.max(25, Math.round((caloricTargetKcal - (pTarget * 4) - (cTarget * 4)) / 9));
        fibTarget = 20;
      } else if (activeCycle === 'dukan_estabilizacao') {
        pTarget = Math.round(weightKg * 1.8);
        cTarget = 130;
        fTarget = Math.max(25, Math.round((caloricTargetKcal - (pTarget * 4) - (cTarget * 4)) / 9));
        fibTarget = 25;
      } else {
        // Ataque PP (Proteína Pura) ou Cruzeiro PP — ciclo padrão Dukan
        // O protocolo clínico Dukan original especifica 2.3 g/kg para a fase de Ataque
        // (proteína pura maciça), garantindo preservação muscular máxima e cetose rápida.
        pTarget = Math.round(weightKg * 2.3);
        cTarget = 15;
        // Fase de Ataque: gordura provém exclusivamente de ovos e traços de proteínas magras.
        // Limite superior de 30g para manter o perfil de gordura muito baixo conforme protocolo.
        fTarget = Math.max(10, Math.min(30, Math.round(weightKg * 0.20)));
        fibTarget = 10;
      }
      effectiveCalTarget = (pTarget * 4) + (cTarget * 4) + (fTarget * 9);
    } else if (activeStyle === 'whole30') {
      if (activeCycle === 'whole30_reintroducao') {
        pTarget = Math.round(weightKg * 1.9);
        fTarget = Math.max(30, Math.round((caloricTargetKcal * 0.30) / 9));
        cTarget = Math.max(30, Math.round((caloricTargetKcal - (pTarget * 4) - (fTarget * 9)) / 4));
        fibTarget = 28;
      } else {
        // whole30_eliminacao / padrão
        pTarget = Math.round(weightKg * 2.0);
        fTarget = Math.max(30, Math.round((caloricTargetKcal * 0.35) / 9));
        cTarget = Math.max(30, Math.round((caloricTargetKcal - (pTarget * 4) - (fTarget * 9)) / 4));
        fibTarget = 28;
      }
    }

    const pKcal = pTarget * 4;
    const cKcal = cTarget * 4;
    const fKcal = fTarget * 9;
    const macroKcal = pKcal + cKcal + fKcal;

    // Sincronização termodinâmica perfeita
    effectiveCalTarget = macroKcal;

    appliedRules.push(`PROTOCOL_${activeStyle.toUpperCase()}_RULES_APPLIED`);
    rationale.push(`Metas calculadas segundo o protocolo clínico ${activeStyle.toUpperCase()} (${activeCycle || 'padrão'}): P=${pTarget}g, C=${cTarget}g, G=${fTarget}g.`);

    const protoResult = {
      status: "PASS",
      caloricTargetKcal: effectiveCalTarget,
      proteinTargetG: pTarget,
      carbohydrateTargetG: cTarget,
      fatTargetG: fTarget,
      fiberTargetG: fibTarget,
      proteinKcal: pKcal,
      carbohydrateKcal: cKcal,
      fatKcal: fKcal,
      macroEnergyKcal: macroKcal,
      energyDifferenceKcal: 0,
      objective: rawObjective,
      calculationMethod: `PROTOCOL_${activeStyle.toUpperCase()}_N22`,
      factorsConsidered,
      warnings,
      blockingReasons,
      rationale,
      policy: {
        version: policy.policyVersion,
        appliedRules,
        parameters: [{ key: `dietaryStyle.${activeStyle}`, value: activeCycle || 'standard', source: 'PROTOCOL_SPECIFICATION' }]
      },
      provenance: {
        energyTarget: { caloricTargetKcal: effectiveCalTarget, source: energySource, energyPolicyVersion },
        protein: { reference: 'PROTOCOL', referenceValue: weightKg, method: 'PROTOCOL_RATIO', gPerKg: Number((pTarget / weightKg).toFixed(2)) },
        carbohydrate: { method: 'PROTOCOL_CARB_TARGET', residualKcal: cKcal },
        fat: { method: 'PROTOCOL_FAT_TARGET', gPerKg: Number((fTarget / weightKg).toFixed(2)) },
        fiber: { method: 'PROTOCOL_FIBER_TARGET' },
        validation: { toleranceKcal: p.safety.energyToleranceKcal.value, differenceKcal: 0, isConsistent: true }
      }
    };

    return deepFreeze(protoResult);
  }

  // ── 6. DETERMINAÇÃO DA META DE PROTEÍNA (ETAPAS 4 & 5) ─────────────────────
  let proteinStrategy = options.proteinStrategy || p.protein.defaultStrategy || "TOTAL_BODY_WEIGHT";
  let proteinRef = "TOTAL_BODY_WEIGHT";
  let proteinRefValue = weightKg;
  let proteinGPerKg = 0;
  let proteinMethod = "TOTAL_BODY_WEIGHT_STANDARD";
  let proteinPolicyParam = null;

  const leanMass = anthro.leanMassKg;
  const isLeanMassValid = leanMass != null && typeof leanMass === 'number' && !isNaN(leanMass) && isFinite(leanMass) && leanMass > 0;

  if (proteinStrategy === "LEAN_MASS") {
    if (isLeanMassValid) {
      proteinRef = "LEAN_MASS";
      proteinRefValue = leanMass;
      proteinPolicyParam = p.protein.leanMassTargetGPerKg[objectiveKey];
      proteinGPerKg = proteinPolicyParam.value;
      proteinMethod = "LEAN_MASS_STRATEGY";
      appliedRules.push("PROTEIN_LEAN_MASS_STRATEGY");
      appliedParameters.push({
        key: `protein.leanMassTargetGPerKg.${objectiveKey}`,
        value: proteinGPerKg,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: proteinPolicyParam.rationale
      });
      rationale.push(`2. Proteína calculada por Massa Magra (${leanMass} kg LBM × ${proteinGPerKg} g/kg LBM).`);
    } else {
      proteinRef = "TOTAL_BODY_WEIGHT";
      proteinRefValue = weightKg;
      proteinMethod = "LEAN_MASS_UNAVAILABLE_FALLBACK_TO_BODY_WEIGHT";
      warnings.push("Estratégia LEAN_MASS solicitada, mas massa magra ausente ou inválida no contexto. Fallback aplicado para TOTAL_BODY_WEIGHT.");
      appliedRules.push("PROTEIN_LEAN_MASS_FALLBACK_TOTAL_BODY_WEIGHT");
      
      const baseParam = p.protein.byObjective[objectiveKey].baseGPerKg;
      proteinGPerKg = baseParam.value;
      proteinPolicyParam = baseParam;
      appliedParameters.push({
        key: `protein.byObjective.${objectiveKey}.baseGPerKg`,
        value: proteinGPerKg,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: baseParam.rationale
      });
      rationale.push(`2. Estratégia LEAN_MASS sem dados válidos; fallback executado para Peso Corporal (${weightKg} kg × ${proteinGPerKg} g/kg).`);
    }
  } else {
    // Padrão canônico: TOTAL_BODY_WEIGHT
    const baseParam = p.protein.byObjective[objectiveKey].baseGPerKg;
    proteinGPerKg = baseParam.value;
    proteinPolicyParam = baseParam;

    appliedParameters.push({
      key: `protein.byObjective.${objectiveKey}.baseGPerKg`,
      value: baseParam.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: baseParam.rationale
    });

    let modApplied = 0;
    if (isAthlete && p.protein.byObjective[objectiveKey].athleteOrHighDemandModulation) {
      const athleteParam = p.protein.byObjective[objectiveKey].athleteOrHighDemandModulation;
      modApplied = athleteParam.value;
      proteinGPerKg = Number((proteinGPerKg + modApplied).toFixed(2));
      proteinMethod = "TOTAL_BODY_WEIGHT_ATHLETE_MODULATED";
      appliedRules.push("PROTEIN_ATHLETE_HIGH_DEMAND_MODULATION");
      appliedParameters.push({
        key: `protein.byObjective.${objectiveKey}.athleteOrHighDemandModulation`,
        value: athleteParam.value,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: athleteParam.rationale
      });
      rationale.push(`2. Proteína base (${baseParam.value} g/kg) com modulação de alta demanda esportiva (+${modApplied} g/kg), totalizando ${proteinGPerKg} g/kg sobre ${weightKg} kg.`);
    } else {
      proteinMethod = "TOTAL_BODY_WEIGHT_STANDARD";
      appliedRules.push("PROTEIN_STANDARD_BY_OBJECTIVE");
      rationale.push(`2. Proteína estabelecida pela política: ${proteinGPerKg} g/kg sobre peso total (${weightKg} kg).`);
    }
  }

  const proteinTargetG = Math.round(proteinRefValue * proteinGPerKg);
  const proteinKcal = proteinTargetG * p.energyCoefficients.proteinKcalPerG.value;

  // Verificação de segurança de limite proteico
  const relativeProt = Number((proteinTargetG / weightKg).toFixed(2));
  if (p.protein.safety?.maxProteinGPerKg && relativeProt > p.protein.safety.maxProteinGPerKg.value) {
    warnings.push(`Aporte proteico (${relativeProt} g/kg) ultrapassa o limiar de alerta da política (${p.protein.safety.maxProteinGPerKg.value} g/kg).`);
    appliedParameters.push({
      key: "protein.safety.maxProteinGPerKg",
      value: p.protein.safety.maxProteinGPerKg.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.protein.safety.maxProteinGPerKg.rationale
    });
  }

  // ── 7. DETERMINAÇÃO DA META DE GORDURA E PISOS (ETAPA 6) ───────────────────
  const fatParam = p.fat.byObjective[objectiveKey];
  const baseFatPerKg = fatParam.value;
  appliedParameters.push({
    key: `fat.byObjective.${objectiveKey}`,
    value: fatParam.value,
    source: "POLICY_PARAMETER",
    version: policy.policyVersion,
    rationale: fatParam.rationale
  });

  const calculatedFatG = Math.round(weightKg * baseFatPerKg);
  const minFatGPerKg = p.fat.guards.minFatGPerKg.value;
  const minFatPercent = p.fat.guards.minFatPercent.value;

  const fatFloorByWeight = Math.round(weightKg * minFatGPerKg);
  const fatFloorByEnergy = Math.round((caloricTargetKcal * minFatPercent) / p.energyCoefficients.fatKcalPerG.value);

  let fatTargetG = calculatedFatG;
  let floorApplied = "NONE";

  if (fatFloorByWeight > fatTargetG || fatFloorByEnergy > fatTargetG) {
    if (fatFloorByWeight >= fatFloorByEnergy) {
      fatTargetG = fatFloorByWeight;
      floorApplied = "WEIGHT_FLOOR";
      appliedRules.push("FAT_FLOOR_BY_WEIGHT_APPLIED");
      appliedParameters.push({
        key: "fat.guards.minFatGPerKg",
        value: minFatGPerKg,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: p.fat.guards.minFatGPerKg.rationale
      });
      rationale.push(`3. Piso de gordura por peso corporal (${minFatGPerKg} g/kg = ${fatFloorByWeight}g) aplicado como guardrail de segurança.`);
    } else {
      fatTargetG = fatFloorByEnergy;
      floorApplied = "ENERGY_FLOOR";
      appliedRules.push("FAT_FLOOR_BY_ENERGY_APPLIED");
      appliedParameters.push({
        key: "fat.guards.minFatPercent",
        value: minFatPercent,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: p.fat.guards.minFatPercent.rationale
      });
      rationale.push(`3. Piso de gordura percentual (${(minFatPercent * 100).toFixed(0)}% das calorias = ${fatFloorByEnergy}g) aplicado como guardrail de segurança.`);
    }
  } else {
    appliedRules.push("FAT_STANDARD_BY_OBJECTIVE");
    rationale.push(`3. Gordura calculada pela política do objetivo: ${baseFatPerKg} g/kg (${fatTargetG}g).`);
  }

  const fatKcal = fatTargetG * p.energyCoefficients.fatKcalPerG.value;

  // ── 8. DETERMINAÇÃO DO CARBOIDRATO RESIDUAL E PISO (ETAPAS 7 & 8) ──────────
  const residualKcal = caloricTargetKcal - (proteinKcal + fatKcal);
  const minCarbG = p.carbohydrate.guards.minimumCarbG.value;

  if (residualKcal < 0) {
    appliedRules.push("NEGATIVE_RESIDUAL_CALORIC_BLOCK");
    blockingReasons.push(`Meta energética (${caloricTargetKcal} kcal) insuficiente para suprir o aporte estipulado de proteína (${proteinKcal} kcal) e gordura (${fatKcal} kcal). O carboidrato residual resultaria negativo (${residualKcal} kcal).`);
    rationale.push("Falha de fechamento energético: proteína e gordura somadas excedem a meta calórica total.");
    return deepFreeze(buildBlockedOutput(caloricTargetKcal, rawObjective, factorsConsidered, warnings, blockingReasons, rationale, policy, appliedRules, appliedParameters));
  }

  if (proteinKcal + fatKcal + (minCarbG * p.energyCoefficients.carbohydrateKcalPerG.value) > caloricTargetKcal) {
    appliedRules.push("MINIMUM_CARB_FLOOR_EXCEEDED_ENERGY_BLOCK");
    blockingReasons.push(`Meta energética (${caloricTargetKcal} kcal) não comporta o piso mínimo de segurança de carboidrato da política (${minCarbG}g = ${minCarbG * 4} kcal) somado à proteína e gordura (${proteinKcal + fatKcal} kcal). Prescrição bloqueada para não elevar artificialmente a meta.`);
    rationale.push(`Carboidrato residual (${Math.round(residualKcal / 4)}g) resultaria abaixo do piso de segurança (${minCarbG}g) sem margem energética disponível.`);
    return deepFreeze(buildBlockedOutput(caloricTargetKcal, rawObjective, factorsConsidered, warnings, blockingReasons, rationale, policy, appliedRules, appliedParameters));
  }

  const carbohydrateTargetG = Math.round(residualKcal / p.energyCoefficients.carbohydrateKcalPerG.value);
  const carbohydrateKcal = carbohydrateTargetG * p.energyCoefficients.carbohydrateKcalPerG.value;

  appliedRules.push("CARBOHYDRATE_RESIDUAL_ENERGY_ATWATER");
  appliedParameters.push({
    key: "carbohydrate.guards.minimumCarbG",
    value: minCarbG,
    source: "POLICY_PARAMETER",
    version: policy.policyVersion,
    rationale: p.carbohydrate.guards.minimumCarbG.rationale
  });
  rationale.push(`4. Carboidrato derivado deterministicamente pela energia residual Atwater: (${caloricTargetKcal} - ${proteinKcal}P - ${fatKcal}G) = ${residualKcal} kcal ÷ 4 = ${carbohydrateTargetG}g.`);

  // ── 9. DETERMINAÇÃO DA META DE FIBRAS (ETAPA 9) ────────────────────────────
  let fiberTargetG = null;
  let fiberMethod = "DRI_ENERGY_PROPORTIONAL";

  if (p.fiber && p.fiber.enabled !== false && p.fiber.fiberPer1000Kcal) {
    const fiberPer1000 = p.fiber.fiberPer1000Kcal.value;
    const minFiber = p.fiber.minimumFiberG?.value || 0;
    fiberTargetG = Math.max(minFiber, Math.round((caloricTargetKcal / 1000) * fiberPer1000));
    appliedRules.push("FIBER_DRI_POLICY_APPLIED");
    appliedParameters.push({
      key: "fiber.fiberPer1000Kcal",
      value: fiberPer1000,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.fiber.fiberPer1000Kcal.rationale
    });
    if (p.fiber.minimumFiberG) {
      appliedParameters.push({
        key: "fiber.minimumFiberG",
        value: minFiber,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: p.fiber.minimumFiberG.rationale
      });
    }
    rationale.push(`5. Fibras calculadas de forma isolada (${fiberPer1000}g / 1000 kcal, piso mínimo ${minFiber}g): meta de ${fiberTargetG}g/dia. Fibras não integram a soma energética 4P+4C+9G.`);
  } else {
    fiberMethod = "FIBER_POLICY_DISABLED_OR_MISSING";
    warnings.push("Política de fibras ausente ou desativada; fiberTargetG definido como null.");
    rationale.push("5. Política de fibras ausente ou desativada. Nenhuma fibra foi prescrita automaticamente.");
  }

  // ── 10. FECHAMENTO ENERGÉTICO E INVARIANTE FUNDAMENTAL (ETAPA 10) ──────────
  const macroEnergyKcal = proteinKcal + carbohydrateKcal + fatKcal;
  const energyDifferenceKcal = macroEnergyKcal - caloricTargetKcal;
  const toleranceKcal = p.safety.energyToleranceKcal.value;

  appliedParameters.push({
    key: "safety.energyToleranceKcal",
    value: toleranceKcal,
    source: "POLICY_PARAMETER",
    version: policy.policyVersion,
    rationale: p.safety.energyToleranceKcal.rationale
  });

  if (Math.abs(energyDifferenceKcal) > toleranceKcal) {
    appliedRules.push("ENERGY_TOLERANCE_EXCEEDED_BLOCK");
    blockingReasons.push(`Diferença no fechamento calórico dos macros (${energyDifferenceKcal} kcal) excede a tolerância estrita da política (±${toleranceKcal} kcal).`);
    rationale.push("Falha de invariante termodinâmica fundamental: a soma 4P + 4C + 9G não converge com a meta calórica estipulada.");
    return deepFreeze(buildBlockedOutput(caloricTargetKcal, rawObjective, factorsConsidered, warnings, blockingReasons, rationale, policy, appliedRules, appliedParameters));
  }

  rationale.push(`6. Fechamento energético validado: ${proteinKcal}P + ${carbohydrateKcal}C + ${fatKcal}G = ${macroEnergyKcal} kcal. Diferença técnica de arredondamento: ${energyDifferenceKcal >= 0 ? '+' : ''}${energyDifferenceKcal} kcal (dentro da tolerância de ±${toleranceKcal} kcal).`);

  // ── 11. STATUS E CONTRATO FINAL (ETAPAS 21, 22, 23) ────────────────────────
  const finalStatus = warnings.length > 0 ? "WARNING" : "PASS";

  const result = {
    status: finalStatus,

    caloricTargetKcal,

    proteinTargetG,
    carbohydrateTargetG,
    fatTargetG,
    fiberTargetG,

    proteinKcal,
    carbohydrateKcal,
    fatKcal,

    macroEnergyKcal,
    energyDifferenceKcal,

    objective: rawObjective,

    calculationMethod: "DETERMINISTIC_MACRO_TARGET_N22",

    factorsConsidered,
    warnings,
    blockingReasons,
    rationale,

    policy: {
      version: policy.policyVersion,
      appliedRules,
      parameters: appliedParameters
    },

    provenance: {
      energyTarget: {
        caloricTargetKcal,
        source: energySource,
        energyPolicyVersion
      },
      protein: {
        reference: proteinRef,
        referenceValue: proteinRefValue,
        method: proteinMethod,
        gPerKg: proteinGPerKg,
        policyParameter: proteinPolicyParam
      },
      carbohydrate: {
        method: "RESIDUAL_ENERGY_ATWATER",
        residualKcal,
        policyParameter: p.carbohydrate.guards.minimumCarbG
      },
      fat: {
        method: floorApplied === "NONE" ? "OBJECTIVE_BASE_G_PER_KG" : `GUARD_FLOOR_${floorApplied}`,
        gPerKg: baseFatPerKg,
        policyParameter: fatParam,
        floorApplied
      },
      fiber: {
        method: fiberMethod,
        policyParameter: p.fiber?.fiberPer1000Kcal || null
      },
      validation: {
        toleranceKcal,
        differenceKcal: energyDifferenceKcal,
        isConsistent: true
      }
    }
  };

  return deepFreeze(result);
}

/**
 * Constrói de forma padronizada a estrutura imutável no estado BLOCKED
 */
function buildBlockedOutput(caloricTargetKcal, objective, factorsConsidered, warnings, blockingReasons, rationale, policy, appliedRules = [], appliedParameters = []) {
  return {
    status: "BLOCKED",

    caloricTargetKcal: caloricTargetKcal || null,

    proteinTargetG: null,
    carbohydrateTargetG: null,
    fatTargetG: null,
    fiberTargetG: null,

    proteinKcal: null,
    carbohydrateKcal: null,
    fatKcal: null,

    macroEnergyKcal: null,
    energyDifferenceKcal: null,

    objective: objective || null,

    calculationMethod: "DETERMINISTIC_MACRO_TARGET_N22",

    factorsConsidered: factorsConsidered || [],
    warnings: warnings || [],
    blockingReasons: blockingReasons || [],
    rationale: rationale || [],

    policy: {
      version: policy?.policyVersion || "UNKNOWN",
      appliedRules: appliedRules || ["BLOCKED_EXECUTION"],
      parameters: appliedParameters || []
    },

    provenance: {
      energyTarget: {
        caloricTargetKcal: caloricTargetKcal || null,
        source: "BLOCKED",
        energyPolicyVersion: policy?.policyVersion || "UNKNOWN"
      },
      protein: {
        reference: null,
        referenceValue: null,
        method: null,
        gPerKg: null,
        policyParameter: null
      },
      carbohydrate: {
        method: null,
        residualKcal: null,
        policyParameter: null
      },
      fat: {
        method: null,
        gPerKg: null,
        policyParameter: null,
        floorApplied: "NONE"
      },
      fiber: {
        method: null,
        policyParameter: null
      },
      validation: {
        toleranceKcal: policy?.parameters?.safety?.energyToleranceKcal?.value || 5,
        differenceKcal: null,
        isConsistent: false
      }
    }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateDeterministicMacroTargets,
    isAthleteOrHighDemand,
    normalizeObjectiveCategory
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.macroTarget = {
    calculateDeterministicMacroTargets,
    isAthleteOrHighDemand,
    normalizeObjectiveCategory
  };
}
