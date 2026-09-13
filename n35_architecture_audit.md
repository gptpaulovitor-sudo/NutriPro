# NUTRIAX PRO — AUDITORIA ARQUITETURAL E PLANEJAMENTO FORMAL
# FASE N3.5 — NUTRIENT TIMING ESPECÍFICO (REVISÃO 2 — PÓS-AUDITORIA)

**Documento**: `n35_architecture_audit.md`  
**Versão**: 2.0.0 (Revisão 2 — Parâmetros Operacionais e Pureza Analítica)  
**Status**: AUDITORIA E PLANO CORRIGIDOS — PRONTO PARA IMPLEMENTAÇÃO  
**Data de Referência**: Setembro de 2026  
**Camada de Domínio**: Pura (`domain/timing/`) — Zero DOM, Zero Dexie/Firebase, Zero Gemini, Zero I/O  

---

## SUMÁRIO EXECUTIVO

A presente auditoria arquitetural revisada estabelece a fundamentação teórica, mapeamento estrutural de dados, taxonomia canônica, regras de validação e desenho contratual para a **Fase N3.5 — Nutrient Timing Específico**.

A Fase N3.5 é estritamente um motor de **análise diagnóstica determinística, classificação temporal e explicabilidade** (`analyzeNutrientTiming()`). Ela opera downstream da Fase N3.4 (Meal Timing) e interpreta a relação cronobiológica entre as refeições agendadas e os eventos de exercício físico (musculação e cardio), protocolos de jejum intermitente e microciclo semanal, **sem jamais alterar alimentos, gramagens, calorias, macronutrientes ou horários**.

---

## 1. ESTADO ATUAL DO CÓDIGO

### 1.1 Status das Fases Anteriores
* **Fase N2.1 (Energy Target)**: Fechada, 100% pura, aprovada com 50/50 testes.
* **Fase N2.2 (Macro Targets)**: Fechada, 100% pura, aprovada com 48/48 testes.
* **Fase N2.3 (Nutrition Target Validator)**: Fechada, 100% pura, aprovada com 65/65 testes.
* **Fase N3.1 (Food Contract & DTOs)**: Fechada, contratos canônicos aprovados com 17/17 testes.
* **Fase N3.2 (Food Solver Determinístico)**: Fechada, 100% determinística, aprovada com 36/36 testes.
* **Fase N3.3 (Meal Assembly Determinístico)**: Fechada, 100% pura, aprovada com 49/49 testes.
* **Fase N3.4 (Meal Timing Determinístico)**: Fechada, 100% pura, aprovada com 65/65 testes.
* **Suíte Global Atual**: **463/463 testes passando com 0 falhas** em 20 arquivos de teste.
* **Integração Externa**: Zero dependência de UI, Dexie, Firebase ou Gemini na camada de domínio.

### 1.2 Mapeamento dos Módulos Existentes
1. `domain/contracts/NutritionPrescriptionContextDTO.js`: Contrato canônico imutável de contexto clínico, antropométrico, energético, rotina, treino, cardio, microciclo e jejum.
2. `domain/contracts/TrainingPrescriptionDTO.js`: Contrato de divisão (split) de musculação, rotinas e exercícios.
3. `domain/contracts/CardioPrescriptionDTO.js`: Contrato de prescrição cardiovascular multi-sessão.
4. `domain/contracts/MealAssemblyContract.js`: Contrato de montagem de refeições da N3.3.
5. `domain/contracts/MealTimingContract.js`: Contrato de entrada e saída do agendamento temporal da N3.4.
6. `domain/timing/mealTiming.js`: Motor de posicionamento temporal de refeições dentro da janela alimentar.
7. `domain/timing/mealTimingPolicy.js`: Política de timing, resolução de eating window e extração de eventos temporais.
8. `domain/timing/mealTimingValidator.js`: Validador de conservação física e limites temporais da N3.4.
9. `fasting-module.js`: Módulo de firewall clínico e protocolo de jejum intermitente.

---

## 2. FONTES DE VERDADE

