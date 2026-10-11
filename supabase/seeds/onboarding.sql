-- DandiyaDuo onboarding seed: every table a user picks from during onboarding.
-- Canonical data lives here AND in migration 05 (which must stay
-- self-contained for `db push`). If you change one, change both — see README.
-- Safe to re-run: every insert is idempotent (upsert / on conflict do nothing).
-- Loaded on local `db reset` via sql_paths = ["./seeds/*.sql"] in config.toml.

-- ============ 0. legacy backfill (old 3-enum rows gain city_id) ============
update areas set city_id = (
  select c.id from cities c where c.slug = case areas.city
    when 'bengaluru' then 'bengaluru'
    when 'delhi_ncr' then 'delhi-ncr'
    when 'pune' then 'pune'
  end
) where city_id is null and areas.city in ('bengaluru','delhi_ncr','pune');

-- ============ 1. cities (32 launched) ============
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

-- ============ 2. areas (name, zone per city) ============
-- Bengaluru (legacy enum kept for rollback; city_id is the live key)
insert into areas (city, city_id, name, zone)
select 'bengaluru'::city_t, c.id, v.name, v.zone from cities c cross join (values
  ('Whitefield','East'),('Marathahalli','East'),
  ('KR Puram','East'),('Indiranagar','East'),
  ('HSR Layout','South-East'),('Koramangala','South-East'),
  ('Bellandur','South-East'),('Sarjapur','South-East'),
  ('Jayanagar','South'),('JP Nagar','South'),
  ('Banashankari','South'),('Electronic City','South'),
  ('Malleshwaram','North-West'),('Rajajinagar','West'),
  ('Vijayanagar','West'),('Peenya','North-West'),
  ('Hebbal','North'),('Yelahanka','North'),
  ('Chickpet','Central'),('Shivajinagar BLR','Central')
) as v(name, zone) where c.slug = 'bengaluru' on conflict do nothing;

-- Delhi NCR
insert into areas (city, city_id, name, zone)
select 'delhi_ncr'::city_t, c.id, v.name, v.zone from cities c cross join (values
  ('Connaught Place','Central'),('Karol Bagh','Central'),
  ('Chandni Chowk','Old Delhi'),('Saket','South'),
  ('Lajpat Nagar','South'),('Hauz Khas','South'),
  ('Dwarka','West'),('Punjabi Bagh','West'),
  ('Rohini','North-West'),('Model Town','North'),
  ('Laxmi Nagar','East'),('Mayur Vihar','East'),
  ('Noida Sec 18','Noida'),('Noida Sec 29','Noida'),
  ('Greater Noida','Noida'),('Vaishali','Ghaziabad'),
  ('Indirapuram','Ghaziabad'),('Cyber City','Gurgaon'),
  ('Golf Course Rd','Gurgaon'),('Faridabad NIT','Faridabad')
) as v(name, zone) where c.slug = 'delhi-ncr' on conflict do nothing;

-- Pune
insert into areas (city, city_id, name, zone)
select 'pune'::city_t, c.id, v.name, v.zone from cities c cross join (values
  ('Koregaon Park','Central'),('Camp','Central'),
  ('Shivajinagar','Central'),('Deccan','Central'),
  ('Kothrud','West'),('Baner','West'),
  ('Wakad','West'),('Hinjewadi','West'),
  ('Aundh','West'),('Bavdhan','West'),
  ('Viman Nagar','East'),('Kharadi','East'),
  ('Hadapsar','East'),('Magarpatta','East'),
  ('Pimpri','North'),('Chinchwad','North'),
  ('Katraj','South'),('Kondhwa','South')
) as v(name, zone) where c.slug = 'pune' on conflict do nothing;

-- Mumbai
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Bandra West','West'),('Andheri West','West'),('Juhu','West'),('Powai','East'),
  ('Malad','West'),('Borivali','North'),('Dadar','Central'),('Chembur','East'),
  ('Colaba','South'),('Lower Parel','South-Central'),('Goregaon','West'),('Kurla','East')
) as v(name, zone) where c.slug = 'mumbai' on conflict do nothing;

-- Thane
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Thane West','Central'),('Ghodbunder Rd','North'),('Majiwada','Central'),
  ('Vartak Nagar','West'),('Kalwa','East'),('Mumbra','East'),('Wagle Estate','East'),
  ('Hiranandani Estate','North')
) as v(name, zone) where c.slug = 'thane' on conflict do nothing;

