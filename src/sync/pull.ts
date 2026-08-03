// pullSince() — the second sync-engine function. See
// docs/06-technical-architecture.md § Sync.

import { supabase } from '../supabase/client';
import { upsertRemoteMemory, RemoteMemoryRow } from '../db/memories';
import { getLocalMeta, setLocalMeta } from '../db/localMeta';
import { recomputeDaySummary, backfillAllDaySummaries } from '../db/daySummaries';
import { dayKey } from '../lib/formatTimestamp';

export async function pullSince(pairId: string, userId: string): Promise<{ pulled: number }> {
  const meta = await getLocalMeta();
  const isFirstSync = !meta.last_synced_at;

  let query = supabase.from('memories').select('*').eq('pair_id', pairId);
  if (meta.last_synced_at) {
    query = query.gt('updated_at', meta.last_synced_at);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as RemoteMemoryRow[];
  const affectedDays = new Set<string>();
  for (const row of rows) {
    await upsertRemoteMemory(row, userId);
    affectedDays.add(dayKey(row.captured_at));
  }

  if (isFirstSync) {
    // day_summaries has nothing yet — cheaper to backfill everything once
    // than to recompute day-by-day for what's likely the whole history.
    await backfillAllDaySummaries();
  } else {
    for (const day of affectedDays) {
      await recomputeDaySummary(day);
    }
  }

  await setLocalMeta({ last_synced_at: new Date().toISOString() });
  return { pulled: rows.length };
}