| Domínio de Dados | Fonte Canônica no Domínio | Representação em Runtime / Banco |
| :--- | :--- | :--- |
| **Treinamento de Musculação** | `context.training` (`TrainingPrescriptionDTO.js`) | `db.performanceMetabolica` (campo `workoutPlan`, `activeSplit`, `meta`) e `localStorage` |
| **Treinamento Cardiovascular** | `context.cardio` (`CardioPrescriptionDTO.js`) | `db.performanceMetabolica.cardioPrescription` e `perfCardioPrescription` |
| **Microciclo Semanal** | `context.weeklySchedule` | `db.performanceMetabolica.weeklySchedule` gerado por `perfNormalizeWeeklySchedule` |
| **Horários de Treino** | `context.routine.workoutTime` ou `context.training.workoutTime` | `routine.workoutTime` coletado na anamnese / aba rotina |
| **Horários de Cardio** | `session.startTime` ou `session.time` em `context.cardio.sessions` | Propriedade opcional dentro das sessões em `cardioPrescription` |
| **Jejum Intermitente** | `context.fasting` (`hasActiveProtocol`, `feedingWindows`, etc.) | `db.fastingProtocols` e estado gerenciado por `fasting-module.js` |
| **Rotina Diária** | `context.routine` (`wakeUpTime`, `bedTime`, `workoutTime`) | Registro do paciente em `db.patients.routine` |
| **Refeições Montadas (N3.3)** | `mealAssemblyResult.meals` (`mealId`, `items`, `totals`) | Saída determinística do motor `domain/meal/mealAssembly.js` |
| **Horários Agendados (N3.4)** | `mealTimingResult.meals` (`scheduledTime`, `intervalToNextMinutes`) | Saída determinística do motor `domain/timing/mealTiming.js` |

---

## 3. DADOS TEMPORAIS DISPONÍVEIS

Os seguintes dados temporais possuem existência física comprovada na arquitetura:
1. `mealTimingResult.meals[i].scheduledTime`: String em formato `"HH:MM"` (ex: `"12:30"`).
2. `mealTimingResult.meals[i].scheduledMinutes`: Inteiro entre `0` e `1439` (minutos desde 00:00).
3. `mealTimingResult.meals[i].intervalToNextMinutes`: Intervalo inteiro em minutos até a próxima refeição.
4. `mealTimingResult.eatingWindow`: Objeto com `start`, `end`, `startMinutes`, `endMinutes`, `durationMinutes`, `strength` (`HARD` ou `PREFERRED`) e `source`.
5. `mealTimingResult.temporalEvents`: Array de eventos `{ eventType, start, end, startMinutes, endMinutes, durationMinutes, source }`.
6. `context.routine.wakeUpTime`: String `"HH:MM"` ou `null`.
7. `context.routine.bedTime`: String `"HH:MM"` ou `null`.
8. `context.routine.workoutTime`: String `"HH:MM"` ou `null`.
9. `context.training.sessionDurationMinutes`: Número em minutos ou `null`.
10. `context.cardio.sessions[i].durationMinutes`: Número inteiro em minutos.
11. `context.cardio.sessions[i].startTime`: String `"HH:MM"` (quando fornecida) ou ausente.
12. `context.weeklySchedule[i].rest`: Booleano identificando dia de descanso (`true` ou `false`).
13. `context.weeklySchedule[i].dayKey`: String identificadora do dia (`"d1"` a `"d7"`).

---

## 4. DADOS TEMPORAIS AUSENTES

Os seguintes dados NÃO existem de forma estruturada no código atual e **NÃO DEVEM SER INVENTADOS**:
1. **Horário de início padrão de sessões de cardio**: Na grande maioria dos registros existentes, sessões de cardio possuem apenas modalidade, duração (`durationMinutes`) e dia (`dayKey`), sem campo `startTime`.
2. **Tempo fisiológico de digestão individual**: O sistema **não calcula tempo fisiológico de digestão** nem taxas dinâmicas de esvaziamento gástrico.
3. **Duração da ingestão**: As refeições são tratadas como pontos discretos no tempo (`scheduledMinutes`), não como intervalos de ingestão com início e término.
4. **Cardápio específico por dia da semana**: As fases N3.2, N3.3 e N3.4 produzem uma prescrição representativa diária (24 horas). O microciclo (`weeklySchedule`) alterna treinos em 7 dias, mas a prescrição nutricional atual opera em nível de dia canônico de treino ou dia canônico geral.

---

## 5. LIMITAÇÕES REAIS E HEURÍSTICAS PROIBIDAS

