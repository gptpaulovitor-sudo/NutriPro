"use client";

import React, { useState, useMemo } from "react";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRightLeft,
  Flame,
  Search,
  Sparkles,
  Info,
} from "lucide-react";
import { calculateMacroPortion, BaseFoodItem } from "@/utils/nutritionMath";

interface MealItem {
  id: string;
  mealName: string;
  mealTime: string;
  foodName: string;
  quantity: number;
  calories: number;
  protein: number;
  carbohydrate: number;
  lipid: number;
  fiber: number;
  sodium: number;
}

const foodDatabase: BaseFoodItem[] = [
  { id: "1", name: "Whey Protein Isolado", category: "Suplementos", baseQuantity: 100, calories: 366.7, protein: 90.0, carbohydrate: 2.0, lipid: 1.0, fiber: 0.0, sodium: 200.0 },
  { id: "2", name: "Albumina Naturovos", category: "Suplementos", baseQuantity: 100, calories: 362.0, protein: 84.0, carbohydrate: 4.0, lipid: 0.0, fiber: 0.0, sodium: 1000.0 },
  { id: "3", name: "Peito de Frango (Grelhado)", category: "Carnes e Aves", baseQuantity: 100, calories: 165.0, protein: 32.0, carbohydrate: 0.0, lipid: 2.67, fiber: 0.0, sodium: 52.0 },
  { id: "4", name: "Arroz Branco (Cozido)", category: "Cereais", baseQuantity: 100, calories: 138.0, protein: 2.33, carbohydrate: 29.0, lipid: 1.67, fiber: 0.33, sodium: 189.0 },
  { id: "5", name: "Feijão Carioca (Cozido)", category: "Leguminosas", baseQuantity: 100, calories: 79.0, protein: 4.67, carbohydrate: 14.67, lipid: 1.67, fiber: 7.0, sodium: 190.0 },
  { id: "6", name: "Banana Nanica", category: "Frutas", baseQuantity: 100, calories: 91.0, protein: 1.33, carbohydrate: 21.67, lipid: 0.33, fiber: 1.67, sodium: 0.0 },
  { id: "7", name: "Aveia (Flocos)", category: "Cereais", baseQuantity: 100, calories: 379.0, protein: 15.67, carbohydrate: 64.67, lipid: 8.67, fiber: 9.67, sodium: 4.67 },
  { id: "8", name: "Iogurte Natural Desnatado", category: "Laticínios", baseQuantity: 100, calories: 48.0, protein: 4.0, carbohydrate: 7.0, lipid: 0.33, fiber: 0.0, sodium: 69.0 },
  { id: "9", name: "Leite em Pó Integral", category: "Laticínios", baseQuantity: 100, calories: 496.7, protein: 26.0, carbohydrate: 38.0, lipid: 27.0, fiber: 0.0, sodium: 370.0 },
  { id: "10", name: "Ovo de Galinha (Cozido)", category: "Ovos", baseQuantity: 100, calories: 155.0, protein: 13.0, carbohydrate: 0.65, lipid: 10.0, fiber: 0.0, sodium: 124.0 },
  { id: "11", name: "Tomate Cru", category: "Vegetais", baseQuantity: 100, calories: 18.0, protein: 1.0, carbohydrate: 4.0, lipid: 0.34, fiber: 1.2, sodium: 5.0 },
  { id: "12", name: "Azeite de Oliva", category: "Óleos", baseQuantity: 100, calories: 884.0, protein: 0.0, carbohydrate: 0.0, lipid: 100.0, fiber: 0.0, sodium: 0.0 },
];

