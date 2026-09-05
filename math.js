// math.js - Nutritional & Anthropometric Calculations Library (Strict Validation & NaN Guards)

/**
 * 1. Calculate BMI (IMC) and WHO Classification
 */
function calculateIMC(weightKg, heightM) {
  const w = parseFloat(weightKg) || 0;
  const h = parseFloat(heightM) || 0;

  if (w <= 0 || h <= 0) {
    return { imc: 0, classification: "Dados insuficientes" };
  }

  const imc = w / (h * h);
  let classification = "Eutrofia / Adequado";

  if (imc < 18.5) classification = "Abaixo do peso";
  else if (imc < 25) classification = "Eutrofia / Adequado";
  else if (imc < 30) classification = "Sobrepeso";
  else if (imc < 35) classification = "Obesidade Grau I";
  else if (imc < 40) classification = "Obesidade Grau II";
  else classification = "Obesidade Grau III";

  return {
    imc: Number(imc.toFixed(2)),
    classification,
  };
}

/**
 * 2. Calculate Basal Metabolic Rate (TMB)
 * Uses Katch-McArdle when lean mass (MLG) is provided, otherwise Mifflin-St Jeor.
 */
function calculateTMB(gender = "Masculino", age = 30, weightKg = 70, heightM = 1.75, leanMassKg = 0) {
  const w = parseFloat(weightKg) || 70;
  const h = parseFloat(heightM) || 1.75;
  const a = parseFloat(age) || 30;
  const lbm = parseFloat(leanMassKg) || 0;

  // Katch-McArdle (Preferred when Lean Body Mass is available)
  if (lbm > 0) {
    const tmbKatch = 370 + 21.6 * lbm;
    return {
      tmb: Number(tmbKatch.toFixed(2)),
      method: "Katch-McArdle (Massa Magra)",
    };
  }

  // Mifflin-St Jeor Fallback
  const heightCm = h * 100;
  let tmbMifflin = 10 * w + 6.25 * heightCm - 5 * a;
  if (String(gender).toLowerCase().startsWith("m")) {
    tmbMifflin += 5;
  } else {
    tmbMifflin -= 161;
  }

  if (isNaN(tmbMifflin) || tmbMifflin <= 0) tmbMifflin = 1500;

  return {
    tmb: Number(tmbMifflin.toFixed(2)),
    method: "Mifflin-St Jeor",
  };
}

/**
 * 3. Calculate Total Energy Expenditure (GET)
 */
function calculateGET(tmb, activityFactor = 1.42) {
  const t = parseFloat(tmb) || 1500;
  const fa = parseFloat(activityFactor) || 1.2;
  return Number((t * fa).toFixed(2));
}

/**
 * 4. Calculate Body Composition via Jackson-Pollock 7 and Siri Equation
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

  // Previne divisão por zero ou densidade inválida
  if (bodyDensity <= 0 || isNaN(bodyDensity)) {
    bodyDensity = 1.065;
  }

  // Siri Formula: % Body Fat = ((4.95 / Density) - 4.50) * 100
  let bodyFatPercent = ((4.95 / bodyDensity) - 4.5) * 100;
  if (bodyFatPercent < 3) bodyFatPercent = 3;
  if (bodyFatPercent > 65) bodyFatPercent = 65;

  const fatMassKg = w * (bodyFatPercent / 100);
  const leanMassKg = Math.max(10, w - fatMassKg);

  // FFMI & FMI
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
 * Classificação Canônica da Relação Cintura-Estatura (RCEst) - Padrão NutriAx Pro
 * RCEst = cintura (cm) / estatura (cm)
 * - RCEst < 0.40  -> "Magreza extrema / Atenção"
 * - 0.40 <= RCEst <= 0.50 -> "Ideal / Baixo risco cardiovascular"
 * - 0.50 < RCEst <= 0.60  -> "Risco aumentado / Sobrepeso-Adiposidade central"
 * - RCEst > 0.60  -> "Risco altamente elevado"
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
 * 5. Calculate Anthropometric Ratios & Indices
 */
