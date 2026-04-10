import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/utils/supabase/server";
import {
  getCachedWeeks,
  getCachedWeek,
  getCachedWorkoutsByWeek,
} from "@/utils/cached-queries";
import { DashboardClient } from "../dashboard-client";

interface DashboardDataProps {
  weekParam?: string;
}

export async function DashboardData({ weekParam }: DashboardDataProps) {
  const [{ user, supabase }, profile] = await Promise.all([
    getUser(),
    getProfile(),
  ]);

  if (!profile || profile.squat_1rm === null) redirect("/onboarding");

  const requestedWeekId = weekParam
    ? Number(weekParam)
    : profile.current_week_id;

  // Program data — cached across requests (static seed data)
  const [allWeeks, currentWeek, workouts] = await Promise.all([
    getCachedWeeks(),
    getCachedWeek(requestedWeekId),
    getCachedWorkoutsByWeek(requestedWeekId),
  ]);

  if (!currentWeek) redirect("/onboarding");

  // Completed logs — user-specific, not cached
  const workoutIds = workouts.map((w: any) => w.id);
  const safeIds = workoutIds.length > 0 ? workoutIds : [-1];

  const { data: completedLogs } = await supabase
    .from("workout_log")
    .select("workout_id, completed_at")
    .eq("user_id", user.id)
    .in("workout_id", safeIds)
    .not("completed_at", "is", null);

  const exerciseCountMap: Record<number, number> = {};
  for (const w of workouts) {
    const we = (w as any).workout_exercise;
    exerciseCountMap[w.id] = we?.[0]?.count ?? 0;
  }

  const completedWorkoutIds = new Set(
    (completedLogs ?? []).map((l) => l.workout_id)
  );

  const currentWeekIndex = allWeeks.findIndex(
    (w) => w.id === currentWeek.id
  );
  const prevWeek =
    currentWeekIndex > 0 ? allWeeks[currentWeekIndex - 1] : null;
  const nextWeek =
    currentWeekIndex < allWeeks.length - 1
      ? allWeeks[currentWeekIndex + 1]
      : null;

  let foundUpNext = false;
  const workoutCards = workouts.map((w) => {
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
