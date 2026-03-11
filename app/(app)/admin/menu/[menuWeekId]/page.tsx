import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MenuWeekEditor } from "@/components/admin/MenuWeekEditor";
import Link from "next/link";
import { formatLunchDate, getWeekDates } from "@/lib/cutoff";

interface Props {
  params: Promise<{ menuWeekId: string }>;
}

export default async function MenuWeekPage({ params }: Props) {
  const { menuWeekId } = await params;
  const supabase = await createClient();

  const [{ data: menuWeek }, { data: menuItems }, { data: restaurants }] =
    await Promise.all([
      supabase.from("menu_weeks").select("*").eq("id", menuWeekId).single(),
      supabase
        .from("menu_items")
        .select("*")
        .eq("menu_week_id", menuWeekId)
        .order("day_of_week")
        .order("display_order"),
      supabase
        .from("restaurants")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),
    ]);

  if (!menuWeek) notFound();

  const weekDates = getWeekDates(menuWeek.week_start);

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/menu" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Menu List
        </Link>
      </div>
      <MenuWeekEditor
        menuWeek={menuWeek}
        menuItems={menuItems ?? []}
        restaurants={(restaurants ?? []) as import("@/lib/types/database.types").Restaurant[]}
        weekDates={weekDates}
      />
    </div>
  );
}
