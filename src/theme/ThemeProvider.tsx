// Theme provider — combines the token files into one `useTheme()` value,
// reactive to the system color scheme. "Dark mode" is Ambient mode per
// docs/05-design-system.md § Ambient mode, not just a palette swap: the
// grain opacity and motion multipliers documented there ride along with it.

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, ambientColors, ColorScale } from './colors';
import { typeScale, TypeScaleKey } from './typography';
import { spacing } from './spacing';
import { springs, durations, getSpring, getDuration } from './motion';
import { grainOpacity } from './grain';

export type Theme = {
  mode: 'light' | 'ambient';
  colors: ColorScale;
  spacing: typeof spacing;
  type: typeof typeScale;
  grainOpacity: number;
  spring: (key: keyof typeof springs) => ReturnType<typeof getSpring>;
  duration: (key: keyof typeof durations) => number;
};

const ThemeContext = createContext<Theme | null>(null);

function buildTheme(mode: 'light' | 'ambient'): Theme {
  const ambient = mode === 'ambient';
  return {
    mode,
    colors: ambient ? ambientColors : lightColors,
    spacing,
    type: typeScale,
    grainOpacity: ambient ? grainOpacity.ambient : grainOpacity.light,
    spring: (key) => getSpring(key, ambient),
    duration: (key) => getDuration(key, ambient),
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const mode: 'light' | 'ambient' = systemScheme === 'dark' ? 'ambient' : 'light';
  const theme = useMemo(() => buildTheme(mode), [mode]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme() must be called within a ThemeProvider');
  }
  return theme;
}

export type { TypeScaleKey };
