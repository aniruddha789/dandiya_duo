"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { Banner, Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { Duo } from "@/components/Duo";
import { createClient } from "@/lib/supabase/client";
import { siteUrl } from "@/lib/site";

/** Common disposable-email domains. Server should enforce too (see README). */
const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "throwaway.email", "yopmail.com", "trashmail.com", "fakeinbox.com",
]);

const RESEND_SECONDS = 60;
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_GOOGLE === "1";

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const next = params.get("next") || "/onboarding";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function validEmail(v: string) {
    const e = v.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return "Enter a valid email.";
    const domain = e.split("@")[1];
    if (DISPOSABLE.has(domain)) return "That looks like a throwaway address — use your real email.";
    return null;
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const problem = validEmail(email);
    if (problem) { setError(problem); return; }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    // shouldCreateUser defaults true; OTP email carries both link + 6-digit code.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    if (error) setError(error.message);
    else {
      setSent(true);
      setCooldown(RESEND_SECONDS);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const token = code.replace(/\s/g, "");
    if (token.length < 6) { setError("Enter the 6-digit code from the email."); return; }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: "email" });
    setBusy(false);
    if (error) setError("That code didn’t work. Check the latest email and try again.");
    else router.push(next);
  }

  async function google() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }

  return (
    <div className="mx-auto max-w-md pt-8">
      <div className="flex justify-center"><Duo size={140} /></div>
      <h1 className="headline font-display mt-2 text-center text-4xl font-extrabold">Come on in</h1>
      {!sent ? (
        <Card className="mt-5">
          <form onSubmit={send} className="flex flex-col gap-3">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email" type="email" required className="field" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
            />
            {error && <Banner icon="⚠️" tone="light">{error}</Banner>}
            <PrimaryButton disabled={busy}>{busy ? "Sending…" : "Send magic link"}</PrimaryButton>
          </form>
          {GOOGLE_ENABLED && (
            <>
              <p className="on-light-muted mt-3 text-center text-sm">or</p>
              <SecondaryButton className="btn-on-light mt-1 w-full" onClick={() => void google()}>
                Continue with Google
              </SecondaryButton>
            </>
          )}
          <p className="on-light-muted mt-3 text-xs">By continuing you confirm you’re 18+ and accept the Terms and Privacy pages.</p>
        </Card>
      ) : (
        <Card className="mt-5">
          <p className="font-bold" style={{ color: "var(--ink)" }}>Check your email ✉️</p>
          <p className="mt-1 text-sm on-light-muted">
            We sent a link to {email}. Tap it on this device — or enter the 6-digit code below
            (links sometimes open in the wrong browser).
          </p>
          <form onSubmit={verify} className="mt-3 flex flex-col gap-3">
            <label className="label" htmlFor="code">6-digit code</label>
            <input
              id="code" className="field text-center tracking-[0.4em]" inputMode="numeric"
              autoComplete="one-time-code" maxLength={8} placeholder="••••••"
              value={code} onChange={(e) => setCode(e.target.value)}
            />
            {error && <Banner icon="⚠️" tone="light">{error}</Banner>}
            <PrimaryButton disabled={busy}>Verify code</PrimaryButton>
          </form>
          <div className="mt-3 flex items-center justify-between">
            <button className="text-link" onClick={() => { setSent(false); setCode(""); setError(null); }}>
              Use a different email
            </button>
            <button className="text-link" disabled={cooldown > 0 || busy} onClick={() => void send()}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
            </button>
          </div>
        </Card>
      )}
      <div className="mt-4 text-center">
        <button className="text-link" style={{ color: "var(--muted)" }} onClick={() => router.push("/")}>← Back home</button>
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
