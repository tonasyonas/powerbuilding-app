/**
 * Seed script: loads exercises.json and weeks.json into Supabase.
 * Run with: npx tsx src/seed/seed.ts
 */
import { createClient } from "@supabase/supabase-js";
import exercisesData from "./exercises.json";
import weeksData from "./weeks.json";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function seed() {
  console.log("Seeding exercises...");
  const exercises = (exercisesData as any).exercises;

  // Map category values to match schema
  const categoryMap: Record<string, string> = {
    compound: "primary_compound",
    primary_compound: "primary_compound",
    secondary_compound: "secondary_compound",
    isolation: "isolation",
    accessory: "isolation",
  };

  const exerciseRows = exercises.map((e: any) => ({
    id: e.id,
    name: e.name,
    body_part: e.body_part,
    muscle_groups: e.muscle_groups,
    category: categoryMap[e.category] || e.category,
    default_reference_lift: e.default_reference_lift || null,
    substitution_group: e.substitution_group || null,
  }));

  // Insert in batches of 50
  for (let i = 0; i < exerciseRows.length; i += 50) {
    const batch = exerciseRows.slice(i, i + 50);
    const { error } = await supabase.from("exercise").upsert(batch);
    if (error) {
      console.error("Exercise insert error:", error);
      process.exit(1);
    }
  }
  console.log(`  Inserted ${exerciseRows.length} exercises`);

  console.log("Seeding weeks, workouts, and workout_exercises...");
  const weeks = (weeksData as any).weeks;

  for (const week of weeks) {
    // Insert week
    const { data: weekRow, error: weekErr } = await supabase
      .from("week")
      .insert({
        week_number: week.week_number,
        split_type: week.split_type,
        variant: week.variant || null,
        label: week.label,
        notes: week.notes || null,
      })
      .select("id")
      .single();

    if (weekErr) {
      console.error(`Week insert error (${week.label}):`, weekErr);
      process.exit(1);
    }

    const weekId = weekRow.id;

    for (const workout of week.workouts) {
      // Insert workout
      const { data: workoutRow, error: workoutErr } = await supabase
        .from("workout")
        .insert({
          week_id: weekId,
          day_number: workout.day_number,
          name: workout.name,
          split_label: workout.split_label,
          is_optional: workout.is_optional || false,
        })
        .select("id")
        .single();

      if (workoutErr) {
        console.error(`Workout insert error (${workout.name}):`, workoutErr);
        process.exit(1);
      }

      const workoutId = workoutRow.id;

      // Insert workout exercises
      const exerciseRows = workout.exercises.map((e: any) => ({
        workout_id: workoutId,
        exercise_id: e.exercise_id,
        order: e.order,
        warmup_sets: e.warmup_sets ?? 0,
        working_sets: e.working_sets,
        set_type: e.set_type || "working",
        reps_min: e.reps_min ?? null,
        reps_max: e.reps_max ?? null,
        is_amrap: e.is_amrap || false,
        percent_1rm_min: e.percent_1rm_min ?? null,
        percent_1rm_max: e.percent_1rm_max ?? null,
        reference_lift: e.reference_lift || null,
        rpe: e.rpe ?? null,
        rest_min_seconds: e.rest_min_seconds ?? null,
        rest_max_seconds: e.rest_max_seconds ?? null,
        superset_group: e.superset_group || null,
        superset_order: e.superset_order ?? null,
        notes: e.notes || null,
        is_optional: e.is_optional || false,
      }));

      const { error: exErr } = await supabase
        .from("workout_exercise")
        .insert(exerciseRows);

      if (exErr) {
        console.error(
          `Exercise insert error (${workout.name}):`,
          exErr
        );
        process.exit(1);
      }
    }

    console.log(
      `  ${week.label}: ${week.workouts.length} workouts seeded`
    );
  }

  console.log("\nDone! Verifying counts...");
  const { count: exCount } = await supabase
    .from("exercise")
    .select("*", { count: "exact", head: true });
  const { count: wkCount } = await supabase
    .from("week")
    .select("*", { count: "exact", head: true });
  const { count: woCount } = await supabase
    .from("workout")
    .select("*", { count: "exact", head: true });
  const { count: weCount } = await supabase
    .from("workout_exercise")
    .select("*", { count: "exact", head: true });

  console.log(`  exercises: ${exCount}`);
  console.log(`  weeks: ${wkCount}`);
  console.log(`  workouts: ${woCount}`);
  console.log(`  workout_exercises: ${weCount}`);
}

seed().catch(console.error);
