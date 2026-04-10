import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/skeletons";
import { DashboardData } from "./_components/dashboard-data";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const params = await searchParams;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData weekParam={params.week} />
    </Suspense>
  );
}
