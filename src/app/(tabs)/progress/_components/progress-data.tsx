import { getUser, getProfile } from "@/utils/supabase/server";
import { ProgressClient } from "../progress-client";
import {
  estimateE1RM,
  type E1RMDataPoint,
  type LiftBest,
  type ProgressData,
  type WeeklyVolumePoint,
} from "../types";

export async function ProgressData() {
  const [{ user, supabase }, profile] = await Promise.all([
    getUser(),
    getProfile(),
  ]);
  const unit = profile?.unit ?? "kg";

  const { data: workoutLogs } = await supabase
    .from("workout_log")
    .select(`
      id,
      started_at,
      completed_at,
      workout:workout_id (
        id,
        week:week_id (
          week_number,
          label
        )
      )
    `)
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("started_at", { ascending: true });

  if (!workoutLogs || workoutLogs.length === 0) {
    const emptyData: ProgressData = {
      e1rmByLift: {},
      weeklyVolume: [],
      totalWorkouts: 0,
      totalVolume: 0,
      liftBests: [],
      currentStreak: 0,
      unit,
    };
    return <ProgressClient data={emptyData} />;
  }

  const logIds = workoutLogs.map((l) => l.id);

  // Fetch all set_logs with workout_exercise -> exercise info and reference_lift
  const { data: setLogs } = await supabase
    .from("set_log")
    .select(
      `
      id,
      workout_log_id,
      actual_weight,
      actual_reps,
      workout_exercise:workout_exercise_id (
        reference_lift,
        exercise:exercise_id (
          name
        )
      )
    `
    )
    .in("workout_log_id", logIds);

  // Build a map of workout_log_id -> workout info
  const logInfoMap = new Map<
    number,
    { startedAt: string; weekNumber: number; weekLabel: string }
  >();
  for (const log of workoutLogs) {
    const workout = log.workout as unknown as {
      id: number;
      week: { week_number: number; label: string } | null;
    } | null;
    logInfoMap.set(log.id, {
      startedAt: log.started_at,
      weekNumber: workout?.week?.week_number ?? 0,
      weekLabel: workout?.week?.label ?? "",
    });
  }

  // --- Compute e1RM trends for primary lifts ---
  // Group set_logs by (reference_lift, workout_log_id) and find heaviest estimated 1RM per session
  const liftSessionMap = new Map<
    string,
    Map<number, { date: string; bestE1RM: number }>
  >();

  let totalVolume = 0;

  // Volume per week
  const volumeByWeek = new Map<number, { label: string; volume: number }>();

  for (const s of setLogs ?? []) {
    const weight = s.actual_weight ?? 0;
    const reps = s.actual_reps ?? 0;

    // Accumulate total volume
    totalVolume += weight * reps;

    // Accumulate volume by week
    const logInfo = logInfoMap.get(s.workout_log_id);
    if (logInfo) {
      const wn = logInfo.weekNumber;
      if (!volumeByWeek.has(wn)) {
        volumeByWeek.set(wn, { label: logInfo.weekLabel, volume: 0 });
      }
      volumeByWeek.get(wn)!.volume += weight * reps;
    }

    // E1RM for reference lifts
    const we = s.workout_exercise as unknown as {
      reference_lift: string | null;
      exercise: { name: string } | null;
    } | null;

    const referenceLift = we?.reference_lift;
    if (!referenceLift) continue;

    const e1rm = estimateE1RM(weight, reps);
    if (e1rm === null) continue;

    if (!liftSessionMap.has(referenceLift)) {
      liftSessionMap.set(referenceLift, new Map());
    }
    const sessionMap = liftSessionMap.get(referenceLift)!;

    const existing = sessionMap.get(s.workout_log_id);
    if (!existing || e1rm > existing.bestE1RM) {
      sessionMap.set(s.workout_log_id, {
        date: logInfo?.startedAt ?? "",
        bestE1RM: Math.round(e1rm * 10) / 10,
      });
    }
  }

  // Build e1rm data points sorted by date
  const e1rmByLift: Record<string, E1RMDataPoint[]> = {};
  for (const [lift, sessionMap] of liftSessionMap) {
    const points = Array.from(sessionMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((v, idx) => ({
        date: v.date,
        sessionIndex: idx + 1,
        estimated1RM: v.bestE1RM,
      }));
    e1rmByLift[lift] = points;
  }

  // Build weekly volume data sorted by week number
  const weeklyVolume: WeeklyVolumePoint[] = Array.from(volumeByWeek.entries())
    .sort(([a], [b]) => a - b)
    .map(([wn, info]) => ({
      weekNumber: wn,
      label: `Wk ${wn}`,
      totalVolume: Math.round(info.volume),
    }));

  // Best e1RM per lift
  const liftBests: LiftBest[] = [];
  for (const [lift, points] of Object.entries(e1rmByLift)) {
    if (points.length === 0) continue;
    const best = Math.max(...points.map((p) => p.estimated1RM));
    liftBests.push({
      lift: lift.charAt(0).toUpperCase() + lift.slice(1),
      best1RM: Math.round(best * 10) / 10,
    });
  }

  // Current streak: consecutive weeks (from most recent going back) with at least 1 workout
  const weeksWithWorkouts = new Set<number>();
  for (const log of workoutLogs) {
    const workout = log.workout as unknown as {
      id: number;
      week: { week_number: number; label: string } | null;
    } | null;
    if (workout?.week) {
      weeksWithWorkouts.add(workout.week.week_number);
    }
  }

  const sortedWeekNums = Array.from(weeksWithWorkouts).sort((a, b) => b - a);
  let currentStreak = 0;
  for (let i = 0; i < sortedWeekNums.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else if (sortedWeekNums[i - 1] - sortedWeekNums[i] === 1) {
      currentStreak++;
    } else {
      break;
    }
  }

  const progressData: ProgressData = {
    e1rmByLift,
    weeklyVolume,
    totalWorkouts: workoutLogs.length,
    totalVolume: Math.round(totalVolume),
    liftBests,
    currentStreak,
    unit,
  };

  return <ProgressClient data={progressData} />;
}
