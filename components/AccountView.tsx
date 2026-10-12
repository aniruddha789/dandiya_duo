"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Banner, Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { PhotoImg } from "@/components/PhotoImg";
import { DandiyaLoader, DandiyaLoaderScreen } from "@/components/DandiyaLoader";
import { createClient } from "@/lib/supabase/client";
import { AFTER_GARBA, DANCE_LEVELS, DIETS, INTENTIONS } from "@/lib/config";
import { useSignedPhotos } from "@/lib/photos";
import { liveReady, type Draft } from "@/lib/completeness";

function CardPreviewView({ preview: p }: { preview: CardPreview }) {
  const photo = p.photo_paths[0];
  const photoUrls = useSignedPhotos(p.photo_paths);
  const dance = DANCE_LEVELS.find((x) => x.id === p.dance_level)?.label ?? p.dance_level;
  const intention = INTENTIONS.find((x) => x.id === p.intention)?.label ?? p.intention;
  const diet = DIETS.find((x) => x.id === p.diet)?.label;
  const after = AFTER_GARBA.find((x) => x.id === p.after_garba)?.label;
  return (
    <div className="sticker-card mt-4 p-4">
      <p className="text-xs font-extrabold uppercase tracking-wide opacity-70">How others see you</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="scallop h-20 w-20 shrink-0">
          <PhotoImg path={photo} urls={photoUrls} size={64} />
        </div>
        <div>
          <h2 className="font-display text-2xl font-black">{p.first_name}, {p.age}</h2>
          <p className="text-xs font-semibold opacity-70">Going {p.nights} night{p.nights === 1 ? "" : "s"}</p>
        </div>
      </div>
      <ul className="mt-3 flex flex-col gap-1 text-sm font-semibold">
        <li>📍 {p.area ?? "Somewhere nearby"} · {dance}</li>
        <li>💃 {intention}</li>
        {p.languages.length > 0 && <li>🗣️ {p.languages.join(", ")}</li>}
        {p.hometown && <li>🏠 From {p.hometown}</li>}
        {after && <li>🌙 After garba: {after}{diet ? ` · ${diet}` : ""}{p.cuisines.length > 0 ? ` · loves ${p.cuisines.slice(0, 2).join(", ").toLowerCase()}` : ""}</li>}
      </ul>
      {(p.prompt_move || p.prompt_nonneg) && (
        <div className="mt-2 flex flex-col gap-2">
          {p.prompt_move && <p className="rounded-xl border p-2 text-sm"><b>My signature move:</b> {p.prompt_move}</p>}
          {p.prompt_nonneg && <p className="rounded-xl border p-2 text-sm"><b>Non-negotiable:</b> {p.prompt_nonneg}</p>}
        </div>
      )}
      <p className="mt-2 text-xs opacity-70">Your score and reason chips are personal to each viewer — everything else is exactly what they see.</p>
    </div>
  );
}

const SECTIONS = [
  { step: 1, title: "The basics", desc: "City, name, age, area" },
  { step: 2, title: "Garba plans", desc: "Nights, level, intention, distance" },
  { step: 3, title: "About you", desc: "Stars, languages, interests, films" },
  { step: 4, title: "Food taste", desc: "Diet, cuisines, after-garba" },
  { step: 5, title: "What matters", desc: "Weights and dealbreakers" },
  { step: 6, title: "Your card", desc: "Photos, handle, prompts" },
];

export type CardPreview = {
  first_name: string; age: number; area: string | null;
  dance_level: string; intention: string; languages: string[];
  hometown: string | null; diet: string | null; cuisines: string[];
  after_garba: string | null; prompt_move: string | null;
  prompt_nonneg: string | null; photo_paths: string[]; nights: number;
};

export default function AccountPage({ draft, paused, blocked, completeness, preview }: {
  draft: Draft; paused: boolean; blocked: Array<{ id: string; name: string }>; completeness: number;
  preview: CardPreview;
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
      {busy && <DandiyaLoaderScreen label="One sec…" />}
      <div className="mx-auto max-w-xl pt-4">
        <h1 className="headline font-display text-4xl font-black">Account</h1>
        {notice && <div className="mt-3"><Banner icon="🪔">{notice}</Banner></div>}

        <CardPreviewView preview={preview} />

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
            {busy ? (
              <span className="inline-flex items-center gap-2"><DandiyaLoader size={24} /> Working…</span>
            ) : isPaused ? "Unpause my profile" : "Pause my profile"}
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
