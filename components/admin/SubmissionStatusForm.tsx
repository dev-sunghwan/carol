"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSubmissionStatus } from "@/lib/actions/admin/submission.actions";
import type { SubmissionStatus, Restaurant } from "@/lib/types/database.types";
import { useRouter } from "next/navigation";

interface Submission {
  id: string;
  restaurant_id: string;
  status: SubmissionStatus;
  notes: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
  profiles: { full_name: string | null; email: string } | null;
}

interface SubmissionStatusFormProps {
  date: string;
  restaurants: Restaurant[];
  submissions: Submission[];
}

const STATUS_OPTIONS: { value: SubmissionStatus; label: string }[] = [
  { value: "not_submitted", label: "Not Submitted" },
  { value: "submitted", label: "Submitted to Restaurant" },
  { value: "confirmed", label: "Confirmed by Restaurant" },
  { value: "issue_reported", label: "Issue Reported" },
];

export function SubmissionStatusForm({ date, restaurants, submissions }: SubmissionStatusFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(
    submissions[0]?.restaurant_id ?? restaurants[0]?.id ?? ""
  );

  const currentSub = submissions.find((s) => s.restaurant_id === selectedRestaurantId);
  const [status, setStatus] = useState<SubmissionStatus>(currentSub?.status ?? "not_submitted");
  const [notes, setNotes] = useState(currentSub?.notes ?? "");

  function handleSave() {
    if (!selectedRestaurantId) {
      toast.error("Please select a restaurant.");
      return;
    }
    startTransition(async () => {
      const result = await updateSubmissionStatus(date, selectedRestaurantId, status, notes || undefined);
      if (result.success) {
        toast.success("Submission status updated.");
        router.refresh();
      } else {
        toast.error("Failed to update submission status.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Update Submission Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {restaurants.length > 1 && (
          <div>
            <Label>Restaurant</Label>
            <Select value={selectedRestaurantId} onValueChange={(v) => v != null && setSelectedRestaurantId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select restaurant" />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => v != null && setStatus(v as SubmissionStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Notes (optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any relevant notes about this submission…"
            rows={3}
          />
        </div>

        {currentSub?.submitted_at && (
          <p className="text-xs text-muted-foreground">
            Submitted: {new Date(currentSub.submitted_at).toLocaleString("en-GB")}
            {currentSub.profiles && ` by ${currentSub.profiles.full_name ?? currentSub.profiles.email}`}
          </p>
        )}

        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}
