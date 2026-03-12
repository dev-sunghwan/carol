"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { selfPickup } from "@/lib/actions/order.actions";

interface PickupButtonProps {
  orderId: string;
  redirectTo?: string;
  size?: "sm" | "default";
}

export function PickupButton({ orderId, redirectTo, size = "default" }: PickupButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handlePickup() {
    startTransition(async () => {
      const result = await selfPickup(orderId);
      if (result.success) {
        toast.success("Pickup confirmed!");
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      } else {
        toast.error("Could not confirm pickup. Please try again.");
      }
    });
  }

  return (
    <Button
      className="w-full"
      size={size}
      onClick={handlePickup}
      disabled={isPending}
    >
      {isPending ? "Confirming…" : "Confirm Pickup"}
    </Button>
  );
}
