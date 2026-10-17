// Service worker: feeds Chrome tab events into the engine, applies mute changes, persists state,
// and keeps the Stream Deck plugin updated over the WebSocket connection.
import {
  FEATURES,
  MAX_SLOTS,
  PROTOCOL_VERSION,
  type PluginMessage,
  SERVICES,
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
import { focusTab, openPage } from "./windows";

const STORAGE_KEY = "engine";
/** `chrome.storage.local` key the options page writes the enabled service ids to. */
const SERVICES_KEY = "services";
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

// Program titles reported by the content script (src/content.ts).
chrome.runtime.onMessage.addListener((message: unknown, sender) => {
  if (sender.id !== chrome.runtime.id || !sender.tab || !isPageTitleMessage(message)) return;
  const info = toTabInfo(sender.tab);
  if (info) dispatch({ type: "tabUpdated", tab: { ...info, title: message.title } });
});

// The options page turned services on or off.
chrome.storage.onChanged.addListener((changes, areaName) => {
  const change = changes[SERVICES_KEY];
  if (areaName !== "local" || !change) return;
  enqueue(async () => {
    dispatch({
      type: "servicesChanged",
      enabled: enabledServicesFrom(change.newValue),
      tabs: await openTabs(),
    });
  });
});

// Content scripts are not injected into tabs that were already open when the extension was
// installed or reloaded, so inject them by hand.
chrome.runtime.onInstalled.addListener(async () => {
  const tabs = await chrome.tabs.query({ url: "https://tv.youtube.com/*" });
  for (const tab of tabs) {
    if (tab.id === undefined) continue;
    chrome.scripting
      .executeScript({ target: { tabId: tab.id }, files: ["content.js"] })
      .catch((err) => console.warn("[yttv-multiview] inject failed", tab.id, err));
  }
});

// The worker sleeps when idle and nothing is connected. The alarm wakes it periodically
// so it can reconnect after the Stream Deck app starts.
chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === KEEPALIVE_ALARM) connection.ensureConnected();
});

// Startup: restore saved state and the enabled services, reconcile them with the tabs that are
// open now, then connect.
enqueue(async () => {
  const saved = await chrome.storage.session.get(STORAGE_KEY);
  const stored = await chrome.storage.local.get(SERVICES_KEY);
  state = {
    ...restoreState(saved[STORAGE_KEY]),
    enabledServices: enabledServicesFrom(stored[SERVICES_KEY]),
  };
});
enqueue(async () => {
  dispatch({ type: "sync", tabs: await openTabs() }, true);
});
connection.start();
