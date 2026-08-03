-- ============================================================================
-- Base role grants + storage.buckets visibility — discovered missing while
-- actually running the schema against a live local instance (Supabase's
-- hosted platform sets these up automatically outside of migrations; a
-- self-managed/local instance needs them explicit). Not a design change —
-- RLS was always meant to be "the real gate, not table grants" per
-- docs/06-technical-architecture.md § Security; these are the base
-- plumbing RLS depends on to be reachable at all.
-- ============================================================================

-- Without this, anon/authenticated get "permission denied" before RLS is
-- ever evaluated — RLS restricts *rows*, it doesn't substitute for a base
-- table grant.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- So future tables (post-launch features, see docs/07-roadmap.md) don't
-- silently hit the same gap.
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;

-- storage.buckets ships with RLS enabled and zero policies locally, which
-- is default-deny — even though storage.objects (migration 0002) already
-- has the real pair-scoped policies. Bucket *metadata* isn't sensitive on
-- its own (the objects inside are what's actually protected); this just
-- lets an authenticated user see that the "memories" bucket exists.
create policy "authenticated users can see the memories bucket"
on storage.buckets for select
to authenticated
using (id = 'memories');
