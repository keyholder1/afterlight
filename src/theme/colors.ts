// Color tokens — see docs/05-design-system.md § Color.
// No pure black, no pure white anywhere except the Polaroid card itself in
// light mode — everything else is warmed slightly on purpose.

export type ColorScale = {
  bgCanvas: string;
  bgSurface: string;
  bgSunken: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  borderHairline: string;
  accent: string;
  accentMuted: string;
  success: string;
  polaroidWhite: string;
  polaroidShadow: string;
};

export const lightColors: ColorScale = {
  bgCanvas: '#FAF7F2',
  bgSurface: '#FFFFFF',
  bgSunken: '#F1ECE3',
  textPrimary: '#241F1A',
  textSecondary: '#6B6155',
  textTertiary: '#A69D8E',
  borderHairline: '#E6DFD3',
  accent: '#C15F3C',
  accentMuted: '#E7C9BB',
  success: '#5B8266',
  polaroidWhite: '#FFFFFF',
  polaroidShadow: 'rgba(36,31,26,0.18)',
};

// "Ambient" theme — see docs/05-design-system.md § Ambient mode. This is not
// just the dark palette: the paper texture, grain opacity, and motion timing
// all shift alongside it too (see grain.ts and motion.ts).
export const ambientColors: ColorScale = {
  bgCanvas: '#17140F',
  bgSurface: '#211D17',
  bgSunken: '#14110C',
  textPrimary: '#F3EEE4',
  textSecondary: '#B6AC9C',
  textTertiary: '#6E6555',
  borderHairline: '#332D24',
  accent: '#E0805C',
  accentMuted: '#4A3226',
  success: '#7FA98C',
  polaroidWhite: '#EFE9DD',
  polaroidShadow: 'rgba(0,0,0,0.45)',
};
