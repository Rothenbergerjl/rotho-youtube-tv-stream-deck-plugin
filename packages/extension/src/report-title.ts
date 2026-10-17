// Shared by the content scripts: reports the program title to the service worker whenever it
// changes. The players are single-page apps, so changes are detected with a MutationObserver.
import type { PageTitleMessage } from "./page-title";

const THROTTLE_MS = 500;

/** Starts reporting. `read` returns the current title, or null to report nothing for now. */
export function startTitleReporter(read: () => string | null): void {
  let lastTitle: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function report(): void {
    const title = read();
    // Forget the last title off player pages: coming back to one, the tab is tracked afresh
    // and needs the title again even if it didn't change.
    if (title === null) lastTitle = null;
    if (title === null || title === lastTitle) return;
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
}
