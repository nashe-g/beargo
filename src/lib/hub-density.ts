export type HubDensity = "dead" | "quiet" | "moving" | "packed";

/**
 * Layout tiers from scans in the room, not the Pulse badge.
 * Dead 0–1, Quiet 2–10, then chat takes over; Packed is a loud room.
 */
export function hubDensity(
  peopleHere: number,
  postsTonight = 0,
): HubDensity {
  if (peopleHere <= 1) return "dead";
  if (peopleHere <= 10) return "quiet";
  if (peopleHere >= 20 || postsTonight >= 8) return "packed";
  return "moving";
}
