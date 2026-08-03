// Placeholder — the real two-column, season-headed, threaded timeline lands
// in Phase 3. See docs/02-ux-flows-and-wireframes.md § 3.
//
// The long-press-to-Settings affordance is wired now (Phase 1) since it's
// the only way Settings is reachable per docs/03-information-architecture.md
// — "no permanent, always-visible slot."

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export default function HomeTimelineScreen({
  navigation,
  userId,
  partnerName,
}: {
  navigation: any;
  userId: string;
  partnerName: string | null;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgCanvas }]}>
      <Text
        onLongPress={() =>
          navigation.getParent()?.navigate('SettingsModal', { userId, partnerName })
        }
        style={[theme.type.displaySm, { color: theme.colors.textPrimary }]}
      >
        Home Timeline
      </Text>
      <Text style={[theme.type.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm }]}>
        Two-column timeline comes in Phase 3. Long-press the title for Settings.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
