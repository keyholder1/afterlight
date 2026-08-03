// Invoked by the pg_net trigger in
// supabase/migrations/0003_notify_partner_captured_trigger.sql on every
// memories insert. See docs/06-technical-architecture.md § Notifications:
// "sent from a database trigger on memories insert, not client-side, so it
// fires even if the other person's app is closed."

import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { sendExpoPush } from '../_shared/expoPush.ts';

serve(async (req) => {
  const { pair_id: pairId, author_id: authorId } = await req.json();
  const supabase = supabaseAdmin();

  const { data: pair } = await supabase.from('pairs').select('user_a, user_b').eq('id', pairId).maybeSingle();
  if (!pair) return new Response('ok');

  const partnerId = pair.user_a === authorId ? pair.user_b : pair.user_a;

  const [{ data: author }, { data: tokens }] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', authorId).maybeSingle(),
    supabase.from('push_tokens').select('fcm_token').eq('user_id', partnerId),
  ]);

  const body = `${author?.display_name ?? 'Your partner'} just captured today.`;
  await sendExpoPush(
    (tokens ?? []).map((t) => ({
      to: t.fcm_token,
      body,
      data: { screen: 'CameraModal', params: { userId: partnerId, pairId } },
    })),
  );

  return new Response('ok');
});
