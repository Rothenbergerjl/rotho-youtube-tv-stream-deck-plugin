import { FEATURES, PROTOCOL_VERSION } from "@rotho/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { type PluginState, Store } from "../src/store";
import { sampleState } from "./fake-extension";

let store: Store;
let updates: PluginState[];

beforeEach(() => {
  store = new Store();
  updates = [];
  store.subscribe((s) => updates.push(s));
  store.setConnected(true);
});

describe("Store.setProtocol", () => {
  it("leaves the state alone when the protocols match", () => {
    store.setProtocol(PROTOCOL_VERSION);
    expect(store.current).not.toHaveProperty("mismatch");
    expect(updates).toHaveLength(1); // only setConnected
  });

  it.each([
    [PROTOCOL_VERSION + 1, "plugin"],
    [PROTOCOL_VERSION - 1, "extension"],
  ])("extension protocol %i → update the %s", (protocol, side) => {
    store.setProtocol(protocol);
    expect(store.current.mismatch).toBe(side);
  });

  it("keeps the mismatch across state updates", () => {
    store.setProtocol(PROTOCOL_VERSION + 1);
    store.applyState({ ...sampleState, games: [...sampleState.games] });
    expect(store.current.mismatch).toBe("plugin");
    expect(store.current.games).toHaveLength(3);
  });

  it("clears the mismatch when a matching extension says hello", () => {
    store.setProtocol(PROTOCOL_VERSION + 1);
    store.setProtocol(PROTOCOL_VERSION);
    expect(store.current).not.toHaveProperty("mismatch");
  });

  it("clears the mismatch on disconnect", () => {
    store.setProtocol(PROTOCOL_VERSION - 1);
    store.setConnected(false);
    expect(store.current).not.toHaveProperty("mismatch");
  });
});

describe("Store.setFeatures", () => {
  it("starts with no features", () => {
    expect(store.current.features).toEqual([]);
    expect(store.has(FEATURES.focus)).toBe(false);
  });

  it("records the features from hello and keeps them across state updates", () => {
    store.setFeatures([FEATURES.openYouTubeTv, FEATURES.focus]);
    store.applyState({ ...sampleState, games: [...sampleState.games] });
    expect(store.has(FEATURES.openYouTubeTv)).toBe(true);
    expect(store.has(FEATURES.focus)).toBe(true);
  });

  it("treats a hello without features as none", () => {
    store.setFeatures([FEATURES.focus]);
    store.setFeatures(undefined);
    expect(store.current.features).toEqual([]);
  });

  it("only notifies when the features change", () => {
    store.setFeatures([FEATURES.focus, FEATURES.openYouTubeTv]);
    store.setFeatures([FEATURES.openYouTubeTv, FEATURES.focus]);
    expect(updates).toHaveLength(2); // setConnected + first setFeatures
  });

  it("clears the features on disconnect", () => {
    store.setFeatures([FEATURES.focus]);
    store.setConnected(false);
    expect(store.current.features).toEqual([]);
  });
});

describe("Store services", () => {
  it("treats a state without services as only YouTube TV", () => {
    store.applyState({ ...sampleState, games: [...sampleState.games] });
    expect(store.current.services).toEqual(["youtubeTv"]);
    expect(store.isEnabled("youtubeTv")).toBe(true);
    expect(store.isEnabled("peacock")).toBe(false);
  });

  it("keeps the services the extension sends", () => {
    store.applyState({
      ...sampleState,
      games: [...sampleState.games],
      services: ["youtubeTv", "paramountPlus"],
    });
    expect(store.isEnabled("paramountPlus")).toBe(true);
    expect(store.isEnabled("peacock")).toBe(false);
  });

  it("resets to only YouTube TV on disconnect", () => {
    store.applyState({ ...sampleState, games: [], services: ["youtubeTv", "peacock"] });
    store.setConnected(false);
    expect(store.current.services).toEqual(["youtubeTv"]);
  });

  it("keeps each game's service", () => {
    store.applyState({
      type: "state",
      games: [{ slot: 1, tabId: 1, title: "A", heard: false, service: "peacock" }],
      allMuted: true,
    });
    expect(store.gameInSlot(1)?.service).toBe("peacock");
  });
});

describe("Store.setUpdate", () => {
  const update = { version: "0.3.0", url: "https://example.test/v0.3.0" };

  it("keeps the update across state, disconnect and reconnect", () => {
    store.setUpdate(update);
    store.applyState({ ...sampleState, games: [...sampleState.games] });
    expect(store.current.update).toEqual(update);
    store.setConnected(false);
    expect(store.current.update).toEqual(update);
    store.setConnected(true);
    expect(store.current.update).toEqual(update);
  });

  it("only notifies when the version changes, and clears", () => {
    store.setUpdate(update);
    store.setUpdate({ ...update });
    expect(updates).toHaveLength(2); // setConnected + first setUpdate
    store.setUpdate(undefined);
    expect(store.current).not.toHaveProperty("update");
  });
});
