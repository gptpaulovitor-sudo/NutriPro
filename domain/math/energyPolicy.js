/**
 * domain/math/energyPolicy.js
 * 
 * Especificação e Política Canônica de Metas Energéticas — NutriAx Pro.
 * Fase N2.1: Separação estrita entre Matemática, Política Energética, Segurança e Procedência.
 * Camada Pura — Zero DOM, Zero Dexie/Firebase, Zero Gemini, Zero I/O.
 */

/**
 * Utilitário de congelamento profundo seguro
 * @param {any} obj 
 * @returns {any}
 */
function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = obj[prop];
    if (value !== null && (typeof value === 'object' || typeof value === 'function') && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });
  return obj;
}

/**
 * Política Energética Canônica Padrão — Versão N2.1.0
 * 
 * AVISO DE GOVERNANÇA:
 * Todos os valores numéricos abaixo são POLICY_PARAMETERS (parâmetros de configuração de política),
 * e NÃO verdades fisiológicas universais ou absolutas.
 */
const DEFAULT_ENERGY_POLICY = deepFreeze({
  policyVersion: "N2.1.0",
  policyName: "Política Canônica de Modulação Energética Contextual NutriAx Pro",
  parameters: {
    weightLoss: {
      baseDeficitPercent: {
        value: -0.20,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Déficit calórico base configurado na política energética N2.1.0 (20% do GET)."
      },
      highAdiposityModulationPercent: {
        value: -0.04,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Adicional de déficit para indivíduos classificados na política com alta adiposidade (-4% do GET)."
      },
      lowAdiposityModulationPercent: {
        value: 0.05,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Atenuação de déficit para indivíduos classificados na política com baixa adiposidade (+5% do GET)."
      },
      highVolumeTrainingAttenuationPercent: {
        value: 0.03,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Atenuação de déficit configurada para contexto de alto volume de treinamento (+3% do GET)."
      }
    },
    hypertrophy: {
      baseSurplusPercent: {
        value: 0.10,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Superávit calórico base configurado na política energética N2.1.0 (+10% do GET)."
      },
      leanIndividualModulationPercent: {
        value: 0.02,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Acréscimo de superávit para indivíduos classificados na política como magros/atléticos (+2% do GET)."
      },
      highAdiposityModulationPercent: {
        value: -0.06,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Redução de superávit para indivíduos classificados na política com adiposidade elevada (-6% do GET)."
      },
      untrainedAttenuationPercent: {
        value: -0.07,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Atenuação de superávit para ausência de treinamento resistido ativo (-7% do GET)."
      }
    },
    recomposition: {
      baseAdjustmentPercent: {
        value: -0.06,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Ajuste calórico base de recomposição corporal configurado na política N2.1.0 (-6% do GET)."
      },
      highAdiposityDeficitPercent: {
        value: -0.10,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Déficit de recomposição configurado para indivíduos com adiposidade elevada (-10% do GET)."
      },
      leanIndividualAdjustmentPercent: {
        value: -0.02,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Ajuste de recomposição configurado para indivíduos magros/atléticos (-2% do GET)."
      }
    },
    performance: {
      baseAdjustmentPercent: {
        value: 0.03,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Ajuste calórico base para performance esportiva na política N2.1.0 (+3% do GET)."
      },
      highDemandAdjustmentPercent: {
        value: 0.05,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Ajuste para microciclo de alta demanda esportiva na política N2.1.0 (+5% do GET)."
      }
    },
    maintenance: {
      adjustmentPercent: {
        value: 0.0,
        unit: "ratio_of_get",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Ajuste nulo para manutenção e saúde na política N2.1.0 (0% do GET, meta idêntica ao GET)."
      }
    },
    compositionThresholds: {
      bodyFat: {
        highMale: {
          value: 25.0,
          unit: "percent",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de alta adiposidade masculino configurado na política N2.1.0 (> 25% gordura)."
        },
        highFemale: {
          value: 32.0,
          unit: "percent",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de alta adiposidade feminino configurado na política N2.1.0 (> 32% gordura)."
        },
        lowMale: {
          value: 16.0,
          unit: "percent",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de baixa adiposidade masculino em perda de peso configurado na política N2.1.0 (< 16% gordura)."
        },
        lowFemale: {
          value: 23.0,
          unit: "percent",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de baixa adiposidade feminino em perda de peso configurado na política N2.1.0 (< 23% gordura)."
        },
        leanHypertrophyMale: {
          value: 12.0,
          unit: "percent",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de indivíduo magro para ampliação de superávit em hipertrofia masculino (< 12% gordura)."
        },
        leanHypertrophyFemale: {
          value: 20.0,
          unit: "percent",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de indivíduo magro para ampliação de superávit em hipertrofia feminino (< 20% gordura)."
        },
        highHypertrophyMale: {
          value: 18.0,
          unit: "percent",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de adiposidade elevada para contenção de superávit em hipertrofia masculino (> 18% gordura)."
        },
        highHypertrophyFemale: {
          value: 26.0,
          unit: "percent",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de adiposidade elevada para contenção de superávit em hipertrofia feminino (> 26% gordura)."
        }
      },
      bmiFallback: {
        high: {
          value: 30.0,
          unit: "kg/m2",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de IMC de alta adiposidade para fallback quando ausente %G (IMC >= 30)."
        },
        low: {
          value: 22.0,
          unit: "kg/m2",
          source: "POLICY_PARAMETER",
          version: "N2.1.0",
          rationale: "Limiar de IMC de baixa adiposidade para fallback quando ausente %G (IMC < 22)."
        }
      }
    },
    trainingThresholds: {
      highFrequencyDays: {
        value: 5,
        unit: "days_per_week",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Limiar de frequência de treino semanal classificado como alto volume na política N2.1.0 (>= 5 dias)."
      },
      highCardioWeeklyMinutes: {
        value: 150,
        unit: "minutes_per_week",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Limiar de minutos semanais de cardio classificado como alta demanda na política N2.1.0 (>= 150 min)."
      }
    },
    safety: {
      pediatricBlockingAge: {
        value: 18,
        unit: "years",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Idade mínima para aplicação da política energética adulta. Menores de 18 anos são estritamente bloqueados."
      },
      minimumTargetGuard: {
        maleKcal: 1200,
        femaleKcal: 1000,
        tmbRatio: 0.80,
        enforcement: "WARNING",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Guarda-corpo de piso calórico configurado na política energética N2.1.0 para sinalizar metas energéticas excessivamente restritivas."
      },
      maxDeficitPercent: {
        value: -0.30,
        unit: "ratio_of_get",
        enforcement: "WARNING",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Guarda-corpo de déficit percentual máximo configurado na política N2.1.0 (-30% do GET)."
      },
      maxDeficitKcal: {
        value: -1000,
        unit: "kcal",
        enforcement: "WARNING",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Guarda-corpo de déficit calórico absoluto máximo configurado na política N2.1.0 (-1000 kcal/dia)."
      },
      maxSurplusPercent: {
        value: 0.25,
        unit: "ratio_of_get",
        enforcement: "WARNING",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Guarda-corpo de superávit percentual máximo configurado na política N2.1.0 (+25% do GET)."
      },
      maxSurplusKcal: {
        value: 750,
        unit: "kcal",
        enforcement: "WARNING",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Guarda-corpo de superávit calórico absoluto máximo configurado na política N2.1.0 (+750 kcal/dia)."
      },
      maxRecallDiscrepancyKcal: {
        value: 600,
        unit: "kcal",
        enforcement: "WARNING",
        source: "POLICY_PARAMETER",
        version: "N2.1.0",
        rationale: "Discrepância máxima configurada entre recordatório alimentar e meta calculada para emissão de alerta de transição (600 kcal)."
      }
    }
  }
});

