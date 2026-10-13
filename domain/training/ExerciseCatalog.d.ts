export interface Exercise {
  id: string;
  name: string;
  group: string;
  mechanics: 'Composto' | 'Isolador';
  equipment: string;
  primaryMuscle: string;
  secondaryMuscles: string;
  primary?: string;
  secondary?: string;
  resistProfile?: string;
  cadence?: string;
  cadenceNote?: string;
}

export declare const EXERCISE_DATABASE: readonly Exercise[];
export declare const PERF_EXERCISE_DB: readonly Exercise[];
export declare const MUSCLE_GROUPS: readonly string[];
export declare const MECHANICS_COLOR: Record<string, string>;

export declare function findExerciseById(id: string): Exercise | null;
export declare function getExercisesByGroup(group: string): Exercise[];
