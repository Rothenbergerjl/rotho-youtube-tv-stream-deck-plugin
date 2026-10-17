import { NFL } from "./nfl";
import type { League } from "./types";

export type { League, LeagueId, Sport, Team } from "./types";

/** Every league parseTitle knows about. */
export const LEAGUES: readonly League[] = [NFL];
