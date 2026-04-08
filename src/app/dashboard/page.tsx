import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const params = await searchParams;

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

  if (!profile || profile.squat_1rm === null) {
    redirect("/onboarding");
  }

  // Determine which week to show
  const requestedWeekId = params.week
    ? Number(params.week)
    : profile.current_week_id;

  // Fetch current week
  const { data: currentWeek } = await supabase
    .from("week")
    .select("*")
    .eq("id", requestedWeekId)
    .single();

  if (!currentWeek) {
    redirect("/onboarding");
  }

  // Fetch all weeks for navigation
  const { data: allWeeks } = await supabase
    .from("week")
    .select("id, week_number, label")
    .order("week_number", { ascending: true });

  // Fetch workouts for this week, with exercise count
  const { data: workouts } = await supabase
    .from("workout")
    .select("id, day_number, name, split_label, is_optional")
    .eq("week_id", currentWeek.id)
    .order("day_number", { ascending: true });

  // Fetch exercise counts per workout
  const workoutIds = (workouts ?? []).map((w) => w.id);
  const { data: exerciseCounts } = await supabase
    .from("workout_exercise")
    .select("workout_id")
    .in("workout_id", workoutIds.length > 0 ? workoutIds : [-1]);

  // Count unique exercises per workout
  const exerciseCountMap: Record<number, number> = {};
  for (const row of exerciseCounts ?? []) {
    exerciseCountMap[row.workout_id] =
      (exerciseCountMap[row.workout_id] ?? 0) + 1;
  }

  // Fetch completed workout logs for this week's workouts
  const { data: completedLogs } = await supabase
    .from("workout_log")
    .select("workout_id, completed_at")
    .eq("user_id", user.id)
    .in("workout_id", workoutIds.length > 0 ? workoutIds : [-1])
    .not("completed_at", "is", null);

  const completedWorkoutIds = new Set(
    (completedLogs ?? []).map((l) => l.workout_id)
  );

  // Find the current week index
  const currentWeekIndex = (allWeeks ?? []).findIndex(
    (w) => w.id === currentWeek.id
  );
  const prevWeek =
    currentWeekIndex > 0 ? (allWeeks ?? [])[currentWeekIndex - 1] : null;
  const nextWeek =
    currentWeekIndex < (allWeeks ?? []).length - 1
      ? (allWeeks ?? [])[currentWeekIndex + 1]
      : null;

  // Build workout cards data
  let foundUpNext = false;
  const workoutCards = (workouts ?? []).map((w) => {
    const isDone = completedWorkoutIds.has(w.id);
    let status: "done" | "up-next" | "upcoming" = "upcoming";
    if (isDone) {
      status = "done";
    } else if (!foundUpNext) {
      status = "up-next";
      foundUpNext = true;
    }
    return {
      id: w.id,
      dayNumber: w.day_number,
      name: w.name,
      splitLabel: w.split_label,
      exerciseCount: exerciseCountMap[w.id] ?? 0,
      status,
    };
  });

  return (
    <DashboardClient
      weekNumber={currentWeek.week_number}
      splitType={currentWeek.split_type}
      weekLabel={currentWeek.label}
      workoutCards={workoutCards}
      prevWeekId={prevWeek?.id ?? null}
      nextWeekId={nextWeek?.id ?? null}
      isCurrentWeek={currentWeek.id === profile.current_week_id}
    />
  );
}
