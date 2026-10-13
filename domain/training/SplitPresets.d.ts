export interface PrescribedExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  rpe: number;
  rest: number;
  obs?: string;
  cadence?: string;
  resistProfile?: string;
  heavyCompoundPrioritized?: boolean;
  rir?: number;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  exercises: PrescribedExercise[];
}

export interface SplitDefinition {
  id: string;
  name: string;
  category: 'Híbrida & Racing' | 'Musculação Tradicional' | 'Modalidade Pura' | 'Readaptação';
  daysCount: number;
  description: string;
  badge: string;
  icon: string;
  routines: WorkoutRoutine[];
}

export declare const TRAINING_SPLITS: Record<string, SplitDefinition>;
export declare const PERF_SPLIT_PRESETS: Record<string, WorkoutRoutine[]>;

export declare function normalizeSplitKey(splitKey: string): string;
export declare function inferSplitFromModality(modality?: string | null, frequency?: number | string | null): string;
export declare function perfInferSplitFromAnamnese(modality?: string | null, frequency?: number | string | null): string;
