"use server";

/**
 * app/actions/prescribeDiet.ts
 * 
 * Server Action do Next.js App Router para o Prescritor de Dietas.
 * Executa o motor determinístico e persiste o plano gerado no Prisma SQLite
 * com transação atômica e Nested Writes.
 */

import prisma from "@/lib/prisma";
import {
  executarGeradorDietas,
  CATALOGO_ALIMENTOS_BASE,
} from "@/utils/dietGenerator";
import {
  PrescribeDietInput,
  PrescribeDietResult,
  Alimento,
  PlanoAlimentar,
  PacienteAnamneseDTO,
  ModalidadeTreino,
  ObjetivoClinico,
  NivelAtividade,
} from "@/utils/nutritionTypes";

/**
 * Garante que os alimentos utilizados na prescrição existam no banco relacional
 * para satisfazer a restrição de chave estrangeira de `PrescriptionItem.foodItemId`.
 */
async function garantirAlimentosNoBanco(alimentos: Alimento[]): Promise<Map<string, string>> {
  const mapaIds = new Map<string, string>();

  for (const alim of alimentos) {
    // Tenta encontrar por nome
    const existente = await prisma.foodItem.findFirst({
      where: { name: alim.nome },
    });

    if (existente) {
      mapaIds.set(alim.id, existente.id);
      mapaIds.set(alim.nome, existente.id);
    } else {
      // Cria o alimento no banco
      const novo = await prisma.foodItem.create({
        data: {
          name: alim.nome,
          category: alim.categoria,
          source: alim.source || "TACO",
          baseQuantity: alim.baseQuantidade || 100,
          calories: alim.calorias,
          protein: alim.proteina,
          carbohydrate: alim.carboidrato,
          lipid: alim.gordura,
          fiber: alim.fibra || 0,
          sodium: alim.sodio || 0,
        },
      });
      mapaIds.set(alim.id, novo.id);
      mapaIds.set(alim.nome, novo.id);
    }
  }

  return mapaIds;
}

/**
 * Garante ou cria o paciente no banco de dados para associar a prescrição.
 */
async function garantirPaciente(
  pacienteId?: string,
  nome?: string,
  pesoKg?: number,
  alturaCm?: number,
  idade?: number,
  sexo?: string,
  objetivo?: string
): Promise<string> {
  if (pacienteId) {
    const existente = await prisma.patient.findUnique({
      where: { id: pacienteId },
    });
    if (existente) return existente.id;
  }

  // Se não existir paciente com o ID passado ou nenhum foi fornecido, procura pelo nome ou cria
  const nomeFinal = nome?.trim() || "Paciente Padrão";
  const pacienteExistente = await prisma.patient.findFirst({
    where: { name: nomeFinal },
  });

  if (pacienteExistente) {
    return pacienteExistente.id;
  }

  const novoPaciente = await prisma.patient.create({
    data: {
      name: nomeFinal,
      gender: sexo || "Masculino",
      age: idade || 30,
      height: (alturaCm || 175) / 100,
      currentWeight: pesoKg || 75,
      objective: objetivo || "Hipertrofia",
    },
  });

  return novoPaciente.id;
}

/**
 * Server Action Principal: Gera a Dieta e Opcionalmente Persiste no Banco de Dados
 */
