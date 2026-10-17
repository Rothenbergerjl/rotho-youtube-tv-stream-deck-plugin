import { describe, expect, it } from "vitest";
import { focusKeySvg, muteAllKeySvg, openKeySvg, slotKeySvg, toDataUrl, wrap } from "../src/render";

const decode = (url: string) =>
  Buffer.from(url.replace("data:image/svg+xml;base64,", ""), "base64").toString();

describe("slotKeySvg", () => {
  it("shows the matchup, slot badge, and heard highlight", () => {
    const svg = slotKeySvg({
      slot: 1,
      connected: true,
      title: "San Francisco 49ers at Seattle Seahawks",
      heard: true,
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
