import { describe, expect, it } from "vitest";
import { formatMatchup, LEAGUES, MAX_TITLE_LENGTH, parseTitle, poolOf } from ".";

describe("formatMatchup", () => {
  // Real titles captured from tv.youtube.com on 2026-10-11.
  it.each([
    ["San Francisco 49ers at Seattle Seahawks", "SF @ SEA"],
    ["Monday Night Football with Peyton and Eli: Buffalo Bills at Los Angeles Rams", "BUF @ LAR"],
    ["Prime Vision Alt Cast: Seattle Seahawks at Denver Broncos", "SEA @ DEN"],
    ["CBS 4 News at 6", "CBS 4 News at 6"],
    ["WRTV News at 6:00", "WRTV News at 6:…"],
    ["FOX 59", "FOX 59"],
    ["NFL GameDay Live", "NFL GameDay Live"],
    ["Disney Season Kickoff Tournament: U18/19 Boys (Final)", "Disney Season K…"],
  ])("real title %j → %j", (raw, expected) => {
    expect(formatMatchup(raw)).toBe(expected);
  });

  it.each([
    ["Kansas City Chiefs vs. Buffalo Bills", "KC v BUF"],
    ["Chiefs at Bills", "KC @ BUF"],
    ["NFL: New York Jets @ New York Giants", "NYJ @ NYG"],
    ["los angeles chargers AT las vegas raiders", "LAC @ LV"],
    ["Green Bay Packers v Chicago Bears", "GB v CHI"],
    ["Green Bay Packers v. Chicago Bears", "GB v CHI"],
    ["Packers vs Bears", "GB v CHI"],
    ["Chiefs at Bills - YouTube TV", "KC @ BUF"],
  ])("variant %j → %j", (raw, expected) => {
    expect(formatMatchup(raw)).toBe(expected);
  });

  it("does not match team names inside other words", () => {
    expect(formatMatchup("Rams at Billsville")).toBe("Rams at Billsvi…");
    expect(formatMatchup("Superrams at Bills")).toBe("Superrams at Bi…");
  });

  it("ignores accents when matching", () => {
    expect(formatMatchup("New Orléans Saints at Atlanta Falcons")).toBe("NO @ ATL");
  });

  it("strips the YouTube TV suffix and normalises whitespace", () => {
    expect(formatMatchup("  Home   - YouTube TV ")).toBe("Home");
    expect(formatMatchup("")).toBe("");
  });

  it("never returns more than MAX_TITLE_LENGTH characters", () => {
    expect(formatMatchup("x".repeat(50))).toHaveLength(MAX_TITLE_LENGTH);
    expect(formatMatchup("x".repeat(MAX_TITLE_LENGTH))).toBe("x".repeat(MAX_TITLE_LENGTH));
  });
});

describe("NBA, WNBA, MLB and NHL", () => {
  // Unverified format: best guesses at YouTube TV titles, not captured from the app.
  it.each([
    ["NBA Basketball: Boston Celtics at Los Angeles Lakers", "BOS @ LAL", "nba"],
    ["Golden State Warriors vs. Oklahoma City Thunder", "GSW v OKC", "nba"],
    ["Sixers at Knicks", "PHI @ NYK", "nba"],
    ["WNBA: Las Vegas Aces at New York Liberty", "LVA @ NYL", "wnba"],
    ["Indiana Fever vs. Chicago Sky", "IND v CHI", "wnba"],
    ["MLB Baseball: New York Yankees at Boston Red Sox", "NYY @ BOS", "mlb"],
    ["Cubs vs. White Sox", "CHC v CWS", "mlb"],
    ["Athletics at Seattle Mariners", "ATH @ SEA", "mlb"],
    ["A’s at Angels", "ATH @ LAA", "mlb"],
    ["NHL Hockey: Edmonton Oilers at Toronto Maple Leafs", "EDM @ TOR", "nhl"],
    ["Montréal Canadiens vs. Boston Bruins", "MTL v BOS", "nhl"],
    ["Golden Knights at Utah Mammoth", "VGK @ UTA", "nhl"],
  ])("%j → %j (%s)", (raw, display, league) => {
    const parsed = parseTitle(raw);
    expect(parsed.display).toBe(display);
    expect(parsed.matchup?.league).toBe(league);
  });
});

describe("nickname collisions", () => {
  it.each([
    // Rangers is NHL and MLB, Kings is NHL and NBA: only the NHL has both.
    ["Rangers at Kings", "NYR @ LAK"],
    // A full name beats the bare nickname.
    ["Texas Rangers at New York Yankees", "TEX @ NYY"],
    ["New York Giants at Arizona Cardinals", "NYG @ ARI"],
    ["San Francisco Giants at St. Louis Cardinals", "SF @ STL"],
    // A league hint picks between leagues that both fit.
    ["MLB: Giants at Cardinals", "SF @ STL"],
    ["NFL Football: Giants at Cardinals", "NYG @ ARI"],
    ["NHL Hockey: Panthers at Jets", "FLA @ WPG"],
    ["NFL: Panthers at Jets", "CAR @ NYJ"],
    // Only the NBA has both.
    ["Kings vs. Celtics", "SAC v BOS"],
    // "NBA" inside "WNBA" is not a hint for the NBA.
    ["WNBA Basketball: Sun at Sky", "CON @ CHI"],
  ])("%j → %j", (raw, expected) => {
    expect(formatMatchup(raw)).toBe(expected);
  });

  it.each([
    "Giants at Cardinals", // NFL and MLB both fit
    "Panthers at Jets", // NFL and NHL both fit
    "Texas Rangers at Los Angeles Kings", // different leagues
    "MLB: Rangers at Kings", // the hinted league doesn't have both
  ])("%j has no league-backed matchup", (raw) => {
    expect(parseTitle(raw).matchup?.league).toBeUndefined();
  });
});

