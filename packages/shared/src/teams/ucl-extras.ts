// Regular Champions League and Europa League clubs from outside the top-5 leagues, 2025–26.
// Source: uefa.com club pages. Also carries the European cup hints for the whole "europe" pool.
// Colors: crest and home-kit colors; approximate, since most clubs don't publish hex values.
import type { League } from "./types";

export const UCL_EXTRAS: League = {
  id: "ucl-extras",
  sport: "soccer",
  pool: "europe",
  hints: [
    "UEFA Champions League",
    "Champions League",
    "UCL",
    "UEFA Europa League",
    "Europa League",
    "Conference League",
    "UEFA Super Cup",
    "Scottish Premiership",
    "Eredivisie",
    "Primeira Liga",
  ],
  teams: [
    { abbr: "AJA", names: ["AFC Ajax", "Ajax"], colors: ["#D2122E", "#FFFFFF"] },
    { abbr: "BEN", names: ["SL Benfica", "Benfica"], colors: ["#E83030", "#FFFFFF"] },
    { abbr: "BOD", names: ["Bodø/Glimt", "Bodo/Glimt"], colors: ["#FFDD00", "#000000"] },
    { abbr: "BRU", names: ["Club Brugge", "Brugge"], colors: ["#0078C1", "#000000"] },
    { abbr: "CEL", names: ["Celtic"], colors: ["#018749", "#FFFFFF"] },
    {
      abbr: "COP",
      names: ["FC Copenhagen", "Copenhagen", "København"],
      colors: ["#FFFFFF", "#002E6D"],
    },
    { abbr: "DZG", names: ["Dinamo Zagreb"], colors: ["#0050A0", "#FFFFFF"] },
    { abbr: "FEN", names: ["Fenerbahçe"], colors: ["#002D72", "#FFED00"] },
    { abbr: "FEY", names: ["Feyenoord"], colors: ["#E30613", "#FFFFFF"] },
    { abbr: "GAL", names: ["Galatasaray"], colors: ["#A90432", "#FDB912"] },
    { abbr: "OLY", names: ["Olympiacos", "Olympiakos"], colors: ["#E2001A", "#FFFFFF"] },
    { abbr: "POR", names: ["FC Porto", "Porto"], colors: ["#004A99", "#FFFFFF"] },
    { abbr: "PSV", names: ["PSV Eindhoven", "PSV"], colors: ["#ED1C24", "#FFFFFF"] },
    { abbr: "RAN", names: ["Rangers"], colors: ["#1B458F", "#FFFFFF"] },
    {
      abbr: "RSB",
      names: ["Red Star Belgrade", "Crvena Zvezda", "Red Star"],
      colors: ["#E30613", "#FFFFFF"],
    },
    {
      abbr: "SAL",
      names: ["Red Bull Salzburg", "RB Salzburg", "Salzburg"],
      colors: ["#FFFFFF", "#E30613"],
    },
    { abbr: "SHA", names: ["Shakhtar Donetsk", "Shakhtar"], colors: ["#F58220", "#000000"] },
    { abbr: "SLA", names: ["Slavia Prague", "Slavia Praha"], colors: ["#E30613", "#FFFFFF"] },
    { abbr: "SPA", names: ["Sparta Prague", "Sparta Praha"], colors: ["#7C1E33", "#FFFFFF"] },
    { abbr: "SCP", names: ["Sporting CP", "Sporting Lisbon"], colors: ["#008057", "#FFFFFF"] },
    { abbr: "USG", names: ["Union Saint-Gilloise", "Union SG"], colors: ["#FFD700", "#0039A6"] },
    { abbr: "YBO", names: ["BSC Young Boys", "Young Boys"], colors: ["#FFDD00", "#000000"] },
  ],
};
