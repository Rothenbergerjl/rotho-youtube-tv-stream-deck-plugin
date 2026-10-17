// Reads the program title from a Paramount+ live page. The tab title there is only the channel
// (or just "On Paramount Plus"), so the title has to come from the player DOM.
// Selectors found by inspecting a live paramountplus.com/live-tv/stream/ page on 2026-10-17.

/** Program name, e.g. "Bologna vs. Inter". */
export const PROGRAM_SELECTOR = "main .video__player-area .video__metadata p";

/** Channel name, e.g. "Serie A". */
export const CHANNEL_SELECTOR = ".skin-metadata-manager-title";

/** Path prefix of live player pages; the script also stays on other /live-tv/ pages. */
export const LIVE_STREAM_PATH = "/live-tv/stream/";

const text = (root: Pick<ParentNode, "querySelector">, selector: string): string =>
  root.querySelector(selector)?.textContent?.replace(/\s+/g, " ").trim() ?? "";

/**
 * Returns `<program> (<channel>)`, so the title parser gets the channel as a league hint; just
 * the program or just the channel when only one is shown; "" when neither is. Returns null off
 * live player pages, where nothing is reported.
 */
export function extractParamountTitle(
  root: Pick<ParentNode, "querySelector">,
  pathname: string,
): string | null {
  if (!pathname.startsWith(LIVE_STREAM_PATH)) return null;
  const program = text(root, PROGRAM_SELECTOR);
  const channel = text(root, CHANNEL_SELECTOR);
  if (program && channel && program !== channel) return `${program} (${channel})`;
  return program || channel;
}
