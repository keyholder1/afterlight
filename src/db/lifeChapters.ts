// Local life_chapters repository — see docs/schema/local_sqlite_schema.sql.
// Provisional chapters are cheap to recompute (a handful of rows per year),
// so instead of diffing, we just wipe and re-derive them from memories
// whenever the timeline recomputes. Chapters with auto_generated=0 (a user
// rename, once that exists) are left alone.

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

export async function replaceProvisionalChapters(chapters: ProvisionalChapter[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('delete from life_chapters where auto_generated = 1;');
    const now = new Date().toISOString();
    for (const chapter of chapters) {
      await db.runAsync(
        `insert into life_chapters (id, title, starts_on, ends_on, auto_generated, updated_at, synced_at)
         values (?, ?, ?, ?, 1, ?, NULL);`,
        [uuid(), chapter.title, chapter.startsOn, chapter.endsOn, now],
      );
    }
  });
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
