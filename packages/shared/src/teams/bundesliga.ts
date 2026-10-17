// Bundesliga, 2025–26 clubs, plus Bochum and Holstein Kiel (relegated in 2025).
// Source: bundesliga.com/en/bundesliga/clubs.
import type { League } from "./types";

export const BUNDESLIGA: League = {
  id: "bundesliga",
  sport: "soccer",
  pool: "europe",
  hints: ["Bundesliga", "DFB-Pokal"],
  teams: [
    { abbr: "FCA", names: ["FC Augsburg", "Augsburg"] },
    { abbr: "BAY", names: ["Bayern Munich", "Bayern München", "FC Bayern", "Bayern"] },
    { abbr: "B04", names: ["Bayer Leverkusen", "Leverkusen"] },
    { abbr: "BOC", names: ["VfL Bochum", "Bochum"] },
    { abbr: "BVB", names: ["Borussia Dortmund", "Dortmund"] },
    { abbr: "BMG", names: ["Borussia Mönchengladbach", "Mönchengladbach", "Gladbach"] },
    { abbr: "SGE", names: ["Eintracht Frankfurt", "Frankfurt"] },
    { abbr: "SCF", names: ["SC Freiburg", "Freiburg"] },
    { abbr: "HSV", names: ["Hamburger SV", "Hamburg"] },
    { abbr: "HDH", names: ["1. FC Heidenheim", "Heidenheim"] },
    { abbr: "TSG", names: ["TSG Hoffenheim", "Hoffenheim"] },
    { abbr: "KIE", names: ["Holstein Kiel"] },
    { abbr: "KOE", names: ["1. FC Köln", "FC Köln", "Köln", "Cologne"] },
    { abbr: "RBL", names: ["RB Leipzig", "Leipzig"] },
    { abbr: "M05", names: ["Mainz 05", "Mainz"] },
    { abbr: "STP", names: ["FC St. Pauli", "St. Pauli"] },
    { abbr: "VFB", names: ["VfB Stuttgart", "Stuttgart"] },
    { abbr: "FCU", names: ["1. FC Union Berlin", "Union Berlin"] },
    { abbr: "SVW", names: ["Werder Bremen", "Bremen"] },
    { abbr: "WOB", names: ["VfL Wolfsburg", "Wolfsburg"] },
  ],
};
