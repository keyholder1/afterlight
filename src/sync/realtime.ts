// subscribeRealtime() — the third sync-engine function, the one piece of
// "live" infrastructure kept because the daily-capture waiting state
// genuinely depends on it. See docs/06-technical-architecture.md § Sync.

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { upsertRemoteMemory, RemoteMemoryRow } from '../db/memories';

export function subscribeRealtime(pairId: string, userId: string, onChange: () => void): () => void {
  let channel: RealtimeChannel | null = supabase
    .channel(`memories-${pairId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'memories', filter: `pair_id=eq.${pairId}` },
      async (payload) => {
        const row = payload.new as RemoteMemoryRow | undefined;
        if (row) {
          await upsertRemoteMemory(row, userId);
          onChange();
        }
      },
    )
    .subscribe();

  return () => {
    channel?.unsubscribe();
    channel = null;
  };
}
