// Polls ESPN for the games in the slots and keeps a short timed history of each one's score, so a
// key can show the score as it was `delay` seconds ago. Failures are logged at info and ignored.
import { type Game, type Matchup, parseTitle } from "@rotho/shared";
import { type GameState, parseScoreboard, statusText } from "./espn";
import { type Feed, feedKey, feedsFor, feedUrl } from "./feeds";
import { matchEvent } from "./match";

/** What a key shows for a game at one moment. */
export interface ScoreSnapshot {
  eventId: string;
  state: GameState;
  /** Info band text, e.g. "Q4 2:08"; see statusText. */
  status: string;
  /** In the title's team order. */
  scores: [number, number];
  /** Index of the team with the ball or at bat. */
  possession?: 0 | 1;
}

export interface ScoreTrackerOptions {
  fetch?: typeof fetch;
  now?: () => number;
  logger?: { info(message: string): void };
  /** For kickoff times; the system zone when missing. */
  timeZone?: string;
}

/** ESPN's scoreboard cache refreshes about every 10 s, so checking more often gains little. */
export const LIVE_INTERVAL_MS = 7_000;
export const IDLE_INTERVAL_MS = 5 * 60_000;
/** A feed with no successful fetch for this long drops its scores. */
export const STALE_MS = 2 * 60_000;
/** Longest Score delay a key can choose. */
export const MAX_DELAY_MS = 90_000;

interface Tracked {
  title: string;
  matchup: Matchup;
  feeds: Feed[];
  /** The feed the game was found in; only that one is polled from then on. */
  feed?: string;
  /** Start of the matched event, ms since the epoch. */
  start?: number;
  /** Oldest first; a new entry is added only when the snapshot changes. */
  history: { at: number; snapshot: ScoreSnapshot }[];
}

interface FeedState {
  feed: Feed;
  nextAt: number;
  lastSuccess?: number;
}

export class ScoreTracker {
  private readonly slots = new Map<number, Tracked>();
  private readonly feeds = new Map<string, FeedState>();
  private readonly listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private polling = false;

  constructor(private readonly options: ScoreTrackerOptions = {}) {}

  private get now(): number {
    return this.options.now?.() ?? Date.now();
  }

  /**
   * Tracks the games whose titles name two table teams; others are ignored. A slot whose title
   * changes starts over. Polling starts for new feeds right away and stops when nothing is tracked.
   */
  setGames(games: readonly Game[]): void {
    const seen = new Set<number>();
    const added: Feed[] = [];
    for (const game of games) {
      if (this.slots.get(game.slot)?.title === game.title) {
        seen.add(game.slot);
        continue;
      }
      const matchup = parseTitle(game.title).matchup;
      const feeds = matchup ? feedsFor(matchup, game.title) : [];
      if (!matchup || feeds.length === 0) continue;
      this.slots.set(game.slot, { title: game.title, matchup, feeds, history: [] });
      seen.add(game.slot);
      added.push(...feeds);
    }
    for (const slot of this.slots.keys()) if (!seen.has(slot)) this.slots.delete(slot);
    this.syncFeeds();
    // A new game is looked up right away, even in a feed already on a timer.
    for (const feed of added) {
      const state = this.feeds.get(feedKey(feed));
      if (state) state.nextAt = Math.min(state.nextAt, this.now);
    }
    this.schedule();
  }

  /**
   * The newest snapshot at least `delayMs` old, or the oldest one when none is that old yet.
   * Undefined when the slot has no matched game or its feed has gone stale.
   */
  scoreFor(slot: number, delayMs: number): ScoreSnapshot | undefined {
    const tracked = this.slots.get(slot);
    if (!tracked?.feed || tracked.history.length === 0) return undefined;
    const lastSuccess = this.feeds.get(tracked.feed)?.lastSuccess;
    const now = this.now;
    if (lastSuccess === undefined || now - lastSuccess > STALE_MS) return undefined;
    const cutoff = now - delayMs;
    const shown = tracked.history.findLast((h) => h.at <= cutoff) ?? tracked.history[0]!;
    return shown.snapshot;
  }

