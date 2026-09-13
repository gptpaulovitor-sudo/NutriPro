/**
 * domain/math/energyTarget.js
 * 
 * Motor Determinístico de Meta Energética (caloricTargetKcal) — NutriAx Pro.
 * Fase N2.1: Cálculo determinístico, puro, versionado, auditável e individualizado.
 * 
 * Separação Obrigatória dos Pilares:
 * 1. Matemática: Reutiliza calculateTMB e calculateGET de domain/math/nutritionMath.js.
 * 2. Política Energética: DEFAULT_ENERGY_POLICY (vN2.1.0) em domain/math/energyPolicy.js.
 * 3. Segurança: Rejeição de inconsistências matemáticas e bloqueio estrito para menores de 18 anos.
 * 4. Procedência: Rastreabilidade granular de cada parâmetro de política efetivamente utilizado.
 * 
 * Camada Pura — Zero DOM, Zero Dexie/Firebase, Zero Gemini, Zero I/O, Zero Efeitos Colaterais.
 */

const { calculateTMB, calculateGET } = require('./nutritionMath');
const { DEFAULT_ENERGY_POLICY, validateEnergyPolicy, deepFreeze } = require('./energyPolicy');

/**
 * Calcula determinística e contextualmente a meta energética de ingestão do paciente.
 * 
 * @param {Object} context - NutritionPrescriptionContextDTO validado da Fase N1.1
 * @param {Object} [options={}] - Opções opcionais de execução e override de política
 * @param {Object} [options.policy] - Política energética alternativa (opcional)
 * @returns {Readonly<Object>} Resultado canônico e imutável da meta energética
 */
