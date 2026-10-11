import { describe, expect, it } from "vitest";
import {
  type EngineEvent,
  type EngineState,
  initialState,
  isYouTubeTvUrl,
  reduce,
  toStateMessage,
} from "../src/engine";

const YTTV = "https://tv.youtube.com/watch/abc";
const OTHER = "https://www.espn.com/";

const opened = (tabId: number, title = `Game ${tabId}`): EngineEvent => ({
  type: "tabUpdated",
  tab: { tabId, url: YTTV, title },
});

/** Applies events in order and returns the final result. */
function run(events: EngineEvent[], state: EngineState = initialState) {
  let result = { state, effects: [] as { tabId: number; muted: boolean }[], changed: false };
  for (const e of events) result = reduce(result.state, e);
  return result;
}

describe("isYouTubeTvUrl", () => {
  it("matches only https://tv.youtube.com", () => {
    expect(isYouTubeTvUrl(YTTV)).toBe(true);
    expect(isYouTubeTvUrl("https://www.youtube.com/watch?v=x")).toBe(false);
    expect(isYouTubeTvUrl("https://tv.youtube.com.evil.example/")).toBe(false);
    expect(isYouTubeTvUrl("http://tv.youtube.com/")).toBe(false);
    expect(isYouTubeTvUrl(undefined)).toBe(false);
    expect(isYouTubeTvUrl("not a url")).toBe(false);
  });
});

