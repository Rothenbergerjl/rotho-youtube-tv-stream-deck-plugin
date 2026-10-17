import { describe, expect, it } from "vitest";
import { parseTitle } from "../title";
import { LEAGUES, teamColors } from "./index";
import type { LeagueId } from "./types";

/** Leagues where every team must have colors. Later phases add the rest. */
const FULL_COVERAGE: readonly LeagueId[] = ["nfl", "nba", "wnba", "mlb", "nhl"];

const HEX = /^#[0-9A-F]{6}$/;

describe("team colors", () => {
  const withColors = LEAGUES.flatMap((league) =>
    league.teams.filter((t) => t.colors).map((t) => [`${league.id}:${t.abbr}`, t.colors!] as const),
  );

  it.each(withColors)("%s has two uppercase #RRGGBB colors", (_id, colors) => {
    expect(colors).toHaveLength(2);
    for (const color of colors) expect(color).toMatch(HEX);
  });

  it.each(FULL_COVERAGE)("every %s team has colors", (id) => {
    const league = LEAGUES.find((l) => l.id === id)!;
    expect(league.teams.filter((t) => !t.colors).map((t) => t.abbr)).toEqual([]);
  });
});

describe("teamColors", () => {
  it("looks a team up by its teamId", () => {
    expect(teamColors("nfl:BUF")).toEqual(["#00338D", "#C60C30"]);
  });

  it("keeps same-abbreviation teams in different leagues apart", () => {
    expect(teamColors("nfl:PHI")).not.toEqual(teamColors("nba:PHI"));
  });

  it("returns undefined for an unknown team", () => {
    expect(teamColors("nfl:XYZ")).toBeUndefined();
    expect(teamColors("")).toBeUndefined();
  });

  it("finds colors for both sides of a parsed matchup", () => {
    const { matchup } = parseTitle("Monday Night Football: Buffalo Bills at Los Angeles Rams");
    const ids = matchup!.teams.map((side) => side.teamId!);
    expect(ids).toEqual(["nfl:BUF", "nfl:LAR"]);
    for (const id of ids) expect(teamColors(id)).toBeDefined();
  });
});
