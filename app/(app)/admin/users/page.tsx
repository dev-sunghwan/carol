import { createClient } from "@/lib/supabase/server";
import { UserTable } from "@/components/admin/UserTable";
import { InviteUserDialog } from "@/components/admin/InviteUserDialog";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("email");

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <InviteUserDialog />
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Invite staff members directly. Invited users are automatically approved to order.
      </p>
      <UserTable users={users ?? []} />
    </div>
  );
}
