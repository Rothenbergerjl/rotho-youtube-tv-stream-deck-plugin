import { afterEach, describe, expect, it, vi } from "vitest";
import {
  compareVersions,
  LATEST_RELEASE_URL,
  parseVersion,
  UpdateChecker,
  type UpdateInfo,
} from "../src/updates";

const releaseUrl =
  "https://github.com/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin/releases/tag/v0.3.0";

function respond(body: unknown, status = 200): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }));
}

/** Runs one check and returns what was reported (or "none" when nothing was). */
async function check(currentVersion: string, fetchImpl: typeof fetch) {
  const results: (UpdateInfo | undefined)[] = [];
  const checker = new UpdateChecker({
    currentVersion,
    fetch: fetchImpl,
    onResult: (u) => results.push(u),
  });
  await checker.check();
  return results.length === 0 ? "none" : results[0];
}

afterEach(() => {
  vi.useRealTimers();
});

describe("parseVersion / compareVersions", () => {
  it.each([
    ["0.2.0", [0, 2, 0]],
    ["v1.10.3", [1, 10, 3]],
    [" v0.0.1 ", [0, 0, 1]],
  ])("parses %j", (input, expected) => {
    expect(parseVersion(input)).toEqual(expected);
  });

  it.each(["v0.3.0-beta.1", "0.3", "latest", ""])("rejects %j", (input) => {
    expect(parseVersion(input)).toBeNull();
  });

  it.each([
    ["0.10.0", "0.9.0", 1],
    ["1.0.0", "0.99.99", 1],
    ["0.2.0", "0.2.0", 0],
    ["0.2.0", "0.2.1", -1],
  ])("%s vs %s → sign %i", (a, b, sign) => {
    expect(Math.sign(compareVersions(parseVersion(a)!, parseVersion(b)!))).toBe(sign);
  });
});

describe("UpdateChecker", () => {
  it("reports a newer release with its page", async () => {
    const fetchImpl = respond({ tag_name: "v0.3.0", html_url: releaseUrl });
    expect(await check("0.2.0", fetchImpl)).toEqual({ version: "0.3.0", url: releaseUrl });
    expect(fetchImpl).toHaveBeenCalledWith(
      LATEST_RELEASE_URL,
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: "application/vnd.github+json" }),
      }),
    );
  });

  it.each(["v0.2.0", "v0.1.9"])("reports up to date when the latest is %s", async (tag) => {
    expect(await check("0.2.0", respond({ tag_name: tag, html_url: releaseUrl }))).toBeUndefined();
  });

  it.each([
    ["a 404", respond({ message: "Not Found" }, 404)],
    ["bad JSON", vi.fn(async () => new Response("<html>"))],
    ["a prerelease tag", respond({ tag_name: "v0.3.0-rc.1", html_url: releaseUrl })],
    ["a missing html_url", respond({ tag_name: "v0.3.0" })],
    [
      "a network error",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    ],
  ])("reports nothing and doesn't throw on %s", async (_name, fetchImpl) => {
    expect(await check("0.2.0", fetchImpl as typeof fetch)).toBe("none");
  });

  it("checks on start and again every interval", async () => {
    vi.useFakeTimers();
    const fetchImpl = respond({ tag_name: "v0.3.0", html_url: releaseUrl });
    const checker = new UpdateChecker({
      currentVersion: "0.2.0",
      fetch: fetchImpl,
      intervalMs: 1_000,
      onResult: () => {},
    });
    checker.start();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2_500);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    checker.stop();
    await vi.advanceTimersByTimeAsync(5_000);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});
