import { describe, expect, it } from "vitest";
import {
  flashFill,
  focusKeySvg,
  inkFor,
  muteAllKeySvg,
  openKeySvg,
  pickFills,
  type ScoreView,
  type SlotKeyView,
  slotKeySvg,
  teamSplit,
  toDataUrl,
  tooClose,
  wrap,
} from "../src/render";

const decode = (url: string) =>
  Buffer.from(url.replace("data:image/svg+xml;base64,", ""), "base64").toString();

/** The fill of the matchup layout's top (0) or bottom (84) team row. */
const rowFill = (svg: string, top: 0 | 84) =>
  new RegExp(`<rect y="${top}" width="144" height="60" fill="(#[0-9A-Fa-f]{6})"/>`).exec(svg)?.[1];
/** The fill of the matchup layout's info band. */
const bandFill = (svg: string) =>
  /<rect y="60" width="144" height="24" fill="(#[0-9A-Fa-f]{6})"\/>/.exec(svg)?.[1];

describe("slotKeySvg", () => {
  // Shows that aren't matchups use the text layout; "team colors" below covers matchups.
  it("shows the title, slot badge, and heard highlight", () => {
    const svg = slotKeySvg({ slot: 1, connected: true, title: "NFL GameDay Live", heard: true });
    expect(svg).toContain(">NFL</text>");
    expect(svg).toContain(">1</text>");
    expect(svg).toContain('stroke="#22c55e" stroke-width="8"'); // green border
    expect(svg).toMatchSnapshot();
  });

  it("shows a muted game without the border", () => {
    const svg = slotKeySvg({ slot: 2, connected: true, title: "NFL GameDay Live", heard: false });
    expect(svg).toContain(">NFL</text>");
    expect(svg).not.toContain('stroke-width="8"');
    expect(svg).toMatchSnapshot();
  });

  it("wraps long non-matchup titles onto two lines", () => {
    const svg = slotKeySvg({ slot: 4, connected: true, title: "NFL GameDay Live", heard: false });
    expect(svg).toContain(">NFL</text>");
    expect(svg).toContain(">GameDay…</text>");
  });

  it("falls back to 'YouTube TV' when the title is not known yet", () => {
    const svg = slotKeySvg({ slot: 3, connected: true, title: "", heard: false });
    expect(svg).toContain(">YouTube</text>");
    expect(svg).toContain(">TV</text>");
  });

  it("falls back to the service's name when the title is not known yet", () => {
    expect(
      slotKeySvg({ slot: 3, connected: true, title: "", heard: false, service: "peacock" }),
    ).toContain(">Peacock</text>");
    expect(
      slotKeySvg({ slot: 3, connected: true, title: "", heard: false, service: "paramountPlus" }),
    ).toContain(">Paramount+</text>");
  });

  it("dims an empty slot to just its number", () => {
    const svg = slotKeySvg({ slot: 7, connected: true });
    expect(svg).toContain(">7</text>");
    expect(svg).toContain('fill="#0a0a0a"');
    expect(svg).toMatchSnapshot();
  });

  it("shows 'No Chrome' when disconnected", () => {
    const svg = slotKeySvg({ slot: 1, connected: false, title: "ignored", heard: true });
    expect(svg).toContain(">No</text>");
    expect(svg).toContain(">Chrome</text>");
    expect(svg).not.toContain("ignored");
    expect(svg).toMatchSnapshot();
  });

  it.each(["plugin", "extension"] as const)("tells you to update the %s on a mismatch", (side) => {
    const svg = slotKeySvg({ slot: 3, connected: true, title: "ignored", mismatch: side });
    expect(svg).toContain(">Update</text>");
    expect(svg).toContain(`>${side}</text>`);
    expect(svg).toContain(">3</text>"); // slot badge
    expect(svg).toContain('fill="#f59e0b"'); // warning triangle
    expect(svg).not.toContain("ignored");
    expect(svg).toMatchSnapshot();
  });

  it("prefers 'No Chrome' over a mismatch", () => {
    const svg = slotKeySvg({ slot: 1, connected: false, mismatch: "plugin" });
    expect(svg).toContain(">Chrome</text>");
    expect(svg).not.toContain(">Update</text>");
  });

  it("escapes XML in titles", () => {
    const svg = slotKeySvg({ slot: 1, connected: true, title: "A&B <x>", heard: false });
    expect(svg).toContain("A&amp;B &lt;x&gt;");
  });
});

