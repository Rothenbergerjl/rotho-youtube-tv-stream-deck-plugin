import { describe, expect, it } from "vitest";
import { formatMatchup, LEAGUES, MAX_TITLE_LENGTH, parseTitle } from ".";

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
  it.each(LEAGUES.map((l) => [l.id, l] as const))(
    "%s has unique abbreviations and names",
    (_, league) => {
      const abbrs = league.teams.map((t) => t.abbr);
      // Folded the same way parseTitle matches, so "Montréal" and "Montreal" count as one name.
      const names = league.teams.flatMap((t) =>
        t.names.map((n) => n.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()),
      );
      expect(new Set(abbrs).size).toBe(abbrs.length);
      expect(new Set(names).size).toBe(names.length);
    },
  );
});
