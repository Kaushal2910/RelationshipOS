-- Migration 0007: public avatars bucket for profile photos
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public read access
create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');

-- Auth users can upload their own avatars
create policy "avatars_auth_insert" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- Auth users can update/delete their own avatars
create policy "avatars_auth_update" on storage.objects for update
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "avatars_auth_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');