describe("soccer", () => {
  // Unverified format: best guesses at YouTube TV titles, not captured from the app.
  it.each([
    ["Premier League: Arsenal vs. Chelsea", "ARS v CHE"],
    ["Arsenal vs. Chelsea", "ARS v CHE"],
    ["Man City v Spurs", "MCI v TOT"],
    ["Wolves vs. Manchester United", "WOL v MUN"],
    ["EFL Championship: Leeds United vs. Sheffield Wednesday", "LEE v SHW"],
    ["Real Madrid vs Barcelona", "RMA v BAR"],
    ["Champions League: Rangers vs. Ajax", "RAN v AJA"],
    ["LaLiga: Atlético de Madrid vs. Sevilla", "ATM v SEV"],
    ["Athletic Club vs. Real Sociedad", "ATH v RSO"],
    ["Bundesliga: Bayern München vs. Borussia Dortmund", "BAY v BVB"],
    ["Serie A: Inter Milan vs. AC Milan", "INT v ACM"],
    ["Juventus vs. Napoli", "JUV v NAP"],
    ["Ligue 1: Paris Saint-Germain vs. Marseille", "PSG v MAR"],
    ["Liga MX: Club América vs. Chivas", "AME v GDL"],
    ["América vs. Guadalajara", "AME v GDL"],
    ["Tigres UANL vs. Rayados", "TIG v MTY"],
    ["Atlético San Luis vs. Toluca", "ASL v TOL"],
    ["United States vs. Mexico", "USA v MEX"],
    ["USMNT vs. México", "USA v MEX"],
    ["Copa América: Argentina vs. Brasil", "ARG v BRA"],
    ["World Cup Qualifier: England vs. Republic of Ireland", "ENG v IRL"],
    ["Estados Unidos vs. Canada", "USA v CAN"],
  ])("%j → %j", (raw, expected) => {
    expect(formatMatchup(raw)).toBe(expected);
  });

  it.each([
    // Different leagues in the European pool: the matchup has no single league.
    ["UEFA Champions League: Arsenal vs. Real Madrid", "ARS v RMA"],
    ["Champions League: Celtic vs. Bayern Munich", "CEL v BAY"],
    ["Bodø/Glimt vs. Tottenham Hotspur", "BOD v TOT"],
    ["FA Cup: Sunderland vs. Wrexham", "SUN v WRE"],
  ])("cross-league %j → %j", (raw, expected) => {
    const parsed = parseTitle(raw);
    expect(parsed.display).toBe(expected);
    expect(parsed.matchup?.league).toBeUndefined();
    expect(parsed.matchup?.teams.every((t) => t.teamId)).toBe(true);
  });

  it("records each side's own league in its team id", () => {
    expect(parseTitle("Arsenal vs. Real Madrid").matchup?.teams.map((t) => t.teamId)).toEqual([
      "epl:ARS",
      "laliga:RMA",
    ]);
  });

  it.each([
    // Rangers is also NHL and MLB; only the Scottish club's pool has Celtic.
    ["Rangers vs. Celtic", "RAN v CEL"],
    // Spurs and Wolves are also NBA nicknames, so this needs a hint.
    ["Premier League: Spurs vs. Wolves", "TOT v WOL"],
    ["Spurs at Lakers", "SAS @ LAL"],
    ["Wolves at Celtics", "MIN @ BOS"],
    // "Celtic" is not "Celtics".
    ["Celtics at Knicks", "BOS @ NYK"],
    // "Atlético" alone is Atlético Madrid; the full name wins for San Luis.
    ["Atlético vs. Barcelona", "ATM v BAR"],
    // Inter Miami is not in any table (MLS is out of scope), so "Inter" doesn't match it.
    ["Inter vs. Juventus", "INT v JUV"],
  ])("collision %j → %j", (raw, expected) => {
    expect(formatMatchup(raw)).toBe(expected);
  });

  it.each([
    // National team vs club: different pools, but each side has one candidate.
    ["Mexico vs. Club América", "MEX v AME"],
    // The sport hint leaves only the Scottish Rangers and no Kings.
    ["Soccer: Rangers at Kings", "RAN @ KING"],
    // NBA (SAS, MIN) and Premier League (TOT, WOL) both fit.
    ["Spurs vs. Wolves", "SPUR v WOLV"],
  ])("%j shortens each side on its own → %j", (raw, expected) => {
    const parsed = parseTitle(raw);
    expect(parsed.display).toBe(expected);
    expect(parsed.matchup?.league).toBeUndefined();
  });

  it("does not match MLS clubs", () => {
    expect(parseTitle("Orlando City vs. Inter Miami").matchup).toBeUndefined();
  });
});

