-- RelationshipOS — P0 migration: places + place_images
-- Mirrors Backend_Schema.md §3 (enums), §4.4–4.5 (tables), §5 (RLS).
-- Run in Supabase SQL Editor (or via Supabase CLI). Idempotent-ish for first apply.

-- ── Enums ────────────────────────────────────────────────────────────────
do $$ begin
  create type place_category as enum (
    'restaurant','cafe','resort','art_cafe','pottery','adventure','movie',
    'workshop','event','live_music','festival','attraction','experience','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type mood_tag as enum (
    'romantic','budget','luxury','adventure','nature','nightlife',
    'indoor','outdoor','trending','chill','foodie');
exception when duplicate_object then null; end $$;

do $$ begin
  create type place_source as enum ('manual','google_places','import');
exception when duplicate_object then null; end $$;

-- ── places ───────────────────────────────────────────────────────────────
create table if not exists places (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     place_category not null,
  description  text,
  city         text not null,
  area         text,
  address      text,
  lat          double precision,
  lng          double precision,
  price_level  int check (price_level between 1 and 4),
  avg_cost_inr int,
  rating       numeric(2,1) check (rating between 0 and 5),
  moods        mood_tag[] default '{}',
  tags         text[] default '{}',
  timings      jsonb,
  booking_url  text,
  cover_url    text,
  source       place_source not null default 'manual',
  external_ref text,
  is_active    boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists places_city_idx on places(city);
create index if not exists places_category_idx on places(category);
create index if not exists places_moods_idx on places using gin(moods);
create index if not exists places_is_active_idx on places(is_active);

-- ── place_images ─────────────────────────────────────────────────────────
create table if not exists place_images (
  id         uuid primary key default gen_random_uuid(),
  place_id   uuid not null references places(id) on delete cascade,
  url        text not null,
  position   int default 0,
  blurhash   text,
  created_at timestamptz default now()
);
create index if not exists place_images_place_id_idx on place_images(place_id);

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table places enable row level security;
alter table place_images enable row level security;

-- P0 NOTE: Backend_Schema §5.2 restricts reads to authenticated users, but P0 has no auth yet
-- and browses with the anon/publishable key. Places are a public catalog, so we allow public
-- SELECT here. Tighten to `auth.role() = 'authenticated'` in P1 once sign-in exists. Writes stay
-- service-role only (no insert/update/delete policy = default-deny for anon/auth).
drop policy if exists "places public read" on places;
create policy "places public read" on places for select using (true);

drop policy if exists "place_images public read" on place_images;
create policy "place_images public read" on place_images for select using (true);
