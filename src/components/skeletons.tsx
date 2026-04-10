export function DashboardSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-8 animate-pulse">
      {/* Week header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-40 bg-zinc-800 rounded" />
        <div className="h-5 w-20 bg-zinc-800 rounded" />
      </div>
      <div className="h-4 w-24 bg-zinc-800 rounded mb-6" />

      {/* Workout cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-zinc-900 rounded-xl p-4 border border-zinc-800"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-28 bg-zinc-800 rounded" />
              <div className="h-4 w-16 bg-zinc-800 rounded" />
            </div>
            <div className="h-4 w-48 bg-zinc-800 rounded mb-2" />
            <div className="h-3 w-32 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-8 animate-pulse">
      {/* Stat cards row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-zinc-900 rounded-xl p-4 border border-zinc-800"
          >
            <div className="h-6 w-16 bg-zinc-800 rounded mb-2" />
            <div className="h-3 w-20 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 mb-6">
        <div className="h-5 w-32 bg-zinc-800 rounded mb-4" />
        <div className="h-48 w-full bg-zinc-800 rounded" />
      </div>

      {/* Lift bests */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 flex justify-between"
          >
            <div className="h-5 w-24 bg-zinc-800 rounded" />
            <div className="h-5 w-16 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-8 animate-pulse">
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-zinc-900 rounded-xl p-4 border border-zinc-800"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-32 bg-zinc-800 rounded" />
              <div className="h-4 w-20 bg-zinc-800 rounded" />
            </div>
            <div className="flex gap-4">
              <div className="h-3 w-16 bg-zinc-800 rounded" />
              <div className="h-3 w-16 bg-zinc-800 rounded" />
              <div className="h-3 w-16 bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkoutDetailSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-8 animate-pulse">
      {/* Workout header */}
      <div className="mb-6">
        <div className="h-4 w-20 bg-zinc-800 rounded mb-2" />
        <div className="h-7 w-48 bg-zinc-800 rounded mb-1" />
        <div className="h-4 w-32 bg-zinc-800 rounded" />
      </div>

      {/* Exercise rows */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-zinc-900 rounded-xl p-4 border border-zinc-800"
          >
            <div className="h-5 w-36 bg-zinc-800 rounded mb-3" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-zinc-800 rounded" />
              <div className="h-3 w-3/4 bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
