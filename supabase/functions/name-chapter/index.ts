// The one place in the whole system that calls a language model — see
// docs/06-technical-architecture.md § Relationship Seasons: called once per
// closed chapter (a handful of times a year), never per photo, never
// labeled to the user as AI-anything (docs/01-product-spec.md § non-goals).
// Invoked by the client right after it pushes a newly-closed chapter (see
// src/supabase/lifeChapters.ts pushChapters()).
//
// ANTHROPIC_API_KEY must be set as an Edge Function secret
// (`supabase secrets set ANTHROPIC_API_KEY=...`) — never shipped in the
// app, per docs/06 § Security.

import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001'; // cheapest/fastest — this is a tiny, infrequent call

serve(async (req) => {
  const { chapterId } = await req.json();
  const supabase = supabaseAdmin();

  const { data: chapter } = await supabase.from('life_chapters').select('*').eq('id', chapterId).maybeSingle();
  if (!chapter || !chapter.ends_on) return new Response('ok'); // only name closed chapters

  const { data: memories } = await supabase
    .from('memories')
    .select('caption, location_name')
    .eq('pair_id', chapter.pair_id)
    .gte('captured_at', `${chapter.starts_on}T00:00:00.000Z`)
    .lt('captured_at', `${chapter.ends_on}T23:59:59.999Z`)
    .is('deleted_at', null)
    .limit(200);

  const captions = (memories ?? []).map((m) => m.caption).filter(Boolean);
  const locations = [...new Set((memories ?? []).map((m) => m.location_name).filter(Boolean))];

  if (captions.length === 0 && locations.length === 0) {
    return new Response('ok'); // nothing to go on — provisional date-range title stays
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not configured — provisional title stays.');
    return new Response('ok');
  }

  try {
    const prompt = `You are naming a chapter in a private couple's relationship timeline app. Given captions and places from ${chapter.starts_on} to ${chapter.ends_on}, propose a short, warm chapter title (2-5 words, like "Our First Semester" or "Winter Together" or "The Long Distance Months"). Respond with ONLY the title — no quotes, no punctuation at the end, nothing else.

Captions: ${captions.slice(0, 40).join('; ') || '(none)'}
Places: ${locations.slice(0, 20).join(', ') || '(none)'}`;

    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 20,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      console.warn('Anthropic call failed:', res.status, await res.text());
      return new Response('ok');
    }

    const json = await res.json();
    const title = json.content?.[0]?.text?.trim();
    if (title) {
      await supabase.from('life_chapters').update({ title, updated_at: new Date().toISOString() }).eq('id', chapterId);
    }
  } catch (err) {
    console.warn('name-chapter failed, provisional title stays:', err);
  }

  return new Response('ok');
});
