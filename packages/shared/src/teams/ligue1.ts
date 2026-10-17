// Ligue 1, 2025–26 clubs, plus Montpellier, Reims and Saint-Étienne (relegated in 2025).
// Source: ligue1.com/clubs.
// Colors: crest and home-kit colors; approximate, since most clubs don't publish hex values.
import type { League } from "./types";

export const LIGUE_1: League = {
  id: "ligue1",
  sport: "soccer",
  pool: "europe",
  hints: ["Ligue 1", "Coupe de France"],
  teams: [
    { abbr: "ANG", names: ["Angers"], colors: ["#000000", "#FFFFFF"] },
    { abbr: "AUX", names: ["AJ Auxerre", "Auxerre"], colors: ["#FFFFFF", "#004A93"] },
    { abbr: "BRE", names: ["Stade Brestois", "Brest"], colors: ["#E30613", "#FFFFFF"] },
    { abbr: "HAC", names: ["Le Havre"], colors: ["#8ACDEA", "#0A1F44"] },
    { abbr: "LEN", names: ["RC Lens", "Lens"], colors: ["#FFD100", "#D20000"] },
    { abbr: "LIL", names: ["LOSC Lille", "Lille"], colors: ["#E01E13", "#20325F"] },
    { abbr: "LOR", names: ["Lorient"], colors: ["#F58113", "#000000"] },
    { abbr: "LYO", names: ["Olympique Lyonnais", "Lyon"], colors: ["#FFFFFF", "#1C3F94"] },
    { abbr: "MAR", names: ["Olympique de Marseille", "Marseille"], colors: ["#FFFFFF", "#2FAEE0"] },
    { abbr: "MET", names: ["FC Metz", "Metz"], colors: ["#7C1E3A", "#FFFFFF"] },
    { abbr: "MON", names: ["AS Monaco", "Monaco"], colors: ["#E51B22", "#FFFFFF"] },
    { abbr: "MTP", names: ["Montpellier"], colors: ["#F57E25", "#00205B"] },
    { abbr: "NAN", names: ["FC Nantes", "Nantes"], colors: ["#FCD405", "#00863F"] },
    { abbr: "NIC", names: ["OGC Nice", "Nice"], colors: ["#C8102E", "#000000"] },
    { abbr: "PFC", names: ["Paris FC"], colors: ["#1E2B4D", "#8FC6E8"] },
    {
      abbr: "PSG",
      names: ["Paris Saint-Germain", "Paris SG", "PSG"],
      colors: ["#004170", "#DA291C"],
    },
    { abbr: "REI", names: ["Stade de Reims", "Reims"], colors: ["#EE2223", "#FFFFFF"] },
    { abbr: "REN", names: ["Stade Rennais", "Rennes"], colors: ["#E13327", "#000000"] },
    { abbr: "STE", names: ["AS Saint-Étienne", "Saint-Étienne"], colors: ["#009A44", "#FFFFFF"] },
    { abbr: "STR", names: ["RC Strasbourg", "Strasbourg"], colors: ["#009FE3", "#FFFFFF"] },
    { abbr: "TOU", names: ["Toulouse"], colors: ["#4E2A84", "#FFFFFF"] },
  ],
};
