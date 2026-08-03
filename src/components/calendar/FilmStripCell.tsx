// See docs/05-design-system.md § Film-strip calendar cell: "a short row of
// tiny perforated-edge frames... a light day shows one small frame, a heavy
// day shows a fuller strip."

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

const MAX_FRAMES = 4;

export function FilmStripCell({ count, active }: { count: number; active?: boolean }) {
  const theme = useTheme();
  if (count <= 0) return null;
  const frames = Math.min(count, MAX_FRAMES);
  const color = active ? '#fff' : theme.colors.accent;
  const holeColor = active ? 'rgba(255,255,255,0.6)' : theme.colors.textTertiary;

  return (
    <View style={styles.row}>
      {Array.from({ length: frames }).map((_, i) => (
        <View key={i} style={[styles.frame, { backgroundColor: color }]}>
          <View style={[styles.hole, { backgroundColor: holeColor }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 1, marginTop: 2 },
  frame: { width: 4, height: 5, borderRadius: 1 },
  hole: { position: 'absolute', top: -2, left: 1.5, width: 1, height: 1, borderRadius: 0.5 },
});
