-- 0006_calendar_memories.sql
-- Calendar items, memories, and memory media for P5

-- Helper function to update updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Calendar items table
create table calendar_items (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references couples(id) on delete cascade,
  place_id    uuid references places(id) on delete set null,
  created_by  uuid not null references profiles(id) on delete cascade,
  title       text not null,
  type        text not null default 'date',
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  status      text default 'planned',
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  deleted_at  timestamptz
);
create index on calendar_items(couple_id, starts_at);

-- Memories table
create table memories (
  id                uuid primary key default gen_random_uuid(),
  couple_id         uuid not null references couples(id) on delete cascade,
  calendar_item_id  uuid references calendar_items(id) on delete set null,
  place_id          uuid references places(id) on delete set null,
  created_by        uuid not null references profiles(id) on delete cascade,
  title             text,
  note              text,
  memory_date       date not null,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  deleted_at        timestamptz
);
create index on memories(couple_id, memory_date);

-- Memory media table
create table memory_media (
  id         uuid primary key default gen_random_uuid(),
  memory_id  uuid not null references memories(id) on delete cascade,
  url        text not null,
  type       text not null default 'photo',
  blurhash   text,
  position   int default 0,
  created_at timestamptz default now()
);
create index on memory_media(memory_id);

-- Enable RLS on all tables
alter table calendar_items enable row level security;
alter table memories enable row level security;
alter table memory_media enable row level security;

-- RLS policies for calendar_items
create policy "couple calendar_items" on calendar_items for all
  using (couple_id = current_couple_id())
  with check (couple_id = current_couple_id());

-- RLS policies for memories
create policy "couple memories" on memories for all
  using (couple_id = current_couple_id())
  with check (couple_id = current_couple_id());

-- RLS policies for memory_media (via memory_id join to memories)
create policy "couple memory_media" on memory_media for all
  using (
    exists (
      select 1 from memories m
      where m.id = memory_media.memory_id
        and m.couple_id = current_couple_id()
    )
  )
  with check (
    exists (
      select 1 from memories m
      where m.id = memory_media.memory_id
        and m.couple_id = current_couple_id()
    )
  );

-- Updated_at trigger for calendar_items
create trigger set_calendar_items_updated_at
  before update on calendar_items
  for each row execute function update_updated_at_column();

-- Updated_at trigger for memories
create trigger set_memories_updated_at
  before update on memories
  for each row execute function update_updated_at_column();