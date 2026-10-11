// Festival wipe edge function: removes Storage objects, profiles, and auth
// users on the configured date. Schedule via pg_cron + pg_net, or call from
// CI on WIPE_DATE (see README). Requires SERVICE_ROLE_KEY.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${Deno.env.get("WIPE_CRON_SECRET")}`) {
    return new Response("forbidden", { status: 403 });
  }
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  // 1. Empty the private photos bucket (list in pages of 100).
  let totalFiles = 0;
  for (;;) {
    const { data, error } = await sb.storage.from("photos").list(undefined, { limit: 100 });
    if (error || !data || data.length === 0) break;
    // Top-level entries are user-id folders; recurse one level.
    for (const entry of data) {
      if (entry.id === null) {
        const { data: files } = await sb.storage.from("photos").list(entry.name, { limit: 1000 });
        if (files?.length) {
          await sb.storage.from("photos").remove(files.map((f) => `${entry.name}/${f.name}`));
          totalFiles += files.length;
        }
      } else {
        await sb.storage.from("photos").remove([entry.name]);
        totalFiles += 1;
      }
    }
    if (data.length < 100) break;
  }

  // 2. Delete profiles (cascades everything linked) + non-admin auth users.
  const { data: profiles } = await sb.from("profiles").select("id");
  const nProfiles = profiles?.length ?? 0;
  await sb.from("profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { data: users } = await sb.auth.admin.listUsers({ perPage: 1000 });
  let nUsers = 0;
  for (const u of users?.users ?? []) {
    const { data: isAdmin } = await sb.from("admins").select("id").eq("id", u.id).single();
    if (!isAdmin) {
      await sb.auth.admin.deleteUser(u.id);
      nUsers += 1;
    }
  }

  return Response.json({ wiped: true, files: totalFiles, profiles: nProfiles, authUsers: nUsers });
});
