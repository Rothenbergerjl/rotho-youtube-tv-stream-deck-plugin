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

  it.each([
    ["invalid JSON", "nope"],
    ["null", "null"],
    ["an unknown type", '{"type":"heartbeat"}'],
    ["solo without a slot", '{"type":"solo"}'],
    ["solo with slot 0", '{"type":"solo","slot":0}'],
    ["solo with a fractional slot", '{"type":"solo","slot":1.5}'],
  ])("rejects %s", (_, raw) => {
    expect(parsePluginMessage(raw)).toBeNull();
  });
});
