export type SetLogDetail = {
  set_number: number;
  set_type: string;
  actual_weight: number | null;
  actual_reps: number | null;
  exercise_name: string;
};

export type WorkoutLogEntry = {
  id: number;
  workout_name: string;
  split_label: string;
  week_number: number;
  week_label: string;
  started_at: string;
  completed_at: string | null;
  total_volume: number;
  sets_completed: number;
  sets: SetLogDetail[];
};
