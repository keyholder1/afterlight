// Motion tokens — see docs/05-design-system.md § Motion.
// Consumed by react-native-reanimated worklets, never the JS-thread Animated API.

export type SpringConfig = {
  damping: number;
  stiffness: number;
  mass: number;
};

export const springs = {
  default: { damping: 18, stiffness: 180, mass: 1 } satisfies SpringConfig,
  snappy: { damping: 22, stiffness: 260, mass: 0.9 } satisfies SpringConfig,
  gentle: { damping: 20, stiffness: 90, mass: 1.2 } satisfies SpringConfig,
  drop: { damping: 14, stiffness: 210, mass: 1.1 } satisfies SpringConfig,
};

export const durations = {
  xs: 120,
  sm: 200,
  md: 400,
  lg: 600,
};

// Ambient mode runs every duration ~1.3x longer and every spring ~15% less
// stiff, so night use of the app reads as calmer, not just darker.
// See docs/05-design-system.md § Ambient mode.
const AMBIENT_DURATION_MULTIPLIER = 1.3;
const AMBIENT_STIFFNESS_MULTIPLIER = 0.85;

export function getSpring(key: keyof typeof springs, ambient: boolean): SpringConfig {
  const base = springs[key];
  if (!ambient) return base;
  return { ...base, stiffness: base.stiffness * AMBIENT_STIFFNESS_MULTIPLIER };
}

export function getDuration(key: keyof typeof durations, ambient: boolean): number {
  const base = durations[key];
  return ambient ? Math.round(base * AMBIENT_DURATION_MULTIPLIER) : base;
}
