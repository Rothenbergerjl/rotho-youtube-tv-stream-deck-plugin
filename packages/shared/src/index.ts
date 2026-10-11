/** Stream Deck plugin UUID; must match the plugin manifest and `.sdPlugin` folder name. */
export const PLUGIN_UUID = "com.rotho.yttv-multiview";

/** Stream Deck action UUIDs; must match the plugin manifest. */
export const ACTION_UUIDS = {
  slot: `${PLUGIN_UUID}.slot`,
  muteAll: `${PLUGIN_UUID}.muteall`,
} as const;

/**
 * Chrome extension ID, derived from the public `key` in the extension manifest.
 * The plugin's WebSocket server only accepts connections from this origin.
 */
export const EXTENSION_ID = "decadhapokljmmbknbfcpjckddhiicmg";

/** Origin header Chrome sends when the extension opens a WebSocket. */
export const EXTENSION_ORIGIN = `chrome-extension://${EXTENSION_ID}`;

/** Localhost port the plugin's WebSocket server listens on. */
export const WS_PORT = 47731;

/** Highest slot number; one per key on a Stream Deck MK.2. */
export const MAX_SLOTS = 15;

/** Bumped whenever the message protocol changes incompatibly. */
export const PROTOCOL_VERSION = 1;

/** One tracked YouTube TV tab. Placeholder until Phase 2 defines the full protocol. */
export interface Game {
  slot: number;
  tabId: number;
  title: string;
  heard: boolean;
}
