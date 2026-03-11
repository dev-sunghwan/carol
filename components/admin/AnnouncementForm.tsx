"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions/announcement.actions";
import type { Announcement, AnnouncementType } from "@/lib/types/database.types";

interface AnnouncementFormProps {
  announcement?: Announcement;
}

export function AnnouncementForm({ announcement }: AnnouncementFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [body, setBody] = useState(announcement?.body ?? "");
  const [type, setType] = useState<AnnouncementType>(announcement?.type ?? "general");
  const [targetDate, setTargetDate] = useState(announcement?.target_date ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required.");
      return;
    }
    startTransition(async () => {
      if (announcement) {
        const result = await updateAnnouncement(announcement.id, {
          title: title.trim(),
          body: body.trim(),
          type,
          targetDate: targetDate || null,
        });
        if (result.success) {
          toast.success("Announcement updated.");
          router.push("/admin/announcements");
        } else {
          toast.error("Failed to update.");
        }
      } else {
        const result = await createAnnouncement({
          title: title.trim(),
          body: body.trim(),
          type,
          targetDate: targetDate || undefined,
        });
        if (result.success) {
          toast.success("Announcement posted.");
          router.push("/admin/announcements");
        } else {
          toast.error("Failed to post announcement.");
        }
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Menu change for Wednesday"
              required
            />
          </div>

          <div>
            <Label htmlFor="body">Message *</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Details of the announcement…"
              rows={4}
              required
            />
          </div>

          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as AnnouncementType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General notice</SelectItem>
                <SelectItem value="menu_change">Menu change</SelectItem>
                <SelectItem value="closure">Closure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="targetDate">Linked lunch date (optional)</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : announcement ? "Update" : "Post announcement"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
