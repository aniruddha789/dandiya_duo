import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export default async function AdminReports() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/reports");
  const { data: admin } = await supabase.from("admins").select("id").eq("id", user.id).single();
  if (!admin) redirect("/matches");

  const { data: reports } = await supabase.from("reports")
    .select("*").eq("status", "open").order("created_at", { ascending: true }).limit(50);

  async function resolve(form: FormData) {
    "use server";
    const id = String(form.get("id"));
    const status = String(form.get("status"));
    const sb = await createClient();
    await sb.rpc("resolve_report", { p_report: id, p_status: status });
    revalidatePath("/admin/reports");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl pt-4">
        <h1 className="headline font-display text-4xl font-black">Report queue</h1>
        <p className="font-semibold">Read every report within 24 hours in season.</p>
        <div className="mt-4 flex flex-col gap-3">
          {(reports ?? []).length === 0 && <Card>Queue’s clear. The circle is behaving.</Card>}
          {(reports ?? []).map((r) => (
            <Card key={r.id}>
              <p className="text-sm"><b>Reported:</b> {r.reported?.slice(0, 8)}… · <b>By:</b> {r.reporter?.slice(0, 8)}…</p>
              <p className="mt-1 font-bold">{r.reason}</p>
              {r.details && <p className="mt-1 text-sm">{r.details}</p>}
              <p className="mt-1 text-xs opacity-70">{new Date(r.created_at).toLocaleString("en-IN")}</p>
              <form action={resolve} className="mt-2 flex gap-2">
                <input type="hidden" name="id" value={r.id} />
                <button name="status" value="dismissed" className="btn-secondary !min-h-[44px] flex-1">Dismiss</button>
                <button name="status" value="actioned" className="btn-primary !min-h-[44px] flex-1">Actioned</button>
              </form>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
