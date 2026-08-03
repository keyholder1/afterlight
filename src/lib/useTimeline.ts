// Drives the Home Timeline: loads the local window, syncs, computes rows
// and the current Relationship Season. See
// docs/06-technical-architecture.md § Timeline rendering.

import { useCallback, useEffect, useRef, useState } from 'react';
import { getMemoriesSince } from '../db/memories';
import { buildTimelineRows, TimelineRow } from './timelineLayout';
import { computeChapterBoundaries } from './chapterHeuristic';
import { upsertProvisionalChapters, getChapterForDay } from '../db/lifeChapters';
import { pullSince } from '../sync/pull';
import { subscribeRealtime } from '../sync/realtime';
import { dayKey } from './formatTimestamp';
import { getActivePair } from '../supabase/pairing';
import { fetchTodayPrompt } from '../supabase/dailyPrompts';
import { pushChapters, pullChapters } from '../supabase/lifeChapters';

const INITIAL_WINDOW_DAYS = 14;
const LOAD_MORE_DAYS = 14;

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function useTimeline(pairId: string, userId: string) {
  const [rows, setRows] = useState<TimelineRow[]>([]);
  const [seasonTitle, setSeasonTitle] = useState<string | null>(null);
  const [waitingRowKey, setWaitingRowKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const windowDaysRef = useRef(INITIAL_WINDOW_DAYS);

  const reload = useCallback(async () => {
    const since = daysAgoIso(windowDaysRef.current);
    const memories = await getMemoriesSince(pairId, since);
    setRows(buildTimelineRows(memories));

    // Chapters are recomputed from everything captured (not just the
    // visible window) so the boundary detection sees real gaps, but that's
    // cheap enough to just do here rather than caching separately. Pull
    // first so a name-chapter-assigned title never gets clobbered by a
    // fresh provisional recompute (see db/lifeChapters.ts's identity note).
    try {
      await pullChapters(pairId);
    } catch (err) {
      console.warn('Chapter pull failed:', err);
    }
    const all = await getMemoriesSince(pairId, new Date(0).toISOString());
    const chapters = computeChapterBoundaries(all);
    await upsertProvisionalChapters(chapters);
    pushChapters(pairId).catch((err) => console.warn('Chapter push failed:', err));
    const todayChapter = await getChapterForDay(dayKey(new Date().toISOString()));
    setSeasonTitle(todayChapter?.title ?? null);

    try {
      const pair = await getActivePair(userId);
      const prompt = pair ? await fetchTodayPrompt(pair, userId) : null;
      setWaitingRowKey(prompt?.own_memory_id && !prompt.partner_memory_id ? prompt.own_memory_id : null);
    } catch {
      setWaitingRowKey(null);
    }
  }, [pairId, userId]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    (async () => {
      try {
        await pullSince(pairId, userId);
      } catch (err) {
        console.warn('Initial pull failed (will retry via realtime/foreground):', err);
      }
      await reload();
      setLoading(false);
      unsubscribe = subscribeRealtime(pairId, userId, () => {
        reload();
      });
    })();
    return () => unsubscribe?.();
  }, [pairId, userId, reload]);

  const loadEarlier = useCallback(() => {
    windowDaysRef.current += LOAD_MORE_DAYS;
    reload();
  }, [reload]);

  return { rows, seasonTitle, waitingRowKey, loading, loadEarlier, refresh: reload };
}
