// Cron-invoked hourly (configure via `supabase functions deploy` +
// a Supabase cron schedule, or pg_cron calling this URL). See
// docs/06-technical-architecture.md § Notifications and
// docs/02-ux-flows-and-wireframes.md § 2 for the prompt-line copy.

import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { sendExpoPush, ExpoPushMessage } from '../_shared/expoPush.ts';

// Mirrors src/lib/promptLines.ts — keep the two lists in sync.
const PROMPT_LINES = [
  'Pause.',
  'Where are you?',
  'What does today feel like?',
  'What made you smile?',
  'Look up.',
  'One thing, right now.',
];

const WINDOW_HOURS = 3;
const ACTIVE_HOURS_START = 9; // UTC — see docs/06's "simple UTC window for v1" note
const ACTIVE_HOURS_END = 21;

function randomFireAtToday(): Date {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), ACTIVE_HOURS_START));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), ACTIVE_HOURS_END));
  const ts = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(ts);
}

serve(async () => {
  const supabase = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  const { data: pairs } = await supabase.from('pairs').select('id, user_a, user_b').is('unlinked_at', null);

  for (const pair of pairs ?? []) {
    const { data: existing } = await supabase
      .from('daily_prompts')
      .select('*')
      .eq('pair_id', pair.id)
      .eq('prompt_date', today)
      .maybeSingle();

    let prompt = existing;
    if (!prompt) {
      const fireAt = randomFireAtToday();
      const windowEndsAt = new Date(fireAt.getTime() + WINDOW_HOURS * 3600_000);
      const { data: created } = await supabase
        .from('daily_prompts')
        .insert({
          pair_id: pair.id,
          prompt_date: today,
          prompt_line: PROMPT_LINES[Math.floor(Math.random() * PROMPT_LINES.length)],
          fire_at: fireAt.toISOString(),
          window_ends_at: windowEndsAt.toISOString(),
        })
        .select('*')
        .single();
      prompt = created;
    }

    if (!prompt || prompt.notified_at || new Date(prompt.fire_at) > now) continue;

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('user_id, fcm_token')
      .in('user_id', [pair.user_a, pair.user_b]);

    const messages: ExpoPushMessage[] = (tokens ?? []).map((t) => ({
      to: t.fcm_token,
      body: prompt!.prompt_line,
      data: { screen: 'CameraModal', params: { userId: t.user_id, pairId: pair.id } },
    }));
    await sendExpoPush(messages);

    await supabase.from('daily_prompts').update({ notified_at: now.toISOString() }).eq('id', prompt.id);
  }

  return new Response('ok');
});
