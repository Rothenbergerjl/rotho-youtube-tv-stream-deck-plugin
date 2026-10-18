// Builds key images as SVG (144×144, the @2x key size) and returns them as data URLs.
import { formatMatchup, parseTitle, SERVICES, type ServiceId, teamColors } from "@rotho/shared";
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
  /** Text and glyphs on the green band of a heard scoreboard key. */
  heardInk: "#06210f",
  /** A score alert's flash; see flashFill for teams too close to it. */
  scoreFlash: "#ffe600",
};

/** A live score drawn in the scoreboard layout; see ScoreSnapshot in scores/tracker.ts. */
export interface ScoreView {
  state: "pre" | "in" | "post";
  /** Info band text, e.g. "Q4 2:08", "8:15P", "FINAL". */
  status: string;
  /** In the title's team order. */
  scores: readonly [number, number];
  /** Index of the team with the ball or at bat; drawn only while live. */
  possession?: 0 | 1;
  alert?: ScoreAlert;
}

/**
 * One frame of a score alert for `team`. Both modes show "+N ABBR" in the info band; "row" frames
 * blink that team's row and the band in the flash color (`on`), and "band" holds the band in that
 * team's color.
 */
export interface ScoreAlert {
  team: 0 | 1;
  points: number;
  mode: "row" | "band";
  on: boolean;
}

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
  /** Draw a known matchup in team colors; only `false` turns it off. */
  teamColors?: boolean;
  /** Service of the game in the slot; missing means YouTube TV. */
  service?: ServiceId;
  /** Live score; a matchup title with a score draws the scoreboard layout. */
  score?: ScoreView;
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
  /** Service the key opens (its Service setting); missing means YouTube TV. */
  service?: ServiceId;
  /**
   * The connected extension can't open this service (`openYouTubeTv`, or `openService` for the
   * others): it needs updating.
   */
  featureMissing?: boolean;
  /** The service is turned off in the extension; pressing opens its options page. */
  off?: boolean;
  /** Every slot is taken, so a new game would go untracked. */
  full?: boolean;
  updateAvailable?: boolean;
}

export interface FocusKeyView {
  connected: boolean;
  mismatch?: UpdateTarget;
  /** The connected extension doesn't list the `focus` feature: it needs updating. */
  featureMissing?: boolean;
  /** Raw title of the heard game; undefined when nothing is heard. */
  title?: string;
  updateAvailable?: boolean;
  /** Draw a known matchup in team colors; only `false` turns it off. */
  teamColors?: boolean;
  /** Service of the heard game; missing means YouTube TV. */
  service?: ServiceId;
}

export function toDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function slotKeySvg(view: SlotKeyView): string {
  return scoreboardKey(view) ?? withUpdateBadge(slotKeyBody(view), view.updateAvailable);
}

export function muteAllKeySvg(view: MuteAllKeyView): string {
  return withUpdateBadge(muteAllKeyBody(view), view.updateAvailable);
}

export function openKeySvg(view: OpenKeyView): string {
  return withUpdateBadge(openKeyBody(view), view.updateAvailable);
}

export function focusKeySvg(view: FocusKeyView): string {
  return withUpdateBadge(focusKeyBody(view), view.updateAvailable);
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
  const service = view.service ?? "youtubeTv";
  const split = view.teamColors === false ? undefined : teamSplit(view.title);
  if (split) {
    const tone = heard ? colors.heard : colors.text;
    return svg(
      split.fills[1],
      matchupSplit(split),
      heard ? border(colors.heard) : "",
      badge(view.slot, heard ? colors.heard : colors.badge),
      onDisc(SIZE - 28, 26, speaker(SIZE - 28, 26, heard ? "on" : "off", tone)),
      serviceBadge(service),
    );
  }
  const label = formatMatchup(view.title) || SERVICES[service].name;
  return svg(
    heard ? colors.backgroundHeard : colors.background,
    heard ? border(colors.heard) : "",
    badge(view.slot, heard ? colors.heard : colors.badge),
    speaker(SIZE - 30, 24, heard ? "on" : "off", heard ? colors.heard : colors.dim),
    // Raised from the key's centre so a second line clears the service badge.
    lines(wrap(label), colors.text, 34, SIZE / 2 - 2),
    serviceBadge(service),
  );
}

