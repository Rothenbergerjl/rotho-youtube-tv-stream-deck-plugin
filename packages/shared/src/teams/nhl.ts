// NHL, 2026–27 season. Source: nhl.com/info/teams. Colors: each team's published brand palette.
import type { League } from "./types";

export const NHL: League = {
  id: "nhl",
  sport: "hockey",
  hints: [
    "NHL",
    "NHL Hockey",
    "Hockey Night in Canada",
    "Stanley Cup",
    "Winter Classic",
    "Stadium Series",
  ],
  teams: [
    { abbr: "ANA", names: ["Anaheim Ducks", "Ducks"], colors: ["#FC4C02", "#000000"] },
    { abbr: "BOS", names: ["Boston Bruins", "Bruins"], colors: ["#FFB81C", "#000000"] },
    { abbr: "BUF", names: ["Buffalo Sabres", "Sabres"], colors: ["#003087", "#FFB81C"] },
    { abbr: "CGY", names: ["Calgary Flames", "Flames"], colors: ["#C8102E", "#F1BE48"] },
    { abbr: "CAR", names: ["Carolina Hurricanes", "Hurricanes"], colors: ["#CE1126", "#000000"] },
    { abbr: "CHI", names: ["Chicago Blackhawks", "Blackhawks"], colors: ["#CF0A2C", "#000000"] },
    {
      abbr: "COL",
      names: ["Colorado Avalanche", "Avalanche", "Avs"],
      colors: ["#6F263D", "#236192"],
    },
    {
      abbr: "CBJ",
      names: ["Columbus Blue Jackets", "Blue Jackets"],
      colors: ["#002654", "#CE1126"],
    },
    { abbr: "DAL", names: ["Dallas Stars", "Stars"], colors: ["#006847", "#8F8F8C"] },
    { abbr: "DET", names: ["Detroit Red Wings", "Red Wings"], colors: ["#CE1126", "#FFFFFF"] },
    { abbr: "EDM", names: ["Edmonton Oilers", "Oilers"], colors: ["#041E42", "#FF4C00"] },
    { abbr: "FLA", names: ["Florida Panthers", "Panthers"], colors: ["#041E42", "#C8102E"] },
    {
      abbr: "LAK",
      names: ["Los Angeles Kings", "LA Kings", "Kings"],
      colors: ["#111111", "#A2AAAD"],
    },
    { abbr: "MIN", names: ["Minnesota Wild", "Wild"], colors: ["#154734", "#A6192E"] },
    {
      abbr: "MTL",
      names: ["Montréal Canadiens", "Canadiens", "Habs"],
      colors: ["#AF1E2D", "#192168"],
    },
    { abbr: "NSH", names: ["Nashville Predators", "Predators"], colors: ["#FFB81C", "#041E42"] },
    { abbr: "NJD", names: ["New Jersey Devils", "Devils"], colors: ["#CE1126", "#000000"] },
    { abbr: "NYI", names: ["New York Islanders", "Islanders"], colors: ["#00539B", "#F47D30"] },
    { abbr: "NYR", names: ["New York Rangers", "Rangers"], colors: ["#0038A8", "#CE1126"] },
    { abbr: "OTT", names: ["Ottawa Senators", "Senators"], colors: ["#DA1A32", "#000000"] },
    { abbr: "PHI", names: ["Philadelphia Flyers", "Flyers"], colors: ["#F74902", "#000000"] },
    { abbr: "PIT", names: ["Pittsburgh Penguins", "Penguins"], colors: ["#000000", "#FCB514"] },
    { abbr: "SJS", names: ["San Jose Sharks", "Sharks"], colors: ["#006D75", "#000000"] },
    { abbr: "SEA", names: ["Seattle Kraken", "Kraken"], colors: ["#001628", "#99D9D9"] },
    { abbr: "STL", names: ["St. Louis Blues", "Blues"], colors: ["#002F87", "#FCB514"] },
    { abbr: "TBL", names: ["Tampa Bay Lightning", "Lightning"], colors: ["#002868", "#FFFFFF"] },
    {
      abbr: "TOR",
      names: ["Toronto Maple Leafs", "Maple Leafs", "Leafs"],
      colors: ["#00205B", "#FFFFFF"],
    },
    // Rock Black and Mountain Blue; approximate.
    { abbr: "UTA", names: ["Utah Mammoth", "Mammoth"], colors: ["#010101", "#6CACE4"] },
    { abbr: "VAN", names: ["Vancouver Canucks", "Canucks"], colors: ["#00205B", "#00843D"] },
    {
      abbr: "VGK",
      names: ["Vegas Golden Knights", "Golden Knights"],
      colors: ["#B4975A", "#333F42"],
    },
    {
      abbr: "WSH",
      names: ["Washington Capitals", "Capitals", "Caps"],
      colors: ["#041E42", "#C8102E"],
    },
    { abbr: "WPG", names: ["Winnipeg Jets", "Jets"], colors: ["#041E42", "#004C97"] },
  ],
};
