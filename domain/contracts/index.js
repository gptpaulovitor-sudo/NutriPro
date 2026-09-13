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
const NutritionPrescriptionContextDTO = require('./NutritionPrescriptionContextDTO');
const FoodSolverContract = require('./FoodSolverContract');
const MealAssemblyContract = require('./MealAssemblyContract');
const MealTimingContract = require('./MealTimingContract');
const NutrientTimingContract = require('./NutrientTimingContract');
const GlobalPrescriptionValidationContract = require('./GlobalPrescriptionValidationContract');

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
  createPerformanceContextDTO: PerformanceContextDTO.createPerformanceContextDTO,

  // Nutrition Prescription Context (Fase N1.1)
  validateNutritionPrescriptionContextDTO: NutritionPrescriptionContextDTO.validateNutritionPrescriptionContextDTO,
  createNutritionPrescriptionContextDTO: NutritionPrescriptionContextDTO.createNutritionPrescriptionContextDTO,

  // Food Solver Contract (Fase N3.1)
  FOOD_SOLVER_CONTRACT_VERSION: FoodSolverContract.CONTRACT_VERSION,
  SOLVER_STATUS: FoodSolverContract.SOLVER_STATUS,
  BROMATOLOGY_ENERGY_STATUS: FoodSolverContract.BROMATOLOGY_ENERGY_STATUS,
  FOOD_SOURCES: FoodSolverContract.FOOD_SOURCES,
  UNIT_CONVERSION_POLICY: FoodSolverContract.UNIT_CONVERSION_POLICY,
  PRECISION_POLICY: FoodSolverContract.PRECISION_POLICY,
  validateCanonicalFoodDTO: FoodSolverContract.validateCanonicalFoodDTO,
  createCanonicalFoodDTO: FoodSolverContract.createCanonicalFoodDTO,
  validateFoodSolverInput: FoodSolverContract.validateFoodSolverInput,
  validateFoodSolverOutput: FoodSolverContract.validateFoodSolverOutput,

  // Meal Assembly Contract (Fase N3.3)
  MEAL_ASSEMBLY_CONTRACT_VERSION: MealAssemblyContract.CONTRACT_VERSION,
  ASSEMBLY_STATUS: MealAssemblyContract.ASSEMBLY_STATUS,
  MEAL_ROLES: MealAssemblyContract.MEAL_ROLES,
  extractGlobalSolutionItems: MealAssemblyContract.extractGlobalSolutionItems,
  validateMealAssemblyInput: MealAssemblyContract.validateMealAssemblyInput,
  validateMealAssemblyOutput: MealAssemblyContract.validateMealAssemblyOutput,

  // Meal Timing Contract (Fase N3.4)
  MEAL_TIMING_CONTRACT_VERSION: MealTimingContract.CONTRACT_VERSION,
  TIMING_STATUS: MealTimingContract.TIMING_STATUS,
  WINDOW_STRENGTH: MealTimingContract.WINDOW_STRENGTH,
  TEMPORAL_STATUS: MealTimingContract.TEMPORAL_STATUS,
  TIMING_SOURCES: MealTimingContract.TIMING_SOURCES,
  TEMPORAL_EVENT_TYPES: MealTimingContract.TEMPORAL_EVENT_TYPES,
  validateMealTimingInput: MealTimingContract.validateMealTimingInput,
  validateMealTimingOutput: MealTimingContract.validateMealTimingOutput,

  // Nutrient Timing Contract (Fase N3.5)
  NUTRIENT_TIMING_CONTRACT_VERSION: NutrientTimingContract.CONTRACT_VERSION,
  TIMING_ANALYSIS_VERSION: NutrientTimingContract.TIMING_ANALYSIS_VERSION,
  NUTRIENT_TIMING_STATUS: NutrientTimingContract.NUTRIENT_TIMING_STATUS,
  TEMPORAL_PRIMARY_RELATION: NutrientTimingContract.TEMPORAL_PRIMARY_RELATION,
  TEMPORAL_SECONDARY_RELATION: NutrientTimingContract.TEMPORAL_SECONDARY_RELATION,
  EVENT_RELATIONS: NutrientTimingContract.EVENT_RELATIONS,
  validateNutrientTimingInput: NutrientTimingContract.validateNutrientTimingInput,
  validateNutrientTimingOutput: NutrientTimingContract.validateNutrientTimingOutput,

  // Global Prescription Validation Contract (Fase N3.6)
  GLOBAL_VALIDATION_CONTRACT_VERSION: GlobalPrescriptionValidationContract.CONTRACT_VERSION,
  GLOBAL_VALIDATION_VERSION: GlobalPrescriptionValidationContract.GLOBAL_VALIDATION_VERSION,
  GLOBAL_VALIDATION_STATUS: GlobalPrescriptionValidationContract.GLOBAL_VALIDATION_STATUS,
  GLOBAL_GATE_ID: GlobalPrescriptionValidationContract.GLOBAL_GATE_ID,
  GATE_SEVERITY: GlobalPrescriptionValidationContract.GATE_SEVERITY,
  validateGlobalPrescriptionValidationInput: GlobalPrescriptionValidationContract.validateGlobalPrescriptionValidationInput,
  validateGlobalPrescriptionValidationOutput: GlobalPrescriptionValidationContract.validateGlobalPrescriptionValidationOutput
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = contracts;
}

if (typeof window !== 'undefined') {
  window.NutriDomain = window.NutriDomain || {};
  Object.assign(window.NutriDomain, contracts);
}
