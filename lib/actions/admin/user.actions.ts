"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
    action: allowed ? "Access granted" : "Access revoked",
    targetType: "profile",
    targetId: userId,
    metadata: { user: target?.email, by: adminEmail },
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
    action: "Role changed",
    targetType: "profile",
    targetId: userId,
    metadata: { user: target?.email, from: target?.role, to: role, by: adminEmail },
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

  const { data: targetProfile } = await supabase.from("profiles").select("email").eq("id", userId).single();

  const { error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", userId);

  if (error) return { success: false, error: { code: "DB_ERROR", message: error.message } };

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: "Profile updated",
    targetType: "profile",
    targetId: userId,
    metadata: { user: targetProfile?.email, fields: Object.keys(fields), by: adminEmail },
  });

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}

export async function createPreregisteredUser(
  email: string,
  fullName?: string
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  if (!email.endsWith("@hanwha.com")) {
    return { success: false, error: { code: "NOT_ALLOWED" } };
  }

  const adminClient = createAdminClient();

  // Create account silently — no email sent, email pre-confirmed
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName ?? "" },
  });

  if (error) {
    return { success: false, error: { code: "DB_ERROR", message: error.message } };
  }

  // Auto-allow since admin is pre-registering them
  await adminClient
    .from("profiles")
    .update({ is_allowed: true, ...(fullName ? { full_name: fullName } : {}) })
    .eq("id", data.user.id);

  await writeAuditLog({
    actorId: ctx.user.id,
    actorEmail: ctx.adminEmail,
    action: "Account pre-registered",
    targetType: "profile",
    targetId: data.user.id,
    metadata: { user: email, name: fullName, by: ctx.adminEmail },
  });

  revalidatePath("/admin/users");
  return { success: true, data: undefined };
}