-- Navi Mumbai
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Vashi','Central'),('Nerul','South'),('Seawoods','South'),('Kharghar','East'),
  ('Belapur','South'),('Airoli','North'),('Koparkhairane','Central'),('Panvel','East')
) as v(name, zone) where c.slug = 'navi-mumbai' on conflict do nothing;

-- Gurugram
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Cyber City','Central'),('Golf Course Rd','South'),('Sohna Rd','South-East'),
  ('MG Rd','Central'),('DLF Phase 5','West'),('Sector 29','Central'),('South City','South'),
  ('Manesar','West')
) as v(name, zone) where c.slug = 'gurugram' on conflict do nothing;

-- Noida
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Sector 18','Central'),('Sector 62','East'),('Sector 137','South-East'),
  ('Sector 150','South'),('Botanical Garden','Central'),('Sector 76','East'),
  ('Greater Noida West','Outskirt'),('Pari Chowk','Outskirt')
) as v(name, zone) where c.slug = 'noida' on conflict do nothing;

-- Hyderabad
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Banjara Hills','West-Central'),('Jubilee Hills','West'),('Hitech City','West'),
  ('Gachibowli','West'),('Kukatpally','North-West'),('Dilsukhnagar','East'),
  ('Secunderabad','North-East'),('LB Nagar','East'),('Begumpet','Central'),('Uppal','East')
) as v(name, zone) where c.slug = 'hyderabad' on conflict do nothing;

-- Ahmedabad
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('CG Road','Central'),('Satellite','West'),('Vastrapur','West'),('Maninagar','East'),
  ('Bopal','South-West'),('Gota','North-West'),('Naranpura','North'),('Nikol','East'),
  ('Paldi','South-Central'),('Thaltej','West')
) as v(name, zone) where c.slug = 'ahmedabad' on conflict do nothing;

-- Chennai
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('T Nagar','Central'),('Velachery','South'),('Adyar','South-East'),('Anna Nagar','North-West'),
  ('OMR South','South-East'),('Porur','West'),('Tambaram','South'),('Mylapore','East-Central'),
  ('Nungambakkam','Central'),('Sholinganallur','South')
) as v(name, zone) where c.slug = 'chennai' on conflict do nothing;

-- Kolkata
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Park Street','Central'),('Salt Lake','East'),('New Town','North-East'),('Ballygunge','South-Central'),
  ('Behala','South-West'),('Dum Dum','North'),('Howrah','West'),('Jadavpur','South'),
  ('Lake Town','North-East'),('Garia','South-East')
) as v(name, zone) where c.slug = 'kolkata' on conflict do nothing;

-- Surat
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Adajan','West'),('Vesu','South-West'),('Piplod','West-Central'),('Katargam','North'),
  ('Varachha','East'),('City Light','West'),('Pal','South-West'),('Udhna','South')
) as v(name, zone) where c.slug = 'surat' on conflict do nothing;

-- Jaipur
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('C Scheme','Central'),('Malviya Nagar','South-East'),('Vaishali Nagar','West'),
  ('Mansarovar','South-West'),('Jagatpura','South-East'),('Bapu Nagar','East'),
  ('Raja Park','North-East'),('Tonk Rd','South')
) as v(name, zone) where c.slug = 'jaipur' on conflict do nothing;

-- Lucknow
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Gomti Nagar','East'),('Hazratganj','Central'),('Aliganj','North'),('Indira Nagar','North-East'),
  ('Kanpur Rd','South-West'),('Jankipuram','North'),('Sushant Golf City','South-East'),('Chowk','Old City')
) as v(name, zone) where c.slug = 'lucknow' on conflict do nothing;

-- Vadodara
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Alkapuri','Central'),('Manjalpur','East'),('Nizampura','West'),('Fatehgunj','West-Central'),
  ('Gotri','West'),('Waghodia Rd','East'),('Sama','North'),('Vasna','South')
) as v(name, zone) where c.slug = 'vadodara' on conflict do nothing;

-- Rajkot
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Kalavad Rd','West'),('University Rd','Central-West'),('Gondal Rd','South-East'),
  ('Mavdi','South'),('Raiya Rd','West-Central'),('150 Ft Ring Rd','North'),
  ('Sadhuvasvani Rd','South'),('Yagnik Rd','Central')
) as v(name, zone) where c.slug = 'rajkot' on conflict do nothing;

