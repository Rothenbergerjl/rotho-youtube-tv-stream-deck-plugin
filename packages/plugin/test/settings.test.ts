import { describe, expect, it } from "vitest";
import {
  scoreAlertsSetting,
  scoreDelaySetting,
  serviceSetting,
  showScoreSetting,
  teamColorsSetting,
} from "../src/settings";

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

describe.each([
  ["showScoreSetting", showScoreSetting],
  ["scoreAlertsSetting", scoreAlertsSetting],
])("%s", (_, setting) => {
  it.each([
    [undefined, true],
    [true, true],
    [false, false],
    ["true", true],
    ["false", false],
    [null, true],
  ])("%j → %s", (value, expected) => {
    expect(setting(value)).toBe(expected);
  });
});

describe("scoreDelaySetting", () => {
  it.each([
    [undefined, 30],
    [0, 0],
    [15, 15],
    [90, 90],
    ["45", 45],
    ["0", 0],
    ["", 30],
    [20, 30],
    [-15, 30],
    ["soon", 30],
    [null, 30],
  ])("%j → %s", (value, expected) => {
    expect(scoreDelaySetting(value)).toBe(expected);
  });
});
