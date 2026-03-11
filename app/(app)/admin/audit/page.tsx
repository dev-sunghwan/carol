import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";

export default async function AuditLogPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Audit Log</h1>
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
                <td className="px-3 py-2 font-mono">{log.action}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {log.target_type && `${log.target_type}:${log.target_id?.slice(0, 8)}`}
                </td>
                <td className="px-3 py-2 text-muted-foreground max-w-xs truncate">
                  {log.metadata ? JSON.stringify(log.metadata) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
