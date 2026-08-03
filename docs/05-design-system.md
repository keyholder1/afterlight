# Design System

Principle: the UI disappears behind the memories. Every token below exists to be quiet — restrained color, generous whitespace, one deliberate accent, physical-feeling paper/shadow textures instead of gradients or glass. Where a normal app would add a label, a title, or a button, default to leaving it out — see `01-product-spec.md` § UI philosophy.

## Color

Warm, paper-and-film neutrals. One accent used sparingly (primary actions, live/unread state) — never for decoration.

```
Light theme
  bg/canvas        #FAF7F2   warm off-white, like aged paper
  bg/surface       #FFFFFF   card backgrounds
  bg/sunken        #F1ECE3   inputs, sunken surfaces
  text/primary     #241F1A   near-black, warm not blue-black
  text/secondary   #6B6155
  text/tertiary    #A69D8E
  border/hairline  #E6DFD3
  accent           #C15F3C   terracotta — primary actions, connecting thread, live state
  accent/muted     #E7C9BB   accent backgrounds, subtle highlights
  success          #5B8266   "both captured" complete state
  polaroid/white   #FFFFFF
  polaroid/shadow  rgba(36,31,26,0.18)

Dark / Ambient theme
  bg/canvas        #17140F
  bg/surface       #211D17
  bg/sunken        #14110C
  text/primary     #F3EEE4
  text/secondary   #B6AC9C
  text/tertiary    #6E6555
  border/hairline  #332D24
  accent           #E0805C   lighter terracotta, keeps contrast in dark
  accent/muted     #4A3226
  success          #7FA98C
  polaroid/white   #EFE9DD   Polaroids stay warm-white, not pure white, on dark bg
  polaroid/shadow  rgba(0,0,0,0.45)
```

No pure black, no pure white anywhere except the Polaroid card itself in light mode — everything else is warmed slightly to avoid a cold, clinical feel.

## Ambient mode (dark mode is a mood, not a palette swap)

Switching into dark theme isn't just remapping colors above — three additional things change together, so night use of the app reads as *calmer*, not just darker:

1. **Paper ages.** The subtle paper-grain texture under `bg/canvas` shifts from a light, new-paper texture to a deeper, warmer, slightly more visible grain — the visual equivalent of an old photo album versus a fresh one.
2. **Film grain increases.** A very faint animated grain overlay (low opacity, GPU-cheap) is present at all times but its opacity roughly doubles in Ambient mode — present in light mode mostly as texture, more noticeable at night the way real low-light photos look grainier.
3. **Motion slows down.** Every duration token below runs at roughly 1.3x its light-mode length in Ambient mode, and spring `damping` values increase slightly (less overshoot). Nothing in Ambient mode should feel urgent.

This is a first-class mode, not an afterthought — build it alongside light mode from the start rather than deriving it mechanically.

## Typography

| Role | Typeface | Notes |
|---|---|---|
| Display / headers | **Fraunces** (variable, optical size) or system serif fallback | Season headers, screen titles — gives the "scrapbook/journal" warmth |
| Body / UI | **Inter** or system default (San Francisco on iOS, Roboto on Android) | The rare label, input text — needs to disappear, so use the platform-native feel |
| Caption (handwritten) | **Caveat** or **Kalam** (Google Fonts, free, bundleable) | Only for the optional photo caption text printed on the Polaroid — never for UI chrome |
| Printed date/time on Polaroid | **Special Elite** or a monospace | Evokes the dot-matrix printed date on real Polaroid film |

Scale (base 16px / 1rem, 1.25 modular ratio):

```
display-lg   40px / 48   Fraunces SemiBold   — rare hero numbers (post-launch dashboard, not MVP)
display-sm   28px / 34   Fraunces Medium     — season headers
body-lg      17px / 24   Inter Regular       — primary reading text (e.g. a letter, post-launch)
body         15px / 21   Inter Regular       — the rare label or input
caption      13px / 18   Inter Medium        — metadata, timestamps in UI chrome
handwritten  20px / 24   Caveat Regular      — Polaroid captions
printed      12px / 16   Special Elite       — Polaroid date/time stamp, all-caps tracking +0.5px
```

## Spacing

4px base unit, standard 4-8-12-16-24-32-48-64 scale. Timeline uses larger gaps (24-32) between elements than typical list UI (8-12) — reinforces the "spread out, breathing" scrapbook feel over a dense feed feel.

## Polaroid card

```
border        14px white (or polaroid/white) frame on all sides,
              bottom border 44px (space for printed caption)
corner-radius 2px  — Polaroids have almost-sharp corners, not app-rounded
shadow        0 6px 16px polaroid/shadow, plus a faint 0 1px 2px contact shadow
rotation      random per card, seeded by memory id (stable across re-renders),
              range -4deg to +4deg
overlap       each card overlaps the previous one in its column by 15-20%
              of its own height
back face     long-press flips the card in place (see § micro-interactions) —
              back uses polaroid/white at slightly lower opacity paper texture,
              caption/location/weather/thoughts laid out like handwriting on
              the back of a real photo, not a form
```

