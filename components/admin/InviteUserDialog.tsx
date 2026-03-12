"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createPreregisteredUser } from "@/lib/actions/admin/user.actions";

export function InviteUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  function reset() {
    setEmail("");
    setFirstName("");
    setLastName("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    startTransition(async () => {
      const result = await createPreregisteredUser(email.trim(), fullName || undefined);
      if (!result.success) {
        const msg = (result.error as { code: string; message?: string }).message ?? result.error.code;
        toast.error(msg?.includes("already") ? "This email is already registered." : (msg ?? "Failed to create user."));
        return;
      }
      toast.success(`${email} has been registered. They can set their password on first login.`);
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger className={buttonVariants({ size: "sm" })}>
        + Add User
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="invite-email">Email <span className="text-muted-foreground">(@hanwha.com)</span></Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="name@hanwha.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
          <div className="flex gap-2">
            <div className="space-y-1 flex-1">
              <Label htmlFor="invite-firstname">First Name <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="invite-firstname"
                type="text"
                placeholder="e.g. John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1 flex-1">
              <Label htmlFor="invite-lastname">Last Name</Label>
              <Input
                id="invite-lastname"
                type="text"
                placeholder="e.g. Smith"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            No email is sent. The user sets their password on first login via "First time setup" on the login page.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending || !email}>
              {isPending ? "Adding…" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
