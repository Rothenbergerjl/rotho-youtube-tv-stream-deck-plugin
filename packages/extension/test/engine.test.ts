import { describe, expect, it } from "vitest";
import {
  enabledServicesFrom,
  type EngineEvent,
  type EngineState,
  initialState,
  reduce,
  restoreState,
  tabTitleFor,
  toStateMessage,
} from "../src/engine";

const YTTV = "https://tv.youtube.com/watch/abc";
const OTHER = "https://www.espn.com/";
const PEACOCK = "https://www.peacocktv.com/watch/playback/event/abc";
const PEACOCK_HOME = "https://www.peacocktv.com/watch/home";
const PPLUS_LIVE = "https://www.paramountplus.com/live-tv/stream/cbs-sports-golazo";
const PPLUS_VOD = "https://www.paramountplus.com/shows/video/abc/";

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

const openedAt = (tabId: number, url: string, title = `Game ${tabId}`): EngineEvent => ({
  type: "tabUpdated",
  tab: { tabId, url, title },
});

const slots = (state: EngineState) => state.tabs.map((t) => [t.slot, t.tabId, t.service]);

describe("enabledServicesFrom", () => {
  it("defaults to YouTube TV and Peacock when nothing is saved", () => {
    expect(enabledServicesFrom(undefined)).toEqual(["youtubeTv", "peacock"]);
    expect(enabledServicesFrom("peacock")).toEqual(["youtubeTv", "peacock"]);
  });

  it("always keeps YouTube TV, drops unknown ids, and sorts", () => {
    expect(enabledServicesFrom([])).toEqual(["youtubeTv"]);
    expect(enabledServicesFrom(["paramountPlus", "espn", "peacock", "peacock"])).toEqual([
      "youtubeTv",
      "peacock",
      "paramountPlus",
    ]);
  });
});

describe("restoreState", () => {
  it("returns the initial state when nothing was saved", () => {
    expect(restoreState(undefined)).toEqual(initialState);
  });

  it("fills in a save from before services existed", () => {
    expect(
      restoreState({
        tabs: [{ tabId: 10, slot: 1, title: "A" }],
        heardTabId: 10,
        lastHeardTabId: 10,
      }),
    ).toEqual({
      tabs: [{ tabId: 10, slot: 1, title: "A", service: "youtubeTv" }],
      heardTabId: 10,
      lastHeardTabId: 10,
      enabledServices: ["youtubeTv", "peacock"],
    });
  });

  it("keeps a current save as is", () => {
    const saved = run([opened(10), openedAt(20, PEACOCK), { type: "solo", slot: 2 }]).state;
    expect(restoreState(JSON.parse(JSON.stringify(saved)))).toEqual(saved);
  });
});

