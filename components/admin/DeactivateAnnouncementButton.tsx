"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deactivateAnnouncement } from "@/lib/actions/announcement.actions";
import { useRouter } from "next/navigation";

export function DeactivateAnnouncementButton({ announcementId }: { announcementId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-600"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await deactivateAnnouncement(announcementId);
          if (result.success) {
            toast.success("Announcement deactivated.");
            router.refresh();
          } else {
            toast.error("Failed to deactivate.");
          }
        })
      }
    >
      {isPending ? "…" : "Deactivate"}
    </Button>
  );
}
