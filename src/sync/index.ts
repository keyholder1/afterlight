// The sync engine — three plain functions, no outbox framework. See
// docs/06-technical-architecture.md § Sync and docs/04-database-schema.md.
//
// pushUnsynced() is implemented here (Phase 2, since it's what makes a
// captured photo actually leave the device). pullSince()/subscribeRealtime()
// land in Phase 3 alongside the Home Timeline that needs to show the
// partner's memories.

import { File } from 'expo-file-system';
import { getDb } from '../db';
import { supabase } from '../supabase/client';

const STORAGE_BUCKET = 'memories';

type PendingUpload = {
  memory_id: string;
  local_uri: string;
  local_thumb_uri: string;
  attempts: number;
  last_error: string | null;
  status: 'queued' | 'uploading' | 'uploaded' | 'failed';
};

type UnsyncedMemoryRow = {
  id: string;
  client_id: string;
  pair_id: string;
  author_id: string;
  captured_at: string;
  uploaded_at: string | null;
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
  is_daily_prompt: number;
  daily_prompt_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

async function uploadPendingPhoto(pending: PendingUpload, pairId: string): Promise<{ path: string; thumbPath: string }> {
  const path = `${pairId}/${pending.memory_id}/original.jpg`;
  const thumbPath = `${pairId}/${pending.memory_id}/thumb.jpg`;

  // Thumbnail first — unblocks the partner's low-res preview sooner.
  const thumbBytes = await new File(pending.local_thumb_uri).bytes();
  const { error: thumbError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(thumbPath, thumbBytes, { contentType: 'image/jpeg', upsert: true });
  if (thumbError) throw thumbError;

  const fullBytes = await new File(pending.local_uri).bytes();
  const { error: fullError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, fullBytes, { contentType: 'image/jpeg', upsert: true });
  if (fullError) throw fullError;

  return { path, thumbPath };
}

export async function pushUnsynced(): Promise<{ pushed: number; failed: number }> {
  const db = await getDb();
  const unsynced = await db.getAllAsync<UnsyncedMemoryRow>(
    `select * from memories where synced_at is null and deleted_at is null order by created_at asc;`,
  );

  let pushed = 0;
  let failed = 0;

  for (const memory of unsynced) {
    const pending = await db.getFirstAsync<PendingUpload>(
      `select * from pending_uploads where memory_id = ?;`,
      [memory.id],
    );

    try {
      let remotePath = memory.remote_path;
      let remoteThumbPath = memory.remote_thumb_path;

      if (pending && pending.status !== 'uploaded') {
        await db.runAsync(`update pending_uploads set status = 'uploading' where memory_id = ?;`, [memory.id]);
        const uploaded = await uploadPendingPhoto(pending, memory.pair_id);
        remotePath = uploaded.path;
        remoteThumbPath = uploaded.thumbPath;
        await db.runAsync(`update pending_uploads set status = 'uploaded' where memory_id = ?;`, [memory.id]);
      }

      const { error: upsertError } = await supabase.from('memories').upsert(
        {
          id: memory.id,
          pair_id: memory.pair_id,
          author_id: memory.author_id,
          captured_at: memory.captured_at,
          uploaded_at: memory.uploaded_at ?? new Date().toISOString(),
          storage_path: remotePath,
          thumb_path: remoteThumbPath,
          width: memory.width,
          height: memory.height,
          blurhash: memory.blurhash,
          caption: memory.caption,
          location_name: memory.location_name,
          latitude: memory.latitude,
          longitude: memory.longitude,
          weather_summary: memory.weather_summary,
          thoughts: memory.thoughts,
          is_daily_prompt: !!memory.is_daily_prompt,
          daily_prompt_id: memory.daily_prompt_id,
          deleted_at: memory.deleted_at,
          client_id: memory.client_id,
          created_at: memory.created_at,
          updated_at: memory.updated_at,
        },
        { onConflict: 'pair_id,client_id' },
      );
      if (upsertError) throw upsertError;

      const nowIso = new Date().toISOString();
      await db.runAsync(
        `update memories set remote_path = ?, remote_thumb_path = ?, uploaded_at = coalesce(uploaded_at, ?), synced_at = ? where id = ?;`,
        [remotePath, remoteThumbPath, nowIso, nowIso, memory.id],
      );
      if (pending) {
        await db.runAsync(`delete from pending_uploads where memory_id = ?;`, [memory.id]);
      }
      pushed++;
    } catch (err: any) {
      failed++;
      if (pending) {
        await db.runAsync(
          `update pending_uploads set status = 'failed', attempts = attempts + 1, last_error = ? where memory_id = ?;`,
          [String(err?.message ?? err), memory.id],
        );
      }
      console.warn(`Sync failed for memory ${memory.id}:`, err);
    }
  }

  return { pushed, failed };
}
