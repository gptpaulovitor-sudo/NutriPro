# WALKTHROUGH — FASE N3.4: MEAL TIMING / DISTRIBUIÇÃO TEMPORAL DETERMINÍSTICA CANÔNICA
## NutriAx Pro

Data de Conclusão: 13/09/2026  
Status da Suíte N3.4: **65/65 testes aprovados** (100%)  
Status da Suíte Global: **463/463 testes aprovados** (20 suítes)  
Git Diff Check: **Limpo (código 0)**  
Pureza Arquitetural: **100% Pura — Zero I/O, Zero UI, Zero IA, Zero Seleção Alimentar na Camada Temporal**  
Veredito da Fase: **FASE N3.4 CONCLUÍDA COM SUCESSO**

---

### 1. Arquivos Criados e Modificados

#### Arquivos Criados:
1. `domain/contracts/MealTimingContract.js`: Contrato canônico de entrada e saída (`MealTimingInputDTO`, `MealTimingOutputDTO`, `ScheduledMealDTO`), constantes (`TIMING_STATUS`, `WINDOW_STRENGTH`, `TEMPORAL_STATUS`, `TIMING_SOURCES`, `TEMPORAL_EVENT_TYPES`), validações estritas de portão e congelamento profundo recursivo.
2. `domain/timing/mealTimingPolicy.js`: Política operacional de timing determinístico com utilitários bidirecionais de minutos/HH:MM (`timeStringToMinutes`, `minutesToTimeString`), resolução de janela alimentar eficaz, extração de eventos temporais e buffers operacionais.
3. `domain/timing/mealTimingValidator.js`: Validador canônico com as 18 invariantes estritas de integridade, conservação de identidade e compatibilidade temporal.
4. `domain/timing/mealTiming.js`: Motor determinístico de posicionamento temporal com ancoragem em janela alimentar, desvio de colisões de treino e cardio e garantia estrita de monotonicidade.
5. `domain/timing/index.js`: Ponto único de exportação pura do subsistema Meal Timing sob `module.exports` e `globalThis.NutriDomain.timing`.
6. `tests/meal-timing-n34.test.js`: Suíte com 65 testes automatizados cobrindo os grupos A a K.

#### Arquivos Modificados:
1. `domain/contracts/index.js`: Exportação do `MealTimingContract` no barrel de contratos do domínio.

---

### 2. Contratos Canônicos de Entrada e Saída

#### Contrato de Entrada (`MealTimingInputDTO`):
```javascript
{
  context,            // NutritionPrescriptionContextDTO canônico obrigatório
  mealAssemblyResult, // MealAssemblyOutputDTO da N3.3 (valid === true, status PASS ou WARNING)
  trainingContext,    // Opcional: horários de treino estruturados
  cardioContext,      // Opcional: sessões de cardio estruturadas
  fastingContext,     // Opcional: protocolo de jejum intermitente ativo
  timingPolicy        // Opcional: overrides operacionais de política
}
```

* **Portões de Bloqueio Estrito:**
  * Se `mealAssemblyResult` for nulo, inválido ou `status === 'BLOCKED'` $\implies$ `BLOCKED`
  * Se `mealAssemblyResult.valid !== true` $\implies$ `BLOCKED`
  * Se `mealAssemblyResult.meals` estiver vazio $\implies$ `BLOCKED`

