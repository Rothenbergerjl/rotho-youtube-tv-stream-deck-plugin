// Per-key settings parsed outside the actions so they can be tested without the Stream Deck SDK.
import { isServiceId, type ServiceId } from "@rotho/shared";

/**
 * The "Team colors" checkbox (setting `teamColors`). The property inspector saves a boolean;
 * keys made before the setting existed have none, which means on.
 */
export function teamColorsSetting(value: unknown): boolean {
  return value !== false && value !== "false";
}

/**
 * The Open key's "Service" select (setting `service`). Keys made before the setting existed have
 * none, which means YouTube TV.
 */
export function serviceSetting(value: unknown): ServiceId {
  return isServiceId(value) ? value : "youtubeTv";
}
