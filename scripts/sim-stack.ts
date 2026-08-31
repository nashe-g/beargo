/* Scratch simulation for tuning. Run: npx tsx scripts/sim-stack.ts */
import {
  STACK,
  carryWobble,
  nextNudgeAt,
  seedStackRound,
  stackKick,
  stackLength,
  stackTopple,
  stepStack,
  tapCatch,
  type StackBody,
  type StackCarry,
} from "../src/lib/stack";
import { hashSeed, mulberry32 } from "../src/lib/rng";

type Strategy = {
  name: string;
  threshold?: number;
  /** Weight on angular velocity: humans react to motion, not just angle. */
  omegaCoef?: number;
  delayMs?: number;
  minGapMs?: number;
  spamMs?: number;
  none?: boolean;
};

function runCarry(carry: StackCarry, strat: Strategy, rng: () => number) {
  let body: StackBody = stackKick(rng);
  let taps = 0;
  let integral = 0;
  let maxLean = Math.abs(body.theta);
  let assist = 0;
  let force = 0;
  let holdUntil = -1;
  let lastTap = -1e9;
  let pendingAt: number | null = null;
  let pendingSide: -1 | 1 = 1;
  let nudgeAt = nextNudgeAt(700, rng, carry.glasses);
  const fired = new Set<number>();
  const dtMs = STACK.dt * 1000;

  const tap = (side: -1 | 1, now: number) => {
    const gap = now - lastTap;
    lastTap = now;
    taps += 1;
    body = tapCatch(body, side, carry.glasses);
    if (gap < 180) {
      body = { ...body, omega: body.omega + side * 0.16, v: body.v * 1.12 };
    }
    assist = side * STACK.tapForce;
    force = side * STACK.holdForce;
    holdUntil = now + 140;
  };

  for (let t = 0; t < carry.durationMs; t += dtMs) {
    for (const j of carry.jolts) {
      if (!fired.has(j.atMs) && t >= j.atMs) {
        fired.add(j.atMs);
        body = { ...body, v: body.v + j.side * STACK.joltV };
      }
    }
    if (t >= nudgeAt) {
      const side = rng() < 0.5 ? -1 : 1;
      body = { ...body, v: body.v + side * STACK.nudge };
      nudgeAt = nextNudgeAt(t, rng, carry.glasses);
    }
    if (!strat.none) {
      if (strat.spamMs) {
        if (t - lastTap >= strat.spamMs) {
          tap(taps % 2 === 0 ? 1 : -1, t);
        }
      } else {
        const th = strat.threshold ?? 0.07;
        const signal = body.theta + (strat.omegaCoef ?? 0.3) * body.omega;
        if (
          pendingAt == null &&
          Math.abs(signal) > th &&
          t - lastTap > (strat.minGapMs ?? 340)
        ) {
          pendingAt = t + (strat.delayMs ?? 250);
          pendingSide = signal > 0 ? 1 : -1;
        }
        if (pendingAt != null && t >= pendingAt) {
          tap(pendingSide, t);
          pendingAt = null;
        }
      }
    }
    if (t >= holdUntil) force = 0;
    assist *= Math.exp(-STACK.tapDecay * STACK.dt);
    if (Math.abs(assist) < 0.04) assist = 0;
    const phase = t / 1000;
    const disturb =
      (STACK.wander / stackLength(carry.glasses)) *
      (Math.sin(phase * 2.05) + 0.35 * Math.sin(phase * 3.3 + 0.9));
    body = stepStack(body, carry.glasses, force + assist, STACK.dt, disturb);
    maxLean = Math.max(maxLean, Math.abs(body.theta));
    integral += Math.abs(body.theta) * STACK.dt;
    if (Math.abs(body.theta) >= stackTopple(carry.glasses)) {
      return {
        toppled: true,
        wobble: carryWobble({
          toppled: true,
          maxLean,
          integral,
          taps,
          durationMs: carry.durationMs,
        }),
        taps,
        atMs: t,
      };
    }
  }
  return {
    toppled: false,
    wobble: carryWobble({
      toppled: false,
      maxLean,
      integral,
      taps,
      durationMs: carry.durationMs,
    }),
    taps,
    atMs: carry.durationMs,
  };
}

const strategies: Strategy[] = [
  { name: "none        ", none: true },
  { name: "skilled     ", threshold: 0.05, omegaCoef: 0.34, delayMs: 170, minGapMs: 260 },
  { name: "average     ", threshold: 0.075, omegaCoef: 0.28, delayMs: 300, minGapMs: 300 },
  { name: "sloppy      ", threshold: 0.1, omegaCoef: 0.18, delayMs: 420, minGapMs: 320 },
  { name: "spam-120ms  ", spamMs: 120 },
  { name: "spam-250ms  ", spamMs: 250 },
];

const seed = seedStackRound("2026-08-30", "the-rustic");
console.log(`modifier: ${seed.modifier}`);
for (const carry of seed.carries) {
  console.log(
    `carry ${carry.glasses} glasses · ${carry.durationMs}ms · jolts at ${carry.jolts
      .map((j) => `${Math.round(j.atMs)}${j.side > 0 ? "R" : "L"}`)
      .join(", ")}`,
  );
}

const TRIALS = 300;
for (let index = 0; index < seed.carries.length; index += 1) {
  const carry = seed.carries[index]!;
  console.log(`\n=== Carry ${index + 1} (${carry.glasses} glasses) ===`);
  for (const strat of strategies) {
    let survived = 0;
    let wobbleSum = 0;
    let tapsSum = 0;
    for (let trial = 0; trial < TRIALS; trial += 1) {
      const rng = mulberry32(hashSeed(`sim:${strat.name}:${index}:${trial}`));
      const result = runCarry(carry, strat, rng);
      if (!result.toppled) survived += 1;
      wobbleSum += result.wobble;
      tapsSum += result.taps;
    }
    console.log(
      `${strat.name} survive ${(100 * survived / TRIALS).toFixed(0).padStart(3)}%  mean wobble ${(wobbleSum / TRIALS).toFixed(1).padStart(5)}  mean taps ${(tapsSum / TRIALS).toFixed(0).padStart(3)}`,
    );
  }
}

// Session totals for the plausible strategies
console.log(`\n=== Session totals (mean of ${TRIALS} runs) ===`);
for (const strat of strategies) {
  let total = 0;
  for (let trial = 0; trial < TRIALS; trial += 1) {
    for (let index = 0; index < seed.carries.length; index += 1) {
      const rng = mulberry32(hashSeed(`tot:${strat.name}:${index}:${trial}`));
      total += runCarry(seed.carries[index]!, strat, rng).wobble;
    }
  }
  console.log(`${strat.name} mean total wobble ${(total / TRIALS).toFixed(1)}`);
}
