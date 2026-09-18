/**
 * utils/dietGenerator.ts
 * 
 * Motor Determinístico de Prescrição Nutricional — NutriAx Pro.
 * Implementa as "Regras de Ouro" Culinárias e de Nutrição Esportiva:
 * 
 * 1. ÂNCORA PROTEICA OBRIGATÓRIA (MPS em TODA refeição):
 *    - Nenhuma refeição é montada sem antes atingir no mínimo 20g a 25g de proteína de alto valor biológico.
 *    - Priorização de Albumina, Whey Protein e Iogurte Natural para lanches, pré-treino e ceia.
 * 2. HARMONIZAÇÃO DE CARBOIDRATOS (Grupos Incompatíveis):
 *    - Separação rígida entre "Cereais/Pães", "Raízes", "Frutas" e "Leguminosas".
 *    - NUNCA mistura Cereais/Pães com Raízes no mesmo prato (ex: PROIBIDO Aveia + Batata Doce; PROIBIDO Pão + Mandioca).
 *    - Ovos pareiam com Pão OU com Raízes. Whey/Albumina/Iogurte pareiam com Aveia e Frutas.
 * 3. HARD CAP NO ESCALONAMENTO:
 *    - Azeite e Manteiga: teto absoluto de 15g por refeição (travamento no escalonamento).
 *    - Pão integral: teto de 100g (2-3 fatias). O excedente de carboidrato é suprido por frutas compatíveis.
 *    - Aveia: teto de 60g por porção.
 */

import {
  BiometriaPaciente,
  ObjetivoClinico,
  NivelAtividade,
  RestricoesAlimentares,
  CalculoEnergetico,
  Alimento,
  PlanoAlimentar,
  Refeicao,
  ItemRefeicao,
  TotaisNutricionais,
  ContextoRefeicao,
} from './nutritionTypes';

// ============================================================================
// 1. CATÁLOGO BASE DE ALIMENTOS COM SUBGRUPOS E TETOS CULINÁRIOS
// ============================================================================

