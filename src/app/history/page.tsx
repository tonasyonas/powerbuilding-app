import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { HistoryClient } from "./history-client";

export type SetLogDetail = {
  set_number: number;
  set_type: string;
  actual_weight: number | null;
  actual_reps: number | null;
  exercise_name: string;
};

export type WorkoutLogEntry = {
  id: number;
  workout_name: string;
  split_label: string;
  week_number: number;
  week_label: string;
  started_at: string;
  completed_at: string | null;
  total_volume: number;
  sets_completed: number;
  sets: SetLogDetail[];
};

export default async function HistoryPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile for unit preference
  const { data: profile } = await supabase
    .from("user_profile")
    .select("unit")
    .eq("user_id", user.id)
    .single();

  const unit = profile?.unit ?? "kg";

  // Fetch all completed workout logs with workout/week info
  const { data: logs } = await supabase
    .from("workout_log")
    .select(
      `
      id,
      started_at,
      completed_at,
      workout:workout_id (
        name,
        split_label,
        week:week_id (
          week_number,
          label
        )
      )
    `
    )
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("started_at", { ascending: false });

  if (!logs || logs.length === 0) {
    return <HistoryClient logs={[]} unit={unit} />;
  }

  // Fetch all set_logs for these workout_logs
  const logIds = logs.map((l) => l.id);
  const { data: setLogs } = await supabase
    .from("set_log")
    .select(
      `
      id,
      workout_log_id,
      set_number,
      set_type,
      actual_weight,
      actual_reps,
      workout_exercise:workout_exercise_id (
        exercise:exercise_id (
          name
        )
      )
    `
    )
    .in("workout_log_id", logIds)
    .order("set_number", { ascending: true });

  // Build a map of log_id -> set details
  const setsByLog = new Map<number, SetLogDetail[]>();
  const volumeByLog = new Map<number, number>();
  const countByLog = new Map<number, number>();

  for (const s of setLogs ?? []) {
    const logId = s.workout_log_id;

    // Extract exercise name from the nested join
    const we = s.workout_exercise as unknown as {
      exercise: { name: string } | null;
    } | null;
    const exerciseName = we?.exercise?.name ?? "Unknown";

    const detail: SetLogDetail = {
      set_number: s.set_number,
      set_type: s.set_type,
      actual_weight: s.actual_weight,
      actual_reps: s.actual_reps,
      exercise_name: exerciseName,
    };

    if (!setsByLog.has(logId)) setsByLog.set(logId, []);
    setsByLog.get(logId)!.push(detail);

    // Accumulate volume
    const weight = s.actual_weight ?? 0;
    const reps = s.actual_reps ?? 0;
    volumeByLog.set(logId, (volumeByLog.get(logId) ?? 0) + weight * reps);
    countByLog.set(logId, (countByLog.get(logId) ?? 0) + 1);
  }

  // Build the final entries
  const entries: WorkoutLogEntry[] = logs.map((log) => {
    const workout = log.workout as unknown as {
      name: string;
      split_label: string;
      week: { week_number: number; label: string } | null;
    } | null;

    return {
      id: log.id,
      workout_name: workout?.name ?? "Workout",
      split_label: workout?.split_label ?? "",
      week_number: workout?.week?.week_number ?? 0,
      week_label: workout?.week?.label ?? "",
      started_at: log.started_at,
      completed_at: log.completed_at,
      total_volume: volumeByLog.get(log.id) ?? 0,
      sets_completed: countByLog.get(log.id) ?? 0,
      sets: setsByLog.get(log.id) ?? [],
    };
  });

  return <HistoryClient logs={entries} unit={unit} />;
}
