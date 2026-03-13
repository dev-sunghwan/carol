"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.endsWith("@hanwha.com")) {
      setMessage({ type: "error", text: "Only @hanwha.com email addresses are permitted." });
      return;
    }
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Check your email for a password setup link." });
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.endsWith("@hanwha.com")) {
      setMessage({ type: "error", text: "Only @hanwha.com email addresses are permitted." });
      return;
    }
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      router.push(next);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Use your <strong>@hanwha.com</strong> email address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
            className="mb-4"
          >
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="password">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="password" className="flex-1">Sign in</TabsTrigger>
            <TabsTrigger value="setup" className="flex-1">First time?</TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <form onSubmit={handlePassword} className="space-y-4">
              <div>
                <Label htmlFor="email-pw">Email</Label>
                <Input
                  id="email-pw"
                  type="email"
                  placeholder="you@hanwha.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="setup">
            <form onSubmit={handleMagicLink} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your registered email to receive a password setup link.
              </p>
              <div>
                <Label htmlFor="email-setup">Email</Label>
                <Input
                  id="email-setup"
                  type="email"
                  placeholder="you@hanwha.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send setup link"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TricircleLogo() {
  return (
    <svg width="64" height="64" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M32.4 40.2C31.9 35.8 35.7 32.1 40.7 32.14C45.7 32.18 50.1 35.9 50.6 40.3C51.1 44.7 47.3 48.4 42.3 48.36C37.3 48.32 32.9 44.6 32.4 40.2ZM51.4 40.8C50.9 35.7 45.8 31.6 40.2 31.56C34.6 31.52 29.7 35.5 30.2 40.6C30.7 45.7 35.8 49.8 41.4 49.84C47 49.88 51.9 45.9 51.4 40.8Z" fill="#FBB584"/>
      <path d="M42.6 49.9C39.6 53 35.4 53.3 32.3 50.5C29.2 47.7 29.24 43.5 32.24 40.4C35.24 37.3 39.44 37 42.54 39.8C45.64 42.6 45.6 46.8 42.6 49.9ZM32 40.3C28.5 44 28.46 49.5 31.9 52.8C35.34 56.1 40.9 55.8 44.4 52.1C47.9 48.4 47.94 42.9 44.5 39.6C41.06 36.3 35.5 36.6 32 40.3Z" fill="#F89B6C"/>
      <path d="M32.4 27C38.4 24.6 44.3 27 45.8 32.3C47.3 37.6 43.5 43.6 37.5 46C31.5 48.4 25.6 46 24.1 40.7C22.6 35.4 26.4 29.4 32.4 27ZM27.2 29.2C20.6 34.2 19 42.2 23.9 46.6C28.8 51 37.7 50.1 44.3 45.1C50.9 40.1 52.5 32.1 47.6 27.7C42.7 23.3 33.8 24.2 27.2 29.2Z" fill="#F37321"/>
      <circle cx="40" cy="40" r="3" fill="white" fillOpacity="0.8"/>
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <TricircleLogo />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Carol</h1>
          <p className="text-gray-500 mt-1">EHQ Lunch Ordering Platform</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