export const CATALOGO_ALIMENTOS_BASE: Alimento[] = [
  // ── PROTEÍNAS ANIMAIS & OVOS ──────────────────────────────────────────────
  {
    id: 'p_frango',
    nome: 'Peito de Frango Grelhado',
    categoria: 'Carnes e Aves',
    baseQuantidade: 100,
    calorias: 165,
    proteina: 32.0,
    carboidrato: 0,
    gordura: 2.7,
    fibra: 0,
    sodio: 52,
    contextos: ['almoco', 'jantar'],
    perfilSabor: 'salgado',
    tipoGordura: 'intrinseca',
    porcaoMinimaG: 80,
    porcaoMaximaG: 220,
    tags: ['sem-lactose', 'sem-gluten', 'proteina-magra'],
  },
  {
    id: 'p_sobrecoxa',
    nome: 'Sobrecoxa de Frango sem Pele Grelhada',
    categoria: 'Carnes e Aves',
    baseQuantidade: 100,
    calorias: 215,
    proteina: 27.0,
    carboidrato: 0,
    gordura: 11.5,
    fibra: 0,
    sodio: 75,
    contextos: ['almoco', 'jantar'],
    perfilSabor: 'salgado',
    tipoGordura: 'intrinseca',
    porcaoMinimaG: 80,
    porcaoMaximaG: 200,
    tags: ['sem-lactose', 'sem-gluten', 'low-carb', 'keto'],
  },
  {
    id: 'p_patinho',
    nome: 'Patinho Bovino Moído Grelhado',
    categoria: 'Carnes e Aves',
    baseQuantidade: 100,
    calorias: 219,
    proteina: 35.9,
    carboidrato: 0,
    gordura: 7.3,
    fibra: 0,
    sodio: 60,
    contextos: ['almoco', 'jantar'],
    perfilSabor: 'salgado',
    tipoGordura: 'intrinseca',
    porcaoMinimaG: 80,
    porcaoMaximaG: 200,
    tags: ['sem-lactose', 'sem-gluten', 'carne-vermelha'],
  },
  {
    id: 'p_contrafile',
    nome: 'Contrafilé Bovino Grelhado',
    categoria: 'Carnes e Aves',
    baseQuantidade: 100,
    calorias: 250,
    proteina: 31.0,
    carboidrato: 0,
    gordura: 13.5,
    fibra: 0,
    sodio: 58,
    contextos: ['almoco', 'jantar'],
    perfilSabor: 'salgado',
    tipoGordura: 'intrinseca',
    porcaoMinimaG: 80,
    porcaoMaximaG: 190,
    tags: ['sem-lactose', 'sem-gluten', 'carne-vermelha', 'low-carb', 'keto'],
  },
  {
    id: 'p_tilapia',
    nome: 'Filé de Tilápia Grelhada',
    categoria: 'Peixes e Frutos do Mar',
    baseQuantidade: 100,
    calorias: 128,
    proteina: 26.0,
    carboidrato: 0,
    gordura: 2.7,
    fibra: 0,
    sodio: 56,
    contextos: ['almoco', 'jantar'],
    perfilSabor: 'salgado',
    tipoGordura: 'intrinseca',
    porcaoMinimaG: 100,
    porcaoMaximaG: 250,
    tags: ['peixe', 'sem-lactose', 'sem-gluten', 'proteina-magra'],
  },
  {
    id: 'p_salmao',
    nome: 'Filé de Salmão Grelhado',
    categoria: 'Peixes e Frutos do Mar',
    baseQuantidade: 100,
    calorias: 206,
    proteina: 22.0,
    carboidrato: 0,
    gordura: 12.3,
    fibra: 0,
    sodio: 60,
    contextos: ['almoco', 'jantar'],
    perfilSabor: 'salgado',
    tipoGordura: 'intrinseca',
    porcaoMinimaG: 80,
    porcaoMaximaG: 180,
    tags: ['peixe', 'sem-lactose', 'sem-gluten', 'omega-3', 'low-carb', 'keto'],
  },
  {
    id: 'p_ovo_inteiro',
    nome: 'Ovos Inteiros Cozidos/Mexidos',
    categoria: 'Ovos',
    baseQuantidade: 100,
    calorias: 155,
    proteina: 13.0,
    carboidrato: 0.7,
    gordura: 10.0,
    fibra: 0,
    sodio: 124,
    contextos: ['cafe', 'lanche', 'ceia', 'almoco', 'jantar'],
    perfilSabor: 'salgado',
    tipoGordura: 'intrinseca',
    porcaoMinimaG: 50,  // ~1 ovo
    porcaoMaximaG: 180, // ~3-4 ovos
    tags: ['ovo', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },
  {
    id: 'p_clara',
    nome: 'Claras de Ovo Pasteurizadas / Cozidas',
    categoria: 'Ovos',
    baseQuantidade: 100,
    calorias: 52,
    proteina: 11.0,
    carboidrato: 0.7,
    gordura: 0.2,
    fibra: 0,
    sodio: 166,
    contextos: ['cafe', 'lanche', 'ceia'],
    perfilSabor: 'neutro',
    tipoGordura: 'intrinseca',
    porcaoMinimaG: 60,
    porcaoMaximaG: 180,
    tags: ['ovo', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },

  // ── SUPLEMENTOS E LATICÍNIOS PROTEICOS (Para Lanches, Pré-treino e Ceia) ──
  {
    id: 'p_whey',
    nome: 'Whey Protein Isolado',
    categoria: 'Suplementos',
    baseQuantidade: 100,
    calorias: 370,
    proteina: 90.0,
    carboidrato: 2.0,
    gordura: 1.0,
    fibra: 0,
    sodio: 180,
    contextos: ['cafe', 'lanche', 'ceia'],
    perfilSabor: 'doce',
    tipoGordura: 'intrinseca',
    porcaoMinimaG: 25,
    porcaoMaximaG: 40,
    tags: ['vegetariano', 'sem-gluten', 'suplemento', 'mps-ouro'],
  },
  {
    id: 'p_albumina',
    nome: 'Albumina Naturovos',
    categoria: 'Suplementos',
    baseQuantidade: 100,
    calorias: 362,
    proteina: 84.0,
    carboidrato: 4.0,
    gordura: 0,
    fibra: 0,
    sodio: 1000,
    contextos: ['cafe', 'lanche', 'ceia'],
    perfilSabor: 'neutro',
    tipoGordura: 'intrinseca',
    porcaoMinimaG: 25,
    porcaoMaximaG: 40,
    tags: ['ovo', 'suplemento', 'sem-lactose', 'sem-gluten', 'mps-ouro'],
  },
  {
    id: 'l_iogurte',
    nome: 'Iogurte Natural Desnatado',
    categoria: 'Laticínios',
    baseQuantidade: 100,
    calorias: 43,
    proteina: 4.5,
    carboidrato: 5.8,
    gordura: 0.3,
    fibra: 0,
    sodio: 65,
    contextos: ['cafe', 'lanche', 'ceia'],
    perfilSabor: 'neutro',
    tipoGordura: 'intrinseca',
    porcaoMinimaG: 120,
    porcaoMaximaG: 200,
    tags: ['laticinio', 'vegetariano', 'contem-lactose', 'sem-gluten'],
  },
  {
    id: 'l_queijo_minas',
    nome: 'Queijo Minas Meia Cura / Padrão',
    categoria: 'Laticínios',
    baseQuantidade: 100,
    calorias: 360,
    proteina: 23.0,
    carboidrato: 1.5,
    gordura: 29.0,
    fibra: 0,
    sodio: 450,
    contextos: ['cafe', 'lanche', 'ceia'],
    perfilSabor: 'salgado',
    tipoGordura: 'intrinseca',
    porcaoMinimaG: 25,
    porcaoMaximaG: 50,
    tags: ['laticinio', 'vegetariano', 'contem-lactose', 'sem-gluten', 'low-carb', 'keto'],
  },
  {
    id: 'p_tofu',
    nome: 'Tofu Firme Grelhado',
    categoria: 'Proteínas',
    baseQuantidade: 100,
    calorias: 121,
    proteina: 12.0,
    carboidrato: 2.0,
    gordura: 6.8,
    fibra: 1.0,
    sodio: 15,
    contextos: ['cafe', 'almoco', 'jantar'],
    perfilSabor: 'neutro',
    tipoGordura: 'intrinseca',
    porcaoMinimaG: 80,
    porcaoMaximaG: 200,
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },

  // ── CARBOIDRATOS: SUBGRUPO CEREAIS & PÃES ────────────────────────────────
  {
    id: 'c_arroz_branco',
    nome: 'Arroz Branco Cozido',
    categoria: 'Cereais e Leguminosas',
    baseQuantidade: 100,
    calorias: 130,
    proteina: 2.5,
    carboidrato: 28.2,
    gordura: 0.3,
    fibra: 0.4,
    sodio: 1,
    contextos: ['almoco', 'jantar'],
    perfilSabor: 'salgado',
    subgrupoCarbo: 'cereais_paes',
    porcaoMinimaG: 60,
    porcaoMaximaG: 250,
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },
  {
    id: 'c_arroz_integral',
    nome: 'Arroz Integral Cozido',
    categoria: 'Cereais e Leguminosas',
    baseQuantidade: 100,
    calorias: 124,
    proteina: 2.6,
    carboidrato: 25.8,
    gordura: 1.0,
    fibra: 2.7,
    sodio: 1,
    contextos: ['almoco', 'jantar'],
    perfilSabor: 'salgado',
    subgrupoCarbo: 'cereais_paes',
    porcaoMinimaG: 60,
    porcaoMaximaG: 250,
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },
  {
    id: 'c_pao_integral',
    nome: 'Pão de Forma Integral',
    categoria: 'Carboidratos',
    baseQuantidade: 100,
    calorias: 247,
    proteina: 9.4,
    carboidrato: 49.9,
    gordura: 1.8,
    fibra: 6.9,
    sodio: 420,
    contextos: ['cafe', 'lanche'],
    perfilSabor: 'salgado',
    subgrupoCarbo: 'cereais_paes',
    porcaoMinimaG: 25,
    porcaoMaximaG: 100, // HARD CAP: Máximo de 100g (~2 a 3 fatias)
    tags: ['vegetariano', 'contem-gluten'],
  },
  {
    id: 'c_aveia',
    nome: 'Aveia em Flocos',
    categoria: 'Cereais e Leguminosas',
    baseQuantidade: 100,
    calorias: 394,
    proteina: 13.9,
    carboidrato: 66.6,
    gordura: 8.5,
    fibra: 9.1,
    sodio: 5,
    contextos: ['cafe', 'lanche', 'ceia'],
    perfilSabor: 'neutro',
    subgrupoCarbo: 'cereais_paes',
    porcaoMinimaG: 20,
    porcaoMaximaG: 60, // HARD CAP: Máximo 60g por refeição
    tags: ['vegano', 'vegetariano', 'sem-lactose'],
  },

  // ── CARBOIDRATOS: SUBGRUPO RAÍZES (Incompatível com Cereais/Pães) ─────────
  {
    id: 'c_batata_doce',
    nome: 'Batata Doce Cozida',
    categoria: 'Carboidratos',
    baseQuantidade: 100,
    calorias: 86,
    proteina: 1.6,
    carboidrato: 20.1,
    gordura: 0.1,
    fibra: 3.0,
    sodio: 15,
    contextos: ['almoco', 'lanche', 'jantar', 'cafe'],
    perfilSabor: 'neutro',
    subgrupoCarbo: 'raizes',
    porcaoMinimaG: 80,
    porcaoMaximaG: 220,
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },
  {
    id: 'c_mandioca',
    nome: 'Mandioca / Aipim Cozido',
    categoria: 'Carboidratos',
    baseQuantidade: 100,
    calorias: 125,
    proteina: 0.6,
    carboidrato: 30.1,
    gordura: 0.3,
    fibra: 1.6,
    sodio: 2,
    contextos: ['almoco', 'jantar'],
    perfilSabor: 'salgado',
    subgrupoCarbo: 'raizes',
    porcaoMinimaG: 80,
    porcaoMaximaG: 200,
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },

  // ── CARBOIDRATOS: SUBGRUPO LEGUMINOSAS ───────────────────────────────────
  {
    id: 'c_feijao',
    nome: 'Feijão Carioca Cozido',
    categoria: 'Leguminosas',
    baseQuantidade: 100,
    calorias: 76,
    proteina: 4.8,
    carboidrato: 13.6,
    gordura: 0.5,
    fibra: 6.4,
    sodio: 2,
    contextos: ['almoco', 'jantar'],
    perfilSabor: 'salgado',
    subgrupoCarbo: 'leguminosas',
    porcaoMinimaG: 60,
    porcaoMaximaG: 160,
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },

  // ── CARBOIDRATOS: SUBGRUPO FRUTAS ────────────────────────────────────────
  {
    id: 'f_banana',
    nome: 'Banana Prata',
    categoria: 'Frutas',
    baseQuantidade: 100,
    calorias: 89,
    proteina: 1.1,
    carboidrato: 23.0,
    gordura: 0.3,
    fibra: 2.6,
    sodio: 1,
    contextos: ['cafe', 'lanche'],
    perfilSabor: 'doce',
    subgrupoCarbo: 'frutas',
    porcaoMinimaG: 60,
    porcaoMaximaG: 130,
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },
  {
    id: 'f_maca',
    nome: 'Maçã Fuji com Casca',
    categoria: 'Frutas',
    baseQuantidade: 100,
    calorias: 56,
    proteina: 0.3,
    carboidrato: 15.2,
    gordura: 0.2,
    fibra: 2.0,
    sodio: 1,
    contextos: ['cafe', 'lanche', 'ceia'],
    perfilSabor: 'doce',
    subgrupoCarbo: 'frutas',
    porcaoMinimaG: 80,
    porcaoMaximaG: 150,
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },
  {
    id: 'f_morango',
    nome: 'Morango Fresco',
    categoria: 'Frutas',
    baseQuantidade: 100,
    calorias: 30,
    proteina: 0.7,
    carboidrato: 6.8,
    gordura: 0.3,
    fibra: 2.0,
    sodio: 1,
    contextos: ['cafe', 'lanche', 'ceia'],
    perfilSabor: 'doce',
    subgrupoCarbo: 'frutas',
    porcaoMinimaG: 60,
    porcaoMaximaG: 150,
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten', 'low-carb', 'keto'],
  },

  // ── GORDURAS BOAS & OLEAGINOSAS (Com Trava Rígida de 15g para Gorduras Puras) ──
  {
    id: 'g_azeite',
    nome: 'Azeite de Oliva Extra Virgem',
    categoria: 'Óleos e Gorduras',
    baseQuantidade: 100,
    calorias: 884,
    proteina: 0,
    carboidrato: 0,
    gordura: 100.0,
    fibra: 0,
    sodio: 0,
    contextos: ['almoco', 'jantar'],
    perfilSabor: 'salgado',
    tipoGordura: 'adicionada_pura',
    porcaoMinimaG: 5,
    porcaoMaximaG: 15, // HARD CAP RIGOROSO: NUNCA PASSAR DE 15g!
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten', 'gordura-pura'],
  },
  {
    id: 'g_manteiga',
    nome: 'Manteiga de Primeira Qualidade',
    categoria: 'Óleos e Gorduras',
    baseQuantidade: 100,
    calorias: 717,
    proteina: 0.9,
    carboidrato: 0.1,
    gordura: 81.1,
    fibra: 0,
    sodio: 11,
    contextos: ['cafe', 'lanche'],
    perfilSabor: 'salgado',
    tipoGordura: 'adicionada_pura',
    porcaoMinimaG: 5,
    porcaoMaximaG: 15, // HARD CAP RIGOROSO: NUNCA PASSAR DE 15g!
    tags: ['vegetariano', 'contem-lactose', 'sem-gluten', 'gordura-pura'],
  },
  {
    id: 'g_pasta_amendoim',
    nome: 'Pasta de Amendoim Integral',
    categoria: 'Óleos e Gorduras',
    baseQuantidade: 100,
    calorias: 588,
    proteina: 25.0,
    carboidrato: 20.0,
    gordura: 50.0,
    fibra: 6.0,
    sodio: 15,
    contextos: ['cafe', 'lanche', 'ceia'], // NUNCA no almoço/jantar!
    perfilSabor: 'doce',
    tipoGordura: 'oleaginosa_fruta',
    porcaoMinimaG: 15,
    porcaoMaximaG: 30,
    tags: ['amendoim', 'vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },
  {
    id: 'g_abacate',
    nome: 'Abacate Fresco',
    categoria: 'Óleos e Gorduras',
    baseQuantidade: 100,
    calorias: 160,
    proteina: 2.0,
    carboidrato: 8.5,
    gordura: 14.7,
    fibra: 6.7,
    sodio: 7,
    contextos: ['cafe', 'lanche', 'ceia'],
    perfilSabor: 'neutro',
    tipoGordura: 'oleaginosa_fruta',
    porcaoMinimaG: 40,
    porcaoMaximaG: 100,
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },
  {
    id: 'g_castanha',
    nome: 'Castanha-do-Pará',
    categoria: 'Óleos e Gorduras',
    baseQuantidade: 100,
    calorias: 656,
    proteina: 14.3,
    carboidrato: 12.3,
    gordura: 66.4,
    fibra: 7.5,
    sodio: 2,
    contextos: ['cafe', 'lanche', 'ceia'],
    perfilSabor: 'neutro',
    tipoGordura: 'oleaginosa_fruta',
    porcaoMinimaG: 10,
    porcaoMaximaG: 30,
    tags: ['oleaginosas', 'vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },

  // ── VEGETAIS E HORTALIÇAS ────────────────────────────────────────────────
  {
    id: 'v_brocolis',
    nome: 'Brócolis Cozido no Vapor',
    categoria: 'Vegetais',
    baseQuantidade: 100,
    calorias: 35,
    proteina: 2.4,
    carboidrato: 7.2,
    gordura: 0.4,
    fibra: 3.3,
    sodio: 33,
    contextos: ['almoco', 'jantar'],
    perfilSabor: 'salgado',
    porcaoMinimaG: 60,
    porcaoMaximaG: 150,
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },
  {
    id: 'v_tomate',
    nome: 'Tomate Italiano Cru',
    categoria: 'Vegetais',
    baseQuantidade: 100,
    calorias: 18,
    proteina: 0.9,
    carboidrato: 3.9,
    gordura: 0.2,
    fibra: 1.2,
    sodio: 5,
    contextos: ['cafe', 'almoco', 'lanche', 'jantar'],
    perfilSabor: 'salgado',
    porcaoMinimaG: 40,
    porcaoMaximaG: 100,
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },
  {
    id: 'v_alface',
    nome: 'Salada de Folhas Verdes (Alface e Rúcula)',
    categoria: 'Vegetais',
    baseQuantidade: 100,
    calorias: 15,
    proteina: 1.3,
    carboidrato: 2.8,
    gordura: 0.2,
    fibra: 1.3,
    sodio: 10,
    contextos: ['almoco', 'jantar'],
    perfilSabor: 'salgado',
    porcaoMinimaG: 40,
    porcaoMaximaG: 80,
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },
];

// ============================================================================
// 2. FUNÇÃO DE ESCALONAMENTO COM TRAVAMENTO ABSOLUTO (HARD CAP)
// ============================================================================

/**
 * Escala a porção de um alimento para atingir a meta do macronutriente,
 * respeitando os limites mínimo, máximo e o absoluteMaxGrams inegociável.
 */
export function escalonarAlimentoParaMacro(
  alimento: Alimento,
  macroAlvo: number,
  macroChave: 'proteina' | 'carboidrato' | 'gordura',
  absoluteMaxGrams?: number
): ItemRefeicao {
  const teorPorGrama = alimento[macroChave] / (alimento.baseQuantidade || 100);
  let gramas = teorPorGrama > 0 ? macroAlvo / teorPorGrama : (alimento.porcaoMinimaG || 20);

  // 1. Aplica o teto culinário natural do alimento
  const tetoAlimento = alimento.porcaoMaximaG || 250;
  let tetoEfetivo = tetoAlimento;

  // 2. REGRA 3: HARD CAP INEGOCIÁVEL (Azeite/Manteiga nunca passam de 15g)
  if (alimento.tipoGordura === 'adicionada_pura' || alimento.id === 'g_azeite' || alimento.id === 'g_manteiga') {
    tetoEfetivo = 15;
  } else if (absoluteMaxGrams !== undefined) {
    tetoEfetivo = Math.min(tetoEfetivo, absoluteMaxGrams);
  }

  // 3. Piso mínimo
  const pisoEfetivo = alimento.porcaoMinimaG || 15;

  // Arredonda para múltiplos de 5g para viabilidade culinária prática
  gramas = Math.max(pisoEfetivo, Math.min(tetoEfetivo, Math.round(gramas / 5) * 5));

  // Trava final estrita
  if (alimento.tipoGordura === 'adicionada_pura' || alimento.id === 'g_azeite' || alimento.id === 'g_manteiga') {
    gramas = Math.min(gramas, 15);
  }

  const fator = gramas / (alimento.baseQuantidade || 100);

  return {
    alimentoId: alimento.id,
    nome: alimento.nome,
    quantidadeG: gramas,
    calorias: Number((alimento.calorias * fator).toFixed(1)),
    proteina: Number((alimento.proteina * fator).toFixed(1)),
    carboidrato: Number((alimento.carboidrato * fator).toFixed(1)),
    gordura: Number((alimento.gordura * fator).toFixed(1)),
    fibra: Number((alimento.fibra * fator).toFixed(1)),
    sodio: Number((alimento.sodio * fator).toFixed(1)),
  };
}

// ============================================================================
// 3. CÁLCULO DE TAXAS METABÓLICAS (TMB, GET E METAS MACRO)
// ============================================================================

export function calcularTMB(biometria: BiometriaPaciente): { tmb: number; metodo: string } {
  const { pesoKg, alturaCm, idade, sexo, massaMagraKg } = biometria;

  if (massaMagraKg && massaMagraKg > 0) {
    const tmbKatch = 370 + 21.6 * massaMagraKg;
    return {
      tmb: Math.round(tmbKatch),
      metodo: 'Katch-McArdle (MLG)',
    };
  }

  let tmbMifflin = 10 * pesoKg + 6.25 * alturaCm - 5 * idade;
  tmbMifflin += sexo === 'Masculino' ? 5 : -161;

  return {
    tmb: Math.round(tmbMifflin),
    metodo: 'Mifflin-St Jeor',
  };
}

export function obterFatorAtividade(nivel: NivelAtividade): number {
  switch (nivel) {
    case 'sedentario': return 1.2;
    case 'leve': return 1.375;
    case 'moderado': return 1.55;
    case 'alto': return 1.725;
    case 'atleta': return 1.9;
    default: return 1.5;
  }
}

export function calcularBalançoEnergetico(
  biometria: BiometriaPaciente,
  objetivo: ObjetivoClinico,
  nivelAtividade: NivelAtividade
): CalculoEnergetico {
  const { tmb, metodo } = calcularTMB(biometria);
  const fatorAtividade = obterFatorAtividade(nivelAtividade);
  const get = Math.round(tmb * fatorAtividade);

  let deltaCalorias = 0;
  switch (objetivo) {
    case 'emagrecimento': deltaCalorias = -450; break;
    case 'hipertrofia': deltaCalorias = +350; break;
    case 'cetogenica': deltaCalorias = -300; break;
    case 'lowcarb': deltaCalorias = -350; break;
    case 'recomposicao': deltaCalorias = -150; break;
    case 'performance': deltaCalorias = +150; break;
    case 'manutencao':
    default: deltaCalorias = 0; break;
  }

  const caloriasAlvo = Math.max(1200, Math.round(get + deltaCalorias));

  return {
    tmb,
    metodoTmb: metodo,
    fatorAtividade,
    get,
    caloriasAlvo,
    deficitOuSuperavitKcal: deltaCalorias,
  };
}

export function calcularMetasMacronutrientes(
  biometria: BiometriaPaciente,
  objetivo: ObjetivoClinico,
  caloriasAlvo: number
) {
  const peso = biometria.pesoKg;
  let proteinaGKg = 2.0;
  let gorduraPct = 0.25;
  let carboidratoG: number;

  if (objetivo === 'cetogenica') {
    carboidratoG = 30;
    proteinaGKg = 1.8;
    const proteinaG = Math.round(peso * proteinaGKg);
    const kcalProtECarb = (proteinaG * 4) + (carboidratoG * 4);
    const gorduraG = Math.round((caloriasAlvo - kcalProtECarb) / 9);

    return {
      calorias: caloriasAlvo,
      proteinaG,
      proteinaGPorKg: Number(proteinaGKg.toFixed(2)),
      carboidratoG,
      gorduraG,
      fibrasMinimaG: 20,
      aguaRecomendadaMl: Math.round(peso * 40),
    };
  }

  if (objetivo === 'lowcarb') {
    carboidratoG = 75;
    proteinaGKg = 2.1;
    const proteinaG = Math.round(peso * proteinaGKg);
    const kcalProtECarb = (proteinaG * 4) + (carboidratoG * 4);
    const gorduraG = Math.round((caloriasAlvo - kcalProtECarb) / 9);

    return {
      calorias: caloriasAlvo,
      proteinaG,
      proteinaGPorKg: Number(proteinaGKg.toFixed(2)),
      carboidratoG,
      gorduraG,
      fibrasMinimaG: 25,
      aguaRecomendadaMl: Math.round(peso * 38),
    };
  }

  switch (objetivo) {
    case 'emagrecimento': proteinaGKg = 2.2; gorduraPct = 0.23; break;
    case 'hipertrofia': proteinaGKg = 1.9; gorduraPct = 0.25; break;
    case 'recomposicao': proteinaGKg = 2.3; gorduraPct = 0.24; break;
    case 'performance': proteinaGKg = 1.8; gorduraPct = 0.25; break;
    case 'manutencao':
    default: proteinaGKg = 2.0; gorduraPct = 0.25; break;
  }

  const proteinaG = Math.round(peso * proteinaGKg);
  const caloriasProteina = proteinaG * 4;
  const gorduraG = Math.round((caloriasAlvo * gorduraPct) / 9);
  const caloriasGordura = gorduraG * 9;

  const caloriasRestantesCarbo = caloriasAlvo - caloriasProteina - caloriasGordura;
  carboidratoG = Math.max(50, Math.round(caloriasRestantesCarbo / 4));

  const fibrasMinimaG = Math.round((caloriasAlvo / 1000) * 14);
  const aguaRecomendadaMl = Math.round(peso * 35);

  return {
    calorias: caloriasAlvo,
    proteinaG,
    proteinaGPorKg: Number(proteinaGKg.toFixed(2)),
    carboidratoG,
    gorduraG,
    fibrasMinimaG,
    aguaRecomendadaMl,
  };
}

// ============================================================================
// 4. FILTRO DE ELEGIBILIDADE E ALÉRGENOS
// ============================================================================

export function filtrarAlimentosElegiveis(
  alimentos: Alimento[],
  restricoes: RestricoesAlimentares
): Alimento[] {
  const normalizar = (txt: string) =>
    txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const proibicoes = [
    ...(restricoes.alergias || []),
    ...(restricoes.intolerancias || []),
    ...(restricoes.aversoes || []),
  ].map(normalizar).filter((s) => s.length > 1);

  const estilo = restricoes.estiloAlimentar || 'onivoro';

  return alimentos.filter((alimento) => {
    const nomeNorm = normalizar(alimento.nome);
    const catNorm = normalizar(alimento.categoria);
    const tagsNorm = (alimento.tags || []).map(normalizar);

    if (estilo === 'vegano') {
      const origensAnimais = ['carnes', 'aves', 'peixes', 'laticinios', 'ovos', 'leite', 'frango', 'bovino'];
      if (origensAnimais.some((o) => catNorm.includes(o) || nomeNorm.includes(o))) {
        if (!tagsNorm.includes('vegano')) return false;
      }
    }

    if (estilo === 'vegetariano') {
      const carnes = ['carnes', 'aves', 'peixes', 'frango', 'peixe', 'tilapia', 'bovino', 'salmao'];
      if (carnes.some((c) => catNorm.includes(c) || nomeNorm.includes(c))) return false;
    }

    if (estilo === 'pescetariano') {
      const carnesNaoPeixe = ['carnes e aves', 'frango', 'bovino', 'patinho', 'contrafile', 'sobrecoxa'];
      if (carnesNaoPeixe.some((c) => catNorm.includes(c) || nomeNorm.includes(c))) return false;
    }

    if (proibicoes.some((p) => p.includes('lactose')) && tagsNorm.includes('contem-lactose')) return false;
    if (proibicoes.some((p) => p.includes('gluten')) && tagsNorm.includes('contem-gluten')) return false;

    for (const proibido of proibicoes) {
      if (nomeNorm.includes(proibido) || catNorm.includes(proibido) || tagsNorm.includes(proibido)) {
        return false;
      }
    }

    return true;
  });
}

// ============================================================================
// 5. TEMPLATES DE REFEIÇÃO COM PAPÉIS ESPORTIVOS
// ============================================================================

export type PapelRefeicao = 'cafe' | 'lanche_manha' | 'almoco' | 'pre_treino' | 'pos_treino' | 'jantar' | 'ceia';

interface TemplateRefeicaoEsportiva {
  nome: string;
  horario: string;
  contexto: ContextoRefeicao;
  papel: PapelRefeicao;
  pesoCalorico: number;
}

const TEMPLATES_3_REFEICOES: TemplateRefeicaoEsportiva[] = [
  { nome: 'Café da manhã', horario: '08:00', contexto: 'cafe', papel: 'cafe', pesoCalorico: 0.30 },
  { nome: 'Almoço', horario: '12:30', contexto: 'almoco', papel: 'almoco', pesoCalorico: 0.40 },
  { nome: 'Jantar', horario: '20:00', contexto: 'jantar', papel: 'jantar', pesoCalorico: 0.30 },
];

const TEMPLATES_4_REFEICOES: TemplateRefeicaoEsportiva[] = [
  { nome: 'Café da manhã', horario: '07:30', contexto: 'cafe', papel: 'cafe', pesoCalorico: 0.25 },
  { nome: 'Almoço', horario: '12:30', contexto: 'almoco', papel: 'almoco', pesoCalorico: 0.35 },
  { nome: 'Lanche da tarde / Pré-treino', horario: '16:30', contexto: 'lanche', papel: 'pre_treino', pesoCalorico: 0.15 },
  { nome: 'Jantar', horario: '20:00', contexto: 'jantar', papel: 'jantar', pesoCalorico: 0.25 },
];

const TEMPLATES_5_REFEICOES: TemplateRefeicaoEsportiva[] = [
  { nome: 'Café da manhã', horario: '07:00', contexto: 'cafe', papel: 'cafe', pesoCalorico: 0.20 },
  { nome: 'Almoço', horario: '12:00', contexto: 'almoco', papel: 'almoco', pesoCalorico: 0.30 },
  { nome: 'Lanche da tarde / Pré-treino', horario: '16:00', contexto: 'lanche', papel: 'pre_treino', pesoCalorico: 0.15 },
  { nome: 'Jantar', horario: '19:30', contexto: 'jantar', papel: 'jantar', pesoCalorico: 0.25 },
  { nome: 'Ceia', horario: '22:00', contexto: 'ceia', papel: 'ceia', pesoCalorico: 0.10 },
];

const TEMPLATES_6_REFEICOES: TemplateRefeicaoEsportiva[] = [
  { nome: 'Café da manhã', horario: '06:30', contexto: 'cafe', papel: 'cafe', pesoCalorico: 0.18 },
  { nome: 'Lanche da manhã', horario: '09:30', contexto: 'lanche', papel: 'lanche_manha', pesoCalorico: 0.12 },
  { nome: 'Almoço', horario: '12:30', contexto: 'almoco', papel: 'almoco', pesoCalorico: 0.30 },
  { nome: 'Lanche da tarde / Pré-treino', horario: '16:00', contexto: 'lanche', papel: 'pre_treino', pesoCalorico: 0.15 },
  { nome: 'Jantar', horario: '19:30', contexto: 'jantar', papel: 'jantar', pesoCalorico: 0.20 },
  { nome: 'Ceia', horario: '22:00', contexto: 'ceia', papel: 'ceia', pesoCalorico: 0.05 },
];

function obterTemplatesRefeicoes(qtd: number): TemplateRefeicaoEsportiva[] {
  if (qtd <= 3) return TEMPLATES_3_REFEICOES;
  if (qtd === 4) return TEMPLATES_4_REFEICOES;
  if (qtd === 5) return TEMPLATES_5_REFEICOES;
  return TEMPLATES_6_REFEICOES;
}

// ============================================================================
// 6. MOTOR DE MONTAGEM E REGRAS DE OURO (Golden Rules Engine)
// ============================================================================

export interface ConfigGeradorDieta {
  pacienteId?: string;
  biometria: BiometriaPaciente;
  anamnese: {
    objetivo: ObjetivoClinico;
    nivelAtividade: NivelAtividade;
    numeroRefeicoesDia: number;
    restricoes: RestricoesAlimentares;
  };
  catalogoAlimentos?: Alimento[];
}

export function executarGeradorDietas(config: ConfigGeradorDieta): PlanoAlimentar {
  const { pacienteId = 'default_patient', biometria, anamnese } = config;
  const catalogo = config.catalogoAlimentos && config.catalogoAlimentos.length > 0
    ? config.catalogoAlimentos
    : CATALOGO_ALIMENTOS_BASE;

  // 1. Filtragem Estrita
  const alimentosValidos = filtrarAlimentosElegiveis(catalogo, anamnese.restricoes);
  if (alimentosValidos.length === 0) {
    throw new Error('Nenhum alimento restou elegível após aplicar as restrições alimentares.');
  }

  // 2. Metas Energéticas e Macros
  const isKetoOrLowCarb = anamnese.objetivo === 'cetogenica' || anamnese.objetivo === 'lowcarb';
  const balanco = calcularBalançoEnergetico(biometria, anamnese.objetivo, anamnese.nivelAtividade);
  const metasGlobais = calcularMetasMacronutrientes(biometria, anamnese.objetivo, balanco.caloriasAlvo);

  // 3. Templates de Refeições
  const templates = obterTemplatesRefeicoes(anamnese.numeroRefeicoesDia);

  const porContexto = (ctx: ContextoRefeicao) =>
    alimentosValidos.filter((a) => !a.contextos || a.contextos.includes(ctx));

  const refeicoesMontadas: Refeicao[] = [];
  const totaisGerais: TotaisNutricionais = {
    calorias: 0,
    proteina: 0,
    carboidrato: 0,
    gordura: 0,
    fibra: 0,
    sodio: 0,
  };

  // 4. Montagem com Regras de Ouro
  templates.forEach((tpl, idx) => {
    const alimentosCtx = porContexto(tpl.contexto);
    const itensRefeicao: ItemRefeicao[] = [];

    const metaRefKcal = Math.round(balanco.caloriasAlvo * tpl.pesoCalorico);
    // REGRA 1: ÂNCORA PROTEICA OBRIGATÓRIA - Mínimo de 20g a 25g de proteína por refeição (MPS)
    const metaRefProteina = Math.max(22, Math.round(metasGlobais.proteinaG / templates.length));
    const metaRefCarbo = Math.round(metasGlobais.carboidratoG * tpl.pesoCalorico);
    const metaRefGordura = Math.round(metasGlobais.gorduraG * tpl.pesoCalorico);

    let tipoCarboPrincipal: 'cereais_paes' | 'raizes' | null = null;
    let carnePrincipalEscolhida: Alimento | null = null;
    let temProteinaLiquidaOuPo = false; // Whey, Albumina ou Iogurte

    // ────────────────────────────────────────────────────────────────────────
    // REGRA 1: SELEÇÃO DA ÂNCORA PROTEICA OBRIGATÓRIA
    // ────────────────────────────────────────────────────────────────────────
    if (tpl.contexto === 'almoco' || tpl.contexto === 'jantar') {
      // REGRA: Uma única carne ou peixe por refeição principal
      let carnesDisponiveis = alimentosCtx.filter(
        (a) => a.categoria.includes('Carnes') || a.categoria.includes('Peixes') || a.categoria.includes('Proteínas')
      );

      if (isKetoOrLowCarb) {
        const carnesGordas = carnesDisponiveis.filter((a) => a.gordura >= 7);
        if (carnesGordas.length > 0) carnesDisponiveis = carnesGordas;
      }

      if (carnesDisponiveis.length > 0) {
        carnePrincipalEscolhida = carnesDisponiveis[(idx * 2) % carnesDisponiveis.length];
        const itemCarne = escalonarAlimentoParaMacro(carnePrincipalEscolhida, metaRefProteina, 'proteina');
        itensRefeicao.push(itemCarne);
      }
    } else if (tpl.papel === 'pre_treino' || tpl.papel === 'lanche_manha') {
      // Prioridade: Whey Protein ou Albumina combinados com Iogurte
      const whey = alimentosCtx.find((a) => a.id === 'p_whey');
      const albumina = alimentosCtx.find((a) => a.id === 'p_albumina');
      const iogurte = alimentosCtx.find((a) => a.id === 'l_iogurte');
      const ovos = alimentosCtx.find((a) => a.id === 'p_ovo_inteiro');

      if (whey) {
        // Whey garante 25g a 30g de proteína pura instantânea
        itensRefeicao.push(escalonarAlimentoParaMacro(whey, metaRefProteina * 0.85, 'proteina', 35));
        temProteinaLiquidaOuPo = true;
      } else if (albumina) {
        itensRefeicao.push(escalonarAlimentoParaMacro(albumina, metaRefProteina * 0.85, 'proteina', 35));
        temProteinaLiquidaOuPo = true;
      } else if (iogurte && ovos) {
        itensRefeicao.push(escalonarAlimentoParaMacro(iogurte, 10, 'proteina', 170));
        itensRefeicao.push(escalonarAlimentoParaMacro(ovos, metaRefProteina - 8, 'proteina'));
      } else if (ovos) {
        itensRefeicao.push(escalonarAlimentoParaMacro(ovos, metaRefProteina, 'proteina'));
      }
    } else if (tpl.papel === 'ceia') {
      // Ceia: Albumina (absorção gradual noturna) ou Whey ou Ovos ou Queijo
      const albumina = alimentosCtx.find((a) => a.id === 'p_albumina');
      const whey = alimentosCtx.find((a) => a.id === 'p_whey');
      const queijo = alimentosCtx.find((a) => a.id === 'l_queijo_minas');
      const ovos = alimentosCtx.find((a) => a.id === 'p_ovo_inteiro');

      if (albumina) {
        itensRefeicao.push(escalonarAlimentoParaMacro(albumina, metaRefProteina * 0.85, 'proteina', 35));
        temProteinaLiquidaOuPo = true;
      } else if (whey) {
        itensRefeicao.push(escalonarAlimentoParaMacro(whey, metaRefProteina * 0.85, 'proteina', 35));
        temProteinaLiquidaOuPo = true;
      } else if (ovos) {
        itensRefeicao.push(escalonarAlimentoParaMacro(ovos, metaRefProteina, 'proteina'));
      } else if (queijo) {
        itensRefeicao.push(escalonarAlimentoParaMacro(queijo, metaRefProteina * 0.6, 'proteina'));
      }
    } else {
      // Café da manhã: Ovos inteiros (e claras opcionais se meta for alta) ou Queijo / Whey
      const ovos = alimentosCtx.find((a) => a.id === 'p_ovo_inteiro');
      const queijo = alimentosCtx.find((a) => a.id === 'l_queijo_minas');
      const whey = alimentosCtx.find((a) => a.id === 'p_whey');

      if (ovos) {
        // Garante no mínimo 2 a 3 ovos inteiros para começar batendo ~18g a 24g de proteína
        itensRefeicao.push(escalonarAlimentoParaMacro(ovos, metaRefProteina * 0.75, 'proteina', 180));
        // Se a meta de proteína matinal for muito alta (ex: > 35g), adiciona Queijo ou Claras para fechar sem sobrecarregar gordura
        if (metaRefProteina > 32 && queijo) {
          itensRefeicao.push(escalonarAlimentoParaMacro(queijo, 10, 'proteina', 40));
        }
      } else if (whey) {
        itensRefeicao.push(escalonarAlimentoParaMacro(whey, metaRefProteina, 'proteina', 35));
        temProteinaLiquidaOuPo = true;
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // BALANÇO RESIDUAL APÓS ÂNCORA PROTEICA
    // ────────────────────────────────────────────────────────────────────────
    const carboDaProteina = itensRefeicao.reduce((sum, it) => sum + it.carboidrato, 0);
    const gorduraDaProteina = itensRefeicao.reduce((sum, it) => sum + it.gordura, 0);

    const saldoCarbo = Math.max(0, metaRefCarbo - carboDaProteina);
    const saldoGordura = Math.max(0, metaRefGordura - gorduraDaProteina);

    // ────────────────────────────────────────────────────────────────────────
    // REGRA 2: HARMONIZAÇÃO DE CARBOIDRATOS (GRUPOS MUTUAMENTE EXCLUSIVOS)
    // ────────────────────────────────────────────────────────────────────────
    if (!isKetoOrLowCarb && saldoCarbo > 8) {
      if (tpl.contexto === 'almoco' || tpl.contexto === 'jantar') {
        // Decisão estrita: Arroz + Feijão OU Raízes (Batata Doce/Mandioca). NUNCA os dois juntos!
        // No almoço usa Cereais (Arroz + Feijão). No jantar alterna para Raízes ou Arroz.
        const usarArroz = (tpl.contexto === 'almoco') || (idx % 2 === 0);

        if (usarArroz) {
          tipoCarboPrincipal = 'cereais_paes';
          const arroz = alimentosCtx.find((a) => a.id === 'c_arroz_branco') || alimentosCtx.find((a) => a.id === 'c_arroz_integral');
          const feijao = alimentosCtx.find((a) => a.id === 'c_feijao');

          if (arroz) {
            // Se tiver feijão, 70% do carbo vai para o arroz e 30% para o feijão
            const carboArrozAlvo = feijao ? saldoCarbo * 0.70 : saldoCarbo;
            itensRefeicao.push(escalonarAlimentoParaMacro(arroz, carboArrozAlvo, 'carboidrato', 250));
          }
          if (feijao && tpl.contexto === 'almoco') {
            itensRefeicao.push(escalonarAlimentoParaMacro(feijao, saldoCarbo * 0.30, 'carboidrato', 140));
          }
        } else {
          // Utiliza Raízes (Batata Doce ou Mandioca) — NUNCA com arroz ou aveia!
          tipoCarboPrincipal = 'raizes';
          const raiz = alimentosCtx.find((a) => a.id === 'c_batata_doce') || alimentosCtx.find((a) => a.id === 'c_mandioca');
          if (raiz) {
            itensRefeicao.push(escalonarAlimentoParaMacro(raiz, saldoCarbo, 'carboidrato', 220));
          }
        }
      } else if (temProteinaLiquidaOuPo) {
        // Se a proteína for Whey, Albumina ou Iogurte: Pareia exclusivamente com AVEIA e/ou FRUTA!
        // REGRA: JAMAIS colocar Batata Doce ou Pão aqui!
        tipoCarboPrincipal = 'cereais_paes';
        const aveia = alimentosCtx.find((a) => a.id === 'c_aveia');
        const banana = alimentosCtx.find((a) => a.id === 'f_banana');
        const morango = alimentosCtx.find((a) => a.id === 'f_morango');

        if (aveia) {
          // Aveia limitada rigidamente a 60g
          itensRefeicao.push(escalonarAlimentoParaMacro(aveia, Math.min(saldoCarbo * 0.6, 40), 'carboidrato', 60));
        }

        const carboAposAveia = itensRefeicao.reduce((sum, it) => sum + it.carboidrato, 0);
        const restanteFruta = Math.max(0, metaRefCarbo - carboAposAveia);

        // Se sobrar carboidrato na meta (especialmente em dietas de alta caloria), completa com Fruta!
        if (restanteFruta >= 10 && banana) {
          itensRefeicao.push(escalonarAlimentoParaMacro(banana, restanteFruta, 'carboidrato', 130));
        } else if (restanteFruta >= 6 && morango) {
          itensRefeicao.push(escalonarAlimentoParaMacro(morango, restanteFruta, 'carboidrato', 120));
        }
      } else if (tpl.contexto === 'cafe' || tpl.contexto === 'lanche') {
        // Café da manhã ou lanche com OVOS:
        // Pode ser Pão Integral (Cereais) OU Batata Doce (Raízes). NUNCA OS DOIS JUNTOS!
        const usarPao = idx % 2 === 0;

        if (usarPao) {
          tipoCarboPrincipal = 'cereais_paes';
          const pao = alimentosCtx.find((a) => a.id === 'c_pao_integral');
          if (pao) {
            // REGRA: Hard cap de 100g para pão (2 a 3 fatias)
            itensRefeicao.push(escalonarAlimentoParaMacro(pao, saldoCarbo * 0.7, 'carboidrato', 100));
          }

          // Se a meta de carbo for muito alta, completa o restante com FRUTA (ex: Banana), NUNCA com batata doce!
          const carboAposPao = itensRefeicao.reduce((sum, it) => sum + it.carboidrato, 0);
          const restanteCarbo = Math.max(0, metaRefCarbo - carboAposPao);
          const banana = alimentosCtx.find((a) => a.id === 'f_banana');
          if (restanteCarbo >= 12 && banana) {
            itensRefeicao.push(escalonarAlimentoParaMacro(banana, restanteCarbo, 'carboidrato', 130));
          }
        } else {
          tipoCarboPrincipal = 'raizes';
          const batata = alimentosCtx.find((a) => a.id === 'c_batata_doce');
          if (batata) {
            // Ovos com Batata Doce: combinação clássica do fisiculturismo! NUNCA adicionar aveia ou pão aqui.
            itensRefeicao.push(escalonarAlimentoParaMacro(batata, saldoCarbo, 'carboidrato', 220));
          }
        }
      }
    } else if (isKetoOrLowCarb && (tpl.contexto === 'cafe' || tpl.contexto === 'lanche')) {
      // Em Cetogênica/Low Carb: apenas pequenas frutas vermelhas de baixo carbo
      const morango = alimentosCtx.find((a) => a.id === 'f_morango');
      if (morango && saldoCarbo >= 4) {
        itensRefeicao.push(escalonarAlimentoParaMacro(morango, 6, 'carboidrato', 100));
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // ETAPA: VEGETAIS E HORTALIÇAS (Almoço e Jantar)
    // ────────────────────────────────────────────────────────────────────────
    if (tpl.contexto === 'almoco' || tpl.contexto === 'jantar') {
      const vegetais = alimentosCtx.filter((a) => a.categoria === 'Vegetais');
      if (vegetais.length > 0) {
        const vegEscolhido = vegetais[idx % vegetais.length];
        itensRefeicao.push(escalonarAlimentoParaMacro(vegEscolhido, 20, 'carboidrato', 100));
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // REGRA 3: HARD CAP RIGOROSO DE GORDURAS PURAS (MÁXIMO 15g DE AZEITE/MANTEIGA)
    // ────────────────────────────────────────────────────────────────────────
    const gorduraAtual = itensRefeicao.reduce((sum, it) => sum + it.gordura, 0);
    const saldoGorduraReal = Math.max(0, metaRefGordura - gorduraAtual);

    if (tpl.contexto === 'almoco' || tpl.contexto === 'jantar') {
      // No almoço/jantar: Azeite Extra Virgem com trava rígida de 15g!
      const carneGorda = carnePrincipalEscolhida && carnePrincipalEscolhida.gordura >= 8;

      if (!carneGorda && saldoGorduraReal >= 4) {
        const azeite = alimentosCtx.find((a) => a.id === 'g_azeite');
        if (azeite) {
          // REGRA 3: Hard cap inegociável de 15g
          itensRefeicao.push(escalonarAlimentoParaMacro(azeite, saldoGorduraReal, 'gordura', 15));
        }
      }
    } else if (tpl.contexto === 'cafe' || tpl.contexto === 'lanche' || tpl.contexto === 'ceia') {
      // No café/lanche/ceia:
      // Se tiver Whey ou Aveia ou Fruta: Oleaginosas (Pasta de Amendoim 20-30g ou Castanhas)
      if (temProteinaLiquidaOuPo && saldoGorduraReal >= 6) {
        const pasta = alimentosCtx.find((a) => a.id === 'g_pasta_amendoim');
        const castanha = alimentosCtx.find((a) => a.id === 'g_castanha');

        if (pasta) {
          itensRefeicao.push(escalonarAlimentoParaMacro(pasta, saldoGorduraReal, 'gordura', 30));
        } else if (castanha) {
          itensRefeicao.push(escalonarAlimentoParaMacro(castanha, saldoGorduraReal, 'gordura', 25));
        }
      } else if (tpl.contexto === 'cafe' && tipoCarboPrincipal === 'cereais_paes' && saldoGorduraReal >= 4) {
        // Pão com Ovos: se faltar gordura, adiciona uma pontinha de manteiga com HARD CAP de 15g (NUNCA 70g!)
        const manteiga = alimentosCtx.find((a) => a.id === 'g_manteiga');
        if (manteiga) {
          itensRefeicao.push(escalonarAlimentoParaMacro(manteiga, saldoGorduraReal, 'gordura', 15));
        }
      } else if (saldoGorduraReal >= 8) {
        // Oleaginosa de apoio (Castanhas)
        const castanha = alimentosCtx.find((a) => a.id === 'g_castanha');
        if (castanha) {
          itensRefeicao.push(escalonarAlimentoParaMacro(castanha, saldoGorduraReal, 'gordura', 25));
        }
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // CONSOLIDAÇÃO DOS TOTAIS DA REFEIÇÃO
    // ────────────────────────────────────────────────────────────────────────
    const totaisRef = itensRefeicao.reduce(
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

    totaisRef.calorias = Math.round(totaisRef.calorias);
    totaisRef.proteina = Number(totaisRef.proteina.toFixed(1));
    totaisRef.carboidrato = Number(totaisRef.carboidrato.toFixed(1));
    totaisRef.gordura = Number(totaisRef.gordura.toFixed(1));
    totaisRef.fibra = Number(totaisRef.fibra.toFixed(1));
    totaisRef.sodio = Math.round(totaisRef.sodio);

    totaisGerais.calorias += totaisRef.calorias;
    totaisGerais.proteina += totaisRef.proteina;
    totaisGerais.carboidrato += totaisRef.carboidrato;
    totaisGerais.gordura += totaisRef.gordura;
    totaisGerais.fibra += totaisRef.fibra;
    totaisGerais.sodio += totaisRef.sodio;

    refeicoesMontadas.push({
      id: `meal_${idx + 1}`,
      ordem: idx + 1,
      nome: tpl.nome,
      horarioSugerido: tpl.horario,
      metasRefeicao: {
        calorias: metaRefKcal,
        proteina: metaRefProteina,
        carboidrato: metaRefCarbo,
        gordura: metaRefGordura,
      },
      totaisCalculados: totaisRef,
      itens: itensRefeicao,
    });
  });

  totaisGerais.calorias = Math.round(totaisGerais.calorias);
  totaisGerais.proteina = Number(totaisGerais.proteina.toFixed(1));
  totaisGerais.carboidrato = Number(totaisGerais.carboidrato.toFixed(1));
  totaisGerais.gordura = Number(totaisGerais.gordura.toFixed(1));
  totaisGerais.fibra = Number(totaisGerais.fibra.toFixed(1));
  totaisGerais.sodio = Math.round(totaisGerais.sodio);

  return {
    id: `diet_plan_${Date.now()}`,
    pacienteId,
    titulo: `Plano Alimentar — ${anamnese.objetivo.toUpperCase()}`,
    geradoEm: new Date().toISOString(),
    objetivo: anamnese.objetivo,
    balancoEnergetico: balanco,
    metasGlobais,
    totaisAlcancados: totaisGerais,
    refeicoes: refeicoesMontadas,
  };
}
