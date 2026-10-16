import { describe, expect, it } from "vitest";
import { muteAllKeySvg, slotKeySvg, toDataUrl, wrap } from "../src/render";

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
