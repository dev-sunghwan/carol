import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { formatLunchDate } from "@/lib/cutoff";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { CheckinQRCode } from "@/components/admin/CheckinQRCode";
import { AddGuestButton } from "@/components/admin/AddGuestButton";
import { RemoveGuestButton } from "@/components/admin/RemoveGuestButton";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";

interface Props {
  params: Promise<{ date: string }>;
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function AdminDailyPage({ params }: Props) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, status, created_at, guest_name, profiles!orders_user_id_fkey(full_name, email)")
    .eq("order_date", date)
    .neq("status", "cancelled")
    .order("created_at");

  if (ordersError) console.error("[AdminDaily] orders query error:", ordersError);

  const total = orders?.length ?? 0;
  const prevDate = offsetDate(date, -1);
  const nextDate = offsetDate(date, 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Orders</h1>
          <div className="flex items-center gap-2 mt-1">
            <Link href={`/admin/daily/${prevDate}`} className="text-muted-foreground hover:text-foreground text-sm px-1">‹</Link>
            <span className="text-sm text-muted-foreground">
              {formatLunchDate(date)} · <span className="font-semibold text-foreground">{total} order{total !== 1 ? "s" : ""}</span>
            </span>
            <Link href={`/admin/daily/${nextDate}`} className="text-muted-foreground hover:text-foreground text-sm px-1">›</Link>
          </div>
        </div>
        <div className="flex gap-2">
          <AddGuestButton date={date} />
          <CheckinQRCode baseUrl={baseUrl} />
          <ButtonLink variant="outline" size="sm" href={`/api/admin/daily-csv?date=${date}`}>Download CSV</ButtonLink>
        </div>
      </div>

      <div className="border rounded-md bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-2 font-medium">#</th>
              <th className="text-left px-4 py-2 font-medium">Employee</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {total === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-muted-foreground">
                  No orders for this date.
                </td>
              </tr>
            )}
            {orders?.map((order, i) => {
              type Profile = { full_name: string | null; email: string };
              const isGuest = !!(order as { guest_name?: string | null }).guest_name;
              const profile = isGuest ? null : order.profiles as unknown as Profile | null;
              return (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2">
                    {isGuest ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Guest</span>
                        <RemoveGuestButton orderId={order.id} orderDate={date} />
                      </div>
                    ) : (
                      <>
                        <p>{profile?.full_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{profile?.email}</p>
                      </>
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
