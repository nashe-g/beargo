export { getDailyChallenge, challengeForPaw } from "@/lib/play-session";
export { QUESTIONS_PER_CHALLENGE } from "@/lib/questions";
export type DailyChallenge = Awaited<
  ReturnType<typeof import("@/lib/play-session").getDailyChallenge>
>;
