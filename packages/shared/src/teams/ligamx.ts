// Liga MX, Apertura 2026. Source: ligamx.net.
import type { League } from "./types";

export const LIGA_MX: League = {
  id: "ligamx",
  sport: "soccer",
  hints: ["Liga MX", "Liga BBVA MX"],
  teams: [
    { abbr: "AME", names: ["Club América", "América"] },
    { abbr: "ATS", names: ["Atlas"] },
    { abbr: "ASL", names: ["Atlético San Luis", "San Luis"] },
    { abbr: "CAZ", names: ["Cruz Azul"] },
    { abbr: "GDL", names: ["Chivas Guadalajara", "Guadalajara", "Chivas"] },
    { abbr: "JUA", names: ["FC Juárez", "Juárez"] },
    { abbr: "LEO", names: ["Club León", "León"] },
    { abbr: "MAZ", names: ["Mazatlán FC", "Mazatlán"] },
    { abbr: "MTY", names: ["CF Monterrey", "Monterrey", "Rayados"] },
    { abbr: "NEC", names: ["Necaxa"] },
    { abbr: "PAC", names: ["Pachuca"] },
    { abbr: "PUE", names: ["Puebla"] },
    { abbr: "PUM", names: ["Pumas UNAM", "Pumas", "UNAM"] },
    { abbr: "QRO", names: ["Querétaro"] },
    { abbr: "SAN", names: ["Santos Laguna", "Santos"] },
    { abbr: "TIG", names: ["Tigres UANL", "Tigres"] },
    { abbr: "TIJ", names: ["Club Tijuana", "Tijuana", "Xolos"] },
    { abbr: "TOL", names: ["Toluca"] },
  ],
};
