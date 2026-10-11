-- Migration: core schema for Garba Matching Platform clone
-- Spec section 5. Original art/copy NOT reproduced; schema is functional only.

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin create type city_t as enum ('bengaluru','delhi_ncr','pune'); exception when duplicate_object then null; end $$;
do $$ begin create type gender_t as enum ('woman','man','nonbinary','other'); exception when duplicate_object then null; end $$;
do $$ begin create type diet_t as enum ('veg','eggetarian','non_veg','jain','vegan'); exception when duplicate_object then null; end $$;
do $$ begin create type action_t as enum ('like','pass'); exception when duplicate_object then null; end $$;
do $$ begin create type report_status_t as enum ('open','dismissed','actioned'); exception when duplicate_object then null; end $$;

-- Areas (referenced by profiles/events, so create first without fk back-refs)
create table if not exists areas (
  id uuid primary key default gen_random_uuid(),
  city city_t not null,
  name text not null,
  zone text not null,
  unique (city, name)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  city city_t not null,
  title text not null,
  venue text not null,
  area_id uuid references areas(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  price_label text not null default 'Check listing',
  poster_url text,
  booking_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_events_city_published on events(city, is_published, starts_at);

create table if not exists movie_tags (
  id serial primary key,
  label text unique not null
);

create table if not exists zodiac_compat (
  a smallint not null check (a between 1 and 12),
  b smallint not null check (b between 1 and 12),
  score numeric(3,2) not null check (score between 0 and 1),
  primary key (a, b)
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  dob date not null check (dob <= current_date - interval '18 years'),
  gender gender_t not null,
  seeking gender_t[] not null default '{woman,man}',
  city city_t not null,
  area_id uuid references areas(id) on delete set null,
  diet diet_t,
  star_sign smallint check (star_sign between 1 and 12),
  bio text check (char_length(bio) <= 200),
  age_confirmed_at timestamptz not null default now(),
  is_paused boolean not null default false,
  is_banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_profiles_city_visible on profiles(city, is_paused, is_banned);
create index if not exists idx_profiles_seeking on profiles using gin (seeking);

create table if not exists profile_instagram (
  profile_id uuid primary key references profiles(id) on delete cascade,
  handle text not null check (handle ~ '^[A-Za-z0-9._]{1,30}$'),
  updated_at timestamptz not null default now()
);

create table if not exists profile_events (
  profile_id uuid references profiles(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  primary key (profile_id, event_id)
);
create index if not exists idx_profile_events_event on profile_events(event_id);

create table if not exists profile_movies (
  profile_id uuid references profiles(id) on delete cascade,
  tag_id int references movie_tags(id) on delete cascade,
  primary key (profile_id, tag_id)
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  storage_path text not null,
  position smallint not null default 0 check (position between 0 and 3),
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

create table if not exists admins (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_profiles_touch on profiles;
create trigger trg_profiles_touch before update on profiles
  for each row execute function touch_updated_at();
