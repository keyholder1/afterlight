-- ============================================================================
-- Afterlight — local SQLite schema (on-device, via expo-sqlite)
-- This is the READ PATH for the entire app. Every screen queries this
-- database, never Supabase directly.
--
-- Kept deliberately plain: no generic polymorphic outbox table, no
-- repository-framework scaffolding. Every syncable row just carries its
-- own `synced_at` (null = not yet pushed) and the sync step is "select
-- where synced_at is null, push, stamp it." That's enough at this scale —
-- see 06-technical-architecture.md for why a heavier sync engine isn't
-- worth building for two users.
-- ============================================================================

pragma journal_mode = WAL;         -- concurrent read while sync writes
pragma foreign_keys = ON;

-- --------------------------------------------------------------------------
-- local_meta — single-row table for this device's session state
-- --------------------------------------------------------------------------
create table local_meta (
  id            integer primary key check (id = 1),
  user_id       text,               -- auth.users.id once signed in
  pair_id       text,               -- null until paired
  partner_id    text,
  partner_name  text,
  last_synced_at text               -- ISO8601, drives incremental pulls
);

-- --------------------------------------------------------------------------
-- memories — mirrors public.memories
-- --------------------------------------------------------------------------
create table memories (
  id              text primary key,       -- server uuid once synced; client_id before that
  client_id       text not null unique,   -- generated on-device at capture, stable across sync
  pair_id         text not null,
  author_id       text not null,
  is_own          integer not null,       -- 0/1 denormalized for fast column split in UI
  captured_at     text not null,          -- ISO8601, local device time at capture
  uploaded_at     text,
  local_uri       text,                   -- file:// path, present once captured on this device
  local_thumb_uri text,
  remote_path     text,                   -- storage_path once uploaded
  remote_thumb_path text,
  width           integer,
  height          integer,
  blurhash        text,
  caption         text,
  location_name   text,
  latitude        real,
  longitude       real,
  weather_summary text,
  thoughts        text,                   -- "back of the Polaroid" field, see flip-to-back gesture
  is_daily_prompt integer not null default 0,
  daily_prompt_id text,
  deleted_at      text,
  created_at      text not null,
  updated_at      text not null,
  synced_at       text                    -- null = not yet pushed to Supabase
);
create index idx_memories_captured_at on memories (captured_at);
create index idx_memories_day on memories (substr(captured_at, 1, 10));
create index idx_memories_unsynced on memories (synced_at) where synced_at is null;

-- --------------------------------------------------------------------------
-- day_summaries — precomputed per-day rollup, backs the Calendar screen
-- (film-strip cells) so opening the month grid never scans memories.
-- --------------------------------------------------------------------------
create table day_summaries (
  day               text primary key,     -- 'YYYY-MM-DD'
  memory_count      integer not null default 0,
  own_count         integer not null default 0,
  partner_count     integer not null default 0,
  cover_thumb_uri   text,                 -- best thumbnail for the film-strip cell
  has_daily_prompt_complete integer not null default 0
);

-- --------------------------------------------------------------------------
-- life_chapters — Relationship Seasons, mirrors public.life_chapters.
-- Local device also does the first-pass detection (see
-- 06-technical-architecture.md) so a season header can render even before
-- the next sync confirms it server-side.
-- --------------------------------------------------------------------------
create table life_chapters (
  id             text primary key,
  title          text not null,
  starts_on      text not null,
  ends_on        text,
  auto_generated integer not null default 1,
  updated_at     text not null,
  synced_at      text
);
create index idx_chapters_starts_on on life_chapters (starts_on);

-- --------------------------------------------------------------------------
-- daily_songs — mirrors public.daily_songs
-- --------------------------------------------------------------------------
create table daily_songs (
  day        text primary key,     -- 'YYYY-MM-DD'
  title      text not null,
  artist     text,
  link_url   text,
  added_by   text not null,
  created_at text not null,
  synced_at  text
);

-- --------------------------------------------------------------------------
-- daily_prompts — mirrors Supabase, drives capture-gate UI state
-- --------------------------------------------------------------------------
create table daily_prompts (
  id                text primary key,
  prompt_date       text not null unique,
  prompt_line       text not null,
  fire_at           text not null,
  window_ends_at    text not null,
  own_memory_id     text,
  partner_memory_id text,
  completed_at      text
);

-- --------------------------------------------------------------------------
-- pending_uploads — photo upload has its own retry/backoff/progress
-- semantics distinct from row-level metadata sync, so it gets its own
-- small queue rather than being folded into the memories row itself.
-- --------------------------------------------------------------------------
create table pending_uploads (
  memory_id       text primary key references memories(id) on delete cascade,
  local_uri       text not null,
  local_thumb_uri text not null,
  attempts        integer not null default 0,
  last_error      text,
  status          text not null default 'queued'   -- 'queued' | 'uploading' | 'uploaded' | 'failed'
);
