// Serie A, 2025–26 clubs, plus Empoli, Monza and Venezia (relegated in 2025).
// Source: legaseriea.it/en/serie-a/clubs.
// Colors: crest and home-kit colors; approximate, since most clubs don't publish hex values.
import type { League } from "./types";

export const SERIE_A: League = {
  id: "seriea",
  sport: "soccer",
  pool: "europe",
  hints: ["Serie A", "Coppa Italia"],
  teams: [
    { abbr: "ACM", names: ["AC Milan", "Milan"], colors: ["#FB090B", "#000000"] },
    { abbr: "ATA", names: ["Atalanta"], colors: ["#1E71B8", "#000000"] },
    { abbr: "BOL", names: ["Bologna"], colors: ["#1A2F48", "#A21C26"] },
    { abbr: "CAG", names: ["Cagliari"], colors: ["#A0001F", "#002350"] },
    { abbr: "COM", names: ["Como 1907", "Como"], colors: ["#1F4A8B", "#FFFFFF"] },
    { abbr: "CRE", names: ["Cremonese"], colors: ["#A51E36", "#A0A0A0"] },
    { abbr: "EMP", names: ["Empoli"], colors: ["#005BAC", "#FFFFFF"] },
    { abbr: "FIO", names: ["Fiorentina"], colors: ["#482E92", "#FFFFFF"] },
    { abbr: "GEN", names: ["Genoa"], colors: ["#A6192E", "#002B5C"] },
    { abbr: "VER", names: ["Hellas Verona", "Verona"], colors: ["#002F6C", "#FFD200"] },
    {
      abbr: "INT",
      names: ["Inter Milan", "Internazionale", "Inter"],
      colors: ["#010E80", "#000000"],
    },
    { abbr: "JUV", names: ["Juventus", "Juve"], colors: ["#000000", "#FFFFFF"] },
    { abbr: "LAZ", names: ["SS Lazio", "Lazio"], colors: ["#87D8F7", "#15366F"] },
    { abbr: "LEC", names: ["Lecce"], colors: ["#FFD700", "#DA291C"] },
    { abbr: "MON", names: ["Monza"], colors: ["#E2001A", "#FFFFFF"] },
    { abbr: "NAP", names: ["SSC Napoli", "Napoli"], colors: ["#12A0D7", "#003C82"] },
    { abbr: "PAR", names: ["Parma"], colors: ["#FFDD00", "#004A97"] },
    { abbr: "PIS", names: ["Pisa"], colors: ["#000000", "#0067B1"] },
    { abbr: "ROM", names: ["AS Roma", "Roma"], colors: ["#8E1F2F", "#F0BC42"] },
    { abbr: "SAS", names: ["Sassuolo"], colors: ["#00A752", "#000000"] },
    { abbr: "TOR", names: ["Torino"], colors: ["#8A1E03", "#FFFFFF"] },
    { abbr: "UDI", names: ["Udinese"], colors: ["#000000", "#FFFFFF"] },
    { abbr: "VEN", names: ["Venezia"], colors: ["#000000", "#F37121"] },
  ],
};
