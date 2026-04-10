"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

/**
 * Auto-advance the user's current week if all workouts in the given week are complete.
 * Returns whether the week was advanced.
 */
export async function advanceWeekIfComplete(
  userId: string,
  workoutWeekId: number,
  currentWeekId: number
): Promise<boolean> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check if all workouts in the week are complete
  const { data: weekWorkouts } = await supabase
    .from("workout")
    .select("id")
    .eq("week_id", workoutWeekId);

  const weekWorkoutIds = (weekWorkouts ?? []).map((w) => w.id);

  const { data: completedLogs } = await supabase
    .from("workout_log")
    .select("workout_id")
    .eq("user_id", userId)
    .in("workout_id", weekWorkoutIds.length > 0 ? weekWorkoutIds : [-1])
    .not("completed_at", "is", null);

  const completedWorkoutIds = new Set(
    (completedLogs ?? []).map((l) => l.workout_id)
  );

  const allDaysComplete =
    weekWorkoutIds.length > 0 &&
    weekWorkoutIds.every((id) => completedWorkoutIds.has(id));

  if (!allDaysComplete) return false;

  // Find the next week
  const { data: currentWeek } = await supabase
    .from("week")
    .select("week_number")
    .eq("id", workoutWeekId)
    .single();

  if (!currentWeek) return true; // all days complete but can't advance

  const { data: nextWeek } = await supabase
    .from("week")
    .select("id")
    .eq("week_number", currentWeek.week_number + 1)
    .limit(1)
    .single();

  if (nextWeek && currentWeekId === workoutWeekId) {
    await supabase
      .from("user_profile")
      .update({ current_week_id: nextWeek.id })
      .eq("user_id", userId);
  }

  return true;
}
