import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ExceptionReviewForm } from "@/components/admin/ExceptionReviewForm";
import Link from "next/link";
import { formatLunchDate } from "@/lib/cutoff";

interface Props {
  params: Promise<{ requestId: string }>;
}

export default async function ExceptionReviewPage({ params }: Props) {
  const { requestId } = await params;
  const supabase = await createClient();

  const { data: req } = await supabase
    .from("exception_requests")
    .select("*, profiles!requested_by(full_name, email), orders(order_date, status, menu_items(name))")
    .eq("id", requestId)
    .single();

  if (!req) notFound();

  type ReqProfile = { full_name: string | null; email: string };
  type ReqOrder = { order_date: string; status: string; menu_items: { name: string } | null } | null;
  const profile = req.profiles as ReqProfile | null;
  const order = req.orders as ReqOrder;

  return (
    <div className="max-w-lg">
      <div className="mb-4">
        <Link href="/admin/exceptions" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Exception Requests
        </Link>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Exception Request</h1>
        <p className="text-sm text-muted-foreground">
          From: {profile?.full_name ?? profile?.email ?? "Unknown"}
        </p>
      </div>

      <div className="border rounded-md bg-gray-50 p-4 mb-4 text-sm space-y-1">
        <p><span className="text-muted-foreground">Type:</span> {req.request_type.replace("_", " ")}</p>
        {order && (
          <>
            <p><span className="text-muted-foreground">Order date:</span> {formatLunchDate(order.order_date)}</p>
            <p><span className="text-muted-foreground">Menu item:</span> {order.menu_items?.name}</p>
            <p><span className="text-muted-foreground">Order status:</span> {order.status}</p>
          </>
        )}
        <p className="mt-2 font-medium">Reason:</p>
        <p className="text-muted-foreground">{req.reason}</p>
      </div>

      <ExceptionReviewForm requestId={requestId} currentStatus={req.status} />
    </div>
  );
}
