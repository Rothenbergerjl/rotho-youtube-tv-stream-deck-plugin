// Builds key images as SVG (144×144, the @2x key size) and returns them as data URLs.
import { formatMatchup } from "@rotho/shared";
import type { UpdateTarget } from "./store";

const SIZE = 144;
const FONT = "Segoe UI, Arial, sans-serif";

const colors = {
  background: "#111418",
  backgroundHeard: "#0f2e1b",
  heard: "#22c55e",
  text: "#f5f5f5",
  dim: "#6b7280",
  dimBackground: "#0a0a0a",
  badge: "#2b3038",
  muted: "#ef4444",
  warning: "#f59e0b",
  update: "#3b82f6",
  play: "#ef4444",
};

export interface SlotKeyView {
  slot: number;
  connected: boolean;
  /** Raw title from the extension; undefined when the slot is empty. */
  title?: string;
  heard?: boolean;
  /** Protocol mismatch: the side to update. Shown instead of the game. */
  mismatch?: UpdateTarget;
  /** A newer plugin release exists: adds a small badge in the corner. */
  updateAvailable?: boolean;
}

export interface MuteAllKeyView {
  connected: boolean;
  allMuted: boolean;
  canRestore: boolean;
  mismatch?: UpdateTarget;
  updateAvailable?: boolean;
}

export interface OpenKeyView {
  connected: boolean;
  mismatch?: UpdateTarget;
  /** The connected extension doesn't list the `openYouTubeTv` feature: it needs updating. */
  featureMissing?: boolean;
  /** Every slot is taken, so a new game would go untracked. */
  full?: boolean;
  updateAvailable?: boolean;
}

export function toDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function slotKeySvg(view: SlotKeyView): string {
  return withUpdateBadge(slotKeyBody(view), view.updateAvailable);
}

export function muteAllKeySvg(view: MuteAllKeyView): string {
  return withUpdateBadge(muteAllKeyBody(view), view.updateAvailable);
}

export function openKeySvg(view: OpenKeyView): string {
  return withUpdateBadge(openKeyBody(view), view.updateAvailable);
}

function slotKeyBody(view: SlotKeyView): string {
  if (!view.connected) {
    return svg(
      colors.dimBackground,
      badge(view.slot, colors.dim),
      lines(["No", "Chrome"], colors.dim, 26),
    );
  }

  if (view.mismatch) {
    return svg(
      colors.dimBackground,
      badge(view.slot, colors.dim),
      warning(SIZE / 2, 48),
      lines(["Update", view.mismatch], colors.text, 24, 100),
    );
  }

  if (view.title === undefined) {
    // Empty slot: just the slot number, dimmed.
    return svg(
      colors.dimBackground,
      text(SIZE / 2, SIZE / 2 + 18, String(view.slot), colors.dim, 52),
    );
  }

  const heard = view.heard === true;
  const label = formatMatchup(view.title) || "YouTube TV";
  return svg(
    heard ? colors.backgroundHeard : colors.background,
    heard ? border(colors.heard) : "",
    badge(view.slot, heard ? colors.heard : colors.badge),
    speaker(SIZE - 30, 24, heard ? "on" : "off", heard ? colors.heard : colors.dim),
    lines(wrap(label), colors.text),
  );
}

function muteAllKeyBody(view: MuteAllKeyView): string {
  if (!view.connected) {
    return svg(
      colors.dimBackground,
      speaker(SIZE / 2, 50, "off", colors.dim, 1.6),
      lines(["No Chrome"], colors.dim, 22, 112),
    );
  }
  if (view.mismatch) {
    return svg(
      colors.dimBackground,
      warning(SIZE / 2, 48),
      lines(["Update", view.mismatch], colors.text, 24, 100),
    );
  }
  if (view.allMuted) {
    return svg(
      colors.background,
      speaker(SIZE / 2, 50, "off", colors.muted, 1.6),
      lines([view.canRestore ? "Restore" : "All muted"], colors.text, 22, 112),
    );
  }
  return svg(
    colors.background,
    speaker(SIZE / 2, 50, "on", colors.heard, 1.6),
    lines(["Mute all"], colors.text, 22, 112),
  );
}

function openKeyBody(view: OpenKeyView): string {
  if (!view.connected) {
    return svg(
      colors.dimBackground,
      play(SIZE / 2, 50, colors.dim),
      lines(["No Chrome"], colors.dim, 22, 112),
    );
  }
  const update = view.mismatch ?? (view.featureMissing ? "extension" : undefined);
  if (update) {
    return svg(
      colors.dimBackground,
      warning(SIZE / 2, 48),
      lines(["Update", update], colors.text, 24, 100),
    );
  }
  if (view.full) {
    return svg(
      colors.dimBackground,
      play(SIZE / 2, 50, colors.dim),
      lines(["Full"], colors.dim, 22, 112),
    );
  }
  return svg(
    colors.background,
    play(SIZE / 2, 50, colors.play, true),
    lines(["YouTube TV"], colors.text, 22, 112),
  );
}

