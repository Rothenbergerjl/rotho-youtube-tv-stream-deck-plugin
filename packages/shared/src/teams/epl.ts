// Premier League, 2025–26 clubs. Source: premierleague.com/clubs. Promoted clubs not listed here
// are in efl-championship.ts; both tables share the "europe" pool, so either table works.
// Colors: crest and home-kit colors; approximate, since most clubs don't publish hex values.
import type { League } from "./types";

export const EPL: League = {
  id: "epl",
  sport: "soccer",
  pool: "europe",
  hints: ["Premier League", "English Premier League", "EPL"],
  teams: [
    { abbr: "ARS", names: ["Arsenal"], colors: ["#EF0107", "#063672"] },
    { abbr: "AVL", names: ["Aston Villa", "Villa"], colors: ["#670E36", "#95BFE5"] },
    { abbr: "BOU", names: ["AFC Bournemouth", "Bournemouth"], colors: ["#DA291C", "#000000"] },
    { abbr: "BRE", names: ["Brentford"], colors: ["#E30613", "#000000"] },
    { abbr: "BHA", names: ["Brighton & Hove Albion", "Brighton"], colors: ["#0057B8", "#FFFFFF"] },
    { abbr: "BUR", names: ["Burnley"], colors: ["#6C1D45", "#99D6EA"] },
    { abbr: "CHE", names: ["Chelsea"], colors: ["#034694", "#DBA111"] },
    { abbr: "CRY", names: ["Crystal Palace"], colors: ["#1B458F", "#C4122E"] },
    { abbr: "EVE", names: ["Everton"], colors: ["#003399", "#FFFFFF"] },
    { abbr: "FUL", names: ["Fulham"], colors: ["#FFFFFF", "#000000"] },
    { abbr: "LEE", names: ["Leeds United", "Leeds"], colors: ["#FFFFFF", "#1D428A"] },
    { abbr: "LIV", names: ["Liverpool"], colors: ["#C8102E", "#00B2A9"] },
    { abbr: "MCI", names: ["Manchester City", "Man City"], colors: ["#6CABDD", "#1C2C5B"] },
    {
      abbr: "MUN",
      names: ["Manchester United", "Man United", "Man Utd"],
      colors: ["#DA291C", "#FBE122"],
    },
    { abbr: "NEW", names: ["Newcastle United", "Newcastle"], colors: ["#241F20", "#FFFFFF"] },
    { abbr: "NFO", names: ["Nottingham Forest", "Nott'm Forest"], colors: ["#DD0000", "#FFFFFF"] },
    { abbr: "SUN", names: ["Sunderland"], colors: ["#EB172B", "#211E1E"] },
    {
      abbr: "TOT",
      names: ["Tottenham Hotspur", "Tottenham", "Spurs"],
      colors: ["#132257", "#FFFFFF"],
    },
    { abbr: "WHU", names: ["West Ham United", "West Ham"], colors: ["#7A263A", "#1BB1E7"] },
    {
      abbr: "WOL",
      names: ["Wolverhampton Wanderers", "Wolverhampton", "Wolves"],
      colors: ["#FDB913", "#231F20"],
    },
  ],
};
