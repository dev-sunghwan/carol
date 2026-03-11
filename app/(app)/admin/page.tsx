import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatLunchDate } from "@/lib/cutoff";

function getTodayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const today = getTodayDateStr();

  const [
    { count: todayOrderCount },
    { count: pendingExceptionCount },
    { data: submissions },
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
      .from("restaurant_submission_log")
      .select("*")
      .eq("order_date", today),
    supabase
      .from("orders")
      .select("id, status, order_date, profiles(full_name, email), menu_items(name)")
      .eq("order_date", today)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const submissionStatus: string = (submissions as any)?.[0]?.status ?? "not_submitted";
  const submissionLabels: Record<string, string> = {
    not_submitted: "Not Submitted",
    submitted: "Submitted",
    confirmed: "Confirmed",
    issue_reported: "Issue Reported",
  };
  const submissionVariant: Record<string, "outline" | "default" | "destructive" | "secondary"> = {
    not_submitted: "secondary",
    submitted: "default",
    confirmed: "default",
    issue_reported: "destructive",
  };

  const noShowCandidateCount = (recentOrders ?? []).filter(
    (o) => o.status === "no_show_candidate"
  ).length;

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">
        Admin Dashboard — {formatLunchDate(today)}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">Today&apos;s Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{todayOrderCount ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">Restaurant Submission</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={submissionVariant[submissionStatus]}>
              {submissionLabels[submissionStatus]}
            </Badge>
            <div className="mt-2">
              <Link href={`/admin/submissions/${today}`} className="text-xs text-blue-600 underline">
                Update →
              </Link>
            </div>
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
                  <th className="text-left px-4 py-2 font-medium">Employee</th>
                  <th className="text-left px-4 py-2 font-medium">Menu Item</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(recentOrders as unknown as Array<{id: string; status: string; profiles: {full_name: string|null; email: string}|null; menu_items: {name: string}|null}>).map((order) => {
                  const profile = order.profiles;
                  const menuItem = order.menu_items;
                  return (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="px-4 py-2">
                        {profile?.full_name ?? profile?.email ?? "Unknown"}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{menuItem?.name}</td>
                      <td className="px-4 py-2 capitalize">{order.status.replace("_", " ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: `/admin/pickup/${today}`, label: "Manage Pickup" },
          { href: `/admin/submissions/${today}`, label: "Update Submission" },
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
