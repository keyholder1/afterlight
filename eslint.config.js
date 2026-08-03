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
  }
]);
