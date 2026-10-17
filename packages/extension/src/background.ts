// Service worker: feeds Chrome tab events into the engine, applies mute changes, persists state,
// and keeps the Stream Deck plugin updated over the WebSocket connection.
import { FEATURES, PROTOCOL_VERSION, type PluginMessage, WS_PORT } from "@rotho/shared";
import { PluginConnection } from "./connection";
import {
  type EngineEvent,
  type EngineState,
  initialState,
  reduce,
  type TabInfo,
  toStateMessage,
} from "./engine";
import { isPageTitleMessage } from "./page-title";

const STORAGE_KEY = "engine";
const KEEPALIVE_ALARM = "keepalive";

let state: EngineState = initialState;

// Titles come only from the content script: document.title is "Home - YouTube TV" on every
// watch page, so the tab's own title is ignored.
const toTabInfo = (tab: chrome.tabs.Tab): TabInfo | null =>
  tab.id === undefined || tab.id === chrome.tabs.TAB_ID_NONE
    ? null
    : { tabId: tab.id, url: tab.url ?? tab.pendingUrl };

const connection = new PluginConnection({
  url: `ws://127.0.0.1:${WS_PORT}`,
  onOpen: () => {
    connection.send({
      type: "hello",
      protocolVersion: PROTOCOL_VERSION,
      extensionVersion: chrome.runtime.getManifest().version,
      features: [FEATURES.openYouTubeTv, FEATURES.focus],
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
      case "focus":
        // Handled in a later phase; no key sends these yet.
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
  if (changeInfo.url === undefined) return;
  const info = toTabInfo(tab);
  if (info) dispatch({ type: "tabUpdated", tab: info });
});

chrome.tabs.onRemoved.addListener((tabId) => dispatch({ type: "tabRemoved", tabId }));

// Program titles reported by the content script (src/content.ts).
chrome.runtime.onMessage.addListener((message: unknown, sender) => {
  if (sender.id !== chrome.runtime.id || !sender.tab || !isPageTitleMessage(message)) return;
  const info = toTabInfo(sender.tab);
  if (info) dispatch({ type: "tabUpdated", tab: { ...info, title: message.title } });
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

// Startup: restore saved state, reconcile it with the tabs that are open now, then connect.
enqueue(async () => {
  const saved = await chrome.storage.session.get(STORAGE_KEY);
  if (saved[STORAGE_KEY]) state = saved[STORAGE_KEY] as EngineState;
});
enqueue(async () => {
  const tabs = await chrome.tabs.query({});
  dispatch(
    { type: "sync", tabs: tabs.map(toTabInfo).filter((t): t is TabInfo => t !== null) },
    true,
  );
});
connection.start();
