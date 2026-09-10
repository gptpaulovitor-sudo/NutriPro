/**
 * domain/math/nutritionMath.js
 * 
 * Motor Matemático Canônico de Nutrição e Antropometria — NutriAx Pro.
 * Camada Pura — Sem DOM, Sem Dexie, Sem Firebase, Sem Gemini, Sem Efeitos Colaterais.
 */

/**
 * 1. Cálculo de IMC (Índice de Massa Corporal) e Classificação OMS
 * @param {number} weightKg - Peso corporal em kg
 * @param {number} heightM - Estatura em metros
 * @returns {{ imc: number, classification: string }}
 */
function calculateIMC(weightKg, heightM) {
  const w = parseFloat(weightKg) || 0;
  const h = parseFloat(heightM) || 0;

  if (w <= 0 || h <= 0) {
    return { imc: 0, classification: "Dados insuficientes" };
  }

  const rawImc = w / (h * h);
  let classification = "Eutrofia / Adequado";

  if (rawImc < 18.5) classification = "Abaixo do peso";
  else if (rawImc < 25) classification = "Eutrofia / Adequado";
  else if (rawImc < 30) classification = "Sobrepeso";
  else if (rawImc < 35) classification = "Obesidade Grau I";
  else if (rawImc < 40) classification = "Obesidade Grau II";
  else classification = "Obesidade Grau III";

  return {
    imc: Number(rawImc.toFixed(2)),
    classification
  };
}

const calculateBMI = calculateIMC;

/**
 * 2. Cálculo da Taxa Metabólica Basal (TMB)
 * Prioridade canônica: Katch-McArdle (quando há Massa Magra > 0); fallback: Mifflin-St Jeor.
 * @param {string} gender - 'Masculino' | 'Feminino'
 * @param {number} age - Idade em anos
 * @param {number} weightKg - Peso em kg
 * @param {number} heightM - Estatura em metros
 * @param {number} leanMassKg - Massa Magra em kg (opcional)
 * @returns {{ tmb: number, method: string, isAdolescent: boolean, clinicalReviewRequired?: boolean }}
 */
function calculateTMB(gender = "Masculino", age = 30, weightKg = 70, heightM = 1.75, leanMassKg = 0) {
  const w = parseFloat(weightKg) || 70;
  const h = parseFloat(heightM) || 1.75;
  const a = parseFloat(age) || 30;
  const lbm = parseFloat(leanMassKg) || 0;
  const isMale = String(gender).toLowerCase().startsWith("m");
  const isAdolescent = a < 18;

  // 1. Katch-McArdle (Prioridade absoluta quando Massa Magra disponível)
  if (lbm > 0) {
    const tmbKatch = 370 + 21.6 * lbm;
    return {
      tmb: Number(tmbKatch.toFixed(2)),
      method: "Katch-McArdle (Massa Magra)",
      isAdolescent,
      ...(isAdolescent ? { clinicalReviewRequired: true, notes: "Paciente adolescente: TMB requer avaliação clínica individualizada." } : {})
    };
  }

  // 2. Mifflin-St Jeor (Fallback)
  const heightCm = h * 100;
  let tmbMifflin = 10 * w + 6.25 * heightCm - 5 * a;
  if (isMale) {
    tmbMifflin += 5;
  } else {
    tmbMifflin -= 161;
  }

  if (isNaN(tmbMifflin) || tmbMifflin <= 0) {
    tmbMifflin = 1500;
  }

  return {
    tmb: Number(tmbMifflin.toFixed(2)),
    method: "Mifflin-St Jeor",
    isAdolescent,
    ...(isAdolescent ? { clinicalReviewRequired: true, notes: "Paciente adolescente: TMB calculada por equação adulta de transição; requer avaliação especializada." } : {})
  };
}

/**
 * 3. Cálculo do Gasto Energético Total (GET)
 * @param {number} tmb - Taxa metabólica basal em kcal
 * @param {number} activityFactor - Fator de atividade física (padrão de sistema: 1.42)
 * @returns {number} GET em kcal (2 casas decimais)
 */
