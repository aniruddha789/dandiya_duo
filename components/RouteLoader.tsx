"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { DandiyaLoaderScreen } from "@/components/DandiyaLoader";

/**
 * Full-screen dandiya loader for page transitions.
 * The App Router has no route-change events, so we arm the loader on
 * same-origin link clicks (and back/forward) and clear it once the URL
 * settles. A short delay avoids flashing on instant transitions, and a
 * safety timeout guarantees it never sticks.
 */
export function RouteLoader({ delay = 250, label = "Finding your circle…" }: {
  delay?: number; label?: string;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    if (safety.current) clearTimeout(safety.current);
    timer.current = null;
    safety.current = null;
  };

  const arm = () => {
    clear();
    timer.current = setTimeout(() => {
      setShow(true);
      // Never leave the overlay up forever (e.g. failed navigation).
      safety.current = setTimeout(() => setShow(false), 8000);
    }, delay);
  };

  // URL settled (pathname or query changed) → transition is done.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const urlKey = `${pathname}?${search.toString()}`;
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    clear();
    setShow(false);
  }, [urlKey]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!el) return;
      const href = el.getAttribute("href") || "";
      if (!href.startsWith("/") || href.startsWith("//")) return;
      if (el.getAttribute("target") === "_blank") return;
      if (el.hasAttribute("download")) return;
      // Same URL → no transition coming.
      const [path, query] = href.split("?");
      if (path === pathname && (query ?? "") === search.toString()) return;
      arm();
    };
    const onPopState = () => arm();
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  if (!show) return null;
  return <DandiyaLoaderScreen label={label} />;
}
