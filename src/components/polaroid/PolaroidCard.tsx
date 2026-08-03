// See docs/05-design-system.md § Polaroid card. Flip-to-back (long-press)
// lands in Phase 6 — this is the front face only for now.

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../theme';
import { seededRotation } from '../../lib/seededRotation';
import { formatPrintedStamp } from '../../lib/formatTimestamp';
import { useDisplayUri } from '../../lib/useDisplayUri';
import type { LocalMemory } from '../../db/memories';

export function PolaroidCard({ memory, width = 140 }: { memory: LocalMemory; width?: number }) {
  const theme = useTheme();
  const rotation = useMemo(() => seededRotation(memory.id), [memory.id]);
  const uri = useDisplayUri(memory);

  return (
    <View
      style={[
        styles.frame,
        {
          width,
          backgroundColor: theme.colors.polaroidWhite,
          shadowColor: theme.colors.polaroidShadow,
          transform: [{ rotate: `${rotation}deg` }],
        },
      ]}
    >
      <Image
        source={uri ? { uri } : undefined}
        placeholder={memory.blurhash ? { blurhash: memory.blurhash } : undefined}
        style={styles.pic}
        contentFit="cover"
        transition={150}
      />
      <Text style={[theme.type.printed, styles.stamp]}>{formatPrintedStamp(memory.captured_at)}</Text>
      {memory.caption && (
        <Text style={[theme.type.handwritten, styles.caption]} numberOfLines={1}>
          {memory.caption}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    padding: 14,
    paddingBottom: 44,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  pic: { width: '100%', aspectRatio: 1 / 1.05, borderRadius: 1, backgroundColor: '#00000010' },
  stamp: { position: 'absolute', left: 14, bottom: 16, color: '#55524a' },
  caption: { position: 'absolute', right: 14, bottom: 12, color: '#4a3a2e' },
});
