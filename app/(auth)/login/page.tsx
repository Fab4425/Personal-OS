"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = createClient();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    window.location.href = "/";
  }

  async function handleGoogleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Bestätigungsmail gesendet — bitte Posteingang prüfen.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Personal OS</CardTitle>
          <CardDescription>
            Triathlon · Produktivität · KI · Kalender
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="du@beispiel.de"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {message && (
              <p className="text-sm text-destructive">{message}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              Anmelden
            </Button>
          </form>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            Mit Google anmelden
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleSignUp}
            disabled={loading}
          >
            Konto erstellen
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Supabase Auth ·{" "}
            <Link href="/" className="underline">
              Zur Startseite
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
