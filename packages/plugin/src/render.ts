// Builds key images as SVG (144×144, the @2x key size) and returns them as data URLs.
import { formatMatchup } from "@rotho/shared";

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
};

export interface SlotKeyView {
  slot: number;
  connected: boolean;
  /** Raw title from the extension; undefined when the slot is empty. */
  title?: string;
  heard?: boolean;
}

export interface MuteAllKeyView {
  connected: boolean;
  allMuted: boolean;
  canRestore: boolean;
}

export function toDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function slotKeySvg(view: SlotKeyView): string {
  if (!view.connected) {
    return svg(
      colors.dimBackground,
      badge(view.slot, colors.dim),
      lines(["No", "Chrome"], colors.dim, 26),
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

export function muteAllKeySvg(view: MuteAllKeyView): string {
  if (!view.connected) {
    return svg(
      colors.dimBackground,
      speaker(SIZE / 2, 50, "off", colors.dim, 1.6),
      lines(["No Chrome"], colors.dim, 22, 112),
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

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
