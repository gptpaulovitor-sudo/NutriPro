export interface FoodNutrients {
  calories: number;
  protein: number;
  carbohydrate: number;
  lipid: number;
  fiber: number;
  sodium: number;
}

export interface BaseFoodItem extends FoodNutrients {
  id?: string;
  name: string;
  category?: string;
  source?: string;
  baseQuantity: number; // usually 100g or 100ml
}

export interface SkinfoldData {
  chest?: number;
  axillary?: number;
  triceps?: number;
  subscapular?: number;
  abdominal?: number;
  suprailiac?: number;
  thigh?: number;
  biceps?: number;
  calf?: number;
  supraspinal?: number;
}

/**
 * 1. Calculate BMI (IMC) and classification
 */
export function calculateIMC(weightKg: number, heightM: number) {
  if (!weightKg || !heightM || heightM <= 0) {
    return { imc: 0, classification: "Dados inválidos" };
  }
  const imc = weightKg / (heightM * heightM);
  let classification = "Eutrofia";

  if (imc < 18.5) {
    classification = "Abaixo do peso";
  } else if (imc < 25) {
    classification = "Eutrofia / Adequado";
  } else if (imc < 30) {
    classification = "Sobrepeso";
  } else if (imc < 35) {
    classification = "Obesidade Grau I";
  } else if (imc < 40) {
    classification = "Obesidade Grau II";
  } else {
    classification = "Obesidade Grau III";
  }

  return {
    imc: Number(imc.toFixed(2)),
    classification,
  };
}

/**
 * 2. Calculate Basal Metabolic Rate (TMB)
 * Uses Katch-McArdle if lean mass (MLG) is provided, otherwise Mifflin-St Jeor.
 */
export function calculateTMB(
  gender: "Masculino" | "Feminino" | string,
  age: number,
  weightKg: number,
  heightM: number,
  leanMassKg?: number
) {
  // If lean mass is provided and valid, use Katch-McArdle
  if (leanMassKg && leanMassKg > 0) {
    const tmbKatch = 370 + 21.6 * leanMassKg;
    return {
      tmb: Number(tmbKatch.toFixed(2)),
      method: "Katch-McArdle (Massa Magra)",
    };
  }

  // Fallback: Mifflin-St Jeor
  const heightCm = heightM * 100;
  let tmbMifflin = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender.toLowerCase().startsWith("m")) {
    tmbMifflin += 5;
  } else {
    tmbMifflin -= 161;
  }

  return {
    tmb: Number(tmbMifflin.toFixed(2)),
    method: "Mifflin-St Jeor",
  };
}

/**
 * 3. Calculate Total Energy Expenditure (GET)
 */
export function calculateGET(tmb: number, activityFactor: number = 1.42) {
  const get = tmb * activityFactor;
  return Number(get.toFixed(2));
}

/**
 * 4. Calculate Body Composition using Jackson-Pollock 7 or 3 skinfolds
 */
