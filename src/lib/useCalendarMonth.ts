import { useCallback, useEffect, useState } from 'react';
import { getMonthSummaries, DaySummary } from '../db/daySummaries';
import { getChapterForDay } from '../db/lifeChapters';

export function useCalendarMonth(year: number, month: number) {
  const [summaries, setSummaries] = useState<Record<string, DaySummary>>({});
  const [seasonTitle, setSeasonTitle] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const rows = await getMonthSummaries(year, month);
    const map: Record<string, DaySummary> = {};
    for (const row of rows) map[row.day] = row;
    setSummaries(map);

    const midMonth = `${year}-${String(month).padStart(2, '0')}-15`;
    const chapter = await getChapterForDay(midMonth);
    setSeasonTitle(chapter?.title ?? null);
  }, [year, month]);

  useEffect(() => {
    // See src/lib/useAppBootstrap.ts for why this is the allowed
    // "sync on mount / when inputs change" case, not a sync setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  return { summaries, seasonTitle, refresh: reload };
}
