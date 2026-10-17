// Shortens a YouTube TV program title so it fits on a 72×72 Stream Deck key.
import { LEAGUES, poolOf, SPORT_HINTS, type League, type LeagueId, type Team } from "./teams";

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
export const fold = (s: string) =>
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
/** Folded hint phrase → the pools it allows. */
const poolsByHint = new Map<string, string[]>();
const addHint = (hint: string, pool: string) => {
  const key = fold(hint);
  poolsByHint.set(key, [...(poolsByHint.get(key) ?? []), pool]);
};
for (const league of LEAGUES) {
  for (const team of league.teams) {
    for (const name of team.names) {
      const key = fold(name);
      entriesByName.set(key, [...(entriesByName.get(key) ?? []), { league, team }]);
    }
  }
  for (const hint of league.hints) addHint(hint, poolOf(league));
  for (const hint of SPORT_HINTS[league.sport] ?? []) addHint(hint, poolOf(league));
}

const teamPattern = alternation(entriesByName.keys());
const matchupPattern = new RegExp(
  `${BEFORE}(${teamPattern})\\s+(at|@|vs\\.?|v\\.?)\\s+(${teamPattern})${AFTER}`,
  "u",
);
const hintPattern = new RegExp(`${BEFORE}(${alternation(poolsByHint.keys())})${AFTER}`, "gu");

/** Words that mark a title as sports, so an "X at Y" between unknown teams may be a matchup. */
const SPORT_WORDS = [
  "Football",
  "Basketball",
  "Baseball",
  "Softball",
  "Hockey",
  "Soccer",
  "Fútbol",
  "Volleyball",
  "NCAA",
  "College",
];
const sportPattern = new RegExp(`${BEFORE}(?:${alternation(SPORT_WORDS.map(fold))})${AFTER}`, "u");

/** A generic side with one of these words is a show, not a team ("Live at Noon"). */
const NOT_TEAM_WORDS = new Set(
  [
    "Live",
    "News",
    "Show",
    "Today",
    "Tonight",
    "Report",
    "Noon",
    "Night",
    "Final",
    "Pregame",
    "Postgame",
    "Highlights",
    "Countdown",
    "Kickoff",
    "GameDay",
    "Preview",
    "Recap",
    "Center",
    "Studio",
    "Films",
    "Presents",
    "Midnight",
    "Halftime",
  ].map(fold),
);

/** Leading words skipped when shortening an unknown team. */
const SKIP_WORDS = new Set(["the", "university", "of", "st.", "st"]);

// Hint phrases are cut out before generic matching, so "College Basketball: Gonzaga at Baylor"
// can't take "Basketball" as part of the first team. Original and folded spellings both match.
const hintPhrases = new Set(
  LEAGUES.flatMap((l) => [...l.hints, ...(SPORT_HINTS[l.sport] ?? [])])
    .map((h) => [h, fold(h)])
    .flat(),
);
const stripPattern = new RegExp(`${BEFORE}(?:${alternation(hintPhrases)})${AFTER}`, "giu");

// A generic side is 1–5 capitalised words with no digits, e.g. "Saint Mary's" or "Texas A&M".
const WORD = "\\p{Lu}[\\p{L}'’&.\\-]*";
const SIDE = `${WORD}(?: ${WORD}){0,4}`;
const genericPattern = new RegExp(
  `(?<![\\p{L}\\p{N}'’&.\\-])(${SIDE}) ([Aa][Tt]|@|[Vv][Ss]?\\.?) (${SIDE})${AFTER}`,
  "u",
);

/**
 * Parses a program title. A matchup anywhere in the title becomes "AWAY @ HOME" or "A v B", e.g.
 * "Monday Night Football: Buffalo Bills at Los Angeles Rams" → "BUF @ LAR", with the league and
 * team ids in `matchup` (see findMatchup for how teams are resolved).
 *
 * Any other title is whitespace-normalised and loses a trailing " - YouTube TV" and filler such as
 * "Live:" or "(New)". If it is still over MAX_TITLE_LENGTH, a "Series: Episode" title keeps just the
 * series, and the result is cut at a word boundary with "…" (mid-word only when the first word
 * alone is too long).
 */
