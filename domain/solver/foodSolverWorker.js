/**
 * domain/solver/foodSolverWorker.js
 * 
 * Web Worker Puro para o Food Solver Canônico (N3.2).
 * NutriAx Pro — Fase N3.7.5.
 * 
 * Executa a busca combinatória de alimentos em uma thread dedicada (Web Worker)
 * para evitar qualquer bloqueio do Event Loop da UI na thread principal.
 * 
 * Sem dependências externas, sem mutação de regras clínicas.
 */

'use strict';

// Carrega o domínio canônico no escopo do Worker se disponível
if (typeof importScripts === 'function') {
  try {
    // Caminho relativo a partir de domain/solver/foodSolverWorker.js
    importScripts('../browserBridge.js');
  } catch (err1) {
    try {
      // Fallback para caminhos absolutos ou relativos à raiz
      importScripts('/domain/browserBridge.js');
    } catch (err2) {
      // Se não carregar via importScripts, o solver pode ter sido injetado
    }
  }
}

/**
 * Resolve a função solveNutritionDiet no contexto do Worker
 */
function getWorkerSolver() {
  if (typeof self !== 'undefined' && self.NutriDomain && self.NutriDomain.solver && typeof self.NutriDomain.solver.solveNutritionDiet === 'function') {
    return self.NutriDomain.solver.solveNutritionDiet;
  }
  if (typeof solveNutritionDiet === 'function') {
    return solveNutritionDiet;
  }
  if (typeof require === 'function') {
    try {
      const solverModule = require('./foodSolver');
      return solverModule.solveNutritionDiet;
    } catch (e) {}
  }
  return null;
}

/**
 * Processador central de mensagens do Worker.
 * Exportado para permitir testes determinísticos unitários em Node.js.
 */
function handleWorkerMessage(data, postMessageFn) {
  const { type, correlationId, payload } = data || {};

  if (type === 'PING') {
    postMessageFn({ type: 'PONG', correlationId, ok: true });
    return;
  }

  if (type === 'SOLVE') {
    try {
      const solver = getWorkerSolver();
      if (!solver) {
        postMessageFn({
          type: 'SOLVE_ERROR',
          correlationId,
          error: {
            code: 'SOLVER_UNAVAILABLE',
            message: 'Motor Food Solver determinístico não disponível no contexto do Worker.'
          }
        });
        return;
      }

      const { input, customPolicy } = payload || {};
      const result = solver(input, customPolicy);

      postMessageFn({
        type: 'SOLVE_SUCCESS',
        correlationId,
        result
      });
    } catch (err) {
      postMessageFn({
        type: 'SOLVE_ERROR',
        correlationId,
        error: {
          code: 'SOLVER_EXECUTION_EXCEPTION',
          message: err && err.message ? err.message : String(err),
          stack: err && err.stack ? err.stack : null
        }
      });
    }
    return;
  }

  postMessageFn({
    type: 'UNKNOWN_COMMAND',
    correlationId,
    error: {
      code: 'UNSUPPORTED_MESSAGE_TYPE',
      message: `Tipo de mensagem desconhecido: ${type}`
    }
  });
}

// Configura o listener no ambiente do Worker
if (typeof self !== 'undefined' && typeof self.addEventListener === 'function') {
  self.addEventListener('message', function(event) {
    handleWorkerMessage(event.data, function(response) {
      self.postMessage(response);
    });
  });
}

// Export para Node.js / Suíte de testes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleWorkerMessage,
    getWorkerSolver
  };
}