1. **REST_DAY Estritamente Estruturado**: A classificação `REST_DAY` só pode ocorrer se o campo `rest === true` existir explicitamente no dia avaliado. É terminantemente proibido inferir descanso por:
   * ausência de treino;
   * ausência de cardio;
   * nome do dia (ex: "Domingo");
   * nome de rotina ou exercício;
   * análise de texto livre.
2. **Proibição de Parsing Lexical de Exercícios**: Não é permitido deduzir tipo de treino inspecionando strings de exercícios. O sistema opera estritamente sobre propriedades estruturadas (`dayKey`, `routineId`, `training.intensity`, `rest`).
3. **Proibição de Carb Cycling Artificial**: Conforme estabelecido na Fase N1.1 e validado em `NutritionPrescriptionContextDTO.js`, campos como `carbLevel` ou regras de ciclagem de carboidratos no microciclo são terminantemente proibidos na camada canônica.
4. **Ausência de Horário $\to$ `DATA_INSUFFICIENT`**: Se um paciente não possui `workoutTime` informado no contexto, a N3.5 não adivinha horários. Registra diagnóstico `DATA_INSUFFICIENT` e mantém classificação neutra.

---

## 6. FRONTEIRA DA FASE N3.5

### O que a N3.5 É:
* Um motor de **análise diagnóstica determinística de Nutrient Timing, classificação temporal de refeições e explicabilidade** (`analyzeNutrientTiming()`).
* Uma camada pura que consome o `mealTimingResult` da N3.4 e o enriquece com metadados de proveniência temporal e relações com eventos.
* Um validador determinístico da compatibilidade temporal entre a ingestão nutricional calculada e os eventos estruturados de exercício e jejum.

### Proibição Absoluta de Prescrição ou Rebalanceamento:
A N3.5 **JAMAIS** poderá alterar:
* calorias globais ou por refeição;
* proteína total ou por refeição;
* carboidrato total ou por refeição;
* gordura total ou por refeição;
* fibra ou sódio;
* alimentos selecionados;
* gramagens de alimentos;
* quantidade de refeições $M$;
* horários definidos pela Fase N3.4.

Qualquer recomendação futura de redistribuição nutricional pertence a uma fase posterior e explicitamente autorizada.

---

## 7. TAXONOMIA TEMPORAL E RELAÇÕES NÃO-MUTUAMENTE EXCLUSIVAS

Para evitar a proliferação de estados combinatórios artificiais (como `PRE_TRAINING_FASTING`), a N3.5 adota uma estrutura desacoplada:

```text
refeição.temporalClassification = {
  primaryRelation: TEMPORAL_PRIMARY_RELATION,
  secondaryRelations: [TEMPORAL_SECONDARY_RELATION, ...],
  proximityMinutes: number | null,
  timingRationale: string
}
```

### Relação Primária (`primaryRelation`):
```text
TEMPORAL_PRIMARY_RELATION:
  ├── NEUTRAL                     (Refeição sem proximidade imediata com treino/cardio)
  ├── PRE_TRAINING                (Refeição posicionada na janela operacional preferencial antes da musculação)
  ├── POST_TRAINING               (Refeição posicionada na janela operacional preferencial após a musculação)
  ├── PRE_CARDIO                  (Refeição posicionada na janela operacional preferencial antes do cardio)
  ├── POST_CARDIO                 (Refeição posicionada na janela operacional preferencial após o cardio)
  ├── BETWEEN_TRAINING_AND_CARDIO (Refeição situada no intervalo entre musculação e cardio no mesmo dia)
  └── REST_DAY                    (Prescrição avaliada sob dia com rest === true explicitamente estruturado)
```

### Relações Secundárias (`secondaryRelations`):
```text
TEMPORAL_SECONDARY_RELATION:
  ├── FASTING_CONSTRAINED         (Refeição posicionada na abertura ou encerramento da janela alimentar de jejum)
  ├── CLOSE_EVENT_PROXIMITY       (Refeição próxima ao evento operacional, dentro de preferredMealEventSeparationMinutes)
  └── EXTENDED_WINDOW_OFFSET      (Refeição situada em margem estendida de janela preferencial)
```

Essa modelagem permite que uma refeição seja simultaneamente:
```json
{
  "primaryRelation": "PRE_TRAINING",
  "secondaryRelations": ["FASTING_CONSTRAINED"],
  "proximityMinutes": 75,
  "timingRationale": "Refeição agendada 75 min antes do treino estruturado e ancorada na abertura da janela alimentar de jejum."
}
```

