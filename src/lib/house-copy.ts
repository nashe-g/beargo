import type { PlayKind } from "@/lib/play-kind";

export type HouseSlot = "lead" | "second" | "result";

export type HouseLine = {
  id: string;
  kind: PlayKind;
  body: string;
};

export type HouseDarePick = {
  slot: HouseSlot;
  playKind: PlayKind;
  lineId: string;
  body: string;
};

const WOBBLE_LINES: HouseLine[] = [
  {
    id: "wobble-1",
    kind: "stack",
    body: "Make the least coordinated person at your table play this.",
  },
  {
    id: "wobble-2",
    kind: "stack",
    body: "Are you the least coordinated in the room today? Let’s find out.",
  },
  {
    id: "wobble-3",
    kind: "stack",
    body: "Pass the phone to whoever’s already spilled something.",
  },
  {
    id: "wobble-4",
    kind: "stack",
    body: "One of you is going to drop it. Nominate them.",
  },
  {
    id: "wobble-5",
    kind: "stack",
    body: "The tray doesn’t care about your confidence.",
  },
  {
    id: "wobble-6",
    kind: "stack",
    body: "Hands you trust with a full pint. Prove it.",
  },
  {
    id: "wobble-7",
    kind: "stack",
    body: "If you can walk a straight line, this will humble you.",
  },
  {
    id: "wobble-8",
    kind: "stack",
    body: "Whoever said “I got it” plays. You know who.",
  },
];

const TRIVIA_LINES: HouseLine[] = [
  {
    id: "trivia-1",
    kind: "trivia",
    body: "Are you the smartest person here, or just the loudest? Let’s score it.",
  },
  {
    id: "trivia-2",
    kind: "trivia",
    body: "Three. The loser buys. No debate after.",
  },
  {
    id: "trivia-3",
    kind: "trivia",
    body: "If you can answer these correctly, you can stay.",
  },
  {
    id: "trivia-4",
    kind: "trivia",
    body: "The House has questions. Your bartender is not going to help you.",
  },
  {
    id: "trivia-5",
    kind: "trivia",
    body: "Winner talks. Loser still talks, but quieter.",
  },
  {
    id: "trivia-6",
    kind: "trivia",
    body: "You don’t need the whole room. You need one rival.",
  },
  {
    id: "trivia-7",
    kind: "trivia",
    body: "If you’ve been here more than twice, you don’t get to skip this.",
  },
  {
    id: "trivia-8",
    kind: "trivia",
    body: "You talked like you knew. Three questions.",
  },
  {
    id: "trivia-9",
    kind: "trivia",
    body: "Know-it-all goes first.",
  },
  {
    id: "trivia-10",
    kind: "trivia",
    body: "One of you is bluffing.",
  },
  {
    id: "trivia-11",
    kind: "trivia",
    body: "If you’re going to argue, score it.",
  },
  {
    id: "trivia-12",
    kind: "trivia",
    body: "Pick a rival. Not a teammate.",
  },
  {
    id: "trivia-13",
    kind: "trivia",
    body: "The quiet one usually wins. Check.",
  },
  {
    id: "trivia-14",
    kind: "trivia",
    body: "Don’t look it up.",
  },
  {
    id: "trivia-15",
    kind: "trivia",
    body: "First wrong answer buys.",
  },
  {
    id: "trivia-16",
    kind: "trivia",
    body: "Someone at this table is sure they’re right. Three questions.",
  },
];

const HOUSE_LINES = [...WOBBLE_LINES, ...TRIVIA_LINES];

/** One full spill on a carry is 12 wobble. Treat that or worse as a drop. */
const TRAY_DROP_TENTHS = 120;

export function houseLinesFor(kind: PlayKind) {
  return HOUSE_LINES.filter((line) => line.kind === kind);
}

export function fillHouseLine(body: string, venue: string) {
  if (body.startsWith("The House has questions.")) {
    const name = venue.trim();
    if (name) return `${name} has questions. Your bartender is not going to help you.`;
  }
  return body;
}

export function otherPlayKind(kind: PlayKind): PlayKind {
  return kind === "stack" ? "trivia" : "stack";
}

export function pickHouseDare(input: {
  slot: "lead" | "second";
  lastLeadKind: PlayKind | null;
  usedLineIds: readonly string[];
  venue: string;
}): HouseDarePick {
  const playKind =
    input.slot === "second"
      ? otherPlayKind(input.lastLeadKind === "trivia" ? "trivia" : "stack")
      : input.lastLeadKind === "stack"
        ? "trivia"
        : "stack";
  const used = new Set(input.usedLineIds);
  const lines = houseLinesFor(playKind);
  const fresh = lines.find((line) => !used.has(line.id)) ?? lines[0]!;
  return {
    slot: input.slot,
    playKind,
    lineId: fresh.id,
    body: fillHouseLine(fresh.body, input.venue),
  };
}

export function trayDropped(stackWobbleTenths: number) {
  return stackWobbleTenths >= TRAY_DROP_TENTHS;
}

export function houseResultBody(input: {
  handle: string;
  kind: PlayKind;
  stackWobble: number;
  correctCount: number;
}) {
  const name = input.handle.trim() || "Someone";
  if (input.kind === "stack") {
    if (trayDropped(input.stackWobble)) {
      return `${name} tried to carry the tray. Dropped the drinks. Your turn.`;
    }
    return `${name} carried the tray without dropping it. Beat that.`;
  }
  if (input.correctCount >= 3) {
    return `${name} got all three questions right. Beat that.`;
  }
  if (input.correctCount <= 0) {
    return `${name} missed. Three questions, none right. Your turn.`;
  }
  const missed = 3 - input.correctCount;
  return `${name} missed ${missed} of the three questions. Your turn.`;
}
