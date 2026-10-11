import { describe, expect, it } from "vitest";
import { lowestFreeSlot } from "../src/slots";

describe("lowestFreeSlot", () => {
  it("starts at slot 1", () => {
    expect(lowestFreeSlot([])).toBe(1);
  });

  it("fills the lowest gap", () => {
    expect(lowestFreeSlot([1, 2, 4])).toBe(3);
    expect(lowestFreeSlot([2, 3])).toBe(1);
  });

  it("returns null when all 15 slots are taken", () => {
    const all = Array.from({ length: 15 }, (_, i) => i + 1);
    expect(lowestFreeSlot(all)).toBeNull();
    expect(lowestFreeSlot(all.slice(0, 14))).toBe(15);
  });

  it("honours a custom maximum", () => {
    expect(lowestFreeSlot([1, 2], 2)).toBeNull();
  });
});
