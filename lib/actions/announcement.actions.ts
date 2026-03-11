"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import type { ActionResult } from "@/lib/validation/order";
import type { AnnouncementType } from "@/lib/types/database.types";

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

export async function createAnnouncement(data: {
  title: string;
  body: string;
  type: AnnouncementType;
  targetDate?: string;
}): Promise<ActionResult<{ announcementId: string }>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  const { data: inserted, error } = await supabase
    .from("announcements")
    .insert({
      title: data.title,
      body: data.body,
      type: data.type,
      target_date: data.targetDate ?? null,
      created_by: user.id,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { success: false, error: { code: "DB_ERROR", message: error?.message ?? "Unknown" } };
  }

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: "announcement.created",
    targetType: "announcement",
    targetId: inserted.id,
    metadata: { title: data.title, type: data.type },
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/");
  return { success: true, data: { announcementId: inserted.id } };
}

export async function updateAnnouncement(
  id: string,
  data: { title?: string; body?: string; type?: AnnouncementType; targetDate?: string | null }
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  const { error } = await supabase
    .from("announcements")
    .update({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.body !== undefined && { body: data.body }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.targetDate !== undefined && { target_date: data.targetDate }),
    })
    .eq("id", id);

  if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: "announcement.updated",
    targetType: "announcement",
    targetId: id,
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function deactivateAnnouncement(id: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  const { error } = await supabase
    .from("announcements")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: "announcement.deactivated",
    targetType: "announcement",
    targetId: id,
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/");
  return { success: true, data: undefined };
}
