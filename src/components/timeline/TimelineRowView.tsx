import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { PolaroidCard } from '../polaroid/PolaroidCard';
import { ConnectingThread } from './ConnectingThread';
import { formatGapLabel } from '../../lib/formatGap';
import type { TimelineRow } from '../../lib/timelineLayout';

export function TimelineRowView({ row }: { row: TimelineRow }) {
  const theme = useTheme();

  if (row.kind === 'gap') {
    return (
      <View style={{ paddingVertical: theme.spacing.xl * Math.min(row.heightFactor, 2) }}>
        <Text style={[theme.type.caption, { color: theme.colors.textTertiary, textAlign: 'center', fontStyle: 'italic' }]}>
          — {formatGapLabel(row.minutes)} —
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, { marginBottom: theme.spacing.lg }]}>
      <View style={styles.slot}>{row.own && <PolaroidCard memory={row.own} />}</View>
      <View style={styles.slot}>{row.partner && <PolaroidCard memory={row.partner} />}</View>
      {row.threaded && <ConnectingThread />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', position: 'relative' },
  slot: { width: '46%', alignItems: 'center' },
});
