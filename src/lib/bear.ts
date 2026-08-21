export const BEAR_STATES = [
  "idle",
  "arrive",
  "reactCorrect",
  "reactWrong",
  "celebrate",
  "lookDown",
  "completeHappy",
  "thanks",
] as const;

export type BearState = (typeof BEAR_STATES)[number];

/** Durations in ms. Game timing must exclude these. */
export const BEAR_DURATIONS = {
  arrive: 700,
  reactCorrect: 320,
  reactWrong: 320,
  celebrate: 1100,
  lookDown: 450,
  completeHappy: 1200,
  thanks: 600,
  idle: 0,
} as const satisfies Record<BearState, number>;

export function bearDuration(state: BearState) {
  return BEAR_DURATIONS[state];
}
