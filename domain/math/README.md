# Matriz de Equivalência e Auditoria Matemática Canônica — NutriAx Pro

Este documento estabelece a auditoria completa, o mapeamento de consumidores e a matriz de equivalência matemática do **NutriAx Pro**, servindo como base técnica para o **Motor Matemático Canônico** (`domain/math/nutritionMath.js`) sob o padrão **Strangler Fig**.

---

## 1. Princípios da Governança Matemática

1. **Prioridade Clínica**: A regra clínica fundamentada tem precedência sobre conveniências de código de UI.
2. **Separação entre Cálculo e Apresentação**: Cálculos numéricos são funções puras e determinísticas; rótulos de apresentação e badges de UI não devem distorcer a matemática subjacente.
3. **Preservação de Baseline**: Nenhum consumidor legado é alterado sem teste prévio de equivalência e plano de transição formal.
4. **Transparência de Divergências**: Divergências entre arquivos legados (`math.js`), protótipos (`utils/nutritionMath.ts`) e o contexto unificado (`buildPerformanceContext` em `app.js`) são catalogadas explicitamente.

---

## 2. Matriz Geral de Equivalência e Classificação

| Função / Grandeza | Arquivo Fonte | Fórmula / Lógica Atual | Consumidores Principais | Classificação | Status de Transição |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **IMC (BMI)** | `math.js` L6<br>`nutritionMath.ts` L34 | `peso / (alturaM²)` | `app.js` L1838, L14808, Aba Avaliação, PWA Mobile | **CANÔNICO** | `math.js` e `nutritionMath.ts` são equivalentes (2 casas decimais). Em `app.js` L14808 arredonda para 1 casa decimal. |
| **TMB (Katch-McArdle)** | `math.js` L40<br>`nutritionMath.ts` L73 | `370 + 21.6 × MassaMagraKg` | `app.js` L1839, L14852, Pilar 4 Performance | **CANÔNICO** | Prioritária sempre que houver Massa Magra válida (> 0). Idêntica em ambos os arquivos. |
| **TMB (Mifflin-St Jeor)** | `math.js` L49<br>`nutritionMath.ts` L81 | Homem: `10×P + 6.25×AltCm - 5×Idade + 5`<br>Mulher: `10×P + 6.25×AltCm - 5×Idade - 161` | `app.js` L1839, L14852 (fallback quando LBM = 0) | **CANÔNICO** | Utilizada como fallback primário quando não há dobras/bioimpedância. Idêntica em ambos. |
| **TMB Multi-Métodos** | `math.js` L241 | Katch, Cunningham (`500 + 22×LBM`), Mifflin, Harris-Benedict (1984) | `app.js` L1851 (Aba 5 / Avaliação) | **LEGADO / INFORMATIVO** | Comparador informativo na interface clínica. Preservado para exibição. |
| **Fator de Atividade (FA)** | `math.js` L69<br>`app.js` L201, L14778 | Padrão: `1.42` (Levemente ativo / recreativo) | Anamnese, Avaliação, Performance Context | **CANÔNICO (DEFAULT)** | `1.42` funciona como fallback seguro no sistema quando o paciente não possui FA específico gravado. |
| **GET (Gasto Energético)** | `math.js` L69<br>`nutritionMath.ts` L99 | `TMB × FatorAtividade` | `app.js` L1840, L10939, L14856, Pilar 4 | **CANÔNICO** | Idêntico em todas as camadas. |
| **Alvo Calórico Legado** | `app.js` L1861-1867 | Perda: `GET - 468`<br>Hipertrofia: `GET + 350`<br>Manutenção: `GET` | `app.js` L1862 (Aba Avaliação / `resCaloricTarget`), `index.html` L2670, L2719 | **LEGADO** | Números mágicos estáticos de UI. Devem ser substituídos progressivamente pela regra canônica da prescrição. |
| **Alvo Calórico Canônico (`caloricTargetKcal`)** | `app.js` L14871 | `prescribedKcal ?? getKcal` | `buildPerformanceContext`, IA Gemini, Cardio Engine, Auditoria de Drift | **CANÔNICO** | Se houver cardápio ativo prescrito (`prescribedKcal`), usa o alvo real; senão, usa o GET. |
| **Balanço Energético (`energyBalanceKcal`)** | `app.js` L14872 | `caloricTargetKcal - getKcal` | Gemini Guardrails, Auditoria, Validação de Déficit | **CANÔNICO** | Negativo = Déficit; Zero = Normocalórico; Positivo = Superávit. |
| **Jackson-Pollock 7 Dobras** | `math.js` L78<br>`nutritionMath.ts` L107 | Homem: `1.112 - 0.00043499·S + 0.00000055·S² - 0.00028826·Idade`<br>Mulher: `1.097 - 0.00046971·S + 0.00000056·S² - 0.00012828·Idade` | `app.js` L1837 (Aba Avaliação) | **CANÔNICO** | Fórmula de densidade corporal idêntica em ambos os arquivos. |
| **Fórmula de Siri** | `math.js` L120<br>`nutritionMath.ts` L146 | `%Gordura = ((4.95 / Densidade) - 4.50) × 100` | `app.js` L1837, L1897 | **CANÔNICO** | Clamp inferior de segurança em 3% em ambos. `math.js` possui clamp superior em 65%. |
| **Relação Cintura-Quadril (RCQ)** | `math.js` L186<br>`nutritionMath.ts` L189 | `CinturaCm / QuadrilCm` | `app.js` L1841, L14846, L14963 | **CANÔNICO** | Risco: Homem >= 0.90 / Mulher >= 0.85. Idêntico em ambos. |
| **Relação Cintura-Estatura (RCEst)** | `math.js` L192<br>`nutritionMath.ts` L195 | `CinturaCm / EstaturaCm` | `app.js` L1841, L14933, L14961, Fasting Circuit-Breaker | **CANÔNICO** | Limiares: `< 0.50` (Ideal) / `0.50-0.60` (Limítrofe) / `> 0.60` (Elevado). Divergência apenas textual de rótulo. |
| **Massa Muscular Esquelética (MME)** | `math.js` L197<br>`nutritionMath.ts` L202 | `AltM × (0.244·Peso + 7.8) - 0.098·Idade + 6.6·Sexo` (Lee et al.) | `app.js` L1841, L14968 | **CANÔNICO** | Idêntico em ambos os arquivos. |
| **Área Muscular do Braço Corrigida (AMBc)** | `math.js` L201<br>`nutritionMath.ts` L206 | `CMB = Braço - π·(Tríceps/10)`<br>`AMBc = (CMB² / 4π) - SexCorrection` | `app.js` L1841, L14948 | **CANÔNICO** | Correção de sexo: Homem 10.0, Mulher 6.5. |
| **Projeção Preditiva de Metas** | `math.js` L788 | `PesoAlvo = MLG / (1 - TargetBF/100)`<br>`Dias = (GorduraPerder × 7700) / DéficitDiário` | `app.js` L1873, L15005 (Aba 17 e Performance Context) | **CANÔNICO** | Assume 1kg gordura = 7700 kcal. Idêntico em produção. |
| **Porcionamento de Macros** | `math.js` L416 | `Fator = QuantidadeAlvo / 100`<br>`Nutriente = Nutriente100g × Fator` | `app.js` L2073, L2090, L4383, L4400 (Dieta e R24h) | **CANÔNICO** | Regra estrita de proporcionalidade linear a partir da base oficial TACO/TBCA. |
| **Cálculo de Metas de Macros** | `math.js` L1030 | Distribuição por objetivo (Perda: 2.0-2.2 g/kg prot; Hipertrofia: 1.8-2.0 g/kg prot; carbo como saldo residual) | `app.js` L2233, L2333, L2359, L2583, L2898 | **CANÔNICO** | Define alvos gramas/kg e converte para calorias por Atwater (P×4, C×4, G×9). |

