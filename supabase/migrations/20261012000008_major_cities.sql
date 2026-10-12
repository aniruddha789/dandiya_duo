-- Migration 08: major-city support.
-- The old 3-value city_t enum ('bengaluru','delhi_ncr','pune') becomes free
-- text so onboarding/settings can offer all major cities without a new
-- migration per city. Existing rows keep their values via USING casts.
--
-- ROLLBACK (data stays readable; enum restore is manual):
--   delete from areas where city not in ('bengaluru','delhi_ncr','pune');
--   update profiles set city = 'bengaluru' where city not in ('bengaluru','delhi_ncr','pune');
--   alter table events alter column city type city_t using city::city_t;
--   alter table areas alter column city type city_t using city::city_t;
--   alter table profiles alter column city type city_t using city::city_t;
--   (then re-create the city_t overload of get_matches from migration 04)

alter table events alter column city type text using city::text;
alter table areas alter column city type text using city::text;
alter table profiles alter column city type text using city::text;

-- get_matches filtered on the enum param; re-issue it with a text param.
-- Scoring/filters unchanged (body copied from migration 04).
drop function if exists get_matches(city_t, int, int);

create or replace function get_matches(p_city text, p_limit int default 20, p_offset int default 0)
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
