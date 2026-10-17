// Fixtures are trimmed real ESPN responses from 2026-03 to 2026-10. Events with ids starting
// 9000000 were hand-edited from a real event (live states that weren't on air when captured).
import { readFileSync } from "node:fs";
import { type Matchup, parseTitle } from "@rotho/shared";
import { describe, expect, it } from "vitest";
import { type EspnEvent, parseScoreboard, statusText } from "../src/scores/espn";
import { type Feed, feedKey, feedsFor, feedUrl } from "../src/scores/feeds";
import { matchEvent } from "../src/scores/match";

const load = (name: string): EspnEvent[] =>
  parseScoreboard(
    JSON.parse(readFileSync(new URL(`./fixtures/espn/${name}.json`, import.meta.url), "utf8")),
  );
const byId = (events: EspnEvent[], id: string) => events.find((e) => e.id === id)!;
const matchup = (title: string): Matchup => parseTitle(title).matchup!;
const at = (iso: string) => Date.parse(iso);

const FEEDS = {
  nfl: { path: "football/nfl", sport: "football" },
  cfb: { path: "football/college-football", sport: "football", query: "groups=80" },
  mcbb: {
    path: "basketball/mens-college-basketball",
    sport: "basketball",
    query: "groups=50",
    halves: true,
  },
  nba: { path: "basketball/nba", sport: "basketball" },
  mlb: { path: "baseball/mlb", sport: "baseball" },
  nhl: { path: "hockey/nhl", sport: "hockey" },
  epl: { path: "soccer/eng.1", sport: "soccer" },
} satisfies Record<string, Feed>;

const nfl = load("nfl");
const cfb = load("college-football");
const mcbb = load("mens-college-basketball");
const nba = load("nba");
const mlb = load("mlb");
const nhl = load("nhl");
const epl = load("eng.1");
const ucl = load("uefa.champions");

describe("parseScoreboard", () => {
  it("reads every fixture event", () => {
    expect([nfl, cfb, mcbb, nba, mlb, nhl, epl, ucl].map((events) => events.length)).toEqual([
      3, 5, 2, 3, 2, 2, 4, 2,
    ]);
  });

  it("reads scores, names, state and status", () => {
    expect(byId(cfb, "401856719")).toEqual({
      id: "401856719",
      start: at("2026-10-17T19:30Z"),
      state: "in",
      statusName: "STATUS_IN_PROGRESS",
      period: 2,
      clock: "1:30",
      detail: "1:30 - 2nd",
      competitors: [
        {
          id: "61",
          homeAway: "home",
          score: 14,
          names: ["Georgia Bulldogs", "Georgia", "Georgia"],
        },
        { id: "2", homeAway: "away", score: 14, names: ["Auburn Tigers", "Auburn", "Auburn"] },
      ],
      possession: "away",
    });
  });

  it("reads possession from the situation, or the half inning in baseball", () => {
    expect(byId(cfb, "401866478").possession).toBe("home");
    expect(byId(cfb, "401856721").possession).toBeUndefined(); // possession ""
    expect(byId(mlb, "900000001").possession).toBe("away"); // Top 7th
    expect(byId(nhl, "401892520").possession).toBeUndefined();
  });

  it("treats a missing period (soccer before kickoff) as 0", () => {
    expect(byId(ucl, "401915399").period).toBe(0);
  });

  it("skips malformed events and bad responses", () => {
    const good = JSON.parse(
      readFileSync(new URL("./fixtures/espn/nfl.json", import.meta.url), "utf8"),
    ).events[0];
    const oneSided = {
      ...good,
      competitions: [{ competitors: [good.competitions[0].competitors[0]] }],
    };
    expect(parseScoreboard({ events: [{}, null, "x", oneSided, good] })).toHaveLength(1);
    expect(parseScoreboard({ events: [{ ...good, date: "soon" }] })).toEqual([]);
    expect(parseScoreboard({ events: [{ ...good, status: { type: { state: "?" } } }] })).toEqual(
      [],
    );
    expect(parseScoreboard(null)).toEqual([]);
    expect(parseScoreboard({ events: "none" })).toEqual([]);
  });
});

