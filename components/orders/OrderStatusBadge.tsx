import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/types/database.types";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  placed: { label: "Placed", className: "bg-blue-100 text-blue-800 border-blue-200" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-600 border-gray-200" },
  submitted: { label: "Submitted", className: "bg-purple-100 text-purple-800 border-purple-200" },
  delivered: { label: "Delivered", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  picked_up: { label: "Picked Up", className: "bg-green-100 text-green-800 border-green-200" },
  no_show_candidate: { label: "Review Needed", className: "bg-orange-100 text-orange-800 border-orange-200" },
  no_show: { label: "No-show", className: "bg-red-100 text-red-800 border-red-200" },
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
