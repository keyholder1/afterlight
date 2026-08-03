// Relationship Seasons sync — see docs/06-technical-architecture.md §
// Relationship Seasons. Deliberately not folded into the main sync engine
// (pushUnsynced/pullSince are about `memories`); chapters change a handful
// of times a year, so a couple of direct calls are simpler than extending
// the generic machinery for something this infrequent.

import { supabase } from './client';
import {
  getUnsyncedClosedChapters,
  markChapterSynced,
  upsertRemoteChapter,
  LocalChapter,
} from '../db/lifeChapters';

// Pushes any newly-closed chapter, and — only the first time it's pushed —
// kicks off name-chapter to replace the provisional date-range title. See
// docs/06 § Relationship Seasons: "called once for that chapter, with just
// its captions/locations/date range... not per photo."
export async function pushChapters(pairId: string): Promise<void> {
  const unsynced = await getUnsyncedClosedChapters();
  for (const chapter of unsynced) {
    const { error } = await supabase.from('life_chapters').upsert(
      {
        id: chapter.id,
        pair_id: pairId,
        title: chapter.title,
        starts_on: chapter.starts_on,
        ends_on: chapter.ends_on,
        auto_generated: !!chapter.auto_generated,
        updated_at: chapter.updated_at,
      },
      { onConflict: 'id' },
    );
    if (error) {
      console.warn('Chapter sync failed for', chapter.id, error);
      continue;
    }
    await markChapterSynced(chapter.id);

    supabase.functions.invoke('name-chapter', { body: { chapterId: chapter.id } }).catch((err) => {
      // Fine to fail — the provisional date-range title just stays, per
      // docs/06's own stated fallback behavior.
      console.warn('name-chapter invoke failed (provisional title stays):', err);
    });
  }
}

export async function pullChapters(pairId: string): Promise<void> {
  const { data, error } = await supabase.from('life_chapters').select('*').eq('pair_id', pairId);
  if (error) throw error;
  for (const row of (data ?? []) as any[]) {
    await upsertRemoteChapter(row);
  }
}

export type { LocalChapter };
