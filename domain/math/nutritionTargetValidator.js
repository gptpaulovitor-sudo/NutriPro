/**
 * domain/math/nutritionTargetValidator.js
 * 
 * Validador Energético e Bromatológico de Metas Nutricionais — NutriAx Pro.
 * Fase N2.3: Validador puro, determinístico e auditável que atua como portão de qualidade
 * entre as metas calculadas (N2.1 + N2.2) e o futuro solver de cardápio (N3).
 * 
 * Princípios de Governança:
 * 1. PUREZA ABSOLUTA: Sem DOM, sem Dexie/Firebase, sem Gemini, sem Date, sem Math.random.
 * 2. GOVERNANÇA BROMATOLÓGICA: Valida a consistência matemática das metas pré-cardápio.
 *    Não afirma que "a dieta está bromatologicamente validada", pois ainda não há alimentos concretos.
 * 3. REUSO MATEMÁTICO: Consome os resultados de N2.1 e N2.2 sem recalcular políticas.
 * 4. IMUTABILIDADE: Resultado profundamente congelado (deepFreeze).
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
 * Normaliza e identifica a categoria canônica do objetivo clínico
 * @param {string} objectiveStr 
 * @returns {string|null}
 */
function normalizeObjective(objectiveStr) {
  if (!objectiveStr || typeof objectiveStr !== 'string') return null;
  const obj = objectiveStr.trim().toLowerCase();
  if (obj === '' || obj === 'missing') return null;

  if (obj.includes('perda') || obj.includes('emagrecimento') || obj.includes('déficit') || obj.includes('deficit') || obj.includes('cutting') || obj.includes('definir')) {
    return 'Perda de peso';
  }
  if (obj.includes('hipertrofia') || obj.includes('ganho') || obj.includes('bulking') || obj.includes('superávit') || obj.includes('superavit') || obj.includes('massa')) {
    return 'Hipertrofia';
  }
  if (obj.includes('recomposição') || obj.includes('recomposicao')) {
    return 'Recomposição Corporal';
  }
  if (obj.includes('performance') || obj.includes('esportiva') || obj.includes('rendimento') || obj.includes('atleta')) {
    return 'Performance Esportiva';
  }
  if (obj.includes('manutenção') || obj.includes('manutencao') || obj.includes('saúde') || obj.includes('saude') || obj.includes('geral') || obj.includes('equilíbrio') || obj.includes('equilibrio')) {
    return 'Manutenção e Saúde';
  }
  return null;
}

/**
 * Executa a validação formal, matemática e bromatológica das metas nutricionais.
 * 
 * @param {Object} context - NutritionPrescriptionContextDTO validado da Fase N1.1
 * @param {Object} energyTargetResult - Resultado do motor energético da Fase N2.1
 * @param {Object} macroTargetResult - Resultado do motor de macronutrientes da Fase N2.2
 * @param {Object} [options={}] - Opções opcionais (ex: tolerância customizada)
 * @returns {Readonly<Object>} Relatório imutável de validação de metas nutricionais
 */