describe("statusText", () => {
  const now = at("2026-10-17T20:00Z");
  const opts = { now, timeZone: "America/New_York" };
  const status = (event: EspnEvent, feed: Feed, now_ = now) =>
    statusText(event, feed, { now: now_, timeZone: "America/New_York" });
  const edit = (event: EspnEvent, changes: Partial<EspnEvent>): EspnEvent => ({
    ...event,
    ...changes,
  });

  it("shows the period and clock while live", () => {
    expect(status(byId(cfb, "401856719"), FEEDS.cfb)).toBe("Q2 1:30");
    expect(status(byId(mcbb, "900000005"), FEEDS.mcbb)).toBe("2H 9:15");
    expect(status(byId(nba, "900000006"), FEEDS.nba)).toBe("Q4 0:41");
    expect(status(byId(nhl, "401892520"), FEEDS.nhl)).toBe("P2 12:04");
    expect(status(byId(epl, "900000003"), FEEDS.epl)).toBe("67'");
  });

  it("shows the half inning in baseball", () => {
    const live = byId(mlb, "900000001");
    expect(status(live, FEEDS.mlb)).toBe("▲ 7th");
    expect(status(edit(live, { detail: "Bot 9th" }), FEEDS.mlb)).toBe("▼ 9th");
    expect(status(edit(live, { detail: "Mid 7th" }), FEEDS.mlb)).toBe("MID 7th");
    expect(status(edit(live, { detail: "End 11th" }), FEEDS.mlb)).toBe("END 11th");
  });

  it("shows breaks", () => {
    expect(status(byId(cfb, "401858264"), FEEDS.cfb)).toBe("HALF");
    expect(status(byId(epl, "900000004"), FEEDS.epl)).toBe("HT");
    const live = byId(nhl, "401892520");
    expect(
      status(edit(live, { statusName: "STATUS_END_PERIOD", period: 1, clock: "0:00" }), FEEDS.nhl),
    ).toBe("END P1");
  });

  it("counts overtime periods", () => {
    const live = byId(nba, "900000006");
    expect(status(edit(live, { period: 5, clock: "3:10" }), FEEDS.nba)).toBe("OT 3:10");
    expect(status(edit(live, { period: 6, clock: "1:02" }), FEEDS.nba)).toBe("2OT 1:02");
    expect(status(edit(live, { period: 3, clock: "2:00" }), FEEDS.mcbb)).toBe("OT 2:00");
  });

  it("shows the final, with overtime or shootout", () => {
    expect(status(byId(cfb, "401856720"), FEEDS.cfb)).toBe("FINAL");
    expect(status(byId(nfl, "401872995"), FEEDS.nfl)).toBe("F/OT");
    expect(status(byId(epl, "401879262"), FEEDS.epl)).toBe("FINAL");
    const final = byId(nhl, "401892519");
    expect(status(edit(final, { detail: "Final/SO" }), FEEDS.nhl)).toBe("F/SO");
    expect(status(edit(byId(epl, "401879262"), { detail: "AET" }), FEEDS.epl)).toBe("F/ET");
    expect(status(edit(byId(epl, "401879262"), { detail: "FT-Pens" }), FEEDS.epl)).toBe("F/PK");
  });

  it("shows the local kickoff time, with the weekday on another day", () => {
    // 2026-10-18T00:00Z is 8:00 PM on Saturday the 17th in New York.
    expect(statusText(byId(mlb, "401908027"), FEEDS.mlb, opts)).toBe("8:00P");
    // 2026-10-20T00:15Z is Monday 8:15 PM.
    const mnf = byId(nfl, "401873008");
    expect(status(mnf, FEEDS.nfl, at("2026-10-19T16:00Z"))).toBe("8:15P");
    expect(status(mnf, FEEDS.nfl)).toBe("MON 8:15P");
    expect(
      statusText(byId(ucl, "401915399"), { path: "soccer/uefa.champions", sport: "soccer" }, opts),
    ).toBe("TUE 3:00P");
  });

  it("shows postponed and delayed games", () => {
    const live = byId(mlb, "900000001");
    expect(status(edit(live, { statusName: "STATUS_POSTPONED", state: "post" }), FEEDS.mlb)).toBe(
      "PPD",
    );
    expect(status(edit(live, { statusName: "STATUS_RAIN_DELAY" }), FEEDS.mlb)).toBe("DELAY");
  });

  it("keeps every fixture status at 9 characters or fewer", () => {
    const all: [EspnEvent[], Feed][] = [
      [nfl, FEEDS.nfl],
      [cfb, FEEDS.cfb],
      [mcbb, FEEDS.mcbb],
      [nba, FEEDS.nba],
      [mlb, FEEDS.mlb],
      [nhl, FEEDS.nhl],
      [epl, FEEDS.epl],
    ];
    for (const [events, feed] of all) {
      for (const event of events) expect(status(event, feed).length).toBeLessThanOrEqual(9);
    }
  });
});

