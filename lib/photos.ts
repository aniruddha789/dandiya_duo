"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Signed URLs live 30 minutes; refresh a minute early. */
const PHOTO_TTL_SECONDS = 60 * 30;
const REFRESH_SKEW_MS = 60 * 1000;

type CacheEntry = { url: string; exp: number };
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<void>>();

function fresh(path: string, now: number): string | null {
  const e = cache.get(path);
  return e && e.exp > now ? e.url : null;
}

/**
 * Sign a batch of private-bucket photo paths with the user's own session.
 * Access is governed by storage RLS (owner / eligible relationship /
 * approved), so no service role is involved. Unknown paths resolve to null.
 */
export async function signPhotoPaths(paths: string[]): Promise<Record<string, string | null>> {
  const now = Date.now();
  const uniq = [...new Set(paths.filter(Boolean))];
  const missing = uniq.filter((p) => !fresh(p, now) && !inflight.has(p));
  if (missing.length > 0) {
    const run = (async () => {
      const supabase = createClient();
      try {
        const { data, error } = await supabase.storage
          .from("photos")
          .createSignedUrls(missing, PHOTO_TTL_SECONDS);
        if (!error && data) {
          for (const row of data) {
            if (row.path && row.signedUrl) {
              cache.set(row.path, { url: row.signedUrl, exp: now + PHOTO_TTL_SECONDS * 1000 - REFRESH_SKEW_MS });
            }
          }
        }
      } finally {
        for (const p of missing) inflight.delete(p);
      }
    })();
    for (const p of missing) inflight.set(p, run);
    await run;
  } else if (inflight.size > 0) {
    await Promise.all([...inflight.values()]);
  }
  const out: Record<string, string | null> = {};
  for (const p of uniq) out[p] = fresh(p, Date.now());
  return out;
}

/** React hook: path -> signed URL map for the given storage paths. */
export function useSignedPhotos(paths: string[] | undefined): Record<string, string | null> {
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const key = (paths ?? []).filter(Boolean).join("\n");
  useEffect(() => {
    if (!key) {
      setUrls({});
      return;
    }
    let live = true;
    void signPhotoPaths(key.split("\n")).then((m) => {
      if (live) setUrls(m);
    });
    return () => {
      live = false;
    };
  }, [key]);
  return urls;
}
