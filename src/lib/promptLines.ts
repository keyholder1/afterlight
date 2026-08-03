// Rotating prompt copy — see docs/02-ux-flows-and-wireframes.md § 2 "Daily
// prompt personality." Used for both the notification text (Phase 5) and
// the in-camera headline.

export const PROMPT_LINES = [
  'Pause.',
  'Where are you?',
  'What does today feel like?',
  'What made you smile?',
  'Look up.',
  'One thing, right now.',
];

export function randomPromptLine(): string {
  return PROMPT_LINES[Math.floor(Math.random() * PROMPT_LINES.length)];
}
