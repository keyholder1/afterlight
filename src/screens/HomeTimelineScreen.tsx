// The heart of the app — see docs/02-ux-flows-and-wireframes.md § 3, § 5
// and docs/06-technical-architecture.md § Timeline rendering.

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useTimeline } from '../lib/useTimeline';
import { TimelineRowView } from '../components/timeline/TimelineRowView';
import { GrainOverlay } from '../components/ui/GrainOverlay';
import { PolaroidLightbox } from '../components/polaroid/PolaroidLightbox';
import { ScatterContext } from '../lib/scatterSignal';
import { useShakeDetector } from '../lib/useShakeDetector';
import type { TimelineRow } from '../lib/timelineLayout';
import type { LocalMemory } from '../db/memories';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList<TimelineRow>);

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
  const scatterSignal = useSharedValue(0);
  const [enlarged, setEnlarged] = useState<LocalMemory | null>(null);

  useShakeDetector(
    useCallback(() => {
      scatterSignal.value += 1;
    }, [scatterSignal]),
  );

  // Pull-to-stretch — see docs/05-design-system.md § Micro-interactions:
  // "the paper visibly stretches slightly before snapping back." A full
  // rubber-band re-implementation of FlashList's scroll engine is a lot of
  // risk for a detail; this reads the overscroll amount and stretches the
  // season header instead, which is the visible, testable part of the cue.
  const overscroll = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      overscroll.value = y < 0 ? Math.min(-y, 60) : 0;
    },
    onEndDrag: () => {
      overscroll.value = withSpring(0, theme.spring('gentle'));
    },
  });
  const headerStretchStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: 1 + overscroll.value / 200 }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgCanvas }]}>
      <GrainOverlay />
      <Animated.Text
        onLongPress={() => navigation.getParent()?.navigate('SettingsModal', { userId, partnerName })}
        style={[theme.type.displaySm, styles.header, { color: theme.colors.textPrimary }, headerStretchStyle]}
      >
        {seasonTitle ?? 'Afterlight'}
      </Animated.Text>

      {rows.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={[theme.type.body, { color: theme.colors.textTertiary }]}>
            Nothing here yet — that&rsquo;s the point.
          </Text>
        </View>
      ) : (
        <ScatterContext.Provider value={scatterSignal}>
          <AnimatedFlashList
            data={rows}
            keyExtractor={(row) => row.key}
            renderItem={({ item }: { item: TimelineRow }) => (
              <TimelineRowView
                row={item}
                waitingForPartner={item.key === waitingRowKey}
                onPressMemory={setEnlarged}
              />
            )}
            contentContainerStyle={styles.list}
            onStartReached={loadEarlier}
            onStartReachedThreshold={0.5}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.colors.accent} />}
          />
        </ScatterContext.Provider>
      )}

      {enlarged && <PolaroidLightbox memory={enlarged} onClose={() => setEnlarged(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { textAlign: 'center', paddingTop: 18, paddingBottom: 10 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
