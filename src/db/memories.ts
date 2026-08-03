// Local `memories` repository — see docs/schema/local_sqlite_schema.sql.
//
// Implementation choice: `id` is always set equal to `client_id` (both the
// same client-generated UUID), on both the local row and the row pushed to
// Supabase. The frozen schema's `id uuid default gen_random_uuid()` allows
// an explicit value to be supplied instead of using the default, and doing
// so means there's never an "id swap" step to reconcile after sync — one
// fewer moving part for the same idempotency guarantee `client_id` was
// already providing.

import { getDb } from './index';
import { uuid } from '../lib/uuid';

export type LocalMemory = {
  id: string;
  client_id: string;
  pair_id: string;
  author_id: string;
  is_own: 0 | 1;
  captured_at: string;
  uploaded_at: string | null;
  local_uri: string | null;
  local_thumb_uri: string | null;
  remote_path: string | null;
  remote_thumb_path: string | null;
  width: number | null;
  height: number | null;
  blurhash: string | null;
  caption: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  weather_summary: string | null;
  thoughts: string | null;
  is_daily_prompt: 0 | 1;
  daily_prompt_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
};

export type NewMemoryInput = {
  pairId: string;
  authorId: string;
  capturedAt: string;
  localUri: string;
  localThumbUri: string;
  width: number;
  height: number;
  blurhash: string;
  caption?: string | null;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDailyPrompt?: boolean;
  dailyPromptId?: string | null;
};

export async function insertLocalMemory(input: NewMemoryInput): Promise<LocalMemory> {
  const db = await getDb();
  const id = uuid();
  const now = new Date().toISOString();

  const memory: LocalMemory = {
    id,
    client_id: id,
    pair_id: input.pairId,
    author_id: input.authorId,
    is_own: 1,
    captured_at: input.capturedAt,
    uploaded_at: null,
    local_uri: input.localUri,
    local_thumb_uri: input.localThumbUri,
    remote_path: null,
    remote_thumb_path: null,
    width: input.width,
    height: input.height,
    blurhash: input.blurhash,
    caption: input.caption ?? null,
    location_name: input.locationName ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    weather_summary: null,
    thoughts: null,
    is_daily_prompt: input.isDailyPrompt ? 1 : 0,
    daily_prompt_id: input.dailyPromptId ?? null,
    deleted_at: null,
    created_at: now,
    updated_at: now,
    synced_at: null,
  };

  await db.runAsync(
    `insert into memories (
       id, client_id, pair_id, author_id, is_own, captured_at, uploaded_at,
       local_uri, local_thumb_uri, remote_path, remote_thumb_path,
       width, height, blurhash, caption, location_name, latitude, longitude,
       weather_summary, thoughts, is_daily_prompt, daily_prompt_id,
       deleted_at, created_at, updated_at, synced_at
     ) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
    [
      memory.id,
      memory.client_id,
      memory.pair_id,
      memory.author_id,
      memory.is_own,
      memory.captured_at,
      memory.uploaded_at,
      memory.local_uri,
      memory.local_thumb_uri,
      memory.remote_path,
      memory.remote_thumb_path,
      memory.width,
      memory.height,
      memory.blurhash,
      memory.caption,
      memory.location_name,
      memory.latitude,
      memory.longitude,
      memory.weather_summary,
      memory.thoughts,
      memory.is_daily_prompt,
      memory.daily_prompt_id,
      memory.deleted_at,
      memory.created_at,
      memory.updated_at,
      memory.synced_at,
    ],
  );

  await db.runAsync(
    `insert into pending_uploads (memory_id, local_uri, local_thumb_uri) values (?, ?, ?);`,
    [memory.id, input.localUri, input.localThumbUri],
  );

  return memory;
}

export async function getMemoryById(id: string): Promise<LocalMemory | null> {
  const db = await getDb();
  return db.getFirstAsync<LocalMemory>('select * from memories where id = ?;', [id]);
}

export async function getRecentMemories(pairId: string, limit = 20): Promise<LocalMemory[]> {
  const db = await getDb();
  return db.getAllAsync<LocalMemory>(
    `select * from memories where pair_id = ? and deleted_at is null order by captured_at desc limit ?;`,
    [pairId, limit],
  );
}
