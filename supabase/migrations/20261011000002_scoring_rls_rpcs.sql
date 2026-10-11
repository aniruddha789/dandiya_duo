-- Migration: scoring, swipe->match trigger, RLS, RPCs (spec sections 4 + 6)

-- ---------- helpers ----------
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where id = auth.uid());
$$;

create or replace function is_matched(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matches m
    where (m.user_a = least(a,b) and m.user_b = greatest(a,b))
  );
$$;

create or replace function diet_compat(a diet_t, b diet_t) returns numeric
language plpgsql immutable as $$
begin
  if a is null or b is null then return 0.5; end if;
  if a = b then return 1.0; end if;
  if (a = 'non_veg' and b in ('jain','vegan')) or (b = 'non_veg' and a in ('jain','vegan')) then return 0.0; end if;
  if (a = 'non_veg' or b = 'non_veg') then return 0.25; end if;
  return 0.5;
end $$;

-- Per-signal scoring between two profiles. Returns (total, breakdown jsonb).
create or replace function score_pair(a uuid, b uuid)
returns table (score smallint, breakdown jsonb)
language plpgsql stable security definer set search_path = public as $$
declare
  pa profiles%rowtype; pb profiles%rowtype;
  s_event numeric := 0.5; s_area numeric := 0.5; s_food numeric := 0.5;
  s_movies numeric := 0.5; s_star numeric := 0.5;
  ca int; cb int; ci int; cu int;
  ma int[]; mb int[];
  total numeric;
begin
  select * into pa from profiles where id = a;
  select * into pb from profiles where id = b;
  if pa.id is null or pb.id is null then
    score := 0; breakdown := '{}'; return next; return;
  end if;

  -- Event: Jaccard over profile_events; 0 if neither/both-empty? spec: missing = neutral 0.5
  select count(*) into ca from profile_events where profile_id = a;
  select count(*) into cb from profile_events where profile_id = b;
  if ca > 0 and cb > 0 then
    select count(*) into ci from profile_events ea
      join profile_events eb on eb.event_id = ea.event_id and eb.profile_id = b
      where ea.profile_id = a;
    cu := ca + cb - ci;
    s_event := case when cu = 0 then 0.5 else ci::numeric / cu::numeric end;
  else
    s_event := 0.5;
  end if;

  -- Area: same area 1.0; same zone+city 0.5; else 0; missing 0.5
  if pa.area_id is null or pb.area_id is null then
    s_area := 0.5;
  elsif pa.area_id = pb.area_id then
    s_area := 1.0;
  else
    select case when ar1.zone = ar2.zone and ar1.city = ar2.city then 0.5 else 0.0 end
      into s_area from areas ar1, areas ar2
      where ar1.id = pa.area_id and ar2.id = pb.area_id;
  end if;

  -- Food
  s_food := diet_compat(pa.diet, pb.diet);

  -- Movies: Jaccard; missing/empty on either side = neutral 0.5
  select coalesce(array_agg(tag_id), '{}') into ma from profile_movies where profile_id = a;
  select coalesce(array_agg(tag_id), '{}') into mb from profile_movies where profile_id = b;
  if array_length(ma,1) is null or array_length(mb,1) is null then
    s_movies := 0.5;
  else
    select count(*)::numeric / greatest(1, (
      (select count(*) from (select unnest(ma) union select unnest(mb)) u)
    )) into s_movies
    from (select unnest(ma) intersect select unnest(mb)) i;
  end if;

  -- Star sign: lookup matrix, symmetric; missing = 0.5
  if pa.star_sign is null or pb.star_sign is null then
    s_star := 0.5;
  else
    select coalesce(
      (select score from zodiac_compat where a = least(pa.star_sign,pb.star_sign) and b = greatest(pa.star_sign,pb.star_sign)),
      (select score from zodiac_compat where a = greatest(pa.star_sign,pb.star_sign) and b = least(pa.star_sign,pb.star_sign)),
      0.5) into s_star;
  end if;

  total := round(100 * (30*s_event + 20*s_area + 20*s_food + 15*s_movies + 15*s_star) / 100.0);
  score := greatest(0, least(100, total::int));
  breakdown := jsonb_build_object(
    'event', s_event, 'area', s_area, 'food', s_food,
    'movies', s_movies, 'star', s_star);
  return next;
end $$;

