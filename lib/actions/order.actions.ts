"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { isCutoffPassed, getCutoffForDate, getWeekStart } from "@/lib/cutoff";
import type { ActionResult } from "@/lib/validation/order";

// ============================================================
// Place Order
// ============================================================
export async function placeOrder(
  menuItemId: string
): Promise<ActionResult<{ orderId: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  // Check allowlist
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, is_allowed")
    .eq("id", user.id)
    .single();

  if (!profile?.is_allowed) {
    return { success: false, error: { code: "NOT_ALLOWED" } };
  }

  // Fetch menu item + week to determine order_date
  const { data: menuItem } = await supabase
    .from("menu_items")
    .select("id, day_of_week, is_available, menu_week_id, menu_weeks(week_start)")
    .eq("id", menuItemId)
    .single();

  if (!menuItem) return { success: false, error: { code: "MENU_ITEM_NOT_FOUND" } };
  if (!menuItem.is_available) return { success: false, error: { code: "MENU_ITEM_UNAVAILABLE" } };

  // Derive the lunch date from week_start + day_of_week (1=Mon offset 0)
  const weekStart = (menuItem.menu_weeks as unknown as { week_start: string } | null)?.week_start;
  if (!weekStart) return { success: false, error: { code: "MENU_ITEM_NOT_FOUND" } };

  const weekStartDate = new Date(weekStart + "T12:00:00Z");
  weekStartDate.setUTCDate(weekStartDate.getUTCDate() + (menuItem.day_of_week - 1));
  const orderDate = weekStartDate.toISOString().slice(0, 10);

  // Cutoff check
  if (isCutoffPassed(orderDate)) {
    return {
      success: false,
      error: { code: "CUTOFF_PASSED", cutoffAt: getCutoffForDate(orderDate) },
    };
  }

  // Duplicate check (also enforced by DB EXCLUDE constraint)
  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("user_id", user.id)
    .eq("order_date", orderDate)
    .neq("status", "cancelled")
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: { code: "DUPLICATE_ORDER", existingOrderId: existing.id },
    };
  }

  // Insert order
  const { data: newOrder, error: insertError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      menu_item_id: menuItemId,
      order_date: orderDate,
      status: "placed",
    })
    .select("id")
    .single();

  if (insertError || !newOrder) {
    return { success: false, error: { code: "DB_ERROR", message: insertError?.message ?? "Unknown error" } };
  }

  await writeAuditLog({
    actorId: user.id,
    actorEmail: profile.email,
    action: "order.placed",
    targetType: "order",
    targetId: newOrder.id,
    metadata: { order_date: orderDate, menu_item_id: menuItemId },
  });

  revalidatePath("/");
  revalidatePath("/orders");
  return { success: true, data: { orderId: newOrder.id } };
}

// ============================================================
// Cancel Order
// ============================================================
export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { data: order } = await supabase
    .from("orders")
    .select("id, user_id, order_date, status")
    .eq("id", orderId)
    .single();

  if (!order) return { success: false, error: { code: "ORDER_NOT_FOUND" } };
  if (order.user_id !== user.id) return { success: false, error: { code: "NOT_OWNER" } };
  if (!["placed", "submitted"].includes(order.status)) {
    return { success: false, error: { code: "INVALID_STATUS" } };
  }

  // Cutoff check
  if (isCutoffPassed(order.order_date)) {
    return {
      success: false,
      error: { code: "CUTOFF_PASSED", cutoffAt: getCutoffForDate(order.order_date) },
    };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
    })
    .eq("id", orderId);

  if (updateError) {
    return { success: false, error: { code: "DB_ERROR", message: updateError.message } };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  await writeAuditLog({
    actorId: user.id,
    actorEmail: profile?.email ?? null,
    action: "order.cancelled",
    targetType: "order",
    targetId: orderId,
    metadata: { order_date: order.order_date },
  });

  revalidatePath("/orders");
  revalidatePath("/");
  return { success: true, data: undefined };
}

// ============================================================
// Submit Exception Request
// ============================================================
export async function submitExceptionRequest(
  requestType: "late_cancel" | "late_order" | "other",
  reason: string,
  orderId?: string
): Promise<ActionResult<{ requestId: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, is_allowed")
    .eq("id", user.id)
    .single();

  if (!profile?.is_allowed) {
    return { success: false, error: { code: "NOT_ALLOWED" } };
  }

  if (orderId) {
    const { data: order } = await supabase
      .from("orders")
      .select("user_id")
      .eq("id", orderId)
      .single();
    if (!order || order.user_id !== user.id) {
      return { success: false, error: { code: "NOT_OWNER" } };
    }
  }

  const { data: req, error: insertError } = await supabase
    .from("exception_requests")
    .insert({
      requested_by: user.id,
      order_id: orderId ?? null,
      request_type: requestType,
      reason,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !req) {
    return { success: false, error: { code: "DB_ERROR", message: insertError?.message ?? "Unknown error" } };
  }

  await writeAuditLog({
    actorId: user.id,
    actorEmail: profile.email,
    action: "exception_request.created",
    targetType: "exception_request",
    targetId: req.id,
    metadata: { request_type: requestType, order_id: orderId ?? null },
  });

  revalidatePath("/orders");
  return { success: true, data: { requestId: req.id } };
}

// ============================================================
// Self-record pickup
// ============================================================
export async function selfPickup(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { data: order } = await supabase
    .from("orders")
    .select("user_id, status")
    .eq("id", orderId)
    .single();

  if (!order) return { success: false, error: { code: "ORDER_NOT_FOUND" } };
  if (order.user_id !== user.id) return { success: false, error: { code: "NOT_OWNER" } };
  if (!["placed", "submitted", "delivered"].includes(order.status)) {
    return { success: false, error: { code: "INVALID_STATUS" } };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "picked_up" })
    .eq("id", orderId);

  if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };

  const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).single();

  await writeAuditLog({
    actorId: user.id,
    actorEmail: profile?.email ?? null,
    action: "order.picked_up",
    targetType: "order",
    targetId: orderId,
    metadata: { method: "self_check" },
  });

  revalidatePath("/orders");
  return { success: true, data: undefined };
}

// ============================================================
// Get current week menu + user's orders
// ============================================================
export async function getCurrentWeekData(weekStart?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const targetWeekStart = weekStart ?? getWeekStart();

  const { data: menuWeek } = await supabase
    .from("menu_weeks")
    .select("id, week_start, is_published")
    .eq("week_start", targetWeekStart)
    .eq("is_published", true)
    .maybeSingle();

  if (!menuWeek) return { menuWeek: null, menuItems: [], orders: [], profile: null };

  const [{ data: menuItems }, { data: orders }, { data: profile }] = await Promise.all([
    supabase
      .from("menu_items")
      .select("*, restaurants(name)")
      .eq("menu_week_id", menuWeek.id)
      .eq("is_available", true)
      .order("day_of_week")
      .order("display_order"),
    supabase
      .from("orders")
      .select("id, order_date, status, menu_item_id")
      .eq("user_id", user.id)
      .gte("order_date", targetWeekStart)
      .lte("order_date", targetWeekStart.replace(/-\d{2}$/, (m) => {
        const d = new Date(targetWeekStart + "T12:00:00Z");
        d.setUTCDate(d.getUTCDate() + 4);
        return `-${String(d.getUTCDate()).padStart(2, "0")}`;
      })),
    supabase.from("profiles").select("is_allowed").eq("id", user.id).single(),
  ]);

  return { menuWeek, menuItems: menuItems ?? [], orders: orders ?? [], profile };
}
