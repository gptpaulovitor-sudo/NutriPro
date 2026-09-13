# NUTRIAX PRO — FASE N3.6
# RELATÓRIO DE IMPLEMENTAÇÃO E HOMOLOGAÇÃO: VALIDAÇÃO GLOBAL DA PRESCRIÇÃO NUTRICIONAL (GLOBAL PRESCRIPTION VALIDATOR)

**Documento**: `n36_walkthrough.md`  
**Versão**: 1.0.0  
**Status**: **APROVADA E FECHADA**  
**Data**: Setembro de 2026  
**Camada de Domínio**: Pura (`domain/contracts/` & `domain/validation/`) — Zero DOM, Zero Dexie/Firebase, Zero Gemini, Zero I/O  

---

## 1. OBJETIVO DA FASE N3.6

A Fase N3.6 implementou o **último portão determinístico canônico** da cadeia do NutriAx Pro antes da integração com a aplicação real (interface de usuário e persistência de dados na Fase N3.7).

Fluxo auditado e consolidado:
```text
N2.1 (Energia)
  │
  ▼
N2.2 (Macronutrientes)
  │
  ▼
N2.3 (Validador Pré-Cardápio)
  │
  ▼
N3.1 / N3.2 (Food Solver Bromatológico)
  │
  ▼
N3.3 (Meal Assembly — Montagem de Refeições)
  │
  ▼
N3.4 (Meal Timing — Distribuição Temporal)
  │
  ▼
N3.5 (Nutrient Timing Analysis — Relações Temporais)
  │
  ▼
N3.6 Global Prescription Validator [PORTÃO FINAL DE HOMOLOGAÇÃO]
```

### Princípio Reitor Inegociável:
> **"N2/N3 prescrevem/analisam. N3.6 apenas valida a coerência global do resultado."**

A Fase N3.6 é estritamente um **validador puro**. Ela:
* **NÃO** seleciona alimentos;
* **NÃO** altera ou substitui alimentos;
* **NÃO** altera gramagens;
* **NÃO** recalcula macros;
* **NÃO** altera calorias ou targets energéticos;
* **NÃO** altera quantidade de refeições;
* **NÃO** altera horários nem reagenda refeições;
* **NÃO** modifica treino, cardio ou jejum;
* **NÃO** gera nova dieta;
* **NÃO** chama Gemini/IA;
* **NÃO** acessa DOM, Dexie ou Firebase;
* **NÃO** escreve em banco de dados;
* **NÃO** altera resultados das etapas anteriores.

---

## 2. ARQUIVOS CRIADOS E MODIFICADOS