describe("college", () => {
  // Unverified format: best guesses at YouTube TV titles, not captured from the app.
  it.each([
    ["College Football: Ohio State at Michigan", "OSU @ MICH"],
    ["Oklahoma State Cowboys at Texas Longhorns", "OKST @ TEX"],
    ["Alabama Crimson Tide vs. Georgia Bulldogs", "ALA v UGA"],
    ["Texas A&M at LSU", "TAMU @ LSU"],
    ["Men's College Basketball: Duke at North Carolina", "DUKE @ UNC"],
    ["Wake Forest at Duke", "WAKE @ DUKE"],
    ["Miami (FL) at Notre Dame", "MIA @ ND"],
    // Louisville and Pitt: the college hint excludes the NFL, NHL and MLB.
    ["College Football: Cardinals at Panthers", "LOU @ PITT"],
    // Full names win over the bare state.
    ["Kansas City Chiefs at Texas", "KC @ TEX"],
  ])("%j → %j", (raw, expected) => {
    expect(formatMatchup(raw)).toBe(expected);
  });

  it("keeps pro teams when the full name is given", () => {
    expect(parseTitle("Utah Jazz at Houston Rockets").matchup?.league).toBe("nba");
    expect(parseTitle("Utah at Houston").matchup?.league).toBe("ncaa");
  });
});

describe("generic matchups", () => {
  it.each([
    ["Men's College Basketball: Gonzaga at Saint Mary's", "GONZ @ SAIN"],
    ["NCAA Football: Appalachian State vs. Coastal Carolina", "APPA v COAS"],
    ["College Basketball: Boston College at Gonzaga", "BC @ GONZ"],
    ["Women's Volleyball: Nebraska at Creighton", "NEB @ CREI"],
    ["College Football: St. John's vs. The Citadel", "JOHN v CITA"],
    // Table names that fit more than one league.
    ["Giants at Cardinals", "GIAN @ CARD"],
    ["Panthers at Jets", "PANT @ JETS"],
    ["Texas Rangers at Los Angeles Kings", "TEX @ LAK"],
  ])("%j → %j", (raw, expected) => {
    expect(formatMatchup(raw)).toBe(expected);
  });

  it("keeps the table id for a known side", () => {
    expect(parseTitle("College Basketball: Gonzaga vs. Baylor").matchup).toEqual({
      separator: "v",
      teams: [{ abbr: "GONZ" }, { abbr: "BAY", teamId: "ncaa:BAY" }],
    });
  });

  it.each([
    "CBS 4 News at 6", // digits
    "Breakfast at Tiffany's", // no sports hint
    "Live at the Apollo", // lowercase word
    "Rams at Billsville", // only one side is a table name, and no hint
    "College Football Live at Noon", // show words
    "NFL Films Presents at Midnight", // has a hint, but show words rule it out
    "NBA Countdown at Halftime",
    "Gonzaga at Saint Mary's", // unknown teams need a hint
  ])("%j is not a matchup", (raw) => {
    expect(parseTitle(raw).matchup).toBeUndefined();
  });
});

describe("parseTitle", () => {
  it("returns league, separator and team ids for a matchup", () => {
    expect(parseTitle("Monday Night Football: Buffalo Bills at Los Angeles Rams")).toEqual({
      display: "BUF @ LAR",
      matchup: {
        league: "nfl",
        separator: "@",
        teams: [
          { abbr: "BUF", teamId: "nfl:BUF" },
          { abbr: "LAR", teamId: "nfl:LAR" },
        ],
      },
    });
  });

  it("keeps the title's order for vs matchups", () => {
    expect(parseTitle("Chicago Bears vs. Green Bay Packers").matchup).toMatchObject({
      separator: "v",
      teams: [{ abbr: "CHI" }, { abbr: "GB" }],
    });
  });

  it("has no matchup for other titles", () => {
    expect(parseTitle("CBS 4 News at 6")).toEqual({ display: "CBS 4 News at 6" });
  });
});

describe("LEAGUES", () => {
  // Folded the same way parseTitle matches, so "Montréal" and "Montreal" count as one name.
  const fold = (n: string) => n.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

  it.each(LEAGUES.map((l) => [l.id, l] as const))("%s has unique abbreviations", (_, league) => {
    const abbrs = league.teams.map((t) => t.abbr);
    expect(new Set(abbrs).size).toBe(abbrs.length);
  });

  // A name repeated within a pool (e.g. a club in both English tables) would make it ambiguous.
  const pools = [...new Set(LEAGUES.map(poolOf))];
  it.each(pools)("pool %s has unique names", (pool) => {
    const names = LEAGUES.filter((l) => poolOf(l) === pool).flatMap((l) =>
      l.teams.flatMap((t) => t.names.map(fold)),
    );
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });
});
