"use client";

import { useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Banner, Card, SecondaryButton } from "@/components/ui";
import { Duo } from "@/components/Duo";
import { Celebration, MatchCardView, ReportDialog } from "@/components/MatchCard";
import { createClient } from "@/lib/supabase/client";
import { THIN_POOL_MIN } from "@/lib/config";
import { en } from "@/lib/strings";
import type { MatchCard } from "@/lib/types";

const PAGE = 20;

export default function MatchesPage({ cityId, metroOn }: { cityId: string; metroOn: boolean }) {
  const supabase = createClient();
  const qc = useQueryClient();
  const [celebration, setCelebration] = useState<string | null>(null);
  const [reporting, setReporting] = useState<MatchCard | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [metro, setMetro] = useState(metroOn);

  const feed = useInfiniteQuery({
    queryKey: ["matches", cityId, metro],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc("get_matches", {
        p_city_id: cityId, p_include_metro: metro, p_limit: PAGE, p_offset: pageParam,
      });
      if (error) throw error;
      return (data ?? []) as MatchCard[];
    },
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.length < PAGE ? undefined : pages.length * PAGE),
  });

  const cards = (feed.data?.pages ?? []).flat();
  const thin = !feed.isPending && !feed.isError && cards.length < THIN_POOL_MIN;

  async function swipe(card: MatchCard, action: "like" | "pass") {
    const { data, error } = await supabase.rpc("record_swipe", { p_target: card.profile_id, p_action: action });
    if (error) { setNotice(error.message); return; }
    if ((data as { matched?: boolean })?.matched) setCelebration(card.first_name);
    qc.setQueryData(["matches", cityId, metro], (old: { pages: MatchCard[][] } | undefined) => {
      if (!old) return old;
      return { ...old, pages: old.pages.map((pg) => pg.filter((c) => c.profile_id !== card.profile_id)) };
    });
  }

  async function report(reason: string, details: string) {
    if (!reporting) return;
    const { error } = await supabase.rpc("report_user", { p_target: reporting.profile_id, p_reason: reason, p_details: details || null });
    setReporting(null);
    setNotice(error ? error.message : "Thanks — a human will read this within 24 hours.");
  }

  async function block(card: MatchCard) {
    if (!confirm(`Block ${card.first_name}? They’ll never see or match you again.`)) return;
    const { error } = await supabase.rpc("block_user", { p_target: card.profile_id });
    setNotice(error ? error.message : "Blocked.");
    if (!error) swipe(card, "pass");
  }

  async function widen() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ include_nearby: true, how_far: "anywhere" }).eq("id", user.id);
    if (error) { setNotice(error.message); return; }
    setMetro(true);
    qc.invalidateQueries({ queryKey: ["matches", cityId] });
    setNotice("Widened! Nearby cities and anywhere-distance are on.");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl pt-4">
        <h1 className="headline font-display text-4xl font-extrabold">Find DandiyaDuo</h1>
        <p className="font-semibold muted">Sorted by how well you’d vibe on the floor.</p>
        {notice && <div className="mt-3"><Banner icon="🪔">{notice}</Banner></div>}

        {feed.isPending && <Card className="mt-4">Warming up the dhol…</Card>}
        {feed.isError && <Card className="mt-4">Couldn’t load Duos. Pull to retry.</Card>}

        {thin && !feed.isPending && (
          <Card className="mt-4 text-center">
            <div className="flex justify-center"><Duo size={130} /></div>
            <p className="mt-2 text-sm font-semibold">{en.emptyMatches}</p>
            <div className="mt-3 flex flex-col gap-2">
              {!metro && (
                <button className="btn-primary" onClick={() => void widen()}>Widen my search</button>
              )}
              <Link href="/onboarding?step=2&edit=1" className="btn-secondary btn-on-light">Add more nights</Link>
            </div>
          </Card>
        )}

        <div className="mt-4 flex flex-col gap-4">
          {cards.map((c) => (
            <MatchCardView
              key={c.profile_id} card={c}
              onSwipe={(a) => void swipe(c, a)}
              onReport={() => setReporting(c)}
              onBlock={() => void block(c)}
            />
          ))}
        </div>

        {feed.hasNextPage && (
          <SecondaryButton className="mt-4 w-full" disabled={feed.isFetchingNextPage} onClick={() => void feed.fetchNextPage()}>
            {feed.isFetchingNextPage ? "Loading…" : "Show more"}
          </SecondaryButton>
        )}
      </div>
      {celebration && <Celebration name={celebration} onClose={() => setCelebration(null)} />}
      {reporting && <ReportDialog name={reporting.first_name} onClose={() => setReporting(null)} onSubmit={(r, dt) => void report(r, dt)} />}
    </AppShell>
  );
}
