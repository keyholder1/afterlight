// day_summaries maintenance — see docs/06-technical-architecture.md §
// Calendar rendering: incremental after any local write, one-time backfill
// on first sync. Backs the film-strip month grid without ever scanning
// `memories`.

import { getDb } from './index';

export type DaySummary = {
  day: string;
  memory_count: number;
  own_count: number;
  partner_count: number;
  cover_thumb_uri: string | null;
  has_daily_prompt_complete: 0 | 1;
};

export async function recomputeDaySummary(day: string): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    is_own: number;
    is_daily_prompt: number;
    local_thumb_uri: string | null;
    remote_thumb_path: string | null;
  }>(
    `select is_own, is_daily_prompt, local_thumb_uri, remote_thumb_path
     from memories where deleted_at is null and substr(captured_at, 1, 10) = ?;`,
    [day],
  );

  if (rows.length === 0) {
    await db.runAsync('delete from day_summaries where day = ?;', [day]);
    return;
  }

  const ownCount = rows.filter((r) => r.is_own === 1).length;
  const partnerCount = rows.length - ownCount;
  const promptComplete = rows.some((r) => r.is_own === 1 && r.is_daily_prompt === 1)
    && rows.some((r) => r.is_own === 0 && r.is_daily_prompt === 1);
  const cover = rows.find((r) => r.local_thumb_uri || r.remote_thumb_path);

  await db.runAsync(
    `insert into day_summaries (day, memory_count, own_count, partner_count, cover_thumb_uri, has_daily_prompt_complete)
     values (?, ?, ?, ?, ?, ?)
     on conflict(day) do update set
       memory_count = excluded.memory_count,
       own_count = excluded.own_count,
       partner_count = excluded.partner_count,
       cover_thumb_uri = excluded.cover_thumb_uri,
       has_daily_prompt_complete = excluded.has_daily_prompt_complete;`,
    [day, rows.length, ownCount, partnerCount, cover?.local_thumb_uri ?? null, promptComplete ? 1 : 0],
  );
}

export async function backfillAllDaySummaries(): Promise<void> {
  const db = await getDb();
  const days = await db.getAllAsync<{ day: string }>(
    `select distinct substr(captured_at, 1, 10) as day from memories where deleted_at is null;`,
  );
  for (const { day } of days) {
    await recomputeDaySummary(day);
  }
}

// `month` is 1-12.
export async function getMonthSummaries(year: number, month: number): Promise<DaySummary[]> {
  const db = await getDb();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return db.getAllAsync<DaySummary>(`select * from day_summaries where day like ? order by day asc;`, [
    `${prefix}%`,
  ]);
}
