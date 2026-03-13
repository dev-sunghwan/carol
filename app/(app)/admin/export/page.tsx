"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function ExportPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setFrom(toDateInputValue(firstOfMonth));
    setTo(toDateInputValue(today));
  }, []);
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (!from || !to) return;
    setLoading(true);
    const url = `/api/admin/export-csv?from=${from}&to=${to}`;
    const res = await fetch(url);
    if (!res.ok) {
      alert("Export failed. No orders found or invalid date range.");
      setLoading(false);
      return;
    }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `carol-orders-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    setLoading(false);
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Export Orders</h1>

      <Card>
        <CardHeader>
          <CardTitle>Date Range Export</CardTitle>
          <CardDescription>
            Download all non-cancelled orders within the selected period as a CSV file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="date"
                value={to}
                max={to || undefined}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          <Button className="w-full" onClick={handleExport} disabled={loading || !from || !to}>
            {loading ? "Generating…" : "Download CSV"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Includes: Date, Name, Email, Menu Item, Restaurant, Status, Guest flag.
            Cancelled orders are excluded.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
