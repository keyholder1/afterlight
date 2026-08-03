# Roadmap

## MVP roadmap

Five screens — Pairing, Home Timeline, Camera, Calendar, Story Playback — made exceptional. Relationship Seasons, one-song-per-day, the tiny physical details, and Ambient mode are folded into that same MVP, because they're what make those five screens feel unforgettable rather than merely functional — they are not deferred polish. Nothing else ships first: no Scrapbook, no Search, no Dashboard, no visible AI. See `01-product-spec.md` § non-goals and § UI philosophy for why.

Ordered so each phase produces something runnable on a real device, not just code.

### Phase 0 — Project setup
- `npx create-expo-app` with TypeScript template, EAS project registration.
- Supabase project created, `supabase_schema.sql` applied, storage buckets created, RLS verified with a throwaway two-account test.
- Design tokens (`05-design-system.md`) wired into a theme provider for both Light and Ambient themes from day one; fonts bundled.
- No CI for v1 — two users, no team to break a build for. Just `eas build` run manually before sharing a new APK.

### Phase 1 — Auth & pairing
- Email OTP sign-in, `profiles` creation.
- `redeem_pairing_code` Postgres function, `PairingHome`/`PairingConfirm` screens.
- Unlink flow with 24h cooldown.
- **Runnable milestone**: two test accounts can pair on two devices.

### Phase 2 — Capture, local storage, upload
- Local SQLite schema, plain `db/` query functions.
- Camera screen with the rotating prompt-line copy, resize/compress/thumbnail/blurhash pipeline, local-first write.
- `pushUnsynced()` / Storage upload.
- **Runnable milestone**: capture a photo offline, see it locally instantly, watch it sync when reconnected.

### Phase 3 — Home Timeline
- Two-column `FlashList` timeline, gap logic, PolaroidCard with rotation/overlap, the connecting thread between same-moment cards.
- Realtime subscriber for live partner updates.
- On-device chapter-boundary heuristic (§ `06-technical-architecture.md`) producing provisional Relationship Season headers.
- **Runnable milestone**: both partners see each other's captures appear live in the correct time slot, under a season header.

### Phase 4 — Calendar & Story Playback
- `day_summaries` maintenance (incremental + backfill), month grid with film-strip day cells.
- Story Playback modal with progress bar, cross-fade auto-advance, one-song-per-day playback.
- **Runnable milestone**: browse to any past day and replay it, with its song if one's attached.

### Phase 5 — Daily capture gate
- `daily_prompts` scheduling (cron + `send-daily-prompt`), push registration and delivery.
- Silent waiting state (no spinner, no label — just an unfinished-looking slot).
- **Runnable milestone**: the daily prompt fires on both devices at the same random time with a human prompt line, and the waiting state resolves live when the second person captures.

### Phase 6 — Season naming, notifications, tiny details
- `name-chapter` function wired up (the one language-model call in the whole system, § `06-technical-architecture.md`), overwriting provisional season titles with real ones.
- Remaining notifications: partner-captured, missed-today, season-aware anniversary.
- Micro-interactions: shake-to-scatter, pull-to-stretch, lift-to-open, slide-away, long-press flip-to-back.
- Ambient mode's full mood shift (paper aging, grain, slowed motion), not just a dark palette.

### Phase 7 — Polish pass
- Spring/motion tuning against real devices, empty/waiting states, both themes reviewed side by side.
- Real-device performance pass: scroll profiling with a seeded database of thousands of memories, image cache tuning.

### Phase 8 — Ship v1 APK
- `eas build` production APK, manual install on both devices, an `app_releases` row published.
- MVP scope ends here.

## Post-launch roadmap

Rough priority order, not committed dates. Each of these gets its own UX pass when it's actually being built — nothing here is designed in detail yet, on purpose.

1. **Letters** — a yearly locked note to your partner, unreadable until the same date next year. Small in scope, high emotional weight — a strong candidate for first post-launch addition.
2. **Scrapbook, reframed** — not a tab from day one. Once enough memories accumulate, the app auto-composes physical-feeling album pages the two of you flip through, like a finished album rather than an open canvas to maintain. Manual pin/rearrange/collections fold in here, later and lighter-touch than originally scoped.
3. **Weather, quietly captured** — rain/fog/sun/golden-hour/moon-phase recorded on every photo at capture time, shown only on the back of a flipped Polaroid, never as its own screen.
4. **Search** — a plain, low-emphasis utility reachable the same way Settings is, never a tab, never a primary surface. Matches captions/locations and whatever quiet backend understanding already exists by then.
5. **Backup/export** — a "take everything with you" escape hatch. Cheap insurance, low urgency.
6. **Memory Capsules** — attach a memory or note that only opens a year from now.
7. **Dream Board** — pin things you want to do together before you've done them; a bucket-list item converts into a real memory once it happens.
8. **Travel Map** — trips connected geographically, once there's enough location data across memories to make a map worth looking at. The point at which an actual maps SDK integration earns its keep — not before.
9. **Multi-photo capture** (front+back dual shot) — only if single-shot starts feeling limiting in practice.
10. **Video support** — bigger lift (storage, playback, thumbnailing all change); revisit only if photos alone feel insufficient after real use.
11. **iOS build** — sideload via Xcode without a public listing, mirroring the Android "no store" posture, or reconsider store distribution if a public release is ever desired.

Deliberately not on this list unless it re-earns its place later: a Relationship Dashboard as a dedicated screen. Sentimental stats are nice, but nothing in the feedback that shaped this roadmap asked for them back, and a stats screen is exactly the kind of "commercial product" surface this app is trying to avoid by default.