function calculateGET(tmb, activityFactor = 1.42) {
  const t = parseFloat(tmb) || 1500;
  const fa = parseFloat(activityFactor) || 1.42;
  return Number((t * fa).toFixed(2));
}

/**
 * 4. Resolução Canônica do Alvo Calórico (Caloric Target)
 * Regra: se houver plano prescrito ativo (> 0), usa a prescrição real; senão, adota o GET.
 * @param {number|null} prescribedKcal - Total calórico somado da prescrição ativa
 * @param {number} getKcal - Gasto energético total estimado
 * @returns {{ caloricTargetKcal: number, source: 'PRESCRIBED' | 'GET_FALLBACK' }}
 */
function calculateCaloricTarget(prescribedKcal, getKcal) {
  const get = Math.round(parseFloat(getKcal) || 2000);
  const presc = (prescribedKcal != null && !isNaN(Number(prescribedKcal)) && Number(prescribedKcal) > 0)
    ? Math.round(Number(prescribedKcal))
    : null;

  if (presc !== null) {
    return {
      caloricTargetKcal: presc,
      source: 'PRESCRIBED'
    };
  }

  return {
    caloricTargetKcal: get,
    source: 'GET_FALLBACK'
  };
}

/**
 * 5. Cálculo do Balanço Energético Canônico
 * @param {number} caloricTargetKcal - Alvo calórico da dieta (ou prescrito)
 * @param {number} getKcal - Gasto energético total
 * @returns {{ energyBalanceKcal: number, status: 'DEFICIT' | 'SURPLUS' | 'MAINTENANCE' }}
 */
function calculateEnergyBalance(caloricTargetKcal, getKcal) {
  const target = Math.round(parseFloat(caloricTargetKcal) || 2000);
  const get = Math.round(parseFloat(getKcal) || 2000);
  const diff = target - get;

  let status = 'MAINTENANCE';
  if (diff < -50) status = 'DEFICIT';
  else if (diff > 50) status = 'SURPLUS';

  return {
    energyBalanceKcal: diff,
    status
  };
}

/**
 * 6. Cálculo da Composição Corporal (Jackson-Pollock 7 Dobras + Equação de Siri)
 * @param {string} gender - 'Masculino' | 'Feminino'
 * @param {number} age - Idade
 * @param {number} weightKg - Peso em kg
 * @param {number} heightM - Altura em metros
 * @param {Object} skinfolds - Dobras cutâneas em mm
 * @returns {Object}
 */
function calculateBodyComposition(gender = "Masculino", age = 30, weightKg = 70, heightM = 1.75, skinfolds = {}) {
  const isMale = String(gender).toLowerCase().startsWith("m");
  const a = Math.max(10, parseFloat(age) || 30);
  const w = Math.max(20, parseFloat(weightKg) || 70);
  const h = Math.max(0.5, parseFloat(heightM) || 1.75);

  const sum7 =
    (parseFloat(skinfolds.chest) || 0) +
    (parseFloat(skinfolds.axillary) || 0) +
    (parseFloat(skinfolds.triceps) || 0) +
    (parseFloat(skinfolds.subscapular) || 0) +
    (parseFloat(skinfolds.abdominal) || 0) +
    (parseFloat(skinfolds.suprailiac) || 0) +
    (parseFloat(skinfolds.thigh) || 0);

  let bodyDensity = 1.08;
  let protocol = "Jackson Pollock 7 dobras";

  if (sum7 > 0) {
    if (isMale) {
      bodyDensity =
        1.112 -
        0.00043499 * sum7 +
        0.00000055 * Math.pow(sum7, 2) -
        0.00028826 * a;
    } else {
      bodyDensity =
        1.097 -
        0.00046971 * sum7 +
        0.00000056 * Math.pow(sum7, 2) -
        0.00012828 * a;
    }
  } else {
    protocol = "Estimativa Básica";
    bodyDensity = isMale ? 1.065 : 1.045;
  }

  if (bodyDensity <= 0 || isNaN(bodyDensity)) {
    bodyDensity = 1.065;
  }

  // Equação de Siri: %Gordura = ((4.95 / Densidade) - 4.50) * 100
  let bodyFatPercent = ((4.95 / bodyDensity) - 4.5) * 100;
  if (bodyFatPercent < 3) bodyFatPercent = 3;
  if (bodyFatPercent > 65) bodyFatPercent = 65;

  const fatMassKg = w * (bodyFatPercent / 100);
  const leanMassKg = Math.max(10, w - fatMassKg);

  const heightSq = h * h;
  const ffmi = heightSq > 0 ? leanMassKg / heightSq : 0;
  const fmi = heightSq > 0 ? fatMassKg / heightSq : 0;

  return {
    protocolEffective: protocol,
    sumSkinfolds: Number(sum7.toFixed(2)),
    bodyDensity: Number(bodyDensity.toFixed(4)),
    bodyFatPercent: Number(bodyFatPercent.toFixed(2)),
    fatMassKg: Number(fatMassKg.toFixed(2)),
    leanMassKg: Number(leanMassKg.toFixed(2)),
    ffmi: Number(ffmi.toFixed(2)),
    fmi: Number(fmi.toFixed(2)),
  };
}

