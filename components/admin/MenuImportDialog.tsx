"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DAY_LABELS: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

interface PreviewItem {
  dayOfWeek: number;
  name: string;
  description: string;
  displayOrder: number;
}

interface MenuImportDialogProps {
  restaurantId: string | null;
}

export function MenuImportDialog({ restaurantId }: MenuImportDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [weekStart, setWeekStart] = useState("");
  const [preview, setPreview] = useState<PreviewItem[] | null>(null);
  const [weekLabel, setWeekLabel] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setWeekStart("");
    setPreview(null);
    setWeekLabel(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handlePreview() {
    if (!file || !weekStart) {
      toast.error("Please select a file and week start date.");
      return;
    }

    startTransition(async () => {
      const form = new FormData();
      form.append("file", file);
      form.append("weekStart", weekStart);
      form.append("previewOnly", "true");

      const res = await fetch("/api/admin/import-menu", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to parse file.");
        return;
      }

      setPreview(data.items);
      setWeekLabel(data.weekLabel);
    });
  }

  async function handleImport() {
    if (!file || !weekStart) return;

    startTransition(async () => {
      const form = new FormData();
      form.append("file", file);
      form.append("weekStart", weekStart);
      if (restaurantId) form.append("restaurantId", restaurantId);

      const res = await fetch("/api/admin/import-menu", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Import failed.");
        return;
      }

      toast.success(`Imported ${data.itemCount} menu items.`);
      setOpen(false);
      reset();
      router.push(`/admin/menu/${data.menuWeekId}`);
      router.refresh();
    });
  }

  // Group preview items by day
  const byDay = preview
    ? preview.reduce<Record<number, PreviewItem[]>>((acc, item) => {
        if (!acc[item.dayOfWeek]) acc[item.dayOfWeek] = [];
        acc[item.dayOfWeek].push(item);
        return acc;
      }, {})
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
        Import PPTX
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[92vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Import Menu from PPTX</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* File + date inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>PPTX File</Label>
              <Input
                ref={fileRef}
                type="file"
                accept=".pptx"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setPreview(null);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label>Week Start (Monday)</Label>
              <Input
                type="date"
                value={weekStart}
                onChange={(e) => {
                  setWeekStart(e.target.value);
                  setPreview(null);
                }}
              />
            </div>
          </div>

          {/* Preview button */}
          {!preview && (
            <Button
              onClick={handlePreview}
              disabled={!file || !weekStart || isPending}
              variant="outline"
              className="w-full"
            >
              {isPending ? "Parsing…" : "Preview Parsed Menu"}
            </Button>
          )}

          {/* Preview result */}
          {byDay && (
            <div className="space-y-3">
              {weekLabel && (
                <p className="text-sm text-muted-foreground">
                  Detected: <span className="font-medium">{weekLabel}</span>
                </p>
              )}
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium w-16">Category</th>
                      {[1, 2, 3, 4, 5].map((d) => (
                        <th key={d} className="px-2 py-1.5 text-left font-medium">
                          {DAY_LABELS[d]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.max(...Object.values(byDay).map((v) => v.length)) }).map((_, rowIdx) => {
                      const label = rowIdx === 0 ? "Main" : `Side ${rowIdx}`;
                      return (
                        <tr key={rowIdx} className="border-t">
                          <td className="px-2 py-1.5 align-top font-medium text-muted-foreground whitespace-nowrap">
                            {label}
                          </td>
                          {[1, 2, 3, 4, 5].map((d) => {
                            const item = byDay[d]?.[rowIdx];
                            return (
                              <td key={d} className="px-2 py-1.5 align-top">
                                {item ? (
                                  <div>
                                    <p className="font-medium">{item.name}</p>
                                    {item.description && (
                                      <p className="text-muted-foreground">{item.description}</p>
                                    )}
                                  </div>
                                ) : null}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}
        </div>

        {/* Sticky footer — always visible */}
        {preview && (
          <div className="shrink-0 flex gap-2 justify-end pt-3 border-t mt-2">
            <Button variant="ghost" size="sm" onClick={reset} disabled={isPending}>
              Reset
            </Button>
            <Button onClick={handleImport} disabled={isPending}>
              {isPending ? "Importing…" : `Import ${preview.length} items`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
