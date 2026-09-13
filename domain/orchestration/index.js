/**
 * domain/orchestration/index.js
 * 
 * Ponto Único de Exportação do Subsistema de Orquestração da Prescrição — NutriAx Pro.
 * Fase N3.7.1 — Orquestrador Canônico do Pipeline Nutricional Determinístico.
 * 
 * Camada Pura — Sem I/O de infraestrutura, sem persistência externa, sem dependências remotas.
 */

'use strict';

const prescriptionOrchestrator = require('./prescriptionOrchestrator');

const orchestrationSubsystem = {
  PIPELINE_STEP: prescriptionOrchestrator.PIPELINE_STEP,
  ORCHESTRATOR_STATUS: prescriptionOrchestrator.ORCHESTRATOR_STATUS,
  validateOrchestratorInput: prescriptionOrchestrator.validateOrchestratorInput,
  executePrescriptionPipelineSync: prescriptionOrchestrator.executePrescriptionPipelineSync,
  executePrescriptionPipeline: prescriptionOrchestrator.executePrescriptionPipeline,
  deepFreeze: prescriptionOrchestrator.deepFreeze,
  cloneDeepPure: prescriptionOrchestrator.cloneDeepPure
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = orchestrationSubsystem;
}

if (typeof globalThis !== 'undefined') {
  globalThis.NutriDomain = globalThis.NutriDomain || {};
  globalThis.NutriDomain.orchestration = orchestrationSubsystem;
}
