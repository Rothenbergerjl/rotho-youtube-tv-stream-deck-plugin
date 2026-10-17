// Premier League, 2025–26 clubs. Source: premierleague.com/clubs. Promoted clubs not listed here
// are in efl-championship.ts; both tables share the "europe" pool, so either table works.
import type { League } from "./types";

export const EPL: League = {
  id: "epl",
  sport: "soccer",
  pool: "europe",
  hints: ["Premier League", "English Premier League", "EPL"],
  teams: [
    { abbr: "ARS", names: ["Arsenal"] },
    { abbr: "AVL", names: ["Aston Villa", "Villa"] },
    { abbr: "BOU", names: ["AFC Bournemouth", "Bournemouth"] },
    { abbr: "BRE", names: ["Brentford"] },
    { abbr: "BHA", names: ["Brighton & Hove Albion", "Brighton"] },
    { abbr: "BUR", names: ["Burnley"] },
    { abbr: "CHE", names: ["Chelsea"] },
    { abbr: "CRY", names: ["Crystal Palace"] },
    { abbr: "EVE", names: ["Everton"] },
    { abbr: "FUL", names: ["Fulham"] },
    { abbr: "LEE", names: ["Leeds United", "Leeds"] },
    { abbr: "LIV", names: ["Liverpool"] },
    { abbr: "MCI", names: ["Manchester City", "Man City"] },
    { abbr: "MUN", names: ["Manchester United", "Man United", "Man Utd"] },
    { abbr: "NEW", names: ["Newcastle United", "Newcastle"] },
    { abbr: "NFO", names: ["Nottingham Forest", "Nott'm Forest"] },
    { abbr: "SUN", names: ["Sunderland"] },
    { abbr: "TOT", names: ["Tottenham Hotspur", "Tottenham", "Spurs"] },
    { abbr: "WHU", names: ["West Ham United", "West Ham"] },
    { abbr: "WOL", names: ["Wolverhampton Wanderers", "Wolverhampton", "Wolves"] },
  ],
};
