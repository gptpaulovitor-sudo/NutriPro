# Contratos Canônicos de Domínio — NutriAx Pro

Este diretório contém a primeira camada formal de **Contratos Canônicos de Domínio (DTOs Puros)** do NutriAx Pro, estruturada de acordo com o padrão arquitetural **Strangler Fig**.

## Princípios Arquiteturais

1. **Pureza Absoluta**: Código JavaScript puro, sem referências a `window`, `document`, DOM, Dexie (`db`), Firebase ou Gemini.
2. **Sem Efeitos Colaterais**: Validações determinísticas e imutabilidade estrutural (`Object.freeze`).
3. **Segurança de Identidade**: `patientId` obrigatório em contratos essenciais; IA nunca pode ser a origem primária de identidade do paciente.
4. **Governança do Split**: Separação clara entre a divisão estrutural de treino (`split`) e a origem que a determinou (`splitSource`).
5. **Multi-Sessão Cardiovascular**: Suporte estrutural nativo a múltiplas sessões semanais de cardio (`CardioPrescriptionDTO.sessions`).

---

## 1. Matriz de Rastreabilidade e Mapeamento

### 1.1 `PatientDTO` (`PatientDTO.js`)

| Campo | Tipo | Obrigatório? | Origem no Legado | Transformação / Normalização | Natureza |
| :--- | :--- | :---: | :--- | :--- | :---: |
| `patientId` | `string` | **SIM** | `db.patients.id` / `activePatientId` | Sanitização para string não-vazia. Rejeita IDs sintéticos gerados por IA. | Canônico |
| `name` | `string` | Não | `db.patients.name` | `trim()`, default `null` | Adaptado |
| `age` | `number` | Não | `db.patients.age` | `parseInt(age, 10)` | Adaptado |
| `sex` | `string` | Não | `db.patients.gender` / `sex` | Normalizado para `'Masculino'`, `'Feminino'` ou `'Outro'` | Canônico |
| `patientType` | `string` | Não | `db.patients.patientType` | `trim()`, default `null` | Adaptado |
| `objective` | `string` | Não | `db.patients.objective` | `trim()`, default `null` | Adaptado |
| `trainingLevel`| `string` | Não | `db.patients.trainingLevel` | `trim()`, default `null` | Adaptado |
| `weightKg` | `number` | Não | `db.patients.currentWeight` / `usualWeight` | `parseFloat()`, arredondamento 2 casas | Canônico |
| `heightCm` | `number` | Não | `db.patients.height` | Converte metros (<3.0) para cm (×100), arredondamento 1 casa | Canônico |

---

### 1.2 `AssessmentDTO` (`AssessmentDTO.js`)

| Campo | Tipo | Obrigatório? | Origem no Legado | Transformação / Normalização | Natureza |
| :--- | :--- | :---: | :--- | :--- | :---: |
| `assessmentId`| `string` | Não | `db.assessments.id` | Preservado como string | Adaptado |
| `patientId` | `string` | **SIM** | `db.assessments.patientId` | Sanitização para string não-vazia | Canônico |
| `date` | `string` | Não | `db.assessments.date` | Preservado (formato ISO ou YYYY-MM-DD) | Adaptado |
| `weightKg` | `number` | Não | `db.assessments.weight` | `Number(weight.toFixed(2))` | Canônico |
| `heightCm` | `number` | Não | `db.assessments.height` | Converte metros para cm se necessário, 1 casa | Canônico |
| `bmi` | `number` | Não | `db.assessments.bmi` / calculado | `Number(bmi.toFixed(2))` | Canônico |
| `bodyFatPercent`| `number` | Não | `db.assessments.fatPercent` | Renomeado de `fatPercent` para `bodyFatPercent`, 2 casas | Canônico |
| `leanMassKg` | `number` | Não | `db.assessments.leanMass` | Renomeado de `leanMass` para `leanMassKg`, 2 casas | Canônico |
| `fatMassKg` | `number` | Não | `db.assessments.fatMass` | Renomeado de `fatMass` para `fatMassKg`, 2 casas | Canônico |
| `waistCm` | `number` | Não | `db.assessments.waist` | Renomeado de `waist` para `waistCm`, 1 casa | Canônico |
| `hipCm` | `number` | Não | `db.assessments.hip` | Renomeado de `hip` para `hipCm`, 1 casa | Canônico |
| `neckCm` | `number` | Não | `db.assessments.circNeck` / `neck` | Renomeado de `circNeck` para `neckCm`, 1 casa | Canônico |
| `rcq` | `number` | Não | `db.assessments.rcq` / `indices.rcq` | 3 casas decimais | Canônico |
| `rcest` | `number` | Não | `db.assessments.rcEst` / `indices.rcEst` | Renomeado de `rcEst` para `rcest`, 3 casas decimais | Canônico |
| `skinfolds` | `object` | Não | `db.assessments.skTriceps`, `skChest`, etc. | Agrupado em mapa normalizado `{ triceps, chest, ... }` em mm | Canônico |

---

