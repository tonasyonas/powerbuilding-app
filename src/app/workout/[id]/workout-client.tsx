"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useHaptics } from "@/hooks/use-haptics";
import {
  calculateWeight,
  generateWarmupPyramid,
  formatWeight,
  type UserProfile,
} from "@/lib/weight-calculator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WorkoutData = {
  id: number;
  name: string;
  dayNumber: number;
  splitLabel: string;
};

type WeekData = {
  id: number;
  weekNumber: number;
  label: string;
};

type ExerciseData = {
  workoutExerciseId: number;
  exerciseId: string;
  order: number;
  name: string;
  bodyPart: string;
  category: string;
  warmupSets: number;
  workingSets: number;
  setType: string;
  repsMin: number | null;
  repsMax: number | null;
  isAmrap: boolean;
  percent1rmMin: number | null;
  percent1rmMax: number | null;
  referenceLift: string | null;
  rpe: number | null;
  restMinSeconds: number | null;
  restMaxSeconds: number | null;
  supersetGroup: string | null;
  supersetOrder: number | null;
  notes: string | null;
  isOptional: boolean;
};

type ProfileData = {
  squat1rm: number | null;
  bench1rm: number | null;
  deadlift1rm: number | null;
  ohp1rm: number | null;
  unit: string;
  plateIncrement: number;
};

type SetEntry = {
  setNumber: number;
  setType: "warmup" | "working";
  targetWeight: number | null;
  targetReps: string;
  actualWeight: string;
  actualReps: string;
  completed: boolean;
  workoutExerciseId: number;
};

type WorkoutClientProps = {
  workout: WorkoutData;
  week: WeekData;
  exercises: ExerciseData[];
  profile: ProfileData;
  userId: string;
};

// ---------------------------------------------------------------------------
// Icon components (inline SVG, no emojis)
// ---------------------------------------------------------------------------

function ArrowLeftIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CheckIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildUserProfile(profile: ProfileData): UserProfile {
  return {
    squat_1rm: profile.squat1rm,
    bench_1rm: profile.bench1rm,
    deadlift_1rm: profile.deadlift1rm,
    ohp_1rm: profile.ohp1rm,
    plate_increment: profile.plateIncrement,
    unit: profile.unit,
  };
}

function formatReps(
  repsMin: number | null,
  repsMax: number | null,
  isAmrap: boolean
): string {
  if (isAmrap) return "AMRAP";
  if (repsMin !== null && repsMax !== null) {
    if (repsMin === repsMax) return `${repsMin}`;
    return `${repsMin}-${repsMax}`;
  }
  if (repsMin !== null) return `${repsMin}`;
  if (repsMax !== null) return `${repsMax}`;
  return "-";
}

function buildTargetLabel(
  exercise: ExerciseData,
  profile: ProfileData
): string {
  const userProfile = buildUserProfile(profile);

  if (exercise.percent1rmMin || exercise.percent1rmMax) {
    const minW = calculateWeight(
      exercise.percent1rmMin,
      exercise.referenceLift,
      userProfile
    );
    const maxW = calculateWeight(
      exercise.percent1rmMax,
      exercise.referenceLift,
      userProfile
    );

    if (minW !== null && maxW !== null && minW !== maxW) {
      return `${formatWeight(minW, profile.unit)} - ${formatWeight(maxW, profile.unit)}`;
    }
    if (minW !== null) return formatWeight(minW, profile.unit);
    if (maxW !== null) return formatWeight(maxW, profile.unit);
  }

  if (exercise.rpe) return `RPE ${exercise.rpe}`;
  return "Self-select";
}

