"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Database,
  Filter,
  Utensils,
  CheckCircle2,
  X,
} from "lucide-react";

interface Food {
  id: string;
  name: string;
  category: string;
  source: string;
  baseQuantity: number;
  calories: number;
  protein: number;
  carbohydrate: number;
  lipid: number;
  fiber: number;
  sodium: number;
}

const initialFoodDatabase: Food[] = [
  { id: "1", name: "Whey Protein Isolado", category: "Suplementos", source: "Rótulos", baseQuantity: 100, calories: 366.7, protein: 90.0, carbohydrate: 2.0, lipid: 1.0, fiber: 0.0, sodium: 200.0 },
  { id: "2", name: "Albumina Naturovos", category: "Suplementos", source: "Rótulos", baseQuantity: 100, calories: 362.0, protein: 84.0, carbohydrate: 4.0, lipid: 0.0, fiber: 0.0, sodium: 1000.0 },
  { id: "3", name: "Soy Protein (Isolada)", category: "Suplementos", source: "Rótulos", baseQuantity: 100, calories: 356.7, protein: 86.7, carbohydrate: 0.0, lipid: 0.7, fiber: 0.0, sodium: 800.0 },
  { id: "4", name: "Peito de Frango (Grelhado)", category: "Carnes e Aves", source: "TACO", baseQuantity: 100, calories: 165.0, protein: 32.0, carbohydrate: 0.0, lipid: 2.67, fiber: 0.0, sodium: 52.0 },
  { id: "5", name: "Arroz Branco (Cozido)", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 138.0, protein: 2.33, carbohydrate: 29.0, lipid: 1.67, fiber: 0.33, sodium: 189.0 },
  { id: "6", name: "Feijão Carioca (Cozido)", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 79.0, protein: 4.67, carbohydrate: 14.67, lipid: 1.67, fiber: 7.0, sodium: 190.0 },
  { id: "7", name: "Banana Nanica", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 91.0, protein: 1.33, carbohydrate: 21.67, lipid: 0.33, fiber: 1.67, sodium: 0.0 },
  { id: "8", name: "Aveia (Flocos)", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 379.0, protein: 15.67, carbohydrate: 64.67, lipid: 8.67, fiber: 9.67, sodium: 4.67 },
  { id: "9", name: "Iogurte Natural Desnatado", category: "Laticínios", source: "TACO", baseQuantity: 100, calories: 48.0, protein: 4.0, carbohydrate: 7.0, lipid: 0.33, fiber: 0.0, sodium: 69.0 },
  { id: "10", name: "Leite em Pó Integral", category: "Laticínios", source: "TACO", baseQuantity: 100, calories: 496.7, protein: 26.0, carbohydrate: 38.0, lipid: 27.0, fiber: 0.0, sodium: 370.0 },
  { id: "11", name: "Ovo de Galinha (Cozido)", category: "Ovos", source: "TACO", baseQuantity: 100, calories: 155.0, protein: 13.0, carbohydrate: 0.65, lipid: 10.0, fiber: 0.0, sodium: 124.0 },
  { id: "12", name: "Tomate Cru", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 18.0, protein: 1.0, carbohydrate: 4.0, lipid: 0.34, fiber: 1.2, sodium: 5.0 },
  { id: "13", name: "Azeite de Oliva", category: "Óleos e Gorduras", source: "TACO", baseQuantity: 100, calories: 884.0, protein: 0.0, carbohydrate: 0.0, lipid: 100.0, fiber: 0.0, sodium: 0.0 },
  { id: "14", name: "Pão Francês", category: "Pães", source: "TACO", baseQuantity: 100, calories: 300.0, protein: 8.33, carbohydrate: 58.67, lipid: 3.0, fiber: 2.33, sodium: 648.0 },
  { id: "15", name: "Tilápia (Filé Cozido)", category: "Peixes e Frutos do Mar", source: "TACO", baseQuantity: 100, calories: 112.0, protein: 23.0, carbohydrate: 0.0, lipid: 2.0, fiber: 0.0, sodium: 77.0 },
  { id: "16", name: "Salmão (Grelhado)", category: "Peixes e Frutos do Mar", source: "TACO", baseQuantity: 100, calories: 216.7, protein: 25.33, carbohydrate: 0.0, lipid: 12.67, fiber: 0.0, sodium: 72.3 },
];

