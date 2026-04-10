import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/utils/supabase/server";
import {
  getCachedWorkout,
  getCachedWeek,
  getCachedWorkoutExercises,
} from "@/utils/cached-queries";
import { WorkoutClient } from "../workout-client";

export async function WorkoutData({ workoutId }: { workoutId: number }) {
  const { user } = await getUser();

  // Fetch user profile
  const profile = await getProfile();
  if (!profile) {
    redirect("/onboarding");
  }

  // Program data — cached across requests (static seed data)
  const workout = await getCachedWorkout(workoutId);

  if (!workout) {
    redirect("/dashboard");
  }

  const [week, workoutExercises] = await Promise.all([
    getCachedWeek(workout.week_id),
    getCachedWorkoutExercises(workoutId),
  ]);

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
        workoutExercises.map((we) => {
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