describe("muteAllKeySvg", () => {
  it.each([
    [{ connected: true, allMuted: false, canRestore: true }, "Mute all"],
    [{ connected: true, allMuted: true, canRestore: true }, "Restore"],
    [{ connected: true, allMuted: true, canRestore: false }, "All muted"],
    [{ connected: false, allMuted: true, canRestore: false }, "No Chrome"],
  ])("%j → %s", (view, label) => {
    const svg = muteAllKeySvg(view);
    expect(svg).toContain(`>${label}</text>`);
    expect(svg).toMatchSnapshot();
  });

  it.each(["plugin", "extension"] as const)("tells you to update the %s on a mismatch", (side) => {
    const svg = muteAllKeySvg({
      connected: true,
      allMuted: false,
      canRestore: true,
      mismatch: side,
    });
    expect(svg).toContain(">Update</text>");
    expect(svg).toContain(`>${side}</text>`);
    expect(svg).not.toContain(">Mute all</text>");
    expect(svg).toMatchSnapshot();
  });
});

describe("openKeySvg", () => {
  it("shows the play button with a plus and 'YouTube TV'", () => {
    const svg = openKeySvg({ connected: true });
    expect(svg).toContain(">YouTube TV</text>");
    expect(svg).toContain('fill="#ef4444"'); // red play button
    expect(svg).toMatchSnapshot();
  });

  it("dims to 'Full' when every slot is taken", () => {
    const svg = openKeySvg({ connected: true, full: true });
    expect(svg).toContain(">Full</text>");
    expect(svg).not.toContain('fill="#ef4444"');
    expect(svg).toMatchSnapshot();
  });

  it("shows 'No Chrome' when disconnected, even if the feature is missing", () => {
    const svg = openKeySvg({ connected: false, featureMissing: true, full: true });
    expect(svg).toContain(">No Chrome</text>");
    expect(svg).not.toContain(">Update</text>");
    expect(svg).toMatchSnapshot();
  });

  it("asks to update the extension when it lacks the feature", () => {
    const svg = openKeySvg({ connected: true, featureMissing: true });
    expect(svg).toContain(">Update</text>");
    expect(svg).toContain(">extension</text>");
    expect(svg).toContain('fill="#f59e0b"'); // warning triangle
    expect(svg).toMatchSnapshot();
  });

  it("shows a protocol mismatch over a missing feature", () => {
    const svg = openKeySvg({ connected: true, mismatch: "plugin", featureMissing: true });
    expect(svg).toContain(">plugin</text>");
    expect(svg).not.toContain(">extension</text>");
  });

  it("prefers the update warning over 'Full'", () => {
    const svg = openKeySvg({ connected: true, featureMissing: true, full: true });
    expect(svg).toContain(">Update</text>");
    expect(svg).not.toContain(">Full</text>");
  });

  it.each([
    ["peacock", "Peacock", "#000000"],
    ["paramountPlus", "Paramount+", "#0064ff"],
  ] as const)("shows %s's name on a play button in its color", (service, name, color) => {
    const svg = openKeySvg({ connected: true, service });
    expect(svg).toContain(`>${name}</text>`);
    expect(svg).toContain(`fill="${color}"`);
    expect(svg).not.toContain('fill="#ef4444"');
    expect(svg).toMatchSnapshot();
  });

  it("shows the dimmed monogram and 'Turn on' when the service is off", () => {
    const svg = openKeySvg({ connected: true, service: "paramountPlus", off: true, full: true });
    expect(svg).toContain(">Turn on</text>");
    expect(svg).toContain(">P+</text>");
    expect(svg).not.toContain('fill="#0064ff"'); // dimmed
    expect(svg).not.toContain(">Full</text>");
    expect(svg).toMatchSnapshot();
  });

  it("prefers 'Update extension' over 'Turn on'", () => {
    const svg = openKeySvg({
      connected: true,
      service: "peacock",
      off: true,
      featureMissing: true,
    });
    expect(svg).toContain(">extension</text>");
    expect(svg).not.toContain(">Turn on</text>");
  });
});