-- Indore
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Vijay Nagar','East'),('Palasia','Central'),('Rau','South-West'),('AB Rd','West'),
  ('Scheme 78','North-East'),('Sudama Nagar','South'),('LIG Square','Central'),('Super Corridor','East')
) as v(name, zone) where c.slug = 'indore' on conflict do nothing;

-- Bhopal
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('MP Nagar','Central'),('Arera Colony','South-Central'),('Kolar','South'),('Shahpura','South'),
  ('Bairagarh','West'),('Lalghati','North'),('Bawadiya Kalan','North-West'),('Danish Kunj','East')
) as v(name, zone) where c.slug = 'bhopal' on conflict do nothing;

-- Nagpur
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Dharampeth','West-Central'),('Civil Lines','Central'),('Manish Nagar','South'),
  ('Pratap Nagar','South-West'),('Nandanvan','East'),('Hudkeshwar','South-East'),
  ('Sadar','North-Central'),('Jafar Nagar','West')
) as v(name, zone) where c.slug = 'nagpur' on conflict do nothing;

-- Chandigarh
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Sector 17','Central'),('Sector 35','South-Central'),('Sector 22','West-Central'),
  ('Sector 15','North'),('Sector 43','South'),('Sector 8','North-Central'),
  ('Manimajra','East'),('Sector 63','South-East')
) as v(name, zone) where c.slug = 'chandigarh' on conflict do nothing;

-- Kochi
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Marine Drive','Central'),('Edappally','North'),('Kakkanad','East'),('Fort Kochi','West'),
  ('Tripunithura','South-East'),('Vyttila','South-Central'),('Kalamassery','North-East'),
  ('Kadavanthra','South')
) as v(name, zone) where c.slug = 'kochi' on conflict do nothing;

-- Coimbatore
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('RS Puram','West-Central'),('Saibaba Colony','North'),('Peelamedu','East'),
  ('Gandhipuram','Central'),('Saravanampatti','North-East'),('Ukkadam','South'),
  ('Vadavalli','West'),('Singanallur','East')
) as v(name, zone) where c.slug = 'coimbatore' on conflict do nothing;

-- Visakhapatnam
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('MVP Colony','North-Central'),('Dwaraka Nagar','Central'),('Gajuwaka','South'),
  ('Madhurawada','North-East'),('Beach Rd','East'),('Seethammadhara','Central'),
  ('NAD Junction','West-Central'),('Pendurthi','West')
) as v(name, zone) where c.slug = 'visakhapatnam' on conflict do nothing;

-- Patna
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Boring Rd','West-Central'),('Kankarbagh','East'),('Patliputra','North-West'),
  ('Rajendra Nagar','Central-East'),('Danapur','West'),('Kumhrar','East'),
  ('Bailey Rd','West'),('Ashok Rajpath','North-Central')
) as v(name, zone) where c.slug = 'patna' on conflict do nothing;

-- Nashik
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('College Rd','Central-West'),('Gangapur Rd','West'),('Nashik Rd','East'),('CIDCO','North-East'),
  ('Panchavati','North-Central'),('Deolali','East'),('Pathardi Phata','South-West'),('Tidke Colony','South')
) as v(name, zone) where c.slug = 'nashik' on conflict do nothing;

-- Gandhinagar
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Sector 21','Central'),('Kudasan','North'),('Sargasan','South'),('Infocity','Central-East'),
  ('Raysan','South-East'),('Vavol','North-West'),('Pethapur','West'),('Borij','South')
) as v(name, zone) where c.slug = 'gandhinagar' on conflict do nothing;

-- Mysuru
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Kuvempunagar','South'),('Vijayanagar','West'),('Gokulam','North'),('JP Nagar','South-East'),
  ('Hebbal','North-East'),('Nazarbad','Central-East'),('Bogadi','West'),('Tilak Nagar','South-Central')
) as v(name, zone) where c.slug = 'mysuru' on conflict do nothing;

-- Bhubaneswar
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Patia','North'),('Chandrasekharpur','North-Central'),('Saheed Nagar','Central'),
  ('Rasulgarh','East'),('Old Town','South'),('Khandagiri','West'),('Pokhariput','South-West'),
  ('Mancheswar','North-East')
) as v(name, zone) where c.slug = 'bhubaneswar' on conflict do nothing;

