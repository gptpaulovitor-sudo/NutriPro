"use client";

import React, { useState } from "react";
import {
  Flame,
  CheckCircle2,
  Circle,
  Dumbbell,
  Droplets,
  Zap,
  ArrowRightLeft,
  Calendar,
  Smile,
  Frown,
  Meh,
  Utensils,
  X,
} from "lucide-react";

interface PatientMeal {
  id: string;
  name: string;
  time: string;
  items: string;
  kcal: number;
  protein: number;
  consumed: boolean;
}

export default function PatientAppPage() {
  const [meals, setMeals] = useState<PatientMeal[]>([
    { id: "1", name: "Café da manhã", time: "07:00", items: "100ml Café + 30g Leite em Pó Integral", kcal: 151, protein: 8.1, consumed: true },
    { id: "2", name: "Lanche da manhã", time: "10:00", items: "30g Albumina Naturovos", kcal: 108.6, protein: 25.2, consumed: true },
    { id: "3", name: "Almoço", time: "12:30", items: "200g Frango Grelhado + 200g Arroz + 80g Feijão", kcal: 669.2, protein: 72.4, consumed: true },
    { id: "4", name: "Pré-treino", time: "16:30", items: "100g Banana + 30g Aveia + 180g Iogurte", kcal: 439.1, protein: 21.0, consumed: false },
    { id: "5", name: "Pós-treino", time: "18:30", items: "30g Albumina Naturovos", kcal: 108.6, protein: 25.2, consumed: false },
    { id: "6", name: "Jantar", time: "20:00", items: "100g Frango + 150g Arroz + 50g Tomate + 20g Ovo", kcal: 412.0, protein: 39.6, consumed: false },
  ]);

  const [hunger, setHunger] = useState(4);
  const [energy, setEnergy] = useState(8);
  const [waterMl, setWaterMl] = useState(3500);
  const [workoutDone, setWorkoutDone] = useState(true);
  const [cardioDone, setCardioDone] = useState(true);

  // Substitution modal state
  const [activeSwapMeal, setActiveSwapMeal] = useState<PatientMeal | null>(null);

  const toggleMeal = (id: string) => {
    setMeals(
      meals.map((m) => (m.id === id ? { ...m, consumed: !m.consumed } : m))
    );
  };

  const addWater = (amount: number) => {
    setWaterMl((prev) => Math.min(6000, prev + amount));
  };

  const consumedKcal = meals
    .filter((m) => m.consumed)
    .reduce((acc, m) => acc + m.kcal, 0);

  const consumedProtein = meals
    .filter((m) => m.consumed)
    .reduce((acc, m) => acc + m.protein, 0);

  const targetKcal = 3739;
  const targetProtein = 186;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-3 md:p-6">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 pb-6">
        {/* Top Header */}
        <div className="bg-gradient-to-b from-emerald-950/80 to-slate-900 p-5 border-b border-slate-800/80 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase">
                NutriAx Paciente • Hoje
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">17 Ago 2026</span>
          </div>

          <div>
            <h1 className="text-xl font-black text-white">Olá, Paulo Vitor! 👋</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Objetivo: <strong className="text-emerald-400 font-semibold">Perda de peso & Preservação</strong>
            </p>
          </div>

          {/* Daily Progress Bars */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-800/90 p-3 rounded-2xl border border-slate-700/80">
              <div className="flex justify-between text-[11px] mb-1 font-semibold">
                <span className="text-slate-300">Calorias</span>
                <span className="text-emerald-400">{Math.round(consumedKcal)} / {targetKcal} kcal</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (consumedKcal / targetKcal) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-800/90 p-3 rounded-2xl border border-slate-700/80">
              <div className="flex justify-between text-[11px] mb-1 font-semibold">
                <span className="text-slate-300">Proteína</span>
                <span className="text-blue-400">{Math.round(consumedProtein)} / {targetProtein}g</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (consumedProtein / targetProtein) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Meals Timeline */}
        <div className="px-4 space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-400" />
              Sua Prescrição do Dia
            </h2>
            <span className="text-[11px] text-slate-400">
              {meals.filter((m) => m.consumed).length} de {meals.length} concluídas
            </span>
          </div>

          <div className="space-y-2.5">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  meal.consumed
                    ? "bg-slate-850 border-emerald-800/50 opacity-90"
                    : "bg-slate-800/60 border-slate-700/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => toggleMeal(meal.id)}
                    className="flex items-start gap-3 text-left flex-1"
                  >
                    {meal.consumed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{meal.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{meal.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-snug">{meal.items}</p>
                      <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                        {Math.round(meal.kcal)} kcal • {meal.protein}g proteína
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveSwapMeal(meal)}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0"
                  >
                    <ArrowRightLeft className="w-3 h-3" /> Trocar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Training & Cardio Check */}
        <div className="px-4 pt-2">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/70 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
              Treino & Atividade Física
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setWorkoutDone(!workoutDone)}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  workoutDone
                    ? "bg-emerald-950/60 border-emerald-700 text-emerald-300"
                    : "bg-slate-900 border-slate-700 text-slate-400"
                }`}
              >
                <div>
                  <span className="text-xs font-bold block">Musculação</span>
                  <span className="text-[10px] opacity-80">ABC • 60 min</span>
                </div>
                {workoutDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setCardioDone(!cardioDone)}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  cardioDone
                    ? "bg-emerald-950/60 border-emerald-700 text-emerald-300"
                    : "bg-slate-900 border-slate-700 text-slate-400"
                }`}
              >
                <div>
                  <span className="text-xs font-bold block">Cardio HIIT</span>
                  <span className="text-[10px] opacity-80">15 min</span>
                </div>
                {cardioDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Water Log */}
        <div className="px-4">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/70 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                <Droplets className="w-4 h-4" /> Hidratação Diária
              </div>
              <span className="text-lg font-black text-white mt-1 block">
                {waterMl} <span className="text-xs font-normal text-slate-400">/ 5310 ml</span>
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => addWater(250)}
                className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-500/40"
              >
                +250ml
              </button>
              <button
                onClick={() => addWater(500)}
                className="bg-blue-600/40 hover:bg-blue-600/60 text-blue-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-500/50"
              >
                +500ml
              </button>
            </div>
          </div>
        </div>

        {/* Subjective Ratings: Hunger & Energy Sliders */}
        <div className="px-4 space-y-3">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/70 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Percepção do Dia (Feedback)
            </h3>

            {/* Hunger Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold">Nível de Fome</span>
                <span className="text-amber-400 font-bold">{hunger} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={hunger}
                onChange={(e) => setHunger(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-700 h-2 rounded-lg"
              />
            </div>

            {/* Energy Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold">Energia / Disposição no Treino</span>
                <span className="text-emerald-400 font-bold">{energy} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-700 h-2 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Food Substitution Drawer / Modal */}
      {activeSwapMeal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                  Substitutos Sugeridos
                </h3>
                <span className="text-xs text-slate-400">{activeSwapMeal.name}</span>
              </div>
              <button
                onClick={() => setActiveSwapMeal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Você pode trocar a porção de <strong>{activeSwapMeal.items}</strong> por qualquer uma das opções equivalentes abaixo:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex justify-between items-center">
                <span>• Patinho Bovino Grelhado (100g)</span>
                <span className="text-emerald-400 font-bold">20g Proteína</span>
              </div>
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex justify-between items-center">
                <span>• Filé de Tilápia Grelhado (110g)</span>
                <span className="text-emerald-400 font-bold">20g Proteína</span>
              </div>
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex justify-between items-center">
                <span>• Whey Protein Isolado (22g)</span>
                <span className="text-emerald-400 font-bold">20g Proteína</span>
              </div>
            </div>

            <button
              onClick={() => setActiveSwapMeal(null)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-all"
            >
              Confirmar Troca
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