describe("service badge", () => {
  const TV = ">TV</text>";
  const PEACOCK = ">P</text>";
  const PPLUS = ">P+</text>";
  const game = { slot: 1, connected: true, title: "NFL GameDay Live", heard: false };
  const matchup = "San Francisco 49ers at Seattle Seahawks";

  it("marks YouTube TV games, including from extensions that don't send a service", () => {
    expect(slotKeySvg(game)).toContain(TV);
    expect(slotKeySvg({ ...game, service: "youtubeTv" })).toContain(TV);
  });

  it.each([
    ["peacock", PEACOCK, "#000000"],
    ["paramountPlus", PPLUS, "#0064ff"],
  ] as const)("draws %s's monogram in its color", (service, mark, color) => {
    const svg = slotKeySvg({ ...game, service });
    expect(svg).toContain(mark);
    expect(svg).toContain(`fill="${color}"`);
    expect(svg).not.toContain(TV);
  });

  it("sits in the bottom-left corner on a dark disc", () => {
    expect(slotKeySvg({ ...game, service: "peacock" })).toContain(
      '<circle cx="22" cy="122" r="17" fill="#111418" fill-opacity="0.85"/>',
    );
  });

  it("is drawn on heard, team-color and Focus keys", () => {
    expect(slotKeySvg({ ...game, heard: true, service: "peacock" })).toContain(PEACOCK);
    expect(slotKeySvg({ ...game, title: matchup, service: "paramountPlus" })).toContain(PPLUS);
    expect(
      focusKeySvg({ connected: true, title: "NFL GameDay Live", service: "peacock" }),
    ).toContain(PEACOCK);
    expect(focusKeySvg({ connected: true, title: matchup, service: "paramountPlus" })).toContain(
      PPLUS,
    );
    expect(slotKeySvg({ ...game, title: matchup, service: "paramountPlus" })).toMatchSnapshot();
  });

  it("is not drawn without a game", () => {
    for (const svg of [
      slotKeySvg({ slot: 1, connected: true }),
      slotKeySvg({ slot: 1, connected: false }),
      slotKeySvg({ slot: 1, connected: true, title: "x", mismatch: "plugin" }),
      focusKeySvg({ connected: true }),
      focusKeySvg({ connected: true, title: "x", featureMissing: true }),
    ]) {
      expect(svg).not.toContain('cy="122" r="17"');
    }
  });

  it("falls back to the service's name on the Focus key", () => {
    expect(focusKeySvg({ connected: true, title: "", service: "peacock" })).toContain(
      ">Peacock</text>",
    );
  });
});

describe("focusKeySvg", () => {
  it("shows the heard matchup under a green crosshair", () => {
    const svg = focusKeySvg({
      connected: true,
      title: "San Francisco 49ers at Seattle Seahawks",
      teamColors: false,
    });
    expect(svg).toContain(">SF @ SEA</text>");
    expect(svg).toContain('stroke="#22c55e"'); // green crosshair
    expect(svg).toMatchSnapshot();
  });

  it("wraps a long non-matchup title", () => {
    const svg = focusKeySvg({ connected: true, title: "NFL GameDay Live" });
    expect(svg).toContain(">NFL</text>");
    expect(svg).toContain(">GameDay…</text>");
    expect(svg).toMatchSnapshot();
  });

  it("falls back to 'YouTube TV' when the title is not known yet", () => {
    const svg = focusKeySvg({ connected: true, title: "" });
    expect(svg).toContain(">YouTube</text>");
    expect(svg).toContain(">TV</text>");
  });

  it("dims to 'Nothing heard' when no game is heard", () => {
    const svg = focusKeySvg({ connected: true });
    expect(svg).toContain(">Nothing</text>");
    expect(svg).toContain(">heard</text>");
    expect(svg).not.toContain('stroke="#22c55e"');
    expect(svg).toMatchSnapshot();
  });

  it("shows 'No Chrome' when disconnected", () => {
    const svg = focusKeySvg({ connected: false, featureMissing: true, title: "ignored" });
    expect(svg).toContain(">No Chrome</text>");
    expect(svg).not.toContain("ignored");
    expect(svg).toMatchSnapshot();
  });

  it("asks to update the extension when it lacks the feature", () => {
    const svg = focusKeySvg({ connected: true, featureMissing: true, title: "ignored" });
    expect(svg).toContain(">Update</text>");
    expect(svg).toContain(">extension</text>");
    expect(svg).not.toContain("ignored");
    expect(svg).toMatchSnapshot();
  });

  it("shows a protocol mismatch over a missing feature", () => {
    const svg = focusKeySvg({ connected: true, mismatch: "plugin", featureMissing: true });
    expect(svg).toContain(">plugin</text>");
    expect(svg).not.toContain(">extension</text>");
  });

  it("escapes XML in titles", () => {
    expect(focusKeySvg({ connected: true, title: "A&B <x>" })).toContain("A&amp;B &lt;x&gt;");
  });
});

