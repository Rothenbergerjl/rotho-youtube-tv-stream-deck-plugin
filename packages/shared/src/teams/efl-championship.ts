// EFL Championship, 2025–26 clubs, plus Cardiff, Luton and Plymouth (recently in the division).
// Source: efl.com/clubs. Shares the "europe" pool with the Premier League, so FA Cup and League
// Cup ties and promoted clubs resolve whichever table a club is in.
// Colors: crest and home-kit colors; approximate, since most clubs don't publish hex values.
import type { League } from "./types";

export const EFL_CHAMPIONSHIP: League = {
  id: "efl-championship",
  sport: "soccer",
  pool: "europe",
  hints: ["EFL Championship", "Sky Bet Championship", "EFL", "FA Cup", "Carabao Cup", "EFL Cup"],
  teams: [
    { abbr: "BIR", names: ["Birmingham City", "Birmingham"], colors: ["#0033A0", "#FFFFFF"] },
    { abbr: "BLA", names: ["Blackburn Rovers", "Blackburn"], colors: ["#009EE0", "#FFFFFF"] },
    { abbr: "BRC", names: ["Bristol City"], colors: ["#E21F26", "#FFFFFF"] },
    { abbr: "CAR", names: ["Cardiff City", "Cardiff"], colors: ["#0070B5", "#D11524"] },
    { abbr: "CHA", names: ["Charlton Athletic", "Charlton"], colors: ["#D4021D", "#FFFFFF"] },
    { abbr: "COV", names: ["Coventry City", "Coventry"], colors: ["#59CBE8", "#FFFFFF"] },
    { abbr: "DER", names: ["Derby County"], colors: ["#FFFFFF", "#000000"] },
    { abbr: "HUL", names: ["Hull City"], colors: ["#F5A12D", "#000000"] },
    { abbr: "IPS", names: ["Ipswich Town", "Ipswich"], colors: ["#0044A9", "#FFFFFF"] },
    { abbr: "LEI", names: ["Leicester City", "Leicester"], colors: ["#003090", "#FDBE11"] },
    { abbr: "LUT", names: ["Luton Town", "Luton"], colors: ["#F78F1E", "#002D62"] },
    { abbr: "MID", names: ["Middlesbrough"], colors: ["#E21A23", "#FFFFFF"] },
    { abbr: "MIL", names: ["Millwall"], colors: ["#001D5E", "#FFFFFF"] },
    { abbr: "NOR", names: ["Norwich City", "Norwich"], colors: ["#FFF200", "#00A650"] },
    { abbr: "OXF", names: ["Oxford United"], colors: ["#FFD200", "#002A5C"] },
    { abbr: "PLY", names: ["Plymouth Argyle", "Plymouth"], colors: ["#005E3B", "#FFFFFF"] },
    { abbr: "POR", names: ["Portsmouth"], colors: ["#001489", "#FFFFFF"] },
    { abbr: "PNE", names: ["Preston North End", "Preston"], colors: ["#FFFFFF", "#1A2E5A"] },
    { abbr: "QPR", names: ["Queens Park Rangers", "QPR"], colors: ["#005CAB", "#FFFFFF"] },
    { abbr: "SHU", names: ["Sheffield United", "Sheffield Utd"], colors: ["#EE2737", "#000000"] },
    { abbr: "SHW", names: ["Sheffield Wednesday"], colors: ["#1D59AF", "#FFFFFF"] },
    { abbr: "SOU", names: ["Southampton"], colors: ["#D71920", "#FFFFFF"] },
    { abbr: "STK", names: ["Stoke City", "Stoke"], colors: ["#E03A3E", "#FFFFFF"] },
    { abbr: "SWA", names: ["Swansea City", "Swansea"], colors: ["#FFFFFF", "#000000"] },
    { abbr: "WAT", names: ["Watford"], colors: ["#FBEE23", "#ED2127"] },
    { abbr: "WBA", names: ["West Bromwich Albion", "West Brom"], colors: ["#122F67", "#FFFFFF"] },
    { abbr: "WRE", names: ["Wrexham"], colors: ["#C8102E", "#FFFFFF"] },
  ],
};
