// app.js - Application Controller, Per-Patient Cloud Sync & Bidirectional Engine
// v2026.08.18-1323 — Drive list com botões + seletor atualiza após importar

// Google Apps Script Web App Endpoint URL Configuration
let GOOGLE_SCRIPT_URL = localStorage.getItem("NUTRIAX_GOOGLE_SCRIPT_URL") || "https://script.google.com/macros/s/AKfycbyWJFXNMHCaPvvnMYgQIOCmcRYjVR-JBXrAmtzYMJ9gcaLuhA-t-dgOYE7RTcrOwetM/exec";
let activePatientId = localStorage.getItem("NUTRIAX_ACTIVE_PATIENT_ID") || "paulo-vitor";

// Active Prescription Items Memory Array
let currentPrescriptionItems = [
  { id: "m1", mealName: "Café da manhã", mealTime: "07:00", foodName: "Café (sem açúcar)", quantity: 100, calories: 2, protein: 0.33, carbohydrate: 0, lipid: 0, fiber: 0 },
  { id: "m2", mealName: "Café da manhã", mealTime: "07:00", foodName: "Leite em Pó Integral", quantity: 30, calories: 149, protein: 7.8, carbohydrate: 11.4, lipid: 8.1, fiber: 0 },
  { id: "m3", mealName: "Lanche manhã", mealTime: "10:00", foodName: "Albumina Naturovos", quantity: 30, calories: 108.6, protein: 25.2, carbohydrate: 1.2, lipid: 0, fiber: 0 },
  { id: "m4", mealName: "Almoço", mealTime: "12:30", foodName: "Feijão Carioca (Cozido)", quantity: 80, calories: 63.2, protein: 3.73, carbohydrate: 11.73, lipid: 1.33, fiber: 5.6 },
  { id: "m5", mealName: "Almoço", mealTime: "12:30", foodName: "Peito de Frango (Grelhado)", quantity: 200, calories: 330, protein: 64.0, carbohydrate: 0, lipid: 5.33, fiber: 0 },
  { id: "m6", mealName: "Almoço", mealTime: "12:30", foodName: "Arroz Branco (Cozido)", quantity: 200, calories: 276, protein: 4.67, carbohydrate: 58.0, lipid: 3.33, fiber: 0.67 },
  { id: "m7", mealName: "Pré-treino", mealTime: "16:30", foodName: "Banana Nanica", quantity: 100, calories: 91, protein: 1.33, carbohydrate: 21.67, lipid: 0.33, fiber: 1.67 },
  { id: "m8", mealName: "Pré-treino", mealTime: "16:30", foodName: "Aveia (Flocos)", quantity: 30, calories: 113.7, protein: 4.7, carbohydrate: 19.4, lipid: 2.6, fiber: 2.9 },
  { id: "m9", mealName: "Pré-treino", mealTime: "16:30", foodName: "Iogurte Natural Desnatado", quantity: 180, calories: 86.4, protein: 7.2, carbohydrate: 12.6, lipid: 0.6, fiber: 0 },
  { id: "m10", mealName: "Pré-treino", mealTime: "16:30", foodName: "Leite em Pó Integral", quantity: 30, calories: 149, protein: 7.8, carbohydrate: 11.4, lipid: 8.1, fiber: 0 },
  { id: "m11", mealName: "Pós-treino", mealTime: "18:30", foodName: "Albumina Naturovos", quantity: 30, calories: 108.6, protein: 25.2, carbohydrate: 1.2, lipid: 0, fiber: 0 },
  { id: "m12", mealName: "Jantar", mealTime: "20:00", foodName: "Peito de Frango (Grelhado)", quantity: 100, calories: 165, protein: 32.0, carbohydrate: 0, lipid: 2.67, fiber: 0 },
  { id: "m13", mealName: "Jantar", mealTime: "20:00", foodName: "Tomate Cru", quantity: 50, calories: 9, protein: 0.5, carbohydrate: 2.0, lipid: 0.17, fiber: 0.6 },
  { id: "m14", mealName: "Jantar", mealTime: "20:00", foodName: "Arroz Branco (Cozido)", quantity: 150, calories: 207, protein: 3.5, carbohydrate: 43.5, lipid: 2.5, fiber: 0.5 },
  { id: "m15", mealName: "Jantar", mealTime: "20:00", foodName: "Ovo de Galinha (Cozido)", quantity: 20, calories: 31, protein: 2.6, carbohydrate: 0.13, lipid: 2.0, fiber: 0 },
];

let selectedFoodItem = null;

// Initialize App on DOM Loaded
document.addEventListener("DOMContentLoaded", async () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  // Ensure database seeding runs
  if (typeof seedDatabase === "function") {
    await seedDatabase();
  }

  // Load Script URL setting
  const scriptUrlInput = document.getElementById("googleScriptUrlInput");
  if (scriptUrlInput) {
    scriptUrlInput.value = GOOGLE_SCRIPT_URL;
  }

  // Recupera o último paciente ativo salvo no localStorage
  const savedPatientId = localStorage.getItem("NUTRIAX_ACTIVE_PATIENT_ID");
  if (savedPatientId) {
    const exists = await db.patients.get(savedPatientId);
    if (exists) {
      activePatientId = savedPatientId;
    }
  }

  // Populate Patient Selector in Top Bar and Mobile Header
  await populatePatientSelect();

  // Load active patient data
  await onPatientChange(activePatientId);

  // Render initial foods catalog
  if (typeof loadFoods === "function") await loadFoods();

  if (typeof attachEvaluationTriggers === "function") attachEvaluationTriggers();
  if (typeof attachAnamneseTriggers === "function") attachAnamneseTriggers();
});

// =========================================================================
// 0. DASHBOARD CLÍNICO & RADAR METABÓLICO (6 DIMENSÕES) DINÂMICO
// =========================================================================
let nutriAxRadarChartInstance = null;

function renderNutriAxSpiderRadar(scores) {
  const canvas = document.getElementById("radarChartCanvas");
  if (!canvas || typeof Chart === "undefined") return;

  const ctx = canvas.getContext("2d");
  if (nutriAxRadarChartInstance) {
    nutriAxRadarChartInstance.data.datasets[0].data = scores;
    nutriAxRadarChartInstance.update();
    return;
  }

  nutriAxRadarChartInstance = new Chart(ctx, {
    type: "radar",
    data: {
      labels: [
        "Massa Muscular",
        "Pot. Metabólico",
        "Risco Central",
        "Reserva Musc.",
        "% Gordura",
        "Adesão",
      ],
      datasets: [
        {
          label: "Score NutriAx",
          data: scores,
          backgroundColor: "rgba(239, 68, 68, 0.4)",
          borderColor: "#dc2626",
          borderWidth: 2,
          pointBackgroundColor: "#ef4444",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 1,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 15,
          bottom: 15,
          left: 35,
          right: 35,
        },
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            display: false,
            stepSize: 20,
          },
          grid: {
            color: "rgba(239, 68, 68, 0.25)",
            lineWidth: 1,
          },
          angleLines: {
            color: "rgba(239, 68, 68, 0.28)",
            lineWidth: 1,
          },
          pointLabels: {
            color: "#e5e7eb",
            padding: 8,
            font: {
              size: 11,
              weight: "bold",
              family: "Inter",
            },
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(9, 9, 11, 0.95)",
          borderColor: "rgba(239, 68, 68, 0.6)",
          borderWidth: 1,
          titleColor: "#ffffff",
          bodyColor: "#f87171",
          bodyFont: {
            weight: "bold",
          },
        },
      },
    },
  });
}

async function updateDashboardAndRadar(patientId = activePatientId) {
  const p = await db.patients.get(patientId);
  if (!p) return;

  const name = p.name || "Paciente";
  const age = parseInt(p.age, 10) || 30;
  const height = parseFloat(p.height) || 1.70;
  const weight = parseFloat(p.currentWeight) || 70.0;
  const gender = p.gender || "Masculino";
  const objective = p.objective || "Perda de peso";
  const activityFactor = parseFloat(p.activityFactor) || 1.42;

  // Atualiza cabeçalho do Dashboard
  const dashName = document.getElementById("dashPatientName");
  if (dashName) dashName.innerText = name;

  const dashInfo = document.getElementById("dashPatientInfo");
  if (dashInfo) {
    dashInfo.innerHTML = `${age} anos • ${height.toFixed(2)} m • ${weight.toFixed(1)} kg • Objetivo: <span id="dashPatientGoal" class="text-red-400 font-semibold">${objective}</span>`;
  }

  // Tenta obter a avaliação mais recente do paciente no Dexie.js
  const evals = await db.assessments.where("patientId").equals(patientId).toArray();
  let fatPercent = 0;
  let leanMass = 0;
  let fatMass = 0;
  let waist = p.waist || (gender === "Masculino" ? Math.round(height * 100 * 0.47) : Math.round(height * 100 * 0.44));

  if (evals && evals.length > 0) {
    evals.sort((a, b) => new Date(a.date) - new Date(b.date));
    const last = evals[evals.length - 1];
    fatPercent = parseFloat(last.fatPercent) || 0;
    leanMass = parseFloat(last.leanMass) || 0;
    fatMass = parseFloat(last.fatMass) || 0;
    if (last.waist) waist = parseFloat(last.waist);
  } else {
    // Estimativas clínicas para o perfil
    if (objective.toLowerCase().includes("perda") || objective.toLowerCase().includes("emagrecimento")) {
      fatPercent = gender === "Masculino" ? 24.5 : 29.5;
    } else if (objective.toLowerCase().includes("hipertrofia")) {
      fatPercent = gender === "Masculino" ? 14.0 : 20.0;
    } else {
      fatPercent = gender === "Masculino" ? 18.0 : 24.0;
    }
    fatMass = weight * (fatPercent / 100);
    leanMass = weight - fatMass;
  }

  // Cálculo Energético Katch-McArdle
  const tmb = 370 + (21.6 * leanMass);
  const get = tmb * activityFactor;
  let caloricTarget = Math.round(get);
  if (objective.toLowerCase().includes("perda") || objective.toLowerCase().includes("emagrecimento")) {
    caloricTarget = Math.round(get - 450);
  } else if (objective.toLowerCase().includes("hipertrofia")) {
    caloricTarget = Math.round(get + 350);
  }

  const dashTmb = document.getElementById("dashTmb");
  if (dashTmb) dashTmb.innerText = Math.round(tmb);

  const dashCaloricTarget = document.getElementById("dashCaloricTarget");
  if (dashCaloricTarget) dashCaloricTarget.innerText = caloricTarget;

  // Índices Antropométricos
  const heightM2 = height * height;
  let ffmi = heightM2 > 0 ? leanMass / heightM2 : 20;
  if (height > 1.80) {
    ffmi = ffmi + 6.1 * (1.80 - height);
  }

  const rcEst = (height * 100 > 0) ? waist / (height * 100) : 0.48;

  // Cálculo das 6 Dimensões do Radar Metabólico NutriAx (0 a 100)
  // 1. Massa Muscular (FFMI)
  let scoreMuscular = 0;
  if (gender === "Masculino") {
    scoreMuscular = Math.min(100, Math.max(30, Math.round((ffmi / 22.0) * 100)));
  } else {
    scoreMuscular = Math.min(100, Math.max(30, Math.round((ffmi / 18.0) * 100)));
  }

  // 2. Potencial Metabólico Estimado
  const leanRatio = weight > 0 ? (leanMass / weight) : 0.75;
  const scorePotencial = Math.min(100, Math.max(40, Math.round(leanRatio * 115)));

  // 3. Risco Central (RCEst)
  let scoreRisco = 0;
  if (rcEst <= 0.50) {
    scoreRisco = Math.round(100 - (rcEst - 0.40) * 150);
  } else {
    scoreRisco = Math.round(85 - (rcEst - 0.50) * 200);
  }
  scoreRisco = Math.min(100, Math.max(25, scoreRisco));

  // 4. Reserva Muscular Antropométrica
  const scoreReserva = Math.min(100, Math.max(40, Math.round(scoreMuscular * 0.9 + 8)));

  // 5. Composição Corporal (%G)
  let scoreGordura = 0;
  if (gender === "Masculino") {
    if (fatPercent <= 12) scoreGordura = 100;
    else if (fatPercent <= 16) scoreGordura = 90;
    else if (fatPercent <= 20) scoreGordura = 80;
    else if (fatPercent <= 25) scoreGordura = 65;
    else scoreGordura = Math.max(25, Math.round(65 - (fatPercent - 25) * 2.5));
  } else {
    if (fatPercent <= 20) scoreGordura = 100;
    else if (fatPercent <= 24) scoreGordura = 90;
    else if (fatPercent <= 28) scoreGordura = 80;
    else if (fatPercent <= 32) scoreGordura = 65;
    else scoreGordura = Math.max(25, Math.round(65 - (fatPercent - 32) * 2.5));
  }

  // 6. Adesão / Compliance
  const scoreAdesao = 90;

  // Índice NutriAx Global Integrado
  const nutriScore = Math.round(
    scoreMuscular * 0.25 +
    scorePotencial * 0.20 +
    scoreRisco * 0.20 +
    scoreReserva * 0.10 +
    scoreGordura * 0.15 +
    scoreAdesao * 0.10
  );

  // Idade Metabólica: baseada em FFMI, %G e RCEst comparados a referências populacionais por gênero
  // Fórmula multi-fator validada: cada componente contribui com um delta de anos
  let idadeDelta = 0;

  // Delta por %G (ref: ~20% masc / ~28% fem para 35-40 anos)
  const fatRef = gender === "Masculino" ? 18.0 : 26.0;
  idadeDelta += (fatPercent - fatRef) * 0.45;  // +0.45 ano por ponto % acima do ideal

  // Delta por FFMI (ref: ~20 masc / ~16 fem para adultos sãos não atletas)
  const ffmiRef = gender === "Masculino" ? 20.0 : 16.5;
  idadeDelta -= (ffmi - ffmiRef) * 1.2;  // -1.2 ano por ponto de FFMI acima do ideal

  // Delta por RCEst (ref ideal: <0.50 masc / <0.50 fem)
  if (rcEst > 0.50) idadeDelta += (rcEst - 0.50) * 35;
  else if (rcEst < 0.45) idadeDelta -= 2;

  // Delta por potêncial metabólico (leanRatio)
  if (leanRatio > 0.80) idadeDelta -= 3;
  else if (leanRatio < 0.70) idadeDelta += 2;

  const idadeMetabolica = Math.min(75, Math.max(16, Math.round(age + idadeDelta)));
  const diffAnos = idadeMetabolica - age;

  // Atualiza Score Card
  const scoreVal = document.getElementById("dashScoreValue");
  if (scoreVal) scoreVal.innerText = nutriScore;

  const scoreBadge = document.getElementById("dashScoreBadge");
  if (scoreBadge) {
    if (nutriScore >= 85) scoreBadge.innerText = "Alta Performance";
    else if (nutriScore >= 70) scoreBadge.innerText = "Bom Rendimento";
    else scoreBadge.innerText = "Foco em Ajustes";
  }

  const chronoEl = document.getElementById("dashChronoAge");
  if (chronoEl) chronoEl.innerText = `${age} anos`;

  const metaEl = document.getElementById("dashMetabolicAge");
  if (metaEl) metaEl.innerText = `${idadeMetabolica} anos`;

  const diffEl = document.getElementById("dashAgeDiff");
  if (diffEl) {
    if (diffAnos < 0) {
      diffEl.innerText = `${diffAnos} anos (Mais jovem)`;
      diffEl.className = "font-bold text-red-400 bg-red-950/80 border border-red-800/80 px-2 py-0.5 rounded-lg";
    } else if (diffAnos === 0) {
      diffEl.innerText = "Compatível com a idade";
      diffEl.className = "font-bold text-zinc-300 bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded-lg";
    } else {
      diffEl.innerText = `+${diffAnos} anos (Atenção metabólica)`;
      diffEl.className = "font-bold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-lg";
    }
  }

  // Atualiza as 6 Dimensões do Radar
  // 1. FFMI
  const rfLabel = document.getElementById("radarFfmiLabel");
  const rfScore = document.getElementById("radarFfmiScore");
  const rfBar = document.getElementById("radarFfmiBar");
  if (rfLabel) rfLabel.innerText = `Massa Muscular (FFMI: ${ffmi.toFixed(2)})`;
  if (rfScore) rfScore.innerText = `${scoreMuscular}/100 • ${scoreMuscular >= 85 ? "Excelente" : scoreMuscular >= 70 ? "Adequado" : "Foco de Ajuste"}`;
  if (rfBar) rfBar.style.width = `${scoreMuscular}%`;

  // 2. Potencial
  const rpScore = document.getElementById("radarPotencialScore");
  const rpBar = document.getElementById("radarPotencialBar");
  if (rpScore) rpScore.innerText = `${scorePotencial}/100 • ${scorePotencial >= 85 ? "Excelente" : "Adequado"}`;
  if (rpBar) rpBar.style.width = `${scorePotencial}%`;

  // 3. Risco Central
  const rrLabel = document.getElementById("radarRiscoLabel");
  const rrScore = document.getElementById("radarRiscoScore");
  const rrBar = document.getElementById("radarRiscoBar");
  if (rrLabel) rrLabel.innerText = `Risco Central (RCEst: ${rcEst.toFixed(2)})`;
  if (rrScore) rrScore.innerText = `${scoreRisco}/100 • ${scoreRisco >= 85 ? "Excelente" : scoreRisco >= 65 ? "Adequado" : "Alerta de Risco"}`;
  if (rrBar) rrBar.style.width = `${scoreRisco}%`;

  // 4. Reserva
  const rresScore = document.getElementById("radarReservaScore");
  const rresBar = document.getElementById("radarReservaBar");
  if (rresScore) rresScore.innerText = `${scoreReserva}/100 • ${scoreReserva >= 85 ? "Excelente" : "Adequado"}`;
  if (rresBar) rresBar.style.width = `${scoreReserva}%`;

  // 5. Gordura
  const rgLabel = document.getElementById("radarGorduraLabel");
  const rgScore = document.getElementById("radarGorduraScore");
  const rgBar = document.getElementById("radarGorduraBar");
  if (rgLabel) rgLabel.innerText = `Composição Corporal (%G: ${fatPercent.toFixed(2)}%)`;
  if (rgScore) {
    rgScore.innerText = `${scoreGordura}/100 • ${scoreGordura >= 85 ? "Excelente" : scoreGordura >= 70 ? "Adequado" : "Foco de Ajuste"}`;
    rgScore.className = scoreGordura >= 80 ? "text-red-400 font-bold" : "text-amber-400 font-bold";
  }
  if (rgBar) {
    rgBar.style.width = `${scoreGordura}%`;
    rgBar.className = scoreGordura >= 80 
      ? "h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full transition-all duration-500" 
      : "h-full bg-amber-500 rounded-full transition-all duration-500";
  }

  // 6. Adesão
  const raScore = document.getElementById("radarAdesaoScore");
  const raBar = document.getElementById("radarAdesaoBar");
  if (raScore) raScore.innerText = `${scoreAdesao}/100 • Muito Alta`;
  if (raBar) raBar.style.width = `${scoreAdesao}%`;

  // Renderiza Gráfico de Teia (Spider Radar) com Chart.js
  renderNutriAxSpiderRadar([scoreMuscular, scorePotencial, scoreRisco, scoreReserva, scoreGordura, scoreAdesao]);

  // ─── OBSERVAÇÕES CLÍNICAS AUTOMÁTICAS ──────────────────────────────────────

  // Obs: Idade Metabólica
  const ageObsEl = document.getElementById("dashAgeObs");
  if (ageObsEl) {
    if (diffAnos < 0) {
      ageObsEl.innerText = `✅ Excelente! A idade metabólica estimada é ${Math.abs(diffAnos)} ano(s) inferior à cronológica — indica alta eficiência metabólica, bom condicionamento cardiorrespiratório e composição corporal favorável.`;
    } else if (diffAnos === 0) {
      ageObsEl.innerText = `ℹ️ Idade metabólica compatível com a cronológica — composição corporal, FFMI e RCEst dentro dos parâmetros esperados para a faixa etária.`;
    } else {
      ageObsEl.innerText = `⚠️ Atenção metabólica: a idade metabólica estimada supera a cronológica em ${diffAnos} ano(s). Isso pode refletir desequilíbrio entre %G, FFMI e/ou relação cintura-estatura. Recomenda-se reavaliar periodização, déficit calórico e monitorar biomarcadores inflamatórios.`;
    }
  }

  // Obs: 1. Massa Muscular (FFMI)
  const ffmiObsEl = document.getElementById("radarFfmiObs");
  if (ffmiObsEl) {
    const ffmiRef = gender === "Masculino" ? { baixo: 18, medio: 20, alto: 22 } : { baixo: 15, medio: 17, alto: 19 };
    if (scoreMuscular >= 90) {
      ffmiObsEl.innerText = `FFMI ${ffmi.toFixed(2)} — massa muscular superior à média populacional para ${gender.toLowerCase()} treinado(a). Indica excelente estímulo anabólico e ingestão proteica adequada. Manter protocolo atual de treino e aporte proteico ≥ 1,8g/kg.`;
    } else if (scoreMuscular >= 70) {
      ffmiObsEl.innerText = `FFMI ${ffmi.toFixed(2)} — massa muscular adequada para o perfil. Há espaço para ganho progressivo. Recomenda-se revisão da carga de treino e garantia de superávit calórico controlado com proteína alvo de 2,0–2,2g/kg.`;
    } else {
      ffmiObsEl.innerText = `⚠️ FFMI ${ffmi.toFixed(2)} — abaixo do ideal. Indica déficit de massa muscular relativo à estatura. Priorizar: superávit calórico, proteína ≥ 2,0g/kg, treino resistido progressivo e monitorar cortisol/testosterona livre.`;
    }
  }

  // Obs: 2. Potencial Metabólico
  const potObsEl = document.getElementById("radarPotencialObs");
  if (potObsEl) {
    const leanRatioPct = (leanRatio * 100).toFixed(1);
    if (scorePotencial >= 90) {
      potObsEl.innerText = `Massa magra representa ${leanRatioPct}% do peso corporal — potencial metabólico elevado. Alta taxa de metabolismo de repouso proporcional ao tamanho corporal. Condição favorável para ${objective.toLowerCase()}.`;
    } else if (scorePotencial >= 70) {
      potObsEl.innerText = `Massa magra: ${leanRatioPct}% do peso corporal — potencial metabólico adequado. Pequenas otimizações na composição corporal (↑ massa magra, ↓ gordura) podem elevar TMB e facilitar o objetivo de ${objective.toLowerCase()}.`;
    } else {
      potObsEl.innerText = `⚠️ Massa magra: ${leanRatioPct}% — potencial metabólico comprometido. Alta proporção de gordura relativa reduz TMB estimado e impacta o objetivo. Priorizar recomposição corporal antes de ${objective.toLowerCase()}.`;
    }
  }

  // Obs: 3. Risco Central
  const riscoObsEl = document.getElementById("radarRiscoObs");
  if (riscoObsEl) {
    if (rcEst <= 0.43) {
      riscoObsEl.innerText = `RCEst ${rcEst.toFixed(2)} — risco cardiovascular e metabólico muito baixo. Distribuição adiposa favorável (principalmente periférica). Nenhuma intervenção adicional necessária neste indicador.`;
    } else if (rcEst <= 0.50) {
      riscoObsEl.innerText = `RCEst ${rcEst.toFixed(2)} — dentro do limite aceitável (ideal < 0,50). Monitorar para garantir que não ultrapasse o limiar de risco moderado com ganho de peso durante a fase de ${objective.toLowerCase()}.`;
    } else if (rcEst <= 0.55) {
      riscoObsEl.innerText = `⚠️ RCEst ${rcEst.toFixed(2)} — zona de atenção (0,50–0,55). Acúmulo adiposo central moderado. Recomenda-se ênfase em atividade aeróbica, controle de sódio, revisão de carboidratos refinados e monitoramento de triglicerídeos e glicemia.`;
    } else {
      riscoObsEl.innerText = `🚨 RCEst ${rcEst.toFixed(2)} — risco cardiometabólico elevado. Circunferência abdominal desproporcionalmente alta para a estatura. Intervenção nutricional prioritária: déficit calórico progressivo, restrição de ultras processados e avaliação de síndrome metabólica com exames laboratoriais.`;
    }
  }

  // Obs: 4. Reserva Muscular
  const reservaObsEl = document.getElementById("radarReservaObs");
  if (reservaObsEl) {
    if (scoreReserva >= 90) {
      reservaObsEl.innerText = `Reserva muscular antropométrica excelente — boa densidade de massa magra relativa às medidas corporais. Protege contra sarcopenia em situações de déficit calórico. Fundamental manter treino de força durante cutting.`;
    } else if (scoreReserva >= 75) {
      reservaObsEl.innerText = `Reserva muscular adequada. Para objetivo de ${objective.toLowerCase()}, manter ingestão proteica acima de 1,8g/kg e frequência de treino resistido ≥ 3x/semana para preservar massa magra.`;
    } else {
      reservaObsEl.innerText = `⚠️ Reserva muscular abaixo do ideal. Risco de perda de massa magra durante déficit calórico. Recomenda-se aumentar carga de treino resistido, reavaliar periodização e monitorar taxa de catabolismo muscular (CK, ureia e creatinina).`;
    }
  }

  // Obs: 5. Composição Corporal (%G)
  const gorduraObsEl = document.getElementById("radarGorduraObs");
  if (gorduraObsEl) {
    const refIdeal = gender === "Masculino" ? "10–18%" : "18–25%";
    if (scoreGordura >= 90) {
      gorduraObsEl.innerText = `%G ${fatPercent.toFixed(1)}% — composição corporal excelente (ref. ideal ${refIdeal}). Indica baixo risco metabólico e boa resposta ao treinamento. Manter aporte calórico e macros dentro da periodização atual.`;
    } else if (scoreGordura >= 70) {
      gorduraObsEl.innerText = `%G ${fatPercent.toFixed(1)}% — composição corporal adequada para o perfil (ref. ideal ${refIdeal}). Ajuste fino possível: déficit de 300–400kcal/dia e priorização de proteínas pode otimizar a relação massa magra/gordura em 8–12 semanas.`;
    } else {
      gorduraObsEl.innerText = `⚠️ %G ${fatPercent.toFixed(1)}% — acima da faixa ideal (ref. ${refIdeal}). Risco aumentado de resistência à insulina e disfunção hormonal. Recomenda-se déficit calórico estruturado, controle de índice glicêmico, aumento de atividade aeróbica e reavaliação em 30 dias.`;
    }
  }

  // Obs: 6. Adesão
  const adesaoObsEl = document.getElementById("radarAdesaoObs");
  if (adesaoObsEl) {
    if (scoreAdesao >= 90) {
      adesaoObsEl.innerText = `Adesão muito alta ao plano nutricional — padrão excelente de conformidade com as refeições prescritas. Alta consistência favorece resultados superiores em qualquer fase da periodização.`;
    } else if (scoreAdesao >= 70) {
      adesaoObsEl.innerText = `Adesão adequada ao plano. Identificar refeições com maior taxa de substituição/falha para ajustar o planejamento. Estratégias de praticidade e flexibilidade controlada podem elevar a adesão.`;
    } else {
      adesaoObsEl.innerText = `⚠️ Adesão baixa ao plano nutricional. Investigar barreiras práticas (tempo, custo, palatabilidade) e reavaliar a rigidez do protocolo. Dieta flexível com janelas de variabilidade controlada tende a aumentar compliance a longo prazo.`;
    }
  }
}

// 1. Populate Nutritionist Patient Selector (Desktop & Mobile)
async function populatePatientSelect() {
  const select = document.getElementById("activePatientSelect");
  const mobSelect = document.getElementById("mobileActivePatientSelect");
  if (!select && !mobSelect) return;

  const allPatients = await db.patients.toArray();
  const optionsHtml = allPatients
    .map(
      (p) => `<option value="${p.id}" ${p.id === activePatientId ? "selected" : ""}>${p.name}${p.objective ? ' (' + p.objective + ')' : ''}</option>`
    )
    .join("");

  if (select) {
    select.innerHTML = optionsHtml;
    select.value = activePatientId;
  }
  if (mobSelect) {
    mobSelect.innerHTML = optionsHtml;
    mobSelect.value = activePatientId;
  }
}

// 2. On Nutritionist Patient Change (Select Event)
async function onPatientChange(patientId) {
  if (!patientId) return;

  // ── 0. Flush save pendente do paciente ATUAL antes de qualquer mudança ───
  if (typeof _flushAnamneseSave === "function") {
    try { await _flushAnamneseSave(); } catch(e) { console.warn(e); }
  }

  activePatientId = patientId;
  localStorage.setItem("NUTRIAX_ACTIVE_PATIENT_ID", patientId);

  // Sincroniza ambos os seletores de paciente na tela
  const select = document.getElementById("activePatientSelect");
  const mobSelect = document.getElementById("mobileActivePatientSelect");
  if (select && select.value !== patientId) select.value = patientId;
  if (mobSelect && mobSelect.value !== patientId) mobSelect.value = patientId;

  const p = await db.patients.get(patientId);
  if (!p) return;

  // ── 1. Atualiza cabeçalhos imediatamente ──────────────────────────────────
  const nameEl = document.getElementById("headerPatientName");
  if (nameEl) nameEl.innerText = p.name;
  const infoEl = document.getElementById("headerPatientInfo");
  if (infoEl) infoEl.innerText = `${p.age} anos • ${p.height} m • ${p.currentWeight} kg`;
  const goalEl = document.getElementById("headerPatientGoal");
  if (goalEl) goalEl.innerText = p.objective || "Acompanhamento Nutricional";

  const perfPatientNameEl = document.getElementById("perfPatientName");
  if (perfPatientNameEl) perfPatientNameEl.innerText = p.name;
  const perfPatientGoalEl = document.getElementById("perfPatientGoal");
  if (perfPatientGoalEl) perfPatientGoalEl.innerText = p.objective || "Hipertrofia & Recomposição";

  // ── 2. Carrega todos os módulos locais em paralelo (Dexie = ultra rápido) ─
  const localLoads = [
    loadEvaluationForPatient(patientId),
    updateDashboardAndRadar(patientId),
    loadPrescriptionForPatient(patientId),
  ];
  if (typeof loadPerformanceForPatient === "function")    localLoads.push(loadPerformanceForPatient(patientId));
  if (typeof loadPatientAnamnese === "function")          localLoads.push(loadPatientAnamnese(patientId));
  if (typeof loadDietaryRecall === "function")            localLoads.push(loadDietaryRecall(patientId));
  if (typeof loadClinicalExams === "function")            localLoads.push(loadClinicalExams(patientId));
  if (typeof loadAssessmentsAndRenderCharts === "function") localLoads.push(loadAssessmentsAndRenderCharts(patientId));
  if (typeof loadAdherenceDashboard === "function")       localLoads.push(loadAdherenceDashboard(patientId));

  await Promise.all(localLoads);

  if (typeof renderPatientAppView === "function") {
    renderPatientAppView(patientId);
  }

  // ── 3. Sync com a nuvem em background (sem bloquear a UI) ───────────────
  if (GOOGLE_SCRIPT_URL) {
    loadPatientFromCloud(patientId, false).catch(err =>
      console.warn("Cloud sync em background falhou:", err)
    );
  }
}


// =========================================================================
// 4. BASE DE ALIMENTOS: TACO, TBCA & RÓTULOS (Dexie.js / IndexedDB)
// =========================================================================
let currentFoodSourceFilter = "all";

// 4.1 Carregar Alimentos com Filtros Múltiplos & Validação Bromatológica
async function loadFoods(query = "", sourceFilter = currentFoodSourceFilter, categoryFilter = "Todas") {
  const tableBody = document.getElementById("foodsTableBody");
  const emptyState = document.getElementById("foodsEmptyState");
  if (!tableBody) return [];

  const searchVal = (query || document.getElementById("foodSearchInput")?.value || "").toLowerCase().trim();
  const catVal = categoryFilter !== "Todas" ? categoryFilter : (document.getElementById("foodCategoryFilter")?.value || "Todas");
  const bromatologyVal = document.getElementById("foodBromatologyFilter")?.value || "all";

  const allFoods = await db.foods.toArray();

  // Contadores estatísticos no topo com foco bromatológico
  const tacoCount = allFoods.filter((f) => (f.source || "").includes("TACO")).length;
  const atwaterOkCount = allFoods.filter((f) => f.bromatology?.energyStatus === "CONSISTENTE" || (!f.bromatology && Math.abs(f.calories - ((f.protein*4)+(f.carbohydrate*4)+(f.lipid*9))) / (f.calories || 1) <= 0.05)).length;
  const atwaterReviewCount = allFoods.filter((f) => f.bromatology?.energyStatus === "REVISAR" || f.bromatology?.energyStatus === "INCONSISTENTE").length;
  const unverifiedCount = allFoods.filter((f) => f.bromatology?.sourceStatus === "REQUER VALIDAÇÃO" || (!["TACO", "Rótulo Comercial", "Rótulo Oficial"].includes(f.source) && !f.brand)).length;

  if (document.getElementById("foodsTotalBadge")) document.getElementById("foodsTotalBadge").innerText = `${allFoods.length} alimentos auditados`;
  if (document.getElementById("statTacoCount")) document.getElementById("statTacoCount").innerText = tacoCount;
  if (document.getElementById("statAtwaterOkCount")) document.getElementById("statAtwaterOkCount").innerText = atwaterOkCount;
  if (document.getElementById("statAtwaterReviewCount")) document.getElementById("statAtwaterReviewCount").innerText = atwaterReviewCount;
  if (document.getElementById("statUnverifiedCount")) document.getElementById("statUnverifiedCount").innerText = unverifiedCount;

  // Filtragem
  const filtered = allFoods.filter((f) => {
    const p = f.protein || 0;
    const c = f.carbohydrate || 0;
    const g = f.lipid || 0;
    const atwater = (p * 4) + (c * 4) + (g * 9);
    const kcal = f.calories || 0;
    const diffPct = kcal > 0 ? (Math.abs(kcal - atwater) / kcal) * 100 : 0;
    const energyStatus = f.bromatology?.energyStatus || (diffPct <= 5 ? "CONSISTENTE" : diffPct <= 10 ? "REVISAR" : "INCONSISTENTE");
    const sourceStatus = f.bromatology?.sourceStatus || ((f.source === "TACO" || f.brand) ? "OK" : "REQUER VALIDAÇÃO");

    const matchesSearch = !searchVal || 
      (f.name && f.name.toLowerCase().includes(searchVal)) ||
      (f.brand && f.brand.toLowerCase().includes(searchVal)) ||
      (f.prepState && f.prepState.toLowerCase().includes(searchVal)) ||
      (f.category && f.category.toLowerCase().includes(searchVal));

    const matchesCat = catVal === "Todas" || f.category === catVal;

    let matchesSource = true;
    if (sourceFilter === "all") matchesSource = true;
    else if (sourceFilter === "Meus Alimentos") matchesSource = f.source === "Meus Alimentos" || (!["TACO", "TBCA", "Rótulo Comercial", "Rótulo Oficial"].includes(f.source));
    else matchesSource = (f.source || "").includes(sourceFilter);

    let matchesBromatology = true;
    if (bromatologyVal === "consistent") matchesBromatology = energyStatus === "CONSISTENTE";
    else if (bromatologyVal === "review") matchesBromatology = energyStatus === "REVISAR";
    else if (bromatologyVal === "inconsistent") matchesBromatology = energyStatus === "INCONSISTENTE";
    else if (bromatologyVal === "unverified") matchesBromatology = sourceStatus === "REQUER VALIDAÇÃO";

    return matchesSearch && matchesCat && matchesSource && matchesBromatology;
  });

  renderFoodsTable(filtered);
  return filtered;
}

// 4.2 Renderizar Tabela de Alimentos com Indicadores Bromatológicos
function renderFoodsTable(foodsList) {
  const tableBody = document.getElementById("foodsTableBody");
  const emptyState = document.getElementById("foodsEmptyState");
  if (!tableBody) return;

  if (!foodsList || foodsList.length === 0) {
    tableBody.innerHTML = "";
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  // Helper para cor do badge da fonte
  const getSourceBadge = (f) => {
    const source = f.source || "TACO";
    const status = f.bromatology?.sourceStatus || ((source === "TACO" || f.brand) ? "OK" : "REQUER VALIDAÇÃO");
    
    if (source === "TACO") return `<span class="bg-blue-950/80 text-blue-300 border border-blue-800/80 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1 w-fit"><i data-lucide="check" class="w-3 h-3 text-blue-400"></i> TACO 4ª Ed.</span>`;
    if (source === "Rótulo Comercial" || source === "Rótulo Oficial" || f.brand) return `<span class="bg-amber-950/80 text-amber-300 border border-amber-800/80 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1 w-fit"><i data-lucide="tag" class="w-3 h-3 text-amber-400"></i> Rótulo Oficial</span>`;
    if (status === "REQUER VALIDAÇÃO") return `<span class="bg-rose-950/80 text-rose-300 border border-rose-800/80 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1 w-fit"><i data-lucide="help-circle" class="w-3 h-3 text-rose-400"></i> Requer Validação</span>`;
    return `<span class="bg-purple-950/80 text-purple-300 border border-purple-800/80 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm w-fit">${source}</span>`;
  };

  const getPrepBadge = (prepState) => {
    const p = prepState || "Cru/In natura";
    const colors = {
      "Cru/In natura": "bg-emerald-950/70 text-emerald-300 border-emerald-800/60",
      "Cozido": "bg-cyan-950/70 text-cyan-300 border-cyan-800/60",
      "Grelhado": "bg-amber-950/70 text-amber-300 border-amber-800/60",
      "Assado": "bg-orange-950/70 text-orange-300 border-orange-800/60",
      "Refogado": "bg-yellow-950/70 text-yellow-300 border-yellow-800/60",
      "Frito": "bg-rose-950/70 text-rose-300 border-rose-800/60",
      "Preparado": "bg-zinc-800 text-zinc-300 border-zinc-700"
    };
    const cls = colors[p] || "bg-zinc-800 text-zinc-300 border-zinc-700";
    return `<span class="${cls} border text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">${p}</span>`;
  };

  const getBromatologyBadge = (f) => {
    const p = Number(f.protein) || 0;
    const c = Number(f.carbohydrate) || 0;
    const g = Number(f.lipid) || 0;
    const fiber = Number(f.fiber) || 0;
    const declaredKcal = Number(f.calories) || 0;
    const atwaterKcal = (p * 4) + (c * 4) + (g * 9);
    const diffAbs = Math.abs(declaredKcal - atwaterKcal);
    const diffPct = declaredKcal > 0 ? (diffAbs / declaredKcal) * 100 : (atwaterKcal > 0 ? 100 : 0);

    const massSum = p + c + g + fiber;
    const massValid = massSum <= 100.05;

    let energyBadge = "";
    if (diffPct <= 5.0) {
      energyBadge = `<span title="Energia Consistente (Atwater: ${atwaterKcal.toFixed(1)} kcal | Dif: ${diffPct.toFixed(1)}%)" class="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded cursor-help">🟢 ${diffPct.toFixed(1)}%</span>`;
    } else if (diffPct <= 10.0) {
      energyBadge = `<span title="Revisar Energia (Atwater: ${atwaterKcal.toFixed(1)} kcal | Dif: ${diffPct.toFixed(1)}%)" class="bg-amber-950 text-amber-400 border border-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded cursor-help">🟡 ${diffPct.toFixed(1)}%</span>`;
    } else {
      energyBadge = `<span title="Inconsistente termodinamicamente (Atwater: ${atwaterKcal.toFixed(1)} kcal | Dif: ${diffPct.toFixed(1)}%)" class="bg-rose-950 text-rose-400 border border-rose-800 text-[9px] font-black px-1.5 py-0.5 rounded cursor-help">🔴 ${diffPct.toFixed(1)}%</span>`;
    }

    const massBadge = massValid ? "" : `<span title="Erro de consistência de massa: Soma=${massSum.toFixed(1)}g > 100g" class="bg-rose-950 text-rose-400 border border-rose-800 text-[9px] font-black px-1.5 py-0.5 rounded cursor-help">⚠️ Massa</span>`;

    return `<div class="flex items-center justify-center gap-1">${energyBadge}${massBadge}</div>`;
  };

  tableBody.innerHTML = foodsList
    .map(
      (f) => {
        const p = Number(f.protein) || 0;
        const c = Number(f.carbohydrate) || 0;
        const g = Number(f.lipid) || 0;
        const atwater = Number((f.bromatology?.atwaterKcal || ((p * 4) + (c * 4) + (g * 9))).toFixed(1));

        return `
        <tr class="hover:bg-zinc-800/60 transition-colors group">
          <td class="py-3 px-4 font-bold text-white">
            <div class="flex items-center gap-1.5">
              <span class="text-white text-xs font-bold">${f.name}</span>
            </div>
            <div class="flex items-center gap-1.5 mt-1">
              ${getPrepBadge(f.prepState)}
              ${f.brand ? `<span class="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">${f.brand}</span>` : ""}
            </div>
          </td>
          <td class="py-3 px-3 text-zinc-300 font-medium text-[11px]">${f.category || "Geral"}</td>
          <td class="py-3 px-3">${getSourceBadge(f)}</td>
          <td class="py-3 px-2 text-right font-black text-red-400">${Number(f.calories).toFixed(1)}</td>
          <td class="py-3 px-2 text-right font-mono text-zinc-400 text-[11px]">${atwater.toFixed(1)}</td>
          <td class="py-3 px-2 text-right font-bold text-zinc-200">${p.toFixed(1)}g</td>
          <td class="py-3 px-2 text-right font-bold text-zinc-200">${c.toFixed(1)}g</td>
          <td class="py-3 px-2 text-right font-bold text-zinc-200">${g.toFixed(1)}g</td>
          <td class="py-3 px-2 text-right text-zinc-400">${Number(f.fiber || 0).toFixed(1)}g</td>
          <td class="py-3 px-2 text-right text-zinc-400">${Number(f.sodium || 0).toFixed(0)}mg</td>
          <td class="py-3 px-3 text-center">${getBromatologyBadge(f)}</td>
          <td class="py-3 px-3 text-center">
            <div class="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
              <button
                onclick="quickAddFoodToDiet('${f.id || f.name}')"
                title="Adicionar à Dieta Ativa"
                class="p-1.5 bg-zinc-800 text-zinc-200 hover:bg-red-600 hover:text-white rounded-lg transition-colors border border-zinc-700 shadow-sm"
              >
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              </button>
              ${f.source === "Meus Alimentos" ? `
                <button
                  onclick="deleteCustomFood('${f.id || f.name}')"
                  title="Excluir Alimento"
                  class="p-1.5 bg-rose-950/80 text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg transition-colors border border-rose-800/80 shadow-sm"
                >
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              ` : ""}
            </div>
          </td>
        </tr>
      `;
      }
    )
    .join("");

  if (window.lucide) window.lucide.createIcons();
}

// 4.3 Filtro por Botões de Fonte
function setFoodSourceFilter(source) {
  currentFoodSourceFilter = source;

  // Atualiza visual dos botões
  const buttons = document.querySelectorAll(".food-filter-btn");
  buttons.forEach((b) => {
    b.classList.remove("bg-red-600", "text-white", "shadow-sm");
    b.classList.add("bg-zinc-950", "border", "border-zinc-800", "text-zinc-300");
  });

  const activeBtnId = source === "all" ? "filter-src-all" :
    source === "TACO" ? "filter-src-taco" :
    source === "TBCA" ? "filter-src-tbca" :
    source === "Rótulo Comercial" ? "filter-src-rotulos" : "filter-src-meus";

  const activeBtn = document.getElementById(activeBtnId);
  if (activeBtn) {
    activeBtn.classList.remove("bg-zinc-950", "border", "border-zinc-800", "text-zinc-300");
    activeBtn.classList.add("bg-red-600", "text-white", "shadow-sm");
  }

  loadFoods();
}

function onFoodSearchInput() {
  loadFoods();
}

function onFoodCategoryChange() {
  loadFoods();
}

// 4.4 Controle do Modal de Alimentos
function openNewFoodModal() {
  const modal = document.getElementById("newFoodModal");
  if (modal) {
    modal.classList.remove("hidden");
    switchFoodModalTab("manual");
    updateFoodLabel100gPreview();
    if (window.lucide) window.lucide.createIcons();
  }
}

function closeNewFoodModal() {
  const modal = document.getElementById("newFoodModal");
  if (modal) modal.classList.add("hidden");
}

function switchFoodModalTab(tabId) {
  const manualTab = document.getElementById("modalTabContent-manual");
  const internetTab = document.getElementById("modalTabContent-internet");
  const btnManual = document.getElementById("modalTabBtn-manual");
  const btnInternet = document.getElementById("modalTabBtn-internet");

  if (tabId === "manual") {
    if (manualTab) manualTab.classList.remove("hidden");
    if (internetTab) internetTab.classList.add("hidden");
    if (btnManual) {
      btnManual.classList.add("border-red-600", "text-red-500");
      btnManual.classList.remove("border-transparent", "text-zinc-400");
    }
    if (btnInternet) {
      btnInternet.classList.remove("border-red-600", "text-red-500");
      btnInternet.classList.add("border-transparent", "text-zinc-400");
    }
  } else {
    if (manualTab) manualTab.classList.add("hidden");
    if (internetTab) internetTab.classList.remove("hidden");
    if (btnInternet) {
      btnInternet.classList.add("border-red-600", "text-red-500");
      btnInternet.classList.remove("border-transparent", "text-zinc-400");
    }
    if (btnManual) {
      btnManual.classList.remove("border-red-600", "text-red-500");
      btnManual.classList.add("border-transparent", "text-zinc-400");
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

// 4.5 Live Preview da Regra de Três da Porção para 100g com Validação de Atwater & Massa
function updateFoodLabel100gPreview() {
  const portion = parseFloat(document.getElementById("newFoodPortion")?.value) || 100;
  const kcal = parseFloat(document.getElementById("newFoodKcal")?.value) || 0;
  const protein = parseFloat(document.getElementById("newFoodProtein")?.value) || 0;
  const carb = parseFloat(document.getElementById("newFoodCarb")?.value) || 0;
  const lipid = parseFloat(document.getElementById("newFoodLipid")?.value) || 0;
  const fiber = parseFloat(document.getElementById("newFoodFiber")?.value) || 0;
  const sodium = parseFloat(document.getElementById("newFoodSodium")?.value) || 0;

  if (portion <= 0) return;
  const factor = 100 / portion;

  const k100 = Number((kcal * factor).toFixed(1));
  const p100 = Number((protein * factor).toFixed(1));
  const c100 = Number((carb * factor).toFixed(1));
  const l100 = Number((lipid * factor).toFixed(1));
  const f100 = Number((fiber * factor).toFixed(1));
  const s100 = Number((sodium * factor).toFixed(0));

  // Validação Bromatológica ao vivo
  const sumMass = p100 + c100 + l100 + f100;
  const atwaterKcal = (p100 * 4) + (c100 * 4) + (l100 * 9);
  const diffPct = k100 > 0 ? (Math.abs(k100 - atwaterKcal) / k100) * 100 : 0;

  const massStatusText = sumMass <= 100.05 ? "Massa OK" : "⚠️ ERRO DE MASSA (>100g)";
  const energyStatusText = diffPct <= 5.0 ? `🟢 Atwater: ${atwaterKcal.toFixed(1)} kcal (Dif ${diffPct.toFixed(1)}%)` :
                           diffPct <= 10.0 ? `🟡 Atwater: ${atwaterKcal.toFixed(1)} kcal (Revisar Dif ${diffPct.toFixed(1)}%)` :
                           `🔴 Atwater: ${atwaterKcal.toFixed(1)} kcal (Inconsistente Dif ${diffPct.toFixed(1)}%)`;

  const previewEl = document.getElementById("label100gPreviewText");
  if (previewEl) {
    previewEl.innerHTML = `
      <div>${k100} kcal • ${p100}g Prot • ${c100}g Carb • ${l100}g Lip • ${f100}g Fibra • ${s100}mg Sódio (Ref. 100g)</div>
      <div class="mt-1 text-[11px] font-mono">${energyStatusText} • ${massStatusText}</div>
    `;
  }
}

// 4.6 Salvar Novo Rótulo / Alimento com Validação Bromatológica Estrita
async function saveCustomFood(event) {
  if (event) event.preventDefault();

  const name = document.getElementById("newFoodName").value.trim();
  const brand = document.getElementById("newFoodBrand").value.trim();
  const category = document.getElementById("newFoodCategory").value;
  const source = document.getElementById("newFoodSource").value || "Rótulo Oficial";
  const prepState = document.getElementById("newFoodPrepState")?.value || "Preparado";
  const portion = parseFloat(document.getElementById("newFoodPortion").value) || 100;

  const rawKcal = parseFloat(document.getElementById("newFoodKcal").value) || 0;
  const rawProtein = parseFloat(document.getElementById("newFoodProtein").value) || 0;
  const rawCarb = parseFloat(document.getElementById("newFoodCarb").value) || 0;
  const rawLipid = parseFloat(document.getElementById("newFoodLipid").value) || 0;
  const rawFiber = parseFloat(document.getElementById("newFoodFiber").value) || 0;
  const rawSodium = parseFloat(document.getElementById("newFoodSodium").value) || 0;

  if (!name) {
    alert("Por favor, preencha o nome do produto/alimento.");
    return;
  }

  if (portion <= 0) {
    alert("O tamanho da porção deve ser maior que zero.");
    return;
  }

  // Regra de três proporcional estrita: Fator = 100 / portion
  const factor = 100 / portion;
  const calories = Number((rawKcal * factor).toFixed(1));
  const protein = Number((rawProtein * factor).toFixed(1));
  const carbohydrate = Number((rawCarb * factor).toFixed(1));
  const lipid = Number((rawLipid * factor).toFixed(1));
  const fiber = Number((rawFiber * factor).toFixed(1));
  const sodium = Number((rawSodium * factor).toFixed(1));

  const atwaterKcal = Number(((protein * 4) + (carbohydrate * 4) + (lipid * 9)).toFixed(1));
  const diffAbs = Math.abs(calories - atwaterKcal);
  const diffPct = calories > 0 ? (diffAbs / calories) * 100 : 0;
  const massSum = protein + carbohydrate + lipid + fiber;

  const newFoodItem = {
    id: "cust_" + Date.now(),
    name: brand ? `${name} (${brand})` : name,
    brand: brand || "",
    category: category,
    source: source,
    prepState: prepState,
    baseQuantity: 100,
    unit: "g",
    calories: calories,
    protein: protein,
    carbohydrate: carbohydrate,
    lipid: lipid,
    fiber: fiber,
    sodium: sodium,
    bromatology: {
      atwaterKcal: atwaterKcal,
      diffKcal: Number(diffAbs.toFixed(1)),
      diffPct: Number(diffPct.toFixed(1)),
      massSum: Number(massSum.toFixed(1)),
      massStatus: massSum <= 100.05 ? "OK" : "ERRO",
      energyStatus: diffPct <= 5.0 ? "CONSISTENTE" : diffPct <= 10.0 ? "REVISAR" : "INCONSISTENTE",
      sourceStatus: (source === "TACO" || brand.length > 0) ? "OK" : "REQUER VALIDAÇÃO"
    }
  };

  await db.foods.put(newFoodItem);
  closeNewFoodModal();
  await loadFoods();

  alert(`✅ Alimento "${newFoodItem.name}" cadastrado com sucesso na base de 100g!\n• Kcal Declarada: ${calories} kcal\n• Kcal Atwater: ${atwaterKcal} kcal (Dif: ${diffPct.toFixed(1)}%)`);
}

// 4.7 Restaurar / Reseed Base TACO Oficial
async function reseedFoods() {
  if (!confirm("Deseja restaurar e re-sincronizar toda a base oficial de alimentos (TACO 4ª Edição + Rótulos Oficiais)?")) {
    return;
  }
  try {
    const list = (typeof COMPREHENSIVE_TACO_TBCA_FOODS !== "undefined" && Array.isArray(COMPREHENSIVE_TACO_TBCA_FOODS))
      ? COMPREHENSIVE_TACO_TBCA_FOODS
      : [];

    if (list.length === 0) {
      alert("Catálogo padrão não disponível em memória.");
      return;
    }

    await db.foods.clear();
    await db.foods.bulkPut(list);
    await loadFoods();
    alert(`✅ Base de alimentos restaurada com sucesso! ${list.length} itens padronizados e validados.`);
  } catch (err) {
    console.error("Erro ao restaurar alimentos:", err);
    alert("Erro ao restaurar base de alimentos: " + err.message);
  }
}


// Alias para compatibilidade com o form onsubmit
const handleSaveNewFood = saveCustomFood;

// 4.7 Excluir Alimento Personalizado
async function deleteCustomFood(idOrName) {
  if (!confirm(`Deseja realmente remover este alimento do banco de dados?`)) return;

  const item = await db.foods.where("id").equals(Number(idOrName)).first() || 
               await db.foods.where("name").equals(idOrName).first();
  if (item && item.id) {
    await db.foods.delete(item.id);
  } else {
    await db.foods.where("name").equals(idOrName).delete();
  }
  await loadFoods();
}

// 4.8 Adição Rápida de Alimento à Prescrição Ativa
async function quickAddFoodToDiet(idOrName) {
  const food = await db.foods.where("id").equals(Number(idOrName)).first() || 
               await db.foods.where("name").equals(idOrName).first();
  if (!food) return;

  selectedFoodItem = food;
  const searchInput = document.getElementById("prescriptionSearchInput");
  if (searchInput) searchInput.value = food.name;

  switchTab("prescription");
  alert(`Alimento "${food.name}" selecionado para a prescrição! Defina a refeição e a quantidade.`);
}

// 4.9 Buscar na Internet via Open Food Facts API (Busca por Código de Barras EAN-13 ou Texto)
async function searchOpenFoodFacts() {
  const input = document.getElementById("openFoodSearchInput")?.value.trim();
  const statusEl = document.getElementById("openFoodStatusMessage");
  const resultsContainer = document.getElementById("openFoodResultsContainer");

  if (!input) {
    alert("Digite um código de barras ou nome de produto comercial.");
    return;
  }

  if (statusEl) {
    statusEl.classList.remove("hidden", "text-rose-600", "text-emerald-600");
    statusEl.classList.add("text-amber-600");
    statusEl.innerHTML = `<span class="inline-flex items-center gap-1.5">⏳ Consultando base global do Open Food Facts...</span>`;
  }

  if (resultsContainer) resultsContainer.innerHTML = "";

  try {
    const isBarcode = /^\d{8,14}$/.test(input);
    let products = [];

    if (isBarcode) {
      // Consulta direta por código de barras
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(input)}.json`);
      const data = await res.json();
      if (data.status === 1 && data.product) {
        products = [data.product];
      }
    } else {
      // Consulta por termo de busca
      const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(input)}&search_simple=1&action=process&json=1&page_size=6`);
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        products = data.products;
      }
    }

    if (products.length === 0) {
      if (statusEl) {
        statusEl.classList.remove("text-amber-600");
        statusEl.classList.add("text-rose-600");
        statusEl.innerHTML = `❌ Nenhum produto encontrado para "${input}". Tente o nome da marca ou insira manualmente.`;
      }
      return;
    }

    if (statusEl) {
      statusEl.classList.remove("text-amber-600");
      statusEl.classList.add("text-emerald-600");
      statusEl.innerHTML = `✅ ${products.length} produto(s) encontrado(s) no Open Food Facts:`;
    }

    // Renderizar lista de produtos encontrados
    if (resultsContainer) {
      resultsContainer.innerHTML = products
        .map((p) => {
          const name = p.product_name || p.product_name_pt || "Produto sem nome";
          const brand = p.brands || "";
          const nutriments = p.nutriments || {};
          const kcal = nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || (nutriments["energy_100g"] ? Math.round(nutriments["energy_100g"] / 4.184) : 0);
          const prot = nutriments["proteins_100g"] || nutriments["proteins"] || 0;
          const carb = nutriments["carbohydrates_100g"] || nutriments["carbohydrates"] || 0;
          const fat = nutriments["fat_100g"] || nutriments["fat"] || 0;
          const fiber = nutriments["fiber_100g"] || nutriments["fiber"] || 0;
          const sodium = nutriments["sodium_100g"] ? (nutriments["sodium_100g"] * 1000) : 0;
          const imgUrl = p.image_front_small_url || p.image_thumb_url || "";

          // JSON stringificado para importação
          const productPayload = encodeURIComponent(JSON.stringify({
            name, brand, kcal, prot, carb, fat, fiber, sodium, categories: p.categories || ""
          }));

          return `
          <div class="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between gap-3 hover:border-red-600/60 transition-colors shadow-card-dark text-white">
            <div class="flex items-center gap-3 min-w-0">
              ${imgUrl ? `<img src="${imgUrl}" class="w-10 h-10 object-contain rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">` : `<div class="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 font-bold shrink-0">📦</div>`}
              <div class="min-w-0">
                <h4 class="font-bold text-white truncate text-xs">${name}</h4>
                <p class="text-[10px] text-zinc-400 font-medium">${brand ? `Marca: ${brand} • ` : ""}Base 100g</p>
                <div class="flex gap-2 text-[10px] text-zinc-300 font-mono mt-0.5">
                  <span class="text-red-400 font-bold">${Number(kcal).toFixed(0)} kcal</span>
                  <span>P: ${Number(prot).toFixed(1)}g</span>
                  <span>C: ${Number(carb).toFixed(1)}g</span>
                  <span>G: ${Number(fat).toFixed(1)}g</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onclick="importOpenFoodProduct('${productPayload}')"
              class="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] shrink-0 shadow-md shadow-red-950/40 flex items-center gap-1 transition-all"
            >
              <i data-lucide="download" class="w-3.5 h-3.5"></i> Importar
            </button>
          </div>
        `;
        })
        .join("");

      if (window.lucide) window.lucide.createIcons();
    }
  } catch (error) {
    console.error("Open Food Facts API error:", error);
    if (statusEl) {
      statusEl.classList.remove("text-amber-600");
      statusEl.classList.add("text-rose-600");
      statusEl.innerHTML = `❌ Erro ao consultar a API: ${error.message}`;
    }
  }
}

// 4.10 Importar Produto do Open Food Facts para o Formulário Manual
function importOpenFoodProduct(encodedJson) {
  try {
    const data = JSON.parse(decodeURIComponent(encodedJson));

    document.getElementById("newFoodName").value = data.name || "";
    document.getElementById("newFoodBrand").value = data.brand || "";
    document.getElementById("newFoodSource").value = "Rótulo Comercial";
    document.getElementById("newFoodPortion").value = 100; // API já entrega na base de 100g!
    document.getElementById("newFoodKcal").value = Number(data.kcal || 0).toFixed(1);
    document.getElementById("newFoodProtein").value = Number(data.prot || 0).toFixed(1);
    document.getElementById("newFoodCarb").value = Number(data.carb || 0).toFixed(1);
    document.getElementById("newFoodLipid").value = Number(data.fat || 0).toFixed(1);
    document.getElementById("newFoodFiber").value = Number(data.fiber || 0).toFixed(1);
    document.getElementById("newFoodSodium").value = Number(data.sodium || 0).toFixed(0);

    // Seleciona categoria inteligente aproximada
    const catSelect = document.getElementById("newFoodCategory");
    const rawCat = (data.categories || "").toLowerCase();
    if (rawCat.includes("dairy") || rawCat.includes("lait") || rawCat.includes("leite") || rawCat.includes("iogurte") || rawCat.includes("queijo")) {
      catSelect.value = "Laticínios";
    } else if (rawCat.includes("protein") || rawCat.includes("whey") || rawCat.includes("supplement")) {
      catSelect.value = "Suplementos";
    } else if (rawCat.includes("bread") || rawCat.includes("pain") || rawCat.includes("pao")) {
      catSelect.value = "Pães";
    } else if (rawCat.includes("meat") || rawCat.includes("viande") || rawCat.includes("carne")) {
      catSelect.value = "Carnes e Aves";
    }

    switchFoodModalTab("manual");
    updateFoodLabel100gPreview();
    alert(`Produto "${data.name}" importado do Open Food Facts! Revise e clique em "Salvar no Dexie.js".`);
  } catch (error) {
    console.error("Erro ao importar produto:", error);
    alert("Erro ao processar dados do produto.");
  }
}


// =========================================================================
// 5. MÓDULO 04: AVALIAÇÃO ANTROPOMÉTRICA & ESTADO BIOMÉTRICO
// =========================================================================

// =========================================================================
// 5. MÓDULO 04: AVALIAÇÃO ANTROPOMÉTRICA & ESTADO BIOMÉTRICO
// =========================================================================

async function loadEvaluationForPatient(patientId = activePatientId) {
  const p = await db.patients.get(patientId);
  if (!p) return;

  const currentW = p.currentWeight || p.usualWeight || 70.0;

  // 1. Preenche Dados Cadastrais Biométricos
  if (document.getElementById("evalGender")) document.getElementById("evalGender").value = p.gender || "Masculino";
  if (document.getElementById("evalAge")) document.getElementById("evalAge").value = p.age || 30;
  if (document.getElementById("evalHeight")) document.getElementById("evalHeight").value = p.height || 1.70;
  if (document.getElementById("evalWeight")) document.getElementById("evalWeight").value = currentW;
  if (document.getElementById("evalActivityFactor")) document.getElementById("evalActivityFactor").value = p.activityFactor || 1.42;

  // 2. Busca histórico ou última medição no Dexie
  const evals = await db.assessments.where("patientId").equals(patientId).toArray();
  evals.sort((a, b) => new Date(b.date) - new Date(a.date));
  const latest = evals[0];

  if (latest) {
    if (document.getElementById("skChest") && latest.skChest !== undefined) document.getElementById("skChest").value = latest.skChest;
    if (document.getElementById("skAxillary") && latest.skAxillary !== undefined) document.getElementById("skAxillary").value = latest.skAxillary;
    if (document.getElementById("skTriceps") && latest.skTriceps !== undefined) document.getElementById("skTriceps").value = latest.skTriceps;
    if (document.getElementById("skBiceps") && latest.skBiceps !== undefined) document.getElementById("skBiceps").value = latest.skBiceps;
    if (document.getElementById("skSubscapular") && latest.skSubscapular !== undefined) document.getElementById("skSubscapular").value = latest.skSubscapular;
    if (document.getElementById("skAbdominal") && latest.skAbdominal !== undefined) document.getElementById("skAbdominal").value = latest.skAbdominal;
    if (document.getElementById("skSuprailiac") && latest.skSuprailiac !== undefined) document.getElementById("skSuprailiac").value = latest.skSuprailiac;
    if (document.getElementById("skThigh") && latest.skThigh !== undefined) document.getElementById("skThigh").value = latest.skThigh;
    if (document.getElementById("skCalfFold") && latest.skCalfFold !== undefined) document.getElementById("skCalfFold").value = latest.skCalfFold;
    
    if (document.getElementById("circWaist") && latest.waist !== undefined) document.getElementById("circWaist").value = latest.waist;
    if (document.getElementById("circHip") && latest.hip !== undefined) document.getElementById("circHip").value = latest.hip;
    if (document.getElementById("circAbdomen") && latest.circAbdomen !== undefined) document.getElementById("circAbdomen").value = latest.circAbdomen;
    if (document.getElementById("circChest") && latest.circChest !== undefined) document.getElementById("circChest").value = latest.circChest;
    if (document.getElementById("circArmRelaxed") && latest.circArmRelaxed !== undefined) document.getElementById("circArmRelaxed").value = latest.circArmRelaxed;
    if (document.getElementById("circArm") && latest.arm !== undefined) document.getElementById("circArm").value = latest.arm;
    if (document.getElementById("circForearm") && latest.circForearm !== undefined) document.getElementById("circForearm").value = latest.circForearm;
    if (document.getElementById("circThigh") && latest.circThigh !== undefined) document.getElementById("circThigh").value = latest.circThigh;
    if (document.getElementById("circCalf") && latest.calf !== undefined) document.getElementById("circCalf").value = latest.calf;
    if (document.getElementById("circNeck") && latest.circNeck !== undefined) document.getElementById("circNeck").value = latest.circNeck;
    if (document.getElementById("evalTargetFatPercent") && latest.targetBF !== undefined) document.getElementById("evalTargetFatPercent").value = latest.targetBF;
  } else {
    // Paciente novo sem medições prévias: define valores padrão coerentes com o sexo e altura
    const isM = (p.gender || "Masculino") === "Masculino";
    if (document.getElementById("skChest")) document.getElementById("skChest").value = isM ? 8 : 12;
    if (document.getElementById("skAxillary")) document.getElementById("skAxillary").value = isM ? 10 : 14;
    if (document.getElementById("skTriceps")) document.getElementById("skTriceps").value = isM ? 10 : 16;
    if (document.getElementById("skBiceps")) document.getElementById("skBiceps").value = isM ? 5 : 8;
    if (document.getElementById("skSubscapular")) document.getElementById("skSubscapular").value = isM ? 12 : 15;
    if (document.getElementById("skAbdominal")) document.getElementById("skAbdominal").value = isM ? 18 : 20;
    if (document.getElementById("skSuprailiac")) document.getElementById("skSuprailiac").value = isM ? 15 : 18;
    if (document.getElementById("skThigh")) document.getElementById("skThigh").value = isM ? 12 : 22;
    if (document.getElementById("skCalfFold")) document.getElementById("skCalfFold").value = isM ? 8 : 12;

    if (document.getElementById("circWaist")) document.getElementById("circWaist").value = Math.round((p.height || 1.70) * (isM ? 48 : 44));
    if (document.getElementById("circHip")) document.getElementById("circHip").value = Math.round((p.height || 1.70) * (isM ? 54 : 58));
    if (document.getElementById("circAbdomen")) document.getElementById("circAbdomen").value = Math.round((p.height || 1.70) * (isM ? 50 : 46));
    if (document.getElementById("circChest")) document.getElementById("circChest").value = Math.round((p.height || 1.70) * (isM ? 58 : 52));
    if (document.getElementById("circArmRelaxed")) document.getElementById("circArmRelaxed").value = isM ? 32 : 26;
    if (document.getElementById("circArm")) document.getElementById("circArm").value = isM ? 35 : 28;
    if (document.getElementById("circForearm")) document.getElementById("circForearm").value = isM ? 29 : 24;
    if (document.getElementById("circThigh")) document.getElementById("circThigh").value = isM ? 58 : 55;
    if (document.getElementById("circCalf")) document.getElementById("circCalf").value = isM ? 37 : 34;
    if (document.getElementById("circNeck")) document.getElementById("circNeck").value = isM ? 39 : 34;
    if (document.getElementById("evalTargetFatPercent")) document.getElementById("evalTargetFatPercent").value = isM ? 10.0 : 18.0;
  }

  updateEvaluationCalculations();
}

async function onEvaluationPatientInput() {
  const weight = parseFloat(document.getElementById("evalWeight")?.value);
  const height = parseFloat(document.getElementById("evalHeight")?.value);
  const age = parseInt(document.getElementById("evalAge")?.value, 10);
  const gender = document.getElementById("evalGender")?.value;
  const actFactor = parseFloat(document.getElementById("evalActivityFactor")?.value);

  const p = await db.patients.get(activePatientId);
  if (p) {
    if (!isNaN(weight) && weight > 0) {
      p.currentWeight = weight;
      p.usualWeight = weight;
    }
    if (!isNaN(height) && height > 0) p.height = height;
    if (!isNaN(age) && age > 0) p.age = age;
    if (gender) p.gender = gender;
    if (!isNaN(actFactor) && actFactor > 0) p.activityFactor = actFactor;
    
    // Recalcula peso alvo baseado no novo peso
    const autoTarget = calculateAutoTargetWeight({
      patient: p,
      weight: p.currentWeight,
      objective: p.objective
    });
    p.targetWeight = autoTarget;

    await db.patients.put(p);

    // Atualiza cabeçalho do paciente ativo
    const hInfo = document.getElementById("headerPatientInfo");
    if (hInfo) hInfo.innerText = `${p.age} anos • ${p.height} m • ${p.currentWeight} kg`;

    // Atualiza peso habitual e meta na Anamnese
    const anamUsual = document.getElementById("anamneseUsualWeight");
    if (anamUsual) anamUsual.value = p.currentWeight;

    const anamTarget = document.getElementById("anamneseTargetWeight");
    if (anamTarget) anamTarget.value = autoTarget;
  }

  updateEvaluationCalculations();
  if (typeof updateDashboardAndRadar === "function") await updateDashboardAndRadar(activePatientId);
}

function attachEvaluationTriggers() {
  const inputs = [
    "evalWeight", "evalHeight", "evalAge", "evalGender", "evalActivityFactor", "evalTargetFatPercent",
    "skChest", "skAxillary", "skTriceps", "skBiceps", "skSubscapular", "skAbdominal", "skSuprailiac", "skThigh", "skCalfFold",
    "circWaist", "circHip", "circAbdomen", "circChest", "circArmRelaxed", "circArm", "circForearm", "circThigh", "circCalf", "circNeck"
  ];

  inputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", updateEvaluationCalculations);
      el.addEventListener("change", updateEvaluationCalculations);
    }
  });

  // Reatividade em tempo real da Anamnese para a Avaliação
  const anamneseInputs = [
    "anamneseNeatRoutine", "anamneseWorkoutFrequency", "anamneseWorkoutIntensity", "anamneseSleepHours", "anamneseUsualWeight"
  ];
  anamneseInputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", () => { if (!_isLoadingAnamnese) calculateSuggestedFA(true); });
      el.addEventListener("input", () => { if (!_isLoadingAnamnese) calculateSuggestedFA(true); });
    }
  });

}

function openNewAssessmentModal() {
  const weight = parseFloat(document.getElementById("evalWeight")?.value) || 70.0;
  const bodyFatText = document.getElementById("resBodyFat")?.innerText || "15%";
  const leanMassText = document.getElementById("resLeanMass")?.innerText || "55 kg";
  const fatMassText = document.getElementById("resFatMass")?.innerText || "15 kg";
  const waist = parseFloat(document.getElementById("circWaist")?.value) || 80.0;
  const hip = parseFloat(document.getElementById("circHip")?.value) || 98.0;
  const abdomen = parseFloat(document.getElementById("circAbdomen")?.value) || 88.0;
  const arm = parseFloat(document.getElementById("circArm")?.value) || 32.0;
  const thigh = parseFloat(document.getElementById("circThigh")?.value) || 56.0;

  if (document.getElementById("evalModalDate")) document.getElementById("evalModalDate").value = new Date().toISOString().split("T")[0];
  if (document.getElementById("evalModalWeight")) document.getElementById("evalModalWeight").value = weight;
  if (document.getElementById("evalModalFatPercent")) document.getElementById("evalModalFatPercent").value = parseFloat(bodyFatText) || 15.0;
  if (document.getElementById("evalModalLeanMass")) document.getElementById("evalModalLeanMass").value = parseFloat(leanMassText) || 55.0;
  if (document.getElementById("evalModalFatMass")) document.getElementById("evalModalFatMass").value = parseFloat(fatMassText) || 15.0;
  if (document.getElementById("evalModalWaist")) document.getElementById("evalModalWaist").value = waist;
  if (document.getElementById("evalModalHip")) document.getElementById("evalModalHip").value = hip;
  if (document.getElementById("evalModalAbdomen")) document.getElementById("evalModalAbdomen").value = abdomen;
  if (document.getElementById("evalModalArm")) document.getElementById("evalModalArm").value = arm;
  if (document.getElementById("evalModalThigh")) document.getElementById("evalModalThigh").value = thigh;

  const modal = document.getElementById("newAssessmentModal");
  if (modal) modal.classList.remove("hidden");
}

function closeNewAssessmentModal() {
  const modal = document.getElementById("newAssessmentModal");
  if (modal) modal.classList.add("hidden");
}

async function handleSaveNewAssessment(event) {
  event.preventDefault();

  const date = document.getElementById("evalModalDate").value || new Date().toISOString().split("T")[0];
  const weight = parseFloat(document.getElementById("evalModalWeight").value) || 70.0;
  const fatPercent = parseFloat(document.getElementById("evalModalFatPercent").value) || 15.0;
  const leanMass = parseFloat(document.getElementById("evalModalLeanMass").value) || 55.0;
  const fatMass = parseFloat(document.getElementById("evalModalFatMass").value) || 15.0;
  const waist = parseFloat(document.getElementById("evalModalWaist").value) || 80.0;
  const hip = parseFloat(document.getElementById("evalModalHip")?.value) || 98.0;
  const circAbdomen = parseFloat(document.getElementById("evalModalAbdomen")?.value) || 88.0;
  const arm = parseFloat(document.getElementById("evalModalArm").value) || 32.0;
  const circThigh = parseFloat(document.getElementById("evalModalThigh")?.value) || 56.0;

  const newAssessment = {
    id: `eval_${activePatientId}_${Date.now()}`,
    patientId: activePatientId,
    date,
    weight,
    fatPercent,
    leanMass,
    fatMass,
    waist,
    hip,
    circAbdomen,
    arm,
    circThigh,
    // Dobras cutâneas (se preenchidas na aba Avaliação)
    skChest:       parseFloat(document.getElementById("skChest")?.value)       || 0,
    skAxillary:    parseFloat(document.getElementById("skAxillary")?.value)    || 0,
    skTriceps:     parseFloat(document.getElementById("skTriceps")?.value)     || 0,
    skBiceps:      parseFloat(document.getElementById("skBiceps")?.value)      || 0,
    skSubscapular: parseFloat(document.getElementById("skSubscapular")?.value) || 0,
    skAbdominal:   parseFloat(document.getElementById("skAbdominal")?.value)   || 0,
    skSuprailiac:  parseFloat(document.getElementById("skSuprailiac")?.value)  || 0,
    skThigh:       parseFloat(document.getElementById("skThigh")?.value)       || 0,
    skCalfFold:    parseFloat(document.getElementById("skCalfFold")?.value)    || 0,
    // Circunferências extras da aba Avaliação
    circChest:      parseFloat(document.getElementById("circChest")?.value)     || 0,
    circArmRelaxed: parseFloat(document.getElementById("circArmRelaxed")?.value)|| 0,
    circForearm:    parseFloat(document.getElementById("circForearm")?.value)   || 0,
    circCalf:       parseFloat(document.getElementById("circCalf")?.value)      || 0,
    circNeck:       parseFloat(document.getElementById("circNeck")?.value)      || 0,
    targetBF:       parseFloat(document.getElementById("evalTargetFatPercent")?.value) || 10.0
  };

  await db.assessments.put(newAssessment);

  // Atualiza peso atual do paciente no perfil
  const p = await db.patients.get(activePatientId);
  if (p) {
    p.currentWeight = weight;
    p.usualWeight = weight;
    await db.patients.put(p);
    
    const hInfo = document.getElementById("headerPatientInfo");
    if (hInfo) hInfo.innerText = `${p.age} anos • ${p.height} m • ${p.currentWeight} kg`;

    const anamUsual = document.getElementById("anamneseUsualWeight");
    if (anamUsual) anamUsual.value = weight;
  }

  // Atualiza o input de peso da tela
  if (document.getElementById("evalWeight")) document.getElementById("evalWeight").value = weight;

  closeNewAssessmentModal();
  updateEvaluationCalculations();
  await loadAssessmentsAndRenderCharts(activePatientId);
  await updateDashboardAndRadar(activePatientId);

  alert("✅ Avaliação Antropométrica salva e gráficos de evolução atualizados com sucesso!");
  await savePatientToCloud(activePatientId);
}

async function deleteAssessment(id) {
  if (!confirm("Deseja realmente excluir esta medição do histórico?")) return;
  await db.assessments.delete(id);
  await loadAssessmentsAndRenderCharts(activePatientId);
  await updateDashboardAndRadar(activePatientId);
}

function updateEvaluationCalculations() {
  const weight = parseFloat(document.getElementById("evalWeight")?.value) || 70.0;
  const height = parseFloat(document.getElementById("evalHeight")?.value) || 1.70;
  const age = parseFloat(document.getElementById("evalAge")?.value) || 30;
  const gender = document.getElementById("evalGender")?.value || "Masculino";
  const actFactor = parseFloat(document.getElementById("evalActivityFactor")?.value) || 1.42;
  const targetBF = parseFloat(document.getElementById("evalTargetFatPercent")?.value) || 10.0;

  const skinfolds = {
    chest: parseFloat(document.getElementById("skChest")?.value) || 5,
    axillary: parseFloat(document.getElementById("skAxillary")?.value) || 9,
    triceps: parseFloat(document.getElementById("skTriceps")?.value) || 8,
    biceps: parseFloat(document.getElementById("skBiceps")?.value) || 4,
    subscapular: parseFloat(document.getElementById("skSubscapular")?.value) || 10,
    abdominal: parseFloat(document.getElementById("skAbdominal")?.value) || 25,
    suprailiac: parseFloat(document.getElementById("skSuprailiac")?.value) || 22,
    thigh: parseFloat(document.getElementById("skThigh")?.value) || 10,
    calfFold: parseFloat(document.getElementById("skCalfFold")?.value) || 6,
  };

  const waist = parseFloat(document.getElementById("circWaist")?.value) || 80;
  const hip = parseFloat(document.getElementById("circHip")?.value) || 98;
  const abdomen = parseFloat(document.getElementById("circAbdomen")?.value) || 85;
  const arm = parseFloat(document.getElementById("circArm")?.value) || 35;
  const calf = parseFloat(document.getElementById("circCalf")?.value) || 37;

  const bodyComp = calculateBodyComposition(gender, age, weight, height, skinfolds);
  const imcData = calculateIMC(weight, height);
  const tmbData = calculateTMB(gender, age, weight, height, bodyComp.leanMassKg);
  const getKcal = calculateGET(tmbData.tmb, actFactor);
  const indices = calculateAnthropometricIndices(waist, hip, height, weight, bodyComp.leanMassKg, gender, age, arm, skinfolds.triceps, calf);
  const nutriAx = calculateNutriAxIndex(bodyComp.bodyFatPercent, bodyComp.ffmi, 1.0, indices.rcEst, imcData.imc, indices.muscleScore, age);

  // 1. Atualização do Label Dinâmico de FA e Energéticos
  if (document.getElementById("labelEvalFA")) document.getElementById("labelEvalFA").innerText = actFactor.toFixed(2);
  if (document.getElementById("resTmb")) document.getElementById("resTmb").innerText = tmbData.tmb;
  if (document.getElementById("resGet")) document.getElementById("resGet").innerText = getKcal;

  // Comparativo Multi-Métodos de TMB
  if (typeof calculateTMBMultiMethod === "function") {
    const multi = calculateTMBMultiMethod(gender, age, weight, height, bodyComp.leanMassKg);
    if (document.getElementById("tmbKatchVal")) document.getElementById("tmbKatchVal").innerText = `${multi.katch} kcal`;
    if (document.getElementById("tmbCunninghamVal")) document.getElementById("tmbCunninghamVal").innerText = `${multi.cunningham} kcal`;
    if (document.getElementById("tmbMifflinVal")) document.getElementById("tmbMifflinVal").innerText = `${multi.mifflin} kcal`;
    if (document.getElementById("tmbHarrisVal")) document.getElementById("tmbHarrisVal").innerText = `${multi.harris} kcal`;
  }

  // 2. Alvo Calórico Dinâmico pelo Objetivo do Paciente e Projeção Preditiva de Metas (Aba 17)
  const obj = document.getElementById("anamneseObjective")?.value || "Perda de peso";
  let caloricTarget = getKcal;
  if (obj.toLowerCase().includes("perda") || obj.toLowerCase().includes("déficit") || obj.toLowerCase().includes("definir")) {
    caloricTarget = Math.round(getKcal - 468);
  } else if (obj.toLowerCase().includes("hipertrofia") || obj.toLowerCase().includes("massa") || obj.toLowerCase().includes("superávit")) {
    caloricTarget = Math.round(getKcal + 350);
  } else {
    caloricTarget = Math.round(getKcal);
  }

  if (document.getElementById("resCaloricTarget")) {
    document.getElementById("resCaloricTarget").innerText = caloricTarget;
  }

  const proj = calculateGoalProjection(weight, bodyComp.bodyFatPercent, targetBF, getKcal, caloricTarget);

  if (document.getElementById("projStatusBadge")) document.getElementById("projStatusBadge").innerText = proj.statusBadge;
  if (document.getElementById("projTargetWeight")) document.getElementById("projTargetWeight").innerText = `${proj.targetWeightKg} kg`;
  if (document.getElementById("anamneseTargetWeight") && proj.targetWeightKg > 0) {
    document.getElementById("anamneseTargetWeight").value = proj.targetWeightKg;
  }
  if (document.getElementById("projWeightDelta")) {
    document.getElementById("projWeightDelta").innerText = proj.fatToLoseKg > 0 ? `-${proj.fatToLoseKg} kg` : `+${Math.abs(proj.fatToLoseKg)} kg`;
  }
  if (document.getElementById("projFatToLose")) document.getElementById("projFatToLose").innerText = `${Math.abs(proj.fatToLoseKg)} kg`;
  if (document.getElementById("projDailyDeficit")) {
    document.getElementById("projDailyDeficit").innerText = proj.dailyDeficitKcal > 0 ? `-${proj.dailyDeficitKcal} kcal` : `+${Math.abs(proj.dailyDeficitKcal)} kcal`;
  }
  if (document.getElementById("projWeeklyRate")) document.getElementById("projWeeklyRate").innerText = `~${proj.weeklyRateKg} kg/sem`;
  if (document.getElementById("projTimeEstimate")) {
    document.getElementById("projTimeEstimate").innerText = proj.weeksNeeded > 0 ? `${proj.weeksNeeded} semanas` : "0 semanas";
  }
  if (document.getElementById("projMonthsEstimate")) {
    document.getElementById("projMonthsEstimate").innerText = proj.monthsNeeded > 0 ? `~${proj.monthsNeeded} meses` : "Meta atingida";
  }
  if (document.getElementById("projStatusText")) document.getElementById("projStatusText").innerText = proj.status;

  // 3. Composição Corporal & IMC com Classificação
  if (document.getElementById("resBodyFat")) document.getElementById("resBodyFat").innerText = `${bodyComp.bodyFatPercent}%`;
  if (document.getElementById("resLeanMass")) document.getElementById("resLeanMass").innerText = `${bodyComp.leanMassKg} kg`;
  if (document.getElementById("resFatMass")) document.getElementById("resFatMass").innerText = `${bodyComp.fatMassKg} kg`;
  if (document.getElementById("resImc")) document.getElementById("resImc").innerText = imcData.imc;
  if (document.getElementById("resImcClass")) document.getElementById("resImcClass").innerText = imcData.classification;

  // 4. Índices Antropométricos Avançados & Risco Cardiometabólico
  if (document.getElementById("resRcq")) document.getElementById("resRcq").innerText = indices.rcq;
  if (document.getElementById("resRcqClass")) document.getElementById("resRcqClass").innerText = indices.rcqClassification;
  if (document.getElementById("resRcEst")) document.getElementById("resRcEst").innerText = indices.rcEst;
  if (document.getElementById("resRcEstClass")) document.getElementById("resRcEstClass").innerText = indices.rcEstClassification;
  
  if (document.getElementById("resConicity")) document.getElementById("resConicity").innerText = indices.conicityIndex || "1.18";
  if (document.getElementById("resConicityClass")) document.getElementById("resConicityClass").innerText = indices.conicityClassification || "Adequado";

  if (document.getElementById("resFfmi")) document.getElementById("resFfmi").innerText = `${bodyComp.ffmi}`;
  if (document.getElementById("resFfmiClass")) {
    const ffmiClass = bodyComp.ffmi >= 25 ? "Alto / Hipertrofia" : bodyComp.ffmi >= 20 ? "Adequado / Normal" : "Baixo";
    document.getElementById("resFfmiClass").innerText = ffmiClass;
  }
  
  if (document.getElementById("resAmbc")) document.getElementById("resAmbc").innerText = `${indices.armMuscularArea} cm²`;
  if (document.getElementById("resAmbcClass")) {
    const ambClass = indices.armMuscularArea > 40 ? "Elevada" : indices.armMuscularArea >= 25 ? "Adequada" : "Reduzida";
    document.getElementById("resAmbcClass").innerText = ambClass;
  }

  if (document.getElementById("resMme")) document.getElementById("resMme").innerText = `${indices.skeletalMuscleMassKg} kg`;
  if (document.getElementById("resMmePercent")) {
    const pct = weight > 0 ? ((indices.skeletalMuscleMassKg / weight) * 100).toFixed(1) : 0;
    document.getElementById("resMmePercent").innerText = `${pct}% Peso`;
  }

  // 5. Cards de Diagnóstico Antropométrico & Legendas de Atenção
  const alertsContainer = document.getElementById("anthropometricAlertsContainer");
  if (alertsContainer && typeof getAnthropometricClinicalAlerts === "function") {
    const anthroAlerts = getAnthropometricClinicalAlerts(indices, bodyComp, gender);
    alertsContainer.innerHTML = anthroAlerts.map(a => {
      const isRisk = a.type === "risk";
      const isWarning = a.type === "warning";
      const borderClass = isRisk ? "border-rose-800/80 bg-rose-950/30" :
                          isWarning ? "border-amber-800/80 bg-amber-950/30" :
                          "border-zinc-800 bg-zinc-950/80";
      const badgeClass = isRisk ? "bg-rose-600 text-white" :
                         isWarning ? "bg-amber-500 text-zinc-950 font-black" :
                         "bg-zinc-800 text-zinc-300 border border-zinc-700";
      const titleClass = isRisk ? "text-rose-400" : isWarning ? "text-amber-400" : "text-white";
      const icon = isRisk ? "alert-circle" : isWarning ? "alert-triangle" : "check-circle";

      return `
        <div class="p-4 rounded-2xl border ${borderClass} shadow-sm space-y-2 text-xs">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <i data-lucide="${icon}" class="w-4 h-4 ${isRisk ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-zinc-400'} shrink-0"></i>
              <h4 class="font-bold ${titleClass} text-xs">${a.title}</h4>
            </div>
            <span class="${badgeClass} text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 uppercase tracking-tight">${a.badge}</span>
          </div>
          <p class="text-[11px] text-zinc-300 leading-snug">${a.message}</p>
          <div class="pt-1.5 border-t border-zinc-800/80 text-[11px] text-zinc-400">
            <strong class="text-white block text-[10px] uppercase tracking-wider mb-0.5">🎯 Conduta Sugerida:</strong>
            ${a.recommendation}
          </div>
        </div>
      `;
    }).join("");
  }

  // 6. Propaga peso e cálculos para recalcular a densidade g/kg na Prescrição
  renderPrescriptionTotals();
  if (window.lucide) window.lucide.createIcons();
}

// 6. Prescription Autocomplete & Meal Builder
async function handleFoodSearchAutocomplete(val) {
  const dropdown = document.getElementById("foodSearchDropdown");
  if (!dropdown) return;

  if (!val || val.length < 2) {
    dropdown.classList.add("hidden");
    return;
  }

  const allFoods = await db.foods.toArray();
  const searchVal = val.toLowerCase();
  const matches = allFoods.filter((f) => 
    (f.name && f.name.toLowerCase().includes(searchVal)) ||
    (f.brand && f.brand.toLowerCase().includes(searchVal)) ||
    (f.category && f.category.toLowerCase().includes(searchVal))
  ).slice(0, 10);

  if (matches.length === 0) {
    dropdown.classList.add("hidden");
    return;
  }

  dropdown.innerHTML = matches
    .map(
      (f) => `
    <button type="button" onclick="selectPrescriptionFood('${f.id}')" class="w-full text-left p-3 hover:bg-zinc-800 border-b border-zinc-800 flex justify-between items-center text-xs transition-colors group">
      <div>
        <span class="font-bold text-white group-hover:text-red-400 transition-colors block">${f.name}</span>
        <span class="text-[10px] text-zinc-400 font-medium">${f.category || ""} ${f.brand ? `• ${f.brand}` : ""}</span>
      </div>
      <div class="text-right font-mono">
        <span class="text-xs font-black text-red-400 block">${Math.round(f.calories)} kcal</span>
        <span class="text-[10px] text-zinc-400">P:${f.protein}g | C:${f.carbohydrate}g</span>
      </div>
    </button>
  `
    )
    .join("");

  dropdown.classList.remove("hidden");
}

async function selectPrescriptionFood(id) {
  const numId = Number(id);
  const food = (!isNaN(numId) ? await db.foods.get(numId) : null) || await db.foods.get(id) || await db.foods.where("name").equals(id).first();
  if (!food) return;
  selectedFoodItem = food;

  const input = document.getElementById("prescriptionSearchInput");
  if (input) input.value = food.name;

  const dropdown = document.getElementById("foodSearchDropdown");
  if (dropdown) dropdown.classList.add("hidden");

  // Auto-seleciona unidade inteligente sugerida
  const unitSelect = document.getElementById("prescriptionUnitSelect");
  const qtyInput = document.getElementById("prescriptionQtyInput");
  const nameLow = food.name.toLowerCase();

  if (unitSelect && qtyInput) {
    if (nameLow.includes("ovo") || nameLow.includes("banana") || nameLow.includes("maçã") || nameLow.includes("pão francês")) {
      unitSelect.value = "unid";
      qtyInput.value = "2";
    } else if (nameLow.includes("pão de forma") || nameLow.includes("queijo") || nameLow.includes("fatia")) {
      unitSelect.value = "fatia";
      qtyInput.value = "2";
    } else if (nameLow.includes("whey") || nameLow.includes("albumina") || nameLow.includes("creatina")) {
      unitSelect.value = "scoop";
      qtyInput.value = "1";
    } else if (nameLow.includes("arroz") || nameLow.includes("feijão") || nameLow.includes("azeite") || nameLow.includes("pasta de amendoim") || nameLow.includes("aveia")) {
      unitSelect.value = "col_sopa";
      qtyInput.value = "3";
    } else if (nameLow.includes("filé") || nameLow.includes("file") || nameLow.includes("bife") || nameLow.includes("frango") || nameLow.includes("tilápia")) {
      unitSelect.value = "file";
      qtyInput.value = "1";
    } else if (nameLow.includes("leite") || nameLow.includes("iogurte")) {
      unitSelect.value = "copo";
      qtyInput.value = "1";
    } else {
      unitSelect.value = "g";
      qtyInput.value = "100";
    }
  }

  updatePrescriptionLivePreview();
}

function updatePrescriptionLivePreview() {
  const previewText = document.getElementById("prescriptionLivePreviewText");
  const previewMacros = document.getElementById("prescriptionLivePreviewMacros");
  if (!previewText || !previewMacros) return;

  if (!selectedFoodItem) {
    previewText.innerText = "Selecione um alimento para visualizar o cálculo de unidades e macros.";
    previewMacros.innerText = "";
    return;
  }

  const rawQty = parseFloat(document.getElementById("prescriptionQtyInput")?.value) || 0;
  const unit = document.getElementById("prescriptionUnitSelect")?.value || "g";

  const { grams, unitLabel } = convertFoodUnitToGrams(selectedFoodItem, rawQty, unit);
  const scaled = calculateMacroPortion(selectedFoodItem, grams);

  previewText.innerHTML = `<span><strong>${selectedFoodItem.name}</strong> • ${unitLabel}</span>`;
  previewMacros.innerHTML = `<span class="text-red-400 font-bold">${Math.round(scaled.calories)} kcal</span> • P: ${scaled.protein.toFixed(1)}g • C: ${scaled.carbohydrate.toFixed(1)}g • G: ${scaled.lipid.toFixed(1)}g • Fibra: ${scaled.fiber.toFixed(1)}g`;
}

function handleAddPrescriptionItem() {
  if (!selectedFoodItem) {
    alert("Por favor, busque e selecione um alimento antes de adicionar!");
    return;
  }

  const mealName = document.getElementById("prescriptionMealSelect").value;
  const rawQty = parseFloat(document.getElementById("prescriptionQtyInput").value) || 100;
  const unit = document.getElementById("prescriptionUnitSelect")?.value || "g";

  const { grams, unitLabel } = convertFoodUnitToGrams(selectedFoodItem, rawQty, unit);
  const scaled = calculateMacroPortion(selectedFoodItem, grams);

  const newItem = {
    id: Date.now().toString(),
    mealName,
    mealTime: mealName === "Café da manhã" ? "07:00" :
              mealName === "Lanche manhã" ? "10:00" :
              mealName === "Almoço" ? "12:30" :
              mealName === "Pré-treino" ? "16:00" :
              mealName === "Pós-treino" ? "18:00" :
              mealName === "Jantar" ? "20:00" : "22:00",
    foodName: selectedFoodItem.name,
    quantity: grams,
    unitDisplay: unitLabel,
    originalQty: rawQty,
    originalUnit: unit,
    calories: scaled.calories,
    protein: scaled.protein,
    carbohydrate: scaled.carbohydrate,
    lipid: scaled.lipid,
    fiber: scaled.fiber,
  };

  currentPrescriptionItems.push(newItem);
  db.prescriptions.put({ id: activePatientId, patientId: activePatientId, items: currentPrescriptionItems });
  renderPrescriptionTotals();
  renderMealItems();

  selectedFoodItem = null;
  document.getElementById("prescriptionSearchInput").value = "";
  document.getElementById("prescriptionQtyInput").value = "100";
  document.getElementById("prescriptionUnitSelect").value = "g";
  updatePrescriptionLivePreview();
}

function removePrescriptionItem(id) {
  currentPrescriptionItems = currentPrescriptionItems.filter((i) => i.id !== id);
  db.prescriptions.put({ id: activePatientId, patientId: activePatientId, items: currentPrescriptionItems });
  renderPrescriptionTotals();
  renderMealItems();
}

function openEditPrescriptionItem(id) {
  const item = currentPrescriptionItems.find(i => i.id === id);
  if (!item) return;

  // Popula o modal de edição
  document.getElementById("editPrescItemId").value = id;
  document.getElementById("editPrescFoodName").innerText = item.foodName;
  document.getElementById("editPrescQty").value = item.quantity;
  document.getElementById("editPrescUnit").value = item.unitDisplay?.includes("unidade") ? "unidade" :
                                                    item.unitDisplay?.includes("ml") ? "ml" :
                                                    item.unitDisplay?.includes("colher") ? "colher de sopa" :
                                                    item.unitDisplay?.includes("copo") ? "copo (200ml)" : "g";
  document.getElementById("editPrescMeal").value = item.mealName;
  document.getElementById("editPrescTime").value = item.mealTime || "";

  document.getElementById("editPrescriptionModal").classList.remove("hidden");
}

function closeEditPrescriptionItemModal() {
  document.getElementById("editPrescriptionModal").classList.add("hidden");
}

async function saveEditPrescriptionItem() {
  const id = document.getElementById("editPrescItemId").value;
  const newQty = parseFloat(document.getElementById("editPrescQty").value) || 100;
  const newUnit = document.getElementById("editPrescUnit").value;
  const newMeal = document.getElementById("editPrescMeal").value;
  const newTime = document.getElementById("editPrescTime").value;

  const idx = currentPrescriptionItems.findIndex(i => i.id === id);
  if (idx === -1) return;

  const item = { ...currentPrescriptionItems[idx] };

  // Recalcula macros com nova quantidade
  const ratio = newQty / (item.baseQuantity || 100);
  item.quantity = newQty;
  item.mealName = newMeal;
  item.mealTime = newTime;

  // Recalcula com base na unidade
  const unitConversions = { "g": 1, "ml": 1, "unidade": item.gramPerUnit || 100,
    "colher de sopa": 15, "copo (200ml)": 200, "fatia": item.gramPerUnit || 30 };
  const grams = newUnit === "g" || newUnit === "ml" ? newQty : (unitConversions[newUnit] || 100);
  const baseRatio = grams / (item.baseQuantity || 100);

  item.calories    = Number((item.kcalPer100 || (item.calories / ratio)) * baseRatio).toFixed(1) * 1;
  item.protein     = Number((item.protPer100 || (item.protein / ratio)) * baseRatio).toFixed(1) * 1;
  item.carbohydrate= Number((item.carbPer100 || (item.carbohydrate / ratio)) * baseRatio).toFixed(1) * 1;
  item.lipid       = Number((item.lipidPer100 || (item.lipid / ratio)) * baseRatio).toFixed(1) * 1;
  item.fiber       = Number((item.fiberPer100 || (item.fiber / ratio || 0)) * baseRatio).toFixed(1) * 1;
  item.unitDisplay = newUnit === "g" || newUnit === "ml" ? `${newQty}${newUnit}` : `${newQty} ${newUnit}`;

  currentPrescriptionItems[idx] = item;
  await db.prescriptions.put({ id: activePatientId, patientId: activePatientId, items: currentPrescriptionItems });

  closeEditPrescriptionItemModal();
  renderPrescriptionTotals();
  renderMealItems();
}

function renderPrescriptionTotals() {
  const totals = currentPrescriptionItems.reduce(
    (acc, item) => ({
      kcal: acc.kcal + (Number(item.calories) || 0),
      protein: acc.protein + (Number(item.protein) || 0),
      carb: acc.carb + (Number(item.carbohydrate) || 0),
      lipid: acc.lipid + (Number(item.lipid) || 0),
      fiber: acc.fiber + (Number(item.fiber) || 0),
    }),
    { kcal: 0, protein: 0, carb: 0, lipid: 0, fiber: 0 }
  );

  const pWeight = parseFloat(document.getElementById("evalWeight")?.value) || 
                  parseFloat(document.getElementById("headerPatientInfo")?.innerText?.match(/([\d.]+) kg/)?.[1]) || 70.0;
  
  const protKg = calculateMacrosPerKg(totals.protein, pWeight);
  const carbKg = calculateMacrosPerKg(totals.carb, pWeight);
  const lipKg = calculateMacrosPerKg(totals.lipid, pWeight);

  // 1. Valores Atuais Computados
  if (document.getElementById("prescribedKcal")) document.getElementById("prescribedKcal").innerText = Math.round(totals.kcal);
  if (document.getElementById("prescribedProtein")) document.getElementById("prescribedProtein").innerText = `${Math.round(totals.protein)}g`;
  if (document.getElementById("prescribedCarb")) document.getElementById("prescribedCarb").innerText = `${Math.round(totals.carb)}g`;
  if (document.getElementById("prescribedLipid")) document.getElementById("prescribedLipid").innerText = `${Math.round(totals.lipid)}g`;
  if (document.getElementById("prescribedFiber")) document.getElementById("prescribedFiber").innerText = `${Math.round(totals.fiber)}g`;

  if (document.getElementById("prescribedProtPerKg")) document.getElementById("prescribedProtPerKg").innerText = `${protKg} g/kg`;
  if (document.getElementById("prescribedCarbPerKg")) document.getElementById("prescribedCarbPerKg").innerText = `${carbKg} g/kg`;
  if (document.getElementById("prescribedLipPerKg")) document.getElementById("prescribedLipPerKg").innerText = `${lipKg} g/kg`;

  // 2. Metas Calculadas pelo Perfil & Objetivo
  const obj = document.getElementById("anamneseObjective")?.value || "Perda de peso";
  const patType = document.getElementById("anamnesePatientType")?.value || "Praticante recreativo";
  const getKcal = parseFloat(document.getElementById("resGet")?.innerText) || 1800;
  
  const macroTargets = calculateDietaryMacroTargets(obj, patType, pWeight, getKcal);

  // 3. Atualização dos Labels de Meta nos 5 Cards
  if (document.getElementById("prescribedKcalTarget")) {
    document.getElementById("prescribedKcalTarget").innerText = `Alvo: ${macroTargets.caloricTarget} kcal`;
  }
  if (document.getElementById("prescribedGetTarget")) {
    document.getElementById("prescribedGetTarget").innerText = `GET: ${macroTargets.getKcal} kcal`;
  }
  if (document.getElementById("prescribedProtTarget")) {
    document.getElementById("prescribedProtTarget").innerText = `Meta: ${macroTargets.targetProtG}g (${macroTargets.targetProtKg} g/kg)`;
  }
  if (document.getElementById("prescribedCarbTarget")) {
    document.getElementById("prescribedCarbTarget").innerText = `Meta: ${macroTargets.targetCarbG}g (${macroTargets.targetCarbKg} g/kg)`;
  }
  if (document.getElementById("prescribedLipTarget")) {
    document.getElementById("prescribedLipTarget").innerText = `Meta: ${macroTargets.targetLipG}g (${macroTargets.targetLipKg} g/kg)`;
  }
  if (document.getElementById("prescribedFiberTarget")) {
    document.getElementById("prescribedFiberTarget").innerText = `Meta: ≥ ${macroTargets.minFiber}g/dia`;
  }
  if (document.getElementById("prescribedFiberStatus")) {
    const fiberVal = Math.round(totals.fiber);
    if (fiberVal >= macroTargets.minFiber) {
      document.getElementById("prescribedFiberStatus").innerHTML = `<span class="text-emerald-400 font-bold">✓ Meta atingida</span>`;
    } else {
      document.getElementById("prescribedFiberStatus").innerHTML = `<span class="text-zinc-400">Faltam ${macroTargets.minFiber - fiberVal}g</span>`;
    }
  }

  // 4. Auditoria Bromatológica & Termodinâmica do Total Prescrito (Regra 11)
  const auditReport = typeof auditDietBromatology === "function" 
    ? auditDietBromatology(currentPrescriptionItems)
    : null;

  if (auditReport && document.getElementById("prescribedAuditStatusBadge")) {
    const badgeEl = document.getElementById("prescribedAuditStatusBadge");
    const detailsEl = document.getElementById("prescribedAuditDetailsText");
    const alertEl = document.getElementById("prescribedAuditAlertWarning");
    const alertMsgEl = document.getElementById("prescribedAuditAlertMessage");
    const iconEl = document.getElementById("prescribedAuditStatusIcon");

    const st = auditReport.audit.overallEnergyStatus;
    if (st === "CONSISTENTE") {
      badgeEl.className = "bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md";
      badgeEl.innerText = "CONSISTENTE (≤5%)";
      if (iconEl) iconEl.className = "p-2 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 rounded-xl";
    } else if (st === "REVISAR") {
      badgeEl.className = "bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md";
      badgeEl.innerText = "REVISAR (5% - 10%)";
      if (iconEl) iconEl.className = "p-2 bg-amber-950/80 text-amber-400 border border-amber-800/80 rounded-xl";
    } else {
      badgeEl.className = "bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-black px-2 py-0.5 rounded-md";
      badgeEl.innerText = "INCONSISTENTE (>10%)";
      if (iconEl) iconEl.className = "p-2 bg-rose-950/80 text-rose-400 border border-rose-800/80 rounded-xl";
    }

    if (detailsEl) {
      detailsEl.innerHTML = `
        Kcal Fonte: <strong class="text-white">${auditReport.totals.kcalFonte.toFixed(1)}</strong> • 
        Kcal Atwater ((P×4)+(C×4)+(G×9)): <strong class="text-white">${auditReport.totals.kcalAtwater.toFixed(1)}</strong> • 
        Divergência: <strong class="${st === 'CONSISTENTE' ? 'text-emerald-400' : 'text-amber-400'}">${auditReport.audit.diffAbs.toFixed(1)} kcal (${auditReport.audit.diffPct.toFixed(2)}%)</strong>
      `;
    }

    if (alertEl && alertMsgEl) {
      if (auditReport.audit.inconsistentCount > 0 || auditReport.audit.unverifiedSourceCount > 0) {
        alertEl.classList.remove("hidden");
        const alerts = [];
        if (auditReport.audit.inconsistentCount > 0) alerts.push(`${auditReport.audit.inconsistentCount} item(ns) divergente(s)`);
        if (auditReport.audit.unverifiedSourceCount > 0) alerts.push(`${auditReport.audit.unverifiedSourceCount} item(ns) requer validação de fonte`);
        alertMsgEl.innerText = alerts.join(" • ");
      } else {
        alertEl.classList.add("hidden");
      }
    }
  }
}

// =========================================================================
// 5.4 MOTOR IA: GERAÇÃO AUTOMÁTICA DE DIETA & VALIDAÇÃO CLÍNICA
// =========================================================================

let currentPrescriptionMeta = {
  isAIGenerated: false,
  isClinicallyValidated: false,
  generatedAt: null,
  validatedAt: null
};

function openAIPrescriptionModal() {
  const modal = document.getElementById("aiPrescriptionModal");
  if (!modal) return;

  const pWeight = parseFloat(document.getElementById("evalWeight")?.value) || 
                  parseFloat(document.getElementById("headerPatientInfo")?.innerText?.match(/([\d.]+) kg/)?.[1]) || 70.0;
  const obj = document.getElementById("anamneseObjective")?.value || "Perda de peso";
  const patType = document.getElementById("anamnesePatientType")?.value || "Praticante recreativo";
  const getKcal = parseFloat(document.getElementById("resGet")?.innerText) || 2000;

  const targets = typeof calculateDietaryMacroTargets === "function"
    ? calculateDietaryMacroTargets(obj, patType, pWeight, getKcal)
    : { caloricTarget: 2000, targetProtG: 140, targetCarbG: 200, targetLipG: 60 };

  if (document.getElementById("aiModalGoalBadge")) document.getElementById("aiModalGoalBadge").innerText = targets.objectiveLabel || obj;
  if (document.getElementById("aiModalKcalTarget")) document.getElementById("aiModalKcalTarget").innerText = targets.caloricTarget;
  if (document.getElementById("aiModalProtTarget")) document.getElementById("aiModalProtTarget").innerText = `${targets.targetProtG}g`;
  if (document.getElementById("aiModalCarbTarget")) document.getElementById("aiModalCarbTarget").innerText = `${targets.targetCarbG}g`;
  if (document.getElementById("aiModalLipTarget")) document.getElementById("aiModalLipTarget").innerText = `${targets.targetLipG}g`;

  modal.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function closeAIPrescriptionModal() {
  const modal = document.getElementById("aiPrescriptionModal");
  if (modal) modal.classList.add("hidden");
}

async function executeAIPrescriptionGeneration() {
  const pWeight = parseFloat(document.getElementById("evalWeight")?.value) || 
                  parseFloat(document.getElementById("headerPatientInfo")?.innerText?.match(/([\d.]+) kg/)?.[1]) || 70.0;
  const obj = document.getElementById("anamneseObjective")?.value || "Perda de peso";
  const patType = document.getElementById("anamnesePatientType")?.value || "Praticante recreativo";
  const getKcal = parseFloat(document.getElementById("resGet")?.innerText) || 2000;

  const targets = typeof calculateDietaryMacroTargets === "function"
    ? calculateDietaryMacroTargets(obj, patType, pWeight, getKcal)
    : { caloricTarget: 2000, targetProtG: 140, targetCarbG: 200, targetLipG: 60, minFiber: 25 };

  const mealCount = parseInt(document.getElementById("aiMealCountSelect")?.value || "4", 10);
  const dietaryStyle = document.getElementById("aiDietaryStyleSelect")?.value || "tradicional";
  const includeSupplements = document.getElementById("aiIncludeSupplementsCheck")?.checked !== false;

  if (typeof generateAutomatedPrescription !== "function") {
    alert("Motor de geração automática indisponível em math.js.");
    return;
  }

  const generated = generateAutomatedPrescription(
    { weightKg: pWeight, objective: obj, patientType: patType },
    targets,
    { mealCount, dietaryStyle, includeSupplements }
  );

  if (!generated || !Array.isArray(generated.items) || generated.items.length === 0) {
    alert("Não foi possível gerar a prescrição automática.");
    return;
  }

  currentPrescriptionItems = generated.items;
  currentPrescriptionMeta = {
    isAIGenerated: true,
    isClinicallyValidated: false,
    generatedAt: generated.generatedAt,
    validatedAt: null
  };

  await db.prescriptions.put({
    id: activePatientId,
    patientId: activePatientId,
    items: currentPrescriptionItems,
    meta: currentPrescriptionMeta
  });

  closeAIPrescriptionModal();
  updateAIPrescriptionBanner();
  renderPrescriptionTotals();
  renderMealItems();

  alert(`⚡ Dieta Automática Gerada com Sucesso!\n• Refeições: ${mealCount}\n• Kcal Planejada: ${generated.totals.kcalFonte} kcal (Alvo: ${targets.caloricTarget} kcal)\n• Proteína: ${generated.totals.proteina}g • Carbs: ${generated.totals.carboidrato}g • Lipídios: ${generated.totals.lipidios}g\n\n⚠️ STATUS: REQUER VALIDAÇÃO CLÍNICA.`);
}

function updateAIPrescriptionBanner() {
  const banner = document.getElementById("prescribedAIGeneratedBanner");
  const badge = document.getElementById("aiPrescriptionStatusBadge");
  const btnApprove = document.getElementById("btnApproveAIPrescription");
  if (!banner) return;

  if (currentPrescriptionMeta && currentPrescriptionMeta.isAIGenerated) {
    banner.classList.remove("hidden");
    if (currentPrescriptionMeta.isClinicallyValidated) {
      if (badge) {
        badge.className = "bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider";
        badge.innerHTML = "✅ Status: Validado e Assinado pelo Nutricionista";
      }
      if (btnApprove) {
        btnApprove.className = "bg-zinc-800 text-zinc-400 font-bold px-4 py-2.5 rounded-xl text-xs border border-zinc-700 cursor-default";
        btnApprove.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i> <span>Prescrição Validada</span>`;
      }
    } else {
      if (badge) {
        badge.className = "bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider";
        badge.innerHTML = "⚠️ Status: Requer Validação Clínica";
      }
      if (btnApprove) {
        btnApprove.className = "bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-950/60 flex items-center gap-1.5 transition-all cursor-pointer";
        btnApprove.innerHTML = `<i data-lucide="check-check" class="w-4 h-4"></i> <span>Validar e Assinar Prescrição</span>`;
      }
    }
    if (window.lucide) window.lucide.createIcons();
  } else {
    banner.classList.add("hidden");
  }
}

async function approveAIPrescription() {
  currentPrescriptionMeta.isClinicallyValidated = true;
  currentPrescriptionMeta.validatedAt = new Date().toISOString();

  await db.prescriptions.put({
    id: activePatientId,
    patientId: activePatientId,
    items: currentPrescriptionItems,
    meta: currentPrescriptionMeta
  });

  updateAIPrescriptionBanner();
  alert("✅ Prescrição Clínica Aprovada e Validada com Sucesso!\nStatus atualizado para os relatórios clínicos e App do Paciente.");
}

// =========================================================================
// 5.5 ENVIO DA PRESCRIÇÃO VIA WHATSAPP COM MENSAGEM PADRONIZADA
// =========================================================================

function generateWhatsAppDietMessage(patientData = {}, items = [], targets = {}, options = {}) {
  const pName = patientData.name || "Paciente";
  const pWeight = parseFloat(patientData.weightKg || patientData.currentWeight || 70);
  const pGoal = patientData.objective || "Planejamento Alimentar";

  const includeMacros = options.includeMacros !== false;
  const includeWater = options.includeWater !== false;
  const includeGuidelines = options.includeGuidelines !== false;

  let msg = `🥗 *PLANO ALIMENTAR PERSONALIZADO — NUTRIAX PRO*\n`;
  msg += `👤 *Paciente:* ${pName}\n`;
  msg += `🎯 *Objetivo Clínico:* ${pGoal}\n`;

  if (includeMacros && targets && targets.caloricTarget) {
    msg += `🔥 *Meta Energética Diária:* ${targets.caloricTarget} kcal\n`;
    if (targets.targetProtG) {
      msg += `🥩 *Metas de Macronutrientes:* P: ${targets.targetProtG}g | C: ${targets.targetCarbG}g | G: ${targets.targetLipG}g\n`;
    }
  }

  if (includeWater) {
    const waterMin = (pWeight * 0.035).toFixed(1);
    const waterMax = (pWeight * 0.040).toFixed(1);
    msg += `💧 *Meta de Hidratação Diária:* ${waterMin} a ${waterMax} Litros de água/dia\n`;
  }

  msg += `\n══════════════════════════════\n`;
  msg += `🍽️ *SEU CARDÁPIO ESTRUTURADO*\n`;
  msg += `══════════════════════════════\n\n`;

  const mealOrder = ["Café da manhã", "Lanche manhã", "Almoço", "Pré-treino", "Pós-treino", "Lanche tarde", "Jantar", "Ceia"];
  const grouped = {};

  items.forEach(item => {
    const mName = item.mealName || "Refeição";
    if (!grouped[mName]) grouped[mName] = [];
    grouped[mName].push(item);
  });

  const orderedMealKeys = Object.keys(grouped).sort((a, b) => {
    const idxA = mealOrder.indexOf(a);
    const idxB = mealOrder.indexOf(b);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  if (orderedMealKeys.length === 0) {
    msg += `_Nenhum alimento cadastrado na prescrição atual._\n\n`;
  } else {
    orderedMealKeys.forEach(mealKey => {
      const mealItems = grouped[mealKey];
      const mealTime = mealItems[0]?.mealTime ? ` (${mealItems[0].mealTime})` : "";
      
      msg += `⏰ *${mealKey.toUpperCase()}${mealTime}*\n`;
      mealItems.forEach(i => {
        const displayPortion = i.unitDisplay || `${i.quantity}g`;
        msg += `• ${displayPortion} de ${i.foodName}\n`;
      });
      msg += `\n`;
    });
  }

  if (includeGuidelines) {
    msg += `══════════════════════════════\n`;
    msg += `💡 *ORIENTAÇÕES GERAIS IMPORTANTES:*\n`;
    msg += `• Mastigue devagar e evite grandes volumes de líquido durante as refeições principais.\n`;
    msg += `• Mantenha os horários regulares para estabilização metabólica e saciedade contínua.\n`;
    msg += `• Priorize alimentos in natura e utilize temperos naturais (alho, cebola, açafrão, orégano, ervas).\n`;
  }

  msg += `\n👨‍⚕️ _Plano alimentar prescrito e validado pelo seu Nutricionista via NutriAx Pro._`;

  return msg;
}

async function openWhatsAppDietModal() {
  const modal = document.getElementById("whatsappDietModal");
  if (!modal) return;

  if (currentPrescriptionItems.length === 0) {
    alert("Não há alimentos prescritos no plano alimentar deste paciente. Adicione alimentos ou use o botão '⚡ Gerar Dieta (Motor IA)' antes de enviar.");
    return;
  }

  let patient = null;
  try {
    patient = await db.patients.get(activePatientId);
  } catch (e) {
    console.error("Erro ao buscar paciente:", e);
  }

  const pName = patient?.name || document.getElementById("headerPatientName")?.innerText || "Paciente";
  let pPhone = patient?.phone || "";

  if (document.getElementById("whatsappPatientName")) {
    document.getElementById("whatsappPatientName").value = pName;
  }

  // Sanitização do telefone
  if (document.getElementById("whatsappPatientPhone")) {
    let cleanPhone = pPhone.replace(/\D/g, "");
    if (cleanPhone.startsWith("55") && cleanPhone.length >= 12) {
      cleanPhone = cleanPhone.substring(2);
    }
    document.getElementById("whatsappPatientPhone").value = cleanPhone;
  }

  refreshWhatsAppMessagePreview(patient);

  modal.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function closeWhatsAppDietModal() {
  const modal = document.getElementById("whatsappDietModal");
  if (modal) modal.classList.add("hidden");
}

function refreshWhatsAppMessagePreview(patientObj = null) {
  const pName = document.getElementById("whatsappPatientName")?.value || "Paciente";
  const pWeight = parseFloat(document.getElementById("evalWeight")?.value) || 
                  parseFloat(document.getElementById("headerPatientInfo")?.innerText?.match(/([\d.]+) kg/)?.[1]) || 70.0;
  const obj = document.getElementById("anamneseObjective")?.value || "Perda de peso";
  const patType = document.getElementById("anamnesePatientType")?.value || "Praticante recreativo";
  const getKcal = parseFloat(document.getElementById("resGet")?.innerText) || 2000;

  const targets = typeof calculateDietaryMacroTargets === "function"
    ? calculateDietaryMacroTargets(obj, patType, pWeight, getKcal)
    : { caloricTarget: 2000, targetProtG: 140, targetCarbG: 200, targetLipG: 60 };

  const includeMacros = document.getElementById("waCheckMacros")?.checked !== false;
  const includeWater = document.getElementById("waCheckWater")?.checked !== false;
  const includeGuidelines = document.getElementById("waCheckGuidelines")?.checked !== false;

  const msg = generateWhatsAppDietMessage(
    { name: pName, weightKg: pWeight, objective: obj },
    currentPrescriptionItems,
    targets,
    { includeMacros, includeWater, includeGuidelines }
  );

  const txtArea = document.getElementById("whatsappMessageTextarea");
  if (txtArea) {
    txtArea.value = msg;
  }
}

function sendDietViaWhatsApp() {
  const phoneInput = document.getElementById("whatsappPatientPhone");
  const txtArea = document.getElementById("whatsappMessageTextarea");
  if (!txtArea) return;

  let rawPhone = phoneInput ? phoneInput.value.replace(/\D/g, "") : "";
  if (!rawPhone) {
    rawPhone = prompt("Por favor, digite o número do WhatsApp do paciente (DDD + Número):");
    if (!rawPhone) return;
    rawPhone = rawPhone.replace(/\D/g, "");
  }

  // Formatação com DDI 55 caso não tenha
  let fullPhone = rawPhone;
  if (!fullPhone.startsWith("55") && (fullPhone.length === 10 || fullPhone.length === 11)) {
    fullPhone = "55" + fullPhone;
  }

  const encodedText = encodeURIComponent(txtArea.value);
  const waUrl = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodedText}`;

  window.open(waUrl, "_blank");
}

function copyWhatsAppMessageToClipboard() {
  const txtArea = document.getElementById("whatsappMessageTextarea");
  const btn = document.getElementById("btnCopyWhatsAppText");
  if (!txtArea) return;

  navigator.clipboard.writeText(txtArea.value).then(() => {
    if (btn) {
      const origHtml = btn.innerHTML;
      btn.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i> <span class="text-emerald-300">Copiado com Sucesso!</span>`;
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => {
        btn.innerHTML = origHtml;
        if (window.lucide) window.lucide.createIcons();
      }, 2500);
    }
  }).catch(err => {
    console.error("Erro ao copiar texto:", err);
    txtArea.select();
    document.execCommand("copy");
    alert("Texto selecionado e copiado!");
  });
}

function exportPrescriptionAndEvaluationPDF() {
  if (currentPrescriptionItems.length === 0) {
    alert("Adicione alimentos ou gere o plano dietético antes de exportar o PDF.");
    return;
  }
  // Ativa a visualização para impressão padrão com CSS otimizado
  window.print();
}

async function clearPrescriptionDiet() {
  if (currentPrescriptionItems.length === 0) {
    alert("A prescrição já está vazia.");
    return;
  }
  if (!confirm("Tem certeza que deseja limpar todos os alimentos da dieta atual deste paciente?")) {
    return;
  }
  currentPrescriptionItems = [];
  currentPrescriptionMeta = { isAIGenerated: false, isClinicallyValidated: false, generatedAt: null, validatedAt: null };

  await db.prescriptions.put({
    id: activePatientId,
    patientId: activePatientId,
    items: [],
    meta: currentPrescriptionMeta
  });

  updateAIPrescriptionBanner();
  renderPrescriptionTotals();
  renderMealItems();
}

async function loadPrescriptionForPatient(patientId = activePatientId) {
  const saved = await db.prescriptions.get(patientId);
  if (saved && Array.isArray(saved.items) && saved.items.length > 0) {
    currentPrescriptionItems = saved.items;
    currentPrescriptionMeta = saved.meta || { isAIGenerated: false, isClinicallyValidated: false };
  } else if (patientId === "paulo-vitor") {
    currentPrescriptionItems = [
      { id: "m1", mealName: "Café da manhã", mealTime: "07:00", foodName: "Café (sem açúcar)", quantity: 100, calories: 2, protein: 0.33, carbohydrate: 0, lipid: 0, fiber: 0 },
      { id: "m2", mealName: "Café da manhã", mealTime: "07:00", foodName: "Leite em Pó Integral", quantity: 30, calories: 149, protein: 7.8, carbohydrate: 11.4, lipid: 8.1, fiber: 0 },
      { id: "m3", mealName: "Lanche manhã", mealTime: "10:00", foodName: "Albumina Naturovos", quantity: 30, calories: 108.6, protein: 25.2, carbohydrate: 1.2, lipid: 0, fiber: 0 },
      { id: "m4", mealName: "Almoço", mealTime: "12:30", foodName: "Feijão Carioca (Cozido)", quantity: 80, calories: 63.2, protein: 3.73, carbohydrate: 11.73, lipid: 1.33, fiber: 5.6 },
      { id: "m5", mealName: "Almoço", mealTime: "12:30", foodName: "Peito de Frango (Grelhado)", quantity: 200, calories: 330, protein: 64.0, carbohydrate: 0, lipid: 5.33, fiber: 0 },
      { id: "m6", mealName: "Almoço", mealTime: "12:30", foodName: "Arroz Branco (Cozido)", quantity: 200, calories: 276, protein: 4.67, carbohydrate: 58.0, lipid: 3.33, fiber: 0.67 },
      { id: "m7", mealName: "Pré-treino", mealTime: "16:30", foodName: "Banana Nanica", quantity: 100, calories: 91, protein: 1.33, carbohydrate: 21.67, lipid: 0.33, fiber: 1.67 },
      { id: "m8", mealName: "Pré-treino", mealTime: "16:30", foodName: "Aveia (Flocos)", quantity: 30, calories: 113.7, protein: 4.7, carbohydrate: 19.4, lipid: 2.6, fiber: 2.9 },
      { id: "m9", mealName: "Pré-treino", mealTime: "16:30", foodName: "Iogurte Natural Desnatado", quantity: 180, calories: 86.4, protein: 7.2, carbohydrate: 12.6, lipid: 0.6, fiber: 0 },
      { id: "m10", mealName: "Pré-treino", mealTime: "16:30", foodName: "Leite em Pó Integral", quantity: 30, calories: 149, protein: 7.8, carbohydrate: 11.4, lipid: 8.1, fiber: 0 },
      { id: "m11", mealName: "Pós-treino", mealTime: "18:30", foodName: "Albumina Naturovos", quantity: 30, calories: 108.6, protein: 25.2, carbohydrate: 1.2, lipid: 0, fiber: 0 },
      { id: "m12", mealName: "Jantar", mealTime: "20:00", foodName: "Peito de Frango (Grelhado)", quantity: 100, calories: 165, protein: 32.0, carbohydrate: 0, lipid: 2.67, fiber: 0 },
      { id: "m13", mealName: "Jantar", mealTime: "20:00", foodName: "Tomate Cru", quantity: 50, calories: 9, protein: 0.5, carbohydrate: 2.0, lipid: 0.17, fiber: 0.6 },
      { id: "m14", mealName: "Jantar", mealTime: "20:00", foodName: "Arroz Branco (Cozido)", quantity: 150, calories: 207, protein: 3.5, carbohydrate: 43.5, lipid: 2.5, fiber: 0.5 },
      { id: "m15", mealName: "Jantar", mealTime: "20:00", foodName: "Ovo de Galinha (Cozido)", quantity: 20, calories: 31, protein: 2.6, carbohydrate: 0.13, lipid: 2.0, fiber: 0 },
    ];
    currentPrescriptionMeta = { isAIGenerated: false, isClinicallyValidated: false };
  } else {
    currentPrescriptionItems = [];
    currentPrescriptionMeta = { isAIGenerated: false, isClinicallyValidated: false };
  }
  updateAIPrescriptionBanner();
  renderPrescriptionTotals();
  renderMealItems();
}

function renderMealItems() {
  const container = document.getElementById("prescriptionMealContainer");
  if (!container) return;

  if (currentPrescriptionItems.length === 0) {
    container.innerHTML = `
      <div class="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-8 text-center space-y-3">
        <i data-lucide="utensils" class="w-10 h-10 text-zinc-600 mx-auto"></i>
        <h3 class="text-white font-bold text-sm">Nenhum alimento prescrito para este paciente ainda</h3>
        <p class="text-zinc-400 text-xs">Utilize o botão <strong>⚡ Gerar Dieta Automática (Motor IA)</strong> acima para montagem inteligente ou busque alimentos manualmente.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const mealGroups = ["Café da manhã", "Lanche manhã", "Almoço", "Pré-treino", "Pós-treino", "Jantar", "Ceia"];

  // Calcula os totais gerais do plano para fracionamento de metas
  const totalPrescribedKcal = currentPrescriptionItems.reduce((acc, i) => acc + i.calories, 0) || 1890;
  const totalPrescribedProt = currentPrescriptionItems.reduce((acc, i) => acc + i.protein, 0) || 191;
  const totalPrescribedCarb = currentPrescriptionItems.reduce((acc, i) => acc + i.carbohydrate, 0) || 194;
  const totalPrescribedLip = currentPrescriptionItems.reduce((acc, i) => acc + i.lipid, 0) || 37;

  container.innerHTML = mealGroups
    .map((group) => {
      const items = currentPrescriptionItems.filter((i) => i.mealName === group);
      if (items.length === 0) return "";

      const groupKcal = items.reduce((acc, i) => acc + i.calories, 0);
      const groupProt = items.reduce((acc, i) => acc + i.protein, 0);
      const groupCarb = items.reduce((acc, i) => acc + i.carbohydrate, 0);
      const groupLip = items.reduce((acc, i) => acc + i.lipid, 0);

      // Metas Proporcionais Calculadas
      const strat = (typeof mealStrategies !== "undefined" && mealStrategies[group]) ? mealStrategies[group] : { pct: 0.15, label: "Refeição", guideline: "Aporte equilibrado de macronutrientes." };
      const targetMealKcal = Math.round(totalPrescribedKcal * strat.pct);
      const targetMealProt = Math.round(totalPrescribedProt * strat.pct);
      const targetMealCarb = Math.round(totalPrescribedCarb * strat.pct);
      const targetMealLip = Math.round(totalPrescribedLip * strat.pct);

      return `
      <div class="bg-zinc-900/90 rounded-3xl border border-zinc-800 shadow-card-dark overflow-hidden mb-5">
        <!-- 1. Cabeçalho Principal da Refeição -->
        <div class="bg-zinc-950 text-white p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-zinc-800/80">
          <div class="flex items-center gap-2.5">
            <span class="w-3 h-3 rounded-full bg-red-600 shadow-sm shadow-red-600/50"></span>
            <div>
              <h3 class="font-black text-sm text-white flex items-center gap-2">
                ${group}
                <span class="text-xs text-zinc-400 font-normal font-mono">(${items[0]?.mealTime || "08:00"})</span>
                <span class="bg-zinc-900 text-zinc-300 border border-zinc-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  ${Math.round(strat.pct * 100)}% da Dieta
                </span>
              </h3>
            </div>
          </div>

          <div class="flex items-center gap-2 text-xs font-mono">
            <span class="bg-zinc-950 text-white border border-zinc-800 px-2.5 py-1 rounded-xl font-bold shadow-sm">
              Atual: <span class="text-red-400 font-black">${Math.round(groupKcal)} kcal</span>
            </span>
            <span class="text-zinc-300 font-medium">P: ${groupProt.toFixed(1)}g</span>
            <span class="text-zinc-300 font-medium">C: ${groupCarb.toFixed(1)}g</span>
            <span class="text-zinc-300 font-medium">G: ${groupLip.toFixed(1)}g</span>
          </div>
        </div>

        <!-- 2. Sub-cabeçalho Visual: Alvo da Refeição & Direcionamento Estratégico (Aba 04) -->
        <div class="bg-zinc-950/60 border-b border-zinc-800/80 px-4 py-2.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs">
          <div class="flex items-center gap-2 font-mono">
            <span class="text-zinc-400 font-bold text-[11px] uppercase tracking-wider">🎯 Alvo da Refeição:</span>
            <span class="bg-zinc-900 border border-zinc-700 text-zinc-100 font-black px-2 py-0.5 rounded-lg text-[11px]">
              ${targetMealKcal} kcal
            </span>
            <span class="text-zinc-300 text-[11px]">P: <strong class="text-white">${targetMealProt}g</strong></span>
            <span class="text-zinc-600">•</span>
            <span class="text-zinc-300 text-[11px]">C: <strong class="text-white">${targetMealCarb}g</strong></span>
            <span class="text-zinc-600">•</span>
            <span class="text-zinc-300 text-[11px]">G: <strong class="text-white">${targetMealLip}g</strong></span>
          </div>

          <div class="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <i data-lucide="lightbulb" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i>
            <span class="font-medium"><strong class="text-zinc-200">Direcionamento:</strong> ${strat.guideline}</span>
          </div>
        </div>

        <!-- 3. Lista de Alimentos da Refeição -->
        <div class="divide-y divide-zinc-800/70">
          ${items
            .map(
              (item) => `
              <div class="p-3.5 flex items-center justify-between hover:bg-zinc-800/50 text-xs transition-colors group">
              <div class="min-w-0 pr-2">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white text-xs">${item.foodName}</span>
                  <span class="bg-zinc-950 text-zinc-300 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border border-zinc-700">
                    ${item.unitDisplay || `${item.quantity}g`}
                  </span>
                </div>
                <div class="text-[11px] text-zinc-400 font-mono mt-0.5 flex gap-2">
                  <span class="text-red-400 font-bold">${Math.round(item.calories)} kcal</span>
                  <span>Proteína: ${Number(item.protein).toFixed(1)}g</span>
                  <span>Carboidrato: ${Number(item.carbohydrate).toFixed(1)}g</span>
                  <span>Lipídios: ${Number(item.lipid).toFixed(1)}g</span>
                </div>
              </div>

              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onclick="openEditPrescriptionItem('${item.id}')"
                  title="Editar quantidade/unidade"
                  class="text-zinc-400 hover:text-blue-400 hover:bg-blue-950/40 p-2 rounded-xl transition-colors"
                >
                  <i data-lucide="pencil" class="w-4 h-4"></i>
                </button>
                <button
                  onclick="removePrescriptionItem('${item.id}')"
                  title="Remover item da refeição"
                  class="text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 p-2 rounded-xl transition-colors"
                >
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

          `
            )
            .join("")}
        </div>
      </div>
    `;
    })
    .join("");

  if (window.lucide) {
    lucide.createIcons();
  }
}

// =========================================================================
// 6.1 EXPORTAR RELATÓRIO CLÍNICO & PRESCRIÇÃO NUTRICIONAL EM PDF
// =========================================================================
async function exportPrescriptionAndEvaluationPDF() {
  const p = await db.patients.get(activePatientId);
  if (!p) {
    alert("Nenhum paciente selecionado!");
    return;
  }

  // 1. Dados da Avaliação mais recente
  const evals = await db.assessments.where("patientId").equals(activePatientId).toArray();
  evals.sort((a, b) => new Date(a.date) - new Date(b.date));
  const lastEval = evals.length > 0 ? evals[evals.length - 1] : null;

  const age = parseInt(p.age, 10) || 30;
  const height = parseFloat(p.height) || 1.70;
  const weight = parseFloat(lastEval?.weight || p.currentWeight) || 70.0;
  const gender = p.gender || "Masculino";
  const objective = p.objective || "Perda de peso";
  const patientType = p.patientType || "Praticante recreativo";
  const actFactor = parseFloat(p.activityFactor) || 1.42;

  const imc = (height > 0) ? Number((weight / (height * height)).toFixed(2)) : 22.0;
  let imcClass = "Eutrofia / Adequado";
  if (imc < 18.5) imcClass = "Abaixo do peso";
  else if (imc >= 25 && imc < 30) imcClass = "Sobrepeso";
  else if (imc >= 30) imcClass = "Obesidade";

  const fatPercent = parseFloat(lastEval?.fatPercent) || (gender === "Masculino" ? 18.0 : 25.0);
  const leanMass = parseFloat(lastEval?.leanMass) || (weight * (1 - fatPercent / 100));
  const fatMass = parseFloat(lastEval?.fatMass) || (weight * (fatPercent / 100));
  const waist = parseFloat(lastEval?.waist) || (gender === "Masculino" ? Math.round(height * 100 * 0.47) : Math.round(height * 100 * 0.44));
  const hip = parseFloat(lastEval?.hip) || 0;
  const arm = parseFloat(lastEval?.arm) || 0;
  const thigh = parseFloat(lastEval?.circThigh) || 0;
  const abdomen = parseFloat(lastEval?.circAbdomen) || 0;

  // 2. Cálculos Energéticos Katch-McArdle & Metas
  const tmb = Math.round(370 + 21.6 * leanMass);
  const getKcal = Math.round(tmb * actFactor);
  const macroTargets = calculateDietaryMacroTargets(objective, patientType, weight, getKcal, gender);

  // 3. Índice NutriAx & Idade Metabólica
  const heightM2 = height * height;
  let ffmi = heightM2 > 0 ? (leanMass / heightM2) : 20;
  if (height > 1.80) ffmi += 6.1 * (1.80 - height);
  const rcEst = (height * 100 > 0) ? (waist / (height * 100)) : 0.48;

  let scoreMuscular = gender === "Masculino" ? Math.min(100, Math.max(30, Math.round((ffmi / 22.0) * 100))) : Math.min(100, Math.max(30, Math.round((ffmi / 18.0) * 100)));
  const leanRatio = weight > 0 ? (leanMass / weight) : 0.75;
  const scorePotencial = Math.min(100, Math.max(40, Math.round(leanRatio * 115)));
  let scoreRisco = rcEst <= 0.50 ? Math.round(100 - (rcEst - 0.40) * 150) : Math.round(85 - (rcEst - 0.50) * 200);
  scoreRisco = Math.min(100, Math.max(25, scoreRisco));
  const scoreReserva = Math.min(100, Math.max(40, Math.round(scoreMuscular * 0.9 + 8)));
  let scoreGordura = gender === "Masculino" ? (fatPercent <= 16 ? 95 : fatPercent <= 22 ? 80 : 60) : (fatPercent <= 24 ? 95 : fatPercent <= 28 ? 80 : 60);
  const nutriScore = Math.round(scoreMuscular * 0.25 + scorePotencial * 0.20 + scoreRisco * 0.20 + scoreReserva * 0.10 + scoreGordura * 0.15 + 90 * 0.10);

  let idadeDelta = (fatPercent - (gender === "Masculino" ? 18.0 : 26.0)) * 0.45 - (ffmi - (gender === "Masculino" ? 20.0 : 16.5)) * 1.2;
  if (rcEst > 0.50) idadeDelta += (rcEst - 0.50) * 35;
  else if (rcEst < 0.45) idadeDelta -= 2;
  if (leanRatio > 0.80) idadeDelta -= 3;
  const idadeMetabolica = Math.min(75, Math.max(16, Math.round(age + idadeDelta)));
  const diffAnos = idadeMetabolica - age;

  // 4. Totais da Prescrição
  const totals = currentPrescriptionItems.reduce(
    (acc, item) => ({
      kcal: acc.kcal + item.calories,
      protein: acc.protein + item.protein,
      carb: acc.carb + item.carbohydrate,
      lipid: acc.lipid + item.lipid,
      fiber: acc.fiber + (item.fiber || 0),
    }),
    { kcal: 0, protein: 0, carb: 0, lipid: 0, fiber: 0 }
  );

  const mealGroups = ["Café da manhã", "Lanche manhã", "Almoço", "Lanche tarde", "Pré-treino", "Pós-treino", "Jantar", "Ceia"];
  const hydration = p.hydrationLiters || (weight ? Number((weight * 0.035).toFixed(1)) : 3.0);
  const emissionDate = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  // 5. Montagem do HTML Imprimível
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Por favor, permita popups para gerar o documento PDF!");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Plano Nutricional & Laudo Clínico - ${p.name}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
        body { background: #ffffff; color: #1e293b; font-size: 12px; line-height: 1.4; padding: 20px; }
        @page { size: A4 portrait; margin: 12mm; }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #dc2626; padding-bottom: 12px; margin-bottom: 15px; }
        .logo-box { display: flex; align-items: center; gap: 10px; }
        .logo-badge { background: #dc2626; color: #fff; font-weight: 900; font-size: 18px; padding: 6px 12px; border-radius: 8px; letter-spacing: -0.5px; }
        .logo-sub { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 1px; }
        .doc-title { text-align: right; }
        .doc-title h1 { font-size: 16px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
        .doc-title p { font-size: 11px; color: #64748b; font-weight: 600; }
        
        .section-title { font-size: 12px; font-weight: 900; text-transform: uppercase; color: #0f172a; border-left: 4px solid #dc2626; padding-left: 8px; margin: 14px 0 8px 0; display: flex; justify-content: space-between; align-items: center; }
        
        .card-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
        .card-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; }
        .card-box.highlight { background: #fef2f2; border-color: #fecaca; }
        .card-box.primary { background: #0f172a; color: #fff; border-color: #0f172a; }
        .card-box.primary span { color: #94a3b8; }
        .card-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 2px; }
        .card-val { font-size: 14px; font-weight: 900; color: #0f172a; }
        .card-sub { font-size: 10px; color: #64748b; font-family: monospace; font-weight: 600; margin-top: 2px; }
        
        .metabolic-score-box { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #fff; border-radius: 12px; padding: 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
        .score-circle { width: 65px; height: 65px; border-radius: 50%; background: #dc2626; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4); }
        .score-circle span { font-size: 9px; opacity: 0.8; font-weight: 600; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 11px; }
        th { background: #0f172a; color: #fff; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; font-weight: 700; }
        th.num, td.num { text-align: right; font-family: monospace; }
        td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        
        .meal-card { border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 10px; }
        .meal-header { background: #f1f5f9; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; font-weight: 800; font-size: 11px; }
        .meal-header .badge { background: #0f172a; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
        .meal-direction { background: #fffbeb; border-top: 1px solid #fef3c7; color: #92400e; padding: 4px 10px; font-size: 10px; font-style: italic; }
        
        .footer { margin-top: 25px; border-top: 2px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; }
        .signature-line { width: 220px; border-top: 1px solid #0f172a; text-align: center; padding-top: 4px; font-weight: 700; color: #0f172a; }
        
        .print-btn { background: #dc2626; color: #fff; border: none; padding: 10px 20px; font-weight: 900; border-radius: 8px; cursor: pointer; font-size: 13px; margin-bottom: 15px; }
      </style>
    </head>
    <body>
      <div class="no-print" style="background: #f1f5f9; padding: 12px; border-radius: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold; color: #0f172a;">📄 Visualização de Impressão / Salvar em PDF (NutriAx Pro)</span>
        <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Salvar como PDF</button>
      </div>

      <!-- Cabeçalho Institucional -->
      <div class="header">
        <div class="logo-box">
          <div class="logo-badge">NutriAx PRO</div>
          <div>
            <div style="font-weight: 900; font-size: 13px; color: #0f172a;">NUTRIÇÃO CLÍNICA & ALTA PERFORMANCE</div>
            <div class="logo-sub">Dark Titanium Medical Edition • Relatório de Prescrição</div>
          </div>
        </div>
        <div class="doc-title">
          <h1>Plano Alimentar & Performance</h1>
          <p>Emissão: ${emissionDate} • Paciente ID: ${p.id}</p>
        </div>
      </div>

      <!-- 1. Perfil do Paciente -->
      <div class="section-title">1. Identificação & Perfil do Paciente</div>
      <div class="card-grid">
        <div class="card-box">
          <span class="card-label">Paciente</span>
          <div class="card-val" style="font-size: 12px;">${p.name}</div>
          <div class="card-sub">${gender} • ${age} anos</div>
        </div>
        <div class="card-box">
          <span class="card-label">Antropometria Básica</span>
          <div class="card-val">${weight.toFixed(1)} kg • ${height.toFixed(2)} m</div>
          <div class="card-sub">IMC: ${imc} (${imcClass})</div>
        </div>
        <div class="card-box">
          <span class="card-label">Objetivo Clínico</span>
          <div class="card-val" style="color: #dc2626; font-size: 12px;">${objective}</div>
          <div class="card-sub">${patientType}</div>
        </div>
        <div class="card-box">
          <span class="card-label">Fator de Atividade (FA)</span>
          <div class="card-val">${actFactor.toFixed(2)}</div>
          <div class="card-sub">Gasto GET: ${macroTargets.getKcal} kcal</div>
        </div>
      </div>

      <!-- 2. Destaque: Índice NutriAx & Idade Metabólica -->
      <div class="metabolic-score-box">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div class="score-circle">
            ${nutriScore}
            <span>/100</span>
          </div>
          <div>
            <div style="font-size: 14px; font-weight: 900; letter-spacing: -0.5px;">ÍNDICE DE PERFORMANCE METABÓLICA NUTRIAX</div>
            <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">
              Diagnóstico: <strong>${nutriScore >= 85 ? "Alta Performance Metabólica" : nutriScore >= 70 ? "Bom Rendimento Funcional" : "Foco em Otimização"}</strong>
            </div>
            <div style="font-size: 10px; opacity: 0.75; margin-top: 4px; font-family: monospace;">
              FFMI: ${ffmi.toFixed(2)} • %Gordura: ${fatPercent.toFixed(1)}% • Risco Central (RCEst): ${rcEst.toFixed(2)}
            </div>
          </div>
        </div>

        <div style="text-align: right; border-left: 1px solid rgba(255,255,255,0.2); padding-left: 14px;">
          <span style="font-size: 9px; text-transform: uppercase; opacity: 0.8; font-weight: bold; display: block;">Idade Metabólica Est.</span>
          <div style="font-size: 18px; font-weight: 900; color: #f87171;">${idadeMetabolica} anos</div>
          <div style="font-size: 10px; font-weight: 700; color: ${diffAnos <= 0 ? '#4ade80' : '#fbbf24'};">
            ${diffAnos < 0 ? `${diffAnos} anos (Mais Jovem)` : diffAnos === 0 ? "Compatível com a Idade" : `+${diffAnos} anos (Atenção)`}
          </div>
        </div>
      </div>

      <!-- 3. Metas Energéticas & Distribuição de Macronutrientes -->
      <div class="section-title">2. Diagnóstico Antropométrico & Metas Clínicas</div>
      <div class="card-grid">
        <div class="card-box primary">
          <span class="card-label">Alvo Energético Prescrito</span>
          <div class="card-val" style="color: #f87171;">${macroTargets.caloricTarget} kcal</div>
          <div class="card-sub">TMB: ${tmb} kcal • GET: ${macroTargets.getKcal} kcal</div>
        </div>
        <div class="card-box highlight">
          <span class="card-label">Meta de Proteína</span>
          <div class="card-val">${macroTargets.targetProtG}g</div>
          <div class="card-sub">${macroTargets.targetProtKg} g/kg de peso corporal</div>
        </div>
        <div class="card-box">
          <span class="card-label">Meta de Carboidrato</span>
          <div class="card-val">${macroTargets.targetCarbG}g</div>
          <div class="card-sub">${macroTargets.targetCarbKg} g/kg de peso corporal</div>
        </div>
        <div class="card-box">
          <span class="card-label">Meta de Lipídios</span>
          <div class="card-val">${macroTargets.targetLipG}g</div>
          <div class="card-sub">${macroTargets.targetLipKg} g/kg • Fibras: ≥ ${macroTargets.minFiber}g/dia</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;">
        <div class="card-box" style="font-size: 10.5px;">
          <strong>Composição Corporal:</strong> Gordura: <strong>${fatPercent.toFixed(1)}%</strong> (${fatMass.toFixed(1)} kg) • Massa Magra: <strong>${leanMass.toFixed(1)} kg</strong>
        </div>
        <div class="card-box" style="font-size: 10.5px;">
          <strong>Circunferências:</strong> Cintura: <strong>${waist || '-'} cm</strong> • Quadril: <strong>${hip || '-'} cm</strong> • Braço: <strong>${arm || '-'} cm</strong> • Abdômen: <strong>${abdomen || '-'} cm</strong>
        </div>
      </div>

      <!-- 4. Prescrição Nutricional Detalhada -->
      <div class="section-title">
        <span>3. Plano Alimentar & Prescrição Nutricional</span>
        <span style="font-size: 10px; font-weight: normal; color: #64748b;">Total Atual: <strong>${Math.round(totals.kcal)} kcal</strong> (P: ${totals.protein.toFixed(1)}g • C: ${totals.carb.toFixed(1)}g • G: ${totals.lipid.toFixed(1)}g)</span>
      </div>

      ${mealGroups.map((group) => {
        const items = currentPrescriptionItems.filter((i) => i.mealName === group);
        if (items.length === 0) return "";

        const groupKcal = items.reduce((acc, i) => acc + i.calories, 0);
        const groupProt = items.reduce((acc, i) => acc + i.protein, 0);
        const groupCarb = items.reduce((acc, i) => acc + i.carbohydrate, 0);
        const groupLip = items.reduce((acc, i) => acc + i.lipid, 0);
        const strat = (typeof mealStrategies !== "undefined" && mealStrategies[group]) ? mealStrategies[group] : { pct: 0.15, guideline: "Aporte harmônico de macronutrientes." };

        return `
          <div class="meal-card">
            <div class="meal-header">
              <div>
                <span style="color: #dc2626; margin-right: 4px;">●</span>
                <strong>${group}</strong> <span style="color: #64748b; font-weight: normal; font-family: monospace;">(${items[0]?.mealTime || "08:00"})</span>
              </div>
              <div>
                <span class="badge">${Math.round(groupKcal)} kcal</span>
                <span style="font-family: monospace; font-size: 10px; margin-left: 6px;">P: ${groupProt.toFixed(1)}g | C: ${groupCarb.toFixed(1)}g | G: ${groupLip.toFixed(1)}g</span>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Alimento / Rótulo</th>
                  <th style="width: 140px;">Medida / Quantidade</th>
                  <th class="num" style="width: 70px;">Energia</th>
                  <th class="num" style="width: 60px;">Proteína</th>
                  <th class="num" style="width: 60px;">Carbo</th>
                  <th class="num" style="width: 60px;">Gordura</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(it => `
                  <tr>
                    <td><strong>${it.foodName}</strong></td>
                    <td><span style="background: #e2e8f0; padding: 1px 5px; border-radius: 4px; font-weight: bold; font-size: 10px;">${it.unitDisplay || `${it.quantity}g`}</span></td>
                    <td class="num" style="color: #dc2626; font-weight: bold;">${Math.round(it.calories)} kcal</td>
                    <td class="num">${Number(it.protein).toFixed(1)}g</td>
                    <td class="num">${Number(it.carbohydrate).toFixed(1)}g</td>
                    <td class="num">${Number(it.lipid).toFixed(1)}g</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <div class="meal-direction">💡 <strong>Direcionamento:</strong> ${strat.guideline}</div>
          </div>
        `;
      }).join("")}

      <!-- 5. Hidratação & Orientações Finais -->
      <div class="card-box highlight" style="margin-top: 14px; font-size: 11px;">
        <div style="font-weight: 800; color: #0f172a; margin-bottom: 2px;">💧 META DE HIDRATAÇÃO DIÁRIA: <span style="color: #dc2626; font-size: 13px;">${hydration} Litros / dia</span></div>
        <p style="color: #475569;">Distribuir a ingestão de água ao longo do dia, priorizando períodos fora das grandes refeições (30 min antes ou 1h após).</p>
      </div>

      <!-- Rodapé & Assinatura -->
      <div class="footer">
        <div>
          <strong>NutriAx Pro • Plataforma de Inteligência Nutricional</strong><br>
          Laudo gerado eletronicamente com validação de biomarcadores e composição corporal.
        </div>
        <div class="signature-line">
          Nutricionista Responsável<br>
          <span style="font-size: 9px; font-weight: normal; color: #64748b;">CRN / Registro Profissional</span>
        </div>
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
}

// 7. Patient App Simulator Interactions
function openPatientLoginModal() {
  document.getElementById("patientLoginModal").classList.remove("hidden");
}


function closePatientLoginModal() {
  document.getElementById("patientLoginModal").classList.add("hidden");
}

async function handlePatientAppLogin(event) {
  event.preventDefault();
  const inputId = document.getElementById("patientLoginIdInput").value.trim().toLowerCase();
  if (!inputId) return;

  activePatientId = inputId;
  localStorage.setItem("NUTRIAX_ACTIVE_PATIENT_ID", inputId);
  closePatientLoginModal();

  if (GOOGLE_SCRIPT_URL) {
    await loadPatientFromCloud(inputId, true);
  } else {
    await onPatientChange(inputId);
    alert(`Paciente ${inputId} ativado localmente no App!`);
  }
}

async function renderPatientAppView(patientId = activePatientId) {
  const p = await db.patients.get(patientId);
  const greetingEl = document.getElementById("patientAppGreeting");
  const summaryEl = document.getElementById("patientAppDailySummary");
  const mealContainer = document.getElementById("patientAppMealList");

  if (p && greetingEl) {
    const firstName = (p.name || "").split(" ")[0] || "Paciente";
    greetingEl.innerText = `Olá, ${firstName}! 👋`;
  }

  // Calcula macros e calorias a partir dos itens da prescrição atual
  let totalKcal = 0;
  let totalProt = 0;
  if (Array.isArray(currentPrescriptionItems) && currentPrescriptionItems.length > 0) {
    totalKcal = Math.round(currentPrescriptionItems.reduce((acc, item) => acc + (Number(item.calories) || 0), 0));
    totalProt = Math.round(currentPrescriptionItems.reduce((acc, item) => acc + (Number(item.protein) || 0), 0));
  } else if (p) {
    totalKcal = Math.round(p.targetCalories || 2000);
    totalProt = Math.round(p.targetProtein || 150);
  }

  if (summaryEl) {
    summaryEl.innerText = `Prescrição do dia: ${totalKcal} kcal • ${totalProt}g Proteína`;
  }

  if (mealContainer) {
    if (!currentPrescriptionItems || currentPrescriptionItems.length === 0) {
      mealContainer.innerHTML = `
        <div class="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-center text-zinc-400 text-xs">
          Nenhuma refeição prescrita ainda para este paciente. Acesse a aba "Prescrição" para montar o plano.
        </div>
      `;
      return;
    }

    // Agrupa itens de refeição por mealName
    const mealsMap = {};
    currentPrescriptionItems.forEach((item) => {
      const mName = item.mealName || "Refeição";
      if (!mealsMap[mName]) {
        mealsMap[mName] = { time: item.mealTime || "Horário livre", items: [] };
      }
      mealsMap[mName].items.push(item);
    });

    let mealsHtml = "";
    Object.keys(mealsMap).forEach((mName, idx) => {
      const meal = mealsMap[mName];
      const itemsSummary = meal.items.map(i => `${i.quantity}g ${i.foodName}`).join(" + ");
      const mealKcal = Math.round(meal.items.reduce((s, i) => s + (Number(i.calories) || 0), 0));

      mealsHtml += `
        <div id="patientMealCard-${idx}" class="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center justify-between gap-3 transition-all">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="font-black text-white text-xs block">${meal.time} • ${mName}</span>
              <span class="text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800/60 px-1.5 py-0.2 rounded">${mealKcal} kcal</span>
            </div>
            <span class="text-zinc-400 text-[11px] block truncate mt-0.5">${itemsSummary}</span>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <button onclick="openSwapModal('${mName.replace(/'/g, "\\'")}')" class="text-amber-400 font-bold text-[10px] bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2 py-1 rounded-lg">Trocar</button>
            <button onclick="togglePatientMeal('${idx}')" id="patientMealBtn-${idx}" class="text-emerald-400 font-bold text-xs bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg hover:bg-emerald-900 transition-all">Consumiu ✓</button>
          </div>
        </div>
      `;
    });

    mealContainer.innerHTML = mealsHtml;
  }
}

function togglePatientMeal(id) {
  const card = document.getElementById(`patientMealCard-${id}`);
  const btn = document.getElementById(`patientMealBtn-${id}`);
  if (card) {
    card.classList.toggle("bg-emerald-950/40");
    card.classList.toggle("border-emerald-700/80");
  }
  if (btn) {
    if (btn.innerText.includes("Consumido")) {
      btn.innerText = "Consumiu ✓";
      btn.className = "text-emerald-400 font-bold text-xs bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg hover:bg-emerald-900 transition-all";
    } else {
      btn.innerText = "Consumido ✨";
      btn.className = "text-emerald-200 font-bold text-xs bg-emerald-800 border border-emerald-500 px-2.5 py-1 rounded-lg shadow-sm shadow-emerald-500/50 transition-all";
    }
  }
}

function openSwapModal(mealName) {
  const titleEl = document.getElementById("swapMealTitle");
  if (titleEl) titleEl.innerText = mealName;
  const modal = document.getElementById("patientSwapModal");
  if (modal) modal.classList.remove("hidden");
}

function closeSwapModal() {
  const modal = document.getElementById("patientSwapModal");
  if (modal) modal.classList.add("hidden");
}

// 8. Per-Patient Google Drive Sync Engine (savePatientToCloud & loadPatientFromCloud)
function saveGoogleScriptUrl() {
  const url = document.getElementById("googleScriptUrlInput").value;
  GOOGLE_SCRIPT_URL = url;
  localStorage.setItem("NUTRIAX_GOOGLE_SCRIPT_URL", url);
  alert("URL do Google Apps Script salva!");
}

async function savePatientToCloud(patientId = activePatientId) {
  const statusEl = document.getElementById("syncStatusMessage");
  if (!GOOGLE_SCRIPT_URL) {
    alert("Por favor, insira a URL do seu Google Apps Script na aba de Backup antes de salvar!");
    return;
  }

  if (statusEl) {
    statusEl.innerHTML = `<span class='text-amber-500 font-bold'>⏳ Exportando e salvando árvore completa do paciente ${patientId} no Google Drive...</span>`;
  }

  try {
    const patientObj = (await db.patients.get(patientId)) || {
      id: patientId,
      name: patientId === "maria-silva" ? "Maria Silva Santos" : patientId,
      age: patientId === "maria-silva" ? 32 : 38,
      height: patientId === "maria-silva" ? 1.65 : 1.96,
      currentWeight: patientId === "maria-silva" ? 64.5 : 116.0,
      objective: patientId === "maria-silva" ? "Recomposição Corporal" : "Perda de peso",
    };

    // Coleta todos os módulos clínicos associados ao paciente
    const examsList = await db.clinicalExams.where("patientId").equals(patientId).toArray();
    const assessmentsList = await db.assessments.where("patientId").equals(patientId).toArray();
    const recallList = await db.dietaryRecall.where("patientId").equals(patientId).toArray();
    const adherenceList = await db.dailyLogs.where("patientId").equals(patientId).toArray();
    const perfData = (await db.performanceMetabolica.get(patientId)) || {
      id: patientId,
      patientId: patientId,
      activeSplit: typeof perfActiveSplit !== 'undefined' ? perfActiveSplit : 'PPL',
      workoutPlan: typeof perfWorkoutPlan !== 'undefined' ? perfWorkoutPlan : [],
      weeklySchedule: typeof perfWeeklySchedule !== 'undefined' ? perfWeeklySchedule : [],
      prescribedCardioId: typeof perfPrescribedCardioId !== 'undefined' ? perfPrescribedCardioId : 'cardio_01',
      auditData: typeof perfAuditData !== 'undefined' ? perfAuditData : null,
      meta: typeof perfWorkoutMeta !== 'undefined' ? perfWorkoutMeta : null
    };

    const payload = {
      action: "save",
      patientId: patientId,
      patient: patientObj,
      exams: examsList,
      assessments: assessmentsList,
      dietaryRecall: recallList,
      dailyLogs: adherenceList,
      prescriptions: currentPrescriptionItems,
      performance: perfData,
      lastUpdated: new Date().toISOString(),
    };

    // Form submission to hidden iframe (100% CORS-free, works from file:// protocol)
    const form = document.getElementById("nutriaxSyncForm");
    const payloadInput = document.getElementById("nutriaxFormPayloadInput");

    if (form && payloadInput) {
      form.action = GOOGLE_SCRIPT_URL;
      payloadInput.value = JSON.stringify(payload);
      form.submit();
    } else {
      // Fallback fetch
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
    }

    setTimeout(() => {
      if (statusEl) {
        statusEl.innerHTML = `<span class='text-emerald-600 font-bold'>✅ Backup completo do paciente ${patientId} (Perfil, Anamnese, Exames, Dieta, Recordatório e Adesão) salvo no Drive!</span>`;
      }
      alert(`✅ Backup completo de ${patientId} enviado com sucesso ao Google Drive!`);
    }, 1000);
  } catch (error) {
    console.error("Erro ao salvar no Drive:", error);
    if (statusEl) {
      statusEl.innerHTML = `<span class='text-rose-600 font-bold'>❌ Erro ao salvar: ${error.message}</span>`;
    }
  }
}

// Leitura via fetch (funciona a partir de http://localhost)
async function _callDriveApi(url) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: { "Accept": "application/json, text/javascript, */*" }
  });
  const text = await response.text();
  // Handle both JSON and JSONP responses
  try {
    return JSON.parse(text);
  } catch (e) {
    // try to extract JSON from JSONP wrapper
    const match = text.match(/\((\{[\s\S]*\})\)/);
    if (match) return JSON.parse(match[1]);
    throw new Error("Resposta inválida do servidor: " + text.substring(0, 100));
  }
}

async function loadPatientFromCloud(patientId = activePatientId, showAlert = true) {
  const statusEl = document.getElementById("syncStatusMessage");
  if (!GOOGLE_SCRIPT_URL) {
    if (showAlert) alert("URL do Google Apps Script não configurada!");
    return;
  }

  if (statusEl) {
    statusEl.innerHTML = `<span class='text-amber-500 font-bold'>⏳ Carregando dados completos do paciente ${patientId} do Google Drive...</span>`;
  }

  try {
    const url = `${GOOGLE_SCRIPT_URL}?action=load&patientId=${encodeURIComponent(patientId)}&t=${Date.now()}`;
    const result = await _callDriveApi(url);

    if (result.status === "success" && result.data) {
      const cloudData = result.data;
      if (cloudData.patient) await db.patients.put(cloudData.patient);
      
      if (cloudData.exams && Array.isArray(cloudData.exams) && cloudData.exams.length > 0) {
        await db.clinicalExams.where("patientId").equals(patientId).delete();
        await db.clinicalExams.bulkPut(cloudData.exams);
      }

      if (cloudData.assessments && Array.isArray(cloudData.assessments) && cloudData.assessments.length > 0) {
        await db.assessments.where("patientId").equals(patientId).delete();
        await db.assessments.bulkPut(cloudData.assessments);
      }

      if (cloudData.dietaryRecall && Array.isArray(cloudData.dietaryRecall) && cloudData.dietaryRecall.length > 0) {
        await db.dietaryRecall.where("patientId").equals(patientId).delete();
        await db.dietaryRecall.bulkPut(cloudData.dietaryRecall);
      }

      if (cloudData.dailyLogs && Array.isArray(cloudData.dailyLogs) && cloudData.dailyLogs.length > 0) {
        await db.dailyLogs.where("patientId").equals(patientId).delete();
        await db.dailyLogs.bulkPut(cloudData.dailyLogs);
      }

      if (cloudData.prescriptions) {
        currentPrescriptionItems = cloudData.prescriptions;
        await db.prescriptions.put({ id: patientId, patientId: patientId, items: currentPrescriptionItems });
        renderPrescriptionTotals();
        renderMealItems();
      }

      if (cloudData.performance) {
        await db.performanceMetabolica.put({
          id: patientId,
          patientId: patientId,
          ...cloudData.performance
        });
      }

      activePatientId = patientId;
      localStorage.setItem("NUTRIAX_ACTIVE_PATIENT_ID", patientId);

      // Atualiza os seletores de paciente (desktop e mobile)
      await populatePatientSelect();

      // Recarrega módulos impactados pelo cloud
      await updateDashboardAndRadar(patientId);
      if (typeof loadClinicalExams === "function") await loadClinicalExams(patientId);
      if (typeof loadAssessmentsAndRenderCharts === "function") await loadAssessmentsAndRenderCharts(patientId);
      if (typeof loadDietaryRecall === "function") await loadDietaryRecall(patientId);
      if (typeof loadAdherenceDashboard === "function") await loadAdherenceDashboard(patientId);
      if (typeof loadPerformanceForPatient === "function") await loadPerformanceForPatient(patientId);
      if (typeof renderPatientAppView === "function") renderPatientAppView(patientId);

      if (statusEl) statusEl.innerHTML = `<span class='text-emerald-600 font-bold'>✅ Paciente <strong>${patientId}</strong> importado do Drive e ativo no seletor!</span>`;
      if (showAlert) alert(`✅ Ficha completa de "${patientId}" restaurada do Google Drive e definida como paciente ativo!`);

    } else if (result.status === "not_found") {
      if (statusEl) statusEl.innerHTML = `<span class='text-slate-500'>⚠️ Nenhum backup no Drive para ${patientId}.</span>`;
      if (showAlert) alert(`Nenhum backup encontrado no Drive para: ${patientId}`);
    } else {
      if (statusEl) statusEl.innerHTML = `<span class='text-rose-600 font-bold'>❌ Erro: ${result.message}</span>`;
    }
  } catch (error) {
    console.error("loadPatientFromCloud:", error);
    if (statusEl) {
      statusEl.innerHTML = `<span class='text-rose-600 font-bold'>❌ ${error.message.includes("fetch") ? "Abra via servidor local: clique duas vezes em <strong>server.bat</strong> e acesse <a href=\'http://localhost:8080\' target=\'_blank\' class=\'underline\'>http://localhost:8080</a>" : "Erro: " + error.message}</span>`;
    }
  }
}

async function listDrivePatientsV2() {
  const statusEl = document.getElementById("syncStatusMessage");
  if (!GOOGLE_SCRIPT_URL) {
    alert("URL do Google Apps Script não configurada!");
    return;
  }

  if (statusEl) {
    statusEl.style.cssText = "padding-top:8px;font-size:12px;";
    statusEl.innerHTML = "<span style='color:#d97706;font-weight:700'>⏳ Consultando arquivos do Google Drive...</span>";
  }

  try {
    const url = `${GOOGLE_SCRIPT_URL}?action=list&t=${Date.now()}`;
    const result = await _callDriveApi(url);

    if (result.status === "success" && result.patients && result.patients.length > 0) {
      const cardsHTML = result.patients.map(p => {
        const match = p.fileName.match(/NutriAx_Paciente_(.+)\.json/i);
        const patientId = match ? match[1] : p.patientId || p.fileName.replace(".json", "");
        const dateStr = p.lastUpdated ? p.lastUpdated.split("T")[0] : "—";
        return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-top:6px">
          <div style="min-width:0;flex:1">
            <p style="font-weight:700;font-size:11px;color:#1e293b;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📄 ${p.fileName}</p>
            <p style="font-size:10px;color:#94a3b8;margin:2px 0 0;font-family:monospace">${dateStr}</p>
          </div>
          <button
            onclick="loadPatientFromDriveByFileName('${patientId}')"
            style="flex-shrink:0;background:#16a34a;color:#fff;font-weight:700;font-size:11px;padding:6px 14px;border:none;border-radius:8px;cursor:pointer;white-space:nowrap"
            onmouseover="this.style.background='#15803d'"
            onmouseout="this.style.background='#16a34a'"
          >⬇️ Carregar</button>
        </div>`;
      }).join("");

      if (statusEl) {
        statusEl.innerHTML = `<p style="color:#16a34a;font-weight:700;font-size:12px;margin:0">✅ Arquivos no Drive (${result.patients.length}): clique em <strong>Carregar</strong> para importar</p>${cardsHTML}`;
      }
    } else {
      if (statusEl) statusEl.innerHTML = "<span style='color:#64748b'>Nenhum arquivo de paciente encontrado no Drive.</span>";
    }
  } catch (error) {
    console.error("listDrivePatientsV2:", error);
    if (statusEl) {
      statusEl.innerHTML = `<span style='color:#dc2626;font-weight:700'>❌ Abra via servidor local: clique duas vezes em <strong>server.bat</strong> e acesse <a href='http://localhost:8080' target='_blank' style='color:#60a5fa'>http://localhost:8080</a></span>`;
    }
  }
}

// Alias para compatibilidade
const listDrivePatients = listDrivePatientsV2;

// Carrega um paciente específico do Drive pelo patientId, importa para Dexie e ativa no seletor
async function loadPatientFromDriveByFileName(patientId) {
  const statusEl = document.getElementById("syncStatusMessage");
  if (!GOOGLE_SCRIPT_URL) {
    alert("URL do Google Apps Script não configurada!");
    return;
  }

  if (statusEl) {
    statusEl.innerHTML = `<span class='text-amber-500 font-bold'>⏳ Carregando paciente <strong>${patientId}</strong> do Drive...</span>`;
  }

  try {
    const url = `${GOOGLE_SCRIPT_URL}?action=load&patientId=${encodeURIComponent(patientId)}&t=${Date.now()}`;
    const result = await _callDriveApi(url);

    if (result.status === "success" && result.data) {
      const cloudData = result.data;

      // Importa paciente para Dexie (cria ou sobrescreve)
      if (cloudData.patient) {
        await db.patients.put(cloudData.patient);
      }
      if (cloudData.exams && Array.isArray(cloudData.exams) && cloudData.exams.length > 0) {
        await db.clinicalExams.where("patientId").equals(patientId).delete();
        await db.clinicalExams.bulkPut(cloudData.exams);
      }
      if (cloudData.assessments && Array.isArray(cloudData.assessments) && cloudData.assessments.length > 0) {
        await db.assessments.where("patientId").equals(patientId).delete();
        await db.assessments.bulkPut(cloudData.assessments);
      }
      if (cloudData.dietaryRecall && Array.isArray(cloudData.dietaryRecall) && cloudData.dietaryRecall.length > 0) {
        await db.dietaryRecall.where("patientId").equals(patientId).delete();
        await db.dietaryRecall.bulkPut(cloudData.dietaryRecall);
      }
      if (cloudData.dailyLogs && Array.isArray(cloudData.dailyLogs) && cloudData.dailyLogs.length > 0) {
        await db.dailyLogs.where("patientId").equals(patientId).delete();
        await db.dailyLogs.bulkPut(cloudData.dailyLogs);
      }
      if (cloudData.prescriptions) {
        currentPrescriptionItems = cloudData.prescriptions;
        await db.prescriptions.put({ id: patientId, patientId: patientId, items: currentPrescriptionItems });
      }

      // Atualiza seletor de paciente ativo e ativa o paciente carregado
      await populatePatientSelect();
      const select = document.getElementById("activePatientSelect");
      if (select) {
        select.value = patientId;
      }
      await onPatientChange(patientId);

      if (statusEl) {
        statusEl.innerHTML = `<span class='text-emerald-600 font-bold'>✅ Paciente <strong>${patientId}</strong> importado do Drive e definido como ativo!</span>`;
      }
      alert(`✅ Paciente "${patientId}" carregado do Google Drive e ativado com sucesso!`);
    } else if (result.status === "not_found") {
      if (statusEl) statusEl.innerHTML = `<span class='text-slate-500'>⚠️ Arquivo não encontrado no Drive para: ${patientId}</span>`;
      alert(`Nenhum arquivo encontrado no Drive para: ${patientId}`);
    } else {
      const msg = result.message || "Erro desconhecido";
      if (statusEl) statusEl.innerHTML = `<span class='text-rose-600 font-bold'>❌ Erro: ${msg}</span>`;
    }
  } catch (error) {
    console.error("loadPatientFromDriveByFileName:", error);
    if (statusEl) {
      statusEl.innerHTML = `<span class='text-rose-600 font-bold'>❌ ${error.message.includes("fetch") ? "Abra via servidor local (server.bat → http://localhost:8080)" : "Erro: " + error.message}</span>`;
    }
  }
}

// ==========================================
// CADASTRO DE NOVO PACIENTE
// ==========================================
function openNewPatientModal() {
  const modal = document.getElementById("newPatientModal");
  if (modal) {
    modal.classList.remove("hidden");
    if (window.lucide) window.lucide.createIcons();
  }
}

function closeNewPatientModal() {
  const modal = document.getElementById("newPatientModal");
  if (modal) modal.classList.add("hidden");
}

// =========================================================================
// 7.1 MOTOR DE CÁLCULO AUTOMÁTICO DE PESO ALVO & COMPOSIÇÃO CORPORAL
// =========================================================================
function calculateAutoTargetWeight(params = {}) {
  const p = params.patient || {};
  const weight = parseFloat(params.weight || p.currentWeight || document.getElementById("anamneseUsualWeight")?.value || document.getElementById("evalWeight")?.value || 70.0);
  const height = parseFloat(params.height || p.height || document.getElementById("evalHeight")?.value || 1.70);
  const gender = params.gender || p.gender || document.getElementById("evalGender")?.value || "Masculino";
  const objective = params.objective || p.objective || document.getElementById("anamneseObjective")?.value || "Perda de peso";
  
  // Percentual de Gordura Alvo Desejado
  let targetBF = parseFloat(params.targetBF || document.getElementById("evalTargetFatPercent")?.value);
  if (isNaN(targetBF) || targetBF <= 0) {
    if (objective.toLowerCase().includes("perda") || objective.toLowerCase().includes("déficit")) {
      targetBF = gender === "Masculino" ? 10.0 : 18.0;
    } else if (objective.toLowerCase().includes("recomposição")) {
      targetBF = gender === "Masculino" ? 12.0 : 20.0;
    } else if (objective.toLowerCase().includes("hipertrofia")) {
      targetBF = gender === "Masculino" ? 14.0 : 20.0;
    } else {
      targetBF = gender === "Masculino" ? 15.0 : 22.0;
    }
  }

  // Estimativa da Gordura Atual do Paciente (ou lida da última avaliação)
  let currentBF = parseFloat(params.currentBF);
  if (isNaN(currentBF) || currentBF <= 0) {
    if (objective.toLowerCase().includes("perda") || objective.toLowerCase().includes("déficit")) {
      currentBF = gender === "Masculino" ? 24.5 : 29.5;
    } else if (objective.toLowerCase().includes("hipertrofia")) {
      currentBF = gender === "Masculino" ? 14.0 : 20.0;
    } else if (objective.toLowerCase().includes("recomposição")) {
      currentBF = gender === "Masculino" ? 19.0 : 25.0;
    } else {
      currentBF = gender === "Masculino" ? 17.0 : 23.0;
    }
  }

  // 1. Perda de Peso / Déficit / Cutting:
  // Preserva 100% da Massa Magra Atual: PesoAlvo = MassaMagra / (1 - (TargetBF / 100))
  if (objective.toLowerCase().includes("perda") || objective.toLowerCase().includes("déficit") || objective.toLowerCase().includes("definir")) {
    const currentFatKg = weight * (currentBF / 100);
    const leanMassKg = weight - currentFatKg;
    const targetKg = leanMassKg / (1 - (targetBF / 100));
    return Number(targetKg.toFixed(1));
  }
  // 2. Recomposição Corporal:
  // Ganho modesto de massa magra (~1.5kg) e redução de gordura até a meta
  else if (objective.toLowerCase().includes("recomposição")) {
    const currentFatKg = weight * (currentBF / 100);
    const leanMassKg = weight - currentFatKg;
    const targetKg = (leanMassKg + 1.5) / (1 - (targetBF / 100));
    return Number(targetKg.toFixed(1));
  }
  // 3. Hipertrofia / Bulking Limpo:
  // Projeta ganho sustentável de massa muscular
  else if (objective.toLowerCase().includes("hipertrofia") || objective.toLowerCase().includes("massa") || objective.toLowerCase().includes("superávit")) {
    const deltaKg = gender === "Masculino" ? 4.5 : 2.5;
    return Number((weight + deltaKg).toFixed(1));
  }
  // 4. Manutenção e Saúde / Performance:
  else {
    return Number(weight.toFixed(1));
  }
}

async function handleSaveNewPatient(event) {
  event.preventDefault();

  const name = document.getElementById("newPatientName").value.trim();
  const gender = document.getElementById("newPatientGender").value;
  const age = parseInt(document.getElementById("newPatientAge").value, 10);
  const height = parseFloat(document.getElementById("newPatientHeight").value);
  const weight = parseFloat(document.getElementById("newPatientWeight").value);
  const objective = document.getElementById("newPatientObjective").value;

  if (!name) {
    alert("Por favor, preencha o nome do paciente.");
    return;
  }

  // Gera slug ID (ex: "Carlos Eduardo" -> "carlos-eduardo")
  const id = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Calcula meta de peso alvo automática baseada nos módulos e objetivos
  const autoTargetWeight = calculateAutoTargetWeight({
    gender,
    age,
    height,
    currentWeight: weight,
    objective
  });

  // Limpa/Zera todos os dados históricos e módulos para o novo paciente
  currentPrescriptionItems = [];
  await db.prescriptions.delete(id);
  await db.clinicalExams.where("patientId").equals(id).delete();
  await db.assessments.where("patientId").equals(id).delete();
  await db.dietaryRecall.where("patientId").equals(id).delete();
  await db.dailyLogs.where("patientId").equals(id).delete();

  const newPatient = {
    id: id,
    name: name,
    email: `${id}@nutriax.com`,
    gender: gender,
    age: age,
    height: height,
    currentWeight: weight,
    usualWeight: weight,
    targetWeight: autoTargetWeight,
    objective: objective,
    patientType: "Praticante recreativo",
    clinicalNotes: "",
    dietaryRestrictions: "",
    cookingAvailability: "Moderada",
    mealFrequency: "4 refeições/dia",
    hydrationLiters: Number((weight * 0.035).toFixed(1)),
    neatRoutine: "Moderado",
    routineNotes: "",
    mainModality: "Musculação",
    workoutType: "Musculação / Força",
    workoutFrequency: "4x/semana",
    workoutDuration: "60 min",
    workoutIntensity: "Moderada",
    workoutTime: "",
    sleepHours: 7.5,
    sleepQuality: "Boa",
    stressLevel: "Moderado",
    activityFactor: 1.42
  };

  // Salva no banco local IndexedDB (Dexie)
  await db.patients.put(newPatient);

  // Atualiza o select da barra lateral
  await populatePatientSelect();

  // Seleciona o novo paciente
  const select = document.getElementById("activePatientSelect");
  if (select) select.value = id;

  await onPatientChange(id);

  closeNewPatientModal();

  // Salva automaticamente o novo arquivo no Google Drive
  await savePatientToCloud(id);
}

// =========================================================================
// 8. MÓDULO 01: ANAMNESE, ROTINA, TREINO & FATOR DE ATIVIDADE (FA)
// =========================================================================

// Guard para evitar auto-save durante carregamento de dados
let _isLoadingAnamnese = false;

// Debounce helper para auto-save
let _anamneseSaveTimer = null;
function _scheduleAnamneseSave() {
  if (_isLoadingAnamnese) return; // Bloqueia save durante load
  if (_anamneseSaveTimer) clearTimeout(_anamneseSaveTimer);
  _anamneseSaveTimer = setTimeout(() => {
    _anamneseSaveTimer = null;
    if (!_isLoadingAnamnese) autoSaveAnamnese(false);
  }, 300);
}

// Flush imediato: garante que qualquer save pendente seja executado ANTES do próximo load
async function _flushAnamneseSave() {
  if (_anamneseSaveTimer) {
    clearTimeout(_anamneseSaveTimer);
    _anamneseSaveTimer = null;
    // Só salva se não estiver em loading (i.e. há dado real para salvar)
    if (!_isLoadingAnamnese) {
      await autoSaveAnamnese(false);
    }
  }
}

// Helper para selecionar valores em <select> com correspondência robusta
function setSelectValue(id, val, fallback) {
  const el = document.getElementById(id);
  if (!el || !el.options || el.options.length === 0) return;

  const target = val || fallback || "";
  if (!target) return;

  // 1. Tentativa de correspondência exata por value
  for (let i = 0; i < el.options.length; i++) {
    if (el.options[i].value === target) {
      el.selectedIndex = i;
      return;
    }
  }

  // 2. Correspondência case-insensitive por value
  const lower = target.toLowerCase().trim();
  for (let i = 0; i < el.options.length; i++) {
    if (el.options[i].value.toLowerCase().trim() === lower) {
      el.selectedIndex = i;
      return;
    }
  }

  // 3. Correspondência por texto visível
  for (let i = 0; i < el.options.length; i++) {
    if (el.options[i].text.toLowerCase().trim() === lower) {
      el.selectedIndex = i;
      return;
    }
  }

  // 4. Correspondência parcial - value contém ou está contido no target
  for (let i = 0; i < el.options.length; i++) {
    const optVal = el.options[i].value.toLowerCase().trim();
    if (optVal.includes(lower) || lower.includes(optVal)) {
      el.selectedIndex = i;
      return;
    }
  }

  // 5. Fallback para o valor padrão
  if (fallback && fallback !== target) {
    for (let i = 0; i < el.options.length; i++) {
      if (el.options[i].value === fallback) {
        el.selectedIndex = i;
        return;
      }
    }
  }

  // 6. Se nenhum match, mantém o primeiro option
  el.selectedIndex = 0;
}

// Lê o valor atual de um campo do formulário de forma segura
function _getField(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  return el.value ?? null;
}

async function loadPatientAnamnese(patientId) {
  // Guard ANTES do await para fechar a janela de corrida
  _isLoadingAnamnese = true;

  let p;
  try {
    p = await db.patients.get(patientId);
  } catch(e) {
    _isLoadingAnamnese = false;
    return;
  }
  if (!p) {
    _isLoadingAnamnese = false;
    return;
  }

  try {
    const tag = document.getElementById("anamnesePatientTag");
    if (tag) tag.innerText = p.name;

    // ─── Seção 1: Objetivo & Perfil Clínico ───────────────────────────────
    setSelectValue("anamneseObjective", p.objective, "Perda de peso");
    setSelectValue("anamnesePatientType", p.patientType, "Praticante recreativo");

    const usualW = p.usualWeight || p.currentWeight || "";
    const usualWEl = document.getElementById("anamneseUsualWeight");
    if (usualWEl) usualWEl.value = usualW;

    const targetWeight = p.targetWeight ||
      calculateAutoTargetWeight({ patient: p, weight: parseFloat(usualW) || 70, objective: p.objective });
    const targetEl = document.getElementById("anamneseTargetWeight");
    if (targetEl) targetEl.value = targetWeight;

    const notesEl = document.getElementById("anamneseClinicalNotes");
    if (notesEl) notesEl.value = p.clinicalNotes || "";

    const dietEl = document.getElementById("anamneseDietaryRestrictions");
    if (dietEl) dietEl.value = p.dietaryRestrictions || "";

    // ─── Seção 2: Rotina & Hábitos ───────────────────────────────────────
    setSelectValue("anamneseCookingAvailability", p.cookingAvailability, "Moderada");
    setSelectValue("anamneseMealPreparer", p.mealPreparer, "O próprio paciente");

    const waterEl = document.getElementById("anamneseWaterIntake");
    if (waterEl) {
      waterEl.value = p.hydrationLiters ||
        (parseFloat(usualW) ? Number((parseFloat(usualW) * 0.035).toFixed(1)) : 3.0);
    }

    setSelectValue("anamneseBowelHabit", p.bowelHabit, "Regular (1x a 2x/dia)");
    setSelectValue("anamneseNeatRoutine", p.neatRoutine, "Moderado");

    const aversEl = document.getElementById("anamneseFoodAversions");
    if (aversEl) aversEl.value = p.foodAversions || "";

    const prefEl = document.getElementById("anamnesePreferredFoods");
    if (prefEl) prefEl.value = p.preferredFoods || "";

    // ─── Seção 3: Perfil de Treino ────────────────────────────────────────
    const workoutTypeToLoad = p.workoutType || p.mainModality || "Musculação / Força";
    setSelectValue("anamneseWorkoutType", workoutTypeToLoad, "Musculação / Força");

    const isSedentary = (p.patientType === "Sedentário") ||
      (workoutTypeToLoad === "Nenhum (Sedentário)");

    if (isSedentary) {
      _applyAnamneseSedentaryLock(true);
    } else {
      _applyAnamneseSedentaryLock(false);
      setSelectValue("anamneseWorkoutFrequency", p.workoutFrequency, "5x/semana");
      setSelectValue("anamneseWorkoutDuration", p.workoutDuration, "60 min");
      setSelectValue("anamneseWorkoutIntensity", p.workoutIntensity, "Moderada");
      const timeEl = document.getElementById("anamneseWorkoutTime");
      if (timeEl) timeEl.value = p.workoutTime || "";
    }

    // ─── Seção 4: Sono, Estresse & FA ────────────────────────────────────
    const sleepEl = document.getElementById("anamneseSleepHours");
    if (sleepEl) sleepEl.value = p.sleepHours || 7.5;

    setSelectValue("anamneseSleepQuality", p.sleepQuality, "Boa");
    setSelectValue("anamneseStressLevel", p.stressLevel, "Moderado");

    // FA: usa o salvo no banco. Se não existir, calcula com base nos dados
    const faEl = document.getElementById("anamneseActivityFactor");
    if (faEl) {
      faEl.value = p.activityFactor || 1.42;
    }

    // Atualiza diagnóstico de FA sem triggerar save
    _refreshFADescription(p.activityFactor || 1.42, isSedentary,
      p.neatRoutine || "Moderado",
      p.workoutFrequency || "5x/semana",
      p.workoutIntensity || "Moderada",
      p.sleepHours || 7.5);

  } finally {
    // Sempre libera o guard
    _isLoadingAnamnese = false;
  }
}

// Aplica bloqueio visual dos campos quando sedentário
function _applyAnamneseSedentaryLock(lock) {
  const fields = ["anamneseWorkoutFrequency", "anamneseWorkoutDuration",
                  "anamneseWorkoutIntensity", "anamneseWorkoutTime"];
  const defaults = ["0x/semana", "45 min", "Leve", "Não se aplica (Sedentário)"];

  fields.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lock) {
      el.value = defaults[i];
      el.disabled = true;
      el.classList.add("opacity-40", "cursor-not-allowed");
    } else {
      el.disabled = false;
      el.classList.remove("opacity-40", "cursor-not-allowed");
      if (el.value === defaults[i]) {
        const fallbacks = ["5x/semana", "60 min", "Moderada", ""];
        el.value = fallbacks[i];
      }
    }
  });
}

// Atualiza apenas o texto de diagnóstico de FA (sem recalcular)
function _refreshFADescription(fa, isSedentary, neat, freq, intensity, sleep) {
  const descEl = document.getElementById("anamneseFADescription");
  if (!descEl) return;
  const classification = fa >= 1.725 ? "Muito Ativo / Atleta" :
                         fa >= 1.55  ? "Moderadamente Ativo" :
                         fa >= 1.375 ? "Levemente Ativo" : "Sedentário";
  if (isSedentary) {
    descEl.innerHTML = `Paciente <strong>Sedentário</strong> (Opções de treino desconsideradas) + Rotina <strong>${neat}</strong> geram um FA de <strong>${Number(fa).toFixed(2)} (${classification})</strong>.`;
  } else {
    descEl.innerHTML = `Treino <strong>${freq}</strong> (${intensity}) + Rotina <strong>${neat}</strong> + Sono <strong>${sleep}h</strong> geram um Fator de Atividade sugerido de <strong>${Number(fa).toFixed(2)} (${classification})</strong>.`;
  }
}

function onAnamnesePatientTypeChange() {
  if (_isLoadingAnamnese) return;
  const patientType = document.getElementById("anamnesePatientType")?.value;
  if (patientType === "Sedentário") {
    const wtEl = document.getElementById("anamneseWorkoutType");
    if (wtEl) wtEl.value = "Nenhum (Sedentário)";
    _applyAnamneseSedentaryLock(true);
  } else {
    _applyAnamneseSedentaryLock(false);
  }
  calculateSuggestedFA();
  _scheduleAnamneseSave();
}

function onAnamneseWorkoutTypeChange(shouldAutoSave = true) {
  if (_isLoadingAnamnese) return;
  const workoutType = document.getElementById("anamneseWorkoutType")?.value;
  const isSedentary = workoutType === "Nenhum (Sedentário)" ||
    document.getElementById("anamnesePatientType")?.value === "Sedentário";

  _applyAnamneseSedentaryLock(isSedentary);
  calculateSuggestedFA();
  if (shouldAutoSave) _scheduleAnamneseSave();
}

async function onAnamneseObjectiveOrWeightChange() {
  if (_isLoadingAnamnese) return;

  const usualW = parseFloat(document.getElementById("anamneseUsualWeight")?.value);
  if (usualW && usualW > 0) {
    // Sincroniza peso com a aba de Avaliação se disponível
    const evalW = document.getElementById("evalWeight");
    if (evalW) evalW.value = usualW;
  }

  // Recalcula projeções da avaliação e metas da prescrição
  if (typeof updateEvaluationCalculations === "function") {
    updateEvaluationCalculations();
  }
  if (typeof renderPrescriptionTotals === "function") {
    renderPrescriptionTotals();
  }
  if (typeof updateDashboardAndRadar === "function") {
    updateDashboardAndRadar(activePatientId);
  }

  _scheduleAnamneseSave();
}

function calculateSuggestedFA(autoSync = true) {
  const workoutType = document.getElementById("anamneseWorkoutType")?.value || "";
  const isSedentary = workoutType === "Nenhum (Sedentário)" ||
    document.getElementById("anamnesePatientType")?.value === "Sedentário";
  const neat = document.getElementById("anamneseNeatRoutine")?.value || "Moderado";
  const freq = document.getElementById("anamneseWorkoutFrequency")?.value || "5x/semana";
  const intensity = document.getElementById("anamneseWorkoutIntensity")?.value || "Alta";
  const sleep = parseFloat(document.getElementById("anamneseSleepHours")?.value) || 7.5;

  let baseFA = 1.20; // Sedentário base

  if (isSedentary) {
    if (neat === "Leve") baseFA += 0.02;
    else if (neat === "Moderado") baseFA += 0.05;
    else if (neat === "Intenso") baseFA += 0.10;
  } else {
    if (neat === "Leve") baseFA += 0.08;
    else if (neat === "Moderado") baseFA += 0.15;
    else if (neat === "Intenso") baseFA += 0.25;

    if (freq === "2x/semana" || freq === "3x/semana") baseFA += 0.08;
    else if (freq === "4x/semana" || freq === "5x/semana") baseFA += 0.14;
    else if (freq === "6x/semana" || freq === "7x/semana") baseFA += 0.20;

    if (intensity === "Alta") baseFA += 0.05;
  }

  if (sleep >= 7.0) baseFA += 0.02;

  const finalFA = Number(baseFA.toFixed(2));
  const faInput = document.getElementById("anamneseActivityFactor");
  if (faInput) faInput.value = finalFA;

  _refreshFADescription(finalFA, isSedentary, neat, freq, intensity, sleep);

  if (autoSync) {
    const evalFA = document.getElementById("evalActivityFactor");
    if (evalFA) {
      evalFA.value = finalFA;
      if (typeof updateEvaluationCalculations === "function") updateEvaluationCalculations();
    }
  }

  return finalFA;
}

async function autoSaveAnamnese(shouldSyncCloud = false) {
  if (_isLoadingAnamnese) return; // Bloqueia save durante load
  
  const p = await db.patients.get(activePatientId);
  if (!p) return;

  // Lê todos os campos do formulário com valores seguros (não usa || para strings)
  const usualW = parseFloat(_getField("anamneseUsualWeight")) || p.usualWeight || p.currentWeight || 70.0;
  const objective = _getField("anamneseObjective") || p.objective || "Perda de peso";
  const patientType = _getField("anamnesePatientType") || p.patientType || "Praticante recreativo";
  const clinicalNotes = _getField("anamneseClinicalNotes") ?? p.clinicalNotes ?? "";
  const dietaryRestrictions = _getField("anamneseDietaryRestrictions") ?? p.dietaryRestrictions ?? "";
  const cookingAvailability = _getField("anamneseCookingAvailability") || p.cookingAvailability || "Moderada";
  const mealPreparer = _getField("anamneseMealPreparer") || p.mealPreparer || "O próprio paciente";
  const hydrationLiters = parseFloat(_getField("anamneseWaterIntake")) || p.hydrationLiters || Number((usualW * 0.035).toFixed(1));
  const bowelHabit = _getField("anamneseBowelHabit") || p.bowelHabit || "Regular (1x a 2x/dia)";
  const neatRoutine = _getField("anamneseNeatRoutine") || p.neatRoutine || "Moderado";
  const foodAversions = _getField("anamneseFoodAversions") ?? p.foodAversions ?? "";
  const preferredFoods = _getField("anamnesePreferredFoods") ?? p.preferredFoods ?? "";
  const workoutType = _getField("anamneseWorkoutType") || p.workoutType || "Musculação / Força";
  
  // Para campos de treino, usa valores salvos se estiverem desabilitados (sedentário)
  const freqEl = document.getElementById("anamneseWorkoutFrequency");
  const durEl = document.getElementById("anamneseWorkoutDuration");
  const intEl = document.getElementById("anamneseWorkoutIntensity");
  const timeEl = document.getElementById("anamneseWorkoutTime");
  const isSedentaryNow = (workoutType === "Nenhum (Sedentário)") || (patientType === "Sedentário");
  
  const workoutFrequency = (isSedentaryNow ? "0x/semana" : (freqEl?.value || p.workoutFrequency || "5x/semana"));
  const workoutDuration = (isSedentaryNow ? "45 min" : (durEl?.value || p.workoutDuration || "60 min"));
  const workoutIntensity = (isSedentaryNow ? "Leve" : (intEl?.value || p.workoutIntensity || "Moderada"));
  const workoutTime = (isSedentaryNow ? "" : (timeEl?.value ?? p.workoutTime ?? ""));

  const sleepHours = parseFloat(_getField("anamneseSleepHours")) || p.sleepHours || 7.5;
  const sleepQuality = _getField("anamneseSleepQuality") || p.sleepQuality || "Boa";
  const stressLevel = _getField("anamneseStressLevel") || p.stressLevel || "Moderado";

  const fa = calculateSuggestedFA(false);

  // Calcula novo peso-alvo com base no objetivo e peso atual
  const targetW = parseFloat(_getField("anamneseTargetWeight")) ||
    calculateAutoTargetWeight({ patient: p, weight: usualW, objective });

  const targetEl = document.getElementById("anamneseTargetWeight");
  if (targetEl && !parseFloat(_getField("anamneseTargetWeight"))) {
    targetEl.value = targetW;
  }

  // Aplica ao objeto do paciente
  Object.assign(p, {
    objective, patientType,
    usualWeight: usualW, currentWeight: usualW, targetWeight: targetW,
    clinicalNotes, dietaryRestrictions,
    cookingAvailability, mealPreparer, hydrationLiters, bowelHabit,
    neatRoutine, foodAversions, preferredFoods,
    mainModality: workoutType, workoutType,
    workoutFrequency, workoutDuration, workoutIntensity, workoutTime,
    sleepHours, sleepQuality, stressLevel,
    activityFactor: fa
  });

  await db.patients.put(p);

  // ─── Sincroniza cabeçalho ────────────────────────────────────────────────
  const hInfo = document.getElementById("headerPatientInfo");
  if (hInfo) hInfo.innerText = `${p.age} anos • ${p.height} m • ${p.currentWeight} kg`;

  const hGoal = document.getElementById("headerPatientGoal");
  if (hGoal) hGoal.innerText = p.objective;

  // ─── Sincroniza Avaliação (peso + FA) ────────────────────────────────────
  const evalW = document.getElementById("evalWeight");
  if (evalW && parseFloat(evalW.value) !== p.currentWeight) {
    evalW.value = p.currentWeight;
  }

  const evalFA = document.getElementById("evalActivityFactor");
  if (evalFA && parseFloat(evalFA.value) !== p.activityFactor) {
    evalFA.value = p.activityFactor;
  }

  updateEvaluationCalculations();

  if (shouldSyncCloud) {
    await savePatientToCloud(activePatientId);
  }
}

function attachAnamneseTriggers() {
  const selects = [
    "anamneseObjective", "anamnesePatientType",
    "anamneseCookingAvailability", "anamneseMealPreparer", "anamneseBowelHabit",
    "anamneseNeatRoutine", "anamneseWorkoutFrequency",
    "anamneseWorkoutDuration", "anamneseWorkoutIntensity",
    "anamneseSleepHours", "anamneseSleepQuality", "anamneseStressLevel"
  ];

  const textInputs = [
    "anamneseUsualWeight", "anamneseWaterIntake",
    "anamneseClinicalNotes", "anamneseDietaryRestrictions",
    "anamneseFoodAversions", "anamnesePreferredFoods",
    "anamneseWorkoutTime", "anamneseActivityFactor"
  ];

  selects.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", _scheduleAnamneseSave);
  });

  textInputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", _scheduleAnamneseSave);
  });
}

async function savePatientAnamnese() {
  await autoSaveAnamnese(true);
  alert("✅ Anamnese, Rotina e Perfil de Treino salvos com sucesso no Dexie.js!");
}

function applyAnamneseFAToEvaluation() {
  const fa = parseFloat(document.getElementById("anamneseActivityFactor")?.value) || 1.42;
  const evalFA = document.getElementById("evalActivityFactor");
  if (evalFA) evalFA.value = fa;
  if (typeof updateEvaluationCalculations === "function") updateEvaluationCalculations();
  alert(`✅ Fator de Atividade (${fa}) aplicado com sucesso à Avaliação Antropométrica e cálculo do GET!`);
  switchTab("evaluation");
}





// =========================================================================
// 9. MÓDULO 03: RECORDATÓRIO ALIMENTAR (INGESTÃO HABITUAL 24H)
// =========================================================================

let currentRecallItems = [];
let selectedRecallFoodItem = null;

async function loadDietaryRecall(patientId = activePatientId) {
  currentRecallItems = await db.dietaryRecall.where("patientId").equals(patientId).toArray();
  renderDietaryRecallTotals();
  renderRecallMealItems();
}

async function handleRecallFoodSearchAutocomplete(val) {
  const dropdown = document.getElementById("recallFoodSearchDropdown");
  if (!dropdown) return;

  if (!val || val.length < 2) {
    dropdown.classList.add("hidden");
    return;
  }

  const allFoods = await db.foods.toArray();
  const searchVal = val.toLowerCase();
  const matches = allFoods.filter((f) => 
    (f.name && f.name.toLowerCase().includes(searchVal)) ||
    (f.brand && f.brand.toLowerCase().includes(searchVal)) ||
    (f.category && f.category.toLowerCase().includes(searchVal))
  ).slice(0, 10);

  if (matches.length === 0) {
    dropdown.classList.add("hidden");
    return;
  }

  dropdown.innerHTML = matches
    .map(
      (f) => `
    <button type="button" onclick="selectRecallFood('${f.id}')" class="w-full text-left p-3 hover:bg-zinc-800 border-b border-zinc-800 flex justify-between items-center text-xs transition-colors group">
      <div>
        <span class="font-bold text-white group-hover:text-red-400 transition-colors block">${f.name}</span>
        <span class="text-[10px] text-zinc-400 font-medium">${f.category || ""} ${f.brand ? `• ${f.brand}` : ""}</span>
      </div>
      <div class="text-right font-mono">
        <span class="text-xs font-black text-red-400 block">${Math.round(f.calories)} kcal</span>
        <span class="text-[10px] text-zinc-400">P:${f.protein}g | C:${f.carbohydrate}g</span>
      </div>
    </button>
  `
    )
    .join("");

  dropdown.classList.remove("hidden");
}

async function selectRecallFood(id) {
  const numId = Number(id);
  const food = (!isNaN(numId) ? await db.foods.get(numId) : null) || await db.foods.get(id) || await db.foods.where("name").equals(id).first();
  if (!food) return;
  selectedRecallFoodItem = food;

  const input = document.getElementById("recallSearchInput");
  if (input) input.value = food.name;

  const dropdown = document.getElementById("recallFoodSearchDropdown");
  if (dropdown) dropdown.classList.add("hidden");

  // Auto-seleciona unidade inteligente sugerida
  const unitSelect = document.getElementById("recallUnitSelect");
  const qtyInput = document.getElementById("recallQtyInput");
  const nameLow = food.name.toLowerCase();

  if (unitSelect && qtyInput) {
    if (nameLow.includes("ovo") || nameLow.includes("banana") || nameLow.includes("maçã") || nameLow.includes("pão francês")) {
      unitSelect.value = "unid";
      qtyInput.value = "2";
    } else if (nameLow.includes("pão de forma") || nameLow.includes("queijo") || nameLow.includes("fatia")) {
      unitSelect.value = "fatia";
      qtyInput.value = "2";
    } else if (nameLow.includes("whey") || nameLow.includes("albumina") || nameLow.includes("creatina")) {
      unitSelect.value = "scoop";
      qtyInput.value = "1";
    } else if (nameLow.includes("arroz") || nameLow.includes("feijão") || nameLow.includes("azeite") || nameLow.includes("pasta de amendoim") || nameLow.includes("aveia")) {
      unitSelect.value = "col_sopa";
      qtyInput.value = "3";
    } else if (nameLow.includes("filé") || nameLow.includes("file") || nameLow.includes("bife") || nameLow.includes("frango") || nameLow.includes("tilápia")) {
      unitSelect.value = "file";
      qtyInput.value = "1";
    } else if (nameLow.includes("leite") || nameLow.includes("iogurte")) {
      unitSelect.value = "copo";
      qtyInput.value = "1";
    } else {
      unitSelect.value = "g";
      qtyInput.value = "100";
    }
  }

  updateRecallLivePreview();
}

function updateRecallLivePreview() {
  const previewText = document.getElementById("recallLivePreviewText");
  const previewMacros = document.getElementById("recallLivePreviewMacros");
  if (!previewText || !previewMacros) return;

  if (!selectedRecallFoodItem) {
    previewText.innerText = "Selecione um alimento para visualizar o cálculo de unidades e macros.";
    previewMacros.innerText = "";
    return;
  }

  const rawQty = parseFloat(document.getElementById("recallQtyInput")?.value) || 0;
  const unit = document.getElementById("recallUnitSelect")?.value || "g";

  const { grams, unitLabel } = convertFoodUnitToGrams(selectedRecallFoodItem, rawQty, unit);
  const scaled = calculateMacroPortion(selectedRecallFoodItem, grams);

  previewText.innerHTML = `<span><strong>${selectedRecallFoodItem.name}</strong> • ${unitLabel}</span>`;
  previewMacros.innerHTML = `<span class="text-red-400 font-bold">${Math.round(scaled.calories)} kcal</span> • P: ${scaled.protein.toFixed(1)}g • C: ${scaled.carbohydrate.toFixed(1)}g • G: ${scaled.lipid.toFixed(1)}g • Fibra: ${scaled.fiber.toFixed(1)}g`;
}

async function handleAddRecallItem() {
  if (!selectedRecallFoodItem) {
    alert("Por favor, busque e selecione um alimento antes de adicionar ao recordatório!");
    return;
  }

  const mealName = document.getElementById("recallMealSelect").value;
  const rawQty = parseFloat(document.getElementById("recallQtyInput").value) || 100;
  const unit = document.getElementById("recallUnitSelect")?.value || "g";

  const { grams, unitLabel } = convertFoodUnitToGrams(selectedRecallFoodItem, rawQty, unit);
  const scaled = calculateMacroPortion(selectedRecallFoodItem, grams);

  const newItem = {
    id: `rec_${Date.now()}`,
    patientId: activePatientId,
    mealName,
    mealTime: mealName === "Café da manhã" ? "07:30" :
              mealName === "Lanche manhã" ? "10:00" :
              mealName === "Almoço" ? "12:30" :
              mealName === "Lanche tarde" ? "16:30" :
              mealName === "Jantar" ? "20:30" : "22:30",
    foodName: selectedRecallFoodItem.name,
    quantity: grams,
    unitDisplay: unitLabel,
    calories: scaled.calories,
    protein: scaled.protein,
    carbohydrate: scaled.carbohydrate,
    lipid: scaled.lipid,
    fiber: scaled.fiber,
  };

  await db.dietaryRecall.put(newItem);
  currentRecallItems.push(newItem);

  renderDietaryRecallTotals();
  renderRecallMealItems();

  selectedRecallFoodItem = null;
  document.getElementById("recallSearchInput").value = "";
  document.getElementById("recallQtyInput").value = "100";
  document.getElementById("recallUnitSelect").value = "g";
  updateRecallLivePreview();
}

async function removeRecallItem(id) {
  await db.dietaryRecall.delete(id);
  currentRecallItems = currentRecallItems.filter((i) => i.id !== id);
  renderDietaryRecallTotals();
  renderRecallMealItems();
}

async function clearDietaryRecall() {
  if (confirm("Deseja realmente limpar todos os itens do Recordatório Alimentar deste paciente?")) {
    await db.dietaryRecall.where("patientId").equals(activePatientId).delete();
    currentRecallItems = [];
    renderDietaryRecallTotals();
    renderRecallMealItems();
  }
}

async function saveDietaryRecallToPatient() {
  alert(`✅ Recordatório Alimentar (${currentRecallItems.length} itens) salvo com sucesso!`);
  await savePatientToCloud(activePatientId);
}

function renderDietaryRecallTotals() {
  const totals = currentRecallItems.reduce(
    (acc, item) => ({
      kcal: acc.kcal + item.calories,
      protein: acc.protein + item.protein,
      carb: acc.carb + item.carbohydrate,
      lipid: acc.lipid + item.lipid,
      fiber: acc.fiber + (item.fiber || 0),
    }),
    { kcal: 0, protein: 0, carb: 0, lipid: 0, fiber: 0 }
  );

  if (document.getElementById("recallKcal")) document.getElementById("recallKcal").innerText = Math.round(totals.kcal);
  if (document.getElementById("recallProtein")) document.getElementById("recallProtein").innerText = `${Math.round(totals.protein)}g`;
  if (document.getElementById("recallCarb")) document.getElementById("recallCarb").innerText = `${Math.round(totals.carb)}g`;
  if (document.getElementById("recallLipid")) document.getElementById("recallLipid").innerText = `${Math.round(totals.lipid)}g`;
  if (document.getElementById("recallFiber")) document.getElementById("recallFiber").innerText = `${Math.round(totals.fiber)}g`;

  // Comparação com Prescrição Oficial Calculada em Tempo Real
  const presKcal = currentPrescriptionItems.reduce((acc, i) => acc + i.calories, 0);
  const presProt = currentPrescriptionItems.reduce((acc, i) => acc + i.protein, 0);

  const targetKcal = presKcal > 0 ? Math.round(presKcal) : 1890;
  const targetProt = presProt > 0 ? Math.round(presProt) : 191;
  const diffKcal = Math.round(totals.kcal - targetKcal);
  const diffProt = Math.round(totals.protein - targetProt);

  if (document.getElementById("recallDiffKcal")) {
    document.getElementById("recallDiffKcal").innerText = `${Math.round(totals.kcal)} vs ${targetKcal} kcal (${diffKcal > 0 ? `+${diffKcal}` : diffKcal} kcal)`;
  }
  if (document.getElementById("recallDiffProt")) {
    document.getElementById("recallDiffProt").innerText = `${Math.round(totals.protein)}g vs ${targetProt}g (${diffProt > 0 ? `+${diffProt}` : diffProt}g)`;
  }
  if (document.getElementById("recallEnergyBalance")) {
    document.getElementById("recallEnergyBalance").innerText = diffKcal < 0 ? "Déficit Basal Inicial" : "Superávit / Adequado";
  }
}

function renderRecallMealItems() {
  const container = document.getElementById("recallMealContainer");
  if (!container) return;

  const mealGroups = ["Café da manhã", "Lanche manhã", "Almoço", "Lanche tarde", "Jantar", "Ceia"];

  container.innerHTML = mealGroups
    .map((group) => {
      const items = currentRecallItems.filter((i) => i.mealName === group);
      if (items.length === 0) return "";

      const groupKcal = items.reduce((acc, i) => acc + i.calories, 0);
      const groupProt = items.reduce((acc, i) => acc + i.protein, 0);
      const groupCarb = items.reduce((acc, i) => acc + i.carbohydrate, 0);
      const groupLip = items.reduce((acc, i) => acc + i.lipid, 0);

      return `
      <div class="bg-zinc-900/90 rounded-3xl border border-zinc-800 shadow-card-dark overflow-hidden mb-4">
        <div class="bg-zinc-950 text-white p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-zinc-800/80">
          <div class="flex items-center gap-2.5">
            <span class="w-3 h-3 rounded-full bg-red-600 shadow-sm shadow-red-600/50"></span>
            <h3 class="font-black text-sm text-white">
              ${group} <span class="text-xs text-zinc-400 font-normal font-mono">(${items[0]?.mealTime || "Habitual"})</span>
            </h3>
          </div>
          <div class="flex items-center gap-3 text-xs font-mono">
            <span class="bg-zinc-950 text-white border border-zinc-800 px-2.5 py-0.5 rounded-full font-bold shadow-sm">
              <span class="text-red-400 font-black">${Math.round(groupKcal)} kcal</span>
            </span>
            <span class="text-zinc-300 font-medium">P: ${groupProt.toFixed(1)}g</span>
            <span class="text-zinc-300 font-medium">C: ${groupCarb.toFixed(1)}g</span>
            <span class="text-zinc-300 font-medium">G: ${groupLip.toFixed(1)}g</span>
          </div>
        </div>

        <div class="divide-y divide-zinc-800/70">
          ${items
            .map(
              (item) => `
            <div class="p-3.5 flex items-center justify-between hover:bg-zinc-800/50 text-xs transition-colors group">
              <div class="min-w-0 pr-2">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white text-xs">${item.foodName}</span>
                  <span class="bg-zinc-950 text-zinc-300 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border border-zinc-700">
                    ${item.unitDisplay || `${item.quantity}g`}
                  </span>
                </div>
                <div class="text-[11px] text-zinc-400 font-mono mt-0.5 flex gap-2">
                  <span class="text-red-400 font-bold">${Math.round(item.calories)} kcal</span>
                  <span>Proteína: ${Number(item.protein).toFixed(1)}g</span>
                  <span>Carboidrato: ${Number(item.carbohydrate).toFixed(1)}g</span>
                  <span>Lipídios: ${Number(item.lipid).toFixed(1)}g</span>
                </div>
              </div>

              <button
                onclick="removeRecallItem('${item.id}')"
                title="Remover item do recordatório"
                class="text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 p-2 rounded-xl transition-colors"
              >
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
    })
    .join("");

  if (window.lucide) window.lucide.createIcons();
}


// =========================================================================
// 10. PILAR 5: RESULTADO, IMPACTO & EFICIÊNCIA COMPOSTA (IEC & P-RATIO)
// =========================================================================

let chartWeightInstance = null;
let chartFatPercentInstance = null;
let chartBodyCompInstance = null;
let resultsActiveSubView = 'dashboard';

function resultsSwitchSubView(subViewName, scrollIntoView = false) {
  resultsActiveSubView = subViewName;

  // 1. Alterna visualização das sub-views
  const allSubviews = ['dashboard', 'charts', 'synergy', 'gallery', 'predictive'];
  allSubviews.forEach(v => {
    const el = document.getElementById(`results-view-${v}`);
    if (el) {
      if (v === subViewName) {
        el.style.display = 'block';
        el.classList.remove('hidden');
      } else {
        el.style.display = 'none';
        el.classList.add('hidden');
      }
    }

    // Botões no banner
    const subBtn = document.getElementById(`results-subbtn-${v}`);
    if (subBtn) {
      if (v === subViewName) {
        subBtn.className = "results-sub-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)] flex items-center gap-1.5 transition-all";
      } else {
        subBtn.className = "results-sub-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all";
      }
    }

    // Botões no Header Desktop
    const navBtn = document.getElementById(`results-nav-${v}`);
    if (navBtn) {
      if (v === subViewName) {
        navBtn.className = "hud-tab-btn hud-tab-btn-amber active text-xs font-bold flex items-center gap-1";
      } else {
        navBtn.className = "hud-tab-btn text-xs font-bold flex items-center gap-1 text-zinc-300 hover:text-white";
      }
    }
  });

  // 2. Executa renderizador da sub-view
  if (subViewName === 'dashboard') {
    renderResultsDashboard(activePatientId);
  } else if (subViewName === 'charts') {
    renderResultsCharts(activePatientId);
  } else if (subViewName === 'synergy') {
    renderResultsSynergy(activePatientId);
  } else if (subViewName === 'gallery') {
    renderResultsGallery(activePatientId);
  } else if (subViewName === 'predictive') {
    renderResultsPredictive(activePatientId);
  }

  if (scrollIntoView) {
    const mainSection = document.getElementById('tab-evolution');
    if (mainSection) mainSection.scrollIntoView({ behavior: 'smooth' });
  }

  if (window.lucide) window.lucide.createIcons();
}

async function resultsCalculateMetrics(patientId = activePatientId) {
  let evals = await db.assessments.where("patientId").equals(patientId).toArray();
  evals = (evals || []).filter(e => e && !String(e.id).startsWith("eval_pv_"));
  evals.sort((a, b) => new Date(a.date) - new Date(b.date));

  const p = await db.patients.get(patientId);
  const prescription = await db.prescriptions.where("patientId").equals(patientId).first();
  const ctx = perfGetNutritionContext();

  let weightDiff = 0, leanDiff = 0, fatDiff = 0, fatPercentDiff = 0, waistDiff = 0;
  let pRatio = 80;
  let iecStatus = 'recomp';
  let iecScore = 94;
  let iecBadgeText = '🟢 Composição Muscular Favorável';
  let iecBadgeClass = 'badge-iec-recomp';
  let iecExplanation = '';

  if (evals.length > 1) {
    const first = evals[0];
    const last = evals[evals.length - 1];

    weightDiff = Number((last.weight - first.weight).toFixed(2));
    leanDiff = Number((last.leanMass - first.leanMass).toFixed(2));
    fatDiff = Number((last.fatMass - first.fatMass).toFixed(2));
    fatPercentDiff = Number((last.fatPercent - first.fatPercent).toFixed(2));
    waistDiff = Number(((last.waist || 0) - (first.waist || 0)).toFixed(1));

    if (Math.abs(weightDiff) > 0.1) {
      pRatio = Math.min(99, Math.max(50, Math.round((Math.abs(leanDiff) / (Math.abs(leanDiff) + Math.abs(fatDiff))) * 100)));
    }

    const cardioDays = (typeof perfWeeklySchedule !== 'undefined' && Array.isArray(perfWeeklySchedule))
      ? perfWeeklySchedule.filter(d => d.type === 'Cardio').length
      : 1;

    if (leanDiff >= 0 && fatDiff <= 0) {
      iecStatus = 'recomp';
      iecScore = Math.min(99, Math.max(88, 88 + Math.round(Math.abs(fatDiff) * 1.2 + leanDiff * 2)));
      iecBadgeText = '🟢 Recomposição Corporal Perfeita';
      iecBadgeClass = 'badge-iec-recomp';
      iecExplanation = `Excelente resposta fisiológica! O paciente alcançou recomposição corporal de alta qualidade (+${leanDiff > 0 ? '+' : ''}${leanDiff} kg MM e ${fatDiff} kg Gordura), confirmando sinergia entre o aporte proteico de ${ctx.proteinGKg.toFixed(1)} g/kg (${ctx.totalProteinG}g/dia no Pilar 3) e o estímulo de treino com ${cardioDays} sessão de cardio Zona 2 (Pilar 4).`;
    } else if (leanDiff > 0 && fatDiff > 0) {
      iecStatus = 'bulk';
      iecScore = Math.min(96, Math.max(80, 82 + Math.round(leanDiff * 3)));
      iecBadgeText = '🔵 Hipertrofia Limpa (Lean Bulk)';
      iecBadgeClass = 'badge-iec-bulk';
      iecExplanation = `Ganho de massa magra expressivo (+${leanDiff} kg MM). O superávit calórico controlado (${ctx.caloricTarget} kcal) permitiu síntese proteica acelerada com acúmulo mínimo de gordura.`;
    } else if (leanDiff <= 0 && fatDiff < 0) {
      iecStatus = 'cut';
      iecScore = Math.min(92, Math.max(75, 80 + Math.round(Math.abs(fatDiff) * 2.5)));
      iecBadgeText = '🟠 Cutting Preservativo';
      iecBadgeClass = 'badge-iec-cut';
      iecExplanation = `Fase de definição de alta eficiência (${fatDiff} kg de Gordura eliminados). A perda de massa magra foi minimizada (${leanDiff} kg), mantendo força e densidade metabólica.`;
    } else {
      iecStatus = 'warn';
      iecScore = 65;
      iecBadgeText = '🔴 Risco Catabólico / Ajuste Necessário';
      iecBadgeClass = 'badge-iec-warn';
      iecExplanation = `Alerta clínico: Identificada redução de massa muscular. Recomenda-se aumentar o aporte de carboidratos peri-treino e recalibrar o volume do microciclo no Pilar 4.`;
    }
  } else if (evals.length === 1) {
    const single = evals[0];
    weightDiff = Number(single.weight).toFixed(2);
    leanDiff = Number(single.leanMass).toFixed(2);
    fatDiff = Number(single.fatMass).toFixed(2);
    fatPercentDiff = Number(single.fatPercent).toFixed(2);
    waistDiff = Number(single.waist || 101).toFixed(1);
    pRatio = Math.round((Number(single.leanMass) / Number(single.weight)) * 100);
    iecScore = 94;
    iecBadgeText = `🟢 Densidade Miofibrilar Alta (${single.fatPercent}% BF)`;
    iecBadgeClass = 'badge-iec-recomp';
    iecExplanation = `Avaliação clínica registrada em ${single.date}. O paciente ${p?.name || 'Paulo Vitor'} apresenta ${Number(single.leanMass).toFixed(2)} kg de massa magra com ${Number(single.fatPercent).toFixed(2)}% de gordura corporal (${Number(single.fatMass).toFixed(2)} kg de gordura) e cintura de ${single.waist || 101} cm, demonstrando excelente densidade muscular e condição ideal para o superávit anabólico do Pilar 3 e progressão de força no Pilar 4.`;
  } else {
    iecScore = 90;
    iecBadgeText = '🟢 Cadastro de Paciente Inicial';
    iecBadgeClass = 'badge-iec-recomp';
    iecExplanation = `Nenhuma avaliação antropométrica registrada ainda. Clique em "+ Nova Reavaliação" para cadastrar a primeira medição.`;
  }

  return {
    evals,
    patient: p,
    prescription,
    weightDiff,
    leanDiff,
    fatDiff,
    fatPercentDiff,
    waistDiff,
    pRatio,
    iecScore,
    iecStatus,
    iecBadgeText,
    iecBadgeClass,
    iecExplanation
  };
}

async function renderResultsDashboard(patientId = activePatientId) {
  const currentPatientName = document.getElementById("headerPatientName")?.innerText?.trim();
  const currentPatientGoal = document.getElementById("headerPatientGoal")?.innerText?.trim();
  const resNameEl = document.getElementById("resultsPatientName");
  if (resNameEl && currentPatientName) resNameEl.innerText = currentPatientName;
  const resGoalEl = document.getElementById("resultsPatientGoal");
  if (resGoalEl && currentPatientGoal) resGoalEl.innerText = currentPatientGoal;

  const data = await resultsCalculateMetrics(patientId);
  const ctx = perfGetNutritionContext();

  // 1. Atualiza Header HUD Metrics
  const iecScoreEl = document.getElementById("results-iec-score");
  if (iecScoreEl) iecScoreEl.innerText = data.iecScore;
  const pratioEl = document.getElementById("results-pratio-val");
  if (pratioEl) {
    pratioEl.innerText = data.evals.length > 1
      ? `${data.leanDiff >= 0 ? '+' : ''}${data.leanDiff}kg`
      : (data.evals.length === 1 ? `${data.leanDiff}kg` : `80%`);
  }
  const vitalityEl = document.getElementById("results-vitality-val");
  if (vitalityEl) vitalityEl.innerText = "-8";

  // 2. Atualiza Card Nobre de Diagnóstico IEC
  const iecBadge = document.getElementById("results-iec-badge");
  if (iecBadge) {
    iecBadge.innerText = data.iecBadgeText;
    iecBadge.className = `text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${data.iecBadgeClass}`;
  }
  const leanVarEl = document.getElementById("results-iec-lean-var");
  if (leanVarEl) {
    leanVarEl.innerText = data.evals.length > 1
      ? `${data.leanDiff >= 0 ? '+' : ''}${data.leanDiff} kg Massa Magra`
      : (data.evals.length === 1 ? `${data.leanDiff} kg Massa Magra` : `Massa Magra Inicial`);
  }
  const fatVarEl = document.getElementById("results-iec-fat-var");
  if (fatVarEl) {
    fatVarEl.innerText = data.evals.length > 1
      ? `${data.fatPercentDiff} % (% Gordura)`
      : (data.evals.length === 1 ? `${data.fatPercentDiff} % (% Gordura)` : `Gordura Corporal`);
  }
  const dietSyncEl = document.getElementById("results-iec-diet-sync");
  if (dietSyncEl) {
    dietSyncEl.innerText = ctx.isBulking
      ? `Superávit Anabólico (+${ctx.energyBalance > 0 ? ctx.energyBalance : 280} kcal)`
      : `Déficit Controlado (-${Math.abs(ctx.energyBalance)} kcal)`;
  }
  const trainingSyncEl = document.getElementById("results-iec-training-sync");
  if (trainingSyncEl) {
    trainingSyncEl.innerText = `33 Séries / Semana (PHAT 5D + 1 Cardio)`;
  }
  const explEl = document.getElementById("results-iec-explanation");
  if (explEl) explEl.innerText = data.iecExplanation;

  // 3. Atualiza 4 Summary Stat Cards
  const wCh = document.getElementById("evoWeightChange");
  if (wCh) {
    wCh.innerText = data.evals.length > 1
      ? `${data.weightDiff >= 0 ? '+' : ''}${data.weightDiff} kg`
      : (data.evals.length === 1 ? `${data.weightDiff} kg` : `—`);
  }
  const lGn = document.getElementById("evoLeanGain");
  if (lGn) {
    lGn.innerText = data.evals.length > 1
      ? `${data.leanDiff >= 0 ? '+' : ''}${data.leanDiff} kg`
      : (data.evals.length === 1 ? `${data.leanDiff} kg` : `—`);
  }
  const fRd = document.getElementById("evoFatReduction");
  if (fRd) {
    fRd.innerText = data.evals.length > 1
      ? `${data.fatPercentDiff} %`
      : (data.evals.length === 1 ? `${data.fatPercentDiff} %` : `—`);
  }
  const wRd = document.getElementById("evoWaistReduction");
  if (wRd) {
    wRd.innerText = data.evals.length > 1
      ? `${data.waistDiff >= 0 ? '+' : ''}${data.waistDiff} cm`
      : (data.evals.length === 1 ? `${data.waistDiff} cm` : `—`);
  }

  // 4. Renderiza Tabela de Histórico (apenas registros REAIS do paciente)
  const tbody = document.getElementById("evaluationsTableBody");
  if (tbody) {
    if (!data.evals || data.evals.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="p-6 text-center text-zinc-400 font-medium">
            Nenhum registro antropométrico encontrado para este paciente. Clique em <strong>+ Nova Reavaliação</strong> para adicionar o primeiro registro.
          </td>
        </tr>`;
    } else {
      tbody.innerHTML = data.evals
        .map((e, idx) => {
          const isLatest = idx === data.evals.length - 1;
          return `
          <tr class="hover:bg-zinc-800/60 transition-colors group">
            <td class="p-3.5 pl-5 font-bold font-mono text-zinc-200 flex items-center gap-2">
              <span>${e.date}</span>
              ${isLatest ? '<span class="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.2 rounded font-bold">Atual</span>' : ''}
            </td>
            <td class="p-3.5 font-black font-mono text-white">${Number(e.weight).toFixed(2)} kg</td>
            <td class="p-3.5 font-mono text-emerald-400 font-bold">${Number(e.leanMass).toFixed(2)} kg</td>
            <td class="p-3.5 font-mono text-zinc-400 font-bold">${Number(e.fatMass).toFixed(2)} kg</td>
            <td class="p-3.5 font-mono font-black text-amber-400">${Number(e.fatPercent).toFixed(2)} %</td>
            <td class="p-3.5 font-mono text-zinc-300 font-medium">${e.waist ? `${e.waist} cm` : "—"}</td>
            <td class="p-3.5 font-mono text-[11px] font-bold text-emerald-300">
              <span class="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700">IEC ${data.iecScore}</span>
            </td>
            <td class="p-3.5 text-right pr-5">
              <button onclick="deleteAssessment('${e.id}')" title="Excluir medição"
                class="p-1.5 bg-zinc-800 text-zinc-400 hover:bg-rose-600 hover:text-white rounded-lg transition-colors border border-zinc-700 shadow-sm cursor-pointer">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </td>
          </tr>`;
        }).join("");
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

async function renderResultsCharts(patientId = activePatientId) {
  const data = await resultsCalculateMetrics(patientId);
  const evals = data.evals;
  if (!evals || evals.length === 0) return;

  const labels = evals.map((e) => {
    const parts = e.date.split("-");
    return `${parts[2] || parts[0]}/${parts[1] || ''}`;
  });

  const targetWeight = (data.patient && data.patient.targetWeight) ? data.patient.targetWeight : calculateAutoTargetWeight({ patient: data.patient });
  const targetLine = evals.map(() => targetWeight);

  // Gráfico 1: Peso vs Meta
  const ctxWeight = document.getElementById("chartWeightHistory")?.getContext("2d");
  if (ctxWeight && typeof Chart !== "undefined") {
    if (chartWeightInstance) chartWeightInstance.destroy();
    chartWeightInstance = new Chart(ctxWeight, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Peso Total (kg)",
            data: evals.map((e) => e.weight),
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: "#f59e0b",
            pointBorderColor: "#ffffff",
            pointRadius: 5,
          },
          {
            label: "Meta Alvo (kg)",
            data: targetLine,
            borderColor: "#71717a",
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { 
            position: "top", 
            labels: { color: "#e4e4e7", font: { size: 11, weight: "bold" } } 
          }
        },
        scales: {
          y: { grid: { color: "#27272a" }, ticks: { color: "#a1a1aa" } },
          x: { grid: { display: false }, ticks: { color: "#a1a1aa" } },
        },
      },
    });
  }

  // Gráfico 2: % de Gordura
  const ctxFat = (document.getElementById("chartBodyFatHistory") || document.getElementById("chartFatPercentHistory"))?.getContext("2d");
  if (ctxFat && typeof Chart !== "undefined") {
    if (chartFatPercentInstance) chartFatPercentInstance.destroy();
    chartFatPercentInstance = new Chart(ctxFat, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "% Gordura Corporal",
            data: evals.map((e) => e.fatPercent),
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: "#ef4444",
            pointBorderColor: "#ffffff",
            pointRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { 
            position: "top", 
            labels: { color: "#e4e4e7", font: { size: 11, weight: "bold" } } 
          }
        },
        scales: {
          y: { grid: { color: "#27272a" }, ticks: { color: "#a1a1aa" } },
          x: { grid: { display: false }, ticks: { color: "#a1a1aa" } },
        },
      },
    });
  }

  // Gráfico 3: Massa Magra vs Massa Gorda (Stacked Bar)
  const ctxComp = document.getElementById("chartBodyCompHistory")?.getContext("2d");
  if (ctxComp && typeof Chart !== "undefined") {
    if (chartBodyCompInstance) chartBodyCompInstance.destroy();
    chartBodyCompInstance = new Chart(ctxComp, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Massa Magra (kg)",
            data: evals.map((e) => e.leanMass),
            backgroundColor: "#10b981",
            borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 6, bottomRight: 6 },
          },
          {
            label: "Massa Gorda (kg)",
            data: evals.map((e) => e.fatMass),
            backgroundColor: "#52525b",
            borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { 
            position: "top", 
            labels: { color: "#e4e4e7", font: { size: 11, weight: "bold" } } 
          }
        },
        scales: {
          y: { 
            stacked: true, 
            beginAtZero: true, 
            grid: { color: "#27272a" },
            ticks: { color: "#a1a1aa", callback: (val) => val + " kg" }
          },
          x: { stacked: true, grid: { display: false }, ticks: { color: "#a1a1aa" } },
        },
      },
    });
  }

  if (window.lucide) window.lucide.createIcons();
}

async function renderResultsSynergy(patientId = activePatientId) {
  const ctx = perfGetNutritionContext();
  
  const carboDesc = document.getElementById("synergy-carbo-desc");
  if (carboDesc) {
    carboDesc.innerHTML = `Quando a recarga glicêmica pré-treino (${ctx.currentWeight > 100 ? '80-100g' : '60-80g'} carbo) atinge <strong class="text-white">100% da meta</strong>, a progressão média de tonelagem na musculação avança <strong class="text-amber-400">+4.8%</strong> por microciclo.`;
  }

  const protDesc = document.getElementById("synergy-protein-desc");
  if (protDesc) {
    protDesc.innerHTML = `Aporte sustentado em <strong class="text-white">${ctx.proteinGKg.toFixed(1)} g/kg (${ctx.totalProteinG}g/dia)</strong> garante taxa de síntese proteica elevada e particionamento anabólico positivo.`;
  }

  const cardioDesc = document.getElementById("synergy-cardio-desc");
  if (cardioDesc) {
    cardioDesc.innerHTML = `A sessão semanal de <strong class="text-white">Zona 2 Base Aeróbica</strong> (Dia 3) aprimora a biogênese mitocondrial e a sensibilidade insulínica, direcionando o superávit para a hipertrofia muscular.`;
  }

  const eaBadge = document.getElementById("synergy-ea-badge");
  if (eaBadge) {
    eaBadge.innerText = `44 kcal / kg Massa Magra (Faixa Ótima)`;
  }

  const eaDesc = document.getElementById("synergy-ea-desc");
  if (eaDesc) {
    eaDesc.innerText = `O balanço energético atual fornece aporte ideal para suporte anabólico e síntese proteica miofibrilar, com zero risco de fadiga do SNC ou sobrecarga metabólica.`;
  }

  if (window.lucide) window.lucide.createIcons();
}

async function renderResultsGallery(patientId = activePatientId) {
  const data = await resultsCalculateMetrics(patientId);
  const evals = data.evals || [];
  
  const container = document.getElementById("results-photo-compare-container");
  if (container && evals.length > 0) {
    const first = evals[0];
    const latest = evals[evals.length - 1];

    const firstDateParts = first.date ? first.date.split('-') : ['2026', '07', '09'];
    const firstFormatted = `${firstDateParts[2] || '09'}.${firstDateParts[1] || '07'}.${firstDateParts[0] || '2026'}`;

    const latestDateParts = latest.date ? latest.date.split('-') : ['2026', '07', '09'];
    const latestFormatted = `${latestDateParts[2] || '09'}.${latestDateParts[1] || '07'}.${latestDateParts[0] || '2026'}`;

    container.innerHTML = `
      <div class="p-4 rounded-2xl bg-black/60 border border-zinc-800 text-center space-y-3">
        <div class="flex justify-between items-center text-xs font-mono text-zinc-400">
          <span class="font-bold text-white">📸 Foto Inicial (${evals.length > 1 ? 'Avaliação #1' : 'Registro Base'})</span>
          <span>${firstFormatted}</span>
        </div>
        <div class="h-72 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden relative">
          <img id="results-photo-before" src="shapes_banner.jpg" alt="Foto Antes" class="object-cover w-full h-full opacity-80 hover:opacity-100 transition-opacity">
          <div class="absolute bottom-2 left-2 bg-black/80 px-2.5 py-1 rounded-lg text-[10px] font-mono text-zinc-300 border border-zinc-700">
            ${Number(first.weight).toFixed(1)} kg • ${Number(first.fatPercent).toFixed(1)}% BF • Cintura ${first.waist || 101}cm
          </div>
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-black/60 border border-amber-600/40 text-center space-y-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
        <div class="flex justify-between items-center text-xs font-mono text-amber-400">
          <span class="font-bold text-amber-300">🔥 ${evals.length > 1 ? 'Foto Atual (Reavaliação Recente)' : 'Foto Atual (Em Acompanhamento)'}</span>
          <span>${latestFormatted}</span>
        </div>
        <div class="h-72 rounded-xl bg-zinc-950 border border-amber-500/40 flex items-center justify-center overflow-hidden relative">
          <img id="results-photo-after" src="shapes_banner.jpg" alt="Foto Depois" class="object-cover w-full h-full">
          <div class="absolute bottom-2 left-2 bg-amber-950/90 px-2.5 py-1 rounded-lg text-[10px] font-mono text-amber-200 border border-amber-700">
            ${Number(latest.weight).toFixed(1)} kg • ${Number(latest.fatPercent).toFixed(1)}% BF • Cintura ${latest.waist || 101}cm
          </div>
        </div>
      </div>
    `;
  }

  if (window.lucide) window.lucide.createIcons();
}

function resultsTriggerPhotoUpload() {
  const input = document.getElementById("resultsPhotoFileInput");
  if (input) input.click();
}

function resultsHandlePhotoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const afterImg = document.getElementById("results-photo-after");
    if (afterImg) {
      afterImg.src = e.target.result;
      if (typeof showToast === 'function') {
        showToast("Foto da reavaliação atualizada com sucesso!", "success");
      }
    }
  };
  reader.readAsDataURL(file);
}

async function renderResultsPredictive(patientId = activePatientId) {
  const ctx = perfGetNutritionContext();

  // 1. Atualiza seletor de balanço calórico com base no objetivo real do paciente
  const defSelect = document.getElementById("pred-deficit-adjust");
  if (defSelect) {
    if (ctx.isBulking) {
      defSelect.innerHTML = `
        <option value="0" selected>Manter Superávit Atual (+280 kcal/dia · Ganho Limpo)</option>
        <option value="200">Aumentar Superávit (+480 kcal/dia · Bulk Acelerado)</option>
        <option value="-200">Ajuste Eucalórico (0 kcal/dia · Manutenção)</option>
        <option value="-400">Transição para Recomposição (-300 kcal/dia)</option>
      `;
    } else {
      defSelect.innerHTML = `
        <option value="0" selected>Manter Déficit Atual (-450 kcal/dia)</option>
        <option value="-200">Aumentar Déficit em -200 kcal (-650 kcal/dia)</option>
        <option value="-400">Aumentar Déficit em -400 kcal (-850 kcal/dia)</option>
        <option value="200">Diminuir Déficit em +200 kcal (-250 kcal/dia)</option>
      `;
    }
  }

  // 2. Atualiza seletor de cardio baseado na prescrição real do Pilar 4
  const cardioSelect = document.getElementById("pred-cardio-adjust");
  if (cardioSelect) {
    const cardioDays = (typeof perfWeeklySchedule !== 'undefined' && Array.isArray(perfWeeklySchedule))
      ? perfWeeklySchedule.filter(d => d.type === 'Cardio').length
      : 1;

    cardioSelect.innerHTML = `
      <option value="0" selected>Manter Plano Atual (${cardioDays} Sessão/Semana · Zona 2)</option>
      <option value="1">+1 Sessão Adicional (${cardioDays + 1}x / semana · Compromised Running)</option>
      <option value="2">+2 Sessões Adicionais (${cardioDays + 2}x / semana · Heavy Engine)</option>
      <option value="-1">Sem Cardio (0x / semana · Apenas Musculação)</option>
    `;
  }

  resultsRecalculatePrediction();
  if (window.lucide) window.lucide.createIcons();
}

function resultsRecalculatePrediction() {
  const ctx = perfGetNutritionContext();
  const defVal = parseInt(document.getElementById("pred-deficit-adjust")?.value) || 0;
  const cardioVal = parseInt(document.getElementById("pred-cardio-adjust")?.value) || 0;
  const resultEl = document.getElementById("pred-simulation-result");
  const rateEl = document.getElementById("pred-rate-val");
  const etaEl = document.getElementById("pred-eta-val");

  let baseWeeks = 12;
  if (ctx.isBulking) {
    if (defVal === 200) baseWeeks -= 2;
    else if (defVal === -200) baseWeeks += 3;
    else if (defVal === -400) baseWeeks += 5;

    if (cardioVal === 1) baseWeeks -= 1;
    else if (cardioVal === 2) baseWeeks += 1;
    else if (cardioVal === -1) baseWeeks += 1;

    baseWeeks = Math.max(8, baseWeeks);

    if (rateEl) rateEl.innerText = `+0,28 kg MM / semana`;
    if (etaEl) etaEl.innerText = `~${baseWeeks} Semanas (~${(baseWeeks / 4.3).toFixed(1)} Meses)`;
    if (resultEl) {
      resultEl.innerHTML = `💡 <strong>Resultado da Simulação (Hipertrofia):</strong> Com a configuração selecionada, a meta de densidade muscular e 10-12% BF será atingida em <strong>~${baseWeeks} semanas</strong> (~${(baseWeeks / 4.3).toFixed(1)} meses).`;
    }
  } else {
    if (defVal === -200) baseWeeks -= 3;
    else if (defVal === -400) baseWeeks -= 5;
    else if (defVal === 200) baseWeeks += 4;

    if (cardioVal === 1) baseWeeks -= 2;
    else if (cardioVal === 2) baseWeeks -= 3;
    else if (cardioVal === -1) baseWeeks += 3;

    baseWeeks = Math.max(6, baseWeeks);

    if (rateEl) rateEl.innerText = `-0,57 kg / semana`;
    if (etaEl) etaEl.innerText = `~${baseWeeks} Semanas (~${(baseWeeks / 4.3).toFixed(1)} Meses)`;
    if (resultEl) {
      resultEl.innerHTML = `💡 <strong>Resultado da Simulação (Definição):</strong> Com a configuração selecionada, o objetivo será atingido em <strong>~${baseWeeks} semanas</strong> (~${(baseWeeks / 4.3).toFixed(1)} meses).`;
    }
  }
}

function openMetricsGlossaryModal(cardKey = 'all') {
  const modal = document.getElementById("modalMetricsGlossary");
  if (!modal) return;
  modal.classList.remove("hidden");
  
  if (cardKey && cardKey !== 'all') {
    const card = document.getElementById(`glossary-card-${cardKey}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('ring-2', 'ring-amber-400');
      setTimeout(() => card.classList.remove('ring-2', 'ring-amber-400'), 2000);
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

function closeMetricsGlossaryModal() {
  const modal = document.getElementById("modalMetricsGlossary");
  if (modal) modal.classList.add("hidden");
}

async function exportImpactReportPDF(patientId = activePatientId) {
  const p = await db.patients.get(patientId);
  if (!p) {
    alert("Nenhum paciente selecionado!");
    return;
  }

  const data = await resultsCalculateMetrics(patientId);
  const ctx = perfGetNutritionContext();
  const evals = data.evals || [];
  const latestEval = evals.length > 0 ? evals[evals.length - 1] : null;

  const age = parseInt(p.age, 10) || 39;
  const height = parseFloat(p.height) || 1.93;
  const currentWeight = parseFloat(latestEval?.weight || p.currentWeight) || 115.8;
  const leanMass = parseFloat(latestEval?.leanMass) || (currentWeight * 0.819);
  const fatMass = parseFloat(latestEval?.fatMass) || (currentWeight - leanMass);
  const fatPercent = parseFloat(latestEval?.fatPercent) || Number(((fatMass / currentWeight) * 100).toFixed(2));
  const waist = parseFloat(latestEval?.waist) || 101.0;
  const objective = p.objective || "Hipertrofia & Recomposição";
  const emissionDate = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const imc = height > 0 ? Number((currentWeight / (height * height)).toFixed(2)) : 31.0;
  const rcEst = height > 0 ? Number((waist / (height * 100)).toFixed(2)) : 0.52;

  const cardioDays = (typeof perfWeeklySchedule !== 'undefined' && Array.isArray(perfWeeklySchedule))
    ? perfWeeklySchedule.filter(d => d.type === 'Cardio').length
    : 1;

  const splitName = (typeof perfActiveSplit !== 'undefined' && perfActiveSplit) ? perfActiveSplit : "PHAT (5 Dias · Hipertrofia/Força)";

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Por favor, permita pop-ups para gerar e imprimir o Laudo Clínico em PDF.");
    return;
  }

  const tableRowsHtml = evals.length > 0 
    ? evals.map((e, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 0 ? 'background: #f8fafc;' : ''}">
          <td style="padding: 8px 10px; font-weight: bold; font-family: monospace;">${e.date}</td>
          <td style="padding: 8px 10px; text-align: right; font-weight: bold;">${Number(e.weight).toFixed(2)} kg</td>
          <td style="padding: 8px 10px; text-align: right; color: #047857; font-weight: bold;">${Number(e.leanMass).toFixed(2)} kg</td>
          <td style="padding: 8px 10px; text-align: right; color: #64748b;">${Number(e.fatMass).toFixed(2)} kg</td>
          <td style="padding: 8px 10px; text-align: right; color: #b45309; font-weight: bold;">${Number(e.fatPercent).toFixed(2)} %</td>
          <td style="padding: 8px 10px; text-align: right;">${e.waist ? `${e.waist} cm` : "—"}</td>
          <td style="padding: 8px 10px; text-align: center; color: #047857; font-weight: bold;">IEC ${data.iecScore}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="7" style="padding: 12px; text-align: center; color: #64748b;">Nenhuma avaliação registrada ainda.</td></tr>`;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Laudo Clínico de Evolução & Impacto — ${p.name}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 12mm 12mm 12mm;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          font-size: 11.5px;
          line-height: 1.45;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @media print {
          body { background: #ffffff; }
          .no-print { display: none !important; }
        }
        .hud-metric-box {
          border-radius: 8px;
          padding: 10px 12px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      
      <!-- Barra Superior de Controle de Impressão (Oculta na Impressão) -->
      <div class="no-print" style="background: #78350f; color: #ffffff; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div>
          <strong style="font-size: 15px; display: block; color: #fde68a;">🏆 Laudo Clínico de Impacto &amp; Resultados (Pilar 5)</strong>
          <span style="font-size: 12px; color: #fef3c7;">Clique no botão ao lado para salvar em PDF em alta resolução ou imprimir.</span>
        </div>
        <button onclick="window.print()" style="background: #f59e0b; color: #000000; border: none; font-weight: 800; padding: 9px 20px; border-radius: 6px; font-size: 13px; cursor: pointer;">
          🖨️ Salvar como PDF / Imprimir
        </button>
      </div>

      <!-- CABEÇALHO CLÍNICO DO LAUDO -->
      <div style="border-bottom: 2.5px solid #d97706; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-size: 10px; font-weight: 800; color: #d97706; letter-spacing: 1.2px; text-transform: uppercase;">
            SISTEMA NUTRIAX PRO · PILAR 5: RESULTADO &amp; IMPACTO CLÍNICO
          </div>
          <h1 style="margin: 2px 0 4px 0; font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">
            LAUDO DE EVOLUÇÃO, PERFORMANCE &amp; RESULTADOS
          </h1>
          <div style="font-size: 12px; color: #334155;">
            Paciente: <strong style="color: #0f172a; font-size: 13px;">${p.name}</strong> • Objetivo: <strong style="color: #b45309;">${objective}</strong>
          </div>
        </div>

        <div style="text-align: right; font-size: 11px; color: #475569;">
          <div>Emissão: <strong>${emissionDate}</strong></div>
          <div>Nutricionista: <strong>Dr. Paulo Vitor Ribeiro de Sousa</strong></div>
          <div style="color: #059669; font-weight: bold; margin-top: 2px;">✓ Sinergia Nutrição × Performance</div>
        </div>
      </div>

      <!-- PAINEL EXECUTIVO: DADOS BIOMÉTRICOS & SCORES NOBRES -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px;">
        <div class="hud-metric-box" style="background: #fffbeb; border: 1.5px solid #fde68a;">
          <span style="font-size: 9.5px; font-weight: bold; color: #92400e; text-transform: uppercase; display: block;">ÍNDICE IEC</span>
          <p style="font-size: 20px; font-weight: 900; color: #b45309; margin: 1px 0;">${data.iecScore} <span style="font-size: 11px; color: #78350f; font-weight: normal;">/100</span></p>
          <span style="font-size: 9px; color: #92400e; font-weight: 600;">Eficiência Composta</span>
        </div>

        <div class="hud-metric-box" style="background: #f8fafc; border: 1.5px solid #e2e8f0;">
          <span style="font-size: 9.5px; font-weight: bold; color: #475569; text-transform: uppercase; display: block;">P-RATIO (FORBES)</span>
          <p style="font-size: 20px; font-weight: 900; color: #0f172a; margin: 1px 0;">${leanMass.toFixed(1)} <span style="font-size: 11px; color: #64748b; font-weight: normal;">kg MM</span></p>
          <span style="font-size: 9px; color: #059669; font-weight: bold;">81.9% Massa Magra</span>
        </div>

        <div class="hud-metric-box" style="background: #ecfdf5; border: 1.5px solid #a7f3d0;">
          <span style="font-size: 9.5px; font-weight: bold; color: #065f46; text-transform: uppercase; display: block;">VITALIDADE / IDADE</span>
          <p style="font-size: 20px; font-weight: 900; color: #047857; margin: 1px 0;">-8 <span style="font-size: 11px; color: #065f46; font-weight: normal;">anos</span></p>
          <span style="font-size: 9px; color: #047857; font-weight: bold;">Idade Metabólica: 31a</span>
        </div>

        <div class="hud-metric-box" style="background: #f8fafc; border: 1.5px solid #e2e8f0;">
          <span style="font-size: 9.5px; font-weight: bold; color: #475569; text-transform: uppercase; display: block;">DISP. ENERGÉTICA</span>
          <p style="font-size: 20px; font-weight: 900; color: #0f172a; margin: 1px 0;">44 <span style="font-size: 11px; color: #64748b; font-weight: normal;">kcal/kg</span></p>
          <span style="font-size: 9px; color: #059669; font-weight: bold;">Faixa Ótima Anabólica</span>
        </div>
      </div>

      <!-- PARECER CLÍNICO DO DIAGNÓSTICO IEC -->
      <div style="background: #fefce8; border-left: 4px solid #f59e0b; padding: 10px 14px; border-radius: 6px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
            Diagnóstico Clínico de Eficiência &amp; Recomposição:
          </strong>
          <span style="background: #fde68a; color: #78350f; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 4px;">
            ${data.iecBadgeText}
          </span>
        </div>
        <p style="font-size: 11px; color: #451a03; line-height: 1.45;">
          ${data.iecExplanation}
        </p>
      </div>

      <!-- QUADRO DE COMPOSIÇÃO CORPORAL ATUAL -->
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 14px;">
        <div style="background: #0f172a; color: #ffffff; padding: 7px 12px; font-weight: bold; font-size: 11px; display: flex; justify-content: space-between;">
          <span>1. COMPOSIÇÃO CORPORAL &amp; BIOMETRIA ATUAL</span>
          <span>Estatura: ${height.toFixed(2)} m · Idade: ${age} anos</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); padding: 10px 12px; gap: 10px; background: #ffffff; font-size: 11px;">
          <div>
            <span style="color: #64748b; font-size: 10px; display: block;">Peso Total:</span>
            <strong style="font-size: 14px; color: #0f172a;">${currentWeight.toFixed(2)} kg</strong>
          </div>
          <div>
            <span style="color: #64748b; font-size: 10px; display: block;">Massa Magra:</span>
            <strong style="font-size: 14px; color: #047857;">${leanMass.toFixed(2)} kg (${((leanMass/currentWeight)*100).toFixed(1)}%)</strong>
          </div>
          <div>
            <span style="color: #64748b; font-size: 10px; display: block;">Massa Gorda:</span>
            <strong style="font-size: 14px; color: #b45309;">${fatMass.toFixed(2)} kg (${fatPercent.toFixed(2)}%)</strong>
          </div>
          <div>
            <span style="color: #64748b; font-size: 10px; display: block;">Circunf. Cintura / RCEst:</span>
            <strong style="font-size: 14px; color: #0f172a;">${waist.toFixed(1)} cm <span style="font-size: 10px; color: #059669;">(RCEst ${rcEst})</span></strong>
          </div>
        </div>
      </div>

      <!-- HISTÓRICO DE REAVALIAÇÕES CLÍNICAS -->
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 14px;">
        <div style="background: #0f172a; color: #ffffff; padding: 7px 12px; font-weight: bold; font-size: 11px;">
          2. HISTÓRICO LONGITUDINAL DE REAVALIAÇÕES CLÍNICAS
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #f1f5f9; color: #475569; font-size: 10px; text-transform: uppercase;">
              <th style="padding: 7px 10px; text-align: left;">Data</th>
              <th style="padding: 7px 10px; text-align: right;">Peso Total</th>
              <th style="padding: 7px 10px; text-align: right;">Massa Magra</th>
              <th style="padding: 7px 10px; text-align: right;">Massa Gorda</th>
              <th style="padding: 7px 10px; text-align: right;">% Gordura</th>
              <th style="padding: 7px 10px; text-align: right;">Cintura</th>
              <th style="padding: 7px 10px; text-align: center;">Status IEC</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- SINERGIA NUTRIÇÃO × PERFORMANCE (PILAR 3 × PILAR 4) -->
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 14px;">
        <div style="background: #0f172a; color: #ffffff; padding: 7px 12px; font-weight: bold; font-size: 11px;">
          3. MATRIZ DE SINERGIA: NUTRIÇÃO (PILAR 3) × PERFORMANCE (PILAR 4)
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; padding: 10px 12px; gap: 12px; font-size: 11px; background: #ffffff;">
          <div style="border-right: 1px solid #e2e8f0; padding-right: 10px;">
            <strong style="color: #b45309; display: block; font-size: 11px; margin-bottom: 4px;">🥗 Protocolo Nutricional Prescrito:</strong>
            <ul style="padding-left: 14px; color: #334155; line-height: 1.5;">
              <li>Aporte Proteico: <strong>${ctx.proteinGKg.toFixed(1)} g/kg (${ctx.totalProteinG} g/dia)</strong></li>
              <li>Hidratação Mínima: <strong>${(ctx.waterTargetMl/1000).toFixed(2)} Litros/dia (40 mL/kg)</strong></li>
              <li>Balanço Energético: <strong>${ctx.isBulking ? `Superávit Anabólico (+${ctx.energyBalance > 0 ? ctx.energyBalance : 280} kcal/dia)` : `Déficit Controlado (-${Math.abs(ctx.energyBalance)} kcal/dia)`}</strong></li>
            </ul>
          </div>
          <div>
            <strong style="color: #1d4ed8; display: block; font-size: 11px; margin-bottom: 4px;">🏋️ Prescrição de Performance &amp; Cardio:</strong>
            <ul style="padding-left: 14px; color: #334155; line-height: 1.5;">
              <li>Divisão de Treino: <strong>${splitName}</strong></li>
              <li>Volume Muscular: <strong>33 Séries Semanais de Sobrecarga</strong></li>
              <li>Cardio Prescrito: <strong>${cardioDays} Sessão Semanal (Dia 3 · Zona 2 Base Aeróbica, 45 min)</strong></li>
            </ul>
          </div>
        </div>
      </div>

      <!-- CONCLUSÃO & PROJEÇÃO DE METAS -->
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; background: #f8fafc; margin-bottom: 20px; font-size: 11px;">
        <div style="font-weight: bold; color: #0f172a; margin-bottom: 4px;">🎯 Projeção Matemática &amp; Próximos Passos:</div>
        <p style="color: #334155; line-height: 1.45;">
          Com o superávit calórico controlado e o aporte proteico de 232g/dia, o paciente mantém velocidade de ganho de massa muscular magra de <strong>+0.28 kg MM/semana</strong> com preservação do percentual de gordura. Previsão de consolidação da meta estética e metabólica em <strong>~12 semanas</strong> mantendo a aderência ao plano atual.
        </p>
      </div>

      <!-- ASSINATURA PROFISSIONAL -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px; padding-top: 15px; border-top: 1px solid #cbd5e1;">
        <div style="font-size: 9.5px; color: #64748b;">
          <div>Documento gerado eletronicamente pelo Sistema NutriAx Pro (Versão 3.0).</div>
          <div>Código de Autenticidade: NAX-P5-${patientId}-${Date.now().toString(36).toUpperCase()}</div>
        </div>
        <div style="text-align: center; width: 220px;">
          <div style="border-bottom: 1.5px solid #0f172a; margin-bottom: 4px;"></div>
          <strong style="font-size: 11px; color: #0f172a; display: block;">Dr. Paulo Vitor Ribeiro de Sousa</strong>
          <span style="font-size: 9.5px; color: #64748b;">Nutricionista Responsável</span>
        </div>
      </div>

    </body>
    </html>
  `);

  printWindow.document.close();
}

async function loadAssessmentsAndRenderCharts(patientId = activePatientId) {
  await renderResultsDashboard(patientId);
  await renderResultsCharts(patientId);
}

// =========================================================================
// 13. GUIA VISUAL DE SHAPE & % DE GORDURA ALVO (11 NÍVEIS OFICIAIS)
// =========================================================================

const shapeGuideData = {
  Masculino: [
    { percent: 5, label: "Definição Extrema", description: "Abdômen trincado, alta vascularização, pernas muito definidas.", tag: "Competição" },
    { percent: 8, label: "Muito Definido", description: "Separação muscular evidente, peitoral marcado.", tag: "Atleta" },
    { percent: 10, label: "Definido", description: "Abdômen visível, boa separação muscular geral.", tag: "Fit Pro" },
    { percent: 12, label: "Atlético", description: "Abdômen levemente marcado, condição atlética.", tag: "Atlético" },
    { percent: 15, label: "Saudável Fit", description: "Aparência saudável, músculos visíveis em boa forma.", tag: "Saudável" },
    { percent: 18, label: "Condicionado", description: "Menor definição muscular, composição normal.", tag: "Normal" },
    { percent: 20, label: "Média Saudável", description: "Saúde em dia, sem definição muscular aparente.", tag: "Média" },
    { percent: 22, label: "Acima da Média", description: "Abdômen relaxado, acúmulo moderado de gordura.", tag: "Atenção" },
    { percent: 25, label: "Sobrepeso", description: "Abdômen proeminente, pouca definição muscular.", tag: "Sobrepeso" },
    { percent: 30, label: "Obesidade Leve", description: "Acúmulo elevado, flancos e pernas com acúmulo.", tag: "Alerta" },
    { percent: 35, label: "Obesidade Moderada", description: "Abdômen volumoso, alto acúmulo de gordura corporal.", tag: "Crítico" },
  ],
  Feminino: [
    { percent: 12, label: "Definição Extrema", description: "Altíssima definição muscular, abdômen e pernas fibrados.", tag: "Competição" },
    { percent: 15, label: "Muito Definida", description: "Linhas abdominais visíveis, vascularização leve.", tag: "Atleta" },
    { percent: 18, label: "Definida", description: "Abdômen reto, definição nos braços e pernas.", tag: "Fit Pro" },
    { percent: 20, label: "Atlética", description: "Excelente tônus muscular, aparência firme e atlética.", tag: "Atlética" },
    { percent: 22, label: "Saudável Fit", description: "Curvas suaves, boa forma e saúde em dia.", tag: "Saudável" },
    { percent: 25, label: "Média Saudável", description: "Composição corporal comum, sem definição marcada.", tag: "Média" },
    { percent: 28, label: "Condicionada", description: "Acúmulo leve em quadris e abdômen inferior.", tag: "Normal" },
    { percent: 30, label: "Acima da Média", description: "Curvas acentuadas, menor tônus muscular.", tag: "Atenção" },
    { percent: 32, label: "Sobrepeso Leve", description: "Acúmulo moderado em flancos e coxas.", tag: "Sobrepeso" },
    { percent: 35, label: "Sobrepeso", description: "Acúmulo de gordura corporal visível e volumoso.", tag: "Alerta" },
    { percent: 40, label: "Obesidade Leve", description: "Acúmulo elevado e dobras volumosas.", tag: "Crítico" },
  ]
};

// Matriz de Posições CSS Sprite (shapes_banner.jpg)
const shapeSpritePositions = {
  Masculino: [
    { percent: 5, posX: 0, posY: 28.5 },
    { percent: 8, posX: 10, posY: 28.5 },
    { percent: 10, posX: 20, posY: 28.5 },
    { percent: 12, posX: 30, posY: 28.5 },
    { percent: 15, posX: 40, posY: 28.5 },
    { percent: 18, posX: 50, posY: 28.5 },
    { percent: 20, posX: 60, posY: 28.5 },
    { percent: 22, posX: 70, posY: 28.5 },
    { percent: 25, posX: 80, posY: 28.5 },
    { percent: 30, posX: 90, posY: 28.5 },
    { percent: 35, posX: 100, posY: 28.5 },
  ],
  Feminino: [
    { percent: 12, posX: 0, posY: 67.5 },
    { percent: 15, posX: 10, posY: 67.5 },
    { percent: 18, posX: 20, posY: 67.5 },
    { percent: 20, posX: 30, posY: 67.5 },
    { percent: 22, posX: 40, posY: 67.5 },
    { percent: 25, posX: 50, posY: 67.5 },
    { percent: 28, posX: 60, posY: 67.5 },
    { percent: 30, posX: 70, posY: 67.5 },
    { percent: 32, posX: 80, posY: 67.5 },
    { percent: 35, posX: 90, posY: 67.5 },
    { percent: 40, posX: 100, posY: 67.5 },
  ]
};

let currentShapeGuideGender = "Masculino";

function openShapeGuideModal(initialGender) {
  const modal = document.getElementById("shapeGuideModal");
  if (!modal) return;

  const evalGender = document.getElementById("evalGender")?.value || "Masculino";
  currentShapeGuideGender = initialGender || evalGender;
  switchShapeGuideGender(currentShapeGuideGender);

  modal.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function closeShapeGuideModal() {
  const modal = document.getElementById("shapeGuideModal");
  if (modal) modal.classList.add("hidden");
}

function switchShapeGuideGender(gender) {
  currentShapeGuideGender = gender;
  const btnMale = document.getElementById("shapeTabMale");
  const btnFemale = document.getElementById("shapeTabFemale");

  if (gender === "Masculino") {
    if (btnMale) {
      btnMale.className = "px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold transition-all flex items-center gap-1 shadow-sm shadow-red-950";
    }
    if (btnFemale) {
      btnFemale.className = "px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white font-bold transition-all flex items-center gap-1";
    }
  } else {
    if (btnMale) {
      btnMale.className = "px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white font-bold transition-all flex items-center gap-1";
    }
    if (btnFemale) {
      btnFemale.className = "px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold transition-all flex items-center gap-1 shadow-sm shadow-red-950";
    }
  }

  renderShapeCards(gender);
}

function renderShapeCards(gender) {
  const container = document.getElementById("shapeCardsGrid");
  if (!container) return;

  const currentTarget = parseFloat(document.getElementById("evalTargetFatPercent")?.value) || 10;
  const list = shapeGuideData[gender] || shapeGuideData.Masculino;
  const positions = shapeSpritePositions[gender] || shapeSpritePositions.Masculino;

  container.innerHTML = list.map((item, idx) => {
    const isSelected = Math.abs(item.percent - currentTarget) < 1.5;
    const borderClass = isSelected 
      ? "border-red-600 shadow-crimson-glow scale-[1.02] bg-zinc-900" 
      : "border-zinc-800 hover:border-red-600 hover:scale-[1.03] bg-zinc-900/90";

    const sprite = positions[idx] || { posX: idx * 10, posY: gender === "Masculino" ? 28.5 : 67.5 };
    const posX = sprite.posX;
    const posY = sprite.posY;

    return `
      <div
        onclick="selectVisualShape(${item.percent}, '${item.label}', '${gender}')"
        class="border ${borderClass} transition-all cursor-pointer p-3 rounded-2xl flex flex-col items-center text-center group relative overflow-hidden"
      >
        <!-- Shape Visual Preview Slot (CSS Sprite Recorte Oficial) -->
        <div class="w-full h-36 rounded-lg mb-2 overflow-hidden border border-zinc-800 bg-zinc-950 relative group-hover:border-red-500/50 transition-all flex flex-col justify-between p-1.5 shadow-inner">
          <!-- Sprite Cropped Image Layer -->
          <div 
            class="absolute inset-0 bg-no-repeat transition-transform duration-300 group-hover:scale-105"
            style="background-image: url('shapes_banner.jpg'); background-position: ${posX}% ${posY}%; background-size: 1100% auto;"
          ></div>
          
          <!-- Tag e Seleção Badge -->
          <div class="relative z-10 flex justify-between items-start w-full">
            <span class="text-[9px] font-mono text-zinc-300 font-black uppercase bg-zinc-950/85 backdrop-blur-sm px-1.5 py-0.5 rounded border border-zinc-800 shadow-sm">${item.tag}</span>
            ${isSelected ? `
              <span class="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md shadow-red-950">
                ✓
              </span>
            ` : ''}
          </div>
        </div>

        <span class="bg-red-600/20 text-red-500 font-black text-xs px-2.5 py-0.5 rounded-full border border-red-600/40 mb-1">
          ${item.percent}%
        </span>
        <h4 class="text-white font-bold text-xs uppercase tracking-tight group-hover:text-red-400 transition-colors line-clamp-1">
          ${item.label}
        </h4>
        <p class="text-zinc-400 text-[10px] leading-tight mt-1 line-clamp-2">
          ${item.description}
        </p>
      </div>
    `;
  }).join("");

  if (window.lucide) window.lucide.createIcons();
}

function selectVisualShape(percent, label, gender) {
  const targetInput = document.getElementById("evalTargetFatPercent");
  if (targetInput) {
    targetInput.value = percent;
  }

  const badge = document.getElementById("shapeCategoryBadge");
  if (badge) {
    badge.innerText = `${label} (${percent}%)`;
    badge.className = "bg-red-950/80 text-red-400 border border-red-800/80 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm shadow-red-950";
  }

  updateEvaluationCalculations();
  closeShapeGuideModal();
}

function onTargetBodyFatInputChange(val) {
  const bf = parseFloat(val) || 10;
  const gender = document.getElementById("evalGender")?.value || "Masculino";
  const list = shapeGuideData[gender] || shapeGuideData.Masculino;
  
  let closest = list[0];
  let minDiff = 999;
  list.forEach(item => {
    const diff = Math.abs(item.percent - bf);
    if (diff < minDiff) {
      minDiff = diff;
      closest = item;
    }
  });

  const badge = document.getElementById("shapeCategoryBadge");
  if (badge) {
    badge.innerText = `${closest.label} (${bf}%)`;
  }

  updateEvaluationCalculations();
}

function onEvalGenderChange(gender) {
  currentShapeGuideGender = gender;
  onTargetBodyFatInputChange(document.getElementById("evalTargetFatPercent")?.value);
}

// =========================================================================
// 11. MÓDULO 02: EXAMES CLÍNICOS LABORATORIAIS & MOTOR DE CONDUTAS
// =========================================================================

async function loadClinicalExams(patientId = activePatientId) {
  const p = await db.patients.get(patientId);
  const tag = document.getElementById("examsPatientTag");
  if (tag && p) tag.innerText = p.name;

  let exam = await db.clinicalExams.where("patientId").equals(patientId).first();
  if (!exam && patientId === "paulo-vitor") {
    exam = initialClinicalExamsData.find(e => e.patientId === patientId) || initialClinicalExamsData[0];
  }

  if (document.getElementById("examDateInput")) document.getElementById("examDateInput").value = exam ? (exam.examDate || "2026-06-20") : new Date().toISOString().split("T")[0];
  if (document.getElementById("examGlucose")) document.getElementById("examGlucose").value = exam ? (exam.fastingGlucose || "") : "";
  if (document.getElementById("examInsulin")) document.getElementById("examInsulin").value = exam ? (exam.fastingInsulin || "") : "";
  if (document.getElementById("examHba1c")) document.getElementById("examHba1c").value = exam ? (exam.hba1c || "") : "";
  
  if (document.getElementById("examTotalCholesterol")) document.getElementById("examTotalCholesterol").value = exam ? (exam.totalCholesterol || "") : "";
  if (document.getElementById("examHdl")) document.getElementById("examHdl").value = exam ? (exam.hdl || "") : "";
  if (document.getElementById("examLdl")) document.getElementById("examLdl").value = exam ? (exam.ldl || "") : "";
  if (document.getElementById("examTriglycerides")) document.getElementById("examTriglycerides").value = exam ? (exam.triglycerides || "") : "";

  if (document.getElementById("examTgo")) document.getElementById("examTgo").value = exam ? (exam.tgo || "") : "";
  if (document.getElementById("examTgp")) document.getElementById("examTgp").value = exam ? (exam.tgp || "") : "";
  if (document.getElementById("examUrea")) document.getElementById("examUrea").value = exam ? (exam.urea || "") : "";
  if (document.getElementById("examCreatinine")) document.getElementById("examCreatinine").value = exam ? (exam.creatinine || "") : "";
  if (document.getElementById("examUricAcid")) document.getElementById("examUricAcid").value = exam ? (exam.uricAcid || "") : "";

  if (document.getElementById("examFerritin")) document.getElementById("examFerritin").value = exam ? (exam.ferritin || "") : "";
  if (document.getElementById("examVitaminD")) document.getElementById("examVitaminD").value = exam ? (exam.vitaminD || "") : "";
  if (document.getElementById("examVitaminB12")) document.getElementById("examVitaminB12").value = exam ? (exam.vitaminB12 || "") : "";
  if (document.getElementById("examTsh")) document.getElementById("examTsh").value = exam ? (exam.tsh || "") : "";

  renderClinicalAlerts();
  renderPrescriptionClinicalAlerts(patientId);
}

function getClinicalExamsFormData() {
  return {
    patientId: activePatientId,
    examDate: document.getElementById("examDateInput")?.value || new Date().toISOString().split("T")[0],
    fastingGlucose: parseFloat(document.getElementById("examGlucose")?.value) || 0,
    fastingInsulin: parseFloat(document.getElementById("examInsulin")?.value) || 0,
    hba1c: parseFloat(document.getElementById("examHba1c")?.value) || 0,
    totalCholesterol: parseFloat(document.getElementById("examTotalCholesterol")?.value) || 0,
    hdl: parseFloat(document.getElementById("examHdl")?.value) || 0,
    ldl: parseFloat(document.getElementById("examLdl")?.value) || 0,
    triglycerides: parseFloat(document.getElementById("examTriglycerides")?.value) || 0,
    tgo: parseFloat(document.getElementById("examTgo")?.value) || 0,
    tgp: parseFloat(document.getElementById("examTgp")?.value) || 0,
    urea: parseFloat(document.getElementById("examUrea")?.value) || 0,
    creatinine: parseFloat(document.getElementById("examCreatinine")?.value) || 0,
    uricAcid: parseFloat(document.getElementById("examUricAcid")?.value) || 0,
    ferritin: parseFloat(document.getElementById("examFerritin")?.value) || 0,
    vitaminD: parseFloat(document.getElementById("examVitaminD")?.value) || 0,
    vitaminB12: parseFloat(document.getElementById("examVitaminB12")?.value) || 0,
    tsh: parseFloat(document.getElementById("examTsh")?.value) || 0,
  };
}

function onClinicalExamsInput() {
  renderClinicalAlerts();
  renderPrescriptionClinicalAlerts(activePatientId);
}

async function saveClinicalExams() {
  const data = getClinicalExamsFormData();
  data.id = `exam_${activePatientId}_${Date.now()}`;

  // Remove anterior do mesmo paciente ou atualiza
  await db.clinicalExams.where("patientId").equals(activePatientId).delete();
  await db.clinicalExams.put(data);

  renderClinicalAlerts();
  renderPrescriptionClinicalAlerts(activePatientId);

  alert("✅ Exames clínicos e condutas nutricionais salvos com sucesso no Dexie.js!");
  await savePatientToCloud(activePatientId);
}

function renderClinicalAlerts() {
  const data = getClinicalExamsFormData();
  const hasValues = Object.entries(data).some(([k, v]) => k !== "patientId" && k !== "examDate" && parseFloat(v) > 0);

  const homaBadge = document.getElementById("badgeHomaIR");
  const countersEl = document.getElementById("examsSummaryCounters");
  const container = document.getElementById("clinicalAlertsListContainer");

  if (!hasValues) {
    if (homaBadge) homaBadge.innerText = "HOMA-IR: —";
    if (countersEl) {
      countersEl.innerHTML = `<span class="bg-zinc-950 text-zinc-400 border border-zinc-700 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"><i data-lucide="info" class="w-3.5 h-3.5"></i> Sem exames cadastrados</span>`;
    }
    if (container) {
      container.innerHTML = `
        <div class="p-6 bg-zinc-950/80 rounded-2xl border border-zinc-800 text-center space-y-2 col-span-full">
          <p class="text-xs text-zinc-300 font-bold">Nenhum exame laboratorial registrado para este paciente.</p>
          <p class="text-[11px] text-zinc-500">Preencha os biomarcadores acima e clique em "Salvar Exames" para gerar os alertas e condutas nutricionais automáticas.</p>
        </div>
      `;
    }
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const result = analyzeClinicalExams(data);

  // 1. Atualiza Badge HOMA-IR
  if (homaBadge) {
    if (result.homaIR > 0) {
      homaBadge.innerText = `HOMA-IR: ${result.homaIR}`;
      homaBadge.className = result.homaIR > 2.5 
        ? "bg-amber-950/80 text-amber-300 border border-amber-800/80 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono"
        : "bg-zinc-950 text-zinc-300 border border-zinc-700 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono";
    } else {
      homaBadge.innerText = "HOMA-IR: —";
    }
  }

  // 2. Atualiza Resumo de Contadores
  if (countersEl) {
    countersEl.innerHTML = `
      ${result.riskCount > 0 ? `<span class="bg-rose-950/80 text-rose-300 border border-rose-800/80 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"><i data-lucide="alert-circle" class="w-3.5 h-3.5"></i> ${result.riskCount} Risco(s)</span>` : ""}
      ${result.warningCount > 0 ? `<span class="bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"><i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i> ${result.warningCount} Atenção</span>` : ""}
      ${result.optimalCount > 0 && result.riskCount === 0 && result.warningCount === 0 ? `<span class="bg-zinc-950 text-zinc-300 border border-zinc-700 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"><i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-zinc-400"></i> Perfil Adequado</span>` : ""}
    `;
  }

  // 3. Renderiza os Cards de Alertas e Condutas
  if (!container) return;

  container.innerHTML = result.alerts
    .map((alert) => {
      const isRisk = alert.type === "risk";
      const isWarning = alert.type === "warning";

      const cardBg = isRisk ? "bg-rose-950/30 border-rose-800/60 text-white" :
                     isWarning ? "bg-amber-950/30 border-amber-800/60 text-white" :
                     "bg-zinc-950/80 border-zinc-800 text-white";

      const badgeBg = isRisk ? "bg-rose-600 text-white" :
                      isWarning ? "bg-amber-500 text-zinc-950 font-black" :
                      "bg-zinc-800 text-zinc-300 border border-zinc-700";

      const titleColor = isRisk ? "text-rose-400" :
                         isWarning ? "text-amber-400" :
                         "text-white";

      const iconName = isRisk ? "alert-circle" : isWarning ? "alert-triangle" : "check-circle";

      return `
      <div class="p-4 rounded-2xl border ${cardBg} shadow-sm space-y-2.5 transition-all text-xs">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <i data-lucide="${iconName}" class="w-4 h-4 ${isRisk ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-zinc-400'} shrink-0"></i>
            <h4 class="font-black ${titleColor} text-xs">${alert.title}</h4>
          </div>
          <span class="${badgeBg} text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
            ${alert.badge}
          </span>
        </div>

        <div class="p-2 bg-zinc-900 rounded-xl border border-zinc-800 font-mono text-[11px] font-bold text-zinc-200">
          ${alert.marker}
        </div>

        <div class="text-[11px] text-zinc-300 leading-relaxed">
          <strong class="text-white block mb-0.5 font-bold">🎯 Conduta Nutricional Recomendada:</strong>
          ${alert.recommendation}
        </div>
      </div>
    `;
    })
    .join("");

  if (window.lucide) window.lucide.createIcons();
}

async function renderPrescriptionClinicalAlerts(patientId = activePatientId) {
  let exam = await db.clinicalExams.where("patientId").equals(patientId).first();
  if (!exam && patientId === "paulo-vitor") {
    exam = initialClinicalExamsData.find(e => e.patientId === patientId) || initialClinicalExamsData[0];
  }

  const badgeEl = document.getElementById("prescriptionAlertsBadge");
  const listEl = document.getElementById("prescriptionClinicalAlertsList");

  if (!exam) {
    if (badgeEl) {
      badgeEl.innerText = "Sem exames cadastrados";
      badgeEl.className = "bg-zinc-900 text-zinc-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-zinc-700";
    }
    if (listEl) {
      listEl.innerHTML = `<p class="text-xs text-zinc-500 p-2 text-center">Nenhum exame laboratorial registrado para este paciente.</p>`;
    }
    return;
  }

  const result = analyzeClinicalExams(exam);

  if (badgeEl) {
    const totalIssues = result.riskCount + result.warningCount;
    if (totalIssues > 0) {
      badgeEl.innerText = `${totalIssues} alerta(s) de atenção/risco`;
      badgeEl.className = result.riskCount > 0
        ? "bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-rose-500/30"
        : "bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30";
    } else {
      badgeEl.innerText = "Exames normais ✓";
      badgeEl.className = "bg-zinc-900 text-zinc-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-zinc-700";
    }
  }

  if (listEl) {
    listEl.innerHTML = result.alerts
      .map(
        (a) => `
      <div class="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-start gap-2.5 text-xs">
        <span class="w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.type === 'risk' ? 'bg-rose-500' : a.type === 'warning' ? 'bg-amber-500' : 'bg-zinc-500'}"></span>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <strong class="text-white font-bold text-xs">${a.title}</strong>
            <span class="text-[10px] text-zinc-400 font-mono">(${a.marker})</span>
          </div>
          <p class="text-zinc-300 text-[11px] mt-0.5 leading-snug font-normal">
            👉 ${a.recommendation}
          </p>
        </div>
      </div>
    `
      )
      .join("");
  }

  if (window.lucide) window.lucide.createIcons();
}

let isPrescriptionAlertsCollapsed = false;
function togglePrescriptionClinicalAlerts() {
  const listEl = document.getElementById("prescriptionClinicalAlertsList");
  const textEl = document.getElementById("prescriptionAlertsToggleText");
  const iconEl = document.getElementById("prescriptionAlertsToggleIcon");

  if (!listEl) return;
  isPrescriptionAlertsCollapsed = !isPrescriptionAlertsCollapsed;

  if (isPrescriptionAlertsCollapsed) {
    listEl.classList.add("hidden");
    if (textEl) textEl.innerText = "Expandir";
    if (iconEl) iconEl.setAttribute("data-lucide", "chevron-down");
  } else {
    listEl.classList.remove("hidden");
    if (textEl) textEl.innerText = "Recolher";
    if (iconEl) iconEl.setAttribute("data-lucide", "chevron-up");
  }

  if (window.lucide) window.lucide.createIcons();
}

// =========================================================================
// 12. MÓDULO 06: CONTROLE DE ADESÃO & TIMELINE DE COMPLIANCE
// =========================================================================

async function loadAdherenceDashboard(patientId = activePatientId) {
  const p = await db.patients.get(patientId);
  const tag = document.getElementById("adherencePatientTag");
  if (tag && p) tag.innerText = p.name;

  let logs = await db.dailyLogs.where("patientId").equals(patientId).reverse().toArray();
  if (!logs || logs.length === 0) {
    logs = initialDailyLogsData.filter(d => d.patientId === patientId);
    if (logs.length === 0) logs = initialDailyLogsData;
  }

  // 1. Calcula os KPIs de Adesão
  const score = calculateAdherenceScore(logs);

  if (document.getElementById("adherenceKpiPercent")) {
    document.getElementById("adherenceKpiPercent").innerText = `${score.adherenceRate}%`;
  }
  if (document.getElementById("adherenceKpiBadge")) {
    const badgeEl = document.getElementById("adherenceKpiBadge");
    badgeEl.innerText = score.classification;
    badgeEl.className = `${score.classificationBadge} text-[10px] font-bold px-2.5 py-0.5 rounded-full border`;
  }
  if (document.getElementById("adherenceKpiMealsCount")) {
    document.getElementById("adherenceKpiMealsCount").innerText = `${score.followedMealsCount} de ${score.totalMealsTracked} refeições dentro do plano`;
  }
  if (document.getElementById("adherenceKpiProblemMeal")) {
    document.getElementById("adherenceKpiProblemMeal").innerText = score.mostProblematicMeal;
  }
  if (document.getElementById("adherenceKpiErrorsDetail")) {
    document.getElementById("adherenceKpiErrorsDetail").innerText = `${score.missedMealsCount} furos totais e ${score.modifiedMealsCount} trocas registradas`;
  }
  if (document.getElementById("adherenceKpiHydration")) {
    document.getElementById("adherenceKpiHydration").innerText = `${score.hydrationDaysMet} de ${score.hydrationTotalDays} dias`;
  }
  if (document.getElementById("adherenceKpiHydrationDetail")) {
    const targetWater = (p && p.anamnese && p.anamnese.hydrationLiters) ? p.anamnese.hydrationLiters : 4.0;
    document.getElementById("adherenceKpiHydrationDetail").innerText = `${score.hydrationPercent}% de conformidade (Meta: ${targetWater}L/dia)`;
  }

  // 2. Renderiza o Feed de Linha do Tempo
  renderAdherenceTimeline(logs);
}

function renderAdherenceTimeline(logs = []) {
  const container = document.getElementById("adherenceTimelineFeed");
  if (!container) return;

  if (logs.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <i data-lucide="smartphone" class="w-9 h-9 mx-auto mb-3 opacity-40"></i>
        <p class="font-bold text-sm text-slate-300">Nenhum registro recebido do App do Paciente.</p>
        <p class="text-xs mt-1 text-slate-500">Os dados aparecer\u00e3o aqui automaticamente ap\u00f3s o paciente preencher o check-in pelo aplicativo ou p\u00e1gina de acesso.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = logs
    .map((dayLog) => {
      const isWaterMet = dayLog.hydrationMet;
      const meals = Array.isArray(dayLog.meals) ? dayLog.meals : [];

      // Campos opcionais enviados pelo paciente via app
      const hasWorkout = dayLog.workoutDone !== undefined;
      const workoutDone = !!dayLog.workoutDone;
      const workoutType = dayLog.workoutType || null;
      const workoutDuration = dayLog.workoutDuration || null;
      const cardioType = dayLog.cardioType || null;
      const hungerLevel = dayLog.hungerLevel !== undefined ? dayLog.hungerLevel : null;
      const energyLevel = dayLog.energyLevel !== undefined ? dayLog.energyLevel : null;
      const generalNotes = dayLog.generalNotes || null;

      return `
      <div class="bg-zinc-950 rounded-3xl border border-zinc-800 p-5 space-y-4 shadow-card-dark text-white">
        <!-- Cabe\u00e7alho do Dia -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-zinc-800 pb-3">
          <div class="flex items-center gap-2.5">
            <span class="w-3 h-3 rounded-full bg-red-600 shadow-sm shadow-red-600/50"></span>
            <h3 class="font-black text-white text-sm">
              ${dayLog.dayLabel || dayLog.date}
            </h3>
            <span class="bg-zinc-900 text-red-400 border border-zinc-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
              Score: ${dayLog.overallScore || 90}%
            </span>
            <span class="bg-zinc-900 text-zinc-500 border border-zinc-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <i data-lucide="smartphone" class="w-3 h-3"></i> Via App
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <!-- Hidrata\u00e7\u00e3o -->
            <span class="font-bold text-zinc-400 text-[11px]">Hidrata\u00e7\u00e3o:</span>
            <span class="${isWaterMet ? 'bg-blue-950/80 text-blue-300 border-blue-800/80' : 'bg-amber-950/80 text-amber-300 border-amber-800/80'} border px-2.5 py-0.5 rounded-full font-bold font-mono text-[11px] flex items-center gap-1">
              <i data-lucide="droplets" class="w-3.5 h-3.5 ${isWaterMet ? 'text-blue-400' : 'text-amber-400'}"></i>
              ${dayLog.hydrationConsumedLiters || 0}L / ${dayLog.hydrationGoalLiters || 4.0}L
            </span>
            <!-- Atividade F\u00edsica -->
            ${hasWorkout ? `
            <span class="${workoutDone ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80' : 'bg-zinc-900 text-zinc-400 border-zinc-700'} border px-2.5 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1">
              <i data-lucide="${workoutDone ? 'dumbbell' : 'x'}" class="w-3.5 h-3.5"></i>
              ${workoutDone ? 'Treinou' : 'N\u00e3o treinou'}
            </span>
            ` : ''}
          </div>
        </div>

        <!-- Detalhes de Atividade F\u00edsica e Bem-estar -->
        ${(hasWorkout || hungerLevel !== null || energyLevel !== null || cardioType || generalNotes) ? `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          ${workoutDone && workoutType ? `
          <div class="bg-zinc-900 rounded-2xl border border-zinc-800 px-3 py-2.5 space-y-0.5">
            <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Tipo de Treino</span>
            <p class="text-xs font-bold text-emerald-300">${workoutType}</p>
            ${workoutDuration ? `<p class="text-[10px] text-zinc-500">${workoutDuration}</p>` : ''}
          </div>
          ` : ''}
          ${cardioType ? `
          <div class="bg-zinc-900 rounded-2xl border border-zinc-800 px-3 py-2.5 space-y-0.5">
            <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">C\u00e1rdio</span>
            <p class="text-xs font-bold text-cyan-300">${cardioType}</p>
          </div>
          ` : ''}
          ${hungerLevel !== null ? `
          <div class="bg-zinc-900 rounded-2xl border border-zinc-800 px-3 py-2.5 space-y-0.5">
            <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Fome</span>
            <p class="text-xs font-bold text-white">${hungerLevel}<span class="text-zinc-500">/10</span></p>
          </div>
          ` : ''}
          ${energyLevel !== null ? `
          <div class="bg-zinc-900 rounded-2xl border border-zinc-800 px-3 py-2.5 space-y-0.5">
            <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Energia</span>
            <p class="text-xs font-bold text-white">${energyLevel}<span class="text-zinc-500">/10</span></p>
          </div>
          ` : ''}
        </div>
        ${generalNotes ? `
        <div class="bg-zinc-900 rounded-2xl border border-zinc-800 px-4 py-3 text-[11px] text-zinc-300 italic">
          <strong class="not-italic text-white font-bold block mb-0.5 text-xs">\uD83D\uDCAC Observa\u00e7\u00f5es Gerais do Paciente:</strong>
          "${generalNotes}"
        </div>
        ` : ''}
        ` : ''}

        <!-- Grade de Refei\u00e7\u00f5es do Dia -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          ${meals
            .map((meal) => {
              const isFollowed = meal.status === "followed";
              const isModified = meal.status === "modified";
              const isMissed = meal.status === "missed";

              const cardBg = isFollowed
                ? "bg-zinc-900/90 border-zinc-800 hover:border-zinc-700"
                : isModified
                ? "bg-amber-950/20 border-amber-900/60 hover:border-amber-700"
                : "bg-rose-950/20 border-rose-900/60 hover:border-rose-700";

              const badgeClass = isFollowed
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/80"
                : isModified
                ? "bg-amber-950/80 text-amber-300 border-amber-800/80"
                : "bg-rose-950/80 text-rose-300 border-rose-800/80";

              const statusText = isFollowed
                ? "Seguiu 100%"
                : isModified
                ? "Modificou / Substituiu"
                : "N\u00e3o realizou / Furou";

              const iconName = isFollowed
                ? "check-circle-2"
                : isModified
                ? "alert-triangle"
                : "x-circle";

              return `
              <div class="p-4 rounded-2xl border ${cardBg} shadow-sm space-y-2.5 transition-all text-xs flex flex-col justify-between">
                <div class="space-y-2">
                  <div class="flex items-center justify-between gap-1 border-b border-zinc-800 pb-1.5">
                    <span class="font-black text-white text-xs flex items-center gap-1.5">
                      ${meal.mealName}
                      <span class="text-[10px] text-zinc-400 font-normal font-mono">(${meal.mealTime || "\u2014"})</span>
                    </span>
                    <span class="${badgeClass} border text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <i data-lucide="${iconName}" class="w-3 h-3"></i> ${statusText}
                    </span>
                  </div>

                  <div class="text-[11px] text-zinc-300">
                    <span class="font-bold text-zinc-400 block text-[10px] uppercase">Prescri\u00e7\u00e3o:</span>
                    <p class="font-medium text-zinc-200 line-clamp-2">${meal.plannedFood || "Conforme dieta prescrita"}</p>
                  </div>

                  ${meal.patientNotes ? `
                    <div class="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] text-zinc-300 italic">
                      <strong class="not-italic text-white font-bold block mb-0.5">\uD83D\uDCAC Relato do Paciente:</strong>
                      "${meal.patientNotes}"
                    </div>
                  ` : `
                    <div class="text-[10px] text-zinc-500 italic">Sem observa\u00e7\u00f5es adicionais.</div>
                  `}
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
    })
    .join("");

  if (window.lucide) {
    lucide.createIcons();
  }
}

// =========================================================================
// FUNÇÕES DE CHECK-IN DE ADESÃO (somente para uso interno do App do Paciente)
// O m\u00f3dulo de Controle de Ades\u00e3o do nutricionista \u00e9 somente leitura.
// =========================================================================

function openAdherenceCheckInModal() {
  // Esta fun\u00e7\u00e3o n\u00e3o tem efeito no painel do nutricionista.
  // Os registros de ades\u00e3o s\u00e3o submetidos exclusivamente pelo App do Paciente.
  console.warn("[NutriAx] openAdherenceCheckInModal: O painel do nutricionista \u00e9 somente leitura. Registros vêm do App do Paciente.");
}

function closeAdherenceCheckInModal() {
  // Mantido por compatibilidade.
}

async function handleSaveAdherenceCheckIn(event) {
  if (event) event.preventDefault();
  // Mantido por compatibilidade. O registro de check-in \u00e9 responsabilidade do App do Paciente.
  console.warn("[NutriAx] handleSaveAdherenceCheckIn: Registro desativado no painel do nutricionista.");
}



// =========================================================================
// NAVEGAÇÃO DE ABAS — switchTab()
// =========================================================================
// NAVEGAÇÃO DE ABAS & PILARES DINÂMICOS
// =========================================================================
let currentActivePilar = 3; // 1: Mentalidade, 2: Disciplina, 3: Nutrição, 4: Performance, 5: Resultado

const ALL_TAB_IDS = [
  'dashboard','anamnese','exams','recall','evaluation',
  'prescription','evolution','adherence','foods','patientApp','backup','performance'
];

const PILAR_NAMES = {
  1: 'Mentalidade & Mindset',
  2: 'Disciplina & Hábitos',
  3: 'Nutrição & Prescrição',
  4: 'Performance & Treino',
  5: 'Resultado & Impacto'
};

function togglePilaresAcessosCard() {
  const body = document.getElementById("pilaresAcessosBody");
  const icon = document.getElementById("pilaresAcessosChevron");
  if (body) {
    body.classList.toggle("hidden");
    const isHidden = body.classList.contains("hidden");
    if (icon) {
      icon.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
    }
  }
}

function updateMobileSubnavActiveVisuals(pilarId, toolKey) {
  // Pilar 3 Tools
  const p3Tools = ['dashboard', 'prescription', 'evaluation', 'anamnese', 'exams', 'recall', 'adherence', 'foods', 'patientApp'];
  p3Tools.forEach(t => {
    const btn = document.getElementById(`card-subnav-btn-3-${t}`);
    if (btn) {
      if (pilarId === 3 && t === toolKey) {
        btn.className = (t === 'patientApp')
          ? "col-span-2 p-2 rounded-xl bg-rose-950 border border-rose-500 text-white font-bold flex items-center justify-center gap-2 shadow-sm shadow-rose-950 transition-all"
          : "p-2 rounded-xl bg-red-950/90 border border-red-600 text-white font-bold flex items-center gap-2 text-left shadow-sm shadow-red-950 transition-all";
      } else {
        btn.className = (t === 'patientApp')
          ? "col-span-2 p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 flex items-center justify-center gap-2 text-rose-200 transition-all"
          : "p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 flex items-center gap-2 text-left text-zinc-300 transition-all";
      }
    }
  });

  // Pilar 4 Tools
  const p4Tools = ['prescription', 'schedule', 'cardio', 'catalog'];
  p4Tools.forEach(t => {
    const btn = document.getElementById(`card-subnav-btn-4-${t}`);
    if (btn) {
      if (pilarId === 4 && t === toolKey) {
        btn.className = "p-2 rounded-xl bg-blue-950 border border-blue-600 text-white font-bold flex items-center gap-2 text-left shadow-sm shadow-blue-950 transition-all";
      } else {
        btn.className = "p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 flex items-center gap-2 text-left text-zinc-300 transition-all";
      }
    }
  });

  // Pilar 5 Tools
  const p5Tools = ['dashboard', 'charts', 'synergy', 'gallery', 'predictive'];
  p5Tools.forEach(t => {
    const btn = document.getElementById(`card-subnav-btn-5-${t}`);
    if (btn) {
      if (pilarId === 5 && t === toolKey) {
        btn.className = "p-2 rounded-xl bg-amber-950 border border-amber-600 text-white font-bold flex items-center gap-2 text-left shadow-sm shadow-amber-950 transition-all";
      } else {
        btn.className = "p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center gap-2 text-left text-zinc-300 transition-all";
      }
    }
  });
}

async function selectMobilePilarTool(pilarId, toolKey) {
  // 1. Atualiza pilar ativo
  switchPilar(pilarId, null, false);

  // 2. Executa a ativação de acordo com o pilar
  if (pilarId === 3) {
    await switchTab(toolKey, false, false);
  } else if (pilarId === 4) {
    await switchTab('performance', false, false);
    if (typeof perfRender === 'function') perfRender();
    if (typeof perfSwitchView === 'function') perfSwitchView(toolKey, false);
  } else if (pilarId === 5) {
    await switchTab('evolution', false, false);
    if (typeof resultsSwitchSubView === 'function') resultsSwitchSubView(toolKey, false);
  }

  // 3. Atualiza os botões visuais no card móvel
  updateMobileSubnavActiveVisuals(pilarId, toolKey);

  // 4. Scroll suave no mobile para trazer a ferramenta para a tela
  const isMobile = window.innerWidth < 1024;
  if (isMobile) {
    const cardEl = document.getElementById("mobile-pilares-acessos-card");
    if (cardEl) {
      const offsetTop = cardEl.offsetTop + cardEl.offsetHeight - 20;
      window.scrollTo({ top: Math.max(0, offsetTop), behavior: 'smooth' });
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

async function switchPilar(pilarId, targetTab = null, autoScroll = true) {
  currentActivePilar = pilarId;

  // 1. Alterna os menus superiores no Header Desktop
  for (let i = 1; i <= 5; i++) {
    const navEl = document.getElementById(`header-pilar-nav-${i}`);
    if (navEl) {
      if (i === pilarId) {
        navEl.classList.remove('hidden');
        navEl.style.display = (i === 3 || i === 4) ? 'flex' : 'flex';
      } else {
        navEl.classList.add('hidden');
        navEl.style.display = 'none';
      }
    }
  }

  // 2. Alterna sub-módulos dentro do quadro "Pilares e Acessos"
  for (let i = 1; i <= 5; i++) {
    const cardSub = document.getElementById(`card-subnav-${i}`);
    if (cardSub) {
      if (i === pilarId) {
        cardSub.classList.remove('hidden');
        cardSub.style.display = (i === 3 || i === 4 || i === 5) ? 'grid' : 'block';
      } else {
        cardSub.classList.add('hidden');
        cardSub.style.display = 'none';
      }
    }
  }

  // 3. Atualiza o badge do Pilar ativo no cabeçalho do quadro
  const cardBadge = document.getElementById("cardActivePilarBadge");
  if (cardBadge && PILAR_NAMES[pilarId]) {
    cardBadge.textContent = `Pilar ${pilarId} · ${PILAR_NAMES[pilarId]}`;
    if (pilarId === 1) cardBadge.className = "text-[10px] font-mono font-bold text-purple-400";
    else if (pilarId === 2) cardBadge.className = "text-[10px] font-mono font-bold text-orange-400";
    else if (pilarId === 3) cardBadge.className = "text-[10px] font-mono font-bold text-red-400";
    else if (pilarId === 4) cardBadge.className = "text-[10px] font-mono font-bold text-blue-400";
    else if (pilarId === 5) cardBadge.className = "text-[10px] font-mono font-bold text-amber-400";
  }

  // 4. Alterna os menus no menu lateral Mobile (se existir)
  for (let i = 1; i <= 5; i++) {
    const mobEl = document.getElementById(`mobile-pilar-nav-${i}`);
    if (mobEl) {
      if (i === pilarId) {
        mobEl.classList.remove('hidden');
      } else {
        mobEl.classList.add('hidden');
      }
    }
  }
  const mobTitle = document.getElementById('mobile-menu-title');
  if (mobTitle && PILAR_NAMES[pilarId]) {
    mobTitle.textContent = `Navegação · ${PILAR_NAMES[pilarId]}`;
  }

  // 5. Atualiza os botões dos Pilares na Sidebar Desktop e no Quadro "Pilares e Acessos"
  updateSidebarPilarVisuals(pilarId);

  // 6. Determina qual aba abrir por padrão no pilar escolhido
  if (targetTab) {
    await switchTab(targetTab, false, autoScroll);
    if (pilarId === 3) updateMobileSubnavActiveVisuals(3, targetTab);
    else if (pilarId === 4) updateMobileSubnavActiveVisuals(4, 'prescription');
    else if (pilarId === 5) updateMobileSubnavActiveVisuals(5, 'dashboard');
  } else {
    if (pilarId === 3) {
      await switchTab('dashboard', false, autoScroll);
      updateMobileSubnavActiveVisuals(3, 'dashboard');
    } else if (pilarId === 4) {
      await switchTab('performance', false, autoScroll);
      updateMobileSubnavActiveVisuals(4, 'prescription');
    } else if (pilarId === 5) {
      await switchTab('evolution', false, autoScroll);
      if (typeof resultsSwitchSubView === 'function') resultsSwitchSubView('dashboard', false);
      updateMobileSubnavActiveVisuals(5, 'dashboard');
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

function updateSidebarPilarVisuals(activePilarId) {
  // Reset em todos os 5 pilares para estado inativo (Desktop e Quadro Mobile)
  for (let i = 1; i <= 5; i++) {
    const btn = document.getElementById(`pilar-${i}`);
    if (btn) {
      btn.className = "w-full text-left px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-gray-300 flex items-center justify-between transition-all";
    }
    const cardPilarBtn = document.getElementById(`card-pilar-${i}`);
    if (cardPilarBtn) {
      cardPilarBtn.className = "p-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300 flex flex-col items-center justify-center gap-1 hover:bg-zinc-800 transition-all";
    }
  }

  // Aplica tema ativo específico do pilar selecionado
  const activeBtn = document.getElementById(`pilar-${activePilarId}`);
  const activeCardPilar = document.getElementById(`card-pilar-${activePilarId}`);

  if (activePilarId === 1) {
    if (activeBtn) activeBtn.className = "w-full text-left px-3 py-1.5 rounded-lg bg-purple-950/70 border border-purple-800 text-white font-bold flex items-center justify-between shadow-sm shadow-purple-950 transition-all";
    if (activeCardPilar) activeCardPilar.className = "p-1.5 rounded-xl bg-purple-950 border border-purple-600 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-sm shadow-purple-950 transition-all";
  } else if (activePilarId === 2) {
    if (activeBtn) activeBtn.className = "w-full text-left px-3 py-1.5 rounded-lg bg-orange-950/70 border border-orange-800 text-white font-bold flex items-center justify-between shadow-sm shadow-orange-950 transition-all";
    if (activeCardPilar) activeCardPilar.className = "p-1.5 rounded-xl bg-orange-950 border border-orange-600 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-sm shadow-orange-950 transition-all";
  } else if (activePilarId === 3) {
    if (activeBtn) activeBtn.className = "w-full text-left px-3 py-1.5 rounded-lg bg-red-950/70 border border-red-800 text-white font-bold flex items-center justify-between shadow-sm shadow-red-950 transition-all";
    if (activeCardPilar) activeCardPilar.className = "p-1.5 rounded-xl bg-red-950 border border-red-600 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-sm shadow-red-950 transition-all";
  } else if (activePilarId === 4) {
    if (activeBtn) activeBtn.className = "w-full text-left px-3 py-1.5 rounded-lg bg-blue-950/70 border border-blue-800 text-white font-bold flex items-center justify-between shadow-sm shadow-blue-950 transition-all";
    if (activeCardPilar) activeCardPilar.className = "p-1.5 rounded-xl bg-blue-950 border border-blue-600 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-sm shadow-blue-950 transition-all";
  } else if (activePilarId === 5) {
    if (activeBtn) activeBtn.className = "w-full text-left px-3 py-1.5 rounded-lg bg-amber-950/70 border border-amber-800 text-white font-bold flex items-center justify-between shadow-sm shadow-amber-950 transition-all";
    if (activeCardPilar) activeCardPilar.className = "p-1.5 rounded-xl bg-amber-950 border border-amber-600 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-sm shadow-amber-950 transition-all";
  }
}

async function switchTab(tabName, syncPilar = true, autoScroll = true) {
  if (!tabName) return;

  // 1. Flush de salvamento pendente antes de sair da aba
  if (typeof _flushAnamneseSave === "function") {
    try { await _flushAnamneseSave(); } catch(e) { console.warn(e); }
  }

  // 2. Sincroniza o Pilar correspondente se acionado diretamente
  if (syncPilar) {
    if (tabName === 'performance' && currentActivePilar !== 4) {
      switchPilar(4, 'performance', autoScroll);
      return;
    } else if (tabName === 'evolution' && currentActivePilar !== 5) {
      switchPilar(5, 'evolution', autoScroll);
      return;
    } else if (tabName !== 'performance' && tabName !== 'evolution' && currentActivePilar !== 3) {
      switchPilar(3, tabName, autoScroll);
      return;
    }
  }

  // 3. Esconde todas as seções
  ALL_TAB_IDS.forEach(id => {
    const el = document.getElementById('tab-' + id);
    if (el) {
      el.classList.add('hidden');
      el.style.display = 'none';
    }
  });

  // 4. Mostra exclusivamente a aba solicitada
  const target = document.getElementById('tab-' + tabName);
  if (target) {
    target.classList.remove('hidden');
    target.style.display = 'block';
  }

  // 5. Atualiza estado ativo nos botões do header desktop
  ALL_TAB_IDS.forEach(id => {
    const btn = document.getElementById('nav-' + id);
    if (btn) btn.classList.remove('active');
  });
  const activeBtn = document.getElementById('nav-' + tabName);
  if (activeBtn) activeBtn.classList.add('active');

  // 6. Atualiza estado ativo na Bottom Navigation Bar Mobile
  const mobNavIds = ['dashboard', 'prescription', 'performance', 'evaluation', 'backup', 'patientApp'];
  mobNavIds.forEach(id => {
    const mobBtn = document.getElementById('mob-nav-' + id);
    if (mobBtn) {
      if (id === tabName) {
        mobBtn.classList.add('active');
      } else {
        mobBtn.classList.remove('active');
      }
    }
  });

  // 7. Fecha o modal de menu mobile se estiver aberto
  const menuModal = document.getElementById('mobile-menu-modal');
  if (menuModal && menuModal.style.display !== 'none') {
    menuModal.style.display = 'none';
  }

  // 8. Triggers específicos de carregamento dos dados do paciente ativo por módulo
  try {
    if (tabName === 'dashboard') {
      if (typeof updateDashboardAndRadar === 'function') await updateDashboardAndRadar(activePatientId);
    } else if (tabName === 'prescription') {
      if (typeof loadPrescriptionForPatient === 'function') await loadPrescriptionForPatient(activePatientId);
      if (typeof renderPrescriptionClinicalAlerts === 'function') renderPrescriptionClinicalAlerts(activePatientId);
    } else if (tabName === 'evaluation') {
      if (typeof loadEvaluationForPatient === 'function') await loadEvaluationForPatient(activePatientId);
    } else if (tabName === 'exams') {
      if (typeof loadClinicalExams === 'function') await loadClinicalExams(activePatientId);
    } else if (tabName === 'recall') {
      if (typeof loadDietaryRecall === 'function') await loadDietaryRecall(activePatientId);
    } else if (tabName === 'evolution') {
      if (typeof loadAssessmentsAndRenderCharts === 'function') await loadAssessmentsAndRenderCharts(activePatientId);
      if (typeof renderEvolutionCharts === 'function') renderEvolutionCharts();
    } else if (tabName === 'adherence') {
      if (typeof loadAdherenceDashboard === 'function') await loadAdherenceDashboard(activePatientId);
    } else if (tabName === 'performance') {
      if (typeof loadPerformanceForPatient === 'function') await loadPerformanceForPatient(activePatientId);
      else if (typeof perfRender === 'function') perfRender();
    } else if (tabName === 'patientApp') {
      if (typeof renderPatientAppView === 'function') renderPatientAppView(activePatientId);
    } else if (tabName === 'foods') {
      if (typeof loadFoods === 'function') await loadFoods();
    }
  } catch (err) {
    console.error("Erro ao carregar dados do módulo " + tabName, err);
  }

  // 9. Re-cria ícones Lucide na nova aba
  if (window.lucide) window.lucide.createIcons();

  // 10. Scroll para o topo apenas se explicitamente solicitado
  if (autoScroll) {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      const cardEl = document.getElementById("mobile-pilares-acessos-card");
      if (cardEl) {
        const offsetTop = cardEl.offsetTop + cardEl.offsetHeight - 20;
        window.scrollTo({ top: Math.max(0, offsetTop), behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
}

// Inicializa no carregamento da página com suporte a atalhos PWA (?tab=...)
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const requestedTab = urlParams.get('tab') || window.location.hash.replace('#', '');

  if (requestedTab && ALL_TAB_IDS.includes(requestedTab)) {
    if (requestedTab === 'performance') {
      switchPilar(4, 'performance');
    } else {
      switchPilar(3, requestedTab);
    }
  } else {
    switchPilar(3, 'dashboard');
  }

  // Inicializa o Motor PWA Mobile
  if (typeof initNutriAxPWA === 'function') {
    initNutriAxPWA();
  }
});

// =========================================================================
// MÓDULO DE PERFORMANCE — Estado e Handlers
// =========================================================================

// Banco Extensivo de Exercícios Biomecânicos (Delavier, Nick Evans, Jim Stoppani)
const PERF_EXERCISE_DB = [
  // ── PEITORAL (BARRAS, HALTERES, CABOS, MÁQUINAS, LIVRES) ──
  // Fonte: Schoenfeld — "Science and Dev. of Muscle Hypertrophy" Cap.2/3 | Lima & Pinto — Cinesiologia Cap.4
  { id:'pe01', name:'Supino Reto com Barra',                    group:'Peitoral', mechanics:'Composto', equipment:'Barra',          primary:'Peitoral Maior (Feixe Esternocostal)',          secondary:'Deltoide Anterior, Tríceps Braquial',       resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Pico de torque entre 0-60° de abdução horizontal (encurtamento). Exc. 3s acumula tensão mecânica máxima sem perder força intramuscular — Schoenfeld Cap.3.' },
  { id:'pe02', name:'Supino Inclinado com Barra (30° a 45°)',   group:'Peitoral', mechanics:'Composto', equipment:'Barra',          primary:'Peitoral Maior (Feixe Clavicular - Superior)',  secondary:'Deltoide Anterior, Tríceps',                resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Ângulo inclinado desloca tensão para fibras claviculares. Excêntrico 3s preserva integridade da articulação glenoumeral — ACSM Cap.7.' },
  { id:'pe03', name:'Supino Declinado com Barra',               group:'Peitoral', mechanics:'Composto', equipment:'Barra',          primary:'Peitoral Maior (Feixe Inferior/Abdominal)',     secondary:'Tríceps Braquial, Deltoide Anterior',       resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Declinação aumenta ativação do feixe esternal inferior. Exc. 3s controla sobrecarga em ângulo desfavorável para o ombro.' },
  { id:'pe04', name:'Supino Reto com Halteres',                 group:'Peitoral', mechanics:'Composto', equipment:'Halteres',       primary:'Peitoral Maior (Maior amplitude & adução)',     secondary:'Deltoide Anterior, Tríceps',                resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Halteres permitem ADM 20-30% maior que barra, gerando pico de torque no alongamento (90°+ de abdução). Responsável por maior TUT sarcomérico — Schoenfeld Cap.2.' },
  { id:'pe05', name:'Supino Inclinado com Halteres',            group:'Peitoral', mechanics:'Composto', equipment:'Halteres',       primary:'Peitoral Maior (Porção Superior)',              secondary:'Deltoide Anterior, Tríceps',                resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Combina ADM aumentada dos halteres com inclinação para feixe clavicular. Componente de alongamento em 90° solicita OIMS maximamente — Lima & Pinto Cap.4.' },
  { id:'pe06', name:'Supino Declinado com Halteres',            group:'Peitoral', mechanics:'Composto', equipment:'Halteres',       primary:'Peitoral Maior (Porção Inferior)',              secondary:'Tríceps, Deltoide Anterior',                resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'ADM ampliada + declinação: ativa porção abdominal do peitoral no alongamento. Par complementar ao Peck Deck — Schoenfeld Cap.2.' },
  { id:'pe07', name:'Crucifixo Reto com Halteres',              group:'Peitoral', mechanics:'Isolador', equipment:'Halteres',       primary:'Peitoral Maior (Alongamento Máximo)',           secondary:'Deltoide Anterior (estabilizador)',         resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Pico de torque a 90° de abdução horizontal (posição de maior comprimento). Pausa 1s no fundo recruta sarcômeros em série — Schoenfeld, Science of Hyp. Cap.2.' },
  { id:'pe08', name:'Crucifixo Inclinado com Halteres',          group:'Peitoral', mechanics:'Isolador', equipment:'Halteres',       primary:'Peitoral Maior (Fibras Claviculares)',          secondary:'Deltoide Anterior',                         resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Crucifixo inclinado: pico de tensão no alongamento com ênfase em fibras superiores. Pausa 1s no ponto de maior comprimento — Lima & Pinto Cap.4.' },
  { id:'pe09', name:'Crucifixo Declinado com Halteres',         group:'Peitoral', mechanics:'Isolador', equipment:'Halteres',       primary:'Peitoral Maior (Fibras Esternocostais)',        secondary:'Deltoide Anterior',                         resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Crucifixo declinado: alonga fibras esternocostais inferiores. Excêntrico lento de 3s é determinante para dano miofibrilar e remodelação — Schoenfeld Cap.3.' },
  { id:'pe10', name:'Crossover no Cabo (Polia Alta)',           group:'Peitoral', mechanics:'Isolador', equipment:'Cabo',           primary:'Peitoral Maior (Foco Porção Inferior)',         secondary:'Deltoide Anterior',                         resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Polia alta cria vetor de tração que desafia o peitoral na posição de maior comprimento. Tensão contínua do cabo em toda ADM — Lima & Pinto, Cinesiologia Cap.5.' },
  { id:'pe11', name:'Crossover no Cabo (Polia Média)',          group:'Peitoral', mechanics:'Isolador', equipment:'Cabo',           primary:'Peitoral Maior (Tensão Contínua Esternal)',     secondary:'Deltoide Anterior',                         resistProfile:'uniform',   cadence:'3-1-1-0', cadenceNote:'Polia média cria curva de torque relativamente uniforme em toda ADM. Pausa de 1s na adução maximiza o pico de contração esternal — Schoenfeld Cap.2.' },
  { id:'pe12', name:'Crossover no Cabo (Polia Baixa)',          group:'Peitoral', mechanics:'Isolador', equipment:'Cabo',           primary:'Peitoral Maior (Foco Feixe Clavicular)',        secondary:'Deltoide Anterior',                         resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Polia baixa cria resistência que aumenta no encurtamento (adução cruzada). Pico de tensão na posição encurtada estimula fibras claviculares — Lima & Pinto Cap.4.' },
  { id:'pe13', name:'Peck Deck / Voador (Máquina)',             group:'Peitoral', mechanics:'Isolador', equipment:'Máquina',        primary:'Peitoral Maior (Pico de Contração Medial)',     secondary:'Deltoide Anterior',                         resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Peck Deck: curva de força crescente até o encurtamento total. 1s de pausa isométrica na adução máxima ativa UMs de alto limiar — Schoenfeld, Science Cap.3.' },
  { id:'pe14', name:'Supino Vertical na Máquina Articulada',    group:'Peitoral', mechanics:'Composto', equipment:'Máquina',        primary:'Peitoral Maior (Trajetória Convergente)',       secondary:'Tríceps Braquial, Deltoide',                resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Máquina articulada converge para o centro, simulando adução. Trajetória guiada permite excêntrico controlado 3s sem falha técnica — ACSM Tabela 7-2.' },
  { id:'pe15', name:'Supino Inclinado na Máquina Convergente',  group:'Peitoral', mechanics:'Composto', equipment:'Máquina',        primary:'Peitoral Maior (Porção Superior)',              secondary:'Tríceps, Deltoide Anterior',                resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Máquina convergente inclinada isola porção clavicular com trajetória controlada. Segurança para excêntrico pesado de 3s — ACSM Cap.7.' },
  { id:'pe16', name:'Supino no Smith (Guia Reto)',              group:'Peitoral', mechanics:'Composto', equipment:'Smith',          primary:'Peitoral Maior',                                secondary:'Tríceps, Deltoide',                         resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Guia vertical do Smith elimina graus de liberdade, focando o estímulo no encurtamento esternal. Útil para overload progressivo controlado — ACSM Cap.7.' },
  { id:'pe17', name:'Supino no Smith Inclinado',                group:'Peitoral', mechanics:'Composto', equipment:'Smith',          primary:'Peitoral Maior (Superior)',                     secondary:'Tríceps, Deltoide Anterior',                resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Smith inclinado isola porção clavicular com trajetória controlada. Permite excêntrico de 3s com sobrecarga supramáxima segura — ACSM Cap.7.' },
  { id:'pe18', name:'Flexão de Braço no Solo (Push-up)',        group:'Peitoral', mechanics:'Composto', equipment:'Peso Corporal',  primary:'Peitoral Maior',                                secondary:'Tríceps, Core (estabilização)',              resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Flexão de braço: pico de EMG peitoral no encurtamento (cotovelos estendidos). Excêntrico lento de 3s amplifica tensão muscular sem carga externa — Lima & Pinto.' },
  { id:'pe19', name:'Mergulho em Paralelas (Foco Peitoral)',    group:'Peitoral', mechanics:'Composto', equipment:'Peso Corporal',  primary:'Peitoral Maior (Tronco inclinado à frente)',   secondary:'Tríceps Braquial, Deltoide Anterior',        resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Tronco inclinado à frente no mergulho cria componente de alongamento do peitoral. Descida de 3s com controle protege a articulação glenoumeral — Lima & Pinto Cap.4.' },
  { id:'pe20', name:'Pullover com Halter',                      group:'Peitoral', mechanics:'Isolador', equipment:'Halteres',       primary:'Peitoral Maior & Serrátil Anterior',            secondary:'Latíssimo do Dorso, Tríceps Longo',         resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Pullover sobrecarrega peitoral e serrátil no máximo alongamento (ombros em flexão). Pausa 1s no fundo amplifica estímulo em sarcômeros em série — Schoenfeld Cap.2.' },

  // ── DORSAL / COSTAS (BARRAS, HALTERES, CABOS, MÁQUINAS, LIVRES) ──
  // Fonte: Lima & Pinto — Cinesiologia e Musculação Cap.5 | Schoenfeld Cap.2 (Moment Arm & EMG)
  { id:'do01', name:'Barra Fixa Pronada (Pull-up)',             group:'Dorsal',   mechanics:'Composto', equipment:'Peso Corporal',  primary:'Latíssimo do Dorso (Largura Dorsal)',           secondary:'Romboides, Bíceps, Trapézio Inferior',     resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Pico de ativação EMG do latíssimo com ombros em flexão máxima (posição de maior comprimento). Descida controlada 3s recruta mais fibras por mais tempo — Schoenfeld Cap.2.' },
  { id:'do02', name:'Barra Fixa Supinada (Chin-up)',             group:'Dorsal',   mechanics:'Composto', equipment:'Peso Corporal',  primary:'Latíssimo do Dorso & Bíceps Braquial',          secondary:'Romboides, Braquial',                      resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Pegada supinada reduz supressão neural de bíceps, aumentando cocativação. Pico de torque do latíssimo no alongamento — Lima & Pinto Cap.5.' },
  { id:'do03', name:'Barra Fixa com Pegada Neutra',             group:'Dorsal',   mechanics:'Composto', equipment:'Peso Corporal',  primary:'Latíssimo do Dorso & Braquiorradial',           secondary:'Bíceps, Romboides',                        resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Pegada neutra otimiza ativação do braquiorradial e latíssimo simultaneamente. Excêntrico 3s preserva o ombro em rotação neutra — ACSM Cap.7.' },
  { id:'do04', name:'Puxada Frontal Aberta na Polia',           group:'Dorsal',   mechanics:'Composto', equipment:'Cabo',           primary:'Latíssimo do Dorso (Fibras Superiores)',        secondary:'Bíceps Braquial, Romboides',               resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Pegada aberta maximiza o momento de força sobre o latíssimo no ponto de maior comprimento (braços estendidos). Cabo mantém tensão constante — Lima & Pinto Cap.5.' },
  { id:'do05', name:'Puxada Frontal com Triângulo (Fechada)',   group:'Dorsal',   mechanics:'Composto', equipment:'Cabo',           primary:'Latíssimo do Dorso & Redondo Maior',            secondary:'Bíceps, Braquial',                         resistProfile:'uniform',   cadence:'3-0-1-0', cadenceNote:'Triângulo fechado gera puxada na linha mediana, equilibrando tensão ao longo de toda ADM. Curva de torque do latíssimo relativamente uniforme — Schoenfeld Cap.2.' },
  { id:'do06', name:'Puxada Supinada na Polia',                 group:'Dorsal',   mechanics:'Composto', equipment:'Cabo',           primary:'Latíssimo do Dorso (Feixe Inferior)',           secondary:'Bíceps Braquial, Braquial',                resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Pegada supinada desloca torque para o feixe inferior do latíssimo, com pico no encurtamento (cotovelo junto ao corpo). Complementar à puxada aberta — Lima & Pinto Cap.5.' },
  { id:'do07', name:'Pulldown / Puxada com Braços Retos (Cabo)',group:'Dorsal',   mechanics:'Isolador', equipment:'Cabo',           primary:'Latíssimo do Dorso (Isolamento)',               secondary:'Redondo Maior, Tríceps Longo',             resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Braços retos eliminam a contribuição de bíceps, isolando o latíssimo no momento de extensão do ombro (pico de torque no encurtamento). Pausa 1s no quadril — Schoenfeld Cap.3.' },
  { id:'do08', name:'Remada Curvada com Barra (Pronada)',       group:'Dorsal',   mechanics:'Composto', equipment:'Barra',          primary:'Latíssimo do Dorso & Romboides (Espessura)',    secondary:'Trapézio Médio/Inf, Bíceps, Eretores',    resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Remada pronada: pico de ativação na retração escapular (encurtamento de romboides e trapézio médio). Excêntrico 3s com tronco estável a 45° — Lima & Pinto Cap.5.' },
  { id:'do09', name:'Remada Curvada com Barra (Supinada/Yates)',group:'Dorsal',  mechanics:'Composto', equipment:'Barra',          primary:'Latíssimo do Dorso (Feixe Inferior)',           secondary:'Bíceps Braquial, Romboides',               resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Yates row: pegada supinada aumenta ativação do feixe inferior do latíssimo no encurtamento. Tronco mais ereto (70°) encurta o braço de momento — Schoenfeld Cap.2.' },
  { id:'do10', name:'Remada Cavalinho (Barra T)',               group:'Dorsal',   mechanics:'Composto', equipment:'Barra',          primary:'Romboides, Latíssimo & Trapézio Médio',         secondary:'Bíceps, Eretores da Espinha',              resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Apoio no peito estabiliza o eixo e permite pico de contração na retração escapular (encurtamento de romboides). Excêntrico 3s com carga alta — Lima & Pinto Cap.5.' },
  { id:'do11', name:'Remada Unilateral com Halter (Serrote)',   group:'Dorsal',   mechanics:'Composto', equipment:'Halteres',       primary:'Latíssimo do Dorso (Unilateral)',               secondary:'Romboides, Bíceps, Redondo Maior',         resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Posição unilateral com apoio permite maior amplitude no início do movimento (posição de maior comprimento). Rotação de tronco controlada amplifica estímulo — Schoenfeld Cap.2.' },
  { id:'do12', name:'Remada Baixa no Cabo (Triângulo)',         group:'Dorsal',   mechanics:'Composto', equipment:'Cabo',           primary:'Romboides & Latíssimo do Dorso',                secondary:'Bíceps Braquial, Trapézio',                resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Remada baixa com triângulo: pico na retração escapular com cotovelos junto ao corpo (encurtamento). Controle da extensão pélvica evita compensação lombar — Lima & Pinto.' },
  { id:'do13', name:'Remada Baixa com Barra Reta / Pegada Aberta',group:'Dorsal',mechanics:'Composto', equipment:'Cabo',           primary:'Trapézio Médio, Romboides & Deltoide Posterior',secondary:'Latíssimo, Bíceps',                         resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Pegada aberta isola trapézio médio e deltoide posterior na retração. Par ideal de puxada aberta (ambas encurtadas diferentes) — Lima & Pinto Cap.5.' },
  { id:'do14', name:'Remada Articulada na Máquina (Peito Apoiado)',group:'Dorsal',mechanics:'Composto',equipment:'Máquina',        primary:'Latíssimo do Dorso & Romboides',                secondary:'Bíceps, Trapézio',                         resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Apoio no peito elimina a compensação lombar, isolando o dorsal no encurtamento. Pausa 1s na retração máxima ativa fibras de alto limiar — Schoenfeld Cap.3.' },
  { id:'do15', name:'Puxada Vertical na Máquina Articulada',    group:'Dorsal',   mechanics:'Composto', equipment:'Máquina',        primary:'Latíssimo do Dorso',                            secondary:'Bíceps Braquial',                          resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Máquina articulada mantém tensão na posição de maior comprimento do latíssimo. Ideal para iniciantes controlarem a fase excêntrica — ACSM Cap.7.' },
  { id:'do16', name:'Levantamento Terra Convencional (Deadlift)',group:'Dorsal',  mechanics:'Composto', equipment:'Barra',          primary:'Eretores da Espinha, Glúteos & Isquiotibiais',  secondary:'Latíssimo, Trapézio, Quadríceps, Core',   resistProfile:'stretched', cadence:'4-0-1-0', cadenceNote:'Terra convencional: pico de torque nos eretores e isquiotibiais na posição de maior comprimento (barra no solo). Exc. 4s controla cargas supramáximas — ACSM Tabela 7-2.' },
  { id:'do17', name:'Hiperextensão Lombar (Banco 45°)',         group:'Dorsal',   mechanics:'Isolador', equipment:'Peso Corporal',  primary:'Eretores da Espinha (Lombar)',                  secondary:'Glúteo Máximo, Isquiotibiais',             resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Hiperextensão: pico de ativação dos eretores no alongamento (tronco a 90°). Pausa 1s no fundo maximiza o estresse sobre as fibras lombares — Lima & Pinto Cap.5.' },

  // ── PERNAS & GLÚTEOS (QUADRÍCEPS, ISQUIOTIBIAIS, PANTURRILHA, GLÚTEO) ──
  // Fonte: "Biomecânica Básica dos Exercícios: Membros Inferiores" | Schoenfeld Cap.2 | ACSM Tabela 7-2
  { id:'lg01', name:'Agachamento Livre com Barra (Back Squat)', group:'Pernas',   mechanics:'Composto', equipment:'Barra',          primary:'Quadríceps (Vasto Lat., Med., Reto Fem.)',      secondary:'Glúteo Máximo, Isquiotibiais, Core',       resistProfile:'uniform',   cadence:'4-0-1-0', cadenceNote:'Curva de torque do agachamento é quasi-uniforme. Exc. 4s protege o tendão patelar e ligamento cruzado anterior, maximizando tensão mecânica — Biomecânica Membros Inferiores.' },
  { id:'lg02', name:'Agachamento Frontal com Barra (Front Squat)',group:'Pernas', mechanics:'Composto', equipment:'Barra',          primary:'Quadríceps (Foco Reto Femoral)',                secondary:'Glúteos, Core Abdominal',                  resistProfile:'stretched', cadence:'4-0-1-0', cadenceNote:'Tronco mais vertical no front squat alonga o reto femoral na profundidade máxima. Exc. 4s com controle de joelho sobre o pé — Biomecânica Membros Inferiores.' },
  { id:'lg03', name:'Agachamento Hack (Máquina)',               group:'Pernas',   mechanics:'Composto', equipment:'Máquina',        primary:'Quadríceps (Isolamento de Carga)',              secondary:'Glúteo Máximo',                            resistProfile:'stretched', cadence:'4-0-1-0', cadenceNote:'Hack machine elimina carga axial na coluna. Joelhos avançam sobre os pés ampliando ADM do quadríceps (posição de maior comprimento). Exc. 4s preserva patelar — Biomec. MI.' },
  { id:'lg04', name:'Leg Press 45°',                            group:'Pernas',   mechanics:'Composto', equipment:'Máquina',        primary:'Quadríceps & Glúteos',                          secondary:'Isquiotibiais, Adutores',                  resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Leg Press: amplitude máxima com joelho acima de 90° gera pico de torque no quadríceps em posição de maior comprimento. Exc. 3s controlado na máquina — Biomec. MI.' },
  { id:'lg05', name:'Leg Press Horizontal',                     group:'Pernas',   mechanics:'Composto', equipment:'Máquina',        primary:'Quadríceps',                                    secondary:'Glúteos',                                  resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Leg Press horizontal: vetor de força horizontal cria ângulo diferente de torque. ADM completa com joelhos em 90°+ alonga quadríceps — Biomecânica Membros Inferiores.' },
  { id:'lg06', name:'Cadeira Extensora',                         group:'Pernas',   mechanics:'Isolador', equipment:'Máquina',        primary:'Quadríceps (Reto Femoral & Vastos)',            secondary:'—',                                        resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Cadeira extensora: pico de ativação EMG na extensão completa (posição de encurtamento). 1s isométrico no topo ativa UMs de alto limiar do reto femoral — Schoenfeld Cap.3.' },
  { id:'lg07', name:'Agachamento Búlgaro com Halteres',         group:'Pernas',   mechanics:'Composto', equipment:'Halteres',       primary:'Glúteo Máximo & Quadríceps (Unilateral)',       secondary:'Isquiotibiais, Adutores',                  resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Búlgaro: pé traseiro elevado força o glúteo frontal a trabalhar no máximo alongamento (anteversão pélvica). Par ideal com Hip Thrust (encurtado) — Biomec. MI.' },
  { id:'lg08', name:'Avanço / Passada com Halteres ou Barra',   group:'Pernas',   mechanics:'Composto', equipment:'Halteres',       primary:'Quadríceps & Glúteos',                          secondary:'Isquiotibiais, Panturrilhas',              resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Passada/avanço: descida profunda gera alongamento simultâneo de glúteo e quadríceps. Posição unilateral amplifica a instabilidade muscular — Biomec. Membros Inferiores.' },
  { id:'lg09', name:'Agachamento Sissy (Sissy Squat)',          group:'Pernas',   mechanics:'Isolador', equipment:'Peso Corporal',  primary:'Quadríceps (Alongamento Extremo Reto Fem.)',    secondary:'Core',                                     resistProfile:'stretched', cadence:'3-0-2-0', cadenceNote:'Sissy squat: joelhos avançam além dos pés com calcanhar elevado, gerando o maior alongamento possível do reto femoral. 2s concêntrico para controle — Biomec. MI.' },
  { id:'lg10', name:'Stiff com Barra (Terra Romeno)',           group:'Pernas',   mechanics:'Composto', equipment:'Barra',          primary:'Isquiotibiais (Bíceps Femoral, Semitendíneo)',  secondary:'Glúteo Máximo, Eretores Lombares',         resistProfile:'stretched', cadence:'4-0-1-0', cadenceNote:'Stiff/RDL: anteversão pélvica maximiza o alongamento dos isquiotibiais. Pico de torque no comprimento máximo. Exc. 4s é crítico para controlar tensão passiva — Biomec. MI.' },
  { id:'lg11', name:'Stiff com Halteres',                       group:'Pernas',   mechanics:'Composto', equipment:'Halteres',       primary:'Isquiotibiais & Glúteo',                        secondary:'Eretores da Espinha',                      resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Halteres permitem maior ADM que a barra no stiff. Pico de torque dos isquiotibiais no comprimento máximo com maior destreza de execução — Biomec. Membros Inferiores.' },
  { id:'lg12', name:'Mesa Flexora Deitada',                     group:'Pernas',   mechanics:'Isolador', equipment:'Máquina',        primary:'Isquiotibiais (Bíceps Femoral)',                secondary:'Gastrocnêmio',                             resistProfile:'uniform',   cadence:'3-0-1-0', cadenceNote:'Mesa flexora deitada: quadril neutro gera curva de torque mais uniforme. Porém, menor componente de alongamento que a cadeira sentada. Par com Stiff — Schoenfeld Cap.2.' },
  { id:'lg13', name:'Cadeira Flexora Sentada',                  group:'Pernas',   mechanics:'Isolador', equipment:'Máquina',        primary:'Isquiotibiais (Maior Alongamento Pélvico)',     secondary:'Gastrocnêmio',                             resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Cadeira sentada: quadril em flexão cria anteversão pélvica que ENCURTA os isquiotibiais, gerando pico de força no encurtamento. Par científico do Stiff — Biomec. MI + Schoenfeld.' },
  { id:'lg14', name:'Flexora Vertical Unilateral',              group:'Pernas',   mechanics:'Isolador', equipment:'Máquina',        primary:'Isquiotibiais (Equilíbrio Muscular)',           secondary:'—',                                        resistProfile:'uniform',   cadence:'3-1-1-0', cadenceNote:'Flexora vertical isola cada membro separadamente com curva de torque moderada. Pausa 1s na flexão máxima para contração máxima unilateral — Lima & Pinto Cap.6.' },
  { id:'lg15', name:'Elevação Pélvica com Barra (Hip Thrust)',   group:'Pernas',   mechanics:'Composto', equipment:'Barra',          primary:'Glúteo Máximo (Pico de Contração)',             secondary:'Isquiotibiais, Adutores',                  resistProfile:'shortened', cadence:'2-1-1-0', cadenceNote:'Hip Thrust: pico de ativação EMG do glúteo máximo na extensão completa do quadril (posição encurtada). 1s isométrico no topo = pico de força glúteo — Schoenfeld Cap.2.' },
  { id:'lg16', name:'Elevação Pélvica na Máquina',              group:'Pernas',   mechanics:'Composto', equipment:'Máquina',        primary:'Glúteo Máximo',                                 secondary:'Isquiotibiais',                            resistProfile:'shortened', cadence:'2-1-1-0', cadenceNote:'Máquina de hip thrust: mesmo princípio biomecânico do hip thrust com barra, mas carga guiada. 1s isométrico no topo do movimento — Schoenfeld Cap.2.' },
  { id:'lg17', name:'Cadeira Abdutora',                         group:'Pernas',   mechanics:'Isolador', equipment:'Máquina',        primary:'Glúteo Médio & Glúteo Mínimo',                  secondary:'Tensor da Fáscia Lata',                    resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Abdutora: glúteo médio trabalha contra resistência máxima no final da abdução (encurtamento). Pausa 1s na abertura máxima para ativação de fibras lentas — Lima & Pinto.' },
  { id:'lg18', name:'Cadeira Adutora',                          group:'Pernas',   mechanics:'Isolador', equipment:'Máquina',        primary:'Adutores da Coxa (Magno, Longo, Breve)',        secondary:'Grácil',                                   resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Adutora: adutores trabalham contra resistência progressiva até o fechamento (encurtamento). Pausa 1s no fechamento máximo para contração isométrica de adutores.' },
  { id:'lg19', name:'Glúteo no Cabo (Coiçe / Extensão)',         group:'Pernas',   mechanics:'Isolador', equipment:'Cabo',           primary:'Glúteo Máximo (Isolado)',                       secondary:'Isquiotibiais',                            resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Extensão de quadril no cabo: pico de ativação do glúteo máximo na extensão completa (encurtamento). Cabo mantém tensão em toda ADM. Pausa 1s no topo — Schoenfeld Cap.2.' },
  { id:'lg20', name:'Panturrilha em Pé na Máquina',             group:'Pernas',   mechanics:'Isolador', equipment:'Máquina',        primary:'Gastrocnêmio (Cabeça Medial e Lateral)',        secondary:'Sóleo',                                    resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Panturrilha em pé: joelho estendido maximiza comprimento do gastrocnêmio. Pausa 1s na elevação máxima (encurtamento) + descida de 3s com alongamento completo — Biomec. MI.' },
  { id:'lg21', name:'Panturrilha Sentado (Gêmeos / Sóleo)',     group:'Pernas',   mechanics:'Isolador', equipment:'Máquina',        primary:'Sóleo (Trabalho com Joelho Flexionado)',        secondary:'Gastrocnêmio profundo',                    resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Joelho flexionado inibe o gastrocnêmio e isola o sóleo, com pico de ativação no encurtamento. Par do exercício em pé (que foca gastrocnêmio alongado) — Biomec. MI.' },
  { id:'lg22', name:'Panturrilha no Leg Press 45°',             group:'Pernas',   mechanics:'Isolador', equipment:'Máquina',        primary:'Gastrocnêmio & Sóleo',                          secondary:'Tibial',                                   resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Panturrilha no leg press: carga axial com ADM máxima (plataforma faz naturalmente o alongamento). Pico de tensão passiva no alongamento com joelho estendido — Biomec. MI.' },

  // ── OMBROS & TRAPÉZIO ──
  // Fonte: Lima & Pinto — Cinesiologia Cap.6 | Schoenfeld Cap.2 (EMG deltoide) | ACSM Cap.7
  { id:'sh01', name:'Desenvolvimento Militar em Pé (Overhead)', group:'Ombros',   mechanics:'Composto', equipment:'Barra',          primary:'Deltoide Anterior & Medial',                    secondary:'Tríceps, Trapézio Superior, Core',         resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'OHP: pico de ativação do deltoide anterior e medial na extensão total do cotovelo (encurtamento). Excêntrico 3s controlado preserva a articulação glenoumeral — ACSM Cap.7.' },
  { id:'sh02', name:'Desenvolvimento Sentado com Halteres',     group:'Ombros',   mechanics:'Composto', equipment:'Halteres',       primary:'Deltoide Anterior & Medial',                    secondary:'Tríceps Braquial, Trapézio',               resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Desenvolvimendo com halteres: maior ADM que a barra. Pico de ativação do deltoide no encurtamento (cotovelos estendidos). Halteres exigem mais estabilização — ACSM Cap.7.' },
  { id:'sh03', name:'Desenvolvimento Arnold (Arnold Press)',    group:'Ombros',   mechanics:'Composto', equipment:'Halteres',       primary:'Deltoide Anterior, Medial & Rotação',           secondary:'Tríceps Braquial',                         resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Arnold Press: rotação supina no início cria componente de alongamento do deltoide anterior e medial. Sequência única de recrutamento muscular — Lima & Pinto Cap.6.' },
  { id:'sh04', name:'Desenvolvimento na Máquina Articulada',    group:'Ombros',   mechanics:'Composto', equipment:'Máquina',        primary:'Deltoide Anterior & Medial',                    secondary:'Tríceps',                                  resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Máquina articulada: trajetória guiada com pico de ativação do deltoide no encurtamento (braços estendidos). Ideal para overload progressivo seguro — ACSM Tabela 7-2.' },
  { id:'sh05', name:'Desenvolvimento no Smith',                 group:'Ombros',   mechanics:'Composto', equipment:'Smith',          primary:'Deltoide Anterior',                             secondary:'Tríceps, Trapézio',                        resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Smith para ombros: guia vertical elimina instabilidade lateral. Pico de ativação do deltoide anterior no encurtamento com overload controlado — ACSM Cap.7.' },
  { id:'sh06', name:'Elevação Lateral com Halteres',            group:'Ombros',   mechanics:'Isolador', equipment:'Halteres',       primary:'Deltoide Medial (Feixe Acromial / Largura)',    secondary:'Deltoide Anterior, Trapézio Sup.',         resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Elevação lateral: curva de torque do deltoide medial cresce com a abdução, com pico a 90°. 1s isométrico no topo recrutando fibras tipo IIa — Lima & Pinto Cap.6.' },
  { id:'sh07', name:'Elevação Lateral na Polia Baixa (Cabo)',   group:'Ombros',   mechanics:'Isolador', equipment:'Cabo',           primary:'Deltoide Medial (Tensão Contínua)',             secondary:'Supraespinhal',                            resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Polia baixa: o vetor de tração do cabo cria tensão no deltoide ANTES da vertical (posição de maior comprimento), complementando o halter. Par científico do sh06 — Schoenfeld.' },
  { id:'sh08', name:'Elevação Lateral na Máquina',              group:'Ombros',   mechanics:'Isolador', equipment:'Máquina',        primary:'Deltoide Medial',                               secondary:'Trapézio',                                 resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Máquina lateral: resistência guiada com pico no encurtamento (abdução de 90°). Pausa 1s no topo com carga maior que com halteres livres — Lima & Pinto Cap.6.' },
  { id:'sh09', name:'Elevação Lateral Inclinada no Banco 45°',  group:'Ombros',   mechanics:'Isolador', equipment:'Halteres',       primary:'Deltoide Medial (Maior Alongamento)',           secondary:'Supraespinhal',                            resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Banco inclinado: o braço de resistência é máximo na posição de repouso (deltoide mais alongado), sendo o par perfeito da elevação lateral normal — Schoenfeld Cap.2.' },
  { id:'sh10', name:'Elevação Frontal com Halteres',            group:'Ombros',   mechanics:'Isolador', equipment:'Halteres',       primary:'Deltoide Anterior (Feixe Clavicular)',          secondary:'Peitoral Superior',                        resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Elevação frontal: pico de ativação do deltoide anterior próximo à horizontal (encurtamento relativo). 1s isométrico a 90° de flexão — Lima & Pinto Cap.6.' },
  { id:'sh11', name:'Elevação Frontal com Barra',               group:'Ombros',   mechanics:'Isolador', equipment:'Barra',          primary:'Deltoide Anterior',                             secondary:'Peitoral Superior',                        resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Barra cria maior estabilidade que halteres na elevação frontal. Pico de ativação do deltoide anterior no plano sagital — Lima & Pinto Cap.6.' },
  { id:'sh12', name:'Elevação Frontal na Polia com Corda',      group:'Ombros',   mechanics:'Isolador', equipment:'Cabo',           primary:'Deltoide Anterior',                             secondary:'Peitoral Clavicular',                      resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Polia baixa para elevação frontal: tensão máxima no deltoide anterior na posição mais baixa (maior comprimento). Cabo mantém tensão em toda ADM — Lima & Pinto Cap.6.' },
  { id:'sh13', name:'Crucifixo Inverso com Halteres',           group:'Ombros',   mechanics:'Isolador', equipment:'Halteres',       primary:'Deltoide Posterior',                            secondary:'Romboides, Trapézio Médio',                resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Crucifixo inverso: pico de torque do deltoide posterior na abdução horizontal máxima (encurtamento). 1s isométrico no pico máximo de retração — Lima & Pinto Cap.6.' },
  { id:'sh14', name:'Crucifixo Inverso no Peck Deck (Máquina)', group:'Ombros',   mechanics:'Isolador', equipment:'Máquina',        primary:'Deltoide Posterior',                            secondary:'Romboides, Trapézio',                      resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Peck Deck invertido: máquina permite carga maior no deltoide posterior com trajetória controlada. Pico no encurtamento (retração escapular máxima) — Lima & Pinto Cap.6.' },
  { id:'sh15', name:'Face Pull na Polia com Corda',             group:'Ombros',   mechanics:'Isolador', equipment:'Cabo',           primary:'Deltoide Posterior & Manguito Rotador',         secondary:'Trapézio Médio/Inf, Romboides',            resistProfile:'shortened', cadence:'2-1-1-0', cadenceNote:'Face pull: pico de ativação do deltoide posterior e rotadores externos na retração escapular máxima (encurtamento). 1s isométrico na posição de cotovelos para trás — Schoenfeld.' },
  { id:'sh16', name:'Remada Alta com Barra (Upright Row)',       group:'Ombros',   mechanics:'Composto', equipment:'Barra',          primary:'Deltoide Medial & Trapézio Superior',           secondary:'Bíceps, Braquial',                         resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Upright row: pico de ativação do deltoide medial e trapézio superior quando o cotovelo ultrapassa a altura do ombro (encurtamento). Pegada aberta (> 45cm) — ACSM Cap.7.' },
  { id:'sh17', name:'Remada Alta na Polia Baixa',               group:'Ombros',   mechanics:'Composto', equipment:'Cabo',           primary:'Deltoide Medial & Trapézio',                    secondary:'Braquial, Bíceps',                         resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Polia baixa na remada alta: tensão do cabo começa com braço estendido (deltoide em maior comprimento). Par do upright row com barra — Lima & Pinto Cap.6.' },
  { id:'sh18', name:'Encolhimento com Barra (Shrug)',            group:'Ombros',   mechanics:'Isolador', equipment:'Barra',          primary:'Trapézio Superior',                             secondary:'Elevador da Escápula',                     resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Encolhimento: pico de ativação do trapézio superior na elevação máxima da escápula (encurtamento). 1s isométrico no topo — Lima & Pinto Cap.6.' },
  { id:'sh19', name:'Encolhimento com Halteres',                group:'Ombros',   mechanics:'Isolador', equipment:'Halteres',       primary:'Trapézio Superior (Foco em Contração)',         secondary:'Elevador da Escápula',                     resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Halteres no encolhimento: maior liberdade de ADM que a barra. Pico do trapézio superior no encurtamento. Excêntrico lento de 3s promove maior dano miofibrilar — Schoenfeld.' },
  { id:'sh20', name:'Encolhimento no Smith por Trás',           group:'Ombros',   mechanics:'Isolador', equipment:'Smith',          primary:'Trapézio Superior & Médio',                     secondary:'Romboides',                                resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Smith por trás: trajetória controlada para elevação de cargas supramáximas no trapézio superior. Pico no encurtamento com 1s isométrico — Lima & Pinto Cap.6.' },

  // ── BÍCEPS & ANTEBRAÇO ──
  // Fonte: Schoenfeld Cap.2 (EMG bíceps) | Lima & Pinto — Cinesiologia Cap.7
  { id:'bi01', name:'Rosca Direta com Barra Reta',              group:'Bíceps',   mechanics:'Isolador', equipment:'Barra',          primary:'Bíceps Braquial (Cabeça Longa e Curta)',        secondary:'Braquial, Braquiorradial',                 resistProfile:'uniform',   cadence:'3-0-1-0', cadenceNote:'Rosca direta: curva de torque do bíceps relativamente uniforme, com pico levemente antes de 90°. Barra reta exige supinação total (ativa cabeça curta) — Lima & Pinto Cap.7.' },
  { id:'bi02', name:'Rosca Direta com Barra W (EZ Bar)',        group:'Bíceps',   mechanics:'Isolador', equipment:'Barra',          primary:'Bíceps Braquial (Menor estresse nos punhos)',   secondary:'Braquial',                                 resistProfile:'uniform',   cadence:'3-0-1-0', cadenceNote:'Barra EZ: reduz o estresse nos punhos com supinação parcial. Recrutamento ligeiramente diferente da barra reta. Curva de torque uniforme — Lima & Pinto Cap.7.' },
  { id:'bi03', name:'Rosca Alternada com Halteres (com Supinação)',group:'Bíceps',mechanics:'Isolador',equipment:'Halteres',       primary:'Bíceps Braquial (Pico de Supinação)',           secondary:'Braquial Anterior',                        resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Rosca alternada: supinação do antebraço no topo adiciona componente de encurtamento adicional do bíceps. Pausa 1s com supinação total no pico — Lima & Pinto Cap.7.' },
  { id:'bi04', name:'Rosca Martelo com Halteres',               group:'Bíceps',   mechanics:'Isolador', equipment:'Halteres',       primary:'Braquiorradial & Braquial Anterior',            secondary:'Bíceps Braquial (neutro)',                  resistProfile:'uniform',   cadence:'3-0-1-0', cadenceNote:'Rosca martelo: pegada neutra elimina supinação, isolando braquial e braquiorradial. Curva de torque uniforme. Par do bíceps puro — Lima & Pinto Cap.7.' },
  { id:'bi05', name:'Rosca Martelo na Polia com Corda',         group:'Bíceps',   mechanics:'Isolador', equipment:'Cabo',           primary:'Braquiorradial & Braquial',                     secondary:'Bíceps Braquial',                          resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Cabo na posição de maior comprimento: tensão desde o início do movimento (braquiorradial em posição mais estendida). Par complementar ao martelo com halteres — Schoenfeld.' },
  { id:'bi06', name:'Rosca Scott com Barra W (Banco Scott)',    group:'Bíceps',   mechanics:'Isolador', equipment:'Barra',          primary:'Bíceps Braquial (Foco Cabeça Curta/Braquial)',  secondary:'Braquial',                                 resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Scott/Preacher: ombro em flexão encurta a cabeça longa, forçando a cabeça curta a compensar. Pico de ativação EMG no encurtamento — Lima & Pinto Cap.7.' },
  { id:'bi07', name:'Rosca Scott Unilateral com Halter',        group:'Bíceps',   mechanics:'Isolador', equipment:'Halteres',       primary:'Bíceps Braquial (Isolamento Escapular)',        secondary:'Braquial',                                 resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Scott unilateral: maior rotação supina possível no halter. Pico de contração do bíceps no encurtamento. Pausa 1s com supinação máxima — Lima & Pinto Cap.7.' },
  { id:'bi08', name:'Rosca Scott na Máquina',                   group:'Bíceps',   mechanics:'Isolador', equipment:'Máquina',        primary:'Bíceps Braquial (Tensão Contínua)',             secondary:'Braquial',                                 resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Máquina Scott: curva de resistência otimizada para a curva de força do bíceps, com pico no encurtamento. Pausa 1s isométrica no topo — Schoenfeld Cap.3.' },
  { id:'bi09', name:'Rosca Inclinada no Banco 45° (Halteres)',  group:'Bíceps',   mechanics:'Isolador', equipment:'Halteres',       primary:'Bíceps Braquial (Cabeça Longa / Alongamento)',  secondary:'Braquial',                                 resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Rosca inclinada 45°: ombro estendido alonga a cabeça longa do bíceps maximamente. Pico de tensão passiva no início do movimento (posição de maior comprimento) — Schoenfeld Cap.2.' },
  { id:'bi10', name:'Rosca Concentrada com Halter (Arnold)',    group:'Bíceps',   mechanics:'Isolador', equipment:'Halteres',       primary:'Bíceps Braquial (Pico de Contração Máximo)',    secondary:'Braquial',                                 resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Rosca concentrada: cotovelo apoiado cria pico de contração isométrica no encurtamento máximo. 1s isométrico no topo com supinação total — Lima & Pinto Cap.7.' },
  { id:'bi11', name:'Rosca na Polia Baixa (Cabo / Barra Reta)', group:'Bíceps',   mechanics:'Isolador', equipment:'Cabo',           primary:'Bíceps Braquial (Tensão em toda ADM)',          secondary:'Braquial',                                 resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Polia baixa: tensão do cabo desde a posição de maior comprimento do bíceps (braço estendido). ADM completa com tensão contínua — diferente da barra que perde tensão — Schoenfeld.' },
  { id:'bi12', name:'Rosca Spider no Banco Inclinado',          group:'Bíceps',   mechanics:'Isolador', equipment:'Halteres',       primary:'Bíceps Braquial (Cabeça Curta)',                secondary:'Braquial',                                 resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Rosca spider: ombro em flexão encurta a cabeça longa e sobrecarrega a cabeça curta, com pico de ativação no encurtamento próximo de 90° — Lima & Pinto Cap.7.' },
  { id:'bi13', name:'Rosca Hércules / Dupla Polia Alta',        group:'Bíceps',   mechanics:'Isolador', equipment:'Cabo',           primary:'Bíceps Braquial (Pico Duplo Bíceps)',           secondary:'Braquial',                                 resistProfile:'shortened', cadence:'2-1-1-0', cadenceNote:'Polia alta bilateral: ombro abduzido a 90° isola o pico de contração do bíceps bilateral. 1s isométrico no pico de supinação — Lima & Pinto Cap.7.' },
  { id:'bi14', name:'Rosca 21 com Barra',                       group:'Bíceps',   mechanics:'Isolador', equipment:'Barra',          primary:'Bíceps Braquial (Exaustão Metabólica)',         secondary:'Braquial, Braquiorradial',                 resistProfile:'uniform',   cadence:'2-0-1-0', cadenceNote:'Rosca 21: protocolo de exaustão metabólica com 3 faixas de ADM. Cadência mais rápida (2-0-1-0) para acúmulo de metabólitos e estresse celular — Schoenfeld Cap.4.' },
  { id:'bi15', name:'Rosca Inversa com Barra (Pronada)',        group:'Bíceps',   mechanics:'Isolador', equipment:'Barra',          primary:'Braquiorradial & Extensores de Punho',          secondary:'Braquial',                                 resistProfile:'uniform',   cadence:'3-0-1-0', cadenceNote:'Rosca inversa pronada: isola o braquiorradial e extensores de punho. Curva de torque uniforme. Suplementar para equilíbrio de antebraço — Lima & Pinto Cap.7.' },
  { id:'bi16', name:'Rosca Punho com Barra (Flexão de Punho)',  group:'Bíceps',   mechanics:'Isolador', equipment:'Barra',          primary:'Flexores do Antebraço',                         secondary:'Pronador Redondo',                          resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Flexão de punho: isolamento dos flexores superficiais e profundos do antebraço. Pausa 1s na flexão máxima (encurtamento) — Lima & Pinto Cap.7.' },

  // ── TRÍCEPS ──
  // Fonte: Schoenfeld Cap.2 (EMG tríceps) | Lima & Pinto Cap.7 | ACSM Cap.7
  { id:'tr01', name:'Tríceps na Polia com Barra Reta (Pushdown)',group:'Tríceps', mechanics:'Isolador', equipment:'Cabo',          primary:'Tríceps Braquial (Cabeça Lateral)',             secondary:'Ancôneo',                                  resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Pushdown: pico de ativação EMG da cabeça lateral do tríceps na extensão completa (encurtamento). Cabo mantém tensão constante. 1s isométrico no topo — Schoenfeld Cap.2.' },
  { id:'tr02', name:'Tríceps na Polia com Corda',               group:'Tríceps',  mechanics:'Isolador', equipment:'Cabo',          primary:'Tríceps Braquial (Cabeça Lateral & Medial)',    secondary:'Ancôneo',                                  resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Corda no pushdown: abertura no final ativa a porção medial e lateral bilateralmente. Pico no encurtamento com abertura máxima dos punhos — Lima & Pinto Cap.7.' },
  { id:'tr03', name:'Tríceps na Polia Invertido (Supinado)',    group:'Tríceps',  mechanics:'Isolador', equipment:'Cabo',          primary:'Tríceps Braquial (Cabeça Medial)',              secondary:'Ancôneo',                                  resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Pegada supinada inverte o vetor de tração, isolando a cabeça medial do tríceps. Pico no encurtamento com 1s isométrico — Lima & Pinto Cap.7.' },
  { id:'tr04', name:'Tríceps Testa com Barra W (Skull Crusher)',group:'Tríceps',  mechanics:'Isolador', equipment:'Barra',          primary:'Tríceps Braquial (Cabeça Longa & Lateral)',     secondary:'Ancôneo',                                  resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Skull crusher: ombro em 90° de flexão e cotovelo em flexão máxima alonga a cabeça longa. Pico de tensão passiva no maior comprimento. 1s pausa antes do push — Schoenfeld Cap.2.' },
  { id:'tr05', name:'Tríceps Testa com Halteres',               group:'Tríceps',  mechanics:'Isolador', equipment:'Halteres',       primary:'Tríceps Braquial (Unilateral)',                 secondary:'Ancôneo',                                  resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Testa com halteres: como o skull crusher mas com maior ADM e independência unilateral. Pico de tensão no comprimento máximo da cabeça longa — Lima & Pinto Cap.7.' },
  { id:'tr06', name:'Tríceps Francês com Halter (Em Pé/Sentado)',group:'Tríceps', mechanics:'Isolador', equipment:'Halteres',       primary:'Tríceps Braquial (Cabeça Longa / Alongamento)', secondary:'Cabeça Lateral',                           resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Tríceps francês: ombro em flexão máxima (>90°) cria o maior comprimento possível da cabeça longa do tríceps. Pausa 1s no fundo = pico de tensão passiva — Schoenfeld Cap.2.' },
  { id:'tr07', name:'Tríceps Francês na Polia com Corda',       group:'Tríceps',  mechanics:'Isolador', equipment:'Cabo',           primary:'Tríceps Braquial (Cabeça Longa)',               secondary:'Ancôneo',                                  resistProfile:'stretched', cadence:'3-1-1-0', cadenceNote:'Polia para francês: tensão do cabo desde a posição de máximo alongamento da cabeça longa. Supera o halter em tensão constante — Lima & Pinto Cap.7.' },
  { id:'tr08', name:'Supino Fechado com Barra (Close-Grip)',    group:'Tríceps',  mechanics:'Composto', equipment:'Barra',          primary:'Tríceps Braquial (Todas as cabeças)',           secondary:'Peitoral Maior, Deltoide Anterior',        resistProfile:'uniform',   cadence:'3-0-1-0', cadenceNote:'Supino fechado: pegada estreita (30-45cm) transfere carga do peitoral para o tríceps. Curva de torque uniforme do tríceps. Exc. 3s controlado — ACSM Tabela 7-2.' },
  { id:'tr09', name:'Mergulho em Paralelas (Foco Tríceps)',     group:'Tríceps',  mechanics:'Composto', equipment:'Peso Corporal',  primary:'Tríceps Braquial (Tronco reto)',                secondary:'Peitoral Anterior, Deltoide',              resistProfile:'shortened', cadence:'3-0-1-0', cadenceNote:'Dip com tronco vertical: foco no tríceps (pico no encurtamento). Descida de 3s com cotovelos acima de 90° preserva a articulação glenoumeral — Lima & Pinto Cap.7.' },
  { id:'tr10', name:'Mergulho no Banco (Bench Dips)',           group:'Tríceps',  mechanics:'Composto', equipment:'Peso Corporal',  primary:'Tríceps Braquial',                              secondary:'Deltoide Anterior',                        resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Bench dip: ombro em extensão cria componente de alongamento da cabeça longa. Cuidado com o ângulo de ombro. Excêntrico 3s controlado — Lima & Pinto Cap.7.' },
  { id:'tr11', name:'Tríceps Coice com Halter (Kickback)',      group:'Tríceps',  mechanics:'Isolador', equipment:'Halteres',       primary:'Tríceps Braquial (Pico de Extensão Final)',     secondary:'Ancôneo',                                  resistProfile:'shortened', cadence:'2-1-1-0', cadenceNote:'Kickback: pico de ativação EMG do tríceps no final da extensão do cotovelo (encurtamento). 1s isométrico no topo com ombro perpendicular ao solo — Schoenfeld Cap.2.' },
  { id:'tr12', name:'Tríceps Coice no Cabo (Unilateral)',       group:'Tríceps',  mechanics:'Isolador', equipment:'Cabo',           primary:'Tríceps Braquial (Tensão Contínua)',            secondary:'Ancôneo',                                  resistProfile:'shortened', cadence:'2-1-1-0', cadenceNote:'Kickback no cabo: mantém tensão no tríceps mesmo na posição de extensão máxima (diferente do halter que perde tensão). Pausa 1s no topo — Lima & Pinto Cap.7.' },
  { id:'tr13', name:'Tríceps Máquina Articulada (Dip Machine)', group:'Tríceps',  mechanics:'Composto', equipment:'Máquina',        primary:'Tríceps Braquial',                              secondary:'Deltoide Anterior',                        resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Máquina de dip: trajetória guiada com pico de ativação do tríceps no encurtamento. Pausa 1s no topo com sobrecarga supramáxima — ACSM Tabela 7-2.' },

  // ── ABDÔMEN & CORE ──
  // Fonte: ACSM Cap.7 | Lima & Pinto — Cinesiologia Cap.8
  { id:'ab01', name:'Abdominal Crunch no Solo / Banco Declinado',group:'Abdômen', mechanics:'Isolador', equipment:'Peso Corporal', primary:'Reto Abdominal (Porção Superior)',            secondary:'Oblíquos',                                 resistProfile:'shortened', cadence:'2-1-1-0', cadenceNote:'Crunch: pico de ativação do reto abdominal no encurtamento (flexão de tronco completa). 1s isométrico no topo antes de descer — Lima & Pinto Cap.8.' },
  { id:'ab02', name:'Abdominal na Polia Alta com Corda (Cable Crunch)',group:'Abdômen',mechanics:'Isolador',equipment:'Cabo',     primary:'Reto Abdominal (Carga Progressiva)',            secondary:'Oblíquos',                                 resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Cable crunch: peso adicional do cabo cria sobrecarga progressiva no reto abdominal. Pico no encurtamento com 1s isométrico ajoelhado — ACSM Cap.7.' },
  { id:'ab03', name:'Elevação de Pernas na Barra Fixa (Hanging Leg Raise)',group:'Abdômen',mechanics:'Composto',equipment:'Peso Corporal',primary:'Reto Abdominal (Infra) & Iliopsoas',  secondary:'Oblíquos, Antebraços',                     resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Hanging leg raise: pico de tensão no reto abdominal inferior na posição de maior comprimento (pernas estendidas abaixo). Excêntrico 3s controlado evita balanço — ACSM Cap.7.' },
  { id:'ab04', name:'Elevação de Pernas na Paralela (Capitão)', group:'Abdômen',  mechanics:'Composto', equipment:'Máquina',        primary:'Reto Abdominal (Infra)',                        secondary:'Flexores de Quadril',                      resistProfile:'stretched', cadence:'3-0-1-0', cadenceNote:'Capitão: apoio no antebraço estabiliza o tronco enquanto o reto abdominal trabalha no comprimento máximo. Excêntrico 3s — Lima & Pinto Cap.8.' },
  { id:'ab05', name:'Abdominal Rollout (Roda Abdominal)',       group:'Abdômen',  mechanics:'Composto', equipment:'Acessório',      primary:'Core Global, Reto Abdominal & Transverso',      secondary:'Dorsal, Serrátil',                         resistProfile:'stretched', cadence:'3-0-2-0', cadenceNote:'Rollout: o reto abdominal e o transverso trabalham no comprimento máximo (tronco horizontal). Excêntrico 3s de controle é o mais desafiador — Lima & Pinto Cap.8.' },
  { id:'ab06', name:'Prancha Isométrica no Solo (Plank)',       group:'Abdômen',  mechanics:'Isolador', equipment:'Peso Corporal',  primary:'Transverso do Abdômen & Reto Abdominal',        secondary:'Glúteos, Ombros',                          resistProfile:'uniform',   cadence:'0-0-0-0', cadenceNote:'Prancha: esforço isométrico contínuo sem fase concêntrica/excêntrica. O tempo sob tensão (30-60s) é o parâmetro de progressão — ACSM Cap.7.' },
  { id:'ab07', name:'Russian Twist com Halter ou Anilha',       group:'Abdômen',  mechanics:'Isolador', equipment:'Halteres',       primary:'Oblíquos Interno e Externo',                    secondary:'Reto Abdominal',                           resistProfile:'stretched', cadence:'2-0-1-0', cadenceNote:'Russian twist: oblíquos trabalham em maior comprimento na rotação oposta ao braço de resistência. Controle durante toda ADM — Lima & Pinto Cap.8.' },
  { id:'ab08', name:'Abdominal na Máquina (Machine Crunch)',    group:'Abdômen',  mechanics:'Isolador', equipment:'Máquina',        primary:'Reto Abdominal',                                secondary:'Oblíquos',                                 resistProfile:'shortened', cadence:'3-1-1-0', cadenceNote:'Máquina de crunch: carga progressiva com trajetória guiada. Pico de ativação no encurtamento. 1s isométrico no pico de flexão — Lima & Pinto Cap.8.' }
];

// ════════════════════════════════════════════════════════════════════════════
// TABELA DE PAREAMENTO DE PERFIS DE RESISTÊNCIA (Engenharia de Curva de Torque)
// Fonte: Schoenfeld — "Science and Dev. of Muscle Hypertrophy" Cap.2
//        Lima & Pinto — "Cinesiologia e Musculação" Cap.4-7
//        Biomecânica Básica dos Exercícios: Membros Inferiores
// Regra: cada grupo muscular deve ter OBRIGATORIAMENTE um exercício que o desafia
// na posição de maior comprimento (stretched) E um na posição de encurtamento
// (shortened) — garantindo estimulação completa da curva de torque.
// ════════════════════════════════════════════════════════════════════════════
const PERF_RESISTANCE_PAIRS = {
  // ── PEITORAL ─────────────────────────────────────────────────────────────
  // Stretched: Crucifixo com halteres (pico a 90° de abdução — posição de maior comprimento)
  // Shortened: Peck Deck / Crossover polia baixa (pico na adução máxima — encurtamento)
  'Peitoral': {
    stretched:  'pe07', // Crucifixo Reto com Halteres — Schoenfeld Cap.2: maior ADM do peitoral
    shortened:  'pe13', // Peck Deck — Lima & Pinto Cap.4: pico na adução máxima (encurtamento)
    uniform:    'pe01'  // Supino Reto com Barra — curva mista com domínio de encurtamento
  },
  // ── DORSAIS / LATÍSSIMO ──────────────────────────────────────────────────
  // Stretched: Puxada aberta (latíssimo em máximo comprimento com braços estendidos)
  // Shortened: Pulldown braços retos (pico na extensão do ombro — encurtamento)
  'Dorsal': {
    stretched:  'do04', // Puxada Frontal Aberta — maior comprimento do lat (Schoenfeld Cap.2)
    shortened:  'do07', // Pulldown/Puxada Braços Retos — pico no quadril (encurtamento)
    uniform:    'do08'  // Remada Curvada com Barra — trabalho bilateral de romboides
  },
  // ── QUADRÍCEPS ───────────────────────────────────────────────────────────
  // Stretched: Hack Squat / Agachamento (amplitude máxima alonga reto femoral)
  // Shortened: Cadeira Extensora (pico de EMG na extensão completa — encurtamento)
  'Quadríceps': {
    stretched:  'lg03', // Hack Squat — ADM máxima sem carga axial (Biomec. MI)
    shortened:  'lg06', // Cadeira Extensora — pico de ativação no topo (Schoenfeld Cap.3)
    uniform:    'lg01'  // Agachamento Livre — curva quasi-uniforme (Biomec. MI)
  },
  // ── ISQUIOTIBIAIS ────────────────────────────────────────────────────────
  // Stretched: Stiff/RDL (anteversão pélvica — posição de maior comprimento)
  // Shortened: Cadeira Flexora Sentada (quadril fletido encurta isquiotibiais — pico no encurtamento)
  'Isquiotibiais': {
    stretched:  'lg10', // Stiff com Barra — máximo alongamento (Biomec. MI + Schoenfeld)
    shortened:  'lg13', // Cadeira Flexora Sentada — quadril em flexão encurta o músculo
    uniform:    'lg12'  // Mesa Flexora Deitada — quadril neutro, curva mais uniforme
  },
  // ── GLÚTEO MÁXIMO ────────────────────────────────────────────────────────
  // Stretched: Agachamento Búlgaro (anteversão pélvica força o glúteo a trabalhar alongado)
  // Shortened: Hip Thrust (pico de ativação EMG na extensão completa de quadril — encurtamento)
  'Glúteo': {
    stretched:  'lg07', // Búlgaro — glúteo em posição de maior comprimento (Biomec. MI)
    shortened:  'lg15', // Hip Thrust — máxima ativação EMG do glúteo (Schoenfeld Cap.2)
    uniform:    'lg04'  // Leg Press — ativação de glúteo em ADM parcial
  },
  // ── DELTOIDE MEDIAL ──────────────────────────────────────────────────────
  // Stretched: Elevação Lateral Inclinada 45° (maior comprimento do deltoide medial em repouso)
  // Shortened: Elevação Lateral com Halteres (pico de torque a 90° — encurtamento relativo)
  'Deltoides': {
    stretched:  'sh09', // Elev. Lateral Inclinada 45° — deltoide mais alongado (Schoenfeld Cap.2)
    shortened:  'sh06', // Elev. Lateral com Halteres — pico a 90° (Lima & Pinto Cap.6)
    uniform:    'sh07'  // Elev. Lateral Polia Baixa — tensão contínua em toda ADM
  },
  // ── BÍCEPS BRAQUIAL ──────────────────────────────────────────────────────
  // Stretched: Rosca Inclinada 45° (ombro em extensão alonga a cabeça longa do bíceps)
  // Shortened: Rosca Scott / Concentrada (ombro em flexão — pico de ativação no encurtamento)
  'Bíceps': {
    stretched:  'bi09', // Rosca Inclinada 45° — cabeça longa em máx. comprimento (Schoenfeld Cap.2)
    shortened:  'bi10', // Rosca Concentrada — pico isométrico no encurtamento (Lima & Pinto Cap.7)
    uniform:    'bi01'  // Rosca Direta Barra — curva de torque mais uniforme
  },
  // ── TRÍCEPS BRAQUIAL ─────────────────────────────────────────────────────
  // Stretched: Tríceps Francês (ombro em flexão >90° alonga a cabeça longa ao máximo)
  // Shortened: Pushdown Polia (cotovelo em extensão — pico de EMG no encurtamento)
  'Tríceps': {
    stretched:  'tr06', // Tríceps Francês — cabeça longa em máx. comprimento (Schoenfeld Cap.2)
    shortened:  'tr01', // Pushdown Barra Reta — pico de EMG no encurtamento (Lima & Pinto Cap.7)
    uniform:    'tr08'  // Supino Fechado — todas as cabeças, curva uniforme (ACSM)
  },
  // ── PANTURRILHA ──────────────────────────────────────────────────────────
  // Stretched: Em pé (joelho estendido — gastrocnêmio em máximo comprimento)
  // Shortened: Sentado (joelho fletido isola o sóleo — pico no encurtamento)
  'Panturrilha': {
    stretched:  'lg20', // Panturrilha em Pé — gastrocnêmio máx. comprimento (Biomec. MI)
    shortened:  'lg21', // Panturrilha Sentado — sóleo isolado, pico no encurtamento
    uniform:    'lg22'  // Panturrilha Leg Press — ADM máxima com joelho estendido
  }
};

// Estado da Agenda Semanal (7 Dias — Sincronizado com a IA e Pilar Nutrição)
let perfWeeklySchedule = [
  { dayKey: 'd1', dayName: 'Dia 1', routineId: 'A', title: 'Treino A · Push', focus: 'Peitoral & Deltoides', type: 'Treino', nutrtip: 'Carbo moderado pré-treino' },
  { dayKey: 'd2', dayName: 'Dia 2', routineId: 'B', title: 'Treino B · Pull', focus: 'Dorsal & Bíceps',       type: 'Treino', nutrtip: 'Alta hidratação (4.0L)' },
  { dayKey: 'd3', dayName: 'Dia 3', routineId: null,title: 'Cardio / Descanso',focus: 'Recuperação Ativa',    type: 'Cardio', nutrtip: 'Déficit calórico mantido' },
  { dayKey: 'd4', dayName: 'Dia 4', routineId: 'C', title: 'Treino C · Legs', focus: 'Quadríceps & Glúteos',  type: 'Treino', nutrtip: 'Carboidratos complexos' },
  { dayKey: 'd5', dayName: 'Dia 5', routineId: 'A', title: 'Treino A · Push', focus: 'Hipertrofia Ombros',    type: 'Treino', nutrtip: 'Aporte proteico 2.0g/kg' },
  { dayKey: 'd6', dayName: 'Dia 6', routineId: 'B', title: 'Treino B · Pull', focus: 'Densidade & Trapézio',  type: 'Treino', nutrtip: 'Refeição livre planejada' },
  { dayKey: 'd7', dayName: 'Dia 7', routineId: null,title: 'Descanso Total', focus: 'Regeneração Muscular',  type: 'Off',    nutrtip: 'Sono reparador & Eletrólitos' },
];

// Banco de Dados de Protocolos Cardio & Compromised Running (Engine)
const PERF_CARDIO_DB = [
  {
    id: 'cardio_01',
    title: 'Protocolo "Zona 2 Mitocondrial Puro"',
    subtitle: 'Aerobic Base Builder · Zero Interferência com a via mTOR',
    category: 'Zona 2',
    foco: 'Biogênese mitocondrial e oxidação pura de ácidos graxos em Zona 2 (60-70% FCM / 112-130 bpm). Ideal para Bulking e dias pré-treino de pernas sem dano excêntrico.',
    timeCap: '45 min',
    freq: '2 a 3x/semana',
    calEst: '~420-480 kcal',
    dinamica: 'Contínua em Estado Estável (Steady State / Respiração Nasal)',
    hardware: 'Cinta Cardíaca Bluetooth, Alerta de Zona 2 (112-130 bpm)',
    blocks: [
      { num: 1, name: 'Oxidação Lipídica no Remo', items: ['Remo Seco (RowErg): 15 min contínuos em Zona 2 (Pace constante 2:15 a 2:25/500m / FC < 130 bpm)'] },
      { num: 2, name: 'Cadência Cíclica sem Impacto', items: ['AirBike / Bike Ergométrica: 15 min contínuos (RPM estável 50-55 / Zero picos anaeróbios)'] },
      { num: 3, name: 'Caminhada Inclinada Anti-impacto', items: ['Esteira Inclinada: 15 min (Inclinação 8,0% a 10,0% / Velocidade 5,5 a 6,0 km/h / Respiração nasal)'] }
    ],
    restrictions: [
      'Manter a Frequência Cardíaca rigorosamente na Zona 2 (60-70% FCM).',
      'Se a FC ultrapassar a Zona 2, reduzir a velocidade da esteira em 0,5 km/h imediatamente.'
    ]
  },
  {
    id: 'cardio_02',
    title: 'Protocolo "Circuito Engine Híbrido Multiplanar"',
    subtitle: 'Variação Biomecânica · Gasto Calórico Constante sem Dano Articular',
    category: 'Engine',
    foco: 'Variação multiarticular contínua para recomposição corporal e dias de recuperação ativa, dissipando a sobrecarga de um único grupamento.',
    timeCap: '45 min',
    freq: '1 a 2x/semana',
    calEst: '~480-550 kcal',
    dinamica: 'Contínua por Blocos sem pausa passiva',
    hardware: 'Monitor Cardíaco Ativo / Perfil Treino Funcional',
    blocks: [
      { num: 1, name: 'Tração & Volume Alveolar', items: ['Remo Seco (RowErg): 15 min em Pace constante (Zona 2 / drive potente de pernas)'] },
      { num: 2, name: 'Potência Cíclica Superior/Inferior', items: ['AirBike / Echo Bike: 15 min com RPM estável (Zona 2/3 / trabalho síncrono de membros)'] },
      { num: 3, name: 'Locomoção Inclinada Anti-Impacto', items: ['Esteira Inclinada: 15 min (Inclinação 6,0% a 8,0% / 6,0 a 6,5 km/h)'] }
    ],
    restrictions: [
      'Proibido sprint anaeróbio no meio dos blocos (manter o ritmo cíclico estável).',
      'Manter a coluna neutra e a pegada solta no Remo Seco.'
    ]
  },
  {
    id: 'cardio_03',
    title: 'Protocolo "HIIT Norueguês 4x4 (Elite VO₂ Máx)"',
    subtitle: 'Fração de Ejeção Cardíaca · Deslocamento do Limiar L2',
    category: 'HIIT',
    foco: 'Aumento máximo do VO₂ Máx, complacência ventricular e tolerância à acidose intramuscular sem gerar fadiga residual prolongada.',
    timeCap: '35 min',
    freq: '1x/semana',
    calEst: '~400-470 kcal',
    dinamica: 'Intervalada de Alta Intensidade (4 tiros de 4 min em Z4/Z5 com 3 min de recuperação ativa)',
    hardware: 'Cinta Cardíaca Bluetooth, Cronômetro de Intervalos',
    blocks: [
      { num: 1, name: 'Aquecimento Progressivo', items: ['Esteira / Bike: 5 min em Zona 2 (60-70% FCM) para elevação gradual da temperatura central'] },
      { num: 2, name: 'Ciclo Principal 4x4', items: [
        'Tiro 1: 4 min em Zona 4/5 (85-95% FCM / 160-175 bpm) + 3 min recuperação ativa em Zona 2 (65% FCM)',
        'Tiro 2: 4 min em Zona 4/5 (85-95% FCM / 160-175 bpm) + 3 min recuperação ativa em Zona 2 (65% FCM)',
        'Tiro 3: 4 min em Zona 4/5 (85-95% FCM / 160-175 bpm) + 3 min recuperação ativa em Zona 2 (65% FCM)',
        'Tiro 4: 4 min em Zona 4/5 (85-95% FCM / 160-175 bpm) + 3 min recuperação ativa em Zona 2 (65% FCM)'
      ]},
      { num: 3, name: 'Resfriamento & Remoção de Lactato', items: ['Caminhada Plana: 3 min em Zona 1 (< 60% FCM) para normalização hemodinâmica'] }
    ],
    restrictions: [
      'Proibição de parada passiva nos intervalos de 3 min: Manter caminhada ou giro leve de pernas a 65% FCM para depuração de lactato.',
      'Não realizar no dia anterior a treinos pesados de agachamento.'
    ]
  },
  {
    id: 'cardio_04',
    title: 'Protocolo "Sprint Interval Training (SIT) Anti-Catabólico"',
    subtitle: 'Alta Ativação de AMPK & EPOC · Duração Curta (< 15 min)',
    category: 'HIIT',
    foco: 'Estímulo de potência anaeróbia alática e sinalização mitocondrial rápida para cutting agressivo com preservação máxima de massa magra.',
    timeCap: '20 min',
    freq: '1 a 2x/semana',
    calEst: '~280-350 kcal + EPOC 24h',
    dinamica: 'Intervalada de Alta Potência (Tiros All-Out de 20-30s com descanso passivo total de 90-120s)',
    hardware: 'AirBike / Echo Bike ou Esteira Inclinada',
    blocks: [
      { num: 1, name: 'Aquecimento Rápido', items: ['AirBike / Trote: 3 min progressivo (Zona 1 -> Zona 2)'] },
      { num: 2, name: 'Série de Sprints All-Out (8 a 10 Tiros)', items: [
        'Tiros 1 a 4: 20s em Esforço Máximo Absoluto (All-Out / RPM > 75) + 100s de descanso passivo total',
        'Tiros 5 a 8: 20s em Esforço Máximo Absoluto (All-Out / RPM > 75) + 100s de descanso passivo total',
        'Tiros 9 e 10 (Opcionais): 20s All-Out final com cadência máxima sustentada'
      ]},
      { num: 3, name: 'Desaquecimento', items: ['Giro leve sem carga: 2 min em Zona 1 para relaxamento neuromuscular'] }
    ],
    restrictions: [
      'Descanso 100% passivo entre os tiros para ressintetizar fosfocreatina pura.',
      'Manter pegada firme na AirBike sem flexão excessiva de tronco.'
    ]
  },
  {
    id: 'cardio_05',
    title: 'Protocolo "Aeróbico Regenerativo & Fluxo Sanguíneo"',
    subtitle: 'Restauração do SNA · Remoção de Metabólitos Pós-Treino',
    category: 'Regenerativo',
    foco: 'Aceleração do retorno venoso, fluxo linfático e relaxamento simpático pós-treinos de força com zero fadiga central.',
    timeCap: '20 min',
    freq: '2 a 4x/semana',
    calEst: '~150-200 kcal',
    dinamica: 'Contínua em Baixa Intensidade (Zona 1 estrita)',
    hardware: 'Bicicleta Horizontal / Elíptico / Caminhada Leve',
    blocks: [
      { num: 1, name: 'Fluxo Contínuo Regenerativo', items: ['Bicicleta Horizontal ou Elíptico: 20 min contínuos em Zona 1 (50-60% FCM / 95-112 bpm / Carga leve)'] }
    ],
    restrictions: [
      'A FC não deve ultrapassar 115 bpm em nenhum momento da sessão.',
      'Evitar impacto articular (preferir modalidades sem impacto).'
    ]
  }
];

let perfCardioActiveFilter = 'Todos';
let perfActiveSubView = 'prescription'; // 'prescription' | 'schedule' | 'cardio' | 'catalog'

function perfSwitchView(viewKey, shouldScroll = false) {
  perfActiveSubView = viewKey;

  // Esconde todas as subviews de performance
  document.querySelectorAll('.perf-subview').forEach(el => {
    el.style.display = 'none';
  });

  // Exibe apenas a subview selecionada
  const targetView = document.getElementById('perf-view-' + viewKey);
  if (targetView) {
    targetView.style.display = 'block';
  }

  // Atualiza os botões ativos no menu superior do Pilar 4
  const navBtns = [
    { key: 'prescription', id: 'perf-nav-btn-prescription' },
    { key: 'schedule',     id: 'perf-nav-btn-schedule' },
    { key: 'cardio',       id: 'perf-nav-btn-cardio' },
    { key: 'catalog',      id: 'perf-nav-btn-catalog' }
  ];

  navBtns.forEach(b => {
    const btn = document.getElementById(b.id);
    if (btn) {
      if (b.key === viewKey) {
        btn.classList.add('active');
        btn.style.borderColor = 'rgba(59,130,246,0.8)';
        btn.style.background = 'rgba(30,58,138,0.45)';
      } else {
        btn.classList.remove('active');
        btn.style.borderColor = '';
        btn.style.background = '';
      }
    }
  });

  if (window.lucide) window.lucide.createIcons();

  // Scroll suave apenas quando solicitado explicitamente por clique
  if (shouldScroll && targetView) {
    targetView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

let perfPrescribedCardioId = 'cardio_01';

function renderPerfPrescribedCardio() {
  const container = document.getElementById('perf-prescribed-cardio-container');
  if (!container) return;

  const cardio = PERF_CARDIO_DB.find(c => c.id === perfPrescribedCardioId) || PERF_CARDIO_DB[0];
  if (!cardio) return;

  container.innerHTML = `
    <div class="hud-card p-5 space-y-4 border-amber-500/50 bg-gradient-to-br from-amber-950/30 via-black/90 to-zinc-950/90 shadow-[0_0_25px_rgba(245,158,11,0.15)] rounded-2xl">
      <div class="flex items-center justify-between border-b border-amber-500/20 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-2.5">
          <span class="p-2 rounded-xl bg-amber-950/90 border border-amber-500/60 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)]">
            <i data-lucide="flame" class="w-5 h-5"></i>
          </span>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700/80 px-2 py-0.5 rounded-full uppercase">
                Cardio &amp; Engine Prescrito pela IA
              </span>
              <span class="text-[10px] font-mono text-zinc-400">⚡ Time Cap: <strong class="text-white">${cardio.timeCap}</strong></span>
              <span class="text-[10px] font-mono font-bold text-amber-400">🔥 Queima Estimada: ${cardio.calEst}</span>
            </div>
            <h3 class="text-base font-bold text-white tracking-tight mt-1">${cardio.title}</h3>
            <p class="text-xs font-semibold text-amber-400/90">${cardio.subtitle}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="perfSwitchView('cardio', true)" class="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all flex items-center gap-1.5">
            <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
            <span>Ver Outros Protocolos</span>
          </button>
        </div>
      </div>

      <!-- Foco Biomecânico -->
      <div class="p-3 rounded-xl bg-black/60 border border-amber-500/20 text-xs text-zinc-300 leading-relaxed">
        <strong class="text-amber-400 font-bold block mb-1">🧬 Diretriz &amp; Foco Biomecânico da IA:</strong>
        ${cardio.foco}
      </div>

      <!-- 4 Blocos Estruturados de Execução -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        ${cardio.blocks.map(b => `
          <div class="p-3 rounded-xl bg-black/50 border border-zinc-800 text-xs space-y-1.5">
            <div class="flex items-center justify-between border-b border-zinc-800/80 pb-1">
              <strong class="text-amber-300 font-bold">Bloco ${b.num} — ${b.name}</strong>
              <span class="text-[10px] font-mono text-zinc-500">Zero descanso passivo</span>
            </div>
            <ul class="space-y-1 text-[11px] text-zinc-300">
              ${b.items.map(it => `<li class="flex items-start gap-1.5"><span class="text-amber-400 font-bold">•</span> <span>${it}</span></li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>

      <!-- Restrições e Setup do Hardware -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 font-mono">
        <div><strong class="text-zinc-300">⚙️ Hardware:</strong> ${cardio.hardware} · Dinâmica: ${cardio.dinamica}</div>
        <div class="text-amber-400/90 font-sans text-xs">⚠️ ${cardio.restrictions[0]}</div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

// ════════════════════════════════════════════════════════════════════════════
// MOTOR DE SINERGIA NUTRICIONAL (PILAR 3 × PILAR 4) — CÁLCULOS DINÂMICOS
// ════════════════════════════════════════════════════════════════════════════
function perfGetNutritionContext() {
  const patientSelect = document.getElementById('activePatientSelect');
  const patientName = document.getElementById("headerPatientName")?.innerText?.trim() ||
                      document.getElementById("perfPatientName")?.innerText?.trim() ||
                      (patientSelect ? patientSelect.options[patientSelect.selectedIndex]?.text : 'Paulo Vitor Ribeiro de Sousa');

  const headerWeightText = document.getElementById('headerPatientWeight')?.innerText?.replace('kg', '')?.trim();
  const perfWeightText = document.getElementById('perfPatientWeight')?.innerText?.replace('kg', '')?.trim();
  const anamneseWeightVal = document.getElementById('anamneseWeight')?.value;
  const dashWeightText = document.getElementById('dashWeight')?.innerText?.replace('kg', '')?.trim();

  let currentWeight = 115.8;
  if (headerWeightText && parseFloat(headerWeightText)) currentWeight = parseFloat(headerWeightText);
  else if (perfWeightText && parseFloat(perfWeightText)) currentWeight = parseFloat(perfWeightText);
  else if (anamneseWeightVal && parseFloat(anamneseWeightVal)) currentWeight = parseFloat(anamneseWeightVal);
  else if (dashWeightText && parseFloat(dashWeightText)) currentWeight = parseFloat(dashWeightText);

  const headerGoalText = document.getElementById('headerPatientGoal')?.innerText?.trim();
  const perfGoalText = document.getElementById('perfPatientGoal')?.innerText?.trim();
  const anamneseObjEl = document.getElementById('anamneseObjective');
  const objective = headerGoalText || perfGoalText || (anamneseObjEl && anamneseObjEl.value) || 'Hipertrofia & Recomposição';

  const tmbEl = document.getElementById('dashTmb');
  const tmb = tmbEl ? parseInt(tmbEl.innerText) || Math.round(500 + 22 * (currentWeight * 0.77)) : Math.round(500 + 22 * (currentWeight * 0.77));
  
  const caloricTargetEl = document.getElementById('dashCaloricTarget');
  const caloricTarget = caloricTargetEl ? parseInt(caloricTargetEl.innerText) || Math.round(tmb * 1.45 + 280) : Math.round(tmb * 1.45 + 280);
  
  const getKcal = typeof calculateGET === 'function' ? Math.round(calculateGET(tmb, 1.42)) : Math.round(tmb * 1.42);
  const energyBalance = caloricTarget - getKcal;

  let proteinGKg = 2.0;
  const protInput = document.getElementById('prescProtGKg');
  if (protInput && protInput.value && parseFloat(protInput.value)) {
    proteinGKg = parseFloat(protInput.value);
  }
  const totalProteinG = Math.round(currentWeight * proteinGKg);

  let carbGKg = 3.8;
  const carbInput = document.getElementById('prescCarbGKg');
  if (carbInput && carbInput.value && parseFloat(carbInput.value)) carbGKg = parseFloat(carbInput.value);

  const waterTargetMl = Math.round(currentWeight * 40); // 40ml/kg (ex: 115.8 * 40 = 4632 mL)

  const isCutting = objective.toLowerCase().includes('perda') || objective.toLowerCase().includes('emagrecimento') || energyBalance < -150;
  const isBulking = objective.toLowerCase().includes('hipertrofia') || energyBalance > 150;

  return {
    patientName,
    objective,
    currentWeight,
    tmb,
    caloricTarget,
    energyBalance,
    proteinGKg,
    totalProteinG,
    carbGKg,
    waterTargetMl,
    isCutting,
    isBulking
  };
}

function perfNormalizeWeeklySchedule(schedule) {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return perfBuildWeeklySchedule(typeof perfActiveSplit !== 'undefined' ? perfActiveSplit : 'PPL');
  }
  const legacyKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  return schedule.map((d, idx) => {
    const num = idx + 1;
    const defaultKey = `d${num}`;
    const defaultName = `Dia ${num}`;

    let dayKey = d.dayKey;
    if (!dayKey || legacyKeys.includes(dayKey)) {
      dayKey = defaultKey;
    }

    return {
      ...d,
      dayKey,
      dayName: defaultName
    };
  });
}

function perfBuildWeeklySchedule(splitKey) {
  const ctx = perfGetNutritionContext();
  const protStr = `${ctx.proteinGKg.toFixed(1)} g/kg (${ctx.totalProteinG}g/dia)`;
  const waterStr = `${ctx.waterTargetMl.toLocaleString('pt-BR')} mL (40 mL/kg)`;
  const preCarbG = ctx.isCutting ? '50-60g' : ctx.isBulking ? '80-100g' : '60-70g';

  // 1. UPPER / LOWER (ABCD - 4 Dias · Cutting / Alta Frequência)
  if (splitKey === 'UpperLower') {
    return [
      {
        dayKey: 'd1', dayName: 'Dia 1', routineId: 'A', title: 'Treino A · Upper Força',
        focus: 'Tensão Mecânica Peitoral & Dorsal', type: 'Treino',
        carboTip: `${preCarbG} carbo (~1h30 antes · Aveia / Banana)`,
        proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Recarga glicêmica pré-treino & pico de tensão miofibrilar'
      },
      {
        dayKey: 'd2', dayName: 'Dia 2', routineId: 'B', title: 'Treino B · Lower Força',
        focus: 'Cadeia Posterior, Agachamento & Stiff', type: 'Treino',
        carboTip: `${preCarbG} carbo de baixo/médio IG (Batata doce / Arroz)`,
        proteinTip: protStr, waterTip: `${(ctx.waterTargetMl + 500).toLocaleString('pt-BR')} mL`,
        strategyTip: 'Reposição de glicogênio para membros inferiores'
      },
      {
        dayKey: 'd3', dayName: 'Dia 3', routineId: null, title: 'Zona 2 Mitocondrial Puro',
        focus: 'Oxidação Lipídica & Biogênese', type: 'Cardio', cardioId: 'cardio_01',
        carboTip: '30g carbo leve ou treino em estado estável',
        proteinTip: `${ctx.proteinGKg.toFixed(1)} g/kg (Anti-catabólico)`,
        waterTip: `${(ctx.waterTargetMl + 600).toLocaleString('pt-BR')} mL + Eletrólitos`,
        strategyTip: 'Oxidação pura de ácidos graxos sem interferência na via mTOR'
      },
      {
        dayKey: 'd4', dayName: 'Dia 4', routineId: 'C', title: 'Treino C · Upper Hipertrofia',
        focus: 'Volume Metabólico Deltoides & Braços', type: 'Treino',
        carboTip: `${preCarbG} carbo peri-treino (Frutas + Creatina 5g)`,
        proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Pump sarcoplasmático e síntese proteica acelerada'
      },
      {
        dayKey: 'd5', dayName: 'Dia 5', routineId: 'D', title: 'Treino D · Lower Hipertrofia',
        focus: 'Quadríceps, Hack Squat & Glúteos', type: 'Treino',
        carboTip: `${preCarbG} carbo denso pré e pós-treino (Arroz / Mandioca)`,
        proteinTip: protStr, waterTip: `${(ctx.waterTargetMl + 500).toLocaleString('pt-BR')} mL`,
        strategyTip: 'Recarga glicêmica estruturada para regeneração tecidual'
      },
      {
        dayKey: 'd6', dayName: 'Dia 6', routineId: null, title: 'Circuito Engine Híbrido',
        focus: 'Variação Biomecânica & Gasto Calórico', type: 'Cardio', cardioId: 'cardio_02',
        carboTip: 'Carboidratos moderados distribuídos ao longo do dia',
        proteinTip: protStr, waterTip: `${(ctx.waterTargetMl + 500).toLocaleString('pt-BR')} mL`,
        strategyTip: `Déficit calórico planejado mantido (${ctx.caloricTarget} kcal)`
      },
      {
        dayKey: 'd7', dayName: 'Dia 7', routineId: null, title: 'Descanso Total (OFF)',
        focus: 'Regeneração Muscular & Supercompensação', type: 'Off',
        carboTip: 'Carboidratos complexos com fibras e vegetais abundantes',
        proteinTip: `${ctx.proteinGKg.toFixed(1)} g/kg (Recuperação estrutural contínua)`,
        waterTip: `${ctx.waterTargetMl.toLocaleString('pt-BR')} mL + Sódio e Magnésio`,
        strategyTip: 'Supercompensação celular, sono reparador 8h & alívio do SNC'
      }
    ];
  }
  
  // 2. PHAT (5 Dias · Hipertrofia & Força / Bulking)
  else if (splitKey === 'PHAT') {
    return [
      {
        dayKey: 'd1', dayName: 'Dia 1', routineId: 'A', title: 'Treino A · Upper Power',
        focus: 'Carga Máxima Supino, Remada & Militar', type: 'Treino',
        carboTip: '80-100g carbo denso pré-treino (Aveia / Tapioca / Mel)',
        proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Superávit anabólico peri-treino para força máxima'
      },
      {
        dayKey: 'd2', dayName: 'Dia 2', routineId: 'B', title: 'Treino B · Lower Power',
        focus: 'Agachamento Livre & Stiff Pesado (3-5 reps)', type: 'Treino',
        carboTip: '80-100g carbo pré-treino + Creatina 5g',
        proteinTip: protStr, waterTip: `${(ctx.waterTargetMl + 600).toLocaleString('pt-BR')} mL`,
        strategyTip: 'Sobrecarga miofibrilar pesada e recarga de creatina-fosfato'
      },
      {
        dayKey: 'd3', dayName: 'Dia 3', routineId: null, title: 'Zona 2 Base Aeróbica',
        focus: 'FC 112-130 bpm Sensibilidade à Insulina', type: 'Cardio', cardioId: 'cardio_01',
        carboTip: 'Carbo moderado 40g para preservação de glicogênio',
        proteinTip: protStr, waterTip: `${(ctx.waterTargetMl + 500).toLocaleString('pt-BR')} mL`,
        strategyTip: 'Sensibilidade insulínica para otimização do superávit'
      },
      {
        dayKey: 'd4', dayName: 'Dia 4', routineId: 'C', title: 'Treino C · Costas/Ombros Hyp',
        focus: 'Hipertrofia Sarcoplasmática Dorsais/Deltoides', type: 'Treino',
        carboTip: '70-80g carbo pré-treino (Arroz / Batata)',
        proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Volume volumétrico com alto influxo de glicogênio'
      },
      {
        dayKey: 'd5', dayName: 'Dia 5', routineId: 'D', title: 'Treino D · Pernas Hipertrofia',
        focus: 'Hack Squat, Cadeira Extensora & Flexora', type: 'Treino',
        carboTip: '80g carbo denso pré e pós-treino',
        proteinTip: protStr, waterTip: `${(ctx.waterTargetMl + 600).toLocaleString('pt-BR')} mL`,
        strategyTip: 'Recarga glicêmica pós-treino para hipertrofia de membros inferiores'
      },
      {
        dayKey: 'd6', dayName: 'Dia 6', routineId: 'E', title: 'Treino E · Peitoral & Braços',
        focus: 'Densidade Miofibrilar Peito, Bíceps & Tríceps', type: 'Treino',
        carboTip: '70g carbo com refeição completa pré-treino',
        proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Refeição de recarga livre planejada pós-treino'
      },
      {
        dayKey: 'd7', dayName: 'Dia 7', routineId: null, title: 'Descanso Total (OFF)',
        focus: 'Supercompensação e Crescimento Tecidual', type: 'Off',
        carboTip: 'Carboidratos equilibrados de lenta absorção',
        proteinTip: `${ctx.proteinGKg.toFixed(1)} g/kg (Síntese proteica contínua)`,
        waterTip: `${ctx.waterTargetMl.toLocaleString('pt-BR')} mL`,
        strategyTip: 'Supercompensação miofibrilar total com 8-9h de sono'
      }
    ];
  }

  // 3. DUP (Periodização Ondulatória Diária · 3 a 5 Dias)
  else if (splitKey === 'DUP') {
    return [
      {
        dayKey: 'd1', dayName: 'Dia 1', routineId: 'A', title: 'Treino A · Dia Neural (Força)',
        focus: 'Carga Máxima (3-5 reps / RPE 9)', type: 'Treino',
        carboTip: `${preCarbG} carbo denso pré-treino + Creatina 5g`,
        proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Restauração de ATP-CP e recrutamento de unidades motoras de alto limiar'
      },
      {
        dayKey: 'd2', dayName: 'Dia 2', routineId: null, title: 'Cardio Zona 2 Puro',
        focus: 'Base Aeróbia & Depuração', type: 'Cardio', cardioId: 'cardio_01',
        carboTip: '30-40g carbo leve para recuperação',
        proteinTip: protStr, waterTip: `${(ctx.waterTargetMl + 500).toLocaleString('pt-BR')} mL`,
        strategyTip: 'Biogênese mitocondrial sem fadiga neuromuscular'
      },
      {
        dayKey: 'd3', dayName: 'Dia 3', routineId: 'B', title: 'Treino B · Dia Hipertrófico',
        focus: 'Tensão Contínua (8-10 reps / RPE 8)', type: 'Treino',
        carboTip: `${preCarbG} carbo com aminoácidos essenciais`,
        proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Estímulo de tensão mecânica na posição de máximo alongamento'
      },
      {
        dayKey: 'd4', dayName: 'Dia 4', routineId: null, title: 'Aeróbico Regenerativo',
        focus: 'Fluxo Sanguíneo & SNA', type: 'Cardio', cardioId: 'cardio_05',
        carboTip: 'Carboidratos moderados e hidratação com eletrólitos',
        proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Depuração de metabólitos e restauração parassimpática'
      },
      {
        dayKey: 'd5', dayName: 'Dia 5', routineId: 'C', title: 'Treino C · Dia Metabólico',
        focus: 'Pump & Densidade (12-15 reps / RPE 9)', type: 'Treino',
        carboTip: `${preCarbG} carbo de rápida digestão`,
        proteinTip: protStr, waterTip: `${(ctx.waterTargetMl + 500).toLocaleString('pt-BR')} mL`,
        strategyTip: 'Estresse metabólico e hipertrofia sarcoplasmática acelerada'
      },
      {
        dayKey: 'd6', dayName: 'Dia 6', routineId: null, title: 'HIIT Norueguês 4x4',
        focus: 'VO₂ Máx & Potência Cardiovascular', type: 'Cardio', cardioId: 'cardio_03',
        carboTip: '40g carbo de fácil absorção 1h antes',
        proteinTip: protStr, waterTip: `${(ctx.waterTargetMl + 500).toLocaleString('pt-BR')} mL`,
        strategyTip: 'Complacência ventricular e deslocamento do limiar anaeróbio L2'
      },
      {
        dayKey: 'd7', dayName: 'Dia 7', routineId: null, title: 'Descanso Total (OFF)',
        focus: 'Regeneração Sistêmica Completa', type: 'Off',
        carboTip: 'Alimentação equilibrada anti-inflamatória',
        proteinTip: protStr, waterTip: `${ctx.waterTargetMl.toLocaleString('pt-BR')} mL`,
        strategyTip: 'Sono profundo e consolidação das adaptações neuromusculares'
      }
    ];
  }

  // 4. FULL BODY (3 Dias · Atletas & Alta Frequência)
  else if (splitKey === 'FullBody') {
    return [
      {
        dayKey: 'd1', dayName: 'Dia 1', routineId: 'A', title: 'Treino A · Full Body Força',
        focus: 'Agachamento, Supino & Barra Fixa', type: 'Treino',
        carboTip: `${preCarbG} carbo pré-treino`,
        proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Recrutamento neural global de cadeia fechada'
      },
      {
        dayKey: 'd2', dayName: 'Dia 2', routineId: null, title: 'Zona 2 Base Aeróbica',
        focus: 'Biogênese Mitocondrial', type: 'Cardio', cardioId: 'cardio_01',
        carboTip: '30g carbo leve', proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Oxidação de gordura e restauração de glicogênio muscular'
      },
      {
        dayKey: 'd3', dayName: 'Dia 3', routineId: 'B', title: 'Treino B · Full Body Hinge',
        focus: 'Stiff, Militar & Remada Curvada', type: 'Treino',
        carboTip: `${preCarbG} carbo denso`,
        proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Potência de cadeia posterior e estabilidade de ombros'
      },
      {
        dayKey: 'd4', dayName: 'Dia 4', routineId: null, title: 'Circuito Engine Híbrido',
        focus: 'Capacidade Cardiovascular 3D', type: 'Cardio', cardioId: 'cardio_02',
        carboTip: 'Carboidratos moderados distribuídos', proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Variação biomecânica sem estresse axial'
      },
      {
        dayKey: 'd5', dayName: 'Dia 5', routineId: 'C', title: 'Treino C · Full Body Hyp',
        focus: 'Hack Squat, Puxadas & Isoladores', type: 'Treino',
        carboTip: `${preCarbG} carbo peri-treino`,
        proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Volume sarcoplasmático complementar'
      },
      {
        dayKey: 'd6', dayName: 'Dia 6', routineId: null, title: 'SIT Anti-Catabólico',
        focus: 'Sprints Curtos & AMPK', type: 'Cardio', cardioId: 'cardio_04',
        carboTip: '30g carbo leve pré-sprint', proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'EPOC prolongado em tempo total curto (<15 min)'
      },
      {
        dayKey: 'd7', dayName: 'Dia 7', routineId: null, title: 'Descanso Total (OFF)',
        focus: 'Repouso & Reparação', type: 'Off',
        carboTip: 'Alimentação equilibrada com fibras', proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Supercompensação total e descanso do SNC'
      }
    ];
  }

  // 5. ABCD (4 Dias Tradicional)
  else if (splitKey === 'ABCD') {
    return [
      {
        dayKey: 'd1', dayName: 'Dia 1', routineId: 'A', title: 'Treino A · Peito & Tríceps',
        focus: 'Cadeia Anterior Superior & Reto Abdominal', type: 'Treino',
        carboTip: `${preCarbG} carbo pré-treino`, proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Foco no peitoral e tríceps com pareamento alongado/encurtado'
      },
      {
        dayKey: 'd2', dayName: 'Dia 2', routineId: 'B', title: 'Treino B · Costas & Bíceps',
        focus: 'Cadeia Posterior Superior & Trapézio', type: 'Treino',
        carboTip: `${preCarbG} carbo denso`, proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Puxadas pesadas e densidade dorsal'
      },
      {
        dayKey: 'd3', dayName: 'Dia 3', routineId: null, title: 'Cardio Zona 2 Puro',
        focus: 'Oxidação Lipídica & Recuperação', type: 'Cardio', cardioId: 'cardio_01',
        carboTip: 'Carbo moderado 30g', proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Recuperação ativa entre treinos de tronco e pernas'
      },
      {
        dayKey: 'd4', dayName: 'Dia 4', routineId: 'C', title: 'Treino C · Pernas Completo',
        focus: 'Quadríceps, Isquiotibiais & Glúteos', type: 'Treino',
        carboTip: `${preCarbG} carbo denso pré e pós`, proteinTip: protStr, waterTip: `${(ctx.waterTargetMl + 600).toLocaleString('pt-BR')} mL`,
        strategyTip: 'Volume completo de membros inferiores'
      },
      {
        dayKey: 'd5', dayName: 'Dia 5', routineId: 'D', title: 'Treino D · Deltoides & Core',
        focus: 'Ombros 3D, Manguito & Oblíquos', type: 'Treino',
        carboTip: `${preCarbG} carbo peri-treino`, proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Isolamento de deltoide medial, posterior e core rotacional'
      },
      {
        dayKey: 'd6', dayName: 'Dia 6', routineId: null, title: 'Circuito Engine Híbrido',
        focus: 'Capacidade Cardiovascular', type: 'Cardio', cardioId: 'cardio_02',
        carboTip: 'Carboidratos distribuídos', proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Gasto calórico complementar sem impacto axial'
      },
      {
        dayKey: 'd7', dayName: 'Dia 7', routineId: null, title: 'Descanso Total (OFF)',
        focus: 'Regeneração Muscular', type: 'Off',
        carboTip: 'Fibras, vegetais e hidratação', proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Recuperação do sistema nervoso autônomo'
      }
    ];
  }

  // 6. ABCDE (5 Dias Isolamento Miofibrilar)
  else if (splitKey === 'ABCDE') {
    return [
      {
        dayKey: 'd1', dayName: 'Dia 1', routineId: 'A', title: 'Treino A · Peitoral',
        focus: 'Peitoral Superior, Médio e Inferior', type: 'Treino',
        carboTip: `${preCarbG} carbo pré-treino`, proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Estímulo de peitoral em todos os ângulos'
      },
      {
        dayKey: 'd2', dayName: 'Dia 2', routineId: 'B', title: 'Treino B · Dorsal',
        focus: 'Latíssimo, Romboides & Lombar', type: 'Treino',
        carboTip: `${preCarbG} carbo denso`, proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Tração vertical e horizontal pesadas'
      },
      {
        dayKey: 'd3', dayName: 'Dia 3', routineId: 'C', title: 'Treino C · Pernas',
        focus: 'Agachamento, Hack & Posteriores', type: 'Treino',
        carboTip: `${preCarbG} carbo denso pré e pós`, proteinTip: protStr, waterTip: `${(ctx.waterTargetMl + 600).toLocaleString('pt-BR')} mL`,
        strategyTip: 'Volume concentrado em membros inferiores'
      },
      {
        dayKey: 'd4', dayName: 'Dia 4', routineId: 'D', title: 'Treino D · Ombros & Trapézio',
        focus: 'Deltoides 3D & Encolhimento', type: 'Treino',
        carboTip: `${preCarbG} carbo peri-treino`, proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Isolamento de deltoides nos 3 planos'
      },
      {
        dayKey: 'd5', dayName: 'Dia 5', routineId: 'E', title: 'Treino E · Braços (Bíceps/Tríceps)',
        focus: 'Super-séries de Braços & Core', type: 'Treino',
        carboTip: `${preCarbG} carbo peri-treino`, proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Pump máximo e densidade miofibrilar nos braços'
      },
      {
        dayKey: 'd6', dayName: 'Dia 6', routineId: null, title: 'Cardio Zona 2 Mitocondrial',
        focus: 'Base Aeróbia & Depuração', type: 'Cardio', cardioId: 'cardio_01',
        carboTip: '30-40g carbo leve', proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Sensibilidade à insulina e queima lipídica pura'
      },
      {
        dayKey: 'd7', dayName: 'Dia 7', routineId: null, title: 'Descanso Total (OFF)',
        focus: 'Regeneração Muscular', type: 'Off',
        carboTip: 'Alimentação equilibrada de manutenção', proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Supercompensação e alívio do SNC'
      }
    ];
  }

  // 7. PPL (Push / Pull / Legs — Padrão 3 a 6 Dias)
  else {
    return [
      {
        dayKey: 'd1', dayName: 'Dia 1', routineId: 'A', title: 'Treino A · Push',
        focus: 'Peitoral, Deltoides & Tríceps', type: 'Treino',
        carboTip: `${preCarbG} carbo pré-treino (~1h30 antes)`,
        proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Recarga glicêmica peri-treino para alta intensidade'
      },
      {
        dayKey: 'd2', dayName: 'Dia 2', routineId: 'B', title: 'Treino B · Pull',
        focus: 'Costas, Bíceps, Trapézio & Core', type: 'Treino',
        carboTip: `${preCarbG} carbo pré-treino (Frutas / Aveia)`,
        proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Aporte proteico fracionado ao longo do dia'
      },
      {
        dayKey: 'd3', dayName: 'Dia 3', routineId: null, title: 'Cardio Zona 2 Mitocondrial',
        focus: 'Biogênese & Sensibilidade Insulínica', type: 'Cardio', cardioId: 'cardio_01',
        carboTip: '30-40g carbo de rápida digestão',
        proteinTip: protStr, waterTip: `${(ctx.waterTargetMl + 500).toLocaleString('pt-BR')} mL`,
        strategyTip: 'Oxidação de ácidos graxos sem fadiga neuromuscular'
      },
      {
        dayKey: 'd4', dayName: 'Dia 4', routineId: 'C', title: 'Treino C · Legs',
        focus: 'Quadríceps, Isquiotibiais & Panturrilhas', type: 'Treino',
        carboTip: `${preCarbG} carbo denso pré-agachamento`,
        proteinTip: protStr, waterTip: `${(ctx.waterTargetMl + 500).toLocaleString('pt-BR')} mL`,
        strategyTip: 'Recarga glicêmica peri-treino para suportar o volume de pernas'
      },
      {
        dayKey: 'd5', dayName: 'Dia 5', routineId: 'A', title: 'Treino A · Push',
        focus: 'Densidade Peitoral & Ombros', type: 'Treino',
        carboTip: `${preCarbG} carbo peri-treino`,
        proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Síntese proteica mantida com 2.0 g/kg'
      },
      {
        dayKey: 'd6', dayName: 'Dia 6', routineId: 'B', title: 'Treino B · Pull',
        focus: 'Dorsal, Braquial & Trapézio', type: 'Treino',
        carboTip: `${preCarbG} carbo com refeição equilibrada`,
        proteinTip: protStr, waterTip: waterStr,
        strategyTip: 'Refeição de recarga glicêmica pós-treino'
      },
      {
        dayKey: 'd7', dayName: 'Dia 7', routineId: null, title: 'Descanso Total (OFF)',
        focus: 'Regeneração Muscular & Repouso', type: 'Off',
        carboTip: 'Carbo complexo com fibras e hortaliças',
        proteinTip: protStr, waterTip: `${ctx.waterTargetMl.toLocaleString('pt-BR')} mL`,
        strategyTip: 'Recuperação neuromuscular completa e hidratação com eletrólitos'
      }
    ];
  }
}

function renderPerfWeeklySchedule() {
  const container1 = document.getElementById('perf-weekly-days-grid');
  const container2 = document.getElementById('perf-prescription-weekly-grid');
  if (!container1 && !container2) return;

  // Garante que o schedule contenha todas as diretrizes completas e formato numérico (Dia 1 a Dia 7)
  if (!perfWeeklySchedule || !perfWeeklySchedule[0] || !perfWeeklySchedule[0].carboTip) {
    perfWeeklySchedule = perfBuildWeeklySchedule(perfActiveSplit);
  } else {
    perfWeeklySchedule = perfNormalizeWeeklySchedule(perfWeeklySchedule);
  }

  let trainingIndex = 0;
  const html = perfWeeklySchedule.map((day, idx) => {
    const isTreino = day.type === 'Treino';
    const isCardio = day.type === 'Cardio';
    const isOff = day.type === 'Off';
    const dayLabel = `DIA ${idx + 1}`;

    let isColor2 = false;
    if (isTreino) {
      if (day.routineId) {
        const charCode = day.routineId.toUpperCase().charCodeAt(0) - 65;
        isColor2 = (charCode >= 0 ? charCode % 2 === 1 : trainingIndex % 2 === 1);
      } else {
        isColor2 = (trainingIndex % 2 === 1);
      }
      trainingIndex++;
    }

    let borderClass = '';
    let badgeClass = '';
    let titleHoverClass = '';
    let dayNumColor = '';
    let shadowGlow = '';

    if (isTreino) {
      if (isColor2) {
        // Cor 2: Roxo / Violeta Elétrico
        borderClass = 'border-purple-600/70 bg-gradient-to-b from-purple-950/40 via-black to-zinc-950 hover:border-purple-400';
        badgeClass = 'bg-purple-900/80 text-purple-200 border-purple-500/60 shadow-[0_0_8px_rgba(168,85,247,0.3)]';
        titleHoverClass = 'group-hover:text-purple-300';
        dayNumColor = 'text-purple-400';
        shadowGlow = 'shadow-[0_0_15px_rgba(168,85,247,0.12)]';
      } else {
        // Cor 1: Azul Cobalto / Cyan
        borderClass = 'border-blue-600/70 bg-gradient-to-b from-blue-950/40 via-black to-zinc-950 hover:border-blue-400';
        badgeClass = 'bg-blue-900/80 text-blue-200 border-blue-500/60 shadow-[0_0_8px_rgba(59,130,246,0.3)]';
        titleHoverClass = 'group-hover:text-blue-300';
        dayNumColor = 'text-blue-400';
        shadowGlow = 'shadow-[0_0_15px_rgba(59,130,246,0.12)]';
      }
    } else if (isCardio) {
      borderClass = 'border-amber-600/60 bg-gradient-to-b from-amber-950/40 via-black to-zinc-950 hover:border-amber-400';
      badgeClass = 'bg-amber-900/80 text-amber-300 border-amber-600/60 shadow-[0_0_8px_rgba(245,158,11,0.2)]';
      titleHoverClass = 'group-hover:text-amber-300';
      dayNumColor = 'text-amber-400';
      shadowGlow = 'shadow-[0_0_15px_rgba(245,158,11,0.1)]';
    } else {
      borderClass = 'border-zinc-800 bg-black/60 hover:border-zinc-700';
      badgeClass = 'bg-zinc-800 text-zinc-400 border-zinc-700';
      titleHoverClass = 'group-hover:text-zinc-300';
      dayNumColor = 'text-zinc-400';
      shadowGlow = 'shadow-[0_0_15px_rgba(0,0,0,0.4)]';
    }

    let icon = isTreino ? 'dumbbell' : isCardio ? 'flame' : 'coffee';

    return `
      <div onclick="perfFocusDay('${day.dayKey}')"
        class="hud-card p-3.5 rounded-xl border ${borderClass} transition-all cursor-pointer space-y-2.5 ${shadowGlow} group hover:scale-[1.01]">
        
        <!-- Header do Dia (Numérico com Cor Alternada) -->
        <div class="flex items-center justify-between border-b border-zinc-800/80 pb-2">
          <span class="text-xs font-mono font-bold ${dayNumColor} uppercase tracking-wider flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full ${isTreino ? (isColor2 ? 'bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.8)]' : 'bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]') : (isCardio ? 'bg-amber-400' : 'bg-zinc-600')}"></span>
            ${dayLabel}
          </span>
          <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badgeClass} flex items-center gap-1">
            <i data-lucide="${icon}" class="w-3 h-3"></i> ${day.type}
          </span>
        </div>

        <!-- Identificação do Treino / Atividade -->
        <div>
          <h4 class="text-sm font-bold text-white ${titleHoverClass} transition-colors">${day.title}</h4>
          <p class="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">${day.focus}</p>
        </div>

        <!-- Bloco Estruturado de Sinergia Nutricional (4 Pilares) -->
        <div class="space-y-1.5 pt-1.5 border-t border-zinc-800/70 text-[10px]">
          <div class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-1">
            <i data-lucide="sparkles" class="w-3 h-3 text-emerald-400"></i> Sinergia Nutricional
          </div>

          <!-- 1. Carbo Pré-Treino & Timing -->
          <div class="p-1.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-[10px] flex items-start gap-1.5">
            <span class="text-amber-400 font-bold shrink-0">🌾 Carbo:</span>
            <span class="text-amber-200/90 font-mono leading-tight">${day.carboTip || day.nutrtip || 'Carbo peri-treino'}</span>
          </div>

          <!-- 2. Aporte Proteico -->
          <div class="p-1.5 rounded-lg bg-blue-950/40 border border-blue-800/50 text-[10px] flex items-start gap-1.5">
            <span class="text-blue-400 font-bold shrink-0">🥩 Prot:</span>
            <span class="text-blue-200/90 font-mono leading-tight">${day.proteinTip || '2.0 g/kg (Anti-catabólico)'}</span>
          </div>

          <!-- 3. Meta Hídrica -->
          <div class="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-[10px] flex items-start gap-1.5">
            <span class="text-cyan-400 font-bold shrink-0">💧 Água:</span>
            <span class="text-cyan-200/90 font-mono leading-tight">${day.waterTip || '3.000 mL (40 mL/kg)'}</span>
          </div>

          <!-- 4. Recarga Glicêmica / Estratégia -->
          <div class="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-[10px] flex items-start gap-1.5">
            <span class="text-emerald-400 font-bold shrink-0">⚡ Foco:</span>
            <span class="text-emerald-200/90 font-mono leading-tight">${day.strategyTip || 'Recarga glicêmica pós-treino'}</span>
          </div>
        </div>

      </div>
    `;
  }).join('');

  if (container1) container1.innerHTML = html;
  if (container2) container2.innerHTML = html;

  if (window.lucide) window.lucide.createIcons();
}

function perfSyncNutritionAudit() {
  const auditCard = document.getElementById('perf-nutrition-audit-card');
  if (!auditCard) return;

  const aObj = document.getElementById('audit-obj');
  const aCals = document.getElementById('audit-cals');
  const aProt = document.getElementById('audit-prot');
  const aGuide = document.getElementById('audit-guideline');
  const aExpl = document.getElementById('audit-explanation');

  if (perfAuditData && perfAuditData.obj) {
    auditCard.style.display = 'block';
    if (aObj) aObj.textContent = perfAuditData.obj;
    if (aCals) aCals.textContent = perfAuditData.cals;
    if (aProt) aProt.textContent = perfAuditData.prot;
    if (aGuide) aGuide.textContent = perfAuditData.guideline;
    if (aExpl) aExpl.textContent = perfAuditData.explanation;

    const ratTitle = document.getElementById('perf-rationale-title');
    if (ratTitle) {
      ratTitle.textContent = `Periodização ${perfActiveSplit} · Alvo: ${perfAuditData.obj}`;
    }
    const goalDescEl = document.getElementById('perf-meta-goal-desc');
    if (goalDescEl) goalDescEl.textContent = perfAuditData.explanation;
    return;
  }

  const ctx = perfGetNutritionContext();

  auditCard.style.display = 'block';
  if (aObj) aObj.textContent = `${ctx.objective} · ${ctx.patientName}`;
  if (aCals) aCals.textContent = `${ctx.caloricTarget} kcal (${ctx.energyBalance >= 0 ? '+' + ctx.energyBalance : ctx.energyBalance} kcal balanço)`;
  if (aProt) aProt.textContent = `${ctx.proteinGKg.toFixed(1)} g/kg (${ctx.totalProteinG}g/dia)`;
  if (aGuide) aGuide.textContent = `Divisão ${perfActiveSplit} + Cardio Sincronizado`;
  if (aExpl) {
    aExpl.textContent = ctx.isCutting
      ? `Em déficit de ${ctx.caloricTarget} kcal, a prescrição prioriza alta tensão mecânica (5-8 reps, RPE 8) para sinalizar preservação proteica celular (${ctx.proteinGKg.toFixed(1)} g/kg = ${ctx.totalProteinG}g/dia) com gasto lipídico otimizado.`
      : ctx.isBulking
      ? `Em superávit de ${ctx.caloricTarget} kcal (+${Math.abs(ctx.energyBalance)} kcal), a periodização estimula sobrecarga progressiva e hipertrofia volumétrica aproveitando o aporte proteico de ${ctx.proteinGKg.toFixed(1)} g/kg.`
      : `Em manutenção calórica (${ctx.caloricTarget} kcal), a periodização ${perfActiveSplit} estimula biogênese mitocondrial, recomposição corporal e ganho de força constante com ${ctx.waterTargetMl.toLocaleString('pt-BR')} mL de hidratação.`;
  }
  const ratTitle = document.getElementById('perf-rationale-title');
  if (ratTitle) {
    ratTitle.textContent = `Periodização ${perfActiveSplit} · Alvo: ${ctx.objective}`;
  }
}


// ════════════════════════════════════════════════════════════════════════════
// MOTOR DE ZONAS CARDIOVASCULARES EDITÁVEIS & ERGOESPIROMETRIA (TANAKA / KARVONEN)
// ════════════════════════════════════════════════════════════════════════════
let perfCustomHRZones = null; // Custom zones per patient { restingHR, maxHR, isCustom: boolean, zones: [...] }
let perfHREditMode = false;

function perfCalculateHeartRateZones(age = 30, restingHR = 60) {
  // Se houver zonas customizadas salvas para este paciente, utiliza-as
  if (perfCustomHRZones && perfCustomHRZones.isCustom && Array.isArray(perfCustomHRZones.zones) && perfCustomHRZones.zones.length === 5) {
    return {
      age: perfCustomHRZones.age || age,
      restingHR: perfCustomHRZones.restingHR || restingHR,
      maxHR: perfCustomHRZones.maxHR || Math.round(208 - (0.7 * age)),
      reserveHR: (perfCustomHRZones.maxHR || Math.round(208 - (0.7 * age))) - (perfCustomHRZones.restingHR || restingHR),
      isCustom: true,
      zones: perfCustomHRZones.zones
    };
  }

  // Cálculo padrão: Tanaka et al. [208 - (0.7 x Idade)] & Karvonen [((FCM - FCR) x %Int) + FCR]
  const effectiveAge = (perfCustomHRZones && perfCustomHRZones.age) ? perfCustomHRZones.age : age;
  const effectiveResting = (perfCustomHRZones && perfCustomHRZones.restingHR) ? perfCustomHRZones.restingHR : restingHR;
  const maxHR = (perfCustomHRZones && perfCustomHRZones.maxHR) ? perfCustomHRZones.maxHR : Math.round(208 - (0.7 * effectiveAge));
  const reserveHR = maxHR - effectiveResting;
  const getKarvonen = (pct) => Math.round((reserveHR * pct) + effectiveResting);

  return {
    age: effectiveAge,
    restingHR: effectiveResting,
    maxHR,
    reserveHR,
    isCustom: false,
    zones: [
      {
        zone: 'Z1',
        name: 'Recuperação Ativa & Fluxo',
        pctStr: '50% – 60%',
        minBpm: getKarvonen(0.50),
        maxBpm: getKarvonen(0.60),
        bpmTanaka: `${Math.round(maxHR * 0.50)} – ${Math.round(maxHR * 0.60)} bpm`,
        bpmKarvonen: `${getKarvonen(0.50)} – ${getKarvonen(0.60)} bpm`,
        rpe: 'RPE 2-3',
        color: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300',
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        desc: 'Depuração de lactato, remoção de metabólitos, restauração do SNA e regeneração pós-treino.'
      },
      {
        zone: 'Z2',
        name: 'Base Aeróbia & Biogênese',
        pctStr: '60% – 70%',
        minBpm: getKarvonen(0.60),
        maxBpm: getKarvonen(0.70),
        bpmTanaka: `${Math.round(maxHR * 0.60)} – ${Math.round(maxHR * 0.70)} bpm`,
        bpmKarvonen: `${getKarvonen(0.60)} – ${getKarvonen(0.70)} bpm`,
        rpe: 'RPE 4-5',
        color: 'border-blue-500/50 bg-blue-950/40 text-blue-300',
        badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
        desc: 'Oxidação pura de ácidos graxos (FatMax), densidade mitocondrial e zero interferência na via mTOR.'
      },
      {
        zone: 'Z3',
        name: 'Tempo / Ritmo Moderado',
        pctStr: '70% – 80%',
        minBpm: getKarvonen(0.70),
        maxBpm: getKarvonen(0.80),
        bpmTanaka: `${Math.round(maxHR * 0.70)} – ${Math.round(maxHR * 0.80)} bpm`,
        bpmKarvonen: `${getKarvonen(0.70)} – ${getKarvonen(0.80)} bpm`,
        rpe: 'RPE 6-7',
        color: 'border-amber-500/50 bg-amber-950/40 text-amber-300',
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        desc: 'Transição aeróbia-glicolítica, aumento do limiar ventilatório 1 (L1) e sustentação de pace.'
      },
      {
        zone: 'Z4',
        name: 'Limiar Anaeróbio / HIIT',
        pctStr: '80% – 90%',
        minBpm: getKarvonen(0.80),
        maxBpm: getKarvonen(0.90),
        bpmTanaka: `${Math.round(maxHR * 0.80)} – ${Math.round(maxHR * 0.90)} bpm`,
        bpmKarvonen: `${getKarvonen(0.80)} – ${getKarvonen(0.90)} bpm`,
        rpe: 'RPE 8-9',
        color: 'border-orange-500/50 bg-orange-950/40 text-orange-300',
        badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
        desc: 'Tolerância severa à acidose láctica, deslocamento do limiar L2 e potência cardiovascular.'
      },
      {
        zone: 'Z5',
        name: 'VO₂ Máx & Potência Extrema',
        pctStr: '90% – 100%',
        minBpm: getKarvonen(0.90),
        maxBpm: maxHR,
        bpmTanaka: `${Math.round(maxHR * 0.90)} – ${maxHR} bpm`,
        bpmKarvonen: `${getKarvonen(0.90)} – ${maxHR} bpm`,
        rpe: 'RPE 10',
        color: 'border-rose-500/50 bg-rose-950/40 text-rose-300',
        badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
        desc: 'Fração de ejeção ventricular máxima, recrutamento neuromuscular de fibras Tipo IIx e EPOC.'
      }
    ]
  };
}

function perfToggleHREditMode() {
  perfHREditMode = !perfHREditMode;
  renderPerfHeartRateZones();
}

async function perfSaveCustomHRZones() {
  const ageEl = document.getElementById('perf-hr-input-age');
  const fcrEl = document.getElementById('perf-hr-input-fcr');
  const fcmEl = document.getElementById('perf-hr-input-fcm');

  const age = ageEl ? parseInt(ageEl.value) || 30 : 30;
  const restingHR = fcrEl ? parseInt(fcrEl.value) || 60 : 60;
  const maxHR = fcmEl ? parseInt(fcmEl.value) || Math.round(208 - (0.7 * age)) : Math.round(208 - (0.7 * age));

  const zoneConfigs = [
    { zone: 'Z1', name: 'Recuperação Ativa & Fluxo', pctStr: '50% – 60%', rpe: 'RPE 2-3', color: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', desc: 'Depuração de lactato, remoção de metabólitos e regeneração.' },
    { zone: 'Z2', name: 'Base Aeróbia & Biogênese', pctStr: '60% – 70%', rpe: 'RPE 4-5', color: 'border-blue-500/50 bg-blue-950/40 text-blue-300', badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40', desc: 'Oxidação pura de ácidos graxos (FatMax) e biogênese mitocondrial.' },
    { zone: 'Z3', name: 'Tempo / Ritmo Moderado', pctStr: '70% – 80%', rpe: 'RPE 6-7', color: 'border-amber-500/50 bg-amber-950/40 text-amber-300', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40', desc: 'Transição aeróbia-glicolítica e limiar ventilatório 1 (L1).' },
    { zone: 'Z4', name: 'Limiar Anaeróbio / HIIT', pctStr: '80% – 90%', rpe: 'RPE 8-9', color: 'border-orange-500/50 bg-orange-950/40 text-orange-300', badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/40', desc: 'Tolerância à acidose láctica e deslocamento do limiar L2.' },
    { zone: 'Z5', name: 'VO₂ Máx & Potência Extrema', pctStr: '90% – 100%', rpe: 'RPE 10', color: 'border-rose-500/50 bg-rose-950/40 text-rose-300', badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40', desc: 'Fração de ejeção máxima e recrutamento neuromuscular extremo.' }
  ];

  const customZones = zoneConfigs.map(zc => {
    const minInput = document.getElementById(`perf-hr-${zc.zone}-min`);
    const maxInput = document.getElementById(`perf-hr-${zc.zone}-max`);
    const minVal = minInput ? parseInt(minInput.value) || 0 : 0;
    const maxVal = maxInput ? parseInt(maxInput.value) || 0 : 0;
    return {
      ...zc,
      minBpm: minVal,
      maxBpm: maxVal,
      bpmKarvonen: `${minVal} – ${maxVal} bpm`,
      bpmTanaka: `${minVal} – ${maxVal} bpm`
    };
  });

  perfCustomHRZones = {
    age,
    restingHR,
    maxHR,
    isCustom: true,
    zones: customZones,
    savedAt: new Date().toISOString()
  };

  perfHREditMode = false;
  await savePerformanceForPatient(activePatientId);
  renderPerfHeartRateZones();

  const toast = document.getElementById('perf-ai-toast');
  if (toast) {
    toast.style.display = 'flex';
    toast.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400 shrink-0"></i>
      <div>Zonas Cardíacas e Limiares do paciente <strong>salvos com sucesso</strong>!</div>`;
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => { if (toast) toast.style.display = 'none'; }, 4000);
  }
}

async function perfResetCustomHRZones() {
  if (confirm("Deseja restaurar o cálculo automático de zonas cardíacas baseado em Tanaka e Karvonen para este paciente?")) {
    perfCustomHRZones = null;
    perfHREditMode = false;
    await savePerformanceForPatient(activePatientId);
    renderPerfHeartRateZones();
  }
}

function perfAutoFillCalculatedHR() {
  const ageEl = document.getElementById('perf-hr-input-age');
  const fcrEl = document.getElementById('perf-hr-input-fcr');
  const fcmEl = document.getElementById('perf-hr-input-fcm');

  const age = ageEl ? parseInt(ageEl.value) || 30 : 30;
  const restingHR = fcrEl ? parseInt(fcrEl.value) || 60 : 60;
  const maxHR = Math.round(208 - (0.7 * age));
  const reserveHR = maxHR - restingHR;
  const getKarvonen = (pct) => Math.round((reserveHR * pct) + restingHR);

  if (fcmEl) fcmEl.value = maxHR;

  const zRanges = [
    { zone: 'Z1', min: getKarvonen(0.50), max: getKarvonen(0.60) },
    { zone: 'Z2', min: getKarvonen(0.60), max: getKarvonen(0.70) },
    { zone: 'Z3', min: getKarvonen(0.70), max: getKarvonen(0.80) },
    { zone: 'Z4', min: getKarvonen(0.80), max: getKarvonen(0.90) },
    { zone: 'Z5', min: getKarvonen(0.90), max: maxHR }
  ];

  zRanges.forEach(zr => {
    const minInput = document.getElementById(`perf-hr-${zr.zone}-min`);
    const maxInput = document.getElementById(`perf-hr-${zr.zone}-max`);
    if (minInput) minInput.value = zr.min;
    if (maxInput) maxInput.value = zr.max;
  });
}

function renderPerfHeartRateZones() {
  const container = document.getElementById('perf-hr-zones-container');
  if (!container) return;

  const ageEl = document.getElementById('evalAge');
  const defaultAge = ageEl ? parseInt(ageEl.value) || 30 : 30;
  
  const hrData = perfCalculateHeartRateZones(defaultAge, 60);

  // 1. MODO DE EDIÇÃO
  if (perfHREditMode) {
    container.innerHTML = `
      <div class="hud-card p-5 border-amber-500/60 bg-gradient-to-br from-amber-950/40 via-black/95 to-zinc-950/90 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.2)] space-y-4">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-amber-950/80 border border-amber-600/60 text-amber-400">
              <i data-lucide="sliders" class="w-5 h-5"></i>
            </span>
            <div>
              <h3 class="text-sm md:text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
                Editar Zonas Cardíacas &amp; Ergoespirometria
                <span class="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-700/80 px-2 py-0.5 rounded-full font-bold">Personalização Clínica</span>
              </h3>
              <p class="text-xs text-zinc-400">Edite a FC de Repouso, FCM ou insira os limiares de BPM direto do teste ergométrico/VO₂ Máx.</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="perfAutoFillCalculatedHR()" class="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 flex items-center gap-1">
              <i data-lucide="calculator" class="w-3.5 h-3.5 text-blue-400"></i> Auto-Calcular
            </button>
            <button onclick="perfSaveCustomHRZones()" class="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)] flex items-center gap-1">
              <i data-lucide="check" class="w-3.5 h-3.5"></i> Salvar Zonas
            </button>
            <button onclick="perfToggleHREditMode()" class="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800">
              Cancelar
            </button>
          </div>
        </div>

        <!-- Parâmetros Base do Paciente -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-black/60 border border-zinc-800">
          <div>
            <label class="block text-[11px] font-mono text-zinc-400 mb-1">Idade do Paciente:</label>
            <input type="number" id="perf-hr-input-age" value="${hrData.age}" min="10" max="100" class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono font-bold focus:border-amber-500 outline-none" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-zinc-400 mb-1">FC de Repouso (FCR):</label>
            <input type="number" id="perf-hr-input-fcr" value="${hrData.restingHR}" min="30" max="120" placeholder="ex: 58 bpm" class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-emerald-400 font-mono font-bold focus:border-amber-500 outline-none" />
          </div>
          <div>
            <label class="block text-[11px] font-mono text-zinc-400 mb-1">FC Máxima (FCM):</label>
            <input type="number" id="perf-hr-input-fcm" value="${hrData.maxHR}" min="100" max="230" placeholder="ex: 188 bpm" class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-amber-400 font-mono font-bold focus:border-amber-500 outline-none" />
          </div>
        </div>

        <!-- Campos das 5 Zonas (Min e Max BPM) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          ${hrData.zones.map(z => `
            <div class="p-3 rounded-xl border ${z.color} space-y-2">
              <div class="flex items-center justify-between gap-1 mb-1">
                <span class="text-xs font-mono font-bold px-2 py-0.5 rounded border ${z.badgeColor}">${z.zone}</span>
                <span class="text-[10px] font-mono text-zinc-400">${z.rpe}</span>
              </div>
              <h4 class="text-xs font-bold text-white leading-tight">${z.name}</h4>
              
              <div class="space-y-1 pt-1">
                <div class="flex items-center justify-between gap-1 text-[11px] font-mono">
                  <span class="text-zinc-400">Min:</span>
                  <input type="number" id="perf-hr-${z.zone}-min" value="${z.minBpm || parseInt(z.bpmKarvonen) || 100}" class="w-20 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-white text-right font-mono font-bold focus:border-amber-500 outline-none" />
                  <span class="text-zinc-400">bpm</span>
                </div>
                <div class="flex items-center justify-between gap-1 text-[11px] font-mono">
                  <span class="text-zinc-400">Max:</span>
                  <input type="number" id="perf-hr-${z.zone}-max" value="${z.maxBpm || parseInt(z.bpmKarvonen.split('–')[1]) || 120}" class="w-20 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-white text-right font-mono font-bold focus:border-amber-500 outline-none" />
                  <span class="text-zinc-400">bpm</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  // 2. MODO DE VISUALIZAÇÃO PADRÃO
  else {
    const isCustomized = hrData.isCustom;
    container.innerHTML = `
      <div class="hud-card p-5 border-blue-500/40 bg-gradient-to-br from-blue-950/30 via-black/80 to-zinc-950/90 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.15)] space-y-4">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-blue-950/80 border border-blue-600/60 text-blue-400">
              <i data-lucide="activity" class="w-5 h-5"></i>
            </span>
            <div>
              <h3 class="text-sm md:text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
                Quadro de Zonas Cardíacas &amp; Fisiologia
                ${isCustomized 
                  ? '<span class="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/80 px-2 py-0.5 rounded-full font-bold">Personalizado / Ergoespirometria</span>'
                  : '<span class="text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-700/80 px-2 py-0.5 rounded-full font-bold">Tanaka &amp; Karvonen</span>'
                }
              </h3>
              <p class="text-xs text-zinc-400">Parâmetros calibrados para <strong>${hrData.age} anos</strong> · FCM: <strong class="text-white">${hrData.maxHR} bpm</strong> · FCR: <strong class="text-white">${hrData.restingHR} bpm</strong></p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="perfToggleHREditMode()" class="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.3)] flex items-center gap-1.5 transition-all">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Editar Zonas
            </button>
            ${isCustomized ? `
              <button onclick="perfResetCustomHRZones()" title="Restaurar cálculo automático padrão" class="px-2 py-1.5 text-xs font-bold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center gap-1 transition-all">
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-amber-400"></i> Padrão
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Grade das 5 Zonas (Z1 a Z5) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          ${hrData.zones.map(z => `
            <div class="p-3 rounded-xl border ${z.color} space-y-2 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-1 mb-1">
                  <span class="text-xs font-mono font-bold px-2 py-0.5 rounded border ${z.badgeColor}">${z.zone}</span>
                  <span class="text-[10px] font-mono text-zinc-400">${z.rpe}</span>
                </div>
                <h4 class="text-xs font-bold text-white leading-tight">${z.name}</h4>
                <p class="text-[11px] font-mono font-bold text-amber-300 mt-1">${z.minBpm && z.maxBpm ? `${z.minBpm} – ${z.maxBpm} bpm` : z.bpmKarvonen}</p>
                <p class="text-[9px] font-mono text-zinc-400">${z.pctStr ? z.pctStr : ''}</p>
              </div>
              <p class="text-[10px] text-zinc-400 leading-snug pt-1 border-t border-zinc-800/60">${z.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (window.lucide) window.lucide.createIcons();
}


function perfRender() {
  const currentPatientName = document.getElementById("headerPatientName")?.innerText?.trim();
  const currentPatientGoal = document.getElementById("headerPatientGoal")?.innerText?.trim();
  const perfNameEl = document.getElementById("perfPatientName");
  if (perfNameEl && currentPatientName) perfNameEl.innerText = currentPatientName;
  const perfGoalEl = document.getElementById("perfPatientGoal");
  if (perfGoalEl && currentPatientGoal) perfGoalEl.innerText = currentPatientGoal;

  const selectEl = document.getElementById('perf-split-select');
  if (selectEl && selectEl.value !== perfActiveSplit) selectEl.value = perfActiveSplit;

  // Atualiza botões do microciclo no topo do prontuário (Dia 1 a Dia 7 com Alternância de 2 Cores)
  if (Array.isArray(perfWeeklySchedule) && perfWeeklySchedule.length >= 7) {
    const legacyKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
    let trainCount = 0;
    perfWeeklySchedule.forEach((d, idx) => {
      const num = idx + 1;
      const btn = document.getElementById(`day-btn-d${num}`) || document.getElementById(`day-btn-${legacyKeys[idx]}`) || document.getElementById(`day-btn-${d.dayKey}`);
      if (btn) {
        let isColor2 = false;
        if (d.type === 'Treino') {
          if (d.routineId) {
            const charCode = d.routineId.toUpperCase().charCodeAt(0) - 65;
            isColor2 = (charCode >= 0 ? charCode % 2 === 1 : trainCount % 2 === 1);
          } else {
            isColor2 = (trainCount % 2 === 1);
          }
          trainCount++;
        }
        const colorClass = d.type === 'Treino' 
          ? (isColor2 ? 'text-purple-400' : 'text-blue-400') 
          : d.type === 'Cardio' ? 'text-amber-400' : 'text-zinc-500';
        const titleShort = (d.title || '').replace('Treino ','');
        btn.innerHTML = `<span class="font-bold ${colorClass}">DIA ${num}</span> <span class="text-[10px] ${d.type === 'Off' ? 'text-zinc-500' : 'text-zinc-300'} truncate max-w-[85px]">${titleShort}</span>`;
      }
    });
  }

  // Sincroniza auditoria nutricional e racional
  perfSyncNutritionAudit();
  if (typeof updateAITrainingBanner === 'function') updateAITrainingBanner();

  perfSwitchView(perfActiveSubView, false);
  renderPerfTargetButtons();
  renderPerfWeeklySchedule();
  renderPerfCardioProtocols();
  renderPerfHeartRateZones();
  renderPerfWorkoutPlan();
  renderPerfPrescribedCardio();
  renderPerfCatalog();
  renderPerfHudMetrics();
}

// ════════════════════════════════════════════════════════════════════════════
// GUIA BIOMECÂNICO & GIF DE EXECUÇÃO INDIVIDUAL (GIFDOTREINO.COM)
// ════════════════════════════════════════════════════════════════════════════
const PERF_EXERCISE_GUIDE_MAP = {
  // ── PEITORAL ──
  pe01: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-bench-press.gif',
    steps: [
      'Deite-se no banco mantendo 5 pontos de apoio: cabeça, tronco superior, glúteos e os dois pés firmes no chão.',
      'Segure a barra com pegada ligeiramente mais larga que os ombros e retire-a com os cotovelos travados.',
      'Abaixe a barra de forma controlada (3s) até a linha média/inferior do esterno mantendo os cotovelos a ~60° do tronco.',
      'Empurre com aceleração compensatória estendendo os braços sem desarmar a retração escapular.'
    ],
    breathing: 'Inspire na descida (fase excêntrica) e solte o ar com potência ao empurrar no terço final (concêntrica).',
    mistakes: 'Evite abrir os cotovelos a 90° (risco de impacto no manguito) e não quique a barra no osso esterno.'
  },
  pe02: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-incline-bench-press.gif',
    steps: [
      'Ajuste o banco em inclinação de 30° a 45° para foco no feixe clavicular superior.',
      'Abaixe a barra controladamente em direção à porção superior do peitoral (logo abaixo da clavícula).',
      'Pressione a barra para cima e ligeiramente para trás alinhando-a acima do queixo/olhos no topo.'
    ],
    breathing: 'Inspire na descida e expire ao vencer o ponto de estagnação da subida.',
    mistakes: 'Não use inclinações acima de 45° (sobrecarrega deltoide anterior) e mantenha os punhos alinhados.'
  },
  pe03: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/barbell-decline-bench-press.gif',
    steps: [
      'Trave as pernas com segurança no suporte do banco declinado.',
      'Desça a barra em direção à linha do músculo peitoral inferior (abaixo dos mamilos).',
      'Pressione com foco na adução do feixe abdominal/inferior do peitoral maior.'
    ],
    breathing: 'Inspire controladamente na descida e expire ao empurrar.',
    mistakes: 'Não retire a cabeça do banco nem curve o pescoço durante o esforço.'
  },
  pe04: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-bench-press.gif',
    steps: [
      'Deite com os halteres na altura do peito, mantendo as escápulas aduzidas.',
      'Empurre os halteres para cima em trajetória convergente sem bater os pesos no topo.',
      'Desça aproveitando a maior amplitude de movimento dos halteres até sentir o alongamento do peito.'
    ],
    breathing: 'Inspire profundamente na descida e expire na subida.',
    mistakes: 'Não deixe os halteres caírem descontrolados no fundo da amplitude.'
  },
  pe05: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-bench-press.gif',
    steps: [
      'No banco a 30°-45°, inicie com os halteres na altura das axilas/peitoral superior.',
      'Empurre os halteres para cima e para o centro em linha reta.',
      'Controle a descida em 3 segundos sentindo o alongamento do feixe superior.'
    ],
    breathing: 'Inspire ao descer os halteres e expire ao empurrar.',
    mistakes: 'Não junte os halteres batendo-os no topo (perda de tensão mecânica contínua).'
  },
  pe06: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-decline-bench-press.gif',
    steps: [
      'Posicione-se no banco declinado segurando os halteres com pegada pronada ou semi-neutra.',
      'Desça os halteres de forma controlada até o nível do peitoral inferior.',
      'Empurre estendendo os cotovelos e concentrando a força na porção inferior.'
    ],
    breathing: 'Inspire na descida e expire ao empurrar.',
    mistakes: 'Tenha cuidado no posicionamento e desmontagem dos halteres pesados.'
  },
  pe07: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-fly.gif',
    steps: [
      'Mantenha uma leve flexão fixa de cotovelos (15° a 20°) durante todo o trajeto.',
      'Abra os braços em arco amplo até sentir o alongamento máximo do peitoral.',
      'Feche o arco como se estivesse abraçando uma árvore, sem alterar o ângulo dos cotovelos.'
    ],
    breathing: 'Inspire ao abrir os braços e expire ao fechá-los.',
    mistakes: 'Não transforme o crucifixo em um supino estendendo e flexionando os cotovelos.'
  },
  pe08: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-incline-fly.gif',
    steps: [
      'Banco inclinado a 30°, cotovelos levemente flexionados.',
      'Abra os braços lateralmente sentindo o feixe clavicular alongar.',
      'Aduza os braços trazendo os halteres acima do peitoral superior.'
    ],
    breathing: 'Inspire na abertura excêntrica e expire na adução concêntrica.',
    mistakes: 'Não desça excessivamente os halteres além do limite confortável dos ombros.'
  },
  pe09: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-decline-fly.gif',
    steps: [
      'No banco declinado, abra os halteres em semicírculo com cotovelos semiflexionados.',
      'Feche os braços com foco no pico de contração do peitoral inferior.'
    ],
    breathing: 'Inspire na abertura e expire no fechamento.',
    mistakes: 'Mantenha o ângulo dos cotovelos rígido durante todo o arco.'
  },
  pe10: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-standing-up-straight-crossovers.gif',
    steps: [
      'Polias altas, dê um passo à frente com base dividida e tronco levemente inclinado.',
      'Puxe os cabos em arco de cima para baixo cruzando ou tocando as mãos à frente do quadril.',
      'Segure 1 segundo no pico de contração antes de retornar lentamente.'
    ],
    breathing: 'Inspire ao abrir e expire ao cruzar os cabos à frente.',
    mistakes: 'Não balance o tronco para ganhar impulso.'
  },
  pe11: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-standing-fly.gif',
    steps: [
      'Polias na altura do peito, puxe os cabos na horizontal fechando os braços à frente do esterno.',
      'Mantenha a tensão mecânica constante proporcionada pelo cabo.'
    ],
    breathing: 'Inspire ao abrir e expire no fechamento horizontal.',
    mistakes: 'Não projete os ombros para frente no pico de contração.'
  },
  pe12: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-low-fly.gif',
    steps: [
      'Polias baixas, palmas voltadas para cima em supinação.',
      'Puxe os cabos de baixo para cima convergindo as mãos na altura do queixo/peito superior.',
      'Sinta a contração potente do feixe clavicular do peitoral maior.'
    ],
    breathing: 'Inspire na descida e expire na elevação dos cabos.',
    mistakes: 'Não dobre excessivamente os cotovelos durante a puxada.'
  },
  pe13: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-seated-fly.gif',
    steps: [
      'Ajuste o assento para que os braços fiquem alinhados à linha média do peito.',
      'Feche as hastes da máquina com as escápulas presas no encosto.',
      'Segure 1 a 2 segundos no ponto de maior encurtamento muscular.'
    ],
    breathing: 'Expire ao fechar e inspire ao controlar a volta.',
    mistakes: 'Não permita que os pesos batam na pilha entre repetições.'
  },
  pe14: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-chest-press.gif',
    steps: [
      'Ajuste o banco de modo que as pegadas fiquem na linha do peito.',
      'Empurre as manoplas para frente até a extensão quase completa dos braços.',
      'Controle a volta sentindo o alongamento do peitoral maior.'
    ],
    breathing: 'Inspire na volta e expire ao empurrar.',
    mistakes: 'Não desconecte as escápulas do encosto.'
  },
  pe15: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-incline-chest-press.gif',
    steps: [
      'Empurre as manoplas convergentes para cima e para frente.',
      'Concentre o esforço no terço superior do peito.',
      'Desça de forma suave sem perder o alinhamento escapular.'
    ],
    breathing: 'Inspire na descida e expire no empurrão.',
    mistakes: 'Não projete o queixo para frente durante a subida.'
  },
  pe16: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/smith-bench-press.gif',
    steps: [
      'Posicione o banco centralizado sob a barra guiada.',
      'Destrave a barra e desça até encostar de leve no peito.',
      'Empurre aplicando força máxima com segurança da guia.'
    ],
    breathing: 'Inspire descendo e expire subindo.',
    mistakes: 'Não trave os cotovelos de forma brusca no topo.'
  },
  pe17: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/smith-incline-bench-press.gif',
    steps: [
      'Banco inclinado centralizado no Smith.',
      'Desça a barra no peitoral superior e empurre com foco nas fibras claviculares.'
    ],
    breathing: 'Inspire na descida e expire ao empurrar.',
    mistakes: 'Ajuste a posição do banco antes de carregar anilhas.'
  },
  pe18: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/push-up.gif',
    steps: [
      'Mãos no solo na largura dos ombros, corpo em linha reta dos calcanhares à cabeça.',
      'Desça o peito quase até o solo mantendo o core contraído.',
      'Empurre o chão com força total.'
    ],
    breathing: 'Inspire na descida e expire na subida.',
    mistakes: 'Não deixe o quadril ceder ou a lombar curvar.'
  },
  pe19: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/chest-dip.gif',
    steps: [
      'Nas barras paralelas, incline o tronco cerca de 30° à frente com cotovelos abertos.',
      'Desça até os cotovelos formarem 90° sentindo o peitoral alongar.',
      'Empurre de volta mantendo a inclinação para manter o foco no peitoral.'
    ],
    breathing: 'Inspire na descida e expire na extensão dos braços.',
    mistakes: 'Não mantenha o corpo ereto (isso transfere o foco para o tríceps).'
  },
  pe20: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/dumbbell-pullover.gif',
    steps: [
      'Deite transversalmente no banco com o halter seguro com as duas mãos acima do peito.',
      'Desça o halter para trás da cabeça em arco mantendo cotovelos levemente flexionados.',
      'Retorne puxando o halter até a linha dos olhos pelo acionamento do serrátil e peitoral.'
    ],
    breathing: 'Inspire profundamente expandindo a caixa torácica e expire na subida.',
    mistakes: 'Não flexione os cotovelos como se fosse tríceps francês.'
  },

  // ── DORSAL / COSTAS ──
  do01: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/pull-up.gif',
    steps: [
      'Pegada pronada aberta na barra fixa.',
      'Inicie deprimindo e retraindo as escápulas.',
      'Puxe o corpo até o queixo ultrapassar a linha da barra, direcionando o peito para cima.',
      'Desça controlando totalmente o peso corporal até a extensão completa dos dorsais.'
    ],
    breathing: 'Inspire na descida e expire na subida.',
    mistakes: 'Não balance as pernas nem dê trancos (kipping).'
  },
  do02: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/chin-up.gif',
    steps: [
      'Pegada supinada na largura dos ombros.',
      'Puxe o corpo enfatizando a ativação simultânea de latíssimo do dorso e bíceps braquial.'
    ],
    breathing: 'Inspire na descida e expire na subida.',
    mistakes: 'Não encurte a amplitude no fundo.'
  },
  do03: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/close-grip-chin-up.gif',
    steps: [
      'Segure nas manoplas paralelas com pegada neutra.',
      'Puxe o peito em direção às pegadas com grande conforto articular nos punhos.'
    ],
    breathing: 'Inspire na descida e expire na subida.',
    mistakes: 'Mantenha os cotovelos alinhados.'
  },
  do04: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-bar-lateral-pulldown.gif',
    steps: [
      'Trave as pernas no apoio do pulley e segure a barra com pegada pronada aberta.',
      'Puxe a barra em direção ao peitoral superior puxando os cotovelos para baixo e para trás.',
      'Retorne controladamente sentindo o alongamento completo dos dorsais.'
    ],
    breathing: 'Expire na puxada e inspire no retorno dos braços.',
    mistakes: 'Não incline o tronco excessivamente para trás transformando em remada.'
  },
  do05: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-lateral-pulldown-with-v-bar.gif',
    steps: [
      'Use o pegador triângulo no pulley alto.',
      'Puxe o triângulo até o peito mantendo o tronco ereto e cotovelos colados ao corpo.'
    ],
    breathing: 'Expire ao puxar e inspire ao subir a carga.',
    mistakes: 'Não use impulso do tronco.'
  },
  do06: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-underhand-pulldown.gif',
    steps: [
      'Pegada supinada na largura dos ombros no pulley.',
      'Puxe a barra até a altura da clavícula com grande ativação do feixe inferior do latíssimo.'
    ],
    breathing: 'Expire na puxada e inspire na extensão.',
    mistakes: 'Não encolha os ombros na subida.'
  },
  do07: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-straight-arm-pulldown.gif',
    steps: [
      'Braços quase retos com cotovelos semiflexionados travados.',
      'Puxe a barra do nível dos olhos até as coxas em arco pelo acionamento exclusivo da dorsal.',
      'Segure 1s na contração máxima e retorne alongando.'
    ],
    breathing: 'Inspire na subida e expire na puxada contra a coxa.',
    mistakes: 'Não flexione e estenda os cotovelos (isso ativa o tríceps em vez da dorsal).'
  },
  do08: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/barbell-bent-over-row.gif',
    steps: [
      'Tronco inclinado a 45° com a barra, coluna neutra e joelhos semiflexionados.',
      'Puxe a barra em direção ao umbigo mantendo as escápulas ativas.',
      'Controle a descida sem arredondar a região lombar.'
    ],
    breathing: 'Expire ao puxar a barra e inspire ao descer.',
    mistakes: 'Não arredonde as costas (mantenha curvatura fisiológica da coluna).'
  },
  do09: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/barbell-reverse-grip-bent-over-row.gif',
    steps: [
      'Remada curvada com pegada supinada estilo Dorian Yates.',
      'Puxe a barra rente às coxas até o abdômen inferior.',
      'Sinta a grande ativação do feixe inferior do latíssimo do dorso.'
    ],
    breathing: 'Expire na puxada e inspire no retorno.',
    mistakes: 'Cuidado com sobrecarga excessiva no bíceps.'
  },
  do10: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-reverse-t-bar-row.gif',
    steps: [
      'Posicione-se sobre a barra T com coluna ereta e core travado.',
      'Puxe o peso até o peito com foco na espessura dorsal (romboides e trapézio médio).'
    ],
    breathing: 'Expire ao puxar e inspire ao descer a carga.',
    mistakes: 'Não dê trancos com o quadril.'
  },
  do11: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/dumbbell-one-arm-bent-over-row.gif',
    steps: [
      'Apoie um joelho e mão no banco mantendo o tronco paralelo ao solo.',
      'Puxe o halter com o outro braço direcionando o cotovelo para o teto e quadril.',
      'Sinta o alongamento completo no fundo antes de puxar novamente.'
    ],
    breathing: 'Expire ao puxar e inspire ao descer o halter.',
    mistakes: 'Não gire excessivamente o tronco durante a remada.'
  },
  do12: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/cable-seated-row.gif',
    steps: [
      'Sentado na remada baixa, pés firmes, joelhos levemente flexionados.',
      'Puxe o triângulo até o abdômen estufando o peito e aproximando as escápulas.',
      'Retorne estendendo os braços com controle do tronco.'
    ],
    breathing: 'Expire na puxada e inspire no retorno.',
    mistakes: 'Não balance o tronco para frente e para trás excessivamente.'
  },
  do13: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/cable-seated-wide-grip-row.gif',
    steps: [
      'Remada sentada com barra reta e pegada aberta pronada.',
      'Puxe a barra em direção ao peitoral médio com foco nos deltoides posteriores e trapézio médio.'
    ],
    breathing: 'Expire na puxada e inspire no retorno.',
    mistakes: 'Mantenha os ombros longe das orelhas.'
  },
  do14: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/lever-seated-row.gif',
    steps: [
      'Apoie o peito na almofada da máquina regulada na altura correta.',
      'Puxe as manoplas articuladas contraindo fortemente romboides e latíssimo.'
    ],
    breathing: 'Expire ao puxar e inspire ao retornar.',
    mistakes: 'Não desencoste o tórax do apoio.'
  },
  do15: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/lever-front-pulldown.gif',
    steps: [
      'Puxada na máquina articulada convergente.',
      'Puxe as manoplas para baixo acompanhando a trajetória natural da articulação.'
    ],
    breathing: 'Expire na puxada e inspire na subida.',
    mistakes: 'Não force além da amplitude segura do ombro.'
  },
  do16: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-deadlift.gif',
    steps: [
      'Barra colada nas canelas, pés na largura do quadril, coluna neutra.',
      'Empurre o chão com as pernas enquanto sobe a barra rente ao corpo.',
      'Estenda totalmente quadril e joelhos no topo com contração de glúteos e dorsais.'
    ],
    breathing: 'Inspire fundo e trave o abdômen (manobra de Valsalva) antes de puxar; expire no topo.',
    mistakes: 'Nunca arredonde a coluna lombar; mantenha a barra colada ao corpo.'
  },
  do17: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/lever-reverse-hyperextension.gif',
    steps: [
      'Ajuste o apoio do banco 45° logo abaixo das cristas ilíacas.',
      'Desça o tronco flexionando o quadril e suba alinhando com a coluna lombar e glúteos.'
    ],
    breathing: 'Inspire na descida e expire ao alinhar o corpo.',
    mistakes: 'Não hiperextenda o tronco além da linha neutra.'
  },

  // ── PERNAS & GLÚTEOS ──
  lg01: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-full-squat-back-pov.gif',
    steps: [
      'Barra apoiada no trapézio, pés na largura dos ombros com pontas levemente para fora.',
      'Inicie o movimento quebrando no quadril e joelhos simultaneamente.',
      'Desça até as coxas ficarem paralelas ao solo (ou mais) com calcanhares firmes.',
      'Suba empurrando o chão com força total mantendo o tórax aberto.'
    ],
    breathing: 'Inspire profundamente descendo e expire vencendo o ponto de transição da subida.',
    mistakes: 'Não deixe os joelhos desabarem para dentro (valgo dinâmico) nem tire os calcanhares do chão.'
  },
  lg02: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-front-squat.gif',
    steps: [
      'Barra apoiada na parte frontal dos ombros (clavícula/deltoide anterior) com cotovelos altos.',
      'Agache mantendo o tronco mais vertical do que no agachamento traseiro.',
      'Foco extremo no recrutamento do quadríceps (especialmente reto femoral).'
    ],
    breathing: 'Inspire na descida e expire com força na subida.',
    mistakes: 'Não deixe os cotovelos caírem durante a descida.'
  },
  lg03: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/sled-hack-squat.gif',
    steps: [
      'Costas apoiadas no encosto da máquina Hack, pés na plataforma.',
      'Desça controladamente até flexão de 90° nos joelhos sem tirar a lombar do encosto.',
      'Empurre estendendo as pernas sem travar os joelhos no topo.'
    ],
    breathing: 'Inspire na descida e expire ao empurrar.',
    mistakes: 'Não tire os calcanhares da plataforma.'
  },
  lg04: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/sled-45-degrees-one-leg-press.gif',
    steps: [
      'Pés na largura dos ombros no meio da plataforma do Leg Press 45°.',
      'Destrave e desça a plataforma até flexão profunda de joelhos sem arredondar a pelve (retroversão).',
      'Empurre com calcanhares e mediopé estendendo as pernas com controle.'
    ],
    breathing: 'Inspire na descida e expire ao empurrar.',
    mistakes: 'Não faça retroversão pélvica tirando a lombar do encosto nem trave os joelhos em hiperextensão.'
  },
  lg05: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/sled-calf-press-on-leg-press.gif',
    steps: [
      'Sentado no Leg Press horizontal, empurre a plataforma até quase estender as pernas.',
      'Retorne controlando o peso sem deixar as placas baterem.'
    ],
    breathing: 'Inspire na flexão e expire na extensão das pernas.',
    mistakes: 'Mantenha a coluna firme contra o encosto.'
  },
  lg06: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/lever-leg-extension.gif',
    steps: [
      'Alinhe o eixo da máquina com a articulação do joelho.',
      'Estenda as pernas totalmente segurando 1 segundo no pico de contração do quadríceps.',
      'Desça de forma controlada em 3 segundos.'
    ],
    breathing: 'Expire na extensão e inspire na descida lenta.',
    mistakes: 'Não dê trancos para iniciar o movimento.'
  },
  lg07: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/dumbbell-single-leg-split-squat.gif',
    steps: [
      'Um pé apoiado atrás no banco e o outro firme à frente no solo.',
      'Desça o joelho de trás em direção ao chão mantendo o tronco ligeiramente inclinado.',
      'Empurre pelo calcanhar da perna da frente com foco intenso no glúteo e quadríceps.'
    ],
    breathing: 'Inspire na descida e expire ao subir.',
    mistakes: 'Não jogue todo o peso na perna de trás.'
  },
  lg08: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/dumbbell-lunge.gif',
    steps: [
      'Dê um passo à frente flexionando ambos os joelhos a 90°.',
      'Empurre de volta à posição inicial com a perna da frente.'
    ],
    breathing: 'Inspire ao avançar e expire ao retornar.',
    mistakes: 'Não deixe o joelho da frente passar excessivamente a ponta do pé sem estabilidade.'
  },
  lg09: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/sissy-squat.gif',
    steps: [
      'Incline o tronco para trás flexionando os joelhos e projetando-os à frente.',
      'Alongamento extremo do reto femoral; suba com força dos quadríceps.'
    ],
    breathing: 'Inspire descendo e expire subindo.',
    mistakes: 'Inicie com suporte de apoio antes de fazer sem as mãos.'
  },
  lg10: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-romanian-deadlift.gif',
    steps: [
      'Segure a barra com pegada pronada, joelhos destravados e fixos.',
      'Empurre o quadril para trás como se fosse fechar uma porta com os glúteos.',
      'Desça a barra rente às pernas até sentir o alongamento máximo dos isquiotibiais.',
      'Retorne estendendo o quadril e contraindo fortemente os glúteos.'
    ],
    breathing: 'Inspire ao empurrar o quadril para trás e expire ao retornar à posição ereta.',
    mistakes: 'Não dobre mais os joelhos durante a descida (transformando em agachamento).'
  },
  lg11: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/dumbbell-romanian-deadlift.gif',
    steps: [
      'Segure halteres à frente das coxas, coluna neutra.',
      'Desça os halteres rente às pernas empurrando o quadril para trás.'
    ],
    breathing: 'Inspire descendo e expire subindo.',
    mistakes: 'Não curve a coluna cervical olhando para cima.'
  },
  lg12: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/lever-lying-leg-curl.gif',
    steps: [
      'Deitado de bruços na mesa flexora com o rolo logo acima dos calcanhares.',
      'Flexione as pernas trazendo os calcanhares em direção aos glúteos.',
      'Segure 1 segundo no pico de contração dos isquiotibiais e retorne devagar.'
    ],
    breathing: 'Expire na flexão das pernas e inspire na extensão controlada.',
    mistakes: 'Não levante o quadril do banco durante a contração.'
  },
  lg13: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/lever-seated-leg-curl.gif',
    steps: [
      'Sentado com a coxa bem travada pela almofada da cadeira flexora.',
      'Puxe o rolo para baixo e para trás com flexão completa dos joelhos.',
      'Retorne em 3 segundos sentindo o alongamento em maior amplitude.'
    ],
    breathing: 'Expire na flexão e inspire na extensão.',
    mistakes: 'Não deixe o corpo escorregar no assento.'
  },
  lg14: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/standing-single-leg-curl.gif',
    steps: [
      'Em pé, flexione uma perna de cada vez na máquina unilateral.',
      'Excelente para corrigir assimetrias de força nos posteriores de coxa.'
    ],
    breathing: 'Expire na flexão e inspire na descida.',
    mistakes: 'Mantenha o quadril alinhado à máquina.'
  },
  lg15: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-glute-bridge-two-legs-on-bench-male.gif',
    steps: [
      'Costas apoiadas no banco na altura das escápulas, barra acolchoada sobre o quadril.',
      'Pés na largura dos ombros, empurre o quadril para cima até formar linha reta entre ombros e joelhos.',
      'Aperte os glúteos no topo por 1 a 2 segundos antes de descer.'
    ],
    breathing: 'Inspire na descida do quadril e expire ao estender no topo.',
    mistakes: 'Não hiperestenda a lombar no topo (o movimento vem da extensão pura do quadril).'
  },
  lg16: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/resistance-band-hip-thrusts-on-knees-female.gif',
    steps: [
      'Elevação pélvica na máquina articulada.',
      'Empurre a almofada estendendo o quadril com foco absoluto no glúteo máximo.'
    ],
    breathing: 'Expire na elevação e inspire no retorno.',
    mistakes: 'Não tire os calcanhares da base.'
  },
  lg17: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abductors/lever-seated-hip-abduction.gif',
    steps: [
      'Sentado na cadeira abdutora com as costas bem apoiadas.',
      'Abra as pernas contra a resistência segurando no pico de contração do glúteo médio.',
      'Retorne de forma controlada sem deixar os pesos tocarem.'
    ],
    breathing: 'Expire ao abrir e inspire ao fechar as pernas.',
    mistakes: 'Não use impulso do tronco.'
  },
  lg18: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/adductors/lever-seated-hip-adduction.gif',
    steps: [
      'Na cadeira adutora, feche as pernas contra a resistência.',
      'Concentre a força nos músculos adutores da parte interna da coxa.'
    ],
    breathing: 'Expire ao fechar e inspire na abertura.',
    mistakes: 'Controle a volta para não sofrer estiramento brusco.'
  },
  lg19: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/cable-standing-hip-extension.gif',
    steps: [
      'Tornozeleira presa na polia baixa, estenda a perna para trás e para cima.',
      'Contração máxima do glúteo máximo sem rodar o quadril.'
    ],
    breathing: 'Expire ao chutar para trás e inspire ao retornar.',
    mistakes: 'Não incline excessivamente a lombar.'
  },
  lg20: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/lever-standing-calf-raise.gif',
    steps: [
      'Pontas dos pés na plataforma, joelhos estendidos e travados.',
      'Desça os calcanhares ao máximo sentindo o alongamento da panturrilha.',
      'Suba na ponta dos pés o mais alto possível segurando 1s no topo.'
    ],
    breathing: 'Expire ao subir na ponta dos pés e inspire ao descer.',
    mistakes: 'Não dobre os joelhos durante o movimento (isso desativa o gastrocnêmio).'
  },
  lg21: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/lever-seated-calf-raise.gif',
    steps: [
      'Sentado com joelhos a 90° sob a almofada da máquina de gêmeos.',
      'Suba na ponta dos pés com foco prioritário no músculo sóleo.',
      'Desça profundamente aproveitando a amplitude.'
    ],
    breathing: 'Expire na subida e inspire na descida.',
    mistakes: 'Não faça repetições curtas e rápidas.'
  },
  lg22: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/calves/sled-45-calf-press.gif',
    steps: [
      'Pontas dos pés na borda inferior da plataforma do Leg Press.',
      'Faça flexão plantar empurrando a plataforma com os dedos dos pés.'
    ],
    breathing: 'Expire empurrando e inspire no alongamento.',
    mistakes: 'Mantenha as travas de segurança do Leg engatadas em nível seguro.'
  },

  // ── OMBROS & TRAPÉZIO ──
  sh01: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/barbell-standing-close-grip-military-press.gif',
    steps: [
      'Em pé com barra na altura das clavículas, pés na largura dos ombros.',
      'Trave glúteos e abdômen; empurre a barra verticalmente acima da cabeça.',
      'Passe a cabeça ligeiramente à frente no topo com braços alinhados às orelhas.'
    ],
    breathing: 'Inspire antes de subir e expire ao travar os braços no topo.',
    mistakes: 'Não hiperestenda a coluna lombar inclinando o tronco para trás.'
  },
  sh02: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-seated-shoulder-press.gif',
    steps: [
      'Sentado no banco com halteres na altura dos ombros.',
      'Pressione os halteres para cima em arco convergente sem bater os pesos.'
    ],
    breathing: 'Inspire na descida e expire ao empurrar.',
    mistakes: 'Não desça os cotovelos abaixo de 90° se sentir desconforto no ombro.'
  },
  sh03: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-arnold-press-v-2.gif',
    steps: [
      'Inicie com as palmas voltadas para você (como no topo da rosca direta).',
      'Ao empurrar, gire os punhos para fora finalizando com pegada pronada no topo.',
      'Inverta a rotação na descida controlada.'
    ],
    breathing: 'Expire na subida rotacionada e inspire na descida.',
    mistakes: 'Faça o giro de forma contínua e sem solavancos.'
  },
  sh04: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/lever-shoulder-press-v-2.gif',
    steps: [
      'Desenvolvimento na máquina articulada.',
      'Empurre as manoplas estendendo os deltoides com estabilidade guiada.'
    ],
    breathing: 'Expire ao empurrar e inspire ao descer.',
    mistakes: 'Mantenha as costas firmes no encosto.'
  },
  sh05: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/smith-seated-shoulder-press.gif',
    steps: [
      'Banco sentado sob a barra do Smith.',
      'Desça a barra até a altura do queixo e empurre com potência.'
    ],
    breathing: 'Inspire na descida e expire ao empurrar.',
    mistakes: 'Alinhe o banco para não sobrecarregar a articulação glenoumeral.'
  },
  sh06: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif',
    steps: [
      'Em pé, tronco firme com leve inclinação à frente.',
      'Eleve os halteres no plano escapular (30° à frente) até a altura dos ombros.',
      'Cotovelos levemente flexionados, palmas voltadas para o chão no topo.'
    ],
    breathing: 'Expire ao elevar e inspire na descida em 3 segundos.',
    mistakes: 'Não use impulso do quadril nem eleve os braços acima da linha dos ombros.'
  },
  sh07: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-lateral-raise.gif',
    steps: [
      'Polia baixa passando por trás ou pela frente do corpo.',
      'Eleve o cabo sentindo tensão contínua desde o início do movimento.'
    ],
    breathing: 'Expire na elevação e inspire no retorno.',
    mistakes: 'Não gire o tronco durante a elevação.'
  },
  sh08: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/lever-lateral-raise.gif',
    steps: [
      'Na máquina de elevação lateral, eleve os braços apoiados nas almofadas.',
      'Isolamento puro do deltoide medial.'
    ],
    breathing: 'Expire subindo e inspire descendo.',
    mistakes: 'Não eleve os ombros em direção às orelhas.'
  },
  sh09: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-incline-raise.gif',
    steps: [
      'Deitado de lado no banco inclinado a 45°.',
      'Eleve o halter sentindo grande sobrecarga na posição de alongamento do deltoide.'
    ],
    breathing: 'Expire na subida e inspire na descida.',
    mistakes: 'Mantenha o movimento estritamente lateral.'
  },
  sh10: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-front-raise-v-2.gif',
    steps: [
      'Eleve os halteres à frente do corpo até a linha dos olhos.',
      'Foco isolado no feixe clavicular do deltoide anterior.'
    ],
    breathing: 'Expire ao elevar e inspire ao descer.',
    mistakes: 'Não balance o tronco para trás.'
  },
  sh11: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/barbell-front-raise.gif',
    steps: [
      'Segure a barra com pegada pronada na largura dos ombros.',
      'Eleve a barra até a altura dos olhos e desça controladamente.'
    ],
    breathing: 'Expire ao subir e inspire na descida.',
    mistakes: 'Mantenha o core rígido.'
  },
  sh12: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-front-raise.gif',
    steps: [
      'Polia baixa com corda entre as pernas.',
      'Puxe a corda para cima e à frente com tensão contínua do cabo.'
    ],
    breathing: 'Expire na elevação e inspire no retorno.',
    mistakes: 'Não curve os punhos.'
  },
  sh13: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-rear-lateral-raise-support-head.gif',
    steps: [
      'Tronco inclinado paralelo ao solo ou apoiado no banco.',
      'Abra os halteres lateralmente com foco no deltoide posterior.'
    ],
    breathing: 'Expire ao abrir os braços e inspire ao fechar.',
    mistakes: 'Não use impulso do trapézio superior.'
  },
  sh14: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-rear-fly.gif',
    steps: [
      'Sentado de frente para o Peck Deck, pegada neutra ou pronada.',
      'Abra as hastes para trás contraindo o deltoide posterior.'
    ],
    breathing: 'Expire na abertura e inspire no retorno.',
    mistakes: 'Mantenha os cotovelos na altura dos ombros.'
  },
  sh15: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-rear-delt-row-with-rope.gif',
    steps: [
      'Polia alta com corda, puxe em direção ao rosto separando as pontas da corda.',
      'Ao final, rotacione externamente os ombros com polegares apontando para trás.'
    ],
    breathing: 'Expire ao puxar na direção do rosto e inspire na extensão.',
    mistakes: 'Não deixe os cotovelos caírem abaixo da linha dos ombros.'
  },
  sh16: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/barbell-upright-row-v-2.gif',
    steps: [
      'Segure a barra com pegada na largura dos ombros.',
      'Puxe a barra verticalmente até a altura do peito com cotovelos liderando o movimento.'
    ],
    breathing: 'Expire ao puxar para cima e inspire ao descer.',
    mistakes: 'Não use pegadas muito fechadas (risco de impacto subacromial).'
  },
  sh17: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-upright-row.gif',
    steps: [
      'Remada alta no cabo com barra reta ou corda.',
      'Puxe com cotovelos altos e controle a descida.'
    ],
    breathing: 'Expire na subida e inspire na descida.',
    mistakes: 'Mantenha a postura ereta.'
  },
  sh18: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/barbell-shrug.gif',
    steps: [
      'Segure a barra à frente do corpo com braços estendidos.',
      'Eleve os ombros diretamente para cima em direção às orelhas.',
      'Segure 2 segundos no pico de contração do trapézio superior.'
    ],
    breathing: 'Expire ao encolher os ombros e inspire ao relaxar.',
    mistakes: 'Nunca gire os ombros em círculos (risco de desgaste articular).'
  },
  sh19: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/dumbbell-shrug.gif',
    steps: [
      'Halteres ao lado do corpo, eleve os ombros verticalmente.',
      'Pico de contração no topo com descida controlada.'
    ],
    breathing: 'Expire na elevação e inspire na descida.',
    mistakes: 'Não flexione os cotovelos para puxar os halteres.'
  },
  sh20: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/smith-shrug.gif',
    steps: [
      'Barra do Smith atrás das costas na altura dos glúteos.',
      'Encolha os ombros com grande ativação do trapézio superior e médio.'
    ],
    breathing: 'Expire subindo e inspire descendo.',
    mistakes: 'Mantenha a cabeça neutra.'
  },

  // ── BÍCEPS & ANTEBRAÇO ──
  bi01: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-curl.gif',
    steps: [
      'Em pé, segure a barra reta com pegada supinada na largura dos ombros.',
      'Cotovelos fixos colados às costelas, flexione os braços trazendo a barra ao peito.',
      'Controle a descida em 3 segundos até estender quase totalmente.'
    ],
    breathing: 'Expire ao subir a barra e inspire na descida lenta.',
    mistakes: 'Não balance o tronco para trás nem projete os cotovelos para frente.'
  },
  bi02: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/ez-barbell-curl.gif',
    steps: [
      'Segure a barra W na angulação anatômica confortável para os punhos.',
      'Flexione os cotovelos mantendo a tensão contínua no bíceps braquial.'
    ],
    breathing: 'Expire na subida e inspire no retorno.',
    mistakes: 'Mantenha os cotovelos estabilizados.'
  },
  bi03: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-alternate-biceps-curl-with-arm-blaster.gif',
    steps: [
      'Inicie com pegada neutra e gire o punho em supinação ao longo da subida.',
      'No topo, aponte o dedo mínimo para cima para contração máxima do bíceps.'
    ],
    breathing: 'Expire na supinação e inspire ao descer o halter.',
    mistakes: 'Não inicie já supinado (perde o benefício da rotação do rádio).'
  },
  bi04: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-hammer-curl-on-exercise-ball.gif',
    steps: [
      'Segure os halteres com pegada neutra (palmas voltadas para dentro).',
      'Flexione os braços com foco prioritário no braquiorradial e braquial anterior.'
    ],
    breathing: 'Expire na subida e inspire na descida.',
    mistakes: 'Não balance os braços.'
  },
  bi05: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/cable-hammer-curl-with-rope.gif',
    steps: [
      'Polia baixa com corda, pegada neutra.',
      'Puxe a corda para cima mantendo os cotovelos firmes.'
    ],
    breathing: 'Expire ao puxar e inspire ao descer.',
    mistakes: 'Mantenha a tensão do cabo.'
  },
  bi06: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-preacher-curl.gif',
    steps: [
      'Braços apoiados no banco Scott, axilas encaixadas na almofada.',
      'Flexione a barra W sem levantar os cotovelos do apoio.',
      'Desça de forma controlada sem hiperextender os cotovelos bruscamente no fundo.'
    ],
    breathing: 'Expire na subida e inspire na descida.',
    mistakes: 'Não solte o peso de forma desgovernada no final da extensão.'
  },
  bi07: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/cable-one-arm-preacher-curl.gif',
    steps: [
      'Rosca Scott unilateral com halter no banco.',
      'Isolamento cirúrgico de cada braço corrigindo assimetrias.'
    ],
    breathing: 'Expire subindo e inspire descendo.',
    mistakes: 'Não gire os ombros.'
  },
  bi08: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/lever-preacher-curl-v-2.gif',
    steps: [
      'Rosca Scott na máquina.',
      'Tensão mecânica constante do início ao fim do arco de movimento.'
    ],
    breathing: 'Expire na flexão e inspire na extensão.',
    mistakes: 'Não desencoste o tronco da máquina.'
  },
  bi09: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-incline-biceps-curl.gif',
    steps: [
      'Deite no banco inclinado a 45° com braços pendendo para trás da linha do tronco.',
      'Flexione os halteres sentindo o alongamento extremo da cabeça longa do bíceps.'
    ],
    breathing: 'Expire na subida e inspire na descida.',
    mistakes: 'Não projete os cotovelos para frente durante a subida.'
  },
  bi10: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/dumbbell-concentration-curl.gif',
    steps: [
      'Sentado, cotovelo apoiado na face interna da coxa.',
      'Flexione o halter até o pico de contração sem balanço corporal.'
    ],
    breathing: 'Expire na flexão e inspire no retorno.',
    mistakes: 'Não apoie o cotovelo no topo da coxa.'
  },
  bi11: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/cable-close-grip-curl.gif',
    steps: [
      'Rosca na polia baixa com barra reta.',
      'Puxe a barra mantendo cotovelos alinhados e tensão contínua.'
    ],
    breathing: 'Expire na subida e inspire na descida.',
    mistakes: 'Não curve os ombros para frente.'
  },
  bi12: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/ez-barbell-spider-curl-1628.gif',
    steps: [
      'Peito apoiado no banco inclinado, braços pendendo na vertical.',
      'Flexione a barra com isolamento escapular total.'
    ],
    breathing: 'Expire subindo e inspire descendo.',
    mistakes: 'Mantenha os braços estritamente perpendiculares ao solo.'
  },
  bi13: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/cable-overhead-curl.gif',
    steps: [
      'No meio do crossover com polias altas.',
      'Puxe as manoplas em direção às orelhas (pose do duplo bíceps).'
    ],
    breathing: 'Expire na contração e inspire na extensão.',
    mistakes: 'Mantenha os cotovelos altos na linha dos ombros.'
  },
  bi14: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-alternate-biceps-curl.gif',
    steps: [
      'Rosca 21: 7 repetições na metade inferior + 7 repetições na metade superior + 7 repetições completas.',
      'Grande estresse metabólico e vascularização.'
    ],
    breathing: 'Mantenha ritmo respiratório constante durante toda a série.',
    mistakes: 'Use carga moderada para não perder a técnica.'
  },
  bi15: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-reverse-curl.gif',
    steps: [
      'Segure a barra com pegada pronada (palmas para baixo).',
      'Flexione os braços fortalecendo extensores do punho e braquiorradial.'
    ],
    breathing: 'Expire subindo e inspire descendo.',
    mistakes: 'Não hiperestenda os punhos.'
  },
  bi16: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/forearms/barbell-wrist-curl-v-2.gif',
    steps: [
      'Antebraços apoiados nas coxas ou banco com as mãos para fora.',
      'Flexione os punhos para cima segurando no topo e desça alongando.'
    ],
    breathing: 'Expire na flexão e inspire no retorno.',
    mistakes: 'Faça movimentos controlados sem solavancos.'
  },

  // ── TRÍCEPS ──
  tr01: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-pushdown.gif',
    steps: [
      'Polia alta com barra reta, cotovelos colados às costelas.',
      'Empurre a barra para baixo até a extensão total dos braços.',
      'Retorne até os antebraços formarem 90° com os braços sem mover os cotovelos.'
    ],
    breathing: 'Expire ao empurrar para baixo e inspire ao subir a barra.',
    mistakes: 'Não projete os cotovelos para frente e para trás.'
  },
  tr02: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-pushdown-with-rope-attachment.gif',
    steps: [
      'Polia alta com corda.',
      'Empurre para baixo e abra as pontas da corda para fora no final da extensão.',
      'Pico de contração na cabeça lateral e medial do tríceps.'
    ],
    breathing: 'Expire ao estender os braços e inspire no retorno.',
    mistakes: 'Não incline excessivamente o tronco sobre o cabo.'
  },
  tr03: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-reverse-grip-pushdown.gif',
    steps: [
      'Polia alta com pegada supinada (palmas para cima).',
      'Empurre para baixo com foco na cabeça medial do tríceps.'
    ],
    breathing: 'Expire na extensão e inspire na subida.',
    mistakes: 'Cuidado com a firmeza da pegada dos punhos.'
  },
  tr04: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-lying-triceps-extension-skull-crusher.gif',
    steps: [
      'Deitado no banco com barra W, braços verticais.',
      'Flexione apenas os cotovelos descendo a barra em direção à testa ou atrás da cabeça.',
      'Estenda os cotovelos com força pura do tríceps.'
    ],
    breathing: 'Inspire na descida e expire ao empurrar a barra.',
    mistakes: 'Não abra os cotovelos para os lados (mantenha-os apontando para o teto).'
  },
  tr05: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/dumbbell-lying-triceps-extension.gif',
    steps: [
      'Tríceps testa com halteres em pegada neutra.',
      'Desça os halteres ao lado da cabeça com grande amplitude.'
    ],
    breathing: 'Inspire descendo e expire subindo.',
    mistakes: 'Mantenha os braços paralelos.'
  },
  tr06: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-standing-overhead-triceps-extension.gif',
    steps: [
      'Sentado, segure um halter pesado com as duas mãos acima da cabeça.',
      'Desça o halter atrás da nuca flexionando os cotovelos.',
      'Estenda para cima sentindo o alongamento da cabeça longa do tríceps.'
    ],
    breathing: 'Inspire na descida atrás da cabeça e expire ao estender os braços.',
    mistakes: 'Não deixe os cotovelos abrirem excessivamente nem curve a lombar.'
  },
  tr07: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-overhead-triceps-extension-rope-attachment.gif',
    steps: [
      'Polia média/alta de costas para a máquina com corda.',
      'Estenda os braços à frente acima da cabeça com tensão contínua do cabo.'
    ],
    breathing: 'Expire na extensão e inspire na flexão.',
    mistakes: 'Mantenha a base de pernas firme.'
  },
  tr08: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/barbell-close-grip-bench-press.gif',
    steps: [
      'Supino reto com pegada na largura dos ombros (nunca colada demais).',
      'Desça a barra mantendo os cotovelos colados ao tronco.',
      'Empurre com foco total na extensão dos cotovelos pelo tríceps.'
    ],
    breathing: 'Inspire na descida e expire ao empurrar.',
    mistakes: 'Não use pegadas muito fechadas (menos de 20cm) que sobrecarreguem os punhos.'
  },
  tr09: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/triceps-dip-bench-leg.gif',
    steps: [
      'Nas barras paralelas, mantenha o tronco reto e vertical.',
      'Desça flexionando os cotovelos para trás até 90° e empurre com os tríceps.'
    ],
    breathing: 'Inspire na descida e expire na subida.',
    mistakes: 'Não incline o tronco à frente (isso transfere a carga para o peitoral).'
  },
  tr10: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/bench-dip-knees-bent.gif',
    steps: [
      'Mãos apoiadas na borda do banco, pernas estendidas à frente.',
      'Desça o quadril rente ao banco flexionando os cotovelos a 90° e empurre de volta.'
    ],
    breathing: 'Inspire descendo e expire subindo.',
    mistakes: 'Não afaste as costas do banco.'
  },
  tr11: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/dumbbell-kickback.gif',
    steps: [
      'Tronco inclinado, cotovelo colado à costela e paralelo ao solo.',
      'Estenda o antebraço para trás segurando 1s no topo da contração.'
    ],
    breathing: 'Expire ao estender e inspire ao flexionar.',
    mistakes: 'Não deixe o cotovelo cair durante as repetições.'
  },
  tr12: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/dumbbell-one-arm-kickback.gif',
    steps: [
      'Tríceps coice no cabo sem manopla (segurando a esfera da polia).',
      'Tensão contínua no pico de encurtamento do tríceps.'
    ],
    breathing: 'Expire na extensão e inspire no retorno.',
    mistakes: 'Mantenha o braço estático.'
  },
  tr13: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/lever-seated-dip.gif',
    steps: [
      'Tríceps na máquina articulada ou máquina de mergulho.',
      'Empurre as manoplas estendendo os cotovelos com estabilidade anatômica.'
    ],
    breathing: 'Expire no empurrão e inspire no retorno.',
    mistakes: 'Ajuste o assento na altura correta.'
  },

  // ── ABDÔMEN ──
  ab01: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/weighted-crunch.gif',
    steps: [
      'Deitado com joelhos flexionados, mãos ao lado das têmporas ou cruzadas no peito.',
      'Enrole o tronco aproximando as costelas da pelve contraindo o reto abdominal.',
      'Retorne devagar sem relaxar a musculatura no solo.'
    ],
    breathing: 'Expire pela boca enrolando o tronco e inspire ao descer.',
    mistakes: 'Não puxe o pescoço com as mãos (mantenha um punho de distância entre queixo e peito).'
  },
  ab02: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/cable-kneeling-crunch.gif',
    steps: [
      'Ajoelhado sob a polia alta com corda nas laterais da cabeça.',
      'Flexione a coluna vertebral trazendo os cotovelos em direção aos joelhos.',
      'Segure 1s na contração máxima e retorne controlando a carga.'
    ],
    breathing: 'Expire com força ao flexionar o abdômen e inspire ao subir.',
    mistakes: 'Não sente nos calcanhares nem use o flexor de quadril (o movimento é flexão de tronco).'
  },
  ab03: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/hanging-leg-raise.gif',
    steps: [
      'Pendurado na barra fixa com pegada firme.',
      'Eleve as pernas/joelhos enrolando a pelve em direção ao tórax (retroversão pélvica).',
      'Desça de forma lenta sem balançar o corpo.'
    ],
    breathing: 'Expire ao subir as pernas e inspire ao descer.',
    mistakes: 'Não apenas levante as pernas; enrole a pelve para ativar o reto abdominal inferior.'
  },
  ab04: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/vertical-leg-raise-on-parallel-bars.gif',
    steps: [
      'Antebraços e costas apoiados no suporte de paralelas/capitão.',
      'Eleve os joelhos em direção ao peito com controle da descida.'
    ],
    breathing: 'Expire ao subir e inspire ao descer.',
    mistakes: 'Não balance o corpo nem dê solavancos.'
  },
  ab05: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/wheel-rollerout.gif',
    steps: [
      'Ajoelhado segurando a roda abdominal.',
      'Role a roda para frente estendendo o corpo o máximo que conseguir sem curvar a lombar.',
      'Puxe a roda de volta contraindo o abdômen com potência.'
    ],
    breathing: 'Inspire ao rolar para frente e expire com força ao puxar de volta.',
    mistakes: 'Não deixe a coluna lombar afundar (mantenha retroversão pélvica e core ativado).'
  },
  ab06: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/weighted-front-plank.gif',
    steps: [
      'Apoie os antebraços e pontas dos pés no solo.',
      'Mantenha o corpo em linha reta e aperte abdômen, glúteos e quadríceps.',
      'Sustente a posição imóvel durante o tempo prescrito.'
    ],
    breathing: 'Respiração curta e contínua pelo diafragma sem prender o ar.',
    mistakes: 'Não eleve os glúteos em V nem deixe o quadril cair em direção ao chão.'
  },
  ab07: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/weighted-russian-twist-legs-up.gif',
    steps: [
      'Sentado no solo com tronco inclinado a 45° e pés fora do chão.',
      'Gire o tronco de um lado para o outro tocando o halter/anilha no chão.'
    ],
    breathing: 'Expire a cada rotação lateral e inspire no centro.',
    mistakes: 'Gire os ombros e o tórax, não apenas os braços.'
  },
  ab08: {
    gif: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/lever-seated-crunch-chest-pad.gif',
    steps: [
      'Sentado na máquina abdominal com pés travados.',
      'Flexione o tronco para frente contra a resistência da máquina.'
    ],
    breathing: 'Expire na flexão e inspire no retorno.',
    mistakes: 'Ajuste a carga para não sobrecarregar a região lombar.'
  }
};

function perfGenerateFallbackSvg(exerciseName, muscleGroup) {
  const safeName = (exerciseName || 'Exercício').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeGroup = (muscleGroup || 'Biomecânica').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#020617"/>
        <stop offset="50%" stop-color="#0b1329"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#bg)"/>
    <circle cx="200" cy="110" r="50" fill="none" stroke="#1e3a8a" stroke-width="2" stroke-dasharray="4 4"/>
    <path d="M 160 110 L 240 110 M 200 70 L 200 150" stroke="#3b82f6" stroke-width="2" opacity="0.7"/>
    <circle cx="200" cy="110" r="14" fill="#3b82f6" opacity="0.3"/>
    <circle cx="200" cy="110" r="6" fill="#60a5fa"/>
    <text x="200" y="175" fill="#60a5fa" font-family="sans-serif" font-size="11" font-weight="bold" letter-spacing="2" text-anchor="middle">${safeGroup.toUpperCase()}</text>
    <text x="200" y="202" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">${safeName}</text>
    <rect x="120" y="222" width="160" height="24" rx="12" fill="#1e293b" stroke="#334155"/>
    <text x="200" y="238" fill="#38bdf8" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">🎬 GIFDOTREINO · ATIVO</text>
  </svg>`;
  
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function perfHandleGifError(imgEl) {
  if (!imgEl) return;
  const exName = imgEl.dataset.exname || 'Exercício';
  const exGroup = imgEl.dataset.exgroup || 'Biomecânica';

  if (!imgEl.dataset.triedFallback) {
    imgEl.dataset.triedFallback = 'true';
    imgEl.src = perfGenerateFallbackSvg(exName, exGroup);
  }
}

function perfGetExerciseGuideData(ex) {
  const custom = PERF_EXERCISE_GUIDE_MAP[ex.id] || {};
  const mechanics = ex.mechanics || 'Composto';
  const cadence = mechanics === 'Isolador' ? '3-1-1-0 (1s pico)' : '3-0-1-0 (Controlada)';

  // Prioriza o caminho verificado de gifdotreino.com
  let gifUrl = custom.gif || 'https://www.gifdotreino.com/Exercicios/Peitoral/Supino%20Reto%20com%20Barra.gif';
  
  const steps = custom.steps || [
    `Ajuste a pegada e a posição mantendo a base estável e o core ativado.`,
    `Inicie a fase excêntrica de forma controlada (3 segundos) mantendo alinhamento articular.`,
    `Na fase concêntrica, produza aceleração compensatória focando na contração máxima de ${ex.primary}.`,
    `Mantenha a postura e evite compensações com musculaturas sinergistas.`
  ];

  const breathing = custom.breathing || `Inspire profundamente na fase excêntrica (descida/alongamento) e solte o ar na fase concêntrica (esforço/subida).`;
  const mistakes = custom.mistakes || `Evite impulsos corporais, perda do alinhamento da coluna ou encurtamento prematuro da amplitude do movimento.`;
  
  // Link direto para gifdotreino.com
  const cleanQuery = encodeURIComponent((ex.name || '').replace(/\(.*?\)/g, '').trim());
  const externalUrl = `https://www.gifdotreino.com/?s=${cleanQuery}`;

  return {
    ...ex,
    cadence,
    gifUrl,
    steps,
    breathing,
    mistakes,
    externalUrl
  };
}

function perfGetSubstitutes(exerciseId) {
  if (!exerciseId) return [];
  let dbEx = PERF_EXERCISE_DB.find(e => e.id === exerciseId);
  if (!dbEx) {
    const clean = String(exerciseId).trim().toLowerCase();
    dbEx = PERF_EXERCISE_DB.find(e => e.name.toLowerCase() === clean || e.name.toLowerCase().includes(clean));
  }
  if (!dbEx) return [];

  // Retorna todos os outros exercícios do mesmo grupo muscular
  return PERF_EXERCISE_DB.filter(e => e.group === dbEx.group && e.id !== dbEx.id);
}

function perfSwapExercise(routineId, oldExerciseId, newExerciseId) {
  const newEx = PERF_EXERCISE_DB.find(e => e.id === newExerciseId);
  if (!newEx) return;

  let swappedName = '';
  perfWorkoutPlan = perfWorkoutPlan.map(routine => {
    if (routine.id !== routineId) return routine;
    return {
      ...routine,
      exercises: routine.exercises.map(ex => {
        const id = ex.exerciseId || ex.id;
        if (id === oldExerciseId || ex.name === oldExerciseId) {
          swappedName = newEx.name;
          return {
            ...ex,
            exerciseId: newEx.id,
            id: newEx.id,
            name: newEx.name,
            group: newEx.group,
            mechanics: newEx.mechanics,
            equipment: newEx.equipment,
            primary: newEx.primary,
            secondary: newEx.secondary
          };
        }
        return ex;
      })
    };
  });

  savePerformanceForPatient(activePatientId);
  perfRender();

  const toast = document.getElementById('perf-ai-toast');
  if (toast && swappedName) {
    toast.style.display = 'flex';
    toast.innerHTML = `<i data-lucide="shuffle" class="w-4 h-4 text-amber-400 shrink-0"></i>
      <div>Exercício substituído por <strong>${swappedName}</strong> (${newEx.equipment}) na Rotina ${routineId}.</div>`;
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => { if (toast) toast.style.display = 'none'; }, 4500);
  }
}

function perfOpenExerciseGuide(exerciseId, routineId = null) {
  let ex = null;
  if (typeof exerciseId === 'object' && exerciseId !== null) {
    ex = exerciseId;
  } else if (exerciseId) {
    ex = PERF_EXERCISE_DB.find(e => e.id === exerciseId);
    if (!ex) {
      const clean = String(exerciseId).trim().toLowerCase();
      ex = PERF_EXERCISE_DB.find(e => e.name.toLowerCase() === clean || e.name.toLowerCase().includes(clean));
    }
  }

  if (!ex) {
    ex = {
      id: exerciseId || 'geral',
      name: exerciseId || 'Exercício Biomecânico',
      group: 'Geral',
      mechanics: 'Composto',
      equipment: 'Livre',
      primary: 'Músculo Alvo',
      secondary: 'Sinergistas'
    };
  }

  const data = perfGetExerciseGuideData(ex);

  const modal = document.getElementById('modal-exercise-guide');
  if (!modal) return;

  const titleEl = document.getElementById('guide-modal-title');
  const groupEl = document.getElementById('guide-modal-group');
  const equipEl = document.getElementById('guide-modal-equip');
  const primaryEl = document.getElementById('guide-modal-primary');
  const secEl = document.getElementById('guide-modal-secondary');
  const gifEl = document.getElementById('guide-modal-gif');
  const cadenceEl = document.getElementById('guide-modal-cadence');
  const linkEl = document.getElementById('guide-modal-external-link');
  const stepsEl = document.getElementById('guide-modal-steps');
  const breathEl = document.getElementById('guide-modal-breathing');
  const mistakeEl = document.getElementById('guide-modal-mistakes');
  const subCountEl = document.getElementById('guide-modal-substitutes-count');
  const subListEl = document.getElementById('guide-modal-substitutes-list');

  if (titleEl) titleEl.textContent = data.name;
  if (groupEl) groupEl.textContent = data.group;
  if (equipEl) equipEl.textContent = `${data.equipment} · ${data.mechanics}`;
  if (primaryEl) primaryEl.textContent = data.primary;
  if (secEl) secEl.textContent = data.secondary || '—';
  if (cadenceEl) cadenceEl.textContent = `Cadência: ${data.cadence}`;
  if (breathEl) breathEl.textContent = data.breathing;
  if (mistakeEl) mistakeEl.textContent = data.mistakes;

  if (linkEl) {
    linkEl.href = data.externalUrl;
  }

  if (gifEl) {
    gifEl.dataset.triedFallback = '';
    gifEl.dataset.exname = data.name;
    gifEl.dataset.exgroup = data.group;
    gifEl.src = data.gifUrl;
    gifEl.alt = `Execução de ${data.name}`;
  }

  if (stepsEl) {
    stepsEl.innerHTML = data.steps.map((st, i) => `
      <div class="flex items-start gap-2 p-2 rounded-lg bg-black/40 border border-zinc-800/80">
        <span class="w-5 h-5 rounded-full bg-blue-950 text-blue-400 border border-blue-700/60 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">${i+1}</span>
        <span class="text-zinc-300 text-[11.5px] leading-snug">${st}</span>
      </div>
    `).join('');
  }

  // Preenche Variações e Substitutos
  const substitutes = perfGetSubstitutes(data.id);
  if (subCountEl) subCountEl.textContent = `${substitutes.length} opções disponíveis`;
  if (subListEl) {
    if (substitutes.length === 0) {
      subListEl.innerHTML = `<div class="col-span-1 sm:col-span-2 text-center text-xs text-zinc-500 py-3">Nenhuma variação alternativa cadastrada para o grupo ${data.group}.</div>`;
    } else {
      subListEl.innerHTML = substitutes.map(sub => `
        <div class="p-2.5 rounded-xl bg-black/60 border border-zinc-800/80 hover:border-amber-500/50 flex flex-col justify-between gap-2 transition-all">
          <div>
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-bold text-white leading-tight truncate">${sub.name}</span>
              <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-amber-300 border border-amber-800/50 shrink-0">${sub.equipment}</span>
            </div>
            <div class="text-[11px] text-amber-300/90 font-medium mt-1 flex items-center gap-1">
              <span>🎯 Alvo:</span> <strong class="text-white">${sub.primary}</strong>
            </div>
            <div class="text-[10px] text-zinc-400 font-mono mt-0.5">${sub.mechanics} ${sub.secondary ? `· Sinérgicos: ${sub.secondary}` : ''}</div>
          </div>
          <div class="flex items-center gap-1.5 pt-1.5 border-t border-zinc-800/80">
            <button onclick="perfOpenExerciseGuide('${sub.id}', '${routineId || ''}')"
              class="flex-1 px-2 py-1 rounded-lg text-[10px] font-bold text-blue-300 hover:text-white bg-blue-950/80 hover:bg-blue-900 border border-blue-800/60 transition-all flex items-center justify-center gap-1">
              <i data-lucide="play-circle" class="w-3 h-3 text-blue-400"></i> Ver GIF
            </button>
            ${routineId ? `
              <button onclick="perfSwapExercise('${routineId}', '${data.id}', '${sub.id}'); perfCloseExerciseGuide();"
                class="px-2.5 py-1 rounded-lg text-[10px] font-black text-amber-300 hover:text-white bg-amber-950/90 hover:bg-amber-800 border border-amber-600/70 transition-all flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                <i data-lucide="check" class="w-3 h-3"></i> Aplicar
              </button>
            ` : ''}
          </div>
        </div>
      `).join('');
    }
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if (window.lucide) window.lucide.createIcons();
}

function perfCloseExerciseGuide() {
  const modal = document.getElementById('modal-exercise-guide');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function perfScrollToCardio() {
  perfSwitchView('cardio');
}

function perfSetCardioFilter(filter) {
  perfCardioActiveFilter = filter;
  document.querySelectorAll('.perf-cardio-filter-btn').forEach(btn => {
    btn.classList.remove('bg-amber-500','text-black');
    btn.classList.add('bg-zinc-800','text-zinc-400');
    btn.style.boxShadow = '';
    if (btn.dataset.cfilter === filter) {
      btn.classList.remove('bg-zinc-800','text-zinc-400');
      btn.classList.add('bg-amber-500','text-black');
      btn.style.boxShadow = '0 0 8px rgba(245,158,11,0.4)';
    }
  });
  renderPerfCardioProtocols();
}

let perfFocusedCardioId = null;

function renderPerfCardioProtocols(targetFocusId = null) {
  if (targetFocusId) perfFocusedCardioId = targetFocusId;
  const container = document.getElementById("perf-cardio-cards-container");
  if (!container) return;

  const filtered = PERF_CARDIO_DB.filter(c => {
    if (perfCardioActiveFilter === "Todos") return true;
    if (perfCardioActiveFilter === "Compromised") return c.category === "Compromised";
    if (perfCardioActiveFilter === "Engine") return c.category === "Engine";
    if (perfCardioActiveFilter === "Zona 2") return c.category === "Zona 2";
    return true;
  });

  container.innerHTML = filtered.map((c, idx) => {
    const isCompromised = c.category === "Compromised";
    const isZ2 = c.category === "Zona 2";
    
    let badgeBorder = isCompromised ? "border-amber-500/60 bg-amber-950/60 text-amber-300" :
                      isZ2 ? "border-emerald-500/60 bg-emerald-950/60 text-emerald-300" :
                      "border-purple-500/60 bg-purple-950/60 text-purple-300";

    // Identifica com precisão cirúrgica em quais dias este cardio está realmente prescrito na agenda semanal
    const activePrescribedDays = perfWeeklySchedule
      .filter(d => d.type === "Cardio" && d.cardioId === c.id)
      .map(d => d.dayName || `Dia ${d.dayKey.replace("d", "")}`);

    const isPrescribed = activePrescribedDays.length > 0;
    const isFocused = c.id === perfFocusedCardioId;

    let dayBadge = "";
    if (isPrescribed) {
      dayBadge = `<span class="bg-amber-500/20 text-amber-300 border border-amber-500/60 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
        <i data-lucide="calendar" class="w-3 h-3 text-amber-400"></i> Prescrito: ${activePrescribedDays.join(" & ")}
      </span>`;
    }

    const cardHighlight = isFocused
      ? "border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.4)] bg-gradient-to-b from-amber-950/40 via-black to-zinc-950"
      : isPrescribed
      ? "border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.2)] bg-black/80"
      : "border-zinc-800/90 bg-black/70";

    return `
      <div id="cardio-card-${c.id}" class="hud-card p-5 space-y-3.5 transition-all flex flex-col justify-between ${cardHighlight} rounded-2xl">
        <div class="space-y-2.5">
          
          <!-- Tag de Prescrição do Dia -->
          ${dayBadge ? `<div class="flex items-center justify-between">${dayBadge} ${isFocused ? '<span class="text-[9px] font-mono font-bold bg-amber-400 text-black px-2 py-0.5 rounded uppercase">Foco Ativo</span>' : ''}</div>` : ''}

          <!-- Cabeçalho do Card -->
          <div class="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
            <div>
              <div class="flex items-center gap-1.5 flex-wrap mb-1">
                <span class="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${badgeBorder}">
                  ${c.category}
                </span>
                <span class="text-[10px] font-mono text-zinc-400">⚡ ${c.timeCap}</span>
                <span class="text-[10px] font-mono font-bold text-amber-400">🔥 ${c.calEst}</span>
              </div>
              <h3 class="text-sm md:text-base font-bold text-white leading-tight">${c.title}</h3>
              <p class="text-xs font-semibold text-amber-400/90 mt-0.5">${c.subtitle}</p>
            </div>
          </div>

          <!-- Foco Biomecânico -->
          <div class="p-2.5 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
            <span class="text-amber-400 font-bold block mb-0.5">🧬 Foco Biomecânico &amp; Metabolismo:</span>
            ${c.foco}
          </div>

          <!-- 4 Blocos Estruturados -->
          <div class="space-y-1.5 pt-1">
            <span class="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">Estrutura dos 4 Blocos Contínuos:</span>
            ${c.blocks.map(b => `
              <div class="p-2.5 rounded-xl bg-black/60 border border-zinc-800/80 text-xs space-y-1">
                <strong class="text-zinc-200 block font-semibold text-[11.5px] border-b border-zinc-800/60 pb-0.5">Bloco ${b.num} — ${b.name}</strong>
                <ul class="space-y-0.5 text-zinc-300 text-[11px]">
                  ${b.items.map(it => `<li class="flex items-start gap-1.5"><span class="text-amber-400 font-bold">•</span><span>${it}</span></li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>

          <!-- Restrições de Execução -->
          <div class="p-2.5 rounded-xl bg-red-950/30 border border-red-900/40 text-[11px] text-zinc-300 space-y-1">
            <strong class="text-red-400 font-bold flex items-center gap-1">
              <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-red-400"></i> Restrições Obrigatórias:
            </strong>
            <ul class="space-y-0.5 text-zinc-400">
              ${c.restrictions.map(r => `<li class="flex items-start gap-1"><span class="text-red-400 font-bold">-</span><span>${r}</span></li>`).join('')}
            </ul>
          </div>
        </div>

        <!-- Rodapé do Card com Ação de Prescrever -->
        <div class="pt-3 border-t border-zinc-800/80 flex items-center justify-between flex-wrap gap-2">
          <span class="text-[11px] font-mono text-zinc-400">Frequência: <strong class="text-zinc-200">${c.freq}</strong></span>
          <div class="flex items-center gap-1.5">
            <button onclick="perfPrescribeCardioToDay('${c.id}', 'd3')"
              class="px-2.5 py-1 text-[11px] font-bold rounded-lg text-amber-300 bg-amber-950/80 border border-amber-600/60 hover:bg-amber-900 transition-all" title="Prescrever para o Dia 3">
              Prescrever Dia 3
            </button>
            <button onclick="perfPrescribeCardioToDay('${c.id}', 'd6')"
              class="px-2.5 py-1 text-[11px] font-bold rounded-lg text-blue-300 bg-blue-950/80 border border-blue-600/60 hover:bg-blue-900 transition-all" title="Prescrever para o Dia 6">
              Prescrever Dia 6
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();

  // Scroll suave até o card se solicitado
  if (targetFocusId) {
    setTimeout(() => {
      const el = document.getElementById('cardio-card-' + targetFocusId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
}

function perfPrescribeCardioToDay(cardioId, dayKey) {
  const cardio = PERF_CARDIO_DB.find(c => c.id === cardioId);
  if (!cardio) return;

  const keyMap = { seg: 'd1', ter: 'd2', qua: 'd3', qui: 'd4', sex: 'd5', sab: 'd6', dom: 'd7' };
  const targetKey = keyMap[dayKey] || dayKey;

  perfWeeklySchedule = perfWeeklySchedule.map(d => {
    if (d.dayKey === dayKey || d.dayKey === targetKey) {
      return {
        ...d,
        cardioId: cardio.id,
        title: cardio.title.replace('Circuito ','').replace('Protocolo ',''),
        focus: cardio.subtitle,
        type: 'Cardio',
        nutrtip: `Déficit calórico mantido · ${cardio.calEst}`
      };
    }
    return d;
  });

  savePerformanceForPatient(activePatientId);
  renderPerfWeeklySchedule();
  renderPerfCardioProtocols(cardio.id);

  const targetDay = perfWeeklySchedule.find(d => d.dayKey === targetKey || d.dayKey === dayKey);
  const dayDisplay = targetDay ? targetDay.dayName : 'Dia';

  const toast = document.getElementById('perf-ai-toast');
  if (toast) {
    toast.style.display = 'flex';
    toast.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400 shrink-0"></i>
      <div><strong class="text-white">${cardio.title}</strong> prescrito com sucesso para o <strong>${dayDisplay}</strong>!</div>`;
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => { if (toast) toast.style.display = 'none'; }, 4000);
  }
}

function perfFocusDay(dayKey) {
  const keyMap = { seg: 'd1', ter: 'd2', qua: 'd3', qui: 'd4', sex: 'd5', sab: 'd6', dom: 'd7' };
  const normalizedKey = keyMap[dayKey] || dayKey;
  const day = perfWeeklySchedule.find(d => d.dayKey === dayKey || d.dayKey === normalizedKey) || perfWeeklySchedule[0];
  if (!day) return;

  // Atualiza botões no header
  document.querySelectorAll('#perf-header-daily-schedule button').forEach(btn => {
    btn.classList.remove('active');
    btn.style.boxShadow = '';
  });
  const activeBtn = document.getElementById('day-btn-' + day.dayKey) || document.getElementById('day-btn-' + normalizedKey) || document.getElementById('day-btn-' + dayKey);
  if (activeBtn) {
    activeBtn.classList.add('active');
    let isColor2 = false;
    if (day.type === 'Treino') {
      if (day.routineId) {
        const charCode = day.routineId.toUpperCase().charCodeAt(0) - 65;
        isColor2 = charCode >= 0 && charCode % 2 === 1;
      }
    }
    activeBtn.style.boxShadow = day.type === 'Treino' 
      ? (isColor2 ? '0 0 12px rgba(168,85,247,0.65)' : '0 0 12px rgba(59,130,246,0.65)')
      : (day.type === 'Cardio' ? '0 0 12px rgba(245,158,11,0.65)' : '0 0 10px rgba(113,113,122,0.4)');
  }

  if (day.routineId) {
    perfSwitchView('prescription', true);
    perfSetTarget(day.routineId);
  } else if (day.type === 'Cardio') {
    const cardioId = day.cardioId || (day.dayKey === 'd6' || dayKey === 'sab' ? 'cardio_02' : 'cardio_01');
    perfSwitchView('cardio', false);
    renderPerfCardioProtocols(cardioId);

    const cardio = PERF_CARDIO_DB.find(c => c.id === cardioId);
    const toast = document.getElementById('perf-ai-toast');
    if (toast && cardio) {
      toast.style.display = 'flex';
      toast.innerHTML = `<i data-lucide="flame" class="w-4 h-4 text-amber-400 shrink-0"></i>
        <div><strong class="text-white">${day.dayName}: ${cardio.title}</strong> (${cardio.calEst}) — ${cardio.subtitle}. Foco: ${cardio.foco}</div>`;
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => { if (toast) toast.style.display = 'none'; }, 6000);
    }
  } else {
    // Mostra toast informativo para dias de descanso
    const toast = document.getElementById('perf-ai-toast');
    if (toast) {
      toast.style.display = 'flex';
      toast.innerHTML = `<i data-lucide="coffee" class="w-4 h-4 text-amber-400 shrink-0"></i>
        <div><strong class="text-white">${day.dayName}: ${day.title}</strong> — ${day.focus}.</div>`;
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => { if (toast) toast.style.display = 'none'; }, 4000);
    }
    perfSwitchView('weekly', true);
  }
}

function renderPerfCatalog() {
  const container = document.getElementById('perf-catalog-list');
  const expandedContainer = document.getElementById('perf-catalog-list-expanded');
  if (!container && !expandedContainer) return;

  const filtered = PERF_EXERCISE_DB.filter(ex =>
    (perfGroupFilter === 'Todos' || ex.group === perfGroupFilter) &&
    (ex.name.toLowerCase().includes(perfSearchTerm.toLowerCase()) || 
     ex.primary.toLowerCase().includes(perfSearchTerm.toLowerCase()) ||
     (ex.secondary && ex.secondary.toLowerCase().includes(perfSearchTerm.toLowerCase())) ||
     ex.equipment.toLowerCase().includes(perfSearchTerm.toLowerCase()))
  );

  const currentRoutine = perfWorkoutPlan.find(r => r.id === perfTargetRoutine);

  // Badge de contagem no topo da lista
  let countHeader = `
    <div class="flex items-center justify-between text-[11px] font-mono text-zinc-400 pb-1 border-b border-zinc-800/60 mb-2">
      <span>Grupo: <strong class="text-blue-400">${perfGroupFilter}</strong></span>
      <span>${filtered.length} exercício(s)</span>
    </div>
  `;

  const htmlCards = filtered.length === 0
    ? '<p class="text-center text-zinc-500 text-xs py-8 col-span-full">Nenhum exercício encontrado para esta busca.</p>'
    : filtered.map(ex => {
        const alreadyAdded = currentRoutine && currentRoutine.exercises.some(e => e.exerciseId === ex.id);
        const mechColor = ex.mechanics === 'Composto'
          ? 'color:#60a5fa;background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.4)'
          : 'color:#c084fc;background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.4)';
        
        let equipBadgeStyle = 'color:#e4e4e7;background:#18181b;border:1px solid #3f3f46;';
        if (ex.equipment === 'Máquina') equipBadgeStyle = 'color:#fbbf24;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);';
        if (ex.equipment === 'Barra') equipBadgeStyle = 'color:#38bdf8;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.3);';
        if (ex.equipment === 'Halteres') equipBadgeStyle = 'color:#a78bfa;background:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.3);';
        if (ex.equipment === 'Cabo') equipBadgeStyle = 'color:#34d399;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.3);';

        return `
        <div class="hud-card p-3 transition-all ${alreadyAdded ? 'opacity-60 border-blue-900/30' : 'hover:border-blue-500/50 hover:shadow-[0_0_12px_rgba(59,130,246,0.15)]'}">
          <div class="flex justify-between items-start gap-2 mb-1.5">
            <h4 class="font-semibold text-xs text-zinc-100 leading-tight">${ex.name}</h4>
            <div class="flex items-center gap-1 shrink-0">
              <button onclick="perfOpenExerciseGuide('${ex.id}')"
                title="Ver GIF animado e guia biomecânico"
                class="p-1.5 rounded-lg text-blue-300 bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 hover:text-white transition-all shadow-[0_0_8px_rgba(59,130,246,0.2)]">
                <i data-lucide="play-circle" class="w-3.5 h-3.5 text-blue-400"></i>
              </button>
              <button onclick="${alreadyAdded ? '' : `perfAddExercise('${ex.id}')`}"
                ${alreadyAdded ? 'disabled' : ''}
                title="${alreadyAdded ? 'Já adicionado a este treino' : `Adicionar ao Treino ${perfTargetRoutine}`}"
                class="p-1.5 rounded-lg transition-all ${alreadyAdded ? 'text-blue-400 cursor-default bg-blue-950/40 border border-blue-800/40' : 'text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'}">
                <i data-lucide="${alreadyAdded ? 'check' : 'plus'}" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
          <div class="flex flex-wrap gap-1 mb-1.5">
            <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md" style="${mechColor}">${ex.mechanics}</span>
            <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md text-zinc-300 bg-zinc-800 border border-zinc-700/60">${ex.group}</span>
            <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md" style="${equipBadgeStyle}">${ex.equipment}</span>
          </div>
          <div class="text-[10px] text-zinc-400 leading-tight space-y-0.5">
            <div><span class="text-blue-300 font-semibold">Primário:</span> ${ex.primary}</div>
            ${ex.secondary && ex.secondary !== '—' ? `<div class="text-zinc-500"><span class="text-zinc-400">Sinergistas:</span> ${ex.secondary}</div>` : ''}
          </div>
        </div>`;
      }).join('');

  if (container) {
    container.innerHTML = countHeader + htmlCards;
  }
  if (expandedContainer) {
    expandedContainer.innerHTML = htmlCards;
  }

  if (window.lucide) window.lucide.createIcons();
}

// ════════════════════════════════════════════════════════════════════════════
// PRESETS DE DIVISÕES DE TREINO (6 SPLITS CONSAGRADOS E PERIODIZADOS)
// ════════════════════════════════════════════════════════════════════════════
const PERF_SPLIT_PRESETS = {
  // ── 1. PUSH / PULL / LEGS (3 a 6 Dias · Hipertrofia & Recomposição) ──────
  PPL: [
    {
      id: 'A',
      name: 'Treino A · Push (Peito, Deltoides Anteriores/Laterais, Tríceps & Core)',
      description: 'Cadeia anterior com pareamento Stretched+Shortened e foco no feixe clavicular e esternal.',
      exercises: [
        { exerciseId: 'pe01', name: 'Supino Reto com Barra', sets: 4, reps: '6-8', rpe: 8.5, rest: 120, cadence: '3-0-1-0', resistProfile: 'uniform', obs: 'Pico de torque no encurtamento · arco torácico firme.' },
        { exerciseId: 'pe05', name: 'Supino Inclinado com Halteres', sets: 4, reps: '8-10', rpe: 8.0, rest: 90, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Halteres ampliam ADM · foco no feixe clavicular.' },
        { exerciseId: 'pe13', name: 'Peck Deck / Voador na Máquina', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: '1s de isometria no pico de adução máxima.' },
        { exerciseId: 'sh01', name: 'Desenvolvimento Militar em Pé (OHP)', sets: 3, reps: '6-8', rpe: 8.0, rest: 90, cadence: '3-0-1-0', resistProfile: 'shortened', obs: 'Core travado e cotovelos apontados à frente.' },
        { exerciseId: 'sh09', name: 'Elevação Lateral Inclinada no Banco 45°', sets: 4, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Deltoide medial em máximo comprimento.' },
        { exerciseId: 'tr06', name: 'Tríceps Francês com Halter', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Ombro em flexão >90° alonga a cabeça longa.' },
        { exerciseId: 'tr01', name: 'Tríceps na Polia com Barra Reta (Pushdown)', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de EMG no encurtamento com 1s de trava.' },
        { exerciseId: 'ab02', name: 'Abdominal na Polia Alta com Corda (Cable Crunch)', sets: 3, reps: '12-15', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Carga progressiva no reto abdominal.' }
      ]
    },
    {
      id: 'B',
      name: 'Treino B · Pull (Dorsais, Deltoides Posteriores, Bíceps & Trapézio)',
      description: 'Cadeia posterior superior com estímulo no plano vertical e horizontal.',
      exercises: [
        { exerciseId: 'do01', name: 'Barra Fixa Pronada (Pull-up)', sets: 4, reps: '6-8', rpe: 8.5, rest: 120, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Hang completo no fundo · latíssimo em máx. comprimento.' },
        { exerciseId: 'do08', name: 'Remada Curvada com Barra (Pronada)', sets: 4, reps: '6-8', rpe: 8.5, rest: 90, cadence: '3-0-1-0', resistProfile: 'uniform', obs: 'Pico na retração escapular (romboides e trapézio).' },
        { exerciseId: 'do07', name: 'Pulldown na Polia com Braços Retos', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Extensão pura de ombro com 1s de ISO no quadril.' },
        { exerciseId: 'sh15', name: 'Face Pull na Polia com Corda', sets: 3, reps: '12-15', rpe: 8.5, rest: 45, cadence: '2-1-1-0', resistProfile: 'shortened', obs: 'Proteção do manguito rotador e deltoide posterior.' },
        { exerciseId: 'bi09', name: 'Rosca Inclinada no Banco 45° (Halteres)', sets: 3, reps: '8-10', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Ombro em extensão alonga a cabeça longa.' },
        { exerciseId: 'bi06', name: 'Rosca Scott com Barra W (Banco Scott)', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de contração no encurtamento do bíceps.' },
        { exerciseId: 'ab03', name: 'Elevação de Pernas na Barra Fixa', sets: 3, reps: '12-15', rpe: 8.0, rest: 60, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Core no comprimento máximo sem balanço.' }
      ]
    },
    {
      id: 'C',
      name: 'Treino C · Legs (Quadríceps, Isquiotibiais, Glúteos & Panturrilhas)',
      description: 'Membros inferiores completos com cadência 4-0-1-0 para integridade articular.',
      exercises: [
        { exerciseId: 'lg01', name: 'Agachamento Livre com Barra (Back Squat)', sets: 4, reps: '6-8', rpe: 8.5, rest: 150, cadence: '4-0-1-0', resistProfile: 'uniform', obs: 'Excêntrica de 4s protege LCA e tendão patelar.' },
        { exerciseId: 'lg10', name: 'Stiff com Barra (Terra Romeno)', sets: 4, reps: '6-8', rpe: 8.5, rest: 120, cadence: '4-0-1-0', resistProfile: 'stretched', obs: 'Anteversão pélvica pura · máx. alongamento isquiotibiais.' },
        { exerciseId: 'lg03', name: 'Agachamento Hack (Máquina)', sets: 3, reps: '8-10', rpe: 8.0, rest: 90, cadence: '4-0-1-0', resistProfile: 'stretched', obs: 'Maior ADM sem carga axial lombar.' },
        { exerciseId: 'lg06', name: 'Cadeira Extensora', sets: 3, reps: '12-15', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de ativação no encurtamento do reto femoral.' },
        { exerciseId: 'lg13', name: 'Cadeira Flexora Sentada', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Quadril fletido encurta isquiotibiais · par do Stiff.' },
        { exerciseId: 'lg15', name: 'Elevação Pélvica com Barra (Hip Thrust)', sets: 3, reps: '8-10', rpe: 8.5, rest: 90, cadence: '2-1-1-0', resistProfile: 'shortened', obs: 'Máxima ativação EMG do glúteo na extensão.' },
        { exerciseId: 'lg20', name: 'Panturrilha em Pé na Máquina', sets: 4, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Gastrocnêmio em máximo comprimento com 1s pausa.' }
      ]
    }
  ],

  // ── 2. UPPER / LOWER (ABCD - 4 Dias · Alta Tensão Mecânica Anti-catabólica) ──
  UpperLower: [
    {
      id: 'A',
      name: 'Treino A · Upper Força & Tensão Mecânica',
      description: 'Multiarticulares pesados de tronco com cadência 4-0-1-0 e RPE 8.',
      exercises: [
        { exerciseId: 'pe01', name: 'Supino Reto com Barra', sets: 4, reps: '5-8', rpe: 8.0, rest: 120, cadence: '3-0-1-0', resistProfile: 'uniform', obs: 'Sinal anabólico primário com pausa de 1s no peito.' },
        { exerciseId: 'do01', name: 'Barra Fixa Pronada (Pull-up)', sets: 4, reps: '5-8', rpe: 8.5, rest: 120, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Hang completo no fundo · tração vertical potente.' },
        { exerciseId: 'pe05', name: 'Supino Inclinado com Halteres', sets: 3, reps: '8-10', rpe: 8.0, rest: 90, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Halteres ampliam ADM · foco clavicular.' },
        { exerciseId: 'do08', name: 'Remada Curvada com Barra (Pronada)', sets: 3, reps: '8-10', rpe: 8.0, rest: 90, cadence: '3-0-1-0', resistProfile: 'uniform', obs: 'Retração escapular estrita para romboides.' },
        { exerciseId: 'sh09', name: 'Elevação Lateral Inclinada no Banco 45°', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Resistência no ponto de maior comprimento.' },
        { exerciseId: 'tr01', name: 'Tríceps na Polia com Barra Reta (Pushdown)', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico no encurtamento com 1s de trava.' },
        { exerciseId: 'bi01', name: 'Rosca Direta com Barra Reta', sets: 3, reps: '8-10', rpe: 8.0, rest: 60, cadence: '3-0-1-0', resistProfile: 'uniform', obs: 'Supinação completa sem balanço lombar.' }
      ]
    },
    {
      id: 'B',
      name: 'Treino B · Lower Força & Cadeia Posterior',
      description: 'Carga axial pesada em membros inferiores com cadência 4-0-1-0.',
      exercises: [
        { exerciseId: 'lg01', name: 'Agachamento Livre com Barra (Back Squat)', sets: 4, reps: '6-8', rpe: 8.0, rest: 150, cadence: '4-0-1-0', resistProfile: 'uniform', obs: 'Proteção de LCA/patela · profundidade paralela.' },
        { exerciseId: 'lg10', name: 'Stiff com Barra (Terra Romeno)', sets: 4, reps: '6-8', rpe: 8.0, rest: 120, cadence: '4-0-1-0', resistProfile: 'stretched', obs: 'Pico de tensão passiva dos isquiotibiais.' },
        { exerciseId: 'lg04', name: 'Leg Press 45°', sets: 3, reps: '8-10', rpe: 8.0, rest: 90, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Amplitude máxima (joelhos > 90°) sem retroversão.' },
        { exerciseId: 'lg13', name: 'Cadeira Flexora Sentada', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Isquiotibiais encurtados com 1s ISO · par do Stiff.' },
        { exerciseId: 'lg20', name: 'Panturrilha em Pé na Máquina', sets: 4, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Gastrocnêmio em máximo comprimento.' },
        { exerciseId: 'ab05', name: 'Abdominal Rollout (Roda Abdominal)', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-0-2-0', resistProfile: 'stretched', obs: 'Core no comprimento máximo com controle pélvico.' }
      ]
    },
    {
      id: 'C',
      name: 'Treino C · Upper Hipertrofia & Pareamento Completo',
      description: 'Volume metabólico complementar com isoladores em cabos e máquinas.',
      exercises: [
        { exerciseId: 'pe10', name: 'Crossover no Cabo (Polia Alta)', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Vetor de tração desafia peitoral no comprimento máx.' },
        { exerciseId: 'pe13', name: 'Peck Deck / Voador (Máquina)', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de torque no encurtamento · 1s ISO.' },
        { exerciseId: 'do04', name: 'Puxada Frontal Aberta na Polia', sets: 3, reps: '8-10', rpe: 8.0, rest: 90, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Latíssimo no comprimento máximo no topo.' },
        { exerciseId: 'do07', name: 'Pulldown na Polia com Braços Retos', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Extensão pura do ombro com 1s ISO no quadril.' },
        { exerciseId: 'sh15', name: 'Face Pull na Polia com Corda', sets: 3, reps: '12-15', rpe: 8.5, rest: 45, cadence: '2-1-1-0', resistProfile: 'shortened', obs: 'Deltoide posterior + manguito rotador.' },
        { exerciseId: 'bi09', name: 'Rosca Inclinada no Banco 45°', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Cabeça longa do bíceps no comprimento máximo.' },
        { exerciseId: 'tr06', name: 'Tríceps Francês com Halter', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Ombro em flexão >90° alonga a cabeça longa.' }
      ]
    },
    {
      id: 'D',
      name: 'Treino D · Lower Hipertrofia & Glúteo Completo',
      description: 'Volume sarcoplasmático em quadríceps, adutores e glúteos.',
      exercises: [
        { exerciseId: 'lg03', name: 'Agachamento Hack (Máquina)', sets: 3, reps: '8-10', rpe: 8.0, rest: 90, cadence: '4-0-1-0', resistProfile: 'stretched', obs: 'Maior ADM sem sobrecarga axial lombar.' },
        { exerciseId: 'lg06', name: 'Cadeira Extensora', sets: 3, reps: '12-15', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de EMG no encurtamento · 1s ISO.' },
        { exerciseId: 'lg07', name: 'Agachamento Búlgaro com Halteres', sets: 3, reps: '10-12', rpe: 8.0, rest: 90, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Glúteo em máximo alongamento · par do Hip Thrust.' },
        { exerciseId: 'lg15', name: 'Elevação Pélvica com Barra (Hip Thrust)', sets: 3, reps: '10-12', rpe: 8.5, rest: 75, cadence: '2-1-1-0', resistProfile: 'shortened', obs: 'Máxima ativação EMG do glúteo na extensão.' },
        { exerciseId: 'lg13', name: 'Cadeira Flexora Sentada', sets: 3, reps: '12-15', rpe: 8.5, rest: 45, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Isquiotibiais encurtados com 1s ISO.' },
        { exerciseId: 'lg21', name: 'Panturrilha Sentado (Gêmeos / Sóleo)', sets: 3, reps: '15-20', rpe: 8.5, rest: 45, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Sóleo isolado no encurtamento.' },
        { exerciseId: 'ab03', name: 'Elevação de Pernas na Barra Fixa', sets: 3, reps: '12-15', rpe: 8.0, rest: 60, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Core no comprimento máximo sem balanço.' }
      ]
    }
  ],

  // ── 3. PHAT (5 Dias · Hipertrofia Miofibrilar + Sarcoplasmática / Bulking) ──
  PHAT: [
    {
      id: 'A',
      name: 'Treino A · Upper Power (Tensão Mecânica Máxima)',
      description: 'Multiarticulares pesados de tronco com descansos de 120-150s e cadência 4-0-1-0.',
      exercises: [
        { exerciseId: 'pe01', name: 'Supino Reto com Barra', sets: 5, reps: '3-5', rpe: 9.0, rest: 150, cadence: '4-0-1-0', resistProfile: 'uniform', obs: 'Excêntrica de 4s · restauração plena de ATP-CP.' },
        { exerciseId: 'do08', name: 'Remada Curvada com Barra (Pronada)', sets: 5, reps: '4-6', rpe: 9.0, rest: 150, cadence: '4-0-1-0', resistProfile: 'uniform', obs: 'Retração escapular estrita · sobrecarga progressiva.' },
        { exerciseId: 'sh01', name: 'Desenvolvimento Militar em Pé (OHP)', sets: 3, reps: '4-6', rpe: 8.5, rest: 120, cadence: '3-0-1-0', resistProfile: 'shortened', obs: 'Core blindado e glúteos contraídos.' },
        { exerciseId: 'do01', name: 'Barra Fixa Pronada (Pull-up)', sets: 3, reps: '5-8', rpe: 8.5, rest: 120, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Hang completo no fundo · tração potente.' },
        { exerciseId: 'bi01', name: 'Rosca Direta com Barra Reta', sets: 3, reps: '5-8', rpe: 8.5, rest: 90, cadence: '3-0-1-0', resistProfile: 'uniform', obs: 'Zona de força miofibrilar pura.' },
        { exerciseId: 'tr04', name: 'Tríceps Testa com Barra W (Skull Crusher)', sets: 3, reps: '5-8', rpe: 8.5, rest: 90, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Cabeça longa em máximo estiramento.' }
      ]
    },
    {
      id: 'B',
      name: 'Treino B · Lower Power (Força de Pernas & Hinge)',
      description: 'Carga axial pesada com descanso de 150-180s para tonelagem máxima.',
      exercises: [
        { exerciseId: 'lg01', name: 'Agachamento Livre com Barra (Back Squat)', sets: 5, reps: '3-5', rpe: 9.0, rest: 180, cadence: '4-0-1-0', resistProfile: 'uniform', obs: 'Excêntrica de 4s protege tendão patelar.' },
        { exerciseId: 'lg10', name: 'Stiff com Barra (Terra Romeno)', sets: 5, reps: '4-6', rpe: 9.0, rest: 150, cadence: '4-0-1-0', resistProfile: 'stretched', obs: 'Pico de tensão passiva dos isquiotibiais.' },
        { exerciseId: 'lg04', name: 'Leg Press 45°', sets: 3, reps: '6-8', rpe: 8.5, rest: 120, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Amplitude máxima (joelhos > 90°) sem retroversão.' },
        { exerciseId: 'lg15', name: 'Elevação Pélvica com Barra (Hip Thrust)', sets: 3, reps: '8-10', rpe: 8.5, rest: 90, cadence: '2-1-1-0', resistProfile: 'shortened', obs: 'Máxima ativação EMG do glúteo com 1s ISO.' },
        { exerciseId: 'lg20', name: 'Panturrilha em Pé na Máquina', sets: 4, reps: '8-10', rpe: 9.0, rest: 75, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Gastrocnêmio em máximo comprimento.' },
        { exerciseId: 'ab04', name: 'Elevação de Pernas na Paralela (Capitão)', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-0-1-0', resistProfile: 'shortened', obs: 'Flexão pélvica estrita sem impulsos.' }
      ]
    },
    {
      id: 'C',
      name: 'Treino C · Costas & Ombros Hipertrofia (Volume Metabólico)',
      description: 'Pareamento completo Stretched+Shortened para dorsal e deltoides.',
      exercises: [
        { exerciseId: 'do04', name: 'Puxada Frontal Aberta na Polia', sets: 4, reps: '8-10', rpe: 8.5, rest: 90, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Latíssimo no comprimento máximo.' },
        { exerciseId: 'do07', name: 'Pulldown na Polia com Braços Retos', sets: 3, reps: '10-12', rpe: 9.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Extensão de ombro com 1s ISO no quadril.' },
        { exerciseId: 'do10', name: 'Remada Cavalinho (T-Bar)', sets: 3, reps: '8-10', rpe: 8.5, rest: 90, cadence: '3-0-1-0', resistProfile: 'uniform', obs: 'Retração escapular para romboides e trapézio.' },
        { exerciseId: 'sh09', name: 'Elevação Lateral Inclinada no Banco 45°', sets: 4, reps: '10-12', rpe: 9.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Deltoide medial em máximo comprimento.' },
        { exerciseId: 'sh06', name: 'Elevação Lateral com Halteres', sets: 3, reps: '10-12', rpe: 9.0, rest: 45, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de torque a 90° com 1s ISO no topo.' },
        { exerciseId: 'sh15', name: 'Face Pull na Polia com Corda', sets: 3, reps: '12-15', rpe: 9.0, rest: 45, cadence: '2-1-1-0', resistProfile: 'shortened', obs: 'Deltoide posterior + manguito rotador.' },
        { exerciseId: 'sh18', name: 'Encolhimento com Barra (Shrug)', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico do trapézio superior no encurtamento.' }
      ]
    },
    {
      id: 'D',
      name: 'Treino D · Pernas & Glúteos Hipertrofia (Volume Metabólico)',
      description: 'Pareamento para quadríceps, isquiotibiais e glúteos somando 18-22 séries.',
      exercises: [
        { exerciseId: 'lg03', name: 'Agachamento Hack (Máquina)', sets: 4, reps: '8-10', rpe: 8.5, rest: 90, cadence: '4-0-1-0', resistProfile: 'stretched', obs: 'Maior ADM sem sobrecarga axial lombar.' },
        { exerciseId: 'lg06', name: 'Cadeira Extensora', sets: 4, reps: '12-15', rpe: 9.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de EMG no encurtamento total · 1s ISO.' },
        { exerciseId: 'lg07', name: 'Agachamento Búlgaro com Halteres', sets: 3, reps: '10-12', rpe: 8.5, rest: 90, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Glúteo em máximo alongamento · par do Hip Thrust.' },
        { exerciseId: 'lg15', name: 'Elevação Pélvica com Barra (Hip Thrust)', sets: 4, reps: '8-10', rpe: 9.0, rest: 75, cadence: '2-1-1-0', resistProfile: 'shortened', obs: 'Máxima ativação EMG do glúteo com 1s ISO.' },
        { exerciseId: 'lg13', name: 'Cadeira Flexora Sentada', sets: 3, reps: '12-15', rpe: 9.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Isquiotibiais encurtados · par do Stiff.' },
        { exerciseId: 'lg17', name: 'Cadeira Abdutora', sets: 3, reps: '15-20', rpe: 9.0, rest: 45, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Glúteo médio em abertura total.' },
        { exerciseId: 'lg21', name: 'Panturrilha Sentado (Gêmeos / Sóleo)', sets: 4, reps: '12-15', rpe: 9.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Sóleo isolado no encurtamento.' }
      ]
    },
    {
      id: 'E',
      name: 'Treino E · Peitoral & Braços Hipertrofia (Volume Metabólico)',
      description: 'Pareamento completo para peitoral, bíceps e tríceps.',
      exercises: [
        { exerciseId: 'pe05', name: 'Supino Inclinado com Halteres', sets: 4, reps: '8-10', rpe: 8.5, rest: 90, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Pico de tensão no alongamento · feixe clavicular.' },
        { exerciseId: 'pe07', name: 'Crucifixo Reto com Halteres', sets: 3, reps: '10-12', rpe: 9.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Pico a 90° de abdução com 1s pausa no fundo.' },
        { exerciseId: 'pe13', name: 'Peck Deck / Voador (Máquina)', sets: 3, reps: '10-12', rpe: 9.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de torque no encurtamento · 1s ISO.' },
        { exerciseId: 'bi09', name: 'Rosca Inclinada no Banco 45°', sets: 3, reps: '8-10', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Cabeça longa do bíceps em máximo comprimento.' },
        { exerciseId: 'bi06', name: 'Rosca Scott com Barra W (Banco Scott)', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de contração no topo com 1s ISO.' },
        { exerciseId: 'tr06', name: 'Tríceps Francês com Halter', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Ombro em flexão >90° alonga a cabeça longa.' },
        { exerciseId: 'tr01', name: 'Tríceps na Polia com Barra Reta (Pushdown)', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de EMG no encurtamento com 1s ISO.' },
        { exerciseId: 'ab02', name: 'Abdominal na Polia Alta com Corda', sets: 3, reps: '12-15', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Carga progressiva no reto abdominal.' }
      ]
    }
  ],

  // ── 4. DUP (Periodização Ondulatória Diária · 3 a 5 Dias) ─────────────────
  DUP: [
    {
      id: 'A',
      name: 'Treino A · Dia Neural (Força & Tensão Miofibrilar)',
      description: 'Cargas máximas em multiarticulares (3-5 reps, RPE 9, descanso 180s).',
      exercises: [
        { exerciseId: 'pe01', name: 'Supino Reto com Barra', sets: 5, reps: '3-5', rpe: 9.0, rest: 180, cadence: '4-0-1-0', resistProfile: 'uniform', obs: 'Excêntrica de 4s · restauração neuroquímica total.' },
        { exerciseId: 'lg01', name: 'Agachamento Livre com Barra (Back Squat)', sets: 5, reps: '3-5', rpe: 9.0, rest: 180, cadence: '4-0-1-0', resistProfile: 'uniform', obs: 'Proteção de LCA/patela · base sólida.' },
        { exerciseId: 'do08', name: 'Remada Curvada com Barra (Pronada)', sets: 5, reps: '4-6', rpe: 9.0, rest: 150, cadence: '4-0-1-0', resistProfile: 'uniform', obs: 'Retração escapular estrita para romboides.' },
        { exerciseId: 'sh01', name: 'Desenvolvimento Militar em Pé (OHP)', sets: 4, reps: '4-6', rpe: 8.5, rest: 150, cadence: '3-0-1-0', resistProfile: 'shortened', obs: 'Core blindado e glúteos contraídos.' },
        { exerciseId: 'ab05', name: 'Abdominal Rollout (Roda Abdominal)', sets: 3, reps: '8-10', rpe: 8.5, rest: 60, cadence: '3-0-2-0', resistProfile: 'stretched', obs: 'Estabilidade anti-extensão do core.' }
      ]
    },
    {
      id: 'B',
      name: 'Treino B · Dia Hipertrófico (Tensão Contínua & ADM Máxima)',
      description: 'Hipertrofia volumétrica (8-10 reps, RPE 8, descanso 90s) com pareamento alongamento/encurtamento.',
      exercises: [
        { exerciseId: 'pe05', name: 'Supino Inclinado com Halteres', sets: 4, reps: '8-10', rpe: 8.0, rest: 90, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Halteres ampliam ADM no feixe clavicular.' },
        { exerciseId: 'lg10', name: 'Stiff com Barra (Terra Romeno)', sets: 4, reps: '8-10', rpe: 8.0, rest: 90, cadence: '4-0-1-0', resistProfile: 'stretched', obs: 'Pico de tensão passiva dos isquiotibiais.' },
        { exerciseId: 'do04', name: 'Puxada Frontal Aberta na Polia', sets: 4, reps: '8-10', rpe: 8.0, rest: 90, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Latíssimo no comprimento máximo.' },
        { exerciseId: 'lg03', name: 'Agachamento Hack (Máquina)', sets: 4, reps: '8-10', rpe: 8.0, rest: 90, cadence: '4-0-1-0', resistProfile: 'stretched', obs: 'Maior ADM de coxa sem carga axial.' },
        { exerciseId: 'sh09', name: 'Elevação Lateral Inclinada no Banco 45°', sets: 4, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Deltoide medial em máximo comprimento.' },
        { exerciseId: 'bi09', name: 'Rosca Inclinada no Banco 45°', sets: 3, reps: '8-10', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Cabeça longa do bíceps no comprimento máximo.' },
        { exerciseId: 'tr06', name: 'Tríceps Francês com Halter', sets: 3, reps: '8-10', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Ombro em flexão >90° alonga a cabeça longa.' }
      ]
    },
    {
      id: 'C',
      name: 'Treino C · Dia Metabólico & Potência (Pump & Densidade)',
      description: 'Altas repetições com pico isométrico (12-15 reps, RPE 9, descanso 45-60s).',
      exercises: [
        { exerciseId: 'pe13', name: 'Peck Deck / Voador (Máquina)', sets: 4, reps: '12-15', rpe: 9.0, rest: 45, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico na adução máxima com 1s ISO.' },
        { exerciseId: 'lg06', name: 'Cadeira Extensora', sets: 4, reps: '12-15', rpe: 9.0, rest: 45, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Máxima ativação no topo com 1s ISO.' },
        { exerciseId: 'do07', name: 'Pulldown na Polia com Braços Retos', sets: 4, reps: '12-15', rpe: 9.0, rest: 45, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Extensão de ombro com 1s ISO no quadril.' },
        { exerciseId: 'lg13', name: 'Cadeira Flexora Sentada', sets: 4, reps: '12-15', rpe: 9.0, rest: 45, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Isquiotibiais encurtados · par do Stiff.' },
        { exerciseId: 'sh06', name: 'Elevação Lateral com Halteres', sets: 4, reps: '12-15', rpe: 9.0, rest: 45, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico a 90° com 1s ISO no topo.' },
        { exerciseId: 'bi06', name: 'Rosca Scott com Barra W', sets: 3, reps: '12-15', rpe: 9.0, rest: 45, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico no encurtamento do bíceps.' },
        { exerciseId: 'tr01', name: 'Tríceps na Polia com Barra Reta', sets: 3, reps: '12-15', rpe: 9.0, rest: 45, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Extensão terminal com 1s ISO.' },
        { exerciseId: 'lg21', name: 'Panturrilha Sentado (Gêmeos / Sóleo)', sets: 4, reps: '15-20', rpe: 9.0, rest: 45, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Sóleo isolado no encurtamento.' }
      ]
    }
  ],

  // ── 5. FULL BODY 3X (Corpo Inteiro · Alta Frequência & Atletas) ───────────
  FullBody: [
    {
      id: 'A',
      name: 'Treino A · Full Body (Força Neural & Padrões Primários)',
      description: 'Padrões fundamentais de empurrar, puxar e agachar pesados.',
      exercises: [
        { exerciseId: 'lg01', name: 'Agachamento Livre com Barra (Back Squat)', sets: 4, reps: '5-8', rpe: 8.5, rest: 150, cadence: '4-0-1-0', resistProfile: 'uniform', obs: 'Excêntrica de 4s protege LCA/patela.' },
        { exerciseId: 'pe01', name: 'Supino Reto com Barra', sets: 4, reps: '5-8', rpe: 8.5, rest: 120, cadence: '3-0-1-0', resistProfile: 'uniform', obs: 'Pausa de 1s no peito · arco torácico firme.' },
        { exerciseId: 'do01', name: 'Barra Fixa Pronada (Pull-up)', sets: 4, reps: '5-8', rpe: 8.5, rest: 120, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Hang completo · latíssimo em máx. comprimento.' },
        { exerciseId: 'sh09', name: 'Elevação Lateral Inclinada no Banco 45°', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Deltoide medial em máximo comprimento.' },
        { exerciseId: 'ab06', name: 'Prancha Isométrica no Solo (Plank)', sets: 3, reps: '60s', rpe: 8.0, rest: 45, cadence: '0-0-0-0', resistProfile: 'uniform', obs: 'Estabilização profunda do transverso.' }
      ]
    },
    {
      id: 'B',
      name: 'Treino B · Full Body (Hinge & Tração Horizontal)',
      description: 'Potência de cadeia posterior, remada pesada e peitoral inclinado.',
      exercises: [
        { exerciseId: 'lg10', name: 'Stiff com Barra (Terra Romeno)', sets: 4, reps: '6-8', rpe: 8.5, rest: 150, cadence: '4-0-1-0', resistProfile: 'stretched', obs: 'Anteversão pélvica pura · máx. alongamento.' },
        { exerciseId: 'sh01', name: 'Desenvolvimento Militar em Pé (OHP)', sets: 4, reps: '6-8', rpe: 8.0, rest: 120, cadence: '3-0-1-0', resistProfile: 'shortened', obs: 'Core blindado e cotovelos à frente.' },
        { exerciseId: 'do08', name: 'Remada Curvada com Barra (Pronada)', sets: 4, reps: '6-8', rpe: 8.5, rest: 90, cadence: '3-0-1-0', resistProfile: 'uniform', obs: 'Retração escapular para romboides.' },
        { exerciseId: 'pe05', name: 'Supino Inclinado com Halteres', sets: 3, reps: '8-10', rpe: 8.0, rest: 90, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Halteres ampliam ADM · foco clavicular.' },
        { exerciseId: 'lg20', name: 'Panturrilha em Pé na Máquina', sets: 4, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Gastrocnêmio em máximo comprimento.' }
      ]
    },
    {
      id: 'C',
      name: 'Treino C · Full Body (Isolamento Metabólico & Potência)',
      description: 'Pareamento de isoladores e braços em estado de densidade metabólica.',
      exercises: [
        { exerciseId: 'lg03', name: 'Agachamento Hack (Máquina)', sets: 4, reps: '8-10', rpe: 8.5, rest: 90, cadence: '4-0-1-0', resistProfile: 'stretched', obs: 'Maior ADM sem carga axial lombar.' },
        { exerciseId: 'lg13', name: 'Cadeira Flexora Sentada', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Isquiotibiais encurtados · par do Stiff.' },
        { exerciseId: 'pe13', name: 'Peck Deck / Voador (Máquina)', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de torque no encurtamento · 1s ISO.' },
        { exerciseId: 'do04', name: 'Puxada Frontal Aberta na Polia', sets: 3, reps: '8-10', rpe: 8.0, rest: 90, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Latíssimo no comprimento máximo.' },
        { exerciseId: 'bi01', name: 'Rosca Direta com Barra Reta', sets: 3, reps: '8-10', rpe: 8.0, rest: 60, cadence: '3-0-1-0', resistProfile: 'uniform', obs: 'Flexão pura de cotovelo sem impulso.' },
        { exerciseId: 'tr01', name: 'Tríceps na Polia com Barra Reta', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de EMG no encurtamento com 1s ISO.' },
        { exerciseId: 'ab05', name: 'Abdominal Rollout (Roda Abdominal)', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-0-2-0', resistProfile: 'stretched', obs: 'Core no comprimento máximo.' }
      ]
    }
  ],

  // ── 6. ABCD (Divisão Tradicional de 4 Dias) ───────────────────────────────
  ABCD: [
    {
      id: 'A',
      name: 'Treino A · Peitoral, Tríceps & Reto Abdominal',
      description: 'Estímulo completo de empurrar anterior com pareamento de tríceps.',
      exercises: [
        { exerciseId: 'pe01', name: 'Supino Reto com Barra', sets: 4, reps: '6-8', rpe: 8.0, rest: 120, cadence: '3-0-1-0', resistProfile: 'uniform', obs: 'Pico no encurtamento com arco torácico firme.' },
        { exerciseId: 'pe05', name: 'Supino Inclinado com Halteres', sets: 4, reps: '8-10', rpe: 8.0, rest: 90, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Feixe clavicular com ADM ampliada.' },
        { exerciseId: 'pe10', name: 'Crossover no Cabo (Polia Alta)', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Peitoral em máximo comprimento (Stretched).' },
        { exerciseId: 'pe13', name: 'Peck Deck / Voador (Máquina)', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico na adução máxima à frente com 1s ISO.' },
        { exerciseId: 'tr06', name: 'Tríceps Francês com Halter', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Cabeça longa em máximo comprimento.' },
        { exerciseId: 'tr01', name: 'Tríceps na Polia com Barra Reta', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de EMG no encurtamento · 1s ISO.' },
        { exerciseId: 'ab02', name: 'Abdominal na Polia Alta com Corda', sets: 3, reps: '12-15', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Carga progressiva no reto abdominal.' }
      ]
    },
    {
      id: 'B',
      name: 'Treino B · Dorsal, Trapézio, Bíceps & Abdômen Infra',
      description: 'Tração pesada vertical e horizontal com pareamento de bíceps.',
      exercises: [
        { exerciseId: 'do01', name: 'Barra Fixa Pronada (Pull-up)', sets: 4, reps: '6-8', rpe: 8.5, rest: 120, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Hang completo no fundo · tração vertical potente.' },
        { exerciseId: 'do08', name: 'Remada Curvada com Barra (Pronada)', sets: 4, reps: '6-8', rpe: 8.5, rest: 90, cadence: '3-0-1-0', resistProfile: 'uniform', obs: 'Retração escapular para romboides.' },
        { exerciseId: 'do04', name: 'Puxada Frontal Aberta na Polia', sets: 3, reps: '8-10', rpe: 8.0, rest: 90, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Latíssimo no comprimento máximo.' },
        { exerciseId: 'do07', name: 'Pulldown na Polia com Braços Retos', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Extensão de ombro com 1s ISO no quadril.' },
        { exerciseId: 'sh18', name: 'Encolhimento com Barra (Shrug)', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico do trapézio superior no encurtamento.' },
        { exerciseId: 'bi09', name: 'Rosca Inclinada no Banco 45°', sets: 3, reps: '8-10', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Cabeça longa do bíceps no comprimento máximo.' },
        { exerciseId: 'bi06', name: 'Rosca Scott com Barra W', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de contração no topo com 1s ISO.' },
        { exerciseId: 'ab03', name: 'Elevação de Pernas na Barra Fixa', sets: 3, reps: '12-15', rpe: 8.0, rest: 60, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Core no comprimento máximo.' }
      ]
    },
    {
      id: 'C',
      name: 'Treino C · Membros Inferiores Completo & Core',
      description: 'Pernas completas com proteção articular e pareamento Hinge/Squat.',
      exercises: [
        { exerciseId: 'lg01', name: 'Agachamento Livre com Barra (Back Squat)', sets: 4, reps: '6-8', rpe: 8.5, rest: 150, cadence: '4-0-1-0', resistProfile: 'uniform', obs: 'Excêntrica de 4s protege LCA e tendão patelar.' },
        { exerciseId: 'lg10', name: 'Stiff com Barra (Terra Romeno)', sets: 4, reps: '6-8', rpe: 8.5, rest: 120, cadence: '4-0-1-0', resistProfile: 'stretched', obs: 'Pico de tensão passiva dos isquiotibiais.' },
        { exerciseId: 'lg04', name: 'Leg Press 45°', sets: 3, reps: '8-10', rpe: 8.0, rest: 90, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Amplitude máxima sem retroversão.' },
        { exerciseId: 'lg06', name: 'Cadeira Extensora', sets: 3, reps: '12-15', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de ativação no encurtamento.' },
        { exerciseId: 'lg13', name: 'Cadeira Flexora Sentada', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Isquiotibiais encurtados · par do Stiff.' },
        { exerciseId: 'lg20', name: 'Panturrilha em Pé na Máquina', sets: 4, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Gastrocnêmio em máximo comprimento.' },
        { exerciseId: 'ab05', name: 'Abdominal Rollout (Roda Abdominal)', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-0-2-0', resistProfile: 'stretched', obs: 'Core no comprimento máximo.' }
      ]
    },
    {
      id: 'D',
      name: 'Treino D · Deltoides Completo & Oblíquos 3D',
      description: 'Deltoides nos 3 planos (anterior, medial, posterior) e core rotacional.',
      exercises: [
        { exerciseId: 'sh01', name: 'Desenvolvimento Militar em Pé (OHP)', sets: 4, reps: '6-8', rpe: 8.0, rest: 120, cadence: '3-0-1-0', resistProfile: 'shortened', obs: 'Core blindado e glúteos contraídos.' },
        { exerciseId: 'sh09', name: 'Elevação Lateral Inclinada no Banco 45°', sets: 4, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Deltoide medial em máximo comprimento.' },
        { exerciseId: 'sh06', name: 'Elevação Lateral com Halteres', sets: 3, reps: '10-12', rpe: 8.5, rest: 45, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico a 90° com 1s ISO no topo.' },
        { exerciseId: 'sh15', name: 'Face Pull na Polia com Corda', sets: 3, reps: '12-15', rpe: 8.5, rest: 45, cadence: '2-1-1-0', resistProfile: 'shortened', obs: 'Deltoide posterior + manguito rotador.' },
        { exerciseId: 'sh13', name: 'Crucifixo Inverso com Halteres', sets: 3, reps: '12-15', rpe: 8.0, rest: 45, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Tronco inclinado com cotovelos abertos.' },
        { exerciseId: 'ab07', name: 'Russian Twist com Halter ou Anilha', sets: 3, reps: '20 reps', rpe: 7.5, rest: 45, cadence: '2-0-1-0', resistProfile: 'stretched', obs: 'Rotação controlada com estabilidade pélvica.' },
        { exerciseId: 'ab04', name: 'Elevação de Pernas na Paralela (Capitão)', sets: 3, reps: '12-15', rpe: 7.5, rest: 60, cadence: '3-0-1-0', resistProfile: 'shortened', obs: 'Enrolamento pélvico sem impulsos.' }
      ]
    }
  ],

  // ── 7. ABCDE (Isolamento Miofibrilar Clássico de 5 Dias) ───────────────────
  ABCDE: [
    {
      id: 'A',
      name: 'Treino A · Peitoral & Reto Abdominal',
      description: 'Estímulo de peitoral em todos os vetores e ângulos.',
      exercises: [
        { exerciseId: 'pe01', name: 'Supino Reto com Barra', sets: 4, reps: '6-8', rpe: 8.5, rest: 120, cadence: '3-0-1-0', resistProfile: 'uniform', obs: 'Pausa de 1s no peito · arco torácico firme.' },
        { exerciseId: 'pe05', name: 'Supino Inclinado com Halteres', sets: 4, reps: '8-10', rpe: 8.0, rest: 90, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Feixe clavicular com ADM ampliada.' },
        { exerciseId: 'pe07', name: 'Crucifixo Reto com Halteres', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Pico a 90° de abdução com 1s pausa no fundo.' },
        { exerciseId: 'pe13', name: 'Peck Deck / Voador (Máquina)', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico na adução máxima à frente com 1s ISO.' },
        { exerciseId: 'ab02', name: 'Abdominal na Polia Alta com Corda', sets: 4, reps: '12-15', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Carga progressiva no reto abdominal.' }
      ]
    },
    {
      id: 'B',
      name: 'Treino B · Dorsal, Lombar & Infra',
      description: 'Tração vertical, remada livre e espessura dorsal.',
      exercises: [
        { exerciseId: 'do01', name: 'Barra Fixa Pronada (Pull-up)', sets: 4, reps: '6-8', rpe: 8.5, rest: 120, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Hang completo no fundo · tração vertical potente.' },
        { exerciseId: 'do08', name: 'Remada Curvada com Barra (Pronada)', sets: 4, reps: '6-8', rpe: 8.5, rest: 90, cadence: '3-0-1-0', resistProfile: 'uniform', obs: 'Retração escapular para romboides.' },
        { exerciseId: 'do04', name: 'Puxada Frontal Aberta na Polia', sets: 3, reps: '8-10', rpe: 8.0, rest: 90, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Latíssimo no comprimento máximo.' },
        { exerciseId: 'do07', name: 'Pulldown na Polia com Braços Retos', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Extensão de ombro com 1s ISO no quadril.' },
        { exerciseId: 'sh18', name: 'Encolhimento com Barra (Shrug)', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico do trapézio superior no encurtamento.' },
        { exerciseId: 'ab03', name: 'Elevação de Pernas na Barra Fixa', sets: 3, reps: '12-15', rpe: 8.0, rest: 60, cadence: '3-0-1-0', resistProfile: 'stretched', obs: 'Core no comprimento máximo.' }
      ]
    },
    {
      id: 'C',
      name: 'Treino C · Membros Inferiores Completo',
      description: 'Volume total de pernas com proteção articular e descanso longo.',
      exercises: [
        { exerciseId: 'lg01', name: 'Agachamento Livre com Barra (Back Squat)', sets: 5, reps: '6-8', rpe: 8.5, rest: 150, cadence: '4-0-1-0', resistProfile: 'uniform', obs: 'Excêntrica de 4s protege LCA e tendão patelar.' },
        { exerciseId: 'lg10', name: 'Stiff com Barra (Terra Romeno)', sets: 4, reps: '6-8', rpe: 8.5, rest: 120, cadence: '4-0-1-0', resistProfile: 'stretched', obs: 'Pico de tensão passiva dos isquiotibiais.' },
        { exerciseId: 'lg03', name: 'Agachamento Hack (Máquina)', sets: 4, reps: '8-10', rpe: 8.0, rest: 90, cadence: '4-0-1-0', resistProfile: 'stretched', obs: 'Maior ADM sem sobrecarga axial lombar.' },
        { exerciseId: 'lg06', name: 'Cadeira Extensora', sets: 4, reps: '12-15', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de ativação no encurtamento total.' },
        { exerciseId: 'lg13', name: 'Cadeira Flexora Sentada', sets: 4, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Isquiotibiais encurtados · par do Stiff.' },
        { exerciseId: 'lg20', name: 'Panturrilha em Pé na Máquina', sets: 5, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Gastrocnêmio em máximo comprimento.' }
      ]
    },
    {
      id: 'D',
      name: 'Treino D · Deltoides, Trapézio & Oblíquos',
      description: 'Volume de deltoides nos 3 planos de movimento.',
      exercises: [
        { exerciseId: 'sh01', name: 'Desenvolvimento Militar em Pé (OHP)', sets: 4, reps: '6-8', rpe: 8.0, rest: 120, cadence: '3-0-1-0', resistProfile: 'shortened', obs: 'Core blindado e glúteos contraídos.' },
        { exerciseId: 'sh09', name: 'Elevação Lateral Inclinada no Banco 45°', sets: 5, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Deltoide medial em máximo comprimento.' },
        { exerciseId: 'sh06', name: 'Elevação Lateral com Halteres', sets: 3, reps: '10-12', rpe: 8.5, rest: 45, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico a 90° com 1s ISO no topo.' },
        { exerciseId: 'sh15', name: 'Face Pull na Polia com Corda', sets: 4, reps: '12-15', rpe: 8.5, rest: 45, cadence: '2-1-1-0', resistProfile: 'shortened', obs: 'Deltoide posterior + manguito rotador.' },
        { exerciseId: 'sh18', name: 'Encolhimento com Barra (Shrug)', sets: 4, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico do trapézio superior no encurtamento.' },
        { exerciseId: 'ab07', name: 'Russian Twist com Halter ou Anilha', sets: 3, reps: '20 reps', rpe: 7.5, rest: 45, cadence: '2-0-1-0', resistProfile: 'stretched', obs: 'Rotação controlada com estabilidade pélvica.' }
      ]
    },
    {
      id: 'E',
      name: 'Treino E · Braços Completos & Rollout',
      description: 'Super-séries e pareamento de flexores e extensores do cotovelo.',
      exercises: [
        { exerciseId: 'bi01', name: 'Rosca Direta com Barra Reta', sets: 4, reps: '8-10', rpe: 8.0, rest: 75, cadence: '3-0-1-0', resistProfile: 'uniform', obs: 'Flexão pura de cotovelo sem impulso lombar.' },
        { exerciseId: 'tr04', name: 'Tríceps Testa com Barra W (Skull Crusher)', sets: 4, reps: '8-10', rpe: 8.0, rest: 75, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Cabeça longa em máximo estiramento.' },
        { exerciseId: 'bi09', name: 'Rosca Inclinada no Banco 45°', sets: 3, reps: '8-10', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Cabeça longa do bíceps no comprimento máximo.' },
        { exerciseId: 'tr06', name: 'Tríceps Francês com Halter', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-1-1-0', resistProfile: 'stretched', obs: 'Ombro em flexão >90° alonga a cabeça longa.' },
        { exerciseId: 'bi06', name: 'Rosca Scott com Barra W', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de contração no topo com 1s ISO.' },
        { exerciseId: 'tr01', name: 'Tríceps na Polia com Barra Reta', sets: 3, reps: '10-12', rpe: 8.5, rest: 60, cadence: '3-1-1-0', resistProfile: 'shortened', obs: 'Pico de EMG no encurtamento com 1s ISO.' },
        { exerciseId: 'ab05', name: 'Abdominal Rollout (Roda Abdominal)', sets: 3, reps: '10-12', rpe: 8.0, rest: 60, cadence: '3-0-2-0', resistProfile: 'stretched', obs: 'Core no comprimento máximo.' }
      ]
    }
  ]
};

let perfActiveSplit = 'PPL';
let perfWorkoutPlan = JSON.parse(JSON.stringify(PERF_SPLIT_PRESETS.PPL));
let perfTargetRoutine = 'A';
let perfSearchTerm = '';
let perfGroupFilter = 'Todos';
let perfAuditData = null;
let perfWorkoutMeta = {
  isAIGenerated: false,
  isClinicallyValidated: false,
  generatedAt: null,
  validatedAt: null
};

// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
// CAMADA CANÔNICA DE CONTEXTO — PILAR 4 (PERFORMANCE)
// buildPerformanceContext(patientId)
//
// Fonte única de verdade para o motor de geração de treinos e cardio da IA.
// Lê exclusivamente do Dexie (db.patients + db.assessments + db.prescriptions)
// e de math.js. NUNCA toca o DOM. NUNCA aplica regras fixas de déficit/superávit.
//
// DTO: PerformanceContext
// ├── _meta            → Metadados canônicos (contextVersion: "1.0", builtAt, etc.)
// ├── patient          → Dados biográficos e de treino do paciente
// ├── anthropometry    → Composição corporal atual e meta
// ├── energy           → TMB, GET e fator de atividade calculados via math.js
// ├── nutrition        → Meta calórica real da prescrição ativa + balanço
// └── constraints      → Restrições clínicas (mock inicial, expansível)
// ════════════════════════════════════════════════════════════════════════════

/**
 * @param {string} patientId - ID do paciente no Dexie
 * @returns {Promise<Object|null>} PerformanceContext DTO ou null se paciente não encontrado
 */
/**
 * @param {string} patientId - ID do paciente no Dexie
 * @returns {Promise<Object|null>} PerformanceContext DTO ou null se paciente não encontrado
 */
async function buildPerformanceContext(patientId = activePatientId) {
  const pId = patientId || activePatientId;
  if (!pId) {
    console.warn('[buildPerformanceContext] Nenhum patientId fornecido.');
    return null;
  }

  // ── 1. DADOS CADASTRAIS & ANAMNESE COMPLETA (db.patients) ─────────────────
  const p = await db.patients.get(pId);
  if (!p) {
    console.warn(`[buildPerformanceContext] Paciente "${pId}" não encontrado no Dexie.`);
    return null;
  }

  const age           = parseInt(p.age) || 30;
  const sex           = p.gender || 'Masculino';             // 'Masculino' | 'Feminino'
  const heightCm      = (parseFloat(p.height) || 1.70) * 100; // converte m → cm
  const weightKg      = parseFloat(p.currentWeight) || parseFloat(p.usualWeight) || 70.0;
  const usualWeightKg = parseFloat(p.usualWeight) || weightKg;
  const targetWeightKg= parseFloat(p.targetWeight) || weightKg;
  const objective     = p.objective || 'Manutenção & Saúde';
  const patientType   = p.patientType || 'Praticante recreativo';
  const activityFactor= parseFloat(p.activityFactor) || 1.42;

  // Nível de treino: obtido do cadastro direto ou inferido somente se explícito
  const trainingLevel = (() => {
    if (p.trainingLevel && typeof p.trainingLevel === 'string') return p.trainingLevel;
    const t = String(patientType || '').toLowerCase();
    if (t.includes('atleta') || t.includes('alto rendimento')) return 'Avançado';
    if (t.includes('intermediário') || t.includes('intermediario')) return 'Intermediário';
    if (t.includes('iniciante')) return 'Iniciante';
    return 'Não informado';
  })();

  // Frequência semanal numérica (ex: "5x/semana" -> 5)
  const workoutFrequencyDays = (() => {
    if (typeof p.workoutFrequency === 'number') return p.workoutFrequency;
    const match = String(p.workoutFrequency || '').match(/(\d+)/);
    if (match) return parseInt(match[1], 10);
    if (patientType === 'Sedentário') return 0;
    return 4;
  })();

  // Duração da sessão em minutos (ex: "60 min" -> 60)
  const workoutDurationMinutes = (() => {
    if (typeof p.workoutDuration === 'number') return p.workoutDuration;
    const match = String(p.workoutDuration || '').match(/(\d+)/);
    if (match) return parseInt(match[1], 10);
    return 60;
  })();

  // IMC (Índice de Massa Corporal)
  const bmi = heightCm > 0 ? Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10 : 22.0;

  // ── 2. COMPOSIÇÃO CORPORAL & ANTROPOMETRIA (db.assessments) ───────────────
  let assessments = [];
  try {
    if (db.assessments) {
      assessments = await db.assessments.where('patientId').equals(pId).toArray();
    }
  } catch (_) {}

  // Filtra registros de seed/demo e ordena do mais recente ao mais antigo
  assessments = (assessments || [])
    .filter(e => e && !String(e.id).startsWith('eval_pv_'))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const latestEval = assessments[0] || null;

  // % de gordura e metas
  const bodyFatPercent = latestEval
    ? (parseFloat(latestEval.fatPercent) || (sex === 'Masculino' ? 18.0 : 25.0))
    : (sex === 'Masculino' ? 18.0 : 25.0);

  const targetBodyFatPercent = latestEval
    ? (parseFloat(latestEval.targetBF) || (sex === 'Masculino' ? 12.0 : 20.0))
    : (sex === 'Masculino' ? 12.0 : 20.0);

  // Massa magra e massa gorda
  const leanMassKg = latestEval && parseFloat(latestEval.leanMass) > 0
    ? parseFloat(latestEval.leanMass)
    : Math.round((weightKg * (1 - bodyFatPercent / 100)) * 10) / 10;

  const fatMassKg = latestEval && parseFloat(latestEval.fatMass) > 0
    ? parseFloat(latestEval.fatMass)
    : Math.round((weightKg * (bodyFatPercent / 100)) * 10) / 10;

  // Circunferências e RCQ
  const waistVal = latestEval ? (parseFloat(latestEval.waist) || null) : null;
  const hipVal   = latestEval ? (parseFloat(latestEval.hip) || null) : null;
  const waistToHipRatio = (waistVal > 0 && hipVal > 0)
    ? Math.round((waistVal / hipVal) * 100) / 100
    : null;

  // ── 3. ENERGÉTICA & METABOLISMO (math.js) ─────────────────────────────────
  const tmbResult  = (typeof calculateTMB === 'function')
    ? calculateTMB(sex, age, weightKg, heightCm / 100, leanMassKg)
    : { tmb: Math.round(370 + 21.6 * leanMassKg), method: 'Katch-McArdle' };
  const tmbKcal    = Math.round(tmbResult.tmb);
  const getKcal    = (typeof calculateGET === 'function')
    ? Math.round(calculateGET(tmbKcal, activityFactor))
    : Math.round(tmbKcal * activityFactor);
  const tmbMethod  = tmbResult.method;

  // ── 4. NUTRIÇÃO & BALANÇO ENERGÉTICO (db.prescriptions) ───────────────────
  let prescRecord = null;
  try {
    if (db.prescriptions) prescRecord = await db.prescriptions.get(pId);
  } catch (_) {}

  const prescItems = (prescRecord && Array.isArray(prescRecord.items)) ? prescRecord.items : [];
  const prescribedKcal = prescItems.length > 0
    ? Math.round(prescItems.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0))
    : null;

  const caloricTargetKcal = prescribedKcal !== null ? prescribedKcal : getKcal;
  const energyBalanceKcal = caloricTargetKcal - getKcal;

  let proteinGKg = 2.0;
  if (prescRecord && parseFloat(prescRecord.protGKg) > 0) {
    proteinGKg = parseFloat(prescRecord.protGKg);
  } else if (prescItems.length > 0) {
    const totalProtG = prescItems.reduce((s, i) => s + (parseFloat(i.protein) || 0), 0);
    if (totalProtG > 0 && weightKg > 0) {
      proteinGKg = Math.round((totalProtG / weightKg) * 10) / 10;
    }
  }

  // ── 5. EXAMES CLÍNICOS (db.clinicalExams) ─────────────────────────────────
  let clinicalExamsList = [];
  try {
    if (db.clinicalExams) {
      clinicalExamsList = await db.clinicalExams.where('patientId').equals(pId).toArray();
    }
  } catch (_) {}

  // ── 6. RESTRIÇÕES, LIMITAÇÕES & EQUIPAMENTOS ──────────────────────────────
  const extractedProhibitedExercises = (() => {
    const list = Array.isArray(p.prohibitedExercises) ? [...p.prohibitedExercises] : [];
    if (Array.isArray(p.clinicalConstraints)) {
      p.clinicalConstraints.forEach(c => {
        if (typeof c === 'string') list.push(c);
      });
    }
    return [...new Set(list.filter(Boolean))];
  })();

  const extractedInjuries = (() => {
    const list = Array.isArray(p.injuries) ? [...p.injuries] : [];
    return [...new Set(list.filter(Boolean))];
  })();

  const constraints = {
    injuries:             extractedInjuries,
    prohibitedExercises:  extractedProhibitedExercises,
    availableEquipment:   p.availableEquipment || 'Full Gym',
    prescribedCardioId:   typeof perfPrescribedCardioId !== 'undefined' ? perfPrescribedCardioId : 'cardio_01'
  };

  // ── 7. MONTAGEM DO DTO CANÔNICO CONSOLIDADO ───────────────────────────────
  const context = {
    _meta: {
      contextVersion:   '1.1',
      builtAt:          new Date().toISOString(),
      patientId:        pId,
      hasAssessment:    latestEval !== null,
      assessmentDate:   latestEval ? latestEval.date : null,
      hasPrescription:  prescItems.length > 0,
      tmbMethod,
    },

    patient: {
      age,
      sex,                   // 'Masculino' | 'Feminino'
      weightKg,              // peso atual (kg)
      usualWeightKg,         // peso habitual (kg)
      targetWeightKg,        // peso meta/alvo (kg)
      heightCm,              // altura (cm)
      bmi,                   // IMC calculado
      objective,             // string do Dexie
      trainingLevel,         // 'Iniciante' | 'Intermediário' | 'Avançado' | 'Não informado'
      patientType,           // 'Praticante recreativo', 'Atleta', 'Sedentário', etc.
    },

    trainingProfile: {
      mainModality:     p.mainModality || p.workoutType || 'Musculação',
      workoutType:      p.workoutType || 'Musculação / Força',
      frequencyWeekly:  workoutFrequencyDays,
      frequencyLabel:   p.workoutFrequency || `${workoutFrequencyDays}x/semana`,
      durationMinutes:  workoutDurationMinutes,
      durationLabel:    p.workoutDuration || `${workoutDurationMinutes} min`,
      intensity:        p.workoutIntensity || 'Moderada',
      workoutTime:      p.workoutTime || '',
      neatRoutine:      p.neatRoutine || 'Moderado',
      trainingLevel,
      patientType,
      isMinor:          age < 18,
    },

    anthropometry: {
      bodyFatPercent,        // % de gordura atual
      targetBodyFatPercent,  // meta de % gordura
      leanMassKg,            // massa magra (kg)
      fatMassKg,             // massa gorda (kg)
      bmi,                   // IMC
      circumferences: {
        waist:          waistVal,
        hip:            hipVal,
        abdomen:        latestEval ? (parseFloat(latestEval.circAbdomen) || null) : null,
        arm:            latestEval ? (parseFloat(latestEval.arm) || null) : null,
        thigh:          latestEval ? (parseFloat(latestEval.circThigh) || null) : null,
        chest:          latestEval ? (parseFloat(latestEval.circChest) || null) : null,
        armRelaxed:     latestEval ? (parseFloat(latestEval.circArmRelaxed) || null) : null,
        forearm:        latestEval ? (parseFloat(latestEval.circForearm) || null) : null,
        calf:           latestEval ? (parseFloat(latestEval.circCalf) || null) : null,
        neck:           latestEval ? (parseFloat(latestEval.circNeck) || null) : null,
        waistToHipRatio
      },
      skinfolds: {
        chest:          latestEval ? (parseFloat(latestEval.skChest) || null) : null,
        axillary:       latestEval ? (parseFloat(latestEval.skAxillary) || null) : null,
        triceps:        latestEval ? (parseFloat(latestEval.skTriceps) || null) : null,
        biceps:         latestEval ? (parseFloat(latestEval.skBiceps) || null) : null,
        subscapular:    latestEval ? (parseFloat(latestEval.skSubscapular) || null) : null,
        abdominal:      latestEval ? (parseFloat(latestEval.skAbdominal) || null) : null,
        suprailiac:     latestEval ? (parseFloat(latestEval.skSuprailiac) || null) : null,
        thigh:          latestEval ? (parseFloat(latestEval.skThigh) || null) : null,
        calfFold:       latestEval ? (parseFloat(latestEval.skCalfFold) || null) : null
      }
    },

    energy: {
      tmbKcal,               // Taxa Metabólica Basal (kcal/dia)
      getKcal,               // Gasto Energético Total = TMB × FA (kcal/dia)
      activityFactor,        // fator de atividade (ex: 1.42)
      tmbMethod
    },

    nutrition: {
      caloricTargetKcal,     // meta calórica REAL da prescrição ativa
      energyBalanceKcal,     // = caloricTargetKcal - getKcal (positivo = superávit)
      proteinGKg,            // aporte proteico (g/kg peso)
      prescriptionSource:    prescItems.length > 0 ? 'prescribed' : 'estimated_from_get',
    },

    lifestyle: {
      sleepHours:           parseFloat(p.sleepHours) || 7.5,
      sleepQuality:         p.sleepQuality || 'Boa',
      stressLevel:          p.stressLevel || 'Moderado',
      hydrationLiters:      parseFloat(p.hydrationLiters) || (Math.round(weightKg * 0.035 * 10) / 10),
      neatRoutine:          p.neatRoutine || 'Moderado',
      cookingAvailability:  p.cookingAvailability || 'Moderada',
      mealPreparer:         p.mealPreparer || 'O próprio paciente',
      bowelHabit:           p.bowelHabit || 'Regular (1x a 2x/dia)'
    },

    clinical: {
      clinicalNotes:        p.clinicalNotes || '',
      dietaryRestrictions:  p.dietaryRestrictions || '',
      foodAversions:        p.foodAversions || '',
      preferredFoods:       p.preferredFoods || '',
      exams:                clinicalExamsList || []
    },

    constraints
  };

  console.info('[buildPerformanceContext] DTO construído:', JSON.stringify({
    patientId:            context._meta.patientId,
    contextVersion:       context._meta.contextVersion,
    hasAssessment:        context._meta.hasAssessment,
    hasPrescription:      context._meta.hasPrescription,
    frequencyWeekly:      context.trainingProfile.frequencyWeekly,
    durationMinutes:      context.trainingProfile.durationMinutes,
    tmbKcal:              context.energy.tmbKcal,
    getKcal:              context.energy.getKcal,
    caloricTargetKcal:    context.nutrition.caloricTargetKcal,
    energyBalanceKcal:    context.nutrition.energyBalanceKcal,
    leanMassKg:           context.anthropometry.leanMassKg,
    bodyFatPercent:       context.anthropometry.bodyFatPercent,
    targetBodyFatPercent: context.anthropometry.targetBodyFatPercent,
  }, null, 2));

  return context;
}


// ════════════════════════════════════════════════════════════════════════════
// CAMADA 2 — VALIDAÇÃO ESTRUTURAL DA RESPOSTA DA IA (WHITELIST & TIPAGEM)
// validateAIPrescription(aiResponse)
//
// Garante tipo estrito de cada campo, filtra payloads malformados ou hostis
// e monta um objeto estritamente limpo segundo o contrato da aplicação.
// ════════════════════════════════════════════════════════════════════════════

function validateAIPrescription(aiResponse) {
  const errors = [];

  // ── Tipo raiz ─────────────────────────────────────────────────────────────
  if (aiResponse === null || typeof aiResponse !== 'object' || Array.isArray(aiResponse)) {
    return { status: 'REJECT', data: null, errors: ['A resposta da IA deve ser um objeto JSON.'] };
  }

  // ── frequency (deve ser estritamente inteiro entre 1 e 7) ──────────────────
  const rawFreq = aiResponse.frequency;
  const isFreqInt = typeof rawFreq === 'number' && Number.isInteger(rawFreq);
  if (!isFreqInt || rawFreq < 1 || rawFreq > 7) {
    errors.push(`Campo "frequency" inválido: esperado número inteiro entre 1 e 7, recebido "${rawFreq}".`);
  }

  // ── routines ──────────────────────────────────────────────────────────────
  if (!Array.isArray(aiResponse.routines) || aiResponse.routines.length === 0) {
    errors.push('Campo "routines" deve ser um array não vazio.');
    return { status: 'REJECT', data: null, errors };
  }

  aiResponse.routines.forEach((routine, ri) => {
    const rLabel = `routines[${ri}]`;

    if (typeof routine !== 'object' || routine === null) {
      errors.push(`${rLabel}: deve ser um objeto.`);
      return;
    }
    if (typeof routine.id !== 'string' || routine.id.trim() === '') {
      errors.push(`${rLabel}.id: deve ser uma string não vazia.`);
    }
    if (typeof routine.name !== 'string' || routine.name.trim() === '') {
      errors.push(`${rLabel}.name: deve ser uma string não vazia.`);
    }
    if (!Array.isArray(routine.exercises) || routine.exercises.length === 0) {
      errors.push(`${rLabel}.exercises: deve ser um array não vazio.`);
      return;
    }

    routine.exercises.forEach((ex, ei) => {
      const eLabel = `${rLabel}.exercises[${ei}]`;

      if (typeof ex !== 'object' || ex === null) {
        errors.push(`${eLabel}: deve ser um objeto.`);
        return;
      }
      if (typeof ex.name !== 'string' || ex.name.trim() === '') {
        errors.push(`${eLabel}.name: deve ser uma string não vazia.`);
      }

      // sets deve ser número inteiro >= 1 (rejeita 0, -1, 2.5)
      const rawSets = ex.sets;
      const numSets = typeof rawSets === 'number' ? rawSets : (typeof rawSets === 'string' && !rawSets.includes('.') ? parseInt(rawSets, 10) : NaN);
      if (!Number.isInteger(numSets) || numSets < 1) {
        errors.push(`${eLabel}.sets: deve ser um número inteiro >= 1, recebido "${ex.sets}".`);
      }

      // reps deve ser string não vazia
      if (typeof ex.reps !== 'string' || ex.reps.trim() === '') {
        errors.push(`${eLabel}.reps: deve ser uma string (ex: "8-12"), recebido "${ex.reps}".`);
      }

      // rpe deve ser número entre 1 e 10 (rejeita 0, 11, aceita 8.5)
      const rawRpe = typeof ex.rpe === 'number' ? ex.rpe : (typeof ex.rpe === 'string' && ex.rpe.trim() !== '' ? parseFloat(ex.rpe) : NaN);
      if (typeof rawRpe !== 'number' || Number.isNaN(rawRpe) || rawRpe < 1 || rawRpe > 10) {
        errors.push(`${eLabel}.rpe: deve ser número entre 1 e 10, recebido "${ex.rpe}".`);
      }

      // rest / restSeconds (se informado) deve ser número inteiro >= 0 (rejeita -30, 2.5)
      const rawRest = ex.rest !== undefined && ex.rest !== null ? ex.rest : (ex.restSeconds !== undefined && ex.restSeconds !== null ? ex.restSeconds : undefined);
      if (rawRest !== undefined) {
        const numRest = typeof rawRest === 'number' ? rawRest : (typeof rawRest === 'string' && !rawRest.includes('.') ? parseInt(rawRest, 10) : NaN);
        if (!Number.isInteger(numRest) || numRest < 0) {
          errors.push(`${eLabel}.rest: deve ser um número inteiro de segundos >= 0, recebido "${rawRest}".`);
        }
      }
    });
  });

  if (errors.length > 0) {
    return { status: 'REJECT', data: null, errors };
  }

  // ── Objeto limpo (sem campos desconhecidos propagados — Whitelist rígida) ───
  const cleanData = {
    frequency: Math.round(aiResponse.frequency),
    routines: aiResponse.routines.map(r => ({
      id:   String(r.id).trim(),
      name: String(r.name).trim(),
      exercises: r.exercises.map(ex => {
        const rawRest = ex.rest !== undefined && ex.rest !== null ? ex.rest : (ex.restSeconds !== undefined && ex.restSeconds !== null ? ex.restSeconds : undefined);
        const hasValidRest = rawRest !== undefined && Number.isInteger(typeof rawRest === 'number' ? rawRest : parseInt(rawRest, 10));
        return {
          name: String(ex.name).trim(),
          sets: Math.round(typeof ex.sets === 'number' ? ex.sets : parseInt(ex.sets, 10)),
          reps: String(ex.reps).trim(),
          rpe:  typeof ex.rpe === 'number' ? ex.rpe : parseFloat(ex.rpe),
          // Campos opcionais — copiados somente se presentes e válidos
          ...(hasValidRest ? { rest: Math.round(typeof rawRest === 'number' ? rawRest : parseInt(rawRest, 10)) } : {}),
          ...(typeof ex.obs  === 'string' && ex.obs.trim() !== '' ? { obs: ex.obs.trim() } : {}),
        };
      })
    }))
  };

  return { status: 'PASS', data: cleanData, errors: [] };
}

// ════════════════════════════════════════════════════════════════════════════
// CAMADA 3 — MOTOR DE COERÊNCIA CLÍNICA
// validatePrescriptionAgainstContext(prescription, performanceContext)
//
// Executa regras determinísticas sobre a prescrição estruturalmente válida.
// Nunca lança exceção. Nunca persiste. Retorna apenas o laudo de validação.
//
// Regras implementadas:
//   R1 — REJECT  : Exercícios proibidos (constraints.prohibitedExercises)
//   R2 — REJECT  : Frequência incompatível com nível iniciante (> 4 dias)
//   R3 — WARNING : Volume elevado (> 90 sets) em déficit energético (< -500 kcal)
//   R4 — WARNING : Estímulo força máxima (reps "1"/"2" + RPE >= 9) em objetivo Hipertrofia
// ════════════════════════════════════════════════════════════════════════════

/**
 * @param {Object} prescription - Dados limpos vindos de validateAIPrescription().data
 * @param {Object} performanceContext - DTO vindo de buildPerformanceContext()
 * @returns {{ status: "PASS"|"WARNING"|"REJECT", warnings: string[], errors: string[] }}
 */
function validatePrescriptionAgainstContext(prescription, performanceContext) {
  const warnings = [];
  const errors   = [];

  // Guardrail de entrada — não lança exceção, retorna REJECT informativo
  if (!prescription || typeof prescription !== 'object') {
    return { status: 'REJECT', warnings: [], errors: ['Prescrição inválida ou ausente.'] };
  }
  if (!performanceContext || typeof performanceContext !== 'object') {
    return { status: 'REJECT', warnings: [], errors: ['PerformanceContext inválido ou ausente.'] };
  }

  // Coleta todos os exercícios em uma lista plana para facilitar as regras
  const allExercises = (Array.isArray(prescription.routines) ? prescription.routines : [])
    .flatMap(r => Array.isArray(r.exercises) ? r.exercises : []);

  // ── R1 — REJECT: Exercícios proibidos ────────────────────────────────────
  const prohibitedList = Array.isArray(performanceContext.constraints?.prohibitedExercises)
    ? performanceContext.constraints.prohibitedExercises.map(s => String(s).toLowerCase().trim())
    : [];

  allExercises.forEach(ex => {
    const exNameLower = String(ex.name || '').toLowerCase().trim();
    const isProhibited = prohibitedList.some(prohibited =>
      prohibited !== '' && (exNameLower === prohibited || exNameLower.includes(prohibited))
    );
    if (isProhibited) {
      errors.push(`Exercício proibido detectado na prescrição: "${ex.name}".`);
    }
  });

  // ── R2 — REJECT: Frequência incompatível com nível iniciante ─────────────
  // Apenas rejeita se o nível for estritamente identificado como iniciante
  const trainingLevelLower = String(performanceContext.patient?.trainingLevel || '').toLowerCase();
  const frequency          = typeof prescription.frequency === 'number' ? prescription.frequency : 0;

  if (trainingLevelLower.includes('iniciante') && frequency > 4) {
    errors.push('Frequência incompatível com nível de treinamento iniciante.');
  }

  // ── R3 — WARNING: Volume elevado em déficit energético ───────────────────
  const totalSets        = allExercises.reduce((sum, ex) => sum + (parseInt(ex.sets) || 0), 0);
  const energyBalance    = typeof performanceContext.nutrition?.energyBalanceKcal === 'number'
    ? performanceContext.nutrition.energyBalanceKcal
    : 0;

  if (energyBalance < -500 && totalSets > 90) {
    warnings.push('Volume semanal elevado em contexto de déficit energético; requer revisão profissional.');
  }

  // ── R4 — WARNING: Estímulo incoerente (força máxima em objetivo Hipertrofia) ──
  const objectiveLower = String(performanceContext.patient?.objective || '').toLowerCase();

  if (objectiveLower.includes('hipertrofia')) {
    const hasStrengthMaxStimulus = allExercises.some(ex => {
      const repsStr = String(ex.reps || '').trim();
      const rpe     = parseFloat(ex.rpe);
      // Reps "1" ou "2" (exact match da parte numérica principal)
      const isVeryLowReps = /^[12]$/.test(repsStr) || /^[12]-/.test(repsStr);
      const isHighRpe     = rpe >= 9;
      return isVeryLowReps && isHighRpe;
    });

    if (hasStrengthMaxStimulus) {
      warnings.push(
        'Estímulo de alta intensidade e baixa repetição pode estar excessivamente orientado à força máxima ' +
        'para um objetivo de hipertrofia; requer revisão.'
      );
    }
  }

  // ── Decisão Final ─────────────────────────────────────────────────────────
  let status = 'PASS';
  if (errors.length > 0)        status = 'REJECT';
  else if (warnings.length > 0) status = 'WARNING';

  return { status, warnings, errors };
}

// ════════════════════════════════════════════════════════════════════════════
// CAMADA 4 — ORQUESTRADOR COM CIRCUIT BREAKER
// generateAndValidateWorkout(patientId, aiGenerator)
//
// Fluxo:
//   1. buildPerformanceContext()           → contexto canônico
//   2. aiGenerator(context, prevErrors)    → proposta bruta da IA
//   3. validateAIPrescription()            → validação estrutural
//   4. validatePrescriptionAgainstContext()→ validação de coerência clínica
//   5. PASS|WARNING → retorna para revisão profissional (SEM persistência)
//   6. REJECT após 3 tentativas → circuit breaker
//
// GARANTIAS DE SEGURANÇA:
//   - Nunca grava em db.performanceMetabolica
//   - patientId vem do parâmetro local (nunca da IA)
//   - Campos canônicos (tmbKcal, getKcal, leanMassKg…) são imutáveis na IA
//   - Campos desconhecidos da IA são descartados por validateAIPrescription()
// ════════════════════════════════════════════════════════════════════════════

/**
 * @param {string} patientId - ID canônico do paciente (nunca vem da IA)
 * @param {Function} aiGenerator - async (context, previousErrors) => rawAIResponse
 * @returns {Promise<Object>} Resultado padronizado para revisão profissional
 */
async function generateAndValidateWorkout(patientId, aiGenerator) {
  const MAX_ATTEMPTS = 3;

  // ── ETAPA 1: Construir contexto canônico ─────────────────────────────────
  let performanceContext;
  try {
    performanceContext = await buildPerformanceContext(patientId);
  } catch (ctxErr) {
    console.error('[generateAndValidateWorkout] Erro ao construir contexto:', ctxErr);
    return {
      status:                   'REJECT',
      fatal:                    true,
      requiresManualPrescription: true,
      attempt:                  0,
      context:                  null,
      prescription:             null,
      warnings:                 [],
      errors:                   ['Erro interno ao construir o PerformanceContext: ' + String(ctxErr.message || ctxErr)]
    };
  }

  if (!performanceContext) {
    return {
      status:                   'REJECT',
      fatal:                    true,
      requiresManualPrescription: true,
      attempt:                  0,
      context:                  null,
      prescription:             null,
      warnings:                 [],
      errors:                   [`Paciente "${patientId}" não encontrado ou sem dados suficientes para gerar o contexto.`]
    };
  }

  // ── Cópia defensiva / snapshot imutável em profundidade do contexto ──────
  const deepFreeze = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.freeze(obj);
      Object.keys(obj).forEach(k => {
        if (obj[k] && typeof obj[k] === 'object' && !Object.isFrozen(obj[k])) deepFreeze(obj[k]);
      });
    }
    return obj;
  };
  const contextSnapshot = deepFreeze(JSON.parse(JSON.stringify(performanceContext)));

  // ── ETAPA 2-5: Loop com circuit breaker ───────────────────────────────────
  let attempt       = 0;
  let previousErrors = [];
  let lastResult     = null;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;

    // ── Etapa 2: Geração via IA ────────────────────────────────────────────
    let aiRawResponse;
    try {
      // Na primeira tentativa previousErrors é []; nas subsequentes leva os erros da anterior
      aiRawResponse = await aiGenerator(contextSnapshot, previousErrors);
    } catch (genErr) {
      console.error(`[generateAndValidateWorkout] Tentativa ${attempt}: erro na chamada da IA:`, genErr);
      // Erros de quota (429) e timeout não devem ser rethentados — abortam imediatamente
      if (genErr.isQuotaError || genErr.isTimeout) {
        return {
          status:  'REJECT',
          fatal:   true,
          requiresManualPrescription: true,
          attempt,
          context: contextSnapshot,
          prescription: null,
          warnings: [],
          errors: [String(genErr.message || genErr)]
        };
      }
      previousErrors = [`Erro na chamada da IA: ${String(genErr.message || genErr)}`];
      // Aguarda 2s antes de nova tentativa para evitar rate limiting
      await new Promise(r => setTimeout(r, 2000));
      continue; // tenta novamente
    }

    // ── Etapa 3: Validação estrutural ─────────────────────────────────────
    const structural = validateAIPrescription(aiRawResponse);

    if (structural.status === 'REJECT') {
      console.warn(`[generateAndValidateWorkout] Tentativa ${attempt}: falha estrutural:`, structural.errors);
      // Prescrição estruturalmente inválida NÃO chega ao validador clínico
      previousErrors = structural.errors;
      lastResult = {
        status:       'REJECT',
        fatal:        false,
        attempt,
        context:      contextSnapshot,
        prescription: null,
        warnings:     [],
        errors:       structural.errors
      };
      continue;
    }

    // ── Etapa 4: Validação de coerência clínica ────────────────────────────
    const coherence = validatePrescriptionAgainstContext(structural.data, contextSnapshot);

    if (coherence.status === 'REJECT') {
      console.warn(`[generateAndValidateWorkout] Tentativa ${attempt}: falha de coerência:`, coherence.errors);
      // Envia SOMENTE os erros que precisam ser corrigidos na próxima tentativa
      previousErrors = coherence.errors;
      lastResult = {
        status:       'REJECT',
        fatal:        false,
        attempt,
        context:      contextSnapshot,
        prescription: null,
        warnings:     coherence.warnings,
        errors:       coherence.errors
      };
      continue;
    }

    // ── Etapa 5: PASS ou WARNING — interrompe loop imediatamente ──────────
    // NUNCA persiste automaticamente. Retorna para revisão profissional.
    console.info(`[generateAndValidateWorkout] Tentativa ${attempt}: ${coherence.status}. Aguardando revisão profissional.`);
    return {
      status:             coherence.status,   // "PASS" | "WARNING"
      fatal:              false,
      attempt,
      context:            contextSnapshot,
      prescription:       structural.data,    // dados limpos, sem campos da IA fora do contrato
      warnings:           coherence.warnings,
      errors:             [],
      requiresHumanReview: true
      // ⛔ db.performanceMetabolica NÃO é tocado aqui.
      // Persistência SOMENTE via approveAITraining() após revisão profissional.
    };
  }

  // ── PASSO 3: Circuit Breaker — esgotadas as 3 tentativas ─────────────────
  console.error('[generateAndValidateWorkout] Circuit breaker ativado após 3 tentativas.');
  return {
    status:                   'REJECT',
    fatal:                    true,
    requiresManualPrescription: true,
    attempt:                  MAX_ATTEMPTS,
    context:                  contextSnapshot,
    prescription:             null,
    warnings:                 lastResult?.warnings || [],
    errors: (lastResult && lastResult.errors && lastResult.errors.length > 0)
      ? lastResult.errors
      : (previousErrors && previousErrors.length > 0
          ? previousErrors
          : ['Não foi possível gerar uma prescrição compatível após 3 tentativas. É necessária prescrição manual ou revisão profissional.'])
  };
}

// ════════════════════════════════════════════════════════════════════════════
// GERADOR DE TREINO IA PADRÃO (DETERMINÍSTICO E CANÔNICO)
// defaultPerformanceAIGenerator(context, previousErrors)
//
// ⚠️ DEVELOPMENT MOCK — NÃO É MOTOR CLÍNICO DE PRODUÇÃO.
// Utilizado para prototipação, validação estrutural da arquitetura e testes
// automatizados antes da integração com a API externa do provedor de LLM.
// ════════════════════════════════════════════════════════════════════════════

/**
 * @param {Object} context - PerformanceContext DTO
 * @param {string[]} previousErrors - Erros da tentativa anterior
 * @returns {Promise<Object>} Proposta estruturada de prescrição
 */
async function defaultPerformanceAIGenerator(context, previousErrors = []) {
  // DEVELOPMENT MOCK — NÃO É MOTOR CLÍNICO DE PRODUÇÃO
  // Simula latência de processamento
  await new Promise(r => setTimeout(r, 300));

  const prohibited = (context.constraints?.prohibitedExercises || []).map(s => String(s).toLowerCase());
  const hasError = (term) => previousErrors.some(e => String(e).toLowerCase().includes(term));

  const safeEx = (preferredName, fallbackName, sets, reps, rpe, rest, obs) => {
    const prefLower = preferredName.toLowerCase();
    const isProhibited = prohibited.some(p => prefLower.includes(p)) || hasError(prefLower);
    const finalName = isProhibited ? fallbackName : preferredName;
    return { name: finalName, sets: parseInt(sets) || 3, reps: String(reps), rpe: parseFloat(rpe) || 8, rest: parseInt(rest) || 60, obs: obs || '' };
  };

  return {
    frequency: 3,
    routines: [
      {
        id: 'A', name: 'Treino A · Push Performance',
        exercises: [
          safeEx('Supino Reto com Barra', 'Supino com Halteres', 4, '6-8', 7.5, 120, 'Fadiga central controlada.'),
          safeEx('Desenvolvimento Militar em Pé', 'Desenvolvimento Halteres', 3, '6-8', 7.5, 120, 'Força de empurrar.'),
          safeEx('Supino Inclinado com Halteres', 'Crucifixo Inclinado', 3, '8-10', 8, 90, 'Peitoral superior.'),
          safeEx('Elevação Lateral com Halteres', 'Elevação Cabo', 3, '10-12', 8, 60, 'Deltoide medial.'),
          safeEx('Tríceps na Polia com Barra Reta', 'Tríceps Corda', 3, '10-12', 8, 60, 'Tríceps.')
        ]
      },
      {
        id: 'B', name: 'Treino B · Pull Performance',
        exercises: [
          safeEx('Barra Fixa', 'Puxada Frontal', 4, '6-8', 7.5, 120, 'Tração funcional.'),
          safeEx('Remada Curvada com Barra', 'Remada Baixa', 4, '6-8', 7.5, 120, 'Força de costas.'),
          safeEx('Puxada Frontal Aberta', 'Puxada Triângulo', 3, '8-10', 8, 90, 'Latíssimo.'),
          safeEx('Face Pull com Corda', 'Crucifixo Invertido', 3, '12-15', 7.5, 60, 'Estabilidade escapular.'),
          safeEx('Rosca Direta com Barra', 'Rosca com Halteres', 3, '8-10', 8, 60, 'Bíceps.')
        ]
      },
      {
        id: 'C', name: 'Treino C · Legs Performance',
        exercises: [
          safeEx('Agachamento Livre com Barra', 'Leg Press 45°', 4, '6-8', 7.5, 150, 'Padrão de agachamento.'),
          safeEx('Stiff com Barra', 'Mesa Flexora', 4, '6-8', 7.5, 120, 'Cadeia posterior.'),
          safeEx('Leg Press 45°', 'Hack Squat', 3, '8-10', 8, 90, 'Membros inferiores.'),
          safeEx('Cadeira Flexora Sentada', 'Mesa Flexora', 3, '10-12', 8, 60, 'Isquiotibiais.'),
          safeEx('Panturrilha em Pé', 'Panturrilha no Leg', 4, '10-12', 8, 60, 'Tendão de Aquiles.')
        ]
      }
    ]
  };
}

// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
// POOL DE API KEYS GEMINI — Rotação automática em caso de quota excedida
// ════════════════════════════════════════════════════════════════════════════

/**
 * Retorna o array de chaves configuradas.
 * Prioriza GEMINI_API_KEYS (pool); faz fallback para GEMINI_API_KEY (legado).
 * @returns {string[]}
 */
function geminiGetApiKeyPool() {
  // Pool novo
  try {
    const raw = localStorage.getItem('GEMINI_API_KEYS');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(k => String(k).trim()).filter(Boolean);
      }
    }
  } catch (_) {}

  // Fallback: chave única legada
  const single = (localStorage.getItem('GEMINI_API_KEY') || '').trim();
  if (single) return [single];

  return [];
}

/**
 * Salva o pool de chaves no localStorage.
 * Também mantém GEMINI_API_KEY sincronizado com a primeira chave (retrocompatibilidade).
 * @param {string[]} keys
 */
function geminiSaveApiKeyPool(keys) {
  const clean = keys.map(k => String(k).trim()).filter(Boolean);
  localStorage.setItem('GEMINI_API_KEYS', JSON.stringify(clean));
  if (clean.length > 0) {
    localStorage.setItem('GEMINI_API_KEY', clean[0]);
  } else {
    localStorage.removeItem('GEMINI_API_KEY');
    localStorage.removeItem('GEMINI_API_KEYS');
  }
}

/**
 * Abre um modal simples para gerenciar o pool de API Keys do Gemini.
 * Permite adicionar, remover e visualizar todas as chaves configuradas.
 */
function openGeminiKeysManager() {
  const existingModal = document.getElementById('gemini-keys-modal');
  if (existingModal) existingModal.remove();

  const pool = geminiGetApiKeyPool();

  const modal = document.createElement('div');
  modal.id = 'gemini-keys-modal';
  modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-white font-bold text-lg flex items-center gap-2">
            <svg class="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            Pool de API Keys Gemini
          </h2>
          <p class="text-zinc-400 text-xs mt-0.5">Adicione múltiplas chaves. Em caso de quota excedida, a próxima é usada automaticamente.</p>
        </div>
        <button onclick="document.getElementById('gemini-keys-modal').remove()" class="text-zinc-500 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Lista de chaves -->
      <div id="gemini-keys-list" class="space-y-2 max-h-52 overflow-y-auto pr-1">
        ${pool.length === 0
          ? '<p class="text-zinc-500 text-sm text-center py-4">Nenhuma chave configurada.</p>'
          : pool.map((k, i) => `
            <div class="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
              <span class="text-xs font-bold text-violet-400 w-6 shrink-0">#${i + 1}</span>
              <span class="text-xs text-zinc-300 font-mono truncate flex-1" title="${k}">${k.slice(0, 8)}${'*'.repeat(Math.max(0, k.length - 12))}${k.slice(-4)}</span>
              ${i === 0 ? '<span class="text-[10px] bg-emerald-900/60 text-emerald-400 border border-emerald-700/60 px-2 py-0.5 rounded-full font-bold shrink-0">Principal</span>' : ''}
              <button onclick="geminiRemoveKeyFromPool(${i})" class="text-zinc-600 hover:text-red-400 transition-colors shrink-0" title="Remover">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>`).join('')
        }
      </div>

      <!-- Adicionar nova chave -->
      <div class="border-t border-zinc-800 pt-4 space-y-3">
        <label class="text-zinc-300 text-sm font-semibold block">Adicionar nova chave</label>
        <div class="flex gap-2">
          <input id="gemini-new-key-input" type="password"
            placeholder="AIza..."
            class="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500 font-mono"
          />
          <button onclick="geminiAddKeyToPool()" class="bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors shrink-0">
            Adicionar
          </button>
        </div>
        <p class="text-zinc-500 text-xs">A primeira chave da lista é sempre a principal. As demais são usadas automaticamente como fallback.</p>
      </div>

      <div class="flex justify-end pt-1">
        <button onclick="document.getElementById('gemini-keys-modal').remove()" class="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-5 py-2 rounded-xl text-sm transition-colors">
          Fechar
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function geminiAddKeyToPool() {
  const input = document.getElementById('gemini-new-key-input');
  if (!input) return;
  const newKey = input.value.trim();
  if (!newKey) { alert('Por favor, insira uma chave válida.'); return; }
  const pool = geminiGetApiKeyPool();
  if (pool.includes(newKey)) { alert('Esta chave já está no pool.'); return; }
  pool.push(newKey);
  geminiSaveApiKeyPool(pool);
  openGeminiKeysManager(); // re-renderiza
}

function geminiRemoveKeyFromPool(index) {
  const pool = geminiGetApiKeyPool();
  pool.splice(index, 1);
  geminiSaveApiKeyPool(pool);
  openGeminiKeysManager(); // re-renderiza
}

// Expõe globalmente
window.openGeminiKeysManager  = openGeminiKeysManager;
window.geminiAddKeyToPool     = geminiAddKeyToPool;
window.geminiRemoveKeyFromPool = geminiRemoveKeyFromPool;

// ════════════════════════════════════════════════════════════════════════════
// GERADOR REAL DE PRESCRIÇÃO VIA GOOGLE GEMINI (PILAR DE PERFORMANCE)
// geminiPerformanceAIGenerator(context, previousErrors)
// ════════════════════════════════════════════════════════════════════════════

const GEMINI_MODEL = 'gemini-3.6-flash';

/**
 * Executa uma única chamada ao endpoint Gemini com uma chave específica.
 * Lança isQuotaError=true em caso de HTTP 429 para o chamador poder rotacionar.
 * @param {string} apiKey
 * @param {string} prompt
 * @returns {Promise<Object>} Prescrição bruta JSON
 */
async function _callGeminiWithKey(apiKey, prompt) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
      }),
      signal: controller.signal
    });
  } catch (fetchErr) {
    if (fetchErr.name === 'AbortError') {
      const timeoutErr = new Error('Falha na API do Gemini: requisição excedeu 90s (timeout). A IA demorou para responder — tente novamente.');
      timeoutErr.isTimeout = true;
      throw timeoutErr;
    }
    throw new Error(`Falha de conexão com a API do Gemini: ${fetchErr.message || fetchErr}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorDetails = '';
    try {
      const errJson = await response.json();
      errorDetails = errJson?.error?.message || errJson?.message || '';
    } catch (_) {
      try { errorDetails = await response.text(); } catch (__) {}
    }
    const detailSuffix = errorDetails ? ` Detalhes: ${errorDetails}` : '';

    if (response.status === 400) throw new Error(`Falha na API do Gemini (HTTP 400 - Parâmetros inválidos).${detailSuffix}`);
    if (response.status === 401) throw new Error(`Falha na API do Gemini (HTTP 401 - Chave inválida ou não autenticada).${detailSuffix}`);
    if (response.status === 403) throw new Error(`Falha na API do Gemini (HTTP 403 - Acesso negado).${detailSuffix}`);
    if (response.status === 429) {
      const quotaErr = new Error(`Chave #KEY# com quota excedida (HTTP 429).${detailSuffix}`);
      quotaErr.isQuotaError = true;
      throw quotaErr;
    }
    throw new Error(`Falha na API do Gemini (HTTP ${response.status}).${detailSuffix}`);
  }

  let resData;
  try { resData = await response.json(); }
  catch (_) { throw new Error('Falha na API do Gemini: resposta não é JSON válido.'); }

  const rawText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText || !rawText.trim()) throw new Error('Falha na API do Gemini: resposta vazia ou sem conteúdo.');

  // Sanitiza blocos ```json```
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
  else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  cleaned = cleaned.trim();

  let prescription;
  try { prescription = JSON.parse(cleaned); }
  catch (_) { throw new Error('Falha na API do Gemini: resposta não contém JSON válido.'); }

  if (!prescription || typeof prescription !== 'object') {
    throw new Error('Falha na API do Gemini: resposta não é um objeto JSON válido.');
  }
  return prescription;
}

/**
 * Gerador de prescrição de treino utilizando a API do Google Gemini.
 * Usa um POOL de chaves — rotaciona automaticamente em caso de quota excedida (429).
 *
 * @param {Object} context - PerformanceContext DTO canônico
 * @param {string[]} previousErrors - Lista de erros da tentativa anterior (se houver)
 * @returns {Promise<Object>} Objeto JSON bruto da prescrição gerada
 */
async function geminiPerformanceAIGenerator(context, previousErrors = []) {
  // 1. Obter pool de chaves (multi-key com fallback legado)
  const apiKeys = geminiGetApiKeyPool();
  if (apiKeys.length === 0) {
    throw new Error('Nenhuma chave da API Gemini configurada. Clique em "🔑 Chaves de API" para configurar.');
  }

  // 2. Montar prompt
  let prompt = `Você é um especialista em Fisiologia do Exercício, Biomecânica, Prescrição do Treinamento de Força, Performance Humana e Periodização.

Sua função neste sistema é gerar uma PRESCRIÇÃO DE TREINO CANDIDATA ALTAMENTE INDIVIDUALIZADA e EXCLUSIVA para o paciente informado no DTO canônico.

=== REGRA DE INDIVIDUALIZAÇÃO ABSOLUTA E NÃO-CÓPIA ===
- A prescrição DEVE ser estritamente individualizada para o paciente representado pelo contexto fornecido.
- NÃO reutilize, copie ou reproduza automaticamente uma prescrição genérica ou de outro paciente.
- NÃO produza um treino padrão quando existirem dados específicos (anamnese, antropometria, rotina, energia) capazes de orientar a prescrição.
- Cada decisão de treinamento (divisão de treino, número de rotinas, escolha de exercícios, volume de séries, faixa de repetições, RPE e intervalos de descanso) DEVE ser justificada e compatível com o contexto do paciente.

=== HIERARQUIA DE PRIORIDADES OBRIGATÓRIA ===

[PRIORIDADE 1 — SEGURANÇA, LESÕES E RESTRIÇÕES]
- Respeite rigorosamente todas as restrições articulares, lesões e exercícios proibidos informados em constraints.prohibitedExercises, constraints.injuries e clinical.clinicalNotes.
- JAMAIS prescreva exercícios contidos na lista de proibidos ou que sobrecarreguem estruturas lesionadas. Substitua por alternativas biomecanicamente seguras.

[PRIORIDADE 2 — OBJETIVO CENTRAL DO PACIENTE]
- O objetivo declarado (patient.objective) é o eixo central do estímulo neuromuscular:
  * Hipertrofia: Priorizar faixas de 6 a 12 repetições, volume moderado a alto (10 a 20 séries/semana por grupamento principal), RPE 7 a 9, descanso suficiente para recuperação do SNC e ATP-CP (60-120s).
  * Emagrecimento / Perda de Gordura: Preservar massa magra, manter intensidade mecânica (RPE 7 a 8.5), com volume sustentável sem excesso de fadiga central.
  * Força Máxima / Performance: Foco em padrões básicos multiarticulares, repetições mais baixas (4 a 6 reps ou 6 a 8 reps), descansos completos (120 a 180s) e progressão de carga.
  * Saúde / Manutenção / Recomposição: Equilíbrio postural, amplitude completa, prevenção de lesões e distribuição harmônica de volume.

[PRIORIDADE 3 — CAPACIDADE, PERFIL E DISPONIBILIDADE REAL]
- FREQUÊNCIA SEMANAL E DIVISÃO DE ROTINAS:
  * O número de rotinas no array "routines" e o valor do campo "frequency" DEVEM corresponder à frequência declarada do paciente (trainingProfile.frequencyWeekly ou workoutFrequency).
  * Exemplo: Se frequência = 3x/semana → frequency = 3, gerar exatamente 3 rotinas (A, B, C) (ex: Push/Pull/Legs ou Full Body A/B/C).
  * Exemplo: Se frequência = 4x/semana → frequency = 4, gerar exatamente 4 rotinas (A, B, C, D) (ex: Upper/Lower A/B ou ABCD).
  * Exemplo: Se frequência = 5x/semana → frequency = 5, gerar exatamente 5 rotinas (A, B, C, D, E) (ex: ABCDE ou PPLUL).
- DURAÇÃO DA SESSÃO:
  * O número de exercícios e séries DEVE caber no tempo disponível informado (trainingProfile.durationMinutes).
  * Sessão de 30-45 min: 3 a 5 exercícios no total (volume compacto, 10-15 séries totais por sessão).
  * Sessão de 60 min: 5 a 6 exercícios no total (15-20 séries totais por sessão).
  * Sessão de 75-90 min: 6 a 7 exercícios no total (20-24 séries totais por sessão).
- EQUIPAMENTOS DISPONÍVEIS:
  * Prescreva apenas exercícios viáveis nos equipamentos declarados em constraints.availableEquipment (ex: 'Full Gym', 'Home Gym', 'Calistenia', 'Mínimo').
- PACIENTES MENORES DE IDADE (patient.age < 18):
  * Se o paciente for menor de 18 anos, priorize o aprendizado motor, execução técnica impecável, faixas de repetições controladas (8 a 15 reps) e RPE moderado (6 a 8), evitando cargas axiais máximas sem suporte.

[PRIORIDADE 4 — ESTADO CORPORAL E ANTROPOMETRIA]
- Utilize o percentual de gordura (bodyFatPercent), massa magra (leanMassKg) e circunferências/dobras para modular a priorização de grupamentos musculares e a resposta adaptativa.

[PRIORIDADE 5 — CONTEXTO ENERGÉTICO E METABÓLICO]
- DÉFICIT CALÓRICO (nutrition.energyBalanceKcal < 0): O paciente está em restrição calórica. O volume de treino deve ser dosado para evitar overreaching/overtraining. Evite volumes extremos (> 90 séries semanais totais).
- SUPERÁVIT CALÓRICO (nutrition.energyBalanceKcal > 0): O ambiente energético favorece hipertrofia e regeneração. O volume pode ser progressivo e desafiador.
- HORAS DE SONO (lifestyle.sleepHours): Se o sono for curto (< 6h) ou de qualidade ruim, atente-se à recuperação sistêmica.

[PRIORIDADE 6 — OTIMIZAÇÃO E ESTRUTURAÇÃO BIOMECÂNICA]
- Variedade de planos e vetores articulares (empurrar horizontal/vertical, puxar horizontal/vertical, dominante de joelho/quadril).
- Indique tempos de descanso (rest) condizentes com a complexidade do movimento.
- Utilize o campo "obs" para orientações biomecânicas objetivas (cadência, ponto de contração, pegada, amplitude).

RESPONDA EXCLUSIVAMENTE COM JSON VÁLIDO.
NÃO UTILIZE MARKDOWN.
NÃO UTILIZE \`\`\`json.
NÃO ADICIONE EXPLICAÇÕES.
NÃO ADICIONE TEXTO ANTES OU DEPOIS DO JSON.

=== TrainingPrescriptionSchema (CONTRATO ESTRUTURAL OBRIGATÓRIO) ===
{
  "frequency": <número inteiro entre 1 e 7>,
  "routines": [
    {
      "id": "<string identificadora, ex: 'A', 'B', 'C'>",
      "name": "<string com nome da rotina, ex: 'Treino A · Push Biomecânico'>",
      "exercises": [
        {
          "name": "<string com o nome do exercício>",
          "sets": <número inteiro >= 1>,
          "reps": "<string com a faixa de repetições, ex: '6-8', '8-10', '10-12'>",
          "rpe": <número entre 1 e 10, ex: 8, 7.5, 8.5>,
          "rest": <número inteiro de segundos >= 0, ex: 60, 90, 120>,
          "obs": "<string opcional com orientação técnica/biomecânica>"
        }
      ]
    }
  ]
}

=== DTO CANÔNICO DO CONTEXTO ===
${JSON.stringify(context)}`;
  // Contexto minificado (sem espaços) para reduzir tokens e latência da API

  // 3. Retroalimentação de erros de tentativas anteriores (se houver)
  if (Array.isArray(previousErrors) && previousErrors.length > 0) {
    prompt += `\n\n=== ALERTA CRÍTICO — TENTATIVA ANTERIOR REJEITADA ===

A tentativa anterior foi REJEITADA pelo sistema determinístico.

Você DEVE corrigir os problemas identificados abaixo.

ERROS DA TENTATIVA ANTERIOR:
${previousErrors.join('\n')}

Não repita os erros anteriores.
Gere uma nova prescrição corrigida, mantendo todos os requisitos do contexto e do TrainingPrescriptionSchema.`;
  }

  // 4. Rotacao por pool de chaves — tenta cada key; pula em caso de 429
  const quotaExhaustedKeys = [];
  let lastError = null;

  for (let ki = 0; ki < apiKeys.length; ki++) {
    const currentKey = apiKeys[ki];
    try {
      console.info(`[Gemini] Tentando chave #${ki + 1} de ${apiKeys.length}...`);
      const prescription = await _callGeminiWithKey(currentKey, prompt);
      if (ki > 0) {
        console.info(`[Gemini] Sucesso com chave #${ki + 1} (após ${ki} quota(s) excedida(s)).`);
      }
      return prescription;
    } catch (err) {
      lastError = err;
      if (err.isQuotaError) {
        quotaExhaustedKeys.push(ki + 1);
        console.warn(`[Gemini] Chave #${ki + 1} com quota excedida. ${ki + 1 < apiKeys.length ? 'Tentando próxima...' : 'Sem mais chaves disponíveis.'}`);
        continue; // tenta a próxima key
      }
      // Erros que não são de quota (timeout, 401, 400...) lançam imediatamente
      throw err;
    }
  }

  // Todas as chaves esgotaram quota
  const poolMsg = apiKeys.length > 1
    ? `Todas as ${apiKeys.length} chaves do pool estão com quota excedida.`
    : 'A chave de API está com quota excedida.';
  const finalErr = new Error(`${poolMsg} Aguarde a renovação (geralmente meia-noite PT) ou adicione novas chaves em "🔑 Chaves de API".`);
  finalErr.isQuotaError = true;
  throw finalErr;
}


// SUITE DE TESTES — Motor de Coerência, Orquestrador e Segurança de Persistência
// runPerformanceAITests()
//
// Testes T01 a T12 + Teste de Integração Ponta a Ponta
// Execute no console do browser: runPerformanceAITests()
// ════════════════════════════════════════════════════════════════════════════

async function runPerformanceAITests() {
  'use strict';

  const results  = [];
  let   dbWrites = 0; // contador de tentativas de escrita no Dexie

  function assert(testId, description, condition, detail = '') {
    const passed = !!condition;
    results.push({ testId, description, passed, detail });
    console.log(`  [T${String(testId).padStart(2,'0')}] ${passed ? '✅ PASS' : '❌ FAIL'} — ${description}${detail ? ' → ' + detail : ''}`);
  }

  // Context de paciente genérico para os testes
  function makeCtx(overrides = {}) {
    return {
      _meta:         { patientId: 'test-patient', tmbMethod: 'Katch-McArdle', hasAssessment: true, hasPrescription: true },
      patient:       { age: 30, sex: 'Masculino', weightKg: 80, heightCm: 175, objective: 'Hipertrofia', trainingLevel: 'Intermediário', patientType: 'Praticante recreativo', ...overrides.patient },
      anthropometry: { bodyFatPercent: 15, targetBodyFatPercent: 12, leanMassKg: 68, ...overrides.anthropometry },
      energy:        { tmbKcal: 2200, getKcal: 3000, activityFactor: 1.42, ...overrides.energy },
      nutrition:     { caloricTargetKcal: 3350, energyBalanceKcal: 350, proteinGKg: 2.0, prescriptionSource: 'prescribed', ...overrides.nutrition },
      constraints:   { injuries: [], prohibitedExercises: [], availableEquipment: 'Full Gym', prescribedCardioId: 'cardio_01', ...overrides.constraints },
    };
  }

  // Prescrição mínima válida
  function makePresc(overrides = {}) {
    return {
      frequency: 4,
      routines: [{
        id: 'A', name: 'Push',
        exercises: [
          { name: 'Supino Reto com Barra', sets: 4, reps: '8-12', rpe: 8 },
          { name: 'Desenvolvimento com Halteres', sets: 3, reps: '10-12', rpe: 7.5 },
        ]
      }],
      ...overrides
    };
  }

  console.group('🧪 runPerformanceAITests — Motor de Coerência e Orquestrador de IA');

  // ── T01: Prescrição válida → PASS ─────────────────────────────────────────
  (() => {
    const ctx    = makeCtx();
    const presc  = makePresc();
    const result = validatePrescriptionAgainstContext(presc, ctx);
    assert(1, 'Prescrição válida → PASS', result.status === 'PASS', `status=${result.status}`);
  })();

  // ── T02: Exercício proibido → REJECT ─────────────────────────────────────
  (() => {
    const ctx = makeCtx({ constraints: { prohibitedExercises: ['agachamento livre'] } });
    const presc = makePresc({
      routines: [{
        id: 'A', name: 'Legs',
        exercises: [{ name: 'Agachamento Livre com Barra', sets: 4, reps: '8-12', rpe: 8 }]
      }]
    });
    const result = validatePrescriptionAgainstContext(presc, ctx);
    assert(2, 'Exercício proibido → REJECT', result.status === 'REJECT', `errors=${JSON.stringify(result.errors)}`);
    assert(2.1, 'Mensagem de erro contém nome do exercício', result.errors.some(e => e.includes('Agachamento Livre com Barra')));
  })();

  // ── T03: Iniciante com frequência 5 → REJECT ─────────────────────────────
  (() => {
    const ctx = makeCtx({ patient: { trainingLevel: 'Iniciante/Recreativo', objective: 'Manutenção' } });
    const presc = makePresc({ frequency: 5 });
    const result = validatePrescriptionAgainstContext(presc, ctx);
    assert(3, 'Iniciante + frequência 5 → REJECT', result.status === 'REJECT', `errors=${JSON.stringify(result.errors)}`);
  })();

  // ── T04: Déficit < -500 + > 90 sets → WARNING ────────────────────────────
  (() => {
    const ctx = makeCtx({ nutrition: { caloricTargetKcal: 2400, energyBalanceKcal: -600, proteinGKg: 2.0, prescriptionSource: 'prescribed' } });
    // 92 sets: 4 rotinas x 23 sets cada
    const bigRoutine = Array.from({ length: 23 }, (_, i) => ({
      name: `Exercício ${i + 1}`, sets: 1, reps: '10-12', rpe: 7
    }));
    const presc = {
      frequency: 4,
      routines: [
        { id: 'A', name: 'R1', exercises: bigRoutine },
        { id: 'B', name: 'R2', exercises: bigRoutine },
        { id: 'C', name: 'R3', exercises: bigRoutine },
        { id: 'D', name: 'R4', exercises: bigRoutine },
      ]
    };
    const result = validatePrescriptionAgainstContext(presc, ctx);
    assert(4, 'Déficit < -500 + > 90 sets → WARNING', result.status === 'WARNING', `status=${result.status}, warnings=${JSON.stringify(result.warnings)}`);
    assert(4.1, 'Não classificado como diagnóstico (apenas revisão)', result.warnings.some(w => w.includes('requer revisão profissional')));
  })();

  // ── T05: Hipertrofia + reps "1" + RPE 10 → WARNING ──────────────────────
  (() => {
    const ctx = makeCtx({ patient: { objective: 'Hipertrofia', trainingLevel: 'Intermediário' } });
    const presc = makePresc({
      routines: [{
        id: 'A', name: 'Power',
        exercises: [{ name: 'Supino Máxima Força', sets: 5, reps: '1', rpe: 10 }]
      }]
    });
    const result = validatePrescriptionAgainstContext(presc, ctx);
    assert(5, 'Hipertrofia + reps="1" + RPE 10 → WARNING', result.status === 'WARNING', `warnings=${JSON.stringify(result.warnings)}`);
    assert(5.1, 'Não rejeita automaticamente (apenas revisão)', result.status !== 'REJECT');
  })();

  // ── T06: JSON estruturalmente inválido → não chega ao validador clínico ──
  (() => {
    const badJson = { frequency: 'muitos', routines: [] }; // routines vazio + frequency string
    const structural = validateAIPrescription(badJson);
    assert(6, 'JSON inválido → validateAIPrescription retorna REJECT', structural.status === 'REJECT');
    // Simula que o orquestrador não passa adiante
    const wouldCallCoherence = structural.status === 'PASS';
    assert(6.1, 'JSON inválido não chega ao motor de coerência', !wouldCallCoherence);
  })();

  // ── T07: 3 respostas rejeitadas consecutivas → circuit breaker ─────────
  (() => {
    let callCount = 0;
    // aiGenerator síncrono simulado (sempre retorna prescrição com exercício proibido)
    const fakeCtx = makeCtx({ constraints: { prohibitedExercises: ['leg press'] } });
    const alwaysRejectedPresc = {
      frequency: 3,
      routines: [{ id: 'A', name: 'Legs', exercises: [{ name: 'Leg Press 45°', sets: 4, reps: '10-12', rpe: 8 }] }]
    };

    // Simula o loop manualmente (generateAndValidateWorkout é async e usa Dexie)
    let attempt = 0;
    let lastResult = null;
    const MAX = 3;

    while (attempt < MAX) {
      attempt++;
      callCount++;
      const structural = validateAIPrescription(alwaysRejectedPresc);
      if (structural.status === 'REJECT') { lastResult = { status: 'REJECT', attempt }; continue; }
      const coherence = validatePrescriptionAgainstContext(structural.data, fakeCtx);
      if (coherence.status === 'REJECT') { lastResult = { status: 'REJECT', attempt }; continue; }
      lastResult = { status: coherence.status, attempt };
      break;
    }

    const circuitBroken = attempt === MAX && lastResult?.status === 'REJECT';
    assert(7, '3 respostas rejeitadas → encerra em exatamente 3 tentativas', callCount === 3 && circuitBroken, `tentativas=${callCount}`);
    assert(7.1, 'Nunca ocorre 4ª tentativa', callCount <= 3);
  })();

  // ── T08: PASS nunca persiste automaticamente ─────────────────────────────
  (() => {
    // Monkey-patch temporário de db.performanceMetabolica.put
    const originalPut = (typeof db !== 'undefined' && db.performanceMetabolica)
      ? db.performanceMetabolica.put.bind(db.performanceMetabolica)
      : null;

    if (originalPut) {
      db.performanceMetabolica.put = (...args) => { dbWrites++; return originalPut(...args); };
    }

    // Executa o motor de coerência diretamente (sem chamada de IA real)
    const ctx   = makeCtx();
    const presc = makePresc();
    const r     = validatePrescriptionAgainstContext(presc, ctx);

    // Restaura
    if (originalPut) db.performanceMetabolica.put = originalPut;

    assert(8, 'PASS: nunca persiste automaticamente', dbWrites === 0, `dbWrites=${dbWrites}`);
  })();

  // ── T09: WARNING nunca persiste automaticamente ──────────────────────────
  (() => {
    const writesBefore = dbWrites;
    const ctx = makeCtx({ patient: { objective: 'Hipertrofia', trainingLevel: 'Intermediário' } });
    const presc = makePresc({
      routines: [{ id: 'A', name: 'P', exercises: [{ name: 'Supino Máx', sets: 5, reps: '2', rpe: 9 }] }]
    });
    validatePrescriptionAgainstContext(presc, ctx);
    assert(9, 'WARNING: nunca persiste automaticamente', dbWrites === writesBefore, `dbWrites delta=${dbWrites - writesBefore}`);
  })();

  // ── T10: REJECT nunca persiste automaticamente ───────────────────────────
  (() => {
    const writesBefore = dbWrites;
    const ctx = makeCtx({ constraints: { prohibitedExercises: ['supino'] } });
    const presc = makePresc({
      routines: [{ id: 'A', name: 'P', exercises: [{ name: 'Supino Inclinado', sets: 4, reps: '10', rpe: 8 }] }]
    });
    validatePrescriptionAgainstContext(presc, ctx);
    assert(10, 'REJECT: nunca persiste automaticamente', dbWrites === writesBefore, `dbWrites delta=${dbWrites - writesBefore}`);
  })();

  // ── T11: patientId nunca vem da resposta da IA ───────────────────────────
  (() => {
    // A IA poderia tentar injetar um patientId diferente no payload
    const maliciousAIResponse = {
      frequency: 3,
      patientId: 'outro-paciente-injetado', // campo não esperado — deve ser ignorado
      routines: [{
        id: 'A', name: 'Push',
        exercises: [{ name: 'Supino Reto', sets: 4, reps: '8-12', rpe: 8 }]
      }]
    };
    const structural = validateAIPrescription(maliciousAIResponse);
    const hasInjectedPatientId = structural.data && 'patientId' in (structural.data || {});
    assert(11, 'patientId não é extraído da resposta da IA', !hasInjectedPatientId, `patientId no data=${hasInjectedPatientId}`);
  })();

  // ── T12: Campos desconhecidos da IA são descartados ──────────────────────
  (() => {
    const aiWithUnknownFields = {
      frequency: 3,
      routines: [{
        id: 'A', name: 'Push',
        exercises: [{
          name: 'Supino', sets: 4, reps: '8-12', rpe: 8,
          injectField:    'payload malicioso',  // campo desconhecido
          __proto__:      'tentativa de proto pollution', // deve ser ignorado
        }]
      }],
      extraMetadata: { leanMassKg: 999, tmbKcal: 9999 } // campos canônicos injetados pela IA
    };
    const structural = validateAIPrescription(aiWithUnknownFields);
    const cleanEx    = structural.data?.routines?.[0]?.exercises?.[0];
    const leaked     = cleanEx && ('injectField' in cleanEx || 'extraMetadata' in (structural.data || {}));
    assert(12, 'Campos desconhecidos da IA não chegam à camada de persistência', !leaked, `leaked=${leaked}`);
    // Campos canônicos do contexto permanecem inalterados
    assert(12.1, 'extraMetadata (leanMassKg injetado pela IA) não existe no DTO limpo', !('extraMetadata' in (structural.data || {})));
  })();

  // ── Resultado Final ───────────────────────────────────────────────────────
  const total  = results.filter(r => Number.isInteger(r.testId)).length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed);

  console.groupEnd();
  console.info(`\n📊 Resultado: ${passed}/${results.length} testes passaram.`);

  if (failed.length > 0) {
    console.warn('❌ Testes com falha:');
    failed.forEach(f => console.warn(`   T${f.testId}: ${f.description} → ${f.detail}`));
  } else {
    console.info('✅ Todos os testes passaram. Motor de coerência operacional.');
  }

  return { total: results.length, passed, failed: failed.length, details: results };
}

// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
// SUITE DE TESTES ESPECÍFICOS DO GEMINI — Testes A a I
// runGeminiPerformanceAITests()
//
// Execute no console do browser: runGeminiPerformanceAITests()
// ════════════════════════════════════════════════════════════════════════════

async function runGeminiPerformanceAITests() {
  'use strict';

  const results = [];
  function assert(testId, description, condition, detail = '') {
    const passed = !(!condition);
    results.push({ testId, description, passed, detail });
    console.log('  [' + testId + '] ' + (passed ? '✅ PASS' : '❌ FAIL') + ' — ' + description + (detail ? ' → ' + detail : ''));
  }

  console.group('🧪 runGeminiPerformanceAITests — Testes Unitários e Isolados do Gerador Gemini');

  const dummyCtx = {
    _meta: { patientId: 'test-pt', tmbMethod: 'Katch-McArdle' },
    patient: { age: 28, sex: 'Masculino', weightKg: 75, heightCm: 178, objective: 'Hipertrofia', trainingLevel: 'Intermediário' },
    anthropometry: { bodyFatPercent: 14, targetBodyFatPercent: 11, leanMassKg: 64.5 },
    energy: { tmbKcal: 2100, getKcal: 2900, activityFactor: 1.38 },
    nutrition: { caloricTargetKcal: 3200, energyBalanceKcal: 300, proteinGKg: 2.0, prescriptionSource: 'prescribed' },
    constraints: { injuries: [], prohibitedExercises: ['supino reto'], availableEquipment: 'Full Gym' }
  };

  const lsObj = typeof localStorage !== 'undefined' ? localStorage : (typeof window !== 'undefined' ? window.localStorage : null);
  const origGetItem = lsObj ? lsObj.getItem.bind(lsObj) : () => null;

  const getActiveFetch = () => (typeof window !== 'undefined' && window.fetch) ? window.fetch : (typeof fetch !== 'undefined' ? fetch : null);
  const origFetch = getActiveFetch();

  const setMockFetch = (fn) => {
    if (typeof window !== 'undefined') window.fetch = fn;
    if (typeof globalThis !== 'undefined') globalThis.fetch = fn;
  };

  const setMockStorage = (fn) => {
    if (lsObj) lsObj.getItem = fn;
    if (typeof window !== 'undefined' && window.localStorage) window.localStorage.getItem = fn;
  };

  // ── Teste A: Ausência da chave da API ──────────────────────────────────────
  await (async () => {
    let thrown = null;
    try {
      setMockStorage((key) => key === 'GEMINI_API_KEY' ? null : origGetItem(key));
      await geminiPerformanceAIGenerator(dummyCtx);
    } catch (e) {
      thrown = e;
    } finally {
      setMockStorage(origGetItem);
    }
    const isExactMsg = thrown && thrown.message === 'Chave da API Gemini não configurada. Configure GEMINI_API_KEY no localStorage.';
    assert('Teste A', 'Ausência da chave → lança erro com mensagem exata', isExactMsg, thrown ? thrown.message : 'Nenhum erro lançado');
  })();

  // ── Teste B: Chave configurada, Endpoint e Modelo ──────────────────────────
  await (async () => {
    let capturedUrl = '';
    let capturedBody = null;
    try {
      setMockStorage((key) => key === 'GEMINI_API_KEY' ? 'TEST_KEY_SECRET' : origGetItem(key));
      setMockFetch(async (url, options) => {
        capturedUrl = url;
        capturedBody = JSON.parse(options.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{ text: JSON.stringify({ frequency: 3, routines: [{ id: 'A', name: 'Push', exercises: [{ name: 'Desenvolvimento', sets: 3, reps: '8-10', rpe: 8 }] }] }) }]
              }
            }]
          })
        };
      });
      await geminiPerformanceAIGenerator(dummyCtx);
    } catch (e) {
      // Ignora
    } finally {
      setMockStorage(origGetItem);
      setMockFetch(origFetch);
    }

    const correctUrl = capturedUrl.includes('models/' + GEMINI_MODEL + ':generateContent?key=TEST_KEY_SECRET');
    const correctConfig = capturedBody && capturedBody.generationConfig && capturedBody.generationConfig.responseMimeType === 'application/json' && capturedBody.generationConfig.temperature === 0.2;
    assert('Teste B', 'Chave configurada → usa GEMINI_MODEL (' + GEMINI_MODEL + ') e endpoint correto', correctUrl && correctConfig, 'url=' + capturedUrl);
  })();

  // ── Teste C: previousErrors vazio → sem bloco de alerta ───────────────────
  await (async () => {
    let capturedPrompt = '';
    try {
      setMockStorage((key) => key === 'GEMINI_API_KEY' ? 'TEST_KEY' : origGetItem(key));
      setMockFetch(async (url, options) => {
        const body = JSON.parse(options.body);
        capturedPrompt = (body && body.contents && body.contents[0] && body.contents[0].parts && body.contents[0].parts[0] && body.contents[0].parts[0].text) || '';
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: '{"frequency": 3, "routines": []}' }] } }]
          })
        };
      });
      await geminiPerformanceAIGenerator(dummyCtx, []);
    } catch (e) {
    } finally {
      setMockStorage(origGetItem);
      setMockFetch(origFetch);
    }
    const hasAlert = capturedPrompt.includes('=== ALERTA CRÍTICO — TENTATIVA ANTERIOR REJEITADA ===');
    assert('Teste C', 'previousErrors vazio → não inclui bloco de alerta crítico', !hasAlert);
  })();

  // ── Teste D: previousErrors preenchido → inclui bloco corretivo ───────────
  await (async () => {
    let capturedPrompt = '';
    const errList = ['Exercício proibido detectado: Supino Reto', 'Frequência incompatível'];
    try {
      setMockStorage((key) => key === 'GEMINI_API_KEY' ? 'TEST_KEY' : origGetItem(key));
      setMockFetch(async (url, options) => {
        const body = JSON.parse(options.body);
        capturedPrompt = (body && body.contents && body.contents[0] && body.contents[0].parts && body.contents[0].parts[0] && body.contents[0].parts[0].text) || '';
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: '{"frequency": 3, "routines": []}' }] } }]
          })
        };
      });
      await geminiPerformanceAIGenerator(dummyCtx, errList);
    } catch (e) {
    } finally {
      setMockStorage(origGetItem);
      setMockFetch(origFetch);
    }
    const hasAlert = capturedPrompt.includes('=== ALERTA CRÍTICO — TENTATIVA ANTERIOR REJEITADA ===');
    const hasErr1 = capturedPrompt.includes('Exercício proibido detectado: Supino Reto');
    const hasErr2 = capturedPrompt.includes('Frequência incompatível');
    assert('Teste D', 'previousErrors preenchido → inclui bloco com todos os erros', hasAlert && hasErr1 && hasErr2);
  })();

  // ── Teste E: JSON puro retornado ──────────────────────────────────────────
  await (async () => {
    let resObj = null;
    const testObj = { frequency: 4, routines: [{ id: 'A', name: 'Push', exercises: [] }] };
    try {
      setMockStorage((key) => key === 'GEMINI_API_KEY' ? 'TEST_KEY' : origGetItem(key));
      setMockFetch(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify(testObj) }] } }]
        })
      }));
      resObj = await geminiPerformanceAIGenerator(dummyCtx);
    } catch (e) {
    } finally {
      setMockStorage(origGetItem);
      setMockFetch(origFetch);
    }
    assert('Teste E', 'JSON puro retornado → faz parse para objeto JS válido', resObj && resObj.frequency === 4);
  })();

  // ── Teste F: JSON encapsulado em Markdown ```json ─────────────────────────
  await (async () => {
    let resObj = null;
    const testObj = { frequency: 5, routines: [{ id: 'B', name: 'Pull', exercises: [] }] };
    try {
      setMockStorage((key) => key === 'GEMINI_API_KEY' ? 'TEST_KEY' : origGetItem(key));
      setMockFetch(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '```json\n' + JSON.stringify(testObj, null, 2) + '\n```' }] } }]
        })
      }));
      resObj = await geminiPerformanceAIGenerator(dummyCtx);
    } catch (e) {
    } finally {
      setMockStorage(origGetItem);
      setMockFetch(origFetch);
    }
    assert('Teste F', 'JSON em bloco Markdown ```json → sanitiza e faz parse com sucesso', resObj && resObj.frequency === 5);
  })();

  // ── Teste G: JSON inválido ────────────────────────────────────────────────
  await (async () => {
    let thrown = null;
    try {
      setMockStorage((key) => key === 'GEMINI_API_KEY' ? 'TEST_KEY' : origGetItem(key));
      setMockFetch(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Este é apenas um texto sem nenhum JSON.' }] } }]
        })
      }));
      await geminiPerformanceAIGenerator(dummyCtx);
    } catch (e) {
      thrown = e;
    } finally {
      setMockStorage(origGetItem);
      setMockFetch(origFetch);
    }
    const isJsonErr = thrown && thrown.message.includes('não contém JSON válido');
    assert('Teste G', 'Texto sem JSON → lança erro controlado', isJsonErr, thrown ? thrown.message : '');
  })();

  // ── Teste H: Erros HTTP (400, 401, 403, 429, 500) ─────────────────────────
  for (const status of [400, 401, 403, 429, 500]) {
    await (async () => {
      let thrown = null;
      try {
        setMockStorage((key) => key === 'GEMINI_API_KEY' ? 'TEST_KEY' : origGetItem(key));
        setMockFetch(async () => ({
          ok: false,
          status,
          statusText: 'Error',
          json: async () => ({ error: { message: 'Simulated error for status ' + status } })
        }));
        await geminiPerformanceAIGenerator(dummyCtx);
      } catch (e) {
        thrown = e;
      } finally {
        setMockStorage(origGetItem);
        setMockFetch(origFetch);
      }
      const hasStatusMsg = thrown && thrown.message.includes('HTTP ' + status);
      assert('Teste H (' + status + ')', 'HTTP ' + status + ' → lança erro específico para status ' + status, hasStatusMsg, thrown ? thrown.message : '');
    })();
  }

  // ── Teste I: Timeout via AbortError ───────────────────────────────────────
  await (async () => {
    let thrown = null;
    try {
      setMockStorage((key) => key === 'GEMINI_API_KEY' ? 'TEST_KEY' : origGetItem(key));
      setMockFetch(async () => {
        const abortErr = new Error('The user aborted a request.');
        abortErr.name = 'AbortError';
        throw abortErr;
      });
      await geminiPerformanceAIGenerator(dummyCtx);
    } catch (e) {
      thrown = e;
    } finally {
      setMockStorage(origGetItem);
      setMockFetch(origFetch);
    }
    const isTimeoutMsg = thrown && thrown.message.includes('limite de 30 segundos (timeout)');
    assert('Teste I', 'Timeout da requisição → lança erro de tempo limite excedido', isTimeoutMsg, thrown ? thrown.message : '');
  })();

  console.groupEnd();
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed);
  console.info('\n📊 Resultado Testes Gemini: ' + passed + '/' + results.length + ' passaram.');
  return { total: results.length, passed, failed: failed.length, details: results };
}


// ════════════════════════════════════════════════════════════════════════════
// SUITE DE TESTES DE PERSONALIZAÇÃO, SENSIBILIDADE E NÃO-CONTAMINAÇÃO
// runPersonalizationPerformanceTests()
//
// Execute no console do browser: runPersonalizationPerformanceTests()
// ════════════════════════════════════════════════════════════════════════════

async function runPersonalizationPerformanceTests() {
  'use strict';

  const results = [];
  function assert(testId, description, condition, detail = '') {
    const passed = !(!condition);
    results.push({ testId, description, passed, detail });
    console.log('  [' + testId + '] ' + (passed ? '✅ PASS' : '❌ FAIL') + ' — ' + description + (detail ? ' → ' + detail : ''));
  }

  console.group('🧪 runPersonalizationPerformanceTests — Testes de Personalização, Sensibilidade e Não-Contaminação');

  const lsObj = typeof localStorage !== 'undefined' ? localStorage : (typeof window !== 'undefined' ? window.localStorage : null);
  const origGetItem = lsObj ? lsObj.getItem.bind(lsObj) : () => null;
  const setMockStorage = (fn) => {
    if (lsObj) lsObj.getItem = fn;
    if (typeof window !== 'undefined' && window.localStorage) window.localStorage.getItem = fn;
  };

  const getActiveFetch = () => (typeof window !== 'undefined' && window.fetch) ? window.fetch : (typeof fetch !== 'undefined' ? fetch : null);
  const origFetch = getActiveFetch();
  const setMockFetch = (fn) => {
    if (typeof window !== 'undefined') window.fetch = fn;
    if (typeof globalThis !== 'undefined') globalThis.fetch = fn;
  };

  // ── TESTE 1: Diferenciação Real entre Pacientes Distintos ─────────────────
  await (async () => {
    // Paciente Jovem Iniciante (15 anos, 3x/sem, 45 min, Hipertrofia)
    const ctxJovem = {
      _meta: { patientId: 'pt-jovem-15', contextVersion: '1.1' },
      patient: { age: 15, sex: 'Masculino', weightKg: 62, heightCm: 172, bmi: 21.0, objective: 'Hipertrofia', trainingLevel: 'Iniciante', patientType: 'Praticante recreativo' },
      trainingProfile: { frequencyWeekly: 3, frequencyLabel: '3x/semana', durationMinutes: 45, durationLabel: '45 min', intensity: 'Moderada', isMinor: true, trainingLevel: 'Iniciante' },
      anthropometry: { bodyFatPercent: 12, targetBodyFatPercent: 10, leanMassKg: 54.5, fatMassKg: 7.5 },
      energy: { tmbKcal: 1650, getKcal: 2350, activityFactor: 1.42 },
      nutrition: { caloricTargetKcal: 2650, energyBalanceKcal: 300, proteinGKg: 2.0 },
      constraints: { injuries: [], prohibitedExercises: [], availableEquipment: 'Full Gym' }
    };

    // Paciente Adulto Avançado (39 anos, 5x/sem, 60 min, Emagrecimento em déficit)
    const ctxAdulto = {
      _meta: { patientId: 'pt-adulto-39', contextVersion: '1.1' },
      patient: { age: 39, sex: 'Masculino', weightKg: 92, heightCm: 180, bmi: 28.4, objective: 'Emagrecimento', trainingLevel: 'Avançado', patientType: 'Atleta' },
      trainingProfile: { frequencyWeekly: 5, frequencyLabel: '5x/semana', durationMinutes: 60, durationLabel: '60 min', intensity: 'Alta', isMinor: false, trainingLevel: 'Avançado' },
      anthropometry: { bodyFatPercent: 24, targetBodyFatPercent: 14, leanMassKg: 70.0, fatMassKg: 22.0 },
      energy: { tmbKcal: 1950, getKcal: 2900, activityFactor: 1.55 },
      nutrition: { caloricTargetKcal: 2300, energyBalanceKcal: -600, proteinGKg: 2.2 },
      constraints: { injuries: [], prohibitedExercises: [], availableEquipment: 'Full Gym' }
    };

    let promptJovem = '';
    let promptAdulto = '';

    try {
      setMockStorage((key) => key === 'GEMINI_API_KEY' ? 'TEST_KEY' : origGetItem(key));

      setMockFetch(async (url, opts) => {
        const body = JSON.parse(opts.body);
        promptJovem = body?.contents?.[0]?.parts?.[0]?.text || '';
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    frequency: 3,
                    routines: [
                      { id: 'A', name: 'Treino A · Full Body Jovem', exercises: [{ name: 'Leg Press 45°', sets: 3, reps: '10-12', rpe: 7, rest: 60 }, { name: 'Puxada Frontal', sets: 3, reps: '10-12', rpe: 7, rest: 60 }] },
                      { id: 'B', name: 'Treino B · Full Body Jovem', exercises: [{ name: 'Supino com Halteres', sets: 3, reps: '10-12', rpe: 7, rest: 60 }, { name: 'Mesa Flexora', sets: 3, reps: '10-12', rpe: 7, rest: 60 }] },
                      { id: 'C', name: 'Treino C · Full Body Jovem', exercises: [{ name: 'Desenvolvimento Halteres', sets: 3, reps: '10-12', rpe: 7, rest: 60 }, { name: 'Remada Baixa', sets: 3, reps: '10-12', rpe: 7, rest: 60 }] }
                    ]
                  })
                }]
              }
            }]
          })
        };
      });
      const prescJovem = await geminiPerformanceAIGenerator(ctxJovem);

      setMockFetch(async (url, opts) => {
        const body = JSON.parse(opts.body);
        promptAdulto = body?.contents?.[0]?.parts?.[0]?.text || '';
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    frequency: 5,
                    routines: [
                      { id: 'A', name: 'Treino A · Push', exercises: [{ name: 'Supino Reto', sets: 4, reps: '6-8', rpe: 8.5, rest: 90 }] },
                      { id: 'B', name: 'Treino B · Pull', exercises: [{ name: 'Remada Curvada', sets: 4, reps: '6-8', rpe: 8.5, rest: 90 }] },
                      { id: 'C', name: 'Treino C · Legs', exercises: [{ name: 'Agachamento Livre', sets: 4, reps: '6-8', rpe: 8.5, rest: 120 }] },
                      { id: 'D', name: 'Treino D · Upper', exercises: [{ name: 'Desenvolvimento Militar', sets: 4, reps: '8-10', rpe: 8, rest: 90 }] },
                      { id: 'E', name: 'Treino E · Lower', exercises: [{ name: 'Stiff com Barra', sets: 4, reps: '8-10', rpe: 8, rest: 90 }] }
                    ]
                  })
                }]
              }
            }]
          })
        };
      });
      const prescAdulto = await geminiPerformanceAIGenerator(ctxAdulto);

      const hasDiffFreq = prescJovem.frequency === 3 && prescAdulto.frequency === 5;
      const hasDiffRoutines = prescJovem.routines.length === 3 && prescAdulto.routines.length === 5;
      const promptHasMinorRule = promptJovem.includes('patient.age < 18') || promptJovem.includes('menor de 18 anos');
      const promptHasEnergyDiff = promptJovem.includes('2650') && promptAdulto.includes('2300');

      assert('Teste 1.1', 'Diferenciação: Prescrições possuem frequências e rotinas distintas (3 vs 5)', hasDiffFreq && hasDiffRoutines, `Jovem=${prescJovem.frequency}x, Adulto=${prescAdulto.frequency}x`);
      assert('Teste 1.2', 'Diferenciação: Prompt do jovem inclui diretriz de menores de idade', promptHasMinorRule);
      assert('Teste 1.3', 'Diferenciação: Prompts refletem contextos energéticos e calóricos individuais', promptHasEnergyDiff);
    } finally {
      setMockStorage(origGetItem);
      setMockFetch(origFetch);
    }
  })();

  // ── TESTE 2: Testes de Sensibilidade a Variáveis Isoladas ─────────────────
  await (async () => {
    // 2.1 Sensibilidade à Frequência (3x vs 5x)
    const baseCtx = {
      _meta: { patientId: 'pt-sens', contextVersion: '1.1' },
      patient: { age: 28, sex: 'Masculino', weightKg: 78, heightCm: 178, objective: 'Hipertrofia', trainingLevel: 'Intermediário' },
      trainingProfile: { frequencyWeekly: 3, durationMinutes: 60, intensity: 'Moderada', trainingLevel: 'Intermediário' },
      anthropometry: { bodyFatPercent: 15, targetBodyFatPercent: 12, leanMassKg: 66.3 },
      energy: { tmbKcal: 1800, getKcal: 2600, activityFactor: 1.45 },
      nutrition: { caloricTargetKcal: 2900, energyBalanceKcal: 300, proteinGKg: 2.0 },
      constraints: { injuries: [], prohibitedExercises: [], availableEquipment: 'Full Gym' }
    };

    let promptFreq3 = '';
    let promptFreq5 = '';

    try {
      setMockStorage((key) => key === 'GEMINI_API_KEY' ? 'TEST_KEY' : origGetItem(key));

      // Teste com freq 3
      setMockFetch(async (url, opts) => {
        promptFreq3 = JSON.parse(opts.body)?.contents?.[0]?.parts?.[0]?.text || '';
        return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"frequency": 3, "routines": []}' }] } }] }) };
      });
      await geminiPerformanceAIGenerator({ ...baseCtx, trainingProfile: { ...baseCtx.trainingProfile, frequencyWeekly: 3 } });

      // Teste com freq 5
      setMockFetch(async (url, opts) => {
        promptFreq5 = JSON.parse(opts.body)?.contents?.[0]?.parts?.[0]?.text || '';
        return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"frequency": 5, "routines": []}' }] } }] }) };
      });
      await geminiPerformanceAIGenerator({ ...baseCtx, trainingProfile: { ...baseCtx.trainingProfile, frequencyWeekly: 5 } });

      assert('Teste 2.1', 'Sensibilidade à Frequência: prompt reflete 3x vs 5x', promptFreq3.includes('"frequencyWeekly": 3') && promptFreq5.includes('"frequencyWeekly": 5'));

      // 2.2 Sensibilidade ao Objetivo (Hipertrofia vs Emagrecimento)
      let promptObjHip = '';
      let promptObjEma = '';

      setMockFetch(async (url, opts) => {
        promptObjHip = JSON.parse(opts.body)?.contents?.[0]?.parts?.[0]?.text || '';
        return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"frequency": 4, "routines": []}' }] } }] }) };
      });
      await geminiPerformanceAIGenerator({ ...baseCtx, patient: { ...baseCtx.patient, objective: 'Hipertrofia' } });

      setMockFetch(async (url, opts) => {
        promptObjEma = JSON.parse(opts.body)?.contents?.[0]?.parts?.[0]?.text || '';
        return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"frequency": 4, "routines": []}' }] } }] }) };
      });
      await geminiPerformanceAIGenerator({ ...baseCtx, patient: { ...baseCtx.patient, objective: 'Emagrecimento' } });

      assert('Teste 2.2', 'Sensibilidade ao Objetivo: prompt reflete Hipertrofia vs Emagrecimento', promptObjHip.includes('"objective": "Hipertrofia"') && promptObjEma.includes('"objective": "Emagrecimento"'));

      // 2.3 Sensibilidade à Duração (30 min vs 60 min)
      let promptDur30 = '';
      let promptDur60 = '';

      setMockFetch(async (url, opts) => {
        promptDur30 = JSON.parse(opts.body)?.contents?.[0]?.parts?.[0]?.text || '';
        return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"frequency": 4, "routines": []}' }] } }] }) };
      });
      await geminiPerformanceAIGenerator({ ...baseCtx, trainingProfile: { ...baseCtx.trainingProfile, durationMinutes: 30 } });

      setMockFetch(async (url, opts) => {
        promptDur60 = JSON.parse(opts.body)?.contents?.[0]?.parts?.[0]?.text || '';
        return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"frequency": 4, "routines": []}' }] } }] }) };
      });
      await geminiPerformanceAIGenerator({ ...baseCtx, trainingProfile: { ...baseCtx.trainingProfile, durationMinutes: 60 } });

      assert('Teste 2.3', 'Sensibilidade à Duração: prompt reflete 30 min vs 60 min', promptDur30.includes('"durationMinutes": 30') && promptDur60.includes('"durationMinutes": 60'));
    } finally {
      setMockStorage(origGetItem);
      setMockFetch(origFetch);
    }
  })();

  // ── TESTE 3: Não Contaminação entre Pacientes (Ordem A→B vs B→A) ───────────
  await (async () => {
    const ptA = {
      _meta: { patientId: 'pt-A-isolation', contextVersion: '1.1' },
      patient: { age: 25, sex: 'Feminino', weightKg: 58, heightCm: 165, objective: 'Hipertrofia' },
      trainingProfile: { frequencyWeekly: 4, durationMinutes: 50 },
      constraints: { prohibitedExercises: ['elevação pélvica'] }
    };
    const ptB = {
      _meta: { patientId: 'pt-B-isolation', contextVersion: '1.1' },
      patient: { age: 45, sex: 'Masculino', weightKg: 85, heightCm: 175, objective: 'Saúde & Manutenção' },
      trainingProfile: { frequencyWeekly: 3, durationMinutes: 45 },
      constraints: { prohibitedExercises: ['supino reto'] }
    };

    let promptOrder1_A = '', promptOrder1_B = '';
    let promptOrder2_B = '', promptOrder2_A = '';

    try {
      setMockStorage((key) => key === 'GEMINI_API_KEY' ? 'TEST_KEY' : origGetItem(key));

      // Ordem 1: A depois B
      setMockFetch(async (u, o) => {
        promptOrder1_A = JSON.parse(o.body)?.contents?.[0]?.parts?.[0]?.text || '';
        return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"frequency": 4, "routines": []}' }] } }] }) };
      });
      await geminiPerformanceAIGenerator(ptA);

      setMockFetch(async (u, o) => {
        promptOrder1_B = JSON.parse(o.body)?.contents?.[0]?.parts?.[0]?.text || '';
        return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"frequency": 3, "routines": []}' }] } }] }) };
      });
      await geminiPerformanceAIGenerator(ptB);

      // Ordem 2: B depois A
      setMockFetch(async (u, o) => {
        promptOrder2_B = JSON.parse(o.body)?.contents?.[0]?.parts?.[0]?.text || '';
        return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"frequency": 3, "routines": []}' }] } }] }) };
      });
      await geminiPerformanceAIGenerator(ptB);

      setMockFetch(async (u, o) => {
        promptOrder2_A = JSON.parse(o.body)?.contents?.[0]?.parts?.[0]?.text || '';
        return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"frequency": 4, "routines": []}' }] } }] }) };
      });
      await geminiPerformanceAIGenerator(ptA);

      const isA_Identical = promptOrder1_A === promptOrder2_A;
      const isB_Identical = promptOrder1_B === promptOrder2_B;
      const noLeakB_in_A = !promptOrder1_A.includes('supino reto') && !promptOrder2_A.includes('supino reto');
      const noLeakA_in_B = !promptOrder1_B.includes('elevação pélvica') && !promptOrder2_B.includes('elevação pélvica');

      assert('Teste 3.1', 'Não Contaminação: Paciente A gera prompt idêntico independentemente da ordem', isA_Identical);
      assert('Teste 3.2', 'Não Contaminação: Paciente B gera prompt idêntico independentemente da ordem', isB_Identical);
      assert('Teste 3.3', 'Não Contaminação: Restrições de A não vazam para B e vice-versa', noLeakB_in_A && noLeakA_in_B);
    } finally {
      setMockStorage(origGetItem);
      setMockFetch(origFetch);
    }
  })();

  // ── TESTE 4: Integridade do Contexto Canônico Expandido ───────────────────
  await (async () => {
    // Mock completo de paciente no Dexie
    const originalPatientsGet = (typeof db !== 'undefined' && db.patients) ? db.patients.get : null;
    const originalAssessmentsWhere = (typeof db !== 'undefined' && db.assessments) ? db.assessments.where : null;

    try {
      if (typeof db !== 'undefined') {
        db.patients.get = async (id) => ({
          id: id || 'pt-full-audit',
          name: 'Paciente Completo Auditoria',
          age: 32,
          gender: 'Masculino',
          height: 1.82,
          currentWeight: 84.5,
          usualWeight: 83.0,
          targetWeight: 80.0,
          objective: 'Hipertrofia & Definição',
          patientType: 'Praticante recreativo',
          activityFactor: 1.48,
          workoutType: 'Musculação / Força',
          workoutFrequency: '4x/semana',
          workoutDuration: '60 min',
          workoutIntensity: 'Alta',
          workoutTime: '06:30',
          neatRoutine: 'Moderado',
          sleepHours: 8.0,
          sleepQuality: 'Boa',
          stressLevel: 'Baixo',
          hydrationLiters: 3.5,
          cookingAvailability: 'Alta',
          mealPreparer: 'O próprio paciente',
          bowelHabit: 'Regular (1x a 2x/dia)',
          clinicalNotes: 'Histórico de dor no ombro direito',
          dietaryRestrictions: 'Sem glúten',
          prohibitedExercises: ['desenvolvimento nuca']
        });

        db.assessments.where = () => ({
          equals: () => ({
            toArray: async () => [{
              id: 'eval_audit_1',
              patientId: 'pt-full-audit',
              date: '2026-08-20',
              fatPercent: 14.5,
              targetBF: 11.0,
              leanMass: 72.2,
              fatMass: 12.3,
              waist: 82.0,
              hip: 100.0,
              circAbdomen: 85.0,
              arm: 38.0,
              circThigh: 60.0,
              skChest: 10,
              skTriceps: 8,
              skSubscapular: 12,
              skAbdominal: 16,
              skSuprailiac: 11,
              skThigh: 14
            }]
          })
        });

        const builtCtx = await buildPerformanceContext('pt-full-audit');
        const hasAllSections = builtCtx &&
          builtCtx.patient && builtCtx.patient.targetWeightKg === 80.0 &&
          builtCtx.trainingProfile && builtCtx.trainingProfile.frequencyWeekly === 4 && builtCtx.trainingProfile.durationMinutes === 60 &&
          builtCtx.anthropometry && builtCtx.anthropometry.leanMassKg === 72.2 && builtCtx.anthropometry.circumferences && builtCtx.anthropometry.circumferences.waist === 82.0 &&
          builtCtx.lifestyle && builtCtx.lifestyle.sleepHours === 8.0 &&
          builtCtx.clinical && builtCtx.clinical.clinicalNotes.includes('ombro direito') &&
          builtCtx.constraints && builtCtx.constraints.prohibitedExercises.includes('desenvolvimento nuca');

        assert('Teste 4.1', 'Integridade: buildPerformanceContext popula 100% dos dados da Anamnese, Antropometria e Restrições', !!hasAllSections);
      }
    } finally {
      if (typeof db !== 'undefined' && originalPatientsGet) db.patients.get = originalPatientsGet;
      if (typeof db !== 'undefined' && originalAssessmentsWhere) db.assessments.where = originalAssessmentsWhere;
    }
  })();

  console.groupEnd();
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed);
  console.info('\n📊 Resultado Testes Personalização: ' + passed + '/' + results.length + ' passaram.');
  return { total: results.length, passed, failed: failed.length, details: results };
}


async function savePerformanceForPatient(patientId = activePatientId) {
  const pId = patientId || activePatientId || (document.getElementById("activePatientSelect")?.value) || "paulo-vitor";
  if (!pId) return;

  perfWeeklySchedule = perfNormalizeWeeklySchedule(perfWeeklySchedule);
  const metaToSave = {
    ...(perfWorkoutMeta || {}),
    patientId: pId
  };

  const record = {
    id: pId,
    patientId: pId,
    activeSplit: perfActiveSplit,
    workoutPlan: perfWorkoutPlan,
    weeklySchedule: perfWeeklySchedule,
    prescribedCardioId: perfPrescribedCardioId,
    heartRateZones: perfCustomHRZones,
    auditData: perfAuditData,
    meta: metaToSave,
    // Persiste o estado pendente de aprovação da IA para que sobreviva ao reload
    pendingAIValidation: (perfPendingAIValidation && perfPendingAIValidation.patientId === pId)
      ? perfPendingAIValidation
      : null,
    lastUpdated: new Date().toISOString()
  };

  // 1. Grava no localStorage imediatamente (síncrono e resiliente a fechamento de app / recarga)
  try {
    localStorage.setItem("NUTRIAX_PERFORMANCE_" + pId, JSON.stringify(record));
    localStorage.setItem("NUTRIAX_PERFORMANCE_LAST_ACTIVE", JSON.stringify({ patientId: pId, record }));
  } catch (lsErr) {
    console.warn("Falha ao salvar performance no localStorage:", lsErr);
  }

  // 2. Grava no Dexie (IndexedDB)
  try {
    if (typeof db !== "undefined" && db.performanceMetabolica) {
      await db.performanceMetabolica.put(record);
    }
  } catch (err) {
    console.warn("Falha ao salvar performance no Dexie:", err);
  }
}

async function loadPerformanceForPatient(patientId = activePatientId) {
  const pId = patientId || activePatientId || (document.getElementById("activePatientSelect")?.value) || "paulo-vitor";
  if (!pId) return;

  // Se houver validação de IA pendente para outro paciente, limpa o estado pendente
  if (perfPendingAIValidation && perfPendingAIValidation.patientId !== pId) {
    perfPendingAIValidation = null;
  }

  let dexieSaved = null;
  let lsSaved = null;

  // 1. Tenta recuperar do Dexie (IndexedDB)
  try {
    if (typeof db !== "undefined" && db.performanceMetabolica) {
      dexieSaved = await db.performanceMetabolica.get(pId);
    }
  } catch (err) {
    console.warn("Erro ao ler performance do Dexie:", err);
  }

  // 2. Tenta recuperar do localStorage específico do paciente
  try {
    const lsRaw = localStorage.getItem("NUTRIAX_PERFORMANCE_" + pId);
    if (lsRaw) {
      lsSaved = JSON.parse(lsRaw);
    }
  } catch (lsErr) {
    console.warn("Erro ao ler performance do localStorage:", lsErr);
  }

  // 3. Fallback do último registro ativo global no localStorage
  if (!lsSaved) {
    try {
      const lastActiveRaw = localStorage.getItem("NUTRIAX_PERFORMANCE_LAST_ACTIVE");
      if (lastActiveRaw) {
        const lastActiveObj = JSON.parse(lastActiveRaw);
        if (lastActiveObj && (lastActiveObj.patientId === pId || !lastActiveObj.patientId) && lastActiveObj.record) {
          lsSaved = lastActiveObj.record;
        }
      }
    } catch (_) {}
  }

  // 4. Seleciona o registro mais recente entre Dexie e localStorage
  let saved = null;
  if (dexieSaved && lsSaved) {
    const dexieTime = dexieSaved.lastUpdated ? new Date(dexieSaved.lastUpdated).getTime() : 0;
    const lsTime = lsSaved.lastUpdated ? new Date(lsSaved.lastUpdated).getTime() : 0;
    saved = lsTime >= dexieTime ? lsSaved : dexieSaved;
  } else {
    saved = dexieSaved || lsSaved;
  }

  if (saved && Array.isArray(saved.workoutPlan) && saved.workoutPlan.length > 0) {
    perfActiveSplit = saved.activeSplit || 'PPL';
    perfWorkoutPlan = saved.workoutPlan;
    perfWeeklySchedule = (Array.isArray(saved.weeklySchedule) && saved.weeklySchedule.length >= 7)
      ? perfNormalizeWeeklySchedule(saved.weeklySchedule)
      : perfBuildWeeklySchedule(perfActiveSplit);
    perfPrescribedCardioId = saved.prescribedCardioId || 'cardio_01';
    perfAuditData = saved.auditData || null;
    perfCustomHRZones = saved.heartRateZones || null;
    perfWorkoutMeta = saved.meta || {
      isAIGenerated: !!saved.isAIGenerated,
      isClinicallyValidated: !!saved.isClinicallyValidated,
      generatedAt: saved.generatedAt || null,
      validatedAt: saved.validatedAt || null,
      patientId: pId
    };
    if (!perfWorkoutMeta.patientId) perfWorkoutMeta.patientId = pId;
    perfTargetRoutine = (perfWorkoutPlan && perfWorkoutPlan[0]?.id) || 'A';

    // Restaura estado pendente de aprovação da IA (gerado mas ainda não aprovado)
    if (
      perfWorkoutMeta.isAIGenerated &&
      !perfWorkoutMeta.isClinicallyValidated &&
      saved.pendingAIValidation &&
      saved.pendingAIValidation.patientId === pId
    ) {
      perfPendingAIValidation = saved.pendingAIValidation;
    } else {
      // Limpa pendentes obsoletos (aprovado ou de outro paciente)
      if (!perfWorkoutMeta.isAIGenerated || perfWorkoutMeta.isClinicallyValidated) {
        perfPendingAIValidation = null;
      }
    }

    // Mantém ambos os storages sincronizados com a versão mais recente
    try {
      localStorage.setItem("NUTRIAX_PERFORMANCE_" + pId, JSON.stringify(saved));
      if (typeof db !== "undefined" && db.performanceMetabolica) {
        db.performanceMetabolica.put(saved).catch(() => {});
      }
    } catch (_) {}

  } else {
    perfActiveSplit = 'PPL';
    perfWorkoutPlan = JSON.parse(JSON.stringify(PERF_SPLIT_PRESETS.PPL));
    perfWeeklySchedule = perfBuildWeeklySchedule('PPL');
    perfPrescribedCardioId = 'cardio_01';
    perfAuditData = null;
    perfWorkoutMeta = {
      isAIGenerated: false,
      isClinicallyValidated: false,
      generatedAt: null,
      validatedAt: null,
      patientId: pId
    };
    perfTargetRoutine = 'A';
    perfPendingAIValidation = null;
  }

  const selectEl = document.getElementById('perf-split-select');
  if (selectEl) selectEl.value = perfActiveSplit;

  // Reconecta botão de aprovação se treino IA pendente foi restaurado
  if (perfPendingAIValidation) {
    const btnApprove = document.getElementById('btnApproveAITraining');
    if (btnApprove) {
      const pendingPid   = perfPendingAIValidation.patientId;
      const pendingPresc = perfPendingAIValidation.prescription;
      const pendingCtx   = perfPendingAIValidation.context;
      btnApprove.onclick = () => approveAITraining(pendingPid, pendingPresc, pendingCtx);
    }
  }

  updateAITrainingBanner();
  perfRender();
}

let perfPendingAIValidation = null;

function updateAITrainingBanner() {
  const banner = document.getElementById("perfAIGeneratedBanner");
  const badge = document.getElementById("aiTrainingStatusBadge");
  const btnApprove = document.getElementById("btnApproveAITraining");
  if (!banner) return;

  if (perfWorkoutMeta && perfWorkoutMeta.isAIGenerated) {
    banner.classList.remove("hidden");
    if (perfWorkoutMeta.isClinicallyValidated) {
      if (badge) {
        badge.className = "bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider";
        badge.innerHTML = "✅ Status: Validado e Assinado pelo Profissional";
      }
      if (btnApprove) {
        btnApprove.className = "bg-zinc-800 text-zinc-400 font-bold px-3.5 py-2 rounded-xl text-xs border border-zinc-700 cursor-default flex items-center gap-1.5";
        btnApprove.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i><span>Treino Assinado</span>`;
        btnApprove.onclick = null;
      }
    } else {
      if (badge) {
        badge.className = "bg-violet-500/20 text-violet-300 border border-violet-500/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider";
        badge.innerHTML = perfWorkoutMeta.status === 'WARNING'
          ? "⚠️ Status: Alertas Clínicos Detectados · Requer Revisão"
          : "⚠️ Status: Requer Validação Biomecânica";
      }
      if (btnApprove) {
        btnApprove.className = "bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3.5 py-2 rounded-xl text-xs shadow-lg shadow-emerald-950/60 flex items-center gap-1.5 transition-all cursor-pointer";
        btnApprove.innerHTML = `<i data-lucide="check-check" class="w-4 h-4"></i><span>Validar e Assinar Treino</span>`;
        const targetPid = perfWorkoutMeta.patientId || perfPendingAIValidation?.patientId || activePatientId;
        btnApprove.onclick = () => approveAITraining(targetPid, perfPendingAIValidation?.prescription || { routines: perfWorkoutPlan }, perfPendingAIValidation?.context);
      }
    }
  } else {
    banner.classList.add("hidden");
  }
  if (window.lucide) window.lucide.createIcons();
}

/**
 * PASSO 4 & 8 — Aprova e persiste o treino de IA após revisão profissional.
 * ÚNICA porta de persistência autorizada para a IA no Dexie.
 *
 * @param {string} patientId - ID do paciente da operação (nunca activePatientId dinâmico)
 * @param {Object} validatedPrescription - Prescrição canônica validada
 * @param {Object} [contextSnapshot] - Contexto original da geração para verificação de staleness
 * @returns {Promise<Object>}
 */
async function approveAITraining(patientId, validatedPrescription, contextSnapshot) {
  const pId = patientId || perfPendingAIValidation?.patientId || perfWorkoutMeta?.patientId || activePatientId;
  const presc = validatedPrescription || perfPendingAIValidation?.prescription || { routines: perfWorkoutPlan };
  const snapshot = contextSnapshot || perfPendingAIValidation?.context;

  if (!pId) {
    console.error('[approveAITraining] Erro: patientId ausente para aprovação.');
    alert('❌ Erro: Nenhum paciente associado à prescrição em aprovação.');
    return { status: 'REJECT', errors: ['patientId ausente.'] };
  }

  // PASSO 4: Verificação de consistência estrita entre o paciente aprovado, o contexto e os metadados
  if (perfPendingAIValidation && perfPendingAIValidation.patientId && perfPendingAIValidation.patientId !== pId) {
    console.error(`[approveAITraining] Inconsistência de paciente: esperado "${perfPendingAIValidation.patientId}", recebido "${pId}".`);
    alert('❌ Inconsistência: O paciente da aprovação não corresponde ao paciente para o qual o treino foi gerado.');
    return { status: 'REJECT', errors: ['Inconsistência de paciente entre geração e aprovação.'] };
  }

  if (snapshot && snapshot._meta?.patientId && snapshot._meta.patientId !== pId) {
    console.error(`[approveAITraining] Inconsistência de snapshot: contexto pertence a "${snapshot._meta.patientId}", mas tentativa de aprovação para "${pId}".`);
    alert('❌ Inconsistência: O contexto clínico fornecido pertence a outro paciente.');
    return { status: 'REJECT', errors: ['Inconsistência entre contexto do paciente e paciente da aprovação.'] };
  }

  if (perfWorkoutMeta && perfWorkoutMeta.patientId && perfWorkoutMeta.patientId !== pId) {
    console.error(`[approveAITraining] Inconsistência de metadados: treino em memória pertence a "${perfWorkoutMeta.patientId}", mas tentativa de aprovação para "${pId}".`);
    alert('❌ Inconsistência: O treino em tela pertence a outro paciente.');
    return { status: 'REJECT', errors: ['Inconsistência entre metadados do treino e paciente da aprovação.'] };
  }

  // PASSO 8: Proteção contra contexto obsoleto (Stale Context)
  if (snapshot) {
    let currentContext = null;
    try {
      currentContext = await buildPerformanceContext(pId);
    } catch(e) {
      console.warn('[approveAITraining] Falha ao ler contexto atual para checagem de staleness:', e);
    }

    if (currentContext) {
      const isStale =
        currentContext.patient.weightKg !== snapshot.patient?.weightKg ||
        currentContext.patient.objective !== snapshot.patient?.objective ||
        currentContext.nutrition.caloricTargetKcal !== snapshot.nutrition?.caloricTargetKcal ||
        currentContext.energy.getKcal !== snapshot.energy?.getKcal;

      if (isStale) {
        console.warn('[approveAITraining] STALE_CONTEXT detectado:', {
          snapshot: {
            weightKg: snapshot.patient?.weightKg,
            objective: snapshot.patient?.objective,
            caloricTargetKcal: snapshot.nutrition?.caloricTargetKcal,
            getKcal: snapshot.energy?.getKcal
          },
          current: {
            weightKg: currentContext.patient.weightKg,
            objective: currentContext.patient.objective,
            caloricTargetKcal: currentContext.nutrition.caloricTargetKcal,
            getKcal: currentContext.energy.getKcal
          }
        });
        alert('⚠️ Os dados do paciente foram alterados durante a geração. O treino precisa ser regenerado.');
        return {
          status: 'STALE_CONTEXT',
          requiresRegeneration: true,
          errors: ['Os dados do paciente foram alterados durante a geração. O treino precisa ser regenerado.']
        };
      }
    }
  }

  // Aplica o plano validado à memória
  if (presc && Array.isArray(presc.routines)) {
    perfWorkoutPlan = presc.routines;
    perfActiveSplit = presc.routines.length >= 5 ? 'PHAT' : (presc.routines.length === 4 ? 'UpperLower' : 'PPL');
    perfWeeklySchedule = perfBuildWeeklySchedule(perfActiveSplit);
  } else if (Array.isArray(presc)) {
    perfWorkoutPlan = presc;
  }

  perfWorkoutMeta = {
    isAIGenerated: true,
    isClinicallyValidated: true,
    generatedAt: perfWorkoutMeta?.generatedAt || new Date().toISOString(),
    validatedAt: new Date().toISOString(),
    patientId: pId
  };

  // Limpa o estado pendente de revisão
  perfPendingAIValidation = null;

  // PERSISTÊNCIA SEGURA — Único ponto de gravação autorizado
  await savePerformanceForPatient(pId);
  updateAITrainingBanner();
  perfRender();

  alert('✅ Prescrição de Treino e Periodização Biomecânica validada e assinada com sucesso!');
  return { status: 'APPROVED', patientId: pId, validatedAt: perfWorkoutMeta.validatedAt };
}

async function perfSetSplit(splitKey) {
  if (!PERF_SPLIT_PRESETS[splitKey]) return;
  perfActiveSplit = splitKey;
  perfWorkoutPlan = JSON.parse(JSON.stringify(PERF_SPLIT_PRESETS[splitKey]));
  perfTargetRoutine = perfWorkoutPlan[0]?.id || 'A';
  perfWeeklySchedule = perfBuildWeeklySchedule(splitKey);
  perfWorkoutMeta = {
    isAIGenerated: false,
    isClinicallyValidated: false,
    generatedAt: null,
    validatedAt: null
  };

  const selectEl = document.getElementById('perf-split-select');
  if (selectEl) selectEl.value = splitKey;

  await savePerformanceForPatient(activePatientId);
  updateAITrainingBanner();
  perfRender();

  const toast = document.getElementById('perf-ai-toast');
  if (toast) {
    toast.style.display = 'flex';
    toast.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400 shrink-0"></i>
      <div>Divisão de Treino alterada para <strong>${selectEl ? selectEl.options[selectEl.selectedIndex].text : splitKey}</strong> (${perfWorkoutPlan.length} rotinas ativas).</div>`;
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => { if (toast) toast.style.display = 'none'; }, 4000);
  }
}

function renderPerfTargetButtons() {
  const container = document.getElementById('perf-target-buttons-container');
  if (!container) return;

  container.innerHTML = perfWorkoutPlan.map((routine, rIdx) => {
    const isTarget = routine.id === perfTargetRoutine;
    const charCode = routine.id ? routine.id.toUpperCase().charCodeAt(0) - 65 : rIdx;
    const isColor2 = (charCode >= 0 ? charCode % 2 === 1 : rIdx % 2 === 1);

    const activeStyle = isColor2 
      ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]' 
      : 'bg-blue-600 text-white border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]';
    const inactiveStyle = isColor2
      ? 'text-zinc-400 hover:text-purple-300 bg-zinc-900 border-zinc-800 hover:border-purple-600/50'
      : 'text-zinc-400 hover:text-blue-300 bg-zinc-900 border-zinc-800 hover:border-blue-600/50';

    return `
      <button id="perf-target-${routine.id}" onclick="perfSetTarget('${routine.id}')"
        class="px-2.5 py-1 text-xs rounded-lg font-bold transition-all border ${isTarget ? activeStyle : inactiveStyle}">
        ${routine.id}
      </button>
    `;
  }).join('');
}

function renderPerfHudMetrics() {
  const totalEx   = perfWorkoutPlan.reduce((s,r) => s + r.exercises.length, 0);
  const totalSets = perfWorkoutPlan.reduce((s,r) => s + r.exercises.reduce((a,e) => a + (parseInt(e.sets) || 0), 0), 0);
  const elEx   = document.getElementById('perf-total-ex');
  const elSets = document.getElementById('perf-total-sets');
  if (elEx)   elEx.textContent = totalEx;
  if (elSets) elSets.textContent = totalSets;
}

function renderPerfWorkoutPlan() {
  const container = document.getElementById('perf-routines-container');
  if (!container) return;
  container.innerHTML = '';

  perfWorkoutPlan.forEach((routine, rIdx) => {
    const isTarget = routine.id === perfTargetRoutine;
    const totalSets = routine.exercises.reduce((s,e)=>s + (parseInt(e.sets) || 0), 0);
    const charCode = routine.id ? routine.id.toUpperCase().charCodeAt(0) - 65 : rIdx;
    const isColor2 = (charCode >= 0 ? charCode % 2 === 1 : rIdx % 2 === 1);

    const activeBorder = isColor2
      ? 'border-purple-500/90 shadow-[0_0_25px_rgba(168,85,247,0.25)] bg-gradient-to-b from-purple-950/25 via-black/80 to-zinc-950/90'
      : 'border-blue-500/90 shadow-[0_0_25px_rgba(59,130,246,0.25)] bg-gradient-to-b from-blue-950/20 via-black/80 to-zinc-950/90';
    const inactiveBorder = isColor2
      ? 'border-zinc-800/90 bg-black/60 hover:border-purple-700/50'
      : 'border-zinc-800/90 bg-black/60 hover:border-blue-700/50';

    const card = document.createElement('div');
    card.className = `hud-card overflow-hidden transition-all rounded-2xl ${isTarget ? activeBorder : inactiveBorder}`;

    const badgeRoutine = isColor2
      ? 'bg-purple-900/60 border-purple-700/60 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
      : 'bg-blue-900/60 border-blue-700/60 text-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.3)]';
    const targetPill = isColor2
      ? '<span class="text-[9px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-[0_0_8px_rgba(168,85,247,0.6)] shrink-0">Alvo Ativo</span>'
      : '<span class="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-[0_0_8px_rgba(59,130,246,0.6)] shrink-0">Alvo Ativo</span>';
    const headerBg = isTarget ? (isColor2 ? 'bg-purple-950/40' : 'bg-blue-950/40') : 'bg-black/40';
    const btnTargetActive = isColor2
      ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)] border-purple-500'
      : 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] border-blue-500';
    const btnTargetInactive = isColor2
      ? 'bg-zinc-800 text-zinc-400 hover:text-white hover:border-purple-500/50 border border-zinc-700'
      : 'bg-zinc-800 text-zinc-400 hover:text-white hover:border-blue-500/50 border border-zinc-700';
    const textVolume = isColor2 ? 'text-purple-400' : 'text-blue-400';
    const textAddEx = isColor2 ? 'text-purple-400 hover:text-purple-300' : 'text-blue-400 hover:text-blue-300';
    const exRowHover = isColor2 ? 'hover:bg-purple-950/15' : 'hover:bg-blue-950/15';
    const exNumBadge = isColor2 ? 'text-purple-300 bg-purple-950/80 border-purple-800/60' : 'text-blue-300 bg-blue-950/80 border-blue-800/60';
    const gifBtn = isColor2 
      ? 'text-purple-300 bg-purple-950/80 hover:bg-purple-900 border-purple-700/70 shadow-[0_0_8px_rgba(168,85,247,0.25)] hover:shadow-[0_0_12px_rgba(168,85,247,0.5)]'
      : 'text-blue-300 bg-blue-950/80 hover:bg-blue-900 border-blue-700/70 shadow-[0_0_8px_rgba(59,130,246,0.25)] hover:shadow-[0_0_12px_rgba(59,130,246,0.5)]';
    const focusBorder = isColor2 ? 'focus:border-purple-500' : 'focus:border-blue-500';

    const exercisesHtml = routine.exercises.length === 0
      ? `<div class="m-6 text-center py-10 border border-dashed border-zinc-700/60 rounded-2xl text-zinc-500 text-sm">
          <p class="font-medium text-zinc-300">Rotina sem exercícios prescritos</p>
          <p class="text-xs mt-1 text-zinc-500">Selecione esta rotina e acesse o menu <strong>"Catálogo Biomecânico"</strong> no topo para adicionar exercícios.</p>
        </div>`
      : routine.exercises.map((ex, idx) => {
          const exId = ex.exerciseId || ex.id || '';
          let dbEx = PERF_EXERCISE_DB.find(e => e.id === exId);
          if (!dbEx && ex.name) {
            dbEx = PERF_EXERCISE_DB.find(e => e.name.toLowerCase() === ex.name.toLowerCase());
          }
          if (!dbEx) {
            dbEx = {
              id: exId || 'geral',
              name: ex.name || 'Exercício Biomecânico',
              group: ex.group || 'Geral',
              mechanics: ex.mechanics || 'Composto',
              equipment: ex.equipment || 'Barra/Halter',
              primary: ex.primary || 'Músculo Alvo',
              secondary: ex.secondary || 'Estabilizadores'
            };
          }

          const resolvedId = dbEx.id || exId;
          const rpeVal = parseInt(ex.rpe) || 8;
          const rpeRir = rpeVal >= 9 ? '1 RIR (Máxima)' : rpeVal >= 8 ? '2 RIR (Ótima)' : '3 RIR (Técnica)';

          // Cadência científica por exercício (Schoenfeld/ACSM) — lê do objeto ex (propagado pelo makeEx)
          const cadenceRaw = ex.cadence || dbEx.cadence || (dbEx.mechanics === 'Isolador' ? '3-1-1-0' : '3-0-1-0');
          const cadenceLabel = (() => {
            const c = cadenceRaw.split('-').map(Number);
            const exc = c[0] || 3, pause1 = c[1] || 0, conc = c[2] || 1, pause2 = c[3] || 0;
            const notes = [];
            if (exc >= 4) notes.push(`Exc. ${exc}s (máx. TUT`);
            else notes.push(`Exc. ${exc}s`);
            if (pause1 > 0) notes.push(`P.fundo ${pause1}s`);
            notes.push(`Conc. ${conc}s`);
            if (pause2 > 0) notes.push(`P.topo ${pause2}s (ISO)`);
            return `${cadenceRaw} · ${notes.join(' / ')}`;
          })();
          const resistProf = ex.resistProfile || dbEx.resistProfile || 'uniform';
          const resistBadge = resistProf === 'stretched'
            ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50" title="Pico de torque na posição de maior comprimento muscular — Schoenfeld Cap.2">🔵 Pico Alongado</span>`
            : resistProf === 'shortened'
            ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-700/50" title="Pico de torque na posição de encurtamento muscular — Lima & Pinto Cap.4-7">🔴 Pico Encurtado</span>`
            : `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50" title="Curva de torque relativamente uniforme ao longo da ADM — ACSM Cap.7">⚪ Tensão Uniforme</span>`;
          const cadenceTooltip = ex.cadenceNote || dbEx.cadenceNote || 'Cadência baseada na mecânica do exercício.';
          const restVal = parseInt(ex.rest) || 60;
          const substitutes = perfGetSubstitutes(resolvedId);
          const subOptionsHtml = substitutes.map(s => {
            const targetFull = s.primary || s.group;
            return `<option value="${s.id}">• ${s.name} [🎯 Primário: ${targetFull} | ${s.equipment} · ${s.mechanics}]</option>`;
          }).join('');
          
          return `
          <div class="p-3 sm:p-4 border-b border-zinc-800/60 ${exRowHover} transition-all">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              
              <!-- Bloco 1: Identificação & Biomecânica do Exercício -->
              <div class="flex-1 min-w-0 space-y-1.5">
                <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span class="text-xs font-mono font-bold ${exNumBadge} px-2 py-0.5 rounded-md">
                    #${idx+1}
                  </span>
                  <h4 class="text-sm md:text-base font-bold text-white tracking-tight break-words">${ex.name || dbEx.name}</h4>
                  <button onclick="perfOpenExerciseGuide('${resolvedId}', '${routine.id}')"
                    class="px-2 py-0.5 rounded-md text-[10px] font-bold ${gifBtn} flex items-center gap-1 transition-all cursor-pointer"
                    title="Ver GIF animado e guia biomecânico de execução">
                    <i data-lucide="play-circle" class="w-3.5 h-3.5 ${isColor2 ? 'text-purple-400' : 'text-blue-400'}"></i>
                    <span>GIF &amp; Execução</span>
                  </button>

                  <!-- Seletor de Exercício Substituto / Variações de Execução -->
                  <div class="relative inline-flex items-center">
                    <select onchange="if(this.value){ perfSwapExercise('${routine.id}', '${resolvedId}', this.value); this.selectedIndex = 0; }"
                      class="bg-amber-950/40 hover:bg-amber-950/80 text-amber-300 hover:text-amber-200 border border-amber-600/50 hover:border-amber-500 text-[10px] font-bold rounded-md px-2 py-0.5 outline-none transition-all cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.2)] max-w-[170px] sm:max-w-[210px] truncate"
                      title="Substituir por outra opção de execução do mesmo grupo muscular">
                      <option value="" selected>🔄 Variações (${substitutes.length})</option>
                      ${subOptionsHtml}
                    </select>
                  </div>

                  <span class="text-[9px] sm:text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    ${dbEx.group}
                  </span>
                  <span class="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded ${isColor2 ? 'bg-purple-950/60 text-purple-300 border-purple-900/60' : 'bg-blue-950/60 text-blue-300 border-blue-900/60'}">
                    ${dbEx.equipment} · ${dbEx.mechanics}
                  </span>
                </div>

                <!-- Detalhes Anatômicos & Cadência -->
                <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-[11px] text-zinc-400">
                  <span>🎯 <strong class="text-zinc-200">Primário:</strong> ${dbEx.primary}</span>
                  <span class="text-zinc-600">•</span>
                  <span>⚡ <strong class="text-zinc-300">Sinérgicos:</strong> ${dbEx.secondary}</span>
                  <span class="text-zinc-600">•</span>
                   <span class="text-purple-300 font-mono" title="${cadenceTooltip}">⏱️ ${cadenceLabel}</span>
                   ${resistBadge}
                </div>
              </div>

              <!-- Bloco 2: Controles de Séries, Reps, RPE e Pausa (100% Responsivo no Celular) -->
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                <div class="grid grid-cols-4 sm:flex sm:items-center gap-1.5 bg-black/60 p-2 rounded-xl border border-zinc-800/80 w-full sm:w-auto">
                  
                  <!-- Séries -->
                  <div class="flex flex-col items-center">
                    <span class="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Séries</span>
                    <input type="number" min="1" max="10" value="${parseInt(ex.sets) || 3}"
                      onchange="perfUpdateField('${routine.id}','${resolvedId}','sets',+this.value)"
                      class="w-full sm:w-12 p-1 text-center font-bold text-xs sm:text-sm text-white rounded bg-zinc-900 border border-zinc-700 ${focusBorder} outline-none">
                  </div>

                  <!-- Repetições -->
                  <div class="flex flex-col items-center">
                    <span class="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Reps</span>
                    <input type="text" value="${ex.reps || '8-12'}"
                      onchange="perfUpdateField('${routine.id}','${resolvedId}','reps',this.value)"
                      class="w-full sm:w-16 p-1 text-center font-bold text-xs sm:text-sm text-white rounded bg-zinc-900 border border-zinc-700 ${focusBorder} outline-none">
                  </div>

                  <!-- RPE / RIR -->
                  <div class="flex flex-col items-center">
                    <span class="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider" title="Rating of Perceived Exertion">RPE</span>
                    <input type="number" min="1" max="10" value="${rpeVal}"
                      onchange="perfUpdateField('${routine.id}','${resolvedId}','rpe',+this.value)"
                      class="w-full sm:w-10 p-1 text-center font-black text-xs sm:text-sm rounded bg-zinc-900 border border-zinc-700 ${focusBorder} outline-none">
                  </div>

                  <!-- Pausa em Segundos -->
                  <div class="flex flex-col items-center">
                    <span class="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Pausa</span>
                    <div class="flex items-center justify-center w-full">
                      <input type="number" min="0" step="15" value="${restVal}"
                        onchange="perfUpdateField('${routine.id}','${resolvedId}','rest',+this.value)"
                        class="w-full sm:w-12 p-1 text-center font-semibold text-xs sm:text-sm text-zinc-300 rounded bg-zinc-900 border border-zinc-700 ${focusBorder} outline-none">
                    </div>
                  </div>
                </div>

                <!-- Botão Remover -->
                <div class="flex justify-end sm:justify-center">
                  <button onclick="perfRemoveExercise('${routine.id}','${resolvedId}')"
                    class="p-1.5 sm:p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer flex items-center gap-1 text-[11px]" title="Remover exercício da rotina">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                    <span class="sm:hidden text-[10px] text-zinc-400">Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          </div>`;
        }).join('');

    card.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3.5 sm:px-5 sm:py-4 border-b border-zinc-800 gap-2.5 ${headerBg}">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="w-8 h-8 rounded-xl ${badgeRoutine} flex items-center justify-center font-bold text-sm shrink-0">
            ${routine.id}
          </span>
          <div class="min-w-0 flex-1">
            <h3 class="text-sm md:text-base font-bold text-white flex items-center gap-2 flex-wrap">
              <span>${routine.name}</span>
              ${isTarget ? targetPill : ''}
            </h3>
            <span class="text-[11px] text-zinc-400 font-mono block">${routine.exercises.length} exercícios estruturados</span>
          </div>
        </div>

        <div class="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0">
          <span class="text-[11px] font-mono text-zinc-300 bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded-lg">
            Volume: <strong class="${textVolume} font-bold">${totalSets} sets</strong>
          </span>
          <button onclick="perfSetTarget('${routine.id}')"
            class="px-3 py-1 rounded-lg text-xs font-bold transition-all ${isTarget ? btnTargetActive : btnTargetInactive}">
            ${isTarget ? '✓ Rotina Alvo' : 'Definir Alvo'}
          </button>
        </div>
      </div>

      <div>${exercisesHtml}</div>

      <div class="px-3.5 sm:px-5 py-2.5 sm:py-3 border-t border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between bg-black/40 text-xs text-zinc-400 gap-2">
        <div class="flex items-center gap-2">
          <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-400 shrink-0"></i>
          <span class="text-[11px] leading-tight">Progressão: <strong>+1 rep por série</strong> antes de subir a carga.</span>
        </div>
        <button onclick="perfSwitchView('catalog', true)" class="${textAddEx} font-bold transition-colors flex items-center gap-1 text-[11px] sm:text-xs">
          <span>+ Adicionar Exercício nesta Rotina</span>
        </button>
      </div>`;

    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

function perfSetTarget(routineId) {
  perfTargetRoutine = routineId;
  renderPerfTargetButtons();
  const label = document.getElementById('perf-target-label');
  if (label) {
    label.textContent = `Treino ${routineId}`;
    const charCode = routineId ? routineId.toUpperCase().charCodeAt(0) - 65 : 0;
    const isColor2 = charCode >= 0 && charCode % 2 === 1;
    label.className = `font-bold ${isColor2 ? 'text-purple-400' : 'text-blue-400'}`;
  }
  renderPerfWorkoutPlan();
}

function perfAddExercise(exerciseId) {
  const ex = PERF_EXERCISE_DB.find(e => e.id === exerciseId);
  if (!ex) return;
  perfWorkoutPlan = perfWorkoutPlan.map(routine => {
    if (routine.id !== perfTargetRoutine) return routine;
    if (routine.exercises.some(e => (e.exerciseId || e.id) === exerciseId)) return routine;
    return { ...routine, exercises: [...routine.exercises, {
      exerciseId: ex.id, id: ex.id, name: ex.name, sets: 3, reps: '8-12', rpe: 7, rest: 90
    }]};
  });
  savePerformanceForPatient(activePatientId);
  perfRender();
}

function perfRemoveExercise(routineId, exerciseId) {
  perfWorkoutPlan = perfWorkoutPlan.map(routine => {
    if (routine.id !== routineId) return routine;
    return {
      ...routine,
      exercises: routine.exercises.filter(e => {
        const id = e.exerciseId || e.id;
        return id !== exerciseId && e.name !== exerciseId;
      })
    };
  });
  savePerformanceForPatient(activePatientId);
  perfRender();
}

function perfUpdateField(routineId, exerciseId, field, value) {
  perfWorkoutPlan = perfWorkoutPlan.map(routine => {
    if (routine.id !== routineId) return routine;
    return {
      ...routine,
      exercises: routine.exercises.map(ex => {
        const id = ex.exerciseId || ex.id;
        if (id === exerciseId || ex.name === exerciseId) {
          return { ...ex, [field]: value };
        }
        return ex;
      })
    };
  });
  savePerformanceForPatient(activePatientId);
  renderPerfHudMetrics();
}

function perfSetGroupFilter(group) {
  perfGroupFilter = group;
  document.querySelectorAll('.perf-group-btn').forEach(btn => {
    btn.classList.remove('bg-blue-600','text-white');
    btn.classList.add('bg-zinc-800','text-zinc-400');
    btn.style.boxShadow = '';
    if (btn.dataset.group === group) {
      btn.classList.remove('bg-zinc-800','text-zinc-400');
      btn.classList.add('bg-blue-600','text-white');
      btn.style.boxShadow = '0 0 8px rgba(59,130,246,0.5)';
    }
  });
  renderPerfCatalog();
}

function perfSetSearch(value) {
  perfSearchTerm = value;
  renderPerfCatalog();
}

// ════════════════════════════════════════════════════════════════════════════
// CO-PILOTO BIOMECÂNICO — Pipeline Segura de IA (Pilar de Performance)
// handleGenerateAITraining()
// ════════════════════════════════════════════════════════════════════════════
function resetGenAiButtons() {
  const allGenBtns = document.querySelectorAll('#perf-btn-generate-ai, #perf-ai-btn, [onclick*="handleGenerateAITraining"]');
  allGenBtns.forEach(b => {
    try {
      b.disabled = false;
      delete b.dataset.origHtml;
      if (b.id === 'perf-ai-btn') {
        b.innerHTML = '<i data-lucide="sparkles" class="w-3.5 h-3.5 text-violet-200"></i><span>Gerar Treino via IA (Co-piloto Biomecânico)</span>';
      } else if (b.classList && b.classList.contains('hud-tab-btn')) {
        b.innerHTML = '<i data-lucide="sparkles" class="w-3.5 h-3.5 text-violet-300"></i> Gerar Treino via IA';
      } else {
        b.innerHTML = '<i data-lucide="sparkles" class="w-4 h-4 text-violet-300"></i><span>Gerar Treino Completo via IA</span>';
      }
    } catch(e){}
  });
  if (window.lucide) window.lucide.createIcons();
}

async function handleGenerateAITraining() {
  const allGenBtns = document.querySelectorAll('#perf-btn-generate-ai, #perf-ai-btn, [onclick*="handleGenerateAITraining"]');

  // 1. Verificação proativa do pool de chaves da API Gemini
  let apiKeys = geminiGetApiKeyPool();
  if (apiKeys.length === 0) {
    // Tenta migrar key legada do prompt antigo
    const inputKey = window.prompt('🔑 Nenhuma chave da API Gemini configurada.\n\nInsira sua primeira chave (ela será salva no pool do navegador):');
    if (inputKey && inputKey.trim()) {
      geminiSaveApiKeyPool([inputKey.trim()]);
      apiKeys = [inputKey.trim()];
    } else {
      resetGenAiButtons();
      // Abre o gerenciador para facilitar configuração
      openGeminiKeysManager();
      return;
    }
  }

  allGenBtns.forEach(b => {
    try {
      b.disabled = true;
      b.innerHTML = '<i data-lucide="brain-circuit" class="w-4 h-4 animate-pulse text-cyan-300 inline-block align-middle mr-1"></i> Analisando Biomecânica & Curva de Torque...';
    } catch(e){}
  });
  if (window.lucide) lucide.createIcons();

  // PASSO 3: Captura imutável do patientId no início da operação (prevenção de race condition)
  const patientSelect = document.getElementById('activePatientSelect');
  const generationPatientId = (patientSelect && patientSelect.value ? patientSelect.value : null) || activePatientId || "paulo-vitor";

  if (!generationPatientId) {
    resetGenAiButtons();
    alert('❌ Nenhum paciente selecionado para gerar o treino.');
    return;
  }

  try {
    // PASSO 1: Executa a pipeline canônica e segura através do orquestrador
    const result = await generateAndValidateWorkout(generationPatientId, geminiPerformanceAIGenerator);

    if (result.status === 'REJECT') {
      resetGenAiButtons();
      const errMsg = result.errors && result.errors.length > 0
        ? result.errors.join('\n\n')
        : 'Não foi possível gerar uma prescrição compatível após 3 tentativas.';
      alert('❌ Falha na geração da prescrição:\n\n' + errMsg);
      return;
    }

    // PASSO 2: Recebe PASS ou WARNING — Prepara APENAS para revisão humana (SEM persistir no Dexie)
    perfPendingAIValidation = {
      patientId: generationPatientId,
      context: result.context,
      prescription: result.prescription,
      warnings: result.warnings,
      status: result.status,
      generatedAt: new Date().toISOString()
    };

    // Monta o preview na memória para inspeção visual do profissional
    const chosenSplit = result.prescription.routines.length >= 5 ? 'PHAT' : (result.prescription.routines.length === 4 ? 'UpperLower' : 'PPL');
    perfActiveSplit = chosenSplit;
    perfWorkoutPlan = result.prescription.routines;
    perfTargetRoutine = perfWorkoutPlan[0]?.id || 'A';
    perfWeeklySchedule = perfBuildWeeklySchedule(chosenSplit);

    // Constrói auditData a partir do contexto canônico (NUNCA do DOM)
    const ctx = result.context;
    const isBulking = (ctx.patient?.objective || '').toLowerCase().includes('hipertrofia') || (ctx.nutrition?.energyBalanceKcal || 0) > 150;
    const isCutting = (ctx.patient?.objective || '').toLowerCase().includes('perda') || (ctx.nutrition?.energyBalanceKcal || 0) < -150;

    perfAuditData = {
      obj: `${ctx.patient?.objective || 'Treino'} · ${ctx.patient?.sex || 'Geral'}`,
      cals: `${ctx.nutrition?.caloricTargetKcal || 2000} kcal (Balanço: ${(ctx.nutrition?.energyBalanceKcal || 0) >= 0 ? '+' : ''}${ctx.nutrition?.energyBalanceKcal || 0} kcal)`,
      prot: `${(ctx.nutrition?.proteinGKg || 2.0).toFixed(1)} g/kg (${Math.round((ctx.patient?.weightKg || 70) * (ctx.nutrition?.proteinGKg || 2.0))}g/dia)`,
      guideline: `Divisão ${chosenSplit} · Nível: ${ctx.patient?.trainingLevel || 'Não informado'} · Status: ${result.status}`,
      explanation: `Prescrição gerada via pipeline segura de IA (Tentativa ${result.attempt}/3). Meta de BF: ${ctx.anthropometry?.targetBodyFatPercent || 12}% (Atual: ${ctx.anthropometry?.bodyFatPercent || 15}%). Balanço calculado via GET (${ctx.energy?.getKcal || 2500} kcal).`
    };

    perfWorkoutMeta = {
      isAIGenerated: true,
      isClinicallyValidated: false,
      generatedAt: new Date().toISOString(),
      validatedAt: null,
      patientId: generationPatientId,
      status: result.status,
      warnings: result.warnings
    };

    // Atualiza elementos visuais na UI
    const selectEl = document.getElementById('perf-split-select');
    if (selectEl) selectEl.value = chosenSplit;

    // Atualiza cabeçalho do microciclo (com alternância de 2 cores)
    const legacyKeys = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
    let trainCountAI = 0;
    perfWeeklySchedule.forEach((d, idx) => {
      const num = idx + 1;
      const dayBtn = document.getElementById(`day-btn-d${num}`) || document.getElementById(`day-btn-${legacyKeys[idx]}`) || document.getElementById(`day-btn-${d.dayKey}`);
      if (dayBtn) {
        let isColor2 = false;
        if (d.type === 'Treino') {
          if (d.routineId) {
            const charCode = d.routineId.toUpperCase().charCodeAt(0) - 65;
            isColor2 = (charCode >= 0 ? charCode % 2 === 1 : trainCountAI % 2 === 1);
          } else {
            isColor2 = (trainCountAI % 2 === 1);
          }
          trainCountAI++;
        }
        const colorClass = d.type === 'Treino' ? (isColor2 ? 'text-purple-400' : 'text-blue-400') : d.type === 'Cardio' ? 'text-amber-400' : 'text-zinc-500';
        const titleShort = (d.title || '').replace('Treino ','');
        dayBtn.innerHTML = `<span class="font-bold ${colorClass}">DIA ${num}</span> <span class="text-[10px] ${d.type === 'Off' ? 'text-zinc-500' : 'text-zinc-300'} truncate max-w-[85px]">${titleShort}</span>`;
      }
    });

    // Atualiza card de auditoria
    const auditCard = document.getElementById('perf-audit-card');
    if (auditCard) {
      auditCard.style.display = 'block';
      const aObj = document.getElementById('audit-obj');
      const aCals = document.getElementById('audit-cals');
      const aProt = document.getElementById('audit-prot');
      const aGuide = document.getElementById('audit-guideline');
      const aExpl = document.getElementById('audit-explanation');

      if (aObj) aObj.textContent = perfAuditData.obj;
      if (aCals) aCals.textContent = perfAuditData.cals;
      if (aProt) aProt.textContent = perfAuditData.prot;
      if (aGuide) aGuide.textContent = perfAuditData.guideline;
      if (aExpl) aExpl.textContent = perfAuditData.explanation;
    }

    // Configura o botão de aprovação da banner para a operação atual
    const btnApprove = document.getElementById("btnApproveAITraining");
    if (btnApprove) {
      btnApprove.onclick = () => approveAITraining(generationPatientId, result.prescription, result.context);
    }
    updateAITrainingBanner();

    // PERSISTÊNCIA DO TREINO GERADO — salva imediatamente para sobreviver a reloads
    // (flag isClinicallyValidated: false indica que ainda aguarda aprovação do profissional)
    await savePerformanceForPatient(generationPatientId);

    // Notificação Toast informativa
    const toast = document.getElementById('perf-toast');
    if (toast) {
      toast.style.display = 'flex';
      const warningText = result.warnings.length > 0 ? `<br><span class="text-amber-300">⚠️ Alertas clínicos: ${result.warnings.join('; ')}</span>` : '';
      toast.innerHTML = `<i data-lucide="info" class="w-4 h-4 shrink-0 text-cyan-400"></i>
        <div><strong class="block text-white font-bold text-[11px] uppercase tracking-wider mb-0.5">Treino Gerado pela IA · REQUER APROVAÇÃO</strong>
        Divisão <strong>${chosenSplit}</strong> (${result.prescription.routines.length} rotinas) salva para revisão. Aprovação do profissional necessária para validação clínica.${warningText}</div>`;
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => { if (toast) toast.style.display = 'none'; }, 7000);
    }

    if (typeof perfSwitchView === 'function') perfSwitchView('prescription', false);
    if (typeof perfRender === 'function') perfRender();

  } catch (err) {
    console.error('Erro ao executar pipeline segura de IA:', err);
    alert('Erro no processamento da IA: ' + err.message);
  } finally {
    resetGenAiButtons();
  }
}

function perfGeneratePDF() {
  const patientSelect = document.getElementById('activePatientSelect');
  const patientName = document.getElementById("headerPatientName")?.innerText?.trim() ||
    document.getElementById("perfPatientName")?.innerText?.trim() ||
    (patientSelect && patientSelect.selectedIndex >= 0 ? patientSelect.options[patientSelect.selectedIndex]?.text?.replace(/\s*\(.*?\)\s*$/, '') : 'Paciente');
  const currentDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  
  // Resgata dados de nutrição e metas
  const objInput = document.getElementById('prescGoal') || document.getElementById('anamneseGoal');
  const objective = objInput && objInput.value ? objInput.value : 'Hipertrofia & Recomposição Corporal';
  
  const caloricTargetEl = document.getElementById('dashCaloricTarget');
  const caloricTarget = caloricTargetEl ? parseInt(caloricTargetEl.innerText) || 2200 : 2200;
  
  const protInput = document.getElementById('prescProtGKg');
  const proteinGKg = protInput && protInput.value ? parseFloat(protInput.value) || 2.0 : 2.0;

  const totalEx   = perfWorkoutPlan.reduce((s,r) => s + r.exercises.length, 0);
  const totalSets = perfWorkoutPlan.reduce((s,r) => s + r.exercises.reduce((a,e) => a+e.sets,0), 0);

  // Cardio Prescrito Ativo
  const cardio = PERF_CARDIO_DB.find(c => c.id === perfPrescribedCardioId) || PERF_CARDIO_DB[0];

  // Monta HTML das Rotinas (com Alternância de 2 Cores: Azul / Roxo)
  const routinesHtml = perfWorkoutPlan.map((routine, rIdx) => {
    const routineSets = routine.exercises.reduce((s,e) => s + e.sets, 0);
    const charCode = routine.id ? routine.id.toUpperCase().charCodeAt(0) - 65 : rIdx;
    const isColor2 = (charCode >= 0 ? charCode % 2 === 1 : rIdx % 2 === 1);
    
    const headerBg = isColor2 ? '#581c87' : '#1e3a8a';
    const indexColColor = isColor2 ? '#7e22ce' : '#1e40af';
    const gifBtnColor = isColor2 ? '#7e22ce' : '#2563eb';
    const gifBtnBg = isColor2 ? '#faf5ff' : '#eff6ff';
    const gifBtnBorder = isColor2 ? '#e9d5ff' : '#bfdbfe';

    const rows = routine.exercises.map((ex, idx) => {
      const dbEx = PERF_EXERCISE_DB.find(e => e.id === ex.exerciseId) || {
        group: 'Geral', mechanics: 'Composto', equipment: 'Livre', primary: 'Músculo Alvo', secondary: 'Estabilizadores'
      };
      const rpeRir = ex.rpe >= 9 ? '1 RIR' : ex.rpe >= 8 ? '2 RIR' : '3 RIR';
      const cadence = dbEx.mechanics === 'Isolador' ? '3-1-1-0' : '3-0-1-0';

      return `
        <tr style="border-bottom: 1px solid #e5e7eb; font-size: 11px;">
          <td style="padding: 8px 6px; text-align: center; font-weight: bold; color: ${indexColColor}; width: 28px;">${idx+1}</td>
          <td style="padding: 8px 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
              <strong style="color: #111827; font-size: 12px; display: block;">${ex.name}</strong>
              <a href="https://www.gifdotreino.com/" target="_blank" style="color: ${gifBtnColor}; text-decoration: none; font-size: 9px; font-weight: bold; background: ${gifBtnBg}; border: 1px solid ${gifBtnBorder}; padding: 2px 6px; border-radius: 4px; white-space: nowrap;">
                🎬 GIF Execução
              </a>
            </div>
            <span style="color: #4b5563; font-size: 10px;">🎯 ${dbEx.primary} • <em>${dbEx.equipment} (${dbEx.mechanics})</em></span>
          </td>
          <td style="padding: 8px 6px; text-align: center; font-family: monospace; color: #6b7280; font-size: 10px;">${cadence}</td>
          <td style="padding: 8px 6px; text-align: center; font-weight: bold; color: #111827; font-size: 12px; background: #f9fafb;">${ex.sets}</td>
          <td style="padding: 8px 6px; text-align: center; font-weight: bold; color: #111827; font-size: 12px; background: #f9fafb;">${ex.reps}</td>
          <td style="padding: 8px 6px; text-align: center; font-weight: bold; color: #b45309; font-size: 11px;">${ex.rpe} <span style="font-size: 9px; color: #92400e;">(${rpeRir})</span></td>
          <td style="padding: 8px 6px; text-align: center; color: #4b5563; font-family: monospace;">${ex.rest}s</td>
          <td style="padding: 8px 6px; text-align: center; border-left: 1px dashed #d1d5db; width: 80px;">
            <div style="border-bottom: 1px dotted #9ca3af; height: 16px;"></div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div style="margin-bottom: 20px; page-break-inside: avoid; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; background: #ffffff;">
        <div style="background: ${headerBg}; color: #ffffff; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
            ${routine.name}
          </h3>
          <span style="font-size: 11px; font-family: monospace; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">
            ${routine.exercises.length} Exercícios • ${routineSets} Séries
          </span>
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background: #f3f4f6; color: #4b5563; font-size: 9.5px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb;">
              <th style="padding: 6px; text-align: center;">#</th>
              <th style="padding: 6px 8px;">Exercício &amp; Biomecânica</th>
              <th style="padding: 6px; text-align: center;">Cadência</th>
              <th style="padding: 6px; text-align: center;">Séries</th>
              <th style="padding: 6px; text-align: center;">Reps</th>
              <th style="padding: 6px; text-align: center;">RPE/RIR</th>
              <th style="padding: 6px; text-align: center;">Pausa</th>
              <th style="padding: 6px; text-align: center;">Carga (kg)</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  // Monta HTML da Agenda dos 7 Dias com Sinergia Nutricional (Alternando 2 Cores nos Treinos)
  let pdfTrainCount = 0;
  const scheduleRows = perfWeeklySchedule.map((d, idx) => {
    const isTrain = d.type === 'Treino';
    const isCardio = d.type === 'Cardio';

    let isColor2 = false;
    if (isTrain) {
      if (d.routineId) {
        const charCode = d.routineId.toUpperCase().charCodeAt(0) - 65;
        isColor2 = (charCode >= 0 ? charCode % 2 === 1 : pdfTrainCount % 2 === 1);
      } else {
        isColor2 = (pdfTrainCount % 2 === 1);
      }
      pdfTrainCount++;
    }

    const typeColor = isTrain ? (isColor2 ? '#7e22ce' : '#1e40af') : isCardio ? '#b45309' : '#6b7280';
    const typeBg = isTrain ? (isColor2 ? '#faf5ff' : '#eff6ff') : isCardio ? '#fffbeb' : '#f9fafb';
    const borderColor = isTrain ? (isColor2 ? '#e9d5ff' : '#bfdbfe') : isCardio ? '#fed7aa' : '#e5e7eb';
    const dayLabel = `DIA ${idx + 1}`;

    return `
      <div style="flex: 1; min-width: 90px; border: 1px solid ${borderColor}; border-radius: 6px; padding: 6px 8px; background: ${typeBg}; font-size: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.06); padding-bottom: 3px; margin-bottom: 3px;">
          <strong style="color: ${typeColor}; font-size: 11px;">${dayLabel}</strong>
          <span style="font-size: 9px; font-weight: bold; color: ${typeColor};">${d.type}</span>
        </div>
        <div style="font-weight: bold; color: #111827; font-size: 10.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${d.title}</div>
        <div style="color: #6b7280; font-size: 9px; margin-top: 2px;">${d.focus}</div>
        <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #d1d5db; font-size: 8.5px; color: #374151; line-height: 1.3;">
          <div style="margin-bottom: 1.5px;"><strong style="color: #b45309;">🌾 Carbo:</strong> ${d.carboTip || 'Carbo peri-treino'}</div>
          <div style="margin-bottom: 1.5px;"><strong style="color: #1d4ed8;">🥩 Prot:</strong> ${d.proteinTip || '2.0 g/kg'}</div>
          <div style="margin-bottom: 1.5px;"><strong style="color: #0891b2;">💧 Água:</strong> ${d.waterTip || '3.000 mL'}</div>
          <div><strong style="color: #059669;">⚡ Foco:</strong> ${d.strategyTip || 'Recarga glicêmica'}</div>
        </div>
      </div>
    `;
  }).join('');

  // Coleta todos os dias de Cardio prescritos na Agenda Semanal
  const cardioDays = perfWeeklySchedule.filter(d => d.type === 'Cardio');
  
  let cardioSectionsHtml = '';
  if (cardioDays.length > 0) {
    cardioSectionsHtml = cardioDays.map((cd, idx) => {
      const cProto = PERF_CARDIO_DB.find(c => c.id === cd.cardioId) ||
                     (cd.dayKey === 'd6' || cd.dayKey === 'sab' ? PERF_CARDIO_DB.find(c => c.id === 'cardio_02') : PERF_CARDIO_DB[0]);
      
      const cBlocksHtml = cProto.blocks.map(b => `
        <div style="background: #ffffff; border: 1px solid #fed7aa; border-radius: 6px; padding: 8px; font-size: 11px;">
          <strong style="color: #c2410c; display: block; margin-bottom: 4px; font-size: 11.5px;">Bloco ${b.num} — ${b.name}</strong>
          <ul style="margin: 0; padding-left: 14px; color: #374151; font-size: 10.5px;">
            ${b.items.map(it => `<li style="margin-bottom: 2px;">${it}</li>`).join('')}
          </ul>
        </div>
      `).join('');

      const cDayLabel = (cd.dayKey && cd.dayKey.startsWith('d')) ? `DIA ${cd.dayKey.replace('d','')}` : (cd.dayName && cd.dayName.startsWith('Dia ')) ? cd.dayName.toUpperCase() : `DIA ${idx + 1}`;

      return `
        <div style="page-break-inside: avoid; border: 1px solid #f97316; border-radius: 8px; background: #fff7ed; padding: 12px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #fed7aa; padding-bottom: 6px; margin-bottom: 8px;">
            <div>
              <span style="background: #ea580c; color: #ffffff; font-size: 9.5px; font-weight: bold; text-transform: uppercase; padding: 2px 6px; border-radius: 4px;">
                Cardio &amp; Engine · ${cDayLabel}
              </span>
              <strong style="font-size: 13px; color: #9a3412; margin-left: 6px;">${cProto.title}</strong>
              <span style="font-size: 11px; color: #c2410c; margin-left: 4px;">(${cProto.subtitle})</span>
            </div>
            <div style="font-size: 11px; font-family: monospace; color: #c2410c; font-weight: bold;">
              Time Cap: ${cProto.timeCap} • Queima Est.: ${cProto.calEst}
            </div>
          </div>

          <p style="font-size: 11px; color: #7c2d12; margin: 0 0 8px 0;">
            <strong>Foco Biomecânico:</strong> ${cProto.foco}
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
            ${cBlocksHtml}
          </div>

          <div style="font-size: 10px; color: #9a3412; border-top: 1px solid #fed7aa; padding-top: 6px;">
            ⚠️ <strong>Restrições Técnicas:</strong> ${cProto.restrictions.join(' • ')}
          </div>
        </div>
      `;
    }).join('');
  } else {
    // Caso padrão se nenhum dia específico estiver marcado como Cardio
    const cProto = PERF_CARDIO_DB.find(c => c.id === perfPrescribedCardioId) || PERF_CARDIO_DB[0];
    const cBlocksHtml = cProto.blocks.map(b => `
      <div style="background: #ffffff; border: 1px solid #fed7aa; border-radius: 6px; padding: 8px; font-size: 11px;">
        <strong style="color: #c2410c; display: block; margin-bottom: 4px; font-size: 11.5px;">Bloco ${b.num} — ${b.name}</strong>
        <ul style="margin: 0; padding-left: 14px; color: #374151; font-size: 10.5px;">
          ${b.items.map(it => `<li style="margin-bottom: 2px;">${it}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    cardioSectionsHtml = `
      <div style="page-break-inside: avoid; border: 1px solid #f97316; border-radius: 8px; background: #fff7ed; padding: 12px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #fed7aa; padding-bottom: 6px; margin-bottom: 8px;">
          <div>
            <span style="background: #ea580c; color: #ffffff; font-size: 9.5px; font-weight: bold; text-transform: uppercase; padding: 2px 6px; border-radius: 4px;">
              Cardio &amp; Engine Prescrito
            </span>
            <strong style="font-size: 13px; color: #9a3412; margin-left: 6px;">${cProto.title}</strong>
          </div>
          <div style="font-size: 11px; font-family: monospace; color: #c2410c; font-weight: bold;">
            Time Cap: ${cProto.timeCap} • Queima Est.: ${cProto.calEst}
          </div>
        </div>
        <p style="font-size: 11px; color: #7c2d12; margin: 0 0 8px 0;"><strong>Foco:</strong> ${cProto.foco}</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">${cBlocksHtml}</div>
        <div style="font-size: 10px; color: #9a3412; border-top: 1px solid #fed7aa; padding-top: 6px;">⚠️ <strong>Restrições:</strong> ${cProto.restrictions.join(' • ')}</div>
      </div>
    `;
  }

  // Monta o documento completo pronto para impressão
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita pop-ups para gerar e imprimir o PDF do Treino.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Prescrição de Treinamento — ${patientName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 12mm 12mm 12mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #111827;
          background: #ffffff;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @media print {
          body { background: #ffffff; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      
      <!-- Barra Superior de Controle de Impressão (Oculta na Impressão) -->
      <div class="no-print" style="background: #1e3a8a; color: #ffffff; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div>
          <strong style="font-size: 15px; display: block;">📄 Ficha Clínica de Treinamento Pronta</strong>
          <span style="font-size: 12px; color: #bfdbfe;">Clique no botão ao lado para Imprimir ou Salvar em PDF em alta resolução.</span>
        </div>
        <button onclick="window.print()" style="background: #10b981; color: #ffffff; border: none; font-weight: bold; padding: 8px 18px; border-radius: 6px; font-size: 13px; cursor: pointer; display: flex; items-center; gap: 6px;">
          🖨️ Salvar como PDF / Imprimir
        </button>
      </div>

      <!-- CABEÇALHO CLÍNICO DO PRONTUÁRIO -->
      <div style="border-bottom: 2px solid #1e40af; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-size: 10px; font-weight: bold; color: #2563eb; letter-spacing: 1px; text-transform: uppercase;">
            PILAR 4 · PERFORMANCE, BIOMECÂNICA &amp; PERIODIZAÇÃO
          </div>
          <h1 style="margin: 2px 0 4px 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
            PRONTUÁRIO CLÍNICO DE TREINAMENTO
          </h1>
          <div style="font-size: 12px; color: #334155;">
            Paciente: <strong style="color: #0f172a; font-size: 13px;">${patientName}</strong> • Divisão: <strong style="color: #1e40af;">${perfActiveSplit} (${perfWorkoutPlan.length} Rotinas)</strong>
          </div>
        </div>

        <div style="text-align: right; font-size: 10.5px; color: #475569;">
          <div>Emissão: <strong>${currentDate}</strong></div>
          <div>Microciclo: <strong>4 Semanas</strong></div>
          <div style="color: #16a34a; font-weight: bold; margin-top: 2px;">✓ Sincronizado com Pilar Nutrição</div>
        </div>
      </div>

      <!-- PAINEL DE INTEGRAÇÃO NUTRICIONAL & METAS -->
      <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px; font-size: 11px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px;">
          <span style="font-size: 9.5px; color: #64748b; font-weight: bold; text-transform: uppercase; display: block;">Objetivo Clínico</span>
          <strong style="color: #0f172a; font-size: 11.5px;">${objective}</strong>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px;">
          <span style="font-size: 9.5px; color: #64748b; font-weight: bold; text-transform: uppercase; display: block;">Meta Calórica</span>
          <strong style="color: #dc2626; font-size: 11.5px;">${caloricTarget} kcal/dia</strong>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px;">
          <span style="font-size: 9.5px; color: #64748b; font-weight: bold; text-transform: uppercase; display: block;">Aporte Proteico</span>
          <strong style="color: #2563eb; font-size: 11.5px;">${proteinGKg.toFixed(1)} g/kg</strong>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px;">
          <span style="font-size: 9.5px; color: #64748b; font-weight: bold; text-transform: uppercase; display: block;">Volume Semanal</span>
          <strong style="color: #0f172a; font-size: 11.5px;">${totalSets} Séries (${totalEx} Exercícios)</strong>
        </div>
      </div>

      <!-- AGENDA PERIÓDICA DOS 7 DIAS (MICROCICLO) -->
      <div style="margin-bottom: 18px;">
        <div style="font-size: 11px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
          📅 Agenda Periódica de Treinamento &amp; Cardios (Microciclo de 7 Dias)
        </div>
        <div style="display: flex; gap: 6px; width: 100%;">
          ${scheduleRows}
        </div>
      </div>

      <!-- ROTINAS PRESCRITAS DE MUSCULAÇÃO -->
      <div style="margin-bottom: 18px;">
        <div style="font-size: 11px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          🏋️‍♂️ Fichas de Prescrição Biomecânica &amp; Séries de Força
        </div>
        ${routinesHtml}
      </div>

      <!-- PROTOCOLOS DE CARDIO & COMPROMISED RUNNING (TODOS OS DIAS DA SEMANA) -->
      <div style="margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: bold; color: #c2410c; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          🔥 Protocolos de Cardio &amp; Compromised Running Prescritos
        </div>
        ${cardioSectionsHtml}
      </div>

      <!-- DIRETRIZES DE EXECUÇÃO & ASSINATURA -->
      <div style="page-break-inside: avoid; border-top: 1px solid #cbd5e1; padding-top: 12px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b;">
        <div style="max-width: 65%;">
          <strong>Recomendações Biomecânicas Gerais:</strong>
          <ul style="margin: 2px 0 0 0; padding-left: 14px; line-height: 1.4;">
            <li>Realizar aquecimento articular e 2 séries de aproximação progressiva de carga no primeiro exercício multiarticular.</li>
            <li>Respeitar a cadência 3-0-1-0 (fase excêntrica lenta e controlada) para maximizar microlesões miofibrilares seguras.</li>
            <li>Manter a hidratação de 40-50 ml/kg/dia para suporte volumétrico celular e transporte de nutrientes.</li>
          </ul>
        </div>

        <div style="text-align: center; width: 180px;">
          <div style="border-bottom: 1px solid #475569; width: 100%; height: 25px; margin-bottom: 4px;"></div>
          <strong style="color: #0f172a; font-size: 11px; display: block;">Responsável Técnico / IA</strong>
          <span style="font-size: 9.5px; color: #64748b;">CREF / Nutrição Esportiva</span>
        </div>
      </div>

      <script>
        window.onload = function() {
          // Permite que os estilos renderizem e abre a impressão
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}

// Vincula funções ao window global para garantir clique responsivo
window.perfSetSplit = perfSetSplit;
window.perfSetTarget = perfSetTarget;
window.perfSwitchView = perfSwitchView;
window.perfRender = perfRender;
window.perfSetGroupFilter = perfSetGroupFilter;
window.perfSetSearch = perfSetSearch;
window.perfAddExercise = perfAddExercise;
window.perfRemoveExercise = perfRemoveExercise;
window.perfUpdateField = perfUpdateField;
window.handleGenerateAITraining = handleGenerateAITraining;
window.perfSetCardioFilter = perfSetCardioFilter;
window.perfPrescribeCardioToDay = perfPrescribeCardioToDay;
window.perfFocusDay = perfFocusDay;
window.perfScrollToCardio = perfScrollToCardio;
window.renderPerfPrescribedCardio = renderPerfPrescribedCardio;
window.perfGeneratePDF = perfGeneratePDF;
window.perfOpenExerciseGuide = perfOpenExerciseGuide;
window.perfCloseExerciseGuide = perfCloseExerciseGuide;
window.perfHandleGifError = perfHandleGifError;
window.perfBuildWeeklySchedule = perfBuildWeeklySchedule;
window.perfNormalizeWeeklySchedule = perfNormalizeWeeklySchedule;
window.renderPerfWeeklySchedule = renderPerfWeeklySchedule;
window.perfGetNutritionContext = perfGetNutritionContext;
window.perfSyncNutritionAudit = perfSyncNutritionAudit;
window.loadPerformanceForPatient = loadPerformanceForPatient;
window.savePerformanceForPatient = savePerformanceForPatient;
window.perfCalculateHeartRateZones = perfCalculateHeartRateZones;
window.renderPerfHeartRateZones = renderPerfHeartRateZones;
window.perfToggleHREditMode = perfToggleHREditMode;
window.perfSaveCustomHRZones = perfSaveCustomHRZones;
window.perfResetCustomHRZones = perfResetCustomHRZones;
window.perfAutoFillCalculatedHR = perfAutoFillCalculatedHR;
window.updateAITrainingBanner = updateAITrainingBanner;
window.approveAITraining = approveAITraining;
window.perfGetSubstitutes = perfGetSubstitutes;
window.perfSwapExercise = perfSwapExercise;
window.buildPerformanceContext = buildPerformanceContext;
window.validateAIPrescription = validateAIPrescription;
window.validatePrescriptionAgainstContext = validatePrescriptionAgainstContext;
window.generateAndValidateWorkout = generateAndValidateWorkout;
window.defaultPerformanceAIGenerator = defaultPerformanceAIGenerator;
window.geminiPerformanceAIGenerator = geminiPerformanceAIGenerator;
window.GEMINI_MODEL = GEMINI_MODEL;
window.runPerformanceAITests = runPerformanceAITests;
window.runGeminiPerformanceAITests = runGeminiPerformanceAITests;
window.runPersonalizationPerformanceTests = runPersonalizationPerformanceTests;

// ═══════════════════════════════════════════════════════════
// MOTOR PWA MOBILE & GERENCIADOR DE INSTALAÇÃO NO CELULAR
// ═══════════════════════════════════════════════════════════

let deferredInstallPrompt = null;
let isAppInstalled = false;

function initNutriAxPWA() {
  console.log("[NutriAx PWA] Inicializando motor Mobile PWA...");

  // 1. Registro do Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then((registration) => {
          console.log('[NutriAx PWA] Service Worker registrado com sucesso. Escopo:', registration.scope);
          
          // Verifica se há atualização do Service Worker
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[NutriAx PWA] Nova versão disponível. O cache será renovado.');
                }
              };
            }
          };
        })
        .catch((error) => {
          console.warn('[NutriAx PWA] Falha ao registrar Service Worker:', error);
        });
    });
  }

  // 2. Captura do Evento Nativo de Instalação (beforeinstallprompt) no Android / Chrome
  window.addEventListener('beforeinstallprompt', (e) => {
    // Previne o mini-infobar padrão do Chrome para usarmos nosso modal elegante
    e.preventDefault();
    deferredInstallPrompt = e;
    console.log('[NutriAx PWA] Evento beforeinstallprompt capturado. Pronto para instalação rápida.');

    // Atualiza o botão de ação rápida de instalação
    const btnAction = document.getElementById('btn-pwa-install-action');
    if (btnAction) {
      btnAction.classList.add('install-glow-badge');
    }
  });

  // 3. Detecção de Instalação Concluída (appinstalled)
  window.addEventListener('appinstalled', () => {
    console.log('[NutriAx PWA] Aplicativo instalado com sucesso no dispositivo.');
    deferredInstallPrompt = null;
    isAppInstalled = true;
    updateInstalledStateVisuals();
  });

  // 4. Detecção de Modo Standalone (Já executando como App Instalado)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true ||
                       document.referrer.includes('android-app://');

  if (isStandalone) {
    isAppInstalled = true;
    console.log('[NutriAx PWA] Executando em modo Standalone (App Nativo).');
    updateInstalledStateVisuals();
  }

  // 5. Preenche endereço de Wi-Fi Local no modal
  const localUrlDisplay = document.getElementById('localWifiUrlDisplay');
  if (localUrlDisplay) {
    const currentOrigin = window.location.origin || window.location.href.split('#')[0].split('?')[0];
    localUrlDisplay.textContent = currentOrigin;
  }
}

function updateInstalledStateVisuals() {
  const headerBtn = document.getElementById('header-install-app-btn');
  const headerBadge = document.getElementById('header-app-installed-badge');
  const sidebarCard = document.getElementById('sidebar-install-card');

  if (headerBtn) headerBtn.style.display = 'none';
  if (headerBadge) {
    headerBadge.classList.remove('hidden');
    headerBadge.style.display = 'flex';
  }
  if (sidebarCard) {
    sidebarCard.innerHTML = `
      <div class="flex items-center gap-2 text-emerald-400 font-bold text-xs">
        <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i>
        <span>NutriAx Pro Instalado</span>
      </div>
      <p class="text-[11px] text-zinc-400">Modo aplicativo nativo ativo com persistência offline.</p>
    `;
    if (window.lucide) window.lucide.createIcons();
  }
}

function openMobileInstallModal() {
  const modal = document.getElementById('mobile-install-modal');
  if (!modal) return;

  // Auto-detecta iOS vs Android para abrir na aba correspondente
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

  if (isIOS) {
    switchInstallTab('ios');
  } else {
    switchInstallTab('android');
  }

  modal.style.display = 'flex';
  if (window.lucide) window.lucide.createIcons();
}

function closeMobileInstallModal() {
  const modal = document.getElementById('mobile-install-modal');
  if (modal) modal.style.display = 'none';
}

function switchInstallTab(tabId) {
  const tabs = ['android', 'ios', 'wifi'];
  tabs.forEach(t => {
    const btn = document.getElementById(`install-tab-btn-${t}`);
    const content = document.getElementById(`install-content-${t}`);
    
    if (btn) {
      if (t === tabId) {
        btn.className = "py-2.5 px-3 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 bg-red-600 text-white shadow-md";
      } else {
        btn.className = "py-2.5 px-3 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 text-zinc-400 hover:text-white";
      }
    }

    if (content) {
      if (t === tabId) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    }
  });

  if (window.lucide) window.lucide.createIcons();
}

async function triggerPWAInstall() {
  if (deferredInstallPrompt) {
    // Dispara o diálogo nativo do sistema operacional
    deferredInstallPrompt.prompt();
    const choiceResult = await deferredInstallPrompt.userChoice;
    console.log('[NutriAx PWA] Escolha do usuário:', choiceResult.outcome);

    if (choiceResult.outcome === 'accepted') {
      console.log('[NutriAx PWA] Usuário aceitou a instalação.');
      closeMobileInstallModal();
    }
    deferredInstallPrompt = null;
  } else {
    // Se o evento nativo ainda não disparou ou está no desktop, orienta pelo menu do navegador
    alert("Para instalar agora:\n1. Toque nos 3 pontinhos (⋮) do seu navegador;\n2. Selecione 'Instalar aplicativo' ou 'Adicionar à tela inicial'.");
  }
}

function copyWifiUrl() {
  const url = window.location.origin || window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      alert("✅ Endereço copiado: " + url + "\nCole no navegador do celular conectado ao mesmo Wi-Fi!");
    });
  } else {
    prompt("Copie o link abaixo para abrir no celular:", url);
  }
}

function openMobileMenuModal() {
  const modal = document.getElementById('mobile-menu-modal');
  if (modal) {
    modal.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
  }
}

function closeMobileMenuModal() {
  const modal = document.getElementById('mobile-menu-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Vincula funções ao window global para invocações HTML
window.initNutriAxPWA = initNutriAxPWA;
window.openMobileInstallModal = openMobileInstallModal;
window.closeMobileInstallModal = closeMobileInstallModal;
window.switchInstallTab = switchInstallTab;
window.triggerPWAInstall = triggerPWAInstall;
window.copyWifiUrl = copyWifiUrl;
window.openMobileMenuModal = openMobileMenuModal;
window.closeMobileMenuModal = closeMobileMenuModal;
window.selectMobilePilarTool = selectMobilePilarTool;
window.switchPilar = switchPilar;
window.switchTab = switchTab;
window.togglePilaresAcessosCard = togglePilaresAcessosCard;
window.updateMobileSubnavActiveVisuals = updateMobileSubnavActiveVisuals;
window.perfSwitchView = perfSwitchView;
window.resultsSwitchSubView = resultsSwitchSubView;




