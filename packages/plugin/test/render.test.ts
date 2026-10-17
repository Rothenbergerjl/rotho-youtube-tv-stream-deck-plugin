import { describe, expect, it } from "vitest";
import {
  focusKeySvg,
  inkFor,
  muteAllKeySvg,
  openKeySvg,
  pickFills,
  slotKeySvg,
  teamSplit,
  toDataUrl,
  tooClose,
  wrap,
} from "../src/render";

const decode = (url: string) =>
  Buffer.from(url.replace("data:image/svg+xml;base64,", ""), "base64").toString();

describe("slotKeySvg", () => {
  // The text-layout tests turn team colors off; "team colors" below covers the split layout.
  it("shows the matchup, slot badge, and heard highlight", () => {
    const svg = slotKeySvg({
      slot: 1,
      connected: true,
      title: "San Francisco 49ers at Seattle Seahawks",
      heard: true,
      teamColors: false,
    });
    expect(svg).toContain(">SF @ SEA</text>");
    expect(svg).toContain(">1</text>");
    expect(svg).toContain('stroke="#22c55e" stroke-width="8"'); // green border
    expect(svg).toMatchSnapshot();
  });

  it("shows a muted game without the border", () => {
    const svg = slotKeySvg({
      slot: 2,
      connected: true,
      title: "Monday Night Football with Peyton and Eli: Buffalo Bills at Los Angeles Rams",
      heard: false,
      teamColors: false,
    });
    expect(svg).toContain(">BUF @ LAR</text>");
    expect(svg).not.toContain('stroke-width="8"');
    expect(svg).toMatchSnapshot();
  });

  it("fits a soccer 'v' matchup on one line", () => {
    const svg = slotKeySvg({
      slot: 5,
      connected: true,
      title: "Premier League: Manchester City vs. Arsenal",
      heard: false,
      teamColors: false,
    });
    expect(svg).toContain(">MCI v ARS</text>");
    // Badge number, plus one line of label text.
    expect(svg.match(/<text /g)).toHaveLength(2);
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

  it("splits a known matchup into the two teams' colors on a Game Slot key", () => {
    const svg = slotKeySvg({
      slot: 1,
      connected: true,
      title: "San Francisco 49ers at Seattle Seahawks",
      heard: true,
    });
    expect(svg).toContain(`<rect width="144" height="144" fill="${SEA}"/>`); // bottom half
    expect(svg).toContain(`<rect width="144" height="72" fill="${SF}"/>`); // top half
    expect(svg).toContain(">SF</text>");
    expect(svg).toContain(">SEA</text>");
    expect(svg).toContain(">@</text>");
    expect(svg).not.toContain(">SF @ SEA</text>");
    expect(svg).toContain(">1</text>"); // slot badge
    expect(svg).toContain('stroke="#22c55e" stroke-width="8"'); // heard border
    expect(svg).toMatchSnapshot();
  });

  it("keeps the speaker off and drops the border for a game you aren't hearing", () => {
    const svg = slotKeySvg({
      slot: 2,
      connected: true,
      title: "San Francisco 49ers at Seattle Seahawks",
      heard: false,
    });
    expect(svg).not.toContain('stroke-width="8"');
    expect(svg).toContain("M9 -6 L19 6"); // speaker cross
  });

  it("uses the second team's secondary color when the primaries clash", () => {
    // Bills #00338D and Rams #003594 are both royal blue.
    const svg = slotKeySvg({
      slot: 2,
      connected: true,
      title: "Buffalo Bills at Los Angeles Rams",
      heard: false,
    });
    expect(svg).toContain('height="72" fill="#00338D"');
    expect(svg).toContain('<rect width="144" height="144" fill="#FFA300"/>');
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

  it("falls back to text when neither team has colors", () => {
    expect(teamSplit("College Basketball: Gonzaga at Saint Mary's")).toBeUndefined();
    const svg = slotKeySvg({
      slot: 4,
      connected: true,
      title: "College Basketball: Gonzaga at Saint Mary's",
      heard: false,
    });
    expect(svg).toContain(">GONZ @</text>");
    expect(svg).toContain(">SAIN</text>");
  });

  it("leaves shows that aren't matchups as text", () => {
    expect(teamSplit("NFL GameDay Live")).toBeUndefined();
  });

  it("draws text when team colors are turned off", () => {
    const svg = slotKeySvg({
      slot: 1,
      connected: true,
      title: "San Francisco 49ers at Seattle Seahawks",
      heard: true,
      teamColors: false,
    });
    expect(svg).toContain(">SF @ SEA</text>");
    expect(svg).not.toContain(SF);
  });

  it("keeps the update badge on top of team colors", () => {
    const svg = slotKeySvg({
      slot: 1,
      connected: true,
      title: "San Francisco 49ers at Seattle Seahawks",
      heard: true,
      updateAvailable: true,
    });
    expect(svg.lastIndexOf('fill="#3b82f6"')).toBeGreaterThan(svg.lastIndexOf(SF));
  });

  it("shows a 'v' separator for a soccer matchup", () => {
    const svg = slotKeySvg({
      slot: 5,
      connected: true,
      title: "Premier League: Manchester City vs. Arsenal",
      heard: false,
    });
    expect(svg).toContain('height="72" fill="#6CABDD"'); // Man City sky blue on top
    expect(svg).toContain('<rect width="144" height="144" fill="#EF0107"/>'); // Arsenal red
    expect(svg).toContain(">MCI</text>");
    expect(svg).toContain(">v</text>");
    expect(svg).toContain(">ARS</text>");
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
    expect(svg).toContain('height="72" fill="#00274C"'); // Michigan blue on top
    expect(svg).toContain('<rect width="144" height="144" fill="#BB0000"/>'); // Ohio State scarlet
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

  it("is added to the Open YouTube TV key", () => {
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
