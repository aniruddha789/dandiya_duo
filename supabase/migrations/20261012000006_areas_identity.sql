-- Migration 06: harden areas identity.
-- New-city rows carry NULL legacy `city`, which the old unique(city, name)
-- ignores — re-running seeds could duplicate (city_id, name) pairs.
-- This dedupes once and adds the real constraint going forward.

-- ROLLBACK: alter table areas drop constraint areas_city_id_name_key;
delete from areas a using areas b
where a.ctid > b.ctid
  and a.city_id is not distinct from b.city_id
  and a.name = b.name;

alter table areas
  add constraint areas_city_id_name_key unique nulls not distinct (city_id, name);
