"use client";

/**
 * app/dashboard/prescription/page.tsx
 * 
 * Prescritor de Dietas Inteligente — NutriAx Pro.
 * Interface moderna, altamente reativa e tipada, conectada à Server Action
 * com persistência atômica no banco de dados via Prisma.
 */

import React, { useState, useTransition, useMemo } from "react";
import {
  UtensilsCrossed,
  Sparkles,
  Flame,
  Scale,
  Activity,
  HeartPulse,
  Droplets,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Save,
  Printer,
  Sliders,
} from "lucide-react";
import { prescribeDietAction } from "@/actions/prescribeDiet";
import {
  ObjetivoClinico,
  NivelAtividade,
  EstiloAlimentar,
  PlanoAlimentar,
  Refeicao,
  ItemRefeicao,
  Alimento,
} from "@/utils/nutritionTypes";
import {
  calculateTMB,
  calculateGET,
} from "@/utils/nutritionMath";
import { CATALOGO_ALIMENTOS_BASE } from "@/utils/dietGenerator";

export default function PrescriptionPage() {
  const [isPending, startTransition] = useTransition();

  // Estados dos Dados Biométricos do Paciente
  const [patientName, setPatientName] = useState("João Silva");
  const [gender, setGender] = useState<"Masculino" | "Feminino">("Masculino");
  const [age, setAge] = useState(28);
  const [weightKg, setWeightKg] = useState(82);
  const [heightCm, setHeightCm] = useState(178);
  const [bodyFatPercent, setBodyFatPercent] = useState<number | undefined>(14);

  // Estados Clínicos e de Rotina
  const [objective, setObjective] = useState<ObjetivoClinico>("hipertrofia");
  const [activityLevel, setActivityLevel] = useState<NivelAtividade>("moderado");
  const [mealCount, setMealCount] = useState(4);
  const [dietaryStyle, setDietaryStyle] = useState<EstiloAlimentar>("onivoro");

  // Restrições e Aversões
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [aversionInput, setAversionInput] = useState("");
  const [aversionsList, setAversionsList] = useState<string[]>([]);

  // Plano Gerado e Feedbacks
  const [planoAlimentar, setPlanoAlimentar] = useState<PlanoAlimentar | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(true);
  const [showSubstitutions, setShowSubstitutions] = useState(false);

  // Adição manual de itens nas refeições
  const [customItemMeal, setCustomItemMeal] = useState<string>("");
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [customQuantity, setCustomQuantity] = useState<number>(100);

  // Cálculo prévio em tempo real na interface (Preview)
  const previewMetabolico = useMemo(() => {
    const alturaM = heightCm / 100;
    const { tmb, method } = calculateTMB(gender, age, weightKg, alturaM);
    
    let fatorAtiv = 1.55;
    if (activityLevel === "sedentario") fatorAtiv = 1.2;
    if (activityLevel === "leve") fatorAtiv = 1.375;
    if (activityLevel === "moderado") fatorAtiv = 1.55;
    if (activityLevel === "alto") fatorAtiv = 1.725;
    if (activityLevel === "atleta") fatorAtiv = 1.9;

    const get = calculateGET(tmb, fatorAtiv);

    let delta = 0;
    if (objective === "emagrecimento") delta = -450;
    if (objective === "hipertrofia") delta = +350;
    if (objective === "recomposicao") delta = -150;
    if (objective === "performance") delta = +150;

    const targetKcal = Math.max(1200, Math.round(get + delta));

    return { tmb, method, get, targetKcal, delta };
  }, [gender, age, weightKg, heightCm, activityLevel, objective]);

  // Handler para alternar alérgenos rápidos
  const toggleAllergen = (item: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // Handler para adicionar aversão
  const handleAddAversion = () => {
    if (!aversionInput.trim()) return;
    if (!aversionsList.includes(aversionInput.trim().toLowerCase())) {
      setAversionsList([...aversionsList, aversionInput.trim().toLowerCase()]);
    }
    setAversionInput("");
  };

  const handleRemoveAversion = (item: string) => {
    setAversionsList(aversionsList.filter((i) => i !== item));
  };

  // Execução do Prescritor via Server Action
  const handleGenerateDiet = () => {
    setStatusMessage(null);
    startTransition(async () => {
      try {
        const res = await prescribeDietAction({
          nomePaciente: patientName,
          biometria: {
            pesoKg: Number(weightKg),
            alturaCm: Number(heightCm),
            idade: Number(age),
            sexo: gender,
            percentualGordura: bodyFatPercent,
          },
          anamnese: {
            objetivo: objective,
            nivelAtividade: activityLevel,
            numeroRefeicoesDia: Number(mealCount),
            restricoes: {
              alergias: selectedAllergens,
              intolerancias: selectedAllergens.filter((a) => a === "Lactose" || a === "Glúten"),
              aversoes: aversionsList,
              estiloAlimentar: dietaryStyle,
            },
          },
          salvarNoBanco: true,
        });

        if (res.success && res.plano) {
          setPlanoAlimentar(res.plano);
          setStatusMessage({
            type: "success",
            text: `Prescrição gerada com sucesso e persistida no banco de dados! ${res.prescriptionId ? `(ID: ${res.prescriptionId})` : ""}`,
          });
          setShowConfigPanel(false); // recolhe o painel para focar no resultado
        } else {
          setStatusMessage({
            type: "error",
            text: res.message || "Não foi possível gerar a prescrição com os parâmetros atuais.",
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro ao se comunicar com a Server Action.";
        setStatusMessage({ type: "error", text: msg });
      }
    });
  };

  // Remover item de uma refeição localmente
  const handleRemoveItem = (refeicaoOrdem: number, itemIdx: number) => {
    if (!planoAlimentar) return;

    const novasRefeicoes = planoAlimentar.refeicoes.map((ref) => {
      if (ref.ordem !== refeicaoOrdem) return ref;
      const novosItens = ref.itens.filter((_, idx) => idx !== itemIdx);

      // Recalcular totais da refeição
      const totais = novosItens.reduce(
        (acc, it) => ({
          calorias: acc.calorias + it.calorias,
          proteina: acc.proteina + it.proteina,
          carboidrato: acc.carboidrato + it.carboidrato,
          gordura: acc.gordura + it.gordura,
          fibra: acc.fibra + it.fibra,
          sodio: acc.sodio + it.sodio,
        }),
        { calorias: 0, proteina: 0, carboidrato: 0, gordura: 0, fibra: 0, sodio: 0 }
      );

      return {
        ...ref,
        itens: novosItens,
        totaisCalculados: {
          calorias: Math.round(totais.calorias),
          proteina: Number(totais.proteina.toFixed(1)),
          carboidrato: Number(totais.carboidrato.toFixed(1)),
          gordura: Number(totais.gordura.toFixed(1)),
          fibra: Number(totais.fibra.toFixed(1)),
          sodio: Math.round(totais.sodio),
        },
      };
    });

    // Recalcular totais globais
    const totaisGlobais = novasRefeicoes.reduce(
      (acc, r) => ({
        calorias: acc.calorias + r.totaisCalculados.calorias,
        proteina: acc.proteina + r.totaisCalculados.proteina,
        carboidrato: acc.carboidrato + r.totaisCalculados.carboidrato,
        gordura: acc.gordura + r.totaisCalculados.gordura,
        fibra: acc.fibra + r.totaisCalculados.fibra,
        sodio: acc.sodio + r.totaisCalculados.sodio,
      }),
      { calorias: 0, proteina: 0, carboidrato: 0, gordura: 0, fibra: 0, sodio: 0 }
    );

    setPlanoAlimentar({
      ...planoAlimentar,
      refeicoes: novasRefeicoes,
      totaisAlcancados: {
        calorias: Math.round(totaisGlobais.calorias),
        proteina: Number(totaisGlobais.proteina.toFixed(1)),
        carboidrato: Number(totaisGlobais.carboidrato.toFixed(1)),
        gordura: Number(totaisGlobais.gordura.toFixed(1)),
        fibra: Number(totaisGlobais.fibra.toFixed(1)),
        sodio: Math.round(totaisGlobais.sodio),
      },
    });
  };

  // Adicionar alimento selecionado a uma refeição
  const handleAddCustomItem = (mealName: string) => {
    if (!planoAlimentar || !selectedFoodId || customQuantity <= 0) return;

    const alim = CATALOGO_ALIMENTOS_BASE.find((a) => a.id === selectedFoodId);
    if (!alim) return;

    const fator = customQuantity / alim.baseQuantidade;
    const novoItem: ItemRefeicao = {
      alimentoId: alim.id,
      nome: alim.nome,
      quantidadeG: customQuantity,
      calorias: Number((alim.calorias * fator).toFixed(1)),
      proteina: Number((alim.proteina * fator).toFixed(1)),
      carboidrato: Number((alim.carboidrato * fator).toFixed(1)),
      gordura: Number((alim.gordura * fator).toFixed(1)),
      fibra: Number((alim.fibra * fator).toFixed(1)),
      sodio: Number((alim.sodio * fator).toFixed(1)),
    };

    const novasRefeicoes = planoAlimentar.refeicoes.map((ref) => {
      if (ref.nome !== mealName) return ref;
      const novosItens = [...ref.itens, novoItem];

      const totais = novosItens.reduce(
        (acc, it) => ({
          calorias: acc.calorias + it.calorias,
          proteina: acc.proteina + it.proteina,
          carboidrato: acc.carboidrato + it.carboidrato,
          gordura: acc.gordura + it.gordura,
          fibra: acc.fibra + it.fibra,
          sodio: acc.sodio + it.sodio,
        }),
        { calorias: 0, proteina: 0, carboidrato: 0, gordura: 0, fibra: 0, sodio: 0 }
      );

      return {
        ...ref,
        itens: novosItens,
        totaisCalculados: {
          calorias: Math.round(totais.calorias),
          proteina: Number(totais.proteina.toFixed(1)),
          carboidrato: Number(totais.carboidrato.toFixed(1)),
          gordura: Number(totais.gordura.toFixed(1)),
          fibra: Number(totais.fibra.toFixed(1)),
          sodio: Math.round(totais.sodio),
        },
      };
    });

    const totaisGlobais = novasRefeicoes.reduce(
      (acc, r) => ({
        calorias: acc.calorias + r.totaisCalculados.calorias,
        proteina: acc.proteina + r.totaisCalculados.proteina,
        carboidrato: acc.carboidrato + r.totaisCalculados.carboidrato,
        gordura: acc.gordura + r.totaisCalculados.gordura,
        fibra: acc.fibra + r.totaisCalculados.fibra,
        sodio: acc.sodio + r.totaisCalculados.sodio,
      }),
      { calorias: 0, proteina: 0, carboidrato: 0, gordura: 0, fibra: 0, sodio: 0 }
    );

    setPlanoAlimentar({
      ...planoAlimentar,
      refeicoes: novasRefeicoes,
      totaisAlcancados: {
        calorias: Math.round(totaisGlobais.calorias),
        proteina: Number(totaisGlobais.proteina.toFixed(1)),
        carboidrato: Number(totaisGlobais.carboidrato.toFixed(1)),
        gordura: Number(totaisGlobais.gordura.toFixed(1)),
        fibra: Number(totaisGlobais.fibra.toFixed(1)),
        sodio: Math.round(totaisGlobais.sodio),
      },
    });

    setCustomItemMeal("");
    setSelectedFoodId("");
    setCustomQuantity(100);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header Principal */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 shadow-2xl rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider mb-1">
            <UtensilsCrossed className="w-4 h-4" /> Prescritor de Dietas Inteligente — NutriAx Pro
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Prescrição & Geração Determinística de Dietas
          </h1>
          <p className="text-sm font-medium text-zinc-400 mt-1">
            Cálculo fisiológico de TMB/GET, fechamento Atwater (4-4-9), síntese proteica fracionada (MPS) e salvamento atômico no banco.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSubstitutions(!showSubstitutions)}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-zinc-800 shadow-sm flex items-center gap-2 transition-all"
          >
            <ArrowRightLeft className="w-4 h-4 text-red-400" />
            {showSubstitutions ? "Ocultar Substituições" : "Tabela de Substituições"}
          </button>

          <button
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center gap-2 transition-all"
          >
            <Sliders className="w-4 h-4" />
            {showConfigPanel ? "Ocultar Parâmetros" : "Ajustar Parâmetros"}
          </button>
        </div>
      </div>

      {/* Alerta de Feedback (Sucesso / Erro) */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            statusMessage.type === "success"
              ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
              : "bg-red-950/40 border-red-800/60 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs underline hover:opacity-80"
          >
            Fechar
          </button>
        </div>
      )}

      {/* PAINEL COLAPSÁVEL DE CONFIGURAÇÃO DO PRESCRITOR */}
      {showConfigPanel && (
        <div className="bg-gradient-to-br from-zinc-900/90 to-black/90 border border-zinc-800 shadow-2xl rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-500" />
              Parâmetros Clínicos & Biometria do Paciente
            </h2>
            <span className="text-xs font-mono font-bold text-zinc-400">
              Prévia: TMB ~{previewMetabolico.tmb} kcal | VET Alvo ~{previewMetabolico.targetKcal} kcal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Nome do Paciente */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Nome do Paciente
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full p-2.5 bg-black/60 border border-zinc-800 rounded-xl text-white font-semibold text-sm focus:border-red-500 outline-none transition-colors"
                placeholder="Ex: João da Silva"
              />
            </div>

            {/* Sexo */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Sexo Biológico
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "Masculino" | "Feminino")}
                className="w-full p-2.5 bg-black/60 border border-zinc-800 rounded-xl text-white font-semibold text-sm focus:border-red-500 outline-none"
              >
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </div>

            {/* Idade */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Idade (Anos)
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full p-2.5 bg-black/60 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-red-500 outline-none"
              />
            </div>

            {/* Peso */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Peso Atual (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full p-2.5 bg-black/60 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-red-500 outline-none"
              />
            </div>

            {/* Altura */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Altura (cm)
              </label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full p-2.5 bg-black/60 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-red-500 outline-none"
              />
            </div>

            {/* Objetivo Clínico */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Objetivo Clínico
              </label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value as ObjetivoClinico)}
                className="w-full p-2.5 bg-black/60 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-red-500 outline-none"
              >
                <option value="hipertrofia">Hipertrofia (+350 kcal)</option>
                <option value="emagrecimento">Emagrecimento / Cutting (-450 kcal)</option>
                <option value="recomposicao">Recomposição Corporal (-150 kcal)</option>
                <option value="manutencao">Manutenção Isocalórica (0 kcal)</option>
                <option value="performance">Performance Esportiva (+150 kcal)</option>
              </select>
            </div>

            {/* Nível de Atividade */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Nível de Atividade
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as NivelAtividade)}
                className="w-full p-2.5 bg-black/60 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-red-500 outline-none"
              >
                <option value="sedentario">Sedentário (1.20)</option>
                <option value="leve">Levemente Ativo (1.37)</option>
                <option value="moderado">Moderado / Musculação (1.55)</option>
                <option value="alto">Alto / Treino Intenso (1.72)</option>
                <option value="atleta">Atleta de Competição (1.90)</option>
              </select>
            </div>

            {/* Número de Refeições */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Divisão de Refeições
              </label>
              <select
                value={mealCount}
                onChange={(e) => setMealCount(Number(e.target.value))}
                className="w-full p-2.5 bg-black/60 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-red-500 outline-none"
              >
                <option value={3}>3 Refeições (Café, Almoço, Jantar)</option>
                <option value={4}>4 Refeições (Café, Almoço, Lanche, Jantar)</option>
                <option value={5}>5 Refeições (Café, Almoço, Lanche, Jantar, Ceia)</option>
                <option value={6}>6 Refeições (Completo / Alto Fracionamento)</option>
              </select>
            </div>
          </div>

          {/* Restrições Alimentares e Estilo */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                  Estilo de Dieta
                </span>
                <div className="flex gap-2">
                  {(["onivoro", "vegetariano", "vegano", "pescetariano"] as EstiloAlimentar[]).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setDietaryStyle(style)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        dietaryStyle === style
                          ? "bg-red-600 text-white shadow-md shadow-red-900/40 border border-red-500"
                          : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alérgenos Rápidos */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                  Filtros de Segurança & Alérgenos
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {["Lactose", "Glúten", "Amendoim", "Frutos do Mar", "Ovo", "Soja"].map((alg) => {
                    const isSelected = selectedAllergens.includes(alg);
                    return (
                      <button
                        key={alg}
                        type="button"
                        onClick={() => toggleAllergen(alg)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                          isSelected
                            ? "bg-red-950/80 border-red-700 text-red-300 font-bold"
                            : "bg-black/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {isSelected ? "✕ Sem " : "+ "} {alg}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Aversões Individuais */}
            <div className="pt-2 flex flex-col md:flex-row items-start md:items-center gap-3">
              <div className="flex-1 w-full flex gap-2">
                <input
                  type="text"
                  value={aversionInput}
                  onChange={(e) => setAversionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddAversion()}
                  placeholder="Digitar aversão específica (ex: Fígado, Coentro, Cebola) e teclar Enter..."
                  className="w-full p-2 bg-black/60 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:border-red-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddAversion}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold shrink-0"
                >
                  Adicionar
                </button>
              </div>

              {aversionsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {aversionsList.map((av) => (
                    <span
                      key={av}
                      className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 flex items-center gap-1"
                    >
                      {av}
                      <button
                        onClick={() => handleRemoveAversion(av)}
                        className="text-red-400 hover:text-red-300 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botão de Geração */}
          <div className="pt-4 border-t border-zinc-800 flex justify-end">
            <button
              onClick={handleGenerateDiet}
              disabled={isPending}
              className="w-full md:w-auto px-8 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center justify-center gap-3 transition-all"
            >
              {isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Calculando Fisiologia & Otimizando Alimentos...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Gerar Prescrição Inteligente (Atwater & MPS)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD DE MACROS GLOBAIS (Alvo vs Atingido) */}
      {planoAlimentar && (
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/90 shadow-2xl rounded-2xl p-6 space-y-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 border-b border-zinc-800 pb-3">
            <div>
              <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-wider">
                {planoAlimentar.titulo}
              </span>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500" /> Balanço de Macronutrientes Prescrito
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300">
                TMB: {planoAlimentar.balancoEnergetico.tmb} kcal
              </span>
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300">
                GET: {planoAlimentar.balancoEnergetico.get} kcal
              </span>
              <span className="px-2.5 py-1 bg-red-950/80 border border-red-800/80 text-red-400 font-bold">
                Água Mínima: {planoAlimentar.metasGlobais.aguaRecomendadaMl} ml/dia
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Energia */}
            <div className="bg-black/60 p-4 rounded-xl border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-400 block">Valor Energético Total</span>
              <p className="text-2xl font-black text-red-400 mt-1">
                {planoAlimentar.totaisAlcancados.calorias}{" "}
                <span className="text-xs font-medium text-zinc-500">/ {planoAlimentar.metasGlobais.calorias} kcal</span>
              </p>
              <div className="w-full bg-zinc-950 h-2 rounded-full mt-2.5 overflow-hidden border border-zinc-800/80">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (planoAlimentar.totaisAlcancados.calorias / planoAlimentar.metasGlobais.calorias) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Proteína */}
            <div className="bg-black/60 p-4 rounded-xl border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-400 block">
                Proteína ({planoAlimentar.metasGlobais.proteinaGPorKg} g/kg)
              </span>
              <p className="text-2xl font-black text-white mt-1">
                {planoAlimentar.totaisAlcancados.proteina}g{" "}
                <span className="text-xs font-medium text-zinc-500">/ {planoAlimentar.metasGlobais.proteinaG}g</span>
              </p>
              <div className="w-full bg-zinc-950 h-2 rounded-full mt-2.5 overflow-hidden border border-zinc-800/80">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (planoAlimentar.totaisAlcancados.proteina / planoAlimentar.metasGlobais.proteinaG) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Carboidratos */}
            <div className="bg-black/60 p-4 rounded-xl border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-400 block">Carboidratos</span>
              <p className="text-2xl font-black text-white mt-1">
                {planoAlimentar.totaisAlcancados.carboidrato}g{" "}
                <span className="text-xs font-medium text-zinc-500">/ {planoAlimentar.metasGlobais.carboidratoG}g</span>
              </p>
              <div className="w-full bg-zinc-950 h-2 rounded-full mt-2.5 overflow-hidden border border-zinc-800/80">
                <div
                  className="bg-blue-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (planoAlimentar.totaisAlcancados.carboidrato / planoAlimentar.metasGlobais.carboidratoG) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Lipídeos */}
            <div className="bg-black/60 p-4 rounded-xl border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-400 block">Gorduras Totais</span>
              <p className="text-2xl font-black text-white mt-1">
                {planoAlimentar.totaisAlcancados.gordura}g{" "}
                <span className="text-xs font-medium text-zinc-500">/ {planoAlimentar.metasGlobais.gorduraG}g</span>
              </p>
              <div className="w-full bg-zinc-950 h-2 rounded-full mt-2.5 overflow-hidden border border-zinc-800/80">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (planoAlimentar.totaisAlcancados.gordura / planoAlimentar.metasGlobais.gorduraG) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Fibras */}
            <div className="bg-black/60 p-4 rounded-xl border border-zinc-800 col-span-2 md:col-span-1">
              <span className="text-xs font-semibold text-zinc-400 block">Fibras Alimentares</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {planoAlimentar.totaisAlcancados.fibra}g{" "}
                <span className="text-xs font-medium text-zinc-500">/ {planoAlimentar.metasGlobais.fibrasMinimaG}g</span>
              </p>
              <div className="w-full bg-zinc-950 h-2 rounded-full mt-2.5 overflow-hidden border border-zinc-800/80">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (planoAlimentar.totaisAlcancados.fibra / planoAlimentar.metasGlobais.fibrasMinimaG) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CARDS DAS REFEIÇÕES GERADAS */}
      {planoAlimentar && (
        <div className="space-y-5">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-red-500" /> Refeições Estruturadas ({planoAlimentar.refeicoes.length})
            </h3>
            <span className="text-xs text-zinc-400">
              Clique em "+ Item" em qualquer refeição para adicionar porções personalizadas.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {planoAlimentar.refeicoes.map((ref) => (
              <div
                key={ref.ordem}
                className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-2xl overflow-hidden shadow-lg transition-all"
              >
                {/* Cabeçalho da Refeição */}
                <div className="bg-zinc-900/60 p-4 border-b border-zinc-800/80 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    <div>
                      <h4 className="font-extrabold text-white text-base">
                        {ref.nome}
                      </h4>
                      <span className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" /> Horário Sugerido: {ref.horarioSugerido}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-red-400 block">
                        {ref.totaisCalculados.calorias} kcal
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400 block">
                        P: {ref.totaisCalculados.proteina}g | C: {ref.totaisCalculados.carboidrato}g | G: {ref.totaisCalculados.gordura}g
                      </span>
                    </div>

                    <button
                      onClick={() => setCustomItemMeal(customItemMeal === ref.nome ? "" : ref.nome)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg border border-zinc-700 flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-red-400" />
                      Item
                    </button>
                  </div>
                </div>

                {/* Dropdown de Adição de Item na Refeição */}
                {customItemMeal === ref.nome && (
                  <div className="p-4 bg-zinc-950/90 border-b border-zinc-800/80 flex flex-col md:flex-row gap-3 items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Escolha o Alimento</label>
                      <select
                        value={selectedFoodId}
                        onChange={(e) => setSelectedFoodId(e.target.value)}
                        className="w-full p-2 bg-black border border-zinc-700 rounded-lg text-xs text-white font-medium focus:border-red-500 outline-none"
                      >
                        <option value="">Selecione um alimento da base...</option>
                        {CATALOGO_ALIMENTOS_BASE.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nome} ({a.categoria}) — {a.calorias} kcal/100g
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full md:w-32">
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Qtd (g/ml)</label>
                      <input
                        type="number"
                        value={customQuantity}
                        onChange={(e) => setCustomQuantity(Number(e.target.value))}
                        className="w-full p-2 bg-black border border-zinc-700 rounded-lg text-xs text-white font-bold focus:border-red-500 outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddCustomItem(ref.nome)}
                      disabled={!selectedFoodId}
                      className="w-full md:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-md transition-all"
                    >
                      Adicionar Porção
                    </button>
                  </div>
                )}

                {/* Tabela de Itens da Refeição */}
                <div className="divide-y divide-zinc-800/60">
                  {ref.itens.map((it, itemIdx) => (
                    <div
                      key={`${it.alimentoId}_${itemIdx}`}
                      className="p-4 flex items-center justify-between hover:bg-zinc-800/20 transition-colors"
                    >
                      <div>
                        <span className="font-bold text-white text-sm block">{it.nome}</span>
                        <span className="text-xs font-medium text-zinc-400 mt-0.5 block">
                          <strong className="text-red-400 font-bold">{it.quantidadeG}g</strong> • {it.calorias} kcal • P: {it.proteina}g | C: {it.carboidrato}g | G: {it.gordura}g | F: {it.fibra}g
                        </span>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(ref.ordem, itemIdx)}
                        className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-950/30 transition-colors"
                        title="Remover Alimento da Refeição"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAINEL DE SUBSTITUIÇÕES EQUIVALENTES */}
      {showSubstitutions && (
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 shadow-2xl rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-red-500" />
              Guia de Equivalência & Substituições para o Paciente
            </h3>
            <span className="text-xs font-mono font-bold text-zinc-400">Flexibilidade Isocalórica</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Proteínas */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-black/60 space-y-2">
              <span className="font-bold text-emerald-400 block border-b border-zinc-800 pb-1 uppercase tracking-wider">
                Cotas de Proteína Magra (~25g P)
              </span>
              <ul className="space-y-1 text-zinc-300 font-medium">
                <li>• Peito de Frango Grelhado: <strong className="text-white">80g</strong></li>
                <li>• Patinho Bovino Grelhado: <strong className="text-white">70g</strong></li>
                <li>• Filé de Tilápia / Merluza: <strong className="text-white">100g</strong></li>
                <li>• Ovos Inteiros Cozidos: <strong className="text-white">2 unid (100g) + 2 claras</strong></li>
                <li>• Whey Protein Isolado: <strong className="text-white">30g (1 dosador)</strong></li>
                <li>• Tofu Firme Grelhado: <strong className="text-white">200g</strong></li>
              </ul>
            </div>

            {/* Carboidratos */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-black/60 space-y-2">
              <span className="font-bold text-blue-400 block border-b border-zinc-800 pb-1 uppercase tracking-wider">
                Cotas de Carboidrato Complexo (~30g C)
              </span>
              <ul className="space-y-1 text-zinc-300 font-medium">
                <li>• Arroz Branco / Integral Cozido: <strong className="text-white">110g</strong></li>
                <li>• Batata Doce / Inglesa Cozida: <strong className="text-white">150g</strong></li>
                <li>• Mandioca / Aipim Cozido: <strong className="text-white">100g</strong></li>
                <li>• Aveia em Flocos: <strong className="text-white">45g</strong></li>
                <li>• Pão de Forma Integral: <strong className="text-white">2 fatias (50g)</strong></li>
                <li>• Banana Prata / Nanica: <strong className="text-white">140g</strong></li>
              </ul>
            </div>

            {/* Gorduras Boas */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-black/60 space-y-2">
              <span className="font-bold text-amber-400 block border-b border-zinc-800 pb-1 uppercase tracking-wider">
                Cotas de Gordura Saudável (~10g G)
              </span>
              <ul className="space-y-1 text-zinc-300 font-medium">
                <li>• Azeite de Oliva Extra Virgem: <strong className="text-white">10ml (1 colher de sopa)</strong></li>
                <li>• Pasta de Amendoim Integral: <strong className="text-white">20g</strong></li>
                <li>• Castanha-do-Pará: <strong className="text-white">15g (3 unidades)</strong></li>
                <li>• Abacate Fresco: <strong className="text-white">70g</strong></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
