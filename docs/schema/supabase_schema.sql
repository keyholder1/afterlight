-- ============================================================================
-- Afterlight — Supabase (Postgres) schema
-- Backend role: pairing, cross-device sync, backup, realtime relay.
-- NOT the read path for the app UI — the app reads from local SQLite
-- (see local_sqlite_schema.sql) and syncs against these tables in the
-- background. Two users only, ever, per row of `pairs` — schema is
-- intentionally not multi-tenant-generic.
--
-- Scoped to the MVP: pairing, memories, the daily capture gate, and
-- Relationship Seasons/one-song-per-day (the "soul" features folded into
-- the five MVP screens). Scrapbook, collections, tags/search, and every
-- other post-launch idea deliberately have no schema yet — see
-- 07-roadmap.md. Add tables when a feature is actually being built, not
-- before.
-- ============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- --------------------------------------------------------------------------
-- profiles — one row per auth.users, extends Supabase auth
-- --------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- pairing_codes — short-lived, single-use codes for linking two accounts
-- --------------------------------------------------------------------------
create table public.pairing_codes (
  code        text primary key,              -- 6-char human code, e.g. '9FK3X7'
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  consumed_by uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);
create index on public.pairing_codes (owner_id);

-- --------------------------------------------------------------------------
-- pairs — the core relationship. Exactly one row links two profiles.
-- --------------------------------------------------------------------------
create table public.pairs (
  id            uuid primary key default gen_random_uuid(),
  user_a        uuid not null references public.profiles(id) on delete cascade,
  user_b        uuid not null references public.profiles(id) on delete cascade,
  paired_at     timestamptz not null default now(),
  unlink_requested_at timestamptz,       -- cooldown start, null = not requested
  unlink_requested_by uuid references public.profiles(id),
  unlinked_at   timestamptz,             -- set once cooldown elapses and unlink finalizes
  constraint distinct_users check (user_a <> user_b),
  constraint ordered_pair unique (user_a, user_b)
);
create index on public.pairs (user_a);
create index on public.pairs (user_b);

-- A profile should belong to at most one *active* pair at a time.
create unique index one_active_pair_per_user_a
  on public.pairs (user_a) where (unlinked_at is null);
create unique index one_active_pair_per_user_b
  on public.pairs (user_b) where (unlinked_at is null);

