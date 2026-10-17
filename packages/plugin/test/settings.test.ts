import { describe, expect, it } from "vitest";
import { serviceSetting, teamColorsSetting } from "../src/settings";

describe("serviceSetting", () => {
  it.each([
    [undefined, "youtubeTv"],
    ["youtubeTv", "youtubeTv"],
    ["peacock", "peacock"],
    ["paramountPlus", "paramountPlus"],
    ["espn", "youtubeTv"],
    [1, "youtubeTv"],
  ])("%j → %s", (value, expected) => {
    expect(serviceSetting(value)).toBe(expected);
  });
});

describe("teamColorsSetting", () => {
  it.each([
    [undefined, true],
    [true, true],
    [false, false],
    ["true", true],
    ["false", false],
    [null, true],
  ])("%j → %s", (value, expected) => {
    expect(teamColorsSetting(value)).toBe(expected);
  });
});
