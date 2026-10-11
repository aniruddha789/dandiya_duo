-- Migration: private photos bucket + storage policies (spec section 6)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos','photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false;

-- Storage RLS policies: owners manage own folder (<uid>/...), admins full.
drop policy if exists photos_owner_rw on storage.objects;
drop policy if exists photos_admin on storage.objects;

create policy photos_owner_rw on storage.objects for all to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy photos_admin on storage.objects for all to authenticated
  using (bucket_id = 'photos' and exists (select 1 from public.admins where id = auth.uid()))
  with check (bucket_id = 'photos' and exists (select 1 from public.admins where id = auth.uid()));