function calculateAnthropometricIndices(
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
) {
  const isMale = String(gender).toLowerCase().startsWith("m");
  const h = Math.max(0.5, parseFloat(heightM) || 1.75);
  const w = Math.max(20, parseFloat(weightKg) || 70);
  const a = Math.max(10, parseFloat(age) || 30);
  const heightCm = h * 100;
  const waist = parseFloat(waistCm) || 0;
  const hip = parseFloat(hipCm) || 0;

  // Waist-to-Hip Ratio (RCQ)
  const rcq = waist > 0 && hip > 0 ? waist / hip : 0;
  let rcqClass = "Adequado";
  if (isMale && rcq >= 0.9) rcqClass = "Atenção / Risco aumentado";
  if (!isMale && rcq >= 0.85) rcqClass = "Atenção / Risco aumentado";

  // Waist-to-Height Ratio (RCEst = cintura / estatura em cm)
  const rcEst = waist > 0 && heightCm > 0 ? waist / heightCm : 0;
  const rcEstClass = classifyRCEst(rcEst);

  // Skeletal Muscle Mass (MME - Lee et al.)
  const genderVal = isMale ? 1 : 0;
  const mme = h * (0.244 * w + 7.8) - 0.098 * a + 6.6 * genderVal;
  const immeSmi = h > 0 ? mme / (h * h) : 0;

  // Corrected Arm Muscle Area (AMBc)
  const arm = parseFloat(armCircCm) || 30;
  const tri = parseFloat(tricepsFoldMm) || 8;
  const cmb = arm - Math.PI * (tri / 10);
  const sexCorrection = isMale ? 10 : 6.5;
  const ambc = Math.max(1, (Math.pow(cmb, 2) / (4 * Math.PI)) - sexCorrection);

  // Anthropometric Muscle Score (0 - 100)
  let muscleScore = 80;
  if (immeSmi > 10.5 && ambc > 35) {
    muscleScore = 95;
  } else if (immeSmi > 8.5) {
    muscleScore = 85;
  }

  // Conicity Index (Valdez 1991)
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
 * 5.1 Multi-Method Basal Metabolic Rate (TMB) Comparison
 */
function calculateTMBMultiMethod(gender = "Masculino", age = 30, weightKg = 70, heightM = 1.75, leanMassKg = 0) {
  const isMale = String(gender).toLowerCase().startsWith("m");
  const w = Math.max(20, parseFloat(weightKg) || 70);
  const h = Math.max(0.5, parseFloat(heightM) || 1.75);
  const a = Math.max(10, parseFloat(age) || 30);
  const lbm = parseFloat(leanMassKg) || (w * (isMale ? 0.80 : 0.72));
  const hCm = h * 100;

  // 1. Katch-McArdle (LBM)
  const katch = 370 + 21.6 * lbm;

  // 2. Cunningham (Athletes LBM)
  const cunningham = 500 + 22 * lbm;

  // 3. Mifflin-St Jeor
  let mifflin = 10 * w + 6.25 * hCm - 5 * a + (isMale ? 5 : -161);

  // 4. Harris-Benedict (Revisada Roza & Shizgal 1984)
  let harris = isMale
    ? 88.362 + (13.397 * w) + (4.799 * hCm) - (5.677 * a)
    : 447.593 + (9.247 * w) + (3.098 * hCm) - (4.330 * a);

  return {
    katch: Math.round(katch),
    cunningham: Math.round(cunningham),
    mifflin: Math.round(mifflin),
    harris: Math.round(harris),
  };
}

/**
 * 5.2 Anthropometric Clinical Alerts & Diagnostic Guidance
 */
function getAnthropometricClinicalAlerts(indices = {}, bodyComp = {}, gender = "Masculino") {
  const alerts = [];
  const isMale = String(gender).toLowerCase().startsWith("m");

  // RCEst
  if (indices.rcEst >= 0.60) {
    alerts.push({
      type: "risk",
      badge: "ALTO RISCO",
      title: "Risco Cardiometabólico & Visceral Severo (RCEst >= 0.60)",
      message: `RCEst em <strong>${indices.rcEst}</strong> indica acúmulo adiposo intra-abdominal acentuado, associado a maior risco de resistência à insulina e esteatose hepática.`,
      recommendation: "Priorizar redução de gordura visceral com déficit calórico moderado contínuo e treinamento resistido progressivo."
    });
  } else if (indices.rcEst >= 0.50) {
    alerts.push({
      type: "warning",
      badge: "ATENÇÃO",
      title: "Relação Cintura-Estatura Limítrofe (RCEst >= 0.50)",
      message: `RCEst em <strong>${indices.rcEst}</strong> acima do ponto de corte ideal (< 0.50).`,
      recommendation: "Foco na redução da circunferência abdominal para atingir RCEst < 0.50."
    });
  } else {
    alerts.push({
      type: "optimal",
      badge: "ADEQUADO",
      title: "Risco Cardiometabólico Central Baixo (RCEst < 0.50)",
      message: `RCEst em <strong>${indices.rcEst}</strong> dentro da faixa de proteção cardiovascular e saúde metabólica.`,
      recommendation: "Manter composição corporal atual e foco na consolidação de massa muscular."
    });
  }

  // RCQ
  const isHighRcq = isMale ? indices.rcq >= 0.95 : indices.rcq >= 0.85;
  if (isHighRcq) {
    alerts.push({
      type: "warning",
      badge: "PADRÃO ANDRÓIDE",
      title: "Distribuição Adiposa Andróide (Tronco/Central)",
      message: `RCQ de <strong>${indices.rcq}</strong> reflete predomínio de gordura na região superior do tronco.`,
      recommendation: "Combinar restrição energética balanceada com controle glicêmico e aumento do NEAT diário."
    });
  }

  // FFMI & Reserva Muscular
  if (bodyComp.ffmi >= 22 && isMale || bodyComp.ffmi >= 18 && !isMale) {
    alerts.push({
      type: "optimal",
      badge: "ALTA RESERVA",
      title: "Excelente Reserva de Massa Muscular (FFMI Elevado)",
      message: `FFMI em <strong>${bodyComp.ffmi}</strong> indica excelente desenvolvimento muscular esquelético e alta taxa metabólica funcional.`,
      recommendation: "Manter aporte proteico alto (1.8 a 2.2 g/kg) para preservar a massa magra durante fases de emagrecimento."
    });
  } else if (bodyComp.ffmi < 17 && isMale || bodyComp.ffmi < 14 && !isMale) {
    alerts.push({
      type: "warning",
      badge: "RESERVA BAIXA",
      title: "Reserva Muscular Antropométrica Reduzida",
      message: `FFMI em <strong>${bodyComp.ffmi}</strong> abaixo da média populacional saudável.`,
      recommendation: "Estimular hipertrofia muscular com superávit leve ou normocaloria hiperproteica combinada com musculação."
    });
  }

  return alerts;
}

/**
 * 6. Calculate NutriAx Metabolic Performance Index (0 - 100) & Estimated Age
 */
function calculateNutriAxIndex(
  bodyFatPercent = 15,
  ffmi = 22,
  tmbRatio = 1.0,
  rcEst = 0.48,
  imc = 24.5,
  muscleScore = 85,
  chronologicalAge = 30
) {
  const bf = parseFloat(bodyFatPercent) || 15;
  const f = parseFloat(ffmi) || 22;
  const tr = parseFloat(tmbRatio) || 1.0;
  const rce = parseFloat(rcEst) || 0.48;
  const i = parseFloat(imc) || 24.5;
  const ms = parseFloat(muscleScore) || 80;
  const age = parseFloat(chronologicalAge) || 30;

  let scoreBodyFat = 70;
  if (bf <= 7) scoreBodyFat = 75;
  else if (bf <= 15) scoreBodyFat = 100;
  else if (bf <= 20) scoreBodyFat = 85;
  else scoreBodyFat = 60;

  let scoreFFMI = 85;
  if (f >= 25) scoreFFMI = 100;
  else if (f >= 20) scoreFFMI = 85;
  else scoreFFMI = 70;

  const scoreTMB = Math.min(100, Math.max(40, Math.round(tr * 100)));

  let scoreCentralRisk = 94;
  if (rce < 0.5) scoreCentralRisk = 94;
  else if (rce < 0.55) scoreCentralRisk = 75;
  else scoreCentralRisk = 50;

  let scoreIMC = 90;
  if (i < 18.5) scoreIMC = 70;
  else if (i <= 24.9) scoreIMC = 100;
  else if (i <= 29.9) scoreIMC = 80;
  else scoreIMC = 60;

  const index =
    scoreBodyFat * 0.3 +
    scoreFFMI * 0.2 +
    scoreTMB * 0.2 +
    scoreCentralRisk * 0.15 +
    ms * 0.1 +
    scoreIMC * 0.05;

  const finalIndex = Math.min(100, Math.max(10, Math.round(index)));
  const ageDiff = finalIndex >= 85 ? -8 : finalIndex >= 70 ? -3 : 2;
  const metabolicAge = Math.max(18, age + ageDiff);

  return {
    nutriAxIndex: finalIndex,
    classification: finalIndex >= 85 ? "Muito bom" : finalIndex >= 70 ? "Bom" : "Atenção",
    estimatedMetabolicAge: metabolicAge,
    ageDifference: ageDiff,
    radarScores: {
      bodyComposition: scoreBodyFat,
      relativeMuscle: scoreFFMI,
      metabolicPotential: scoreTMB,
      centralRisk: scoreCentralRisk,
      imcComplementary: scoreIMC,
      muscleReserve: ms,
    },
    mainLimiter: scoreBodyFat < 75 ? "Composição corporal" : "Risco central",
    limiterSeverity: scoreBodyFat,
  };
}

/**
 * 7. Scale macro portion from base quantity (100g/ml) to target quantity
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
 * 7.1 Calculate Macro Per-Kilogram Density (g/kg)
 */
function calculateMacrosPerKg(totalGrams, bodyWeightKg) {
  const grams = parseFloat(totalGrams) || 0;
  const weight = parseFloat(bodyWeightKg) || 1;
  if (weight <= 0) return 0;
  return Number((grams / weight).toFixed(2));
}

/**
 * 8. Smart Household & Unit Measures Converter
 * Converts Units (Unid, Fatias, Colheres, Scoops, Conchas, etc.) to Grams/ml
 */
const foodUnitWeights = {
  // Ovos
  "ovo de galinha": { unid: 50, col_sopa: 30 },
  "clara de ovo": { unid: 35, col_sopa: 25 },
  "gema de ovo": { unid: 15, col_sopa: 15 },
  "ovo de codorna": { unid: 10 },

  // Frutas
  "banana": { unid: 70, fatia: 20 },
  "maçã": { unid: 130, fatia: 25 },
  "maca": { unid: 130, fatia: 25 },
  "laranja": { unid: 130 },
  "mamão": { unid: 300, fatia: 100 },
  "mamao": { unid: 300, fatia: 100 },
  "abacate": { unid: 350, col_sopa: 30, fatia: 50 },
  "morango": { unid: 15 },
  "kiwi": { unid: 75 },
  "pera": { unid: 130 },
  "goiaba": { unid: 120 },
  "abacaxi": { fatia: 80, unid: 900 },
  "melancia": { fatia: 150 },
  "melão": { fatia: 100 },
  "melao": { fatia: 100 },
  "manga": { unid: 200, fatia: 40 },

  // Pães e Massas
  "pão francês": { unid: 50 },
  "pao frances": { unid: 50 },
  "pão de forma": { fatia: 25, unid: 25 },
  "pao de forma": { fatia: 25, unid: 25 },
  "pão 100% integral": { fatia: 25, unid: 25 },
  "pao 100% integral": { fatia: 25, unid: 25 },
  "rap10": { unid: 35, fatia: 35 },
  "tortilha": { unid: 35 },
  "torrada": { unid: 10, fatia: 10 },
  "pão sírio": { unid: 50 },
  "pao sirio": { unid: 50 },
  "tapioca": { col_sopa: 20, unid: 60 },
  "macarrão": { col_sopa: 25, xicara: 140 },
  "macarrao": { col_sopa: 25, xicara: 140 },

  // Cereais e Leguminosas
  "arroz": { col_sopa: 25, concha: 120, xicara: 150 },
  "feijão": { col_sopa: 20, concha: 130, xicara: 140 },
  "feijao": { col_sopa: 20, concha: 130, xicara: 140 },
  "grão-de-bico": { col_sopa: 25, concha: 130 },
  "grao-de-bico": { col_sopa: 25, concha: 130 },
  "lentilha": { col_sopa: 25, concha: 130 },
  "aveia": { col_sopa: 15, col_sobremesa: 10, col_cha: 5, xicara: 80 },
  "quinoa": { col_sopa: 25, concha: 120 },
  "cuscuz": { col_sopa: 30, fatia: 80, xicara: 120 },

  // Tubérculos
  "batata": { unid: 120, col_sopa: 30, fatia: 40 },
  "mandioca": { unid: 80, pedaco: 80, col_sopa: 35 },
  "inhame": { unid: 100, pedaco: 80 },

  // Carnes, Aves e Peixes
  "frango": { file: 100, bife: 100, unid: 100, col_sopa: 25 },
  "patinho": { file: 100, bife: 100, col_sopa: 25 },
  "alcatra": { file: 100, bife: 100 },
  "filé": { file: 100, bife: 100, unid: 100 },
  "file": { file: 100, bife: 100, unid: 100 },
  "tilápia": { file: 100, unid: 100 },
  "tilapia": { file: 100, unid: 100 },
  "salmão": { file: 120, unid: 120 },
  "salmao": { file: 120, unid: 120 },
  "atum": { col_sopa: 30, lata: 120, unid: 120 },
  "sardinha": { unid: 40, lata: 125 },

  // Laticínios e Queijos
  "leite": { copo: 200, xicara: 150, col_sopa: 15 },
  "iogurte": { copo: 200, pote: 160, unid: 160, col_sopa: 20 },
  "queijo": { fatia: 30, col_sopa: 25, unid: 30 },
  "requeijão": { col_sopa: 30, col_sobremesa: 15, col_cha: 8 },
  "requeijao": { col_sopa: 30, col_sobremesa: 15, col_cha: 8 },
  "cottage": { col_sopa: 30, col_sobremesa: 15 },
  "ricota": { fatia: 40, col_sopa: 30 },

  // Gorduras e Pastas
  "azeite": { col_sopa: 10, col_sobremesa: 5, col_cha: 3 },
  "óleo": { col_sopa: 10, col_sobremesa: 5, col_cha: 3 },
  "oleo": { col_sopa: 10, col_sobremesa: 5, col_cha: 3 },
  "manteiga": { col_sopa: 15, col_sobremesa: 8, col_cha: 4, ponta_faca: 5 },
  "pasta de amendoim": { col_sopa: 15, col_sobremesa: 10, col_cha: 5 },
  "castanha": { unid: 4 },
  "amêndoa": { unid: 1.5 },
  "amendoa": { unid: 1.5 },
  "chia": { col_sopa: 10, col_sobremesa: 5, col_cha: 3 },
  "linhaça": { col_sopa: 10, col_sobremesa: 5, col_cha: 3 },
  "linhaca": { col_sopa: 10, col_sobremesa: 5, col_cha: 3 },

  // Suplementos
  "whey": { scoop: 30, dosador: 30, unid: 30, col_sopa: 15 },
  "albumina": { scoop: 30, dosador: 30, unid: 30, col_sopa: 15 },
  "creatina": { scoop: 5, dosador: 5, col_cha: 3, col_cafe: 1 },
  "glutamina": { scoop: 5, dosador: 5 },
  "caseína": { scoop: 30, dosador: 30 },
  "caseina": { scoop: 30, dosador: 30 },
  "yopro": { unid: 250, garrafa: 250, pote: 160 },
  "barra de proteína": { unid: 40, barra: 40 },
  "barra de proteina": { unid: 40, barra: 40 }
};

/**
 * Converts user quantity and chosen unit into Grams/ml
 */
function convertFoodUnitToGrams(foodItem, quantity, unitType = "g") {
  const qty = parseFloat(quantity) || 0;
  if (qty <= 0) return { grams: 0, unitLabel: "0g" };

  if (unitType === "g" || unitType === "ml") {
    return { grams: qty, unitLabel: `${qty}${unitType}` };
  }

  const nameLower = (foodItem?.name || "").toLowerCase();
  let unitWeight = 100; // fallback padrão

  // Procura padrão correspondente no dicionário
  for (const [key, mapping] of Object.entries(foodUnitWeights)) {
    if (nameLower.includes(key)) {
      if (mapping[unitType]) {
        unitWeight = mapping[unitType];
        break;
      } else if (unitType === "unid" && (mapping.file || mapping.fatia || mapping.pote || mapping.lata)) {
        unitWeight = mapping.file || mapping.fatia || mapping.pote || mapping.lata || 100;
        break;
      }
    }
  }

  // Fallbacks genéricos para unidades comuns
  if (unitWeight === 100) {
    if (unitType === "col_sopa") unitWeight = 20;
    else if (unitType === "col_sobremesa") unitWeight = 10;
    else if (unitType === "col_cha") unitWeight = 5;
    else if (unitType === "fatia") unitWeight = 30;
    else if (unitType === "concha") unitWeight = 120;
    else if (unitType === "scoop") unitWeight = 30;
    else if (unitType === "copo") unitWeight = 200;
    else if (unitType === "xicara") unitWeight = 150;
    else if (unitType === "file") unitWeight = 100;
    else if (unitType === "unid") unitWeight = 50;
  }

  const totalGrams = Number((qty * unitWeight).toFixed(1));
  const unitNames = {
    unid: qty === 1 ? "unidade" : "unidades",
    fatia: qty === 1 ? "fatia" : "fatias",
    col_sopa: qty === 1 ? "col. sopa" : "col. sopa",
    col_sobremesa: qty === 1 ? "col. sobremesa" : "col. sobremesa",
    col_cha: qty === 1 ? "col. chá" : "col. chá",
    concha: qty === 1 ? "concha" : "conchas",
    scoop: qty === 1 ? "scoop (dosador)" : "scoops (dosadores)",
    copo: qty === 1 ? "copo (200ml)" : "copos (200ml)",
    xicara: qty === 1 ? "xícara" : "xícaras",
    file: qty === 1 ? "filé/bife" : "filés/bifes"
  };

  const label = `${qty} ${unitNames[unitType] || unitType} (${totalGrams}g)`;
  return { grams: totalGrams, unitLabel: label, unitWeight };
}

/**
 * 9. Clinical Exams Intelligence & Nutritional Conducts Engine
 * Analyzes laboratory biomarkers and returns actionable clinical alerts and nutritional strategies.
 */
function analyzeClinicalExams(examsData = {}) {
  const alerts = [];

  const glucose = parseFloat(examsData.fastingGlucose) || 0;
  const insulin = parseFloat(examsData.fastingInsulin) || 0;
  const hba1c = parseFloat(examsData.hba1c) || 0;
  const ldl = parseFloat(examsData.ldl) || 0;
  const hdl = parseFloat(examsData.hdl) || 0;
  const totalChol = parseFloat(examsData.totalCholesterol) || 0;
  const trig = parseFloat(examsData.triglycerides) || 0;
  const tgo = parseFloat(examsData.tgo) || 0;
  const tgp = parseFloat(examsData.tgp) || 0;
  const urea = parseFloat(examsData.urea) || 0;
  const creatinine = parseFloat(examsData.creatinine) || 0;
  const uricAcid = parseFloat(examsData.uricAcid) || 0;
  const ferritin = parseFloat(examsData.ferritin) || 0;
  const vitD = parseFloat(examsData.vitaminD) || 0;
  const vitB12 = parseFloat(examsData.vitaminB12) || 0;
  const tsh = parseFloat(examsData.tsh) || 0;

  // 1. Painel Glicêmico & Resistência à Insulina
  const homaIR = (glucose > 0 && insulin > 0) ? Number(((glucose * insulin) / 405).toFixed(2)) : 0;

  if (glucose > 125 || hba1c >= 6.5) {
    alerts.push({
      id: "glycemic_risk",
      title: "Hiperglicemia / Risco Diabético Marcado",
      type: "risk",
      badge: "Risco Clínico",
      marker: `Glicemia: ${glucose} mg/dL | HbA1c: ${hba1c}%`,
      recommendation: "Priorizar carboidratos de baixo índice glicêmico e alto teor de fibras (min. 35g/dia). Fracionar o aporte de carboidratos, eliminar açúcares simples e bebidas açucaradas. Recomenda-se acompanhamento médico conjunto."
    });
  } else if (glucose > 99 || hba1c >= 5.7 || homaIR > 2.5) {
    alerts.push({
      id: "glycemic_warning",
      title: "Metabolismo Glicêmico Limítrofe / Resistência Insulínica",
      type: "warning",
      badge: "Atenção Metabólica",
      marker: `Glicemia: ${glucose} mg/dL | HbA1c: ${hba1c}% ${homaIR > 0 ? `| HOMA-IR: ${homaIR}` : ""}`,
      recommendation: "Priorizar carboidratos de baixo IG associados a fibras solúveis (aveia, psyllium, sementes de chia), reduzir sacarose e introduzir canela e vinagre de maçã às refeições principais."
    });
  }

  // 2. Perfil Lipídico & Risco Aterogênico
  if (ldl > 160 || trig > 300 || totalChol > 240) {
    alerts.push({
      id: "lipid_risk",
      title: "Dislipidemia Significativa / LDL Elevado",
      type: "risk",
      badge: "Risco Cardiovascular",
      marker: `LDL: ${ldl} mg/dL | Triglicerídeos: ${trig} mg/dL | Colesterol: ${totalChol} mg/dL`,
      recommendation: "Restringir gorduras saturadas a < 7% do VET e zerar gorduras trans. Aumentar fitoesteróis, gorduras monoinsaturadas (azeite de oliva extravirgem, abacate) e fontes ricas de Ômega-3 (EPA/DHA)."
    });
  } else if (ldl > 130 || trig > 150 || (hdl > 0 && hdl < 40)) {
    alerts.push({
      id: "lipid_warning",
      title: "Perfil Lipídico Alterado / Dislipidemia Leve a Moderada",
      type: "warning",
      badge: "Atenção Lipídica",
      marker: `LDL: ${ldl} mg/dL | Triglicerídeos: ${trig} mg/dL | HDL: ${hdl} mg/dL`,
      recommendation: "Aumentar fibras solúveis (beta-glucanas de aveia) para retenção de sais biliares, reduzir carboidratos refinados e aumentar atividade física aeróbica para elevação do HDL."
    });
  }

  // 3. Vitaminas & Micronutrientes Críticos
  if (vitD > 0 && vitD < 20) {
    alerts.push({
      id: "vitd_risk",
      title: "Deficiência Grave de Vitamina D (< 20 ng/mL)",
      type: "risk",
      badge: "Deficiência Nutricional",
      marker: `Vitamina D 25-OH: ${vitD} ng/mL (Ideal: 30 - 60 ng/mL)`,
      recommendation: "Avaliar suplementação terapêutica de Vitamina D3 (5.000 a 7.000 UI/dia por 8-12 semanas) associada a Vitamina K2 (MK-7) e Magnésio."
    });
  } else if (vitD > 0 && vitD < 30) {
    alerts.push({
      id: "vitd_warning",
      title: "Insuficiência de Vitamina D (20 - 29 ng/mL)",
      type: "warning",
      badge: "Suplementação Sugerida",
      marker: `Vitamina D 25-OH: ${vitD} ng/mL (Meta: >= 30 ng/mL)`,
      recommendation: "Avaliar suplementação diária de manutenção de Vitamina D3 (2.000 a 4.000 UI/dia) e orientação de exposição solar orientada."
    });
  }

  if (vitB12 > 0 && vitB12 < 300) {
    alerts.push({
      id: "vitb12_warning",
      title: "Vitamina B12 Limítrofe / Subótima (< 300 pg/mL)",
      type: "warning",
      badge: "Atenção Neuro/Energia",
      marker: `Vitamina B12: ${vitB12} pg/mL (Meta funcional: > 450 pg/mL)`,
      recommendation: "Avaliar suplementação oral de Metilcobalamina (500 a 1000 mcg/dia) e incentivar consumo de carnes magras, ovos e laticínios."
    });
  }

  if (ferritin > 0 && ferritin < 30) {
    alerts.push({
      id: "ferritin_warning",
      title: "Reserva de Ferro Baixa / Ferritina < 30 ng/mL",
      type: "warning",
      badge: "Reserva Férrica",
      marker: `Ferritina: ${ferritin} ng/mL (Meta: > 50 ng/mL)`,
      recommendation: "Aumentar fontes de ferro heme (carnes vermelhas magras, fígado) associadas a fontes de Vitamina C (limão, laranja). Evitar café, chás escuros e cálcio concomitante às refeições principais."
    });
  }

  // 4. Função Hepática
  if (tgo > 40 || tgp > 40) {
    alerts.push({
      id: "hepatic_warning",
      title: "Transaminases Hepáticas Elevadas (TGO / TGP)",
      type: "warning",
      badge: "Sobrecarga Hepática",
      marker: `TGO: ${tgo} U/L | TGP: ${tgp} U/L (Referência: <= 40 U/L)`,
      recommendation: "Reduzir produtos ultraprocessados, frituras, xarope de milho/frutose concentrada e álcool. Avaliar suporte com fitoterápicos hepatoprotetores (Silimarina, Curcumina, NAC)."
    });
  }

  // 5. Função Renal & Ácido Úrico
  if (creatinine > 1.3 || urea > 50) {
    alerts.push({
      id: "renal_warning",
      title: "Sobrecarga Renal / Ureia ou Creatinina Limítrofe",
      type: "warning",
      badge: "Atenção Renal",
      marker: `Creatinina: ${creatinine} mg/dL | Ureia: ${urea} mg/dL`,
      recommendation: "Aumentar a meta de hidratação diária (min. 40-45 ml/kg de peso). Ajustar o aporte proteico da dieta sem excessos acima de 2.0g/kg até reavaliação médica."
    });
  }

  if (uricAcid > 7.0) {
    alerts.push({
      id: "uric_warning",
      title: "Hiperuricemia / Ácido Úrico Elevado",
      type: "warning",
      badge: "Metabolismo de Purinas",
      marker: `Ácido Úrico: ${uricAcid} mg/dL (Referência: <= 7.0 mg/dL)`,
      recommendation: "Restringir miúdos, frutos do mar em excesso, embutidos, bebidas alcoólicas (especialmente cerveja) e bebidas adoçadas com frutose."
    });
  }

  // 6. Caso tudo esteja ótimo
  if (alerts.length === 0) {
    alerts.push({
      id: "all_optimal",
      title: "Perfil Metabólico & Bioquímico Excelente",
      type: "optimal",
      badge: "Parâmetros Ideais",
      marker: "Todos os biomarcadores analisados estão dentro das faixas ideais",
      recommendation: "Manter a estratégia nutricional de manutenção e rotina de estilo de vida saudável. Reavaliação laboratorial periódica recomendada em 6 a 12 meses."
    });
  }

  const riskCount = alerts.filter(a => a.type === "risk").length;
  const warningCount = alerts.filter(a => a.type === "warning").length;
  const optimalCount = alerts.filter(a => a.type === "optimal").length;

  return {
    alerts,
    riskCount,
    warningCount,
    optimalCount,
    totalCount: alerts.length,
    homaIR
  };
}

/**
 * 10. Predictive Goal & Time-to-Target Projection Engine
 * Calculates estimated target weight, fat mass to lose, caloric deficit, and time required in weeks/months.
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

  // Massa Livre de Gordura (MLG) Atual
  const currentFatMassKg = weight * (currentBF / 100);
  const leanMassKg = weight - currentFatMassKg;

  // Peso Alvo assumindo 100% de preservação de Massa Magra
  // PesoAlvo = MLG / (1 - TargetBF / 100)
  const targetWeightKg = leanMassKg / (1 - (targetBF / 100));
  const targetFatMassKg = targetWeightKg * (targetBF / 100);
  const fatToLoseKg = weight - targetWeightKg;

  // Déficit Calórico Diário Arredondado (GET - Alvo Prescrito)
  const dailyDeficitKcal = Math.round(get - intake);

  let daysNeeded = 0;
  let weeksNeeded = 0;
  let monthsNeeded = 0;
  let weeklyRateKg = 0;
  let status = "Manutenção";
  let statusBadge = "Manutenção";

  if (fatToLoseKg > 0.1) {
    // 1kg de gordura pura estocada = ~7700 kcal de déficit energético
    const totalKcalToDeficit = fatToLoseKg * 7700;

    // Só projeta tempo se o déficit for clinicamente relevante (>= 80 kcal/dia)
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
      // Sem déficit direto configurado (plano normocalórico ou superávit)
      // Calcula projeção baseada no déficit clínico padrão recomendado de 450 kcal/dia (~0.4 kg/sem)
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
    statusBadge
  };
}

/**
 * 11. Meal Nutrition Strategy & Macro Targets Distribution Map
 */
const mealStrategies = {
  "Café da manhã": {
    pct: 0.20,
    label: "Desjejum",
    guideline: "Proteínas de alto VB + carboidratos de baixo IG e frutas ricas em polifenóis."
  },
  "Lanche manhã": {
    pct: 0.10,
    label: "Intermediária",
    guideline: "Saciedade e praticidade: proteínas de absorção média e gorduras boas (oleaginosas)."
  },
  "Almoço": {
    pct: 0.30,
    label: "Principal",
    guideline: "Alta densidade de micronutrientes, vegetais folhosos, leguminosas e fonte proteica magra."
  },
  "Lanche tarde": {
    pct: 0.10,
    label: "Intermediária",
    guideline: "Aporte proteico intermediário e sustentação glicêmica vespertina."
  },
  "Pré-treino": {
    pct: 0.10,
    label: "Performance",
    guideline: "Carboidratos de fácil digestão, baixo teor de gorduras e fibras para rápido esvaziamento gástrico."
  },
  "Pós-treino": {
    pct: 0.15,
    label: "Janela Anabólica",
    guideline: "Foco em proteínas de rápida absorção e carboidratos para recuperação e ressíntese de glicogênio."
  },
  "Jantar": {
    pct: 0.20,
    label: "Noturna",
    guideline: "Proteínas magras, vegetais e carboidratos de lenta absorção com controle de lipídios."
  },
  "Ceia": {
    pct: 0.05,
    label: "Modulação Sono",
    guideline: "Proteínas de lenta digestão (caseína/albumina), fontes de triptofano e fibras."
  }
};

/**
 * 12. Adherence & Nutritional Compliance Engine
 * Analyzes patient check-in logs and computes KPI scores, error-prone meals, and hydration adherence.
 */
function calculateAdherenceScore(dailyLogs = []) {
  if (!dailyLogs || dailyLogs.length === 0) {
    return {
      adherenceRate: 100,
      totalMealsTracked: 0,
      followedMealsCount: 0,
      modifiedMealsCount: 0,
      missedMealsCount: 0,
      mostProblematicMeal: "Nenhum erro registrado",
      hydrationDaysMet: 0,
      hydrationTotalDays: 0,
      hydrationPercent: 100,
      classification: "Sem registros",
      classificationBadge: "bg-slate-100 text-slate-700"
    };
  }

  let totalMeals = 0;
  let followedMeals = 0;
  let modifiedMeals = 0;
  let missedMeals = 0;
  const mealFailures = {};
  let hydrationDaysMet = 0;
  const hydrationTotalDays = dailyLogs.length;

  dailyLogs.forEach((dayLog) => {
    if (dayLog.hydrationMet) {
      hydrationDaysMet++;
    }

    if (Array.isArray(dayLog.meals)) {
      dayLog.meals.forEach((meal) => {
        totalMeals++;
        const mealKey = meal.mealName || "Refeição";
        if (!mealFailures[mealKey]) {
          mealFailures[mealKey] = { missed: 0, modified: 0, total: 0 };
        }
        mealFailures[mealKey].total++;

        if (meal.status === "followed") {
          followedMeals++;
        } else if (meal.status === "modified") {
          modifiedMeals++;
          mealFailures[mealKey].modified++;
        } else if (meal.status === "missed") {
          missedMeals++;
          mealFailures[mealKey].missed++;
        }
      });
    }
  });

  // Cálculo da Taxa de Adesão: Followed ganha peso 1.0, Modified ganha peso 0.5, Missed ganha 0.0
  const scoreRaw = totalMeals > 0 ? ((followedMeals * 1.0 + modifiedMeals * 0.5) / totalMeals) * 100 : 100;
  const adherenceRate = Number(scoreRaw.toFixed(1));

  // Identifica a refeição com maior taxa de erro
  let mostProblematicMeal = "Nenhuma falha registrada";
  let maxErrors = 0;

  Object.keys(mealFailures).forEach((m) => {
    const errCount = mealFailures[m].missed * 2 + mealFailures[m].modified;
    if (errCount > maxErrors) {
      maxErrors = errCount;
      mostProblematicMeal = `${m} (${mealFailures[m].missed} furos, ${mealFailures[m].modified} trocas)`;
    }
  });

  const hydrationPercent = hydrationTotalDays > 0 ? Math.round((hydrationDaysMet / hydrationTotalDays) * 100) : 100;

  let classification = "Excelente Adesão";
  let classificationBadge = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";

  if (adherenceRate < 60) {
    classification = "Adesão Crítica";
    classificationBadge = "bg-rose-500/20 text-rose-300 border-rose-500/30";
  } else if (adherenceRate < 80) {
    classification = "Atenção / Oscilação";
    classificationBadge = "bg-amber-500/20 text-amber-300 border-amber-500/30";
  }

  return {
    adherenceRate,
    totalMealsTracked: totalMeals,
    followedMealsCount: followedMeals,
    modifiedMealsCount: modifiedMeals,
    missedMealsCount: missedMeals,
    mostProblematicMeal,
    hydrationDaysMet,
    hydrationTotalDays,
    hydrationPercent,
    classification,
    classificationBadge
  };
}

/**
 * 15. Clinical Macro Distribution Engine by Patient Objective & Profile
 * Standardized across ISSN, ACSM, SBAN and Clinical Nutrition Consensus
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
    caloricTarget = Math.round(get - 150); // Leve déficit para viabilizar queima de gordura com hipertrofia
    targetProtKg = 2.2; // Alta densidade proteica indispensável para recomposição
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
    // Manutenção e Saúde / Eutrofia
    caloricTarget = Math.round(get);
    targetProtKg = 1.6;
    targetLipKg = 0.85;
    objectiveLabel = "Manutenção & Saúde";
    guideline = "Plano normocalórico equilibrado com distribuição harmônica de macronutrientes e fibras.";
  }

  // Gramas de Proteína e Lipídios
  const targetProtG = Math.round(w * targetProtKg);
  const targetLipG = Math.round(w * targetLipKg);

  // Carboidratos como saldo energético restante: (Kcal - (P*4 + L*9)) / 4
  const kcalProtAndLip = (targetProtG * 4) + (targetLipG * 9);
  const targetCarbG = Math.max(20, Math.round((caloricTarget - kcalProtAndLip) / 4));
  const targetCarbKg = Number((targetCarbG / w).toFixed(2));

  // Fibras: mínimo de 14g por 1000 kcal ou 25g/dia
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
 * =========================================================================
 * 16. MOTOR DE VALIDAÇÃO BROMATOLÓGICA E CÁLCULO NUTRICIONAL ESTRITO
 * Regras estritas: TACO 4ª Edição, Rótulos Oficiais, Fatores de Atwater, 
 * Proporção Fator = Peso/100, Balanço de Massa e Auditoria Térmica.
 * =========================================================================
 */

/**
 * Realiza a validação bromatológica estrita de um alimento individual.
 * @param {Object} foodItem - Alimento da base com referência de 100g
 * @param {number} prescribedPortionG - Porção em gramas (padrão: 100g)
 * @returns {Object} Relatório bromatológico completo
 */
function validateBromatology(foodItem, prescribedPortionG = 100) {
  if (!foodItem) return null;

  const p100 = Math.max(0, parseFloat(foodItem.protein) || 0);
  const c100 = Math.max(0, parseFloat(foodItem.carbohydrate) || 0);
  const g100 = Math.max(0, parseFloat(foodItem.lipid) || 0);
  const f100 = Math.max(0, parseFloat(foodItem.fiber) || 0);
  const na100 = Math.max(0, parseFloat(foodItem.sodium) || 0);
  const kcal100 = Math.max(0, parseFloat(foodItem.calories) || 0);

  const portionG = Math.max(0, parseFloat(prescribedPortionG) || 100);
  const factor = portionG / 100.0;

  // 1. Cálculo Proporcional Estrito (Regra 3 e 9: 4 casas internas, 1 exibição)
  const pPortion = p100 * factor;
  const cPortion = c100 * factor;
  const gPortion = g100 * factor;
  const fPortion = f100 * factor;
  const naPortion = na100 * factor;
  const kcalPortion = kcal100 * factor;

  // 2. Validação de Massa (Regra 4: P + C + G + F <= Peso da porção)
  const massSum100 = p100 + c100 + g100 + f100;
  const massSumPortion = pPortion + cPortion + gPortion + fPortion;
  const isMassValid = massSumPortion <= (portionG + 0.05);
  const massStatus = isMassValid ? "OK" : "ERRO";

  // 3. Validação Energética de Atwater (Regras 5 e 6)
  const atwaterKcal100 = (p100 * 4) + (c100 * 4) + (g100 * 9);
  const atwaterPortion = atwaterKcal100 * factor;
  const diffAbs = Math.abs(kcalPortion - atwaterPortion);
  const diffPct = kcalPortion > 0 ? (diffAbs / kcalPortion) * 100 : 0;

  let energyStatus = "CONSISTENTE";
  if (diffPct <= 5.0 || diffAbs <= 4.0) {
    energyStatus = "CONSISTENTE";
  } else if (diffPct <= 10.0 || diffAbs <= 8.0) {
    energyStatus = "REVISAR";
  } else {
    energyStatus = "INCONSISTENTE";
  }

  // 4. Rastreabilidade da Fonte (Regra 1)
  const src = String(foodItem.source || "").toUpperCase();
  const brand = String(foodItem.brand || "").trim();
  let sourceStatus = "OK";
  if (src.includes("TACO")) {
    sourceStatus = "OK";
  } else if (src.includes("RÓTULO") || src.includes("ROTULO") || brand.length > 0) {
    sourceStatus = "OK";
  } else {
    sourceStatus = "REQUER VALIDAÇÃO";
  }

  // 5. Estado de Preparo (Regra 2)
  let prepState = foodItem.prepState || "Cru/In natura";

  return {
    ID_Alimento: foodItem.id || "FOOD_0000",
    Nome_Padronizado: foodItem.name || "Alimento",
    Fonte: foodItem.source || "TACO",
    Estado_Preparo: prepState,
    Base_100g: {
      Kcal: Number(kcal100.toFixed(1)),
      P: Number(p100.toFixed(1)),
      C: Number(c100.toFixed(1)),
      G: Number(g100.toFixed(1)),
      Fibra: Number(f100.toFixed(1)),
      Sodio: Number(na100.toFixed(1))
    },
    Porcao_Prescrita_g: Number(portionG.toFixed(1)),
    Total_Porcao: {
      Kcal: Number(kcalPortion.toFixed(1)),
      P: Number(pPortion.toFixed(1)),
      C: Number(cPortion.toFixed(1)),
      G: Number(gPortion.toFixed(1)),
      Fibra: Number(fPortion.toFixed(1)),
      Sodio: Number(naPortion.toFixed(1))
    },
    Validacao: {
      Massa: massStatus,
      Energia: energyStatus,
      Fonte: sourceStatus
    },
    _internals: {
      atwaterPortion: Number(atwaterPortion.toFixed(2)),
      diffAbs: Number(diffAbs.toFixed(2)),
      diffPct: Number(diffPct.toFixed(2)),
      massSumPortion: Number(massSumPortion.toFixed(2))
    }
  };
}

/**
 * Calcula a porção nutricional proporcional a partir da referência de 100g (Regra 3).
 */
function calculateBromatologicalPortion(foodItem, targetQuantityG) {
  const rep = validateBromatology(foodItem, targetQuantityG);
  return rep ? rep.Total_Porcao : { Kcal: 0, P: 0, C: 0, G: 0, Fibra: 0, Sodio: 0 };
}

/**
 * Auditoria Termodinâmica e Bromatológica Global do Total Diário (Regra 11).
 * @param {Array} prescriptionItems - Lista de alimentos prescritos na dieta
 * @returns {Object} Relatório auditado
 */
function auditDietBromatology(prescriptionItems = []) {
  let totalKcalFonte = 0;
  let totalP = 0;
  let totalC = 0;
  let totalG = 0;
  let totalF = 0;
  let totalNa = 0;

  const itemReports = [];
  let inconsistentCount = 0;
  let reviewCount = 0;
  let unverifiedSourceCount = 0;
  let massErrorCount = 0;

  prescriptionItems.forEach((item) => {
    const report = validateBromatology(item.foodItem || item, item.quantity || item.portionG || 100);
    if (!report) return;

    itemReports.push(report);

    totalKcalFonte += report.Total_Porcao.Kcal;
    totalP += report.Total_Porcao.P;
    totalC += report.Total_Porcao.C;
    totalG += report.Total_Porcao.G;
    totalF += report.Total_Porcao.Fibra;
    totalNa += report.Total_Porcao.Sodio;

    if (report.Validacao.Energia === "INCONSISTENTE") inconsistentCount++;
    else if (report.Validacao.Energia === "REVISAR") reviewCount++;

    if (report.Validacao.Fonte === "REQUER VALIDAÇÃO") unverifiedSourceCount++;
    if (report.Validacao.Massa === "ERRO") massErrorCount++;
  });

  // Kcal_Atwater_Total = (P_total × 4) + (C_total × 4) + (G_total × 9)
  const totalKcalAtwater = (totalP * 4) + (totalC * 4) + (totalG * 9);
  const diffAbs = Math.abs(totalKcalFonte - totalKcalAtwater);
  const diffPct = totalKcalFonte > 0 ? (diffAbs / totalKcalFonte) * 100 : 0;

  let overallEnergyStatus = "CONSISTENTE";
  if (diffPct <= 5.0) {
    overallEnergyStatus = "CONSISTENTE";
  } else if (diffPct <= 10.0) {
    overallEnergyStatus = "REVISAR";
  } else {
    overallEnergyStatus = "INCONSISTENTE";
  }

  // "Nunca considerar o plano matematicamente validado enquanto existirem alimentos classificados como INCONSISTENTE."
  const isPlanMathematicallyValidated = (inconsistentCount === 0 && massErrorCount === 0 && diffPct <= 5.0);

  return {
    totalItems: itemReports.length,
    totals: {
      kcalFonte: Number(totalKcalFonte.toFixed(1)),
      kcalAtwater: Number(totalKcalAtwater.toFixed(1)),
      proteina: Number(totalP.toFixed(1)),
      carboidrato: Number(totalC.toFixed(1)),
      lipidios: Number(totalG.toFixed(1)),
      fibras: Number(totalF.toFixed(1)),
      sodio: Number(totalNa.toFixed(1))
    },
    audit: {
      diffAbs: Number(diffAbs.toFixed(1)),
      diffPct: Number(diffPct.toFixed(2)),
      overallEnergyStatus,
      isPlanMathematicallyValidated,
      inconsistentCount,
      reviewCount,
      unverifiedSourceCount,
      massErrorCount
    },
    items: itemReports
  };
}

/**
 * =========================================================================
 * 17. MOTOR IA / OTIMIZADOR DE PRESCRIÇÃO E MACROS AUTOMÁTICA
 * Gera o plano alimentar completo com fracionamento estratégico por refeição,
 * fechamento matemático estrito de macros e auditoria bromatológica imediata.
 * =========================================================================
 */

/**
 * Biblioteca canônica de alimentos padrão-ouro TACO 4ª Edição para montagem dietética
 */
const CANONICAL_DIET_FOODS = {
  // Proteínas Magras
  frango_grelhado: { name: "Peito de Frango (Grelhado)", source: "TACO", prepState: "Grelhado", category: "Carnes e Aves", calories: 159.0, protein: 32.0, carbohydrate: 0.0, lipid: 2.5, fiber: 0.0, sodium: 50.0, defaultUnit: "file", gramPerUnit: 100 },
  patinho_grelhado: { name: "Patinho Bovino (Grelhado)", source: "TACO", prepState: "Grelhado", category: "Carnes e Aves", calories: 219.0, protein: 35.9, carbohydrate: 0.0, lipid: 7.3, fiber: 0.0, sodium: 60.0, defaultUnit: "file", gramPerUnit: 100 },
  tilapia_grelhada: { name: "Filé de Tilápia (Grelhado)", source: "TACO", prepState: "Grelhado", category: "Peixes e Frutos do Mar", calories: 128.0, protein: 26.0, carbohydrate: 0.0, lipid: 2.7, fiber: 0.0, sodium: 52.0, defaultUnit: "file", gramPerUnit: 120 },
  ovo_cozido: { name: "Ovo de Galinha (Cozido)", source: "TACO", prepState: "Cozido", category: "Ovos", calories: 146.0, protein: 13.0, carbohydrate: 0.6, lipid: 8.9, fiber: 0.0, sodium: 146.0, defaultUnit: "unid", gramPerUnit: 50 },
  ovo_clara: { name: "Clara de Ovo (Cozida)", source: "TACO", prepState: "Cozido", category: "Ovos", calories: 54.0, protein: 13.4, carbohydrate: 0.0, lipid: 0.1, fiber: 0.0, sodium: 166.0, defaultUnit: "unid", gramPerUnit: 35 },
  whey_protein: { name: "Whey Protein Concentrado 80%", source: "Rótulo Oficial", prepState: "Preparado", category: "Suplementos", calories: 392.0, protein: 80.0, carbohydrate: 6.7, lipid: 5.0, fiber: 0.0, sodium: 150.0, defaultUnit: "scoop", gramPerUnit: 30 },
  queijo_cottage: { name: "Queijo Cottage", source: "TACO", prepState: "Preparado", category: "Laticínios", calories: 103.0, protein: 12.5, carbohydrate: 2.7, lipid: 4.3, fiber: 0.0, sodium: 364.0, defaultUnit: "col_sopa", gramPerUnit: 30 },
  queijo_minas: { name: "Queijo Minas Frescal", source: "TACO", prepState: "Preparado", category: "Laticínios", calories: 264.0, protein: 17.4, carbohydrate: 3.2, lipid: 20.2, fiber: 0.0, sodium: 31.0, defaultUnit: "fatia", gramPerUnit: 30 },
  iogurte_desnatado: { name: "Iogurte Natural Desnatado", source: "TACO", prepState: "Preparado", category: "Laticínios", calories: 41.0, protein: 3.8, carbohydrate: 5.8, lipid: 0.3, fiber: 0.0, sodium: 56.0, defaultUnit: "copo", gramPerUnit: 170 },
  leite_desnatado: { name: "Leite de Vaca Desnatado", source: "TACO", prepState: "Cru/In natura", category: "Laticínios", calories: 35.0, protein: 3.1, carbohydrate: 4.7, lipid: 0.1, fiber: 0.0, sodium: 54.0, defaultUnit: "copo", gramPerUnit: 200 },

  // Carboidratos Complexos & Tubérculos
  arroz_branco: { name: "Arroz Branco (Cozido)", source: "TACO", prepState: "Cozido", category: "Cereais e Leguminosas", calories: 128.0, protein: 2.5, carbohydrate: 28.1, lipid: 0.2, fiber: 1.6, sodium: 1.0, defaultUnit: "col_sopa", gramPerUnit: 25 },
  arroz_integral: { name: "Arroz Integral (Cozido)", source: "TACO", prepState: "Cozido", category: "Cereais e Leguminosas", calories: 124.0, protein: 2.6, carbohydrate: 25.8, lipid: 1.0, fiber: 2.7, sodium: 1.0, defaultUnit: "col_sopa", gramPerUnit: 25 },
  feijao_carioca: { name: "Feijão Carioca (Cozido)", source: "TACO", prepState: "Cozido", category: "Cereais e Leguminosas", calories: 76.0, protein: 4.8, carbohydrate: 13.6, lipid: 0.5, fiber: 8.5, sodium: 2.0, defaultUnit: "concha", gramPerUnit: 100 },
  feijao_preto: { name: "Feijão Preto (Cozido)", source: "TACO", prepState: "Cozido", category: "Cereais e Leguminosas", calories: 77.0, protein: 4.5, carbohydrate: 14.0, lipid: 0.5, fiber: 8.4, sodium: 2.0, defaultUnit: "concha", gramPerUnit: 100 },
  batata_doce: { name: "Batata Doce (Cozida)", source: "TACO", prepState: "Cozido", category: "Tubérculos e Raízes", calories: 77.0, protein: 0.6, carbohydrate: 18.4, lipid: 0.1, fiber: 2.2, sodium: 3.0, defaultUnit: "unid", gramPerUnit: 150 },
  batata_inglesa: { name: "Batata Inglesa (Cozida)", source: "TACO", prepState: "Cozido", category: "Tubérculos e Raízes", calories: 52.0, protein: 1.2, carbohydrate: 11.9, lipid: 0.0, fiber: 1.3, sodium: 3.0, defaultUnit: "unid", gramPerUnit: 150 },
  aveia_flocos: { name: "Aveia em Flocos", source: "TACO", prepState: "Cru/In natura", category: "Cereais e Leguminosas", calories: 394.0, protein: 13.9, carbohydrate: 66.6, lipid: 8.5, fiber: 9.1, sodium: 4.0, defaultUnit: "col_sopa", gramPerUnit: 15 },
  pao_integral: { name: "Pão de Forma Integral", source: "TACO", prepState: "Assado", category: "Pães", calories: 253.0, protein: 9.4, carbohydrate: 49.9, lipid: 3.7, fiber: 6.9, sodium: 506.0, defaultUnit: "fatia", gramPerUnit: 25 },
  pao_frances: { name: "Pão Francês", source: "TACO", prepState: "Assado", category: "Pães", calories: 300.0, protein: 8.0, carbohydrate: 58.6, lipid: 3.1, fiber: 2.3, sodium: 648.0, defaultUnit: "unid", gramPerUnit: 50 },
  tapioca: { name: "Tapioca (Massa Hidratada)", source: "TACO", prepState: "Assado", category: "Pães", calories: 240.0, protein: 0.0, carbohydrate: 60.0, lipid: 0.0, fiber: 0.0, sodium: 2.0, defaultUnit: "col_sopa", gramPerUnit: 20 },

  // Frutas & Vegetais
  banana_prata: { name: "Banana Nanica (Crua)", source: "TACO", prepState: "Cru/In natura", category: "Frutas", calories: 97.0, protein: 1.4, carbohydrate: 23.8, lipid: 0.1, fiber: 1.9, sodium: 0.0, defaultUnit: "unid", gramPerUnit: 100 },
  maca_fuji: { name: "Maçã Fuji com Casca", source: "TACO", prepState: "Cru/In natura", category: "Frutas", calories: 56.0, protein: 0.3, carbohydrate: 15.2, lipid: 0.0, fiber: 1.3, sodium: 0.0, defaultUnit: "unid", gramPerUnit: 130 },
  mamao_papaia: { name: "Mamão Papaia (Cru)", source: "TACO", prepState: "Cru/In natura", category: "Frutas", calories: 40.0, protein: 0.5, carbohydrate: 10.4, lipid: 0.1, fiber: 1.0, sodium: 2.0, defaultUnit: "unid", gramPerUnit: 150 },
  brocolis_cozido: { name: "Brócolis (Cozido)", source: "TACO", prepState: "Cozido", category: "Verduras e Legumes", calories: 25.0, protein: 2.1, carbohydrate: 4.0, lipid: 0.5, fiber: 3.4, sodium: 3.0, defaultUnit: "col_sopa", gramPerUnit: 100 },
  salada_verde: { name: "Salada Verde Mista (Alface, Tomate, Pepino)", source: "TACO", prepState: "Cru/In natura", category: "Verduras e Legumes", calories: 15.0, protein: 1.1, carbohydrate: 3.0, lipid: 0.2, fiber: 1.5, sodium: 5.0, defaultUnit: "prato", gramPerUnit: 100 },

  // Gorduras Boas & Oleaginosas
  azeite_oliva: { name: "Azeite de Oliva Extravirgem", source: "TACO", prepState: "Cru/In natura", category: "Óleos e Gorduras", calories: 884.0, protein: 0.0, carbohydrate: 0.0, lipid: 100.0, fiber: 0.0, sodium: 0.0, defaultUnit: "col_sopa", gramPerUnit: 10 },
  castanha_brasil: { name: "Castanha-do-Brasil (Crua)", source: "TACO", prepState: "Cru/In natura", category: "Oleaginosas e Pastas", calories: 643.0, protein: 14.5, carbohydrate: 15.1, lipid: 63.5, fiber: 7.9, sodium: 2.0, defaultUnit: "unid", gramPerUnit: 15 },
  pasta_amendoim: { name: "Pasta de Amendoim Integral", source: "Rótulo Oficial", prepState: "Preparado", category: "Oleaginosas e Pastas", calories: 590.0, protein: 26.0, carbohydrate: 18.0, lipid: 49.0, fiber: 6.0, sodium: 10.0, defaultUnit: "col_sopa", gramPerUnit: 15 },

  // Bebidas
  cafe_sem_acucar: { name: "Café sem açúcar", source: "TACO", prepState: "Cru/In natura", category: "Achocolatados e Bebidas", calories: 2.0, protein: 0.3, carbohydrate: 0.0, lipid: 0.0, fiber: 0.0, sodium: 1.0, defaultUnit: "xicara", gramPerUnit: 100 }
};

/**
 * Gera automaticamente uma prescrição nutricional balanceada que cumpre as metas do paciente.
 * @param {Object} patientProfile - Dados do paciente (peso, objetivo, etc.)
 * @param {Object} macroTargets - Metas nutricionais calculadas
 * @param {Object} options - Configurações de estilo, número de refeições e preferências
 * @returns {Object} Plano gerado com itens, totais, auditoria e aviso legal
 */
function generateAutomatedPrescription(patientProfile = {}, macroTargets = {}, options = {}) {
  const w = parseFloat(patientProfile.weightKg || patientProfile.currentWeight || 70.0);
  const targetKcal = macroTargets.caloricTarget || 2000;
  const targetProtG = macroTargets.targetProtG || Math.round(w * 2.0);
  const targetCarbG = macroTargets.targetCarbG || 200;
  const targetLipG = macroTargets.targetLipG || Math.round(w * 0.8);
  const minFiber = macroTargets.minFiber || 25;

  const mealCount = parseInt(options.mealCount || 4, 10);
  const dietaryStyle = options.dietaryStyle || "tradicional"; // 'tradicional', 'pratico', 'fitness', 'vegetariano'
  const includeSupplements = options.includeSupplements !== false;

  const items = [];
  let itemIdCounter = 1;

  function createPrescriptionItem(mealName, mealTime, foodKey, targetGrams, unitDisplay) {
    const food = CANONICAL_DIET_FOODS[foodKey];
    if (!food) return null;

    const factor = targetGrams / 100.0;
    const scaledKcal = Number((food.calories * factor).toFixed(1));
    const scaledProt = Number((food.protein * factor).toFixed(1));
    const scaledCarb = Number((food.carbohydrate * factor).toFixed(1));
    const scaledLip = Number((food.lipid * factor).toFixed(1));
    const scaledFiber = Number((food.fiber * factor).toFixed(1));

    return {
      id: `ai_item_${Date.now()}_${itemIdCounter++}`,
      mealName,
      mealTime,
      foodName: food.name,
      foodItem: food, // Referência à base 100g para auditoria centesimal
      quantity: targetGrams,
      unitDisplay: unitDisplay || `${targetGrams}g`,
      calories: scaledKcal,
      protein: scaledProt,
      carbohydrate: scaledCarb,
      lipid: scaledLip,
      fiber: scaledFiber,
      source: food.source,
      prepState: food.prepState,
      category: food.category
    };
  }

  // 1. Fracionamento por refeições baseado na quantidade escolhida
  if (mealCount === 3) {
    // 3 Refeições: Café da manhã (25%), Almoço (42%), Jantar (33%)
    const pBreak = targetProtG * 0.25;
    const pLunch = targetProtG * 0.42;
    const pDinner = targetProtG * 0.33;

    const cBreak = targetCarbG * 0.30;
    const cLunch = targetCarbG * 0.42;
    const cDinner = targetCarbG * 0.28;

    // Café da Manhã (3 Refeições)
    const eggCount = 2; // ~13g P
    items.push(createPrescriptionItem("Café da manhã", "07:30", "ovo_cozido", eggCount * 50, `${eggCount} unidades (${eggCount * 50}g)`));
    const breadG = Math.max(30, Math.min(100, Math.round((cBreak * 0.55 / 49.9) * 100)));
    items.push(createPrescriptionItem("Café da manhã", "07:30", "pao_integral", breadG, `${Math.round(breadG / 25)} fatia(s) (${breadG}g)`));
    const cottageG = Math.max(20, Math.round(((pBreak - 13 - (breadG * 0.094)) / 12.5) * 100));
    items.push(createPrescriptionItem("Café da manhã", "07:30", "queijo_cottage", cottageG, `${cottageG}g`));
    items.push(createPrescriptionItem("Café da manhã", "07:30", "banana_prata", 100, "1 unidade média (100g)"));
    items.push(createPrescriptionItem("Café da manhã", "07:30", "cafe_sem_acucar", 150, "1 xícara (150ml)"));

    // Almoço (3 Refeições)
    const chickenG = Math.max(80, Math.round((pLunch / 32.0) * 100));
    const beanG = 100; // ~13.6g C, ~4.8g P
    const riceG = Math.max(50, Math.round(((cLunch - 13.6) / 28.1) * 100));
    const oilLunchG = Math.max(5, Math.min(20, Math.round((targetLipG * 0.40))));
    items.push(createPrescriptionItem("Almoço", "12:30", "frango_grelhado", chickenG, `${chickenG}g (filé grelhado)`));
    items.push(createPrescriptionItem("Almoço", "12:30", "arroz_branco", riceG, `${riceG}g (cozido)`));
    items.push(createPrescriptionItem("Almoço", "12:30", "feijao_carioca", beanG, "1 concha média (100g)"));
    items.push(createPrescriptionItem("Almoço", "12:30", "salada_verde", 100, "1 prato de sobremesa (100g)"));
    items.push(createPrescriptionItem("Almoço", "12:30", "azeite_oliva", oilLunchG, `${oilLunchG}g (1 colher de sopa)`));

    // Jantar (3 Refeições)
    const meatG = Math.max(80, Math.round((pDinner / 35.9) * 100));
    const sweetPotatoG = Math.max(50, Math.round((cDinner / 18.4) * 100));
    const oilDinnerG = Math.max(5, Math.min(15, Math.round((targetLipG * 0.25))));
    items.push(createPrescriptionItem("Jantar", "20:00", "patinho_grelhado", meatG, `${meatG}g (grelhado)`));
    items.push(createPrescriptionItem("Jantar", "20:00", "batata_doce", sweetPotatoG, `${sweetPotatoG}g (cozida)`));
    items.push(createPrescriptionItem("Jantar", "20:00", "brocolis_cozido", 100, "1 porção (100g)"));
    items.push(createPrescriptionItem("Jantar", "20:00", "azeite_oliva", oilDinnerG, `${oilDinnerG}g (1 colher de sobremesa)`));

  } else if (mealCount === 4) {
    // 4 Refeições: Café (20%), Almoço (35%), Lanche Tarde (20%), Jantar (25%)
    const pBreak = targetProtG * 0.20;
    const pLunch = targetProtG * 0.35;
    const pSnack = targetProtG * 0.20;
    const pDinner = targetProtG * 0.25;

    const cBreak = targetCarbG * 0.25;
    const cLunch = targetCarbG * 0.38;
    const cSnack = targetCarbG * 0.20;
    const cDinner = targetCarbG * 0.17;

    // 1. Café da Manhã
    items.push(createPrescriptionItem("Café da manhã", "07:30", "ovo_cozido", 100, "2 unidades (100g)"));
    const breadG = Math.max(25, Math.min(75, Math.round((cBreak * 0.8 / 49.9) * 100)));
    items.push(createPrescriptionItem("Café da manhã", "07:30", "pao_integral", breadG, `${Math.round(breadG / 25)} fatia(s) (${breadG}g)`));
    const cottageG = Math.max(20, Math.round(Math.max(0, (pBreak - 13 - (breadG * 0.094))) / 12.5 * 100));
    if (cottageG >= 20) {
      items.push(createPrescriptionItem("Café da manhã", "07:30", "queijo_cottage", cottageG, `${cottageG}g`));
    }
    items.push(createPrescriptionItem("Café da manhã", "07:30", "cafe_sem_acucar", 150, "1 xícara (150ml)"));

    // 2. Almoço
    const chickenG = Math.max(80, Math.round((pLunch / 32.0) * 100));
    const beanG = 100;
    const riceG = Math.max(40, Math.round(((cLunch - 13.6) / 28.1) * 100));
    const oilLunchG = Math.max(5, Math.min(15, Math.round(targetLipG * 0.30)));
    items.push(createPrescriptionItem("Almoço", "12:30", "frango_grelhado", chickenG, `${chickenG}g (filé grelhado)`));
    items.push(createPrescriptionItem("Almoço", "12:30", "arroz_branco", riceG, `${riceG}g (cozido)`));
    items.push(createPrescriptionItem("Almoço", "12:30", "feijao_carioca", beanG, "1 concha média (100g)"));
    items.push(createPrescriptionItem("Almoço", "12:30", "salada_verde", 100, "1 prato de sobremesa (100g)"));
    items.push(createPrescriptionItem("Almoço", "12:30", "azeite_oliva", oilLunchG, `${oilLunchG}g (1 colher de sopa)`));

    // 3. Lanche da Tarde / Pré-treino
    if (dietaryStyle === "fitness" || includeSupplements) {
      const wheyG = Math.max(20, Math.min(45, Math.round((pSnack / 80.0) * 100)));
      items.push(createPrescriptionItem("Lanche tarde", "16:30", "whey_protein", wheyG, `${wheyG}g (1 scoop)`));
      const oatG = Math.max(15, Math.min(50, Math.round((cSnack * 0.5 / 66.6) * 100)));
      items.push(createPrescriptionItem("Lanche tarde", "16:30", "aveia_flocos", oatG, `${oatG}g`));
      items.push(createPrescriptionItem("Lanche tarde", "16:30", "banana_prata", 100, "1 unidade média (100g)"));
    } else {
      items.push(createPrescriptionItem("Lanche tarde", "16:30", "iogurte_desnatado", 170, "1 pote (170g)"));
      const oatG = Math.max(15, Math.min(50, Math.round((cSnack * 0.5 / 66.6) * 100)));
      items.push(createPrescriptionItem("Lanche tarde", "16:30", "aveia_flocos", oatG, `${oatG}g`));
      items.push(createPrescriptionItem("Lanche tarde", "16:30", "maca_fuji", 130, "1 unidade com casca (130g)"));
      items.push(createPrescriptionItem("Lanche tarde", "16:30", "castanha_brasil", 15, "2 unidades (15g)"));
    }

    // 4. Jantar
    const meatG = Math.max(80, Math.round((pDinner / 35.9) * 100));
    const sweetPotatoG = Math.max(40, Math.round((cDinner / 18.4) * 100));
    const oilDinnerG = Math.max(5, Math.min(15, Math.round(targetLipG * 0.20)));
    items.push(createPrescriptionItem("Jantar", "20:00", "patinho_grelhado", meatG, `${meatG}g (grelhado)`));
    items.push(createPrescriptionItem("Jantar", "20:00", "batata_doce", sweetPotatoG, `${sweetPotatoG}g (cozida)`));
    items.push(createPrescriptionItem("Jantar", "20:00", "brocolis_cozido", 100, "1 porção (100g)"));
    items.push(createPrescriptionItem("Jantar", "20:00", "azeite_oliva", oilDinnerG, `${oilDinnerG}g (1 colher de sobremesa)`));

  } else {
    // 5 a 6 Refeições: Café (18%), Lanche Manhã (10%), Almoço (30%), Pré (15%), Pós (12%), Jantar (20%)
    const pLunch = targetProtG * 0.32;
    const pDinner = targetProtG * 0.28;
    const cLunch = targetCarbG * 0.35;
    const cDinner = targetCarbG * 0.22;

    // 1. Café da Manhã (07:30)
    items.push(createPrescriptionItem("Café da manhã", "07:30", "ovo_cozido", 100, "2 unidades (100g)"));
    items.push(createPrescriptionItem("Café da manhã", "07:30", "pao_integral", 50, "2 fatias (50g)"));
    items.push(createPrescriptionItem("Café da manhã", "07:30", "queijo_minas", 30, "1 fatia (30g)"));
    items.push(createPrescriptionItem("Café da manhã", "07:30", "cafe_sem_acucar", 100, "1 xícara (100ml)"));

    // 2. Lanche da Manhã (10:00)
    items.push(createPrescriptionItem("Lanche manhã", "10:00", "maca_fuji", 130, "1 unidade média (130g)"));
    items.push(createPrescriptionItem("Lanche manhã", "10:00", "castanha_brasil", 15, "2 unidades (15g)"));

    // 3. Almoço (12:30)
    const chickenG = Math.max(80, Math.round((pLunch / 32.0) * 100));
    const riceG = Math.max(40, Math.round(((cLunch - 13.6) / 28.1) * 100));
    items.push(createPrescriptionItem("Almoço", "12:30", "frango_grelhado", chickenG, `${chickenG}g (filé grelhado)`));
    items.push(createPrescriptionItem("Almoço", "12:30", "arroz_branco", riceG, `${riceG}g (cozido)`));
    items.push(createPrescriptionItem("Almoço", "12:30", "feijao_carioca", 100, "1 concha média (100g)"));
    items.push(createPrescriptionItem("Almoço", "12:30", "salada_verde", 100, "1 prato de sobremesa (100g)"));
    items.push(createPrescriptionItem("Almoço", "12:30", "azeite_oliva", 10, "1 colher de sopa (10g)"));

    // 4. Pré-treino / Lanche da Tarde (16:30)
    items.push(createPrescriptionItem("Pré-treino", "16:30", "banana_prata", 100, "1 unidade média (100g)"));
    items.push(createPrescriptionItem("Pré-treino", "16:30", "aveia_flocos", 30, "2 colheres de sopa (30g)"));
    items.push(createPrescriptionItem("Pré-treino", "16:30", "iogurte_desnatado", 170, "1 pote (170g)"));

    // 5. Pós-treino / Suplemento (18:30)
    if (includeSupplements) {
      items.push(createPrescriptionItem("Pós-treino", "18:30", "whey_protein", 30, "1 scoop dosador (30g)"));
    }

    // 6. Jantar (20:00)
    const meatG = Math.max(80, Math.round((pDinner / 35.9) * 100));
    const sweetPotatoG = Math.max(40, Math.round((cDinner / 18.4) * 100));
    items.push(createPrescriptionItem("Jantar", "20:00", "patinho_grelhado", meatG, `${meatG}g (grelhado)`));
    items.push(createPrescriptionItem("Jantar", "20:00", "batata_doce", sweetPotatoG, `${sweetPotatoG}g (cozida)`));
    items.push(createPrescriptionItem("Jantar", "20:00", "brocolis_cozido", 100, "1 porção (100g)"));
    items.push(createPrescriptionItem("Jantar", "20:00", "azeite_oliva", 8, "1 colher de sobremesa (8g)"));
  }

  // 3. Auditoria Bromatológica Imediata
  const audit = auditDietBromatology(items);

  return {
    generatedAt: new Date().toISOString(),
    status: "GERADO POR IA (PENDENTE DE VALIDAÇÃO)",
    dietaryStyle,
    mealCount,
    disclaimer: "⚠️ PLANO GERADO AUTOMATICAMENTE POR MOTOR INTELIGENTE COM BASE NAS METAS METABÓLICAS CALCULADAS. A validação clínica individual e aprovação final são de responsabilidade exclusiva do nutricionista.",
    macroTargets: {
      caloricTarget: targetKcal,
      targetProtG,
      targetCarbG,
      targetLipG,
      minFiber
    },
    totals: audit.totals,
    audit: audit.audit,
    items
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    calculateIMC,
    calculateTMB,
    calculateGET,
    calculateBodyComposition,
    calculateDietaryMacroTargets,
    validateBromatology,
    calculateBromatologicalPortion,
    auditDietBromatology,
    generateAutomatedPrescription,
    CANONICAL_DIET_FOODS,
    classifyRCEst,
    calculateAnthropometricIndices
  };
}

if (typeof window !== "undefined") {
  window.classifyRCEst = classifyRCEst;
  window.calculateAnthropometricIndices = calculateAnthropometricIndices;
}


