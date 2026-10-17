// Messages exchanged over the WebSocket between the Chrome extension and the Stream Deck plugin.
// Every message is a JSON object with a string `type`.
import { FEATURES, type Feature, MAX_SLOTS } from "./constants";
import { isServiceId, type ServiceId } from "./services";

/** One tracked player tab, as shown on a Game Slot key. */
export interface Game {
  /** Stable slot number, 1..MAX_SLOTS. */
  slot: number;
  tabId: number;
  /** Raw tab title; the plugin shortens it for display. */
  title: string;
  /** True for the one tab whose audio is currently unmuted. */
  heard: boolean;
  /** Service the tab plays; missing (extensions before Peacock support) means `youtubeTv`. */
  service?: ServiceId;
}

// ---- Extension → plugin ----

/** First message after connecting. */
export interface HelloMessage {
  type: "hello";
  protocolVersion: number;
  extensionVersion: string;
  /** Optional messages the extension handles; missing from extensions older than 0.3.0. */
  features?: Feature[];
}

/** Full snapshot, sent on connect, on request, and after every change. */
export interface StateMessage {
  type: "state";
  /** Sorted by slot. */
  games: Game[];
  /** True when no game is heard. */
  allMuted: boolean;
  /** Tab that Mute All will restore, if any. */
  lastHeardTabId?: number;
  /** Services turned on in the extension; missing means only `youtubeTv`. */
  services?: ServiceId[];
}

/** Keeps the connection (and the extension's service worker) alive. */
export interface HeartbeatMessage {
  type: "heartbeat";
}

export type ExtensionMessage = HelloMessage | StateMessage | HeartbeatMessage;

// ---- Plugin → extension ----

/** Unmute the game in `slot` and mute every other YouTube TV tab. */
export interface SoloMessage {
  type: "solo";
  slot: number;
}

/** Mute everything, or restore the last heard game if everything is already muted. */
export interface ToggleMuteAllMessage {
  type: "toggleMuteAll";
}

/** Ask the extension to resend a `state` message. */
export interface RequestStateMessage {
  type: "requestState";
}

/** Where Open YouTube TV opens the page. */
export type OpenTarget = "window" | "tab";

/** Open tv.youtube.com in a new window, or a tab in the last-focused one. Feature `openYouTubeTv`. */
export interface OpenYouTubeTvMessage {
  type: "openYouTubeTv";
  target: OpenTarget;
}

/** Bring the game in `slot` to the front: activate its tab and focus its window. Feature `focus`. */
export interface FocusMessage {
  type: "focus";
  slot: number;
}

/**
 * Open a service's home page in a new window, or a tab in the last-focused one. Feature
 * `openService`. The plugin still sends `openYouTubeTv` for YouTube TV so older extensions work.
 */
export interface OpenServiceMessage {
  type: "openService";
  service: ServiceId;
  target: OpenTarget;
}

/** Open the extension's options page, where services are turned on. Feature `openService`. */
export interface OpenOptionsMessage {
  type: "openOptions";
}

export type PluginMessage =
  | SoloMessage
  | ToggleMuteAllMessage
  | RequestStateMessage
  | OpenYouTubeTvMessage
  | FocusMessage
  | OpenServiceMessage
  | OpenOptionsMessage;

// ---- Validation ----

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isInt = (v: unknown): v is number => Number.isInteger(v);
const isSlot = (v: unknown): v is number => isInt(v) && v >= 1 && v <= MAX_SLOTS;
const isOpenTarget = (v: unknown): v is OpenTarget => v === "window" || v === "tab";

const knownFeatures: readonly string[] = Object.values(FEATURES);
const isFeature = (v: string): v is Feature => knownFeatures.includes(v);

/** A game as sent, before unknown services are filtered out. */
type WireGame = Omit<Game, "service"> & { service?: string };

function isGame(v: unknown): v is WireGame {
  return (
    isObj(v) &&
    isSlot(v.slot) &&
    isInt(v.tabId) &&
    typeof v.title === "string" &&
    typeof v.heard === "boolean" &&
    (v.service === undefined || typeof v.service === "string")
  );
}

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === "string");

function parseObject(raw: string): Obj | null {
  try {
    const value: unknown = JSON.parse(raw);
    return isObj(value) ? value : null;
  } catch {
    return null;
  }
}

/** Parses a message sent by the extension; returns null if it is malformed. */
export function parseExtensionMessage(raw: string): ExtensionMessage | null {
  const m = parseObject(raw);
  switch (m?.type) {
    case "hello": {
      if (!isInt(m.protocolVersion) || typeof m.extensionVersion !== "string") return null;
      const hello: HelloMessage = {
        type: "hello",
        protocolVersion: m.protocolVersion,
        extensionVersion: m.extensionVersion,
      };
      if (m.features !== undefined) {
        if (!Array.isArray(m.features) || !m.features.every((f) => typeof f === "string")) {
          return null;
        }
        // Names this plugin doesn't know come from a newer extension; ignore them.
        hello.features = m.features.filter(isFeature);
      }
      return hello;
    }
    case "state": {
      if (!Array.isArray(m.games) || !m.games.every(isGame) || typeof m.allMuted !== "boolean") {
        return null;
      }
      if (m.lastHeardTabId !== undefined && !isInt(m.lastHeardTabId)) return null;
      if (m.services !== undefined && !isStringArray(m.services)) return null;
      const games: Game[] = [];
      for (const { slot, tabId, title, heard, service } of m.games) {
        if (service === undefined) {
          games.push({ slot, tabId, title, heard });
        } else if (isServiceId(service)) {
          games.push({ slot, tabId, title, heard, service });
        }
        // A service this plugin doesn't know comes from a newer extension; it can't draw that
        // game, so the slot is left out.
      }
      const state: StateMessage = { type: "state", games, allMuted: m.allMuted };
      if (m.lastHeardTabId !== undefined) state.lastHeardTabId = m.lastHeardTabId;
      if (m.services !== undefined) state.services = m.services.filter(isServiceId);
      return state;
    }
    case "heartbeat":
      return { type: "heartbeat" };
    default:
      return null;
  }
}

/** Parses a message sent by the plugin; returns null if it is malformed. */
export function parsePluginMessage(raw: string): PluginMessage | null {
  const m = parseObject(raw);
  switch (m?.type) {
    case "solo":
      return isSlot(m.slot) ? { type: "solo", slot: m.slot } : null;
    case "toggleMuteAll":
      return { type: "toggleMuteAll" };
    case "requestState":
      return { type: "requestState" };
    case "openYouTubeTv":
      return isOpenTarget(m.target) ? { type: "openYouTubeTv", target: m.target } : null;
    case "focus":
      return isSlot(m.slot) ? { type: "focus", slot: m.slot } : null;
    case "openService":
      return isServiceId(m.service) && isOpenTarget(m.target)
        ? { type: "openService", service: m.service, target: m.target }
        : null;
    case "openOptions":
      return { type: "openOptions" };
    default:
      return null;
  }
}
