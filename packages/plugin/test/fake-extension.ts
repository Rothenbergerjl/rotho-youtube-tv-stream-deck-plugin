// Stands in for the Chrome extension: connects with the extension's Origin, sends hello + a
// scripted state, and records the commands the plugin sends back.
// Run against the real plugin with `pnpm --filter @rotho/plugin fake-extension`.
import { pathToFileURL } from "node:url";
import { WebSocket } from "ws";
import {
  EXTENSION_ORIGIN,
  FEATURES,
  PROTOCOL_VERSION,
  WS_PORT,
} from "../../shared/src/constants.ts";

export const sampleState = {
  type: "state",
  games: [
    { slot: 1, tabId: 101, title: "San Francisco 49ers at Seattle Seahawks", heard: true },
    {
      slot: 2,
      tabId: 102,
      title: "Monday Night Football with Peyton and Eli: Buffalo Bills at Los Angeles Rams",
      heard: false,
    },
    { slot: 4, tabId: 104, title: "NFL GameDay Live", heard: false },
  ],
  allMuted: false,
  lastHeardTabId: 101,
} as const;

export interface FakeExtension {
  socket: WebSocket;
  /** Commands received from the plugin, parsed. */
  commands: unknown[];
  send(message: unknown): void;
  close(): Promise<void>;
}

export function connectFakeExtension(
  options: {
    port?: number;
    origin?: string;
    state?: unknown;
    protocolVersion?: number;
    /** Sent in hello; undefined leaves the field out, like an extension older than 0.3.0. */
    features?: string[];
  } = {},
): Promise<FakeExtension> {
  const {
    port = WS_PORT,
    origin = EXTENSION_ORIGIN,
    state = sampleState,
    protocolVersion = PROTOCOL_VERSION,
  } = options;
  const features = "features" in options ? options.features : Object.values(FEATURES);
  const socket = new WebSocket(`ws://127.0.0.1:${port}`, { origin });
  const commands: unknown[] = [];
  const send = (message: unknown) => socket.send(JSON.stringify(message));

  socket.on("message", (data) => commands.push(JSON.parse(data.toString())));

  return new Promise((resolve, reject) => {
    socket.once("error", reject);
    socket.once("unexpected-response", (_req, res) =>
      reject(new Error(`Server refused connection: HTTP ${res.statusCode}`)),
    );
    socket.once("open", () => {
      send({ type: "hello", protocolVersion, extensionVersion: "fake", features });
      send(state);
      resolve({
        socket,
        commands,
        send,
        close: () =>
          new Promise((done) => {
            if (socket.readyState === WebSocket.CLOSED) return done();
            socket.once("close", () => done());
            socket.close();
          }),
      });
    });
  });
}

// Script mode: connect to the running plugin and log commands until Ctrl+C.
// `--protocol <n>` sends a different protocol version to show the mismatch keys.
// `--no-features` leaves features out of hello, like an extension older than 0.3.0.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const flag = process.argv.indexOf("--protocol");
  const protocolVersion = flag === -1 ? PROTOCOL_VERSION : Number(process.argv[flag + 1]);
  const noFeatures = process.argv.includes("--no-features");
  const fake = await connectFakeExtension({
    protocolVersion,
    ...(noFeatures && { features: undefined }),
  });
  console.log(
    `Connected to ws://127.0.0.1:${WS_PORT}; sent hello (protocol ${protocolVersion}${noFeatures ? ", no features" : ""}) + state. Press keys on the Stream Deck.`,
  );
  fake.socket.on("message", (data) => console.log("command:", data.toString()));
  setInterval(() => fake.send({ type: "heartbeat" }), 20_000);
  fake.socket.on("close", () => {
    console.log("Plugin closed the connection.");
    process.exit(0);
  });
}
