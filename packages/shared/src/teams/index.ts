import { MLB } from "./mlb";
import { NBA } from "./nba";
import { NFL } from "./nfl";
import { NHL } from "./nhl";
import type { League } from "./types";
import { WNBA } from "./wnba";

export type { League, LeagueId, Sport, Team } from "./types";

/** Every league parseTitle knows about. */
export const LEAGUES: readonly League[] = [NFL, NBA, WNBA, MLB, NHL];
