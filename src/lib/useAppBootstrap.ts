// Drives which of AuthStack / PairingStack / MainTabs the root navigator
// shows — see docs/03-information-architecture.md. Replaces the Phase 0
// `devAuthState` placeholder with real session/profile/pair state.

import { useCallback, useEffect, useState } from 'react';
import { useSession } from '../supabase/auth';
import { getProfile, Profile } from '../supabase/profile';
import { getActivePair, partnerIdFor, Pair } from '../supabase/pairing';
import { setLocalMeta } from '../db/localMeta';

export type BootstrapStatus =
  | 'loading'
  | 'unauthenticated'
  | 'needsProfile'
  | 'needsPairing'
  | 'ready';

export type Bootstrap = {
  status: BootstrapStatus;
  userId: string | null;
  profile: Profile | null;
  pair: Pair | null;
  partnerName: string | null;
  refresh: () => Promise<void>;
};

export function useAppBootstrap(): Bootstrap {
  const { session, loading: sessionLoading } = useSession();
  const [status, setStatus] = useState<BootstrapStatus>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pair, setPair] = useState<Pair | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);

  const check = useCallback(async () => {
    if (sessionLoading) return;

    if (!session) {
      setStatus('unauthenticated');
      setProfile(null);
      setPair(null);
      setPartnerName(null);
      return;
    }

    const userId = session.user.id;
    const myProfile = await getProfile(userId);
    if (!myProfile) {
      setStatus('needsProfile');
      setProfile(null);
      return;
    }
    setProfile(myProfile);

    const activePair = await getActivePair(userId);
    if (!activePair) {
      setStatus('needsPairing');
      setPair(null);
      return;
    }
    setPair(activePair);

    const partnerId = partnerIdFor(activePair, userId);
    const partner = await getProfile(partnerId);

    await setLocalMeta({
      user_id: userId,
      pair_id: activePair.id,
      partner_id: partnerId,
      partner_name: partner?.display_name ?? null,
    });

    setPartnerName(partner?.display_name ?? null);
    setStatus('ready');
  }, [session, sessionLoading]);

  useEffect(() => {
    // Fire-and-forget: `check` awaits Supabase/SQLite calls before touching
    // state, so this is the "sync on mount / when session changes" case the
    // effect rule allows, not a synchronous cascading setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    check();
  }, [check]);

  return {
    status,
    userId: session?.user.id ?? null,
    profile,
    pair,
    partnerName,
    refresh: check,
  };
}
