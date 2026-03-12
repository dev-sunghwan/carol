import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLunchDate } from "@/lib/cutoff";
import { PickupButton } from "@/components/orders/PickupButton";

function getTodayDateStr() {
  // London-timezone today
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
}

export default async function CheckinPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = getTodayDateStr();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("order_date", today)
    .neq("status", "cancelled")
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const name = profile?.full_name ?? user.email ?? "there";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Lunch Pickup</h1>
          <p className="text-gray-500 text-sm mt-1">{formatLunchDate(today)}</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hi, {name.split(" ")[0]}</CardTitle>
          </CardHeader>
          <CardContent>
            {!order && (
              <p className="text-muted-foreground text-sm">
                You don&apos;t have an active order for today.
              </p>
            )}
            {order?.status === "picked_up" && (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">✓</p>
                <p className="font-medium text-green-700">Already picked up</p>
                <p className="text-sm text-muted-foreground mt-1">Enjoy your lunch!</p>
              </div>
            )}
            {order && order.status !== "picked_up" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tap the button below to confirm you&apos;ve collected your lunch.
                </p>
                <PickupButton orderId={order.id} redirectTo="/checkin" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
