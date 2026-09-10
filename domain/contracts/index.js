/**
 * domain/contracts/index.js
 * 
 * Ponto Único de Exportação dos Contratos Canônicos de Domínio.
 * Camada Pura — NutriAx Pro.
 */

const PatientDTO = require('./PatientDTO');
const AssessmentDTO = require('./AssessmentDTO');
const NutritionDTO = require('./NutritionDTO');
const TrainingPrescriptionDTO = require('./TrainingPrescriptionDTO');
const CardioPrescriptionDTO = require('./CardioPrescriptionDTO');
const PerformanceContextDTO = require('./PerformanceContextDTO');

const contracts = {
  // Patient
  validatePatientDTO: PatientDTO.validatePatientDTO,
  createPatientDTO: PatientDTO.createPatientDTO,

  // Assessment
  validateAssessmentDTO: AssessmentDTO.validateAssessmentDTO,
  createAssessmentDTO: AssessmentDTO.createAssessmentDTO,

  // Nutrition
  validateNutritionDTO: NutritionDTO.validateNutritionDTO,
  createNutritionDTO: NutritionDTO.createNutritionDTO,

  // Training Prescription
  SPLIT_SOURCES: TrainingPrescriptionDTO.SPLIT_SOURCES,
  VALID_TRAINING_SPLITS: TrainingPrescriptionDTO.VALID_TRAINING_SPLITS,
  normalizeTrainingSplit: TrainingPrescriptionDTO.normalizeTrainingSplit,
  validateTrainingSplit: TrainingPrescriptionDTO.validateTrainingSplit,
  validateTrainingPrescriptionDTO: TrainingPrescriptionDTO.validateTrainingPrescriptionDTO,
  createTrainingPrescriptionDTO: TrainingPrescriptionDTO.createTrainingPrescriptionDTO,

  // Cardio Prescription
  validateCardioPrescriptionDTO: CardioPrescriptionDTO.validateCardioPrescriptionDTO,
  createCardioPrescriptionDTO: CardioPrescriptionDTO.createCardioPrescriptionDTO,

  // Performance Context
  validatePerformanceContextDTO: PerformanceContextDTO.validatePerformanceContextDTO,
  createPerformanceContextDTO: PerformanceContextDTO.createPerformanceContextDTO
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = contracts;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  Object.assign(window.NutriDomain, contracts);
}
