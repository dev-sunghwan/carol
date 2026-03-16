"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const next = searchParams.get("next") ?? "/";
    const hash = window.location.hash;

    if (hash) {
      // Hash-based flow: Supabase sends #access_token=...&refresh_token=...
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        supabase.auth
          .setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(() => router.replace(next));
      } else {
        router.replace("/login");
      }
    } else {
      // PKCE code-based flow: ?code=...
      const code = searchParams.get("code");
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(() => router.replace(next));
      } else {
        router.replace("/login");
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
      Redirecting…
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackHandler />
    </Suspense>
  );
}
