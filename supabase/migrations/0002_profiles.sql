-- RelationshipOS — P1 migration: profiles
-- One profile row per auth user. Auto-created on sign-up via trigger so the app
-- never has to insert it from the client (keeps the client simple + RLS tight).
-- Run in Supabase SQL Editor AFTER 0001_places.sql. Idempotent-ish for first apply.

-- ── profiles ─────────────────────────────────────────────────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,                 -- URL only (Supabase Storage / external). Never hardcode.
  city          text default 'Pune',  -- V1 is Pune-first.
  onboarded_at  timestamptz,          -- null = hasn't finished profile setup yet.
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── RLS: a user reads + updates ONLY their own profile ─────────────────────
alter table profiles enable row level security;

drop policy if exists "profiles read own" on profiles;
create policy "profiles read own" on profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles update own" on profiles;
create policy "profiles update own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- No INSERT policy on purpose: rows are created by the trigger below (runs as
-- definer), not by the client. Default-deny keeps clients from spoofing rows.

-- ── Auto-create a profile whenever a new auth user signs up ────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
