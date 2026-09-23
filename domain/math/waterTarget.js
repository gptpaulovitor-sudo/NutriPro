/**
 * domain/math/waterTarget.js
 * 
 * Motor Canônico Determinístico de Cálculo de Hidratação.
 * NutriAx Pro — Fase N3.7.6.
 * 
 * Regras Clínicas Canônicas:
 * 1. Base sedentária / leve (FA < 1.35): 35 mL/kg.
 * 2. Moderada (FA entre 1.35 e 1.54): 40 mL/kg.
 * 3. Intensa / Atleta (FA >= 1.55 ou isAthlete === true): 45 mL/kg.
 * 4. Faixa recomendada: [minWaterL, maxWaterL].
 */

'use strict';

function calculateDeterministicWaterTarget(contextOrWeight, options = {}) {
  let weightKg = 70.0;
  let activityFactor = 1.42;
  let isAthlete = false;

  if (typeof contextOrWeight === 'number') {
    weightKg = contextOrWeight;
    activityFactor = options.activityFactor != null ? Number(options.activityFactor) : 1.42;
    isAthlete = Boolean(options.isAthlete);
  } else if (contextOrWeight && typeof contextOrWeight === 'object') {
    const ctx = contextOrWeight;
    weightKg = parseFloat(
      ctx.anthropometry?.weightKg ||
      ctx.patient?.weightKg ||
      ctx.patient?.currentWeight ||
      ctx.weightKg ||
      ctx.currentWeight ||
      ctx.weight ||
      70.0
    );
    activityFactor = parseFloat(
      ctx.energy?.activityFactor ||
      ctx.patient?.activityFactor ||
      ctx.activityFactor ||
      1.42
    );
    const pType = String(ctx.patient?.patientType || ctx.patientType || '').toLowerCase();
    const tLevel = String(ctx.patient?.trainingLevel || ctx.trainingLevel || '').toLowerCase();
    isAthlete = Boolean(
      ctx.training?.isAthlete ||
      pType.includes('atleta') ||
      pType.includes('alto rendimento') ||
      tLevel.includes('atleta') ||
      tLevel.includes('competidor')
    );
  }

  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    weightKg = 70.0;
  }
  if (!Number.isFinite(activityFactor) || activityFactor <= 0) {
    activityFactor = 1.42;
  }

  let mlPerKg = 35;
  if (isAthlete || activityFactor >= 1.55) {
    mlPerKg = 45;
  } else if (activityFactor >= 1.35) {
    mlPerKg = 40;
  } else {
    mlPerKg = 35;
  }

  const targetWaterMl = Math.round(weightKg * mlPerKg);
  const minMlPerKg = Math.max(30, mlPerKg - 5);
  const minWaterL = Number(((weightKg * minMlPerKg) / 1000).toFixed(1));
  const maxWaterL = Number(((weightKg * mlPerKg) / 1000).toFixed(1));

  return {
    status: 'PASS',
    weightKg,
    activityFactor,
    isAthlete,
    mlPerKg,
    factorMlKg: mlPerKg,
    targetWaterMl,
    targetWaterL: Number((targetWaterMl / 1000).toFixed(2)),
    waterTargetL: Number((targetWaterMl / 1000).toFixed(2)),
    minWaterL,
    maxWaterL,
    rangeDisplay: `${minWaterL} a ${maxWaterL} L/dia`,
    waterRangeDisplay: `${minWaterL} a ${maxWaterL} L/dia`,
    rationale: `Meta de ${mlPerKg} mL/kg baseada em peso (${weightKg.toFixed(1)} kg) e nível de demanda (${isAthlete ? 'Atleta/Alta Demanda' : (activityFactor >= 1.55 ? 'Intensa' : (activityFactor >= 1.35 ? 'Moderada' : 'Leve'))})`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateDeterministicWaterTarget };
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  window.NutriDomain.waterTarget = { calculateDeterministicWaterTarget };
}
