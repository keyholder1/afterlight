-- Bookkeeping column needed for send-daily-prompt to only push once per
-- prompt (it runs hourly) — not a new feature, just what "sends the push
-- once fire_at has passed" (docs/06-technical-architecture.md § Notifications)
-- actually requires to avoid re-sending on every subsequent hourly run.

alter table public.daily_prompts add column if not exists notified_at timestamptz;
