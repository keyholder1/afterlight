// Direct read/write for daily_songs — small, low-frequency table, so this
// skips the full sync-engine machinery (see docs/04-database-schema.md §
// Why two databases, kept plain) and just talks to Supabase inline.

import { supabase } from './client';
import { markSongSynced } from '../db/dailySongs';

export async function pushSong(
  pairId: string,
  song: { day: string; title: string; artist: string | null; linkUrl: string | null; addedBy: string },
): Promise<void> {
  const { error } = await supabase.from('daily_songs').upsert(
    {
      pair_id: pairId,
      day: song.day,
      title: song.title,
      artist: song.artist,
      link_url: song.linkUrl,
      added_by: song.addedBy,
    },
    { onConflict: 'pair_id,day' },
  );
  if (error) throw error;
  await markSongSynced(song.day);
}

export async function fetchSong(pairId: string, day: string) {
  const { data, error } = await supabase
    .from('daily_songs')
    .select('*')
    .eq('pair_id', pairId)
    .eq('day', day)
    .maybeSingle();
  if (error) throw error;
  return data;
}
