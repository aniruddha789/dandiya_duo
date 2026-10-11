import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/** Serves private-bucket photos as short-lived signed URLs after a visibility check. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("p") || "";
  const [owner, ...rest] = path.split("/");
  if (!owner || rest.length === 0 || path.includes("..")) {
    return NextResponse.json({ error: "bad path" }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth required" }, { status: 401 });

  const admin = await createServiceClient();
  // Requester must be a live, unbanned user.
  const { data: me } = await admin.from("profiles").select("id,city,is_live,is_paused,is_banned").eq("id", user.id).single();
  if (!me || !me.is_live || me.is_paused || me.is_banned) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  // Target must be live, same city, unblocked both ways (or the requester themself).
  if (owner !== user.id) {
    const { data: target } = await admin.from("profiles")
      .select("id,city,is_live,is_paused,is_banned").eq("id", owner).single();
    if (!target || !target.is_live || target.is_paused || target.is_banned || target.city !== me.city) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const { data: blocked } = await admin.from("blocks").select("blocker")
      .or(`and(blocker.eq.${user.id},blocked.eq.${owner}),and(blocker.eq.${owner},blocked.eq.${user.id})`).limit(1);
    if (blocked && blocked.length > 0) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { data, error } = await admin.storage.from("photos").createSignedUrl(path, 300);
  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