## Connecting thread

When both partners have a memory within roughly 20 minutes of each other, a thin (1px, `accent` at 40% opacity) hand-drawn-feeling line connects the two cards across the timeline's center gutter. Rendered as a slightly wavy path (not a straight ruled line) so it reads as drawn, not measured. It's the only chrome allowed to cross the two-column boundary — see `02-ux-flows-and-wireframes.md` § 3.

## Film-strip calendar cell

Calendar day cells with memories render as a tiny strip of 1-4 small rounded-rectangle frames with a faint sprocket-hole texture along one edge, rather than a plain dot. Cell width scales the strip down proportionally; a day with many memories shows a fuller, slightly overlapping strip rather than growing the cell. Empty days show no strip at all, not a placeholder outline — an empty day is just empty.

## Motion

All animation via `react-native-reanimated` worklets (UI thread, not JS thread) and gestures via `react-native-gesture-handler`. No `Animated` API, no JS-thread-driven interaction — this is the single biggest lever for smoothness.

```
spring/default     { damping: 18, stiffness: 180, mass: 1 }     — card entrances, sheet presents
spring/snappy      { damping: 22, stiffness: 260, mass: 0.9 }   — button press, shutter tap
spring/gentle      { damping: 20, stiffness: 90,  mass: 1.2 }   — story auto-advance cross-fade drive
spring/drop        { damping: 14, stiffness: 210, mass: 1.1 }   — a new Polaroid dropping onto the stack, one small bounce
duration/xs        120ms   ease-out   — icon/toggle state changes
duration/sm        200ms   ease-out   — list item press feedback
duration/md        400ms   ease-in-out — story frame cross-fade
duration/lg        600ms   ease-in-out — screen-level shared-element transitions
```

In Ambient mode, multiply every `duration/*` above by ~1.3x and reduce `stiffness` by ~15% on every spring — see § Ambient mode.

Rules of thumb:
- Every tap gets feedback within one frame (scale to 0.96 with `spring/snappy`), never a bare opacity flash.
- Opening a Polaroid uses `spring/drop` in reverse (lifts toward the viewer) rather than a generic push/modal slide — the single highest-leverage animation for feel, since it's the most-repeated interaction in the app.
- Nothing bounces more than once. Overshoot should read as "soft," not "bouncy toy."

## Micro-interactions (see `02-ux-flows-and-wireframes.md` § 5 for the full behavior list)

| Gesture | Motion spec |
|---|---|
| Shake device | Visible Polaroids get a small randomized impulse (rotation ± 6deg, translate ± 8px) via the accelerometer, then all settle back with `spring/default`, staggered ~30ms per card |
| Pull down on timeline | Vertical scale-stretch on the visible content, capped at ~6%, released with `spring/gentle` — a physical-resistance cue, not a spinner |
| Tap to open a Polaroid | `spring/drop` in reverse — card scales up and lifts toward the viewer while background dims slightly |
| Swipe away (detail/story view) | Card translates off-axis with a slight rotation increase in the swipe direction, `duration/md`, then releases — reads as sliding a print off a table |
| Long-press a Polaroid | 3D flip around the vertical axis, `duration/md`, `ease-in-out`, settles on the back face |
| New capture appears in the timeline | `spring/drop` — a small bounce as if it physically landed on the stack, plus a soft contact-shadow pulse |

## Key components (spec, not code)

**PolaroidCard** — props: `uri`, `capturedAt`, `caption?`, `location?`, `weather?`, `thoughts?`, `rotation` (derived, not passed), `size` ('timeline' | 'story'). Renders image with `expo-image` (disk+memory cache, blurhash placeholder), printed timestamp, handwritten caption if present, flips to a back face on long-press (see § micro-interactions) rather than opening a separate screen.

**CaptureButton** (tab bar center item) — circular, accent-colored ring when today's prompt is active and un-captured, muted once captured, subtle pulse (opacity 1↔0.85, 1.6s loop) only during the active capture window — the one place in the app allowed a looping animation, since it's time-sensitive and rare (once a day).

**StoryProgressBar** — segmented top bar, one segment per memory in the day, matches the story convention users already know instinctively — deliberately *not* reinvented.

**SeasonHeader** — Fraunces display-sm chapter title (e.g. "Winter Together"), no subtitle by default, sticky within Home Timeline and Calendar, cross-fades to the next chapter's title at the boundary rather than hard-cutting. A long-press reveals the rare escape hatches (settings) — see `03-information-architecture.md`.

**EmptyState** — pre-first-memory and empty calendar days — illustration-free, warm typographic copy only ("Nothing here yet — that's the point."), no icon, no call-to-action button beyond what's already reachable via the capture button.

**WaitingState** (daily prompt, partner hasn't captured yet) — partner's Polaroid slot renders as a soft frosted/blurred silhouette outline. No text label, no spinner — the visual absence itself communicates "not yet," consistent with the "remove the chrome" principle; a screen-reader label still describes the state for accessibility even though nothing is shown visually.
