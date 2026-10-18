import { describe, expect, it } from "vitest";
import {
  alertFrame,
  CALLOUT_MS,
  FRAME_MS,
  type KeyScoreState,
  nextScoreState,
  ROW_FRAMES,
} from "../src/score-alerts";
import type { ScoreSnapshot } from "../src/scores/tracker";

const snap = (scores: [number, number], eventId = "e1"): ScoreSnapshot => ({
  eventId,
  state: "in",
  status: "Q4 2:08",
  scores,
});

describe("nextScoreState", () => {
  it("starts without an alert on the first snapshot", () => {
    expect(nextScoreState(undefined, snap([17, 20]), 0, true)).toEqual({
      eventId: "e1",
      scores: [17, 20],
    });
  });

  it("alerts for the team whose score went up", () => {
    const prev = nextScoreState(undefined, snap([17, 17]), 0, true);
    expect(nextScoreState(prev, snap([17, 20]), 1000, true)?.alert).toEqual({
      team: 1,
      points: 3,
      startedAt: 1000,
    });
    expect(nextScoreState(prev, snap([24, 17]), 1000, true)?.alert).toEqual({
      team: 0,
      points: 7,
      startedAt: 1000,
    });
  });

  it("picks the bigger gain when both scores went up between snapshots", () => {
    const prev = nextScoreState(undefined, snap([10, 10]), 0, true);
    expect(nextScoreState(prev, snap([11, 13]), 1000, true)?.alert?.team).toBe(1);
    expect(nextScoreState(prev, snap([12, 12]), 1000, true)?.alert?.team).toBe(0);
  });

  it("doesn't alert on a correction, another game, or with alerts off", () => {
    const prev = nextScoreState(undefined, snap([17, 20]), 0, true);
    expect(nextScoreState(prev, snap([17, 17]), 1000, true)?.alert).toBeUndefined();
    expect(nextScoreState(prev, snap([24, 20], "e2"), 1000, true)?.alert).toBeUndefined();
    expect(nextScoreState(prev, snap([24, 20]), 1000, false)?.alert).toBeUndefined();
  });

  it("keeps a running alert, restarts it on a new score, and drops it when done", () => {
    const first = nextScoreState(undefined, snap([0, 0]), 0, true);
    const scored = nextScoreState(first, snap([0, 3]), 1000, true);
    const later = nextScoreState(scored, snap([0, 3]), 5000, true);
    expect(later?.alert).toEqual({ team: 1, points: 3, startedAt: 1000 });

    const again = nextScoreState(later, snap([7, 3]), 6000, true);
    expect(again?.alert).toEqual({ team: 0, points: 7, startedAt: 6000 });

    const done = 6000 + ROW_FRAMES * FRAME_MS + CALLOUT_MS;
    expect(nextScoreState(again, snap([7, 3]), done, true)?.alert).toBeUndefined();
    expect(nextScoreState(again, snap([7, 3]), 7000, false)?.alert).toBeUndefined();
  });

  it("forgets everything without a snapshot, so a returning score doesn't alert", () => {
    const prev = nextScoreState(undefined, snap([17, 17]), 0, true);
    expect(nextScoreState(prev, undefined, 1000, true)).toBeUndefined();
    expect(nextScoreState(undefined, snap([17, 20]), 2000, true)?.alert).toBeUndefined();
  });
});

describe("alertFrame", () => {
  const state: KeyScoreState = {
    eventId: "e1",
    scores: [17, 20],
    alert: { team: 1, points: 3, startedAt: 10_000 },
  };

  it("blinks fast for about 10 seconds", () => {
    expect(FRAME_MS).toBe(150);
    expect(ROW_FRAMES).toBe(68);
    expect(ROW_FRAMES * FRAME_MS).toBe(10_200);
  });

  it("blinks the row, then holds the band callout, then ends", () => {
    const frames = Array.from({ length: ROW_FRAMES }, (_, i) =>
      alertFrame(state, 10_000 + i * FRAME_MS),
    );
    expect(frames.map((f) => [f?.mode, f?.on])).toEqual(
      Array.from({ length: ROW_FRAMES }, (_, i) => ["row", i % 2 === 0]),
    );
    // Mid-frame times land on the same frame.
    expect(alertFrame(state, 10_000 + FRAME_MS - 1)?.on).toBe(true);
    const bandStart = 10_000 + ROW_FRAMES * FRAME_MS;
    expect(alertFrame(state, bandStart - 1)).toMatchObject({ mode: "row", on: false });
    expect(alertFrame(state, bandStart)).toEqual({ team: 1, points: 3, mode: "band", on: true });
    expect(alertFrame(state, bandStart + CALLOUT_MS - 1)?.mode).toBe("band");
    expect(alertFrame(state, bandStart + CALLOUT_MS)).toBeUndefined();
  });

  it("draws nothing without an alert", () => {
    expect(alertFrame(undefined, 0)).toBeUndefined();
    expect(alertFrame({ eventId: "e1", scores: [0, 0] }, 0)).toBeUndefined();
  });
});