export function parseTitle(raw: string): ParsedTitle {
  const text = raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ - YouTube TV$/i, "")
    .replace(/^(?:live|new)\s*:\s*/i, "")
    .replace(/\s*\((?:live|new)\)$/i, "");

  const matchup = findMatchup(text);
  if (matchup) {
    const [first, second] = matchup.teams;
    return { display: `${first.abbr} ${matchup.separator} ${second.abbr}`, matchup };
  }

  return { display: shorten(text) };
}

function shorten(text: string): string {
  if (text.length <= MAX_TITLE_LENGTH) return text;
  const series = text.split(": ")[0]!;
  if (series !== text && series.length > 0) return shorten(series);

  const cut = text.slice(0, MAX_TITLE_LENGTH - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** The key text for a title; see parseTitle. */
export function formatMatchup(raw: string): string {
  return parseTitle(raw).display;
}

/**
 * Finds the first "X at Y" / "X vs Y" in a title.
 *
 * 1. Both sides are table names: a league or sport hint limits the candidates to its pools, and
 *    exactly one pool must have both teams (a pool is one league, or a group of leagues whose
 *    teams meet, like European clubs). `league` is set when both teams share one.
 * 2. Both are table names but no single pool fits ("Giants at Cardinals"): each side shortens on
 *    its own, using its table code when it has just one candidate.
 * 3. Otherwise, only in a title with a hint or sport word, any two capitalised names shorten the
 *    same way ("College Basketball: Gonzaga at Saint Mary's" → "GONZ @ SAIN").
 */
function findMatchup(text: string): Matchup | undefined {
  const folded = fold(text);
  const hinted = new Set([...folded.matchAll(hintPattern)].flatMap((m) => poolsByHint.get(m[1]!)!));
  const candidates = (name: string) => {
    const entries = entriesByName.get(name) ?? [];
    return hinted.size > 0 ? entries.filter((e) => hinted.has(poolOf(e.league))) : entries;
  };
  const looseSide = (name: string): Side => {
    const entries = candidates(name);
    return entries.length === 1 ? tableSide(entries[0]!) : { abbr: genericAbbr(name) };
  };

  const match = matchupPattern.exec(folded);
  if (match) {
    const separator = toSeparator(match[2]!);
    const firsts = candidates(match[1]!);
    const seconds = candidates(match[3]!);
    const pairs = firsts.flatMap((a) =>
      seconds.filter((b) => poolOf(b.league) === poolOf(a.league)).map((b) => [a, b] as const),
    );
    if (pairs.length === 1) {
      const [first, second] = pairs[0]!;
      return {
        ...(first.league === second.league && { league: first.league.id }),
        separator,
        teams: [tableSide(first), tableSide(second)],
      };
    }
    return { separator, teams: [looseSide(match[1]!), looseSide(match[3]!)] };
  }

  if (hinted.size === 0 && !sportPattern.test(folded)) return undefined;
  const generic = genericPattern.exec(text.replace(stripPattern, " : ").replace(/\s+/g, " "));
  if (!generic) return undefined;
  const sides = [fold(generic[1]!), fold(generic[3]!)] as const;
  if (sides.some((s) => s.split(" ").some((w) => NOT_TEAM_WORDS.has(w)))) return undefined;
  return { separator: toSeparator(generic[2]!), teams: [looseSide(sides[0]), looseSide(sides[1])] };
}

function tableSide({ league, team }: Entry): Side {
  return { abbr: team.abbr, teamId: `${league.id}:${team.abbr}` };
}

const toSeparator = (word: string): Matchup["separator"] =>
  word.toLowerCase().startsWith("v") ? "v" : "@";

/** First meaningful word of a folded name, upper-cased, at most 4 letters: "wake forest" → "WAKE". */
function genericAbbr(name: string): string {
  const word = name.split(" ").find((w) => !SKIP_WORDS.has(w)) ?? name;
  return word
    .replace(/[^\p{L}]/gu, "")
    .toUpperCase()
    .slice(0, 4);
}
