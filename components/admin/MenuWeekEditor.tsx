"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { publishMenuWeek, upsertMenuItem, deleteMenuItem } from "@/lib/actions/menu.actions";
import type { MenuWeek, MenuItem, Restaurant } from "@/lib/types/database.types";
import { formatLunchDate } from "@/lib/cutoff";
import { useRouter } from "next/navigation";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

interface MenuWeekEditorProps {
  menuWeek: MenuWeek;
  menuItems: MenuItem[];
  restaurants: Restaurant[];
  weekDates: string[];
}

interface ItemFormState {
  dayOfWeek: number;
  name: string;
  description: string;
  restaurantId: string | null;
  editingId?: string;
}

export function MenuWeekEditor({
  menuWeek: initialMenuWeek,
  menuItems: initialItems,
  restaurants,
  weekDates,
}: MenuWeekEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [menuWeek, setMenuWeek] = useState(initialMenuWeek);
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState<ItemFormState | null>(null);

  function handlePublishToggle() {
    startTransition(async () => {
      const newPublished = !menuWeek.is_published;
      const result = await publishMenuWeek(menuWeek.id, newPublished);
      if (result.success) {
        toast.success(newPublished ? "Menu published." : "Menu unpublished.");
        setMenuWeek((prev) => ({ ...prev, is_published: newPublished }));
        router.refresh();
      } else {
        toast.error("Failed to update publish status.");
      }
    });
  }

  function openAddForm(dayOfWeek: number) {
    setForm({ dayOfWeek, name: "", description: "", restaurantId: "" });
  }

  function openEditForm(item: MenuItem) {
    setForm({
      dayOfWeek: item.day_of_week,
      name: item.name,
      description: item.description ?? "",
      restaurantId: item.restaurant_id ?? "",
      editingId: item.id,
    });
  }

  function handleSaveItem() {
    if (!form || !form.name.trim()) {
      toast.error("Menu item name is required.");
      return;
    }
    startTransition(async () => {
      const result = await upsertMenuItem({
        id: form.editingId,
        menuWeekId: menuWeek.id,
        dayOfWeek: form.dayOfWeek,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        restaurantId: form.restaurantId || undefined,
      });
      if (result.success) {
        toast.success(form.editingId ? "Item updated." : "Item added.");
        setForm(null);
        router.refresh();
      } else {
        toast.error("Failed to save menu item.");
      }
    });
  }

  function handleDelete(itemId: string) {
    startTransition(async () => {
      const result = await deleteMenuItem(itemId);
      if (result.success) {
        toast.success("Item removed.");
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      } else {
        toast.error("Failed to remove item.");
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">
            Week of {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(menuWeek.week_start + "T12:00:00Z"))}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={menuWeek.is_published ? "default" : "secondary"}>
            {menuWeek.is_published ? "Published" : "Draft"}
          </Badge>
          <Button
            variant={menuWeek.is_published ? "outline" : "default"}
            size="sm"
            onClick={handlePublishToggle}
            disabled={isPending}
          >
            {menuWeek.is_published ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {weekDates.map((date, idx) => {
          const dayOfWeek = idx + 1;
          const dayItems = items.filter((i) => i.day_of_week === dayOfWeek);

          return (
            <div key={date} className="space-y-2">
              <div className="text-center">
                <p className="text-base font-semibold">{DAY_LABELS[idx]}</p>
                <p className="text-sm text-muted-foreground">{formatLunchDate(date)}</p>
              </div>

              {dayItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-3 pb-3">
                    <p className="text-sm font-semibold">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                    )}
                    {!item.is_available && (
                      <Badge variant="secondary" className="text-xs mt-1">Unavailable</Badge>
                    )}
                    <div className="flex justify-between mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-sm"
                        onClick={() => openEditForm(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-sm text-red-600"
                        onClick={() => handleDelete(item.id)}
                        disabled={isPending}
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="w-full text-sm"
                onClick={() => openAddForm(dayOfWeek)}
              >
                + Add
              </Button>
            </div>
          );
        })}
      </div>

      {/* Inline form */}
      {form && (
        <Card className="mt-6 max-w-md">
          <CardHeader>
            <CardTitle className="text-base">
              {form.editingId ? "Edit" : "Add"} Item — {DAY_LABELS[form.dayOfWeek - 1]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => f && ({ ...f, name: e.target.value }))}
                placeholder="e.g. Bulgogi Rice Box"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => f && ({ ...f, description: e.target.value }))}
                placeholder="Optional details"
                rows={2}
              />
            </div>
            <div>
              <Label>Restaurant</Label>
              <Select
                value={form.restaurantId ?? ""}
                onValueChange={(v) => setForm((f) => f ? ({ ...f, restaurantId: v || null }) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select restaurant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {restaurants.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveItem} disabled={isPending}>
                {isPending ? "Saving…" : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setForm(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
