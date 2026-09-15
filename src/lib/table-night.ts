import { CARRY_WOBBLE_CAP, wobbleTenths } from "@/lib/stack";
import type { TableScore } from "@/lib/table-test";

/** Worst three carries, in tenths. Closed skip penalty when the tray is broken. */
export const SKIP_WOBBLE_TENTHS = wobbleTenths(CARRY_WOBBLE_CAP * 3);

/** Lower is better. Does not depend on who else is on the board. */
export function combinedNightScore(round1: TableScore, wobbleTenthsValue: number) {
  return (
    (1 - round1.correctRate) * 1000 +
    round1.averageMs / 100 +
    wobbleTenthsValue / 10
  );
}

export function compareCombined(left: number, right: number) {
  return left - right;
}

export function jumpedCopy(jumped: number) {
  if (jumped > 1) return `You jumped ${jumped} tables.`;
  if (jumped === 1) return "You jumped 1 table.";
  if (jumped === 0) return "Same place.";
  if (jumped === -1) return "You dropped 1 table.";
  return `You dropped ${Math.abs(jumped)} tables.`;
}

export function playingTonightLine(n: number) {
  if (n <= 1) return "1 table playing tonight.";
  return `${n} tables playing tonight.`;
}

export const ROUND1_DONE: Array<
  "revealed" | "tray" | "night" | "room"
> = ["revealed", "tray", "night", "room"];

export const NIGHT_DONE: Array<"night" | "room"> = ["night", "room"];
