import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/utils/supabase/server";
import { getCachedWeeks } from "@/utils/cached-queries";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const [{ user }, profile, weeks] = await Promise.all([
    getUser(),
    getProfile(),
    getCachedWeeks(),
  ]);

  if (!profile) redirect("/onboarding");

  return (
    <SettingsClient
      profile={{
        id: profile.id,
        user_id: profile.user_id,
        display_name: profile.display_name,
        squat_1rm: profile.squat_1rm,
        bench_1rm: profile.bench_1rm,
        deadlift_1rm: profile.deadlift_1rm,
        ohp_1rm: profile.ohp_1rm,
        unit: profile.unit ?? "kg",
        plate_increment: profile.plate_increment,
        week_10_variant: profile.week_10_variant,
        deload_first: profile.deload_first,
        current_week_id: profile.current_week_id,
      }}
      weeks={weeks}
      email={user.email ?? ""}
    />
  );
}
