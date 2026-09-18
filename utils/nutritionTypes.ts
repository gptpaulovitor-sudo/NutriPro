/**
 * utils/nutritionTypes.ts
 * 
 * Definição canônica e centralizada das interfaces TypeScript do NutriAx Pro.
 * Cobre todo o ciclo de vida da prescrição: Biometria, Anamnese, Alimentos,
 * Restrições, Cálculo Energético e Plano Alimentar.
 */

// ============================================================================
// 1. BIOMETRIA E DADOS DO PACIENTE
// ============================================================================

export type Sexo = 'Masculino' | 'Feminino' | 'Outro';

export interface BiometriaPaciente {
  pesoKg: number;
  alturaCm: number;
  idade: number;
  sexo: Sexo;
  massaMagraKg?: number;
  percentualGordura?: number;
}

export interface AntropometriaResumo {
  imc: number;
  imcClassificacao: string;
  massaGordaKg?: number;
  massaMagraKg?: number;
  percentualGordura?: number;
  rcq?: number;
  rcqClassificacao?: string;
}

export interface Paciente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  biometria: BiometriaPaciente;
  anamnese?: Anamnese;
}

// ============================================================================
// 2. OBJETIVOS E ANAMNESE / RESTRIÇÕES CLÍNICAS
// ============================================================================

export type ObjetivoClinico =
  | 'emagrecimento'
  | 'hipertrofia'
  | 'manutencao'
  | 'recomposicao'
  | 'performance';

export type NivelAtividade =
  | 'sedentario'
  | 'leve'
  | 'moderado'
  | 'alto'
  | 'atleta';

export type EstiloAlimentar =
  | 'onivoro'
  | 'vegetariano'
  | 'vegano'
  | 'pescetariano';

export interface RestricoesAlimentares {
  /** Alergias com risco biológico/imunológico (ex: Frutos do mar, Amendoim) */
  alergias: string[];
  /** Intolerâncias fisiológicas (ex: Lactose, Glúten, FODMAPs) */
  intolerancias: string[];
  /** Aversões sensoriais / preferências negativas (ex: Coentro, Fígado) */
  aversoes: string[];
  /** Estilo de dieta principal */
  estiloAlimentar?: EstiloAlimentar;
}

export interface Anamnese {
  objetivo: ObjetivoClinico;
  nivelAtividade: NivelAtividade;
  numeroRefeicoesDia: number;
  restricoes: RestricoesAlimentares;
  horarioTreino?: string; // ex: "17:30"
  observacoesClinicas?: string;
}

// ============================================================================
// 3. CÁLCULO ENERGÉTICO E METABÓLICO (TMB / GET)
// ============================================================================

export interface CalculoEnergetico {
  tmb: number;                     // Taxa Metabólica Basal
  metodoTmb: string;               // Mifflin-St Jeor ou Katch-McArdle
  fatorAtividade: number;          // 1.2 a 1.9
  get: number;                     // Gasto Energético Total (TMB * FA)
  caloriasAlvo: number;            // VET prescrito com déficit/superávit
  deficitOuSuperavitKcal: number;  // Diferença em relação ao GET
}

// ============================================================================
// 4. ALIMENTOS E COMPOSIÇÃO NUTRICIONAL (Base 100g / 100ml)
// ============================================================================

export type CategoriaAlimento =
  | 'Proteínas'
  | 'Carnes e Aves'
  | 'Peixes e Frutos do Mar'
  | 'Ovos'
  | 'Carboidratos'
  | 'Cereais e Leguminosas'
  | 'Leguminosas'
  | 'Gorduras'
  | 'Óleos e Gorduras'
  | 'Vegetais'
  | 'Frutas'
  | 'Laticínios'
  | 'Suplementos'
  | 'Outros';

export interface Macronutrientes {
  proteina: number;     // gramas
  carboidrato: number;  // gramas
  gordura: number;      // gramas (lipídeos)
}

export interface Alimento extends Macronutrientes {
  id: string;
  nome: string;
  categoria: CategoriaAlimento | string;
  calorias: number;       // kcal por baseQuantidade
  fibra: number;          // gramas
  sodio: number;          // mg
  baseQuantidade: number; // padrão 100 (g ou ml)
  source?: string;        // TACO, TBCA, Rótulo
  tags?: string[];        // ex: ["sem-lactose", "sem-gluten", "vegano"]
}

// ============================================================================
// 5. PLANO ALIMENTAR, REFEIÇÕES E PRESCRIÇÃO FINAL
// ============================================================================

export interface ItemRefeicao {
  id?: string;
  alimentoId: string;
  nome: string;
  quantidadeG: number;
  calorias: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
  fibra: number;
  sodio: number;
}

export interface MetasNutricionaisRefeicao {
  calorias: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
}

export interface TotaisNutricionais {
  calorias: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
  fibra: number;
  sodio: number;
}

export interface Refeicao {
  id?: string;
  ordem: number;
  nome: string;                   // ex: "Café da manhã", "Almoço"
  horarioSugerido: string;         // ex: "07:30"
  metasRefeicao: MetasNutricionaisRefeicao;
  totaisCalculados: TotaisNutricionais;
  itens: ItemRefeicao[];
}

export interface MetasGlobaisPlano {
  calorias: number;
  proteinaG: number;
  proteinaGPorKg: number;
  carboidratoG: number;
  gorduraG: number;
  fibrasMinimaG: number;
  aguaRecomendadaMl: number;
}

export interface PlanoAlimentar {
  id: string;
  pacienteId: string;
  titulo: string;
  geradoEm: string;
  objetivo: ObjetivoClinico;
  balancoEnergetico: CalculoEnergetico;
  metasGlobais: MetasGlobaisPlano;
  totaisAlcancados: TotaisNutricionais;
  refeicoes: Refeicao[];
  persistedId?: string; // ID salvo no banco se persistido
}

// ============================================================================
// 6. ENTRADA E SAÍDA DA SERVER ACTION
// ============================================================================

export interface PrescribeDietInput {
  pacienteId?: string;
  nomePaciente?: string;
  biometria: BiometriaPaciente;
  anamnese: Anamnese;
  alimentosCustomizados?: Alimento[];
  salvarNoBanco?: boolean;
}

export interface PrescribeDietResult {
  success: boolean;
  message: string;
  plano?: PlanoAlimentar;
  prescriptionId?: string;
  error?: string;
}
