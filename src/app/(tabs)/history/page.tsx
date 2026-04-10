import { Suspense } from "react";
import { getProfile } from "@/utils/supabase/server";
import { HistorySkeleton } from "@/components/skeletons";
import { HistoryData } from "./_components/history-data";

export default async function HistoryPage() {
  const profile = await getProfile();
  const unit = profile?.unit ?? "kg";

  return (
    <Suspense fallback={<HistorySkeleton />}>
      <HistoryData unit={unit} />
    </Suspense>
  );
}
