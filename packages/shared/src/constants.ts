/** Stream Deck plugin UUID; must match the plugin manifest and `.sdPlugin` folder name. */
export const PLUGIN_UUID = "com.rotho.yttv-multiview";

/** Stream Deck action UUIDs; must match the plugin manifest. */
export const ACTION_UUIDS = {
  slot: `${PLUGIN_UUID}.slot`,
  muteAll: `${PLUGIN_UUID}.muteall`,
  open: `${PLUGIN_UUID}.open`,
  focus: `${PLUGIN_UUID}.focus`,
  back: `${PLUGIN_UUID}.back`,
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

/**
 * Bumped whenever the message protocol changes incompatibly. Optional additions don't bump it;
 * they add a name to FEATURES instead.
 */
export const PROTOCOL_VERSION = 1;

/**
 * Optional messages the extension can handle, listed in its `hello`. The plugin enables a key
 * only when the connected extension lists the feature that key needs.
 */
export const FEATURES = {
  openYouTubeTv: "openYouTubeTv",
  focus: "focus",
  /** `openService` and `openOptions` messages. */
  openService: "openService",
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];
