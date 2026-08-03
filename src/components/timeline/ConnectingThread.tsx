// See docs/05-design-system.md § Connecting thread: "a thin (1px, accent at
// 40% opacity) hand-drawn-feeling line... rendered as a slightly wavy path
// (not a straight ruled line)."

import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme';

export function ConnectingThread() {
  const theme = useTheme();
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      pointerEvents="none"
    >
      <Path
        d="M46,48 C 50,38 50,58 54,50"
        fill="none"
        stroke={theme.colors.accent}
        strokeOpacity={0.45}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}
