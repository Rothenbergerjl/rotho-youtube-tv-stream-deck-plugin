// Bundesliga, 2025–26 clubs, plus Bochum and Holstein Kiel (relegated in 2025).
// Source: bundesliga.com/en/bundesliga/clubs.
// Colors: crest and home-kit colors; approximate, since most clubs don't publish hex values.
import type { League } from "./types";

export const BUNDESLIGA: League = {
  id: "bundesliga",
  sport: "soccer",
  pool: "europe",
  hints: ["Bundesliga", "DFB-Pokal"],
  teams: [
    { abbr: "FCA", names: ["FC Augsburg", "Augsburg"], colors: ["#BA3733", "#46714D"] },
    {
      abbr: "BAY",
      names: ["Bayern Munich", "Bayern München", "FC Bayern", "Bayern"],
      colors: ["#DC052D", "#0066B2"],
    },
    { abbr: "B04", names: ["Bayer Leverkusen", "Leverkusen"], colors: ["#E32221", "#000000"] },
    { abbr: "BOC", names: ["VfL Bochum", "Bochum"], colors: ["#005BA4", "#FFFFFF"] },
    { abbr: "BVB", names: ["Borussia Dortmund", "Dortmund"], colors: ["#FDE100", "#000000"] },
    {
      abbr: "BMG",
      names: ["Borussia Mönchengladbach", "Mönchengladbach", "Gladbach"],
      colors: ["#FFFFFF", "#00A650"],
    },
    { abbr: "SGE", names: ["Eintracht Frankfurt", "Frankfurt"], colors: ["#E1000F", "#000000"] },
    { abbr: "SCF", names: ["SC Freiburg", "Freiburg"], colors: ["#E2001A", "#000000"] },
    { abbr: "HSV", names: ["Hamburger SV", "Hamburg"], colors: ["#0A3F86", "#FFFFFF"] },
    { abbr: "HDH", names: ["1. FC Heidenheim", "Heidenheim"], colors: ["#E3000F", "#003B79"] },
    { abbr: "TSG", names: ["TSG Hoffenheim", "Hoffenheim"], colors: ["#1961B5", "#FFFFFF"] },
    { abbr: "KIE", names: ["Holstein Kiel"], colors: ["#004B9B", "#E30613"] },
    {
      abbr: "KOE",
      names: ["1. FC Köln", "FC Köln", "Köln", "Cologne"],
      colors: ["#FFFFFF", "#ED1C24"],
    },
    { abbr: "RBL", names: ["RB Leipzig", "Leipzig"], colors: ["#DD0741", "#001F47"] },
    { abbr: "M05", names: ["Mainz 05", "Mainz"], colors: ["#C3141E", "#FFFFFF"] },
    { abbr: "STP", names: ["FC St. Pauli", "St. Pauli"], colors: ["#624839", "#FFFFFF"] },
    { abbr: "VFB", names: ["VfB Stuttgart", "Stuttgart"], colors: ["#E32219", "#FFFFFF"] },
    { abbr: "FCU", names: ["1. FC Union Berlin", "Union Berlin"], colors: ["#D4011D", "#FFFFFF"] },
    { abbr: "SVW", names: ["Werder Bremen", "Bremen"], colors: ["#1D9053", "#FFFFFF"] },
    { abbr: "WOB", names: ["VfL Wolfsburg", "Wolfsburg"], colors: ["#65B32E", "#FFFFFF"] },
  ],
};
