import { Suspense } from "react";
import { getUser } from "@/utils/supabase/server";
import { WorkoutDetailSkeleton } from "@/components/skeletons";
import { WorkoutData } from "./_components/workout-data";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getUser(); // auth gate (cached, redirects to /login if not authenticated)
  const { id } = await params;
  const workoutId = Number(id);

  return (
    <Suspense fallback={<WorkoutDetailSkeleton />}>
      <WorkoutData workoutId={workoutId} />
    </Suspense>
  );
}