-- Raipur
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Pandri','Central'),('Shankar Nagar','West-Central'),('Tatibandh','West'),('Gudhiyari','East'),
  ('Devendra Nagar','South-Central'),('Kota','South'),('Byron Bazar','North'),('Avanti Vihar','North-West')
) as v(name, zone) where c.slug = 'raipur' on conflict do nothing;

-- Dehradun
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Rajpur Rd','North-Central'),('Sahastradhara Rd','East'),('Ballupur','West-Central'),
  ('Clement Town','South-East'),('Prem Nagar','North-West'),('Nehru Colony','South'),
  ('Chakrata Rd','West'),('Mothrowala','South-Central')
) as v(name, zone) where c.slug = 'dehradun' on conflict do nothing;

-- Guwahati
insert into areas (city_id, name, zone)
select c.id, v.name, v.zone from cities c cross join (values
  ('Ganeshguri','Central'),('Beltola','South-East'),('Maligaon','West'),('Chandmari','East-Central'),
  ('Paltan Bazar','Central'),('Jalukbari','West'),('Narengi','East'),('Kahilipara','South-Central')
) as v(name, zone) where c.slug = 'guwahati' on conflict do nothing;

-- ============ 3. onboarding option lists (reference) ============
-- These live as app constants + DB check constraints, not tables — the single
-- sources of truth are noted so a new option is added in all three places:
--
-- LANGUAGES (lib/config.ts LANGUAGES; profile_languages check):
--   Hindi, English, Kannada, Gujarati, Marathi, Punjabi, Tamil, Telugu, Bengali, Other
-- WORK (lib/config.ts WORKS; free-text chip on profile, no constraint):
--   Tech, Design, Product, Marketing, Founder, Finance, Student, Creative, Other
-- INTERESTS (lib/config.ts INTERESTS; profile_interests free text ≤20 chars):
--   Music, Travel, Books, Fitness, Gaming, Photography, Food, Dance, Art, Trekking
--   (+ up to 5 custom user chips)
-- MOVIE GENRES (lib/config.ts MOVIE_GENRES; profile_movie_genres check):
--   Comedy, Romance, Action, Thriller, Horror, Drama, Sci-fi, Animation, Documentary, Bollywood masala
-- DIETS (lib/config.ts DIETS; diet_t enum):
--   veg, jain, eggetarian, non_veg
-- CUISINES (lib/config.ts CUISINES; profile_cuisines check):
--   Gujarati, South Indian, North Indian, Chinese, Italian, Street food, Mexican, Japanese, Thai, Desserts
-- AFTER GARBA (lib/config.ts AFTER_GARBA; after_garba_t enum):
--   street_food, cafe, dinner, straight_home, flexible
-- DANCE LEVELS (lib/config.ts DANCE_LEVELS; dance_level_t enum):
--   first_timer, basic_taali, circle_lead
-- INTENTIONS (lib/config.ts INTENTIONS; intention_t enum):
--   just_dance, find_group, dance_food, open_more
-- DISTANCE (lib/config.ts HOW_FAR; how_far_t enum):
--   same_area, nearby, anywhere
-- SEEKING (lib/config.ts SEEKINGS; seeking_t enum):
--   women, men, anyone, group
-- STAR SIGNS (lib/config.ts STAR_SIGNS; star_sign 1-12, element-mapped in SQL):
--   1 Aries … 12 Pisces
-- DIET RULES (dealbreakers.diet_rule; diet_rule_t enum):
--   any, same_only, veg_friendly

-- ============ 4. verify (notices only; never fail a reset) ============
do $$
declare n_cities int; n_areas int; n_nocity int; n_thin text;
begin
  select count(*) into n_cities from cities where is_launched;
  select count(*), count(*) filter (where city_id is null) into n_areas, n_nocity from areas;
  select string_agg(slug, ', ') into n_thin from (
    select c.slug from cities c left join areas a on a.city_id = c.id
    where c.is_launched group by c.slug having count(a.id) < 8
  ) t;
  raise notice 'seed: % launched cities, % areas (% without city_id)', n_cities, n_areas, n_nocity;
  if n_thin is not null then raise notice 'seed: cities with <8 areas: %', n_thin; end if;
end $$;
