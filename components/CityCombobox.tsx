"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { City } from "@/lib/cities";
import { cn } from "@/lib/utils";

/**
 * Accessible city combobox: type to filter, ↑↓ + Enter + Esc, popular group
 * first then A–Z, plus a "My city isn't listed" action row.
 */
export function CityCombobox({
  cities,
  value,
  onChange,
  onRequestCity,
  id,
  placeholder = "Choose city",
  autoFocus = false,
}: {
  cities: City[];
  value: City | null;
  onChange: (c: City | null) => void;
  onRequestCity?: () => void;
  id?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const fallbackId = useId();
  const inputId = id ?? `city-${fallbackId}`;
  const listId = `${inputId}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const popular = useMemo(
    () => cities.filter((c) => ["mumbai", "delhi-ncr", "bengaluru", "hyderabad", "pune", "chennai", "kolkata", "ahmedabad"].includes(c.slug)),
    [cities],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q ? cities.filter((c) => c.name.toLowerCase().includes(q) || c.slug.includes(q.replace(/\s+/g, "-")) || c.aliases.some((a) => a.toLowerCase().includes(q))) : cities;
    if (q) return [...pool].sort((a, b) => a.name.localeCompare(b.name));
    const pop = popular.filter((c) => pool.includes(c));
    const rest = pool.filter((c) => !pop.includes(c)).sort((a, b) => a.name.localeCompare(b.name));
    return [...pop, ...rest];
  }, [cities, query, popular]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => { setActive(0); }, [query]);

  function pick(c: City) {
    onChange(c);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  const showRequest = !!onRequestCity && (query.trim().length > 1 || filtered.length === 0);

  return (
    <div ref={wrapRef} className="relative">
      <input
        ref={inputRef}
        id={inputId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        autoFocus={autoFocus}
        className="field"
        placeholder={value ? value.name : placeholder}
        value={open ? query : (value?.name ?? query)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { setQuery(""); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter") { e.preventDefault(); const c = filtered[active]; if (open && c) pick(c); else setOpen(true); }
          else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
        }}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Cities"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-2xl p-1 shadow-soft"
          style={{ background: "#fffdf7", border: "1.5px solid rgba(27,16,48,.28)" }}
        >
          {filtered.length === 0 && !showRequest && (
            <li className="px-3 py-2 text-sm" style={{ color: "rgba(27,16,48,.66)" }}>No cities match “{query}”.</li>
          )}
          {filtered.map((c, i) => (
            <li key={c.slug} role="option" aria-selected={value?.slug === c.slug} id={`${listId}-${i}`}>
              <button
                type="button"
                className={cn("flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold")}
                style={{
                  background: i === active ? "rgba(27,16,48,.08)" : "transparent",
                  color: "#1B1030",
                }}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(c)}
              >
                <span>{c.name}</span>
                <span className="text-xs font-medium" style={{ color: "rgba(27,16,48,.55)" }}>{c.state}</span>
              </button>
            </li>
          ))}
          {showRequest && (
            <li role="option" aria-selected={false}>
              <button
                type="button"
                className="flex min-h-[44px] w-full items-center rounded-xl px-3 text-left text-sm font-bold"
                style={{ color: "#FF4F8B" }}
                onClick={() => { setOpen(false); onRequestCity?.(); }}
              >
                My city isn’t listed{query.trim() ? ` (“${query.trim()}”)` : ""} →
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
