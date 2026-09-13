/**
 * domain/math/macroPolicy.js
 * 
 * Especificação e Política Canônica de Metas de Macronutrientes — NutriAx Pro.
 * Fase N2.2: Separação estrita entre Matemática Atwater, Política de Macronutrientes, Segurança e Procedência.
 * Camada Pura — Zero DOM, Zero Dexie/Firebase, Zero Gemini, Zero I/O.
 */

/**
 * Utilitário de congelamento profundo recursivo
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
 * Política Canônica de Macronutrientes Padrão — Versão N2.2.0
 * 
 * AVISO DE GOVERNANÇA:
 * Todos os valores numéricos abaixo são POLICY_PARAMETERS (parâmetros de configuração de política),
 * e NÃO verdades fisiológicas universais ou absolutas.
 */
const DEFAULT_MACRO_POLICY = deepFreeze({
  policyVersion: "N2.2.0",
  policyName: "Política Canônica de Distribuição de Macronutrientes NutriAx Pro",
  parameters: {
    protein: {
      defaultStrategy: "TOTAL_BODY_WEIGHT",
      byObjective: {
        weightLoss: {
          baseGPerKg: {
            value: 2.0,
            unit: "g/kg",
            source: "POLICY_PARAMETER",
            version: "N2.2.0",
            rationale: "Aporte proteico base para perda de peso e preservação de massa magra sob restrição energética (2.0 g/kg)."
          },
          athleteOrHighDemandModulation: {
            value: 0.2,
            unit: "g/kg",
            source: "POLICY_PARAMETER",
            version: "N2.2.0",
            rationale: "Adicional proteico para atletas ou praticantes com alta demanda esportiva em déficit calórico (+0.2 g/kg, resultando em 2.2 g/kg)."
          }
        },
        hypertrophy: {
          baseGPerKg: {
            value: 1.8,
            unit: "g/kg",
            source: "POLICY_PARAMETER",
            version: "N2.2.0",
            rationale: "Aporte proteico base para maximização da síntese proteica muscular em superávit calórico (1.8 g/kg)."
          },
          athleteOrHighDemandModulation: {
            value: 0.2,
            unit: "g/kg",
            source: "POLICY_PARAMETER",
            version: "N2.2.0",
            rationale: "Adicional proteico para atletas de alto rendimento em hipertrofia (+0.2 g/kg, resultando em 2.0 g/kg)."
          }
        },
        recomposition: {
          baseGPerKg: {
            value: 2.2,
            unit: "g/kg",
            source: "POLICY_PARAMETER",
            version: "N2.2.0",
            rationale: "Aporte proteico elevado para estímulo anabólico simultâneo à oxidação lipídica em recomposição corporal (2.2 g/kg)."
          }
        },
        performance: {
          baseGPerKg: {
            value: 1.8,
            unit: "g/kg",
            source: "POLICY_PARAMETER",
            version: "N2.2.0",
            rationale: "Aporte proteico equilibrado para suporte à recuperação neuromuscular sem comprometer a cota glicídica (1.8 g/kg)."
          },
          athleteOrHighDemandModulation: {
            value: 0.2,
            unit: "g/kg",
            source: "POLICY_PARAMETER",
            version: "N2.2.0",
            rationale: "Adicional proteico para atletas competitivos de alta intensidade (+0.2 g/kg, resultando em 2.0 g/kg)."
          }
        },
        maintenance: {
          baseGPerKg: {
            value: 1.6,
            unit: "g/kg",
            source: "POLICY_PARAMETER",
            version: "N2.2.0",
            rationale: "Aporte proteico normocalórico para manutenção da massa magra e saúde geral (1.6 g/kg)."
          }
        }
      },
      leanMassTargetGPerKg: {
        weightLoss: {
          value: 2.4,
          unit: "g/kg_lbm",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte proteico por kg de massa magra (FFM) em déficit calórico (2.4 g/kg LBM)."
        },
        hypertrophy: {
          value: 2.2,
          unit: "g/kg_lbm",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte proteico por kg de massa magra (FFM) em hipertrofia (2.2 g/kg LBM)."
        },
        recomposition: {
          value: 2.5,
          unit: "g/kg_lbm",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte proteico por kg de massa magra (FFM) em recomposição (2.5 g/kg LBM)."
        },
        performance: {
          value: 2.2,
          unit: "g/kg_lbm",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte proteico por kg de massa magra (FFM) em performance (2.2 g/kg LBM)."
        },
        maintenance: {
          value: 2.0,
          unit: "g/kg_lbm",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte proteico por kg de massa magra (FFM) em manutenção (2.0 g/kg LBM)."
        }
      },
      safety: {
        maxProteinGPerKg: {
          value: 3.5,
          unit: "g/kg",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Limiar de alerta para aporte proteico elevado (> 3.5 g/kg de peso corporal)."
        }
      }
    },
    fat: {
      byObjective: {
        weightLoss: {
          value: 0.75,
          unit: "g/kg",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte lipídico controlado em perda de peso para preservar cotas de carboidrato (0.75 g/kg)."
        },
        hypertrophy: {
          value: 0.90,
          unit: "g/kg",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte lipídico adequado para suporte hormonal e densidade calórica em superávit (0.90 g/kg)."
        },
        recomposition: {
          value: 0.80,
          unit: "g/kg",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte lipídico intermediário em recomposição corporal (0.80 g/kg)."
        },
        performance: {
          value: 0.90,
          unit: "g/kg",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte lipídico para sustentação energética e recuperação em atletas (0.90 g/kg)."
        },
        maintenance: {
          value: 0.85,
          unit: "g/kg",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Aporte lipídico de referência para manutenção e saúde geral (0.85 g/kg)."
        }
      },
      guards: {
        minFatGPerKg: {
          value: 0.60,
          unit: "g/kg",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Piso de segurança lipídica por peso corporal para assegurar absorção de vitaminas lipossolúveis e função hormonal mínima (0.60 g/kg)."
        },
        minFatPercent: {
          value: 0.15,
          unit: "ratio_of_calories",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Piso de segurança lipídica percentual (15% das calorias totais) para evitar dietas ultra-pobres em lipídios essenciais."
        }
      }
    },
    carbohydrate: {
      strategy: "RESIDUAL_ENERGY_ATWATER",
      guards: {
        minimumCarbG: {
          value: 20,
          unit: "g",
          source: "POLICY_PARAMETER",
          version: "N2.2.0",
          rationale: "Piso mínimo de segurança de carboidrato diário para suporte fisiológico basal de tecidos estritamente glicodependentes (20g/dia)."
        }
      }
    },
    fiber: {
      enabled: true,
      fiberPer1000Kcal: {
        value: 14.0,
        unit: "g/1000kcal",
        source: "POLICY_PARAMETER",
        version: "N2.2.0",
        rationale: "Diretriz DRI / FAO de ingestão de fibras (14g por 1000 kcal da meta energética)."
      },
      minimumFiberG: {
        value: 25.0,
        unit: "g",
        source: "POLICY_PARAMETER",
        version: "N2.2.0",
        rationale: "Piso mínimo absoluto de ingestão diária de fibras para adultos (25g/dia)."
      }
    },
    energyCoefficients: {
      proteinKcalPerG: {
        value: 4,
        unit: "kcal/g",
        source: "MATHEMATICAL_CONSTANT",
        version: "N2.2.0",
        rationale: "Fator clássico de Atwater para densidade energética da proteína (4 kcal/g)."
      },
      carbohydrateKcalPerG: {
        value: 4,
        unit: "kcal/g",
        source: "MATHEMATICAL_CONSTANT",
        version: "N2.2.0",
        rationale: "Fator clássico de Atwater para densidade energética do carboidrato (4 kcal/g)."
      },
      fatKcalPerG: {
        value: 9,
        unit: "kcal/g",
        source: "MATHEMATICAL_CONSTANT",
        version: "N2.2.0",
        rationale: "Fator clássico de Atwater para densidade energética dos lipídios (9 kcal/g)."
      }
    },
    safety: {
      pediatricBlockingAge: {
        value: 18,
        unit: "years",
        source: "POLICY_PARAMETER",
        version: "N2.2.0",
        rationale: "Idade mínima para aplicação de distribuição de macronutrientes adulta. Menores de 18 anos são estritamente bloqueados."
      },
      energyToleranceKcal: {
        value: 5,
        unit: "kcal",
        source: "POLICY_PARAMETER",
        version: "N2.2.0",
        rationale: "Tolerância técnica máxima aceitável para discrepância entre a soma dos macronutrientes (4P+4C+9G) e caloricTargetKcal devido ao arredondamento em gramas inteiras."
      }
    }
  }
});