/**
 * 7. Classificação Canônica da Relação Cintura-Estatura (RCEst)
 * @param {number} rcEst
 * @returns {string}
 */
function classifyRCEst(rcEst) {
  const val = parseFloat(rcEst);
  if (isNaN(val) || val <= 0) return "Não informado";
  if (val < 0.40) return "Magreza extrema / Atenção";
  if (val <= 0.50) return "Ideal / Baixo risco cardiovascular";
  if (val <= 0.60) return "Risco aumentado / Sobrepeso-Adiposidade central";
  return "Risco altamente elevado";
}

/**
 * 8. Cálculo de Índices Antropométricos e Proporções Corporais
 * @param {Object} params
 * @returns {Object}
 */
function calculateAnthropometricIndices({
  waistCm = 80,
  hipCm = 100,
  heightM = 1.75,
  weightKg = 70,
  leanMassKg = 55,
  gender = "Masculino",
  age = 30,
  armCircCm = 32,
  tricepsFoldMm = 8,
  calfCircCm = 36
} = {}) {
  const isMale = String(gender).toLowerCase().startsWith("m");
  const h = Math.max(0.5, parseFloat(heightM) || 1.75);
  const w = Math.max(20, parseFloat(weightKg) || 70);
  const a = Math.max(10, parseFloat(age) || 30);
  const heightCm = h * 100;
  const waist = parseFloat(waistCm) || 0;
  const hip = parseFloat(hipCm) || 0;

  // Relação Cintura-Quadril (RCQ)
  const rcq = waist > 0 && hip > 0 ? waist / hip : 0;
  let rcqClass = "Adequado";
  if (isMale && rcq >= 0.90) rcqClass = "Atenção / Risco aumentado";
  if (!isMale && rcq >= 0.85) rcqClass = "Atenção / Risco aumentado";

  // Relação Cintura-Estatura (RCEst)
  const rcEst = waist > 0 && heightCm > 0 ? waist / heightCm : 0;
  const rcEstClass = classifyRCEst(rcEst);

  // Massa Muscular Esquelética (MME - Lee et al.)
  const genderVal = isMale ? 1 : 0;
  const mme = h * (0.244 * w + 7.8) - 0.098 * a + 6.6 * genderVal;
  const immeSmi = h > 0 ? mme / (h * h) : 0;

  // Área Muscular do Braço Corrigida (AMBc)
  const arm = parseFloat(armCircCm) || 30;
  const tri = parseFloat(tricepsFoldMm) || 8;
  const cmb = arm - Math.PI * (tri / 10);
  const sexCorrection = isMale ? 10 : 6.5;
  const ambc = Math.max(1, (Math.pow(cmb, 2) / (4 * Math.PI)) - sexCorrection);

  let muscleScore = 80;
  if (immeSmi > 10.5 && ambc > 35) {
    muscleScore = 95;
  } else if (immeSmi > 8.5) {
    muscleScore = 85;
  }

  // Índice de Conicidade (Valdez 1991)
  const waistM = waist / 100;
  const conicity = (w > 0 && h > 0 && waistM > 0)
    ? waistM / (0.109 * Math.sqrt(w / h))
    : 1.15;
  let conicityClass = conicity < 1.18 ? "Adequado (Sem acúmulo visceral)" :
                      conicity < 1.25 ? "Moderado (Acúmulo abdominal)" : "Elevado (Risco Coronariano / Visceral)";

  return {
    rcq: Number(rcq.toFixed(2)),
    rcqClassification: rcqClass,
    rcEst: Number(rcEst.toFixed(2)),
    rcEstClassification: rcEstClass,
    conicityIndex: Number(conicity.toFixed(2)),
    conicityClassification: conicityClass,
    skeletalMuscleMassKg: Number(mme.toFixed(2)),
    immeSmi: Number(immeSmi.toFixed(2)),
    armMuscularArea: Number(ambc.toFixed(2)),
    calfCircumference: parseFloat(calfCircCm) || 36,
    muscleScore,
  };
}