function validateNutritionPrescriptionTargets(context, energyTargetResult, macroTargetResult, options = {}) {
  const checks = [];
  const warnings = [];
  const blockingReasons = [];

  function recordCheck(id, status, message, details = {}) {
    const check = {
      id,
      status, // "PASS" | "WARNING" | "FAIL"
      message,
      ...details
    };
    checks.push(check);
    if (status === 'FAIL') {
      blockingReasons.push(`[${id}] ${message}`);
    } else if (status === 'WARNING') {
      warnings.push(`[${id}] ${message}`);
    }
    return check;
  }

  // ── 1. VALIDAÇÃO DO CONTEXTO DE ENTRADA (N1.1) ────────────────────────────
  const isContextObject = context != null && typeof context === 'object' && !Array.isArray(context);
  if (!isContextObject) {
    recordCheck('CHECK_CONTEXT_VALIDITY', 'FAIL', 'Contexto N1.1 ausente ou não é um objeto.', { expected: 'Object', actual: typeof context });
  }

  const patientAge = context?.patient?.age;
  const allowAdolescent = Boolean(options?.allowAdolescent || context?.policies?.allowAdolescent || context?.patient?.allowAdolescent);
  const isPediatric = typeof patientAge === 'number' && patientAge < 18;
  if (isPediatric) {
    if (allowAdolescent && patientAge >= 10) {
      recordCheck('CHECK_PEDIATRIC_SAFETY', 'WARNING', `Paciente adolescente de ${patientAge} anos conduzido sob supervisão clínica profissional.`);
    } else {
      recordCheck('CHECK_PEDIATRIC_SAFETY', 'FAIL', `Paciente menor de 18 anos (${patientAge} anos): prescrição adulta bloqueada por segurança clínica.`);
    }
  }

  // ── 2. VALIDAÇÃO DO RESULTADO ENERGÉTICO (N2.1) ───────────────────────────
  let caloricTargetKcal = null;
  const isEnergyObject = energyTargetResult != null && typeof energyTargetResult === 'object' && !Array.isArray(energyTargetResult);

  if (!isEnergyObject) {
    recordCheck('CHECK_N21_ENERGY_TARGET', 'FAIL', 'Resultado N2.1 ausente ou nulo.', { expected: 'Object', actual: typeof energyTargetResult });
  } else if (energyTargetResult.status === 'BLOCKED') {
    recordCheck('CHECK_N21_ENERGY_TARGET', 'FAIL', 'Resultado N2.1 encontra-se no estado BLOCKED.', { reasons: energyTargetResult.blockingReasons || [] });
  } else {
    caloricTargetKcal = energyTargetResult.caloricTargetKcal;
    const isValidKcal = typeof caloricTargetKcal === 'number' && !isNaN(caloricTargetKcal) && isFinite(caloricTargetKcal) && caloricTargetKcal > 0;
    if (!isValidKcal) {
      recordCheck('CHECK_N21_ENERGY_TARGET', 'FAIL', 'Meta energética (caloricTargetKcal) de N2.1 é inválida, nula, não-finita ou <= 0.', { caloricTargetKcal });
    } else {
      recordCheck('CHECK_N21_ENERGY_TARGET', 'PASS', 'Meta energética N2.1 válida.', { caloricTargetKcal });
    }
  }

  // ── 3. VALIDAÇÃO DO RESULTADO DE MACRONUTRIENTES (N2.2) ───────────────────
  let proteinTargetG = null;
  let carbohydrateTargetG = null;
  let fatTargetG = null;
  let fiberTargetG = null;
  let proteinKcal = null;
  let carbohydrateKcal = null;
  let fatKcal = null;
  let macroEnergyKcal = null;
  let energyDifferenceKcal = null;

  const isMacroObject = macroTargetResult != null && typeof macroTargetResult === 'object' && !Array.isArray(macroTargetResult);

  if (!isMacroObject) {
    recordCheck('CHECK_N22_MACRO_TARGET', 'FAIL', 'Resultado N2.2 ausente ou nulo.', { expected: 'Object', actual: typeof macroTargetResult });
  } else if (macroTargetResult.status === 'BLOCKED') {
    recordCheck('CHECK_N22_MACRO_TARGET', 'FAIL', 'Resultado N2.2 encontra-se no estado BLOCKED.', { reasons: macroTargetResult.blockingReasons || [] });
  } else {
    proteinTargetG = macroTargetResult.proteinTargetG;
    carbohydrateTargetG = macroTargetResult.carbohydrateTargetG;
    fatTargetG = macroTargetResult.fatTargetG;
    fiberTargetG = macroTargetResult.fiberTargetG;

    proteinKcal = macroTargetResult.proteinKcal;
    carbohydrateKcal = macroTargetResult.carbohydrateKcal;
    fatKcal = macroTargetResult.fatKcal;
    macroEnergyKcal = macroTargetResult.macroEnergyKcal;
    energyDifferenceKcal = macroTargetResult.energyDifferenceKcal;

    // Metas de proteína, carboidrato e gordura NÃO precisam ser inteiras. Devem ser number e finitas.
    const areMacrosNumbers = typeof proteinTargetG === 'number' && isFinite(proteinTargetG) &&
                             typeof carbohydrateTargetG === 'number' && isFinite(carbohydrateTargetG) &&
                             typeof fatTargetG === 'number' && isFinite(fatTargetG);

    if (!areMacrosNumbers) {
      recordCheck('CHECK_N22_MACRO_TARGET', 'FAIL', 'Metas de macronutrientes de N2.2 contêm campos não-numéricos ou não-finitos.', {
        proteinTargetG,
        carbohydrateTargetG,
        fatTargetG
      });
    } else {
      recordCheck('CHECK_N22_MACRO_TARGET', 'PASS', 'Metas de macronutrientes N2.2 presentes e com tipos numéricos válidos.');
    }
  }

  // Se já houver bloqueio estrutural essencial, encerra cedo os checks matemáticos dependentes
  const hasStructuralBlock = blockingReasons.length > 0;

  // ── 4. NÃO-NEGATIVIDADE DOS MACROS E ENERGIA ──────────────────────────────
  if (!hasStructuralBlock) {
    const isAnyMacroNegative = proteinTargetG < 0 || carbohydrateTargetG < 0 || fatTargetG < 0 ||
                               proteinKcal < 0 || carbohydrateKcal < 0 || fatKcal < 0 || macroEnergyKcal < 0;
    if (isAnyMacroNegative) {
      recordCheck('CHECK_NON_NEGATIVE_MACROS', 'FAIL', 'Um ou mais macronutrientes ou cotas energéticas resultaram em valores negativos.', {
        proteinTargetG,
        carbohydrateTargetG,
        fatTargetG,
        proteinKcal,
        carbohydrateKcal,
        fatKcal,
        macroEnergyKcal
      });
    } else {
      recordCheck('CHECK_NON_NEGATIVE_MACROS', 'PASS', 'Todos os macronutrientes e cotas energéticas são não-negativos.');
    }
  }

  // ── 5. INTEGRIDADE NUMÉRICA E REJEIÇÃO DE NAN/INFINITY ─────────────────────
  if (!hasStructuralBlock) {
    const numericFields = [
      { name: 'caloricTargetKcal', val: caloricTargetKcal },
      { name: 'proteinTargetG', val: proteinTargetG },
      { name: 'carbohydrateTargetG', val: carbohydrateTargetG },
      { name: 'fatTargetG', val: fatTargetG },
      { name: 'proteinKcal', val: proteinKcal },
      { name: 'carbohydrateKcal', val: carbohydrateKcal },
      { name: 'fatKcal', val: fatKcal },
      { name: 'macroEnergyKcal', val: macroEnergyKcal },
      { name: 'energyDifferenceKcal', val: energyDifferenceKcal }
    ];

    const invalidField = numericFields.find(f => typeof f.val !== 'number' || isNaN(f.val) || !isFinite(f.val));
    if (invalidField) {
      recordCheck('CHECK_NUMERIC_INTEGRITY', 'FAIL', `Inconsistência de tipo numérico no campo "${invalidField.name}" (NaN, Infinity ou não-numérico).`, { field: invalidField.name, value: invalidField.val });
    } else {
      recordCheck('CHECK_NUMERIC_INTEGRITY', 'PASS', 'Integridade numérica estrita validada (sem NaN ou Infinity).');
    }
  }

  // ── 6. COERÊNCIA DA PROTEÍNA COM ATWATER (P × 4) E PROCEDÊNCIA ─────────────
  if (!hasStructuralBlock && proteinTargetG != null && proteinKcal != null) {
    const expectedProtKcal = proteinTargetG * 4;
    const diffProt = Math.abs(proteinKcal - expectedProtKcal);

    if (diffProt > 0.01) {
      recordCheck('CHECK_PROTEIN_ENERGY_CONSISTENCY', 'FAIL', 'Calorias de proteína divergem da multiplicação Atwater (proteinTargetG * 4).', {
        expected: expectedProtKcal,
        actual: proteinKcal,
        diff: diffProt
      });
    } else {
      const provProt = macroTargetResult?.provenance?.protein;
      if (!provProt || !provProt.reference || !provProt.method || provProt.gPerKg == null) {
        recordCheck('CHECK_PROTEIN_ENERGY_CONSISTENCY', 'WARNING', 'Proteína consistente com Atwater 4P, porém procedência mínima incompleta.', { provenance: provProt });
      } else {
        recordCheck('CHECK_PROTEIN_ENERGY_CONSISTENCY', 'PASS', 'Proteína consistente com Atwater (P * 4) e com procedência válida.', {
          proteinTargetG,
          proteinKcal,
          reference: provProt.reference,
          method: provProt.method
        });
      }
    }
  }

  // ── 7. COERÊNCIA DA GORDURA COM ATWATER (G × 9) E PROCEDÊNCIA ──────────────
  if (!hasStructuralBlock && fatTargetG != null && fatKcal != null) {
    const expectedFatKcal = fatTargetG * 9;
    const diffFat = Math.abs(fatKcal - expectedFatKcal);

    if (diffFat > 0.01) {
      recordCheck('CHECK_FAT_ENERGY_CONSISTENCY', 'FAIL', 'Calorias de gordura divergem da multiplicação Atwater (fatTargetG * 9).', {
        expected: expectedFatKcal,
        actual: fatKcal,
        diff: diffFat
      });
    } else {
      const provFat = macroTargetResult?.provenance?.fat;
      recordCheck('CHECK_FAT_ENERGY_CONSISTENCY', 'PASS', 'Gordura consistente com Atwater (G * 9) e com procedência válida.', {
        fatTargetG,
        fatKcal,
        floorApplied: provFat?.floorApplied || 'NONE'
      });
    }
  }

  // ── 8. COERÊNCIA DO CARBOIDRATO COM ATWATER (C × 4) E FECHAMENTO RESIDUAL ──
  const toleranceKcal = options.toleranceKcal != null && typeof options.toleranceKcal === 'number'
    ? options.toleranceKcal
    : (macroTargetResult?.provenance?.validation?.toleranceKcal || 5);

  if (!hasStructuralBlock && carbohydrateTargetG != null && carbohydrateKcal != null && caloricTargetKcal != null) {
    const expectedCarbKcal = carbohydrateTargetG * 4;
    const diffCarb = Math.abs(carbohydrateKcal - expectedCarbKcal);

    if (diffCarb > 0.01) {
      recordCheck('CHECK_CARBOHYDRATE_ENERGY_CONSISTENCY', 'FAIL', 'Calorias de carboidrato divergem da multiplicação Atwater (carbohydrateTargetG * 4).', {
        expected: expectedCarbKcal,
        actual: carbohydrateKcal,
        diff: diffCarb
      });
    } else {
      const expectedResidualKcal = caloricTargetKcal - (proteinKcal + fatKcal);
      const diffResidual = Math.abs(carbohydrateKcal - expectedResidualKcal);

      if (diffResidual > toleranceKcal) {
        recordCheck('CHECK_CARBOHYDRATE_ENERGY_CONSISTENCY', 'FAIL', 'Carboidrato diverge do fechamento residual Atwater acima da tolerância.', {
          expectedResidualKcal,
          actualCarbKcal: carbohydrateKcal,
          diffResidual,
          toleranceKcal
        });
      } else {
        recordCheck('CHECK_CARBOHYDRATE_ENERGY_CONSISTENCY', 'PASS', 'Carboidrato consistente com Atwater (C * 4) e fechamento residual válido.', {
          carbohydrateTargetG,
          carbohydrateKcal,
          residualKcal: expectedResidualKcal
        });
      }
    }
  }

  // ── 9. INVARIANTE FUNDAMENTAL DE FECHAMENTO ENERGÉTICO (4P + 4C + 9G) ──────
  let isClosed = false;
  if (!hasStructuralBlock && proteinKcal != null && carbohydrateKcal != null && fatKcal != null && caloricTargetKcal != null) {
    const calculatedSumKcal = proteinKcal + carbohydrateKcal + fatKcal;
    const diffEnergy = calculatedSumKcal - caloricTargetKcal;

    if (macroEnergyKcal != null && Math.abs(macroEnergyKcal - calculatedSumKcal) > 0.01) {
      recordCheck('CHECK_ENERGY_CLOSURE', 'FAIL', 'macroEnergyKcal diverge da soma direta das parcelas (4P + 4C + 9G).', {
        macroEnergyKcal,
        calculatedSumKcal
      });
    } else if (Math.abs(diffEnergy) > toleranceKcal) {
      recordCheck('CHECK_ENERGY_CLOSURE', 'FAIL', 'ENERGY_CLOSURE_FAILED: Diferença entre soma dos macros e meta calórica excede a tolerância da política.', {
        macroEnergyKcal: calculatedSumKcal,
        caloricTargetKcal,
        differenceKcal: diffEnergy,
        toleranceKcal
      });
    } else {
      isClosed = true;
      recordCheck('CHECK_ENERGY_CLOSURE', 'PASS', 'Fechamento energético validado dentro da tolerância técnica da política.', {
        macroEnergyKcal: calculatedSumKcal,
        caloricTargetKcal,
        differenceKcal: diffEnergy,
        toleranceKcal,
        closed: true
      });
    }
  }

  // ── 10. VALIDAÇÃO DE FIBRAS E ISOLAMENTO ENERGÉTICO ────────────────────────
  // A validação da fibra confirma que macroEnergyKcal utiliza exclusivamente 4P + 4C + 9G, sem incluir fiberTargetG.
  if (fiberTargetG !== null && fiberTargetG !== undefined) {
    if (typeof fiberTargetG !== 'number' || isNaN(fiberTargetG) || !isFinite(fiberTargetG) || fiberTargetG < 0) {
      recordCheck('CHECK_FIBER_ISOLATION_AND_VALIDITY', 'FAIL', 'Meta de fibras inválida ou negativa.', { fiberTargetG });
    } else {
      recordCheck('CHECK_FIBER_ISOLATION_AND_VALIDITY', 'PASS', 'Fibras isoladas da equação calórica 4P+4C+9G e meta diária não-negativa.', {
        fiberTargetG,
        includedInMacroEnergyKcal: false
      });
    }
  } else {
    recordCheck('CHECK_FIBER_ISOLATION_AND_VALIDITY', 'WARNING', 'Meta de fibras diárias não informada na prescrição (fiberTargetG === null).', {
      fiberTargetG: null,
      includedInMacroEnergyKcal: false
    });
  }

  // ── 11. PLAUSIBILIDADE DA DISTRIBUIÇÃO PERCENTUAL DE MACROS ───────────────
  let proteinPercent = null;
  let carbohydratePercent = null;
  let fatPercent = null;

  if (!hasStructuralBlock && caloricTargetKcal != null && caloricTargetKcal > 0 &&
      proteinKcal != null && carbohydrateKcal != null && fatKcal != null) {
    proteinPercent = Number(((proteinKcal / caloricTargetKcal) * 100).toFixed(2));
    carbohydratePercent = Number(((carbohydrateKcal / caloricTargetKcal) * 100).toFixed(2));
    fatPercent = Number(((fatKcal / caloricTargetKcal) * 100).toFixed(2));

    const sumPercent = Number((proteinPercent + carbohydratePercent + fatPercent).toFixed(2));
    const percentDiff = Math.abs(sumPercent - 100.0);

    if (percentDiff <= 0.6) {
      recordCheck('CHECK_MACRO_DISTRIBUTION_PLAUSIBILITY', 'PASS', 'Distribuição percentual dos macronutrientes convergente para 100%.', {
        proteinPercent,
        carbohydratePercent,
        fatPercent,
        sumPercent
      });
    } else {
      recordCheck('CHECK_MACRO_DISTRIBUTION_PLAUSIBILITY', 'FAIL', 'Soma percentual dos macronutrientes diverge significativamente de 100%.', {
        sumPercent,
        percentDiff
      });
    }
  }

  // ── 12. INTEGRIDADE, PRESENÇA E NÃO-SOBREESCRITA DO CONTEXTO ──────────────
  // CHECK_OBJECTIVE_AND_CONTEXT_COHERENCE verifica apenas integridade, presença e não-sobrescrita dos dados do contexto.
  // Não cria nova política clínica ou nutricional dentro da N2.3.
  const rawContextObj = context?.objective?.clinicalObjective;
  const normalizedObj = normalizeObjective(rawContextObj);

  if (!rawContextObj || !normalizedObj) {
    recordCheck('CHECK_OBJECTIVE_AND_CONTEXT_COHERENCE', 'FAIL', 'Objetivo clínico ausente, não informado ou não reconhecido no contexto N1.1.', {
      objective: rawContextObj || null
    });
  } else {
    // Validar coerência do objetivo com N2.1 e N2.2 se presentes
    const n21Obj = energyTargetResult?.objective;
    const n22Obj = macroTargetResult?.objective;
    const isCoherent = (!n21Obj || normalizeObjective(n21Obj) === normalizedObj) &&
                       (!n22Obj || normalizeObjective(n22Obj) === normalizedObj);

    if (!isCoherent) {
      recordCheck('CHECK_OBJECTIVE_AND_CONTEXT_COHERENCE', 'FAIL', 'Divergência entre o objetivo do contexto N1.1 e os resultados de N2.1/N2.2.', {
        contextObjective: rawContextObj,
        n21Objective: n21Obj,
        n22Objective: n22Obj
      });
    } else {
      // Verificar não-sobrescrita do recordatório
      const recallKcal = context?.dietaryRecall?.items?.reduce((acc, it) => acc + (it.macros?.calories || 0), 0) || 0;
      if (recallKcal > 0 && caloricTargetKcal != null && Math.abs(caloricTargetKcal - recallKcal) === 0 && energyTargetResult?.adjustmentKcal !== 0) {
        recordCheck('CHECK_OBJECTIVE_AND_CONTEXT_COHERENCE', 'WARNING', 'Meta energética coincide exatamente com o recordatório alimentar; assegurar que não houve sobreposição indevida.', { recallKcal, caloricTargetKcal });
      } else {
        recordCheck('CHECK_OBJECTIVE_AND_CONTEXT_COHERENCE', 'PASS', 'Integridade e coerência contextual validadas sem sobrescrita de dados.', {
          objective: rawContextObj,
          hasTrainingContext: !!(context?.training?.hasActiveTraining || context?.training?.routines?.length),
          hasCardioContext: !!(context?.cardio?.hasActiveCardio || context?.cardio?.sessions?.length),
          hasWeeklySchedule: Array.isArray(context?.weeklySchedule) && context.weeklySchedule.length > 0,
          hasConstraints: Array.isArray(context?.constraints?.dietaryRestrictions) && context.constraints.dietaryRestrictions.length > 0
        });
      }
    }
  }

  // ── 13. PRESERVAÇÃO DE ALERTAS PREEXISTENTES DE N2.1 E N2.2 ───────────────
  if (Array.isArray(macroTargetResult?.warnings)) {
    for (const w of macroTargetResult.warnings) {
      if (!warnings.includes(w)) {
        warnings.push(`[N2.2_WARNING] ${w}`);
      }
    }
  }
  if (Array.isArray(energyTargetResult?.warnings)) {
    for (const w of energyTargetResult.warnings) {
      if (!warnings.includes(w)) {
        warnings.push(`[N2.1_WARNING] ${w}`);
      }
    }
  }

  // ── 14. DETERMINAÇÃO DO STATUS GERAL E CONTRATO DE SAÍDA ──────────────────
  let overallStatus = "PASS";
  if (blockingReasons.length > 0) {
    overallStatus = "BLOCKED";
  } else if (warnings.length > 0) {
    overallStatus = "WARNING";
  }

  const isValid = overallStatus !== "BLOCKED";

  const result = {
    status: overallStatus,
    valid: isValid,

    caloricTargetKcal: caloricTargetKcal ?? null,

    macroTargets: {
      proteinTargetG: proteinTargetG ?? null,
      carbohydrateTargetG: carbohydrateTargetG ?? null,
      fatTargetG: fatTargetG ?? null,
      fiberTargetG: fiberTargetG ?? null
    },

    energyValidation: {
      proteinKcal: proteinKcal ?? null,
      carbohydrateKcal: carbohydrateKcal ?? null,
      fatKcal: fatKcal ?? null,
      macroEnergyKcal: macroEnergyKcal ?? null,
      energyDifferenceKcal: energyDifferenceKcal ?? null,
      toleranceKcal: toleranceKcal ?? null,
      closed: isClosed
    },

    macroDistribution: {
      proteinPercent: proteinPercent ?? null,
      carbohydratePercent: carbohydratePercent ?? null,
      fatPercent: fatPercent ?? null
    },

    warnings,
    blockingReasons,
    checks,

    provenance: {
      energyTarget: {
        source: energyTargetResult?.calculationMethod || energyTargetResult?.provenance?.energyTarget?.source || 'UNKNOWN',
        caloricTargetKcal: caloricTargetKcal ?? null,
        energyPolicyVersion: energyTargetResult?.policy?.version || 'UNKNOWN'
      },
      macroTarget: {
        method: macroTargetResult?.calculationMethod || 'UNKNOWN',
        macroEnergyKcal: macroEnergyKcal ?? null,
        macroPolicyVersion: macroTargetResult?.policy?.version || 'N2.2.0'
      },
      validation: {
        validationMethod: "DETERMINISTIC_NUTRITION_TARGET_VALIDATION_N23",
        toleranceKcal,
        differenceKcal: energyDifferenceKcal ?? null,
        isConsistent: isValid
      }
    },

    validationMethod: "DETERMINISTIC_NUTRITION_TARGET_VALIDATION_N23",

    policyVersions: {
      energy: energyTargetResult?.policy?.version || 'UNKNOWN',
      macro: macroTargetResult?.policy?.version || 'N2.2.0'
    }
  };

  return deepFreeze(result);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateNutritionPrescriptionTargets,
    normalizeObjective,
    deepFreeze
  };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.targetValidator = {
    validateNutritionPrescriptionTargets,
    normalizeObjective,
    deepFreeze
  };
}
