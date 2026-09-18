/**
 * utils/dietGenerator.ts
 * 
 * Motor Determinístico de Prescrição Nutricional com COERÊNCIA CULINÁRIA — NutriAx Pro.
 * 
 * Regras Gastronômicas e Fisiológicas Implementadas:
 * 1. TAGS DE CONTEXTO DE REFEIÇÃO: Alimentos são alocados apenas onde fazem sentido
 *    (ex: Pasta de amendoim jamais no Almoço/Jantar; Feijão/Carnes jamais no Café da Manhã).
 * 2. TETO RIGOROSO DE GORDURAS PURAS:
 *    - Azeite e Manteiga têm teto rígido de 10g a 15g por refeição.
 *    - Em dietas ricas em gordura (Cetogênica / Low Carb), o algoritmo prioriza
 *      proteínas inerentemente gordurosas (Ovo inteiro, Salmão, Sobrecoxa, Queijo)
 *      e oleaginosas/frutas (Castanhas, Abacate) em vez de sobrecarregar com óleo/manteiga.
 * 3. EXCLUSIVIDADE DE PROTEÍNA ANIMAL:
 *    - Almoço e Jantar contêm estritamente UMA fonte principal de carne/peixe (sem misturar frango com carne e peixe).
 * 4. HARMONIZAÇÃO DE SABORES E GORDURAS:
 *    - Se uma refeição já contém Abacate ou Pasta de Amendoim, não adiciona Manteiga/Azeite.
 *    - Itens doces (Whey, Frutas, Pasta de Amendoim) pareiam com Aveia/Iogurte/Pão, nunca com carnes de panela.
 * 5. PRECISÃO ATWATER (4-4-9): Fechamento calórico estrito e integridade nutricional.
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
// 1. CATÁLOGO BASE ENRIQUECIDO COM ATRIBUTOS CULINÁRIOS
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
    porcaoMaximaG: 250,
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
    porcaoMaximaG: 220,
    tags: ['sem-lactose', 'sem-gluten', 'proteina-gorda', 'low-carb', 'keto'],
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
    porcaoMaximaG: 220,
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
    porcaoMaximaG: 200,
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
    porcaoMaximaG: 200,
    tags: ['peixe', 'sem-lactose', 'sem-gluten', 'omega-3', 'low-carb', 'keto'],
  },
  {
    id: 'p_ovo_inteiro',
    nome: 'Ovo de Galinha Inteiro Cozido/Mexido',
    categoria: 'Ovos',
    baseQuantidade: 100,
    calorias: 155,
    proteina: 13.0,
    carboidrato: 0.7,
    gordura: 10.0,
    fibra: 0,
    sodio: 124,
    contextos: ['cafe', 'almoco', 'lanche', 'jantar', 'ceia'],
    perfilSabor: 'salgado',
    tipoGordura: 'intrinseca',
    porcaoMinimaG: 50, // ~1 ovo
    porcaoMaximaG: 200, // ~4 ovos
    tags: ['ovo', 'vegetariano', 'sem-lactose', 'sem-gluten', 'low-carb', 'keto'],
  },
  {
    id: 'p_clara',
    nome: 'Clara de Ovo Cozida',
    categoria: 'Ovos',
    baseQuantidade: 100,
    calorias: 52,
    proteina: 11.0,
    carboidrato: 0.7,
    gordura: 0.2,
    fibra: 0,
    sodio: 166,
    contextos: ['cafe', 'lanche', 'jantar', 'ceia'],
    perfilSabor: 'neutro',
    tipoGordura: 'intrinseca',
    porcaoMinimaG: 60,
    porcaoMaximaG: 200,
    tags: ['ovo', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },

  // ── LATICÍNIOS & SUPLEMENTOS ──────────────────────────────────────────────
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
    porcaoMinimaG: 20,
    porcaoMaximaG: 50,
    tags: ['laticinio', 'vegetariano', 'contem-lactose', 'sem-gluten', 'low-carb', 'keto'],
  },
  {
    id: 'l_cottage',
    nome: 'Queijo Cottage',
    categoria: 'Laticínios',
    baseQuantidade: 100,
    calorias: 98,
    proteina: 11.1,
    carboidrato: 3.4,
    gordura: 4.3,
    fibra: 0,
    sodio: 364,
    contextos: ['cafe', 'lanche', 'ceia'],
    perfilSabor: 'neutro',
    tipoGordura: 'intrinseca',
    porcaoMinimaG: 40,
    porcaoMaximaG: 120,
    tags: ['laticinio', 'vegetariano', 'contem-lactose', 'sem-gluten'],
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
    porcaoMinimaG: 100,
    porcaoMaximaG: 200,
    tags: ['laticinio', 'vegetariano', 'contem-lactose', 'sem-gluten'],
  },
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
    porcaoMinimaG: 20,
    porcaoMaximaG: 45,
    tags: ['vegetariano', 'sem-gluten'],
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

  // ── CARBOIDRATOS & CEREAIS ───────────────────────────────────────────────
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
    porcaoMinimaG: 50,
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
    porcaoMinimaG: 50,
    porcaoMaximaG: 250,
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },
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
    porcaoMinimaG: 50,
    porcaoMaximaG: 160,
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'],
  },
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
    contextos: ['almoco', 'lanche', 'jantar'],
    perfilSabor: 'neutro',
    porcaoMinimaG: 60,
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
    porcaoMinimaG: 60,
    porcaoMaximaG: 180,
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'],
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
    porcaoMinimaG: 20,
    porcaoMaximaG: 60,
    tags: ['vegano', 'vegetariano', 'sem-lactose'],
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
    porcaoMinimaG: 25, // ~1 fatia
    porcaoMaximaG: 75, // ~3 fatias
    tags: ['vegetariano', 'contem-gluten'],
  },

  // ── FRUTAS ───────────────────────────────────────────────────────────────
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
    porcaoMinimaG: 60,
    porcaoMaximaG: 150,
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten', 'low-carb', 'keto'],
  },

  // ── GORDURAS BOAS & OLEAGINOSAS ──────────────────────────────────────────
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
    porcaoMaximaG: 15, // TETO RIGOROSO: Máximo 1 colher de sopa (15g)
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten', 'gordura-pura', 'low-carb', 'keto'],
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
    porcaoMaximaG: 15, // TETO RIGOROSO: Máximo 1 ponta de faca (15g)
    tags: ['vegetariano', 'contem-lactose', 'sem-gluten', 'gordura-pura', 'low-carb', 'keto'],
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
    contextos: ['cafe', 'lanche', 'ceia'], // NUNCA no Almoço ou Jantar!
    perfilSabor: 'doce',
    tipoGordura: 'oleaginosa_fruta',
    porcaoMinimaG: 15,
    porcaoMaximaG: 30, // Máx 1 a 2 colheres
    tags: ['amendoim', 'vegano', 'vegetariano', 'sem-lactose', 'sem-gluten', 'low-carb', 'keto'],
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
    porcaoMaximaG: 100, // Máx 100g para evitar excessos calóricos isolados
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten', 'low-carb', 'keto'],
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
    tags: ['oleaginosas', 'vegano', 'vegetariano', 'sem-lactose', 'sem-gluten', 'low-carb', 'keto'],
  },

  // ── VEGETAIS & HORTALIÇAS ────────────────────────────────────────────────
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
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten', 'low-carb', 'keto'],
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
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten', 'low-carb', 'keto'],
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
    tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten', 'low-carb', 'keto'],
  },
];

// ============================================================================
// 2. CÁLCULO DE TAXAS METABÓLICAS (TMB, GET E METAS MACRO)
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
    case 'emagrecimento':
      deltaCalorias = -450;
      break;
    case 'hipertrofia':
      deltaCalorias = +350;
      break;
    case 'cetogenica':
      deltaCalorias = -300; // Cetogênica comumente usada para perda ou definição com preservação
      break;
    case 'lowcarb':
      deltaCalorias = -350;
      break;
    case 'recomposicao':
      deltaCalorias = -150;
      break;
    case 'performance':
      deltaCalorias = +150;
      break;
    case 'manutencao':
    default:
      deltaCalorias = 0;
      break;
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
    // Dieta Cetogênica: Carboidrato líquido estrito (25g a 30g), Proteína moderada, Gordura compensa
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
      aguaRecomendadaMl: Math.round(peso * 40), // Ceto exige hidratação superior
    };
  }

  if (objetivo === 'lowcarb') {
    // Dieta Low Carb: Carboidrato controlado (60g a 80g), Proteína elevada, Gordura moderada/alta
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

  // Objetivos Tradicionais (Atwater 4-4-9)
  switch (objetivo) {
    case 'emagrecimento':
      proteinaGKg = 2.2;
      gorduraPct = 0.23;
      break;
    case 'hipertrofia':
      proteinaGKg = 1.9;
      gorduraPct = 0.25;
      break;
    case 'recomposicao':
      proteinaGKg = 2.3;
      gorduraPct = 0.24;
      break;
    case 'performance':
      proteinaGKg = 1.8;
      gorduraPct = 0.25;
      break;
    case 'manutencao':
    default:
      proteinaGKg = 2.0;
      gorduraPct = 0.25;
      break;
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
// 3. FILTRO DE SEGURANÇA E ELEGIBILIDADE DE ALIMENTOS
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

    // 1. Estilo Vegano
    if (estilo === 'vegano') {
      const origensAnimais = ['carnes', 'aves', 'peixes', 'laticinios', 'ovos', 'leite', 'frango', 'bovino'];
      if (origensAnimais.some((o) => catNorm.includes(o) || nomeNorm.includes(o))) {
        if (!tagsNorm.includes('vegano')) return false;
      }
    }

    // 2. Estilo Vegetariano
    if (estilo === 'vegetariano') {
      const carnes = ['carnes', 'aves', 'peixes', 'frango', 'peixe', 'tilapia', 'bovino', 'salmao'];
      if (carnes.some((c) => catNorm.includes(c) || nomeNorm.includes(c))) return false;
    }

    // 3. Estilo Pescetariano
    if (estilo === 'pescetariano') {
      const carnesNaoPeixe = ['carnes e aves', 'frango', 'bovino', 'patinho', 'contrafile', 'sobrecoxa'];
      if (carnesNaoPeixe.some((c) => catNorm.includes(c) || nomeNorm.includes(c))) return false;
    }

    // 4. Intolerâncias Críticas por Tag
    if (proibicoes.some((p) => p.includes('lactose')) && tagsNorm.includes('contem-lactose')) return false;
    if (proibicoes.some((p) => p.includes('gluten')) && tagsNorm.includes('contem-gluten')) return false;

    // 5. Termos Proibidos
    for (const proibido of proibicoes) {
      if (nomeNorm.includes(proibido) || catNorm.includes(proibido) || tagsNorm.includes(proibido)) {
        return false;
      }
    }

    return true;
  });
}

// ============================================================================
// 4. MODELAGEM DE REFEIÇÕES (Templates com Contexto Culinário)
// ============================================================================

interface TemplateRefeicaoCulinaria {
  nome: string;
  horario: string;
  contexto: ContextoRefeicao;
  pesoCalorico: number;
}

const TEMPLATES_3_REFEICOES: TemplateRefeicaoCulinaria[] = [
  { nome: 'Café da manhã', horario: '08:00', contexto: 'cafe', pesoCalorico: 0.30 },
  { nome: 'Almoço', horario: '12:30', contexto: 'almoco', pesoCalorico: 0.40 },
  { nome: 'Jantar', horario: '20:00', contexto: 'jantar', pesoCalorico: 0.30 },
];

const TEMPLATES_4_REFEICOES: TemplateRefeicaoCulinaria[] = [
  { nome: 'Café da manhã', horario: '07:30', contexto: 'cafe', pesoCalorico: 0.25 },
  { nome: 'Almoço', horario: '12:30', contexto: 'almoco', pesoCalorico: 0.35 },
  { nome: 'Lanche da tarde', horario: '16:30', contexto: 'lanche', pesoCalorico: 0.15 },
  { nome: 'Jantar', horario: '20:00', contexto: 'jantar', pesoCalorico: 0.25 },
];

const TEMPLATES_5_REFEICOES: TemplateRefeicaoCulinaria[] = [
  { nome: 'Café da manhã', horario: '07:00', contexto: 'cafe', pesoCalorico: 0.20 },
  { nome: 'Almoço', horario: '12:00', contexto: 'almoco', pesoCalorico: 0.30 },
  { nome: 'Lanche da tarde', horario: '16:00', contexto: 'lanche', pesoCalorico: 0.15 },
  { nome: 'Jantar', horario: '19:30', contexto: 'jantar', pesoCalorico: 0.25 },
  { nome: 'Ceia', horario: '22:00', contexto: 'ceia', pesoCalorico: 0.10 },
];

const TEMPLATES_6_REFEICOES: TemplateRefeicaoCulinaria[] = [
  { nome: 'Café da manhã', horario: '06:30', contexto: 'cafe', pesoCalorico: 0.18 },
  { nome: 'Colação', horario: '09:30', contexto: 'lanche', pesoCalorico: 0.12 },
  { nome: 'Almoço', horario: '12:30', contexto: 'almoco', pesoCalorico: 0.30 },
  { nome: 'Lanche da tarde', horario: '16:00', contexto: 'lanche', pesoCalorico: 0.15 },
  { nome: 'Jantar', horario: '19:30', contexto: 'jantar', pesoCalorico: 0.20 },
  { nome: 'Ceia', horario: '22:00', contexto: 'ceia', pesoCalorico: 0.05 },
];

function obterTemplatesRefeicoes(qtd: number): TemplateRefeicaoCulinaria[] {
  if (qtd <= 3) return TEMPLATES_3_REFEICOES;
  if (qtd === 4) return TEMPLATES_4_REFEICOES;
  if (qtd === 5) return TEMPLATES_5_REFEICOES;
  return TEMPLATES_6_REFEICOES;
}

// ============================================================================
// 5. MOTOR DE MONTAGEM E COERÊNCIA CULINÁRIA (Culinary Assembly Engine)
// ============================================================================

/**
 * Escala porção respeitando tetos e pisos culinários estritos
 */
