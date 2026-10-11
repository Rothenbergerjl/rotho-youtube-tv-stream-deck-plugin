// WebSocket client that keeps a connection to the Stream Deck plugin open.
import { type ExtensionMessage, type PluginMessage, parsePluginMessage } from "@rotho/shared";

/** The subset of the browser WebSocket API this module uses (lets tests inject a fake). */
export interface SocketLike {
  readonly readyState: number;
  onopen: ((ev: unknown) => void) | null;
  onclose: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
  send(data: string): void;
  close(): void;
}

export interface ConnectionOptions {
  url: string;
  /** Called after each successful connect; use it to send hello + state. */
  onOpen: () => void;
  /** Called for every valid message from the plugin. Malformed messages are dropped. */
  onMessage: (message: PluginMessage) => void;
  createSocket?: (url: string) => SocketLike;
  heartbeatMs?: number;
  minBackoffMs?: number;
  maxBackoffMs?: number;
}

const OPEN = 1;

export class PluginConnection {
  private socket: SocketLike | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private backoffMs: number;
  private stopped = true;

  private readonly createSocket: (url: string) => SocketLike;
  private readonly heartbeatMs: number;
  private readonly minBackoffMs: number;
  private readonly maxBackoffMs: number;

  constructor(private readonly options: ConnectionOptions) {
    // The DOM WebSocket matches SocketLike at runtime; its handler types are just narrower.
    this.createSocket =
      options.createSocket ?? ((url) => new WebSocket(url) as unknown as SocketLike);
    this.heartbeatMs = options.heartbeatMs ?? 20_000;
    this.minBackoffMs = options.minBackoffMs ?? 1_000;
    this.maxBackoffMs = options.maxBackoffMs ?? 30_000;
    this.backoffMs = this.minBackoffMs;
  }

  get connected(): boolean {
    return this.socket?.readyState === OPEN;
  }

  start(): void {
    this.stopped = false;
    this.ensureConnected();
  }

  stop(): void {
    this.stopped = true;
    this.clearTimers();
    const socket = this.socket;
    this.socket = null;
    socket?.close();
  }

  /** Connects now unless a socket exists or a reconnect is already scheduled. */
  ensureConnected(): void {
    if (this.stopped || this.socket || this.reconnectTimer) return;
    this.connect();
  }

  /** Sends a message if connected; returns false (and drops it) otherwise. */
  send(message: ExtensionMessage): boolean {
    if (!this.connected) return false;
    this.socket!.send(JSON.stringify(message));
    return true;
  }

  private connect(): void {
    let socket: SocketLike;
    try {
      socket = this.createSocket(this.options.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;

    socket.onopen = () => {
      this.backoffMs = this.minBackoffMs;
      this.heartbeatTimer = setInterval(() => this.send({ type: "heartbeat" }), this.heartbeatMs);
      this.options.onOpen();
    };
    socket.onmessage = (ev) => {
      if (typeof ev.data !== "string") return;
      const message = parsePluginMessage(ev.data);
      if (message) this.options.onMessage(message);
    };
    socket.onerror = () => {
      // A close event always follows; reconnection happens there.
    };
    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.clearHeartbeat();
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer) return;
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 2, this.maxBackoffMs);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.ensureConnected();
    }, delay);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  private clearTimers(): void {
    this.clearHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }
}
