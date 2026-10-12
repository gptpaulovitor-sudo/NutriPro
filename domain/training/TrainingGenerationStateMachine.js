/**
 * domain/training/TrainingGenerationStateMachine.js
 * 
 * Máquina de Estados Explícita para a Geração Resiliente de Treinos.
 * Orquestra o ciclo de vida completo entre IA Generativa (Gemini) e
 * Motor Determinístico de Contingência com diferenciação rigorosa de erros:
 * - HTTP 503 / 502 / 500 (Alta demanda / Capacidade) -> Backoff exponencial com jitter
 * - HTTP 429 (Quota excedida) -> Rotação imediata ou contingência sem repetição abusiva
 * - Autenticação / 401 / 403 -> Contingência com aviso de configuração
 * - Timeout (>90s) / Falha de conexão -> Contingência
 * - Resposta inválida / JSON corrompido -> Contingência
 * 
 * Camada de Domínio Puro — Sem dependência de DOM, Dexie ou Firebase.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./DeterministicTrainingGenerator')
    );
  } else {
    root.NutriDomain = root.NutriDomain || {};
    root.NutriDomain.TrainingGenerationStateMachine = factory(
      root.NutriDomain.DeterministicTrainingGenerator
    );
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (DeterministicTrainingGenerator) {
  'use strict';

  /**
   * Estados formais do ciclo de vida da geração
   */
  const STATES = Object.freeze({
    IDLE: 'IDLE',
    REQUESTING_AI: 'REQUESTING_AI',
    RETRYING_AI: 'RETRYING_AI',
    FALLBACK_CONTINGENCY: 'FALLBACK_CONTINGENCY',
    VALIDATING: 'VALIDATING',
    READY: 'READY',
    ERROR: 'ERROR'
  });

  /**
   * Classificação taxonômica das falhas
   */
  const ERROR_TYPES = Object.freeze({
    CAPACITY_503: 'CAPACITY_503',         // HTTP 503, 502, 500, overload
    RATE_LIMIT_429: 'RATE_LIMIT_429',     // HTTP 429, quota exceeded
    AUTH_CONFIG: 'AUTH_CONFIG',           // HTTP 401, 403, missing API key
    TIMEOUT_NETWORK: 'TIMEOUT_NETWORK',   // AbortError, connection refused, offline
    INVALID_RESPONSE: 'INVALID_RESPONSE', // Non-JSON, corrupted parts, schema violation
    FATAL_PROFILE: 'FATAL_PROFILE',       // Missing patient or empty vital data
    UNKNOWN: 'UNKNOWN'
  });

  /**
   * Classifica rigorosamente um erro recebido
   * @param {Error|Object|string} error 
   * @returns {string} Código do ERROR_TYPES
   */
  function classifyError(error) {
    if (!error) return ERROR_TYPES.UNKNOWN;

    const msg = String(error.message || error).toLowerCase();
    const status = error.status || error.statusCode;

    if (error.isQuotaError || status === 429 || msg.includes('429') || msg.includes('quota')) {
      return ERROR_TYPES.RATE_LIMIT_429;
    }

    if (error.isCapacityError || status === 503 || status === 502 || status === 500 ||
        msg.includes('503') || msg.includes('502') || msg.includes('500') ||
        msg.includes('high demand') || msg.includes('alta demanda') || msg.includes('overloaded')) {
      return ERROR_TYPES.CAPACITY_503;
    }

    if (status === 401 || status === 403 || msg.includes('401') || msg.includes('403') ||
        msg.includes('chave') || msg.includes('api key') || msg.includes('autentica') || msg.includes('acesso negado')) {
      return ERROR_TYPES.AUTH_CONFIG;
    }

    if (error.isTimeout || msg.includes('timeout') || msg.includes('excedeu') ||
        msg.includes('abort') || msg.includes('conexão') || msg.includes('network') ||
        msg.includes('failed to fetch') || msg.includes('offline')) {
      return ERROR_TYPES.TIMEOUT_NETWORK;
    }

    if (msg.includes('json') || msg.includes('resposta não') || msg.includes('resposta vazia') || msg.includes('incompatível')) {
      return ERROR_TYPES.INVALID_RESPONSE;
    }

    if (msg.includes('não encontrado') || msg.includes('dados insuficientes') || msg.includes('patientid ausente')) {
      return ERROR_TYPES.FATAL_PROFILE;
    }

    return ERROR_TYPES.UNKNOWN;
  }

  /**
   * Calcula delay de espera com backoff exponencial e jitter (aleatoriedade para desempate)
   * @param {number} attemptIndex - 0, 1, 2...
   * @param {number} baseDelayMs - Padrão 1000ms
   * @param {number} maxJitterMs - Padrão 350ms
   * @returns {number} Milissegundos a aguardar
   */
  function calculateBackoffWithJitter(attemptIndex = 0, baseDelayMs = 1000, maxJitterMs = 350) {
    const exponential = baseDelayMs * Math.pow(2, attemptIndex);
    const jitter = Math.floor(Math.random() * maxJitterMs);
    return exponential + jitter;
  }

  /**
   * Instância ou orquestrador da Máquina de Estados
   */
  class TrainingGenerationStateMachine {
    constructor(options = {}) {
      this.state = STATES.IDLE;
      this.history = [];
      this.listeners = [];
      const maxRetries = options.maxRetries != null ? Number(options.maxRetries) : 2;
      const initialBackoff = options.initialBackoffMs != null ? Number(options.initialBackoffMs) : (options.baseBackoffMs || 1000);
      this.options = {
        maxAiAttempts: options.maxAiAttempts || (maxRetries + 1),
        baseBackoffMs: initialBackoff,
        maxJitterMs: options.maxJitterMs != null ? options.maxJitterMs : 350,
        enableContingencyFallback: options.enableContingencyFallback !== false,
        onStateChange: options.onStateChange || null,
        sleepFn: options.sleepFn || ((ms) => new Promise(r => setTimeout(r, ms))),
        ...options
      };
      this.currentAttempt = 0;
      this.lastError = null;
      this.lastErrorType = null;
      this.generationSource = null;
      this.prescription = null;
      this.context = null;
      this.warnings = [];
      this.errors = [];
    }

    getState() {
      return this.state;
    }

    subscribe(listener) {
      if (typeof listener === 'function') {
        this.listeners.push(listener);
      }
    }

    /**
     * Transição controlada de estado com log auditável
     */
    transitionTo(nextState, metadata = {}) {
      const prev = this.state;
      this.state = nextState;
      const record = {
        from: prev,
        to: nextState,
        timestamp: new Date().toISOString(),
        ...metadata
      };
      this.history.push(record);
      if (typeof this.options.onStateChange === 'function') {
        try { this.options.onStateChange(record); } catch (_) {}
      }
      for (const fn of this.listeners) {
        try { fn(nextState, this.context, record); } catch (_) {}
      }
    }

    /**
     * Executa a orquestração completa e resiliente
     * 
     * @param {Object} context - PerformanceContext
     * @param {Function} aiGeneratorFn - async (context, previousErrors) => rawResponse
     * @param {Function} structuralValidatorFn - (raw) => { status, data, errors }
     * @param {Function} clinicalValidatorFn - (data, context) => { status, warnings, errors }
     * @returns {Promise<Object>} Resultado padronizado
     */
    async run(context, aiGeneratorFn, structuralValidatorFn, clinicalValidatorFn) {
      this.context = context;
      this.warnings = [];
      this.errors = [];

      // Validação prévia de perfil do paciente
      if (!context || (!context._meta?.patientId && !context.patient?.id && !context.patientId)) {
        this.transitionTo(STATES.ERROR, { reason: 'Perfil de paciente inválido ou ausente' });
        this.errors.push('Perfil de paciente inválido ou dados clínicos insuficientes.');
        return this._buildFinalResult('REJECT', true);
      }

      let previousAiErrors = [];
      let canRetryAi = true;

      // ── LAÇO DE GERAÇÃO POR IA (COM CIRCUIT BREAKER E BACKOFF) ──────────────
      while (this.currentAttempt < this.options.maxAiAttempts && canRetryAi) {
        this.currentAttempt++;
        this.transitionTo(STATES.REQUESTING_AI, { attempt: this.currentAttempt });

        let rawAiResponse;
        try {
          if (typeof aiGeneratorFn !== 'function') {
            throw new Error('Função aiGeneratorFn não configurada.');
          }
          rawAiResponse = await aiGeneratorFn(this.context, previousAiErrors);
        } catch (genErr) {
          this.lastError = genErr;
          this.lastErrorType = classifyError(genErr);

          console.warn(`[TrainingStateMachine] Tentativa ${this.currentAttempt} falhou com ${this.lastErrorType}:`, genErr.message || genErr);

          // Diferenciação de erros:
          if (this.lastErrorType === ERROR_TYPES.RATE_LIMIT_429) {
            // Quota excedida: não repete em loop infinito com a mesma chave
            canRetryAi = false;
            this.warnings.push(`Gemini Quota Excedida (HTTP 429). Acionando contingência determinística.`);
            break;
          }

          if (this.lastErrorType === ERROR_TYPES.AUTH_CONFIG) {
            // Erro de credenciais/chave: aborta IA imediatamente e vai para contingência
            canRetryAi = false;
            this.warnings.push(`Chave de API Gemini inválida ou não configurada. Ativando contingência determinística.`);
            break;
          }

          if (this.lastErrorType === ERROR_TYPES.CAPACITY_503 || this.lastErrorType === ERROR_TYPES.TIMEOUT_NETWORK) {
            // Erro transitório de capacidade: retenta com backoff + jitter se houver tentativas
            if (this.currentAttempt < this.options.maxAiAttempts) {
              const backoffMs = calculateBackoffWithJitter(
                this.currentAttempt - 1,
                this.options.baseBackoffMs,
                this.options.maxJitterMs
              );
              this.transitionTo(STATES.RETRYING_AI, {
                attempt: this.currentAttempt,
                backoffMs,
                errorType: this.lastErrorType
              });
              await this.options.sleepFn(backoffMs);
              previousAiErrors = [`Tentativa anterior falhou por instabilidade temporária na API (${this.lastErrorType}).`];
              continue;
            } else {
              canRetryAi = false;
              this.warnings.push(`API do Gemini indisponível (HTTP 503 persistente após ${this.currentAttempt} tentativas).`);
              break;
            }
          }

          // Outros erros
          previousAiErrors = [`Erro na IA: ${String(genErr.message || genErr)}`];
          if (this.currentAttempt >= this.options.maxAiAttempts) {
            canRetryAi = false;
            break;
          }
          await this.options.sleepFn(500);
          continue;
        }

        // ── VALIDAÇÃO ESTRUTURAL DA RESPOSTA DA IA ────────────────────────────
        this.transitionTo(STATES.VALIDATING, { stage: 'STRUCTURAL' });
        const structuralResult = typeof structuralValidatorFn === 'function'
          ? structuralValidatorFn(rawAiResponse)
          : { status: 'PASS', data: rawAiResponse, errors: [] };

        if (structuralResult.status === 'REJECT') {
          console.warn(`[TrainingStateMachine] Falha estrutural na tentativa ${this.currentAttempt}:`, structuralResult.errors);
          previousAiErrors = structuralResult.errors || ['Prescrição com campos ausentes ou formato inválido.'];
          continue;
        }

        // ── VALIDAÇÃO CLÍNICA DE COERÊNCIA ──────────────────────────────────
        this.transitionTo(STATES.VALIDATING, { stage: 'CLINICAL' });
        const clinicalResult = typeof clinicalValidatorFn === 'function'
          ? clinicalValidatorFn(structuralResult.data, this.context)
          : { status: 'PASS', warnings: [], errors: [] };

        if (clinicalResult.status === 'REJECT') {
          console.warn(`[TrainingStateMachine] Falha de coerência clínica na tentativa ${this.currentAttempt}:`, clinicalResult.errors);
          previousAiErrors = clinicalResult.errors || ['Conflito clínico ou biomecânico detectado.'];
          continue;
        }

        // SUCESSO COMPLETO NA IA
        this.generationSource = 'AI';
        this.prescription = structuralResult.data;
        if (clinicalResult.warnings) this.warnings.push(...clinicalResult.warnings);

        this.transitionTo(STATES.READY, { source: 'AI' });
        return this._buildFinalResult(clinicalResult.status || 'PASS', false);
      }

      // ── ACIONAMENTO DA CONTINGÊNCIA DETERMINÍSTICA ─────────────────────────
      if (this.options.enableContingencyFallback) {
        this.transitionTo(STATES.FALLBACK_CONTINGENCY, {
          reason: this.lastErrorType || 'AI_UNAVAILABLE',
          lastError: this.lastError?.message
        });

        console.info('[TrainingStateMachine] Ativando Motor Determinístico de Contingência...');
        const contingency = DeterministicTrainingGenerator.generate(this.context, {
          fallbackReason: this.lastErrorType || 'GEMINI_UNAVAILABLE',
          experienceLevel: this.context.patient?.trainingLevel,
          frequency: this.context.trainingProfile?.frequencyWeekly
        });

        if (contingency && contingency.status !== 'REJECT' && contingency.prescription) {
          this.generationSource = 'DETERMINISTIC';
          this.prescription = contingency.prescription;
          if (contingency.warnings) this.warnings.push(...contingency.warnings);

          this.transitionTo(STATES.READY, { source: 'DETERMINISTIC' });
          return this._buildFinalResult(contingency.status, false);
        } else {
          this.errors.push(...(contingency?.errors || ['Falha no motor de contingência determinístico.']));
        }
      }

      // ── NENHUMA ALTERNATIVA VÁLIDA PÔDE SER PRODUZIDA ──────────────────────
      this.transitionTo(STATES.ERROR, { reason: 'Todas as vias de geração falharam' });
      return this._buildFinalResult('REJECT', true);
    }

    async execute(params = {}) {
      const patientContext = params.patientContext || params.context || {};
      const aiGeneratorFn = params.aiGeneratorFn || params.aiGenerator;
      const structuralValidatorFn = params.structuralValidatorFn;
      const clinicalValidatorFn = params.clinicalValidatorFn;

      const normalizedContext = {
        _meta: { patientId: patientContext?.patientId || 'pat_default' },
        patient: { id: patientContext?.patientId || 'pat_default', name: patientContext?.name, ...(patientContext || {}) },
        patientId: patientContext?.patientId || 'pat_default',
        ...(patientContext || {})
      };

      const res = await this.run(normalizedContext, aiGeneratorFn, structuralValidatorFn, clinicalValidatorFn);
      return {
        ...res,
        source: res.generationSource || 'DETERMINISTIC',
        contingencyUsed: res.isContingency || false,
        contingencyReason: res.lastError ? String(res.lastError.message || res.lastError) : (res.warnings?.find(w => w.includes('503') || w.includes('429')) || '')
      };
    }

    _buildFinalResult(status, fatal) {
      return {
        status,
        fatal,
        state: this.state,
        generationSource: this.generationSource,
        attempt: this.currentAttempt,
        lastErrorType: this.lastErrorType,
        prescription: this.prescription,
        context: this.context,
        warnings: this.warnings,
        errors: this.errors,
        history: this.history,
        isContingency: this.generationSource === 'DETERMINISTIC',
        requiresHumanReview: true
      };
    }
  }

  TrainingGenerationStateMachine.TrainingGenerationStateMachine = TrainingGenerationStateMachine;
  TrainingGenerationStateMachine.STATES = STATES;
  TrainingGenerationStateMachine.ERROR_TYPES = ERROR_TYPES;
  TrainingGenerationStateMachine.classifyError = classifyError;
  TrainingGenerationStateMachine.calculateBackoffWithJitter = calculateBackoffWithJitter;

  return TrainingGenerationStateMachine;
});
