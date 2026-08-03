// pullSince() — the second sync-engine function. See
// docs/06-technical-architecture.md § Sync.

import { supabase } from '../supabase/client';
import { upsertRemoteMemory, RemoteMemoryRow } from '../db/memories';
import { getLocalMeta, setLocalMeta } from '../db/localMeta';

export async function pullSince(pairId: string, userId: string): Promise<{ pulled: number }> {
  const meta = await getLocalMeta();
  let query = supabase.from('memories').select('*').eq('pair_id', pairId);
  if (meta.last_synced_at) {
    query = query.gt('updated_at', meta.last_synced_at);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as RemoteMemoryRow[];
  for (const row of rows) {
    await upsertRemoteMemory(row, userId);
  }

  await setLocalMeta({ last_synced_at: new Date().toISOString() });
  return { pulled: rows.length };
}
