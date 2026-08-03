// Placeholder — the real film-strip month grid + day detail lands in Phase 4.
// See docs/02-ux-flows-and-wireframes.md § 4.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export default function CalendarScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgCanvas }]}>
      <Text style={[theme.type.displaySm, { color: theme.colors.textPrimary }]}>Calendar</Text>
      <Text style={[theme.type.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm }]}>
        Film-strip month grid comes in Phase 4.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
