// Local daily_prompts cache — see docs/schema/local_sqlite_schema.sql and
// docs/02-ux-flows-and-wireframes.md § 2. The row itself is created
// server-side (supabase/functions/send-daily-prompt, Phase 5's cron job);
// this is just where the device keeps a copy once it's seen one.

import { getDb } from './index';

export type LocalPrompt = {
  id: string;
  prompt_date: string;
  prompt_line: string;
  fire_at: string;
  window_ends_at: string;
  own_memory_id: string | null;
  partner_memory_id: string | null;
  completed_at: string | null;
};

export async function getLocalPromptForDate(dateKey: string): Promise<LocalPrompt | null> {
  const db = await getDb();
  return db.getFirstAsync<LocalPrompt>('select * from daily_prompts where prompt_date = ?;', [dateKey]);
}

export async function upsertLocalPrompt(prompt: LocalPrompt): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `insert into daily_prompts (id, prompt_date, prompt_line, fire_at, window_ends_at, own_memory_id, partner_memory_id, completed_at)
     values (?, ?, ?, ?, ?, ?, ?, ?)
     on conflict(prompt_date) do update set
       id = excluded.id,
       prompt_line = excluded.prompt_line,
       fire_at = excluded.fire_at,
       window_ends_at = excluded.window_ends_at,
       own_memory_id = excluded.own_memory_id,
       partner_memory_id = excluded.partner_memory_id,
       completed_at = excluded.completed_at;`,
    [
      prompt.id,
      prompt.prompt_date,
      prompt.prompt_line,
      prompt.fire_at,
      prompt.window_ends_at,
      prompt.own_memory_id,
      prompt.partner_memory_id,
      prompt.completed_at,
    ],
  );
}
