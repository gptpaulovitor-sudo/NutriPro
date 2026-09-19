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

    // 2. Executar Motor Lógico Puro com Questionário de Acessibilidade
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
        questionarioAcessibilidade: questAcessibilidade,
      },
      questionarioAcessibilidade: questAcessibilidade,
      catalogoAlimentos: CATALOGO_ALIMENTOS_BASE,
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
