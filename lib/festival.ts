import { SEASON_END, SEASON_START, WIPE_DATE } from "./config";

const DAY = 86_400_000;

function dayStart(iso: string) {
  return new Date(`${iso}T00:00:00Z`).getTime();
}

/** "2026-10-21" -> "21 October". Never print raw ISO dates in UI. */
export function fmtDay(iso: string): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const [y, m, d] = iso.split("-").map(Number);
  void y;
  return `${d} ${months[m - 1]}`;
}

/** "11–19 October" derived from config (same-month assumption documented). */
export function seasonLabel(): string {
  const [sy, sm, sd] = SEASON_START.split("-").map(Number);
  const [ey, em, ed] = SEASON_END.split("-").map(Number);
  void sy; void ey;
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  if (sm === em) return `${sd}–${ed} ${months[sm - 1]}`;
  return `${sd} ${months[sm - 1]} – ${ed} ${months[em - 1]}`;
}

export function wipeLabel(): string {
  return fmtDay(WIPE_DATE);
}

export type FestivalPhase = "before" | "during" | "after";

export function festivalState(now: Date = new Date()): {
  phase: FestivalPhase;
  daysToStart: number;
  nightsLeft: number;
} {
  const t = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = dayStart(SEASON_START);
  const end = dayStart(SEASON_END);
  if (t < start) return { phase: "before", daysToStart: Math.round((start - t) / DAY), nightsLeft: 0 };
  if (t <= end) return { phase: "during", daysToStart: 0, nightsLeft: Math.round((end - t) / DAY) + 1 };
  return { phase: "after", daysToStart: 0, nightsLeft: 0 };
}
