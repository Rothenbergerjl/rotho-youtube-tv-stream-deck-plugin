import { MAX_SLOTS } from "@rotho/shared";

/** Returns the lowest slot (1..max) not in `used`, or null if every slot is taken. */
export function lowestFreeSlot(used: Iterable<number>, max: number = MAX_SLOTS): number | null {
  const taken = new Set(used);
  for (let slot = 1; slot <= max; slot++) {
    if (!taken.has(slot)) return slot;
  }
  return null;
}
