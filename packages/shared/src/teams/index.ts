import { BUNDESLIGA } from "./bundesliga";
import { EFL_CHAMPIONSHIP } from "./efl-championship";
import { EPL } from "./epl";
import { LALIGA } from "./laliga";
import { LIGA_MX } from "./ligamx";
import { LIGUE_1 } from "./ligue1";
import { MLB } from "./mlb";
import { NATIONAL } from "./national";
import { NBA } from "./nba";
import { NCAA } from "./ncaa";
import { NFL } from "./nfl";
import { NHL } from "./nhl";
import { SERIE_A } from "./seriea";
import type { League, Sport, Team } from "./types";
import { UCL_EXTRAS } from "./ucl-extras";
import { WNBA } from "./wnba";

export type { League, LeagueId, Sport, Team } from "./types";

/** Every league parseTitle knows about. */
export const LEAGUES: readonly League[] = [
  NFL,
  NBA,
  WNBA,
  MLB,
  NHL,
  NCAA,
  EPL,
  EFL_CHAMPIONSHIP,
  LALIGA,
  BUNDESLIGA,
  SERIE_A,
  LIGUE_1,
  UCL_EXTRAS,
  LIGA_MX,
  NATIONAL,
];

/** Phrases that limit matching to every league of a sport, e.g. "Soccer: …". */
export const SPORT_HINTS: Partial<Record<Sport, readonly string[]>> = {
  soccer: ["Soccer", "Fútbol"],
};

/** The pool a league's teams are paired within; see League.pool. */
export const poolOf = (league: League): string => league.pool ?? league.id;

/** "<league>:<abbr>" (the Side.teamId format) → that team's colors. */
const colorsById = new Map<string, NonNullable<Team["colors"]>>(
  LEAGUES.flatMap((league) =>
    league.teams.flatMap((team) =>
      team.colors ? [[`${league.id}:${team.abbr}`, team.colors] as const] : [],
    ),
  ),
);

/** A team's [primary, secondary] colors by its teamId, e.g. "nfl:BUF"; undefined when unknown. */
export const teamColors = (teamId: string): Team["colors"] => colorsById.get(teamId);
