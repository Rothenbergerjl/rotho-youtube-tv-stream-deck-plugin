// College football and basketball: ACC, Big Ten, Big 12 and SEC schools plus Notre Dame, 2026–27
// membership. Source: each conference's site. A mascot is listed on its own only when no other
// school here uses it (so "Tigers", "Wildcats", "Bulldogs" and "Cougars" need the school name).
// Colors: each school's athletics brand colors (primary, then secondary).
import type { League } from "./types";

export const NCAA: League = {
  id: "ncaa",
  // Covers basketball too; `sport` only matters for SPORT_HINTS, which has no college entry.
  sport: "football",
  hints: [
    "College Football",
    "College Basketball",
    "Men's College Basketball",
    "Women's College Basketball",
    "NCAA",
    "NCAA Football",
    "NCAA Basketball",
    "College Football Playoff",
    "CFP",
    "March Madness",
    "Final Four",
    "SEC",
    "Big Ten",
    "Big 12",
    "ACC",
  ],
  teams: [
    // ACC
    {
      abbr: "BC",
      names: ["Boston College", "Boston College Eagles"],
      colors: ["#8A100B", "#BC9B6A"],
    },
    {
      abbr: "CAL",
      names: ["California", "Cal", "California Golden Bears", "Golden Bears"],
      colors: ["#003262", "#FDB515"],
    },
    { abbr: "CLEM", names: ["Clemson", "Clemson Tigers"], colors: ["#F56600", "#522D80"] },
    {
      abbr: "DUKE",
      names: ["Duke", "Duke Blue Devils", "Blue Devils"],
      colors: ["#003087", "#FFFFFF"],
    },
    {
      abbr: "FSU",
      names: ["Florida State", "Florida State Seminoles", "Seminoles"],
      colors: ["#782F40", "#CEB888"],
    },
    {
      abbr: "GT",
      names: ["Georgia Tech", "Georgia Tech Yellow Jackets", "Yellow Jackets"],
      colors: ["#B3A369", "#003057"],
    },
    {
      abbr: "LOU",
      names: ["Louisville", "Louisville Cardinals", "Cardinals"],
      colors: ["#AD0000", "#000000"],
    },
    {
      abbr: "MIA",
      names: ["Miami", "Miami (FL)", "Miami Hurricanes", "Hurricanes"],
      colors: ["#F47321", "#005030"],
    },
    {
      abbr: "NCST",
      names: ["NC State", "North Carolina State", "NC State Wolfpack", "Wolfpack"],
      colors: ["#CC0000", "#000000"],
    },
    {
      abbr: "UNC",
      names: ["North Carolina", "UNC", "North Carolina Tar Heels", "Tar Heels"],
      colors: ["#7BAFD4", "#13294B"],
    },
    {
      abbr: "PITT",
      names: ["Pittsburgh", "Pitt", "Pittsburgh Panthers", "Pitt Panthers", "Panthers"],
      colors: ["#003594", "#FFB81C"],
    },
    { abbr: "SMU", names: ["SMU", "SMU Mustangs", "Mustangs"], colors: ["#CC0035", "#0033A0"] },
    {
      abbr: "STAN",
      names: ["Stanford", "Stanford Cardinal", "Cardinal"],
      colors: ["#8C1515", "#FFFFFF"],
    },
    {
      abbr: "SYR",
      names: ["Syracuse", "Syracuse Orange", "Orange"],
      colors: ["#F76900", "#000E54"],
    },
    { abbr: "UVA", names: ["Virginia", "Virginia Cavaliers"], colors: ["#232D4B", "#F84C1E"] },
    {
      abbr: "VT",
      names: ["Virginia Tech", "Virginia Tech Hokies", "Hokies"],
      colors: ["#630031", "#CF4420"],
    },
    {
      abbr: "WAKE",
      names: ["Wake Forest", "Wake Forest Demon Deacons", "Demon Deacons"],
      colors: ["#9E7E38", "#000000"],
    },
    // Big Ten
    {
      abbr: "ILL",
      names: ["Illinois", "Illinois Fighting Illini", "Fighting Illini"],
      colors: ["#E84A27", "#13294B"],
    },
    {
      abbr: "IU",
      names: ["Indiana", "Indiana Hoosiers", "Hoosiers"],
      colors: ["#990000", "#EEEDEB"],
    },
    { abbr: "IOWA", names: ["Iowa", "Iowa Hawkeyes", "Hawkeyes"], colors: ["#FFCD00", "#000000"] },
    {
      abbr: "MD",
      names: ["Maryland", "Maryland Terrapins", "Terrapins", "Terps"],
      colors: ["#E03A3E", "#FFD520"],
    },
    {
      abbr: "MICH",
      names: ["Michigan", "Michigan Wolverines", "Wolverines"],
      colors: ["#00274C", "#FFCB05"],
    },
    {
      abbr: "MSU",
      names: ["Michigan State", "Michigan State Spartans", "Spartans"],
      colors: ["#18453B", "#FFFFFF"],
    },
    {
      abbr: "MINN",
      names: ["Minnesota", "Minnesota Golden Gophers", "Golden Gophers"],
      colors: ["#7A0019", "#FFCC33"],
    },
    {
      abbr: "NEB",
      names: ["Nebraska", "Nebraska Cornhuskers", "Cornhuskers"],
      colors: ["#D00000", "#F5F1E7"],
    },
    {
      abbr: "NU",
      names: ["Northwestern", "Northwestern Wildcats"],
      colors: ["#4E2A84", "#FFFFFF"],
    },
    {
      abbr: "OSU",
      names: ["Ohio State", "Ohio State Buckeyes", "Buckeyes"],
      colors: ["#BB0000", "#666666"],
    },
    { abbr: "ORE", names: ["Oregon", "Oregon Ducks"], colors: ["#154733", "#FEE123"] },
    {
      abbr: "PSU",
      names: ["Penn State", "Penn State Nittany Lions", "Nittany Lions"],
      colors: ["#041E42", "#FFFFFF"],
    },
    {
      abbr: "PUR",
      names: ["Purdue", "Purdue Boilermakers", "Boilermakers"],
      colors: ["#CEB888", "#000000"],
    },
    {
      abbr: "RUTG",
      names: ["Rutgers", "Rutgers Scarlet Knights", "Scarlet Knights"],
      colors: ["#CC0033", "#5F6A72"],
    },
    { abbr: "UCLA", names: ["UCLA", "UCLA Bruins"], colors: ["#2D68C4", "#F2A900"] },
    {
      abbr: "USC",
      names: ["USC", "Southern California", "USC Trojans", "Trojans"],
      colors: ["#990000", "#FFC72C"],
    },
    {
      abbr: "WASH",
      names: ["Washington", "Washington Huskies", "Huskies"],
      colors: ["#4B2E83", "#B7A57A"],
    },
    {
      abbr: "WIS",
      names: ["Wisconsin", "Wisconsin Badgers", "Badgers"],
      colors: ["#C5050C", "#FFFFFF"],
    },
    // Big 12
    { abbr: "ARIZ", names: ["Arizona", "Arizona Wildcats"], colors: ["#CC0033", "#003366"] },
    {
      abbr: "ASU",
      names: ["Arizona State", "Arizona State Sun Devils", "Sun Devils"],
      colors: ["#8C1D40", "#FFC627"],
    },
    { abbr: "BAY", names: ["Baylor", "Baylor Bears"], colors: ["#154734", "#FFB81C"] },
    { abbr: "BYU", names: ["BYU", "Brigham Young", "BYU Cougars"], colors: ["#002E5D", "#FFFFFF"] },
    {
      abbr: "CIN",
      names: ["Cincinnati", "Cincinnati Bearcats", "Bearcats"],
      colors: ["#E00122", "#000000"],
    },
    {
      abbr: "COLO",
      names: ["Colorado", "Colorado Buffaloes", "Buffaloes"],
      colors: ["#CFB87C", "#000000"],
    },
    { abbr: "HOU", names: ["Houston", "Houston Cougars"], colors: ["#C8102E", "#FFFFFF"] },
    {
      abbr: "ISU",
      names: ["Iowa State", "Iowa State Cyclones", "Cyclones"],
      colors: ["#C8102E", "#F1BE48"],
    },
    {
      abbr: "KU",
      names: ["Kansas", "Kansas Jayhawks", "Jayhawks"],
      colors: ["#0051BA", "#E8000D"],
    },
    {
      abbr: "KSU",
      names: ["Kansas State", "Kansas State Wildcats"],
      colors: ["#512888", "#FFFFFF"],
    },
    {
      abbr: "OKST",
      names: ["Oklahoma State", "Oklahoma State Cowboys"],
      colors: ["#FF7300", "#000000"],
    },
    {
      abbr: "TCU",
      names: ["TCU", "TCU Horned Frogs", "Horned Frogs"],
      colors: ["#4D1979", "#A3A9AC"],
    },
    {
      abbr: "TTU",
      names: ["Texas Tech", "Texas Tech Red Raiders", "Red Raiders"],
      colors: ["#CC0000", "#000000"],
    },
    { abbr: "UCF", names: ["UCF", "UCF Knights"], colors: ["#000000", "#BA9B37"] },
    { abbr: "UTAH", names: ["Utah", "Utah Utes", "Utes"], colors: ["#CC0000", "#FFFFFF"] },
    {
      abbr: "WVU",
      names: ["West Virginia", "West Virginia Mountaineers", "Mountaineers"],
      colors: ["#002855", "#EAAA00"],
    },
    // SEC
    {
      abbr: "ALA",
      names: ["Alabama", "Alabama Crimson Tide", "Crimson Tide"],
      colors: ["#9E1B32", "#828A8F"],
    },
    {
      abbr: "ARK",
      names: ["Arkansas", "Arkansas Razorbacks", "Razorbacks"],
      colors: ["#9D2235", "#FFFFFF"],
    },
    { abbr: "AUB", names: ["Auburn", "Auburn Tigers"], colors: ["#0C2340", "#E87722"] },
    { abbr: "FLA", names: ["Florida", "Florida Gators", "Gators"], colors: ["#0021A5", "#FA4616"] },
    { abbr: "UGA", names: ["Georgia", "Georgia Bulldogs"], colors: ["#BA0C2F", "#000000"] },
    { abbr: "UK", names: ["Kentucky", "Kentucky Wildcats"], colors: ["#0033A0", "#FFFFFF"] },
    { abbr: "LSU", names: ["LSU", "LSU Tigers"], colors: ["#461D7C", "#FDD023"] },
    {
      abbr: "MSST",
      names: ["Mississippi State", "Mississippi State Bulldogs"],
      colors: ["#660000", "#FFFFFF"],
    },
    {
      abbr: "MIZ",
      names: ["Missouri", "Mizzou", "Missouri Tigers"],
      colors: ["#F1B82D", "#000000"],
    },
    {
      abbr: "OU",
      names: ["Oklahoma", "Oklahoma Sooners", "Sooners"],
      colors: ["#841617", "#FDF9D8"],
    },
    {
      abbr: "MISS",
      names: ["Ole Miss", "Ole Miss Rebels", "Rebels"],
      colors: ["#CE1126", "#14213D"],
    },
    {
      abbr: "SC",
      names: ["South Carolina", "South Carolina Gamecocks", "Gamecocks"],
      colors: ["#73000A", "#000000"],
    },
    {
      abbr: "TENN",
      names: ["Tennessee", "Tennessee Volunteers", "Volunteers", "Vols"],
      colors: ["#FF8200", "#FFFFFF"],
    },
    {
      abbr: "TEX",
      names: ["Texas", "Texas Longhorns", "Longhorns"],
      colors: ["#BF5700", "#FFFFFF"],
    },
    {
      abbr: "TAMU",
      names: ["Texas A&M", "Texas A&M Aggies", "Aggies"],
      colors: ["#500000", "#FFFFFF"],
    },
    {
      abbr: "VAN",
      names: ["Vanderbilt", "Vanderbilt Commodores", "Commodores"],
      colors: ["#000000", "#CFAE70"],
    },
    // Independent
    {
      abbr: "ND",
      names: ["Notre Dame", "Notre Dame Fighting Irish", "Fighting Irish"],
      colors: ["#0C2340", "#C99700"],
    },
  ],
};
