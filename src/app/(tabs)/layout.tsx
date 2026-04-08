import { getUser } from "@/utils/supabase/server";
import { BottomNav } from "@/components/bottom-nav";

export default async function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getUser(); // cached — pages reuse this result for free

  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
