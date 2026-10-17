// Per-key settings parsed outside the actions so they can be tested without the Stream Deck SDK.
import { isServiceId, type ServiceId } from "@rotho/shared";

/**
 * The "Team colors" checkbox (setting `teamColors`). The property inspector saves a boolean;
 * keys made before the setting existed have none, which means on.
 */
export function teamColorsSetting(value: unknown): boolean {
  return value !== false && value !== "false";
}

/** The "Show score" checkbox (setting `showScore`); keys made before it existed mean on. */
export function showScoreSetting(value: unknown): boolean {
  return value !== false && value !== "false";
}

/** The "Score alerts" checkbox (setting `scoreAlerts`); keys made before it existed mean on. */
export function scoreAlertsSetting(value: unknown): boolean {
  return value !== false && value !== "false";
}

/** The choices of the "Score delay" select, in seconds. */
export const SCORE_DELAYS = [0, 15, 30, 45, 60, 90] as const;
export const DEFAULT_SCORE_DELAY = 30;

/**
 * The "Score delay" select (setting `scoreDelay`), in seconds. Anything that isn't one of the
 * choices, including keys made before the setting existed, means 30.
 */
export function scoreDelaySetting(value: unknown): number {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return SCORE_DELAYS.find((d) => d === n) ?? DEFAULT_SCORE_DELAY;
}

/**
 * The Open key's "Service" select (setting `service`). Keys made before the setting existed have
 * none, which means YouTube TV.
 */
export function serviceSetting(value: unknown): ServiceId {
  return isServiceId(value) ? value : "youtubeTv";
}
