"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";

type WorkoutCard = {
  id: number;
  dayNumber: number;
  name: string;
  splitLabel: string;
  exerciseCount: number;
  status: "done" | "up-next" | "upcoming";
};

type DashboardClientProps = {
  weekNumber: number;
  splitType: string;
  weekLabel: string;
  workoutCards: WorkoutCard[];
  prevWeekId: number | null;
  nextWeekId: number | null;
  isCurrentWeek: boolean;
};

function formatSplitType(splitType: string): string {
  return splitType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#22c55e"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronLeftIcon() {
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
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
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
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

export function DashboardClient({
  weekNumber,
  splitType,
  weekLabel,
  workoutCards,
  prevWeekId,
  nextWeekId,
  isCurrentWeek,
}: DashboardClientProps) {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-zinc-950 pb-24">
      <div className="max-w-lg mx-auto px-5 pt-10">
        {/* Week Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold tracking-wider text-zinc-100">
            WEEK {weekNumber}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-block rounded-md bg-card border border-border px-2.5 py-0.5 text-xs font-medium text-muted tracking-wide">
              {formatSplitType(splitType)}
            </span>
            {!isCurrentWeek && (
              <span className="text-xs text-muted">(viewing)</span>
            )}
          </div>
        </div>

        {/* Workout Cards */}
        <div className="space-y-3">
          {workoutCards.map((card) => (
            <Link
              key={card.id}
              href={`/workout/${card.id}`}
              className={`block rounded-xl border bg-card p-4 cursor-pointer transition-all duration-150 hover:bg-card-hover ${
                card.status === "up-next"
                  ? "border-l-4 border-l-accent border-t-border border-r-border border-b-border shadow-lg shadow-accent/5"
                  : "border-border"
              } ${card.status === "done" ? "opacity-70" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted">
                      Day {card.dayNumber}
                    </span>
                    {card.status === "up-next" && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                        Up Next
                      </span>
                    )}
                  </div>
                  <h3
                    className={`font-display text-lg font-semibold tracking-wide ${
                      card.status === "done"
                        ? "text-zinc-400"
                        : "text-zinc-100"
                    }`}
                  >
                    {card.name}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {card.exerciseCount} exercise
                    {card.exerciseCount !== 1 ? "s" : ""}
                    {card.status === "done" && (
                      <span className="ml-2 text-zinc-500">&middot; Tap to redo</span>
                    )}
                  </p>
                </div>
                <div className="shrink-0 pt-1">
                  {card.status === "done" ? (
                    <CheckIcon />
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#71717a"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 6 15 12 9 18" />
                    </svg>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mt-8 py-4">
          <button
            type="button"
            disabled={!prevWeekId}
            onClick={() =>
              prevWeekId &&
              router.push(`/dashboard?week=${prevWeekId}`)
            }
            className="flex items-center gap-1 text-sm text-muted cursor-pointer transition-colors duration-150 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed min-h-[48px] px-2"
          >
            <ChevronLeftIcon />
            <span>Prev</span>
          </button>

          {!isCurrentWeek && (
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="text-xs font-medium text-accent cursor-pointer transition-colors duration-150 hover:text-accent-hover min-h-[48px] px-3 flex items-center"
            >
              Current Week
            </button>
          )}

          <button
            type="button"
            disabled={!nextWeekId}
            onClick={() =>
              nextWeekId &&
              router.push(`/dashboard?week=${nextWeekId}`)
            }
            className="flex items-center gap-1 text-sm text-muted cursor-pointer transition-colors duration-150 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed min-h-[48px] px-2"
          >
            <span>Next</span>
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
