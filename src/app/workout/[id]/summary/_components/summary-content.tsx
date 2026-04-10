import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, getProfile } from "@/utils/supabase/server";
import { getCachedWorkout } from "@/utils/cached-queries";
import { SummaryHaptics } from "../summary-haptics";
import { advanceWeekIfComplete } from "../actions";

function TrophyIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#dc2626"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function formatDuration(startedAt: string, completedAt: string): string {
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffMs = end - start;
  if (diffMs < 0) return "0 min";

  const totalMinutes = Math.round(diffMs / 60000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export async function SummaryContent({
  workoutId,
}: {
  workoutId: number;
}) {
  const [{ user, supabase }, profile] = await Promise.all([
    getUser(),
    getProfile(),
  ]);

  // Fetch workout info (cached — static program data)
  const workout = await getCachedWorkout(workoutId);

  if (!workout) {
    redirect("/dashboard");
  }

  // Fetch the most recent workout_log for this workout + user
  const { data: workoutLog } = await supabase
    .from("workout_log")
    .select("*")
    .eq("user_id", user.id)
    .eq("workout_id", workoutId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  if (!workoutLog) {
    redirect(`/workout/${workoutId}`);
  }

  // Fetch set logs for this workout log
  const { data: setLogs } = await supabase
    .from("set_log")
    .select("*")
    .eq("workout_log_id", workoutLog.id);

  const allSets = setLogs ?? [];
  const workingSets = allSets.filter((s) => s.set_type === "working");
  const totalSets = workingSets.length;
  const totalVolume = workingSets.reduce((acc, s) => {
    const w = s.actual_weight ?? 0;
    const r = s.actual_reps ?? 0;
    return acc + w * r;
  }, 0);

  // Duration
  const duration =
    workoutLog.started_at && workoutLog.completed_at
      ? formatDuration(workoutLog.started_at, workoutLog.completed_at)
      : "-";

  const unit = profile?.unit ?? "kg";

  // Auto-advance week if all days complete (via server action)
  const allDaysComplete = profile
    ? await advanceWeekIfComplete(user.id, workout.week_id, profile.current_week_id)
    : false;

  // Format volume
  const volumeDisplay =
    totalVolume >= 1000
      ? `${(totalVolume / 1000).toFixed(1)}k ${unit}`
      : `${Math.round(totalVolume)} ${unit}`;

  return (
    <div className="min-h-dvh bg-zinc-950 flex items-center justify-center px-5">
      <SummaryHaptics weekComplete={allDaysComplete} />
      <div className="w-full max-w-sm text-center">
        {/* Trophy icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
            <TrophyIcon />
          </div>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-wider text-zinc-100 uppercase">
          Workout Complete
        </h1>
        <p className="mt-2 text-sm text-muted">{workout.name}</p>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          <div className="rounded-xl border border-border bg-card px-3 py-4">
            <p className="font-mono text-2xl font-bold text-zinc-100">
              {duration}
            </p>
            <p className="text-[11px] text-muted mt-1 uppercase tracking-wider">
              Duration
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-4">
            <p className="font-mono text-2xl font-bold text-zinc-100">
              {volumeDisplay}
            </p>
            <p className="text-[11px] text-muted mt-1 uppercase tracking-wider">
              Volume
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-4">
            <p className="font-mono text-2xl font-bold text-zinc-100">
              {totalSets}
            </p>
            <p className="text-[11px] text-muted mt-1 uppercase tracking-wider">
              Sets
            </p>
          </div>
        </div>

        {/* Week complete banner */}
        {allDaysComplete && (
          <div className="mt-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
            <p className="text-sm font-semibold text-success">
              Week complete! Advanced to next week.
            </p>
          </div>
        )}

        {/* Back to dashboard */}
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center w-full mt-8 rounded-xl bg-accent py-4 text-base font-display font-bold tracking-wider text-white uppercase cursor-pointer transition-all duration-150 hover:bg-accent-hover active:scale-[0.98]"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