### 1.3 `NutritionDTO` (`NutritionDTO.js`)

| Campo | Tipo | Obrigatório? | Origem no Legado | Transformação / Normalização | Natureza |
| :--- | :--- | :---: | :--- | :--- | :---: |
| `patientId` | `string` | Não | `buildPerformanceContext._meta.patientId` | Sanitização | Adaptado |
| `tmbKcal` | `number` | Não | `math.js` / `energy.tmbKcal` | Arredondado para inteiro | Canônico |
| `getKcal` | `number` | Não | `math.js` / `energy.getKcal` | Arredondado para inteiro | Canônico |
| `activityFactor`| `number` | Não | `energy.activityFactor` / `db.patients` | 2 casas decimais | Adaptado |
| `caloricTargetKcal`| `number`| Não | `prescribedKcal ?? getKcal` | Arredondado para inteiro | Canônico |
| `energyBalanceKcal`| `number`| Não | `caloricTargetKcal - getKcal` | Arredondado para inteiro (aceita negativo em déficit) | Canônico |
| `proteinGPerKg`| `number` | Não | `prescRecord.protGKg` / `nutrition.proteinGKg` | 2 casas decimais | Canônico |
| `prescribedKcal`| `number`| Não | Soma calórica dos itens em `db.prescriptions` | Arredondado para inteiro | Canônico |
| `nutritionObjective`| `string`| Não | `db.patients.objective` | Preservado | Adaptado |

---

### 1.4 `TrainingPrescriptionDTO` (`TrainingPrescriptionDTO.js`)

| Campo | Tipo | Obrigatório? | Origem no Legado | Transformação / Normalização | Natureza |
| :--- | :--- | :---: | :--- | :--- | :---: |
| `patientId` | `string` | **SIM** | Contexto / Prescrição | Sanitização para string não-vazia | Canônico |
| `split` | `string` | **SIM** | `perfActiveSplit` / dedução legada | Preservado explicitamente sem sobreposição silenciosa | Canônico |
| `splitSource` | `string` | **SIM** | *Novo Contrato Canônico* | Enum: `'AI'`, `'HUMAN'`, `'CONFIG'`, `'DETERMINISTIC'` | Canônico |
| `frequency` | `number` | **SIM** | `prescription.frequency` / rotinas | Número inteiro entre 1 e 7 | Canônico |
| `routines` | `array` | **SIM** | `aiResponse.routines` / `perfWorkoutPlan` | Array de rotinas estruturadas | Canônico |
| `routines[].routineName` | `string` | **SIM** | `routine.name` / `routine.routineName` | Normalizado para `routineName` | Canônico |
| `routines[].day` | `string` | Não | `routine.day` | String descritiva (ex: 'Dia 1', 'Segunda-feira') | Adaptado |
| `routines[].exercises` | `array` | **SIM** | `routine.exercises` | Array de exercícios estruturados | Canônico |
| `exercises[].exerciseName` | `string` | **SIM** | `ex.name` / `ex.exerciseName` | Normalizado para `exerciseName` | Canônico |
| `exercises[].sets` | `number` | **SIM** | `ex.sets` | Inteiro >= 1 | Canônico |
| `exercises[].reps` | `string/number`| **SIM** | `ex.reps` | String ou número não-vazio (ex: "8-12") | Canônico |
| `exercises[].rpe` | `number` | Não | `ex.rpe` | Número entre 1 e 10 | Canônico |
| `exercises[].restSeconds` | `number` | Não | `ex.restSeconds` | Segundos (0 a 600) | Canônico |

---

### 1.5 `CardioPrescriptionDTO` (`CardioPrescriptionDTO.js`)

| Campo | Tipo | Obrigatório? | Origem no Legado | Transformação / Normalização | Natureza |
| :--- | :--- | :---: | :--- | :--- | :---: |
| `patientId` | `string` | **SIM** | Contexto / Prescrição | Sanitização para string não-vazia | Canônico |
| `weeklyFrequency` | `number` | Não | `sessions.length` | Inteiro correspondente ao número de sessões | Canônico |
| `totalWeeklyMinutes` | `number` | Não | Soma das durações das sessões | Inteiro em minutos | Canônico |
| `sessions` | `array` | **SIM** | `prescription.sessions` (Cardio Engine) | Array de sessões semanais | Canônico |
| `sessions[].cardioId` | `string` | **SIM** | `s.cardioId` / `s.sessionId` / `s.protocolId` | Identificador único da sessão ou protocolo | Canônico |
| `sessions[].day` | `string` | Não | `s.day` | Identificador do dia (ex: 'Dia 2') | Adaptado |
| `sessions[].type` | `string` | Não | `s.type` | Tipo fisiológico (ex: 'LISS', 'HIIT', 'Contínuo') | Canônico |
| `sessions[].durationMinutes` | `number` | **SIM** | `s.durationMinutes` | Inteiro entre 10 e 300 minutos | Canônico |
| `sessions[].intensity` | `string` | Não | `s.intensity` | Descrição de intensidade metabólica | Adaptado |
| `sessions[].modality` | `string` | Não | `s.modality` / `s.protocolTitle` | Equipamento ou modalidade (ex: 'Esteira', 'Bike') | Adaptado |
| `sessions[].heartRateZone`| `string` | Não | `s.heartRateZone` | Zona de FC alvo (ex: 'Z2', 'Z4/Z5') | Canônico |
| `sessions[].targetBpm` | `string` | Não | `s.targetBpm` | Faixa em bpm calculada | Adaptado |

