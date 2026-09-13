# NUTRIAX PRO — FASE N3.6
# AUDITORIA ARQUITETURAL E PLANEJAMENTO FORMAL: VALIDAÇÃO GLOBAL DA PRESCRIÇÃO NUTRICIONAL

**Documento**: `n36_architecture_audit.md`  
**Versão**: 1.0.0  
**Status**: AUDITORIA CONCLUÍDA — SUBMETIDA PARA APROVAÇÃO  
**Data**: Setembro de 2026  
**Camada de Domínio**: Pura (`domain/validation/` & `domain/contracts/`) — Zero DOM, Zero Dexie/Firebase, Zero Gemini, Zero I/O  

---

## 1. STATUS DA BASELINE DE TESTES

A auditoria prévia executou a suíte completa de testes antes de qualquer elaboração conceitual da Fase N3.6:

* **Comando Executado**: `npm test`
* **Resultado**: **525/525 testes aprovados em 20 suítes**
* **Falhas**: **0 falhas**
* **Regressões**: **0 regressões**
* **Git Diff**: `git diff --check` 100% limpo
* **Git Status**: Árvore limpa, nenhum código modificado indevidamente

A cadeia determinística prévia (Fases N2.1 a N3.5) encontra-se 100% operacional, estável e homologada.

---

## 2. MAPA COMPLETO DAS DEPENDÊNCIAS (N2.1 → N3.5)

A cadeia determinística do NutriAx Pro foi desenhada em camadas estritamente sequenciais e desacopladas:

