"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SunflowerMascot } from "@/components/Mascots";
import { CityCombobox } from "@/components/CityCombobox";
import { CityRequestForm } from "@/components/LandingControls";
import { Banner, Card, Chip, PrimaryButton, SecondaryButton } from "@/components/ui";
import { photoUrl, type Area } from "@/lib/types";
import { HANDLE_RE, liveReady, step1Done, step2Done, step6Done, type Draft } from "@/lib/completeness";
import {
  AFTER_GARBA, CUISINES, DANCE_LEVELS, DIETS, GENDERS, HOW_FAR, INTENTIONS,
  INTERESTS, LANGUAGES, MOVIE_GENRES, SEEKINGS, STAR_SIGNS, WEIGHT_MODES, WORKS,
  anywhereLabel, nightLabel, seasonNights,
} from "@/lib/config";
import { seasonLabel, wipeLabel } from "@/lib/festival";
import { track } from "@/lib/analytics";
import type { City } from "@/lib/cities";

const STEP_TITLES = ["The basics", "Garba plans", "About you", "Food taste", "What matters", "Your card"];

/** Legacy 3-value enum for rollback compat; new cities store null. */
const SLUG_TO_LEGACY: Record<string, string> = { bengaluru: "bengaluru", "delhi-ncr": "delhi_ncr", pune: "pune" };

function MirrorDots({ step, total = 6 }: { step: number; total?: number }) {
  return (
    <div className="mirror-dots" role="img" aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <i key={i} className={i < step ? "done" : undefined} />
      ))}
    </div>
  );
}

type Props = {
  userId: string;
  areas: Area[];
  cities: City[];
  initial: Draft;
  initialStep: number;
  initialPhotos: string[];
  isPaused: boolean;
};

