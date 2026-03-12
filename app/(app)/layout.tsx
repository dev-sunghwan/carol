import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/layout/NavBar";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Profile not yet created (trigger may be delayed) — show a waiting screen
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Setting up your account…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar profile={profile} />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
