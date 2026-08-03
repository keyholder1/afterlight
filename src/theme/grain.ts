// Film grain — see docs/05-design-system.md § Ambient mode.
// Present at all times as texture; roughly doubles in Ambient mode.
// The actual grain-rendering component is built alongside the screens that
// use it (Phase 3+) — this file just owns the opacity tokens.

export const grainOpacity = {
  light: 0.02,
  ambient: 0.05,
};
