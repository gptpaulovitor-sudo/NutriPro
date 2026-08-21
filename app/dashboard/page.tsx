"use client";

import React, { useState, useEffect } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Flame,
  Activity,
  AlertTriangle,
  Scale,
  ShieldCheck,
  HeartPulse,
  Brain,
  Zap,
  Award,
  ArrowRight,
  TrendingDown,
  Droplets,
  CheckCircle2,
} from "lucide-react";

export default function DashboardPage() {
  const patient = {
    name: "Paulo Vitor R de Sousa",
    age: 38,
    height: 1.96,
    weight: 116.0,
    usualWeight: 120.61,
    targetWeight: 103.72,
    objective: "Perda de peso & Preservação Muscular",
    bodyFat: 6.42,
    leanMass: 108.55,
    fatMass: 7.45,
    waist: 90,
    hip: 100,
    rcq: 0.9,
    rcEst: 0.46,
    imc: 30.2,
    ffmi: 28.26,
    tmb: 2714.73,
    get: 3855.0,
    targetKcal: 3739.0,
    targetProtein: 186,
    targetCarb: 302,
    targetLipid: 104,
    targetFiber: 52,
    targetWater: 5.3,
    nutriAxIndex: 87,
    metabolicAge: 30,
    ageDiff: -8,
  };

  // Recharts Radar Data (6 Dimensions)
  const radarChartData = [
    { dimension: "Massa Muscular", value: 100, fullMark: 100 },
    { dimension: "Pot. Metabólico", value: 100, fullMark: 100 },
    { dimension: "Risco Central", value: 94, fullMark: 100 },
    { dimension: "Reserva Muscular", value: 88, fullMark: 100 },
    { dimension: "Composição Corporal", value: 70, fullMark: 100 },
    { dimension: "IMC Compl.", value: 59, fullMark: 100 },
  ];

  const radarMetricsDetails = [
    { name: "Massa Muscular (FFMI 28.26)", score: 100, status: "Excelente", color: "bg-emerald-500", text: "text-emerald-400" },
    { name: "Potencial Metabólico Estimado", score: 100, status: "Excelente", color: "bg-emerald-500", text: "text-emerald-400" },
    { name: "Risco Central (RCEst 0.46)", score: 94, status: "Excelente", color: "bg-emerald-500", text: "text-emerald-400" },
    { name: "Reserva Muscular Antropométrica", score: 88, status: "Excelente", color: "bg-emerald-500", text: "text-emerald-400" },
    { name: "Composição Corporal (%G 6.42%)", score: 70, status: "Foco de Ajuste", color: "bg-amber-500", text: "text-amber-400" },
    { name: "IMC Complementar (30.2)", score: 59, status: "Triagem", color: "bg-red-500", text: "text-red-400" },
  ];

  const clinicalAlerts = [
    {
      exam: "LDL Colesterol",
      value: "169 mg/dL",
      ref: "< 130 mg/dL",
      priority: "Alta",
      action: "Substituir gorduras saturadas por insaturadas (azeite, abacate) e elevar fibras solúveis (aveia, psyllium).",
    },
    {
      exam: "Creatinina Sérica",
      value: "1.47 mg/dL",
      ref: "0.7–1.3 mg/dL",
      priority: "Alta",
      action: "Garantir hidratação mínima de 5.3L/dia; correlacionar com alta massa magra (FFMI 28.26) e treino pesado.",
    },
    {
      exam: "Ferritina",
      value: "518 ng/mL",
      ref: "30–300 ng/mL",
      priority: "Média",
      action: "Não prescrever ferro; monitorar enzimas hepáticas e estresse de microlesão muscular.",
    },
    {
      exam: "Triglicerídeos",
      value: "165 mg/dL",
      ref: "< 150 mg/dL",
      priority: "Média",
      action: "Reduzir açúcares simples; manter cardio Zona 2 de 3x/semana de 40 minutos.",
    },
  ];

  // Animated Counter Effect for NutriAx Index
  const [displayIndex, setDisplayIndex] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = patient.nutriAxIndex;
    const duration = 1200;
    const stepTime = 16;
    const totalSteps = duration / stepTime;
    const increment = end / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayIndex(end);
        clearInterval(timer);
      } else {
        setDisplayIndex(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [patient.nutriAxIndex]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ═══ 1. BANNER DO PACIENTE (HUD CONTROLE) ═══ */}
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs font-mono font-bold bg-red-950/80 text-red-400 border border-red-800/60 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Activity className="w-3.5 h-3.5 text-red-500" />
              Painel Clínico & Diagnóstico Metabólico
            </span>
            <span className="text-xs font-mono font-medium text-gray-400">
              Protocolo JP7 • Avaliação 2026
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {patient.name}
          </h1>

          <p className="text-sm font-medium text-gray-300 mt-1 flex flex-wrap items-center gap-2">
            <span>{patient.age} anos</span>
            <span className="text-gray-500">•</span>
            <span>{patient.height} m</span>
            <span className="text-gray-500">•</span>
            <span className="text-white font-bold">{patient.weight} kg</span>
            <span className="text-gray-500">•</span>
            <span>Objetivo: <strong className="text-red-400 font-semibold">{patient.objective}</strong></span>
          </p>
        </div>

        {/* TMB & Alvo Calórico em Destaque */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-black/60 border border-zinc-800 p-4 rounded-xl text-center min-w-[130px] shadow-inner">
            <span className="text-xs font-mono font-bold text-gray-400 block uppercase">
              TMB Katch
            </span>
            <p className="text-xl font-bold text-white mt-0.5">
              {Math.round(patient.tmb)}{" "}
              <span className="text-xs font-medium text-gray-400">kcal</span>
            </p>
          </div>

          <div className="bg-red-950/60 border border-red-800/80 p-4 rounded-xl text-center min-w-[140px] shadow-[0_0_15px_rgba(220,38,38,0.25)]">
            <span className="text-xs font-mono font-bold text-red-300 block uppercase tracking-wide">
              Alvo Diário
            </span>
            <p className="text-xl font-black text-red-400 mt-0.5">
              {Math.round(patient.targetKcal)}{" "}
              <span className="text-xs font-medium text-red-300">kcal</span>
            </p>
          </div>
        </div>
      </div>

      {/* ═══ 2. FAIXA DOS 5 PILARES NUTRIAX (HUD STRIP) ═══ */}
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 pr-4 border-r border-zinc-800 shrink-0">
          <Award className="w-4 h-4 text-red-500" />
          <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
            Pilares NutriAx
          </span>
        </div>

        <div className="flex-1 flex flex-wrap items-center justify-around gap-2 text-sm font-semibold">
          <div className="px-3.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-gray-200">
            1. Mentalidade
          </div>
          <div className="px-3.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-gray-200">
            2. Disciplina
          </div>
          <div className="px-3.5 py-1.5 rounded-lg bg-red-950/60 border border-red-800/80 text-white font-bold shadow-sm shadow-red-950">
            3. Nutrição
          </div>
          <div className="px-3.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-gray-200">
            4. Performance
          </div>
          <div className="px-3.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-gray-200">
            5. Resultado
          </div>
        </div>
      </div>

      {/* ═══ 3. CARD ÍNDICE NUTRIAX (DISTRIBUÍDO HORIZONTALMENTE EM LARGURA TOTAL) ═══ */}
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Bloco 1: Título e Score Gigante em Vermelho Neon */}
          <div className="flex items-center gap-6 shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-800 pb-4 lg:pb-0 lg:pr-8 w-full lg:w-auto justify-between lg:justify-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-500" /> ÍNDICE NUTRIAX
                </span>
                <span className="bg-red-950/80 text-red-300 border border-red-800/60 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  Alta Performance
                </span>
              </div>
              <div className="inline-flex items-baseline justify-center">
                <span className="text-6xl md:text-7xl font-black text-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.6)] tracking-tight">
                  {displayIndex}
                </span>
                <span className="text-xl font-bold text-gray-400 ml-1.5">/100</span>
              </div>
              <p className="text-xs font-semibold text-gray-300 mt-1">Eficiência Metabólica</p>
            </div>
          </div>

          {/* Bloco 2: Idades e Vitalidade (Centro) */}
          <div className="flex-1 w-full flex flex-wrap md:flex-nowrap items-center justify-around gap-3 border-b lg:border-b-0 lg:border-r border-zinc-800 pb-4 lg:pb-0 lg:px-6">
            <div className="bg-black/60 rounded-xl px-4 py-3 border border-zinc-800 text-center flex-1 min-w-[130px]">
              <span className="text-xs text-gray-400 font-medium block whitespace-nowrap">Idade Cronológica</span>
              <span className="text-base font-bold text-white mt-0.5 block whitespace-nowrap">{patient.age} anos</span>
            </div>
            <div className="bg-black/60 rounded-xl px-4 py-3 border border-zinc-800 text-center flex-1 min-w-[130px]">
              <span className="text-xs text-gray-400 font-medium block whitespace-nowrap">Idade Metabólica Est.</span>
              <span className="text-base font-bold text-emerald-400 mt-0.5 block whitespace-nowrap">{patient.metabolicAge} anos</span>
            </div>
            <div className="bg-emerald-950/50 rounded-xl px-4 py-3 border border-emerald-800/80 text-center flex-1 min-w-[160px] shadow-sm">
              <span className="text-xs text-gray-300 font-medium block whitespace-nowrap">Diferença Vitalidade</span>
              <span className="text-sm font-black text-emerald-400 mt-0.5 block whitespace-nowrap">-8 anos (Mais jovem)</span>
            </div>
          </div>

          {/* Bloco 3: Diagnóstico Sintético (Direita) */}
          <div className="w-full lg:w-80 shrink-0 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-gray-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Diagnóstico Sintético</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-medium">
              Excelente! A idade metabólica estimada é 8 ano(s) inferior à cronológica — indica alta eficiência metabólica e condicionamento favorável.
            </p>
          </div>

        </div>
      </div>

      {/* ═══ 4. CARD RADAR METABÓLICO (GRÁFICO NO CENTRO + RESULTADOS AO REDOR) ═══ */}
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="font-bold text-white text-base md:text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            Radar Metabólico NutriAx (6 Dimensões)
          </h2>
          <span className="text-xs font-mono font-bold text-gray-400">
            Diagnóstico Clínico Multidimensionado
          </span>
        </div>

        {/* Grid em 3 Colunas: 3 Métricas à Esquerda | Gráfico no Centro | 3 Métricas à Direita */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Coluna Esquerda: Dimensões 1, 2 e 3 */}
          <div className="lg:col-span-4 space-y-3">
            {radarMetricsDetails.slice(0, 3).map((item, idx) => (
              <div key={idx} className="bg-black/60 p-3 rounded-xl border border-zinc-800/90 shadow-sm">
                <div className="flex justify-between items-center text-xs font-semibold mb-1">
                  <span className="text-gray-200">{item.name}</span>
                  <span className={item.text}>{item.score}/100 • {item.status}</span>
                </div>
                <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Coluna Central: Spider Radar Chart (Recharts) */}
          <div className="lg:col-span-4 h-80 w-full flex items-center justify-center p-2 bg-black/40 rounded-2xl border border-zinc-800/60 shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarChartData}>
                <PolarGrid stroke="rgba(239, 68, 68, 0.25)" strokeWidth={1} />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: "#e5e7eb", fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  stroke="rgba(255, 255, 255, 0.15)"
                  tick={false}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#dc2626"
                  strokeWidth={2}
                  fill="#ef4444"
                  fillOpacity={0.4}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="bg-black/90 border border-red-600/60 p-2.5 rounded-lg shadow-xl text-xs font-mono">
                          <p className="font-bold text-white">{data.payload.dimension}</p>
                          <p className="text-red-400 font-black text-sm mt-0.5">{data.value} / 100 pts</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Coluna Direita: Dimensões 4, 5 e 6 */}
          <div className="lg:col-span-4 space-y-3">
            {radarMetricsDetails.slice(3, 6).map((item, idx) => (
              <div key={idx} className="bg-black/60 p-3 rounded-xl border border-zinc-800/90 shadow-sm">
                <div className="flex justify-between items-center text-xs font-semibold mb-1">
                  <span className="text-gray-200">{item.name}</span>
                  <span className={item.text}>{item.score}/100 • {item.status}</span>
                </div>
                <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Foco de Conduta */}
        <div className="p-4 bg-red-950/30 rounded-xl border border-red-900/40 text-xs font-medium text-gray-200 flex items-start gap-3">
          <Zap className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-red-400 font-bold">Foco Estratégico Atual:</strong> Composição Corporal (Score 70). O % de gordura atual está em <strong className="text-white">6,42%</strong> (muito baixo). A conduta principal é <strong className="text-emerald-400 font-bold">preservar a massa magra (108,55 kg)</strong> e otimizar o perfil lipídico.
          </p>
        </div>
      </div>

      {/* ═══ 5. CARDS DE COMPOSIÇÃO CORPORAL (KPIs) ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-5">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold mb-1">
            <span>Massa Livre de Gordura</span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {patient.leanMass} <span className="text-sm font-normal text-gray-400">kg</span>
          </p>
          <p className="text-xs text-emerald-400 font-semibold mt-1">FFMI: 28,26 (Elite Muscular)</p>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-5">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold mb-1">
            <span>% Gordura (JP7)</span>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-400">
            {patient.bodyFat} <span className="text-sm font-normal text-gray-400">%</span>
          </p>
          <p className="text-xs text-gray-300 font-medium mt-1">Massa Gorda: {patient.fatMass} kg</p>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-5">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold mb-1">
            <span>Cintura / RCEst</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {patient.waist} <span className="text-sm font-normal text-gray-400">cm</span>
          </p>
          <p className="text-xs text-emerald-400 font-semibold mt-1">RCEst: 0,46 (Risco Mínimo)</p>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-5">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold mb-1">
            <span>Metas Diárias</span>
            <HeartPulse className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-base font-bold text-white mt-0.5">
            {patient.targetProtein}g P • {patient.targetCarb}g C • {patient.targetLipid}g G
          </p>
          <p className="text-xs text-gray-300 font-medium mt-1">Fibra: 52g • Água: 5,3 L</p>
        </div>

      </div>

      {/* ═══ 5. ALERTAS CLÍNICOS LABORATORIAIS ═══ */}
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="font-bold text-white text-base md:text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Alertas Clínicos & Marcadores Laboratoriais
          </h2>
          <span className="text-xs font-mono font-bold text-gray-400">
            {clinicalAlerts.length} Marcadores em Observação
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clinicalAlerts.map((alert, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-zinc-800 bg-black/60 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{alert.exam}</span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    alert.priority === "Alta"
                      ? "bg-red-950 text-red-400 border border-red-800"
                      : "bg-amber-950 text-amber-400 border border-amber-800"
                  }`}
                >
                  Prioridade {alert.priority}
                </span>
              </div>

              <div className="text-xs font-medium text-gray-300 flex items-center gap-4">
                <span>Resultado: <strong className="text-white font-bold">{alert.value}</strong></span>
                <span>Referência: <span className="text-gray-400">{alert.ref}</span></span>
              </div>

              <p className="text-xs font-medium text-gray-200 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <strong className="text-red-400">Conduta Sugerida:</strong> {alert.action}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ 6. MOTOR DE INTELIGÊNCIA CLÍNICA NUTRIAX ═══ */}
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-6 flex items-start gap-4">
        <div className="bg-red-950/60 border border-red-800/60 p-3.5 rounded-xl shrink-0">
          <Brain className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h3 className="font-bold text-base text-red-400 mb-1">
            Motor de Inteligência Clínica NutriAx Pro
          </h3>
          <p className="text-sm font-medium text-gray-300 leading-relaxed">
            Interpretação técnica: Índice NutriAx <strong>87/100 (Muito bom)</strong>. O paciente apresenta excelente base muscular (108,55 kg de massa livre de gordura, FFMI 28,26). O limitador principal atual é o percentual de gordura estimado (6,42%), recomendando-se evitar déficits agressivos. A conduta nutricional prioriza a regulação do LDL (169 mg/dL) com incremento de fibras (52g/dia) e gorduras monoinsaturadas (104g/dia com azeite e abacate).
          </p>
        </div>
      </div>

    </div>
  );
}
