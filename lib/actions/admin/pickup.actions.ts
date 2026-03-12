"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { formatAuditDate } from "@/lib/cutoff";
import type { ActionResult } from "@/lib/validation/order";

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

export async function adminMarkPickedUp(orderId: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  const { data: order } = await supabase
    .from("orders")
    .select("order_date, status")
    .eq("id", orderId)
    .single();

  if (!order) return { success: false, error: { code: "ORDER_NOT_FOUND" } };

  const { error } = await supabase
    .from("orders")
    .update({ status: "picked_up" })
    .eq("id", orderId);

  if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: `Pickup confirmed (admin) — ${formatAuditDate(order.order_date)}`,
    targetType: "order",
    targetId: orderId,
    metadata: { date: order.order_date, by: adminEmail },
  });

  revalidatePath(`/admin/pickup/${order.order_date}`);
  return { success: true, data: undefined };
}

export async function markNoShowCandidate(orderId: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  const { data: order } = await supabase
    .from("orders")
    .select("order_date")
    .eq("id", orderId)
    .single();

  const { error } = await supabase
    .from("orders")
    .update({ status: "no_show_candidate" })
    .eq("id", orderId);

  if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: `No-show flagged — ${formatAuditDate(order?.order_date ?? "")}`,
    targetType: "order",
    targetId: orderId,
    metadata: { date: order?.order_date, by: adminEmail },
  });

  revalidatePath(`/admin/pickup/${order?.order_date}`);
  return { success: true, data: undefined };
}

export async function confirmNoShow(orderId: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  const { data: order } = await supabase
    .from("orders")
    .select("order_date")
    .eq("id", orderId)
    .single();

  const { error } = await supabase
    .from("orders")
    .update({ status: "no_show" })
    .eq("id", orderId);

  if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: `No-show confirmed — ${formatAuditDate(order?.order_date ?? "")}`,
    targetType: "order",
    targetId: orderId,
    metadata: { date: order?.order_date, by: adminEmail },
  });

  revalidatePath(`/admin/pickup/${order?.order_date}`);
  return { success: true, data: undefined };
}

export async function bulkMarkNoShowCandidates(orderDate: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  // Fetch IDs first for audit log
  const { data: candidates } = await supabase
    .from("orders")
    .select("id")
    .eq("order_date", orderDate)
    .in("status", ["delivered", "submitted", "placed"]);

  const candidateIds = (candidates ?? []).map((o) => o.id);

  if (candidateIds.length === 0) {
    return { success: true, data: undefined };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "no_show_candidate" })
    .in("id", candidateIds);

  if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: `No-show bulk flagged — ${formatAuditDate(orderDate)}`,
    targetType: "orders",
    targetId: orderDate,
    metadata: { date: orderDate, count: candidateIds.length, by: adminEmail },
  });

  revalidatePath(`/admin/pickup/${orderDate}`);
  revalidatePath("/admin");
  return { success: true, data: undefined };
}
