"use client";

import { useState } from "react";
import { DiyaMascot, SunflowerMascot } from "@/components/Mascots";
import { ScoreBadge } from "@/components/ui";
import { photoUrl, type MatchCard } from "@/lib/types";
import { DANCE_LEVELS, INTENTIONS, nightLabel } from "@/lib/config";

const danceLabel = (id: string) => DANCE_LEVELS.find((x) => x.id === id)?.label ?? id;
const intentionLabel = (id: string) => INTENTIONS.find((x) => x.id === id)?.label ?? id;

export function MatchCardView({
  card, onSwipe, onReport, onBlock,
}: {
  card: MatchCard;
  onSwipe: (action: "like" | "pass") => void;
  onReport: () => void;
  onBlock: () => void;
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const photo = card.photo_paths[photoIdx];
  return (
    <article className="sticker-card relative p-4">
      <ScoreBadge score={card.score} />
      <div className="flex items-center gap-3 pr-16">
        <div className="scallop h-20 w-20 shrink-0">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl(photo)} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center"><SunflowerMascot size={64} /></div>
          )}
        </div>
        <div>
          <h3 className="font-display text-2xl font-black">{card.first_name}, {card.age}</h3>
          {card.photo_paths.length > 1 && (
            <div className="flex gap-1" role="group" aria-label="Photos">
              {card.photo_paths.map((_, i) => (
                <button key={i} className="text-link !p-1" aria-label={`Photo ${i + 1}`} onClick={() => setPhotoIdx(i)}>
                  {i === photoIdx ? "●" : "○"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ul className="mt-3 flex flex-col gap-1 text-sm font-semibold">
        <li>📍 {card.area_name ?? "Somewhere nearby"} · {danceLabel(card.dance_level)}</li>
        <li>💃 {intentionLabel(card.intention)}</li>
        {card.languages.length > 0 && <li>🗣️ {card.languages.join(", ")}</li>}
        {card.hometown && <li>🏠 From {card.hometown}</li>}
        {card.after_garba && <li>🌙 After garba: {card.after_garba.replace(/_/g, " ")}</li>}
        {card.shared_nights > 0 && (
          <li>🗓️ {card.shared_nights} shared night{card.shared_nights > 1 ? "s" : ""} ({card.nights.slice(0, 3).map(nightLabel).join(", ")}{card.nights.length > 3 ? "…" : ""})</li>
        )}
      </ul>

      {card.reasons.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Why you match">
          {card.reasons.map((r) => (
            <span key={r} className="rounded-full border-2 px-2.5 py-1 text-xs font-bold" style={{ borderColor: "var(--bark)", background: "#ffd166" }}>
              ✨ {r}
            </span>
          ))}
        </div>
      )}

      {(card.prompt_move || card.prompt_nonneg) && (
        <div className="mt-2 flex flex-col gap-2">
          {card.prompt_move && <p className="rounded-xl border-2 p-2 text-sm" style={{ borderColor: "var(--bark)" }}><b>My signature move:</b> {card.prompt_move}</p>}
          {card.prompt_nonneg && <p className="rounded-xl border-2 p-2 text-sm" style={{ borderColor: "var(--bark)" }}><b>Non-negotiable:</b> {card.prompt_nonneg}</p>}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button className="btn-secondary flex-1" onClick={() => onSwipe("pass")}>Skip</button>
        <button className="btn-primary flex-1" onClick={() => onSwipe("like")}>Let’s dance</button>
      </div>
      <div className="mt-1 flex gap-3">
        <button className="text-link" onClick={onReport}>Report</button>
        <button className="text-link" onClick={onBlock}>Block</button>
      </div>
    </article>
  );
}

export function Celebration({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal aria-label="Mutual match">
      <div className="sticker-card max-w-sm p-6 text-center">
        <div className="flex justify-center gap-2" aria-hidden>
          <DiyaMascot size={70} /><DiyaMascot size={90} /><DiyaMascot size={70} />
        </div>
        <h2 className="headline font-display mt-2 text-4xl font-black">It’s a match!</h2>
        <p className="mt-2 font-semibold">{name} said yes too. Find them in Saathi 🪔</p>
        <button className="btn-primary mt-4 w-full" onClick={onClose}>Say hi in Saathi</button>
      </div>
    </div>
  );
}

export function ReportDialog({
  name, onSubmit, onClose,
}: {
  name: string; onSubmit: (reason: string, details: string) => void; onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal aria-label={`Report ${name}`}>
      <div className="sticker-card w-full max-w-sm p-5">
        <h2 className="font-display text-2xl font-black">Report {name}</h2>
        <label className="label mt-3" htmlFor="rr">What happened?</label>
        <input id="rr" className="field" value={reason} maxLength={120} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Asked for my number before matching" />
        <label className="label mt-3" htmlFor="rd">Details (optional)</label>
        <textarea id="rd" className="field" rows={3} value={details} maxLength={500} onChange={(e) => setDetails(e.target.value)} />
        <div className="mt-4 flex gap-2">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" disabled={reason.trim().length < 3} onClick={() => onSubmit(reason.trim(), details.trim())}>Send report</button>
        </div>
      </div>
    </div>
  );
}
