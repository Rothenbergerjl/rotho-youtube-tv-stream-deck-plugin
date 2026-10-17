// Liga MX, Apertura 2026. Source: ligamx.net.
// Colors: crest and home-kit colors; approximate, since most clubs don't publish hex values.
import type { League } from "./types";

export const LIGA_MX: League = {
  id: "ligamx",
  sport: "soccer",
  hints: ["Liga MX", "Liga BBVA MX"],
  teams: [
    { abbr: "AME", names: ["Club América", "América"], colors: ["#FFE100", "#002D62"] },
    { abbr: "ATS", names: ["Atlas"], colors: ["#C8102E", "#000000"] },
    { abbr: "ASL", names: ["Atlético San Luis", "San Luis"], colors: ["#D7182A", "#002F6C"] },
    { abbr: "CAZ", names: ["Cruz Azul"], colors: ["#0055A5", "#FFFFFF"] },
    {
      abbr: "GDL",
      names: ["Chivas Guadalajara", "Guadalajara", "Chivas"],
      colors: ["#CD1F2D", "#002B5C"],
    },
    { abbr: "JUA", names: ["FC Juárez", "Juárez"], colors: ["#C8102E", "#00843D"] },
    { abbr: "LEO", names: ["Club León", "León"], colors: ["#00843D", "#FFFFFF"] },
    { abbr: "MAZ", names: ["Mazatlán FC", "Mazatlán"], colors: ["#5B2C83", "#FFFFFF"] },
    {
      abbr: "MTY",
      names: ["CF Monterrey", "Monterrey", "Rayados"],
      colors: ["#002D72", "#FFFFFF"],
    },
    { abbr: "NEC", names: ["Necaxa"], colors: ["#E31837", "#FFFFFF"] },
    { abbr: "PAC", names: ["Pachuca"], colors: ["#002B5C", "#FFFFFF"] },
    { abbr: "PUE", names: ["Puebla"], colors: ["#FFFFFF", "#0055A5"] },
    { abbr: "PUM", names: ["Pumas UNAM", "Pumas", "UNAM"], colors: ["#00205B", "#C5A572"] },
    { abbr: "QRO", names: ["Querétaro"], colors: ["#0055A5", "#000000"] },
    { abbr: "SAN", names: ["Santos Laguna", "Santos"], colors: ["#007A3D", "#FFFFFF"] },
    { abbr: "TIG", names: ["Tigres UANL", "Tigres"], colors: ["#FDB913", "#002D72"] },
    { abbr: "TIJ", names: ["Club Tijuana", "Tijuana", "Xolos"], colors: ["#C8102E", "#000000"] },
    { abbr: "TOL", names: ["Toluca"], colors: ["#D52B1E", "#FFFFFF"] },
  ],
};
