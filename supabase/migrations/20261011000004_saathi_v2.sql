-- Migration: Saathi v2 data model (no events table; venue is free text).
-- Replaces the earlier events-based schema. All copy/art below is original.
-- Season window is a config value in the app (lib/config.ts); the night
-- check below mirrors SEASON_START/SEASON_END (11-19 Oct 2026).

-- ---------- new enums ----------
do $$ begin create type seeking_t as enum ('women','men','anyone','group'); exception when duplicate_object then null; end $$;
do $$ begin create type dance_level_t as enum ('first_timer','basic_taali','circle_lead'); exception when duplicate_object then null; end $$;
do $$ begin create type intention_t as enum ('just_dance','find_group','dance_food','open_more'); exception when duplicate_object then null; end $$;
do $$ begin create type how_far_t as enum ('same_area','nearby','anywhere'); exception when duplicate_object then null; end $$;
do $$ begin create type diet_rule_t as enum ('any','same_only','veg_friendly'); exception when duplicate_object then null; end $$;
do $$ begin create type after_garba_t as enum ('street_food','cafe','dinner','straight_home','flexible'); exception when duplicate_object then null; end $$;

-- ---------- drop old scoring surface (depends on profiles) ----------
drop trigger if exists trg_swipe_match on swipes;
drop function if exists handle_swipe_match();
drop function if exists get_candidates(city_t, int, int);
drop function if exists get_match_instagram(uuid);
drop function if exists score_pair(uuid, uuid);
drop function if exists diet_compat(diet_t, diet_t);

-- ---------- drop removed tables ----------
drop table if exists profile_events cascade;
drop table if exists profile_movies cascade;
drop table if exists movie_tags cascade;
drop table if exists events cascade;
drop table if exists zodiac_compat cascade;

-- ---------- rebuild profiles in the new shape (no live users yet) ----------
drop table if exists profiles cascade;

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 40),
  age smallint not null check (age between 18 and 100),
  gender gender_t not null,
  seeking seeking_t not null default 'anyone',
  city city_t not null,
  area_id uuid references areas(id) on delete set null,
  dance_level dance_level_t not null default 'first_timer',
  intention intention_t not null default 'just_dance',
  how_far how_far_t not null default 'anywhere',
  star_sign smallint check (star_sign between 1 and 12),
  hometown text check (char_length(hometown) <= 60),
  work text check (char_length(work) <= 40),
  fav_movie text check (char_length(fav_movie) <= 100),
  diet diet_t,
  after_garba after_garba_t,
  venue_text text check (char_length(venue_text) <= 120),
  prompt_move text check (char_length(prompt_move) <= 80),
  prompt_nonneg text check (char_length(prompt_nonneg) <= 80),
  weight_star numeric not null default 1 check (weight_star in (0, 1, 2.5)),
  weight_food numeric not null default 1 check (weight_food in (0, 1, 2.5)),
  show_languages boolean not null default true,
  show_hometown boolean not null default true,
  show_food boolean not null default true,
  age_confirmed_at timestamptz not null default now(),
  onboarding_step smallint not null default 1 check (onboarding_step between 1 and 6),
  is_live boolean not null default false,
  is_paused boolean not null default false,
  is_banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_pool on profiles(city, is_live, is_paused, is_banned);

drop trigger if exists trg_profiles_touch on profiles;
create trigger trg_profiles_touch before update on profiles
  for each row execute function touch_updated_at();