#### Contrato de Saída (`MealTimingOutputDTO`):
```javascript
{
  timingVersion: 'N3.4.0',
  assemblyVersion: 'N3.3.0',
  solverVersion: 'N3.2.0',
  status: 'PASS' | 'WARNING' | 'BLOCKED',
  valid: true | false,
  meals: [
    {
      mealId: 'meal_1',
      mealIndex: 0,
      mealName: 'Refeição 1',
      mealRole: 'PRIMARY',
      scheduledTime: '08:00',
      scheduledMinutes: 480,
      intervalToNextMinutes: 270,
      temporalStatus: 'CONFIRMED' | 'ADJUSTED' | 'FALLBACK',
      timingReason: 'STRUCTURED_ROUTINE_SLOT' | 'PREFERRED_DISTRIBUTION' | 'PRE_TRAINING_BUFFER' | ...,
      timingSource: 'STRUCTURED_ROUTINE' | 'FASTING_PROTOCOL' | 'POLICY_FALLBACK' | ...,
      items: [ ... ],   // Preservado 100% da N3.3
      totals: { ... }   // Preservado 100% da N3.3
    }
  ],
  eatingWindow: {
    start: '07:30',
    startMinutes: 450,
    end: '21:00',
    endMinutes: 1260,
    durationMinutes: 810,
    strength: 'HARD' | 'PREFERRED',
    source: 'STRUCTURED_ROUTINE' | 'FASTING_PROTOCOL' | 'POLICY_FALLBACK'
  },
  temporalEvents: [
    { eventType: 'TRAINING' | 'CARDIO', start, end, startMinutes, endMinutes, durationMinutes }
  ],
  globalTotals: { ... }, // Preservado 100% da N3.3
  diagnostics: [ ... ],
  warnings: [ ... ],
  blockingReasons: [ ... ],
  provenance: { engine: 'NutriAxDeterministicMealTiming', policyVersion: '1.0.0' }
}
```

---

### 3. Definição de Força da Janela: HARD vs PREFERRED

* **`HARD`:**
  - Protocolo de jejum intermitente estruturado e ativo (`feedingWindows`);
  - Restrição temporal formal explicitamente definida em `context.constraints.availableEatingWindow`.
  - **Efeito:** Todas as refeições devem caber obrigatoriamente dentro dessa janela. Se matematicamente impossível ($(M - 1) \times \text{hardMinMealInterval} > \text{durationMinutes}$) ou se houver extrapolação inevitável $\implies$ **`BLOCKED`**.
* **`PREFERRED`:**
  - Janela derivada da rotina de sono e vigília (`wakeUpTime + 30 min` a `bedTime - 90 min`);
  - Janela derivada do fallback de política (`07:30` a `21:00`).
  - **Efeito:** Orienta o posicionamento e distribui os horários. Se o ciclo for curto, a janela é expandida computacionalmente para manter a viabilidade física e emite **`WARNING`**, sem bloquear a prescrição do paciente.

---

### 4. Tratamento de Rotina, Treinamento, Cardio e Jejum

* **Rotina Sono / Vigília:**
  - Extração exclusiva de campos estruturados: `wakeUpTime`/`wakeTime`, `bedTime`/`sleepTime`.
  - Prioridade na extração: `dietaryRecall.typicalMealTimes` estruturado $\to$ rotina de sono/vigília $\to$ fallback de política com emissão de `WARNING`.
  - Observações em texto livre **não** são interpretadas.
* **Treinamento e Cardio como Eventos Temporais:**
  - Tratados como intervalos computacionais $[t_{\text{start}}, t_{\text{end}}]$.
  - Nenhuma refeição é agendada durante a sessão física de treino ou cardio.
  - Parâmetros operacionais preferenciais: `preferredMealBeforeTrainingMinutes = 75`, `preferredMealAfterTrainingMinutes = 45`, `minEventBufferMinutes = 30`.
  - **Zero impacto nutricional:** Não recalcula GET, não altera calorias e não seleciona alimentos.
* **Jejum Intermitente:**
  - Consome o estado estruturado de `context.fasting` ou `fastingContext`.
  - Se ativo, a `feedingWindow` passa a ser a janela alimentar `HARD`.
  - N3.4 **não** altera o protocolo de jejum e **não** duplica a lógica do `fasting-module.js`.

---

### 5. Invariantes de Conservação e Preservação de Identidade

1. **Preservação de Identidade:** `mealId`, `mealIndex`, `mealName` e `mealRole` permanecem estritamente intactos. A ordenação cronológica é uma propriedade derivada de `scheduledMinutes`, sem renumerar as refeições.
2. **Conservação Matemática:**
   - Massas e alimentos: 100% idênticos aos da N3.3.
   - Calorias e macronutrientes: 100% conservados em cada refeição e nos totais globais.
