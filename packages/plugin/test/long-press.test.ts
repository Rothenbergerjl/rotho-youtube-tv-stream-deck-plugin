import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HoldTimers, LONG_PRESS_MS } from "../src/long-press";

describe("HoldTimers", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires once after the threshold", () => {
    const timers = new HoldTimers();
    const onHold = vi.fn();
    timers.start("a", onHold);
    vi.advanceTimersByTime(LONG_PRESS_MS - 1);
    expect(onHold).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onHold).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(LONG_PRESS_MS * 4);
    expect(onHold).toHaveBeenCalledTimes(1);
  });

  it("doesn't fire when cancelled first", () => {
    const timers = new HoldTimers();
    const onHold = vi.fn();
    timers.start("a", onHold);
    vi.advanceTimersByTime(LONG_PRESS_MS - 1);
    timers.cancel("a");
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(onHold).not.toHaveBeenCalled();
  });

  it("replaces a key's running timer", () => {
    const timers = new HoldTimers();
    const first = vi.fn();
    const second = vi.fn();
    timers.start("a", first);
    vi.advanceTimersByTime(LONG_PRESS_MS - 100);
    timers.start("a", second);
    vi.advanceTimersByTime(LONG_PRESS_MS - 1);
    expect(second).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("keeps each key's timer separate", () => {
    const timers = new HoldTimers();
    const a = vi.fn();
    const b = vi.fn();
    timers.start("a", a);
    timers.start("b", b);
    timers.cancel("a");
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("ignores cancelling a key with no timer", () => {
    const timers = new HoldTimers();
    expect(() => timers.cancel("missing")).not.toThrow();
  });

  it("cancelAll stops every timer", () => {
    const timers = new HoldTimers();
    const a = vi.fn();
    const b = vi.fn();
    timers.start("a", a);
    timers.start("b", b);
    timers.cancelAll();
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });
});