describe("feedsFor", () => {
  const keys = (title: string) => feedsFor(matchup(title), title).map(feedKey);

  it("uses the league's feed for pro teams", () => {
    expect(keys("Monday Night Football: Washington Commanders at San Francisco 49ers")).toEqual([
      "football/nfl",
    ]);
    expect(keys("Golden State Warriors at Sacramento Kings")).toEqual(["basketball/nba"]);
  });

  it("narrows college games by the title", () => {
    expect(keys("College Football: Auburn at Georgia")).toEqual([
      "football/college-football?groups=80",
    ]);
    expect(keys("Men's College Basketball: North Carolina at Duke")).toEqual([
      "basketball/mens-college-basketball?groups=50",
    ]);
    expect(keys("Women's College Basketball: North Carolina at Duke")).toEqual([
      "basketball/womens-college-basketball?groups=50",
    ]);
    expect(keys("Auburn Tigers at Georgia Bulldogs")).toEqual([
      "football/college-football?groups=80",
      "basketball/mens-college-basketball?groups=50",
      "basketball/womens-college-basketball?groups=50",
    ]);
  });

  it("searches both domestic leagues and UEFA for European clubs", () => {
    expect(keys("UEFA Champions League: Barcelona vs. Paris Saint-Germain")).toEqual([
      "soccer/esp.1",
      "soccer/esp.copa_del_rey",
      "soccer/fra.1",
      "soccer/fra.coupe_de_france",
      "soccer/uefa.champions",
      "soccer/uefa.europa",
      "soccer/uefa.europa.conf",
    ]);
  });

  it("returns nothing unless both teams are table teams from one pool", () => {
    expect(keys("College Basketball: Gonzaga at Saint Mary's")).toEqual([]);
    const crossed: Matchup = {
      separator: "@",
      teams: [
        { abbr: "BUF", teamId: "nfl:BUF" },
        { abbr: "BOS", teamId: "nba:BOS" },
      ],
    };
    expect(feedsFor(crossed, "")).toEqual([]);
  });

  it("builds the scoreboard URL", () => {
    expect(feedUrl(FEEDS.cfb)).toBe(
      "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80",
    );
    expect(feedUrl(FEEDS.nfl)).toBe(
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    );
  });
});

describe("matchEvent", () => {
  const now = at("2026-10-17T20:00Z");

  it("matches by team name and orders scores like the title", () => {
    const game = matchEvent(matchup("Auburn Tigers at Georgia Bulldogs"), cfb, now)!;
    expect(game.event.id).toBe("401856719");
    expect(game.scores).toEqual([14, 14]);
    expect(game.possession).toBe(0); // Auburn, first in the title

    const reversed = matchEvent(matchup("Ole Miss vs. Missouri"), cfb, now)!;
    expect(reversed.event.id).toBe("401856721");
    expect(reversed.scores).toEqual([21, 3]);
  });

  it("matches teams whose ESPN codes differ from ours", () => {
    const sunday = at("2026-10-19T22:00Z");
    expect(
      matchEvent(matchup("Washington Commanders at San Francisco 49ers"), nfl, sunday)?.event.id,
    ).toBe("401873008"); // WSH, ours WAS
    expect(
      matchEvent(matchup("New Jersey Devils at Washington Capitals"), nhl, now)?.scores,
    ).toEqual([2, 4]); // NJ, ours NJD
    const april = at("2026-04-11T03:00Z");
    expect(
      matchEvent(matchup("Golden State Warriors at Sacramento Kings"), nba, april)?.scores,
    ).toEqual([118, 124]); // GS, ours GSW
  });

  it("matches European clubs from different leagues", () => {
    const tuesday = at("2026-10-20T18:00Z");
    const game = matchEvent(matchup("Paris Saint-Germain vs. Barcelona"), ucl, tuesday)!;
    expect(game.event.id).toBe("401915399");
    expect(matchEvent(matchup("VfB Stuttgart vs. Atlético Madrid"), ucl, tuesday)?.event.id).toBe(
      "401915392",
    ); // "Atlético" with an accent
  });

  it("prefers the live game, then the closest start", () => {
    // The fixture holds TB @ CLE twice: scheduled and live.
    const game = matchEvent(matchup("Tampa Bay Rays at Cleveland Guardians"), mlb, now)!;
    expect(game.event.id).toBe("900000001");
    expect(game.possession).toBe(0); // Rays batting in the top half

    const pregame = mlb.filter((e) => e.id === "401908027");
    const later = { ...pregame[0]!, id: "later", start: pregame[0]!.start + 4 * 3600_000 };
    expect(
      matchEvent(matchup("Tampa Bay Rays at Cleveland Guardians"), [later, ...pregame], now)?.event
        .id,
    ).toBe("401908027");
  });

  it("ignores games more than 18 hours away", () => {
    expect(matchEvent(matchup("Washington Commanders at San Francisco 49ers"), nfl, now)).toBe(
      undefined,
    );
  });

  it("returns nothing when no event has both teams", () => {
    expect(matchEvent(matchup("Georgia Tech at Georgia"), cfb, now)).toBeUndefined();
    expect(matchEvent(matchup("Virginia Tech vs. Georgia Tech"), cfb, now)?.scores).toEqual([
      24, 3,
    ]);
    const unknown: Matchup = { separator: "@", teams: [{ abbr: "AKR" }, { abbr: "MIA" }] };
    expect(matchEvent(unknown, cfb, now)).toBeUndefined();
  });
});
