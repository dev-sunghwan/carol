"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
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

export async function createMenuWeek(
  weekStart: string
): Promise<ActionResult<{ menuWeekId: string }>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  const { data, error } = await supabase
    .from("menu_weeks")
    .insert({ week_start: weekStart, created_by: user.id })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: { code: "DB_ERROR", message: error?.message ?? "Unknown" } };
  }

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: "menu_week.created",
    targetType: "menu_week",
    targetId: data.id,
    metadata: { week_start: weekStart },
  });

  revalidatePath("/admin/menu");
  return { success: true, data: { menuWeekId: data.id } };
}

export async function publishMenuWeek(
  menuWeekId: string,
  publish: boolean
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  const { error } = await supabase
    .from("menu_weeks")
    .update({ is_published: publish })
    .eq("id", menuWeekId);

  if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: publish ? "menu_week.published" : "menu_week.unpublished",
    targetType: "menu_week",
    targetId: menuWeekId,
  });

  revalidatePath("/admin/menu");
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function upsertMenuItem(data: {
  id?: string;
  menuWeekId: string;
  dayOfWeek: number;
  name: string;
  description?: string;
  restaurantId?: string;
  dietaryTags?: string[];
  isAvailable?: boolean;
  displayOrder?: number;
}): Promise<ActionResult<{ menuItemId: string }>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  const payload = {
    menu_week_id: data.menuWeekId,
    day_of_week: data.dayOfWeek,
    name: data.name,
    description: data.description ?? null,
    restaurant_id: data.restaurantId ?? null,
    dietary_tags: data.dietaryTags ?? [],
    is_available: data.isAvailable ?? true,
    display_order: data.displayOrder ?? 0,
  };

  let itemId: string;

  if (data.id) {
    const { error } = await supabase
      .from("menu_items")
      .update(payload)
      .eq("id", data.id);
    if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };
    itemId = data.id;
  } else {
    const { data: inserted, error } = await supabase
      .from("menu_items")
      .insert(payload)
      .select("id")
      .single();
    if (error || !inserted) {
      return { success: false, error: { code: "DB_ERROR", message: error?.message ?? "Unknown" } };
    }
    itemId = inserted.id;
  }

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: data.id ? "menu_item.updated" : "menu_item.created",
    targetType: "menu_item",
    targetId: itemId,
    metadata: { name: data.name, day_of_week: data.dayOfWeek },
  });

  revalidatePath(`/admin/menu/${data.menuWeekId}`);
  revalidatePath("/");
  return { success: true, data: { menuItemId: itemId } };
}

export async function deleteMenuItem(menuItemId: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  // Check for existing active orders — prevent deletion if any exist
  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("menu_item_id", menuItemId)
    .neq("status", "cancelled");

  if ((count ?? 0) > 0) {
    // Soft-deactivate instead of delete
    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: false })
      .eq("id", menuItemId);
    if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };
  } else {
    const { error } = await supabase.from("menu_items").delete().eq("id", menuItemId);
    if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };
  }

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: "menu_item.deleted",
    targetType: "menu_item",
    targetId: menuItemId,
  });

  revalidatePath("/admin/menu");
  return { success: true, data: undefined };
}
