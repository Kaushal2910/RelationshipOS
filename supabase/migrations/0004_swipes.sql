-- RelationshipOS — P3 migration: swipes + wishlist + mutual-match trigger
-- Mirrors Backend_Schema.md §4.6–4.7, §5, §6.
-- Run after 0001_places.sql, 0002_profiles.sql, 0003_couples.sql.

-- ── Enums ────────────────────────────────────────────────────────────────
do $$ begin
  create type swipe_decision as enum ('like','pass','superlike');
exception when duplicate_object then null; end $$;

do $$ begin
  create type item_status as enum ('planned','done','cancelled');
exception when duplicate_object then null; end $$;

-- ── swipes ────────────────────────────────────────────────────────────────
create table if not exists swipes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  place_id   uuid not null references places(id) on delete cascade,
  decision   swipe_decision not null,
  created_at timestamptz default now(),
  unique (user_id, place_id)
);
create index if not exists swipes_user_id_idx on swipes(user_id);
create index if not exists swipes_place_id_idx on swipes(place_id);

-- ── wishlist ──────────────────────────────────────────────────────────────
create table if not exists wishlist (
  id            uuid primary key default gen_random_uuid(),
  couple_id     uuid not null references couples(id) on delete cascade,
  place_id      uuid not null references places(id) on delete cascade,
  status        item_status default 'planned',
  both_liked_at timestamptz default now(),
  created_at    timestamptz default now(),
  unique (couple_id, place_id)
);
create index if not exists wishlist_couple_id_idx on wishlist(couple_id);

-- ── Mutual-Match Trigger ──────────────────────────────────────────────────
-- When a user inserts a 'like', check if their partner already liked the same
-- place — if so, create a shared wishlist row. Idempotent (ON CONFLICT DO NOTHING).
create or replace function handle_swipe_match()
returns trigger language plpgsql security definer as $$
declare
  v_couple couples%rowtype;
  v_partner uuid;
begin
  if new.decision <> 'like' then return new; end if;

  select c.* into v_couple from couples c
    join profiles p on p.couple_id = c.id
    where p.id = new.user_id and c.status = 'active';
  if not found then return new; end if;

  v_partner := case when v_couple.user_a_id = new.user_id
                    then v_couple.user_b_id else v_couple.user_a_id end;
  if v_partner is null then return new; end if;

  if exists (select 1 from swipes s
             where s.user_id = v_partner
               and s.place_id = new.place_id
               and s.decision = 'like') then
    insert into wishlist (couple_id, place_id)
    values (v_couple.id, new.place_id)
    on conflict (couple_id, place_id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists trg_swipe_match on swipes;
create trigger trg_swipe_match after insert on swipes
  for each row execute function handle_swipe_match();

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table swipes enable row level security;
alter table wishlist enable row level security;

-- Swipes: user sees/writes only their own.
drop policy if exists "own swipes" on swipes;
create policy "own swipes" on swipes for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Wishlist: scoped to the caller's couple.
drop policy if exists "couple wishlist" on wishlist;
create policy "couple wishlist" on wishlist for all
  using (couple_id = (
    select couple_id from profiles where id = auth.uid()
    limit 1
  ))
  with check (couple_id = (
    select couple_id from profiles where id = auth.uid()
    limit 1
  ));

-- Places: tighten from public-read to authenticated-read (auth is live from P1).
drop policy if exists "places public read" on places;
create policy "places authenticated read" on places for select
  using (auth.role() = 'authenticated');

drop policy if exists "place_images public read" on place_images;
create policy "place_images authenticated read" on place_images for select
  using (auth.role() = 'authenticated');

-- ── Realtime ──────────────────────────────────────────────────────────────
-- Publish wishlist changes so both partners see new matches live.
alter publication supabase_realtime add table wishlist;