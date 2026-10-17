// WNBA, 2026 season, plus the Houston Comets (the Connecticut Sun's name from 2027).
// Source: wnba.com/teams; Sun relocation approved in 2026. Colors: each team's published brand
// palette; approximate for newer teams without published hex values (noted inline).
import type { League } from "./types";

export const WNBA: League = {
  id: "wnba",
  sport: "basketball",
  hints: ["WNBA", "WNBA Basketball", "WNBA Playoffs", "WNBA Finals", "Commissioner's Cup"],
  teams: [
    { abbr: "ATL", names: ["Atlanta Dream", "Dream"], colors: ["#C8102E", "#418FDE"] },
    { abbr: "CHI", names: ["Chicago Sky", "Sky"], colors: ["#418FDE", "#FFCD00"] },
    { abbr: "CON", names: ["Connecticut Sun", "Sun"], colors: ["#F05023", "#0A2240"] },
    { abbr: "DAL", names: ["Dallas Wings", "Wings"], colors: ["#002B5C", "#C4D600"] },
    // Valkyrie Violet and black; approximate.
    {
      abbr: "GSV",
      names: ["Golden State Valkyries", "Valkyries"],
      colors: ["#5F3A9E", "#000000"],
    },
    // No brand released yet; red and navy from the team's placeholder graphics.
    { abbr: "HOU", names: ["Houston Comets", "Comets"], colors: ["#C8102E", "#041E42"] },
    { abbr: "IND", names: ["Indiana Fever", "Fever"], colors: ["#002D62", "#E03A3E"] },
    { abbr: "LVA", names: ["Las Vegas Aces", "Aces"], colors: ["#000000", "#BA0C2F"] },
    {
      abbr: "LAS",
      names: ["Los Angeles Sparks", "LA Sparks", "Sparks"],
      colors: ["#552583", "#FDB927"],
    },
    { abbr: "MIN", names: ["Minnesota Lynx", "Lynx"], colors: ["#266092", "#79BC43"] },
    { abbr: "NYL", names: ["New York Liberty", "Liberty"], colors: ["#86CEBC", "#000000"] },
    { abbr: "PHX", names: ["Phoenix Mercury", "Mercury"], colors: ["#201747", "#CB6015"] },
    // Red and brown from the team's rose logo; approximate.
    { abbr: "POR", names: ["Portland Fire", "Fire"], colors: ["#C8102E", "#4E3629"] },
    { abbr: "SEA", names: ["Seattle Storm", "Storm"], colors: ["#2C5235", "#FEE11A"] },
    // Tempo Bordeaux and Borealis Blue; approximate.
    { abbr: "TOR", names: ["Toronto Tempo", "Tempo"], colors: ["#6D1D3A", "#8FC7E8"] },
    { abbr: "WAS", names: ["Washington Mystics", "Mystics"], colors: ["#0C2340", "#C8102E"] },
  ],
};
