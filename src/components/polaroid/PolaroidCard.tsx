// See docs/05-design-system.md § Polaroid card and § Micro-interactions.
// Long-press flips to the back face (caption/location/weather/thoughts)
// instead of opening a new screen; a shake gives every visible card a
// small randomized impulse that springs back to rest.

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { seededRotation } from '../../lib/seededRotation';
import { formatPrintedStamp } from '../../lib/formatTimestamp';
import { useDisplayUri } from '../../lib/useDisplayUri';
import { useScatterSignal } from '../../lib/scatterSignal';
import type { LocalMemory } from '../../db/memories';

export function PolaroidCard({
  memory,
  width = 140,
  onPress,
}: {
  memory: LocalMemory;
  width?: number;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const baseRotation = useMemo(() => seededRotation(memory.id), [memory.id]);
  const uri = useDisplayUri(memory);
  const scatterSignal = useScatterSignal();

  const flip = useSharedValue(0); // 0 = front, 1 = back
  const impulseRotate = useSharedValue(0);
  const impulseX = useSharedValue(0);
  const impulseY = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useAnimatedReaction(
    () => scatterSignal?.value,
    (curr, prev) => {
      if (curr === undefined || curr === prev || prev === undefined) return;
      const spring = { damping: 14, stiffness: 210, mass: 1.1 }; // spring/drop, see 05-design-system.md
      impulseRotate.value = withSequence(
        withSpring((Math.random() - 0.5) * 12, spring),
        withSpring(0, theme.spring('default')),
      );
      impulseX.value = withSequence(
        withSpring((Math.random() - 0.5) * 16, spring),
        withSpring(0, theme.spring('default')),
      );
      impulseY.value = withSequence(
        withSpring((Math.random() - 0.5) * 10, spring),
        withSpring(0, theme.spring('default')),
      );
    },
  );

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { translateX: impulseX.value },
      { translateY: impulseY.value },
      { rotate: `${baseRotation + impulseRotate.value}deg` },
      { rotateY: `${flip.value * 180}deg` },
      { scale: pressScale.value },
    ],
  }));

  const frontStyle = useAnimatedStyle(() => ({ opacity: flip.value < 0.5 ? 1 : 0 }));
  const backStyle = useAnimatedStyle(() => ({ opacity: flip.value >= 0.5 ? 1 : 0 }));

  function handleLongPress() {
    flip.value = withSpring(flip.value < 0.5 ? 1 : 0, { damping: 16, stiffness: 120 });
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={handleLongPress}
      onPressIn={() => (pressScale.value = withSpring(0.96, theme.spring('snappy')))}
      onPressOut={() => (pressScale.value = withSpring(1, theme.spring('snappy')))}
    >
      <Animated.View style={[styles.card, { width }, containerStyle]}>
        {/* front */}
        <Animated.View
          style={[
            styles.face,
            frontStyle,
            { backgroundColor: theme.colors.polaroidWhite, shadowColor: theme.colors.polaroidShadow },
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
        </Animated.View>

        {/* back — see docs/05-design-system.md: "caption, location, weather,
            and a short 'thoughts' field... instead of opening a whole new
            screen." */}
        <Animated.View
          style={[
            styles.face,
            styles.back,
            backStyle,
            { backgroundColor: theme.colors.polaroidWhite, shadowColor: theme.colors.polaroidShadow },
          ]}
        >
          <View style={styles.backContent}>
            {memory.caption && (
              <Text style={[theme.type.handwritten, { color: '#4a3a2e', fontSize: 18 }]}>{memory.caption}</Text>
            )}
            {memory.location_name && (
              <Text style={[theme.type.caption, { color: theme.colors.textSecondary, marginTop: 6 }]}>
                {memory.location_name}
              </Text>
            )}
            {memory.weather_summary && (
              <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>
                {memory.weather_summary}
              </Text>
            )}
            {memory.thoughts && (
              <Text style={[theme.type.handwritten, { color: '#4a3a2e', marginTop: 10 }]}>{memory.thoughts}</Text>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { aspectRatio: undefined },
  face: {
    padding: 14,
    paddingBottom: 44,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
    backfaceVisibility: 'hidden',
  },
  back: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, transform: [{ rotateY: '180deg' }] },
  backContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 4 },
  pic: { width: '100%', aspectRatio: 1 / 1.05, borderRadius: 1, backgroundColor: '#00000010' },
  stamp: { position: 'absolute', left: 14, bottom: 16, color: '#55524a' },
  caption: { position: 'absolute', right: 14, bottom: 12, color: '#4a3a2e' },
});
