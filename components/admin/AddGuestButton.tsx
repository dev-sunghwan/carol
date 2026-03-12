"use client";

import { useState } from "react";
import { addGuestOrder } from "@/lib/actions/admin/guest.actions";
import { buttonVariants } from "@/components/ui/button";

interface Props {
  date: string;
}

export function AddGuestButton({ date }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await addGuestOrder(date);
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      {loading ? "Adding…" : "+ Add Guest"}
    </button>
  );
}
