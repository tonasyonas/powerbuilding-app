import { redirect } from "next/navigation";
import { getUser } from "@/utils/supabase/server";
import { DashboardClient } from "../dashboard-client";

interface DashboardDataProps {
  requestedWeekId: number;
  userId: string;
  profileCurrentWeekId: number;
}

export async function DashboardData({
  requestedWeekId,
  userId,
  profileCurrentWeekId,
}: DashboardDataProps) {
  // getUser() is wrapped in React cache() — free deduplication within the same request
  const { supabase } = await getUser();

  const { data: allWeeks } = await supabase
    .from("week")
    .select("id, week_number, label")
    .order("week_number", { ascending: true });

  // Current week + workouts in parallel
  const [{ data: currentWeek }, { data: workouts }] = await Promise.all([
    supabase.from("week").select("*").eq("id", requestedWeekId).single(),
    supabase
      .from("workout")
      .select(
        "id, day_number, name, split_label, is_optional, workout_exercise(count)"
      )
      .eq("week_id", requestedWeekId)
      .order("day_number", { ascending: true }),
  ]);

  if (!currentWeek) redirect("/onboarding");

  // Completed logs (exercise counts now come from the workouts join above)
  const workoutIds = (workouts ?? []).map((w: any) => w.id);
  const safeIds = workoutIds.length > 0 ? workoutIds : [-1];

  const { data: completedLogs } = await supabase
    .from("workout_log")
    .select("workout_id, completed_at")
    .eq("user_id", userId)
    .in("workout_id", safeIds)
    .not("completed_at", "is", null);

  const exerciseCountMap: Record<number, number> = {};
  for (const w of workouts ?? []) {
    const we = (w as any).workout_exercise;
    exerciseCountMap[w.id] = we?.[0]?.count ?? 0;
  }

  const completedWorkoutIds = new Set(
    (completedLogs ?? []).map((l) => l.workout_id)
  );

  const currentWeekIndex = (allWeeks ?? []).findIndex(
    (w) => w.id === currentWeek.id
  );
  const prevWeek =
    currentWeekIndex > 0 ? (allWeeks ?? [])[currentWeekIndex - 1] : null;
  const nextWeek =
    currentWeekIndex < (allWeeks ?? []).length - 1
      ? (allWeeks ?? [])[currentWeekIndex + 1]
      : null;

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
      isCurrentWeek={currentWeek.id === profileCurrentWeekId}
    />
  );
}
