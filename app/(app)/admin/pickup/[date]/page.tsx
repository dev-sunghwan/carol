import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatLunchDate } from "@/lib/cutoff";
import { PickupChecklist } from "@/components/admin/PickupChecklist";
import Link from "next/link";

interface Props {
  params: Promise<{ date: string }>;
}

export default async function PickupPage({ params }: Props) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles!orders_user_id_fkey(full_name, email), menu_items(name)")
    .eq("order_date", date)
    .neq("status", "cancelled")
    .order("status")
    .order("created_at");

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
          ← Admin Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Pickup & No-show</h1>
      <p className="text-sm text-muted-foreground mb-6">{formatLunchDate(date)}</p>

      <PickupChecklist orders={orders ?? []} date={date} />
    </div>
  );
}
