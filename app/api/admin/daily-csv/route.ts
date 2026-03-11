import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const date = request.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new NextResponse("Invalid date", { status: 400 });
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles(full_name, email), menu_items(name, restaurants(name))")
    .eq("order_date", date)
    .neq("status", "cancelled")
    .order("created_at");

  if (!orders) {
    return new NextResponse("No data", { status: 404 });
  }

  const header = "Name,Email,Menu Item,Restaurant,Status\n";
  const rows = orders.map((o) => {
    type P = { full_name: string | null; email: string } | null;
    type M = { name: string; restaurants: { name: string } | null } | null;
    const p = o.profiles as P;
    const m = o.menu_items as M;
    const cols = [
      `"${p?.full_name ?? ""}"`,
      `"${p?.email ?? ""}"`,
      `"${m?.name ?? ""}"`,
      `"${m?.restaurants?.name ?? ""}"`,
      `"${o.status}"`,
    ];
    return cols.join(",");
  });

  const csv = header + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="carol-orders-${date}.csv"`,
    },
  });
}
