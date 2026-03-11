"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import type { ActionResult } from "@/lib/validation/order";
import type { ExceptionRequestStatus } from "@/lib/types/database.types";

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

export async function reviewExceptionRequest(
  requestId: string,
  newStatus: Exclude<ExceptionRequestStatus, "pending">,
  resolutionNote: string
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: { code: "NOT_AUTHENTICATED" } };

  const { supabase, user, adminEmail } = ctx;

  const { data: req } = await supabase
    .from("exception_requests")
    .select("order_id, request_type, status")
    .eq("id", requestId)
    .single();

  if (!req) return { success: false, error: { code: "ORDER_NOT_FOUND" } };

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("exception_requests")
    .update({
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: now,
      resolution_note: resolutionNote,
    })
    .eq("id", requestId);

  if (updateError) {
    return { success: false, error: { code: "DB_ERROR", message: updateError.message } };
  }

  // If resolved late_cancel, also cancel the linked order (bypass cutoff)
  if (newStatus === "resolved" && req.request_type === "late_cancel" && req.order_id) {
    await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: now,
        cancelled_by: user.id,
      })
      .eq("id", req.order_id);

    await writeAuditLog({
      actorId: user.id,
      actorEmail: adminEmail,
      action: "order.cancelled",
      targetType: "order",
      targetId: req.order_id,
      metadata: { reason: "admin_resolved_exception", exception_request_id: requestId },
    });
  }

  await writeAuditLog({
    actorId: user.id,
    actorEmail: adminEmail,
    action: "exception_request.reviewed",
    targetType: "exception_request",
    targetId: requestId,
    metadata: { new_status: newStatus, resolution_note: resolutionNote },
  });

  revalidatePath("/admin/exceptions");
  revalidatePath(`/admin/exceptions/${requestId}`);
  return { success: true, data: undefined };
}
