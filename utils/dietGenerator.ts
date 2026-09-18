/**
 * utils/dietGenerator.ts
 * 
 * Motor Determinístico e Puro de Prescrição Nutricional — NutriAx Pro.
 * Totalmente desacoplado de DOM, I/O ou banco de dados.
 * 
 * Executa:
 * 1. Cálculo Fisiológico de TMB, Fator de Atividade e GET.
 * 2. Determinação de Déficit/Superávit calórico e Metas de Macronutrientes por Objetivo.
 * 3. Filtragem estrita de alergias, intolerâncias, aversões e estilos alimentares.
 * 4. Particionamento e montagem de refeições com estímulo ótimo de síntese proteica (MPS).
 * 5. Escalonamento contínuo de porções alimentares e fechamento de balanço Atwater (4-4-9).
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
} from './nutritionTypes';

// ============================================================================
// 1. BANCO PADRÃO DE ALIMENTOS (Catálogo Nutricional Base TACO / TBCA)
// ============================================================================

export const CATALOGO_ALIMENTOS_BASE: Alimento[] = [
  // Proteínas / Carnes / Ovos
  { id: 'p1', nome: 'Peito de Frango Grelhado', categoria: 'Carnes e Aves', baseQuantidade: 100, calorias: 165, proteina: 32.0, carboidrato: 0, gordura: 2.7, fibra: 0, sodio: 52, tags: ['sem-lactose', 'sem-gluten'] },
  { id: 'p2', nome: 'Patinho Bovino Moído Grelhado', categoria: 'Carnes e Aves', baseQuantidade: 100, calorias: 219, proteina: 35.9, carboidrato: 0, gordura: 7.3, fibra: 0, sodio: 60, tags: ['sem-lactose', 'sem-gluten'] },
  { id: 'p3', nome: 'Filé de Tilápia Grelhada', categoria: 'Peixes e Frutos do Mar', baseQuantidade: 100, calorias: 128, proteina: 26.0, carboidrato: 0, gordura: 2.7, fibra: 0, sodio: 56, tags: ['peixe', 'sem-lactose', 'sem-gluten'] },
  { id: 'p4', nome: 'Ovo de Galinha Inteiro Cozido', categoria: 'Ovos', baseQuantidade: 100, calorias: 155, proteina: 13.0, carboidrato: 0.7, gordura: 10.0, fibra: 0, sodio: 124, tags: ['ovo', 'vegetariano', 'sem-lactose', 'sem-gluten'] },
  { id: 'p5', nome: 'Clara de Ovo Cozida', categoria: 'Ovos', baseQuantidade: 100, calorias: 52, proteina: 11.0, carboidrato: 0.7, gordura: 0.2, fibra: 0, sodio: 166, tags: ['ovo', 'vegetariano', 'sem-lactose', 'sem-gluten'] },
  { id: 'p6', nome: 'Whey Protein Isolado', categoria: 'Suplementos', baseQuantidade: 100, calorias: 370, proteina: 90.0, carboidrato: 2.0, gordura: 1.0, fibra: 0, sodio: 180, tags: ['vegetariano', 'sem-gluten'] },
  { id: 'p7', nome: 'Proteína Isolada de Soja / Ervilha', categoria: 'Suplementos', baseQuantidade: 100, calorias: 360, proteina: 82.0, carboidrato: 2.5, gordura: 1.5, fibra: 1.2, sodio: 220, tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },
  { id: 'p8', nome: 'Tofu Firme Grelhado', categoria: 'Proteínas', baseQuantidade: 100, calorias: 121, proteina: 12.0, carboidrato: 2.0, gordura: 6.8, fibra: 1.0, sodio: 15, tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },

  // Carboidratos / Cereais
  { id: 'c1', nome: 'Arroz Branco Cozido', categoria: 'Cereais e Leguminosas', baseQuantidade: 100, calorias: 130, proteina: 2.5, carboidrato: 28.2, gordura: 0.3, fibra: 0.4, sodio: 1, tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },
  { id: 'c2', nome: 'Arroz Integral Cozido', categoria: 'Cereais e Leguminosas', baseQuantidade: 100, calorias: 124, proteina: 2.6, carboidrato: 25.8, gordura: 1.0, fibra: 2.7, sodio: 1, tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },
  { id: 'c3', nome: 'Feijão Carioca Cozido', categoria: 'Leguminosas', baseQuantidade: 100, calorias: 76, proteina: 4.8, carboidrato: 13.6, gordura: 0.5, fibra: 6.4, sodio: 2, tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },
  { id: 'c4', nome: 'Batata Doce Cozida', categoria: 'Carboidratos', baseQuantidade: 100, calorias: 86, proteina: 1.6, carboidrato: 20.1, gordura: 0.1, fibra: 3.0, sodio: 15, tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },
  { id: 'c5', nome: 'Mandioca / Aipim Cozido', categoria: 'Carboidratos', baseQuantidade: 100, calorias: 125, proteina: 0.6, carboidrato: 30.1, gordura: 0.3, fibra: 1.6, sodio: 2, tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },
  { id: 'c6', nome: 'Aveia em Flocos', categoria: 'Cereais e Leguminosas', baseQuantidade: 100, calorias: 394, proteina: 13.9, carboidrato: 66.6, gordura: 8.5, fibra: 9.1, sodio: 5, tags: ['vegano', 'vegetariano', 'sem-lactose'] },
  { id: 'c7', nome: 'Pão de Forma Integral', categoria: 'Carboidratos', baseQuantidade: 100, calorias: 247, proteina: 9.4, carboidrato: 49.9, gordura: 1.8, fibra: 6.9, sodio: 420, tags: ['vegetariano', 'contem-gluten'] },

  // Frutas
  { id: 'f1', nome: 'Banana Prata', categoria: 'Frutas', baseQuantidade: 100, calorias: 89, proteina: 1.1, carboidrato: 23.0, gordura: 0.3, fibra: 2.6, sodio: 1, tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },
  { id: 'f2', nome: 'Maçã Fuji com Casca', categoria: 'Frutas', baseQuantidade: 100, calorias: 56, proteina: 0.3, carboidrato: 15.2, gordura: 0.2, fibra: 2.0, sodio: 1, tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },
  { id: 'f3', nome: 'Mamão Papaia', categoria: 'Frutas', baseQuantidade: 100, calorias: 40, proteina: 0.5, carboidrato: 10.4, gordura: 0.1, fibra: 1.8, sodio: 3, tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },
  { id: 'f4', nome: 'Morango Fresco', categoria: 'Frutas', baseQuantidade: 100, calorias: 30, proteina: 0.7, carboidrato: 6.8, gordura: 0.3, fibra: 2.0, sodio: 1, tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },

  // Gorduras Boas
  { id: 'g1', nome: 'Azeite de Oliva Extra Virgem', categoria: 'Óleos e Gorduras', baseQuantidade: 100, calorias: 884, proteina: 0, carboidrato: 0, gordura: 100.0, fibra: 0, sodio: 0, tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },
  { id: 'g2', nome: 'Pasta de Amendoim Integral', categoria: 'Óleos e Gorduras', baseQuantidade: 100, calorias: 588, proteina: 25.0, carboidrato: 20.0, gordura: 50.0, fibra: 6.0, sodio: 15, tags: ['amendoim', 'vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },
  { id: 'g3', nome: 'Castanha-do-Pará', categoria: 'Óleos e Gorduras', baseQuantidade: 100, calorias: 656, proteina: 14.3, carboidrato: 12.3, gordura: 66.4, fibra: 7.5, sodio: 2, tags: ['oleaginosas', 'vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },
  { id: 'g4', nome: 'Abacate Fresco', categoria: 'Óleos e Gorduras', baseQuantidade: 100, calorias: 160, proteina: 2.0, carboidrato: 8.5, gordura: 14.7, fibra: 6.7, sodio: 7, tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },

  // Vegetais / Legumes (Aporte de micronutrientes e volume sacietógeno)
  { id: 'v1', nome: 'Brócolis Cozido', categoria: 'Vegetais', baseQuantidade: 100, calorias: 35, proteina: 2.4, carboidrato: 7.2, gordura: 0.4, fibra: 3.3, sodio: 33, tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },
  { id: 'v2', nome: 'Tomate Italiano Cru', categoria: 'Vegetais', baseQuantidade: 100, calorias: 18, proteina: 0.9, carboidrato: 3.9, gordura: 0.2, fibra: 1.2, sodio: 5, tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },
  { id: 'v3', nome: 'Cenoura Cozida', categoria: 'Vegetais', baseQuantidade: 100, calorias: 35, proteina: 0.8, carboidrato: 8.2, gordura: 0.2, fibra: 3.0, sodio: 58, tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },
  { id: 'v4', nome: 'Alface Crespa Crua', categoria: 'Vegetais', baseQuantidade: 100, calorias: 15, proteina: 1.3, carboidrato: 2.8, gordura: 0.2, fibra: 1.3, sodio: 10, tags: ['vegano', 'vegetariano', 'sem-lactose', 'sem-gluten'] },

  // Laticínios
  { id: 'l1', nome: 'Iogurte Natural Desnatado', categoria: 'Laticínios', baseQuantidade: 100, calorias: 43, proteina: 4.5, carboidrato: 5.8, gordura: 0.3, fibra: 0, sodio: 65, tags: ['laticinio', 'vegetariano', 'contem-lactose', 'sem-gluten'] },
  { id: 'l2', nome: 'Queijo Cottage', categoria: 'Laticínios', baseQuantidade: 100, calorias: 98, proteina: 11.1, carboidrato: 3.4, gordura: 4.3, fibra: 0, sodio: 364, tags: ['laticinio', 'vegetariano', 'contem-lactose', 'sem-gluten'] },
  { id: 'l3', nome: 'Leite Desnatado', categoria: 'Laticínios', baseQuantidade: 100, calorias: 35, proteina: 3.2, carboidrato: 5.0, gordura: 0.1, fibra: 0, sodio: 50, tags: ['laticinio', 'vegetariano', 'contem-lactose', 'sem-gluten'] },
];

// ============================================================================
// 2. CÁLCULO DE TAXAS METABÓLICAS (TMB E GET)
// ============================================================================

export function calcularTMB(biometria: BiometriaPaciente): { tmb: number; metodo: string } {
  const { pesoKg, alturaCm, idade, sexo, massaMagraKg } = biometria;

  // Se houver massa magra confiável (Katch-McArdle)
  if (massaMagraKg && massaMagraKg > 0) {
    const tmbKatch = 370 + 21.6 * massaMagraKg;
    return {
      tmb: Math.round(tmbKatch),
      metodo: 'Katch-McArdle (MLG)',
    };
  }

  // Equação Canônica: Mifflin-St Jeor
  let tmbMifflin = 10 * pesoKg + 6.25 * alturaCm - 5 * idade;
  if (sexo === 'Masculino') {
    tmbMifflin += 5;
  } else {
    tmbMifflin -= 161;
  }

  return {
    tmb: Math.round(tmbMifflin),
    metodo: 'Mifflin-St Jeor',
  };
}

export function obterFatorAtividade(nivel: NivelAtividade): number {
  switch (nivel) {
    case 'sedentario':
      return 1.2;
    case 'leve':
      return 1.375;
    case 'moderado':
      return 1.55;
    case 'alto':
      return 1.725;
    case 'atleta':
      return 1.9;
    default:
      return 1.45;
  }
}

export function calcularGET(tmb: number, fatorAtividade: number): number {
  return Math.round(tmb * fatorAtividade);
}

export function calcularBalançoEnergetico(
  biometria: BiometriaPaciente,
  objetivo: ObjetivoClinico,
  nivelAtividade: NivelAtividade
): CalculoEnergetico {
  const { tmb, metodo } = calcularTMB(biometria);
  const fatorAtividade = obterFatorAtividade(nivelAtividade);
  const get = calcularGET(tmb, fatorAtividade);

  let deltaCalorias = 0;
  switch (objetivo) {
    case 'emagrecimento':
      deltaCalorias = -450; // Déficit seguro moderado
      break;
    case 'hipertrofia':
      deltaCalorias = +350; // Superávit limpo
      break;
    case 'recomposicao':
      deltaCalorias = -150; // Leve déficit com alta proteína
      break;
    case 'performance':
      deltaCalorias = +150; // Manutenção positiva
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

// ============================================================================
// 3. DIRETRIZES DE MACRONUTRIENTES
// ============================================================================

export function calcularMetasMacronutrientes(
  biometria: BiometriaPaciente,
  objetivo: ObjetivoClinico,
  caloriasAlvo: number
) {
  const peso = biometria.pesoKg;
  let proteinaGKg = 2.0;
  let gorduraPct = 0.25;

  switch (objetivo) {
    case 'emagrecimento':
      proteinaGKg = 2.2; // Alta proteína para reter massa livre de gordura
      gorduraPct = 0.22;
      break;
    case 'hipertrofia':
      proteinaGKg = 1.9; // Suficiente com superávit de carboidratos
      gorduraPct = 0.25;
      break;
    case 'recomposicao':
      proteinaGKg = 2.3;
      gorduraPct = 0.23;
      break;
    case 'performance':
      proteinaGKg = 1.8;
      gorduraPct = 0.24;
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

  // Fechamento Atwater contábil exato
  const caloriasRestantesCarbo = caloriasAlvo - caloriasProteina - caloriasGordura;
  const carboidratoG = Math.max(40, Math.round(caloriasRestantesCarbo / 4));

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
// 4. FILTRAGEM ESTÓICA DE ALIMENTOS
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
      const carnes = ['carnes', 'aves', 'peixes', 'frango', 'peixe', 'tilapia', 'bovino', 'carne'];
      if (carnes.some((c) => catNorm.includes(c) || nomeNorm.includes(c))) return false;
    }

    // 3. Estilo Pescetariano
    if (estilo === 'pescetariano') {
      const carnesNaoPeixe = ['carnes e aves', 'frango', 'bovino', 'patinho', 'suino'];
      if (carnesNaoPeixe.some((c) => catNorm.includes(c) || nomeNorm.includes(c))) return false;
    }

    // 4. Intolerâncias Críticas por Tag
    if (proibicoes.some((p) => p.includes('lactose')) && tagsNorm.includes('contem-lactose')) {
      return false;
    }
    if (proibicoes.some((p) => p.includes('gluten')) && tagsNorm.includes('contem-gluten')) {
      return false;
    }

    // 5. Proibições Diretas no Nome do Alimento ou Categoria
    for (const proibido of proibicoes) {
      if (nomeNorm.includes(proibido) || catNorm.includes(proibido) || tagsNorm.includes(proibido)) {
        return false;
      }
    }

    return true;
  });
}

// ============================================================================
// 5. ESCALONAMENTO E DISTRIBUIÇÃO EM REFEIÇÕES
// ============================================================================

interface TemplateRefeicao {
  nome: string;
  horario: string;
  pesoCalorico: number;
}

const TEMPLATES_3_REFEICOES: TemplateRefeicao[] = [
  { nome: 'Café da manhã', horario: '08:00', pesoCalorico: 0.30 },
  { nome: 'Almoço', horario: '12:30', pesoCalorico: 0.40 },
  { nome: 'Jantar', horario: '20:00', pesoCalorico: 0.30 },
];

const TEMPLATES_4_REFEICOES: TemplateRefeicao[] = [
  { nome: 'Café da manhã', horario: '07:30', pesoCalorico: 0.25 },
  { nome: 'Almoço', horario: '12:30', pesoCalorico: 0.35 },
  { nome: 'Lanche da tarde', horario: '16:30', pesoCalorico: 0.15 },
  { nome: 'Jantar', horario: '20:00', pesoCalorico: 0.25 },
];

const TEMPLATES_5_REFEICOES: TemplateRefeicao[] = [
  { nome: 'Café da manhã', horario: '07:00', pesoCalorico: 0.20 },
  { nome: 'Almoço', horario: '12:00', pesoCalorico: 0.30 },
  { nome: 'Lanche da tarde', horario: '16:00', pesoCalorico: 0.15 },
  { nome: 'Jantar', horario: '19:30', pesoCalorico: 0.25 },
  { nome: 'Ceia', horario: '22:00', pesoCalorico: 0.10 },
];

const TEMPLATES_6_REFEICOES: TemplateRefeicao[] = [
  { nome: 'Café da manhã', horario: '06:30', pesoCalorico: 0.18 },
  { nome: 'Colação', horario: '09:30', pesoCalorico: 0.12 },
  { nome: 'Almoço', horario: '12:30', pesoCalorico: 0.30 },
  { nome: 'Lanche da tarde', horario: '16:00', pesoCalorico: 0.15 },
  { nome: 'Jantar', horario: '19:30', pesoCalorico: 0.20 },
  { nome: 'Ceia', horario: '22:00', pesoCalorico: 0.05 },
];

function escolherTemplates(numRefeicoes: number): TemplateRefeicao[] {
  if (numRefeicoes <= 3) return TEMPLATES_3_REFEICOES;
  if (numRefeicoes === 4) return TEMPLATES_4_REFEICOES;
  if (numRefeicoes === 5) return TEMPLATES_5_REFEICOES;
  return TEMPLATES_6_REFEICOES;
}

function calcularPorcaoAlimento(
  alimento: Alimento,
  macroAlvo: number,
  macroChave: 'proteina' | 'carboidrato' | 'gordura',
  minG = 15,
  maxG = 300
): ItemRefeicao {
  const teorPor1g = alimento[macroChave] / (alimento.baseQuantidade || 100);
  let gramas = teorPor1g > 0 ? macroAlvo / teorPor1g : minG;

  // Arredonda para múltiplos de 5g para praticidade culinária
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

// ============================================================================
// 6. MOTOR EXECUTOR DE PRESCRIÇÃO
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
  const catalogoDisponivel = config.catalogoAlimentos && config.catalogoAlimentos.length > 0
    ? config.catalogoAlimentos
    : CATALOGO_ALIMENTOS_BASE;

  // 1. Filtrar Alimentos Conforme Restrições
  const alimentosFiltrados = filtrarAlimentosElegiveis(catalogoDisponivel, anamnese.restricoes);
  if (alimentosFiltrados.length === 0) {
    throw new Error('Nenhum alimento restou elegível após aplicar as restrições alimentares.');
  }

  // 2. Cálculos Energéticos e Metas
  const balanco = calcularBalançoEnergetico(biometria, anamnese.objetivo, anamnese.nivelAtividade);
  const metas = calcularMetasMacronutrientes(biometria, anamnese.objetivo, balanco.caloriasAlvo);

  // 3. Escolha das Refeições
  const templates = escolherTemplates(anamnese.numeroRefeicoesDia);

  // Segmentação das fontes
  const fontesP = alimentosFiltrados.filter((a) => a.proteina >= 10 || a.categoria.includes('Proteína') || a.categoria.includes('Carnes') || a.categoria.includes('Ovos') || a.categoria.includes('Suplementos'));
  const fontesC = alimentosFiltrados.filter((a) => a.carboidrato >= 15 || a.categoria.includes('Cereais') || a.categoria.includes('Carboidratos') || a.categoria.includes('Leguminosas'));
  const fontesG = alimentosFiltrados.filter((a) => a.gordura >= 10 || a.categoria.includes('Óleos') || a.categoria.includes('Gorduras'));
  const fontesFrutas = alimentosFiltrados.filter((a) => a.categoria.includes('Frutas'));
  const fontesVeg = alimentosFiltrados.filter((a) => a.categoria.includes('Vegetais'));

  const listaP = fontesP.length > 0 ? fontesP : alimentosFiltrados;
  const listaC = fontesC.length > 0 ? fontesC : alimentosFiltrados;
  const listaG = fontesG.length > 0 ? fontesG : alimentosFiltrados;

  const refeicoesMontadas: Refeicao[] = [];
  const totaisGerais: TotaisNutricionais = {
    calorias: 0,
    proteina: 0,
    carboidrato: 0,
    gordura: 0,
    fibra: 0,
    sodio: 0,
  };

  templates.forEach((tpl, idx) => {
    const metaRefKcal = Math.round(balanco.caloriasAlvo * tpl.pesoCalorico);
    // MPS: divide a proteína de forma equilibrada por refeição (~20-45g)
    const metaRefProteina = Math.round(metas.proteinaG / templates.length);
    const metaRefCarbo = Math.round(metas.carboidratoG * tpl.pesoCalorico);
    const metaRefGordura = Math.round(metas.gorduraG * tpl.pesoCalorico);

    const itens: ItemRefeicao[] = [];

    // 1. Fonte Proteica Principal
    const proteinaAlim = listaP[idx % listaP.length];
    const itemP = calcularPorcaoAlimento(proteinaAlim, metaRefProteina, 'proteina', 30, 250);
    itens.push(itemP);

    // Desconta o que a proteína já entregou
    const carboRestante = Math.max(0, metaRefCarbo - itemP.carboidrato);
    const gorduraRestante = Math.max(0, metaRefGordura - itemP.gordura);

    // 2. Fonte de Carboidrato
    if (carboRestante > 8) {
      const carboAlim = listaC[(idx * 2) % listaC.length];
      const itemC = calcularPorcaoAlimento(carboAlim, carboRestante, 'carboidrato', 30, 250);
      itens.push(itemC);
    }

    // 3. Fruta (manhã / lanches) ou Vegetais (almoço / jantar)
    if (tpl.nome.includes('Almoço') || tpl.nome.includes('Jantar')) {
      if (fontesVeg.length > 0) {
        const veg = fontesVeg[idx % fontesVeg.length];
        itens.push(calcularPorcaoAlimento(veg, 50, 'carboidrato', 80, 150));
      }
    } else {
      if (fontesFrutas.length > 0) {
        const fruta = fontesFrutas[idx % fontesFrutas.length];
        itens.push(calcularPorcaoAlimento(fruta, 15, 'carboidrato', 80, 150));
      }
    }

    // 4. Fonte de Gordura adicional se ainda restar cota
    if (gorduraRestante > 5 && listaG.length > 0) {
      const gordAlim = listaG[idx % listaG.length];
      const itemG = calcularPorcaoAlimento(gordAlim, gorduraRestante, 'gordura', 10, 30);
      itens.push(itemG);
    }

    // Somatórios da Refeição
    const totaisRef = itens.reduce(
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
      itens,
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
    metasGlobais: metas,
    totaisAlcancados: totaisGerais,
    refeicoes: refeicoesMontadas,
  };
}