---

## 8. REGRAS DURAS (HARD RULES) — VIOLAÇÃO $\to$ `BLOCKED`

Qualquer violação de regra dura indica quebra de invariante do pipeline e resulta em `status: BLOCKED`:
1. **HARD 1 — Violação de Janela de Jejum HARD**: Nenhuma refeição pode ter `scheduledMinutes` situado no interior de uma janela de jejum estrito (`WINDOW_STRENGTH.HARD`).
2. **HARD 2 — Colisão Física Refeição $\times$ Evento**: Nenhuma refeição pode ocorrer dentro do intervalo de um evento temporal estruturado ($T_{start} \le T_{meal} \le T_{end}$). Se ocorrer, trata-se como **violação de contrato/invariante da cadeia N3.4 $\to$ N3.5**, e não como nova regra clínica.
3. **HARD 3 — Conservação Absoluta de Nutrientes**: Calorias, proteínas, carboidratos, gorduras e fibras devem coincidir exatamente com os valores de saída da N3.4 (tolerância 0.00).
4. **HARD 4 — Conservação de Identidade de Refeições**: Proibido alterar `mealId`, `mealIndex`, `mealName`, `mealRole`, itens de alimentos ou gramagens.
5. **HARD 5 — Monotonicidade Cronológica**: Os horários das refeições devem manter ordem estritamente crescente.

---

## 9. PREFERÊNCIAS OPERACIONAIS (PREFERRED) — VIOLAÇÃO $\to$ `WARNING`

Parâmetros operacionais versionados que orientam o timing sem bloquear a prescrição:
1. **PREFERRED 1 — Janela Peri-Evento Operacional (`preferredPeriEventWindowMinutes`)**:
   * Define o intervalo de busca temporal preferencial ao redor da sessão (ex: parâmetro versionado de 120 ou 150 minutos).
   * Possui natureza **exclusivamente PREFERRED**.
   * Estar fora dessa janela **gera WARNING operacional, NUNCA BLOCKED**.
   * **NÃO significa que comer antes ou depois do treino seja obrigatório**.
2. **PREFERRED 2 — Separação Refeição-Evento (`preferredMealEventSeparationMinutes`)**:
   * Define a separação temporal operacional preferencial entre o horário da refeição e o início do evento (ex: 45 minutos).
   * **NÃO representa cálculo de tempo fisiológico de digestão**. Representa apenas espaçamento prático de rotina.
   * Separação inferior ao parâmetro emite `WARNING: "Separação temporal operacional entre refeição e início do evento inferior ao intervalo preferencial de X min."`
3. **PREFERRED 3 — Relação Cardio $\to$ Sono**:
   * Só é avaliada se existirem **simultaneamente**:
     1. Horário estruturado de término do cardio (`cardioEndMinutes`);
     2. Horário estruturado de sono (`context.routine.bedTime`);
     3. Parâmetro temporal versionado (`preferredCardioSleepSeparationMinutes`, ex: 120 min).
   * Se qualquer um dos dados estruturados estiver ausente, a avaliação é suprimida ou emite `DATA_INSUFFICIENT`, sem qualquer inferência de horário.

---

## 10. DIAGNÓSTICO DE JEJUM E `FASTED_TRAINING`

1. **Natureza Estritamente Diagnóstica**:
   * `FASTED_TRAINING` é uma classificação diagnóstica descritiva informando que a sessão de treino ocorre durante o período de jejum do paciente.
2. **Sem Warning Automático**:
   * O sistema **NÃO gera WARNING automaticamente** apenas porque o treino ocorre durante o jejum. O treino em jejum é uma escolha deliberada em diversos protocolos e rotinas.
3. **Critério de Alerta**:
   * Somente gera `WARNING` ou `BLOCKED` se existir um **conflito formal com regra canônica já fornecida pelo contexto ou protocolo de jejum** (por exemplo, quando o protocolo ativo estipular restrição expressa de esforço em jejum ou quando a janela alimentar HARD for violada).
   * A N3.5 não cria nenhuma nova regra clínica de jejum.

---

## 11. TRATAMENTO DE TREINAMENTO DE MUSCULAÇÃO

