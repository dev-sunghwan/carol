import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatLunchDate } from "@/lib/cutoff";
import { SubmissionStatusForm } from "@/components/admin/SubmissionStatusForm";
import Link from "next/link";

interface Props {
  params: Promise<{ date: string }>;
}

export default async function SubmissionDatePage({ params }: Props) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const supabase = await createClient();

  const [{ data: submissions }, { data: restaurants }, { count: orderCount }] =
    await Promise.all([
      supabase
        .from("restaurant_submission_log")
        .select("*, profiles(full_name, email)")
        .eq("order_date", date),
      supabase.from("restaurants").select("id, name").eq("is_active", true),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("order_date", date)
        .neq("status", "cancelled"),
    ]);

  return (
    <div className="max-w-lg">
      <div className="mb-4">
        <Link href="/admin/submissions" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Submissions
        </Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Submission — {formatLunchDate(date)}</h1>
      <p className="text-sm text-muted-foreground mb-6">{orderCount ?? 0} active orders</p>

      <SubmissionStatusForm
        date={date}
        restaurants={(restaurants ?? []) as import("@/lib/types/database.types").Restaurant[]}
        submissions={submissions as Parameters<typeof SubmissionStatusForm>[0]["submissions"]}
      />
    </div>
  );
}
