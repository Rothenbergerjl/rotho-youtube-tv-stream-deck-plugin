// Localhost WebSocket server the Chrome extension connects to. Only the extension's own origin
// is accepted, and only one client is kept (the newest connection wins).
import type { AddressInfo } from "node:net";
import { type ExtensionMessage, parseExtensionMessage, type PluginMessage } from "@rotho/shared";
import { WebSocket, WebSocketServer } from "ws";

export interface ServerLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export interface ServerOptions {
  /** Use 0 to pick a free port (tests). */
  port: number;
  allowedOrigin: string;
  host?: string;
  /** Drop a client that sends nothing for this long (it heartbeats every 20s). */
  idleTimeoutMs?: number;
  /** Delay before retrying when the port is busy. */
  retryMs?: number;
  logger?: ServerLogger;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onMessage?: (message: ExtensionMessage) => void;
}

/** Close code sent to a client that a newer connection replaced. */
export const REPLACED_CLOSE_CODE = 4000;

const silent: ServerLogger = { info() {}, warn() {}, error() {} };

export class ExtensionServer {
  private wss: WebSocketServer | null = null;
  private client: WebSocket | null = null;
  private lastSeen = 0;
  private idleTimer: ReturnType<typeof setInterval> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = true;
  private readonly logger: ServerLogger;

  constructor(private readonly options: ServerOptions) {
    this.logger = options.logger ?? silent;
  }

  get connected(): boolean {
    return this.client?.readyState === WebSocket.OPEN;
  }

  /** The bound port, once listening. */
  get port(): number | undefined {
    return (this.wss?.address() as AddressInfo | null)?.port;
  }

  /** Starts listening; resolves once bound. If the port is busy, keeps retrying in the background. */
  start(): Promise<void> {
    this.stopped = false;
    return new Promise((resolve) => this.listen(resolve));
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (this.idleTimer) clearInterval(this.idleTimer);
    this.retryTimer = this.idleTimer = null;
    this.client?.terminate();
    this.client = null;
    const wss = this.wss;
    this.wss = null;
    if (wss) await new Promise<void>((resolve) => wss.close(() => resolve()));
  }

  /** Sends to the connected extension; returns false if none is connected. */
  send(message: PluginMessage): boolean {
    if (!this.connected) return false;
    this.client!.send(JSON.stringify(message));
    return true;
  }

  private listen(onListening: () => void): void {
    const { port, host = "127.0.0.1", allowedOrigin } = this.options;
    const wss = new WebSocketServer({
      host,
      port,
      verifyClient: (info: { origin: string }) => {
        const ok = info.origin === allowedOrigin;
        if (!ok) this.logger.warn(`Rejected connection from origin ${JSON.stringify(info.origin)}`);
        return ok;
      },
    });

    wss.on("listening", () => {
      this.wss = wss;
      this.logger.info(`Listening on ${host}:${this.port}`);
      this.startIdleCheck();
      onListening();
    });

    wss.on("error", (err: NodeJS.ErrnoException) => {
      this.logger.error(`Server error: ${err.code ?? err.message}`);
      wss.close();
      if (this.stopped) return;
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        this.listen(onListening);
      }, this.options.retryMs ?? 5_000);
    });

    wss.on("connection", (socket) => this.accept(socket));
  }

  private accept(socket: WebSocket): void {
    const previous = this.client;
    this.client = socket;
    this.lastSeen = Date.now();
    if (previous) {
      this.logger.info("New extension connection; replacing the old one");
      previous.close(REPLACED_CLOSE_CODE, "replaced");
    } else {
      this.logger.info("Extension connected");
      this.options.onConnected?.();
    }

    socket.on("message", (data, isBinary) => {
      if (this.client !== socket) return;
      this.lastSeen = Date.now();
      if (isBinary) return;
      const message = parseExtensionMessage(data.toString());
      if (message) this.options.onMessage?.(message);
      else this.logger.warn("Ignored malformed message from extension");
    });

    socket.on("close", () => {
      if (this.client !== socket) return;
      this.client = null;
      this.logger.info("Extension disconnected");
      this.options.onDisconnected?.();
    });

    socket.on("error", (err) => this.logger.warn(`Socket error: ${err.message}`));
  }

  private startIdleCheck(): void {
    const timeout = this.options.idleTimeoutMs ?? 60_000;
    if (this.idleTimer) clearInterval(this.idleTimer);
    this.idleTimer = setInterval(
      () => {
        if (this.client && Date.now() - this.lastSeen > timeout) {
          this.logger.warn("Extension went quiet; dropping the connection");
          this.client.terminate();
        }
      },
      Math.min(timeout, 15_000),
    );
    this.idleTimer.unref?.();
  }
}
