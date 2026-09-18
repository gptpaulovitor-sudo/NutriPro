/**
 * domain/clinical/scientificPrescriptionEvaluator.js
 * 
 * Motor Determinístico de Avaliação Científica de Prescrições Nutricionais.
 * NutriAx Pro — Baseado em evidências clínicas e esportivas:
 * - ISSN (International Society of Sports Nutrition - Nutrient Timing Position Stand)
 * - ACSM (American College of Sports Medicine - Nutrition and Athletic Performance)
 * - SBNE (Sociedade Brasileira de Nutrição Esportiva)
 * - SBD (Sociedade Brasileira de Diabetes)
 * 
 * Camada Pura — Zero I/O, determinístico, sem efeitos colaterais.
 */

'use strict';

/**
 * Classificação científica de Índice Glicêmico (IG)
 */
const GLYCEMIC_INDEX = Object.freeze({
  LOW: 'LOW',       // <= 55 (Aveia, batata doce, maçã, leguminosas, laticínios)
  MEDIUM: 'MEDIUM', // 56-69 (Banana, arroz integral, pão integral, milho)
  HIGH: 'HIGH'      // >= 70 (Arroz branco, batata inglesa, pão branco, maltodextrina, açúcar)
});

/**
 * Classificação científica de Qualidade Proteica / Valor Biológico (VB)
 */
const PROTEIN_QUALITY = Object.freeze({
  HIGH_VB: 'HIGH_VB',           // Alto Valor Biológico: EAAs completos + alto teor de Leucina (carnes, peixes, ovos, whey, laticínios)
  INTERMEDIATE: 'INTERMEDIATE', // Misto / Vegetal estruturado (soja, proteína isolada de ervilha/arroz)
  PLANT_COMPLEX: 'PLANT_COMPLEX'// Leguminosas e cereais combinados (feijão + arroz)
});

/**
 * Classificação científica de Velocidade de Esvaziamento Gástrico
 */
const GASTRIC_EMPTYING = Object.freeze({
  FAST: 'FAST',         // Rápido: baixo teor de gordura e fibras insolúveis moderadas
  MODERATE: 'MODERATE', // Moderado: equilíbrio entre macronutrientes e fibras
  SLOW: 'SLOW'          // Lento: alto teor lipídico e excesso de fibras (retarda esvaziamento)
});

/**
 * Dicionário heurístico de propriedades científicas de alimentos
 * Baseado em tabelas internacionais de IG (Foster-Powell et al.) e TACO/TBCA.
 */
