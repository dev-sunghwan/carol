"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import {
  adminMarkPickedUp,
  markNoShowCandidate,
  confirmNoShow,
  bulkMarkNoShowCandidates,
} from "@/lib/actions/admin/pickup.actions";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/types/database.types";

interface OrderWithProfile extends Order {
  profiles: { full_name: string | null; email: string } | null;
  menu_items: { name: string } | null;
}

interface PickupChecklistProps {
  orders: OrderWithProfile[];
  date: string;
}

export function PickupChecklist({ orders, date }: PickupChecklistProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handle(action: () => Promise<{ success: boolean }>, successMsg: string) {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success(successMsg);
        router.refresh();
      } else {
        toast.error("Action failed. Please try again.");
      }
    });
  }

  const unpickedCount = orders.filter(
    (o) => !["picked_up", "no_show_candidate", "no_show", "cancelled"].includes(o.status)
  ).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-white border rounded-md">
        <span className="text-sm text-muted-foreground">
          {orders.filter((o) => o.status === "picked_up").length} / {orders.length} picked up
        </span>
        <div className="flex gap-2 ml-auto">
          {unpickedCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="text-orange-600 border-orange-600"
              disabled={isPending}
              onClick={() =>
                handle(
                  () => bulkMarkNoShowCandidates(date),
                  `${unpickedCount} orders marked as no-show candidates.`
                )
              }
            >
              Mark {unpickedCount} as No-show Candidates
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-md bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Employee</th>
              <th className="text-left px-4 py-2 font-medium">Menu Item</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-muted-foreground">
                  No orders for this date.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <p>{order.profiles?.full_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{order.profiles?.email}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {order.menu_items?.name}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1 flex-wrap">
                    {["placed", "submitted", "delivered"].includes(order.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-700 border-green-700 h-7 text-xs"
                        disabled={isPending}
                        onClick={() =>
                          handle(() => adminMarkPickedUp(order.id), "Marked as picked up.")
                        }
                      >
                        Picked Up
                      </Button>
                    )}
                    {["placed", "submitted", "delivered"].includes(order.status) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-orange-600 h-7 text-xs"
                        disabled={isPending}
                        onClick={() =>
                          handle(() => markNoShowCandidate(order.id), "Marked as no-show candidate.")
                        }
                      >
                        No-show?
                      </Button>
                    )}
                    {order.status === "no_show_candidate" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 border-green-700 h-7 text-xs"
                          disabled={isPending}
                          onClick={() =>
                            handle(() => adminMarkPickedUp(order.id), "Marked as picked up.")
                          }
                        >
                          Picked Up
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 h-7 text-xs"
                          disabled={isPending}
                          onClick={() =>
                            handle(() => confirmNoShow(order.id), "No-show confirmed.")
                          }
                        >
                          Confirm No-show
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