function getDefaultTargetWeight(
  exercise: ExerciseData,
  profile: ProfileData
): number | null {
  const userProfile = buildUserProfile(profile);
  // Use max percent (or min if no max) for the default input
  const pct = exercise.percent1rmMax ?? exercise.percent1rmMin;
  return calculateWeight(pct, exercise.referenceLift, userProfile);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Bar weight default: 20 kg or 45 lbs */
function getBarWeight(unit: string): number {
  return unit === "lbs" ? 45 : 20;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkoutClient({
  workout,
  week,
  exercises,
  profile,
  userId,
}: WorkoutClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const startedAtRef = useRef<string>(new Date().toISOString());
  const haptics = useHaptics();

  // -----------------------------------------------------------------------
  // Build initial set entries for all exercises
  // -----------------------------------------------------------------------
  const [setEntries, setSetEntries] = useState<
    Record<number, SetEntry[]>
  >(() => {
    const entries: Record<number, SetEntry[]> = {};
    const userProfile = buildUserProfile(profile);
    const barWeight = getBarWeight(profile.unit);

    for (const ex of exercises) {
      const sets: SetEntry[] = [];
      const defaultWeight = getDefaultTargetWeight(ex, profile);

      // Warmup sets (only for primary compounds)
      if (ex.warmupSets > 0 && ex.category === "primary_compound") {
        const workingW = defaultWeight ?? 0;
        const warmups = generateWarmupPyramid(
          workingW,
          ex.warmupSets,
          barWeight,
          profile.plateIncrement
        );
        warmups.forEach((wu, i) => {
          sets.push({
            setNumber: i + 1,
            setType: "warmup",
            targetWeight: wu.weight,
            targetReps: `${wu.reps}`,
            actualWeight: wu.weight.toString(),
            actualReps: wu.reps.toString(),
            completed: false,
            workoutExerciseId: ex.workoutExerciseId,
          });
        });
      }

      // Working sets
      for (let s = 1; s <= ex.workingSets; s++) {
        sets.push({
          setNumber: s,
          setType: "working",
          targetWeight: defaultWeight,
          targetReps: formatReps(ex.repsMin, ex.repsMax, ex.isAmrap),
          actualWeight: defaultWeight !== null ? defaultWeight.toString() : "",
          actualReps:
            ex.repsMin !== null
              ? ex.isAmrap
                ? ""
                : (ex.repsMax ?? ex.repsMin).toString()
              : "",
          completed: false,
          workoutExerciseId: ex.workoutExerciseId,
        });
      }

      entries[ex.workoutExerciseId] = sets;
    }

    return entries;
  });

  // Coaching notes toggle state
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>(
    {}
  );

  // Rest timer state — timestamp-based so it survives background throttling
  const [restEndTime, setRestEndTime] = useState<number | null>(null);
  const restEndTimeRef = useRef<number | null>(null);
  const [restDuration, setRestDuration] = useState<number>(0);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // -----------------------------------------------------------------------
  // Notification helpers
  // -----------------------------------------------------------------------
  const requestNotificationPermission = useCallback(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const scheduleNotification = useCallback((seconds: number) => {
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    notifTimeoutRef.current = setTimeout(() => {
      new Notification("Rest Complete", {
        body: "Time to get back to your set!",
        icon: "/icons/icon-192x192.png",
        tag: "rest-timer",
      });
    }, seconds * 1000);
  }, []);

  const cancelNotification = useCallback(() => {
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
  }, []);

  // -----------------------------------------------------------------------
  // Rest timer logic — uses end timestamp, recalculates on every tick
  // -----------------------------------------------------------------------
  const startRestTimer = useCallback(
    (restMin: number | null, restMax: number | null) => {
      if (timerRef.current) clearInterval(timerRef.current);

      const min = restMin ?? 60;
      const max = restMax ?? 180;
      const duration = Math.round((min + max) / 2);
      const endTime = Date.now() + duration * 1000;

      setRestDuration(duration);
      setRestEndTime(endTime);
      restEndTimeRef.current = endTime;
      setRestRemaining(duration);

      requestNotificationPermission();
      scheduleNotification(duration);

      timerRef.current = setInterval(() => {
        const end = restEndTimeRef.current;
        if (end === null) return;
        const remaining = Math.round((end - Date.now()) / 1000);
        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          haptics.alert();
          setRestEndTime(null);
          restEndTimeRef.current = null;
          setRestRemaining(null);
        } else {
          setRestRemaining(remaining);
        }
      }, 250);
    },
    [haptics, requestNotificationPermission, scheduleNotification]
  );

  const dismissTimer = useCallback(() => {
    haptics.tap();
    if (timerRef.current) clearInterval(timerRef.current);
    cancelNotification();
    setRestEndTime(null);
    restEndTimeRef.current = null;
    setRestRemaining(null);
  }, [haptics, cancelNotification]);

  const adjustTimer = useCallback(
    (delta: number) => {
      haptics.tap();
      const prev = restEndTimeRef.current;
      if (prev === null) return;

      const newEnd = prev + delta * 1000;
      const remaining = Math.round((newEnd - Date.now()) / 1000);

      if (remaining < 1) {
        const clamped = Date.now() + 1000;
        restEndTimeRef.current = clamped;
        setRestEndTime(clamped);
        setRestRemaining(1);
      } else {
        restEndTimeRef.current = newEnd;
        setRestEndTime(newEnd);
        setRestRemaining(remaining);
      }

      cancelNotification();
      scheduleNotification(remaining < 1 ? 1 : remaining);

      setRestDuration((prev) => {
        const next = prev + delta;
        return next < 1 ? 1 : next;
      });
    },
    [haptics, cancelNotification, scheduleNotification]
  );

  // Recalculate on visibility change (user returns to app)
  useEffect(() => {
    function handleVisibility() {
      const end = restEndTimeRef.current;
      if (document.visibilityState === "visible" && end !== null) {
        const remaining = Math.round((end - Date.now()) / 1000);
        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          haptics.alert();
          setRestEndTime(null);
          restEndTimeRef.current = null;
          setRestRemaining(null);
        } else {
          setRestRemaining(remaining);
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [restEndTime, haptics]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    };
  }, []);

  // -----------------------------------------------------------------------
  // Set update handlers
  // -----------------------------------------------------------------------
  function updateSet(
    weId: number,
    index: number,
    field: "actualWeight" | "actualReps",
    value: string
  ) {
    setSetEntries((prev) => {
      const copy = { ...prev };
      const sets = [...(copy[weId] ?? [])];
      sets[index] = { ...sets[index], [field]: value };
      copy[weId] = sets;
      return copy;
    });
  }

  function toggleSetComplete(
    weId: number,
    index: number,
    exercise: ExerciseData
  ) {
    setSetEntries((prev) => {
      const copy = { ...prev };
      const sets = [...(copy[weId] ?? [])];
      const wasCompleted = sets[index].completed;
      sets[index] = { ...sets[index], completed: !wasCompleted };
      copy[weId] = sets;
      return copy;
    });

    // If marking as complete, start rest timer
    const set = setEntries[weId]?.[index];
    if (set && !set.completed) {
      haptics.success();
      startRestTimer(exercise.restMinSeconds, exercise.restMaxSeconds);
    }
  }

  function toggleNotes(weId: number) {
    haptics.tap();
    setExpandedNotes((prev) => ({ ...prev, [weId]: !prev[weId] }));
  }

  // -----------------------------------------------------------------------
  // Count completed working sets
  // -----------------------------------------------------------------------
  const totalCompletedWorkingSets = Object.values(setEntries).reduce(
    (acc, sets) =>
      acc + sets.filter((s) => s.completed && s.setType === "working").length,
    0
  );

  // -----------------------------------------------------------------------
  // Finish workout
  // -----------------------------------------------------------------------
  async function finishWorkout() {
    haptics.heavy();
    setIsSaving(true);

    try {
      // Create workout_log
      const { data: logRow, error: logErr } = await supabase
        .from("workout_log")
        .insert({
          user_id: userId,
          workout_id: workout.id,
          started_at: startedAtRef.current,
          completed_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (logErr || !logRow) {
        console.error("Failed to create workout log:", logErr);
        setIsSaving(false);
        return;
      }

      // Build set_log entries for completed working sets
      const setLogs: {
        workout_log_id: number;
        workout_exercise_id: number;
        set_number: number;
        set_type: string;
        target_weight: number | null;
        actual_weight: number | null;
        actual_reps: number | null;
        completed_at: string;
      }[] = [];

      for (const [weIdStr, sets] of Object.entries(setEntries)) {
        for (const set of sets) {
          if (!set.completed) continue;
          setLogs.push({
            workout_log_id: logRow.id,
            workout_exercise_id: Number(weIdStr),
            set_number: set.setNumber,
            set_type: set.setType,
            target_weight: set.targetWeight,
            actual_weight: set.actualWeight ? Number(set.actualWeight) : null,
            actual_reps: set.actualReps ? Number(set.actualReps) : null,
            completed_at: new Date().toISOString(),
          });
        }
      }

      if (setLogs.length > 0) {
        const { error: setErr } = await supabase
          .from("set_log")
          .insert(setLogs);
        if (setErr) {
          console.error("Failed to save set logs:", setErr);
        }
      }

      router.push(`/workout/${workout.id}/summary`);
    } catch (err) {
      console.error("Unexpected error saving workout:", err);
      setIsSaving(false);
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-dvh bg-zinc-950 pb-40">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-zinc-950/95 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="shrink-0 flex items-center justify-center w-12 h-12 rounded-lg text-zinc-400 cursor-pointer transition-colors duration-150 hover:text-zinc-100 hover:bg-card"
          >
            <ArrowLeftIcon />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold tracking-widest text-muted uppercase">
              Week {week.weekNumber} &middot; Day {workout.dayNumber}
            </p>
            <h1 className="font-display text-xl font-bold tracking-wide text-zinc-100 truncate">
              {workout.name}
            </h1>
          </div>
        </div>
      </header>

      {/* Exercise List */}
      <main className="max-w-lg mx-auto px-3 pt-6 space-y-10">
        {exercises.map((ex) => {
          const sets = setEntries[ex.workoutExerciseId] ?? [];
          const warmupSets = sets.filter((s) => s.setType === "warmup");
          const workingSets = sets.filter((s) => s.setType === "working");

          return (
            <section key={ex.workoutExerciseId}>
              {/* Exercise Header — top offset = page header h-12 (48) + py-4 (32) + border-b (1) = 81px */}
              <div className="sticky top-[81px] z-30 bg-zinc-950 px-3 pt-2 pb-2 border-b border-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {ex.supersetGroup && (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-zinc-800 text-xs font-mono font-bold text-zinc-300">
                          {ex.supersetGroup}
                          {ex.supersetOrder}
                        </span>
                      )}
                      <h2 className="font-display text-lg font-semibold tracking-wide uppercase text-zinc-100">
                        {ex.name}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400 capitalize">
                        {ex.bodyPart}
                      </span>
                      {ex.setType === "top_set" && (
                        <span className="inline-block rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-bold text-accent uppercase tracking-wider">
                          Top Set
                        </span>
                      )}
                      {ex.setType === "back_off" && (
                        <span className="inline-block rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                          Back-off
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-medium text-zinc-300">
                      {buildTargetLabel(ex, profile)}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {formatReps(ex.repsMin, ex.repsMax, ex.isAmrap)} reps
                    </p>
                  </div>
                </div>

                {/* Coaching notes */}
                {ex.notes && (
                  <button
                    type="button"
                    onClick={() => toggleNotes(ex.workoutExerciseId)}
                    className="flex items-center gap-1 mt-1 text-xs text-muted cursor-pointer transition-colors duration-150 hover:text-zinc-300"
                  >
                    <span>Notes</span>
                    {expandedNotes[ex.workoutExerciseId] ? (
                      <ChevronUpIcon />
                    ) : (
                      <ChevronDownIcon />
                    )}
                  </button>
                )}
                {ex.notes && expandedNotes[ex.workoutExerciseId] && (
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed bg-zinc-900/50 rounded px-2 py-1.5">
                    {ex.notes}
                  </p>
                )}
              </div>

              {/* Set rows */}
              <div className="px-1 pt-2 pb-4">
                {/* Warmup sets */}
                {warmupSets.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-2">
                      Warmup
                    </p>
                    <div className="space-y-2">
                      {warmupSets.map((set, idx) => (
                        <SetRow
                          key={`warmup-${idx}`}
                          set={set}
                          index={idx}
                          weId={ex.workoutExerciseId}
                          exercise={ex}
                          unit={profile.unit}
                          isWarmup
                          onUpdateSet={updateSet}
                          onToggleComplete={toggleSetComplete}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Working sets */}
                <div>
                  {warmupSets.length > 0 && (
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-2">
                      Working
                    </p>
                  )}
                  <div className="space-y-2">
                    {workingSets.map((set, idx) => {
                      const globalIdx = warmupSets.length + idx;
                      return (
                        <SetRow
                          key={`working-${idx}`}
                          set={set}
                          index={globalIdx}
                          weId={ex.workoutExerciseId}
                          exercise={ex}
                          unit={profile.unit}
                          isWarmup={false}
                          onUpdateSet={updateSet}
                          onToggleComplete={toggleSetComplete}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </main>

      {/* Bottom Bar — timer or finish button, never both */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-lg mx-auto px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {restRemaining !== null ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustTimer(-15)}
                className="shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-zinc-800 text-sm font-mono font-bold text-zinc-300 cursor-pointer transition-colors duration-150 hover:bg-zinc-700 active:scale-95"
              >
                -15
              </button>
              <div className="flex-1 relative overflow-hidden rounded-lg bg-zinc-900 h-12">
                <div
                  className="absolute inset-0 bg-accent/20 transition-all duration-1000 ease-linear"
                  style={{
                    width:
                      restDuration > 0
                        ? `${(restRemaining / restDuration) * 100}%`
                        : "0%",
                  }}
                />
                <div className="relative flex items-center justify-center h-full gap-2">
                  <span className="text-accent">
                    <TimerIcon />
                  </span>
                  <span className="font-mono text-2xl font-bold text-zinc-100">
                    {formatTime(restRemaining)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => adjustTimer(15)}
                className="shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-zinc-800 text-sm font-mono font-bold text-zinc-300 cursor-pointer transition-colors duration-150 hover:bg-zinc-700 active:scale-95"
              >
                +15
              </button>
              <button
                type="button"
                onClick={dismissTimer}
                className="shrink-0 flex items-center justify-center h-12 px-4 rounded-lg bg-accent text-sm font-bold text-white cursor-pointer transition-colors duration-150 hover:bg-accent-hover active:scale-95"
              >
                Skip
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={totalCompletedWorkingSets === 0 || isSaving}
              onClick={finishWorkout}
              className="w-full rounded-xl bg-accent py-4 text-base font-display font-bold tracking-wider text-white uppercase cursor-pointer transition-all duration-150 hover:bg-accent-hover active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isSaving ? "Saving..." : "Finish Workout"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SetRow sub-component
// ---------------------------------------------------------------------------

function SetRow({
  set,
  index,
  weId,
  exercise,
  unit,
  isWarmup,
  onUpdateSet,
  onToggleComplete,
}: {
  set: SetEntry;
  index: number;
  weId: number;
  exercise: ExerciseData;
  unit: string;
  isWarmup: boolean;
  onUpdateSet: (
    weId: number,
    index: number,
    field: "actualWeight" | "actualReps",
    value: string
  ) => void;
  onToggleComplete: (
    weId: number,
    index: number,
    exercise: ExerciseData
  ) => void;
}) {
  const label = isWarmup
    ? `W${set.setNumber}`
    : `Set ${set.setNumber}`;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg px-1.5 py-2 transition-colors duration-150 ${
        set.completed
          ? "bg-success/10"
          : isWarmup
            ? "bg-zinc-900/50"
            : "bg-zinc-900/80"
      }`}
    >
      {/* Set label */}
      <span
        className={`shrink-0 w-10 text-xs font-mono font-medium ${
          isWarmup ? "text-zinc-600" : "text-zinc-400"
        }`}
      >
        {label}
      </span>

      {/* Target info (small) */}
      <span className="shrink-0 w-14 text-[11px] text-zinc-500 font-mono truncate text-center">
        {set.targetWeight !== null
          ? `${set.targetWeight} ${unit}`
          : "-"}
      </span>

      {/* Weight input */}
      <input
        type="number"
        inputMode="decimal"
        placeholder={unit}
        value={set.actualWeight}
        onChange={(e) => onUpdateSet(weId, index, "actualWeight", e.target.value)}
        className={`flex-1 min-w-0 rounded-lg border border-border bg-zinc-950 px-2 py-2.5 font-mono text-base text-center text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-accent transition-colors duration-150 ${
          isWarmup ? "opacity-70" : ""
        }`}
      />

      {/* Reps input */}
      <input
        type="number"
        inputMode="numeric"
        placeholder="reps"
        value={set.actualReps}
        onChange={(e) => onUpdateSet(weId, index, "actualReps", e.target.value)}
        className={`flex-1 min-w-0 rounded-lg border border-border bg-zinc-950 px-2 py-2.5 font-mono text-base text-center text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-accent transition-colors duration-150 ${
          isWarmup ? "opacity-70" : ""
        }`}
      />

      {/* Complete button */}
      <button
        type="button"
        onClick={() => onToggleComplete(weId, index, exercise)}
        className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer transition-all duration-150 ${
          set.completed
            ? "bg-success text-white"
            : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
        }`}
        aria-label={set.completed ? "Undo set" : "Complete set"}
      >
        <CheckIcon size={20} />
      </button>
    </div>
  );
}
