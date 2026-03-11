"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reviewExceptionRequest } from "@/lib/actions/admin/exception.actions";
import type { ExceptionRequestStatus } from "@/lib/types/database.types";

interface ExceptionReviewFormProps {
  requestId: string;
  currentStatus: ExceptionRequestStatus;
}

export function ExceptionReviewForm({ requestId, currentStatus }: ExceptionReviewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newStatus, setNewStatus] = useState<Exclude<ExceptionRequestStatus, "pending">>("reviewed");
  const [note, setNote] = useState("");

  if (currentStatus !== "pending") {
    return (
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            This request has already been {currentStatus}.
          </p>
        </CardContent>
      </Card>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await reviewExceptionRequest(requestId, newStatus, note);
      if (result.success) {
        toast.success("Request reviewed.");
        router.push("/admin/exceptions");
      } else {
        toast.error("Failed to update request.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Review Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Resolution</Label>
            <Select
              value={newStatus}
              onValueChange={(v) => setNewStatus(v as Exclude<ExceptionRequestStatus, "pending">)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reviewed">Reviewed (pending action)</SelectItem>
                <SelectItem value="resolved">Resolved ✓</SelectItem>
                <SelectItem value="rejected">Rejected ✗</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Admin note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Explain your decision to the employee…"
              rows={3}
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Submit review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
