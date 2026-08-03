# Technical Architecture

Kept deliberately short. The stack is six things. The moment a design here starts to look like what you'd build for a commercial product with a real ops team, that's a signal to cut it back down, not a sign of thoroughness.

## The stack

React Native, Expo, TypeScript, SQLite, Supabase, Expo Camera. That's it — nothing else gets added until a concrete feature genuinely can't be built without it.

| Layer | Choice | Why |
|---|---|---|
| App | React Native + Expo (managed, EAS Build) | Camera, filesystem, and notifications without hand-rolling native modules; EAS Build produces a signed APK directly, no store needed. |
| Language | TypeScript | Costs nothing, pays for itself the first time this codebase is revisited a year later. |
| Local data | `expo-sqlite` + device filesystem (`expo-file-system` for photo bytes) | The offline-first read path — every screen reads from here, never from Supabase directly. |
| Backend | Supabase (Postgres + Storage + Realtime + Auth), free/small tier | The minimum viable "something" for pairing, cross-device sync, and backup. A pure P2P design was considered and rejected — no backup if a phone is lost, and NAT traversal between two arbitrary home networks is real engineering effort for zero benefit at this scale. A custom server was also rejected — same functionality as Supabase, more to operate. |
| Capture | `expo-camera` | Nothing else is needed for a single-shot capture flow. |

Notifications ride on Firebase Cloud Messaging under the hood — it doesn't require a Play Store listing, only Google Play services on the device, so it's compatible with a sideloaded APK. It's not a separate architectural layer, just how Expo's push module talks to Android.

## Project structure

Flat, not layered. No `repositories/`, no `features/` module system, no framework-style folder ceremony — a two-person app doesn't need an architecture that scales to a team.

```
afterlight/
├── app.json / eas.json          # Expo config, android-apk EAS profile (no store submission)
├── src/
│   ├── screens/                 # Welcome, Pairing, Home, Calendar, DayDetail, Camera, Story, Settings
│   ├── components/              # PolaroidCard, SeasonHeader, StoryProgressBar, EmptyState, WaitingState
│   ├── db/                      # SQLite setup + plain query functions (getMemoriesForRange, insertMemory, ...)
│   ├── sync/                    # pushUnsynced(), pullSince(), subscribeRealtime() — a handful of functions, not a framework
│   ├── supabase/                # client + generated types
│   ├── theme/                   # design tokens (05-design-system.md) + light/Ambient theme provider
│   └── lib/                     # date helpers, chapter-detection heuristic, blurhash
├── supabase/
│   ├── migrations/               # from docs/schema/supabase_schema.sql
│   └── functions/
│       ├── send-daily-prompt/    # cron-invoked, picks the day's prompt line and fire time
│       ├── name-chapter/         # the one place a language model is called — see § Relationship Seasons
│       └── send-anniversary/
└── docs/
```

Guidance, not a rule enforced by tooling: screens and components call the plain functions in `src/db`, not raw SQL scattered around the UI. That's enough to keep "local SQLite is the only read path" true in practice.

## Sync

No outbox table, no generic sync framework. Every syncable local row has a `synced_at` column (null = not yet pushed) — see `04-database-schema.md`. Sync is three plain functions:

1. **`pushUnsynced()`** — runs on app foreground and on reconnect. Selects local rows where `synced_at is null`, `upsert`s them to Supabase keyed on `client_id` (safe to retry after a crash mid-sync), stamps `synced_at` on success.
2. **`pullSince(lastSyncedAt)`** — runs alongside it. Fetches rows from Supabase updated since the pair's last sync, upserts them locally, recomputes `day_summaries` for any affected days.
3. **`subscribeRealtime()`** — one Supabase Realtime channel per pair, open while the app is foregrounded, pushing the partner's new memories straight into the local upsert path. This is the one piece of "live" infrastructure kept, because the daily-capture waiting state genuinely depends on it — without it, "partner just captured" would only resolve on the next poll, which would visibly break the core daily ritual.