describe("team colors", () => {
  const SF = "#AA0000";
  const SEA = "#002244";
  const DARK_TEXT = 'fill="#111418"';

  it("draws a known matchup as two team rows and a band on a Game Slot key", () => {
    const svg = slotKeySvg({
      slot: 1,
      connected: true,
      title: "San Francisco 49ers at Seattle Seahawks",
      heard: true,
    });
    expect(rowFill(svg, 0)).toBe(SF);
    expect(rowFill(svg, 84)).toBe(SEA);
    expect(svg).toContain('font-size="30" font-weight="700" text-anchor="start">SF</text>');
    expect(svg).toContain('text-anchor="start">SEA</text>');
    expect(svg).not.toContain(">@</text>");
    expect(svg).not.toContain('text-anchor="end"'); // no score
    expect(svg).toContain(">1</text>"); // slot number in the band
    expect(svg).toContain(">TV</text>"); // service monogram in the band
    expect(bandFill(svg)).toBe("#22c55e"); // heard: green band
    expect(svg).not.toContain('stroke-width="8"'); // instead of the border
    expect(svg).toMatchSnapshot();
  });

  it("keeps the speaker off and the band dark for a game you aren't hearing", () => {
    const svg = slotKeySvg({
      slot: 2,
      connected: true,
      title: "San Francisco 49ers at Seattle Seahawks",
      heard: false,
    });
    expect(bandFill(svg)).toBe("#0a0a0a");
    expect(svg).not.toContain('stroke-width="8"');
    expect(svg).toContain("M9 -6 L19 6"); // speaker cross
    expect(svg).toMatchSnapshot();
  });

  it("draws the same rows with Show score off as before the game", () => {
    const title = "San Francisco 49ers at Seattle Seahawks";
    const pre = slotKeySvg({
      slot: 2,
      connected: true,
      title,
      score: { state: "pre", status: "", scores: [0, 0] },
    });
    expect(slotKeySvg({ slot: 2, connected: true, title })).toBe(pre);
  });

  it("uses the second team's secondary color when the primaries clash", () => {
    // Bills #00338D and Rams #003594 are both royal blue.
    const svg = slotKeySvg({
      slot: 2,
      connected: true,
      title: "Buffalo Bills at Los Angeles Rams",
      heard: false,
    });
    expect(rowFill(svg, 0)).toBe("#00338D");
    expect(rowFill(svg, 84)).toBe("#FFA300");
  });

  it("puts dark text on a light team color", () => {
    const split = teamSplit("Pittsburgh Steelers at Green Bay Packers")!;
    expect(split.fills).toEqual(["#FFB612", "#203731"]);
    expect(inkFor("#FFB612")).toBe("#111418");
    expect(inkFor("#203731")).toBe("#f5f5f5");
    const svg = slotKeySvg({ slot: 5, connected: true, title: "Steelers at Packers" });
    expect(svg).toMatch(new RegExp(`${DARK_TEXT}[^>]*>PIT</text>`));
  });

  it("gives an unknown side the normal key background", () => {
    // Gonzaga isn't in any table; the sport word lets the generic matcher pair it with the Chiefs.
    const split = teamSplit("Football: Kansas City Chiefs at Gonzaga");
    expect(split).toEqual({ abbrs: ["KC", "GONZ"], separator: "@", fills: ["#E31837", "#111418"] });
  });

  it("draws dark rows when neither team has colors", () => {
    expect(teamSplit("College Basketball: Gonzaga at Saint Mary's")).toBeUndefined();
    const svg = slotKeySvg({
      slot: 4,
      connected: true,
      title: "College Basketball: Gonzaga at Saint Mary's",
      heard: false,
    });
    expect(rowFill(svg, 0)).toBe("#111418");
    expect(rowFill(svg, 84)).toBe("#111418");
    expect(svg).toContain('text-anchor="start">GONZ</text>');
    expect(svg).toContain('text-anchor="start">SAIN</text>');
    expect(svg).toMatchSnapshot();
  });

  it("leaves shows that aren't matchups as text", () => {
    expect(teamSplit("NFL GameDay Live")).toBeUndefined();
    expect(
      slotKeySvg({ slot: 1, connected: true, title: "NFL GameDay Live", heard: false }),
    ).not.toContain('height="60"');
  });

  it("draws dark rows when team colors are turned off", () => {
    const svg = slotKeySvg({
      slot: 1,
      connected: true,
      title: "San Francisco 49ers at Seattle Seahawks",
      heard: true,
      teamColors: false,
    });
    expect(rowFill(svg, 0)).toBe("#111418");
    expect(rowFill(svg, 84)).toBe("#111418");
    expect(svg).toContain('fill="#f5f5f5"'); // light text on the dark rows
    expect(svg).toContain('text-anchor="start">SF</text>');
    expect(svg).not.toContain(SF);
    expect(bandFill(svg)).toBe("#22c55e");
  });

  it("puts the update badge in the band", () => {
    const svg = slotKeySvg({
      slot: 1,
      connected: true,
      title: "San Francisco 49ers at Seattle Seahawks",
      heard: true,
      updateAvailable: true,
    });
    expect(svg).toContain('cx="106" cy="72" r="8" fill="#3b82f6"');
    expect(svg).not.toContain('r="12" fill="#3b82f6"'); // the corner badge
    expect(svg).toMatchSnapshot();
  });

  it("draws a soccer matchup without a separator", () => {
    const svg = slotKeySvg({
      slot: 5,
      connected: true,
      title: "Premier League: Manchester City vs. Arsenal",
      heard: false,
    });
    expect(rowFill(svg, 0)).toBe("#6CABDD"); // Man City sky blue on top
    expect(rowFill(svg, 84)).toBe("#EF0107"); // Arsenal red
    expect(svg).toContain(">MCI</text>");
    expect(svg).toContain(">ARS</text>");
    expect(svg).not.toContain(">v</text>");
  });

  it("splits a national-team matchup", () => {
    // USA navy and Mexico's dark green are too close, so Mexico switches to its red.
    expect(teamSplit("World Cup Qualifier: USA vs Mexico")).toEqual({
      abbrs: ["USA", "MEX"],
      separator: "v",
      fills: ["#0A3161", "#CE1126"],
    });
  });

  it("splits a college matchup", () => {
    const svg = slotKeySvg({
      slot: 3,
      connected: true,
      title: "College Football: Michigan Wolverines at Ohio State Buckeyes",
      heard: false,
    });
    expect(rowFill(svg, 0)).toBe("#00274C"); // Michigan blue on top
    expect(rowFill(svg, 84)).toBe("#BB0000"); // Ohio State scarlet
    expect(svg).toContain(">MICH</text>");
    expect(svg).toContain(">OSU</text>");
  });

  it("splits the heard game on the Focus key, crosshair in the corner", () => {
    const svg = focusKeySvg({ connected: true, title: "San Francisco 49ers at Seattle Seahawks" });
    expect(svg).toContain(`height="72" fill="${SF}"`);
    expect(svg).toContain(">SEA</text>");
    expect(svg).toContain('<g transform="translate(26 26) scale(0.9)">'); // crosshair
    expect(svg).toMatchSnapshot();
  });

  it("keeps the Focus key's text layout when team colors are turned off", () => {
    const svg = focusKeySvg({
      connected: true,
      title: "San Francisco 49ers at Seattle Seahawks",
      teamColors: false,
    });
    expect(svg).toContain(">SF @ SEA</text>");
  });
});

