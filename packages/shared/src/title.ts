// Shortens a YouTube TV program title so it fits on a 72×72 Stream Deck key.

/** [abbreviation, full name, nickname] for every NFL team. Nicknames are unique. */
const NFL_TEAMS: readonly (readonly [string, string, string])[] = [
  ["ARI", "Arizona Cardinals", "Cardinals"],
  ["ATL", "Atlanta Falcons", "Falcons"],
  ["BAL", "Baltimore Ravens", "Ravens"],
  ["BUF", "Buffalo Bills", "Bills"],
  ["CAR", "Carolina Panthers", "Panthers"],
  ["CHI", "Chicago Bears", "Bears"],
  ["CIN", "Cincinnati Bengals", "Bengals"],
  ["CLE", "Cleveland Browns", "Browns"],
  ["DAL", "Dallas Cowboys", "Cowboys"],
  ["DEN", "Denver Broncos", "Broncos"],
  ["DET", "Detroit Lions", "Lions"],
  ["GB", "Green Bay Packers", "Packers"],
  ["HOU", "Houston Texans", "Texans"],
  ["IND", "Indianapolis Colts", "Colts"],
  ["JAX", "Jacksonville Jaguars", "Jaguars"],
  ["KC", "Kansas City Chiefs", "Chiefs"],
  ["LV", "Las Vegas Raiders", "Raiders"],
  ["LAC", "Los Angeles Chargers", "Chargers"],
  ["LAR", "Los Angeles Rams", "Rams"],
  ["MIA", "Miami Dolphins", "Dolphins"],
  ["MIN", "Minnesota Vikings", "Vikings"],
  ["NE", "New England Patriots", "Patriots"],
  ["NO", "New Orleans Saints", "Saints"],
  ["NYG", "New York Giants", "Giants"],
  ["NYJ", "New York Jets", "Jets"],
  ["PHI", "Philadelphia Eagles", "Eagles"],
  ["PIT", "Pittsburgh Steelers", "Steelers"],
  ["SF", "San Francisco 49ers", "49ers"],
  ["SEA", "Seattle Seahawks", "Seahawks"],
  ["TB", "Tampa Bay Buccaneers", "Buccaneers"],
  ["TEN", "Tennessee Titans", "Titans"],
  ["WAS", "Washington Commanders", "Commanders"],
];

/** Longest text kept for non-matchup titles (about two 8-character lines on a key). */
export const MAX_TITLE_LENGTH = 16;

const abbreviationByName = new Map<string, string>();
for (const [abbr, full, nickname] of NFL_TEAMS) {
  abbreviationByName.set(full.toLowerCase(), abbr);
  abbreviationByName.set(nickname.toLowerCase(), abbr);
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Longest names first so "Los Angeles Rams" wins over "Rams".
const teamPattern = [...abbreviationByName.keys()]
  .sort((a, b) => b.length - a.length)
  .map(escape)
  .join("|");
const matchupPattern = new RegExp(
  `(?:^|\\W)(${teamPattern})\\s+(at|@|vs\\.?|v\\.?)\\s+(${teamPattern})(?=$|\\W)`,
  "i",
);

/**
 * Turns an NFL matchup anywhere in the title into "AWAY @ HOME" (or "A vs B"), e.g.
 * "Monday Night Football: Buffalo Bills at Los Angeles Rams" → "BUF @ LAR". Anything else is
 * whitespace-normalised, has a trailing " - YouTube TV" removed, and is cut to MAX_TITLE_LENGTH.
 */
export function formatMatchup(raw: string): string {
  const text = raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ - YouTube TV$/i, "");

  const match = matchupPattern.exec(text);
  if (match) {
    const away = abbreviationByName.get(match[1]!.toLowerCase())!;
    const home = abbreviationByName.get(match[3]!.toLowerCase())!;
    const separator = /^v/i.test(match[2]!) ? "vs" : "@";
    return `${away} ${separator} ${home}`;
  }

  return text.length > MAX_TITLE_LENGTH
    ? `${text.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`
    : text;
}
