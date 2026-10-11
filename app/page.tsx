import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { SunflowerMascot, DiyaMascot } from "@/components/Mascots";
import { Banner, Card } from "@/components/ui";
import { CITIES, SEASON_LABEL, WIPE_DATE, cityLabel } from "@/lib/config";

type Props = { searchParams: Promise<{ city?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { city } = await searchParams;
  const valid = CITIES.some((c) => c.id === city);
  const base = "DandiyaDuo — Find your circle this Navratri";
  return {
    title: valid ? `${base} in ${cityLabel(city)}` : base,
    description: valid
      ? `A free, mutual-match-only garba partner finder for Navratri (${SEASON_LABEL}) in ${cityLabel(city)}.`
      : `A free, mutual-match-only garba partner finder for Navratri (${SEASON_LABEL}) in Bengaluru, Delhi NCR and Pune.`,
  };
}

export default async function Landing({ searchParams }: Props) {
  const { city } = await searchParams;
  const active = CITIES.some((c) => c.id === city) ? city! : "bengaluru";

  return (
    <AppShell showNav={false}>
      <div className="mx-auto max-w-2xl pt-6 text-center">
        <div className="flex justify-center">
          <SunflowerMascot size={110} />
        </div>
        <h1 className="headline font-display mt-2 text-5xl font-black sm:text-6xl">
          Find your circle this Navratri
        </h1>
        <p className="mt-3 text-lg font-semibold">
          {SEASON_LABEL} · Free · Mutual match only
        </p>

        <div className="mt-5 flex justify-center gap-2" role="tablist" aria-label="Choose your city">
          {CITIES.map((c) => (
            <Link
              key={c.id}
              href={`/?city=${c.id}`}
              role="tab"
              aria-selected={c.id === active}
              className="chip"
              data-selected={c.id === active}
              style={c.id === active ? { background: "var(--bark)", color: "#ffd166" } : undefined}
            >
              {c.label}
            </Link>
          ))}
        </div>
        <h2 className="mt-4 text-xl font-bold">Looking for a garba match in {cityLabel(active)}?</h2>

        <Banner icon="🪔">
          <span>
            18+ only. Your Instagram stays hidden until you <em>both</em> say yes. Everything is
            deleted on {WIPE_DATE}.
          </span>
        </Banner>

        <div className="mt-5">
          <Link href={`/onboarding?city=${active}`} className="btn-primary">
            Create my profile
          </Link>
        </div>

        <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
          <Card>
            <div className="text-2xl" aria-hidden>🎯</div>
            <h3 className="font-display text-lg font-bold">One score, real reasons</h3>
            <p className="text-sm">Nights, distance, food, films and stars turn into a vibe score with reasons you can read.</p>
          </Card>
          <Card>
            <div className="text-2xl" aria-hidden>🔒</div>
            <h3 className="font-display text-lg font-bold">Private by design</h3>
            <p className="text-sm">Your handle unlocks only on a mutual yes. Report or block anyone in one tap.</p>
          </Card>
          <Card>
            <div className="text-2xl" aria-hidden>🧹</div>
            <h3 className="font-display text-lg font-bold">Gone after the festival</h3>
            <p className="text-sm">Profiles, photos and matches are wiped on {WIPE_DATE}. No leftovers.</p>
          </Card>
        </div>

        <div className="mt-8 flex justify-center">
          <DiyaMascot size={90} />
        </div>
      </div>
    </AppShell>
  );
}
