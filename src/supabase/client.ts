// Supabase client — see docs/06-technical-architecture.md § Auth & pairing
// and § Security. The anon key is safe to ship (RLS gates access, not key
// secrecy); both values must be present via EXPO_PUBLIC_* env vars, since
// that prefix is what Expo inlines into the client bundle. See .env.example.
//
// Relies on 'react-native-url-polyfill/auto' already being imported once at
// the app entry point (App.tsx) before this module is ever used.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in the values from your Supabase project settings.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