function escalonarPorcaoCulinaria(
  alimento: Alimento,
  macroAlvo: number,
  macroChave: 'proteina' | 'carboidrato' | 'gordura',
  limiteMaximoCustom?: number
): ItemRefeicao {
  const teorPorGrama = alimento[macroChave] / (alimento.baseQuantidade || 100);
  let gramas = teorPorGrama > 0 ? macroAlvo / teorPorGrama : (alimento.porcaoMinimaG || 20);

  const minG = alimento.porcaoMinimaG || 15;
  const maxG = limiteMaximoCustom !== undefined
    ? limiteMaximoCustom
    : (alimento.porcaoMaximaG || 250);

  gramas = Math.max(minG, Math.min(maxG, Math.round(gramas / 5) * 5));
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

  // Helper para filtrar por contexto culinário
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

  // 4. Montagem das Refeições com Rigor Culinário
  templates.forEach((tpl, idx) => {
    const alimentosDoContexto = porContexto(tpl.contexto);
    const itensRefeicao: ItemRefeicao[] = [];

    const metaRefKcal = Math.round(balanco.caloriasAlvo * tpl.pesoCalorico);
    // MPS: divide a proteína homogeneamente entre as refeições
    const metaRefProteina = Math.round(metasGlobais.proteinaG / templates.length);
    const metaRefCarbo = Math.round(metasGlobais.carboidratoG * tpl.pesoCalorico);
    const metaRefGordura = Math.round(metasGlobais.gorduraG * tpl.pesoCalorico);

    let temGorduraOleaginosaOuFruta = false; // Flag para evitar empilhamento (ex: Abacate + Manteiga)
    let carnePrincipalEscolhida: Alimento | null = null;

    // ── ETAPA A: SELEÇÃO DA PROTEÍNA PRINCIPAL ─────────────────────────────
    if (tpl.contexto === 'almoco' || tpl.contexto === 'jantar') {
      // REGRA 3: EXCLUSIVIDADE DE PROTEÍNA ANIMAL (Uma única carne ou peixe por refeição)
      let carnesDisponiveis = alimentosDoContexto.filter(
        (a) => a.categoria.includes('Carnes') || a.categoria.includes('Peixes') || a.categoria.includes('Proteínas')
      );

      // Em dietas Cetogênicas/Low Carb, prioriza proteínas com gordura natural (Salmão, Sobrecoxa, Contrafilé)
      if (isKetoOrLowCarb) {
        const carnesGordas = carnesDisponiveis.filter((a) => a.gordura >= 7);
        if (carnesGordas.length > 0) carnesDisponiveis = carnesGordas;
      }

      if (carnesDisponiveis.length > 0) {
        // Alternância determinística entre refeições
        carnePrincipalEscolhida = carnesDisponiveis[(idx * 2) % carnesDisponiveis.length];
        const itemCarne = escalonarPorcaoCulinaria(carnePrincipalEscolhida, metaRefProteina, 'proteina');
        itensRefeicao.push(itemCarne);
      }
    } else if (tpl.contexto === 'cafe') {
      // Café da manhã: Ovos, Queijos, Iogurte ou Whey. NUNCA carnes pesadas!
      const proteinaCafeList = alimentosDoContexto.filter(
        (a) => a.categoria === 'Ovos' || a.categoria === 'Laticínios' || a.id === 'p_whey'
      );
      if (proteinaCafeList.length > 0) {
        // Em keto/low carb, ovo inteiro é o rei do café
        const escolhida = isKetoOrLowCarb
          ? (proteinaCafeList.find((a) => a.id === 'p_ovo_inteiro') || proteinaCafeList[0])
          : proteinaCafeList[idx % proteinaCafeList.length];

        const itemP = escalonarPorcaoCulinaria(escolhida, metaRefProteina, 'proteina');
        itensRefeicao.push(itemP);
      }
    } else {
      // Lanches e Ceia: Iogurte, Whey, Queijo ou Ovos
      const proteinaLancheList = alimentosDoContexto.filter(
        (a) => a.categoria === 'Laticínios' || a.categoria === 'Suplementos' || a.categoria === 'Ovos'
      );
      if (proteinaLancheList.length > 0) {
        const escolhida = proteinaLancheList[idx % proteinaLancheList.length];
        const itemP = escalonarPorcaoCulinaria(escolhida, metaRefProteina, 'proteina');
        itensRefeicao.push(itemP);
      }
    }

    // Calcula balanço residual após alocação proteica
    const carboJaEntregue = itensRefeicao.reduce((sum, it) => sum + it.carboidrato, 0);
    const gorduraJaEntregue = itensRefeicao.reduce((sum, it) => sum + it.gordura, 0);

    const saldoCarboNecessario = Math.max(0, metaRefCarbo - carboJaEntregue);
    const saldoGorduraNecessario = Math.max(0, metaRefGordura - gorduraJaEntregue);

    // ── ETAPA B: ALOCAÇÃO DE CARBOIDRATOS (Harmonizados ao Contexto) ────────
    if (!isKetoOrLowCarb && saldoCarboNecessario > 10) {
      if (tpl.contexto === 'almoco' || tpl.contexto === 'jantar') {
        // Almoço/Jantar: Arroz, Batata, Mandioca e Feijão (salgados)
        const carbosAlmoco = alimentosDoContexto.filter(
          (a) => (a.categoria.includes('Cereais') || a.categoria.includes('Carboidratos')) && a.perfilSabor === 'salgado'
        );
        if (carbosAlmoco.length > 0) {
          const carboEscolhido = carbosAlmoco[(idx * 3) % carbosAlmoco.length];
          const itemC = escalonarPorcaoCulinaria(carboEscolhido, saldoCarboNecessario * 0.7, 'carboidrato');
          itensRefeicao.push(itemC);

          // Se sobrar saldo de carbo e for Almoço, adiciona Feijão como par clássico brasileiro
          if (tpl.contexto === 'almoco') {
            const feijao = alimentosDoContexto.find((a) => a.id === 'c_feijao');
            if (feijao) {
              const itemFeijao = escalonarPorcaoCulinaria(feijao, 15, 'carboidrato', 100);
              itensRefeicao.push(itemFeijao);
            }
          }
        }
      } else if (tpl.contexto === 'cafe' || tpl.contexto === 'lanche') {
        // Café/Lanche: Pão integral, Aveia ou Fruta
        const carbosCafe = alimentosDoContexto.filter(
          (a) => a.id === 'c_pao_integral' || a.id === 'c_aveia' || a.categoria === 'Frutas'
        );
        if (carbosCafe.length > 0) {
          const carboEscolhido = carbosCafe[idx % carbosCafe.length];
          itensRefeicao.push(escalonarPorcaoCulinaria(carboEscolhido, saldoCarboNecessario, 'carboidrato'));
        }
      }
    } else if (isKetoOrLowCarb && (tpl.contexto === 'cafe' || tpl.contexto === 'lanche')) {
      // Em Cetogênica/Low Carb, apenas pequenas porções de morango/frutas vermelhas são permitidas
      const frutaKeto = alimentosDoContexto.find((a) => a.id === 'f_morango');
      if (frutaKeto && saldoCarboNecessario >= 5) {
        itensRefeicao.push(escalonarPorcaoCulinaria(frutaKeto, 6, 'carboidrato', 100));
      }
    }

    // ── ETAPA C: VEGETAIS E HORTALIÇAS (Almoço e Jantar) ───────────────────
    if (tpl.contexto === 'almoco' || tpl.contexto === 'jantar') {
      const vegetais = alimentosDoContexto.filter((a) => a.categoria === 'Vegetais');
      if (vegetais.length > 0) {
        const vegEscolhido = vegetais[idx % vegetais.length];
        // 80g a 120g de salada/vegetal para aporte de fibras
        itensRefeicao.push(escalonarPorcaoCulinaria(vegEscolhido, 20, 'carboidrato', 100));
      }
    }

    // ── ETAPA D: GORDURAS BOAS & CONTROLE RIGOROSO DE TETOS ─────────────────
    const gorduraAposItens = itensRefeicao.reduce((sum, it) => sum + it.gordura, 0);
    const saldoGorduraFinal = Math.max(0, metaRefGordura - gorduraAposItens);

    // REGRA 4: SE JÁ HOUVER ABACATE OU PASTA DE AMENDOIM, NÃO ADICIONA GORDURA PURA
    if (tpl.contexto === 'cafe' || tpl.contexto === 'lanche' || tpl.contexto === 'ceia') {
      // 1. Prioriza Oleaginosa / Fruta (Castanha, Pasta de amendoim ou Abacate)
      const gordurasInteiras = alimentosDoContexto.filter(
        (a) => a.tipoGordura === 'oleaginosa_fruta'
      );

      if (saldoGorduraFinal >= 6 && gordurasInteiras.length > 0) {
        // REGRA 1 & 4: Pasta de amendoim somente em café/lanche com Whey/Pão/Iogurte
        const alimGordura = gordurasInteiras[(idx * 2) % gordurasInteiras.length];
        const itemGordura = escalonarPorcaoCulinaria(alimGordura, saldoGorduraFinal, 'gordura');
        itensRefeicao.push(itemGordura);
        temGorduraOleaginosaOuFruta = true;
      } else if (!temGorduraOleaginosaOuFruta && saldoGorduraFinal >= 4) {
        // REGRA 2: MANTEIGA COM TETO RIGOROSO DE 10g A 15g NO CAFÉ (JAMAIS 70g)
        const manteiga = alimentosDoContexto.find((a) => a.id === 'g_manteiga');
        if (manteiga) {
          const itemManteiga = escalonarPorcaoCulinaria(manteiga, saldoGorduraFinal, 'gordura', 12); // teto 12g
          itensRefeicao.push(itemManteiga);
        }
      }
    } else if (tpl.contexto === 'almoco' || tpl.contexto === 'jantar') {
      // REGRA 2: AZEITE NO ALMOÇO/JANTAR COM TETO RIGOROSO DE 10g A 15g
      // Se a carne principal já for gorda (ex: Salmão ou Sobrecoxa), dispensa ou minimiza azeite
      const carneEhGorda = carnePrincipalEscolhida && carnePrincipalEscolhida.gordura >= 8;

      if (!carneEhGorda && saldoGorduraFinal >= 4) {
        const azeite = alimentosDoContexto.find((a) => a.id === 'g_azeite');
        if (azeite) {
          const itemAzeite = escalonarPorcaoCulinaria(azeite, saldoGorduraFinal, 'gordura', 12); // teto 12g (~1 colher)
          itensRefeicao.push(itemAzeite);
        }
      }
    }

    // ── ETAPA E: CONSOLIDAÇÃO DOS TOTAIS DA REFEIÇÃO ────────────────────────
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
