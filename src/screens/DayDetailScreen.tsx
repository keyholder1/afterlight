// See docs/02-ux-flows-and-wireframes.md § 4. Scoped to a single day: same
// row rendering as Home Timeline, plus the replay button and song attach.

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../theme';
import { getMemoriesBetween, LocalMemory } from '../db/memories';
import { buildTimelineRows } from '../lib/timelineLayout';
import { TimelineRowView } from '../components/timeline/TimelineRowView';
import { formatShortDate } from '../lib/formatDate';
import { getSongForDay, saveSongForDay } from '../db/dailySongs';
import { pushSong } from '../supabase/dailySongs';

export default function DayDetailScreen({ route, navigation }: any) {
  const { day, userId, pairId }: { day: string; userId: string; pairId: string } = route.params;
  const theme = useTheme();
  const [memories, setMemories] = useState<LocalMemory[]>([]);
  const [songTitle, setSongTitle] = useState<string | null>(null);
  const [songModalVisible, setSongModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [artistInput, setArtistInput] = useState('');

  useEffect(() => {
    const start = `${day}T00:00:00.000Z`;
    const end = new Date(new Date(start).getTime() + 86400000).toISOString();
    getMemoriesBetween(pairId, start, end).then(setMemories);
    getSongForDay(day).then((song) => setSongTitle(song ? `${song.title}${song.artist ? ` — ${song.artist}` : ''}` : null));
  }, [day, pairId]);

  const rows = buildTimelineRows(memories);

  async function handleSaveSong() {
    if (!titleInput.trim()) return;
    await saveSongForDay({ day, title: titleInput.trim(), artist: artistInput.trim() || null, addedBy: userId });
    pushSong(pairId, { day, title: titleInput.trim(), artist: artistInput.trim() || null, linkUrl: null, addedBy: userId }).catch(
      (err) => console.warn('Song sync failed', err),
    );
    setSongTitle(artistInput ? `${titleInput} — ${artistInput}` : titleInput);
    setSongModalVisible(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgCanvas }]}>
      <Text style={[theme.type.displaySm, { color: theme.colors.textPrimary, textAlign: 'center', marginTop: 18 }]}>
        {formatShortDate(day)}
      </Text>

      {rows.map((row) => (
        <TimelineRowView key={row.key} row={row} />
      ))}

      <Pressable
        onPress={() => navigation.navigate('StoryPlaybackModal', { day, userId, pairId })}
        style={[styles.button, { backgroundColor: theme.colors.accent }]}
      >
        <Text style={styles.buttonText}>Replay this day</Text>
      </Pressable>

      <Pressable onPress={() => setSongModalVisible(true)} style={{ marginTop: theme.spacing.md, alignItems: 'center' }}>
        <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>
          {songTitle ? `♪ ${songTitle}` : 'Add a song for this day'}
        </Text>
      </Pressable>

      <Modal visible={songModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.bgSurface }]}>
            <TextInput
              placeholder="Song title"
              placeholderTextColor={theme.colors.textTertiary}
              value={titleInput}
              onChangeText={setTitleInput}
              style={[theme.type.body, styles.input, { borderColor: theme.colors.borderHairline, color: theme.colors.textPrimary }]}
            />
            <TextInput
              placeholder="Artist (optional)"
              placeholderTextColor={theme.colors.textTertiary}
              value={artistInput}
              onChangeText={setArtistInput}
              style={[theme.type.body, styles.input, { borderColor: theme.colors.borderHairline, color: theme.colors.textPrimary, marginTop: 8 }]}
            />
            <Pressable onPress={handleSaveSong} style={[styles.button, { backgroundColor: theme.colors.accent, marginTop: 12 }]}>
              <Text style={styles.buttonText}>Save</Text>
            </Pressable>
            <Pressable onPress={() => setSongModalVisible(false)} style={{ marginTop: 10, alignItems: 'center' }}>
              <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  button: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '85%', borderRadius: 16, padding: 20 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
});
