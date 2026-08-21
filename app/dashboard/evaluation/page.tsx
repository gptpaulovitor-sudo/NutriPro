"use client";

import React, { useState, useMemo } from "react";
import {
  Activity,
  Calculator,
  Flame,
  Scale,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from "lucide-react";
import {
  calculateIMC,
  calculateTMB,
  calculateGET,
  calculateBodyComposition,
  calculateAnthropometricIndices,
  calculateNutriAxIndex,
} from "@/utils/nutritionMath";

export default function EvaluationPage() {
  // Patient Inputs
  const [gender, setGender] = useState<"Masculino" | "Feminino">("Masculino");
  const [age, setAge] = useState(38);
  const [heightM, setHeightM] = useState(1.96);
  const [weightKg, setWeightKg] = useState(116.0);
  const [activityFactor, setActivityFactor] = useState(1.42);

  // Circumferences
  const [waistCm, setWaistCm] = useState(90);
  const [hipCm, setHipCm] = useState(100);
  const [armCircCm, setArmCircCm] = useState(35);
  const [calfCircCm, setCalfCircCm] = useState(39);

  // 7 Skinfolds (mm)
  const [skinfolds, setSkinfolds] = useState({
    chest: 5,
    axillary: 9,
    triceps: 8,
    subscapular: 10,
    abdominal: 25,
    suprailiac: 22,
    thigh: 10,
  });

  // Real-time calculated metrics using nutritionMath.ts
  const bodyComp = useMemo(() => {
    return calculateBodyComposition(gender, age, weightKg, heightM, skinfolds);
  }, [gender, age, weightKg, heightM, skinfolds]);

  const imcData = useMemo(() => {
    return calculateIMC(weightKg, heightM);
  }, [weightKg, heightM]);

  const tmbData = useMemo(() => {
    return calculateTMB(gender, age, weightKg, heightM, bodyComp.leanMassKg);
  }, [gender, age, weightKg, heightM, bodyComp.leanMassKg]);

  const getKcal = useMemo(() => {
    return calculateGET(tmbData.tmb, activityFactor);
  }, [tmbData.tmb, activityFactor]);

  const indices = useMemo(() => {
    return calculateAnthropometricIndices(
      waistCm,
      hipCm,
      heightM,
      weightKg,
      bodyComp.leanMassKg,
      gender,
      age,
      armCircCm,
      skinfolds.triceps,
      calfCircCm
    );
  }, [waistCm, hipCm, heightM, weightKg, bodyComp.leanMassKg, gender, age, armCircCm, skinfolds.triceps, calfCircCm]);

  const nutriAxData = useMemo(() => {
    return calculateNutriAxIndex(
      bodyComp.bodyFatPercent,
      bodyComp.ffmi,
      1.0,
      indices.rcEst,
      imcData.imc,
      indices.muscleScore,
      age
    );
  }, [bodyComp.bodyFatPercent, bodyComp.ffmi, indices.rcEst, imcData.imc, indices.muscleScore, age]);

  const targetKcal = 3739;
  const targetProteinG = 186;
  const targetCarbG = 302;
  const targetLipidG = 104;
  const targetFiberG = 52;
  const targetWaterMl = Math.round(weightKg * 35 + 1250);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4 text-red-500" /> Calculadora Antropométrica & Energética
          </div>
          <h1 className="text-2xl font-bold text-white">
            Avaliação Nutricional & Composição Corporal
          </h1>
          <p className="text-sm font-medium text-gray-300 mt-1">
            Cálculo em tempo real de dobras cutâneas (JP7), TMB Katch-McArdle, GET, FFMI e RCEst.
          </p>
        </div>

        <div className="bg-red-950/60 border border-red-800/80 px-5 py-3 rounded-xl text-right shrink-0 shadow-[0_0_12px_rgba(220,38,38,0.25)]">
          <span className="text-xs font-mono font-bold text-red-300 block uppercase">ÍNDICE NUTRIAX</span>
          <span className="text-2xl font-black text-red-400">{nutriAxData.nutriAxIndex} / 100</span>
          <span className="text-xs font-medium text-gray-300 block">Idade Metabólica: {nutriAxData.estimatedMetabolicAge} anos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Inputs Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Patient Demographics */}
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-5 space-y-4">
            <h2 className="font-bold text-white text-sm border-b border-zinc-800 pb-2">
              Dados Biométricos Gerais
            </h2>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Sexo</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full p-2.5 bg-black/70 border border-zinc-800 rounded-lg text-white font-medium focus:border-red-500 outline-none"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Idade (anos)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full p-2.5 bg-black/70 border border-zinc-800 rounded-lg text-white font-bold focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Altura (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={heightM}
                  onChange={(e) => setHeightM(Number(e.target.value))}
                  className="w-full p-2.5 bg-black/70 border border-zinc-800 rounded-lg text-white font-bold focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full p-2.5 bg-black/70 border border-zinc-800 rounded-lg text-red-400 font-bold focus:border-red-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Skinfolds Input */}
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h2 className="font-bold text-white text-sm">
                Dobras Cutâneas (mm) - JP7
              </h2>
              <span className="text-xs font-mono font-bold text-red-400">Soma: {bodyComp.sumSkinfolds} mm</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-sm">
              <div>
                <label className="block text-gray-400 font-medium mb-1">Peitoral</label>
                <input
                  type="number"
                  value={skinfolds.chest}
                  onChange={(e) => setSkinfolds({ ...skinfolds, chest: Number(e.target.value) })}
                  className="w-full p-2 bg-black/70 border border-zinc-800 rounded-lg text-white font-bold focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-medium mb-1">Axilar Média</label>
                <input
                  type="number"
                  value={skinfolds.axillary}
                  onChange={(e) => setSkinfolds({ ...skinfolds, axillary: Number(e.target.value) })}
                  className="w-full p-2 bg-black/70 border border-zinc-800 rounded-lg text-white font-bold focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-medium mb-1">Tricipital</label>
                <input
                  type="number"
                  value={skinfolds.triceps}
                  onChange={(e) => setSkinfolds({ ...skinfolds, triceps: Number(e.target.value) })}
                  className="w-full p-2 bg-black/70 border border-zinc-800 rounded-lg text-white font-bold focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-medium mb-1">Subescapular</label>
                <input
                  type="number"
                  value={skinfolds.subscapular}
                  onChange={(e) => setSkinfolds({ ...skinfolds, subscapular: Number(e.target.value) })}
                  className="w-full p-2 bg-black/70 border border-zinc-800 rounded-lg text-white font-bold focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-medium mb-1">Abdominal</label>
                <input
                  type="number"
                  value={skinfolds.abdominal}
                  onChange={(e) => setSkinfolds({ ...skinfolds, abdominal: Number(e.target.value) })}
                  className="w-full p-2 bg-black/70 border border-zinc-800 rounded-lg text-white font-bold focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-medium mb-1">Supra-ilíaca</label>
                <input
                  type="number"
                  value={skinfolds.suprailiac}
                  onChange={(e) => setSkinfolds({ ...skinfolds, suprailiac: Number(e.target.value) })}
                  className="w-full p-2 bg-black/70 border border-zinc-800 rounded-lg text-white font-bold focus:border-red-500 outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-gray-400 font-medium mb-1">Coxa</label>
                <input
                  type="number"
                  value={skinfolds.thigh}
                  onChange={(e) => setSkinfolds({ ...skinfolds, thigh: Number(e.target.value) })}
                  className="w-full p-2 bg-black/70 border border-zinc-800 rounded-lg text-white font-bold focus:border-red-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Circumferences Input */}
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-5 space-y-3">
            <h2 className="font-bold text-white text-sm border-b border-zinc-800 pb-2">
              Circunferências (cm)
            </h2>

            <div className="grid grid-cols-2 gap-2.5 text-sm">
              <div>
                <label className="block text-gray-400 font-medium mb-1">Cintura</label>
                <input
                  type="number"
                  value={waistCm}
                  onChange={(e) => setWaistCm(Number(e.target.value))}
                  className="w-full p-2 bg-black/70 border border-zinc-800 rounded-lg text-white font-bold focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-medium mb-1">Quadril</label>
                <input
                  type="number"
                  value={hipCm}
                  onChange={(e) => setHipCm(Number(e.target.value))}
                  className="w-full p-2 bg-black/70 border border-zinc-800 rounded-lg text-white font-bold focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-medium mb-1">Braço Relaxado</label>
                <input
                  type="number"
                  value={armCircCm}
                  onChange={(e) => setArmCircCm(Number(e.target.value))}
                  className="w-full p-2 bg-black/70 border border-zinc-800 rounded-lg text-white font-bold focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-medium mb-1">Panturrilha</label>
                <input
                  type="number"
                  value={calfCircCm}
                  onChange={(e) => setCalfCircCm(Number(e.target.value))}
                  className="w-full p-2 bg-black/70 border border-zinc-800 rounded-lg text-white font-bold focus:border-red-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results & Calculations Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Energy & Metabolism Card */}
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h2 className="font-bold text-base text-red-400 flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500" /> Gasto Energético & Alvo Calórico
              </h2>
              <span className="text-xs font-mono font-bold bg-red-950/80 text-red-300 border border-red-800/60 px-3 py-1 rounded-full">
                {tmbData.method}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-black/60 p-4 rounded-xl border border-zinc-800">
                <span className="text-xs font-mono font-bold text-gray-400 block">TMB Estimada</span>
                <span className="text-2xl font-bold text-white mt-1 block">{Math.round(tmbData.tmb)}</span>
                <span className="text-xs font-medium text-gray-400 block mt-0.5">kcal / dia</span>
              </div>

              <div className="bg-black/60 p-4 rounded-xl border border-zinc-800">
                <span className="text-xs font-mono font-bold text-gray-400 block">GET (FA: {activityFactor})</span>
                <span className="text-2xl font-bold text-white mt-1 block">{Math.round(getKcal)}</span>
                <span className="text-xs font-medium text-gray-400 block mt-0.5">kcal / dia</span>
              </div>

              <div className="bg-red-950/50 border border-red-800/80 p-4 rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.25)]">
                <span className="text-xs font-mono font-bold text-red-300 block">Alvo Calórico Meta</span>
                <span className="text-2xl font-black text-red-400 mt-1 block">{targetKcal}</span>
                <span className="text-xs font-medium text-red-300 block mt-0.5">kcal / dia</span>
              </div>
            </div>

            {/* Target Macros Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
              <div className="bg-black/50 p-3 rounded-lg text-center border border-zinc-800">
                <span className="text-xs text-gray-400 block font-medium">Proteína</span>
                <span className="text-base font-bold text-white">{targetProteinG}g</span>
                <span className="text-xs text-emerald-400 block font-semibold">1.8 g/kg MLG</span>
              </div>
              <div className="bg-black/50 p-3 rounded-lg text-center border border-zinc-800">
                <span className="text-xs text-gray-400 block font-medium">Carboidrato</span>
                <span className="text-base font-bold text-white">{targetCarbG}g</span>
                <span className="text-xs text-blue-400 block font-semibold">Teto 2.6 g/kg</span>
              </div>
              <div className="bg-black/50 p-3 rounded-lg text-center border border-zinc-800">
                <span className="text-xs text-gray-400 block font-medium">Lipídios</span>
                <span className="text-base font-bold text-white">{targetLipidG}g</span>
                <span className="text-xs text-amber-400 block font-semibold">25% kcal</span>
              </div>
              <div className="bg-black/50 p-3 rounded-lg text-center border border-zinc-800">
                <span className="text-xs text-gray-400 block font-medium">Fibra Mínima</span>
                <span className="text-base font-bold text-white">{targetFiberG}g</span>
                <span className="text-xs text-emerald-400 block font-semibold">14g/1000 kcal</span>
              </div>
              <div className="bg-black/50 p-3 rounded-lg text-center border border-zinc-800 col-span-2 md:col-span-1">
                <span className="text-xs text-gray-400 block font-medium">Hidratação</span>
                <span className="text-base font-bold text-red-400">{targetWaterMl}ml</span>
                <span className="text-xs text-gray-400 block font-medium">35ml/kg + treino</span>
              </div>
            </div>
          </div>

          {/* Body Composition Results Grid */}
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-white text-base flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Scale className="w-5 h-5 text-red-500" />
              Resultados da Composição Corporal (Siri JP7 & Antropometria)
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-black/60 rounded-xl border border-zinc-800">
                <span className="text-xs text-gray-400 font-semibold block">% Gordura (JP7)</span>
                <span className="text-2xl font-bold text-red-400">{bodyComp.bodyFatPercent}%</span>
                <span className="text-xs text-gray-300 font-medium block mt-1">Muito Baixo</span>
              </div>

              <div className="p-4 bg-black/60 rounded-xl border border-zinc-800">
                <span className="text-xs text-gray-400 font-semibold block">Massa Livre de Gordura</span>
                <span className="text-2xl font-bold text-emerald-400">{bodyComp.leanMassKg} kg</span>
                <span className="text-xs text-emerald-400 font-semibold block mt-1">FFMI: {bodyComp.ffmi}</span>
              </div>

              <div className="p-4 bg-black/60 rounded-xl border border-zinc-800">
                <span className="text-xs text-gray-400 font-semibold block">Massa Gorda</span>
                <span className="text-2xl font-bold text-white">{bodyComp.fatMassKg} kg</span>
                <span className="text-xs text-gray-300 font-medium block mt-1">FMI: {bodyComp.fmi}</span>
              </div>

              <div className="p-4 bg-black/60 rounded-xl border border-zinc-800">
                <span className="text-xs text-gray-400 font-semibold block">IMC</span>
                <span className="text-2xl font-bold text-white">{imcData.imc}</span>
                <span className="text-xs text-amber-400 font-semibold block mt-1">{imcData.classification}</span>
              </div>
            </div>

            {/* Anthropometric Risk Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 bg-black/60 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-400 block">RCQ (Cintura/Quadril)</span>
                  <span className="text-base font-bold text-white">{indices.rcq}</span>
                </div>
                <span className="bg-amber-950 text-amber-400 border border-amber-800 text-xs font-bold px-2.5 py-1 rounded">
                  {indices.rcqClassification}
                </span>
              </div>

              <div className="p-3.5 bg-black/60 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-400 block">RCEst (Cintura/Altura)</span>
                  <span className="text-base font-bold text-white">{indices.rcEst}</span>
                </div>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold px-2.5 py-1 rounded">
                  {indices.rcEstClassification}
                </span>
              </div>

              <div className="p-3.5 bg-black/60 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-400 block">Score Muscular</span>
                  <span className="text-base font-bold text-emerald-400">{indices.muscleScore}/100</span>
                </div>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold px-2.5 py-1 rounded">
                  Preservado
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
