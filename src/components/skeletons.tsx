export function DashboardSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-8 animate-pulse">
      {/* Week header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-40 bg-border rounded" />
        <div className="h-5 w-20 bg-border rounded" />
      </div>
      <div className="h-4 w-24 bg-border rounded mb-6" />

      {/* Workout cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-28 bg-border rounded" />
              <div className="h-4 w-16 bg-border rounded" />
            </div>
            <div className="h-4 w-48 bg-border rounded mb-2" />
            <div className="h-3 w-32 bg-border rounded" />
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
            className="bg-card rounded-xl p-4 border border-border"
          >
            <div className="h-6 w-16 bg-border rounded mb-2" />
            <div className="h-3 w-20 bg-border rounded" />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="h-5 w-32 bg-border rounded mb-4" />
        <div className="h-48 w-full bg-border rounded" />
      </div>

      {/* Lift bests */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-card rounded-xl p-4 border border-border flex justify-between"
          >
            <div className="h-5 w-24 bg-border rounded" />
            <div className="h-5 w-16 bg-border rounded" />
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
            className="bg-card rounded-xl p-4 border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-32 bg-border rounded" />
              <div className="h-4 w-20 bg-border rounded" />
            </div>
            <div className="flex gap-4">
              <div className="h-3 w-16 bg-border rounded" />
              <div className="h-3 w-16 bg-border rounded" />
              <div className="h-3 w-16 bg-border rounded" />
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
        <div className="h-4 w-20 bg-border rounded mb-2" />
        <div className="h-7 w-48 bg-border rounded mb-1" />
        <div className="h-4 w-32 bg-border rounded" />
      </div>

      {/* Exercise rows */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-card rounded-xl p-4 border border-border"
          >
            <div className="h-5 w-36 bg-border rounded mb-3" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-border rounded" />
              <div className="h-3 w-3/4 bg-border rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
