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
  g: 9.81,
  trayMass: 1.05,
  length: 0.78,
  taller: 0.04,
  dampOmega: 1.35,
  dampTray: 2.1,
  tapImpulse: 0.58,
  holdForce: 3.6,
  tapForce: 4.2,
  tapDecay: 3.4,
  joltV: 0.2,
  wander: 0.16,
  nudge: 0.1,
  nudgeMinMs: 2200,
  nudgeMaxMs: 4000,
  maxX: 0.2,
  maxV: 1.35,
  still: 0.1,
  telegraphMs: 920,
} as const;

export type StackBody = {
  theta: number;
  omega: number;
  x: number;
  v: number;
};

export function stackLength(glasses: number) {
  return STACK.length - STACK.taller * Math.max(0, glasses - 3);
}

export function stackTopple(glasses: number) {
  return 0.5 - 0.045 * Math.max(0, glasses - 3);
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
      const durationMs = 12000 + index * 1000;
      const joltCount = index === 0 ? 1 : 2;
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
    theta: side * (0.02 + rng() * 0.03),
    omega: side * (0.02 + rng() * 0.04),
    x: 0,
    v: -side * (0.01 + rng() * 0.02),
  };
}

export const STACK_REST: StackBody = {
  theta: 0,
  omega: 0,
  x: 0,
  v: 0,
};

export function nextNudgeAt(fromMs: number, rng = Math.random) {
  return (
    fromMs +
    STACK.nudgeMinMs +
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
  const accel = (force - STACK.dampTray * body.v) / STACK.trayMass;
  const alpha =
    (STACK.g / length) * Math.sin(body.theta) -
    (accel / length) * Math.cos(body.theta) -
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
    next.v *= 0.35;
  }
  return next;
}