3. **Monotonicidade Temporal:** Refeições espaçadas por no mínimo `hardMinMealInterval = 45 min` garantindo ausência de colisões.

---

### 6. Resultados dos Testes Automatizados

#### 6.1 Suíte Específica N3.4 (`node --test tests/meal-timing-n34.test.js`)
* **65 testes executados e 65 aprovados (100% de sucesso, 0 falhas):**
  * Grupo A: Contratos e Portões de Entrada (7 testes) $\to$ **PASS**
  * Grupo B: Rotina do Paciente (4 testes) $\to$ **PASS**
  * Grupo C: Janela Alimentar (5 testes) $\to$ **PASS**
  * Grupo D: Distribuição Temporal e Intervalos (6 testes) $\to$ **PASS**
  * Grupo E: Treinamento como Evento Temporal (5 testes) $\to$ **PASS**
  * Grupo F: Cardio como Evento Temporal (4 testes) $\to$ **PASS**
  * Grupo G: Protocolo de Jejum Intermitente (4 testes) $\to$ **PASS**
  * Grupo H: Conflitos, Bloqueios e Tolerâncias (4 testes) $\to$ **PASS**
  * Grupo I: Conservação Integral e Identidade (4 testes) $\to$ **PASS**
  * Grupo J: Determinismo Estrito e Imutabilidade (4 testes) $\to$ **PASS**
  * Grupo K: Pureza Arquitetural e Proibições Estritas (7 testes) $\to$ **PASS**

#### 6.2 Suíte Global de Regressão (`npm test`)
* **463 testes executados e 463 aprovados (100%)** em 20 suítes de testes.
* Total anterior: 398 testes.
* Novos testes da Fase N3.4: +65 testes.
* Falhas: **0**.
* Regressões: **0**.

#### 6.3 Verificação Git
* `git diff --check`: **Limpo (código 0)**.

---

### 7. Auditoria Estática de Pureza

Varredura estática realizada sobre o diretório `domain/timing/`:

| Token / Termo Auditado | Ocorrências em `domain/timing/` | Status |
| :--- | :---: | :---: |
| `CANONICAL_DIET_FOODS` | **0** | ✅ Totalmente ausente |
| `Math.random` | **0** | ✅ Totalmente ausente |
| `Date.now` | **0** | ✅ Totalmente ausente |
| `window` | **0** | ✅ Totalmente ausente |
| `document` (DOM) | **0** | ✅ Totalmente ausente |
| `Gemini` / IA | **0** | ✅ Totalmente ausente |
| `Dexie` (gravações/mutações) | **0** | ✅ Totalmente ausente |
| `firebase` (gravações/mutações) | **0** | ✅ Totalmente ausente |
| `foodCatalog` / `foodsData` | **0** | ✅ Totalmente ausente |
| `caloricTargetKcal` / `proteinTargetG` | **0** | ✅ Totalmente ausente |

---

### 8. Arquivos Intactos e Garantia de Fronteira

* **Arquivos Protegidos Mantidos 100% Intactos:**
  * `app.js`
  * `index.html`
  * `db.js`
  * `foodsData.js`
  * `math.js`
  * `firebase-service.js`
  * `fasting-module.js`
  * `CANONICAL_DIET_FOODS`
  * `domain/math/energyTarget.js` (N2.1)
  * `domain/math/macroTarget.js` (N2.2)
  * `domain/math/nutritionTargetValidator.js` (N2.3)
  * `domain/solver/foodSolver.js` (N3.2)
  * `domain/meal/mealAssembly.js` (N3.3)

* **Declaração Formal de Fronteira:**
  * 🛑 **A Fase N3.5 (Integração Formal com Treinamento / Nutrient Timing Específico) NÃO foi iniciada.**
  * 🛑 **Nenhuma interface visual (UI) ou agenda visual no frontend foi alterada.**
  * 🛑 **Nenhum botão "Gerar Dieta" foi integrado.**
  * 🛑 **Nenhuma gravação em banco de dados (`Dexie`/`Firebase`) foi executada.**
