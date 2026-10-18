import { readFileSync } from "node:fs";
import type { Game } from "@rotho/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type Feed, feedUrl } from "../src/scores/feeds";
import { IDLE_INTERVAL_MS, LIVE_INTERVAL_MS, ScoreTracker } from "../src/scores/tracker";

type Scoreboard = {
  events: { id: string; competitions: { competitors: { score: string }[] }[] }[];
};

const fixture = (name: string): Scoreboard =>
  JSON.parse(readFileSync(new URL(`./fixtures/espn/${name}.json`, import.meta.url), "utf8"));

const url = (feed: Omit<Feed, "sport">) => feedUrl({ ...feed, sport: "football" });
const NFL = url({ path: "football/nfl" });
const CFB = url({ path: "football/college-football", query: "groups=80" });
const MCBB = url({ path: "basketball/mens-college-basketball", query: "groups=50" });
const WCBB = url({ path: "basketball/womens-college-basketball", query: "groups=50" });

const game = (slot: number, title: string): Game => ({ slot, tabId: slot, title, heard: false });
const AUB_UGA = "Auburn Tigers at Georgia Bulldogs";

/** Answers each URL from `responses`: a scoreboard, an Error to throw, or a status to fail with. */
function fakeFetch(responses: Record<string, Scoreboard | Error | number>) {
  const calls: string[] = [];
  const fn = vi.fn(async (input: string | URL | Request) => {
    const href = String(input);
    calls.push(href);
    const r = responses[href] ?? { events: [] };
    if (r instanceof Error) throw r;
    if (typeof r === "number") return new Response("", { status: r });
    return new Response(JSON.stringify(r), { status: 200 });
  });
  return { fetch: fn as unknown as typeof fetch, calls, responses };
}

/** Sets the home score (Georgia) of the live Auburn at Georgia event. */
function setGeorgiaScore(board: Scoreboard, score: number) {
  const event = board.events.find((e) => e.id === "401856719")!;
  event.competitions[0]!.competitors[0]!.score = String(score);
}

let tracker: ScoreTracker | undefined;
const logger = { info: vi.fn() };

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-10-17T20:00:00Z") });
  logger.info.mockClear();
});

afterEach(() => {
  tracker?.stop();
  vi.useRealTimers();
});

function start(responses: Record<string, Scoreboard | Error | number>, games: Game[]) {
  const fake = fakeFetch(responses);
  tracker = new ScoreTracker({ fetch: fake.fetch, logger, timeZone: "America/New_York" });
  tracker.setGames(games);
  return { ...fake, tracker };
}

