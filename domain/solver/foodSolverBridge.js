/**
 * domain/solver/foodSolverBridge.js
 * 
 * Despachante Não-Bloqueante do Food Solver Determinístico Canônico (N3.2).
 * NutriAx Pro — Fase N3.7.5.
 * 
 * Fornece interface unificada e segura para execução assíncrona do solver:
 * - Em ambientes com Web Worker (Browser com suporte): executa fora da thread da UI.
 * - Em ambientes sem Web Worker (Node.js, SSR, ou fallback de segurança): executa
 *   de forma determinística in-process sem quebrar o fluxo.
 * - Suporta timeout configurável e cancelamento seguro.
 * 
 * Camada Pura de Domínio — Sem dependências externas de framework.
 */

'use strict';

const { solveNutritionDiet } = require('./foodSolver');

let activeWorker = null;
let pendingRequests = new Map();
let correlationCounter = 0;

/**
 * Verifica se o ambiente atual suporta Web Workers
 * @returns {boolean}
 */
function isWorkerSupported() {
  return typeof Worker !== 'undefined';
}

/**
 * Resolve a URL do worker dependendo do contexto do runtime
 * @param {string} [customUrl]
 * @returns {string}
 */
function resolveWorkerUrl(customUrl) {
  if (customUrl) return customUrl;
  if (typeof location !== 'undefined' && location.href) {
    // No ambiente do pro/index.html
    return '../domain/solver/foodSolverWorker.js';
  }
  return './foodSolverWorker.js';
}

/**
 * Inicializa ou retorna a instância do Worker compartilhado
 * @param {string} [workerUrl]
 * @returns {Worker}
 */
function getOrCreateWorker(workerUrl) {
  if (activeWorker) return activeWorker;

  const url = resolveWorkerUrl(workerUrl);
  const worker = new Worker(url);

  worker.onmessage = function(event) {
    const { type, correlationId, result, error } = event.data || {};
    const pending = pendingRequests.get(correlationId);
    if (!pending) return;

    pendingRequests.delete(correlationId);
    if (pending.timeoutTimer) {
      clearTimeout(pending.timeoutTimer);
    }

    if (type === 'SOLVE_SUCCESS') {
      pending.resolve(result);
    } else {
      const err = new Error(error?.message || 'Falha na execução do Worker do Food Solver.');
      err.code = error?.code || 'WORKER_SOLVE_FAILED';
      err.stack = error?.stack || err.stack;
      pending.reject(err);
    }
  };

  worker.onerror = function(event) {
    // Rejeita todas as requisições pendentes em caso de erro fatal do worker
    const errMsg = event && event.message ? event.message : 'Erro no Web Worker do Food Solver.';
    for (const [id, pending] of pendingRequests.entries()) {
      if (pending.timeoutTimer) clearTimeout(pending.timeoutTimer);
      const err = new Error(errMsg);
      err.code = 'WORKER_FATAL_ERROR';
      pending.reject(err);
    }
    pendingRequests.clear();
    activeWorker = null;
  };

  activeWorker = worker;
  return activeWorker;
}

/**
 * Encerra o worker ativo e cancela todas as requisições pendentes
 */
function terminateWorker() {
  if (activeWorker) {
    try {
      activeWorker.terminate();
    } catch (e) {}
    activeWorker = null;
  }
  for (const [id, pending] of pendingRequests.entries()) {
    if (pending.timeoutTimer) clearTimeout(pending.timeoutTimer);
    const err = new Error('Operação do Food Solver cancelada: Worker encerrado.');
    err.code = 'WORKER_TERMINATED';
    pending.reject(err);
  }
  pendingRequests.clear();
}

/**
 * Executa o solver de forma síncrona diretamente (in-process).
 * Útil para testes em Node.js ou quando o consumidor exige retorno imediato.
 * 
 * @param {Object} input - DTO de entrada do solver
 * @param {Object} [customPolicy] - Política customizada opcional
 * @returns {Object} FoodSolverResultDTO
 */
