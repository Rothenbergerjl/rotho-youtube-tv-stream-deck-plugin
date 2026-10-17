// Pure state machine for player tabs (YouTube TV, Peacock, Paramount+): slot assignment and which
// tab is heard. `reduce` never touches Chrome; it returns the new state plus the mute changes to
// apply.
import {
  cleanTabTitle,
  isServiceId,
  SERVICE_IDS,
  SERVICES,
  type ServiceId,
  serviceForUrl,
  type StateMessage,
} from "@rotho/shared";
import { lowestFreeSlot } from "./slots";

export interface TrackedTab {
  tabId: number;
  slot: number;
  title: string;
  service: ServiceId;
}

export interface EngineState {
  /** Tracked player tabs, sorted by slot. */
  tabs: TrackedTab[];
  /** The one unmuted tab, or null when everything is muted. */
  heardTabId: number | null;
  /** Tab that Mute All restores. */
  lastHeardTabId: number | null;
  /** Services whose player tabs are tracked, in SERVICE_IDS order. Always has `youtubeTv`. */
  enabledServices: ServiceId[];
}

/** Services on before the user changes anything: Peacock needs no extra permission. */
export const DEFAULT_SERVICES: readonly ServiceId[] = ["youtubeTv", "peacock"];

export const initialState: EngineState = {
  tabs: [],
  heardTabId: null,
  lastHeardTabId: null,
  enabledServices: [...DEFAULT_SERVICES],
};

/**
 * Enabled services from the options page's saved value (`chrome.storage.local` key `services`).
 * Missing or malformed means the defaults; unknown ids are dropped; YouTube TV is always on.
 */
export function enabledServicesFrom(stored: unknown): ServiceId[] {
  if (!Array.isArray(stored)) return [...DEFAULT_SERVICES];
  const ids = new Set<ServiceId>(["youtubeTv", ...stored.filter(isServiceId)]);
  return SERVICE_IDS.filter((id) => ids.has(id));
}

/**
 * Engine state saved in `chrome.storage.session`, filled in for saves from older versions:
 * tabs without a service were YouTube TV, and a missing service list means the defaults.
 */
export function restoreState(saved: unknown): EngineState {
  if (typeof saved !== "object" || saved === null) return initialState;
  const s = saved as Partial<EngineState> & {
    tabs?: (Omit<TrackedTab, "service"> & { service?: ServiceId })[];
  };
  return {
    tabs: (s.tabs ?? []).map((t) => ({ ...t, service: t.service ?? "youtubeTv" })),
    heardTabId: s.heardTabId ?? null,
    lastHeardTabId: s.lastHeardTabId ?? null,
    enabledServices: enabledServicesFrom(s.enabledServices),
  };
}

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
  /**
   * The options page turned services on or off. `tabs` is every open tab, as for `sync`, so tabs
   * of newly enabled services can be tracked.
   */
  | { type: "servicesChanged"; enabled: ServiceId[]; tabs: TabInfo[] }
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

/**
 * The program title from a tab's own title, for players whose title source is the tab (Peacock,
 * Paramount+ on demand). Undefined elsewhere: YouTube TV and Paramount+ live titles come from a
 * content script, since their tab titles don't name the program.
 */
export function tabTitleFor(
  url: string | undefined,
  title: string | undefined,
): string | undefined {
  const match = serviceForUrl(url);
  if (!match || match.titleSource !== "tab" || !title) return undefined;
  const cleaned = cleanTabTitle(match.service, title);
  // While a page loads Chrome uses (part of) its URL as the title, and the player may briefly
  // show just the service's name.
  if (!cleaned || url!.includes(cleaned) || cleaned === SERVICES[match.service].name) {
    return undefined;
  }
  return cleaned;
}

/** The service whose player `url` is, if that service is enabled. */
function trackedService(state: EngineState, url: string | undefined): ServiceId | undefined {
  const service = serviceForUrl(url)?.service;
  return service && state.enabledServices.includes(service) ? service : undefined;
}