export default function FoodsPage() {
  const [foods, setFoods] = useState<Food[]>(initialFoodDatabase);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [sourceFilter, setSourceFilter] = useState("Todas");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newFood, setNewFood] = useState({
    name: "",
    category: "Suplementos",
    source: "Rótulos",
    baseQuantity: 100,
    calories: 0,
    protein: 0,
    carbohydrate: 0,
    lipid: 0,
    fiber: 0,
    sodium: 0,
  });

  const categories = ["Todas", ...Array.from(new Set(foods.map((f) => f.category)))];
  const sources = ["Todas", ...Array.from(new Set(foods.map((f) => f.source)))];

  const filteredFoods = foods.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "Todas" || food.category === categoryFilter;
    const matchesSource = sourceFilter === "Todas" || food.source === sourceFilter;
    return matchesSearch && matchesCategory && matchesSource;
  });

  const handleCreateFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFood.name) return;

    const created: Food = {
      id: Date.now().toString(),
      ...newFood,
    };

    setFoods([created, ...foods]);
    setIsModalOpen(false);
    setNewFood({
      name: "",
      category: "Suplementos",
      source: "Rótulos",
      baseQuantity: 100,
      calories: 0,
      protein: 0,
      carbohydrate: 0,
      lipid: 0,
      fiber: 0,
      sodium: 0,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-6">
        <div>
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Database className="w-4 h-4 text-red-500" /> Base de Alimentos Central
          </div>
          <h1 className="text-2xl font-bold text-white">
            Catálogo Nutricional (TACO / TBCA / Rótulos)
          </h1>
          <p className="text-sm font-medium text-gray-300 mt-1">
            Tabela de referência com composição em base padronizada de 100g ou 100ml.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-[0_0_12px_rgba(220,38,38,0.4)] flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Cadastrar Alimento / Rótulo
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl p-4">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome do alimento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-black/70 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 font-medium"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-2 px-3 bg-black/70 border border-zinc-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-red-500 font-medium"
          >
            {categories.map((cat, i) => (
              <option key={i} value={cat}>
                Categoria: {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full py-2 px-3 bg-black/70 border border-zinc-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-red-500 font-medium"
          >
            {sources.map((src, i) => (
              <option key={i} value={src}>
                Fonte: {src}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Foods Table */}
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/90 text-white font-bold uppercase tracking-wider text-xs border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4">Alimento</th>
                <th className="py-3.5 px-3">Categoria</th>
                <th className="py-3.5 px-3">Fonte</th>
                <th className="py-3.5 px-3 text-right">Porção Base</th>
                <th className="py-3.5 px-3 text-right text-red-400">Energia (kcal)</th>
                <th className="py-3.5 px-3 text-right">Proteína (g)</th>
                <th className="py-3.5 px-3 text-right">Carbo (g)</th>
                <th className="py-3.5 px-3 text-right">Lipídios (g)</th>
                <th className="py-3.5 px-3 text-right">Fibra (g)</th>
                <th className="py-3.5 px-3 text-right">Sódio (mg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {filteredFoods.map((food) => (
                <tr key={food.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">{food.name}</td>
                  <td className="py-3.5 px-3 text-gray-300">{food.category}</td>
                  <td className="py-3.5 px-3">
                    <span className="bg-zinc-800 text-gray-200 text-xs font-semibold px-2 py-0.5 rounded border border-zinc-700">
                      {food.source}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right text-gray-400">{food.baseQuantity}g/ml</td>
                  <td className="py-3.5 px-3 text-right font-bold text-red-400">{food.calories}</td>
                  <td className="py-3.5 px-3 text-right text-gray-200">{food.protein}</td>
                  <td className="py-3.5 px-3 text-right text-gray-200">{food.carbohydrate}</td>
                  <td className="py-3.5 px-3 text-right text-gray-200">{food.lipid}</td>
                  <td className="py-3.5 px-3 text-right text-gray-400">{food.fiber}</td>
                  <td className="py-3.5 px-3 text-right text-gray-400">{food.sodium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Creating Food Item */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 max-w-lg w-full p-6 shadow-2xl space-y-4 rounded-xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Utensils className="w-5 h-5 text-red-500" /> Novo Alimento / Rótulo
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFood} className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Nome do Alimento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Whey Gold Standard 100%"
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  className="w-full p-2.5 bg-black/70 border border-zinc-800 rounded-lg text-white font-medium focus:border-red-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Categoria</label>
                  <input
                    type="text"
                    required
                    value={newFood.category}
                    onChange={(e) => setNewFood({ ...newFood, category: e.target.value })}
                    className="w-full p-2 bg-black/70 border border-zinc-800 rounded-lg text-white font-medium focus:border-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1">Fonte</label>
                  <select
                    value={newFood.source}
                    onChange={(e) => setNewFood({ ...newFood, source: e.target.value })}
                    className="w-full p-2 bg-black/70 border border-zinc-800 rounded-lg text-white font-medium focus:border-red-500 outline-none"
                  >
                    <option value="Rótulo Comercial">Rótulo Comercial</option>
                    <option value="TACO">TACO</option>
                    <option value="TBCA">TBCA</option>
                    <option value="USDA">USDA</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-black/60 rounded-xl border border-zinc-800 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Porção (g/ml)</label>
                  <input
                    type="number"
                    value={newFood.baseQuantity}
                    onChange={(e) => setNewFood({ ...newFood, baseQuantity: Number(e.target.value) })}
                    className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-red-400 font-bold mb-1">Energia (Kcal)</label>
                  <input
                    type="number"
                    value={newFood.calories}
                    onChange={(e) => setNewFood({ ...newFood, calories: Number(e.target.value) })}
                    className="w-full p-2 bg-zinc-950 border border-red-900/60 rounded-lg text-red-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Proteína (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newFood.protein}
                    onChange={(e) => setNewFood({ ...newFood, protein: Number(e.target.value) })}
                    className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Carbo (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newFood.carbohydrate}
                    onChange={(e) => setNewFood({ ...newFood, carbohydrate: Number(e.target.value) })}
                    className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Lipídios (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newFood.lipid}
                    onChange={(e) => setNewFood({ ...newFood, lipid: Number(e.target.value) })}
                    className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Fibra (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newFood.fiber}
                    onChange={(e) => setNewFood({ ...newFood, fiber: Number(e.target.value) })}
                    className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2 rounded-xl shadow-[0_0_12px_rgba(220,38,38,0.4)]"
                >
                  Salvar Alimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
