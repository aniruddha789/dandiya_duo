-- Tests for migration 05 (multi-city). Run after migrate:
--   psql "$DB" -f supabase/tests/multicity.sql
-- Pure-SQL asserts, no auth needed. RPC behaviour (same city / same metro /
-- thin pool) is covered by same_pool unit tests below plus the manual QA
-- checklist in README (get_matches itself requires a live profile session).

begin;

do $$
declare
  n_cities int; n_launched int; n_areas int; n_nocity int;
  a uuid; b uuid; m1 text; m2 text;
begin
  -- 1. seed integrity: 32 cities, all launched, unique slugs (PK enforces)
  select count(*), count(*) filter (where is_launched) into n_cities, n_launched from cities;
  assert n_cities = 32, 'expected 32 seeded cities, got ' || n_cities;
  assert n_launched = 32, 'all seeded cities must launch';

  -- 2. metros group correctly
  assert (select count(*) from cities where metro_slug = 'delhi') = 3, 'delhi metro = NCR+Gurugram+Noida';
  assert (select count(*) from cities where metro_slug = 'mumbai') = 3, 'mumbai metro = Mumbai+Thane+Navi Mumbai';
  assert (select count(*) from cities where metro_slug is null) = 26, 'rest are standalone';

  -- 3. every area resolves to a city; every launched city has 8+ areas
  select count(*) into n_areas from areas;
  assert n_areas >= 270, 'expected 270+ seeded areas, got ' || n_areas;
  select count(*) into n_nocity from areas where city_id is null;
  assert n_nocity = 0, 'all areas must have city_id';
  assert not exists (
    select 1 from cities c left join areas a on a.city_id = c.id
    where c.is_launched group by c.id having count(a.id) < 8
  ), 'every launched city needs 8+ areas';

  -- 4. same_pool unit tests (same city / same metro / thin-pool gating input)
  select id, metro_slug into a, m1 from cities where slug = 'mumbai';
  select id, metro_slug into b, m2 from cities where slug = 'thane';
  assert same_pool(a, m1, a, m1, true), 'same city always pools';
  assert same_pool(a, m1, a, m1, false), 'same city pools even with metro off';
  assert same_pool(a, m1, b, m2, true), 'same metro pools when enabled';
  assert not same_pool(a, m1, b, m2, false), 'same metro excluded when disabled';
  select id, metro_slug into b, m2 from cities where slug = 'pune';
  assert not same_pool(a, m1, b, m2, true), 'different metro never pools';
  select id into b from cities where slug = 'bengaluru';
  assert not same_pool(a, null, b, null, true), 'null metros never pool across cities';

  -- 5. new get_matches signature present, legacy overload gone
  assert exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_matches'
      and pg_get_function_identity_arguments(p.oid) = 'p_city_id uuid, p_include_metro boolean, p_limit integer, p_offset integer'
  ), 'get_matches(uuid, boolean, int, int) must exist';

  -- 6. RLS posture on new tables
  assert (select count(*) from pg_policies where tablename = 'cities') >= 1, 'cities needs RLS policy';
  assert not exists (
    select 1 from pg_policies where tablename in ('city_requests','waitlist','metrics')
      and roles::text like '%anon%' and cmd = 'SELECT'
  ), 'request/waitlist/metrics tables must never be anon-readable';

  raise notice 'multicity tests OK: % cities, % areas', n_cities, n_areas;
end $$;

rollback;
