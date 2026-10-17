import { describe, expect, it } from "vitest";
import { cleanTabTitle, isServiceId, SERVICE_IDS, SERVICES, serviceForUrl } from ".";

describe("SERVICES", () => {
  it("has one entry per id, keyed by its own id", () => {
    expect(Object.keys(SERVICES)).toEqual([...SERVICE_IDS]);
    for (const id of SERVICE_IDS) expect(SERVICES[id].id).toBe(id);
  });

  it("uses https home pages on each service's host", () => {
    for (const id of SERVICE_IDS) {
      expect(SERVICES[id].homeUrl).toBe(`https://${SERVICES[id].host}`);
    }
  });

  it("gives every badge a short monogram and hex colors", () => {
    for (const id of SERVICE_IDS) {
      const { monogram, color, text } = SERVICES[id].badge;
      expect(monogram.length).toBeGreaterThan(0);
      expect(monogram.length).toBeLessThanOrEqual(2);
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
      expect(text).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe("isServiceId", () => {
  it("accepts known ids only", () => {
    expect(isServiceId("peacock")).toBe(true);
    expect(isServiceId("espn")).toBe(false);
    expect(isServiceId(1)).toBe(false);
    expect(isServiceId(undefined)).toBe(false);
  });
});

describe("serviceForUrl", () => {
  it.each([
    ["https://tv.youtube.com/watch/abc", "youtubeTv", "content"],
    ["https://tv.youtube.com/", "youtubeTv", "content"],
    ["https://www.peacocktv.com/watch/playback/event/GMO_00000000000000001", "peacock", "tab"],
    ["https://www.peacocktv.com/watch/playback/clip/abc?x=1", "peacock", "tab"],
    ["https://www.paramountplus.com/live-tv/stream/cbs-sports-golazo", "paramountPlus", "content"],
    ["https://www.paramountplus.com/shows/video/abc123/", "paramountPlus", "tab"],
    ["https://www.paramountplus.com/movies/video/abc123/", "paramountPlus", "tab"],
  ] as const)("matches %s", (url, service, titleSource) => {
    expect(serviceForUrl(url)).toEqual({ service, titleSource });
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["not a URL", "nope"],
    ["Peacock home", "https://www.peacocktv.com/"],
    ["Peacock browse", "https://www.peacocktv.com/watch/home"],
    ["Paramount+ home", "https://www.paramountplus.com/"],
    ["Paramount+ live guide", "https://www.paramountplus.com/live-tv/"],
    ["Paramount+ show page", "https://www.paramountplus.com/shows/survivor/"],
    ["http YouTube TV", "http://tv.youtube.com/watch/abc"],
    ["http Peacock player", "http://www.peacocktv.com/watch/playback/event/x"],
    ["look-alike suffix host", "https://www.peacocktv.com.evil.example/watch/playback/event/x"],
    ["look-alike prefix host", "https://evilwww.paramountplus.com/shows/video/x"],
    ["bare host without www", "https://peacocktv.com/watch/playback/event/x"],
    ["regular YouTube", "https://www.youtube.com/watch?v=x"],
    ["prefix in the query only", "https://www.peacocktv.com/?next=/watch/playback/event/x"],
  ])("ignores %s", (_, url) => {
    expect(serviceForUrl(url)).toBeUndefined();
  });
});

describe("cleanTabTitle", () => {
  it("strips the Peacock suffix", () => {
    expect(cleanTabTitle("peacock", "Chiefs vs. Bills - Peacock")).toBe("Chiefs vs. Bills");
    expect(cleanTabTitle("peacock", "Peacock Sunday - Peacock")).toBe("Peacock Sunday");
  });

  it("strips the Paramount+ prefix and suffix", () => {
    expect(cleanTabTitle("paramountPlus", "Watch Survivor Season 47 - Paramount+")).toBe(
      "Survivor Season 47",
    );
    expect(cleanTabTitle("paramountPlus", "Watch Me - Paramount+")).toBe("Me");
  });

  it("leaves titles without branding alone, apart from trimming", () => {
    expect(cleanTabTitle("peacock", "  Chiefs vs. Bills ")).toBe("Chiefs vs. Bills");
    expect(cleanTabTitle("paramountPlus", "Watchmen")).toBe("Watchmen");
    expect(cleanTabTitle("youtubeTv", "Chiefs at Bills - YouTube TV")).toBe(
      "Chiefs at Bills - YouTube TV",
    );
  });
});