-- --------------------------------------------------------------------------
-- memories — one row per uploaded photo
-- --------------------------------------------------------------------------
create table public.memories (
  id           uuid primary key default gen_random_uuid(),
  pair_id      uuid not null references public.pairs(id) on delete cascade,
  author_id    uuid not null references public.profiles(id),
  captured_at  timestamptz not null,        -- device-local capture time, source of truth for placement
  uploaded_at  timestamptz not null default now(),
  storage_path text not null,               -- path within `memories` bucket
  thumb_path   text,                        -- path within `memories` bucket, small variant
  width        int,
  height       int,
  blurhash     text,                        -- placeholder while full image loads
  caption      text,
  location_name text,
  latitude     double precision,
  longitude    double precision,
  weather_summary text,                     -- e.g. "62F, clear" — snapshot at capture time, optional
  thoughts     text,                        -- the "back of the Polaroid" free-text field
  is_daily_prompt boolean not null default false,
  daily_prompt_id uuid references public.daily_prompts(id),
  deleted_at   timestamptz,                 -- soft delete, so partner's device can reconcile
  client_id    uuid not null,               -- generated on-device at capture time, idempotency key for sync
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index on public.memories (pair_id, client_id);
create index on public.memories (pair_id, captured_at);
create index on public.memories (pair_id, author_id, captured_at);

-- --------------------------------------------------------------------------
-- daily_prompts — one per pair per day, drives the capture gate
-- --------------------------------------------------------------------------
create table public.daily_prompts (
  id            uuid primary key default gen_random_uuid(),
  pair_id       uuid not null references public.pairs(id) on delete cascade,
  prompt_date   date not null,
  prompt_line   text not null,             -- the human prompt shown, e.g. "Where are you?"
  fire_at       timestamptz not null,      -- randomized send time for that day
  window_ends_at timestamptz not null,     -- capture window close
  user_a_memory_id uuid references public.memories(id),
  user_b_memory_id uuid references public.memories(id),
  completed_at  timestamptz,               -- set when both sides have uploaded
  created_at    timestamptz not null default now(),
  unique (pair_id, prompt_date)
);

alter table public.memories
  add constraint memories_daily_prompt_fk
  foreign key (daily_prompt_id) references public.daily_prompts(id);

-- --------------------------------------------------------------------------
-- life_chapters — Relationship Seasons. Mostly auto-generated (see
-- 06-technical-architecture.md for the detection heuristic); a pair can
-- rename or merge one, but never has to create one by hand for the app
-- to feel this way from day one.
-- --------------------------------------------------------------------------
create table public.life_chapters (
  id           uuid primary key default gen_random_uuid(),
  pair_id      uuid not null references public.pairs(id) on delete cascade,
  title        text not null,             -- "Our First Semester", "Winter Together"
  starts_on    date not null,
  ends_on      date,                      -- null = still the current/open chapter
  auto_generated boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on public.life_chapters (pair_id, starts_on);

-- --------------------------------------------------------------------------
-- daily_songs — one optional song per pair per day, played under Story
-- Playback for that day. Not a streaming integration — just a reference.
-- --------------------------------------------------------------------------
create table public.daily_songs (
  pair_id    uuid not null references public.pairs(id) on delete cascade,
  day        date not null,
  title      text not null,
  artist     text,
  link_url   text,                        -- optional deep link to a streaming service
  added_by   uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (pair_id, day)
);

-- --------------------------------------------------------------------------
-- push_tokens — FCM device tokens
-- --------------------------------------------------------------------------
create table public.push_tokens (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  fcm_token  text not null,
  platform   text not null default 'android',
  updated_at timestamptz not null default now(),
  primary key (user_id, fcm_token)
);

-- --------------------------------------------------------------------------
-- app_releases — manual update-check support (no store auto-update)
-- --------------------------------------------------------------------------
create table public.app_releases (
  version       text primary key,          -- semver, e.g. '1.3.0'
  apk_url       text not null,             -- where to fetch the new APK
  release_notes text,
  is_mandatory  boolean not null default false,
  released_at   timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security — every table scoped to "am I in this pair?"
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.pairing_codes enable row level security;
alter table public.pairs enable row level security;
alter table public.memories enable row level security;
alter table public.daily_prompts enable row level security;
alter table public.life_chapters enable row level security;
alter table public.daily_songs enable row level security;
alter table public.push_tokens enable row level security;

create or replace function public.is_pair_member(check_pair_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.pairs
    where id = check_pair_id
      and (user_a = auth.uid() or user_b = auth.uid())
      and unlinked_at is null
  );
$$;

create policy "read own profile or partner's" on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1 from public.pairs
      where unlinked_at is null
        and ((user_a = auth.uid() and user_b = profiles.id)
          or (user_b = auth.uid() and user_a = profiles.id))
    )
  );
create policy "update own profile" on public.profiles
  for update using (id = auth.uid());
create policy "insert own profile" on public.profiles
  for insert with check (id = auth.uid());

create policy "manage own pairing codes" on public.pairing_codes
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "read code being redeemed" on public.pairing_codes
  for select using (true);  -- code lookup by value must work pre-pair; codes carry no sensitive data

-- --------------------------------------------------------------------------
-- redeem_pairing_code — the entire pairing flow in one atomic call, invoked
-- via supabase.rpc() from the client. No separate Edge Function needed for
-- something this small (see 06-technical-architecture.md § Auth & pairing).
-- --------------------------------------------------------------------------
create or replace function public.redeem_pairing_code(input_code text)
returns uuid  -- returns the new pairs.id
language plpgsql security definer as $$
declare
  code_row public.pairing_codes%rowtype;
  new_pair_id uuid;
begin
  select * into code_row
  from public.pairing_codes
  where code = upper(input_code)
    and consumed_at is null
    and expires_at > now()
  for update;  -- lock the row so two simultaneous redemptions can't both succeed

  if not found then
    raise exception 'invalid_or_expired_code';
  end if;

  if code_row.owner_id = auth.uid() then
    raise exception 'cannot_pair_with_self';
  end if;

  insert into public.pairs (user_a, user_b)
  values (code_row.owner_id, auth.uid())
  returning id into new_pair_id;

  update public.pairing_codes
  set consumed_at = now(), consumed_by = auth.uid()
  where code = code_row.code;

  return new_pair_id;
end;
$$;

create policy "read own pair" on public.pairs
  for select using (user_a = auth.uid() or user_b = auth.uid());
create policy "create pair as participant" on public.pairs
  for insert with check (user_a = auth.uid() or user_b = auth.uid());
create policy "update own pair" on public.pairs
  for update using (user_a = auth.uid() or user_b = auth.uid());

create policy "pair members read memories" on public.memories
  for select using (public.is_pair_member(pair_id));
create policy "pair members write own memories" on public.memories
  for insert with check (public.is_pair_member(pair_id) and author_id = auth.uid());
create policy "author updates own memory" on public.memories
  for update using (public.is_pair_member(pair_id) and author_id = auth.uid());

create policy "pair members read prompts" on public.daily_prompts
  for select using (public.is_pair_member(pair_id));

create policy "pair members manage chapters" on public.life_chapters
  for all using (public.is_pair_member(pair_id)) with check (public.is_pair_member(pair_id));

create policy "pair members manage daily song" on public.daily_songs
  for all using (public.is_pair_member(pair_id)) with check (public.is_pair_member(pair_id));

create policy "manage own push token" on public.push_tokens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- app_releases has no pair-scoped data — readable by any authenticated user.
alter table public.app_releases enable row level security;
create policy "any authenticated user reads releases" on public.app_releases
  for select using (auth.role() = 'authenticated');

-- ============================================================================
-- Storage buckets (create via Supabase dashboard/CLI, policies here for reference)
-- ============================================================================
-- bucket: memories        — path convention: {pair_id}/{memory_id}/original.jpg
-- bucket: memories-thumbs — path convention: {pair_id}/{memory_id}/thumb.jpg
-- Storage RLS mirrors is_pair_member() by parsing the leading path segment as pair_id.
-- See technical architecture doc for the exact storage.objects policy SQL,
-- since it depends on the final bucket names chosen at setup time.
