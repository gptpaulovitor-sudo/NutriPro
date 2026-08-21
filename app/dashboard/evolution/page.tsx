"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Scale, Flame, Activity, Calendar } from "lucide-react";

const evolutionData = [
  { date: "26/01/2026", peso: 120.61, massaMagra: 106.5, gorduraPct: 11.6, cintura: 96, ffmi: 27.7 },
  { date: "26/03/2026", peso: 118.4, massaMagra: 107.2, gorduraPct: 9.4, cintura: 93, ffmi: 27.9 },
  { date: "26/05/2026", peso: 116.8, massaMagra: 108.1, gorduraPct: 7.4, cintura: 91, ffmi: 28.1 },
  { date: "25/06/2026", peso: 116.0, massaMagra: 108.55, gorduraPct: 6.42, cintura: 90, ffmi: 28.26 },
];

export default function EvolutionPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4 text-red-500" /> Histórico & Tendências Temporais
          </div>
          <h1 className="text-2xl font-bold text-white">
            Evolução Antropométrica & Composição Corporal
          </h1>
          <p className="text-sm font-medium text-gray-300 mt-1">
            Acompanhamento longitudinal de peso, massa livre de gordura, % de gordura e circunferências.
          </p>
        </div>

        <div className="bg-black/60 border border-zinc-800 px-4 py-2.5 rounded-xl flex items-center gap-3 shrink-0">
          <Calendar className="w-4 h-4 text-red-400" />
          <div className="text-xs">
            <span className="block font-bold text-white">4 Avaliações Registradas</span>
            <span className="text-gray-400">Jan 2026 → Jun 2026</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-5">
          <span className="text-xs text-gray-400 font-semibold block">Variação de Peso</span>
          <p className="text-2xl font-bold text-white mt-1">-4,61 <span className="text-sm font-normal text-gray-400">kg</span></p>
          <span className="text-xs text-red-400 font-bold block mt-1">120,6 kg → 116,0 kg</span>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-5">
          <span className="text-xs text-gray-400 font-semibold block">Ganho de Massa Magra</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">+2,05 <span className="text-sm font-normal text-gray-400">kg</span></p>
          <span className="text-xs text-gray-300 font-medium block mt-1">106,5 kg → 108,55 kg</span>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-5">
          <span className="text-xs text-gray-400 font-semibold block">Redução de % Gordura</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">-5,18 <span className="text-sm font-normal text-gray-400">%</span></p>
          <span className="text-xs text-gray-300 font-medium block mt-1">11,6% → 6,42%</span>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-5">
          <span className="text-xs text-gray-400 font-semibold block">Redução de Cintura</span>
          <p className="text-2xl font-bold text-white mt-1">-6 <span className="text-sm font-normal text-gray-400">cm</span></p>
          <span className="text-xs text-emerald-400 font-bold block mt-1">96 cm → 90 cm</span>
        </div>
      </div>

      {/* Chart 1: Peso vs Massa Magra */}
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <Scale className="w-5 h-5 text-red-500" />
            Evolução de Peso Corporal (kg) vs Massa Magra (kg)
          </h2>
          <span className="text-xs font-mono font-bold text-gray-400">Recomposição Corporal Ativa</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis domain={["auto", "auto"]} stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#09090b", borderRadius: "10px", border: "1px solid #3f3f46", color: "#fff", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Line type="monotone" dataKey="peso" name="Peso Corporal (kg)" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="massaMagra" name="Massa Magra (kg)" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: % Gordura vs Cintura */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              % de Gordura Corporal (JP7)
            </h2>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis domain={[0, 15]} stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#09090b", borderRadius: "10px", border: "1px solid #3f3f46", color: "#fff", fontSize: "12px" }} />
                <Line type="monotone" dataKey="gorduraPct" name="% Gordura" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Circunferência da Cintura (cm)
            </h2>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis domain={[85, 100]} stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#09090b", borderRadius: "10px", border: "1px solid #3f3f46", color: "#fff", fontSize: "12px" }} />
                <Line type="monotone" dataKey="cintura" name="Cintura (cm)" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
