// Service worker: feeds Chrome tab events into the engine, applies mute changes, persists state,
// and keeps the Stream Deck plugin updated over the WebSocket connection.
import {
  FEATURES,
  MAX_SLOTS,
  PROTOCOL_VERSION,
  type PluginMessage,
  SERVICES,
  type ServiceId,
  serviceForUrl,
  WS_PORT,
} from "@rotho/shared";
import { PluginConnection } from "./connection";
import {
  enabledServicesFrom,
  type EngineEvent,
  type EngineState,
  initialState,
  reduce,
  restoreState,
  type TabInfo,
  tabTitleFor,
  toStateMessage,
} from "./engine";
import { isPageTitleMessage } from "./page-title";
import {
  loadServices,
  PARAMOUNT_LIVE_MATCHES,
  PARAMOUNT_ORIGINS,
  PARAMOUNT_SCRIPT_ID,
  SERVICES_KEY,
  setServiceEnabled,
} from "./service-settings";
import { focusTab, openPage } from "./windows";

const STORAGE_KEY = "engine";
const KEEPALIVE_ALARM = "keepalive";

let state: EngineState = initialState;

// The tab's own title is used only where it names the program (Peacock, Paramount+ on demand).
// On YouTube TV document.title is "Home - YouTube TV" on every watch page, so titles there come
// only from the content script.
function toTabInfo(tab: chrome.tabs.Tab): TabInfo | null {
  if (tab.id === undefined || tab.id === chrome.tabs.TAB_ID_NONE) return null;
  const url = tab.url ?? tab.pendingUrl;
  const info: TabInfo = { tabId: tab.id, url };
  const title = tabTitleFor(url, tab.title);
  if (title !== undefined) info.title = title;
  return info;
}

async function openTabs(): Promise<TabInfo[]> {
  const tabs = await chrome.tabs.query({});
  return tabs.map(toTabInfo).filter((t): t is TabInfo => t !== null);
}

const connection = new PluginConnection({
  url: `ws://127.0.0.1:${WS_PORT}`,
  onOpen: () => {
    connection.send({
      type: "hello",
      protocolVersion: PROTOCOL_VERSION,
      extensionVersion: chrome.runtime.getManifest().version,
      features: [FEATURES.openYouTubeTv, FEATURES.focus, FEATURES.openService],
    });
    enqueue(async () => {
      connection.send(toStateMessage(state));
    });
  },
  onMessage: (message: PluginMessage) => {
    switch (message.type) {
      case "requestState":
        enqueue(async () => {
          connection.send(toStateMessage(state));
        });
        break;
      case "solo":
      case "toggleMuteAll":
        dispatch(message);
        break;
      case "openYouTubeTv":
        enqueue(async () => {
          // A new tab with no free slot would play with sound; the plugin checks this too.
          if (state.tabs.length < MAX_SLOTS) {
            await openPage(chrome, SERVICES.youtubeTv.homeUrl, message.target);
          }
        });
        break;
      case "openService":
        enqueue(async () => {
          if (state.tabs.length < MAX_SLOTS) {
            await openPage(chrome, SERVICES[message.service].homeUrl, message.target);
          }
        });
        break;
      case "openOptions":
        enqueue(() => chrome.runtime.openOptionsPage());
        break;
      case "focus":
        enqueue(async () => {
          const tab = state.tabs.find((t) => t.slot === message.slot);
          if (tab) await focusTab(chrome, tab.tabId);
        });
        break;
    }
  },
});

// Events are processed one at a time, after the saved state has been loaded.
let queue: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): void {
  queue = queue.then(task).catch((err) => console.error("[yttv-multiview]", err));
}

function dispatch(event: EngineEvent, broadcast = false): void {
  enqueue(async () => {
    const result = reduce(state, event);
    state = result.state;
    // A tab may close between the event and the update; ignore those failures.
    await Promise.all(
      result.effects.map((e) => chrome.tabs.update(e.tabId, { muted: e.muted }).catch(() => {})),
    );
    if (result.changed || broadcast) {
      await chrome.storage.session.set({ [STORAGE_KEY]: state });
      connection.send(toStateMessage(state));
    }
  });
}

// Listeners must be registered synchronously so Chrome can wake the worker for them.
chrome.tabs.onCreated.addListener((tab) => {
  const info = toTabInfo(tab);
  if (info) dispatch({ type: "tabUpdated", tab: info });
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.url === undefined && changeInfo.title === undefined) return;
  const info = toTabInfo(tab);
  if (!info) return;
  // A title change matters only where the tab title is the program title.
  if (changeInfo.url === undefined && info.title === undefined) return;
  dispatch({ type: "tabUpdated", tab: info });
});

chrome.tabs.onRemoved.addListener((tabId) => dispatch({ type: "tabRemoved", tabId }));

