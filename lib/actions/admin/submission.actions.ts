"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import type { ActionResult } from "@/lib/validation/order";
import type { SubmissionStatus } from "@/lib/types/database.types";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return null;
  return { supabase, user, adminEmail: profile.email };
}

export async function updateSubmissionStatus(
  orderDate: string,
  restaurantId: string,
  status: SubmissionStatus,
  notes?: string
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  const now = new Date().toISOString();
  const updateData: Record<string, string | null> = { status, notes: notes ?? null };

  if (status === "submitted") {
    updateData.submitted_at = now;
    updateData.submitted_by = user.id;
  }
  if (status === "confirmed") {
    updateData.confirmed_at = now;
  }

  const { error } = await supabase
    .from("restaurant_submission_log")
    .upsert(
      {
        order_date: orderDate,
        restaurant_id: restaurantId,
        ...updateData,
      },
      { onConflict: "order_date,restaurant_id" }
    );

  if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: "submission.status_updated",
    targetType: "restaurant_submission_log",
    targetId: `${orderDate}:${restaurantId}`,
    metadata: { status, order_date: orderDate },
  });

  revalidatePath(`/admin/submissions/${orderDate}`);
  revalidatePath("/admin");
  return { success: true, data: undefined };
}

// Bulk-update all placed/submitted orders for a date to "submitted" status
export async function markOrdersSubmitted(orderDate: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  const { error } = await supabase
    .from("orders")
    .update({ status: "submitted" })
    .eq("order_date", orderDate)
    .eq("status", "placed");

  if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: "orders.bulk_submitted",
    targetType: "orders",
    targetId: orderDate,
    metadata: { order_date: orderDate },
  });

  revalidatePath(`/admin/daily/${orderDate}`);
  revalidatePath("/admin");
  return { success: true, data: undefined };
}

// Mark all submitted/delivered orders as "delivered"
export async function markOrdersDelivered(orderDate: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  const { error } = await supabase
    .from("orders")
    .update({ status: "delivered" })
    .eq("order_date", orderDate)
    .eq("status", "submitted");

  if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: "orders.bulk_delivered",
    targetType: "orders",
    targetId: orderDate,
    metadata: { order_date: orderDate },
  });

  revalidatePath(`/admin/daily/${orderDate}`);
  return { success: true, data: undefined };
}
