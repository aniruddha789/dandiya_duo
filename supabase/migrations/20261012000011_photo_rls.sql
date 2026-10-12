-- Migration 11: RLS-governed photo access, no service role needed.
-- The app loads private-bucket photos with the user's own session
-- (signed URLs), so SUPABASE_SECRET_KEY is no longer used for photos.
--
-- Model:
--   - owner (path folder = auth uid): full access via existing
--     photos_owner_rw policy (unchanged).
--   - non-owner: SELECT iff private.can_view_photos_of(owner) is true AND
--     the photo row is approved (private.photo_is_approved).
--   - can_view_photos_of: blocks (either direction) and banned/deleted
--     owner always deny; an active matches row bypasses live/paused/city;
--     otherwise both sides must be live, unpaused, unbanned, same city.
--   - admins keep full access via existing photos_admin policy (unchanged).
--   - anon gets nothing (all policies TO authenticated).
--
-- ROLLBACK:
--   drop policy if exists photos_select_pool on storage.objects;
--   drop function if exists private.photo_is_approved(text);
--   drop function if exists private.can_view_photos_of(uuid);
--   drop function if exists private.photo_owner_id(text);
--   drop index if exists idx_blocks_blocked_blocker;
--   (optionally: drop schema private; restore app/api/photo/route.ts)

-- ---------- private helper schema (invisible to PostgREST) ----------
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- ---------- safe owner extraction: malformed paths deny, never error ----------
create or replace function private.photo_owner_id(objname text)
returns uuid language sql immutable as $$
  select case
    when array_length(storage.foldername(objname), 1) >= 2
      and (storage.foldername(objname))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      then ((storage.foldername(objname))[1])::uuid
    else null
  end;
$$;
revoke all on function private.photo_owner_id(text) from public, anon;
grant execute on function private.photo_owner_id(text) to authenticated;

-- ---------- relationship check (boolean only, leaks nothing else) ----------
create or replace function private.can_view_photos_of(owner uuid)
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  v_me profiles%rowtype;
  v_own profiles%rowtype;
begin
  if me is null or owner is null then return false; end if;
  if owner = me then return true; end if;
  -- blocks in either direction always deny
  if exists (select 1 from blocks b
      where (b.blocker = me and b.blocked = owner)
         or (b.blocker = owner and b.blocked = me)) then
    return false;
  end if;
  select * into v_own from profiles where id = owner;
  -- banned or deleted owner denies, even with an active match
  if v_own.id is null or v_own.is_banned then return false; end if;
  -- active match bypasses live/paused/city (but never blocks/bans above)
  if exists (select 1 from matches m
      where m.user_a = least(me, owner) and m.user_b = greatest(me, owner)) then
    return true;
  end if;
  -- otherwise the feed rule: both sides live, unpaused, unbanned, same city
  select * into v_me from profiles where id = me;
  if v_me.id is null or v_me.is_banned or not v_me.is_live or v_me.is_paused then
    return false;
  end if;
  if v_own.is_paused or not v_own.is_live then return false; end if;
  if v_own.city is distinct from v_me.city then return false; end if;
  return true;
end $$;
revoke all on function private.can_view_photos_of(uuid) from public, anon;
grant execute on function private.can_view_photos_of(uuid) to authenticated;

-- ---------- approved-only for non-owners (owners see own pending uploads) ----------
create or replace function private.photo_is_approved(objname text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from photos where storage_path = objname and approved);
$$;
revoke all on function private.photo_is_approved(text) from public, anon;
grant execute on function private.photo_is_approved(text) to authenticated;

-- ---------- reverse block lookup index ----------
create index if not exists idx_blocks_blocked_blocker on blocks(blocked, blocker);

-- ---------- SELECT policy for eligible non-owners ----------
drop policy if exists photos_select_pool on storage.objects;
create policy photos_select_pool on storage.objects
for select to authenticated
using (
  bucket_id = 'photos'
  and private.photo_owner_id(name) is not null
  and private.photo_owner_id(name) <> auth.uid()
  and private.can_view_photos_of(private.photo_owner_id(name))
  and private.photo_is_approved(name)
);
