// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");
const prettierConfig = require("eslint-config-prettier");

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    // supabase/functions/** run on Deno, not Node/RN — a different
    // toolchain entirely, linted (if at all) via `deno lint` separately.
    ignores: ["dist/*", "supabase/**"],
  },
  {
    // react-hooks/immutability is a React Compiler-era rule that doesn't
    // know about react-native-reanimated's SharedValue — mutating `.value`
    // outside React state is Reanimated's actual, documented API (see
    // docs/05-design-system.md § Motion), not an accidental mutation. It
    // false-positives on essentially every worklet/gesture callback in this
    // codebase, so it's off rather than sprinkled with dozens of
    // per-line disables.
    rules: {
      "react-hooks/immutability": "off",
    },
  },
]);
