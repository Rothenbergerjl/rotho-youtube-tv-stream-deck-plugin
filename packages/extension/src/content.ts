// Content script on tv.youtube.com: reports the program title to the service worker whenever
// it changes. YouTube TV is a single-page app, so changes are detected with a MutationObserver.
import { extractPageTitle, type PageTitleMessage } from "./page-title";

const THROTTLE_MS = 500;

let lastTitle: string | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

function report(): void {
  const title = extractPageTitle(document, navigator.mediaSession?.metadata?.title);
  if (title === lastTitle) return;
  lastTitle = title;
  try {
    const message: PageTitleMessage = { type: "pageTitle", title };
    chrome.runtime.sendMessage(message).catch(() => {});
  } catch {
    // The extension was reloaded and this script is orphaned; a fresh copy gets injected.
    observer.disconnect();
  }
}

// Throttle rather than debounce: the player updates the DOM continuously while video plays,
// so a debounce would never fire.
const observer = new MutationObserver(() => {
  timer ??= setTimeout(() => {
    timer = undefined;
    report();
  }, THROTTLE_MS);
});
observer.observe(document.documentElement, {
  subtree: true,
  childList: true,
  characterData: true,
});

report();
