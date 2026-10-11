// Reads the current program title from a YouTube TV page. document.title is always
// "Home - YouTube TV" on watch pages, so the title has to come from the player DOM.
// Selectors found by inspecting a live tv.youtube.com watch page on 2026-10-11.

/** Checked in order; the first non-empty match wins. */
export const TITLE_SELECTORS = [
  // Full player title, e.g. "San Francisco 49ers at Seattle Seahawks".
  "h1.ypc-video-title .ypc-video-title-text",
  "h1.ypc-video-title",
  // Mini player shown while browsing other pages.
  "ytu-mini-player-info .ymp-primary-text",
] as const;

/** Message the content script sends to the service worker. */
export interface PageTitleMessage {
  type: "pageTitle";
  title: string;
}

export function isPageTitleMessage(value: unknown): value is PageTitleMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as PageTitleMessage).type === "pageTitle" &&
    typeof (value as PageTitleMessage).title === "string"
  );
}

/**
 * Returns the program title, falling back to the Media Session title (the channel name, e.g.
 * "FOX 59"), or "" when nothing is playing.
 */
export function extractPageTitle(
  root: Pick<ParentNode, "querySelector">,
  mediaSessionTitle?: string | null,
): string {
  for (const selector of TITLE_SELECTORS) {
    const text = root.querySelector(selector)?.textContent?.replace(/\s+/g, " ").trim();
    if (text) return text;
  }
  return mediaSessionTitle?.trim() ?? "";
}