function calculateDeterministicEnergyTarget(context, options = {}) {
  const policy = options.policy || DEFAULT_ENERGY_POLICY;

  // ── 1. VALIDAÇÃO DE SEGURANÇA DA POLÍTICA ──────────────────────────────────
  const policyValidation = validateEnergyPolicy(policy);
  if (!policyValidation.isValid) {
    const errorBlock = {
      status: "BLOCKED",
      tmbKcal: null,
      getKcal: null,
      adjustmentKcal: null,
      adjustmentPercent: null,
      caloricTargetKcal: null,
      energyBalanceKcal: null,
      objective: null,
      calculationMethod: "DETERMINISTIC_ENERGY_TARGET_N21",
      factorsConsidered: [],
      warnings: [],
      blockingReasons: [`Política energética inválida ou incompleta: ${policyValidation.errors.join('; ')}`],
      rationale: ["Execução bloqueada por não conformidade ou ausência de parâmetros obrigatórios na política energética."],
      policy: {
        version: policy?.policyVersion || "UNKNOWN",
        appliedRule: "INVALID_POLICY_BLOCK",
        parameters: []
      },
      provenance: {
        tmb: { value: null, method: null, source: "MISSING" },
        get: { value: null, activityFactor: null, source: "MISSING" },
        adjustment: { adjustmentKcal: null, adjustmentPercent: null, parameterSource: "INVALID_POLICY", policyVersion: "UNKNOWN" },
        caloricTarget: { caloricTargetKcal: null, energyBalanceKcal: null, safetyStatus: "BLOCKED" }
      }
    };
    return deepFreeze(errorBlock);
  }

  const p = policy.parameters;
  const factorsConsidered = [];
  const warnings = [];
  const blockingReasons = [];
  const rationale = [];
  const appliedParameters = [];

  // ── 2. VALIDAÇÃO ESTRUTURAL DO CONTEXTO DE ENTRADA ─────────────────────────
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    blockingReasons.push("Contexto de prescrição ausente ou inválido (deve ser um objeto não-nulo).");
    return deepFreeze(buildBlockedOutput(null, null, null, factorsConsidered, warnings, blockingReasons, ["Contexto nulo ou de tipo incorreto."], policy, "INVALID_CONTEXT_BLOCK"));
  }

  const patient = context.patient || {};
  const objective = context.objective || {};
  const anthro = context.anthropometry || {};
  const energy = context.energy || {};
  const routine = context.routine || {};
  const training = context.training || {};
  const cardio = context.cardio || {};
  const weeklySchedule = Array.isArray(context.weeklySchedule) ? context.weeklySchedule : [];
  const dietaryRecall = context.dietaryRecall || {};
  const currentPrescription = context.currentPrescription || {};
  const clinical = context.clinical || {};

  // Validação de identificação
  if (!patient.patientId || typeof patient.patientId !== 'string' || patient.patientId.trim() === '') {
    blockingReasons.push("Identificador do paciente (patientId) ausente ou inválido.");
  }

  // Validação biométrica estrita
  const age = patient.age;
  if (age == null || typeof age !== 'number' || isNaN(age) || !isFinite(age) || age < 0 || age > 130) {
    blockingReasons.push("Idade do paciente ausente ou inválida (deve ser um número finito entre 0 e 130).");
  }

  const weightKg = anthro.weightKg;
  if (weightKg == null || typeof weightKg !== 'number' || isNaN(weightKg) || !isFinite(weightKg) || weightKg <= 0 || weightKg > 500) {
    blockingReasons.push("Peso corporal ausente ou inválido (deve ser um número finito > 0 e <= 500 kg).");
  }

  const heightCm = anthro.heightCm;
  if (heightCm == null || typeof heightCm !== 'number' || isNaN(heightCm) || !isFinite(heightCm) || heightCm <= 0 || heightCm > 300) {
    blockingReasons.push("Estatura ausente ou inválida (deve ser um número finito > 0 e <= 300 cm).");
  }

  const clinicalObjective = objective.clinicalObjective ? String(objective.clinicalObjective).trim() : null;
  if (!clinicalObjective || clinicalObjective === '' || clinicalObjective === 'MISSING') {
    blockingReasons.push("Objetivo clínico ausente ou não informado.");
  }

  // Se houver qualquer bloqueio estrutural prévio, encerra imediatamente
  if (blockingReasons.length > 0) {
    return deepFreeze(buildBlockedOutput(null, null, clinicalObjective, factorsConsidered, warnings, blockingReasons, ["Dados estruturais obrigatórios ausentes ou inconsistentes."], policy, "STRUCTURAL_DATA_BLOCK"));
  }

  factorsConsidered.push("Dados Biométricos (Peso, Estatura, Idade, Sexo)");
  factorsConsidered.push("Objetivo Clínico");

  // ── 3. GUARDA-CORPO DE SEGURANÇA PEDIÁTRICA (REGRA OBRIGATÓRIA SEÇÃO 7) ─────
  const pediatricThreshold = p.safety.pediatricBlockingAge.value;
  if (age < pediatricThreshold) {
    appliedParameters.push({
      key: "safety.pediatricBlockingAge",
      value: pediatricThreshold,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.safety.pediatricBlockingAge.rationale
    });

    blockingReasons.push(`Paciente menor de 18 anos (${age} anos): Aplicação de política energética adulta de déficit/superávit é estritamente bloqueada. Requer avaliação e prescrição pediátrica especializada.`);
    rationale.push(`Paciente com idade (${age} anos) inferior ao limite da política adulta (${pediatricThreshold} anos).`);
    rationale.push("Cálculo automático de meta energética adulta bloqueado por protocolo de segurança clínica pediátrica.");

    return deepFreeze(buildBlockedOutput(null, null, clinicalObjective, factorsConsidered, warnings, blockingReasons, rationale, policy, "PEDIATRIC_SAFETY_BLOCK", appliedParameters));
  }

  // ── 4. RESOLUÇÃO MATEMÁTICA CANÔNICA DE TMB E GET (SEÇÃO 3) ────────────────
  const sex = patient.sex || 'Masculino';
  const leanMassKg = (anthro.leanMassKg != null && !isNaN(anthro.leanMassKg) && anthro.leanMassKg > 0) ? anthro.leanMassKg : 0;

  let tmbKcal = null;
  let tmbMethod = null;

  if (energy.tmbKcal != null) {
    if (typeof energy.tmbKcal !== 'number' || isNaN(energy.tmbKcal) || !isFinite(energy.tmbKcal) || energy.tmbKcal <= 0) {
      blockingReasons.push("Taxa Metabólica Basal (TMB) informada é inválida, nula ou não-positiva.");
      return deepFreeze(buildBlockedOutput(null, null, clinicalObjective, factorsConsidered, warnings, blockingReasons, ["Falha de segurança: TMB informada é inválida ou não-positiva."], policy, "INVALID_TMB_BLOCK"));
    }
    tmbKcal = Math.round(energy.tmbKcal);
    tmbMethod = energy.formula || 'Context Energy TMB';
  } else {
    const tmbCalc = calculateTMB(sex, age, weightKg, heightCm / 100, leanMassKg);
    tmbKcal = Math.round(tmbCalc.tmb);
    tmbMethod = tmbCalc.method;
  }

  if (tmbKcal == null || isNaN(tmbKcal) || !isFinite(tmbKcal) || tmbKcal <= 0) {
    blockingReasons.push("Taxa Metabólica Basal (TMB) calculada como inválida ou não-positiva.");
    return deepFreeze(buildBlockedOutput(null, null, clinicalObjective, factorsConsidered, warnings, blockingReasons, ["Falha no cálculo da TMB."], policy, "INVALID_TMB_BLOCK"));
  }

  factorsConsidered.push(`Taxa Metabólica Basal (TMB: ${tmbKcal} kcal via ${tmbMethod})`);
  rationale.push(`1. TMB calculada em ${tmbKcal} kcal/dia utilizando o método canônico "${tmbMethod}".`);

  // Fator de atividade física
  let rawAf = energy.activityFactor;
  if (rawAf == null || isNaN(rawAf) || rawAf <= 0) {
    rawAf = 1.42; // padrão canônico
  }
  const activityFactor = Number(Number(rawAf).toFixed(2));

  let getKcal = null;
  if (energy.getKcal != null) {
    if (typeof energy.getKcal !== 'number' || isNaN(energy.getKcal) || !isFinite(energy.getKcal) || energy.getKcal <= 0) {
      blockingReasons.push("Gasto Energético Total (GET) informado é inválido, nulo ou não-positivo.");
      return deepFreeze(buildBlockedOutput(tmbKcal, null, clinicalObjective, factorsConsidered, warnings, blockingReasons, ["Falha de segurança: GET informado é inválido ou não-positivo."], policy, "INVALID_GET_BLOCK"));
    }
    getKcal = Math.round(energy.getKcal);
  } else {
    getKcal = Math.round(calculateGET(tmbKcal, activityFactor));
  }

  if (getKcal == null || isNaN(getKcal) || !isFinite(getKcal) || getKcal <= 0) {
    blockingReasons.push("Gasto Energético Total (GET) calculado como inválido ou não-positivo.");
    return deepFreeze(buildBlockedOutput(tmbKcal, null, clinicalObjective, factorsConsidered, warnings, blockingReasons, ["Falha no cálculo do GET."], policy, "INVALID_GET_BLOCK"));
  }

  // Verificação de consistência matemática TMB vs GET
  if (activityFactor < 1.0) {
    warnings.push(`Fator de atividade incomum (${activityFactor} < 1.0). Gasto energético total estimado inferior ao metabolismo basal.`);
  }

  factorsConsidered.push(`Gasto Energético Total (GET: ${getKcal} kcal, Fator de Atividade: ${activityFactor})`);
  rationale.push(`2. GET estimado em ${getKcal} kcal/dia (TMB ${tmbKcal} × FA ${activityFactor}). O GET já incorpora o gasto energético de rotina, ocupacional e de treinamento/cardio.`);

  // ── 5. IDENTIFICAÇÃO DO OBJETIVO CLÍNICO E POLÍTICA CORRESPONDENTE ────────
  const normalizedObj = clinicalObjective.toLowerCase();
  let objectiveCategory = 'MAINTENANCE';

  if (normalizedObj.includes('perda') || normalizedObj.includes('emagrecimento') || normalizedObj.includes('déficit') || normalizedObj.includes('deficit') || normalizedObj.includes('cutting') || normalizedObj.includes('definir')) {
    objectiveCategory = 'WEIGHT_LOSS';
  } else if (normalizedObj.includes('hipertrofia') || normalizedObj.includes('ganho') || normalizedObj.includes('bulking') || normalizedObj.includes('superávit') || normalizedObj.includes('superavit') || normalizedObj.includes('massa')) {
    objectiveCategory = 'HYPERTROPHY';
  } else if (normalizedObj.includes('recomposição') || normalizedObj.includes('recomposicao')) {
    objectiveCategory = 'RECOMPOSITION';
  } else if (normalizedObj.includes('performance') || normalizedObj.includes('esportiva') || normalizedObj.includes('rendimento') || normalizedObj.includes('atleta')) {
    objectiveCategory = 'PERFORMANCE';
  } else {
    objectiveCategory = 'MAINTENANCE';
  }

  // ── 6. ANÁLISE DE CONTEXTO E MODULAÇÃO CONFORME A POLÍTICA ─────────────────
  let calculatedAdjustmentPercent = 0.0;
  let appliedRule = "";
  const isMale = String(sex).toLowerCase().startsWith('m');

  // Dados de Composição Corporal
  const bodyFat = (anthro.bodyFatPercent != null && !isNaN(anthro.bodyFatPercent) && anthro.bodyFatPercent > 0) ? anthro.bodyFatPercent : null;
  const bmi = (anthro.bmi != null && !isNaN(anthro.bmi) && anthro.bmi > 0) ? anthro.bmi : null;

  if (bodyFat != null) {
    factorsConsidered.push(`Composição Corporal (% Gordura: ${bodyFat}%)`);
  } else if (bmi != null) {
    factorsConsidered.push(`Composição Corporal via IMC (${bmi} kg/m²) [Fallback]`);
  } else {
    factorsConsidered.push("Composição Corporal: Dados antropométricos detalhados ausentes");
  }

  // Dados de Treino, Cardio e Microciclo
  const hasActiveTraining = !!training.hasActiveTraining;
  const trainingFrequency = (training.frequency != null && typeof training.frequency === 'number') ? training.frequency : (Array.isArray(training.routines) ? training.routines.length : 0);
  const cardioFrequency = (cardio.weeklyFrequency != null && typeof cardio.weeklyFrequency === 'number') ? cardio.weeklyFrequency : (Array.isArray(cardio.sessions) ? cardio.sessions.length : 0);
  
  let totalCardioMinutes = 0;
  if (Array.isArray(cardio.sessions)) {
    totalCardioMinutes = cardio.sessions.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
  }

  const isHighTrainingVolume = trainingFrequency >= p.trainingThresholds.highFrequencyDays.value || totalCardioMinutes >= p.trainingThresholds.highCardioWeeklyMinutes.value;
  if (hasActiveTraining || trainingFrequency > 0) {
    factorsConsidered.push(`Treinamento Físico (${trainingFrequency} sessões/sem, split: ${training.activeSplit || 'Geral'})`);
  }
  if (cardio.hasActiveCardio || cardioFrequency > 0) {
    factorsConsidered.push(`Cardio (${cardioFrequency} sessões/sem, total: ${totalCardioMinutes} min/sem)`);
  }
  if (weeklySchedule.length > 0) {
    factorsConsidered.push(`Microciclo Semanal (${weeklySchedule.length} dias mapeados)`);
  }

  // Invariante de dupla contagem: treino/cardio nunca somam calorias sobre o GET
  rationale.push("3. Dupla contagem rigorosamente evitada: nenhuma caloria de treinamento ou cardio foi somada ao GET.");

  // APLICAÇÃO DA POLÍTICA POR OBJETIVO
  if (objectiveCategory === 'WEIGHT_LOSS') {
    appliedRule = "WEIGHT_LOSS_BASE";
    const baseParam = p.weightLoss.baseDeficitPercent;
    calculatedAdjustmentPercent = baseParam.value;
    appliedParameters.push({
      key: "weightLoss.baseDeficitPercent",
      value: baseParam.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: baseParam.rationale
    });
    rationale.push(`4. Objetivo "${clinicalObjective}" classificado como Perda de Peso. Aplicação de déficit base de ${(baseParam.value * 100).toFixed(1)}% do GET pela política.`);

    // Modulação por Adiposidade
    const highBfThreshold = isMale ? p.compositionThresholds.bodyFat.highMale.value : p.compositionThresholds.bodyFat.highFemale.value;
    const lowBfThreshold = isMale ? p.compositionThresholds.bodyFat.lowMale.value : p.compositionThresholds.bodyFat.lowFemale.value;

    if (bodyFat != null) {
      if (bodyFat >= highBfThreshold) {
        const modParam = p.weightLoss.highAdiposityModulationPercent;
        calculatedAdjustmentPercent += modParam.value;
        appliedRule = "WEIGHT_LOSS_HIGH_ADIPOSITY";
        appliedParameters.push({
          key: "weightLoss.highAdiposityModulationPercent",
          value: modParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: modParam.rationale
        });
        rationale.push(`5. Composição corporal com alta adiposidade (%G ${bodyFat}% >= limiar ${highBfThreshold}%): modulação de ${(modParam.value * 100).toFixed(1)}% do GET aplicada.`);
      } else if (bodyFat <= lowBfThreshold) {
        const modParam = p.weightLoss.lowAdiposityModulationPercent;
        calculatedAdjustmentPercent += modParam.value;
        appliedRule = "WEIGHT_LOSS_LOW_ADIPOSITY";
        appliedParameters.push({
          key: "weightLoss.lowAdiposityModulationPercent",
          value: modParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: modParam.rationale
        });
        rationale.push(`5. Composição corporal atlética/baixa adiposidade (%G ${bodyFat}% <= limiar ${lowBfThreshold}%): atenuação de déficit de +${(modParam.value * 100).toFixed(1)}% do GET aplicada.`);
      } else {
        rationale.push(`5. Composição corporal com adiposidade intermediária (%G ${bodyFat}%): déficit base preservado.`);
      }
    } else if (bmi != null) {
      // Fallback via IMC
      if (bmi >= p.compositionThresholds.bmiFallback.high.value) {
        const modParam = p.weightLoss.highAdiposityModulationPercent;
        calculatedAdjustmentPercent += modParam.value;
        appliedRule = "WEIGHT_LOSS_HIGH_ADIPOSITY_BMI_FALLBACK";
        appliedParameters.push({
          key: "weightLoss.highAdiposityModulationPercent",
          value: modParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: "Fallback via IMC elevado (>= 30 kg/m²)."
        });
        rationale.push(`5. Fallback por IMC elevado (${bmi} kg/m² >= 30): modulação de ${(modParam.value * 100).toFixed(1)}% do GET aplicada.`);
      } else if (bmi <= p.compositionThresholds.bmiFallback.low.value) {
        const modParam = p.weightLoss.lowAdiposityModulationPercent;
        calculatedAdjustmentPercent += modParam.value;
        appliedRule = "WEIGHT_LOSS_LOW_ADIPOSITY_BMI_FALLBACK";
        appliedParameters.push({
          key: "weightLoss.lowAdiposityModulationPercent",
          value: modParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: "Fallback via IMC baixo (< 22 kg/m²)."
        });
        rationale.push(`5. Fallback por IMC baixo (${bmi} kg/m² < 22): atenuação de déficit de +${(modParam.value * 100).toFixed(1)}% do GET aplicada.`);
      }
    }

    // Modulação por Carga de Treinamento
    if (isHighTrainingVolume) {
      const trainParam = p.weightLoss.highVolumeTrainingAttenuationPercent;
      calculatedAdjustmentPercent += trainParam.value;
      appliedRule += "_HIGH_VOLUME_ATTENUATED";
      appliedParameters.push({
        key: "weightLoss.highVolumeTrainingAttenuationPercent",
        value: trainParam.value,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: trainParam.rationale
      });
      appliedParameters.push({
        key: "trainingThresholds.highFrequencyDays",
        value: p.trainingThresholds.highFrequencyDays.value,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: p.trainingThresholds.highFrequencyDays.rationale
      });
      rationale.push(`6. Volume elevado de treino/cardio (${trainingFrequency} dias, ${totalCardioMinutes} min cardio): atenuação de déficit de +${(trainParam.value * 100).toFixed(1)}% do GET aplicada.`);
    }

  } else if (objectiveCategory === 'HYPERTROPHY') {
    appliedRule = "HYPERTROPHY_BASE";
    const baseParam = p.hypertrophy.baseSurplusPercent;
    calculatedAdjustmentPercent = baseParam.value;
    appliedParameters.push({
      key: "hypertrophy.baseSurplusPercent",
      value: baseParam.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: baseParam.rationale
    });
    rationale.push(`4. Objetivo "${clinicalObjective}" classificado como Hipertrofia. Aplicação de superávit base de +${(baseParam.value * 100).toFixed(1)}% do GET pela política.`);

    // Modulação por Composição Corporal em Hipertrofia
    const leanBfThreshold = isMale ? p.compositionThresholds.bodyFat.leanHypertrophyMale.value : p.compositionThresholds.bodyFat.leanHypertrophyFemale.value;
    const highHypBfThreshold = isMale ? p.compositionThresholds.bodyFat.highHypertrophyMale.value : p.compositionThresholds.bodyFat.highHypertrophyFemale.value;

    if (bodyFat != null) {
      if (bodyFat <= leanBfThreshold) {
        const leanParam = p.hypertrophy.leanIndividualModulationPercent;
        calculatedAdjustmentPercent += leanParam.value;
        appliedRule = "HYPERTROPHY_LEAN_INDIVIDUAL";
        appliedParameters.push({
          key: "hypertrophy.leanIndividualModulationPercent",
          value: leanParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: leanParam.rationale
        });
        rationale.push(`5. Indivíduo com adiposidade reduzida (%G ${bodyFat}% <= limiar ${leanBfThreshold}%): acréscimo de superávit de +${(leanParam.value * 100).toFixed(1)}% do GET aplicado.`);
      } else if (bodyFat >= highHypBfThreshold) {
        const highParam = p.hypertrophy.highAdiposityModulationPercent;
        calculatedAdjustmentPercent += highParam.value;
        appliedRule = "HYPERTROPHY_HIGH_ADIPOSITY_CONSTRAINED";
        appliedParameters.push({
          key: "hypertrophy.highAdiposityModulationPercent",
          value: highParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: highParam.rationale
        });
        rationale.push(`5. Indivíduo com adiposidade elevada (%G ${bodyFat}% >= limiar ${highHypBfThreshold}%): contenção de superávit de ${(highParam.value * 100).toFixed(1)}% do GET aplicada.`);
      }
    }

    // Verificação de Ausência de Treinamento Resistido
    if (!hasActiveTraining && trainingFrequency === 0) {
      const untrainedParam = p.hypertrophy.untrainedAttenuationPercent;
      calculatedAdjustmentPercent += untrainedParam.value;
      appliedRule += "_UNTRAINED_ATTENUATED";
      appliedParameters.push({
        key: "hypertrophy.untrainedAttenuationPercent",
        value: untrainedParam.value,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: untrainedParam.rationale
      });
      warnings.push("Objetivo de hipertrofia selecionado sem treino resistido ativo cadastrado. Superávit atenuado pela política.");
      rationale.push(`6. Ausência de treinamento resistido ativo: atenuação de superávit de ${(untrainedParam.value * 100).toFixed(1)}% do GET aplicada.`);
    }

  } else if (objectiveCategory === 'RECOMPOSITION') {
    appliedRule = "RECOMPOSITION_BASE";
    const baseParam = p.recomposition.baseAdjustmentPercent;
    calculatedAdjustmentPercent = baseParam.value;
    appliedParameters.push({
      key: "recomposition.baseAdjustmentPercent",
      value: baseParam.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: baseParam.rationale
    });
    rationale.push(`4. Objetivo "${clinicalObjective}" classificado como Recomposição Corporal. Ajuste base de ${(baseParam.value * 100).toFixed(1)}% do GET pela política.`);

    const highBfThreshold = isMale ? p.compositionThresholds.bodyFat.highMale.value : p.compositionThresholds.bodyFat.highFemale.value;
    const lowBfThreshold = isMale ? p.compositionThresholds.bodyFat.lowMale.value : p.compositionThresholds.bodyFat.lowFemale.value;

    if (bodyFat != null) {
      if (bodyFat >= highBfThreshold) {
        const highParam = p.recomposition.highAdiposityDeficitPercent;
        calculatedAdjustmentPercent = highParam.value;
        appliedRule = "RECOMPOSITION_HIGH_ADIPOSITY";
        appliedParameters.push({
          key: "recomposition.highAdiposityDeficitPercent",
          value: highParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: highParam.rationale
        });
        rationale.push(`5. Recomposição com adiposidade elevada (%G ${bodyFat}%): déficit definido em ${(highParam.value * 100).toFixed(1)}% do GET.`);
      } else if (bodyFat <= lowBfThreshold) {
        const leanParam = p.recomposition.leanIndividualAdjustmentPercent;
        calculatedAdjustmentPercent = leanParam.value;
        appliedRule = "RECOMPOSITION_LEAN";
        appliedParameters.push({
          key: "recomposition.leanIndividualAdjustmentPercent",
          value: leanParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: leanParam.rationale
        });
        rationale.push(`5. Recomposição em indivíduo magro/atlético (%G ${bodyFat}%): ajuste definido em ${(leanParam.value * 100).toFixed(1)}% do GET.`);
      }
    }

  } else if (objectiveCategory === 'PERFORMANCE') {
    appliedRule = "PERFORMANCE_BASE";
    const baseParam = p.performance.baseAdjustmentPercent;
    calculatedAdjustmentPercent = baseParam.value;
    appliedParameters.push({
      key: "performance.baseAdjustmentPercent",
      value: baseParam.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: baseParam.rationale
    });
    rationale.push(`4. Objetivo "${clinicalObjective}" classificado como Performance Esportiva. Ajuste base de +${(baseParam.value * 100).toFixed(1)}% do GET.`);

    if (isHighTrainingVolume || weeklySchedule.length >= 5) {
      const demandParam = p.performance.highDemandAdjustmentPercent;
      calculatedAdjustmentPercent = demandParam.value;
      appliedRule = "PERFORMANCE_HIGH_DEMAND";
      appliedParameters.push({
        key: "performance.highDemandAdjustmentPercent",
        value: demandParam.value,
        source: "POLICY_PARAMETER",
        version: policy.policyVersion,
        rationale: demandParam.rationale
      });
      rationale.push(`5. Microciclo de alta demanda esportiva: ajuste definido em +${(demandParam.value * 100).toFixed(1)}% do GET.`);
    }

  } else {
    // MAINTENANCE
    appliedRule = "MAINTENANCE_NORMOCALORIC";
    const maintParam = p.maintenance.adjustmentPercent;
    calculatedAdjustmentPercent = maintParam.value;
    appliedParameters.push({
      key: "maintenance.adjustmentPercent",
      value: maintParam.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: maintParam.rationale
    });
    rationale.push(`4. Objetivo "${clinicalObjective}" classificado como Manutenção & Saúde. Meta normocalórica idêntica ao GET (ajuste de 0%).`);
  }

  // ── 7. CÁLCULO DA META ENERGÉTICA E BALANÇO ─────────────────────────────────
  const adjustmentPercent = Number(calculatedAdjustmentPercent.toFixed(4));
  const adjustmentKcal = Math.round(getKcal * adjustmentPercent);
  const caloricTargetKcal = Math.round(getKcal + adjustmentKcal);
  const energyBalanceKcal = caloricTargetKcal - getKcal;

  rationale.push(`7. Ajuste energético final determinado: ${adjustmentKcal >= 0 ? '+' : ''}${adjustmentKcal} kcal (${(adjustmentPercent * 100).toFixed(1)}% do GET).`);
  rationale.push(`8. Meta energética calculada (caloricTargetKcal): ${caloricTargetKcal} kcal/dia.`);
  rationale.push(`9. Balanço energético estimado (energyBalanceKcal): ${energyBalanceKcal >= 0 ? '+' : ''}${energyBalanceKcal} kcal/dia.`);

  // ── 8. CONTEXTUALIZAÇÃO DO RECORDATÓRIO ALIMENTAR (SEÇÃO 11) ────────────────
  if (dietaryRecall && dietaryRecall.hasRecall && Array.isArray(dietaryRecall.items) && dietaryRecall.items.length > 0) {
    factorsConsidered.push(`Recordatório Alimentar (${dietaryRecall.items.length} itens relatados)`);
    const recallKcal = Math.round(dietaryRecall.items.reduce((acc, it) => acc + (it.macros?.calories || 0), 0));
    
    if (recallKcal > 0) {
      rationale.push(`10. Recordatório alimentar atual totaliza ${recallKcal} kcal/dia. O recordatório serve como referência de consumo habitual e NÃO sobrescreve a meta energética.`);
      const discrepancy = Math.abs(caloricTargetKcal - recallKcal);
      const maxDiscrepancyParam = p.safety.maxRecallDiscrepancyKcal;

      if (discrepancy >= maxDiscrepancyParam.value) {
        warnings.push(`Discrepância acentuada (${discrepancy} kcal) entre o consumo habitual relatado no recordatório (${recallKcal} kcal) e a meta calculada (${caloricTargetKcal} kcal). Recomenda-se transição progressiva de calorias.`);
        appliedParameters.push({
          key: "safety.maxRecallDiscrepancyKcal",
          value: maxDiscrepancyParam.value,
          source: "POLICY_PARAMETER",
          version: policy.policyVersion,
          rationale: maxDiscrepancyParam.rationale
        });
      }
    }
  }

  // ── 9. PRESCRIÇÃO HISTÓRICA E META HOMOLOGADA ──────────────────────────────
  if (currentPrescription && currentPrescription.prescribedKcal != null) {
    factorsConsidered.push(`Prescrição Anterior (${currentPrescription.prescribedKcal} kcal)`);
    rationale.push(`11. Prescrição histórica no prontuário (${currentPrescription.prescribedKcal} kcal) avaliada como histórico e NÃO sobrescreve a meta atual determinada pelo motor.`);
  }

  if (energy.source === 'HOMOLOGATED_TARGET' || (energy.caloricTargetKcal != null && options.approvedCaloricTarget != null)) {
    factorsConsidered.push("Meta Homologada Prévia");
    rationale.push(`12. Meta homologada prévia identificada no contexto (${energy.caloricTargetKcal} kcal). O motor determinístico reporta sua recomendação independente.`);
  }

  // ── 10. DADOS CLÍNICOS E EXAMES ─────────────────────────────────────────────
  if (clinical && Array.isArray(clinical.exams) && clinical.exams.length > 0) {
    factorsConsidered.push(`Exames Clínicos Laboratoriais (${clinical.exams.length} exames)`);
    rationale.push("13. Exames clínicos laboratoriais considerados no contexto; nenhum ajuste calórico arbitrário aplicado (clinicalAdjustmentKcal = 0, clinicalRuleApplied: false).");
  }

  // ── 11. GUARDA-CORPOS DE SEGURANÇA E ALERTAS DA POLÍTICA ────────────────────
  // Piso Calórico Seguro da Política
  const minFloor = isMale ? p.safety.minimumTargetGuard.maleKcal : p.safety.minimumTargetGuard.femaleKcal;
  const tmbRatioFloor = Math.round(tmbKcal * p.safety.minimumTargetGuard.tmbRatio);
  const effectiveFloor = Math.max(minFloor, tmbRatioFloor);

  if (caloricTargetKcal < effectiveFloor) {
    warnings.push(`Meta energética calculada (${caloricTargetKcal} kcal) abaixo do piso de segurança da política (${effectiveFloor} kcal). Requer acompanhamento clínico.`);
    appliedParameters.push({
      key: "safety.minimumTargetGuard",
      value: minFloor,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.safety.minimumTargetGuard.rationale
    });
  }

  if (caloricTargetKcal < tmbKcal) {
    warnings.push(`Meta energética calculada (${caloricTargetKcal} kcal) abaixo da TMB (${tmbKcal} kcal). Monitorar sustentabilidade metabólica.`);
  }

  // Déficit Máximo
  if (adjustmentPercent < p.safety.maxDeficitPercent.value) {
    warnings.push(`Déficit percentual (${(adjustmentPercent * 100).toFixed(1)}%) ultrapassa o limite de alerta da política (${(p.safety.maxDeficitPercent.value * 100).toFixed(1)}%).`);
    appliedParameters.push({
      key: "safety.maxDeficitPercent",
      value: p.safety.maxDeficitPercent.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.safety.maxDeficitPercent.rationale
    });
  }

  if (adjustmentKcal < p.safety.maxDeficitKcal.value) {
    warnings.push(`Déficit absoluto (${adjustmentKcal} kcal) ultrapassa o limite de alerta da política (${p.safety.maxDeficitKcal.value} kcal).`);
    appliedParameters.push({
      key: "safety.maxDeficitKcal",
      value: p.safety.maxDeficitKcal.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.safety.maxDeficitKcal.rationale
    });
  }

  // Superávit Máximo
  if (adjustmentPercent > p.safety.maxSurplusPercent.value) {
    warnings.push(`Superávit percentual (+${(adjustmentPercent * 100).toFixed(1)}%) ultrapassa o limite de alerta da política (+${(p.safety.maxSurplusPercent.value * 100).toFixed(1)}%).`);
    appliedParameters.push({
      key: "safety.maxSurplusPercent",
      value: p.safety.maxSurplusPercent.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.safety.maxSurplusPercent.rationale
    });
  }

  if (adjustmentKcal > p.safety.maxSurplusKcal.value) {
    warnings.push(`Superávit absoluto (+${adjustmentKcal} kcal) ultrapassa o limite de alerta da política (+${p.safety.maxSurplusKcal.value} kcal).`);
    appliedParameters.push({
      key: "safety.maxSurplusKcal",
      value: p.safety.maxSurplusKcal.value,
      source: "POLICY_PARAMETER",
      version: policy.policyVersion,
      rationale: p.safety.maxSurplusKcal.rationale
    });
  }

  // Ausência de avaliação antropométrica recente
  if (anthro.hasRecentAssessment === false) {
    warnings.push("Ausência de avaliação antropométrica recente no prontuário. Cálculo executado com base nos dados biométricos cadastrais.");
  }

  // ── 12. DETERMINAÇÃO FINAL DO STATUS E ESTRUTURAÇÃO DA SAÍDA ───────────────
  const finalStatus = warnings.length > 0 ? "WARNING" : "PASS";

  const result = {
    status: finalStatus,
    tmbKcal,
    getKcal,
    adjustmentKcal,
    adjustmentPercent,
    caloricTargetKcal,
    energyBalanceKcal,
    objective: clinicalObjective,
    calculationMethod: "DETERMINISTIC_ENERGY_TARGET_N21",
    factorsConsidered,
    warnings,
    blockingReasons,
    rationale,
    policy: {
      version: policy.policyVersion,
      appliedRule,
      parameters: appliedParameters
    },
    provenance: {
      tmb: {
        value: tmbKcal,
        method: tmbMethod,
        source: "domain/math/nutritionMath.js"
      },
      get: {
        value: getKcal,
        activityFactor,
        source: "domain/math/nutritionMath.js"
      },
      adjustment: {
        adjustmentKcal,
        adjustmentPercent,
        parameterSource: "POLICY_PARAMETER",
        policyVersion: policy.policyVersion
      },
      caloricTarget: {
        caloricTargetKcal,
        energyBalanceKcal,
        safetyStatus: finalStatus
      }
    }
  };

  return deepFreeze(result);
}