const FOOD_SCIENCE_DATABASE = Object.freeze({
  // FONTES DE CARBOIDRATO
  'aveia': { ig: GLYCEMIC_INDEX.LOW, igValue: 53, vb: PROTEIN_QUALITY.INTERMEDIATE, emptying: GASTRIC_EMPTYING.MODERATE, fiberType: 'beta-glucana' },
  'batata doce': { ig: GLYCEMIC_INDEX.LOW, igValue: 46, vb: PROTEIN_QUALITY.INTERMEDIATE, emptying: GASTRIC_EMPTYING.MODERATE, fiberType: 'amido resistente' },
  'banana': { ig: GLYCEMIC_INDEX.MEDIUM, igValue: 58, vb: PROTEIN_QUALITY.INTERMEDIATE, emptying: GASTRIC_EMPTYING.FAST, fiberType: 'frutose/pectina' },
  'maçã': { ig: GLYCEMIC_INDEX.LOW, igValue: 36, vb: PROTEIN_QUALITY.INTERMEDIATE, emptying: GASTRIC_EMPTYING.MODERATE, fiberType: 'pectina' },
  'maca': { ig: GLYCEMIC_INDEX.LOW, igValue: 36, vb: PROTEIN_QUALITY.INTERMEDIATE, emptying: GASTRIC_EMPTYING.MODERATE, fiberType: 'pectina' },
  'arroz branco': { ig: GLYCEMIC_INDEX.HIGH, igValue: 73, vb: PROTEIN_QUALITY.PLANT_COMPLEX, emptying: GASTRIC_EMPTYING.FAST, fiberType: 'baixo amido resistente' },
  'arroz integral': { ig: GLYCEMIC_INDEX.MEDIUM, igValue: 68, vb: PROTEIN_QUALITY.PLANT_COMPLEX, emptying: GASTRIC_EMPTYING.MODERATE, fiberType: 'fibra insolúvel' },
  'feijão': { ig: GLYCEMIC_INDEX.LOW, igValue: 32, vb: PROTEIN_QUALITY.PLANT_COMPLEX, emptying: GASTRIC_EMPTYING.MODERATE, fiberType: 'amido resistente/solúvel' },
  'feijao': { ig: GLYCEMIC_INDEX.LOW, igValue: 32, vb: PROTEIN_QUALITY.PLANT_COMPLEX, emptying: GASTRIC_EMPTYING.MODERATE, fiberType: 'amido resistente/solúvel' },
  'lentilha': { ig: GLYCEMIC_INDEX.LOW, igValue: 29, vb: PROTEIN_QUALITY.PLANT_COMPLEX, emptying: GASTRIC_EMPTYING.MODERATE, fiberType: 'fibras solúveis' },
  'pão francês': { ig: GLYCEMIC_INDEX.HIGH, igValue: 75, vb: PROTEIN_QUALITY.PLANT_COMPLEX, emptying: GASTRIC_EMPTYING.FAST, fiberType: 'baixa fibra' },
  'pão integral': { ig: GLYCEMIC_INDEX.MEDIUM, igValue: 62, vb: PROTEIN_QUALITY.PLANT_COMPLEX, emptying: GASTRIC_EMPTYING.MODERATE, fiberType: 'fibras insolúveis' },
  'mandioca': { ig: GLYCEMIC_INDEX.MEDIUM, igValue: 65, vb: PROTEIN_QUALITY.INTERMEDIATE, emptying: GASTRIC_EMPTYING.MODERATE, fiberType: 'amido' },

  // FONTES DE PROTEÍNA
  'peito de frango': { ig: null, vb: PROTEIN_QUALITY.HIGH_VB, emptying: GASTRIC_EMPTYING.MODERATE, leucinePer100g: 2.2 },
  'frango': { ig: null, vb: PROTEIN_QUALITY.HIGH_VB, emptying: GASTRIC_EMPTYING.MODERATE, leucinePer100g: 2.1 },
  'patinho': { ig: null, vb: PROTEIN_QUALITY.HIGH_VB, emptying: GASTRIC_EMPTYING.MODERATE, leucinePer100g: 2.6 },
  'carne': { ig: null, vb: PROTEIN_QUALITY.HIGH_VB, emptying: GASTRIC_EMPTYING.MODERATE, leucinePer100g: 2.5 },
  'ovo': { ig: null, vb: PROTEIN_QUALITY.HIGH_VB, emptying: GASTRIC_EMPTYING.MODERATE, leucinePer100g: 1.4 },
  'clara de ovo': { ig: null, vb: PROTEIN_QUALITY.HIGH_VB, emptying: GASTRIC_EMPTYING.FAST, leucinePer100g: 1.2 },
  'tilápia': { ig: null, vb: PROTEIN_QUALITY.HIGH_VB, emptying: GASTRIC_EMPTYING.FAST, leucinePer100g: 2.0 },
  'peixe': { ig: null, vb: PROTEIN_QUALITY.HIGH_VB, emptying: GASTRIC_EMPTYING.FAST, leucinePer100g: 2.0 },
  'whey': { ig: null, vb: PROTEIN_QUALITY.HIGH_VB, emptying: GASTRIC_EMPTYING.FAST, leucinePer100g: 3.2 },
  'iogurte': { ig: GLYCEMIC_INDEX.LOW, igValue: 35, vb: PROTEIN_QUALITY.HIGH_VB, emptying: GASTRIC_EMPTYING.FAST, leucinePer100g: 1.1 },
  'leite': { ig: GLYCEMIC_INDEX.LOW, igValue: 38, vb: PROTEIN_QUALITY.HIGH_VB, emptying: GASTRIC_EMPTYING.FAST, leucinePer100g: 0.9 },

  // VEGETAIS & GORDURAS
  'brócolis': { ig: GLYCEMIC_INDEX.LOW, igValue: 15, vb: PROTEIN_QUALITY.INTERMEDIATE, emptying: GASTRIC_EMPTYING.MODERATE, micronutrients: 'sulforafano, folato' },
  'brocolis': { ig: GLYCEMIC_INDEX.LOW, igValue: 15, vb: PROTEIN_QUALITY.INTERMEDIATE, emptying: GASTRIC_EMPTYING.MODERATE, micronutrients: 'sulforafano, folato' },
  'azeite': { ig: null, vb: null, emptying: GASTRIC_EMPTYING.SLOW, lipidType: 'ácidos graxos monoinsaturados (oleico)' },
  'castanha': { ig: GLYCEMIC_INDEX.LOW, igValue: 15, vb: PROTEIN_QUALITY.INTERMEDIATE, emptying: GASTRIC_EMPTYING.SLOW, lipidType: 'poli e monoinsaturados' }
});

