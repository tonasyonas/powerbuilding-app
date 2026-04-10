"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useHaptics } from "@/hooks/use-haptics";

const LIFTS = [
  { key: "squat_1rm", label: "Squat" },
  { key: "bench_1rm", label: "Bench Press" },
  { key: "deadlift_1rm", label: "Deadlift" },
  { key: "ohp_1rm", label: "Overhead Press" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [maxes, setMaxes] = useState({
    squat_1rm: "",
    bench_1rm: "",
    deadlift_1rm: "",
    ohp_1rm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const haptics = useHaptics();

  function updateMax(key: keyof typeof maxes, value: string) {
    setMaxes((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate all fields have values
    for (const lift of LIFTS) {
      const val = maxes[lift.key];
      if (!val || Number(val) <= 0) {
        setError(`Please enter a valid ${lift.label} 1RM.`);
        return;
      }
    }

    setLoading(true);
    haptics.heavy();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated. Please sign in again.");
        return;
      }

      // Fetch Week 1 (not week_number=0 which is the optional pump day)
      const { data: firstWeek } = await supabase
        .from("week")
        .select("id")
        .eq("week_number", 1)
        .limit(1)
        .single();

      const { error: updateError } = await supabase
        .from("user_profile")
        .upsert(
          {
            user_id: user.id,
            squat_1rm: Number(maxes.squat_1rm),
            bench_1rm: Number(maxes.bench_1rm),
            deadlift_1rm: Number(maxes.deadlift_1rm),
            ohp_1rm: Number(maxes.ohp_1rm),
            unit,
            current_week_id: firstWeek?.id ?? 1,
          },
          { onConflict: "user_id" }
        );

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 py-12">
      <div className="w-full max-w-sm mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold tracking-wider text-zinc-100">
            SET YOUR MAXES
          </h1>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Enter your current one-rep maxes. These are used to calculate your
            working weights throughout the program.
          </p>
        </div>

        {/* Unit Toggle */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Unit
          </label>
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              type="button"
              onClick={() => {
                if (unit !== "kg") haptics.tap();
                setUnit("kg");
              }}
              className={`flex-1 py-3 text-sm font-semibold tracking-wide cursor-pointer transition-colors duration-150 ${
                unit === "kg"
                  ? "bg-accent text-white"
                  : "bg-card text-muted hover:text-zinc-100"
              }`}
            >
              KG
            </button>
            <button
              type="button"
              onClick={() => {
                if (unit !== "lbs") haptics.tap();
                setUnit("lbs");
              }}
              className={`flex-1 py-3 text-sm font-semibold tracking-wide cursor-pointer transition-colors duration-150 ${
                unit === "lbs"
                  ? "bg-accent text-white"
                  : "bg-card text-muted hover:text-zinc-100"
              }`}
            >
              LBS
            </button>
          </div>
        </div>

        {/* 1RM Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {LIFTS.map((lift) => (
            <div
              key={lift.key}
              className="rounded-lg border border-border bg-card p-4"
            >
              <label
                htmlFor={lift.key}
                className="block text-sm font-medium text-zinc-400 mb-2"
              >
                {lift.label}
              </label>
              <div className="flex items-baseline gap-2">
                <input
                  id={lift.key}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  required
                  value={maxes[lift.key]}
                  onChange={(e) => updateMax(lift.key, e.target.value)}
                  className="w-full rounded-lg border border-border bg-zinc-950 px-4 py-3 font-mono text-3xl font-bold text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0"
                />
                <span className="text-sm font-medium text-muted shrink-0">
                  {unit}
                </span>
              </div>
            </div>
          ))}

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-4 text-base font-semibold text-white cursor-pointer transition-colors duration-150 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? "..." : "Start Program"}
          </button>
        </form>
      </div>
    </div>
  );
}
