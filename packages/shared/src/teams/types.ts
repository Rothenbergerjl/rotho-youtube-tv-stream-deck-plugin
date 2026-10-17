// Team tables used by parseTitle to shorten matchups.

export type LeagueId = "nfl";

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
  /** Phrases that, found anywhere in a title, limit team matching to this league. */
  hints: readonly string[];
  teams: readonly Team[];
}
