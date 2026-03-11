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

export async function setUserAllowed(
  userId: string,
  allowed: boolean
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  const { data: target } = await supabase
    .from("profiles")
    .select("is_allowed, email")
    .eq("id", userId)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ is_allowed: allowed })
    .eq("id", userId);

  if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: "user.allowlist_updated",
    targetType: "profile",
    targetId: userId,
    metadata: {
      previous: target?.is_allowed,
      new: allowed,
      target_email: target?.email,
    },
  });

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}

export async function setUserRole(
  userId: string,
  role: "user" | "admin"
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  // Prevent self-demotion
  if (userId === user.id && role !== "admin") {
    return { success: false, error: { code: "INVALID_STATUS" } };
  }

  const { data: target } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", userId)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: "user.role_updated",
    targetType: "profile",
    targetId: userId,
    metadata: { previous: target?.role, new: role, target_email: target?.email },
  });

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}

export async function updateUserProfile(
  userId: string,
  fields: { full_name?: string; phone?: string }
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  const { error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", userId);

  if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: "user.profile_updated",
    targetType: "profile",
    targetId: userId,
    metadata: fields,
  });

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}