-- ---------- dealbreakers: owner-only, used server-side ----------
create table if not exists dealbreakers (
  profile_id uuid primary key references profiles(id) on delete cascade,
  age_min smallint not null default 18 check (age_min >= 18),
  age_max smallint not null default 99 check (age_max >= age_min),
  diet_rule diet_rule_t not null default 'any',
  min_dance_level dance_level_t not null default 'first_timer',
  must_share_language boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------- multi-value attributes ----------
create table if not exists profile_nights (
  profile_id uuid references profiles(id) on delete cascade,
  night date not null check (night between date '2026-10-11' and date '2026-10-19'),
  primary key (profile_id, night)
);
create index if not exists idx_nights_night on profile_nights(night);

create table if not exists profile_languages (
  profile_id uuid references profiles(id) on delete cascade,
  lang text not null check (lang in ('Hindi','English','Kannada','Gujarati','Marathi','Punjabi','Tamil','Telugu','Bengali','Other')),
  primary key (profile_id, lang)
);

create table if not exists profile_cuisines (
  profile_id uuid references profiles(id) on delete cascade,
  cuisine text not null check (cuisine in ('Gujarati','South Indian','North Indian','Chinese','Italian','Street food','Mexican','Japanese','Thai','Desserts')),
  primary key (profile_id, cuisine)
);

create table if not exists profile_movie_genres (
  profile_id uuid references profiles(id) on delete cascade,
  genre text not null check (genre in ('Comedy','Romance','Action','Thriller','Horror','Drama','Sci-fi','Animation','Documentary','Bollywood masala')),
  primary key (profile_id, genre)
);

create table if not exists profile_interests (
  profile_id uuid references profiles(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 20),
  primary key (profile_id, label)
);

-- ---------- recreate tables that referenced profiles ----------
create table if not exists profile_instagram (
  profile_id uuid primary key references profiles(id) on delete cascade,
  handle text not null check (handle ~ '^[A-Za-z0-9._]{1,30}$'),
  updated_at timestamptz not null default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  storage_path text not null,
  position smallint not null default 0 check (position between 0 and 2),
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (profile_id, position)
);
create index if not exists idx_photos_profile on photos(profile_id, position);

create table if not exists swipes (
  actor uuid not null references profiles(id) on delete cascade,
  target uuid not null references profiles(id) on delete cascade,
  action action_t not null,
  created_at timestamptz not null default now(),
  primary key (actor, target),
  check (actor <> target)
);
create index if not exists idx_swipes_target_actor on swipes(target, actor);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles(id) on delete cascade,
  user_b uuid not null references profiles(id) on delete cascade,
  score smallint check (score between 0 and 100),
  breakdown jsonb not null default '{}',
  matched_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);
create index if not exists idx_matches_user_a on matches(user_a);
create index if not exists idx_matches_user_b on matches(user_b);

create table if not exists blocks (
  blocker uuid not null references profiles(id) on delete cascade,
  blocked uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid references profiles(id) on delete set null,
  reported uuid references profiles(id) on delete set null,
  reason text not null,
  details text,
  status report_status_t not null default 'open',
  created_at timestamptz not null default now(),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz
);
create index if not exists idx_reports_status on reports(status, created_at);

-- ---------- helpers ----------
create or replace function dance_rank(l dance_level_t) returns int
language sql immutable as $$ select case l when 'first_timer' then 1 when 'basic_taali' then 2 when 'circle_lead' then 3 end $$;

-- element of a star sign: 1 Aries..12 Pisces (playful, not scientific)
create or replace function star_element(s smallint) returns text
language sql immutable as $$
  select case s
    when 1 then 'fire' when 5 then 'fire' when 9 then 'fire'
    when 2 then 'earth' when 6 then 'earth' when 10 then 'earth'
    when 3 then 'air' when 7 then 'air' when 11 then 'air'
    else 'water' end $$;

create or replace function star_compat(a smallint, b smallint) returns numeric
language plpgsql immutable as $$
declare ea text; eb text;
begin
  if a is null or b is null then return 0.5; end if;
  ea := star_element(a); eb := star_element(b);
  if (ea = 'fire' and eb = 'air') or (ea = 'air' and eb = 'fire') then return 1.0; end if;
  if (ea = 'earth' and eb = 'water') or (ea = 'water' and eb = 'earth') then return 1.0; end if;
  if ea = eb then return 0.7; end if;
  return 0.4;
end $$;

