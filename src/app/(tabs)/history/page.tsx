import { Suspense } from "react";
import { HistorySkeleton } from "@/components/skeletons";
import { HistoryData } from "./_components/history-data";

export default function HistoryPage() {
  return (
    <Suspense fallback={<HistorySkeleton />}>
      <HistoryData />
    </Suspense>
  );
}
