// Pure state machine for YouTube TV tabs: slot assignment and which tab is heard.
// `reduce` never touches Chrome; it returns the new state plus the mute changes to apply.
import type { StateMessage } from "@rotho/shared";
import { lowestFreeSlot } from "./slots";

export interface TrackedTab {
  tabId: number;
  slot: number;
  title: string;
}

export interface EngineState {
  /** Tracked YouTube TV tabs, sorted by slot. */
  tabs: TrackedTab[];
  /** The one unmuted tab, or null when everything is muted. */
  heardTabId: number | null;
  /** Tab that Mute All restores. */
  lastHeardTabId: number | null;
}

export const initialState: EngineState = { tabs: [], heardTabId: null, lastHeardTabId: null };

/** What the engine needs to know about a Chrome tab. */
export interface TabInfo {
  tabId: number;
  /** Undefined while Chrome hasn't committed a URL yet. */
  url?: string;
  title?: string;
}

export type EngineEvent =
  /** A tab was created or its URL/title changed. */
  | { type: "tabUpdated"; tab: TabInfo }
  | { type: "tabRemoved"; tabId: number }
  /** Every open tab, e.g. when the service worker starts. Reconciles saved state with Chrome. */
  | { type: "sync"; tabs: TabInfo[] }
  | { type: "solo"; slot: number }
  | { type: "toggleMuteAll" };

export interface MuteEffect {
  tabId: number;
  muted: boolean;
}

export interface EngineResult {
  state: EngineState;
  effects: MuteEffect[];
  /** True when the state the plugin sees has changed. */
  changed: boolean;
}

export function isYouTubeTvUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && hostname === "tv.youtube.com";
  } catch {
    return false;
  }
}

export function reduce(state: EngineState, event: EngineEvent): EngineResult {
  const { state: next, effects } = apply(state, event);
  return { state: next, effects, changed: JSON.stringify(next) !== JSON.stringify(state) };
}

export function toStateMessage(state: EngineState): StateMessage {
  const message: StateMessage = {
    type: "state",
    games: state.tabs.map(({ slot, tabId, title }) => ({
      slot,
      tabId,
      title,
      heard: tabId === state.heardTabId,
    })),
    allMuted: state.heardTabId === null,
  };
  if (state.lastHeardTabId !== null) message.lastHeardTabId = state.lastHeardTabId;
  return message;
}

function apply(
  state: EngineState,
  event: EngineEvent,
): { state: EngineState; effects: MuteEffect[] } {
  switch (event.type) {
    case "tabUpdated":
      return tabUpdated(state, event.tab);
    case "tabRemoved":
      return { state: untrack(state, event.tabId), effects: [] };
    case "sync":
      return sync(state, event.tabs);
    case "solo": {
      const target = state.tabs.find((t) => t.slot === event.slot);
      return target ? hear(state, target.tabId) : { state, effects: [] };
    }
    case "toggleMuteAll":
      return toggleMuteAll(state);
  }
}

function tabUpdated(
  state: EngineState,
  tab: TabInfo,
): { state: EngineState; effects: MuteEffect[] } {
  const tracked = state.tabs.find((t) => t.tabId === tab.tabId);

  if (tab.url !== undefined && !isYouTubeTvUrl(tab.url)) {
    // Navigated away from YouTube TV: free its slot and give the tab its sound back.
    return tracked
      ? { state: untrack(state, tab.tabId), effects: [{ tabId: tab.tabId, muted: false }] }
      : { state, effects: [] };
  }

  if (tracked) {
    if (tab.title === undefined || tab.title === tracked.title) return { state, effects: [] };
    return {
      state: {
        ...state,
        tabs: state.tabs.map((t) => (t.tabId === tab.tabId ? { ...t, title: tab.title! } : t)),
      },
      effects: [],
    };
  }

  if (!isYouTubeTvUrl(tab.url)) return { state, effects: [] };
  const added = track(state, tab);
  // New YouTube TV tabs start muted. With no free slot the tab is left alone.
  return added === state
    ? { state, effects: [] }
    : { state: added, effects: [{ tabId: tab.tabId, muted: true }] };
}

function sync(state: EngineState, tabs: TabInfo[]): { state: EngineState; effects: MuteEffect[] } {
  const open = new Map(tabs.map((t) => [t.tabId, t]));
  const effects: MuteEffect[] = [];
  let next = state;

  // Drop tracked tabs that closed or left YouTube TV while the service worker was asleep.
  for (const tracked of state.tabs) {
    const tab = open.get(tracked.tabId);
    if (!tab) {
      next = untrack(next, tracked.tabId);
    } else if (!isYouTubeTvUrl(tab.url)) {
      next = untrack(next, tracked.tabId);
      effects.push({ tabId: tracked.tabId, muted: false });
    } else if (tab.title !== undefined) {
      next = {
        ...next,
        tabs: next.tabs.map((t) => (t.tabId === tab.tabId ? { ...t, title: tab.title! } : t)),
      };
    }
  }

  // Track YouTube TV tabs we haven't seen, in tab-id order (roughly the order they opened).
  for (const tab of [...tabs].sort((a, b) => a.tabId - b.tabId)) {
    if (isYouTubeTvUrl(tab.url) && !next.tabs.some((t) => t.tabId === tab.tabId)) {
      next = track(next, tab);
    }
  }

  // Enforce the invariant: only the heard tab is unmuted.
  for (const t of next.tabs) effects.push({ tabId: t.tabId, muted: t.tabId !== next.heardTabId });
  return { state: next, effects };
}

function toggleMuteAll(state: EngineState): { state: EngineState; effects: MuteEffect[] } {
  if (state.heardTabId !== null) {
    return {
      state: { ...state, heardTabId: null, lastHeardTabId: state.heardTabId },
      effects: state.tabs.map((t) => ({ tabId: t.tabId, muted: true })),
    };
  }
  const restore = state.tabs.find((t) => t.tabId === state.lastHeardTabId);
  return restore ? hear(state, restore.tabId) : { state, effects: [] };
}

function hear(state: EngineState, tabId: number): { state: EngineState; effects: MuteEffect[] } {
  return {
    state: { ...state, heardTabId: tabId, lastHeardTabId: tabId },
    effects: state.tabs.map((t) => ({ tabId: t.tabId, muted: t.tabId !== tabId })),
  };
}

function track(state: EngineState, tab: TabInfo): EngineState {
  const slot = lowestFreeSlot(state.tabs.map((t) => t.slot));
  if (slot === null) return state;
  const tabs = [...state.tabs, { tabId: tab.tabId, slot, title: tab.title ?? "" }];
  tabs.sort((a, b) => a.slot - b.slot);
  return { ...state, tabs };
}

function untrack(state: EngineState, tabId: number): EngineState {
  if (!state.tabs.some((t) => t.tabId === tabId)) return state;
  return {
    tabs: state.tabs.filter((t) => t.tabId !== tabId),
    // Closing the heard tab leaves everything muted.
    heardTabId: state.heardTabId === tabId ? null : state.heardTabId,
    lastHeardTabId: state.lastHeardTabId === tabId ? null : state.lastHeardTabId,
  };
}
