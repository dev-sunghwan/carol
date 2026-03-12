import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getWeekStart, getWeekDates, formatLunchDate } from "@/lib/cutoff";
import { WeeklyMenuGrid } from "@/components/menu/WeeklyMenuGrid";
import { AnnouncementBanner } from "@/components/shared/AnnouncementBanner";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const weekStart = getWeekStart();
  const weekEnd = (() => {
    const d = new Date(weekStart + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + 4);
    return d.toISOString().slice(0, 10);
  })();

  const [
    { data: profile },
    { data: menuWeek },
    { data: announcements },
  ] = await Promise.all([
    supabase.from("profiles").select("is_allowed").eq("id", user.id).single(),
    supabase
      .from("menu_weeks")
      .select("id, week_start, is_published")
      .eq("week_start", weekStart)
      .eq("is_published", true)
      .maybeSingle(),
    supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const menuItems = menuWeek
    ? (await supabase
        .from("menu_items")
        .select("*, restaurants(name)")
        .eq("menu_week_id", menuWeek.id)
        .eq("is_available", true)
        .order("day_of_week")
        .order("display_order")).data ?? []
    : [];

  const orders = menuWeek
    ? (await supabase
        .from("orders")
        .select("id, order_date, status, menu_item_id")
        .eq("user_id", user.id)
        .gte("order_date", weekStart)
        .lte("order_date", weekEnd)).data ?? []
    : [];

  return (
    <div>
      <AnnouncementBanner announcements={announcements ?? []} />

      {!profile?.is_allowed && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Your account is not yet on the eligibility list. Please contact an admin to request access.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">This Week&apos;s Menu</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Week of {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(weekStart + "T12:00:00Z"))}
          </p>
        </div>
      </div>

      {!menuWeek ? (
        <div className="text-center py-16 text-muted-foreground border rounded-lg bg-white">
          <p className="text-lg font-medium">No menu published for this week.</p>
          <p className="text-sm mt-1">Check back later or contact an admin.</p>
        </div>
      ) : (
        <WeeklyMenuGrid
          weekStart={weekStart}
          menuItems={menuItems as Parameters<typeof WeeklyMenuGrid>[0]["menuItems"]}
          orders={orders as unknown as import("@/lib/types/database.types").Order[]}
          isAllowed={profile?.is_allowed ?? false}
        />
      )}

      <div className="mt-6 text-center">
        <Link href="/orders" className="text-sm text-muted-foreground underline hover:text-foreground">
          View My Orders →
        </Link>
      </div>
    </div>
  );
}
