import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { CancelOrderDialog } from "@/components/orders/CancelOrderDialog";
import { isCutoffPassed, formatLunchDate, getCutoffLabel } from "@/lib/cutoff";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { formatDistanceToNow } from "date-fns";

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { orderId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select("*, menu_items(*, restaurants(name))")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (!order) notFound();

  const { data: exceptionRequests } = await supabase
    .from("exception_requests")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  const cutoffPassed = isCutoffPassed(order.order_date);
  const canCancel =
    !cutoffPassed && ["placed", "submitted"].includes(order.status);
  const menuItem = order.menu_items as { name: string; description: string | null; restaurants: { name: string } | null } | null;

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-4">
        <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to My Orders
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{formatLunchDate(order.order_date)}</CardTitle>
            <OrderStatusBadge status={order.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">{menuItem?.name}</p>
            {menuItem?.restaurants?.name && (
              <p className="text-xs text-muted-foreground">{menuItem.restaurants.name}</p>
            )}
            {menuItem?.description && (
              <p className="text-sm text-muted-foreground mt-1">{menuItem.description}</p>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Ordered {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</p>
            {cutoffPassed ? (
              <p className="text-amber-600">Cutoff passed — changes require admin approval</p>
            ) : (
              <p>Order cutoff: {getCutoffLabel(order.order_date)}</p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {canCancel && (
              <CancelOrderDialog
                orderId={order.id}
                orderDate={formatLunchDate(order.order_date)}
              />
            )}
            {order.status !== "cancelled" && (
              <ButtonLink variant="outline" size="sm" href={`/exception-requests/new?orderId=${order.id}&type=late_cancel`}>
                Send request to admin
              </ButtonLink>
            )}
          </div>
        </CardContent>
      </Card>

      {exceptionRequests && exceptionRequests.length > 0 && (
        <div className="mt-4">
          <h2 className="text-sm font-semibold mb-2">Exception Requests</h2>
          <div className="space-y-2">
            {exceptionRequests.map((req) => (
              <Card key={req.id} className="text-sm">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="capitalize font-medium text-xs">
                      {req.request_type.replace("_", " ")}
                    </span>
                    <span className={`text-xs capitalize ${
                      req.status === "resolved" ? "text-green-600" :
                      req.status === "rejected" ? "text-red-600" :
                      req.status === "reviewed" ? "text-blue-600" :
                      "text-muted-foreground"
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{req.reason}</p>
                  {req.resolution_note && (
                    <p className="mt-1 text-xs italic">Admin note: {req.resolution_note}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
