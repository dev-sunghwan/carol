"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CutoffBadge } from "@/components/shared/CutoffBadge";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { placeOrder, cancelOrder } from "@/lib/actions/order.actions";
import type { MenuItem, Order, OrderStatus } from "@/lib/types/database.types";
import { formatLunchDate, isCutoffPassed } from "@/lib/cutoff";

interface DayLunchCardProps {
  dayName: string;
  date: string;
  menuItems: (MenuItem & { restaurants: { name: string } | null })[];
  existingOrder: Order | null;
  isAllowed: boolean;
}

const CATEGORY_LABEL = (displayOrder: number) =>
  displayOrder === 0 ? "Main" : `Side ${displayOrder}`;

export function DayLunchCard({ dayName, date, menuItems, existingOrder, isAllowed }: DayLunchCardProps) {
  const [isPending, startTransition] = useTransition();
  const [localOrder, setLocalOrder] = useState<Order | null>(existingOrder);

  const mainItem = menuItems.find((i) => i.display_order === 0) ?? menuItems[0];
  const isOrdered = !!localOrder && localOrder.status !== "cancelled";
  const activeStatus = localOrder?.status as OrderStatus | undefined;
  const cutoffPassed = isCutoffPassed(date);

  function handleOrder() {
    if (!mainItem) return;
    startTransition(async () => {
      const result = await placeOrder(mainItem.id);
      if (result.success) {
        toast.success(`Lunch ordered for ${dayName}.`);
        setLocalOrder({ id: result.data.orderId, status: "placed", order_date: date, menu_item_id: mainItem.id } as Order);
      } else {
        const err = result.error;
        if (err.code === "CUTOFF_PASSED") toast.error("The order cutoff has passed for this date.");
        else if (err.code === "DUPLICATE_ORDER") toast.error("You already have an order for this date.");
        else if (err.code === "NOT_ALLOWED") toast.error("Your account is not on the eligibility list.");
        else toast.error("Could not place order. Please try again.");
      }
    });
  }

  function handleCancel() {
    if (!localOrder) return;
    startTransition(async () => {
      const result = await cancelOrder(localOrder.id);
      if (result.success) {
        toast.success("Order cancelled.");
        setLocalOrder((prev) => prev ? { ...prev, status: "cancelled" } : null);
      } else {
        const err = result.error;
        if (err.code === "CUTOFF_PASSED") toast.error("The cutoff has passed — you cannot cancel now.");
        else toast.error("Could not cancel order.");
      }
    });
  }

  return (
    <Card className={`flex flex-col transition-all ${isOrdered ? "ring-2 ring-blue-500" : ""}`}>
      <CardContent className="pt-6 pb-3 flex-1">
        {/* Day header */}
        <div className="mb-5 text-center">
          <p className="text-xl font-bold">{dayName}</p>
          <p className="text-sm text-muted-foreground">{formatLunchDate(date)}</p>
          <div className="mt-2 flex justify-center">
            <CutoffBadge lunchDate={date} />
          </div>
        </div>

        {/* Menu items — display only */}
        {menuItems.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-6">No menu</p>
        ) : (
          <ul className="space-y-4">
            {menuItems.map((item) => (
              <li key={item.id}>
                <div className="flex items-start gap-2">
                  <Badge
                    variant={item.display_order === 0 ? "default" : "secondary"}
                    className="text-xs py-0.5 shrink-0 mt-0.5"
                  >
                    {CATEGORY_LABEL(item.display_order)}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-base font-semibold leading-snug">{item.name}</p>
                    {item.description && (
                      <p className="text-base text-muted-foreground leading-snug mt-0.5">{item.description}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {/* Single order action per day */}
      <CardFooter className="pt-2 pb-6">
        {menuItems.length === 0 ? null : isOrdered ? (
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-700 font-semibold">Ordered</span>
              {activeStatus && <OrderStatusBadge status={activeStatus} />}
            </div>
            {cutoffPassed ? (
              <p className="text-xs text-muted-foreground text-center">Cutoff passed — cannot cancel</p>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCancel}
                disabled={isPending}
              >
                {isPending ? "Cancelling…" : "Cancel Order"}
              </Button>
            )}
          </div>
        ) : cutoffPassed ? (
          <p className="text-sm text-muted-foreground italic text-center w-full">
            {isAllowed ? "Order cutoff has passed" : "Not eligible"}
          </p>
        ) : (
          <Button
            className="w-full"
            onClick={handleOrder}
            disabled={isPending || !isAllowed || !mainItem}
          >
            {isPending ? "Ordering…" : isAllowed ? "Order Lunch" : "Not eligible"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
