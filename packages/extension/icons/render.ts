// Renders the extension icon PNGs from icon.svg. Used by build.mjs (Node strips the types) and
// the tests.
import { readFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

/** Icon sizes Chrome and the Web Store use; each maps to `icons/icon-<size>.png`. */
export const ICON_SIZES = [16, 48, 128] as const;

const svg = readFileSync(new URL("icon.svg", import.meta.url), "utf8");

/**
 * The 128px store icon keeps Chrome's recommended 16px transparent padding around the 96px
 * artwork. Smaller icons crop to the artwork so it stays legible in the toolbar.
 */
export function renderIcon(size: number): Buffer {
  const source = size === 128 ? svg : svg.replace('viewBox="0 0 128 128"', 'viewBox="16 16 96 96"');
  return new Resvg(source, { fitTo: { mode: "width", value: size } }).render().asPng();
}
