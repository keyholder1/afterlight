// See docs/05-design-system.md § WaitingState: "partner's Polaroid slot
// renders as a soft frosted/blurred silhouette outline. No text label, no
// spinner — the visual absence itself communicates 'not yet.'"

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

export function WaitingSilhouette({ width = 140 }: { width?: number }) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel="Waiting for your partner to capture today"
      style={[
        styles.frame,
        { width, backgroundColor: theme.colors.polaroidWhite, borderColor: theme.colors.borderHairline },
      ]}
    >
      <View style={[styles.inner, { backgroundColor: theme.colors.bgSunken }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { padding: 14, paddingBottom: 44, borderRadius: 2, opacity: 0.5, borderWidth: 1, borderStyle: 'dashed' },
  inner: { width: '100%', aspectRatio: 1 / 1.05, borderRadius: 1 },
});