1. **Extração de Horários**:
   * `trainStart`: `context.routine.workoutTime` ou `context.training.workoutTime`.
   * `duration`: `context.training.sessionDurationMinutes` ou fallback versionado de política (`defaultSessionDurationMinutes`, 60 min).
   * `trainEnd`: `trainStart + duration`.
2. **Classificação Determinística**:
   * Se $T_{train\_start} - preferredPeriEventWindowMinutes \le T_{meal} < T_{train\_start}$: a refeição imediatamente mais próxima antes do treino recebe `primaryRelation: PRE_TRAINING`.
   * Se $T_{train\_end} < T_{meal} \le T_{train\_end} + preferredPeriEventWindowMinutes$: a refeição imediatamente mais próxima após o treino recebe `primaryRelation: POST_TRAINING`.
   * Se não houver refeição dentro desse intervalo operacional, nenhuma refeição é forçada a ser pré ou pós-treino (recebem `NEUTRAL`).

---

## 12. TRATAMENTO DE TREINAMENTO CARDIOVASCULAR

1. **Sessão com Horário Estruturado**:
   * Possui `startTime` definido em `cardio.sessions[i]`.
   * Permite classificação determinística `PRE_CARDIO` e `POST_CARDIO` segundo `preferredPeriEventWindowMinutes`.
2. **Sessão sem Horário de Início**:
   * Se `startTime` for nulo ou ausente, a N3.5 **não adivinha horário**.
   * Registra diagnóstico: `cardioUnscheduled: true` com nível `INFO` ou `WARNING` de dados incompletos (`DATA_INSUFFICIENT`).
3. **Cardio Imediatamente Pós-Treino**:
   * Quando o cardio ocorre na sequência do treino de musculação, a primeira refeição subsequente recebe `primaryRelation: POST_TRAINING` e relação secundária ou tag diagnóstica `POST_CARDIO`.

---

## 13. TRATAMENTO DO MICROCICLO SEMANAL

1. **Critério Canônico de Descanso**:
   * Apenas dias com `context.weeklySchedule[i].rest === true` são tratados como `REST_DAY`.
2. **Efeito em `REST_DAY`**:
   * Todas as refeições recebem `primaryRelation: REST_DAY`.
   * Nenhuma refeição busca proximidade peri-evento.
   * Se `rest` não for explicitamente verdadeiro, o dia é processado com base nos eventos nele cadastrados.

---

## 14. MATRIZ FORMAL DE CONFLITOS

| Cenário de Conflito | Gravidade | Tratamento N3.5 | Justificativa Arquitetural |
| :--- | :--- | :--- | :--- |
| **Refeição em Janela de Jejum HARD** | `BLOCKED` | Execução bloqueada | Violação de barreira temporal rígida do protocolo de jejum |
| **Colisão Física Refeição $\times$ Evento** | `BLOCKED` | Execução bloqueada | Invariante da cadeia N3.4 $\to$ N3.5 violada (incompatibilidade física) |
| **Tentativa de Alterar Macros ou Gramas** | `BLOCKED` | Execução bloqueada | Violação de integridade contratual da N2/N3 |
| **Separação Refeição-Evento $< preferredMealEventSeparationMinutes$** | `WARNING` | Emite alerta operacional | Separação prática reduzida entre a ingestão e o início da atividade |
| **Sessão de Treino sem Horário Estruturado** | `WARNING` | `DATA_INSUFFICIENT` | Impossível calcular proximidade temporal peri-treino |
| **Cardio sem Horário de Início** | `WARNING` / `INFO` | `DATA_INSUFFICIENT` | Identificado no dia, mas sem âncora cronológica para pré/pós cardio |
| **Treino durante Jejum (Fasted Training)** | `INFO` / `WARNING` | Diagnóstico descritivo | Emitido como diagnóstico; WARNING apenas se houver conflito com protocolo |

---

## 15. ESTADOS DO SISTEMA: PASS / WARNING / BLOCKED

```text
STATUS FINAL N3.5:
  ├── PASS:
  │     - Nenhuma regra HARD ou invariante violada;
  │     - Dados de horários estruturados completos;
  │     - Separações temporais operacionais atendidas;
  │     - Nenhum conflito operacional pendente.
  │
  ├── WARNING:
  │     - Nenhuma regra HARD violada (viabilidade matemática intacta);
  │     - Desvio de preferência operacional (ex: separação curta, janela estendida);
  │     - Dados de horário ausentes para cardio ou treino (DATA_INSUFFICIENT);
  │     - Conflito formal com recomendação de protocolo de jejum.
  │
  └── BLOCKED:
        - Violação de janela de jejum HARD;
        - Colisão física de refeição com horário de exercício;
        - Qualquer quebra de conservação de alimentos, gramagens, calorias ou macros da N3.4.
```