---

### 1.6 `PerformanceContextDTO` (`PerformanceContextDTO.js`)

Snapshot imutável e canônico consolidado do Pilar de Performance (13 domínios fundamentais):

| Domínio | Campos Principais | Origem Primária | Transformação / Matemática | Natureza |
| :--- | :--- | :--- | :--- | :---: |
| `patient` | `patientId`, `name`, `age`, `sex`, `birthDate`, `weightKg`, `heightCm`, `bmi`, `patientType`, `trainingLevel`, `objective` | `db.patients` | `resolvePatientAgeAndProvenance`, `calculateIMC` | Canônico |
| `anamnesis` | `workoutType`, `workoutFrequency`, `workoutDuration`, `sleepHours`, `stressLevel`, `neatRoutine`, `hydrationLiters`, etc. | `db.patients` | Normalização integral sem perdas (preserva 18+ campos) | Canônico |
| `assessment` | `assessmentId`, `date`, `weightKg`, `heightCm`, `bmi`, `bodyFatPercent`, `leanMassKg`, `fatMassKg`, `skinfolds` | `db.assessments` | Snapshot da avaliação mais recente ou `null` | Canônico |
| `anthropometry` | `weightKg`, `heightCm`, `bmi`, `circumferences`, `skinfolds`, `indices` (`rcq`, `rcEst`, `ffmi`, `conicityIndex`) | `db.assessments` | `calculateAnthropometricIndices`, `classifyRCEst` | Canônico |
| `bodyComposition`| `bodyFatPercent`, `targetBodyFatPercent`, `leanMassKg`, `fatMassKg`, `boneMassKg`, `protocol` | `db.assessments` | Equações de Siri / Jackson-Pollock ou `null` se ausente | Canônico |
| `energy` | `tmbKcal`, `getKcal`, `activityFactor`, `caloricTargetKcal`, `caloricTargetSource`, `energyBalanceKcal`, `goalProjection` | `domain/math/nutritionMath.js` | Motor canônico (Katch-McArdle, Mifflin, GET, Alvo Calórico, Balanço) | Canônico |
| `nutrition` | `current` (`prescribedKcal`, `proteinGPerKg`, `macros`, `meals`, `fasting`), `history` | `db.prescriptions`, `db.fastingProtocols` | Separação explícita entre estado ativo e histórico | Canônico |
| `training` | `current` (`mainModality`, `workoutType`, `weeklyFrequency`, `activeSplit`, `splitSource`, `routines`, `weeklySchedule`), `history` | `db.performanceMetabolica` | Separação explícita; preserva split sem alterar regras de inferência | Canônico |
| `cardio` | `current` (`prescribedCardioId`, `weeklyFrequency`, `sessions`, `heartRate`: Tanaka/Karvonen, `restrictions`), `history` | `perfCardioPrescription`, `PERF_CARDIO_DB` | Zonas Tanaka/Karvonen puras | Canônico |
| `constraints` | `injuries`, `painAreas`, `prohibitedExercises`, `restrictedMovements`, `medicalRestrictions`, `availableEquipment`, etc. | `db.patients` | Arrays estruturados e sem duplicidade; `null`/`[]` explícitos | Canônico |
| `clinicalFlags` | `isMinor`, `clinicalReviewRequired`, `reasons` | `domain/rules` | Proteção pediátrica e detecção de riscos cardiometabólicos/lesões | Canônico |
| `provenance` | Metadados de rastreabilidade de cada seção (`source`, `field`, `transform`) | Sistema de Auditoria | Garantia de auditoria forense do snapshot | Canônico |

---

## 2. Uso dos Adaptadores

```javascript
const {
  legacyPatientToPatientDTO,
  legacyAssessmentToAssessmentDTO,
  legacyNutritionToNutritionDTO,
  legacyTrainingToTrainingPrescriptionDTO,
  legacyCardioToCardioPrescriptionDTO,
  buildCanonicalPerformanceContext,
  fetchAndBuildCanonicalPerformanceContext
} = require('./domain/adapters');

// 1. Construção pura a partir de dados em memória (fixtures ou objetos Dexie já lidos)
const contextDTO = buildCanonicalPerformanceContext({
  rawPatient: dbPatient,
  rawAssessment: latestAssessment,
  rawPrescription: activePrescription,
  rawPerformance: performanceRecord
});

// 2. Validação determinística do snapshot de performance
const { validatePerformanceContextDTO } = require('./domain/contracts');
const validation = validatePerformanceContextDTO(contextDTO);
if (!validation.isValid) {
  console.error('Erros no DTO de contexto:', validation.errors);
}
```