/**
 * Classifica um alimento com base em seu nome
 * @param {string} foodName 
 * @returns {Object} Propriedades científicas estimadas
 */
function classifyFoodScience(foodName) {
  if (!foodName || typeof foodName !== 'string') {
    return { ig: null, igValue: null, vb: null, emptying: GASTRIC_EMPTYING.MODERATE };
  }
  const clean = foodName.toLowerCase().trim();

  for (const [key, props] of Object.entries(FOOD_SCIENCE_DATABASE)) {
    if (clean.includes(key)) {
      return { ...props, matchedKey: key };
    }
  }

  // Heurísticas de fallback
  if (/carne|frango|peixe|atum|salmão|ovo|whey|case[ií]na|latic[ií]nio|queijo/i.test(clean)) {
    return { ig: null, vb: PROTEIN_QUALITY.HIGH_VB, emptying: GASTRIC_EMPTYING.MODERATE };
  }
  if (/doce|a[cç][uú]car|refinado|tapioca|mel|polvilho/i.test(clean)) {
    return { ig: GLYCEMIC_INDEX.HIGH, igValue: 75, vb: null, emptying: GASTRIC_EMPTYING.FAST };
  }
  if (/vegetal|salada|folha|legume|abobrinha|chuchu|couve/i.test(clean)) {
    return { ig: GLYCEMIC_INDEX.LOW, igValue: 20, vb: null, emptying: GASTRIC_EMPTYING.FAST };
  }
  if (/azeite|óleo|oleo|manteiga|castanha|amendoim|abacate/i.test(clean)) {
    return { ig: null, vb: null, emptying: GASTRIC_EMPTYING.SLOW };
  }

  return { ig: GLYCEMIC_INDEX.MEDIUM, igValue: 55, vb: PROTEIN_QUALITY.INTERMEDIATE, emptying: GASTRIC_EMPTYING.MODERATE };
}

/**
 * Avalia cientificamente uma única refeição segundo seu papel clínico/temporal
 * 
 * @param {string} mealName Nome clínico da refeição (ex: 'Pré-treino', 'Pós-treino', 'Café da manhã', 'Almoço', 'Jantar', 'Ceia')
 * @param {Array<Object>} items Lista de alimentos na refeição
 * @param {Object} [options={}] Contexto opcional
 * @returns {Object} Parecer e score científico da refeição
 */
