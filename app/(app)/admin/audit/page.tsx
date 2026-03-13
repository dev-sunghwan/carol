import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";

const TARGET_LABELS: Record<string, string> = {
  order: "Order",
  user: "User",
  profile: "Profile",
  menu: "Menu",
  guest_order: "Guest Order",
};

const META_LABELS: Record<string, string> = {
  date: "Date",
  item: "Item",
  by: "By",
  email: "Email",
  name: "Name",
  from: "From",
  to: "To",
  access: "Access",
  count: "Count",
  type: "Type",
  order_id: "Order",
  user: "User",
};

function formatTarget(targetType: string | null): string {
  if (!targetType) return "—";
  return TARGET_LABELS[targetType] ?? targetType;
}

function formatMetadata(metadata: Record<string, unknown> | null): string {
  if (!metadata || Object.keys(metadata).length === 0) return "—";
  return Object.entries(metadata)
    .map(([k, v]) => `${META_LABELS[k] ?? k}: ${v}`)
    .join(" · ");
}

export default async function AuditLogPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Audit Log</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Last 200 entries. Read-only.
      </p>

      <div className="border rounded-md bg-white overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Time</th>
              <th className="text-left px-3 py-2 font-medium">Actor</th>
              <th className="text-left px-3 py-2 font-medium">Action</th>
              <th className="text-left px-3 py-2 font-medium">Target</th>
              <th className="text-left px-3 py-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {(!logs || logs.length === 0) && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                  No audit logs yet.
                </td>
              </tr>
            )}
            {logs?.map((log) => (
              <tr key={log.id} className="border-b last:border-0">
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{log.actor_email ?? "—"}</td>
                <td className="px-3 py-2">{log.action}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {formatTarget(log.target_type)}
                </td>
                <td className="px-3 py-2 text-muted-foreground max-w-xs">
                  {formatMetadata(log.metadata as Record<string, unknown> | null)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
