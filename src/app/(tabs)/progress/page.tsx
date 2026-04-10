import { Suspense } from "react";
import { getProfile } from "@/utils/supabase/server";
import { ProgressSkeleton } from "@/components/skeletons";
import { ProgressData } from "./_components/progress-data";

export default async function ProgressPage() {
  const profile = await getProfile();
  const unit = profile?.unit ?? "kg";

  return (
    <Suspense fallback={<ProgressSkeleton />}>
      <ProgressData unit={unit} />
    </Suspense>
  );
}
