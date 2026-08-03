-- ============================================================================
-- partner-captured notification trigger — see
-- docs/06-technical-architecture.md § Notifications: "sent from a database
-- trigger on memories insert, not client-side, so it fires even if the
-- other person's app is closed."
--
-- Uses pg_net to call the notify-partner-captured Edge Function
-- asynchronously on every memories insert. One manual step after deploying
-- that function: run
--   alter database postgres set app.settings.notify_partner_captured_url =
--     'https://<project-ref>.functions.supabase.co/notify-partner-captured';
-- (or set it as a Vault secret and read that instead — either works, this
-- just needs *a* place to read the deployed URL from, since it isn't known
-- until after the function's first deploy).
-- ============================================================================

create extension if not exists pg_net;

create or replace function public.trigger_notify_partner_captured()
returns trigger
language plpgsql security definer as $$
declare
  function_url text;
begin
  function_url := current_setting('app.settings.notify_partner_captured_url', true);
  if function_url is null then
    return new; -- not configured yet — no-op rather than fail the insert
  end if;

  perform net.http_post(
    url := function_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('memory_id', new.id, 'pair_id', new.pair_id, 'author_id', new.author_id)
  );

  return new;
end;
$$;

create trigger on_memory_captured_notify_partner
  after insert on public.memories
  for each row execute function public.trigger_notify_partner_captured();
