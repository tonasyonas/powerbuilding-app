export default function TabsLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-32 bg-zinc-800 rounded" />
        <div className="h-5 w-16 bg-zinc-800 rounded" />
      </div>

      {/* Content cards skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-24 bg-zinc-800 rounded" />
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
