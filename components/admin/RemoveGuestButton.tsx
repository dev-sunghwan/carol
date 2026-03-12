"use client";

import { useState } from "react";
import { removeGuestOrder } from "@/lib/actions/admin/guest.actions";

interface Props {
  orderId: string;
  orderDate: string;
}

export function RemoveGuestButton({ orderId, orderDate }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm("Remove this guest order?")) return;
    setLoading(true);
    await removeGuestOrder(orderId, orderDate);
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {loading ? "…" : "Remove"}
    </button>
  );
}
