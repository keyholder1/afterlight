// Pure row-layout logic for the Home Timeline — see
// docs/06-technical-architecture.md § Timeline rendering: "a single outer
// list where each row is a time slot containing left/right Polaroid slots,"
// gaps sized from real time deltas, threading for same-moment captures.

import type { LocalMemory } from '../db/memories';

const THREAD_WINDOW_MINUTES = 20;
const GAP_THRESHOLD_MINUTES = 45;
const GAP_HEIGHT_CAP = 4;

export type TimelineRow =
  | { kind: 'memories'; key: string; own: LocalMemory | null; partner: LocalMemory | null; threaded: boolean }
  | { kind: 'gap'; key: string; heightFactor: number; minutes: number };

function minutesBetween(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 60000;
}

export function buildTimelineRows(memories: LocalMemory[]): TimelineRow[] {
  const sorted = [...memories].sort(
    (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime(),
  );

  type OpenRow = { own: LocalMemory | null; partner: LocalMemory | null; anchor: string };
  const grouped: OpenRow[] = [];

  for (const memory of sorted) {
    const isOwn = memory.is_own === 1;
    const last = grouped[grouped.length - 1];
    const slotFree = last && (isOwn ? !last.own : !last.partner);
    const withinWindow = last && minutesBetween(last.anchor, memory.captured_at) <= THREAD_WINDOW_MINUTES;

    if (last && slotFree && withinWindow) {
      if (isOwn) last.own = memory;
      else last.partner = memory;
    } else {
      grouped.push({
        own: isOwn ? memory : null,
        partner: isOwn ? null : memory,
        anchor: memory.captured_at,
      });
    }
  }

  const rows: TimelineRow[] = [];
  for (let i = 0; i < grouped.length; i++) {
    const row = grouped[i];
    if (i > 0) {
      const gapMinutes = minutesBetween(grouped[i - 1].anchor, row.anchor);
      if (gapMinutes > GAP_THRESHOLD_MINUTES) {
        rows.push({
          kind: 'gap',
          key: `gap-${row.anchor}`,
          heightFactor: Math.min(gapMinutes / GAP_THRESHOLD_MINUTES, GAP_HEIGHT_CAP),
          minutes: gapMinutes,
        });
      }
    }
    rows.push({
      kind: 'memories',
      key: (row.own ?? row.partner)!.id,
      own: row.own,
      partner: row.partner,
      threaded: !!(row.own && row.partner),
    });
  }

  return rows;
}