describe("engine", () => {
  it("new YouTube TV tabs start muted and get slots in open order", () => {
    const first = reduce(initialState, opened(10));
    expect(first.effects).toEqual([{ tabId: 10, muted: true }]);
    expect(first.changed).toBe(true);

    const { state } = run([opened(10), opened(20)]);
    expect(state.tabs.map((t) => [t.slot, t.tabId])).toEqual([
      [1, 10],
      [2, 20],
    ]);
    expect(state.heardTabId).toBeNull();
  });

  it("ignores non-YouTube-TV tabs", () => {
    const result = reduce(initialState, { type: "tabUpdated", tab: { tabId: 1, url: OTHER } });
    expect(result).toEqual({ state: initialState, effects: [], changed: false });
  });

  it("ignores a new tab whose URL is not known yet", () => {
    const result = reduce(initialState, {
      type: "tabUpdated",
      tab: { tabId: 1, title: "New Tab" },
    });
    expect(result.changed).toBe(false);
  });

  it("solo unmutes the chosen tab and mutes all others", () => {
    const { state, effects } = run([opened(10), opened(20), opened(30), { type: "solo", slot: 2 }]);
    expect(state.heardTabId).toBe(20);
    expect(effects).toEqual([
      { tabId: 10, muted: true },
      { tabId: 20, muted: false },
      { tabId: 30, muted: true },
    ]);
  });

  it("solo on an empty slot does nothing", () => {
    const before = run([opened(10)]).state;
    expect(reduce(before, { type: "solo", slot: 5 })).toEqual({
      state: before,
      effects: [],
      changed: false,
    });
  });

  it("closing the heard tab leaves everything muted and frees its slot", () => {
    const { state, effects } = run([
      opened(10),
      opened(20),
      { type: "solo", slot: 1 },
      { type: "tabRemoved", tabId: 10 },
    ]);
    expect(effects).toEqual([]);
    expect(state.heardTabId).toBeNull();
    expect(state.lastHeardTabId).toBeNull();
    expect(state.tabs.map((t) => [t.slot, t.tabId])).toEqual([[2, 20]]);
  });

  it("keeps slots stable and refills the lowest free slot", () => {
    const { state } = run([
      opened(10),
      opened(20),
      opened(30),
      { type: "tabRemoved", tabId: 20 },
      opened(40),
    ]);
    expect(state.tabs.map((t) => [t.slot, t.tabId])).toEqual([
      [1, 10],
      [2, 40],
      [3, 30],
    ]);
  });

  it("mute all mutes everything, and pressing again restores the last heard tab", () => {
    const heard = run([opened(10), opened(20), { type: "solo", slot: 2 }]).state;

    const muted = reduce(heard, { type: "toggleMuteAll" });
    expect(muted.state.heardTabId).toBeNull();
    expect(muted.state.lastHeardTabId).toBe(20);
    expect(muted.effects).toEqual([
      { tabId: 10, muted: true },
      { tabId: 20, muted: true },
    ]);
    expect(toStateMessage(muted.state).allMuted).toBe(true);

    const restored = reduce(muted.state, { type: "toggleMuteAll" });
    expect(restored.state.heardTabId).toBe(20);
    expect(restored.effects).toEqual([
      { tabId: 10, muted: true },
      { tabId: 20, muted: false },
    ]);
  });

  it("mute all with nothing to restore does nothing", () => {
    const state = run([opened(10)]).state;
    expect(reduce(state, { type: "toggleMuteAll" }).changed).toBe(false);
  });

  it("mute all does not restore a tab that has since closed", () => {
    const { state, effects } = run([
      opened(10),
      opened(20),
      { type: "solo", slot: 1 },
      { type: "toggleMuteAll" },
      { type: "tabRemoved", tabId: 10 },
      { type: "toggleMuteAll" },
    ]);
    expect(state.heardTabId).toBeNull();
    expect(effects).toEqual([]);
  });

  it("navigating a tab away from tv.youtube.com frees its slot and unmutes it", () => {
    const { state, effects } = run([
      opened(10),
      { type: "solo", slot: 1 },
      { type: "tabUpdated", tab: { tabId: 10, url: OTHER } },
    ]);
    expect(state.tabs).toEqual([]);
    expect(state.heardTabId).toBeNull();
    expect(effects).toEqual([{ tabId: 10, muted: false }]);
  });

  it("updates titles without changing mute state", () => {
    const { state, effects, changed } = run([
      opened(10, "YouTube TV"),
      { type: "tabUpdated", tab: { tabId: 10, title: "Chiefs at Bills - YouTube TV" } },
    ]);
    expect(state.tabs[0]?.title).toBe("Chiefs at Bills - YouTube TV");
    expect(effects).toEqual([]);
    expect(changed).toBe(true);
  });

  it("leaves a 16th YouTube TV tab untracked", () => {
    const events = Array.from({ length: 16 }, (_, i) => opened(i + 1));
    const { state, effects, changed } = run(events);
    expect(state.tabs).toHaveLength(15);
    expect(changed).toBe(false);
    expect(effects).toEqual([]);
  });

  describe("sync", () => {
    it("tracks existing YouTube TV tabs in tab-id order and mutes them", () => {
      const { state, effects } = reduce(initialState, {
        type: "sync",
        tabs: [
          { tabId: 30, url: YTTV, title: "C" },
          { tabId: 5, url: OTHER, title: "ESPN" },
          { tabId: 20, url: YTTV, title: "B" },
        ],
      });
      expect(state.tabs.map((t) => [t.slot, t.tabId])).toEqual([
        [1, 20],
        [2, 30],
      ]);
      expect(effects).toEqual([
        { tabId: 20, muted: true },
        { tabId: 30, muted: true },
      ]);
    });

    it("keeps saved slots and the heard tab across a service-worker restart", () => {
      const saved = run([opened(10), opened(20), { type: "solo", slot: 2 }]).state;
      const { state, effects } = reduce(saved, {
        type: "sync",
        tabs: [
          { tabId: 10, url: YTTV, title: "A" },
          { tabId: 20, url: YTTV, title: "B" },
        ],
      });
      expect(state.tabs.map((t) => [t.slot, t.tabId, t.title])).toEqual([
        [1, 10, "A"],
        [2, 20, "B"],
      ]);
      expect(state.heardTabId).toBe(20);
      expect(effects).toEqual([
        { tabId: 10, muted: true },
        { tabId: 20, muted: false },
      ]);
    });

    it("drops tabs that closed or left YouTube TV while asleep", () => {
      const saved = run([opened(10), opened(20), opened(30), { type: "solo", slot: 1 }]).state;
      const { state, effects } = reduce(saved, {
        type: "sync",
        tabs: [
          { tabId: 20, url: OTHER },
          { tabId: 30, url: YTTV },
        ],
      });
      expect(state.tabs.map((t) => [t.slot, t.tabId])).toEqual([[3, 30]]);
      expect(state.heardTabId).toBeNull();
      expect(effects).toEqual([
        { tabId: 20, muted: false },
        { tabId: 30, muted: true },
      ]);
    });
  });

  describe("toStateMessage", () => {
    it("reports games by slot with the heard flag", () => {
      const { state } = run([opened(10, "A"), opened(20, "B"), { type: "solo", slot: 1 }]);
      expect(toStateMessage(state)).toEqual({
        type: "state",
        games: [
          { slot: 1, tabId: 10, title: "A", heard: true },
          { slot: 2, tabId: 20, title: "B", heard: false },
        ],
        allMuted: false,
        lastHeardTabId: 10,
      });
    });

    it("omits lastHeardTabId when there is none", () => {
      expect(toStateMessage(initialState)).toEqual({ type: "state", games: [], allMuted: true });
    });
  });
});
