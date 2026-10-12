# AGENTS.md — DandiyaDuo

Next.js 15 (App Router, TS) + Supabase + Tailwind, mobile-first. Seasonal mutual-match garba finder. No lint/typecheck/test scripts — only `dev`, `build`, `start`.

## Setup (order matters)

1. Prereqs: Node 20+, Docker Desktop, Supabase CLI.
2. `supabase start` (local backend on **553xx** ports, see `supabase/config.toml`), then `supabase db reset` (applies `supabase/migrations/*` + `supabase/seed.sql`).
3. `Copy-Item .env.example .env.local`, fill from `supabase status`. Keys are **new-style**: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` + server-only `SUPABASE_SECRET_KEY` (not anon/service_role names). Also set `NEXT_PUBLIC_SITE_URL`.
4. `npm install`, `npm run dev` → http://localhost:3000.

Local auth is email magic link; links land in Mailpit http://127.0.0.1:55324. Admin = insert own uid into `admins` table via Studio → unlocks `/admin/reports`.

## Verify

- Web: `npm run build` (no lint/typecheck configured).
- DB logic: `supabase db reset` then `psql <conn> < supabase/tests/matching_tests.sql` (pure-function + policy assertions; RPC filter behavior needs the README manual QA with real auth).
- Manual QA (needs auth): wizard → ranked cards with reason chips, mutual like → celebration + handles in Duos, block/pause hiding, intercept API responses for handle/dealbreaker leaks (see README checklist).

## Architecture / gotchas

- Routes: `app/` — public `page|login|safety|privacy|terms`, protected (`middleware.ts`) `onboarding|matches|connections|account|admin`. Auth callback is the only route handler: `app/auth/callback/route.ts`. No `app/api/*` (old `/api/photo` was removed).
- Supabase clients: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (`createClient` + `createServiceClient`). Path alias `@/*` → repo root (`tsconfig.json`, `next.config.js`).
- **Privacy model — do not break:** `get_matches(p_city text, …)` RPC is the ONLY reader of other users' cards; `get_connection_instagram` is the ONLY handle leak (match-only). `profile_instagram` is owner-only by RLS. Never select other users' handles/dealbreakers directly.
- **Hard invariants (migration `...12_security_hardening.sql`):** `score_for`/`is_matched` are definer-only (revoked from anon/authenticated — internal callers still work); swipes are written ONLY via `record_swipe` (client policy is read-only); direct report inserts must be fresh/`open`; any `blocks` insert deletes the pair's `matches` row via trigger. `is_admin()` stays executable (RLS policies need it).
- **Photos:** private `photos` bucket, paths `<uid>/…`. Client signs with own session via `lib/photos.ts` `signPhotoPaths`/`useSignedPhotos` (30-min TTL); access governed by storage RLS (`private.can_view_photos_of` + `approved` flag, migration `...11_photo_rls.sql`). `SUPABASE_SECRET_KEY` is NOT used for photos. Uploads re-encode through canvas to strip EXIF/GPS.
- **Wizard:** `components/Wizard.tsx` + `lib/completeness.ts` (`liveReady` = steps 1+2+6; steps 3–5 skippable with defaults). Photo rows default `approved=true` (v1); to require moderation set `approved=false` on insert.
- **Season reuse:** `lib/config.ts` (`SEASON_START/END`, `WIPE_DATE`, `CITIES`, all option lists) is the source of truth for enums/chips; `areas.city`/`profiles.city` are free text — new cities need only `CITIES` + `seed.sql` rows. BUT `profile_nights` check constraint (migration `...00004`) mirrors the season — update both together. Scores compute live per request; `matches` rows snapshot at creation.
- **Festival wipe:** `supabase/functions/festival-wipe/index.ts` (needs `SERVICE_ROLE_KEY` + `WIPE_CRON_SECRET`, POST-only). Schedule one call on `WIPE_DATE`; rehearse on staging first.

## Conventions

- `supabase/seed.sql` header documents which option lists are tables vs `lib/config.ts` constants — read it before adding options.
- Migrations are numbered `20261011…`/`20261012…` and carry rollback notes in header comments; follow that pattern. `get_matches` signature history (city_t → text, ambiguity fix in `...09`) — keep single `p_city text` overload.
- `.env*` is gitignored (example committed); never commit local keys.

## Commit msg
At the end of every significant task, provide a summarized commit msg for all the changes done