---

## 3. Análise Detalhada dos Números Mágicos e Casos Críticos

### 3.1 Os Números Mágicos `-468` e `+350`
* **Origem Histórica**: Introduzidos na interface legada (`app.js` L1862 e L1864) como atalhos para simulação rápida de déficit e superávit na tela de avaliação quando não há prescrição alimentar ativa.
* **Demonstração Numérica**:
  - Usuário demo (116 kg, 1.96 m, TMB Katch = 2714 kcal, GET com FA 1.55 = 4207 kcal).
  - Com déficit de `-468 kcal`, o alvo calórico é exatamente `4207 - 468 = 3739 kcal`.
  - Este número `3739` foi hardcoded no HTML estático (`index.html` L2670) como valor de demonstração.
* **Diagnóstico Arquitetural**: Trata-se de comportamento puramente de apresentação da interface antiga.
* **Regra Canônica de Resolução**:
  ```javascript
  // Regra Canônica:
  caloricTargetKcal = (prescribedKcal !== null && prescribedKcal > 0)
    ? Math.round(prescribedKcal)
    : Math.round(getKcal);

  energyBalanceKcal = Math.round(caloricTargetKcal - getKcal);
  ```
  - Quando o nutricionista cria um plano alimentar com 2200 kcal, `caloricTargetKcal = 2200` e o balanço é `2200 - GET`.
  - O cálculo `-468` / `+350` deve ser preservado temporariamente na UI legada apenas enquanto a aba de avaliação não consumir diretamente a prescrição ativa.

