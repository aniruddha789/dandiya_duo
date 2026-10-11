/**
 * Privacy-friendly analytics: anonymous events only, no third-party trackers,
 * no PII. Events: page_view, cta_click, onboarding_step, city_selected.
 * Disable with NEXT_PUBLIC_ANALYTICS_OFF=1. Stored in `metrics` (no user id).
 */
const ALLOWED = new Set(["page_view", "cta_click", "onboarding_step", "city_selected"]);

export function track(event: string, meta?: Record<string, string | number | boolean>) {
  if (!ALLOWED.has(event)) return;
  if (process.env.NEXT_PUBLIC_ANALYTICS_OFF === "1") return;
  try {
    const clean: Record<string, string | number | boolean> = {};
    if (meta) {
      for (const [k, v] of Object.entries(meta)) {
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") clean[k.slice(0, 40)] = v;
      }
    }
    void fetch("/api/metrics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, meta: clean }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never break the app for analytics */
  }
}
