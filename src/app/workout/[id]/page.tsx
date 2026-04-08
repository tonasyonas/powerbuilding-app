import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { WorkoutClient } from "./workout-client";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { id } = await params;
  const workoutId = Number(id);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("user_profile")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding");
  }

  // Fetch workout details
  const { data: workout } = await supabase
    .from("workout")
    .select("*")
    .eq("id", workoutId)
    .single();

  if (!workout) {
    redirect("/dashboard");
  }

  // Fetch parent week for header label
  const { data: week } = await supabase
    .from("week")
    .select("*")
    .eq("id", workout.week_id)
    .single();

  // Fetch workout exercises joined with exercise data, ordered by `order`
  const { data: workoutExercises } = await supabase
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

  return (
    <WorkoutClient
      workout={{
        id: workout.id,
        name: workout.name,
        dayNumber: workout.day_number,
        splitLabel: workout.split_label,
      }}
      week={{
        id: week?.id ?? 0,
        weekNumber: week?.week_number ?? 1,
        label: week?.label ?? "",
      }}
      exercises={
        (workoutExercises ?? []).map((we) => {
          // Supabase returns the joined exercise as an object (or array with single item)
          const ex = Array.isArray(we.exercise) ? we.exercise[0] : we.exercise;
          return {
            workoutExerciseId: we.id,
            exerciseId: we.exercise_id,
            order: we.order,
            name: ex?.name ?? "Unknown",
            bodyPart: ex?.body_part ?? "",
            category: ex?.category ?? "",
            warmupSets: we.warmup_sets,
            workingSets: we.working_sets,
            setType: we.set_type,
            repsMin: we.reps_min,
            repsMax: we.reps_max,
            isAmrap: we.is_amrap,
            percent1rmMin: we.percent_1rm_min,
            percent1rmMax: we.percent_1rm_max,
            referenceLift: we.reference_lift ?? ex?.default_reference_lift ?? null,
            rpe: we.rpe,
            restMinSeconds: we.rest_min_seconds,
            restMaxSeconds: we.rest_max_seconds,
            supersetGroup: we.superset_group,
            supersetOrder: we.superset_order,
            notes: we.notes,
            isOptional: we.is_optional,
          };
        })
      }
      profile={{
        squat1rm: profile.squat_1rm,
        bench1rm: profile.bench_1rm,
        deadlift1rm: profile.deadlift_1rm,
        ohp1rm: profile.ohp_1rm,
        unit: profile.unit,
        plateIncrement: profile.plate_increment,
      }}
      userId={user.id}
    />
  );
}
