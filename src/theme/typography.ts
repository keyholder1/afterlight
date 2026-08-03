// Typography — see docs/05-design-system.md § Typography.
// Font family keys match the keys registered in fonts.ts via useAppFonts().

export const fontFamilies = {
  display: 'Fraunces_500Medium',
  displayStrong: 'Fraunces_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  handwritten: 'Caveat_400Regular',
  printed: 'SpecialElite_400Regular',
} as const;

export type TypeScaleKey =
  | 'displayLg'
  | 'displaySm'
  | 'bodyLg'
  | 'body'
  | 'caption'
  | 'handwritten'
  | 'printed';

type TypeStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: 'uppercase';
};

// display-lg / display-sm / body-lg / body / caption / handwritten / printed
export const typeScale: Record<TypeScaleKey, TypeStyle> = {
  displayLg: { fontFamily: fontFamilies.displayStrong, fontSize: 40, lineHeight: 48 },
  displaySm: { fontFamily: fontFamilies.display, fontSize: 28, lineHeight: 34 },
  bodyLg: { fontFamily: fontFamilies.body, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fontFamilies.body, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fontFamilies.bodyMedium, fontSize: 13, lineHeight: 18 },
  handwritten: { fontFamily: fontFamilies.handwritten, fontSize: 20, lineHeight: 24 },
  printed: {
    fontFamily: fontFamilies.printed,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
};
