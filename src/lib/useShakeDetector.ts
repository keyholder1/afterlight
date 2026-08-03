// See docs/02-ux-flows-and-wireframes.md § 5: "Shake the phone... Visible
// Polaroids briefly scatter and resettle... Purely delightful, does
// nothing functional."

import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

const SHAKE_THRESHOLD = 1.8; // combined delta magnitude
const COOLDOWN_MS = 1200;

export function useShakeDetector(onShake: () => void) {
  const lastRef = useRef({ x: 0, y: 0, z: 0 });
  const lastShakeAtRef = useRef(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(120);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const last = lastRef.current;
      const delta = Math.abs(x - last.x) + Math.abs(y - last.y) + Math.abs(z - last.z);
      lastRef.current = { x, y, z };

      const now = Date.now();
      if (delta > SHAKE_THRESHOLD && now - lastShakeAtRef.current > COOLDOWN_MS) {
        lastShakeAtRef.current = now;
        onShake();
      }
    });
    return () => sub.remove();
  }, [onShake]);
}
