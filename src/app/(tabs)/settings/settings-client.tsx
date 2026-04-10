"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useHaptics } from "@/hooks/use-haptics";


type Week = {
  id: number;
  week_number: number;
  label: string;
};

type Profile = {
  id: number;
  user_id: string;
  display_name: string | null;
  squat_1rm: number | null;
  bench_1rm: number | null;
  deadlift_1rm: number | null;
  ohp_1rm: number | null;
  unit: "kg" | "lbs";
  plate_increment: number | null;
  week_10_variant: "A" | "B" | null;
  deload_first: boolean | null;
  current_week_id: number | null;
};

type SettingsClientProps = {
  profile: Profile;
  weeks: Week[];
  email: string;
};

const LIFTS = [
  { key: "squat_1rm" as const, label: "Squat" },
  { key: "bench_1rm" as const, label: "Bench Press" },
  { key: "deadlift_1rm" as const, label: "Deadlift" },
  { key: "ohp_1rm" as const, label: "Overhead Press" },
];

type SavedField = "profile" | "maxes" | "preferences" | "week" | null;

export function SettingsClient({ profile, weeks, email }: SettingsClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const haptics = useHaptics();

  // Profile
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");

  // 1RMs
  const [maxes, setMaxes] = useState({
    squat_1rm: profile.squat_1rm?.toString() ?? "",
    bench_1rm: profile.bench_1rm?.toString() ?? "",
    deadlift_1rm: profile.deadlift_1rm?.toString() ?? "",
    ohp_1rm: profile.ohp_1rm?.toString() ?? "",
  });

  // Preferences
  const [unit, setUnit] = useState<"kg" | "lbs">(profile.unit ?? "kg");
  const [plateIncrement, setPlateIncrement] = useState(
    profile.plate_increment?.toString() ?? "2.5"
  );
  const [week10Variant, setWeek10Variant] = useState<"A" | "B">(
    profile.week_10_variant ?? "A"
  );
  const [deloadFirst, setDeloadFirst] = useState(
    profile.deload_first ?? false
  );

  // Program position
  const [currentWeekId, setCurrentWeekId] = useState<number>(
    profile.current_week_id ?? weeks[0]?.id ?? 1
  );

  // UI state
  const [savedField, setSavedField] = useState<SavedField>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wiping, setWiping] = useState(false);

  // Fade "Saved" text after 2 seconds
  useEffect(() => {
    if (savedField) {
      const timer = setTimeout(() => setSavedField(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [savedField]);

  const showError = useCallback((msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  }, []);

  // Save profile (display name)
  async function saveProfile() {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("user_profile")
      .update({ display_name: displayName || null })
      .eq("user_id", profile.user_id);
    setSaving(false);
    if (err) {
      showError(err.message);
    } else {
      haptics.success();
      setSavedField("profile");
    }
  }

  // Save 1RMs
  async function saveMaxes() {
    setSaving(true);
    setError(null);
    for (const lift of LIFTS) {
      const val = maxes[lift.key];
      if (!val || Number(val) <= 0) {
        showError(`Please enter a valid ${lift.label} 1RM.`);
        setSaving(false);
        return;
      }
    }
    const { error: err } = await supabase
      .from("user_profile")
      .update({
        squat_1rm: Number(maxes.squat_1rm),
        bench_1rm: Number(maxes.bench_1rm),
        deadlift_1rm: Number(maxes.deadlift_1rm),
        ohp_1rm: Number(maxes.ohp_1rm),
      })
      .eq("user_id", profile.user_id);
    setSaving(false);
    if (err) {
      showError(err.message);
    } else {
      haptics.success();
      setSavedField("maxes");
    }
  }

  // Save preferences
  async function savePreferences() {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("user_profile")
      .update({
        unit,
        plate_increment: Number(plateIncrement),
        week_10_variant: week10Variant,
        deload_first: deloadFirst,
      })
      .eq("user_id", profile.user_id);
    setSaving(false);
    if (err) {
      showError(err.message);
    } else {
      haptics.success();
      setSavedField("preferences");
    }
  }

  // Change current week
  async function changeWeek(weekId: number) {
    setCurrentWeekId(weekId);
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("user_profile")
      .update({ current_week_id: weekId })
      .eq("user_id", profile.user_id);
    setSaving(false);
    if (err) {
      showError(err.message);
    } else {
      haptics.success();
      setSavedField("week");
    }
  }

  // Reset to Week 1
  async function resetToWeek1() {
    const week1 = weeks.find((w) => w.week_number === 1);
    if (week1) {
      await changeWeek(week1.id);
    }
    setShowResetConfirm(false);
  }

  // Sign out
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Wipe all data and reset
  async function handleWipe() {
    setWiping(true);
    setError(null);
    try {
      // Delete all set_logs (via workout_logs cascade)
      const { data: logs } = await supabase
        .from("workout_log")
        .select("id")
        .eq("user_id", profile.user_id);

      if (logs && logs.length > 0) {
        const logIds = logs.map((l) => l.id);
        await supabase.from("set_log").delete().in("workout_log_id", logIds);
        await supabase
          .from("workout_log")
          .delete()
          .eq("user_id", profile.user_id);
      }

      // Reset profile to defaults
      const week1 = weeks.find((w) => w.week_number === 1);
      await supabase
        .from("user_profile")
        .update({
          squat_1rm: null,
          bench_1rm: null,
          deadlift_1rm: null,
          ohp_1rm: null,
          custom_1rms: {},
          current_week_id: week1?.id ?? 1,
        })
        .eq("user_id", profile.user_id);

      setShowWipeConfirm(false);
      router.push("/onboarding");
      router.refresh();
    } catch {
      showError("Failed to wipe data.");
    } finally {
      setWiping(false);
    }
  }

  // Export data
  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const { data: workoutLogs, error: wlErr } = await supabase
        .from("workout_log")
        .select("*")
        .eq("user_id", profile.user_id);

      if (wlErr) throw wlErr;

      const logIds = (workoutLogs ?? []).map((l) => l.id);
      let setLogs: unknown[] = [];
      if (logIds.length > 0) {
        const { data: sl, error: slErr } = await supabase
          .from("set_log")
          .select("*")
          .in("workout_log_id", logIds);
        if (slErr) throw slErr;
        setLogs = sl ?? [];
      }

      const exportData = {
        exported_at: new Date().toISOString(),
        workout_logs: workoutLogs,
        set_logs: setLogs,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "powerbuilding-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showError("Failed to export data.");
    } finally {
      setExporting(false);
    }
  }

  const currentWeek = weeks.find((w) => w.id === currentWeekId);

  return (
    <div className="min-h-dvh bg-zinc-950 pb-24">
      <div className="max-w-lg mx-auto px-5 pt-10">
        {/* Page Title */}
        <h1 className="font-display text-4xl font-bold tracking-wider text-zinc-100 mb-8">
          SETTINGS
        </h1>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 transition-opacity duration-150">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* ── Section 1: Profile ── */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold tracking-wider uppercase text-zinc-100">
                Profile
              </h2>
              <SaveIndicator visible={savedField === "profile"} />
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="display-name"
                  className="block text-sm font-medium text-zinc-400 mb-1.5"
                >
                  Display Name
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-border bg-zinc-950 px-4 py-3 text-base text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-accent transition-colors duration-150"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Email
                </label>
                <div className="w-full rounded-lg border border-border bg-zinc-950/50 px-4 py-3 text-base text-muted">
                  {email}
                </div>
              </div>

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white cursor-pointer transition-colors duration-150 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </section>

          {/* ── Section 2: One-Rep Maxes ── */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold tracking-wider uppercase text-zinc-100">
                One-Rep Maxes
              </h2>
              <SaveIndicator visible={savedField === "maxes"} />
            </div>

            <div className="space-y-3">
              {LIFTS.map((lift) => (
                <div key={lift.key}>
                  <label
                    htmlFor={`settings-${lift.key}`}
                    className="block text-sm font-medium text-zinc-400 mb-1.5"
                  >
                    {lift.label}
                  </label>
                  <div className="flex items-baseline gap-2">
                    <input
                      id={`settings-${lift.key}`}
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min="0"
                      value={maxes[lift.key]}
                      onChange={(e) =>
                        setMaxes((prev) => ({
                          ...prev,
                          [lift.key]: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-zinc-950 px-4 py-3 font-mono text-2xl font-bold text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-accent transition-colors duration-150"
                      placeholder="0"
                    />
                    <span className="text-sm font-medium text-muted shrink-0 w-8">
                      {unit}
                    </span>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={saveMaxes}
                disabled={saving}
                className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white cursor-pointer transition-colors duration-150 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {saving ? "Saving..." : "Save Maxes"}
              </button>
            </div>
          </section>

          {/* ── Section 3: Preferences ── */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold tracking-wider uppercase text-zinc-100">
                Preferences
              </h2>
              <SaveIndicator visible={savedField === "preferences"} />
            </div>

            <div className="space-y-5">
              {/* Unit Toggle */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Unit
                </label>
                <div className="flex rounded-lg overflow-hidden border border-border">
                  <button
                    type="button"
                    onClick={() => { if (unit !== "kg") haptics.tap(); setUnit("kg"); }}
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
                    onClick={() => { if (unit !== "lbs") haptics.tap(); setUnit("lbs"); }}
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

              {/* Plate Increment */}
              <div>
                <label
                  htmlFor="plate-increment"
                  className="block text-sm font-medium text-zinc-400 mb-2"
                >
                  Plate Increment
                </label>
                <select
                  id="plate-increment"
                  value={plateIncrement}
                  onChange={(e) => setPlateIncrement(e.target.value)}
                  className="w-full rounded-lg border border-border bg-zinc-950 px-4 py-3 text-base text-zinc-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent transition-colors duration-150 appearance-none"
                >
                  <option value="1.25">1.25 {unit}</option>
                  <option value="2.5">2.5 {unit}</option>
                  <option value="5">5 {unit}</option>
                  <option value="10">10 {unit}</option>
                </select>
              </div>

              {/* Week 10 Variant */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Week 10 Variant
                </label>
                <div className="flex rounded-lg overflow-hidden border border-border">
                  <button
                    type="button"
                    onClick={() => { if (week10Variant !== "A") haptics.tap(); setWeek10Variant("A"); }}
                    className={`flex-1 py-3 text-sm font-semibold tracking-wide cursor-pointer transition-colors duration-150 ${
                      week10Variant === "A"
                        ? "bg-accent text-white"
                        : "bg-card text-muted hover:text-zinc-100"
                    }`}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (week10Variant !== "B") haptics.tap(); setWeek10Variant("B"); }}
                    className={`flex-1 py-3 text-sm font-semibold tracking-wide cursor-pointer transition-colors duration-150 ${
                      week10Variant === "B"
                        ? "bg-accent text-white"
                        : "bg-card text-muted hover:text-zinc-100"
                    }`}
                  >
                    B
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  <p className={`flex-1 text-xs ${week10Variant === "A" ? "text-zinc-400" : "text-zinc-600"}`}>
                    A = Bodybuilding focus
                  </p>
                  <p className={`flex-1 text-xs text-right ${week10Variant === "B" ? "text-zinc-400" : "text-zinc-600"}`}>
                    B = Powerlifting focus
                  </p>
                </div>
              </div>

              {/* Deload First Toggle */}
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label
                      htmlFor="deload-first"
                      className="block text-sm font-medium text-zinc-400 cursor-pointer"
                    >
                      Deload First
                    </label>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      Run deload (Week 11) before max testing (Week 10)
                    </p>
                  </div>
                  <button
                    id="deload-first"
                    type="button"
                    role="switch"
                    aria-checked={deloadFirst}
                    onClick={() => { haptics.tap(); setDeloadFirst((prev) => !prev); }}
                    className={`relative shrink-0 h-7 w-12 rounded-full cursor-pointer transition-colors duration-150 ${
                      deloadFirst ? "bg-accent" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white transition-transform duration-150 ${
                        deloadFirst ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={savePreferences}
                disabled={saving}
                className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white cursor-pointer transition-colors duration-150 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </section>

          {/* ── Section 4: Program Position ── */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold tracking-wider uppercase text-zinc-100">
                Program Position
              </h2>
              <SaveIndicator visible={savedField === "week"} />
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="current-week"
                  className="block text-sm font-medium text-zinc-400 mb-2"
                >
                  Current Week
                  {currentWeek && (
                    <span className="text-zinc-600 ml-2">
                      {currentWeek.label}
                    </span>
                  )}
                </label>
                <select
                  id="current-week"
                  value={currentWeekId}
                  onChange={(e) => changeWeek(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-zinc-950 px-4 py-3 text-base text-zinc-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent transition-colors duration-150 appearance-none"
                >
                  {weeks.map((w) => (
                    <option key={w.id} value={w.id}>
                      Week {w.week_number} &mdash; {w.label}
                    </option>
                  ))}
                </select>
              </div>

              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full rounded-lg border border-border bg-zinc-950 py-3 text-sm font-medium text-zinc-400 cursor-pointer transition-colors duration-150 hover:text-zinc-100 hover:border-zinc-500"
                >
                  Reset to Week 1
                </button>
              ) : (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <p className="text-sm text-zinc-300 mb-3">
                    This will set your current position to Week 1. Your workout
                    history will not be deleted.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { haptics.warning(); resetToWeek1(); }}
                      disabled={saving}
                      className="flex-1 rounded-lg bg-accent py-3 text-sm font-semibold text-white cursor-pointer transition-colors duration-150 hover:bg-accent-hover disabled:opacity-50"
                    >
                      Confirm Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 rounded-lg border border-border bg-zinc-950 py-3 text-sm font-medium text-zinc-400 cursor-pointer transition-colors duration-150 hover:text-zinc-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Section 5: Account ── */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold tracking-wider uppercase text-zinc-100 mb-4">
              Account
            </h2>
            <button
              type="button"
              onClick={() => { haptics.tap(); handleSignOut(); }}
              className="w-full rounded-lg border border-border bg-zinc-950 py-3 text-sm font-medium text-zinc-400 cursor-pointer transition-colors duration-150 hover:text-zinc-100 hover:border-zinc-500"
            >
              Sign Out
            </button>
          </section>

          {/* ── Section 6: Data ── */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold tracking-wider uppercase text-zinc-100 mb-4">
              Data
            </h2>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => { haptics.tap(); handleExport(); }}
                disabled={exporting}
                className="w-full rounded-lg border border-border bg-zinc-950 py-3 text-sm font-medium text-zinc-400 cursor-pointer transition-colors duration-150 hover:text-zinc-100 hover:border-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? "Exporting..." : "Export Data"}
              </button>
              <p className="text-xs text-zinc-600">
                Downloads all workout logs and set logs as JSON.
              </p>

              {!showWipeConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowWipeConfirm(true)}
                  className="w-full rounded-lg border border-red-500/30 bg-red-500/5 py-3 text-sm font-medium text-red-400 cursor-pointer transition-colors duration-150 hover:bg-red-500/10 hover:border-red-500/50"
                >
                  Wipe All Data &amp; Reset
                </button>
              ) : (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <p className="text-sm text-zinc-300 mb-1 font-medium">
                    Are you sure?
                  </p>
                  <p className="text-xs text-zinc-500 mb-4">
                    This will permanently delete all your workout logs, set
                    logs, and 1RM values. You&apos;ll be sent back to
                    onboarding to start fresh.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { haptics.warning(); handleWipe(); }}
                      disabled={wiping}
                      className="flex-1 rounded-lg bg-red-600 py-3 text-sm font-semibold text-white cursor-pointer transition-colors duration-150 hover:bg-red-500 disabled:opacity-50"
                    >
                      {wiping ? "Wiping..." : "Yes, Wipe Everything"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWipeConfirm(false)}
                      className="flex-1 rounded-lg border border-border bg-zinc-950 py-3 text-sm font-medium text-zinc-400 cursor-pointer transition-colors duration-150 hover:text-zinc-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

    </div>
  );
}

/* ── Save indicator with fade ── */
function SaveIndicator({ visible }: { visible: boolean }) {
  return (
    <span
      className={`text-xs font-medium text-success transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      Saved
    </span>
  );
}
