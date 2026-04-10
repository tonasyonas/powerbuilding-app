export type E1RMDataPoint = {
  date: string;
  sessionIndex: number;
  estimated1RM: number;
};

export type WeeklyVolumePoint = {
  weekNumber: number;
  label: string;
  totalVolume: number;
};

export type LiftBest = {
  lift: string;
  best1RM: number;
};

export type ProgressData = {
  e1rmByLift: Record<string, E1RMDataPoint[]>;
  weeklyVolume: WeeklyVolumePoint[];
  totalWorkouts: number;
  totalVolume: number;
  liftBests: LiftBest[];
  currentStreak: number;
  unit: string;
};

/**
 * Epley formula: estimated 1RM = weight * (1 + reps / 30)
 * Only valid for reps > 1 and reps <= 12.
 */
export function estimateE1RM(weight: number, reps: number): number | null {
  if (reps <= 1 || reps > 12 || weight <= 0) return null;
  return weight * (1 + reps / 30);
}
