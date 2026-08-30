import { BEARGO_DAY_ZONE } from "@/lib/config";
import { addCalendarDays, localDateInZone } from "@/lib/dates";
import type { PatronId, PourBand } from "@/lib/pour";
import { hashSeed, mulberry32 } from "@/lib/rng";

export const STACK_GLASS_COUNTS = [3, 4, 5] as const;

export type StackBand = "idle" | "still" | "wobbly" | "soaked";

export type StackJolt = {
  atMs: number;
  side: -1 | 1;
  patronId: PatronId;
};

export type StackCarry = {
  glasses: number;
  durationMs: number;
  jolts: StackJolt[];
};

export type StackRoundSeed = {
  date: string;
  carries: StackCarry[];
};

export const STACK = {
  dt: 1 / 60,
  /** Weaker than earth: a thumb needs ~350–500ms to pick a side. */
  g: 2.72,
  trayMass: 1.05,
  length: 0.98,
  taller: 0.07,
  dampOmega: 1.7,
  dampTray: 2.4,
  tapImpulse: 0.38,
  holdForce: 2.7,
  tapForce: 2.45,
  tapDecay: 2.6,
  joltV: 0.15,
  wander: 0.015,
  nudge: 0.048,
  nudgeMinMs: 2400,
  nudgeMaxMs: 3800,
  maxX: 0.22,
  maxV: 1.35,
  still: 0.12,
  telegraphMs: 920,
} as const;

export type StackBody = {
  theta: number;
  omega: number;
  x: number;
  v: number;
};

export function stackLength(glasses: number) {
  // Shorter pole falls faster. Do not feed this into tap force — that made
  // 4- and 5-high easier because each tap shoved harder.
  return STACK.length - STACK.taller * Math.max(0, glasses - 3);
}

export function stackControlLength() {
  return STACK.length;
}

export function stackTopple(glasses: number) {
  return 0.52 - 0.04 * Math.max(0, glasses - 3);
}

export function stackSpill(glasses: number) {
  return stackTopple(glasses) * 0.58;
}

export function stackHintSide(theta: number, previous: -1 | 0 | 1): -1 | 0 | 1 {
  if (theta > 0.07) return 1;
  if (theta < -0.07) return -1;
  if (Math.abs(theta) < 0.03) return 0;
  return previous;
}

export function stackSlide(x: number) {
  return Math.max(-1, Math.min(1, x / STACK.maxX));
}

/** Catch a fall and send it back. A late or hard tap can overshoot. */
export function tapCatch(body: StackBody, side: -1 | 1, glasses = 3): StackBody {
  const extra = Math.max(0, glasses - 3);
  const returnKick = 0.48 + extra * 0.12;
  return {
    ...body,
    v: body.v + side * STACK.tapImpulse,
    theta: body.theta * (0.78 + extra * 0.05),
    omega: body.omega - side * returnKick,
  };
}

export function chicagoStackDate(offsetDays = 0) {
  const today = localDateInZone(BEARGO_DAY_ZONE);
  return offsetDays === 0 ? today : addCalendarDays(today, offsetDays);
}

export function stackBand(toppled: boolean, maxLean: number): StackBand {
  if (toppled) return "soaked";
  if (maxLean <= STACK.still) return "still";
  return "wobbly";
}

export function stackResultCopy(band: StackBand) {
  if (band === "still") return "Still.";
  if (band === "wobbly") return "Wobbly.";
  if (band === "soaked") return "Down.";
  return "";
}

export function stackWobble(maxLean: number, integral: number) {
  return Math.round(maxLean * 400 + integral * 80);
}

export function stackScore(toppled: boolean, maxLean: number, integral: number) {
  return stackWobble(maxLean, integral) + (toppled ? 240 : 0);
}

const STACK_WOBBLE_CAP = 2000;

export function scoreStackRound(
  date: string,
  hostId: string,
  carries: unknown,
): { wobbles: number[]; stackWobble: number } | null {
  const seed = seedStackRound(date, hostId);
  if (!Array.isArray(carries) || carries.length !== seed.carries.length) {
    return null;
  }
  const wobbles: number[] = [];
  let stackWobble = 0;
  for (let i = 0; i < seed.carries.length; i += 1) {
    const row = carries[i] as { wobble?: unknown; glasses?: unknown };
    const wobble = Number(row?.wobble);
    const glasses = Number(row?.glasses);
    if (
      !Number.isFinite(wobble) ||
      wobble < 0 ||
      wobble > STACK_WOBBLE_CAP ||
      glasses !== seed.carries[i]?.glasses
    ) {
      return null;
    }
    const value = Math.round(wobble);
    wobbles.push(value);
    stackWobble += value;
  }
  return { wobbles, stackWobble };
}

