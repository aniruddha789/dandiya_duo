"use client";

import { useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Banner, Card, SecondaryButton } from "@/components/ui";
import { DiyaMascot } from "@/components/Mascots";
import { Celebration, MatchCardView, ReportDialog } from "@/components/MatchCard";
import { createClient } from "@/lib/supabase/client";
import type { MatchCard } from "@/lib/types";

const PAGE = 20;

export default function MatchesPage({ city }: { city: string }) {
  const supabase = createClient();
  const qc = useQueryClient();
  const [celebration, setCelebration] = useState<string | null>(null);
  const [reporting, setReporting] = useState<MatchCard | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const feed = useInfiniteQuery({
    queryKey: ["matches", city],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc("get_matches", {
        p_city: city, p_limit: PAGE, p_offset: pageParam,
      });
      if (error) throw error;
      return (data ?? []) as MatchCard[];
    },
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.length < PAGE ? undefined : pages.length * PAGE),
  });

  const cards = (feed.data?.pages ?? []).flat();

  async function swipe(card: MatchCard, action: "like" | "pass") {
    const { data, error } = await supabase.rpc("record_swipe", { p_target: card.profile_id, p_action: action });
    if (error) { setNotice(error.message); return; }
    if ((data as { matched?: boolean })?.matched) setCelebration(card.first_name);
    qc.setQueryData(["matches", city], (old: { pages: MatchCard[][] } | undefined) => {
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

  return (
    <AppShell>
      <div className="mx-auto max-w-xl pt-4">
        <h1 className="headline font-display text-4xl font-black">Your matches</h1>
        <p className="font-semibold">Sorted by how well you’d vibe on the floor.</p>
        {notice && <div className="mt-3"><Banner icon="🪔">{notice}</Banner></div>}

        {feed.isPending && <Card className="mt-4">Warming up the dhol…</Card>}
        {feed.isError && <Card className="mt-4">Couldn’t load matches. Pull to retry.</Card>}

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

        {!feed.isPending && cards.length === 0 && (
          <Card className="mt-4 text-center">
            <div className="flex justify-center"><DiyaMascot size={90} /></div>
            <h2 className="font-display text-2xl font-black">No matches yet</h2>
            <p className="mt-1 text-sm font-semibold">Your saathi is still warming up. More people join every day — share the link on your story and check back soon.</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/onboarding?step=2&edit=1" className="btn-secondary">Add more nights</Link>
              <Link href="/onboarding?step=2&edit=1" className="btn-secondary">Widen how far I’ll pull up</Link>
            </div>
          </Card>
        )}

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
