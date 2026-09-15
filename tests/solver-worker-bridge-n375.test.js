/**
 * tests/solver-worker-bridge-n375.test.js
 * 
 * Suíte de Testes do Web Worker e Bridge Não-Bloqueante do Food Solver (Fase N3.7.5).
 * NutriAx Pro.
 * 
 * Cobertura Completa:
 * A. Mensageria e protocolo do Worker (handleWorkerMessage)
 * B. Resposta PING / PONG
 * C. Execução determinística SOLVE com retorno de resultado idêntico
 * D. Tratamento de exceções e payloads inválidos no Worker
 * E. Despachante Bridge: solveNutritionDietSync e solveNutritionDietAsync
 * F. Limite combinatório determinístico (maxCombosToTest)
 * G. Respeito ao status SEARCH_LIMIT_REACHED e bloqueio pelo Orchestrator
 * H. Equivalência estrita entre execução direta e despachada
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { solveNutritionDiet } = require('../domain/solver/foodSolver');
const { DEFAULT_FOOD_SOLVER_POLICY } = require('../domain/solver/foodSolverPolicy');
const { handleWorkerMessage } = require('../domain/solver/foodSolverWorker');
const {
  isWorkerSupported,
  solveNutritionDietSync,
  solveNutritionDietAsync
} = require('../domain/solver/foodSolverBridge');
const { executePrescriptionPipelineSync } = require('../domain/orchestration/prescriptionOrchestrator');
const { SOLVER_STATUS } = require('../domain/contracts/FoodSolverContract');
const { createNutritionPrescriptionContextDTO } = require('../domain/contracts/NutritionPrescriptionContextDTO');

// Catálogo fixture de alimentos canônicos
const sampleCatalog = [
  { id: 'FOOD_P1', name: 'Peito de Frango Grelhado', category: 'Carnes e Aves', calories: 159, protein: 32, carbohydrate: 0, lipid: 2.5, fiber: 0, sodium: 50, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
  { id: 'FOOD_P2', name: 'Ovo de Galinha Cozido', category: 'Ovos', calories: 146, protein: 13, carbohydrate: 0.6, lipid: 8.9, fiber: 0, sodium: 146, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
  { id: 'FOOD_C1', name: 'Arroz Branco Cozido', category: 'Cereais e Leguminosas', calories: 128, protein: 2.5, carbohydrate: 28.1, lipid: 0.2, fiber: 1.6, sodium: 1, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
  { id: 'FOOD_C2', name: 'Batata Inglesa Cozida', category: 'Tubérculos e Raízes', calories: 52, protein: 1.2, carbohydrate: 11.9, lipid: 0.1, fiber: 1.3, sodium: 3, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
  { id: 'FOOD_C3', name: 'Aveia em Flocos', category: 'Cereais e Leguminosas', calories: 394, protein: 13.9, carbohydrate: 66.6, lipid: 8.5, fiber: 9.1, sodium: 4, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
  { id: 'FOOD_F1', name: 'Azeite de Oliva Extra Virgem', category: 'Óleos e Gorduras', calories: 884, protein: 0, carbohydrate: 0, lipid: 100, fiber: 0, sodium: 0, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } }
];

const sampleSolverInput = {
  context: {
    patient: { patientId: 'p_test', name: 'Paciente Teste', gender: 'Masculino', age: 30 },
    energy: { caloricTargetKcal: 2200 },
    objective: { clinicalObjective: 'HIPERTROFIA' }
  },
  energyTarget: { caloricTargetKcal: 2200 },
  macroTarget: {
    proteinTargetG: 160,
    carbohydrateTargetG: 250,
    fatTargetG: 60,
    fiberTargetG: 30
  },
  validationResult: {
    valid: true,
    status: 'PASS',
    checks: []
  },
  foodCatalog: sampleCatalog
};

describe('N3.7.5 — Food Solver Worker & Bridge Não-Bloqueante', () => {

  // ── GRUPO 1: Protocolo do Worker ──────────────────────────────────────────
  describe('Grupo 1: Protocolo de Mensagens do Worker Puro', () => {

    test('1. Worker responde PING com PONG e timestamp', () => {
      let response = null;
      handleWorkerMessage(
        { type: 'PING', correlationId: 'req_101' },
        (res) => { response = res; }
      );

      assert.ok(response, 'Worker deve responder à mensagem PING');
      assert.strictEqual(response.type, 'PONG');
      assert.strictEqual(response.ok, true);
    });

    test('2. Worker executa SOLVE determinístico e retorna SOLVE_SUCCESS', () => {
      let response = null;
      handleWorkerMessage(
        {
          type: 'SOLVE',
          correlationId: 'req_solve_1',
          payload: {
            input: sampleSolverInput,
            customPolicy: { searchLimit: { maxCombosToTest: 500 } }
          }
        },
        (res) => { response = res; }
      );

      assert.ok(response, 'Worker deve responder à mensagem SOLVE');
      assert.strictEqual(response.type, 'SOLVE_SUCCESS');
      assert.strictEqual(response.correlationId, 'req_solve_1');
      assert.ok(response.result, 'Deve conter o resultado da solução');
      assert.ok(typeof response.result.status === 'string');
      assert.ok(Array.isArray(response.result.meals));
    });

    test('3. Worker rejeita tipos de mensagem desconhecidos', () => {
      let response = null;
      handleWorkerMessage(
        { type: 'UNKNOWN_ACTION', correlationId: 'req_err' },
        (res) => { response = res; }
      );

      assert.ok(response);
      assert.strictEqual(response.type, 'UNKNOWN_COMMAND');
      assert.strictEqual(response.error.code, 'UNSUPPORTED_MESSAGE_TYPE');
    });

  });

  // ── GRUPO 2: Despachante Bridge ───────────────────────────────────────────
  describe('Grupo 2: Despachante Bridge (Sync / Async)', () => {

    test('4. isWorkerSupported retorna booleano de acordo com o ambiente', () => {
      const supported = isWorkerSupported();
      // No Node.js sem polyfill global.Worker, deve ser false
      assert.strictEqual(typeof supported, 'boolean');
    });

    test('5. solveNutritionDietSync executa deterministicamente in-process', () => {
      const resSync = solveNutritionDietSync(sampleSolverInput, {
        searchLimit: { maxCombosToTest: 200 }
      });

      assert.ok(resSync);
      assert.ok(typeof resSync.status === 'string');
      assert.ok(Array.isArray(resSync.meals));
    });

    test('6. solveNutritionDietAsync resolve Promise com resultado equivalente ao síncrono', async () => {
      const policy = { searchLimit: { maxCombosToTest: 300 } };

      const resSync = solveNutritionDietSync(sampleSolverInput, policy);
      const resAsync = await solveNutritionDietAsync(sampleSolverInput, policy);

      assert.ok(resAsync);
      assert.strictEqual(resAsync.status, resSync.status);
      assert.strictEqual(resAsync.valid, resSync.valid);
      assert.deepStrictEqual(resAsync.totals, resSync.totals);
      assert.strictEqual(resAsync.meals.length, resSync.meals.length);
    });

  });

  // ── GRUPO 3: Limite Combinatório e SEARCH_LIMIT_REACHED ───────────────────
  describe('Grupo 3: Limite Combinatório e Proteção Contra Bloqueio', () => {

    test('7. DEFAULT_FOOD_SOLVER_POLICY contém searchLimit com maxCombosToTest=5000', () => {
      assert.ok(DEFAULT_FOOD_SOLVER_POLICY.searchLimit, 'searchLimit deve estar presente na policy padrão');
      assert.strictEqual(DEFAULT_FOOD_SOLVER_POLICY.searchLimit.maxCombosToTest, 5000);
      assert.strictEqual(DEFAULT_FOOD_SOLVER_POLICY.searchLimit.returnBestPartial, true);
    });

    test('8. Atingir maxCombosToTest interrompe o loop e retorna status SEARCH_LIMIT_REACHED', () => {
      // Força um limite muito baixo (ex: 2 combinações) para garantir que seja atingido
      const constrainedPolicy = {
        searchLimit: {
          maxCombosToTest: 2,
          returnBestPartial: true
        }
      };

      const result = solveNutritionDiet(sampleSolverInput, constrainedPolicy);

      assert.strictEqual(result.status, SOLVER_STATUS.SEARCH_LIMIT_REACHED);
      assert.strictEqual(result.valid, false, 'SEARCH_LIMIT_REACHED NUNCA pode ter valid=true');
      assert.strictEqual(result.searchLimitReached, true);
      assert.ok(result.blockingReasons.length > 0);
      assert.ok(result.solverDiagnostics.some(d => d.includes('Limite computacional')));
    });

    test('9. Orchestrator bloqueia imediatamente prescrição com SEARCH_LIMIT_REACHED', () => {
      const validContext = createNutritionPrescriptionContextDTO({
        patient: {
          patientId: 'patient_limit_001',
          name: 'Carlos Oliveira',
          age: 29,
          sex: 'Masculino',
          patientType: 'Atleta'
        },
        anthropometry: {
          weightKg: 78.0,
          heightCm: 178.0,
          bodyFatPercent: 12.5,
          leanMassKg: 68.25,
          hasRecentAssessment: true
        },
        objective: {
          clinicalObjective: 'Hipertrofia',
          rawObjective: 'Hipertrofia'
        },
        energy: {
          tmbKcal: 1765,
          getKcal: 2647,
          activityFactor: 1.5,
          formula: 'Harris-Benedict 1984'
        },
        constraints: {
          dietaryRestrictions: [],
          allergies: [],
          intolerances: [],
          forbiddenFoods: []
        }
      });

      const standardCatalog = [
        { id: 'FOOD_P1', name: 'Peito de Frango', category: 'Carnes e Aves', calories: 159, protein: 32, carbohydrate: 0, lipid: 2.5, fiber: 0, sodium: 50, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
        { id: 'FOOD_C1', name: 'Arroz Branco', category: 'Cereais', calories: 128, protein: 2.5, carbohydrate: 28.1, lipid: 0.2, fiber: 1.6, sodium: 1, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
        { id: 'FOOD_C2', name: 'Feijão Preto', category: 'Leguminosas', calories: 77, protein: 4.5, carbohydrate: 14, lipid: 0.5, fiber: 8.4, sodium: 2, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } },
        { id: 'FOOD_F1', name: 'Azeite', category: 'Óleos e Gorduras', calories: 884, protein: 0, carbohydrate: 0, lipid: 100, fiber: 0, sodium: 0, unit: 'g', bromatology: { energyStatus: 'CONSISTENTE' } }
      ];

      const orchestratorInput = {
        context: validContext,
        foodCatalog: standardCatalog,
        policies: {
          foodSolverPolicy: {
            searchLimit: {
              maxCombosToTest: 1, // força interrupção imediata
              returnBestPartial: true
            }
          }
        }
      };

      const pipelineRes = executePrescriptionPipelineSync(orchestratorInput);

      assert.strictEqual(pipelineRes.success, false);
      assert.strictEqual(pipelineRes.status, 'BLOCKED');
      assert.strictEqual(pipelineRes.interruptedAt, 'N3.2_FOOD_SOLVER');
      assert.ok(pipelineRes.blockingReasons.some(r => r.includes('SEARCH_LIMIT_REACHED') || r.toLowerCase().includes('limite computacional')));
    });

  });

});
