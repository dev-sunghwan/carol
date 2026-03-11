// Audit log writer — uses the service role client (bypasses RLS).
// NEVER import this in client components.
import { createAdminClient } from "@/lib/supabase/admin";

export interface AuditEntry {
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      actor_id: entry.actorId,
      actor_email: entry.actorEmail,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch (err) {
    // Audit failures must never break user-facing flows — log and continue.
    console.error("[audit] Failed to write audit log:", err);
  }
}