/**
 * 9. Porcionamento Proporcional de Nutrientes na Base 100g/ml
 * @param {Object} foodItem - Item alimentar da base
 * @param {number} targetQuantity - Quantidade prescrita
 * @returns {Object}
 */
function calculateMacroPortion(foodItem, targetQuantity) {
  const target = parseFloat(targetQuantity) || 0;
  if (!foodItem || target <= 0) {
    return { calories: 0, protein: 0, carbohydrate: 0, lipid: 0, fiber: 0, sodium: 0 };
  }

  const baseQty = parseFloat(foodItem.baseQuantity) || 100;
  const factor = target / baseQty;

  return {
    calories: Number(((parseFloat(foodItem.calories) || 0) * factor).toFixed(2)),
    protein: Number(((parseFloat(foodItem.protein) || 0) * factor).toFixed(2)),
    carbohydrate: Number(((parseFloat(foodItem.carbohydrate) || 0) * factor).toFixed(2)),
    lipid: Number(((parseFloat(foodItem.lipid) || 0) * factor).toFixed(2)),
    fiber: Number(((parseFloat(foodItem.fiber) || 0) * factor).toFixed(2)),
    sodium: Number(((parseFloat(foodItem.sodium) || 0) * factor).toFixed(2)),
  };
}

/**
 * 10. Densidade de Macronutrientes por Peso (g/kg)
 * @param {number} totalGrams
 * @param {number} bodyWeightKg
 * @returns {number}
 */
function calculateMacrosPerKg(totalGrams, bodyWeightKg) {
  const grams = parseFloat(totalGrams) || 0;
  const weight = parseFloat(bodyWeightKg) || 1;
  if (weight <= 0) return 0;
  return Number((grams / weight).toFixed(2));
}

/**
 * 11. Cálculo de Metas de Macronutrientes e Calorias por Objetivo Clínico
 * @param {string} objective
 * @param {string} patientType
 * @param {number} weightKg
 * @param {number} getKcal
 * @param {string} gender
 * @returns {Object}
 */
