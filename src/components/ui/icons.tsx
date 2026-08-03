// Minimal line icons for the tab bar — see docs/01-product-spec.md § UI
// philosophy: icon-only, no labels, since the shapes are unambiguous.

import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

type IconProps = { color: string; size?: number };

export function HomeIcon({ color, size = 21 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M3 11l9-7 9 7" />
      <Path d="M5 10v10h14V10" />
    </Svg>
  );
}

export function CalendarIcon({ color, size = 21 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Rect x={3} y={5} width={18} height={16} rx={2} />
      <Path d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  );
}

export function CameraIcon({ color, size = 19 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Rect x={3} y={7} width={18} height={13} rx={2} />
      <Path d="M8 7l1.5-3h5L16 7" />
      <Circle cx={12} cy={13.5} r={3.2} />
    </Svg>
  );
}
