-- SQL tests for the match engine. Run against a scratch database:
--   supabase db reset && psql $DB < supabase/tests/matching_tests.sql
-- Pure-function tests (no auth needed). RPC filter tests need crafted
-- auth.users rows; the manual QA checklist in README covers those live.
-- All art/copy below is original.

begin;

-- 1. star_compat: complementary elements score 1.0 (Aries=fire, Gemini=air)
do $$
begin
  assert star_compat(1, 3) = 1.0, 'fire+air should be 1.0';
  assert star_compat(2, 12) = 1.0, 'earth+water should be 1.0';
  assert star_compat(5, 1) = 0.7, 'same element should be 0.7';
  assert star_compat(1, 2) = 0.4, 'other pairs should be 0.4';
  assert star_compat(null, 2) = 0.5, 'missing sign should be neutral';
  raise notice 'star_compat OK';
end $$;

-- 2. Instagram lock: policy must not allow cross-user SELECT.
do $$
declare n int;
begin
  select count(*) into n from pg_policies
    where tablename = 'profile_instagram' and policyname = 'p_insta_owner';
  assert n = 1, 'owner-only instagram policy must exist';
  -- No policy may grant anon/authenticated blanket select:
  select count(*) into n from pg_policies
    where tablename = 'profile_instagram'
      and roles::text like '%anon%';
  assert n = 0, 'instagram must never be visible to anon';
  raise notice 'instagram lock OK';
end $$;

-- 3. dealbreakers lock: owner-only, never in candidate output.
do $$
declare n int; has_col boolean;
begin
  select count(*) into n from pg_policies
    where tablename = 'dealbreakers' and roles::text like '%anon%';
  assert n = 0, 'dealbreakers must never be visible to anon';
  select count(*) into n from information_schema.columns
    where table_name = 'get_matches';
  -- get_matches is a function, not a table: confirm its output has no dealbreaker cols
  select exists (
    select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname = 'public' and p.proname = 'get_matches'
      and pg_get_function_result(p.oid) like '%dealbreaker%'
  ) into has_col;
  assert not has_col, 'get_matches must not leak dealbreakers';
  raise notice 'dealbreaker lock OK';
end $$;

-- 4. distance_ok strictness
do $$
begin
  assert distance_ok(null, null, 'same_area', null, null, 'anywhere'), 'missing area passes';
  assert not distance_ok(
    '11111111-1111-1111-1111-111111111111', 'East', 'same_area',
    '22222222-2222-2222-2222-222222222222', 'East', 'anywhere'),
    'stricter same_area must fail across areas';
  assert distance_ok(
    '11111111-1111-1111-1111-111111111111', 'East', 'nearby',
    '22222222-2222-2222-2222-222222222222', 'East', 'anywhere'),
    'same zone must pass nearby';
  raise notice 'distance_ok OK';
end $$;

-- 5. seeking_ok incl. group pairing
do $$
begin
  assert seeking_ok('women', 'woman', 'just_dance'), 'women seeks woman';
  assert not seeking_ok('women', 'man', 'just_dance'), 'women excludes man';
  assert seeking_ok('anyone', 'nonbinary', 'just_dance'), 'anyone matches all';
  assert seeking_ok('group', 'man', 'find_group'), 'group pairs with find_group';
  assert not seeking_ok('group', 'woman', 'just_dance'), 'group needs find_group intention';
  raise notice 'seeking_ok OK';
end $$;

-- 6. hardening (migration 12): internal helpers locked, direct-write
-- bypasses closed.
do $$
declare n int; wc text;
begin
  assert not has_function_privilege('anon', 'public.score_for(uuid,uuid)', 'execute'), 'score_for must not be callable by anon';
  assert not has_function_privilege('authenticated', 'public.score_for(uuid,uuid)', 'execute'), 'score_for must not be callable by clients';
  assert not has_function_privilege('anon', 'public.is_matched(uuid,uuid)', 'execute'), 'is_matched must not be callable by anon';
  assert not has_function_privilege('authenticated', 'public.is_matched(uuid,uuid)', 'execute'), 'is_matched must not be callable by clients';
  select count(*) into n from pg_policies
    where tablename = 'swipes' and policyname = 'p_swipes_self';
  assert n = 0, 'direct client swipes writes must be gone';
  select count(*) into n from pg_policies
    where tablename = 'swipes' and policyname = 'p_swipes_read';
  assert n = 1, 'swipes read policy must exist';
  select with_check into wc from pg_policies
    where tablename = 'reports' and policyname = 'p_reports_insert';
  assert wc like '%open%', 'direct report inserts must be constrained to open';
  raise notice 'hardening OK';
end $$;

rollback;
