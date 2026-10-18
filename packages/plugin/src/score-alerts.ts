// Score alerts on a Game Slot key: when a score shown on the key goes up, the scoring team's row
// and the band's "+N ABBR" blink in the flash color, then the band holds "+N ABBR". Kept free of
// the Stream Deck SDK so it can be tested.
import type { ScoreAlert } from "./render";
import type { ScoreSnapshot } from "./scores/tracker";

/** Flash frames (lit on even frames), one every FRAME_MS. Even, so the flash ends unlit. */
export const ROW_FRAMES = 14;
export const FRAME_MS = 150;
/** How long the band callout stays after the row flash. */
export const CALLOUT_MS = 10_000;
const ALERT_MS = ROW_FRAMES * FRAME_MS + CALLOUT_MS;

/** What a key last showed for its game, and the alert it's running, if any. */
export interface KeyScoreState {
  eventId: string;
  scores: readonly [number, number];
  alert?: { team: 0 | 1; points: number; startedAt: number };
}

/**
 * The key's state after showing `snapshot` at `now`. An alert starts when either score goes up
 * from what the key last showed for the same game, never on its first snapshot, a different game,
 * or a decrease; the bigger gain picks the team. A new score restarts the alert, a finished one is
 * dropped, and turning alerts off drops it at once. No snapshot means no state, so a key that
 * loses its score (stale feed, Show score off) doesn't alert when the score comes back.
 */
export function nextScoreState(
  prev: KeyScoreState | undefined,
  snapshot: ScoreSnapshot | undefined,
  now: number,
  alertsOn: boolean,
): KeyScoreState | undefined {
  if (!snapshot) return undefined;
  const next: KeyScoreState = { eventId: snapshot.eventId, scores: snapshot.scores };
  if (!prev || prev.eventId !== snapshot.eventId || !alertsOn) return next;

  const gains = [0, 1].map((i) => snapshot.scores[i]! - prev.scores[i]!);
  const team: 0 | 1 = gains[1]! > gains[0]! ? 1 : 0;
  if (gains[team]! > 0) {
    next.alert = { team, points: gains[team]!, startedAt: now };
  } else if (prev.alert && now - prev.alert.startedAt < ALERT_MS) {
    next.alert = prev.alert;
  }
  return next;
}

/** The alert frame to draw at `now`, or undefined when there's no alert or it has finished. */
export function alertFrame(state: KeyScoreState | undefined, now: number): ScoreAlert | undefined {
  const alert = state?.alert;
  if (!alert) return undefined;
  const elapsed = now - alert.startedAt;
  const { team, points } = alert;
  if (elapsed < ROW_FRAMES * FRAME_MS) {
    return { team, points, mode: "row", on: Math.floor(elapsed / FRAME_MS) % 2 === 0 };
  }
  if (elapsed < ALERT_MS) return { team, points, mode: "band", on: true };
  return undefined;
}
