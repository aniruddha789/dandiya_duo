-- Migration 12: security hardening (audit fixes).
--
-- Closes, in order of severity:
--   1. score_for(uuid,uuid) / is_matched(uuid,uuid) were EXECUTE-to-PUBLIC.
--      Any client could probe scores or match-existence between ARBITRARY
--      pairs (strangers), plus a user-existence oracle. Both are only ever
--      called from SECURITY DEFINER code (get_matches, record_swipe,
--      handle_swipe_match trigger), which keeps working: nested calls run
--      with the definer's rights. is_admin() stays executable — RLS
--      policies call it, and it only reveals the caller's own admin bit.
--   2. swipes accepted direct client writes (actor = auth.uid()). That
--      bypassed record_swipe's live/banned/paused checks and the 60/min
--      rate limit, and pass->like flips could mint matches via the
--      trigger. The app only writes swipes through record_swipe (see
--      components/MatchesFeed.tsx), so clients are now read-only; the
--      RPC (SECURITY DEFINER) still writes. Admins keep write via key.
--   3. reports accepted direct inserts with any status/resolved_by,
--      bypassing report_user's 10/day limit and reason checks. Direct
--      inserts are now constrained to fresh open reports; the RPC
--      (SECURITY DEFINER) is unaffected.
--   4. Direct blocks inserts left the matches row behind (block_user RPC
--      deletes it). A cleanup trigger now removes the pair's match row
--      on any blocks insert, whoever writes it.
--   5. get_connections / get_connection_instagram still served banned
--      profiles' cards and handles. Banned side is now excluded / raises.
--      Paused semantics intentionally unchanged (existing duos persist).
--
-- ROLLBACK:
--   grant execute on function public.score_for(uuid,uuid) to anon, authenticated;
--   grant execute on function public.is_matched(uuid,uuid) to anon, authenticated;
--   grant execute on function public.festival_wipe() to anon, authenticated;
--   drop trigger if exists trg_blocks_cleanup on blocks;
--   drop function if exists block_cleanup_match();
--   drop policy if exists p_swipes_read on swipes;
--   drop policy if exists p_swipes_admin_write on swipes;
--   create policy p_swipes_self on swipes for all to authenticated
--     using (actor = auth.uid() or is_admin()) with check (actor = auth.uid() or is_admin());
--   drop policy if exists p_reports_insert on reports;
--   create policy p_reports_insert on reports for insert to authenticated with check (reporter = auth.uid());
--   (then re-apply migration 04's get_connections / get_connection_instagram)

-- ---------- 1. lock internal helpers (definer-only) ----------
revoke all on function public.score_for(uuid, uuid) from public, anon, authenticated;
revoke all on function public.is_matched(uuid, uuid) from public, anon, authenticated;
-- SQL wipe is redundant with the edge function path and too powerful to
-- leave one RPC away: service_role (Studio / backend) keeps it.
revoke all on function public.festival_wipe() from public, anon, authenticated;
grant execute on function public.festival_wipe() to service_role;

-- ---------- 2. swipes: clients read-only, writes via record_swipe ----------
drop policy if exists p_swipes_self on swipes;
drop policy if exists p_swipes_read on swipes;
drop policy if exists p_swipes_admin_write on swipes;
create policy p_swipes_read on swipes for select to authenticated
  using (actor = auth.uid() or is_admin());
create policy p_swipes_admin_write on swipes for insert, update, delete to authenticated
  using (is_admin()) with check (is_admin());

-- ---------- 3. reports: direct inserts must be fresh + open ----------
drop policy if exists p_reports_insert on reports;
create policy p_reports_insert on reports for insert to authenticated
  with check (
    reporter = auth.uid()
    and status = 'open'
    and resolved_by is null
    and resolved_at is null
  );

-- ---------- 4. any block dissolves the pair's match row ----------
create or replace function block_cleanup_match() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from matches
  where user_a = least(new.blocker, new.blocked)
    and user_b = greatest(new.blocker, new.blocked);
  return new;
end $$;

drop trigger if exists trg_blocks_cleanup on blocks;
create trigger trg_blocks_cleanup after insert on blocks
  for each row execute function block_cleanup_match();

-- ---------- 5. banned profiles vanish from Duos + handle reveal ----------
create or replace function get_connections()
returns table (
  match_id uuid, profile_id uuid, first_name text, age smallint,
  area_name text, dance_level dance_level_t, intention intention_t,
  photo_paths text[], score smallint, matched_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'auth required'; end if;
  return query
  select m.id, p.id, p.first_name, p.age,
    (select name from areas where id = p.area_id),
    p.dance_level, p.intention,
    coalesce((select array_agg(ph.storage_path order by ph.position) from photos ph where ph.profile_id = p.id and ph.approved), '{}'),
    m.score, m.matched_at
  from matches m join profiles p on p.id = case when m.user_a = me then m.user_b else m.user_a end
  where (m.user_a = me or m.user_b = me)
    and not p.is_banned
    and not exists (select 1 from blocks b where (b.blocker = me and b.blocked = p.id) or (b.blocker = p.id and b.blocked = me))
  order by m.matched_at desc;
end $$;

create or replace function get_connection_instagram(p_match_id uuid)
returns table (handle text, other_profile uuid)
language plpgsql stable security definer set search_path = public as $$
declare m matches%rowtype; me uuid := auth.uid(); other uuid;
begin
  select * into m from matches where id = p_match_id;
  if m.id is null then raise exception 'match not found'; end if;
  if not (m.user_a = me or m.user_b = me or is_admin()) then raise exception 'forbidden'; end if;
  if m.user_a = me then other := m.user_b; else other := m.user_a; end if;
  if exists (select 1 from blocks where (blocker = me and blocked = other) or (blocker = other and blocked = me)) and not is_admin() then
    raise exception 'blocked';
  end if;
  if exists (select 1 from profiles where id = other and is_banned) and not is_admin() then
    raise exception 'unavailable';
  end if;
  return query select pi.handle, other from profile_instagram pi where pi.profile_id = other;
end $$;
