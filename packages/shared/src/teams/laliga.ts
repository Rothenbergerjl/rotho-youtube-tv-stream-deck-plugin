// LaLiga, 2025–26 clubs, plus Las Palmas, Leganés and Valladolid (relegated in 2025).
// Source: laliga.com/en-GB/laliga-easports/clubs.
import type { League } from "./types";

export const LALIGA: League = {
  id: "laliga",
  sport: "soccer",
  pool: "europe",
  hints: ["LaLiga", "La Liga", "Copa del Rey"],
  teams: [
    { abbr: "ALA", names: ["Deportivo Alavés", "Alavés"] },
    { abbr: "ATH", names: ["Athletic Club", "Athletic Bilbao"] },
    { abbr: "ATM", names: ["Atlético Madrid", "Atlético de Madrid", "Atlético"] },
    { abbr: "BAR", names: ["FC Barcelona", "Barcelona", "Barça"] },
    { abbr: "CEL", names: ["Celta Vigo", "Celta de Vigo", "Celta"] },
    { abbr: "ELC", names: ["Elche"] },
    { abbr: "ESP", names: ["RCD Espanyol", "Espanyol"] },
    { abbr: "GET", names: ["Getafe"] },
    { abbr: "GIR", names: ["Girona"] },
    { abbr: "LPA", names: ["UD Las Palmas", "Las Palmas"] },
    { abbr: "LEG", names: ["Leganés"] },
    { abbr: "LEV", names: ["Levante"] },
    { abbr: "MLL", names: ["RCD Mallorca", "Mallorca"] },
    { abbr: "OSA", names: ["Osasuna"] },
    { abbr: "OVI", names: ["Real Oviedo", "Oviedo"] },
    { abbr: "RAY", names: ["Rayo Vallecano", "Rayo"] },
    { abbr: "BET", names: ["Real Betis", "Betis"] },
    { abbr: "RMA", names: ["Real Madrid"] },
    { abbr: "RSO", names: ["Real Sociedad"] },
    { abbr: "SEV", names: ["Sevilla", "Seville"] },
    { abbr: "VAL", names: ["Valencia"] },
    { abbr: "VLL", names: ["Real Valladolid", "Valladolid"] },
    { abbr: "VIL", names: ["Villarreal"] },
  ],
};