/**
 * Validador de integridade e completude de um objeto de política de macronutrientes
 * @param {Object} policy 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateMacroPolicy(policy) {
  const errors = [];
  if (!policy || typeof policy !== 'object') {
    return { isValid: false, errors: ['Política deve ser um objeto válido não-nulo.'] };
  }
  if (typeof policy.policyVersion !== 'string' || policy.policyVersion.trim() === '') {
    errors.push('policyVersion é obrigatório e deve ser uma string não-vazia.');
  }
  if (!policy.parameters || typeof policy.parameters !== 'object') {
    errors.push('parameters é obrigatório e deve ser um objeto.');
    return { isValid: false, errors };
  }

  const p = policy.parameters;
  const requiredSections = ['protein', 'fat', 'carbohydrate', 'safety'];
  for (const sec of requiredSections) {
    if (!p[sec] || typeof p[sec] !== 'object') {
      errors.push(`Seção de política "${sec}" é obrigatória.`);
    }
  }

  if (p.protein) {
    if (!p.protein.byObjective || typeof p.protein.byObjective !== 'object') {
      errors.push('protein.byObjective é obrigatório e deve ser um objeto.');
    } else {
      const objectives = ['weightLoss', 'hypertrophy', 'recomposition', 'performance', 'maintenance'];
      for (const obj of objectives) {
        if (!p.protein.byObjective[obj] || typeof p.protein.byObjective[obj].baseGPerKg?.value !== 'number') {
          errors.push(`protein.byObjective.${obj}.baseGPerKg.value é obrigatório e numérico.`);
        }
      }
    }
  }

  if (p.fat) {
    if (!p.fat.byObjective || typeof p.fat.byObjective !== 'object') {
      errors.push('fat.byObjective é obrigatório e deve ser um objeto.');
    } else {
      const objectives = ['weightLoss', 'hypertrophy', 'recomposition', 'performance', 'maintenance'];
      for (const obj of objectives) {
        if (!p.fat.byObjective[obj] || typeof p.fat.byObjective[obj].value !== 'number') {
          errors.push(`fat.byObjective.${obj}.value é obrigatório e numérico.`);
        }
      }
    }
    if (!p.fat.guards || typeof p.fat.guards.minFatGPerKg?.value !== 'number' || typeof p.fat.guards.minFatPercent?.value !== 'number') {
      errors.push('fat.guards com minFatGPerKg e minFatPercent numéricos são obrigatórios.');
    }
  }

  if (p.carbohydrate) {
    if (!p.carbohydrate.guards || typeof p.carbohydrate.guards.minimumCarbG?.value !== 'number') {
      errors.push('carbohydrate.guards.minimumCarbG.value é obrigatório e deve ser numérico.');
    }
  }

  if (p.safety) {
    if (!p.safety.pediatricBlockingAge || typeof p.safety.pediatricBlockingAge.value !== 'number') {
      errors.push('safety.pediatricBlockingAge.value é obrigatório e deve ser numérico.');
    }
    if (!p.safety.energyToleranceKcal || typeof p.safety.energyToleranceKcal.value !== 'number') {
      errors.push('safety.energyToleranceKcal.value é obrigatório e deve ser numérico.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_MACRO_POLICY,
    validateMacroPolicy,
    deepFreeze
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.macroPolicy = {
    DEFAULT_MACRO_POLICY,
    validateMacroPolicy,
    deepFreeze
  };
}