### 3.2 O Número `1.42` (Fator de Atividade)
* **Origem**: Fator de atividade física correspondente a um adulto com rotina sedentária/ocupacional padrão complementada por exercícios moderados 3-4x/semana.
* **Status**: É o fallback seguro oficial do sistema. Quando o paciente não tem um nível de atividade selecionado ou o dado está ausente, adota-se `1.42`.

### 3.3 Divergência de Rótulos em `RCEst`
* Em `math.js` L153:
  - `< 0.40`: "Magreza extrema / Atenção"
  - `<= 0.50`: "Ideal / Baixo risco cardiovascular"
  - `<= 0.60`: "Risco aumentado / Sobrepeso-Adiposidade central"
  - `> 0.60`: "Risco altamente elevado"
* Em `utils/nutritionMath.ts` L196:
  - `< 0.50`: "Adequado"
  - `0.50 a 0.60`: "Atenção / Limítrofe"
  - `>= 0.60`: "Alto Risco Cardiometabólico"
* **Decisão**: A matemática é idêntica (`cintura / estatura`). A classificação do `math.js` é a oficial de produção do NutriAx Pro (mais detalhada na faixa de magreza extrema). O motor canônico adota os limiares padronizados `0.40`, `0.50` e `0.60`.

---

## 4. Regra Especial para Adolescentes e Menores

* **Auditoria**: O repositório atual classifica adolescentes (14-17 anos) na UI (`app.js` L6493) com badge de alerta `"Adolescente (14-17) • Revisão"` e no módulo de jejum com `"Faixa etária adolescente exige estrita avaliação clínica"`.
* **Fórmulas de TMB**: Nem `math.js` nem `nutritionMath.ts` possuem equações específicas para pediatria/adolescentes (como Schofield ou FAO/WHO pediátrico). Atualmente executam Mifflin-St Jeor com clamp de idade mínima em 10 anos (`Math.max(10, age)`).
* **Decisão Formal da Fase 3**:
  - Classificação: **REGRA NÃO DEFINIDA PARA PEDIATRIA**.
  - O motor canônico **NÃO inventa** equações pediátricas.
  - Para idades < 18 anos, o motor canônico executa a fórmula padrão registrando flag informativo `{ isAdolescent: true, reviewRequired: true }` sem alterar silenciosamente as equações matemáticas existentes.