describe("tabTitleFor", () => {
  it("cleans tab titles on Peacock and Paramount+ on-demand players", () => {
    expect(tabTitleFor(PEACOCK, "Chiefs vs. Bills - Peacock")).toBe("Chiefs vs. Bills");
    expect(tabTitleFor(PPLUS_VOD, "Watch Survivor - Paramount+")).toBe("Survivor");
  });

  it("ignores tab titles on YouTube TV, Paramount+ live, and non-player pages", () => {
    expect(tabTitleFor(YTTV, "Home - YouTube TV")).toBeUndefined();
    expect(tabTitleFor(PPLUS_LIVE, "CBS Sports Golazo")).toBeUndefined();
    expect(tabTitleFor(PEACOCK_HOME, "Peacock")).toBeUndefined();
    expect(tabTitleFor(undefined, "Title")).toBeUndefined();
  });

  it("ignores missing titles and the URL Chrome shows while a page loads", () => {
    expect(tabTitleFor(PEACOCK, undefined)).toBeUndefined();
    expect(tabTitleFor(PEACOCK, "")).toBeUndefined();
    expect(tabTitleFor(PEACOCK, "www.peacocktv.com/watch/playback/event/abc")).toBeUndefined();
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

  describe("services", () => {
    it("tracks Peacock players by default but not Paramount+", () => {
      const { state, effects } = run([
        openedAt(10, PEACOCK),
        openedAt(20, PPLUS_LIVE),
        openedAt(30, PEACOCK_HOME),
      ]);
      expect(slots(state)).toEqual([[1, 10, "peacock"]]);
      expect(effects).toEqual([]);
    });

    it("tracks Paramount+ live and on-demand players once enabled", () => {
      const enabled: EngineState = {
        ...initialState,
        enabledServices: ["youtubeTv", "peacock", "paramountPlus"],
      };
      const { state } = run([openedAt(10, PPLUS_LIVE), openedAt(20, PPLUS_VOD)], enabled);
      expect(slots(state)).toEqual([
        [1, 10, "paramountPlus"],
        [2, 20, "paramountPlus"],
      ]);
    });

    it("turning a service on tracks its open tabs muted", () => {
      const before = run([opened(10)]).state;
      const { state, effects, changed } = reduce(before, {
        type: "servicesChanged",
        enabled: ["youtubeTv", "peacock", "paramountPlus"],
        tabs: [
          { tabId: 10, url: YTTV },
          { tabId: 20, url: PPLUS_LIVE },
          { tabId: 5, url: OTHER },
        ],
      });
      expect(changed).toBe(true);
      expect(state.enabledServices).toEqual(["youtubeTv", "peacock", "paramountPlus"]);
      expect(slots(state)).toEqual([
        [1, 10, "youtubeTv"],
        [2, 20, "paramountPlus"],
      ]);
      expect(effects).toEqual([
        { tabId: 10, muted: true },
        { tabId: 20, muted: true },
      ]);
    });

    it("turning a service off frees its tabs' slots and unmutes them", () => {
      const before = run([opened(10), openedAt(20, PEACOCK), { type: "solo", slot: 2 }]).state;
      const { state, effects } = reduce(before, {
        type: "servicesChanged",
        enabled: ["youtubeTv"],
        tabs: [
          { tabId: 10, url: YTTV },
          { tabId: 20, url: PEACOCK },
        ],
      });
      expect(slots(state)).toEqual([[1, 10, "youtubeTv"]]);
      expect(state.heardTabId).toBeNull();
      expect(state.lastHeardTabId).toBeNull();
      expect(effects).toEqual([
        { tabId: 20, muted: false },
        { tabId: 10, muted: true },
      ]);
    });

    it("a new service list without YouTube TV still keeps it", () => {
      const { state } = reduce(initialState, {
        type: "servicesChanged",
        enabled: [],
        tabs: [{ tabId: 10, url: YTTV }],
      });
      expect(state.enabledServices).toEqual(["youtubeTv"]);
      expect(slots(state)).toEqual([[1, 10, "youtubeTv"]]);
    });

    it("a tab that moves to another enabled service's player keeps its slot", () => {
      const { state, effects } = run([
        opened(10),
        openedAt(20, PEACOCK, "Chiefs vs. Bills"),
        { type: "solo", slot: 2 },
        { type: "tabUpdated", tab: { tabId: 20, url: YTTV } },
      ]);
      expect(slots(state)).toEqual([
        [1, 10, "youtubeTv"],
        [2, 20, "youtubeTv"],
      ]);
      expect(state.tabs[1]?.title).toBe("Chiefs vs. Bills");
      expect(state.heardTabId).toBe(20);
      expect(effects).toEqual([]);
    });

    it("a tab that moves to a disabled service's player loses its slot", () => {
      const { state, effects } = run([
        openedAt(10, PEACOCK),
        { type: "tabUpdated", tab: { tabId: 10, url: PPLUS_VOD } },
      ]);
      expect(state.tabs).toEqual([]);
      expect(effects).toEqual([{ tabId: 10, muted: false }]);
    });

    it("sync updates the service of a tab that moved while asleep", () => {
      const saved = run([openedAt(10, PEACOCK)]).state;
      const { state } = reduce(saved, { type: "sync", tabs: [{ tabId: 10, url: YTTV }] });
      expect(slots(state)).toEqual([[1, 10, "youtubeTv"]]);
    });
  });

  describe("toStateMessage", () => {
    it("reports games by slot with the heard flag, service, and enabled services", () => {
      const { state } = run([
        opened(10, "A"),
        openedAt(20, PEACOCK, "B"),
        { type: "solo", slot: 1 },
      ]);
      expect(toStateMessage(state)).toEqual({
        type: "state",
        games: [
          { slot: 1, tabId: 10, title: "A", heard: true, service: "youtubeTv" },
          { slot: 2, tabId: 20, title: "B", heard: false, service: "peacock" },
        ],
        allMuted: false,
        lastHeardTabId: 10,
        services: ["youtubeTv", "peacock"],
      });
    });

    it("omits lastHeardTabId when there is none", () => {
      expect(toStateMessage(initialState)).toEqual({
        type: "state",
        games: [],
        allMuted: true,
        services: ["youtubeTv", "peacock"],
      });
    });
  });
});
