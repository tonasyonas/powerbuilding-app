import { Suspense } from "react";
import { SummaryContent } from "./_components/summary-content";

function SummarySkeleton() {
  return (
    <div className="min-h-dvh bg-zinc-950 flex items-center justify-center px-5">
      <div className="w-full max-w-sm text-center animate-pulse">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-zinc-800" />
        </div>
        <div className="h-8 w-48 bg-zinc-800 rounded mx-auto mb-2" />
        <div className="h-4 w-32 bg-zinc-800 rounded mx-auto" />
        <div className="grid grid-cols-3 gap-3 mt-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card px-3 py-4"
            >
              <div className="h-8 w-16 bg-zinc-800 rounded mx-auto mb-1" />
              <div className="h-3 w-12 bg-zinc-800 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function SummaryResolver({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SummaryContent workoutId={Number(id)} />;
}

export default function WorkoutSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<SummarySkeleton />}>
      <SummaryResolver params={params} />
    </Suspense>
  );
}
