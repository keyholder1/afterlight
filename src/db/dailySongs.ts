// Local daily_songs repository — see docs/schema/local_sqlite_schema.sql
// and docs/02-ux-flows-and-wireframes.md § 4 "One song per day."

import { getDb } from './index';

export type LocalSong = {
  day: string;
  title: string;
  artist: string | null;
  link_url: string | null;
  added_by: string;
  created_at: string;
  synced_at: string | null;
};

export async function getSongForDay(day: string): Promise<LocalSong | null> {
  const db = await getDb();
  return db.getFirstAsync<LocalSong>('select * from daily_songs where day = ?;', [day]);
}

export async function saveSongForDay(input: {
  day: string;
  title: string;
  artist?: string | null;
  linkUrl?: string | null;
  addedBy: string;
}): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `insert into daily_songs (day, title, artist, link_url, added_by, created_at, synced_at)
     values (?, ?, ?, ?, ?, ?, NULL)
     on conflict(day) do update set
       title = excluded.title, artist = excluded.artist, link_url = excluded.link_url;`,
    [input.day, input.title, input.artist ?? null, input.linkUrl ?? null, input.addedBy, now],
  );
}

export async function markSongSynced(day: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('update daily_songs set synced_at = ? where day = ?;', [new Date().toISOString(), day]);
}
