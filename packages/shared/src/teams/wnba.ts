// WNBA, 2026 season, plus the Houston Comets (the Connecticut Sun's name from 2027).
// Source: wnba.com/teams; Sun relocation approved in 2026.
import type { League } from "./types";

export const WNBA: League = {
  id: "wnba",
  sport: "basketball",
  hints: ["WNBA", "WNBA Basketball", "WNBA Playoffs", "WNBA Finals", "Commissioner's Cup"],
  teams: [
    { abbr: "ATL", names: ["Atlanta Dream", "Dream"] },
    { abbr: "CHI", names: ["Chicago Sky", "Sky"] },
    { abbr: "CON", names: ["Connecticut Sun", "Sun"] },
    { abbr: "DAL", names: ["Dallas Wings", "Wings"] },
    { abbr: "GSV", names: ["Golden State Valkyries", "Valkyries"] },
    { abbr: "HOU", names: ["Houston Comets", "Comets"] },
    { abbr: "IND", names: ["Indiana Fever", "Fever"] },
    { abbr: "LVA", names: ["Las Vegas Aces", "Aces"] },
    { abbr: "LAS", names: ["Los Angeles Sparks", "LA Sparks", "Sparks"] },
    { abbr: "MIN", names: ["Minnesota Lynx", "Lynx"] },
    { abbr: "NYL", names: ["New York Liberty", "Liberty"] },
    { abbr: "PHX", names: ["Phoenix Mercury", "Mercury"] },
    { abbr: "POR", names: ["Portland Fire", "Fire"] },
    { abbr: "SEA", names: ["Seattle Storm", "Storm"] },
    { abbr: "TOR", names: ["Toronto Tempo", "Tempo"] },
    { abbr: "WAS", names: ["Washington Mystics", "Mystics"] },
  ],
};