/**
 * Validador de integridade e completude de um objeto de política energética
 * @param {Object} policy 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateEnergyPolicy(policy) {
  const errors = [];
  if (!policy || typeof policy !== 'object') {
    return { isValid: false, errors: ['Política deve ser um objeto válido.'] };
  }
  if (typeof policy.policyVersion !== 'string' || policy.policyVersion.trim() === '') {
    errors.push('policyVersion é obrigatório e deve ser uma string não-vazia.');
  }
  if (!policy.parameters || typeof policy.parameters !== 'object') {
    errors.push('parameters é obrigatório e deve ser um objeto.');
    return { isValid: false, errors };
  }

  const p = policy.parameters;
  const requiredCategories = ['weightLoss', 'hypertrophy', 'recomposition', 'performance', 'maintenance', 'compositionThresholds', 'trainingThresholds', 'safety'];
  for (const cat of requiredCategories) {
    if (!p[cat] || typeof p[cat] !== 'object') {
      errors.push(`Categoria de política "${cat}" é obrigatória.`);
    }
  }

  if (p.safety) {
    if (!p.safety.pediatricBlockingAge || typeof p.safety.pediatricBlockingAge.value !== 'number') {
      errors.push('safety.pediatricBlockingAge.value é obrigatório e deve ser numérico.');
    }
    if (!p.safety.minimumTargetGuard || typeof p.safety.minimumTargetGuard.maleKcal !== 'number') {
      errors.push('safety.minimumTargetGuard.maleKcal é obrigatório e deve ser numérico.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_ENERGY_POLICY,
    validateEnergyPolicy,
    deepFreeze
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.energyPolicy = {
    DEFAULT_ENERGY_POLICY,
    validateEnergyPolicy,
    deepFreeze
  };
}
