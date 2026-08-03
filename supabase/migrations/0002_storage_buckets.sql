-- ============================================================================
-- Storage bucket + RLS — fills in what 0001's schema comment deferred to
-- "setup time" (docs/schema/supabase_schema.sql § Storage buckets). One
-- private bucket, path-prefixed by pair_id, gated by the same
-- is_pair_member() used for every Postgres row — see
-- docs/06-technical-architecture.md § Security.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('memories', 'memories', false)
on conflict (id) do nothing;

create policy "pair members read memories bucket"
on storage.objects for select
using (
  bucket_id = 'memories'
  and public.is_pair_member((storage.foldername(name))[1]::uuid)
);

create policy "pair members write memories bucket"
on storage.objects for insert
with check (
  bucket_id = 'memories'
  and public.is_pair_member((storage.foldername(name))[1]::uuid)
);

create policy "pair members update memories bucket"
on storage.objects for update
using (
  bucket_id = 'memories'
  and public.is_pair_member((storage.foldername(name))[1]::uuid)
);
