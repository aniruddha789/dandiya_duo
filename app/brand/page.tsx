import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui";
import { LogoLockup, LogoMark, LogoMono } from "@/components/Logo";
import { Duo } from "@/components/Duo";

export const metadata: Metadata = {
  title: "Brand guide",
  robots: { index: false, follow: false },
};

const TOKENS: Array<{ name: string; hex: string; onDark?: boolean }> = [
  { name: "--ink #1B1030", hex: "#1B1030" },
  { name: "--night #2A1650", hex: "#2A1650" },
  { name: "--surface #FFF8EE", hex: "#FFF8EE" },
  { name: "--marigold #FFB627", hex: "#FFB627" },
  { name: "--pink #FF4F8B", hex: "#FF4F8B" },
  { name: "--teal #1FB6A6", hex: "#1FB6A6" },
  { name: "--saffron #FF7A1A", hex: "#FF7A1A" },
  { name: "--cream #FFF3E0", hex: "#FFF3E0" },
];

export default function Brand() {
  return (
    <AppShell showNav={false}>
      <div className="mx-auto max-w-2xl pt-6">
        <p className="muted text-sm font-bold">Internal · do not index</p>
        <h1 className="headline font-display text-4xl font-extrabold">
          DandiyaDuo <span className="accent">brand guide</span>
        </h1>

        <Card className="mt-5">
          <h2 className="font-display text-xl font-bold">Logo — crossed sticks, flame at the cross</h2>
          <div className="mt-3 flex flex-wrap items-center gap-6">
            <div><LogoLockup size={36} /><p className="on-light-muted mt-1 text-xs">Full lockup</p></div>
            <div><LogoMark size={56} /><p className="on-light-muted mt-1 text-xs">Mark only</p></div>
            <div className="rounded-xl bg-night p-3"><LogoMono size={56} color="#FFF3E0" /><p className="mt-1 text-xs muted">Mono (any color)</p></div>
          </div>
          <p className="on-light-muted mt-3 text-sm">Wordmark: “Dandiya” in cream, second “D” in pink. Never stretch, recolor sticks, or put the lockup on busy photos.</p>
        </Card>

        <Card className="mt-4">
          <h2 className="font-display text-xl font-bold">Tokens</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TOKENS.map((t) => (
              <div key={t.name} className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--line-light)" }}>
                <div className="h-12" style={{ background: t.hex }} />
                <p className="p-1.5 font-mono text-[11px]">{t.name}</p>
              </div>
            ))}
          </div>
          <p className="on-light-muted mt-3 text-sm">Text pairs (AA): cream on night/ink; ink on surface/marigold; pink + teal for large text, graphics and glow only.</p>
        </Card>

        <Card className="mt-4">
          <h2 className="font-display text-xl font-bold">Type</h2>
          <p className="font-display text-3xl font-extrabold">Baloo 2 — headings</p>
          <p className="mt-1">DM Sans — body. Two families max, via next/font.</p>
        </Card>

        <Card className="mt-4">
          <h2 className="font-display text-xl font-bold">The Duo</h2>
          <Duo size={200} />
          <p className="on-light-muted mt-2 text-sm">Gender-neutral pair with sticks. Hero, empty states, match moment. Never give them real faces or branded outfits.</p>
        </Card>

        <Card className="mt-4">
          <h2 className="font-display text-xl font-bold">Voice</h2>
          <p className="text-sm">Warm, playful, safe, short sentences. Light Hinglish in microcopy (“Chalo dance!”). Core promises always in clear English. Never claim “100% safe”.</p>
        </Card>
      </div>
    </AppShell>
  );
}
