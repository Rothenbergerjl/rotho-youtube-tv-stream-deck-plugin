// Ligue 1, 2025–26 clubs, plus Montpellier, Reims and Saint-Étienne (relegated in 2025).
// Source: ligue1.com/clubs.
import type { League } from "./types";

export const LIGUE_1: League = {
  id: "ligue1",
  sport: "soccer",
  pool: "europe",
  hints: ["Ligue 1", "Coupe de France"],
  teams: [
    { abbr: "ANG", names: ["Angers"] },
    { abbr: "AUX", names: ["AJ Auxerre", "Auxerre"] },
    { abbr: "BRE", names: ["Stade Brestois", "Brest"] },
    { abbr: "HAC", names: ["Le Havre"] },
    { abbr: "LEN", names: ["RC Lens", "Lens"] },
    { abbr: "LIL", names: ["LOSC Lille", "Lille"] },
    { abbr: "LOR", names: ["Lorient"] },
    { abbr: "LYO", names: ["Olympique Lyonnais", "Lyon"] },
    { abbr: "MAR", names: ["Olympique de Marseille", "Marseille"] },
    { abbr: "MET", names: ["FC Metz", "Metz"] },
    { abbr: "MON", names: ["AS Monaco", "Monaco"] },
    { abbr: "MTP", names: ["Montpellier"] },
    { abbr: "NAN", names: ["FC Nantes", "Nantes"] },
    { abbr: "NIC", names: ["OGC Nice", "Nice"] },
    { abbr: "PFC", names: ["Paris FC"] },
    { abbr: "PSG", names: ["Paris Saint-Germain", "Paris SG", "PSG"] },
    { abbr: "REI", names: ["Stade de Reims", "Reims"] },
    { abbr: "REN", names: ["Stade Rennais", "Rennes"] },
    { abbr: "STE", names: ["AS Saint-Étienne", "Saint-Étienne"] },
    { abbr: "STR", names: ["RC Strasbourg", "Strasbourg"] },
    { abbr: "TOU", names: ["Toulouse"] },
  ],
};
