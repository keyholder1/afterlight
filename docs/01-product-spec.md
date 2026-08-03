# Afterlight — Product Specification

## What this is

A private, offline-first mobile app for exactly two people to capture and revisit shared memories over years. Not a social app — there is no audience, only a partner.

Name: **Afterlight** — the warm glow that lingers after the moment itself has passed. Said as "open Afterlight," not "open the app."

## Distribution model (drives every downstream decision)

- Sideloaded **Android APK**, built via EAS Build, installed manually by the two users. No Play Store listing, no AAB, no store review.
- iOS is a possible future target — not in scope for v1.
- No store means no store-based auto-update; see `06-technical-architecture.md` for the manual version-check.

## Architecture principle

Every technology and every feature must answer: **"Is this actually required for two people using an APK?"**

For technology, that means a short, boring list — React Native, Expo, TypeScript, SQLite, Supabase, Expo Camera — and nothing more until something concrete demands it. See `06-technical-architecture.md`.

For features, it means restraint in the opposite direction than most products: not "what else can we add," but "what can we remove so only the memories are left." The UI should feel like it's disappearing. Fewer labels, fewer buttons, fewer screens — see § UI philosophy below.

## Non-goals (explicit)

- No followers, likes, comments, public profiles, discover feed, or algorithmic ranking.
- No multi-user support beyond exactly one pair per account relationship.
- No ads, no monetization, no analytics/growth instrumentation.
- No Play Store / App Store submission in v1.
- No web app.
- **No visible AI.** The word "AI" never appears in the product — not in onboarding copy, not in settings, not in a tooltip. Any machine understanding of a photo (what it's grouped with, when it was probably taken, what it might be about) happens invisibly, server-side, and simply shows up as the app being quietly smart. If a feature can't work without explaining "our AI does X" to the user, the copy is wrong, not the feature.
- **Search is not a primary feature.** People revisit memories by browsing, not querying. A basic search exists as a fallback utility (post-launch, low priority — see `07-roadmap.md`), never a tab, never a first-class surface.

## UI philosophy

Cut visible chrome aggressively — aim to remove roughly half of what a "normal" app would show. Concretely:

- No screen titles where the content already makes the screen obvious.
- No labels under icons unless the icon alone is genuinely ambiguous.
- No settings-style rows of toggles where a gesture can do the same job.
- The bottom nav is two destinations plus the capture action — not five. See `03-information-architecture.md`.
- Every screen's job is to get out of the way of a photograph.

## Core feature list

### The five screens (MVP — see `07-roadmap.md` for why nothing else ships first)

| Area | Summary |
|---|---|
| Pairing | Each account gets a unique, single-use, expiring pairing code. Entering a partner's code links the two accounts. Unlinking is intentionally hard, not a casual action. |
| Home Timeline | Two-column (you / partner) chronological scrapbook. Cards from the same rough moment are visually threaded together, so simultaneous memories read as a shared moment, not two unrelated feeds side by side. Grouped and headed not by raw month, but by **Relationship Seasons** — see below. |
| Camera (Capture) | Once a day, at a random time, both partners get a notification with a short, human prompt ("Pause." / "Where are you?" / "What made you smile?") instead of a generic "capture now." Free uploads are allowed any time outside the prompt. |
| Calendar | Instead of dots, days with memories render as tiny film strips that visibly fill in as the month accumulates memories — the calendar should look more alive the more it's used. |
| Story Playback | Replay a day's memories chronologically, full-screen, soft cross-fades. If that day has an attached song, it plays underneath the replay. |

### The soul of the app (folded into the five screens above, not a separate feature list)

- **Relationship Seasons** — the app automatically groups the timeline into emotionally-named chapters ("Our First Semester," "Winter Together," "The Long Distance Months") instead of calendar months. This is the single biggest differentiator in the product and replaces "August 2026" as the primary way time is presented, everywhere a date range would otherwise be shown. Detection is automatic and invisible (see `06-technical-architecture.md`); users can rename or merge a season, but never have to create one manually for the app to feel this way from day one.
- **One song per day** — each day can optionally have one song attached (not a streaming integration — just a title/artist and, if available, a link). Replaying that day plays the song underneath the memories. Hearing "the song of December 2027" while looking at December 2027 is the point.
- **Tiny physical details** — see `05-design-system.md` § micro-interactions: shake to scatter old Polaroids, pull the timeline to stretch it like paper, open a Polaroid like lifting paper off a stack, swipe a photo away like sliding it off a table, long-press a photo to flip it over and see caption/location/weather/thoughts on the back instead of opening another screen.
- **Ambient mode** — dark mode isn't a color swap. At night the whole app ages: paper texture warms and deepens, a faint film grain increases, animations and transitions slow down. The app should feel calmer after dark, not just darker.

### Deliberately post-launch (see `07-roadmap.md`)

Letters (a locked yearly note to your partner, unreadable until next year), Memory Capsules (open in a year), a Dream Board (pin future memories before they happen), a shared Bucket List (photos attach once completed), quiet weather/golden-hour/moon-phase capture on every photo, a Travel Map, a proper Scrapbook (reframed as an emergent milestone — the app assembles physical-feeling album pages once you've accumulated enough memories, not a tab you visit from day one), and search.

## Privacy

Everything is private by default. No public content, no ads, no recommendation logic, no social mechanics. All media belongs only to the paired users, enforced at the database and storage layer (see `04-database-schema.md`).

## Quality bar

The measure of success is not feature count. It's whether an ordinary Tuesday from two years ago, revisited at random, makes someone smile. Every doc in this set — UX flows, design system, architecture — exists in service of that one sentence.
