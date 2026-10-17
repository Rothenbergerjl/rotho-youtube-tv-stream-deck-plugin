// Serie A, 2025–26 clubs, plus Empoli, Monza and Venezia (relegated in 2025).
// Source: legaseriea.it/en/serie-a/clubs.
import type { League } from "./types";

export const SERIE_A: League = {
  id: "seriea",
  sport: "soccer",
  pool: "europe",
  hints: ["Serie A", "Coppa Italia"],
  teams: [
    { abbr: "ACM", names: ["AC Milan", "Milan"] },
    { abbr: "ATA", names: ["Atalanta"] },
    { abbr: "BOL", names: ["Bologna"] },
    { abbr: "CAG", names: ["Cagliari"] },
    { abbr: "COM", names: ["Como 1907", "Como"] },
    { abbr: "CRE", names: ["Cremonese"] },
    { abbr: "EMP", names: ["Empoli"] },
    { abbr: "FIO", names: ["Fiorentina"] },
    { abbr: "GEN", names: ["Genoa"] },
    { abbr: "VER", names: ["Hellas Verona", "Verona"] },
    { abbr: "INT", names: ["Inter Milan", "Internazionale", "Inter"] },
    { abbr: "JUV", names: ["Juventus", "Juve"] },
    { abbr: "LAZ", names: ["SS Lazio", "Lazio"] },
    { abbr: "LEC", names: ["Lecce"] },
    { abbr: "MON", names: ["Monza"] },
    { abbr: "NAP", names: ["SSC Napoli", "Napoli"] },
    { abbr: "PAR", names: ["Parma"] },
    { abbr: "PIS", names: ["Pisa"] },
    { abbr: "ROM", names: ["AS Roma", "Roma"] },
    { abbr: "SAS", names: ["Sassuolo"] },
    { abbr: "TOR", names: ["Torino"] },
    { abbr: "UDI", names: ["Udinese"] },
    { abbr: "VEN", names: ["Venezia"] },
  ],
};
