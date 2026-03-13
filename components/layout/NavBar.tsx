"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Profile } from "@/lib/types/database.types";

interface NavBarProps {
  profile: Profile;
}

export function NavBar({ profile }: NavBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const navLinks = [
    { href: "/", label: "Menu" },
    { href: "/orders", label: "My Orders" },
  ];

  return (
    <header className="border-b bg-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center group">
            <Image src="/carol-logo.svg" alt="Carol" width={140} height={52} priority />
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-orange-50 text-orange-600"
                      : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {profile.role === "admin" && (
              <Link
                href="/admin"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-orange-50 text-orange-600"
                    : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                }`}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors outline-none border border-transparent hover:border-border">
            <span className="hidden sm:inline text-sm text-foreground">
              {profile.full_name ?? profile.email}
            </span>
            <span className="sm:hidden text-sm">{profile.full_name ?? profile.email}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-muted-foreground" aria-hidden="true">
              <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-foreground truncate">{profile.full_name ?? "—"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            </div>
            <DropdownMenuSeparator />
            {/* Mobile nav links */}
            <div className="sm:hidden">
              {navLinks.map((link) => (
                <DropdownMenuItem key={link.href} onClick={() => router.push(link.href)}>
                  {link.label}
                </DropdownMenuItem>
              ))}
              {profile.role === "admin" && (
                <DropdownMenuItem onClick={() => router.push("/admin")}>
                  Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </div>
            <DropdownMenuItem onClick={signOut} className="text-red-600">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
