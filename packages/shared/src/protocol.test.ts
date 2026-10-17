import { describe, expect, it } from "vitest";
import { parseExtensionMessage, parsePluginMessage } from ".";

const game = { slot: 1, tabId: 10, title: "Chiefs at Bills", heard: true };

describe("parseExtensionMessage", () => {
  it("accepts hello, state, and heartbeat", () => {
    expect(
      parseExtensionMessage('{"type":"hello","protocolVersion":1,"extensionVersion":"0.1.0"}'),
    ).toEqual({ type: "hello", protocolVersion: 1, extensionVersion: "0.1.0" });
    expect(
      parseExtensionMessage(
        JSON.stringify({ type: "state", games: [game], allMuted: false, lastHeardTabId: 10 }),
      ),
    ).toEqual({ type: "state", games: [game], allMuted: false, lastHeardTabId: 10 });
    expect(parseExtensionMessage('{"type":"heartbeat"}')).toEqual({ type: "heartbeat" });
  });

  it("accepts hello with features and keeps only known names", () => {
    expect(
      parseExtensionMessage(
        JSON.stringify({
          type: "hello",
          protocolVersion: 1,
          extensionVersion: "0.3.0",
          features: ["openYouTubeTv", "focus", "fromTheFuture"],
        }),
      ),
    ).toEqual({
      type: "hello",
      protocolVersion: 1,
      extensionVersion: "0.3.0",
      features: ["openYouTubeTv", "focus"],
    });
  });

  it("leaves features off a hello from an older extension", () => {
    expect(
      parseExtensionMessage('{"type":"hello","protocolVersion":1,"extensionVersion":"0.2.0"}'),
    ).not.toHaveProperty("features");
  });

  it("drops unknown fields", () => {
    const parsed = parseExtensionMessage(
      JSON.stringify({ type: "state", games: [{ ...game, extra: 1 }], allMuted: true, x: 2 }),
    );
    expect(parsed).toEqual({ type: "state", games: [game], allMuted: true });
  });

  it.each([
    ["invalid JSON", "{"],
    ["a non-object", "[1]"],
    ["an unknown type", '{"type":"solo","slot":1}'],
    ["hello without a version", '{"type":"hello","extensionVersion":"0.1.0"}'],
    [
      "hello with non-array features",
      '{"type":"hello","protocolVersion":1,"extensionVersion":"0.3.0","features":"focus"}',
    ],
    [
      "hello with a non-string feature",
      '{"type":"hello","protocolVersion":1,"extensionVersion":"0.3.0","features":[1]}',
    ],
    ["state with a bad game", JSON.stringify({ type: "state", games: [{}], allMuted: true })],
    [
      "state with an out-of-range slot",
      JSON.stringify({ type: "state", games: [{ ...game, slot: 16 }], allMuted: true }),
    ],
    ["state without allMuted", JSON.stringify({ type: "state", games: [] })],
    [
      "state with a non-integer lastHeardTabId",
      JSON.stringify({ type: "state", games: [], allMuted: true, lastHeardTabId: "1" }),
    ],
  ])("rejects %s", (_, raw) => {
    expect(parseExtensionMessage(raw)).toBeNull();
  });
});

describe("parsePluginMessage", () => {
  it("accepts solo, toggleMuteAll, and requestState", () => {
    expect(parsePluginMessage('{"type":"solo","slot":3}')).toEqual({ type: "solo", slot: 3 });
    expect(parsePluginMessage('{"type":"toggleMuteAll"}')).toEqual({ type: "toggleMuteAll" });
    expect(parsePluginMessage('{"type":"requestState"}')).toEqual({ type: "requestState" });
  });

  it("accepts openYouTubeTv and focus", () => {
    expect(parsePluginMessage('{"type":"openYouTubeTv","target":"window"}')).toEqual({
      type: "openYouTubeTv",
      target: "window",
    });
    expect(parsePluginMessage('{"type":"openYouTubeTv","target":"tab"}')).toEqual({
      type: "openYouTubeTv",
      target: "tab",
    });
    expect(parsePluginMessage('{"type":"focus","slot":15}')).toEqual({ type: "focus", slot: 15 });
  });

  it.each([
    ["invalid JSON", "nope"],
    ["null", "null"],
    ["an unknown type", '{"type":"heartbeat"}'],
    ["solo without a slot", '{"type":"solo"}'],
    ["solo with slot 0", '{"type":"solo","slot":0}'],
    ["solo with a fractional slot", '{"type":"solo","slot":1.5}'],
    ["openYouTubeTv without a target", '{"type":"openYouTubeTv"}'],
    ["openYouTubeTv with an unknown target", '{"type":"openYouTubeTv","target":"popup"}'],
    ["focus without a slot", '{"type":"focus"}'],
    ["focus with slot 16", '{"type":"focus","slot":16}'],
  ])("rejects %s", (_, raw) => {
    expect(parsePluginMessage(raw)).toBeNull();
  });
});
