# UX Flows and Wireframes

Wireframes are ASCII layout sketches — intent and hierarchy, not pixel-accurate. See the Artifact mockup linked from the project README for a high-fidelity visual pass on top of these.

Scope note: sections 1–5 are the five MVP screens (Pairing, Home Timeline, Camera, Calendar, Story Playback) — these are the only screens built first, and they're meant to be exceptional, not merely functional. Section 8 covers tiny physical details and ambient mode, which are part of making those five screens exceptional, not separate features. Everything under § Post-launch is sketched for later, deliberately not built yet — see `07-roadmap.md`.

---

## 1. Onboarding & Pairing

```
Splash → Email entry → OTP code entry → Account created
  → "You're not paired yet" screen
      ├─ [Generate my code]  → shows 6-char code + share sheet + QR
      └─ [Enter partner's code] → text input → validate → confirm screen
              "Pair with <name>? This links your memories permanently
               until you both agree to unlink." [Confirm] [Cancel]
  → Paired → Home Timeline (empty state)
```

Pairing code: 6 characters, uppercase alphanumeric minus ambiguous chars (no 0/O, 1/I), expires in 15 minutes, single-use, regenerable anytime (invalidates the old one).

Unlinking: buried in Settings → "Unlink from <partner>", requires typing partner's name to confirm, then a 24-hour cooldown before it takes effect (cancelable during the cooldown). This is the "intentionally hard to accidentally disconnect" requirement.

```
┌─────────────────────┐
│                       │
│   Your pairing code   │
│                       │
│     ┌───────────┐     │
│     │  9F K3 X7  │     │
│     └───────────┘     │
│                       │
│   [ Share code ]      │
│   [ Show QR ]         │
│                       │
│   Have a code?        │
│   [ Enter it → ]      │
└─────────────────────┘
```

No app wordmark on this screen either — the pairing code itself is the entire content. First impression is quiet, not branded.

---

## 2. Camera (daily prompt + free capture)

```
Push notification arrives (random time, once/day), with a short human
prompt instead of an instruction — see § Daily prompt personality
  → tap → Camera opens directly (single shot for v1)
  → Capture → Retake / Use photo
  → Optional caption (handwritten-style input) + optional location toggle
  → Upload
  → Waiting screen if partner hasn't captured yet:
       partner's slot renders as a soft frosted silhouette, no spinner,
       no "waiting" label — just visibly unfinished, like a page not
       yet filled in
  → Once both are in → both unlock → normal Home Timeline, today's
     entry appears at the current time slot for both columns, threaded
     together (§ 3)
```

```
┌─────────────────────┐
│  Pause.               │
│                       │
│  ┌─────────────────┐  │
│  │                 │  │
│  │   [ viewfinder ] │  │
│  │                 │  │
│  └─────────────────┘  │
│                       │
│         ( ○ )         │
│                       │
└─────────────────────┘
```

No "flip / flash / retake" text labels — those are icon-only, positioned at thumb reach either side of the shutter, understood by shape not caption.

Free uploads (outside the daily prompt) use the same camera screen, reachable from the center tab-bar button anytime, and just append to the timeline at the current timestamp without the waiting state.

### Daily prompt personality

The notification and the in-camera headline are the same short line, drawn from a rotating set — never "Capture now":

> "Pause." · "Where are you?" · "What does today feel like?" · "What made you smile?" · "Look up." · "One thing, right now."

These rotate so the prompt itself starts to feel like a small daily question from the app, not a task reminder.

---

## 3. Home Timeline

```
        Our First Semester            ← Relationship Season header,
                                          not a raw month name
├───────────┬──────────┤
│    You     │  Mira    │
│            │          │
│  [Polaroid]┄┄┄┄┄┄┄┄┄┄  │  ← 7:12a, thin thread connects same-moment cards
│   slight   ┆          │
│   rotate   ┆[Polaroid]│  ← 7:15a — close enough in time to thread
│            │          │
│[Polaroid]  │          │  ← 1:15p
│            │          │
│   (gap —   │[Polaroid]│  ← 6:02p
│   no photo │          │
│   between  │          │
│   1p-6p)   │          │
│            │          │
│[Polaroid]┄┄┄┄[Polaroid]│  ← 9:47p (today's prompt, both present, threaded)
└───────────┴──────────┘
      ↓ scroll = later in the day, earlier days above
```

No date-picker chrome, no settings gear, no search icon on this screen by default — a single small affordance in the corner (a soft tap-and-hold on the season header) reveals the rare escape hatches (settings, the eventual search). The default view is just the two columns and the season name.

**Relationship Seasons** replace "August 2026" as the primary time label everywhere a date range would otherwise appear — see `01-product-spec.md` § Relationship Seasons and `06-technical-architecture.md` for how chapters are detected. Scrolling across a season boundary cross-fades the header from one chapter name to the next, the same way a day header would change — chapters are just a coarser version of the same mechanic.

**Connecting thread**: when both partners have a memory within a short window of each other (default ~20 minutes, tunable), a thin hand-drawn-feeling line connects the two Polaroids across the gutter between columns. It's the one piece of chrome allowed to cross the two-column boundary, because it's the visual expression of the whole product's premise — a moment the two of you shared, even apart.

Scroll direction: top = morning, bottom = night. Reaching the top of "today" and continuing to scroll up loads the previous day's tail seamlessly (infinite scroll backward through history), not a hard pagination boundary — this is what makes it feel like a single continuous diary rather than day-boxed pages.

Cards overlap the previous card by ~15–20% of height, alternating slight left/right rotation, so the column reads as a loosely stacked pile rather than a rigid grid.

---