describe("pickFills", () => {
  it("uses both primaries when they differ", () => {
    expect(pickFills(["#AA0000", "#B3995D"], ["#002244", "#69BE28"])).toEqual([
      "#AA0000",
      "#002244",
    ]);
  });

  it("switches the second team to its secondary on a clash", () => {
    expect(pickFills(["#00338D", "#C60C30"], ["#003594", "#FFA300"])).toEqual([
      "#00338D",
      "#FFA300",
    ]);
  });

  it("uses the key background for a missing side", () => {
    expect(pickFills(["#AA0000", "#B3995D"], undefined)).toEqual(["#AA0000", "#111418"]);
    expect(pickFills(undefined, ["#AA0000", "#B3995D"])).toEqual(["#111418", "#AA0000"]);
  });

  it("switches the known team to its secondary when it clashes with the background", () => {
    expect(pickFills(undefined, ["#002244", "#69BE28"])).toEqual(["#111418", "#69BE28"]);
    expect(pickFills(["#002244", "#69BE28"], undefined)).toEqual(["#69BE28", "#111418"]);
  });
});

describe("tooClose", () => {
  it.each([
    ["#00338D", "#003594", true],
    ["#000000", "#111418", true],
    ["#AA0000", "#002244", false],
  ])("%s vs %s → %s", (a, b, expected) => {
    expect(tooClose(a, b)).toBe(expected);
  });
});

