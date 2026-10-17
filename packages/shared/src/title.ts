// Shortens a YouTube TV program title so it fits on a 72×72 Stream Deck key.
import { LEAGUES, type League, type LeagueId, type Team } from "./teams";

/** Longest text kept for non-matchup titles (about two 8-character lines on a key). */
export const MAX_TITLE_LENGTH = 16;

/** One side of a matchup. */
export interface Side {
  /** Short code shown on the key, e.g. "BUF". */
  abbr: string;
  /** "<league>:<abbr>", e.g. "nfl:BUF", when the team came from a table. */
  teamId?: string;
}

export interface Matchup {
  league?: LeagueId;
  /** "@" for "at" titles (away team first); "v" for "vs" titles, in the order the title gives. */
  separator: "@" | "v";
  teams: readonly [Side, Side];
}

export interface ParsedTitle {
  /** Text for the key, e.g. "BUF @ LAR" or a shortened program title. */
  display: string;
  matchup?: Matchup;
}

interface Entry {
  league: League;
  team: Team;
}

/**
 * Lower-cases, strips accents and straightens apostrophes so "Atlético" matches "atletico" and
 * "A’s" matches "a's". Used for matching only.
 */
const fold = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").replace(/’/g, "'").toLowerCase();

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Alternation of `names`, longest first so "los angeles rams" wins over "rams". */
const alternation = (names: Iterable<string>) =>
  [...names]
    .sort((a, b) => b.length - a.length)
    .map(escape)
    .join("|");

// Whole words only: no letter or digit directly before or after.
const BEFORE = "(?<![\\p{L}\\p{N}])";
const AFTER = "(?![\\p{L}\\p{N}])";

/** Folded team name → every team that uses it. More than one entry means a collision. */
const entriesByName = new Map<string, Entry[]>();
/** Folded hint phrase → the leagues it points to. */
const leaguesByHint = new Map<string, LeagueId[]>();
for (const league of LEAGUES) {
  for (const team of league.teams) {
    for (const name of team.names) {
      const key = fold(name);
      entriesByName.set(key, [...(entriesByName.get(key) ?? []), { league, team }]);
    }
  }
  for (const hint of league.hints) {
    const key = fold(hint);
    leaguesByHint.set(key, [...(leaguesByHint.get(key) ?? []), league.id]);
  }
}

const teamPattern = alternation(entriesByName.keys());
const matchupPattern = new RegExp(
  `${BEFORE}(${teamPattern})\\s+(at|@|vs\\.?|v\\.?)\\s+(${teamPattern})${AFTER}`,
  "u",
);
const hintPattern = new RegExp(`${BEFORE}(${alternation(leaguesByHint.keys())})${AFTER}`, "gu");

/**
 * Parses a program title. A matchup anywhere in the title becomes "AWAY @ HOME" or "A v B", e.g.
 * "Monday Night Football: Buffalo Bills at Los Angeles Rams" → "BUF @ LAR", with the league and
 * team ids in `matchup`. Anything else is whitespace-normalised, has a trailing " - YouTube TV"
 * removed, and is cut to MAX_TITLE_LENGTH.
 */
export function parseTitle(raw: string): ParsedTitle {
  const text = raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ - YouTube TV$/i, "");

  const matchup = findMatchup(fold(text));
  if (matchup) {
    const [first, second] = matchup.teams;
    return { display: `${first.abbr} ${matchup.separator} ${second.abbr}`, matchup };
  }

  return {
    display:
      text.length > MAX_TITLE_LENGTH ? `${text.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…` : text,
  };
}

/** The key text for a title; see parseTitle. */
export function formatMatchup(raw: string): string {
  return parseTitle(raw).display;
}

/**
 * Resolves the first "X at Y" / "X vs Y" in a folded title. A league hint in the title limits the
 * candidates to that league; otherwise exactly one league must have both teams. Ambiguous or
 * unknown matchups return undefined rather than guessing.
 */
function findMatchup(folded: string): Matchup | undefined {
  const match = matchupPattern.exec(folded);
  if (!match) return undefined;

  const hinted = new Set(
    [...folded.matchAll(hintPattern)].flatMap((m) => leaguesByHint.get(m[1]!)!),
  );
  const candidates = (name: string) => {
    const entries = entriesByName.get(name)!;
    return hinted.size > 0 ? entries.filter((e) => hinted.has(e.league.id)) : entries;
  };
  const firsts = candidates(match[1]!);
  const seconds = candidates(match[3]!);
  const pairs = firsts.flatMap((a) =>
    seconds.filter((b) => b.league === a.league).map((b) => [a, b] as const),
  );
  if (pairs.length !== 1) return undefined;

  const [first, second] = pairs[0]!;
  const side = ({ league, team }: Entry): Side => ({
    abbr: team.abbr,
    teamId: `${league.id}:${team.abbr}`,
  });
  return {
    league: first.league.id,
    separator: match[2]!.startsWith("v") ? "v" : "@",
    teams: [side(first), side(second)],
  };
}