-- ---------- swipe -> match trigger (reciprocal like creates match, race-safe) ----------
create or replace function handle_swipe_match() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_score smallint; v_break jsonb;
begin
  if new.action <> 'like' then return new; end if;
  if exists (select 1 from swipes where actor = new.target and target = new.actor and action = 'like') then
    if exists (select 1 from blocks where (blocker = new.actor and blocked = new.target) or (blocker = new.target and blocked = new.actor)) then
      return new;
    end if;
    select s.score, s.breakdown into v_score, v_break from score_pair(new.actor, new.target) s;
    insert into matches (user_a, user_b, score, breakdown)
    values (least(new.actor, new.target), greatest(new.actor, new.target), v_score, v_break)
    on conflict (user_a, user_b) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists trg_swipe_match on swipes;
create trigger trg_swipe_match after insert on swipes
  for each row execute function handle_swipe_match();

-- ---------- RLS ----------
alter table profiles enable row level security;
alter table profile_instagram enable row level security;
alter table areas enable row level security;
alter table events enable row level security;
alter table profile_events enable row level security;
alter table movie_tags enable row level security;
alter table profile_movies enable row level security;
alter table photos enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;
alter table blocks enable row level security;
alter table reports enable row level security;
alter table zodiac_compat enable row level security;
alter table admins enable row level security;

-- default deny: drop permissive leftovers if re-run
drop policy if exists p_profiles_self on profiles;
drop policy if exists p_profiles_admin on profiles;
drop policy if exists p_insta_owner on profile_instagram;
drop policy if exists p_insta_admin on profile_instagram;
drop policy if exists p_areas_public on areas;
drop policy if exists p_events_public on events;
drop policy if exists p_events_admin on events;
drop policy if exists p_tags_public on movie_tags;
drop policy if exists p_zodiac_public on zodiac_compat;
drop policy if exists p_pe_self on profile_events;
drop policy if exists p_pm_self on profile_movies;
drop policy if exists p_photos_self on photos;
drop policy if exists p_swipes_self on swipes;
drop policy if exists p_matches_participant on matches;
drop policy if exists p_blocks_self on blocks;
drop policy if exists p_reports_insert on reports;
drop policy if exists p_reports_admin on reports;
drop policy if exists p_admins_self on admins;

create policy p_profiles_self on profiles for all to authenticated
  using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());
create policy p_insta_owner on profile_instagram for all to authenticated
  using (profile_id = auth.uid() or is_admin()) with check (profile_id = auth.uid() or is_admin());
create policy p_areas_public on areas for select to anon, authenticated using (true);
create policy p_events_public on events for select to anon, authenticated using (is_published = true or is_admin());
create policy p_events_admin on events for all to authenticated using (is_admin()) with check (is_admin());
create policy p_tags_public on movie_tags for select to anon, authenticated using (true);
create policy p_zodiac_public on zodiac_compat for select to anon, authenticated using (true);
create policy p_pe_self on profile_events for all to authenticated
  using (profile_id = auth.uid() or is_admin()) with check (profile_id = auth.uid() or is_admin());
create policy p_pm_self on profile_movies for all to authenticated
  using (profile_id = auth.uid() or is_admin()) with check (profile_id = auth.uid() or is_admin());
create policy p_photos_self on photos for all to authenticated
  using (profile_id = auth.uid() or is_admin()) with check (profile_id = auth.uid() or is_admin());
create policy p_swipes_self on swipes for all to authenticated
  using (actor = auth.uid() or is_admin()) with check (actor = auth.uid() or is_admin());
create policy p_matches_participant on matches for select to authenticated
  using (user_a = auth.uid() or user_b = auth.uid() or is_admin());
create policy p_blocks_self on blocks for all to authenticated
  using (blocker = auth.uid() or is_admin()) with check (blocker = auth.uid() or is_admin());
create policy p_reports_insert on reports for insert to authenticated with check (reporter = auth.uid());
create policy p_reports_admin on reports for all to authenticated using (is_admin()) with check (is_admin());
create policy p_admins_self on admins for select to authenticated using (id = auth.uid() or is_admin());

