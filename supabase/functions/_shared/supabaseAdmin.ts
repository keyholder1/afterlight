// Deno/Edge Function runtime — a different toolchain from the Expo app
// (see tsconfig.json / eslint.config.js exclusions). SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are provided automatically in the Edge Function
// environment; the service role key is what lets these functions bypass
// RLS to read across all pairs, which only server-side code should ever do.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function supabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}
