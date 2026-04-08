/**
 * Weight calculation utilities for the powerbuilding tracker.
 * Handles 1RM-based target weights, warmup pyramids, and formatting.
 */

export type UserProfile = {
  squat_1rm: number | null;
  bench_1rm: number | null;
  deadlift_1rm: number | null;
  ohp_1rm: number | null;
  plate_increment: number;
  unit: string;
};

export type WarmupSet = {
  weight: number;
  reps: number;
};

/**
 * Calculate the target working weight from a percentage of a reference 1RM,
 * rounded to the nearest plate increment.
 */
export function calculateWeight(
  percent1rm: number | null,
  referenceLift: string | null,
  profile: UserProfile,
  plateIncrement?: number
): number | null {
  if (!percent1rm || !referenceLift) return null;

  const increment = plateIncrement ?? profile.plate_increment;

  const rmMap: Record<string, number | null> = {
    squat: profile.squat_1rm,
    bench: profile.bench_1rm,
    deadlift: profile.deadlift_1rm,
    ohp: profile.ohp_1rm,
  };

  const rm = rmMap[referenceLift];
  if (!rm) return null;

  return Math.round((rm * percent1rm) / 100 / increment) * increment;
}

/**
 * Generate a warmup pyramid leading up to a working weight.
 *
 * Default pyramid percentages (of working weight):
 *   bar x 15, 40% x 5, 50% x 4, 60% x 3, 70% x 2
 *
 * The number of warmup sets returned matches the requested count,
 * taking the last N entries from the full pyramid.
 */
export function generateWarmupPyramid(
  workingWeight: number,
  warmupSets: number,
  barWeight: number,
  plateIncrement: number
): WarmupSet[] {
  if (warmupSets <= 0 || workingWeight <= 0) return [];

  const fullPyramid: WarmupSet[] = [
    { weight: barWeight, reps: 15 },
    {
      weight:
        Math.round((workingWeight * 0.4) / plateIncrement) * plateIncrement,
      reps: 5,
    },
    {
      weight:
        Math.round((workingWeight * 0.5) / plateIncrement) * plateIncrement,
      reps: 4,
    },
    {
      weight:
        Math.round((workingWeight * 0.6) / plateIncrement) * plateIncrement,
      reps: 3,
    },
    {
      weight:
        Math.round((workingWeight * 0.7) / plateIncrement) * plateIncrement,
      reps: 2,
    },
  ];

  // Ensure bar-only set uses at least the bar weight
  for (const set of fullPyramid) {
    if (set.weight < barWeight) {
      set.weight = barWeight;
    }
  }

  // Take the last N sets from the pyramid
  const startIdx = Math.max(0, fullPyramid.length - warmupSets);
  return fullPyramid.slice(startIdx, startIdx + warmupSets);
}

/**
 * Format a weight value with its unit string.
 */
export function formatWeight(weight: number, unit: string): string {
  // Display whole numbers without decimals, otherwise show one decimal
  const formatted =
    weight % 1 === 0 ? weight.toString() : weight.toFixed(1);
  return `${formatted} ${unit}`;
}