/** Splits a label into at most two lines of about 9 characters, breaking on spaces. */
export function wrap(label: string, maxChars = 9): string[] {
  if (label.length <= maxChars) return [label];
  const words = label.split(" ");
  const result: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || !current) {
      current = candidate;
    } else {
      result.push(current);
      current = word;
    }
  }
  result.push(current);
  if (result.length <= 2) return result;
  return [
    result[0]!,
    `${result
      .slice(1)
      .join(" ")
      .slice(0, maxChars - 1)
      .trimEnd()}…`,
  ];
}

function svg(background: string, ...children: string[]): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">` +
    `<rect width="${SIZE}" height="${SIZE}" fill="${background}"/>` +
    children.join("") +
    `</svg>`
  );
}

function border(color: string): string {
  return `<rect x="4" y="4" width="${SIZE - 8}" height="${SIZE - 8}" rx="10" fill="none" stroke="${color}" stroke-width="8"/>`;
}

function badge(slot: number, color: string): string {
  return (
    `<circle cx="26" cy="26" r="17" fill="${color}"/>` + text(26, 34, String(slot), colors.text, 22)
  );
}

/** Centred text lines; font shrinks so the longest line fits the key width. */
function lines(textLines: string[], color: string, maxFont = 34, centerY = SIZE / 2 + 14): string {
  const longest = Math.max(1, ...textLines.map((l) => l.length));
  const font = Math.min(maxFont, Math.floor(128 / (longest * 0.58)));
  const lineHeight = Math.round(font * 1.15);
  const firstBaseline = centerY - ((textLines.length - 1) * lineHeight) / 2 + font * 0.35;
  return textLines
    .map((line, i) => text(SIZE / 2, Math.round(firstBaseline + i * lineHeight), line, color, font))
    .join("");
}

function text(x: number, y: number, value: string, color: string, size: number): string {
  return `<text x="${x}" y="${y}" fill="${color}" font-family="${FONT}" font-size="${size}" font-weight="700" text-anchor="middle">${escapeXml(value)}</text>`;
}

/** Speaker glyph centred at (cx, cy): sound waves when "on", a cross when "off". */
function speaker(cx: number, cy: number, mode: "on" | "off", color: string, scale = 1): string {
  const body = `<path d="M-14 -6 H-6 L4 -15 V15 L-6 6 H-14 Z" fill="${color}"/>`;
  const extra =
    mode === "on"
      ? `<path d="M9 -7 Q14 0 9 7 M13 -12 Q21 0 13 12" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
      : `<path d="M9 -6 L19 6 M19 -6 L9 6" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
  return `<g transform="translate(${cx} ${cy}) scale(${scale})">${body}${extra}</g>`;
}

/** Rounded play button centred at (cx, cy), with a small plus badge when `plus` is set. */
function play(cx: number, cy: number, color: string, plus = false): string {
  const badge = plus
    ? `<circle cx="34" cy="-22" r="13" fill="${colors.text}"/>` +
      `<path d="M34 -29 V-15 M27 -22 H41" stroke="${colors.background}" stroke-width="4" stroke-linecap="round"/>`
    : "";
  return (
    `<g transform="translate(${cx} ${cy})">` +
    `<rect x="-34" y="-24" width="68" height="48" rx="14" fill="${color}"/>` +
    `<path d="M-9 -13 L15 0 L-9 13 Z" fill="${color === colors.dim ? colors.dimBackground : colors.text}"/>` +
    badge +
    `</g>`
  );
}

/** Adds a blue up-arrow dot in the bottom-right corner when an update is available. */
function withUpdateBadge(image: string, show: boolean | undefined): string {
  if (!show) return image;
  const c = SIZE - 16;
  const badge =
    `<circle cx="${c}" cy="${c}" r="12" fill="${colors.update}"/>` +
    `<path d="M${c} ${c + 6} V${c - 5} M${c - 5} ${c} L${c} ${c - 6} L${c + 5} ${c}" fill="none" stroke="${colors.text}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  return image.replace(/<\/svg>$/, `${badge}</svg>`);
}

/** Warning triangle with an exclamation mark, centred at (cx, cy). */
function warning(cx: number, cy: number): string {
  return (
    `<g transform="translate(${cx} ${cy})">` +
    `<path d="M0 -20 L23 19 H-23 Z" fill="${colors.warning}" stroke="${colors.warning}" stroke-width="6" stroke-linejoin="round"/>` +
    `<rect x="-3" y="-9" width="6" height="16" rx="3" fill="${colors.dimBackground}"/>` +
    `<circle cx="0" cy="13" r="3.5" fill="${colors.dimBackground}"/>` +
    `</g>`
  );
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
