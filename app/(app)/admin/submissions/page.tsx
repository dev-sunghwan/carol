import { createClient } from "@/lib/supabase/server";
import { formatLunchDate, getWeekStart, getWeekDates } from "@/lib/cutoff";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const statusLabels: Record<string, string> = {
  not_submitted: "Not Submitted",
  submitted: "Submitted",
  confirmed: "Confirmed",
  issue_reported: "Issue Reported",
};
const statusVariant: Record<string, "secondary" | "default" | "destructive"> = {
  not_submitted: "secondary",
  submitted: "default",
  confirmed: "default",
  issue_reported: "destructive",
};

export default async function AdminSubmissionsPage() {
  const supabase = await createClient();
  const weekStart = getWeekStart();
  const weekDates = getWeekDates(weekStart);

  const { data: submissions } = await supabase
    .from("restaurant_submission_log")
    .select("*")
    .in("order_date", weekDates);

  const { data: orderCounts } = await supabase
    .from("orders")
    .select("order_date")
    .in("order_date", weekDates)
    .neq("status", "cancelled");

  const countsByDate = (orderCounts ?? []).reduce<Record<string, number>>((acc, o) => {
    acc[o.order_date] = (acc[o.order_date] ?? 0) + 1;
    return acc;
  }, {});

  const submissionByDate = (submissions ?? []).reduce<Record<string, any>>(
    (acc, s) => { acc[s.order_date] = s; return acc; }, {}
  );

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Restaurant Submissions</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Week of {formatLunchDate(weekStart)}
      </p>

      <div className="space-y-3">
        {weekDates.map((date) => {
          const sub = submissionByDate[date];
          const status = sub?.status ?? "not_submitted";
          const count = countsByDate[date] ?? 0;

          return (
            <div key={date} className="border rounded-md bg-white p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{formatLunchDate(date)}</p>
                <p className="text-xs text-muted-foreground">{count} order{count !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant[status]}>{statusLabels[status]}</Badge>
                <Link
                  href={`/admin/submissions/${date}`}
                  className="text-xs text-blue-600 underline"
                >
                  Update →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