function calculateDietaryMacroTargets(objective = "Perda de peso", patientType = "Praticante recreativo", weightKg = 70.0, getKcal = 2000, gender = "Masculino") {
  const w = parseFloat(weightKg) || 70.0;
  const get = parseFloat(getKcal) || 2000;
  const obj = String(objective).toLowerCase();
  const type = String(patientType).toLowerCase();

  let caloricTarget = get;
  let targetProtKg = 2.0;
  let targetLipKg = 0.8;
  let objectiveLabel = "Perda de peso";
  let guideline = "Déficit calórico moderado com alta densidade proteica para retenção de massa magra.";

  if (obj.includes("perda") || obj.includes("déficit") || obj.includes("deficit") || obj.includes("cutting") || obj.includes("emagrecimento")) {
    caloricTarget = Math.round(get - (w > 90 ? 550 : 468));
    targetProtKg = (type.includes("alto rendimento") || type.includes("atleta")) ? 2.2 : 2.0;
    targetLipKg = 0.75;
    objectiveLabel = "Perda de Peso (Déficit)";
    guideline = "Déficit calórico de ~450-550 kcal com aporte proteico elevado (2.0-2.2 g/kg) para preservar a massa magra.";
  } else if (obj.includes("hipertrofia") || obj.includes("bulking") || obj.includes("superávit") || obj.includes("superavit") || obj.includes("massa")) {
    caloricTarget = Math.round(get + 350);
    targetProtKg = type.includes("atleta") ? 2.0 : 1.8;
    targetLipKg = 0.9;
    objectiveLabel = "Hipertrofia (Superávit)";
    guideline = "Superávit calórico controlado (+350 kcal) com alto aporte de carboidratos para maximizar a síntese proteica e glicogênio.";
  } else if (obj.includes("recomposição") || obj.includes("recomposicao")) {
    caloricTarget = Math.round(get - 150);
    targetProtKg = 2.2;
    targetLipKg = 0.8;
    objectiveLabel = "Recomposição Corporal";
    guideline = "Leve déficit com aporte proteico alto (2.2 g/kg) e estímulo resistido para queima de gordura e ganho muscular simultâneo.";
  } else if (obj.includes("performance") || obj.includes("esportiva") || obj.includes("atleta")) {
    caloricTarget = Math.round(get + 150);
    targetProtKg = 1.8;
    targetLipKg = 0.9;
    objectiveLabel = "Performance Esportiva";
    guideline = "Aporte prioritário de carboidratos complexos (4.5 a 6.0 g/kg) para suporte à alta demanda glicolítica e recuperação muscular.";
  } else {
    caloricTarget = Math.round(get);
    targetProtKg = 1.6;
    targetLipKg = 0.85;
    objectiveLabel = "Manutenção & Saúde";
    guideline = "Plano normocalórico equilibrado com distribuição harmônica de macronutrientes e fibras.";
  }

  const targetProtG = Math.round(w * targetProtKg);
  const targetLipG = Math.round(w * targetLipKg);

  const kcalProtAndLip = (targetProtG * 4) + (targetLipG * 9);
  const targetCarbG = Math.max(20, Math.round((caloricTarget - kcalProtAndLip) / 4));
  const targetCarbKg = Number((targetCarbG / w).toFixed(2));

  const minFiber = Math.max(25, Math.round((caloricTarget / 1000) * 14));

  return {
    caloricTarget,
    getKcal: Math.round(get),
    targetProtG,
    targetProtKg: Number(targetProtKg.toFixed(2)),
    targetLipG,
    targetLipKg: Number(targetLipKg.toFixed(2)),
    targetCarbG,
    targetCarbKg,
    minFiber,
    objectiveLabel,
    guideline
  };
}

/**
 * 12. Projeção Preditiva de Metas de Peso e Gordura
 * @param {number} currentWeightKg
 * @param {number} currentFatPercent
 * @param {number} targetFatPercent
 * @param {number} getKcal
 * @param {number} targetCaloricIntake
 * @returns {Object}
 */