// Scoreboard layout: a 60 px row per team (abbreviation left, score right) around a 24 px info
// band with the slot, service, status and speaker.
const ROW_HEIGHT = 60;
const ROWS = [
  { top: 0, mid: 30 },
  { top: 84, mid: 114 },
] as const;
const BAND = { top: 60, height: 24, mid: 72 } as const;
const ROW_LEFT = 12;
const ROW_RIGHT = SIZE - 10;

/**
 * The scoreboard layout for a matchup with a score, or undefined to draw the normal key. Rows use
 * the team colors (dark when Team colors is off or the teams are unknown). A heard game turns the
 * band green instead of drawing the border; an update badge sits in the band, not the corner.
 */
function scoreboardKey(view: SlotKeyView): string | undefined {
  const { score } = view;
  if (!score || !view.connected || view.mismatch || view.title === undefined) return undefined;
  const matchup = parseTitle(view.title).matchup;
  if (!matchup) return undefined;
  const split = view.teamColors === false ? undefined : teamSplit(view.title);
  const fills: readonly [string, string] = split?.fills ?? [colors.background, colors.background];
  const abbrs = [matchup.teams[0].abbr, matchup.teams[1].abbr] as const;
  const { alert } = score;
  const pre = score.state === "pre";

  // Scores shrink for three digits; abbreviations shrink to clear the score and possession dot.
  const digits = Math.max(...score.scores.map((s) => String(s).length));
  const scoreFont = Math.min(42, Math.floor(70 / (digits * 0.6)));
  const scoreWidth = pre ? 0 : digits * 0.6 * scoreFont;
  const longest = Math.max(...abbrs.map((a) => a.length));
  const abbrRoom = ROW_RIGHT - ROW_LEFT - scoreWidth - 16;
  const abbrFont = Math.min(pre ? 30 : 24, Math.floor(abbrRoom / (longest * 0.62)));

  const rows = ROWS.map(({ top, mid }, i) => {
    const flash = alert?.mode === "row" && alert.on && alert.team === i;
    const fill = flash ? flashFill(fills[i]!) : fills[i]!;
    const ink = inkFor(fill);
    const abbr = abbrs[i]!;
    let row =
      `<rect y="${top}" width="${SIZE}" height="${ROW_HEIGHT}" fill="${fill}"/>` +
      text(ROW_LEFT, mid + Math.round(abbrFont * 0.37), abbr, ink, abbrFont, "start");
    if (!pre) {
      const own = score.scores[i]!;
      const lost = score.state === "post" && own < score.scores[1 - i]!;
      row += text(
        ROW_RIGHT,
        mid + Math.round(scoreFont * 0.36),
        String(own),
        ink,
        scoreFont,
        "end",
        lost ? 0.5 : undefined,
      );
    }
    if (score.state === "in" && score.possession === i) {
      const x = Math.round(ROW_LEFT + abbr.length * 0.62 * abbrFont + 8);
      row += `<circle cx="${x}" cy="${mid + 1}" r="4.5" fill="${ink}"/>`;
    }
    return row;
  });

  return svg(colors.background, ...rows, infoBand(view, score, fills, abbrs));
}

function infoBand(
  view: SlotKeyView,
  score: ScoreView,
  fills: readonly [string, string],
  abbrs: readonly [string, string],
): string {
  const callout = score.alert;
  const heard = view.heard === true && !callout;
  // The callout blinks with the row, then holds in the team's color.
  const lit = callout?.mode === "row" && callout.on;
  const fill = callout
    ? lit
      ? flashFill(fills[callout.team])
      : fills[callout.team]
    : heard
      ? colors.heard
      : colors.dimBackground;
  const ink = callout ? inkFor(fill) : heard ? colors.heardInk : colors.text;
  const glyph = callout ? ink : heard ? colors.heardInk : colors.dim;
  const { top, height, mid } = BAND;

  // The status is centred between the service monogram and the update badge or speaker.
  const left = 46;
  const right = view.updateAvailable ? 97 : 117;
  const status = callout ? `+${callout.points} ${abbrs[callout.team]}` : score.status;
  const font = Math.min(14, Math.floor((right - left) / (Math.max(1, status.length) * 0.6)));

  return (
    `<rect y="${top}" width="${SIZE}" height="${height}" fill="${fill}"/>` +
    `<circle cx="14" cy="${mid}" r="10" fill="${heard ? colors.heardInk : colors.badge}"/>` +
    text(14, mid + 5, String(view.slot), colors.text, 13) +
    monogram(35, mid, 8.5, view.service ?? "youtubeTv") +
    text((left + right) / 2, mid + Math.round(font * 0.36), status, ink, font) +
    (view.updateAvailable ? bandUpdateBadge(106, mid) : "") +
    speaker(127, mid, view.heard === true ? "on" : "off", glyph, 0.55)
  );
}

