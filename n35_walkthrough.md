# NUTRIAX PRO — FASE N3.5: WALKTHROUGH FORMAL
# NUTRIENT TIMING ANALYSIS DETERMINÍSTICO CANÔNICO

**Documento**: `n35_walkthrough.md`  
**Versão**: 1.0.0  
**Status**: FASE N3.5 APROVADA E FECHADA  
**Data**: Setembro de 2026  
**Camada de Domínio**: Pura (`domain/timing/` & `domain/contracts/`)  

---

## 1. RESUMO EXECUTIVO

A Fase N3.5 estabelece formalmente a camada de **Nutrient Timing Analysis** do NutriAx Pro.
Trata-se de um motor puramente determinístico e analítico (`analyzeNutrientTiming()`) que consome os dados do contexto nutricional canônico, a montagem de refeições (Fase N3.3) e os horários agendados (Fase N3.4), correlacionando-os com eventos estruturados de exercício físico (musculação e cardio), protocolos de jejum intermitente e microciclo semanal.

A Fase N3.5 respeita o princípio de pureza absoluta: **ela NÃO prescreve nutrientes, NÃO altera alimentos, NÃO altera gramagens, NÃO altera calorias, NÃO altera macronutrientes e NÃO altera os horários de refeição**.

---

## 2. ARQUIVOS CRIADOS E MODIFICADOS

### Arquivos Criados:
1. `domain/contracts/NutrientTimingContract.js`: Contrato canônico versionado (`N3.5.0`), enums `NUTRIENT_TIMING_STATUS`, `TEMPORAL_PRIMARY_RELATION`, `TEMPORAL_SECONDARY_RELATION`, `EVENT_RELATIONS`, DTOs de entrada/saída e validações puras com `deepFreeze`.
2. `domain/timing/nutrientTimingPolicy.js`: Política de análise versionada com parâmetros operacionais auditáveis (`preferredPeriEventWindowMinutes: 150`, `preferredMealEventSeparationMinutes: 45`, `preferredCardioSleepSeparationMinutes: 120`, `defaultSessionDurationMinutes: 60`) e extrator de eventos do microciclo (`resolveDayEvents`).
3. `domain/timing/nutrientTiming.js`: Motor analítico determinístico (`analyzeNutrientTiming()`) executando pipeline em 10 etapas determinísticas.
4. `domain/timing/nutrientTimingValidator.js`: Validador canônico com 20 invariantes estritas de conservação e coerência temporal.
5. `tests/nutrient-timing-n35.test.js`: Suíte completa com **62 testes automatizados** cobrindo contratos, treinos, cardios, jejuns, microciclos, conservação, pureza e determinismo.
6. `n35_architecture_audit.md`: Relatório de auditoria arquitetural e planejamento formal em 24 tópicos.
7. `n35_walkthrough.md`: Este relatório executivo de entrega.

### Arquivos Modificados (Apenas Barrels):
1. `domain/contracts/index.js`: Exporta `NutrientTimingContract` e suas constantes/validadores.
2. `domain/timing/index.js`: Exporta o subsistema N3.5 (`DEFAULT_NUTRIENT_TIMING_POLICY`, `resolveDayEvents`, `validateNutrientTiming`, `analyzeNutrientTiming`) preservando integralmente os módulos da N3.4.

---

## 3. ARQUITETURA DO PIPELINE