---

## 16. CONTRATOS PROPOSTOS (NÃO IMPLEMENTAR AINDA)

### 16.1 Arquivo: `domain/contracts/NutrientTimingContract.js`
* Versão: `"1.0.0"`.
* Enums:
  * `NUTRIENT_TIMING_STATUS`: `{ PASS: 'PASS', WARNING: 'WARNING', BLOCKED: 'BLOCKED' }`
  * `TEMPORAL_PRIMARY_RELATION`: `{ NEUTRAL, PRE_TRAINING, POST_TRAINING, PRE_CARDIO, POST_CARDIO, BETWEEN_TRAINING_AND_CARDIO, REST_DAY }`
  * `TEMPORAL_SECONDARY_RELATION`: `{ FASTING_CONSTRAINED, CLOSE_EVENT_PROXIMITY, EXTENDED_WINDOW_OFFSET }`
* DTO de Entrada: `NutrientTimingInputDTO`
  * `context`: Objeto `NutritionPrescriptionContextDTO` válido.
  * `mealTimingResult`: Objeto `MealTimingOutputDTO` válido da N3.4 (com status diferente de `BLOCKED`).
  * `targetDayKey`: String opcional (ex: `"d1"`).
  * `customPolicy`: Objeto opcional de política.
* DTO de Saída: `NutrientTimingOutputDTO`
  * `timingAnalysisVersion`: `"N3.5.0"`
  * `timingVersion`: `"N3.4.0"`
  * `assemblyVersion`: `"N3.3.0"`
  * `solverVersion`: `"N3.2.0"`
  * `status`: `NUTRIENT_TIMING_STATUS`
  * `valid`: Booleano
  * `meals`: Array de refeições com `temporalClassification` desacoplado em `primaryRelation`, `secondaryRelations`, `proximityMinutes` e `timingRationale`, preservando integralmente itens, totais, `scheduledTime` e `scheduledMinutes` da N3.4.
  * `diagnostics`: Array de strings diagnósticas.
  * `warnings`: Array de strings de aviso.
  * `blockingReasons`: Array de strings de bloqueio.
  * `provenance`: Objeto auditável com motor e versões.

---

## 17. POLÍTICA PROPOSTA

### Arquivo: `domain/timing/nutrientTimingPolicy.js`
Parâmetros canônicos versionados sem alegações clínicas universais:
```javascript
const DEFAULT_NUTRIENT_TIMING_POLICY = Object.freeze({
  policyVersion: '1.0.0',
  analysisVersion: 'N3.5.0',

  // Janela operacional preferencial peri-evento (minutos)
  preferredPeriEventWindowMinutes: 150, // PREFERRED: janela para detecção de proximidade

  // Separação temporal operacional preferencial entre refeição e evento (minutos)
  preferredMealEventSeparationMinutes: 45, // PREFERRED: separação prática de rotina (não é cálculo de digestão fisiológica)

  // Separação temporal operacional preferencial entre cardio e sono (minutos)
  preferredCardioSleepSeparationMinutes: 120, // Avaliado apenas se houver cardioEnd e bedTime estruturados

  // Duração padrão estimada de sessão quando não informada (minutos)
  defaultSessionDurationMinutes: 60
});
```

---

## 18. MOTOR PROPOSTO

### Arquivo: `domain/timing/nutrientTiming.js`
Função canônica pura:
```javascript
function analyzeNutrientTiming(input, customPolicy = {})
```
Fluxo de execução determinístico:
1. **Portão de Validação**: Rejeita entradas nulas ou N3.4 em estado `BLOCKED`.
2. **Contextualização de Microciclo**: Inspeciona se `context.weeklySchedule` possui `rest === true` no dia selecionado.
3. **Mapeamento de Eventos**: Extrai eventos estruturados de musculação e cardio.
4. **Classificação Temporal Desacoplada**: Determina `primaryRelation` e `secondaryRelations` com base estritamente em minutos e regras PREFERRED.
5. **Diagnóstico de Jejum e Rotina**: Avalia se há treino em jejum (`FASTED_TRAINING`) emitindo diagnóstico, e avalia cardio $\to$ sono se ambos os horários existirem.
6. **Validação e Congelamento**: Executa o validador da N3.5 e retorna objeto imutável profundamente congelado (`deepFreeze`).

