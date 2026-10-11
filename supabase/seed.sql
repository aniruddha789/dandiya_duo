-- Seed: areas with zones (15-25 neighbourhoods per city). No events table:
-- venue is free text on the profile. Star compatibility is element-based
-- in SQL (star_compat), so no zodiac seed is needed.

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
  ('bengaluru','Chickpet','Central'),('bengaluru','Shivajinagar BLR','Central'),
  ('delhi_ncr','Connaught Place','Central'),('delhi_ncr','Karol Bagh','Central'),
  ('delhi_ncr','Chandni Chowk','Old Delhi'),('delhi_ncr','Saket','South'),
  ('delhi_ncr','Lajpat Nagar','South'),('delhi_ncr','Hauz Khas','South'),
  ('delhi_ncr','Dwarka','West'),('delhi_ncr','Punjabi Bagh','West'),
  ('delhi_ncr','Rohini','North-West'),('delhi_ncr','Model Town','North'),
  ('delhi_ncr','Laxmi Nagar','East'),('delhi_ncr','Mayur Vihar','East'),
  ('delhi_ncr','Noida Sec 18','Noida'),('delhi_ncr','Noida Sec 29','Noida'),
  ('delhi_ncr','Greater Noida','Noida'),('delhi_ncr','Vaishali','Ghaziabad'),
  ('delhi_ncr','Indirapuram','Ghaziabad'),('delhi_ncr','Cyber City','Gurgaon'),
  ('delhi_ncr','Golf Course Rd','Gurgaon'),('delhi_ncr','Faridabad NIT','Faridabad'),
  ('pune','Koregaon Park','Central'),('pune','Camp','Central'),
  ('pune','Shivajinagar','Central'),('pune','Deccan','Central'),
  ('pune','Kothrud','West'),('pune','Baner','West'),
  ('pune','Wakad','West'),('pune','Hinjewadi','West'),
  ('pune','Aundh','West'),('pune','Bavdhan','West'),
  ('pune','Viman Nagar','East'),('pune','Kharadi','East'),
  ('pune','Hadapsar','East'),('pune','Magarpatta','East'),
  ('pune','Pimpri','North'),('pune','Chinchwad','North'),
  ('pune','Katraj','South'),('pune','Kondhwa','South')
on conflict (city, name) do nothing;
