import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  return createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

/**
 * Cached auth check — verified via getUser() (contacts Supabase Auth).
 * Cached with React cache() so layout + page share the result within
 * the same request — only one network call per request.
 */
export const getUser = cache(async () => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { user, supabase };
});

/**
 * Cached profile fetch — deduplicated across layout + page.
 */
export const getProfile = cache(async () => {
  const { user, supabase } = await getUser();
  const { data: profile } = await supabase
    .from("user_profile")
    .select("*")
    .eq("user_id", user.id)
    .single();
  return profile;
});
