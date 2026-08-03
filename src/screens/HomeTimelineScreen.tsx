// Placeholder — the real two-column, season-headed, threaded timeline lands
// in Phase 3. See docs/02-ux-flows-and-wireframes.md § 3.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export default function HomeTimelineScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgCanvas }]}>
      <Text style={[theme.type.displaySm, { color: theme.colors.textPrimary }]}>Home Timeline</Text>
      <Text style={[theme.type.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm }]}>
        Two-column timeline comes in Phase 3.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
