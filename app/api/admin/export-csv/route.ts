import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return new NextResponse("Forbidden", { status: 403 });

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return new NextResponse("Invalid date range", { status: 400 });
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles!orders_user_id_fkey(full_name, email), menu_items(name, restaurants(name))")
    .gte("order_date", from)
    .lte("order_date", to)
    .neq("status", "cancelled")
    .order("order_date")
    .order("created_at");

  if (!orders) return new NextResponse("No data", { status: 404 });

  const header = "Date,Name,Email,Menu Item,Restaurant,Status,Guest\n";
  const rows = orders.map((o) => {
    type P = { full_name: string | null; email: string } | null;
    type M = { name: string; restaurants: { name: string } | null } | null;
    const p = o.profiles as P;
    const m = o.menu_items as M;
    const isGuest = !!o.guest_name;
    const cols = [
      `"${o.order_date}"`,
      `"${isGuest ? "Guest" : (p?.full_name ?? "")}"`,
      `"${isGuest ? "" : (p?.email ?? "")}"`,
      `"${m?.name ?? ""}"`,
      `"${m?.restaurants?.name ?? ""}"`,
      `"${o.status}"`,
      `"${isGuest ? "Yes" : "No"}"`,
    ];
    return cols.join(",");
  });

  const csv = header + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="carol-orders-${from}-to-${to}.csv"`,
    },
  });
}
