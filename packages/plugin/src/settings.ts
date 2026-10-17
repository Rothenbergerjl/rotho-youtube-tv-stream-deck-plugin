// Per-key settings shared by more than one action.

/**
 * The "Team colors" checkbox (setting `teamColors`). The property inspector saves a boolean;
 * keys made before the setting existed have none, which means on.
 */
export function teamColorsSetting(value: unknown): boolean {
  return value !== false && value !== "false";
}
