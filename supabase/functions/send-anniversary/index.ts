// Cron-invoked daily. See docs/06-technical-architecture.md § Notifications:
// "checks for memories captured exactly N years before today; if that date
// now falls within a named life_chapters row, the notification references
// the chapter... one summary notification per pair per day, not one per
// matching photo."

import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { sendExpoPush, ExpoPushMessage } from '../_shared/expoPush.ts';

const MAX_YEARS_BACK = 10;

function targetDate(yearsAgo: number): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - yearsAgo);
  return d.toISOString().slice(0, 10);
}

serve(async () => {
  const supabase = supabaseAdmin();
  const { data: pairs } = await supabase.from('pairs').select('id, user_a, user_b').is('unlinked_at', null);

  for (const pair of pairs ?? []) {
    let matchedDay: string | null = null;
    for (let years = 1; years <= MAX_YEARS_BACK; years++) {
      const day = targetDate(years);
      const { count } = await supabase
        .from('memories')
        .select('id', { count: 'exact', head: true })
        .eq('pair_id', pair.id)
        .is('deleted_at', null)
        .gte('captured_at', `${day}T00:00:00.000Z`)
        .lt('captured_at', `${day}T23:59:59.999Z`);
      if (count && count > 0) {
        matchedDay = day;
        break; // one notification per pair per day — first match wins
      }
    }
    if (!matchedDay) continue;

    const { data: chapter } = await supabase
      .from('life_chapters')
      .select('title')
      .eq('pair_id', pair.id)
      .lte('starts_on', matchedDay)
      .or(`ends_on.is.null,ends_on.gte.${matchedDay}`)
      .maybeSingle();

    const body = chapter?.title ? `This was during ${chapter.title}.` : 'One year ago today.';

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('user_id, fcm_token')
      .in('user_id', [pair.user_a, pair.user_b]);

    const messages: ExpoPushMessage[] = (tokens ?? []).map((t) => ({
      to: t.fcm_token,
      body,
      data: { screen: 'StoryPlaybackModal', params: { day: matchedDay, userId: t.user_id, pairId: pair.id } },
    }));
    await sendExpoPush(messages);
  }

  return new Response('ok');
});
