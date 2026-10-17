// Finds a slot's game among ESPN events by the names of its two teams.
import { fold, type Matchup, teamById } from "@rotho/shared";
import type { EspnEvent } from "./espn";

/** A matched event with its scores and possession in the title's team order. */
export interface MatchedGame {
  event: EspnEvent;
  scores: [number, number];
  /** Index into the title's teams; missing when ESPN doesn't say. */
  possession?: 0 | 1;
}

/** Events further than this from now are another day's game between the same teams. */
const MAX_START_DISTANCE = 18 * 60 * 60 * 1000;

/**
 * The event between the matchup's two table teams, in either order, starting within 18 hours of
 * `now`. ESPN abbreviations aren't used (they differ from ours, e.g. WSH for WAS); a team matches
 * when one of its table names equals ESPN's displayName, shortDisplayName or location, ignoring
 * case and accents. A live game wins over others, then the one starting closest to now (a
 * doubleheader).
 */
export function matchEvent(
  matchup: Matchup,
  events: readonly EspnEvent[],
  now: number,
): MatchedGame | undefined {
  const names = matchup.teams.map((side) => {
    const entry = side.teamId ? teamById(side.teamId) : undefined;
    return new Set(entry?.team.names.map(fold));
  });
  if (names.some((set) => set.size === 0)) return undefined;
  const isTeam = (index: number, espnNames: readonly string[]) =>
    espnNames.some((n) => names[index]!.has(fold(n)));

  const candidates = events.flatMap((event) => {
    if (Math.abs(event.start - now) > MAX_START_DISTANCE) return [];
    const [a, b] = event.competitors;
    const straight = isTeam(0, a.names) && isTeam(1, b.names);
    const swapped = isTeam(0, b.names) && isTeam(1, a.names);
    // Both orders fitting means the names can't tell the teams apart.
    if (straight === swapped) return [];
    const [first, second] = straight ? [a, b] : [b, a];
    const game: MatchedGame = { event, scores: [first.score, second.score] };
    if (event.possession === first.homeAway) game.possession = 0;
    else if (event.possession === second.homeAway) game.possession = 1;
    return [game];
  });

  const rank = (g: MatchedGame) =>
    (g.event.state === "in" ? 0 : MAX_START_DISTANCE * 2) + Math.abs(g.event.start - now);
  return candidates.sort((x, y) => rank(x) - rank(y))[0];
}
