import { Suspense } from "react";
import { WorkoutDetailSkeleton } from "@/components/skeletons";
import { WorkoutData } from "./_components/workout-data";

export default function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<WorkoutDetailSkeleton />}>
      <WorkoutDataResolver params={params} />
    </Suspense>
  );
}

async function WorkoutDataResolver({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkoutData workoutId={Number(id)} />;
}
