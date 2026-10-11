import { describe, expect, it } from "vitest";
import { extractPageTitle, isPageTitleMessage, TITLE_SELECTORS } from "../src/page-title";

/** Minimal stand-in for a document: maps selectors to element text. */
const page = (texts: Partial<Record<(typeof TITLE_SELECTORS)[number], string>>) => ({
  querySelector: (selector: string) =>
    selector in texts ? ({ textContent: texts[selector as keyof typeof texts] } as Element) : null,
});

describe("extractPageTitle", () => {
  it("prefers the player title", () => {
    const root = page({
      "h1.ypc-video-title .ypc-video-title-text": "San Francisco 49ers at Seattle Seahawks",
      "ytu-mini-player-info .ymp-primary-text": "Something else",
    });
    expect(extractPageTitle(root, "FOX 59")).toBe("San Francisco 49ers at Seattle Seahawks");
  });

  it("falls back to the h1, then the mini player", () => {
    expect(extractPageTitle(page({ "h1.ypc-video-title": " A  at\nB " }))).toBe("A at B");
    expect(extractPageTitle(page({ "ytu-mini-player-info .ymp-primary-text": "Mini" }))).toBe(
      "Mini",
    );
  });

  it("skips empty elements", () => {
    const root = page({
      "h1.ypc-video-title .ypc-video-title-text": "   ",
      "ytu-mini-player-info .ymp-primary-text": "Mini",
    });
    expect(extractPageTitle(root)).toBe("Mini");
  });

  it("falls back to the Media Session title (channel name), then empty", () => {
    expect(extractPageTitle(page({}), " FOX 59 ")).toBe("FOX 59");
    expect(extractPageTitle(page({}), null)).toBe("");
    expect(extractPageTitle(page({}))).toBe("");
  });
});

describe("isPageTitleMessage", () => {
  it("accepts only pageTitle messages with a string title", () => {
    expect(isPageTitleMessage({ type: "pageTitle", title: "x" })).toBe(true);
    expect(isPageTitleMessage({ type: "pageTitle", title: 1 })).toBe(false);
    expect(isPageTitleMessage({ type: "other", title: "x" })).toBe(false);
    expect(isPageTitleMessage(null)).toBe(false);
  });
});
