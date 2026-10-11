import Link from "next/link";
import { Duo } from "@/components/Duo";
import { HeroCta, TrackView, WaitlistForm } from "@/components/LandingControls";
import { en } from "@/lib/strings";
import { festivalState, seasonLabel, wipeLabel } from "@/lib/festival";

export function FestivalBadge() {
  const s = festivalState();
  if (s.phase === "before") {
    return (
      <p className="inline-block rounded-full px-4 py-1.5 text-sm font-bold" style={{ background: "rgba(255,182,39,.16)", border: "1px solid rgba(255,182,39,.5)", color: "var(--marigold)" }}>
        {en.badgeBefore(s.daysToStart)} · {seasonLabel()}
      </p>
    );
  }
  if (s.phase === "during") {
    return (
      <div className="flex flex-col items-center gap-1">
        <p className="inline-block rounded-full px-4 py-1.5 text-sm font-bold" style={{ background: "rgba(255,79,139,.16)", border: "1px solid rgba(255,79,139,.55)", color: "var(--pink)" }}>
          {en.badgeDuring(s.nightsLeft)}
        </p>
        <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>{en.tonightLine}</p>
      </div>
    );
  }
  return null;
}

function SampleCard() {
  return (
    <div className="card relative mx-auto max-w-sm p-5 text-left">
      <span className="absolute left-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide" style={{ background: "var(--night)", color: "var(--cream)" }}>
        {en.sampleLabel}
      </span>
      <div className="vibe-badge" aria-hidden>
        <div className="leading-tight">
          <div className="font-display text-lg font-extrabold">87%</div>
          <div className="text-[10px] font-bold">vibe</div>
        </div>
      </div>
      <h3 className="font-display mt-6 text-2xl font-extrabold">Meera, 24</h3>
      <p className="text-sm font-semibold on-light-muted">Kothrud · Knows the basic taali</p>
      <p className="mt-1 text-sm font-semibold on-light-muted">Looking for a group · 3 shared nights</p>
      <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Example reasons">
        {["both love north indian", "fire + air signs", "You'd pull up to them"].map((r) => (
          <span key={r} className="reason-chip">✨ {r}</span>
        ))}
      </div>
      <div className="mt-3 flex gap-2" aria-hidden>
        <span className="btn-secondary btn-on-light flex-1 !min-h-[44px] text-center text-sm">Skip</span>
        <span className="btn-primary flex-1 !min-h-[44px] text-center text-sm">Let’s dance</span>
      </div>
    </div>
  );
}

export function LandingContent({
  city,
  page,
}: {
  city?: { slug: string; name: string } | null;
  page: "home" | "city";
}) {
  const s = festivalState();
  const after = s.phase === "after";

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <TrackView event="page_view" meta={city ? { page: "city", slug: city.slug } : { page: "home" }} />

      {/* a) Hero */}
      <section className="shisha shisha-animated relative -mx-4 px-4 pb-8 pt-8 text-center md:-mx-8 md:px-8">
        <FestivalBadge />
        <div className="mt-3 flex justify-center" aria-hidden={false}>
          <Duo size={190} />
        </div>
        <h1 className="headline font-display mt-3 text-5xl font-extrabold sm:text-6xl">
          {en.heroH1a}
          <span className="accent">{en.heroH1b}</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-lg font-medium" style={{ color: "var(--muted)" }}>
          {en.heroSub}
        </p>
        {city && (
          <p className="mt-2 text-base font-bold" style={{ color: "var(--marigold)" }}>
            {city.name}’s garba circle is warming up.
          </p>
        )}
        {after ? (
          <div className="mt-5">
            <h2 className="headline font-display text-3xl font-extrabold">{en.afterThanks}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--muted)" }}>{en.afterThanksSub}</p>
            <div className="mt-4"><WaitlistForm /></div>
          </div>
        ) : (
          <HeroCta citySlug={city?.slug} />
        )}
      </section>

      {/* b) How it works */}
      <section id="how-it-works" className="mt-10 scroll-mt-6">
        <h2 className="headline font-display text-center text-3xl font-extrabold">How it works</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {en.howSteps.map((st, i) => (
            <li key={st.title} className="card p-4">
              <p className="font-display text-2xl font-extrabold" style={{ color: "var(--pink)" }}>{i + 1}</p>
              <h3 className="font-display text-lg font-bold">{st.title}</h3>
              <p className="mt-1 text-sm on-light-muted">{st.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* c) Why it works */}
      <section className="mt-10">
        <h2 className="headline font-display text-center text-3xl font-extrabold">Why it works</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {en.whyCards.map((c) => (
            <div key={c.title} className="card p-4">
              <h3 className="font-display text-lg font-bold">{c.title}</h3>
              <p className="mt-1 text-sm on-light-muted">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* d) Sample match card */}
      <section className="mt-10 text-center">
        <h2 className="headline font-display text-3xl font-extrabold">A Duo card, up close</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Every card shows the score and the reasons. Never a bare number.</p>
        <div className="mt-4"><SampleCard /></div>
      </section>

      {/* e) Safety strip */}
      <section className="mt-10 rounded-3xl p-5 text-center" style={{ background: "rgba(255,243,224,.06)", border: "1px solid var(--line-dark)" }}>
        <h2 className="headline font-display text-2xl font-extrabold">{en.safetyStrip.title}</h2>
        <ul className="mt-2 flex flex-wrap justify-center gap-2">
          {en.safetyStrip.items.map((t) => (
            <li key={t} className="rounded-full px-3 py-1.5 text-sm font-bold" style={{ background: "rgba(31,182,166,.14)", border: "1px solid rgba(31,182,166,.5)", color: "var(--teal)" }}>{t}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>Profiles, photos and matches are deleted {wipeLabel()}.</p>
        <Link href="/safety" className="text-link mt-1 inline-block text-sm font-bold" style={{ color: "var(--marigold)" }}>{en.safetyStrip.link} →</Link>
      </section>

      {/* f) FAQ */}
      <section className="mt-10">
        <h2 className="headline font-display text-center text-3xl font-extrabold">Questions, answered</h2>
        <div className="mt-4 flex flex-col gap-2">
          {en.faq.map((f) => (
            <details key={f.q} className="card !rounded-2xl p-4">
              <summary className="cursor-pointer font-bold">{f.q}</summary>
              <p className="mt-2 text-sm on-light-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* g) Final CTA */}
      {!after && (
        <section className="mt-10 rounded-3xl p-6 text-center" style={{ background: "linear-gradient(135deg, rgba(255,79,139,.22), rgba(255,182,39,.16))", border: "1px solid var(--line-dark)" }}>
          <h2 className="headline font-display text-3xl font-extrabold">{en.finalCta}</h2>
          <p className="mt-1 font-display text-xl font-bold" style={{ color: "var(--marigold)" }}>Chalo dance!</p>
          <div className="mt-3">
            <Link href={city ? `/onboarding?city=${city.slug}` : "/onboarding"} className="btn-primary">
              {en.ctaPrimary}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

export function OrgJsonLd({ base }: { base: string }) {
  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "DandiyaDuo",
        url: base,
        logo: `${base}/icon.svg`,
        contactPoint: { "@type": "ContactPoint", contactType: "grievance" },
      },
      { "@type": "WebSite", name: "DandiyaDuo", url: base },
    ],
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  );
}
