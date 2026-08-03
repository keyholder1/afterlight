// See docs/06-technical-architecture.md § Notifications. The row is created
// server-side (send-daily-prompt); the client reads it and, once this
// user's capture is in, links it — the two user_*_memory_id columns are
// additive-only (each side only ever sets its own), so there's no conflict
// by construction (docs/04-database-schema.md § Conflict resolution).

import { supabase } from './client';
import { upsertLocalPrompt, LocalPrompt } from '../db/dailyPrompts';
import type { Pair } from './pairing';

type RemotePromptRow = {
  id: string;
  pair_id: string;
  prompt_date: string;
  prompt_line: string;
  fire_at: string;
  window_ends_at: string;
  user_a_memory_id: string | null;
  user_b_memory_id: string | null;
  completed_at: string | null;
};

function toLocal(row: RemotePromptRow, pair: Pair, myUserId: string): LocalPrompt {
  const iAmA = pair.user_a === myUserId;
  return {
    id: row.id,
    prompt_date: row.prompt_date,
    prompt_line: row.prompt_line,
    fire_at: row.fire_at,
    window_ends_at: row.window_ends_at,
    own_memory_id: iAmA ? row.user_a_memory_id : row.user_b_memory_id,
    partner_memory_id: iAmA ? row.user_b_memory_id : row.user_a_memory_id,
    completed_at: row.completed_at,
  };
}

export async function fetchTodayPrompt(pair: Pair, myUserId: string): Promise<LocalPrompt | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('daily_prompts')
    .select('*')
    .eq('pair_id', pair.id)
    .eq('prompt_date', today)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const local = toLocal(data as RemotePromptRow, pair, myUserId);
  await upsertLocalPrompt(local);
  return local;
}

export async function linkMemoryToPrompt(
  pair: Pair,
  myUserId: string,
  promptId: string,
  memoryId: string,
): Promise<void> {
  const column = pair.user_a === myUserId ? 'user_a_memory_id' : 'user_b_memory_id';
  const { error } = await supabase.from('daily_prompts').update({ [column]: memoryId }).eq('id', promptId);
  if (error) throw error;

  const { data } = await supabase.from('daily_prompts').select('*').eq('id', promptId).maybeSingle();
  if (data) {
    const row = data as RemotePromptRow;
    if (row.user_a_memory_id && row.user_b_memory_id && !row.completed_at) {
      await supabase.from('daily_prompts').update({ completed_at: new Date().toISOString() }).eq('id', promptId);
    }
    await upsertLocalPrompt(toLocal(row, pair, myUserId));
  }
}