function evaluateMealScience(mealName, items = [], options = {}) {
  const normName = String(mealName || '').toLowerCase().trim();
  const safeItems = Array.isArray(items) ? items : [];

  const totalKcal = safeItems.reduce((acc, i) => acc + (Number(i.calories) || Number(i.kcal) || 0), 0);
  const totalProt = safeItems.reduce((acc, i) => acc + (Number(i.protein) || 0), 0);
  const totalCarb = safeItems.reduce((acc, i) => acc + (Number(i.carbohydrate) || Number(i.carb) || 0), 0);
  const totalLip = safeItems.reduce((acc, i) => acc + (Number(i.lipid) || Number(i.fat) || 0), 0);

  const itemClassifications = safeItems.map(i => ({
    name: i.foodName || i.name || 'Alimento',
    quantity: i.quantity || i.grams || 0,
    carbs: Number(i.carbohydrate) || Number(i.carb) || 0,
    protein: Number(i.protein) || 0,
    lipids: Number(i.lipid) || Number(i.fat) || 0,
    science: classifyFoodScience(i.foodName || i.name)
  }));

  // Identificação do perfil glicêmico predominante (ponderado pelos carboidratos dos alimentos)
  let carbSum = 0;
  let weightedIgSum = 0;
  let hasLowIgCarb = false;
  let hasHighIgCarb = false;
  let hasHighVbProtein = false;
  let slowEmptyingLipidCount = 0;

  itemClassifications.forEach(it => {
    if (it.carbs > 2 && it.science.igValue != null) {
      carbSum += it.carbs;
      weightedIgSum += it.science.igValue * it.carbs;
      if (it.science.ig === GLYCEMIC_INDEX.LOW) hasLowIgCarb = true;
      if (it.science.ig === GLYCEMIC_INDEX.HIGH) hasHighIgCarb = true;
    }
    if (it.science.vb === PROTEIN_QUALITY.HIGH_VB && it.protein >= 5) {
      hasHighVbProtein = true;
    }
    if (it.science.emptying === GASTRIC_EMPTYING.SLOW || it.lipids >= 12) {
      slowEmptyingLipidCount++;
    }
  });

  const avgIg = carbSum > 0 ? Math.round(weightedIgSum / carbSum) : null;
  const overallIgProfile = avgIg == null ? 'N/A' : avgIg <= 55 ? GLYCEMIC_INDEX.LOW : avgIg <= 69 ? GLYCEMIC_INDEX.MEDIUM : GLYCEMIC_INDEX.HIGH;

  let mealScore = 100;
  const clinicalAlerts = [];
  let scientificRationale = '';
  const references = [];

  // =========================================================================
  // 1. AVALIAÇÃO CIENTÍFICA: PRÉ-TREINO
  // =========================================================================
  if (/pr[eé]-treino|pre-workout/i.test(normName)) {
    references.push('ISSN Nutrient Timing Position Stand (Kerksick et al., 2017)');
    references.push('ACSM Nutrition and Athletic Performance (Thomas et al., 2016)');

    if (totalCarb < 15) {
      mealScore -= 20;
      clinicalAlerts.push('Aporte de carboidrato pré-treino reduzido (< 15g). Substrato energético limitado para intensidade.');
    }

    // Regra de Ouro do Pré-Treino: Baixo/Médio IG para estabilidade glicêmica
    if (overallIgProfile === GLYCEMIC_INDEX.LOW || overallIgProfile === GLYCEMIC_INDEX.MEDIUM || hasLowIgCarb) {
      scientificRationale = 'Carboidratos de baixo/médio índice glicêmico garantem liberação glicêmica sustentada durante o exercício, prevenindo hipoglicemia de rebote (ISSN/ACSM).';
    } else if (overallIgProfile === GLYCEMIC_INDEX.HIGH) {
      mealScore -= 15;
      clinicalAlerts.push('Carboidratos de alto IG isolados no pré-treino podem deflagrar pico de insulina e hipoglicemia reativa no início do esforço.');
      scientificRationale = 'Atenção: Predomínio de carboidratos de absorção muito rápida. Recomendada adição de fibras solúveis ou fonte de baixo IG.';
    } else {
      scientificRationale = 'Aporte energético pré-exercício com foco em estabilidade glicêmica e prontidão muscular.';
    }

    // Esvaziamento gástrico pré-treino: controle de gorduras pesadas
    if (totalLip > 22 || slowEmptyingLipidCount > 1) {
      mealScore -= 25;
      clinicalAlerts.push('Teor lipídico elevado no pré-treino (> 20g). Risco de atraso no esvaziamento gástrico e desconforto gastrointestinal durante a atividade.');
    } else {
      scientificRationale += ' Baixo teor lipídico favorece o esvaziamento gástrico rápido e conforto digestivo.';
    }
  }

  // =========================================================================
  // 2. AVALIAÇÃO CIENTÍFICA: PÓS-TREINO
  // =========================================================================
  else if (/p[oó]s-treino|post-workout/i.test(normName)) {
    references.push('ISSN Exercise & Sports Nutrition Review (2018)');
    references.push('Journal of Physiology - Muscle Protein Synthesis (Phillips et al.)');

    // Aporte proteico: 20-40g com alto VB para atingir o limiar de leucina
    if (totalProt >= 20 && hasHighVbProtein) {
      scientificRationale = `Proteína de alto valor biológico (${totalProt.toFixed(0)}g) atinge o limiar anabólico de leucina (~2.5-3g), ativando a via mTOR e maximizando a síntese proteica muscular (MPS).`;
    } else if (totalProt < 20) {
      mealScore -= 20;
      clinicalAlerts.push(`Proteína pós-treino insuficiente (${totalProt.toFixed(1)}g < 20g). Estímulo subótimo para sinalização de MPS.`);
      scientificRationale = 'Aporte proteico moderado pós-treino; recomendável atingir o limiar de 20-40g de alto VB.';
    } else {
      scientificRationale = `Aporte proteico (${totalProt.toFixed(0)}g) adequado para a recuperação muscular tecidual.`;
    }

    // Reposição glicêmica: facilitação da captação via GLUT-4
    if (totalCarb >= 25) {
      scientificRationale += ' Carboidratos favorecem a ressíntese rápida de glicogênio muscular potencializada pela translocação independente de GLUT-4.';
    } else {
      clinicalAlerts.push('Aporte de carboidratos moderado pós-treino. Para treinos de alta depleção glicogênica, considere elevar os carboidratos.');
    }

    // Controle lipídico para não atrasar absorção pós-treino imediata
    if (totalLip > 25) {
      mealScore -= 10;
      clinicalAlerts.push('Excesso de gordura no pós-treino imediato pode lentificar a velocidade de absorção de aminoácidos.');
    }
  }

  // =========================================================================
  // 3. AVALIAÇÃO CIENTÍFICA: CAFÉ DA MANHÃ / DESJEJUM
  // =========================================================================
  else if (/caf[eé]\s*da\s*manh[aã]|desjejum|breakfast/i.test(normName)) {
    references.push('SBNE / American Journal of Clinical Nutrition (Breakfast Macronutrient Quality)');

    if (totalProt >= 20 && hasHighVbProtein) {
      scientificRationale = 'Quebra eficiente do jejum noturno com proteínas de alto VB, cessando o catabolismo muscular e restabelecendo o balanço nitrogenado positivo.';
    } else {
      scientificRationale = 'Desjejum nutritivo para reativação do metabolismo matinal.';
    }

    if (hasLowIgCarb || /aveia|fruta/i.test(safeItems.map(i => i.foodName || '').join(' '))) {
      scientificRationale += ' Carboidratos complexos com fibras e polifenóis garantem saciedade e controle glicêmico matinal.';
    }
  }

  // =========================================================================
  // 4. AVALIAÇÃO CIENTÍFICA: REFEIÇÕES PRINCIPAIS (ALMOÇO / JANTAR)
  // =========================================================================
  else if (/almo[cç]o|jantar|lunch|dinner/i.test(normName)) {
    references.push('Guia Alimentar para a População Brasileira (MS) / SBNE');

    const foodText = safeItems.map(i => i.foodName || '').join(' ');
    const hasGreens = /br[oó]colis|couve|legume|salada|abobrinha|cenoura|vegetal/i.test(foodText);
    const hasLegumes = /feij[aã]o|lentilha|gr[aã]o-de-bico/i.test(foodText);

    scientificRationale = `Refeição de alta densidade nutricional (${Math.round(totalKcal)} kcal, ${totalProt.toFixed(0)}g proteína).`;
    if (hasGreens || hasLegumes) {
      scientificRationale += ' Presença de fibras, micronutrientes e compostos bioativos apoiam a microbiota e a saciedade de longo prazo.';
    } else {
      scientificRationale += ' Fornece substrato anabólico e aporte harmônico de macronutrientes.';
    }
  }

  // =========================================================================
  // 5. AVALIAÇÃO CIENTÍFICA: LANCHES / CEIA
  // =========================================================================
  else if (/ceia|noturna/i.test(normName)) {
    references.push('Sleep Medicine Reviews / Sports Medicine (Pre-sleep Protein Nutrition)');
    if (totalProt >= 15) {
      scientificRationale = 'Aporte proteico pré-sono sustenta a taxa de síntese proteica fracionária (FSR) durante o período noturno de jejum.';
    } else {
      scientificRationale = 'Ceia leve para regulação glicêmica noturna e facilitação do descanso metabólico.';
    }
  } else {
    scientificRationale = 'Aporte balanceado e prático de macronutrientes para sustentação glicêmica entre as refeições principais.';
  }

  return Object.freeze({
    mealName: mealName || 'Refeição',
    score: Math.max(0, Math.min(100, mealScore)),
    totals: { kcal: Math.round(totalKcal), protein: totalProt, carb: totalCarb, lipid: totalLip },
    overallIg: overallIgProfile,
    averageIgValue: avgIg,
    hasHighVbProtein,
    scientificRationale: scientificRationale.trim(),
    clinicalAlerts: Object.freeze(clinicalAlerts),
    literatureReferences: Object.freeze(references)
  });
}

