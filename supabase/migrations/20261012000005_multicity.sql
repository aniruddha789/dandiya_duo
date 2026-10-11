-- Migration 05: multi-city support.
-- Replaces the fixed 3-city enum model with a cities table. metro grouping
-- uses metro_slug text (no separate metros table) — assumption, see README.
-- Scoring, filters, triggers, RLS posture otherwise unchanged.
--
-- ROLLBACK (manual, in order):
--   update profiles set city = 'bengaluru' where city is null;  -- pick per row from cities via city_id first
--   alter table profiles alter column city set not null;
--   alter table profiles drop column city_id, drop column include_nearby;
--   alter table areas alter column city set not null;
--   alter table areas drop column city_id;
--   drop function get_matches(uuid, boolean, int, int);
--   (re-create get_matches(city_t,int,int) from migration 04)
--   drop table metrics, waitlist, city_requests, cities;

-- ---------- cities ----------
create table if not exists cities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  state text not null,
  country text not null default 'IN',
  lat double precision,
  lng double precision,
  metro_slug text,
  is_launched boolean not null default true,
  sort_order int not null default 100,
  aliases text[] not null default '{}'
);
create index if not exists idx_cities_slug on cities(slug);
create index if not exists idx_cities_metro on cities(metro_slug) where metro_slug is not null;

insert into cities (slug, name, state, metro_slug, is_launched, sort_order, aliases) values
  ('mumbai','Mumbai','Maharashtra','mumbai',true,1,'{Bombay}'),
  ('delhi-ncr','Delhi NCR','Delhi','delhi',true,2,'{Delhi,New Delhi}'),
  ('bengaluru','Bengaluru','Karnataka',null,true,3,'{Bangalore}'),
  ('hyderabad','Hyderabad','Telangana',null,true,4,'{Hyderabad}'),
  ('pune','Pune','Maharashtra',null,true,5,'{Poona}'),
  ('chennai','Chennai','Tamil Nadu',null,true,6,'{Madras}'),
  ('kolkata','Kolkata','West Bengal',null,true,7,'{Calcutta}'),
  ('ahmedabad','Ahmedabad','Gujarat',null,true,8,'{Amdavad}'),
  ('thane','Thane','Maharashtra','mumbai',true,9,'{Thana}'),
  ('navi-mumbai','Navi Mumbai','Maharashtra','mumbai',true,10,'{New Bombay}'),
  ('gurugram','Gurugram','Haryana','delhi',true,11,'{Gurgaon}'),
  ('noida','Noida','Uttar Pradesh','delhi',true,12,'{}'),
  ('surat','Surat','Gujarat',null,true,13,'{}'),
  ('jaipur','Jaipur','Rajasthan',null,true,14,'{}'),
  ('lucknow','Lucknow','Uttar Pradesh',null,true,15,'{}'),
  ('vadodara','Vadodara','Gujarat',null,true,16,'{Baroda}'),
  ('rajkot','Rajkot','Gujarat',null,true,17,'{}'),
  ('indore','Indore','Madhya Pradesh',null,true,18,'{}'),
  ('bhopal','Bhopal','Madhya Pradesh',null,true,19,'{}'),
  ('nagpur','Nagpur','Maharashtra',null,true,20,'{}'),
  ('chandigarh','Chandigarh','Chandigarh',null,true,21,'{}'),
  ('kochi','Kochi','Kerala',null,true,22,'{Cochin}'),
  ('coimbatore','Coimbatore','Tamil Nadu',null,true,23,'{}'),
  ('visakhapatnam','Visakhapatnam','Andhra Pradesh',null,true,24,'{Vizag}'),
  ('patna','Patna','Bihar',null,true,25,'{}'),
  ('nashik','Nashik','Maharashtra',null,true,26,'{Nasik}'),
  ('gandhinagar','Gandhinagar','Gujarat',null,true,27,'{}'),
  ('mysuru','Mysuru','Karnataka',null,true,28,'{Mysore}'),
  ('bhubaneswar','Bhubaneswar','Odisha',null,true,29,'{}'),
  ('raipur','Raipur','Chhattisgarh',null,true,30,'{}'),
  ('dehradun','Dehradun','Uttarakhand',null,true,31,'{}'),
  ('guwahati','Guwahati','Assam',null,true,32,'{Gauhati}')
on conflict (slug) do update set
  name = excluded.name, state = excluded.state, metro_slug = excluded.metro_slug,
  is_launched = excluded.is_launched, sort_order = excluded.sort_order, aliases = excluded.aliases;

alter table cities enable row level security;
drop policy if exists p_cities_public on cities;
create policy p_cities_public on cities for select to anon, authenticated using (true);

-- ---------- areas gain city_id; backfill from legacy enum ----------
alter table areas add column if not exists city_id uuid references cities(id);
create index if not exists idx_areas_city_id on areas(city_id);