function solveNutritionDietSync(input, customPolicy = {}) {
  return solveNutritionDiet(input, customPolicy);
}

/**
 * Executa o solver de forma assíncrona, usando Web Worker quando disponível
 * ou agendamento não-bloqueante in-process como fallback seguro.
 * 
 * @param {Object} input - DTO de entrada do solver
 * @param {Object} [customPolicy] - Política customizada opcional
 * @param {Object} [options] - Opções de execução ({ timeoutMs, preferWorker, workerUrl, fallbackOnTimeout })
 * @returns {Promise<Object>} Promessa resolvida com FoodSolverResultDTO
 */
async function solveNutritionDietAsync(input, customPolicy = {}, options = {}) {
  const timeoutMs = typeof options.timeoutMs === 'number' && options.timeoutMs > 0
    ? options.timeoutMs
    : 10000;
  const preferWorker = options.preferWorker !== false;
  const fallbackOnTimeout = options.fallbackOnTimeout !== false;

  // Se não estiver no browser ou se worker não for preferido / suportado:
  if (!preferWorker || !isWorkerSupported()) {
    return new Promise((resolve, reject) => {
      // Usa setImmediate (Node) ou setTimeout (Browser) para descolar da pilha atual
      const schedule = typeof setImmediate === 'function' ? setImmediate : (fn) => setTimeout(fn, 0);
      schedule(() => {
        try {
          const result = solveNutritionDiet(input, customPolicy);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  // No Browser com suporte a Web Worker:
  return new Promise((resolve, reject) => {
    let worker;
    try {
      worker = getOrCreateWorker(options.workerUrl);
    } catch (createErr) {
      // Fallback seguro se new Worker falhar (ex: restrição de file:// ou CSP)
      console.warn('[foodSolverBridge] Falha ao instanciar Web Worker, usando execução síncrona controlada:', createErr.message);
      try {
        const result = solveNutritionDiet(input, customPolicy);
        return resolve(result);
      } catch (syncErr) {
        return reject(syncErr);
      }
    }

    const correlationId = `solver_req_${++correlationCounter}`;

    const timeoutTimer = setTimeout(() => {
      pendingRequests.delete(correlationId);
      // Se houver timeout do worker, recria o worker para limpar estado
      terminateWorker();

      if (fallbackOnTimeout) {
        console.warn(`[foodSolverBridge] Timeout do Worker (${timeoutMs}ms) atingido. Executando fallback controlado.`);
        try {
          const fallbackResult = solveNutritionDiet(input, customPolicy);
          resolve(fallbackResult);
        } catch (fbErr) {
          reject(fbErr);
        }
      } else {
        const timeoutErr = new Error(`Tempo limite de busca do Food Solver atingido (${timeoutMs}ms).`);
        timeoutErr.code = 'WORKER_TIMEOUT';
        reject(timeoutErr);
      }
    }, timeoutMs);

    pendingRequests.set(correlationId, {
      resolve,
      reject,
      timeoutTimer
    });

    try {
      worker.postMessage({
        type: 'SOLVE',
        correlationId,
        payload: {
          input,
          customPolicy
        }
      });
    } catch (postErr) {
      clearTimeout(timeoutTimer);
      pendingRequests.delete(correlationId);
      // Fallback imediato se o postMessage falhar
      try {
        const result = solveNutritionDiet(input, customPolicy);
        resolve(result);
      } catch (fbErr) {
        reject(fbErr);
      }
    }
  });
}

const foodSolverBridge = {
  isWorkerSupported,
  getOrCreateWorker,
  terminateWorker,
  solveNutritionDietSync,
  solveNutritionDietAsync
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = foodSolverBridge;
}

if (typeof globalThis !== 'undefined') {
  globalThis.NutriDomain = globalThis.NutriDomain || {};
  globalThis.NutriDomain.solverBridge = foodSolverBridge;
}
