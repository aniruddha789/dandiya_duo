-- DandiyaDuo seed: every table a user picks from during onboarding.
-- Loaded on local `db reset` via sql_paths = ["./seed.sql"] in config.toml.
-- Safe to re-run: every insert is idempotent (on conflict do nothing).
--
-- City ids must match lib/config.ts CITIES. After migration 08 the
-- areas.city / profiles.city columns are free text, so new cities only need
-- rows here (plus the CITIES constant) — no further migrations.
--
-- Onboarding option lists that are NOT tables (single sources of truth):
--   LANGUAGES      lib/config.ts LANGUAGES                       (10)
--   WORK           lib/config.ts WORKS                            (9 chips)
--   INTERESTS      lib/config.ts INTERESTS (+ up to 5 custom)     (10)
--   MOVIE GENRES   lib/config.ts MOVIE_GENRES                     (10)
--   DIETS          lib/config.ts DIETS / diet_t enum              (veg, jain, eggetarian, non_veg)
--   CUISINES       lib/config.ts CUISINES                         (10)
--   AFTER GARBA    lib/config.ts AFTER_GARBA / after_garba_t enum (street_food, cafe, dinner, straight_home, flexible)
--   DANCE LEVELS   lib/config.ts DANCE_LEVELS / dance_level_t     (first_timer, basic_taali, circle_lead)
--   INTENTIONS     lib/config.ts INTENTIONS / intention_t         (just_dance, find_group, dance_food, open_more)
--   DISTANCE       lib/config.ts HOW_FAR / how_far_t              (same_area, nearby, anywhere)
--   SEEKING        lib/config.ts SEEKINGS / seeking_t             (women, men, anyone, group)
--   STAR SIGNS     lib/config.ts STAR_SIGNS (1-12, element-mapped in SQL)
--   DIET RULES     dealbreakers.diet_rule / diet_rule_t           (any, same_only, veg_friendly)

-- ============ Mumbai ============
insert into areas (city, name, zone) values
  ('mumbai','Bandra West','West'),('mumbai','Andheri West','West'),
  ('mumbai','Juhu','West'),('mumbai','Powai','East'),
  ('mumbai','Malad','West'),('mumbai','Borivali','North'),
  ('mumbai','Dadar','Central'),('mumbai','Chembur','East'),
  ('mumbai','Colaba','South'),('mumbai','Lower Parel','South-Central'),
  ('mumbai','Goregaon','West'),('mumbai','Kurla','East')
on conflict do nothing;

-- ============ Delhi NCR ============
insert into areas (city, name, zone) values
  ('delhi_ncr','Connaught Place','Central'),('delhi_ncr','Karol Bagh','Central'),
  ('delhi_ncr','Chandni Chowk','Old Delhi'),('delhi_ncr','Saket','South'),
  ('delhi_ncr','Lajpat Nagar','South'),('delhi_ncr','Hauz Khas','South'),
  ('delhi_ncr','Dwarka','West'),('delhi_ncr','Punjabi Bagh','West'),
  ('delhi_ncr','Rohini','North-West'),('delhi_ncr','Model Town','North'),
  ('delhi_ncr','Laxmi Nagar','East'),('delhi_ncr','Mayur Vihar','East'),
  ('delhi_ncr','Noida Sec 18','Noida'),('delhi_ncr','Noida Sec 29','Noida'),
  ('delhi_ncr','Greater Noida','Noida'),('delhi_ncr','Vaishali','Ghaziabad'),
  ('delhi_ncr','Indirapuram','Ghaziabad'),('delhi_ncr','Cyber City','Gurgaon'),
  ('delhi_ncr','Golf Course Rd','Gurgaon'),('delhi_ncr','Faridabad NIT','Faridabad')
on conflict do nothing;

-- ============ Bengaluru ============
insert into areas (city, name, zone) values
  ('bengaluru','Whitefield','East'),('bengaluru','Marathahalli','East'),
  ('bengaluru','KR Puram','East'),('bengaluru','Indiranagar','East'),
  ('bengaluru','HSR Layout','South-East'),('bengaluru','Koramangala','South-East'),
  ('bengaluru','Bellandur','South-East'),('bengaluru','Sarjapur','South-East'),
  ('bengaluru','Jayanagar','South'),('bengaluru','JP Nagar','South'),
  ('bengaluru','Banashankari','South'),('bengaluru','Electronic City','South'),
  ('bengaluru','Malleshwaram','North-West'),('bengaluru','Rajajinagar','West'),
  ('bengaluru','Vijayanagar','West'),('bengaluru','Peenya','North-West'),
  ('bengaluru','Hebbal','North'),('bengaluru','Yelahanka','North'),
  ('bengaluru','Chickpet','Central'),('bengaluru','Shivajinagar BLR','Central')
on conflict do nothing;

-- ============ Hyderabad ============
insert into areas (city, name, zone) values
  ('hyderabad','Banjara Hills','West-Central'),('hyderabad','Jubilee Hills','West'),
  ('hyderabad','Hitech City','West'),('hyderabad','Gachibowli','West'),
  ('hyderabad','Kukatpally','North-West'),('hyderabad','Dilsukhnagar','East'),
  ('hyderabad','Secunderabad','North-East'),('hyderabad','LB Nagar','East'),
  ('hyderabad','Begumpet','Central'),('hyderabad','Uppal','East')
on conflict do nothing;

