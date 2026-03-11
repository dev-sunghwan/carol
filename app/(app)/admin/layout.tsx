import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const adminNavLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/daily", label: "Daily Orders" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/exceptions", label: "Exception Requests" },
  { href: "/admin/pickup", label: "Pickup / No-show" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/audit", label: "Audit Log" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Admin</p>
        <nav className="flex flex-wrap gap-1">
          {adminNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs px-3 py-1.5 rounded-md bg-white border hover:bg-gray-50 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <Separator className="mb-6" />
      {children}
    </div>
  );
}
