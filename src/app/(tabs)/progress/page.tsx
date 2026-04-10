import { Suspense } from "react";
import { ProgressSkeleton } from "@/components/skeletons";
import { ProgressData } from "./_components/progress-data";

export default function ProgressPage() {
  return (
    <Suspense fallback={<ProgressSkeleton />}>
      <ProgressData />
    </Suspense>
  );
}
