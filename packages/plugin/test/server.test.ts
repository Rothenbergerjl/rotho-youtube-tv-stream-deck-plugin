import { EXTENSION_ORIGIN, type ExtensionMessage, PROTOCOL_VERSION } from "@rotho/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ExtensionServer, REPLACED_CLOSE_CODE } from "../src/server";
import { Store } from "../src/store";
import { connectFakeExtension, type FakeExtension, sampleState } from "./fake-extension";

let server: ExtensionServer;
let store: Store;
let received: ExtensionMessage[];
const fakes: FakeExtension[] = [];

/** Polls until `check` passes (server events arrive asynchronously). */
async function eventually(check: () => void, timeoutMs = 2_000): Promise<void> {
  const start = Date.now();
  for (;;) {
    try {
      check();
      return;
    } catch (err) {
      if (Date.now() - start > timeoutMs) throw err;
      await new Promise((r) => setTimeout(r, 10));
    }
  }
}

async function connect(
  options: { origin?: string; state?: unknown; protocolVersion?: number } = {},
) {
  const fake = await connectFakeExtension({ port: server.port!, ...options });
  fakes.push(fake);
  return fake;
}

beforeEach(async () => {
  store = new Store();
  received = [];
  server = new ExtensionServer({
    port: 0,
    allowedOrigin: EXTENSION_ORIGIN,
    onConnected: () => store.setConnected(true),
    onDisconnected: () => store.setConnected(false),
    onMessage: (m) => {
      received.push(m);
      if (m.type === "hello") store.setProtocol(m.protocolVersion);
      if (m.type === "state") store.applyState(m);
    },
  });
  await server.start();
});

afterEach(async () => {
  await Promise.all(fakes.splice(0).map((f) => f.close()));
  await server.stop();
});

describe("ExtensionServer + Store (integration)", () => {
  it("accepts the extension origin and reflects its state in the store", async () => {
    await connect();
    await eventually(() => expect(store.current.games).toHaveLength(3));

    expect(server.connected).toBe(true);
    expect(received.map((m) => m.type)).toEqual(["hello", "state"]);
    expect(store.current).toEqual({
      connected: true,
      games: sampleState.games,
      allMuted: false,
      canRestore: true,
    });
    expect(store.gameInSlot(2)?.tabId).toBe(102);
    expect(store.gameInSlot(3)).toBeUndefined();
  });

  it("flags a newer extension protocol as a plugin update", async () => {
    await connect({ protocolVersion: PROTOCOL_VERSION + 1 });
    await eventually(() => expect(store.current.games).toHaveLength(3));
    expect(store.current.mismatch).toBe("plugin");
  });

  it("refuses any other origin", async () => {
    await expect(connect({ origin: "http://evil.example" })).rejects.toThrow(/401|refused/i);
    await expect(connect({ origin: "" })).rejects.toThrow();
    expect(server.connected).toBe(false);
    expect(store.current.connected).toBe(false);
  });

  it("sends commands to the extension", async () => {
    const fake = await connect();
    await eventually(() => expect(server.connected).toBe(true));

    expect(server.send({ type: "solo", slot: 2 })).toBe(true);
    expect(server.send({ type: "toggleMuteAll" })).toBe(true);
    await eventually(() =>
      expect(fake.commands).toEqual([{ type: "solo", slot: 2 }, { type: "toggleMuteAll" }]),
    );
  });

  it("returns false from send when nothing is connected", () => {
    expect(server.send({ type: "requestState" })).toBe(false);
  });

  it("ignores malformed messages", async () => {
    const fake = await connect();
    await eventually(() => expect(received).toHaveLength(2));
    fake.socket.send("not json");
    fake.send({ type: "state", games: "nope", allMuted: true });
    fake.send({ type: "heartbeat" });
    await eventually(() => expect(received.at(-1)).toEqual({ type: "heartbeat" }));
    expect(received).toHaveLength(3);
  });

  it("keeps only the newest connection", async () => {
    const first = await connect();
    const closed = new Promise<number>((r) => first.socket.once("close", (code) => r(code)));
    const second = await connect({ state: { ...sampleState, games: [] } });

    expect(await closed).toBe(REPLACED_CLOSE_CODE);
    await eventually(() => expect(store.current.games).toEqual([]));
    expect(server.connected).toBe(true);
    expect(store.current.connected).toBe(true);

    server.send({ type: "requestState" });
    await eventually(() => expect(second.commands).toEqual([{ type: "requestState" }]));
  });

  it("marks the store disconnected when the extension goes away", async () => {
    const fake = await connect();
    await eventually(() => expect(store.current.games).toHaveLength(3));
    await fake.close();
    await eventually(() => expect(store.current.connected).toBe(false));
    expect(store.current.games).toEqual([]);
  });

  it("drops a client that stops sending", async () => {
    await server.stop();
    server = new ExtensionServer({
      port: 0,
      allowedOrigin: EXTENSION_ORIGIN,
      idleTimeoutMs: 100,
      onDisconnected: () => store.setConnected(false),
      onConnected: () => store.setConnected(true),
    });
    await server.start();
    await connect();
    await eventually(() => expect(store.current.connected).toBe(true));
    await eventually(() => expect(store.current.connected).toBe(false), 1_000);
  });
});
