// Pairing — see docs/06-technical-architecture.md § Auth & pairing and
// docs/schema/supabase_schema.sql § pairing_codes / pairs.

import { supabase } from './client';
import { generateCodeString } from '../lib/pairingCode';

export type Pair = {
  id: string;
  user_a: string;
  user_b: string;
  paired_at: string;
  unlink_requested_at: string | null;
  unlink_requested_by: string | null;
  unlinked_at: string | null;
};

const CODE_EXPIRY_MS = 15 * 60 * 1000;
const MAX_GENERATION_ATTEMPTS = 5;

// Codes are inserted directly by the client under the "manage own pairing
// codes" RLS policy — no Edge Function needed for something this small. A
// collision on the (rare, random) code retries with a fresh value.
export async function createPairingCode(ownerId: string): Promise<{ code: string; expiresAt: string }> {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const code = generateCodeString();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS).toISOString();

    const { error } = await supabase
      .from('pairing_codes')
      .insert({ code, owner_id: ownerId, expires_at: expiresAt });

    if (!error) return { code, expiresAt };
    if (error.code !== '23505') throw error; // anything but a unique-violation is fatal
  }
  throw new Error('Could not generate a unique pairing code — try again.');
}

export async function redeemPairingCode(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('redeem_pairing_code', {
    input_code: code.toUpperCase(),
  });
  if (error) {
    if (error.message.includes('invalid_or_expired_code')) {
      throw new Error("That code isn't valid or has expired.");
    }
    if (error.message.includes('cannot_pair_with_self')) {
      throw new Error("You can't pair with your own code.");
    }
    throw error;
  }
  return data as string; // new pairs.id
}

export async function getActivePair(userId: string): Promise<Pair | null> {
  const { data, error } = await supabase
    .from('pairs')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .is('unlinked_at', null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function partnerIdFor(pair: Pair, myUserId: string): string {
  return pair.user_a === myUserId ? pair.user_b : pair.user_a;
}

const UNLINK_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function requestUnlink(pairId: string, requestedBy: string): Promise<void> {
  const { error } = await supabase
    .from('pairs')
    .update({ unlink_requested_at: new Date().toISOString(), unlink_requested_by: requestedBy })
    .eq('id', pairId);
  if (error) throw error;
}

export async function cancelUnlink(pairId: string): Promise<void> {
  const { error } = await supabase
    .from('pairs')
    .update({ unlink_requested_at: null, unlink_requested_by: null })
    .eq('id', pairId);
  if (error) throw error;
}

export function unlinkFinalizesAt(pair: Pair): Date | null {
  if (!pair.unlink_requested_at) return null;
  return new Date(new Date(pair.unlink_requested_at).getTime() + UNLINK_COOLDOWN_MS);
}