-- ============ Pune ============
insert into areas (city, name, zone) values
  ('pune','Koregaon Park','Central'),('pune','Camp','Central'),
  ('pune','Shivajinagar','Central'),('pune','Deccan','Central'),
  ('pune','Kothrud','West'),('pune','Baner','West'),
  ('pune','Wakad','West'),('pune','Hinjewadi','West'),
  ('pune','Aundh','West'),('pune','Bavdhan','West'),
  ('pune','Viman Nagar','East'),('pune','Kharadi','East'),
  ('pune','Hadapsar','East'),('pune','Magarpatta','East'),
  ('pune','Pimpri','North'),('pune','Chinchwad','North'),
  ('pune','Katraj','South'),('pune','Kondhwa','South')
on conflict do nothing;

-- ============ Chennai ============
insert into areas (city, name, zone) values
  ('chennai','T Nagar','Central'),('chennai','Velachery','South'),
  ('chennai','Adyar','South-East'),('chennai','Anna Nagar','North-West'),
  ('chennai','OMR South','South-East'),('chennai','Porur','West'),
  ('chennai','Tambaram','South'),('chennai','Mylapore','East-Central'),
  ('chennai','Nungambakkam','Central'),('chennai','Sholinganallur','South')
on conflict do nothing;

-- ============ Kolkata ============
insert into areas (city, name, zone) values
  ('kolkata','Park Street','Central'),('kolkata','Salt Lake','East'),
  ('kolkata','New Town','North-East'),('kolkata','Ballygunge','South-Central'),
  ('kolkata','Behala','South-West'),('kolkata','Dum Dum','North'),
  ('kolkata','Howrah','West'),('kolkata','Jadavpur','South'),
  ('kolkata','Lake Town','North-East'),('kolkata','Garia','South-East')
on conflict do nothing;

-- ============ Ahmedabad ============
insert into areas (city, name, zone) values
  ('ahmedabad','CG Road','Central'),('ahmedabad','Satellite','West'),
  ('ahmedabad','Vastrapur','West'),('ahmedabad','Maninagar','East'),
  ('ahmedabad','Bopal','South-West'),('ahmedabad','Gota','North-West'),
  ('ahmedabad','Naranpura','North'),('ahmedabad','Nikol','East'),
  ('ahmedabad','Paldi','South-Central'),('ahmedabad','Thaltej','West')
on conflict do nothing;

-- ============ Surat ============
insert into areas (city, name, zone) values
  ('surat','Adajan','West'),('surat','Vesu','South-West'),
  ('surat','Piplod','West-Central'),('surat','Katargam','North'),
  ('surat','Varachha','East'),('surat','City Light','West'),
  ('surat','Pal','South-West'),('surat','Udhna','South')
on conflict do nothing;

-- ============ Jaipur ============
insert into areas (city, name, zone) values
  ('jaipur','C Scheme','Central'),('jaipur','Malviya Nagar','South-East'),
  ('jaipur','Vaishali Nagar','West'),('jaipur','Mansarovar','South-West'),
  ('jaipur','Jagatpura','South-East'),('jaipur','Bapu Nagar','East'),
  ('jaipur','Raja Park','North-East'),('jaipur','Tonk Rd','South')
on conflict do nothing;

-- ============ Lucknow ============
insert into areas (city, name, zone) values
  ('lucknow','Gomti Nagar','East'),('lucknow','Hazratganj','Central'),
  ('lucknow','Aliganj','North'),('lucknow','Indira Nagar','North-East'),
  ('lucknow','Kanpur Rd','South-West'),('lucknow','Jankipuram','North'),
  ('lucknow','Sushant Golf City','South-East'),('lucknow','Chowk','Old City')
on conflict do nothing;

-- ============ Nagpur ============
insert into areas (city, name, zone) values
  ('nagpur','Dharampeth','West-Central'),('nagpur','Civil Lines','Central'),
  ('nagpur','Manish Nagar','South'),('nagpur','Pratap Nagar','South-West'),
  ('nagpur','Nandanvan','East'),('nagpur','Hudkeshwar','South-East'),
  ('nagpur','Sadar','North-Central'),('nagpur','Jafar Nagar','West')
on conflict do nothing;

-- ============ Indore ============
insert into areas (city, name, zone) values
  ('indore','Vijay Nagar','East'),('indore','Palasia','Central'),
  ('indore','Rau','South-West'),('indore','AB Rd','West'),
  ('indore','Scheme 78','North-East'),('indore','Sudama Nagar','South'),
  ('indore','LIG Square','Central'),('indore','Super Corridor','East')
on conflict do nothing;

-- ============ Chandigarh ============
insert into areas (city, name, zone) values
  ('chandigarh','Sector 17','Central'),('chandigarh','Sector 35','South-Central'),
  ('chandigarh','Sector 22','West-Central'),('chandigarh','Sector 15','North'),
  ('chandigarh','Sector 43','South'),('chandigarh','Sector 8','North-Central'),
  ('chandigarh','Manimajra','East'),('chandigarh','Sector 63','South-East')
on conflict do nothing;

-- ============ Kochi ============
insert into areas (city, name, zone) values
  ('kochi','Marine Drive','Central'),('kochi','Edappally','North'),
  ('kochi','Kakkanad','East'),('kochi','Fort Kochi','West'),
  ('kochi','Tripunithura','South-East'),('kochi','Vyttila','South-Central'),
  ('kochi','Kalamassery','North-East'),('kochi','Kadavanthra','South')
on conflict do nothing;

-- ============ verify (notices only; never fail a reset) ============
do $$
declare n_areas int; n_thin text;
begin
  select count(*) into n_areas from areas;
  select string_agg(city, ', ') into n_thin from (
    select city from areas group by city having count(*) < 8
  ) t;
  raise notice 'seed: % areas', n_areas;
  if n_thin is not null then raise notice 'seed: cities with <8 areas: %', n_thin; end if;
end $$;
