"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Banner, Card, SecondaryButton } from "@/components/ui";
import { Duo } from "@/components/Duo";
import { SunflowerMascot } from "@/components/Mascots";
import { ReportDialog } from "@/components/MatchCard";
import { createClient } from "@/lib/supabase/client";
import { en } from "@/lib/strings";
import { photoUrl, type Connection } from "@/lib/types";

export default function ConnectionsPage() {
  const supabase = createClient();
  const qc = useQueryClient();
  const [handles, setHandles] = useState<Record<string, string>>({});
  const [reporting, setReporting] = useState<Connection | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["connections"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_connections");
      if (error) throw error;
      return (data ?? []) as Connection[];
    },
  });

  async function reveal(c: Connection) {
    if (handles[c.match_id]) return;
    const { data, error } = await supabase.rpc("get_connection_instagram", { p_match_id: c.match_id });
    if (error) { setNotice(error.message); return; }
    const row = (data as Array<{ handle: string }>)?.[0];
    if (row) setHandles((h) => ({ ...h, [c.match_id]: row.handle }));
  }

  async function unmatch(c: Connection) {
    if (!confirm(`Unmatch ${c.first_name}? Their handle will lock again.`)) return;
    const { error } = await supabase.rpc("unmatch", { p_match_id: c.match_id });
    if (!error) qc.invalidateQueries({ queryKey: ["connections"] });
    else setNotice(error.message);
  }

  async function block(c: Connection) {
    if (!confirm(`Block ${c.first_name}? They’ll never see or match you again.`)) return;
    const { error } = await supabase.rpc("block_user", { p_target: c.profile_id });
    if (!error) qc.invalidateQueries({ queryKey: ["connections"] });
    else setNotice(error.message);
  }

  async function report(reason: string, details: string) {
    if (!reporting) return;
    const { error } = await supabase.rpc("report_user", { p_target: reporting.profile_id, p_reason: reason, p_details: details || null });
    setReporting(null);
    setNotice(error ? error.message : "Thanks — a human will read this within 24 hours.");
    qc.invalidateQueries({ queryKey: ["connections"] });
  }

  const conns = list.data ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-xl pt-4">
        <h1 className="headline font-display text-4xl font-extrabold">Your Duos</h1>
        <p className="font-semibold muted">Mutual yeses only. Handles unlocked 🔓</p>
        {notice && <div className="mt-3"><Banner icon="🪔">{notice}</Banner></div>}
        {list.isPending && <Card className="mt-4">Checking the circle…</Card>}

        {!list.isPending && conns.length === 0 && (
          <Card className="mt-4 text-center">
            <div className="flex justify-center"><Duo size={130} /></div>
            <h2 className="font-display text-2xl font-extrabold" style={{ color: "var(--ink)" }}>{en.emptyDuos}</h2>
            <p className="mt-1 text-sm font-semibold on-light-muted">Tap “Let’s dance” on someone you like.</p>
          </Card>
        )}

        <div className="mt-4 flex flex-col gap-4">
          {conns.map((c) => {
            const photo = c.photo_paths[0];
            const handle = handles[c.match_id];
            return (
              <article key={c.match_id} className="sticker-card p-4">
                <div className="flex items-center gap-3">
                  <div className="avatar-ring h-20 w-20 shrink-0">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoUrl(photo)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"><SunflowerMascot size={64} /></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-extrabold">{c.first_name}, {c.age}</h3>
                    <p className="text-sm font-semibold">📍 {c.area_name ?? "Somewhere nearby"} · {c.score}% vibe</p>
                  </div>
                </div>
                {handle ? (
                  <a
                    href={`https://instagram.com/${handle}`} target="_blank" rel="noreferrer"
                    className="btn-primary mt-3 w-full"
                  >
                    @{handle} on Instagram
                  </a>
                ) : (
                  <SecondaryButton className="btn-on-light mt-3 w-full" onClick={() => void reveal(c)}>
                    Reveal Instagram
                  </SecondaryButton>
                )}
                <div className="mt-2">
                  <Banner icon="📍" tone="light">
                    <span>Meet at the garba night — somewhere public and crowded. Tell a friend where you’re headed.</span>
                  </Banner>
                </div>
                <div className="mt-2 flex gap-3">
                  <button className="text-link" onClick={() => void unmatch(c)}>Unmatch</button>
                  <button className="text-link" onClick={() => setReporting(c)}>Report</button>
                  <button className="text-link" onClick={() => void block(c)}>Block</button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      {reporting && <ReportDialog name={reporting.first_name} onClose={() => setReporting(null)} onSubmit={(r, dt) => void report(r, dt)} />}
    </AppShell>
  );
}