const defaultMeals: MealItem[] = [
  { id: "m1", mealName: "Café da manhã", mealTime: "07:00", foodName: "Café (sem açúcar)", quantity: 100, calories: 2, protein: 0.33, carbohydrate: 0, lipid: 0, fiber: 0, sodium: 3.3 },
  { id: "m2", mealName: "Café da manhã", mealTime: "07:00", foodName: "Leite em Pó Integral", quantity: 30, calories: 149, protein: 7.8, carbohydrate: 11.4, lipid: 8.1, fiber: 0, sodium: 111 },
  { id: "m3", mealName: "Lanche manhã", mealTime: "10:00", foodName: "Albumina Naturovos", quantity: 30, calories: 108.6, protein: 25.2, carbohydrate: 1.2, lipid: 0, fiber: 0, sodium: 300 },
  { id: "m4", mealName: "Almoço", mealTime: "12:30", foodName: "Feijão Carioca (Cozido)", quantity: 80, calories: 63.2, protein: 3.73, carbohydrate: 11.73, lipid: 1.33, fiber: 5.6, sodium: 152 },
  { id: "m5", mealName: "Almoço", mealTime: "12:30", foodName: "Peito de Frango (Grelhado)", quantity: 200, calories: 330, protein: 64.0, carbohydrate: 0, lipid: 5.33, fiber: 0, sodium: 104 },
  { id: "m6", mealName: "Almoço", mealTime: "12:30", foodName: "Arroz Branco (Cozido)", quantity: 200, calories: 276, protein: 4.67, carbohydrate: 58.0, lipid: 3.33, fiber: 0.67, sodium: 378 },
  { id: "m7", mealName: "Pré-treino", mealTime: "16:30", foodName: "Banana Nanica", quantity: 100, calories: 91, protein: 1.33, carbohydrate: 21.67, lipid: 0.33, fiber: 1.67, sodium: 0 },
  { id: "m8", mealName: "Pré-treino", mealTime: "16:30", foodName: "Aveia (Flocos)", quantity: 30, calories: 113.7, protein: 4.7, carbohydrate: 19.4, lipid: 2.6, fiber: 2.9, sodium: 1.4 },
  { id: "m9", mealName: "Pré-treino", mealTime: "16:30", foodName: "Iogurte Natural Desnatado", quantity: 180, calories: 86.4, protein: 7.2, carbohydrate: 12.6, lipid: 0.6, fiber: 0, sodium: 124.2 },
  { id: "m10", mealName: "Pré-treino", mealTime: "16:30", foodName: "Leite em Pó Integral", quantity: 30, calories: 149, protein: 7.8, carbohydrate: 11.4, lipid: 8.1, fiber: 0, sodium: 111 },
  { id: "m11", mealName: "Pós-treino", mealTime: "18:30", foodName: "Albumina Naturovos", quantity: 30, calories: 108.6, protein: 25.2, carbohydrate: 1.2, lipid: 0, fiber: 0, sodium: 300 },
  { id: "m12", mealName: "Jantar", mealTime: "20:00", foodName: "Peito de Frango (Grelhado)", quantity: 100, calories: 165, protein: 32.0, carbohydrate: 0, lipid: 2.67, fiber: 0, sodium: 52 },
  { id: "m13", mealName: "Jantar", mealTime: "20:00", foodName: "Tomate Cru", quantity: 50, calories: 9, protein: 0.5, carbohydrate: 2.0, lipid: 0.17, fiber: 0.6, sodium: 2.5 },
  { id: "m14", mealName: "Jantar", mealTime: "20:00", foodName: "Arroz Branco (Cozido)", quantity: 150, calories: 207, protein: 3.5, carbohydrate: 43.5, lipid: 2.5, fiber: 0.5, sodium: 283.5 },
  { id: "m15", mealName: "Jantar", mealTime: "20:00", foodName: "Ovo de Galinha (Cozido)", quantity: 20, calories: 31, protein: 2.6, carbohydrate: 0.13, lipid: 2.0, fiber: 0, sodium: 24.8 },
];

