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
  | 'performance'
  | 'lowcarb'
  | 'cetogenica';

export type ContextoRefeicao = 'cafe' | 'almoco' | 'lanche' | 'jantar' | 'ceia';
export type PerfilSabor = 'salgado' | 'doce' | 'neutro';
export type TipoGordura = 'adicionada_pura' | 'oleaginosa_fruta' | 'intrinseca';
export type SubgrupoCarboidrato = 'cereais_paes' | 'raizes' | 'frutas' | 'leguminosas';

export type NivelAtividade =
  | 'sedentario'
  | 'leve'
  | 'moderado'
  | 'alto'
  | 'atleta';

// ============================================================================
// 2.1B MODALIDADES DE TREINO (Puras e Híbridas)
// ============================================================================

/**
 * Modalidades puras e híbridas de treino, usadas para ajustar a periodização
 * nutricional peri-treino (pré/pós), timing de carboidratos e taxas proteicas.
 *
 * HÍBRIDAS = combinam dois ou mais estímulos com demandas metabólicas distintas:
 * - `crossfit`         : Resistência + Força + Metcon (alta demanda glicogênica)
 * - `hiit_forca`       : HIIT Intervalado + Musculação (dual-energy stress)
 * - `triathlon`        : Natação + Ciclismo + Corrida (alta demanda aeróbica + carbo)
 * - `funcional_misto`  : Funcional + Peso Livre (NEAT elevado)
 * - `ciclismo_forca`   : Ciclismo/Spinning + Musculação (aeróbico + anaeróbico)
 * - `running_musculacao`: Corrida + Musculação (common in runners wanting hypertrophy)
 * - `esportes_coletivos`: Futebol/Basquete/Vôlei (explosão + resistência mista)
 */
export type ModalidadeTreino =
  // ── Modalidades Puras ──────────────────────────────────────────────
  | 'musculacao'            // Treino resistido / musculação convencional
  | 'aerobico'             // Cardio contínuo (caminhada, bike, natação leve)
  | 'corrida'              // Running / Atletismo
  | 'natacao'              // Natação competitiva ou recreativa
  | 'ciclismo'             // Ciclismo de estrada ou spinning
  | 'yoga_pilates'         // Flexibilidade, core e mobilidade
  | 'artes_marciais'       // MMA, Jiu-Jitsu, Muay Thai, Judô
  // ── Modalidades Híbridas ───────────────────────────────────────────
  | 'hyrox'                // ★ HÍBRIDO: Fitness Racing (SkiErg, Remo, AirBike, Corrida, Força Funcional)
  | 'crossfit'             // ★ HÍBRIDO: Força + Metcon + Resistência
  | 'hiit_forca'           // ★ HÍBRIDO: HIIT Intervalado + Musculação
  | 'triathlon'            // ★ HÍBRIDO: Natação + Ciclismo + Corrida
  | 'funcional_misto'      // ★ HÍBRIDO: Funcional + Peso Livre
  | 'ciclismo_forca'       // ★ HÍBRIDO: Ciclismo/Spinning + Musculação
  | 'running_musculacao'   // ★ HÍBRIDO: Corrida + Musculação
  | 'esportes_coletivos'   // ★ HÍBRIDO: Futebol, Basquete, Vôlei
  | 'metcon_hibrido';      // ★ HÍBRIDO: Treino de Condicionamento Metabólico Híbrido (Metcon)

/**
 * Perfil metabólico derivado da modalidade, usado no motor de prescrição
 * para ajustar macros peri-treino e cargas de carboidrato.
 */
