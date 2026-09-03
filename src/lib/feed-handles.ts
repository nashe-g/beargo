/** Closed nicknames. Keep at or under 14 chars so `Name 2` still fits the board. */
export const FEED_HANDLES = [
  "Wrong Tab",
  "Open Tab",
  "Split Check",
  "Short Pour",
  "Long Pour",
  "Comp Tab",
  "Closing Tab",
  "Dry Tap",
  "Sticky Tap",
  "Warm Pint",
  "Extra Lime",
  "One Olive",
  "No Umbrella",
  "Lime Wedge",
  "Water Back",
  "Ginger Back",
  "Hold the Ice",
  "Same Again",
  "Next Round",
  "Check Please",
  "Last Stool",
  "Side Stool",
  "High Top",
  "Lost Coat",
  "Wrong Coat",
  "Coat Check",
  "Tip Jar",
  "Ice Machine",
  "Wet Floor",
  "Dart Miss",
  "Captain Spill",
  "Mayor Tab",
  "Coach Lime",
  "Saint Pint",
  "I Got Next",
  "Watch This",
  "Hold My Pint",
  "Napkin Math",
  "Irish Exit",
  "Shot Ski",
] as const;

export function randomFeedHandle() {
  return FEED_HANDLES[Math.floor(Math.random() * FEED_HANDLES.length)]!;
}

export function numberedFeedHandle(base: string, n: number) {
  return `${base} ${n}`;
}
