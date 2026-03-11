"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitExceptionRequest } from "@/lib/actions/order.actions";
import Link from "next/link";

export default function ExceptionRequestPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? undefined;
  const defaultType = (searchParams.get("type") as "late_cancel" | "late_order" | "other") ?? "other";

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [requestType, setRequestType] = useState<"late_cancel" | "late_order" | "other">(defaultType);
  const [reason, setReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 10) {
      toast.error("Please provide more detail (at least 10 characters).");
      return;
    }
    startTransition(async () => {
      const result = await submitExceptionRequest(requestType, reason.trim(), orderId);
      if (result.success) {
        toast.success("Your request has been sent to admin.");
        router.push("/orders");
      } else {
        toast.error("Could not submit request. Please try again.");
      }
    });
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-4">
        <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to My Orders
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send a request to admin</CardTitle>
          <CardDescription>
            Use this form to request a late cancellation, late order, or raise any other issue.
            Your request will be reviewed by an admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Request type</Label>
              <Select
                value={requestType}
                onValueChange={(v) => setRequestType(v as typeof requestType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="late_cancel">Late cancellation</SelectItem>
                  <SelectItem value="late_order">Late order</SelectItem>
                  <SelectItem value="other">Other / General help</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Reason / Details</Label>
              <Textarea
                id="reason"
                placeholder="Please describe your request or situation…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
                minLength={10}
              />
              <p className="text-xs text-muted-foreground mt-1">{reason.length} characters</p>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Submitting…" : "Submit request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