export interface PerfilModalidadeHibrida {
  /** Identificador único da modalidade */
  modalidade: ModalidadeTreino;
  /** Rótulo legível pelo paciente */
  label: string;
  /** Emoji representativo */
  emoji: string;
  /** É uma modalidade híbrida (múltiplos estímulos)? */
  isHibrida: boolean;
  /** Acréscimo percentual na proteína (ex: 0.15 = +15% sobre a base da meta) */
  deltaProteinaGKg: number;
  /** Acréscimo de carboidrato peri-treino em gramas */
  extraCarboPeriTreino: number;
  /** Fator de ajuste do GET (multiplicador adicional por ser cardio intenso) */
  fatorGetAdicional: number;
  /** Necessidade hídrica adicional em ml/kg */
  hidratacaoExtraMlKg: number;
  /** Observação clínica específica */
  notaClinica: string;
}

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
  horarioTreino?: string;           // ex: "17:30"
  modalidadeTreino?: ModalidadeTreino; // Modalidade principal (pura ou híbrida)
  frequenciaSemanaTreino?: number;  // Sessões por semana (1–7)
  duracaoTreinoMin?: number;        // Duração média do treino em minutos
  intensidadeTreino?: string;       // Leve, Moderada, Alta
  observacoesClinicas?: string;
  questionarioAcessibilidade?: QuestionarioAcessibilidadePaciente;
  
  // Preferências e Informações de Consumo & Rotina (Base para os Geradores)
  alimentosPreferidos?: string[];   // Alimentos favoritos / que o paciente não abre mão (ex: Café, Ovos, Banana, Arroz)
  consumoHidricoL?: number;         // Consumo hídrico diário habitual em Litros
  disponibilidadeCozinhar?: 'Baixa' | 'Moderada' | 'Alta';
  quemPreparaRefeicoes?: string;    // O próprio paciente, Cônjuge, Marmita pronta, etc.
  habitoIntestinal?: string;        // Regular, Constipado, etc.
  rotinaNeat?: string;              // Leve (escritório), Moderado, Intenso
  horasSono?: number;               // Horas de sono por noite
  qualidadeSono?: string;           // Excelente, Boa, Regular, Ruim
  nivelEstresse?: string;           // Baixo, Moderado, Alto
  patologiasClinicas?: string[];    // Hipertensão, Diabetes, etc.
}

// ----------------------------------------------------------------------------
// 2.1 QUESTIONÁRIO DE ACESSIBILIDADE E ROTINA (Logística e Cesta Básica)
// ----------------------------------------------------------------------------

export type FaixaOrcamento = 'economico' | 'moderado' | 'livre';
export type AmbienteConsumo = 'com_geladeira_microondas' | 'sem_refrigeracao' | 'marmita_pronta';
export type StatusAcessibilidadeAlimento =
  | 'alta_disponibilidade' // Paciente compra com facilidade, baixo custo e adora
  | 'tolerado'            // Consome se necessário, custo aceitável
  | 'baixo_acesso';       // Muito caro, difícil de achar ou desfavorável

export interface ItemAcessibilidadePaciente {
  alimentoId: string;
  status: StatusAcessibilidadeAlimento;
}

export interface QuestionarioAcessibilidadePaciente {
  orcamento: FaixaOrcamento;
  ambienteConsumo: AmbienteConsumo;
  tempoPreparoRefeicoesMin?: number;
  aceitaSuplementos?: boolean;
  alimentosAcessiveis: ItemAcessibilidadePaciente[];
  observacoesAcesso?: string;
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

export type CustoRelativo = 'baixo' | 'medio' | 'alto';
export type PraticidadePreparo = 'imediato' | 'rapido' | 'cozimento_longo';

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
  contextos?: ContextoRefeicao[]; // Refeições onde é culinariamente apropriado
  perfilSabor?: PerfilSabor;       // 'salgado' | 'doce' | 'neutro'
  tipoGordura?: TipoGordura;       // 'adicionada_pura' | 'oleaginosa_fruta' | 'intrinseca'
  subgrupoCarbo?: SubgrupoCarboidrato; // 'cereais_paes' | 'raizes' | 'frutas' | 'leguminosas'
  porcaoMaximaG?: number;          // Limite máximo culinário realista por refeição (ex: 15g para azeite/manteiga)
  porcaoMinimaG?: number;          // Limite mínimo para viabilidade
  custoRelativo?: CustoRelativo;   // 'baixo' (cesta básica/econômico), 'medio', 'alto' (nobre/caro)
  praticidadePreparo?: PraticidadePreparo; // imediato (frutas/pão), rápido (ovos/frango grelhado), longo (grãos crus)
  portabilidadeMarmita?: boolean;  // Resiste bem sem refrigeração imediata ou transporte diário
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
  indiceAcessibilidadePercentual?: number; // % de alimentos provenientes da cesta de alta disponibilidade/baixo custo
  orcamentoEstimado?: FaixaOrcamento;
  recomendacaoHidricaMl?: number;
  alimentosPreferidosIncluidos?: string[];
  modalidadeTreinoAplicada?: ModalidadeTreino;
}

// ============================================================================
// 6. ENTRADA E SAÍDA DA SERVER ACTION & DTO DE INTEGRAÇÃO
// ============================================================================

export interface PacienteAnamneseDTO {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  biometria: BiometriaPaciente;
  anamnese: Anamnese;
  fonteIntegracao: 'PRISMA_DB' | 'CANONICAL_DEFAULT' | 'FALLBACK';
}

export interface PrescribeDietInput {
  pacienteId?: string;
  nomePaciente?: string;
  biometria: BiometriaPaciente;
  anamnese: Anamnese;
  questionarioAcessibilidade?: QuestionarioAcessibilidadePaciente;
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
