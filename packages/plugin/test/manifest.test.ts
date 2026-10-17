import { readFileSync } from "node:fs";
import { ACTION_UUIDS, PLUGIN_UUID } from "@rotho/shared";
import { describe, expect, it } from "vitest";

const manifest = JSON.parse(
  readFileSync(new URL(`../${PLUGIN_UUID}.sdPlugin/manifest.json`, import.meta.url), "utf8"),
);

describe("plugin manifest", () => {
  it("uses the shared plugin and action UUIDs", () => {
    expect(manifest.UUID).toBe(PLUGIN_UUID);
    expect(manifest.Actions.map((a: { UUID: string }) => a.UUID)).toEqual([
      ACTION_UUIDS.slot,
      ACTION_UUIDS.muteAll,
      ACTION_UUIDS.open,
      ACTION_UUIDS.focus,
    ]);
  });

  it("targets Node 24 and Stream Deck 7.1+", () => {
    expect(manifest.Nodejs.Version).toBe("24");
    expect(manifest.Software.MinimumVersion).toBe("7.1");
  });
});