/**
 * Função utilitária interna para construção de saídas no estado BLOCKED
 */
function buildBlockedOutput(tmbKcal, getKcal, objective, factorsConsidered, warnings, blockingReasons, rationale, policy, appliedRule, appliedParameters = []) {
  return {
    status: "BLOCKED",
    tmbKcal: tmbKcal || null,
    getKcal: getKcal || null,
    adjustmentKcal: null,
    adjustmentPercent: null,
    caloricTargetKcal: null,
    energyBalanceKcal: null,
    objective: objective || null,
    calculationMethod: "DETERMINISTIC_ENERGY_TARGET_N21",
    factorsConsidered: factorsConsidered || [],
    warnings: warnings || [],
    blockingReasons: blockingReasons || [],
    rationale: rationale || [],
    policy: {
      version: policy?.policyVersion || "UNKNOWN",
      appliedRule: appliedRule || "BLOCKED_RULE",
      parameters: appliedParameters || []
    },
    provenance: {
      tmb: { value: tmbKcal || null, method: null, source: tmbKcal ? "domain/math/nutritionMath.js" : "MISSING" },
      get: { value: getKcal || null, activityFactor: null, source: getKcal ? "domain/math/nutritionMath.js" : "MISSING" },
      adjustment: { adjustmentKcal: null, adjustmentPercent: null, parameterSource: "BLOCKED", policyVersion: policy?.policyVersion || "UNKNOWN" },
      caloricTarget: { caloricTargetKcal: null, energyBalanceKcal: null, safetyStatus: "BLOCKED" }
    }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateDeterministicEnergyTarget
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.energyTarget = {
    calculateDeterministicEnergyTarget
  };
}
