// Which services are turned on, as saved by the options page and read by the service worker.
import type { ServiceId } from "@rotho/shared";
import { enabledServicesFrom } from "./engine";

/** `chrome.storage.local` key holding the enabled service ids. */
export const SERVICES_KEY = "services";

/** Optional host access Paramount+ needs for its live-page content script. */
export const PARAMOUNT_ORIGINS = ["https://www.paramountplus.com/*"];

/** Pages the Paramount+ content script runs on (the live player is a single-page app). */
export const PARAMOUNT_LIVE_MATCHES = ["https://www.paramountplus.com/live-tv/*"];

/** Id of the dynamically registered Paramount+ content script. */
export const PARAMOUNT_SCRIPT_ID = "paramountPlus";

export async function loadServices(): Promise<ServiceId[]> {
  const stored = await chrome.storage.local.get(SERVICES_KEY);
  return enabledServicesFrom(stored[SERVICES_KEY]);
}

export async function saveServices(enabled: ServiceId[]): Promise<void> {
  await chrome.storage.local.set({ [SERVICES_KEY]: enabledServicesFrom(enabled) });
}

/** Turns one service on or off, keeping the others as saved. */
export async function setServiceEnabled(service: ServiceId, on: boolean): Promise<void> {
  const current = await loadServices();
  await saveServices(on ? [...current, service] : current.filter((s) => s !== service));
}