// Program titles reported by the content scripts (src/content.ts, src/paramount-content.ts), on
// pages whose tab title doesn't name the program.
chrome.runtime.onMessage.addListener((message: unknown, sender) => {
  if (sender.id !== chrome.runtime.id || !sender.tab || !isPageTitleMessage(message)) return;
  const info = toTabInfo(sender.tab);
  if (!info || serviceForUrl(info.url)?.titleSource !== "content") return;
  dispatch({ type: "tabUpdated", tab: { ...info, title: message.title } });
});

// The options page turned services on or off.
chrome.storage.onChanged.addListener((changes, areaName) => {
  const change = changes[SERVICES_KEY];
  if (areaName !== "local" || !change) return;
  enqueue(async () => {
    const enabled = await checkServices(enabledServicesFrom(change.newValue));
    await reconcileParamountScript(enabled);
    dispatch({ type: "servicesChanged", enabled, tabs: await openTabs() });
  });
});

// Access to Paramount+ was revoked in Chrome's settings: turn it off. The resulting storage
// change unregisters its content script and frees its tabs.
chrome.permissions.onRemoved.addListener((removed) => {
  if (!removed.origins?.some((o) => PARAMOUNT_ORIGINS.includes(o))) return;
  enqueue(() => setServiceEnabled("paramountPlus", false));
});

const paramountGranted = () => chrome.permissions.contains({ origins: PARAMOUNT_ORIGINS });

/**
 * Paramount+ counts as on only while its host access is granted. If the saved list says
 * otherwise, saves the corrected list (which comes back through storage.onChanged).
 */
async function checkServices(enabled: ServiceId[]): Promise<ServiceId[]> {
  if (!enabled.includes("paramountPlus") || (await paramountGranted())) return enabled;
  const corrected = enabled.filter((s) => s !== "paramountPlus");
  await setServiceEnabled("paramountPlus", false);
  return corrected;
}

/** True once this worker has injected the Paramount+ script into already-open tabs. */
let paramountInjected = false;

/**
 * Registers the Paramount+ live content script while Paramount+ is on, and unregisters it when
 * it is off. A new registration is also injected into live tabs that are already open, since
 * registered scripts only run on pages loaded afterwards.
 */
async function reconcileParamountScript(enabled: readonly ServiceId[]): Promise<void> {
  const want = enabled.includes("paramountPlus");
  try {
    const registered = await chrome.scripting.getRegisteredContentScripts({
      ids: [PARAMOUNT_SCRIPT_ID],
    });
    if (want && registered.length === 0) {
      await chrome.scripting.registerContentScripts([
        {
          id: PARAMOUNT_SCRIPT_ID,
          matches: PARAMOUNT_LIVE_MATCHES,
          js: ["paramount-content.js"],
          runAt: "document_idle",
        },
      ]);
      await inject(PARAMOUNT_LIVE_MATCHES, "paramount-content.js");
      paramountInjected = true;
    } else if (!want && registered.length > 0) {
      await chrome.scripting.unregisterContentScripts({ ids: [PARAMOUNT_SCRIPT_ID] });
    }
  } catch (err) {
    // Tracking still works without the script; live titles are missing until the next try.
    console.warn("[yttv-multiview] Paramount+ content script", err);
  }
}

async function inject(matches: string[], file: string): Promise<void> {
  const tabs = await chrome.tabs.query({ url: matches });
  for (const tab of tabs) {
    if (tab.id === undefined) continue;
    chrome.scripting
      .executeScript({ target: { tabId: tab.id }, files: [file] })
      .catch((err) => console.warn("[yttv-multiview] inject failed", tab.id, err));
  }
}

// Content scripts are not injected into tabs that were already open when the extension was
// installed or reloaded, so inject them by hand. Queued after startup, which may already have
// injected the Paramount+ script while registering it.
chrome.runtime.onInstalled.addListener(() => {
  enqueue(async () => {
    await inject(["https://tv.youtube.com/*"], "content.js");
    if (!paramountInjected && state.enabledServices.includes("paramountPlus")) {
      await inject(PARAMOUNT_LIVE_MATCHES, "paramount-content.js");
    }
  });
});

// The worker sleeps when idle and nothing is connected. The alarm wakes it periodically
// so it can reconnect after the Stream Deck app starts.
chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === KEEPALIVE_ALARM) connection.ensureConnected();
});

// Startup: restore saved state and the enabled services (checked against Paramount+ access, with
// its content script registered to match), reconcile them with the tabs that are open now, then
// connect.
enqueue(async () => {
  const saved = await chrome.storage.session.get(STORAGE_KEY);
  const enabled = await checkServices(await loadServices());
  await reconcileParamountScript(enabled);
  state = { ...restoreState(saved[STORAGE_KEY]), enabledServices: enabled };
});
enqueue(async () => {
  dispatch({ type: "sync", tabs: await openTabs() }, true);
});
connection.start();
