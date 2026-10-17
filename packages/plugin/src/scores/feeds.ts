// Which ESPN scoreboard feeds can hold a matchup's game, by the leagues of its two teams.
import { fold, type LeagueId, type Matchup, poolOf, teamById } from "@rotho/shared";

export type ScoreSport = "football" | "basketball" | "baseball" | "hockey" | "soccer";

/** One ESPN scoreboard, e.g. `football/nfl`. */
export interface Feed {
  /** "<sport>/<league>" in ESPN's URL. */
  path: string;
  sport: ScoreSport;
  /** Extra query string, e.g. "groups=80" so college feeds list every top-division game. */
  query?: string;
  /** Games are played in two halves (men's college basketball). */
  halves?: boolean;
}

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";

export const feedUrl = (feed: Feed): string =>
  `${ESPN_BASE}/${feed.path}/scoreboard${feed.query ? `?${feed.query}` : ""}`;

/** Identifies a feed in maps and logs. */
export const feedKey = (feed: Feed): string => feed.path + (feed.query ? `?${feed.query}` : "");

const soccer = (path: string): Feed => ({ path: `soccer/${path}`, sport: "soccer" });

const COLLEGE_FOOTBALL: Feed = {
  path: "football/college-football",
  sport: "football",
  query: "groups=80",
};
const MENS_COLLEGE_BASKETBALL: Feed = {
  path: "basketball/mens-college-basketball",
  sport: "basketball",
  query: "groups=50",
  halves: true,
};
const WOMENS_COLLEGE_BASKETBALL: Feed = {
  path: "basketball/womens-college-basketball",
  sport: "basketball",
  query: "groups=50",
};

/** Champions League, Europa League and Conference League: any two European clubs can meet. */
const UEFA_CLUBS = ["uefa.champions", "uefa.europa", "uefa.europa.conf"].map(soccer);

/** Each league's own feeds: its league table plus domestic cups. */
const LEAGUE_FEEDS: Record<LeagueId, readonly Feed[]> = {
  nfl: [{ path: "football/nfl", sport: "football" }],
  nba: [{ path: "basketball/nba", sport: "basketball" }],
  wnba: [{ path: "basketball/wnba", sport: "basketball" }],
  mlb: [{ path: "baseball/mlb", sport: "baseball" }],
  nhl: [{ path: "hockey/nhl", sport: "hockey" }],
  ncaa: [COLLEGE_FOOTBALL, MENS_COLLEGE_BASKETBALL, WOMENS_COLLEGE_BASKETBALL],
  epl: ["eng.1", "eng.fa", "eng.league_cup"].map(soccer),
  "efl-championship": ["eng.2", "eng.fa", "eng.league_cup"].map(soccer),
  laliga: ["esp.1", "esp.copa_del_rey"].map(soccer),
  bundesliga: ["ger.1", "ger.dfb_pokal"].map(soccer),
  seriea: ["ita.1", "ita.coppa_italia"].map(soccer),
  ligue1: ["fra.1", "fra.coupe_de_france"].map(soccer),
  // Clubs from other European leagues only meet ours in UEFA competitions.
  "ucl-extras": [],
  ligamx: ["mex.1"].map(soccer),
  intl: [
    "fifa.world",
    "fifa.worldq.uefa",
    "fifa.worldq.concacaf",
    "fifa.worldq.conmebol",
    "uefa.euro",
    "uefa.nations",
    "conmebol.america",
    "concacaf.gold",
    "concacaf.nations.league",
    "fifa.friendly",
  ].map(soccer),
};

/**
 * College games narrowed by the title: "Women's College Basketball" → women's basketball,
 * "Men's …" or plain "Basketball" → basketball, "Football" → football, otherwise all three.
 */
function collegeFeeds(title: string): readonly Feed[] {
  const t = fold(title);
  if (/\bbasketball\b/.test(t)) {
    if (/\bwomen'?s\b/.test(t)) return [WOMENS_COLLEGE_BASKETBALL];
    if (/\bmen'?s\b/.test(t)) return [MENS_COLLEGE_BASKETBALL];
    return [MENS_COLLEGE_BASKETBALL, WOMENS_COLLEGE_BASKETBALL];
  }
  if (/\bfootball\b/.test(t)) return [COLLEGE_FOOTBALL];
  return LEAGUE_FEEDS.ncaa;
}

/**
 * The feeds to search for a matchup's game. Both sides must be table teams from one pool (a
 * league, or the European clubs); anything else returns no feeds, so the key keeps its plain look.
 */
export function feedsFor(matchup: Matchup, title: string): Feed[] {
  const [first, second] = matchup.teams.map((side) =>
    side.teamId ? teamById(side.teamId) : undefined,
  );
  if (!first || !second) return [];
  const pool = poolOf(first.league);
  if (poolOf(second.league) !== pool) return [];

  const feeds = [first.league, second.league].flatMap((league) =>
    league.id === "ncaa" ? collegeFeeds(title) : LEAGUE_FEEDS[league.id],
  );
  if (pool === "europe") feeds.push(...UEFA_CLUBS);

  const unique = new Map(feeds.map((feed) => [feedKey(feed), feed]));
  return [...unique.values()];
}
