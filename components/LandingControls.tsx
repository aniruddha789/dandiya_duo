"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Banner } from "@/components/ui";
import { track } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";
import { en } from "@/lib/strings";

export function TrackView({ event, meta }: { event: string; meta?: Record<string, string> }) {
  const key = useMemo(() => JSON.stringify(meta ?? {}), [meta]);
  useEffect(() => {
    track(event, meta ? (JSON.parse(key) as Record<string, string>) : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, key]);
  return null;
}

/** Hero CTA. City picking lives post-login (onboarding/settings), not here. */
export function HeroCta({ citySlug }: { citySlug?: string }) {
  const ctaHref = citySlug ? `/onboarding?city=${citySlug}` : "/onboarding";
  return (
    <div className="mt-5 flex flex-col items-center gap-2">
      <Link
        href={ctaHref}
        className="btn-primary"
        onClick={() => track("cta_click", { where: "hero", city: citySlug ?? "none" })}
      >
        {en.ctaPrimary}
      </Link>
      <a href="#how-it-works" className="text-link" style={{ color: "var(--muted)" }}>
        {en.howItWorksLink}
      </a>
    </div>
  );
}

export function CityRequestForm({ onDone, tone = "dark" }: { onDone?: () => void; tone?: "dark" | "light" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const light = tone === "light";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setState("busy");
    const supabase = createClient();
    const { error } = await supabase.from("city_requests").insert({
      city_name: name.trim().slice(0, 60),
      email: email.trim() ? email.trim().slice(0, 120) : null,
    });
    if (error) setState("error");
    else {
      setState("done");
      onDone?.();
    }
  }

  if (state === "done") {
    return (
      <div className="mt-2"><Banner icon="💌" tone={light ? "light" : "dark"}>Noted! We’ll prioritise your city. Pick the nearest launched city for now.</Banner></div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2 rounded-2xl p-3" style={light
      ? { background: "rgba(27,16,48,.05)", border: "1px solid var(--line-light)" }
      : { background: "rgba(255,243,224,.07)", border: "1px solid var(--line-dark)" }}>
      <label className="label !mb-0 text-left text-sm" htmlFor="cr-city">Which city?</label>
      <input id="cr-city" className="field" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="e.g. Udaipur" required />
      <label className="label !mb-0 text-left text-sm" htmlFor="cr-email">Email (optional, for launch news)</label>
      <input id="cr-email" className="field" type="email" value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      {state === "error" && <Banner icon="⚠️" tone={light ? "light" : "dark"}>Couldn’t save. Try again in a bit.</Banner>}
      <button className={light ? "btn-secondary btn-on-light !min-h-[44px]" : "btn-secondary !min-h-[44px]"} disabled={state === "busy"} type="submit">
        {state === "busy" ? "Saving…" : "Request my city"}
      </button>
    </form>
  );
}

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return;
    setState("busy");
    const supabase = createClient();
    const { error } = await supabase.from("waitlist").insert({ email: email.trim().slice(0, 120) });
    if (error) setState("error");
    else setState("done");
  }

  if (state === "done") return <Banner icon="💌">{en.waitlistDone}</Banner>;

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-sm flex-col gap-2">
      <label className="label text-left" htmlFor="wl-email" style={{ color: "var(--cream)" }}>Email</label>
      <div className="flex gap-2">
        <input id="wl-email" type="email" required className="field" value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} placeholder={en.waitlistPlaceholder} />
        <button className="btn-primary shrink-0" disabled={state === "busy"} type="submit">
          {state === "busy" ? "…" : en.waitlistButton}
        </button>
      </div>
      <p className="text-left text-xs" style={{ color: "var(--muted)" }}>{en.waitlistConsent}</p>
      {state === "error" && <Banner icon="⚠️">Couldn’t save. You may already be on the list — try again later.</Banner>}
    </form>
  );
}