---

## 19. VALIDADOR PROPOSTO

### Arquivo: `domain/timing/nutrientTimingValidator.js`
Função canônica pura:
```javascript
function validateNutrientTiming(output, sourceTimingResult, policy)
```
Invariantes estritas:
1. Quantidade de refeições idêntica à N3.4 ($M_{N3.5} = M_{N3.4}$).
2. Preservação integral de cada refeição (`mealId`, `mealIndex`, `mealName`, `mealRole`, `scheduledTime`, `scheduledMinutes`, `items`, `totals`).
3. Preservação absoluta dos totais globais de nutrientes (tolerância 0.00).
4. Toda refeição possui `primaryRelation` pertencente ao enum canônico.
5. `REST_DAY` atribuído exclusivamente se `rest === true` no contexto.
6. Nenhuma refeição com colisão física em estado `PASS`.

---

## 20. ESTRATÉGIA DE TESTES

A suíte `tests/nutrient-timing-n35.test.js` deverá conter no mínimo 50 testes automatizados cobrindo:
1. **Validação de Portão**: Rejeição de entradas inválidas e N3.4 bloqueada.
2. **Classificação Peri-Treino**: Detecção correta de `PRE_TRAINING` e `POST_TRAINING` dentro de `preferredPeriEventWindowMinutes`.
3. **Múltiplas Refeições**: Atribuição determinística à refeição mais próxima do evento.
4. **Classificação Peri-Cardio**: Cardio independente com `startTime` vs cardio pós-treino imediato.
5. **Cardio sem Horário**: Verificação de `DATA_INSUFFICIENT` sem inferência arbitrária de horário.
6. **Cardio e Sono**: Teste de avaliação condicionada estritamente à presença simultânea de término de cardio e hora de dormir.
7. **Microciclo e Descanso**: Prova de que `REST_DAY` só é gerado se `rest === true`, e que ausência de treino não gera `REST_DAY`.
8. **Jejum e Fasted Training**: Treino durante jejum como diagnóstico sem `WARNING` indevido; geração de alerta apenas se houver conflito com protocolo.
9. **Colisão Física**: Refeição durante sessão resultando em violação contratual (`BLOCKED`).
10. **Conservação e Pureza**: Prova matemática de que nenhum nutriente, alimento ou horário foi modificado.

---

## 21. CRITÉRIOS DE ACEITAÇÃO DA FASE N3.5

A implementação futura só poderá ser considerada aprovada se atender a todos os seguintes critérios:
1. **Determinismo**: Resultados 100% reproduzíveis com `deepStrictEqual`.
2. **Ausência de Mutação**: Zero alteração em objetos de entrada; imutabilidade via `deepFreeze`.
3. **Ausência de Seleção Alimentar**: Zero novos alimentos selecionados ou substituídos.
4. **Ausência de Alteração Nutricional**: Zero alteração em calorias, proteínas, carboidratos, gorduras, fibras ou sódio.
5. **Ausência de Alteração Temporal**: Zero alteração nos horários agendados pela N3.4.
6. **Ausência de Nova Lógica Clínica de Jejum**: Respeito passivo aos protocolos do `fasting-module.js`.
7. **Ausência de Heurística Lexical**: Zero parsing de nomes de exercícios ou dias da semana para inferir descanso ou grupo muscular.
8. **Ausência de IA**: Zero dependência de Gemini/LLM.
9. **Ausência de Infraestrutura**: Zero dependência de DOM, Dexie ou Firebase na camada de domínio.
10. **Cobertura de Testes**: Mínimo de 50 testes específicos para a N3.5.
11. **Regressão Global**: 100% de aprovação na suíte global existente (463/463 anteriores + testes N3.5).

---

## 22. CONCLUSÃO

A auditoria e o plano da Fase N3.5 foram integralmente corrigidos e alinhados às diretrizes de pureza analítica e ausência de regras clínicas arbitrárias. O escopo está estritamente delimitado e pronto para a codificação assim que autorizado.
