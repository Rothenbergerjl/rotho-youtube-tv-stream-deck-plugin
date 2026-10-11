import { describe, expect, it } from "vitest";
import { ACTION_UUIDS, EXTENSION_ID, EXTENSION_ORIGIN, MAX_SLOTS, PLUGIN_UUID, WS_PORT } from ".";

describe("shared constants", () => {
  it("derives action UUIDs from the plugin UUID", () => {
    expect(ACTION_UUIDS.slot).toBe(`${PLUGIN_UUID}.slot`);
    expect(ACTION_UUIDS.muteAll).toBe(`${PLUGIN_UUID}.muteall`);
  });

  it("uses a well-formed Chrome extension ID", () => {
    expect(EXTENSION_ID).toMatch(/^[a-p]{32}$/);
    expect(EXTENSION_ORIGIN).toBe(`chrome-extension://${EXTENSION_ID}`);
  });

  it("uses a non-privileged port and one slot per MK.2 key", () => {
    expect(WS_PORT).toBeGreaterThan(1024);
    expect(WS_PORT).toBeLessThan(65536);
    expect(MAX_SLOTS).toBe(15);
  });
});
