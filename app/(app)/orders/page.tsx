import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { CancelOrderDialog } from "@/components/orders/CancelOrderDialog";
import { isCutoffPassed, formatLunchDate, getWeekStart } from "@/lib/cutoff";
import { ButtonLink } from "@/components/ui/button-link";
import { PickupButton } from "@/components/orders/PickupButton";
import type { Order, MenuItem } from "@/lib/types/database.types";

type OrderWithMenu = Order & {
  menu_items: (MenuItem & { restaurants: { name: string } | null }) | null;
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(now);
  const weekStart = getWeekStart(now);
  const monthStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;

  const { data: allOrders } = await supabase
    .from("orders")
    .select("*, menu_items(*, restaurants(name))")
    .eq("user_id", user.id)
    .gte("order_date", monthStart)
    .order("order_date", { ascending: false });

  const orders = (allOrders ?? []) as OrderWithMenu[];

  const weekOrders = orders.filter((o) => o.order_date >= weekStart);
  const monthOrders = orders;

  function renderOrderList(list: OrderWithMenu[]) {
    if (list.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-white">
          <p>No orders found.</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {list.map((order) => {
          const canCancel =
            !isCutoffPassed(order.order_date) &&
            ["placed", "submitted"].includes(order.status);
          const cutoffPassed = isCutoffPassed(order.order_date);
          const isActive = !["cancelled", "no_show"].includes(order.status);
          const isToday = order.order_date === today;
          const canSelfPickup =
            isToday &&
            cutoffPassed &&
            ["placed", "submitted", "delivered"].includes(order.status);

          return (
            <Card key={order.id} className={order.status === "cancelled" ? "opacity-60" : ""}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-sm">
                        {formatLunchDate(order.order_date)}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {order.menu_items?.name ?? "Menu item"}
                    </p>
                    {order.menu_items?.restaurants?.name && (
                      <p className="text-xs text-muted-foreground">
                        {order.menu_items.restaurants.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isActive && canCancel && (
                      <CancelOrderDialog
                        orderId={order.id}
                        orderDate={formatLunchDate(order.order_date)}
                      />
                    )}
                    {canSelfPickup && (
                      <PickupButton orderId={order.id} size="sm" />
                    )}
                    {isActive && cutoffPassed && order.status !== "picked_up" && !canSelfPickup && (
                      <ButtonLink variant="outline" size="sm" href={`/exception-requests/new?orderId=${order.id}&type=late_cancel`}>
                        Request Help
                      </ButtonLink>
                    )}
                  </div>
                </div>

                {order.status === "placed" && isActive && (
                  <div className="mt-2">
                    <ButtonLink variant="ghost" size="sm" href={`/orders/${order.id}`} className="h-7 text-xs">View details →</ButtonLink>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">My Orders</h1>

      <Tabs defaultValue="week">
        <TabsList className="mb-4">
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>
        <TabsContent value="week">{renderOrderList(weekOrders)}</TabsContent>
        <TabsContent value="month">{renderOrderList(monthOrders)}</TabsContent>
      </Tabs>

      <div className="mt-6">
        <ButtonLink variant="outline" size="sm" href="/exception-requests/new">Submit a request to admin →</ButtonLink>
      </div>
    </div>
  );
}
