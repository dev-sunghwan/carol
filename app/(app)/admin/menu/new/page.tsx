"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createMenuWeek } from "@/lib/actions/menu.actions";
import Link from "next/link";

function getNextMonday(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 1 : 8 - day;
  now.setUTCDate(now.getUTCDate() + diff);
  return now.toISOString().slice(0, 10);
}

export default function NewMenuWeekPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [weekStart, setWeekStart] = useState(getNextMonday());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weekStart) return;

    // Validate it's a Monday
    const d = new Date(weekStart + "T12:00:00Z");
    if (d.getUTCDay() !== 1) {
      toast.error("Week start must be a Monday.");
      return;
    }

    startTransition(async () => {
      const result = await createMenuWeek(weekStart);
      if (result.success) {
        toast.success("Menu week created.");
        router.push(`/admin/menu/${result.data.menuWeekId}`);
      } else {
        toast.error("Failed to create menu week. It may already exist.");
      }
    });
  }

  return (
    <div className="max-w-md">
      <div className="mb-4">
        <Link href="/admin/menu" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Menu
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create Menu Week</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="weekStart">Week Start (Monday)</Label>
              <Input
                id="weekStart"
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Must be a Monday.</p>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
