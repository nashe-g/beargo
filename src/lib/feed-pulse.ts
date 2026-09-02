export type NightPulse = {
  score: number;
  label: string;
  peopleHere: number;
  postsTonight: number;
};

export function pulseFrom(
  peopleHere: number,
  postsTonight: number,
): NightPulse {
  const score = Math.min(100, peopleHere * 8 + Math.min(postsTonight, 25) * 3);
  let label = "Dead";
  if (score >= 70) label = "Packed";
  else if (score >= 40) label = "Busy";
  else if (score >= 18) label = "Moving";
  else if (score >= 1) label = "Quiet";
  return { score, label, peopleHere, postsTonight };
}

export function pulseLine(pulse: NightPulse) {
  return `Pulse ${pulse.score} · ${pulse.label}`;
}
