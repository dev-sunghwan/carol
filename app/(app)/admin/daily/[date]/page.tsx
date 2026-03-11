import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatLunchDate } from "@/lib/cutoff";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { DailyActionBar } from "@/components/admin/DailyActionBar";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";

interface Props {
  params: Promise<{ date: string }>;
}

export default async function AdminDailyPage({ params }: Props) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles(full_name, email), menu_items(name, restaurants(name))")
    .eq("order_date", date)
    .neq("status", "cancelled")
    .order("status")
    .order("created_at");

  const { data: submission } = await supabase
    .from("restaurant_submission_log")
    .select("*")
    .eq("order_date", date)
    .maybeSingle();

  const total = orders?.length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Daily Orders</h1>
          <p className="text-sm text-muted-foreground">{formatLunchDate(date)} · {total} order{total !== 1 ? "s" : ""}</p>
        </div>
        <ButtonLink variant="outline" size="sm" href={`/api/admin/daily-csv?date=${date}`}>Download CSV</ButtonLink>
      </div>

      <DailyActionBar date={date} orderCount={total} submissionStatus={submission?.status ?? "not_submitted"} />

      <div className="mt-4 border rounded-md bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-2 font-medium">#</th>
              <th className="text-left px-4 py-2 font-medium">Employee</th>
              <th className="text-left px-4 py-2 font-medium">Menu Item</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-muted-foreground">
                  No orders for this date.
                </td>
              </tr>
            )}
            {orders?.map((order, i) => {
              type Profile = { full_name: string | null; email: string };
              type OrderMenuItem = { name: string; restaurants: { name: string } | null };
              const profile = order.profiles as Profile | null;
              const menuItem = order.menu_items as OrderMenuItem | null;
              return (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2">
                    <p>{profile?.full_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  </td>
                  <td className="px-4 py-2">
                    <p>{menuItem?.name}</p>
                    {menuItem?.restaurants?.name && (
                      <p className="text-xs text-muted-foreground">{menuItem.restaurants.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <OrderStatusBadge status={order.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <Link href={`/admin/pickup/${date}`} className="text-blue-600 underline">
          Manage pickup / no-show for this date →
        </Link>
      </div>
    </div>
  );
}
