# Information Architecture

## Navigation shell — MVP

Bottom bar, **two destinations plus one action** — deliberately not five. Center item opens the Camera as a modal, not a persistent tab.

```
┌───────────┬─────────┬───────────┐
│   Home    │ (Camera │ Calendar  │
│           │   ⊕ )   │           │
└───────────┴─────────┴───────────┘
```

No icon labels in the shipped bar — the two side icons and the center capture affordance are distinct enough by shape and position alone. Settings and the (post-launch) search live one level down, reached from a long-press on the Home Timeline's season header, not from a permanent, always-visible slot.

Pre-pairing, the tab bar doesn't exist at all — the whole app is a single onboarding/pairing stack until a `pair_id` exists locally.

Scrapbook and Dashboard are **not** in the MVP nav. Scrapbook returns later as an emergent milestone screen, not a tab you visit from day one (see `01-product-spec.md` and `07-roadmap.md`). Dashboard doesn't return until there's a real reason to look at stats separately from just living in the timeline.

## Navigator structure (React Navigation)

```
RootNavigator (native-stack)
├── AuthStack (unauthenticated)
│   ├── Welcome
│   ├── EmailEntry
│   └── OtpVerify
├── PairingStack (authenticated, no pair_id yet)
│   ├── PairingHome        (generate / enter code)
│   └── PairingConfirm
└── MainTabs (authenticated + paired) — bottom-tab navigator, 2 tabs
    ├── HomeStack (native-stack)
    │   └── HomeTimeline
    └── CalendarStack
        ├── CalendarMonth
        └── DayDetail

Modals (presented over MainTabs, not part of the tab stacks):
├── CameraModal            (daily prompt + free capture, same screen)
├── StoryPlaybackModal     (full-screen, presented from DayDetail or an anniversary notification)
├── MemoryDetailModal      (long-press a Polaroid → flips it over in place; see 02-ux-flows-and-wireframes.md)
└── Settings               (reached via long-press on the Home season header, not a tab)
    └── UnlinkPartner
```

Note the `MemoryDetailModal` is intentionally not a full navigation push in the usual sense — per `02-ux-flows-and-wireframes.md` § tiny details, long-pressing a Polaroid flips it in place (caption/location/weather/thoughts on the back) rather than navigating to a new screen for what is, structurally, just more fields on the same object.

## Screen inventory — MVP

| Screen | Route | Purpose | Entry points |
|---|---|---|---|
| Welcome | `/welcome` | App intro, sign in / create account | App launch (unauth) |
| EmailEntry | `/auth/email` | Collect email for OTP | Welcome |
| OtpVerify | `/auth/otp` | Verify 6-digit OTP | EmailEntry |
| PairingHome | `/pairing` | Generate or enter pairing code | Post-auth, no pair |
| PairingConfirm | `/pairing/confirm` | Confirm partner identity before linking | Code entered successfully |
| HomeTimeline | `/home` | Two-column, season-headed, threaded chronological scrapbook | Tab bar, app launch (paired) |
| CalendarMonth | `/calendar` | Season-aware month grid, film-strip day cells | Tab bar |
| DayDetail | `/calendar/:date` | Single day's timeline, thread included, song attach, replay button | Calendar tap |
| CameraModal | `/capture` | Camera, prompt line, optional caption/location/song | Tab bar center button, push notification |
| StoryPlaybackModal | `/story/:date` | Full-screen chronological replay, plays the day's song if set | DayDetail, anniversary notification |
| MemoryDetailModal | in-place (not routed) | Flip-to-back metadata view | Long-press any Polaroid |
| Settings | `/settings` | Profile, notifications, unlink | Long-press Home season header |

## Deferred screens (post-launch — see `07-roadmap.md`)

`ScrapbookCanvas` (reframed as auto-composed album pages), `SearchModal` (low-emphasis utility, not a tab), `Dashboard`, `Letters`, `MemoryCapsules`, `DreamBoard`, `BucketList`, `TravelMap`. None of these are designed in detail yet — they get their own IA pass once the MVP is live and used daily.

## Data ownership boundary

Every screen except `AuthStack` and `PairingStack` reads exclusively through the local SQLite layer (see `04-database-schema.md`), never directly from Supabase. This is an architectural rule, not just an optimization: it guarantees Home, Calendar, and Story Playback all work fully offline once the initial sync has happened.
