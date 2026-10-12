# DandiyaDuo — find your circle this Navratri

A free, seasonal, mutual-match-only garba/dandiya partner finder for Navratri
(11–19 Oct 2026) in Bengaluru, Delhi NCR and Pune. All brand, art and copy
here are original. Next.js (App Router, TypeScript) + Supabase + Tailwind,
mobile-first.

## Quick start

1. **Prereqs**: Node 20+, Docker Desktop, Supabase CLI (`npm i -g supabase`).
2. **Start the backend**: `supabase start` (uses ports 553xx — see
   `supabase/config.toml`), then `supabase db reset` to apply migrations +
   seed areas.
3. **Env**: `Copy-Item .env.example .env.local` and fill in keys from
   `supabase status`. For production, point the three vars at your hosted
   project and set `NEXT_PUBLIC_SITE_URL`.
4. **Run**: `npm install`, then `npm run dev` → http://localhost:3000.
5. **Auth**: email magic link (Supabase Auth). In local dev, links land in
   Mailpit (http://127.0.0.1:55324). Enable the Email provider and set the
   redirect allow-list to your site URL in production.
6. **Admin**: insert your user id into `admins` via Studio to unlock
   `/admin/reports`.

## How it works

- Onboarding wizard (`/onboarding`, 6 steps, diya progress, autosave,
  resumable). Steps 3–5 skippable with defaults; a profile goes live when
  steps 1, 2 and 6 are complete.
- Feed (`/matches`) calls the `get_matches` RPC — the only reader of other
  users' cards. Instagram handles and dealbreakers never leave the server
  except through `get_connection_instagram` (match only).
- Mutual likes create a `matches` row in one transaction (trigger);
  handles unlock in `/connections`.
- Photos live in the private `photos` bucket (`<uid>/…`), served via
  `/api/photo` as 5-minute signed URLs after a visibility check. Uploads are
  re-encoded through canvas (strips EXIF/GPS).
- **Photo moderation (plug-in point)**: rows are written `approved=true` in
  this v1. To require review, set `approved=false` on insert in
  `components/Wizard.tsx` and approve from Studio or a moderation edge
  function that calls your moderation API.

## Season reuse

`lib/config.ts` holds `SEASON_START`, `SEASON_END`, `WIPE_DATE`. The
`profile_nights` check constraint in migration `00004` mirrors the season —
update both. Scores are computed live per request (viewer perspective);
`matches` rows snapshot the score at creation.

## Festival wipe (21 Oct 2026)

- Deploy `supabase/functions/festival-wipe` with `SERVICE_ROLE_KEY` and a
  `WIPE_CRON_SECRET`, then schedule one POST on the wipe date — e.g. with
  pg_cron + pg_net on hosted Supabase, or a CI cron hitting the function URL.
- Do a rehearsal on staging first and confirm backups inherit the retention
  window.

## Deploys

- **Web**: Vercel/any Node host (`npm run build`, `npm start`).
- **Backend**: `supabase db push`, `supabase functions deploy festival-wipe`,
  `supabase storage` buckets are created by migration `00003`.

## Manual QA checklist (covers what needs auth)

1. New user finishes the wizard (skipping 3–5) → lands on ranked cards with
   reason chips, never a bare score.
2. A likes B, B likes A → celebration, both handles visible in Duos.
3. Intercept API responses: no other user's handle or dealbreakers appear
   before a match.
4. Block → both vanish from each other's world; pause → hidden from feeds.
5. `psql < supabase/tests/matching_tests.sql` passes on a scratch DB.
