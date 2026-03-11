"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cancelOrder } from "@/lib/actions/order.actions";
import { useRouter } from "next/navigation";

interface CancelOrderDialogProps {
  orderId: string;
  orderDate: string;
  onCancelled?: () => void;
}

export function CancelOrderDialog({ orderId, orderDate, onCancelled }: CancelOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelOrder(orderId);
      if (result.success) {
        toast.success("Order cancelled.");
        setOpen(false);
        onCancelled?.();
        router.refresh();
      } else {
        const err = result.error;
        if (err.code === "CUTOFF_PASSED") {
          toast.error("The cutoff has passed. Submit an exception request instead.");
          setOpen(false);
          router.push(`/exception-requests/new?orderId=${orderId}&type=late_cancel`);
        } else {
          toast.error("Could not cancel order. Please try again.");
        }
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
        Cancel Order
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
          <AlertDialogDescription>
            This will cancel your lunch order for {orderDate}. This action cannot be undone
            unless you place a new order before the cutoff.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep order</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Cancelling…" : "Cancel order"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
