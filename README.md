# DandiyaDuo — Find your DandiyaDuo.

A free, seasonal, mutual-match-only garba/dandiya partner finder for Navratri,
in cities across India. All brand, art and copy here are original. Next.js
(App Router, TypeScript) + Supabase + Tailwind, mobile-first.

## Glossary (copy rules)

- **match** stays. **saathi** is now **Duo**; mutual matches are **Duos**
  (`/connections` = “Your Duos”, `/matches` = “Find DandiyaDuo”).
- Dates come from config and are formatted (“21 October”) — never raw ISO.
- Never claim “100% safe”. Say what we do: 18+, mutual-only reveal, one-tap
  report/block, deletion after the festival, no money, no messages sent for you.

## Quick start

1. **Prereqs**: Node 20+, Docker Desktop, Supabase CLI (`npm i -g supabase`).
2. **Start the backend**: `supabase start` (uses ports 553xx — see
   `supabase/config.toml`), then `supabase db reset` to apply migrations +
   seed (`supabase/seeds/onboarding.sql`: 32 cities, all areas, option
   reference — mirrors migration `05`, keep both in sync).
3. **Env**: `Copy-Item .env.example .env.local` and fill in keys from
   `supabase status`. Vars:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY` (server only: photo signing)
   - `NEXT_PUBLIC_SITE_URL` (canonical origin — magic links + metadata)
   - `NEXT_PUBLIC_ENABLE_GOOGLE=1` (optional Google sign-in button)
   - `NEXT_PUBLIC_ANALYTICS_OFF=1` (optional: disable anonymous metrics)
4. **Run**: `npm install`, then `npm run dev` → http://localhost:3000.
5. **Auth**: email magic link + 6-digit code fallback (Supabase Auth). In local
   dev, links land in Mailpit (http://127.0.0.1:55324).
6. **Admin**: insert your user id into `admins` via Studio to unlock
   `/admin/reports`.

## Auth setup (production)

- Supabase Dashboard → Authentication → URL Configuration: set **Site URL**
  to the prod domain; add `{site}/auth/callback` to **Redirect URLs**.
- Email → enable Email provider; configure **custom SMTP** (e.g. Resend)
  with a verified sending domain. Do not use the default Supabase sender or
  `resend.dev` for real users.
- Email Templates → Magic Link: paste `supabase/templates/magic-link.html`
  (+ `.txt` alternative).
- Rate limits: Supabase enforces OTP/email limits; the app adds a 60s resend
  cooldown, a disposable-domain blocklist (`app/login/page.tsx`), and a
  60/min/IP throttle on `/api/metrics`. Extend the blocklist as needed.

## How it works

- Onboarding wizard (`/onboarding`, 6 steps, mirror-dot progress, autosave,
  resumable). Steps 3–5 skippable with defaults; a profile goes live when
  steps 1, 2 and 6 are complete. Step 1 uses the city combobox; areas load
  per city (skipped where a city has none).
- Feed (`/matches`) calls `get_matches(p_city_id, p_include_metro, …)` — the
  only reader of other users' cards. Same-city pool, or same-metro when the
  viewer enabled nearby cities. Instagram handles and dealbreakers never leave
  the server except through `get_connection_instagram` (match only).
- Mutual likes create a `matches` row in one transaction (trigger);
  handles unlock in `/connections` (“Your Duos”).
- Photos live in the private `photos` bucket (`<uid>/…`), served via
  `/api/photo` as 5-minute signed URLs after a visibility check (same city or
  metro, unblocked). Uploads are re-encoded through canvas (strips EXIF/GPS).
- **Photo moderation (plug-in point)**: rows are written `approved=true` in
  this v1. To require review, set `approved=false` on insert in
  `components/Wizard.tsx` and approve from Studio or a moderation edge
  function that calls your moderation API.
- Analytics: anonymous `metrics` rows only (`page_view`, `cta_click`,
  `onboarding_step`, `city_selected`). No trackers, no PII.

## Season reuse (config dates)

`lib/config.ts` holds `SEASON_START`, `SEASON_END`, `WIPE_DATE`
(11–19 Oct 2026, wipe 21 Oct 2026). The `profile_nights` check constraint in
migration `00004` mirrors the season — update both. UI text uses
`lib/festival.ts` (`fmtDay`, `seasonLabel`, `festivalState`) so the landing
automatically shows countdown → live → thank-you + waitlist states.

## Adding a new city / areas

1. Add a row to `cities` (slug, name, state, metro_slug or null,
   `is_launched=true`, next `sort_order`, aliases) — or extend the seed in
   migration `05` and `lib/cities.ts` `STATIC_CITIES` (used for sitemap + `/c`
   static params + offline fallback).
2. Add areas: `insert into areas (city_id, name, zone) select … where slug`.
   10–25 per city where known; cities without areas skip the area signal and
   match as “Anywhere in {city}”.
3. Metro grouping = shared `metro_slug` (e.g. `delhi`, `mumbai`).

## City migration notes (migration 05)

- Legacy `city_t` enum + `profiles.city` / `areas.city` are kept nullable for
  rollback (see the ROLLBACK block at the top of the migration). All new code
  reads/writes `city_id`.
- Tests: `psql $DB -f supabase/tests/multicity.sql` (seed integrity, metro
  grouping, `same_pool` units, RLS posture). RPC behaviour needs a live
  session — see QA checklist.

## Festival wipe (21 October)

- Deploy `supabase/functions/festival-wipe` with `SERVICE_ROLE_KEY` and a
  `WIPE_CRON_SECRET`, then schedule one POST on the wipe date — e.g. with
  pg_cron + pg_net on hosted Supabase, or a CI cron hitting the function URL.
- Do a rehearsal on staging first and confirm backups inherit the retention
  window.
- Waitlist/city-request emails are consent-based and deleted on request
  (reply to any email); leftover rows are cleared with the wipe.

## Deploys (Netlify)

- **Web**: `netlify.toml` builds with `@netlify/plugin-nextjs`. Set the env
  vars above in the Netlify dashboard. City auto-detect reads provider
  geo headers when present (`lib/geo.ts`); no GPS, no IP storage.
- **Backend**: `supabase db push`, `supabase functions deploy festival-wipe`,
  `supabase storage` buckets are created by migration `00003`.

## Manual QA checklist (covers what needs auth)

1. New user in any seeded city finishes the wizard (skipping 3–5) → ranked
   cards with reason chips, never a bare score.
2. A likes B, B likes A → Duo celebration, both handles visible in Duos.
3. Intercept API responses: no other user's handle or dealbreakers appear
   before a match.
4. Block → both vanish from each other's world; pause → hidden from feeds.
5. Metro: user with nearby ON sees cross-city metro Duos; OFF hides them.
6. Thin city (<10 candidates): warming-up nudge + “Widen my search” works.
7. Unseeded city: request flow saves + waitlist flow saves (after festival).
8. `psql < supabase/tests/multicity.sql` passes.
9. Landing at 360px: no overflow; tap targets ≥44px; keyboard-only combobox
   works; `prefers-reduced-motion` kills shimmer + confetti.
