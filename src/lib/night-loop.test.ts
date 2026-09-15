import assert from "node:assert/strict";
import { test } from "node:test";
import { NIGHT_SLATE_SIZE } from "./questions";
import { chunkNightPacks, isFullNightSlate } from "./question-packs";
import {
  horizonReadyCount,
  nextEmptyDates,
  type DaySlate,
} from "./question-slate-store";
import {
  SKIP_WOBBLE_TENTHS,
  combinedNightScore,
} from "./table-night";
import { computeTableSpread } from "./table-spread";
import {
  MISS_MS,
  compareTableScores,
  effectiveMs,
  scorePerson,
  scoreTable,
  type TableScore,
} from "./table-test";

test("effectiveMs: wrong is always 20 seconds", () => {
  assert.equal(effectiveMs(false, 412), MISS_MS);
  assert.equal(effectiveMs(false, 0), MISS_MS);
  assert.equal(effectiveMs(false, 80_000), MISS_MS);
});

test("effectiveMs: right is the real time", () => {
  assert.equal(effectiveMs(true, 1234), 1234);
  assert.equal(effectiveMs(true, 0), 0);
  assert.equal(effectiveMs(true, Number.NaN), 0);
  assert.equal(effectiveMs(true, -8), 0);
});

test("scorePerson: wrong is 20s and not counted correct", () => {
  const score = scorePerson(
    [
      { id: "q1", correctId: "a" },
      { id: "q2", correctId: "b" },
    ],
    [
      { questionId: "q1", choiceId: "a", responseMs: 1400 },
      { questionId: "q2", choiceId: "c", responseMs: 200 },
    ],
  );
  assert.equal(score.correctCount, 1);
  assert.equal(score.asked, 2);
  assert.equal(score.averageMs, (1400 + MISS_MS) / 2);
});

test("scoreTable: ranks by correct rate, then mean of members’ averages", () => {
  const slowerButRighter: TableScore = scoreTable([
    { correctCount: 2, asked: 3, averageMs: 8_000 },
    { correctCount: 2, asked: 3, averageMs: 9_000 },
  ]);
  const fasterButWronger: TableScore = scoreTable([
    { correctCount: 1, asked: 3, averageMs: 400 },
    { correctCount: 1, asked: 3, averageMs: 500 },
  ]);
  assert.ok(slowerButRighter.correctRate > fasterButWronger.correctRate);
  assert.ok(compareTableScores(slowerButRighter, fasterButWronger) < 0);

  const sameRateFaster = scoreTable([
    { correctCount: 2, asked: 3, averageMs: 1_000 },
  ]);
  const sameRateSlower = scoreTable([
    { correctCount: 2, asked: 3, averageMs: 4_000 },
  ]);
  assert.equal(sameRateFaster.correctRate, sameRateSlower.correctRate);
  assert.ok(compareTableScores(sameRateFaster, sameRateSlower) < 0);
});

test("combinedNightScore: closed formula, skip uses SKIP_WOBBLE_TENTHS", () => {
  const round1: TableScore = {
    correctCount: 10,
    asked: 20,
    correctRate: 0.5,
    averageMs: 4_000,
  };
  assert.equal(combinedNightScore(round1, 12), 541.2);
  assert.equal(
    combinedNightScore(round1, SKIP_WOBBLE_TENTHS),
    (1 - 0.5) * 1000 + 4_000 / 100 + SKIP_WOBBLE_TENTHS / 10,
  );
  assert.equal(SKIP_WOBBLE_TENTHS, 1_200);
});

test("isFullNightSlate: GO needs 21", () => {
  assert.equal(NIGHT_SLATE_SIZE, 21);
  assert.equal(isFullNightSlate(Array.from({ length: 21 }, () => ({}) as never)), true);
  assert.equal(isFullNightSlate(Array.from({ length: 3 }, () => ({}) as never)), false);
  assert.equal(isFullNightSlate([]), false);
});

test("computeTableSpread: follow-on is another device at the same host", () => {
  const t0 = new Date("2026-09-15T02:00:00.000Z");
  const plus3m = new Date(t0.getTime() + 3 * 60_000);
  const plus8m = new Date(t0.getTime() + 8 * 60_000);
  const stats = computeTableSpread([
    {
      hostId: "rustic",
      deviceKey: "a",
      gameStartedAt: new Date(t0.getTime() - 60_000),
      gameCompletedAt: t0,
    },
    {
      hostId: "rustic",
      deviceKey: "b",
      gameStartedAt: plus3m,
      gameCompletedAt: null,
    },
    {
      hostId: "other",
      deviceKey: "c",
      gameStartedAt: plus3m,
      gameCompletedAt: null,
    },
    {
      hostId: "rustic",
      deviceKey: "a",
      gameStartedAt: plus8m,
      gameCompletedAt: null,
    },
  ]);
  assert.equal(stats.starts, 4);
  assert.equal(stats.followOn2m, 0);
  assert.equal(stats.followOn5m, 1);
  assert.equal(stats.followOn10m, 1);
  assert.equal(stats.spread5m, 1 / 3);
  assert.equal(computeTableSpread([]).spread5m, null);
});

function slate(partial: Partial<DaySlate> & Pick<DaySlate, "localDate">): DaySlate {
  return {
    label: partial.localDate,
    status: "empty",
    questions: [],
    ...partial,
  };
}

test("nextEmptyDates skips full 21-question nights, including old published 3", () => {
  const twentyOne = Array.from({ length: 21 }, () => ({}) as never);
  const three = Array.from({ length: 3 }, () => ({}) as never);
  const dates = nextEmptyDates(
    [
      slate({ localDate: "2026-09-15", status: "published", questions: three }),
      slate({ localDate: "2026-09-16", status: "published", questions: twentyOne }),
      slate({ localDate: "2026-09-17", status: "empty" }),
      slate({ localDate: "2026-09-18", status: "draft", questions: twentyOne }),
      slate({ localDate: "2026-09-19", status: "empty" }),
    ],
    2,
  );
  assert.deepEqual(dates, ["2026-09-15", "2026-09-17"]);
});

test("horizonReadyCount only counts published 21", () => {
  const twentyOne = Array.from({ length: 21 }, () => ({}) as never);
  const three = Array.from({ length: 3 }, () => ({}) as never);
  assert.equal(
    horizonReadyCount([
      slate({ localDate: "a", status: "published", questions: three }),
      slate({ localDate: "b", status: "published", questions: twentyOne }),
      slate({ localDate: "c", status: "draft", questions: twentyOne }),
    ]),
    1,
  );
  assert.equal(chunkNightPacks(twentyOne).length, 7);
});
