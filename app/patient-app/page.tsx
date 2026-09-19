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
  Wallet,
  ShoppingBag,
  Leaf,
  Briefcase,
  Check,
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

  // Questionário de Acessibilidade & Cesta Básica do Paciente
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [orcamento, setOrcamento] = useState<"economico" | "moderado" | "livre">("economico");
  const [ambiente, setAmbiente] = useState<"com_geladeira_microondas" | "sem_refrigeracao" | "marmita_pronta">("com_geladeira_microondas");
  const [suplementos, setSuplementos] = useState(true);
  const [alimentosStatus, setAlimentosStatus] = useState<Record<string, "alta_disponibilidade" | "tolerado" | "baixo_acesso">>({
    p_frango: "alta_disponibilidade",
    p_ovo_inteiro: "alta_disponibilidade",
    p_sardinha: "alta_disponibilidade",
    c_arroz_branco: "alta_disponibilidade",
    c_feijao: "alta_disponibilidade",
    c_aveia: "alta_disponibilidade",
    f_banana: "alta_disponibilidade",
    c_batata_inglesa: "alta_disponibilidade",
  });

  const toggleFood = (id: string) => {
    setAlimentosStatus((prev) => {
      const atual = prev[id] || "tolerado";
      const proximo =
        atual === "alta_disponibilidade"
          ? "baixo_acesso"
          : atual === "baixo_acesso"
          ? "tolerado"
          : "alta_disponibilidade";
      return { ...prev, [id]: proximo };
    });
  };

  const handleSaveQuestionnaire = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowQuestionnaire(false);
    }, 1500);
  };

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

  // ──────────────────────────────────────────────────────────────────────────
  // AVISO DE GOVERNANÇA (Fase N3.7.4 - GAP 10):
  // AMBIENTE DEMO / PROTÓTIPO NÃO PRODUTIVO
  // Os valores abaixo são dados estáticos mockados para prototipagem de UI.
  // NÃO UTILIZAR COMO FONTE DE VERDADE CLÍNICA DE PRODUÇÃO.
  // A fonte canônica reside exclusivamente em domain/ e Dexie/IndexedDB.
  // ──────────────────────────────────────────────────────────────────────────
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
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-full uppercase">[DEMO]</span>
              <span className="text-[11px] text-slate-400 font-medium">17 Ago 2026</span>
            </div>
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

        {/* Banner do Questionário de Acessibilidade */}
        <div className="px-4">
          <button
            type="button"
            onClick={() => setShowQuestionnaire(true)}
            className="w-full bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-850 p-3.5 rounded-2xl border border-emerald-800/60 shadow-lg text-left flex items-center justify-between group transition-all hover:border-emerald-500"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Minha Cesta & Orçamento
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">
                  Alimentos baratos e rotina do seu dia a dia
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
              Editar →
            </span>
          </button>
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

      {/* Questionnaire Drawer / Modal */}
      {showQuestionnaire && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 space-y-4 text-slate-100 shadow-2xl my-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Minha Cesta & Rotina</h3>
                  <span className="text-[11px] text-slate-400">Personalize os alimentos mais fáceis para você</span>
                </div>
              </div>
              <button
                onClick={() => setShowQuestionnaire(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pergunta 1: Orçamento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Quanto você pretende investir na alimentação mensal?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "economico", label: "Econômico", desc: "Cesta Básica" },
                  { key: "moderado", label: "Moderado", desc: "Padrão" },
                  { key: "livre", label: "Livre", desc: "Variado" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setOrcamento(item.key as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      orcamento === item.key
                        ? "bg-emerald-950/80 border-emerald-500 text-white"
                        : "bg-slate-800/60 border-slate-700 text-slate-400"
                    }`}
                  >
                    <span className="text-xs font-bold block">{item.label}</span>
                    <span className="text-[10px] opacity-75">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pergunta 2: Logística no Trabalho / Rua */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Onde você consome suas refeições durante o dia?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAmbiente("com_geladeira_microondas")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                    ambiente === "com_geladeira_microondas"
                      ? "bg-emerald-950/80 border-emerald-500 text-white"
                      : "bg-slate-800/60 border-slate-700 text-slate-400"
                  }`}
                >
                  🏢 Tenho geladeira e micro-ondas
                </button>
                <button
                  type="button"
                  onClick={() => setAmbiente("sem_refrigeracao")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                    ambiente === "sem_refrigeracao"
                      ? "bg-amber-950/80 border-amber-500 text-white"
                      : "bg-slate-800/60 border-slate-700 text-slate-400"
                  }`}
                >
                  🎒 Sem geladeira / Na rua
                </button>
              </div>
            </div>

            {/* Pergunta 3: Suplementos */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Prefere usar suplementos proteicos (Whey/Albumina)?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSuplementos(true)}
                  className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                    suplementos
                      ? "bg-blue-950/80 border-blue-500 text-white"
                      : "bg-slate-800/60 border-slate-700 text-slate-400"
                  }`}
                >
                  Sim, aceito suplementos
                </button>
                <button
                  type="button"
                  onClick={() => setSuplementos(false)}
                  className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                    !suplementos
                      ? "bg-emerald-950/80 border-emerald-500 text-white"
                      : "bg-slate-800/60 border-slate-700 text-slate-400"
                  }`}
                >
                  Apenas comida de verdade
                </button>
              </div>
            </div>

            {/* Pergunta 4: Alimentos mais fáceis para você */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-300">
                  Alimentos de maior facilidade para você:
                </label>
                <span className="text-[10px] text-emerald-400 font-medium">Toque para alternar</span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-950 rounded-2xl border border-slate-800">
                {[
                  { id: "p_frango", nome: "Peito de Frango" },
                  { id: "p_ovo_inteiro", nome: "Ovos Inteiros" },
                  { id: "p_sardinha", nome: "Sardinha" },
                  { id: "c_arroz_branco", nome: "Arroz Branco" },
                  { id: "c_feijao", nome: "Feijão" },
                  { id: "c_aveia", nome: "Aveia em Flocos" },
                  { id: "f_banana", nome: "Banana" },
                  { id: "c_batata_inglesa", nome: "Batata Inglesa" },
                  { id: "c_batata_doce", nome: "Batata Doce" },
                  { id: "c_pao_integral", nome: "Pão de Forma" },
                  { id: "p_albumina", nome: "Albumina" },
                  { id: "g_pasta_amendoim", nome: "Pasta de Amendoim" },
                  { id: "l_leite_desnatado_po", nome: "Leite em Pó" },
                ].map((item) => {
                  const status = alimentosStatus[item.id] || "tolerado";
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleFood(item.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
                        status === "alta_disponibilidade"
                          ? "bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-sm"
                          : status === "baixo_acesso"
                          ? "bg-red-950/80 border-red-700 text-red-300 line-through opacity-70"
                          : "bg-slate-800 border-slate-700 text-slate-400"
                      }`}
                    >
                      {status === "alta_disponibilidade" && "⭐"}
                      {status === "baixo_acesso" && "🚫"}
                      {item.nome}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botão de Salvar */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveQuestionnaire}
                disabled={savedSuccess}
                className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                  savedSuccess
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950"
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>Salvo com Sucesso!</span>
                  </>
                ) : (
                  <span>Salvar Preferências Alimentares</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
