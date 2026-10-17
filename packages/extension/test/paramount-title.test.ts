import { describe, expect, it } from "vitest";
import { CHANNEL_SELECTOR, extractParamountTitle, PROGRAM_SELECTOR } from "../src/paramount-title";

const LIVE = "/live-tv/stream/cbs-sports-golazo";

/** Minimal stand-in for a document: maps selectors to element text. */
const page = (texts: { program?: string; channel?: string }) => ({
  querySelector: (selector: string) => {
    const text =
      selector === PROGRAM_SELECTOR
        ? texts.program
        : selector === CHANNEL_SELECTOR
          ? texts.channel
          : undefined;
    return text === undefined ? null : ({ textContent: text } as Element);
  },
});

describe("extractParamountTitle", () => {
  it("reports the program with the channel as a league hint", () => {
    expect(
      extractParamountTitle(page({ program: "Bologna vs. Inter", channel: "Serie A" }), LIVE),
    ).toBe("Bologna vs. Inter (Serie A)");
  });

  it("collapses whitespace", () => {
    expect(
      extractParamountTitle(page({ program: " Bologna\n vs.  Inter ", channel: " CBS " }), LIVE),
    ).toBe("Bologna vs. Inter (CBS)");
  });

  it("reports just the program or just the channel when only one is shown", () => {
    expect(extractParamountTitle(page({ program: "The Late Show" }), LIVE)).toBe("The Late Show");
    expect(extractParamountTitle(page({ program: "Golazo", channel: "  " }), LIVE)).toBe("Golazo");
    expect(extractParamountTitle(page({ channel: "CBS Sports HQ" }), LIVE)).toBe("CBS Sports HQ");
  });

  it("doesn't repeat a program that is the channel name", () => {
    expect(extractParamountTitle(page({ program: "CBS News", channel: "CBS News" }), LIVE)).toBe(
      "CBS News",
    );
  });

  it("reports empty while the player hasn't shown anything", () => {
    expect(extractParamountTitle(page({}), LIVE)).toBe("");
  });

  it("reports nothing off live player pages", () => {
    const root = page({ program: "Bologna vs. Inter", channel: "Serie A" });
    expect(extractParamountTitle(root, "/live-tv/")).toBeNull();
    expect(extractParamountTitle(root, "/shows/video/abc/")).toBeNull();
  });
});
