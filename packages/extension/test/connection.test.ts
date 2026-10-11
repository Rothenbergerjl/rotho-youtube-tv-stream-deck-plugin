import type { PluginMessage } from "@rotho/shared";
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { PluginConnection, type SocketLike } from "../src/connection";

class FakeSocket implements SocketLike {
  readyState = 0;
  sent: string[] = [];
  onopen: SocketLike["onopen"] = null;
  onclose: SocketLike["onclose"] = null;
  onerror: SocketLike["onerror"] = null;
  onmessage: SocketLike["onmessage"] = null;

  constructor(readonly url: string) {}

  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.fail();
  }
  open() {
    this.readyState = 1;
    this.onopen?.({});
  }
  fail() {
    this.readyState = 3;
    this.onerror?.({});
    this.onclose?.({});
  }
  receive(data: unknown) {
    this.onmessage?.({ data });
  }
}

let sockets: FakeSocket[];
let onOpen: Mock<() => void>;
let messages: PluginMessage[];
let conn: PluginConnection;

const latest = () => sockets[sockets.length - 1]!;

beforeEach(() => {
  vi.useFakeTimers();
  sockets = [];
  messages = [];
  onOpen = vi.fn<() => void>();
  conn = new PluginConnection({
    url: "ws://127.0.0.1:47731",
    onOpen,
    onMessage: (m) => messages.push(m),
    createSocket: (url) => {
      const s = new FakeSocket(url);
      sockets.push(s);
      return s;
    },
  });
});

afterEach(() => {
  conn.stop();
  vi.useRealTimers();
});

describe("PluginConnection", () => {
  it("connects on start and calls onOpen once open", () => {
    conn.start();
    expect(sockets).toHaveLength(1);
    expect(latest().url).toBe("ws://127.0.0.1:47731");
    expect(conn.connected).toBe(false);

    latest().open();
    expect(conn.connected).toBe(true);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("sends JSON only while connected", () => {
    conn.start();
    expect(conn.send({ type: "heartbeat" })).toBe(false);
    latest().open();
    expect(conn.send({ type: "heartbeat" })).toBe(true);
    expect(latest().sent).toEqual(['{"type":"heartbeat"}']);
  });

  it("sends a heartbeat every 20 seconds while open", () => {
    conn.start();
    latest().open();
    vi.advanceTimersByTime(60_000);
    expect(latest().sent).toEqual(Array(3).fill('{"type":"heartbeat"}'));
  });

  it("stops the heartbeat when the socket closes", () => {
    conn.start();
    const first = latest();
    first.open();
    first.fail();
    vi.advanceTimersByTime(20_000);
    expect(first.sent).toEqual([]);
  });

  it("reconnects with exponential backoff capped at 30 seconds", () => {
    conn.start();
    const delays: number[] = [];
    for (let i = 0; i < 7; i++) {
      const count = sockets.length;
      latest().fail();
      let waited = 0;
      while (sockets.length === count) {
        vi.advanceTimersByTime(1_000);
        waited += 1_000;
      }
      delays.push(waited);
    }
    expect(delays).toEqual([1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000]);
  });

  it("resets the backoff after a successful connection", () => {
    conn.start();
    latest().fail();
    vi.advanceTimersByTime(1_000);
    latest().fail();
    vi.advanceTimersByTime(2_000);
    latest().open();
    latest().fail();

    const count = sockets.length;
    vi.advanceTimersByTime(1_000);
    expect(sockets.length).toBe(count + 1);
  });

  it("retries if creating the socket throws", () => {
    let attempts = 0;
    const throwing = new PluginConnection({
      url: "ws://127.0.0.1:47731",
      onOpen,
      onMessage: () => {},
      createSocket: () => {
        attempts++;
        throw new Error("boom");
      },
    });
    throwing.start();
    vi.advanceTimersByTime(1_000);
    expect(attempts).toBe(2);
    throwing.stop();
  });

  it("dispatches valid plugin messages and drops malformed ones", () => {
    conn.start();
    latest().open();
    latest().receive('{"type":"solo","slot":2}');
    latest().receive('{"type":"solo","slot":99}');
    latest().receive("garbage");
    latest().receive(new ArrayBuffer(4));
    latest().receive('{"type":"toggleMuteAll"}');
    expect(messages).toEqual([{ type: "solo", slot: 2 }, { type: "toggleMuteAll" }]);
  });

  it("ensureConnected does nothing while connected or waiting to reconnect", () => {
    conn.start();
    conn.ensureConnected();
    expect(sockets).toHaveLength(1);

    latest().fail();
    conn.ensureConnected();
    expect(sockets).toHaveLength(1);
  });

  it("stop closes the socket and prevents reconnects", () => {
    conn.start();
    latest().open();
    conn.stop();
    vi.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(1);
    expect(conn.connected).toBe(false);
  });
});
