// See docs/05-design-system.md § Ambient mode: "a very faint animated grain
// overlay... present at all times as texture, more noticeable at night."
// (Not animated here — a static tiled pattern is enough of the effect for
// a first pass; frame-by-frame noise animation would cost more than the
// two-person-app budget justifies.) Built with an SVG tile pattern rather
// than a generated bitmap asset, per the "prefer simple techniques" bias.

import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';
import { useTheme } from '../../theme';

const TILE = 6;
const DOTS: [number, number, number][] = [
  [1, 1, 0.4],
  [4, 2, 0.35],
  [2, 4, 0.3],
  [5, 5, 0.35],
];

export function GrainOverlay() {
  const theme = useTheme();
  return (
    <Svg style={[StyleSheet.absoluteFill, { opacity: theme.grainOpacity }]} pointerEvents="none">
      <Defs>
        <Pattern id="grain" width={TILE} height={TILE} patternUnits="userSpaceOnUse">
          {DOTS.map(([cx, cy, r], i) => (
            <Circle key={i} cx={cx} cy={cy} r={r} fill={theme.colors.textPrimary} />
          ))}
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#grain)" />
    </Svg>
  );
}
