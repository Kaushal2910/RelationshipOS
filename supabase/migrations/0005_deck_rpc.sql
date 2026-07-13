-- RelationshipOS — P4 migration: get_deck_for_user RPC
-- Excludes places the user has already swiped on, applies optional filters
-- (city, moods, price_level), and returns up to 20 cards.
-- Run after 0004_swipes.sql.

create or replace function get_deck_for_user(
  p_user_id   uuid,
  p_city      text   default null,
  p_moods     text[] default null,
  p_price_level int  default null
)
returns setof places
language plpgsql security definer as $$
begin
  return query
    select p.*
    from places p
    where p.is_active = true
      and not exists (
        select 1 from swipes s
        where s.user_id = p_user_id
          and s.place_id = p.id
      )
      and (p_city is null or p.city = p_city)
      and (p_moods is null or p.moods && p_moods::mood_tag[])
      and (p_price_level is null or p.price_level <= p_price_level)
    order by p.created_at desc
    limit 20;
end $$;