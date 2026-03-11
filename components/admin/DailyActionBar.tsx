"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markOrdersSubmitted, markOrdersDelivered } from "@/lib/actions/admin/submission.actions";
import { useRouter } from "next/navigation";
import type { SubmissionStatus } from "@/lib/types/database.types";

interface DailyActionBarProps {
  date: string;
  orderCount: number;
  submissionStatus: SubmissionStatus;
}

const statusLabels: Record<SubmissionStatus, string> = {
  not_submitted: "Not Submitted",
  submitted: "Submitted to Restaurant",
  confirmed: "Confirmed by Restaurant",
  issue_reported: "Issue Reported",
};

const statusVariant: Record<SubmissionStatus, "secondary" | "default" | "destructive"> = {
  not_submitted: "secondary",
  submitted: "default",
  confirmed: "default",
  issue_reported: "destructive",
};

export function DailyActionBar({ date, orderCount, submissionStatus }: DailyActionBarProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleMarkSubmitted() {
    startTransition(async () => {
      const result = await markOrdersSubmitted(date);
      if (result.success) {
        toast.success("Orders marked as submitted.");
        router.refresh();
      } else {
        toast.error("Failed to update status.");
      }
    });
  }

  function handleMarkDelivered() {
    startTransition(async () => {
      const result = await markOrdersDelivered(date);
      if (result.success) {
        toast.success("Orders marked as delivered.");
        router.refresh();
      } else {
        toast.error("Failed to update status.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white border rounded-md">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Restaurant:</span>
        <Badge variant={statusVariant[submissionStatus]}>
          {statusLabels[submissionStatus]}
        </Badge>
      </div>
      <div className="flex gap-2 ml-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={handleMarkSubmitted}
          disabled={isPending || orderCount === 0}
        >
          Mark Submitted
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleMarkDelivered}
          disabled={isPending || orderCount === 0}
        >
          Mark Delivered
        </Button>
      </div>
    </div>
  );
}
