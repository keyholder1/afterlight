// Mirrors docs/schema/local_sqlite_schema.sql exactly — that file is the
// canonical spec; this is the runtime copy actually executed on-device.
// If you change one, change the other.

export const LOCAL_SCHEMA_SQL = `
create table if not exists local_meta (
  id            integer primary key check (id = 1),
  user_id       text,
  pair_id       text,
  partner_id    text,
  partner_name  text,
  last_synced_at text
);

create table if not exists memories (
  id              text primary key,
  client_id       text not null unique,
  pair_id         text not null,
  author_id       text not null,
  is_own          integer not null,
  captured_at     text not null,
  uploaded_at     text,
  local_uri       text,
  local_thumb_uri text,
  remote_path     text,
  remote_thumb_path text,
  width           integer,
  height          integer,
  blurhash        text,
  caption         text,
  location_name   text,
  latitude        real,
  longitude       real,
  weather_summary text,
  thoughts        text,
  is_daily_prompt integer not null default 0,
  daily_prompt_id text,
  deleted_at      text,
  created_at      text not null,
  updated_at      text not null,
  synced_at       text
);
create index if not exists idx_memories_captured_at on memories (captured_at);
create index if not exists idx_memories_day on memories (substr(captured_at, 1, 10));
create index if not exists idx_memories_unsynced on memories (synced_at) where synced_at is null;

create table if not exists day_summaries (
  day               text primary key,
  memory_count      integer not null default 0,
  own_count         integer not null default 0,
  partner_count     integer not null default 0,
  cover_thumb_uri   text,
  has_daily_prompt_complete integer not null default 0
);

create table if not exists life_chapters (
  id             text primary key,
  title          text not null,
  starts_on      text not null,
  ends_on        text,
  auto_generated integer not null default 1,
  updated_at     text not null,
  synced_at      text
);
create index if not exists idx_chapters_starts_on on life_chapters (starts_on);

create table if not exists daily_songs (
  day        text primary key,
  title      text not null,
  artist     text,
  link_url   text,
  added_by   text not null,
  created_at text not null,
  synced_at  text
);

create table if not exists daily_prompts (
  id                text primary key,
  prompt_date       text not null unique,
  prompt_line       text not null,
  fire_at           text not null,
  window_ends_at    text not null,
  own_memory_id     text,
  partner_memory_id text,
  completed_at      text
);

create table if not exists pending_uploads (
  memory_id       text primary key references memories(id) on delete cascade,
  local_uri       text not null,
  local_thumb_uri text not null,
  attempts        integer not null default 0,
  last_error      text,
  status          text not null default 'queued'
);
`;