export function stackPatronBand(band: StackBand): PourBand {
  if (band === "still") return "nail";
  if (band === "wobbly") return "close";
  if (band === "soaked") return "flood";
  return "idle";
}

export function seedStackRound(date: string, hostId = "lab"): StackRoundSeed {
  const rng = mulberry32(hashSeed(`stack:${hostId}:${date}`));
  const patrons: PatronId[] = ["a", "b", "c"];
  return {
    date,
    carries: STACK_GLASS_COUNTS.map((glasses, index) => {
      const durationMs = 12000;
      const joltCount = index + 1;
      const jolts: StackJolt[] = [];
      for (let n = 0; n < joltCount; n += 1) {
        const window = durationMs - 2800;
        const atMs = 1400 + rng() * window;
        jolts.push({
          atMs,
          side: rng() < 0.5 ? -1 : 1,
          patronId: patrons[Math.floor(rng() * patrons.length)] ?? "a",
        });
      }
      jolts.sort((a, b) => a.atMs - b.atMs);
      return { glasses, durationMs, jolts };
    }),
  };
}

export function stackKick(rng = Math.random): StackBody {
  const side = rng() < 0.5 ? -1 : 1;
  return {
    theta: side * (0.012 + rng() * 0.016),
    omega: side * (0.01 + rng() * 0.018),
    x: 0,
    v: -side * (0.006 + rng() * 0.01),
  };
}

export const STACK_REST: StackBody = {
  theta: 0,
  omega: 0,
  x: 0,
  v: 0,
};

export function nextNudgeAt(fromMs: number, rng = Math.random, glasses = 3) {
  const tighten = Math.max(0, glasses - 3) * 320;
  return (
    fromMs +
    Math.max(1400, STACK.nudgeMinMs - tighten) +
    rng() * (STACK.nudgeMaxMs - STACK.nudgeMinMs)
  );
}

type StackDeriv = {
  dTheta: number;
  dOmega: number;
  dX: number;
  dV: number;
};

function addBody(body: StackBody, deriv: StackDeriv, dt: number): StackBody {
  return {
    theta: body.theta + deriv.dTheta * dt,
    omega: body.omega + deriv.dOmega * dt,
    x: body.x + deriv.dX * dt,
    v: body.v + deriv.dV * dt,
  };
}

/** Cart-pole: tray is the cart, stack is the inverted pole. */
function derivatives(
  body: StackBody,
  glasses: number,
  force: number,
  disturb: number,
): StackDeriv {
  const length = stackLength(glasses);
  const control = stackControlLength();
  const accel = (force - STACK.dampTray * body.v) / STACK.trayMass;
  const alpha =
    (STACK.g / length) * Math.sin(body.theta) -
    (accel / control) * Math.cos(body.theta) -
    STACK.dampOmega * body.omega +
    disturb;
  return {
    dTheta: body.omega,
    dOmega: alpha,
    dX: body.v,
    dV: accel,
  };
}

export function stepStack(
  body: StackBody,
  glasses: number,
  force: number,
  dt: number,
  disturb = 0,
): StackBody {
  const k1 = derivatives(body, glasses, force, disturb);
  const k2 = derivatives(addBody(body, k1, dt / 2), glasses, force, disturb);
  const k3 = derivatives(addBody(body, k2, dt / 2), glasses, force, disturb);
  const k4 = derivatives(addBody(body, k3, dt), glasses, force, disturb);
  const next = {
    theta:
      body.theta +
      (dt / 6) * (k1.dTheta + 2 * k2.dTheta + 2 * k3.dTheta + k4.dTheta),
    omega:
      body.omega +
      (dt / 6) * (k1.dOmega + 2 * k2.dOmega + 2 * k3.dOmega + k4.dOmega),
    x: body.x + (dt / 6) * (k1.dX + 2 * k2.dX + 2 * k3.dX + k4.dX),
    v: body.v + (dt / 6) * (k1.dV + 2 * k2.dV + 2 * k3.dV + k4.dV),
  };
  if (Math.abs(next.v) > STACK.maxV) {
    next.v = Math.sign(next.v) * STACK.maxV;
  }
  if (Math.abs(next.x) > STACK.maxX) {
    next.x = Math.sign(next.x) * STACK.maxX;
    next.v *= 0.72;
  }
  return next;
}
