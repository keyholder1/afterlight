// See docs/02-ux-flows-and-wireframes.md § 4. Auto-advances slower than a
// typical story (duration/md-ish per frame, cross-fade), tap to
// advance/rewind, swipe down to exit.
//
// Song playback (docs/06's caveat applies): expo-audio can only actually
// play a direct audio file URL. A streaming-service link (Spotify, Apple
// Music) will silently fail to produce sound — there's no SDK integration
// for those, by design (see docs/01-product-spec.md's "not a streaming
// integration"). The title still displays either way.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { getMemoriesBetween, LocalMemory } from '../db/memories';
import { getSongForDay } from '../db/dailySongs';
import { useDisplayUri } from '../lib/useDisplayUri';
import { formatPrintedStamp } from '../lib/formatTimestamp';
import { useAudioPlayer } from 'expo-audio';

const FRAME_DURATION_MS = 4500;
const FADE_MS = 400;

function StoryFrame({ memory }: { memory: LocalMemory }) {
  const uri = useDisplayUri(memory);
  return (
    <Image
      source={uri ? { uri } : undefined}
      style={StyleSheet.absoluteFill as any}
      resizeMode="cover"
      blurRadius={uri ? 0 : 20}
    />
  );
}

export default function StoryPlaybackScreen({ route, navigation }: any) {
  const { day, pairId }: { day: string; userId: string; pairId: string } = route.params;
  const [memories, setMemories] = useState<LocalMemory[]>([]);
  const [index, setIndex] = useState(0);
  const [songLabel, setSongLabel] = useState<string | null>(null);
  const [songUrl, setSongUrl] = useState<string | null>(null);
  const opacity = useSharedValue(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const start = `${day}T00:00:00.000Z`;
    const end = new Date(new Date(start).getTime() + 86400000).toISOString();
    getMemoriesBetween(pairId, start, end).then(setMemories);
    getSongForDay(day).then((song) => {
      if (song) {
        setSongLabel(`${song.title}${song.artist ? ` — ${song.artist}` : ''}`);
        setSongUrl(song.link_url);
      }
    });
  }, [day, pairId]);

  const player = useAudioPlayer(songUrl ? { uri: songUrl } : null);

  useEffect(() => {
    if (songUrl && player) {
      try {
        player.play();
      } catch (err) {
        console.warn('Song playback unavailable for this link', err);
      }
    }
    return () => {
      try {
        player?.pause();
      } catch {
        // no-op — nothing to clean up if it never started
      }
    };
  }, [songUrl, player]);

  const advance = (direction: 1 | -1) => {
    setIndex((i) => Math.max(0, Math.min(memories.length - 1, i + direction)));
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: FADE_MS });
  };

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (index >= memories.length - 1) return;
    timerRef.current = setTimeout(() => advance(1), FRAME_DURATION_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, memories.length]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, gesture) => Math.abs(gesture.dy) > 20,
        onPanResponderRelease: (_e, gesture) => {
          if (gesture.dy > 60) navigation.goBack();
        },
      }),
    [navigation],
  );

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (memories.length === 0) {
    return <View style={styles.container} />;
  }

  const current = memories[index];

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <StoryFrame memory={current} />
      </Animated.View>
      <View style={styles.scrim} pointerEvents="none" />

      <View style={styles.segments}>
        {memories.map((m, i) => (
          <View key={m.id} style={styles.segmentTrack}>
            <View style={[styles.segmentFill, { width: i < index ? '100%' : i === index ? '55%' : '0%' }]} />
          </View>
        ))}
      </View>

      <View style={styles.meta}>
        <Text style={styles.time}>{formatPrintedStamp(current.captured_at)}</Text>
        {current.caption && <Text style={styles.caption}>{current.caption}</Text>}
        {current.location_name && <Text style={styles.loc}>{current.location_name}</Text>}
        {songLabel && <Text style={styles.song}>♪ {songLabel}</Text>}
      </View>

      <View style={styles.tapZones}>
        <View style={styles.tapLeft} onTouchEnd={() => advance(-1)} />
        <View style={styles.tapRight} onTouchEnd={() => advance(1)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
  segments: { position: 'absolute', top: 14, left: 12, right: 12, flexDirection: 'row', gap: 4 },
  segmentTrack: { flex: 1, height: 2.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  segmentFill: { height: '100%', backgroundColor: '#fff' },
  meta: { position: 'absolute', left: 18, right: 18, bottom: 30 },
  time: { color: '#fff', fontSize: 11, opacity: 0.85 },
  caption: { color: '#fff', fontSize: 22, marginTop: 4 },
  loc: { color: '#fff', fontSize: 12, opacity: 0.85, marginTop: 2 },
  song: { color: '#fff', fontSize: 12, opacity: 0.75, marginTop: 8 },
  tapZones: { ...StyleSheet.absoluteFill, flexDirection: 'row' },
  tapLeft: { flex: 1 },
  tapRight: { flex: 1 },
});