```text
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 1. CONTEXTO CANÔNICO                                                              │
│    NutritionPrescriptionContextDTO (N1.1)                                         │
│    - Fonte soberana de fatos clínicos, antropométricos, rotina, treino e jejum.   │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 2. METAS NUTRICIONAIS (Fase N2)                                                   │
│    N2.1 Energy Target (calculateDeterministicEnergyTarget)                        │
│    ├── Saída: caloricTargetKcal, tmbKcal, getKcal, energyBalanceKcal, status      │
│    ▼                                                                              │
│    N2.2 Macro Targets (calculateDeterministicMacroTargets)                        │
│    ├── Saída: proteinTargetG, carbohydrateTargetG, fatTargetG, fiberTargetG       │
│    ▼                                                                              │
│    N2.3 Nutrition Target Validator (validateNutritionPrescriptionTargets)         │
│    └── Portão N2: Valida consistência matemática e Atwater antes do cardápio      │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 3. RESOLUÇÃO DE ALIMENTOS (Fase N3.1 & N3.2)                                      │
│    N3.1 Food Solver Contract (CanonicalFoodDTO, elegibilidade bromatológica)      │
│    ▼                                                                              │
│    N3.2 Food Solver (solveFoodPlan)                                               │
│    └── Saída: Cesta global de alimentos { foodId, grams, nutrients }              │
│        (Otimização limitada dentro das tolerâncias de N2.2)                       │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 4. MONTAGEM DE REFEIÇÕES (Fase N3.3)                                              │
│    N3.3 Meal Assembly (assembleMeals)                                             │
│    └── Saída: meals[] estruturadas com mealId, mealRole, allocationRatio          │
│        (Conservação exata de massa e nutrientes: Σ refeições === Solver N3.2)     │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 5. DISTRIBUIÇÃO TEMPORAL (Fase N3.4)                                              │
│    N3.4 Meal Timing (scheduleMeals)                                               │
│    └── Saída: meals[] agendadas com scheduledTime, scheduledMinutes, eatingWindow │
│        (Preservação 100% de alimentos e nutrientes da N3.3)                       │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 6. ANÁLISE DE NUTRIENT TIMING (Fase N3.5)                                         │
│    N3.5 Nutrient Timing Analysis (analyzeNutrientTiming)                          │
│    └── Saída: meals[] enriquecidas com primaryRelation, secondaryRelations,       │
│        distâncias peri-evento e explicabilidade temporal                          │
│        (Zero alteração de nutrientes, alimentos ou horários da N3.4)              │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 7. VALIDAÇÃO GLOBAL DA PRESCRIÇÃO (Fase N3.6)                                     │
│    Global Prescription Validator (validateGlobalPrescription)                     │
│    └── Último portão determinístico: Audita conservação de ponta a ponta,         │
│        identidade, coerência energética e rastreabilidade antes da UI/DB (N3.7). │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. CONTRATO PROPOSTO: `GlobalPrescriptionValidationContract.js`

### 3.1 Versão e Metadados
* **Versão Canônica**: `N3.6.0`
* **Localização**: `domain/contracts/GlobalPrescriptionValidationContract.js`
* **Exportação**: Reexportado em `domain/contracts/index.js`

### 3.2 Estados Formais de Saída
```javascript
const GLOBAL_VALIDATION_STATUS = Object.freeze({
  PASS: 'PASS',       // Todos os portões G1-G20 aprovados; prescrição pronta para N3.7
  WARNING: 'WARNING', // Regras HARD atendidas; desvios operacionais documentados
  BLOCKED: 'BLOCKED'  // Violação de invariante estrutural, perda de dados ou colisão
});
```
*(Nota arquitetural: Não existe estado `NO_SOLUTION` na N3.6, pois a inexistência de solução alimentar é responsabilidade exclusiva do Solver N3.2).*

### 3.3 Especificação do DTO de Entrada (`GlobalPrescriptionValidationInputDTO`)
O input deve receber a cadeia completa ou o pacote consolidado contendo:
* `context`: Objeto canônico `NutritionPrescriptionContextDTO` (N1.1);
* `energyTargetResult`: Saída de `calculateDeterministicEnergyTarget` (N2.1);
* `macroTargetResult`: Saída de `calculateDeterministicMacroTargets` (N2.2);
* `nutritionValidatorResult`: Saída de `validateNutritionPrescriptionTargets` (N2.3);
* `foodSolverResult`: Saída de `solveFoodPlan` (N3.2);
* `mealAssemblyResult`: Saída de `assembleMeals` (N3.3);
* `mealTimingResult`: Saída de `scheduleMeals` (N3.4);
* `nutrientTimingResult`: Saída de `analyzeNutrientTiming` (N3.5);
* `options`: Objeto opcional com tolerâncias de governança e flags de auditoria.

### 3.4 Especificação do DTO de Saída (`GlobalPrescriptionValidationOutputDTO`)
```javascript
{
  globalValidationVersion: "N3.6.0",
  status: "PASS" | "WARNING" | "BLOCKED",
  valid: boolean,

  // Auditoria dos 20 Portões Globais (G1 a G20)
  gateResults: [
    { gateId: "G1_CONTEXT", status: "PASS", message: "...", details: {} },
    // ... G2 a G20
  ],

  // Resumo Bromatológico Consolidado de Ponta a Ponta
  conservationAudit: {
    energyTargetKcal: number,
    macroClosedKcal: number,
    solverKcal: number,
    finalKcal: number,
    deltaKcalFinalVsSolver: 0.00,
    proteinTargetG: number,
    solverProteinG: number,
    finalProteinG: number,
    deltaProteinG: 0.00,
    carbsTargetG: number,
    solverCarbsG: number,
    finalCarbsG: number,
    deltaCarbsG: 0.00,
    fatTargetG: number,
    solverFatG: number,
    finalFatG: number,
    deltaFatG: 0.00,
    fiberG: number,
    sodiumMg: number | null,
    totalFoodMassGrams: number,
    deltaMassFinalVsSolverGrams: 0.00,
    isStrictlyConserved: boolean
  },

  // Auditoria de Estrutura e Timing
  temporalAudit: {
    eatingWindow: { start: string, end: string, strength: string },
    mealsCount: number,
    mealsSchedule: [
      { mealId: string, scheduledTime: string, primaryRelation: string, secondaryRelations: string[] }
    ],
    hasCollisions: boolean,
    hasFastedTraining: boolean
  },

  // Diagnósticos, Alertas e Bloqueios
  globalDiagnostics: string[],
  inheritedWarnings: string[],
  validationWarnings: string[],
  blockingReasons: string[],

  // Rastreabilidade Granular Unificada
  globalProvenance: {
    engine: "NutriAxGlobalPrescriptionValidator",
    validationVersion: "N3.6.0",
    chainVersions: {
      context: "1.0.0",
      n21_energy: "N2.1.0",
      n22_macro: "N2.2.0",
      n23_validator: "N2.3.0",
      n31_contract: "1.0.0",
      n32_solver: "N3.2.0",
      n33_assembly: "N3.3.0",
      n34_timing: "N3.4.0",
      n35_nutrientTiming: "N3.5.0"
    },
    traceabilitySummary: { ... }
  }
}
```

---

## 4. LISTA FORMAL DE INVARIANTES: OS 20 PORTÕES GLOBAIS (G1 A G20)

| Portão | Nome do Portão | Descrição do Invariante | Gravidade |
| :--- | :--- | :--- | :--- |
| **G1** | **Integridade do Contexto** | Contexto N1.1 válido, com identificação do paciente e antropometria realista. | `BLOCKING` |
| **G2** | **Conformidade N2.1** | Meta energética válida, TMB/GET numéricos finitos, status N2.1 diferente de `BLOCKED`. | `BLOCKING` |
| **G3** | **Conformidade N2.2** | Metas de macronutrientes válidas, resíduo energético não-negativo, status N2.2 não `BLOCKED`. | `BLOCKING` |
| **G4** | **Portão de Qualidade N2.3** | Validador de metas pré-cardápio com `valid === true` e status `PASS` ou `WARNING`. | `BLOCKING` |
| **G5** | **Conformidade N3.2** | Food Solver com `valid === true`, status `PASS`/`WARNING`, cesta de alimentos não-vazia. | `BLOCKING` |
| **G6** | **Conformidade N3.3** | Meal Assembly com `valid === true`, refeições estruturadas com identidade e papéis preservados. | `BLOCKING` |
| **G7** | **Conformidade N3.4** | Meal Timing com `valid === true`, refeições monotonicamente agendadas, sem colisão. | `BLOCKING` |
| **G8** | **Conformidade N3.5** | Nutrient Timing com `valid === true`, classificações primárias/secundárias coerentes. | `BLOCKING` |
| **G9** | **Identidade Canônica dos Alimentos** | Nenhum `foodId` inventado, perdido ou substituído entre N3.2, N3.3, N3.4 e N3.5 ($IDs_{N3.5} \equiv IDs_{N3.2}$). | `BLOCKING` |
| **G10** | **Conservação Absoluta de Massa** | A soma das gramagens dos alimentos em N3.5 deve ser idêntica à soma em N3.2 ($\Delta \le 0.01$ g). | `BLOCKING` |
| **G11** | **Conservação Absoluta de Nutrientes** | Kcal ($\Delta \le 0.05$), Proteína ($\Delta \le 0.05$ g), Carboidrato ($\Delta \le 0.05$ g), Lipídios ($\Delta \le 0.05$ g), Fibra ($\Delta \le 0.05$ g). | `BLOCKING` |
| **G12** | **Fechamento Energético Atwater** | Calorias fechadas das refeições calculadas por Atwater ($4P + 4C + 9F$) coerentes com N2.2/N2.3. | `BLOCKING` |
| **G13** | **Identidade das Refeições** | Nenhuma refeição criada, removida ou renumerada indevidamente ($M_{N3.5} === M_{N3.3}$). | `BLOCKING` |
| **G14** | **Integridade Cronológica de Horários** | Horários `scheduledTime` e `scheduledMinutes` de N3.4 chegam 100% inalterados a N3.5 e N3.6. | `BLOCKING` |
| **G15** | **Rastreabilidade de Eventos** | Eventos estruturados de musculação e cardio mantêm horários, tipos e duração declarados. | `WARNING` |
| **G16** | **Coerência de Jejum Intermitente** | Nenhuma refeição fora da janela de jejum HARD; ausência de mutação no protocolo de jejum. | `BLOCKING` |
| **G17** | **Integridade de Nutrient Timing** | Classificações de proximidade temporal em N3.5 não alteraram nutrientes, alimentos ou horários. | `BLOCKING` |
| **G18** | **Proveniência Global da Cadeia** | Cada camada possui rastreabilidade completa de políticas, métodos e versões sem gaps. | `BLOCKING` |
| **G19** | **Determinismo Estrito de Execução** | Mesma entrada produz exatamente a mesma saída (`deepStrictEqual`) em múltiplas execuções. | `BLOCKING` |
| **G20** | **Imutabilidade Profunda (deepFreeze)** | Zero mutação em nenhum objeto de entrada; saída profundamente congelada. | `BLOCKING` |

---

## 5. CLASSIFICAÇÃO DAS REGRAS: BLOCKING vs WARNING vs INFORMATIONAL

### 5.1 Regras BLOCKING (Resultam em `status: BLOCKED`, `valid: false`)
* Qualquer violação estrutural de portão anterior (N2.1, N2.2, N2.3, N3.2, N3.3, N3.4, N3.5 em estado `BLOCKED` ou `valid: false`);
* Perda, acréscimo ou substituição de qualquer alimento ($IDs_{N3.5} \neq IDs_{N3.2}$);
* Alteração em qualquer gramagem de alimento entre o Solver e as etapas posteriores;
* Alteração em calorias, proteínas, carboidratos, gorduras ou fibras;
* Alteração nos horários agendados pela N3.4;
* Colisão física de refeição com treino ou cardio (`OVERLAPPING_EVENT`);
* Violação de janela alimentar de jejum HARD;
* Mutação de qualquer objeto de entrada.

### 5.2 Regras WARNING (Resultam em `status: WARNING`, `valid: true`)
* Warnings herdados das fases anteriores (ex: déficit calórico agressivo homologado na N2.1, separação operacional refeição-treino curta na N3.4/N3.5);
* Presença de cardio cadastrado sem horário de início (`DATA_INSUFFICIENT`);
* Treino durante o jejum (`FASTED_TRAINING`) sem contraindicação formal;
* Horário de treino ausente no contexto, impedindo cálculo de distâncias peri-treino (`DATA_INSUFFICIENT`);
* Tolerância do Food Solver próxima ao limite máximo em relação à meta teórica N2.2.

### 5.3 Regras INFORMATIONAL (Não alteram status, agregam explicabilidade)
* Notas de proveniência de cálculos e políticas aplicadas;
* Observações diagnósticas de nutrient timing (ex: adequação proteica pós-treino em hipertrofia);
* Detalhamento das proporções de alocação de alimentos entre refeições.

---

## 6. REUTILIZAÇÃO DE REGRAS vs DUPLICAÇÃO INÚTIL

O validador N3.6 **compõe e audita**, evitando reinventar lógica que já possui autoridade canônica em módulos anteriores:

| Domínio de Regra | Módulo com Autoridade Canônica | O que N3.6 faz | O que N3.6 NÃO duplica |
| :--- | :--- | :--- | :--- |
| **Fórmulas de TMB / GET** | `domain/math/nutritionMath.js` (N2.1) | Verifica se `tmbKcal` e `getKcal` são números finitos válidos | Não recalcula Mifflin/Harris-Benedict |
| **Partição de Macros** | `domain/math/macroTarget.js` (N2.2) | Verifica se metas de $P, C, G$ existem e fecham calorias | Não recalcula gramas por quilo |
| **Consistência Pré-Cardápio** | `domain/math/nutritionTargetValidator.js` (N2.3) | Confirma se `nutritionValidatorResult.valid === true` | Não reexecuta checks internos da N2.3 |
| **Bromatologia e Elegibilidade**| `domain/contracts/FoodSolverContract.js` (N3.1) | Verifica integridade do catálogo e DTOs | Não recalcula fatores centesimais |
| **Algoritmo de Otimização** | `domain/solver/foodSolver.js` (N3.2) | Verifica convergência do solver e tolerâncias | Não reexecuta o solver matemático |
| **Alocação de Refeições** | `domain/meal/mealAssembly.js` (N3.3) | Verifica conservação de massa e papéis de refeição | Não recalcula partição de alimentos |
| **Cálculo de Horários** | `domain/timing/mealTiming.js` (N3.4) | Verifica integridade de horários e janela alimentar | Não roda algoritmo de espaçamento |
| **Análise Cronobiológica** | `domain/timing/nutrientTiming.js` (N3.5) | Verifica coerência das tags e ausência de mutação | Não reclassifica distâncias |

---

## 7. PROPOSTA DE PROVENANCE GLOBAL UNIFICADA

A proveniência da N3.6 responde de maneira estruturada e auditável às 10 perguntas canônicas de rastreabilidade:

```json
{
  "provenanceTree": {
    "q1_targetEnergetico": {
      "caloricTargetKcal": 2700,
      "tmbKcal": 1750,
      "getKcal": 2500,
      "energyBalanceKcal": 200,
      "sourcePhase": "N2.1"
    },
    "q2_politicaEnergetica": {
      "policyVersion": "1.0.0",
      "appliedRule": "SURPLUS_HYPERTROPHY_MODERATE",
      "sourcePhase": "N2.1"
    },
    "q3_macrosHomologados": {
      "proteinG": 160,
      "carbsG": 320,
      "fatG": 70,
      "closedKcal": 2550,
      "sourcePhase": "N2.2"
    },
    "q4_alimentosSelecionados": {
      "foodsCount": 6,
      "foodIds": ["FOOD_1", "FOOD_2", "FOOD_3", "FOOD_4", "FOOD_5", "FOOD_6"],
      "sourcePhase": "N3.2"
    },
    "q5_solucaoSolver": {
      "status": "PASS",
      "cost": 0.042,
      "solverKcal": 2548,
      "sourcePhase": "N3.2"
    },
    "q6_distribuicaoRefeicoes": {
      "mealsCount": 4,
      "massConservation": "EXACT",
      "sourcePhase": "N3.3"
    },
    "q7_horariosAtribuidos": {
      "eatingWindow": "08:00 - 22:00",
      "windowStrength": "PREFERRED",
      "sourcePhase": "N3.4"
    },
    "q8_relacaoTemporalDetectada": {
      "preTrainingMealId": "meal_3",
      "postTrainingMealId": "meal_4",
      "sourcePhase": "N3.5"
    },
    "q9_warningsExistentes": {
      "inheritedCount": 1,
      "warnings": ["Separação operacional cardio-sono menor que preferencial"],
      "sourcePhases": ["N3.5"]
    },
    "q10_motivoStatusFinal": {
      "finalStatus": "PASS",
      "summary": "Prescrição nutricional determinística 100% conservada, validada e homologada de ponta a ponta.",
      "blockingReasons": []
    }
  }
}
```

---

## 8. GAPS ARQUITETURAIS IDENTIFICADOS NO MAPEAMENTO

1. **Gap entre Tolerância do Solver (N3.2) vs Conservação Exata (N3.3 a N3.5)**:
   * O Food Solver N3.2 possui margem de tolerância autorizada em relação às metas teóricas da N2.2 (ex: $\pm 5\%$).
   * As fases posteriores (N3.3, N3.4, N3.5) possuem **tolerância ZERO** em relação à saída do solver N3.2.
   * *Solução*: A N3.6 deve auditar a tolerância em duas camadas independentes: (1) Solver vs N2.2 (dentro da margem da política); (2) N3.5 vs N3.2 ($\Delta = 0.00$ estrito).
2. **Campos Opcionais de Micronutrientes (Sódio, Fibras)**:
   * Tabelas de alimentos (TBCA/TACO) possuem valores nulos de sódio em certos alimentos.
   * *Solução*: Conservação de sódio auditada apenas quando o somatório for numérico; ausência de dados não pode ser convertida para zero arbitrário.
3. **Múltiplos Formatos de Input no Pipeline**:
   * Alguns testes anteriores passam a saída completa de N3.5 contendo internamente as fases anteriores, enquanto outros fluxos podem fornecer cada objeto desacoplado.
   * *Solução*: O validador N3.6 deve aceitar flexibilidade de encapsulamento no `input`, extraindo as fases automaticamente seja via propriedades de topo (`input.mealTimingResult`, `input.foodSolverResult`) ou via árvore consolidada.

---

## 9. PROPOSTA DE ESTRUTURA DE ARQUIVOS (FASE N3.6)

```text
domain/
├── contracts/
│   ├── GlobalPrescriptionValidationContract.js   [NOVO]
│   └── index.js                                  [ATUALIZAR EXPORT]
├── validation/                                    [NOVA PASTA PURA]
│   ├── globalPrescriptionValidationPolicy.js     [NOVO]
│   ├── globalPrescriptionValidator.js            [NOVO]
│   └── index.js                                  [NOVO BARREL]
tests/
└── global-prescription-validation-n36.test.js    [NOVO: >= 60 TESTES]
```

---

## 10. PLANO DE TESTES (MÍNIMO DE 60 TESTES AUTOMATIZADOS)

A suíte `tests/global-prescription-validation-n36.test.js` será estruturada nas seguintes baterias:

1. **Portão de Entrada e Contratos (Testes 1 a 6)**:
   * Rejeição de input nulo ou malformado;
   * Rejeição quando contexto estiver ausente ou corrompido;
   * Validação de DTOs com `validateGlobalPrescriptionValidationInput` e `Output`;
   * Imutabilidade de entrada.
2. **Integridade de Fases Anteriores Bloqueadas (Testes 7 a 14)**:
   * Bloqueio imediato se N2.1 for `BLOCKED`;
   * Bloqueio imediato se N2.2 for `BLOCKED`;
   * Bloqueio imediato se N2.3 for `valid === false`;
   * Bloqueio imediato se N3.2 for `BLOCKED` ou `NO_SOLUTION`;
   * Bloqueio imediato se N3.3 for `BLOCKED`;
   * Bloqueio imediato se N3.4 for `BLOCKED`;
   * Bloqueio imediato se N3.5 for `BLOCKED`.
3. **Identidade Canônica dos Alimentos (Testes 15 a 18)**:
   * Detecção de alimento inventado na N3.5;
   * Detecção de alimento perdido entre N3.2 e N3.5;
   * Detecção de substituição indevida de alimento.
4. **Conservação de Massa e Alimentos (Testes 19 a 22)**:
   * Soma das gramagens finais exatamente igual ao solver N3.2;
   * Detecção de alteração de gramas em alimento individual;
   * Tolerância estrita ($\Delta \le 0.01$ g).
5. **Conservação Nutricional Estrita (Testes 23 a 30)**:
   * Conservação exata de calorias ($\Delta \le 0.05$ kcal);
   * Conservação exata de proteínas ($\Delta \le 0.05$ g);
   * Conservação exata de carboidratos ($\Delta \le 0.05$ g);
   * Conservação exata de gorduras/lipídios ($\Delta \le 0.05$ g);
   * Conservação de fibras e sódio;
   * Rejeição de qualquer desvio nutricional entre N3.2 e N3.5.
6. **Fechamento Energético Atwater (Testes 31 a 34)**:
   * Validação de coerência Atwater ($4P + 4C + 9F$);
   * Verificação contra o target teórico de N2.2;
   * Verificação de fechamento do solver N3.2.
7. **Identidade e Estrutura de Refeições (Testes 35 a 38)**:
   * Quantidade de refeições preservada ($M_{N3.5} === M_{N3.3}$);
   * Preservação de `mealId`, `mealIndex`, `mealName`, `mealRole`;
   * Rejeição de refeição criada ou excluída arbitrariamente.
8. **Integridade Temporal e Eventos (Testes 39 a 44)**:
   * Horários de N3.4 chegam intactos ao final;
   * Detecção e bloqueio de colisão física (`OVERLAPPING_EVENT`);
   * Rastreabilidade de treino e cardio mantida.
9. **Jejum e Fasted Training (Testes 45 a 48)**:
   * Refeição fora de janela HARD gera `BLOCKED`;
   * `FASTED_TRAINING` tratado como diagnóstico/warning contextual;
   * Preservação da janela de jejum.
10. **Propagação de Warnings e Limitações (Testes 49 a 52)**:
    * `DATA_INSUFFICIENT` gera `status: WARNING`, nunca `BLOCKED`;
    * Warnings herdados de N2/N3 consolidados na saída;
    * Diferenciação de limitação de dados vs erro de contrato.
11. **Rastreabilidade e Provenance Global (Testes 53 a 56)**:
    * Presença das 10 respostas canônicas de provenance;
    * Versões de todas as 8 camadas documentadas;
    * Provenance profundamente congelada.
12. **Determinismo e Pureza Estática (Testes 57 a 62)**:
    * Execução repetida 5 vezes produz `deepStrictEqual` idêntico;
    * `deepFreeze` verificado em todos os nós da saída;
    * Auditoria estática de tokens proibidos em `domain/validation/`.

Total: **62 testes automatizados planejados**.

---

## 11. RISCOS ARQUITETURAIS E MITIGAÇÕES

| Risco Identificado | Gravidade | Mitigação Obrigatória na N3.6 |
| :--- | :--- | :--- |
| **Tentativa de N3.6 recalcular ou ajustar dieta** | Alta | N3.6 é puramente um validador booleano (`valid`) com diagnósticos. Zero métodos de rebalanceamento ou mutação. |
| **Confundir tolerância do solver com quebra de conservação** | Média | N3.6 distingue tolerância solver vs meta ($\pm 5\%$) de conservação downstream vs solver ($\Delta = 0.00$). |
| **Duplicar cálculos internos de N2.1/N2.2** | Média | Reutilizar `validateNutritionPrescriptionTargets` (N2.3) e verificar apenas status e contratos das fases. |
| **Bloquear prescrição por ausência de dados opcionais** | Média | `DATA_INSUFFICIENT` e cardio sem horário estruturado geram `WARNING`, jamais `BLOCKED`. |

---

## 12. CRITÉRIOS OBJETIVOS DE ACEITE DA FASE N3.6

A futura implementação da Fase N3.6 só será aprovada se atender integralmente a:
1. **Zero Mutação**: Preservação absoluta de todos os objetos de entrada.
2. **Zero Recálculo Ativo**: Zero seleção de alimentos, zero rebalanceamento, zero ajuste de horários.
3. **Auditoria Completa G1 a G20**: Todos os 20 portões avaliados de forma determinística.
4. **Suíte N3.6**: Mínimo de 60 testes específicos passando com 100% de sucesso.
5. **Regressão Global**: Suíte global passando com $\ge 585$ testes ($525 + 60$) e 0 falhas.
6. **Pureza**: Zero tokens proibidos (`window`, `document`, `Dexie`, `firebase`, `Gemini`, `Math.random`, `Date.now`, `CANONICAL_DIET_FOODS`, `foodsData`, `selectFood`, `rebalance`, `modifyMacros`, `adjustCalories`, `reschedule`).
7. **Git Diff**: Limpo e sem formatações espúrias.

---

## 13. CONFIRMAÇÃO FORMAL

> **Declaração Arquitetural**:  
> Nenhuma linha de código funcional de domínio ou teste foi implementada nesta etapa.  
> Todos os arquivos de domínio existentes (`domain/math/*`, `domain/solver/*`, `domain/meal/*`, `domain/timing/*`, `domain/contracts/*`) permanecem rigorosamente intactos.  
> Esta etapa restringiu-se exclusivamente à auditoria, mapeamento de dependências e planejamento formal da Fase N3.6.
