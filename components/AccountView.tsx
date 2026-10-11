"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Banner, Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { liveReady, type Draft } from "@/lib/completeness";

const SECTIONS = [
  { step: 1, title: "The basics", desc: "City, name, age, area" },
  { step: 2, title: "Garba plans", desc: "Nights, level, intention, distance" },
  { step: 3, title: "About you", desc: "Stars, languages, interests, films" },
  { step: 4, title: "Food taste", desc: "Diet, cuisines, after-garba" },
  { step: 5, title: "What matters", desc: "Weights and dealbreakers" },
  { step: 6, title: "Your card", desc: "Photos, handle, prompts" },
];

export default function AccountPage({ draft, paused, blocked, completeness }: {
  draft: Draft; paused: boolean; blocked: Array<{ id: string; name: string }>; completeness: number;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [isPaused, setIsPaused] = useState(paused);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function togglePause() {
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      is_paused: !isPaused, is_live: !isPaused ? false : liveReady(draft),
    }).eq("id", (await supabase.auth.getUser()).data.user!.id);
    setBusy(false);
    if (error) setNotice(error.message);
    else setIsPaused(!isPaused);
  }

  async function unblock(id: string) {
    const uid = (await supabase.auth.getUser()).data.user!.id;
    const { error } = await supabase.from("blocks").delete().eq("blocker", uid).eq("blocked", id);
    setNotice(error ? error.message : "Unblocked. They may appear in your feed again.");
    if (!error) router.refresh();
  }

  async function wipe() {
    setBusy(true);
    try {
      const uid = (await supabase.auth.getUser()).data.user!.id;
      const { data: files } = await supabase.storage.from("photos").list(uid);
      if (files?.length) await supabase.storage.from("photos").remove(files.map((f) => `${uid}/${f.name}`));
      const { error } = await supabase.rpc("delete_my_account");
      if (error) throw error;
      await supabase.auth.signOut();
      router.push("/");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Delete failed.");
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl pt-4">
        <h1 className="headline font-display text-4xl font-black">Account</h1>
        {notice && <div className="mt-3"><Banner icon="🪔">{notice}</Banner></div>}

        <Card className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-black">Profile completeness</h2>
            <span className="font-display text-xl font-black">{completeness}%</span>
          </div>
          <div className="mt-2 h-4 overflow-hidden rounded-full border-2" style={{ borderColor: "var(--bark)" }}>
            <div className="h-full" style={{ width: `${completeness}%`, background: "var(--crimson)" }} />
          </div>
          {completeness < 100 && <p className="mt-1 text-sm font-semibold">Fill the skipped sections below for better matches.</p>}
        </Card>

        <div className="mt-4 flex flex-col gap-3">
          {SECTIONS.map((s) => (
            <Card key={s.step} className="!p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-black">{s.title}</h3>
                  <p className="text-xs font-semibold">{s.desc}</p>
                </div>
                <Link href={`/onboarding?step=${s.step}&edit=1`} className="btn-secondary !min-h-[44px] !py-1">Edit</Link>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-4">
          <h2 className="font-display text-xl font-black">Visibility</h2>
          <p className="text-sm font-semibold">{isPaused ? "Paused — you’re hidden from everyone’s feed." : "Live — you’re in the matching pool."}</p>
          <PrimaryButton className="mt-2" disabled={busy} onClick={() => void togglePause()}>
            {isPaused ? "Unpause my profile" : "Pause my profile"}
          </PrimaryButton>
        </Card>

        <Card className="mt-4">
          <h2 className="font-display text-xl font-black">Blocked ({blocked.length})</h2>
          {blocked.length === 0 && <p className="text-sm font-semibold">Nobody blocked. Peaceful circle.</p>}
          {blocked.map((b) => (
            <div key={b.id} className="mt-2 flex items-center justify-between">
              <span className="font-semibold">{b.name}</span>
              <button className="text-link" onClick={() => void unblock(b.id)}>Unblock</button>
            </div>
          ))}
        </Card>

        <Card className="mt-4">
          <h2 className="font-display text-xl font-black">Leave</h2>
          <div className="mt-2 flex flex-col gap-2">
            <SecondaryButton onClick={() => void supabase.auth.signOut().then(() => router.push("/"))}>Log out</SecondaryButton>
            {!confirmDelete ? (
              <button className="text-link text-left" onClick={() => setConfirmDelete(true)}>Delete my account permanently…</button>
            ) : (
              <Banner icon="⚠️">
                <span>
                  This removes your profile, photos, handle and login right now. This can’t be undone.{" "}
                  <button className="text-link font-bold" disabled={busy} onClick={() => void wipe()}>Yes, delete everything</button>
                  {" · "}
                  <button className="text-link" onClick={() => setConfirmDelete(false)}>Keep my profile</button>
                </span>
              </Banner>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
