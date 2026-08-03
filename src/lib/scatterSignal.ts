// A shared counter PolaroidCard instances react to on shake — see
// docs/02-ux-flows-and-wireframes.md § 5 and src/lib/useShakeDetector.ts.
// Passed via context so every visible card can watch it without the
// screen re-rendering its whole list on each shake.

import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

export const ScatterContext = createContext<SharedValue<number> | null>(null);

export function useScatterSignal(): SharedValue<number> | null {
  return useContext(ScatterContext);
}
