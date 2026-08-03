// Font loading — see docs/05-design-system.md § Typography.
// Exactly the four weights the type scale in typography.ts uses, nothing more.

import { useFonts as useGoogleFonts } from 'expo-font';
import { Fraunces_500Medium, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { Caveat_400Regular } from '@expo-google-fonts/caveat';
import { SpecialElite_400Regular } from '@expo-google-fonts/special-elite';

export function useAppFonts() {
  const [fontsLoaded, fontError] = useGoogleFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Caveat_400Regular,
    SpecialElite_400Regular,
  });

  return { fontsLoaded, fontError };
}
