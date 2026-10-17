// Parses ESPN scoreboard JSON and turns a game's status into the short text on a key's info band.
// The feed is unofficial and undocumented, so anything unexpected is skipped rather than thrown.
import type { Feed } from "./feeds";

export type GameState = "pre" | "in" | "post";

export interface EspnCompetitor {
  id: string;
  homeAway: "home" | "away";
  score: number;
  /** displayName, shortDisplayName and location, e.g. "Georgia Bulldogs", "Georgia", "Georgia". */
  names: string[];
}

export interface EspnEvent {
  id: string;
  /** Start time, ms since the epoch. */
  start: number;
  state: GameState;
  /** ESPN's status name, e.g. "STATUS_IN_PROGRESS", "STATUS_HALFTIME". */
  statusName: string;
  period: number;
  /** "2:08", "45.2" or "67'". */
  clock: string;
  /** ESPN's short status, e.g. "2:08 - 4th", "Top 7th", "Final/OT". */
  detail: string;
  competitors: [EspnCompetitor, EspnCompetitor];
  /** The side with the ball (football) or at bat (baseball), when ESPN says. */
  possession?: "home" | "away";
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const isState = (v: unknown): v is GameState => v === "pre" || v === "in" || v === "post";

/** The events in a scoreboard response; malformed events are left out. */
export function parseScoreboard(json: unknown): EspnEvent[] {
  if (!isObj(json) || !Array.isArray(json.events)) return [];
  return json.events.flatMap((e) => {
    const event = parseEvent(e);
    return event ? [event] : [];
  });
}

function parseEvent(e: unknown): EspnEvent | undefined {
  if (!isObj(e) || !isObj(e.status) || !isObj(e.status.type)) return undefined;
  const { status } = e;
  const type = status.type as Obj;
  const start = Date.parse(str(e.date));
  if (!str(e.id) || Number.isNaN(start) || !isState(type.state)) return undefined;

  const competition = Array.isArray(e.competitions) ? e.competitions[0] : undefined;
  if (!isObj(competition) || !Array.isArray(competition.competitors)) return undefined;
  const competitors = competition.competitors.flatMap((c) => {
    const parsed = parseCompetitor(c);
    return parsed ? [parsed] : [];
  });
  if (competitors.length !== 2 || competitors[0]!.homeAway === competitors[1]!.homeAway) {
    return undefined;
  }

  const detail = str(type.shortDetail);
  const event: EspnEvent = {
    id: str(e.id),
    start,
    state: type.state,
    statusName: str(type.name),
    period: typeof status.period === "number" ? status.period : 0,
    clock: str(status.displayClock),
    detail,
    competitors: [competitors[0]!, competitors[1]!],
  };
  const possession = possessionOf(competition, event.competitors, detail);
  if (possession) event.possession = possession;
  return event;
}

function parseCompetitor(c: unknown): EspnCompetitor | undefined {
  if (!isObj(c) || !isObj(c.team)) return undefined;
  if (c.homeAway !== "home" && c.homeAway !== "away") return undefined;
  const score = Number(str(c.score) || 0);
  if (!Number.isFinite(score)) return undefined;
  const names = [c.team.displayName, c.team.shortDisplayName, c.team.location]
    .map(str)
    .filter(Boolean);
  if (names.length === 0) return undefined;
  return { id: str(c.id), homeAway: c.homeAway, score, names };
}

/** Football: `situation.possession` is a competitor id. Baseball: the half inning in the detail. */
function possessionOf(
  competition: Obj,
  competitors: readonly EspnCompetitor[],
  detail: string,
): "home" | "away" | undefined {
  const id = isObj(competition.situation) ? str(competition.situation.possession) : "";
  const holder = id ? competitors.find((c) => c.id === id) : undefined;
  if (holder) return holder.homeAway;
  if (/^Top\b/i.test(detail)) return "away";
  if (/^Bot(?:tom)?\b/i.test(detail)) return "home";
  return undefined;
}

const REGULATION_PERIODS: Record<Feed["sport"], number> = {
  football: 4,
  basketball: 4,
  baseball: 9,
  hockey: 3,
  soccer: 2,
};

function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/** "Q3", "2H", "P2", or "OT" / "2OT" past regulation. */
function periodLabel(feed: Feed, period: number): string {
  const regulation = feed.halves ? 2 : REGULATION_PERIODS[feed.sport];
  if (period > regulation) {
    const ot = period - regulation;
    return ot === 1 ? "OT" : `${ot}OT`;
  }
  if (feed.halves) return `${period}H`;
  return feed.sport === "hockey" ? `P${period}` : `Q${period}`;
}

export interface StatusOptions {
  /** Now, ms since the epoch; decides whether a kickoff is today. */
  now: number;
  /** IANA time zone for kickoff times; the system zone when missing. */
  timeZone?: string;
}

/**
 * The game status for the key's info band, at most 9 characters: "Q4 2:08", "2H 9:15", "P2 12:04",
 * "▲ 7th", "67'", "HALF", "HT", "END Q1", "FINAL", "F/OT", or the local kickoff time ("8:15P", or
 * "SUN 1:00P" on another day).
 */
export function statusText(event: EspnEvent, feed: Feed, options: StatusOptions): string {
  switch (event.statusName) {
    case "STATUS_POSTPONED":
      return "PPD";
    case "STATUS_CANCELED":
      return "CANC";
    case "STATUS_SUSPENDED":
      return "SUSP";
    case "STATUS_DELAYED":
    case "STATUS_RAIN_DELAY":
      return "DELAY";
  }

  if (event.state === "pre") return kickoff(event.start, options);

  if (event.state === "post") {
    if (feed.sport === "soccer") {
      if (/pen/i.test(event.detail)) return "F/PK";
      if (/aet/i.test(event.detail)) return "F/ET";
      return "FINAL";
    }
    const extra = /^Final\/(\w+)$/i.exec(event.detail);
    return extra ? `F/${extra[1]!.toUpperCase()}` : "FINAL";
  }

  if (event.statusName === "STATUS_HALFTIME") return feed.sport === "soccer" ? "HT" : "HALF";
  if (event.statusName === "STATUS_SHOOTOUT") return feed.sport === "soccer" ? "PENS" : "SO";

  if (feed.sport === "baseball") {
    const half = /^(Top|Bot|Bottom|Mid|Middle|End)\w*\s+(\d+)/i.exec(event.detail);
    if (!half) return event.period > 0 ? ordinal(event.period) : "LIVE";
    const inning = ordinal(Number(half[2]));
    const word = half[1]!.toLowerCase();
    if (word === "top") return `▲ ${inning}`;
    if (word.startsWith("bot")) return `▼ ${inning}`;
    return `${word.startsWith("mid") ? "MID" : "END"} ${inning}`;
  }

  if (feed.sport === "soccer") return event.clock || "LIVE";

  if (event.period < 1) return "LIVE";
  const label = periodLabel(feed, event.period);
  if (event.statusName === "STATUS_END_PERIOD") return `END ${label}`;
  return event.clock ? `${label} ${event.clock}` : label;
}

/** "8:15P" today, "SUN 1:00P" on another day, in the given (or system) time zone. */
function kickoff(start: number, { now, timeZone }: StatusOptions): string {
  const format = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...(timeZone && { timeZone }),
  });
  const parts = (ms: number) =>
    Object.fromEntries(format.formatToParts(ms).map((p) => [p.type, p.value]));
  const at = parts(start);
  const today = parts(now);
  const time = `${at.hour}:${at.minute}${at.dayPeriod?.startsWith("P") ? "P" : "A"}`;
  const sameDay = at.year === today.year && at.month === today.month && at.day === today.day;
  return sameDay ? time : `${at.weekday!.toUpperCase()} ${time}`;
}
