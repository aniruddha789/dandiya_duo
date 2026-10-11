"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoLockup, LogoMark } from "@/components/Logo";
import { DuoMini } from "@/components/Duo";
import { GRIEVANCE_EMAIL } from "@/lib/config";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/matches", label: "Find DandiyaDuo", icon: "🥁" },
  { href: "/connections", label: "Duos", icon: "✨" },
  { href: "/account", label: "Account", icon: "👤" },
];

export function AppShell({ children, showNav = true, showDuo = true }: {
  children: React.ReactNode; showNav?: boolean; showDuo?: boolean;
}) {
  const pathname = usePathname();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl">
      {/* Desktop sidebar */}
      {showNav && (
        <aside
          className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col p-5 md:flex"
          style={{ background: "rgba(27,16,48,.55)", borderRight: "1px solid var(--line-dark)", backdropFilter: "blur(6px)" }}
        >
          <Link href="/" aria-label="DandiyaDuo home">
            <LogoLockup size={34} />
          </Link>
          <p className="mt-1 text-sm font-semibold muted">Find your circle this Navratri</p>
          <nav className="mt-8 flex flex-col gap-3" aria-label="Primary">
            {TABS.map((t) => {
              const active = pathname === t.href || pathname.startsWith(t.href + "/");
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "chip chip-on-dark !min-h-[52px] !text-base",
                    active && "!border-transparent font-bold",
                  )}
                  style={active ? { background: "linear-gradient(94deg, var(--marigold), var(--saffron))", color: "var(--ink)" } : undefined}
                >
                  <span aria-hidden className="mr-2">{t.icon}</span>
                  {t.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex justify-center">
            <DuoMini size={120} />
          </div>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top brand */}
        <header className="flex items-center gap-2 p-4 md:hidden">
          <Link href="/" aria-label="DandiyaDuo home" className="flex items-center gap-2">
            <LogoMark size={32} />
            <span className="font-display text-2xl font-extrabold" style={{ color: "var(--cream)" }}>
              Dandiya<span style={{ color: "var(--pink)" }}>Duo</span>
            </span>
          </Link>
        </header>

        <main className="flex-1 px-4 pb-28 pt-2 md:px-8 md:pb-16">{children}</main>

        <footer className="px-4 pb-24 text-center text-sm md:pb-8" style={{ color: "var(--muted)" }}>
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-1 font-semibold">
            <Link href="/safety" className="text-link">Safety</Link>
            <span aria-hidden> · </span>
            <Link href="/privacy" className="text-link">Privacy</Link>
            <span aria-hidden> · </span>
            <Link href="/terms" className="text-link">Terms</Link>
            <span aria-hidden> · </span>
            <a href={`mailto:${GRIEVANCE_EMAIL}`} className="text-link">Contact</a>
          </nav>
          <p className="mt-1">Made with dandiya-stick energy for Navratri dancers.</p>
        </footer>

        {/* Mobile bottom tab bar */}
        {showNav && (
          <nav
            aria-label="Primary"
            className="fixed inset-x-0 bottom-0 z-40 flex px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
            style={{ background: "rgba(27,16,48,.92)", borderTop: "1px solid var(--line-dark)", backdropFilter: "blur(8px)" }}
          >
            {TABS.map((t) => {
              const active = pathname === t.href || pathname.startsWith(t.href + "/");
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className="flex min-h-[56px] flex-1 flex-col items-center justify-center rounded-2xl text-xs font-bold"
                  style={active
                    ? { background: "linear-gradient(94deg, var(--marigold), var(--saffron))", color: "var(--ink)" }
                    : { color: "var(--cream)" }}
                >
                  <span aria-hidden className="text-xl leading-none">{t.icon}</span>
                  {t.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Desktop Duo hanging out bottom-right (hidden on landing) */}
      {showDuo && (
        <div aria-hidden className="pointer-events-none fixed bottom-0 right-2 hidden opacity-90 lg:block">
          <DuoMini size={130} />
        </div>
      )}
    </div>
  );
}
