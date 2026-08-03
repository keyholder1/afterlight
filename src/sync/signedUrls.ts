// Short-lived signed URLs for displaying the partner's photos, which this
// device has never downloaded — the `memories` Storage bucket is private
// (RLS-gated, see docs/06-technical-architecture.md § Security), so a
// direct public URL won't work. Cached in memory so re-rendering a card
// during a scroll doesn't refetch a URL for the same path.

import { supabase } from '../supabase/client';

const STORAGE_BUCKET = 'memories';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

const cache = new Map<string, { url: string; expiresAt: number }>();

export async function getSignedUrl(path: string): Promise<string | null> {
  const cached = cache.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return null;

  cache.set(path, {
    url: data.signedUrl,
    expiresAt: Date.now() + (SIGNED_URL_TTL_SECONDS - 60) * 1000,
  });
  return data.signedUrl;
}