### 2.1 Arquivos Criados
1. [`domain/contracts/GlobalPrescriptionValidationContract.js`](file:///g:/Meu%20Drive/Projetos/Nutri/domain/contracts/GlobalPrescriptionValidationContract.js):
   - Contrato formal versionado `N3.6.0`;
   - Enums: `GLOBAL_VALIDATION_STATUS` (`PASS`, `WARNING`, `BLOCKED` — sem `NO_SOLUTION`);
   - Enum dos 20 portões invariantes: `GLOBAL_GATE_ID` (`G1` a `G20`);
   - Enum de severidade: `GATE_SEVERITY` (`BLOCKING`, `WARNING`, `INFORMATIONAL`);
   - DTOs de entrada e saída: `validateGlobalPrescriptionValidationInput` e `validateGlobalPrescriptionValidationOutput`;
   - Função pura de congelamento profundo recursivo (`deepFreeze`).
2. [`domain/validation/globalPrescriptionValidationPolicy.js`](file:///g:/Meu%20Drive/Projetos/Nutri/domain/validation/globalPrescriptionValidationPolicy.js):
   - Política versionada de validação global e tolerâncias técnicas auditáveis;
   - Parâmetros: `massToleranceGrams: 0.01`, `calorieToleranceKcal: 0.05`, `proteinToleranceGrams: 0.05`, `carbohydrateToleranceGrams: 0.05`, `lipidToleranceGrams: 0.05`, `fiberToleranceGrams: 0.05`, `sodiumToleranceMg: 0.05`, `atwaterToleranceKcal: 1.0`, `allowFastedTrainingWithWarning: true`, `enforceDeepFreeze: true`.
3. [`domain/validation/globalPrescriptionValidator.js`](file:///g:/Meu%20Drive/Projetos/Nutri/domain/validation/globalPrescriptionValidator.js):
   - Motor determinístico puro `validateGlobalPrescription(input, customPolicy)`;
   - Verificação estrita dos 20 portões invariantes (G1 a G20);
   - Extração e normalização flexível dos resultados das fases N2.1 a N3.5;
   - Verificação de imutabilidade profunda do input via snapshot;
   - Montagem estruturada do balanço de conservação (`conservationAudit`), cronograma temporal (`temporalAudit`) e árvore de proveniência unificada (`globalProvenance`).
4. [`domain/validation/index.js`](file:///g:/Meu%20Drive/Projetos/Nutri/domain/validation/index.js):
   - Barrel exportando contratos, políticas e a função principal de validação global.
5. [`tests/global-prescription-validation-n36.test.js`](file:///g:/Meu%20Drive/Projetos/Nutri/tests/global-prescription-validation-n36.test.js):
   - Suíte de 62 testes automatizados rigorosos cobrindo todas as baterias de invariantes.

### 2.2 Arquivos Atualizados Exclusivamente
* [`domain/contracts/index.js`](file:///g:/Meu%20Drive/Projetos/Nutri/domain/contracts/index.js): Reexportação do novo contrato N3.6 sem remover ou alterar nenhum export anterior.

### 2.3 Arquivos Rigorosamente Protegidos e Intocados
* `app.js`
* `index.html`
* `db.js`
* `foodsData.js`
* `math.js`
* `firebase-service.js`
* `fasting-module.js`
* `domain/math/*`
* `domain/solver/*`
* `domain/meal/*`
* `domain/timing/*`
* Todos os 20 testes existentes anteriores.

---

## 3. OS 20 PORTÕES DETERMINÍSTICOS (G1 A G20)

| Portão | Identificador | Invariante Auditado | Ação em Caso de Falha |
| :--- | :--- | :--- | :--- |
| **G1** | `G1_CONTEXT` | Contexto canônico N1.1 íntegro, com identificação e antropometria realista. | `BLOCKING` |
| **G2** | `G2_ENERGY_TARGET` | N2.1 com status não-`BLOCKED`, valores numéricos finitos de TMB, GET e caloricTarget. | `BLOCKING` |
| **G3** | `G3_MACRO_TARGET` | N2.2 com status não-`BLOCKED`, metas numéricas não-negativas de P, C, G. | `BLOCKING` |
| **G4** | `G4_NUTRITION_VALIDATOR` | N2.3 com `valid === true` e status `PASS` ou `WARNING`. | `BLOCKING` |
| **G5** | `G5_FOOD_SOLVER` | N3.2 com `valid === true`, status `PASS`/`WARNING`, cesta de alimentos não vazia. | `BLOCKING` |
| **G6** | `G6_MEAL_ASSEMBLY` | N3.3 com `valid === true`, refeições estruturadas com papéis e proporções. | `BLOCKING` |
| **G7** | `G7_MEAL_TIMING` | N3.4 com `valid === true`, refeições cronologicamente agendadas. | `BLOCKING` |
| **G8** | `G8_NUTRIENT_TIMING` | N3.5 com `valid === true`, relações temporais primárias/secundárias válidas. | `BLOCKING` |
| **G9** | `G9_FOOD_IDENTITY` | Nenhum alimento inventado, perdido ou substituído ($IDs_{N3.5} \equiv IDs_{N3.2}$). | `BLOCKING` |
| **G10** | `G10_MASS_CONSERVATION` | Soma de gramagens de cada alimento e massa total conservadas ($\Delta \le 0.01$ g). | `BLOCKING` |
| **G11** | `G11_NUTRIENT_CONSERVATION` | Kcal ($\le 0.05$), P ($\le 0.05$ g), C ($\le 0.05$ g), G ($\le 0.05$ g), Fibra ($\le 0.05$ g), Sódio quando numérico ($\le 0.05$ mg). | `BLOCKING` |
| **G12** | `G12_ATWATER_CLOSURE` | Fechamento energético $4P + 4C + 9G$ coerente com a soma bromatológica ($\Delta \le 1.0$ kcal). | `BLOCKING` |
| **G13** | `G13_MEAL_IDENTITY` | Quantidade $M$, `mealId`, `mealIndex` e `mealRole` inalterados de N3.3 a N3.5. | `BLOCKING` |
| **G14** | `G14_TEMPORAL_INTEGRITY` | `scheduledTime` e `scheduledMinutes` de N3.4 intactos até N3.5 (zero reagendamento). | `BLOCKING` |
| **G15** | `G15_EVENT_TRACEABILITY` | Treino e cardio mapeados; dados insuficientes documentados sem inferência espúria. | `WARNING` |
| **G16** | `G16_FASTING_COHERENCE` | Refeições respeitam janela alimentar (violação HARD = `BLOCKING`; fora de PREFERRED = `WARNING`). | `BLOCKING` / `WARNING` |
| **G17** | `G17_NUTRIENT_TIMING_INTEGRITY` | Ausência de colisões físicas (`OVERLAPPING_EVENT`); classificações válidas. | `BLOCKING` |
| **G18** | `G18_PROVENANCE_INTEGRITY` | Árvore de proveniência unificada de ponta a ponta respondendo às 10 perguntas canônicas. | `INFORMATIONAL` |
| **G19** | `G19_DETERMINISM` | Execução pura e determinística sem geração de timestamps próprios ou aleatoriedade. | `INFORMATIONAL` |
| **G20** | `G20_IMMUTABILITY` | Snapshot prévio comprova zero mutação nos inputs; output 100% `deepFreeze`. | `BLOCKING` |

---

## 4. SISTEMA DE TOLERÂNCIAS E CLASSIFICAÇÃO DE SEVERIDADE

### 4.1 Tolerâncias Técnicas Downstream Versionadas
As tolerâncias existem exclusivamente para absorver representação decimal e resíduos de ponto flutuante, não para permitir alterações deliberadas:
* **Massa**: $| \Delta | \le 0.01$ g por alimento e no total;
* **Calorias**: $| \Delta | \le 0.05$ kcal;
* **Macronutrientes**: $| \Delta | \le 0.05$ g (proteína, carboidrato, lipídios, fibra);
* **Sódio**: $| \Delta | \le 0.05$ mg (apenas quando informado numericamente; ausência nunca é convertida para zero nem bloqueia a prescrição);
* **Fechamento Atwater**: $| \Delta | \le 1.0$ kcal entre $4P + 4C + 9F$ e a soma das calorias.

### 4.2 Classificação Rigorosa de Severidade
* **`BLOCKED` (`valid: false`)**:
  - Falha estrutural de contrato de entrada;
  - Qualquer fase upstream inválida ou bloqueada;
  - Alimento perdido, inventado ou substituído;
  - Variação de massa ou nutrientes acima da tolerância técnica;
  - Divergência de horários, quantidade ou papéis de refeições;
  - Violação de janela alimentar de jejum HARD;
  - Colisão física refeição $\times$ treino (`OVERLAPPING_EVENT`);
  - Mutação detectada no input.
* **`WARNING` (`valid: true`)**:
  - Warnings herdados de fases anteriores (`inheritedWarnings`);
  - Dados insuficientes (`DATA_INSUFFICIENT`, cardio sem horário de início, treino sem horário);
  - Refeição fora de janela alimentar PREFERRED;
  - Treino durante jejum (`FASTED_TRAINING`) contextual;
  - Desvios operacionais menores documentados.
* **`PASS` (`valid: true`)**:
  - Todos os 20 portões atendidos sem bloqueios e sem nenhum warning herdado ou novo.

---

## 5. ÁRVORE DE PROVENANCE GLOBAL UNIFICADA

O validador N3.6 constrói o bloco `globalProvenance` respondendo de forma estruturada e auditável às 10 perguntas canônicas:
1. `q1_targetEnergetico`: Valor de `caloricTargetKcal`, TMB, GET e balanço herdados de N2.1;
2. `q2_politicaEnergetica`: Política e regra clínica aplicada em N2.1;
3. `q3_macrosHomologados`: Metas de P, C, G e fechamento calórico de N2.2/N2.3;
4. `q4_alimentosSelecionados`: Quantidade e IDs dos alimentos selecionados na N3.2;
5. `q5_solucaoSolver`: Status, custo e calorias convergidas do Solver N3.2;
6. `q6_distribuicaoRefeicoes`: Quantidade de refeições e confirmação de conservação exata de N3.3;
7. `q7_horariosAtribuidos`: Janela alimentar e horários atribuídos de N3.4;
8. `q8_relacaoTemporalDetectada`: Relações primárias e secundárias por refeição de N3.5;
9. `q9_warningsExistentes`: Separação auditável entre warnings herdados e warnings de validação;
10. `q10_motivoStatusFinal`: Explicabilidade objetiva do status final da prescrição (`PASS`, `WARNING` ou `BLOCKED`).

---

## 6. COBERTURA DE TESTES E REGRESSÃO GLOBAL

### 6.1 Suíte Específica N3.6 (`tests/global-prescription-validation-n36.test.js`)
* **Total de Testes**: **62 testes**
* **Suítes**: 12 baterias canônicas
* **Aprovados**: **62 (100%)**
* **Falhas**: 0

Distribuição das baterias:
1. *Contratos e Portão de Entrada* (Testes 1.1 a 1.6): 6 testes
2. *Bloqueio Imediato por Fases Anteriores* (Testes 2.1 a 2.8): 8 testes
3. *Identidade Canônica de Alimentos* (Testes 3.1 a 3.4): 4 testes
4. *Conservação de Massa* (Testes 4.1 a 4.4): 4 testes
5. *Conservação Nutricional Estrita* (Testes 5.1 a 5.8): 8 testes
6. *Fechamento Energético Atwater* (Testes 6.1 a 6.4): 4 testes
7. *Identidade e Estrutura de Refeições* (Testes 7.1 a 7.4): 4 testes
8. *Integridade Temporal e Colisões Físicas* (Testes 8.1 a 8.6): 6 testes
9. *Protocolo de Jejum e Fasted Training* (Testes 9.1 a 9.4): 4 testes
10. *Tratamento de Warnings e Dados Insuficientes* (Testes 10.1 a 10.4): 4 testes
11. *Rastreabilidade e Provenance Global* (Testes 11.1 a 11.4): 4 testes
12. *Determinismo, Imutabilidade e Pureza Estática* (Testes 12.1 a 12.6): 6 testes

### 6.2 Suíte Global de Regressão (`npm test`)
* **Baseline Anterior**: 525 testes aprovados em 20 suítes
* **Resultado Atual**: **587 testes aprovados em 20 suítes** ($525 + 62$)
* **Falhas**: **0**
* **Regressões**: **0**
* **Duração Total**: ~7.8s

### 6.3 Auditoria Estática e Conformidade Arquitetural
Executada verificação estrita em todos os arquivos de `domain/validation/`:
* Zero ocorrências de `window`
* Zero ocorrências de `document`
* Zero ocorrências de `Dexie`
* Zero ocorrências de `firebase`
* Zero ocorrências de `Gemini`
* Zero chamadas a `Math.random`
* Zero chamadas a `Date.now`
* Zero importação de `app.js`, `db.js`, `firebase-service.js`, `fasting-module.js`

---

## 7. CRITÉRIOS DE ACEITE E DECLARAÇÃO FORMAL

| Critério de Aceite | Exigência | Resultado Obtido | Conformidade |
| :--- | :--- | :--- | :---: |
| **Contrato N3.6** | Criar `GlobalPrescriptionValidationContract.js` | Criado com versionamento `N3.6.0` | **SIM** |
| **Validator N3.6** | Criar `globalPrescriptionValidator.js` | Criado com todos os 20 portões G1-G20 | **SIM** |
| **Policy N3.6** | Criar `globalPrescriptionValidationPolicy.js` | Criado com tolerâncias técnicas auditáveis | **SIM** |
| **Barrel N3.6** | Criar `domain/validation/index.js` | Criado com reexportação pura | **SIM** |
| **Export Central** | Atualizar `domain/contracts/index.js` | Atualizado mantendo exports legados intactos | **SIM** |
| **Portões G1-G20** | Implementar todos os 20 portões | 100% implementados e avaliados | **SIM** |
| **Testes N3.6** | Mínimo de 60 testes específicos | 62 testes criados e 100% aprovados | **SIM** |
| **Regressão Global** | Zero falhas em toda a suíte | 587/587 aprovados (0 falhas) | **SIM** |
| **Git Diff** | `git diff --check` limpo | Limpo, sem erros de formatação | **SIM** |
| **Imutabilidade** | `deepFreeze` e zero mutação do input | Validado nos testes 12.2, 12.3 e 12.4 | **SIM** |
| **Determinismo** | Execuções idênticas produzem saídas iguais | Validado no teste 12.1 | **SIM** |
| **Pureza de Domínio** | Zero DOM, Dexie, Firebase, Gemini, Date.now | Validado nos testes 12.5 e 12.6 | **SIM** |
| **Zero Prescrição Ativa**| Zero seleção, rebalanceamento ou reagendamento | N3.6 é puramente um validador | **SIM** |

---

## 8. CONCLUSÃO FORMAL

Todos os 13 critérios de aceite foram integralmente atendidos.  
Nenhuma funcionalidade da Fase N3.7 foi antecipada.

```text
======================================================
N3.6 STATUS:
APROVADA E FECHADA
======================================================
```
