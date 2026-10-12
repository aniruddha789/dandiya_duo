"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DancerPeek } from "@/components/Mascots";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/matches", label: "Find your duo", icon: "🌼" },
  { href: "/connections", label: "Duos", icon: "🪔" },
  { href: "/account", label: "Account", icon: "👤" },
];

export function AppShell({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) {
  const pathname = usePathname();
  // Full-bleed shell: the desktop sidebar anchors to the viewport's
  // left edge on every screen width; only the content column is capped.
  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      {showNav && (
        <aside
          className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r-8 p-5 md:flex"
          style={{ background: "var(--cream)", borderColor: "var(--crimson)" }}
        >
          <Link href="/" className="font-display text-2xl font-black headline">
            DandiyaDuo
          </Link>
          <p className="mt-1 text-sm font-semibold">Find your circle this Navratri</p>
          <nav className="mt-8 flex flex-col gap-3" aria-label="Primary">
            {TABS.map((t) => {
              const active = pathname === t.href || pathname.startsWith(t.href + "/");
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("chip !min-h-[52px] !text-base", active && "!bg-[var(--bark)] !text-[#ffd166]")}
                >
                  <span aria-hidden className="mr-2">{t.icon}</span>
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      <div className="mx-auto flex min-w-0 w-full max-w-3xl flex-1 flex-col">
        {/* Mobile top brand */}
        <header className="flex items-center justify-between p-4 md:hidden">
          <Link href="/" className="font-display text-2xl font-black headline">
            DandiyaDuo
          </Link>
        </header>

        <main className="flex-1 px-4 pb-28 pt-2 md:px-8 md:pb-16">{children}</main>

        <footer className="px-4 pb-24 text-center text-sm font-semibold md:pb-8">
          <Link href="/safety" className="text-link">Safety</Link>
          {" · "}
          <span>Made with dandiya-stick energy for Navratri dancers</span>
        </footer>

        {/* Mobile bottom tab bar */}
        {showNav && (
          <nav
            aria-label="Primary"
            className="fixed inset-x-0 bottom-0 z-40 flex border-t-4 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
            style={{ background: "var(--cream)", borderColor: "var(--bark)" }}
          >
            {TABS.map((t) => {
              const active = pathname === t.href || pathname.startsWith(t.href + "/");
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[56px] flex-1 flex-col items-center justify-center rounded-2xl text-xs font-bold",
                    active && "bg-[var(--bark)] text-[#ffd166]",
                  )}
                >
                  <span aria-hidden className="text-xl leading-none">{t.icon}</span>
                  {t.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Landing-only dancer peeking from bottom-right — hidden in the
          logged-in UI (matches / connections / account / onboarding). */}
      {!showNav && (
        <div aria-hidden className="pointer-events-none fixed bottom-0 right-2 hidden lg:block">
          <DancerPeek size={130} />
        </div>
      )}
    </div>
  );
}