create or replace function seeking_ok(seeking seeking_t, target_gender gender_t, target_intention intention_t)
returns boolean language plpgsql immutable as $$
begin
  case seeking
    when 'women' then return target_gender = 'woman';
    when 'men' then return target_gender = 'man';
    when 'anyone' then return true;
    when 'group' then return target_intention = 'find_group';
  end case;
  return false;
end $$;

create or replace function veg_friendly(d diet_t) returns boolean
language sql immutable as $$ select d is null or d in ('veg','jain','eggetarian') $$;

create or replace function diet_signal(a diet_t, b diet_t) returns numeric
language plpgsql immutable as $$
begin
  if a is null or b is null then return 0.5; end if;
  if a = b then return 1.0; end if;
  if veg_friendly(a) and veg_friendly(b) then return 0.6; end if;
  return 0.2;
end $$;

create or replace function intention_signal(a intention_t, b intention_t) returns numeric
language plpgsql immutable as $$
begin
  if a = b then return 1.0; end if;
  if (a = 'just_dance' and b = 'dance_food') or (a = 'dance_food' and b = 'just_dance') then return 0.7; end if;
  if (a = 'dance_food' and b = 'open_more') or (a = 'open_more' and b = 'dance_food') then return 0.7; end if;
  if (a = 'just_dance' and b = 'find_group') or (a = 'find_group' and b = 'just_dance') then return 0.6; end if;
  if (a = 'find_group' and b = 'dance_food') or (a = 'dance_food' and b = 'find_group') then return 0.6; end if;
  return 0.5;
end $$;

-- distance check against the STRICTER of two how_far prefs; missing area passes
create or replace function distance_ok(
  a_area uuid, a_zone text, a_far how_far_t,
  b_area uuid, b_zone text, b_far how_far_t
) returns boolean language plpgsql immutable as $$
begin
  if a_area is null or b_area is null then return true; end if;
  if a_far = 'same_area' or b_far = 'same_area' then return a_area = b_area; end if;
  if a_far = 'nearby' or b_far = 'nearby' then
    if a_zone is null or b_zone is null then return true; end if;
    return a_zone = b_zone;
  end if;
  return true;
end $$;

-- score from the VIEWER's perspective (viewer multipliers applied, renormalised)
create or replace function score_for(viewer uuid, other uuid)
returns table (score smallint, breakdown jsonb)
language plpgsql stable security definer set search_path = public as $$
declare
  v profiles%rowtype; o profiles%rowtype;
  w_star numeric; w_food numeric;
  s_nights numeric := 0.5; s_area numeric := 0.5; s_intention numeric := 0.5;
  s_diet numeric := 0.5; s_cuis numeric := 0.5; s_after numeric := 0.5;
  s_culture numeric := 0.5; s_lang numeric := 0.5; s_star numeric := 0.5;
  v_n int; o_n int; i_n int;
  v_area uuid; o_area uuid; v_zone text; o_zone text;
  w_nights numeric := 20; w_area numeric := 15; w_int numeric := 15;
  w_food_b numeric := 15; w_cult numeric := 15; w_lang numeric := 10; w_star_b numeric := 10;
  wsum numeric; total numeric;
