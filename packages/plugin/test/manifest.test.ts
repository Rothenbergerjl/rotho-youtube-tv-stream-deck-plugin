import { existsSync, readFileSync } from "node:fs";
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
      ACTION_UUIDS.back,
      ACTION_UUIDS.picker,
    ]);
  });

  it("points each settings panel at a file that exists", () => {
    const paths = Object.fromEntries(
      manifest.Actions.map((a: { UUID: string; PropertyInspectorPath?: string }) => [
        a.UUID,
        a.PropertyInspectorPath,
      ]),
    );
    expect(paths[ACTION_UUIDS.slot]).toBe("ui/slot.html");
    expect(paths[ACTION_UUIDS.open]).toBe("ui/open.html");
    expect(paths[ACTION_UUIDS.focus]).toBe("ui/focus.html");
    expect(paths[ACTION_UUIDS.back]).toBeUndefined();
    expect(paths[ACTION_UUIDS.picker]).toBeUndefined();
    for (const path of Object.values(paths).filter(Boolean)) {
      expect(existsSync(new URL(`../${PLUGIN_UUID}.sdPlugin/${path}`, import.meta.url))).toBe(true);
    }
  });

  it("names the Open action for every service", () => {
    const open = manifest.Actions.find((a: { UUID: string }) => a.UUID === ACTION_UUIDS.open);
    expect(open.Name).toBe("Open Service");
    for (const name of ["YouTube TV", "Peacock", "Paramount+"]) {
      expect(open.Tooltip).toContain(name);
      expect(manifest.Description).toContain(name);
    }
  });

  it("names the picker for every service and its one supported device", () => {
    const picker = manifest.Actions.find((a: { UUID: string }) => a.UUID === ACTION_UUIDS.picker);
    expect(picker.Name).toBe("Open Service Picker");
    for (const name of ["YouTube TV", "Peacock", "Paramount+"]) {
      expect(picker.Tooltip).toContain(name);
    }
    expect(picker.Tooltip).toContain("15-key Stream Deck only");
  });

  it("targets Node 24 and Stream Deck 7.1+", () => {
    expect(manifest.Nodejs.Version).toBe("24");
    expect(manifest.Software.MinimumVersion).toBe("7.1");
  });
});
