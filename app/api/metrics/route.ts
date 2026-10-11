import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED = new Set(["page_view", "cta_click", "onboarding_step", "city_selected"]);
// Tiny in-memory per-IP throttle (single instance; Supabase has its own limits too).
const hits = new Map<string, { n: number; t: number }>();

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-nf-client-connection-ip") ||
    "unknown";
  const now = Date.now();
  const h = hits.get(ip);
  if (h && now - h.t < 60_000) {
    if (h.n >= 60) return NextResponse.json({ error: "slow down" }, { status: 429 });
    h.n += 1;
  } else {
    hits.set(ip, { n: 1, t: now });
  }

  let body: { event?: unknown; meta?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (typeof body.event !== "string" || !ALLOWED.has(body.event)) {
    return NextResponse.json({ error: "bad event" }, { status: 400 });
  }
  const meta = body.meta && typeof body.meta === "object" ? body.meta : {};
  const supabase = await createClient();
  const { error } = await supabase.from("metrics").insert({
    event: body.event,
    meta: JSON.parse(JSON.stringify(meta).slice(0, 2000)),
  });
  if (error) return NextResponse.json({ error: "store failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
