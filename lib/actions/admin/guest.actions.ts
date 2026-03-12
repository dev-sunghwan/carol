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

export async function addGuestOrder(orderDate: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  const { error } = await supabase.from("orders").insert({
    user_id: user.id,
    menu_item_id: null,
    order_date: orderDate,
    status: "placed",
    guest_name: "Guest",
  });

  if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: `Guest order added — ${formatAuditDate(orderDate)}`,
    targetType: "order",
    targetId: orderDate,
    metadata: { date: orderDate, by: adminEmail },
  });

  revalidatePath(`/admin/daily/${orderDate}`);
  return { success: true, data: undefined };
}

export async function removeGuestOrder(orderId: string, orderDate: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_by: user.id })
    .eq("id", orderId)
    .not("guest_name", "is", null);

  if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: `Guest order removed — ${formatAuditDate(orderDate)}`,
    targetType: "order",
    targetId: orderId,
    metadata: { date: orderDate, by: adminEmail },
  });

  revalidatePath(`/admin/daily/${orderDate}`);
  return { success: true, data: undefined };
}
