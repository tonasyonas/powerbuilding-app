import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/utils/supabase/server";
import { DashboardSkeleton } from "@/components/skeletons";
import { DashboardData } from "./_components/dashboard-data";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const [{ user }, profile, params] = await Promise.all([
    getUser(),
    getProfile(),
    searchParams,
  ]);

  if (!profile || profile.squat_1rm === null) redirect("/onboarding");

  const requestedWeekId = params.week
    ? Number(params.week)
    : profile.current_week_id;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData
        requestedWeekId={requestedWeekId}
        userId={user.id}
        profileCurrentWeekId={profile.current_week_id}
      />
    </Suspense>
  );
}
