import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("user_profile")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding");
  }

  // Fetch all weeks for the week selector
  const { data: weeks } = await supabase
    .from("week")
    .select("id, week_number, label")
    .order("week_number", { ascending: true });

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
      weeks={weeks ?? []}
      email={user.email ?? ""}
    />
  );
}
