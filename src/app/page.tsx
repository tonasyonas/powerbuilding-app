import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has completed onboarding (has 1RMs set)
  const { data: profile } = await supabase
    .from("user_profile")
    .select("squat_1rm, bench_1rm, deadlift_1rm, ohp_1rm")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.squat_1rm === null) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
