"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setUserAllowed, setUserRole, updateUserProfile } from "@/lib/actions/admin/user.actions";
import type { Profile } from "@/lib/types/database.types";
import { useRouter } from "next/navigation";

interface UserTableProps {
  users: Profile[];
}

interface EditState {
  first_name: string;
  last_name: string;
  phone: string;
}

export function UserTable({ users: initialUsers }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ first_name: "", last_name: "", phone: "" });
  const router = useRouter();

  function startEdit(user: Profile) {
    setEditingId(user.id);
    const nameParts = (user.full_name ?? "").split(" ");
    const lastName = nameParts.length > 1 ? nameParts.pop()! : "";
    const firstName = nameParts.join(" ");
    setEditState({
      first_name: firstName,
      last_name: lastName,
      phone: (user as any).phone ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit(userId: string) {
    startTransition(async () => {
      const fullName = [editState.first_name.trim(), editState.last_name.trim()].filter(Boolean).join(" ");
      const result = await updateUserProfile(userId, {
        full_name: fullName || undefined,
        phone: editState.phone || undefined,
      });
      if (!result.success) {
        toast.error("Failed to update profile.");
      } else {
        toast.success("Profile updated.");
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, full_name: fullName || null, phone: editState.phone || null } as any
              : u
          )
        );
        setEditingId(null);
        router.refresh();
      }
    });
  }

  function handleAllowedToggle(userId: string, current: boolean) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_allowed: !current } : u))
    );
    startTransition(async () => {
      const result = await setUserAllowed(userId, !current);
      if (!result.success) {
        toast.error("Failed to update allowlist.");
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, is_allowed: current } : u))
        );
      } else {
        toast.success(`User ${!current ? "added to" : "removed from"} allowlist.`);
        router.refresh();
      }
    });
  }

  function handleRoleChange(userId: string, role: "user" | "admin") {
    startTransition(async () => {
      const result = await setUserRole(userId, role);
      if (!result.success) {
        toast.error("Failed to update role.");
      } else {
        toast.success("Role updated.");
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role } : u))
        );
        router.refresh();
      }
    });
  }

  return (
    <div className="border rounded-md bg-white overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name / Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Allowed to Order</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No users found.
              </TableCell>
            </TableRow>
          )}
          {users.map((user) => {
            const isEditing = editingId === user.id;
            return (
              <TableRow key={user.id}>
                <TableCell>
                  {isEditing ? (
                    <div className="flex gap-1">
                      <Input
                        value={editState.first_name}
                        onChange={(e) => setEditState((s) => ({ ...s, first_name: e.target.value }))}
                        placeholder="First name"
                        className="h-7 text-sm w-24"
                      />
                      <Input
                        value={editState.last_name}
                        onChange={(e) => setEditState((s) => ({ ...s, last_name: e.target.value }))}
                        placeholder="Last name"
                        className="h-7 text-sm w-24"
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-sm">{user.full_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      value={editState.phone}
                      onChange={(e) => setEditState((s) => ({ ...s, phone: e.target.value }))}
                      placeholder="+44 7700 000000"
                      className="h-7 text-sm w-36"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {(user as any).phone ?? "—"}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(v) => handleRoleChange(user.id, v as "user" | "admin")}
                    disabled={pending || isEditing}
                  >
                    <SelectTrigger className="w-28 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={user.is_allowed}
                      onCheckedChange={() => handleAllowedToggle(user.id, user.is_allowed)}
                      disabled={pending || isEditing}
                    />
                    <Badge
                      variant={user.is_allowed ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {user.is_allowed ? "Allowed" : "Blocked"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString("en-GB")}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => saveEdit(user.id)}
                        disabled={pending}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={cancelEdit}
                        disabled={pending}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => startEdit(user)}
                      disabled={pending}
                    >
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