describe("update badge", () => {
  const BADGE = 'fill="#3b82f6"';

  it.each([
    ["a game", { slot: 1, connected: true, title: "SF at SEA", heard: true }],
    ["an empty slot", { slot: 5, connected: true }],
    ["No Chrome", { slot: 1, connected: false }],
    ["a mismatch", { slot: 2, connected: true, mismatch: "plugin" as const }],
  ])("is added to %s on a Game Slot key", (_name, view) => {
    expect(slotKeySvg(view)).not.toContain(BADGE);
    const svg = slotKeySvg({ ...view, updateAvailable: true });
    expect(svg).toContain(BADGE);
    expect(svg.endsWith("</svg>")).toBe(true);
  });

  it("is added to the Mute All key", () => {
    const view = { connected: true, allMuted: false, canRestore: false };
    expect(muteAllKeySvg(view)).not.toContain(BADGE);
    expect(muteAllKeySvg({ ...view, updateAvailable: true })).toContain(BADGE);
  });

  it("is added to the Open Service key", () => {
    expect(openKeySvg({ connected: true })).not.toContain(BADGE);
    expect(openKeySvg({ connected: true, updateAvailable: true })).toContain(BADGE);
  });

  it("is added to the Focus Heard Game key", () => {
    const view = { connected: true, title: "SF at SEA" };
    expect(focusKeySvg(view)).not.toContain(BADGE);
    expect(focusKeySvg({ ...view, updateAvailable: true })).toContain(BADGE);
  });

  it("draws in the bottom-right corner", () => {
    expect(
      slotKeySvg({
        slot: 1,
        connected: true,
        title: "SF at SEA",
        heard: true,
        updateAvailable: true,
      }),
    ).toMatchSnapshot();
    expect(
      muteAllKeySvg({ connected: true, allMuted: false, canRestore: false, updateAvailable: true }),
    ).toMatchSnapshot();
  });
});

describe("wrap", () => {
  it.each([
    ["SF @ SEA", ["SF @ SEA"]],
    ["BUF @ LAR", ["BUF @ LAR"]],
    ["NFL GameDay Live", ["NFL", "GameDay…"]],
    ["CBS 4 News at 6", ["CBS 4", "News at 6"]],
    ["Disney Season K…", ["Disney", "Season K…"]],
    ["a b c d e f g h i j k l", ["a b c d e", "f g h i…"]],
    ["Supercalifragilistic", ["Supercalifragilistic"]],
  ])("%j → %j", (label, expected) => {
    expect(wrap(label)).toEqual(expected);
  });
});

describe("toDataUrl", () => {
  it("base64-encodes the SVG", () => {
    expect(decode(toDataUrl("<svg/>"))).toBe("<svg/>");
  });
});

