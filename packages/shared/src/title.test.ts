import { describe, expect, it } from "vitest";
import { formatMatchup, MAX_TITLE_LENGTH } from ".";

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
    ["Kansas City Chiefs vs. Buffalo Bills", "KC vs BUF"],
    ["Chiefs at Bills", "KC @ BUF"],
    ["NFL: New York Jets @ New York Giants", "NYJ @ NYG"],
    ["los angeles chargers AT las vegas raiders", "LAC @ LV"],
    ["Green Bay Packers v Chicago Bears", "GB vs CHI"],
    ["Chiefs at Bills - YouTube TV", "KC @ BUF"],
  ])("variant %j → %j", (raw, expected) => {
    expect(formatMatchup(raw)).toBe(expected);
  });

  it("does not match team names inside other words", () => {
    expect(formatMatchup("Rams at Billsville")).toBe("Rams at Billsvi…");
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
