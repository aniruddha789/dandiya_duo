"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { Banner, Card, PrimaryButton } from "@/components/ui";
import { DiyaMascot } from "@/components/Mascots";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const next = params.get("next") || "/onboarding";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="mx-auto max-w-md pt-8">
      <div className="flex justify-center"><DiyaMascot size={90} /></div>
      <h1 className="headline font-display mt-2 text-center text-4xl font-black">Come on in</h1>
      {sent ? (
        <Card className="mt-5 text-center">
          <p className="font-bold">Check your inbox ✉️</p>
          <p className="mt-1 text-sm">We sent a magic link to {email}. Tap it on this device to hop in.</p>
          <button className="text-link mt-2" onClick={() => setSent(false)}>Use a different email</button>
        </Card>
      ) : (
        <Card className="mt-5">
          <form onSubmit={send} className="flex flex-col gap-3">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email" type="email" required className="field" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
            />
            {error && <Banner icon="⚠️">{error}</Banner>}
            <PrimaryButton disabled={busy}>{busy ? "Sending…" : "Send magic link"}</PrimaryButton>
          </form>
          <p className="mt-3 text-xs">By continuing you confirm you’re 18+ and accept the Terms and Privacy pages.</p>
        </Card>
      )}
      <div className="mt-4 text-center">
        <button className="text-link" onClick={() => router.push("/")}>← Back home</button>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <AppShell showNav={false}>
      <Suspense><LoginForm /></Suspense>
    </AppShell>
  );
}