export async function prescribeDietAction(
  input: PrescribeDietInput
): Promise<PrescribeDietResult> {
  try {
    const { biometria, anamnese, salvarNoBanco = true } = input;

    if (!biometria || !anamnese) {
      return {
        success: false,
        message: "Dados de biometria e anamnese são obrigatórios.",
        error: "INVALID_INPUT",
      };
    }

    // 1. Carregar alimentos disponíveis do banco (se houver) ou usar catálogo base
    let catalogoAlimentos: Alimento[] = [];
    try {
      const alimentosDb = await prisma.foodItem.findMany({ take: 100 });
      if (alimentosDb && alimentosDb.length > 0) {
        catalogoAlimentos = alimentosDb.map((f) => ({
          id: f.id,
          nome: f.name,
          categoria: f.category,
          baseQuantidade: f.baseQuantity,
          calorias: f.calories,
          proteina: f.protein,
          carboidrato: f.carbohydrate,
          gordura: f.lipid,
          fibra: f.fiber,
          sodio: f.sodium,
          source: f.source,
        }));
      }
    } catch {
      // Silenciosamente utiliza o catálogo estático caso o banco esteja vazio ou em inicialização
    }

    if (catalogoAlimentos.length === 0) {
      catalogoAlimentos = input.alimentosCustomizados || CATALOGO_ALIMENTOS_BASE;
    }

    // 2. Executar Motor Lógico Puro com Questionário de Acessibilidade e Anamnese Integrada
    const questAcessibilidade = input.questionarioAcessibilidade || anamnese.questionarioAcessibilidade;

    const plano: PlanoAlimentar = executarGeradorDietas({
      pacienteId: input.pacienteId,
      biometria,
      anamnese: {
        objetivo: anamnese.objetivo,
        nivelAtividade: anamnese.nivelAtividade,
        numeroRefeicoesDia: anamnese.numeroRefeicoesDia || 4,
        restricoes: anamnese.restricoes || {
          alergias: [],
          intolerancias: [],
          aversoes: [],
          estiloAlimentar: "onivoro",
        },
        modalidadeTreino: anamnese.modalidadeTreino,
        frequenciaSemanaTreino: anamnese.frequenciaSemanaTreino,
        duracaoTreinoMin: anamnese.duracaoTreinoMin,
        intensidadeTreino: anamnese.intensidadeTreino,
        horarioTreino: anamnese.horarioTreino,
        alimentosPreferidos: anamnese.alimentosPreferidos,
        consumoHidricoL: anamnese.consumoHidricoL,
        disponibilidadeCozinhar: anamnese.disponibilidadeCozinhar,
        observacoesClinicas: anamnese.observacoesClinicas,
        questionarioAcessibilidade: questAcessibilidade,
      },
      questionarioAcessibilidade: questAcessibilidade,
      catalogoAlimentos: catalogoAlimentos.length > 0 ? catalogoAlimentos : CATALOGO_ALIMENTOS_BASE,
    });

    // 3. Persistência Atômica no Prisma (Nested Writes) se solicitado
    let prescriptionId: string | undefined = undefined;

    if (salvarNoBanco) {
      // 3.1 Garantir o paciente
      const dbPatientId = await garantirPaciente(
        input.pacienteId,
        input.nomePaciente,
        biometria.pesoKg,
        biometria.alturaCm,
        biometria.idade,
        biometria.sexo,
        anamnese.objetivo
      );

      // 3.2 Garantir que todos os itens do plano existam no FoodItem
      const todosAlimentosUsados: Alimento[] = [];
      for (const ref of plano.refeicoes) {
        for (const it of ref.itens) {
          const enc = catalogoAlimentos.find((a) => a.id === it.alimentoId || a.nome === it.nome);
          if (enc) todosAlimentosUsados.push(enc);
        }
      }

      const mapaIdsAlimentos = await garantirAlimentosNoBanco(todosAlimentosUsados);

      // 3.3 Montar os dados aninhados para Nested Write no Prisma
      const itemsToCreate = plano.refeicoes.flatMap((ref) =>
        ref.itens.map((it) => {
          const dbFoodId = mapaIdsAlimentos.get(it.alimentoId) || mapaIdsAlimentos.get(it.nome);
          if (!dbFoodId) {
            throw new Error(`Alimento "${it.nome}" não pôde ser vinculado ao banco de dados.`);
          }
          return {
            mealName: ref.nome,
            mealTime: ref.horarioSugerido,
            foodItemId: dbFoodId,
            quantity: it.quantidadeG,
            calories: it.calorias,
            protein: it.proteina,
            carbohydrate: it.carboidrato,
            lipid: it.gordura,
            fiber: it.fibra,
            sodium: it.sodio,
          };
        })
      );

      // 3.4 Salvar prescrição e seus itens de forma atômica
      const prescricaoSalva = await prisma.dietaryPrescription.create({
        data: {
          patientId: dbPatientId,
          title: plano.titulo,
          targetKcal: plano.metasGlobais.calorias,
          targetProtein: plano.metasGlobais.proteinaG,
          targetCarb: plano.metasGlobais.carboidratoG,
          targetLipid: plano.metasGlobais.gorduraG,
          items: {
            create: itemsToCreate,
          },
        },
      });

      prescriptionId = prescricaoSalva.id;
      plano.persistedId = prescricaoSalva.id;
      plano.pacienteId = dbPatientId;
    }

    return {
      success: true,
      message: "Plano alimentar prescrito com sucesso!",
      plano,
      prescriptionId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erro desconhecido ao prescrever dieta.";
    console.error("[PrescribeDietAction Error]:", err);
    return {
      success: false,
      message: `Falha na geração da dieta: ${errorMsg}`,
      error: errorMsg,
    };
  }
}

/**
 * Server Action para buscar pacientes cadastrados
 */
export async function getPatientsAction() {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        gender: true,
        age: true,
        height: true,
        currentWeight: true,
        objective: true,
      },
      take: 50,
    });
    return { success: true, data: patients };
  } catch {
    return { success: false, data: [] };
  }
}

