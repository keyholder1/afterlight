# Database Schema — Two-Tier Model

Two databases exist, with different jobs:

| | Local SQLite (device) | Supabase Postgres (backend) |
|---|---|---|
| Role | Source of truth for the UI | Sync + backup + realtime relay between the two devices |
| Read path | Every screen | Never read directly by UI |
| Write path | Every user action, immediately | Only via a plain background sync step |
| Availability | Always | Best-effort, app works without it |

Full schemas: [`schema/local_sqlite_schema.sql`](schema/local_sqlite_schema.sql), [`schema/supabase_schema.sql`](schema/supabase_schema.sql). Both are scoped to the five MVP screens plus Relationship Seasons and one-song-per-day — see `07-roadmap.md` for what's deliberately not modeled yet (scrapbook, collections, tags/search, letters, and everything else post-launch).

## Why two databases, kept plain

Two users, a handful of photos a day. That rules out reaching for the tooling a real multi-tenant SaaS app would use — a generic sync framework (WatermelonDB-style), a CRDT library, a formal outbox with entity-type polymorphism, a repository abstraction layer. None of that complexity is earning its keep here. Instead:

- Every syncable local row carries a single `synced_at` column. Null means "push it." That's the entire sync bookkeeping model — no separate queue table for row-level changes.
- Photo uploads get their own small `pending_uploads` table, because uploading bytes genuinely does need its own retry/progress state distinct from "this row has unsynced fields" — that's real, not accidental, complexity.
- There's no repositories/services layering prescribed in the schema itself. Screens can query SQLite through whatever thin data-access functions make sense once the app is actually being written — the schema doesn't need to dictate an architecture pattern to stay correct.

## Write flow

1. User action (capture a photo, edit a caption, attach a day's song) writes directly to local SQLite and updates the UI immediately — no network round trip in the critical path.
2. If it's a photo, its local file also gets a `pending_uploads` row.
3. A background sync step (see `06-technical-architecture.md`) runs on foreground/reconnect: uploads any pending photo bytes to Supabase Storage, then pushes any row where `synced_at is null` via `upsert`, keyed on `client_id` for idempotency (safe to retry after a crash mid-sync). On success, `synced_at` gets stamped.

## Read flow

1. On foreground/reconnect, the app pulls everything in the pair's Postgres tables updated since `local_meta.last_synced_at`, and upserts into local SQLite by id.
2. A Supabase Realtime subscription on `memories` (filtered to `pair_id`) pushes live inserts while the app is foregrounded — this is what powers "partner just captured" without polling, and it's the one piece of "realtime" complexity kept, because the daily capture gate's waiting state genuinely depends on it.
3. `day_summaries` is recomputed locally after any local `memories` write, rather than synced from a server-side view — keeps the Calendar screen correct even for photos captured offline and not yet uploaded.

## Relationship Seasons (life_chapters)

Chapters are detected automatically, not authored: see `06-technical-architecture.md` for the heuristic. A detected chapter writes a `life_chapters` row (`auto_generated = true`); a user renaming or merging one just edits that row and flips the flag. There's no separate "chapter editor" — renaming happens inline wherever the season header is shown.

## Conflict resolution

Photos are immutable once captured — there is no scenario where both devices edit the same photo's pixels, so image conflicts don't exist. The only editable fields are `caption`, `location_name`, `thoughts`, and a chapter's `title`. For those: **last-write-wins by `updated_at`**, resolved by the `upsert`. A full CRDT or per-field merge would be solving a problem this app doesn't have — the two users are rarely editing the same field at the same second, and if they do, losing one edit to the other is a rare, low-stakes outcome, not worth the complexity to prevent.

`daily_prompts` completion (`user_a_memory_id` / `user_b_memory_id`) is additive, not overwritten — each side only ever sets its own column, so there's no conflict by construction.

## Deletes

Soft delete only (`deleted_at` timestamp), both locally and server-side, so the partner's device can reconcile a deletion on next sync instead of a hard delete silently vanishing a photo they haven't pulled yet.

## Storage buckets

Two Supabase Storage buckets, path-prefixed by `pair_id` so storage policies can key off the same `is_pair_member` check used for Postgres rows:

- `memories/{pair_id}/{memory_id}/original.jpg`
- `memories/{pair_id}/{memory_id}/thumb.jpg`

Thumbnails are generated on-device at capture time and uploaded alongside the original — no server-side image processing step for something the phone already does for free.
