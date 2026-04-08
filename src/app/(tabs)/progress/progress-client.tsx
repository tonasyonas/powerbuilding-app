"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import type { ProgressData } from "./page";

// Lazy-load Recharts components to keep bundle small
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const LineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false }
);
const Line = dynamic(
  () => import("recharts").then((mod) => mod.Line),
  { ssr: false }
);
const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import("recharts").then((mod) => mod.Bar),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
);

const LIFT_TABS = ["squat", "bench", "deadlift", "ohp"] as const;

const LIFT_DISPLAY: Record<string, string> = {
  squat: "Squat",
  bench: "Bench",
  deadlift: "Deadlift",
  ohp: "OHP",
};

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(0)}k`;
  }
  return volume.toLocaleString("en-US");
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="font-mono text-2xl font-bold text-zinc-100">{value}</p>
      {subtext && <p className="text-xs text-muted mt-0.5">{subtext}</p>}
    </div>
  );
}

export function ProgressClient({ data }: { data: ProgressData }) {
  const [selectedLift, setSelectedLift] = useState<string>("squat");

  const hasData =
    data.totalWorkouts > 0 ||
    Object.keys(data.e1rmByLift).length > 0 ||
    data.weeklyVolume.length > 0;

  if (!hasData) {
    return (
      <div className="min-h-dvh bg-zinc-950 pb-24">
        <div className="max-w-lg mx-auto px-5 pt-10">
          <h1 className="font-display text-4xl font-bold tracking-wider text-zinc-100">
            PROGRESS
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
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <p className="text-sm text-muted">
              Complete some workouts to see your progress.
            </p>
          </div>
        </div>
              </div>
    );
  }

  const e1rmData = data.e1rmByLift[selectedLift] ?? [];
  const chartData = e1rmData.map((d) => ({
    name: formatDate(d.date),
    e1rm: d.estimated1RM,
  }));

  return (
    <div className="min-h-dvh bg-zinc-950 pb-24">
      <div className="max-w-lg mx-auto px-5 pt-10">
        <h1 className="font-display text-4xl font-bold tracking-wider text-zinc-100 mb-8">
          PROGRESS
        </h1>

        {/* Section 1: Estimated 1RM Trends */}
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold tracking-wide text-zinc-300 mb-4">
            Estimated 1RM Trends
          </h2>

          {/* Lift tab selector */}
          <div className="flex rounded-lg bg-zinc-900 border border-border p-1 mb-5">
            {LIFT_TABS.map((lift) => (
              <button
                key={lift}
                type="button"
                onClick={() => setSelectedLift(lift)}
                className={`flex-1 text-center text-sm font-medium py-2 rounded-md transition-all duration-150 cursor-pointer min-h-[40px] ${
                  selectedLift === lift
                    ? "bg-accent text-white shadow-sm"
                    : "text-muted hover:text-zinc-300"
                }`}
              >
                {LIFT_DISPLAY[lift]}
              </button>
            ))}
          </div>

          {/* Line chart */}
          {chartData.length > 0 ? (
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#3f3f46"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#3f3f46" }}
                  />
                  <YAxis
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                      color: "#f4f4f5",
                      fontSize: "13px",
                    }}
                    labelStyle={{ color: "#a1a1aa" }}
                    formatter={(value) => [
                      `${value} ${data.unit}`,
                      "Est. 1RM",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="e1rm"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={{ fill: "#dc2626", r: 3 }}
                    activeDot={{ r: 5, fill: "#ef4444" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full h-56 flex items-center justify-center rounded-xl border border-border bg-card">
              <p className="text-sm text-muted">
                No {LIFT_DISPLAY[selectedLift]} data yet
              </p>
            </div>
          )}
        </section>

        {/* Section 2: Weekly Volume */}
        {data.weeklyVolume.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-lg font-semibold tracking-wide text-zinc-300 mb-4">
              Weekly Volume
            </h2>
            <div className="w-full h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.weeklyVolume}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#3f3f46"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#3f3f46" }}
                  />
                  <YAxis
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => formatVolume(v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                      color: "#f4f4f5",
                      fontSize: "13px",
                    }}
                    labelStyle={{ color: "#a1a1aa" }}
                    formatter={(value) => [
                      `${Number(value).toLocaleString("en-US")} ${data.unit}`,
                      "Volume",
                    ]}
                  />
                  <Bar
                    dataKey="totalVolume"
                    fill="#dc2626"
                    opacity={0.8}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Section 3: Quick Stats */}
        <section className="mb-6">
          <h2 className="font-display text-lg font-semibold tracking-wide text-zinc-300 mb-4">
            Quick Stats
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Workouts"
              value={data.totalWorkouts.toString()}
              subtext="completed"
            />
            <StatCard
              label="Total Volume"
              value={`${formatVolume(data.totalVolume)}`}
              subtext={data.unit}
            />
            <StatCard
              label="Streak"
              value={`${data.currentStreak}`}
              subtext={data.currentStreak === 1 ? "week" : "weeks"}
            />
            {data.liftBests.length > 0 && (
              <StatCard
                label="Best E1RM"
                value={`${Math.round(Math.max(...data.liftBests.map((b) => b.best1RM)))}`}
                subtext={`${data.liftBests.find((b) => b.best1RM === Math.max(...data.liftBests.map((lb) => lb.best1RM)))?.lift ?? ""} (${data.unit})`}
              />
            )}
          </div>

          {/* Individual lift bests */}
          {data.liftBests.length > 1 && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {data.liftBests.map((lb) => (
                <StatCard
                  key={lb.lift}
                  label={`${lb.lift} E1RM`}
                  value={`${Math.round(lb.best1RM)}`}
                  subtext={data.unit}
                />
              ))}
            </div>
          )}
        </section>
      </div>
          </div>
  );
}
