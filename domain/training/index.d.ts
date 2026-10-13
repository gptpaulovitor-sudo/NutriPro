import { Exercise, EXERCISE_DATABASE, MUSCLE_GROUPS, MECHANICS_COLOR } from './ExerciseCatalog';
import { SplitDefinition, WorkoutRoutine, PrescribedExercise, TRAINING_SPLITS, PERF_SPLIT_PRESETS, inferSplitFromModality, normalizeSplitKey } from './SplitPresets';

export declare class TrainingGenerationStateMachine {
  constructor(options?: any);
  getState(): string;
  subscribe(listener: Function): void;
  transitionTo(nextState: string, metadata?: any): void;
  run(
    context: any,
    aiGeneratorFn: Function,
    structuralValidatorFn?: Function,
    clinicalValidatorFn?: Function
  ): Promise<any>;
}

export declare const ModalityCatalog: any;
export declare const EquipmentService: any;
export declare const RecoveryEngine: any;
export declare const ProgressionEngine: any;
export declare const ModalityEngineRegistry: any;
export declare const InternalTrainingDatabase: any;
export declare const DeterministicTrainingGenerator: any;
export declare const ExerciseCatalog: any;
export declare const SplitPresets: any;

export {
  Exercise,
  EXERCISE_DATABASE,
  MUSCLE_GROUPS,
  MECHANICS_COLOR,
  SplitDefinition,
  WorkoutRoutine,
  PrescribedExercise,
  TRAINING_SPLITS,
  PERF_SPLIT_PRESETS,
  inferSplitFromModality,
  normalizeSplitKey
};
