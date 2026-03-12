"use client";

import Link from "next/link";
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

function TricircleLogo() {
  return (
    <svg width="60" height="60" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M32.4 40.2C31.9 35.8 35.7 32.1 40.7 32.14C45.7 32.18 50.1 35.9 50.6 40.3C51.1 44.7 47.3 48.4 42.3 48.36C37.3 48.32 32.9 44.6 32.4 40.2ZM51.4 40.8C50.9 35.7 45.8 31.6 40.2 31.56C34.6 31.52 29.7 35.5 30.2 40.6C30.7 45.7 35.8 49.8 41.4 49.84C47 49.88 51.9 45.9 51.4 40.8Z" fill="#FBB584"/>
      <path d="M42.6 49.9C39.6 53 35.4 53.3 32.3 50.5C29.2 47.7 29.24 43.5 32.24 40.4C35.24 37.3 39.44 37 42.54 39.8C45.64 42.6 45.6 46.8 42.6 49.9ZM32 40.3C28.5 44 28.46 49.5 31.9 52.8C35.34 56.1 40.9 55.8 44.4 52.1C47.9 48.4 47.94 42.9 44.5 39.6C41.06 36.3 35.5 36.6 32 40.3Z" fill="#F89B6C"/>
      <path d="M32.4 27C38.4 24.6 44.3 27 45.8 32.3C47.3 37.6 43.5 43.6 37.5 46C31.5 48.4 25.6 46 24.1 40.7C22.6 35.4 26.4 29.4 32.4 27ZM27.2 29.2C20.6 34.2 19 42.2 23.9 46.6C28.8 51 37.7 50.1 44.3 45.1C50.9 40.1 52.5 32.1 47.6 27.7C42.7 23.3 33.8 24.2 27.2 29.2Z" fill="#F37321"/>
      <circle cx="40" cy="40" r="3" fill="white" fillOpacity="0.8"/>
    </svg>
  );
}

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
          <Link href="/" className="flex items-center gap-2.5 group">
            <TricircleLogo />
            <span className="font-bold text-xl tracking-tight text-foreground">Carol</span>
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
            <span className="sm:hidden text-sm">Account</span>
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
