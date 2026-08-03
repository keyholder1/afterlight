// See docs/05-design-system.md § Micro-interactions: "Tap a Polaroid to
// open it → spring/drop in reverse — card scales up and lifts toward the
// viewer while background dims slightly" and "Swipe away → slides off to
// the side... reads as sliding a print off a table."

import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { PolaroidCard } from './PolaroidCard';
import type { LocalMemory } from '../../db/memories';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DISMISS_DISTANCE = SCREEN_WIDTH * 0.3;

export function PolaroidLightbox({ memory, onClose }: { memory: LocalMemory; onClose: () => void }) {
  const theme = useTheme();
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, theme.spring('drop'));
    opacity.value = withTiming(1, { duration: theme.duration('md') });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    onClose();
  }

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const distance = Math.hypot(e.translationX, e.translationY);
      if (distance > DISMISS_DISTANCE) {
        translateX.value = withTiming(e.translationX * 3, { duration: 220 });
        translateY.value = withTiming(e.translationY * 3, { duration: 220 }, () => runOnJS(close)());
        opacity.value = withTiming(0, { duration: 220 });
      } else {
        translateX.value = withSpring(0, theme.spring('gentle'));
        translateY.value = withSpring(0, theme.spring('gentle'));
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value * 0.85 }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
      <Animated.View style={StyleSheet.absoluteFill} onTouchEnd={close} />
      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>
          <PolaroidCard memory={memory} width={260} />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
});
