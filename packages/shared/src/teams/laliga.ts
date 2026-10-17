// LaLiga, 2025–26 clubs, plus Las Palmas, Leganés and Valladolid (relegated in 2025).
// Source: laliga.com/en-GB/laliga-easports/clubs.
// Colors: crest and home-kit colors; approximate, since most clubs don't publish hex values.
import type { League } from "./types";

export const LALIGA: League = {
  id: "laliga",
  sport: "soccer",
  pool: "europe",
  hints: ["LaLiga", "La Liga", "Copa del Rey"],
  teams: [
    { abbr: "ALA", names: ["Deportivo Alavés", "Alavés"], colors: ["#0067B1", "#FFFFFF"] },
    { abbr: "ATH", names: ["Athletic Club", "Athletic Bilbao"], colors: ["#EE2523", "#FFFFFF"] },
    {
      abbr: "ATM",
      names: ["Atlético Madrid", "Atlético de Madrid", "Atlético"],
      colors: ["#CB3524", "#272E61"],
    },
    { abbr: "BAR", names: ["FC Barcelona", "Barcelona", "Barça"], colors: ["#A50044", "#004D98"] },
    {
      abbr: "CEL",
      names: ["Celta Vigo", "Celta de Vigo", "Celta"],
      colors: ["#8AC3EE", "#E5254E"],
    },
    { abbr: "ELC", names: ["Elche"], colors: ["#FFFFFF", "#05642C"] },
    { abbr: "ESP", names: ["RCD Espanyol", "Espanyol"], colors: ["#007FC8", "#FFFFFF"] },
    { abbr: "GET", names: ["Getafe"], colors: ["#005999", "#FFFFFF"] },
    { abbr: "GIR", names: ["Girona"], colors: ["#CD2534", "#FFFFFF"] },
    { abbr: "LPA", names: ["UD Las Palmas", "Las Palmas"], colors: ["#FFE400", "#0062A6"] },
    { abbr: "LEG", names: ["Leganés"], colors: ["#0D3E91", "#FFFFFF"] },
    { abbr: "LEV", names: ["Levante"], colors: ["#B4053F", "#003C7E"] },
    { abbr: "MLL", names: ["RCD Mallorca", "Mallorca"], colors: ["#E20613", "#000000"] },
    { abbr: "OSA", names: ["Osasuna"], colors: ["#D91A21", "#0A346F"] },
    { abbr: "OVI", names: ["Real Oviedo", "Oviedo"], colors: ["#0055A5", "#FFFFFF"] },
    { abbr: "RAY", names: ["Rayo Vallecano", "Rayo"], colors: ["#FFFFFF", "#E53027"] },
    { abbr: "BET", names: ["Real Betis", "Betis"], colors: ["#00954C", "#FFFFFF"] },
    { abbr: "RMA", names: ["Real Madrid"], colors: ["#FFFFFF", "#00529F"] },
    { abbr: "RSO", names: ["Real Sociedad"], colors: ["#0067B1", "#FFFFFF"] },
    { abbr: "SEV", names: ["Sevilla", "Seville"], colors: ["#FFFFFF", "#D81920"] },
    { abbr: "VAL", names: ["Valencia"], colors: ["#FFFFFF", "#F18E00"] },
    { abbr: "VLL", names: ["Real Valladolid", "Valladolid"], colors: ["#921B88", "#FFFFFF"] },
    { abbr: "VIL", names: ["Villarreal"], colors: ["#FFE667", "#005187"] },
  ],
};
