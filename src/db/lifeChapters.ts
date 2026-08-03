// Local life_chapters repository — see docs/schema/local_sqlite_schema.sql.
//
// Chapters are keyed by identity on `starts_on` (stable across recomputes,
// unlike a fresh uuid every time), so a chapter's `id` stays constant once
// created — required for pushChapters()/name-chapter to be idempotent (see
// src/supabase/lifeChapters.ts). A recompute only touches a chapter's row
// when its boundary actually changed; an unchanged chapter is left alone so
// a title the name-chapter function already wrote never gets clobbered back
// to the plain date-range provisional text.

import { getDb } from './index';
import { uuid } from '../lib/uuid';
import type { ProvisionalChapter } from '../lib/chapterHeuristic';

export type LocalChapter = {
  id: string;
  title: string;
  starts_on: string;
  ends_on: string | null;
  auto_generated: 0 | 1;
  updated_at: string;
  synced_at: string | null;
};

export async function upsertProvisionalChapters(chapters: ProvisionalChapter[]): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  for (const chapter of chapters) {
    const existing = await db.getFirstAsync<LocalChapter>(
      'select * from life_chapters where starts_on = ?;',
      [chapter.startsOn],
    );

    if (!existing) {
      await db.runAsync(
        `insert into life_chapters (id, title, starts_on, ends_on, auto_generated, updated_at, synced_at)
         values (?, ?, ?, ?, 1, ?, NULL);`,
        [uuid(), chapter.title, chapter.startsOn, chapter.endsOn, now],
      );
    } else if (existing.auto_generated === 1 && existing.ends_on !== chapter.endsOn) {
      // Boundary shifted — most commonly, this chapter just closed (endsOn
      // went from null to a real date). Refresh and mark for re-sync/re-name.
      await db.runAsync(
        `update life_chapters set ends_on = ?, title = ?, updated_at = ?, synced_at = NULL where id = ?;`,
        [chapter.endsOn, chapter.title, now, existing.id],
      );
    }
  }
}

export async function getAllChapters(): Promise<LocalChapter[]> {
  const db = await getDb();
  return db.getAllAsync<LocalChapter>('select * from life_chapters order by starts_on asc;');
}

export async function getChapterForDay(dayKeyStr: string): Promise<LocalChapter | null> {
  const db = await getDb();
  return db.getFirstAsync<LocalChapter>(
    `select * from life_chapters
     where starts_on <= ? and (ends_on is null or ends_on >= ?)
     order by starts_on desc limit 1;`,
    [dayKeyStr, dayKeyStr],
  );
}

// Closed chapters (a real ends_on, not the still-open current one) that
// haven't been pushed yet — see src/supabase/lifeChapters.ts pushChapters().
export async function getUnsyncedClosedChapters(): Promise<LocalChapter[]> {
  const db = await getDb();
  return db.getAllAsync<LocalChapter>(
    `select * from life_chapters where synced_at is null and ends_on is not null order by starts_on asc;`,
  );
}

export async function markChapterSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('update life_chapters set synced_at = ? where id = ?;', [new Date().toISOString(), id]);
}

export async function upsertRemoteChapter(row: {
  id: string;
  title: string;
  starts_on: string;
  ends_on: string | null;
  auto_generated: boolean;
  updated_at: string;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `insert into life_chapters (id, title, starts_on, ends_on, auto_generated, updated_at, synced_at)
     values (?, ?, ?, ?, ?, ?, ?)
     on conflict(id) do update set
       title = excluded.title,
       ends_on = excluded.ends_on,
       auto_generated = excluded.auto_generated,
       updated_at = excluded.updated_at,
       synced_at = excluded.synced_at;`,
    [row.id, row.title, row.starts_on, row.ends_on, row.auto_generated ? 1 : 0, row.updated_at, new Date().toISOString()],
  );
}