export function Wizard({ userId, areas, cities, initial, initialStep, initialPhotos, isPaused }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const editMode = params.get("edit") === "1";
  const [step, setStep] = useState(Math.min(6, Math.max(1, initialStep)));
  const [d, setD] = useState<Draft>(initial);
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState("");
  const [requestingCity, setRequestingCity] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedCity = useMemo(() => cities.find((c) => c.id === d.cityId) ?? null, [cities, d.cityId]);
  const cityAreas = useMemo(() => areas.filter((a) => a.city_id === d.cityId), [areas, d.cityId]);
  const areaRequired = cityAreas.length > 0;
  const metroOn = d.include_nearby && !!selectedCity?.metro_slug;
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const toggle = (k: "nights" | "languages" | "cuisines" | "movie_genres" | "interests", v: string) =>
    setD((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));

  // debounced autosave of the current step
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void saveAll(d, step, true), 1200);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d]);

  async function saveAll(draft: Draft, uptoStep: number, silent = false) {
    if (!silent) { setBusy(true); setError(null); }
    try {
      const supabase = createClient();
      const areaReq = areas.some((a) => a.city_id === draft.cityId);
      const live = liveReady(draft, areaReq);
      const { error: pErr } = await supabase.from("profiles").upsert({
        id: userId,
        first_name: draft.first_name.trim() || "Dancer",
        age: typeof draft.age === "number" ? draft.age : 18,
        gender: draft.gender || "woman",
        seeking: draft.seeking || "anyone",
        city: SLUG_TO_LEGACY[draft.citySlug] ?? null,
        city_id: draft.cityId || null,
        area_id: draft.area_id || null,
        dance_level: draft.dance_level || "first_timer",
        intention: draft.intention || "just_dance",
        how_far: draft.how_far || "anywhere",
        include_nearby: draft.include_nearby,
        star_sign: draft.star_sign,
        hometown: draft.hometown.trim() || null,
        work: draft.work || null,
        fav_movie: draft.fav_movie.trim() || null,
        diet: draft.diet || null,
        after_garba: draft.after_garba || null,
        venue_text: draft.venue_text.trim() || null,
        prompt_move: draft.prompt_move.trim() || null,
        prompt_nonneg: draft.prompt_nonneg.trim() || null,
        weight_star: draft.weight_star,
        weight_food: draft.weight_food,
        show_languages: draft.show_languages,
        show_hometown: draft.show_hometown,
        show_food: draft.show_food,
        onboarding_step: Math.min(6, Math.max(uptoStep, 1)),
        is_live: live && !isPaused,
      }, { onConflict: "id" });
      if (pErr) throw pErr;

      const setLinks = async (table: string, col: string, values: string[]) => {
        const sb = createClient();
        await sb.from(table).delete().eq("profile_id", userId);
        if (values.length) await sb.from(table).insert(values.map((v) => ({ profile_id: userId, [col]: v })));
      };
      await setLinks("profile_nights", "night", draft.nights);
      await setLinks("profile_languages", "lang", draft.languages);
      await setLinks("profile_cuisines", "cuisine", draft.cuisines);
      await setLinks("profile_movie_genres", "genre", draft.movie_genres);
      await setLinks("profile_interests", "label", [...draft.interests, ...draft.customInterests]);

      const ageNum = typeof draft.age === "number" ? draft.age : 22;
      await supabase.from("dealbreakers").upsert({
        profile_id: userId,
        age_min: typeof draft.age_min === "number" ? draft.age_min : Math.max(18, ageNum - 5),
        age_max: typeof draft.age_max === "number" ? draft.age_max : ageNum + 8,
        diet_rule: draft.diet_rule || "any",
        min_dance_level: draft.min_dance_level || "first_timer",
        must_share_language: draft.must_share_language,
      }, { onConflict: "profile_id" });

      if (draft.instagram.trim()) {
        await supabase.from("profile_instagram").upsert(
          { profile_id: userId, handle: draft.instagram.trim().replace(/^@/, "") },
          { onConflict: "profile_id" });
      }
      return true;
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : "Couldn’t save. Try again.");
      return false;
    } finally {
      if (!silent) setBusy(false);
    }
  }

  async function next() {
    if (step === 1 && !step1Done(d, areaRequired)) { setError("Fill the basics: your city, the 18+ tick, name, age, who you are, who you seek" + (areaRequired ? ", and your area." : ".")); return; }
    if (step === 2 && !step2Done(d)) { setError("Pick at least one night and your dance style."); return; }
    const ok = await saveAll(d, step + 1);
    if (ok) {
      track("onboarding_step", { step: step + 1 > 6 ? 6 : step + 1 });
      if (step === 6) {
        if (!step6Done(d)) { setError("Add your Instagram handle and tick all three consent boxes to go live."); return; }
        router.push(editMode ? "/account" : "/matches");
      } else setStep(step + 1);
    }
  }

  async function uploadPhoto(file: File) {
    if (photos.length >= 3) { setError("Three photos max — looking sharp already."); return; }
    setBusy(true); setError(null);
    try {
      // Re-encode through canvas: strips EXIF/GPS and caps size.
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1080 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
      if (!blob) throw new Error("Couldn’t read that photo.");
      const name = `${userId}/${crypto.randomUUID()}.jpg`;
      const supabase = createClient();
      const { error: uErr } = await supabase.storage.from("photos").upload(name, blob, { contentType: "image/jpeg" });
      if (uErr) throw uErr;
      // v1 moderation hook: rows start approved; plug a moderation API here
      // (see README) to flip approved=false pending review.
      const { error: iErr } = await supabase.from("photos").insert({
        profile_id: userId, storage_path: name, position: photos.length, approved: true,
      });
      if (iErr) throw iErr;
      setPhotos((p) => [...p, name]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally { setBusy(false); }
  }

  async function removePhoto(path: string) {
    const supabase = createClient();
    await supabase.from("photos").delete().eq("profile_id", userId).eq("storage_path", path);
    await supabase.storage.from("photos").remove([path]);
    setPhotos((p) => p.filter((x) => x !== path));
  }

  return (
    <div className="mx-auto w-full max-w-[560px] pt-4">
      <MirrorDots step={step} />
      <p className="mt-2 text-center text-sm font-bold muted">Step {step} of 6 · {STEP_TITLES[step - 1]}</p>

      <Card className="mt-4">
        {error && <div className="mb-3"><Banner icon="⚠️" tone="light">{error}</Banner></div>}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <span className="label" id="city-label">Which city?</span>
              <CityCombobox
                cities={cities}
                value={selectedCity}
                onChange={(c) => { set("citySlug", c?.slug ?? ""); set("cityId", c?.id ?? ""); set("area_id", ""); if (c) track("city_selected", { slug: c.slug, from: "onboarding" }); }}
                onRequestCity={() => setRequestingCity((s) => !s)}
                placeholder="Type your city…"
              />
              {requestingCity && (
                <div className="mt-1">
                  <CityRequestForm tone="light" onDone={() => setRequestingCity(false)} />
                </div>
              )}
            </div>
            <label className="flex items-start gap-2 font-semibold">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-[#FF4F8B]" checked={d.ageConfirmed} onChange={(e) => set("ageConfirmed", e.target.checked)} />
              I confirm I’m 18 years or older.
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="fn">First name</label>
                <input id="fn" className="field" value={d.first_name} maxLength={40} onChange={(e) => set("first_name", e.target.value)} placeholder="Meera" /></div>
              <div><label className="label" htmlFor="age">Age</label>
                <input id="age" className="field" type="number" min={18} max={100} value={d.age} onChange={(e) => set("age", e.target.value === "" ? "" : Number(e.target.value))} /></div>
            </div>
            <div>
              <span className="label">I am a…</span>
              <div className="flex flex-wrap gap-2">
                {GENDERS.map((g) => <Chip key={g.id} selected={d.gender === g.id} onClick={() => set("gender", g.id)}>{g.label}</Chip>)}
              </div>
            </div>
            <div>
              <span className="label">I want to dance with…</span>
              <div className="flex flex-wrap gap-2">
                {SEEKINGS.map((s) => <Chip key={s.id} selected={d.seeking === s.id} onClick={() => set("seeking", s.id)}>{s.label}</Chip>)}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="area">My area</label>
              {areaRequired ? (
                <select id="area" className="field" value={d.area_id} onChange={(e) => set("area_id", e.target.value)}>
                  <option value="">Pick your neighbourhood…</option>
                  {cityAreas.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.zone}</option>)}
                </select>
              ) : (
                <p className="on-light-muted text-sm">
                  {selectedCity ? `Anywhere in ${selectedCity.name} — we'll skip the area signal for you.` : "Pick a city first."}
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <span className="label">Nights I’m going ({seasonLabel()})</span>
              <div className="flex flex-wrap gap-2">
                {seasonNights().map((n) => (
                  <Chip key={n} selected={d.nights.includes(n)} onClick={() => toggle("nights", n)}>{nightLabel(n)}</Chip>
                ))}
              </div>
            </div>
            <div>
              <span className="label">Dance level</span>
              <div className="flex flex-wrap gap-2">
                {DANCE_LEVELS.map((x) => <Chip key={x.id} selected={d.dance_level === x.id} onClick={() => set("dance_level", x.id)}>{x.label}</Chip>)}
              </div>
            </div>
            <div>
              <span className="label">Tonight’s intention</span>
              <div className="flex flex-wrap gap-2">
                {INTENTIONS.map((x) => <Chip key={x.id} selected={d.intention === x.id} onClick={() => set("intention", x.id)}>{x.label}</Chip>)}
              </div>
            </div>
            <div>
              <span className="label">How far will you pull up?</span>
              <div className="flex flex-wrap gap-2">
                {HOW_FAR.map((x) => (
                  <Chip key={x.id} selected={d.how_far === x.id} onClick={() => set("how_far", x.id)}>
                    {x.id === "anywhere" ? anywhereLabel(metroOn) : x.label}
                  </Chip>
                ))}
              </div>
              <p className="on-light-muted mt-1 text-xs">Travelling widely means more Duos.</p>
            </div>
            {selectedCity?.metro_slug && (
              <Toggle
                label={`Include nearby cities (${selectedCity.metro_slug === "delhi" ? "Delhi, Gurugram, Noida" : "Mumbai, Thane, Navi Mumbai"})`}
                value={d.include_nearby}
                onChange={(v) => set("include_nearby", v)}
              />
            )}
            <div>
              <label className="label" htmlFor="venue">Venue or event name (optional)</label>
              <input id="venue" className="field" value={d.venue_text} maxLength={120} onChange={(e) => set("venue_text", e.target.value)} placeholder="Somewhere else" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <SkipNote />
            <div>
              <span className="label">Star sign</span>
              <div className="flex flex-wrap gap-2">
                {STAR_SIGNS.map((s) => <Chip key={s.n} selected={d.star_sign === s.n} onClick={() => set("star_sign", d.star_sign === s.n ? null : s.n)}>{s.glyph} {s.label}</Chip>)}
              </div>
            </div>
            <div>
              <span className="label">Languages</span>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => <Chip key={l} selected={d.languages.includes(l)} onClick={() => toggle("languages", l)}>{l}</Chip>)}
              </div>
              <Toggle label="Show on my profile" value={d.show_languages} onChange={(v) => set("show_languages", v)} />
            </div>
            <div className="grid gap-3">
              <div><label className="label" htmlFor="home">Hometown</label>
                <input id="home" className="field" value={d.hometown} maxLength={60} onChange={(e) => set("hometown", e.target.value)} placeholder="State or city" /></div>
              <Toggle label="Show on my profile" value={d.show_hometown} onChange={(v) => set("show_hometown", v)} />
            </div>
            <div>
              <span className="label">Work</span>
              <div className="flex flex-wrap gap-2">
                {WORKS.map((w) => <Chip key={w} selected={d.work === w} onClick={() => set("work", d.work === w ? "" : w)}>{w}</Chip>)}
              </div>
            </div>
            <div>
              <span className="label">Interests</span>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => <Chip key={i} selected={d.interests.includes(i)} onClick={() => toggle("interests", i)}>{i}</Chip>)}
                {d.customInterests.map((c) => <Chip key={c} selected onClick={() => set("customInterests", d.customInterests.filter((x) => x !== c))}>{c} ✕</Chip>)}
              </div>
              {d.customInterests.length < 5 && (
                <div className="mt-2 flex gap-2">
                  <input className="field" value={customInput} maxLength={20} onChange={(e) => setCustomInput(e.target.value)} placeholder="Add your own (max 20 chars)" />
                  <SecondaryButton className="btn-on-light" onClick={() => { const v = customInput.trim(); if (v && !d.customInterests.includes(v)) set("customInterests", [...d.customInterests, v]); setCustomInput(""); }}>Add</SecondaryButton>
                </div>
              )}
            </div>
            <div>
              <span className="label">Movie genres</span>
              <div className="flex flex-wrap gap-2">
                {MOVIE_GENRES.map((g) => <Chip key={g} selected={d.movie_genres.includes(g)} onClick={() => toggle("movie_genres", g)}>{g}</Chip>)}
              </div>
              <label className="label mt-3" htmlFor="favm">One favourite movie</label>
              <input id="favm" className="field" value={d.fav_movie} maxLength={100} onChange={(e) => set("fav_movie", e.target.value)} placeholder="The one you quote" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <SkipNote />
            <div>
              <span className="label">Diet</span>
              <div className="flex flex-wrap gap-2">
                {DIETS.map((x) => <Chip key={x.id} selected={d.diet === x.id} onClick={() => set("diet", d.diet === x.id ? "" : x.id)}>{x.label}</Chip>)}
              </div>
            </div>
            <div>
              <span className="label">Favourite cuisines</span>
              <div className="flex flex-wrap gap-2">
                {CUISINES.map((c) => <Chip key={c} selected={d.cuisines.includes(c)} onClick={() => toggle("cuisines", c)}>{c}</Chip>)}
              </div>
            </div>
            <div>
              <span className="label">After garba we’re going for…</span>
              <div className="flex flex-wrap gap-2">
                {AFTER_GARBA.map((x) => <Chip key={x.id} selected={d.after_garba === x.id} onClick={() => set("after_garba", d.after_garba === x.id ? "" : x.id)}>{x.label}</Chip>)}
              </div>
            </div>
            <Toggle label="Show on my profile" value={d.show_food} onChange={(v) => set("show_food", v)} />
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-4">
            <SkipNote />
            <Banner icon="🔒" tone="light">Private. Never shown to anyone.</Banner>
            <WeightRow label="Star signs" value={d.weight_star} onChange={(v) => set("weight_star", v)} />
            <WeightRow label="Food" value={d.weight_food} onChange={(v) => set("weight_food", v)} />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="amin">Age from</label>
                <input id="amin" type="number" min={18} className="field" value={d.age_min} onChange={(e) => set("age_min", e.target.value === "" ? "" : Number(e.target.value))} /></div>
              <div><label className="label" htmlFor="amax">Age to</label>
                <input id="amax" type="number" min={18} className="field" value={d.age_max} onChange={(e) => set("age_max", e.target.value === "" ? "" : Number(e.target.value))} /></div>
            </div>
            <div>
              <span className="label">Diet rule</span>
              <div className="flex flex-wrap gap-2">
                {[["any", "Any"], ["same_only", "Same diet only"], ["veg_friendly", "Veg-friendly only"]].map(([id, label]) => (
                  <Chip key={id} selected={d.diet_rule === id} onClick={() => set("diet_rule", id)}>{label}</Chip>
                ))}
              </div>
            </div>
            <div>
              <span className="label">Minimum dance level</span>
              <div className="flex flex-wrap gap-2">
                {[["first_timer", "First-timer is fine"], ["basic_taali", "Knows the basic taali"], ["circle_lead", "Circle leaders only"]].map(([id, label]) => (
                  <Chip key={id} selected={d.min_dance_level === id} onClick={() => set("min_dance_level", id)}>{label}</Chip>
                ))}
              </div>
            </div>
            <Toggle label="Must share a language" value={d.must_share_language} onChange={(v) => set("must_share_language", v)} />
          </div>
        )}

        {step === 6 && (
          <div className="flex flex-col gap-4">
            <div>
              <span className="label">Photos (up to 3, optional)</span>
              <div className="flex gap-3">
                {photos.map((p) => (
                  <div key={p} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoUrl(p)} alt="Your upload" className="avatar-ring h-24 w-24 object-cover" />
                    <button className="text-link" onClick={() => void removePhoto(p)}>Remove</button>
                  </div>
                ))}
                {photos.length < 3 && (
                  <label className="avatar-ring flex h-24 w-24 cursor-pointer items-center justify-center text-3xl" style={{ color: "var(--ink)" }} aria-label="Add a photo">
                    +
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadPhoto(f); e.target.value = ""; }} />
                  </label>
                )}
                {photos.length === 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <SunflowerMascot size={48} />
                    <span>No photo? Sunny fills in as your avatar.</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="ig">Instagram handle</label>
              <input
                id="ig" className="field" value={d.instagram} maxLength={31}
                onChange={(e) => set("instagram", e.target.value.replace(/^@/, ""))}
                placeholder="your.handle" autoComplete="off"
              />
              {!HANDLE_RE.test(d.instagram.trim()) && d.instagram.length > 0 && (
                <p className="mt-1 text-xs font-bold text-[var(--crimson)]">Letters, numbers, dots and underscores, max 30.</p>
              )}
              <p className="mt-1 text-xs">Only revealed when you both say yes.</p>
            </div>
            <div>
              <label className="label" htmlFor="pm">My signature garba move is… (optional)</label>
              <input id="pm" className="field" value={d.prompt_move} maxLength={80} onChange={(e) => set("prompt_move", e.target.value)} placeholder="The spin that ends friendships" />
            </div>
            <div>
              <label className="label" htmlFor="pn">My Navratri non-negotiable… (optional)</label>
              <input id="pn" className="field" value={d.prompt_nonneg} maxLength={80} onChange={(e) => set("prompt_nonneg", e.target.value)} placeholder="Front row for aarti" />
            </div>
            <div className="flex flex-col gap-2 text-sm font-semibold">
              <label className="flex items-start gap-2"><input type="checkbox" className="mt-1 h-5 w-5 accent-[#FF4F8B]" checked={d.consentTerms} onChange={(e) => set("consentTerms", e.target.checked)} /> I accept the Terms.</label>
              <label className="flex items-start gap-2"><input type="checkbox" className="mt-1 h-5 w-5 accent-[#FF4F8B]" checked={d.consentPrivacy} onChange={(e) => set("consentPrivacy", e.target.checked)} /> I accept the Privacy notice.</label>
              <label className="flex items-start gap-2"><input type="checkbox" className="mt-1 h-5 w-5 accent-[#FF4F8B]" checked={d.consentWipe} onChange={(e) => set("consentWipe", e.target.checked)} /> I know my data is deleted {wipeLabel()}.</label>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <SecondaryButton disabled={step === 1 || busy} onClick={() => void saveAll(d, step).then(() => setStep(step - 1))} className="btn-on-light">
            Back
          </SecondaryButton>
          {[3, 4, 5].includes(step) ? (
            <div className="flex items-center gap-3">
              <button className="text-link" onClick={() => setStep(step + 1)}>Skip for now</button>
              <PrimaryButton disabled={busy} onClick={() => void next()}>{busy ? "Saving…" : step === 6 ? (editMode ? "Save" : "Start matching") : "Next"}</PrimaryButton>
            </div>
          ) : (
            <PrimaryButton disabled={busy} onClick={() => void next()}>{busy ? "Saving…" : step === 6 ? (editMode ? "Save" : "Start matching") : "Next"}</PrimaryButton>
          )}
        </div>
      </Card>
    </div>
  );
}

function SkipNote() {
  return <p className="text-xs font-semibold opacity-80">Defaults are fine here — tweak later from Account if you like.</p>;
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="mt-2 flex items-center gap-2 text-sm font-semibold">
      <input type="checkbox" className="h-5 w-5 accent-[#FF4F8B]" checked={value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function WeightRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex flex-wrap gap-2">
        {WEIGHT_MODES.map((w) => <Chip key={w.label} selected={value === w.id} onClick={() => onChange(w.id)}>{w.label}</Chip>)}
      </div>
    </div>
  );
}