```text
┌─────────────────────────────────────────────────────────────┐
│ FASE N2: METAS NUTRICIONAIS                                │
│   N2.1 Energia (TMB/GET) ──► N2.2 Macros ──► N2.3 Validador │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ FASE N3.1 & N3.2: FOOD SOLVER DETERMINÍSTICO                │
│   Catálogo Canônico ──► Otimização Limitada ──► Cesta Global│
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ FASE N3.3: MEAL ASSEMBLY DETERMINÍSTICO                     │
│   Cesta Global ──► Montagem Estruturada de Refeições        │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ FASE N3.4: MEAL TIMING DETERMINÍSTICO                       │
│   Refeições N3.3 ──► Janela Alimentar ──► Horários HH:MM   │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ FASE N3.5: NUTRIENT TIMING ANALYSIS                         │
│   Refeições Agendadas N3.4 + Treino/Cardio/Jejum            │
│   ──► Classificação Temporal Primária & Secundária          │
│   ──► Distâncias Minuto a Minuto & Explicabilidade          │
│   ──► Diagnóstico Consultivo & Detecção de Colisões         │
│   ──► Conservação 100% Inviolável dos Nutrientes            │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. TAXONOMIA TEMPORAL E RELAÇÕES NÃO-MUTUAMENTE EXCLUSIVAS

A N3.5 adota relações desacopladas, evitando a explosão combinatória de strings artificiais:

### Relação Primária (`primaryRelation`):
* `NEUTRAL`: Refeição sem proximidade imediata com sessões estruturadas.
* `PRE_TRAINING`: Refeição imediatamente anterior à musculação dentro da janela operacional preferencial.
* `POST_TRAINING`: Refeição imediatamente posterior à musculação dentro da janela operacional preferencial.
* `PRE_CARDIO`: Refeição imediatamente anterior a uma sessão de cardio estruturada.
* `POST_CARDIO`: Refeição imediatamente posterior a uma sessão de cardio estruturada.
* `BETWEEN_TRAINING_AND_CARDIO`: Refeição situada no intervalo entre musculação e cardio no mesmo dia.
* `REST_DAY`: Dia de descanso explícito (`rest === true`).
* `OVERLAPPING_EVENT`: Violação de integridade física (refeição durante o treino ou cardio).

### Relações Secundárias (`secondaryRelations`):
* `FASTING_CONSTRAINED`: Refeição ancorada na abertura ou encerramento da janela alimentar de jejum.
* `CLOSE_EVENT_PROXIMITY`: Refeição situada a menos de 45 minutos do início ou término de uma sessão.
* `DATA_INSUFFICIENT`: Presença de evento estruturado sem horários (ex: cardio sem `startTime`).

---

## 5. REGRAS HARD E PREFERRED

| Nível | Regra | Comportamento em Violação |
| :--- | :--- | :--- |
| **HARD** | Refeição fora da Janela de Jejum HARD | Status `BLOCKED` com `FASTING_VIOLATION` |
| **HARD** | Colisão física refeição $\cap$ treino/cardio | Status `BLOCKED` com `EVENT_COLLISION` |
| **HARD** | Alteração de alimentos, gramas, calorias ou macros | Status `BLOCKED` pelo validador canônico |
| **HARD** | Alteração de horários definidos na N3.4 | Status `BLOCKED` pelo validador canônico |
| **PREFERRED** | Refeição fora de `preferredPeriEventWindowMinutes` | Refeição fica `NEUTRAL` (não bloqueia) |
| **PREFERRED** | Separação refeição-evento $< 45$ min | Emite tag `CLOSE_EVENT_PROXIMITY` e `WARNING` operacional |
| **PREFERRED** | Cardio com término próximo ao horário de sono ($< 120$ min) | Emite `WARNING` (somente se ambos os horários existirem) |
| **DIAGNÓSTICO**| Treino durante período de jejum (`FASTED_TRAINING`) | Registra diagnóstico; `WARNING` só se houver restrição formal |

---

## 6. CONSERVAÇÃO ABSOLUTA E IMUTABILIDADE

A auditoria matemática automatizada comprovou:
* **Calorias globais e por refeição**: Diferença máxima = `0.00 kcal`.
* **Proteínas globais e por refeição**: Diferença máxima = `0.00 g`.
* **Carboidratos globais e por refeição**: Diferença máxima = `0.00 g`.
* **Gorduras globais e por refeição**: Diferença máxima = `0.00 g`.
* **Fibras e sódio**: 100% conservados.
* **Alimentos e gramagens de cada item**: 100% conservados.
* **Horários `scheduledTime` e `scheduledMinutes`**: 100% intactos.
* **Imutabilidade**: O objeto de saída e todas as suas coleções são profundamente congelados (`deepFreeze`).

---

## 7. RESULTADOS DOS TESTES AUTOMATIZADOS

### Suíte Específica N3.5 (`tests/nutrient-timing-n35.test.js`):
* **Total de Testes**: **62 testes**
* **Aprovados**: **62 testes** (100% PASS)
* **Falhas**: **0**

### Suíte Global de Regressão (`npm test`):
* **Total de Testes**: **525 testes** em 20 suítes
  * Testes anteriores (Fases 1 a 9, N2.1 a N3.4): 463 testes
  * Testes da Fase N3.5: 62 testes
* **Aprovados**: **525 testes** (100% PASS)
* **Falhas**: **0**
* **Regressões**: **0**
* **Tempo de Execução**: ~7.5 segundos

---

## 8. AUDITORIA ESTÁTICA DE PUREZA

Pesquisa recursiva em `domain/timing/`:
* `CANONICAL_DIET_FOODS`: 0 ocorrências
* `Math.random`: 0 ocorrências
* `Date.now`: 0 ocorrências
* `window` / `document`: 0 chamadas de API de navegador (apenas export guard UMD `typeof window !== 'undefined'`)
* `Gemini` / `Dexie` / `firebase`: 0 ocorrências
* `foodsData`: 0 ocorrências
* Termos de prescrição ativa (`rebalance`, `modifyMacros`, `adjustCalories`, `selectFood`): 0 ocorrências

---

## 9. ARQUIVOS INTACTOS E LIMITAÇÕES CONHECIDAS

### Arquivos Intactos:
* `app.js`
* `index.html`
* `db.js`
* `foodsData.js`
* `math.js`
* `firebase-service.js`
* `fasting-module.js`
* Todos os módulos das Fases N2.1, N2.2, N2.3, N3.1, N3.2, N3.3 e N3.4.

### Limitações Conhecidas Documentadas:
1. Sessões de cardio cadastradas no banco legado sem campo `startTime` não geram âncora horária discreta; são formalmente diagnosticadas com tag `DATA_INSUFFICIENT`.
2. A N3.5 não deduz grupos musculares ou fadiga a partir de nomes de exercícios, pois heurísticas lexicais violam o determinismo.
3. A N3.5 não realiza prescrição ou rebalanceamento; recomendações ativas pertencem a fases posteriores formalmente autorizadas.
