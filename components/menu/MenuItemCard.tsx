"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CutoffBadge } from "@/components/shared/CutoffBadge";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { placeOrder } from "@/lib/actions/order.actions";
import type { MenuItem, Order, OrderStatus } from "@/lib/types/database.types";

interface MenuItemCardProps {
  menuItem: MenuItem & { restaurants: { name: string } | null };
  orderDate: string;
  existingOrder: Order | null;
  isAllowed: boolean;
}

function getCategoryLabel(displayOrder: number): string {
  if (displayOrder === 0) return "Main";
  return `Side ${displayOrder}`;
}

export function MenuItemCard({ menuItem, orderDate, existingOrder, isAllowed }: MenuItemCardProps) {
  const [isPending, startTransition] = useTransition();
  const [localOrder, setLocalOrder] = useState<Order | null>(existingOrder);

  function handleOrder() {
    startTransition(async () => {
      const result = await placeOrder(menuItem.id);
      if (result.success) {
        toast.success("Order placed! See My Orders for details.");
        // Optimistic update
        setLocalOrder({ id: result.data.orderId, status: "placed" } as Order);
      } else {
        const err = result.error;
        if (err.code === "CUTOFF_PASSED") {
          toast.error("The order cutoff has passed for this date.");
        } else if (err.code === "DUPLICATE_ORDER") {
          toast.error("You already have an order for this date.");
        } else if (err.code === "NOT_ALLOWED") {
          toast.error("Your account is not currently on the eligibility list.");
        } else {
          toast.error("Could not place order. Please try again.");
        }
      }
    });
  }

  const isOrdered = !!localOrder && localOrder.status !== "cancelled";
  const activeStatus = localOrder?.status as OrderStatus | undefined;

  return (
    <Card className={`transition-all ${isOrdered ? "ring-2 ring-blue-500" : ""}`}>
      <CardContent className="pt-4 pb-2">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <Badge variant={menuItem.display_order === 0 ? "default" : "secondary"} className="text-xs py-0 shrink-0">
              {getCategoryLabel(menuItem.display_order)}
            </Badge>
            <h3 className="font-semibold text-sm leading-tight truncate">{menuItem.name}</h3>
          </div>
          {menuItem.restaurants && (
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {menuItem.restaurants.name}
            </span>
          )}
        </div>
        {menuItem.description && (
          <p className="text-xs text-muted-foreground mb-2">{menuItem.description}</p>
        )}
        {menuItem.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {menuItem.dietary_tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <CutoffBadge lunchDate={orderDate} />
      </CardContent>
      <CardFooter className="pt-0 pb-4">
        {isOrdered ? (
          <div className="flex items-center gap-2 w-full">
            <span className="text-sm text-green-700 font-medium">Ordered</span>
            {activeStatus && <OrderStatusBadge status={activeStatus} />}
          </div>
        ) : (
          <Button
            size="sm"
            className="w-full"
            onClick={handleOrder}
            disabled={isPending || !isAllowed}
          >
            {isPending ? "Ordering…" : isAllowed ? "Order" : "Not eligible"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