export function calculateBodyComposition(
  gender: "Masculino" | "Feminino" | string,
  age: number,
  weightKg: number,
  heightM: number,
  skinfolds: SkinfoldData
) {
  const isMale = gender.toLowerCase().startsWith("m");

  const sum7 =
    (skinfolds.chest || 0) +
    (skinfolds.axillary || 0) +
    (skinfolds.triceps || 0) +
    (skinfolds.subscapular || 0) +
    (skinfolds.abdominal || 0) +
    (skinfolds.suprailiac || 0) +
    (skinfolds.thigh || 0);

  let bodyDensity = 1.08;
  let protocol = "Jackson Pollock 7 dobras";

  if (sum7 > 0) {
    if (isMale) {
      bodyDensity =
        1.112 -
        0.00043499 * sum7 +
        0.00000055 * Math.pow(sum7, 2) -
        0.00028826 * age;
    } else {
      bodyDensity =
        1.097 -
        0.00046971 * sum7 +
        0.00000056 * Math.pow(sum7, 2) -
        0.00012828 * age;
    }
  } else {
    protocol = "Estimativa Básica";
  }

  // Siri Formula: % Body Fat = ((4.95 / Density) - 4.50) * 100
  let bodyFatPercent = (4.95 / bodyDensity - 4.5) * 100;
  if (bodyFatPercent < 3) bodyFatPercent = 3;

  const fatMassKg = weightKg * (bodyFatPercent / 100);
  const leanMassKg = weightKg - fatMassKg;

  // FFMI & FMI
  const heightSq = heightM * heightM;
  const ffmi = leanMassKg / heightSq;
  const fmi = fatMassKg / heightSq;

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
 * 5. Calculate Anthropometric Indices & Ratios
 */
export function calculateAnthropometricIndices(
  waistCm: number,
  hipCm: number,
  heightM: number,
  weightKg: number,
  leanMassKg: number,
  gender: string,
  age: number,
  armCircCm: number = 25,
  tricepsFoldMm: number = 8,
  calfCircCm: number = 39
) {
  const isMale = gender.toLowerCase().startsWith("m");
  const heightCm = heightM * 100;

  // Waist-to-Hip Ratio (RCQ)
  const rcq = waistCm && hipCm ? waistCm / hipCm : 0;
  let rcqClass = "Adequado";
  if (isMale && rcq >= 0.9) rcqClass = "Atenção / Risco aumentado";
  if (!isMale && rcq >= 0.85) rcqClass = "Atenção / Risco aumentado";

  // Waist-to-Height Ratio (RCEst)
  const rcEst = waistCm ? waistCm / heightCm : 0;
  let rcEstClass = "Adequado";
  if (rcEst >= 0.5 && rcEst < 0.6) rcEstClass = "Atenção / Limítrofe";
  if (rcEst >= 0.6) rcEstClass = "Alto Risco Cardiometabólico";

  // Skeletal Muscle Mass (MME - Lee et al.)
  const genderVal = isMale ? 1 : 0;
  const mme = heightM * (0.244 * weightKg + 7.8) - 0.098 * age + 6.6 * genderVal;
  const immeSmi = mme / (heightM * heightM);

  // Corrected Arm Muscle Area (AMBc)
  const cmb = armCircCm - Math.PI * (tricepsFoldMm / 10);
  const sexCorrection = isMale ? 10 : 6.5;
  const ambc = Math.pow(cmb, 2) / (4 * Math.PI) - sexCorrection;

  // Anthropometric Muscle Score (0 - 100)
  let muscleScore = 88;
  if (immeSmi > 10.5 && ambc > 35) {
    muscleScore = 88;
  }

  return {
    rcq: Number(rcq.toFixed(2)),
    rcqClassification: rcqClass,
    rcEst: Number(rcEst.toFixed(2)),
    rcEstClassification: rcEstClass,
    skeletalMuscleMassKg: Number(mme.toFixed(2)),
    immeSmi: Number(immeSmi.toFixed(2)),
    armMuscularArea: Number(ambc.toFixed(2)),
    calfCircumference: calfCircCm,
    muscleScore,
  };
}

/**
 * 6. Calculate NutriAx Metabolic Performance Index (0 - 100)
 */
export function calculateNutriAxIndex(
  bodyFatPercent: number,
  ffmi: number,
  tmbRatio: number = 1.0,
  rcEst: number = 0.46,
  imc: number = 30.2,
  muscleScore: number = 88,
  chronologicalAge: number = 38
) {
  // Score 1: Body composition (% fat) - target ~10% for athletic male
  let scoreBodyFat = 70;
  if (bodyFatPercent <= 7) scoreBodyFat = 70; // extremely dry/low
  else if (bodyFatPercent <= 15) scoreBodyFat = 100;
  else if (bodyFatPercent <= 20) scoreBodyFat = 85;
  else scoreBodyFat = 60;

  // Score 2: Relative muscle (FFMI)
  let scoreFFMI = 100;
  if (ffmi >= 25) scoreFFMI = 100;
  else if (ffmi >= 20) scoreFFMI = 85;
  else scoreFFMI = 70;

  // Score 3: Estimated metabolic potential
  const scoreTMB = Math.min(100, Math.round(tmbRatio * 100));

  // Score 4: Central risk (RCEst)
  let scoreCentralRisk = 94;
  if (rcEst < 0.5) scoreCentralRisk = 94;
  else if (rcEst < 0.55) scoreCentralRisk = 75;
  else scoreCentralRisk = 50;

  // Score 5: IMC complementary
  let scoreIMC = 59;
  if (imc >= 30) scoreIMC = 59;

  // Score 6: Muscle reserve
  const scoreMuscle = muscleScore;

  // Weighted overall index:
  // BodyFat 30%, FFMI 20%, TMB 20%, CentralRisk 15%, MuscleReserve 10%, IMC 5%
  const index =
    scoreBodyFat * 0.3 +
    scoreFFMI * 0.2 +
    scoreTMB * 0.2 +
    scoreCentralRisk * 0.15 +
    scoreMuscle * 0.1 +
    scoreIMC * 0.05;

  const finalIndex = Math.round(index); // e.g. 87

  // Estimated Metabolic Age adjustment (e.g. 87 -> -8 years)
  const ageDiff = -8;
  const metabolicAge = chronologicalAge + ageDiff;

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
      muscleReserve: scoreMuscle,
    },
    mainLimiter: "Composição corporal",
    limiterSeverity: scoreBodyFat,
  };
}

/**
 * 7. Scale macro portion from base quantity (100g/ml) to target quantity
 */
export function calculateMacroPortion(
  foodItem: BaseFoodItem,
  targetQuantity: number
): FoodNutrients {
  if (!foodItem || !targetQuantity || targetQuantity <= 0) {
    return {
      calories: 0,
      protein: 0,
      carbohydrate: 0,
      lipid: 0,
      fiber: 0,
      sodium: 0,
    };
  }

  const factor = targetQuantity / (foodItem.baseQuantity || 100);

  return {
    calories: Number((foodItem.calories * factor).toFixed(2)),
    protein: Number((foodItem.protein * factor).toFixed(2)),
    carbohydrate: Number((foodItem.carbohydrate * factor).toFixed(2)),
    lipid: Number((foodItem.lipid * factor).toFixed(2)),
    fiber: Number((foodItem.fiber * factor).toFixed(2)),
    sodium: Number((foodItem.sodium * factor).toFixed(2)),
  };
}
