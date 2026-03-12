"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Carol</h1>
          <p className="text-gray-500 mt-1">EHQ Lunch Ordering Platform</p>
        </div>

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
      </div>
    </div>
  );
}