function calculateGoalProjection(
  currentWeightKg = 116.0,
  currentFatPercent = 6.42,
  targetFatPercent = 10.0,
  getKcal = 4207,
  targetCaloricIntake = 3739
) {
  const weight = Math.max(20, parseFloat(currentWeightKg) || 116.0);
  const currentBF = Math.max(3, Math.min(65, parseFloat(currentFatPercent) || 15.0));
  const targetBF = Math.max(3, Math.min(50, parseFloat(targetFatPercent) || 10.0));
  const get = Math.max(800, parseFloat(getKcal) || 2500);
  const intake = Math.max(800, parseFloat(targetCaloricIntake) || 2000);

  const currentFatMassKg = weight * (currentBF / 100);
  const leanMassKg = weight - currentFatMassKg;

  // Peso Alvo preservando MLG: PesoAlvo = MLG / (1 - TargetBF / 100)
  const targetWeightKg = leanMassKg / (1 - (targetBF / 100));
  const targetFatMassKg = targetWeightKg * (targetBF / 100);
  const fatToLoseKg = weight - targetWeightKg;

  const dailyDeficitKcal = Math.round(get - intake);

  let daysNeeded = 0;
  let weeksNeeded = 0;
  let monthsNeeded = 0;
  let weeklyRateKg = 0;
  let status = "Manutenção";
  let statusBadge = "Manutenção";

  if (fatToLoseKg > 0.1) {
    const totalKcalToDeficit = fatToLoseKg * 7700;

    if (dailyDeficitKcal >= 80) {
      daysNeeded = Math.round(totalKcalToDeficit / dailyDeficitKcal);
      weeksNeeded = Number((daysNeeded / 7).toFixed(1));
      monthsNeeded = Number((daysNeeded / 30.4).toFixed(1));
      weeklyRateKg = Number(((dailyDeficitKcal * 7) / 7700).toFixed(2));

      if (weeklyRateKg > 1.2) {
        status = "Déficit agressivo (> 1.2 kg/sem). Risco aumentado de perda de massa magra.";
        statusBadge = "Agressivo / Atenção";
      } else if (weeklyRateKg >= 0.4) {
        status = "Taxa ideal e sustentável (~0.4 - 1.0 kg/sem) com máxima preservação de massa magra.";
        statusBadge = "Excelente / Sustentável";
      } else {
        status = "Déficit suave (< 0.4 kg/sem). Ideal para recomposição corporal e alta adesão.";
        statusBadge = "Gradual / Recomposição";
      }
    } else {
      const refDeficit = 450;
      const refDays = Math.round(totalKcalToDeficit / refDeficit);
      weeksNeeded = Number((refDays / 7).toFixed(1));
      monthsNeeded = Number((refDays / 30.4).toFixed(1));
      weeklyRateKg = Number(((refDeficit * 7) / 7700).toFixed(2));
      status = "Plano atual sem déficit calórico ativo. Estimativa calculada para déficit clínico padrão de 450 kcal/dia.";
      statusBadge = "Manutenção / Estimativa 450 kcal";
    }
  } else {
    status = "Meta de percentual de gordura atingida ou foco em hipertrofia.";
    statusBadge = "Meta Atingida";
    daysNeeded = 0;
    weeksNeeded = 0;
    monthsNeeded = 0;
    weeklyRateKg = 0;
  }

  return {
    currentWeightKg: Number(weight.toFixed(2)),
    leanMassKg: Number(leanMassKg.toFixed(2)),
    currentFatMassKg: Number(currentFatMassKg.toFixed(2)),
    targetFatPercent: Number(targetBF.toFixed(1)),
    targetWeightKg: Number(targetWeightKg.toFixed(2)),
    targetFatMassKg: Number(targetFatMassKg.toFixed(2)),
    fatToLoseKg: Number(fatToLoseKg.toFixed(2)),
    dailyDeficitKcal: Math.max(0, dailyDeficitKcal),
    daysNeeded,
    weeksNeeded,
    monthsNeeded,
    weeklyRateKg,
    status,
    statusBadge,
  };
}

const canonicalMath = {
  calculateIMC,
  calculateBMI,
  calculateTMB,
  calculateGET,
  calculateCaloricTarget,
  calculateEnergyBalance,
  calculateBodyComposition,
  classifyRCEst,
  calculateAnthropometricIndices,
  calculateMacroPortion,
  calculateMacrosPerKg,
  calculateDietaryMacroTargets,
  calculateGoalProjection
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = canonicalMath;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.math = canonicalMath;
}