begin
  select * into v from profiles where id = viewer;
  select * into o from profiles where id = other;
  if v.id is null or o.id is null then score := 0; breakdown := '{}'; return next; return; end if;
  w_star := coalesce(v.weight_star, 1); w_food := coalesce(v.weight_food, 1);

  select count(*) into v_n from profile_nights where profile_id = viewer;
  select count(*) into o_n from profile_nights where profile_id = other;
  if v_n > 0 and o_n > 0 then
    select count(*) into i_n from profile_nights a join profile_nights b
      on b.profile_id = other and b.night = a.night where a.profile_id = viewer;
    s_nights := i_n::numeric / greatest(1, v_n + o_n - i_n)::numeric;
  end if;

  v_area := v.area_id; o_area := o.area_id;
  select zone into v_zone from areas where id = v_area;
  select zone into o_zone from areas where id = o_area;
  if v_area is null or o_area is null then s_area := 0.5;
  elsif v_area = o_area then s_area := 1.0;
  elsif v_zone is not null and v_zone = o_zone then s_area := 0.6;
  else s_area := 0.2; end if;

  s_intention := intention_signal(v.intention, o.intention);
  s_diet := diet_signal(v.diet, o.diet);

  with a as (select cuisine from profile_cuisines where profile_id = viewer),
       b as (select cuisine from profile_cuisines where profile_id = other),
       i as (select cuisine from a intersect select cuisine from b),
       u as (select cuisine from a union select cuisine from b)
  select case when (select count(*) from a) = 0 or (select count(*) from b) = 0 then 0.5
              else (select count(*) from i)::numeric / greatest(1,(select count(*) from u))::numeric end
    into s_cuis;

  if v.after_garba is null or o.after_garba is null then s_after := 0.5;
  elsif v.after_garba = o.after_garba then s_after := 1.0;
  elsif v.after_garba = 'flexible' or o.after_garba = 'flexible' then s_after := 0.7;
  else s_after := 0.3; end if;

  with a as (select genre as x from profile_movie_genres where profile_id = viewer
             union select label from profile_interests where profile_id = viewer),
       b as (select genre as x from profile_movie_genres where profile_id = other
             union select label from profile_interests where profile_id = other),
       i as (select x from a intersect select x from b),
       u as (select x from a union select x from b)
  select case when (select count(*) from a) = 0 or (select count(*) from b) = 0 then 0.5
              else (select count(*) from i)::numeric / greatest(1,(select count(*) from u))::numeric end
    into s_culture;

  with a as (select lang from profile_languages where profile_id = viewer),
       b as (select lang from profile_languages where profile_id = other),
       i as (select lang from a intersect select lang from b),
       u as (select lang from a union select lang from b)
  select case when (select count(*) from a) = 0 or (select count(*) from b) = 0 then 0.5
              else (select count(*) from i)::numeric / greatest(1,(select count(*) from u))::numeric end
    into s_lang;

  s_star := star_compat(v.star_sign, o.star_sign);

  w_food_b := 15 * w_food; w_star_b := 10 * w_star;
  wsum := w_nights + w_area + w_int + w_food_b + w_cult + w_lang + w_star_b;
  total := round(100 * (
      w_nights*s_nights + w_area*s_area + w_int*s_intention
      + (6*w_food)*s_diet + (5*w_food)*s_cuis + (4*w_food)*s_after
      + w_cult*s_culture + w_lang*s_lang + w_star_b*s_star
    ) / wsum);
  score := greatest(0, least(100, total::int));
  breakdown := jsonb_build_object(
    'nights', s_nights, 'area', s_area, 'intention', s_intention,
    'diet', s_diet, 'cuisines', s_cuis, 'after_garba', s_after,
    'culture', s_culture, 'languages', s_lang, 'star', s_star,
    'weight_food', w_food, 'weight_star', w_star);
  return next;
end $$;

-- ---------- swipe -> match trigger (one transaction, race-safe) ----------
create or replace function handle_swipe_match() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_score smallint; v_break jsonb;
begin
  if new.action <> 'like' then return new; end if;
  if exists (select 1 from swipes where actor = new.target and target = new.actor and action = 'like') then
    if exists (select 1 from blocks where (blocker = new.actor and blocked = new.target) or (blocker = new.target and blocked = new.actor)) then
      return new;
    end if;
    select s.score, s.breakdown into v_score, v_break from score_for(new.actor, new.target) s;
    insert into matches (user_a, user_b, score, breakdown)
    values (least(new.actor, new.target), greatest(new.actor, new.target), v_score, v_break)
    on conflict (user_a, user_b) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists trg_swipe_match on swipes;
create trigger trg_swipe_match after insert or update on swipes
  for each row execute function handle_swipe_match();

