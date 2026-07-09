-- RelationshipOS — P2 migration: couples + invite_codes + redeem RPC
-- Mirrors Backend_Schema.md §4.2–4.3 (tables), §5 (RLS), §6 (definer-fn style).
-- Run in Supabase SQL Editor AFTER 0002_profiles.sql. Idempotent-ish for first apply.

-- couple lifecycle: 'pending' (code generated, waiting) → 'active' (both joined)
do $$ begin
  create type couple_status as enum ('pending','active');
exception when duplicate_object then null; end $$;

-- ── couples ────────────────────────────────────────────────────────────────
create table if not exists couples (
  id         uuid primary key default gen_random_uuid(),
  user_a_id  uuid not null references profiles(id) on delete cascade,
  user_b_id  uuid references profiles(id) on delete set null,   -- null until partner joins
  status     couple_status not null default 'pending',
  paired_at  timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint distinct_partners check (user_a_id <> user_b_id)
);
create index if not exists couples_user_a_idx on couples(user_a_id);
create index if not exists couples_user_b_idx on couples(user_b_id);

-- ── invite_codes ───────────────────────────────────────────────────────────
create table if not exists invite_codes (
  code       text primary key,                       -- short, human-shareable
  couple_id  uuid not null references couples(id) on delete cascade,
  created_by uuid not null references profiles(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at    timestamptz,
  created_at timestamptz default now()
);
create index if not exists invite_codes_couple_idx on invite_codes(couple_id);

-- link a profile to its couple (null = solo); pairing_skipped_at = "pair later" choice.
alter table profiles add column if not exists couple_id uuid references couples(id) on delete set null;
alter table profiles add column if not exists pairing_skipped_at timestamptz;

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table couples enable row level security;
alter table invite_codes enable row level security;

-- a member reads their own couple (also gates the Realtime feed for "partner joined").
drop policy if exists "couples read own" on couples;
create policy "couples read own" on couples
  for select using (user_a_id = auth.uid() or user_b_id = auth.uid());

-- only the initiator opens a pending couple (user_a = self). Activation is done by
-- redeem_invite_code() below (definer), so no client UPDATE/DELETE policy is needed.
drop policy if exists "couples insert self" on couples;
create policy "couples insert self" on couples
  for insert with check (user_a_id = auth.uid());

-- creator manages their own codes (insert + read to show/regenerate). Redemption never
-- reads by code from the client — that would allow enumeration — it goes through the RPC.
drop policy if exists "invite_codes own" on invite_codes;
create policy "invite_codes own" on invite_codes
  for all using (created_by = auth.uid()) with check (created_by = auth.uid());

-- ── partner-visible profile reads (Backend_Schema §5) ──────────────────────
-- Definer so the inner select bypasses RLS (avoids recursion on the profiles policy).
create or replace function public.current_couple_id()
returns uuid language sql stable security definer set search_path = public as $$
  select couple_id from profiles where id = auth.uid()
$$;

drop policy if exists "profiles read own" on profiles;
drop policy if exists "profiles read own or partner" on profiles;
create policy "profiles read own or partner" on profiles
  for select using (id = auth.uid() or couple_id = current_couple_id());

-- ── Redeem a code: activates the couple + links both profiles (definer) ─────
create or replace function public.redeem_invite_code(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_code   invite_codes;
  v_couple couples;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from profiles where id = v_uid and couple_id is not null) then
    raise exception 'already_paired';
  end if;

  select * into v_code from invite_codes where code = upper(trim(p_code));
  if not found then raise exception 'invalid'; end if;
  if v_code.used_at is not null then raise exception 'already_used'; end if;
  if v_code.expires_at < now() then raise exception 'expired'; end if;

  select * into v_couple from couples where id = v_code.couple_id;
  if v_couple.status <> 'pending' then raise exception 'already_paired'; end if;
  if v_couple.user_a_id = v_uid then raise exception 'self_code'; end if;

  update couples
     set user_b_id = v_uid, status = 'active', paired_at = now(), updated_at = now()
   where id = v_couple.id;
  update invite_codes set used_at = now() where code = v_code.code;
  update profiles set couple_id = v_couple.id where id in (v_couple.user_a_id, v_uid);

  return v_couple.id;
end;
$$;

grant execute on function public.current_couple_id() to authenticated;
grant execute on function public.redeem_invite_code(text) to authenticated;

-- Realtime for "partner joined". `when others` = idempotency guard on re-run
-- (adding a table already in the publication errors).
-- ponytail: broad catch is fine for a one-line migration guard.
do $$ begin
  alter publication supabase_realtime add table couples;
exception when others then null; end $$;
