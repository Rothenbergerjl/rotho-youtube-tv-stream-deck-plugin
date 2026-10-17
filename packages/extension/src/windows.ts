// Opens YouTube TV and brings a game's tab to the front. Takes the Chrome API as a parameter so
// tests can pass a fake; background.ts passes `chrome`.
import type { OpenTarget } from "@rotho/shared";

export const YOUTUBE_TV_URL = "https://tv.youtube.com";

/** The parts of `chrome.windows` and `chrome.tabs` used here. */
export interface WindowsApi {
  windows: {
    create(createData: { url: string; focused: boolean }): Promise<unknown>;
    getLastFocused(queryOptions: chrome.windows.QueryOptions): Promise<{ id?: number }>;
    get(windowId: number): Promise<{ state?: string }>;
    update(windowId: number, updateInfo: { focused: boolean; state?: "normal" }): Promise<unknown>;
  };
  tabs: {
    create(createProperties: { windowId: number; url: string; active: boolean }): Promise<unknown>;
    get(tabId: number): Promise<{ windowId: number }>;
    update(tabId: number, updateProperties: { active: boolean }): Promise<unknown>;
  };
}

/**
 * Opens YouTube TV in a new focused window, or as a new tab in the last-focused normal window
 * (which is then focused). Tab mode falls back to a new window when no normal window exists.
 * The new tab is muted by the usual tabs.onCreated handling.
 */
export async function openYouTubeTv(api: WindowsApi, target: OpenTarget): Promise<void> {
  try {
    if (target === "tab") {
      // Rejects when no normal window is open.
      // The enum's value, written out so tests don't need a `chrome` global.
      const windowTypes = ["normal" as chrome.windows.WindowType];
      const window = await api.windows.getLastFocused({ windowTypes }).catch(() => null);
      if (window?.id !== undefined) {
        await api.tabs.create({ windowId: window.id, url: YOUTUBE_TV_URL, active: true });
        await focusWindow(api, window.id);
        return;
      }
    }
    await api.windows.create({ url: YOUTUBE_TV_URL, focused: true });
  } catch (err) {
    console.warn("[yttv-multiview] open YouTube TV failed", err);
  }
}

/** Makes `tabId` the active tab in its window and focuses that window. */
export async function focusTab(api: WindowsApi, tabId: number): Promise<void> {
  try {
    const tab = await api.tabs.get(tabId);
    await api.tabs.update(tabId, { active: true });
    await focusWindow(api, tab.windowId);
  } catch (err) {
    // The tab may have closed since the plugin last saw it.
    console.warn("[yttv-multiview] focus failed", tabId, err);
  }
}

/** Focuses a window, restoring it if minimized; maximized and fullscreen windows keep their state. */
async function focusWindow(api: WindowsApi, windowId: number): Promise<void> {
  const window = await api.windows.get(windowId);
  await api.windows.update(
    windowId,
    window.state === "minimized" ? { focused: true, state: "normal" } : { focused: true },
  );
}