Photo bytes get their own tiny `pending_uploads` table (retry/progress state that's genuinely distinct from "this row has unsynced fields," not accidental complexity — see `04-database-schema.md`).

## Auth & pairing

- Auth: Supabase email OTP (a typed code, not a magic link — links are awkward on the same device that needs to receive them). A `profiles` row is created on first successful verification.
- Pairing code: 6 characters from a 32-character alphabet excluding ambiguous characters (`0/O/1/I/L`), generated and redeemed through a single Postgres function (`redeem_pairing_code(code)`, `security definer`) called via `supabase.rpc()` — no separate Edge Function needed for something this small. 15-minute expiry, single-use, atomic redemption (the function itself prevents a race if both people somehow tap redeem at once).
- Redemption creates the `pairs` row; the redeeming device sets its local `pair_id` immediately, the code owner's device picks it up on its next foreground pull or Realtime event.
- Unlink: sets `unlink_requested_at`, a daily cron finalizes it 24 hours later unless canceled. While pending, the UI shows a plain "unlinking in 24h — cancel" line.

## Image upload

```
Capture (expo-camera)
  → resize to max 2048px long edge, compress JPEG (expo-image-manipulator)
  → write original + a 320px thumbnail to the app's local filesystem
  → generate a blurhash from the thumbnail (cheap, on-device)
  → insert the `memories` row locally (synced_at = null) — UI shows it immediately from the local file
  → add a `pending_uploads` row
  → pushUnsynced() uploads the thumbnail first (unblocks the partner's low-res preview sooner),
    then the original, to Supabase Storage under {pair_id}/{memory_id}/
  → on success: stamp synced_at, clear the pending_uploads row
```

Local files are never deleted after upload — storage is cheap relative to two people's photo volume, and instant local display matters more than reclaiming device space.

## Timeline rendering

- A single query reads local SQLite for a date range, ordered by `captured_at`, split into "own" / "partner" per row.
- Rendered with `FlashList` (not `FlatList`) for constant memory regardless of years of history. Both columns render from one outer list where each row is a time slot with a left/right Polaroid slot (one, both, or neither populated) — this keeps the two columns' scroll position identical without manually syncing two separate scroll views, and is also what makes the connecting thread (`05-design-system.md`) straightforward to draw between same-row slots.
- Gaps: rows come only from actual memory timestamps — consecutive memories more than ~45 minutes apart get a proportionally-sized (capped) spacer row, so a long gap reads as empty page, not empty hour-slots.
- Scrolling to the top of the loaded window loads the previous days from local SQLite — instant, since it's already-synced data, giving the seamless backward scroll from `02-ux-flows-and-wireframes.md`.

## Calendar rendering

- The month grid (and its film-strip cells) reads only from `day_summaries` — never scans `memories` — so opening any month, including one from years ago, is a single indexed lookup.
- `day_summaries` updates incrementally after any local `memories` write; a one-time backfill computes it for all history on first sync after install.

## Relationship Seasons (detection, kept invisible)

This is the one place a language model is used anywhere in the system — and it's called a handful of times a year, not per photo, which is what keeps it cheap and simple enough to justify:

1. A local, on-device heuristic (no network call) proposes a new chapter boundary whenever there's a 10+ day gap with no memories, or a sustained change in the reverse-geocoded location (5+ days in a new city/region — signals a trip or a move). This writes a provisional `life_chapters` row immediately, titled with a plain date range (e.g. "Sep 12 – Oct 3"), so a season header always has *something* to show without waiting on a network round trip.
2. On next sync, once a chapter boundary has closed (a new one has started), a small Postgres/Edge function (`name-chapter`) is called once for that chapter, with just its captions/locations/date range, and a single model call proposes a short emotional title ("Our First Semester"). The result overwrites the provisional title.
3. If that call fails, is slow, or there's no network, the provisional date-range title simply stays — never a broken or loading state, just a plainer name until it's renamed (automatically, later, or by hand).
4. This is never labeled to the user as AI-anything, anywhere — it just becomes the season header. See `01-product-spec.md` § non-goals.

## Notifications

- Registration: on app start (post-auth), request permission, register the push token, upsert it server-side.
- Daily prompt: a cron job runs hourly; for any pair without today's `daily_prompts` row, it picks a random `fire_at` within the pair's active hours and a prompt line from the rotating set (`02-ux-flows-and-wireframes.md` § 2), and sends the push once `fire_at` passes.
- Partner-captured: sent from a database trigger on `memories` insert, not client-side, so it fires even if the other person's app is closed.
- Anniversary: a daily job checks for memories captured exactly N years before today; if that date now falls within a named `life_chapters` row, the notification references the chapter ("This was during Our First Semester") instead of a generic "one year ago."
- Every push carries a deep link matching the routes in `03-information-architecture.md`.

## Security

- **RLS on every pair-scoped table** (`is_pair_member(pair_id)`, see `supabase_schema.sql`) — a buggy or compromised client can't read or write the other pair's data because Postgres refuses it, not because the UI happens not to ask.
- **Storage policies** mirror the same check via the `{pair_id}` path prefix, so a leaked Storage URL for one pair's photo is rejected for anyone else.
- **Credentials**: the language-model API key used by `name-chapter` lives only in that function's environment, never in the APK. The Supabase anon key is the only credential shipped in the app, and it's safe by design since RLS — not key secrecy — is what actually gates access.
- **Pairing codes**: short-lived, single-use, carry no personal data — a leaked code has a narrow blast radius.
- **APK signing**: standard EAS-managed signing, so future update APKs are verifiably from the same source.
- **No public read path** anywhere except pairing-code lookup-by-value (needed pre-pair) and the app-release version check, neither of which exposes user content.

## Offline support

The default posture, not a bolt-on:

- All reads: local SQLite, always available.
- All writes: local-first, synced later — capturing offline works identically to capturing online, it just uploads whenever connectivity returns.
- Home Timeline, Calendar, and Story Playback all work fully offline once the first sync has happened.
- The only things that need connectivity at the moment of use: pairing, and the very first sync after install. Everything else degrades to "will sync later," never to "broken."

## Performance

- `FlashList` for Timeline and the Calendar grid — constant memory regardless of years of history.
- `expo-image` for every photo — disk+memory cache, blurhash placeholder, no layout jank while loading.
- All interactive animation on the UI thread via Reanimated worklets + Gesture Handler (`05-design-system.md` § Motion) — sync and SQLite queries never block a scroll or gesture.
- Photos capped at 2048px long edge at capture — plenty for a phone screen, no unnecessary file size.
- Hermes engine (Expo default) for fast cold start — matters here because there's no tolerance for a slow splash screen if the app is meant to feel instant.

## Distribution & update strategy (no store)

- Build: `eas build --platform android --profile production` with an `android-apk` (not `app-bundle`) EAS profile, producing a directly-installable `.apk`.
- Distribution: share the APK file/link directly — the two users sideload it, enabling "install from unknown sources" once.
- Update check: on foreground, compare the local app version against the latest published release row; if newer, show a dismissible "update available" line linking to the new APK. No silent auto-update — Android can't self-update a sideloaded app without the user tapping install.