## 4. Calendar → Day Detail → Story Playback

```
Calendar (month grid)                 Day detail (tap a day)
┌───────────────────────┐             ┌─────────────────────┐
│   Winter Together   ›  │             │  Aug 3                │
│ S  M  T  W  T  F  S    │   tap 3 →   │  (same as Home        │
│  ▤  ▤  ▪  ▪  ▤  ▪  ▪    │             │   Timeline, but        │
│  ▪  ▪▪ ▪  ▪  ▪  ▪  ▪    │             │   scoped to this day,  │
│  ▪  ▪  ▪  ▪ [▪▪]▪  ▪    │             │   thread included)     │
└───────────────────────┘             └─────────────────────┘
```

Header shows the Relationship Season the visible month falls in, not just the month/year — tapping it steps between seasons instead of months, which is the faster way to browse for most people; a small secondary control still allows literal month stepping.

Days with memories render as tiny **film strips** (a short row of tiny perforated-edge frames) rather than a dot — a light day shows one small frame, a heavy day shows a fuller strip. The whole grid visibly fills in and starts looking like a strip of film itself as a month accumulates memories, rather than staying a sparse dot-grid.

Tapping "Replay this day" (or auto-suggested when opening a day with 2+ memories) opens Story Playback:

```
┌─────────────────────┐
│▬▬▬▬░░░░░░░░░░░░░░░░░ │ ← per-memory progress segments
│                       │
│                       │
│     [ full-bleed      │
│       photo ]         │
│                       │
│                       │
│  You · 7:12 AM         │
│  "morning coffee"      │
│  Blue Bottle, Oakland  │
│  ♪ playing: [song]     │  ← only if this day has a song attached
└─────────────────────┘
```

Auto-advances slower than typical stories (~4–5s per frame, soft cross-fade ~400ms) — nostalgic pacing, not attention-grabbing pacing. Tap right/left to advance/rewind, swipe down to exit back to the day detail.

### One song per day

From the day detail screen, a small, easy-to-ignore affordance lets either partner attach one song to that day (title + artist, optionally a link — no streaming SDK integration required for v1). If present, it plays quietly underneath Story Playback for that day, starting as playback starts. Revisiting a day a year later means also hearing what that day sounded like.

---

## 5. Tiny physical details & ambient mode

These aren't separate screens — they're interaction behaviors layered onto the five screens above, and they matter as much as any screen does.

| Gesture | Behavior |
|---|---|
| Shake the phone (on Home Timeline or Calendar) | Visible Polaroids briefly scatter and resettle, like joggling a real stack of photos. Purely delightful, does nothing functional. |
| Pull down on the timeline | The paper visibly stretches slightly before snapping back — a physical resistance cue instead of a generic refresh spinner. |
| Tap a Polaroid to open it | The card lifts off the stack toward the viewer rather than a screen-slide transition — reads as picking up a physical photo. |
| Swipe a photo away (in detail/story view) | The photo slides off to the side like sliding a real print off a table, not a standard screen-dismiss animation. |
| Long-press a Polaroid | It flips over in place. The back shows caption, location, weather, and a short "thoughts" field — instead of opening a whole new screen for metadata that doesn't need one. |

**Ambient mode** (dark/night mode, but treated as a mood, not a palette swap): as the app shifts to its dark theme, the paper texture underneath every screen warms and deepens rather than just going grey-on-black, a faint film grain becomes slightly more visible, and every transition duration in `05-design-system.md` § Motion runs measurably slower. The intent is that using the app at night should feel calmer than using it during the day, not just visually darker.

---

## 6. Notifications (behavioral, not just copy)

| Trigger | Copy | Deep link |
|---|---|---|
| Daily prompt (random time) | One of the rotating prompt lines (§ 2), e.g. "Where are you?" | Camera |
| Partner captured, you haven't | "\<Partner> just captured today." | Camera |
| Both captured | (no notification needed — both apps already reflect it live) | — |
| Anniversary of a past memory | A season-aware line when possible, e.g. "This was during Our First Semester." Falls back to "One year ago today." if no season context exists yet. | That day's Story Playback |
| End of day, no capture | "You haven't captured today." | Camera |

Deliberately cut from the original notification set: weekly/monthly recap pushes and a "today's memory is complete" push — both depended on the Dashboard, which isn't part of the MVP (§ Post-launch). All sending logic lives server-side (a scheduled function), covered in `06-technical-architecture.md`.

---

## Post-launch (sketched now, not built first)

Kept brief on purpose — these are backlog sketches, not commitments, and get their own detailed UX pass once the five MVP screens are shipped and actually used daily. See `07-roadmap.md` for sequencing and reasoning.

- **Letters** — once a year, the app privately asks each partner to write something for the other. Both letters are sealed and unreadable until the same date the following year, when they unlock together.
- **Scrapbook (reframed)** — not a tab you visit from day one. Once enough memories accumulate (a rough threshold, e.g. every ~500 photos), the app auto-composes a set of physical-feeling album pages the two of you flip through, like a finished photo album rather than an open canvas you maintain yourself. Manual pin/rearrange/collections from the original concept fold into this later, lighter-touch.
- **Search** — a plain, low-emphasis search utility, reachable the same way Settings is (not a tab), matching captions/locations and whatever quiet backend understanding of a photo already exists. Never surfaced as a primary way to find anything.
- **Memory Capsules** — attach a memory (or a note) that only opens a year from now.
- **Dream Board** — pin things you want to do together before you've done them; a bucket-list item converts into an actual memory (with its photo) once it happens.
- **Travel Map** — trips connected geographically once there's enough location data across memories to make a map worth looking at.