describe("ScoreTracker", () => {
  it("searches every candidate feed, then polls only the matched one every 7 s while live", async () => {
    const { calls, tracker } = start({ [CFB]: fixture("college-football") }, [game(1, AUB_UGA)]);
    await vi.advanceTimersByTimeAsync(0);
    expect(calls.sort()).toEqual([MCBB, WCBB, CFB].sort());
    expect(tracker.scoreFor(1, 0)).toEqual({
      eventId: "401856719",
      state: "in",
      status: "Q2 1:30",
      scores: [14, 14],
      possession: 0,
    });
    expect(logger.info).toHaveBeenCalledWith(
      "Scores: slot 1 is ESPN event 401856719 in football/college-football?groups=80",
    );

    calls.length = 0;
    await vi.advanceTimersByTimeAsync(LIVE_INTERVAL_MS - 1);
    expect(calls).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toEqual([CFB]);
  });

  it("polls every 5 minutes before kickoff, then every 7 s once kickoff time passes", async () => {
    // Buffalo at Las Vegas kicks off at 20:25Z on the 18th.
    vi.setSystemTime(new Date("2026-10-18T20:20:00Z"));
    const { calls, tracker } = start({ [NFL]: fixture("nfl") }, [
      game(2, "Buffalo Bills at Las Vegas Raiders"),
    ]);
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toEqual([NFL]);
    expect(tracker.scoreFor(2, 0)?.status).toBe("4:25P");

    await vi.advanceTimersByTimeAsync(LIVE_INTERVAL_MS);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(IDLE_INTERVAL_MS - LIVE_INTERVAL_MS);
    expect(calls).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(LIVE_INTERVAL_MS);
    expect(calls).toHaveLength(3);
  });

  it("polls unmatched games every 5 minutes", async () => {
    const { calls, tracker } = start({}, [game(1, AUB_UGA)]);
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toHaveLength(3);
    expect(tracker.scoreFor(1, 0)).toBeUndefined();
    await vi.advanceTimersByTimeAsync(IDLE_INTERVAL_MS - 1);
    expect(calls).toHaveLength(3);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(6);
  });

  it("never polls for games without two known teams, and stops when the games go", async () => {
    const { calls, tracker } = start({ [CFB]: fixture("college-football") }, [
      game(1, "College Basketball: Gonzaga at Saint Mary's"),
      game(2, "NFL GameDay Live"),
    ]);
    await vi.advanceTimersByTimeAsync(IDLE_INTERVAL_MS);
    expect(calls).toEqual([]);

    tracker.setGames([game(1, AUB_UGA)]);
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toHaveLength(3);
    tracker.setGames([]);
    await vi.advanceTimersByTimeAsync(IDLE_INTERVAL_MS * 2);
    expect(calls).toHaveLength(3);
    expect(tracker.scoreFor(1, 0)).toBeUndefined();
  });

  it("shows the newest snapshot at least `delay` old, or the oldest one", async () => {
    const board = fixture("college-football");
    const { tracker } = start({ [CFB]: board }, [game(1, AUB_UGA)]);
    await vi.advanceTimersByTimeAsync(0); // t0: 14-14

    setGeorgiaScore(board, 21);
    await vi.advanceTimersByTimeAsync(LIVE_INTERVAL_MS); // t0 + 7 s: 14-21
    expect(tracker.scoreFor(1, 0)?.scores).toEqual([14, 21]);
    expect(tracker.scoreFor(1, 7_000)?.scores).toEqual([14, 14]);
    // Nothing is 30 s old yet, so the oldest snapshot shows.
    expect(tracker.scoreFor(1, 30_000)?.scores).toEqual([14, 14]);

    await vi.advanceTimersByTimeAsync(30_000); // t0 + 37 s
    expect(tracker.scoreFor(1, 30_000)?.scores).toEqual([14, 21]);
    expect(tracker.scoreFor(1, 90_000)?.scores).toEqual([14, 14]);
  });

  it("notifies listeners only when a snapshot changes", async () => {
    const board = fixture("college-football");
    const { tracker } = start({ [CFB]: board }, [game(1, AUB_UGA)]);
    const listener = vi.fn();
    tracker.subscribe(listener);
    await vi.advanceTimersByTimeAsync(0);
    expect(listener).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(LIVE_INTERVAL_MS);
    expect(listener).toHaveBeenCalledTimes(1);
    setGeorgiaScore(board, 17);
    await vi.advanceTimersByTimeAsync(LIVE_INTERVAL_MS);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("logs failures, keeps polling, and drops scores once the feed is 2 minutes stale", async () => {
    const { responses, tracker } = start({ [CFB]: fixture("college-football") }, [
      game(1, AUB_UGA),
    ]);
    await vi.advanceTimersByTimeAsync(0);
    responses[CFB] = new Error("network down");
    await vi.advanceTimersByTimeAsync(LIVE_INTERVAL_MS);
    expect(logger.info).toHaveBeenCalledWith(
      "Scores: football/college-football?groups=80 failed: network down",
    );
    expect(tracker.scoreFor(1, 0)).toBeDefined();

    responses[CFB] = 503;
    await vi.advanceTimersByTimeAsync(LIVE_INTERVAL_MS);
    expect(logger.info).toHaveBeenCalledWith(
      "Scores: football/college-football?groups=80 failed: HTTP 503",
    );
    await vi.advanceTimersByTimeAsync(120_000 - 2 * LIVE_INTERVAL_MS);
    expect(tracker.scoreFor(1, 0)).toBeDefined(); // exactly 2 minutes
    await vi.advanceTimersByTimeAsync(LIVE_INTERVAL_MS);
    expect(tracker.scoreFor(1, 0)).toBeUndefined();

    responses[CFB] = fixture("college-football");
    await vi.advanceTimersByTimeAsync(LIVE_INTERVAL_MS);
    expect(tracker.scoreFor(1, 0)?.scores).toEqual([14, 14]);
  });

  it("starts a slot over when its title changes", async () => {
    const { tracker } = start({ [CFB]: fixture("college-football"), [NFL]: fixture("nfl") }, [
      game(1, AUB_UGA),
    ]);
    await vi.advanceTimersByTimeAsync(0);
    expect(tracker.scoreFor(1, 0)?.eventId).toBe("401856719");
    tracker.setGames([game(1, "Missouri at Ole Miss")]);
    expect(tracker.scoreFor(1, 0)).toBeUndefined();
    await vi.advanceTimersByTimeAsync(0);
    expect(tracker.scoreFor(1, 0)?.eventId).toBe("401856721");
  });
});