/** The blue up-arrow dot, small enough for the info band. */
function bandUpdateBadge(cx: number, cy: number): string {
  return (
    `<circle cx="${cx}" cy="${cy}" r="8" fill="${colors.update}"/>` +
    `<path d="M${cx} ${cy + 4} V${cy - 3.5} M${cx - 3.5} ${cy} L${cx} ${cy - 4} L${cx + 3.5} ${cy}" fill="none" stroke="${colors.text}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
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
  const service = view.service ?? "youtubeTv";
  if (view.off) {
    return svg(
      colors.dimBackground,
      monogram(SIZE / 2, 48, 28, service, true),
      lines(["Turn on"], colors.text, 22, 112),
    );
  }
  if (view.full) {
    return svg(
      colors.dimBackground,
      play(SIZE / 2, 50, colors.dim),
      lines(["Full"], colors.dim, 22, 112),
    );
  }
  // YouTube TV keeps the red play button it always had; other services use their badge color.
  const fill = service === "youtubeTv" ? colors.play : SERVICES[service].badge.color;
  return svg(
    colors.background,
    play(SIZE / 2, 50, fill, true),
    lines([SERVICES[service].name], colors.text, 22, 112),
  );
}

function focusKeyBody(view: FocusKeyView): string {
  if (!view.connected) {
    return svg(
      colors.dimBackground,
      target(SIZE / 2, 50, colors.dim, 1.6),
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
  if (view.title === undefined) {
    return svg(
      colors.dimBackground,
      target(SIZE / 2, 42, colors.dim, 1.3),
      lines(["Nothing", "heard"], colors.dim, 22, 102),
    );
  }
  const service = view.service ?? "youtubeTv";
  const split = view.teamColors === false ? undefined : teamSplit(view.title);
  if (split) {
    return svg(
      split.fills[1],
      matchupSplit(split),
      onDisc(26, 26, target(26, 26, colors.heard, 0.9)),
      serviceBadge(service),
    );
  }
  const label = formatMatchup(view.title) || SERVICES[service].name;
  return svg(
    colors.background,
    target(SIZE / 2, 28, colors.heard),
    // Smaller and higher than a Game Slot label so a second line clears the service badge.
    lines(wrap(label), colors.text, 26, 74),
    serviceBadge(service),
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

/** A matchup ready to draw in team colors: [first, second] for both arrays. */
export interface TeamSplit {
  abbrs: readonly [string, string];
  separator: "@" | "v";
  fills: readonly [string, string];
}

/**
 * The team-color view of a title, or undefined when it isn't a matchup or neither team has
 * colors. A side without colors gets the normal key background.
 */
export function teamSplit(title: string): TeamSplit | undefined {
  const matchup = parseTitle(title).matchup;
  if (!matchup) return undefined;
  const [first, second] = matchup.teams.map((side) =>
    side.teamId ? teamColors(side.teamId) : undefined,
  );
  if (!first && !second) return undefined;
  return {
    abbrs: [matchup.teams[0].abbr, matchup.teams[1].abbr],
    separator: matchup.separator,
    fills: pickFills(first, second),
  };
}

/**
 * Primaries for both halves. When the halves clash, the second team switches to its secondary,
 * or, if it has no colors, the first team does (a navy team next to the dark key background).
 */
export function pickFills(
  first: readonly [string, string] | undefined,
  second: readonly [string, string] | undefined,
): [string, string] {
  const top = first?.[0] ?? colors.background;
  const bottom = second?.[0] ?? colors.background;
  if (!tooClose(top, bottom)) return [top, bottom];
  if (second) return [top, second[1]];
  return [first![1], bottom];
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Colors closer than this (straight-line RGB distance) read as the same team on a key. */
const CLASH_DISTANCE = 90;

export function tooClose(a: string, b: string): boolean {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return Math.hypot(r1! - r2!, g1! - g2!, b1! - b2!) < CLASH_DISTANCE;
}

/** The alert flash over a team's `fill`: the flash color, or white when the team is too close to it. */
export function flashFill(fill: string): string {
  return tooClose(colors.scoreFlash, fill) ? colors.text : colors.scoreFlash;
}

/** WCAG relative luminance of "#RRGGBB": 0 for black, 1 for white. */
export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** Light or dark text, whichever has more contrast on `fill`. */
export function inkFor(fill: string): string {
  const l = luminance(fill);
  const contrast = (ink: string) => {
    const li = luminance(ink);
    return (Math.max(l, li) + 0.05) / (Math.min(l, li) + 0.05);
  };
  return contrast(colors.text) >= contrast(colors.background) ? colors.text : colors.background;
}

/**
 * Two team-colored halves with an abbreviation in each and the separator on the seam. Both
 * abbreviations sit right of centre, clear of the slot badge (top) and service badge (bottom).
 */
function matchupSplit({ abbrs, separator, fills }: TeamSplit): string {
  const half = SIZE / 2;
  const font = Math.min(30, Math.floor(84 / (Math.max(...abbrs.map((a) => a.length)) * 0.62)));
  return (
    `<rect width="${SIZE}" height="${half}" fill="${fills[0]}"/>` +
    text(half + 8, 60, abbrs[0], inkFor(fills[0]), font) +
    text(half + 10, 122, abbrs[1], inkFor(fills[1]), font) +
    `<circle cx="${half}" cy="${half}" r="11" fill="${colors.background}"/>` +
    text(half, half + 5, separator, colors.text, 14)
  );
}

/** Puts a glyph centred at (cx, cy) on a dark disc so it reads on any team color. */
function onDisc(cx: number, cy: number, glyph: string, r = 19): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${colors.background}" fill-opacity="0.85"/>${glyph}`;
}

/** The service's monogram disc in the bottom-left corner, on a dark disc like other corner glyphs. */
export function serviceBadge(service: ServiceId): string {
  const c = 22;
  return onDisc(c, SIZE - c, monogram(c, SIZE - c, 13, service), 17);
}

/** A service's monogram on a disc of its color, centred at (cx, cy); grey when `dim`. */
function monogram(cx: number, cy: number, r: number, service: ServiceId, dim = false): string {
  const { monogram: letters, color, text: ink } = SERVICES[service].badge;
  const font = Math.round(r * (letters.length > 1 ? 0.95 : 1.2));
  return (
    // The light ring keeps a black disc (Peacock) visible on dark backgrounds.
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${dim ? colors.badge : color}" stroke="${colors.dim}" stroke-width="1.5"/>` +
    text(cx, Math.round(cy + font * 0.36), letters, dim ? colors.dim : ink, font)
  );
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

function text(
  x: number,
  y: number,
  value: string,
  color: string,
  size: number,
  anchor: "start" | "middle" | "end" = "middle",
  opacity?: number,
): string {
  const fade = opacity === undefined ? "" : ` opacity="${opacity}"`;
  return `<text x="${x}" y="${y}" fill="${color}" font-family="${FONT}" font-size="${size}" font-weight="700" text-anchor="${anchor}"${fade}>${escapeXml(value)}</text>`;
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

/** Crosshair ("bring to front") glyph centred at (cx, cy). */
function target(cx: number, cy: number, color: string, scale = 1): string {
  return (
    `<g transform="translate(${cx} ${cy}) scale(${scale})">` +
    `<circle r="13" fill="none" stroke="${color}" stroke-width="3"/>` +
    `<circle r="4" fill="${color}"/>` +
    `<path d="M0 -20 V-15 M0 15 V20 M-20 0 H-15 M15 0 H20" stroke="${color}" stroke-width="3" stroke-linecap="round"/>` +
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