describe("scoreboard layout", () => {
  const KC_BUF = "Kansas City Chiefs at Buffalo Bills";
  const key = (view: Partial<SlotKeyView> = {}, score: Partial<ScoreView> = {}) =>
    slotKeySvg({
      slot: 2,
      connected: true,
      title: KC_BUF,
      heard: false,
      ...view,
      score: { state: "in", status: "Q4 2:08", scores: [17, 20], possession: 0, ...score },
    });
  it("draws a row per team with its score, and the status in the band", () => {
    const svg = key();
    expect(rowFill(svg, 0)).toBe("#E31837"); // KC
    expect(rowFill(svg, 84)).toBe("#00338D"); // BUF
    expect(svg).toContain('text-anchor="start">KC</text>');
    expect(svg).toContain('text-anchor="end">17</text>');
    expect(svg).toContain('text-anchor="end">20</text>');
    expect(svg).toContain(">Q4 2:08</text>");
    expect(svg).toContain(">2</text>"); // slot number in the band
    expect(svg).toContain(">TV</text>");
    expect(svg).toContain('r="4.5"'); // possession dot
    expect(svg).not.toContain('stroke-width="8"');
    expect(svg).toMatchSnapshot();
  });

  it("puts the possession dot on the right row, only while live", () => {
    expect(key({}, { possession: 1 })).toContain('cy="115" r="4.5"');
    expect(key({}, { possession: 0 })).toContain('cy="31" r="4.5"');
    expect(key({}, { possession: undefined })).not.toContain('r="4.5"');
    expect(key({}, { state: "post", status: "FINAL" })).not.toContain('r="4.5"');
  });

  it("shows larger abbreviations and the kickoff time before the game", () => {
    const svg = key({}, { state: "pre", status: "8:15P", scores: [0, 0], possession: undefined });
    expect(svg).toContain('font-size="30" font-weight="700" text-anchor="start">KC</text>');
    expect(svg).not.toContain('text-anchor="end"');
    expect(svg).toContain(">8:15P</text>");
    expect(svg).toMatchSnapshot();
  });

  it("dims the loser's score at the final", () => {
    const svg = key(
      { title: "Toronto Maple Leafs at Boston Bruins" },
      { state: "post", status: "FINAL", scores: [2, 4] },
    );
    expect(svg).toContain('text-anchor="end" opacity="0.5">2</text>');
    expect(svg).toContain('text-anchor="end">4</text>');
    expect(svg).toMatchSnapshot();
  });

  it("dims neither score in a tie", () => {
    const svg = key({}, { state: "post", status: "FINAL", scores: [20, 20] });
    expect(svg).not.toContain("opacity");
  });

  it("shrinks three-digit scores and the abbreviations beside them", () => {
    const svg = key(
      { title: "Boston Celtics at New York Knicks" },
      { status: "Q4 0:41", scores: [108, 112], possession: undefined },
    );
    expect(svg).toContain('font-size="38" font-weight="700" text-anchor="end">112</text>');
    expect(svg).toContain('font-size="20" font-weight="700" text-anchor="start">NYK</text>');
    expect(svg).toMatchSnapshot();
  });

  it.each([
    ["Boston Red Sox at New York Yankees", "▲ 7th", [3, 2]],
    ["Premier League: Arsenal vs. Liverpool", "67'", [1, 1]],
    ["Auburn Tigers at Georgia Bulldogs", "HALF", [7, 14]],
  ] as const)("draws %s at %s", (title, status, scores) => {
    const svg = key({ title }, { status, scores, possession: undefined });
    expect(svg).toContain(`>${status}</text>`);
    expect(svg).toMatchSnapshot();
  });

  it("turns the band green for the heard game instead of drawing a border", () => {
    const svg = key({ heard: true });
    expect(bandFill(svg)).toBe("#22c55e");
    expect(svg).toContain('fill="#06210f"'); // dark ink on the green band
    expect(svg).not.toContain('stroke-width="8"');
    expect(bandFill(key())).toBe("#0a0a0a");
    expect(svg).toMatchSnapshot();
  });

  it("uses dark rows with Team colors off or for unknown teams", () => {
    const plain = key({ teamColors: false });
    expect(rowFill(plain, 0)).toBe("#111418");
    expect(rowFill(plain, 84)).toBe("#111418");
    expect(plain).toContain(">KC</text>");

    const unknown = key(
      { title: "College Basketball: Gonzaga at Saint Mary's" },
      { status: "2H 9:15", scores: [41, 38], possession: undefined },
    );
    expect(rowFill(unknown, 0)).toBe("#111418");
    expect(unknown).toContain('font-size="22" font-weight="700" text-anchor="start">GONZ</text>');
    expect(unknown).toMatchSnapshot();
  });

  it("blinks the scoring team's row and the callout yellow on a row alert frame", () => {
    const on = key({ heard: true }, { alert: { team: 1, points: 3, mode: "row", on: true } });
    expect(rowFill(on, 84)).toBe("#ffe600");
    expect(rowFill(on, 0)).toBe("#E31837");
    expect(bandFill(on)).toBe("#ffe600");
    expect(on).toContain('fill="#111418" font-family="Segoe UI, Arial, sans-serif" font-size="42"');
    expect(on).toContain('fill="#111418" font-family="Segoe UI, Arial, sans-serif" font-size="14"');
    expect(on).toContain(">+3 BUF</text>");
    expect(on).toMatchSnapshot();

    // An "off" frame shows the team's own color, with the callout already in the band.
    const off = key({ heard: true }, { alert: { team: 1, points: 3, mode: "row", on: false } });
    expect(rowFill(off, 84)).toBe("#00338D");
    expect(bandFill(off)).toBe("#00338D");
    expect(off).toContain(">+3 BUF</text>");
    expect(off).not.toContain(">Q4 2:08</text>");
  });

  it("flashes white for a team too close to yellow, and yellow with Team colors off", () => {
    expect(flashFill("#FFB612")).toBe("#f5f5f5"); // PIT gold
    expect(flashFill("#00338D")).toBe("#ffe600");
    const alert = { team: 1, points: 7, mode: "row", on: true } as const;
    const gold = key({ title: "Kansas City Chiefs at Pittsburgh Steelers" }, { alert });
    expect(rowFill(gold, 84)).toBe("#f5f5f5");
    expect(bandFill(gold)).toBe("#f5f5f5");
    const plain = key({ teamColors: false }, { alert });
    expect(rowFill(plain, 84)).toBe("#ffe600");
    expect(bandFill(plain)).toBe("#ffe600");
  });

  it("shows the callout in the scoring team's color on a band alert", () => {
    const svg = key({ heard: true }, { alert: { team: 1, points: 3, mode: "band", on: true } });
    expect(bandFill(svg)).toBe("#00338D");
    expect(svg).toContain(">+3 BUF</text>");
    expect(svg).not.toContain(">Q4 2:08</text>");
    expect(svg).toMatchSnapshot();
  });

  it("moves the update badge into the band", () => {
    const svg = key({ updateAvailable: true });
    expect(svg).toContain('cx="106" cy="72" r="8" fill="#3b82f6"');
    expect(svg).not.toContain('r="12" fill="#3b82f6"'); // the corner badge
    // The status gets less room, so a long one shrinks.
    expect(key({ updateAvailable: true }, { status: "MON 8:15P", state: "pre" })).toContain(
      'font-size="9" font-weight="700" text-anchor="middle">MON 8:15P</text>',
    );
    expect(key({}, { status: "MON 8:15P", state: "pre" })).toContain(
      'font-size="13" font-weight="700" text-anchor="middle">MON 8:15P</text>',
    );
  });

  it("keeps the normal key without a matchup, a connection or a matching protocol", () => {
    const plain = (view: Partial<SlotKeyView>) =>
      slotKeySvg({ slot: 2, connected: true, title: KC_BUF, heard: false, ...view });
    const withScore = (view: Partial<SlotKeyView>) => key(view);
    expect(withScore({ title: "NFL GameDay Live" })).toBe(plain({ title: "NFL GameDay Live" }));
    expect(withScore({ connected: false })).toBe(plain({ connected: false }));
    expect(withScore({ mismatch: "plugin" })).toBe(plain({ mismatch: "plugin" }));
    expect(withScore({ title: undefined })).toBe(plain({ title: undefined }));
    expect(key().startsWith("<svg")).toBe(true);
  });
});
