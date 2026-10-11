import { headers } from "next/headers";

/**
 * Coarse city auto-detect from hosting IP-geolocation headers (Netlify, Vercel,
 * Cloudflare, App Engine). Best-effort only: returns a city *name* or null.
 * Never requests browser GPS, never stores the IP, never stores coordinates.
 */
const CANDIDATE_HEADERS = [
  "x-nf-city", // Netlify (when present)
  "x-vercel-ip-city", // Vercel
  "cf-ipcity", // Cloudflare
  "cloudfront-viewer-city-name", // CloudFront
  "x-appengine-city", // App Engine
  "x-geo-city", // generic fallback
];

export async function detectCityName(): Promise<string | null> {
  const h = await headers();
  for (const key of CANDIDATE_HEADERS) {
    const raw = h.get(key);
    if (!raw) continue;
    try {
      const name = decodeURIComponent(raw).trim();
      if (name && !/^unknown$/i.test(name)) return name;
    } catch {
      const name = raw.trim();
      if (name) return name;
    }
  }
  return null;
}
