import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function getTodayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const today = getTodayDateStr();

  const [
    { count: todayOrderCount },
    { count: pendingExceptionCount },
    { data: recentOrders },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("order_date", today)
      .neq("status", "cancelled"),
    supabase
      .from("exception_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("orders")
      .select("id, status, guest_name, profiles!orders_user_id_fkey(full_name, email)")
      .eq("order_date", today)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const noShowCandidateCount = (recentOrders ?? []).filter(
    (o) => o.status === "no_show_candidate"
  ).length;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">
        Admin Dashboard — {new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(today + "T12:00:00Z"))}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">Today&apos;s Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{todayOrderCount ?? 0}</p>
            <Link href={`/admin/daily/${today}`} className="text-xs text-blue-600 underline">
              View list →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingExceptionCount ?? 0}</p>
            {(pendingExceptionCount ?? 0) > 0 && (
              <Link href="/admin/exceptions" className="text-xs text-blue-600 underline">
                Review →
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">No-show Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{noShowCandidateCount}</p>
            {noShowCandidateCount > 0 && (
              <Link href={`/admin/pickup/${today}`} className="text-xs text-blue-600 underline">
                Review →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Today&apos;s Order List</h2>
          <Link href={`/admin/daily/${today}`} className="text-sm text-blue-600 underline">
            Full view →
          </Link>
        </div>
        {!recentOrders || recentOrders.length === 0 ? (
          <p className="text-muted-foreground text-sm">No orders today.</p>
        ) : (
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">#</th>
                  <th className="text-left px-4 py-2 font-medium">Employee</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(recentOrders as unknown as Array<{id: string; status: string; guest_name: string|null; profiles: {full_name: string|null; email: string}|null}>).map((order, i) => {
                  const profile = order.profiles;
                  const displayName = order.guest_name
                    ? "Guest"
                    : (profile?.full_name ?? profile?.email ?? "Unknown");
                  return (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-2">
                        {displayName}
                      </td>
                      <td className="px-4 py-2 capitalize">{order.status.replace(/_/g, " ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { href: `/admin/daily/${today}`, label: "Today's Orders" },
          { href: `/admin/pickup/${today}`, label: "Manage Pickup" },
          { href: "/admin/exceptions", label: "Exception Requests" },
          { href: "/admin/announcements/new", label: "Post Announcement" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="border rounded-md px-4 py-3 text-sm font-medium bg-white hover:bg-gray-50 transition-colors text-center"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