export default function PrescriptionPage() {
  const [items, setItems] = useState<MealItem[]>(defaultMeals);
  const [selectedMeal, setSelectedMeal] = useState("Café da manhã");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFood, setSelectedFood] = useState<BaseFoodItem | null>(null);
  const [quantityInput, setQuantityInput] = useState(100);
  const [showSubstitutions, setShowSubstitutions] = useState(false);

  const targets = { kcal: 3739, protein: 186, carb: 302, lipid: 104, fiber: 52 };

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        kcal: acc.kcal + item.calories,
        protein: acc.protein + item.protein,
        carb: acc.carb + item.carbohydrate,
        lipid: acc.lipid + item.lipid,
        fiber: acc.fiber + item.fiber,
      }),
      { kcal: 0, protein: 0, carb: 0, lipid: 0, fiber: 0 }
    );
  }, [items]);

  const filteredDatabase = foodDatabase.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = () => {
    if (!selectedFood || quantityInput <= 0) return;

    const scaled = calculateMacroPortion(selectedFood, quantityInput);
    const newItem: MealItem = {
      id: Date.now().toString(),
      mealName: selectedMeal,
      mealTime: "12:00",
      foodName: selectedFood.name,
      quantity: quantityInput,
      calories: scaled.calories,
      protein: scaled.protein,
      carbohydrate: scaled.carbohydrate,
      lipid: scaled.lipid,
      fiber: scaled.fiber,
      sodium: scaled.sodium,
    };

    setItems([...items, newItem]);
    setSelectedFood(null);
    setSearchTerm("");
    setQuantityInput(100);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const mealGroups = ["Café da manhã", "Lanche manhã", "Almoço", "Pré-treino", "Pós-treino", "Jantar"];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
            <UtensilsCrossed className="w-4 h-4 text-red-500" /> Prescrição Nutricional Modular
          </div>
          <h1 className="text-2xl font-bold text-white">
            Plano Alimentar & Prescrição de Macronutrientes
          </h1>
          <p className="text-sm font-medium text-gray-300 mt-1">
            Construção de dieta com busca rápida na base TACO/Rótulos e mapeamento de substituições equivalentes.
          </p>
        </div>

        <button
          onClick={() => setShowSubstitutions(!showSubstitutions)}
          className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-zinc-700 shadow-md flex items-center gap-2 transition-all shrink-0"
        >
          <ArrowRightLeft className="w-4 h-4 text-red-400" />
          {showSubstitutions ? "Ocultar Substituições" : "Ver Banco de Substituições"}
        </button>
      </div>

      {/* Target Macros vs Prescribed Totals */}
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h2 className="font-bold text-base text-red-400 flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" /> Balanço de Macronutrientes (Prescrito vs Alvo)
          </h2>
          <span className="text-xs font-mono font-bold text-gray-400">Meta: {targets.kcal} kcal/dia</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-black/60 p-4 rounded-xl border border-zinc-800">
            <span className="text-xs font-medium text-gray-400 block">Energia Total</span>
            <p className="text-xl font-bold text-red-400 mt-0.5">
              {Math.round(totals.kcal)} <span className="text-xs font-normal text-gray-400">/ {targets.kcal} kcal</span>
            </p>
            <div className="w-full bg-zinc-950 h-2 rounded-full mt-2 overflow-hidden border border-zinc-800">
              <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min(100, (totals.kcal / targets.kcal) * 100)}%` }} />
            </div>
          </div>

          <div className="bg-black/60 p-4 rounded-xl border border-zinc-800">
            <span className="text-xs font-medium text-gray-400 block">Proteína</span>
            <p className="text-xl font-bold text-white mt-0.5">
              {Math.round(totals.protein)}g <span className="text-xs font-normal text-gray-400">/ {targets.protein}g</span>
            </p>
            <div className="w-full bg-zinc-950 h-2 rounded-full mt-2 overflow-hidden border border-zinc-800">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.min(100, (totals.protein / targets.protein) * 100)}%` }} />
            </div>
          </div>

          <div className="bg-black/60 p-4 rounded-xl border border-zinc-800">
            <span className="text-xs font-medium text-gray-400 block">Carboidrato</span>
            <p className="text-xl font-bold text-white mt-0.5">
              {Math.round(totals.carb)}g <span className="text-xs font-normal text-gray-400">/ {targets.carb}g</span>
            </p>
            <div className="w-full bg-zinc-950 h-2 rounded-full mt-2 overflow-hidden border border-zinc-800">
              <div className="bg-blue-400 h-full rounded-full" style={{ width: `${Math.min(100, (totals.carb / targets.carb) * 100)}%` }} />
            </div>
          </div>

          <div className="bg-black/60 p-4 rounded-xl border border-zinc-800">
            <span className="text-xs font-medium text-gray-400 block">Lipídios</span>
            <p className="text-xl font-bold text-white mt-0.5">
              {Math.round(totals.lipid)}g <span className="text-xs font-normal text-gray-400">/ {targets.lipid}g</span>
            </p>
            <div className="w-full bg-zinc-950 h-2 rounded-full mt-2 overflow-hidden border border-zinc-800">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${Math.min(100, (totals.lipid / targets.lipid) * 100)}%` }} />
            </div>
          </div>

          <div className="bg-black/60 p-4 rounded-xl border border-zinc-800 col-span-2 md:col-span-1">
            <span className="text-xs font-medium text-gray-400 block">Fibra</span>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">
              {Math.round(totals.fiber)}g <span className="text-xs font-normal text-gray-400">/ {targets.fiber}g</span>
            </p>
            <div className="w-full bg-zinc-950 h-2 rounded-full mt-2 overflow-hidden border border-zinc-800">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (totals.fiber / targets.fiber) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Food Search & Autocomplete Builder */}
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-5 space-y-4">
        <h2 className="font-bold text-white text-sm flex items-center gap-2">
          <Plus className="w-4 h-4 text-red-500" /> Adicionar Alimento à Prescrição
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <div>
            <label className="block text-gray-300 font-semibold mb-1">Refeição Alvo</label>
            <select
              value={selectedMeal}
              onChange={(e) => setSelectedMeal(e.target.value)}
              className="w-full p-2.5 bg-black/70 border border-zinc-800 rounded-lg text-white font-medium focus:border-red-500 outline-none"
            >
              {mealGroups.map((m, i) => (
                <option key={i} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 relative">
            <label className="block text-gray-300 font-semibold mb-1">Buscar na Base TACO</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Digite o alimento (ex: Peito de Frango, Arroz, Whey)..."
                value={selectedFood ? selectedFood.name : searchTerm}
                onChange={(e) => {
                  setSelectedFood(null);
                  setSearchTerm(e.target.value);
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-black/70 border border-zinc-800 rounded-lg text-white font-medium focus:border-red-500 outline-none"
              />
            </div>

            {/* Dropdown Results */}
            {searchTerm && !selectedFood && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto z-20">
                {filteredDatabase.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => {
                      setSelectedFood(food);
                      setSearchTerm(food.name);
                    }}
                    className="w-full text-left p-3 hover:bg-red-950/40 border-b border-zinc-800 flex justify-between items-center text-sm"
                  >
                    <span className="font-bold text-white">{food.name}</span>
                    <span className="text-xs font-mono text-gray-400">
                      {food.calories} kcal | P:{food.protein}g C:{food.carbohydrate}g
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1">Quantidade (g ou ml)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={quantityInput}
                onChange={(e) => setQuantityInput(Number(e.target.value))}
                className="w-full p-2.5 bg-black/70 border border-zinc-800 rounded-lg text-white font-bold focus:border-red-500 outline-none"
              />
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedFood}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-4 rounded-lg shadow-[0_0_12px_rgba(220,38,38,0.4)] transition-all"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Meals Table Breakdown */}
      <div className="space-y-4">
        {mealGroups.map((mealGroup) => {
          const mealItems = items.filter((i) => i.mealName === mealGroup);
          if (mealItems.length === 0) return null;

          const mealKcal = mealItems.reduce((acc, i) => acc + i.calories, 0);

          return (
            <div key={mealGroup} className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden">
              <div className="bg-black/60 p-4 flex justify-between items-center border-b border-zinc-800">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                  {mealGroup} ({mealItems[0]?.mealTime || "08:00"})
                </h3>
                <span className="text-xs font-mono font-bold text-red-400 bg-red-950/80 px-3 py-1 rounded-full border border-red-800/60">
                  {Math.round(mealKcal)} kcal
                </span>
              </div>

              <div className="divide-y divide-zinc-800/60">
                {mealItems.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 text-sm">
                    <div>
                      <span className="font-bold text-white block">{item.foodName}</span>
                      <span className="text-xs font-medium text-gray-300 mt-0.5 block">
                        {item.quantity}g/ml • {Math.round(item.calories)} kcal • P: {item.protein}g | C: {item.carbohydrate}g | G: {item.lipid}g
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-950/40 transition-colors"
                      title="Remover Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Food Substitutions Panel */}
      {showSubstitutions && (
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-red-500" />
              Banco de Substituições Equivalentes em Macronutrientes
            </h2>
            <span className="text-xs font-mono font-bold text-gray-400">Flexibilidade Prescritiva</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl border border-zinc-800 bg-black/60 space-y-2">
              <span className="font-bold text-emerald-400 block border-b border-zinc-800 pb-1">
                Porção de Proteína Magra (Equivalente a 20g Proteína)
              </span>
              <ul className="space-y-1.5 text-gray-300 font-medium text-xs">
                <li>• Peito de Frango Grelhado: <strong className="text-white">100g</strong></li>
                <li>• Patinho Bovino Grelhado: <strong className="text-white">100g</strong></li>
                <li>• Filé de Tilápia Cozido: <strong className="text-white">110g</strong></li>
                <li>• Albumina Naturovos: <strong className="text-white">25g</strong></li>
                <li>• Whey Protein Isolado: <strong className="text-white">22g</strong></li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-black/60 space-y-2">
              <span className="font-bold text-amber-400 block border-b border-zinc-800 pb-1">
                Porção de Carboidrato Complexo (Equivalente a 30g Carbo)
              </span>
              <ul className="space-y-1.5 text-gray-300 font-medium text-xs">
                <li>• Arroz Branco Cozido: <strong className="text-white">105g</strong></li>
                <li>• Arroz Integral Cozido: <strong className="text-white">120g</strong></li>
                <li>• Batata Doce Assada: <strong className="text-white">125g</strong></li>
                <li>• Aveia em Flocos: <strong className="text-white">45g</strong></li>
                <li>• Banana Nanica: <strong className="text-white">140g</strong></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