update areas set city_id = (
  select c.id from cities c where c.slug = case areas.city
    when 'bengaluru' then 'bengaluru'
    when 'delhi_ncr' then 'delhi-ncr'
    when 'pune' then 'pune'
  end
) where city_id is null and areas.city in ('bengaluru','delhi_ncr','pune');

alter table areas alter column city drop not null;

drop policy if exists p_areas_public on areas;
create policy p_areas_public on areas for select to anon, authenticated using (true);

-- ---------- areas seed for new cities (10-25 each where known) ----------
-- helper pattern: insert ... select ... where slug = 'x' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Bandra West','West'),('Andheri West','West'),('Juhu','West'),('Powai','East'),
  ('Malad','West'),('Borivali','North'),('Dadar','Central'),('Chembur','East'),
  ('Colaba','South'),('Lower Parel','South-Central'),('Goregaon','West'),('Kurla','East')
) as v(name, zone) where c.slug = 'mumbai' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Thane West','Central'),('Ghodbunder Rd','North'),('Majiwada','Central'),
  ('Vartak Nagar','West'),('Kalwa','East'),('Mumbra','East'),('Wagle Estate','East'),
  ('Hiranandani Estate','North')
) as v(name, zone) where c.slug = 'thane' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Vashi','Central'),('Nerul','South'),('Seawoods','South'),('Kharghar','East'),
  ('Belapur','South'),('Airoli','North'),('Koparkhairane','Central'),('Panvel','East')
) as v(name, zone) where c.slug = 'navi-mumbai' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Cyber City','Central'),('Golf Course Rd','South'),('Sohna Rd','South-East'),
  ('MG Rd','Central'),('DLF Phase 5','West'),('Sector 29','Central'),('South City','South'),
  ('Manesar','West')
) as v(name, zone) where c.slug = 'gurugram' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Sector 18','Central'),('Sector 62','East'),('Sector 137','South-East'),
  ('Sector 150','South'),('Botanical Garden','Central'),('Sector 76','East'),
  ('Greater Noida West','Outskirt'),('Pari Chowk','Outskirt')
) as v(name, zone) where c.slug = 'noida' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Banjara Hills','West-Central'),('Jubilee Hills','West'),('Hitech City','West'),
  ('Gachibowli','West'),('Kukatpally','North-West'),('Dilsukhnagar','East'),
  ('Secunderabad','North-East'),('LB Nagar','East'),('Begumpet','Central'),('Uppal','East')
) as v(name, zone) where c.slug = 'hyderabad' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('CG Road','Central'),('Satellite','West'),('Vastrapur','West'),('Maninagar','East'),
  ('Bopal','South-West'),('Gota','North-West'),('Naranpura','North'),('Nikol','East'),
  ('Paldi','South-Central'),('Thaltej','West')
) as v(name, zone) where c.slug = 'ahmedabad' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('T Nagar','Central'),('Velachery','South'),('Adyar','South-East'),('Anna Nagar','North-West'),
  ('OMR South','South-East'),('Porur','West'),('Tambaram','South'),('Mylapore','East-Central'),
  ('Nungambakkam','Central'),('Sholinganallur','South')
) as v(name, zone) where c.slug = 'chennai' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Park Street','Central'),('Salt Lake','East'),('New Town','North-East'),('Ballygunge','South-Central'),
  ('Behala','South-West'),('Dum Dum','North'),('Howrah','West'),('Jadavpur','South'),
  ('Lake Town','North-East'),('Garia','South-East')
) as v(name, zone) where c.slug = 'kolkata' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Adajan','West'),('Vesu','South-West'),('Piplod','West-Central'),('Katargam','North'),
  ('Varachha','East'),('City Light','West'),('Pal','South-West'),('Udhna','South')
) as v(name, zone) where c.slug = 'surat' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('C Scheme','Central'),('Malviya Nagar','South-East'),('Vaishali Nagar','West'),
  ('Mansarovar','South-West'),('Jagatpura','South-East'),('Bapu Nagar','East'),
  ('Raja Park','North-East'),('Tonk Rd','South')
) as v(name, zone) where c.slug = 'jaipur' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Gomti Nagar','East'),('Hazratganj','Central'),('Aliganj','North'),('Indira Nagar','North-East'),
  ('Kanpur Rd','South-West'),('Jankipuram','North'),('Sushant Golf City','South-East'),('Chowk','Old City')
) as v(name, zone) where c.slug = 'lucknow' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Alkapuri','Central'),('Manjalpur','East'),('Nizampura','West'),('Fatehgunj','West-Central'),
  ('Gotri','West'),('Waghodia Rd','East'),('Sama','North'),('Vasna','South')
) as v(name, zone) where c.slug = 'vadodara' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Kalavad Rd','West'),('University Rd','Central-West'),('Gondal Rd','South-East'),
  ('Mavdi','South'),('Raiya Rd','West-Central'),('150 Ft Ring Rd','North'),
  ('Sadhuvasvani Rd','South'),('Yagnik Rd','Central')
) as v(name, zone) where c.slug = 'rajkot' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Vijay Nagar','East'),('Palasia','Central'),('Rau','South-West'),('AB Rd','West'),
  ('Scheme 78','North-East'),('Sudama Nagar','South'),('LIG Square','Central'),('Super Corridor','East')
) as v(name, zone) where c.slug = 'indore' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('MP Nagar','Central'),('Arera Colony','South-Central'),('Kolar','South'),('Shahpura','South'),
  ('Bairagarh','West'),('Lalghati','North'),('Bawadiya Kalan','North-West'),('Danish Kunj','East')
) as v(name, zone) where c.slug = 'bhopal' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Dharampeth','West-Central'),('Civil Lines','Central'),('Manish Nagar','South'),
  ('Pratap Nagar','South-West'),('Nandanvan','East'),('Hudkeshwar','South-East'),
  ('Sadar','North-Central'),('Jafar Nagar','West')
) as v(name, zone) where c.slug = 'nagpur' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Sector 17','Central'),('Sector 35','South-Central'),('Sector 22','West-Central'),
  ('Sector 15','North'),('Sector 43','South'),('Sector 8','North-Central'),
  ('Manimajra','East'),('Sector 63','South-East')
) as v(name, zone) where c.slug = 'chandigarh' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Marine Drive','Central'),('Edappally','North'),('Kakkanad','East'),('Fort Kochi','West'),
  ('Tripunithura','South-East'),('Vyttila','South-Central'),('Kalamassery','North-East'),
  ('Kadavanthra','South')
) as v(name, zone) where c.slug = 'kochi' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('RS Puram','West-Central'),('Saibaba Colony','North'),('Peelamedu','East'),
  ('Gandhipuram','Central'),('Saravanampatti','North-East'),('Ukkadam','South'),
  ('Vadavalli','West'),('Singanallur','East')
) as v(name, zone) where c.slug = 'coimbatore' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('MVP Colony','North-Central'),('Dwaraka Nagar','Central'),('Gajuwaka','South'),
  ('Madhurawada','North-East'),('Beach Rd','East'),('Seethammadhara','Central'),
  ('NAD Junction','West-Central'),('Pendurthi','West')
) as v(name, zone) where c.slug = 'visakhapatnam' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Boring Rd','West-Central'),('Kankarbagh','East'),('Patliputra','North-West'),
  ('Rajendra Nagar','Central-East'),('Danapur','West'),('Kumhrar','East'),
  ('Bailey Rd','West'),('Ashok Rajpath','North-Central')
) as v(name, zone) where c.slug = 'patna' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('College Rd','Central-West'),('Gangapur Rd','West'),('Nashik Rd','East'),('CIDCO','North-East'),
  ('Panchavati','North-Central'),('Deolali','East'),('Pathardi Phata','South-West'),('Tidke Colony','South')
) as v(name, zone) where c.slug = 'nashik' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Sector 21','Central'),('Kudasan','North'),('Sargasan','South'),('Infocity','Central-East'),
  ('Raysan','South-East'),('Vavol','North-West'),('Pethapur','West'),('Borij','South')
) as v(name, zone) where c.slug = 'gandhinagar' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Kuvempunagar','South'),('Vijayanagar','West'),('Gokulam','North'),('JP Nagar','South-East'),
  ('Hebbal','North-East'),('Nazarbad','Central-East'),('Bogadi','West'),('Tilak Nagar','South-Central')
) as v(name, zone) where c.slug = 'mysuru' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Patia','North'),('Chandrasekharpur','North-Central'),('Saheed Nagar','Central'),
  ('Rasulgarh','East'),('Old Town','South'),('Khandagiri','West'),('Pokhariput','South-West'),
  ('Mancheswar','North-East')
) as v(name, zone) where c.slug = 'bhubaneswar' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Pandri','Central'),('Shankar Nagar','West-Central'),('Tatibandh','West'),('Gudhiyari','East'),
  ('Devendra Nagar','South-Central'),('Kota','South'),('Byron Bazar','North'),('Avanti Vihar','North-West')
) as v(name, zone) where c.slug = 'raipur' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Rajpur Rd','North-Central'),('Sahastradhara Rd','East'),('Ballupur','West-Central'),
  ('Clement Town','South-East'),('Prem Nagar','North-West'),('Nehru Colony','South'),
  ('Chakrata Rd','West'),('Mothrowala','South-Central')
) as v(name, zone) where c.slug = 'dehradun' on conflict do nothing;

insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Ganeshguri','Central'),('Beltola','South-East'),('Maligaon','West'),('Chandmari','East-Central'),
  ('Paltan Bazar','Central'),('Jalukbari','West'),('Narengi','East'),('Kahilipara','South-Central')
) as v(name, zone) where c.slug = 'guwahati' on conflict do nothing;

-- ---------- profiles gain city_id + metro opt-in; legacy city kept nullable ----------
alter table profiles add column if not exists city_id uuid references cities(id);
alter table profiles add column if not exists include_nearby boolean not null default true;
create index if not exists idx_profiles_city_id on profiles(city_id, is_live, is_paused, is_banned);

update profiles set city_id = (
  select c.id from cities c where c.slug = case profiles.city
    when 'bengaluru' then 'bengaluru'
    when 'delhi_ncr' then 'delhi-ncr'
    when 'pune' then 'pune'
  end
) where city_id is null and profiles.city in ('bengaluru','delhi_ncr','pune');

alter table profiles alter column city drop not null;

-- ---------- city_requests + waitlist + metrics ----------
create table if not exists city_requests (
  id uuid primary key default gen_random_uuid(),
  city_name text not null check (char_length(city_name) between 2 and 60),
  email text check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

create table if not exists metrics (
  id bigint generated always as identity primary key,
  event text not null check (char_length(event) between 2 and 40),
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_metrics_event on metrics(event, created_at);

alter table city_requests enable row level security;
alter table waitlist enable row level security;
alter table metrics enable row level security;

drop policy if exists p_cityreq_insert on city_requests;
drop policy if exists p_cityreq_admin on city_requests;
drop policy if exists p_waitlist_insert on waitlist;
drop policy if exists p_waitlist_admin on waitlist;
drop policy if exists p_metrics_insert on metrics;
drop policy if exists p_metrics_admin on metrics;

create policy p_cityreq_insert on city_requests for insert to anon, authenticated with check (true);
create policy p_cityreq_admin on city_requests for select to authenticated using (is_admin());
create policy p_waitlist_insert on waitlist for insert to anon, authenticated with check (true);
create policy p_waitlist_admin on waitlist for select to authenticated using (is_admin());
create policy p_metrics_insert on metrics for insert to anon, authenticated with check (true);
create policy p_metrics_admin on metrics for select to authenticated using (is_admin());

-- ---------- pool predicate (testable unit) ----------
create or replace function same_pool(
  a_city uuid, a_metro text, b_city uuid, b_metro text, include_nearby boolean
) returns boolean language sql immutable as $$
  select coalesce(
    b_city = a_city
      or (coalesce(include_nearby, true) and a_metro is not null and a_metro = b_metro),
    false
  );
$$;

-- ---------- RPC: ranked feed, city_id + metro pool (scoring unchanged) ----------
create or replace function get_matches(
  p_city_id uuid, p_include_metro boolean default true, p_limit int default 20, p_offset int default 0
)
returns table (
  profile_id uuid, first_name text, age smallint, gender gender_t,
  seeking seeking_t, city text, area_name text, zone text,
  dance_level dance_level_t, intention intention_t,
  languages text[], hometown text, work text,
  diet diet_t, cuisines text[], after_garba after_garba_t,
  star_sign smallint, prompt_move text, prompt_nonneg text,
  photo_paths text[], nights date[], shared_nights int,
  score smallint, breakdown jsonb, reasons text[]
)
language plpgsql stable security definer set search_path = public as $$
declare me profiles%rowtype; mdb dealbreakers%rowtype; me_metro text;
begin
  select * into me from profiles where id = auth.uid();
  if me.id is null then raise exception 'profile required'; end if;
  if not me.is_live or me.is_paused or me.is_banned then raise exception 'profile not live'; end if;
  if me.city_id is null then raise exception 'pick a city first'; end if;
  if p_city_id is distinct from me.city_id then raise exception 'city mismatch'; end if;
  select * into mdb from dealbreakers where profile_id = me.id;
  select metro_slug into me_metro from cities where id = me.city_id;

  return query
  with cands as (
    select p.*,
      (select row_to_json(d) from dealbreakers d where d.profile_id = p.id) as dbr,
      ar.zone as zname, ar.name as aname,
      (select c.metro_slug from cities c where c.id = p.city_id) as pmetro
    from profiles p left join areas ar on ar.id = p.area_id
    where p.id <> me.id
      and p.is_live and not p.is_paused and not p.is_banned
      and p.city_id is not null
      and same_pool(me.city_id, me_metro, p.city_id, pmetro,
            p_include_metro and coalesce(me.include_nearby, true))
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
    p.id, p.first_name, p.age, p.gender, p.seeking,
    (select c.slug from cities c where c.id = p.city_id),
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

-- drop the legacy 3-city overload now that all callers use city_id
drop function if exists get_matches(city_t, int, int);