export function reduce(state: EngineState, event: EngineEvent): EngineResult {
  const { state: next, effects } = apply(state, event);
  return { state: next, effects, changed: JSON.stringify(next) !== JSON.stringify(state) };
}

export function toStateMessage(state: EngineState): StateMessage {
  const message: StateMessage = {
    type: "state",
    games: state.tabs.map(({ slot, tabId, title, service }) => ({
      slot,
      tabId,
      title,
      heard: tabId === state.heardTabId,
      service,
    })),
    allMuted: state.heardTabId === null,
    services: [...state.enabledServices],
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
    case "servicesChanged":
      return sync({ ...state, enabledServices: enabledServicesFrom(event.enabled) }, event.tabs);
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
  const service = trackedService(state, tab.url);

  if (tab.url !== undefined && !service) {
    // Navigated away from a player: free its slot and give the tab its sound back.
    return tracked
      ? { state: untrack(state, tab.tabId), effects: [{ tabId: tab.tabId, muted: false }] }
      : { state, effects: [] };
  }

  if (tracked) return { state: refresh(state, tracked, service, tab.title), effects: [] };

  if (!service) return { state, effects: [] };
  const added = track(state, tab, service);
  // New player tabs start muted. With no free slot the tab is left alone.
  return added === state
    ? { state, effects: [] }
    : { state: added, effects: [{ tabId: tab.tabId, muted: true }] };
}

/**
 * Updates a tracked tab's title and service. A tab that moves to another service's player keeps
 * its slot.
 */
function refresh(
  state: EngineState,
  tracked: TrackedTab,
  service: ServiceId | undefined,
  title: string | undefined,
): EngineState {
  const next: TrackedTab = {
    ...tracked,
    service: service ?? tracked.service,
    title: title ?? tracked.title,
  };
  if (next.service === tracked.service && next.title === tracked.title) return state;
  return { ...state, tabs: state.tabs.map((t) => (t.tabId === tracked.tabId ? next : t)) };
}

function sync(state: EngineState, tabs: TabInfo[]): { state: EngineState; effects: MuteEffect[] } {
  const open = new Map(tabs.map((t) => [t.tabId, t]));
  const effects: MuteEffect[] = [];
  let next = state;

  // Drop tracked tabs that closed, left their player while the service worker was asleep, or
  // whose service was turned off.
  for (const tracked of state.tabs) {
    const tab = open.get(tracked.tabId);
    const service = trackedService(next, tab?.url);
    if (!tab) {
      next = untrack(next, tracked.tabId);
    } else if (!service) {
      next = untrack(next, tracked.tabId);
      effects.push({ tabId: tracked.tabId, muted: false });
    } else {
      next = refresh(next, tracked, service, tab.title);
    }
  }

  // Track player tabs we haven't seen, in tab-id order (roughly the order they opened).
  for (const tab of [...tabs].sort((a, b) => a.tabId - b.tabId)) {
    const service = trackedService(next, tab.url);
    if (service && !next.tabs.some((t) => t.tabId === tab.tabId)) {
      next = track(next, tab, service);
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

function track(state: EngineState, tab: TabInfo, service: ServiceId): EngineState {
  const slot = lowestFreeSlot(state.tabs.map((t) => t.slot));
  if (slot === null) return state;
  const tabs = [...state.tabs, { tabId: tab.tabId, slot, title: tab.title ?? "", service }];
  tabs.sort((a, b) => a.slot - b.slot);
  return { ...state, tabs };
}

function untrack(state: EngineState, tabId: number): EngineState {
  if (!state.tabs.some((t) => t.tabId === tabId)) return state;
  return {
    ...state,
    tabs: state.tabs.filter((t) => t.tabId !== tabId),
    // Closing the heard tab leaves everything muted.
    heardTabId: state.heardTabId === tabId ? null : state.heardTabId,
    lastHeardTabId: state.lastHeardTabId === tabId ? null : state.lastHeardTabId,
  };
}