-- ---------- RLS ----------
alter table profiles enable row level security;
alter table dealbreakers enable row level security;
alter table profile_nights enable row level security;
alter table profile_languages enable row level security;
alter table profile_cuisines enable row level security;
alter table profile_movie_genres enable row level security;
alter table profile_interests enable row level security;
alter table profile_instagram enable row level security;
alter table photos enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;
alter table blocks enable row level security;
alter table reports enable row level security;

drop policy if exists p_profiles_self on profiles;
drop policy if exists p_dealbreakers_self on dealbreakers;
drop policy if exists p_nights_self on profile_nights;
drop policy if exists p_langs_self on profile_languages;
drop policy if exists p_cuisines_self on profile_cuisines;
drop policy if exists p_genres_self on profile_movie_genres;
drop policy if exists p_interests_self on profile_interests;
drop policy if exists p_insta_owner on profile_instagram;
drop policy if exists p_photos_self on photos;
drop policy if exists p_swipes_self on swipes;
drop policy if exists p_matches_participant on matches;
drop policy if exists p_blocks_self on blocks;
drop policy if exists p_reports_insert on reports;
drop policy if exists p_reports_admin on reports;

create policy p_profiles_self on profiles for all to authenticated
  using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());
-- dealbreakers: never readable by other users, only via RPCs
create policy p_dealbreakers_self on dealbreakers for all to authenticated
  using (profile_id = auth.uid() or is_admin()) with check (profile_id = auth.uid() or is_admin());
create policy p_nights_self on profile_nights for all to authenticated
  using (profile_id = auth.uid() or is_admin()) with check (profile_id = auth.uid() or is_admin());
create policy p_langs_self on profile_languages for all to authenticated
  using (profile_id = auth.uid() or is_admin()) with check (profile_id = auth.uid() or is_admin());
create policy p_cuisines_self on profile_cuisines for all to authenticated
  using (profile_id = auth.uid() or is_admin()) with check (profile_id = auth.uid() or is_admin());
create policy p_genres_self on profile_movie_genres for all to authenticated
  using (profile_id = auth.uid() or is_admin()) with check (profile_id = auth.uid() or is_admin());
create policy p_interests_self on profile_interests for all to authenticated
  using (profile_id = auth.uid() or is_admin()) with check (profile_id = auth.uid() or is_admin());
create policy p_insta_owner on profile_instagram for all to authenticated
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

