import { PROTOCOL_VERSION } from "@rotho/shared";
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
