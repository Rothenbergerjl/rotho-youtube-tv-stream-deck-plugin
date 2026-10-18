// Long press on a Game Slot key: a timer starts on key-down and fires if the key is still held
// LONG_PRESS_MS later; key-up cancels it. Kept free of the Stream Deck SDK so it can be tested.

/** How long a key must be held to count as a long press. */
export const LONG_PRESS_MS = 500;

/** One pending hold timer per key, by action id. */
export class HoldTimers {
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly ms = LONG_PRESS_MS) {}

  /** Calls `onHold` after the threshold unless cancelled first; replaces the key's running timer. */
  start(id: string, onHold: () => void): void {
    this.cancel(id);
    const timer = setTimeout(() => {
      this.timers.delete(id);
      onHold();
    }, this.ms);
    timer.unref?.();
    this.timers.set(id, timer);
  }

  /** Stops the key's timer; a no-op when none is running. */
  cancel(id: string): void {
    const timer = this.timers.get(id);
    if (timer === undefined) return;
    clearTimeout(timer);
    this.timers.delete(id);
  }

  /** Stops every running timer. */
  cancelAll(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
  }
}