/**
 * Avalia globalmente a prescrição nutricional
 * 
 * @param {Array<Object>} meals Lista de refeições da prescrição
 * @param {Object} [context={}] Contexto do paciente
 * @returns {Object} Relatório global de avaliação científica
 */
function evaluatePrescriptionScience(meals = [], context = {}, options = {}) {
  const safeMeals = Array.isArray(meals) ? meals : [];
  if (safeMeals.length === 0) {
    return Object.freeze({
      scientificScore: 100,
      grade: 'A',
      mealEvaluations: [],
      globalHighlights: ['Nenhuma refeição para avaliar.'],
      recommendations: []
    });
  }

  const mealEvaluations = safeMeals.map(m => {
    const mName = m.mealName || m.name || 'Refeição';
    const mItems = m.items || m.foods || [];
    return evaluateMealScience(mName, mItems, context);
  });

  const avgScore = Math.round(mealEvaluations.reduce((acc, me) => acc + me.score, 0) / mealEvaluations.length);
  const grade = avgScore >= 90 ? 'A+ (Excelente)' : avgScore >= 80 ? 'A (Ótima)' : avgScore >= 70 ? 'B (Boa)' : 'C (Ajustável)';

  const globalHighlights = [];
  const recommendations = [];

  // Checar se tem pré e pós-treino
  const preEval = mealEvaluations.find(me => /pr[eé]-treino/i.test(me.mealName));
  const postEval = mealEvaluations.find(me => /p[oó]s-treino/i.test(me.mealName));

  if (preEval) {
    if (preEval.score >= 80) {
      globalHighlights.push('✅ Pré-Treino Otimizado: Baixo/médio índice glicêmico para estabilidade plasmática e esvaziamento gástrico preservado.');
    } else {
      recommendations.push('⚠️ Revisar pré-treino: Ajustar gorduras ou índice glicêmico para melhor conforto gastrointestinal.');
    }
  }

  if (postEval) {
    if (postEval.score >= 80) {
      globalHighlights.push('✅ Pós-Treino Eficaz: Proteínas de alto valor biológico com estímulo de MPS (mTOR) e reposição rápida de glicogênio (GLUT-4).');
    } else {
      recommendations.push('⚠️ Revisar pós-treino: Garantir no mínimo 20-30g de proteína de alto valor biológico.');
    }
  }

  // Desjejum e distribuição proteica diária
  const breakfast = mealEvaluations.find(me => /caf[eé]|desjejum/i.test(me.mealName));
  if (breakfast && breakfast.hasHighVbProtein) {
    globalHighlights.push('✅ Desjejum Anti-catabólico: Interrupção rápida do jejum noturno com proteínas de alto VB.');
  }

  return Object.freeze({
    scientificScore: avgScore,
    grade,
    mealEvaluations: Object.freeze(mealEvaluations),
    globalHighlights: Object.freeze(globalHighlights),
    recommendations: Object.freeze(recommendations),
    evaluatedAt: (options && (options.evaluatedAt || options.generatedAt)) || null
  });
}

module.exports = Object.freeze({
  GLYCEMIC_INDEX,
  PROTEIN_QUALITY,
  GASTRIC_EMPTYING,
  FOOD_SCIENCE_DATABASE,
  classifyFoodScience,
  evaluateMealScience,
  evaluatePrescriptionScience
});
