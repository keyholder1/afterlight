// Relationship Seasons — on-device boundary detection. See
// docs/06-technical-architecture.md § Relationship Seasons (detection,
// kept invisible): "a 10+ day gap with no memories, or a sustained change
// in the reverse-geocoded location (5+ days in a new city/region)."
//
// This produces *provisional* chapters titled with a plain date range —
// the name-chapter function (Phase 6) overwrites the title with something
// warmer. Never labeled to the user as automatic/AI anywhere.

import type { LocalMemory } from '../db/memories';
import { dayKey } from './formatTimestamp';
import { formatShortDate } from './formatDate';

const GAP_BOUNDARY_DAYS = 10;
const LOCATION_SUSTAIN_DAYS = 5;
const MS_PER_DAY = 86400000;

export type ProvisionalChapter = {
  startsOn: string; // 'YYYY-MM-DD'
  endsOn: string | null;
  title: string;
};

function cityFromLocationName(locationName: string | null): string | null {
  if (!locationName) return null;
  const parts = locationName.split(',').map((p) => p.trim());
  return parts[parts.length - 1] || null;
}

function mode<T>(values: T[]): T | null {
  if (values.length === 0) return null;
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: T | null = null;
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

export function computeChapterBoundaries(memories: LocalMemory[]): ProvisionalChapter[] {
  if (memories.length === 0) return [];

  const byDay = new Map<string, LocalMemory[]>();
  for (const m of memories) {
    const key = dayKey(m.captured_at);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(m);
  }
  const activeDays = [...byDay.keys()].sort();

  const boundaries = new Set<string>([activeDays[0]]);

  // Signal 1: gaps of GAP_BOUNDARY_DAYS+ with no memories at all.
  for (let i = 1; i < activeDays.length; i++) {
    const prev = new Date(activeDays[i - 1]).getTime();
    const curr = new Date(activeDays[i]).getTime();
    const gapDays = (curr - prev) / MS_PER_DAY;
    if (gapDays >= GAP_BOUNDARY_DAYS) boundaries.add(activeDays[i]);
  }

  // Signal 2: a new dominant location that sustains for LOCATION_SUSTAIN_DAYS.
  const locationDays = activeDays
    .map((day) => ({
      day,
      city: mode(byDay.get(day)!.map((m) => cityFromLocationName(m.location_name)).filter((c): c is string => !!c)),
    }))
    .filter((d) => d.city !== null);

  let currentCity: string | null = null;
  for (let i = 0; i < locationDays.length; i++) {
    const { day, city } = locationDays[i];
    if (city === currentCity) continue;
    const upcoming = locationDays.slice(i, i + LOCATION_SUSTAIN_DAYS);
    const sustains = upcoming.length === LOCATION_SUSTAIN_DAYS && upcoming.every((d) => d.city === city);
    if (sustains) {
      boundaries.add(day);
      currentCity = city;
    }
  }

  const sortedBoundaries = [...boundaries].sort();
  const chapters: ProvisionalChapter[] = sortedBoundaries.map((startsOn, i) => {
    const next = sortedBoundaries[i + 1];
    const endsOn = next ? dayBefore(next) : null;
    return {
      startsOn,
      endsOn,
      title: endsOn ? `${formatShortDate(startsOn)} – ${formatShortDate(endsOn)}` : `Since ${formatShortDate(startsOn)}`,
    };
  });

  return chapters;
}

function dayBefore(dayKeyStr: string): string {
  const d = new Date(`${dayKeyStr}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
