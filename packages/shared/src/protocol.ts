// Messages exchanged over the WebSocket between the Chrome extension and the Stream Deck plugin.
// Every message is a JSON object with a string `type`.
import { MAX_SLOTS } from "./constants";

/** One tracked YouTube TV tab, as shown on a Game Slot key. */
export interface Game {
  /** Stable slot number, 1..MAX_SLOTS. */
  slot: number;
  tabId: number;
  /** Raw tab title; the plugin shortens it for display. */
  title: string;
  /** True for the one tab whose audio is currently unmuted. */
  heard: boolean;
}

// ---- Extension → plugin ----

/** First message after connecting. */
export interface HelloMessage {
  type: "hello";
  protocolVersion: number;
  extensionVersion: string;
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

export type PluginMessage = SoloMessage | ToggleMuteAllMessage | RequestStateMessage;

// ---- Validation ----

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isInt = (v: unknown): v is number => Number.isInteger(v);
const isSlot = (v: unknown): v is number => isInt(v) && v >= 1 && v <= MAX_SLOTS;

function isGame(v: unknown): v is Game {
  return (
    isObj(v) &&
    isSlot(v.slot) &&
    isInt(v.tabId) &&
    typeof v.title === "string" &&
    typeof v.heard === "boolean"
  );
}

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
    case "hello":
      return isInt(m.protocolVersion) && typeof m.extensionVersion === "string"
        ? {
            type: "hello",
            protocolVersion: m.protocolVersion,
            extensionVersion: m.extensionVersion,
          }
        : null;
    case "state": {
      if (!Array.isArray(m.games) || !m.games.every(isGame) || typeof m.allMuted !== "boolean") {
        return null;
      }
      if (m.lastHeardTabId !== undefined && !isInt(m.lastHeardTabId)) return null;
      const state: StateMessage = {
        type: "state",
        games: m.games.map(({ slot, tabId, title, heard }) => ({ slot, tabId, title, heard })),
        allMuted: m.allMuted,
      };
      if (m.lastHeardTabId !== undefined) state.lastHeardTabId = m.lastHeardTabId;
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
    default:
      return null;
  }
}
