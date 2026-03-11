import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { formatDistanceToNow } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  reviewed: "text-blue-700 bg-blue-50 border-blue-200",
  resolved: "text-green-700 bg-green-50 border-green-200",
  rejected: "text-red-700 bg-red-50 border-red-200",
};

const typeLabels: Record<string, string> = {
  late_cancel: "Late Cancel",
  late_order: "Late Order",
  other: "Other",
};

export default async function AdminExceptionsPage() {
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("exception_requests")
    .select("*, profiles!requested_by(full_name, email), orders(order_date, menu_items(name))")
    .order("status") // pending first (alphabetical: pending > resolved > reviewed > rejected ≈ close enough)
    .order("created_at", { ascending: false });

  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const others = (requests ?? []).filter((r) => r.status !== "pending");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderRequest(req: any) {
    type ReqProfile = { full_name: string | null; email: string };
    type ReqOrder = { order_date: string; menu_items: { name: string } | null } | null;
    const profile = req.profiles as ReqProfile | null;
    const order = req.orders as ReqOrder;
    return (
      <Card key={req.id} className="text-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className={statusColors[req.status]}>
                  {req.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {typeLabels[req.request_type]}
                </span>
              </div>
              <p className="font-medium">{profile?.full_name ?? profile?.email ?? "Unknown"}</p>
              {order && (
                <p className="text-xs text-muted-foreground">
                  Order: {order.order_date} · {order.menu_items?.name}
                </p>
              )}
              <p className="text-muted-foreground mt-1 line-clamp-2">{req.reason}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
              </p>
            </div>
            <ButtonLink size="sm" variant="outline" href={`/admin/exceptions/${req.id}`}>Review</ButtonLink>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Exception Requests</h1>

      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-amber-700 mb-2">
            Pending ({pending.length})
          </h2>
          <div className="space-y-2">{pending.map(renderRequest)}</div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">
            Reviewed / Resolved
          </h2>
          <div className="space-y-2">{others.map(renderRequest)}</div>
        </div>
      )}

      {(!requests || requests.length === 0) && (
        <div className="text-center py-16 border rounded-lg bg-white text-muted-foreground">
          No exception requests.
        </div>
      )}
    </div>
  );
}
