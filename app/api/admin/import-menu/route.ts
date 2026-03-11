import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsePptxMenu } from "@/lib/pptx-parser";

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse multipart form
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const weekStart = form.get("weekStart") as string | null;
  const restaurantId = form.get("restaurantId") as string | null;
  const previewOnly = form.get("previewOnly") === "true";

  if (!file || !weekStart) {
    return NextResponse.json({ error: "Missing file or weekStart" }, { status: 400 });
  }

  // Parse PPTX
  let parsed;
  try {
    const buffer = await file.arrayBuffer();
    parsed = await parsePptxMenu(buffer);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse PPTX" },
      { status: 422 }
    );
  }

  // Preview mode — return parsed items without saving
  if (previewOnly) {
    return NextResponse.json({ items: parsed.items, weekLabel: parsed.weekLabel });
  }

  // Create menu_week
  const { data: menuWeek, error: weekError } = await supabase
    .from("menu_weeks")
    .insert({ week_start: weekStart, created_by: user.id, is_published: false })
    .select("id")
    .single();

  if (weekError || !menuWeek) {
    const msg = weekError?.message ?? "Failed to create menu week";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json(
        { error: `A menu week starting ${weekStart} already exists.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Insert menu items
  const menuItems = parsed.items.map((item) => ({
    menu_week_id: menuWeek.id,
    restaurant_id: restaurantId ?? null,
    day_of_week: item.dayOfWeek,
    name: item.name,
    description: item.description || null,
    display_order: item.displayOrder,
    is_available: true,
  }));

  const { error: itemsError } = await supabase.from("menu_items").insert(menuItems);

  if (itemsError) {
    // Rollback week
    await supabase.from("menu_weeks").delete().eq("id", menuWeek.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({
    menuWeekId: menuWeek.id,
    itemCount: menuItems.length,
    weekLabel: parsed.weekLabel,
  });
}
