// EFL Championship, 2025–26 clubs, plus Cardiff, Luton and Plymouth (recently in the division).
// Source: efl.com/clubs. Shares the "europe" pool with the Premier League, so FA Cup and League
// Cup ties and promoted clubs resolve whichever table a club is in.
import type { League } from "./types";

export const EFL_CHAMPIONSHIP: League = {
  id: "efl-championship",
  sport: "soccer",
  pool: "europe",
  hints: ["EFL Championship", "Sky Bet Championship", "EFL", "FA Cup", "Carabao Cup", "EFL Cup"],
  teams: [
    { abbr: "BIR", names: ["Birmingham City", "Birmingham"] },
    { abbr: "BLA", names: ["Blackburn Rovers", "Blackburn"] },
    { abbr: "BRC", names: ["Bristol City"] },
    { abbr: "CAR", names: ["Cardiff City", "Cardiff"] },
    { abbr: "CHA", names: ["Charlton Athletic", "Charlton"] },
    { abbr: "COV", names: ["Coventry City", "Coventry"] },
    { abbr: "DER", names: ["Derby County"] },
    { abbr: "HUL", names: ["Hull City"] },
    { abbr: "IPS", names: ["Ipswich Town", "Ipswich"] },
    { abbr: "LEI", names: ["Leicester City", "Leicester"] },
    { abbr: "LUT", names: ["Luton Town", "Luton"] },
    { abbr: "MID", names: ["Middlesbrough"] },
    { abbr: "MIL", names: ["Millwall"] },
    { abbr: "NOR", names: ["Norwich City", "Norwich"] },
    { abbr: "OXF", names: ["Oxford United"] },
    { abbr: "PLY", names: ["Plymouth Argyle", "Plymouth"] },
    { abbr: "POR", names: ["Portsmouth"] },
    { abbr: "PNE", names: ["Preston North End", "Preston"] },
    { abbr: "QPR", names: ["Queens Park Rangers", "QPR"] },
    { abbr: "SHU", names: ["Sheffield United", "Sheffield Utd"] },
    { abbr: "SHW", names: ["Sheffield Wednesday"] },
    { abbr: "SOU", names: ["Southampton"] },
    { abbr: "STK", names: ["Stoke City", "Stoke"] },
    { abbr: "SWA", names: ["Swansea City", "Swansea"] },
    { abbr: "WAT", names: ["Watford"] },
    { abbr: "WBA", names: ["West Bromwich Albion", "West Brom"] },
    { abbr: "WRE", names: ["Wrexham"] },
  ],
};