-- ---------- RPC: ranked feed ----------
create or replace function get_matches(p_city city_t, p_limit int default 20, p_offset int default 0)
returns table (
  profile_id uuid, first_name text, age smallint, gender gender_t,
  seeking seeking_t, city city_t, area_name text, zone text,
  dance_level dance_level_t, intention intention_t,
  languages text[], hometown text, work text,
  diet diet_t, cuisines text[], after_garba after_garba_t,
  star_sign smallint, prompt_move text, prompt_nonneg text,
  photo_paths text[], nights date[], shared_nights int,
  score smallint, breakdown jsonb, reasons text[]
)
language plpgsql stable security definer set search_path = public as $$
declare me profiles%rowtype; mdb dealbreakers%rowtype;
begin
  select * into me from profiles where id = auth.uid();
  if me.id is null then raise exception 'profile required'; end if;
  if not me.is_live or me.is_paused or me.is_banned then raise exception 'profile not live'; end if;
  select * into mdb from dealbreakers where profile_id = me.id;

  return query
  with cands as (
    select p.*,
      (select row_to_json(d) from dealbreakers d where d.profile_id = p.id) as dbr,
      ar.zone as zname, ar.name as aname
    from profiles p left join areas ar on ar.id = p.area_id
    where p.city = p_city
      and p.id <> me.id
      and p.is_live and not p.is_paused and not p.is_banned
      and seeking_ok(me.seeking, p.gender, p.intention)
      and seeking_ok(p.seeking, me.gender, me.intention)
      and p.age between coalesce((mdb).age_min, 18) and coalesce((mdb).age_max, 99)
      and me.age between coalesce(((dbr::json)->>'age_min')::smallint, 18)
                  and coalesce(((dbr::json)->>'age_max')::smallint, 99)
      and case coalesce((mdb).diet_rule, 'any'::diet_rule_t)
            when 'same_only' then (p.diet is null or me.diet is null or p.diet = me.diet)
            when 'veg_friendly' then veg_friendly(p.diet) else true end
      and case coalesce((((dbr::json)->>'diet_rule'))::diet_rule_t, 'any'::diet_rule_t)
            when 'same_only' then (p.diet is null or me.diet is null or p.diet = me.diet)
            when 'veg_friendly' then veg_friendly(me.diet) else true end
      and dance_rank(p.dance_level) >= dance_rank(coalesce((mdb).min_dance_level, 'first_timer'::dance_level_t))
      and dance_rank(me.dance_level) >= dance_rank(coalesce((((dbr::json)->>'min_dance_level'))::dance_level_t, 'first_timer'::dance_level_t))
      and (not coalesce((mdb).must_share_language, false) or exists (
            select 1 from profile_languages a join profile_languages b
            on b.profile_id = p.id and b.lang = a.lang where a.profile_id = me.id))
      and (not coalesce((((dbr::json)->>'must_share_language'))::boolean, false) or exists (
            select 1 from profile_languages a join profile_languages b
            on b.profile_id = p.id and b.lang = a.lang where a.profile_id = me.id))
      and (not exists (select 1 from profile_nights where profile_id = me.id)
        or not exists (select 1 from profile_nights where profile_id = p.id)
        or exists (select 1 from profile_nights a join profile_nights b
            on b.profile_id = p.id and b.night = a.night where a.profile_id = me.id))
      and distance_ok(me.area_id,
            (select zone from areas where id = me.area_id), me.how_far,
            p.area_id, (select zone from areas where id = p.area_id), p.how_far)
      and not exists (select 1 from swipes s where s.actor = me.id and s.target = p.id)
      and not exists (select 1 from matches m where (m.user_a = least(me.id, p.id) and m.user_b = greatest(me.id, p.id)))
      and not exists (select 1 from blocks b where (b.blocker = me.id and b.blocked = p.id) or (b.blocker = p.id and b.blocked = me.id))
  )
  select
    p.id, p.first_name, p.age, p.gender, p.seeking, p.city,
    (select name from areas where id = p.area_id), p.zname,
    p.dance_level, p.intention,
    case when p.show_languages then coalesce((select array_agg(lang) from profile_languages where profile_id = p.id), '{}') else '{}' end,
    case when p.show_hometown then p.hometown else null end,
    p.work,
    case when p.show_food then p.diet else null end,
    case when p.show_food then coalesce((select array_agg(cuisine) from profile_cuisines where profile_id = p.id), '{}') else '{}' end,
    case when p.show_food then p.after_garba else null end,
    p.star_sign, p.prompt_move, p.prompt_nonneg,
    coalesce((select array_agg(ph.storage_path order by ph.position) from photos ph where ph.profile_id = p.id and ph.approved), '{}'),
    coalesce((select array_agg(night order by night) from profile_nights where profile_id = p.id), '{}'),
    coalesce((select count(*)::int from profile_nights a join profile_nights b
      on b.profile_id = p.id and b.night = a.night where a.profile_id = me.id), 0),
    sp.score, sp.breakdown,
    (select coalesce(array_agg(chip), '{}') from (
      (select ('both love ' || lower(c.cuisine)) as chip
        from profile_cuisines mc join profile_cuisines c on c.profile_id = p.id and c.cuisine = mc.cuisine
        where mc.profile_id = me.id limit 2)
      union all
      (select i.label from profile_interests mi join profile_interests i
        on i.profile_id = p.id and i.label = mi.label where mi.profile_id = me.id limit 2)
      union all
      (select ('both speak ' || l.lang) from profile_languages ml join profile_languages l
        on l.profile_id = p.id and l.lang = ml.lang where ml.profile_id = me.id limit 1)
      union all
      (select case
        when p.area_id is not null and p.area_id = me.area_id then 'same neighbourhood'
        when p.zname is not null and p.zname = (select zone from areas where id = me.area_id) then 'You''d pull up to them'
        else null end)
      union all
      (select case
        when star_compat(me.star_sign, p.star_sign) = 1.0
          and me.star_sign is not null and p.star_sign is not null
        then star_element(me.star_sign) || ' + ' || star_element(p.star_sign) || ' signs'
        else null end)
    ) chips where chip is not null) as reasons
  from cands p
  cross join lateral (select * from score_for(me.id, p.id)) sp
  order by sp.score desc, p.created_at desc
  limit greatest(1, least(50, p_limit)) offset greatest(0, p_offset);
