import { describe, expect, it } from "vitest";
import { teamColorsSetting } from "../src/settings";

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
