// NBA, 2026–27 season. Source: nba.com/teams. Colors: each team's published brand palette.
import type { League } from "./types";

export const NBA: League = {
  id: "nba",
  sport: "basketball",
  hints: ["NBA", "NBA Basketball", "NBA Cup", "NBA Playoffs", "NBA Finals"],
  teams: [
    { abbr: "ATL", names: ["Atlanta Hawks", "Hawks"], colors: ["#E03A3E", "#C1D32F"] },
    { abbr: "BOS", names: ["Boston Celtics", "Celtics"], colors: ["#007A33", "#BA9653"] },
    { abbr: "BKN", names: ["Brooklyn Nets", "Nets"], colors: ["#000000", "#FFFFFF"] },
    { abbr: "CHA", names: ["Charlotte Hornets", "Hornets"], colors: ["#1D1160", "#00788C"] },
    { abbr: "CHI", names: ["Chicago Bulls", "Bulls"], colors: ["#CE1141", "#000000"] },
    {
      abbr: "CLE",
      names: ["Cleveland Cavaliers", "Cavaliers", "Cavs"],
      colors: ["#860038", "#FDBB30"],
    },
    {
      abbr: "DAL",
      names: ["Dallas Mavericks", "Mavericks", "Mavs"],
      colors: ["#00538C", "#002B5E"],
    },
    { abbr: "DEN", names: ["Denver Nuggets", "Nuggets"], colors: ["#0E2240", "#FEC524"] },
    { abbr: "DET", names: ["Detroit Pistons", "Pistons"], colors: ["#C8102E", "#1D42BA"] },
    { abbr: "GSW", names: ["Golden State Warriors", "Warriors"], colors: ["#1D428A", "#FFC72C"] },
    { abbr: "HOU", names: ["Houston Rockets", "Rockets"], colors: ["#CE1141", "#000000"] },
    { abbr: "IND", names: ["Indiana Pacers", "Pacers"], colors: ["#002D62", "#FDBB30"] },
    {
      abbr: "LAC",
      names: ["Los Angeles Clippers", "LA Clippers", "Clippers"],
      colors: ["#C8102E", "#1D428A"],
    },
    {
      abbr: "LAL",
      names: ["Los Angeles Lakers", "LA Lakers", "Lakers"],
      colors: ["#552583", "#FDB927"],
    },
    { abbr: "MEM", names: ["Memphis Grizzlies", "Grizzlies"], colors: ["#5D76A9", "#12173F"] },
    { abbr: "MIA", names: ["Miami Heat", "Heat"], colors: ["#98002E", "#F9A01B"] },
    { abbr: "MIL", names: ["Milwaukee Bucks", "Bucks"], colors: ["#00471B", "#EEE1C6"] },
    {
      abbr: "MIN",
      names: ["Minnesota Timberwolves", "Timberwolves", "Wolves"],
      colors: ["#0C2340", "#236192"],
    },
    { abbr: "NOP", names: ["New Orleans Pelicans", "Pelicans"], colors: ["#0C2340", "#C8102E"] },
    { abbr: "NYK", names: ["New York Knicks", "Knicks"], colors: ["#006BB6", "#F58426"] },
    { abbr: "OKC", names: ["Oklahoma City Thunder", "Thunder"], colors: ["#007AC1", "#EF3B24"] },
    { abbr: "ORL", names: ["Orlando Magic", "Magic"], colors: ["#0077C0", "#C4CED4"] },
    {
      abbr: "PHI",
      names: ["Philadelphia 76ers", "76ers", "Sixers"],
      colors: ["#006BB6", "#ED174C"],
    },
    { abbr: "PHX", names: ["Phoenix Suns", "Suns"], colors: ["#1D1160", "#E56020"] },
    {
      abbr: "POR",
      names: ["Portland Trail Blazers", "Trail Blazers", "Blazers"],
      colors: ["#E03A3E", "#000000"],
    },
    { abbr: "SAC", names: ["Sacramento Kings", "Kings"], colors: ["#5A2D81", "#63727A"] },
    { abbr: "SAS", names: ["San Antonio Spurs", "Spurs"], colors: ["#000000", "#C4CED4"] },
    { abbr: "TOR", names: ["Toronto Raptors", "Raptors"], colors: ["#CE1141", "#000000"] },
    // Purple and black from the 2025 rebrand; approximate, no published hex values.
    { abbr: "UTA", names: ["Utah Jazz", "Jazz"], colors: ["#3E2680", "#000000"] },
    { abbr: "WAS", names: ["Washington Wizards", "Wizards"], colors: ["#002B5C", "#E31837"] },
  ],
};