  /** Called after a poll changes any snapshot; returns an unsubscribe function. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.slots.clear();
    this.feeds.clear();
  }

  /** Keeps a state for every feed some slot needs: its matched feed, or all candidates. */
  private syncFeeds(): void {
    const needed = new Map<string, Feed>();
    for (const tracked of this.slots.values()) {
      for (const feed of tracked.feeds) {
        const key = feedKey(feed);
        if (!tracked.feed || tracked.feed === key) needed.set(key, feed);
      }
    }
    for (const key of this.feeds.keys()) if (!needed.has(key)) this.feeds.delete(key);
    for (const [key, feed] of needed) {
      if (!this.feeds.has(key)) this.feeds.set(key, { feed, nextAt: this.now });
    }
  }

  private schedule(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.polling || this.feeds.size === 0) return;
    const next = Math.min(...[...this.feeds.values()].map((f) => f.nextAt));
    this.timer = setTimeout(() => void this.tick(), Math.max(0, next - this.now));
    this.timer.unref?.();
  }

  private async tick(): Promise<void> {
    this.timer = null;
    this.polling = true;
    const now = this.now;
    const due = [...this.feeds.entries()].filter(([, f]) => f.nextAt <= now);
    let changed: boolean;
    try {
      const results = await Promise.all(due.map(([key, f]) => this.poll(key, f)));
      changed = results.some(Boolean);
    } finally {
      this.polling = false;
    }
    this.syncFeeds();
    if (changed) for (const listener of this.listeners) listener();
    this.schedule();
  }

  /** Fetches one feed and updates the slots it serves; true when a snapshot changed. */
  private async poll(key: string, state: FeedState): Promise<boolean> {
    const { fetch: doFetch = fetch, logger } = this.options;
    let changed = false;
    try {
      const res = await doFetch(feedUrl(state.feed), {
        headers: { Accept: "application/json", "User-Agent": "rotho-yttv-multiview" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const events = parseScoreboard(await res.json());
      const now = this.now;
      state.lastSuccess = now;
      for (const [slot, tracked] of this.slots) {
        if (tracked.feed ? tracked.feed !== key : !tracked.feeds.some((f) => feedKey(f) === key)) {
          continue;
        }
        const game = matchEvent(tracked.matchup, events, now);
        if (!game) continue;
        if (!tracked.feed) {
          tracked.feed = key;
          logger?.info(`Scores: slot ${slot} is ESPN event ${game.event.id} in ${key}`);
        }
        tracked.start = game.event.start;
        const snapshot: ScoreSnapshot = {
          eventId: game.event.id,
          state: game.event.state,
          status: statusText(game.event, state.feed, {
            now,
            ...(this.options.timeZone && { timeZone: this.options.timeZone }),
          }),
          scores: game.scores,
          ...(game.possession !== undefined && { possession: game.possession }),
        };
        if (record(tracked, snapshot, now)) changed = true;
      }
    } catch (err) {
      logger?.info(`Scores: ${key} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    state.nextAt = this.now + (this.isLive(key) ? LIVE_INTERVAL_MS : IDLE_INTERVAL_MS);
    return changed;
  }

  /** A slot matched in this feed is live, or its scheduled start has come. */
  private isLive(key: string): boolean {
    const now = this.now;
    for (const tracked of this.slots.values()) {
      if (tracked.feed !== key) continue;
      const latest = tracked.history.at(-1)?.snapshot;
      if (latest?.state === "in") return true;
      if (latest?.state === "pre" && (tracked.start ?? Infinity) <= now) return true;
    }
    return false;
  }
}

/** Adds a snapshot when it differs from the latest and prunes what no delay can reach. */
function record(tracked: Tracked, snapshot: ScoreSnapshot, now: number): boolean {
  const latest = tracked.history.at(-1)?.snapshot;
  if (latest && latest.eventId !== snapshot.eventId) tracked.history = [];
  else if (latest && JSON.stringify(latest) === JSON.stringify(snapshot)) return false;
  tracked.history.push({ at: now, snapshot });
  // Keep the newest entry older than the longest delay, and everything after it.
  const reachable = tracked.history.findLastIndex((h) => h.at <= now - MAX_DELAY_MS);
  if (reachable > 0) tracked.history.splice(0, reachable);
  return true;
}
