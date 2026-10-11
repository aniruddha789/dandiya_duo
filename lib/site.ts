/** Canonical public origin. Set NEXT_PUBLIC_SITE_URL in prod so magic
 *  links always point at the real domain, never the requesting origin. */
export function siteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}
