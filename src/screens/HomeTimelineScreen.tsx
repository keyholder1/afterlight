// The heart of the app — see docs/02-ux-flows-and-wireframes.md § 3 and
// docs/06-technical-architecture.md § Timeline rendering.

import React from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '../theme';
import { useTimeline } from '../lib/useTimeline';
import { TimelineRowView } from '../components/timeline/TimelineRowView';
import type { TimelineRow } from '../lib/timelineLayout';

export default function HomeTimelineScreen({
  navigation,
  userId,
  pairId,
  partnerName,
}: {
  navigation: any;
  userId: string;
  pairId: string;
  partnerName: string | null;
}) {
  const theme = useTheme();
  const { rows, seasonTitle, waitingRowKey, loading, loadEarlier, refresh } = useTimeline(pairId, userId);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgCanvas }]}>
      <Text
        onLongPress={() => navigation.getParent()?.navigate('SettingsModal', { userId, partnerName })}
        style={[theme.type.displaySm, styles.header, { color: theme.colors.textPrimary }]}
      >
        {seasonTitle ?? 'Afterlight'}
      </Text>

      {rows.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={[theme.type.body, { color: theme.colors.textTertiary }]}>
            Nothing here yet — that&rsquo;s the point.
          </Text>
        </View>
      ) : (
        <FlashList<TimelineRow>
          data={rows}
          keyExtractor={(row) => row.key}
          renderItem={({ item }) => (
            <TimelineRowView row={item} waitingForPartner={item.key === waitingRowKey} />
          )}
          contentContainerStyle={styles.list}
          onStartReached={loadEarlier}
          onStartReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.colors.accent} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { textAlign: 'center', paddingTop: 18, paddingBottom: 10 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