end $$;

-- ---------- RPC: validated swipe (60/min rate limit) ----------
create or replace function record_swipe(p_target uuid, p_action action_t)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); matched boolean := false; recent int;
begin
  if me is null then raise exception 'auth required'; end if;
  if p_target = me then raise exception 'cannot swipe self'; end if;
  if exists (select 1 from blocks where (blocker = me and blocked = p_target) or (blocker = p_target and blocked = me)) then
    raise exception 'blocked';
  end if;
  if not exists (select 1 from profiles where id = me and is_live and not is_banned and not is_paused) then
    raise exception 'profile unavailable';
  end if;
  if not exists (select 1 from profiles where id = p_target and is_live and not is_banned and not is_paused) then
    raise exception 'target unavailable';
  end if;
  select count(*) into recent from swipes where actor = me and created_at > now() - interval '1 minute';
  if recent >= 60 then raise exception 'slow down'; end if;
  insert into swipes (actor, target, action) values (me, p_target, p_action)
  on conflict (actor, target) do update set action = excluded.action, created_at = now();
  matched := is_matched(me, p_target);
  return jsonb_build_object('ok', true, 'matched', matched);
end $$;

-- ---------- RPC: connections (mutual only, blocked hidden) ----------
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
    and not exists (select 1 from blocks b where (b.blocker = me and b.blocked = p.id) or (b.blocker = p.id and b.blocked = me))
  order by m.matched_at desc;
end $$;

-- ---------- RPC: instagram reveal (match only) ----------
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
  return query select pi.handle, other from profile_instagram pi where pi.profile_id = other;
end $$;

-- ---------- RPC: unmatch ----------
create or replace function unmatch(p_match_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  delete from matches where id = p_match_id and (user_a = me or user_b = me or is_admin());
end $$;

-- ---------- RPC: block (also removes the match row) ----------
create or replace function block_user(p_target uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'auth required'; end if;
  if p_target = me then raise exception 'cannot block self'; end if;
  insert into blocks (blocker, blocked) values (me, p_target) on conflict do nothing;
  delete from matches where (user_a = least(me, p_target) and user_b = greatest(me, p_target));
end $$;

-- ---------- RPC: report (10/day rate limit) ----------
create or replace function report_user(p_target uuid, p_reason text, p_details text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); rid uuid; recent int;
begin
  if me is null then raise exception 'auth required'; end if;
  if p_target = me then raise exception 'cannot report self'; end if;
  if char_length(p_reason) < 3 then raise exception 'reason required'; end if;
  select count(*) into recent from reports where reporter = me and created_at > now() - interval '1 day';
  if recent >= 10 then raise exception 'slow down'; end if;
  insert into reports (reporter, reported, reason, details) values (me, p_target, p_reason, p_details)
  returning id into rid;
  return rid;
end $$;

-- ---------- RPC: hard delete my account ----------
create or replace function delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'auth required'; end if;
  -- Storage objects under <uid>/... are removed by the caller edge function;
  -- photo rows cascade here so nothing dangles.
  delete from profiles where id = me;
  delete from auth.users where id = me;
end $$;
