"use client";

import { useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import type { WorkoutLogEntry, SetLogDetail } from "./page";

type HistoryClientProps = {
  logs: WorkoutLogEntry[];
  unit: string;
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return "--";
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffMs = end - start;
  if (diffMs <= 0) return "--";
  const totalMinutes = Math.round(diffMs / 60000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatVolume(volume: number): string {
  return volume.toLocaleString("en-US");
}

/** Group sets by exercise name, preserving order of first appearance. */
function groupSetsByExercise(
  sets: SetLogDetail[]
): { exerciseName: string; sets: SetLogDetail[] }[] {
  const grouped = new Map<string, SetLogDetail[]>();
  const order: string[] = [];

  for (const s of sets) {
    if (!grouped.has(s.exercise_name)) {
      grouped.set(s.exercise_name, []);
      order.push(s.exercise_name);
    }
    grouped.get(s.exercise_name)!.push(s);
  }

  return order.map((name) => ({
    exerciseName: name,
    sets: grouped.get(name)!,
  }));
}

function ChevronDownIcon({ expanded }: { expanded: boolean }) {
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
      className={`text-muted transition-transform duration-200 ${
        expanded ? "rotate-180" : ""
      }`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function WorkoutLogCard({
  entry,
  unit,
}: {
  entry: WorkoutLogEntry;
  unit: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const exerciseGroups = groupSetsByExercise(entry.sets);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 cursor-pointer transition-colors duration-150 hover:bg-card-hover min-h-[48px]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-semibold tracking-wide text-zinc-100 truncate">
              {entry.workout_name}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {formatDate(entry.started_at)}
            </p>
          </div>
          <div className="shrink-0 pt-1">
            <ChevronDownIcon expanded={expanded} />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#71717a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-xs text-muted">
              {formatDuration(entry.started_at, entry.completed_at)}
            </span>
          </div>
          <span className="font-mono text-sm text-zinc-300">
            {formatVolume(entry.total_volume)} {unit}
          </span>
          <span className="text-xs text-muted">
            {entry.sets_completed} sets
          </span>
        </div>
      </button>

      {expanded && entry.sets.length > 0 && (
        <div className="border-t border-border px-4 py-3 space-y-4">
          {exerciseGroups.map((group) => (
            <div key={group.exerciseName}>
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
                {group.exerciseName}
              </p>
              <div className="space-y-1">
                {group.sets.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="text-xs text-muted w-12">
                      Set {s.set_number}
                    </span>
                    <span className="font-mono text-zinc-300">
                      {s.actual_weight ?? 0}
                      {unit} x {s.actual_reps ?? 0}
                    </span>
                    {s.set_type && s.set_type !== "working" && (
                      <span className="text-[10px] uppercase tracking-wider text-muted bg-zinc-800/50 px-1.5 py-0.5 rounded">
                        {s.set_type}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HistoryClient({ logs, unit }: HistoryClientProps) {
  if (logs.length === 0) {
    return (
      <div className="min-h-dvh bg-zinc-950 pb-24">
        <div className="max-w-lg mx-auto px-5 pt-10">
          <h1 className="font-display text-4xl font-bold tracking-wider text-zinc-100">
            HISTORY
          </h1>
          <div className="mt-16 flex flex-col items-center text-center px-4">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#71717a"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-4"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-sm text-muted">
              No workouts logged yet. Start your first workout from the
              dashboard.
            </p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Group logs by week number
  const weekGroups = new Map<number, WorkoutLogEntry[]>();
  const weekLabels = new Map<number, string>();

  for (const entry of logs) {
    const wn = entry.week_number;
    if (!weekGroups.has(wn)) {
      weekGroups.set(wn, []);
      weekLabels.set(wn, entry.week_label);
    }
    weekGroups.get(wn)!.push(entry);
  }

  // Sort week numbers descending (most recent first)
  const sortedWeeks = Array.from(weekGroups.keys()).sort((a, b) => b - a);

  return (
    <div className="min-h-dvh bg-zinc-950 pb-24">
      <div className="max-w-lg mx-auto px-5 pt-10">
        <h1 className="font-display text-4xl font-bold tracking-wider text-zinc-100 mb-8">
          HISTORY
        </h1>

        <div className="space-y-8">
          {sortedWeeks.map((weekNum) => (
            <div key={weekNum}>
              <h2 className="font-display text-lg font-semibold tracking-wide text-zinc-400 mb-3">
                Week {weekNum}
              </h2>
              <div className="space-y-3">
                {weekGroups.get(weekNum)!.map((entry) => (
                  <WorkoutLogCard
                    key={entry.id}
                    entry={entry}
                    unit={unit}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