/**
 * Server Action para buscar o histórico de prescrições de um paciente
 */
export async function getPatientPrescriptionsAction(patientId: string) {
  try {
    const prescriptions = await prisma.dietaryPrescription.findMany({
      where: { patientId },
      include: {
        items: {
          include: {
            foodItem: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: prescriptions };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Server Action para carregar a Anamnese completa do paciente ativo
 * Servindo como a base de preferências, biometria e consumo para os geradores.
 */
export async function getPatientAnamneseAction(
  patientId?: string
): Promise<PacienteAnamneseDTO> {
  const targetId = patientId || "paulo-vitor-default";

  try {
    const p = await prisma.patient.findFirst({
      where: targetId ? { OR: [{ id: targetId }, { name: { contains: "Paulo" } }] } : undefined,
      orderBy: { createdAt: "desc" },
    });

    if (p) {
      // Mapeamento de Objetivo Clínico
      let obj: ObjetivoClinico = "emagrecimento";
      const objLower = (p.objective || "").toLowerCase();
      if (objLower.includes("hipertrofia") || objLower.includes("massa")) obj = "hipertrofia";
      else if (objLower.includes("manuten")) obj = "manutencao";
      else if (objLower.includes("recomposi")) obj = "recomposicao";
      else if (objLower.includes("performance") || objLower.includes("atleta")) obj = "performance";
      else if (objLower.includes("keto") || objLower.includes("ceto")) obj = "cetogenica";
      else if (objLower.includes("lowcarb")) obj = "lowcarb";

      // Mapeamento de Nível de Atividade
      let nivel: NivelAtividade = "alto";
      const neatLower = (p.neatRoutine || "").toLowerCase();
      const freqLower = (p.workoutFrequency || "").toLowerCase();
      if (freqLower.includes("6x") || freqLower.includes("7x") || p.patientType === "Atleta") {
        nivel = "alto";
      } else if (freqLower.includes("4x") || freqLower.includes("5x")) {
        nivel = "moderado";
      } else if (neatLower.includes("leve") || freqLower.includes("2x")) {
        nivel = "leve";
      }

      // Mapeamento de Modalidade de Treino (Puras + Híbridas)
      let modTreino: ModalidadeTreino = "musculacao";
      const modLower = (p.mainModality || "").toLowerCase();
      if (modLower.includes("metcon") || modLower.includes("condicionamento metab")) modTreino = "metcon_hibrido";
      else if (modLower.includes("hyrox") || modLower.includes("racing") || modLower.includes("skierg")) modTreino = "hyrox";
      else if (modLower.includes("crossfit")) modTreino = "crossfit";
      else if (modLower.includes("triathlon")) modTreino = "triathlon";
      else if (modLower.includes("corrida") && modLower.includes("forca")) modTreino = "running_musculacao";
      else if (modLower.includes("hiit")) modTreino = "hiit_forca";
      else if (modLower.includes("corrida")) modTreino = "corrida";
      else if (modLower.includes("ciclismo") && modLower.includes("forca")) modTreino = "ciclismo_forca";
      else if (modLower.includes("ciclismo")) modTreino = "ciclismo";
      else if (modLower.includes("natacao")) modTreino = "natacao";
      else if (modLower.includes("luta") || modLower.includes("marciais")) modTreino = "artes_marciais";
      else if (modLower.includes("funcional")) modTreino = "funcional_misto";
      else if (modLower.includes("coletivo") || modLower.includes("futebol")) modTreino = "esportes_coletivos";

      const freqNum = parseInt(p.workoutFrequency?.replace(/\D/g, "") || "6", 10) || 5;

      return {
        id: p.id,
        nome: p.name,
        email: p.email || undefined,
        telefone: p.phone || undefined,
        biometria: {
          pesoKg: Number(p.currentWeight || 116),
          alturaCm: Math.round(Number(p.height > 3 ? p.height : p.height * 100) || 196),
          idade: Number(p.age || 38),
          sexo: p.gender === "Feminino" ? "Feminino" : "Masculino",
          percentualGordura: 14,
        },
        anamnese: {
          objetivo: obj,
          nivelAtividade: nivel,
          numeroRefeicoesDia: 4,
          restricoes: {
            alergias: [],
            intolerancias: ["Lactose"],
            aversoes: ["Fígado", "Moela"],
            estiloAlimentar: "onivoro",
          },
          horarioTreino: "17:30",
          modalidadeTreino: modTreino,
          frequenciaSemanaTreino: freqNum,
          duracaoTreinoMin: 60,
          intensidadeTreino: p.cardioIntensity || "Alta",
          observacoesClinicas: "Meta: Queima lipídica com preservação máxima de massa magra.",
          alimentosPreferidos: [
            "Peito de Frango",
            "Arroz Branco",
            "Feijão Carioca",
            "Ovos Inteiros",
            "Banana",
            "Aveia",
            "Café",
          ],
          consumoHidricoL: 4.0,
          disponibilidadeCozinhar: "Moderada",
          quemPreparaRefeicoes: "O próprio paciente",
          habitoIntestinal: "Regular (1x a 2x/dia)",
          rotinaNeat: p.neatRoutine || "Moderado",
          horasSono: 7.5,
          qualidadeSono: p.sleepQuality || "Boa",
          nivelEstresse: p.stressLevel || "Moderado",
          patologiasClinicas: [],
          questionarioAcessibilidade: {
            orcamento: "economico",
            ambienteConsumo: "com_geladeira_microondas",
            aceitaSuplementos: true,
            alimentosAcessiveis: [
              { alimentoId: "p_frango", status: "alta_disponibilidade" },
              { alimentoId: "p_ovo_inteiro", status: "alta_disponibilidade" },
              { alimentoId: "p_sardinha", status: "alta_disponibilidade" },
              { alimentoId: "c_arroz_branco", status: "alta_disponibilidade" },
              { alimentoId: "c_feijao", status: "alta_disponibilidade" },
              { alimentoId: "c_aveia", status: "alta_disponibilidade" },
              { alimentoId: "f_banana", status: "alta_disponibilidade" },
              { alimentoId: "c_batata_inglesa", status: "alta_disponibilidade" },
            ],
          },
        },
        fonteIntegracao: "PRISMA_DB",
      };
    }
  } catch (err) {
    console.warn("[getPatientAnamneseAction] Fallback para perfil canônico:", err);
  }

  // Fallback Canônico: Paulo Vitor R de Sousa (Padrão de excelência clínica NutriAx Pro)
  return {
    id: "paulo-vitor-default",
    nome: "Paulo Vitor R de Sousa",
    email: "paulo.vitor@nutriax.com",
    biometria: {
      pesoKg: 116.0,
      alturaCm: 196,
      idade: 38,
      sexo: "Masculino",
      percentualGordura: 14,
    },
    anamnese: {
      objetivo: "emagrecimento",
      nivelAtividade: "alto",
      numeroRefeicoesDia: 4,
      restricoes: {
        alergias: [],
        intolerancias: ["Lactose"],
        aversoes: ["Fígado", "Moela"],
        estiloAlimentar: "onivoro",
      },
      horarioTreino: "17:30",
      modalidadeTreino: "musculacao",
      frequenciaSemanaTreino: 6,
      duracaoTreinoMin: 60,
      intensidadeTreino: "Alta",
      observacoesClinicas: "Meta: Queima lipídica com preservação máxima de massa magra.",
      alimentosPreferidos: [
        "Peito de Frango",
        "Arroz Branco",
        "Feijão Carioca",
        "Ovos Inteiros",
        "Banana",
        "Aveia",
        "Café",
      ],
      consumoHidricoL: 4.0,
      disponibilidadeCozinhar: "Moderada",
      quemPreparaRefeicoes: "O próprio paciente",
      habitoIntestinal: "Regular (1x a 2x/dia)",
      rotinaNeat: "Moderado",
      horasSono: 7.5,
      qualidadeSono: "Boa",
      nivelEstresse: "Moderado",
      questionarioAcessibilidade: {
        orcamento: "economico",
        ambienteConsumo: "com_geladeira_microondas",
        aceitaSuplementos: true,
        alimentosAcessiveis: [
          { alimentoId: "p_frango", status: "alta_disponibilidade" },
          { alimentoId: "p_ovo_inteiro", status: "alta_disponibilidade" },
          { alimentoId: "p_sardinha", status: "alta_disponibilidade" },
          { alimentoId: "c_arroz_branco", status: "alta_disponibilidade" },
          { alimentoId: "c_feijao", status: "alta_disponibilidade" },
          { alimentoId: "c_aveia", status: "alta_disponibilidade" },
          { alimentoId: "f_banana", status: "alta_disponibilidade" },
          { alimentoId: "c_batata_inglesa", status: "alta_disponibilidade" },
        ],
      },
    },
    fonteIntegracao: "CANONICAL_DEFAULT",
  };
}
