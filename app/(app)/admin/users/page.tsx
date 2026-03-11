import { createClient } from "@/lib/supabase/server";
import { UserTable } from "@/components/admin/UserTable";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("email");

  return (
    <div>
      <h1 className="text-xl font-bold mb-2">User Management</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Control who can place orders (allowlist) and assign admin roles.
      </p>
      <UserTable users={users ?? []} />
    </div>
  );
}