-- ---------- RPCs (sole reader of other users' cards/handles) ----------
-- Candidate feed: same city, mutual seeking, visible, unswiped, unblocked.
create or replace function get_candidates(p_city city_t, p_limit int default 20, p_offset int default 0)
returns table (
  profile_id uuid, display_name text, city city_t, area_name text, zone text,
  diet diet_t, star_sign smallint, bio text,
  photo_paths text[], event_ids uuid[], shared_events int,
  score smallint, breakdown jsonb
)
language plpgsql stable security definer set search_path = public as $$
declare me profiles%rowtype;
begin
  select * into me from profiles where id = auth.uid();
  if me.id is null then raise exception 'profile required'; end if;

  return query
  with cands as (
    select p.* from profiles p
    where p.city = p_city
      and p.id <> me.id
      and p.is_paused = false and p.is_banned = false
      and me.is_banned = false
      and p.gender = any (me.seeking)
      and me.gender = any (p.seeking)
      and not exists (select 1 from swipes s where s.actor = me.id and s.target = p.id)
      and not exists (select 1 from blocks b where (b.blocker = me.id and b.blocked = p.id) or (b.blocker = p.id and b.blocked = me.id))
  )
  select
    p.id, p.display_name, p.city, ar.name, ar.zone, p.diet, p.star_sign, p.bio,
    coalesce((select array_agg(ph.storage_path order by ph.position) from photos ph where ph.profile_id = p.id and ph.approved = true), '{}'),
    coalesce((select array_agg(pe.event_id) from profile_events pe where pe.profile_id = p.id), '{}'),
    coalesce((select count(*)::int from profile_events a join profile_events b on b.event_id = a.event_id and b.profile_id = me.id where a.profile_id = p.id), 0),
    (sp.score), (sp.breakdown)
  from cands p
  left join areas ar on ar.id = p.area_id
  cross join lateral (select * from score_pair(me.id, p.id)) sp
  order by sp.score desc, p.created_at desc
  limit greatest(1, least(50, p_limit)) offset greatest(0, p_offset);
end $$;

-- Validated swipe insert (replaces direct table writes from client).
create or replace function record_swipe(p_target uuid, p_action action_t)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); matched boolean := false;
begin
  if me is null then raise exception 'auth required'; end if;
  if p_target = me then raise exception 'cannot swipe self'; end if;
  if exists (select 1 from blocks where (blocker = me and blocked = p_target) or (blocker = p_target and blocked = me)) then
    raise exception 'blocked';
  end if;
  if not exists (select 1 from profiles where id = me and is_banned = false) then raise exception 'profile unavailable'; end if;
  if not exists (select 1 from profiles where id = p_target and is_banned = false and is_paused = false) then
    raise exception 'target unavailable';
  end if;
  insert into swipes (actor, target, action) values (me, p_target, p_action)
  on conflict (actor, target) do update set action = excluded.action, created_at = now();
  matched := is_matched(me, p_target);
  return jsonb_build_object('ok', true, 'matched', matched);
end $$;

-- Instagram reveal: only owner or matched pair (or admin).
create or replace function get_match_instagram(p_match_id uuid)
returns table (handle text, other_profile uuid) language plpgsql stable security definer set search_path = public as $$
declare m matches%rowtype; me uuid := auth.uid(); other uuid;
begin
  select * into m from matches where id = p_match_id;
  if m.id is null then raise exception 'match not found'; end if;
  if not (m.user_a = me or m.user_b = me or is_admin()) then raise exception 'forbidden'; end if;
  if m.user_a = me then other := m.user_b; else other := m.user_a; end if;
  -- blocked pairs lose UI access
  if exists (select 1 from blocks where (blocker = me and blocked = other) or (blocker = other and blocked = me)) and not is_admin() then
    raise exception 'blocked';
  end if;
  return query select pi.handle, other from profile_instagram pi where pi.profile_id = other;
end $$;

-- Admin: resolve a report
create or replace function resolve_report(p_report uuid, p_status report_status_t)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  update reports set status = p_status, resolved_by = auth.uid(), resolved_at = now() where id = p_report;
end $$;

-- Festival wipe (run via pg_cron / admin on 21 Oct 2026; date is a param, default from spec).
-- Deletes storage objects must be handled by caller (edge function) since SQL can't reach Storage API;
-- this function deletes rows + auth users. Log count via returned jsonb.
create or replace function festival_wipe()
returns jsonb language plpgsql security definer set search_path = public as $$
declare n_profiles int; n_matches int; n_photos int;
begin
  if not is_admin() then raise exception 'admin only'; end if;
  select count(*) into n_matches from matches;
  select count(*) into n_photos from photos;
  select count(*) into n_profiles from profiles;
  delete from profiles; -- cascades instagram, events-link, movies, photos, swipes, matches, blocks
  delete from auth.users where deleted_at is null and id not in (select id from admins);
  return jsonb_build_object('profiles', n_profiles, 'matches', n_matches, 'photos', n_photos);
end $$;
