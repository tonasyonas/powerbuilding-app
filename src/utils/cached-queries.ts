import { cacheLife, cacheTag } from "next/cache";
import { createServerClient } from "@supabase/ssr";

/**
 * Stateless Supabase client for cached queries.
 * No cookies needed — program data tables have no RLS restrictions.
 */
function createAnonClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

/** All weeks ordered by week_number. */
export async function getCachedWeeks() {
  "use cache";
  cacheLife("max");
  cacheTag("weeks");
  const supabase = createAnonClient();
  const { data } = await supabase
    .from("week")
    .select("id, week_number, label, split_type")
    .order("week_number", { ascending: true });
  return data ?? [];
}

/** Single week by ID. */
export async function getCachedWeek(weekId: number) {
  "use cache";
  cacheLife("max");
  cacheTag("weeks");
  const supabase = createAnonClient();
  const { data } = await supabase
    .from("week")
    .select("*")
    .eq("id", weekId)
    .single();
  return data;
}

/** Workouts for a given week, with exercise counts. */
export async function getCachedWorkoutsByWeek(weekId: number) {
  "use cache";
  cacheLife("max");
  cacheTag("workouts");
  const supabase = createAnonClient();
  const { data } = await supabase
    .from("workout")
    .select(
      "id, day_number, name, split_label, is_optional, workout_exercise(count)"
    )
    .eq("week_id", weekId)
    .order("day_number", { ascending: true });
  return data ?? [];
}

/** Single workout by ID. */
export async function getCachedWorkout(workoutId: number) {
  "use cache";
  cacheLife("max");
  cacheTag("workouts");
  const supabase = createAnonClient();
  const { data } = await supabase
    .from("workout")
    .select("*")
    .eq("id", workoutId)
    .single();
  return data;
}

/** Workout exercises with joined exercise data, ordered by `order`. */
export async function getCachedWorkoutExercises(workoutId: number) {
  "use cache";
  cacheLife("max");
  cacheTag("exercises");
  const supabase = createAnonClient();
  const { data } = await supabase
    .from("workout_exercise")
    .select(
      `
      id,
      exercise_id,
      order,
      warmup_sets,
      working_sets,
      set_type,
      reps_min,
      reps_max,
      is_amrap,
      percent_1rm_min,
      percent_1rm_max,
      reference_lift,
      rpe,
      rest_min_seconds,
      rest_max_seconds,
      superset_group,
      superset_order,
      notes,
      is_optional,
      exercise:exercise_id (
        id,
        name,
        body_part,
        category,
        muscle_groups,
        default_reference_lift
      )
    `
    )
    .eq("workout_id", workoutId)
    .order("order", { ascending: true });
  return data ?? [];
}
