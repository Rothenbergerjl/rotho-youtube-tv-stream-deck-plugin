// Team tables used by parseTitle to shorten matchups.

export type LeagueId =
  | "nfl"
  | "nba"
  | "wnba"
  | "mlb"
  | "nhl"
  | "epl"
  | "efl-championship"
  | "laliga"
  | "bundesliga"
  | "seriea"
  | "ligue1"
  | "ucl-extras"
  | "ligamx"
  | "intl";

export type Sport = "football" | "basketball" | "baseball" | "hockey" | "soccer";

export interface Team {
  /** Short code shown on the key, e.g. "BUF". Unique within its league. */
  abbr: string;
  /** Full name, nickname and any aliases, e.g. ["Buffalo Bills", "Bills"]. */
  names: readonly string[];
}

export interface League {
  id: LeagueId;
  sport: Sport;
  /**
   * Leagues whose teams play each other, e.g. every European club league (Champions League, cups,
   * promotion between tables). A matchup pairs two teams from one pool, and a hint for any league
   * in a pool allows the whole pool. Defaults to the league's own id.
   */
  pool?: string;
  /** Phrases that, found anywhere in a title, limit team matching to this league's pool. */
  hints: readonly string[];
  teams: readonly Team[];
}
